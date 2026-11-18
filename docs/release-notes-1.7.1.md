# Chat Sync 1.7.1

Исправления после review Phase 1 offline import.

## Исправлено

- Chooser теперь корректно обрабатывает несколько устройств:
  - `A` + `A`, `AB` → выбирает `AB`;
  - `A` + `A`, `X` → конфликт;
  - `A` + `AB`, `AB` → выбирает `AB`;
  - `A` + `AB`, `AB`, `ABC` → выбирает `ABC`.
  Ранние возвраты при `equal` и `equal` между remote-кандидатами удалены.
- Inventory больше не доверяет header id: ожидаемый id берётся из имени
  каталога, проверяется безопасный формат id и совпадение с путём.
- Backup теперь пишется атомарно и проверяется по hash.
- Rollback и recovery используют атомарное восстановление и проверяют
  фактический hash файла. Если файл изменился после аварии, импорт
  останавливается, а не затирает новую историю.
- Projection cache очищается и при rollback/recovery.
- `--restart` теперь действительно запускает DSH, если он был остановлен или
  запрошен флагом; `spawn` имеет обработчик ошибки.
- `--dry-run` с `--yes`/`--restart` не запускает DSH и не создаёт operation
  directory.
- Добавлен явный запрет offline import на не-Windows платформе.
- Добавлена проверка `sync.lock` перед offline записью.
- Lock использует grace-период для пустого создаваемого файла и удаляется только
  владельцем.
- Git blobs читаются с `core.longpaths=true`.
- Для pinned SHA используются только Git objects; рабочее дерево не читается.

## Ограничения

- Гонка «DSH запустили между проверкой и записью» уменьшена повторной проверкой,
  но не закрыта полностью без startup guard в DSH.
- Recovery рассчитан на один незавершённый журнал; старые журналы требуют
  отдельного разбора.
- Plugin-owned validator пока не доказан эквивалентным внутреннему DSH v4
  validator. Нужен acceptance-тест с реальным DSH.
- Phase 1 по-прежнему обновляет только существующие чаты: без новых сессий,
  workspace attachment, вложений, seeded-сессий и offline push.

## Проверки

- 41 тест, все проходят.
- Выбор кандидатов покрыт таблицей multi-device сценариев.
- Добавлены проверки backup/hash/atomic replacement.

## Обновление

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add `
  "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.7.1/dsh-chat-sync-1.7.1.tgz"
```

<details>
<summary><b>English version</b></summary>

# Chat Sync 1.7.1

Post-review fixes for offline import Phase 1.

## Fixed

- Multi-device chooser now handles equal, extending and competing candidates
  correctly, including `A` + `A`, `AB` and `A` + `AB`, `AB`, `ABC`.
- Inventory uses the directory id as the identity witness and validates id
  format/path boundaries instead of trusting the header.
- Backups are atomic and hash-verified.
- Rollback/recovery use atomic restore and actual hash checks; an unknown
  post-crash state aborts instead of overwriting user history.
- Projection cache is cleared during rollback/recovery.
- `--restart` actually starts DSH; spawn errors are handled.
- Dry-run never creates operation state or starts DSH.
- Offline import is explicitly Windows-only.
- `sync.lock` is checked before offline writes.
- Lock acquisition has a grace period and ownership-safe release.
- Git blobs use `core.longpaths=true`.

## Limitations

- The DSH-start race is narrowed but not fully closed without a DSH startup
  guard.
- Only one incomplete journal is recovered automatically.
- Plugin validator equivalence with the real DSH v4 validator still needs an
  acceptance test.
- Phase 1 updates existing chats only.

</details>
