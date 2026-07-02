# FilterTube YTM CamelCase DOM Index - 2026-07-02

## Scope

Source sample: `ytm_new_CamelCase.html`.

Purpose: record what changed in the current mobile YouTube DOM and why only a
subset of the many camelCase classes should become FilterTube hide/card
selectors.

## Finding

The sample contains many `ytm-*` custom elements and many camelCase host
classes. Most of them are wrappers, byline metadata, thumbnail overlays,
buttons, chip controls, player controls, or post attachment children. They are
important for extraction, but they must not all become hide targets.

The two content-card targets that were missing from the runtime selector set
after the first YTM camelCase pass were:

| Selector | Observed role | Evidence lines | Runtime status |
| --- | --- | --- | --- |
| `ytm-video-card-renderer` | Mobile horizontal video card, commonly in shelves/lists | 20825, 20918, 20989, 21080, 21171, 21246, 21316, 21407, 21498, 21589, 21659, 21751 | Added to card discovery, fallback hiding, quick-block, fallback menu, and channel extraction |
| `.YtmCompactVideoRendererHost` | Class-only mobile compact video card host | 22831, 22934, 23037, 25198, 25297, 25396, 25521, 25603 | Added to card discovery, fallback hiding, quick-block, fallback menu, and channel extraction |

## Observed `ytm-*` Custom Elements

The source sample included these `ytm-*` tags. Counts and line examples are
kept to show the breadth of the new DOM without making every child control a
FilterTube card target.

| Tag | Count | First observed lines | Classification |
| --- | ---: | --- | --- |
| `ytm-app` | 4 | 948, 5599, 5662, 14141 | Page shell |
| `ytm-browse` | 6 | 5861, 14132, 20460, 26722 | Page shell |
| `ytm-watch` | 2 | 1074, 5589 | Page shell |
| `ytm-search` | 2 | 14149, 20455 | Page shell |
| `ytm-section-list-renderer` | 6 | 14149, 20455, 20808, 26709 | Wrapper |
| `ytm-rich-grid-renderer` | 2 | 5865, 14129 | Wrapper |
| `ytm-rich-item-renderer` | 70 | 6324, 6449, 6916, 7064 | Card wrapper |
| `ytm-media-item` | 142 | 2174, 2261, 2271, 2370 | Content/card body |
| `ytm-video-with-context-renderer` | 134 | 2170, 2267, 2376, 2489 | Content/card host |
| `ytm-video-card-renderer` | 48 | 20825, 20918, 20989, 21080 | Content/card host |
| `ytm-compact-video-renderer` | 36 | 22830, 22933, 23036, 23138 | Content/card host |
| `ytm-compact-radio-renderer` | 2 | 3957, 4044 | Content/card host |
| `ytm-radio-renderer` | 8 | 7330, 7429, 11638, 11737 | Content/card host |
| `ytm-compact-channel-renderer` | 2 | 14444, 14723 | Channel/card host |
| `ytm-compact-playlist-renderer` | 22 | 23163, 23263, 23363, 23463 | Playlist/card host |
| `ytm-playlist-panel-entry-point` | 2 | 1317, 1361 | Watch playlist wrapper |
| `ytm-watch-card-hero-video-renderer` | 2 | 14219, 14262 | Watch/search card host |
| `ytm-watch-card-rich-header-renderer` | 2 | 14194, 14219 | Watch/search card host |
| `ytm-shorts-lockup-view-model` | 88 | 6548, 6625, 6639, 6717 | Shorts card host |
| `ytm-reel-shelf-renderer` | 2 | 23481, 25187 | Shorts shelf wrapper |
| `ytm-backstage-post-renderer` | 12 | 6050, 6322, 11280, 11481 | Community post host |
| `ytm-backstage-post-thread-renderer` | 12 | 6049, 6322, 11279, 11481 | Community post wrapper |
| `ytm-backstage-image-renderer` | 26 | 11365, 11369, 12138, 12143 | Post media child |
| `ytm-post-multi-image-renderer` | 6 | 12133, 12173, 12516, 12574 | Post media child |
| `ytm-badge-and-byline-renderer` | 162 | 2215, 2232, 2319, 2325 | Metadata source |
| `ytm-channel-thumbnail-with-link-renderer` | 134 | 2196, 2203, 2299, 2306 | Metadata source |
| `ytm-channel-metadata-renderer` | 4 | 26718, 26722, 27784, 27787 | Metadata source |
| `ytm-thumbnail-cover` | 190 | 2177, 2194, 2274, 2297 | Media child |
| `ytm-thumbnail-overlay-time-status-renderer` | 218 | 2186, 2191, 2289, 2294 | Media child |
| `ytm-thumbnail-overlay-resume-playback-renderer` | 154 | 2282, 2287, 2390, 2395 | Media child |
| `ytm-feed-filter-chip-bar-renderer` | 2 | 5868, 6043 | Chip control |
| `ytm-chip-cloud-renderer` | 2 | 2119, 2168 | Chip control |
| `ytm-chip-cloud-chip-renderer` | 62 | 2121, 2127, 2132, 2137 | Chip control |
| `ytm-related-chip-cloud-renderer` | 2 | 2118, 2168 | Chip control |
| `ytm-button-renderer` | 20 | 1011, 1035, 1389, 1403 | Control |
| `ytm-toggle-button-renderer` | 24 | 6214, 6245, 6252, 6283 | Control |
| `ytm-menu-renderer` | 4 | 7706, 7735, 23503, 23518 | Control |
| `ytm-bottom-sheet-renderer` | 264 | 1405, 1428, 2234, 2258 | Control |
| `ytm-companion-slot` | 2 | 1363, 1430 | Sponsored surface |
| `ytm-companion-ad-renderer` | 2 | 1364, 1430 | Sponsored surface |
| `ytm-watch-player-controls` | 2 | 730, 943 | Player control |
| `ytm-custom-control` | 2 | 729, 943 | Player control |
| `ytm-crawler-description` | 2 | 1119, 1315 | Description/metadata |

