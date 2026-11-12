# Восстановление после переустановки

Плагин и история чатов — разные вещи. Сам плагин можно поставить заново из
публичного репозитория, а история лежит в приватном
[`Eugene-doc/dsh-sync`](https://github.com/Eugene-doc/dsh-sync).

## Что случится с данными

| Что | Где хранится | Переживёт переустановку Windows |
| --- | --- | --- |
| Код плагина | GitHub, публичный репозиторий | Да |
| История чатов | Приватный Git-репозиторий | Да, если последняя синхронизация успела загрузить изменения |
| Локальные сессии | `C:\Users\<user>\.dsh\sessions` | Нет, если диск C: отформатирован |
| API-ключи и настройки DSH | `C:\Users\<user>\.dsh\.credentials.yaml` и профиль | Нет, их нужно настроить заново |
| Вложения | Локально + репозиторий, если включён тумблер | Только если включена синхронизация вложений |

После чистой установки Windows локальная папка `.dsh` исчезнет. Всё, что было
загружено в приватный репозиторий, плагин скачает заново. Всё, что не успело
загрузиться, восстановить будет неоткуда.

## Способ 1: один скрипт

Откройте PowerShell от имени пользователя и выполните:

```powershell
irm https://raw.githubusercontent.com/Eugene-doc/dsh-chat-sync/main/scripts/install-windows.ps1 `
  -OutFile "$env:TEMP\chat-sync-install.ps1"

powershell -ExecutionPolicy Bypass -File "$env:TEMP\chat-sync-install.ps1"
```

Скрипт:

1. Проверит, установлен ли DeepSeek Harness, и при необходимости скачает
   официальный установщик.
2. Проверит Git и GitHub CLI, при необходимости поставит их через `winget`.
3. Попросит войти в GitHub как `Eugene-doc`.
4. Проверит доступ к приватному репозиторию `Eugene-doc/dsh-sync`.
5. Установит плагин из релиза
   [v1.4.1](https://github.com/Eugene-doc/dsh-chat-sync/releases/tag/v1.4.1).
6. Запишет конфигурацию по умолчанию.

После этого полностью закройте и откройте DeepSeek Harness, зайдите в
**Настройки → Чаты** и нажмите **Синхронизировать**.

Если `winget` недоступен, установите Git и GitHub CLI вручную с официальных
сайтов и запустите скрипт ещё раз.

## Способ 2: вручную

1. Установите [DeepSeek Harness](https://download.deepseek.com/desktop/dsh-latest-windows-x64.exe)
   и запустите его один раз, чтобы создался профиль.
2. Установите [Git](https://git-scm.com/downloads) и
   [GitHub CLI](https://cli.github.com/).
3. Войдите в GitHub и настройте Git:

   ```powershell
   gh auth login --hostname github.com --git-protocol https --web
   gh auth setup-git
   gh repo view Eugene-doc/dsh-sync --json visibility
   ```

4. Установите плагин:

   ```powershell
   & "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
     plugin --profile desktop add `
     "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.4.1/dsh-chat-sync-1.4.1.tgz"
   ```

5. Полностью закройте и снова откройте DSH.
6. Откройте **Настройки → Чаты** и нажмите **Синхронизировать**.
   Репозиторий по умолчанию: `https://github.com/Eugene-doc/dsh-sync.git`,
   ветка `main`.

## Если DSH не удаляли, а только переустановили

Папка `C:\Users\<user>\.dsh` может остаться на месте. Не удаляйте её до первой
синхронизации: локальные чаты и настройки плагина помогут восстановиться даже
без сети. После установки плагина нажмите **Синхронизировать** — плагин
объединит локальную историю с репозиторием.

## Если репозиторий переименован или удалён

В **Настройки → Чаты → Изменить** укажите новый адрес приватного репозитория.
Если репозиторий удалён на GitHub, его содержимое нужно восстанавливать из
резервной копии: обычный Git-клон без remote не содержит удалённых данных.

## Что подготовить заранее

- Доступ к аккаунту GitHub `Eugene-doc`: пароль, второй фактор или recovery-коды.
- Успешную синхронизацию перед переустановкой: **Синхронизировать**, дождаться
  зелёного статуса и коммита в приватном репозитории.
- При необходимости — копию папки `C:\Users\<user>\.dsh` на внешний диск.
- Отдельно сохранить API-ключи и настройки моделей: они не синхронизируются.
- Если нужны вложения, заранее включить **Передавать вложения** и дождаться
  завершения синхронизации.

<details>
<summary><b>English version</b></summary>

# Reinstalling Windows or recovering the app

The plugin and the chat history are separate things. The plugin can be installed
again from the public repository, while the history lives in the private
[`Eugene-doc/dsh-sync`](https://github.com/Eugene-doc/dsh-sync) repository.

## What happens to the data

| Item | Location | Survives a Windows reinstall |
| --- | --- | --- |
| Plugin code | GitHub, public repository | Yes |
| Chat history | Private Git repository | Yes, if the last sync uploaded the changes |
| Local sessions | `C:\Users\<user>\.dsh\sessions` | No, after C: is formatted |
| API keys and DSH settings | `C:\Users\<user>\.dsh\.credentials.yaml` and the profile | No, configure them again |
| Attachments | Locally, plus the repository when enabled | Only when attachment sync was on |

After a clean Windows install the local `.dsh` folder is gone. Everything that
was uploaded to the private repository is downloaded again by the plugin.
Anything that did not finish uploading cannot be recovered locally.

## Option 1: one script

Open PowerShell as the user and run:

```powershell
irm https://raw.githubusercontent.com/Eugene-doc/dsh-chat-sync/main/scripts/install-windows.ps1 `
  -OutFile "$env:TEMP\chat-sync-install.ps1"

powershell -ExecutionPolicy Bypass -File "$env:TEMP\chat-sync-install.ps1"
```

The script:

1. Checks whether DeepSeek Harness is installed and downloads the official
   installer if needed.
2. Checks Git and GitHub CLI and installs them through `winget` if needed.
3. Asks you to sign in to GitHub as `Eugene-doc`.
4. Checks access to the private `Eugene-doc/dsh-sync` repository.
5. Installs the plugin from the
   [v1.4.1](https://github.com/Eugene-doc/dsh-chat-sync/releases/tag/v1.4.1)
   release.
6. Writes the default configuration.

Then fully quit and reopen DeepSeek Harness, open **Settings → Chats** and press
**Sync now**.

If `winget` is unavailable, install Git and GitHub CLI manually from their
official sites and run the script again.

## Option 2: manual

1. Install [DeepSeek Harness](https://download.deepseek.com/desktop/dsh-latest-windows-x64.exe)
   and launch it once so the profile is created.
2. Install [Git](https://git-scm.com/downloads) and
   [GitHub CLI](https://cli.github.com/).
3. Sign in to GitHub and configure Git:

   ```powershell
   gh auth login --hostname github.com --git-protocol https --web
   gh auth setup-git
   gh repo view Eugene-doc/dsh-sync --json visibility
   ```

4. Install the plugin:

   ```powershell
   & "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
     plugin --profile desktop add `
     "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.4.1/dsh-chat-sync-1.4.1.tgz"
   ```

5. Fully quit and reopen DSH.
6. Open **Settings → Chats** and press **Sync now**. The default repository is
   `https://github.com/Eugene-doc/dsh-sync.git`, branch `main`.

## If DSH was reinstalled but not removed

The `C:\Users\<user>\.dsh` folder may still exist. Do not delete it before the
first sync: local chats and plugin settings can help recovery even without a
network. After installing the plugin, press **Sync now**; the plugin merges the
local history with the repository.

## If the repository was renamed or deleted

Open **Settings → Chats → Change** and enter the new private repository address.
If the repository was deleted on GitHub, its contents must be restored from a
backup: an ordinary local Git clone without a remote does not contain deleted
history.

## What to prepare in advance

- Access to the GitHub account `Eugene-doc`: password, second factor, or recovery
  codes.
- A successful sync before reinstalling: press **Sync now**, wait for the green
  state and a commit in the private repository.
- A copy of `C:\Users\<user>\.dsh` on an external disk, if desired.
- Save API keys and model settings separately; they are not synced.
- If attachments are needed, enable **Include attachments** in advance and let
  the sync finish.

</details>

