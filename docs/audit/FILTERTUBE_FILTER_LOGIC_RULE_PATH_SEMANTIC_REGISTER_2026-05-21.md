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

## Source-Derived Summary

```text
source file: js/filter_logic.js
source line count: 3652
source bytes: 172174
source sha256: 953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5
path owner object: FILTER_RULES
shared alias object: BASE_VIDEO_RULES
BASE_VIDEO_RULES field rows: 9
BASE_VIDEO_RULES authored path rows: 27
FILTER_RULES source declarations: 45
FILTER_RULES source path rows before duplicate override: 467
source-authored path rows including BASE_VIDEO_RULES: 494
effective runtime renderer keys after duplicate override: 44
effective BASE_VIDEO_RULES aliases after duplicate override: 6
effective object literal rules after duplicate override: 38
effective runtime path rows after duplicate override: 440
effective unique path literals: 174
effective renderer-field pairs: 177
path syntax with dot numeric indexes: 157
path syntax with bracket numeric indexes: 0
path syntax without numeric indexes: 283
template path literals: 0
documented encyclopedia loaded by runtime: no
runtime behavior changed: no
```

## Effective Field Counts

| Field | Effective path rows |
| --- | ---: |
| `title` | 86 |
| `description` | 63 |
| `commentText` | 2 |
| `channelName` | 55 |
| `channelId` | 48 |
| `channelHandle` | 49 |
| `videoId` | 34 |
| `duration` | 48 |
| `publishedTime` | 38 |
| `viewCount` | 14 |
| `metadataRows` | 3 |

## Semantic Path Groups

| Semantic group | Fields | Effective rows | Current owner/effect shape | Missing proof before behavior changes |
| --- | --- | ---: | --- | --- |
| `textMatchPath` | `title`, `description`, `commentText` | 151 | Feeds keyword/comment matching and can remove JSON renderers when a rule matches. | Per-route positive and negative sibling fixtures, comment/global keyword parity, exact-match Unicode policy, and DOM parity proof. |
| `channelIdentityPath` | `channelName`, `channelId`, `channelHandle` | 152 | Feeds channel block/allow matching, sometimes from stable ids/handles and sometimes from display text or URL-like fields. | Identity-confidence report for UC id, handle, URL, and display-name paths plus whitelist fail-closed fixtures. |
| `videoIdentityPath` | `videoId` | 34 | Provides video ids for renderer mutation and for joins to harvested owner maps, but video id is not channel identity by itself. | Join provenance, stale-map handling, route surface ownership, and no-map fallback policy. |
| `metadataPredicatePath` | `duration`, `publishedTime`, `viewCount`, `metadataRows` | 103 | Feeds duration/upload-date/category-adjacent metadata work and display metadata extraction. | Predicate-validity proof for enabled-empty, blank-date, zero-threshold, localized text, and metadata-fetch reasons. |

## Duplicate And Syntax Boundary

```text
gridVideoRenderer is declared twice in source: BASE_VIDEO_RULES at line 440 and an object literal at line 613
JavaScript object semantics keep the later gridVideoRenderer object literal as the effective runtime key
source FILTER_RULES path rows before duplicate override: 467
effective runtime path rows after duplicate override: 440
all current runtime paths use dot-index syntax such as runs.0.text
no current runtime path uses bracket-index syntax such as runs[0].text
docs/json_paths_encyclopedia.md uses documented field text, but runtime/build source does not load it
```

## Unique Effective Path Literals By Field

### `channelHandle` - 23 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `authorEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 747 |
| `channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 457 |
| `channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 801 |
| `header.watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 567 |
| `header.watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 568 |
| `header.watchCardRichHeaderRenderer.subtitle.runs.0.text` | 1 | 566 |
| `longBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 8 | 389, 458, 665 |
| `metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl` | 1 | 507 |
| `metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.commandMetadata.webCommandMetadata.url` | 1 | 508 |
| `navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 5 | 594, 728, 733 |
| `navigationEndpoint.commandMetadata.webCommandMetadata.url` | 2 | 595, 784 |
| `ownerText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 7 | 390, 459 |
| `post.backstagePostRenderer.authorEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 740 |
| `publisherMetadata.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 712 |
| `shortBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 9 | 388, 456, 633 |
| `text.runs` | 1 | 597 |
| `text.simpleText` | 1 | 596 |
| `watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 569 |
| `watchCardRichHeaderRenderer.subtitle.navigationEndpoint.commandMetadata.webCommandMetadata.url` | 1 | 571 |
| `watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 570 |
| `watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.commandMetadata.webCommandMetadata.url` | 1 | 572 |
| `watchCardRichHeaderRenderer.title.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 573 |
| `watchCardRichHeaderRenderer.title.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 574 |

