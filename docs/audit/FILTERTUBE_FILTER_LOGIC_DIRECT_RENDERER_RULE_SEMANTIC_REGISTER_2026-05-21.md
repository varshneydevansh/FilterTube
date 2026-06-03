# FilterTube Filter Logic Direct Renderer Rule Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/filter_logic.js` `FILTER_RULES` from representative JSON-path evidence to a source-derived direct renderer rule inventory. It covers the 45 current top-level rule declarations in the `FILTER_RULES` object and separates source declarations from effective renderer-key authority, because `gridVideoRenderer` is declared twice.

This is not completion proof for every JSON path. A direct renderer rule says the runtime has an entry point for a renderer key; it does not prove every documented field path under that renderer is consumed, safe, route-scoped, sibling-visible, or allowed to mutate output.

## Source Pins

```text
source file: js/filter_logic.js
rule object: FILTER_RULES
direct rule declarations: 45
unique direct rule names: 44
duplicate direct rule name: gridVideoRenderer at lines 440 and 613
BASE_VIDEO_RULES alias declarations: 7
object literal rule declarations: 38
semantic rule groups: 11
source-derived from top-level FILTER_RULES property declarations
```

## Value Shape Counts

| Value shape | Count |
| --- | ---: |
| `BASE_VIDEO_RULES` | 7 |
| `objectLiteral` | 38 |
| **Total** | **45** |

## Semantic Rule Groups

| Semantic rule group | Rule declarations |
| --- | ---: |
| `baseVideoSharedRules` | 7 |
| `channelContextAndLockupRules` | 2 |
| `watchAndScaffoldingRules` | 5 |
| `structuralContainerAndChipRules` | 7 |
| `playlistAndGridSpecificRules` | 3 |
| `mixRadioPodcastAndTicketRules` | 4 |
| `channelSurfaceRules` | 2 |
| `backstagePostRules` | 4 |
| `notificationAndOverlayRules` | 6 |
| `shortsAndReelRules` | 3 |
| `commentRules` | 2 |

## Direct Rule Declaration Inventory

| Line | Renderer key | Semantic rule group | Value shape |
| ---: | --- | --- | --- |
| 438 | `videoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 439 | `compactVideoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 440 | `gridVideoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 441 | `playlistVideoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 442 | `playlistPanelVideoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 443 | `watchCardCompactVideoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 444 | `endScreenVideoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 445 | `videoWithContextRenderer` | `channelContextAndLockupRules` | `objectLiteral` |
| 478 | `richItemRenderer` | `structuralContainerAndChipRules` | `objectLiteral` |
| 495 | `shelfRenderer` | `structuralContainerAndChipRules` | `objectLiteral` |
| 498 | `lockupViewModel` | `channelContextAndLockupRules` | `objectLiteral` |
| 527 | `videoPrimaryInfoRenderer` | `watchAndScaffoldingRules` | `objectLiteral` |
| 530 | `videoSecondaryInfoRenderer` | `watchAndScaffoldingRules` | `objectLiteral` |
| 537 | `universalWatchCardRenderer` | `watchAndScaffoldingRules` | `objectLiteral` |
| 577 | `relatedChipCloudRenderer` | `structuralContainerAndChipRules` | `objectLiteral` |
| 581 | `chipCloudRenderer` | `structuralContainerAndChipRules` | `objectLiteral` |
| 584 | `chipCloudChipRenderer` | `structuralContainerAndChipRules` | `objectLiteral` |
| 600 | `secondarySearchContainerRenderer` | `watchAndScaffoldingRules` | `objectLiteral` |
| 606 | `richGridMedia` | `structuralContainerAndChipRules` | `objectLiteral` |
| 613 | `gridVideoRenderer` | `playlistAndGridSpecificRules` | `objectLiteral` |
| 622 | `playlistRenderer` | `playlistAndGridSpecificRules` | `objectLiteral` |
| 649 | `gridPlaylistRenderer` | `playlistAndGridSpecificRules` | `objectLiteral` |
| 682 | `radioRenderer` | `mixRadioPodcastAndTicketRules` | `objectLiteral` |
| 691 | `compactRadioRenderer` | `mixRadioPodcastAndTicketRules` | `objectLiteral` |
| 699 | `ticketShelfRenderer` | `mixRadioPodcastAndTicketRules` | `objectLiteral` |
| 702 | `podcastRenderer` | `mixRadioPodcastAndTicketRules` | `objectLiteral` |
| 715 | `richShelfRenderer` | `structuralContainerAndChipRules` | `objectLiteral` |
| 721 | `channelVideoPlayerRenderer` | `watchAndScaffoldingRules` | `objectLiteral` |
| 725 | `channelRenderer` | `channelSurfaceRules` | `objectLiteral` |
| 730 | `gridChannelRenderer` | `channelSurfaceRules` | `objectLiteral` |
| 735 | `backstagePostThreadRenderer` | `backstagePostRules` | `objectLiteral` |
| 742 | `backstagePostRenderer` | `backstagePostRules` | `objectLiteral` |
| 749 | `backstagePollRenderer` | `backstagePostRules` | `objectLiteral` |
| 758 | `backstageQuizRenderer` | `backstagePostRules` | `objectLiteral` |
| 770 | `notificationRenderer` | `notificationAndOverlayRules` | `objectLiteral` |
| 787 | `commentVideoThumbnailHeaderRenderer` | `notificationAndOverlayRules` | `objectLiteral` |
| 805 | `thumbnailOverlayPlaybackStatusRenderer` | `notificationAndOverlayRules` | `objectLiteral` |
| 808 | `thumbnailOverlayTimeStatusRenderer` | `notificationAndOverlayRules` | `objectLiteral` |
| 811 | `thumbnailOverlayResumePlaybackRenderer` | `notificationAndOverlayRules` | `objectLiteral` |
| 814 | `thumbnailOverlayNowPlayingRenderer` | `notificationAndOverlayRules` | `objectLiteral` |
| 820 | `reelItemRenderer` | `shortsAndReelRules` | `objectLiteral` |
| 825 | `shortsLockupViewModel` | `shortsAndReelRules` | `objectLiteral` |
| 829 | `shortsLockupViewModelV2` | `shortsAndReelRules` | `objectLiteral` |
| 836 | `commentRenderer` | `commentRules` | `objectLiteral` |
| 841 | `commentThreadRenderer` | `commentRules` | `objectLiteral` |

## Current Direct-Rule Boundary

```text
FILTER_RULES declaration
  -> renderer key exists
  -> field paths can be read by direct rule helpers
  -> candidate fields can influence hide/allow/remove decisions
  -> but documented renderer sections and nested paths are not automatically covered
