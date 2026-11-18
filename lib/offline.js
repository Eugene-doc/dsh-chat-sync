import { execFileSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import {
  cloneRowsWithCwd,
  compareSessionRows,
  decodeRows,
  decodeSession,
  encodeRows,
  isSyncableSession,
  projectKey,
} from './session.js'
import {
  ensureDir,
  errorMessage,
  listFiles,
  readJson,
  sha256,
  writeFileAtomic,
  writeJsonAtomic,
} from './util.js'

/** Recursively list DSH session files below a home directory. */
export async function scanLocalInventory(home) {
  const root = path.join(home, 'sessions')
  const files = (await listFiles(root)).filter(file => path.basename(file) === 'session.v4.jsonl.zstd')
  const byId = new Map()
  for (const file of files) {
    const buffer = await fs.readFile(file)
    let header
    try {
      header = decodeRows(buffer)[0]
    } catch {
      header = null
    }
    const directoryId = path.basename(path.dirname(file))
    if (!/^[A-Za-z0-9._-]+$/.test(directoryId) || directoryId === '.' || directoryId === '..') {
      continue
    }
    const entry = { id: directoryId, file, buffer, header, session: null, error: null }
    try {
      // The directory name is the identity witness. Never trust a header that
      // claims a different id than its own path.
      entry.session = decodeSession(buffer, directoryId)
    } catch (error) {
      entry.error = errorMessage(error)
    }
    const previous = byId.get(directoryId)
    if (previous) {
      previous.duplicate = true
      entry.duplicate = true
    }
    byId.set(directoryId, entry)
  }
  return { files, byId }
}

function git(repo, args, encoding = 'utf8') {
  return execFileSync('git', ['-C', repo, '-c', 'core.longpaths=true', ...args], {
    encoding,
    maxBuffer: 512 * 1024 * 1024,
    windowsHide: true,
  })
}

export function resolveGitSha(repo, branch) {
  return String(git(repo, ['rev-parse', `origin/${branch}`])).trim()
}

export function listRemoteDevices(repo, sha) {
  let output = ''
  try {
    output = String(git(repo, ['ls-tree', '-d', '--name-only', sha, 'devices/']))
  } catch {
    return []
  }
  return output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /^devices\/[A-Za-z0-9._-]+$/.test(line))
    .map(line => line.slice('devices/'.length))
}

function safeRelativePath(value) {
  const normalized = path.posix.normalize(String(value || ''))
  if (!normalized || normalized.startsWith('../') || normalized.startsWith('/') || normalized.includes('/../')) {
    throw new Error('remote session path escapes the repository')
  }
  return normalized
}

export function readRemoteCandidates(repo, sha, deviceIds) {
  const byId = new Map()
  for (const device of deviceIds) {
    let manifest
    try {
      manifest = JSON.parse(String(git(repo, ['show', `${sha}:devices/${device}/manifest.json`])))
    } catch {
      continue
    }
    for (const item of Array.isArray(manifest?.sessions) ? manifest.sessions : []) {
      if (!item || typeof item.id !== 'string' || !item.id) continue
      let relative
      try {
        relative = safeRelativePath(item.file)
      } catch {
        continue
      }
      if (!relative.startsWith('sessions/') || !relative.endsWith('/session.v4.jsonl.zstd')) continue
      let buffer
      try {
        buffer = git(repo, ['show', `${sha}:devices/${device}/${relative}`], null)
      } catch {
        continue
      }
      let session
      try {
        session = decodeSession(buffer, item.id)
        if (!isSyncableSession(session)) continue
        if (typeof item.hash === 'string' && sha256(buffer) !== item.hash) continue
        if (Number.isSafeInteger(Number(item.size)) && Number(item.size) > 0 && buffer.length !== Number(item.size)) {
          // size may be a coarse manifest value; only reject when it is clearly inconsistent
          if (Math.abs(buffer.length - Number(item.size)) > 1024) continue
        }
      } catch {
        continue
      }
      const candidate = {
        device,
        deviceName: manifest?.device?.name || device,
        item,
        buffer,
        session,
      }
      const list = byId.get(item.id) || []
      list.push(candidate)
      byId.set(item.id, list)
    }
  }
  return byId
}

