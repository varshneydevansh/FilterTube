# FilterTube JSON Comment Author Channel Provenance Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, channel-filter patch,
comment-scope patch, whitelist patch, JSON-first patch, or permission to alter
filtering behavior.

## Purpose

This slice narrows the JSON comment author channel provenance gap adjacent to
the JSON comment keyword provenance proof. It pins how `commentRenderer` author
identity is extracted, how channel rows carry `filterAllComments`, and how
`js/filter_logic.js` consumes `filterChannels` for comment renderers without
checking `filterAll`, `filterAllComments`, row provenance, profile, or list
target.

The current boundary is:

```text
commentRenderer rules extract author browse id and author text as channel
identity; filter_logic preserves channel row fields during normalization, but
the whitelist fail-closed branch explicitly skips comment renderers. Matching
comment author rows then pass through the global channel-filter branch before
the comment-specific branch, and the comment author branch repeats a channel
match. Neither branch checks filterAllComments, so a matching filterChannels row
with filterAll:false and filterAllComments:false can still remove a comment in
blocklist mode and in whitelist mode when that blocklist row remains present.
```

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_COMMENT_KEYWORD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ALL_COMMENTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_MAIN_FILTER_ALL_COMMENTS_SCOPE_CURRENT_BEHAVIOR_2026-05-23.md`

## Current Counts

```text
JSON comment author channel provenance boundary source files: 3
JSON comment author channel provenance source/effect blocks: 8
filter_logic comment renderer rules block lines: 5
filter_logic comment renderer rules block bytes: 229
filter_logic filterChannels normalization block lines: 17
filter_logic filterChannels normalization block bytes: 1026
filter_logic shouldBlock setup block lines: 45
filter_logic shouldBlock setup block bytes: 2191
filter_logic whitelist comment bypass block lines: 110
filter_logic whitelist comment bypass block bytes: 5535
filter_logic global channel branch block lines: 17
filter_logic global channel branch block bytes: 1090
filter_logic comment branch author block lines: 34
filter_logic comment branch author block bytes: 1947
settings_shared sanitizeChannelEntry block lines: 82
settings_shared sanitizeChannelEntry block bytes: 3619
background compiled channel object block lines: 40
background compiled channel object block bytes: 2893
filter_logic filterChannels normalization filterChannels tokens: 5
filter_logic shouldBlock setup isCommentRenderer tokens: 1
filter_logic shouldBlock setup listMode tokens: 3
filter_logic whitelist comment bypass isCommentRenderer tokens: 1
filter_logic whitelist comment bypass _matchesAnyChannel tokens: 2
filter_logic global channel branch filterChannels tokens: 2
filter_logic global channel branch _matchesAnyChannel tokens: 1
filter_logic global channel branch filterAllComments tokens: 0
filter_logic comment branch author filterChannels tokens: 2
filter_logic comment branch author commentChannelInfo tokens: 9
filter_logic comment branch author _matchesAnyChannel tokens: 1
filter_logic comment branch author filterAllComments tokens: 0
settings_shared sanitizeChannelEntry filterAllComments tokens: 8
background compiled channel object filterAllComments tokens: 4
runtime JSON comment author channel provenance fixtures: 10
runtime behavior changed: no
not completion proof for JSON comment author channel provenance authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Comment author identity | `commentRenderer` maps `authorEndpoint.browseEndpoint.browseId` and `authorText.simpleText` to channel fields. | Comment author identity provenance report with renderer, path, and confidence. |
| Channel row metadata | Shared/background compilers preserve `filterAllComments` on channel rows. | Row metadata contract proving which fields affect videos, keywords, and comments. |
| Filter logic normalization | `filter_logic.js` spreads channel row objects and lowercases id, handle, and name, preserving extra fields without using them. | Normalized row provenance report with before/after field retention. |
| Whitelist bypass | The whitelist fail-closed branch runs only when `!isCommentRenderer`, so comments bypass empty-whitelist removal. | Comment list-mode policy separating allow-list semantics from blocklist remnants. |
| Global channel branch | The global channel branch runs before comment-specific filtering and can remove a matching comment author through `filterChannels`. | Decision-order report and comments-specific channel policy. |
| Comment author branch | The comment-specific author branch repeats a `filterChannels` match but also lacks `filterAllComments` and profile/list-target checks. | Duplicate branch report and row-scope policy. |
| Comments-scope flag | `filterAll:false` and `filterAllComments:false` do not prevent matching comment author rows from being removed. | False-hide/leak budget for blocked-channel comments versus Filter All comments. |
| Whitelist mode | A dormant matching `filterChannels` row can remove comments even when `listMode` is `whitelist`. | Whitelist blocklist-remnant report with migration/cleanup policy. |

## Runtime Fixture Summary

The runtime guard proves:

1. A matching `filterChannels` row removes a `commentRenderer` by author id in
   blocklist mode even when that row has `filterAll:false` and
   `filterAllComments:false`.
2. A nonmatching channel row preserves the same comment.
3. The same matching blocklist row removes the comment in whitelist mode.
4. An empty whitelist with no blocklist row preserves the comment, confirming
   comments bypass fail-closed whitelist removal.
5. A whitelist channel row alone preserves the comment because comment renderers
   do not enter the whitelist allow branch.
6. Source order keeps the global channel branch before the comment-specific
   branch.
7. The global channel branch has no `filterAllComments` token.
8. The comment author branch has no `filterAllComments` token.
9. Shared/background compilers carry `filterAllComments` on channel rows before
   filter_logic ignores it for author-channel comment decisions.
10. Product runtime still lacks first-class JSON comment author channel
    provenance gates.

## Risks Identified

- Reliability: comment author blocking is split across global channel matching
  and a second comment-specific author branch without a unified decision report.
- False-hide/leak: comments can be hidden by channel rows even when those rows
  explicitly carry `filterAllComments:false`.
- Performance: comments evaluate channel matches before reaching
  comment-specific keyword/author logic, and the duplicate author branch repeats
  matching work if the global branch did not return.
- Code burden: list mode, channel row metadata, author extraction,
  filterAll/filterAllComments scope, and comment renderer decisions are spread
  across settings compilers and filter logic.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonCommentAuthorChannelProvenanceContract
jsonCommentAuthorChannelFilterAllCommentsPolicy
jsonCommentAuthorChannelGlobalBranchReport
jsonCommentAuthorChannelWhitelistModeReport
jsonCommentAuthorChannelCompiledMetadataReport
jsonCommentAuthorChannelDecisionOrderReport
jsonCommentAuthorChannelFalseHideBudget
jsonCommentAuthorChannelFixtureProvenance
jsonCommentAuthorChannelMetricArtifact
jsonCommentAuthorChannelAuthorityGate
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-comment-author-channel-provenance-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first
comments-scope gap into current comment author identity extraction, channel row
metadata preservation, whitelist comment bypass, global channel branch order,
comment-author channel matching, and blocklist-remnant behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5830
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5830
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
