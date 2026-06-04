# FilterTube Lifecycle Teardown Audit - 2026-05-17

Generated static artifact for runtime lifecycle starts and cleanup markers. This does not prove a leak by itself; it identifies every observer/listener/timer/RAF family that needs active-gate, pause, and teardown counters before optimization.

## Summary

- Files with lifecycle markers: 21
- Total lifecycle marker rows: 496
- Page-resident marker rows: 212

| File | Family | Page-resident | Total | add/remove listeners | observers/disconnects | intervals/clears | timeouts/clears | RAF/cancel |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `js/tab-view.js` | dashboard UI | no | 180 | 147/0 | 0/0 | 1/1 | 14/4 | 11/2 |
| `js/content_bridge.js` | content bridge runtime | yes | 100 | 23/1 | 8/5 | 1/1 | 35/10 | 8/0 |
| `js/content/block_channel.js` | quick block / 3-dot affordance | yes | 64 | 34/0 | 6/2 | 1/0 | 11/1 | 3/0 |
| `js/popup.js` | popup UI | no | 33 | 30/0 | 0/0 | 0/0 | 2/0 | 1/0 |
| `js/ui_components.js` | extension support/UI | no | 27 | 17/0 | 1/0 | 0/0 | 3/0 | 4/1 |
| `js/background.js` | background service worker | no | 14 | 0/0 | 0/0 | 0/0 | 10/4 | 0/0 |
| `js/content/dom_fallback.js` | DOM fallback enforcement | yes | 13 | 3/0 | 0/0 | 0/0 | 10/0 | 0/0 |
| `js/injector.js` | page injector/main-world bridge | yes | 12 | 2/0 | 0/0 | 1/2 | 5/2 | 0/0 |
| `js/content/bridge_settings.js` | runtime settings bridge | yes | 10 | 2/0 | 0/0 | 0/0 | 6/2 | 0/0 |
| `js/render_engine.js` | extension support/UI | no | 10 | 7/0 | 0/0 | 0/0 | 1/1 | 0/0 |
| `js/content/collab_dialog.js` | page-resident support | yes | 9 | 3/0 | 1/0 | 0/0 | 2/2 | 0/0 |
| `js/state_manager.js` | dashboard state manager | no | 6 | 0/0 | 0/0 | 0/0 | 6/0 | 0/0 |
| `js/content/first_run_prompt.js` | extension support/UI | no | 3 | 1/0 | 0/0 | 0/0 | 2/0 | 0/0 |
| `js/io_manager.js` | extension support/UI | no | 3 | 0/0 | 0/0 | 0/0 | 2/1 | 0/0 |
| `js/content/bridge_injection.js` | page-resident support | yes | 2 | 0/0 | 0/0 | 0/0 | 2/0 | 0/0 |
| `js/content/release_notes_prompt.js` | extension support/UI | no | 2 | 1/0 | 0/0 | 0/0 | 1/0 | 0/0 |
| `js/filter_logic.js` | extension support/UI | no | 2 | 0/0 | 0/0 | 0/0 | 2/0 | 0/0 |
| `js/ui-shell/popup-shell.js` | popup UI | no | 2 | 1/1 | 0/0 | 0/0 | 0/0 | 0/0 |
| `js/ui-shell/tab-view-decor.js` | dashboard UI | no | 2 | 1/1 | 0/0 | 0/0 | 0/0 | 0/0 |
| `js/content/handle_resolver.js` | page-resident support | yes | 1 | 0/0 | 0/0 | 0/0 | 1/0 | 0/0 |
| `js/seed.js` | seed network interception | yes | 1 | 0/0 | 0/0 | 0/0 | 1/0 | 0/0 |

## High-Risk Lifecycle Families

| Family | Evidence | Why it matters | Required proof gate |
| --- | --- | --- | --- |
| Seed fetch/XHR interception | `js/seed.js` patches fetch/XHR and wraps XHR event listeners. | Runs in page/main world and can parse/rewrite network responses before no-rule work is decided. | Endpoint decision counters proving pass-through/no-parse/no-rewrite for inactive states. |
| Content bridge prefetch observers | `js/content_bridge.js` has IntersectionObserver, MutationObservers, scroll/visibility listeners, and map-write timers. | Can keep identity harvest and map churn alive even when no rules or visible affordances need it. | activeRuntimeReport gate plus map-write counters and teardown on navigation/disable. |
| DOM fallback observer | `js/content_bridge.js` installs a body MutationObserver around DOM fallback; `js/content/dom_fallback.js` also installs delegated listeners. | Broad scans/hides can run due to lifecycle install even when lower fallback has no work. | No-rule fixture proving no observer callback work, no hide writes, no pending whitelist hides. |
| Quick block / menu observers | `js/content/block_channel.js` has document/window listeners, MutationObservers, interval sweep, dropdown observers, and Kids passive listener. Source fixtures now prove quick-block lifecycle installs before feature-enabled checks. | Visible affordance disabled or whitelist mode may still leave page listeners/timers active. | Feature-visible gate plus teardown/pause counters for quick button, menu, fallback, Kids passive listener. |
| Dashboard UI mutation listeners | `js/tab-view.js` has many listeners/timers around profile/list/sync/import controls. | Not YouTube page-load cost, but high settings-authority risk. | Mutation intent and save/revision fixtures rather than page-runtime optimization. |

## Page-Resident Lifecycle Ledger

