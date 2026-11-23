# Р’РѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ РїРѕСЃР»Рµ РїРµСЂРµСѓСЃС‚Р°РЅРѕРІРєРё

РџР»Р°РіРёРЅ Рё РёСЃС‚РѕСЂРёСЏ С‡Р°С‚РѕРІ вЂ” СЂР°Р·РЅС‹Рµ РІРµС‰Рё. РЎР°Рј РїР»Р°РіРёРЅ РјРѕР¶РЅРѕ РїРѕСЃС‚Р°РІРёС‚СЊ Р·Р°РЅРѕРІРѕ РёР·
РїСѓР±Р»РёС‡РЅРѕРіРѕ СЂРµРїРѕР·РёС‚РѕСЂРёСЏ, Р° РёСЃС‚РѕСЂРёСЏ Р»РµР¶РёС‚ РІ РїСЂРёРІР°С‚РЅРѕРј
[`Eugene-doc/dsh-sync`](https://github.com/Eugene-doc/dsh-sync).

## Р§С‚Рѕ СЃР»СѓС‡РёС‚СЃСЏ СЃ РґР°РЅРЅС‹РјРё

| Р§С‚Рѕ | Р“РґРµ С…СЂР°РЅРёС‚СЃСЏ | РџРµСЂРµР¶РёРІС‘С‚ РїРµСЂРµСѓСЃС‚Р°РЅРѕРІРєСѓ Windows |
| --- | --- | --- |
| РљРѕРґ РїР»Р°РіРёРЅР° | GitHub, РїСѓР±Р»РёС‡РЅС‹Р№ СЂРµРїРѕР·РёС‚РѕСЂРёР№ | Р”Р° |
| РСЃС‚РѕСЂРёСЏ С‡Р°С‚РѕРІ | РџСЂРёРІР°С‚РЅС‹Р№ Git-СЂРµРїРѕР·РёС‚РѕСЂРёР№ | Р”Р°, РµСЃР»Рё РїРѕСЃР»РµРґРЅСЏСЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ СѓСЃРїРµР»Р° Р·Р°РіСЂСѓР·РёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ |
| Р›РѕРєР°Р»СЊРЅС‹Рµ СЃРµСЃСЃРёРё | `C:\Users\<user>\.dsh\sessions` | РќРµС‚, РµСЃР»Рё РґРёСЃРє C: РѕС‚С„РѕСЂРјР°С‚РёСЂРѕРІР°РЅ |
| API-РєР»СЋС‡Рё Рё РЅР°СЃС‚СЂРѕР№РєРё DSH | `C:\Users\<user>\.dsh\.credentials.yaml` Рё РїСЂРѕС„РёР»СЊ | РќРµС‚, РёС… РЅСѓР¶РЅРѕ РЅР°СЃС‚СЂРѕРёС‚СЊ Р·Р°РЅРѕРІРѕ |
| Р’Р»РѕР¶РµРЅРёСЏ | Р›РѕРєР°Р»СЊРЅРѕ + СЂРµРїРѕР·РёС‚РѕСЂРёР№, РµСЃР»Рё РІРєР»СЋС‡С‘РЅ С‚СѓРјР±Р»РµСЂ | РўРѕР»СЊРєРѕ РµСЃР»Рё РІРєР»СЋС‡РµРЅР° СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ РІР»РѕР¶РµРЅРёР№ |

РџРѕСЃР»Рµ С‡РёСЃС‚РѕР№ СѓСЃС‚Р°РЅРѕРІРєРё Windows Р»РѕРєР°Р»СЊРЅР°СЏ РїР°РїРєР° `.dsh` РёСЃС‡РµР·РЅРµС‚. Р’СЃС‘, С‡С‚Рѕ Р±С‹Р»Рѕ
Р·Р°РіСЂСѓР¶РµРЅРѕ РІ РїСЂРёРІР°С‚РЅС‹Р№ СЂРµРїРѕР·РёС‚РѕСЂРёР№, РїР»Р°РіРёРЅ СЃРєР°С‡Р°РµС‚ Р·Р°РЅРѕРІРѕ. Р’СЃС‘, С‡С‚Рѕ РЅРµ СѓСЃРїРµР»Рѕ
Р·Р°РіСЂСѓР·РёС‚СЊСЃСЏ, РІРѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ Р±СѓРґРµС‚ РЅРµРѕС‚РєСѓРґР°.

## РЎРїРѕСЃРѕР± 1: РѕРґРёРЅ СЃРєСЂРёРїС‚

РћС‚РєСЂРѕР№С‚Рµ PowerShell РѕС‚ РёРјРµРЅРё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Рё РІС‹РїРѕР»РЅРёС‚Рµ:

```powershell
irm https://raw.githubusercontent.com/Eugene-doc/dsh-chat-sync/main/scripts/install-windows.ps1 `
  -OutFile "$env:TEMP\chat-sync-install.ps1"

powershell -ExecutionPolicy Bypass -File "$env:TEMP\chat-sync-install.ps1"
```

РЎРєСЂРёРїС‚:

1. РџСЂРѕРІРµСЂРёС‚, СѓСЃС‚Р°РЅРѕРІР»РµРЅ Р»Рё DeepSeek Harness, Рё РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё СЃРєР°С‡Р°РµС‚
   РѕС„РёС†РёР°Р»СЊРЅС‹Р№ СѓСЃС‚Р°РЅРѕРІС‰РёРє.
2. РџСЂРѕРІРµСЂРёС‚ Git Рё GitHub CLI, РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё РїРѕСЃС‚Р°РІРёС‚ РёС… С‡РµСЂРµР· `winget`.
3. РџРѕРїСЂРѕСЃРёС‚ РІРѕР№С‚Рё РІ GitHub РєР°Рє `Eugene-doc`.
4. РџСЂРѕРІРµСЂРёС‚ РґРѕСЃС‚СѓРї Рє РїСЂРёРІР°С‚РЅРѕРјСѓ СЂРµРїРѕР·РёС‚РѕСЂРёСЋ `Eugene-doc/dsh-sync`.
5. РЈСЃС‚Р°РЅРѕРІРёС‚ РїР»Р°РіРёРЅ РёР· СЂРµР»РёР·Р°
   [v1.8.0](https://github.com/Eugene-doc/dsh-chat-sync/releases/tag/v1.8.0).
6. Р—Р°РїРёС€РµС‚ РєРѕРЅС„РёРіСѓСЂР°С†РёСЋ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ.

РџРѕСЃР»Рµ СЌС‚РѕРіРѕ РїРѕР»РЅРѕСЃС‚СЊСЋ Р·Р°РєСЂРѕР№С‚Рµ Рё РѕС‚РєСЂРѕР№С‚Рµ DeepSeek Harness, Р·Р°Р№РґРёС‚Рµ РІ
**РќР°СЃС‚СЂРѕР№РєРё в†’ Р§Р°С‚С‹** Рё РЅР°Р¶РјРёС‚Рµ **РЎРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ**.

Р•СЃР»Рё `winget` РЅРµРґРѕСЃС‚СѓРїРµРЅ, СѓСЃС‚Р°РЅРѕРІРёС‚Рµ Git Рё GitHub CLI РІСЂСѓС‡РЅСѓСЋ СЃ РѕС„РёС†РёР°Р»СЊРЅС‹С…
СЃР°Р№С‚РѕРІ Рё Р·Р°РїСѓСЃС‚РёС‚Рµ СЃРєСЂРёРїС‚ РµС‰С‘ СЂР°Р·.

## РЎРїРѕСЃРѕР± 2: РІСЂСѓС‡РЅСѓСЋ

1. РЈСЃС‚Р°РЅРѕРІРёС‚Рµ [DeepSeek Harness](https://download.deepseek.com/desktop/dsh-latest-windows-x64.exe)
   Рё Р·Р°РїСѓСЃС‚РёС‚Рµ РµРіРѕ РѕРґРёРЅ СЂР°Р·, С‡С‚РѕР±С‹ СЃРѕР·РґР°Р»СЃСЏ РїСЂРѕС„РёР»СЊ.
2. РЈСЃС‚Р°РЅРѕРІРёС‚Рµ [Git](https://git-scm.com/downloads) Рё
   [GitHub CLI](https://cli.github.com/).
3. Р’РѕР№РґРёС‚Рµ РІ GitHub Рё РЅР°СЃС‚СЂРѕР№С‚Рµ Git:

   ```powershell
   gh auth login --hostname github.com --git-protocol https --web
   gh auth setup-git
   gh repo view Eugene-doc/dsh-sync --json visibility
   ```

4. РЈСЃС‚Р°РЅРѕРІРёС‚Рµ РїР»Р°РіРёРЅ:

   ```powershell
   & "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
     plugin --profile desktop add `
     "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.8.0/dsh-chat-sync-1.8.0.tgz"
   ```

5. РџРѕР»РЅРѕСЃС‚СЊСЋ Р·Р°РєСЂРѕР№С‚Рµ Рё СЃРЅРѕРІР° РѕС‚РєСЂРѕР№С‚Рµ DSH.
6. РћС‚РєСЂРѕР№С‚Рµ **РќР°СЃС‚СЂРѕР№РєРё в†’ Р§Р°С‚С‹** Рё РЅР°Р¶РјРёС‚Рµ **РЎРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ**.
   Р РµРїРѕР·РёС‚РѕСЂРёР№ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ: `https://github.com/Eugene-doc/dsh-sync.git`,
   РІРµС‚РєР° `main`.

## Р•СЃР»Рё DSH РЅРµ СѓРґР°Р»СЏР»Рё, Р° С‚РѕР»СЊРєРѕ РїРµСЂРµСѓСЃС‚Р°РЅРѕРІРёР»Рё

РџР°РїРєР° `C:\Users\<user>\.dsh` РјРѕР¶РµС‚ РѕСЃС‚Р°С‚СЊСЃСЏ РЅР° РјРµСЃС‚Рµ. РќРµ СѓРґР°Р»СЏР№С‚Рµ РµС‘ РґРѕ РїРµСЂРІРѕР№
СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё: Р»РѕРєР°Р»СЊРЅС‹Рµ С‡Р°С‚С‹ Рё РЅР°СЃС‚СЂРѕР№РєРё РїР»Р°РіРёРЅР° РїРѕРјРѕРіСѓС‚ РІРѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊСЃСЏ РґР°Р¶Рµ
Р±РµР· СЃРµС‚Рё. РџРѕСЃР»Рµ СѓСЃС‚Р°РЅРѕРІРєРё РїР»Р°РіРёРЅР° РЅР°Р¶РјРёС‚Рµ **РЎРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ** вЂ” РїР»Р°РіРёРЅ
РѕР±СЉРµРґРёРЅРёС‚ Р»РѕРєР°Р»СЊРЅСѓСЋ РёСЃС‚РѕСЂРёСЋ СЃ СЂРµРїРѕР·РёС‚РѕСЂРёРµРј.

## Р•СЃР»Рё СЂРµРїРѕР·РёС‚РѕСЂРёР№ РїРµСЂРµРёРјРµРЅРѕРІР°РЅ РёР»Рё СѓРґР°Р»С‘РЅ

Р’ **РќР°СЃС‚СЂРѕР№РєРё в†’ Р§Р°С‚С‹ в†’ РР·РјРµРЅРёС‚СЊ** СѓРєР°Р¶РёС‚Рµ РЅРѕРІС‹Р№ Р°РґСЂРµСЃ РїСЂРёРІР°С‚РЅРѕРіРѕ СЂРµРїРѕР·РёС‚РѕСЂРёСЏ.
Р•СЃР»Рё СЂРµРїРѕР·РёС‚РѕСЂРёР№ СѓРґР°Р»С‘РЅ РЅР° GitHub, РµРіРѕ СЃРѕРґРµСЂР¶РёРјРѕРµ РЅСѓР¶РЅРѕ РІРѕСЃСЃС‚Р°РЅР°РІР»РёРІР°С‚СЊ РёР·
СЂРµР·РµСЂРІРЅРѕР№ РєРѕРїРёРё: РѕР±С‹С‡РЅС‹Р№ Git-РєР»РѕРЅ Р±РµР· remote РЅРµ СЃРѕРґРµСЂР¶РёС‚ СѓРґР°Р»С‘РЅРЅС‹С… РґР°РЅРЅС‹С….

## Р§С‚Рѕ РїРѕРґРіРѕС‚РѕРІРёС‚СЊ Р·Р°СЂР°РЅРµРµ

- Р”РѕСЃС‚СѓРї Рє Р°РєРєР°СѓРЅС‚Сѓ GitHub `Eugene-doc`: РїР°СЂРѕР»СЊ, РІС‚РѕСЂРѕР№ С„Р°РєС‚РѕСЂ РёР»Рё recovery-РєРѕРґС‹.
- РЈСЃРїРµС€РЅСѓСЋ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЋ РїРµСЂРµРґ РїРµСЂРµСѓСЃС‚Р°РЅРѕРІРєРѕР№: **РЎРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ**, РґРѕР¶РґР°С‚СЊСЃСЏ
  Р·РµР»С‘РЅРѕРіРѕ СЃС‚Р°С‚СѓСЃР° Рё РєРѕРјРјРёС‚Р° РІ РїСЂРёРІР°С‚РЅРѕРј СЂРµРїРѕР·РёС‚РѕСЂРёРё.
- РџСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё вЂ” РєРѕРїРёСЋ РїР°РїРєРё `C:\Users\<user>\.dsh` РЅР° РІРЅРµС€РЅРёР№ РґРёСЃРє.
- РћС‚РґРµР»СЊРЅРѕ СЃРѕС…СЂР°РЅРёС‚СЊ API-РєР»СЋС‡Рё Рё РЅР°СЃС‚СЂРѕР№РєРё РјРѕРґРµР»РµР№: РѕРЅРё РЅРµ СЃРёРЅС…СЂРѕРЅРёР·РёСЂСѓСЋС‚СЃСЏ.
- Р•СЃР»Рё РЅСѓР¶РЅС‹ РІР»РѕР¶РµРЅРёСЏ, Р·Р°СЂР°РЅРµРµ РІРєР»СЋС‡РёС‚СЊ **РџРµСЂРµРґР°РІР°С‚СЊ РІР»РѕР¶РµРЅРёСЏ** Рё РґРѕР¶РґР°С‚СЊСЃСЏ
  Р·Р°РІРµСЂС€РµРЅРёСЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё.

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
   [v1.8.0](https://github.com/Eugene-doc/dsh-chat-sync/releases/tag/v1.8.0)
   release.
6. Writes the default configuration.

Then fully quit and reopen DeepSeek Harness, open **Settings в†’ Chats** and press
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
     "https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.8.0/dsh-chat-sync-1.8.0.tgz"
   ```

5. Fully quit and reopen DSH.
6. Open **Settings в†’ Chats** and press **Sync now**. The default repository is
   `https://github.com/Eugene-doc/dsh-sync.git`, branch `main`.

## If DSH was reinstalled but not removed

The `C:\Users\<user>\.dsh` folder may still exist. Do not delete it before the
first sync: local chats and plugin settings can help recovery even without a
network. After installing the plugin, press **Sync now**; the plugin merges the
local history with the repository.

## If the repository was renamed or deleted

Open **Settings в†’ Chats в†’ Change** and enter the new private repository address.
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


