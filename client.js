window.__ModuleLoader__.load({
  id: 'dsh-chat-sync',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'chat-sync'

    const DICTIONARIES = {
      en: {
        nav: 'Chat Sync',
        eyebrow: 'CONVERSATIONS, EVERYWHERE',
        title: 'Chat Sync',
        subtitle: 'Pick up the same conversation on any computer. History travels through your private GitHub repository.',
        syncNow: 'Sync now',
        syncing: 'Syncing…',
        openRepo: 'Open repository',
        allCaught: 'All caught up',
        needsAttention: 'Needs attention',
        readyFirst: 'Ready for the first sync',
        waitingFirst: 'Waiting for the first sync',
        lastSync: 'Last sync {time}',
        never: 'Never synced',
        localChats: 'Chats here',
        relayChats: 'In the relay',
        computers: 'Computers',
        conflicts: 'Conflicts',
        chats: 'chats',
        chat: 'chat',
        chatFew: 'chats',
        thisComputer: 'This computer',
        lastSeen: 'Last sync {time}',
        deviceChats: '{count} · {size}',
        connection: 'Connection',
        connectionDesc: 'The private repository where your computers meet.',
        private: 'Private',
        public: 'Public',
        publicWarning: 'This repository is public',
        publicWarningBody: 'Anyone can read the chat history in this repository. Switch to a private repository before syncing personal conversations.',
        branch: 'Branch',
        change: 'Change',
        cancel: 'Cancel',
        save: 'Save and connect',
        repoPlaceholder: 'Eugene-doc/dsh-sync',
        repoHint: 'Use owner/repo or a GitHub HTTPS address.',
        branchHint: 'Branch',
        automation: 'Automation',
        automationDesc: 'Keep the relay current without thinking about it.',
        autoSync: 'Sync automatically',
        autoSyncDesc: 'On launch and every {minutes} minutes while the app is open.',
        interval: 'Frequency',
        intervalDesc: 'How often changes are exchanged while the app is open.',
        every: 'Every {minutes} min',
        includeAttachments: 'Include attachments',
        includeAttachmentsDesc: 'Images and files referenced by chats. This can make the repository much larger.',
        addComputerName: 'Add computer name to duplicate titles',
        addComputerNameDesc: 'When an imported chat has the same title as another chat, append “ · PC name” so they are easy to tell apart.',
        devices: 'Computers',
        devicesDesc: 'Each computer keeps its own snapshot of the conversation history.',
        noOtherDevices: 'Open DSH on another computer with this plugin and the same GitHub account. It will appear here after the first sync.',
        attachChats: 'Attach chats to workspaces',
        attachChatsDesc: 'Place every discovered session in a workspace. Chat content and archive flags are not changed.',
        attachChatsAction: 'Attach chats',
        attachChatsBusy: 'Attaching…',
        attachChatsDone: 'Attached: {attached}.',
        attachChatsNone: 'All chats are already attached.',
        activityRepaired: 'Attached: {attached}',
        syncArchive: 'Sync the archive',
        syncArchiveDesc: 'Archived chats stay hidden on every computer. Unarchiving a chat also syncs.',
        archiveActivity: 'Archived: {archived}; restored: {unarchived}',
        resolveConflicts: 'Keep the newest version on conflict',
        resolveConflictsDesc: 'When the same chat changed on two computers, the newer version replaces the older one. The replaced copy is kept in the conflicts folder.',
        replaced: '{count} replaced',
        activity: 'Activity',
        activityDesc: 'What happened recently.',
        noActivity: 'No sync activity yet.',
        conflictsTitle: 'Some chats need a decision',
        conflictsDesc: 'The same chat changed on two computers. The local version was kept and the remote copy is preserved in the conflicts folder.',
        copyPath: 'Copy folder path',
        copied: 'Copied',
        privacy: 'Only chats and, when enabled, attachments are uploaded. App credentials and settings are never read. Anything you typed into a chat is part of its history, so keep this repository private.',
        firstHint: 'Run the first sync to create this computer’s snapshot in the relay.',
        upToDate: 'Already up to date',
        incoming: '{count} received',
        outgoing: '{count} sent',
        updated: '{count} updated',
        renamed: '{count} renamed',
        conflictCount: '{count} conflicts',
        syncError: 'Sync did not finish',
        details: 'Details',
        hideDetails: 'Hide details',
        retry: 'Try again',
        gitMissing: 'Git is not installed on this computer.',
        githubMissing: 'GitHub CLI is not signed in.',
        warnings: 'Notes from this sync',
        repoChanged: 'Repository changed. The next sync will rebuild the local relay.',
        connectionError: 'Could not reach the repository.',
        phaseStarting: 'Preparing this computer…',
        phaseChecking: 'Checking the private repository…',
        phasePulling: 'Downloading chats…',
        phaseMerging: 'Merging chat history…',
        phaseUploading: 'Uploading this computer’s chats…',
        phaseFinalizing: 'Publishing changes…',
        phaseIdle: 'Ready',
        phaseError: 'Sync stopped',
        progress: '{progress}%',
        footer: 'Chat Sync · private relay',
        transferLine: '{duration} · {size} · commit {commit}',
        transferLineNoCommit: '{duration} · {size}',
        noGit: 'Git not found',
        signedInAs: 'GitHub @{user}',
        branchDefault: 'main',
        openConflicts: 'Conflicts are saved in {path}',
        refresh: 'Refresh',
        statusUnknown: 'Reading relay status…',
        errorGeneric: 'Something went wrong.',
      },
      ru: {
        nav: 'Чаты',
        eyebrow: 'РАЗГОВОРЫ — ВЕЗДЕ',
        title: 'Синхронизация чатов',
        subtitle: 'Продолжайте один и тот же разговор на любом компьютере. История передаётся через ваш приватный репозиторий GitHub.',
        syncNow: 'Синхронизировать',
        syncing: 'Синхронизация…',
        openRepo: 'Открыть репозиторий',
        allCaught: 'Всё синхронизировано',
        needsAttention: 'Нужно внимание',
        readyFirst: 'Готово к первой синхронизации',
        waitingFirst: 'Ждём первую синхронизацию',
        lastSync: 'Последняя синхронизация {time}',
        never: 'Ещё не синхронизировалось',
        localChats: 'Чатов здесь',
        relayChats: 'В репозитории',
        computers: 'Компьютеров',
        conflicts: 'Конфликтов',
        chats: 'чатов',
        chat: 'чат',
        chatFew: 'чата',
        thisComputer: 'Этот компьютер',
        lastSeen: 'Был(а) в сети {time}',
        deviceChats: '{count} · {size}',
        connection: 'Подключение',
        connectionDesc: 'Приватный репозиторий, где встречаются ваши компьютеры.',
        private: 'Приватный',
        public: 'Публичный',
        publicWarning: 'Этот репозиторий публичный',
        publicWarningBody: 'Любой может прочитать историю чатов в этом репозитории. Переключитесь на приватный репозиторий, прежде чем синхронизировать личные разговоры.',
        branch: 'Ветка',
        change: 'Изменить',
        cancel: 'Отмена',
        save: 'Сохранить и подключить',
        repoPlaceholder: 'Eugene-doc/dsh-sync',
        repoHint: 'Укажите owner/repo или HTTPS-адрес GitHub.',
        branchHint: 'Ветка',
        automation: 'Автоматизация',
        automationDesc: 'Поддерживайте репозиторий актуальным без лишних действий.',
        autoSync: 'Синхронизировать автоматически',
        autoSyncDesc: 'При запуске и каждые {minutes} минут, пока приложение открыто.',
        interval: 'Периодичность',
        intervalDesc: 'Как часто обмениваться изменениями, пока приложение открыто.',
        every: 'Каждые {minutes} мин',
        includeAttachments: 'Передавать вложения',
        includeAttachmentsDesc: 'Изображения и файлы из чатов. Репозиторий может заметно вырасти.',
        addComputerName: 'Добавлять имя компьютера к одинаковым названиям',
        addComputerNameDesc: 'Если у импортированного чата совпадает название с другим чатом, добавить « · Имя ПК», чтобы их было легко различить.',
        devices: 'Компьютеры',
        devicesDesc: 'Каждый компьютер хранит собственную копию истории разговоров.',
        noOtherDevices: 'Откройте DSH на другом компьютере с этим плагином и тем же аккаунтом GitHub. Он появится здесь после первой синхронизации.',
        attachChats: 'Прикрепить чаты к рабочим областям',
        attachChatsDesc: 'Разложить все найденные сессии по рабочим областям. Содержимое и архивные флаги не меняются.',
        attachChatsAction: 'Прикрепить чаты',
        attachChatsBusy: 'Прикрепляю…',
        attachChatsDone: 'Прикреплено: {attached}.',
        attachChatsNone: 'Все чаты уже прикреплены.',
        activityRepaired: 'Прикреплено: {attached}',
        syncArchive: 'Синхронизировать архив',
        syncArchiveDesc: 'Архивные чаты остаются скрытыми на всех компьютерах. Снятие с архива тоже синхронизируется.',
        archiveActivity: 'В архив: {archived}; из архива: {unarchived}',
        resolveConflicts: 'Оставлять свежую версию при конфликте',
        resolveConflictsDesc: 'Если один и тот же чат изменился на двух компьютерах, более свежая версия заменит старую. Заменённая копия сохраняется в папке конфликтов.',
        replaced: 'Заменено: {count}',
        activity: 'Активность',
        activityDesc: 'Что произошло недавно.',
        noActivity: 'Событий синхронизации пока нет.',
        conflictsTitle: 'Некоторые чаты требуют решения',
        conflictsDesc: 'Один и тот же чат изменился на двух компьютерах. Локальная версия сохранена, удалённая копия лежит в папке конфликтов.',
        copyPath: 'Скопировать путь',
        copied: 'Скопировано',
        privacy: 'Передаются только чаты и, если включено, вложения. Учётные данные приложения и настройки не читаются. Всё, что вы написали в чате, входит в его историю, поэтому держите репозиторий приватным.',
        firstHint: 'Запустите первую синхронизацию, чтобы создать снимок этого компьютера в репозитории.',
        upToDate: 'Уже актуально',
        incoming: 'Получено: {count}',
        outgoing: 'Отправлено: {count}',
        updated: 'Обновлено: {count}',
        renamed: 'Переименовано: {count}',
        conflictCount: 'Конфликтов: {count}',
        syncError: 'Синхронизация не завершилась',
        details: 'Подробности',
        hideDetails: 'Скрыть подробности',
        retry: 'Повторить',
        gitMissing: 'На этом компьютере не установлен Git.',
        githubMissing: 'GitHub CLI не авторизован.',
        warnings: 'Замечания этой синхронизации',
        repoChanged: 'Репозиторий изменён. Следующая синхронизация пересоберёт локальную копию.',
        connectionError: 'Не удалось связаться с репозиторием.',
        phaseStarting: 'Готовим этот компьютер…',
        phaseChecking: 'Проверяем приватный репозиторий…',
        phasePulling: 'Скачиваем чаты…',
        phaseMerging: 'Объединяем историю…',
        phaseUploading: 'Отправляем чаты этого компьютера…',
        phaseFinalizing: 'Публикуем изменения…',
        phaseIdle: 'Готово',
        phaseError: 'Синхронизация остановлена',
        progress: '{progress}%',
        footer: 'Chat Sync · приватная синхронизация',
        transferLine: '{duration} · {size} · коммит {commit}',
        transferLineNoCommit: '{duration} · {size}',
        noGit: 'Git не найден',
        signedInAs: 'GitHub @{user}',
        branchDefault: 'main',
        openConflicts: 'Конфликты сохранены в {path}',
        refresh: 'Обновить',
        statusUnknown: 'Читаем состояние релея…',
        errorGeneric: 'Что-то пошло не так.',
      },
    }

    function translate(lang, key, params) {
      const dict = DICTIONARIES[String(lang || '').toLowerCase().startsWith('ru') ? 'ru' : 'en']
      let text = dict[key] ?? DICTIONARIES.en[key] ?? key
      for (const [name, value] of Object.entries(params || {})) {
        text = text.split(`{${name}}`).join(String(value))
      }
      return text
    }

    function useLocale(ctx) {
      const [, setRevision] = React.useState(0)
      React.useEffect(() => {
        if (!ctx.locale?.subscribe) return undefined
        return ctx.locale.subscribe(() => setRevision(value => value + 1))
      }, [ctx])
      return ctx.locale?.getSnapshot?.().active || navigator.language || 'en'
    }

    function formatBytes(bytes) {
      const value = Number(bytes) || 0
      if (value < 1024) return `${value} B`
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
      if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
      return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`
    }

    function relativeTime(iso, lang) {
      const timestamp = Date.parse(iso || '')
      if (!Number.isFinite(timestamp)) return translate(lang, 'never')
      const seconds = Math.round((timestamp - Date.now()) / 1000)
      const abs = Math.abs(seconds)
      const formatter = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
      if (abs < 60) return formatter.format(seconds, 'second')
      if (abs < 3600) return formatter.format(Math.round(seconds / 60), 'minute')
      if (abs < 86400) return formatter.format(Math.round(seconds / 3600), 'hour')
      return formatter.format(Math.round(seconds / 86400), 'day')
    }

    function formatDuration(ms) {
      const seconds = Math.max(0, Math.round((Number(ms) || 0) / 1000))
      if (seconds < 60) return `${seconds}s`
      return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`
    }

    function chatLabel(count, t, lang) {
      const value = Number(count) || 0
      if (String(lang || '').toLowerCase().startsWith('ru')) {
        const mod100 = Math.abs(value) % 100
        const mod10 = mod100 % 10
        const key = mod100 > 10 && mod100 < 20 ? 'chats' : mod10 === 1 ? 'chat' : mod10 >= 2 && mod10 <= 4 ? 'chatFew' : 'chats'
        return `${value} ${t(key)}`
      }
      return `${value} ${t(value === 1 ? 'chat' : 'chats')}`
    }

    function platformLabel(platform) {
      if (platform === 'win32') return 'Windows'
      if (platform === 'darwin') return 'macOS'
      if (platform === 'linux') return 'Linux'
      return platform || 'Desktop'
    }

    function statusTone(status) {
      if (status?.sync?.running) return 'busy'
      if (status?.last?.error) return 'error'
      if (status?.last?.ok) return 'ok'
      return 'idle'
    }

    function lastSummary(last, t) {
      if (!last) return t('firstHint')
      if (last.error) return String(last.error).split('\n')[0]
      const parts = []
      if (last.imported) parts.push(t('incoming', { count: last.imported }))
      if (last.updated) parts.push(t('updated', { count: last.updated }))
      if (last.replaced) parts.push(t('replaced', { count: last.replaced }))
      if (last.titlesRenamed) parts.push(t('renamed', { count: last.titlesRenamed }))
      if (last.archived || last.unarchived) {
        parts.push(
          t('archiveActivity', {
            archived: last.archived || 0,
            unarchived: last.unarchived || 0,
          }),
        )
      }
      if (last.exported) parts.push(t('outgoing', { count: last.exported }))
      if (last.conflicts) parts.push(t('conflictCount', { count: last.conflicts }))
      return parts.length ? parts.join(' · ') : t('upToDate')
    }

    function activityText(item, t) {
      if (item?.code === 'synced') {
        const parts = []
        if (item.data?.imported) parts.push(t('incoming', { count: item.data.imported }))
        if (item.data?.exported) parts.push(t('outgoing', { count: item.data.exported }))
        return parts.join(' · ') || t('upToDate')
      }
      if (item?.code === 'pulled') return t('incoming', { count: item.data?.imported || 0 })
      if (item?.code === 'renamed') return t('renamed', { count: item.data?.renamed || 0 })
      if (item?.code === 'repaired') {
        return t('activityRepaired', { attached: item.data?.attached || 0 })
      }
      if (item?.code === 'archive') {
        return t('archiveActivity', {
          archived: item.data?.archived || 0,
          unarchived: item.data?.unarchived || 0,
        })
      }
      if (item?.code === 'error') return t('syncError')
      return item?.text || ''
    }

    const CSS = `
      .cs-root {
        --cs-blue: #3b82f6;
        --cs-blue-deep: #1d4ed8;
        width: 100%;
        max-width: 720px;
        margin: 0 auto;
        padding: 2px 0 28px;
        color: var(--dsw-alias-label-primary);
        font-family: var(--dsw-font-family);
        font-size: 14px;
        line-height: 22px;
      }
      .cs-root *, .cs-root *::before, .cs-root *::after { box-sizing: border-box; }
      .cs-hero { display: flex; align-items: flex-start; gap: 14px; padding: 2px 0 20px; }
      .cs-mark {
        flex: none; width: 48px; height: 48px; border-radius: 14px;
        display: grid; place-items: center; color: #fff;
        background: linear-gradient(145deg, #4f8df7 0%, #2563eb 54%, #1e40af 100%);
        box-shadow: 0 7px 18px rgba(37, 99, 235, .24), inset 0 1px 0 rgba(255,255,255,.28);
      }
      .cs-mark svg { width: 27px; height: 27px; }
      .cs-eyebrow {
        color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 14px;
        font-weight: 600; letter-spacing: .13em; text-transform: uppercase; padding-top: 1px;
      }
      .cs-title { margin: 2px 0 1px; font-size: 22px; line-height: 30px; font-weight: 600; letter-spacing: -.012em; }
      .cs-sub { max-width: 520px; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
      .cs-hero-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; padding-top: 2px; }
      .cs-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        height: 34px; padding: 0 13px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l4);
        background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary);
        font: inherit; font-size: 13px; line-height: 20px; cursor: pointer; white-space: nowrap;
        transition: background .16s ease, border-color .16s ease, transform .16s ease, opacity .16s ease;
      }
      .cs-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
      .cs-btn:active:not(:disabled) { transform: translateY(1px); }
      .cs-btn:disabled { opacity: .55; cursor: default; }
      .cs-btn-primary {
        border-color: transparent; background: var(--dsw-alias-brand-primary);
        color: var(--dsw-alias-label-primary-foreground); font-weight: 500;
      }
      .cs-btn-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
      .cs-btn-quiet { border-color: transparent; background: transparent; color: var(--dsw-alias-label-secondary); }
      .cs-btn-quiet:hover:not(:disabled) { color: var(--dsw-alias-label-primary); }
      .cs-icon-btn { width: 30px; padding: 0; border-color: transparent; background: transparent; color: var(--dsw-alias-label-tertiary); }
      .cs-icon-btn:hover:not(:disabled) { color: var(--dsw-alias-label-primary); }
      .cs-card {
        border: 1px solid var(--dsw-alias-border-l2); border-radius: 16px;
        background: var(--dsw-alias-bg-layer-1);
        box-shadow: 0 1px 2px rgba(0,0,0,.025);
      }
      .cs-status { padding: 16px 16px 14px; }
      .cs-status-head { display: flex; align-items: flex-start; gap: 11px; }
      .cs-dot { flex: none; width: 9px; height: 9px; border-radius: 50%; margin-top: 7px; }
      .cs-dot.ok { background: var(--dsw-alias-state-success-primary); box-shadow: 0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-success-primary) 15%, transparent); }
      .cs-dot.busy { background: var(--dsw-alias-state-business-primary); box-shadow: 0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-business-primary) 15%, transparent); animation: cs-pulse 1.8s ease-in-out infinite; }
      .cs-dot.error { background: var(--dsw-alias-state-error-primary); box-shadow: 0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent); }
      .cs-dot.idle { background: var(--dsw-alias-label-caption); box-shadow: 0 0 0 4px var(--dsw-alias-interactive-bg-hover); }
      @keyframes cs-pulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
      .cs-status-copy { min-width: 0; flex: 1; }
      .cs-status-title { font-size: 15px; line-height: 23px; font-weight: 600; }
      .cs-status-meta { margin-top: 2px; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
      .cs-status-aside { flex: none; display: flex; align-items: center; gap: 6px; }
      .cs-pill {
        display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 8px;
        border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px;
        background: var(--dsw-alias-bg-module-platform); color: var(--dsw-alias-label-secondary);
        font-size: 11px; line-height: 18px; white-space: nowrap;
      }
      .cs-pill.green { color: var(--dsw-alias-state-success-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 25%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 8%, transparent); }
      .cs-pill.blue { color: var(--dsw-alias-state-business-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 25%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 8%, transparent); }
      .cs-pill.amber { color: var(--dsw-alias-state-warn-label); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 30%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, transparent); }
      .cs-progress-wrap { margin: 14px 0 2px; }
      .cs-progress-track { height: 4px; border-radius: 999px; overflow: hidden; background: var(--dsw-alias-interactive-bg-hover); }
      .cs-progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--cs-blue), var(--cs-blue-deep)); transition: width .5s ease; position: relative; overflow: hidden; }
      .cs-progress-fill::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.38), transparent); transform: translateX(-100%); animation: cs-shimmer 1.7s infinite; }
      @keyframes cs-shimmer { 100% { transform: translateX(100%); } }
      .cs-progress-label { display: flex; justify-content: space-between; gap: 10px; margin-top: 7px; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; }
      .cs-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 14px; }
      .cs-metric { min-width: 0; padding: 10px 11px 9px; border-radius: 11px; background: var(--dsw-alias-bg-module-platform); }
      .cs-metric-value { font-size: 19px; line-height: 25px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .cs-metric-value small { font-size: 11px; font-weight: 400; color: var(--dsw-alias-label-tertiary); letter-spacing: 0; }
      .cs-metric-label { margin-top: 1px; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .cs-section { margin-top: 22px; }
      .cs-section-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
      .cs-section-title { font-size: 14px; line-height: 22px; font-weight: 600; }
      .cs-section-desc { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
      .cs-panel { border-top: 1px solid var(--dsw-alias-border-l2); }
      .cs-row { display: flex; align-items: center; gap: 12px; min-height: 58px; padding: 10px 0; border-bottom: 1px solid var(--dsw-alias-border-l2); }
      .cs-row:last-child { border-bottom: 0; }
      .cs-row-text { flex: 1; min-width: 0; }
      .cs-row-title { display: flex; align-items: center; gap: 7px; font-size: 13px; line-height: 20px; font-weight: 500; }
      .cs-row-desc { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; margin-top: 1px; }
      .cs-repo-mark { flex: none; width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: var(--dsw-alias-bg-module-platform); border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); }
      .cs-repo-name { font-size: 13px; line-height: 20px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .cs-repo-meta { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .cs-repo-actions { display: flex; align-items: center; gap: 6px; flex: none; }
      .cs-form { padding: 12px 0 4px; display: flex; flex-direction: column; gap: 9px; }
      .cs-field { display: flex; flex-direction: column; gap: 5px; }
      .cs-label { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
      .cs-input, .cs-select {
        width: 100%; height: 34px; padding: 0 10px; border-radius: 9px;
        border: 1px solid var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; outline: none;
      }
      .cs-input:focus, .cs-select:focus { border-color: var(--dsw-alias-state-business-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary) 14%, transparent); }
      .cs-form-actions { display: flex; gap: 7px; justify-content: flex-end; padding-top: 2px; }
      .cs-hint { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; }
      .cs-error-text { color: var(--dsw-alias-state-error-primary); font-size: 12px; line-height: 18px; }
      .cs-switch {
        flex: none; width: 38px; height: 22px; padding: 0; border: 1px solid var(--dsw-alias-border-l4);
        border-radius: 999px; background: var(--dsw-alias-interactive-bg-hover); position: relative;
        cursor: pointer; transition: background .18s ease, border-color .18s ease;
      }
      .cs-switch span { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-switch-thumb); border: 1px solid var(--dsw-alias-border-l4); box-shadow: 0 1px 3px rgba(0,0,0,.22); transition: transform .18s ease; }
      .cs-switch.on { background: var(--dsw-alias-state-business-primary); border-color: transparent; }
      .cs-switch.on span { transform: translateX(16px); }
      .cs-switch:disabled { opacity: .5; cursor: default; }
      .cs-inline-select { width: auto; min-width: 118px; height: 32px; }
      .cs-device-icon { flex: none; width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-module-platform); }
      .cs-device.current .cs-device-icon { color: #fff; background: linear-gradient(145deg, #4f8df7, #2563eb); }
      .cs-activity { display: flex; flex-direction: column; }
      .cs-activity-item { display: flex; gap: 10px; padding: 7px 0; }
      .cs-activity-rail { width: 16px; flex: none; display: flex; justify-content: center; padding-top: 4px; }
      .cs-activity-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-label-caption); }
      .cs-activity-dot.success { background: var(--dsw-alias-state-success-primary); }
      .cs-activity-dot.error { background: var(--dsw-alias-state-error-primary); }
      .cs-activity-dot.pull { background: var(--dsw-alias-state-business-primary); }
      .cs-activity-body { flex: 1; min-width: 0; }
      .cs-activity-text { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
      .cs-activity-time { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary); }
      .cs-notice { display: flex; gap: 10px; padding: 12px 13px; border-radius: 12px; border: 1px solid; margin-bottom: 14px; }
      .cs-notice.error { color: var(--dsw-alias-label-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 28%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent); }
      .cs-notice.warn { color: var(--dsw-alias-label-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 30%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 7%, transparent); }
      .cs-notice-icon { flex: none; color: var(--dsw-alias-state-error-primary); padding-top: 1px; }
      .cs-notice.warn .cs-notice-icon { color: var(--dsw-alias-state-warn-label); }
      .cs-notice-title { font-size: 13px; line-height: 20px; font-weight: 600; }
      .cs-notice-body { margin-top: 2px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
      .cs-notice-actions { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 7px; }
      .cs-details { margin-top: 8px; }
      .cs-details summary { cursor: pointer; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
      .cs-details-body { margin-top: 7px; display: flex; flex-direction: column; gap: 5px; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; }
      .cs-conflict { padding: 11px 0; border-bottom: 1px solid var(--dsw-alias-border-l2); }
      .cs-conflict:last-child { border-bottom: 0; }
      .cs-conflict-title { font-size: 12px; line-height: 18px; font-weight: 500; }
      .cs-conflict-meta { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; margin-top: 1px; }
      .cs-footer { margin-top: 26px; padding-top: 13px; border-top: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 17px; }
      .cs-footer-meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 5px; }
      .cs-sep { color: var(--dsw-alias-border-l4); }
      .cs-loading { display: flex; align-items: center; gap: 9px; padding: 26px 0; color: var(--dsw-alias-label-tertiary); font-size: 13px; }
      .cs-spinner { width: 16px; height: 16px; border: 2px solid var(--dsw-alias-border-l4); border-top-color: var(--dsw-alias-state-business-primary); border-radius: 50%; animation: cs-spin .8s linear infinite; }
      @keyframes cs-spin { 100% { transform: rotate(360deg); } }
      .cs-nowrap { white-space: nowrap; }
      @media (max-width: 680px) {
        .cs-hero { flex-wrap: wrap; }
        .cs-hero-actions { margin-left: 0; width: 100%; justify-content: flex-start; }
        .cs-btn-primary { flex: 0 1 auto; }
        .cs-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 430px) {
        .cs-btn-primary { flex: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        .cs-dot.busy, .cs-progress-fill::after, .cs-spinner { animation: none; }
        .cs-progress-fill { transition: none; }
      }
    `

    function Icon({ name, size = 16, strokeWidth = 1.8 }) {
      const common = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        focusable: 'false',
      }
      const paths = {
        sync: [
          h('path', { key: 'a', d: 'M20 7h-9a5 5 0 0 0-5 5v1' }),
          h('path', { key: 'b', d: 'm17 4 3 3-3 3' }),
          h('path', { key: 'c', d: 'M4 17h9a5 5 0 0 0 5-5v-1' }),
          h('path', { key: 'd', d: 'm7 20-3-3 3-3' }),
        ],
        chat: [
          h('path', { key: 'a', d: 'M20 14a3 3 0 0 1-3 3H9l-4 3v-3.5A3 3 0 0 1 3 14V6a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3Z' }),
          h('path', { key: 'b', d: 'M7.5 9h9M7.5 12h5.5' }),
        ],
        monitor: [
          h('rect', { key: 'a', x: 3, y: 4, width: 18, height: 13, rx: 2 }),
          h('path', { key: 'b', d: 'M8 21h8M12 17v4' }),
        ],
        shield: [
          h('path', { key: 'a', d: 'M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z' }),
          h('path', { key: 'b', d: 'm9 12 2 2 4-4' }),
        ],
        github: [
          h('path', {
            key: 'a',
            d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18.1.1 15 2a13 13 0 0 0-6 0C5.9.1 4.7.5 4.7.5A5 5 0 0 0 4.6 4a5.4 5.4 0 0 0-1.4 3.5c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 9 18v4',
          }),
          h('path', { key: 'b', d: 'M9 19c-3 .9-3-1.5-4.5-2M15 22v-3' }),
        ],
        alert: [
          h('path', { key: 'a', d: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z' }),
          h('path', { key: 'b', d: 'M12 9v4M12 17h.01' }),
        ],
        check: [h('path', { key: 'a', d: 'm5 12 4 4L19 6' })],
        copy: [
          h('rect', { key: 'a', x: 9, y: 9, width: 12, height: 12, rx: 2 }),
          h('path', { key: 'b', d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }),
        ],
        external: [
          h('path', { key: 'a', d: 'M15 3h6v6M10 14 21 3' }),
          h('path', { key: 'b', d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }),
        ],
        folder: [
          h('path', { key: 'a', d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z' }),
        ],
        chevron: [h('path', { key: 'a', d: 'm6 9 6 6 6-6' })],
        refresh: [
          h('path', { key: 'a', d: 'M20 11a8 8 0 0 0-14.7-3L3 11' }),
          h('path', { key: 'b', d: 'M3 4v7h7' }),
          h('path', { key: 'c', d: 'M4 13a8 8 0 0 0 14.7 3L21 13' }),
          h('path', { key: 'd', d: 'M21 20v-7h-7' }),
        ],
        clock: [
          h('circle', { key: 'a', cx: 12, cy: 12, r: 9 }),
          h('path', { key: 'b', d: 'M12 7v5l3 2' }),
        ],
      }
      return h('svg', common, paths[name] || paths.sync)
    }

    function Badge({ children, tone = '' }) {
      return h('span', { className: `cs-pill ${tone}`.trim() }, children)
    }

    function Switch({ checked, onChange, disabled, label }) {
      return h(
        'button',
        {
          type: 'button',
          className: `cs-switch${checked ? ' on' : ''}`,
          role: 'switch',
          'aria-checked': checked,
          'aria-label': label,
          disabled,
          onClick: onChange,
        },
        h('span', null),
      )
    }

    function Notice({ tone = 'error', icon = 'alert', title, body, children }) {
      return h(
        'div',
        { className: `cs-notice ${tone}` },
        h('div', { className: 'cs-notice-icon' }, h(Icon, { name: icon, size: 17 })),
        h(
          'div',
          { style: { minWidth: 0, flex: 1 } },
          title ? h('div', { className: 'cs-notice-title' }, title) : null,
          body ? h('div', { className: 'cs-notice-body' }, body) : null,
          children || null,
        ),
      )
    }

    async function request(path, options = {}) {
      const response = await fetch(`/chat-sync/api${path}`, {
        credentials: 'same-origin',
        cache: 'no-store',
        ...options,
        headers: {
          ...(options.body ? { 'content-type': 'application/json' } : {}),
          ...(options.headers || {}),
        },
      })
      let payload
      try {
        payload = await response.json()
      } catch {
        throw new Error(`Unexpected response from Chat Sync (${response.status}).`)
      }
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || `Chat Sync request failed (${response.status}).`)
      }
      return payload
    }

    function Section({ ctx }) {
      const lang = useLocale(ctx)
      const t = React.useCallback((key, params) => translate(lang, key, params), [lang])
      const [status, setStatus] = React.useState(null)
      const [loadError, setLoadError] = React.useState('')
      const [actionError, setActionError] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [saving, setSaving] = React.useState('')
      const [editingRepo, setEditingRepo] = React.useState(false)
      const [remoteDraft, setRemoteDraft] = React.useState('')
      const [branchDraft, setBranchDraft] = React.useState('main')
      const [copied, setCopied] = React.useState('')
      const [showDetails, setShowDetails] = React.useState(false)
      const [repairing, setRepairing] = React.useState(false)
      const [repairResult, setRepairResult] = React.useState('')
      const alive = React.useRef(true)

      React.useEffect(() => {
        alive.current = true
        return () => {
          alive.current = false
        }
      }, [])

      const refresh = React.useCallback(async () => {
        try {
          const next = await request('/status')
          if (!alive.current) return
          setStatus(next)
          setLoadError('')
        } catch (error) {
          if (!alive.current) return
          setLoadError(String(error?.message || error))
        }
      }, [])

      React.useEffect(() => {
        void refresh()
        const timer = setInterval(() => void refresh(), 2600)
        return () => clearInterval(timer)
      }, [refresh])

      const runSync = React.useCallback(async () => {
        if (busy) return
        setBusy(true)
        setActionError('')
        try {
          await request('/sync', { method: 'POST', body: '{}' })
          await refresh()
        } catch (error) {
          setActionError(String(error?.message || error))
        } finally {
          if (alive.current) setBusy(false)
        }
      }, [busy, refresh])

      const patchConfig = React.useCallback(
        async (patch, key) => {
          setSaving(key)
          setActionError('')
          try {
            const result = await request('/config', {
              method: 'POST',
              body: JSON.stringify(patch),
            })
            if (result.status) setStatus(result.status)
          } catch (error) {
            setActionError(String(error?.message || error))
          } finally {
            if (alive.current) setSaving('')
          }
        },
        [],
      )

      const saveRepository = React.useCallback(async () => {
        const value = remoteDraft.trim()
        if (!value) {
          setActionError(t('repoHint'))
          return
        }
        setSaving('repository')
        setActionError('')
        try {
          const result = await request('/config', {
            method: 'POST',
            body: JSON.stringify({ remote: value, branch: branchDraft.trim() || 'main' }),
          })
          if (result.status) setStatus(result.status)
          setEditingRepo(false)
          await request('/sync', { method: 'POST', body: '{}' })
          await refresh()
        } catch (error) {
          setActionError(String(error?.message || error))
        } finally {
          if (alive.current) setSaving('')
        }
      }, [branchDraft, refresh, remoteDraft, t])

      const attachChats = React.useCallback(async () => {
        setRepairing(true)
        setRepairResult('')
        setActionError('')
        try {
          const result = await request('/repair', {
            method: 'POST',
            body: JSON.stringify({ unarchive: false }),
          })
          const item = result.result || {}
          if (!item.attached && !item.unarchived) {
            setRepairResult(t('attachChatsNone'))
          } else {
            setRepairResult(
              t('attachChatsDone', {
                attached: item.attached || 0,
                unarchived: item.unarchived || 0,
              }),
            )
          }
          await refresh()
        } catch (error) {
          setActionError(String(error?.message || error))
        } finally {
          if (alive.current) setRepairing(false)
        }
      }, [refresh, t])

      const copy = React.useCallback(async (text, marker) => {
        try {
          await navigator.clipboard.writeText(text)
          if (!alive.current) return
          setCopied(marker)
          setTimeout(() => {
            if (alive.current) setCopied('')
          }, 1800)
        } catch {
          setActionError(t('errorGeneric'))
        }
      }, [t])

      if (!status && !loadError) {
        return h(
          'div',
          { className: 'cs-root' },
          h('style', null, CSS),
          h(
            'div',
            { className: 'cs-loading' },
            h('span', { className: 'cs-spinner' }),
            h('span', null, t('statusUnknown')),
          ),
        )
      }

      if (!status && loadError) {
        return h(
          'div',
          { className: 'cs-root' },
          h('style', null, CSS),
          h(Notice, {
            title: t('connectionError'),
            body: loadError,
            children: h(
              'div',
              { className: 'cs-notice-actions' },
              h(
                'button',
                { type: 'button', className: 'cs-btn cs-btn-primary', onClick: () => void refresh() },
                h(Icon, { name: 'refresh', size: 14 }),
                t('retry'),
              ),
            ),
          }),
        )
      }

      const tone = busy || status.sync.running ? 'busy' : statusTone(status)
      const running = Boolean(status.sync.running || busy)
      const last = status.last
      const phaseKey = `phase${String(status.sync.phase || 'idle')
        .charAt(0)
        .toUpperCase()}${String(status.sync.phase || 'idle').slice(1)}`
      const phaseText = t(phaseKey) === phaseKey ? status.sync.message || t('phaseIdle') : t(phaseKey)
      const title =
        tone === 'busy'
          ? t('syncing')
          : tone === 'error'
            ? t('needsAttention')
            : tone === 'ok'
              ? t('allCaught')
              : t('readyFirst')
      const meta =
        tone === 'busy'
          ? phaseText
          : last
            ? `${t('lastSync', { time: relativeTime(last.at, lang) })} · ${lastSummary(last, t)}`
            : status.repository.ready
              ? t('waitingFirst')
              : t('readyFirst')
      const deviceList = status.devices || []
      const conflicts = status.conflicts || []
      const activity = status.activity || []
      const warnings = last?.warnings || []
      const gitReady = Boolean(status.environment?.git)
      const repo = status.repository
      const transferredBytes = (Number(last?.bytesUploaded) || 0) + (Number(last?.bytesDownloaded) || 0)
      const transferLine = last?.ok
        ? t(last?.commit?.sha ? 'transferLine' : 'transferLineNoCommit', {
            duration: formatDuration(last.durationMs),
            size: formatBytes(transferredBytes),
            commit: last?.commit?.sha || '',
          })
        : ''

      return h(
        'div',
        { className: 'cs-root', 'aria-busy': running },
        h('style', null, CSS),
        h(
          'header',
          { className: 'cs-hero' },
          h(
            'div',
            { className: 'cs-mark', 'aria-hidden': true },
            h(Icon, { name: 'sync', size: 27, strokeWidth: 2 }),
          ),
          h(
            'div',
            { style: { minWidth: 0, flex: 1 } },
            h('div', { className: 'cs-eyebrow' }, t('eyebrow')),
            h('h1', { className: 'cs-title' }, t('title')),
            h('p', { className: 'cs-sub' }, t('subtitle')),
          ),
          h(
            'div',
            { className: 'cs-hero-actions' },
            h(
              'button',
              {
                type: 'button',
                className: 'cs-btn cs-btn-primary',
                disabled: running || busy,
                onClick: () => void runSync(),
              },
              h(Icon, { name: running ? 'refresh' : 'sync', size: 15 }),
              running ? t('syncing') : t('syncNow'),
            ),
          ),
        ),

        actionError
          ? h(Notice, {
              title: t('syncError'),
              body: actionError,
              children: h(
                'div',
                { className: 'cs-notice-actions' },
                h(
                  'button',
                  { type: 'button', className: 'cs-btn', onClick: () => void runSync() },
                  h(Icon, { name: 'refresh', size: 14 }),
                  t('retry'),
                ),
                h(
                  'button',
                  { type: 'button', className: 'cs-btn cs-btn-quiet', onClick: () => setActionError('') },
                  t('cancel'),
                ),
              ),
            })
          : null,

        repo.private === false
          ? h(Notice, {
              tone: 'warn',
              icon: 'shield',
              title: t('publicWarning'),
              body: t('publicWarningBody'),
            })
          : null,

        !gitReady
          ? h(Notice, {
              title: t('gitMissing'),
              body: 'Chat Sync uses your existing Git installation to talk to GitHub. Install Git and restart DeepSeek Harness.',
            })
          : null,

        h(
          'section',
          { className: 'cs-card cs-status' },
          h(
            'div',
            { className: 'cs-status-head' },
            h('span', { className: `cs-dot ${tone}` }),
            h(
              'div',
              { className: 'cs-status-copy' },
              h('div', { className: 'cs-status-title', role: 'status', 'aria-live': 'polite' }, title),
              h('div', { className: 'cs-status-meta' }, meta),
            ),
            h(
              'div',
              { className: 'cs-status-aside' },
              repo.ready
                ? h(Badge, { tone: 'green' }, h(Icon, { name: 'check', size: 11 }), 'GitHub')
                : h(Badge, null, 'GitHub'),
            ),
          ),

          running
            ? h(
                'div',
                { className: 'cs-progress-wrap' },
                h(
                  'div',
                  { className: 'cs-progress-track' },
                  h('div', {
                    className: 'cs-progress-fill',
                    style: { width: `${Math.max(4, Number(status.sync.progress) || 0)}%` },
                  }),
                ),
                h(
                  'div',
                  { className: 'cs-progress-label' },
                  h('span', null, phaseText),
                  h('span', null, t('progress', { progress: Math.max(0, Number(status.sync.progress) || 0) })),
                ),
              )
            : null,

          h(
            'div',
            { className: 'cs-metrics' },
            h(
              'div',
              { className: 'cs-metric' },
              h('div', { className: 'cs-metric-value' }, status.stats.localChats),
              h('div', { className: 'cs-metric-label' }, t('localChats')),
            ),
            h(
              'div',
              { className: 'cs-metric' },
              h('div', { className: 'cs-metric-value' }, status.stats.remoteChats),
              h('div', { className: 'cs-metric-label' }, t('relayChats')),
            ),
            h(
              'div',
              { className: 'cs-metric' },
              h('div', { className: 'cs-metric-value' }, status.stats.devices),
              h('div', { className: 'cs-metric-label' }, t('computers')),
            ),
            h(
              'div',
              { className: 'cs-metric' },
              h(
                'div',
                { className: 'cs-metric-value', style: conflicts.length ? { color: 'var(--dsw-alias-state-warn-label)' } : undefined },
                conflicts.length,
              ),
              h('div', { className: 'cs-metric-label' }, t('conflicts')),
            ),
          ),

          last?.error
            ? h(
                'div',
                { className: 'cs-details' },
                h('details', null, [
                  h('summary', { key: 'summary' }, t('details')),
                  h(
                    'div',
                    { key: 'body', className: 'cs-details-body' },
                    h('div', null, last.error),
                    last.hint ? h('div', null, last.hint) : null,
                    warnings.slice(0, 6).map((warning, index) =>
                      h('div', { key: `warn-${index}` }, warning.message || String(warning)),
                    ),
                  ),
                ]),
              )
            : last?.ok && transferLine
              ? h(
                  'div',
                  { className: 'cs-status-meta', style: { marginTop: 10 } },
                  transferLine,
                )
              : null,
        ),

        h(
          'section',
          { className: 'cs-section' },
          h(
            'div',
            { className: 'cs-section-head' },
            h('div', { className: 'cs-section-title' }, t('connection')),
            h('div', { className: 'cs-section-desc' }, t('connectionDesc')),
          ),
          h(
            'div',
            { className: 'cs-card', style: { padding: '0 14px' } },
            h(
              'div',
              { className: 'cs-row' },
              h(
                'div',
                { className: 'cs-repo-mark' },
                h(Icon, { name: 'github', size: 17 }),
              ),
              h(
                'div',
                { className: 'cs-row-text' },
                h(
                  'div',
                  { className: 'cs-repo-name' },
                  repo.label || t('repoPlaceholder'),
                  repo.private === true
                    ? h(
                        'span',
                        { style: { marginLeft: 7, verticalAlign: 1 } },
                        h(Badge, { tone: 'blue' }, h(Icon, { name: 'shield', size: 10 }), t('private')),
                      )
                    : repo.private === false
                      ? h(
                          'span',
                          { style: { marginLeft: 7, verticalAlign: 1 } },
                          h(Badge, { tone: 'amber' }, t('public')),
                        )
                      : null,
                ),
                h(
                  'div',
                  { className: 'cs-repo-meta' },
                  h('span', null, `${t('branch')} ${repo.branch || 'main'}`),
                  repo.ready ? null : h('span', { className: 'cs-sep' }, '·'),
                  repo.ready ? null : h('span', null, t('waitingFirst')),
                ),
              ),
              h(
                'div',
                { className: 'cs-repo-actions' },
                repo.webUrl
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'cs-btn cs-icon-btn',
                        title: t('openRepo'),
                        'aria-label': t('openRepo'),
                        onClick: () => window.open(repo.webUrl, '_blank', 'noopener,noreferrer'),
                      },
                      h(Icon, { name: 'external', size: 15 }),
                    )
                  : null,
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'cs-btn cs-btn-quiet',
                    onClick: () => {
                      setRemoteDraft(repo.label || '')
                      setBranchDraft(repo.branch || 'main')
                      setEditingRepo(value => !value)
                      setActionError('')
                    },
                  },
                  editingRepo ? t('cancel') : t('change'),
                ),
              ),
            ),
            editingRepo
              ? h(
                  'div',
                  { className: 'cs-form' },
                  h(
                    'label',
                    { className: 'cs-field' },
                    h('span', { className: 'cs-label' }, t('connection')),
                    h('input', {
                      className: 'cs-input',
                      value: remoteDraft,
                      placeholder: t('repoPlaceholder'),
                      spellCheck: false,
                      onChange: event => setRemoteDraft(event.target.value),
                      onKeyDown: event => {
                        if (event.key === 'Enter') void saveRepository()
                      },
                    }),
                    h('span', { className: 'cs-hint' }, t('repoHint')),
                  ),
                  h(
                    'label',
                    { className: 'cs-field' },
                    h('span', { className: 'cs-label' }, t('branch')),
                    h('input', {
                      className: 'cs-input',
                      value: branchDraft,
                      placeholder: 'main',
                      spellCheck: false,
                      onChange: event => setBranchDraft(event.target.value),
                    }),
                  ),
                  h(
                    'div',
                    { className: 'cs-form-actions' },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'cs-btn cs-btn-primary',
                        disabled: saving === 'repository',
                        onClick: () => void saveRepository(),
                      },
                      saving === 'repository' ? t('syncing') : t('save'),
                    ),
                  ),
                )
              : null,
          ),
        ),

        h(
          'section',
          { className: 'cs-section' },
          h(
            'div',
            { className: 'cs-section-head' },
            h('div', { className: 'cs-section-title' }, t('automation')),
            h('div', { className: 'cs-section-desc' }, t('automationDesc')),
          ),
          h(
            'div',
            { className: 'cs-card', style: { padding: '0 14px' } },
            h(
              'div',
              { className: 'cs-row' },
              h(
                'div',
                { className: 'cs-row-text' },
                h('div', { className: 'cs-row-title' }, t('autoSync')),
                h('div', { className: 'cs-row-desc' }, t('autoSyncDesc', { minutes: status.settings.intervalMinutes })),
              ),
              h(Switch, {
                checked: status.settings.autoSync,
                disabled: saving === 'autoSync',
                label: t('autoSync'),
                onChange: () => void patchConfig({ autoSync: !status.settings.autoSync }, 'autoSync'),
              }),
            ),
            status.settings.autoSync
              ? h(
                  'div',
                  { className: 'cs-row' },
                  h(
                    'div',
                    { className: 'cs-row-text' },
                    h('div', { className: 'cs-row-title' }, t('interval')),
                    h('div', { className: 'cs-row-desc' }, t('intervalDesc')),
                  ),
                  h(
                    'select',
                    {
                      className: 'cs-select cs-inline-select',
                      value: status.settings.intervalMinutes,
                      disabled: saving === 'intervalMinutes',
                      onChange: event =>
                        void patchConfig({ intervalMinutes: Number(event.target.value) }, 'intervalMinutes'),
                    },
                    [5, 10, 30, 60].map(minutes =>
                      h('option', { key: minutes, value: minutes }, t('every', { minutes })),
                    ),
                  ),
                )
              : null,
            h(
              'div',
              { className: 'cs-row' },
              h(
                'div',
                { className: 'cs-row-text' },
                h('div', { className: 'cs-row-title' }, t('includeAttachments')),
                h('div', { className: 'cs-row-desc' }, t('includeAttachmentsDesc')),
              ),
              h(Switch, {
                checked: status.settings.includeAttachments,
                disabled: saving === 'includeAttachments',
                label: t('includeAttachments'),
                onChange: () =>
                  void patchConfig(
                    { includeAttachments: !status.settings.includeAttachments },
                    'includeAttachments',
                  ),
              }),
            ),
            h(
              'div',
              { className: 'cs-row' },
              h(
                'div',
                { className: 'cs-row-text' },
                h('div', { className: 'cs-row-title' }, t('addComputerName')),
                h('div', { className: 'cs-row-desc' }, t('addComputerNameDesc')),
              ),
              h(Switch, {
                checked: status.settings.addComputerName !== false,
                disabled: saving === 'addComputerName',
                label: t('addComputerName'),
                onChange: () =>
                  void patchConfig(
                    { addComputerName: status.settings.addComputerName === false },
                    'addComputerName',
                  ),
              }),
            ),
            h(
              'div',
              { className: 'cs-row' },
              h(
                'div',
                { className: 'cs-row-text' },
                h('div', { className: 'cs-row-title' }, t('syncArchive')),
                h('div', { className: 'cs-row-desc' }, t('syncArchiveDesc')),
              ),
              h(Switch, {
                checked: status.settings.syncArchive !== false,
                disabled: saving === 'syncArchive',
                label: t('syncArchive'),
                onChange: () =>
                  void patchConfig(
                    { syncArchive: status.settings.syncArchive === false },
                    'syncArchive',
                  ),
              }),
            ),
            h(
              'div',
              { className: 'cs-row' },
              h(
                'div',
                { className: 'cs-row-text' },
                h('div', { className: 'cs-row-title' }, t('resolveConflicts')),
                h('div', { className: 'cs-row-desc' }, t('resolveConflictsDesc')),
              ),
              h(Switch, {
                checked: status.settings.resolveConflicts !== false,
                disabled: saving === 'resolveConflicts',
                label: t('resolveConflicts'),
                onChange: () =>
                  void patchConfig(
                    { resolveConflicts: status.settings.resolveConflicts === false },
                    'resolveConflicts',
                  ),
              }),
            ),
          ),
        ),

        h(
          'section',
          { className: 'cs-section' },
          h(
            'div',
            { className: 'cs-section-head' },
            h('div', { className: 'cs-section-title' }, t('devices')),
            h('div', { className: 'cs-section-desc' }, t('devicesDesc')),
          ),
          h(
            'div',
            { className: 'cs-card', style: { padding: '0 14px' } },
            deviceList.length
              ? deviceList.map((device, index) =>
                  h(
                    'div',
                    {
                      key: device.id || index,
                      className: `cs-row cs-device${device.current ? ' current' : ''}`,
                    },
                    h(
                      'div',
                      { className: 'cs-device-icon' },
                      h(Icon, { name: 'monitor', size: 16 }),
                    ),
                    h(
                      'div',
                      { className: 'cs-row-text' },
                      h(
                        'div',
                        { className: 'cs-row-title' },
                        device.name || t('thisComputer'),
                        device.current ? h(Badge, { tone: 'blue' }, t('thisComputer')) : null,
                      ),
                      h(
                        'div',
                        { className: 'cs-row-desc' },
                        device.current
                          ? chatLabel(device.chats || 0, t, lang)
                          : `${chatLabel(device.chats || 0, t, lang)} · ${t('lastSeen', { time: relativeTime(device.lastSyncAt, lang) })}`,
                      ),
                    ),
                    h(
                      'div',
                      { className: 'cs-repo-meta cs-nowrap' },
                      platformLabel(device.platform),
                    ),
                  ),
                )
              : h('div', { className: 'cs-row' }, h('div', { className: 'cs-row-desc' }, t('noOtherDevices'))),
            deviceList.length === 1
              ? h(
                  'div',
                  { className: 'cs-row' },
                  h(
                    'div',
                    { className: 'cs-row-desc', style: { display: 'flex', gap: 7, alignItems: 'flex-start' } },
                    h(Icon, { name: 'monitor', size: 14 }),
                    h('span', null, t('noOtherDevices')),
                  ),
                )
              : null,
            h(
              'div',
              { className: 'cs-row' },
              h(
                'div',
                { className: 'cs-row-text' },
                h('div', { className: 'cs-row-title' }, t('attachChats')),
                h('div', { className: 'cs-row-desc' }, t('attachChatsDesc')),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'cs-btn',
                  disabled: repairing,
                  onClick: () => void attachChats(),
                },
                repairing ? t('attachChatsBusy') : t('attachChatsAction'),
              ),
            ),
            repairResult
              ? h(
                  'div',
                  { className: 'cs-status-meta', style: { padding: '0 0 10px', color: 'var(--dsw-alias-state-success-primary)' } },
                  repairResult,
                )
              : null,
          ),
        ),

        conflicts.length
          ? h(
              'section',
              { className: 'cs-section' },
              h(
                'div',
                { className: 'cs-section-head' },
                h('div', { className: 'cs-section-title' }, t('conflictsTitle')),
                h('div', { className: 'cs-section-desc' }, t('conflictsDesc')),
              ),
              h(
                'div',
                { className: 'cs-card', style: { padding: '10px 14px' } },
                conflicts.slice(0, 5).map((conflict, index) =>
                  h(
                    'div',
                    { key: `${conflict.id}-${index}`, className: 'cs-conflict' },
                    h('div', { className: 'cs-conflict-title' }, conflict.title || conflict.id),
                    h(
                      'div',
                      { className: 'cs-conflict-meta' },
                      `${conflict.device || 'Another computer'} · ${relativeTime(conflict.at, lang)} · ${conflict.reason || ''}`,
                    ),
                  ),
                ),
                status.environment?.conflictsDir
                  ? h(
                      'div',
                      { className: 'cs-notice-actions' },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'cs-btn',
                          onClick: () => void copy(status.environment.conflictsDir, 'conflicts'),
                        },
                        h(Icon, { name: 'folder', size: 14 }),
                        copied === 'conflicts' ? t('copied') : t('copyPath'),
                      ),
                    )
                  : null,
              ),
            )
          : null,

        warnings.length && !last?.error
          ? h(
              'section',
              { className: 'cs-section' },
              h(
                'div',
                { className: 'cs-section-head' },
                h('div', { className: 'cs-section-title' }, t('warnings')),
              ),
              h(
                'div',
                { className: 'cs-card', style: { padding: '10px 14px' } },
                warnings.slice(0, 6).map((warning, index) =>
                  h(
                    'div',
                    { key: `warning-${index}`, className: 'cs-conflict' },
                    h('div', { className: 'cs-conflict-title' }, warning.message || String(warning)),
                  ),
                ),
              ),
            )
          : null,

        h(
          'section',
          { className: 'cs-section' },
          h(
            'div',
            { className: 'cs-section-head' },
            h('div', { className: 'cs-section-title' }, t('activity')),
            h('div', { className: 'cs-section-desc' }, t('activityDesc')),
          ),
          h(
            'div',
            { className: 'cs-card', style: { padding: '10px 14px' } },
            activity.length
              ? h(
                  'div',
                  { className: 'cs-activity' },
                  activity.slice(0, 7).map((item, index) =>
                    h(
                      'div',
                      { key: `${item.at}-${index}`, className: 'cs-activity-item' },
                      h(
                        'div',
                        { className: 'cs-activity-rail' },
                        h('span', { className: `cs-activity-dot ${item.kind || ''}` }),
                      ),
                      h(
                        'div',
                        { className: 'cs-activity-body' },
                        h('div', { className: 'cs-activity-text' }, activityText(item, t)),
                        h('div', { className: 'cs-activity-time' }, relativeTime(item.at, lang)),
                      ),
                    ),
                  ),
                )
              : h('div', { className: 'cs-row-desc', style: { padding: '6px 0' } }, t('noActivity')),
          ),
        ),

        h(
          'footer',
          { className: 'cs-footer' },
          h('div', null, t('privacy')),
          h(
            'div',
            { className: 'cs-footer-meta' },
            h(
              'span',
              null,
              status.environment?.gitVersion
                ? status.environment.gitVersion.replace(/^git version\s*/i, 'Git ')
                : t('noGit'),
            ),
            status.environment?.ghUser
              ? h('span', { className: 'cs-sep' }, '·')
              : null,
            status.environment?.ghUser ? h('span', null, t('signedInAs', { user: status.environment.ghUser })) : null,
            h('span', { className: 'cs-sep' }, '·'),
            h('span', null, t('footer')),
          ),
        ),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        let t = (key, params) => translate('en', key, params)
        try {
          if (ctx.locale?.register && ctx.locale?.bind) {
            const dispose = ctx.locale.register(NS, {
              en: DICTIONARIES.en,
              ru: DICTIONARIES.ru,
            })
            ctx.effect(() => dispose, 'chat-sync: locale dictionary')
            t = ctx.locale.bind(NS)
          }
        } catch (error) {
          console.warn('[chat-sync] locale registration failed', error)
        }

        ctx.slots.inject('settings.section.icon', () =>
          ctx.slots.register(
            {
              name: 'settings.section.icon',
              id: 'chat-sync',
            },
            props =>
              h(
                'span',
                { style: { display: 'grid', placeItems: 'center', width: props?.size || 16, height: props?.size || 16 } },
                h(Icon, { name: 'sync', size: props?.size || 16, strokeWidth: 1.9 }),
              ),
          ),
        )

        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'chat-sync',
              order: 410,
              label: () => t('nav'),
            },
            props => h(Section, { ...props, ctx }),
          ),
        )
      },
    }
  },
})
