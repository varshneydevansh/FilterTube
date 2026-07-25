# YouTube Renderer Inventory

This document tracks which YouTube renderers/selectors FilterTube currently targets and how the latest DOM samples map to them.

**Major updates tracked here:**
- **Proactive Network Interception**: Added comprehensive XHR interception and snapshot stashing
- **Enhanced Collaboration Detection**: Added `avatarStackViewModel` support for collaboration detection while keeping Mix/Radio renderers explicitly excluded
- **Authoritative Collaborator Rosters**: Header-backed `Collaborators` sheets now outrank avatar/direct-list fallbacks, and weak composite name-only rows are pruned before cache/menu use
- **Topic Channel Support**: Added special handling for auto-generated YouTube topic channels
- **Post-Block Enrichment**: Added background enrichment system for incomplete channel data
- **Kids Video Enhancement**: Added `kidsVideoOwnerExtension` and `externalChannelId` support
- **Performance Optimizations**: Async DOM processing with main-thread yielding and batched writes were added to reduce lag, CPU pressure, and I/O. Earlier notes used 60-80% CPU and 70-90% I/O reduction language; those are historical estimates, not current measured proof.
- **2026-05-31 release candidate**: no-rule work gates, compact autoplay/watch-next filtering, whitelist Shorts creator fallback, production console gating, and DOM state hardening are tracked in `docs/audit/FILTERTUBE_POST_APRIL_12_RELEASE_DOC_VALIDATION_2026-05-31.md`.

## Home Feed

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `richItemRenderer` | Wrapper around per-card renderer in rich grid | ✅ Covered @js/filter_logic.js#136-142 |
| `lockupViewModel` | New lockup-based card metadata (titles, subtitles) | ✅ Covered @js/filter_logic.js#150-154 |
| `videoRenderer` / `gridVideoRenderer` | Legacy rich-grid video cards | ✅ Covered @js/filter_logic.js#129-133 |
| `playlistRenderer` / `radioRenderer` | Mix/playlist shelves | ✅ Covered @js/filter_logic.js#206-215 |
| `shelfRenderer` | Home page shelf headers | ✅ Covered @js/filter_logic.js#145-147 |

### **UPDATED v3.2.1: Renderer Status Changes**

| JSON renderer key | Previous Status | Current Status | Notes |
| --- | --- | --- | --- |
| `continuationItemRenderer` | ⚠️ Missing | ✅ **IMPLEMENTED** | Used for comment continuations @js/seed.js#546 |
| `itemSectionRenderer` | ⚠️ Missing | ✅ **IMPLEMENTED** | Comment section removal @js/seed.js#377 |
| `twoColumnWatchNextResults` | ❌ Not parsed | ✅ **IMPLEMENTED** | Watch page content structure @js/filter_logic.js#813 |
| `watchCardRichHeaderRenderer` | ⚠️ Missing | ✅ **IMPLEMENTED** | Universal watch card headers @js/filter_logic.js#361 |
| `backstagePostRenderer` | ✅ Covered | ✅ **ENHANCED** | Community posts with full content @js/filter_logic.js#465 |
| `backstagePollRenderer` | ❌ Not parsed | ✅ **IMPLEMENTED** | Poll questions & choices @js/filter_logic.js#472 |
| `backstageQuizRenderer` | ❌ Not parsed | ✅ **IMPLEMENTED** | Quiz questions & options @js/filter_logic.js#481 |
| `notificationRenderer` | ✅ Covered | ✅ **ENHANCED** | Full notification parsing @js/filter_logic.js#493 |
| `menuRenderer` | ℹ️ UI only | ✅ **IMPLEMENTED** | Menu navigation items @js/content_bridge.js#3901 |
| `commentRenderer` | ✅ Covered | ✅ **ENHANCED** | Comment text & author @js/filter_logic.js#559 |
| `commentThreadRenderer` | ✅ Covered | ✅ **ENHANCED** | Comment thread containers @js/filter_logic.js#564 |

### **NEW v3.2.1: Additional Renderers Found**

| JSON renderer key | Purpose | Status | Location |
| --- | --- | --- | --- |
| `backstagePostThreadRenderer` | Community post threads | ✅ **NEW** | @js/filter_logic.js#458 |
| `ticketShelfRenderer` | Ticket/metadata shelves | ✅ **NEW** | @js/filter_logic.js#422 |
| `podcastRenderer` | Podcast content | ✅ **NEW** | @js/filter_logic.js#425 |
| `richShelfRenderer` | Rich shelf containers | ✅ **NEW** | @js/filter_logic.js#438 |
| `channelVideoPlayerRenderer` | Channel featured video | ✅ **NEW** | @js/filter_logic.js#444 |
| `compactRadioRenderer` | Compact radio playlists | ✅ **NEW** | @js/filter_logic.js#419 |
| `relatedChipCloudRenderer` | Related chip clouds | ✅ **NEW** | @js/filter_logic.js#365 |
| `chipCloudRenderer` | Chip cloud containers | ✅ **NEW** | @js/filter_logic.js#369 |
| `chipCloudChipRenderer` | Individual chips | ✅ **NEW** | @js/filter_logic.js#372 |
| `secondarySearchContainerRenderer` | Search container | ✅ **NEW** | @js/filter_logic.js#388 |

### **NEW v3.2.1: JSON Snapshot Identity System**

| Network Endpoint | Data Source | Purpose | Status |
| --- | --- | --- | --- |
| `/youtubei/v1/next` | `lastYtNextResponse` | Watch page playlist & recommendations | ✅ Stashed @js/seed.js#stashNetworkSnapshot |
| `/youtubei/v1/browse` | `lastYtBrowseResponse` | Channel page & browse data | ✅ Stashed @js/seed.js#stashNetworkSnapshot |
| `/youtubei/v1/player` | `lastYtPlayerResponse` | Video player metadata | ✅ Stashed @js/seed.js#stashNetworkSnapshot |

**Multi-Source Channel Resolution:**
```javascript
// Search across JSON snapshots and page globals when those sources expose identity
const roots = [
    window.filterTube?.lastYtNextResponse,      // Playlist data
    window.filterTube?.lastYtBrowseResponse,    // Channel data  
    window.filterTube?.lastYtPlayerResponse,    // Player data
    window.ytInitialData,                       // Page data
    window.filterTube?.lastYtInitialData        // Backup page data
];
```

### **NEW v3.2.1: Enhanced Collaboration Detection**

| Renderer/Component | Collaboration Type | Status | Notes |
| --- | --- | --- | --- |
| `avatarStackViewModel` | Multi-channel avatar stacks | ✅ **NEW** | Extracts collaborators from avatar arrays @js/injector.js#extractFromAvatarStackViewModel |
| `showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.header.panelHeaderViewModel.title.content == "Collaborators"` | Authoritative collaborator roster | ✅ **PRIMARY** | Wins over avatar stack/direct-list fallback candidates for the same `videoId` |
| direct / nested `listViewModel.listItems` without `Collaborators` header | Fallback candidate only | ⚠️ **GUARDED** | Can seed recovery, but cannot outrank a header-backed `Collaborators` roster |
| weak composite name-only rows | Fallback pollution | ✅ **PRUNED** | Rows such as `Daddy Yankee Bizarrap` are removed when fully covered by `Daddy Yankee` + `Bizarrap` |
| `decoratedAvatarViewModel` | Channel avatars with endpoints | ✅ **ENHANCED** | Now extracts logos and channel info @js/filter_logic.js#340 |
| Mix Cards (`collection-stack`) | **NOT** collaborations | ✅ **FIXED** | Properly excluded from collaboration detection @js/content_bridge.js#isMixCardElement |

**Avatar Stack Structure:**
```javascript
// New avatarStackViewModel parsing
{
    avatars: [
        {
            avatarViewModel: {
                image: { sources: [{ url: "logo_url" }] },
                rendererContext: {
                    commandContext: {
                        onTap: {
                            innertubeCommand: {
                                browseEndpoint: {
                                    browseId: "UC...",
                                    canonicalBaseUrl: "/@handle"
                                }
                            }
                        }
                    }
                }
            }
        }
    ]
}
```

**Candidate precedence rule (2026-04-28):**

```text
1. Header-backed "Collaborators" sheet roster
2. Dialog/sheet roster variants with explicit collaborator header
3. Avatar-stack or direct-list fallback with stable identities
4. DOM byline/collapsed text warm-up only
```

Fallback candidates are sanitized before scoring and caching. A longer fallback list is not automatically richer if one row is a composite of two real channel labels.

### **NEW v3.2.1: Topic Channel Support**

| Channel Type | Detection Pattern | Status | Notes |
| --- | --- | --- | --- |
| Auto-generated Topic Channels | Name ends with " - Topic" | ✅ **NEW** | Special handling in @js/render_engine.js#isTopicChannel |
| Topic Channel Tooltip | No @handle/customUrl | ✅ **NEW** | Shows explanatory tooltip in UI |

**Topic Channel Logic:**
```javascript
function isTopicChannel(channel) {
    const name = channel?.name || '';
    const hasTopicSuffix = /\s-\sTopic$/i.test(name);
    const hasNoHandle = !channel.handle && !channel.customUrl;
    const hasUcId = channel.id?.startsWith('UC');
    return hasTopicSuffix && hasNoHandle && hasUcId;
}
```

### **NEW v3.2.1: Post-Block Enrichment System**

| Feature | Purpose | Status | Notes |
| --- | --- | --- | --- |
| `schedulePostBlockEnrichment()` | Background enrichment of incomplete channel data | ✅ **NEW** | Runs 3.5s after block with rate limiting @js/background.js#579 |
| `pendingPostBlockEnrichments` | Tracks active enrichment requests | ✅ **NEW** | Prevents duplicate enrichment attempts |
| `postBlockEnrichmentAttempted` | Rate limiting cache (6 hours) | ✅ **NEW** | Avoids repeated failed enrichments |

**Enrichment Triggers:**
- Missing handle or customUrl
- Missing logo
- Missing proper channel name
- Not a topic channel (topic channels are excluded)

### **NEW v3.2.1: Enhanced Kids Video Support**

| Renderer Field | Purpose | Status | Notes |
| --- | --- | --- | --- |
| `kidsVideoOwnerExtension.externalChannelId` | Kids video channel ID extraction | ✅ **NEW** | @js/filter_logic.js#896 |
| `externalChannelId` | General external channel ID | ✅ **ENHANCED** | Multiple fallback locations @js/content/dom_extractors.js#351 |

### New DOM elements from sample
| DOM tag / component | Associated data | Coverage | Notes |
| --- | --- | --- | --- |
| `<ytd-rich-item-renderer>` | Hosts rich grid cards | ✅ Data surfaces through `richItemRenderer` which we filter pre-DOM |
| `<yt-lockup-view-model>` & child `<yt-lockup-metadata-view-model>` | Carries title, byline, metadata | ✅ JSON consumed via `lockupViewModel` paths @js/filter_logic.js#150-154 |
| `<yt-collection-thumbnail-view-model>` / `<yt-collections-stack>` | Visual mix thumbnail stack | ℹ️ Visual only; no keyword-bearing text | No filtering required unless we hide thumbnails later |
| `<yt-thumbnail-view-model>` | Thumbnail container | ℹ️ Covered indirectly when we hide filtered cards |
| `<yt-thumbnail-overlay-badge-view-model>` (Mix badge) | Badge text like “Mix” | ⚠️ Not parsed; consider adding to keyword scan if badges become relevant |
| `yt-chip-cloud-chip-renderer` (Home/Search filter chips) | DOM-only | ✅ Route-scoped | Mixes/topic chip hiding is intentionally limited to Home (`/`) and Search (`/results`) so Watch related chips do not wake fallback work or move scroll |

### Desktop lockup DOM refresh (2026-07-01)

The current YouTube desktop DOM now uses the lockup view model shape broadly on
Home, Watch related rows, and search-adjacent result lists:

Historical transition:

| Surface / identity field | Older DOM expectation | Current DOM seen 2026-07-01/02 | Runtime implication |
| --- | --- | --- | --- |
| Home normal card host | `ytd-rich-grid-media` or lockup nodes with older dashed helper classes | `ytd-rich-item-renderer[lockup]` wrapping `yt-lockup-view-model.ytLockupViewModelWrapper` | Card discovery must include the host and the nested lockup wrapper. |
| Lockup title | `.yt-lockup-metadata-view-model__title` / heading reset variants | `a.ytLockupMetadataViewModelTitle` inside `.ytLockupMetadataViewModelTextContainer` | Title and video-id extraction must support camelCase classes. |
| Thumbnail/video id | `a#thumbnail[href*="watch?v="]` or dashed lockup content image | `a.ytLockupViewModelContentImage[href*="watch?v="]` | Video id extraction must not rely on `#thumbnail` being present. |
| Byline channel link | Channel anchor inside `ytd-channel-name` or dashed metadata rows | First `.ytContentMetadataViewModelMetadataRow` may have a channel anchor, but can be plain text only | Channel blocking must support text fallback and JSON/video map enrichment. |
| Channel display name | Anchor text or avatar image `alt` | `.ytSpecAvatarShapeHost[aria-label="Go to channel ..."]` while avatar image `alt` is often empty | DOM fallback and menu extraction now use the avatar aria label as a narrow display-name fallback. |
| Native menu host | `ytd-menu-renderer` / dashed lockup menu button | `.ytLockupMetadataViewModelMenuButton` with optional `.ytLockupMetadataViewModelBottomRight` | Fallback menu anchoring must include the camelCase menu host. |
| Collaboration signal | `#attributed-channel-name`, dialog roster, or multiple channel links | `yt-avatar-stack-view-model[aria-label="Collaboration channels"]` plus text like `Name ... and Name` | Collaboration remains enrichment-dependent; bare `and` text is not enough authority by itself. |

| DOM tag / class | Field | FilterTube handling |
| --- | --- | --- |
| `<yt-lockup-view-model class="ytLockupViewModelWrapper">` | Card shell | Treat as a normal video card; do not depend only on old dashed class names |
| `a.ytLockupViewModelContentImage[href*="watch?v="]` | Video URL / video id | Used as a primary video-id source |
| `a.ytLockupMetadataViewModelTitle` | Title and video URL | Used by title extraction and href fallback |
| `.ytLockupMetadataViewModelMetadata` | Metadata container | Holds byline rows, sometimes without channel links |
| `.ytContentMetadataViewModelMetadataRow` | Byline/view rows | First row usually contains channel text or channel anchor |
| `.ytContentMetadataViewModelMetadataText` | Channel or metadata text | Used as fallback text when no anchor is available |
| `.ytSpecAvatarShapeHost[aria-label="Go to channel ..."]` | Channel display name | Used as a narrow fallback when the byline is text-only and avatar images have empty `alt` |
| `.ytLockupMetadataViewModelMenuButton` | Native three-dot menu host | Used for menu/fallback anchoring |

Observed examples:

- Home page shell: `<ytd-two-column-browse-results-renderer page-subtype="home">`
  -> `<ytd-rich-grid-renderer>` with `<div id="frosted-glass"
  class="with-chipbar">` and a `ytd-feed-filter-chip-bar-renderer
  frosted-glass-mode="with-chipbar"`.
- Home cards: `<ytd-rich-item-renderer lockup>` ->
  `<yt-lockup-view-model>` -> `<yt-lockup-metadata-view-model>`.
- Watch related rows: compact/horizontal `<yt-lockup-view-model>` entries with
  `.ytLockupMetadataViewModelBottomRight` menu placement.
- Some rows expose `a[href^="/@"]` in the first metadata row; others expose only
  text plus avatar `aria-label="Go to channel ..."` until JSON/enrichment fills
  identity.
- Collaboration rows can expose `yt-avatar-stack-view-model
  aria-label="Collaboration channels"` and text such as `Pinkpantheress ... and
  Zara Larsson` without direct channel links for every collaborator. That remains
  an enrichment-dependent path.

The new DOM still leaves existing `data-filtertube-*` markers visible in sampled
pages, so there is no proof that YouTube is stripping those attributes. Issue
#59 remains valid code-burden/privacy debt: long-term state should move toward
scoped maps where possible, but this DOM refresh is mainly selector and stale
settings compatibility work.

2026-07-02 repair notes:

- `js/content_bridge.js` refreshed current lockup title/menu/channel selectors,
  forces settings refresh after block actions, and extracts display names from
  `Go to channel ...` avatar labels when byline links are absent.
- `js/content/dom_fallback.js` mirrors the camelCase selector aliases and avatar
  label fallback for actual hide decisions.
- `js/content/dom_extractors.js` accepts current lockup title/content-image
  links as first-class video-id/title sources.
- `js/background.js` clears compiled settings cache after the older persistent
  add path writes channel/profile updates, preventing blocklist UI changes from
  compiling against stale background state.

### Home Shorts shelf refresh (2026-07-01)

The current Home Shorts shelf sample uses a desktop shelf wrapper with mobile
lockup elements inside:

```html
<ytd-rich-shelf-renderer>
  <ytd-rich-item-renderer lockup is-shelf-item is-slim-media>
    <ytm-shorts-lockup-view-model-v2>
      <ytm-shorts-lockup-view-model>
        <a class="shortsLockupViewModelHostEndpoint reel-item-endpoint"
           href="/shorts/{videoId}">
        <h3 class="shortsLockupViewModelHostMetadataTitle">
```

FilterTube coverage:

- `ytm-shorts-lockup-view-model` and `ytm-shorts-lockup-view-model-v2` remain
  registered video card selectors.
- Shorts video ids are extracted from `/shorts/{id}` links.
- DOM hiding targets the outer `ytd-rich-item-renderer` when present so the
  shelf does not keep an empty slot.
- Channel blocking still depends on JSON/video-channel enrichment because the
  visible Shorts shelf DOM usually exposes title and view count, not a channel
  id.

### Route-specific chip clouds (2026-06-18)

YouTube reuses the same chip tags on multiple surfaces, but FilterTube should not treat all chip clouds as filterable content.

| Surface | DOM parent / shell | Chip children | FilterTube behavior | Reason |
| --- | --- | --- | --- | --- |
| Home feed | Home feed chip cloud / feed filter chip bar | `<yt-chip-cloud-renderer>` -> `<yt-chip-cloud-chip-renderer>` / `<chip-shape>` | ✅ DOM chip filtering and `hideMixPlaylists` are allowed | Home chips can expose feed topics and the Mixes chip the user asked us to hide |
| Search results | `<ytd-search-header-renderer has-chip-bar>` with `#chip-bar` | `<yt-chip-cloud-renderer>` -> `<yt-chip-cloud-chip-renderer>` / `<chip-shape>` | ✅ DOM chip filtering and `hideMixPlaylists` are allowed on `/results` | Search chips are user-facing refinements and can be filtered without disturbing Watch scroll |
| Watch related rail | `<yt-related-chip-cloud-renderer>` inside the Watch item section | `<yt-chip-cloud-renderer>` -> `<yt-chip-cloud-chip-renderer>` / `<chip-shape>` | 🚫 DOM fallback chip filtering and chip mutation wake-ups are disabled on `/watch` | These chips are navigation refinements for recommendations; processing them caused unnecessary fallback runs and could fight Watch page scroll |
| YTM mobile Home | `<ytm-feed-filter-chip-bar-renderer id="filter-chip-bar" class="chip-bar frosted-glass">` | `<ytm-chip-cloud-chip-renderer>` | ✅ DOM chip filtering is allowed on `/` | Mobile Home chips are the same type of feed refinements as desktop Home chips |
| YTM mobile Watch | `<ytm-single-column-watch-next-results-renderer>` -> `<ytm-chip-cloud-renderer class="YtmChipCloudRendererHost chip-bar">` | `<ytm-chip-cloud-chip-renderer>` | 🚫 DOM fallback chip filtering and chip mutation wake-ups are disabled on `/watch` | Mobile Watch chips sit above recommendations and should not be treated as video cards |