### `channelId` - 21 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `authorEndpoint.browseEndpoint.browseId` | 2 | 746, 837 |
| `channelId` | 2 | 726, 731 |
| `channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId` | 1 | 451 |
| `channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId` | 1 | 797 |
| `content.videoRenderer.shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId` | 1 | 483 |
| `feedbackButton.buttonRenderer.navigationEndpoint.browseEndpoint.browseId` | 1 | 780 |
| `header.watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.browseId` | 1 | 558 |
| `header.watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.browseId` | 1 | 559 |
| `header.watchCardRichHeaderRenderer.titleNavigationEndpoint.browseEndpoint.browseId` | 1 | 557 |
| `longBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId` | 8 | 384, 452, 661 |
| `metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` | 1 | 505 |
| `navigationEndpoint.browseEndpoint.browseId` | 3 | 592, 779, 798 |
| `owner.videoOwnerRenderer.navigationEndpoint.browseEndpoint.browseId` | 1 | 531 |
| `ownerText.runs.0.navigationEndpoint.browseEndpoint.browseId` | 7 | 385, 453 |
| `post.backstagePostRenderer.authorEndpoint.browseEndpoint.browseId` | 1 | 739 |
| `publisherMetadata.navigationEndpoint.browseEndpoint.browseId` | 1 | 710 |
| `shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId` | 11 | 383, 450, 611 |
| `watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.browseId` | 1 | 560 |
| `watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.browseId` | 1 | 561 |
| `watchCardRichHeaderRenderer.title.navigationEndpoint.browseEndpoint.browseId` | 1 | 562 |
| `watchCardRichHeaderRenderer.title.runs.0.navigationEndpoint.browseEndpoint.browseId` | 1 | 563 |

