/** Title helpers for disambiguating imported conversations. */

/** Collapse whitespace without changing visible characters. */
export function normalizeTitle(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Case-insensitive comparison key for a title. */
export function titleKey(value) {
  return normalizeTitle(value).toLocaleLowerCase()
}

/** Clip a string without splitting a UTF-8 code point. */
export function truncateUtf8(value, maxBytes) {
  const text = String(value ?? '')
  if (Buffer.byteLength(text, 'utf8') <= maxBytes) return text
  let result = ''
  for (const character of text) {
    if (Buffer.byteLength(result + character, 'utf8') > maxBytes) break
    result += character
  }
  return result.trimEnd()
}

/**
 * Pick a unique title for an imported chat.
 *
 * When the incoming title is already used by another local chat, append the
 * source computer's name. If that still collides, append an increasing number.
 * The result is kept within DSH's title byte limit (80 bytes by default).
 *
 * @param {string} title - title from the remote manifest/log.
 * @param {string} deviceName - source computer name.
 * @param {Set<string>} taken - normalized keys already present locally.
 * @param {number} [maxBytes] - DSH title byte limit.
 * @returns {string} a title not present in `taken`.
 */
export function uniqueImportedTitle(title, deviceName, taken, maxBytes = 80) {
  const base = normalizeTitle(title) || 'Без названия'
  if (!taken.has(titleKey(base))) return truncateUtf8(base, maxBytes)

  const source = normalizeTitle(deviceName) || 'Другой ПК'
  const suffix = ` · ${source}`
  const alreadySuffixed = titleKey(base).endsWith(titleKey(suffix))

  if (alreadySuffixed) {
    for (let number = 2; number < 10_000; number += 1) {
      const candidate = truncateUtf8(`${base} ${number}`, maxBytes)
      if (!taken.has(titleKey(candidate))) return candidate
    }
    return truncateUtf8(`${base} ${Date.now().toString(36)}`, maxBytes)
  }

  const make = extra => {
    const tail = `${suffix}${extra}`
    const room = Math.max(1, maxBytes - Buffer.byteLength(tail, 'utf8'))
    const stem = truncateUtf8(base, room)
    return `${stem}${tail}`
  }

  let candidate = make('')
  if (!taken.has(titleKey(candidate))) return candidate

  for (let number = 2; number < 10_000; number += 1) {
    candidate = make(` ${number}`)
    if (!taken.has(titleKey(candidate))) return candidate
  }
  return make(` ${Date.now().toString(36)}`)
}

/** Build the log event used to rename an imported session. */
export function titleEvent(seq, title) {
  return {
    type: 'session/title',
    seq,
    time: Date.now(),
    data: {
      title,
      messageSeqs: [],
      source: { kind: 'user' },
    },
  }
}
