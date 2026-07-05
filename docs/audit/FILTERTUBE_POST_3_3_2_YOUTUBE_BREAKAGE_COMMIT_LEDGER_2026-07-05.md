# FilterTube Post-3.3.2 YouTube Breakage Commit Ledger

Date: 2026-07-05
Baseline: `v3.3.2` / `43e548cbd9c3b1db5b50568e7d4381462d0a1e78` / `BUMP:v3.3.2`

## Current regression question

A user reports YouTube is broken after the store rollback to `3.3.4`, where
`3.3.4` is understood to be the `3.3.2` codebase. If that rollback really
contains no post-`v3.3.2` runtime code, then the July 2026 current-master
comment-sheet fix cannot be the cause of the store-build breakage. In that
case, the likely cause is a live YouTube DOM/API change that also breaks the
old `3.3.2` runtime.

The current-master comment-sheet fix can still be a separate regression risk
for unreleased/newer builds, so it remains on the suspect list below.

## 2026-07-05 duplicate runtime injection finding

Local installed-extension console errors showed repeated top-level declaration
failures:

- `filterTubeMenuStylesInjected`
- `VIDEO_CARD_SELECTORS`
- `CHANNEL_ONLY_TAGS`
- `lastClickedMenuButton`
- `pendingSeedSettings`
- `HANDLE_TERMINATOR_REGEX`
- `COLLAB_DIALOG_TITLE_PATTERN`
- `statsCountToday`

Those names are top-level `let`/`const` declarations in manifest content
scripts. The failures mean the same content-script bundle was evaluated more
than once in the same isolated world. Once this happens, the second evaluation
dies before the full runtime finishes loading, which can leave YouTube in a
half-controlled state where settings, menu, fallback hiding, or refresh paths
do not behave deterministically.

The current-master cause is `4b85957c` (`Fix managed time limits in open
YouTube tabs`). That commit added `refreshYouTubeTabs({ injectIfMissing:
true })` on install/update and profile changes. The helper attempted to inject
`js/seed.js` and the full isolated content-script runtime if a ping failed.
That is unsafe because the manifest already injects those files:

- `js/seed.js` in `MAIN`
- `js/shared/identity.js`
- `js/content/dom_state.js`
- `js/content/menu.js`
- `js/content/dom_helpers.js`
- `js/content/dom_extractors.js`
- `js/content/dom_fallback.js`
- `js/content/block_channel.js`
- `js/content/bridge_injection.js`
- `js/content/bridge_settings.js`
- `js/content/handle_resolver.js`
- `js/content/collab_dialog.js`
- `js/content/release_notes_prompt.js`
- `js/content/first_run_prompt.js`
- `js/content_bridge.js`

Ping can fail during early page load, after extension reload/update, or after a
partial runtime failure. Replaying the files then creates the exact duplicate
declaration errors.

Fix applied in current working tree:

- `refreshYouTubeTabs()` now only sends `FilterTube_RefreshNow` to already
  loaded runtimes.
- Install/update/profile-change paths no longer replay manifest content
  scripts into open YouTube tabs.
- `FilterTube_EnsureSubscriptionsImportBridge` now pings the existing YouTube
  content script instead of injecting duplicate isolated files. If the receiver
  is unavailable, the dashboard flow reports that the YouTube tab must be
  reloaded/retried.

Release boundary:

- This explains the local current-build `Identifier ... has already been
  declared` errors.
- It does not by itself prove the store rollback bug if `3.3.4` is truly the
  old `v3.3.2` package. The old-package report still needs installed package
  proof and live YouTube DOM/no-rule false-hide inspection.

## Commit volume after v3.3.2

`git rev-list --count v3.3.2..HEAD` reports `680` commits after `v3.3.2`.
Most of those are docs, audit proofs, tests, managed-controls UI, or release
support. The commits below are the ones that can plausibly affect installed
YouTube behavior.

## Runtime-risk commits

### 2026-06-03 mobile feed, search, and collaborator fixes

- `03620e61` `Clean mobile feed metadata and collaborator menus`
  - Touched mobile metadata and collaborator menu behavior.
  - Risk: medium for mobile/YTM menus and collaborator extraction.

- `38a82e00` `Keep mobile search results continuous`
  - Kept mobile search content loading after filtering.
  - Risk: medium for mobile search DOM mutation and continuation behavior.

- `38923d5e` `Keep mobile search continuation clear`
  - Follow-up continuation cleanup for mobile search.
  - Risk: medium for mobile search scroll/load-more behavior.

