# Channel Identity Waterfall Spec (Execution-Ready)

**Date**: 2026-02-28
**Target surfaces**: YT Mobile (`ytm`), YT Desktop (`ytd`), YT Kids (`ytk`), Shorts, playlist/watch contexts
**Authoring intent**: Block decisions must always be based on deterministic channel IDs from JSON payloads first, then validated by DOM/video-id cache; avoid text-only guessing.

## 1) Source files reviewed

- `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`
- `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json`
- `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json`
- `YT_MAIN_NEXT.json`
- `YT_MAIN_NEXT_RESPONSE_COMMENT.json`
- `YT_MAIN.json`
- `YTM-XHR.json`
- `YTM.json`
- `playlist.json`
- `watchpage.json`
- `playlist.html`
- `playlist.js`
- `collab.json`
- `collab.html`
- `collab_on_homepage.html`
- `collab_in_playlist_mix.html`
- `reel_item_watch?prettyPrint=False.JSON`
- `YT_KIDS.json`
- `yt_kids_latest.json`
- `YTM-DOM.html`
- `YTM-WATCH PLAYER.html`
- `YT_MAIN_WATCH.html`
- `text.txt`

Also reviewed code in:
- `js/content_bridge.js`
- `js/background.js`
- `js/injector.js`

### 1.1 Canonical source intent

- `YTM-XHR.json`, `YTM.json`, `YTM-KIDS`-style JSON files are the main content JSON layer (card renderers).
- `YT_MAIN*` JSON and `watchpage`/`...WATCH...` HTML are continuation and page bootstrap layers.
- `reel_item_watch` is an active-short playback-only layer.
- `playlist*` and `collab*` files are validation fixtures for owner vs seed and collaborator coverage.

### 1.2 Fixture-to-extractor matrix

- `YTM-XHR.json`, `YTM.json`
  - `videoWithContextRenderer`, `compactPlaylistRenderer`, `playlistPanelVideoRenderer`, `shortsLockupViewModel`
  - `videoWithContextRenderer.videoId` + `shortBylineText/longBylineText.navigationEndpoint.browseEndpoint.browseId`
  - `compactPlaylistRenderer.playlistId` + byline `browseEndpoint.browseId`
- `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json`
  - continuation shelves and mixed video/short mixes
  - same keys as YTM JSON, but often with shifted wrapper nesting
- `YT_MAIN_NEXT.json`, `YT_MAIN_NEXT_RESPONSE_COMMENT.json`
  - renderer variant that must be normalized recursively
  - same identity extraction keys, different envelope shape
- `playlist.json`
  - canonical playlist owner source for hard missing-creator cases
  - requires `playlistId` to apply
- `reel_item_watch?prettyPrint=False.JSON`
  - active short playback source only (guarded by current short playing path)
- `watchpage.json`, `YT_MAIN.json`, `YT_MAIN_WATCH.html`, `YTM-DOM.html`, `YTM-WATCH PLAYER.html`
  - bootstrap/DOM validation only for slot + video/playback consistency
- `playlist*.html`, `collab*.html`, `collab.json`
  - DOM/fixture harness confirming collab/pairing behavior and menu rendering, not primary proof source.

---

## 2) Exhaustive JSON Path Reference (Property-by-Property)

This section provides the absolute path for every identity attribute across all known YouTube JSON structures.

### 2.1 `videoWithContextRenderer` (Standard Feed Video)
*Found in: `YTM-XHR.json`, `YTM.json`, `YT_MAIN_WATCH.html`*

- **Video ID**: `.videoId`
- **Primary Channel ID**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Primary Channel Name**: `.shortBylineText.runs[0].text`
- **Primary Channel Handle**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl`
- **Primary Channel Logo**: `.channelThumbnail.channelThumbnailWithLinkRenderer.thumbnail.thumbnails[0].url`
- **Collaborator Count Hint**: `.shortBylineText.runs[0].text` (regex for "and N more")
- **Collaborator Sheet Trigger**: `.shortBylineText.runs[0].navigationEndpoint.showSheetCommand` (See 2.10 for roster paths)

### 2.2 `lockupViewModel` (Modern High-Nesting Video)
*Found in: `YT_MAIN_NEXT.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`*

- **Video ID**: `.contentId`
- **Watch videoId**: `.rendererContext.commandContext.onTap.innertubeCommand.watchEndpoint.videoId`
- **Primary Channel ID**: `.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Primary Channel Name**: `.metadata.lockupMetadataViewModel.title.content`
- **Primary Channel Handle**: `.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Primary Channel Logo**: `.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources[0].url`

### 2.3 `compactVideoRenderer` (Sidebars & Kids)
*Found in: `YT_KIDS.json`, `yt_kids_latest.json`, `YTM-XHR.json`*

- **Video ID**: `.videoId`
- **Channel ID**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Channel Name**: `.shortBylineText.runs[0].text`
- **Channel Handle**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl`
- **Channel Logo**: `.channelThumbnail.thumbnails[0].url`
- **Kids-Only External Channel ID**: `.kidsVideoOwnerExtension.externalChannelId`

### 2.4 `compactPlaylistRenderer` (Standalone Playlist Cards)
*Found in: `YTM.json`, `playlist.json`*

- **Playlist ID**: `.playlistId`
- **Creator Channel ID**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Creator Name**: `.shortBylineText.runs[0].text`
- **Creator Handle**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl`
- **Thumbnail (Playlist)**: `.thumbnail.thumbnails[0].url`

### 2.5 `playlistPanelVideoRenderer` (Playlist Row / Queue)
*Found in: `playlist.html`, `collab_in_playlist_mix.html`*

- **Video ID**: `.videoId`
- **Channel ID**: `.longBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Channel Name**: `.longBylineText.runs[0].text`
- **Channel Handle**: `.longBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl`
- **Menu Sheet Command (Collaborators)**: `.menuButton.buttonViewModel.onTap.innertubeCommand.showSheetCommand` (See 2.10)

### 2.6 `shortsLockupViewModel` (Shorts in Feed)
*Found in: `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`*

