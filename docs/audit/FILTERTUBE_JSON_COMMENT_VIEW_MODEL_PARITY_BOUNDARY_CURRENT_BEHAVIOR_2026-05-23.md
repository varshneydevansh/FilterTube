# FilterTube JSON Comment View Model Parity Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, renderer-rule patch,
comment behavior patch, DOM fallback patch, continuation patch, or settings
schema patch.

## Purpose

This slice isolates the modern JSON comment ViewModel parity gap that remains
inside the broader hide-all-comments proof. It pins the mismatch between JSON
engine renderer coverage, fetch comment continuation shortcut detection, and DOM
fallback comment selectors.

Current boundary:

```text
filter_logic has JSON rules for commentRenderer and commentThreadRenderer, but
no rule for commentViewModel. Because _shouldBlock returns before list-mode,
keyword, hideAllComments, and comment-author decisions when a renderer has no
rule, direct commentViewModel rows survive JSON filtering. Seed's comment
continuation shortcut checks commentThreadRenderer and commentRenderer only, so
commentViewModel-only continuation payloads fall through to the JSON engine and
survive there too. DOM fallback has a separate ytd/ytm-comment-view-model path,
but the global hideAllComments DOM branch returns before that ViewModel branch.
```

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ALL_COMMENTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_KEYWORD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_AUTHOR_CHANNEL_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`

## Current Counts

```text
JSON comment ViewModel parity boundary source files: 3
JSON comment ViewModel parity source/effect blocks: 9
filter_logic comment rules block lines: 9
filter_logic comment rules block bytes: 380
filter_logic no-rule return block lines: 9
filter_logic no-rule return block bytes: 411
filter_logic comment decision block lines: 34
filter_logic comment decision block bytes: 1947
seed active JSON rules block lines: 13
seed active JSON rules block bytes: 464
seed comment continuation shortcut block lines: 37
seed comment continuation shortcut block bytes: 2269
DOM fallback comments CSS block lines: 16
DOM fallback comments CSS block bytes: 671
DOM fallback comment setup block lines: 12
DOM fallback comment setup block bytes: 877
DOM fallback global hide block lines: 15
DOM fallback global hide block bytes: 535
DOM fallback ViewModel filtering block lines: 99
DOM fallback ViewModel filtering block bytes: 5312
filter_logic total commentViewModel tokens: 0
filter_logic total commentRenderer tokens: 2
filter_logic total commentThreadRenderer tokens: 1
seed continuation commentViewModel tokens: 0
seed continuation commentRenderer tokens: 1
seed continuation commentThreadRenderer tokens: 1
seed continuation appendContinuationItemsAction tokens: 2
DOM fallback total commentViewModel tokens: 2
DOM fallback comments CSS ytd-comment-view-model tokens: 0
DOM fallback global hide commentViewModels tokens: 0
DOM fallback ViewModel filtering ytd-comment-view-model tokens: 1
runtime JSON comment ViewModel parity fixtures: 10
runtime behavior changed: no
not completion proof for JSON comment ViewModel parity authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| JSON renderer inventory | `FILTER_RULES` has `commentRenderer` and recursive `commentThreadRenderer`, but no `commentViewModel`. | Renderer inventory policy covering classic and modern comment shapes. |
| JSON no-rule return | `_shouldBlock()` returns before list-mode, keywords, `hideAllComments`, and comment-author checks when a renderer has no rule. | No-rule decision report with renderer key, branch, and allowed effect. |
| JSON global hide | Direct `commentViewModel` rows survive `hideAllComments:true`; direct `commentRenderer` rows are removed. | Modern comment global-hide policy. |
| JSON comment keywords | Direct `commentViewModel` rows survive comments-only keywords and global keywords; direct `commentRenderer` rows can be removed. | Comment keyword parity report by renderer shape. |
| JSON thread wrapper | A `commentThreadRenderer` wrapping a modern ViewModel can survive comment-keyword filtering because the wrapper has no `commentText` rule and the nested ViewModel has no rule. | Structural wrapper plus nested-renderer decision report. |
| Continuation shortcut | Seed's `/youtubei/v1/next` shortcut checks `commentThreadRenderer` and `commentRenderer`, not `commentViewModel`. | Continuation renderer-shape policy for append/reload/replace actions. |
| DOM fallback setup | DOM fallback queries `ytd-comment-view-model` and `ytm-comment-view-model`. | Shared JSON/DOM target matrix. |
| DOM global hide | DOM global hide toggles containers, threads, and mobile comment cards, then returns before the ViewModel branch. | Direct ViewModel global-hide proof and restore policy. |

## Runtime Fixture Summary

The runtime guard proves:

1. Direct JSON `commentViewModel` remains under `hideAllComments:true`.
2. Direct JSON `commentRenderer` is removed under the same setting.
3. Direct JSON `commentViewModel` remains under matching `filterKeywordsComments`.
4. Direct JSON `commentRenderer` is removed by the same comments-only keyword.
5. Direct JSON `commentViewModel` remains under matching global `filterKeywords`.
6. A `commentThreadRenderer` wrapping a modern ViewModel survives comment-keyword filtering.
7. A continuation response containing `commentViewModel` survives `hideAllComments:true`.
8. A continuation response containing `commentRenderer` loses that item under `hideAllComments:true`.
9. Source order keeps the no-rule return before comment decisions.
10. DOM fallback contains a ViewModel-specific path while JSON renderer rules and seed continuation shortcut do not.

## Risks Identified

- Reliability: JSON and DOM comment coverage disagree for modern YouTube comment
  shapes, so behavior depends on whether a comment is filtered before or after
  rendering.
- False-hide/leak: classic comments can be removed while modern ViewModel
  comments or wrappers remain visible in JSON responses.
- Performance: comment settings can still wake JSON parsing and endpoint
  processing even when the modern comment shape is not actionable by the JSON
  engine.
- Code burden: renderer inventory, continuation shortcut detection, DOM
  selectors, and comment decision rules each encode comment shape knowledge
  separately.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonCommentViewModelParityContract
jsonCommentViewModelRendererRuleReport
jsonCommentViewModelJsonDecisionReport
jsonCommentViewModelContinuationPolicy
jsonCommentViewModelDomParityReport
jsonCommentViewModelGlobalHidePolicy
jsonCommentViewModelKeywordPolicy
jsonCommentViewModelStructuralWrapperReport
jsonCommentViewModelFalseHideLeakBudget
jsonCommentViewModelAuthorityGate
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-comment-view-model-parity-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open modern comment
shape gap into current JSON renderer coverage, no-rule return behavior,
comments-only keyword behavior, continuation response behavior, DOM fallback
ViewModel selectors, and direct modern-comment leak risk only.

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
