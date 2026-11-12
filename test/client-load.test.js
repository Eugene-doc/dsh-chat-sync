import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'

test('the client bundle parses and registers a plugin', () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
  let registration
  const context = {
    window: {
      __ModuleLoader__: {
        load(value) {
          registration = value
        },
      },
    },
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  }
  vm.runInNewContext(source, context, { filename: 'client.js' })
  assert.equal(registration?.id, 'dsh-chat-sync')
  const react = {
    createElement: () => null,
    useState: value => [value, () => {}],
    useRef: value => ({ current: value }),
    useEffect: () => {},
    useCallback: value => value,
    Fragment: {},
  }
  const plugin = registration.factory(id => {
    if (id === 'react') return react
    throw new Error(`unexpected import: ${id}`)
  })
  assert.ok(plugin)
  assert.equal(typeof plugin.apply, 'function')
})
