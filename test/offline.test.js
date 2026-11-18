import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import {
  applyReplacement,
  chooseRemoteCandidate,
  projectionCachePath,
  scanLocalInventory,
} from '../lib/offline.js'
import { decodeSession, encodeRows } from '../lib/session.js'

const WORKSPACE = 'D:\\work\\demo'

function rows(id, texts, extra = {}) {
  const header = {
    type: 'session',
    version: 4,
    id,
    createdAt: 1700000000000,
    cwd: WORKSPACE,
    isSeeded: false,
    delegationDepth: 0,
    ...extra,
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

function session(id, texts, extra) {
  return decodeSession(encodeRows(rows(id, texts, extra)), id)
}

test('offline chooser replaces only a clean local prefix with the longest chain', () => {
  const id = 'session-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const local = session(id, ['one'])
  const short = session(id, ['one', 'two'])
  const long = session(id, ['one', 'two', 'three'])
  assert.equal(chooseRemoteCandidate({ session: local }, [{ session: short }]).action, 'replace')
  assert.equal(chooseRemoteCandidate({ session: local }, [{ session: long }, { session: short }]).candidate.session, long)
  assert.equal(chooseRemoteCandidate({ session: long }, [{ session: local }]).action, 'keep-local')

  const equal = local
  assert.equal(
    chooseRemoteCandidate({ session: local }, [{ session: equal }, { session: short }]).candidate.session,
    short,
  )
  assert.equal(
    chooseRemoteCandidate({ session: local }, [{ session: short }, { session: short }]).candidate.session,
    short,
  )
  assert.equal(
    chooseRemoteCandidate({ session: local }, [{ session: long }, { session: short }, { session: short }]).candidate.session,
    long,
  )
})

test('offline chooser quarantines divergent and competing remote branches', () => {
  const id = 'session-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const local = session(id, ['one'])
  const divergent = session(id, ['different'])
  assert.equal(chooseRemoteCandidate({ session: local }, [{ session: divergent }]).action, 'conflict')
  assert.equal(
    chooseRemoteCandidate({ session: local }, [{ session: local }, { session: divergent }]).action,
    'conflict',
  )

  const branchA = session(id, ['one', 'a'])
  const branchB = session(id, ['one', 'b'])
  assert.equal(
    chooseRemoteCandidate({ session: local }, [{ session: branchA }, { session: branchB }]).action,
    'conflict',
  )
})

test('offline inventory preserves invalid local ids and marks duplicates', async t => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-sync-offline-inventory-'))
  t.after(() => fs.rm(home, { recursive: true, force: true }))
  const id = 'session-cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  const dir = path.join(home, 'sessions', '--D-work-demo--', id)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, 'session.v4.jsonl.zstd'), Buffer.from('not-a-session'))
  const inventory = await scanLocalInventory(home)
  assert.equal(inventory.byId.has(id), true)
  assert.equal(Boolean(inventory.byId.get(id).session), false)
})

test('offline replacement writes a file, keeps a backup and clears projection cache', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-sync-offline-apply-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const home = path.join(root, 'home')
  const journal = path.join(root, 'journal')
  const id = 'session-dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  const dir = path.join(home, 'sessions', '--D-work-demo--', id)
  await fs.mkdir(dir, { recursive: true })
  const localBuffer = encodeRows(rows(id, ['one']))
  const localFile = path.join(dir, 'session.v4.jsonl.zstd')
  await fs.writeFile(localFile, localBuffer)
  const cache = projectionCachePath(home, id)
  await fs.mkdir(path.dirname(cache), { recursive: true })
  await fs.writeFile(cache, '{}')

  const inventory = await scanLocalInventory(home)
  const candidate = session(id, ['one', 'two'])
  const result = await applyReplacement({
    home,
    local: inventory.byId.get(id),
    candidate: { session: candidate, buffer: encodeRows(rows(id, ['one', 'two'])) },
    journalDir: journal,
  })
  assert.equal(result.changed, true)
  assert.equal(result.cacheRemoved, true)
  assert.equal(await fs.readFile(localFile).then(b => decodeSession(b, id).messageCount), 2)
  assert.equal(await fs.readFile(path.join(journal, 'backups', `${id}.jsonl.zstd`)).then(b => b.length), localBuffer.length)
  await assert.rejects(fs.access(cache))
})
