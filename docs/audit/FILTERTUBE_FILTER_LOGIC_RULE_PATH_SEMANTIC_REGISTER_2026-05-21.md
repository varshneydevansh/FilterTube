# FilterTube Filter Logic Rule Path Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/filter_logic.js` from direct renderer-rule coverage to
source-derived JSON rule-path coverage. It inventories the current string paths
that `FILTER_RULES` can hand to `getByPath()` through direct rule fields and
`BASE_VIDEO_RULES` aliases.

This is not completion proof for every documented JSON path, every YouTube
renderer, every route, or JSON-first optimization readiness. It is the current
path boundary before adding renderer paths, pruning DOM fallback selectors,
changing no-rule work, or treating documented JSON fields as runtime behavior.

Current-source register reviewed on 2026-10-18. This refresh changes no runtime behavior or broad proof approval.

## Source-Derived Summary

```text
source file: js/filter_logic.js
source line count: 4534
source bytes: 221980
source sha256: f7021a053af96a4cd31a577f56e900ffb1a5d990fe55a838af64a6dba867afc4
path owner object: FILTER_RULES
shared alias object: BASE_VIDEO_RULES
BASE_VIDEO_RULES field rows: 9
BASE_VIDEO_RULES authored path rows: 27
FILTER_RULES source declarations: 46
FILTER_RULES source path rows before duplicate override: 494
source-authored path rows including BASE_VIDEO_RULES: 521
effective runtime renderer keys after duplicate override: 45
effective BASE_VIDEO_RULES aliases after duplicate override: 6
effective object literal rules after duplicate override: 39
effective runtime path rows after duplicate override: 467
effective unique path literals: 184
effective renderer-field pairs: 189
path syntax with dot numeric indexes: 159
path syntax with bracket numeric indexes: 0
path syntax without numeric indexes: 308
template path literals: 0
documented encyclopedia loaded by runtime: no
runtime behavior changed: no
```

## Effective Field Counts

| Field | Effective path rows |
| --- | ---: |
| `title` | 87 |
| `description` | 67 |
| `commentText` | 2 |
| `channelName` | 64 |
| `channelId` | 53 |
| `channelHandle` | 57 |
| `videoId` | 34 |
| `duration` | 48 |
| `publishedTime` | 38 |
| `viewCount` | 14 |
| `metadataRows` | 3 |

## Semantic Path Groups

| Semantic group | Fields | Effective rows | Current owner/effect shape | Missing proof before behavior changes |
| --- | --- | ---: | --- | --- |
| `textMatchPath` | `title`, `description`, `commentText` | 156 | Feeds keyword/comment matching and can remove JSON renderers when a rule matches. | Per-route positive and negative sibling fixtures, comment/global keyword parity, exact-match Unicode policy, and DOM parity proof. |
| `channelIdentityPath` | `channelName`, `channelId`, `channelHandle` | 174 | Feeds channel block/allow matching, sometimes from stable ids/handles and sometimes from display text or URL-like fields. | Identity-confidence report for UC id, handle, URL, and display-name paths plus whitelist fail-closed fixtures. |
| `videoIdentityPath` | `videoId` | 34 | Provides video ids for renderer mutation and for joins to harvested owner maps, but video id is not channel identity by itself. | Join provenance, stale-map handling, route surface ownership, and no-map fallback policy. |
| `metadataPredicatePath` | `duration`, `publishedTime`, `viewCount`, `metadataRows` | 103 | Feeds declared metadata extraction. Optional view thresholds additionally read dedicated total fields; unknown counts add no requests or pending state. | Predicate-validity proof for enabled-empty, blank-date, zero-threshold, localized text, and metadata-fetch reasons. |

## Duplicate And Syntax Boundary

```text
gridVideoRenderer is declared twice in source: BASE_VIDEO_RULES at line 703 and an object literal at line 876
JavaScript object semantics keep the later gridVideoRenderer object literal as the effective runtime key
source FILTER_RULES path rows before duplicate override: 494
effective runtime path rows after duplicate override: 467
all current runtime paths use dot-index syntax such as runs.0.text
no current runtime path uses bracket-index syntax such as runs[0].text
docs/json_paths_encyclopedia.md uses documented field text, but runtime/build source does not load it
```

