# FilterTube Content Bridge Collaborator Metadata Extraction Side-Effect Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior proof. Runtime behavior is unchanged. This is not an implementation patch and not completion proof for collaborator extraction authority.

## Scope

This slice pins the current behavior of the collaborator metadata extraction path in `js/content_bridge.js`, especially the boundary where JSON/renderer evidence and DOM fallback evidence become card attributes, resolved collaborator state, main-world enrichment, and follow-on filtering work.

The paired verifier is `tests/runtime/content-bridge-collaborator-metadata-extraction-side-effect-boundary-current-behavior.test.mjs`.

## Source Fingerprint

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |

## Pinned Blocks

| Block | Source range | Lines | Bytes | SHA-256 | Current role |
| --- | --- | ---: | ---: | --- | --- |
| Renderer collaborator extraction | `js/content_bridge.js:3997` through `js/content_bridge.js:4237` | 242 | 12604 | `df004ea8458332cd2fff4ace0cbc1aca35482ea30a25e2c7bf99f5677f9e611c` | Extracts collaborator lists from `showSheetCommand` / `showDialogCommand` JSON and bounded deep scans. |
| Renderer candidate inventory | `js/content_bridge.js:4227` through `js/content_bridge.js:4270` | 45 | 1996 | `d67d5803951da2b28f7481ffc82bccfa67e9e08b6796139d142a399c411e4525` | Reads many `data` and `__data` renderer branches from a card before calling the renderer extractor. |
| Element collaborator extraction | `js/content_bridge.js:4284` through `js/content_bridge.js:4788` | 506 | 26157 | `ff81401178fa408d1cbaf8211908efb7d98c60e2a5553a3b9f5b4a248fc7d994` | Combines renderer evidence, DOM bylines, links, avatar stacks, cached attrs, video id stamping, resolved-cache writes, enrichment requests, and separator-evidence gating. |
| Element cache/enrich helper | `js/content_bridge.js:4422` through `js/content_bridge.js:4504` | 84 | 3699 | `6dc65cd11eda7432f0c7808001e26b24df20a7fd3a0aa24894993f999087eeb6` | Inner helper that upgrades extracted collaborators into cache writes, resolved collaborator updates, resolved application, or enrichment requests. |
| YTM byline branch | `js/content_bridge.js:4659` through `js/content_bridge.js:4748` | 90 | 5530 | `e082452a22613a8c8fa8d32ecfa3a364de8085839db0e300d6f20511d821ab08` | Treats collapsed or explicit YTM bylines as collaborator signals and may consult video/channel maps after separator-evidence gating. |

## Selected Token Counts

These counts are over the three top-level pinned extraction blocks, not the whole product.

| Token | Count |
| --- | ---: |
| `extractCollaboratorMetadataFromRenderer` | 2 |
| `hydrateCollaboratorsFromRendererData` | 2 |
| `extractCollaboratorMetadataFromElement` | 1 |
| `hasMixRendererDataSignal` | 4 |
| `showSheetCommand` | 15 |
| `showDialogCommand` | 12 |
| `panelLoadingStrategy` | 24 |
| `listViewModel` | 18 |
| `radioRenderer` | 4 |
| `compactRadioRenderer` | 4 |
| `WeakSet` | 1 |
| `depth > 10` | 1 |
| `slice(0, 25)` | 1 |
| `card.data` | 13 |
| `card.__data` | 15 |
| `getRendererDataCandidatesForElement` | 1 |
| `ensureVideoIdForCard` | 10 |
| `data-filtertube-video-id` | 4 |
| `setAttribute` | 8 |
| `getValidatedCachedCollaborators` | 1 |
| `sanitizeCollaboratorList` | 2 |
| `data-filtertube-collaborators` | 4 |
| `data-filtertube-collaborators-source` | 1 |
| `data-filtertube-collaborators-ts` | 1 |
| `data-filtertube-expected-collaborators` | 6 |
| `applyResolvedCollaborators` | 2 |
| `requestCollaboratorEnrichment` | 1 |
| `resolvedCollaboratorsByVideoId` | 2 |
| `getCachedCollaboratorsFromCard` | 1 |
| `getCollaboratorListQuality` | 4 |
| `resolveExpectedCollaboratorCount` | 4 |
| `parseCollaboratorNames` | 6 |
| `countDistinctChannelLinks` | 4 |
| `hasCollaboratorSeparatorEvidence` | 2 |
| `querySelector` | 10 |
| `querySelectorAll` | 2 |
| `yt-avatar-stack-view-model` | 2 |
| `extractCollaboratorsFromAvatarStackElement` | 1 |
| `requiresDialogExtraction` | 11 |
| `partialCollaboratorsForEnrichment` | 3 |
| `currentSettings?.videoChannelMap` | 2 |
| `currentSettings?.channelMap` | 2 |
| `isDesktopWatchPlaylistPanelCard` | 1 |
| `isYtmWatchLikeCollaboratorCard` | 1 |
| `isDesktopWatchLikeCollaboratorCard` | 1 |
| `extractYtmBylineText` | 1 |
| `extractDesktopWatchPlaylistBylineText` | 1 |
| `getDesktopLockupMetadataRows` | 1 |

## Current Behavior Proven By Fixtures