```

The current source still proves several boundaries:

| Boundary | Current source evidence | Audit consequence |
| --- | --- | --- |
| Duplicate source key | `gridVideoRenderer` appears at lines 440 and 613. | Source declarations and effective runtime keys must be audited separately. |
| Base alias reuse | Seven entries point at `BASE_VIDEO_RULES`. | Shared video behavior does not prove per-renderer field completeness. |
| Partial Shorts rules | `shortsLockupViewModel` and `shortsLockupViewModelV2` read video/title style fields but not all documented owner fields. | Shorts owner identity remains partial/direct-rule-partial. |
| Collaborator split | `_extractChannelInfo()` scans `showDialogCommand`, while documented `showSheetCommand.sheetViewModel` remains outside direct extraction. | A direct `videoWithContextRenderer` rule does not prove modern collaborator roster authority. |
| Unsupported direct gaps | `compactPlaylistRenderer`, `watchCardHeroVideoRenderer`, `watchCardRHPanelVideoRenderer`, `watchCardRichHeaderRenderer`, `searchRefinementCardRenderer`, `compactChannelRenderer`, `sharedPostRenderer`, and `reelPlayerOverlayRenderer` are not top-level `FILTER_RULES` declarations. | These remain unsupported/direct-gap or fixture-required sections, not direct JSON authority. |

## Required Future Rule Contract Fields

```text
ruleDeclarationId
rendererKey
sourceLine
valueShape
semanticRuleGroup
effectiveRuntimeKey
duplicatePolicy
baseRuleAliasPolicy
documentedSectionStatus
routeOrEndpoint
listMode
fieldPathSet
identitySourceTier
mutationEffect
wrapperOrContainerPolicy
siblingVisibleBoundary
unsupportedGapRelation
fixtureProvenance
noRuleBudget
positiveFixture
whitelistFixture
negativeUnsupportedFixture
falseHideFixture
```

## Missing Runtime Authorities

These names are intentionally absent from runtime source today. They describe the authority shape needed before promoting, deleting, merging, or broadening renderer rules:

```text
filterLogicDirectRuleAuthority
filterLogicRendererRuleReport
rendererRuleDuplicatePolicy
rendererRuleFieldPathManifest
rendererRuleEffectDecision
rendererRuleFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this direct renderer rule surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, renderer-rule promotion, duplicate-rule
cleanup, path broadening, or selector/renderer authority changes.