## Unique Effective Path Literals By Field

### `channelHandle` - 27 unique effective paths

| Path literal | Effective references | Source lines |
| --- | ---: | --- |
| `authorEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 1030 |
| `belowThumbnailMetadata.avatar.avatarViewModel.endpoint.innertubeCommand.browseEndpoint.canonicalBaseUrl` | 2 | 1124, 1139 |
| `belowThumbnailMetadata.avatar.avatarViewModel.endpoint.innertubeCommand.commandMetadata.webCommandMetadata.url` | 2 | 1125, 1140 |
| `channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 720 |
| `channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 1084 |
| `header.watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 830 |
| `header.watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 831 |
| `header.watchCardRichHeaderRenderer.subtitle.runs.0.text` | 1 | 829 |
| `longBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 8 | 639, 721, 934 |
| `metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl` | 1 | 770 |
| `metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.commandMetadata.webCommandMetadata.url` | 1 | 771 |
| `navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 6 | 857, 997, 1008, 1016, 1066, 1085 |
| `navigationEndpoint.commandMetadata.webCommandMetadata.url` | 3 | 858, 1009, 1067 |
| `navigationEndpoint.reelWatchEndpoint.overlay.reelPlayerOverlayRenderer.reelPlayerHeaderSupportedRenderers.reelPlayerHeaderRenderer.channelNavigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 1111 |
| `ownerText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 7 | 640, 722 |
| `post.backstagePostRenderer.authorEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 1023 |
| `publisherMetadata.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 981 |
| `shortBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 9 | 638, 719, 902, 933 |
| `subscriberCountText.runs` | 1 | 1010 |
| `text.runs` | 1 | 860 |
| `text.simpleText` | 1 | 859 |
| `watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 832 |
| `watchCardRichHeaderRenderer.subtitle.navigationEndpoint.commandMetadata.webCommandMetadata.url` | 1 | 834 |
| `watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 833 |
| `watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.commandMetadata.webCommandMetadata.url` | 1 | 835 |
| `watchCardRichHeaderRenderer.title.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 836 |
| `watchCardRichHeaderRenderer.title.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 837 |

### `channelId` - 23 unique effective paths

| Path literal | Effective references | Source lines |
| --- | ---: | --- |
| `authorEndpoint.browseEndpoint.browseId` | 2 | 1029, 1147 |
| `belowThumbnailMetadata.avatar.avatarViewModel.endpoint.innertubeCommand.browseEndpoint.browseId` | 2 | 1121, 1136 |
| `channelId` | 3 | 995, 1000, 1014 |
| `channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId` | 1 | 714 |
| `channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId` | 1 | 1080 |
| `content.videoRenderer.shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId` | 1 | 746 |
| `feedbackButton.buttonRenderer.navigationEndpoint.browseEndpoint.browseId` | 1 | 1063 |
| `header.watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.browseId` | 1 | 821 |
| `header.watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.browseId` | 1 | 822 |
| `header.watchCardRichHeaderRenderer.titleNavigationEndpoint.browseEndpoint.browseId` | 1 | 820 |
| `longBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId` | 8 | 634, 715, 930 |
| `metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` | 1 | 768 |
| `navigationEndpoint.browseEndpoint.browseId` | 4 | 855, 1000, 1062, 1081 |
| `navigationEndpoint.reelWatchEndpoint.overlay.reelPlayerOverlayRenderer.reelPlayerHeaderSupportedRenderers.reelPlayerHeaderRenderer.channelNavigationEndpoint.browseEndpoint.browseId` | 1 | 1110 |
| `owner.videoOwnerRenderer.navigationEndpoint.browseEndpoint.browseId` | 1 | 794 |
| `ownerText.runs.0.navigationEndpoint.browseEndpoint.browseId` | 7 | 635, 716 |
| `post.backstagePostRenderer.authorEndpoint.browseEndpoint.browseId` | 1 | 1022 |
| `publisherMetadata.navigationEndpoint.browseEndpoint.browseId` | 1 | 979 |
| `shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId` | 11 | 633, 713, 874, 886, 901, 929 |
| `watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.browseId` | 1 | 823 |
| `watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.browseId` | 1 | 824 |
| `watchCardRichHeaderRenderer.title.navigationEndpoint.browseEndpoint.browseId` | 1 | 825 |
| `watchCardRichHeaderRenderer.title.runs.0.navigationEndpoint.browseEndpoint.browseId` | 1 | 826 |

