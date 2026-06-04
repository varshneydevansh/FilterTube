# FilterTube JSON Comment Entity Payload Provenance Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, entity payload patch,
comment filtering patch, continuation patch, fetch patch, XHR patch, settings
schema patch, or fixture extraction patch.

## Purpose

This slice isolates the comment continuation entity payload gap left open by the
comment keyword, author-channel, ViewModel, structural-wrapper, and XHR parity
proofs. It pins that real Main watch comment continuation JSON can split visible
comment shell data from `frameworkUpdates.entityBatchUpdate.commentEntityPayload`
text and author identity, while current JSON filtering only treats renderer
rules as first-class comment evidence.

Current boundary:

```text
The reduced Main append-comment fixture contains a visible
commentThreadRenderer with a nested commentViewModel key and a paired
frameworkUpdates.entityBatchUpdate.mutations payload carrying the actual comment
text, author handle, author channel id, and channel endpoint. filter_logic has
commentRenderer rules for authorEndpoint, authorText, and contentText, plus a
recursive commentThreadRenderer shell rule, but no runtime JS token or rule for
commentEntityPayload, frameworkUpdates, entityBatchUpdate, entityKey,
authorButtonA11y, or channelPageEndpoint. As a result, global keywords,
comment-only keywords, and author channel filters can ignore the entity payload,
while hideAllComments removes the visible continuation item and preserves the
frameworkUpdates entity data.
```

## Source And Fixture Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `tests/runtime/fixtures/captures/main-comment-append-entity-response.json` | 96 | 3560 | `6e8dfcdde0dd21610f602ad01eb46b4cb5ce45903188c0f457cefb970b7fec8f` |

Related proof layers:

- `docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_KEYWORD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_AUTHOR_CHANNEL_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_VIEW_MODEL_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_STRUCTURAL_WRAPPER_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_XHR_COMMENT_CONTINUATION_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`

## Current Counts

