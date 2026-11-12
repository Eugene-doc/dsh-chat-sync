import { ChatSyncEngine } from './lib/engine.js'
import { parseRemote } from './lib/util.js'

export const name = 'dsh-chat-sync'
export const inject = ['webServer']

const API_PREFIX = '/chat-sync/api'
const MAX_BODY = 64 * 1024

function makeLogger(ctx) {
  const logger = ctx?.logger
  return message => {
    try {
      if (logger && typeof logger.info === 'function') {
        logger.info(message)
        return
      }
      if (typeof logger === 'function') {
        logger(message)
        return
      }
    } catch {}
    console.log(message)
  }
}

function json(res, code, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function requestAllowed(req) {
  const headers = req.headers || {}
  const site = String(headers['sec-fetch-site'] || '').toLowerCase()
  if (site === 'cross-site') return false
  const origin = headers.origin
  if (!origin) return true
  if (origin === 'null') return false
  try {
    const parsed = new URL(origin)
    return parsed.host.toLowerCase() === String(headers.host || '').toLowerCase()
  } catch {
    return false
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', chunk => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('Request is too large.'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      if (!text.trim()) return resolve({})
      try {
        const value = JSON.parse(text)
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          return reject(new Error('Expected a JSON object.'))
        }
        resolve(value)
      } catch {
        reject(new Error('Expected valid JSON.'))
      }
    })
    req.on('error', reject)
  })
}

function registerTools(ctx, engine, log) {
  const tools = ctx.get?.('tools') || ctx.tools
  if (!tools?.register) return
  try {
    const disposer = tools.register({
      name: 'chat_sync',
      description:
        'Inspect or run Chat Sync, which carries conversation history between this computer and the private GitHub relay. Use action "status" to read the last sync, devices and conflicts, or "sync" to exchange chats now. It never uploads credentials or settings.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['status', 'sync', 'repair'],
            description: 'Read status, run a sync, or attach all chats to workspaces.',
          },
        },
        required: ['action'],
        additionalProperties: false,
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: String(value) }],
      },
      async execute(args) {
        const action = ['sync', 'repair'].includes(args?.action) ? args.action : 'status'
        if (action === 'sync') {
          await engine.startSync()
          await engine.awaitSync()
        } else if (action === 'repair') {
          await engine.repairGrouping({ unarchive: false })
        }
        const status = await engine.getStatus()
        return JSON.stringify({
          ok: !status.last?.error,
          repository: status.repository.label,
          branch: status.repository.branch,
          running: status.sync.running,
          last: status.last
            ? {
                at: status.last.at,
                ok: status.last.ok,
                imported: status.last.imported,
                exported: status.last.exported,
                titlesRenamed: status.last.titlesRenamed || 0,
                archived: status.last.archived || 0,
                unarchived: status.last.unarchived || 0,
                error: status.last.error || null,
                durationMs: status.last.durationMs,
              }
            : null,
          stats: status.stats,
          devices: status.devices.map(device => ({
            name: device.name,
            current: device.current,
            chats: device.chats,
            lastSyncAt: device.lastSyncAt,
          })),
          conflicts: status.conflicts.map(conflict => ({
            title: conflict.title,
            device: conflict.device,
            reason: conflict.reason,
          })),
        })
      },
    })
    ctx.effect(() => disposer, 'chat-sync: agent tool')
  } catch (error) {
    log(`[chat-sync] agent tool not registered: ${String(error?.message || error)}`)
  }
}

/** Host half: Git relay, HTTP API, auto-sync timer and the read/write agent tool. */
export async function apply(ctx) {
  const log = makeLogger(ctx)
  const engine = new ChatSyncEngine(ctx, { log })
  await engine.init()
  log('[chat-sync] ready')

  const handle = async (req, res) => {
    if (!requestAllowed(req)) {
      json(res, 403, { ok: false, error: 'Cross-site request refused.' })
      return
    }
    const url = new URL(req.url || '/', 'http://localhost')
    const route = url.pathname.slice(API_PREFIX.length) || '/'
    try {
      if (req.method === 'GET' && route === '/status') {
        json(res, 200, await engine.getStatus())
        return
      }
      if (req.method === 'GET' && route === '/config') {
        const status = await engine.getStatus()
        json(res, 200, { ok: true, settings: status.settings, repository: status.repository })
        return
      }
      if (req.method === 'POST' && route === '/sync') {
        const started = await engine.startSync()
        json(res, started.started ? 202 : 200, { ok: true, ...started })
        return
      }
      if (req.method === 'POST' && route === '/config') {
        const body = await readBody(req)
        const status = await engine.updateConfig(body)
        json(res, 200, { ok: true, status })
        return
      }
      if (req.method === 'POST' && route === '/repair') {
        const body = await readBody(req)
        const result = await engine.repairGrouping({ unarchive: body.unarchive === true })
        json(res, 200, { ok: true, result })
        return
      }
      if (req.method === 'POST' && route === '/check') {
        const body = await readBody(req)
        const parsed = parseRemote(body.remote || engine.config.remote)
        if (!parsed.ok) {
          json(res, 400, { ok: false, error: parsed.error })
          return
        }
        const environment = await engine.environmentReady()
        if (!environment.git) {
          json(res, 200, { ok: false, error: 'Git is not installed or is not on PATH.' })
          return
        }
        const heads = await engine.git.remoteHeads(parsed.remote, body.branch || engine.config.branch)
        const exists = heads.some(item => item.ref === `refs/heads/${body.branch || engine.config.branch}`)
        json(res, 200, {
          ok: true,
          exists,
          label: `${parsed.owner}/${parsed.name}`,
          webUrl: parsed.webUrl,
          branch: body.branch || engine.config.branch,
          hint: exists
            ? 'Repository found and reachable.'
            : 'The repository is reachable, but this branch is empty. The first sync will create it.',
        })
        return
      }
      json(res, 404, { ok: false, error: 'Unknown Chat Sync endpoint.' })
    } catch (error) {
      const message = String(error?.message || error)
      log(`[chat-sync] request failed: ${message}`)
      json(res, error?.code === 'invalid-config' ? 400 : 500, {
        ok: false,
        error: message,
      })
    }
  }

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'prefix',
        path: API_PREFIX,
        handler: handle,
      }),
    'chat-sync: http api',
  )

  registerTools(ctx, engine, log)

  let timer = null
  let startupTimer = null
  const schedule = () => {
    if (timer) clearInterval(timer)
    timer = null
    if (!engine.config.autoSync) return
    const intervalMs = Math.max(1, engine.config.intervalMinutes) * 60_000
    timer = setInterval(() => {
      if (!engine.running) void engine.startSync()
    }, intervalMs)
    if (typeof timer.unref === 'function') timer.unref()
  }
  engine.onConfigChange = schedule
  schedule()

  startupTimer = setTimeout(() => {
    if (engine.config.autoSync && !engine.running) void engine.startSync()
  }, 2200)
  if (typeof startupTimer.unref === 'function') startupTimer.unref()

  ctx.effect(
    () => () => {
      if (timer) clearInterval(timer)
      if (startupTimer) clearTimeout(startupTimer)
      engine.onConfigChange = null
    },
    'chat-sync: timers',
  )
}

export default { apply, name, inject }