### `channelName` - 26 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `authorText.simpleText` | 2 | 745, 838 |
| `channelName.runs` | 1 | 794 |
| `channelName.simpleText` | 1 | 793 |
| `channelTitle.runs` | 1 | 792 |
| `channelTitle.simpleText` | 1 | 791 |
| `collapseStateButton.toggleButtonRenderer.defaultText.simpleText` | 1 | 776 |
| `content.videoRenderer.longBylineText.runs` | 1 | 482 |
| `content.videoRenderer.shortBylineText.runs` | 1 | 482 |
| `displayName.simpleText` | 1 | 727 |
| `header.watchCardRichHeaderRenderer.subtitle.runs` | 1 | 551 |
| `header.watchCardRichHeaderRenderer.subtitle.simpleText` | 1 | 552 |
| `longBylineText.runs` | 10 | 381, 448, 609 |
| `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.0.metadataParts.0.text.content` | 1 | 504 |
| `navigationEndpoint.browseEndpoint.browseId` | 1 | 589 |
| `navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 2 | 588, 774 |
| `navigationEndpoint.commandMetadata.webCommandMetadata.url` | 2 | 590, 775 |
| `navigationEndpoint.reelWatchEndpoint.overlay.reelPlayerOverlayRenderer.reelPlayerHeaderSupportedRenderers.reelPlayerHeaderRenderer.channelTitleText.simpleText` | 1 | 823 |
| `owner.videoOwnerRenderer.title.runs` | 1 | 532 |
| `ownerText.runs` | 7 | 381, 448 |
| `post.backstagePostRenderer.authorText.simpleText` | 1 | 738 |
| `publisherMetadata.publisherName.runs` | 1 | 707 |
| `publisherMetadata.publisherName.simpleText` | 1 | 706 |
| `shortBylineText.runs` | 11 | 381, 448, 609 |
| `title.simpleText` | 2 | 727, 732 |
| `watchCardRichHeaderRenderer.subtitle.runs` | 1 | 553 |
| `watchCardRichHeaderRenderer.subtitle.simpleText` | 1 | 554 |

### `commentText` - 2 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `contentText.runs` | 1 | 839 |
| `contentText.simpleText` | 1 | 839 |

### `description` - 31 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `backstageAttachment.captionText.runs` | 1 | 744 |
| `choices.0.choiceText.runs` | 1 | 753 |
| `choices.0.choiceText.simpleText` | 1 | 752 |
| `choices.1.choiceText.runs` | 1 | 755 |
| `choices.1.choiceText.simpleText` | 1 | 754 |
| `description.runs` | 1 | 704 |
| `description.simpleText` | 1 | 704 |
| `descriptionSnippet.runs` | 8 | 393, 462, 610 |
| `descriptionSnippet.simpleText` | 8 | 394, 463, 610 |
| `detailedMetadataSnippets.0.snippetText.runs` | 6 | 395 |
| `detailedMetadataSnippets.0.snippetText.simpleText` | 6 | 396 |
| `expandedContentText.runs` | 1 | 744 |
| `expandedContentText.simpleText` | 1 | 744 |
| `longBylineText.runs` | 2 | 689, 697 |
| `longMessage.runs` | 1 | 772 |
| `longMessage.simpleText` | 1 | 772 |
| `options.0.text.runs` | 1 | 762 |
| `options.0.text.simpleText` | 1 | 761 |
| `options.1.text.runs` | 1 | 764 |
| `options.1.text.simpleText` | 1 | 763 |
| `post.backstagePostRenderer.backstageAttachment.captionText.runs` | 1 | 737 |
| `post.backstagePostRenderer.expandedContentText.runs` | 1 | 737 |
| `resumePlaybackRenderer.accessibility.accessibilityData.label` | 1 | 812 |
| `secondaryText.runs` | 1 | 586 |
| `secondaryText.simpleText` | 1 | 586 |
| `sentTimeText.simpleText` | 1 | 772 |
| `shortBylineText.runs` | 2 | 689, 697 |
| `subtitle.runs` | 3 | 579, 704, 789 |
| `subtitle.simpleText` | 3 | 579, 704, 789 |
| `videoCountShortText.runs` | 2 | 689, 697 |
| `videoCountText.runs` | 2 | 689, 697 |

### `duration` - 18 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `content.videoRenderer.lengthText.runs.0.text` | 1 | 488 |
| `content.videoRenderer.lengthText.simpleText` | 1 | 487 |
| `content.videoRenderer.thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.runs.0.text` | 1 | 486 |
| `content.videoRenderer.thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.simpleText` | 1 | 485 |
| `contentImage.collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel.overlays.0.thumbnailBottomOverlayViewModel.badges.0.thumbnailBadgeViewModel.text` | 1 | 516 |
| `contentImage.collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadges.0.thumbnailBadgeViewModel.text` | 1 | 515 |
| `contentImage.primaryThumbnail.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadges.0.thumbnailBadgeViewModel.text` | 1 | 517 |
| `contentImage.thumbnailViewModel.overlays.0.thumbnailBottomOverlayViewModel.badges.0.thumbnailBadgeViewModel.text` | 1 | 514 |
| `contentImage.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadges.0.thumbnailBadgeViewModel.text` | 1 | 512 |
| `contentImage.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadgeViewModel.text` | 1 | 513 |
| `lengthText.runs.0.text` | 9 | 402, 467, 636 |
| `lengthText.simpleText` | 9 | 401, 466, 635 |
| `thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.runs.0.text` | 6 | 400 |
| `thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.simpleText` | 6 | 399 |
| `videos.0.childVideoRenderer.lengthText.runs.0.text` | 2 | 638, 671 |
| `videos.0.childVideoRenderer.lengthText.simpleText` | 2 | 637, 670 |
| `videos.0.playlistVideoRenderer.lengthText.runs.0.text` | 2 | 640, 673 |
| `videos.0.playlistVideoRenderer.lengthText.simpleText` | 2 | 639, 672 |

### `metadataRows` - 3 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `decoratedMetadataRows.rows` | 1 | 713 |
| `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows` | 1 | 510 |
| `metadataRows` | 1 | 713 |

### `publishedTime` - 12 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `content.videoRenderer.publishedTimeText.runs.0.text` | 1 | 492 |
| `content.videoRenderer.publishedTimeText.simpleText` | 1 | 491 |
| `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.0.metadataParts.1.text.content` | 1 | 520 |
| `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.1.metadataParts.0.text.content` | 1 | 521 |
| `publishedTimeText.runs.0.text` | 7 | 406, 471 |
| `publishedTimeText.simpleText` | 7 | 405, 470 |
| `videoInfo.runs.0.text` | 6 | 407 |
| `videoInfo.runs.2.text` | 6 | 408 |
| `videos.0.childVideoRenderer.publishedTimeText.runs.0.text` | 2 | 644, 677 |
| `videos.0.childVideoRenderer.publishedTimeText.simpleText` | 2 | 643, 676 |
| `videos.0.playlistVideoRenderer.publishedTimeText.runs.0.text` | 2 | 646, 679 |
| `videos.0.playlistVideoRenderer.publishedTimeText.simpleText` | 2 | 645, 678 |

### `title` - 31 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `accessibilityText` | 3 | 503, 827, 831 |
| `callToAction.watchCardHeroVideoRenderer.callToActionButton.callToActionButtonRenderer.label.runs` | 1 | 547 |
| `callToAction.watchCardHeroVideoRenderer.callToActionButton.callToActionButtonRenderer.label.simpleText` | 1 | 548 |
| `chipText.runs` | 1 | 585 |
| `chipText.simpleText` | 1 | 585 |
| `content.videoRenderer.title.runs` | 1 | 481 |
| `content.videoRenderer.title.simpleText` | 1 | 481 |
| `contentText.runs` | 1 | 743 |
| `contentText.simpleText` | 1 | 743 |
| `header.shelfHeaderRenderer.title.simpleText` | 1 | 496 |
| `header.ticketShelfHeaderRenderer.title.simpleText` | 1 | 700 |
| `header.watchCardRichHeaderRenderer.title.runs` | 1 | 543 |
| `header.watchCardRichHeaderRenderer.title.simpleText` | 1 | 544 |
| `headline.runs` | 3 | 447, 608, 788 |
| `headline.simpleText` | 4 | 447, 608, 788 |
| `metadata.lockupMetadataViewModel.title.content` | 1 | 503 |
| `pollQuestion.runs` | 1 | 750 |
| `pollQuestion.simpleText` | 1 | 750 |
| `post.backstagePostRenderer.contentText.runs` | 1 | 736 |
| `post.backstagePostRenderer.contentText.simpleText` | 1 | 736 |
| `quizQuestion.runs` | 1 | 759 |
| `quizQuestion.simpleText` | 1 | 759 |
| `shortMessage.runs` | 1 | 771 |
| `shortMessage.simpleText` | 1 | 771 |
| `text.runs` | 4 | 585, 806, 809 |
| `text.simpleText` | 4 | 585, 806, 809 |
| `title` | 6 | 380 |
| `title.runs` | 19 | 380, 528, 578 |
| `title.simpleText` | 20 | 380, 528, 578 |
| `watchCardRichHeaderRenderer.title.runs` | 1 | 545 |
| `watchCardRichHeaderRenderer.title.simpleText` | 1 | 546 |

### `videoId` - 14 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `callToAction.watchCardHeroVideoRenderer.watchEndpoint.videoId` | 1 | 540 |
| `content.videoRenderer.videoId` | 1 | 480 |
| `contentId` | 1 | 501 |
| `inlinePlaybackEndpoint.watchEndpoint.videoId` | 2 | 446, 685 |
| `navigationEndpoint.watchEndpoint.videoId` | 4 | 624, 651, 684 |
| `onTap.innertubeCommand.reelWatchEndpoint.videoId` | 2 | 826, 830 |
| `rendererContext.commandContext.onTap.innertubeCommand.watchEndpoint.videoId` | 1 | 500 |
| `secondaryNavigationEndpoint.watchEndpoint.videoId` | 2 | 686, 694 |
| `videoId` | 11 | 379, 446, 607 |
| `videos.0.childVideoRenderer.navigationEndpoint.watchEndpoint.videoId` | 2 | 626, 653 |
| `videos.0.childVideoRenderer.videoId` | 2 | 625, 652 |
| `videos.0.playlistVideoRenderer.navigationEndpoint.watchEndpoint.videoId` | 2 | 628, 655 |
| `videos.0.playlistVideoRenderer.videoId` | 2 | 627, 654 |
| `watchCardRichHeaderRenderer.navigationEndpoint.videoId` | 1 | 539 |

### `viewCount` - 3 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `shortViewCountText.runs.0.text` | 1 | 473 |
| `shortViewCountText.simpleText` | 7 | 410, 473 |
| `viewCountText.simpleText` | 6 | 410 |

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
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, rule-path changes, duplicate path policy
changes, JSON/DOM parity changes, or selector/renderer authority changes.