- Renderer JSON extraction rejects Mix renderer signals before collaborator parsing.
- Renderer JSON extraction can recover collaborators from a bounded deep scan of a `showSheetCommand` whose title is `Collaborators`.
- The captured `YTM-XHR.json` showSheet roster does not hydrate through this bridge renderer extractor today because the reduced real command has list items but no sheet title/header. The element extractor instead falls back to the collapsed YTM byline, caches one partial `Shakira` collaborator, sets expected count `3`, and requests main-world enrichment.
- Element extraction can stamp `data-filtertube-video-id` on the card and rich-item wrapper while it is nominally extracting collaborator metadata.
- Renderer-derived collaborators are cached to `data-filtertube-collaborators`, `data-filtertube-collaborators-source`, `data-filtertube-collaborators-ts`, and `data-filtertube-expected-collaborators`.
- Renderer-derived collaborators can call `applyResolvedCollaborators()` in the direct renderer branch and again through the cache/enrich helper when enrichment is not required.
- DOM byline extraction with hidden collaborator text can cache partial collaborators, set an expected count, and call `requestCollaboratorEnrichment()` from inside extraction.
- A generic single-channel name that contains `and` still returns early without collaborator mode when there is no avatar stack and no hidden-collaborator signal.
- Ampersand-only music Topic lockup text such as `Kully B & Gussy G - Topic` does not write `data-filtertube-collaborators`, does not set an expected collaborator count, and does not call resolved-application or enrichment side effects without stronger collaborator evidence.

## Captured YTM ShowSheet Addendum

The new captured fixture proof connects this bridge-side metadata boundary to
the YTM showSheet whitelist/blocklist gap. The reduced real
`capture-show-sheet-collab` renderer contains three collaborator list items:

```text
shakiraVEVO | UCGnjeahCJW1AF34HBmQTJ-Q | @shakiraVEVO
Spotify | UCYLNGLIzMhRTi6ZOLjAPSmw | @spotify
Beele | UCRMqQWxCWE0VMvtUElm-rEA | @beele
```

In current `content_bridge.js`, `extractCollaboratorMetadataFromRenderer()`
returns an empty roster for that exact captured shape because its
`isCollaboratorsSheetLikeCommand()` gate requires a title of `Collaborators`,
and this real reduced YTM command carries no sheet title/header.

When the same renderer is attached to a YTM card as `card.data.content` and the
visible byline is `Shakira and 2 more`, the current element extractor falls
back to YTM byline enrichment and writes:

```text
data-filtertube-video-id=capture-show-sheet-collab
data-filtertube-collaborators=[{"name":"Shakira","handle":"","id":"","customUrl":""}]
data-filtertube-expected-collaborators=3
requestCollaboratorEnrichment partialCollaborators=Shakira
resolvedCollaboratorsByVideoId[capture-show-sheet-collab]=not written
applyResolvedCollaborators calls=0
```

This is useful metadata for menus and later DOM work, but it is not proof that
YTM showSheet rosters are first-class bridge renderer authority or first-class
filter authority. The paired
`FILTERTUBE_YTM_SHOW_SHEET_INJECTOR_FILTER_LOGIC_PARITY_CURRENT_BEHAVIOR_2026-05-24.md`
slice pins that `js/injector.js` can parse this same headerless captured roster,
while `js/filter_logic.js` still has zero `showSheetCommand` tokens, with a
captured blocklist leak and whitelist false-hide for the three collaborators.

## Risk Boundary

This boundary is important because the method name and call sites look like metadata reads, but the element extractor has observable side effects: video-id attrs, collaborator cache attrs, expected-count attrs, resolved collaborator map writes, resolved application calls, and main-world enrichment requests. That matters for reliability, false-hide/leak risk, no-work optimization, performance, code-burden, route/profile behavior, whitelist-mode interactions, playlist fallback, and JSON-first collaborator confidence.

The current behavior is also split across JSON-path knowledge in the renderer extractor, DOM selector knowledge in the element extractor, current settings maps in the YTM branch, and enrichment/application behavior owned by later collaborator functions. This audit slice keeps those semantics unchanged, but it makes the mixed read/write boundary explicit before optimization work.

## Missing Future Proof

No product runtime symbol exists yet for:

- `contentBridgeCollaboratorMetadataExtractionContract`
- `contentBridgeCollaboratorMetadataExtractionDecision`
- `contentBridgeCollaboratorExtractionSideEffectReport`
- `contentBridgeCollaboratorPureReadMode`
- `contentBridgeCollaboratorRendererJsonPathPolicy`
- `contentBridgeCollaboratorDomSelectorPolicy`
- `contentBridgeCollaboratorEnrichmentOptInPolicy`
- `contentBridgeCollaboratorExtractionFixtureProvenance`
- `contentBridgeCollaboratorExtractionMetricArtifact`
- `contentBridgeCollaboratorExtractionAuthorityGate`
- `contentBridgeShowSheetCapturedFixtureParityReport`
- `contentBridgeShowSheetFilterAuthorityBoundary`
- `contentBridgeShowSheetSideEffectBudget`

This slice does not close the audit rows for collaborator metadata extraction contracts, pure-read extraction, side-effect budgets, renderer JSON path policy, DOM selector policy, enrichment opt-in policy, resolved application policy, route/profile/list-mode negative fixtures, fixture provenance, metrics, or first-class collaborator extraction gates.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this menu/dialog/injector/quick-block
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, menu action behavior, dialog lifecycle
behavior, injector behavior, quick-block behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
