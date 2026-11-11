import { promises as fs } from 'node:fs'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { zstdCompressSync, zstdDecompressSync } from 'node:zlib'

import { listFiles, parseSessionFileName, sha256 } from './util.js'

const ZSTD_MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])
const MAX_SESSION_BYTES = 256 * 1024 * 1024

/** Length of one complete Zstandard frame starting at `offset`. */
export function zstdFrameEnd(buffer, offset) {
  if (offset + 5 > buffer.length || !buffer.subarray(offset, offset + 4).equals(ZSTD_MAGIC)) {
    throw new Error('invalid zstd frame')
  }
  const descriptor = buffer[offset + 4]
  if (descriptor & 8) throw new Error('reserved zstd frame bit')
  const singleSegment = Boolean(descriptor & 32)
  const contentSizeBytes = [singleSegment ? 1 : 0, 2, 4, 8][descriptor >>> 6]
  let cursor =
    offset +
    5 +
    (singleSegment ? 0 : 1) +
    [0, 1, 2, 4][descriptor & 3] +
    contentSizeBytes
  let last = false
  while (!last) {
    if (cursor + 3 > buffer.length) throw new Error('truncated zstd block header')
    const block = buffer.readUIntLE(cursor, 3)
    const type = (block >>> 1) & 3
    if (type === 3) throw new Error('reserved zstd block type')
    last = Boolean(block & 1)
    cursor += 3 + (type === 1 ? 1 : block >>> 3)
    if (cursor > buffer.length) throw new Error('truncated zstd block')
  }
  cursor += descriptor & 4 ? 4 : 0
  if (cursor > buffer.length) throw new Error('truncated zstd checksum')
  return cursor
}

/**
 * Decode every frame in a DSH session log. A torn tail is refused rather than
 * silently returning a shorter history.
 */
export function decodeZstdFrames(buffer, maxOutputBytes = MAX_SESSION_BYTES) {
  if (!buffer.subarray(0, 4).equals(ZSTD_MAGIC)) {
    throw new Error('not a zstd session log')
  }
  const chunks = []
  let decodedBytes = 0
  let offset = 0
  while (offset < buffer.length) {
    if (
      offset + 8 <= buffer.length &&
      (buffer.readUInt32LE(offset) & 0xfffffff0) === 0x184d2a50
    ) {
      const end = offset + 8 + buffer.readUInt32LE(offset + 4)
      if (end > buffer.length) throw new Error('truncated zstd skippable frame')
      offset = end
      continue
    }
    const end = zstdFrameEnd(buffer, offset)
    if (decodedBytes >= maxOutputBytes) throw new Error('session log is too large')
    const { buffer: output, engine } = zstdDecompressSync(buffer.subarray(offset, end), {
      info: true,
      maxOutputLength: maxOutputBytes - decodedBytes,
    })
    if (engine.bytesWritten !== end - offset) throw new Error('zstd frame was not fully consumed')
    chunks.push(output)
    decodedBytes += output.length
    offset += engine.bytesWritten
  }
  return Buffer.concat(chunks).toString('utf8')
}

/** Read a compressed or raw DSH JSONL log into an array of plain records. */
export function decodeRows(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error('session log is empty')
  if (buffer.length > MAX_SESSION_BYTES) throw new Error('session log is too large')
  const text = buffer.subarray(0, 4).equals(ZSTD_MAGIC)
    ? decodeZstdFrames(buffer)
    : buffer.toString('utf8')
  if (!text.endsWith('\n')) throw new Error('session log has a torn tail')
  const rows = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    let row
    try {
      row = JSON.parse(line)
    } catch {
      throw new Error('session log contains invalid JSON')
    }
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error('session log contains a malformed record')
    }
    rows.push(row)
  }
  return rows
}

export function isSessionHeader(row) {
  return (
    row &&
    row.type === 'session' &&
    Number.isSafeInteger(row.version) &&
    Number.isSafeInteger(row.createdAt) &&
    typeof row.id === 'string' &&
    row.id.length > 0
  )
}

/**
 * Decode and validate one current-format session.
 * @returns {{
 *   id: string, header: object, rows: object[], events: object[],
 *   title: string, messageCount: number, bytes: number, hash: string,
 *   createdAt: number, updatedAt: number, workspacePath: string, seeded: boolean
 * }}
 */
