# FilterTube JSON-First Video Meta Merge/Schema Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, metadata schema patch,
merge patch, storage patch, DOM patch, or permission to change JSON filtering
behavior.

## Purpose

This register records the current merge and schema boundary for learned
`videoMetaMap` rows. It extends the video metadata storage, revision,
profile/surface, and freshness/eviction proofs by pinning that different
producers and queues do not share one row merge contract before duration,
upload-date, or category metadata can affect JSON and DOM fallback decisions.

The current boundary is:

```text
content and background write paths replace per-video metadata rows with cleaned
duration/date/category objects, including null or blank fields for missing
properties. Filter logic locally merges incoming metadata into its settings map,
but its duplicate guard ignores category-only changes when length/date fields
match. The background legacy single-video message shape still omits category.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/background.js` | 6773 | 305166 | `b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_BACKGROUND_STORAGE_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_REVISION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_PROFILE_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_FRESHNESS_EVICTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CATEGORY_PARITY_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
video-meta merge/schema boundary source files: 3
video-meta merge/schema source/effect blocks: 8
content_bridge persistVideoMetaMapping block lines: 62
content_bridge persistVideoMetaMapping block bytes: 2792
content_bridge persistVideoMetaMapping delete token occurrences: 2
content_bridge persistVideoMetaMapping spread token occurrences: 1
content_bridge persistVideoMetaMapping lengthSeconds tokens: 11
content_bridge persistVideoMetaMapping category tokens: 8
content_bridge FilterTube_UpdateVideoMetaMap branch lines: 26
content_bridge FilterTube_UpdateVideoMetaMap branch bytes: 1025
content_bridge FilterTube_UpdateVideoMetaMap persist callsites: 1
content_bridge FilterTube_UpdateVideoMetaMap touch callsites: 2
content_bridge FilterTube_UpdateVideoMetaMap rerun callsites: 1
background updateVideoMetaMap receiver branch lines: 16
background updateVideoMetaMap receiver branch bytes: 596
background updateVideoMetaMap receiver entries tokens: 4
background updateVideoMetaMap receiver category tokens: 0
background updateVideoMetaMap receiver request.category tokens: 0
background enqueueVideoMetaMapUpdate block lines: 41
background enqueueVideoMetaMapUpdate block bytes: 1654
background enqueueVideoMetaMapUpdate delete token occurrences: 1
background enqueueVideoMetaMapUpdate spread token occurrences: 0
background enqueueVideoMetaMapUpdate clean tokens: 7
background enqueueVideoMetaMapUpdate category tokens: 6
background flushVideoMetaMapUpdates block lines: 21
background flushVideoMetaMapUpdates block bytes: 797
background compiler videoMetaMap pass-through block lines: 15
background compiler videoMetaMap pass-through block bytes: 912
filter_logic queueVideoMetaMapping block lines: 57
filter_logic queueVideoMetaMapping block bytes: 2359
filter_logic queueVideoMetaMapping category tokens: 7
filter_logic _registerVideoMetaMapping block lines: 28
filter_logic _registerVideoMetaMapping block bytes: 1217
filter_logic _registerVideoMetaMapping spread token occurrences: 2
filter_logic _registerVideoMetaMapping same tokens: 2
filter_logic _registerVideoMetaMapping category tokens: 0
filter_logic player video-meta harvest block lines: 16
filter_logic player video-meta harvest block bytes: 952
filter_logic player video-meta harvest category tokens: 5
runtime video-meta merge/schema fixtures: 5
runtime behavior changed: no
not completion proof for JSON-first video metadata merge/schema authority
```

## Current Merge/Schema Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Content persistence | `persistVideoMetaMapping()` creates a fixed four-field row and deletes an existing row before assigning the cleaned row. | Row merge contract that distinguishes absent fields, explicit empty fields, and replacement writes. |
| Content message receiver | `FilterTube_UpdateVideoMetaMap` accepts array or single payload shape, calls content persistence, touches matching DOM cards, and reruns DOM fallback only after a touch. | Message schema with producer class, row completeness, and allowed DOM side effects. |
| Background receiver | `updateVideoMetaMap` accepts `entries` arrays or a legacy single-video shape. The legacy single shape forwards length/date fields but not category. | Backward-compatible schema decision for category, row completeness, and legacy callers. |
| Background enqueue | `enqueueVideoMetaMapUpdate()` cleans to the fixed four-field row, deletes an existing cache row, replaces it with the clean row, and schedules storage flush. | Shared row merge policy between content, background cache, and storage flush. |
| Background flush | `flushVideoMetaMapUpdates()` deletes an existing stored row before assigning pending clean metadata. | Storage merge report that records field loss and update source. |
| Background compiler | `getCompiledSettings()` passes `items.videoMetaMap || {}` through, without normalizing row completeness or merging pending metadata. | Compiled payload schema manifest for metadata consumers. |
| Filter queue | `queueVideoMetaMapping()` signs and posts video id, duration, publish date, upload date, and category. | Dedupe policy tied to the same row merge contract used by storage. |
| Filter register | `_registerVideoMetaMapping()` merges incoming metadata into the local settings row, but the early same check compares only length, publish date, and upload date. | Category-aware and completeness-aware row equality decision. |

## Runtime Fixture Summary

The content persistence fixture proves a category-only row replaces an existing
complete row with `lengthSeconds: null`, blank dates, and the new category, then
sends the same partial clean row to background.

The background enqueue/flush fixture proves a category-only background update
replaces a complete loaded cache row and persists the replacement after flush.

The filter register category-only fixture proves a category-only change is
ignored when length, publish date, and upload date are unchanged.

The filter register partial-update fixture proves local filter logic can merge a
partial length-only row into its settings map while queueing only the partial
metadata object outward.

The background receiver fixture proves the current legacy single-video request
shape still has no `category: request.category` forwarding path.

## Risks Identified

- Reliability: content/background replacement writes can erase previously
  learned duration or date fields when a later producer knows only category.
- False-hide/leak: category-only updates can be suppressed inside filter logic,
  while category-only updates from content/background can erase duration/date
  metadata that other filters need.
- Performance: erased fields can cause later metadata fetch work or prevent
  satisfied-metadata no-work behavior.
- Code burden: row cleaning, local merge, message payload shape, cache
  replacement, storage flush, and compiler pass-through are split across three
  files with no shared metadata schema report.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstVideoMetaMergeSchemaContract
jsonFirstVideoMetaRowCompletenessReport
jsonFirstVideoMetaPartialUpdatePolicy
jsonFirstVideoMetaCategoryMergeDecision
jsonFirstVideoMetaFieldLossReport
jsonFirstVideoMetaLegacyMessageSchema
jsonFirstVideoMetaStorageMergeReport
jsonFirstVideoMetaConsumerSchemaDecision
jsonFirstVideoMetaMergeFixtureProvenance
jsonFirstVideoMetaMergeMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-video-meta-merge-schema-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first video
metadata gap into current row replacement, local merge, category-only equality,
legacy message shape, cache replacement, and storage flush behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this video metadata JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, video metadata fetch changes, cache
freshness changes, no-work changes, DOM rerun changes, or whitelist behavior
changes.
