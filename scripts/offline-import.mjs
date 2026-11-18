#!/usr/bin/env node
/**
 * Offline Chat Sync importer.
 *
 * Runs without DSH. It stops DSH only after an explicit interactive
 * confirmation, then imports validated remote sessions into the local DSH
 * home and leaves DSH stopped or restarts it.
 *
 * Phase 1 scope: existing chats only, full-file replacement, no workspace
 * creation, no attachments, no offline push.
 */
import { execFile, execFileSync, spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline/promises'

import {
  applyReplacement,
  chooseRemoteCandidate,
  listRemoteDevices,
  loadJournal,
  projectionCachePath,
  readRemoteCandidates,
  resolveGitSha,
  saveJournal,
  scanLocalInventory,
} from '../lib/offline.js'
import { isSyncableSession } from '../lib/session.js'
import { errorMessage, formatBytes, readJson, sha256, writeJsonAtomic } from '../lib/util.js'

const BRANCH_FALLBACK = 'main'

function parseArgs(argv) {
  const options = {
    home: process.env.DSH_HOME || path.join(os.homedir(), '.dsh'),
    repo: null,
    branch: null,
    dryRun: false,
    yes: false,
    restart: false,
    noRestart: false,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--home') options.home = argv[++i]
    else if (arg === '--repo') options.repo = argv[++i]
    else if (arg === '--branch') options.branch = argv[++i]
    else if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--yes' || arg === '-y') options.yes = true
    else if (arg === '--restart') options.restart = true
    else if (arg === '--no-restart') options.noRestart = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else throw new Error(`Unknown option: ${arg}`)
  }
  if (!options.repo) options.repo = path.join(options.home, 'chat-sync', 'repo')
  return options
}

function printHelp() {
  console.log(`Chat Sync offline import (phase 1)

Usage:
  node scripts/offline-import.mjs [options]

Options:
  --home <path>       DSH home (default: %DSH_HOME% or ~/.dsh)
  --repo <path>       Git repository (default: <home>/chat-sync/repo)
  --branch <name>     Branch (default: chat-sync config or main)
  --dry-run           Read/validate only; no writes, no DSH shutdown
  --yes, -y           Allow a forced DSH shutdown without prompting
  --restart           Start DSH after a successful import
  --no-restart        Do not start DSH even if it was running
  --help, -h          Show this help

If DSH is running, the CLI asks before stopping it. Answering N changes
nothing: no fetch, no writes and no cache changes.`)
}

async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { windowsHide: true, timeout: 120000, ...options }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout
        error.stderr = stderr
        reject(error)
        return
      }
      resolve({ stdout, stderr })
    })
  })
}

async function listDshProcesses() {
  if (process.platform !== 'win32') return []
  const script = [
    "$items = Get-CimInstance Win32_Process | Where-Object {",
    "  $_.Name -eq 'DeepSeek Harness.exe' -or",
    "  ($_.ExecutablePath -and $_.ExecutablePath -like '*DeepSeek Harness*')",
    '}',
    '$items | Select-Object ProcessId,Name,ExecutablePath,CommandLine | ConvertTo-Json -Compress',
  ].join('\n')
  const ps = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  try {
    const { stdout } = await run(ps, ['-NoProfile', '-NonInteractive', '-Command', script], {
      timeout: 15000,
      maxBuffer: 8 * 1024 * 1024,
    })
    const text = String(stdout || '').trim()
    if (!text) return []
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch (error) {
    throw new Error(`Could not check whether DSH is running: ${errorMessage(error)}`)
  }
}

function processIsAlive(pid) {
  if (!Number.isSafeInteger(Number(pid)) || Number(pid) <= 0) return false
  try {
    process.kill(Number(pid), 0)
    return true
  } catch (error) {
    return error?.code === 'EPERM'
  }
}

async function checkOnlineLock(home) {
  const file = path.join(home, 'chat-sync', 'sync.lock')
  let owner = null
  try {
    owner = JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    return
  }
  if (owner && processIsAlive(Number(owner.pid))) {
    throw new Error(`Online Chat Sync is running (pid ${owner.pid}). Stop DSH and retry.`)
  }
  await fs.rm(file, { force: true })
}

async function acquireLock(home) {
  const file = path.join(home, 'chat-sync', 'offline', 'operation.lock')
  await fs.mkdir(path.dirname(file), { recursive: true })
  const payload = JSON.stringify({ pid: process.pid, startedAt: Date.now() })
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = await fs.open(file, 'wx', 0o600)
      await handle.writeFile(payload)
      await handle.sync()
      await handle.close()
      return { file, release: async () => { await fs.rm(file, { force: true }) } }
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error
      let owner = null
      try {
        owner = JSON.parse(await fs.readFile(file, 'utf8'))
      } catch {}
      if (owner && processIsAlive(owner.pid)) {
        throw new Error(`Another offline import is running (pid ${owner.pid}).`)
      }
      await fs.rm(file, { force: true })
    }
  }
  throw new Error('Could not acquire the offline import lock.')
}

