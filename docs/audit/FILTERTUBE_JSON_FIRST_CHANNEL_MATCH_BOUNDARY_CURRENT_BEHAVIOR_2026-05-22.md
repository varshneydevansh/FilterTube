# FilterTube JSON-First Channel Match Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, identity refactor,
matcher rewrite, settings-mode patch, or permission to change JSON filtering
behavior.

## Purpose

This register records the current channel-match boundary used by JSON-first
renderer decisions after candidate extraction supplies channel metadata. It
extends the shared-identity method register, candidate-extraction proof, and
block-decision proof by pinning how channel rules are converted into boolean
matches without reason/confidence output.

The current boundary is:

```text
FilterTubeIdentity builds an index for channel rules and JSON filtering uses
that index when available. The index can match stable UC ids, handles,
custom URLs, channelMap cross-links, and name-only entries, but it returns only
true/false. The direct shared matcher has broader name fallbacks than indexed
matching, and the filter_logic legacy fallback diverges again when shared
identity is not present.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/shared/identity.js` | 808 | 30599 | `41f26baf0eef27994666430e2b8b490c893eed90abd67f47d562926d94155958` |

Related proof layers:

- `docs/audit/FILTERTUBE_SHARED_IDENTITY_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_CANDIDATE_EXTRACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_BLOCK_DECISION_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_LEARNED_IDENTITY_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_DOM_IDENTITY_CONFIDENCE_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_VISIBLE_EMPTY_RUNTIME_ACTIVE_CURRENT_BEHAVIOR_2026-05-19.md`

## Current Counts

```text
channel match boundary source files: 2
channel match source/effect blocks: 7
filter_logic build channel index block lines: 11
filter_logic build channel index block bytes: 370
filter_logic _matchesAnyChannel block lines: 19
filter_logic _matchesAnyChannel block bytes: 719
filter_logic _matchesChannel fallback block lines: 170
filter_logic _matchesChannel fallback block bytes: 7880
shared buildChannelFilterIndex block lines: 118
shared buildChannelFilterIndex block bytes: 4624
shared channelMetaMatchesIndex block lines: 48
shared channelMetaMatchesIndex block bytes: 1937
shared channelMatchesFilter block lines: 164
shared channelMatchesFilter block bytes: 6948
shared isChannelBlocked block lines: 9
shared isChannelBlocked block bytes: 467
filter_logic _matchesChannel return true tokens: 17
filter_logic _matchesChannel return false tokens: 2
filter_logic _matchesChannel channelMap tokens: 17
shared channelMetaMatchesIndex return true tokens: 11
shared channelMetaMatchesIndex return false tokens: 2
shared channelMatchesFilter return true tokens: 18
shared channelMatchesFilter return false tokens: 7
shared buildChannelFilterIndex nameOnlyNames tokens: 3
shared buildChannelFilterIndex stableNames tokens: 3
shared channelMetaMatchesIndex nameOnlyNames tokens: 3
shared channelMetaMatchesIndex stableNames tokens: 3
runtime channel match fixtures: 6
runtime behavior changed: no
not completion proof for JSON-first channel match authority
```

## Current Match Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| JSON shared index | `_matchesAnyChannel()` uses `FilterTubeIdentity.channelMetaMatchesIndex()` when an index exists and returns its boolean directly. | Channel match decision report with reason, confidence, list mode, and caller. |
| Stable identifiers | Shared indexed matching accepts UC ids, handles, custom URLs, and channelMap-derived UC/handle/custom URL cross-links. | Stable identity provenance and stale-map policy. |
| Name-only index | `buildChannelFilterIndex()` can put plain string entries into `nameOnlyNames`, and indexed matching can match metadata names from those entries. | Explicit low-confidence name-only policy per route/list mode. |
| Stable-name guard | Indexed matching does not use a stable rule's name when metadata already carries a different UC id. | Stable-name fallback reason object and negative fixture registry. |
| Direct shared matcher | `channelMatchesFilter()` can match object filters by equal name even when ids differ, and can match `@handle` strings against metadata names equal to the handle without `@`. | Direct-versus-index parity report and weak-name fallback policy. |
| Filter logic fallback | If shared identity is absent, `_matchesChannel()` uses a legacy fallback that does not match object filters by equal name, but still matches `@handle` against name and channelMap links. | Compatibility fallback scope report and load-order proof. |

## Runtime Fixture Summary

The stable-index fixture proves shared indexed matching admits exact UC ids,
UC-to-handle channelMap cross-links, and custom-url-to-UC channelMap
cross-links.

The direct/index divergence fixture proves direct object-name matching can
return true when filter and metadata ids differ, while indexed matching guards
that case; it also proves name-only strings match through the index but not
through direct string matching.

The handle/name fallback fixture proves direct `@handle` matching can match a
metadata name equal to the handle without `@`, while indexed matching does not
match that same weak name when metadata has a different UC id.

The filter-logic delegation fixture proves `_matchesAnyChannel()` calls the
shared index path and does not call the direct matcher when an index exists.

The legacy fallback fixture proves filter logic without shared identity does
not match object filters by equal name, but does match `@handle` against a
metadata name and can use channelMap for UC/handle cross-matches.

The JSON engine fixture proves a full shared-identity JSON run does not remove
a video solely because a stable filter object's name matches metadata with a
different UC id, while an exact UC id rule removes the same renderer family.

## Risks Identified

- Reliability: every channel branch currently consumes a boolean; it cannot
  report whether the match came from UC id, handle, custom URL, channelMap, or
  weak name fallback.
- False-hide/leak: direct matching and indexed matching intentionally diverge
  for object-name and `@handle` name fallbacks, so callers using different
  paths can disagree on the same metadata.
- Performance: JSON engine builds indexes per filter instance, but the output
  does not carry a reusable match reason or negative proof for downstream
  logging and DOM fallback parity.
- Code burden: shared identity, filter-logic fallback, DOM fallback duplicate
  logic, and content-bridge direct matching still need one first-class channel
  decision contract.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstChannelMatchContract
jsonFirstChannelMatchDecisionReport
jsonFirstChannelMatchConfidencePolicy
jsonFirstChannelMatchIndexDirectParity
jsonFirstChannelMatchFallbackScope
jsonFirstChannelMatchNameOnlyPolicy
jsonFirstChannelMatchStableNameGuard
jsonFirstChannelMapProvenanceReport
jsonFirstChannelMatchCallerMatrix
jsonFirstChannelMatchFixtureProvenance
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-channel-match-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first
filtering gap into current channel rule matching, boolean decision loss,
index/direct divergence, legacy fallback behavior, channelMap dependence, and
missing first-class channel-match authority only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this JSON-first channel-match surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, channel-match changes, channelMap
dependence changes, whitelist behavior changes, or selector/renderer authority
changes.
