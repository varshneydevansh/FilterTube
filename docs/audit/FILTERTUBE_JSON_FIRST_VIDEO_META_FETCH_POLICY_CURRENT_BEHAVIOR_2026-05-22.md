# FilterTube JSON-First Video Meta Fetch Policy - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, network patch, DOM
patch, settings patch, or permission to change JSON filtering behavior.

## Purpose

This register records the current watch-page video metadata fetch policy used
when JSON and DOM filtering need duration, upload/publish date, or category
metadata that is not already present in `videoMetaMap`. It extends the
video-meta DOM rerun, background storage, and category parity proofs by pinning
the callsite matrix and the scheduler behavior that turns metadata gaps into
same-origin watch HTML fetches.

The current boundary is:

```text
JSON category filtering and DOM fallback category/date/duration filtering can
ask scheduleVideoMetaFetch() for missing metadata. The scheduler validates the
video id, checks currentSettings.videoMetaMap for requested fields, applies a
per-video cooldown, dedupes queued/pending work, and fetches watch HTML with a
three-request concurrency limit. It does not emit a shared reason, route, rule,
or no-work budget report.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_DOM_RERUN_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_BACKGROUND_STORAGE_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CATEGORY_PARITY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_NETWORK_FETCH_REASON_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
video-meta fetch policy source files: 3
content_bridge scheduleVideoMetaFetch body lines: 76
content_bridge scheduleVideoMetaFetch body bytes: 2960
content_bridge scheduleVideoMetaFetch needDuration tokens: 8
content_bridge scheduleVideoMetaFetch needDates tokens: 8
content_bridge scheduleVideoMetaFetch needCategory tokens: 8
content_bridge scheduleVideoMetaFetch last attempt tokens: 5
content_bridge processWatchMetaFetchQueue body lines: 17
content_bridge processWatchMetaFetchQueue body bytes: 727
content_bridge fetchVideoMetaFromWatchUrl body lines: 98
content_bridge fetchVideoMetaFromWatchUrl body bytes: 3382
content_bridge fetchVideoMetaFromWatchUrl fetch callsites: 1
content_bridge fetchVideoMetaFromWatchUrl JSON.parse callsites: 1
content_bridge fetchVideoMetaFromWatchUrl persistence callsites: 1
content_bridge fetchVideoMetaFromWatchUrl DOM touch callsites: 1
content_bridge fetchVideoMetaFromWatchUrl DOM rerun callsites: 1
watch meta fetch concurrency limit: 3
watch meta fetch cooldown milliseconds: 60000
watch meta fetch attempt map cap: 3000
watch meta fetch attempt map trim count: 800
content_bridge scheduleVideoMetaFetch token occurrences: 1
DOM fallback scheduleVideoMetaFetch token occurrences: 8
filter_logic scheduleVideoMetaFetch token occurrences: 2
DOM fallback category fetch callsites: 1
DOM fallback upload-date fetch callsites: 1
DOM fallback explicit duration fetch callsites: 1
DOM fallback default duration fetch callsites: 1
filter_logic category fetch callsites: 1
runtime video-meta fetch policy fixtures: 4
runtime behavior changed: no
not completion proof for JSON-first video metadata fetch authority
```

## Current Callsite Matrix

| Caller | Current predicate before scheduling | Need flags passed | Current risk boundary |
| --- | --- | --- | --- |
| JSON engine category filters in `js/filter_logic.js` | Category filters enabled, selected list non-empty, renderer is in the video-renderer allowlist, valid JSON video id exists, and `videoMetaMap[videoId].category` is empty. | `{ needDuration: false, needDates: false, needCategory: true }` | A decision method can create metadata network demand while returning no hide decision for missing category. |
| DOM fallback category filters in `js/content/dom_fallback.js` | Category filters enabled, selected list non-empty, DOM card video id exists, and `videoMetaMap[videoId].category` is empty. | `{ needDuration: false, needDates: false, needCategory: true }` | DOM also creates pending category state in allow mode or on home/search, so fetch demand and pending marker state are coupled locally. |
| DOM fallback upload-date filters in `js/content/dom_fallback.js` | Upload-date filter enabled, no valid date is found in `videoMetaMap` or visible DOM text, and a card video id exists. | `{ needDuration: false, needDates: true }` | The fetch is scheduled before the later cutoff-validity check decides whether pending upload-date metadata is needed. |
| DOM fallback Kids duration path in `js/content/dom_fallback.js` | Duration filter enabled, DOM duration missing, metadata duration missing, and the host/card is Kids. | `{ needDuration: true, needDates: false, needCategory: false }` | The fetch scheduler can enqueue work that `fetchVideoMetaFromWatchUrl()` later drops on Kids hosts. |
| DOM fallback mix-like duration path in `js/content/dom_fallback.js` | Duration filter enabled, DOM duration missing, metadata duration missing, and card looks mix/radio-like. | default options | Default scheduler options mean `needDuration: true`, `needDates: false`, and `needCategory: false`. |