- **Video ID**: `.onTap.innertubeCommand.reelWatchEndpoint.videoId`
- **Primary Channel ID**: `.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Primary Channel Name**: `.metadata.lockupMetadataViewModel.title.content`
- **Channel Handle**: `.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`

### 2.7 `reelItemRenderer` (Shorts in Shelf)
*Found in: `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`*

- **Video ID**: `.videoId`
- **Reel Watch Command (Channel Access)**: `.navigationEndpoint.reelWatchEndpoint`
- **Channel ID**: `.navigationEndpoint.reelWatchEndpoint.overlay.reelPlayerOverlayRenderer.reelChannelBarViewModel.channelTitle.onTap.innertubeCommand.browseEndpoint.browseId`

### 2.8 `reelPlayerOverlayRenderer` (Shorts Playback Context)
*Found in: `reel_item_watch?prettyPrint=False.JSON`*

- **Video ID**: Inherited from active reel.
- **Channel ID**: `.reelChannelBarViewModel.channelTitle.onTap.innertubeCommand.browseEndpoint.browseId`
- **Channel Name**: `.reelChannelBarViewModel.channelTitle.content`
- **Channel Handle**: `.reelChannelBarViewModel.channelTitle.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Channel Logo**: `.reelChannelBarViewModel.avatar.avatarViewModel.image.sources[0].url`

### 2.9 `compactRadioRenderer` (MIX / Radio Collection)
*Found in: `YTM-XHR.json`*

- **Playlist ID**: `.playlistId`
- **Collection Name**: `.title.simpleText`
- **Byline Info**: `.shortBylineText.simpleText` (e.g. "YouTube Mix")
- **Rule**: No individual channel ID; block is keyed to `playlistId`.

### 2.10 `listItemViewModel` (Collaborator Roster - DEEP SHEET)
*Accessed via any `showSheetCommand` found in bylines or menus*

- **Roster Root**: `.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[]`
- **For each item**:
  - **Channel ID**: `.listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
  - **Channel Name**: `.listItemViewModel.title.content`
  - **Channel Handle (Path A)**: `.listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
  - **Channel Handle (Path B)**: `.listItemViewModel.subtitle.content` (Extract prefix @)
  - **Channel Logo**: `.listItemViewModel.leadingAccessory.avatarViewModel.image.sources[0].url`
  - **Subscriber Count**: `.listItemViewModel.subtitle.content` (Regex for "N subscribers")

### 2.10.1 `get_watch?prettyPrint=false` collaborator path variants

- The same roster is not always under `sheetViewModel`; in many watch responses the effective path is:
  - `videoSecondaryInfoRenderer.owner.videoOwnerRenderer.navigationEndpoint.showDialogCommand.panelLoadingStrategy.inlineContent.dialogViewModel.customContent.listViewModel.listItems[]`
  - or `...showSheetCommand.panelLoadingStrategy.inlineContent.dialogViewModel.content.listViewModel.listItems[]`
  - or `...showDialogCommand.panelLoadingStrategy.inlineContent.dialogViewModel.customContent.listViewModel.listItems[]`
- Observed shape limits:
  - Some watch payload variants include names in `attributedTitle` only (`"... and 2 more"`) and do not include per-collaborator ids in the same byline path.
  - Some responses include handle/ID only for one collaborator entry while the roster remains partial.
  - Rely on this path only when it is explicitly a collaborator roster context; do not convert aggregate text to blocking target names.

### 2.11 `commentEntityPayload` (Comment Context)
*Found in: `YT_MAIN_NEXT_RESPONSE_COMMENT.json`*

- **Author Channel ID**: `.properties.author.channelId`
- **Author Display Name**: `.properties.author.displayName`
- **Author Handle**: `.properties.author.displayName` (prefix @)
- **Author Logo**: `.properties.author.profileImageUrl`
- **Endpoint ID**: `.properties.channelPageEndpoint.innertubeCommand.browseEndpoint.browseId`

### 2.12 Root Global Snapshots
*Found in: `ytInitialData`, `ytInitialPlayerResponse`*

- **Current Video ID**: `ytInitialPlayerResponse.videoDetails.videoId`
- **Current Video Uploader ID**: `ytInitialPlayerResponse.videoDetails.channelId`
- **Current Video Author Name**: `ytInitialPlayerResponse.videoDetails.author`
- **Current Video Short Description**: `ytInitialPlayerResponse.videoDetails.shortDescription`
- **Current Playlist Owner ID**: `ytInitialData.contents.twoColumnWatchNextResults.playlist.playlist.ownerName.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Current Playlist Owner Name**: `ytInitialData.contents.twoColumnWatchNextResults.playlist.playlist.ownerName.runs[0].text`

---

## 3) Canonical identity shape (every stamped row)

```ts
type ChannelIdentityRow = {
  videoId?: string;
  playlistId?: string;
  id?: string;              // UC ID preferred
  handle?: string;           // @handle when available
  customUrl?: string;        // c/user path when available
  name?: string;
  logo?: string;
  source?: string;
  fetchStrategy?: 'video' | 'playlist' | 'shorts' | 'collab' | 'mainworld';
  confidence?: 'json-primary' | 'json-secondary' | 'dom' | 'mainworld';
  allCollaborators?: Array<{ id?: string; handle?: string; customUrl?: string; name?: string }>;
};
```

Block only when `id` can be finalized to a UC ID or we have a deterministic identity path that can be resolved to one.

For `get_watch` flows with partial payloads:

- Prefer `id` from `videoDetails.channelId` / resolved owner endpoint first.
- Fall back to deterministic `expectedChannelName` / `source` derived from `videoSecondaryInfoRenderer`/`playerMicroformat`.
- Then use DOM-confirmed text only if it is not collapsed-byline (`A, B and more`, `and N more`, comma-heavy byline).
- Only use handle fallback after richer fields are absent.
- Keep strict safety for label/id stamping:
  - `data-filtertube-channel-id` only when it matches `^UC[a-zA-Z0-9_-]{22}$`.
  - `Block Channel` should remain the final fallback when no safe non-empty name exists.

---


## 3) Deep-Dive: Absolute Root-to-Leaf Path Traces

This section provides the full, unbroken key paths starting from the response root for every critical detail.

### 3.1 The "Collaborators" Roster (Continuation Context)
*File: `YTM-XHR.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`*

- **Header Check**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.header.panelHeaderViewModel.title.content` -> Value: `"Collaborators"`