## CamelCase Class Buckets

### Content/Card Targets

These are actual card hosts or wrapper hosts that can own a hide, quick-block,
fallback-menu, or identity extraction decision.

| Class | Evidence lines | Runtime status |
| --- | --- | --- |
| `YtmCompactMediaItemHost` | 3962, 14449, 22835, 22938, 23041, 23168, 23268, 23368 | Already supported |
| `YtmCompactVideoRendererHost` | 22831, 22934, 23037, 25198, 25297, 25396, 25521, 25603 | Added in this patch |
| `YtmCompactRadioRendererHost` | 3958 | Already supported |
| `YtmCompactChannelRendererHost` | 14445 | Already supported |
| `ytmBackstagePostRendererHost` | 6051, 11281, 12049, 12432, 12952, 13695 | Already supported |
| `ytmBackstagePostThreadRendererHost` | 6050, 11280, 12048, 12431, 12951, 13694 | Already supported |

### Metadata Sources

These are read for channel/title/author details, but they are not independent
hide targets.

| Class | Evidence lines |
| --- | --- |
| `YtmCompactMediaItemHeadline` | 4005, 14461, 22882, 22985, 23087, 23221, 23321, 23421 |
| `YtmCompactMediaItemByline` | 4010, 14466, 14469, 22889, 22992, 23094, 23226, 23326 |
| `YtmCompactMediaItemMetadata` | 4001, 14459, 22878, 22981, 23083, 23217, 23317, 23417 |
| `YtmCompactMediaItemStats` | 22892, 22896, 22995, 22999, 23097, 23101, 25255, 25259 |
| `YtmBadgeAndBylineRendererHost` | 2216, 2320, 2326, 2441, 2541, 2648, 2763, 2879 |
| `YtmBadgeAndBylineRendererItemByline` | 2322, 2335, 2443, 2449, 2543, 2549, 2650, 2656 |
| `YtmChannelThumbnailWithLinkRendererHost` | 2197, 2300, 2423, 2522, 2631, 2744, 2860, 2956 |
| `ytmChannelMetadataRendererHost` | 26719, 27784 |
| `ytmBackstagePostRendererHostContentText` | 6105, 11335, 12103, 12486, 13006, 13749 |

### Child Media / Thumbnail / Overlay

These are children of a card or post. They should not be used as independent
card targets because doing so increases false-hide risk.

| Class | Evidence lines |
| --- | --- |
| `YtmCompactMediaItemImage` | 3965, 14450, 22837, 22940, 23043, 23171, 23271, 23371 |
| `YtmThumbnailOverlayResumePlaybackRendererHost` | 2283, 2391, 2505, 2712, 2828, 3142, 3443, 3558 |
| `YtmThumbnailOverlayResumePlaybackRendererThumbnailOverlayResumePlaybackProgress` | 2285, 2393, 2507, 2714, 2830, 3144, 3445, 3560 |
| `ytmBackstageImageRendererHost` | 11366, 12139, 12149, 12159, 12168, 12522, 12532, 12542 |
| `ytmPostMultiImageRendererHost` | 12134, 12517, 13046 |
| `shortsLockupViewModelHostThumbnailParentContainer` | observed in Shorts sample | Child of `ytm-shorts-lockup-view-model` |

### Controls / Wrappers

These should not become hide targets. They can be used for route context,
button placement, or inventory only.

| Class | Evidence lines | Reason |
| --- | --- | --- |
| `YtmBrowseHost` | 5861, 20460, 26726 | Page wrapper |
| `ytmSearchPageHost` | 14149 | Page wrapper |
| `YtmChipCloudRendererHost` | 2120 | Chip control |
| `YtmChipDividerRendererHost` | 5892 | Chip control |
| `YtmCallToActionButtonRendererHost` | 14236 | CTA control |
| `YtmCollageHeroImageRendererHost` | 14224 | Visual subcomponent |
| `YtmCompactMediaItemMenu` | 4014, 22901, 23004, 23106, 23231, 23331, 23431, 25264 | Menu control |
| `ytmWatchPlayerControlsHost` | 730 | Player control |
| `ytmCustomControlHost` | 730 | Player control |
| `ytCommentActionButtonsRendererHost` | observed in post/comment samples | Action control |
| `ytSpecTouchFeedbackShapeHost` | observed in touch feedback samples | Touch/ripple control |

## Runtime Changes

- `js/content/dom_extractors.js`: added `ytm-video-card-renderer` and
  `.YtmCompactVideoRendererHost` to shared video-card selectors.
- `js/content/block_channel.js`: added both selectors to quick-block host,
  anchor, card selector, class-name, and native-menu/dropdown climbing paths.
- `js/content_bridge.js`: added both selectors to YTM collaborator-card
  recognition, fallback-menu placement, YTM card identity extraction, and
  menu injection checks.
- `js/content/dom_fallback.js`: added both selectors to mobile Home tap-target
  setup and DOM fallback YTM card/title handling.

## Release Boundary

This patch intentionally does not add every observed camelCase class to card
selectors. The correct boundary is:

1. Hide/select the nearest real content card host.
2. Read metadata from child byline/title/avatar/post-text nodes.
3. Ignore player controls, chip controls, touch feedback, and thumbnail
   overlays as card identities.

