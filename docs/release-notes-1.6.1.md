# Chat Sync 1.6.1

Исправления после ревью 1.6.0. Эта версия заменяет 1.6.0.

## Что нового

- Chat Sync синхронизирует **самодостаточные пользовательские seeded-форки**.
- Seeded-форк определяется по `isSeeded: true` и маркеру
  `session/end-seed` с `data.inherited: true`; позиция маркера становится
  `inheritedEventCount` при импорте.
- Seeded-сессии **без** унаследованного маркера пропускаются: такой лог не может
  быть корректно создан в DSH.
- Все дочерние сессии — не только seeded — остаются локальными, если у них есть
  `parentSession`, `origin: subagent` или `delegationDepth > 0`. Это закрывает
  случай spawn-субагентов, которые не помечены `isSeeded`.
- Убраны повторяющиеся предупреждения о дочерних сессиях.
- Защита от перезаписи локального дочернего файла при импорте без
  `sessionPersistence`.
- Поле `seeded` в манифесте.

## Ограничения

- Импорт seeded-форка требует корректного унаследованного маркера; иначе чат
  пропускается с предупреждением.
- Разошедшиеся ветки по-прежнему разрешаются newest-wins, старая копия остаётся
  в `conflicts/`.
- Импорт на другом ПК всё ещё требует проверки в живом DSH.

## Обновление

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add `
  "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.6.1/dsh-chat-sync-1.6.1.tgz"
```

<details>
<summary><b>English version</b></summary>

# Chat Sync 1.6.1

Post-review fixes. This version supersedes 1.6.0.

## What's new

- Chat Sync synchronizes **self-contained user seeded forks**.
- A seeded fork is recognized by `isSeeded: true` plus a
  `session/end-seed` marker with `data.inherited: true`; the marker position is
  passed as `inheritedEventCount` on import.
- Seeded sessions without an inherited marker are skipped: DSH cannot create
  such a log faithfully.
- Every child session — not only seeded ones — stays local when it has
  `parentSession`, `origin: subagent` or `delegationDepth > 0`. This covers
  spawn subagents that are not marked `isSeeded`.
- Repeated child-session warnings are removed.
- A local child file is no longer overwritten by the no-persistence import path.
- Manifest records a `seeded` flag.

## Limitations

- Importing a seeded fork requires a valid inherited marker; otherwise the chat
  is skipped with a warning.
- Divergent branches still use newest-wins; the replaced copy stays in
  `conflicts/`.
- Importing on another PC still needs a live DSH check.

</details>
