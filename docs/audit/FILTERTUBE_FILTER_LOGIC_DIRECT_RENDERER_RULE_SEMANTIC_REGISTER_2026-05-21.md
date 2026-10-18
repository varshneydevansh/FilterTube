# FilterTube Filter Logic Direct Renderer Rule Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/filter_logic.js` `FILTER_RULES` from representative JSON-path evidence to a source-derived direct renderer rule inventory. It covers the 46 current top-level rule declarations in the `FILTER_RULES` object and separates source declarations from effective renderer-key authority, because `gridVideoRenderer` is declared twice.

This is not completion proof for every JSON path. A direct renderer rule says the runtime has an entry point for a renderer key; it does not prove every documented field path under that renderer is consumed, safe, route-scoped, sibling-visible, or allowed to mutate output.

Current-source register reviewed on 2026-10-18. This refresh changes no runtime behavior or broad proof approval.

## Source Pins

```text
source file: js/filter_logic.js
rule object: FILTER_RULES
direct rule declarations: 46
unique direct rule names: 45
duplicate direct rule name: gridVideoRenderer at lines 703 and 876
BASE_VIDEO_RULES alias declarations: 7
object literal rule declarations: 39
semantic rule groups: 11
source-derived from top-level FILTER_RULES property declarations
```

## Value Shape Counts

| Value shape | Count |
| --- | ---: |
| `BASE_VIDEO_RULES` | 7 |
| `objectLiteral` | 39 |
| **Total** | **46** |

## Semantic Rule Groups

| Semantic rule group | Rule declarations |
| --- | ---: |
| `baseVideoSharedRules` | 7 |
| `channelContextAndLockupRules` | 2 |
| `watchAndScaffoldingRules` | 5 |
| `structuralContainerAndChipRules` | 7 |
| `playlistAndGridSpecificRules` | 3 |
| `mixRadioPodcastAndTicketRules` | 4 |
| `channelSurfaceRules` | 3 |
| `backstagePostRules` | 4 |
| `notificationAndOverlayRules` | 6 |
| `shortsAndReelRules` | 3 |
| `commentRules` | 2 |

## Direct Rule Declaration Inventory