```text
JSON comment entity payload provenance source/fixture files: 3
JSON comment entity payload provenance source/effect blocks: 7
filter_logic comment renderer rules lines: 9
filter_logic comment renderer rules bytes: 380
filter_logic candidate metadata lines: 46
filter_logic candidate metadata bytes: 2507
filter_logic comment decision lines: 34
filter_logic comment decision bytes: 1947
filter_logic object renderer removal lines: 11
filter_logic object renderer removal bytes: 536
filter_logic recursive property copy lines: 18
filter_logic recursive property copy bytes: 743
seed fetch comment shortcut lines: 38
seed fetch comment shortcut bytes: 2269
fixture entity payload block lines: 47
fixture entity payload block bytes: 1834
selected product runtime JS commentEntityPayload tokens: 0
selected product runtime JS frameworkUpdates tokens: 0
selected product runtime JS entityBatchUpdate tokens: 0
selected product runtime JS entityKey tokens: 0
selected product runtime JS authorButtonA11y tokens: 0
selected product runtime JS channelPageEndpoint tokens: 0
fixture commentEntityPayload tokens: 2
fixture frameworkUpdates tokens: 2
fixture entityBatchUpdate tokens: 2
fixture commentKey tokens: 1
fixture entityKey tokens: 1
fixture YOONGI tokens: 1
fixture UCUooqKoZc3DF4KlktYF_vzQ tokens: 2
fixture miguelsantiagocalderonmore9380 tokens: 4
runtime JSON comment entity payload provenance fixtures: 10
runtime behavior changed: no
not completion proof for JSON comment entity payload authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Fixture provenance | `main-comment-append-entity-response.json` is reduced from `YT_MAIN_NEXT_RESPONSE_COMMENT.json` and carries both visible continuation shell and entity payload evidence. | Fixture provenance contract for raw path, reduced path, route, surface, profile, and expected decision. |
| Visible shell | The visible continuation item is a `commentThreadRenderer` with nested `commentViewModel` key only. | Comment shell/entity join policy. |
| Entity text | The actual keyword-bearing comment text lives in `commentEntityPayload.properties.content.content`. | Entity text extraction and comments-keyword policy. |
| Entity author | The actual author id, handle, and endpoint live under `commentEntityPayload.author`. | Entity author identity policy. |
| Renderer rules | `commentRenderer` has paths for author endpoint/text and `contentText`; `commentThreadRenderer` has no direct paths. | Entity-aware renderer and payload rule manifest. |
| Candidate text | Candidate metadata collects `rules.commentText`, but entity payload fields are not in the rule set. | Entity payload candidate metadata report. |
| Comment decision | Comment-specific filtering depends on renderer key and rule-derived comment text/channel info. | Comment decision report with entity payload provenance. |
| Hide-all behavior | `hideAllComments:true` removes the visible continuation item while preserving `frameworkUpdates.entityBatchUpdate`. | Entity cleanup and privacy policy. |
| Fetch shortcut | The fetch shortcut replaces visible continuation items with a synthetic end marker and preserves spread response fields, including `frameworkUpdates`. | Fetch shortcut entity cleanup policy. |

## Source Anchors

```text
filterLogicCommentRules: `js/filter_logic.js:836`
filterLogicCommentTextPaths: `js/filter_logic.js:839`
filterLogicCommentThreadRule: `js/filter_logic.js:841`
filterLogicCandidateCommentText: `js/filter_logic.js:1738`
filterLogicCommentDecision: `js/filter_logic.js:2213`
filterLogicCommentKeywordText: `js/filter_logic.js:2220`
filterLogicCommentAuthorDecision: `js/filter_logic.js:2238`
seedFetchShortcutGate: `js/seed.js:703`
seedFetchShortcutSpread: `js/seed.js:715`
seedFetchSyntheticEndpoint: `js/seed.js:716`
fixtureExtractedPath: `tests/runtime/fixtures/captures/main-comment-append-entity-response.json:6`
fixtureVisibleCommentViewModelKey: `tests/runtime/fixtures/captures/main-comment-append-entity-response.json:36`
fixtureEntityKey: `tests/runtime/fixtures/captures/main-comment-append-entity-response.json:52`
fixtureCommentEntityPayload: `tests/runtime/fixtures/captures/main-comment-append-entity-response.json:55`
fixtureEntityContent: `tests/runtime/fixtures/captures/main-comment-append-entity-response.json:60`
fixtureAuthorButtonA11y: `tests/runtime/fixtures/captures/main-comment-append-entity-response.json:64`
fixtureAuthorChannelId: `tests/runtime/fixtures/captures/main-comment-append-entity-response.json:67`
fixtureAuthorBrowseId: `tests/runtime/fixtures/captures/main-comment-append-entity-response.json:83`
```

## Runtime Fixture Summary

The runtime guard proves:

1. The reduced fixture ties one visible `commentThreadRenderer` shell to one
   entity payload using matching `commentKey`, `entityKey`, and payload key
   values.
2. Product runtime JS currently has zero selected entity payload tokens for
   `commentEntityPayload`, `frameworkUpdates`, `entityBatchUpdate`, `entityKey`,
   `authorButtonA11y`, and `channelPageEndpoint`.
3. A global keyword matching only entity payload text leaves the response
   unchanged.
4. A comments-only keyword matching only entity payload text leaves the response
   unchanged.
5. A channel-id filter matching only entity payload author id leaves the
   response unchanged.
6. A channel-handle filter matching only entity payload author handle leaves the
   response unchanged.
7. `hideAllComments:true` removes the visible continuation item and preserves
   entity payload text and author identity under `frameworkUpdates`.
8. `hideAllComments:true` plus the global entity keyword still preserves the
   entity payload after visible item removal.
9. The fetch shortcut under `hideAllComments:true` bypasses the engine, writes a
   synthetic end marker, and preserves `frameworkUpdates`.
10. The current fixture remains a partial append-continuation extraction, not
    reload/replace/entity cleanup completion proof.

## Risks Identified

- Reliability: visible renderer pruning and entity payload retention can
  disagree about whether a comment is present.
- False-hide/leak: comment text and author identity can survive in
  `frameworkUpdates` after the visible continuation item is hidden.
- Performance: downstream passes can retain and serialize entity payloads that
  are not used for current filtering decisions.
- Code burden: comment behavior depends on renderer rules, recursive traversal,
  fetch shortcut response spreading, and capture fixture interpretation without
  one entity payload authority gate.

## Future Proof Fields

```text
rawCapture
reducedFixture
endpoint
route
surface
profileType
listMode
settings mode
visibleRendererPath
entityPayloadPath
commentKey
entityKey
payloadKey
entityTextPath
entityAuthorIdPath
entityAuthorHandlePath
entityAuthorEndpointPath
rendererRulePath
joinPolicy
cleanupPolicy
keywordDecision
authorDecision
transport
responseBodyMode
metricArtifact
```

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonCommentEntityPayloadProvenanceContract
jsonCommentEntityPayloadDecisionReport
jsonCommentEntityPayloadRuleManifest
jsonCommentEntityTextExtractionPolicy
jsonCommentEntityAuthorExtractionPolicy
jsonCommentEntityJoinPolicy
jsonCommentEntityCleanupPolicy
jsonCommentEntityFetchShortcutPolicy
jsonCommentEntityFixtureProvenance
jsonCommentEntityMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-comment-entity-payload-provenance-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open comment entity
payload gap into current fixture provenance, renderer/entity split, keyword and
author miss behavior, hide-all retention, fetch shortcut retention, cleanup,
false-hide/leak, performance, and first-class JSON comment evidence risks only.

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
