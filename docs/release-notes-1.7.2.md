# Chat Sync 1.7.2

Исправление Windows long paths в обычной синхронизации.

## Причина

Обычный Chat Sync запускал Git без `core.longpaths=true`. Репозиторий содержит
пути вида:

```text
devices/634fd9ca-.../sessions/
--D-GoogleDriveMirror-1_JURISPRUDECE-01_Customers~0020cases-.../
session-.../session.v4.jsonl.zstd
```

На Windows они превышают 260 символов. Git не мог открыть каталог:

```text
warning: could not open directory ...: Filename too long
fatal: adding files failed
```

Offline import уже использовал `-c core.longpaths=true`, а online sync — нет.

## Что изменено

- Все команды `GitRepository` теперь запускаются с:

```text
git -c core.longpaths=true -C <repo> ...
```

- Это применяется к `status`, `add`, `commit`, `fetch`, `rebase`, `push` и
  остальным операциям обычной синхронизации.
- Версия 1.7.2 не меняет формат чатов и не выполняет миграций.

## Проверка

- 41 тест, все проходят.
- `git status --short` через `GitRepository` на реальном репозитории с длинными
  путями больше не выдаёт `Filename too long`.

## Ограничения

Если Windows сам блокирует длинные пути, всё ещё может понадобиться
`LongPathsEnabled=1` в реестре Windows. `core.longpaths` исправляет Git, но не
все системные API.

## Обновление

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add `
  "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.7.2/dsh-chat-sync-1.7.2.tgz"
```

После установки полностью перезапустите DSH.

<details>
<summary><b>English version</b></summary>

# Chat Sync 1.7.2

Fix for Windows long paths in normal sync.

## Cause

Normal Chat Sync invoked Git without `core.longpaths=true`. Repository paths can
exceed the Windows 260-character limit, causing:

```text
warning: could not open directory ...: Filename too long
fatal: adding files failed
```

Offline import already used `-c core.longpaths=true`; normal sync did not.

## Changes

- Every `GitRepository` command now runs as:

```text
git -c core.longpaths=true -C <repo> ...
```

- Applies to status, add, commit, fetch, rebase, push and all other sync
  operations.
- No chat migration or format change.

## Verification

- 41 tests pass.
- `git status --short` through `GitRepository` no longer reports
  `Filename too long` on the real long-path repository.

## Limitation

Windows itself may still require `LongPathsEnabled=1`; `core.longpaths` fixes Git,
not every system API.

</details>
