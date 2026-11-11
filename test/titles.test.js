import assert from 'node:assert/strict'
import { test } from 'node:test'

import { normalizeTitle, titleEvent, titleKey, truncateUtf8, uniqueImportedTitle } from '../lib/titles.js'

test('normalizes whitespace and comparison keys', () => {
  assert.equal(normalizeTitle('  Привет   мир \n'), 'Привет мир')
  assert.equal(titleKey('  ПРИВЕТ мир '), 'привет мир')
})

test('leaves a unique title unchanged', () => {
  assert.equal(uniqueImportedTitle('Программа рядом', 'Other PC', new Set()), 'Программа рядом')
})

test('adds the source computer to a duplicate title', () => {
  const taken = new Set([titleKey('Программа рядом')])
  assert.equal(
    uniqueImportedTitle('Программа рядом', 'Other PC', taken),
    'Программа рядом · Other PC',
  )
})

test('adds a number when the suffixed title also exists', () => {
  const taken = new Set([titleKey('Программа рядом'), titleKey('Программа рядом · Other PC')])
  assert.equal(
    uniqueImportedTitle('Программа рядом', 'Other PC', taken),
    'Программа рядом · Other PC 2',
  )
})

test('does not duplicate a suffix that is already present', () => {
  const taken = new Set([titleKey('Программа рядом · Other PC')])
  assert.equal(
    uniqueImportedTitle('Программа рядом · Other PC', 'Other PC', taken),
    'Программа рядом · Other PC 2',
  )
})

test('keeps the title within the DSH byte limit', () => {
  const title = 'Очень длинное название '.repeat(20)
  const result = uniqueImportedTitle(title, 'Компьютер', new Set([titleKey(title)]), 80)
  assert.ok(Buffer.byteLength(result, 'utf8') <= 80, `${Buffer.byteLength(result, 'utf8')} bytes`)
  assert.match(result, / · Компьютер$/)
})

test('truncates UTF-8 without inventing characters', () => {
  assert.equal(truncateUtf8('Привет', 4), 'Пр')
  assert.equal(truncateUtf8('Привет', 80), 'Привет')
})

test('builds a user title event with no source messages', () => {
  const event = titleEvent(7, 'Название · Other PC')
  assert.equal(event.type, 'session/title')
  assert.equal(event.seq, 7)
  assert.deepEqual(event.data, {
    title: 'Название · Other PC',
    messageSeqs: [],
    source: { kind: 'user' },
  })
})