| Line | Renderer key | Semantic rule group | Value shape |
| ---: | --- | --- | --- |
| 701 | `videoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 702 | `compactVideoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 703 | `gridVideoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 704 | `playlistVideoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 705 | `playlistPanelVideoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 706 | `watchCardCompactVideoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 707 | `endScreenVideoRenderer` | `baseVideoSharedRules` | `BASE_VIDEO_RULES` |
| 708 | `videoWithContextRenderer` | `channelContextAndLockupRules` | `objectLiteral` |
| 741 | `richItemRenderer` | `structuralContainerAndChipRules` | `objectLiteral` |
| 758 | `shelfRenderer` | `structuralContainerAndChipRules` | `objectLiteral` |
| 761 | `lockupViewModel` | `channelContextAndLockupRules` | `objectLiteral` |
| 790 | `videoPrimaryInfoRenderer` | `watchAndScaffoldingRules` | `objectLiteral` |
| 793 | `videoSecondaryInfoRenderer` | `watchAndScaffoldingRules` | `objectLiteral` |
| 800 | `universalWatchCardRenderer` | `watchAndScaffoldingRules` | `objectLiteral` |
| 840 | `relatedChipCloudRenderer` | `structuralContainerAndChipRules` | `objectLiteral` |
| 844 | `chipCloudRenderer` | `structuralContainerAndChipRules` | `objectLiteral` |
| 847 | `chipCloudChipRenderer` | `structuralContainerAndChipRules` | `objectLiteral` |
| 863 | `secondarySearchContainerRenderer` | `watchAndScaffoldingRules` | `objectLiteral` |
| 869 | `richGridMedia` | `structuralContainerAndChipRules` | `objectLiteral` |
| 876 | `gridVideoRenderer` | `playlistAndGridSpecificRules` | `objectLiteral` |
| 891 | `playlistRenderer` | `playlistAndGridSpecificRules` | `objectLiteral` |
| 918 | `gridPlaylistRenderer` | `playlistAndGridSpecificRules` | `objectLiteral` |
| 951 | `radioRenderer` | `mixRadioPodcastAndTicketRules` | `objectLiteral` |
| 960 | `compactRadioRenderer` | `mixRadioPodcastAndTicketRules` | `objectLiteral` |
| 968 | `ticketShelfRenderer` | `mixRadioPodcastAndTicketRules` | `objectLiteral` |
| 971 | `podcastRenderer` | `mixRadioPodcastAndTicketRules` | `objectLiteral` |
| 984 | `richShelfRenderer` | `structuralContainerAndChipRules` | `objectLiteral` |
| 990 | `channelVideoPlayerRenderer` | `watchAndScaffoldingRules` | `objectLiteral` |
| 994 | `channelRenderer` | `channelSurfaceRules` | `objectLiteral` |
| 999 | `compactChannelRenderer` | `channelSurfaceRules` | `objectLiteral` |
| 1013 | `gridChannelRenderer` | `channelSurfaceRules` | `objectLiteral` |
| 1018 | `backstagePostThreadRenderer` | `backstagePostRules` | `objectLiteral` |
| 1025 | `backstagePostRenderer` | `backstagePostRules` | `objectLiteral` |
| 1032 | `backstagePollRenderer` | `backstagePostRules` | `objectLiteral` |
| 1041 | `backstageQuizRenderer` | `backstagePostRules` | `objectLiteral` |
| 1053 | `notificationRenderer` | `notificationAndOverlayRules` | `objectLiteral` |
| 1070 | `commentVideoThumbnailHeaderRenderer` | `notificationAndOverlayRules` | `objectLiteral` |
| 1088 | `thumbnailOverlayPlaybackStatusRenderer` | `notificationAndOverlayRules` | `objectLiteral` |
| 1091 | `thumbnailOverlayTimeStatusRenderer` | `notificationAndOverlayRules` | `objectLiteral` |
| 1094 | `thumbnailOverlayResumePlaybackRenderer` | `notificationAndOverlayRules` | `objectLiteral` |
| 1097 | `thumbnailOverlayNowPlayingRenderer` | `notificationAndOverlayRules` | `objectLiteral` |
| 1103 | `reelItemRenderer` | `shortsAndReelRules` | `objectLiteral` |
| 1113 | `shortsLockupViewModel` | `shortsAndReelRules` | `objectLiteral` |
| 1128 | `shortsLockupViewModelV2` | `shortsAndReelRules` | `objectLiteral` |
| 1146 | `commentRenderer` | `commentRules` | `objectLiteral` |
| 1151 | `commentThreadRenderer` | `commentRules` | `objectLiteral` |

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
| Duplicate source key | `gridVideoRenderer` appears at lines 703 and 876. | Source declarations and effective runtime keys must be audited separately. |
| Base alias reuse | Seven entries point at `BASE_VIDEO_RULES`. | Shared video behavior does not prove per-renderer field completeness. |
| Partial Shorts rules | `shortsLockupViewModel` and `shortsLockupViewModelV2` read video/title style fields but not all documented owner fields. | Shorts owner identity remains partial/direct-rule-partial. |
| Collaborator split | `_extractChannelInfo()` scans `showDialogCommand`, while documented `showSheetCommand.sheetViewModel` remains outside direct extraction. | A direct `videoWithContextRenderer` rule does not prove modern collaborator roster authority. |
| Unsupported direct gaps | `compactPlaylistRenderer`, `watchCardHeroVideoRenderer`, `watchCardRHPanelVideoRenderer`, `watchCardRichHeaderRenderer`, `searchRefinementCardRenderer`, `sharedPostRenderer`, and `reelPlayerOverlayRenderer` are not top-level `FILTER_RULES` declarations. | These remain unsupported/direct-gap or fixture-required sections, not direct JSON authority. |

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
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, renderer-rule promotion, duplicate-rule
cleanup, path broadening, or selector/renderer authority changes.


Current compactChannelRenderer support is a channel-surface rule, using explicit own endpoint identity. Its presence does not establish support for the remaining documented gaps or authorize descendant owner propagation.
