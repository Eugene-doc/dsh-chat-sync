# Chat Sync 1.6.5

Автоматическая синхронизация больше не запускается при старте DSH.

## Что изменено

- Удалён стартовый таймер, который запускал sync через 2,2 секунды после
  открытия приложения.
- При включённой **«Синхронизировать автоматически»** первый обмен происходит
  только после полного выбранного интервала (5, 10, 30 или 60 минут).
- Последующие обмены идут с той же периодичностью.
- Обновлены подписи в настройках:
  - RU: «Первая синхронизация — после первого интервала».
  - EN: «The first sync happens after the first interval».

## Проверка

- 37 тестов, все проходят.
- `index.js` и `client.js` проходят синтаксическую проверку.
- Проверено, что `startupTimer` и `setTimeout(..., 2200)` в host-коде больше
  отсутствуют.

## Обновление

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add `
  "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.6.5/dsh-chat-sync-1.6.5.tgz"
```

После установки полностью перезапустите DSH.

<details>
<summary><b>English version</b></summary>

# Chat Sync 1.6.5

Automatic sync no longer starts at DSH startup.

## Changes

- Removed the startup timer that launched a sync 2.2 seconds after the app
  opened.
- With **Sync automatically** enabled, the first exchange happens only after one
  full selected interval (5, 10, 30 or 60 minutes).
- Later exchanges keep the same interval.
- Updated settings descriptions in Russian and English.

## Verification

- 37 tests pass.
- `index.js` and `client.js` pass syntax checks.
- No startup timer or `setTimeout(..., 2200)` remains in the host code.

</details>
