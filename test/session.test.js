import assert from 'node:assert/strict'
import { test } from 'node:test'

import { zstdDecompressSync } from 'node:zlib'

import {
  compareSessionRows,
  decodeSession,
  encodeRows,
  isSyncableSession,
  projectKey,
  zstdFrameEnd,
} from '../lib/session.js'

function makeRows(id, texts) {
  const header = {
    type: 'session',
    version: 4,
    id,
    createdAt: 1700000000000,
    cwd: 'D:\\work\\demo',
    isSeeded: false,
    delegationDepth: 0,
    agentPreset: 'standard',
  }
  const events = texts.flatMap((text, index) => [
    {
      type: 'user/message',
      seq: index * 2,
      time: 1700000000100 + index * 100,
      data: { content: [{ type: 'text', text }], role: 'user', id: `u-${index}` },
    },
    {
      type: 'assistant/message',
      seq: index * 2 + 1,
      time: 1700000000150 + index * 100,
      data: { content: [{ type: 'text', text: `re: ${text}` }], role: 'assistant', id: `a-${index}` },
    },
  ])
  return [header, ...events]
}

test('decodes a compressed session and derives its title and counts', () => {
  const id = 'session-11111111-1111-4111-8111-111111111111'
  const rows = makeRows(id, ['Hello there'])
  rows.push({
    type: 'session/title',
    seq: 2,
    time: 1700000000200,
    data: { title: 'Hello session' },
  })
  const session = decodeSession(encodeRows(rows), id)
  assert.equal(session.id, id)
  assert.equal(session.title, 'Hello session')
  assert.equal(session.messageCount, 1)
  assert.equal(session.events.length, 3)
  assert.equal(session.workspacePath, 'D:\\work\\demo')
})

test('accepts a self-contained seeded fork but rejects any child session', () => {
  const id = 'session-55555555-5555-4555-8555-555555555555'
  const forkRows = makeRows(id, ['fork'])
  forkRows[0].isSeeded = true
  forkRows.push({
    type: 'session/end-seed',
    seq: 2,
    time: 1700000000200,
    data: { inherited: true },
  })
  forkRows.push({
    type: 'session/title',
    seq: 3,
    time: 1700000000300,
    data: { title: 'Forked chat' },
  })
  const fork = decodeSession(encodeRows(forkRows), id)
  assert.equal(fork.seeded, true)
  assert.equal(fork.inheritedEventCount, 3)
  assert.equal(isSyncableSession(fork), true)

  const childRows = makeRows(id, ['child'])
  childRows[0].isSeeded = true
  childRows[0].parentSession = 'session-parent'
  childRows[0].origin = 'subagent'
  const child = decodeSession(encodeRows(childRows), id)
  assert.equal(isSyncableSession(child), false)

  const spawnedRows = makeRows(id, ['spawned'])
  spawnedRows[0].parentSession = 'session-parent'
  spawnedRows[0].origin = 'subagent'
  spawnedRows[0].delegationDepth = 1
  const spawned = decodeSession(encodeRows(spawnedRows), id)
  assert.equal(isSyncableSession(spawned), false)

  const markerlessRows = makeRows(id, ['markerless'])
  markerlessRows[0].isSeeded = true
  const markerless = decodeSession(encodeRows(markerlessRows), id)
  assert.equal(isSyncableSession(markerless), false)
})

test('writes a standalone header frame before the events', () => {
  const id = 'session-12121212-1212-4212-8212-121212121212'
  const encoded = encodeRows(makeRows(id, ['Hello']))
  const firstEnd = zstdFrameEnd(encoded, 0)
  const first = zstdDecompressSync(encoded.subarray(0, firstEnd)).toString('utf8')
  const headerLines = first.trim().split('\n')
  assert.equal(headerLines.length, 1)
  assert.equal(JSON.parse(headerLines[0]).type, 'session')
  assert.ok(firstEnd < encoded.length, 'events must follow in another frame')
})

test('rejects a log whose event sequence has a gap', () => {
  const id = 'session-22222222-2222-4222-8222-222222222222'
  const rows = makeRows(id, ['one'])
  rows[2].seq = 9
  assert.throws(() => decodeSession(encodeRows(rows), id), /not contiguous/)
})

test('compares append-only histories without treating the project path as content', () => {
  const id = 'session-33333333-3333-4333-8333-333333333333'
  const rows = makeRows(id, ['one'])
  const longer = makeRows(id, ['one', 'two'])
  longer[0].cwd = '/Users/other/project'
  assert.equal(compareSessionRows(rows, rows), 'equal')
  assert.equal(compareSessionRows(rows, longer), 'local-prefix')
  assert.equal(compareSessionRows(longer, rows), 'remote-prefix')
})

test('ignores timestamps on an untagged end-seed boundary', () => {
  const id = 'session-45454545-4545-4545-8545-454545454545'
  const local = makeRows(id, ['one'])
  local.push({
    type: 'session/end-seed',
    seq: 2,
    time: 1700000000200,
    data: {},
  })
  local.push({
    type: 'session/title',
    seq: 3,
    time: 1700000000300,
    data: { title: 'continued' },
  })
  const remote = makeRows(id, ['one'])
  remote.push({
    type: 'session/end-seed',
    seq: 2,
    time: 1700000000900,
    data: {},
  })
  assert.equal(compareSessionRows(local, remote), 'remote-prefix')
  assert.equal(compareSessionRows(remote, local), 'local-prefix')

  const same = makeRows(id, ['one'])
  same.push({
    type: 'session/end-seed',
    seq: 2,
    time: 1700000000200,
    data: {},
  })
  assert.equal(compareSessionRows(same, remote), 'equal')

  const tagged = remote.map(row => ({ ...row }))
  tagged[2].data = { inherited: true }
  assert.equal(compareSessionRows(local, tagged), 'diverged')

  const differentData = remote.map(row => ({ ...row }))
  differentData[2].data = { boundary: 'other' }
  assert.equal(compareSessionRows(local, differentData), 'diverged')
})

test('detects divergent histories', () => {
  const id = 'session-44444444-4444-4444-8444-444444444444'
  const left = makeRows(id, ['one'])
  const right = makeRows(id, ['different'])
  assert.equal(compareSessionRows(left, right), 'diverged')
})

test('project keys mirror the DSH readable project directory', () => {
  assert.equal(projectKey('D:\\My Drive\\DeepSeekHarness'), '--D-My~0020Drive-DeepSeekHarness--')
  assert.equal(projectKey('/home/user/demo'), '--home-user-demo--')
  assert.equal(projectKey(undefined), '_no-cwd')
})