/**
 * Select one remote replacement for a local session.
 * Existing chats only; new sessions are intentionally not created here.
 */
export function chooseRemoteCandidate(local, candidates) {
  if (!local?.session) return { action: 'skip', reason: 'local-invalid' }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { action: 'skip', reason: 'no-remote' }
  }

  const classified = candidates.map(candidate => ({
    candidate,
    relation: compareSessionRows(local.session.rows, candidate.session.rows),
  }))

  // Any competing branch makes the choice unsafe, even when another remote
  // candidate happens to equal the local log.
  if (classified.some(item => item.relation === 'diverged')) {
    return { action: 'conflict', reason: 'diverged' }
  }

  let best = null
  for (const item of classified) {
    // A remote shorter than local (or equal to it) cannot improve local; it
    // still belongs to the same chain when best is longer.
    if (item.relation === 'remote-prefix') continue
    if (best === null) {
      best = item
      continue
    }
    const relation = compareSessionRows(best.candidate.session.rows, item.candidate.session.rows)
    if (relation === 'local-prefix') best = item
    else if (relation !== 'remote-prefix' && relation !== 'equal') {
      return { action: 'conflict', reason: 'remote-branches' }
    }
  }

  if (best === null) return { action: 'keep-local', reason: 'local-ahead' }
  if (best.relation === 'equal') return { action: 'noop', reason: 'equal' }
  return { action: 'replace', candidate: best.candidate }
}

export function projectionCachePath(home, id) {
  return path.join(home, 'storages', 'session_projcache', 'sessions', `${id}.json`)
}

/**
 * Replace one existing session with a validated remote log. The caller owns the
 * journal; this function only writes the session file and removes its cache.
 */
export async function applyReplacement({ home, local, candidate, journalDir, dryRun = false }) {
  if (!local?.session) throw new Error('local session is not valid')
  if (!candidate?.session) throw new Error('remote session is not valid')
  const id = local.id
  const sameCwd = candidate.session.workspacePath === local.session.workspacePath
  const rows = sameCwd
    ? candidate.session.rows
    : cloneRowsWithCwd(candidate.session.rows, local.session.workspacePath)
  const buffer = sameCwd ? candidate.buffer : encodeRows(rows)
  decodeSession(buffer, id)

  if (dryRun) return { changed: true, id, backup: null }

  const backup = path.join(journalDir, 'backups', `${id}.jsonl.zstd`)
  await ensureDir(path.dirname(backup))
  await writeFileAtomic(backup, local.buffer, 0o600)
  const backupCheck = await fs.readFile(backup)
  if (sha256(backupCheck) !== sha256(local.buffer)) {
    throw new Error(`backup verification failed for ${id}`)
  }
  await writeFileAtomic(local.file, buffer, 0o600)
  const written = await fs.readFile(local.file)
  if (sha256(written) !== sha256(buffer)) throw new Error(`verification failed for ${id}`)

  const cache = projectionCachePath(home, id)
  let cacheRemoved = false
  try {
    await fs.rm(cache, { force: true })
    cacheRemoved = true
  } catch {
    cacheRemoved = false
  }
  return {
    changed: true,
    id,
    backup,
    oldHash: sha256(local.buffer),
    newHash: sha256(buffer),
    cacheRemoved,
    bytes: buffer.length,
  }
}

/** Restore a validated backup atomically. */
export async function restoreBackup(file, backup) {
  const bytes = await fs.readFile(backup)
  const expected = sha256(bytes)
  await writeFileAtomic(file, bytes, 0o600)
  const actual = sha256(await fs.readFile(file))
  if (actual !== expected) throw new Error(`backup restore verification failed for ${file}`)
  return actual
}

export async function loadJournal(directory) {
  return readJson(path.join(directory, 'journal.json'), null)
}

export async function saveJournal(directory, journal) {
  await writeJsonAtomic(path.join(directory, 'journal.json'), journal)
}
