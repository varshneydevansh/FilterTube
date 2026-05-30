# FilterTube YouTube Lag Commit Attribution - 2026-05-26

## Question

Determine whether the severe YouTube SPA lag reported after the recent
whitelist work was caused by May 5+ commits, or whether the main no-rule drag
already existed in older runtime code. Also preserve the release invariant that
users only see what they want to see: blocklist keyword/channel matches must
still hide, whitelist mode must still allow only matching content, and the
quick-cross affordance must remain available for first-rule channel blocking.

## Finding

The recent whitelist commits can amplify work in whitelist mode, but the
no-blocklist/no-rule lag was not solely caused by those commits. The current
evidence points to three overlapping hot paths:

1. pre-existing always-on DOM affordance lifecycles;
2. May 6 JSON-first response interception that parsed YouTubei bodies before a
   no-work decision;
3. May 9-11 whitelist pending/rail observers that increased work in whitelist
   and SPA navigation states.

## Pre-May 5 Always-On Work

- `94df020` (`2026-02-08`, "BUMP: v3.2.7 Category Filters + Quick Block Hover Cross + Mobile 3 Dot UI & Quick Cross Block Support") introduced quick-block lifecycle work in `js/content/block_channel.js`, including `quickBlockPeriodicTimer`, `setupQuickBlockObserver()`, `scheduleQuickBlockSweep()`, and a `window.setInterval()` full-document sweep.
- `cadcf54` (`2026-03-13`, "FIX: add custom 3 dot UI to remainign surfaces") introduced fallback menu lifecycle work in `js/content_bridge.js`, including `ensureFallbackMenuButtons()`, document scans over fallback card selectors, MutationObserver ownership, and navigation rescan hooks.
- May 10 fallback-menu commits such as `884fb11`, `72e4c25`,
  `038346c`, `c26fca6`, and `3dc4a51` reduced some scan frequency and
  native-overlay cases, but still preserved broad scan scheduling for warmup,
  scroll, click, mutation, and SPA navigation.

## May 5+ Amplifiers

- `f87729d`, `011fdfe`, `b3de84e`, and `dd1568f` (`2026-05-06`)
  changed whitelist home/watch loading, watch-rail hydration, pending hides,
  identity, and comment scope across `js/content/dom_fallback.js`,
  `js/content_bridge.js`, and `js/filter_logic.js`.
- `2241042` (`2026-05-09`) added/coalesced whitelist pending rechecks.
- `777ad8a` (`2026-05-10`) batched whitelist pending observer scans.
- `27f1639` (`2026-05-10`) capped whitelist pending hide candidates, but
  still kept whitelist-specific candidate collection in the mutation path.
- `e88414e` (`2026-05-11`) quieted the whitelist observer under native
  overlays.

These are relevant to whitelist-mode drag and watch/home SPA navigation, but
they do not fully explain the user-reported blocklist/no-rule lag because the
older quick-block and fallback-menu lifecycles were already active on ordinary
YouTube browsing.

## JSON-First Body Cost

- `0a9978d` (`2026-05-06`) made active blocklist rules run JSON-first through
  `js/seed.js` and `js/filter_logic.js`.
- `bf95385` (`2026-05-06`) reduced watch-page JSON filtering cost, but the
  inspected interception path still called `response.clone().json()` for
  intercepted YouTubei fetches before proving that any rule or content filter
  needed JSON work.
- Current fix adds a pre-parse pass-through gate for empty/disabled blocklist installs while preserving JSON-first processing for active keyword/channel/comment/Shorts/category/content-filter work and whitelist mode.

## Current Evidence From Worktree

| Surface | Current evidence | Release meaning |
| --- | --- | --- |
| Seed fetch/XHR no-work | `js/seed.js` has `hasNetworkJsonWork()` and `shouldBypassYouTubeiNetworkResponse()` before fetch/XHR body parsing. | Empty/disabled blocklist YouTubei traffic no longer pays clone/parse/stringify work. |
| Main-world startup JSON | `js/injector.js` mirrors `hasNetworkJsonWork()` and clears queued startup JSON when no active JSON work exists. | Backup hooks do not reprocess queued initial data on empty/disabled blocklist settings. |
| DOM fallback | `js/content/dom_fallback.js` requires active DOM work; category filters require selected categories. | Empty blocklist pages do not install broad fallback mutation/prefetch work. |
| Quick-cross | `js/content/block_channel.js` keeps `isQuickBlockEnabled()` true for empty blocklists, exports `FilterTube_refreshQuickBlockAvailability()`, starts on settings delivery from `js/content/bridge_settings.js`, and resolves deep card targets via native `closest()`. | The first-rule quick-cross can appear on Home/Shorts while avoiding periodic/body-wide sweeps. |
| Native/comment 3-dot menu | `js/content/block_channel.js` repairs stale FilterTube-hidden dropdown state and closes reusable native dropdowns without poisoning inline display. | Comment/native YouTube menu state should not stay invisible after one menu interaction. |
| Main blocklist aliases | `js/background.js`, `js/settings_shared.js`, and `js/state_manager.js` prefer canonical Main `keywords`/`channels` before stale `blockedKeywords`/`blockedChannels` aliases. | A keyword such as `shakira` in the visible blocklist compiles into runtime block rules. |
| ApplySettings cache | `js/background.js` treats `FilterTube_ApplySettings` as an invalidation/recompile trigger rather than trusting caller compiled payloads. | UI saves refresh background-owned compiled settings before broadcasting. |