async function stopDshProcesses(processes, log) {
  const pids = [...new Set(processes.map(item => Number(item.ProcessId)).filter(Number.isSafeInteger))]
  for (const pid of pids) {
    try {
      await run('taskkill.exe', ['/PID', String(pid), '/T'], { timeout: 15000 })
    } catch {}
  }
  for (let i = 0; i < 20; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 500))
    const left = pids.filter(pid => processIsAlive(pid))
    if (left.length === 0) return
  }
  for (const pid of pids.filter(pid => processIsAlive(pid))) {
    log(`force-stopping DSH pid ${pid}`)
    try {
      await run('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { timeout: 15000 })
    } catch {}
  }
  await new Promise(resolve => setTimeout(resolve, 1200))
  const remaining = pids.filter(pid => processIsAlive(pid))
  if (remaining.length) throw new Error(`DSH is still running (pid ${remaining.join(', ')}).`)
}

async function askToStop(processes) {
  if (!process.stdin.isTTY) return false
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    console.log('DSH is running:')
    for (const item of processes) console.log(`  pid ${item.ProcessId} ${item.ExecutablePath || item.Name || ''}`)
    const answer = await rl.question('Force a full DSH shutdown and continue? [y/N] ')
    return /^y(es)?$/i.test(answer.trim())
  } finally {
    rl.close()
  }
}

async function findIncompleteJournal(home) {
  const root = path.join(home, 'chat-sync', 'offline')
  let entries = []
  try {
    entries = await fs.readdir(root, { withFileTypes: true })
  } catch {
    return null
  }
  for (const entry of entries.filter(item => item.isDirectory()).sort((a, b) => b.name.localeCompare(a.name))) {
    const directory = path.join(root, entry.name)
    const journal = await loadJournal(directory).catch(() => null)
    if (journal && journal.stage !== 'done' && journal.stage !== 'aborted') return { directory, journal }
  }
  return null
}

async function recoverIncomplete(home, log) {
  const found = await findIncompleteJournal(home)
  if (!found) return
  log(`recovering incomplete offline operation: ${found.directory}`)
  for (const entry of found.journal.entries || []) {
    if (entry.status === 'committed' || entry.status === 'cache-pending') {
      const cache = projectionCachePath(home, entry.id)
      try { await fs.rm(cache, { force: true }) } catch (error) {
        throw new Error(`Could not clear projection cache for ${entry.id}: ${errorMessage(error)}`)
      }
      entry.status = 'cache-cleared'
    }
    if (entry.status === 'staged' && entry.backup) {
      await fs.copyFile(entry.backup, entry.file)
      entry.status = 'rolled-back'
    }
  }
  found.journal.stage = 'done'
  found.journal.recoveredAt = new Date().toISOString()
  await saveJournal(found.directory, found.journal)
  log('recovery complete')
}

