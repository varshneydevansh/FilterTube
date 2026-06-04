# FilterTube JSON Comment Keyword Provenance Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, keyword patch,
comment-scope patch, settings compiler patch, JSON-first patch, or permission
to alter filtering behavior.

## Purpose

This slice narrows the JSON comment keyword provenance gap left open by the
Main Filter All comments scope and addFilteredChannel Filter All comments
default slices. It pins how channel-derived Filter All keywords with
`filterAllComments: false` are compiled into global JSON keyword rules, excluded
from the comments-only compiled list, then consumed by `js/filter_logic.js`
without row provenance.

The current boundary is:

```text
settings_shared keeps channel-derived Filter All keywords in global
filterKeywords regardless of filterAllComments, excludes them from
filterKeywordsComments when comments are false, compiles regex payloads as
pattern/flags only, and filter_logic reconstructs global filterKeywords but not
serialized filterKeywordsComments. Because comment text is part of JSON
candidate metadata and the global keyword branch runs before the comment-specific
branch, a channel-derived global keyword can remove a comment mentioning that
channel even when the channel row has filterAllComments:false.
```

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_KEYWORD_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_MAIN_FILTER_ALL_COMMENTS_SCOPE_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_ADD_FILTERED_CHANNEL_FILTER_ALL_COMMENTS_DEFAULT_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ALL_COMMENTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
JSON comment keyword provenance boundary source files: 3
JSON comment keyword provenance source/effect blocks: 8
settings_shared compileKeywords block lines: 15
settings_shared compileKeywords block bytes: 740
settings_shared syncFilterAllKeywords block lines: 72
settings_shared syncFilterAllKeywords block bytes: 2971
settings_shared buildCompiledSettings comments block lines: 2
settings_shared buildCompiledSettings comments block bytes: 170
filter_logic processSettings regex block lines: 29
filter_logic processSettings regex block bytes: 1445
filter_logic candidate metadata/search block lines: 218
filter_logic candidate metadata/search block bytes: 10724
filter_logic global/comment keyword branch block lines: 55
filter_logic global/comment keyword branch block bytes: 3070
background V4 comment compile block lines: 7
background V4 comment compile block bytes: 370
background legacy comments fallback block lines: 35
background legacy comments fallback block bytes: 1961
settings_shared compileKeywords source tokens: 2
settings_shared compileKeywords channelRef tokens: 2
settings_shared syncFilterAllKeywords filterAllComments tokens: 2
settings_shared syncFilterAllKeywords channelRef tokens: 7
settings_shared buildCompiledSettings filterKeywordsComments tokens: 1
filter_logic processSettings RegExp tokens: 5
filter_logic candidate metadata/search commentText tokens: 1
filter_logic candidate metadata/search metadataText tokens: 5
filter_logic global/comment keyword branch filterKeywords tokens: 5
filter_logic global/comment keyword branch filterKeywordsComments tokens: 2
filter_logic global/comment keyword branch commentText tokens: 8
filter_logic global/comment keyword branch _regexMatches tokens: 5
background V4 comment compile filterKeywordsComments tokens: 1
background legacy comments fallback filterKeywordsComments tokens: 5
runtime JSON comment keyword provenance fixtures: 10
runtime behavior changed: no
not completion proof for JSON comment keyword provenance authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Channel-derived global compile | `syncFilterAllKeywords()` creates a channel-derived keyword for every `filterAll: true` channel and stores the row comments flag on the keyword. | A channel-derived keyword comments policy that says which surfaces may consume the global row. |
| Comments-only compile | `buildCompiledSettings()` compiles all synchronized keywords into `filterKeywords` and only `comments === true` rows into `filterKeywordsComments`. | A report that proves comments-false rows cannot still affect comments through another branch. |
| Compiled metadata | `compileKeywords()` returns only `{ pattern, flags }`, dropping `source`, `channelRef`, `comments`, `word`, and `addedAt`. | A compiled keyword metadata/provenance report. |
| Filter logic reconstruction | `_processSettings()` reconstructs `filterKeywords` and `whitelistKeywords` from serialized `{ pattern, flags }`, but not `filterKeywordsComments`. | A serialized comment keyword reconstruction contract. |
| Candidate metadata | `_buildCandidate()` includes `rules.commentText` inside `candidate.metadataText`; `_candidateSearchText()` includes `metadataText`. | A field-level candidate provenance report. |
| Decision order | The global blocklist keyword branch runs before the comment-specific branch. | A comment decision order report with allowed effects and short-circuit reasons. |
| Comments-false channel keyword | A comment mentioning a Filter All channel can be removed by the global keyword branch even when that channel row has `filterAllComments: false`. | A false-hide budget and rollback/restore policy for channel-derived comment effects. |
| Background parity | Background V4 and legacy comment compilers also produce comments lists without row provenance in the compiled regex entries. | Background/shared compiler parity report with profile, list mode, and row identity. |

## Runtime Fixture Summary

The runtime guard proves:

1. `settings_shared.buildCompiledSettings()` keeps a channel-derived
   `filterAllComments:false` keyword in global `filterKeywords`.
2. The same compiled settings excludes that keyword from
   `filterKeywordsComments`.
3. The compiled global keyword object contains only `pattern` and `flags`.
4. A comment mentioning that channel is removed by the JSON engine through the
   global keyword branch even though the channel row has
   `filterAllComments:false`.
5. The same comment survives when the global compiled keyword list is removed
   and no comment-specific regex exists.
6. Serialized `{ pattern, flags }` entries in `filterKeywordsComments` are not
   reconstructed by `filter_logic.js`, so they do not block comments unless they
   arrive as direct `RegExp` instances.
7. Direct `RegExp` comment keywords still remove comments.
8. The source order keeps global keyword matching before the comment-specific
   branch.
9. The candidate builder puts comment text into metadata searched by global
   keywords.
10. Product runtime still lacks first-class JSON comment keyword provenance
    gates.

## Risks Identified

- Reliability: comments-scope state is carried during synchronization but
  discarded by compiled regex payloads before JSON decisions run.
- False-hide/leak: `filterAllComments:false` does not fully prevent
  channel-derived global keywords from hiding comments that mention that
  channel.
- Performance: comment renderers can evaluate global keyword regexes over
  candidate metadata before reaching the comment-specific keyword list.
- Code burden: comments-scope decisions are split across settings sync,
  compiler output, filter settings reconstruction, candidate construction,
  global keyword matching, and comment keyword matching.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonCommentKeywordProvenanceContract
jsonCommentKeywordGlobalPrecedenceReport
jsonCommentKeywordChannelScopePolicy
jsonCommentKeywordCompiledMetadataReport
jsonCommentKeywordSerializedReconstructionReport
jsonCommentKeywordDecisionOrderReport
jsonCommentKeywordFalseHideBudget
jsonCommentKeywordFixtureProvenance
jsonCommentKeywordMetricArtifact
jsonCommentKeywordAuthorityGate
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-comment-keyword-provenance-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first
comments-scope gap into current channel-derived keyword compilation, comments
list compilation, compiled metadata loss, serialized comment-keyword
reconstruction, global keyword precedence, and comment false-hide behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
