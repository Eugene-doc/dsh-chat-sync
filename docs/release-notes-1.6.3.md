# Chat Sync 1.6.3

Исправление ложной расходимости истории на границе `session/end-seed`.

## Причина

У одного и того же чата на двух устройствах был общий префикс до события
`session/end-seed` с `data: {}`:

```text
seq 10358
ноутбук: time 1794949208394 + 512 последующих событий
ПК:      time 1794950183293, это последнее событие
```

`compareSessionRows` сравнивал событие целиком, включая `time`. Из-за разного
времени одна и та же граница считалась расхождением. Chat Sync возвращал
`diverged`, не дописывал хвост, показывал предупреждение про открытый чат и не
выгружал продолжение.

Фактически истории не расходились: ноутбук содержал более длинное продолжение,
а ПК — только префикс.

## Что изменено

- При сравнении **untagged** `session/end-seed` игнорируется только поле `time`.
- Tagged-маркер `session/end-seed` с `data.inherited: true` по-прежнему
  сравнивается полностью: это структурная граница seeded-форка.
- Содержимое событий, `seq`, `type` и `data` сравниваются как раньше.
- После исправления история с общим префиксом определяется как
  `local-prefix`/`remote-prefix`, а не `diverged`; продолжение синхронизируется
  обычным путём.

## Проверка

- `compareSessionRows` на реальных файлах: `remote-prefix` вместо `diverged`.
- Тест на одинаковый `end-seed` с разным временем: `remote-prefix`.
- Всего тестов: **36**, все проходят.

## Ограничения

- Разошедшиеся **содержательные** ветки по-прежнему не объединяются
  автоматически.
- Замена разошедшейся ветки не пересобирает projection cache; для этого нужен
  безопасный invalidate/rebuild API DSH.

## Обновление

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add `
  "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.6.3/dsh-chat-sync-1.6.3.tgz"
```

После установки полностью перезапустите DSH и выполните синхронизацию.

<details>
<summary><b>English version</b></summary>

# Chat Sync 1.6.3

Fix for false history divergence at a `session/end-seed` boundary.

## Root cause

The same chat on two devices shared a prefix through an untagged
`session/end-seed` event, but the event had a different `time` on each device.
`compareSessionRows` compared the whole event JSON, so the same boundary was
classified as a content divergence. Chat Sync then refused to append/export the
longer local history and reported an open-chat warning.

## Changes

- For an untagged `session/end-seed`, only `time` is ignored during comparison.
- A tagged `session/end-seed` with `data.inherited: true` is still compared in
  full because it is a structural seeded-fork boundary.
- Event content, `seq`, `type` and `data` remain compared.
- A shared prefix is again reported as `local-prefix`/`remote-prefix`, so the
  continuation synchronizes normally.

## Verification

- Real files now return `remote-prefix` instead of `diverged`.
- A dedicated test covers identical untagged boundaries with different times.
- 36 tests pass.

## Limitations

- Substantive divergent branches are still not merged automatically.
- Replacing a divergent branch does not rebuild the projection cache; a safe
  DSH invalidate/rebuild API is still required.

</details>
