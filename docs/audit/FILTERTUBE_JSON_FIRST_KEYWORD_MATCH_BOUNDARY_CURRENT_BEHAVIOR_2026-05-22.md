# FilterTube JSON-First Keyword Match Boundary Current Behavior - 2026-05-22

Status: current-behavior proof slice. This is not an implementation patch,
optimization patch, keyword-behavior patch, DOM fallback patch, or settings
schema patch.

This slice promotes the earlier P0 keyword authority audit into the JSON-first
proof chain. It isolates how keyword decisions currently cross compiled
settings, JSON candidate text, comments, whitelist mode, channel-only renderers,
and DOM fallback matching before any first-class JSON filter authority is added.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Boundary Counts

```text
keyword match boundary source files: 4
keyword match source/effect blocks: 10
filter_logic keyword regex reconstruction block lines: 29
filter_logic keyword regex reconstruction block bytes: 1445
filter_logic candidate search text block lines: 15
filter_logic candidate search text block bytes: 663
filter_logic _regexMatches block lines: 18
filter_logic _regexMatches block bytes: 488
filter_logic whitelist keyword block lines: 15
filter_logic whitelist keyword block bytes: 687
filter_logic blocklist keyword block lines: 21
filter_logic blocklist keyword block bytes: 1123
filter_logic comment keyword block lines: 34
filter_logic comment keyword block bytes: 1947
settings_shared compileKeywords block lines: 15
settings_shared compileKeywords block bytes: 740
background compileKeywordEntries block lines: 23
background compileKeywordEntries block bytes: 1040
background comments keyword fallback block lines: 35
background comments keyword fallback block bytes: 1961
DOM fallback matchesKeyword block lines: 36
DOM fallback matchesKeyword block bytes: 1278
filter_logic total _regexMatches tokens: 8
filter_logic total filterKeywordsComments tokens: 2
settings_shared compileKeywords tokens: 4
background compileKeywordEntries tokens: 4
DOM fallback matchesKeyword tokens: 4
runtime keyword match fixtures: 8
```

## Current Behavior Pinned

| Boundary | Current behavior | Missing first-class field |
| --- | --- | --- |
| Serialized keyword reconstruction | `js/filter_logic.js` reconstructs `filterKeywords` and `whitelistKeywords`, but leaves serialized `filterKeywordsComments` as plain objects. | Comment keyword reconstruction contract shared with background compiled settings. |
| JSON candidate search | `_candidateSearchText()` joins title, description, tags, metadata text, and channel identity text. Metadata includes rule channel names and comment text. | Per-field keyword decision report showing exact matched source field. |
| Regex execution | `_regexMatches()` resets `lastIndex` before and after `test()`, so global regexes can match repeated siblings. | Regex state report for flags, compiled source, and reset behavior. |
| Blocklist keywords | Non-channel renderers search the combined candidate text and then infer title, description, or JSON metadata as the log location. | Structured field provenance instead of post-match location inference. |
| Comment keywords | Comment text is also part of candidate metadata, so global `filterKeywords` can remove comments before the comment-specific branch. Direct `RegExp` comment lists work, but serialized comment lists do not. | Explicit global-to-comment policy and comment list reconstruction gate. |
| Whitelist keywords | Whitelist keyword matches allow non-comment renderers, while misses fall into fail-closed whitelist blocking. | Whitelist miss report with keyword candidates, identity state, and fail-closed reason. |
| Channel-only renderers | `channelRenderer` and `gridChannelRenderer` skip keyword matching in both blocklist and whitelist keyword paths. | Renderer field policy for channel rows versus video/content rows. |
| DOM fallback | `matchesKeyword()` has raw regex, normalized regex, and plain keyword fallback with either-side boundary matching. | JSON/DOM parity report for boundary model and normalized text policy. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

- substring keywords can hide larger words in JSON matching.
- exact Unicode-boundary patterns do not hide larger words but hide standalone
  words.
- global regex state is reset so `g`-flag keywords can match repeated siblings.
- candidate text can hide by title, description, tags, metadata, and channel
  display text.
- serialized `filterKeywordsComments` is ignored by the engine while a direct
  `RegExp` comment list blocks.
- global keywords can still hide comments through candidate metadata even when
  the explicit comment keyword list is empty.
- whitelist keyword matches allow content, while whitelist keyword misses
  fail closed.
- channel-only renderers skip keyword matching.

## Risk Interpretation

- Reliability: keyword decisions depend on whether settings arrived as compiled
  `RegExp` instances, serialized objects, background-compiled lists, or shared
  settings payloads.
- False-hide/leak: comment text can be hidden by global keyword metadata search
  before the comment-specific keyword policy runs.
- Performance: combined candidate search text broadens every keyword regex
  against title, description, metadata, tags, and channel text without a
  per-field budget.
- Code burden: exactness, comments scope, whitelist fail-closed behavior,
  channel-derived provenance, and DOM normalized fallback remain split across
  four files.

## Non-Completion Boundary

This does not close JSON-first keyword matching. Product runtime source still
lacks first-class keyword match contracts, decision reports, boundary policies,
comment-scope reports, source provenance, JSON/DOM parity reports, whitelist
miss reports, regex state reports, channel-derived keyword provenance, and
fixture provenance. The following symbols are intentionally absent from product
runtime source today:

```text
jsonFirstKeywordMatchContract
jsonFirstKeywordDecisionReport
jsonFirstKeywordBoundaryPolicy
jsonFirstKeywordCommentScopeReport
jsonFirstKeywordSourceProvenance
jsonFirstKeywordDomParityReport
jsonFirstKeywordWhitelistMissReport
jsonFirstKeywordRegexStateReport
jsonFirstChannelDerivedKeywordProvenance
jsonFirstKeywordFixtureProvenance
```

## Validation

```text
node --test tests/runtime/json-first-keyword-match-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this JSON-first keyword-match surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, keyword-match changes, DOM parity changes,
channel-derived keyword provenance changes, or whitelist behavior changes.
