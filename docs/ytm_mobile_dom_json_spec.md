# YouTube Mobile DOM + JSON Coverage Spec

Generated: 2026-02-08
Sources: `YTM-DOM.html`, `YTM-XHR.json`, `YTM-LOGS.txt`, `docs/youtube_renderer_inventory.md`.

## Update Addendum (2026-02-14)

This addendum captures the latest implementation changes and the remaining YouTube Mobile-specific gaps observed in:

- `YTM-XHR.json`
- `YTM-DOM.html`
- `YTM-WATCH PLAYER.html`
- `YTM-LOGS.txt`

### Implementation Status (v3.2.8)

- **`lockupViewModel`**: Channel extraction now supports deep metadata-row command paths.
- **`channelId`**: Extraction now properly supports array fallback paths for robust identity resolution.
- **Renderer Mapping Harvest**: Identities are now unwrapped and learned from `videoWithContextRenderer`, `compactPlaylistRenderer`, and `playlistPanelVideoRenderer`.
- **Custom URL Support**: Added fallback handle/ID extraction paths from `channelThumbnail` and `navigationEndpoint` command metadata.
- **Escaped Data Decoding**: Playlist creator fetch fallback now decodes escaped `ytInitialData` blocks (`\xNN` / `\uNNNN`) to reduce 404 fallbacks.

## Comprehensive DOM Selectors for YouTube Mobile (v3.2.8)

Use these selectors for identity extraction and UI manipulation on the mobile site:

### Video & Short Cards
- `ytm-video-with-context-renderer`: Main mobile video card.
- `ytm-shorts-lockup-view-model`, `ytm-shorts-lockup-view-model-v2`: Mobile shorts.
- `ytm-rich-item-renderer`: Generic wrapper for mobile grid items.
- `.YtmCompactMediaItemByline .yt-core-attributed-string`: Standard byline text location.
- `.YtmCompactMediaItemHeadline [aria-label]`: Alternative location for title/metadata.
- `ytm-slim-owner-renderer`: Owner block on the mobile watch page.
- `ytm-slim-video-information-renderer`: Video metadata section.
- `ytm-standalone-collection-badge-renderer`: Badge for mobile collections.

### Playlists & Mixes
- `ytm-compact-playlist-renderer`: Mobile playlist card.
- `ytm-playlist-video-renderer`: Video entry within a playlist.
- `ytm-playlist-panel-video-renderer`: Video entry in the watch queue.
- `ytm-radio-renderer`, `ytm-compact-radio-renderer`: Mobile Mix/Radio cards.
- `.YtmBadgeAndBylineRendererItemByline`: Byline for items with badges.
- `a[href^="/playlist?list="]`: Link to a playlist.

### Comments
- `ytm-comment-thread-renderer`: Container for a comment and its replies.
- `ytm-comment-view-model`: Modern mobile comment structure.
- `ytm-comment-renderer`: Legacy mobile comment structure.
- `a.YtmCommentRendererIconContainer`: Link to the author's channel (avatar).
- `.YtmCommentRendererTitle`: Author name container.

### UI & Menus
- `ytm-bottom-sheet-renderer`: The element that triggers the bottom sheet.
- `bottom-sheet-container`: The actual sliding menu container at the body level.
- `yt-list-view-model`: The list structure inside modern bottom sheets.
- `ytm-menu-service-item-renderer`, `ytm-menu-navigation-item-renderer`: Standard mobile menu items.
- `.filtertube-playlist-menu-fallback-btn--mobile`: FilterTube's fallback menu button for mobile.

## Additional JSON Extraction Paths (v3.2.8)

