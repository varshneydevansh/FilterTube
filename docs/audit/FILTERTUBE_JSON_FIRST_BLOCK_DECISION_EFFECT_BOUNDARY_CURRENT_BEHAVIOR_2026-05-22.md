# FilterTube JSON-First Block Decision/Effect Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, renderer expansion,
decision refactor, message refactor, settings-mode patch, or permission to
change JSON filtering behavior.

## Purpose

This register records the current block-decision and side-effect boundary inside
`YouTubeDataFilter._shouldBlock()`. It extends the JSON-first readiness,
rule-field, no-work, and renderer traversal proofs by pinning what currently
happens after recursive traversal has selected a renderer candidate.

The current boundary is:

```text
_shouldBlock unwraps wrappers, builds one candidate, can emit learned
collaborator/map messages before the final hide decision, applies Shorts and
route exceptions before whitelist/blocklist decisions, skips non-comment
whitelist logic for comments, skips keyword filtering for channel-only
renderers, and falls through to content/category checks only after
channel/keyword/comment checks do not block.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md`
- `docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_RENDERER_TRAVERSAL_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_MESSAGE_SIDE_EFFECT_REGISTER_2026-05-18.md`
- `docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md`

## Current Counts

```text
block decision/effect boundary source files: 1
block decision/effect source/effect blocks: 9
filter_logic _shouldBlock block lines: 306
filter_logic _shouldBlock block bytes: 15523
collaboration cache block lines: 17
collaboration cache block bytes: 786
Shorts decision block lines: 6
Shorts decision block bytes: 328
route exception block lines: 15
route exception block bytes: 460
whitelist decision block lines: 110
whitelist decision block bytes: 5535
channel decision block lines: 17
channel decision block bytes: 1090
keyword decision block lines: 21
keyword decision block bytes: 1123
comment decision block lines: 34
comment decision block bytes: 1947
content/category decision block lines: 13
content/category decision block bytes: 542
_shouldBlock return true tokens: 11
_shouldBlock return false tokens: 11
_shouldBlock _logWhitelistDecision tokens: 6
_shouldBlock _matchesAnyChannel tokens: 4
_shouldBlock _regexMatches tokens: 6
_shouldBlock postMessage tokens: 1
_shouldBlock hideAllShorts tokens: 1
_shouldBlock filterKeywordsComments tokens: 2
_shouldBlock _checkContentFilters tokens: 1
_shouldBlock _checkCategoryFilters tokens: 1
_shouldBlock document.location tokens: 2
_shouldBlock WHITELIST_CONTAINER_RENDERERS tokens: 1
_shouldBlock CHANNEL_ONLY_RENDERERS tokens: 1
_shouldBlock CHIP_RENDERERS tokens: 1
runtime block decision/effect fixtures: 6
runtime behavior changed: no
not completion proof for JSON-first block decision or effect authority
```

## Current Decision/Effect Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Candidate setup | `_shouldBlock()` unwraps rich items, rejects chips, reads `FILTER_RULES`, normalizes list mode, optionally extracts channel identity, then registers discovered mappings. | Structured candidate report with renderer, wrapper, identity source, route, and settings revision. |
| Collaboration side effect | Collaboration payloads can post `FilterTube_CacheCollaboratorInfo` before channel/keyword/content/category block checks decide the final renderer outcome. | Learned-identity side-effect decision tied to final hide/allow outcome and source provenance. |
| Shorts control | `hideAllShorts` blocks Shorts-like JSON renderers before route exceptions or list-mode checks. | Route/surface Shorts policy with sibling-visible and whitelist/Kids fixtures. |
| Route exceptions | `/feed/channels` returns false for all candidate renderers reaching this branch; `/results` preserves `secondarySearchContainerRenderer`. | Route exception report explaining which renderers are preserved and why. |
| Whitelist branch | Non-comment whitelist mode fail-closes empty rules, allows containers/scaffolding, and then checks channels, keywords, creator page metadata, unresolved identity, or no match. | List-mode decision report with reason, identity confidence, and negative fixtures. |
| Channel-only renderers | `channelRenderer` and `gridChannelRenderer` skip keyword filtering but can still be removed by channel rules. | Field-effect policy distinguishing channel target rows from video/content rows. |
| Comment branch | Comment renderers bypass the non-comment whitelist fail-closed path but still use hide-all, comment keyword, and author-channel checks. | Comment-specific JSON decision report with list-mode and keyword-source policy. |
| Content/category tail | `_checkContentFilters()` and `_checkCategoryFilters()` run only after channel, keyword, comment, route, Shorts, and whitelist branches do not return. | Ordered decision pipeline report with short-circuit and side-effect budgets. |

## Runtime Fixture Summary

The route exception fixture proves `/feed/channels` preserves a normal
`videoRenderer` even when empty whitelist mode would otherwise remove it.

The Shorts precedence fixture proves `hideAllShorts` removes a `reelItemRenderer`
on `/feed/channels`, before the feed route exception can preserve it.

The channel-only fixture proves `channelRenderer` ignores block keywords in its
title, but a matching channel rule removes the same renderer family.

The comment fixture proves empty whitelist mode does not fail-close
`commentRenderer`, while ordinary block keywords still remove matching comment
text through the comment branch.

The collaboration cache fixture proves a collaboration renderer can remain
visible while `FilterTube_CacheCollaboratorInfo` is still posted.

The collaboration channel fixture proves any matching collaborator can remove
the whole renderer, and that the collaborator cache message is posted before
the final block outcome.

## Risks Identified

- Reliability: a JSON renderer can emit learned collaborator/map side effects
  even when the final decision allows or removes the renderer, so future
  optimization cannot treat allow/no-hide as no side effects.
- False-hide/leak: route, Shorts, comment, whitelist, keyword, channel,
  content, and category decisions short-circuit each other without one
  structured reason record.
- Performance: channel identity extraction and collaborator cache messaging can
  wake work before a first-class decision report proves the renderer needs it.
- Code burden: decision order, side effects, route exceptions, list-mode
  semantics, and metadata checks are centralized in one large method but remain
  split across separate proof registers.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstBlockDecisionContract
jsonFirstBlockDecisionEffectReport
jsonFirstDecisionOrderReport
jsonFirstDecisionSideEffectBudget
jsonFirstCollaborationEffectDecision
jsonFirstRouteExceptionDecision
jsonFirstCommentDecisionPolicy
jsonFirstChannelOnlyFieldPolicy
jsonFirstDecisionShortCircuitReport
jsonFirstBlockDecisionFixtureProvenance
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-block-decision-effect-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first
filtering gap into current block decision order, route exceptions, channel-only
keyword skipping, comment handling, collaboration side effects, and missing
first-class block-decision/effect authority only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this JSON-first block decision surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, block decision order changes, route
exception changes, collaboration side-effect changes, or selector/renderer
authority changes.
