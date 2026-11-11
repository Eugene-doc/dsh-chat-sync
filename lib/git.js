import { promises as fs } from 'node:fs'
import path from 'node:path'

import { errorMessage, isGitAuthError, run } from './util.js'

const GIT_ENV = {
  GIT_TERMINAL_PROMPT: '0',
  GIT_OPTIONAL_LOCKS: '0',
  LC_ALL: 'C',
  LANG: 'C',
}

/** Thin, non-interactive wrapper around the user's Git installation. */
export class GitRepository {
  constructor(directory, log = () => {}) {
    this.directory = directory
    this.log = log
  }

  async run(args, options = {}) {
    try {
      const output = await run('git', ['-C', this.directory, ...args], {
        timeout: options.timeout ?? 90_000,
        env: GIT_ENV,
        maxBuffer: 32 * 1024 * 1024,
      })
      return { ok: true, output }
    } catch (error) {
      if (!options.allowFailure) {
        const text = errorMessage(error)
        if (isGitAuthError(error)) {
          const wrapped = new Error(
            'GitHub access was refused. Sign in with GitHub CLI (`gh auth login`) or check that the private repository exists.',
          )
          wrapped.code = 'git-auth'
          wrapped.cause = error
          throw wrapped
        }
        const wrapped = new Error(text.split('\n').slice(-4).join('\n') || 'Git command failed.')
        wrapped.code = 'git'
        wrapped.cause = error
        throw wrapped
      }
      return { ok: false, failed: true, output: errorMessage(error), error }
    }
  }

  async version() {
    try {
      return await run('git', ['--version'], { timeout: 10_000, env: GIT_ENV })
    } catch {
      return null
    }
  }

  async exists() {
    try {
      await fs.access(path.join(this.directory, '.git'))
      return true
    } catch {
      return false
    }
  }

  async hasHead() {
    const result = await this.run(['rev-parse', '--verify', 'HEAD'], { allowFailure: true })
    return !result.failed
  }

  async currentBranch() {
    const result = await this.run(['branch', '--show-current'], { allowFailure: true })
    return result.failed ? '' : result.output
  }

  async status() {
    const result = await this.run(['status', '--porcelain'], { allowFailure: true })
    return result.failed ? '' : result.output
  }

  async configure(remote, branch) {
    await this.run(['config', 'user.name', 'Chat Sync'])
    await this.run(['config', 'user.email', 'chat-sync@users.noreply.github.com'])
    await this.run(['config', 'core.autocrlf', 'false'])
    await this.run(['config', 'core.safecrlf', 'false'])
    const current = await this.run(['remote', 'get-url', 'origin'], { allowFailure: true })
    if (current.failed) {
      await this.run(['remote', 'add', 'origin', remote])
    } else if (current.output !== remote) {
      await this.run(['remote', 'set-url', 'origin', remote])
    }
    await this.run(['config', `branch.${branch}.remote`, 'origin'])
    await this.run(['config', `branch.${branch}.merge`, `refs/heads/${branch}`])
  }

  async remoteHeads(remote, branch) {
    const result = await this.run(['ls-remote', '--heads', remote, branch], {
      allowFailure: true,
      timeout: 45_000,
    })
    if (result.failed) {
      if (isGitAuthError(result.error)) {
        const wrapped = new Error(
          'GitHub access was refused. Sign in with GitHub CLI (`gh auth login`) or check the repository address.',
        )
        wrapped.code = 'git-auth'
        throw wrapped
      }
      throw new Error(result.output || 'Could not reach the remote repository.')
    }
    return result.output
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [sha, ref] = line.split(/\s+/)
        return { sha, ref }
      })
  }

  async ensure({ remote, branch }) {
    await fs.mkdir(this.directory, { recursive: true })
    if (!(await this.exists())) {
      await this.run(['init', '-b', branch])
    }
    await this.configure(remote, branch)

    const heads = await this.remoteHeads(remote, branch)
    const branchRef = heads.find(item => item.ref === `refs/heads/${branch}`)
    if (!branchRef) {
      if (!(await this.hasHead())) {
        return { emptyRemote: true, remoteExists: false }
      }
      return { emptyRemote: true, remoteExists: false }
    }

    await this.run(['fetch', '--prune', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`])

    // Keep any snapshot left uncommitted by an interrupted previous run, then
    // replay it above the freshly fetched remote branch.
    const dirty = await this.status()
    if (dirty) {
      await this.run(['add', '-A', '--', 'devices'])
      await this.run(['commit', '-m', 'chat sync: recover pending local snapshot'], { allowFailure: true })
    }

    if (await this.hasHead()) {
      const rebase = await this.run(['rebase', 'origin/' + branch], { allowFailure: true })
      if (rebase.failed) {
        await this.run(['rebase', '--abort'], { allowFailure: true })
        throw new Error('Local sync data diverged and could not be replayed over GitHub. No local chats were changed.')
      }
    } else {
      await this.run(['checkout', '-B', branch, `origin/${branch}`])
    }
    return { emptyRemote: false, remoteExists: true }
  }

  async commitDevice(deviceId, message) {
    await this.run(['add', '-A', '--', `devices/${deviceId}`])
    const staged = await this.run(['diff', '--cached', '--quiet', '--', `devices/${deviceId}`], {
      allowFailure: true,
    })
    if (!staged.failed) return false
    await this.run(['commit', '-m', message])
    return true
  }

  async pullRebase(branch) {
    const fetch = await this.run(['fetch', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], {
      allowFailure: true,
    })
    if (fetch.failed) return { pulled: false, error: fetch.output }
    const rebase = await this.run(['rebase', 'origin/' + branch], { allowFailure: true })
    if (rebase.failed) {
      await this.run(['rebase', '--abort'], { allowFailure: true })
      return { pulled: false, error: rebase.output }
    }
    return { pulled: true }
  }

  async push(branch) {
    const result = await this.run(['push', 'origin', `HEAD:${branch}`], { allowFailure: true })
    if (!result.failed) return { pushed: true }
    const retry = await this.pullRebase(branch)
    if (!retry.pulled) return { pushed: false, error: retry.error || result.output }
    const second = await this.run(['push', 'origin', `HEAD:${branch}`], { allowFailure: true })
    return second.failed ? { pushed: false, error: second.output } : { pushed: true }
  }

  async changedFiles(fromRef = 'HEAD~1') {
    const result = await this.run(['diff', '--name-only', fromRef, 'HEAD'], { allowFailure: true })
    return result.failed ? [] : result.output.split('\n').filter(Boolean)
  }

  async headSummary() {
    const result = await this.run(['log', '-1', '--format=%h%x09%cI%x09%s'], { allowFailure: true })
    if (result.failed || !result.output) return null
    const [sha, committedAt, subject] = result.output.split('\t')
    return { sha, committedAt, subject }
  }
}
