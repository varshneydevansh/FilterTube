# FilterTube JSON-First Video Meta Freshness/Eviction Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, storage patch, network
patch, eviction patch, or permission to change JSON filtering behavior.

## Purpose

This register records the current freshness and eviction boundary for learned
`videoMetaMap` rows. It extends the video metadata fetch, background storage,
no-work, revision-boundary, and profile/surface proofs by pinning that current
metadata rows do not carry an authoritative age, expiration, row provenance, or
stale-row decision before they suppress future fetches or affect duration,
upload-date, and category decisions.

The current boundary is:

```text
videoMetaMap rows are keyed by video id and cleaned to duration/date/category
fields on new writes. Parseable existing rows satisfy scheduler needs without
checking age or provenance. Eviction removes the first keys in Object.keys()
order when caps are exceeded. The watch fetch attempt cooldown is separate from
metadata freshness and does not expire stored rows.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |
| `js/background.js` | 6313 | 284710 | `46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb` |
| `js/filter_logic.js` | 3498 | 165151 | `4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_FETCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_BACKGROUND_STORAGE_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_REVISION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_PROFILE_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
video-meta freshness/eviction boundary source files: 3
video-meta freshness/eviction source/effect blocks: 10
content_bridge persistVideoMetaMapping block lines: 62
content_bridge persistVideoMetaMapping block bytes: 2792
content_bridge persistVideoMetaMapping Date.now callsites: 0
content_bridge persistVideoMetaMapping fetchedAt tokens: 0
content_bridge persistVideoMetaMapping updatedAt tokens: 0
content_bridge persistVideoMetaMapping expiresAt tokens: 0
content_bridge persistVideoMetaMapping Object.keys callsites: 1
content_bridge persistVideoMetaMapping eviction slice callsites: 1
content_bridge scheduleVideoMetaFetch block lines: 76
content_bridge scheduleVideoMetaFetch block bytes: 2960
content_bridge scheduleVideoMetaFetch Date.now callsites: 1
content_bridge scheduleVideoMetaFetch lastWatchMetaFetchAttempt tokens: 5
content_bridge scheduleVideoMetaFetch fetchedAt tokens: 0
content_bridge scheduleVideoMetaFetch updatedAt tokens: 0
content_bridge scheduleVideoMetaFetch expiresAt tokens: 0
content_bridge processWatchMetaFetchQueue block lines: 17
content_bridge processWatchMetaFetchQueue block bytes: 727
background ensureVideoMetaMapCache block lines: 19
background ensureVideoMetaMapCache block bytes: 685
background ensureVideoMetaMapCache fetchedAt tokens: 0
background enforceVideoMetaMapCap block lines: 13
background enforceVideoMetaMapCap block bytes: 376
background enforceVideoMetaMapCap Object.keys callsites: 1
background enforceVideoMetaMapCap eviction slice callsites: 1
background flushVideoMetaMapUpdates block lines: 21
background flushVideoMetaMapUpdates block bytes: 797
background enqueueVideoMetaMapUpdate block lines: 41
background enqueueVideoMetaMapUpdate block bytes: 1654
background enqueueVideoMetaMapUpdate fetchedAt tokens: 0
background enqueueVideoMetaMapUpdate updatedAt tokens: 0
background enqueueVideoMetaMapUpdate expiresAt tokens: 0
filter_logic queueVideoMetaMapping block lines: 57
filter_logic queueVideoMetaMapping block bytes: 2359
filter_logic queueVideoMetaMapping Date.now callsites: 1
filter_logic queueVideoMetaMapping seenVideoMetaUpdates tokens: 5
filter_logic queueVideoMetaMapping fetchedAt tokens: 0
filter_logic queueVideoMetaMapping updatedAt tokens: 0
filter_logic queueVideoMetaMapping expiresAt tokens: 0
filter_logic _registerVideoMetaMapping block lines: 28
filter_logic _registerVideoMetaMapping block bytes: 1217
filter_logic processed videoMetaMap pass-through lines: 3
filter_logic processed videoMetaMap pass-through bytes: 252
watch meta fetch cooldown milliseconds: 60000
watch meta fetch attempt map cap: 3000
watch meta fetch attempt map trim count: 800
videoMetaMap cap maximum entries: 2000
videoMetaMap cap eviction count: 500
runtime video-meta freshness/eviction fixtures: 5
runtime behavior changed: no
not completion proof for JSON-first video metadata freshness or eviction authority
```

## Current Freshness/Eviction Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Content persistence | `persistVideoMetaMapping()` cleans incoming rows to `lengthSeconds`, `publishDate`, `uploadDate`, and `category`. Freshness or provenance fields on the incoming row are not persisted for that row. | Row age, expiration, producer, profile, route, and reason report. |
| Content cap | After writes, `persistVideoMetaMapping()` deletes the first 500 `Object.keys(currentSettings.videoMetaMap)` when the map exceeds 2000 entries. | Eviction policy that can explain recency, source, profile, and active-consumer impact. |
| Scheduler satisfaction | `scheduleVideoMetaFetch()` treats a parseable duration/date/category row as satisfying requested needs, even if the row is old or has stale freshness metadata. | Fetch freshness gate with stale-row reasons and per-need revalidation policy. |
| Attempt cooldown | `lastWatchMetaFetchAttempt` uses `Date.now()` to throttle watch metadata fetch attempts for 60 seconds and trims the attempt map after 3000 entries. | Attempt cooldown report separated from stored metadata age and row expiration. |
| Background cache load | `ensureVideoMetaMapCache()` shallow-copies the stored top-level map and does not prune stale rows. | Background load policy that can reject, migrate, or annotate stale rows. |
| Background enqueue | `enqueueVideoMetaMapUpdate()` cleans new metadata to duration/date/category and patches loaded caches without writing age or provenance fields. | Background write schema with row provenance and update timestamp. |
| Background cap | `enforceVideoMetaMapCap()` deletes the first 500 object keys when the map exceeds 2000 entries. | Shared eviction policy with deterministic victim selection and metric artifacts. |
| Background flush | `flushVideoMetaMapUpdates()` rewrites pending entries and stores the map after cap enforcement; existing stale rows keep any extra fields they already had. | Storage rewrite report that distinguishes legacy row retention from new clean writes. |
| Filter queue | `queueVideoMetaMapping()` dedupes by video id plus duration/date/category only; freshness-only changes are ignored for queueing and the posted payload omits freshness fields. | Message schema and dedupe policy that includes freshness when it matters. |
| Filter preprocess | `_preprocessSettings()` passes `settings.videoMetaMap` through as a row map, with no age-filtered view. | Consumer freshness decision before JSON duration, date, or category use. |

## Runtime Fixture Summary

The content persistence fixture proves a row with `fetchedAt`, `updatedAt`,
`expiresAt`, and source-like fields is stored and messaged without those fields,
then the local cap deletes the first 500 object keys rather than the oldest
metadata rows.

The scheduler fixture proves an old row with parseable duration, upload date,
and category suppresses a watch metadata fetch and does not spend attempt
cooldown state.

The background load/flush fixture proves stored stale rows are loaded without
age pruning, legacy extra fields remain on existing rows, and new background
metadata writes are cleaned without freshness fields.

The background cap fixture proves first-key eviction can remove rows with newer
`fetchedAt` values while retaining later keys with older `fetchedAt` values.

The filter-logic queue fixture proves freshness-only metadata changes are
deduped away and the bridge message payload contains only video id,
duration/date/category fields.

## Risks Identified

- Reliability: a stale but parseable row can suppress future metadata fetches
  indefinitely for that video id.
- False-hide/leak: stale category, duration, or upload-date metadata can affect
  JSON and DOM fallback decisions without an age or provenance check.
- Performance: eviction can discard recently learned rows if they appear early
  in key order, which can increase later metadata fetch churn.
- Code burden: freshness, attempt cooldown, persistence cleanup, background
  cache load, background eviction, and filter queue dedupe are separate local
  behaviors rather than one metadata age/eviction contract.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstVideoMetaFreshnessEvictionContract
jsonFirstVideoMetaFreshnessReport
jsonFirstVideoMetaAgePolicy
jsonFirstVideoMetaRowProvenanceReport
jsonFirstVideoMetaFetchFreshnessGate
jsonFirstVideoMetaEvictionPolicyReport
jsonFirstVideoMetaAttemptCooldownReport
jsonFirstVideoMetaStaleRowFixtureProvenance
jsonFirstVideoMetaFreshnessMetricArtifact
jsonFirstVideoMetaConsumerFreshnessDecision
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-video-meta-freshness-eviction-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first video
metadata gap into current stale-row, attempt-cooldown, row-cleaning,
Object.keys-order eviction, queue-dedupe, and background-storage behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this video metadata JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, video metadata fetch changes, cache
freshness changes, no-work changes, DOM rerun changes, or whitelist behavior
changes.
