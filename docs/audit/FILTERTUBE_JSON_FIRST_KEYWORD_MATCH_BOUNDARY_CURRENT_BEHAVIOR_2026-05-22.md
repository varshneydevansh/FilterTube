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
| `js/filter_logic.js` | 4534 | 221980 | `f7021a053af96a4cd31a577f56e900ffb1a5d990fe55a838af64a6dba867afc4` |
| `js/settings_shared.js` | 1313 | 66857 | `19f0a1fb3cd512494481b7eb39169bf84feeda4a0a6a20cf58ebaf1c18ff7ba9` |
| `js/background.js` | 8538 | 386043 | `cc89bb4a0375145e1c811b7cf5953729c39c409b6b24cacdc65c80f9f6ff44d0` |
| `js/content/dom_fallback.js` | 8,177 | 380,719 | `bc072cfd232c1b19fc02c38de008fd84c52de774752f802aef9dac8b560d4851` |

## Boundary Counts

```text
keyword match boundary source files: 8
keyword match source/effect blocks: 10
filter_logic keyword regex reconstruction block lines: 45
filter_logic keyword regex reconstruction block bytes: 2550
filter_logic candidate search text block lines: 15
filter_logic candidate search text block bytes: 663
filter_logic _regexMatches block lines: 15
filter_logic _regexMatches block bytes: 396
filter_logic whitelist keyword block lines: 15
filter_logic whitelist keyword block bytes: 772
filter_logic blocklist keyword block lines: 21
filter_logic blocklist keyword block bytes: 1230
filter_logic comment keyword block lines: 34
filter_logic comment keyword block bytes: 2032
settings_shared compileKeywords block lines: 19
settings_shared compileKeywords block bytes: 1020
background compileKeywordEntries block lines: 45
background compileKeywordEntries block bytes: 2213
background comments keyword fallback block lines: 35
background comments keyword fallback block bytes: 1961
DOM fallback matchesKeyword block lines: 36
DOM fallback matchesKeyword block bytes: 1278
filter_logic total _regexMatches tokens: 9
filter_logic total filterKeywordsComments tokens: 6
settings_shared compileKeywords tokens: 8
background compileKeywordEntries tokens: 8
DOM fallback matchesKeyword tokens: 8
runtime keyword match fixtures: 9
```

## Current Behavior Pinned

| Boundary | Current behavior | Missing first-class field |
| --- | --- | --- |
| Serialized keyword reconstruction | `js/filter_logic.js` reconstructs serialized video, allowlist, and explicit comment patterns. | Comment keyword reconstruction contract shared with background compiled settings. |
| JSON candidate search | `_candidateSearchText()` joins title, description, tags, metadata text, and channel identity text. Metadata includes rule channel names and comment text. | Per-field keyword decision report showing exact matched source field. |
| Regex execution | `_regexMatches()` resets `lastIndex` before and after `test()`, so global regexes can match repeated siblings. | Regex state report for flags, compiled source, and reset behavior. |
| Blocklist keywords | Non-channel renderers search the combined candidate text and then infer title, description, or JSON metadata as the log location. | Structured field provenance instead of post-match location inference. |
| Comment keywords | The generic candidate-keyword branch excludes comments. Explicit comment lists, including empty lists, govern body matching; serialized and direct RegExp entries work. Absent lists retain legacy body-only fallback. | Explicit global-to-comment policy and comment list reconstruction gate. |
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
- serialized `filterKeywordsComments` is reconstructed by the engine; direct `RegExp` comment lists remain supported.
- explicit empty comment list excludes global keyword matching.
- whitelist keyword matches allow content, while whitelist keyword misses
  fail closed.
- channel-only renderers skip keyword matching.

## Risk Interpretation

- Reliability: keyword decisions depend on whether settings arrived as compiled
  `RegExp` instances, serialized objects, background-compiled lists, or shared
  settings payloads.
- False-hide/leak: explicit comment-list isolation is covered by current fixtures, but row provenance and full JSON/DOM parity remain unproved.
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


## Advert source-pin revalidation - 2026-10-22

The earlier dated runtime-change statements describe their historical slices.
The DOM fallback fingerprint now includes exact mobile ad-slot, promoted-video,
and video-masthead-ad CSS selectors from the separate advert correction. The
keyword engine, keyword matching source/effect blocks, and their assertions
were not changed by this refresh.

Affected whole-file fingerprints and shifted source anchors were recomputed
from the current files. Selected source/effect block bytes, hashes, counts and
semantic assertions were retained. The five affected blocking audit suites
passed at pre-advert HEAD `14f08c4b` before these pin updates; their current
fixtures also pass after the bounded refresh. This is source/VM regression
evidence, not installed ad coverage, physical-device acceptance, or completion
of the wider semantic/security proof gates. This audit refresh changes no
product runtime.
