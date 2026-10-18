# FilterTube import metadata and Home-feed stability

## Snapshot

This document records the current implementation before the next background-worker change. The snapshot covers:

1. Home-page flashes, card movement, and scroll jumps while YouTube hydrates or appends feed cards.
2. BlockTube migration files containing more than a simple channel list.
3. CSV, TXT, FilterTube rule-list, and BlockTube imports that initially contain incomplete channel metadata.
4. Profile-safety and repaint behavior while imported metadata is completed.

The current implementation is intentionally dashboard-owned for metadata completion. The persisted job survives a dashboard reload, but its timer stops when the dashboard page is closed. Moving that job to the extension service worker, and choosing a 7–15 second pacing policy, is the next separate work item.

## Import behavior

### Supported input shapes

Rule-list imports can read CSV, TXT, raw public URLs, FilterTube rule-list JSON, and BlockTube migration JSON. BlockTube data is recognized both at the root and under the common storageData, data, payload, or backup wrappers. Compiled BlockTube rules represented as [pattern, flags] tuples or { pattern, flags } objects are normalized before interpretation.

The preview runs before any write. It reports effective channels, channel IDs, channel-name rules, video IDs, title rules, comment rules, validated regex rules, mapped settings, duration filters, inactive values, unsupported values, invalid values, and unknown values. Imported JavaScript is never executed. A BlockTube UI password is never converted into a FilterTube PIN, and an import cannot choose profiles, PINs, trusted devices, time limits, or sync targets.

### BlockTube field mapping

| BlockTube data | FilterTube result |
| --- | --- |
| filterData.channelId containing a UC ID | A blocking channel rule with source "blocktube"; the UC ID is active immediately. |
| Context-menu comment followed by a UC ID | The comment label is used as the initial display name. |
| filterData.channelName literal or valid regex | A channel-name rule with source "blocktube-channel-name"; matching is scoped to the channel-name field and preserves boundary/regex behavior. |
| filterData.title | A title keyword rule. |
| filterData.comment | A comment keyword rule. |
| filterData.videoId | A video-ID rule. |
| filterData.vidLength and options.vidLength_type | A duration filter with seconds converted to minutes and the BlockTube allow/block meaning preserved where an exact equivalent exists. |

Malformed split context comments are rejoined when the continuation is unambiguous. Channel-name rules without a unique channel identifier are not sent to YouTube for enrichment because there is no safe channel profile to attach to them.

## Why a name can appear before the rest of the metadata

This is not intended to be a separate “fetch the name, then fetch the handle, then fetch the avatar” pipeline.

For the supplied BlockTube backup, a typical sequence is:

~~~text
// Blocked by context menu (Channel name ...)
UC......................................
~~~

The importer reads the context comment and stores that text as the row name at import time. The UC rule is already usable for filtering. A later metadata lookup uses the saved identifier and asks YouTube for the available channel identity fields together: name, handle or custom URL, avatar, resolved ID, and alternate IDs.

Rows finish independently because the queue processes one eligible identifier at a time. YouTube can also omit a field in an otherwise successful response. FilterTube keeps useful partial metadata and retries the row with backoff instead of making a burst of requests. Therefore:

- a name may be visible immediately from the BlockTube export;
- a handle/custom URL and avatar may appear later;
- Not fetched means an eligible identifier is still waiting for the paced lookup;
- Name rule only means the BlockTube export supplied a channel-name rule without a unique UC ID, so no profile lookup is safe;
- the saved UC rule remains active while metadata is incomplete.

## Current enrichment lifecycle

All imported formats use the same format-agnostic persisted queue. It scans Main and Kids surfaces across the V4 profile tree for imported channel rows that have a valid UC ID, handle, c/ URL, user/ URL, or YouTube channel URL but still lack a display name, alternate identity, or avatar.

The current queue:

- is stored under the existing ftBlockTubeEnrichmentJobV1 storage key for compatibility with already queued migrations;
- processes one lookup at a time, with a randomized 7–15 second delay between scheduling points;
- retries incomplete or failed lookups after about 2 minutes, then 4 minutes, 8 minutes, and at most 30 minutes; a failed row does not delay fresh rows;
- persists pending and in-flight work so a reload can resume it;
- keeps ordinary user-added channel enrichment out of the import queue and keeps imported work out of the ordinary fast post-block queue;
- validates the active actor and target profile before and immediately before a write;
- lets a parent/account profile enrich an eligible child row without projecting the child’s private rules into the legacy global store;
- merges resolved IDs, handles/custom URLs, avatars, names, and alternate IDs into the existing row rather than creating duplicates;
- does not refresh YouTube tabs for metadata-only changes, avoiding a needless Home repaint/reflow for each completed row.