Runtime boundary:

- `js/content/dom_fallback.js` gates DOM chip filtering to `/` and `/results`.
- `js/content_bridge.js` treats chip mutations as fallback-relevant only on `/` and `/results`.
- Keyword/channel/video filtering still applies to actual video cards, comments, shelves, playlist rows, and JSON renderer payloads. Chip route gating does not disable normal content filtering.

### Mobile YTM camelCase DOM refresh (2026-07-02)

The current mobile YouTube (`m.youtube.com`) DOM uses `ytm-*` custom elements
with camelCase host classes. This mirrors the desktop camelCase lockup shift,
but the filtering boundary is still card-first: chip bars are UI controls,
while `ytm-video-with-context-renderer`, `ytm-video-card-renderer`,
`ytm-media-item`, Shorts lockups, and compact channel/video rows remain the
content-bearing nodes. Runtime support
was updated after this sample so the new YTM content hosts participate in the
same card discovery, channel extraction, quick-block, fallback-menu, and stale
identity clearing paths as desktop camelCase lockups.

Observed Home shell:

```html
<body has-pivot-bar="true" has-safe-area-in-max="true">
  <ytm-app id="app" class="sticky-player">
    <ytm-mobile-topbar-renderer id="header-bar" class="sticky-player">
    <ytm-pivot-bar-renderer role="tablist" class="frosted-glass">
    <ytm-single-column-browse-results-renderer class="modern-tabs">
      <ytm-rich-grid-renderer class="rich-grid-single-column">
      <ytm-feed-filter-chip-bar-renderer id="filter-chip-bar"
        class="chip-bar frosted-glass">
        <ytm-chip-cloud-chip-renderer role="tab">
      <ytm-rich-item-renderer>
        <ytm-media-item>
        <yt-lockup-view-model class="ytLockupViewModelWrapper">
```

Observed Watch shell:

```html
<ytm-watch class="ambient-topbar rounded-edges">
  <ytm-single-column-watch-next-results-renderer
    class="watch-content full-bleed-wn-thumbs">
    <ytm-item-section-renderer section-identifier="related-items">
      <ytm-chip-cloud-renderer class="YtmChipCloudRendererHost chip-bar">
        <ytm-chip-cloud-chip-renderer role="tab">
      <ytm-video-with-context-renderer class="item adaptive-feed-item">
        <ytm-media-item>
      <ytm-video-card-renderer>
      <ytm-playlist-panel-video-renderer
        class="ytmPlaylistPanelVideoRendererV2Host">
      <ytm-channel-thumbnail-with-link-renderer
          class="YtmChannelThumbnailWithLinkRendererHost">
        <ytm-badge-and-byline-renderer
          class="YtmBadgeAndBylineRendererHost">
      <ytm-watch-card-hero-video-renderer>
      <ytm-watch-card-rich-header-renderer>
```

Observed channel/search-like YTM shells:

```html
<ytm-search class="ytmSearchPageHost">
<ytm-watch-card-rich-header-renderer class="rounded-container">
<ytm-collage-hero-image-renderer class="YtmCollageHeroImageRendererHost">
<ytm-call-to-action-button-renderer class="YtmCallToActionButtonRendererHost">
<ytm-compact-channel-renderer class="YtmCompactChannelRendererHost item">
<div class="YtmCompactMediaItemHost">
<div class="YtmCompactVideoRendererHost">
<div class="YtmCompactMediaItemMetadata">
<div class="YtmCompactMediaItemByline">
<ytm-thumbnail-overlay-resume-playback-renderer
  class="YtmThumbnailOverlayResumePlaybackRendererHost">
<ytm-shorts-lockup-view-model class="shortsLockupViewModelHost">
```

YTM camelCase support matrix:

| Surface / extraction point | Previous / older YTM shape | Current YTM shape observed | Runtime requirement |
| --- | --- | --- | --- |
| Mobile app shell | `ytm-browse`, `ytm-watch`, old dashed layout classes | `ytm-browse.YtmBrowseHost`, `ytm-watch.ambient-topbar.rounded-edges` | Inventory only. These are route/page wrappers, not hide targets. |
| Home feed chip bar | `ytm-feed-filter-chip-bar-renderer` with `ytm-chip-cloud-chip-renderer` | same tag plus camelCase support classes such as `YtmChipDividerRendererHost` | Route-gated chip filtering stays allowed on Home. |
| Watch chip bar | older related chip cloud shapes | `ytm-chip-cloud-renderer.YtmChipCloudRendererHost.chip-bar` with `chips-fixed-positioning chips-visible` | Inventory only on `/watch`; filter actual recommendation rows below it, not the chip labels. |
| Home/watch video cards | `ytm-video-with-context-renderer`, `ytm-compact-video-renderer` | `ytm-video-with-context-renderer.item.adaptive-feed-item` -> `ytm-media-item`; horizontal-list cards as `ytm-video-card-renderer`; class-only card bodies `.YtmCompactMediaItemHost` and `.YtmCompactVideoRendererHost`; also `yt-lockup-view-model.ytLockupViewModelWrapper` / `.ytLockupViewModelHost` inside `ytm-rich-item-renderer` | Supported as first-class card hosts for keyword/channel hide, quick-block, fallback menu, identity extraction, and stale identity clearing. |
| Lockup thumbnail/video id | `a.media-item-thumbnail-container[href*="watch?v="]` | `a.ytLockupViewModelContentImage[href*="watch?v="]` under `yt-lockup-view-model` | Supported as video-id source; not itself a hide target. |
| Channel/byline metadata | `.media-channel`, `.subhead`, `.media-item-subtitle` | `ytm-channel-thumbnail-with-link-renderer.YtmChannelThumbnailWithLinkRendererHost`, `ytm-badge-and-byline-renderer.YtmBadgeAndBylineRendererHost`, `.YtmBadgeAndBylineRendererItemByline` | Supported as metadata sources for channel name, handle, UC id, and avatar/link hints. |
| Channel search cards | `ytm-channel-renderer`, `ytm-compact-channel-renderer` | `ytm-compact-channel-renderer.YtmCompactChannelRendererHost` containing `.YtmCompactMediaItemHost`, `.YtmCompactChannelRendererHostMediaItemSubhead`, and `YtmChannelThumbnailWithLinkRendererHost` | Supported as channel/card host and metadata source. |
| Watch Mix / radio rows | `ytm-playlist-panel-video-renderer`, `ytm-radio-renderer`, `ytm-compact-radio-renderer` | `ytm-playlist-panel-video-renderer.ytmPlaylistPanelVideoRendererV2Host`, `ytm-compact-radio-renderer.YtmCompactRadioRendererHost`; `radioBottomOverlayHost` children | Supported as content card host; radio overlay children are metadata/control only. |
| Search page wrappers | `ytm-search` | `ytm-search.ytmSearchPageHost` | Inventory only. It is a page wrapper, not a hide target. |
| Search hero / CTA wrappers | old watch-card hero nodes | `YtmCollageHeroImageRendererHost`, `YtmCallToActionButtonRendererHost` | Inventory only unless enclosed by a supported watch-card/search-card host. These are visual/action subcomponents. |
| Community posts | `ytm-post-renderer` / older post text ids | `ytm-backstage-post-thread-renderer.ytmBackstagePostThreadRendererHost` -> `ytm-backstage-post-renderer.ytmBackstagePostRendererHost`; post body in `.ytmBackstagePostRendererHostContentText`; author in `yt-post-header.ytPostHeaderHost` | Supported as post/card hosts and post text sources for keyword/channel fallback. |
| Post media attachments | older backstage image nodes | `ytm-backstage-image-renderer.ytmBackstageImageRendererHost`, `ytm-post-multi-image-renderer.ytmPostMultiImageRendererHost`, `.ytmBackstagePostRendererHostSingleImageAttachment` | Metadata/attachment only. Parent post host is the hide target. |
| Post action buttons | older post button rows | `yt-comment-action-buttons-renderer.ytCommentActionButtonsRendererHost` | Inventory only. It is a control row, not a card, so hiding it would be a false-hide risk. |
| Comments preview carousel | older comment teaser DOM | `yt-comments-entry-point-teaser-view-model.ytCommentsEntryPointTeaserViewModelHost`, `yt-comment-teaser-carousel-item-view-model.ytCommentTeaserCarouselItemViewModelHost` | Inventory only. Normal comment filtering uses comment renderer/view-model paths. |
| Touch feedback / thumbnail overlay | older ripple/overlay classes | `yt-touch-feedback-shape.ytSpecTouchFeedbackShapeHost...`, `ytm-thumbnail-overlay-resume-playback-renderer.YtmThumbnailOverlayResumePlaybackRendererHost` | Inventory only. These are control/overlay nodes and should not drive card identity. |
| Shorts shelf | `ytm-shorts-lockup-view-model` | `ytm-shorts-lockup-view-model.shortsLockupViewModelHost` and grid shelf wrappers | Supported; existing Shorts lockup and grid item selectors remain first-class. |
| Shorts page shell | old mobile Shorts route | `<body class="shorts-carousel page-shorts">` with `ytm-crawler-description.ytmCrawlerDescriptionHost` and player/control hosts | Route/control inventory only. Shorts cards still use Shorts lockup/reel selectors when present. |
| Mobile ads/promos | desktop ad slot tags only | `ytm-companion-slot.ytmCompanionSlotRendererHost`, `ytm-companion-ad-renderer.YtmCompanionAdRendererHost`, `ytm-visit-site-cta-renderer.ytmVisitSiteCtaRendererHost` | Hidden only when `hideSponsoredCards` is enabled. |
| Watch/player controls | older player controls | `ytm-custom-control.ytmCustomControlHost`, `ytm-watch-player-controls.ytmWatchPlayerControlsHost`, `ytm-crawler-description.ytmCrawlerDescriptionHost` | Inventory only. These are player/description controls, not feed cards. |

### Mobile dismissible injected rich shelves (2026-07-20, updated 2026-07-25)

Source capture:
`a981f773-c881-4924-82a4-8ef54a7a1fe8/pasted-text.txt` (local Codex
attachment). YouTube mobile web inserted this as a Home/feed rich section. The
capture contains eight video lockups from WION, CNN-News18, NDTV, Times Now,
India Today, ET Now, moneycontrol, and DNAIndiaNews.

The 2026-07-25 continuation JSON and matching DOM prove this is a renderer
family, not a title-specific `Breaking news` case. The same outer
`ytm-rich-section-renderer -> ytm-rich-shelf-renderer` contract can carry
algorithmic topics, localized subtitles such as
`धर्मेंद्र प्रधान के बारे में खबरें`, and non-news shelves such as
`Watch it again`. Consumers must classify the container from its renderer,
horizontal contents, and shelf menu command. They must not whitelist or reject
it by English title text.

The shelf mixes legacy mobile custom-element names with current camelCase
view-model classes:

```html
<ytm-rich-section-renderer class="rich-section-single-column">
  <div class="rich-section-content">
    <ytm-rich-shelf-renderer
      class="scrollable-shelf rich-shelf-single-column">
      <div class="rich-shelf-header">
        <h2 class="rich-shelf-title">
          <span class="ytAttributedStringHost">Breaking news</span>
          <h3 class="rich-shelf-subtitle">
            <span class="ytAttributedStringHost">Current news topic</span>
          </h3>
        </h2>
        <ytm-menu-renderer class="rich-shelf-menu">
          <ytm-button-renderer class="icon-dismissal">
            <button aria-label="Not interested">
```

The nested `h3` observed inside `h2` means heading level alone is not a safe
selector. Use the explicit `.rich-shelf-title` and `.rich-shelf-subtitle`
classes when the shelf heading or topic is needed.

The horizontal card lane is:

```html
<div class="rich-shelf-content scrollable">
  <ytm-rich-item-renderer>
    <yt-lockup-view-model class="ytLockupViewModelWrapper">
      <div class="ytLockupViewModelHost ytLockupViewModelVertical
                  content-id-bTbKtUf8Qo4
                  ytLockupViewModelCompact ytLockupViewModelFlexNone">
```

Eight `content-id-*` values were observed:

```text
bTbKtUf8Qo4  or891C3u2U4  Stz_SvAzB_s  to65k6IsJqY
iy9y4rfgS4U  OgTS2ZQgwZM  R2ieQStJHWQ  XW1ZpAi07D0
```

| Evidence | Current DOM path | Interpretation |
| --- | --- | --- |
| Card boundary | `ytm-rich-item-renderer` -> `yt-lockup-view-model.ytLockupViewModelWrapper` -> `.ytLockupViewModelHost.ytLockupViewModelVertical` | The lockup is the individual video hide/menu target. The outer rich shelf remains structural. |
| Video ID | `.content-id-{videoId}` and nested `a[href*="/watch?v="]` | Either source can identify the same card. Do not create a second card identity from the preview subtree. |
| Title | `a.ytLockupMetadataViewModelTitle` -> `.ytAttributedStringHost` | Keyword evidence. Its `aria-label` may also contain channel, views, age, and duration. |
| Channel display name | first `.ytContentMetadataViewModelMetadataRow .ytAttributedStringHost` | Display-name evidence only. It is not an authoritative UC ID. |
| Channel avatar label | `.ytSpecAvatarShapeHost[aria-label^="Go to channel "]` | Semantic channel-name hint. The captured static DOM does not expose a stable channel link or UC ID here. Resolve identity from captured JSON/cache or a bounded lookup when channel rules require it. |
| Views and relative time | later `.ytContentMetadataViewModelMetadataRow` spans separated by `.ytContentMetadataViewModelDelimiter` | Metadata only; do not concatenate it into channel identity. |
| Duration | `yt-thumbnail-badge-view-model .ytBadgeShapeText` | Video-duration evidence. |
| Per-card menu | `.ytLockupMetadataViewModelMenuButton button[aria-label="More actions"]` | Native card menu anchor. It is separate from the shelf-level Not interested control. |
| Shelf dismiss | `ytm-menu-renderer.rich-shelf-menu ytm-button-renderer.icon-dismissal button[aria-label="Not interested"]` | YouTube feedback for the whole shelf, not a FilterTube channel-block command. |

The matching JSON shelf contract is:

```text
onResponseReceivedActions[]
  .appendContinuationItemsAction.continuationItems[]
  .richSectionRenderer.content.richShelfRenderer
```

- Title: `.title.runs[].text`
- Optional topic/subtitle: `.subtitle.runs[].text`
- Ordered horizontal cards:
  `.contents[].richItemRenderer.content.lockupViewModel`
- Shelf dismissal button:
  `.menu.menuRenderer.topLevelButtons[].buttonRenderer`
- Dismissal identity: `.icon.iconType == "DISMISSAL"`
- Accessible label: `.accessibilityData.accessibilityData.label`, falling back
  to `.tooltip`
- Write URL:
  `.serviceEndpoint.commandMetadata.webCommandMetadata.apiUrl` -> observed
  `/youtubei/v1/feedback`
- Feedback token:
  `.serviceEndpoint.feedbackEndpoint.feedbackToken`
- Immediate presentation instruction:
  `.serviceEndpoint.feedbackEndpoint.uiActions.hideEnclosingContainer` ->
  `true`

The shelf container and its server-feedback command have different
availability. A 2026-07-25 signed-out Android MWEB Home continuation rendered
the same horizontal `richShelfRenderer` without an enabled shelf-level
`DISMISSAL` command. Consumers may still expose a local close affordance for
the current retained page, but they must not fabricate a feedback token or
claim that YouTube recorded `Not interested` when the command is absent.

The feedback request posts that token to
`https://m.youtube.com/youtubei/v1/feedback?prettyPrint=false`. A successful
captured response reported
`feedbackResponses[].isProcessed == true`. This is the authoritative
shelf-level `Not interested` mutation. It is not interchangeable with any
per-card `menuServiceItemRenderer` feedback token.

One card in the capture had an active inline-preview subtree:

```html
<div id="video-preview-portal">
  <ytm-video-preview class="ytmVideoPreviewHost ytmVideoPreviewHostShow">
    <a class="ytmVideoPreviewNavigationEndpoint" href="/watch?v=bTbKtUf8Qo4">
    <yt-inline-player-controls class="ytInlinePlayerControlsHost">
```

`#video-preview-portal`, `ytm-video-preview`, its player controls, storyboard,
progress controls, and mute/closed-caption buttons are transient children of
the existing lockup. They must not become independent filtering targets or
cause duplicate identity/menu enrichment.

Filtering boundaries for this shelf:

1. Filter each `yt-lockup-view-model` independently using its video/title and
   resolved channel evidence.
2. Do not hide `ytm-rich-section-renderer` merely because one child matches.
   The shelf may be collapsed only after every real card is hidden, or through
   an explicit shelf-level content control.
3. `Breaking news` and the subtitle are shelf/topic text, not channel names.
4. Anchor quick-block and fallback menus to the individual lockup, never the
   rich-section, rich-shelf, preview player, or shelf dismissal control.
5. Do not infer a UC ID from WION/CNN-News18-style display labels. This DOM
   snapshot proves names, while authoritative channel identity must come from
   JSON, an existing identity map, or a bounded resolver.

Status: **DOM and JSON renderer/action family inventoried. FilterTubeApp
Android now retains these shelves as titled horizontal lanes and executes the
captured shelf-level dismissal contract; extension runtime support is not
claimed here.**

### Mobile upcoming-premiere Watch DOM (2026-07-21)

Source captures:

- `b18a9163-5394-40c8-817f-e5260fcbbca1/pasted-text.txt` contains the rendered
  mobile Watch metadata/action area.
- The matching player-placeholder fragment and the streamed `get_watch`
  response for video `rpPpyanUiPo` were supplied with the capture. Exact JSON
  authority paths are documented in `docs/json_paths_encyclopedia.md` under
  `MWEB Upcoming Premiere (get_watch)`.

The upcoming premiere uses a player error-overlay container to render a
semantic waiting-room slate:

```html
<div class="player-size player-placeholder">
  <div class="player-error-overlay">
    <ytm-live-streamability-renderer
      class="ytmLiveStreamabilityRendererHost">
      <ytm-live-stream-offline-slate-renderer>
        <img class="slate-thumbnail ...">
        <div class="slate-overlay"></div>
        <div class="slate-bar">
          <div class="slate-bar-text slate-bar-main-text">
            <span class="ytAttributedStringHost">Premieres in 3 days</span>
          </div>
          <div class="slate-bar-text slate-bar-subtitle-text">
            <span class="ytAttributedStringHost">July 24 at 10:30 PM</span>
          </div>
        </div>
      </ytm-live-stream-offline-slate-renderer>
    </ytm-live-streamability-renderer>
  </div>
</div>
```

`player-error-overlay` is a presentation container in this state. Its presence
does not by itself mean a transport failure or unavailable/deleted video. The
nested `ytm-live-streamability-renderer` and
`ytm-live-stream-offline-slate-renderer`, correlated with JSON
`playabilityStatus.status == LIVE_STREAM_OFFLINE` and
`videoDetails.isUpcoming == true`, identify the upcoming-premiere state.