### Generic lockup fallback (Mobile first)
When top-level fields are missing, scan `metadataRows`:
- `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[*].metadataParts[*].text.commandRuns[*].onTap.innertubeCommand.browseEndpoint.browseId`
- `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[*].metadataParts[*].text.commandRuns[*].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- `metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[*].metadataParts[*].text.commandRuns[*].onTap.innertubeCommand.commandMetadata.webCommandMetadata.url`

### Bottom-sheet items (XHR search responses)
- `menuOnTap.innertubeCommand.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[*].listItemViewModel`
- `listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- `listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- `listItemViewModel.title.commandRuns[*].onTap.innertubeCommand.browseEndpoint.browseId`

### Practical priority updates for YouTube Mobile

- For playlist cards, prioritize `metadataRows.commandRuns` owner identity over thumbnail/seed video heuristics.
- For MIX cards, treat as seed-video flow unless explicit creator channel is present.
- For post cards, read owner from `authorEndpoint` first, then DOM header link (`yt-post-header a[href^=\"/@\"], a[href*=\"/channel/\"]`).
- For modern bottom-sheet menu (`yt-list-view-model`), keep FilterTube injection aligned with native `yt-list-view-model` structure.
- **Escaped Data Decoding**: Always decode escaped `ytInitialData` blocks (`\xNN` / `\uNNNN`) when parsing mobile source strings.

### Community Posts and Radio (Mobile)
- `backstagePostThreadRenderer.post.backstagePostRenderer.authorEndpoint.browseEndpoint.browseId`
- `radioRenderer.navigationEndpoint.watchEndpoint.videoId`
- `compactRadioRenderer.secondaryNavigationEndpoint.watchEndpoint.videoId`

## YouTube Mobile JSON Channel ID Map (For DOM Stamping)

Use this section as the canonical extraction order when stamping `data-filtertube-channel-*` and `data-filtertube-collaborators` for YouTube Mobile cards.

### Primary video identity keys

- `videoWithContextRenderer.videoId`
- `videoWithContextRenderer.navigationEndpoint.watchEndpoint.videoId`
- `videoWithContextRenderer.navigationEndpoint.commandMetadata.webCommandMetadata.url` (`/watch?v=...`)

### Primary channel identity for the card

- `videoWithContextRenderer.channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId` (UC...)
- `videoWithContextRenderer.channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.commandMetadata.webCommandMetadata.url` (`/channel/UC...` or `/@...`)
- `videoWithContextRenderer.shortBylineText.runs[*].navigationEndpoint.browseEndpoint.browseId` (when present)
- `videoWithContextRenderer.shortBylineText.runs[*].navigationEndpoint.browseEndpoint.canonicalBaseUrl` (`/@...`, `/c/...`, `/user/...`)

### Collaboration roster identity (critical for collab cards)

For cards like `Shakira and 2 more`, parse this first:

- `videoWithContextRenderer.shortBylineText.runs[*].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[*].listItemViewModel`

Within each `listItemViewModel`, extract:

- **Name**: `title.content`
- **Handle fallback**: `subtitle.content` (contains `@handle`)
- **UC ID (primary)**:
  - `rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
  - `title.commandRuns[*].onTap.innertubeCommand.browseEndpoint.browseId`
- **Canonical URL / handle / custom URL**:
  - `rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
  - `title.commandRuns[*].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
  - `rendererContext.commandContext.onTap.innertubeCommand.commandMetadata.webCommandMetadata.url`
  - `title.commandRuns[*].onTap.innertubeCommand.commandMetadata.webCommandMetadata.url`
- **Avatar/logo**:
  - `leadingAccessory.avatarViewModel.image.sources[*].url`

### Additional ID-bearing URL patterns

- `/channel/UC...` -> direct UC ID
- `/@handle` -> handle
- `/c/<slug>` and `/user/<slug>` -> custom URL identities

### Practical stamping notes

- For collab cards without avatar stack DOM, treat `showSheetCommand -> listViewModel` as source-of-truth and stamp all collaborators to `data-filtertube-collaborators`.
- Also stamp primary collaborator (first list item) to:
  - `data-filtertube-channel-id`
  - `data-filtertube-channel-handle`
  - `data-filtertube-channel-name`
- Always pair collaborator stamping with `data-filtertube-video-id` so async menu enrichment can refresh by video ID reliably.

## Summary

- DOM sections: **17**
- JSON sections: **5**
- Unique DOM tags: **110**
- YouTube Mobile renderer/view-model keys in JSON: **129**
- Renderer/view-model keys mentioned in inventory: **83**
- Overlap with inventory: **21**
- YouTube Mobile JSON keys not in inventory: **108**
- Inventory keys not present in this YouTube Mobile sample: **62**

## DOM Sections

### 1. ======= SEARCH PAGE DOM YouTube Mobile- (lines 1-47)

- Tag count: **14**
- Tags: `a`, `c3-icon`, `div`, `h4`, `img`, `path`, `span`, `svg`, `ytm-call-to-action-button-renderer`, `ytm-collage-hero-image-renderer`, `ytm-profile-icon`, `ytm-universal-watch-card-renderer`, `ytm-watch-card-hero-video-renderer`, `ytm-watch-card-rich-header-renderer`
- Channel ID/handle carriers seen: `href="/channel/UCu7TZ_ATWgjgD9IrNLdnYDA"`

### 2. ======= Search pAge horizontal card list (lines 48-216)

- Tag count: **10**
- Tags: `a`, `div`, `h3`, `h4`, `span`, `yt-collections-stack`, `ytm-horizontal-card-list-renderer`, `ytm-rich-list-header-renderer`, `ytm-search-refinement-card-renderer`, `ytm-simple-card`
- Channel ID/handle carriers seen: none detected in this section sample.

### 3. ======= YouTube Mobile CHANNEL CARD (lines 217-428)

- Tag count: **23**
- Tags: `a`, `button`, `clippath`, `defs`, `div`, `g`, `h4`, `img`, `lineargradient`, `lottie-component`, `mask`, `path`, `rect`, `span`, `stop`, `svg`, `use`, `yt-animated-action`, `yt-smartimation`, `yt-touch-feedback-shape`, `ytm-compact-channel-renderer`, `ytm-compact-thumbnail`, `ytm-subscribe-button-renderer`
- Channel ID/handle carriers seen: `href="/@littlebig"`

### 4. ======= YouTube Mobile Video card (lines 429-518)

- Tag count: **22**
- Tags: `a`, `badge-shape`, `button`, `c3-icon`, `div`, `h3`, `img`, `path`, `span`, `svg`, `ytm-badge-and-byline-renderer`, `ytm-badge-supported-renderer`, `ytm-channel-thumbnail-with-link-renderer`, `ytm-media-item`, `ytm-menu`, `ytm-menu-renderer`, `ytm-metadata-badge-renderer`, `ytm-profile-icon`, `ytm-thumbnail-cover`, `ytm-thumbnail-overlay-resume-playback-renderer`, `ytm-thumbnail-overlay-time-status-renderer`, `ytm-video-with-context-renderer`
- Channel ID/handle carriers seen: `href="/channel/UCu7TZ_ATWgjgD9IrNLdnYDA"`

### 5. ======= 3 dot UI menu on search page (lines 519-577)

- Tag count: **11**
- Tags: `button`, `c3-icon`, `div`, `path`, `span`, `svg`, `tp-yt-paper-item`, `ytd-menu-service-item-renderer`, `ytm-menu-item`, `ytm-menu-navigation-item-renderer`, `ytm-menu-service-item-renderer`
- Channel ID/handle carriers seen: none detected in this section sample.

### 6. ======= YouTube Mobile search page SHORTS conatiner (lines 578-794)

- Tag count: **17**
- Tags: `a`, `avatar-view-model`, `button`, `c3-icon`, `div`, `grid-shelf-view-model`, `h2`, `h3`, `img`, `path`, `span`, `svg`, `yt-avatar-shape`, `yt-section-header-view-model`, `yt-shelf-header-layout`, `yt-touch-feedback-shape`, `ytm-shorts-lockup-view-model`
- Channel ID/handle carriers seen: none detected in this section sample.

### 7. ======= WATCH PAGE DOM (lines 795-908)

- Tag count: **20**
- Tags: `a`, `badge-shape`, `button`, `c3-icon`, `div`, `h3`, `img`, `path`, `span`, `svg`, `ytm-badge-and-byline-renderer`, `ytm-channel-thumbnail-with-link-renderer`, `ytm-media-item`, `ytm-menu`, `ytm-menu-renderer`, `ytm-profile-icon`, `ytm-thumbnail-cover`, `ytm-thumbnail-overlay-resume-playback-renderer`, `ytm-thumbnail-overlay-time-status-renderer`, `ytm-video-with-context-renderer`
- Channel ID/handle carriers seen: `href="/@loveradio"`

### 8. ======= Comments (lines 909-1163)

- Tag count: **26**
- Tags: `a`, `button`, `c3-icon`, `div`, `img`, `lazy-list`, `p`, `panel-container`, `path`, `span`, `svg`, `yt-touch-feedback-shape`, `ytm-button-renderer`, `ytm-comment-renderer`, `ytm-comment-replies-renderer`, `ytm-comment-simplebox-renderer`, `ytm-comment-thread-renderer`, `ytm-comments-header-renderer`, `ytm-continuation-item-renderer`, `ytm-engagement-panel`, `ytm-engagement-panel-section-list-renderer`, `ytm-item-section-renderer`, `ytm-pinned-comment-badge-renderer`, `ytm-profile-icon`, `ytm-section-list-renderer`, `ytw-scrim`
- Channel ID/handle carriers seen: `href="/@lilnasx"`

### 9. ======= SHorts container on watch page (lines 1164-1272)

- Tag count: **14**
- Tags: `a`, `button`, `c3-icon`, `div`, `h3`, `img`, `lazy-list`, `path`, `span`, `svg`, `yt-touch-feedback-shape`, `ytm-item-section-renderer`, `ytm-reel-shelf-renderer`, `ytm-shorts-lockup-view-model`
- Channel ID/handle carriers seen: none detected in this section sample.

### 10. ======= VIDEO description card (lines 1273-2053)

- Tag count: **37**
- Tags: `a`, `animated-icon`, `badge-shape`, `button`, `button-view-model`, `c3-icon`, `clippath`, `defs`, `dislike-button-view-model`, `div`, `g`, `h2`, `h3`, `img`, `like-button-view-model`, `lineargradient`, `lottie-component`, `mask`, `path`, `rect`, `script`, `segmented-like-dislike-button-view-model`, `span`, `stop`, `svg`, `toggle-button-view-model`, `use`, `yt-animated-action`, `yt-smartimation`, `yt-touch-feedback-shape`, `ytm-profile-icon`, `ytm-slim-owner-renderer`, `ytm-slim-video-action-bar-renderer`, `ytm-slim-video-information-renderer`, `ytm-slim-video-metadata-section-renderer`, `ytm-standalone-collection-badge-renderer`, `ytm-subscribe-button-renderer`
- Channel ID/handle carriers seen: `href="/@lilnasxvevo3004"`

### 11. ======= MIX CARD on WATCH PAGE (lines 2054-2156)

- Tag count: **14**
- Tags: `a`, `button`, `c3-icon`, `div`, `h4`, `img`, `path`, `span`, `svg`, `yt-collections-stack`, `ytm-compact-radio-renderer`, `ytm-compact-thumbnail`, `ytm-menu`, `ytm-menu-renderer`
- Channel ID/handle carriers seen: none detected in this section sample.

### 12. ======= HOME PAGE shorts video (lines 2157-2233)

- Tag count: **11**
- Tags: `a`, `button`, `c3-icon`, `div`, `h3`, `img`, `path`, `span`, `svg`, `yt-touch-feedback-shape`, `ytm-shorts-lockup-view-model`
- Channel ID/handle carriers seen: none detected in this section sample.

### 13. ======= Post channel card on home page (lines 2234-2491)

- Tag count: **21**
- Tags: `a`, `button`, `c3-icon`, `div`, `img`, `path`, `span`, `svg`, `truncated-text`, `truncated-text-content`, `yt-comment-action-buttons-renderer`, `yt-post-header`, `yt-touch-feedback-shape`, `ytm-backstage-image-renderer`, `ytm-backstage-post-renderer`, `ytm-backstage-post-thread-renderer`, `ytm-bottom-sheet-renderer`, `ytm-button-renderer`, `ytm-profile-icon`, `ytm-rich-section-renderer`, `ytm-toggle-button-renderer`
- Channel ID/handle carriers seen: `href="/@MajorAlex"`

### 14. ======= POLL on Home page (lines 2492-2833)

- Tag count: **21**
- Tags: `a`, `button`, `c3-icon`, `div`, `img`, `path`, `span`, `svg`, `truncated-text`, `truncated-text-content`, `yt-comment-action-buttons-renderer`, `yt-poll-renderer`, `yt-post-header`, `yt-touch-feedback-shape`, `ytm-backstage-post-renderer`, `ytm-backstage-post-thread-renderer`, `ytm-bottom-sheet-renderer`, `ytm-button-renderer`, `ytm-profile-icon`, `ytm-rich-section-renderer`, `ytm-toggle-button-renderer`
- Channel ID/handle carriers seen: `href="/@aimmediahouse"`

### 15. ======= PLAY LIST on home page (lines 2834-3044)

- Tag count: **21**
- Tags: `a`, `badge-shape`, `button`, `button-view-model`, `c3-icon`, `div`, `h3`, `img`, `path`, `span`, `svg`, `yt-collection-thumbnail-view-model`, `yt-collections-stack`, `yt-content-metadata-view-model`, `yt-lockup-metadata-view-model`, `yt-lockup-view-model`, `yt-thumbnail-badge-view-model`, `yt-thumbnail-overlay-badge-view-model`, `yt-thumbnail-view-model`, `yt-touch-feedback-shape`, `ytm-rich-item-renderer`
- Channel ID/handle carriers seen: `href="/@KillTony"`

### 16. ======== Video card on home page (lines 3045-3195)

- Tag count: **21**
- Tags: `a`, `badge-shape`, `button`, `c3-icon`, `div`, `h3`, `img`, `path`, `span`, `svg`, `ytm-badge-and-byline-renderer`, `ytm-channel-thumbnail-with-link-renderer`, `ytm-media-item`, `ytm-menu`, `ytm-menu-renderer`, `ytm-profile-icon`, `ytm-rich-item-renderer`, `ytm-thumbnail-cover`, `ytm-thumbnail-overlay-resume-playback-renderer`, `ytm-thumbnail-overlay-time-status-renderer`, `ytm-video-with-context-renderer`
- Channel ID/handle carriers seen: `href="/channel/UCtxdfwb9wfkoGocVUAJ-Bmg"`

### 17. ======= Mix card on home page (lines 3196-3318)

- Tag count: **17**
- Tags: `a`, `button`, `c3-icon`, `div`, `h3`, `img`, `path`, `span`, `svg`, `yt-collections-stack`, `ytm-badge-and-byline-renderer`, `ytm-media-item`, `ytm-menu`, `ytm-menu-renderer`, `ytm-radio-renderer`, `ytm-rich-item-renderer`, `ytm-thumbnail-cover`
- Channel ID/handle carriers seen: none detected in this section sample.

## JSON Sections

### 1. ======= for watch page ytInitialData from file watch HTML GET. DOC (lines 1-340)

- Renderer/view-model key count: **0**
- Keys: none extracted (this section is not renderer-key heavy in raw text).

### 2. ======= FOR watch page next?prettyPrint=False XHR JSON (lines 341-5831)

- Renderer/view-model key count: **16**
- Keys: `avatarViewModel`, `buttonRenderer`, `channelThumbnailWithLinkRenderer`, `continuationItemRenderer`, `listItemViewModel`, `listViewModel`, `menuNavigationItemRenderer`, `menuRenderer`, `menuServiceItemRenderer`, `metadataBadgeRenderer`, `notificationMultiActionRenderer`, `panelHeaderViewModel`, `sheetViewModel`, `thumbnailOverlayResumePlaybackRenderer`, `thumbnailOverlayTimeStatusRenderer`, `videoWithContextRenderer`

### 3. ======= XHR JSON for teh SEARCH PAGE search?prettyPrint=False (lines 5832-13219)

- Renderer/view-model key count: **19**
- Keys: `avatarViewModel`, `badgeViewModel`, `channelThumbnailWithLinkRenderer`, `continuationItemRenderer`, `gridShelfViewModel`, `itemSectionRenderer`, `listItemViewModel`, `listViewModel`, `menuNavigationItemRenderer`, `menuRenderer`, `menuServiceItemRenderer`, `metadataBadgeRenderer`, `mobileTopbarRenderer`, `reelPlayerOverlayRenderer`, `sheetViewModel`, `shortsLockupViewModel`, `thumbnailOverlayTimeStatusRenderer`, `topbarLogoRenderer`, `videoWithContextRenderer`

### 4. ======= Watch page next?prettyPrint=false (lines 13220-24258)

- Renderer/view-model key count: **18**
- Keys: `buttonRenderer`, `commentDialogRenderer`, `commentRenderer`, `commentRepliesRenderer`, `commentReplyDialogRenderer`, `commentSimpleboxRenderer`, `commentThreadRenderer`, `commentsHeaderRenderer`, `contentLoadingRenderer`, `continuationItemRenderer`, `createRenderer`, `engagementPanelSectionListRenderer`, `engagementPanelTitleHeaderRenderer`, `menuNavigationItemRenderer`, `menuRenderer`, `menuServiceItemRenderer`, `pinnedCommentBadgeRenderer`, `toggleMenuServiceItemRenderer`

### 5. ======= this is new seems to be see get_watch?prettyPrint=false (lines 24259-49780)

- Renderer/view-model key count: **117**
- Keys: `aboutThisAdRenderer`, `actionCompanionAdRenderer`, `adBadgeRenderer`, `adBadgeViewModel`, `adBreakServiceRenderer`, `adDurationRemainingRenderer`, `adHoverTextButtonRenderer`, `adInfoRenderer`, `adPlacementRenderer`, `adPreviewRenderer`, `adSlotRenderer`, `autoplaySwitchButtonRenderer`, `avatarViewModel`, `belowPlayerAdLayoutRenderer`, `buttonRenderer`, `buttonViewModel`, `carouselItemViewModel`, `carouselTitleViewModel`, `channelThumbnailWithLinkRenderer`, `chatInputViewModel`, `chatLoadingViewModel`, `chatUserTurnViewModel`, `chipCloudChipRenderer`, `chipCloudRenderer`, `cinematicContainerRenderer`, `commentTeaserCarouselItemViewModel`, `commentsEntryPointTeaserViewModel`, `compactInfocardRenderer`, `compactRadioRenderer`, `companionSlotRenderer`, `confirmDialogRenderer`, `contentLoadingRenderer`, `continuationItemRenderer`, `decoratedPlayerBarRenderer`, `defaultButtonViewModel`, `dislikeButtonViewModel`, `endScreenVideoRenderer`, `engagementPanelSectionListRenderer`, `engagementPanelTitleHeaderRenderer`, `expandableVideoDescriptionBodyRenderer`, `factoidRenderer`, `fullscreenEngagementActionBarRenderer`, `fullscreenEngagementActionBarSaveButtonRenderer`, `fullscreenEngagementOverlayRenderer`, `fullscreenRelatedVideosEntryPointViewModel`, `heatMarkerRenderer`, `heatmapRenderer`, `horizontalCardListRenderer`, `inPlayerAdLayoutRenderer`, `inputComposerViewModel`, `instreamAdPlayerOverlayRenderer`, `instreamVideoAdRenderer`, `itemSectionRenderer`, `likeButtonRenderer`, `likeButtonViewModel`, `listItemViewModel`, `listViewModel`, `lottieAnimationViewModel`, `mediaLockupRenderer`, `menuNavigationItemRenderer`, `menuRenderer`, `menuServiceItemRenderer`, `metadataBadgeRenderer`, `microformatDataRenderer`, `mobileTopbarRenderer`, `multiMarkersPlayerBarRenderer`, `notificationMultiActionRenderer`, `notificationTextRenderer`, `panelHeaderViewModel`, `pinnedCommentBadgeRenderer`, `playerBytesAdLayoutRenderer`, `playerCaptionsTracklistRenderer`, `playerLegacyDesktopWatchAdsRenderer`, `playerMicroformatRenderer`, `playerOverlayAutoplayRenderer`, `playerOverlayRenderer`, `playerOverlayVideoDetailsRenderer`, `playerStoryboardSpecRenderer`, `quickActionsViewModel`, `reelPlayerOverlayRenderer`, `reelShelfRenderer`, `richListHeaderRenderer`, `segmentedLikeDislikeButtonViewModel`, `sentimentFactoidRenderer`, `sheetViewModel`, `shortsLockupViewModel`, `skipOrPreviewRenderer`, `slimMetadataButtonRenderer`, `slimMetadataToggleButtonRenderer`, `slimOwnerRenderer`, `slimVideoActionBarRenderer`, `slimVideoInformationRenderer`, `slimVideoMetadataSectionRenderer`, `standaloneCollectionBadgeRenderer`, `structuredDescriptionContentRenderer`, `structuredDescriptionVideoLockupRenderer`, `subscribeButtonRenderer`, `textCarouselItemViewModel`, `textFieldViewModel`, `thumbnailOverlayBottomPanelRenderer`, `timedMarkerDecorationRenderer`, `toggleButtonViewModel`, `toggleMenuServiceItemRenderer`, `toggledButtonViewModel`, `topbarLogoRenderer`, `videoAttributeViewModel`, `videoDescriptionHeaderRenderer`, `videoDescriptionInfocardsSectionRenderer`, `videoDescriptionYouchatSectionViewModel`, `videoMetadataCarouselViewModel`, `videoWithContextRenderer`, `visitAdvertiserRenderer`, `watchNextEndScreenRenderer`, `youChatItemViewModel`

## Compare to `youtube_renderer_inventory.md`

### Overlap (21)

- `avatarViewModel`
- `buttonViewModel`
- `chipCloudChipRenderer`
- `chipCloudRenderer`
- `commentRenderer`
- `commentThreadRenderer`
- `commentsHeaderRenderer`
- `compactRadioRenderer`
- `continuationItemRenderer`
- `horizontalCardListRenderer`
- `itemSectionRenderer`
- `listItemViewModel`
- `listViewModel`
- `menuRenderer`
- `metadataBadgeRenderer`
- `relatedChipCloudRenderer`
- `sectionListRenderer`
- `shortsLockupViewModel`
- `thumbnailOverlayResumePlaybackRenderer`
- `thumbnailOverlayTimeStatusRenderer`
- `toggleButtonRenderer`

### YouTube Mobile JSON Keys Missing in Inventory (108)

- `aboutThisAdRenderer`
- `actionCompanionAdRenderer`
- `adBadgeRenderer`
- `adBadgeViewModel`
- `adBreakServiceRenderer`
- `adDurationRemainingRenderer`
- `adHoverTextButtonRenderer`
- `adInfoRenderer`
- `adPlacementRenderer`
- `adPreviewRenderer`
- `adSlotRenderer`
- `autoplaySwitchButtonRenderer`
- `badgeViewModel`
- `belowPlayerAdLayoutRenderer`
- `buttonRenderer`
- `carouselItemViewModel`
- `carouselTitleViewModel`
- `channelThumbnailWithLinkRenderer`
- `chatInputViewModel`
- `chatLoadingViewModel`
- `chatUserTurnViewModel`
- `cinematicContainerRenderer`
- `commentDialogRenderer`
- `commentRepliesRenderer`
- `commentReplyDialogRenderer`
- `commentSimpleboxRenderer`
- `commentTeaserCarouselItemViewModel`
- `commentsEntryPointTeaserViewModel`
- `compactInfocardRenderer`
- `companionSlotRenderer`
- `confirmDialogRenderer`
- `contentLoadingRenderer`
- `createRenderer`
- `decoratedPlayerBarRenderer`
- `defaultButtonViewModel`
- `dislikeButtonViewModel`
- `endScreenVideoRenderer`
- `engagementPanelSectionListRenderer`
- `engagementPanelTitleHeaderRenderer`
- `expandableVideoDescriptionBodyRenderer`
- `factoidRenderer`
- `fullscreenEngagementActionBarRenderer`
- `fullscreenEngagementActionBarSaveButtonRenderer`
- `fullscreenEngagementOverlayRenderer`
- `fullscreenRelatedVideosEntryPointViewModel`
- `gridShelfViewModel`
- `heatMarkerRenderer`
- `heatmapRenderer`
- `inPlayerAdLayoutRenderer`
- `inputComposerViewModel`
- `instreamAdPlayerOverlayRenderer`
- `instreamVideoAdRenderer`
- `likeButtonRenderer`
- `likeButtonViewModel`
- `lottieAnimationViewModel`
- `mediaLockupRenderer`
- `menuNavigationItemRenderer`
- `menuServiceItemRenderer`
- `microformatDataRenderer`
- `mobileTopbarRenderer`
- `multiMarkersPlayerBarRenderer`
- `notificationMultiActionRenderer`
- `notificationTextRenderer`
- `panelHeaderViewModel`
- `pinnedCommentBadgeRenderer`
- `playerBytesAdLayoutRenderer`
- `playerCaptionsTracklistRenderer`
- `playerLegacyDesktopWatchAdsRenderer`
- `playerMicroformatRenderer`
- `playerOverlayAutoplayRenderer`
- `playerOverlayRenderer`
- `playerOverlayVideoDetailsRenderer`
- `playerStoryboardSpecRenderer`
- `quickActionsViewModel`
- `reelPlayerOverlayRenderer`
- `reelShelfRenderer`
- `richListHeaderRenderer`
- `segmentedLikeDislikeButtonViewModel`
- `sentimentFactoidRenderer`
- `sheetViewModel`
- `shortsLockupViewModel`
- `skipOrPreviewRenderer`
- `slimMetadataButtonRenderer`
- `slimMetadataToggleButtonRenderer`
- `slimOwnerRenderer`
- `slimVideoActionBarRenderer`
- `slimVideoInformationRenderer`
- `slimVideoMetadataSectionRenderer`
- `standaloneCollectionBadgeRenderer`
- `structuredDescriptionContentRenderer`
- `structuredDescriptionVideoLockupRenderer`
- `subscribeButtonRenderer`
- `textCarouselItemViewModel`
- `textFieldViewModel`
- `thumbnailOverlayBottomPanelRenderer`
- `timedMarkerDecorationRenderer`
- `toggleButtonViewModel`
- `toggleMenuServiceItemRenderer`
- `toggledButtonViewModel`
- `topbarLogoRenderer`
- `videoAttributeViewModel`
- `videoDescriptionHeaderRenderer`
- `videoDescriptionInfocardsSectionRenderer`
- `videoDescriptionYouchatSectionViewModel`
- `videoMetadataCarouselViewModel`
- `videoWithContextRenderer`,
- `visitAdvertiserRenderer`
- `watchNextEndScreenRenderer`
- `youChatItemViewModel`

### Inventory Keys Not Seen in This YouTube Mobile Sample (62)

- `avatarStackViewModel`
- `backstageImageRenderer`
- `backstagePollRenderer`
- `backstagePostRenderer`
- `backstagePostThreadRenderer`
- `backstageQuizRenderer`
- `buttonBannerViewModel`
- `callToActionButtonRenderer`
- `channelAboutMetadataRenderer`
- `channelFeaturedContentRenderer`
- `channelMetadataRenderer`
- `channelRenderer`
- `channelSubMenuRenderer`
- `channelVideoPlayerRenderer`
- `collectionThumbnailViewModel`
- `commentVideoThumbnailHeaderRenderer`
- `compactAutoplayRenderer`
- `compactVideoRenderer`
- `contentMetadataViewModel`
- `decoratedAvatarViewModel`
- `dialogViewModel`
- `expandableMetadataRenderer`
- `extractFromAvatarStackViewModel`
- `gridRenderer`
- `gridVideoRenderer`
- `guideEntryRenderer`
- `horizontalListRenderer`
- `lockupViewModel`
- `multiPageMenuRenderer`
- `notificationRenderer`
- `playlistPanelRenderer`
- `playlistPanelVideoRenderer`
- `playlistRenderer`
- `playlistVideoRenderer`
- `podcastRenderer`
- `radioRenderer`
- `reelItemRenderer`
- `richGridRenderer`
- `richItemRenderer`
- `richSectionRenderer`
- `richShelfRenderer`
- `searchRefinementCardRenderer`
- `secondarySearchContainerRenderer`
- `shelfRenderer`
- `sortFilterSubMenuRenderer`
- `subscriptionNotificationToggleButtonRenderer`
- `thumbnailBadgeViewModel`
- `thumbnailOverlayNowPlayingRenderer`
- `thumbnailOverlayPlaybackStatusRenderer`
- `ticketShelfRenderer`
- `titleAndButtonListHeaderRenderer`
- `twoColumnBrowseResultsRenderer`
- `universalWatchCardRenderer`
- `videoPrimaryInfoRenderer`
- `videoRenderer`
- `videoSecondaryInfoRenderer`
- `watchCardCompactVideoRenderer`
- `watchCardHeroVideoRenderer`
- `watchCardRHPanelRenderer`
- `watchCardRHPanelVideoRenderer`
- `watchCardRichHeaderRenderer`
- `watchCardSectionSequenceRenderer`

## 3.2.8 (2026-02-09) — YouTube Mobile quick-block and 3-dot expansion

### Added
- Cross-hover quick block now covers additional YouTube Mobile renderers: `ytm-universal-watch-card-renderer`, `ytm-watch-card-hero-video-renderer`, `ytm-watch-card-rich-header-renderer`, and playlist rows (`ytm-playlist-panel-video-renderer`/`ytm-playlist-panel-video-wrapper-renderer`).
- 3-dot menu detection/injection now supports `ytm-bottom-sheet-renderer` and broader YouTube Mobile dropdown containers; visibility observer watches `class`/`open`/`opened` attributes.
- Optimistic hide logic for YouTube Mobile channel posts (`ytm-backstage-post*`, `ytm-rich-section-renderer`) when a block occurs; container is hidden immediately.
- Playlist panel navigation on YouTube Mobile: attempts to open the playlist panel and click the next visible row when autoplay would hit a hidden item.
- Guarded videoId stamps on YouTube Mobile recycled renderer tags to prevent cross-contamination.

### Known limitations
- YouTube Mobile channel posts may still miss consistent identity extraction; optimistic hide is applied but full blocking reliability remains a TODO.
- Some YouTube Mobile playlist/watch surfaces may need a refresh to see the block if identity wasn’t learned at first sight.

---

## High-Impact Gaps for FilterTube Mobile

- `ytm-comment-renderer` extraction must read handle/ID from `a.YtmCommentRendererIconContainer` and `.YtmCommentRendererTitle`.
- Shorts 3-dot click capture must include `.shortsLockupViewModelHostInlineMetadataMenu button` in addition to outside metadata menu.
- Bottom-sheet menu detection must prefer `yt-list-view-model` path and avoid legacy injection path for shorts sheets.
- Playlist panel rows (`ytm-playlist-panel-video-renderer`) often miss direct channel links; they require watch/ytInitialData/main-world fallback keyed by `videoId`.
- Post-block enrichment must retry incomplete UC entries (missing handle/customUrl/logo) on updates, not only first insert.
- Keep optimistic hidden state for pending shorts/comment blocks until confirmed identity is persisted to avoid hide/show flash.

## YouTube Mobile Mobile Menu DOM Structures (Critical for Injection)

### Menu Type 1: Legacy (Videos, Mixes, Posts)

Used by: `ytm-video-with-context-renderer`, `ytm-radio-renderer`, `ytm-backstage-post-renderer`

**Container**: `.bottom-sheet-media-menu-item`
**Item structure**: `ytm-menu-service-item-renderer` or `ytm-menu-navigation-item-renderer`

```html
<bottom-sheet-container>
  └── <div class="bottom-sheet-media-menu-item">
      ├── <ytm-menu-service-item-renderer>
      │   └── <ytm-menu-item>
      │       └── <button class="menu-item-button">
      │           ├── <c3-icon>...</c3-icon>
      │           └── <span class="yt-core-attributed-string">Save to library</span>
      ├── <ytm-menu-navigation-item-renderer>... (Share) ...</ytm-menu-navigation-item-renderer>
      └── <ytm-menu-service-item-renderer>... (Not interested) ...</ytm-menu-service-item-renderer>
</bottom-sheet-container>
```

### Menu Type 2: List View (Shorts)

Used by: `ytm-shorts-lockup-view-model` (Shorts shelf items)

**Container**: `yt-list-view-model` (role="listbox")
**Item structure**: `yt-list-item-view-model` (role="menuitem")

```html
<bottom-sheet-container>
  └── <yt-sheet-view-model>
      └── <yt-list-view-model role="listbox">
          ├── <yt-list-item-view-model role="menuitem">
          │   └── <div class="yt-list-item-view-model__container">
          │       ├── <c3-icon class="yt-list-item-view-model__accessory">...</c3-icon>
          │       └── <button class="yt-list-item-view-model__button-or-anchor">
          │           └── <span class="yt-list-item-view-model__title">Not interested</span>
          └── <yt-list-item-view-model>... (Send feedback) ...</yt-list-item-view-model>
</bottom-sheet-container>
```

### Menu Detection Strategy

1. Check for `.bottom-sheet-media-menu-item` first → use legacy structure
2. If not found, check for `yt-list-view-model` → use listview structure
3. Create menu item with matching DOM structure for seamless integration