**Collaborator 1 (shakiraVEVO)**
- **ID**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` -> Value: `"UCYLNGLIzMhRTi6ZOLjAPSmw"`
- **Name**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.title.content` -> Value: `"shakiraVEVO"`
- **Handle**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl` -> Value: `"/@shakiraVEVO"`
- **Sub-Count**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.subtitle.content` -> Value: `"‎⁨@shakiraVEVO⁩ • ⁨4.98 crore subscribers⁩"`
- **Logo**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.leadingAccessory.avatarViewModel.image.sources[0].url` -> Value: `"https://yt3.ggpht.com/aFFxy2m2TB9dOJJEduJKEyAYsr79uE3ypQZLg-Jbc4TXlxsfCFoe7Ly3E3ou5sTPbglNiTyiKw=s88-c-k-c0x00ffffff-no-rj"`

**Collaborator 2 (Spotify)**
- **ID**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` -> Value: `"UCRMqQWxCWE0VMvtUElm-rEA"`
- **Name**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.title.content` -> Value: `"Spotify"`
- **Sub-Count**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.subtitle.content` -> Value: `"‎⁨@Spotify⁩ • ⁨22.4 lakh subscribers⁩"`
- **Logo**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.leadingAccessory.avatarViewModel.image.sources[0].url` -> Value: `"https://yt3.ggpht.com/UMGZZMPQkM3kGtyW4jNE1GtpSrydfNJdbG1UyWTp5zeqUYc6-rton70Imm7B11RulRRuK521NQ=s88-c-k-c0x00ffffff-no-rj"`

**Collaborator 3 (Beéle)**
- **ID**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[2].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` -> Value: `"UCYAQgXVSRzUeNo34-RJOWUw"`
- **Name**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[2].listItemViewModel.title.content` -> Value: `"Beéle"`
- **Sub-Count**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[2].listItemViewModel.subtitle.content` -> Value: `"‎⁨@beele⁩ • ⁨23.7 lakh subscribers⁩"`
- **Logo**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[2].listItemViewModel.leadingAccessory.avatarViewModel.image.sources[0].url` -> Value: `"https://yt3.ggpht.com/DHj3Q-q2Qlz95Iqb5CwlZlNxPrjDgZUrAsdALuwh3jXI0TKRmvAnVPEnI8psTRHh584XP36h=s88-c-k-c0x00ffffff-no-rj"`

### 3.2 Primary Identity in Modern Lockup (Continuation Context)
*File: `YT_MAIN_NEXT.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`*

- **Video ID (Content)**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].lockupViewModel.contentId` -> Value: `"rI2gQ7K4F8g"`
- **Video ID (Action)**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].lockupViewModel.rendererContext.commandContext.onTap.innertubeCommand.watchEndpoint.videoId` -> Value: `"rI2gQ7K4F8g"`
- **Channel ID**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].lockupViewModel.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` -> Value: `"UC..."`
- **Channel Handle**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].lockupViewModel.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl` -> Value: `"/@Handle"`
- **Channel Name**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].lockupViewModel.metadata.lockupMetadataViewModel.title.content` -> Value: `"Author Name"`

### 3.3 Shorts Playback Identity (Real-time Context)
*File: `reel_item_watch?prettyPrint=False.JSON`*

- **Channel ID**: `overlay.reelPlayerOverlayRenderer.reelChannelBarViewModel.channelTitle.onTap.innertubeCommand.browseEndpoint.browseId` -> Value: `"UC..."`
- **Channel Name**: `overlay.reelPlayerOverlayRenderer.reelChannelBarViewModel.channelTitle.content` -> Value: `"Channel Name"`
- **Channel Handle**: `overlay.reelPlayerOverlayRenderer.reelChannelBarViewModel.channelTitle.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl` -> Value: `"/@Handle"`
- **Channel Logo**: `overlay.reelPlayerOverlayRenderer.reelChannelBarViewModel.avatar.avatarViewModel.image.sources[0].url` -> Value: `"https://yt3.ggpht.com/..."`

### 3.4 Playlist Ownership (Initial Data Context)
*File: `ytInitialData` (Watch Page)*

- **Playlist ID**: `contents.twoColumnWatchNextResults.playlist.playlist.playlistId` -> Value: `"PL..."`
- **Owner Channel ID**: `contents.twoColumnWatchNextResults.playlist.playlist.ownerName.runs[0].navigationEndpoint.browseEndpoint.browseId` -> Value: `"UC..."`
- **Owner Name**: `contents.twoColumnWatchNextResults.playlist.playlist.ownerName.runs[0].text` -> Value: `"Owner Name"`

### 3.5 YT Kids Identity (Standard Context)
*File: `YT_KIDS.json`*

- **Video ID**: `contents.kidsHomeScreenRenderer.anchors[0].anchoredSectionRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[i].compactVideoRenderer.videoId` -> Value: `"6m25h6hvEGw"`
- **External Channel ID**: `contents.kidsHomeScreenRenderer.anchors[0].anchoredSectionRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[i].compactVideoRenderer.kidsVideoOwnerExtension.externalChannelId` -> Value: `"UCRxdo0UD_OU2a2ACG7LZHtA"`
- **Channel ID (Fallback)**: `contents.kidsHomeScreenRenderer.anchors[0].anchoredSectionRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[i].compactVideoRenderer.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId` -> Value: `"UCRxdo0UD_OU2a2ACG7LZHtA"`

### 3.6 Comment Author Identity (Framework Update Context)
*File: `YT_MAIN_NEXT_RESPONSE_COMMENT.json`*

- **Author Channel ID**: `frameworkUpdates.entityBatchUpdate.mutations[i].payload.commentEntityPayload.properties.author.channelId` -> Value: `"UC..."`
- **Author Display Name**: `frameworkUpdates.entityBatchUpdate.mutations[i].payload.commentEntityPayload.properties.author.displayName` -> Value: `"@User"`
- **Author Profile Image**: `frameworkUpdates.entityBatchUpdate.mutations[i].payload.commentEntityPayload.properties.author.profileImageUrl` -> Value: `"https://yt3.ggpht.com/..."`