async function gitFetch(repo, branch) {
  await run('git', ['-C', repo, 'fetch', '--prune', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], {
    timeout: 120000,
    maxBuffer: 64 * 1024 * 1024,
  })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const home = path.resolve(options.home)
  const repo = path.resolve(options.repo)
  const config = await readJson(path.join(home, 'chat-sync', 'config.json'), {}).catch(() => ({}))
  const branch = String(options.branch || config.branch || BRANCH_FALLBACK)
  const log = message => console.log(`[offline-import] ${message}`)
  const processes = await listDshProcesses()
  let wasRunning = processes.length > 0

  if (wasRunning && options.dryRun) {
    console.log('DSH is running. Dry-run is read-only and will not stop it.')
  } else if (wasRunning) {
    if (options.yes) {
      log('stopping DSH because --yes was supplied')
    } else if (!(await askToStop(processes))) {
      console.log('Nothing changed.')
      return
    }
    await stopDshProcesses(processes, log)
    log('DSH stopped')
  }

  const lock = options.dryRun
    ? { release: async () => {} }
    : await acquireLock(home)
  let failed = false
  let startAfter = null
  try {
    if (!options.dryRun) {
      await checkOnlineLock(home)
      await recoverIncomplete(home, log).catch(error => {
        throw new Error(`Incomplete previous operation could not be recovered: ${errorMessage(error)}`)
      })
    }

    const operationName = new Date().toISOString().replace(/[:.]/g, '-')
    const directory = path.join(home, 'chat-sync', 'offline', operationName)
    const journal = {
      version: 1,
      stage: 'started',
      startedAt: new Date().toISOString(),
      home,
      repo,
      branch,
      dryRun: options.dryRun,
      entries: [],
    }
    if (!options.dryRun) await saveJournal(directory, journal)

    const inventory = await scanLocalInventory(home)
    log(`local sessions: ${inventory.byId.size}`)

    if (!options.dryRun) {
      await gitFetch(repo, branch)
      const sha = resolveGitSha(repo, branch)
      journal.sha = sha
      journal.stage = 'pinned'
      await saveJournal(directory, journal)
      log(`remote snapshot: ${sha}`)

      const deviceIds = listRemoteDevices(repo, sha)
      const remoteById = readRemoteCandidates(repo, sha, deviceIds)
      let replaced = 0
      for (const [id, local] of inventory.byId) {
        if (local.duplicate) { log(`skip ${id}: duplicate local id`); continue }
        if (!local.session) { log(`skip ${id}: local log invalid: ${local.error}`); continue }
        if (!isSyncableSession(local.session)) { log(`skip ${id}: child/subagent session`); continue }
        if (local.session.seeded) { log(`skip ${id}: seeded session (phase 1)`); continue }
        const candidates = remoteById.get(id) || []
        const choice = chooseRemoteCandidate(local, candidates)
        if (choice.action === 'noop' || choice.action === 'keep-local') continue
        if (choice.action === 'conflict') { log(`conflict ${id}: ${choice.reason}`); continue }
        if (choice.action !== 'replace') continue

        const candidate = choice.candidate
        journal.entries.push({
          id,
          file: local.file,
          backup: path.join(directory, 'backups', `${id}.jsonl.zstd`),
          oldHash: sha256(local.buffer),
          newHash: sha256(candidate.buffer),
          status: 'staged',
        })
        await saveJournal(directory, journal)
        const entry = journal.entries.at(-1)
        try {
          const applied = await applyReplacement({ home, local, candidate, journalDir: directory })
          entry.status = applied.cacheRemoved ? 'cache-cleared' : 'cache-pending'
          if (!applied.cacheRemoved) throw new Error(`projection cache was not cleared for ${id}`)
          await saveJournal(directory, journal)
          replaced += 1
          log(`updated ${id} (${formatBytes(applied.bytes || candidate.buffer.length)})`)
        } catch (error) {
          try {
            if (entry.backup) await fs.copyFile(entry.backup, entry.file)
            await fs.rm(projectionCachePath(home, id), { force: true })
            entry.status = 'rolled-back'
            await saveJournal(directory, journal)
          } catch (rollbackError) {
            throw new Error(`import failed for ${id} and rollback also failed: ${errorMessage(rollbackError)}`)
          }
          throw error
        }
      }
      journal.stage = 'done'
      journal.finishedAt = new Date().toISOString()
      journal.replaced = replaced
      await saveJournal(directory, journal)
      log(`done: ${replaced} session(s) replaced; log: ${directory}`)
    } else {
      log('dry-run: no fetch, no writes, no cache changes')
    }

    if (!options.dryRun && wasRunning && !options.noRestart) {
      startAfter = processes.find(item => item.ExecutablePath)?.ExecutablePath || null
    }
  } catch (error) {
    failed = true
    console.error(`[offline-import] failed: ${errorMessage(error)}`)
    process.exitCode = 1
  } finally {
    await lock.release().catch(() => {})
  }

  if (!failed && startAfter) {
    spawn(startAfter, [], { detached: true, stdio: 'ignore', cwd: path.dirname(startAfter) }).unref()
    log(`DSH started: ${startAfter}`)
  } else if (!failed && wasRunning && !options.dryRun && !options.noRestart && !startAfter) {
    log('DSH was running but its executable path is unknown; start it manually')
  }
}

main().catch(error => {
  console.error(`[offline-import] ${errorMessage(error)}`)
  process.exitCode = 1
})
