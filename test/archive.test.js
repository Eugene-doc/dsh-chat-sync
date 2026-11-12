import assert from 'node:assert/strict'
import { test } from 'node:test'

import { archiveSnapshot, mergeArchiveStates } from '../lib/archive.js'

test('newer archive flag wins over an older one', () => {
  const merged = mergeArchiveStates([
    { deviceId: 'pc-a', states: { s1: { archived: true, updatedAt: '2026-01-01T00:00:00Z' } } },
    { deviceId: 'pc-b', states: { s1: { archived: false, updatedAt: '2026-01-02T00:00:00Z' } } },
  ])
  assert.equal(merged.get('s1').archived, false)
  assert.equal(merged.get('s1').updatedAt, '2026-01-02T00:00:00.000Z')
})

test('a tie is resolved deterministically by device id', () => {
  const merged = mergeArchiveStates([
    { deviceId: 'pc-a', states: { s1: { archived: true, updatedAt: '2026-01-01T00:00:00Z' } } },
    { deviceId: 'pc-b', states: { s1: { archived: false, updatedAt: '2026-01-01T00:00:00Z' } } },
  ])
  assert.equal(merged.get('s1').archived, false)
})

test('invalid entries are ignored', () => {
  const merged = mergeArchiveStates([
    { deviceId: 'pc-a', states: { s1: { archived: 'yes', updatedAt: 'bad' }, s2: null } },
  ])
  assert.equal(merged.size, 0)
})

test('snapshot has a stable schema', () => {
  const snapshot = archiveSnapshot({ s1: { archived: true, updatedAt: '2026-01-01T00:00:00Z' } }, 'pc-a')
  assert.equal(snapshot.version, 1)
  assert.equal(snapshot.deviceId, 'pc-a')
  assert.equal(snapshot.states.s1.archived, true)
})
