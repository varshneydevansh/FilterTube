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

The current boundary, revalidated on 2026-10-18, is:

```text
settings_shared retains channel-derived video rules in filterKeywords and only
comments-enabled rules in filterKeywordsComments. The engine reconstructs both
serialized lists, excludes comments from the generic candidate-keyword branch,
and matches the explicit comment list only against comment body text. An
explicit empty comment list preserves unrelated-author comments. If the list is
absent, the legacy global-list fallback still applies to comment bodies.
```

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 4536 | 222044 | `20c1426a56eeaa925b42d192a56699c2cfaafbc291bb7e2f583d3e5d29fc7f6c` |
| `js/settings_shared.js` | 1313 | 66857 | `19f0a1fb3cd512494481b7eb39169bf84feeda4a0a6a20cf58ebaf1c18ff7ba9` |
| `js/background.js` | 8538 | 386043 | `cc89bb4a0375145e1c811b7cf5953729c39c409b6b24cacdc65c80f9f6ff44d0` |

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
settings_shared buildCompiledSettings filterKeywordsComments tokens: 3
filter_logic processSettings RegExp tokens: 3
filter_logic candidate metadata/search commentText tokens: 3
filter_logic candidate metadata/search metadataText tokens: 3
filter_logic global/comment keyword branch filterKeywords tokens: 3
filter_logic global/comment keyword branch filterKeywordsComments tokens: 2
filter_logic global/comment keyword branch commentText tokens: 8
filter_logic global/comment keyword branch _regexMatches tokens: 3
background V4 comment compile filterKeywordsComments tokens: 3
background legacy comments fallback filterKeywordsComments tokens: 3
runtime JSON comment keyword provenance fixtures: 10
runtime behavior changed: no
not completion proof for JSON comment keyword provenance authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Channel-derived global compile | `syncFilterAllKeywords()` creates a channel-derived keyword for every `filterAll: true` channel and stores the row comments flag on the keyword. | A channel-derived keyword comments policy that says which surfaces may consume the global row. |
| Comments-only compile | `buildCompiledSettings()` excludes comment-only rows from video keywords and compiles `comments === true` rows into `filterKeywordsComments`. | A report that proves comments-false rows cannot still affect comments through another branch. |
| Compiled metadata | `compileKeywords()` serializes `{ pattern, flags }` plus an optional enabled date filter, dropping `source`, `channelRef`, `comments`, `word`, and `addedAt`. | A compiled keyword metadata/provenance report. |
| Filter logic reconstruction | `_processSettings()` reconstructs serialized video, allowlist, and explicit comment patterns; direct comment RegExp objects remain supported. | A serialized comment keyword reconstruction contract. |
| Candidate metadata | `_buildCandidate()` includes `rules.commentText` inside `candidate.metadataText`; `_candidateSearchText()` includes `metadataText`. | A field-level candidate provenance report. |
| Decision order | The generic blocklist keyword branch explicitly excludes comment renderers; the comment-specific branch owns body matching. | A comment decision order report with allowed effects and short-circuit reasons. |
| Comments-false channel keyword | An unrelated-author comment mentioning a Filter All channel survives when that row has `filterAllComments: false`; author-channel blocking remains independent. | A false-hide budget and rollback/restore policy for channel-derived comment effects. |
| Background parity | Background V4 and legacy comment compilers also produce comments lists without row provenance in the compiled regex entries. | Background/shared compiler parity report with profile, list mode, and row identity. |

## Runtime Fixture Summary

The runtime guard proves:

1. A comments-disabled channel-derived keyword remains a video rule and is excluded from the comment list.
2. Serialized compiled entries retain pattern and flags; optional date-filter metadata is tested separately from row provenance.
3. An unrelated-author comment survives the video-only channel-derived rule.
4. An explicit empty comment list excludes global keyword matching.
5. Serialized and direct RegExp comment rules both remove matching comment bodies.
6. Author-channel blocking and hide-all-comments remain independent decisions.
7. An absent comment list retains legacy body-only fallback.
8. Product runtime still lacks a unified JSON comment keyword provenance report.

## Risks Identified

Compiled regex payloads still omit row source/channel identity, and the compiler, author-channel policy, JSON body matcher, and DOM matcher remain separate authorities. The corrected explicit-list behavior is not proof of exhaustive compiler/import/profile parity, DOM boundary equivalence, or an installed-browser false-hide budget.

## 2026-10-18 comment-scope revalidation

The actual shared compiler and JSON engine fixtures now verify that an explicit empty comment list preserves unrelated-author comments, while opted-in comment rules and independent author blocking still work. This supersedes the old global-before-comment defect recorded by the original May audit. JSON comment keyword provenance gates remain incomplete beyond this bounded correction.

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
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.

## Revalidation - 2026-10-18

Source fingerprints and bounded extraction inventories were refreshed against the current checkout after source review. These are drift detectors, not exhaustive semantic proof, installed-browser evidence, or approval of the broader missing-authority gates. Executable fixtures below remain the behavior checks.

Current candidate metadata/search extraction block: 245 lines, 12502 bytes. This includes the reviewed autoplay gate and does not establish broader comment keyword proof.

## Controls source inventory refresh - 2026-10-25

The current `js/filter_logic.js` fingerprint and any affected line references above reflect the narrow autoplay correction: decorative end-screen hiding preserves playback endpoints; explicit Disable autoplay and individual filtering rules still govern them. This inventory refresh itself changes no runtime code and promotes none of the unresolved semantic-proof gates. See `docs/audit/TIME_LIMITS_AUTOPLAY_RESET_IMPLEMENTATION_2026-10-25.md` for implementation and executable validation.
