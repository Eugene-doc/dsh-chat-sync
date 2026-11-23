# Chat Sync 1.8.0

Полная синхронизация рабочих пространств и новых чатов.

## Что добавлено

- Каждое устройство публикует `workspaces.json`:
  - название;
  - путь;
  - список сессий;
  - порядок и даты обновления.
- При синхронизации на другом ПК:
  - отсутствующие workspace создаются через `workspaceRegistry.create`;
  - существующие workspace находятся по точному пути;
  - сессии из workspace-манифеста прикрепляются к соответствующему workspace.
- Новые сессии, которых ещё нет локально, импортируются обычным путём, а не
  только заменяют существующие.
- `resolveWorkspace` больше **не привязывает чат к первому попавшемуся
  workspace**. Если точный путь недоступен, используется отдельный
  `~/.dsh/workspaces/imported/<title>`, а не случайная папка.
- Для всех Git-команд включён `core.longpaths=true`.

## Ограничения

- Папка workspace должна существовать на втором ПК; если её нет, создаётся
  резервный `imported` workspace, а не проект с тем же названием.
- Workspace с путём другого пользователя (`C:\Users\User\...` на ПК
  `C:\Users\octor`) не создаётся вслепую.
- Вложения по-прежнему переносятся отдельным механизмом.
- Seeded/child-сессии имеют отдельную политику.

## Проверки

- 42 теста, все проходят.
- Добавлен тест создания workspace из удалённого workspace-манифеста.

## Обновление

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add `
  "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.8.0/dsh-chat-sync-1.8.0.tgz"
```

После обновления на **исходном ноутбуке** сначала выполнить обычную
синхронизацию, затем обновить и синхронизировать второй ПК.

<details>
<summary><b>English version</b></summary>

# Chat Sync 1.8.0

Full workspace and new-chat synchronization.

## Added

- Each device publishes `workspaces.json` with title, path, session ids, order
  and timestamps.
- On another PC, missing workspaces are created via `workspaceRegistry.create`,
  existing workspaces are matched by exact path and remote sessions are attached.
- New sessions are imported, not only existing replacements.
- `resolveWorkspace` no longer chooses the first arbitrary workspace. A missing
  exact path goes to a dedicated `~/.dsh/workspaces/imported/<title>` workspace.
- All Git commands use `core.longpaths=true`.

## Limitations

- The workspace directory must exist on the target PC; otherwise an `imported`
  fallback is used.
- Workspaces with another user's absolute path are not created blindly.
- Attachments remain a separate mechanism.
- Seeded/child sessions keep their own policy.

</details>
