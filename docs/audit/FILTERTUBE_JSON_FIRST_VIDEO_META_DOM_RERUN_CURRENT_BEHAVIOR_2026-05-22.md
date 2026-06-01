# FilterTube JSON-First Video Meta DOM Rerun - Current Behavior - 2026-05-22

Status: current-behavior register with a narrow no-op DOM work fix. Runtime
behavior changed only for duplicate video metadata page-message rows that do not
change the learned metadata map. This is not a broad JSON-first patch, timer
patch, network patch, or permission to change JSON filtering behavior.

## Purpose

This register records the current JSON/video metadata refresh path that feeds
duration, upload date, publish date, and category decisions back into the DOM
filtering pass. It extends the JSON-first consumer audit from stale-card marker
cleanup into the timer and processed-marker path used after video metadata is
learned.

The current boundary is:

```text
Video metadata can be learned from main-world messages or watch-page fetches,
stored in videoMetaMap, used by DOM fallback category/date/duration checks, and
then routed through a targeted DOM touch plus a debounced DOM fallback rerun.
The path is split across content_bridge, dom_fallback, and background storage
queues, with no shared video-meta effect report or timer registry yet.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_APPLICATION_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_MARKER_MATRIX_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_LIFECYCLE_EFFECT_BUDGET_CURRENT_BEHAVIOR_2026-05-20.md`

## Current Counts

```text
video-meta DOM rerun source files: 3
video-meta source/effect blocks: 8
persistVideoMetaMapping block lines: 62
persistVideoMetaMapping videoMetaMap token occurrences: 10
persistVideoMetaMapping runtime sendMessage callsites: 1
video-meta DOM rerun schedule block lines: 16
video-meta DOM rerun debounce milliseconds: 550
video-meta DOM rerun setTimeout callsites: 1
video-meta DOM rerun clearTimeout callsites: 1
touchDomForVideoMetaUpdate block lines: 57
touchDomForVideoMetaUpdate removeAttribute callsites: 3
touchDomForVideoMetaUpdate setAttribute callsites: 1
touchDomForVideoMetaUpdate querySelectorAll callsites: 2
watch meta fetch queue block lines: 101
watch meta fetch concurrency limit: 3
watch meta fetch cooldown milliseconds: 60000
fetchVideoMetaFromWatchUrl block lines: 98
fetchVideoMetaFromWatchUrl fetch callsites: 1
fetchVideoMetaFromWatchUrl JSON.parse callsites: 1
FilterTube_UpdateVideoMetaMap message branch lines: 26
FilterTube_UpdateVideoMetaMap branch touch call tokens: 2
DOM fallback category videoMetaMap block lines: 39
DOM fallback category scheduleVideoMetaFetch tokens in block: 2
background enqueueVideoMetaMapUpdate block lines: 41
background videoMetaMapFlushTimer token occurrences: 4
background videoMetaMap flush debounce milliseconds: 75
content_bridge touchDomForVideoMetaUpdate token occurrences: 4
content_bridge scheduleVideoMetaDomRerun token occurrences: 3
content_bridge persistVideoMetaMapping token occurrences: 3
content_bridge FilterTube_UpdateVideoMetaMap token occurrences: 1
dom_fallback scheduleVideoMetaFetch token occurrences: 8
dom_fallback videoMetaMap token occurrences: 10
background videoMetaMap token occurrences: 40
runtime video-meta DOM rerun fixtures: 5
runtime behavior changed: yes, duplicate video metadata page-message DOM touch suppression only
not completion proof for JSON-first video metadata authority
```

## Current Effect Path

