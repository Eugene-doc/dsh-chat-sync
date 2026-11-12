import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { GitRepository } from './git.js'
import { loadConfig, pathsFor, saveConfig, validateConfigPatch } from './config.js'
import {
  cloneRowsWithCwd,
  compareSessionRows,
  createHeaderFromSession,
  decodeSession,
  encodeRows,
  listLocalSessionFiles,
  projectKey,
} from './session.js'
import { titleEvent, titleKey, uniqueImportedTitle } from './titles.js'
import {
  baseNameOf,
  createId,
  ensureDir,
  errorMessage,
  formatBytes,
  isPidAlive,
  listFiles,
  parseRemote,
  pathExists,
  readJson,
  remoteLabel,
  run,
  samePath,
  sha256,
  shortHash,
  toIso,
  writeFileAtomic,
  writeJsonAtomic,
} from './util.js'

const PLUGIN_VERSION = 1
const MAX_ACTIVITY = 20
const MAX_CONFLICTS = 50

export class ChatSyncEngine {
  constructor(ctx, options = {}) {
    this.ctx = ctx
    this.home = options.home || process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
    this.paths = pathsFor(this.home)
    this.sessionsRoot = path.join(this.home, 'sessions')
    this.attachmentsRoot = path.join(this.home, 'attachments', 'v1', 'objects')
    this.log = options.log || (() => {})
    this.config = null
    this.state = null
    this.git = new GitRepository(this.paths.repo, this.log)
    this.environment = null
    this.environmentPromise = null
    this.running = false
    this.phase = 'idle'
    this.phaseMessage = ''
    this.progress = 0
    this.startedAt = null
    this.syncPromise = null
    this.lastError = null
    this.onConfigChange = null
    this.deviceCache = { at: 0, value: [] }
  }

  async init() {
    await ensureDir(this.paths.root)
    await ensureDir(this.paths.conflicts)
    this.config = await loadConfig(this.home)
    if (!(await pathExists(this.paths.config))) {
      await saveConfig(this.home, this.config)
    }
    let storedState = null
    try {
      storedState = await readJson(this.paths.state, null)
    } catch {
      storedState = null
    }
    this.state = storedState
    if (!this.state || this.state.version !== PLUGIN_VERSION) {
      this.state = {
        version: PLUGIN_VERSION,
        deviceId: createId(),
        deviceName: os.hostname() || 'This computer',
        createdAt: toIso(),
        exported: {},
        conflicts: [],
        activity: [],
        lastSync: null,
        repositoryVisibility: null,
      }
    }
    if (!this.state.deviceId) this.state.deviceId = createId()
    if (!this.state.deviceName) this.state.deviceName = os.hostname() || 'This computer'
    if (!this.state.exported || typeof this.state.exported !== 'object') this.state.exported = {}
    if (!Array.isArray(this.state.conflicts)) this.state.conflicts = []
    this.state.conflicts = this.dedupeConflicts(this.state.conflicts).slice(0, MAX_CONFLICTS)
    if (!Array.isArray(this.state.activity)) this.state.activity = []
    await this.saveState()
    this.environmentPromise = this.readEnvironment()
    return this
  }

  async saveState() {
    await writeJsonAtomic(this.paths.state, this.state)
  }

  getPersistence() {
    try {
      return this.ctx?.get?.('sessionPersistence') || this.ctx?.sessionPersistence
    } catch {
      return undefined
    }
  }

  getWorkspaceRegistry() {
    try {
      return this.ctx?.get?.('workspaceRegistry') || this.ctx?.workspaceRegistry
    } catch {
      return undefined
    }
  }

  async readEnvironment() {
    const environment = {
      git: null,
      gitVersion: null,
      gh: null,
      ghUser: null,
      hostname: os.hostname(),
      platform: process.platform,
      node: process.version,
      home: this.home,
      repoDir: this.paths.repo,
    }
    try {
      environment.gitVersion = await this.git.version()
      environment.git = Boolean(environment.gitVersion)
    } catch {}
    try {
      environment.gh = Boolean(await run('gh', ['--version'], { timeout: 8000 }))
      if (environment.gh) {
        environment.ghUser = await run('gh', ['api', 'user', '--jq', '.login'], { timeout: 12_000 })
      }
    } catch {}
    this.environment = environment
    return environment
  }

  async environmentReady() {
    if (this.environment) return this.environment
    if (this.environmentPromise) return this.environmentPromise
    return this.readEnvironment()
  }

