# FilterTube Kids Browse Malformed Fragment Boundary - Current Behavior - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, Kids behavior patch,
raw-capture parser patch, or permission to change JSON filtering.

## Purpose

This slice reduces the malformed raw `ytkids_browse?alt=json.json` capture into
a committed fixture while keeping the malformed-container boundary explicit.
The raw file is not valid as one JSON document: it starts with request/log text,
contains an access-token fragment, and then contains balanced JSON fragments.

The boundary matters for first-class JSON filtering because this raw Kids browse
capture contains both `kidsSlimOwnerRenderer` owner-rail entries and
`compactVideoRenderer` video cards. Current filtering can block or allow compact
videos by owner identity, but the owner rail has no direct JSON filtering rule
and remains visible in both blocklist and whitelist decisions.

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `ytkids_browse?alt=json.json` | 8630 | 446776 | `fdadb983bbb5fa2e19b81c29bde860a0019c4a171bee00b36e42ae25adc3f240` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `tests/runtime/fixtures/captures/kids-browse-malformed-fragment-compact-video.json` | 235 | 9959 | `40f84c7de6a385a111bf55aa23179e170f0e1a274cc96ae4cc092203ba8f954f` |

Related proof layers:

- `docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md`
- `docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md`
- `docs/audit/FILTERTUBE_KIDS_LATEST_JSON_OWNER_EXTENSION_FIXTURE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_SECTION_COVERAGE_INDEX_2026-05-20.md`

## Current Counts

```text
Kids browse malformed fragment source/fixture files: 3
raw ytkids_browse direct JSON parse ok: false
raw ytkids_browse balanced top-level JSON fragments: 5
raw ytkids_browse browse fragment index: 4
raw ytkids_browse browse fragment start line: 688
raw ytkids_browse browse fragment bytes: 423123
raw ytkids_browse compactVideoRenderer tokens: 40
raw ytkids_browse kidsVideoOwnerExtension tokens: 40
raw ytkids_browse externalChannelId tokens: 40
raw ytkids_browse KIDS_BLOCK menu tokens: 40
raw ytkids_browse kidsSlimOwnerRenderer tokens: 5
raw ytkids_browse accounts_list prelude tokens: 1
raw ytkids_browse next XHR markers: 2
filter_logic kidsSlimOwnerRenderer tokens: 0
filter_logic kidsLibraryRenderer tokens: 0
filter_logic compactVideoRenderer tokens: 9
filter_logic kidsVideoOwnerExtension tokens: 2
filter_logic videoChannelMap tokens: 10
runtime Kids browse malformed fragment fixtures: 7
runtime behavior changed: no
not completion proof for Kids browse raw-container authority
```

## Reduced Fixture

The committed fixture is:

```text
tests/runtime/fixtures/captures/kids-browse-malformed-fragment-compact-video.json
```

It records:

```text
source: ytkids_browse?alt=json.json
raw container: malformed direct JSON with request/log prelude plus balanced JSON fragments
fragment index: 4
fragment start line: 688
fragment bytes: 423123
rendererType: compactVideoRenderer
ownerRailRendererType: kidsSlimOwnerRenderer
first path: contents.kidsLibraryRenderer.anchors.1.anchoredSectionRenderer.content.sectionListRenderer.contents.0.itemSectionRenderer.contents.2.compactVideoRenderer
sibling path: contents.kidsLibraryRenderer.anchors.1.anchoredSectionRenderer.content.sectionListRenderer.contents.0.itemSectionRenderer.contents.3.compactVideoRenderer
owner rail path: contents.kidsLibraryRenderer.anchors.0.anchoredSectionRenderer.content.sectionListRenderer.contents.0.itemSectionRenderer.contents
first video: Gh-XKNuvvC4 -> UC5PYHgAzJ1wLEidB58SK6Xw
sibling video: G-xKXHAWPYU -> UCw0Mbalwv25Zk756uAONAmg
owner rail entries: Thomas & Friends UK -> UCo5AoxvDzhX1Gua_aU2Rr6w; Little Learners -> UCw0Mbalwv25Zk756uAONAmg
```

The fixture stays reduced: it carries only the fields needed to prove the raw
container boundary, parseable browse fragment, owner rail, compact video
identity, Kids block-menu shape, whitelist/list-mode decisions, and side-effect
messages.

## Current Runtime Findings

| Boundary | Current behavior | Missing proof before behavior changes |
| --- | --- | --- |
| Raw capture admission | `ytkids_browse?alt=json.json` fails direct `JSON.parse()` and must not be treated as one canonical runtime response. | Raw-container admission contract, fragment extraction policy, and negative proof for non-JSON prelude text. |
| Fragment extraction | The fifth balanced JSON fragment is parseable and contains `kidsLibraryRenderer` with 5 owner rail entries and 40 compact videos. | Reviewed extractor policy for fragment selection, redaction, provenance, and malformed-capture metrics. |
| Direct blocklist decision | A matching `filterChannels` row removes the matching compact video and preserves the nonmatching compact sibling. | Structured Kids browse compact-video decision report with route, profile, list mode, and sibling-visible proof. |
| Owner rail filtering | Matching owner rail entries remain visible because product runtime source has no `kidsSlimOwnerRenderer` or `kidsLibraryRenderer` rule token. | Owner-rail decision report and explicit policy for blocklist and whitelist mode. |
| Whitelist decision | A matching whitelist owner preserves the matching compact video and removes the nonmatching compact sibling while owner rail entries remain visible. | Kids browse whitelist policy for owner rail, empty whitelist, unresolved identity, and mixed-owner sections. |
| Side effects | Processing the fixture can queue three `FilterTube_UpdateChannelMap` messages and one `FilterTube_UpdateVideoChannelMap` message for both compact video ids. | Map-write reason, route/profile permission, dedupe, and metric budget. |
| Capture status | The raw-capture index can move `ytkids_browse?alt=json.json` from unextracted to partial-extracted while preserving the malformed direct JSON warning. | Complete Kids browse/search/watch fixture family still needs route, mode, DOM/native, and no-work proof. |

## Risks Identified

- Reliability: the raw capture is a concatenated container, not a single JSON
  response, so optimization work must use reduced reviewed fragments.
- False-hide/leak: compact-video filtering and owner-rail visibility can diverge
  for the same owner in both blocklist and whitelist modes.
- Performance: no metric artifact records fragment extraction cost, 40 compact
  renderer harvest cost, or map update side effects.
- Code burden: Kids compact-video behavior reuses generic video rules while Kids
  owner rail behavior has no first-class JSON rule or policy.

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
kidsBrowseMalformedFragmentContract
kidsBrowseRawContainerAdmissionReport
kidsBrowseFragmentExtractionPolicy
kidsBrowseCompactVideoDecisionReport
kidsBrowseOwnerRailDecisionReport
kidsBrowseOwnerRailWhitelistPolicy
kidsBrowseVideoMapSideEffectReport
kidsBrowseNativeWebViewParityReport
kidsBrowseMetricArtifact
kidsBrowseJsonFirstAuthorityGate
```

## Runnable Proof

```bash
node --test tests/runtime/kids-browse-malformed-fragment-boundary-current-behavior.test.mjs --test-reporter=spec
```

This slice is not a completion claim. It adds one Kids raw-capture extraction
from a malformed container and proves the current compact-video versus owner-rail
behavior that future first-class JSON filtering or whitelist optimization work
must preserve or intentionally replace with stronger authority.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this Kids JSON/browse surface can support
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
optimization, JSON-first behavior, Kids browse behavior, owner-extension
behavior, whitelist behavior, metric collectors, artifact creation, native
sync, release package changes, or public claims.
