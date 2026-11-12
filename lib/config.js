import os from 'node:os'
import path from 'node:path'

import { parseRemote, readJson, writeJsonAtomic } from './util.js'

export const DEFAULT_REMOTE = 'https://github.com/Eugene-doc/dsh-sync.git'
export const DEFAULT_BRANCH = 'main'
export const INTERVAL_OPTIONS = [5, 10, 30, 60]

export function defaultConfig() {
  return {
    remote: DEFAULT_REMOTE,
    branch: DEFAULT_BRANCH,
    autoSync: true,
    intervalMinutes: 10,
    includeAttachments: false,
    addComputerName: true,
    syncArchive: true,
    resolveConflicts: true,
  }
}

export function resolveHome() {
  return process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
}

export function pathsFor(home = resolveHome()) {
  const root = path.join(home, 'chat-sync')
  return {
    home,
    root,
    config: path.join(root, 'config.json'),
    state: path.join(root, 'state.json'),
    repo: path.join(root, 'repo'),
    conflicts: path.join(root, 'conflicts'),
    lock: path.join(root, 'sync.lock'),
  }
}

/** Read and normalize the user's config; malformed values fall back per field. */
export async function loadConfig(home) {
  const paths = pathsFor(home)
  const stored = await readJson(paths.config, {})
  const base = defaultConfig()
  const remote = parseRemote(stored.remote)
  const branch = String(stored.branch || base.branch).replace(/^refs\/heads\//, '')
  return {
    remote: remote.ok ? remote.remote : base.remote,
    branch: /^[A-Za-z0-9._/-]+$/.test(branch) && !branch.startsWith('-') ? branch : base.branch,
    autoSync: typeof stored.autoSync === 'boolean' ? stored.autoSync : base.autoSync,
    intervalMinutes: INTERVAL_OPTIONS.includes(Number(stored.intervalMinutes))
      ? Number(stored.intervalMinutes)
      : base.intervalMinutes,
    includeAttachments:
      typeof stored.includeAttachments === 'boolean'
        ? stored.includeAttachments
        : base.includeAttachments,
    addComputerName:
      typeof stored.addComputerName === 'boolean'
        ? stored.addComputerName
        : base.addComputerName,
    syncArchive:
      typeof stored.syncArchive === 'boolean' ? stored.syncArchive : base.syncArchive,
    resolveConflicts:
      typeof stored.resolveConflicts === 'boolean'
        ? stored.resolveConflicts
        : base.resolveConflicts,
  }
}

export async function saveConfig(home, config) {
  const paths = pathsFor(home)
  await writeJsonAtomic(paths.config, config)
  return config
}

/** Validate an untrusted UI patch before it reaches disk. */
export function validateConfigPatch(current, patch) {
  const next = { ...current }
  if (Object.hasOwn(patch, 'remote')) {
    const parsed = parseRemote(patch.remote)
    if (!parsed.ok) return { ok: false, error: parsed.error }
    next.remote = parsed.remote
  }
  if (Object.hasOwn(patch, 'branch')) {
    const branch = String(patch.branch || '').trim().replace(/^refs\/heads\//, '')
    if (!branch || !/^[A-Za-z0-9._/-]+$/.test(branch) || branch.startsWith('-') || branch.includes('..')) {
      return { ok: false, error: 'Branch name is not valid.' }
    }
    next.branch = branch
  }
  if (Object.hasOwn(patch, 'autoSync')) {
    if (typeof patch.autoSync !== 'boolean') return { ok: false, error: 'autoSync must be a boolean.' }
    next.autoSync = patch.autoSync
  }
  if (Object.hasOwn(patch, 'intervalMinutes')) {
    const value = Number(patch.intervalMinutes)
    if (!INTERVAL_OPTIONS.includes(value)) {
      return { ok: false, error: `Interval must be one of ${INTERVAL_OPTIONS.join(', ')} minutes.` }
    }
    next.intervalMinutes = value
  }
  if (Object.hasOwn(patch, 'includeAttachments')) {
    if (typeof patch.includeAttachments !== 'boolean') {
      return { ok: false, error: 'includeAttachments must be a boolean.' }
    }
    next.includeAttachments = patch.includeAttachments
  }
  if (Object.hasOwn(patch, 'addComputerName')) {
    if (typeof patch.addComputerName !== 'boolean') {
      return { ok: false, error: 'addComputerName must be a boolean.' }
    }
    next.addComputerName = patch.addComputerName
  }
  if (Object.hasOwn(patch, 'syncArchive')) {
    if (typeof patch.syncArchive !== 'boolean') {
      return { ok: false, error: 'syncArchive must be a boolean.' }
    }
    next.syncArchive = patch.syncArchive
  }
  if (Object.hasOwn(patch, 'resolveConflicts')) {
    if (typeof patch.resolveConflicts !== 'boolean') {
      return { ok: false, error: 'resolveConflicts must be a boolean.' }
    }
    next.resolveConflicts = patch.resolveConflicts
  }
  return { ok: true, config: next }
}