## Current Fix Boundary

- Empty/disabled blocklist YouTubei fetch/XHR responses now bypass JSON clone, parse, engine processing, and rewritten response bodies before body work.
- The MAIN-world injector now mirrors that no-work gate: empty/disabled blocklist settings clear queued injector startup JSON and return before `FilterTubeEngine.processData()` in the backup `ytInitialData` hook.
- DOM fallback mutation and identity prefetch lifecycles now no-op unless settings need fallback work or channel identity prefetch work.
- Quick-block removed the old periodic full-document sweep, scopes mobile/coarse
  mutation sweeps to touched roots, tracks near-viewport hosts with
  IntersectionObserver, uses that tracked set for viewport refresh and
  pointermove hover recovery, and suppresses desktop body-observer eager sweeps.
- Quick-block no longer attaches its body MutationObserver on desktop hover-capable YouTube, pointermove recovery is target-gated before it can call `elementsFromPoint()`, and repeated movement over the same element reuses the cached target-to-host resolution instead of rerunning broad selector checks.
- Empty desktop blocklists still keep the quick-cross first-rule affordance.
  The current boundary is hover-lazy rather than no-lifecycle: no periodic
  sweep, no desktop body MutationObserver, no startup pointermove listener, and
  no whole-document dropdown scan at idle.
- `sendSettingsToMainWorld()` now retries runtime observer availability after
  compiled settings arrive, so quick-cross startup no longer depends on the
  delayed boot racing settings delivery.
- `findQuickBlockCardFromTarget()` now tries native `closest()` before a
  bounded parent walk, so deeper current Home/Shorts markup can still resolve
  to the card that receives the quick-cross.
- Native dropdown discovery no longer observes the whole body at idle; it arms a short-lived body observer only after a menu click or keyboard menu action.
- Fallback menu scans are scoped to mutation/click roots where possible; scroll and warmup use near-viewport filtering instead of injecting over every offscreen fallback card, desktop fallback affordance creation is hover/focus lazy, and the fallback menu body observer is not attached on desktop.
- DOM fallback no longer observes the whole body for empty blocklist settings; storage refresh reattaches that observer only after active DOM work exists.

## Verification

- `node --test --test-reporter=spec tests/runtime/quick-block-block-menu-affordance-boundary-current-behavior.test.mjs tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs tests/runtime/block-channel-method-semantic-register-current-behavior.test.mjs tests/runtime/dom-target-source-current-behavior.test.mjs tests/runtime/p0-compiled-rule-state-current-behavior.test.mjs tests/runtime/active-rule-authority-current-behavior.test.mjs` -> 54/54 passing.
- `node --test --test-reporter=spec tests/runtime/main-profile-blocklist-keyword-alias-current-behavior.test.mjs tests/runtime/storage-refresh-force-reprocess-coalescing-current-behavior.test.mjs tests/runtime/native-dropdown-close-state-current-behavior.test.mjs tests/runtime/background-compiled-cache-invalidation-lifecycle-boundary-current-behavior.test.mjs tests/runtime/compiled-settings-profile-list-mode-assembly-boundary-current-behavior.test.mjs tests/runtime/compiled-cache-authority-current-behavior.test.mjs tests/runtime/right-rail-whitelist-observer-current-behavior.test.mjs tests/runtime/json-first-network-snapshot-clone-isolation-current-behavior.test.mjs tests/runtime/enabled-master-switch-disabled-runtime-boundary-current-behavior.test.mjs tests/runtime/filter-all-toggle-list-target-current-behavior.test.mjs tests/runtime/content-bridge-menu-action-list-target-current-behavior.test.mjs tests/runtime/background-method-semantic-register-current-behavior.test.mjs tests/runtime/active-rule-authority-current-behavior.test.mjs` -> 90/90 passing.
- `node --test --test-reporter=spec tests/runtime/p0-no-work-current-behavior.test.mjs tests/runtime/p0-endpoint-policy-current-behavior.test.mjs tests/runtime/p0-network-authority-current-behavior.test.mjs tests/runtime/seed-network-current-behavior.test.mjs tests/runtime/seed-fetch-no-work-list-mode-boundary-current-behavior.test.mjs tests/runtime/seed-xhr-no-work-list-mode-boundary-current-behavior.test.mjs tests/runtime/empty-install-performance-current-behavior.test.mjs tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs` -> 89/89 passing.
- `node --check js/seed.js`
- `node --check js/content_bridge.js`
- `node --check js/content/block_channel.js`
- `node --check js/content/dom_fallback.js`
- `node --check js/content/bridge_settings.js`
- `git diff --check`
- `npm run build`

## Release Note

This does not complete the full codebase audit. It is a targeted lag and
quick-cross restoration fix backed by proof slices so manual YouTube testing
can start earlier without waiting for every audit row to finish. The remaining
release gate is still live installed-extension testing in the normal Chrome
profile, not a private/new Chrome instance.