---

## Renderer-Specific Attribute Traces (Exhaustive)

This section maps every logical detail to its absolute JSON path for robust data extraction.

### 3.7 `videoWithContextRenderer` (The "Main Feed" Card)
*Reference: `YTM-XHR.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json`*

- **Video ID**: `.videoId`
- **Title Text**: `.headline.runs[0].text`
- **Length/Duration**: `.lengthText.runs[0].text` (e.g., `"3:37"`)
- **View Count Text**: `.shortViewCountText.runs[0].text` (e.g., `"4.6 crore views"`)
- **Published Time**: `.publishedTimeText.runs[0].text` (e.g., `"1 month ago"`)
- **Thumbnail URL**: `.thumbnail.thumbnails[0].url`
- **Channel Name**: `.shortBylineText.runs[0].text`
- **Channel ID**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Channel Handle**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl`
- **Channel Logo**: `.channelThumbnail.channelThumbnailWithLinkRenderer.thumbnail.thumbnails[0].url`
- **Collab Trigger**: `.shortBylineText.runs[0].navigationEndpoint.showSheetCommand` (Full roster extraction in 4.10)

### 3.8 `lockupViewModel` (The "Modern Web" Card)
*Reference: `YT_MAIN_NEXT.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`*

- **Content ID (Video ID)**: `.contentId`
- **Title Text**: `.metadata.lockupMetadataViewModel.title.content`
- **Channel Name**: `.metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[0].metadataParts[0].text.content`
- **Channel ID**: `.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Channel Handle**: `.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Channel Logo**: `.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources[0].url`
- **View Count/Date Metadata**: `.metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[1].metadataParts[0].text.content`

### 3.9 `compactVideoRenderer` (The "Sidebar / Kids" Card)
*Reference: `YT_KIDS.json`, `YTM-XHR.json`*

- **Video ID**: `.videoId`
- **Title Text**: `.title.runs[0].text`
- **Duration**: `.lengthText.runs[0].text`
- **Channel Name**: `.shortBylineText.runs[0].text`
- **Channel ID**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Kids External ID**: `.kidsVideoOwnerExtension.externalChannelId`
- **Channel Logo**: `.channelThumbnail.thumbnails[0].url`

### 3.10 `compactPlaylistRenderer` (The "Playlist Card")
*Reference: `YTM.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json`*

- **Playlist ID**: `.playlistId`
- **Title Text**: `.title.runs[0].text`
- **Video Count**: `.videoCountText.runs[0].text`
- **Creator Name**: `.shortBylineText.runs[0].text`
- **Creator Channel ID**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Creator Handle**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl`

### 3.11 `playlistPanelVideoRenderer` (The "Queue" Item)
*Reference: `playlist.html`, `collab_in_playlist_mix.html`*

- **Video ID**: `.videoId`
- **Title Text**: `.title.runs[0].text` (Note: sometimes found in `videoTitle` span in DOM)
- **Duration**: `.lengthText.runs[0].text`
- **Channel Name**: `.longBylineText.runs[0].text`
- **Channel ID**: `.longBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Collab Access**: `.menuButton.buttonViewModel.onTap.innertubeCommand.showSheetCommand` (Full roster extraction in 4.10)

### 3.12 `shortsLockupViewModel` (The "Shorts Feed" Card)
*Reference: `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`*

- **Video ID**: `.onTap.innertubeCommand.reelWatchEndpoint.videoId`
- **Title**: `.metadata.lockupMetadataViewModel.title.content`
- **Channel ID**: `.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Channel Name**: `.metadata.lockupMetadataViewModel.title.content` (Note: Often titles act as name in shorts)
- **Channel Handle**: `.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`

### 3.13 `reelPlayerOverlayRenderer` (The "Active Short" Context)
*Reference: `reel_item_watch?prettyPrint=False.JSON`*

- **Channel ID**: `.reelChannelBarViewModel.channelTitle.onTap.innertubeCommand.browseEndpoint.browseId`
- **Channel Name**: `.reelChannelBarViewModel.channelTitle.content`
- **Channel Handle**: `.reelChannelBarViewModel.channelTitle.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Channel Logo**: `.reelChannelBarViewModel.avatar.avatarViewModel.image.sources[0].url`
- **Like Count**: `.likeButton.likeButtonViewModel.likeCountText.content`

### 3.14 `compactRadioRenderer` (The "MIX / Radio" Card)
*Reference: `YTM-XHR.json`*

- **Playlist ID**: `.playlistId`
- **Title**: `.title.simpleText`
- **Metadata Label**: `.shortBylineText.simpleText` (e.g., `"YouTube Mix"`)

### 3.15 `ytInitialPlayerResponse` (The "Current Video" Proof)
*Reference: `playlist.json`, `watchpage.json`*

- **Video ID**: `.videoDetails.videoId`
- **Title**: `.videoDetails.title`
- **Channel ID**: `.videoDetails.channelId`
- **Author/Channel Name**: `.videoDetails.author`
- **Length Seconds**: `.videoDetails.lengthSeconds`
- **View Count**: `.videoDetails.viewCount`
- **Short Description**: `.videoDetails.shortDescription`
- **Channel Logo**: `.videoDetails.thumbnail.thumbnails[0].url`

### 3.16 `listItemViewModel` (Collaborator Roster - DEEP TRACE)
*Triggered by any `showSheetCommand` inside `appendContinuationItemsAction`*

- **Root**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[j].listItemViewModel`
- **Detail Extraction**:
  - **Collaborator ID**: `.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
  - **Collaborator Name**: `.title.content`
  - **Collaborator Handle**: `.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
  - **Collaborator Logo**: `.leadingAccessory.avatarViewModel.image.sources[0].url`
  - **Collaborator Sub-Count**: `.subtitle.content`

---

## 4) Canonical identity shape (every stamped row)

### 4.1 `YTM-XHR.json` and `YTM.json`
These hold mobile feed/watch-renderer payloads for card-level extraction.

