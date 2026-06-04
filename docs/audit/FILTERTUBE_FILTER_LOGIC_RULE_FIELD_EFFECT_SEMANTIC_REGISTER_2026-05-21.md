# FilterTube Filter Logic Rule Field Effect Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/filter_logic.js` from executable rule-path coverage
to field-effect coverage. It records how each `FILTER_RULES` field is consumed
after a path value is read, so JSON-first filtering work does not confuse
"field exists" with "field may hide, allow, fetch, join, or replace DOM
fallback."

This is not implementation readiness. A JSON path still needs route/surface,
settings-mode, identity-confidence, fixture-proven effect, DOM parity, native
runtime parity, and no-rule budget proof before it can become a first-class
filtering authority.

## Source-Derived Summary

```text
source file: js/filter_logic.js
source line count: 3652
source bytes: 172174
source sha256: 953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5
upstream path register: docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md
rule fields with runtime consumers: 11
consumer methods with rules.<field> references: 9
method-field consumer pairs: 20
rules.<field> token references: 63
effective runtime path rows inherited from path register: 440
effective unique path literals inherited from path register: 174
effective renderer-field pairs inherited from path register: 177
runtime behavior changed: no
```

## Field Consumer Matrix

| Rule field | `rules.<field>` references | Consumer methods | Current effect shape | Missing proof before JSON-first behavior changes |
| --- | ---: | --- | --- | --- |
| `title` | 4 | `_extractTitle` | Extracts title text for candidate keyword search and uppercase-title content filtering. | Per-renderer title confidence, empty-title behavior, Unicode/exact-match policy, uppercase locale policy, and negative sibling-visible fixtures. |
| `description` | 5 | `_extractDescription` | Extracts description text for candidate keyword search; can indirectly drive JSON renderer removal through `_shouldBlock()`. | Route/renderer provenance, snippet versus full-description priority, and DOM parity for description-only keyword decisions. |
| `commentText` | 5 | `_buildCandidate`, `_shouldBlock` | Adds comment text to candidate metadata and separately reads comment text for comment keyword filtering. | Comment endpoint/surface fixtures, comment-author split proof, comment keyword mode parity, and false-hide sibling fixtures. |
| `channelName` | 5 | `_buildCandidate`, `_extractChannelInfo` | Adds display channel text to metadata search and can provide channel identity for blocklist/whitelist matching. | Display-name confidence, handle/id fallback priority, whitelist fail-closed proof, and collaboration false-hide fixtures. |
| `channelId` | 2 | `_extractChannelInfo` | Reads stable browse ids for channel matching when present. | UC-id provenance, non-UC browse id policy, channel-map cross-match proof, and stale-map handling. |
| `channelHandle` | 4 | `_extractChannelInfo` | Reads canonical URL or handle-like paths for channel matching and mapping. | Handle/custom URL normalization proof, percent-encoding policy, canonical URL precedence, and channel-map rollback fixtures. |
| `videoId` | 14 | `_extractVideoId`, `_checkCategoryFilters`, `_extractDuration`, `_extractPublishedTime` | Supplies renderer video ids for joins, category lookup/fetch scheduling, duration fallback, upload-date fallback, and Shorts video-channel map recovery. | Join provenance, map staleness policy, category fetch budget, no-map behavior, and route ownership proof. |
| `duration` | 6 | `_buildCandidate`, `_extractDuration` | Adds duration text to metadata search and parses duration for content filtering. | Localized duration parsing, zero/blank duration policy, threshold mode fixtures, and no-rule duration work budget. |
| `publishedTime` | 6 | `_buildCandidate`, `_extractPublishedTime` | Adds published-time text to metadata search and parses relative time for upload-date filtering. | Clock/timezone fixture policy, localized relative text, blank-date policy, and learned-map fallback proof. |
| `viewCount` | 2 | `_buildCandidate` | Adds view-count text to metadata search and `candidate.viewCountText`; there is no current view-count threshold predicate. | Whether view count is allowed to affect filtering, localized/abbreviated count parsing, and negative keyword false-hide proof. |
| `metadataRows` | 10 | `_buildCandidate`, `_extractDescription`, `_extractPublishedTime` | Flattens metadata rows for keyword/description text and relative-time extraction. | Row order provenance, metadata-part semantics, duration/date/category ambiguity, and DOM parity fixtures. |