The separate metadata subtree is:

```html
<ytm-slim-video-metadata-section-renderer>
  <ytm-slim-video-information-renderer>
    <div class="slim-video-information-content
                slim-video-information-empty-badge simplified">
      <h2 class="slim-video-information-title ...">
        <span class="ytAttributedStringHost">Day 22/365 ...</span>
      </h2>
      <span class="slim-video-information-subtitle simplified">
        <span class="slim-video-information-channel-name">@Russianlanguage</span>
        <span class="slim-video-information-like-count">No likes</span>
        <span class="slim-video-information-upload-info">1 waiting</span>
      </span>
      <button class="slim-video-information-show-more">more</button>
    </div>
  </ytm-slim-video-information-renderer>
  <ytm-slim-video-action-bar-renderer>
    <a class="slim-video-owner-icon" href="/@Russianlanguage">
    <ytm-subscribe-button-renderer class="is-subscribed">
  </ytm-slim-video-action-bar-renderer>
</ytm-slim-video-metadata-section-renderer>
```

The owner link's accessibility label includes `Russian with Nastya` and the
subscriber count, while the visual subtitle uses `@Russianlanguage`. The
correlated JSON UC ID `UCXRt-HjEaTF6J6regWoopjw` remains the authoritative
channel identity. The DOM label `1 waiting` is current waiting-room metadata;
despite its placement under `.slim-video-information-upload-info`, it is not an
upload-age label.

The capture ends with the modern comments preview surface:

```html
<ytm-item-section-renderer class="scwnr-content single-column-watch-next-modern-panels">
  <lazy-list>
    <yt-video-metadata-carousel-view-model
      class="ytVideoMetadataCarouselViewModelHost">
      <yt-carousel-title-view-model>Comments</yt-carousel-title-view-model>
      <yt-comment-input-box-carousel-item-view-model>
```

DOM and ownership rules:

| Evidence | Current DOM path | Interpretation |
| --- | --- | --- |
| Upcoming player state | `.player-placeholder .player-error-overlay` -> `ytm-live-streamability-renderer.ytmLiveStreamabilityRendererHost` -> `ytm-live-stream-offline-slate-renderer` | Waiting-room/slate surface. Correlate with JSON playability state; do not classify from `player-error-overlay` alone. |
| Relative premiere label | `.slate-bar-main-text .ytAttributedStringHost` | User-facing relative status only. It becomes stale and is not schedule authority. |
| Localized schedule | `.slate-bar-subtitle-text .ytAttributedStringHost` | Display fallback. Prefer the JSON start timestamp for calculations and locale formatting. |
| Slate thumbnail | `ytm-live-stream-offline-slate-renderer img.slate-thumbnail` | Current-video placeholder artwork, not a playable frame or a separate card. |
| Current title | `ytm-slim-video-information-renderer .slim-video-information-title .ytAttributedStringHost` | Current-video keyword evidence. |
| Channel display/handle | `.slim-video-information-channel-name`, `a.slim-video-owner-icon[href^="/@"]` | Display/handle evidence. Use correlated JSON for authoritative UC identity. |
| Waiting count | `.slim-video-information-upload-info .ytAttributedStringHost[aria-label$=" waiting"]` | Concurrent waiting-room count. Do not parse as published/upload age. |
| Missing duration | No duration/end-time node in the player slate or slim metadata capture | Expected for this upcoming premiere. Do not borrow duration from Watch recommendations or display `0:00` as real media length. |
| Subscribe state | `ytm-subscribe-button-renderer.is-subscribed` | Signed-in YouTube account UI state, not a FilterTube channel-rule state. |
| Comments preview | `yt-video-metadata-carousel-view-model.ytVideoMetadataCarouselViewModelHost` | Engagement surface, not a recommendation/content-card filtering target. |

The slate, current metadata, action bar, comments carousel, and recommendation
list are separate surfaces. Current-video metadata must not be recovered by
searching arbitrary descendant text in the recommendation list. This capture
contains no playable-duration DOM and must not cause source warming or a
generic retry loop until provider playability exposes media formats.

Status: **Upcoming-premiere DOM and its JSON correlation are inventoried. This
entry documents parsing/ownership boundaries; it does not claim a runtime
implementation.**

### Mobile active-LIVE Watch and description panel (2026-07-21)

Source captures:

- `fd4dc846-32dd-4798-8d49-faa073339089/pasted-text.txt` contains the active
  LIVE `get_watch` response for video `a0gQvm4DEms` (`Career Updates and
  Coding`).
- `86561eac-9768-4905-ba3b-790f76728c79/pasted-text.txt` contains its hydrated
  mobile description engagement panel.
- Exact JSON fields and live-state transitions are documented in
  `docs/json_paths_encyclopedia.md` under `MWEB Active LIVE (get_watch)`.

The supplied DOM capture starts at the description sheet, not at the active
player. Therefore this entry does not invent a current-capture player selector
tree. The generic mobile player/control host
`ytm-watch-player-controls.ytmWatchPlayerControlsHost` is already known from
separate DOM inventory, while this capture proves the description-panel shape
below. Player state must still come from the correlated JSON.

The sheet root and current-video header are:

```html
<ytm-engagement-panel class="engagement-panel-use-visibility">
  <ytm-engagement-panel-section-list-renderer
    class="video-description-ep-identifier">
    <div class="engagement-panel-container">
      <h2 class="engagement-panel-section-list-header-title">Description</h2>
      <ytm-structured-description-content-renderer>
        <ytm-video-description-header-renderer>
          <h2 class="header-title">Career Updates and Coding</h2>
          <a class="reel-player-header-channel-endpoint"
             href="/@csharpfritz"
             aria-label="Fritz's Tech Tips and Chatter">
```

The live-specific factoids are rendered as separate semantic objects:

```html
<ytm-view-count-factoid-renderer class="... factoid">
  <factoid-renderer>
    <div role="text" aria-label="19 watching now">
      <span class="ytwFactoidRendererValue">19</span>
      <span class="ytwFactoidRendererLabel">Viewers</span>
    </div>
  </factoid-renderer>
</ytm-view-count-factoid-renderer>

<factoid-renderer class="... factoid">
  <div role="text" aria-label="Started streaming 2 hours ago">
    <span class="ytwFactoidRendererValue">Jul 21</span>
    <span class="ytwFactoidRendererLabel">2026</span>
  </div>
</factoid-renderer>
```

The expanded body contains the creator description, channel information, and
a modern `Video details` list:

```html
<ytm-expandable-video-description-body-renderer>
  <span class="ytAttributedStringHost ...">
    Fritz has some updates to share and let's keep coding
  </span>
</ytm-expandable-video-description-body-renderer>
<ytm-video-description-infocards-section-renderer>
  <a href="/@csharpfritz" class="ytm-video-description-infocards-section-header">
  <a href="/channel/UCfvJirlbRTN-bU9sMWMb_ZQ/videos">Videos</a>
  <a href="/channel/UCfvJirlbRTN-bU9sMWMb_ZQ/about">About</a>
</ytm-video-description-infocards-section-renderer>
<yt-linear-layout-view-model>
  <!-- list items render Date = Jul 21, 2026; Viewers = 19; Likes = 13 -->
</yt-linear-layout-view-model>
```

DOM and ownership rules:

| Evidence | Current DOM path | Interpretation |
| --- | --- | --- |
| Description sheet identity | `ytm-engagement-panel-section-list-renderer.video-description-ep-identifier` | Identifies this engagement panel as the current-video description surface. It is not a content card or recommendation rail. |
| Current title | `ytm-video-description-header-renderer h2.header-title .ytAttributedStringHost` | Current-video title/keyword evidence, correlated to the active Watch video. |
| Channel handle/name | `a.reel-player-header-channel-endpoint[href^="/@"]`, its `aria-label`, and `.reel-player-header-channel-title` | Handle/display-name evidence. The `/channel/UC.../videos` and `/about` links provide the stable UC ID in this capture. |
| Concurrent viewers | `ytm-view-count-factoid-renderer factoid-renderer [role="text"][aria-label$=" watching now"]` | Current concurrent-viewer label. Prefer its semantic accessibility text over positional span scraping. |
| Stream start | `.factoids > factoid-renderer [role="text"][aria-label^="Started streaming "]` | Human-readable start-age/date display. Exact time authority remains JSON `liveBroadcastDetails.startTimestamp`. |
| Description text | `ytm-expandable-video-description-body-renderer collapsible-string .ytAttributedStringHost` | Current creator-provided description text; apply ordinary current-video keyword policy without treating nested links as recommendations. |
| Video details | `yt-linear-layout-view-model yt-list-item-view-model` with semantic title/trailing-label pairs | Localized display facts such as Date, Viewers, and Likes. Pair label and value within the same list item; do not depend on item order. |
| Duration/end time | No duration or fixed ending-time node in this active-LIVE description capture | Expected for open-ended LIVE. Do not display `0:00` or borrow a recommendation duration. DVR availability and seek window come from player state. |

The engagement panel can be opened, closed, or refreshed independently of the
selected player. Its loading must not delay/restart playback, and closing it
must not clear the selected live source. Conversely, its display strings do
not authorize playback, seeking, or source reuse.

State alignment across the two captures:

| Watch state | DOM presentation | JSON correlation | Duration/seek behavior |
| --- | --- | --- | --- |
| Upcoming premiere | `ytm-live-streamability-renderer` -> `ytm-live-stream-offline-slate-renderer` inside the placeholder overlay | `LIVE_STREAM_OFFLINE`, `isUpcoming`, schedule, no streaming data | No real duration and no ordinary seek/play until formats appear. |
| Active LIVE | No active-player DOM fragment was supplied; the description sheet shows `watching now` and `Started streaming ...` while JSON supplies playable HLS/adaptive media | `OK`, `isLive`, `isLiveNow`, streaming data; optional DVR | No fixed end time. Play immediately; seek only inside the current DVR window when enabled. |
| Archived VOD | Normal player/metadata shape when supplied by a fresh response | Ordinary playable VOD state with fixed duration/formats | Show the provider duration/end time and use ordinary bounded VOD readiness. |

Quality selection is media authority, not description DOM authority. For an
active LIVE item, Auto and a manual ceiling such as 1080p/1440p/2160p should
remain attached to the adaptive HLS source. A persisted ceiling can exceed the
current manifest ladder. The existing native settings sheet already lists
qualities per video: a captured non-LIVE source exposed 2160p60 and 1440p60,
whereas the tested LIVE sheet correctly stopped at 1080p. The unresolved state
is the effective selected rendition, which must not be inferred from a hidden
persisted ceiling. The supplied active-LIVE JSON ladder tops out at 1080p. Downstream Pixel
evidence showed that fixed 1080p progressive playback could freeze on an
absolute LIVE timestamp, while HLS started immediately and remained continuous.
The accepted implementation therefore constrains HLS by the requested maximum
height and permits temporary adaptive step-down rather than rebuilding LIVE as
progressive media.

Status: **Active-LIVE description DOM and its JSON correlation are
inventoried. Exact active-player DOM remains uncaptured here; no selector or
runtime implementation is claimed from absent evidence.**

### Mobile Home active-LIVE card and inline preview (2026-07-21)

Source capture:

- `344f990e-eb01-4891-af2a-d7492a633763/pasted-text.txt` contains the mobile
  Home rich item for the same active broadcast, video `a0gQvm4DEms`.

The stable content-card ownership tree is:

```html
<ytm-rich-item-renderer class="rich-item-single-standard-column is-in-first-column">
  <yt-lockup-view-model class="ytLockupViewModelWrapper">
    <div class="ytLockupViewModelHost ... content-id-a0gQvm4DEms">
      <a class="ytmVideoPreviewNavigationEndpoint" href="/watch?v=a0gQvm4DEms">
      <a class="ytLockupViewModelContentImage" href="/watch?v=a0gQvm4DEms&amp;pp=...">
```

The active inline preview is a transient child of that card:

```html
<div id="video-preview-portal">
  <ytm-video-preview class="ytmVideoPreviewHostShow">
    <div class="html5-video-player ytp-livebadge-color playing-mode">
```

Both the inline preview layer and the static thumbnail expose the same live
badge shape:

```html
<yt-thumbnail-overlay-badge-view-model>
  <yt-thumbnail-badge-view-model>
    <badge-shape class="ytBadgeShapeThumbnailLive">
      <div class="ytBadgeShapeText">LIVE</div>
```

The card title link accessibility label includes the identity and concurrent
count: `Career Updates and Coding by Fritz's Tech Tips and Chatter 21
watching`. The metadata row separately renders the channel and `21 watching`.
There is no duration badge; the semantic `LIVE` badge owns that overlay slot.

| Evidence | DOM path | Ownership/parsing rule |
| --- | --- | --- |
| Stable video identity | `.content-id-a0gQvm4DEms`, `.ytmVideoPreviewNavigationEndpoint[href*="v=a0gQvm4DEms"]`, `.ytLockupViewModelContentImage[href*="v=a0gQvm4DEms"]` | Correlate all preview/static layers to one Home card and one video ID. |
| Active LIVE badge | `badge-shape.ytBadgeShapeThumbnailLive .ytBadgeShapeText` -> `LIVE` | Mark the card active LIVE and suppress ordinary duration parsing. Duplicate preview/static badges are one semantic state, not two cards. |
| Concurrent viewers | title-link `aria-label` suffix and the card metadata row -> `21 watching` | Display/concurrency metadata; do not parse as upload age or fixed views. |
| Inline preview | `#video-preview-portal > ytm-video-preview.ytmVideoPreviewHostShow` | Transient media child owned by the outer lockup. Never make it an independent filter/preload/card target. |
| Preview progress | `.ytp-play-progress`/ARIA reports approximately `99%` to `100%` | This is proximity to the current live edge, not VOD completion and not evidence of a fixed end time. |
| Missing duration | No duration badge in either thumbnail layer | Expected for LIVE. Do not synthesize `0:00` or borrow a nearby card duration. |

This Home DOM correlates to the active `get_watch` JSON documented below by
video ID. The Home card provides a probable-tap hint and display state; fresh
Watch/player authority still decides whether the broadcast is upcoming,
active, ended, DVR-seekable, and currently playable.

Status: **Mobile Home active-LIVE card/preview ownership is inventoried from
the supplied DOM.**

### Mobile ended-LIVE replay across Search, Watch, and description (2026-07-21)

Correlated captures for video `OAzAu0PbpqM`, `🔴PRACTICING FOR ENC TEAM
DENMARK🔴`:

- `7a5069c5-b250-47d8-80be-2fe51086a4cd/pasted-text.txt`: hydrated mobile
  Search result with an inline preview;
- `c41a5a39-0b2a-4660-8e22-2032b6a449bd/pasted-text.txt`: the server-rendered
  mobile Search document (`/results?...`), whose `ytInitialData` owns the
  result card;
- `04125704-0cb0-493f-a32d-86efd22237b2/pasted-text.txt`: streamed
  `get_watch` response after the replay was opened;
- `565fbd7b-3aff-4e83-881d-52c057ab744d/pasted-text.txt`: hydrated mobile
  Watch DOM;
- `FilterTubeApp/docs/app/native-owned-main/Description_sheet.html`: complete
  first-load Watch document and hydrated description panel; and
- `db40dbee-08bf-47fb-b0cd-0b98035c7fa9/pasted-text.txt`: comments engagement
  panel. This last capture is comments evidence, not description evidence.

The Search result is an ordinary finite replay card even though the title
retains the creator's red-circle glyph and the preview player still carries a
generic `ytp-livebadge-color` class:

```html
<ytm-video-with-context-renderer class="item adaptive-feed-item">
  <ytm-video-preview class="ytmVideoPreviewHostShow">
    <video title="🔴PRACTICING FOR ENC TEAM DENMARK🔴">
  <a href="/watch?v=OAzAu0PbpqM&amp;pp=...">
  <span aria-label="... 20,005 views Streamed 20 hours ago 9 hours, 46 minutes">
  <span>20K views</span>
  <span>Streamed 20 hours ago</span>
```

No `ytBadgeShapeThumbnailLive` badge or `watching now` label exists on this
card. The title glyph and a player CSS class are therefore insufficient LIVE
signals. The semantic tuple is finite duration + `Streamed ... ago` + ordinary
views, correlated to the ended player response.

The Watch DOM confirms the archived presentation:

```html
<ytm-single-column-watch-next-results-renderer class="watch-content ...">
  <ytm-slim-video-information-renderer>
    <h2>🔴PRACTICING FOR ENC TEAM DENMARK🔴</h2>
    <span aria-label="20,007 views">20K views</span>
    <span aria-label="Streamed 1 day ago">Streamed 1 day ago</span>
```

The first-load Watch document embeds both `ytInitialData` and
`ytInitialPlayerResponse`. Its description panel is keyed by
`video-description-ep-identifier` and contains:

```html
<ytm-structured-description-content-renderer>
  <ytm-video-description-header-renderer>
    <!-- title, Mande, 20,009 views, Streamed live on Jul 20, 2026 -->
    <sentiment-factoid-renderer><!-- 225 Likes for INDIFFERENT --></sentiment-factoid-renderer>
    <factoid-renderer aria-label="20,009 views"></factoid-renderer>
    <factoid-renderer aria-label="Streamed live on Jul 20, 2026"></factoid-renderer>
    <!-- clickableMetadataButtons: #mande, #apexpredator, #apexseason28 -->
  <ytm-expandable-video-description-body-renderer>
    <!-- attributedDescriptionBodyText creator body -->
  <ytm-video-attributes-section-view-model>
    <!-- Games: Apex Legends (2019), footer category Gaming -->
```

| Evidence | Ownership/parsing rule |
| --- | --- |
| `ytInitialData` in first-load `/watch` document | Server-rendered Watch UI authority. Parse the exact current-video renderers; do not wait for a navigation-only XHR before exposing already embedded description data. |
| `ytInitialPlayerResponse` in first-load `/watch` document | Initial playability/media authority for a full document navigation. It is distinct from `ytInitialData`. |
| Streamed `get_watch` array on same-tab navigation | Split by `responseType` into player and Watch-next authorities; never assume array order or recursively mix recommendations into current metadata. |
| Search/Watch `Streamed ... ago` | Archived-broadcast display state, not active LIVE. |
| Fixed `9:46:56` duration in the supplied archived capture | Ordinary finite replay duration. A separate stream that ends while selected may finalize to a different event duration; use that video's fresh player/timeline authority. |
| Ended-LIVE quality/source selection | The fresh archived response owns a finite media contract. Do not retain the active HLS live-head source or its adaptive ceiling solely because the video ID and `isLiveContent` origin remain the same. |
| `video-description-ep-identifier` + `attributedDescriptionBodyText` | Exact current-video description. It should populate the native description sheet instead of a perpetual loading placeholder. |
| `videoDescriptionHeaderRenderer.factoid[]` | Structured current-video statistics. `sentimentFactoidRenderer` selects the factoid matching `likeStatusEntity.likeStatus`; ordinary `factoidRenderer.accessibilityText` carries exact views and stream/publish date. Do not flatten these into the creator body. |
| `videoDescriptionHeaderRenderer.clickableMetadataButtons[].buttonViewModel.title` | Description hashtags such as `#mande`; present them as metadata chips and keep their browse endpoints separate from body links. |
| `videoAttributesSectionViewModel` | Optional structured attributes, here the game `Apex Legends`, year `2019`, and footer category `Gaming`. These are description-sheet enrichment, not recommendation cards. |
| `videoDescriptionInfocardsSectionRenderer` | Creator description-sheet card. `sectionTitle`, `sectionSubtitle`, `channelAvatar`, and `channelEndpoint` own the displayed channel identity/subscriber count; current `creatorVideosButton` (plural), legacy `creatorVideoButton`, and `creatorAboutButton` are channel navigation actions. |
| `videoDescriptionInfocardsSectionRenderer.creatorCustomUrlButtons[]` | Creator-defined link actions. Preserve each `buttonViewModel.title`, icon, and exact `onTap.innertubeCommand`; do not flatten these link labels into the creator body, statistics, keywords, or recommendation cards. |
| `linearLayoutViewModel.items[].listItemViewModel` under the exact description panel | Newer structured “Video details” rows. `title.content` identifies Date/Viewers/Likes; Date/Viewers use `trailingLabel.content`, while Likes uses the state-aware `listItemLikeCountViewModel` values. Treat these as schema-compatible fallbacks when equivalent header factoids are absent. |
| Comments panel attachment | Independently owned comments surface; it must not be mistaken for or required by description loading. |

