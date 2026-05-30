# FilterTube JSON-First Video Meta No-Work Budget - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, scheduler patch, DOM
patch, network patch, storage patch, or permission to change JSON filtering
behavior.

## Purpose

This register records the current no-work and over-work boundaries for
JSON-first video metadata fetch scheduling. It extends the video metadata fetch
policy and content parity proofs by pinning where the current runtime avoids
watch-page metadata fetch work, where it admits work before a later content
decision can use it, and where need flags are lost before the watch fetch runs.

The current boundary is:

```text
scheduleVideoMetaFetch can skip invalid video ids, fully satisfied metadata
needs, and explicit all-false need flags before touching the cooldown map.
Once work is admitted, the queue stores only video ids, not the reason or need
flags. DOM upload-date and duration callsites can still schedule fetch work
before a final content decision proves that metadata is needed.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |
| `js/filter_logic.js` | 3498 | 165151 | `4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_FETCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CATEGORY_PARITY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
video-meta no-work budget source files: 3
content_bridge scheduleVideoMetaFetch body lines: 76
content_bridge scheduleVideoMetaFetch body bytes: 2960
content_bridge scheduleVideoMetaFetch Date.now callsites: 1
content_bridge scheduleVideoMetaFetch last-attempt get callsites: 1
content_bridge scheduleVideoMetaFetch last-attempt set callsites: 1
content_bridge scheduleVideoMetaFetch pending has callsites: 1
content_bridge scheduleVideoMetaFetch queued has callsites: 1
content_bridge scheduleVideoMetaFetch queue push callsites: 1
content_bridge scheduleVideoMetaFetch process queue callsites: 1
content_bridge scheduleVideoMetaFetch needDuration tokens: 8
content_bridge scheduleVideoMetaFetch needDates tokens: 8
content_bridge scheduleVideoMetaFetch needCategory tokens: 8
content_bridge processWatchMetaFetchQueue body lines: 17
content_bridge processWatchMetaFetchQueue body bytes: 727
content_bridge queue-to-fetch option forwarding callsites: 0
content_bridge queue-to-fetch video-id-only callsites: 1
content_bridge fetchVideoMetaFromWatchUrl body lines: 98
content_bridge fetchVideoMetaFromWatchUrl body bytes: 3382
DOM fallback upload-date block lines: 170
DOM fallback upload-date block bytes: 9701
DOM fallback upload-date Date.now callsites: 1
DOM fallback upload-date fetch schedule callsites: 1
DOM fallback upload-date didScheduleMetaFetch tokens: 1
DOM fallback upload-date needsTimestamp tokens: 2
DOM fallback duration block lines: 71
DOM fallback duration block bytes: 4480
DOM fallback explicit duration fetch callsites: 1
DOM fallback default duration fetch callsites: 1
filter_logic category method block lines: 57
filter_logic category method block bytes: 2683
filter_logic category selected-empty guard callsites: 1
runtime video-meta no-work budget fixtures: 5
runtime behavior changed: no
not completion proof for JSON-first video metadata no-work authority
```

## Current No-Work Matrix

| Boundary | Current no-work behavior | Current admitted-work behavior | Risk boundary |
| --- | --- | --- | --- |
| Invalid video id | A non-string, empty, trimmed-empty, or non-11-character id returns before timestamp, cooldown, queue, or fetch work. | None. | The id policy is local regex logic and not reported as a structured denial. |
| Metadata satisfaction | If all requested fields are already present in `currentSettings.videoMetaMap`, scheduling returns before `Date.now()` and the cooldown map. | If any requested field is missing, scheduling can enter cooldown and queue work. | Satisfaction is checked only against three coarse field families: duration, dates, and category. |
| All-false need flags | An options object with `needDuration`, `needDates`, and `needCategory` all false returns before timestamp or queue work even without metadata. | Omitted options default to `needDuration: true`, `needDates: false`, and `needCategory: false`. | A no-options call is not a reason-free no-op; it is a duration request. |
| Queue admission | The queue stores only the video id and later calls `fetchVideoMetaFromWatchUrl(nextVideoId)`. | Need flags, reason, caller, route, settings revision, and content condition are not forwarded into the watch fetch. | Fetch work cannot currently prove which caller or metadata field caused the fetch. |
| Cooldown and duplicate state | Cooldown is checked before pending/queued duplicate checks when the prior attempt is fresh. | When the prior attempt is old but the video is still pending, the duplicate call refreshes `lastWatchMetaFetchAttempt` before returning. | A duplicate pending call can extend the retry window without creating a new fetch. |
| DOM upload-date callsite | Pending upload-date state is set only after a valid cutoff/range is proven. | Missing upload-date metadata schedules a date fetch before the later cutoff-validity check. | Blank or invalid cutoff fields can still admit metadata fetch work. |
| DOM duration callsites | Present DOM duration or cached `lengthSeconds` avoids duration fetch scheduling. | Missing duration can schedule an explicit Kids duration request or a no-options mix-like request that defaults to duration. | Kids requests may be admitted before the watch fetcher returns early on Kids hosts; mix-like requests do not preserve caller reason. |

## Runtime Fixture Summary

The scheduler no-work fixture proves invalid ids, satisfied metadata needs, and
explicit all-false need flags return before `Date.now()`, cooldown, queue, or
fetch work.

The scheduler need-loss fixture proves a no-options call defaults to duration
work, and queued fetch execution receives only the video id rather than the
need flags that admitted the request.

The duplicate pending fixture proves a duplicate call after the cooldown window
but while a fetch remains pending refreshes `lastWatchMetaFetchAttempt`, then a
later call inside that refreshed window is blocked.

The DOM upload-date fixture proves a missing timestamp schedules date metadata
fetch work even when blank cutoff fields prevent pending upload-date state.

The DOM duration fixture proves a mix-like DOM card with no visible or cached
duration schedules a no-options metadata fetch, which currently becomes a
duration request in the shared scheduler.

## Risks Identified

- Reliability: admitted metadata work has no structured reason, route, content
  condition, settings revision, or field-level decision report.
- False-hide/leak: upload-date missing-metadata behavior differs between JSON
  engine fail-open decisions, DOM pending markers, and playlist-row hide
  behavior.
- Performance: blank upload-date cutoffs can still schedule date fetches, and
  duplicate pending calls can refresh cooldown state without starting useful
  work.
- Code burden: field-need decisions are split across JSON category scheduling,
  DOM category/date/duration scheduling, queue admission, cooldown state, and
  watch-page metadata parsing.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstVideoMetaNoWorkBudgetContract
jsonFirstVideoMetaSchedulerSkipReport
jsonFirstVideoMetaSchedulerNeedReasonReport
jsonFirstVideoMetaSchedulerCooldownPolicy
jsonFirstVideoMetaQueueReasonRetentionPolicy
jsonFirstVideoMetaDuplicatePendingRetryPolicy
jsonFirstVideoMetaUploadDateCutoffWorkGate
jsonFirstVideoMetaDefaultDurationFetchPolicy
jsonFirstVideoMetaNoWorkMetricArtifact
jsonFirstVideoMetaNoWorkRevisionPolicy
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-video-meta-no-work-budget-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first video
metadata gap into scheduler no-work gates, queue reason loss, duplicate pending
cooldown behavior, DOM upload-date over-admission, DOM duration default-fetch
behavior, and remaining no-work authority gaps only.

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
