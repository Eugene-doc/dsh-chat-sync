# Chat Sync 1.6.4

Аварийный фикс повреждения лога через live append.

## Причина

`appendTailToLive` добавлял удалённый хвост через `live.append(type, data)`.
Этот путь:

- создаёт новые `seq` и `time`;
- **пропускает `session/end-seed`**;
- сохраняет старые delivery-ссылки внутри payload.

В результате на ПК появился лог с marker `throughSeq = 10439` при `seq = 10439`,
и DSH отказался открывать историю:

```text
delivery throughSeq must precede its marker
```

Текущий локальный лог на ноутбуке после проверки оказался валидным, но
повреждённая копия уже попала в `devices/19ccdccc...` репозитория.

## Что изменено

- **Live append полностью отключён.** Если чат открыт, импорт откладывается до
  закрытия; история не переписывается через `live.append`.
- Для закрытого чата используется persistence `append` с точными удалёнными
  событиями, включая `seq`, `time` и `session/end-seed`.
- `decodeSession` проверяет delivery-маркеры:
  - `throughSeq` — целое неотрицательное и **меньше** `seq` своего маркера;
  - `sessionId` — непустая строка.
  
  Повреждённая удалённая копия теперь отклоняется, а не импортируется.
- Исправлен порядок проверки частичного результата live append: ошибка больше
  не выглядит как успешное обновление.
- Добавлен регрессионный тест на `throughSeq >= seq`.

## Важно про восстановление

Текущая локальная копия на ноутбуке валидна. Повреждённая копия ПК находится
здесь:

```text
devices/19ccdccc-3048-4702-b6b7-622e9b92be80/sessions/
--D-GoogleDriveMirror-DeepSeekHarness--/
session-52b34dcc-3f77-4aa5-8321-e991c79f5301/session.v4.jsonl.zstd
```

Её нельзя импортировать. Для восстановления ПК нужно заменить повреждённый
локальный лог на валидную копию с ноутбука (после закрытия DSH) либо
использовать более раннюю валидную копию из `conflicts/`.

## Проверки

- 37 тестов, все проходят.
- Валидатор DSH на текущем локальном логе: `VALID`.
- Повреждённый репозиторный лог отклоняется с
  `delivery throughSeq must precede its marker`.

## Обновление

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add `
  "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.6.4/dsh-chat-sync-1.6.4.tgz"
```

<details>
<summary><b>English version</b></summary>

# Chat Sync 1.6.4

Emergency fix for log corruption through live append.

## Root cause

`appendTailToLive` appended a remote tail through `live.append(type, data)`,
which creates fresh `seq`/`time`, skips `session/end-seed`, and leaves old
delivery references inside payloads. The resulting log contained a marker with
`throughSeq = 10439` at `seq = 10439`; DSH refused it with
`delivery throughSeq must precede its marker`.

## Changes

- **Live append is disabled.** An open chat defers import until it is closed.
- Closed chats use persistence `append` with exact remote events, preserving
  `seq`, `time`, and `session/end-seed`.
- `decodeSession` now rejects delivery markers with a missing/non-integer
  `throughSeq`, `throughSeq >= seq`, or an empty `sessionId`.
- A partial live-append error is checked before reporting success.
- Added a regression test for `throughSeq >= seq`.

## Recovery

The current laptop copy validates. The corrupt PC copy in
`devices/19ccdccc.../sessions/...session-52b34dcc...` must be replaced from a
valid laptop copy or an older `conflicts/` backup after DSH is closed.

</details>