  repositoryInfo() {
    const parsed = parseRemote(this.config?.remote)
    return {
      remote: this.config?.remote || '',
      label: parsed.ok ? `${parsed.owner}/${parsed.name}` : 'Not connected',
      owner: parsed.ok ? parsed.owner : '',
      name: parsed.ok ? parsed.name : '',
      webUrl: parsed.ok ? parsed.webUrl : '',
      branch: this.config?.branch || 'main',
      private: this.state?.repositoryVisibility ?? null,
    }
  }

  /** Ask GitHub CLI once per sync whether the relay is actually private. */
  async checkVisibility() {
    const parsed = parseRemote(this.config?.remote)
    if (!parsed.ok) return
    try {
      const output = await run(
        'gh',
        ['api', `repos/${parsed.owner}/${parsed.name}`, '--jq', '.private'],
        { timeout: 12_000 },
      )
      if (output === 'true' || output === 'false') {
        this.state.repositoryVisibility = output === 'true'
      }
    } catch {
      // Visibility is a display fact only; a network hiccup must not stop a sync.
    }
  }

  async scanLocalFiles() {
    return listLocalSessionFiles(this.sessionsRoot)
  }

  async scanLocalSessions() {
    const files = await this.scanLocalFiles()
    const sessions = []
    const warnings = []
    for (const entry of files) {
      try {
        const buffer = await fs.readFile(entry.file)
        const session = decodeSession(buffer, entry.id)
        sessions.push({ ...entry, ...session })
      } catch (error) {
        warnings.push({
          id: entry.id,
          message: `Skipped a chat that is still being written (${shortHash(entry.id)}): ${errorMessage(error)}`,
        })
      }
    }
    return { sessions, warnings }
  }

