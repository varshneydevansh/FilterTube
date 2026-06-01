# FilterTube Kids Latest JSON Owner Extension Fixture Boundary - Current Behavior - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, Kids behavior patch,
native app patch, capture import patch, or permission to change JSON filtering.

## Purpose

This slice reduces one previously unextracted YouTube Kids raw JSON capture into
a committed fixture and pins how current JSON filtering handles Kids
`compactVideoRenderer` owner identity.

The boundary matters for first-class JSON filtering because Kids cards can carry
both ordinary byline `browseEndpoint` identity and
`kidsVideoOwnerExtension.externalChannelId`. Current filtering uses the byline
directly for decisions and also harvests the Kids owner extension into
`videoChannelMap`, which can then affect the same filtering pass when byline
identity is missing.

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `yt_kids_latest.json` | 11409 | 604928 | `7c74f1a0d7b3d0196de53fefed88aa3d2f3e6560acdb5a590752021e38cb6596` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `tests/runtime/fixtures/captures/kids-latest-compact-video-owner-extension.json` | 203 | 9321 | `7eb63cd3d1d27b837e286df7eebadac79e3b2bd62ca8ac33ad2b99ee55034529` |

Related proof layers:

- `docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md`
- `docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md`
- `docs/audit/FILTERTUBE_SURFACE_INFORMATION_AVAILABILITY_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_CHANNEL_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
Kids latest JSON owner extension source/fixture files: 3
raw yt_kids_latest compactVideoRenderer tokens: 60
raw yt_kids_latest kidsVideoOwnerExtension tokens: 60
raw yt_kids_latest externalChannelId tokens: 60
raw yt_kids_latest KIDS_BLOCK menu tokens: 60
base video rules block lines: 36
base video rules block bytes: 1575
shared video renderer mapping block lines: 9
shared video renderer mapping block bytes: 415
harvest renderer mapping block lines: 55
harvest renderer mapping block bytes: 2535
harvest Kids owner block lines: 36
harvest Kids owner block bytes: 1887
video channel map registration block lines: 17
video channel map registration block bytes: 636
video map fallback decision block lines: 13
video map fallback decision block bytes: 556
filter_logic kidsVideoOwnerExtension tokens: 2
filter_logic compactVideoRenderer tokens: 9
filter_logic videoChannelMap tokens: 10
filter_logic FilterTube_UpdateVideoChannelMap tokens: 1
runtime Kids latest owner extension fixtures: 6
runtime behavior changed: no
not completion proof for Kids JSON owner-extension authority
```

## Reduced Fixture

The committed fixture is:

```text
tests/runtime/fixtures/captures/kids-latest-compact-video-owner-extension.json
```

It records:

```text
source: yt_kids_latest.json
rendererType: compactVideoRenderer
first path: contents.kidsHomeScreenRenderer.anchors.0.anchoredSectionRenderer.content.sectionListRenderer.contents.0.itemSectionRenderer.contents.0.compactVideoRenderer
sibling path: contents.kidsHomeScreenRenderer.anchors.0.anchoredSectionRenderer.content.sectionListRenderer.contents.0.itemSectionRenderer.contents.1.compactVideoRenderer
first video: nGKm7EQ09rE -> UCO0vPDAqN7BTK9kNAeP3sKw
sibling video: HgwlTY7M4og -> UChhs18W6Mp4MSB3FskumnXw
```

The fixture stays reduced: it carries only the fields needed to prove renderer
identity, sibling preservation, Kids block-menu shape, and owner-extension
harvest behavior.

## Current Runtime Findings

| Boundary | Current behavior | Missing proof before behavior changes |
| --- | --- | --- |
| Raw capture extraction | `yt_kids_latest.json` now has one reduced committed fixture for two adjacent Kids compact-video siblings. | More Kids browse/search/watch fixtures, malformed direct-JSON fragment policy for `ytkids_browse?alt=json.json`, and native WebView parity. |
| Direct blocklist decision | A matching `filterChannels` row removes the first Kids `compactVideoRenderer` and preserves the nonmatching sibling. | Structured Kids owner decision report with source field, profile, list mode, route, and sibling-visible proof. |
| Owner-extension harvest | When byline navigation endpoints are stripped from the first renderer, `kidsVideoOwnerExtension.externalChannelId` is harvested into `videoChannelMap` before `_shouldBlock()` uses the video-map fallback. | Explicit policy deciding whether harvest side effects may affect the same JSON filtering pass. |
| Whitelist decision | A matching Kids owner in `whitelistChannels` preserves the matching compact video and removes the nonmatching sibling in whitelist mode. | Kids whitelist decision report with empty whitelist, exact allow, unresolved identity, and pending-restore cases. |
| Side effects | Processing the fixture can queue `FilterTube_UpdateVideoChannelMap` for both Kids video ids and `FilterTube_UpdateChannelMap` for byline handles. | Map-write reason, route/profile permission, dedupe, and metric budget. |
| Capture status | The raw-capture index can move `yt_kids_latest.json` from unextracted to partial-extracted. | Complete Kids public-web fixture family still needs route, mode, DOM/native, and negative no-work proof. |

## Risks Identified

- Reliability: Kids compact video identity is split across byline browse
  endpoints, owner-extension fields, and a learned video map side effect.
- False-hide/leak: owner-extension harvest can make a byline-stripped item match
  in the same filtering pass, but no decision record distinguishes direct
  identity from harvested identity.
- Performance: no metric artifact records the cost of harvesting 60 Kids
  compact renderers or posting video map updates.
- Code burden: Kids extension identity is handled in harvest code, while direct
  decision extraction still uses generic base video rules and video-map fallback.

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
kidsLatestJsonOwnerExtensionFixtureContract
kidsLatestCompactVideoOwnerDecisionReport
kidsLatestOwnerExtensionHarvestReport
kidsLatestSiblingPreservationFixture
kidsLatestWhitelistDecisionPolicy
kidsLatestRawCaptureProvenance
kidsLatestVideoChannelMapSideEffectReport
kidsLatestNativeParityReport
kidsLatestMetricArtifact
kidsLatestJsonFirstAuthorityGate
```

## Runnable Proof

```bash
node --test tests/runtime/kids-latest-json-owner-extension-fixture-boundary-current-behavior.test.mjs --test-reporter=spec
```

This slice is not a completion claim. It adds one Kids raw-capture extraction
and proves the current JSON owner-extension behavior that future first-class
JSON filtering or whitelist optimization work must preserve or intentionally
replace with stronger authority.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this Kids JSON/browse surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, Kids browse behavior, owner-extension
behavior, whitelist behavior, metric collectors, artifact creation, native
sync, release package changes, or public claims.
