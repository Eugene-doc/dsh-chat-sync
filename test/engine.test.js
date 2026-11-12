import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import { ChatSyncEngine } from '../lib/engine.js'
import { encodeRows } from '../lib/session.js'
import { writeJsonAtomic } from '../lib/util.js'

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

async function makeRelay(root) {
  const bare = path.join(root, 'relay.git')
  git(root, 'init', '--bare', bare)
  const seed = path.join(root, 'seed')
  git(root, 'clone', bare, seed)
  git(seed, 'config', 'user.name', 'Test')
  git(seed, 'config', 'user.email', 'test@example.com')
  await fs.mkdir(path.join(seed, 'devices', 'other'), { recursive: true })
  const id = 'session-55555555-5555-4555-8555-555555555555'
  const rows = [
    {
      type: 'session',
      version: 4,
      id,
      createdAt: 1700000000000,
      cwd: 'D:\\work\\demo',
      isSeeded: false,
      delegationDepth: 0,
    },
    {
      type: 'user/message',
      seq: 0,
      time: 1700000000100,
      data: { content: [{ type: 'text', text: 'From the other computer' }], role: 'user', id: 'u1' },
    },
    {
      type: 'session/title',
      seq: 1,
      time: 1700000000200,
      data: { title: 'Remote conversation' },
    },
  ]
  const file = 'sessions/--D-work-demo--/' + id + '/session.v4.jsonl.zstd'
  await fs.mkdir(path.dirname(path.join(seed, 'devices', 'other', file)), { recursive: true })
  await fs.writeFile(path.join(seed, 'devices', 'other', file), encodeRows(rows))
  await writeJsonAtomic(path.join(seed, 'devices', 'other', 'device.json'), {
    version: 1,
    id: 'other',
    name: 'Other PC',
    platform: 'darwin',
    lastSyncAt: new Date().toISOString(),
    chats: 1,
  })
  await writeJsonAtomic(path.join(seed, 'devices', 'other', 'manifest.json'), {
    version: 1,
    generatedAt: new Date().toISOString(),
    device: { id: 'other', name: 'Other PC', platform: 'darwin' },
    sessions: [
      {
        id,
        title: 'Remote conversation',
        workspacePath: 'D:\\work\\demo',
        workspaceTitle: 'demo',
        createdAt: 1700000000000,
        updatedAt: 1700000000200,
        messages: 1,
        size: 1,
        hash: 'x',
        file,
      },
    ],
    attachments: { files: 0, bytes: 0 },
  })
  git(seed, 'add', '-A')
  git(seed, 'commit', '-m', 'seed remote device')
  git(seed, 'push', 'origin', 'HEAD:main')
  return bare
}

async function addSecondRemoteSession(root, id, title) {
  const seed = path.join(root, 'seed')
  const rows = [
    {
      type: 'session',
      version: 4,
      id,
      createdAt: 1700000000500,
      cwd: 'D:\\work\\demo',
      isSeeded: false,
      delegationDepth: 0,
    },
    {
      type: 'session/title',
      seq: 0,
      time: 1700000000600,
      data: { title, messageSeqs: [], source: { kind: 'fallback' } },
    },
  ]
  const relative = 'sessions/--D-work-demo--/' + id + '/session.v4.jsonl.zstd'
  await fs.mkdir(path.dirname(path.join(seed, 'devices', 'other', relative)), { recursive: true })
  await fs.writeFile(path.join(seed, 'devices', 'other', relative), encodeRows(rows))
  const manifestPath = path.join(seed, 'devices', 'other', 'manifest.json')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  manifest.sessions.push({
    id,
    title,
    workspacePath: 'D:\\work\\demo',
    workspaceTitle: 'demo',
    createdAt: 1700000000500,
    updatedAt: 1700000000600,
    messages: 0,
    size: 1,
    hash: 'y',
    file: relative,
  })
  await writeJsonAtomic(manifestPath, manifest)
  git(seed, 'add', '-A')
  git(seed, 'commit', '-m', 'seed duplicate title')
  git(seed, 'push', 'origin', 'HEAD:main')
}

