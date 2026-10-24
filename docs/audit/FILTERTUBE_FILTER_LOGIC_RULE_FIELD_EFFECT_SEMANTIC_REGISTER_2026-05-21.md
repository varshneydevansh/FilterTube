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

Current-source register reviewed on 2026-10-18. This refresh changes no runtime behavior or broad proof approval.

## Source-Derived Summary

```text
source file: js/filter_logic.js
source line count: 4536
source bytes: 222044
source sha256: 20c1426a56eeaa925b42d192a56699c2cfaafbc291bb7e2f583d3e5d29fc7f6c
upstream path register: docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md
rule fields with runtime consumers: 11
consumer methods with rules.<field> references: 10
method-field consumer pairs: 21
rules.<field> token references: 64
effective runtime path rows inherited from path register: 467
effective unique path literals inherited from path register: 184
effective renderer-field pairs inherited from path register: 189
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
| `videoId` | 18 | `_extractVideoId`, `_checkCategoryFilters`, `_checkLanguageFilters`, `_extractDuration`, `_extractPublishedTime` | Supplies renderer video ids for exact metadata joins, category/language lookup, duration/date fallback and Shorts owner-map recovery. Unknown JSON category schedules no fetch. | Join provenance, map staleness policy, category fetch budget, no-map behavior, and route ownership proof. |
| `duration` | 5 | `_buildCandidate`, `_extractDuration` | Adds duration text to metadata search and parses duration for content filtering. | Localized duration parsing, zero/blank duration policy, threshold mode fixtures, and no-rule duration work budget. |
| `publishedTime` | 5 | `_buildCandidate`, `_extractPublishedTime` | Adds published-time text to metadata search and parses relative time for upload-date filtering. | Clock/timezone fixture policy, localized relative text, blank-date policy, and learned-map fallback proof. |
| `viewCount` | 1 | `_buildCandidate` | Adds view-count text to metadata search and `candidate.viewCountText`; an optional conservative minimum-view predicate now reads dedicated own count fields through `_extractViewCount()`. | Known total threshold/boundary tests exist; installed localized-card coverage and native parity remain separate gates. |
| `metadataRows` | 10 | `_buildCandidate`, `_extractDescription`, `_extractPublishedTime` | Flattens metadata rows for keyword/description text and relative-time extraction. | Row order provenance, metadata-part semantics, duration/date/category ambiguity, and DOM parity fixtures. |

Direct `rules.field` counts below are lexical and do not include `_extractViewCount()`
which consumes dedicated total-view fields and explicitly labeled metadata parts.
Unknown, concurrent/live or ambiguous totals remain visible; views add no fetch
or pending state. Main/Kids rules remain independent.

## Consumer Method Counts

| Consumer method | Rule fields consumed | `rules.<field>` references | Current effect boundary |
| --- | --- | ---: | --- |
| `_extractVideoId` | `videoId` | 2 | Extracts declared rule fields; route, mode and effect guards remain required. |
| `_buildCandidate` | `channelName`, `duration`, `publishedTime`, `viewCount`, `metadataRows`, `commentText` | 6 | Stages searchable metadata; staging alone is not a hide decision. |
| `_shouldBlock` | `commentText` | 4 | Extracts declared rule fields; route, mode and effect guards remain required. |
| `_checkCategoryFilters` | `videoId` | 4 | Reads exact video metadata; unknown category returns no block and schedules no JSON-wide fetch. |
| `_checkLanguageFilters` | `videoId` | 4 | Reads loaded language evidence by exact video ID; unknown evidence stays visible. |
| `_extractTitle` | `title` | 4 | Extracts declared rule fields; route, mode and effect guards remain required. |
| `_extractDescription` | `description`, `metadataRows` | 10 | Extracts declared rule fields; route, mode and effect guards remain required. |
| `_extractDuration` | `duration`, `videoId` | 8 | Extracts declared rule fields; route, mode and effect guards remain required. |
| `_extractPublishedTime` | `publishedTime`, `metadataRows`, `videoId` | 12 | Extracts declared rule fields; route, mode and effect guards remain required. |
| `_extractChannelInfo` | `channelName`, `channelId`, `channelHandle` | 10 | Extracts declared rule fields; route, mode and effect guards remain required. |

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
- `viewCount` feeds an optional conservative minimum-view threshold. Dedicated
  total fields and explicit view labels are parsed; missing/ambiguous evidence
  stays visible. The feature adds neither requests nor pending admission.
- `_checkCategoryFilters()` does not schedule metadata fetches for missing category.
  The separate DOM viewport observer owns bounded hydration; JSON traversal
  does not fan out Player requests for every renderer.
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
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, field-effect changes, category fetch work
changes, whitelist/blocklist behavior changes, or selector/renderer authority
changes.

## Controls source inventory refresh - 2026-10-25

The current `js/filter_logic.js` fingerprint and any affected line references above reflect the narrow autoplay correction: decorative end-screen hiding preserves playback endpoints; explicit Disable autoplay and individual filtering rules still govern them. This inventory refresh itself changes no runtime code and promotes none of the unresolved semantic-proof gates. See `docs/audit/TIME_LIMITS_AUTOPLAY_RESET_IMPLEMENTATION_2026-10-25.md` for implementation and executable validation.