Status: **Ended-LIVE replay Search/Watch/description ownership is inventoried
and correlated to the streamed player response.**

### Mobile Watch chapters across description and player (2026-07-22)

Source captures:

- `FilterTubeApp/docs/app/native-owned-main/chapters.html` contains the
  description-sheet horizontal shelf, the exact `get_watch` chapter engagement
  panel, and the hydrated full Chapters panel; and
- `FilterTubeApp/docs/app/native-owned-main/player.html` contains the active
  mobile player DOM and its `View Chapters` control.

The description sheet exposes a summary shelf rather than a second chapter
model:

```html
<div class="horizontal-card-list-container macromarker">
  <ytm-rich-list-header-renderer>
    <button aria-label="View all">...</button>
  </ytm-rich-list-header-renderer>
  <ytm-macro-markers-list-item-renderer>...</ytm-macro-markers-list-item-renderer>
</div>
```

`View all` targets the dedicated current-video panel:

```html
<ytm-engagement-panel-section-list-renderer
  class="engagement-panel-macro-markers-description-chapters">
  <ytm-macro-markers-list-renderer>
    <ytm-macro-markers-list-item-renderer>...</ytm-macro-markers-list-item-renderer>
  </ytm-macro-markers-list-renderer>
</ytm-engagement-panel-section-list-renderer>
```

The player exposes the same model through
`.ytwPlayerTimeDisplayPlayerBarActionContainer button[aria-label="View Chapters"]`.
This is a player-control entry point, not evidence for a separate player or
media source.

| Evidence | Ownership/parsing rule |
| --- | --- |
| `panelIdentifier == "engagement-panel-macro-markers-description-chapters"` | Exact current-video Chapters panel. Do not collect marker renderers from unrelated engagement panels. |
| `macroMarkersListRenderer.contents[].macroMarkersListItemRenderer` | Ordered chapter list. Preserve server order while treating the exact start time as identity. |
| `.title` + `.timeDescription.simpleText` | Visible chapter title and timestamp. The accessibility time is presentation support, not a different seek target. |
| `.thumbnail.thumbnails[]` | Chapter-frame candidates. Select a bounded suitable image; do not download video ranges to synthesize chapter art. |
| `.onTap.watchEndpoint.videoId` or Watch URL | Correlates the action to the selected video. Reject a chapter action after the Watch owner changes. |
| Description `View all` and player `View Chapters` | Two entry points to one owned chapter list/panel. Neither may mutate recommendation, queue, or History ownership. |
| `.ytm-macro-markers-list-item-endpoint.selected` | Presentation of the chapter containing the current player time. It is derived from playback position and chapter boundaries. |

Status: **Mobile description/player chapter DOM and the exact chapter-panel
renderer contract are inventoried from the supplied captures.**

The 2026-07-21 active-LIVE description fragments
`b6c99789-4255-4420-94b7-13bfbc1ec37d/pasted-text.txt` (panel header through
body) and `0e8eb834-4039-4b5e-98d9-4be023e02976/pasted-text.txt` (creator
infocard through response tail) confirm that these rows coexist in one
`video-description-ep-identifier` panel. For `RUST WEB FRAMEWORKS`, the
creator card reports `Francesco Ciulla`, `343K subscribers`, channel
Videos/About endpoints, and creator-defined YouTube/external links. Its Video
details rows report `Jul 21, 2026`, `20` viewers, and an entity-backed `20`
likes. These are general renderer contracts, not values to hard-code for that
video.

### Mobile hashtag browse page (2026-07-21)

Source capture:

- `FilterTubeApp/docs/app/native-owned-main/hashtag.html` contains the complete
  signed-in mobile document for `/hashtag/apexpredator?ra=m`, the explicit
  `youtubei/v1/browse` continuation response, and the hydrated DOM.
- `FilterTubeApp/docs/app/native-owned-main/FEhashtag.JSON` supplements that
  document with an explicit selected-Shorts Browse response after the
  `YT SHORTS JSON` marker, an explicit selected-All Browse response after the
  `YT NORMAL VIDEO JSON` marker, and a hydrated selected-Shorts DOM after the
  `DOM HASHTAG PAGE` marker. The earlier `get_watch` payload in the same capture
  is description/Watch authority, not the hashtag page response.

This surface is visually search-like, but its provider contract is a dedicated
Browse page. The initial command, both tabs, and continuation all use
`browseId == "FEhashtag"`; this must not be normalized as an ordinary
`/results?search_query=...` request.

The initial JSON ownership tree is:

```text
header.pageHeaderRenderer
contents.singleColumnBrowseResultsRenderer.tabs[]
  -> tabRenderer(title = "All", selected = true)
     -> content.richGridRenderer.contents[]
        -> richItemRenderer.content.lockupViewModel
        -> continuationItemRenderer
  -> tabRenderer(title = "Shorts")
     -> content.sectionListRenderer
```

The header exposes `#apexpredator` plus the localized summary `67K videos •
20K channels`. Those counts are display metadata, not exact filtering totals
or continuation bounds. `All` uses `/hashtag/apexpredator`; `Shorts` uses
`/hashtag/apexpredator/shorts`. Both endpoints retain `FEhashtag` with distinct
opaque `params` values.

The hydrated DOM confirms the same composition:

```html
<ytm-browse class="YtmBrowseHost">
  <yt-page-header-renderer>
    <yt-page-header-view-model>
      <yt-dynamic-text-view-model>
        <h1 aria-label="#apexpredator">#apexpredator</h1>
      </yt-dynamic-text-view-model>
      <yt-content-metadata-view-model>
        <!-- 67K videos • 20K channels -->
  <ytm-single-column-browse-results-renderer class="modern-tabs">
    <yt-tab-shape tab-title="All" aria-selected="true">
    <yt-tab-shape tab-title="Shorts" aria-selected="false">
    <ytm-rich-grid-renderer class="is-hashtag rich-grid-single-column">
      <ytm-rich-item-renderer>
        <yt-lockup-view-model class="ytLockupViewModelWrapper">
```

The supplemental selected-Shorts DOM changes the active grid shape rather than
the route family:

```html
<yt-tab-shape tab-title="All" aria-selected="false">
<yt-tab-shape tab-title="Shorts" aria-selected="true">
<div class="tab-content" tab-title="All" hidden>
<div class="tab-content" tab-title="Shorts">
  <ytm-rich-grid-renderer
    class="is-shorts is-shorts-gallery is-hashtag rich-grid-single-column">
    <ytm-rich-item-renderer class="is-shorts">
      <ytm-shorts-lockup-view-model>
```

The selected-Shorts JSON has `Shorts.selected == true` and places its cards in
`Shorts.content.richGridRenderer`; the selected-All response has
`All.selected == true`, uses `All.content.richGridRenderer`, and leaves the
unselected Shorts placeholder in `Shorts.content.sectionListRenderer`.
Therefore consumers must select the active `tabRenderer` semantically and must
not assume that Shorts always uses one fixed container shape.

Per-card identity and filtering reuse the modern lockup contract already
inventoried for Home/Search:

| Evidence | Path / DOM | Ownership rule |
| --- | --- | --- |
| Video identity | `lockupViewModel.contentId`, `...onTap.innertubeCommand.watchEndpoint.videoId`, `.content-id-*`, and the `/watch?v=...` anchor | These must agree on one card. Do not treat thumbnail, avatar, or inline-preview descendants as separate items. |
| Title | `metadata.lockupMetadataViewModel.title.content` | Current card keyword evidence. A hashtag inside a title remains title text; it is not page identity. |
| Channel identity | decorated-avatar `...onTap.innertubeCommand.browseEndpoint.browseId` | Authoritative UC identity when present. The visible name and avatar accessibility label are display fallbacks. |
| Channel/name/views/age | `contentMetadataViewModel.metadataRows[].metadataParts[]` | Keep the parts paired with their card. Do not promote `views`/`days ago` into header counts. |
| Thumbnail/duration | `contentImage.thumbnailViewModel.image.sources[]` and overlay badge view models | Ordinary card presentation/readiness evidence. LIVE/Shorts badges still override duration semantics where present. |
| Card action menu | `lockupMetadataViewModel.menuButton.buttonViewModel.onTap...showSheetCommand` | User-gesture action surface; it is not extra card metadata or a continuation. |

The selected Shorts grid uses a separate compact contract:

| Evidence | JSON path | Ownership rule |
| --- | --- | --- |
| Short identity | `shortsLockupViewModel.onTap.innertubeCommand.reelWatchEndpoint.videoId` | Authoritative selected Short id; it must agree with the `/shorts/<id>` command URL and the `shorts-shelf-item-<id>` entity suffix. |
| Visible title/a11y | `shortsLockupViewModel.accessibilityText` | Combined title/view accessibility evidence; parse view text separately when `overlayMetadata.secondaryText.content` is present. |
| Thumbnail | `shortsLockupViewModel.thumbnailViewModel.thumbnailViewModel.image.sources[]` | Portrait card artwork only; the separate reel endpoint frame thumbnail belongs to playback handoff. |
| Views | `shortsLockupViewModel.overlayMetadata.secondaryText.content` | Localized display metric such as `1.7M views`; it is not page/cardinality metadata. |
| Playback command | `shortsLockupViewModel.onTap.innertubeCommand.reelWatchEndpoint` | User-selected Shorts route/session input. Sequence/player/tracking values are not permission to preload the entire sequence. |

Initial pagination is owned by the terminal
`richGridRenderer.contents[].continuationItemRenderer`. It posts its opaque
`continuationCommand.token` to `/youtubei/v1/browse`. The captured response
uses
`onResponseReceivedActions[].appendContinuationItemsAction.continuationItems`
and targets `browse-feedFEhashtag`; its returned terminal continuation repeats
`CONTINUATION_TRIGGER_ON_ITEM_SHOWN`. Append only to the same hashtag/tab
scope. A refreshed hashtag, switched tab, changed profile/account/session, or
incompatible route epoch must invalidate outstanding continuation ownership.

Runtime boundary:

- treat the page as a dedicated `FEhashtag` Browse scope even if its card grid
  can reuse Search/Home normalization and bounded visible/near-visible
  readiness;
- apply FilterTube rules to each normalized video/Short/channel card before
  admission. The page title itself is navigation/query context and must not
  whitelist matching cards or bypass channel/keyword/time rules;
- keep `All` and `Shorts` as separate tab/continuation scopes; and
- never persist or replay captured per-session `params`, tracking values,
  continuation tokens, visitor data, or response IDs. A bare-text hashtag may
  construct only the stable initial All envelope documented in the JSON paths
  encyclopedia; the returned endpoint remains authoritative.

#### FilterTubeApp Android implementation boundary (2026-07-22)

The native Android frontend now implements an explicit `FEhashtag` owner rather
than routing hashtag taps through generic Search:

- exact description-sheet hashtag endpoints are retained from
  `clickableMetadataButtons`, attributed-body `commandRuns`, and the under-title
  badge when present;
- description chips/body text and comment/reply text are clickable;
- a matching exact endpoint wins. Bare hashtag text constructs only the
  deterministic initial All request envelope; the response remains authority
  for its canonical tabs, cards, tracking, and continuation;
- `MAIN_HASHTAG` posts to `/youtubei/v1/browse`, normalizes the header, modern
  video/Short lockups, tab endpoints, and continuation, then applies FilterTube
  decisions before card admission; and
- visible/near-visible cards reuse the shared bounded Main readiness path.

YouTube's All/Shorts endpoints are parsed and retained as separate scopes, but
the accepted FilterTubeApp presentation intentionally omits the hashtag tab
rail and shows the mixed All feed as a simple search-like page. This does not
change its provider family to Search, does not merge tab continuations, and does
not remove the upstream renderer inventory above. Channel pages independently
retain already visited tab pages so revisiting a channel tab does not reload it.

Status: **Initial, selected-All, selected-Shorts, continuation, and hydrated DOM
contracts are inventoried. FilterTubeApp Android has an installed native
`FEhashtag` route with working description/comment navigation and a deliberately
simple no-tab presentation. No extension-runtime implementation is claimed by
this status.**

New nodes/classes to inventory:

| DOM node/class | Meaning | Status | Runtime path |
| --- | --- | --- | --- |
| `<ytm-browse class="YtmBrowseHost">` | Mobile Home/Browse page wrapper | ℹ️ Wrapper only | Route detection only; not a card selector |
| `<ytm-media-item>` | Current mobile media card body | ✅ Supported | `js/content/dom_extractors.js`, `js/content/dom_fallback.js`, `js/content_bridge.js`, `js/content/block_channel.js` |
| `<ytm-video-card-renderer>` | Current mobile horizontal video card | ✅ Supported | Shared card selectors, quick-block, fallback menu, channel extraction, and DOM fallback |
| `.YtmCompactMediaItemHost` | Current class-only mobile media card body | ✅ Supported | Shared card selectors, quick-block, fallback menu, and channel extraction |
| `.YtmCompactVideoRendererHost` | Current class-only mobile compact video card host | ✅ Supported | Shared card selectors, quick-block, fallback menu, and channel extraction |
| `.ytmPlaylistPanelVideoRendererV2Host` | Current mobile Watch/Mix playlist row | ✅ Supported | Shared playlist row detection, quick-block, fallback menu, and channel extraction |
| `.YtmCompactRadioRendererHost` | Current class-only mobile radio/Mix card | ✅ Supported | Shared card selectors, quick-block, fallback menu, and YTM watch-like collaborator checks |
| `<ytm-compact-channel-renderer class="YtmCompactChannelRendererHost">` | Mobile channel/search result card | ✅ Supported | Shared card selectors, quick-block, DOM fallback channel/title extraction |
| `<yt-lockup-view-model class="ytLockupViewModelWrapper">` inside YTM | New lockup card shape reused by mobile Home | ✅ Supported | Shared lockup card/video-id extraction |
| `.ytLockupViewModelHost` | Lockup inner class-only content shell | ✅ Supported | Shared card selectors and quick-block climbing |
| `<a class="ytLockupViewModelContentImage">` | Lockup thumbnail/video URL | ✅ Metadata source | `extractVideoIdFromCard()` |
| `<ytm-backstage-post-renderer class="ytmBackstagePostRendererHost">` | Mobile community post card | ✅ Supported | Shared card selectors, quick-block card discovery, post channel extraction |
| `<ytm-backstage-post-thread-renderer class="ytmBackstagePostThreadRendererHost">` | Mobile community post thread/container | ✅ Supported | Shared card selectors and quick-block card discovery |
| `.ytmBackstagePostRendererHostContentText` | Mobile community post body text | ✅ Supported | DOM fallback keyword/post text extraction |
| `<yt-post-header class="ytPostHeaderHost">` | Community post author/header | ✅ Metadata source | Post author channel extraction |
| `<ytm-channel-thumbnail-with-link-renderer class="YtmChannelThumbnailWithLinkRendererHost">` | Mobile channel avatar/link host | ✅ Metadata source | YTM channel identity extraction |
| `<ytm-badge-and-byline-renderer class="YtmBadgeAndBylineRendererHost">` | Mobile byline/view/badge row | ✅ Metadata source | YTM channel/byline extraction |
| `<yt-comment-action-buttons-renderer class="ytCommentActionButtonsRendererHost">` | Like/comment/share action row for posts | 🚫 Control only | Do not hide as content card |
| `<yt-touch-feedback-shape class="ytSpecTouchFeedbackShapeHost ...">` | YouTube touch/ripple target | 🚫 Control only | Do not use as identity or hide target |
| `<ytm-chip-cloud-renderer class="YtmChipCloudRendererHost chip-bar">` | Mobile Watch chip UI | 🚫 Watch chips only | Route-gated chip boundary |
| `<ytm-search class="ytmSearchPageHost">` | Mobile Search page wrapper | ℹ️ Wrapper only | Route detection/context only; not a card selector |
| `<ytm-collage-hero-image-renderer class="YtmCollageHeroImageRendererHost">` | Search/watch-card hero image collage | ℹ️ Visual subcomponent | Parent supported card owns filtering |
| `<ytm-call-to-action-button-renderer class="YtmCallToActionButtonRendererHost">` | Search/watch-card CTA button | 🚫 Control only | Do not hide as a content card |
| `<ytm-companion-slot class="ytmCompanionSlotRendererHost">` | Mobile companion ad slot | ⚠️ Sponsored-only | Hidden by `hideSponsoredCards` |
| `<ytm-companion-ad-renderer class="YtmCompanionAdRendererHost">` | Mobile companion ad creative | ⚠️ Sponsored-only | Hidden by `hideSponsoredCards` |
| `<ytm-visit-site-cta-renderer class="ytmVisitSiteCtaRendererHost">` | Mobile ad/link CTA | ⚠️ Sponsored-only | Hidden by `hideSponsoredCards` |
| `<ytm-crawler-description class="ytmCrawlerDescriptionHost">` | Mobile watch/shorts crawlable description | ℹ️ Metadata/control | Inventory only for now |
| `<ytm-custom-control class="ytmCustomControlHost">` | Mobile player custom control | 🚫 Control only | Do not hide as content card |
| `<ytm-watch-player-controls class="ytmWatchPlayerControlsHost">` | Mobile watch player controls | 🚫 Control only | Do not hide as content card |
| `.shortsLockupViewModelHostThumbnailParentContainer*`, `.shortsLockupViewModelHostMetadata*`, `.shortsLockupViewModelHostInlineMetadata*`, `.shortsLockupViewModelHostOutsideMetadata*` | Mobile Shorts child wrappers/metadata | ✅ Child sources only | Parent `.shortsLockupViewModelHost` / `ytm-shorts-lockup-view-model` remains the hide target |

Implementation notes after runtime patch:

- `js/content/dom_extractors.js`: shared `VIDEO_CARD_SELECTORS` now includes
  YTM camelCase content host classes, including compact media/radio/channel,
  compact video host, lockup wrapper/inner host, grid shelf item, Shorts host,
  post host classes, and `ytm-video-card-renderer`, in addition to the
  existing YTM tags.
- `js/content/dom_fallback.js`: mobile Home post styling and keyword fallback
  now include `ytm-backstage-post-thread-renderer`,
  `ytmBackstagePostRendererHost`, `ytmBackstagePostThreadRendererHost`, and
  `.ytmBackstagePostRendererHostContentText`; class-only compact media/radio/
  channel/lockup hosts are also treated as YTM content hosts where tag checks
  used to be required.