function fakeContext() {
  const store = new Map()
  const attached = []
  class Handle {
    constructor(id) {
      this.id = id
      this.closed = false
    }
    async read() {
      return { events: store.get(this.id)?.events.slice() || [] }
    }
    async append(events) {
      store.get(this.id).events.push(...events)
    }
    async flush() {}
    async close() {
      this.closed = true
    }
  }
  const persistence = {
    async create(header) {
      store.set(header.id, { header, events: [] })
      return new Handle(header.id)
    },
    async open(id) {
      if (!store.has(id)) throw new Error('missing')
      return new Handle(id)
    },
    async stat(id) {
      return store.has(id) ? { header: store.get(id).header } : undefined
    },
  }
  const workspace = {
    path: 'D:\\work\\demo',
    title: 'demo',
    sessionIds: [],
    attachSession: async id => {
      if (!workspace.sessionIds.includes(id)) workspace.sessionIds.push(id)
      attached.push(id)
    },
  }
  const archivedSessionIds = []
  const registry = {
    list: () => [workspace],
    archivedSessionIds,
    async unarchiveSession(id) {
      const index = archivedSessionIds.indexOf(id)
      if (index !== -1) archivedSessionIds.splice(index, 1)
    },
  }
  return {
    store,
    attached,
    registry,
    workspace,
    ctx: {
      get(name) {
        if (name === 'sessionPersistence') return persistence
        if (name === 'workspaceRegistry') return registry
        return undefined
      },
    },
  }
}

test('imports a remote session through the persistence seam and attaches it to a workspace', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-sync-engine-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const bare = await makeRelay(root)
  const home = path.join(root, 'home')
  await fs.mkdir(path.join(home, 'sessions'), { recursive: true })
  const fake = fakeContext()
  const engine = new ChatSyncEngine(fake.ctx, { home, log: () => {} })
  await engine.init()
  engine.config.remote = bare
  engine.config.branch = 'main'
  engine.config.autoSync = false

  const result = await engine.runSync()
  assert.equal(result.ok, true, result.error)
  assert.equal(result.imported, 1)
  const id = 'session-55555555-5555-4555-8555-555555555555'
  assert.equal(fake.store.get(id).events.length, 2)
  assert.deepEqual(fake.attached, [id])
  assert.equal(fake.store.get(id).header.cwd, 'D:\\work\\demo')
  const status = await engine.getStatus()
  assert.equal(status.stats.localChats, 0) // the fake store has no filesystem log
  assert.equal(status.devices.length, 2)
})

test('adds the source computer name when an imported title is already used', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-sync-titles-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const bare = await makeRelay(root)
  const secondId = 'session-66666666-6666-4666-8666-666666666666'
  await addSecondRemoteSession(root, secondId, 'Remote conversation')
  const home = path.join(root, 'home')
  await fs.mkdir(path.join(home, 'sessions'), { recursive: true })
  const fake = fakeContext()
  const engine = new ChatSyncEngine(fake.ctx, { home, log: () => {} })
  await engine.init()
  engine.config.remote = bare
  engine.config.branch = 'main'
  engine.config.autoSync = false

  const result = await engine.runSync()
  assert.equal(result.ok, true, result.error)
  assert.equal(result.imported, 2)
  const titleEvents = fake.store.get(secondId).events.filter(event => event.type === 'session/title')
  assert.equal(titleEvents.at(-1).data.title, 'Remote conversation · Other PC')
  assert.deepEqual(titleEvents.at(-1).data.source, { kind: 'user' })
})

