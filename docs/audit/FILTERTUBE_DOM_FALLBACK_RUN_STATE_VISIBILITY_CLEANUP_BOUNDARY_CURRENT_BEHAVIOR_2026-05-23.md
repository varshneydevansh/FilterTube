# FilterTube DOM Fallback Run-State Visibility Cleanup Boundary - Current Behavior

Date: 2026-05-23

Status: audit-only current-behavior boundary.

Runtime behavior is unchanged. This is not an implementation patch and does not change DOM fallback processing, hide/restore behavior, scroll preservation, selector scope, JSON filtering, settings delivery, or whitelist/list-mode behavior.

## Boundary

This slice pins the current DOM fallback run-state and visibility cleanup path:

- DOM helpers add and remove `filtertube-hidden`, `data-filtertube-hidden`, `filtertube-hidden-shelf`, and whitelist-pending state.
- DOM fallback decides whether there is active work, clears stale hidden/pending state when no work remains or disabled mode is reached, and serializes overlapping `applyDOMFallback()` calls through a page-global run state.
- DOM fallback records one scroll listener, avoids scroll restoration while the user is scrolling, and schedules one pending rerun after the active run exits.

This is a prerequisite for whitelist optimization and first-class JSON filtering because a JSON-side no-work or allow decision is only safe if DOM fallback does not leave stale hidden rows, fight user scroll, or rerun broad selectors without an explicit budget.

This file also records the current reason for the codebase inspection: we are finding concrete optimization locations and the blockers to making JSON a first-class filter path before changing runtime behavior.