- `videoWithContextRenderer`
  - `videoId` => primary video key
  - channel: `shortBylineText.runs[...].navigationEndpoint.browseEndpoint.browseId`
  - fallback channel: `channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId`

- `compactPlaylistRenderer`
  - `playlistId`
  - creator channel: `shortBylineText`/`longBylineText` runs -> `browseEndpoint.browseId`
  - this is the owner/creator channel for playlist cards.

- `playlistPanelVideoRenderer`
  - `videoId`
  - primary channel path from byline endpoint
  - collaborators can be present in nested showSheet/list payloads

- `shortsLockupViewModel`
  - `reelWatchEndpoint.videoId`
  - channel from byline command where present.

### 4.2 `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json` and `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json`
These include up-next/watch-page continuation fragments and often mixed short/video sections.

- Both contain mixed short blocks:
  - `shortsLockupViewModel`
  - `reelWatchEndpoint.videoId`
  - playlist/radio IDs and lockup metadata wrappers
- Same extraction logic as above should be used, but through recursive traversal because nesting depth changes across continuation chunks.
- Multiple matches by videoId are possible; choose the best-quality match, not the first.

### 4.3 `YT_MAIN_NEXT.json`
This is a continuation/response-shape variant different from the mobile feed renderer layout.

- Treat as valid secondary JSON source only.
- It can include `lockupViewModel`, `shorts` variants, and `playlistId` fields under different nesting.
- It should be traversed with renderer-agnostic recursion:
  - find `videoId` node,
  - pick nearest node with reliable channel endpoint (`browseEndpoint.browseId`) and channel avatar/byline paths.

### 4.4 `reel_item_watch?prettyPrint=False.JSON`
Shorts playback context payload.

- High-confidence but only for **currently playing short** context.
- Use it to resolve the active short channel quickly.
- Do **not** assume this is present for all short cards in a shelf/feed.

### 4.5 `text.txt`
Operational notes + debug traces.

- Confirms observed misses:
  - playlist card byline shows creator text but no usable UC ID,
  - short cards emit `videoId` only in first pass,
  - collab text-only extraction can collapse to one row while full roster exists in sheet/list payloads.

### 4.6 `playlist.json`

- Playlist API/fixture-level snapshot for creator validation.
- Primary fields:
  - `playlistId`
  - owner/channel metadata with `browseEndpoint.browseId` in owner/byline paths
- Use only as supplemental validation for playlist card stamping, especially when `compactPlaylistRenderer` identity is not yet finalized.

### 4.7 `watchpage.json`, `YT_MAIN_WATCH.html`, `YT_MAIN.json`, `YTM-WATCH PLAYER.html`

- Page bootstrap layer with embedded initial-state and active-walk context.
- Useful channel paths:
  - top-level watch owner blocks
  - `/watch?v=...` and `/playlist?list=...` query anchors
  - active owner/author DOM links and embedded JSON state
- Treat as secondary proof for card misses, not as first source for every shelf card.

### 4.8 `YT_MAIN_NEXT_RESPONSE_COMMENT.json` / comment fixtures

- Comment-response shape with author channel IDs:
  - `commentEntityPayload.author.channelId`
  - `comment*renderer.author.*.endpoint.browseEndpoint.browseId`
- Scope: comment cards and replies only; not playlist ownership by default.

### 4.9 `YT_KIDS.json`, `yt_kids_latest.json`

- Kids variant with same logical renderer content but altered wrapper keys.
- Maintain same channel-id precedence; ensure Kids-specific wrappers are traversed recursively.

### 4.10 `YTM-DOM.html`, `playlist.html`, `collab.html`, `collab_on_homepage.html`, `collab_in_playlist_mix.html`

- DOM validation fixtures to confirm:
  - where to inject `data-filtertube-*` attributes,
  - whether quick-menu button exists in a specific shell,
  - whether byline text and channel metadata are stable before/after hydration.

---

## 5) Card-specific contract

### Regular video cards
- Use `videoId + byline/thumbnail browseEndpoint.browseId`.
- `data-filtertube-channel-handle` from DOM is valid only after normalization; must be mapped to UC ID before block.

### Playlist cards (compact/watch playlist cards)
- **Rule:** always prefer playlist creator (owner) when `compactPlaylistRenderer` / ytm playlist card has byline or playlist metadata.
- `playlistId` MUST be preserved and forwarded in click context and background metadata.
- Seed-video inference is a **fallback-only** path.

### Mix / radio cards
- If no stable creator identity, do not guess from seed video uploader unless no alternative and card is explicitly non-playlist.
- Keep playlist flow path for algorithmic mix identifiers.

### Shorts cards
- First: shorts DOM + lockup byline endpoint.
- If missing channel endpoint: fallback by `shorts/<videoId>` -> `searchYtInitialDataForVideoChannel(videoId)`.
- Cache `videoId -> resolved UC ID` immediately to avoid repeated misses on recycled nodes.

### Collab cards
- Preserve full roster, not single flattened name.
- The maximum practical roster observed in fixtures/logs is 7 entries (1 uploader + up to 6 collaborators).
- Prefer sheet/list roster entries when present (`listItems` wrappers) over plain byline text.
- Stale/partial collaborator text must be merged and replaced by richer JSON data.

---

## 6) Confirmed gap list (what is still missing)

### Gap A — playlist card being blocked by wrong channel identity
Observed logs show quick-block click payload with `name='Voula Fra'`, `id=''`, then a mismatched resolved candidate could be attached later.

- Current root risk: playlist cards are sometimes carrying weak DOM identity while quick-block path can still fall back to non-owner/video-derived identity.
- Required rule: if card context is playlist (`fetchStrategy:'playlist'`, `source:'ytm_playlist_card'`, `playlistId` present), block list owner/channel path first and suppress seed-video-owner inference unless playlist creator truly missing.

### Gap B — shorts rows with only `videoId`
Observed logs show shorts extraction steps repeatedly emit `shorts/videoId` and channel lookup `null` in first pass.

- Required rule: once resolver returns UC ID by video-id, stamp it directly on that card and in card cache with a stable proof key (`videoId` + `shorts` source) to prevent re-query thrash.

### Gap C — collab roster truncation by text collapse
Flattened byline text like `A and 2 more` is not safe as full roster proof.