- `js/content/block_channel.js`: quick-block card discovery now recognizes YTM
  compact media/video/radio/channel classes, lockup classes,
  `ytm-video-card-renderer`, and post tags/classes so the quick block/menu code
  can climb from new inner nodes back to the real card.
- `js/content_bridge.js`: fallback-menu/card handling and YTM identity
  extraction recognize class-only YTM cards alongside the newer YTM
  media/watch-card tags.
- `js/content/dom_fallback.js`: `hideSponsoredCards` now covers mobile YTM
  companion slots/ads and visit-site CTAs.

Caveats:

- `YtmBrowseHost`, `ytmSearchPageHost`, `YtmCollageHeroImageRendererHost`,
  `YtmCallToActionButtonRendererHost`, `ytCommentActionButtonsRendererHost`,
  `ytSpecTouchFeedbackShapeHost`, player control classes, and thumbnail
  overlay host classes are documented but intentionally not treated as cards.
  They are wrappers, controls, or visual subcomponents, and using them as hide
  targets would cause false hides.
- Full parsed evidence from `ytm_new_CamelCase.html` is kept in
  `docs/audit/FILTERTUBE_YTM_CAMELCASE_DOM_INDEX_2026-07-02.md`. That audit
  separates real content-card targets from metadata, child media, controls, and
  page wrappers.
- The sampled YTM DOM still preserves FilterTube state attributes on filtered
  rows, so this sample does not prove YouTube is stripping extension
  attributes. Issue #59 remains a privacy/code-burden cleanup direction, not
  the proven cause of this DOM shift.

### Channel Home, Posts, and Shorts DOM refresh (2026-07-12)

Fixture:
`YTM Channel Page JSON/YTM_You_Page/Channel_POSTS_DOM.html`

The fixture is a capture bundle. Every `++++++ ... ++++++` marker starts a
different DOM surface; do not parse the complete file as one document. It
contains, in order:

1. desktop YTD Posts DOM;
2. mobile YTM channel Posts DOM;
3. mobile YTM channel Shorts DOM; and
4. mobile YTM Pitbull channel Home DOM.

| Captured surface | Outer content hosts | Metadata/content hosts | Correct hide target |
| --- | --- | --- | --- |
| Desktop YTD Posts | `ytd-backstage-post-thread-renderer` -> `ytd-backstage-post-renderer` | `ytd-expander`, `yt-attributed-string`, image/poll/quiz/uploaded-video renderers | Post/thread renderer, never action buttons |
| Mobile YTM Posts | `ytm-backstage-post-thread-renderer.ytmBackstagePostThreadRendererHost` -> `ytm-backstage-post-renderer.ytmBackstagePostRendererHost` | `yt-post-header.ytPostHeaderHost`, `.ytmBackstagePostRendererHostContentText`, `ytm-backstage-image-renderer.ytmBackstageImageRendererHost` | YTM post/thread host, never `ytCommentActionButtonsRendererHost` |
| Mobile YTM channel Shorts | `ytm-rich-item-renderer` -> `ytm-shorts-lockup-view-model.shortsLockupViewModelHost` | `.shortsLockupViewModelHostMetadataTitle`, `.shortsLockupViewModelHostMetadataSubhead`, `yt-thumbnail-view-model` | `ytm-shorts-lockup-view-model` / `.shortsLockupViewModelHost` |
| Mobile YTM channel Home | `ytm-channel-featured-video-renderer`, `ytm-shelf-renderer`, `ytm-compact-video-renderer.YtmCompactVideoRendererHost` | `.YtmCompactMediaItemHeadline`, `.YtmCompactMediaItemByline`, `.YtmCompactMediaItemStats` | Featured-video or compact-video card, not shelf/overlay children |

The Shorts sample contains 48 `ytm-rich-item-renderer` rows and 48
`ytm-shorts-lockup-view-model` cards. Each lockup carries the current camelCase
metadata children and its `/shorts/{videoId}` endpoint. Channel identity may
still be absent from the visible lockup, so the existing bounded Shorts
identity resolver remains necessary when channel rules are active.

The mobile Home sample confirms these current host classes on a channel Home
surface:

```html
<ytm-channel-featured-video-renderer
  class="YtmChannelFeaturedVideoRendererHost">
<ytm-compact-video-renderer class="YtmCompactVideoRendererHost">
  <div class="YtmCompactMediaItemHost">
    <div class="YtmCompactMediaItemHeadline">
    <div class="YtmCompactMediaItemByline">
```

`YtmThumbnailOverlayResumePlaybackRendererHost`, touch-feedback classes, badge
classes, and thumbnail-group classes are children only. They must not become
card identity roots or standalone hide targets.

The desktop post capture also includes poll, quiz, and uploaded-video elements
under every repeated post fixture. Their presence confirms recursive post
content coverage; it does not mean those controls or attachments own the post
channel identity.

#### Mobile channel Home Collaborations shelf

Fixture:
`YTM Channel Page JSON/YTM_You_Page/Channel_HOME_COLLABORATIONS_DOM.html`

The captured DOM is a `ytm-shelf-renderer` headed `Collaborations`, containing
`ytm-vertical-list-renderer` and ten compact video cards:

```html
<ytm-shelf-renderer class="vertical-shelf-separators">
  <h2 class="shelf-title">Collaborations</h2>
  <ytm-vertical-list-renderer>
    <ytm-compact-video-renderer class="YtmCompactVideoRendererHost item">
      <div class="YtmCompactMediaItemHost">
        <h4 class="YtmCompactMediaItemHeadline">...</h4>
        <div class="YtmCompactMediaItemByline">Pitbull and 2 more</div>
```

Observed roles:

| Node/class | Role | Filtering boundary |
| --- | --- | --- |
| `ytm-shelf-renderer` / `ytm-vertical-list-renderer` | Collaborations layout and list | Structural only; never hide the whole shelf for one blocked video |
| `ytm-compact-video-renderer.YtmCompactVideoRendererHost` | Individual collaboration video card | Card/hide target |
| `.YtmCompactMediaItemHeadline` | Visible title and accessible combined label | Keyword/title source |
| `.YtmCompactMediaItemByline` | Visible candidate byline such as `Pitbull and 2 more` | Collaborator lookup trigger only |
| `.YtmCompactMediaItemStats` | Views and age | Metadata only unless a specific rule consumes it |
| `.YtmCompactMediaItemMenu` | Three-dot action button | Control/anchor only |
| `videoThumbnailGroup*`, badge, touch-feedback classes | Thumbnail overlays and controls | Child-only; never identity or hide roots |

The visible DOM does not contain a complete collaborator roster or all UC IDs.
Text such as `Pitbull and 2 more`, `Pitbull and LIL JON`, or `IAMCHINO and 2
more` is sufficient to request exact-video enrichment, but it is not authority
for splitting names. The corresponding Home browse JSON carries
`avatarStackViewModel -> showDialogCommand` with a header-backed
`Collaborators` list. Promote the existing card/menu from that exact-video
roster; do not invent collaborators from `and` text.

#### Mobile channel Description sheet

Marker:
`++++++ Chanenl Page Description SHeet ++++++` in
`YTM Channel Page JSON/YTM_You_Page/Channel_POSTS_DOM.html`.

This is an engagement-panel sheet, not a feed card:

```html
<panel-container>
  <ytm-engagement-panel class="engagement-panel-use-visibility">
    <ytm-engagement-panel-section-list-renderer>
      <ytm-about-channel-renderer class="YtmAboutChannelRendererHost">
```

Current camelCase host inventory:

| Node/class | Meaning | Runtime treatment |
| --- | --- | --- |
| `panel-container`, `ytm-engagement-panel`, `ytm-engagement-panel-section-list-renderer` | Modal/sheet shell | Wrapper only; not a content-card hide target |
| `ytw-scrim.ytWebScrimHost.ytWebScrimHostModernOverlay` | Background scrim and close affordance | Control only |
| `ytm-about-channel-renderer.YtmAboutChannelRendererHost` | Channel About/Description payload | Description-sheet content root; not a feed card |
| `.YtmAboutChannelRendererAboutChannelDescription` | Channel description text | Channel metadata/text source where explicitly needed |
| `.YtmAboutChannelRendererAboutChannelNewLinksContainer` | External links group | Metadata container |
| `yt-channel-external-link-view-model.ytChannelExternalLinkViewModelHost` | One external link row | External metadata; never channel identity authority |
| `.ytChannelExternalLinkViewModelTitle` / `.ytChannelExternalLinkViewModelLink` | Link label and redirected URL | Display/link metadata only |
| `.YtmAboutChannelRendererChannelDetail` | One About detail row | Metadata row |
| `.YtmAboutChannelRendererChannelDetailValue` | Handle, country, join date, subscribers, videos, or views | Metadata value; parse by adjacent meaning/icon rather than row position |
| `.YtmAboutChannelRendererAboutChannelActionButton` | `Report user` action | Control only |
| `yt-light-shape` and `contribYtLightShape*` classes | Decorative button lighting | Decoration only |

Observed text groups are Description, Links, and More info. The More info rows
include channel URL/handle, country, join date, subscriber count, video count,
and total views. External redirects to Spotify, a website, social profiles, or
other services do not prove another YouTube channel identity and must never be
added to a block/allow list automatically.

The sheet title (`Pitbull`) and visible handle are useful consistency checks,
but exact channel authority should still come from a YouTube channel endpoint
or page-level JSON `channelMetadataRenderer.externalId`. The sheet wrapper,
scrim, buttons, light shapes, and external links must remain outside generic
video-card scanning so opening the Description sheet cannot trigger false
hides or collaborator prefetch.

### Mobile Subscriptions and You-page DOM refresh (2026-07-13)

Fixtures:

- `YTM Channel Page JSON/YTM_SubscriberPage.html`
- `YTM Channel Page JSON/YTM_You_Page/YTM_YOU_PAGE.html`

The You HTML bundle is four concatenated DOM captures, not one simultaneously
mounted page. Its literal section boundaries are:

| Line | Marker | Surface |
| ---: | --- | --- |
| 1 | `++++++ YOU PAGE ++++++` | You overview |
| 11606 | `++++++ YOU PAGE SETTINGS ++++++` | Settings |
| 12009 | `++++++ YOU PAGE HISTORY SHEET ++++++` | Full History |
| 44993 | `++++++ YOU PAGE PLAYLISTS with A-Z and Recently Added sorting filter ++++++` | Full Playlists |

Split on those markers before counting or classifying hosts. Counts across the
whole file otherwise mix four different route snapshots.

#### Subscriptions page

| Zone | Main hosts | Runtime boundary |
| --- | --- | --- |
| Subscribed-channel selector | `ytm-channel-list-sub-menu-renderer.YtmChannelListSubMenuRendererHost` -> `ytm-channel-list-sub-menu-avatar-renderer.YtmChannelListSubMenuAvatarRendererHost` | Navigation/import source only; never a video hide target |
| Video feed | `ytm-rich-item-renderer` -> `ytm-video-with-context-renderer` -> `ytm-media-item` | Individual video card hide/filter target |
| Shorts shelf | `ytm-rich-section-renderer` -> `ytm-reel-shelf-renderer` -> `ytm-shorts-lockup-view-model.shortsLockupViewModelHost` | Individual Shorts lockup target; shelf stays structural |

Current metadata/control classes:

- `YtmChannelThumbnailWithLinkRendererHost`: channel endpoint/avatar source;
- `YtmBadgeAndBylineRendererHost` and
  `YtmBadgeAndBylineRendererItemByline`: visible byline source;
- `YtmChannelListSubMenuAvatarRendererProfileIcon`: subscribed-channel avatar;
- `YtmContinuationItemRendererHost`: loading/next-page row;
- `videoThumbnailGroup*`, badge, touch-feedback, and menu classes: child or
  control-only.

The avatar strip contains 60 handles/display names but generally no visible UC
IDs. It supports explicit user-approved subscription import; rendering or
tapping an avatar must never mutate FilterTube rules automatically. The feed
contains 18 normal video cards and 15 Shorts lockups.

#### All subscriptions directory

The `++++++ All Subscriptions ++++++` section captures the separate
`/feed/channels` directory, not the Subscriptions video feed:

```html
<ytm-shelf-renderer>
  <ytm-vertical-list-renderer>
    <ytm-channel-list-item-renderer
      class="YtmChannelListItemRendererHost">
      <a class="YtmChannelListItemRendererLink" href="/@handle">
        <div class="YtmChannelListItemRendererThumbnail">
          <ytm-profile-icon>...</ytm-profile-icon>
        </div>
        <h3 class="YtmChannelListItemRendererTitle">Channel</h3>
      </a>
    </ytm-channel-list-item-renderer>
    <ytm-continuation-item-renderer
      class="YtmContinuationItemRendererHost">
  </ytm-vertical-list-renderer>
</ytm-shelf-renderer>
```

Observed counts and states:

- 984 `ytm-channel-list-item-renderer` rows;
- 984 `ytm-profile-icon` avatars;
- 984 each of `YtmChannelListItemRendererHost`, `Link`, `Thumbnail`, and
  `Title`;
- seven `YtmChannelListItemRendererLiveStatus` occurrences; and
- one continuation row.

The row link and title are channel identity/navigation sources. New-content
presentation state and live-status children are status metadata only. These
rows are not video cards, Shorts cards, quick-block hosts, or ordinary content
hide targets. Use them only for explicit channel selection or the reviewed
**Import Subscribed Channels** flow; page rendering must never mutate rules.

#### You overview

The `++++++ YOU PAGE ++++++` section contains:

| Surface | Hosts | Treatment |
| --- | --- | --- |
| Page/profile header | `yt-page-header-renderer`, `yt-page-header-view-model`, avatar and metadata view models | Page/profile metadata only |
| Video shelf | `ytm-horizontal-card-list-renderer` -> `ytm-video-card-renderer` | Individual video card target |
| Playlist shelf | `ytm-horizontal-card-list-renderer` -> `ytm-playlist-card-renderer` -> `yt-collections-stack` | Individual playlist card target |
| Library shortcuts | `ytm-compact-link-renderer.YtmCompactLinkRendererHost` | Navigation control only |

The capture contains 16 video cards, 130 playlist cards, and six compact-link
shortcuts. `radioBottomOverlayHost` and collection-stack classes are playlist
children, not standalone cards or channel identities.

The playlist shelf header navigates to `FEplaylist_aggregation`, while each
`ytm-playlist-card-renderer` keeps its own playlist endpoint. The captured
`Liked videos` preview is an account-maintained playlist card whose stable
target is `VLLL`; it is not a generic label, a Mix, or the aggregation page
itself. Tapping that card opens the Liked-videos playlist. Tapping the shelf's
View all control opens the full account Playlist aggregation route.
`Watch Later` is the parallel special card with stable target `VLWL`.

#### Account switcher menu

Companion DOM capture:

- `/Users/devanshvarshney/.codex/attachments/24448c57-c509-4e45-baa8-43a52eb90534/pasted-text.txt`

```html
<ytm-multi-page-menu-renderer
  data-menu-style="multi-page-menu-style-type-switcher">
  <ytm-simple-menu-header-renderer>Accounts</ytm-simple-menu-header-renderer>
  <ytm-account-section-list-renderer>
    <ytm-google-account-header-renderer>...</ytm-google-account-header-renderer>
    <ytm-account-item-section-renderer>
      <div role="listbox">
        <button role="option" aria-selected="true|false">
          <ytm-account-item-renderer>...</ytm-account-item-renderer>
        </button>
      </div>
    </ytm-account-item-section-renderer>
  </ytm-account-section-list-renderer>
  <ytm-multi-page-menu-section-renderer>
    <ytm-compact-link-renderer>Add account</ytm-compact-link-renderer>
    <ytm-compact-link-renderer>Sign out</ytm-compact-link-renderer>
  </ytm-multi-page-menu-section-renderer>
</ytm-multi-page-menu-renderer>
```

The capture materializes three account-section groups, seven selectable
`ytm-account-item-renderer` rows, one `aria-selected="true"` row, and two footer
actions. `ytm-accounts-dialog-header-renderer` labels the other-account group;
`ytm-account-item-section-header-renderer` labels a Google-login container.

| Host/state | Meaning | Treatment |
| --- | --- | --- |
| `ytm-account-section-list-renderer` | Google-login/channel-profile grouping | Structural/private grouping; never a FilterTube profile key |
| `ytm-google-account-header-renderer` / `ytm-accounts-dialog-header-renderer` | Account-container heading | Presentation only; never content identity |
| `button[role=option][aria-selected]` | Current chooser selection projection | Control state for this DOM epoch, not durable account proof |
| `ytm-account-item-renderer` | Selectable YouTube/Google identity row | Account-switch control; never a filterable channel card |
| `ytm-profile-icon`, visible name, handle, byline | Avatar/display aliases | Renderable aliases only; the DOM supplies no canonical UC authority |
| footer `ytm-compact-link-renderer` | Add-account and sign-out actions | Session controls, not content/filter targets |

The DOM is presentation evidence. The corresponding JSON
`accountItem.serviceEndpoint.selectActiveIdentityEndpoint` is command
authority, and a fresh Guide `Your channel` browse endpoint is canonical-UC
verification after selection. Email/group text, `aria-selected`, avatar,
display name, or an optional handle must never be persisted as the FilterTube
account key. Account rows also stay outside quick-block, keyword filtering,
collaborator lookup, and pre-insertion content quarantine.

#### You Settings

The `++++++ YOU PAGE SETTINGS ++++++` section is control-only:

| Host | Meaning | Treatment |
| --- | --- | --- |
| `ytm-settings.YtmSettingsHost` | Settings page root | Wrapper only |
| `ytm-setting-category-collection-renderer.ytmSettingCategoryCollectionRendererHost` | Expandable category | Control group |
| `ytm-setting-boolean-renderer` with `ytSwitchShapeHost` | Boolean setting | Toggle control |
| `ytm-setting-single-option-menu-renderer` | Language/location/theme-style choice | Menu control |
| `ytm-connected-accounts-setting-category-entry-renderer` | Connected apps | Navigation control |
| `ytm-subscription-products-setting-category-entry-renderer` | Purchases/memberships | Navigation control |

These nodes stay outside content filtering, quick-block injection,
collaborator lookup, and whitelist pending-hide work.

#### You History

The `++++++ YOU PAGE HISTORY SHEET ++++++` capture contains:

- 324 `ytm-compact-video-renderer.YtmCompactVideoRendererHost` cards;
- 75 `ytm-shorts-lockup-view-model.shortsLockupViewModelHost` cards;
- dated groups under `ytm-item-section-renderer` and
  `ytm-item-section-header-renderer`;
- Shorts shelves under `ytm-reel-shelf-renderer`; and
- a `ytm-continuation-item-renderer` next-page row.

Filter normal videos and Shorts per item. Date headers, shelves, topbar
controls, and continuation rows remain structural/control-only. History card
bylines own channel identity; the signed-in You profile header does not.

#### You Playlists and sorting

The `++++++ YOU PAGE PLAYLISTS with A-Z and Recently Added sorting filter
++++++` section contains 130 modern playlist rows:

```html
<ytm-rich-item-renderer>
  <yt-lockup-view-model class="ytLockupViewModelWrapper">
    <yt-collection-thumbnail-view-model>
    <yt-lockup-metadata-view-model>
```

