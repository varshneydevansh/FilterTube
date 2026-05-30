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
source line count: 3498
source bytes: 165151
source sha256: 4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641
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
gridVideoRenderer is declared twice in source: BASE_VIDEO_RULES at line 431 and an object literal at line 604
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
| `authorEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 738 |
| `channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 448 |
| `channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 792 |
| `header.watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 558 |
| `header.watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 559 |
| `header.watchCardRichHeaderRenderer.subtitle.runs.0.text` | 1 | 557 |
| `longBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 8 | 380, 449, 656 |
| `metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl` | 1 | 498 |
| `metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.commandMetadata.webCommandMetadata.url` | 1 | 499 |
| `navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 5 | 585, 719, 724 |
| `navigationEndpoint.commandMetadata.webCommandMetadata.url` | 2 | 586, 775 |
| `ownerText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 7 | 381, 450 |
| `post.backstagePostRenderer.authorEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 731 |
| `publisherMetadata.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 703 |
| `shortBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 9 | 379, 447, 624 |
| `text.runs` | 1 | 588 |
| `text.simpleText` | 1 | 587 |
| `watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 560 |
| `watchCardRichHeaderRenderer.subtitle.navigationEndpoint.commandMetadata.webCommandMetadata.url` | 1 | 562 |
| `watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 561 |
| `watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.commandMetadata.webCommandMetadata.url` | 1 | 563 |
| `watchCardRichHeaderRenderer.title.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 564 |
| `watchCardRichHeaderRenderer.title.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 1 | 565 |

### `channelId` - 21 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `authorEndpoint.browseEndpoint.browseId` | 2 | 737, 828 |
| `channelId` | 2 | 717, 722 |
| `channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId` | 1 | 442 |
| `channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId` | 1 | 788 |
| `content.videoRenderer.shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId` | 1 | 474 |
| `feedbackButton.buttonRenderer.navigationEndpoint.browseEndpoint.browseId` | 1 | 771 |
| `header.watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.browseId` | 1 | 549 |
| `header.watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.browseId` | 1 | 550 |
| `header.watchCardRichHeaderRenderer.titleNavigationEndpoint.browseEndpoint.browseId` | 1 | 548 |
| `longBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId` | 8 | 375, 443, 652 |
| `metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` | 1 | 496 |
| `navigationEndpoint.browseEndpoint.browseId` | 3 | 583, 770, 789 |
| `owner.videoOwnerRenderer.navigationEndpoint.browseEndpoint.browseId` | 1 | 522 |
| `ownerText.runs.0.navigationEndpoint.browseEndpoint.browseId` | 7 | 376, 444 |
| `post.backstagePostRenderer.authorEndpoint.browseEndpoint.browseId` | 1 | 730 |
| `publisherMetadata.navigationEndpoint.browseEndpoint.browseId` | 1 | 701 |
| `shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId` | 11 | 374, 441, 602 |
| `watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.browseId` | 1 | 551 |
| `watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.browseId` | 1 | 552 |
| `watchCardRichHeaderRenderer.title.navigationEndpoint.browseEndpoint.browseId` | 1 | 553 |
| `watchCardRichHeaderRenderer.title.runs.0.navigationEndpoint.browseEndpoint.browseId` | 1 | 554 |

### `channelName` - 26 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `authorText.simpleText` | 2 | 736, 829 |
| `channelName.runs` | 1 | 785 |
| `channelName.simpleText` | 1 | 784 |
| `channelTitle.runs` | 1 | 783 |
| `channelTitle.simpleText` | 1 | 782 |
| `collapseStateButton.toggleButtonRenderer.defaultText.simpleText` | 1 | 767 |
| `content.videoRenderer.longBylineText.runs` | 1 | 473 |
| `content.videoRenderer.shortBylineText.runs` | 1 | 473 |
| `displayName.simpleText` | 1 | 718 |
| `header.watchCardRichHeaderRenderer.subtitle.runs` | 1 | 542 |
| `header.watchCardRichHeaderRenderer.subtitle.simpleText` | 1 | 543 |
| `longBylineText.runs` | 10 | 372, 439, 600 |
| `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.0.metadataParts.0.text.content` | 1 | 495 |
| `navigationEndpoint.browseEndpoint.browseId` | 1 | 580 |
| `navigationEndpoint.browseEndpoint.canonicalBaseUrl` | 2 | 579, 765 |
| `navigationEndpoint.commandMetadata.webCommandMetadata.url` | 2 | 581, 766 |
| `navigationEndpoint.reelWatchEndpoint.overlay.reelPlayerOverlayRenderer.reelPlayerHeaderSupportedRenderers.reelPlayerHeaderRenderer.channelTitleText.simpleText` | 1 | 814 |
| `owner.videoOwnerRenderer.title.runs` | 1 | 523 |
| `ownerText.runs` | 7 | 372, 439 |
| `post.backstagePostRenderer.authorText.simpleText` | 1 | 729 |
| `publisherMetadata.publisherName.runs` | 1 | 698 |
| `publisherMetadata.publisherName.simpleText` | 1 | 697 |
| `shortBylineText.runs` | 11 | 372, 439, 600 |
| `title.simpleText` | 2 | 718, 723 |
| `watchCardRichHeaderRenderer.subtitle.runs` | 1 | 544 |
| `watchCardRichHeaderRenderer.subtitle.simpleText` | 1 | 545 |

### `commentText` - 2 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `contentText.runs` | 1 | 830 |
| `contentText.simpleText` | 1 | 830 |

### `description` - 31 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `backstageAttachment.captionText.runs` | 1 | 735 |
| `choices.0.choiceText.runs` | 1 | 744 |
| `choices.0.choiceText.simpleText` | 1 | 743 |
| `choices.1.choiceText.runs` | 1 | 746 |
| `choices.1.choiceText.simpleText` | 1 | 745 |
| `description.runs` | 1 | 695 |
| `description.simpleText` | 1 | 695 |
| `descriptionSnippet.runs` | 8 | 384, 453, 601 |
| `descriptionSnippet.simpleText` | 8 | 385, 454, 601 |
| `detailedMetadataSnippets.0.snippetText.runs` | 6 | 386 |
| `detailedMetadataSnippets.0.snippetText.simpleText` | 6 | 387 |
| `expandedContentText.runs` | 1 | 735 |
| `expandedContentText.simpleText` | 1 | 735 |
| `longBylineText.runs` | 2 | 680, 688 |
| `longMessage.runs` | 1 | 763 |
| `longMessage.simpleText` | 1 | 763 |
| `options.0.text.runs` | 1 | 753 |
| `options.0.text.simpleText` | 1 | 752 |
| `options.1.text.runs` | 1 | 755 |
| `options.1.text.simpleText` | 1 | 754 |
| `post.backstagePostRenderer.backstageAttachment.captionText.runs` | 1 | 728 |
| `post.backstagePostRenderer.expandedContentText.runs` | 1 | 728 |
| `resumePlaybackRenderer.accessibility.accessibilityData.label` | 1 | 803 |
| `secondaryText.runs` | 1 | 577 |
| `secondaryText.simpleText` | 1 | 577 |
| `sentTimeText.simpleText` | 1 | 763 |
| `shortBylineText.runs` | 2 | 680, 688 |
| `subtitle.runs` | 3 | 570, 695, 780 |
| `subtitle.simpleText` | 3 | 570, 695, 780 |
| `videoCountShortText.runs` | 2 | 680, 688 |
| `videoCountText.runs` | 2 | 680, 688 |

### `duration` - 18 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `content.videoRenderer.lengthText.runs.0.text` | 1 | 479 |
| `content.videoRenderer.lengthText.simpleText` | 1 | 478 |
| `content.videoRenderer.thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.runs.0.text` | 1 | 477 |
| `content.videoRenderer.thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.simpleText` | 1 | 476 |
| `contentImage.collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel.overlays.0.thumbnailBottomOverlayViewModel.badges.0.thumbnailBadgeViewModel.text` | 1 | 507 |
| `contentImage.collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadges.0.thumbnailBadgeViewModel.text` | 1 | 506 |
| `contentImage.primaryThumbnail.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadges.0.thumbnailBadgeViewModel.text` | 1 | 508 |
| `contentImage.thumbnailViewModel.overlays.0.thumbnailBottomOverlayViewModel.badges.0.thumbnailBadgeViewModel.text` | 1 | 505 |
| `contentImage.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadges.0.thumbnailBadgeViewModel.text` | 1 | 503 |
| `contentImage.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadgeViewModel.text` | 1 | 504 |
| `lengthText.runs.0.text` | 9 | 393, 458, 627 |
| `lengthText.simpleText` | 9 | 392, 457, 626 |
| `thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.runs.0.text` | 6 | 391 |
| `thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.simpleText` | 6 | 390 |
| `videos.0.childVideoRenderer.lengthText.runs.0.text` | 2 | 629, 662 |
| `videos.0.childVideoRenderer.lengthText.simpleText` | 2 | 628, 661 |
| `videos.0.playlistVideoRenderer.lengthText.runs.0.text` | 2 | 631, 664 |
| `videos.0.playlistVideoRenderer.lengthText.simpleText` | 2 | 630, 663 |

### `metadataRows` - 3 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `decoratedMetadataRows.rows` | 1 | 704 |
| `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows` | 1 | 501 |
| `metadataRows` | 1 | 704 |

### `publishedTime` - 12 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `content.videoRenderer.publishedTimeText.runs.0.text` | 1 | 483 |
| `content.videoRenderer.publishedTimeText.simpleText` | 1 | 482 |
| `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.0.metadataParts.1.text.content` | 1 | 511 |
| `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.1.metadataParts.0.text.content` | 1 | 512 |
| `publishedTimeText.runs.0.text` | 7 | 397, 462 |
| `publishedTimeText.simpleText` | 7 | 396, 461 |
| `videoInfo.runs.0.text` | 6 | 398 |
| `videoInfo.runs.2.text` | 6 | 399 |
| `videos.0.childVideoRenderer.publishedTimeText.runs.0.text` | 2 | 635, 668 |
| `videos.0.childVideoRenderer.publishedTimeText.simpleText` | 2 | 634, 667 |
| `videos.0.playlistVideoRenderer.publishedTimeText.runs.0.text` | 2 | 637, 670 |
| `videos.0.playlistVideoRenderer.publishedTimeText.simpleText` | 2 | 636, 669 |

### `title` - 31 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `accessibilityText` | 3 | 494, 818, 822 |
| `callToAction.watchCardHeroVideoRenderer.callToActionButton.callToActionButtonRenderer.label.runs` | 1 | 538 |
| `callToAction.watchCardHeroVideoRenderer.callToActionButton.callToActionButtonRenderer.label.simpleText` | 1 | 539 |
| `chipText.runs` | 1 | 576 |
| `chipText.simpleText` | 1 | 576 |
| `content.videoRenderer.title.runs` | 1 | 472 |
| `content.videoRenderer.title.simpleText` | 1 | 472 |
| `contentText.runs` | 1 | 734 |
| `contentText.simpleText` | 1 | 734 |
| `header.shelfHeaderRenderer.title.simpleText` | 1 | 487 |
| `header.ticketShelfHeaderRenderer.title.simpleText` | 1 | 691 |
| `header.watchCardRichHeaderRenderer.title.runs` | 1 | 534 |
| `header.watchCardRichHeaderRenderer.title.simpleText` | 1 | 535 |
| `headline.runs` | 3 | 438, 599, 779 |
| `headline.simpleText` | 4 | 438, 599, 779 |
| `metadata.lockupMetadataViewModel.title.content` | 1 | 494 |
| `pollQuestion.runs` | 1 | 741 |
| `pollQuestion.simpleText` | 1 | 741 |
| `post.backstagePostRenderer.contentText.runs` | 1 | 727 |
| `post.backstagePostRenderer.contentText.simpleText` | 1 | 727 |
| `quizQuestion.runs` | 1 | 750 |
| `quizQuestion.simpleText` | 1 | 750 |
| `shortMessage.runs` | 1 | 762 |
| `shortMessage.simpleText` | 1 | 762 |
| `text.runs` | 4 | 576, 797, 800 |
| `text.simpleText` | 4 | 576, 797, 800 |
| `title` | 6 | 371 |
| `title.runs` | 19 | 371, 519, 569 |
| `title.simpleText` | 20 | 371, 519, 569 |
| `watchCardRichHeaderRenderer.title.runs` | 1 | 536 |
| `watchCardRichHeaderRenderer.title.simpleText` | 1 | 537 |

### `videoId` - 14 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `callToAction.watchCardHeroVideoRenderer.watchEndpoint.videoId` | 1 | 531 |
| `content.videoRenderer.videoId` | 1 | 471 |
| `contentId` | 1 | 492 |
| `inlinePlaybackEndpoint.watchEndpoint.videoId` | 2 | 437, 676 |
| `navigationEndpoint.watchEndpoint.videoId` | 4 | 615, 642, 675 |
| `onTap.innertubeCommand.reelWatchEndpoint.videoId` | 2 | 817, 821 |
| `rendererContext.commandContext.onTap.innertubeCommand.watchEndpoint.videoId` | 1 | 491 |
| `secondaryNavigationEndpoint.watchEndpoint.videoId` | 2 | 677, 685 |
| `videoId` | 11 | 370, 437, 598 |
| `videos.0.childVideoRenderer.navigationEndpoint.watchEndpoint.videoId` | 2 | 617, 644 |
| `videos.0.childVideoRenderer.videoId` | 2 | 616, 643 |
| `videos.0.playlistVideoRenderer.navigationEndpoint.watchEndpoint.videoId` | 2 | 619, 646 |
| `videos.0.playlistVideoRenderer.videoId` | 2 | 618, 645 |
| `watchCardRichHeaderRenderer.navigationEndpoint.videoId` | 1 | 530 |

### `viewCount` - 3 unique effective paths

| Path | Renderer count | Source line samples |
| --- | ---: | --- |
| `shortViewCountText.runs.0.text` | 1 | 464 |
| `shortViewCountText.simpleText` | 7 | 401, 464 |
| `viewCountText.simpleText` | 6 | 401 |

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
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, rule-path changes, duplicate path policy
changes, JSON/DOM parity changes, or selector/renderer authority changes.