- Required rule: parse collab sheet/list payload first and only use text markers as hints + expected count.

### Gap D — YT_MAIN_NEXT format handling
This file is a schema variant and must continue through recursive extraction, not renderer-locked parsing.

- Required rule: normalize candidate objects and evaluate confidence not by renderer name.

---

## 7) Execution notes for current code paths

- `js/content_bridge.js` already includes playlist/short/flow branches and background fallbacks. The critical enforcement point remains when creating `channelInfo` for block actions:
  - ensure `playlist` source cannot silently downgrade to seed video uploader unless creator lookup fails.
- `js/background.js` `handleAddFilteredChannel` already supports video-id-driven resolution and final metadata enrichment; keep it as final verifier.
- `js/injector.js` has the JSON traversal and collab search side; keep all JSON extraction paths broad and ranked, not first-match only.

### Quick-block merge guardrails (critical)

- Build a click-context lock from `{videoId, playlistId, playlist flow, strong identity}` before any async fetch merge.
- For any async candidate (`channelInfoPromise`, structured lookup, playlist fallback retry):
  - require strong candidate match when clicked row had strong identity (`id/handle/customUrl`), including videoId or playlistId mismatch checks.
  - if clicked row is a playlist context (`fetchStrategy:'playlist'`, `source:'ytm_playlist_card'`, `playlistId` exists), only apply candidates that do not contradict `playlistId` and are owner-relevant.
  - if no strong identity exists, reject candidates that are clearly for a different `videoId`.
- Never overwrite clicked-candidate channels with plain text-only byline fragments when no JSON identity path confirms it.

## 10) Playlist-vs-seed identity rule (hard requirement)

Use this as hard logic in quick-block context:

1. If card context has `fetchStrategy:'playlist'` and a `playlistId`:
   - use playlist owner/creator UC first.
2. For `compactPlaylistRenderer`:
   - use `shortBylineText`/`longBylineText` `browseEndpoint.browseId`.
3. If owner is unavailable in JSON renderer:
   - resolve via `playlist.json` / `playlistId` cross-link.
4. If still unavailable:
   - resolve via secondary watch/page JSON cache.
5. Only then, and only if above all fail:
   - fallback to seed-video uploader.

Hard rule: do not block seed uploader when owner is known and non-empty.

## 11) Shorts extraction boundaries

- `shortsLockupViewModel` and `shortsLockupViewModelV2` are the source for short cards in feeds/shelves.
- If only `videoId` is present on first pass:
  - resolve immediately via cache or secondary JSON.
  - stamp resolved UC on the DOM node attributes to suppress repeated lookup.
- `reel_item_watch?prettyPrint=False.JSON` should be used only when current content is a playing short:
  - active short only, not for batch/stale shelf rows.
- If active short JSON says channel ID and list card does not yet have it:
  - apply only when that `videoId` key is the same as currently playing.

## 12) Collab extraction and stamping policy

- Never flatten collab cards to a single row.
- Up to 7 channels observed in fixtures are expected:
  - uploader + up to 6 collaborators.
- Extraction order:
  - `listItemViewModel` from `showSheetCommand` list payload
  - `listItemViewModel` command runs/browse endpoints
  - avatar/author DOM links (secondary)
  - text-only byline (`and N more`) as count hint only
- For every collab card:
  - always set `allCollaborators` with resolved IDs where available,
  - set primary `channelId` from first canonical collaborator if no owner-specific creator path exists.

### 12.1) Stamping lifecycle evidence and policy

- Observed behavior on `ytm-playlist-panel-video-renderer`:
  - Before block-click action:
    - only base channel/video markers were present (`data-filtertube-video-id`, `data-filtertube-channel-id`, processing markers),
    - no full collaborator roster attributes were present.
  - After block-click action:
    - collaborator roster attributes appear (`data-filtertube-collaborators`, `data-filtertube-collab-state`, `data-filtertube-expected-collaborators`, `data-filtertube-collaborators-ts`),
    - blocked markers are added (`data-filtertube-blocked-*`).
- This confirms collaborator enrichment is currently executed on demand rather than at first hydration pass.

- Decision:
  - Resolve + stamp all available metadata as soon as a card is matched to JSON/videoId/playlistId context.
  - Do not wait for block action to add roster metadata; keep blocked markers reserved for actual block persistence only.

- Implementation implication:
  - `channel-info` and `allCollaborators` should be pre-populated from JSON sources (including `listItemViewModel` collab sheet payloads),
  - `blocked-*` fields remain late-bound and user-action-driven.

### 12.2 Decision log (2026-02-28): pre-stamp every resolvable field on first pass

- Evidence from current observations:
  - Playlist panel row before block-click only had base identity markers.
  - Collab roster fields and `expected` counters appeared only after user action.
  - 3-dot menu rendering can display only handle or ID when roster text was used as the only source.
- Decision:
  - Keep all resolvable JSON-backed identity fields stamped during hydration of card discovery (`ensureVideoIdForCard` -> prefetch path -> extractor fallback) and not only inside block/click action flow.
  - Preserve existing guardrails: playlist creator-first, seed-video fallback only for unresolved non-playlist contexts, and strict collaborator handling.
- Resulting rule:
  - `data-filtertube-blocked-*` and `data-filtertube-blocked-state` remain **action-only** and must not be used to drive future pre-stamp logic.

### 12.3 DOM type pre-stamp contract (first-pass, all surfaces)

- `videoWithContextRenderer`, `compactVideoRenderer`, generic compact/watch video rows (YTM, YTD, YTK):
  - Stamp: `data-filtertube-video-id`, `data-filtertube-channel-id`, `data-filtertube-channel-handle`, `data-filtertube-channel-custom`, `data-filtertube-channel-name`,
    `data-filtertube-channel-source`, `data-filtertube-channel-fetch-strategy`, `data-filtertube-channel-logo`.
  - Additional optional fields when available: `data-filtertube-channel-expected-channel-name`, `data-filtertube-channel-expected-handle`, `data-filtertube-channel-video-title-hint`.