| File:line | Family | Marker | Code excerpt | Required proof gate |
| --- | --- | --- | --- | --- |
| `js/content_bridge.js:541` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:562` | content bridge runtime | setTimeout | `const schedule = () => setTimeout(resolve, Math.max(0, delayMs));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:564` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(schedule);` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:977` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:1006` | content bridge runtime | observe | `prefetchObserver.observe(card);` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:1015` | content bridge runtime | IntersectionObserver:new | `prefetchObserver = new IntersectionObserver((entries) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:1026` | content bridge runtime | addEventListener | `document.addEventListener('visibilitychange', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:1050` | content bridge runtime | addEventListener | `document.addEventListener('scroll', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:1058` | content bridge runtime | MutationObserver:new | `const observer = new MutationObserver(() => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:1065` | content bridge runtime | observe | `observer.observe(panel, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:1071` | content bridge runtime | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:1073` | content bridge runtime | disconnect | `observer.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:1096` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:1103` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:1112` | content bridge runtime | MutationObserver:new | `const observer = new MutationObserver(() => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:1122` | content bridge runtime | observe | `observer.observe(rail, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:1130` | content bridge runtime | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:1132` | content bridge runtime | disconnect | `observer.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:1140` | content bridge runtime | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:1214` | content bridge runtime | setTimeout | `new Promise((resolve) => setTimeout(() => resolve(null), ms))` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:1311` | content bridge runtime | setTimeout | `state.timer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:1543` | content bridge runtime | clearTimeout | `clearTimeout(pendingVideoMetaDomRerunTimer);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:1545` | content bridge runtime | setTimeout | `pendingVideoMetaDomRerunTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:1934` | content bridge runtime | setTimeout | `const timerId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:1950` | content bridge runtime | clearTimeout | `clearTimeout(timerId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:2125` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:2140` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => refreshMultiStepSelections(groupId));` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:3159` | content bridge runtime | setTimeout | `entry.expiryTimeout = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:3182` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:3383` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:3477` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5156` | content bridge runtime | setTimeout | `const timeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5183` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5188` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5203` | content bridge runtime | setTimeout | `const timeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5228` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5233` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5250` | content bridge runtime | setTimeout | `const armTimeout = () => setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5523` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:5576` | content bridge runtime | clearTimeout | `clearTimeout(pending.timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:5600` | content bridge runtime | clearTimeout | `clearTimeout(pending.timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:5601` | content bridge runtime | setTimeout | `pending.timeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5619` | content bridge runtime | clearTimeout | `clearTimeout(pending.timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:5668` | content bridge runtime | clearTimeout | `clearTimeout(pending.timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:5718` | content bridge runtime | setTimeout | `await new Promise(resolve => setTimeout(resolve, 1000));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5747` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:5755` | content bridge runtime | setTimeout | `pendingImmediateFallbackTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5787` | content bridge runtime | setTimeout | `whitelistPendingRefreshState.timer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5837` | content bridge runtime | setTimeout | `whitelistPendingRefreshState.pendingHideTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:6025` | content bridge runtime | MutationObserver:new | `const observer = new MutationObserver(mutations => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:6039` | content bridge runtime | observe | `observer.observe(target, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:6044` | content bridge runtime | addEventListener | `document.addEventListener('DOMContentLoaded', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:6423` | content bridge runtime | addEventListener | `btn.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:6551` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(runScan);` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:6552` | content bridge runtime | setTimeout | `setTimeout(runScan, 120);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:6563` | content bridge runtime | MutationObserver:new | `const observer = new MutationObserver(() => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:6571` | content bridge runtime | observe | `observer.observe(target, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:6576` | content bridge runtime | addEventListener | `document.addEventListener('DOMContentLoaded', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:6584` | content bridge runtime | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:6587` | content bridge runtime | addEventListener | `document.addEventListener('click', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:6590` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:6598` | content bridge runtime | addEventListener | `window.addEventListener('scroll', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:6601` | content bridge runtime | clearTimeout | `clearTimeout(pendingScrollRescanTimer);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:6607` | content bridge runtime | clearTimeout | `clearTimeout(pendingScrollRescanTimer);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:6609` | content bridge runtime | setTimeout | `pendingScrollRescanTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:6616` | content bridge runtime | setInterval | `const warmupTimer = setInterval(() => {` | interval; requires clear path or documented bounded lifetime |
| `js/content_bridge.js:6622` | content bridge runtime | clearInterval | `clearInterval(warmupTimer);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:6636` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:6675` | content bridge runtime | disconnect | `playlistFallbackPopoverState.rowObserver.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:6681` | content bridge runtime | removeEventListener | `document.removeEventListener('click', playlistFallbackPopoverState.onDocClick, true);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:6828` | content bridge runtime | addEventListener | `toggle.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:7064` | content bridge runtime | setTimeout | `await new Promise(resolve => setTimeout(resolve, 85));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:7068` | content bridge runtime | addEventListener | `item.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:7081` | content bridge runtime | addEventListener | `item.addEventListener('keydown', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:7215` | content bridge runtime | MutationObserver:new | `const observer = new MutationObserver((mutations) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:7231` | content bridge runtime | observe | `observer.observe(row, {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:7259` | content bridge runtime | addEventListener | `document.addEventListener('click', playlistFallbackPopoverState.onDocClick, true);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content_bridge.js:7322` | content bridge runtime | clearTimeout | `if (timeoutId) clearTimeout(timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:7323` | content bridge runtime | setTimeout | `timeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:10318` | content bridge runtime | disconnect | `if (observer) observer.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:10319` | content bridge runtime | disconnect | `if (closeObserver) closeObserver.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:10320` | content bridge runtime | clearTimeout | `if (timeoutId) clearTimeout(timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:10368` | content bridge runtime | MutationObserver:new | `observer = new MutationObserver(() => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:10383` | content bridge runtime | observe | `observer.observe(dropdown, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:10385` | content bridge runtime | MutationObserver:new | `closeObserver = new MutationObserver(() => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:10392` | content bridge runtime | observe | `closeObserver.observe(dropdown, { attributes: true, attributeFilter: ['style', 'aria-hidden', 'hidden'] });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:10395` | content bridge runtime | setTimeout | `timeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:10891` | content bridge runtime | addEventListener | `menuItem.addEventListener('click', handleInteraction, { capture: true });` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content_bridge.js:10892` | content bridge runtime | addEventListener | `menuItem.addEventListener('keydown', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:11056` | content bridge runtime | addEventListener | `toggle.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:11212` | content bridge runtime | addEventListener | `toggle.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:11303` | content bridge runtime | addEventListener | `toggle.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:11969` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:12591` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:12722` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:12761` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:12884` | content bridge runtime | addEventListener | `checkbox.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:12891` | content bridge runtime | addEventListener | `checkbox.addEventListener('change', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:12917` | content bridge runtime | addEventListener | `window.addEventListener('message', handleMainWorldMessages, false);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content_bridge.js:12919` | content bridge runtime | setTimeout | `setTimeout(() => initialize(), 50);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:686` | quick block / 3-dot affordance | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content/block_channel.js:713` | quick block / 3-dot affordance | clearTimeout | `clearTimeout(hostCard.__filtertubeQuickHoverTimer);` | cleanup marker / supporting lifecycle marker |
| `js/content/block_channel.js:726` | quick block / 3-dot affordance | setTimeout | `hostCard.__filtertubeQuickHoverTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:747` | quick block / 3-dot affordance | setTimeout | `hostCard.__filtertubeQuickHoverTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1261` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => applyDOMFallback(null, { preserveScroll: true }), 120);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1279` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('mouseenter', activate, { passive: true });` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1280` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('mouseleave', release, { passive: true });` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1281` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('pointerenter', activate, { passive: true });` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1282` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('pointerleave', release, { passive: true });` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1283` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('focusin', activate);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1284` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('focusout', release);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1335` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('mouseenter', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1338` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('mouseleave', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1341` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('pointerenter', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1344` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('pointerleave', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1347` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('focusin', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1350` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('focusout', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1356` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('mouseenter', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1359` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('mouseleave', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1362` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('pointerenter', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1365` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('pointerleave', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1368` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('focusin', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1371` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('focusout', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1406` | quick block / 3-dot affordance | addEventListener | `trigger.addEventListener('click', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1413` | quick block / 3-dot affordance | addEventListener | `trigger.addEventListener('mouseenter', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1416` | quick block / 3-dot affordance | addEventListener | `trigger.addEventListener('mouseleave', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1424` | quick block / 3-dot affordance | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content/block_channel.js:1448` | quick block / 3-dot affordance | setTimeout | `quickBlockSweepTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1463` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('focusin', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1467` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('focusout', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1468` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1473` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('input', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1477` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('click', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1478` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1483` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('scroll', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1486` | quick block / 3-dot affordance | addEventListener | `window.addEventListener('resize', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1489` | quick block / 3-dot affordance | addEventListener | `window.addEventListener('orientationchange', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1493` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('pointerenter', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1612` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('pointermove', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1619` | quick block / 3-dot affordance | requestAnimationFrame | `requestAnimationFrame(tick);` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content/block_channel.js:1624` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('mouseleave', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1629` | quick block / 3-dot affordance | MutationObserver:new | `const observer = new MutationObserver((mutations) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1685` | quick block / 3-dot affordance | observe | `observer.observe(document.body, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1687` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | route sweep listener; requires active gate or documented bounded lifetime |
| `js/content/block_channel.js:1696` | quick block / 3-dot affordance | addEventListener | `window.addEventListener('DOMContentLoaded', boot, { once: true });` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1676` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1696` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1704` | quick block / 3-dot affordance | MutationObserver:new | `const obs = new MutationObserver(() => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1729` | quick block / 3-dot affordance | observe | `obs.observe(dropdown, { attributes: true, attributeFilter: ['style', 'aria-hidden', 'hidden'] });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1737` | quick block / 3-dot affordance | setTimeout | `setTimeout(startObserver, 100);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1747` | quick block / 3-dot affordance | MutationObserver:new | `const observer = new MutationObserver((mutations) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1782` | quick block / 3-dot affordance | observe | `observer.observe(document.body, {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1798` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1818` | quick block / 3-dot affordance | setTimeout | `if (!document.body) return void setTimeout(waitBody, 100);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1819` | quick block / 3-dot affordance | MutationObserver:new | `const observer = new MutationObserver((mutations) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1838` | quick block / 3-dot affordance | observe | `observer.observe(document.body, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:2024` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => handledKidsBlockActions.delete(dedupKey), 10000);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:2293` | quick block / 3-dot affordance | MutationObserver:new | `const observer = new MutationObserver((mutations) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:2300` | quick block / 3-dot affordance | disconnect | `observer.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content/block_channel.js:2307` | quick block / 3-dot affordance | observe | `observer.observe(videoCard.parentElement, { childList: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:2311` | quick block / 3-dot affordance | MutationObserver:new | `const dropdownObserver = new MutationObserver((mutations) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:2322` | quick block / 3-dot affordance | disconnect | `dropdownObserver.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content/block_channel.js:2327` | quick block / 3-dot affordance | observe | `dropdownObserver.observe(dropdown, { attributes: true, attributeFilter: ['aria-hidden'] });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:2359` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_injection.js:64` | page-resident support | setTimeout | `setTimeout(injectNext, 50);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_injection.js:96` | page-resident support | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_settings.js:77` | runtime settings bridge | setTimeout | `setTimeout(() => finish(false), Math.max(250, timeoutMs));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_settings.js:100` | runtime settings bridge | setTimeout | `setTimeout(() => finish(false), Math.max(250, timeoutMs));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_settings.js:112` | runtime settings bridge | setTimeout | `const armTimeout = () => setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_settings.js:148` | runtime settings bridge | addEventListener | `window.addEventListener('message', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/bridge_settings.js:168` | runtime settings bridge | clearTimeout | `clearTimeout(pending.timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content/bridge_settings.js:169` | runtime settings bridge | setTimeout | `pending.timeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_settings.js:190` | runtime settings bridge | clearTimeout | `clearTimeout(pending.timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content/bridge_settings.js:484` | runtime settings bridge | addEventListener | `window.addEventListener('filterTubeSeedReady', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/bridge_settings.js:492` | runtime settings bridge | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_settings.js:536` | runtime settings bridge | setTimeout | `pendingStorageRefreshTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/collab_dialog.js:32` | page-resident support | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/collab_dialog.js:53` | page-resident support | clearTimeout | `clearTimeout(pendingCollabDialogTriggerTimeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content/collab_dialog.js:55` | page-resident support | setTimeout | `pendingCollabDialogTriggerTimeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/collab_dialog.js:78` | page-resident support | addEventListener | `document.addEventListener('click', handlePotentialCollabTrigger, true);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/collab_dialog.js:79` | page-resident support | addEventListener | `document.addEventListener('keydown', handlePotentialCollabTriggerKeydown, true);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/collab_dialog.js:200` | page-resident support | clearTimeout | `clearTimeout(entry.expiryTimeout);` | cleanup marker / supporting lifecycle marker |
| `js/content/collab_dialog.js:310` | page-resident support | MutationObserver:new | `collabDialogObserver = new MutationObserver(mutations => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/collab_dialog.js:326` | page-resident support | observe | `collabDialogObserver.observe(document.documentElement \|\| document.body, {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/collab_dialog.js:333` | page-resident support | addEventListener | `document.addEventListener('DOMContentLoaded', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/dom_fallback.js:873` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:883` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:902` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:915` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:2056` | DOM fallback enforcement | setTimeout | `const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:2105` | DOM fallback enforcement | addEventListener | `window.addEventListener('scroll', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/dom_fallback.js:2339` | DOM fallback enforcement | addEventListener | `document.addEventListener('click', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/dom_fallback.js:2403` | DOM fallback enforcement | addEventListener | `document.addEventListener('ended', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/dom_fallback.js:2432` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:3728` | DOM fallback enforcement | setTimeout | `pendingTimerState.timer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:3750` | DOM fallback enforcement | setTimeout | `pendingTimerState.timer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:3816` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:4530` | DOM fallback enforcement | setTimeout | `setTimeout(() => applyDOMFallback(runState.latestSettings, runState.latestOptions), 0);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/handle_resolver.js:138` | page-resident support | setTimeout | `pendingDomFallbackRerunTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/injector.js:72` | page injector/main-world bridge | addEventListener | `window.addEventListener('message', handleSubscriptionsImportBridgeMessage);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/injector.js:351` | page injector/main-world bridge | setTimeout | `return new Promise((resolve) => setTimeout(resolve, ms));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/injector.js:1418` | page injector/main-world bridge | setTimeout | `? setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/injector.js:1437` | page injector/main-world bridge | clearTimeout | `clearTimeout(abortTimer);` | cleanup marker / supporting lifecycle marker |
| `js/injector.js:1475` | page injector/main-world bridge | clearTimeout | `clearTimeout(abortTimer);` | cleanup marker / supporting lifecycle marker |
| `js/injector.js:1873` | page injector/main-world bridge | addEventListener | `window.addEventListener('message', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/injector.js:3345` | page injector/main-world bridge | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/injector.js:3433` | page injector/main-world bridge | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/injector.js:3503` | page injector/main-world bridge | setInterval | `const engineCheckInterval = setInterval(() => {` | interval; requires clear path or documented bounded lifetime |
| `js/injector.js:3506` | page injector/main-world bridge | clearInterval | `clearInterval(engineCheckInterval);` | cleanup marker / supporting lifecycle marker |
| `js/injector.js:3527` | page injector/main-world bridge | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/injector.js:3528` | page injector/main-world bridge | clearInterval | `clearInterval(engineCheckInterval);` | cleanup marker / supporting lifecycle marker |
| `js/seed.js:131` | seed network interception | setTimeout | `replayTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |

## Full Lifecycle Ledger

| File:line | Family | Marker | Code excerpt | Required proof gate |
| --- | --- | --- | --- | --- |
| `js/background.js:727` | background service worker | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/background.js:884` | background service worker | clearTimeout | `clearTimeout(autoBackupTimer);` | cleanup marker / supporting lifecycle marker |
| `js/background.js:887` | background service worker | setTimeout | `autoBackupTimer = setTimeout(async () => {` | timeout; verify bounded lifetime |
| `js/background.js:918` | background service worker | setTimeout | `new Promise(resolve => setTimeout(resolve, timeoutMs))` | timeout; verify bounded lifetime |
| `js/background.js:1150` | background service worker | setTimeout | `.then(() => new Promise(resolve => setTimeout(resolve, delayMs)))` | timeout; verify bounded lifetime |
| `js/background.js:1489` | background service worker | setTimeout | `channelMapFlushTimer = setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/background.js:1634` | background service worker | setTimeout | `videoChannelMapFlushTimer = setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/background.js:1642` | background service worker | setTimeout | `videoMetaMapFlushTimer = setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/background.js:2887` | background service worker | setTimeout | `const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS);` | timeout; verify bounded lifetime |
| `js/background.js:2940` | background service worker | clearTimeout | `clearTimeout(timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/background.js:3003` | background service worker | setTimeout | `const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS);` | timeout; verify bounded lifetime |
| `js/background.js:3056` | background service worker | clearTimeout | `clearTimeout(timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/background.js:3096` | background service worker | setTimeout | `const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS);` | timeout; verify bounded lifetime |
| `js/background.js:3149` | background service worker | clearTimeout | `clearTimeout(timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:541` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:562` | content bridge runtime | setTimeout | `const schedule = () => setTimeout(resolve, Math.max(0, delayMs));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:564` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(schedule);` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:977` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:1006` | content bridge runtime | observe | `prefetchObserver.observe(card);` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:1015` | content bridge runtime | IntersectionObserver:new | `prefetchObserver = new IntersectionObserver((entries) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:1026` | content bridge runtime | addEventListener | `document.addEventListener('visibilitychange', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:1050` | content bridge runtime | addEventListener | `document.addEventListener('scroll', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:1058` | content bridge runtime | MutationObserver:new | `const observer = new MutationObserver(() => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:1065` | content bridge runtime | observe | `observer.observe(panel, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:1071` | content bridge runtime | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:1073` | content bridge runtime | disconnect | `observer.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:1096` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:1103` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:1112` | content bridge runtime | MutationObserver:new | `const observer = new MutationObserver(() => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:1122` | content bridge runtime | observe | `observer.observe(rail, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:1130` | content bridge runtime | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:1132` | content bridge runtime | disconnect | `observer.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:1140` | content bridge runtime | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:1214` | content bridge runtime | setTimeout | `new Promise((resolve) => setTimeout(() => resolve(null), ms))` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:1311` | content bridge runtime | setTimeout | `state.timer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:1543` | content bridge runtime | clearTimeout | `clearTimeout(pendingVideoMetaDomRerunTimer);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:1545` | content bridge runtime | setTimeout | `pendingVideoMetaDomRerunTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:1934` | content bridge runtime | setTimeout | `const timerId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:1950` | content bridge runtime | clearTimeout | `clearTimeout(timerId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:2125` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:2140` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => refreshMultiStepSelections(groupId));` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:3159` | content bridge runtime | setTimeout | `entry.expiryTimeout = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:3182` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:3383` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:3477` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5156` | content bridge runtime | setTimeout | `const timeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5183` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5188` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5203` | content bridge runtime | setTimeout | `const timeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5228` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5233` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5250` | content bridge runtime | setTimeout | `const armTimeout = () => setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5523` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:5576` | content bridge runtime | clearTimeout | `clearTimeout(pending.timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:5600` | content bridge runtime | clearTimeout | `clearTimeout(pending.timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:5601` | content bridge runtime | setTimeout | `pending.timeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5619` | content bridge runtime | clearTimeout | `clearTimeout(pending.timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:5668` | content bridge runtime | clearTimeout | `clearTimeout(pending.timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:5718` | content bridge runtime | setTimeout | `await new Promise(resolve => setTimeout(resolve, 1000));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5747` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:5755` | content bridge runtime | setTimeout | `pendingImmediateFallbackTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5787` | content bridge runtime | setTimeout | `whitelistPendingRefreshState.timer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:5837` | content bridge runtime | setTimeout | `whitelistPendingRefreshState.pendingHideTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:6025` | content bridge runtime | MutationObserver:new | `const observer = new MutationObserver(mutations => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:6039` | content bridge runtime | observe | `observer.observe(target, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:6044` | content bridge runtime | addEventListener | `document.addEventListener('DOMContentLoaded', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:6423` | content bridge runtime | addEventListener | `btn.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:6551` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(runScan);` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:6552` | content bridge runtime | setTimeout | `setTimeout(runScan, 120);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:6563` | content bridge runtime | MutationObserver:new | `const observer = new MutationObserver(() => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:6571` | content bridge runtime | observe | `observer.observe(target, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:6576` | content bridge runtime | addEventListener | `document.addEventListener('DOMContentLoaded', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:6584` | content bridge runtime | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:6587` | content bridge runtime | addEventListener | `document.addEventListener('click', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:6590` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:6598` | content bridge runtime | addEventListener | `window.addEventListener('scroll', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:6601` | content bridge runtime | clearTimeout | `clearTimeout(pendingScrollRescanTimer);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:6607` | content bridge runtime | clearTimeout | `clearTimeout(pendingScrollRescanTimer);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:6609` | content bridge runtime | setTimeout | `pendingScrollRescanTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:6616` | content bridge runtime | setInterval | `const warmupTimer = setInterval(() => {` | interval; requires clear path or documented bounded lifetime |
| `js/content_bridge.js:6622` | content bridge runtime | clearInterval | `clearInterval(warmupTimer);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:6636` | content bridge runtime | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content_bridge.js:6675` | content bridge runtime | disconnect | `playlistFallbackPopoverState.rowObserver.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:6681` | content bridge runtime | removeEventListener | `document.removeEventListener('click', playlistFallbackPopoverState.onDocClick, true);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:6828` | content bridge runtime | addEventListener | `toggle.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:7064` | content bridge runtime | setTimeout | `await new Promise(resolve => setTimeout(resolve, 85));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:7068` | content bridge runtime | addEventListener | `item.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:7081` | content bridge runtime | addEventListener | `item.addEventListener('keydown', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:7215` | content bridge runtime | MutationObserver:new | `const observer = new MutationObserver((mutations) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:7231` | content bridge runtime | observe | `observer.observe(row, {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:7259` | content bridge runtime | addEventListener | `document.addEventListener('click', playlistFallbackPopoverState.onDocClick, true);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content_bridge.js:7322` | content bridge runtime | clearTimeout | `if (timeoutId) clearTimeout(timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:7323` | content bridge runtime | setTimeout | `timeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:10318` | content bridge runtime | disconnect | `if (observer) observer.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:10319` | content bridge runtime | disconnect | `if (closeObserver) closeObserver.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:10320` | content bridge runtime | clearTimeout | `if (timeoutId) clearTimeout(timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content_bridge.js:10368` | content bridge runtime | MutationObserver:new | `observer = new MutationObserver(() => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:10383` | content bridge runtime | observe | `observer.observe(dropdown, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:10385` | content bridge runtime | MutationObserver:new | `closeObserver = new MutationObserver(() => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:10392` | content bridge runtime | observe | `closeObserver.observe(dropdown, { attributes: true, attributeFilter: ['style', 'aria-hidden', 'hidden'] });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content_bridge.js:10395` | content bridge runtime | setTimeout | `timeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:10891` | content bridge runtime | addEventListener | `menuItem.addEventListener('click', handleInteraction, { capture: true });` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content_bridge.js:10892` | content bridge runtime | addEventListener | `menuItem.addEventListener('keydown', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:11056` | content bridge runtime | addEventListener | `toggle.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:11212` | content bridge runtime | addEventListener | `toggle.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:11303` | content bridge runtime | addEventListener | `toggle.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:11969` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:12591` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:12722` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:12761` | content bridge runtime | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content_bridge.js:12884` | content bridge runtime | addEventListener | `checkbox.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:12891` | content bridge runtime | addEventListener | `checkbox.addEventListener('change', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content_bridge.js:12917` | content bridge runtime | addEventListener | `window.addEventListener('message', handleMainWorldMessages, false);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content_bridge.js:12919` | content bridge runtime | setTimeout | `setTimeout(() => initialize(), 50);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:686` | quick block / 3-dot affordance | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content/block_channel.js:713` | quick block / 3-dot affordance | clearTimeout | `clearTimeout(hostCard.__filtertubeQuickHoverTimer);` | cleanup marker / supporting lifecycle marker |
| `js/content/block_channel.js:726` | quick block / 3-dot affordance | setTimeout | `hostCard.__filtertubeQuickHoverTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:747` | quick block / 3-dot affordance | setTimeout | `hostCard.__filtertubeQuickHoverTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1261` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => applyDOMFallback(null, { preserveScroll: true }), 120);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1279` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('mouseenter', activate, { passive: true });` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1280` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('mouseleave', release, { passive: true });` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1281` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('pointerenter', activate, { passive: true });` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1282` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('pointerleave', release, { passive: true });` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1283` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('focusin', activate);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1284` | quick block / 3-dot affordance | addEventListener | `wrap.addEventListener('focusout', release);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1335` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('mouseenter', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1338` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('mouseleave', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1341` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('pointerenter', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1344` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('pointerleave', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1347` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('focusin', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1350` | quick block / 3-dot affordance | addEventListener | `hostCard.addEventListener('focusout', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1356` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('mouseenter', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1359` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('mouseleave', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1362` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('pointerenter', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1365` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('pointerleave', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1368` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('focusin', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1371` | quick block / 3-dot affordance | addEventListener | `anchor.addEventListener('focusout', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1406` | quick block / 3-dot affordance | addEventListener | `trigger.addEventListener('click', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1413` | quick block / 3-dot affordance | addEventListener | `trigger.addEventListener('mouseenter', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1416` | quick block / 3-dot affordance | addEventListener | `trigger.addEventListener('mouseleave', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1424` | quick block / 3-dot affordance | requestAnimationFrame | `requestAnimationFrame(() => {` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content/block_channel.js:1448` | quick block / 3-dot affordance | setTimeout | `quickBlockSweepTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1463` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('focusin', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1467` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('focusout', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1468` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1473` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('input', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1477` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('click', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1478` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1483` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('scroll', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1486` | quick block / 3-dot affordance | addEventListener | `window.addEventListener('resize', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1489` | quick block / 3-dot affordance | addEventListener | `window.addEventListener('orientationchange', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1493` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('pointerenter', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1612` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('pointermove', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1619` | quick block / 3-dot affordance | requestAnimationFrame | `requestAnimationFrame(tick);` | page-resident RAF; requires coalescing and pause under overlays/fullscreen |
| `js/content/block_channel.js:1624` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('mouseleave', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1629` | quick block / 3-dot affordance | MutationObserver:new | `const observer = new MutationObserver((mutations) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1685` | quick block / 3-dot affordance | observe | `observer.observe(document.body, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1687` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('yt-navigate-finish', () => {` | route sweep listener; requires active gate or documented bounded lifetime |
| `js/content/block_channel.js:1696` | quick block / 3-dot affordance | addEventListener | `window.addEventListener('DOMContentLoaded', boot, { once: true });` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/block_channel.js:1676` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1696` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1704` | quick block / 3-dot affordance | MutationObserver:new | `const obs = new MutationObserver(() => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1729` | quick block / 3-dot affordance | observe | `obs.observe(dropdown, { attributes: true, attributeFilter: ['style', 'aria-hidden', 'hidden'] });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1737` | quick block / 3-dot affordance | setTimeout | `setTimeout(startObserver, 100);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1747` | quick block / 3-dot affordance | MutationObserver:new | `const observer = new MutationObserver((mutations) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1782` | quick block / 3-dot affordance | observe | `observer.observe(document.body, {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1798` | quick block / 3-dot affordance | addEventListener | `document.addEventListener('click', (e) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/block_channel.js:1818` | quick block / 3-dot affordance | setTimeout | `if (!document.body) return void setTimeout(waitBody, 100);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:1819` | quick block / 3-dot affordance | MutationObserver:new | `const observer = new MutationObserver((mutations) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:1838` | quick block / 3-dot affordance | observe | `observer.observe(document.body, { childList: true, subtree: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:2024` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => handledKidsBlockActions.delete(dedupKey), 10000);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/block_channel.js:2293` | quick block / 3-dot affordance | MutationObserver:new | `const observer = new MutationObserver((mutations) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:2300` | quick block / 3-dot affordance | disconnect | `observer.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content/block_channel.js:2307` | quick block / 3-dot affordance | observe | `observer.observe(videoCard.parentElement, { childList: true });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:2311` | quick block / 3-dot affordance | MutationObserver:new | `const dropdownObserver = new MutationObserver((mutations) => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:2322` | quick block / 3-dot affordance | disconnect | `dropdownObserver.disconnect();` | cleanup marker / supporting lifecycle marker |
| `js/content/block_channel.js:2327` | quick block / 3-dot affordance | observe | `dropdownObserver.observe(dropdown, { attributes: true, attributeFilter: ['aria-hidden'] });` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/block_channel.js:2359` | quick block / 3-dot affordance | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_injection.js:64` | page-resident support | setTimeout | `setTimeout(injectNext, 50);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_injection.js:96` | page-resident support | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_settings.js:77` | runtime settings bridge | setTimeout | `setTimeout(() => finish(false), Math.max(250, timeoutMs));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_settings.js:100` | runtime settings bridge | setTimeout | `setTimeout(() => finish(false), Math.max(250, timeoutMs));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_settings.js:112` | runtime settings bridge | setTimeout | `const armTimeout = () => setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_settings.js:148` | runtime settings bridge | addEventListener | `window.addEventListener('message', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/bridge_settings.js:168` | runtime settings bridge | clearTimeout | `clearTimeout(pending.timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content/bridge_settings.js:169` | runtime settings bridge | setTimeout | `pending.timeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_settings.js:190` | runtime settings bridge | clearTimeout | `clearTimeout(pending.timeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content/bridge_settings.js:484` | runtime settings bridge | addEventListener | `window.addEventListener('filterTubeSeedReady', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/bridge_settings.js:492` | runtime settings bridge | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/bridge_settings.js:536` | runtime settings bridge | setTimeout | `pendingStorageRefreshTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/collab_dialog.js:32` | page-resident support | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/collab_dialog.js:53` | page-resident support | clearTimeout | `clearTimeout(pendingCollabDialogTriggerTimeoutId);` | cleanup marker / supporting lifecycle marker |
| `js/content/collab_dialog.js:55` | page-resident support | setTimeout | `pendingCollabDialogTriggerTimeoutId = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/collab_dialog.js:78` | page-resident support | addEventListener | `document.addEventListener('click', handlePotentialCollabTrigger, true);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/collab_dialog.js:79` | page-resident support | addEventListener | `document.addEventListener('keydown', handlePotentialCollabTriggerKeydown, true);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/content/collab_dialog.js:200` | page-resident support | clearTimeout | `clearTimeout(entry.expiryTimeout);` | cleanup marker / supporting lifecycle marker |
| `js/content/collab_dialog.js:310` | page-resident support | MutationObserver:new | `collabDialogObserver = new MutationObserver(mutations => {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/collab_dialog.js:326` | page-resident support | observe | `collabDialogObserver.observe(document.documentElement \|\| document.body, {` | page-resident observer; requires active gate, disconnect proof, and no-rule counter |
| `js/content/collab_dialog.js:333` | page-resident support | addEventListener | `document.addEventListener('DOMContentLoaded', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/dom_fallback.js:873` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:883` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:902` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:915` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:2056` | DOM fallback enforcement | setTimeout | `const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:2105` | DOM fallback enforcement | addEventListener | `window.addEventListener('scroll', () => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/dom_fallback.js:2339` | DOM fallback enforcement | addEventListener | `document.addEventListener('click', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/dom_fallback.js:2403` | DOM fallback enforcement | addEventListener | `document.addEventListener('ended', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/content/dom_fallback.js:2432` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:3728` | DOM fallback enforcement | setTimeout | `pendingTimerState.timer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:3750` | DOM fallback enforcement | setTimeout | `pendingTimerState.timer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:3816` | DOM fallback enforcement | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/dom_fallback.js:4530` | DOM fallback enforcement | setTimeout | `setTimeout(() => applyDOMFallback(runState.latestSettings, runState.latestOptions), 0);` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/first_run_prompt.js:122` | extension support/UI | setTimeout | `setTimeout(() => container.remove(), 180);` | timeout; verify bounded lifetime |
| `js/content/first_run_prompt.js:143` | extension support/UI | setTimeout | `setTimeout(() => container.remove(), 180);` | timeout; verify bounded lifetime |
| `js/content/first_run_prompt.js:183` | extension support/UI | addEventListener | `document.addEventListener('DOMContentLoaded', createPrompt, { once: true });` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/content/handle_resolver.js:138` | page-resident support | setTimeout | `pendingDomFallbackRerunTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/content/release_notes_prompt.js:62` | extension support/UI | setTimeout | `setTimeout(() => existing.remove(), 180);` | timeout; verify bounded lifetime |
| `js/content/release_notes_prompt.js:244` | extension support/UI | addEventListener | `document.addEventListener('DOMContentLoaded', ready, { once: true });` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/filter_logic.js:65` | extension support/UI | setTimeout | `pendingVideoChannelFlush = setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/filter_logic.js:126` | extension support/UI | setTimeout | `pendingVideoMetaFlush = setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/injector.js:72` | page injector/main-world bridge | addEventListener | `window.addEventListener('message', handleSubscriptionsImportBridgeMessage);` | page-resident listener; requires active gate and teardown/pause proof |
| `js/injector.js:351` | page injector/main-world bridge | setTimeout | `return new Promise((resolve) => setTimeout(resolve, ms));` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/injector.js:1418` | page injector/main-world bridge | setTimeout | `? setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/injector.js:1437` | page injector/main-world bridge | clearTimeout | `clearTimeout(abortTimer);` | cleanup marker / supporting lifecycle marker |
| `js/injector.js:1475` | page injector/main-world bridge | clearTimeout | `clearTimeout(abortTimer);` | cleanup marker / supporting lifecycle marker |
| `js/injector.js:1873` | page injector/main-world bridge | addEventListener | `window.addEventListener('message', (event) => {` | page-resident anonymous listener; requires explicit gate or documented lifetime |
| `js/injector.js:3345` | page injector/main-world bridge | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/injector.js:3433` | page injector/main-world bridge | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/injector.js:3503` | page injector/main-world bridge | setInterval | `const engineCheckInterval = setInterval(() => {` | interval; requires clear path or documented bounded lifetime |
| `js/injector.js:3506` | page injector/main-world bridge | clearInterval | `clearInterval(engineCheckInterval);` | cleanup marker / supporting lifecycle marker |
| `js/injector.js:3527` | page injector/main-world bridge | setTimeout | `setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/injector.js:3528` | page injector/main-world bridge | clearInterval | `clearInterval(engineCheckInterval);` | cleanup marker / supporting lifecycle marker |
| `js/io_manager.js:50` | extension support/UI | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/io_manager.js:1978` | extension support/UI | clearTimeout | `clearTimeout(backupScheduleTimer);` | cleanup marker / supporting lifecycle marker |
| `js/io_manager.js:1981` | extension support/UI | setTimeout | `backupScheduleTimer = setTimeout(async () => {` | timeout; verify bounded lifetime |
| `js/popup.js:505` | popup UI | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/popup.js:514` | popup UI | addEventListener | `durationEnabled?.addEventListener('change', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:518` | popup UI | addEventListener | `uploadEnabled?.addEventListener('change', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:522` | popup UI | addEventListener | `uppercaseEnabled?.addEventListener('change', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:526` | popup UI | addEventListener | `kidsDurationEnabled?.addEventListener('change', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:532` | popup UI | addEventListener | `kidsUploadEnabled?.addEventListener('change', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:538` | popup UI | addEventListener | `kidsUppercaseEnabled?.addEventListener('change', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:545` | popup UI | addEventListener | `manageInTab.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:609` | popup UI | addEventListener | `document.addEventListener('DOMContentLoaded', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:875` | popup UI | addEventListener | `toggle.addEventListener('click', handleModeToggle);` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:876` | popup UI | addEventListener | `toggle.addEventListener('keydown', (event) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1121` | popup UI | requestAnimationFrame | `requestAnimationFrame(() => positionProfileDropdown());` | RAF; verify cancel or bounded visual update |
| `js/popup.js:1188` | popup UI | addEventListener | `cancelBtn.addEventListener('click', () => closeWith(null));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1189` | popup UI | addEventListener | `okBtn.addEventListener('click', () => closeWith(input.value));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1191` | popup UI | addEventListener | `input.addEventListener('keydown', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1201` | popup UI | addEventListener | `overlay.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1216` | popup UI | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/popup.js:1347` | popup UI | addEventListener | `unlockBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1427` | popup UI | addEventListener | `btn.addEventListener('click', async (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1665` | popup UI | addEventListener | `ftProfileBadgeBtnPopup.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1671` | popup UI | addEventListener | `document.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1680` | popup UI | addEventListener | `document.addEventListener('keydown', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1692` | popup UI | addEventListener | `searchKeywordsPopup.addEventListener('input', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1699` | popup UI | addEventListener | `searchChannelsPopup.addEventListener('input', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1707` | popup UI | addEventListener | `searchContentControlsPopup.addEventListener('input', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1714` | popup UI | addEventListener | `addKeywordBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1729` | popup UI | addEventListener | `newKeywordInput.addEventListener('keypress', (event) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1738` | popup UI | addEventListener | `addChannelBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1771` | popup UI | addEventListener | `channelInput.addEventListener('keypress', (event) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1780` | popup UI | addEventListener | `el.addEventListener('change', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1793` | popup UI | addEventListener | `openInTabBtn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1831` | popup UI | addEventListener | `toggleEnabledBrandBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/popup.js:1834` | popup UI | addEventListener | `toggleEnabledBrandBtn.addEventListener('keydown', async (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/render_engine.js:20` | extension support/UI | requestIdleCallback | `return requestIdleCallback(cb, { timeout: 250 });` | cleanup marker / supporting lifecycle marker |
| `js/render_engine.js:22` | extension support/UI | setTimeout | `return setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 0);` | timeout; verify bounded lifetime |
| `js/render_engine.js:28` | extension support/UI | clearTimeout | `else clearTimeout(id);` | cleanup marker / supporting lifecycle marker |
| `js/render_engine.js:401` | extension support/UI | addEventListener | `toggle.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/render_engine.js:412` | extension support/UI | addEventListener | `toggle.addEventListener('keydown', async (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/render_engine.js:1036` | extension support/UI | addEventListener | `deleteBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/render_engine.js:1189` | extension support/UI | addEventListener | `toggle.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/render_engine.js:1340` | extension support/UI | addEventListener | `toggle.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/render_engine.js:1347` | extension support/UI | addEventListener | `toggle.addEventListener('keydown', async (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/render_engine.js:1370` | extension support/UI | addEventListener | `deleteBtn.addEventListener('click', onClick);` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/seed.js:131` | seed network interception | setTimeout | `replayTimer = setTimeout(() => {` | page-resident timeout; requires bounded retry/pending counter and no runaway loop |
| `js/state_manager.js:500` | dashboard state manager | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/state_manager.js:650` | dashboard state manager | setTimeout | `setTimeout(processChannelEnrichmentQueue, 0);` | timeout; verify bounded lifetime |
| `js/state_manager.js:690` | dashboard state manager | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/state_manager.js:1240` | dashboard state manager | setTimeout | `return new Promise((resolve) => setTimeout(resolve, ms));` | timeout; verify bounded lifetime |
| `js/state_manager.js:2322` | dashboard state manager | setTimeout | `setTimeout(runExternalReload, 0);` | timeout; verify bounded lifetime |
| `js/state_manager.js:2328` | dashboard state manager | setTimeout | `externalReloadTimer = setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/tab-view.js:32` | dashboard UI | addEventListener | `navToggle.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:37` | dashboard UI | addEventListener | `overlay.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:41` | dashboard UI | addEventListener | `window.addEventListener('resize', closeOnWide);` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:779` | dashboard UI | addEventListener | `pill.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:884` | dashboard UI | clearTimeout | `clearTimeout(timerRef);` | cleanup marker / supporting lifecycle marker |
| `js/tab-view.js:886` | dashboard UI | setTimeout | `const timer = setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/tab-view.js:1013` | dashboard UI | clearTimeout | `clearTimeout(pendingVideoFiltersSaveTimer);` | cleanup marker / supporting lifecycle marker |
| `js/tab-view.js:1015` | dashboard UI | setTimeout | `pendingVideoFiltersSaveTimer = setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/tab-view.js:1204` | dashboard UI | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/tab-view.js:1210` | dashboard UI | addEventListener | `durationEnabled?.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1214` | dashboard UI | addEventListener | `uploadEnabled?.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1218` | dashboard UI | addEventListener | `uppercaseEnabled?.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1222` | dashboard UI | addEventListener | `uppercaseMode?.addEventListener('change', () => scheduleSaveVideoFilters({ showToast: true }));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1228` | dashboard UI | addEventListener | `categoryMainEnabled?.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1232` | dashboard UI | addEventListener | `categoryMainMode?.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1236` | dashboard UI | addEventListener | `categoryMainSearch?.addEventListener('input', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1245` | dashboard UI | addEventListener | `radio?.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1251` | dashboard UI | addEventListener | `radio?.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1259` | dashboard UI | addEventListener | `option.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1274` | dashboard UI | addEventListener | `el.addEventListener('focus', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1279` | dashboard UI | addEventListener | `el.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1300` | dashboard UI | addEventListener | `el?.addEventListener('input', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1304` | dashboard UI | addEventListener | `el?.addEventListener('change', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:1369` | dashboard UI | addEventListener | `item.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2008` | dashboard UI | addEventListener | `pill.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2050` | dashboard UI | clearTimeout | `clearTimeout(pendingKidsCategorySaveTimer);` | cleanup marker / supporting lifecycle marker |
| `js/tab-view.js:2052` | dashboard UI | setTimeout | `pendingKidsCategorySaveTimer = setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/tab-view.js:2144` | dashboard UI | clearTimeout | `clearTimeout(pendingKidsSaveTimer);` | cleanup marker / supporting lifecycle marker |
| `js/tab-view.js:2146` | dashboard UI | setTimeout | `pendingKidsSaveTimer = setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/tab-view.js:2382` | dashboard UI | addEventListener | `kidsContentControlsSearch.addEventListener('input', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2386` | dashboard UI | addEventListener | `kidsDurationCheckbox.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2390` | dashboard UI | addEventListener | `kidsUploadDateCheckbox.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2394` | dashboard UI | addEventListener | `kidsUppercaseCheckbox.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2398` | dashboard UI | addEventListener | `kidsUppercaseModeSelect.addEventListener('change', () => scheduleSaveKidsVideoFilters({ showToast: true }));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2400` | dashboard UI | addEventListener | `kidsCategoryEnabled.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2404` | dashboard UI | addEventListener | `kidsCategoryMode.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2408` | dashboard UI | addEventListener | `kidsCategorySearch.addEventListener('input', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2413` | dashboard UI | addEventListener | `radio.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2419` | dashboard UI | addEventListener | `radio.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2426` | dashboard UI | addEventListener | `option.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2440` | dashboard UI | addEventListener | `el.addEventListener('focus', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2445` | dashboard UI | addEventListener | `el.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2450` | dashboard UI | addEventListener | `el.addEventListener('input', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2454` | dashboard UI | addEventListener | `el.addEventListener('change', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2606` | dashboard UI | requestAnimationFrame | `requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));` | RAF; verify cancel or bounded visual update |
| `js/tab-view.js:2612` | dashboard UI | requestAnimationFrame | `requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));` | RAF; verify cancel or bounded visual update |
| `js/tab-view.js:2618` | dashboard UI | requestAnimationFrame | `requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));` | RAF; verify cancel or bounded visual update |
| `js/tab-view.js:2634` | dashboard UI | requestAnimationFrame | `requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));` | RAF; verify cancel or bounded visual update |
| `js/tab-view.js:2643` | dashboard UI | requestAnimationFrame | `requestAnimationFrame(() => view.scrollIntoView({ behavior: 'smooth', block: 'start' }));` | RAF; verify cancel or bounded visual update |
| `js/tab-view.js:2757` | dashboard UI | addEventListener | `document.addEventListener('DOMContentLoaded', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2922` | dashboard UI | addEventListener | `openKofiBtn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:2937` | dashboard UI | addEventListener | `dashboardDonateBtn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:3125` | dashboard UI | setTimeout | `return new Promise((resolve) => setTimeout(resolve, ms));` | timeout; verify bounded lifetime |
| `js/tab-view.js:3647` | dashboard UI | cancelAnimationFrame | `cancelAnimationFrame(profileDropdownPositionRaf);` | cleanup marker / supporting lifecycle marker |
| `js/tab-view.js:3711` | dashboard UI | requestAnimationFrame | `profileDropdownPositionRaf = requestAnimationFrame(() => {` | RAF; verify cancel or bounded visual update |
| `js/tab-view.js:3754` | dashboard UI | requestAnimationFrame | `requestAnimationFrame(reset);` | RAF; verify cancel or bounded visual update |
| `js/tab-view.js:3763` | dashboard UI | cancelAnimationFrame | `cancelAnimationFrame(profileDropdownPositionRaf);` | cleanup marker / supporting lifecycle marker |
| `js/tab-view.js:3775` | dashboard UI | requestAnimationFrame | `requestAnimationFrame(() => {` | RAF; verify cancel or bounded visual update |
| `js/tab-view.js:3839` | dashboard UI | addEventListener | `btn.addEventListener('click', async (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:4372` | dashboard UI | addEventListener | `doneBtn.addEventListener('click', endManagedChildEdit);` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:5111` | dashboard UI | addEventListener | `unlockBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:5195` | dashboard UI | addEventListener | `cancelBtn.addEventListener('click', () => closeWith(null));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:5196` | dashboard UI | addEventListener | `okBtn.addEventListener('click', () => closeWith(input.value));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:5198` | dashboard UI | addEventListener | `input.addEventListener('keydown', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:5208` | dashboard UI | addEventListener | `overlay.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:5223` | dashboard UI | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/tab-view.js:5290` | dashboard UI | addEventListener | `cancelBtn.addEventListener('click', () => closeWith(null));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:5300` | dashboard UI | addEventListener | `btn.addEventListener('click', () => closeWith(choice.value));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:5304` | dashboard UI | requestAnimationFrame | `requestAnimationFrame(() => {` | RAF; verify cancel or bounded visual update |
| `js/tab-view.js:5313` | dashboard UI | addEventListener | `overlay.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:5325` | dashboard UI | addEventListener | `overlay.addEventListener('keydown', handleEscape);` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:6001` | dashboard UI | addEventListener | `input.addEventListener('change', syncDefaultScopeState);` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:6017` | dashboard UI | addEventListener | `cancelBtn.addEventListener('click', () => closeWith(null));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:6018` | dashboard UI | addEventListener | `overlay.addEventListener('click', (event) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:6029` | dashboard UI | addEventListener | `applyBtn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:6042` | dashboard UI | addEventListener | `saveBtn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:6048` | dashboard UI | requestAnimationFrame | `requestAnimationFrame(() => {` | RAF; verify cancel or bounded visual update |
| `js/tab-view.js:6959` | dashboard UI | addEventListener | `reconnectBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:6983` | dashboard UI | addEventListener | `editBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:7001` | dashboard UI | addEventListener | `removeBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8529` | dashboard UI | addEventListener | `switchBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8542` | dashboard UI | addEventListener | `renameBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8593` | dashboard UI | addEventListener | `deleteBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8703` | dashboard UI | addEventListener | `mainAccessBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8660` | dashboard UI | addEventListener | `kidsAccessBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8678` | dashboard UI | addEventListener | `editRulesBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8692` | dashboard UI | addEventListener | `pinBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8769` | dashboard UI | addEventListener | `clearPinBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8917` | dashboard UI | addEventListener | `ftProfileSelector.addEventListener('change', async (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8928` | dashboard UI | addEventListener | `ftProfileBadgeBtnTab.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8934` | dashboard UI | addEventListener | `window.addEventListener('resize', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8938` | dashboard UI | addEventListener | `window.addEventListener('scroll', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:8942` | dashboard UI | addEventListener | `document.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9040` | dashboard UI | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/tab-view.js:9063` | dashboard UI | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/tab-view.js:9071` | dashboard UI | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/tab-view.js:9419` | dashboard UI | addEventListener | `ftExportV3Btn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9429` | dashboard UI | addEventListener | `ftExportV3EncryptedBtn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9439` | dashboard UI | addEventListener | `ftImportV3Btn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9447` | dashboard UI | addEventListener | `ftImportV3File.addEventListener('change', async (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9455` | dashboard UI | addEventListener | `ftImportSyncDeviceBtn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9465` | dashboard UI | addEventListener | `ftNanahJoinCode.addEventListener('input', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9487` | dashboard UI | addEventListener | `element.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9495` | dashboard UI | addEventListener | `element.addEventListener('input', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9501` | dashboard UI | addEventListener | `ftNanahAdvancedDetails.addEventListener('toggle', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9512` | dashboard UI | addEventListener | `button.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9519` | dashboard UI | addEventListener | `ftNanahDeviceLabel.addEventListener('input', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9524` | dashboard UI | addEventListener | `ftNanahDeviceLabel.addEventListener('blur', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9527` | dashboard UI | addEventListener | `ftNanahDeviceLabel.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9550` | dashboard UI | addEventListener | `ftNanahHostBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9582` | dashboard UI | addEventListener | `ftNanahJoinBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9617` | dashboard UI | addEventListener | `ftNanahConfirmSasBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9650` | dashboard UI | addEventListener | `ftNanahCopyPairUriBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9664` | dashboard UI | addEventListener | `ftNanahSendBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9698` | dashboard UI | addEventListener | `ftNanahTrustBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9713` | dashboard UI | addEventListener | `ftNanahEndSessionBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9755` | dashboard UI | addEventListener | `ftAllowAccountCreation.addEventListener('change', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9770` | dashboard UI | addEventListener | `ftMaxAccounts.addEventListener('change', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9788` | dashboard UI | addEventListener | `ftCreateAccountBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:9909` | dashboard UI | addEventListener | `ftCreateChildBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:10017` | dashboard UI | addEventListener | `ftSetMasterPinBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:10092` | dashboard UI | addEventListener | `ftClearMasterPinBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:10144` | dashboard UI | addEventListener | `ftAutoBackupMode.addEventListener('change', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:10189` | dashboard UI | addEventListener | `ftAutoBackupFormat.addEventListener('change', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:10648` | dashboard UI | addEventListener | `toggle.addEventListener('click', handleModeToggle);` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:10649` | dashboard UI | addEventListener | `toggle.addEventListener('keydown', (event) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:10859` | dashboard UI | clearInterval | `clearInterval(dashboardStatsRotationTimer);` | cleanup marker / supporting lifecycle marker |
| `js/tab-view.js:10892` | dashboard UI | setInterval | `dashboardStatsRotationTimer = setInterval(() => {` | interval; requires clear path or documented bounded lifetime |
| `js/tab-view.js:10913` | dashboard UI | addEventListener | `dashboardStatsMainBtn.addEventListener('click', () => setDashboardStatsSurface('main', { user: true }));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:10917` | dashboard UI | addEventListener | `dashboardStatsKidsBtn.addEventListener('click', () => setDashboardStatsSurface('kids', { user: true }));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:10996` | dashboard UI | addEventListener | `importSubscriptionsActions.addEventListener('click', async (event) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11013` | dashboard UI | addEventListener | `importSubscriptionsBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11023` | dashboard UI | requestAnimationFrame | `requestAnimationFrame(() => {` | RAF; verify cancel or bounded visual update |
| `js/tab-view.js:11035` | dashboard UI | addEventListener | `addKeywordBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11051` | dashboard UI | addEventListener | `keywordInput.addEventListener('keypress', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11059` | dashboard UI | addEventListener | `searchKeywords.addEventListener('input', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11066` | dashboard UI | addEventListener | `keywordSort.addEventListener('change', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11079` | dashboard UI | addEventListener | `keywordDatePreset.addEventListener('change', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11091` | dashboard UI | addEventListener | `keywordDateFrom.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11098` | dashboard UI | addEventListener | `keywordDateTo.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11105` | dashboard UI | addEventListener | `keywordDateClear.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11116` | dashboard UI | addEventListener | `searchContentControls.addEventListener('input', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11122` | dashboard UI | addEventListener | `helpSearchInput.addEventListener('input', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11132` | dashboard UI | addEventListener | `addChannelBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11166` | dashboard UI | addEventListener | `channelInput.addEventListener('keypress', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11174` | dashboard UI | addEventListener | `searchChannels.addEventListener('input', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11181` | dashboard UI | addEventListener | `channelSort.addEventListener('change', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11194` | dashboard UI | addEventListener | `channelDatePreset.addEventListener('change', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11206` | dashboard UI | addEventListener | `channelDateFrom.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11213` | dashboard UI | addEventListener | `channelDateTo.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11220` | dashboard UI | addEventListener | `channelDateClear.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11232` | dashboard UI | addEventListener | `kidsAddKeywordBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11247` | dashboard UI | addEventListener | `kidsKeywordInput.addEventListener('keypress', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11255` | dashboard UI | addEventListener | `kidsSearchKeywords.addEventListener('input', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11262` | dashboard UI | addEventListener | `kidsKeywordSort.addEventListener('change', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11275` | dashboard UI | addEventListener | `kidsKeywordDatePreset.addEventListener('change', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11287` | dashboard UI | addEventListener | `kidsKeywordDateFrom.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11294` | dashboard UI | addEventListener | `kidsKeywordDateTo.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11301` | dashboard UI | addEventListener | `kidsKeywordDateClear.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11312` | dashboard UI | addEventListener | `kidsAddChannelBtn.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11329` | dashboard UI | addEventListener | `kidsChannelInput.addEventListener('keypress', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11337` | dashboard UI | addEventListener | `kidsSearchChannels.addEventListener('input', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11344` | dashboard UI | addEventListener | `kidsChannelSort.addEventListener('change', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11357` | dashboard UI | addEventListener | `kidsChannelDatePreset.addEventListener('change', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11369` | dashboard UI | addEventListener | `kidsChannelDateFrom.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11376` | dashboard UI | addEventListener | `kidsChannelDateTo.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11383` | dashboard UI | addEventListener | `kidsChannelDateClear.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11398` | dashboard UI | addEventListener | `el.addEventListener('change', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11436` | dashboard UI | addEventListener | `themeToggle.addEventListener('click', async () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11451` | dashboard UI | addEventListener | `quickAddKeywordBtn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11456` | dashboard UI | setTimeout | `setTimeout(() => keywordInput?.focus(), 100);` | timeout; verify bounded lifetime |
| `js/tab-view.js:11461` | dashboard UI | addEventListener | `quickAddChannelBtn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11466` | dashboard UI | setTimeout | `setTimeout(() => document.getElementById('channelInput')?.focus(), 50);` | timeout; verify bounded lifetime |
| `js/tab-view.js:11471` | dashboard UI | addEventListener | `quickContentControlsBtn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11477` | dashboard UI | setTimeout | `setTimeout(() => document.getElementById('searchContentControls')?.focus(), 50);` | timeout; verify bounded lifetime |
| `js/tab-view.js:11482` | dashboard UI | addEventListener | `quickKidsModeBtn.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11489` | dashboard UI | addEventListener | `window.addEventListener('hashchange', handleNavigationIntent);` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11490` | dashboard UI | addEventListener | `window.addEventListener('popstate', handleNavigationIntent);` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11504` | dashboard UI | addEventListener | `item.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/tab-view.js:11614` | dashboard UI | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/ui_components.js:87` | extension support/UI | addEventListener | `if (onClick) btn.addEventListener('click', onClick);` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:114` | extension support/UI | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/ui_components.js:141` | extension support/UI | addEventListener | `toggle.addEventListener('click', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:149` | extension support/UI | addEventListener | `toggle.addEventListener('keydown', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:174` | extension support/UI | addEventListener | `if (onClick) btn.addEventListener('click', onClick);` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:202` | extension support/UI | addEventListener | `input.addEventListener('input', (e) => onInput(e.target.value));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:206` | extension support/UI | addEventListener | `input.addEventListener('keypress', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:267` | extension support/UI | addEventListener | `btn.addEventListener('click', () => switchTab(tab.id));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:419` | extension support/UI | addEventListener | `checkbox.addEventListener('change', (e) => onChange(e.target.checked));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:462` | extension support/UI | addEventListener | `select.addEventListener('change', (e) => onChange(e.target.value));` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:602` | extension support/UI | requestAnimationFrame | `positionRaf = requestAnimationFrame(() => {` | RAF; verify cancel or bounded visual update |
| `js/ui_components.js:617` | extension support/UI | cancelAnimationFrame | `cancelAnimationFrame(positionRaf);` | cleanup marker / supporting lifecycle marker |
| `js/ui_components.js:636` | extension support/UI | requestAnimationFrame | `requestAnimationFrame(() => {` | RAF; verify cancel or bounded visual update |
| `js/ui_components.js:638` | extension support/UI | requestAnimationFrame | `requestAnimationFrame(() => {` | RAF; verify cancel or bounded visual update |
| `js/ui_components.js:762` | extension support/UI | addEventListener | `btn.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:784` | extension support/UI | addEventListener | `trigger.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:790` | extension support/UI | addEventListener | `window.addEventListener('resize', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:794` | extension support/UI | addEventListener | `window.addEventListener('scroll', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:798` | extension support/UI | addEventListener | `document.addEventListener('click', (e) => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:807` | extension support/UI | addEventListener | `select.addEventListener('change', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:815` | extension support/UI | addEventListener | `select.addEventListener('input', () => {` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:821` | extension support/UI | MutationObserver:new | `const obs = new MutationObserver(() => {` | observer; verify disconnect and lifetime |
| `js/ui_components.js:824` | extension support/UI | observe | `obs.observe(select, { attributes: true, attributeFilter: ['disabled'] });` | observer; verify disconnect and lifetime |
| `js/ui_components.js:865` | extension support/UI | addEventListener | `if (onClick) btn.addEventListener('click', onClick);` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui_components.js:951` | extension support/UI | requestAnimationFrame | `requestAnimationFrame(() => {` | RAF; verify cancel or bounded visual update |
| `js/ui_components.js:955` | extension support/UI | setTimeout | `setTimeout(() => {` | timeout; verify bounded lifetime |
| `js/ui_components.js:957` | extension support/UI | setTimeout | `setTimeout(() => toast.remove(), 300);` | timeout; verify bounded lifetime |
| `js/ui-shell/popup-shell.js:110` | popup UI | addEventListener | `else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(f, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 \|\| "onFocusOut" == l2 \|\| "onFocusIn" == l2 ? o2.slice(2) : l2.slice(2), n2.l \|\| (n2.l = {}), n2.l[l` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui-shell/popup-shell.js:110` | popup UI | removeEventListener | `else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(f, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 \|\| "onFocusOut" == l2 \|\| "onFocusIn" == l2 ? o2.slice(2) : l2.slice(2), n2.l \|\| (n2.l = {}), n2.l[l` | cleanup marker / supporting lifecycle marker |
| `js/ui-shell/tab-view-decor.js:110` | dashboard UI | addEventListener | `else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(f, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 \|\| "onFocusOut" == l2 \|\| "onFocusIn" == l2 ? o2.slice(2) : l2.slice(2), n2.l \|\| (n2.l = {}), n2.l[l` | UI/support listener; verify scope and modal/page teardown if dynamic |
| `js/ui-shell/tab-view-decor.js:110` | dashboard UI | removeEventListener | `else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(f, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 \|\| "onFocusOut" == l2 \|\| "onFocusIn" == l2 ? o2.slice(2) : l2.slice(2), n2.l \|\| (n2.l = {}), n2.l[l` | cleanup marker / supporting lifecycle marker |

## Interpretation

- Listener start/cleanup ratios are not direct bug counts. Some listeners intentionally live for a document lifetime. They still need an active gate or documented lifetime.
- Anonymous page-resident listeners cannot be individually removed, so the acceptable proof is either a strict install gate or an internal no-op gate with counters.
- Observers and intervals are the highest performance-risk lifecycle markers because they can repeatedly wake on YouTube hydration, scrolling, route changes, fullscreen, and native app overlays.
- UI listeners are lower page-load risk but high authority risk when they mutate profile/list/settings state.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this lifecycle teardown audit can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