## Source Fingerprints

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_helpers.js` | 206 | 8,292 | `a8c6ebfc10394f67254fbe5d324090ba9d01bead7efbb61d44e63dda4b52c242` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

DOM fallback run-state visibility cleanup source files pinned: 2

## Pinned Source/Effect Blocks

| Block | Source | Start line | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| `domHelpersToggleVisibility` | `js/content/dom_helpers.js:67` | 67 | 84 | 3,286 | `23e68a0a3522deb7dc786dbcf836723a5a1c63681e82888b14b4c2125015e623` |
| `domHelpersContainerVisibility` | `js/content/dom_helpers.js:154` | 154 | 53 | 2,177 | `d3018c075d23c41add85406382b4f6dc2327cb031c96935db0fdecfe5edcf91d` |
| `domFallbackExplicitHidden` | `js/content/dom_fallback.js:991` | 991 | 58 | 2,864 | `341302faf4f61e9fbabe2df16b59992a8bf41dadf2cb4b0017133599812be604` |
| `domFallbackHasActiveWork` | `js/content/dom_fallback.js:2117` | 2,117 | 68 | 2,333 | `394f7a99044dcf8da10d631b5b7ec216235c427228f78d53583ebb07cbb0d583` |
| `domFallbackStaleVisibilityCleanup` | `js/content/dom_fallback.js:2185` | 2,185 | 33 | 1,412 | `c43b2bb0bdcaa495f1c077b5c164d5666d2ed74ff334afb5ddd41dd217fe8412` |
| `domFallbackApplyRunHead` | `js/content/dom_fallback.js:2219` | 2,219 | 64 | 2,243 | `8e805dd33b290db7a08670645553b014a46341cb527c005f19b2c28f348dffba` |
| `domFallbackApplyScrollAndWatchCleanup` | `js/content/dom_fallback.js:2283` | 2,283 | 69 | 2,984 | `a4803cbae26b8d2228c1c17bca16f9fe027d02183d2b6d1b76703da1e4b1c353` |
| `domFallbackDisabledCleanup` | `js/content/dom_fallback.js:2487` | 2,487 | 18 | 791 | `474b2c2aef51cf0bf4cf8fefca5d8419b72ee094d037be5586bf49b7f5bdc63f` |
| `domFallbackApplyScrollRestore` | `js/content/dom_fallback.js:4619` | 4,619 | 22 | 893 | `62ffc9b810d4515e5db8da3ccd9e98c6c4cbbae2b90fd8778ce647d816fb5508` |
| `domFallbackApplyFinally` | `js/content/dom_fallback.js:4714` | 4,714 | 11 | 342 | `068457333a32e3b43aa59be0d1172964832201c6a6602121440e95ba3ebbf37e` |

DOM fallback run-state visibility cleanup source/effect blocks pinned: 10

## Selected Token Counts

Counts below are over the pinned source/effect blocks, not whole files.

| Token | Count |
| --- | ---: |
| `filtertube-hidden` | 55 |
| `filtertube-hidden-shelf` | 11 |
| `data-filtertube-hidden` | 28 |
| `data-filtertube-whitelist-pending` | 8 |
| `data-filtertube-pending-category` | 6 |
| `data-filtertube-pending-upload-date` | 6 |
| `toggleVisibility(` | 7 |
| `skipStats` | 8 |
| `handleMediaPlayback` | 2 |
| `getFilteringTracker().reset` | 1 |
| `hasActiveDOMFallbackWork` | 2 |
| `listMode === 'whitelist'` | 4 |
| `settings.enabled === false` | 1 |
| `settings.filterKeywords` | 2 |
| `settings.filterChannels` | 1 |
| `settings.filterKeywordsComments` | 1 |
| `booleanFilterKeys` | 2 |
| `contentFilters?.duration?.enabled` | 1 |
| `categoryFilters?.enabled` | 1 |
| `clearStaleDOMFallbackVisibility` | 2 |
| `window.__filtertubeDomFallbackRunState` | 2 |
| `runState.running` | 3 |
| `runState.pending` | 3 |
| `runState.latestSettings` | 2 |
| `runState.latestOptions` | 2 |
| `setTimeout(resolve, 0)` | 1 |
| `setTimeout(() => applyDOMFallback` | 1 |
| `window.__filtertubeDomFallbackActiveRun` | 2 |
| `window.__filtertubeDomFallbackPerfState` | 4 |
| `window.__filtertubeScrollState` | 2 |
| `scrollState.listenerAttached` | 2 |
| `addEventListener('scroll'` | 1 |
| `allowPreserveScroll` | 2 |
| `didScrollDuringRun` | 2 |
| `isUserScrollingNow` | 2 |
| `scrollTo` | 5 |
| `document.location?.pathname || ''` | 1 |
| `path === '/feed/channels'` | 1 |
| `ensureContentControlStyles` | 0 |
| `contentControlStyle.textContent = ''` | 1 |
| `clearContentControlStyles` | 1 |
| `syncRouteScopedContentControls` | 1 |
| `delete window.__filtertubeDomFallbackActiveRun` | 1 |

Selected missing policy/report tokens over pinned blocks:

| Token | Count |
| --- | ---: |
| `domFallbackRunStateVisibilityCleanupContract` | 0 |
| `domFallbackRunStateReport` | 0 |
| `domFallbackStaleVisibilityCleanupPolicy` | 0 |
| `domFallbackScrollRestoreBudget` | 0 |
| `domFallbackPendingRerunBudget` | 0 |
| `domFallbackActiveWorkDecisionReport` | 0 |
| `domFallbackVisibilityOwnershipReport` | 0 |
| `domFallbackCleanupFixtureProvenance` | 0 |

## Current Behavior Pinned

`domHelpersToggleVisibility`: hiding adds `filtertube-hidden`, sets `data-filtertube-hidden="true"`, sets inline `display: none !important`, records hide/stat effects unless `skipStats` is true, and pauses media. Restoring removes `filtertube-hidden`, `filtertube-hidden-shelf`, `data-filtertube-hidden`, and `data-filtertube-whitelist-pending`, removes inline display, records restore/stat effects only for counted hides, and resumes media.

`domHelpersContainerVisibility`: container visibility is derived from child hidden classes/attributes and hidden ancestors. Empty containers that previously had children can gain `filtertube-hidden-shelf`; containers marked `data-filtertube-ignore-empty-hide="true"` are restored instead.

`domFallbackExplicitHidden`: explicitly hidden status requires a hidden class/attribute and either an explicit reason marker or a matching processed video id. Recycled rows without explicit markers are restored when their live video id differs from the stamped or processed id.

`domFallbackHasActiveWork`: disabled or missing settings return no active work. Exact whitelist mode, non-empty keyword/channel/comment lists, selected boolean toggles, enabled duration/upload-date/uppercase content filters, and category filters with `enabled === true` plus a non-empty `selected` list all count as active work.

`domFallbackStaleVisibilityCleanup`: stale cleanup queries hidden, shelf-hidden, whitelist-pending, pending-category, pending-upload-date, and hide-all-Shorts selectors; calls `toggleVisibility(el, false, '', true)`; removes pending attributes; clears hide-all-Shorts/ignore-empty-hide markers; and empties the content-control style node.

`domFallbackApplyRunHead`: `applyDOMFallback()` stores the latest settings/options, returns early with `runState.pending = true` when another run is active, marks `runState.running = true`, creates an active-run WeakMap, derives options, and clears stale visibility when there is no active work and the cleanup is due.

`domFallbackApplyScrollAndWatchCleanup`: the scroll listener is installed once on `window.__filtertubeScrollState`, user scrolling is treated as recent for 150 ms, scroll preservation is disabled for forced reprocess and active user scrolling, `/feed/channels` restores hidden/pending elements and returns, and whitelist watch metadata/buttons are restored before broad card work.

`domFallbackDisabledCleanup`: disabled settings call `clearContentControlStyles()`, restore currently hidden or pending elements, remove pending category/upload-date attributes, and return before video-card processing.

`domFallbackApplyScrollRestore`: scroll restoration only runs when preservation is allowed and no scroll happened during the run or within the recent-user-scroll window. It attempts `scrollingElement.scrollTo()` first and falls back to `window.scrollTo()`.

`domFallbackApplyFinally`: every run deletes `window.__filtertubeDomFallbackActiveRun`, sets `runState.running = false`, and if `runState.pending` was set, clears it and schedules `applyDOMFallback(runState.latestSettings, runState.latestOptions)` with a zero-delay timer.

## Runtime Fixtures

runtime DOM fallback run-state visibility cleanup fixtures: 6

- `toggleVisibility()` currently hides by class, data attribute, and inline display, and restores the same state.
- `isExplicitlyHiddenByFilterTube()` currently restores recycled hidden rows only when the row lacks an explicit reason marker and the live video id differs from the processed/stamped id.
- `hasActiveDOMFallbackWork()` currently treats disabled/empty blocklist and enabled-empty category filters as no-work, exact whitelist as work, and non-empty lists/toggles/enabled filters as work.
- `clearStaleDOMFallbackVisibility()` currently restores hidden/pending nodes with `skipStats`, removes pending attributes, and clears the content-control style node.
- `applyDOMFallback()` currently serializes overlapping runs through `window.__filtertubeDomFallbackRunState` and schedules a pending rerun from `finally`.
- `applyDOMFallback()` currently installs a single scroll listener and avoids restoring scroll while the user is actively scrolling.

## Risk Boundary

This boundary is high-risk for false-hide/leak and performance work. The same hidden markers are written by DOM fallback, content bridge, quick-block, playlist enrichment, comment filtering, and content controls; stale cleanup only covers selected marker families and selected no-work/disabled paths. A whitelist or JSON-first optimization that skips DOM fallback too aggressively could leak stale hidden rows. An optimization that does not skip it enough could keep paying broad selector work and pending reruns even when JSON made a no-work decision.

The current code also mixes visibility ownership: helper functions remove core hide markers, DOM fallback removes additional pending markers, and some direct writers set hidden attributes without going through the helper. That means future implementation work needs a cleanup/ownership policy before pruning fallback work, moving whitelist decisions, or making JSON filtering first-class.

## Future Proof Still Missing

This file does not close the implementation gate. DOM fallback run-state visibility cleanup still needs:

- a run-state and pending-rerun contract;
- a stale visibility cleanup policy by marker family;
- a scroll restoration budget and user-scroll policy;
- active-work/no-work decision reports;
- visibility ownership reports across DOM fallback, content bridge, quick-block, and playlist/comment writers;
- settings revision and dirty-key policies;
- selector budget reports for disabled, empty blocklist, empty whitelist, and JSON-first no-work cases;
- fixture provenance for recycled rows, feed/channels, watch metadata, and pending whitelist state;
- metric artifacts for no-work, cleanup, rerun, and broad selector paths.

No `domFallbackRunStateVisibilityCleanupContract`, `domFallbackRunStateReport`, `domFallbackStaleVisibilityCleanupPolicy`, `domFallbackScrollRestoreBudget`, `domFallbackPendingRerunBudget`, `domFallbackActiveWorkDecisionReport`, `domFallbackVisibilityOwnershipReport`, `domFallbackCleanupFixtureProvenance`, `domFallbackSelectorBudgetReport`, or `domFallbackMetricArtifact` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM fallback cleanup boundary can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
