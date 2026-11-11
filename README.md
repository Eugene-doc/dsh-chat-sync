# Chat Sync

A small DeepSeek Harness plugin that carries conversation history between
computers through one private GitHub repository.

![Chat Sync settings](https://github.com/Eugene-doc/dsh-chat-sync/raw/main/docs/settings.png)

## What it does

- Keeps one snapshot per computer under `devices/<device-id>/` in a private
  Git repository.
- Imports chats that exist only on another computer.
- Appends newer turns when the local chat is an exact prefix of the remote one.
- Never rewrites a chat that changed in two places: it keeps the local copy and
  saves the remote copy under `~/.dsh/chat-sync/conflicts/`.
- Shows the relay state, computers, recent activity, transfer size and commit in
  **Settings → Chats**.
- Optionally carries content-addressed chat attachments.
- Exposes a `chat_sync` tool so the assistant can report status or run a sync.

It deliberately does **not** read API keys, credentials, plugin settings,
workspaces or project files. Anything you typed into a chat is part of that
chat's history, so the repository must stay private. The settings page asks
GitHub whether the relay is actually private and warns when it is public.

## Requirements

- DeepSeek Harness **0.2.0-rc.1** or newer (Desktop or Web).
- [Git](https://git-scm.com/downloads) on every computer.
- A GitHub account that owns the private data repository. This copy is set up
  for `Eugene-doc/dsh-sync`.
- On Windows, sign Git in to that account once:

  ```powershell
  gh auth login --hostname github.com --git-protocol https --web
  gh auth setup-git
  ```

## Install

On this computer the plugin is already installed from this checkout. To install
it on another computer, use the released package:

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add `
  "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.0.0/dsh-chat-sync-1.0.0.tgz"
```

Fully quit and reopen DeepSeek Harness. Open **Settings → Chats** and press
**Sync now**. The default repository is `Eugene-doc/dsh-sync`; sign in to the
same GitHub account on every computer.

For a local development install, point the plugin manager at this directory:

```powershell
dsh plugin --profile desktop add "file:D:\My Drive\DeepSeekHarness\plugins\dsh-chat-sync"
```

## Use

- **Sync now** exchanges changes immediately. The button is disabled while a
  sync is running.
- **Sync automatically** pulls on launch and exchanges changes every 10 minutes
  while the app is open. You can choose 5, 10, 30 or 60 minutes.
- **Include attachments** adds images and files referenced by chats. It is off
  by default because the relay can grow quickly.
- **Change** switches to another private GitHub repository or branch. The local
  checkout is rebuilt on the next sync; local chats are untouched.
- New chats imported from another computer are attached to a workspace with the
  same path, then the same folder name, then the first available workspace.
  A restart may be needed if the session list does not refresh immediately.

Press **Sync now before quitting** if you are about to move to another computer;
the periodic timer does not run an upload during shutdown.

## How the merge works

DSH stores each chat as an append-only, Zstandard-compressed JSONL log. Chat Sync
decodes the frames, compares records by sequence, and:

| Local vs remote | Result |
| --- | --- |
| equal | nothing to do |
| local is an exact prefix | append the remote tail through `sessionPersistence` |
| remote is an exact prefix | keep local, upload it on this run |
| divergent | keep local, save the remote bytes as a conflict copy |

A chat that is currently open and owned by the local writer is deferred to the
next sync. A partially written log is skipped rather than half-imported.

Each computer writes only its own `devices/<id>/` directory, so normal Git
pushes do not conflict. The data repository is cloned to
`~/.dsh/chat-sync/repo`.

## Data layout

```
devices/<device-id>/
  device.json       computer name, platform, last sync
  manifest.json     chat index (title, workspace, hash, size, updatedAt)
  sessions/         append-only DSH session logs
  attachments/      optional content-addressed blobs
```

Local state lives in `~/.dsh/chat-sync/`:

```
config.json         remote, branch, automation, attachments
state.json          device id, exported hashes, conflicts, activity
repo/               local clone of the private repository
conflicts/          remote copies that diverged
```

## Limitations

- Seeded (forked) sessions are skipped until their inherited-log layout is
  supported. Ordinary conversations are unaffected.
- Divergent histories are preserved, not automatically merged. Resolve them by
  choosing one side manually; the remote copy remains in `conflicts/`.
- Attachment changes are imported only when **Include attachments** is on.
- Session deletion is not propagated.
- Cross-platform chats whose project path does not exist on the other computer
  are attached to the closest workspace by folder name, otherwise to the first
  available workspace. Tool calls inside those chats still reference the old
  paths.
- Only `turns` already flushed to the session log are exported; the last few
  seconds of a live turn may wait for the next sync.

## Development

```powershell
cd "D:\My Drive\DeepSeekHarness\plugins\dsh-chat-sync"
node --test
node --check index.js
node --check client.js
```

The plugin has no runtime npm dependencies. Host code uses Node built-ins and
the local `git` executable. The browser half is plain JavaScript loaded through
`window.__ModuleLoader__`.

## License

MIT
