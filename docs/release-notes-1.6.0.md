# Chat Sync 1.6.0

Поддержка seeded-сессий.

## Что нового

- Chat Sync теперь синхронизирует **самодостаточные пользовательские seeded-форки**.
  Раньше плагин полностью пропускал любую сессию с `isSeeded: true`.
- Seeded-сессии с `parentSession` или `origin: subagent` по-прежнему остаются
  локальными: это служебные дочерние сессии, их перенос создал бы дубликаты.
- В манифесте появилось поле `seeded`, чтобы отличать форки от обычных чатов.
- Для seeded-форков отключён live-append в открытую сессию: такие журналы
  импортируются только через файл/хранилище сессий.
- Seeded-чат «Плагин синхронизации DSH» больше не должен теряться при
  синхронизации с ПК на ноутбук.

## Ограничения

- Seeded-форк должен быть самодостаточным: без `parentSession` и без
  `origin: subagent`.
- Импорт seeded-форка на другой ПК всё ещё требует проверки в живом DSH:
  создаётся сессия с сохранённым заголовком `isSeeded`.
- Разошедшиеся ветки по-прежнему не объединяются автоматически.

## Обновление

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add `
  "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.6.0/dsh-chat-sync-1.6.0.tgz"
```

<details>
<summary><b>English version</b></summary>

# Chat Sync 1.6.0

Seeded session support.

## What's new

- Chat Sync now synchronizes **self-contained user seeded forks**. Previously any
  session with `isSeeded: true` was skipped.
- Seeded sessions with `parentSession` or `origin: subagent` remain local: they
  are child sessions, and copying them would create duplicates.
- The manifest now records a `seeded` flag.
- Live append is disabled for seeded forks; they are imported through the session
  store/file path instead.
- The seeded chat “Плагин синхронизации DSH” should no longer disappear when
  syncing from the PC to the laptop.

## Limitations

- A seeded fork must be self-contained: no `parentSession`, no
  `origin: subagent`.
- Importing a seeded fork on another PC still needs a live DSH check: the created
  session preserves the `isSeeded` header.
- Divergent branches are still not merged automatically.

## Updating

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add `
  "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.6.0/dsh-chat-sync-1.6.0.tgz"
```

</details>
