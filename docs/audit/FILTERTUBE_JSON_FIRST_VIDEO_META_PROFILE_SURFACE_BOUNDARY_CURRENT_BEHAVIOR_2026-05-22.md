# FilterTube JSON-First Video Meta Profile/Surface Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, profile patch, Kids
patch, DOM patch, network patch, or permission to change JSON filtering
behavior.

## Purpose

This register records the current profile, surface, route, and host boundary
for learned `videoMetaMap` rows. It extends the video metadata fetch,
background storage, no-work, content parity, and revision-boundary proofs by
pinning that current metadata rows are global per video id, even when consumers
run under Main, Kids, whitelist, blocklist, watch, search, or home surfaces.

The current boundary is:

```text
videoMetaMap is not partitioned by active profile, profile type, list mode,
route, host, or surface. Some producers and consumers have local route/host
checks, but there is no shared video metadata profile/surface permission report
before duration, upload-date, or category metadata can affect decisions.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/background.js` | 6773 | 305166 | `b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_FETCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_REVISION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_PROFILE_VIEWING_SPACE_AUTHORITY_CURRENT_BEHAVIOR_2026-05-21.md`

## Current Counts

```text
video-meta profile/surface boundary source files: 4
content_bridge persistVideoMetaMapping block lines: 62
content_bridge persistVideoMetaMapping block bytes: 2792
content_bridge persistVideoMetaMapping videoMetaMap tokens: 9
content_bridge persistVideoMetaMapping currentSettings tokens: 11
content_bridge persistVideoMetaMapping profile tokens: 0
content_bridge persistVideoMetaMapping listMode tokens: 0
content_bridge persistVideoMetaMapping sendMessage callsites: 1
content_bridge scheduleVideoMetaFetch block lines: 76
content_bridge scheduleVideoMetaFetch block bytes: 2960
content_bridge scheduleVideoMetaFetch currentSettings tokens: 1
content_bridge scheduleVideoMetaFetch profile tokens: 0
content_bridge scheduleVideoMetaFetch listMode tokens: 0
content_bridge fetchVideoMetaFromWatchUrl block lines: 98
content_bridge fetchVideoMetaFromWatchUrl block bytes: 3382
content_bridge fetchVideoMetaFromWatchUrl hostname tokens: 1
content_bridge fetchVideoMetaFromWatchUrl youtubekids tokens: 1
content_bridge FilterTube_UpdateVideoMetaMap branch lines: 27
content_bridge FilterTube_UpdateVideoMetaMap branch bytes: 924
background getCompiledSettings target-profile block lines: 3
background getCompiledSettings target-profile block bytes: 246
background getCompiledSettings target-profile profileType tokens: 2
background getCompiledSettings target-profile isKidsUrl tokens: 1
background getCompiledSettings receiver branch lines: 24
background getCompiledSettings receiver branch bytes: 1469
background getCompiledSettings receiver profileType tokens: 7
background getCompiledSettings receiver compiledSettingsCache tokens: 3
background compiler videoMetaMap pass-through block lines: 15
background compiler videoMetaMap pass-through block bytes: 912
background enqueueVideoMetaMapUpdate block lines: 41
background enqueueVideoMetaMapUpdate block bytes: 1654
background enqueueVideoMetaMapUpdate compiledSettingsCache tokens: 6
filter_logic processed videoMetaMap pass-through lines: 3
filter_logic processed videoMetaMap pass-through bytes: 252
filter_logic _registerVideoMetaMapping block lines: 28
filter_logic _registerVideoMetaMapping block bytes: 1217
filter_logic _checkCategoryFilters block lines: 57
filter_logic _checkCategoryFilters block bytes: 2683
filter_logic duration videoMetaMap fallback lines: 7
filter_logic duration videoMetaMap fallback bytes: 464
filter_logic published-date videoMetaMap fallback lines: 11
filter_logic published-date videoMetaMap fallback bytes: 672
DOM fallback category videoMetaMap block lines: 39
DOM fallback category videoMetaMap block bytes: 2136
DOM fallback upload-date videoMetaMap block lines: 170
DOM fallback upload-date videoMetaMap block bytes: 9701
DOM fallback duration videoMetaMap block lines: 71
DOM fallback duration videoMetaMap block bytes: 4492
DOM fallback duration youtubekids tokens: 1
runtime video-meta profile/surface fixtures: 5
runtime behavior changed: no
not completion proof for JSON-first video metadata profile/surface authority
```

