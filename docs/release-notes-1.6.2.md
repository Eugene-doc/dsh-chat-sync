# Chat Sync 1.6.2

Исправление projection cache и скрытых/безымянных чатов.

## Причина

Chat Sync импортировал чат напрямую через `sessionPersistence`, но не обновлял
`sessionProjectionCache`. DSH строит боковой список чатов из projections, поэтому
в кэше оставался checkpoint, созданный при `create`: пустой
`sessionListMetadata.blank: true` и временный заголовок вроде
`Untitled chat · home5070 7`.

Сам лог сессии и manifest были корректны, но DSH не показывал чат в workspace.
Именно поэтому «VPS USA» отсутствовал визуально.

## Что изменено

- Новый импорт через persistence теперь вызывает
  `sessionProjectionCache.coldSnapshot(header, inheritedEventCount, events)`
  после `append`/`flush`/`close`.
- Raw-импорт без persistence также обновляет projection cache.
- Offline append и offline rename обновляют projections актуальным логом.
- При первом sync после обновления плагин один раз пересобирает projections
  всех локальных поддерживаемых сессий. Это лечит уже испорченные записи,
  созданные версиями 1.6.0–1.6.1.
- Исправление помечается в состоянии как `projectionCacheVersion`, поэтому
  повторно на каждом sync тяжёлый проход не выполняется.
- `git fetch` повторяется один раз при временной сетевой ошибке; ошибки
  авторизации не повторяются.

## Ограничения

- Замена разошедшейся ветки (`replaceLocalWithRemote`) не пересобирает
  projection cache: старый identity-matching checkpoint мог бы пропустить
  префикс новой ветки. Это известное ограничение; безопасная инвалидация
  должна появиться в DSH отдельно.
- `coldSnapshot` пишет кэш асинхронно; ошибка записи кэша не отменяет уже
  сохранённую историю.
- Конфликты по-прежнему не объединяются автоматически.

## Обновление

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add `
  "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.6.2/dsh-chat-sync-1.6.2.tgz"
```

После установки полностью перезапустите DSH и выполните синхронизацию один раз.

<details>
<summary><b>English version</b></summary>

# Chat Sync 1.6.2

Projection-cache fix for hidden or untitled chats.

## Root cause

Chat Sync imported a chat directly through `sessionPersistence` but did not update
`sessionProjectionCache`. DSH builds the sidebar from projections, so the cache
kept the checkpoint created at `create`: `sessionListMetadata.blank: true` and a
temporary title such as `Untitled chat · home5070 7`.

The session log and manifest were valid, but DSH did not show the chat in its
workspace. That is why “VPS USA” was missing visually.

## Changes

- New persistence imports now call
  `sessionProjectionCache.coldSnapshot(header, inheritedEventCount, events)`
  after `append`/`flush`/`close`.
- Raw imports without persistence also refresh the projection cache.
- Offline append and rename refresh projections from the final log.
- The first sync after upgrading rebuilds projections for every local supported
  session once. This heals records written by 1.6.0–1.6.1.
- The repair is recorded as `projectionCacheVersion`, so it does not run on every
  sync.
- `git fetch` is retried once on a transient network error; authentication
  errors are not retried.

## Limitations

- Replacing a diverged branch does not cold-snapshot the cache: an
  identity-matching checkpoint from the old branch could skip the new prefix.
  This remains a known limitation until DSH exposes safe invalidation.
- `coldSnapshot` writes the cache asynchronously; a cache write failure does not
  undo the saved history.
- Divergent branches are still not merged automatically.

</details>
