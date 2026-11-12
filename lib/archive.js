/** Last-write-wins merge for archive state exported by every computer. */

/** Parse a timestamp safely; malformed values sort as the oldest state. */
function timestampOf(value) {
  const time = Date.parse(value || '')
  return Number.isFinite(time) ? time : 0
}

/**
 * Merge archive snapshots by per-session update time.
 *
 * @param {Array<{deviceId: string, states: Record<string, {archived: boolean, updatedAt: string}>}>} sources
 * @returns {Map<string, {archived: boolean, updatedAt: string, deviceId: string}>}
 */
export function mergeArchiveStates(sources) {
  const chosen = new Map()
  for (const source of sources || []) {
    const deviceId = String(source?.deviceId || '')
    for (const [sessionId, state] of Object.entries(source?.states || {})) {
      if (!sessionId || !state || typeof state.archived !== 'boolean') continue
      const at = timestampOf(state.updatedAt)
      const previous = chosen.get(sessionId)
      const newer =
        !previous ||
        at > previous.at ||
        (at === previous.at && deviceId.localeCompare(previous.deviceId) > 0)
      if (newer) {
        chosen.set(sessionId, {
          archived: state.archived,
          updatedAt: at > 0 ? new Date(at).toISOString() : new Date(0).toISOString(),
          at,
          deviceId,
        })
      }
    }
  }
  return chosen
}

/** Build one device's archive snapshot for `archive.json`. */
export function archiveSnapshot(states, deviceId, now = new Date().toISOString()) {
  return {
    version: 1,
    deviceId,
    updatedAt: now,
    states,
  }
}
