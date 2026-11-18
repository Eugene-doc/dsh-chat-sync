# Chat Sync 1.7.0

Offline import CLI, phase 1.

## Что добавлено

- `scripts/offline-import.mjs` — отдельный Node CLI, который работает без
  запущенного DSH.
- При старте CLI проверяет процессы DSH. Если DSH запущен:
  - показывает найденные процессы;
  - спрашивает: `Force a full DSH shutdown and continue? [y/N]`;
  - при `N` или пустом ответе **ничего не делает**: без fetch, backup, cache и
    записи;
  - при `Y` завершает DSH, ждёт выхода, при необходимости делает force-kill,
    проверяет повторно и продолжает.
- Если DSH уже закрыт, CLI проверяет lock и переходит к offline import.
- `--dry-run` — только чтение и отчёт, без остановки DSH и без записи.
- Импорт — только существующие чаты, только полная замена файла:
  - `equal` — ничего;
  - локальный префикс — замена;
  - локальная история длиннее — оставить;
  - diverged — карантин, без замены;
  - corrupt local — сохранить и пропустить;
  - seeded/child/subagent — пропустить в phase 1.
- Git `fetch` без commit/rebase/push; чтение из одного pinned commit SHA,
  включая бинарные blobs и длинные пути.
- Backup, journal операции, атомарная замена, очистка projection cache,
  базовая recovery незавершённой операции.

## Ограничения phase 1

- Новые чаты не создаются.
- Workspace registry не изменяется.
- Вложения не импортируются.
- Offline export/push не выполняется.
- Seeded-сессии исключены.
- Валидатор пока plugin-owned; совместимость с внутренним DSH-валидатором
  требуется подтвердить отдельным acceptance-тестом.
- Если recovery после сбоя не завершён, DSH не должен запускаться.

## Запуск

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add `
  "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.7.0/dsh-chat-sync-1.7.0.tgz"
```

CLI:

```powershell
node "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-chat-sync\scripts\offline-import.mjs" --dry-run
```

или без `--dry-run`, когда готовы разрешить остановку DSH.

<details>
<summary><b>English version</b></summary>

# Chat Sync 1.7.0

Offline import CLI, phase 1.

## Added

- A standalone `scripts/offline-import.mjs` CLI.
- On startup it checks for DSH processes. If DSH is running it asks for explicit
  permission before a full shutdown; `N` or an empty answer changes nothing.
- If DSH is already closed, it checks the lock and proceeds.
- `--dry-run` is read-only and never stops DSH.
- Existing chats only: full-file replacement, no append. Equal/local-longer are
  no-ops; local-prefix is replaced; divergent/corrupt/child/seeded are skipped
  or quarantined.
- Fetch-only Git access from one pinned SHA, binary blobs and long paths.
- Backup, operation journal, atomic replacement, projection-cache invalidation
  and basic recovery.

## Phase 1 limitations

- No new chats.
- No workspace registry changes.
- No attachments.
- No offline export/push.
- No seeded sessions.
- The validator is plugin-owned; DSH validator compatibility still needs an
  acceptance test.

</details>
