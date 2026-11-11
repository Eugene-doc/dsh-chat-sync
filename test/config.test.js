import assert from 'node:assert/strict'
import { test } from 'node:test'

import { defaultConfig, validateConfigPatch } from '../lib/config.js'
import { parseRemote } from '../lib/util.js'

test('accepts the compact owner/repo form and normalizes to GitHub HTTPS', () => {
  assert.deepEqual(parseRemote('Eugene-doc/dsh-sync'), {
    ok: true,
    remote: 'https://github.com/Eugene-doc/dsh-sync.git',
    owner: 'Eugene-doc',
    name: 'dsh-sync',
    webUrl: 'https://github.com/Eugene-doc/dsh-sync',
  })
})

test('accepts HTTPS and SSH addresses and strips .git', () => {
  assert.equal(parseRemote('https://github.com/Eugene-doc/dsh-sync.git').name, 'dsh-sync')
  assert.equal(parseRemote('git@github.com:Eugene-doc/dsh-sync.git').remote, 'git@github.com:Eugene-doc/dsh-sync.git')
  assert.equal(parseRemote('https://example.com/owner/repo').ok, false)
})

test('configuration validation refuses unsafe branches and unknown intervals', () => {
  const base = defaultConfig()
  assert.equal(validateConfigPatch(base, { branch: 'main' }).ok, true)
  assert.equal(validateConfigPatch(base, { branch: '--upload-pack=evil' }).ok, false)
  assert.equal(validateConfigPatch(base, { branch: 'a..b' }).ok, false)
  assert.equal(validateConfigPatch(base, { intervalMinutes: 7 }).ok, false)
  assert.equal(validateConfigPatch(base, { autoSync: 'yes' }).ok, false)
  assert.equal(validateConfigPatch(base, { includeAttachments: true }).config.includeAttachments, true)
})
