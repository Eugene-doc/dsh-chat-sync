# Chat Sync bootstrap for another Windows PC.
#
# Installs DeepSeek Harness (if missing), Git and GitHub CLI, signs Git in to
# the account that owns the private relay, installs the Chat Sync plugin from
# the GitHub release, and writes the default sync configuration.
#
# Run in PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\setup-dsh-sync.ps1

$ErrorActionPreference = 'Stop'

$ReleaseUrl = 'https://github.com/Eugene-doc/dsh-chat-sync/releases/download/v1.5.2/dsh-chat-sync-1.5.2.tgz'
$Owner = 'Eugene-doc'
$RelayRepo = 'Eugene-doc/dsh-sync'

function Refresh-Path {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user"
}

function Find-Dsh {
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness'),
        (Join-Path $env:ProgramFiles 'DeepSeek Harness')
    )
    foreach ($dir in $candidates) {
        $cmd = Join-Path $dir 'resources\runtime\cli\bin\dsh.cmd'
        if (Test-Path $cmd) { return $cmd }
    }
    return $null
}

function Ensure-Winget {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw 'winget is not available. Install "App Installer" from Microsoft Store and rerun the script.'
    }
}

function Install-WingetPackage([string]$Id) {
    Write-Host "Installing $Id ..."
    winget install --id $Id -e --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
    Refresh-Path
}

Refresh-Path

# --- DeepSeek Harness -----------------------------------------------------------
$dsh = Find-Dsh
if (-not $dsh) {
    Write-Host 'DeepSeek Harness Desktop is not installed. Downloading the official installer...'
    $installer = Join-Path $env:TEMP 'dsh-latest-windows-x64.exe'
    curl.exe -L --fail --retry 3 --retry-delay 2 -o $installer 'https://download.deepseek.com/desktop/dsh-latest-windows-x64.exe'
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $installer)) {
        throw 'Could not download the DeepSeek Harness installer.'
    }
    Write-Host 'Installing DeepSeek Harness (silent)...'
    Start-Process -FilePath $installer -ArgumentList '/S' -Wait
    Start-Sleep -Seconds 5
    $dsh = Find-Dsh
    if (-not $dsh) {
        Write-Host 'Silent installation did not complete. The installer window will open; finish it, then press Enter.'
        Start-Process -FilePath $installer -Wait
        $dsh = Find-Dsh
    }
    if (-not $dsh) { throw 'DeepSeek Harness is still not installed.' }
}
Write-Host "DeepSeek Harness: $dsh"

# --- Git and GitHub CLI ---------------------------------------------------------
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Ensure-Winget
    Install-WingetPackage 'Git.Git'
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is still not available on PATH.' }

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Ensure-Winget
    Install-WingetPackage 'GitHub.cli'
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'GitHub CLI (gh) is still not available on PATH.' }

# --- GitHub account that owns the private relay ---------------------------------
$login = ''
try { $login = (& gh api user --jq .login 2>$null) } catch { $login = '' }
if ($login -ne $Owner) {
    Write-Host "Sign in to GitHub as $Owner (the account that owns the private relay)."
    & gh auth login --hostname github.com --git-protocol https --web
    if ($LASTEXITCODE -ne 0) { throw 'GitHub sign-in failed.' }

    $login = ''
    try { $login = (& gh api user --jq .login 2>$null) } catch { $login = '' }
    if ($login -ne $Owner) {
        $old = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        & gh auth switch --hostname github.com --user $Owner
        $ErrorActionPreference = $old
        $login = ''
        try { $login = (& gh api user --jq .login 2>$null) } catch { $login = '' }
    }
    if ($login -ne $Owner) { throw "GitHub CLI is signed in as '$login', expected '$Owner'." }
}

Write-Host 'Configuring Git credentials...'
& gh auth setup-git

Write-Host 'Checking access to the private relay...'
& gh repo view $RelayRepo --json visibility,viewerPermission | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "No access to $RelayRepo. Sign in with the account that owns this private repository."
}

# --- Chat Sync plugin -----------------------------------------------------------
$dshHome = Join-Path $env:USERPROFILE '.dsh'
$profileJson = Join-Path $dshHome 'profiles\desktop\package.json'
$pluginInstalled = (Test-Path $profileJson) -and ((Get-Content $profileJson -Raw) -match 'dsh-chat-sync')

if (-not $pluginInstalled) {
    Write-Host 'Installing the Chat Sync plugin from the GitHub release...'
    & $dsh plugin --profile desktop add $ReleaseUrl
    if ($LASTEXITCODE -ne 0) {
        throw 'Plugin installation failed. Open DeepSeek Harness, go to Plugins, and install the release URL manually.'
    }
} else {
    Write-Host 'Chat Sync plugin is already installed.'
}

# --- Default sync configuration -------------------------------------------------
$configDir = Join-Path $dshHome 'chat-sync'
New-Item -ItemType Directory -Force -Path $configDir | Out-Null
$configPath = Join-Path $configDir 'config.json'

$config = [ordered]@{
    remote             = 'https://github.com/Eugene-doc/dsh-sync.git'
    branch             = 'main'
    autoSync           = $true
    intervalMinutes    = 10
    includeAttachments = $false
}
$config | ConvertTo-Json | Set-Content -Path $configPath -Encoding utf8
Write-Host "Wrote $configPath"

Write-Host ''
Write-Host 'Done.'
Write-Host 'Fully quit DeepSeek Harness and open it again.'
Write-Host 'Open Settings -> Chats and press "Sync now" to fetch this computer''s history.'

