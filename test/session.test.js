import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  compareSessionRows,
  decodeSession,
  encodeRows,
  projectKey,
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