## Current Scheduler Behavior

| Area | Current behavior | Audit implication |
| --- | --- | --- |
| Video id admission | `scheduleVideoMetaFetch()` trims the id and accepts only eleven-character YouTube-style ids matching `/^[a-zA-Z0-9_-]{11}$/`. | Bad ids are dropped before cooldown, queue, or fetch state is touched. |
| Need flag defaults | Missing options default to duration-only metadata demand. Missing keys inside an options object default to duration true, dates false, and category false. | Callers that omit options create implicit duration fetch intent. |
| Cache satisfaction | Duration requires a positive numeric or digit-string `lengthSeconds`; dates require any parseable `uploadDate` or `publishDate`; category requires a non-empty trimmed string. | Existing metadata can skip fetch work only when it satisfies every requested field. |
| Cooldown and dedupe | The per-video attempt timestamp is checked before queued/pending maps. The timestamp is set before queued/pending dedupe returns. | Duplicate requests are suppressed, but cooldown state is not tied to a reason or need vector. |
| Queue and concurrency | Queued work stores only the video id. `processWatchMetaFetchQueue()` runs up to three active fetches and starts more as promises settle. | The fetch stage has no structured memory of which rule requested duration, dates, or category. |
| Watch HTML fetch | `fetchVideoMetaFromWatchUrl()` skips Kids hosts, fetches `https://www.youtube.com/watch?v=VIDEO_ID` with `credentials: 'same-origin'`, parses `ytInitialPlayerResponse`, persists non-empty fields, touches matching DOM, and reruns DOM fallback only after a touch. | Network activity, cache mutation, DOM touch, and DOM rerun happen without one shared metadata fetch report. |

## Runtime Fixture Summary

The callsite matrix fixture proves the current scheduler callers and need flags:
one JSON category callsite, one DOM category callsite, one DOM upload-date
callsite, one explicit DOM duration callsite, and one default DOM duration
callsite.

The scheduler fixture proves satisfied metadata skips work, invalid video ids
are rejected, duplicate same-video work is suppressed, default options request
duration metadata, and missing category/date/duration requests enqueue fetch
work.

The concurrency fixture proves only three watch metadata fetches start while
additional queued ids wait for active fetches to settle.

The watch-fetch fixture proves Kids hosts return before fetching, YouTube hosts
fetch watch HTML with same-origin credentials, parse player metadata, persist
length/date/category fields, touch DOM, and schedule a DOM rerun only when a DOM
target was touched.

## Risks Identified

- Reliability: the fetch queue stores video ids only, so the need vector and
  original rule reason are lost before fetch, persistence, touch, and rerun.
- False-hide/leak: JSON missing-category decisions fail open while DOM fallback
  can mark pending category/date metadata and later recheck cards.
- Performance: cooldown and concurrency caps exist, but there is no per-route,
  per-rule, or per-navigation fetch budget artifact.
- Code burden: fetch demand is split across JSON category logic, DOM fallback
  category/date/duration logic, content fetch scheduling, watch HTML parsing,
  content persistence, DOM touch, and background storage.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstVideoMetaFetchPolicyContract
jsonFirstVideoMetaFetchReasonMatrix
jsonFirstVideoMetaFetchBudgetReport
jsonFirstVideoMetaFetchCallsiteAuthority
jsonFirstVideoMetaFetchNeedFlagReport
jsonFirstVideoMetaFetchConcurrencyPolicy
jsonFirstVideoMetaFetchKidsPolicy
jsonFirstVideoMetaFetchMetricArtifact
jsonFirstVideoMetaFetchRevisionPolicy
jsonFirstVideoMetaFetchNoWorkBudget
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-video-meta-fetch-policy-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first video
metadata gap into the current fetch callsite matrix, need-flag policy,
cooldown/dedupe/concurrency behavior, watch HTML fetch behavior, and remaining
budget/report gaps only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this video metadata JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5830
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5830
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, video metadata fetch changes, cache
freshness changes, no-work changes, DOM rerun changes, or whitelist behavior
changes.
