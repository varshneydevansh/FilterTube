# FilterTube JSON-First Video Meta Revision Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, storage patch, message
patch, profile patch, DOM patch, or permission to change JSON filtering
behavior.

## Purpose

This register records the current revision and provenance boundary for
`videoMetaMap` rows after they are harvested from JSON/player metadata or watch
HTML fetches. It extends the video metadata background storage, content parity,
fetch policy, and no-work budget proofs by pinning that current metadata rows
carry cleaned duration/date/category fields only, not the settings revision,
profile, route, caller, or fetch reason that produced them.

The current boundary is:

```text
videoMetaMap rows are global per video id. Content-side persistence, filter
logic queueing, background storage, compiled settings pass-through, and JSON/DOM
consumers do not attach or validate a settings revision, active profile, route,
surface, caller reason, or capture provenance before applying metadata.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_BACKGROUND_STORAGE_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_FETCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_COMPILED_SETTINGS_FIELD_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
video-meta revision boundary source files: 3
content_bridge persistVideoMetaMapping block lines: 62
content_bridge persistVideoMetaMapping block bytes: 2792
content_bridge persistVideoMetaMapping videoMetaMap tokens: 9
content_bridge persistVideoMetaMapping currentSettings tokens: 11
content_bridge persistVideoMetaMapping sendMessage callsites: 1
content_bridge persistVideoMetaMapping revision tokens: 0
content_bridge FilterTube_UpdateVideoMetaMap branch lines: 5
content_bridge FilterTube_UpdateVideoMetaMap branch bytes: 227
background enqueueVideoMetaMapUpdate block lines: 41
background enqueueVideoMetaMapUpdate block bytes: 1654
background enqueueVideoMetaMapUpdate videoMetaMap tokens: 11
background enqueueVideoMetaMapUpdate compiledSettingsCache tokens: 6
background enqueueVideoMetaMapUpdate revision tokens: 0
background updateVideoMetaMap receiver branch lines: 16
background updateVideoMetaMap receiver branch bytes: 596
background compiler videoMetaMap pass-through block lines: 15
background compiler videoMetaMap pass-through block bytes: 912
filter_logic queueVideoMetaMapping block lines: 57
filter_logic queueVideoMetaMapping block bytes: 2359
filter_logic queueVideoMetaMapping seenVideoMetaUpdates tokens: 5
filter_logic queueVideoMetaMapping pendingVideoMetaUpdates tokens: 4
filter_logic queueVideoMetaMapping postMessage callsites: 1
filter_logic queueVideoMetaMapping revision tokens: 0
filter_logic processed videoMetaMap pass-through lines: 3
filter_logic processed videoMetaMap pass-through bytes: 240
runtime video-meta revision boundary fixtures: 4
runtime behavior changed: no
not completion proof for JSON-first video metadata revision authority
```

## Current Revision Matrix

| Boundary | Current accepted input | Current output | Missing proof gate |
| --- | --- | --- | --- |
| Filter logic metadata queue | `videoId`, `lengthSeconds`, `publishDate`, `uploadDate`, and `category` from renderer/player metadata harvesting | Posts a batch with only those fields plus page-message `source: "filter_logic"` outside each row | No settings revision, profile, route, endpoint family, or source-root id is part of the row signature. |
| Content bridge persistence | Array of metadata entries from fetch or page message | Mutates `currentSettings.videoMetaMap`, evicts old rows by insertion order, and sends `updateVideoMetaMap` to background | Disabled/current settings, profile, surface, route, caller, and fetch reason are not checked before local mutation. |
| Content bridge update message | `FilterTube_UpdateVideoMetaMap` page message payload | Calls `persistVideoMetaMapping`, then clears DOM markers for each video id and can schedule a DOM rerun | No message revision, pending request ownership, or settings snapshot is required. |
| Background update receiver | `updateVideoMetaMap` runtime message entries or legacy single-video fields | Calls `enqueueVideoMetaMapUpdate` for each row | No sender class, profile type, active profile id, settings revision, or route gate is checked in this branch. |
| Background cache patch | Clean metadata row plus optional loaded cache | Patches `videoMetaMapCache` and assigns the same cache reference into both `compiledSettingsCache.main.videoMetaMap` and `compiledSettingsCache.kids.videoMetaMap` when present | No profile-scoped metadata map or revision report exists before compiled caches consume the row. |
| Compiled settings pass-through | Storage `items.videoMetaMap` | Assigns `compiledSettings.videoMetaMap = items.videoMetaMap || {}` | No copy, revision field, freshness bound, or profile/surface partition is attached. |
| JSON and DOM consumers | Effective settings `videoMetaMap` | Read category, duration, and upload-date metadata by video id | Consumers cannot distinguish fresh, stale, profile-mismatched, route-mismatched, or synthetic metadata rows. |

## Runtime Fixture Summary

The content persistence fixture proves `persistVideoMetaMapping()` mutates a
disabled `currentSettings` object, strips extra revision/provenance fields from
the saved row, and sends only cleaned metadata fields to the background.

The filter logic queue fixture proves `queueVideoMetaMapping()` dedupes by
video id and metadata value signature, ignores caller-supplied revision fields,
and posts a batch without per-row revision or profile fields.

The background cache fixture proves `enqueueVideoMetaMapUpdate()` strips extra
revision/profile fields, patches the loaded metadata cache, and points both
main and kids compiled caches at the same unpartitioned `videoMetaMap`.

The consumer fixture proves compiled settings and filter-logic preprocessing
pass the map object through by reference instead of producing a revision-stamped
or profile-scoped metadata view.

## Risks Identified

- Reliability: metadata fetched under one settings/profile/route state can be
  consumed later after settings change without a structured freshness decision.
- False-hide/leak: duration, upload-date, and category decisions can use global
  per-video metadata without proving the row belongs to the active surface.
- Performance: stale accepted metadata can suppress future fetch work because
  scheduler satisfaction checks only field presence, not row freshness.
- Code burden: revision-sensitive behavior is split across page-message
  batching, content settings mutation, background cache mutation, compiled
  settings pass-through, and JSON/DOM consumers.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstVideoMetaRevisionBoundaryContract
jsonFirstVideoMetaRevisionReport
jsonFirstVideoMetaSettingsRevisionPolicy
jsonFirstVideoMetaProfileScopePolicy
jsonFirstVideoMetaSourceProvenanceReport
jsonFirstVideoMetaMessageRevisionGate
jsonFirstVideoMetaBackgroundRevisionGate
jsonFirstVideoMetaConsumerRevisionDecision
jsonFirstVideoMetaRevisionFixtureProvenance
jsonFirstVideoMetaRevisionMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-video-meta-revision-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first video
metadata gap into current revision-less queueing, persistence, background cache
patching, compiled pass-through, consumer application, and remaining revision
authority gaps only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this video metadata JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, video metadata fetch changes, cache
freshness changes, no-work changes, DOM rerun changes, or whitelist behavior
changes.
