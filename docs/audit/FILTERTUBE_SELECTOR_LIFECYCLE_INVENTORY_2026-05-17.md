# FilterTube Selector And Lifecycle Inventory - 2026-05-17

Generated static audit artifact. It records literal selector calls and lifecycle/side-effect markers in tracked JavaScript files, excluding bundled vendor files. It is intentionally conservative: dynamic selectors and callbacks assembled across variables need follow-up manual proof.

Current executable source fixtures now pin two selector/lifecycle split-authority risks:
quick-block observer setup installs page lifecycle work before feature-enabled checks,
and fallback playlist menu buttons/rows lack the whitelist/disabled gates used by the
normal injected dropdown path.

## Summary

- Files scanned: 31
- Literal selector calls detected: 599
- Lifecycle / side-effect markers detected: 727

| File | Family | Selector calls | Lifecycle/side-effect markers |
| --- | --- | ---: | ---: |
| `js/content_bridge.js` | content bridge runtime | 226 | 142 |
| `js/tab-view.js` | extension UI | 68 | 250 |
| `js/content/dom_fallback.js` | DOM fallback enforcement | 151 | 29 |
| `js/layout.js` | supporting module | 63 | 37 |
| `js/content/block_channel.js` | quick block / 3-dot affordance | 28 | 61 |
| `js/popup.js` | extension UI | 16 | 51 |
| `js/ui_components.js` | supporting module | 6 | 37 |
| `js/content/dom_extractors.js` | DOM metadata extraction | 23 | 4 |
| `js/background.js` | background authority/actions | 0 | 21 |
| `js/content/collab_dialog.js` | supporting module | 11 | 8 |
| `js/injector.js` | page injector / JSON collaboration bridge | 5 | 14 |
| `js/render_engine.js` | extension UI | 0 | 18 |
| `js/content/dom_helpers.js` | DOM hide/restore helpers | 2 | 10 |
| `js/content/bridge_settings.js` | runtime settings bridge | 0 | 10 |
| `js/state_manager.js` | supporting module | 0 | 7 |
| `js/content/first_run_prompt.js` | supporting module | 0 | 6 |
| `js/content/release_notes_prompt.js` | supporting module | 0 | 4 |
| `js/ui-shell/popup-shell.js` | extension UI | 0 | 4 |
| `js/ui-shell/tab-view-decor.js` | extension UI | 0 | 4 |
| `js/io_manager.js` | supporting module | 0 | 3 |
| `js/content/bridge_injection.js` | supporting module | 0 | 2 |
| `js/content/handle_resolver.js` | handle/channel resolver | 0 | 2 |
| `js/filter_logic.js` | JSON filter engine | 0 | 2 |
| `js/seed.js` | seed network interception | 0 | 1 |
| `build.js` | supporting module | 0 | 0 |
| `js/content/menu.js` | supporting module | 0 | 0 |
| `js/content_controls_catalog.js` | supporting module | 0 | 0 |
| `js/nanah_sync_adapter.js` | supporting module | 0 | 0 |
| `js/security_manager.js` | supporting module | 0 | 0 |
| `js/settings_shared.js` | supporting module | 0 | 0 |
| `js/shared/identity.js` | supporting module | 0 | 0 |

## Lifecycle / Side-Effect Markers

