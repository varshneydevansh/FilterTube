# FilterTube JSON-First Video Meta Category Parity - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, category-filter patch,
storage patch, DOM patch, or permission to change JSON filtering behavior.

## Purpose

This register records the current category-filter decision path after video
metadata is available through `videoMetaMap`. It extends the video-meta DOM
rerun and background storage proof by pinning the exact current split between
the JSON engine category decision and the DOM fallback category decision.

The current boundary is:

```text
Both the JSON engine and DOM fallback read category metadata from videoMetaMap,
but the missing-category behavior differs. The JSON engine schedules metadata
fetch work and returns no hide decision, while DOM fallback can also mark cards
as pending category metadata in allow mode or on home/search routes.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_DOM_RERUN_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_BACKGROUND_STORAGE_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md`
- `docs/audit/FILTERTUBE_P0_CONTENT_CATEGORY_CURRENT_BEHAVIOR_2026-05-19.md`

## Current Counts

```text
video-meta category parity source files: 3
filter_logic category method block lines: 57
filter_logic category method block bytes: 2683
filter_logic category method videoMetaMap tokens: 3
filter_logic category method scheduleVideoMetaFetch tokens: 2
filter_logic category method category tokens: 9
filter_logic category renderer allowlist entries: 19
filter_logic content/category call block lines: 12
DOM fallback category block lines: 39
DOM fallback category block bytes: 2136
DOM fallback category block videoMetaMap tokens: 3
DOM fallback category block scheduleVideoMetaFetch tokens: 2
DOM fallback category block category tokens: 10
DOM fallback category block pendingCategory tokens: 2
DOM fallback pending metadata block lines: 75
DOM fallback pending metadata block bytes: 4103
DOM fallback pending metadata setTimeout callsites: 2
DOM fallback pending category attribute tokens: 6
DOM fallback category marker block lines: 8
DOM fallback category marker block bytes: 333
DOM fallback category marker attribute tokens: 2
content_bridge scheduleVideoMetaFetch function lines: 94
content_bridge scheduleVideoMetaFetch function bytes: 3689
content_bridge scheduleVideoMetaFetch category tokens: 4
runtime video-meta category parity fixtures: 4
runtime behavior changed: no
not completion proof for JSON-first video metadata category authority
```

## Current Decision Matrix

| Consumer | Current input | Missing category behavior | Present category behavior | Risk boundary |
| --- | --- | --- | --- | --- |
| JSON engine `_checkCategoryFilters()` | Renderer item, rules, `settings.videoMetaMap`, selected categories, mode | Schedules `scheduleVideoMetaFetch(videoId, { needCategory: true })` when available, then returns `false`. | In block mode, selected category returns `true`; in allow mode, category outside the selected set returns `true`. | Missing metadata is fail-open for the JSON engine even in allow mode. |
| DOM fallback category block | DOM card, `effectiveSettings.videoMetaMap`, route path, selected categories, mode | Schedules category fetch. It also sets `pendingCategoryMeta` in allow mode or on `/` and `/results`. | Uses the same selected-category block/allow decision as the JSON engine once category text exists. | Pending metadata changes DOM marker state and can drive a later recheck timer. |
| DOM pending metadata block | `pendingCategoryMeta`, `shouldHide`, `targetToHide`, `Date.now()` | When pending metadata is the only reason, writes `data-filtertube-pending-category`, stamps a timestamp, and schedules one recheck at `8000 + 120` ms. | Removes pending category markers when not pending-only or when the previous timestamp has expired. | This marker/timer policy is local to DOM fallback. |
| DOM category marker block | `hideByCategory`, `shouldHide`, `targetToHide` | No category-hidden marker is written while metadata is only pending. | Writes `data-filtertube-hidden-by-category` only when the category decision is a hide and the final card decision still hides. | Hidden marker ownership is separate from pending marker ownership. |
| Watch metadata fetch scheduler | `scheduleVideoMetaFetch()` in `js/content_bridge.js` | Category requests are skipped when existing metadata already has a non-empty category. | Missing requested category can enqueue watch metadata fetch work subject to per-video queue and cooldown state. | Fetch demand is separate from JSON/DOM category decision reporting. |

## Runtime Fixture Summary

The JSON engine fixture proves current block mode hides selected categories,
allow mode hides unselected categories, unsupported renderers do not run the
category decision, and missing category metadata schedules one metadata fetch
while returning no hide decision.

The DOM category fixture proves DOM fallback uses the same selected-category
block/allow decision when metadata exists, but missing category metadata also
creates a pending category state in allow mode or on home/search routes.

The pending marker fixture proves a pending category-only state writes
`data-filtertube-pending-category`, writes a timestamp, schedules a recheck at
8120 ms, and clears stale or non-pending markers.

The category hidden-marker fixture proves `data-filtertube-hidden-by-category`
is written only when `hideByCategory` and `shouldHide` are both true.

## Risks Identified

- Reliability: JSON category decisions, DOM category pending state, fetch
  scheduling, and background metadata storage do not share one category effect
  report or revision.
- False-hide/leak: JSON missing-category behavior is fail-open, while DOM
  fallback can hold pending markers before a later recheck.
- Performance: category metadata fetch demand, pending-marker timer work, and
  DOM fallback reruns lack one no-work budget.
- Code burden: category filtering is split across `filter_logic.js`,
  `dom_fallback.js`, `content_bridge.js`, and background `videoMetaMap`
  storage proofs.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstVideoMetaCategoryParityContract
jsonFirstVideoMetaJsonDomCategoryDecisionReport
jsonFirstVideoMetaCategoryPendingPolicy
jsonFirstVideoMetaCategoryMarkerReport
jsonFirstVideoMetaCategoryFetchPolicy
jsonFirstVideoMetaCategoryNoWorkBudget
jsonFirstVideoMetaCategoryFixtureProvenance
jsonFirstVideoMetaCategoryMetricArtifact
jsonFirstVideoMetaCategoryAllowBlockParity
jsonFirstVideoMetaCategoryRevisionPolicy
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-video-meta-category-parity-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first video
metadata gap into the current JSON engine category decision, DOM fallback
category decision, pending marker, hidden marker, and fetch-demand behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this video metadata JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, video metadata fetch changes, cache
freshness changes, no-work changes, DOM rerun changes, or whitelist behavior
changes.
