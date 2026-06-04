# FilterTube JSON-First Renderer Traversal/Mutation Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior changed: yes;
seed no-work admission now bypasses inactive YouTubei body parsing before
traversal.
This is not an implementation patch, optimization patch, renderer expansion,
JSON path patch, traversal patch, response mutation patch, or permission to
change JSON filtering behavior.

## Purpose

This register records the current recursive JSON renderer traversal and
mutation boundary used by the page-world filtering engine. It extends the
JSON-first readiness, no-work, response mutation, and filter-logic method
proofs by pinning what the current engine does once a payload reaches
`FilterTubeEngine.processData()`.

The current boundary is:

```text
active processing rebuilds object and array containers during recursive
traversal, compacts arrays when a renderer item is removed, omits object
properties whose child traversal returns null, removes rich-item wrappers based
on preferred nested renderer matches, and returns the original payload reference
only after the disabled-mode harvest boundary.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_FILTER_LOGIC_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md`

## Current Counts

```text
renderer traversal/mutation boundary source files: 2
renderer traversal/mutation source/effect blocks: 5
filter_logic filter block lines: 57
filter_logic filter block bytes: 2166
filter_logic filter recursive filter call tokens: 4
filter_logic filter _shouldBlock callsites: 2
filter_logic filter Array.isArray callsites: 1
filter_logic filter filtered.push callsites: 1
filter_logic filter return filtered callsites: 1
filter_logic filter return null callsites: 3
filter_logic filter Object.keys callsites: 1
filter_logic filter Object.entries callsites: 1
filter_logic filter result[key] assignments: 1
filter_logic processData block lines: 32
filter_logic processData block bytes: 1232
filter_logic processData Date.now callsites: 2
filter_logic processData filter callsites: 1
filter_logic processData return filtered callsites: 1
filter_logic global interface block lines: 23
filter_logic global interface block bytes: 892
filter_logic global interface processData tokens: 2
filter_logic global interface harvestOnly tokens: 2
filter_logic unwrapRendererForFiltering block lines: 44
filter_logic unwrapRendererForFiltering block bytes: 1907
filter_logic unwrapRendererForFiltering preferredNestedRenderers tokens: 2
filter_logic unwrapRendererForFiltering wrapperRendererType tokens: 3
filter_logic unwrapRendererForFiltering ViewModel tokens: 3
filter_logic _shouldBlock block lines: 306
filter_logic _shouldBlock block bytes: 15523
filter_logic _shouldBlock return true tokens: 11
filter_logic _shouldBlock return false tokens: 11
filter_logic _shouldBlock whitelist tokens: 20
filter_logic _shouldBlock filterKeywords tokens: 5
filter_logic _shouldBlock filterChannels tokens: 4
filter_logic _shouldBlock _checkContentFilters callsites: 1
filter_logic _shouldBlock _checkCategoryFilters callsites: 1
filter_logic _shouldBlock postMessage callsites: 1
seed processWithEngine block lines: 284
seed processWithEngine block bytes: 13626
seed processWithEngine FilterTubeEngine.processData tokens: 2
seed processWithEngine harvestOnly tokens: 4
seed processWithEngine JSON.stringify tokens: 2
runtime renderer traversal/mutation fixtures: 5
runtime behavior changed: yes; no-work gate bypasses inactive YouTubei response parsing before traversal
not completion proof for JSON-first renderer traversal or mutation authority
```

## Current Traversal/Mutation Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Seed admission | `processWithEngine()` decides whether to call `FilterTubeEngine.processData()` after endpoint body parsing and active-work checks. | Shared endpoint-to-traversal decision with body-work and response-rebuild budgets. |
| Engine process | `processData()` harvests first, returns the original payload when disabled, otherwise records timing and calls `filter()`. | Harvest/mutation separation with revision, metric, and no-op identity reports. |
| Array traversal | `filter()` builds a new array and pushes only non-null child results. | Array compaction policy with sibling-visible fixtures for every renderer family. |
| Object traversal | `filter()` checks all renderer-like keys first; a blocking renderer makes the whole current object return `null`. | Renderer sibling policy proving which adjacent properties can be safely dropped. |
| Object property recursion | Non-renderer objects are rebuilt from `Object.entries()` and omit child keys whose filtered value is `null`. | Object omission report that distinguishes wrapper removal from field-level filtering. |
| Rich item wrapper | `_unwrapRendererForFiltering()` treats `richItemRenderer.content` preferred nested renderers as the filtering candidate. | Wrapper policy for rich items, shelves, lockups, Shorts, playlists, channels, and posts. |
| Block decision | `_shouldBlock()` mixes list mode, keyword/channel/comment/Shorts/content/category rules, channel-map joins, and collaborator cache messages. | One mutation-effect report that separates hide/allow, learned-map, message, and metadata-fetch effects. |

## Runtime Fixture Summary

The active no-match fixture proves `processData()` rebuilds object and array
containers even when no renderer is removed.

The disabled fixture proves `settings.enabled === false` returns the original
payload reference after harvest setup instead of entering traversal.

The array compaction fixture proves a blocked `videoRenderer` item is removed
from an array and the allowed sibling shifts into the remaining array.

The nested object omission fixture proves a blocked renderer inside an ordinary
object property removes that child property while retaining an unrelated
sibling property.

The rich item fixture proves a blocked preferred nested renderer inside
`richItemRenderer.content` removes the whole rich item wrapper.

## Risks Identified

- Reliability: active no-match traversal still rebuilds payload containers, so
  future identity-sensitive consumers need proof before assuming unchanged JSON
  objects remain reference-identical.
- False-hide/leak: blocking a renderer-like child can remove the entire current
  wrapper object, including sibling renderer or metadata properties that were
  not independently evaluated.
- Performance: endpoint parsing, response rebuilding, recursive traversal, and
  object/array reconstruction have no first-class per-endpoint or per-rule
  budget artifact yet.
- Code burden: traversal, wrapper unwrapping, block decisions, harvest effects,
  response mutation, and seed no-work decisions are split across seed and filter
  logic without one traversal/mutation report.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstRendererTraversalContract
jsonFirstRendererMutationBudget
jsonFirstRecursiveFilterReport
jsonFirstArrayCompactionPolicy
jsonFirstObjectOmissionPolicy
jsonFirstRendererWrapperPolicy
jsonFirstRendererSiblingPolicy
jsonFirstFilterNoopIdentityPolicy
jsonFirstTraversalMetricArtifact
jsonFirstRendererMutationFixtureProvenance
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-renderer-traversal-mutation-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first
filtering gap into current recursive traversal, wrapper unwrapping, array
compaction, object-key omission, disabled reference preservation, and
missing first-class traversal/mutation authority only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this JSON-first traversal mutation surface
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
optimization, JSON-first behavior, traversal broadening, mutation contract
changes, response rebuilding changes, or selector/renderer authority changes.