| Class | Meaning | Treatment |
| --- | --- | --- |
| `ytLockupViewModelWrapper` / `ytLockupViewModelHost` | Playlist row | Card root |
| `ytLockupViewModelContentImage` | Playlist endpoint/thumbnail | Metadata child |
| `ytCollectionThumbnailViewModelHost` / `ytCollectionsStackHost` | Collection artwork | Visual child |
| `ytLockupMetadataViewModelTitle` | Playlist title | Title source |
| `ytContentMetadataViewModelMetadataRow` | Owner/count metadata | Metadata source |
| `ytLockupMetadataViewModelMenuButton` | Overflow action | Control anchor only |

This You-page control offers `Recently added` and `A-Z`. It is distinct from
channel-page Playlists, whose capture offers `Date added (newest)` and `Last
video added`. Sort changes replace the grid, so playlist filtering must run on
the reload response.

The full aggregation capture also contains the account-maintained `Liked
videos` row as a modern `lockupViewModel`, with `contentId: "LL"` and browse
target `VLLL`. Its presence in both the overview preview and the full page is
expected route parity, not a duplicate playlist. The overview and aggregation
remain separate response owners and must not share continuation or sort state.
`Watch Later` is represented by `contentId: "WL"` and target `VLWL`.

### Mixed mobile channel Home shelves (2026-07-13)

Fixture: `YTM Channel Page JSON/YTM_DEVANSH_CHANNELPAGE.html`

The channel Home `ytm-horizontal-card-list-renderer` titled `For you` mixes
renderer families in one list:

```html
<ytm-horizontal-card-list-renderer>
  <ytm-rich-list-header-renderer>For you</ytm-rich-list-header-renderer>
  <ytm-shorts-lockup-view-model class="shortsLockupViewModelHost">...</ytm-shorts-lockup-view-model>
  <ytm-video-card-renderer>...</ytm-video-card-renderer>
</ytm-horizontal-card-list-renderer>
```

The complete fixture contains 40 Shorts lockups and four video-card renderers;
the `For you` shelf contains both. It also contains compact videos, compact
channel rows, a featured video, and a separate Shorts shelf.

Filtering contract:

1. Treat the horizontal list as a structural mixed-list host.
2. Dispatch each child by its own renderer family.
3. Hide a matching Shorts item at its Shorts lockup.
4. Hide a matching video at its video-card renderer.
5. Never hide the entire `For you` shelf because one child matches.
6. Never inherit identity from an adjacent child or the shelf title.
7. Use enclosing channel-page identity only as bounded fallback context when
   an individual child omits stronger identity.

This proves renderer dispatch must happen below the shelf level. Assuming all
horizontal-list children share one family will leak or false-hide siblings.

### Home shelf: “Latest YouTube posts” (2025-11-18 sample, NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-rich-section-renderer>` | `richSectionRenderer` | ℹ️ **NEW** – layout | Container around shelf; ensure recursion reaches embedded shelf contents |
| `<ytd-rich-shelf-renderer is-post>` | `richShelfRenderer` | ℹ️ **NEW** – layout | Hosts post cards; relies on nested `richItemRenderer` data already intercepted |
| `<ytd-post-renderer>` | `backstagePostRenderer` | ✅ Covered | Home community posts now properly extracted for menu blocking; channel info extracted from author links |
| `<ytd-expander id="expander">` | `backstagePostRenderer.content` | ⚠️ **NEW** – partial | Expanded post text lives here when collapsed; confirm JSON contains same text or add DOM fallback |
| `<yt-formatted-string id="home-content-text">` | DOM-only | ℹ️ **NEW** | Displays post body when expander hidden; monitor as potential fallback source |
| `<ytd-backstage-image-renderer>` | `backstageImageRenderer` | ℹ️ **NEW** | Image attachment metadata minimal; rely on parent post text for filtering |
| `<ytd-backstage-poll-renderer>` | `backstagePollRenderer` | ❌ **NEW** – missing | Poll prompt/options show here; extend renderer rules when filtering polls |
| `<ytd-comment-action-buttons-renderer>` | DOM-only | ℹ️ **NEW** | Toolbar (like/share/comment); no keyword-bearing strings |
| `<ytd-menu-renderer>` | `menuRenderer` | ⚠️ **NEW** – verify | Overflow menu labels (e.g., “Not interested”) may need coverage if we target UI text |
| `<ytd-toggle-button-renderer>` | `toggleButtonRenderer` | ℹ️ **NEW** | Like/dislike toggles for posts; currently UI only |

### Subscriptions feed (2025-11-18 sample, NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-rich-grid-renderer page-subtype="subscriptions">` | `richGridRenderer` | ℹ️ **NEW** – layout | Same grid container as home; confirm recursion so subscription cards filter pre-DOM |
| `<yt-thumbnail-badge-view-model>` (LIVE / duration) | `thumbnailBadgeViewModel` | ⚠️ **NEW** – not parsed | “LIVE” and runtime badges exposed here; evaluate if we need keyword rules to treat live streams differently |
| `<yt-content-metadata-view-model>` | `contentMetadataViewModel` | ⚠️ **NEW** – partial | Shows “2 watching”, “1 hour ago”; ensure renderer extraction captures live viewer counts in addition to view tallies |
| `<button-view-model>` | `buttonViewModel` | ℹ️ **NEW** | Drives overflow menus per card; UI text only today |
| `<ytd-subscription-notification-toggle-button-renderer-next>` | `subscriptionNotificationToggleButtonRenderer` | ℹ️ **NEW** | Notification bell states; strings limited to UI ("Subscribed"); track in case filters target notification text |
| `<ytd-badge-supported-renderer>` (verified badge) | `metadataBadgeRenderer` | ℹ️ **NEW** | Badge exposes "Official Artist Channel"; low priority unless badges become filter inputs |

### Subscribed-channels import renderers (2026-03 follow-up)

This inventory section is separate from the normal subscriptions feed card filtering above. It tracks the renderer family used by the whitelist-import flow.

| Renderer / DOM shell | Surface | Import role | Status |
| --- | --- | --- | --- |
| `channelListItemRenderer` | `FEchannels` browse responses | Primary mobile/web-style subscription roster row | ✅ Used by importer |
| `channelRenderer` | Desktop page seed / recursive browse artifacts | Desktop subscription row fallback | ✅ Used by importer |
| `<ytd-channel-renderer>` | `/feed/channels` desktop DOM | Page-seed / DOM fallback source | ✅ Read when present |
| `<ytm-channel-list-item-renderer>` | `/feed/channels` mobile DOM | Page-seed / DOM fallback source | ✅ Read when present |
| `continuationCommand.token` | `FEchannels` browse responses | Continuation paging for larger rosters | ✅ Used by importer |

Import notes:

- the importer starts from `/feed/channels`
- it may seed from page-local data first
- it then continues through `FEchannels` browse requests
- the resulting rows are normalized into whitelist channel entries

### Collaboration Videos + Watch Page (2025-12-21 snapshot, NEW)

YouTube collaboration videos can feature up to **5 collaborating channels + 1 uploader** (6 total). This requires special handling in both data extraction and UI.

#### Data Sources

| Source | Location | Data Available | Status |
| --- | --- | --- | --- |
| **ytInitialData / watch roots (Primary)** | `showSheetCommand -> panelLoadingStrategy -> inlineContent -> sheetViewModel -> content -> listViewModel -> listItems` plus `showDialogCommand` / direct `listViewModel` variants | Full channel info for ALL collaborators | ✅ Covered |
| **DOM Fallback** | `#attributed-channel-name > yt-text-view-model` | Channel names, partial handles (first channel only has direct link) | ✅ Covered |

#### Watch-Page Collaborator Recovery Matrix

Authoritative collaborator data can now come from several watch-page paths. The important rule is that collapsed byline text like `Shakira and 2 more` is not the roster.

Supported recovery paths include:

| Path family | Purpose |
| --- | --- |
| `showSheetCommand -> panelLoadingStrategy -> inlineContent -> sheetViewModel -> content -> listViewModel -> listItems` | Preferred watch-page collaborator sheet |
| `showDialogCommand -> panelLoadingStrategy -> inlineContent -> dialogViewModel -> customContent -> listViewModel -> listItems` | Older dialog-based collaborator list |
| direct nested `listViewModel.listItems` variants | Layout drift / fallback variants |
| selected playlist row + watch metadata + owner metadata | Strong watch-page fallback roots during SPA swaps |

Each collaborator in `listItems[].listItemViewModel`:
| Field Path | Data | Example |
| --- | --- | --- |
| `title.content` | Channel name | `"fern"` |
| `subtitle.content` | Handle + subscriber count (Unicode wrapped) | `"‎⁨@fern-tv⁩ • ⁨42.7 lakh subscribers⁩"` |
| `rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` | UC ID | `"UCODHrzPMGbNv67e84WDZhQQ"` |

**Note:** `canonicalBaseUrl` is NOT present inside `showDialogCommand` - the `@handle` must be extracted from `subtitle.content` using regex.

#### DOM Elements

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<div id="attributed-channel-name">` | `attributedChannelName` in `lockupViewModel.byline` | ✅ Covered | Detects collaboration videos; triggers special handling |
| `<yt-text-view-model>` with attributed string | DOM-only collaboration display | ✅ Covered | Parses "Channel A ✓ and Channel B ✓" format |
| `<yt-core-attributed-string>` | Contains channel spans | ✅ Covered | Each span has channel name |
| `<yt-avatar-stack-view-model>` | DOM-only (avatar stack) | ✅ Covered | Used to seed collaborator lists and detect collaboration dialog triggers when present |
| `<a href="/@handle">` | Direct channel link | ⚠️ Partial | Only FIRST channel has direct link in DOM; others require ytInitialData lookup |
| `badge-shape[title*="•"]` | DOM-only badges | ✅ Covered | Regex `@([A-Za-z0-9._-]+)` extracts handles even when encoded as `@foo.bar` |

#### Roster Precedence and Fallback Sanitizing (2026-04-28)

The full collaborator sheet is authoritative when present:

```text
shortBylineText.runs[0]
  .navigationEndpoint.showSheetCommand
  .panelLoadingStrategy.inlineContent.sheetViewModel
  .header.panelHeaderViewModel.title.content == "Collaborators"
```

`injector.js` marks this source as `collaborators-sheet` and gives it a candidate-score bonus. `content_bridge.js` and `injector.js` both sanitize rosters before expected-count stamping or menu rendering.

Guardrails:

- Do not let avatar-stack/direct-list fallback beat a `Collaborators` sheet for the same `videoId`.
- Drop placeholder rows such as `and 2 more`.
- Drop weak composite name-only rows that are fully covered by two other labels, such as `Daddy Yankee Bizarrap` when `Daddy Yankee` and `Bizarrap` are already present.
- If a composite row inflated the expected count, collapse the count to the pruned roster length.

#### 3-Dot Menu UI for Collaborations

| Menu Option | When Shown | Behavior |
| --- | --- | --- |
| Block [Channel N] | 2+ collaborators | Blocks individual channel, stores `collaborationWith` metadata |
| Block All Collaborators | 2+ collaborators | Blocks ALL channels independently with shared `collaborationGroupId` |
| Done • Block X Selected | 3-6 collaborators | Appears after selecting rows in multi-step mode; persists only selections |

#### Watch page notes (v3.2.1)

- **Main video + right rail:** Watch-page dropdowns consume the same collaborator cache as Home/Search, so per-channel menu rows (and “Block All”) appear with names/handles even when the DOM only exposed “Channel A and 3 more”.
- **Desktop lockup metadata rows:** Some watch-page `yt-lockup-view-model` related rows expose collaborator bylines through `yt-lockup-metadata-view-model` / `yt-content-metadata-view-model` rows without an avatar stack. These rows are valid warm-up signals only on watch-like lockups, and Mix guardrails still win.
- **Identity-prefetch interaction:** Visible-card channel identity prefetch can now carry `warmCollaborators: true`, so cached channel identity or fast DOM owner recovery does not suppress the watch/right-rail collaborator warm-up needed by the 3-dot menu.
- **SPA re-check behavior:** During watch-to-watch swaps, collaborator recovery can re-check watch metadata, owner metadata, and the selected playlist row, then refresh an open collaboration menu when fuller roster data arrives.
- **Embedded Shorts:** Shorts surfaced inside the watch column mark `fetchStrategy: 'shorts'`; we prefetch `/shorts/<videoId>` before falling back to `/watch?v=` so collaborator menus and UC IDs hydrate reliably.
- **Weak-identity rows:** watch/playlist rows can recover through `watch:VIDEO_ID` when stable owner identity is incomplete, and later enrichment can repair provisional names.
- **Background resolver fallback:** When the open menu has a stable 11-character `videoId` but no channel identifier, `content_bridge.js` sends `watch:VIDEO_ID` through the background resolver before any legacy direct fetch. This avoids content-script CORS failures on `/watch` and `/shorts`.
- **Watch playlist panel:** Playlist panel rows now hide deterministically for blocked channels (prefetch enriches `videoChannelMap` for playlist items), and Next/Prev navigation skips blocked items without visible playback flash.
- **Watch playlist autoplay:** Autoplay uses an `ended`-event safety net to trigger a Next-click only when the immediate next playlist row is blocked, preventing blocked items from briefly playing.
- **Playlist reprocessing robustness:** Previously hidden playlist rows are kept hidden during identity gaps (sticky-hide) to prevent restored blocked items from becoming playable during async enrichment.
- **Dropdown close behavior:** The 3-dot dropdown close logic avoids closing `ytd-miniplayer` when a miniplayer is visible.
- **ENHANCED:** Avatar stack collaboration detection works on surfaces where `avatarStackViewModel` is used instead of explicit dialog commands.
- **Mix guardrail:** Mix / collection-stack cards are excluded from collaborator grouping, but still participate in owner recovery and fallback 3-dot blocking.

**Multi-select note (3+ collaborators):**
When there are 3–6 collaborators, individual rows act as “select” toggles first. The bottom row becomes:
`Done • Block X Selected` and will persist only those selected collaborators.

#### Storage Schema for Collaboration Entries

```javascript
{
  id: "UCxxxxxx",           // UC ID
  handle: "@channelname",   // @handle
  customUrl: "c/LegacyName", // legacy channel URL (optional)
  name: "Channel Name",     // Display name
  filterAll: true/false,    // Filter All toggle state
  collaborationWith: ["@other1", "@other2"],  // Other collaborators (for UI display)
  collaborationGroupId: "uuid-xxx",           // Links related entries (for group operations)
  allCollaborators: [{ name, handle, id }],   // Canonical roster carried for rehydration
  expectedCollaboratorCount: 3                // Supports "and N more" semantics while enrichment is pending
}
```

#### Collaboration DOM + Cache Attributes (important)

FilterTube stamps/caches collaborator rosters on cards so collaboration menus can render immediately even before Main World enrichment finishes.

| Attribute | Where | Meaning |
| --- | --- | --- |
| `data-filtertube-video-id` | card + wrapper | Stable video ID used for cache validation and Main World lookups |
| `data-filtertube-collaborators` | card | JSON string of `{name, handle, id, customUrl}` for collaborators |
| `data-filtertube-collaborators-source` | card | Source tag: e.g. `lockup`, `dialog`, `mainworld` |
| `data-filtertube-collaborators-ts` | card | Timestamp for stale-cache detection |
| `data-filtertube-expected-collaborators` | card | Expected collaborator count (supports “+ N more”) |
| `data-filtertube-channel-custom` | card | Legacy channel identifier (`c/<slug>` or `user/<slug>`) |

#### Collaboration Menu Item Attributes

| Attribute | Where | Meaning |
| --- | --- | --- |
| `data-collab-key` | menu row | Key for the collaborator row (derived from `id` or `@handle` or `customUrl`) |
| `data-collaboration-with` | menu row | JSON of “other collaborators” for UI grouping |
| `data-collaboration-group-id` | menu row | Group ID used to connect related collaboration entries |
| `data-is-block-all="true"` | menu row | Marks the “All collaborators / Done” row |
| `data-multi-step="true"` | menu row | Enables multi-select behavior for 3+ collaborators |

#### Cross-World Communication

Since content_bridge.js runs in **Isolated World** (no `ytInitialData` access), collaboration data requires message-based lookup:
1. DOM extraction detects collaboration video
2. If collaborator data incomplete → request from Main World via `FilterTube_RequestCollaboratorInfo`
3. injector.js (Main World) searches `ytInitialData` and responds with `FilterTube_CollaboratorInfoResponse`
4. content_bridge.js enriches collaborator data and injects menu options
5. background.js persists `collaborationGroupId`, `collaborationWith`, `allCollaborators`; UI renders dashed/yellow rails via `render_engine.js`

#### Renderer/UI Mapping
| Layer | Responsibility |
| --- | --- |
| `filter_logic.js` | Extracts collaborator listItems, normalizes handles (lowercase, dots/underscores allowed) |
| `content_bridge.js` | Generates group IDs, injects block-all menu entries, and hides DOM nodes immediately |
| `render_engine.js` | Computes `presentCount/totalCount`, adds 🤝 badge + tooltip text |

### Shorts Collaborations & Canonical IDs (2025-12 sample)

| Source | Path / Selector | Notes |
| --- | --- | --- |
| DOM | `ytd-shorts-lockup-view-model`, `.reel-item` | Shorts cards often omit UC IDs; only handle is available |
| Fetch | `https://www.youtube.com/shorts/<id>` | Used to extract uploader handle when missing from DOM |
| Fetch | `https://www.youtube.com/@handle/about` | Resolves canonical `UC...` ID via regex `channel/(UC[\w-]{22})` |

**Flow Recap:** detect Short → hide container → resolve handle → resolve UC ID → persist → broadcast so interceptors catch future cards.

### Quick Block Surface Matrix (2026-05-03)

This section records the DOM behavior difference found while stabilizing the quick-cross block affordance across the desktop extension and the Android native app WebView.

| Surface | Page / area | Dominant DOM family | Quick-cross behavior | Notes |
| --- | --- | --- | --- | --- |
| Desktop extension | Home normal videos | `ytd-rich-item-renderer` + `yt-lockup-view-model` / `ytd-rich-grid-media` | Hover-driven and stable | Fine pointer surfaces can rely on `:hover` plus pointer tracking. |
| Desktop extension | Home Shorts | `ytd-shorts-lockup-view-model`, `.shortsLockupViewModelHost`, `reelItemRenderer` | Needs stable outer-host anchoring | Hover preview/autoplay can swap thumbnail/player layers; quick-cross must anchor to the outer Shorts host, not a volatile preview child. |
| Desktop extension | Search normal videos | `ytd-video-renderer`, `yt-lockup-view-model` | Hover-driven and stable | Search cards differ from home lockups but still keep stable card hosts. |
| Desktop extension | Search Shorts | `shortsLockupViewModel`, `reelItemRenderer`, `.shortsLockupViewModelHost` | Needs stable outer-host anchoring | Same preview-layer issue as Home Shorts. |
| Desktop extension | Watch page Shorts shelf | `ytd-reel-item-renderer`, `ytd-shorts-lockup-view-model`, watch-next shelf wrappers | Stable after current host fix | Watch shelves recycle less aggressively than Home/Search preview cards, so retention is more reliable. |
| Desktop extension | Home/Search/Watch Shorts channel blocking | `.shortsLockupViewModelHost`, `.ytGridShelfViewModelGridShelfItem`, `ytd-reel-item-renderer`, `a[href*="/shorts/"]` | Visible-card identity prefetch | 2026-07-05: when channel rules/whitelist are active, visible/near-visible Shorts without channel identity now use the existing background `/shorts/<videoId>` resolver and persist `videoChannelMap` before the DOM fallback reprocesses. Blocklist unknown Shorts are not hidden until resolved; whitelist remains stricter through the normal whitelist pending path. |
| Android phone WebView | Home/Search/Watch cards | Mobile/touch WebView with desktop or mobile YouTube DOM depending viewport/UA | Touch-visible, not hover-driven | No fine pointer. The app runtime keeps quick-cross visible for discoverability, then must hide it near top chrome, bottom pivot bar, and overlays. |
| Android tablet WebView | Home/Search grid + chips | Desktop-like YouTube DOM inside coarse-pointer WebView | Touch-visible with app-only occlusion guard | Tablet can look like desktop YouTube but still reports coarse/touch pointer, so extension hover rules are not enough. |
| Android app overlays | Account/profile/settings sheets | YouTube modal/account/menu renderers over the feed | Quick-cross must be globally hidden | Underlying feed buttons can otherwise poke through account settings, profile switching, dialogs, and bottom sheets. |
| Posts / Community | Home post shelf, channel Posts tab | `backstagePostRenderer`, `backstagePostThreadRenderer`, `ytd-post-renderer`, `ytm-post-renderer` | Menu path covered; quick-cross intentionally skipped today | `block_channel.js` currently skips post-like cards for quick-cross. Adding post quick-cross should be a separate implementation so it does not destabilize video/Shorts blocking. |

