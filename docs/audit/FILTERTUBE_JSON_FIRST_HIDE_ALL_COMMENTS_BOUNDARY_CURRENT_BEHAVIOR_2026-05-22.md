# FilterTube JSON-First Hide All Comments Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, optimization patch, comments behavior
patch, DOM fallback patch, renderer rule patch, network patch, or settings
schema patch.

This slice promotes the JSON-first feature audit into `hideAllComments` and
comment-filter proof. It isolates how comment filtering currently crosses
background settings compile, seed active-work predicates, JSON renderer rules,
comment continuation response rewriting, comment keyword scoping, comment
author channel filtering, DOM fallback selectors, mobile comment card markers,
whitelist mode, and storage refresh keys.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |

## Boundary Counts

```text
hideAllComments boundary source files: 4
hideAllComments source/effect blocks: 21
filter_logic comment rules block lines: 9
filter_logic comment rules block bytes: 380
filter_logic candidate comment flag block lines: 1
filter_logic candidate comment flag block bytes: 100
filter_logic whitelist comment bypass block lines: 110
filter_logic whitelist comment bypass block bytes: 5535
filter_logic comment decision block lines: 34
filter_logic comment decision block bytes: 1947
seed active JSON rules block lines: 13
seed active JSON rules block bytes: 463
seed engine settings log block lines: 7
seed engine settings log block bytes: 394
seed basic comment hide block lines: 28
seed basic comment hide block bytes: 1574
seed comment continuation block lines: 37
seed comment continuation block bytes: 2269
DOM fallback comments CSS block lines: 16
DOM fallback comments CSS block bytes: 671
DOM fallback collect mobile comments block lines: 30
DOM fallback collect mobile comments block bytes: 1386
DOM fallback comments global block lines: 42
DOM fallback comments global block bytes: 1934
DOM fallback comments restore and inputs block lines: 17
DOM fallback comments restore and inputs block bytes: 781
DOM fallback comments thread filtering block lines: 76
DOM fallback comments thread filtering block bytes: 3674
DOM fallback comments renderer filtering block lines: 77
DOM fallback comments renderer filtering block bytes: 4223
DOM fallback comments view-model filtering block lines: 99
DOM fallback comments view-model filtering block bytes: 5312
DOM fallback active boolean keys block lines: 28
DOM fallback active boolean keys block bytes: 905
background storage read keys block lines: 44
background storage read keys block bytes: 1408
background comments keyword fallback block lines: 35
background comments keyword fallback block bytes: 1961
background V4 comments compile block lines: 23
background V4 comments compile block bytes: 1586
background boolean comments block lines: 3
background boolean comments block bytes: 182
background storage refresh keys block lines: 16
background storage refresh keys block bytes: 461
filter_logic total hideAllComments tokens: 3
filter_logic total filterComments tokens: 1
filter_logic total filterKeywordsComments tokens: 2
filter_logic total commentRenderer tokens: 2
filter_logic total commentThreadRenderer tokens: 1
filter_logic total commentViewModel tokens: 0
seed total hideAllComments tokens: 9
seed total filterKeywordsComments tokens: 1
seed total commentRenderer tokens: 1
seed total commentThreadRenderer tokens: 1
DOM fallback total hideAllComments tokens: 3
DOM fallback total hideComments tokens: 1
DOM fallback total filterComments tokens: 1
DOM fallback total filterKeywordsComments tokens: 3
DOM fallback total commentRenderer tokens: 3
DOM fallback total commentViewModel tokens: 2
DOM fallback total mobile-comments-card marker tokens: 5
background total hideAllComments tokens: 9
background total hideComments tokens: 15
background total filterComments tokens: 12
background total filterKeywordsComments tokens: 11
runtime hideAllComments fixtures: 7
```

## Current Behavior Pinned