- `0cd7eba1` `Keep watch and search feeds loading after filters`
  - Adjusted watch/search feed behavior after filtering.
  - Risk: medium-high for watch/search rows.

- `73c0be75` `fix: restore scoped collaborator warmup`
  - Restored scoped collaborator prefetch/warmup.
  - Risk: medium for collaborator menu accuracy and background work.

### 2026-06-04 to 2026-06-06 managed controls and time limits

- `94631b85` through `b5ce017b`
  - Added managed child/protected-profile policy, time limits, route gates,
    policy envelopes, action history, admin sessions, signing keys, mailbox/LAN
    provider hooks, and parent command-center UI.
  - Risk to normal YouTube filtering: low-medium.
  - Risk to viewing access/time overlay/profile authority: high.
  - Important runtime-touching examples:
    - `e9daa481` enforces managed child viewing routes.
    - `7bf68c67` adds time-budget enforcement.
    - `f2690405` revalidates time-budget heartbeats.
    - `400ebd5f` and `73c8763d` affect unlock/session limits.

### 2026-06-18 rule lists, chips, app-runtime alignment, and lockups

- `fe4683ea` `Add managed channel list imports`
  - Adds managed list/rule import foundation.
  - Risk: low for YouTube DOM hiding; medium for settings/rule mutation.

- `9b3a97cb` to `b060aaee`
  - Adds URL import, refresh, library, pause, source metadata, and batch refresh.
  - Risk: low for DOM; medium for rule list persistence and sync.

- `b8292f49` `Align extension DOM fallback with app runtime`
  - Explicitly changes extension DOM fallback to match app runtime behavior.
  - Risk: high for YouTube hiding because it touches fallback logic.

- `52d158e9` `Fix watch scroll jump from home chip polish`
  - Fixes a watch-page scroll-to-top regression from chip handling.
  - Risk: medium for watch page layout/scroll.

- `e5dcf0db` `Limit chip filtering to feed and search`
  - Scopes chip filtering away from watch page.
  - Risk: medium for chips/feed/search only.

- `4a7e627f` `Stop chip mutations waking DOM fallback`
  - Prevents chip mutations from triggering fallback work.
  - Risk: medium for performance and delayed DOM fallback.

- `950972ec` `Restore collaborator warmup for new YouTube lockups`
  - Adds support for newer YouTube lockup collaborator warmup.
  - Risk: high for collaborator menus and card identity.

- `aa3d19de` `Feature: Add comma-separated input support for keywords and channels (#38)`
  - Adds CSV/comma input import support.
  - Risk: low for DOM; medium for import parsing and rule writes.

### 2026-06-19 collaborator recovery and rule-list UX

- `7b368a02` `Harden collaborator card recovery for new lockups`
  - Follow-up for new YouTube lockup collaborator extraction.
  - Risk: high for collaborator menus and card identity.

- `e6eec582`, `d149b3ff`, `d1aef0e3`, `494b4d8c`, `b4c72c2`,
  `39c58a37`, `57bc8ffd`, `e3081459`, `171db83b`, `ce9e1b67`,
  `0dcf94f0`, `5fcb87f6`
  - Settings/rule-list entry point, stale checks, previews, modal polish, and
    scheduled review checks.
  - Risk: low for YouTube DOM; medium for settings/import UI.

### 2026-06-20 to 2026-06-21 managed pickup, session, and rule authority

- `c330c71d` `Gate list mode changes by profile session`
  - Adds profile-session gating to list mode changes.
  - Risk: medium for settings/profile authority.

- `a32c928e` `Gate background rule mutations by profile session`
  - Adds background rule mutation gating.
  - Risk: medium-high for rule writes if session state is wrong.

- `9eed1c09` `Clear session pin cache on tab close`
  - Session cleanup.
  - Risk: medium for protected editing, low for normal YouTube hiding.

- `623600fe` and `f961aedd`
  - Gate subscription/content bridge logs.
  - Risk: low. Logging changes should not alter filtering behavior.

### 2026-06-26 pickup provider and managed sync completion

- `da864125` through `bb8e04fe`
  - Adds Internet/Home Pickup readiness checks, provider state, setup, queue
    status, receipts, purge/expiry, provider status page, and docs.
  - Risk: low for YouTube DOM hiding; medium for managed sync/provider UI.

## July 2026 high-risk YouTube DOM commits

### Desktop YTD lockup camelCase support