| File:line | Family | Marker | Code excerpt | Required proof gate |
| --- | --- | --- | --- | --- |
| `js/background.js:727` | background authority/actions | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/background.js:884` | background authority/actions | clearTimeout | `clearTimeout(autoBackupTimer);` | must be scoped to visible UI or explicit user action |
| `js/background.js:887` | background authority/actions | setTimeout | `autoBackupTimer = setTimeout(async () => {` | must be scoped to visible UI or explicit user action |
| `js/background.js:918` | background authority/actions | setTimeout | `new Promise(resolve => setTimeout(resolve, timeoutMs))` | must be scoped to visible UI or explicit user action |
| `js/background.js:1150` | background authority/actions | setTimeout | `.then(() => new Promise(resolve => setTimeout(resolve, delayMs)))` | must be scoped to visible UI or explicit user action |
| `js/background.js:1489` | background authority/actions | setTimeout | `channelMapFlushTimer = setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/background.js:1634` | background authority/actions | setTimeout | `videoChannelMapFlushTimer = setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/background.js:1642` | background authority/actions | setTimeout | `videoMetaMapFlushTimer = setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/background.js:1723` | background authority/actions | fetch | `const response = await fetch(url);` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/background.js:2887` | background authority/actions | setTimeout | `const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS);` | must be scoped to visible UI or explicit user action |
| `js/background.js:2889` | background authority/actions | fetch | `const response = await fetch(`https://www.youtube.com/shorts/${videoId}`, {` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/background.js:2940` | background authority/actions | clearTimeout | `clearTimeout(timeoutId);` | must be scoped to visible UI or explicit user action |
| `js/background.js:3003` | background authority/actions | setTimeout | `const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS);` | must be scoped to visible UI or explicit user action |
| `js/background.js:3005` | background authority/actions | fetch | `const response = await fetch(`https://www.youtubekids.com/watch?v=${videoId}`, {` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/background.js:3056` | background authority/actions | clearTimeout | `clearTimeout(timeoutId);` | must be scoped to visible UI or explicit user action |
| `js/background.js:3096` | background authority/actions | setTimeout | `const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS);` | must be scoped to visible UI or explicit user action |
| `js/background.js:3098` | background authority/actions | fetch | `const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/background.js:3149` | background authority/actions | clearTimeout | `clearTimeout(timeoutId);` | must be scoped to visible UI or explicit user action |
| `js/background.js:4617` | background authority/actions | fetch | `let response = await fetch(channelUrl, {` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/background.js:4631` | background authority/actions | fetch | `response = await fetch(fallbackUrl, {` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/background.js:4784` | background authority/actions | fetch | `const fallbackResponse = await fetch(fallbackUrl, {` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/content_bridge.js:529` | content bridge runtime | style.display write | `dropdown.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:541` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:562` | content bridge runtime | setTimeout | `const schedule = () => setTimeout(resolve, Math.max(0, delayMs));` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:564` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(schedule);` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:977` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1015` | content bridge runtime | IntersectionObserver | `prefetchObserver = new IntersectionObserver((entries) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1026` | content bridge runtime | addEventListener | `document.addEventListener('visibilitychange', () => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1050` | content bridge runtime | addEventListener | `document.addEventListener('scroll', (event) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1058` | content bridge runtime | MutationObserver | `const observer = new MutationObserver(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1071` | content bridge runtime | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1096` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1103` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1112` | content bridge runtime | MutationObserver | `const observer = new MutationObserver(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1130` | content bridge runtime | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1140` | content bridge runtime | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1214` | content bridge runtime | setTimeout | `new Promise((resolve) => setTimeout(() => resolve(null), ms))` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1311` | content bridge runtime | setTimeout | `state.timer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1371` | content bridge runtime | classList mutation | `card.classList.remove('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:1388` | content bridge runtime | classList mutation | `wrapper.classList.remove('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:1543` | content bridge runtime | clearTimeout | `clearTimeout(pendingVideoMetaDomRerunTimer);` | must be scoped to visible UI or explicit user action |
| `js/content_bridge.js:1545` | content bridge runtime | setTimeout | `pendingVideoMetaDomRerunTimer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1770` | content bridge runtime | fetch | `const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/content_bridge.js:1934` | content bridge runtime | setTimeout | `const timerId = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:1937` | content bridge runtime | style.display write | `dropdown.style.display === 'none' \|\|` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:1950` | content bridge runtime | clearTimeout | `clearTimeout(timerId);` | must be scoped to visible UI or explicit user action |
| `js/content_bridge.js:2003` | content bridge runtime | classList mutation | `state.blockAllItem.classList.add('filtertube-multistep-ready');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:2008` | content bridge runtime | classList mutation | `state.blockAllItem.classList.remove('filtertube-multistep-ready');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:2026` | content bridge runtime | classList mutation | `toggleEl.classList.toggle('active', shouldActivate);` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:2089` | content bridge runtime | classList mutation | `item.classList.add('filtertube-collab-selected');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:2091` | content bridge runtime | classList mutation | `item.classList.remove('filtertube-collab-selected');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:2125` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:2140` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => refreshMultiStepSelections(groupId));` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:2153` | content bridge runtime | classList mutation | `const isSelected = menuItem.classList.toggle('filtertube-collab-selected');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:2174` | content bridge runtime | classList mutation | `menuItem.classList.add('filtertube-blocked');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:2175` | content bridge runtime | classList mutation | `menuItem.classList.remove('filtertube-collab-selected');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:2210` | content bridge runtime | classList mutation | `menuItem.classList.add('filtertube-collab-selected');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:3159` | content bridge runtime | setTimeout | `entry.expiryTimeout = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:3182` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:3383` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:3477` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:3749` | content bridge runtime | click/media call | `media.pause();` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:5156` | content bridge runtime | setTimeout | `const timeoutId = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5183` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5188` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5203` | content bridge runtime | setTimeout | `const timeoutId = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5228` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5233` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5250` | content bridge runtime | setTimeout | `const armTimeout = () => setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5523` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5576` | content bridge runtime | clearTimeout | `clearTimeout(pending.timeoutId);` | must be scoped to visible UI or explicit user action |
| `js/content_bridge.js:5600` | content bridge runtime | clearTimeout | `clearTimeout(pending.timeoutId);` | must be scoped to visible UI or explicit user action |
| `js/content_bridge.js:5601` | content bridge runtime | setTimeout | `pending.timeoutId = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5619` | content bridge runtime | clearTimeout | `clearTimeout(pending.timeoutId);` | must be scoped to visible UI or explicit user action |
| `js/content_bridge.js:5668` | content bridge runtime | clearTimeout | `clearTimeout(pending.timeoutId);` | must be scoped to visible UI or explicit user action |
| `js/content_bridge.js:5718` | content bridge runtime | setTimeout | `await new Promise(resolve => setTimeout(resolve, 1000));` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5747` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5755` | content bridge runtime | setTimeout | `pendingImmediateFallbackTimer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5787` | content bridge runtime | setTimeout | `whitelistPendingRefreshState.timer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5837` | content bridge runtime | setTimeout | `whitelistPendingRefreshState.pendingHideTimer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:5926` | content bridge runtime | classList mutation | `element.classList.add('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:6025` | content bridge runtime | MutationObserver | `const observer = new MutationObserver(mutations => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6044` | content bridge runtime | addEventListener | `document.addEventListener('DOMContentLoaded', () => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6423` | content bridge runtime | addEventListener | `btn.addEventListener('click', (e) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6551` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(runScan);` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6552` | content bridge runtime | setTimeout | `setTimeout(runScan, 120);` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6563` | content bridge runtime | MutationObserver | `const observer = new MutationObserver(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6576` | content bridge runtime | addEventListener | `document.addEventListener('DOMContentLoaded', () => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6584` | content bridge runtime | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6587` | content bridge runtime | addEventListener | `document.addEventListener('click', () => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6590` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6598` | content bridge runtime | addEventListener | `window.addEventListener('scroll', () => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6601` | content bridge runtime | clearTimeout | `clearTimeout(pendingScrollRescanTimer);` | must be scoped to visible UI or explicit user action |
| `js/content_bridge.js:6607` | content bridge runtime | clearTimeout | `clearTimeout(pendingScrollRescanTimer);` | must be scoped to visible UI or explicit user action |
| `js/content_bridge.js:6609` | content bridge runtime | setTimeout | `pendingScrollRescanTimer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6616` | content bridge runtime | setInterval | `const warmupTimer = setInterval(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6622` | content bridge runtime | clearInterval | `clearInterval(warmupTimer);` | must be scoped to visible UI or explicit user action |
| `js/content_bridge.js:6636` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6681` | content bridge runtime | removeEventListener | `document.removeEventListener('click', playlistFallbackPopoverState.onDocClick, true);` | must be scoped to visible UI or explicit user action |
| `js/content_bridge.js:6774` | content bridge runtime | style.display write | `iconContainer.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:6786` | content bridge runtime | style.display write | `svg.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:6828` | content bridge runtime | addEventListener | `toggle.addEventListener('click', (e) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:6853` | content bridge runtime | style.display write | `row.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:6854` | content bridge runtime | classList mutation | `row.classList.add('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:7063` | content bridge runtime | classList mutation | `item.classList.add('is-pressed');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:7064` | content bridge runtime | setTimeout | `await new Promise(resolve => setTimeout(resolve, 85));` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:7065` | content bridge runtime | classList mutation | `item.classList.remove('is-pressed');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:7068` | content bridge runtime | addEventListener | `item.addEventListener('click', (e) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:7081` | content bridge runtime | addEventListener | `item.addEventListener('keydown', (e) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:7215` | content bridge runtime | MutationObserver | `const observer = new MutationObserver((mutations) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:7259` | content bridge runtime | addEventListener | `document.addEventListener('click', playlistFallbackPopoverState.onDocClick, true);` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:7322` | content bridge runtime | clearTimeout | `if (timeoutId) clearTimeout(timeoutId);` | must be scoped to visible UI or explicit user action |
| `js/content_bridge.js:7323` | content bridge runtime | setTimeout | `timeoutId = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:7838` | content bridge runtime | style.display write | `container.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:7839` | content bridge runtime | classList mutation | `container.classList.add('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:7957` | content bridge runtime | style.display write | `target.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:7958` | content bridge runtime | classList mutation | `target.classList.add('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:8123` | content bridge runtime | fetch | `const response = await fetch(`/shorts/${encodeURIComponent(videoId)}`, {` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/content_bridge.js:8272` | content bridge runtime | fetch | `const response = await fetch(`/watch?v=${encodeURIComponent(videoId)}`, {` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/content_bridge.js:10320` | content bridge runtime | clearTimeout | `if (timeoutId) clearTimeout(timeoutId);` | must be scoped to visible UI or explicit user action |
| `js/content_bridge.js:10368` | content bridge runtime | MutationObserver | `observer = new MutationObserver(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:10385` | content bridge runtime | MutationObserver | `closeObserver = new MutationObserver(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:10395` | content bridge runtime | setTimeout | `timeoutId = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:10891` | content bridge runtime | addEventListener | `menuItem.addEventListener('click', handleInteraction, { capture: true });` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:10892` | content bridge runtime | addEventListener | `menuItem.addEventListener('keydown', (event) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:10905` | content bridge runtime | style.display write | `svg.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:10996` | content bridge runtime | style.display write | `iconWrapper.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11056` | content bridge runtime | addEventListener | `toggle.addEventListener('click', (e) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:11134` | content bridge runtime | style.display write | `button.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11144` | content bridge runtime | style.display write | `iconWrapper.style.display = 'inline-flex';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11153` | content bridge runtime | style.display write | `svg.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11212` | content bridge runtime | addEventListener | `toggle.addEventListener('click', (e) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:11258` | content bridge runtime | style.display write | `iconWrapper.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11303` | content bridge runtime | addEventListener | `toggle.addEventListener('click', (e) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:11645` | content bridge runtime | style.display write | `element.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11646` | content bridge runtime | classList mutation | `element.classList.add('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11656` | content bridge runtime | style.display write | `element.style.display = item.prevDisplay \|\| '';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11658` | content bridge runtime | classList mutation | `element.classList.remove('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11697` | content bridge runtime | style.display write | `element.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11698` | content bridge runtime | classList mutation | `element.classList.add('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11731` | content bridge runtime | classList mutation | `menuItem.classList.add('filtertube-pending');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11953` | content bridge runtime | style.display write | `containerToHide.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11954` | content bridge runtime | classList mutation | `containerToHide.classList.add('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:11969` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:12384` | content bridge runtime | fetch | `// avoiding YouTube CORS failures from content-script fetch().` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/content_bridge.js:12591` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:12631` | content bridge runtime | classList mutation | `menuItem.classList.add('filtertube-blocked');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:12632` | content bridge runtime | classList mutation | `menuItem.classList.remove('filtertube-pending');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:12667` | content bridge runtime | classList mutation | `toggleEl.classList.add('active');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:12669` | content bridge runtime | classList mutation | `toggleEl.classList.remove('active');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:12676` | content bridge runtime | classList mutation | `menuItem.classList.add('filtertube-collab-selected');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:12689` | content bridge runtime | style.display write | `commentTarget.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:12690` | content bridge runtime | classList mutation | `commentTarget.classList.add('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:12706` | content bridge runtime | style.display write | `containerToHide.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:12707` | content bridge runtime | classList mutation | `containerToHide.classList.add('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:12722` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:12761` | content bridge runtime | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:12766` | content bridge runtime | classList mutation | `menuItem.classList.remove('filtertube-pending');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:12776` | content bridge runtime | classList mutation | `menuItem.classList.remove('filtertube-pending');` | must have structured side-effect reason + restore proof |
| `js/content_bridge.js:12884` | content bridge runtime | addEventListener | `checkbox.addEventListener('click', (e) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:12891` | content bridge runtime | addEventListener | `checkbox.addEventListener('change', (e) => {` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:12917` | content bridge runtime | addEventListener | `window.addEventListener('message', handleMainWorldMessages, false);` | must have active gate + teardown/pause proof |
| `js/content_bridge.js:12919` | content bridge runtime | setTimeout | `setTimeout(() => initialize(), 50);` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:686` | quick block / 3-dot affordance | requestAnimationFrame | `requestAnimationFrame(() => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:713` | quick block / 3-dot affordance | clearTimeout | `clearTimeout(hostCard.__filtertubeQuickHoverTimer);` | must be scoped to visible UI or explicit user action |
| `js/content/block_channel.js:726` | quick block / 3-dot affordance | setTimeout | `hostCard.__filtertubeQuickHoverTimer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:747` | quick block / 3-dot affordance | setTimeout | `hostCard.__filtertubeQuickHoverTimer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1232` | quick block / 3-dot affordance | style.display write | `targetToHide.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/content/block_channel.js:1233` | quick block / 3-dot affordance | classList mutation | `targetToHide.classList.add('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content/block_channel.js:1261` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => applyDOMFallback(null, { preserveScroll: true }), 120);` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1279` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('mouseenter', activate, { passive: true });` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1280` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('mouseleave', release, { passive: true });` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1281` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('pointerenter', activate, { passive: true });` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1282` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('pointerleave', release, { passive: true });` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1283` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('focusin', activate);` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1284` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('focusout', release);` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1309` | quick block / 3-dot affordance | classList mutation | `hostCard.classList.add('filtertube-quick-block-host');` | must have structured side-effect reason + restore proof |
| `js/content/block_channel.js:1328` | quick block / 3-dot affordance | classList mutation | `anchor.classList.add('filtertube-quick-block-anchor');` | must have structured side-effect reason + restore proof |
| `js/content/block_channel.js:1335` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('mouseenter', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1338` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('mouseleave', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1341` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('pointerenter', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1344` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('pointerleave', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1347` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('focusin', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1350` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('focusout', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1356` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('mouseenter', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1359` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('mouseleave', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1362` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('pointerenter', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1365` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('pointerleave', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1368` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('focusin', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1371` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('focusout', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1406` | quick block / 3-dot affordance | addEventListener | `trigger.addEventListener('click', (event) => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1413` | quick block / 3-dot affordance | addEventListener | `trigger.addEventListener('mouseenter', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1416` | quick block / 3-dot affordance | addEventListener | `trigger.addEventListener('mouseleave', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1424` | quick block / 3-dot affordance | requestAnimationFrame | `requestAnimationFrame(() => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1448` | quick block / 3-dot affordance | setTimeout | `quickBlockSweepTimer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1463` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('focusin', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1467` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('focusout', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1468` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1473` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('input', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1477` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('click', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1478` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1483` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('scroll', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1486` | quick block / 3-dot affordance | addEventListener | `window.addEventListener('resize', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1489` | quick block / 3-dot affordance | addEventListener | `window.addEventListener('orientationchange', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1493` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('pointerenter', (event) => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1612` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('pointermove', (event) => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1619` | quick block / 3-dot affordance | requestAnimationFrame | `requestAnimationFrame(tick);` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1624` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('mouseleave', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1629` | quick block / 3-dot affordance | MutationObserver | `const observer = new MutationObserver((mutations) => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1687` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1696` | quick block / 3-dot affordance | addEventListener | `window.addEventListener('DOMContentLoaded', boot, { once: true });` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1676` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('click', (e) => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1696` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1704` | quick block / 3-dot affordance | MutationObserver | `const obs = new MutationObserver(() => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1737` | quick block / 3-dot affordance | setTimeout | `setTimeout(startObserver, 100);` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1747` | quick block / 3-dot affordance | MutationObserver | `const observer = new MutationObserver((mutations) => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1798` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('click', (e) => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1818` | quick block / 3-dot affordance | setTimeout | `if (!document.body) return void setTimeout(waitBody, 100);` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:1819` | quick block / 3-dot affordance | MutationObserver | `const observer = new MutationObserver((mutations) => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:2024` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => handledKidsBlockActions.delete(dedupKey), 10000);` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:2293` | quick block / 3-dot affordance | MutationObserver | `const observer = new MutationObserver((mutations) => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:2298` | quick block / 3-dot affordance | style.display write | `dropdown.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/content/block_channel.js:2311` | quick block / 3-dot affordance | MutationObserver | `const dropdownObserver = new MutationObserver((mutations) => {` | must have active gate + teardown/pause proof |
| `js/content/block_channel.js:2359` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/bridge_injection.js:64` | supporting module | setTimeout | `setTimeout(injectNext, 50);` | must be scoped to visible UI or explicit user action |
| `js/content/bridge_injection.js:96` | supporting module | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/content/bridge_settings.js:77` | runtime settings bridge | setTimeout | `setTimeout(() => finish(false), Math.max(250, timeoutMs));` | must have active gate + teardown/pause proof |
| `js/content/bridge_settings.js:100` | runtime settings bridge | setTimeout | `setTimeout(() => finish(false), Math.max(250, timeoutMs));` | must have active gate + teardown/pause proof |
| `js/content/bridge_settings.js:112` | runtime settings bridge | setTimeout | `const armTimeout = () => setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/bridge_settings.js:148` | runtime settings bridge | addEventListener | `window.addEventListener('message', (event) => {` | must have active gate + teardown/pause proof |
| `js/content/bridge_settings.js:168` | runtime settings bridge | clearTimeout | `clearTimeout(pending.timeoutId);` | must be scoped to visible UI or explicit user action |
| `js/content/bridge_settings.js:169` | runtime settings bridge | setTimeout | `pending.timeoutId = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/bridge_settings.js:190` | runtime settings bridge | clearTimeout | `clearTimeout(pending.timeoutId);` | must be scoped to visible UI or explicit user action |
| `js/content/bridge_settings.js:484` | runtime settings bridge | addEventListener | `window.addEventListener('filterTubeSeedReady', () => {` | must have active gate + teardown/pause proof |
| `js/content/bridge_settings.js:492` | runtime settings bridge | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/bridge_settings.js:536` | runtime settings bridge | setTimeout | `pendingStorageRefreshTimer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/collab_dialog.js:32` | supporting module | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/content/collab_dialog.js:53` | supporting module | clearTimeout | `clearTimeout(pendingCollabDialogTriggerTimeoutId);` | must be scoped to visible UI or explicit user action |
| `js/content/collab_dialog.js:55` | supporting module | setTimeout | `pendingCollabDialogTriggerTimeoutId = setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/content/collab_dialog.js:78` | supporting module | addEventListener | `document.addEventListener('click', handlePotentialCollabTrigger, true);` | must be scoped to visible UI or explicit user action |
| `js/content/collab_dialog.js:79` | supporting module | addEventListener | `document.addEventListener('keydown', handlePotentialCollabTriggerKeydown, true);` | must be scoped to visible UI or explicit user action |
| `js/content/collab_dialog.js:200` | supporting module | clearTimeout | `clearTimeout(entry.expiryTimeout);` | must be scoped to visible UI or explicit user action |
| `js/content/collab_dialog.js:310` | supporting module | MutationObserver | `collabDialogObserver = new MutationObserver(mutations => {` | must be scoped to visible UI or explicit user action |
| `js/content/collab_dialog.js:333` | supporting module | addEventListener | `document.addEventListener('DOMContentLoaded', () => {` | must be scoped to visible UI or explicit user action |
| `js/content/dom_extractors.js:150` | DOM metadata extraction | classList mutation | `card.classList.remove('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content/dom_extractors.js:195` | DOM metadata extraction | classList mutation | `card.classList.remove('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content/dom_extractors.js:196` | DOM metadata extraction | style.display write | `if (card.style && card.style.display === 'none') {` | must have structured side-effect reason + restore proof |
| `js/content/dom_extractors.js:197` | DOM metadata extraction | style.display write | `card.style.display = '';` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:776` | DOM fallback enforcement | click/media call | `clickable.click();` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:822` | DOM fallback enforcement | click/media call | `video.pause();` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:866` | DOM fallback enforcement | click/media call | `video.pause();` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:873` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/dom_fallback.js:875` | DOM fallback enforcement | click/media call | `targetLink.click();` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:883` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/dom_fallback.js:902` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/dom_fallback.js:915` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/dom_fallback.js:917` | DOM fallback enforcement | click/media call | `nextButton.click();` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:1027` | DOM fallback enforcement | classList mutation | `element.classList.remove('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:2056` | DOM fallback enforcement | setTimeout | `const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));` | must have active gate + teardown/pause proof |
| `js/content/dom_fallback.js:2105` | DOM fallback enforcement | addEventListener | `window.addEventListener('scroll', () => {` | must have active gate + teardown/pause proof |
| `js/content/dom_fallback.js:2339` | DOM fallback enforcement | addEventListener | `document.addEventListener('click', (event) => {` | must have active gate + teardown/pause proof |
| `js/content/dom_fallback.js:2391` | DOM fallback enforcement | click/media call | `video.pause();` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:2396` | DOM fallback enforcement | click/media call | `targetLink.click();` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:2403` | DOM fallback enforcement | addEventListener | `document.addEventListener('ended', (event) => {` | must have active gate + teardown/pause proof |
| `js/content/dom_fallback.js:2432` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/dom_fallback.js:2434` | DOM fallback enforcement | click/media call | `nextBtn.click();` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:3681` | DOM fallback enforcement | classList mutation | `targetToHide.classList.remove('filtertube-hidden-shelf');` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:3728` | DOM fallback enforcement | setTimeout | `pendingTimerState.timer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/dom_fallback.js:3750` | DOM fallback enforcement | setTimeout | `pendingTimerState.timer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/dom_fallback.js:3816` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/content/dom_fallback.js:3819` | DOM fallback enforcement | click/media call | `if (nextBtn) nextBtn.click();` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:4067` | DOM fallback enforcement | classList mutation | `container.classList.remove('filtertube-hidden-shelf');` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:4335` | DOM fallback enforcement | classList mutation | `shelf.classList.remove('filtertube-hidden-shelf');` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:4337` | DOM fallback enforcement | classList mutation | `shelf.classList.remove('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:4503` | DOM fallback enforcement | click/media call | `video.pause();` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:4512` | DOM fallback enforcement | click/media call | `target.click();` | must have structured side-effect reason + restore proof |
| `js/content/dom_fallback.js:4530` | DOM fallback enforcement | setTimeout | `setTimeout(() => applyDOMFallback(runState.latestSettings, runState.latestOptions), 0);` | must have active gate + teardown/pause proof |
| `js/content/dom_helpers.js:88` | DOM hide/restore helpers | classList mutation | `element.classList.add('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content/dom_helpers.js:115` | DOM hide/restore helpers | classList mutation | `element.classList.remove('filtertube-hidden-shelf');` | must have structured side-effect reason + restore proof |
| `js/content/dom_helpers.js:124` | DOM hide/restore helpers | classList mutation | `element.classList.remove('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content/dom_helpers.js:131` | DOM hide/restore helpers | style.display write | `element.style.display = '';` | must have structured side-effect reason + restore proof |
| `js/content/dom_helpers.js:164` | DOM hide/restore helpers | classList mutation | `container.classList.remove('filtertube-hidden-shelf');` | must have structured side-effect reason + restore proof |
| `js/content/dom_helpers.js:166` | DOM hide/restore helpers | classList mutation | `container.classList.remove('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content/dom_helpers.js:172` | DOM hide/restore helpers | classList mutation | `container.classList.add('filtertube-hidden-shelf');` | must have structured side-effect reason + restore proof |
| `js/content/dom_helpers.js:198` | DOM hide/restore helpers | classList mutation | `container.classList.add('filtertube-hidden-shelf');` | must have structured side-effect reason + restore proof |
| `js/content/dom_helpers.js:200` | DOM hide/restore helpers | classList mutation | `container.classList.remove('filtertube-hidden-shelf');` | must have structured side-effect reason + restore proof |
| `js/content/dom_helpers.js:202` | DOM hide/restore helpers | classList mutation | `container.classList.remove('filtertube-hidden');` | must have structured side-effect reason + restore proof |
| `js/content/first_run_prompt.js:89` | supporting module | style.display write | `actions.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/content/first_run_prompt.js:121` | supporting module | classList mutation | `container.classList.add('ft-first-run-closing');` | must have structured side-effect reason + restore proof |
| `js/content/first_run_prompt.js:122` | supporting module | setTimeout | `setTimeout(() => container.remove(), 180);` | must be scoped to visible UI or explicit user action |
| `js/content/first_run_prompt.js:142` | supporting module | classList mutation | `container.classList.add('ft-first-run-closing');` | must have structured side-effect reason + restore proof |
| `js/content/first_run_prompt.js:143` | supporting module | setTimeout | `setTimeout(() => container.remove(), 180);` | must be scoped to visible UI or explicit user action |
| `js/content/first_run_prompt.js:183` | supporting module | addEventListener | `document.addEventListener('DOMContentLoaded', createPrompt, { once: true });` | must be scoped to visible UI or explicit user action |
| `js/content/handle_resolver.js:138` | handle/channel resolver | setTimeout | `pendingDomFallbackRerunTimer = setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/content/handle_resolver.js:239` | handle/channel resolver | fetch | `response = await fetch(path, {` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/content/release_notes_prompt.js:61` | supporting module | classList mutation | `existing.classList.add('ft-release-notes-closing');` | must have structured side-effect reason + restore proof |
| `js/content/release_notes_prompt.js:62` | supporting module | setTimeout | `setTimeout(() => existing.remove(), 180);` | must be scoped to visible UI or explicit user action |
| `js/content/release_notes_prompt.js:140` | supporting module | style.display write | `actions.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/content/release_notes_prompt.js:244` | supporting module | addEventListener | `document.addEventListener('DOMContentLoaded', ready, { once: true });` | must be scoped to visible UI or explicit user action |
| `js/filter_logic.js:65` | JSON filter engine | setTimeout | `pendingVideoChannelFlush = setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/filter_logic.js:126` | JSON filter engine | setTimeout | `pendingVideoMetaFlush = setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/injector.js:72` | page injector / JSON collaboration bridge | addEventListener | `window.addEventListener('message', handleSubscriptionsImportBridgeMessage);` | must have active gate + teardown/pause proof |
| `js/injector.js:351` | page injector / JSON collaboration bridge | setTimeout | `return new Promise((resolve) => setTimeout(resolve, ms));` | must have active gate + teardown/pause proof |
| `js/injector.js:897` | page injector / JSON collaboration bridge | click/media call | `button.click();` | must have structured side-effect reason + restore proof |
| `js/injector.js:1418` | page injector / JSON collaboration bridge | setTimeout | `? setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/injector.js:1428` | page injector / JSON collaboration bridge | fetch | `response = await fetch(endpointUrl, {` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/injector.js:1437` | page injector / JSON collaboration bridge | clearTimeout | `clearTimeout(abortTimer);` | must be scoped to visible UI or explicit user action |
| `js/injector.js:1475` | page injector / JSON collaboration bridge | clearTimeout | `clearTimeout(abortTimer);` | must be scoped to visible UI or explicit user action |
| `js/injector.js:1873` | page injector / JSON collaboration bridge | addEventListener | `window.addEventListener('message', (event) => {` | must have active gate + teardown/pause proof |
| `js/injector.js:3345` | page injector / JSON collaboration bridge | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/injector.js:3433` | page injector / JSON collaboration bridge | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/injector.js:3503` | page injector / JSON collaboration bridge | setInterval | `const engineCheckInterval = setInterval(() => {` | must have active gate + teardown/pause proof |
| `js/injector.js:3506` | page injector / JSON collaboration bridge | clearInterval | `clearInterval(engineCheckInterval);` | must be scoped to visible UI or explicit user action |
| `js/injector.js:3527` | page injector / JSON collaboration bridge | setTimeout | `setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/injector.js:3528` | page injector / JSON collaboration bridge | clearInterval | `clearInterval(engineCheckInterval);` | must be scoped to visible UI or explicit user action |
| `js/io_manager.js:50` | supporting module | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/io_manager.js:1978` | supporting module | clearTimeout | `clearTimeout(backupScheduleTimer);` | must be scoped to visible UI or explicit user action |
| `js/io_manager.js:1981` | supporting module | setTimeout | `backupScheduleTimer = setTimeout(async () => {` | must be scoped to visible UI or explicit user action |
| `js/layout.js:25` | supporting module | style.display write | `imageContainer.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:26` | supporting module | classList mutation | `imageContainer.classList.add('filter-tube-visible');` | must have structured side-effect reason + restore proof |
| `js/layout.js:30` | supporting module | style.display write | `metadataContainer.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:31` | supporting module | classList mutation | `metadataContainer.classList.add('filter-tube-visible');` | must have structured side-effect reason + restore proof |
| `js/layout.js:35` | supporting module | style.display write | `mixElement.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/layout.js:56` | supporting module | classList mutation | `list.classList.add('filter-tube-visible');` | must have structured side-effect reason + restore proof |
| `js/layout.js:57` | supporting module | style.display write | `list.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:105` | supporting module | style.display write | `richGridRenderer.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:112` | supporting module | style.display write | `row.style.display = 'contents';` | must have structured side-effect reason + restore proof |
| `js/layout.js:135` | supporting module | style.display write | `item.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/layout.js:140` | supporting module | style.display write | `dismissible.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/layout.js:160` | supporting module | style.display write | `textWrapper.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:171` | supporting module | style.display write | `shortItem.style.display = 'inline-block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:189` | supporting module | style.display write | `video.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/layout.js:203` | supporting module | style.display write | `thumbnail.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:208` | supporting module | style.display write | `thumbnailLink.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:215` | supporting module | style.display write | `ytImage.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:222` | supporting module | style.display write | `img.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:231` | supporting module | style.display write | `timeOverlay.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:240` | supporting module | style.display write | `textWrapper.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:249` | supporting module | style.display write | `card.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:257` | supporting module | style.display write | `header.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:264` | supporting module | style.display write | `container.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/layout.js:279` | supporting module | style.display write | `verticalList.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:286` | supporting module | style.display write | `items.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:294` | supporting module | style.display write | `sectionSequence.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:301` | supporting module | style.display write | `lists.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:342` | supporting module | style.display write | `horizontalList.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:349` | supporting module | style.display write | `itemsContainer.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/layout.js:374` | supporting module | style.display write | `leftArrow.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/layout.js:383` | supporting module | style.display write | `rightArrow.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/layout.js:395` | supporting module | style.display write | `contents.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:408` | supporting module | style.display write | `item.style.display = 'inline-block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:420` | supporting module | style.display write | `thumbnailContainer.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:443` | supporting module | style.display write | `metadata.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/layout.js:626` | supporting module | style.display write | `element.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/layout.js:674` | supporting module | style.display write | `container.style.display = 'grid';` | must have structured side-effect reason + restore proof |
| `js/popup.js:452` | extension UI | style.display write | `mainRows.forEach(row => row.style.display = 'flex');` | must have structured side-effect reason + restore proof |
| `js/popup.js:454` | extension UI | style.display write | `mainRows.forEach(row => row.style.display = showKids ? 'none' : 'flex');` | must have structured side-effect reason + restore proof |
| `js/popup.js:455` | extension UI | style.display write | `kidsRows.forEach(row => row.style.display = showKids ? 'flex' : 'none');` | must have structured side-effect reason + restore proof |
| `js/popup.js:505` | extension UI | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:514` | extension UI | addEventListener | `durationEnabled?.addEventListener('change', async () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:518` | extension UI | addEventListener | `uploadEnabled?.addEventListener('change', async () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:522` | extension UI | addEventListener | `uppercaseEnabled?.addEventListener('change', async () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:526` | extension UI | addEventListener | `kidsDurationEnabled?.addEventListener('change', async () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:532` | extension UI | addEventListener | `kidsUploadEnabled?.addEventListener('change', async () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:538` | extension UI | addEventListener | `kidsUppercaseEnabled?.addEventListener('change', async () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:545` | extension UI | addEventListener | `manageInTab.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:609` | extension UI | addEventListener | `document.addEventListener('DOMContentLoaded', async () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:798` | extension UI | classList mutation | `toggle.classList.add('is-disabled');` | must have structured side-effect reason + restore proof |
| `js/popup.js:801` | extension UI | classList mutation | `toggle.classList.remove('is-disabled');` | must have structured side-effect reason + restore proof |
| `js/popup.js:875` | extension UI | addEventListener | `toggle.addEventListener('click', handleModeToggle);` | must be scoped to visible UI or explicit user action |
| `js/popup.js:876` | extension UI | addEventListener | `toggle.addEventListener('keydown', (event) => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1121` | extension UI | requestAnimationFrame | `requestAnimationFrame(() => positionProfileDropdown());` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1188` | extension UI | addEventListener | `cancelBtn.addEventListener('click', () => closeWith(null));` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1189` | extension UI | addEventListener | `okBtn.addEventListener('click', () => closeWith(input.value));` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1191` | extension UI | addEventListener | `input.addEventListener('keydown', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1194` | extension UI | click/media call | `okBtn.click();` | must have structured side-effect reason + restore proof |
| `js/popup.js:1197` | extension UI | click/media call | `cancelBtn.click();` | must have structured side-effect reason + restore proof |
| `js/popup.js:1201` | extension UI | addEventListener | `overlay.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1203` | extension UI | click/media call | `cancelBtn.click();` | must have structured side-effect reason + restore proof |
| `js/popup.js:1216` | extension UI | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1284` | extension UI | classList mutation | `document.body.classList.toggle('ft-popup-locked', !!isLocked);` | must have structured side-effect reason + restore proof |
| `js/popup.js:1338` | extension UI | style.display write | `actions.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/popup.js:1347` | extension UI | addEventListener | `unlockBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1427` | extension UI | addEventListener | `btn.addEventListener('click', async (e) => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1612` | extension UI | style.display write | `row.style.display = show ? '' : 'none';` | must have structured side-effect reason + restore proof |
| `js/popup.js:1616` | extension UI | style.display write | `groupEl.style.display = (!q \|\| anyVisible) ? '' : 'none';` | must have structured side-effect reason + restore proof |
| `js/popup.js:1634` | extension UI | classList mutation | `toggleEnabledBrandBtn.classList.toggle('ft-enabled', enabled);` | must have structured side-effect reason + restore proof |
| `js/popup.js:1635` | extension UI | classList mutation | `toggleEnabledBrandBtn.classList.toggle('ft-disabled', !enabled);` | must have structured side-effect reason + restore proof |
| `js/popup.js:1636` | extension UI | classList mutation | `toggleEnabledBrandBtn.classList.toggle('is-locked', locked);` | must have structured side-effect reason + restore proof |
| `js/popup.js:1647` | extension UI | classList mutation | `statusText.classList.toggle('disabled', !enabled);` | must have structured side-effect reason + restore proof |
| `js/popup.js:1665` | extension UI | addEventListener | `ftProfileBadgeBtnPopup.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1671` | extension UI | addEventListener | `document.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1680` | extension UI | addEventListener | `document.addEventListener('keydown', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1692` | extension UI | addEventListener | `searchKeywordsPopup.addEventListener('input', () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1699` | extension UI | addEventListener | `searchChannelsPopup.addEventListener('input', () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1707` | extension UI | addEventListener | `searchContentControlsPopup.addEventListener('input', () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1714` | extension UI | addEventListener | `addKeywordBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1729` | extension UI | addEventListener | `newKeywordInput.addEventListener('keypress', (event) => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1731` | extension UI | click/media call | `addKeywordBtn.click();` | must have structured side-effect reason + restore proof |
| `js/popup.js:1738` | extension UI | addEventListener | `addChannelBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1771` | extension UI | addEventListener | `channelInput.addEventListener('keypress', (event) => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1773` | extension UI | click/media call | `addChannelBtn.click();` | must have structured side-effect reason + restore proof |
| `js/popup.js:1780` | extension UI | addEventListener | `el.addEventListener('change', async () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1793` | extension UI | addEventListener | `openInTabBtn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1831` | extension UI | addEventListener | `toggleEnabledBrandBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/popup.js:1834` | extension UI | addEventListener | `toggleEnabledBrandBtn.addEventListener('keydown', async (e) => {` | must be scoped to visible UI or explicit user action |
| `js/render_engine.js:20` | extension UI | requestIdleCallback | `return requestIdleCallback(cb, { timeout: 250 });` | must be scoped to visible UI or explicit user action |
| `js/render_engine.js:22` | extension UI | setTimeout | `return setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 0);` | must be scoped to visible UI or explicit user action |
| `js/render_engine.js:28` | extension UI | clearTimeout | `else clearTimeout(id);` | must be scoped to visible UI or explicit user action |
| `js/render_engine.js:49` | extension UI | classList mutation | `if (channelDerived) element.classList.add('channel-derived');` | must have structured side-effect reason + restore proof |
| `js/render_engine.js:50` | extension UI | classList mutation | `if (sourceKey === 'comments') element.classList.add('source-comments');` | must have structured side-effect reason + restore proof |
| `js/render_engine.js:51` | extension UI | classList mutation | `if (sourceKey === 'kids') element.classList.add('source-kids');` | must have structured side-effect reason + restore proof |
| `js/render_engine.js:52` | extension UI | classList mutation | `if (sourceKey === 'collab') element.classList.add('source-collab');` | must have structured side-effect reason + restore proof |
| `js/render_engine.js:401` | extension UI | addEventListener | `toggle.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/render_engine.js:412` | extension UI | addEventListener | `toggle.addEventListener('keydown', async (e) => {` | must be scoped to visible UI or explicit user action |
| `js/render_engine.js:906` | extension UI | classList mutation | `item.classList.add('collaboration-member');` | must have structured side-effect reason + restore proof |
| `js/render_engine.js:910` | extension UI | classList mutation | `item.classList.add('collaboration-partial');` | must have structured side-effect reason + restore proof |
| `js/render_engine.js:970` | extension UI | classList mutation | `item.classList.add('collaboration-entry');` | must have structured side-effect reason + restore proof |
| `js/render_engine.js:972` | extension UI | classList mutation | `item.classList.add('collaboration-partial');` | must have structured side-effect reason + restore proof |
| `js/render_engine.js:1036` | extension UI | addEventListener | `deleteBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/render_engine.js:1189` | extension UI | addEventListener | `toggle.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/render_engine.js:1340` | extension UI | addEventListener | `toggle.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/render_engine.js:1347` | extension UI | addEventListener | `toggle.addEventListener('keydown', async (e) => {` | must be scoped to visible UI or explicit user action |
| `js/render_engine.js:1370` | extension UI | addEventListener | `deleteBtn.addEventListener('click', onClick);` | must be scoped to visible UI or explicit user action |
| `js/seed.js:131` | seed network interception | setTimeout | `replayTimer = setTimeout(() => {` | must have active gate + teardown/pause proof |
| `js/state_manager.js:500` | supporting module | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/state_manager.js:650` | supporting module | setTimeout | `setTimeout(processChannelEnrichmentQueue, 0);` | must be scoped to visible UI or explicit user action |
| `js/state_manager.js:690` | supporting module | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/state_manager.js:1240` | supporting module | setTimeout | `return new Promise((resolve) => setTimeout(resolve, ms));` | must be scoped to visible UI or explicit user action |
| `js/state_manager.js:2322` | supporting module | setTimeout | `setTimeout(runExternalReload, 0);` | must be scoped to visible UI or explicit user action |
| `js/state_manager.js:2328` | supporting module | setTimeout | `externalReloadTimer = setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/state_manager.js:2334` | supporting module | chrome.storage.onChanged.addListener | `chrome.storage.onChanged.addListener(async (changes, area) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:22` | extension UI | classList mutation | `sidebar.classList.remove('open');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:23` | extension UI | classList mutation | `overlay.classList.remove('visible');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:32` | extension UI | addEventListener | `navToggle.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:33` | extension UI | classList mutation | `sidebar.classList.toggle('open');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:34` | extension UI | classList mutation | `overlay.classList.toggle('visible');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:37` | extension UI | addEventListener | `overlay.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:41` | extension UI | addEventListener | `window.addEventListener('resize', closeOnWide);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:774` | extension UI | classList mutation | `if (isActive) pill.classList.add('active');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:779` | extension UI | addEventListener | `pill.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:782` | extension UI | classList mutation | `pill.classList.toggle('active', nextActive);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:805` | extension UI | style.display write | `if (mainPanel) mainPanel.style.display = mainEnabled?.checked ? 'block' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:884` | extension UI | clearTimeout | `clearTimeout(timerRef);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:886` | extension UI | setTimeout | `const timer = setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:906` | extension UI | style.display write | `if (durationConditions) durationConditions.style.display = showDurationControls ? 'block' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:907` | extension UI | style.display write | `if (uploadConditions) uploadConditions.style.display = showUploadControls ? 'block' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:910` | extension UI | style.display write | `uppercaseModeMenu.style.display = showUppercaseMode ? 'inline-flex' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:912` | extension UI | style.display write | `uppercaseModeSelect.style.display = showUppercaseMode ? 'inline-block' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:1013` | extension UI | clearTimeout | `clearTimeout(pendingVideoFiltersSaveTimer);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1015` | extension UI | setTimeout | `pendingVideoFiltersSaveTimer = setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1204` | extension UI | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1210` | extension UI | addEventListener | `durationEnabled?.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1214` | extension UI | addEventListener | `uploadEnabled?.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1218` | extension UI | addEventListener | `uppercaseEnabled?.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1222` | extension UI | addEventListener | `uppercaseMode?.addEventListener('change', () => scheduleSaveVideoFilters({ showToast: true }));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1228` | extension UI | addEventListener | `categoryMainEnabled?.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1232` | extension UI | addEventListener | `categoryMainMode?.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1236` | extension UI | addEventListener | `categoryMainSearch?.addEventListener('input', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1245` | extension UI | addEventListener | `radio?.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1251` | extension UI | addEventListener | `radio?.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1259` | extension UI | addEventListener | `option.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1274` | extension UI | addEventListener | `el.addEventListener('focus', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1279` | extension UI | addEventListener | `el.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1300` | extension UI | addEventListener | `el?.addEventListener('input', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1304` | extension UI | addEventListener | `el?.addEventListener('change', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:1362` | extension UI | classList mutation | `sidebar?.classList.remove('open');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:1363` | extension UI | classList mutation | `overlay?.classList.remove('visible');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:1369` | extension UI | addEventListener | `item.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2006` | extension UI | classList mutation | `pill.classList.toggle('active', isActive);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2008` | extension UI | addEventListener | `pill.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2011` | extension UI | classList mutation | `pill.classList.toggle('active', nextActive);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2030` | extension UI | style.display write | `if (kidsCategoryPanel) kidsCategoryPanel.style.display = kidsCategoryEnabled?.checked ? 'block' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2050` | extension UI | clearTimeout | `clearTimeout(pendingKidsCategorySaveTimer);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2052` | extension UI | setTimeout | `pendingKidsCategorySaveTimer = setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2091` | extension UI | style.display write | `if (kidsDurationConditionsRow) kidsDurationConditionsRow.style.display = showDurationControls ? 'block' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2092` | extension UI | style.display write | `if (kidsUploadDateConditionsRow) kidsUploadDateConditionsRow.style.display = showUploadControls ? 'block' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2096` | extension UI | style.display write | `uppercaseModeMenu.style.display = showUppercaseControls ? 'inline-flex' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2098` | extension UI | style.display write | `kidsUppercaseModeSelect.style.display = showUppercaseControls ? 'inline-block' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2144` | extension UI | clearTimeout | `clearTimeout(pendingKidsSaveTimer);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2146` | extension UI | setTimeout | `pendingKidsSaveTimer = setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2375` | extension UI | style.display write | `row.style.display = show ? '' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2378` | extension UI | style.display write | `groupEl.style.display = (!q \|\| anyVisible) ? '' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2382` | extension UI | addEventListener | `kidsContentControlsSearch.addEventListener('input', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2386` | extension UI | addEventListener | `kidsDurationCheckbox.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2390` | extension UI | addEventListener | `kidsUploadDateCheckbox.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2394` | extension UI | addEventListener | `kidsUppercaseCheckbox.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2398` | extension UI | addEventListener | `kidsUppercaseModeSelect.addEventListener('change', () => scheduleSaveKidsVideoFilters({ showToast: true }));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2400` | extension UI | addEventListener | `kidsCategoryEnabled.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2404` | extension UI | addEventListener | `kidsCategoryMode.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2408` | extension UI | addEventListener | `kidsCategorySearch.addEventListener('input', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2413` | extension UI | addEventListener | `radio.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2419` | extension UI | addEventListener | `radio.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2426` | extension UI | addEventListener | `option.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2440` | extension UI | addEventListener | `el.addEventListener('focus', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2445` | extension UI | addEventListener | `el.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2450` | extension UI | addEventListener | `el.addEventListener('input', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2454` | extension UI | addEventListener | `el.addEventListener('change', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2593` | extension UI | click/media call | `channelsTabBtn?.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2595` | extension UI | click/media call | `keywordsTabBtn?.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2597` | extension UI | click/media call | `contentTabBtn.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2606` | extension UI | requestAnimationFrame | `requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2612` | extension UI | requestAnimationFrame | `requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2618` | extension UI | requestAnimationFrame | `requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2628` | extension UI | click/media call | `kidsContentTabBtn.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2634` | extension UI | requestAnimationFrame | `requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2643` | extension UI | requestAnimationFrame | `requestAnimationFrame(() => view.scrollIntoView({ behavior: 'smooth', block: 'start' }));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2664` | extension UI | fetch | `const response = await fetch(url);` | must have endpoint decision + no-rule no-parse/no-network proof |
| `js/tab-view.js:2688` | extension UI | classList mutation | `card.classList.add('release-note-card--current');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2757` | extension UI | addEventListener | `document.addEventListener('DOMContentLoaded', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2759` | extension UI | classList mutation | `document.body.classList.add('ft-app-locked');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:2922` | extension UI | addEventListener | `openKofiBtn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:2937` | extension UI | addEventListener | `dashboardDonateBtn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:3125` | extension UI | setTimeout | `return new Promise((resolve) => setTimeout(resolve, ms));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:3333` | extension UI | classList mutation | `importSubscriptionsNotice.classList.remove(` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:3340` | extension UI | classList mutation | `importSubscriptionsNotice.classList.add(`subscriptions-import-inline--${nextTone}`);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:3341` | extension UI | classList mutation | `importSubscriptionsNotice.classList.toggle('is-loading', subscriptionsImportState.inProgress === true);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:3387` | extension UI | classList mutation | `importSubscriptionsBtn.classList.toggle('is-loading', busy);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:3647` | extension UI | cancelAnimationFrame | `cancelAnimationFrame(profileDropdownPositionRaf);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:3652` | extension UI | style.display write | `ftProfileDropdownTab.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:3711` | extension UI | requestAnimationFrame | `profileDropdownPositionRaf = requestAnimationFrame(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:3754` | extension UI | requestAnimationFrame | `requestAnimationFrame(reset);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:3763` | extension UI | cancelAnimationFrame | `cancelAnimationFrame(profileDropdownPositionRaf);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:3771` | extension UI | style.display write | `ftProfileDropdownTab.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:3775` | extension UI | requestAnimationFrame | `requestAnimationFrame(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:3839` | extension UI | addEventListener | `btn.addEventListener('click', async (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:4345` | extension UI | classList mutation | `document.body.classList.toggle('ft-managed-child-active', active && !!profile);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:4346` | extension UI | classList mutation | `document.body.classList.toggle('ft-managed-child-editor-view', editorView && !!profile);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:4372` | extension UI | addEventListener | `doneBtn.addEventListener('click', endManagedChildEdit);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:5030` | extension UI | classList mutation | `document.body.classList.toggle('ft-child-profile', childProfile);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:5039` | extension UI | classList mutation | `item.classList.toggle('ft-nav-disabled', disabled);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:5058` | extension UI | classList mutation | `document.body.classList.toggle('ft-app-locked', !!isLocked);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:5102` | extension UI | style.display write | `actions.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:5111` | extension UI | addEventListener | `unlockBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:5195` | extension UI | addEventListener | `cancelBtn.addEventListener('click', () => closeWith(null));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:5196` | extension UI | addEventListener | `okBtn.addEventListener('click', () => closeWith(input.value));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:5198` | extension UI | addEventListener | `input.addEventListener('keydown', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:5201` | extension UI | click/media call | `okBtn.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:5204` | extension UI | click/media call | `cancelBtn.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:5208` | extension UI | addEventListener | `overlay.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:5210` | extension UI | click/media call | `cancelBtn.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:5223` | extension UI | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:5290` | extension UI | addEventListener | `cancelBtn.addEventListener('click', () => closeWith(null));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:5300` | extension UI | addEventListener | `btn.addEventListener('click', () => closeWith(choice.value));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:5304` | extension UI | requestAnimationFrame | `requestAnimationFrame(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:5313` | extension UI | addEventListener | `overlay.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:5315` | extension UI | click/media call | `cancelBtn.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:5322` | extension UI | click/media call | `cancelBtn.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:5325` | extension UI | addEventListener | `overlay.addEventListener('keydown', handleEscape);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:6001` | extension UI | addEventListener | `input.addEventListener('change', syncDefaultScopeState);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:6017` | extension UI | addEventListener | `cancelBtn.addEventListener('click', () => closeWith(null));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:6018` | extension UI | addEventListener | `overlay.addEventListener('click', (event) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:6029` | extension UI | addEventListener | `applyBtn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:6042` | extension UI | addEventListener | `saveBtn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:6048` | extension UI | requestAnimationFrame | `requestAnimationFrame(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:6959` | extension UI | addEventListener | `reconnectBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:6983` | extension UI | addEventListener | `editBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:7001` | extension UI | addEventListener | `removeBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8519` | extension UI | style.display write | `actions.style.display = 'flex';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:8529` | extension UI | addEventListener | `switchBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8542` | extension UI | addEventListener | `renameBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8593` | extension UI | addEventListener | `deleteBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8703` | extension UI | addEventListener | `mainAccessBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8660` | extension UI | addEventListener | `kidsAccessBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8678` | extension UI | addEventListener | `editRulesBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8692` | extension UI | addEventListener | `pinBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8769` | extension UI | addEventListener | `clearPinBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8917` | extension UI | addEventListener | `ftProfileSelector.addEventListener('change', async (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8928` | extension UI | addEventListener | `ftProfileBadgeBtnTab.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8934` | extension UI | addEventListener | `window.addEventListener('resize', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8938` | extension UI | addEventListener | `window.addEventListener('scroll', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:8942` | extension UI | addEventListener | `document.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9040` | extension UI | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9060` | extension UI | style.display write | `a.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:9062` | extension UI | click/media call | `a.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:9063` | extension UI | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9071` | extension UI | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9419` | extension UI | addEventListener | `ftExportV3Btn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9429` | extension UI | addEventListener | `ftExportV3EncryptedBtn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9439` | extension UI | addEventListener | `ftImportV3Btn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9444` | extension UI | click/media call | `ftImportV3File.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:9447` | extension UI | addEventListener | `ftImportV3File.addEventListener('change', async (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9455` | extension UI | addEventListener | `ftImportSyncDeviceBtn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9459` | extension UI | click/media call | `document.querySelector('.nav-item[data-tab="sync"]')?.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:9465` | extension UI | addEventListener | `ftNanahJoinCode.addEventListener('input', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9487` | extension UI | addEventListener | `element.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9495` | extension UI | addEventListener | `element.addEventListener('input', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9501` | extension UI | addEventListener | `ftNanahAdvancedDetails.addEventListener('toggle', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9512` | extension UI | addEventListener | `button.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9519` | extension UI | addEventListener | `ftNanahDeviceLabel.addEventListener('input', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9524` | extension UI | addEventListener | `ftNanahDeviceLabel.addEventListener('blur', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9527` | extension UI | addEventListener | `ftNanahDeviceLabel.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9550` | extension UI | addEventListener | `ftNanahHostBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9582` | extension UI | addEventListener | `ftNanahJoinBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9617` | extension UI | addEventListener | `ftNanahConfirmSasBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9650` | extension UI | addEventListener | `ftNanahCopyPairUriBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9664` | extension UI | addEventListener | `ftNanahSendBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9698` | extension UI | addEventListener | `ftNanahTrustBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9713` | extension UI | addEventListener | `ftNanahEndSessionBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9755` | extension UI | addEventListener | `ftAllowAccountCreation.addEventListener('change', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9770` | extension UI | addEventListener | `ftMaxAccounts.addEventListener('change', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9788` | extension UI | addEventListener | `ftCreateAccountBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:9909` | extension UI | addEventListener | `ftCreateChildBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:10017` | extension UI | addEventListener | `ftSetMasterPinBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:10092` | extension UI | addEventListener | `ftClearMasterPinBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:10144` | extension UI | addEventListener | `ftAutoBackupMode.addEventListener('change', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:10189` | extension UI | addEventListener | `ftAutoBackupFormat.addEventListener('change', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:10529` | extension UI | classList mutation | `toggle.classList.add('is-disabled');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:10648` | extension UI | addEventListener | `toggle.addEventListener('click', handleModeToggle);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:10649` | extension UI | addEventListener | `toggle.addEventListener('keydown', (event) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:10709` | extension UI | style.display write | `row.style.display = show ? '' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:10713` | extension UI | style.display write | `groupEl.style.display = (!q \|\| anyVisible) ? '' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:10720` | extension UI | style.display write | `if (helpSearchCard) helpSearchCard.style.display = '';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:10730` | extension UI | style.display write | `card.style.display = show ? '' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:10736` | extension UI | style.display write | `helpSearchEmpty.style.display = showEmpty ? '' : 'none';` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:10859` | extension UI | clearInterval | `clearInterval(dashboardStatsRotationTimer);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:10892` | extension UI | setInterval | `dashboardStatsRotationTimer = setInterval(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:10913` | extension UI | addEventListener | `dashboardStatsMainBtn.addEventListener('click', () => setDashboardStatsSurface('main', { user: true }));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:10917` | extension UI | addEventListener | `dashboardStatsKidsBtn.addEventListener('click', () => setDashboardStatsSurface('kids', { user: true }));` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:10933` | extension UI | classList mutation | `dashboardStatsMainBtn.classList.toggle('active', surface === 'main');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:10936` | extension UI | classList mutation | `dashboardStatsKidsBtn.classList.toggle('active', surface === 'kids');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:10996` | extension UI | addEventListener | `importSubscriptionsActions.addEventListener('click', async (event) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11013` | extension UI | addEventListener | `importSubscriptionsBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11023` | extension UI | requestAnimationFrame | `requestAnimationFrame(() => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11035` | extension UI | addEventListener | `addKeywordBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11051` | extension UI | addEventListener | `keywordInput.addEventListener('keypress', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11053` | extension UI | click/media call | `addKeywordBtn.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:11059` | extension UI | addEventListener | `searchKeywords.addEventListener('input', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11066` | extension UI | addEventListener | `keywordSort.addEventListener('change', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11079` | extension UI | addEventListener | `keywordDatePreset.addEventListener('change', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11091` | extension UI | addEventListener | `keywordDateFrom.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11098` | extension UI | addEventListener | `keywordDateTo.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11105` | extension UI | addEventListener | `keywordDateClear.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11116` | extension UI | addEventListener | `searchContentControls.addEventListener('input', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11122` | extension UI | addEventListener | `helpSearchInput.addEventListener('input', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11132` | extension UI | addEventListener | `addChannelBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11166` | extension UI | addEventListener | `channelInput.addEventListener('keypress', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11168` | extension UI | click/media call | `addChannelBtn.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:11174` | extension UI | addEventListener | `searchChannels.addEventListener('input', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11181` | extension UI | addEventListener | `channelSort.addEventListener('change', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11194` | extension UI | addEventListener | `channelDatePreset.addEventListener('change', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11206` | extension UI | addEventListener | `channelDateFrom.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11213` | extension UI | addEventListener | `channelDateTo.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11220` | extension UI | addEventListener | `channelDateClear.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11232` | extension UI | addEventListener | `kidsAddKeywordBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11247` | extension UI | addEventListener | `kidsKeywordInput.addEventListener('keypress', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11249` | extension UI | click/media call | `kidsAddKeywordBtn.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:11255` | extension UI | addEventListener | `kidsSearchKeywords.addEventListener('input', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11262` | extension UI | addEventListener | `kidsKeywordSort.addEventListener('change', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11275` | extension UI | addEventListener | `kidsKeywordDatePreset.addEventListener('change', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11287` | extension UI | addEventListener | `kidsKeywordDateFrom.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11294` | extension UI | addEventListener | `kidsKeywordDateTo.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11301` | extension UI | addEventListener | `kidsKeywordDateClear.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11312` | extension UI | addEventListener | `kidsAddChannelBtn.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11329` | extension UI | addEventListener | `kidsChannelInput.addEventListener('keypress', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11331` | extension UI | click/media call | `kidsAddChannelBtn.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:11337` | extension UI | addEventListener | `kidsSearchChannels.addEventListener('input', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11344` | extension UI | addEventListener | `kidsChannelSort.addEventListener('change', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11357` | extension UI | addEventListener | `kidsChannelDatePreset.addEventListener('change', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11369` | extension UI | addEventListener | `kidsChannelDateFrom.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11376` | extension UI | addEventListener | `kidsChannelDateTo.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11383` | extension UI | addEventListener | `kidsChannelDateClear.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11398` | extension UI | addEventListener | `el.addEventListener('change', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11436` | extension UI | addEventListener | `themeToggle.addEventListener('click', async () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11451` | extension UI | addEventListener | `quickAddKeywordBtn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11455` | extension UI | click/media call | `if (keywordTab) keywordTab.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:11456` | extension UI | setTimeout | `setTimeout(() => keywordInput?.focus(), 100);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11461` | extension UI | addEventListener | `quickAddChannelBtn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11465` | extension UI | click/media call | `channelsTab?.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:11466` | extension UI | setTimeout | `setTimeout(() => document.getElementById('channelInput')?.focus(), 50);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11471` | extension UI | addEventListener | `quickContentControlsBtn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11475` | extension UI | click/media call | `contentTabBtn?.click();` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:11477` | extension UI | setTimeout | `setTimeout(() => document.getElementById('searchContentControls')?.focus(), 50);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11482` | extension UI | addEventListener | `quickKidsModeBtn.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11489` | extension UI | addEventListener | `window.addEventListener('hashchange', handleNavigationIntent);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11490` | extension UI | addEventListener | `window.addEventListener('popstate', handleNavigationIntent);` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11504` | extension UI | addEventListener | `item.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/tab-view.js:11512` | extension UI | classList mutation | `document.getElementById('sidebarNav')?.classList.remove('open');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:11513` | extension UI | classList mutation | `document.getElementById('sidebarOverlay')?.classList.remove('visible');` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:11534` | extension UI | classList mutation | `item.classList.toggle('active', item.getAttribute('data-tab') === effectiveViewId);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:11540` | extension UI | classList mutation | `section.classList.toggle('active', section.id === `${effectiveViewId}View`);` | must have structured side-effect reason + restore proof |
| `js/tab-view.js:11614` | extension UI | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:87` | supporting module | addEventListener | `if (onClick) btn.addEventListener('click', onClick);` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:112` | supporting module | classList mutation | `button.classList.add('btn-success-flash');` | must have structured side-effect reason + restore proof |
| `js/ui_components.js:114` | supporting module | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:120` | supporting module | classList mutation | `button.classList.remove('btn-success-flash');` | must have structured side-effect reason + restore proof |
| `js/ui_components.js:141` | supporting module | addEventListener | `toggle.addEventListener('click', () => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:143` | supporting module | classList mutation | `toggle.classList.toggle('active');` | must have structured side-effect reason + restore proof |
| `js/ui_components.js:149` | supporting module | addEventListener | `toggle.addEventListener('keydown', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:152` | supporting module | click/media call | `toggle.click();` | must have structured side-effect reason + restore proof |
| `js/ui_components.js:174` | supporting module | addEventListener | `if (onClick) btn.addEventListener('click', onClick);` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:202` | supporting module | addEventListener | `input.addEventListener('input', (e) => onInput(e.target.value));` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:206` | supporting module | addEventListener | `input.addEventListener('keypress', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:267` | supporting module | addEventListener | `btn.addEventListener('click', () => switchTab(tab.id));` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:290` | supporting module | classList mutation | `btn.classList.toggle('active', isActive);` | must have structured side-effect reason + restore proof |
| `js/ui_components.js:297` | supporting module | classList mutation | `pane.classList.toggle('active', isActive);` | must have structured side-effect reason + restore proof |
| `js/ui_components.js:419` | supporting module | addEventListener | `checkbox.addEventListener('change', (e) => onChange(e.target.checked));` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:462` | supporting module | addEventListener | `select.addEventListener('change', (e) => onChange(e.target.value));` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:544` | supporting module | style.display write | `dropdown.style.display = 'block';` | must have structured side-effect reason + restore proof |
| `js/ui_components.js:547` | supporting module | style.display write | `dropdown.style.display = '';` | must have structured side-effect reason + restore proof |
| `js/ui_components.js:602` | supporting module | requestAnimationFrame | `positionRaf = requestAnimationFrame(() => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:617` | supporting module | cancelAnimationFrame | `cancelAnimationFrame(positionRaf);` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:636` | supporting module | requestAnimationFrame | `requestAnimationFrame(() => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:638` | supporting module | requestAnimationFrame | `requestAnimationFrame(() => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:762` | supporting module | addEventListener | `btn.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:784` | supporting module | addEventListener | `trigger.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:790` | supporting module | addEventListener | `window.addEventListener('resize', () => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:794` | supporting module | addEventListener | `window.addEventListener('scroll', () => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:798` | supporting module | addEventListener | `document.addEventListener('click', (e) => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:807` | supporting module | addEventListener | `select.addEventListener('change', () => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:815` | supporting module | addEventListener | `select.addEventListener('input', () => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:821` | supporting module | MutationObserver | `const obs = new MutationObserver(() => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:828` | supporting module | style.display write | `select.style.display = 'none';` | must have structured side-effect reason + restore proof |
| `js/ui_components.js:865` | supporting module | addEventListener | `if (onClick) btn.addEventListener('click', onClick);` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:951` | supporting module | requestAnimationFrame | `requestAnimationFrame(() => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:952` | supporting module | classList mutation | `toast.classList.add('show');` | must have structured side-effect reason + restore proof |
| `js/ui_components.js:955` | supporting module | setTimeout | `setTimeout(() => {` | must be scoped to visible UI or explicit user action |
| `js/ui_components.js:956` | supporting module | classList mutation | `toast.classList.remove('show');` | must have structured side-effect reason + restore proof |
| `js/ui_components.js:957` | supporting module | setTimeout | `setTimeout(() => toast.remove(), 300);` | must be scoped to visible UI or explicit user action |
| `js/ui-shell/popup-shell.js:110` | extension UI | addEventListener | `else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(f, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 \|\| "onFocusOut" == l2 \|\| "onFocusIn" == l2 ? o2.slice(2) : l2` | must be scoped to visible UI or explicit user action |
| `js/ui-shell/popup-shell.js:110` | extension UI | removeEventListener | `else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(f, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 \|\| "onFocusOut" == l2 \|\| "onFocusIn" == l2 ? o2.slice(2) : l2` | must be scoped to visible UI or explicit user action |
| `js/ui-shell/popup-shell.js:282` | extension UI | classList mutation | `body.classList.add("ft-extension-surface");` | must have structured side-effect reason + restore proof |
| `js/ui-shell/popup-shell.js:298` | extension UI | style.display write | `popupRoot.style.display = "block";` | must have structured side-effect reason + restore proof |
| `js/ui-shell/tab-view-decor.js:110` | extension UI | addEventListener | `else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(f, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 \|\| "onFocusOut" == l2 \|\| "onFocusIn" == l2 ? o2.slice(2) : l2` | must be scoped to visible UI or explicit user action |
| `js/ui-shell/tab-view-decor.js:110` | extension UI | removeEventListener | `else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(f, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 \|\| "onFocusOut" == l2 \|\| "onFocusIn" == l2 ? o2.slice(2) : l2` | must be scoped to visible UI or explicit user action |
| `js/ui-shell/tab-view-decor.js:282` | extension UI | classList mutation | `body.classList.add("ft-extension-surface");` | must have structured side-effect reason + restore proof |
| `js/ui-shell/tab-view-decor.js:298` | extension UI | style.display write | `popupRoot.style.display = "block";` | must have structured side-effect reason + restore proof |

## Literal Selector Calls

| File:line | Family | API | Selector | Required proof gate |
| --- | --- | --- | --- | --- |
| `js/content_bridge.js:494` | content bridge runtime | querySelector | `ytd-miniplayer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:543` | content bridge runtime | querySelector | `ytd-app` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:557` | content bridge runtime | querySelectorAll | `.filtertube-block-channel-item` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:605` | content bridge runtime | querySelector | `tp-yt-paper-listbox#items` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:605` | content bridge runtime | querySelector | `tp-yt-paper-listbox` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:640` | content bridge runtime | querySelector | `yt-list-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:641` | content bridge runtime | querySelector | `tp-yt-paper-listbox#items, ' + 'tp-yt-paper-listbox, ' + 'div.menu-content[role="dialog"], ' + '.bottom-sheet-media-menu-item, ' + 'bottom-sheet-layout, ' + 'ytm-menu-popup-renderer, ' + 'ytm-menu-navigation-item-rendere...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:793` | content bridge runtime | querySelector | `.filtertube-block-channel-item` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:796` | content bridge runtime | querySelector | `.filtertube-channel-name` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:879` | content bridge runtime | querySelector | `yt-avatar-stack-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:991` | content bridge runtime | querySelector | `ytd-playlist-panel-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:993` | content bridge runtime | querySelectorAll | `ytd-playlist-panel-video-wrapper-renderer, ytd-playlist-panel-video-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:1053` | content bridge runtime | closest | `ytd-playlist-panel-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:1063` | content bridge runtime | querySelector | `ytd-playlist-panel-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:1117` | content bridge runtime | querySelector | `#related, #secondary, ytd-watch-next-secondary-results-renderer, ytd-watch-flexy #secondary` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:1385` | content bridge runtime | closest | `ytd-playlist-panel-video-wrapper-renderer, ytd-rich-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:1580` | content bridge runtime | querySelectorAll | `[data-filtertube-video-id="${id}"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:1831` | content bridge runtime | querySelector | `#video-title, h3 a, .yt-lockup-metadata-view-model__title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:1835` | content bridge runtime | querySelector | `[data-filtertube-channel-handle]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:1843` | content bridge runtime | querySelector | `#video-title, h3 a, .yt-lockup-metadata-view-model__title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:1847` | content bridge runtime | querySelector | `[data-filtertube-channel-handle]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:1973` | content bridge runtime | querySelector | `.filtertube-block-channel-item[data-is-block-all="true"][data-collaboration-group-id="${state.groupId}"]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:1975` | content bridge runtime | querySelector | `.filtertube-menu-label` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:1976` | content bridge runtime | querySelector | `.filtertube-channel-name` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:1982` | content bridge runtime | querySelector | `.filtertube-menu-label` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:1983` | content bridge runtime | querySelector | `.filtertube-channel-name` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:1984` | content bridge runtime | querySelector | `.filtertube-menu-title` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:2050` | content bridge runtime | querySelector | `.filtertube-filter-all-toggle` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:2083` | content bridge runtime | querySelectorAll | `.filtertube-block-channel-item[data-collaboration-group-id="${groupId}"]:not([data-is-block-all="true"])` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:2103` | content bridge runtime | querySelector | `.filtertube-block-channel-item[data-is-block-all="true"][data-collaboration-group-id="${groupId}"]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:2116` | content bridge runtime | querySelector | `.filtertube-menu-label` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:2117` | content bridge runtime | querySelector | `.filtertube-channel-name` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:2129` | content bridge runtime | querySelector | `.filtertube-block-channel-item[data-is-block-all="true"][data-collaboration-group-id="${groupId}"]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:2131` | content bridge runtime | querySelector | `.filtertube-menu-label` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:2132` | content bridge runtime | querySelector | `.filtertube-channel-name` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:2164` | content bridge runtime | querySelector | `.filtertube-menu-title` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:2165` | content bridge runtime | querySelector | `.yt-core-attributed-string` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:2186` | content bridge runtime | querySelector | `ytd-menu-popup-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:2205` | content bridge runtime | querySelectorAll | `.filtertube-block-channel-item[data-collaboration-group-id="${groupId}"]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:2395` | content bridge runtime | querySelectorAll | `img` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:2412` | content bridge runtime | closest | `a[href]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content_bridge.js:2684` | content bridge runtime | querySelector | `a.media-item-subtitle` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:2685` | content bridge runtime | querySelector | `.media-item-subtitle` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:2686` | content bridge runtime | querySelector | `.YtmBadgeAndBylineRendererItemByline .yt-core-attributed-string` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:2687` | content bridge runtime | querySelector | `.YtmCompactMediaItemByline .yt-core-attributed-string` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:2688` | content bridge runtime | querySelector | `.subhead` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:2693` | content bridge runtime | querySelector | `.YtmCompactMediaItemHeadline .yt-core-attributed-string[aria-label]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:2694` | content bridge runtime | querySelector | `.yt-core-attributed-string[aria-label]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:3056` | content bridge runtime | querySelector | `a[href*="list=RDMM"], a[href*="list=RD"], a[href*="start_radio=1"]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content_bridge.js:3062` | content bridge runtime | querySelector | `#video-title, ' + 'a#video-title, ' + 'yt-formatted-string#video-title, ' + 'h3, ' + 'h3 a, ' + '.compact-media-item-headline, ' + '.media-item-headline, ' + '.yt-lockup-metadata-view-model__title, ' + '.yt-lockup-view-m...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:3076` | content bridge runtime | querySelector | `a[aria-label*="Mix" i], [aria-label*="Mix -" i], [aria-label*="My Mix" i]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content_bridge.js:3089` | content bridge runtime | querySelectorAll | `yt-thumbnail-overlay-badge-view-model badge-shape .yt-badge-shape__text, ' + 'yt-thumbnail-overlay-bottom-panel-view-model, ' + 'ytd-thumbnail-overlay-bottom-panel-renderer, ' + 'ytm-thumbnail-overlay-bottom-panel-render...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:3327` | content bridge runtime | querySelectorAll | `[data-filtertube-video-id="${videoId}"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:3409` | content bridge runtime | querySelector | `[data-filtertube-video-id="${videoId}"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:3434` | content bridge runtime | querySelectorAll | `[data-filtertube-video-id="${videoId}"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:3533` | content bridge runtime | closest | `ytd-reel-shelf-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:3553` | content bridge runtime | querySelector | `[aria-label*="Mix"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:3554` | content bridge runtime | querySelector | `[title*="Mix"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:3620` | content bridge runtime | querySelector | `#video-title, .ytd-video-meta-block #video-title, h3 a, yt-formatted-string#title, span#title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:3632` | content bridge runtime | querySelector | `a[href*="/watch?"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:3633` | content bridge runtime | querySelector | `a[href*="/shorts/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:3667` | content bridge runtime | querySelector | `#channel-name a, .ytd-channel-name a, ytd-channel-name a` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:3741` | content bridge runtime | querySelectorAll | `video, audio` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:3763` | content bridge runtime | querySelector | `#movie_player` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:4280` | content bridge runtime | querySelector | `#attributed-channel-name, [id="attributed-channel-name"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:4285` | content bridge runtime | querySelector | `yt-text-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:4286` | content bridge runtime | querySelector | `.yt-core-attributed-string` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:4398` | content bridge runtime | querySelector | `#channel-name, ytd-channel-name, .ytd-channel-name` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:4443` | content bridge runtime | querySelector | `ytm-channel-thumbnail-with-link-renderer img[alt]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:4444` | content bridge runtime | querySelector | `ytm-profile-icon img[alt], .ytProfileIconImage[alt]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:4591` | content bridge runtime | querySelector | `.ytLockupMetadataViewModelMetadata .ytContentMetadataViewModelMetadataRow .yt-core-attributed-string` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:4592` | content bridge runtime | querySelector | `.yt-lockup-metadata-view-model__metadata .yt-content-metadata-view-model__metadata-row` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:4701` | content bridge runtime | querySelector | `yt-avatar-stack-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:4702` | content bridge runtime | querySelector | `#attributed-channel-name, [id="attributed-channel-name"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:4707` | content bridge runtime | querySelector | `.yt-lockup-metadata-view-model__metadata .yt-content-metadata-view-model__metadata-row` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:4709` | content bridge runtime | querySelector | `.YtmBadgeAndBylineRendererItemByline .yt-core-attributed-string` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:5493` | content bridge runtime | querySelectorAll | `[data-filtertube-video-id="${videoId}"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:5584` | content bridge runtime | querySelector | `[data-filtertube-video-id="${videoId}"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:5860` | content bridge runtime | closest | `ytd-watch-flexy, ytd-watch-metadata, ytd-video-primary-info-renderer, ytd-video-secondary-info-renderer, ytd-comments, ytd-comment-simplebox-renderer, #comments, #secondary, #related` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:5886` | content bridge runtime | closest | `ytd-rich-item-renderer, ytd-item-section-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:5889` | content bridge runtime | closest | `ytd-rich-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:5892` | content bridge runtime | closest | `ytd-playlist-panel-video-wrapper-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6277` | content bridge runtime | querySelectorAll | `.filtertube-playlist-menu-fallback-btn` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6283` | content bridge runtime | querySelectorAll | `.filtertube-fallback-menu-slot[data-filtertube-injected="true"]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:6294` | content bridge runtime | querySelector | `.${variantClass}[data-filtertube-injected="true"]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:6323` | content bridge runtime | querySelector | `#menu` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:6330` | content bridge runtime | querySelector | `yt-lockup-metadata-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6334` | content bridge runtime | querySelector | `.yt-lockup-metadata-view-model__menu-button` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6361` | content bridge runtime | querySelector | `.ShortsLockupViewModelHost` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6362` | content bridge runtime | querySelector | `.shortsLockupViewModelHostOutsideMetadata` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6363` | content bridge runtime | querySelector | `.ShortsLockupViewModelHostMetadata` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6364` | content bridge runtime | querySelector | `.YtmCompactMediaItemHost` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:6365` | content bridge runtime | querySelector | `ytm-media-item` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6366` | content bridge runtime | querySelector | `.details.stacked` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content_bridge.js:6367` | content bridge runtime | querySelector | `.YtmCompactMediaItemMetadata` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:6373` | content bridge runtime | closest | `ytd-comment-thread-renderer, ytm-comment-thread-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6376` | content bridge runtime | querySelector | `button.YtmCommentRendererMenu` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6377` | content bridge runtime | querySelector | `.YtmCommentRendererMenu` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6383` | content bridge runtime | querySelector | `#action-menu` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:6384` | content bridge runtime | querySelector | `#action-menu ytd-menu-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6385` | content bridge runtime | querySelector | `#action-menu ytm-menu-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6390` | content bridge runtime | querySelector | `.YtmCommentRendererDetails` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6390` | content bridge runtime | querySelector | `.YtmCommentRendererHeader` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6395` | content bridge runtime | querySelector | `#header` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:6395` | content bridge runtime | querySelector | `#toolbar` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:6395` | content bridge runtime | querySelector | `#main` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:6445` | content bridge runtime | closest | `ytd-comment-thread-renderer, ytm-comment-thread-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6465` | content bridge runtime | querySelector | `.filtertube-playlist-menu-fallback-btn` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6500` | content bridge runtime | querySelectorAll | `ytd-playlist-panel-video-renderer, ' + 'yt-lockup-view-model, ' + 'ytm-playlist-panel-video-renderer, ' + 'ytm-video-with-context-renderer, ' + 'ytm-compact-video-renderer, ' + 'ytm-playlist-video-renderer, ' + 'ytm-comp...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:6826` | content bridge runtime | querySelector | `.filtertube-filter-all-toggle` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:7253` | content bridge runtime | closest | `.filtertube-playlist-menu-fallback-popover` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:7254` | content bridge runtime | closest | `.filtertube-playlist-menu-fallback-btn` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:7296` | content bridge runtime | querySelector | `tp-yt-paper-listbox` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:7769` | content bridge runtime | querySelector | `a[href*="/shorts/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:7835` | content bridge runtime | closest | `ytd-rich-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:7836` | content bridge runtime | closest | `.ytGridShelfViewModelGridShelfItem` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:8695` | content bridge runtime | querySelector | `ytm-channel-thumbnail-with-link-renderer a[href*="/@"], ' + 'ytm-channel-thumbnail-with-link-renderer a[href*="/channel/UC"], ' + 'ytm-channel-thumbnail-with-link-renderer a[href*="/c/"], ' + 'ytm-channel-thumbnail-with-...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:8710` | content bridge runtime | querySelector | `h3, h2, [role="heading"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:8712` | content bridge runtime | querySelector | `ytm-channel-thumbnail-with-link-renderer img[alt]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:8713` | content bridge runtime | querySelector | `ytm-profile-icon img[alt], .ytProfileIconImage[alt], yt-avatar-shape img[alt]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:8729` | content bridge runtime | querySelector | `#author-text.yt-simple-endpoint, ' + 'a#author-text, ' + '#author-text a, ' + 'a[href*="/@"]#author-text, ' + 'a[href*="/channel/UC"]#author-text, ' + 'a[href*="/c/"]#author-text, ' + 'a[href*="/user/"]#author-text, ' + ...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:8754` | content bridge runtime | querySelector | `#author-text span` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:8755` | content bridge runtime | querySelector | `#author-text` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:8758` | content bridge runtime | querySelector | `#author-thumbnail-button[aria-label]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:8759` | content bridge runtime | querySelector | `button[aria-label*="Go to channel" i]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content_bridge.js:8760` | content bridge runtime | querySelector | `a[aria-label*="Go to channel" i]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content_bridge.js:8863` | content bridge runtime | querySelector | `#channel-info #channel-name a, #channel-name #text a, ytd-channel-name #text a` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:8879` | content bridge runtime | querySelector | `[data-filtertube-channel-handle]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:8882` | content bridge runtime | querySelector | `#channel-info #channel-name a, #channel-name #text a, ytd-channel-name #text a` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:8893` | content bridge runtime | querySelector | `[data-filtertube-channel-handle]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:8895` | content bridge runtime | querySelector | `[data-filtertube-channel-id]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:8899` | content bridge runtime | querySelector | `[data-filtertube-channel-handle], [data-filtertube-channel-id]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:8911` | content bridge runtime | querySelector | `[data-filtertube-channel-name]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:9010` | content bridge runtime | querySelector | `a[href*="/@"]:not([href*="/shorts"]):not([href*="/watch"]), ' + 'ytm-shorts-lockup-view-model a[href*="/@"], ' + '.shortsLockupViewModelHostOutsideMetadata a[href*="/@"], ' + 'a.yt-simple-endpoint[href*="/@"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9032` | content bridge runtime | querySelector | `.shortsLockupViewModelHostOutsideMetadata a[href*="/@"], .shortsLockupViewModelHostOutsideMetadata a[href*="/channel/UC"], .shortsLockupViewModelHostOutsideMetadata a[href*="/c/"], .shortsLockupViewModelHostOutsideMetada...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9033` | content bridge runtime | querySelector | `.shortsLockupViewModelHostOutsideMetadata .yt-core-attributed-string` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9034` | content bridge runtime | querySelector | `ytm-channel-thumbnail-with-link-renderer img[alt], ytm-profile-icon img[alt], .ytProfileIconImage[alt]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9042` | content bridge runtime | querySelector | `.shortsLockupViewModelHostOutsideMetadata a[href*="/@"], a[href*="/@"]:not([href*="/shorts"]):not([href*="/watch"])` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9067` | content bridge runtime | querySelector | `#channel-info ytd-channel-name a, ' + '#channel-name #text a, ' + 'ytd-channel-name #text a, ' + 'ytm-channel-thumbnail-with-link-renderer img[alt], ' + 'ytm-profile-icon img[alt], ' + '.ytProfileIconImage[alt]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9085` | content bridge runtime | querySelector | `[data-filtertube-channel-id]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:9087` | content bridge runtime | querySelector | `[data-filtertube-channel-handle]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:9089` | content bridge runtime | querySelector | `[data-filtertube-channel-custom]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:9120` | content bridge runtime | querySelector | `a[href*="/channel/UC"], a[href*="/\@"], a[href*="/c/"], a[href*="/user/"]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content_bridge.js:9148` | content bridge runtime | querySelector | `[data-filtertube-channel-name]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:9179` | content bridge runtime | querySelector | `ytm-video-with-context-renderer, ' + 'ytm-compact-video-renderer, ' + 'ytm-playlist-video-renderer, ' + 'ytm-playlist-panel-video-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9189` | content bridge runtime | matches | `ytm-video-with-context-renderer, ytm-compact-video-renderer, ytm-playlist-video-renderer, ytm-playlist-panel-video-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9191` | content bridge runtime | querySelector | `ytm-video-with-context-renderer, ytm-compact-video-renderer, ytm-playlist-video-renderer, ytm-playlist-panel-video-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9199` | content bridge runtime | querySelector | `yt-avatar-stack-view-model, #attributed-channel-name` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9204` | content bridge runtime | querySelector | `ytm-channel-thumbnail-with-link-renderer a[href*="/@"], ' + 'ytm-channel-thumbnail-with-link-renderer a[href*="/channel/UC"], ' + 'ytm-channel-thumbnail-with-link-renderer a[href*="/c/"], ' + 'ytm-channel-thumbnail-with-...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9236` | content bridge runtime | querySelector | `ytm-channel-thumbnail-with-link-renderer img[alt]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9237` | content bridge runtime | querySelector | `ytm-profile-icon img[alt], .ytProfileIconImage[alt]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9271` | content bridge runtime | querySelector | `#author-text.yt-simple-endpoint, ' + 'a#author-text, ' + 'yt-post-header a[href^="/@"], ' + 'yt-post-header a[href*="/channel/UC"], ' + 'yt-post-header a[href*="/c/"], ' + 'yt-post-header a[href*="/user/"], ' + '.ytPostH...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9308` | content bridge runtime | querySelector | `#author-thumbnail a, ' + 'yt-post-header a[href^="/@"], ' + 'yt-post-header a[href*="/channel/UC"], ' + 'yt-post-header a[href*="/c/"], ' + 'yt-post-header a[href*="/user/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9317` | content bridge runtime | querySelector | `#author span` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:9366` | content bridge runtime | querySelector | `[data-filtertube-channel-handle]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:9368` | content bridge runtime | querySelector | `[data-filtertube-channel-id]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:9407` | content bridge runtime | querySelector | `#byline-container ytd-channel-name a[href*="/@"], ' + '#byline-container ytd-channel-name a[href*="/channel/"], ' + '#byline-container ytd-channel-name a[href*="/c/"], ' + '#byline-container ytd-channel-name a[href*="/us...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9448` | content bridge runtime | querySelector | `[data-filtertube-channel-name]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:9457` | content bridge runtime | querySelector | `#byline, .ytmPlaylistPanelVideoRendererByline, .ytmPlaylistPanelVideoRendererV2Byline, ' + '.subhead .YtmCompactMediaItemByline:first-child, .YtmCompactMediaItemByline:first-child, ' + '.compact-media-item-byline, .metad...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9473` | content bridge runtime | querySelector | `#channel-info ytd-channel-name a, ' + '#channel-info #channel-name a, ' + 'ytd-video-meta-block ytd-channel-name a, ' + '#byline-container ytd-channel-name a, ' + 'ytd-channel-name #text a, ' + '.yt-content-metadata-view...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9521` | content bridge runtime | querySelector | `[data-filtertube-channel-handle], [data-filtertube-channel-id]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:9540` | content bridge runtime | querySelector | `.yt-lockup-metadata-view-model__metadata .yt-content-metadata-view-model__metadata-row:first-child .yt-content-metadata-view-model__metadata-text` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9550` | content bridge runtime | querySelector | `yt-avatar-shape img, img.yt-avatar-shape__image` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9558` | content bridge runtime | querySelector | `#attributed-channel-name, [id="attributed-channel-name"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:9560` | content bridge runtime | querySelector | `yt-avatar-stack-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9619` | content bridge runtime | querySelector | `#channel-info ytd-channel-name a[href*="/@"], ' + '#channel-info ytd-channel-name a[href*="/channel/"], ' + '#channel-info ytd-channel-name a[href*="/c/"], ' + '#channel-info ytd-channel-name a[href*="/user/"], ' + 'ytd-...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9690` | content bridge runtime | querySelector | `#channel-thumbnail[href*="/@"], ' + '#avatar-link[href*="/@"], ' + '#owner a[href*="/@"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9702` | content bridge runtime | querySelector | `#channel-info ytd-channel-name a, ' + 'ytd-channel-name #text a, ' + 'ytd-video-meta-block ytd-channel-name a` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9715` | content bridge runtime | querySelector | `#metadata a[href*="/@"]:not([id="video-title"]), ' + '.reel-item-endpoint a[href*="/@"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9728` | content bridge runtime | querySelector | `#channel-info ytd-channel-name a, ytd-channel-name #text a` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9738` | content bridge runtime | querySelector | `#channel-info ytd-channel-name a, ' + 'ytd-video-meta-block ytd-channel-name a, ' + '#byline-container ytd-channel-name a, ' + '#metadata ytd-channel-name a, ' + '#owner-name a` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9802` | content bridge runtime | querySelector | `yt-lockup-metadata-view-model, .yt-lockup-metadata-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9803` | content bridge runtime | querySelector | `yt-content-metadata-view-model, .yt-content-metadata-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9823` | content bridge runtime | querySelector | `yt-avatar-shape img, img.yt-avatar-shape__image` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9827` | content bridge runtime | querySelector | `.yt-core-attributed-string__link[href*="/@"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9837` | content bridge runtime | querySelector | `.yt-core-attributed-string__link[href*="/c/"], .yt-core-attributed-string__link[href*="/user/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9876` | content bridge runtime | querySelectorAll | `.yt-core-attributed-string__link[href*="/@"], ' + '.yt-core-attributed-string__link[href*="/c/"], ' + '.yt-core-attributed-string__link[href*="/user/"], ' + '.yt-content-metadata-view-model__metadata-text a[href*="/@"], ...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9936` | content bridge runtime | querySelector | `.yt-lockup-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9940` | content bridge runtime | querySelector | `.yt-lockup-metadata-view-model__metadata a[href*="/@"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9941` | content bridge runtime | querySelector | `.yt-lockup-metadata-view-model__metadata a[href*="/channel/UC"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9965` | content bridge runtime | querySelector | `.yt-lockup-metadata-view-model__metadata a[href*="/@"], ' + '.yt-lockup-metadata-view-model__metadata a[href*="/channel/UC"], ' + '.yt-lockup-metadata-view-model__metadata a[href*="/c/"], ' + '.yt-lockup-metadata-view-mo...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:9976` | content bridge runtime | querySelector | `yt-avatar-shape img, img.yt-avatar-shape__image` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:10000` | content bridge runtime | querySelector | `#channel-info ytd-channel-name a, ' + '#channel-info #channel-name a, ' + '.yt-lockup-metadata-view-model__metadata a[href*="/@"], ' + 'ytm-channel-thumbnail-with-link-renderer a[href*="/@"], ' + 'ytm-channel-thumbnail-w...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:10023` | content bridge runtime | querySelector | `.yt-core-attributed-string__link[href*="/@"], ' + 'ytm-channel-thumbnail-with-link-renderer a[href*="/@"], ' + '.media-channel a[href*="/@"], ' + 'a.media-item-subtitle[href*="/@"], ' + '.YtmCompactMediaItemByline a[href...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:10155` | content bridge runtime | querySelector | `[data-filtertube-channel-handle]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:10157` | content bridge runtime | querySelector | `[data-filtertube-channel-id]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:10159` | content bridge runtime | querySelector | `[data-filtertube-channel-name]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:10164` | content bridge runtime | querySelector | `#channel-info ytd-channel-name a[href*="/@"], ' + 'ytd-channel-name #text a[href*="/@"], ' + 'ytm-channel-thumbnail-with-link-renderer a[href*="/@"], ' + 'ytm-slim-owner-renderer a[href*="/@"], ' + '.media-channel a[href...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:10175` | content bridge runtime | querySelector | `a#thumbnail[data-filtertube-channel-handle]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:10184` | content bridge runtime | querySelector | `#channel-info ytd-channel-name a[href*="/channel/UC"], ' + 'a#thumbnail[href*="/channel/UC"], ' + 'ytm-channel-thumbnail-with-link-renderer a[href*="/channel/UC"], ' + 'ytm-slim-owner-renderer a[href*="/channel/UC"], ' +...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:10327` | content bridge runtime | querySelector | `yt-list-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:10328` | content bridge runtime | querySelector | `tp-yt-paper-listbox#items, ' + 'tp-yt-paper-listbox, ' + 'div.menu-content[role="dialog"], ' + '.bottom-sheet-media-menu-item, ' + 'bottom-sheet-layout, ' + 'ytm-menu-popup-renderer, ' + 'ytm-menu-navigation-item-rendere...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:10412` | content bridge runtime | querySelector | `yt-list-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:10413` | content bridge runtime | querySelector | `tp-yt-paper-listbox#items, ' + 'tp-yt-paper-listbox, ' + 'div.menu-content[role="dialog"], ' + '.bottom-sheet-media-menu-item, ' + 'bottom-sheet-layout, ' + 'ytm-menu-popup-renderer, ' + 'ytm-menu-navigation-item-rendere...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:11024` | content bridge runtime | querySelector | `.filtertube-menu-title` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:11099` | content bridge runtime | querySelector | `tp-yt-paper-listbox#items` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:11099` | content bridge runtime | querySelector | `tp-yt-paper-listbox` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:11099` | content bridge runtime | querySelector | `bottom-sheet-layout` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content_bridge.js:11274` | content bridge runtime | querySelector | `.filtertube-menu-title` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:11382` | content bridge runtime | querySelector | `.filtertube-menu-title` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:11389` | content bridge runtime | querySelector | `.filtertube-filter-all-toggle` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:11444` | content bridge runtime | closest | `ytd-comment-thread-renderer, ytm-comment-thread-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:11445` | content bridge runtime | closest | `ytd-comment-view-model, ytm-comment-view-model, ytd-comment-renderer, ytm-comment-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:11504` | content bridge runtime | closest | `ytd-rich-item-renderer, ytd-reel-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ' + 'yt-lockup-view-model, ytm-rich-item-renderer, ytm-reel-item-renderer, ' + '.ytGridShelfViewModelGridShelfItem, .shortsLock...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:11512` | content bridge runtime | closest | `ytd-rich-item-renderer, ytm-rich-item-renderer, .ytGridShelfViewModelGridShelfItem` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:11521` | content bridge runtime | querySelectorAll | `[data-filtertube-blocked-channel-id], [data-filtertube-blocked-channel-handle]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:11720` | content bridge runtime | querySelector | `.filtertube-menu-title` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:11721` | content bridge runtime | querySelector | `.yt-core-attributed-string` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:11967` | content bridge runtime | closest | `ytd-menu-popup-renderer, tp-yt-iron-dropdown, .ytd-menu-popup-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:11978` | content bridge runtime | closest | `tp-yt-iron-dropdown, ytm-menu-popup-renderer, ytd-menu-popup-renderer, div.menu-content[role="dialog"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:12276` | content bridge runtime | querySelector | `.filtertube-block-channel-item[data-collab-key="${key}"][data-collaboration-group-id="${groupId}"]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:12277` | content bridge runtime | querySelector | `.filtertube-filter-all-toggle` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:12356` | content bridge runtime | querySelector | `ytd-rich-item-renderer a[href*="${channelInfo.videoId}"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:12356` | content bridge runtime | closest | `[data-filtertube-channel-handle],[data-filtertube-channel-id]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:12461` | content bridge runtime | querySelector | `ytd-rich-item-renderer a[href*="${channelInfo.videoId}"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:12461` | content bridge runtime | closest | `[data-filtertube-channel-handle],[data-filtertube-channel-id]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:12543` | content bridge runtime | querySelector | `ytd-rich-item-renderer a[href*="${channelInfo.videoId}"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:12543` | content bridge runtime | closest | `[data-filtertube-channel-handle],[data-filtertube-channel-id]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:12641` | content bridge runtime | querySelectorAll | `[data-filtertube-video-id="${channelInfo.videoId}"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:12663` | content bridge runtime | querySelector | `.filtertube-block-channel-item[data-collab-key="${key}"][data-collaboration-group-id="${collaborationGroupId}"]` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:12664` | content bridge runtime | querySelector | `.filtertube-filter-all-toggle` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:12720` | content bridge runtime | closest | `tp-yt-iron-dropdown, ytm-menu-popup-renderer, ytd-menu-popup-renderer, div.menu-content[role="dialog"], .filtertube-playlist-menu-fallback-popover` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:12853` | content bridge runtime | querySelector | `.yt-list-item-view-model__text-wrapper` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:12857` | content bridge runtime | querySelector | `tp-yt-paper-item` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content_bridge.js:12866` | content bridge runtime | querySelector | `.filtertube-filter-all-checkbox` | FilterTube-owned DOM; lower external drift risk |
| `js/content_bridge.js:12881` | content bridge runtime | querySelector | `input[type="checkbox"]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/block_channel.js:39` | quick block / 3-dot affordance | querySelectorAll | `.filtertube-block-channel-item` | FilterTube-owned DOM; lower external drift risk |
| `js/content/block_channel.js:177` | quick block / 3-dot affordance | closest | `ytm-searchbox, yt-searchbox, form[role="search"], .searchbox-input, .searchbox-input-container` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:303` | quick block / 3-dot affordance | closest | `ytd-rich-item-renderer, ytd-reel-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ' + 'yt-lockup-view-model, ytm-rich-item-renderer, ytm-reel-item-renderer, ' + '.ytGridShelfViewModelGridShelfItem, .shortsLock...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:316` | quick block / 3-dot affordance | closest | `ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-playlist-panel-video-renderer, ytd-playlist-panel-video-wrapper-renderer, ytm-rich-item-renderer, ytm-video-with-contex...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:321` | quick block / 3-dot affordance | closest | `ytd-rich-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:338` | quick block / 3-dot affordance | closest | `ytd-rich-item-renderer, ytd-reel-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ' + 'yt-lockup-view-model, ytm-rich-item-renderer, ytm-reel-item-renderer, ' + '.ytGridShelfViewModelGridShelfItem, .shortsLock...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:346` | quick block / 3-dot affordance | closest | `ytd-rich-item-renderer, ytm-rich-item-renderer, .ytGridShelfViewModelGridShelfItem` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:690` | quick block / 3-dot affordance | querySelectorAll | `.filtertube-quick-block-host` | FilterTube-owned DOM; lower external drift risk |
| `js/content/block_channel.js:933` | quick block / 3-dot affordance | querySelectorAll | `.filtertube-quick-block-wrap` | FilterTube-owned DOM; lower external drift risk |
| `js/content/block_channel.js:1297` | quick block / 3-dot affordance | querySelector | `.filtertube-quick-block-wrap` | FilterTube-owned DOM; lower external drift risk |
| `js/content/block_channel.js:1307` | quick block / 3-dot affordance | closest | `${FT_DROPDOWN_SELECTORS}, ytd-menu-popup-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:1377` | quick block / 3-dot affordance | querySelector | `.filtertube-quick-block-wrap` | FilterTube-owned DOM; lower external drift risk |
| `js/content/block_channel.js:1428` | quick block / 3-dot affordance | matches | `:hover` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/block_channel.js:1428` | quick block / 3-dot affordance | matches | `:hover` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/block_channel.js:1538` | quick block / 3-dot affordance | querySelectorAll | `.filtertube-quick-block-host` | FilterTube-owned DOM; lower external drift risk |
| `js/content/block_channel.js:1677` | quick block / 3-dot affordance | closest | `button[aria-label*="More"], ' + 'button[aria-label*="Action"], ' + 'button[aria-label*="menu"], ' + 'yt-icon-button.dropdown-trigger, ' + 'yt-icon-button#button.dropdown-trigger, ' + '.shortsLockupViewModelHostOutsideMet...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:1799` | quick block / 3-dot affordance | closest | `ytk-menu-renderer tp-yt-paper-icon-button, tp-yt-paper-icon-button#menu-button` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:1805` | quick block / 3-dot affordance | closest | `ytk-menu-service-item-renderer, tp-yt-paper-item#menu-service-item, tp-yt-paper-item` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:1865` | quick block / 3-dot affordance | querySelector | `a[href*="/channel/UC"], a[href*="/channel/"], a[href^="/channel/"], a[href^="/user/"], a[href^="/c/"], a[href^="/@"]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/block_channel.js:1899` | quick block / 3-dot affordance | querySelector | `[aria-label]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/block_channel.js:1953` | quick block / 3-dot affordance | querySelector | `#owner-data-container a[href^="/channel/UC"], a[href^="/channel/UC"] #video-owner` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:2128` | quick block / 3-dot affordance | closest | `ytd-comment-thread-renderer, ' + 'ytm-comment-thread-renderer, ' + 'ytd-comment-view-model, ' + 'ytm-comment-view-model, ' + 'ytd-comment-renderer, ' + 'ytm-comment-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:2136` | quick block / 3-dot affordance | closest | `#comments, ytd-comments, ytd-item-section-renderer[section-identifier="comment-item-section"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:2141` | quick block / 3-dot affordance | closest | `ytd-rich-item-renderer, ' + 'ytd-video-renderer, ' + 'ytd-grid-video-renderer, ' + 'ytd-compact-video-renderer, ' + 'ytd-reel-item-renderer, ' + 'ytd-reel-video-renderer, ' + 'reel-item-endpoint, ' + 'ytd-compact-promote...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:2239` | quick block / 3-dot affordance | querySelector | `a[href*="/watch?v="], a[href*="/shorts/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/block_channel.js:2262` | quick block / 3-dot affordance | querySelector | `.filtertube-block-channel-item` | FilterTube-owned DOM; lower external drift risk |
| `js/content/block_channel.js:2265` | quick block / 3-dot affordance | querySelector | `.filtertube-menu-title` | FilterTube-owned DOM; lower external drift risk |
| `js/content/block_channel.js:2350` | quick block / 3-dot affordance | querySelectorAll | `.filtertube-block-channel-item` | FilterTube-owned DOM; lower external drift risk |
| `js/content/collab_dialog.js:40` | supporting module | closest | `yt-avatar-stack-view-model, .yt-avatar-stack-view-model, #attributed-channel-name, [aria-label*="Collaboration"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/collab_dialog.js:42` | supporting module | closest | `[data-filtertube-collab-awaiting-dialog="true"]` | FilterTube-owned DOM; lower external drift risk |
| `js/content/collab_dialog.js:139` | supporting module | querySelectorAll | `[data-filtertube-video-id="${videoId}"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/collab_dialog.js:236` | supporting module | querySelectorAll | `yt-list-item-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/collab_dialog.js:241` | supporting module | querySelector | `.yt-list-item-view-model__title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/collab_dialog.js:242` | supporting module | querySelector | `a[href*="/@"]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/collab_dialog.js:243` | supporting module | querySelector | `a` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/collab_dialog.js:248` | supporting module | querySelector | `a[href]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/collab_dialog.js:257` | supporting module | querySelector | `.yt-list-item-view-model__subtitle` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/collab_dialog.js:294` | supporting module | querySelector | `yt-dialog-header-view-model, h2, [role="heading"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/collab_dialog.js:314` | supporting module | matches | `tp-yt-paper-dialog` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_extractors.js:213` | DOM metadata extraction | querySelector | `#video-title, .yt-lockup-metadata-view-model__title, .yt-lockup-metadata-view-model__heading-reset, h3 a, yt-formatted-string#title, span#title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_extractors.js:253` | DOM metadata extraction | querySelectorAll | `.yt-badge-shape__text, badge-shape[aria-label], ytd-thumbnail-overlay-time-status-renderer span#text, span.ytd-thumbnail-overlay-time-status-renderer, #time-status span` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_extractors.js:281` | DOM metadata extraction | querySelector | `.yt-badge-shape__text` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_extractors.js:291` | DOM metadata extraction | querySelector | `badge-shape[aria-label]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_extractors.js:386` | DOM metadata extraction | querySelector | `:scope #title-container, :scope #header, :scope ytd-shelf-header-renderer, :scope .grid-subheader, :scope .shelf-title-row, :scope h2, :scope yt-section-header-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_extractors.js:391` | DOM metadata extraction | querySelector | `#title` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_extractors.js:392` | DOM metadata extraction | querySelector | `#title-text` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_extractors.js:393` | DOM metadata extraction | querySelector | `yt-formatted-string#title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_extractors.js:394` | DOM metadata extraction | querySelector | `span#title` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_extractors.js:395` | DOM metadata extraction | querySelector | `h2` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_extractors.js:396` | DOM metadata extraction | querySelector | `.yt-shelf-header-layout__title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_extractors.js:402` | DOM metadata extraction | querySelector | `:scope > #dismissible #title` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_extractors.js:403` | DOM metadata extraction | querySelector | `:scope > #dismissible #title-text` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_extractors.js:404` | DOM metadata extraction | querySelector | `:scope > h2` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_extractors.js:405` | DOM metadata extraction | querySelector | `.yt-shelf-header-layout__title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_extractors.js:796` | DOM metadata extraction | querySelectorAll | `a[href]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_extractors.js:926` | DOM metadata extraction | querySelectorAll | `[data-filtertube-channel-handle],[data-filtertube-channel-id]` | FilterTube-owned DOM; lower external drift risk |
| `js/content/dom_extractors.js:996` | DOM metadata extraction | querySelector | `a[href*="/watch?v="], a[href^="/watch?v="]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_extractors.js:1013` | DOM metadata extraction | querySelectorAll | `a[href]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_extractors.js:1022` | DOM metadata extraction | querySelector | `a#thumbnail[href*="watch?v="], a[href*="/watch?v="]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_extractors.js:1032` | DOM metadata extraction | querySelector | `a#video-title[href*="watch?v="], a.yt-lockup-metadata-view-model__title[href*="watch?v="], a[href*="/watch?v="]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_extractors.js:1042` | DOM metadata extraction | querySelector | `a[href*="/watch?v="]:not(.yt-core-attributed-string__link)` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_extractors.js:1052` | DOM metadata extraction | querySelector | `a[href*="/shorts/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:123` | DOM fallback enforcement | querySelectorAll | `yt-thumbnail-overlay-badge-view-model badge-shape .yt-badge-shape__text, ' + 'yt-thumbnail-overlay-bottom-panel-view-model, ' + 'ytd-thumbnail-overlay-bottom-panel-renderer, ' + 'ytm-thumbnail-overlay-bottom-panel-render...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:140` | DOM fallback enforcement | querySelector | `#video-title, a#video-title, yt-formatted-string#video-title, h3, h3 a, ' + '.compact-media-item-headline, .media-item-headline, ' + '.yt-lockup-metadata-view-model__title, .yt-lockup-view-model__title, ' + '.yt-lockup-m...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:146` | DOM fallback enforcement | querySelector | `a[aria-label*="Mix" i], [aria-label*="Mix -" i], [aria-label*="My Mix" i]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:175` | DOM fallback enforcement | querySelector | `ytd-playlist-panel-video-renderer, ' + 'ytd-playlist-panel-video-wrapper-renderer, ' + 'ytm-playlist-panel-video-renderer, ' + 'ytm-playlist-panel-video-wrapper-renderer, ' + 'ytm-playlist-video-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:189` | DOM fallback enforcement | querySelectorAll | `ytd-playlist-panel-video-renderer, ' + 'ytm-playlist-panel-video-renderer, ' + 'ytm-playlist-video-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:201` | DOM fallback enforcement | querySelector | `ytd-playlist-panel-renderer, ' + 'ytm-playlist-panel-renderer, ' + 'ytm-playlist-panel-renderer-v2` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:527` | DOM fallback enforcement | querySelector | `#channel-header-container a[href^="/@"], ' + '#channel-header-container a[href^="/channel/"], ' + '#channel-header-container a[href^="/c/"], ' + '#channel-header-container a[href^="/user/"], ' + 'ytd-c4-tabbed-header-ren...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:545` | DOM fallback enforcement | querySelector | `ytd-page-header-renderer, ytd-c4-tabbed-header-renderer, ytd-channel-name, #channel-header-container, .yt-page-header-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:600` | DOM fallback enforcement | querySelector | `ytm-slim-owner-renderer, ' + 'ytd-video-owner-renderer, ' + '#owner.ytd-watch-metadata, ' + 'ytd-video-secondary-info-renderer #owner` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:689` | DOM fallback enforcement | querySelector | `a[href*="watch?v="], a[href^="/watch?v="]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:754` | DOM fallback enforcement | querySelector | `a[href*="watch?v="], a[href^="/watch?v="]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:767` | DOM fallback enforcement | querySelector | `ytm-playlist-panel-entry-point, ' + 'ytm-playlist-engagement-panel-entry-point, ' + 'ytm-engagement-panel-title-header-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:794` | DOM fallback enforcement | querySelector | `ytm-watch h1, ytd-watch-metadata h1, h1.title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:807` | DOM fallback enforcement | querySelector | `ytm-watch, ytd-watch-flexy` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:820` | DOM fallback enforcement | querySelector | `video.html5-main-video` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:864` | DOM fallback enforcement | querySelector | `video.html5-main-video` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:913` | DOM fallback enforcement | querySelector | `.ytp-next-button:not([disabled])` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:924` | DOM fallback enforcement | querySelector | `ytm-watch, ytd-watch-flexy` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1411` | DOM fallback enforcement | querySelectorAll | `ytm-button-renderer a, a[href^="intent://"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1422` | DOM fallback enforcement | closest | `ytm-button-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1576` | DOM fallback enforcement | querySelectorAll | `#comments, ytd-comments, ytd-item-section-renderer[section-identifier="comment-item-section"], ' + 'ytm-comment-section-renderer, ytm-comments-entry-point-header-renderer, ' + 'ytm-comments-entry-point-renderer, ytm-comm...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1582` | DOM fallback enforcement | querySelectorAll | `ytd-comment-thread-renderer, ytm-comment-thread-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1583` | DOM fallback enforcement | querySelectorAll | `ytd-comment-renderer, ytm-comment-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1584` | DOM fallback enforcement | querySelectorAll | `ytd-comment-view-model, ytm-comment-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1594` | DOM fallback enforcement | querySelector | `#simple-box, ytd-comment-simplebox-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1636` | DOM fallback enforcement | querySelector | `#author-text.yt-simple-endpoint, ' + 'a#author-text, ' + '#author-text a` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1642` | DOM fallback enforcement | querySelector | `#author-text` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_fallback.js:1715` | DOM fallback enforcement | closest | `ytd-comment-thread-renderer, ytm-comment-thread-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1716` | DOM fallback enforcement | querySelector | `:scope > ytd-comment-renderer, :scope > ytm-comment-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1749` | DOM fallback enforcement | querySelector | `#author-text.yt-simple-endpoint, ' + 'a#author-text, ' + '#author-text a` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1754` | DOM fallback enforcement | querySelector | `#author-text` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_fallback.js:1791` | DOM fallback enforcement | closest | `ytd-comment-simplebox-renderer, ytm-comment-simplebox-renderer, #simple-box` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1793` | DOM fallback enforcement | closest | `ytd-comment-thread-renderer, ytm-comment-thread-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1843` | DOM fallback enforcement | querySelector | `#header #author-text.yt-simple-endpoint, ' + '#header a#author-text, ' + '#header #author-text a, ' + '#header ytd-author-comment-badge-renderer a[href^="/@"], ' + '#header ytd-author-comment-badge-renderer a[href^="/cha...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1853` | DOM fallback enforcement | querySelector | `#author-thumbnail-button[aria-label]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1854` | DOM fallback enforcement | querySelector | `#author-text` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_fallback.js:1896` | DOM fallback enforcement | querySelectorAll | `ytd-guide-renderer a#endpoint[href^="/@"], ' + 'ytd-guide-renderer a#endpoint[href^="/channel/"], ' + 'ytd-guide-renderer a#endpoint[href^="/c/"], ' + 'ytd-guide-renderer a#endpoint[href^="/user/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1908` | DOM fallback enforcement | closest | `ytd-guide-entry-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1911` | DOM fallback enforcement | querySelector | `yt-formatted-string.title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:1911` | DOM fallback enforcement | querySelector | `.title` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_fallback.js:2130` | DOM fallback enforcement | querySelectorAll | `[data-filtertube-whitelist-pending="true"], [data-filtertube-hidden], .filtertube-hidden, .filtertube-hidden-shelf` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2144` | DOM fallback enforcement | querySelector | `ytd-watch-metadata` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2145` | DOM fallback enforcement | querySelector | `ytd-video-primary-info-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2146` | DOM fallback enforcement | querySelector | `ytd-video-secondary-info-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2149` | DOM fallback enforcement | querySelectorAll | `#actions.ytd-watch-metadata, #owner.ytd-watch-metadata, #description.ytd-watch-metadata` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2156` | DOM fallback enforcement | querySelector | `ytd-watch-metadata` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2158` | DOM fallback enforcement | querySelectorAll | `[data-filtertube-whitelist-pending="true"], [data-filtertube-hidden], .filtertube-hidden, .filtertube-hidden-shelf` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2174` | DOM fallback enforcement | querySelectorAll | `#video-title, #video-title-link, .yt-lockup-metadata-view-model__title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2178` | DOM fallback enforcement | closest | `ytd-grid-video-renderer, ytd-rich-grid-media, ytd-rich-item-renderer, ' + 'ytd-video-renderer, ytd-compact-video-renderer, yt-lockup-view-model, ' + 'ytd-playlist-video-renderer, ytd-watch-card-compact-video-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2192` | DOM fallback enforcement | querySelectorAll | `.yt-badge-shape--membership, [aria-label="Members only"], .badge-style-type-membership, ytd-badge-supported-renderer, .yt-badge-shape` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2202` | DOM fallback enforcement | closest | `ytd-grid-video-renderer, ytd-rich-grid-media, ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, yt-lockup-view-model, ytd-playlist-video-renderer, ytd-watch-flexy, ytd-watch-metadata, ytd-video-prim...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2210` | DOM fallback enforcement | closest | `ytd-shelf-renderer, ytd-horizontal-list-renderer, ytd-rich-section-renderer, ytd-item-section-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2220` | DOM fallback enforcement | querySelectorAll | `a[href*="list=UUMO"], a[title="Members-only videos"], a[href*="Members-only videos"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2222` | DOM fallback enforcement | closest | `ytd-shelf-renderer, ytd-horizontal-list-renderer, ytd-rich-section-renderer, ytd-item-section-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2231` | DOM fallback enforcement | querySelectorAll | `ytd-shelf-renderer h2, ytd-shelf-renderer #title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2235` | DOM fallback enforcement | closest | `ytd-shelf-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2245` | DOM fallback enforcement | querySelectorAll | `[data-filtertube-members-only-hidden]` | FilterTube-owned DOM; lower external drift risk |
| `js/content/dom_fallback.js:2255` | DOM fallback enforcement | querySelectorAll | `yt-lockup-view-model.yt-lockup-view-model--collection-stack-2` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2257` | DOM fallback enforcement | querySelector | `a[href*="start_radio=1"]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:2259` | DOM fallback enforcement | querySelector | `yt-collections-stack, yt-collection-thumbnail-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2261` | DOM fallback enforcement | querySelector | `a[href*="list="]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:2267` | DOM fallback enforcement | closest | `ytd-shelf-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2272` | DOM fallback enforcement | closest | `ytd-horizontal-list-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2282` | DOM fallback enforcement | querySelectorAll | `yt-chip-cloud-chip-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2292` | DOM fallback enforcement | querySelectorAll | `yt-chip-cloud-chip-renderer[data-filtertube-hidden]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2310` | DOM fallback enforcement | querySelectorAll | `[data-filtertube-hidden], .filtertube-hidden, [data-filtertube-pending-category], [data-filtertube-pending-upload-date]` | FilterTube-owned DOM; lower external drift risk |
| `js/content/dom_fallback.js:2327` | DOM fallback enforcement | querySelectorAll | `${VIDEO_CARD_SELECTORS}[data-filtertube-whitelist-pending="true"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2343` | DOM fallback enforcement | closest | `.ytp-next-button, .ytp-prev-button` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:2371` | DOM fallback enforcement | querySelector | `a[href*="watch?v="]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2389` | DOM fallback enforcement | querySelector | `video.html5-main-video` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2428` | DOM fallback enforcement | querySelector | `.ytp-next-button` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:2452` | DOM fallback enforcement | closest | `ytd-secondary-search-container-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2520` | DOM fallback enforcement | closest | `#secondary, ytd-watch-next-secondary-results-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2608` | DOM fallback enforcement | querySelector | `a[href^="/@"], a[href^="/channel/"], a[href^="/c/"], a[href^="/user/"]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:2658` | DOM fallback enforcement | querySelector | `#video-title, .ytd-video-meta-block #video-title, h3 a, .metadata-snippet-container #video-title, ' + '#video-title-link, .yt-lockup-metadata-view-model-wiz__title, .yt-lockup-metadata-view-model__title, ' + '.yt-lockup-...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2672` | DOM fallback enforcement | querySelector | `#byline, #byline-container #byline, ' + '.ytmPlaylistPanelVideoRendererByline, ' + '.ytmPlaylistPanelVideoRendererV2Byline, ' + '.subhead .YtmCompactMediaItemByline:first-child, ' + '.YtmCompactMediaItemByline:first-chil...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2683` | DOM fallback enforcement | querySelector | `#channel-info ytd-channel-name a, ' + '#channel-info a[href^="/@"], ' + '#channel-info a[href^="/channel/"], ' + '#channel-info a[href^="/c/"], ' + '#channel-info a[href^="/user/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2692` | DOM fallback enforcement | querySelector | `#channel-name a, ' + 'ytd-channel-name a, ' + 'a[href^="/@"]:not([href*="/shorts"]):not([href*="/watch"]), ' + 'a[href^="/channel/"], ' + 'a[href^="/c/"], ' + 'a[href^="/user/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2708` | DOM fallback enforcement | querySelector | `#main-link[href^="/@"], ' + '#main-link[href^="/channel/"], ' + '#main-link[href^="/c/"], ' + '#main-link[href^="/user/"], ' + '#channel-title a[href^="/@"], ' + '#channel-title a[href^="/channel/"], ' + '#channel-title ...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2744` | DOM fallback enforcement | querySelector | `ytm-channel-thumbnail-with-link-renderer a[href^="/@"], ' + 'ytm-channel-thumbnail-with-link-renderer a[href^="/channel/"], ' + 'ytm-channel-thumbnail-with-link-renderer a[href^="/c/"], ' + 'ytm-channel-thumbnail-with-li...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2769` | DOM fallback enforcement | querySelector | `.yt-content-metadata-view-model__metadata-row a[href^="/@"], ' + '.yt-content-metadata-view-model__metadata-row a[href^="/channel/"], ' + '.yt-content-metadata-view-model__metadata-row a[href^="/c/"], ' + '.yt-content-me...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2781` | DOM fallback enforcement | querySelector | `#channel-name a, ' + '.ytd-channel-name a, ' + 'ytd-channel-name a, ' + '#byline-container #byline, ' + '#text, ' + '.ytd-video-owner-renderer a, ' + '.yt-lockup-metadata-view-model-wiz__metadata, ' + '.yt-content-metada...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2795` | DOM fallback enforcement | querySelector | `.yt-page-header-view-model__page-header-content-metadata .yt-content-metadata-view-model__metadata-text, ' + '.yt-page-header-view-model__page-header-content-metadata [role="text"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2800` | DOM fallback enforcement | querySelector | `#watch-card-subtitle, #watch-card-subtitle yt-formatted-string` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2801` | DOM fallback enforcement | closest | `a` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_fallback.js:2801` | DOM fallback enforcement | querySelector | `a[href*="/channel/UC"], a[href^="/@"], a[href*="/user/"], a[href*="/c/"], ' + '.media-channel a[href^="/@"], .media-channel a[href^="/channel/"], .media-channel a[href^="/c/"], .media-channel a[href^="/user/"], ' + '.sub...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2810` | DOM fallback enforcement | querySelector | `.ytFlexibleActionsViewModelAction a[href^="/@"]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:2839` | DOM fallback enforcement | querySelector | `a[title]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:2852` | DOM fallback enforcement | querySelector | `.YtmCompactMediaItemHeadline .yt-core-attributed-string[aria-label], ' + '.YtmVideoWithContextRendererHeadline .yt-core-attributed-string[aria-label], ' + '.media-item-headline .yt-core-attributed-string[aria-label], ' +...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2869` | DOM fallback enforcement | querySelector | `h3, h2, .channel-title, .ytm-channel-name, .yt-core-attributed-string, [role="heading"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2884` | DOM fallback enforcement | querySelector | `a[href^="/@"], a[href^="/channel/"], a[href^="/c/"], a[href^="/user/"], ' + '.subhead, .secondary-text, .ytm-channel-name, ytm-badge-and-byline-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2892` | DOM fallback enforcement | querySelector | `.yt-page-header-view-model__page-header-content-metadata [role="text"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2896` | DOM fallback enforcement | querySelector | `.yt-page-header-view-model__page-header-title [role="text"], .dynamicTextViewModelH1 [role="text"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2907` | DOM fallback enforcement | querySelector | `[aria-label]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_fallback.js:2943` | DOM fallback enforcement | querySelector | `#description-text, ' + '.metadata-snippet-container, ' + 'ytd-text-inline-expander#description, ' + 'ytd-text-inline-expander #expanded, ' + '.yt-lockup-metadata-view-model-wiz__description, ' + '.yt-lockup-metadata-view...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:2970` | DOM fallback enforcement | querySelector | `[data-filtertube-channel-id], [data-filtertube-channel-handle]` | FilterTube-owned DOM; lower external drift risk |
| `js/content/dom_fallback.js:2990` | DOM fallback enforcement | querySelector | `#thumbnail a[data-filtertube-channel-handle], ' + '#thumbnail a[data-filtertube-channel-id], ' + 'a#thumbnail[data-filtertube-channel-handle], ' + 'a#thumbnail[data-filtertube-channel-id], ' + '#thumbnail[data-filtertube...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3005` | DOM fallback enforcement | querySelector | `#channel-info a#channel-thumbnail[data-filtertube-channel-id], ' + '#channel-info a#channel-thumbnail[data-filtertube-channel-handle], ' + '#channel-info a[data-filtertube-channel-id], ' + '#channel-info a[data-filtertub...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3045` | DOM fallback enforcement | querySelector | `.ytFlexibleActionsViewModelAction a[href^="/@"]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:3047` | DOM fallback enforcement | querySelector | `.yt-page-header-view-model__page-header-content-metadata [role="text"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3055` | DOM fallback enforcement | querySelector | `[data-filtertube-channel-id]` | FilterTube-owned DOM; lower external drift risk |
| `js/content/dom_fallback.js:3061` | DOM fallback enforcement | querySelector | `a[href*="/channel/UC"]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:3106` | DOM fallback enforcement | querySelector | `ytd-watch-card-rich-header-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3116` | DOM fallback enforcement | querySelectorAll | `ytd-watch-card-rich-header-renderer a[href^="/@"], ' + 'ytd-watch-card-rich-header-renderer a[href^="/channel/"], ' + 'ytd-watch-card-rich-header-renderer a[href^="/c/"], ' + 'ytd-watch-card-rich-header-renderer a[href^=...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3280` | DOM fallback enforcement | querySelector | `#metadata-line` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_fallback.js:3281` | DOM fallback enforcement | querySelector | `.ytd-video-meta-block` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3282` | DOM fallback enforcement | querySelector | `.yt-lockup-metadata-view-model__metadata` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3283` | DOM fallback enforcement | querySelector | `.yt-content-metadata-view-model__metadata-row` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3284` | DOM fallback enforcement | querySelector | `#video-info` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3388` | DOM fallback enforcement | closest | `#secondary` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_fallback.js:3397` | DOM fallback enforcement | closest | `ytd-universal-watch-card-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3399` | DOM fallback enforcement | querySelector | `#header a[href^="/channel/"], ' + '#header a[href^="/@"], ' + '#header a[href^="/c/"], ' + '#header a[href^="/user/"], ' + 'a[href^="/channel/"], a[href^="/@"], a[href^="/c/"], a[href^="/user/"]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:3474` | DOM fallback enforcement | querySelector | `#thumbnail[href^="/shorts"], #video-title[href^="/shorts"], a[href^="/shorts/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3475` | DOM fallback enforcement | querySelector | `ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"], badge-shape[aria-label="Shorts"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3476` | DOM fallback enforcement | querySelector | `.yt-badge-shape__text` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3534` | DOM fallback enforcement | querySelector | `a[href]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:3536` | DOM fallback enforcement | querySelector | `a[href*="start_radio=1"]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:3537` | DOM fallback enforcement | querySelector | `.yt-badge-shape__text` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3627` | DOM fallback enforcement | closest | `[role="listitem"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_fallback.js:3640` | DOM fallback enforcement | closest | `ytd-rich-item-renderer, ytd-item-section-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3643` | DOM fallback enforcement | closest | `ytd-rich-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3646` | DOM fallback enforcement | closest | `ytd-secondary-search-container-renderer, ytd-universal-watch-card-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3649` | DOM fallback enforcement | closest | `ytd-playlist-panel-video-wrapper-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3652` | DOM fallback enforcement | closest | `ytm-rich-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3818` | DOM fallback enforcement | querySelector | `.ytp-next-button:not([disabled])` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:3953` | DOM fallback enforcement | querySelectorAll | `ytd-inline-survey-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3956` | DOM fallback enforcement | querySelectorAll | `ytd-compact-video-renderer, ytd-video-renderer, ytd-rich-grid-media, ytd-rich-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3967` | DOM fallback enforcement | closest | `ytd-rich-section-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:3982` | DOM fallback enforcement | querySelectorAll | `yt-chip-cloud-chip-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4006` | DOM fallback enforcement | querySelectorAll | `ytd-rich-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4009` | DOM fallback enforcement | querySelector | `#content` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/content/dom_fallback.js:4031` | DOM fallback enforcement | querySelectorAll | `ytd-guide-entry-renderer a[title="Shorts"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4032` | DOM fallback enforcement | closest | `ytd-guide-entry-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4086` | DOM fallback enforcement | querySelector | `a#thumbnail[href*="/shorts/"], a#video-title[href*="/shorts/"], a.yt-simple-endpoint[href*="/shorts/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4087` | DOM fallback enforcement | querySelector | `#video-title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4088` | DOM fallback enforcement | querySelector | `ytd-thumbnail-overlay-time-status-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4152` | DOM fallback enforcement | querySelector | `a[href]` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/content/dom_fallback.js:4166` | DOM fallback enforcement | closest | `ytd-rich-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4173` | DOM fallback enforcement | closest | `.ytGridShelfViewModelGridShelfItem` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4246` | DOM fallback enforcement | querySelector | `#channel-info ytd-channel-name a, ' + 'ytd-video-meta-block ytd-channel-name a, ' + '#byline-container ytd-channel-name a, ' + '.yt-content-metadata-view-model__metadata-row a[href^="/@"], ' + '.yt-content-metadata-view-...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4311` | DOM fallback enforcement | querySelectorAll | `ytd-shelf-renderer, ytd-rich-shelf-renderer, ytd-reel-shelf-renderer, ytd-item-section-renderer, ytd-horizontal-card-list-renderer, grid-shelf-view-model, yt-section-header-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4316` | DOM fallback enforcement | closest | `#secondary, ytd-watch-next-secondary-results-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4361` | DOM fallback enforcement | closest | `ytd-rich-section-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4350` | DOM fallback enforcement | querySelectorAll | `ytd-rich-item-renderer, ytd-reel-item-renderer, yt-lockup-view-model, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4374` | DOM fallback enforcement | querySelectorAll | `.ytGridShelfViewModelGridShelfItem, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, ytd-reel-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4402` | DOM fallback enforcement | querySelectorAll | `ytd-rich-grid-renderer ytd-rich-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4416` | DOM fallback enforcement | querySelector | `a[href*="watch?v="], a[href^="/shorts/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4417` | DOM fallback enforcement | querySelector | `a[href*="watch?v="], a[href^="/shorts/"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4479` | DOM fallback enforcement | querySelector | `a[href*="watch?v="]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4489` | DOM fallback enforcement | querySelector | `a[href*="watch?v="]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_fallback.js:4501` | DOM fallback enforcement | querySelector | `video.html5-main-video` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/content/dom_helpers.js:188` | DOM hide/restore helpers | closest | `.filtertube-hidden` | FilterTube-owned DOM; lower external drift risk |
| `js/content/dom_helpers.js:191` | DOM hide/restore helpers | closest | `.filtertube-hidden-shelf` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/injector.js:661` | page injector / JSON collaboration bridge | querySelectorAll | `ytd-channel-renderer, ytm-channel-list-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/injector.js:842` | page injector / JSON collaboration bridge | querySelectorAll | `button, a[role="button"], yt-button-shape button, ytm-button-renderer button` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/injector.js:3175` | page injector / JSON collaboration bridge | closest | `ytd-rich-item-renderer, ' + 'ytd-grid-video-renderer, ' + 'ytd-compact-video-renderer, ' + 'ytd-playlist-video-renderer, ' + 'ytd-playlist-panel-video-renderer, ' + 'ytd-playlist-panel-video-wrapper-renderer, ' + 'ytm-pl...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/injector.js:3192` | page injector / JSON collaboration bridge | querySelector | `yt-avatar-stack-view-model, .yt-avatar-stack-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/injector.js:3223` | page injector / JSON collaboration bridge | querySelectorAll | `ytd-watch-metadata, ' + 'ytd-video-owner-renderer, ' + 'ytd-playlist-panel-video-renderer[selected], ' + 'ytd-playlist-panel-video-wrapper-renderer[selected] ytd-playlist-panel-video-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:16` | supporting module | querySelectorAll | `.yt-lockup-view-model-wiz--horizontal` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:21` | supporting module | querySelector | `.yt-lockup-view-model-wiz__content-image` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:22` | supporting module | querySelector | `.yt-lockup-view-model-wiz__metadata` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:50` | supporting module | querySelectorAll | `ytd-vertical-watch-card-list-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:54` | supporting module | closest | `ytd-universal-watch-card-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:65` | supporting module | querySelector | `ytd-browse[page-subtype="channels"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:68` | supporting module | querySelector | `ytd-search` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:74` | supporting module | querySelectorAll | `ytd-browse[page-subtype="channels"] #contents.ytd-rich-grid-renderer, ' + 'ytd-browse[role="main"] #contents.ytd-rich-grid-renderer, ' + 'ytd-browse #contents.ytd-rich-grid-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:93` | supporting module | querySelectorAll | `.filter-tube-visible` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:103` | supporting module | closest | `ytd-rich-grid-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:110` | supporting module | querySelectorAll | `ytd-rich-grid-row-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:121` | supporting module | querySelectorAll | `ytd-search #contents.ytd-section-list-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:128` | supporting module | querySelectorAll | `ytd-video-renderer.filter-tube-visible, ytd-channel-renderer.filter-tube-visible` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:138` | supporting module | querySelector | `#dismissible` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:146` | supporting module | querySelector | `ytd-thumbnail` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:156` | supporting module | querySelector | `.text-wrapper, #meta` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:167` | supporting module | querySelectorAll | `ytd-reel-item-renderer.filter-tube-visible, ytd-reel-video-renderer.filter-tube-visible` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:174` | supporting module | querySelector | `ytd-thumbnail` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:185` | supporting module | querySelectorAll | `ytd-watch-card-compact-video-renderer.filter-tube-visible` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:196` | supporting module | querySelector | `ytd-thumbnail` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:206` | supporting module | querySelector | `a` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:213` | supporting module | querySelector | `yt-image` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:220` | supporting module | querySelector | `img` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:229` | supporting module | querySelector | `ytd-thumbnail-overlay-time-status-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:236` | supporting module | querySelector | `.text-wrapper` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:246` | supporting module | querySelectorAll | `ytd-universal-watch-card-renderer.filter-tube-visible` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:255` | supporting module | querySelector | `ytd-watch-card-rich-header-renderer.filter-tube-visible` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:262` | supporting module | querySelector | `#container` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:270` | supporting module | querySelector | `#body` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:277` | supporting module | querySelector | `ytd-vertical-watch-card-list-renderer.filter-tube-visible` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:284` | supporting module | querySelector | `#items` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:292` | supporting module | querySelector | `ytd-watch-card-section-sequence-renderer.filter-tube-visible` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:299` | supporting module | querySelector | `#lists` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:307` | supporting module | querySelector | `ytd-watch-card-hero-video-renderer.filter-tube-visible` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:310` | supporting module | querySelector | `.title-container` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:317` | supporting module | querySelector | `#watch-card-title` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:335` | supporting module | querySelectorAll | `ytd-reel-shelf-renderer.filter-tube-visible` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:339` | supporting module | querySelector | `yt-horizontal-list-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:346` | supporting module | querySelector | `#items` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:364` | supporting module | querySelector | `#scroll-container` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:370` | supporting module | querySelector | `#left-arrow` | FilterTube-owned DOM; lower external drift risk |
| `js/layout.js:371` | supporting module | querySelector | `#right-arrow` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:393` | supporting module | querySelector | `#contents` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:400` | supporting module | querySelectorAll | `ytm-shorts-lockup-view-model-v2.filter-tube-visible, ' + 'ytm-shorts-lockup-view-model.filter-tube-visible, ' + '.shortsLockupViewModelHost.filter-tube-visible` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:414` | supporting module | querySelector | `.shortsLockupViewModelHostThumbnailContainer, ' + '.shortsLockupViewModelHostThumbnailContainerRounded` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:428` | supporting module | querySelector | `img` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:437` | supporting module | querySelector | `.shortsLockupViewModelHostOutsideMetadata, ' + '.shortsLockupViewModelHostMetadataRounded` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:449` | supporting module | querySelector | `.shortsLockupViewModelHostMetadataTitle` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:450` | supporting module | querySelector | `.shortsLockupViewModelHostMetadataSubhead` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:476` | supporting module | querySelectorAll | `ytd-rich-section-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:480` | supporting module | querySelector | `ytd-rich-shelf-renderer[is-shorts]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:496` | supporting module | querySelector | `#contents` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:509` | supporting module | querySelectorAll | `ytd-rich-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:522` | supporting module | querySelector | `.shortsLockupViewModelHost, ytm-shorts-lockup-view-model-v2, ytm-shorts-lockup-view-model` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:531` | supporting module | querySelector | `.shortsLockupViewModelHostThumbnailContainer, ' + '.shortsLockupViewModelHostThumbnailContainerRounded, ' + '.shortsLockupViewModelHostThumbnailContainerAspectRatioTwoByThree` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:547` | supporting module | querySelector | `img` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:559` | supporting module | querySelector | `.shortsLockupViewModelHostOutsideMetadata, ' + '.shortsLockupViewModelHostMetadataRounded` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:575` | supporting module | querySelectorAll | `ytd-rich-shelf-renderer[is-shorts]:not([hidden])` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:578` | supporting module | closest | `ytd-rich-section-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:590` | supporting module | querySelector | `#contents` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/layout.js:603` | supporting module | querySelectorAll | `ytd-rich-item-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:653` | supporting module | querySelectorAll | `ytd-video-renderer:not(.filter-tube-visible), ytd-grid-video-renderer:not(.filter-tube-visible), ytd-rich-item-renderer:not(.filter-tube-visible), ytd-compact-video-renderer:not(.filter-tube-visible), ytd-radio-renderer:...` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/layout.js:672` | supporting module | querySelectorAll | `ytd-browse #contents.ytd-rich-grid-renderer` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/popup.js:440` | extension UI | closest | `.toggle-row` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/popup.js:441` | extension UI | closest | `.toggle-row` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/popup.js:442` | extension UI | closest | `.toggle-row` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/popup.js:446` | extension UI | closest | `.toggle-row` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/popup.js:447` | extension UI | closest | `.toggle-row` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/popup.js:448` | extension UI | closest | `.toggle-row` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/popup.js:633` | extension UI | querySelectorAll | `input[type="checkbox"][data-ft-setting]` | FilterTube-owned DOM; lower external drift risk |
| `js/popup.js:639` | extension UI | querySelectorAll | `[data-ft-control-group]` | FilterTube-owned DOM; lower external drift risk |
| `js/popup.js:651` | extension UI | querySelectorAll | `.toggle-row` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/popup.js:653` | extension UI | querySelector | `input[type="checkbox"][data-ft-setting]` | FilterTube-owned DOM; lower external drift risk |
| `js/popup.js:664` | extension UI | querySelectorAll | `.toggle-row` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/popup.js:1295` | extension UI | querySelector | `.app-container` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/popup.js:1296` | extension UI | querySelector | `.app-header` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/popup.js:1297` | extension UI | querySelector | `.app-content` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/popup.js:1601` | extension UI | querySelectorAll | `[data-ft-control-group]` | FilterTube-owned DOM; lower external drift risk |
| `js/popup.js:1606` | extension UI | querySelectorAll | `[data-ft-control-row]` | FilterTube-owned DOM; lower external drift risk |
| `js/tab-view.js:900` | extension UI | closest | `.ft-select-menu` | FilterTube-owned DOM; lower external drift risk |
| `js/tab-view.js:919` | extension UI | querySelectorAll | `input[name="videoFilter_duration_condition"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:921` | extension UI | closest | `.video-filter-compact-option` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:922` | extension UI | querySelectorAll | `input[type="number"], select` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/tab-view.js:926` | extension UI | querySelectorAll | `input[name="videoFilter_uploadDate_condition"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:928` | extension UI | closest | `.video-filter-compact-option` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:929` | extension UI | querySelectorAll | `input[type="number"], select` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/tab-view.js:1025` | extension UI | querySelector | `.video-filter-compact-radio` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:1053` | extension UI | querySelector | `input[name="videoFilter_duration_condition"]:checked` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:1054` | extension UI | querySelector | `input[name="videoFilter_uploadDate_condition"]:checked` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:1244` | extension UI | querySelectorAll | `input[name="videoFilter_duration_condition"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:1250` | extension UI | querySelectorAll | `input[name="videoFilter_uploadDate_condition"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:1258` | extension UI | querySelectorAll | `.video-filter-compact-option` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:1261` | extension UI | closest | `label` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:1264` | extension UI | querySelector | `.video-filter-compact-radio` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:1273` | extension UI | querySelectorAll | `.video-filter-compact-option input[type="number"], .video-filter-compact-option select` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:1367` | extension UI | querySelectorAll | `.nav-item` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:2094` | extension UI | closest | `.ft-select-menu` | FilterTube-owned DOM; lower external drift risk |
| `js/tab-view.js:2104` | extension UI | querySelectorAll | `input[name="kidsVideoFilter_duration_condition"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:2106` | extension UI | closest | `.video-filter-compact-option` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:2107` | extension UI | querySelectorAll | `input[type="number"], select` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/tab-view.js:2111` | extension UI | querySelectorAll | `input[name="kidsVideoFilter_uploadDate_condition"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:2113` | extension UI | closest | `.video-filter-compact-option` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:2114` | extension UI | querySelectorAll | `input[type="number"], select` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/tab-view.js:2123` | extension UI | querySelector | `.video-filter-compact-radio` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:2161` | extension UI | querySelector | `input[name="kidsVideoFilter_duration_condition"]:checked` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:2162` | extension UI | querySelector | `input[name="kidsVideoFilter_uploadDate_condition"]:checked` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:2366` | extension UI | querySelectorAll | `[data-ft-control-group]` | FilterTube-owned DOM; lower external drift risk |
| `js/tab-view.js:2370` | extension UI | querySelectorAll | `[data-ft-control-row]` | FilterTube-owned DOM; lower external drift risk |
| `js/tab-view.js:2412` | extension UI | querySelectorAll | `input[name="kidsVideoFilter_duration_condition"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:2418` | extension UI | querySelectorAll | `input[name="kidsVideoFilter_uploadDate_condition"]` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:2425` | extension UI | querySelectorAll | `.video-filter-compact-option` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:2427` | extension UI | closest | `label` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:2430` | extension UI | querySelector | `.video-filter-compact-radio` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:2439` | extension UI | querySelectorAll | `.video-filter-compact-option input[type="number"], .video-filter-compact-option select` | YouTube DOM contract; requires fixture or documented fallback reason |
| `js/tab-view.js:2588` | extension UI | querySelector | `#filtersView .tab-buttons` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/tab-view.js:2588` | extension UI | querySelector | `.tab-buttons` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/tab-view.js:2589` | extension UI | querySelector | `[data-tab-id="keywords"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:2590` | extension UI | querySelector | `[data-tab-id="channels"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:2591` | extension UI | querySelector | `[data-tab-id="content"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:2625` | extension UI | querySelector | `#kidsView .tab-buttons` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/tab-view.js:2625` | extension UI | querySelector | `.tab-buttons` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/tab-view.js:2626` | extension UI | querySelector | `[data-tab-id="kidsContent"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:2801` | extension UI | querySelectorAll | `input[type="checkbox"][data-ft-setting]` | FilterTube-owned DOM; lower external drift risk |
| `js/tab-view.js:2804` | extension UI | querySelectorAll | `input[type="checkbox"][data-ft-setting]` | FilterTube-owned DOM; lower external drift risk |
| `js/tab-view.js:2856` | extension UI | querySelector | `.nanah-sync-actions` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:2919` | extension UI | closest | `.card` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:3718` | extension UI | querySelector | `.main-content` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:4340` | extension UI | querySelector | `.nav-item.active` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:5032` | extension UI | querySelectorAll | `.nav-item` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:5047` | extension UI | querySelector | `.nav-item.active` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:5067` | extension UI | querySelector | `.view-container` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:9459` | extension UI | querySelector | `.nav-item[data-tab="sync"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:10500` | extension UI | querySelector | `.nav-item.active` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:10687` | extension UI | closest | `#kidsView` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:10698` | extension UI | querySelectorAll | `[data-ft-control-group]` | FilterTube-owned DOM; lower external drift risk |
| `js/tab-view.js:10703` | extension UI | querySelectorAll | `[data-ft-control-row]` | FilterTube-owned DOM; lower external drift risk |
| `js/tab-view.js:10723` | extension UI | querySelectorAll | `.card` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:11409` | extension UI | closest | `#kidsView` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:11453` | extension UI | querySelector | `.tab-buttons` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/tab-view.js:11454` | extension UI | querySelector | `[data-tab-id="keywords"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:11463` | extension UI | querySelector | `.tab-buttons` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/tab-view.js:11464` | extension UI | querySelector | `[data-tab-id="channels"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:11473` | extension UI | querySelector | `.tab-buttons` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/tab-view.js:11474` | extension UI | querySelector | `[data-tab-id="content"]` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:11498` | extension UI | querySelectorAll | `.nav-item` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:11499` | extension UI | querySelectorAll | `.view-section` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/tab-view.js:11501` | extension UI | querySelector | `.view-container` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/ui_components.js:288` | supporting module | querySelectorAll | `.tab-button` | generic interactive selector; verify scope to avoid hijacking YouTube UI |
| `js/ui_components.js:295` | supporting module | querySelectorAll | `.tab-pane` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/ui_components.js:476` | supporting module | closest | `.ft-select-menu` | FilterTube-owned DOM; lower external drift risk |
| `js/ui_components.js:650` | supporting module | closest | `.sort-controls, .date-range-controls, .toggle-row, .import-export-actions, .actions` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/ui_components.js:654` | supporting module | querySelector | `.label, .toggle-title` | generic DOM selector; verify caller scope and no broad scan in no-rule state |
| `js/ui_components.js:942` | supporting module | querySelectorAll | `.ft-toast` | FilterTube-owned DOM; lower external drift risk |

## Interpretation

- A selector row does not prove a bug. It proves a dependency on either YouTube DOM shape or FilterTube-owned UI shape. YouTube DOM selectors need fixtures or explicit fallback-only status.
- A lifecycle marker row does not prove a leak. It proves a start/stop budget must exist. Page-resident observers, timers, RAF loops, and network hooks need active gates before they run on an empty install.
- Side-effect rows (`style.display`, `classList`, media calls, synthetic clicks) need structured hide/action reasons and symmetric restore proof.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