## Current Profile/Surface Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Content persistence | `persistVideoMetaMapping()` mutates `currentSettings.videoMetaMap` and sends `updateVideoMetaMap` without checking `enabled`, `profileType`, `listMode`, route, host, or active profile id. | Per-row profile/surface permission and settings-state report. |
| Scheduler admission | `scheduleVideoMetaFetch()` checks video id, existing metadata fields, cooldown, pending, and queue state, but not profile, list mode, route, host, or Kids surface. | Fetch admission decision that separates active metadata need from surface permission. |
| Watch fetch host guard | `fetchVideoMetaFromWatchUrl()` returns before network fetch on `youtubekids.com`, after scheduler admission and cooldown state can already be spent. | Producer-side Kids policy and no-work metric that covers admission and fetch separately. |
| Background compile | `getCompiledSettings()` selects Main or Kids by requested profile or sender URL, but assigns `compiledSettings.videoMetaMap = items.videoMetaMap || {}` for both profiles. | Profile-partitioned metadata map or explicit global-row permission report. |
| Background cache patch | `enqueueVideoMetaMapUpdate()` patches loaded metadata and points both Main and Kids compiled caches at the same loaded map when caches exist. | Cache update report that declares affected profiles and invalidation scope. |
| Filter logic preprocess | `_preprocessSettings()` passes `settings.videoMetaMap` by reference, with no profile/list-mode scoped view. | Consumer permission decision before JSON category, duration, or upload-date use. |
| JSON consumers | `_checkCategoryFilters()`, `_extractDuration()`, and `_extractPublishedTime()` read metadata by video id from the active settings object. | Profile/surface freshness, row provenance, and reason report per metadata decision. |
| DOM fallback consumers | Category, upload-date, and duration fallback blocks read `effectiveSettings.videoMetaMap` by video id, while route and Kids checks are local to specific branches. | Shared DOM/JSON parity contract for profile, host, route, and list-mode metadata use. |

## Runtime Fixture Summary

The content persistence fixture proves a Kids/whitelist/disabled
`currentSettings` object still accepts a metadata row, mutates its global
`videoMetaMap`, and sends a background update with no row-level profile or
surface fields.

The scheduler/fetch fixture proves Kids-host scheduling is admitted before the
watch fetch host guard: the scheduler can spend cooldown/pending state under a
Kids hostname, while the actual watch fetch returns without calling network.

The background fixture proves one cleaned metadata row is assigned to both Main
and Kids compiled caches through the same unpartitioned map reference.

The filter-logic fixture proves profile/list-mode fields do not create a
scoped metadata view: preprocessed settings retain the same `videoMetaMap`
object and JSON category filtering can use it under a Kids profile.

The DOM fallback fixture proves route-local category logic can read a global
metadata row from `effectiveSettings.videoMetaMap` and make an allow/block
decision without a metadata profile/surface authority object.

## Risks Identified

- Reliability: a metadata row learned under one host, route, or profile can
  suppress fetches or affect filtering after a profile/surface transition.
- False-hide/leak: duration, upload-date, and category decisions can use a
  global row when the active profile or Kids/Main surface has not authorized
  that row.
- Performance: Kids-host metadata scheduling can still spend admission,
  cooldown, queue, and pending work before the host-level fetch guard exits.
- Code burden: profile and surface checks are split across scheduler, fetch,
  background compile, filter logic, and DOM fallback branches instead of a
  single metadata permission report.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstVideoMetaProfileSurfaceContract
jsonFirstVideoMetaProfileScopeReport
jsonFirstVideoMetaSurfacePermissionReport
jsonFirstVideoMetaKidsPolicy
jsonFirstVideoMetaListModePolicy
jsonFirstVideoMetaSettingsGate
jsonFirstVideoMetaConsumerPermissionDecision
jsonFirstVideoMetaFetchSurfaceBudget
jsonFirstVideoMetaProfileFixtureProvenance
jsonFirstVideoMetaProfileMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-video-meta-profile-surface-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first video
metadata gap into current global per-video metadata behavior, local profile and
surface guard placement, and remaining profile/surface authority gaps only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this profile/settings/UI surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 72
method semantic proof gap lexical callables covered: 6118
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6118
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