- Playlist cards (`compactPlaylistRenderer`, `ytm-compact-playlist-renderer`, `ytd-compact-playlist-renderer`, etc.):
  - Stamp ownership path first from playlist `byline`/`browseEndpoint.browseId`.
  - Stamp: same fields as regular video rows plus `data-filtertube-channel-playlist-id`.
  - Only if owner cannot be resolved and source confidence is downgraded, expose fallback identity with explicit provenance.

- Mix/playlist collection cards (`compactRadioRenderer`, `ytm-compact-radio-renderer`, `ytm-radio` family):
  - Stamp playlist identity only where available.
  - `channel-id`/`channel-handle` must not be inferred from unrelated video row fields.
  - Keep non-owner feed rows marked as non-playlist context unless evidence indicates collection context.

- Shorts cards (`shortsLockupViewModel`, `shortsLockupViewModelV2`, `ytm-reel-*` family):
  - Stamp from byline endpoint when present.
  - On missing byline identity, immediately resolve by `videoId` (`searchYtInitialDataForVideoChannel`) and stamp once resolved.
  - `reel_item_watch` is playback-only and only stamps when the short is currently active.

- Collab rows (`playlistPanelVideoRenderer` with multiple channel hints, collaboration overlays, sheet payload):
  - Stamp full `data-filtertube-collaborators` payload with up to observed max entries.
  - Stamp `data-filtertube-collaborators-source`, `data-filtertube-collaborators-ts`, `data-filtertube-expected-collaborators`.
  - Keep `data-filtertube-collab-state` as progress state for enrichment.

- Post/channel cards (`ytd-post-renderer`, `ytm-post` variants):
  - Stamp from author/channel endpoint as primary identity.
  - Fill name/handle/custom fields from author node if endpoint is valid; no video inference fallback.

- Comment/video reply cards:
  - Stamp available author fields using comment renderer endpoint.
  - Preserve playlist/short inference rules; do not force video-id mapping.

- Whitelist flow:
  - Uses same first-pass stamp fields for UI labeling and quick channel matching checks.
  - `data-filtertube-blocked-*` remains write-on-action for whitelist/blacklist toggles only.

## 13) Current deficit against user evidence

- Playlist blocker mismatch (e.g., "Voula Fra" name with empty UC) is likely from weak intermediate row creation before playlist owner resolution.
- Non-empty `channelId` must be required before dispatching quick-block for playlist cards.
- Mixed `NIN` candidate indicates fallback path may be resolving from unrelated cache seed, not active card context.
- Collab metadata currently appears to be injected late in some flows (after block click), which causes menu labels and block-target context to depend on post-click enrichment rather than initial deterministic identity.

---

## 8) Do-nots

- Do not derive block identity from text-only byline tokens.
- Do not map `reel_item_watch` into non-playback short cards.
- Do not clear card collaborators on first partial identity.
- Do not allow playlist quick-block to proceed with `id:''`.

---

## 9) Immediate acceptance criteria

1. Playlist card click should log and persist owner identity from playlist creator fields.
2. Collab block row count should retain up to roster size and avoid collapsing to uploader-only.
3. Shorts cards should stop producing repeated `videoId` lookups after first successful resolution.
4. YT_MAIN_NEXT feed cards should stamp channel IDs using recursive adapter pass.

## 14) Merge-time click-context guard (code-level contract)

- `clickedContext = { videoId, playlistId, isPlaylistContext, hasStrongIdentity }`
- Every merge candidate (structured lookup, prefetch `channelInfoPromise`, playlist retries) must pass `candidateMatchesClickedIdentity` before adoption.
- Hard rejects:
  - `videoId` mismatch when clicked context has known `videoId`
  - playlist-context candidates with `videoId` but no playlist evidence (`source`/`fetchStrategy`/`playlistId`)
  - strong-identity mismatch (`id/handle/customUrl`)
- Allowed fallbacks:
  - explicit collab key match
  - single-collaborator row with explicit name match when strong identity is unavailable.

## 15) 2026-02-28 execution update: pre-stamp-first metadata path

### Why this implementation move happened now
- Repro evidence shows playlist and collab menu surfaces were being stamped only on action paths (`quick-block`/`block click`), not at card hydration.
- This created inconsistent immediate UI states:
  - `data-filtertube-collaborators*` and expected-collaborator counters arriving late,
  - blocked target labels occasionally resolving to fallback identities (e.g., seed/channel drift cases),
  - shorts/rapid-recycled rows relying on stale IDs.

### What changed
- In `js/content_bridge.js`, JSON-resolvable fields are now written to the DOM row before user interaction for both:
  - normal 3-dot menu path (`injectFilterTubeMenuItem`),
  - fallback playlist popover path (`openFilterTubePlaylistFallbackPopover`).
- Enrichment completion now re-stamps row identity via the same channel stamping helper, not partial manual attributes.

### Preserved constraints
- Block-state writes (`data-filtertube-blocked-*`) are still action-only.
- Playlist creator-vs-seed behavior is preserved:
  - playlist flow prefers playlist creator identity,
  - non-playlist fallback remains video-based only when creator evidence is absent.

# Absolute JSON Trace: Collaborator Roster (`videoWithContextRenderer`)
*File: `YTM-XHR.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`, `collab.json`*

**Base Path to Item**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer`

**Header/Trigger Check**:
- Path: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.header.panelHeaderViewModel.title.content`
- Expected Value: `"Collaborators"`

**Uploader / Collaborator 1 (e.g., shakiraVEVO)**:
- **ID**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Name**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.title.content`
- **Handle**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Sub-Count**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.subtitle.content`
- **Logo**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.leadingAccessory.avatarViewModel.image.sources[0].url`

**Collaborator 2 (e.g., Spotify)**:
- **ID**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Name**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.title.content`
- **Handle**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Sub-Count**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.subtitle.content`
- **Logo**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.leadingAccessory.avatarViewModel.image.sources[0].url`

**Collaborator N (e.g., listItems[2], listItems[3]...)**:
- **ID**: `...listItems[n].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Name**: `...listItems[n].listItemViewModel.title.content`
- **Handle**: `...listItems[n].listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Sub-Count**: `...listItems[n].listItemViewModel.subtitle.content`
- **Logo**: `...listItems[n].listItemViewModel.leadingAccessory.avatarViewModel.image.sources[0].url`\n---\n
# Absolute JSON Trace: Playlist Cards
*File: `YTM.json`, `playlist.json`*

