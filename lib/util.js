import { execFile } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

/** Run one executable without a shell, returning trimmed stdout. */
export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        timeout: options.timeout ?? 60_000,
        maxBuffer: options.maxBuffer ?? 32 * 1024 * 1024,
        windowsHide: true,
        encoding: 'utf8',
      },
      (error, stdout, stderr) => {
        if (error) {
          const detail = String(stderr || stdout || error.message || '').trim()
          error.output = detail
          reject(error)
          return
        }
        resolve(String(stdout || '').trim())
      },
    )
  })
}

/** Hash bytes with the algorithm used by attachment ids and the manifest. */
export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

export function shortHash(value, length = 8) {
  return String(value || '').slice(0, length)
}

export function createId() {
  return randomUUID()
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

export async function readJson(file, fallback = undefined) {
  try {
    const text = await fs.readFile(file, 'utf8')
    return JSON.parse(text.replace(/^\uFEFF/, ''))
  } catch (error) {
    if (error?.code === 'ENOENT' && fallback !== undefined) return fallback
    throw error
  }
}

export async function writeFileAtomic(file, data, mode = 0o600) {
  await ensureDir(path.dirname(file))
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`
  const handle = await fs.open(temp, 'wx', mode)
  try {
    await handle.writeFile(data)
    await handle.sync()
  } finally {
    await handle.close()
  }
  await fs.rename(temp, file)
}

export async function writeJsonAtomic(file, value, mode = 0o600) {
  await writeFileAtomic(file, JSON.stringify(value, null, 2) + '\n', mode)
}

export async function pathExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

export async function listFiles(root) {
  const result = []
  async function walk(dir) {
    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch (error) {
      if (error?.code === 'ENOENT') return
      throw error
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) await walk(full)
      else if (entry.isFile()) result.push(full)
    }
  }
  await walk(root)
  return result
}

export function formatBytes(bytes) {
  const value = Number(bytes) || 0
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`
}

/**
 * Accept an HTTPS/SSH GitHub remote or a compact `owner/name` string.
 * @returns {{ok: true, remote: string, owner: string, name: string, webUrl: string} | {ok: false, error: string}}
 */
export function parseRemote(input) {
  const raw = String(input || '').trim()
  if (!raw) return { ok: false, error: 'Repository is empty.' }

  let owner
  let name
  let remote
  const compact = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(raw)
  const https = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/i.exec(raw)
  const ssh = /^git@github\.com:([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/i.exec(raw)
  if (compact) {
    owner = compact[1]
    name = compact[2].replace(/\.git$/i, '')
    remote = `https://github.com/${owner}/${name}.git`
  } else if (https) {
    owner = https[1]
    name = https[2].replace(/\.git$/i, '')
    remote = `https://github.com/${owner}/${name}.git`
  } else if (ssh) {
    owner = ssh[1]
    name = ssh[2].replace(/\.git$/i, '')
    remote = `git@github.com:${owner}/${name}.git`
  } else {
    return { ok: false, error: 'Use owner/repo or a GitHub HTTPS/SSH address.' }
  }
  if (name.toLowerCase().endsWith('.git')) name = name.slice(0, -4)
  return {
    ok: true,
    remote,
    owner,
    name,
    webUrl: `https://github.com/${owner}/${name}`,
  }
}

/** Display form for a remote. */
export function remoteLabel(remote) {
  const parsed = parseRemote(remote)
  return parsed.ok ? `${parsed.owner}/${parsed.name}` : String(remote || 'Not connected')
}

/** Normalize a project path for cross-platform comparison. */
export function pathKey(value) {
  if (!value) return ''
  let text = String(value).replace(/\\/g, '/').replace(/\/+$/, '')
  if (/^[A-Za-z]:\//.test(text)) text = text.toLowerCase()
  return text
}

export function samePath(a, b) {
  const left = pathKey(a)
  const right = pathKey(b)
  return left.length > 0 && left === right
}

export function baseNameOf(value) {
  return path.basename(String(value || '').replace(/[\\/]+$/, ''))
}

/** Directories that hold DSH session logs, newest generation only. */
export function parseSessionFileName(fileName) {
  const match = /^session(?:\.v(\d+))?\.jsonl(?:\.zstd)?$/i.exec(String(fileName || ''))
  if (!match) return null
  return { version: Number(match[1] || 0), compressed: /\.zstd$/i.test(fileName) }
}

export function isPidAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error?.code !== 'ESRCH'
  }
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function toIso(value = Date.now()) {
  return new Date(value).toISOString()
}

export function relativeTime(iso, now = Date.now()) {
  const timestamp = Date.parse(iso || '')
  if (!Number.isFinite(timestamp)) return 'never'
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000))
  if (seconds < 45) return 'just now'
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`
  if (seconds < 86400 * 14) return `${Math.round(seconds / 86400)} d ago`
  return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function errorMessage(error) {
  const text = String(error?.output || error?.message || error || 'Unknown error')
  return text
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/(https?:\/\/)[^@\s/]+@/g, '$1')
    .trim()
}

export function isGitAuthError(error) {
  const text = errorMessage(error).toLowerCase()
  return /authentication failed|could not read username|permission denied|repository not found|access denied|terminal prompts disabled|403/.test(
    text,
  )
}