The queue currently runs from StateManager in the dashboard page. chrome.storage.local preserves the job, but closing tab-view.html destroys its timer. Opening Filters calls the resume path again. This is the known lifecycle limitation that the next background-worker phase will address.

## User feedback added in this snapshot

The import confirmation and help text now explain that metadata completion happens after approval and may take time. Channel Management also has a persistent status notice while imported work remains. It reports:

- how many lookups remain and whether one is in flight;
- the approximate next lookup time;
- the one-at-a-time pacing policy;
- why a name can appear before a handle or avatar;
- why name-only rules are not enriched;
- that closing the dashboard does not stop the background queue; browser shutdown or wakeup limits can delay it.

The notice respects the HTML hidden attribute even though the shared inline-notice CSS uses display: grid, and its text can wrap on narrow layouts.

## Home-feed flash and movement safeguards

The Home fallback now starts before the optional MAIN-world setup and performs an immediate Home pass while the first feed batch is visible. Home filtering avoids timer yields between hide operations, so the browser does not paint every intermediate compacted-grid position. Scroll preservation is skipped when filtering or page geometry changed, allowing YouTube’s own scroll anchoring to keep the viewport stable.

The Home chip rail changes are deliberately narrow:

- no scrollIntoView call, which could change vertical document position;
- only horizontal chip scroll restoration;
- one coalesced delayed restoration instead of repeated 90/240/520 ms restorations;
- mutation processing only when a mutation touches or replaces the chip rail;
- no late CSS changes to card fonts, padding, flex layout, fixed rails, or card dimensions;
- existing channel rows are annotated only when their normalized signature changes, rather than having their text/child tree rewritten after paint.

BlockTube channel-name rules are indexed using a shared matcher and the DOM fallback’s matching path, so a large imported name-rule list does not require a full marker scan for every video renderer.

## Profile and repaint safety

Imported metadata writes are guarded by the active actor and target profile relationship. Before a long fetch result is written, the active profile is re-read so a profile switch cannot apply a stale result to the wrong profile. Child-profile enrichment does not project private child rules into the legacy global store.

Metadata-only storage changes are distinguished from rule changes. The background compiler still updates its caches, but YouTube tabs are not refreshed for a name, handle, avatar, or alternate-ID update. The content bridge likewise ignores metadata-only refreshes. This prevents each slow enrichment result from causing another Home repaint.

## Source ownership

| Area | Files in this snapshot |
| --- | --- |
| Import parsing, BlockTube translation, receipts, and format messaging | js/io_manager.js, js/tab-view.js, html/tab-view.html, css/tab-view.css |
| Persisted imported enrichment and profile-aware queueing | js/state_manager.js, js/background.js |
| Channel-name rule indexing and row state labels | js/shared/identity.js, js/filter_logic.js, js/render_engine.js, js/content/dom_fallback.js |
| Metadata-only repaint suppression and early Home startup | js/content/bridge_settings.js, js/content_bridge.js, js/content/dom_fallback.js |
| Regression coverage | tests/runtime/blocktube-import-transaction-current-behavior.test.mjs, tests/runtime/blocktube-channel-name-index-current-behavior.test.mjs, tests/runtime/blocktube-enrichment-route-current-behavior.test.mjs, tests/runtime/home-feed-flash-stability-current-behavior.test.mjs, tests/runtime/user-feedback-rule-exceptions-migration-shorts.test.mjs |

## Verification evidence

The following checks passed for this snapshot:

~~~text
node --check js/state_manager.js
node --check js/background.js
node --check js/tab-view.js
node --check js/render_engine.js
node --check js/io_manager.js
git diff --check
node --test tests/runtime/blocktube-enrichment-route-current-behavior.test.mjs tests/runtime/blocktube-import-transaction-current-behavior.test.mjs tests/runtime/home-feed-flash-stability-current-behavior.test.mjs tests/runtime/blocktube-channel-name-index-current-behavior.test.mjs tests/runtime/user-feedback-rule-exceptions-migration-shorts.test.mjs
npm run build:chrome
~~~

The focused test command passed all 23 tests. The Chrome build produced filtertube-chrome-v3.3.6.zip. No live manual interaction with the installed chrome-extension:// page was claimed as verification in this snapshot.

## Next separate phase

The next phase should not change the import contract or Home filtering logic. It should move the persisted enrichment scheduler to the Chrome/Opera background service worker, use alarm/event-driven wakeups rather than a dashboard setTimeout, and decide whether a randomized 7–15 second delay is an acceptable default. The dashboard should observe the persisted job and expose pause/resume state; it should not own the work.