### `compactPlaylistRenderer`
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].compactPlaylistRenderer`

- **Playlist ID**: `...playlistId`
- **Creator Channel ID**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Creator Name**: `...shortBylineText.runs[0].text`
- **Creator Handle**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl`
- **Thumbnail**: `...thumbnail.thumbnails[0].url`

### `playlistPanelVideoRenderer` (Items inside a Playlist)
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].playlistPanelVideoRenderer`
*Also found directly in `ytInitialData.contents.twoColumnWatchNextResults.playlist.playlist.contents[i].playlistPanelVideoRenderer`*

- **Video ID**: `...videoId`
- **Video Title**: `...title.simpleText`
- **Channel ID**: `...longBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Channel Name**: `...longBylineText.runs[0].text`
- **Channel Handle**: `...longBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl`\n---\n
# Absolute JSON Trace: MIX / Radio Cards
*File: `YTM-XHR.json`*

### `compactRadioRenderer`
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].compactRadioRenderer`

- **Playlist ID (MIX ID)**: `...playlistId` (Always starts with `RD`)
- **MIX Title**: `...title.simpleText` (e.g., `"Mix - Artist Name"`)
- **Byline Hint**: `...shortBylineText.simpleText` (e.g., `"YouTube Mix"`)
- **Thumbnail**: `...thumbnail.thumbnails[0].url`
- **Watch Endpoint**: `...navigationEndpoint.watchEndpoint.videoId` (The seed video, NOT the owner)

*Important Note: MIX cards do not have a deterministic "Owner Channel ID" inside the card payload. The `playlistId` itself is the unique identifier for blocking.*\n---\n
# Absolute JSON Trace: Shorts Cards
*File: `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`, `reel_item_watch?prettyPrint=False.JSON`*

### `shortsLockupViewModel` (Feed / Up Next)
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].shortsLockupViewModel`

- **Video ID**: `...onTap.innertubeCommand.reelWatchEndpoint.videoId`
- **Title**: `...metadata.lockupMetadataViewModel.title.content`
- **Channel ID (Primary/Owner)**: `...metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Channel Handle**: `...metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Channel Name**: `...metadata.lockupMetadataViewModel.title.content` (Often titles are used as the name in this view)
- **Thumbnail**: `...contentImage.thumbnailViewModel.image.sources[0].url`

### `reelItemRenderer` (Shelf)
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].reelItemRenderer`

- **Video ID**: `...videoId`
- **Channel ID**: `...navigationEndpoint.reelWatchEndpoint.overlay.reelPlayerOverlayRenderer.reelChannelBarViewModel.channelTitle.onTap.innertubeCommand.browseEndpoint.browseId`
- **Title**: `...headline.simpleText`

### `reelPlayerOverlayRenderer` (Active Playback)
*File: `reel_item_watch?prettyPrint=False.JSON`*
**Base Path**: `overlay.reelPlayerOverlayRenderer`

- **Channel ID**: `...reelChannelBarViewModel.channelTitle.onTap.innertubeCommand.browseEndpoint.browseId`
- **Channel Name**: `...reelChannelBarViewModel.channelTitle.content`
- **Channel Handle**: `...reelChannelBarViewModel.channelTitle.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Channel Logo**: `...reelChannelBarViewModel.avatar.avatarViewModel.image.sources[0].url`\n---\n
# Absolute JSON Trace: Normal Video Cards
*File: `YTM-XHR.json`, `YTM.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json`*

### `videoWithContextRenderer`
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer`

- **Video ID**: `...videoId`
- **Title**: `...headline.runs[0].text`
- **Primary Channel ID**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Primary Channel Name**: `...shortBylineText.runs[0].text`
- **Primary Channel Handle**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl`
- **Primary Channel Logo**: `...channelThumbnail.channelThumbnailWithLinkRenderer.thumbnail.thumbnails[0].url`
- **Fallback Channel ID**: `...channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId`
- **Length/Duration**: `...lengthText.runs[0].text`
- **View Count**: `...shortViewCountText.runs[0].text`
- **Published Time**: `...publishedTimeText.runs[0].text`

### `lockupViewModel` (Modern High-Nesting)
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].lockupViewModel`

- **Content ID (Video ID)**: `...contentId`
- **Watch videoId**: `...rendererContext.commandContext.onTap.innertubeCommand.watchEndpoint.videoId`
- **Primary Channel ID**: `...metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Primary Channel Name**: `...metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[0].metadataParts[0].text.content`
- **Primary Channel Handle**: `...metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Primary Channel Logo**: `...metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources[0].url`
- **Title Text**: `...metadata.lockupMetadataViewModel.title.content`

### `compactVideoRenderer` (Kids / Sidebars)
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].compactVideoRenderer`
*File: `YT_KIDS.json`, `YTM-XHR.json`*

- **Video ID**: `...videoId`
- **Primary Channel ID**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Primary Channel Name**: `...shortBylineText.runs[0].text`
- **Kids External Channel ID**: `...kidsVideoOwnerExtension.externalChannelId`\n---\n
# Absolute JSON Trace: Posts / Community Cards
*File: `YTM-XHR.json`, `YT_MAIN_NEXT.json`*

### `postRenderer` (Community Post)
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].postRenderer`

- **Post ID**: `...postId`
- **Author Channel ID**: `...authorEndpoint.browseEndpoint.browseId`
- **Author Name**: `...authorText.runs[0].text`
- **Author Handle**: `...authorEndpoint.browseEndpoint.canonicalBaseUrl`
- **Author Logo**: `...authorThumbnail.thumbnails[0].url`
- **Post Text Content**: `...contentText.runs[0].text`

### `sharedPostRenderer`
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].sharedPostRenderer`

- **Shared Post ID**: `...postId`
- **Sharer Channel ID**: `...endpoint.browseEndpoint.browseId`
- **Sharer Name**: `...displayName.runs[0].text`
- **Original Post Content**: (Nest into `...originalPost.postRenderer` and follow paths above)\n---\n