| Step | Current owner | Current behavior | Risk boundary |
| --- | --- | --- | --- |
| Metadata persistence in content script | `persistVideoMetaMapping()` in `js/content_bridge.js` | Trims `videoId`, duration, dates, and category; skips empty or identical metadata; rewrites `currentSettings.videoMetaMap`; sends `updateVideoMetaMap` to background only when cleaned entries remain; returns changed video ids to the caller. | The caller gets changed ids but no structured revision value. |
| Targeted DOM touch | `touchDomForVideoMetaUpdate()` in `js/content_bridge.js` | Finds direct `[data-filtertube-video-id]` cards and matching watch/shorts anchors, stamps anchor cards with the video id, removes duration, processed, and last-processed markers, and clears cached channel metadata through helper if present. | It does not clear hidden, collaborator, blocked, or whitelist-pending markers. |
| DOM rerun timer | `scheduleVideoMetaDomRerun()` in `js/content_bridge.js` | Clears any pending rerun timer and schedules one `applyDOMFallback(null)` call after 550 ms. | Timer ownership is local; there is no central lifecycle registry or route pause policy. |
| Main-world update message | `handleMainWorldMessages()` in `js/content_bridge.js` | `FilterTube_UpdateVideoMetaMap` persists metadata, builds `changedVideoIds`, touches DOM only for changed non-empty video ids, and schedules a rerun only when at least one DOM node was touched. | A metadata update with no current DOM target can update maps without a rerun. |
| DOM fallback metadata demand | `applyDOMFallback()` in `js/content/dom_fallback.js` | Category filters read `effectiveSettings.videoMetaMap[videoId]`; when category is missing, they can schedule a metadata fetch and set pending behavior for allow mode or home/search. | Category fetch decisions are mixed into DOM filtering without a shared metadata fetch budget. |
| Watch-page metadata fetch | `scheduleVideoMetaFetch()` and `fetchVideoMetaFromWatchUrl()` in `js/content_bridge.js` | Fetches same-origin watch HTML outside Kids, parses `ytInitialPlayerResponse`, persists length/date/category fields, touches matching DOM, and schedules a rerun when touched. Queue concurrency is 3 and per-video cooldown is 60 seconds. | The fetch path is separate from the network snapshot producer/consumer audit and lacks metric artifacts. |
| Background storage flush | `enqueueVideoMetaMapUpdate()` and flush helpers in `js/background.js` | Normalizes metadata, updates in-memory caches, patches compiled main/kids settings, and schedules a storage flush after 75 ms. | Content-script rerun timing and background flush timing are not correlated by a shared revision. |

## Runtime Fixture Summary

The persistence fixture proves that cleaned video metadata is stored in
`currentSettings.videoMetaMap` and forwarded to background while empty metadata
rows are ignored.

The targeted DOM touch fixture proves that direct stamped cards and anchor-found
cards are touched, anchor-found cards receive `data-filtertube-video-id`, and
duration/processed/channel markers are cleared without touching hidden,
collaborator, blocked, or whitelist-pending markers.

The rerun timer fixture proves that a second schedule clears the first pending
timer and replaces it with a 550 ms timer that calls `applyDOMFallback(null)`.

The message fixture proves that `FilterTube_UpdateVideoMetaMap` persists and
touches DOM for changed entries, skips duplicate no-op metadata rows, schedules
a rerun only after a DOM touch, ignores empty payload arrays, and ignores
same-source `content_bridge` messages.

The fetch-queue fixture proves that already-satisfied metadata skips network
work, missing requested fields queue one watch metadata fetch, pending duplicate
requests do not enqueue another fetch, invalid ids are rejected, and cooldown
state is recorded before fetch execution.

## Risks Identified

- Reliability: metadata writes, DOM touch, DOM rerun, and background flush do
  not share a revision or explicit effect report.
- False-hide/leak: processed and duration markers are cleared, but hidden,
  collaborator, blocked, and whitelist-pending markers can remain on the same
  touched cards.
- Performance: duplicate metadata rows now skip DOM touch, but watch metadata
  fetch, changed-row DOM touch, and debounced fallback rerun still lack one
  metric artifact or no-work counter.
- Code burden: video metadata behavior is split across main-world messages,
  watch-page fetch parsing, DOM fallback reads, and background storage queues.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstVideoMetaDomRerunContract
jsonFirstVideoMetaDomTouchReport
jsonFirstVideoMetaFetchBudget
jsonFirstVideoMetaMessageEffectReport
jsonFirstVideoMetaMapPersistencePolicy
jsonFirstVideoMetaDomRerunTimerRegistry
jsonFirstVideoMetaFixtureProvenance
jsonFirstVideoMetaMetricArtifact
jsonFirstVideoMetaCategoryFetchPolicy
jsonFirstVideoMetaBackgroundFlushAuthority
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-video-meta-dom-rerun-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first
metadata and optimization gap into the current DOM touch, fetch queue, message,
timer, and background flush behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this video metadata JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, video metadata fetch changes, cache
freshness changes, no-work changes, DOM rerun changes, or whitelist behavior
changes.