  async readDevices() {
    const now = Date.now()
    if (now - this.deviceCache.at < 2500 && this.deviceCache.value.length) {
      return this.deviceCache.value
    }
    const root = path.join(this.paths.repo, 'devices')
    let dirs = []
    try {
      dirs = await fs.readdir(root, { withFileTypes: true })
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
    const devices = []
    for (const dir of dirs) {
      if (!dir.isDirectory()) continue
      const devicePath = path.join(root, dir.name)
      let manifest
      try {
        manifest = await readJson(path.join(devicePath, 'manifest.json'), null)
      } catch {
        manifest = null
      }
      let device
      try {
        device = await readJson(path.join(devicePath, 'device.json'), {})
      } catch {
        device = {}
      }
      devices.push({
        id: dir.name,
        name: device.name || manifest?.device?.name || `Computer ${dir.name.slice(0, 4)}`,
        platform: device.platform || manifest?.device?.platform || 'unknown',
        hostname: device.hostname || '',
        lastSyncAt: device.lastSyncAt || manifest?.generatedAt || null,
        chats: Array.isArray(manifest?.sessions) ? manifest.sessions.length : 0,
        bytes: Array.isArray(manifest?.sessions)
          ? manifest.sessions.reduce((sum, item) => sum + (Number(item.size) || 0), 0)
          : 0,
        current: dir.name === this.state.deviceId,
        manifest: manifest || { sessions: [] },
      })
    }
    if (!devices.some(item => item.current)) {
      let count = 0
      let bytes = 0
      try {
        const files = await this.scanLocalFiles()
        count = files.length
        bytes = files.reduce((sum, item) => sum + item.size, 0)
      } catch {}
      devices.push({
        id: this.state.deviceId,
        name: this.state.deviceName,
        platform: process.platform,
        hostname: os.hostname(),
        lastSyncAt: this.state.lastSync?.at || null,
        chats: count,
        bytes,
        current: true,
        manifest: { sessions: [] },
      })
    }
    devices.sort((a, b) => {
      if (a.current !== b.current) return a.current ? -1 : 1
      return Date.parse(b.lastSyncAt || 0) - Date.parse(a.lastSyncAt || 0)
    })
    this.deviceCache = { at: now, value: devices }
    return devices
  }

  dedupeConflicts(conflicts) {
    const seen = new Set()
    return (Array.isArray(conflicts) ? conflicts : []).filter(conflict => {
      const key = `${conflict.id || ''}|${conflict.device || ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  activity(kind, text, extra = {}) {
    this.state.activity = [
      { at: toIso(), kind, text, ...extra },
      ...this.state.activity.filter(item => item.text !== text || item.code !== extra.code),
    ].slice(0, MAX_ACTIVITY)
  }

  async getStatus() {
    const environment = await this.environmentReady()
    let files = []
    let localError = null
    try {
      files = await this.scanLocalFiles()
    } catch (error) {
      localError = errorMessage(error)
    }
    let devices = []
    try {
      devices = await this.readDevices()
    } catch {
      devices = []
    }
    const localBytes = files.reduce((sum, item) => sum + item.size, 0)
    const uniqueRemote = new Set()
    for (const device of devices) {
      for (const entry of device.manifest?.sessions || []) uniqueRemote.add(entry.id)
    }
    const repoReady = await this.git.exists()
    return {
      ok: true,
      plugin: { version: PLUGIN_VERSION },
      repository: {
        ...this.repositoryInfo(),
        ready: repoReady,
        private: true,
      },
      settings: { ...this.config },
      sync: {
        running: this.running,
        phase: this.phase,
        message: this.phaseMessage,
        progress: this.progress,
        startedAt: this.startedAt,
      },
      last: this.state.lastSync,
      stats: {
        localChats: files.length,
        localBytes,
        localBytesLabel: formatBytes(localBytes),
        remoteChats: uniqueRemote.size,
        devices: devices.length,
        conflicts: this.state.conflicts.length,
        totalChats: Math.max(files.length, uniqueRemote.size),
      },
      devices: devices.map(({ manifest: _manifest, ...rest }) => rest),
      conflicts: this.state.conflicts.slice(0, MAX_CONFLICTS),
      activity: this.state.activity.slice(0, 12),
      environment: {
        ...environment,
        conflictsDir: this.paths.conflicts,
        localError,
      },
    }
  }

  async updateConfig(patch) {
    const checked = validateConfigPatch(this.config, patch)
    if (!checked.ok) throw Object.assign(new Error(checked.error), { code: 'invalid-config' })
    const previous = this.config
    this.config = await saveConfig(this.home, checked.config)
    if (previous.remote !== this.config.remote || previous.branch !== this.config.branch) {
      await this.resetRepository()
    }
    this.deviceCache = { at: 0, value: [] }
    this.onConfigChange?.(this.config)
    return this.getStatus()
  }

  /** Forget the local Git checkout when the user switches repository or branch. */
  async resetRepository() {
    await fs.rm(this.paths.repo, { recursive: true, force: true }).catch(() => {})
    this.state.exported = {}
    this.state.conflicts = []
    this.state.lastSync = null
    this.state.repositoryVisibility = null
    await this.saveState()
  }

  async acquireLock() {
    try {
      const lock = await readJson(this.paths.lock, null)
      if (lock && isPidAlive(Number(lock.pid)) && Number(lock.pid) !== process.pid) {
        throw new Error('Another DSH window is syncing chats right now. Try again in a moment.')
      }
    } catch (error) {
      if (error?.message?.includes('Another DSH window')) throw error
    }
    await writeJsonAtomic(this.paths.lock, { pid: process.pid, at: toIso() })
  }

  async releaseLock() {
    await fs.rm(this.paths.lock, { force: true }).catch(() => {})
  }

  setPhase(phase, message, progress) {
    this.phase = phase
    this.phaseMessage = message
    this.progress = progress
    this.log(`[chat-sync] ${phase}: ${message}`)
  }

  /**
   * Start a sync in the background. The HTTP layer returns immediately; the
   * settings page polls getStatus while this runs.
   */
  async startSync() {
    if (this.running) return { started: false, status: await this.getStatus() }
    this.running = true
    this.startedAt = toIso()
    this.lastError = null
    this.setPhase('starting', 'Preparing this computer…', 3)
    this.syncPromise = this.runSync()
      .catch(() => {})
      .finally(() => {
        this.running = false
        this.syncPromise = null
      })
    return { started: true, status: await this.getStatus() }
  }

  async awaitSync() {
    if (this.syncPromise) await this.syncPromise
    return this.getStatus()
  }

  async runSync() {
    const started = Date.now()
    const result = {
      at: toIso(),
      ok: false,
      imported: 0,
      updated: 0,
      exported: 0,
      conflicts: 0,
      bytesUploaded: 0,
      bytesDownloaded: 0,
      warnings: [],
    }
    try {
      await this.acquireLock()
      const environment = await this.environmentReady()
      if (!environment.git) {
        throw Object.assign(
          new Error('Git is not installed or is not on PATH. Install Git, then try again.'),
          { code: 'no-git' },
        )
      }
      this.setPhase('checking', 'Checking the private repository…', 8)
      await ensureDir(this.paths.repo)
      const ensured = await this.git.ensure(this.config)
      await this.checkVisibility()
      this.setPhase('pulling', ensured.emptyRemote ? 'Preparing the repository…' : 'Downloading chats…', 22)
      this.deviceCache = { at: 0, value: [] }

      const remoteDevices = await this.readDevices()
      this.setPhase('merging', 'Merging chat history…', 40)
      const imported = await this.importRemote(remoteDevices)
      result.imported = imported.imported
      result.updated = imported.updated
      result.titlesRenamed = imported.renamed
      result.conflicts = imported.conflicts.length
      result.bytesDownloaded = imported.bytes
      result.warnings.push(...imported.warnings)
      if (this.config.includeAttachments) {
        result.attachmentsImported = await this.importAttachments(remoteDevices)
      }
      if (this.config.addComputerName) {
        const normalized = await this.disambiguateLocalTitles()
        result.titlesRenamed += normalized.renamed
        result.warnings.push(...normalized.warnings)
      }
      this.setPhase('uploading', 'Uploading this computer’s chats…', 68)
      const exported = await this.exportLocal()
      result.exported = exported.exported
      result.bytesUploaded = exported.bytes
      result.warnings.push(...exported.warnings)
      this.setPhase('finalizing', 'Publishing changes…', 88)

      const commitMessage = `chat sync: ${this.state.deviceName} · ${result.exported} changed chat${result.exported === 1 ? '' : 's'}`
      const committed = await this.git.commitDevice(this.state.deviceId, commitMessage)
      let push = { pushed: false }
      if (committed) push = await this.git.push(this.config.branch)
      if (!push.pushed && !committed) {
        // A previous run may have committed locally but not pushed.
        const pending = await this.git.run(['rev-list', '--count', `origin/${this.config.branch}..HEAD`], {
          allowFailure: true,
        })
        if (!pending.failed && Number(pending.output) > 0) push = await this.git.push(this.config.branch)
      }
      if (!push.pushed && committed) {
        throw new Error(push.error || 'The commit was created locally but GitHub did not accept it.')
      }

      result.ok = true
      result.at = toIso()
      result.durationMs = Date.now() - started
      result.commit = await this.git.headSummary()
      this.setPhase('idle', result.exported || result.imported ? 'Sync complete' : 'Already up to date', 100)
      this.activity(
        'success',
        result.exported || result.imported
          ? `Synced ${result.imported ? `${result.imported} in` : ''}${result.imported && result.exported ? ', ' : ''}${result.exported ? `${result.exported} out` : ''}`
          : 'Already up to date',
        {
          code: 'synced',
          data: { imported: result.imported, exported: result.exported },
        },
      )
    } catch (error) {
      result.error = errorMessage(error)
      result.hint =
        error?.code === 'git-auth'
          ? 'Sign in with GitHub CLI (`gh auth login`) using the account that owns the repository.'
          : error?.code === 'no-git'
            ? 'Install Git from git-scm.com and restart DeepSeek Harness.'
            : 'The local chats were not changed. Check the repository and network, then retry.'
      result.at = toIso()
      result.durationMs = Date.now() - started
      this.lastError = result
      this.setPhase('error', result.error, 100)
      this.activity('error', result.error, { code: 'error' })
      this.log(`[chat-sync] error: ${result.error}`)
    } finally {
      this.state.lastSync = result
      try {
        await this.saveState()
      } catch {}
      await this.releaseLock()
      this.deviceCache = { at: 0, value: [] }
    }
    return result
  }

  async resolveWorkspace(remotePath, remoteTitle) {
    const registry = this.getWorkspaceRegistry()
    if (registry?.list) {
      try {
        const workspaces = registry.list().filter(item => item?.path)
        const exact = workspaces.find(item => samePath(item.path, remotePath))
        const byName = workspaces.find(
          item => baseNameOf(item.path).toLowerCase() === baseNameOf(remotePath).toLowerCase(),
        )
        let existing
        for (const workspace of workspaces) {
          if (await pathExists(workspace.path)) {
            existing = workspace
            break
          }
        }
        const target = exact || byName || existing || workspaces[0]
        if (target) {
          return {
            path: target.path,
            title: target.title || baseNameOf(target.path) || remoteTitle || 'Chats',
            workspace: target,
          }
        }
      } catch {}
    }

    const storagePath = path.join(this.home, 'storages', 'workspace.json')
    try {
      const storage = await readJson(storagePath, null)
      const table = storage?.tables?.workspaces
      if (table && typeof table === 'object') {
        const entries = Object.entries(table)
        const exact = entries.find(([, item]) => samePath(item.path, remotePath))
        const byName = entries.find(
          ([, item]) => baseNameOf(item.path).toLowerCase() === baseNameOf(remotePath).toLowerCase(),
        )
        const target = exact || byName || entries[0]
        if (target) {
          return {
            id: target[0],
            path: target[1].path,
            title: target[1].title || baseNameOf(target[1].path) || remoteTitle || 'Chats',
            storage,
            storagePath,
          }
        }
      }
    } catch {}

    return { path: remotePath, title: remoteTitle || baseNameOf(remotePath) || 'Chats' }
  }

  async attachToWorkspace(sessionId, target) {
    if (target.workspace?.attachSession) {
      try {
        await target.workspace.attachSession(sessionId)
        return true
      } catch (error) {
        this.log(`[chat-sync] could not attach ${sessionId}: ${errorMessage(error)}`)
      }
    }
    if (target.id && target.storage && target.storagePath) {
      const record = target.storage.tables.workspaces[target.id]
      if (record && !record.sessionIds.includes(sessionId)) {
        record.sessionIds = [sessionId, ...record.sessionIds]
        record.updatedAt = toIso()
        for (const [id, workspace] of Object.entries(target.storage.tables.workspaces)) {
          if (id !== target.id) workspace.sessionIds = workspace.sessionIds.filter(value => value !== sessionId)
        }
        try {
          await writeJsonAtomic(target.storagePath, target.storage, 0o600)
          return true
        } catch {}
      }
    }
    return false
  }

  /** Attach every local chat to a workspace and optionally restore it from the local archive. */
  async repairGrouping({ unarchive = true } = {}) {
    const registry = this.getWorkspaceRegistry()
    if (!registry?.list || !registry?.unarchiveSession) {
      throw new Error('Workspace registry is unavailable in this DSH profile.')
    }
    const { sessions, warnings } = await this.scanLocalSessions()
    const workspaces = registry.list()
    const archived = new Set(registry.archivedSessionIds || [])
    let attached = 0
    let unarchived = 0
    let failed = 0

    for (const session of sessions) {
      try {
        if (!workspaces.some(workspace => workspace.sessionIds?.includes(session.id))) {
          const target = await this.resolveWorkspace(session.workspacePath, session.title)
          if (!target.workspace?.attachSession) {
            failed += 1
            warnings.push({ id: session.id, message: `No workspace found for “${session.title}”.` })
          } else {
            await target.workspace.attachSession(session.id)
            attached += 1
          }
        }
        if (unarchive && archived.has(session.id)) {
          await registry.unarchiveSession(session.id)
          unarchived += 1
        }
      } catch (error) {
        failed += 1
        warnings.push({ id: session.id, message: `Could not place “${session.title}”: ${errorMessage(error)}` })
      }
    }

    this.deviceCache = { at: 0, value: [] }
    this.activity(
      'success',
      `Attached ${attached} chat${attached === 1 ? '' : 's'}, restored ${unarchived}`,
      { code: 'repaired', data: { attached, unarchived } },
    )
    await this.saveState()
    return { total: sessions.length, attached, unarchived, failed, warnings }
  }

  async importOneSession({
    buffer,
    remoteSession,
    device,
    localById,
    takenTitles = new Set(),
    conflicts,
    warnings,
  }) {
    const id = remoteSession.id
    const target = await this.resolveWorkspace(remoteSession.workspacePath, remoteSession.title)
    const persistence = this.getPersistence()
    const local = localById.get(id)
    let importedTitle = remoteSession.title
    let titleChanged = false

    if (!local) {
      if (this.config.addComputerName) {
        importedTitle = uniqueImportedTitle(remoteSession.title, device.name, takenTitles)
        titleChanged = importedTitle !== remoteSession.title
      }
      takenTitles.add(titleKey(importedTitle))
      if (!persistence?.create) {
        const rows = cloneRowsWithCwd(remoteSession.rows, target.path)
        if (titleChanged) rows.push(titleEvent(rows.length - 1, importedTitle))
        const dir = path.join(this.sessionsRoot, projectKey(target.path), id)
        await ensureDir(dir)
        const fileName = `session.v${remoteSession.header.version}.jsonl.zstd`
        await writeFileAtomic(path.join(dir, fileName), encodeRows(rows), 0o600)
      } else {
        const header = createHeaderFromSession(remoteSession, target.path)
        const handle = await persistence.create(header, { inheritedEventCount: 0 })
        try {
          const events = [...remoteSession.events]
          if (titleChanged) events.push(titleEvent(events.length, importedTitle))
          if (events.length) await handle.append(events)
          await handle.flush()
        } finally {
          await handle.close()
        }
      }
      const attached = await this.attachToWorkspace(id, target)
      if (!attached) {
        warnings.push({
          id,
          message: `Imported “${importedTitle}” but could not place it in a workspace. It will appear after the next restart.`,
        })
      }
      return { kind: 'imported', bytes: buffer.length, title: importedTitle, renamed: titleChanged }
    }

    let relation = compareSessionRows(local.rows, remoteSession.rows)
    if (relation === 'equal') return { kind: 'equal', bytes: 0 }
    if (relation === 'remote-prefix') return { kind: 'local-ahead', bytes: 0 }
    if (relation === 'diverged') {
      const timestamp = Date.now()
      const copy = path.join(
        this.paths.conflicts,
        `${id}-${device.id.slice(0, 8)}-${timestamp}.jsonl.zstd`,
      )
      await writeFileAtomic(copy, buffer, 0o600)
      conflicts.push({
        id,
        title: remoteSession.title,
        device: device.name,
        at: toIso(),
        localPath: local.file,
        copy,
        reason: 'Both computers changed this chat independently.',
      })
      return { kind: 'conflict', bytes: 0 }
    }

    if (!persistence?.open) {
      warnings.push({
        id,
        message: `“${remoteSession.title}” has newer messages, but the session store is unavailable. Reopen the app to import it.`,
      })
      return { kind: 'deferred', bytes: 0 }
    }

    let handle
    try {
      handle = await persistence.open(id, 'write')
      const { events } = await handle.read()
      const diskRows = [remoteSession.rows[0], ...events]
      relation = compareSessionRows(diskRows, remoteSession.rows)
      if (relation === 'local-prefix') {
        await handle.append(remoteSession.events.slice(events.length))
        await handle.flush()
        await this.attachToWorkspace(id, target)
        return { kind: 'updated', bytes: buffer.length }
      }
      if (relation === 'diverged') {
        const timestamp = Date.now()
        const copy = path.join(
          this.paths.conflicts,
          `${id}-${device.id.slice(0, 8)}-${timestamp}.jsonl.zstd`,
        )
        await writeFileAtomic(copy, buffer, 0o600)
        conflicts.push({
          id,
          title: remoteSession.title,
          device: device.name,
          at: toIso(),
          localPath: local.file,
          copy,
          reason: 'This chat is open or changed locally, and the remote copy diverged.',
        })
        return { kind: 'conflict', bytes: 0 }
      }
      return { kind: 'equal', bytes: 0 }
    } catch (error) {
      if (String(error?.name || '').includes('AlreadyOwned')) {
        warnings.push({
          id,
          message: `“${remoteSession.title}” is open in this window. Its new messages will arrive on the next sync.`,
        })
        return { kind: 'deferred', bytes: 0 }
      }
      warnings.push({ id, message: `Could not merge “${remoteSession.title}”: ${errorMessage(error)}` })
      return { kind: 'failed', bytes: 0 }
    } finally {
      try {
        await handle?.close()
      } catch {}
    }
  }

  async importRemote(deviceList) {
    const local = await this.scanLocalSessions()
    const localById = new Map(local.sessions.map(session => [session.id, session]))
    const takenTitles = new Set(local.sessions.map(session => titleKey(session.title)))
    const conflicts = []
    const warnings = [...local.warnings]
    let imported = 0
    let updated = 0
    let renamed = 0
    let bytes = 0
    const remoteItems = []
    for (const device of deviceList) {
      if (device.current || !Array.isArray(device.manifest?.sessions)) continue
      for (const item of device.manifest.sessions) {
        remoteItems.push({ device, item })
      }
    }
    remoteItems.sort((a, b) => Number(a.item.updatedAt || 0) - Number(b.item.updatedAt || 0))

    for (const { device, item } of remoteItems) {
      if (!item?.id || !item?.file) continue
      const deviceRoot = path.join(this.paths.repo, 'devices', device.id)
      const file = path.resolve(deviceRoot, item.file)
      if (!file.startsWith(path.resolve(deviceRoot) + path.sep)) continue
      let buffer
      try {
        buffer = await fs.readFile(file)
      } catch {
        continue
      }
      let remoteSession
      try {
        remoteSession = decodeSession(buffer, item.id)
      } catch (error) {
        warnings.push({ id: item.id, message: `Skipped an unreadable remote chat: ${errorMessage(error)}` })
        continue
      }
      try {
        const outcome = await this.importOneSession({
          buffer,
          remoteSession,
          device,
          localById,
          takenTitles,
          conflicts,
          warnings,
        })
        if (outcome.kind === 'imported') imported += 1
        if (outcome.kind === 'updated') updated += 1
        if (outcome.renamed) renamed += 1
        bytes += outcome.bytes
        if (outcome.kind === 'imported' || outcome.kind === 'updated') {
          localById.set(item.id, { ...remoteSession, title: outcome.title || remoteSession.title, file })
        }
      } catch (error) {
        warnings.push({ id: item.id, message: `Could not import “${remoteSession.title}”: ${errorMessage(error)}` })
      }
    }

    for (const conflict of conflicts) {
      const existing = this.state.conflicts.findIndex(
        item => item.id === conflict.id && item.device === conflict.device,
      )
      if (existing === -1) this.state.conflicts.unshift(conflict)
      else this.state.conflicts[existing] = conflict
    }
    this.state.conflicts = this.dedupeConflicts(this.state.conflicts).slice(0, MAX_CONFLICTS)
    if (imported || updated) {
      this.activity(
        'pull',
        `${imported} new chat${imported === 1 ? '' : 's'}${updated ? `, ${updated} updated` : ''} received`,
        { code: 'pulled', data: { imported, updated } },
      )
    }
    return { imported, updated, renamed, conflicts, warnings, bytes }
  }

  /** Rename one local session, preferring the live title service. */
  async renameSessionTitle(sessionId, title) {
    const sessions = this.ctx?.get?.('sessions') || this.ctx?.sessions
    const live = sessions?.get?.(sessionId)
    const titleService = this.ctx?.get?.('sessionTitle') || this.ctx?.sessionTitle
    if (live && titleService?.rename) {
      try {
        await titleService.rename(live, title)
        return true
      } catch {
        // The session may no longer be live; fall through to the persistence seam.
      }
    }

    const persistence = this.getPersistence()
    if (!persistence?.open) return false
    const handle = await persistence.open(sessionId, 'write')
    try {
      const { events } = await handle.read()
      await handle.append([titleEvent(events.length, title)])
      await handle.flush()
    } finally {
      try {
        await handle.close()
      } catch {}
    }
    return true
  }

  /**
   * Rename duplicate local titles once, deterministically, so already-imported
   * chats are fixed too. The first sync after the upgrade performs this; later
   * syncs find unique titles and do nothing.
   */
  async disambiguateLocalTitles() {
    const persistence = this.getPersistence()
    const titleService = this.ctx?.get?.('sessionTitle') || this.ctx?.sessionTitle
    if (!persistence?.open && !titleService?.rename) return { renamed: 0, warnings: [] }
    const { sessions, warnings } = await this.scanLocalSessions()
    const groups = new Map()
    for (const session of sessions) {
      const key = titleKey(session.title)
      const group = groups.get(key)
      if (group) group.push(session)
      else groups.set(key, [session])
    }

    const taken = new Set(sessions.map(session => titleKey(session.title)))
    let renamed = 0
    for (const group of groups.values()) {
      if (group.length < 2) continue
      group.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
      for (const session of group.slice(1)) {
        const title = uniqueImportedTitle(session.title, this.state.deviceName, taken)
        if (title === session.title) continue
        try {
          if (await this.renameSessionTitle(session.id, title)) {
            taken.add(titleKey(title))
            renamed += 1
          } else {
            warnings.push({
              id: session.id,
              message: `“${session.title}” could not be renamed because the session store is unavailable.`,
            })
          }
        } catch (error) {
          if (String(error?.name || '').includes('AlreadyOwned')) {
            warnings.push({
              id: session.id,
              message: `“${session.title}” is open in this window; its duplicate title will be renamed on the next sync.`,
            })
          } else {
            warnings.push({
              id: session.id,
              message: `Could not rename duplicate “${session.title}”: ${errorMessage(error)}`,
            })
          }
        }
      }
    }
    if (renamed) {
      this.activity('success', `Renamed ${renamed} duplicate chat title${renamed === 1 ? '' : 's'}`, {
        code: 'renamed',
        data: { renamed },
      })
    }
    return { renamed, warnings }
  }

  async exportLocal() {
    const deviceId = this.state.deviceId
    const deviceRoot = path.join(this.paths.repo, 'devices', deviceId)
    const sessionsRoot = path.join(deviceRoot, 'sessions')
    const { sessions, warnings } = await this.scanLocalSessions()
    const expected = new Set()
    const manifestSessions = []
    let exported = 0
    let bytes = 0

    for (const session of sessions) {
      const key = projectKey(session.workspacePath)
      const fileName = `session.v${session.header.version}.jsonl.zstd`
      const relative = `sessions/${key}/${session.id}/${fileName}`
      const destination = path.join(deviceRoot, relative)
      expected.add(path.resolve(destination))
      manifestSessions.push({
        id: session.id,
        title: session.title,
        workspacePath: session.workspacePath,
        workspaceTitle: baseNameOf(session.workspacePath) || 'Chats',
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messages: session.messageCount,
        size: session.bytes,
        hash: session.hash,
        file: relative,
      })
      const existing = await pathExists(destination)
      const unchanged = this.state.exported[session.id] === session.hash
      if (existing && unchanged) continue
      if (existing) {
        try {
          const current = await fs.readFile(destination)
          if (sha256(current) === session.hash) {
            this.state.exported[session.id] = session.hash
            continue
          }
        } catch {}
      }
      await ensureDir(path.dirname(destination))
      const temp = `${destination}.${process.pid}.tmp`
      await fs.writeFile(temp, await fs.readFile(session.file))
      await fs.rename(temp, destination)
      this.state.exported[session.id] = session.hash
      exported += 1
      bytes += session.bytes
      this.setPhase('uploading', `Preparing “${session.title}”…`, 68 + Math.min(18, (exported / Math.max(1, sessions.length)) * 18))
    }

    for (const session of sessions) {
      if (!this.state.exported[session.id]) this.state.exported[session.id] = session.hash
    }
    const kept = new Set(sessions.map(session => session.id))
    for (const id of Object.keys(this.state.exported)) {
      if (!kept.has(id)) delete this.state.exported[id]
    }

    const files = await listFiles(sessionsRoot)
    for (const file of files) {
      if (!expected.has(path.resolve(file))) await fs.rm(file, { force: true })
    }
    await this.pruneEmptyDirs(sessionsRoot)

    let attachments = { files: 0, bytes: 0 }
    if (this.config.includeAttachments) {
      attachments = await this.exportAttachments(deviceId)
    } else {
      await fs.rm(path.join(deviceRoot, 'attachments'), { recursive: true, force: true }).catch(() => {})
    }

    const previousDevice = await readJson(path.join(deviceRoot, 'device.json'), {})
    const now = toIso()
    const device = {
      version: 1,
      id: deviceId,
      name: this.state.deviceName,
      hostname: os.hostname(),
      platform: process.platform,
      app: 'DeepSeek Harness',
      createdAt: previousDevice.createdAt || this.state.createdAt || now,
      lastSyncAt: now,
      chats: manifestSessions.length,
      bytes: manifestSessions.reduce((sum, item) => sum + item.size, 0),
    }
    const manifest = {
      version: 1,
      generatedAt: now,
      device: { id: device.id, name: device.name, platform: device.platform },
      sessions: manifestSessions.sort((a, b) => b.updatedAt - a.updatedAt),
      attachments,
    }
    await writeJsonAtomic(path.join(deviceRoot, 'device.json'), device)
    await writeJsonAtomic(path.join(deviceRoot, 'manifest.json'), manifest)
    return { exported, bytes, warnings, count: manifestSessions.length }
  }

  async pruneEmptyDirs(root) {
    let entries
    try {
      entries = await fs.readdir(root, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const dir = path.join(root, entry.name)
      await this.pruneEmptyDirs(dir)
      try {
        if ((await fs.readdir(dir)).length === 0) await fs.rmdir(dir)
      } catch {}
    }
  }

  async exportAttachments(deviceId) {
    const destinationRoot = path.join(this.paths.repo, 'devices', deviceId, 'attachments')
    const files = await listFiles(this.attachmentsRoot)
    let copied = 0
    let bytes = 0
    for (const file of files) {
      const relative = path.relative(this.attachmentsRoot, file)
      const destination = path.join(destinationRoot, relative)
      if (await pathExists(destination)) continue
      await ensureDir(path.dirname(destination))
      await fs.copyFile(file, destination)
      const stat = await fs.stat(destination)
      copied += 1
      bytes += stat.size
    }
    return { files: copied, bytes }
  }

  async importAttachments(deviceList) {
    let copied = 0
    for (const device of deviceList) {
      if (device.current) continue
      const root = path.join(this.paths.repo, 'devices', device.id, 'attachments')
      const files = await listFiles(root)
      for (const file of files) {
        const relative = path.relative(root, file)
        const destination = path.join(this.attachmentsRoot, relative)
        if (await pathExists(destination)) continue
        await ensureDir(path.dirname(destination))
        await fs.copyFile(file, destination)
        copied += 1
      }
    }
    return copied
  }
}
