# FilterTube JSON-First Candidate Extraction Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, extractor rewrite,
renderer expansion, collaborator-policy patch, settings-mode patch, or
permission to change JSON filtering behavior.

## Purpose

This register records the current candidate-extraction boundary inside
`YouTubeDataFilter` before `_shouldBlock()` applies the final hide/allow
decision. It extends the JSON-first readiness, rule-field, renderer traversal,
and block-decision proofs by pinning how renderer JSON is converted into the
candidate fields used by channel, keyword, collaborator, content, and category
decisions.

The current boundary is:

```text
_buildCandidate extracts title, description, video id, playlist id, metadata
text, duration/published/view strings, and structural flags every time it runs,
but only extracts channel identity when the caller passes
extractChannelIdentity. Channel names still enter metadata search text through
rule paths even when channel identity extraction is skipped. Collaboration
extraction prefers broad avatar-stack scanning before showDialogCommand parsing,
does not parse the documented showSheetCommand roster path, and can emit mapping
messages while building candidate identity.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md`
- `docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_FILTER_LOGIC_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_RENDERER_TRAVERSAL_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_BLOCK_DECISION_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md`

## Current Counts

```text
candidate extraction boundary source files: 1
candidate extraction source/effect blocks: 11
collect text block lines: 25
collect text block bytes: 1249
extract video id block lines: 23
extract video id block bytes: 1033
extract playlist id block lines: 16
extract playlist id block bytes: 670
build candidate block lines: 80
build candidate block bytes: 4260
candidate search text block lines: 15
candidate search text block bytes: 655
extract title block lines: 21
extract title block bytes: 681
extract description block lines: 34
extract description block bytes: 1556
extract channel info block lines: 318
extract channel info block bytes: 18196
avatar stack extraction block lines: 101
avatar stack extraction block bytes: 5289
showDialog extraction block lines: 117
showDialog extraction block bytes: 7760
rule channel extraction block lines: 94
rule channel extraction block bytes: 4977
build candidate _collectTextFromPaths tokens: 11
build candidate metadataText tokens: 3
build candidate extractChannelIdentity tokens: 1
extract channel info avatarStackViewModel tokens: 3
extract channel info showDialogCommand tokens: 11
extract channel info getByPath tokens: 4
extract channel info getTextFromPaths tokens: 3
extract channel info return collaborators tokens: 3
extract channel info return channelInfo tokens: 1
runtime candidate extraction fixtures: 6
runtime behavior changed: no
not completion proof for JSON-first candidate extraction authority
```

## Current Extraction Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Identity extraction gate | `_buildCandidate()` calls `_extractChannelInfo()` only when `extractChannelIdentity === true`; otherwise it returns an empty channel object. | Candidate extraction report with reason, list mode, rule class, and side-effect budget. |
| Metadata search text | `_buildCandidate()` still collects `rules.channelName`, duration, published time, view count, metadata rows, comment text, and common fallback paths into `metadataText`. | Metadata search policy distinguishing display text, identity text, and rule-authority text. |
| Video id extraction | `_extractVideoId()` accepts direct, endpoint, command, reel, and rule-path candidates only when the value is an 11-character YouTube-style id. | Video-id provenance report with accepted path, rejected path, and validation reason. |
| Playlist and mix flags | `_extractPlaylistId()` accepts any non-empty playlist id, and `_buildCandidate()` marks mixes from `RD` playlist ids, radio renderer types, or title text. | Playlist/mix policy proving whether mix identity can participate in channel/collaborator rules. |
| showDialog collaborators | `_extractChannelInfo()` parses `showDialogCommand` list items and can register UC-to-handle/custom-url mappings while candidate identity is being built. | Collaboration extraction source policy and message side-effect report. |
| showSheet collaborators | The documented `showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems` roster is not parsed by this extractor today. | showSheet fixture policy and parity report against documented JSON paths. |
| Avatar-stack collaborators | The extractor recursively scans for `avatarStackViewModel` before renderer-specific mix/radio guardrails are known to `_shouldBlock()`. | Avatar-stack scope policy with mix/radio negative fixtures and confidence labels. |

## Runtime Fixture Summary

The identity-gate fixture proves `_buildCandidate()` leaves channel identity
empty when channel rules are not requested, then extracts UC id and handle when
`extractChannelIdentity` is true.

The metadata-search fixture proves a channel name can still enter
`metadataText` and block a renderer by keyword even when channel identity
extraction is skipped.

The video/playlist fixture proves invalid direct video ids are rejected, valid
endpoint video ids are accepted, playlist ids are accepted without shape
validation, and `RD` playlist ids make radio-style candidates `isMix`.

The showDialog fixture proves candidate extraction can return multiple
collaborators with id, handle/custom URL, logo fields, and emit mapping
messages while doing so.

The showSheet fixture proves a documented collaborator sheet roster is not
converted into collaborator candidates by `filter_logic.js` today.

The avatar-stack fixture proves a mix/radio-style renderer with a broad
`avatarStackViewModel` can be treated as collaboration content and removed by a
matching collaborator channel rule.

## Risks Identified

- Reliability: candidate fields do not include a structured path/provenance
  record, so later decisions cannot explain which JSON path supplied each
  accepted value.
- False-hide/leak: display-channel text can still participate in keyword
  search through `metadataText`, while channel identity extraction is gated by
  channel rules.
- Performance: broad avatar-stack recursion and showDialog parsing can run
  before a first-class candidate work budget proves that identity is required
  for the current rule set.
- Code burden: video id, playlist id, metadata text, collaborator identity,
  showDialog parsing, avatar-stack scanning, and documented showSheet gaps are
  split across helper logic without one candidate contract.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstCandidateExtractionContract
jsonFirstCandidateExtractionReport
jsonFirstCandidateIdentityGate
jsonFirstCandidateMetadataSearchPolicy
jsonFirstCandidateVideoIdPolicy
jsonFirstCandidatePlaylistPolicy
jsonFirstCandidateCollaborationSourcePolicy
jsonFirstCandidateAvatarStackPolicy
jsonFirstCandidateShowSheetPolicy
jsonFirstCandidateExtractionFixtureProvenance
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-candidate-extraction-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first
filtering gap into current candidate field extraction, identity gating,
metadata search population, collaborator extraction side effects, documented
showSheet omission, avatar-stack broadness, and missing first-class candidate
extraction authority only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this JSON-first candidate extraction surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, candidate extraction changes, collaborator
extraction changes, avatar-stack policy changes, or selector/renderer authority
changes.