test('renames duplicate local titles with the current computer name', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-sync-local-titles-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const home = path.join(root, 'home')
  const fake = fakeContext()
  const make = async (id, createdAt) => {
    const rows = [
      {
        type: 'session',
        version: 4,
        id,
        createdAt,
        cwd: 'D:\\work\\demo',
        isSeeded: false,
        delegationDepth: 0,
      },
      {
        type: 'session/title',
        seq: 0,
        time: createdAt + 1,
        data: { title: 'Same title', messageSeqs: [], source: { kind: 'fallback' } },
      },
    ]
    const dir = path.join(home, 'sessions', '--D-work-demo--', id)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'session.v4.jsonl.zstd'), encodeRows(rows))
    fake.store.set(id, { header: rows[0], events: rows.slice(1) })
  }
  await make('session-77777777-7777-4777-8777-777777777777', 1700000000000)
  await make('session-88888888-8888-4888-8888-888888888888', 1700000001000)
  const engine = new ChatSyncEngine(fake.ctx, { home, log: () => {} })
  await engine.init()
  engine.state.deviceName = 'This PC'
  const result = await engine.disambiguateLocalTitles()
  assert.equal(result.renamed, 1)
  const titleEvents = fake.store
    .get('session-88888888-8888-4888-8888-888888888888')
    .events.filter(event => event.type === 'session/title')
  assert.equal(titleEvents.at(-1).data.title, 'Same title · This PC')
})

test('attaches all local sessions and restores them from the archive', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-sync-repair-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const home = path.join(root, 'home')
  const fake = fakeContext()
  const ids = [
    'session-99999999-9999-4999-8999-999999999999',
    'session-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  ]
  for (const [index, id] of ids.entries()) {
    const rows = [
      {
        type: 'session',
        version: 4,
        id,
        createdAt: 1700000000000 + index,
        cwd: 'D:\\work\\demo',
        isSeeded: false,
        delegationDepth: 0,
      },
      {
        type: 'session/title',
        seq: 0,
        time: 1700000000001 + index,
        data: { title: `Chat ${index}`, messageSeqs: [], source: { kind: 'fallback' } },
      },
    ]
    const dir = path.join(home, 'sessions', '--D-work-demo--', id)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'session.v4.jsonl.zstd'), encodeRows(rows))
  }
  fake.registry.archivedSessionIds.push(ids[1])
  const engine = new ChatSyncEngine(fake.ctx, { home, log: () => {} })
  await engine.init()
  const result = await engine.repairGrouping({ unarchive: true })
  assert.equal(result.total, 2)
  assert.equal(result.attached, 2)
  assert.equal(result.unarchived, 1)
  assert.deepEqual(fake.workspace.sessionIds.sort(), ids.slice().sort())
  assert.deepEqual(fake.registry.archivedSessionIds, [])
})

test('keeps diverged remote sessions as conflict copies instead of overwriting', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-sync-conflict-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const bare = await makeRelay(root)
  const home = path.join(root, 'home')
  const id = 'session-55555555-5555-4555-8555-555555555555'
  const localRows = [
    {
      type: 'session',
      version: 4,
      id,
      createdAt: 1700000000000,
      cwd: 'D:\\work\\demo',
      isSeeded: false,
      delegationDepth: 0,
    },
    {
      type: 'user/message',
      seq: 0,
      time: 1700000000100,
      data: { content: [{ type: 'text', text: 'A different local branch' }], role: 'user', id: 'u1' },
    },
  ]
  const dir = path.join(home, 'sessions', '--D-work-demo--', id)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, 'session.v4.jsonl.zstd'), encodeRows(localRows))
  const fake = fakeContext()
  const engine = new ChatSyncEngine(fake.ctx, { home, log: () => {} })
  await engine.init()
  engine.config.remote = bare
  engine.config.branch = 'main'
  engine.config.autoSync = false

  const result = await engine.runSync()
  assert.equal(result.ok, true, result.error)
  assert.equal(result.conflicts, 1)
  assert.equal((await fs.readdir(engine.paths.conflicts)).length, 1)
  assert.equal(fake.store.size, 0)
  assert.equal(engine.state.conflicts[0].title, 'Remote conversation')
})