### `channelName` - 31 unique effective paths

| Path literal | Effective references | Source lines |
| --- | ---: | --- |
| `authorText.simpleText` | 2 | 1028, 1148 |
| `belowThumbnailMetadata.primaryText.content` | 2 | 1117, 1132 |
| `belowThumbnailMetadata.primaryText.runs` | 2 | 1118, 1133 |
| `channelName.runs` | 1 | 1077 |
| `channelName.simpleText` | 1 | 1076 |
| `channelTitle.runs` | 1 | 1075 |
| `channelTitle.simpleText` | 1 | 1074 |
| `collapseStateButton.toggleButtonRenderer.defaultText.simpleText` | 1 | 1059 |
| `content.videoRenderer.longBylineText.runs` | 1 | 745 |
| `content.videoRenderer.shortBylineText.runs` | 1 | 745 |
| `displayName.runs` | 1 | 1005 |
| `displayName.simpleText` | 2 | 996, 1004 |
| `header.watchCardRichHeaderRenderer.subtitle.runs` | 1 | 814 |
| `header.watchCardRichHeaderRenderer.subtitle.simpleText` | 1 | 815 |
| `longBylineText.runs` | 10 | 631, 711, 872, 879, 927 |
| `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.0.metadataParts.0.text.content` | 1 | 767 |
| `navigationEndpoint.browseEndpoint.browseId` | 1 | 852 |
| `navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 2 | 851, 1057 |
| `navigationEndpoint.commandMetadata.webCommandMetadata.url` | 2 | 853, 1058 |
| `navigationEndpoint.reelWatchEndpoint.overlay.reelPlayerOverlayRenderer.reelPlayerHeaderSupportedRenderers.reelPlayerHeaderRenderer.channelTitleText.runs` | 1 | 1108 |
| `navigationEndpoint.reelWatchEndpoint.overlay.reelPlayerOverlayRenderer.reelPlayerHeaderSupportedRenderers.reelPlayerHeaderRenderer.channelTitleText.simpleText` | 1 | 1107 |
| `owner.videoOwnerRenderer.title.runs` | 1 | 795 |
| `ownerText.runs` | 7 | 631, 711 |
| `post.backstagePostRenderer.authorText.simpleText` | 1 | 1021 |
| `publisherMetadata.publisherName.runs` | 1 | 976 |
| `publisherMetadata.publisherName.simpleText` | 1 | 975 |
| `shortBylineText.runs` | 11 | 631, 711, 872, 879, 900, 927 |
| `title.runs` | 1 | 1003 |
| `title.simpleText` | 3 | 996, 1002, 1015 |
| `watchCardRichHeaderRenderer.subtitle.runs` | 1 | 816 |
| `watchCardRichHeaderRenderer.subtitle.simpleText` | 1 | 817 |

### `commentText` - 2 unique effective paths

| Path literal | Effective references | Source lines |
| --- | ---: | --- |
| `contentText.runs` | 1 | 1149 |
| `contentText.simpleText` | 1 | 1149 |

### `description` - 31 unique effective paths

| Path literal | Effective references | Source lines |
| --- | ---: | --- |
| `backstageAttachment.captionText.runs` | 1 | 1027 |
| `choices.0.choiceText.runs` | 1 | 1036 |
| `choices.0.choiceText.simpleText` | 1 | 1035 |
| `choices.1.choiceText.runs` | 1 | 1038 |
| `choices.1.choiceText.simpleText` | 1 | 1037 |
| `description.runs` | 1 | 973 |
| `description.simpleText` | 1 | 973 |
| `descriptionSnippet.runs` | 9 | 643, 725, 873, 882 |
| `descriptionSnippet.simpleText` | 9 | 644, 726, 873, 881 |
| `detailedMetadataSnippets.0.snippetText.runs` | 7 | 645, 884 |
| `detailedMetadataSnippets.0.snippetText.simpleText` | 7 | 646, 883 |
| `expandedContentText.runs` | 1 | 1027 |
| `expandedContentText.simpleText` | 1 | 1027 |
| `longBylineText.runs` | 2 | 958, 966 |
| `longMessage.runs` | 1 | 1055 |
| `longMessage.simpleText` | 1 | 1055 |
| `options.0.text.runs` | 1 | 1045 |
| `options.0.text.simpleText` | 1 | 1044 |
| `options.1.text.runs` | 1 | 1047 |
| `options.1.text.simpleText` | 1 | 1046 |
| `post.backstagePostRenderer.backstageAttachment.captionText.runs` | 1 | 1020 |
| `post.backstagePostRenderer.expandedContentText.runs` | 1 | 1020 |
| `resumePlaybackRenderer.accessibility.accessibilityData.label` | 1 | 1095 |
| `secondaryText.runs` | 1 | 849 |
| `secondaryText.simpleText` | 1 | 849 |
| `sentTimeText.simpleText` | 1 | 1055 |
| `shortBylineText.runs` | 2 | 958, 966 |
| `subtitle.runs` | 3 | 842, 973, 1072 |
| `subtitle.simpleText` | 3 | 842, 973, 1072 |
| `videoCountShortText.runs` | 2 | 958, 966 |
| `videoCountText.runs` | 2 | 958, 966 |

### `duration` - 18 unique effective paths

| Path literal | Effective references | Source lines |
| --- | ---: | --- |
| `content.videoRenderer.lengthText.runs.0.text` | 1 | 751 |
| `content.videoRenderer.lengthText.simpleText` | 1 | 750 |
| `content.videoRenderer.thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.runs.0.text` | 1 | 749 |
| `content.videoRenderer.thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.simpleText` | 1 | 748 |
| `contentImage.collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel.overlays.0.thumbnailBottomOverlayViewModel.badges.0.thumbnailBadgeViewModel.text` | 1 | 779 |
| `contentImage.collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadges.0.thumbnailBadgeViewModel.text` | 1 | 778 |
| `contentImage.primaryThumbnail.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadges.0.thumbnailBadgeViewModel.text` | 1 | 780 |
| `contentImage.thumbnailViewModel.overlays.0.thumbnailBottomOverlayViewModel.badges.0.thumbnailBadgeViewModel.text` | 1 | 777 |
| `contentImage.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadgeViewModel.text` | 1 | 776 |
| `contentImage.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadges.0.thumbnailBadgeViewModel.text` | 1 | 775 |
| `lengthText.runs.0.text` | 9 | 652, 730, 905, 938 |
| `lengthText.simpleText` | 9 | 651, 729, 904, 937 |
| `thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.runs.0.text` | 6 | 650 |
| `thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.simpleText` | 6 | 649 |
| `videos.0.childVideoRenderer.lengthText.runs.0.text` | 2 | 907, 940 |
| `videos.0.childVideoRenderer.lengthText.simpleText` | 2 | 906, 939 |
| `videos.0.playlistVideoRenderer.lengthText.runs.0.text` | 2 | 909, 942 |
| `videos.0.playlistVideoRenderer.lengthText.simpleText` | 2 | 908, 941 |

### `metadataRows` - 3 unique effective paths

| Path literal | Effective references | Source lines |
| --- | ---: | --- |
| `decoratedMetadataRows.rows` | 1 | 982 |
| `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows` | 1 | 773 |
| `metadataRows` | 1 | 982 |

### `publishedTime` - 12 unique effective paths

| Path literal | Effective references | Source lines |
| --- | ---: | --- |
| `content.videoRenderer.publishedTimeText.runs.0.text` | 1 | 755 |
| `content.videoRenderer.publishedTimeText.simpleText` | 1 | 754 |
| `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.0.metadataParts.1.text.content` | 1 | 783 |
| `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.1.metadataParts.0.text.content` | 1 | 784 |
| `publishedTimeText.runs.0.text` | 7 | 656, 734 |
| `publishedTimeText.simpleText` | 7 | 655, 733 |
| `videoInfo.runs.0.text` | 6 | 657 |
| `videoInfo.runs.2.text` | 6 | 658 |
| `videos.0.childVideoRenderer.publishedTimeText.runs.0.text` | 2 | 913, 946 |
| `videos.0.childVideoRenderer.publishedTimeText.simpleText` | 2 | 912, 945 |
| `videos.0.playlistVideoRenderer.publishedTimeText.runs.0.text` | 2 | 915, 948 |
| `videos.0.playlistVideoRenderer.publishedTimeText.simpleText` | 2 | 914, 947 |

### `title` - 31 unique effective paths

| Path literal | Effective references | Source lines |
| --- | ---: | --- |
| `accessibilityText` | 3 | 766, 1115, 1130 |
| `callToAction.watchCardHeroVideoRenderer.callToActionButton.callToActionButtonRenderer.label.runs` | 1 | 810 |
| `callToAction.watchCardHeroVideoRenderer.callToActionButton.callToActionButtonRenderer.label.simpleText` | 1 | 811 |
| `chipText.runs` | 1 | 848 |
| `chipText.simpleText` | 1 | 848 |
| `content.videoRenderer.title.runs` | 1 | 744 |
| `content.videoRenderer.title.simpleText` | 1 | 744 |
| `contentText.runs` | 1 | 1026 |
| `contentText.simpleText` | 1 | 1026 |
| `header.shelfHeaderRenderer.title.simpleText` | 1 | 759 |
| `header.ticketShelfHeaderRenderer.title.simpleText` | 1 | 969 |
| `header.watchCardRichHeaderRenderer.title.runs` | 1 | 806 |
| `header.watchCardRichHeaderRenderer.title.simpleText` | 1 | 807 |
| `headline.runs` | 4 | 710, 871, 1071, 1105 |
| `headline.simpleText` | 4 | 710, 871, 1071, 1105 |
| `metadata.lockupMetadataViewModel.title.content` | 1 | 766 |
| `pollQuestion.runs` | 1 | 1033 |
| `pollQuestion.simpleText` | 1 | 1033 |
| `post.backstagePostRenderer.contentText.runs` | 1 | 1019 |
| `post.backstagePostRenderer.contentText.simpleText` | 1 | 1019 |
| `quizQuestion.runs` | 1 | 1042 |
| `quizQuestion.simpleText` | 1 | 1042 |
| `shortMessage.runs` | 1 | 1054 |
| `shortMessage.simpleText` | 1 | 1054 |
| `text.runs` | 4 | 848, 1089, 1092, 1098 |
| `text.simpleText` | 4 | 848, 1089, 1092, 1098 |
| `title` | 6 | 630 |
| `title.runs` | 19 | 630, 791, 841, 845, 871, 878, 926, 957, 965, 972, 985, 992, 1054, 1071 |
| `title.simpleText` | 20 | 630, 791, 841, 845, 871, 878, 899, 926, 957, 965, 972, 985, 992, 1054, 1071 |
| `watchCardRichHeaderRenderer.title.runs` | 1 | 808 |
| `watchCardRichHeaderRenderer.title.simpleText` | 1 | 809 |

### `videoId` - 14 unique effective paths

| Path literal | Effective references | Source lines |
| --- | ---: | --- |
| `callToAction.watchCardHeroVideoRenderer.watchEndpoint.videoId` | 1 | 803 |
| `content.videoRenderer.videoId` | 1 | 743 |
| `contentId` | 1 | 764 |
| `inlinePlaybackEndpoint.watchEndpoint.videoId` | 2 | 709, 954 |
| `navigationEndpoint.watchEndpoint.videoId` | 4 | 893, 920, 953, 962 |
| `onTap.innertubeCommand.reelWatchEndpoint.videoId` | 2 | 1114, 1129 |
| `rendererContext.commandContext.onTap.innertubeCommand.watchEndpoint.videoId` | 1 | 763 |
| `secondaryNavigationEndpoint.watchEndpoint.videoId` | 2 | 955, 963 |
| `videoId` | 11 | 629, 709, 870, 877, 991, 1104 |
| `videos.0.childVideoRenderer.navigationEndpoint.watchEndpoint.videoId` | 2 | 895, 922 |
| `videos.0.childVideoRenderer.videoId` | 2 | 894, 921 |
| `videos.0.playlistVideoRenderer.navigationEndpoint.watchEndpoint.videoId` | 2 | 897, 924 |
| `videos.0.playlistVideoRenderer.videoId` | 2 | 896, 923 |
| `watchCardRichHeaderRenderer.navigationEndpoint.videoId` | 1 | 802 |

### `viewCount` - 3 unique effective paths

| Path literal | Effective references | Source lines |
| --- | ---: | --- |
| `shortViewCountText.runs.0.text` | 1 | 736 |
| `shortViewCountText.simpleText` | 7 | 660, 736 |
| `viewCountText.simpleText` | 6 | 660 |

## Current Behavior Boundaries

```text
FILTER_RULES is hand-authored source, not generated from docs/json_paths_encyclopedia.md
getByPath() consumes dot-separated path syntax and numeric segments such as .0.
documented bracket-index examples are not executable runtime path strings unless converted
BASE_VIDEO_RULES is a source alias that expands into multiple renderer keys
duplicate gridVideoRenderer declarations make source-row counts different from effective runtime rows
videoId paths are join keys and do not by themselves prove channel identity
channelName paths can include display text, canonical URLs, browse ids, or title text depending on renderer
metadata predicate paths are not equivalent to a compiled rule-state/no-work authority
direct JSON path coverage does not prove DOM fallback can be deleted
```

## Risk Notes

Reliability risk is concentrated in unowned path expansion. Adding a documented
field from the encyclopedia without runtime syntax conversion, fixture
provenance, duplicate-policy review, and route/list-mode checks can leave the new
path inert or too broad.

False-hide risk is concentrated in mixed confidence fields. `channelName` and
`channelHandle` groups include display strings and URL-like fields beside stable
ids. JSON-first optimization still needs an identity confidence decision before
those paths can replace DOM, learned-map, or resolver fallbacks.

Performance and code-burden risk comes from treating field presence as work
permission. The current rule paths can wake parsing/mutation work even though
compiled rule-state, no-rule budgets, and DOM fallback parity are separate
audits.

## Future Proof Fields

Each rule path needs per-field authority before JSON-first behavior changes,
renderer expansion, or DOM fallback pruning:

```text
rulePathReference
sourceFile
sourceLine
rendererKey
effectiveRuntimeKey
fieldName
semanticPathGroup
rawPathLiteral
normalizedRuntimePath
pathSyntax
duplicateOverridePolicy
baseAliasPolicy
documentedJsonSection
routeOrEndpoint
surface
profileType
listMode
ruleState
sourceTier
identityConfidence
allowedEffect
forbiddenEffect
positiveFixture
whitelistFixture
emptyListFixture
disabledFixture
negativeSiblingFixture
domFallbackParityFixture
nativeRuntimeParityFixture
fixtureProvenance
noRuleBudget
restoreProof
```

## Missing Runtime Authorities

These authority/report tokens do not exist in runtime source today:

```text
filterLogicRulePathAuthority
filterLogicRulePathManifest
filterLogicRulePathSyntaxContract
filterLogicEffectiveRendererPathReport
filterLogicDuplicatePathOverridePolicy
filterLogicJsonDomParityReport
filterLogicPathFixtureProvenance
filterLogicJsonFirstReadinessGate
filterLogicPathEffectDecision
filterLogicPathNoRuleBudget
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this filter-logic rule-path surface can
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
optimization, JSON-first behavior, rule-path changes, duplicate path policy
changes, JSON/DOM parity changes, or selector/renderer authority changes.