Current rule: extension code owns the general stable host and top/bottom chrome model. Android app runtime adds an app-only WebView occlusion adaptation during sync because touch WebViews force visible quick-cross controls instead of hover-only controls.

### Podcasts shelf (Podcasts tab, 2025-11-18 sample)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-rich-shelf-renderer layout="podcasts">` | `richShelfRenderer` | ℹ️ Layout | Container for podcasts shelf; traversal reaches nested `podcastRenderer` entries |
| `<ytd-rich-item-renderer is-shelf-item>` | `podcastRenderer` payload | ✅ Covered | Podcast title/description + publisher captured, including metadata rows |
| `<yt-collection-thumbnail-view-model>` | `lockupViewModel.collectionThumbnailViewModel` | ℹ️ | Stack thumbnail + square art; no additional text beyond badges (playlist lockups hidden when `hidePlaylistCards` is on, but Mix/Radio lockups are excluded via `start_radio=1`) |
| `<yt-thumbnail-overlay-badge-view-model>` | `thumbnailBadgeViewModel` | ⚠️ Partial | Badge text like “1 episode”; evaluate keyword needs later |
| `<yt-content-metadata-view-model>` | `contentMetadataViewModel` | ✅ Covered | Metadata rows now parsed via helper fallback |

## Search Results & Generic Lists

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `videoRenderer` / `compactVideoRenderer` | Main search results & sidebar items | ✅ Covered @js/filter_logic.js#129-131 |
| `playlistVideoRenderer` / `compactRadioRenderer` | Playlist search hits | ✅ Covered @js/filter_logic.js#132-215 |
| `secondarySearchContainerRenderer` | Container around secondary results | ✅ Covered @js/filter_logic.js#232-235 |

### DOM elements from 2025-11-17 sample (NEW)

**⚠️ CRITICAL: Search page `ytd-video-renderer` structure differs from home page `yt-lockup-view-model`**

On **home page** (`yt-lockup-view-model`):
- `data-filtertube-channel-handle` is on the channel link inside `.yt-lockup-metadata-view-model__metadata`
- Channel name text is in the same element

On **search page** (`ytd-video-renderer`):
- `data-filtertube-channel-handle` is on the **thumbnail link** (`#thumbnail a`)
- Thumbnail link contains **overlay text** (duration like "25:31", "Now playing")
- Channel name is in a **separate location**: `#channel-info > ytd-channel-name > a`

**Solution**: When extracting channel name with data attributes present, ALWAYS query `#channel-info ytd-channel-name a` first, never rely on the data-attribute element's textContent.

**General guardrail**: owner names must come from real channel selectors such as `#channel-info ytd-channel-name a`, `#owner-name a`, or authoritative recovered payloads. Row titles, thumbnail links, generic data-attribute hosts, and fallback-popover titles are provisional only and may contain overlay/title text.

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-video-renderer>` | `videoRenderer` search result card | ✅ Covered — **NEW** DOM tag surfaced in latest layout | Title, channel, snippet text still arrive via existing `descriptionSnippet` / `detailedMetadataSnippets` paths |
| `<ytd-universal-watch-card-renderer>` | `universalWatchCardRenderer` (secondary column hero) | ✅ Covered — **NEW** | Continue to verify nested header/title extraction works with rich header fields |
| `<ytd-watch-card-hero-video-renderer>` | `watchCardHeroVideoRenderer` | ✅ Targeted (Layout Fix) | Handled in `js/layout.js` to ensure visibility propagation |
| `<ytd-watch-card-compact-video-renderer>` | `watchCardCompactVideoRenderer` | ✅ Covered — **NEW** | Matches existing sidebar rules; confirm snippet paths |
| `<ytd-vertical-watch-card-list-renderer>` | Watch card list container | ✅ Targeted (Layout Fix) | Handled in `js/layout.js` to ensure visibility propagation |
| `<ytd-watch-card-rich-header-renderer>` | `watchCardRichHeaderRenderer` | ⚠️ **NEW** – missing | Header exposes channel title/handle; extend rules beyond `universalWatchCardRenderer` wrapper |
| `<ytd-watch-card-section-sequence-renderer>` | `watchCardSectionSequenceRenderer` | ✅ Targeted (Layout Fix) | Handled in `js/layout.js` to ensure visibility propagation |
| `<ytd-watch-card-rhs-panel-renderer>` | `watchCardRHPanelRenderer` | ❌ **NEW** – not parsed | New right-hand hero layout; add renderer coverage if JSON structure differs from existing watch cards |
| `<ytd-watch-card-rhs-panel-video-renderer>` | `watchCardRHPanelVideoRenderer` | ❌ **NEW** – not parsed | Companion compact entries inside the RHS panel; map JSON keys for title/channel extraction |
| `<ytd-horizontal-card-list-renderer>` | `horizontalCardListRenderer` | ⚠️ **NEW** – missing | Album shelf with refinement chips; need renderer coverage for card metadata |
| `<ytd-title-and-button-list-header-renderer>` | `titleAndButtonListHeaderRenderer` | ℹ️ **NEW** | Header text like “Albums”; low priority unless chip titles require filtering |
| `<ytd-search-refinement-card-renderer>` | `searchRefinementCardRenderer` | ❌ **NEW** – not parsed | Album/playlist cards include titles; add rules if we must block refinement results |
| `<ytd-call-to-action-button-renderer>` | `callToActionButtonRenderer` | ℹ️ **NEW** | CTA button text (“YouTube Mix”) likely safe; monitor if keyword filtering needed |
| `<ytd-button-banner-view-model>` | `buttonBannerViewModel` | ℹ️ **NEW** | Footer promo (“Listen on YouTube Music”); record in case future filtering targets promos |
| `<ytd-collage-hero-image-renderer>` | DOM-only | ℹ️ **NEW** | Visual collage for hero; no textual data |
| `<ytd-grid-video-renderer>` | `gridVideoRenderer` shelf results | ✅ Covered — **NEW** | Horizontal shelves use same renderer as home feed |
| `<ytd-channel-renderer>` | `channelRenderer` search result | ✅ Covered — **NEW** | Ensure channel description/snippet text captured for keyword filters |
| `<ytd-expandable-metadata-renderer>` | Likely `expandableMetadataRenderer` / AI summary | ❌ **NEW** – Not yet parsed | Add rules to inspect AI summary text when we want to filter summaries |
| `<video-summary-content-view-model>` | AI summary paragraphs | ❌ **NEW** – DOM-only content | Consider DOM scrape if JSON source unavailable |

## Watch Page (Main & Right Rail)

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `videoPrimaryInfoRenderer` / `videoSecondaryInfoRenderer` | Active video title/channel | ✅ Covered @js/filter_logic.js#224-230 |
| `compactVideoRenderer` | Up next suggestions | ✅ Covered @js/filter_logic.js#129-131 |
| `watchCardCompactVideoRenderer` | Watch-card suggestions | ✅ Covered @js/filter_logic.js#133-134 |
| `watchCardHeroVideoRenderer` | Hero watch card | ⚠️ **NEW** – add extraction paths |

### Gaps to monitor
| Renderer / component | Status | Notes |
| --- | --- | --- |
| `compactAutoplayRenderer` | ⚠️ Missing | Frequently used in autoplay module; add extraction paths |
| `watchCardSectionSequenceRenderer` | ⚠️ **NEW** – suspected parent | Needed to recurse into vertical hero lists |

### DOM elements from 2025-11-17 watch sample (NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-watch-metadata>` | `videoPrimaryInfoRenderer` + `videoSecondaryInfoRenderer` | ✅ Covered — **NEW** | Title/channel text already extracted from JSON; DOM reflects same data |
| `<ytd-video-owner-renderer>` | Owner block from `videoSecondaryInfoRenderer` | ✅ Covered — **NEW** | Channel link, sub count reachable via existing owner paths |
| `<ytd-watch-info-text>` | `videoSecondaryInfoRenderer.metadataRowContainer` | ⚠️ **NEW** – partial | Need to ensure view-count/date/hashtags paths (`info`) captured for keyword scan |
| `<ytd-text-inline-expander>` (description) | `videoPrimaryInfoRenderer.description` | ⚠️ **NEW** – truncated snippet | Confirm short/expanded description text is in JSON and fall back to DOM snippet if missing |
| `<ytd-structured-description-content-renderer>` | Structured description rows | ❌ **NEW** – not parsed | Add rules if product links/chapters require filtering |
| `<ytd-subscribe-button-renderer>` | DOM-only | ℹ️ **NEW** – UI only | No filtering required |

### Watch Next chip cloud (2025-11-18 sample; route boundary updated 2026-06-18)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<yt-related-chip-cloud-renderer>` | `relatedChipCloudRenderer` | ℹ️ Layout / JSON traversal only | Watch related chips are inventoried but should not be DOM-hidden by keyword rules |
| `<yt-chip-cloud-renderer>` | `chipCloudRenderer` | ℹ️ Layout | Hosts the Watch related chip list; do not use as a DOM fallback wake-up target on `/watch` |
| `<yt-chip-cloud-chip-renderer>` | `chipCloudChipRenderer` | ℹ️ Watch UI refinement | Labels like `All`, `From the series`, `Recently uploaded`, and `Watched`; not content cards |
| `<chip-shape>` button label | DOM-only | 🚫 No Watch DOM fallback filtering | Watch chip labels should not be hidden by keyword/channel rules because they are YouTube refinement controls, not recommendations themselves |

### New DOM notes
- Provided HTML did not include right-rail markup; request additional samples (expect `<ytd-compact-video-renderer>` with `compactAutoplayRenderer`).
- Description snippet now wrapped in `ytd-text-inline-expander`; confirm `videoDetails.shortDescription`/`descriptionSnippet` fields remain populated for filtering.

## Channel Page

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `channelVideoPlayerRenderer` | Channel featured video / trailer | ✅ Covered @js/filter_logic.js#162-166 |
| `gridVideoRenderer` | Channel videos grid items | ✅ Covered @js/filter_logic.js#129-131 |

### DOM elements from 2025-11-17 channel sample (NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-channel-metadata-renderer>` | `channelMetadataRenderer` | ⚠️ **NEW** – not parsed | Channel description, stats, links surfaced here; add rules if keyword filtering should cover bios |
| `<yt-horizontal-list-renderer>` | `horizontalListRenderer` | ⚠️ **NEW** – container | Ensure recursion catches `items[].gridVideoRenderer` so featured shelf videos filter correctly |
| `<ytd-section-list-renderer>` / `<ytd-item-section-renderer>` | `twoColumnBrowseResultsRenderer.tabs[].sectionListRenderer` | ℹ️ **NEW** – layout | Structural containers; no filtering today |
| `<ytd-grid-video-renderer>` | `gridVideoRenderer` | ✅ Covered — **NEW** | Same renderer rules as home/search; confirm supports joint-channel bylines |

### Playlists tab controls (2025-11-18 sample, NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-channel-sub-menu-renderer>` | `channelSubMenuRenderer` | ⚠️ **NEW** – not parsed | Hosts Playlists tab dropdown (“Created playlists”); add renderer rules if menu text needs keyword filtering |
| `<yt-sort-filter-sub-menu-renderer>` | `sortFilterSubMenuRenderer` | ⚠️ **NEW** – missing | Provides “Sort by” options; confirm JSON paths before scanning sort labels |
| `<yt-dropdown-menu>` / `<tp-yt-paper-menu-button>` / `<tp-yt-paper-listbox>` | DOM-only | ℹ️ **NEW** | UI shell around submenu; relies on parent renderer for strings |
| `<ytd-grid-renderer>` (Playlists tab) | `gridRenderer` containing `items[].lockupViewModel` | ℹ️ **NEW** | Structural grid; ensure recursion reaches playlist lockups |
| `<yt-content-metadata-view-model>` | `contentMetadataViewModel` | ⚠️ **NEW** – partial | Surfaces playlist metadata rows (counts, “Updated” dates); consider parsing if keywords must match |

### Posts tab / Community feed (2025-11-18 sample)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-backstage-items>` | `sectionListRenderer.contents[].backstageItems` | ℹ️ **NEW** – layout | Container for community threads; ensure recursion reaches `backstagePostThreadRenderer` entries |
| `<ytd-comments-header-renderer is-backstage>` | `commentsHeaderRenderer` (backstage) | ⚠️ Partial | Header text still unchecked; evaluate after main post coverage |
| `<ytd-backstage-post-thread-renderer>` | `backstagePostThreadRenderer` | ✅ Covered | Thread wrappers parsed; ensures nested posts obey keyword/channel filters |
| `<ytd-backstage-post-renderer>` | `backstagePostRenderer` | ✅ Covered | Post body, attachments, author channel IDs/handles extracted |
| `<ytd-backstage-image-renderer>` | `backstageImageRenderer` | ℹ️ | Image attachment metadata minimal; rely on parent post text for now |
| `<ytd-backstage-poll-renderer>` | `backstagePollRenderer` | ✅ Covered | Poll prompts/options now included in keyword scanning |
| `<ytd-backstage-quiz-renderer>` | `backstageQuizRenderer` | ✅ Covered | Quiz question/choices exposed for filters |
| `<ytd-post-uploaded-video-renderer>` | `backstagePostRenderer.attachments[].videoRenderer` | ✅ Covered — **NEW** | Nested `videoRenderer` uses existing rules; verify recursion processes attachment payload |
| `<ytd-comment-action-buttons-renderer>` | DOM-only | ℹ️ **NEW** | UI buttons (like/share/comment); no filterable strings |

### Gaps to monitor
- Confirm whether `channelFeaturedContentRenderer` or `channelAboutMetadataRenderer` appear in JSON; add entries if descriptions or featured playlists bypass existing rules.
- Validate continuation tokens for channel shelves so hidden videos are not re-fetched.
- Add renderer coverage for `channelSubMenuRenderer` / `sortFilterSubMenuRenderer` if playlist menu text needs filtering.
- Decide if `contentMetadataViewModel` metadata rows require keyword scanning (e.g., updated timestamps, video counts).
- Evaluate backstage header/menus once there is a requirement to filter them.

## Shorts

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `reelItemRenderer`, `shortsLockupViewModel`, `shortsLockupViewModelV2` | Shorts feeds | ✅ Covered @js/filter_logic.js#179-193 |

### Observed gaps
- The 2026-07-12 fixture now covers mobile channel-page Shorts lockups and their
  current camelCase metadata children. Continue validating the full-screen
  Shorts player for `yt-reel-player-overlay` variants separately.

## Watch Playlist Panel

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `playlistPanelRenderer` | Watch-page mini playlist (Up Next queue) | ⚠️ Partial @js/filter_logic.js#206-215 |
| `playlistPanelVideoRenderer` | Individual playlist items within panel | ✅ Covered @js/filter_logic.js#129-133 |

### DOM elements from 2025-11-18 sample (NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-playlist-panel-renderer>` | `playlistPanelRenderer` | ⚠️ **NEW** – missing metadata parsing | Header exposes playlist title/channel; confirm JSON paths for keyword scan and consider DOM fallback |
| `<ytd-playlist-panel-video-renderer>` | `playlistPanelVideoRenderer` | ✅ Covered — **NEW** | Titles/bylines map to existing renderer rules; ensure resume-progress DOM doesn’t hide filtered items |
| Playlist action controls (`ytd-playlist-loop-button-renderer`, shuffle toggle) | DOM-only | ℹ️ **NEW** | UI buttons only; no filtering required |

### Desktop playlist lockup refresh (2026-07-01)

Recent Watch playlist samples show:

```html
<ytd-playlist-panel-video-renderer
  lockup="true"
  id="playlist-items"
  use-color-palette>
  <span id="video-title">...</span>
  <span id="byline">...</span>
</ytd-playlist-panel-video-renderer>
```

Some rows can also carry `data-filtertube-hidden-by-playlist-enrichment="true"`
after FilterTube hides them. That proves YouTube is not generally removing
FilterTube DOM attributes in the sampled surface, but these markers should be
treated as implementation state rather than a public contract.

### Custom fallback 3-dot support on weak watch rows

When YouTube does not expose a usable native overflow path or row identity is too weak, FilterTube can render its own fallback controls on watch-page rows such as:

- `ytd-playlist-panel-video-renderer`
- `yt-lockup-view-model`
- mobile playlist / compact watch rows

Fallback UI elements:

| Element | Purpose |
| --- | --- |
| `.filtertube-fallback-menu-slot` | Anchor slot for the fallback controls |
| `.filtertube-playlist-menu-fallback-btn` | Custom launcher button |
| `.filtertube-playlist-menu-fallback-popover` | Popover containing block rows and toggles |

Fallback contract:

- `Filter All` is toggle-only
- the real action is the `Block • Channel` row
- the row shows pressed/focus/open feedback before the popover closes
- weak watch-row identity can escalate to `watch:VIDEO_ID`
- post-block enrichment may repair provisional title-like names for the same canonical UC ID