| Boundary | Current behavior | Missing first-class field |
| --- | --- | --- |
| Background compile | Background compiles `hideAllComments` from V4 `hideComments` with legacy `hideAllComments` fallback, forces `filterComments` false in compiled settings, and refreshes on `hideComments`, `filterComments`, and `filterKeywordsComments`. | Settings alias and comment-scope report proving V4, legacy, cache, and refresh parity. |
| Comment keyword scope | Background may reconstruct or compile `filterKeywordsComments`; the JSON engine uses `filterKeywordsComments` for comments when it is an array, otherwise it falls back to `filterKeywords`. | Comment keyword authority report covering UI entries, compiled entries, and fallback behavior. |
| Seed active work | `hasActiveJsonFilterRules` treats `filterKeywordsComments` and `hideAllComments` as active JSON work for endpoint mutation. | No-work budget separating active comment rules from endpoints and pages with no comment payloads. |
| Seed basic processing | When the comprehensive engine is missing, seed removes comment engagement panels and watch result `itemSectionRenderer` rows with `sectionIdentifier === "comment-item-section"`. | Engine-present versus engine-missing parity report. |
| Comment continuation shortcut | Fetch interception rewrites `/youtubei/v1/next` comment continuation responses to an end-marker response when `hideAllComments` is enabled and comment renderers are detected. | Response-effect contract for continuation shape, headers, and endpoint permission. |
| JSON renderer rules | `commentRenderer` has author/text paths and `commentThreadRenderer` is declared as recursive-only, but modern `commentViewModel` has no JSON rule. | Renderer inventory and JSON/DOM comment parity policy. |
| JSON hide decision | `hideAllComments` removes discovered `commentRenderer` and `commentThreadRenderer`; comment keywords and comment-author channel rules also remove matching comment renderers. | Decision report with renderer, wrapper, reason, and author evidence. |
| JSON structural rows | A direct `itemSectionRenderer` comment section can remain as an empty wrapper after nested comment renderers are removed by JSON processing. | Structural container cleanup policy and sibling-visible proof. |
| JSON modern view models | Direct `commentViewModel` JSON currently remains under `hideAllComments` and comment keyword rules because no filter rule exists for that renderer key. | Modern comment ViewModel coverage report. |
| DOM comments fallback | DOM fallback separately hides containers, threads, mobile comment entry cards, reply renderers, and `ytd-comment-view-model`/`ytm-comment-view-model`, and marks mobile cards with `data-filtertube-mobile-comments-card`. | Shared JSON/DOM comment target matrix and marker restore proof. |
| Whitelist interaction | JSON whitelist fail-closed logic is skipped for comment renderers, so comments are governed by `hideAllComments`, comment keywords, and author channel filters instead of whitelist allow checks. | Cross-feature decision order report for comments versus whitelist. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

- direct `commentRenderer` is removed when `hideAllComments` is true.
- direct `commentThreadRenderer` is removed when `hideAllComments` is true.
- an `itemSectionRenderer` comment section remains present after nested comments
  are removed, leaving an empty structural wrapper.
- ordinary `videoRenderer` rows remain visible when only `hideAllComments` is
  true.
- direct `commentViewModel` rows currently remain under `hideAllComments` and
  comment keyword rules.
- `filterKeywordsComments` removes matching comments without removing ordinary
  videos with the same text.
- comment author channel filters remove matching `commentRenderer` rows.

## Risk Interpretation

- Reliability: JSON comment renderer coverage and DOM comment selector coverage
  disagree for modern comment ViewModel shapes.
- False-hide/leak: global comment hiding can remove classic JSON comments while
  leaving direct modern ViewModel JSON and empty structural wrappers.
- Performance: comment settings wake endpoint parsing, continuation rewriting,
  broad DOM comment scans, mobile-card collection, and per-comment channel/text
  matching.
- Code burden: background aliases, comment keyword scoping, seed response
  rewriting, JSON decisions, DOM selectors, mobile markers, and whitelist
  bypass behavior are split across four files.

## Non-Completion Boundary

This does not close JSON-first comment filtering. Product runtime source still
lacks first-class hide-all-comments contracts, comment decision reports,
comment renderer inventory policies, JSON/DOM comment parity reports, modern
comment ViewModel leak reports, structural wrapper cleanup policies, comment
continuation response contracts, no-work budgets, marker restore proof, fixture
provenance, and metric artifacts. The following symbols are intentionally
absent from product runtime source today:

```text
jsonFirstHideAllCommentsContract
jsonFirstHideAllCommentsDecisionReport
jsonFirstCommentsRendererInventoryPolicy
jsonFirstCommentsJsonDomParityReport
jsonFirstCommentsViewModelLeakReport
jsonFirstCommentsStructuralWrapperPolicy
jsonFirstCommentsContinuationResponseContract
jsonFirstCommentsNoWorkBudget
jsonFirstCommentsMarkerRestoreProof
jsonFirstCommentsFixtureProvenance
jsonFirstCommentsMetricArtifact
```

## Validation

```text
node --test tests/runtime/json-first-hide-all-comments-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