- `bc715923` `FIX: adapt hiding to current YouTube lockup DOM`
  - Adds current `ytLockup*` selector aliases for title, video id, byline,
    menu hosts, avatar-label channel names.
  - Forces fresh settings after block actions and clears compiled cache after
    persistent add writes.
  - Files: `js/background.js`, `js/content/dom_extractors.js`,
    `js/content/dom_fallback.js`, `js/content_bridge.js`,
    `docs/youtube_renderer_inventory.md`.
  - Risk: very high for YouTube desktop card hiding and channel blocking.
  - If current YouTube changed again, this is the first code area to inspect.

### Keyword date filtering

- `dfc4305c` `Add date-based keyword filtering`
- `1cba43c7` `Fix keyword date pill validation`
- `368368af` `Fix keyword date field visibility`
- `63d0cf23` `Align keyword date filters with comment behavior`
  - Adds per-keyword date rules and comment behavior tied to parent video date.
  - Risk: medium for keyword/comment filtering. Low for pure channel blocking.

### Dashboard/help bubbles

- `1c2dc4cc` `Add keyword control help bubbles`
- `a049c709` `Add dashboard-wide help bubbles`
- `2fcbad38` `Expand family device help bubbles`
  - Adds UI help affordances.
  - Risk: low for YouTube DOM.

### Open-tab time-limit enforcement

- `4b85957c` `Fix managed time limits in open YouTube tabs`
  - Sends time-limit enforcement into already-open YouTube tabs.
  - Risk: high for installed-extension stability because it introduced a
    fallback that could replay the manifest content-script bundle into already
    open tabs after a ping failure.
  - Observed symptom: duplicate top-level declaration errors from
    `menu.js`, `dom_extractors.js`, `dom_fallback.js`, `block_channel.js`,
    `bridge_settings.js`, `handle_resolver.js`, `collab_dialog.js`, and
    `content_bridge.js`.
  - Current fix: message existing runtimes only; do not inject duplicate
    runtime files.

### YTM camelCase support

- `0a437092` `Fix YTM camelCase DOM card support`
- `fb7859c8` `Support YTM camelCase post DOM hosts`
- `f5ce25ed` `Support full YTM camelCase DOM hosts`
- `33f55acd` `Complete YTM camelCase DOM coverage`
  - Adds mobile/YTM camelCase selectors and host support across
    `block_channel.js`, `dom_extractors.js`, `dom_fallback.js`,
    `content_bridge.js`.
  - Risk: high for mobile/YTM card hiding and menus.
  - Not expected to affect desktop YTD unless shared selector logic regressed.

### Comment surface false-hide guard

- `be3945b5` `Guard comment surfaces from lockup fallback`
  - Adds `isFilterTubeCommentSurfaceElement()` in `dom_fallback.js` and
    `content_bridge.js`.
  - Skips comment surfaces when processing video-card fallback, prefetch
    observer attachments, and whitelist pending-hide candidates.
  - Files: `js/content/dom_fallback.js`, `js/content_bridge.js`,
    `docs/youtube_renderer_inventory.md`.
  - Risk: medium for comments and comment-sheet handling.
  - It should not directly break card channel hiding outside comments.
  - If `3.3.4` is truly the `3.3.2` codebase, this commit cannot explain the
    store rollback still being broken.

## Current working theory

1. If rollback `3.3.4` is byte-for-byte `3.3.2`, the breakage is probably a
   live YouTube DOM/API change, not a post-`3.3.2` FilterTube commit.
2. If rollback `3.3.4` accidentally included July runtime patches, inspect in
   this order:
   - `bc715923` desktop `ytLockup*` support
   - `be3945b5` comment-surface guard
   - `4b85957c` open-tab time-limit enforcement
   - `0a437092` to `33f55acd` YTM camelCase support
3. If channel rows are added to blocklist but visible content does not hide,
   the most likely failure is identity extraction or card target selection, not
   the settings write path.

## Next inspection targets

- Confirm what source was actually packaged as store `3.3.4`.
- Diff the live installed extension package against `v3.3.2`.
- On current YouTube desktop, inspect:
  - current card host tag/class
  - title selector
  - channel/byline selector
  - video href extraction
  - hide target wrapper
- Compare those selectors against `VIDEO_CARD_SELECTORS`, `getCardTitle()`,
  `extractVideoIdFromCard()`, `extractChannelFromCard()`, and
  `resolveContentHideTarget()` in the current source and in `v3.3.2`.