## Consumer Method Counts

| Consumer method | Rule fields consumed | `rules.<field>` references | Current effect boundary |
| --- | --- | ---: | --- |
| `_extractVideoId` | `videoId` | 2 | Builds the candidate video id before `_shouldBlock()` can use it for Shorts map recovery and downstream decisions. |
| `_buildCandidate` | `channelName`, `duration`, `publishedTime`, `viewCount`, `metadataRows`, `commentText` | 9 | Stages searchable metadata and display fields; staging alone is not an effect decision. |
| `_shouldBlock` | `commentText` | 4 | Owns the final JSON removal decision and has a separate comment keyword path. |
| `_checkCategoryFilters` | `videoId` | 4 | Uses video ids to read `videoMetaMap`; missing category can schedule `scheduleVideoMetaFetch()` and return no block. |
| `_extractTitle` | `title` | 4 | Extracts title text for candidate search and uppercase-title filter inputs. |
| `_extractDescription` | `description`, `metadataRows` | 10 | Extracts description text from explicit description paths before metadata row fallback. |
| `_extractDuration` | `duration`, `videoId` | 8 | Reads rule duration paths, nested fallbacks, and `videoMetaMap` by resolved video id. |
| `_extractPublishedTime` | `publishedTime`, `metadataRows`, `videoId` | 12 | Reads rule published-time paths, metadata rows, nested fallbacks, and `videoMetaMap` by resolved video id. |
| `_extractChannelInfo` | `channelName`, `channelId`, `channelHandle` | 11 | Reads channel identity fields for channel block/allow matching after collaboration-specific extraction paths run. |

## Effect Boundaries

Field availability is not equivalent to an allowed effect:

- `title`, `description`, `commentText`, `channelName`, `duration`,
  `publishedTime`, `viewCount`, and `metadataRows` can enter
  `_candidateSearchText()` through candidate metadata and can therefore affect
  keyword matching when the surrounding mode and rule state allow it.
- `channelName`, `channelId`, and `channelHandle` only become channel-policy
  evidence after `_extractChannelInfo()` and `_matchesAnyChannel()`; display
  names and stable ids are not the same confidence class.
- `videoId` is a join key, not channel identity. It can support
  `videoChannelMap`, `videoMetaMap`, category checks, duration fallback, and
  upload-date fallback, but it does not by itself prove a channel block or
  whitelist allow.
- `duration` and `publishedTime` can directly feed content-filter hide
  decisions only through `_checkContentFilters()`.
- `viewCount` has no current view-count threshold predicate; today it is
  metadata/search text only.
- `_checkCategoryFilters()` can schedule `scheduleVideoMetaFetch(videoId, {
  needDuration: false, needDates: false, needCategory: true })` when category
  is missing, so category JSON-first work must include fetch-budget proof.
- `processData()` harvests channel mappings before the `settings.enabled ===
  false` filtering skip, so field-effect proof must separate harvest work from
  hide/allow mutation work.

## Implementation-Change Boundary

No runtime symbol exists yet for:

```text
filterLogicRuleFieldEffectAuthority
filterLogicRuleFieldEffectManifest
filterLogicJsonPathEffectDecision
filterLogicFieldConsumerReport
filterLogicViewCountPredicateAuthority
filterLogicCategoryFetchBudget
filterLogicWhitelistFieldEffectReport
filterLogicRuleFieldFixtureProvenance
filterLogicRuleFieldNoWorkBudget
filterLogicJsonFirstEffectGate
```

Until those missing authorities or equivalent fixture-backed reports exist, this
register is only current-behavior proof. It does not permit adding renderer
paths, deleting DOM fallback paths, changing whitelist/blocklist behavior,
changing category fetch work, changing view-count semantics, or treating JSON rule fields as native-runtime parity proof.

## Runnable Proof

```bash
node --test tests/runtime/filter-logic-rule-field-effect-semantic-register-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this filter-logic rule-field effect surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, field-effect changes, category fetch work
changes, whitelist/blocklist behavior changes, or selector/renderer authority
changes.