export function decodeSession(buffer, expectedId = undefined) {
  const rows = decodeRows(buffer)
  if (!rows.length || !isSessionHeader(rows[0])) throw new Error('session header is missing')
  const header = rows[0]
  if (header.version !== 4) throw new Error(`session format ${header.version} is not supported yet`)
  if (expectedId && header.id !== expectedId) throw new Error('session id does not match its path')
  if (header.isSeeded) throw new Error('seeded sessions are not supported yet')

  let nextSeq = 0
  let messageCount = 0
  let title = ''
  let updatedAt = header.createdAt
  for (let i = 1; i < rows.length; i += 1) {
    const event = rows[i]
    if (!event || typeof event.type !== 'string') throw new Error('session event is malformed')
    if (event.seq !== nextSeq) throw new Error(`session event sequence is not contiguous at ${i}`)
    nextSeq += 1
    if (Number.isSafeInteger(event.time)) updatedAt = Math.max(updatedAt, event.time)
    if (event.type === 'user/message') messageCount += 1
    if (event.type === 'session/title' && typeof event.data?.title === 'string') {
      title = event.data.title.trim()
    }
  }

  if (!title) {
    for (let i = 1; i < rows.length; i += 1) {
      const event = rows[i]
      if (event.type !== 'user/message') continue
      const text = (event.data?.content || [])
        .filter(part => part?.type === 'text' && typeof part.text === 'string')
        .map(part => part.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (text) {
        title = text.slice(0, 80)
        break
      }
    }
  }

  return {
    id: header.id,
    header,
    rows,
    events: rows.slice(1),
    title: title || 'Untitled chat',
    messageCount,
    bytes: buffer.length,
    hash: sha256(buffer),
    createdAt: header.createdAt,
    updatedAt,
    workspacePath: typeof header.cwd === 'string' ? header.cwd : '',
    seeded: false,
  }
}

/** Build a persistence-compatible create header from a stored session header. */
export function createHeaderFromSession(session, cwd = session.workspacePath) {
  const { type: _type, ...rest } = session.header
  return {
    ...rest,
    version: 4,
    cwd,
  }
}

/**
 * Compare two append-only logs, ignoring the header's project path.
 * @returns {'equal' | 'local-prefix' | 'remote-prefix' | 'diverged'}
 */
export function compareSessionRows(localRows, remoteRows) {
  if (!Array.isArray(localRows) || !Array.isArray(remoteRows) || localRows.length === 0 || remoteRows.length === 0) {
    return 'diverged'
  }
  if (localRows[0].id !== remoteRows[0].id) return 'diverged'
  const shorter = Math.min(localRows.length, remoteRows.length)
  for (let i = 0; i < shorter; i += 1) {
    const left = i === 0 ? { ...localRows[i], cwd: undefined } : localRows[i]
    const right = i === 0 ? { ...remoteRows[i], cwd: undefined } : remoteRows[i]
    if (!isDeepStrictEqual(left, right)) return 'diverged'
  }
  if (localRows.length === remoteRows.length) return 'equal'
  return localRows.length < remoteRows.length ? 'local-prefix' : 'remote-prefix'
}

export function cloneRowsWithCwd(rows, cwd) {
  if (!rows.length) return rows
  return [{ ...rows[0], cwd }, ...rows.slice(1)]
}

/** Encode rows as one valid Zstandard frame (used by tests and conflict copies). */
export function encodeRows(rows) {
  const text = rows.map(row => JSON.stringify(row)).join('\n') + '\n'
  return zstdCompressSync(Buffer.from(text, 'utf8'))
}

/** DSH's human-readable project directory key. */
export function projectKey(cwd) {
  if (!cwd || !String(cwd).length) return '_no-cwd'
  let readable = ''
  let separatorRun = false
  const text = String(cwd)
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i)
    const char = String.fromCharCode(code)
    if (char === '/' || char === '\\' || char === ':') {
      if (!separatorRun) readable += '-'
      separatorRun = true
    } else if (char !== '~' && /^[A-Za-z0-9._-]$/.test(char)) {
      readable += char
      separatorRun = false
    } else {
      readable += '~' + code.toString(16).toUpperCase().padStart(4, '0')
      separatorRun = false
    }
  }
  return `--${(readable.replace(/^-+/, '') || 'root').slice(0, 251)}--`
}

/** Enumerate the newest canonical generation of every local session. */
export async function listLocalSessionFiles(sessionsRoot) {
  let projectDirs
  try {
    projectDirs = await fs.readdir(sessionsRoot, { withFileTypes: true })
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
  const byId = new Map()
  for (const project of projectDirs) {
    if (!project.isDirectory()) continue
    const projectDir = path.join(sessionsRoot, project.name)
    let sessionDirs
    try {
      sessionDirs = await fs.readdir(projectDir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const sessionDir of sessionDirs) {
      if (!sessionDir.isDirectory()) continue
      const dir = path.join(projectDir, sessionDir.name)
      let files
      try {
        files = await fs.readdir(dir, { withFileTypes: true })
      } catch {
        continue
      }
      for (const file of files) {
        if (!file.isFile()) continue
        const parsed = parseSessionFileName(file.name)
        if (!parsed) continue
        const full = path.join(dir, file.name)
        const stat = await fs.stat(full)
        const current = byId.get(sessionDir.name)
        if (!current || parsed.version > current.version) {
          byId.set(sessionDir.name, {
            id: sessionDir.name,
            projectDir,
            dir,
            file: full,
            fileName: file.name,
            version: parsed.version,
            compressed: parsed.compressed,
            size: stat.size,
            mtimeMs: stat.mtimeMs,
          })
        }
      }
    }
  }
  return [...byId.values()].sort((a, b) => b.mtimeMs - a.mtimeMs)
}

/** Remove stale temporary files left by an interrupted atomic write. */
export async function cleanTempFiles(root) {
  for (const file of await listFiles(root)) {
    if (/\.\d+\.\d+\.tmp$/.test(file) || /\.chat-sync\..*\.tmp$/.test(file)) {
      await fs.rm(file, { force: true }).catch(() => {})
    }
  }
}

export { ZSTD_MAGIC, MAX_SESSION_BYTES }

