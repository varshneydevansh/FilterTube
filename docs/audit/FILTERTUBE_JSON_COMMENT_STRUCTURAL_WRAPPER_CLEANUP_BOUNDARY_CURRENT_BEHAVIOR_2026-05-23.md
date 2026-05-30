# FilterTube JSON Comment Structural Wrapper Cleanup Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, structural-cleanup
patch, comment behavior patch, continuation patch, DOM fallback patch, or
settings schema patch.

## Purpose

This slice isolates the JSON comment structural cleanup gap left open by the
hide-all-comments and modern ViewModel parity proofs. It pins how recursive JSON
filtering removes matching comment renderer objects but keeps parent
`itemSectionRenderer`, continuation-action, and other structural wrappers.

Current boundary:

```text
filter_logic removes a renderer object by returning null from the renderer
decision branch, and array recursion drops null children. The recursive property
copy keeps parent objects whose child arrays become empty, so comment section
wrappers and continuation action wrappers can remain after nested comments are
removed. Seed's engine-error fallback has a separate watch-page splice path for
itemSectionRenderer rows with sectionIdentifier comment-item-section, while DOM
fallback hides comment containers through selectors instead of sharing the JSON
cleanup decision.
```

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3498 | 165151 | `4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ALL_COMMENTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_VIEW_MODEL_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_COMMENT_CONTINUATION_SHORTCUT_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
JSON comment structural wrapper cleanup boundary source files: 3
JSON comment structural wrapper cleanup source/effect blocks: 10
filter_logic whitelist containers block lines: 10
filter_logic whitelist containers block bytes: 267
filter_logic comment rules block lines: 9
filter_logic comment rules block bytes: 380
filter_logic comment decision block lines: 34
filter_logic comment decision block bytes: 1947
filter_logic array recursion block lines: 12
filter_logic array recursion block bytes: 404
filter_logic object renderer removal block lines: 11
filter_logic object renderer removal block bytes: 536
filter_logic recursive property copy block lines: 9
filter_logic recursive property copy block bytes: 347
seed engine catch block lines: 5
seed engine catch block bytes: 220
seed basic comment hide block lines: 28
seed basic comment hide block bytes: 1574
DOM fallback comments CSS block lines: 16
DOM fallback comments CSS block bytes: 671
DOM fallback global hide block lines: 15
DOM fallback global hide block bytes: 535
filter_logic whitelist containers itemSectionRenderer tokens: 1
filter_logic comment rules commentRenderer tokens: 2
filter_logic comment rules commentThreadRenderer tokens: 1
filter_logic comment decision hideAllComments tokens: 2
filter_logic array recursion item-not-null tokens: 1
filter_logic array recursion return-filtered tokens: 1
filter_logic object renderer removal return-null tokens: 1
filter_logic recursive property copy filteredValue-not-null tokens: 1
filter_logic recursive property copy result-key tokens: 1
seed basic comment hide itemSectionRenderer tokens: 1
seed basic comment hide comment-item-section tokens: 1
seed basic comment hide splice tokens: 2
DOM fallback comments CSS comment-item-section tokens: 1
DOM fallback global hide commentContainers tokens: 1
runtime JSON comment structural wrapper cleanup fixtures: 11
runtime behavior changed: no
not completion proof for JSON comment structural cleanup authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Container inventory | `itemSectionRenderer` is a whitelist container renderer, not a comment cleanup contract. | Structural container policy by route, section, and child decision. |
| Renderer removal | `_shouldBlock()` can return true for `commentRenderer` and `commentThreadRenderer`; object recursion then returns `null` for that renderer object. | Renderer-decision report with parent path and removal reason. |
| Array recursion | Arrays drop children only when the child returned `null`. | Sibling-preservation policy and empty-array cleanup policy. |
| Object recursion | Parent objects are copied when their filtered child values are non-null; empty objects and empty arrays remain valid values. | Empty-wrapper pruning policy. |
| Comment section hide | `hideAllComments:true` can leave `itemSectionRenderer` wrappers with empty `contents`. | Comment-section cleanup authority for JSON responses. |
| Mixed siblings | A comment section with both a hidden comment and a non-comment sibling remains as a comment-section wrapper containing the sibling. | Sibling-visible proof and section-type policy. |
| Continuation action wrappers | Engine filtering can leave `appendContinuationItemsAction.continuationItems: []` without adding the seed shortcut end marker. | Continuation wrapper cleanup and synthetic-end policy. |
| Seed fallback | When the engine throws, seed's basic fallback splices watch comment sections by `sectionIdentifier === "comment-item-section"`. | Engine/fallback parity report. |
| DOM fallback | DOM fallback hides comment containers through selectors and a global-hide branch, not through JSON wrapper pruning. | JSON/DOM structural parity report. |

## Runtime Fixture Summary

The runtime guard proves:

1. `hideAllComments:true` removes nested classic comments but leaves a top-level
   `itemSectionRenderer` comment section with empty `contents`.
2. The same setting preserves a mixed `itemSectionRenderer` wrapper when a
   non-comment sibling remains inside it.
3. A generic `itemSectionRenderer` wrapper also remains after nested comments
   are removed.
4. Direct comment-keyword filtering can remove a nested direct
   `commentRenderer` while leaving the parent section wrapper empty.
5. A `commentThreadRenderer` that stores raw comment fields without a nested
   renderer key survives comments-only keyword filtering.
6. Continuation action wrappers can remain with empty `continuationItems` after
   engine filtering removes direct comment renderer items.
7. Seed's engine-error fallback removes the whole watch-page comment section
   by splice while preserving a video sibling.
8. Source order keeps renderer-object removal before recursive property copy.
9. DOM fallback has comment-section selectors and a global-hide branch without
   sharing JSON structural pruning.
10. Product runtime still lacks a first-class JSON comment structural cleanup
    authority.

## Risks Identified

- Reliability: normal engine filtering, seed engine-error fallback, seed
  shortcut handling, and DOM fallback can produce different structural results
  for the same comment-hide intent.
- False-hide/leak: hidden comments can leave empty wrappers or wrappers with
  unexpected non-comment siblings, while other fallback paths remove the whole
  section.
- Performance: downstream rendering and DOM fallback can still see structural
  wrappers after JSON comment removal, creating extra cleanup work.
- Code burden: comment cleanup behavior is spread across recursive JSON pruning,
  seed fallback splicing, continuation response rewriting, and DOM selectors.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonCommentStructuralCleanupContract
jsonCommentStructuralWrapperDecisionReport
jsonCommentEmptyWrapperPruningPolicy
jsonCommentSectionSiblingPolicy
jsonCommentContinuationWrapperCleanupReport
jsonCommentSeedFallbackParityReport
jsonCommentDomStructuralParityReport
jsonCommentStructuralFalseHideLeakBudget
jsonCommentStructuralFixtureProvenance
jsonCommentStructuralAuthorityGate
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-comment-structural-wrapper-cleanup-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON comment
structural cleanup gap into current recursive renderer removal, empty wrapper
retention, continuation wrapper retention, seed fallback splicing, DOM selector
parity, and sibling-preservation risk only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