### Lockup / Shelf Playlists (Related section)
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `lockupViewModel` (playlist variant) | Horizontal playlist promos | ✅ Covered @js/filter_logic.js#149-154 |

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<yt-lockup-view-model>` (playlist) | `lockupViewModel` | ✅ Covered — **NEW** | Existing lockup rules pick up title/channel; badge text (video counts) still DOM-only |
| `<yt-collection-thumbnail-view-model>` / `<yt-collections-stack>` | Collection thumbnail stack | ℹ️ **NEW** | Visual only; continue to ignore unless we filter by thumbnail badges |

### Follow-ups
- Verify we recurse into `playlistPanelRenderer.contents` to filter continuation responses when playlists auto-advance.
- Decide if playlist badges (`yt-thumbnail-overlay-badge-view-model`) need keyword filtering when they include captions like “AI Summary”.
- Capture playlist publisher names in renderer rules if keyword filtering should cover collaborators (e.g., “Playlist” taxonomy strings).
- Evaluate playlist overlays (`thumbnailOverlayPlaybackStatusRenderer`, resume progress, “Now playing”) in case watched-state strings become filter signals.

### Library playlists: Watch Later & Liked videos (2025-11-18 sample)

Scope: this older section inventories desktop playlist-detail **entries**
(`ytd-playlist-video-renderer`). It is not the mobile You overview
`playlistCardRenderer` shelf or the mobile `FEplaylist_aggregation`
`lockupViewModel` grid documented above.

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-playlist-video-renderer>` | `playlistVideoRenderer` | ✅ Covered — **NEW** | Watch Later / Liked entries expose title, channel, description via existing playlist renderer rules |
| `<ytd-video-meta-block class="playlist">` | `playlistVideoRenderer` | ✅ Covered — **NEW** | Bylines (“Sana”, view count, age) surface from same JSON; confirm we persist extraction when metadata block rearranges |
| `<ytd-thumbnail-overlay-time-status-renderer>` | `thumbnailOverlayTimeStatusRenderer` | ✅ Covered | Duration badge mirrors JSON value |
| `<ytd-thumbnail-overlay-playback-status-renderer>` | `thumbnailOverlayPlaybackStatusRenderer` | ✅ Covered | “WATCHED” / “UNWATCHED” strings now flow into keyword filter |
| `<ytd-thumbnail-overlay-resume-playback-renderer>` | `thumbnailOverlayResumePlaybackRenderer` | ✅ Covered | Accessibility label supplies “Resume watching” context |
| `<ytd-thumbnail-overlay-now-playing-renderer>` | `thumbnailOverlayNowPlayingRenderer` | ✅ Covered | “Now playing” indicator captured |
| `<ytd-channel-name>` (playlist context) | `playlistVideoRenderer.shortBylineText` | ✅ Covered — **NEW** | Channel attribution already captured by playlist renderer rules |
| `<yt-formatted-string id="video-info">` | `playlistVideoRenderer.videoInfo` | ⚠️ **NEW** – verify | View counts & ages appear here; double-check JSON paths so filters see localized numerals |

## Comments

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `commentRenderer`, `commentThreadRenderer` | Comment threads | ✅ Covered @js/filter_logic.js#196-203 |

### DOM elements from 2025-11-17 sample (NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-comments>` | Comments section container | ℹ️ **NEW** – layout | Hosts `itemSectionRenderer`; no direct filtering |
| `<ytd-comment-thread-renderer>` | `commentThreadRenderer` | ✅ Covered — **NEW** | Wraps top-level comment + replies |
| `<ytd-comment-view-model>` | `commentRenderer` | ✅ Covered — **NEW** | Text extracted via existing comment rules |
| `<ytd-expander>` (comment text) | `commentRenderer.contentText` | ✅ Covered — **NEW** | Multi-line comment bodies already flattened |
| `<ytd-comment-engagement-bar>` | DOM-only | ℹ️ **NEW** | Buttons only; no filterable text |
| `<ytd-continuation-item-renderer>` | `continuationItemRenderer` | ⚠️ **NEW** | Ensure continuation tokens filtered so hidden threads stay hidden |

### Current desktop comment sheet boundary (2026-07-03)
| DOM tag / component | Purpose | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-comments id="comments">` | Watch-page inline comments host | ✅ Comment path only | Current desktop samples still use this classic host under `<ytd-watch-flexy response-has-comments>`. Generic video-card fallback must not process nested lockup/view-model nodes inside it. |
| `<ytd-item-section-renderer section-identifier="comment-item-section">` | Comment section wrapper | ✅ Comment path only | Hosts header, composer, continuation, and thread rows. Do not hide or classify as a video card. |
| `<ytd-engagement-panel-section-list-renderer target-id*="comment">` | Comments engagement panel/sheet variant | ✅ Comment path only | Treated as a comment surface guard. Do not let generic YTD/YTM camelCase lockup support attach prefetch, whitelist-pending, or card-hide work inside this panel. |
| `<yt-ghost-comments class="ytGhostCommentsHost">` | YouTube comments loading skeleton | ℹ️ Layout only | Inventory only. It is not user content and should not be keyword/channel filtered. |
| `ytComment*` / `ytComments*` camelCase comment classes | Modern comment controls, teasers, and action rows | 🚫 Control/comment-only | Inventory-only unless explicitly inside comment filtering. These are not video-card hosts. |

The 2026-07 YTD/YTM camelCase work added broad content-card selectors such as
`yt-lockup-view-model`, `.ytLockupViewModelHost`, and
`.ytLockupViewModelWrapper`. Comment surfaces are now an explicit boundary:
generic video-card filtering, prefetch observation, and whitelist pending-hide
queues should skip nodes under comment containers/panels. Actual comment hiding
continues through the dedicated comment renderer/path.

## Feed/Search Filter Chips

| DOM tag / component | Associated data | Coverage | Notes |
| --- | --- | --- | --- |
| `<ytd-feed-filter-chip-bar-renderer>` | Horizontal chip bar | ✅ Route-scoped DOM support | Home/feed chip bars can be processed on `/` |
| `<ytd-search-header-renderer has-chip-bar>` | Search results chip bar | ✅ Route-scoped DOM support | Search chips can be processed on `/results` |
| `<ytm-feed-filter-chip-bar-renderer>` | Mobile Home horizontal chip bar | ✅ Route-scoped DOM support | Mobile Home chips can be processed on `/` |
| `<ytm-chip-cloud-renderer class="chips-fixed-positioning chips-visible YtmChipCloudRendererHost chip-bar">` | Mobile Watch related chip bar | 🚫 Watch route only | Inventoried only; do not wake DOM fallback on `/watch`; filter the actual video rows under it instead |
| `<yt-chip-cloud-chip-renderer>` | Individual chips (`Music`, `Mixes`, `Shorts`, `Unwatched`, etc.) | ✅ Route-scoped | DOM fallback may hide matching chips on Home/Search only |
| `<ytm-chip-cloud-chip-renderer>` | Mobile individual chips | ✅ Route-scoped | Same Home/Search-only boundary as desktop chips |
| `<chip-shape>` button text | Visible chip label | ⚠️ Label source only | Use the containing `yt-chip-cloud-chip-renderer` for DOM fallback; do not target Watch related chips |

These chips originate from the YouTube UI rather than content cards. FilterTube may filter Home/Search chip labels, but actual keyword/channel blocking still depends on video/card/comment/playlist renderers and JSON-first payload filtering.

## Notifications (Bell / Inbox)

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-notification-renderer>` | `notificationRenderer` | ✅ Covered | Headline, long message, and channel IDs/handles now parsed |
| `<yt-formatted-string class="message">` | `notificationRenderer.shortMessage` | ⚠️ Partial | JSON path parsed; confirm DOM-only variants |
| `<ytd-multi-page-menu-renderer>` / `<yt-multi-page-menu-section-renderer>` | `multiPageMenuRenderer` | ℹ️ Layout | Container; parser recurses into notification children |
| `<ytd-comment-video-thumbnail-header-renderer>` | `commentVideoThumbnailHeaderRenderer` | ✅ Covered | Provides video title + channel for context filtering |
| `<ytd-menu-renderer>` (notification actions) | `menuRenderer` | ℹ️ | Action menu labels (“Turn off”, “Hide this notification”); UI-only for now |
| `<ytd-comments>` / `<ytd-comment-thread-renderer>` | `commentThreadRenderer` | ✅ Covered | Notifications drawer reuses comment components; existing rules should filter replies once data is intercepted |

## YouTube Kids (DOM samples, 2025-12)

| DOM tag / component | Location / purpose | Status | Notes |
| --- | --- | --- | --- |
| `<ytk-compact-video-renderer> > <ytk-menu-renderer>` with `<tp-yt-paper-icon-button id="menu-button">` | Per-card overflow (3-dot) on video thumbnails | ❌ DOM-only | Hosts native Kids overflow. Need observer hook to intercept native “Block this video” selection and mirror into FilterTube Kids list. |
| `<ytk-menu-popup-renderer>` inside `<ytk-popup-container>` | Dropdown panel rendered after clicking 3-dot | ❌ DOM-only | Contains `Block this video` list item (`<ytk-menu-service-item-renderer>`). Blocking shows toast “Video blocked” with `UNDO` button. |
| `<ytk-popup-container> > <ytk-notification-action-renderer> > <tp-yt-paper-toast id="toast">` | Confirmation toast after block | ❌ DOM-only | Text “Video blocked”; includes undo button. Useful for confirming interception success. |
| `<ytk-masthead>` with `<ytk-kids-category-tab-renderer>` | Home masthead category tabs (Recommended, etc.) | ℹ️ Layout | Category nav; not filterable but relevant if mode/state affects renderer traversal. |
| `<ytk-compact-video-renderer>` | Home/search/watch-right-rail video items | ❌ DOM-only | Title lives in `<span>`; overlay duration badge; menu as above. Need videoId extraction + channel attribution (via card link or mainworld lookup). |
| `<ytk-compact-playlist-renderer>` | Playlist promos on Kids home | ❌ DOM-only | Shows playlist title + video-count overlay; needs playlist/channel capture for blocking playlists or channels. |
| `<ytk-compact-channel-renderer>` | Channel tiles (home/search/music) | ❌ DOM-only | Channel title + thumbnail; 3-dot menu present. Must capture channelId from href `/channel/UC...`. |
| `<ytk-two-column-watch-next-results-renderer>` | Watch-page right rail container | ℹ️ Layout | Contains `ytk-compact-video-renderer` items; observer hook needed to filter next-up rows. |
| `<ytk-slim-video-metadata-renderer>` | Watch-page header (title + owner) | ❌ DOM-only | Title in `#video-title`; channel name in `#video-owner`. Use to seed channel and video title when JSON unavailable. |

## Action Items
1. Add renderer support for `compactAutoplayRenderer`, `watchCardHeroVideoRenderer`, and `watchCardSectionSequenceRenderer`.
2. Confirm extraction of search snippet text (`metadata-snippet-text`, AI summaries) and extend keyword scanning if JSON does not carry full descriptions.
3. Decide whether badge text (`yt-thumbnail-overlay-badge-view-model`) and chip labels need keyword filtering or DOM suppression (now that chip JSON is parsed, only DOM-only variants remain).
4. Collect additional DOM/JSON samples for Watch right rail and Shorts once main surfaces are finalized.
5. Evaluate whether to expose the newly parsed playlist overlays (`WATCHED`, `Resume watching`, `Now playing`) as user-facing toggles.
6. Add renderer coverage for `channelSubMenuRenderer` / `sortFilterSubMenuRenderer` if playlist menu text needs filtering.
7. Monitor backstage header/menu strings for future filtering requirements and confirm metadata-row helper coverage across other `contentMetadataViewModel` instances.

## Sidebar & Navigation (2025-11-24 sample, NEW)

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-guide-entry-renderer>` | `guideEntryRenderer` | ✅ Covered | Sidebar navigation items (e.g., "Shorts"). Now targeted for hiding when "Hide All Shorts" is active. |

## AI & Experimental Features (2025-11-24 sample, NEW)

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<yt-button-view-model>` | `buttonViewModel` | ℹ️ **NEW** | "Ask" button (AI feature). Potential future target for category filtering. |

## 3-Dot Menu Blocking Targets (v3.0.9)

FilterTube now injects a "Block Channel" option into the 3-dot menu for the following content types. This allows users to block channels directly from the UI without visiting the channel page.

| Content Type | Targeted DOM Elements | Notes |
| --- | --- | --- |
| **Standard Videos** | `ytd-rich-item-renderer`, `ytd-video-renderer`, `ytd-grid-video-renderer`, `ytd-compact-video-renderer` | Covers Home, Search, Channel Videos, and Sidebar suggestions. |
| **Shorts** | `ytd-reel-item-renderer`, `ytd-reel-video-renderer`, `reel-item-endpoint`, `ytm-shorts-lockup-view-model`, `ytm-shorts-lockup-view-model-v2` | Covers Shorts Shelf, Shorts Player, and Mobile/Search Shorts. Uses async fetch for channel info. |
| **Posts** | `ytd-post-renderer` | Community posts on Home and Channel pages. |
| **Playlists** | `ytd-playlist-panel-video-renderer`, `ytd-playlist-video-renderer` | Videos within a playlist view. |
| **Mobile/Compact** | `ytd-compact-promoted-video-renderer`, `ytm-compact-video-renderer`, `ytm-video-with-context-renderer` | Mobile web and specific compact layouts. |
| **Containers** | `ytm-item-section-renderer`, `ytd-rich-shelf-renderer` | Shelves and sections containing shorts/videos. |

### Menu DOM Variants (New + Legacy)

| Layer | Targeted DOM Elements | Notes |
| --- | --- | --- |
| **Dropdown Container** | `tp-yt-iron-dropdown`, `ytd-menu-popup-renderer` | Observer watches dropdown insertion + visibility changes. |
| **Menu List (New)** | `yt-list-view-model` | Newer YouTube menu structure; FilterTube injects a `yt-list-item-view-model`. |
| **Menu List (Legacy)** | `tp-yt-paper-listbox` | Older menu structure inside `ytd-menu-popup-renderer`. |
| **Injected Menu Item** | `yt-list-item-view-model`, `ytd-menu-service-item-renderer` | FilterTube inserts whichever matches the detected menu structure. |
| **Fallback Popover** | `.filtertube-fallback-menu-slot`, `.filtertube-playlist-menu-fallback-btn`, `.filtertube-playlist-menu-fallback-popover` | Used when native watch-row menu identity is weak or unavailable; follows the custom fallback contract above. |

**Technical Note:**
The dropdown observer lives in `js/content/block_channel.js` and uses a `MutationObserver` to detect when a dropdown container (typically `tp-yt-iron-dropdown`) is added or becomes visible. It traces back to the `lastClickedMenuButton` to identify the parent video card from the list above, then calls `content_bridge.js:injectFilterTubeMenuItem(dropdown, card)`.

Inside `injectFilterTubeMenuItem`, FilterTube waits for YouTube to populate either the **new menu list** (`yt-list-view-model`) or the **legacy menu list** (`tp-yt-paper-listbox` / `ytd-menu-popup-renderer`) before inserting the menu entry. For Shorts, an asynchronous background fetch is often required to resolve the channel handle/ID from the video URL.

### Search Artist Top Card (2026 update)

| Renderer / Host | Surface | FilterTube Handling |
| --- | --- | --- |
| `yt-official-card-view-model` | YouTube search artist/music top card | Included in DOM fallback card selectors and channel extraction paths (handle + nested channel ID fallback). |

Notes:
- This renderer can expose the handle in header metadata (`@handle`) while nested lockups carry UC IDs.
- FilterTube now treats this card as a first-class block target for handle, channel ID, and keyword matching.

---

## v3.2.1 Implementation Summary

### ✅ Completed v3.2.1 Enhancements

| Feature | Implementation Status | Key Files |
| --- | --- | --- |
| **Network Snapshot Interception** | ✅ Complete | `js/seed.js#stashNetworkSnapshot`, `js/injector.js` |
| **Avatar Stack Collaboration Detection** | ✅ Complete | `js/injector.js#extractFromAvatarStackViewModel`, `js/filter_logic.js` |
| **Topic Channel Support** | ✅ Complete | `js/render_engine.js#isTopicChannel`, `js/background.js` |
| **Post-Block Enrichment** | ✅ Complete | `js/background.js#schedulePostBlockEnrichment` |
| **Enhanced Kids Video Support** | ✅ Complete | `js/filter_logic.js`, `js/content/dom_extractors.js` |
| **Mix Card Exclusion** | ✅ Complete | `js/content_bridge.js#isMixCardElement` |
| **Enhanced CORS Handling** | ✅ Complete | `js/background.js#fetchChannelInfo` |

### 🎯 v3.2.1 Architecture Impact

- **Reduced Network Use**: Most channel identity should resolve from stashed snapshots or learned maps when those sources expose enough identity; weak watch, Shorts, Kids, playlist, and menu targets can still require bounded fallback resolvers.
- **Improved Collaboration Detection**: Avatar stacks provide better collaborator extraction
- **Better Error Recovery**: Multiple fallback strategies for channel resolution
- **Resolver Reduction Boundary**: Snapshot stashing can reduce resolver calls when payloads expose enough identity; current behavior still needs route-specific proof for weak watch, Shorts, Kids, playlist, menu, and collaborator targets.
- **Topic Channel Awareness**: Special handling for auto-generated YouTube channels

### 📋 Tags Still Under Investigation

| Renderer/Component | Current Status | Investigation Needed |
| --- | --- | --- |
| `compactAutoplayRenderer` | ⚠️ **STILL MISSING** | Add extraction paths for autoplay modules |
| `expandableMetadataRenderer` | ⚠️ **STILL MISSING** | AI summary text filtering requirements |
| `channelSubMenuRenderer` | ⚠️ **STILL MISSING** | Playlist menu text filtering needs |
| `watchCardRHPanelRenderer` | ⚠️ **STILL MISSING** | Right-hand hero layout mapping |
| `horizontalCardListRenderer` | ⚠️ **STILL MISSING** | Album shelf refinement chips |
| `watchCardHeroVideoRenderer` | ⚠️ **STILL MISSING** | Hero watch card extraction |
| `watchCardSectionSequenceRenderer` | ⚠️ **STILL MISSING** | Vertical hero list container |

### ✅ **RECENTLY IMPLEMENTED** (Previously Missing)

| Renderer/Component | Previous Status | Current Status | Notes |
| --- | --- | --- | --- |
| `continuationItemRenderer` | ⚠️ Missing | ✅ **IMPLEMENTED v3.2.1** | Comment continuations @js/seed.js#546 |
| `itemSectionRenderer` | ⚠️ Missing | ✅ **IMPLEMENTED v3.2.1** | Comment section removal @js/seed.js#377 |
| `twoColumnWatchNextResults` | ❌ Not parsed | ✅ **IMPLEMENTED v3.2.1** | Watch page structure @js/filter_logic.js#813 |
| `watchCardRichHeaderRenderer` | ⚠️ Missing | ✅ **IMPLEMENTED v3.2.1** | Universal watch cards @js/filter_logic.js#361 |
| `backstagePollRenderer` | ❌ Not parsed | ✅ **IMPLEMENTED v3.2.1** | Poll questions @js/filter_logic.js#472 |
| `backstageQuizRenderer` | ❌ Not parsed | ✅ **IMPLEMENTED v3.2.1** | Quiz questions @js/filter_logic.js#481 |
| `menuRenderer` | ℹ️ UI only | ✅ **IMPLEMENTED v3.2.1** | Menu navigation @js/content_bridge.js#3901 |
| `ticketShelfRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Ticket shelves @js/filter_logic.js#422 |
| `podcastRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Podcast content @js/filter_logic.js#425 |
| `richShelfRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Rich shelves @js/filter_logic.js#438 |
| `channelVideoPlayerRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Channel videos @js/filter_logic.js#444 |
| `compactRadioRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Compact radio @js/filter_logic.js#419 |
| `relatedChipCloudRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Related chips @js/filter_logic.js#365 |
| `chipCloudRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Chip clouds @js/filter_logic.js#369 |
| `chipCloudChipRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Individual chips @js/filter_logic.js#372 |
| `secondarySearchContainerRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Search container @js/filter_logic.js#388 |

### 🔍 Future Monitoring Points

1. **AI & Experimental Features**: Monitor `yt-button-view-model` for "Ask" button and other AI features
2. **Badge Text Evolution**: Watch for new badge types in `yt-thumbnail-overlay-badge-view-model`
3. **Chip Cloud Expansion**: Monitor feed filter chips for potential filtering requirements
4. **Mobile Layout Changes**: Continue validating mobile-specific renderers and DOM structures
