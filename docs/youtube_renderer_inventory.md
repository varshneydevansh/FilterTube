# YouTube Renderer Inventory (Nov 2025)

This document tracks which YouTube renderers/selectors FilterTube currently targets and how the latest DOM samples map to them.

## Home Feed

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `richItemRenderer` | Wrapper around per-card renderer in rich grid | ✅ Covered @js/filter_logic.js#136-142 |
| `lockupViewModel` | New lockup-based card metadata (titles, subtitles) | ✅ Covered @js/filter_logic.js#150-154 |
| `videoRenderer` / `gridVideoRenderer` | Legacy rich-grid video cards | ✅ Covered @js/filter_logic.js#129-133 |
| `playlistRenderer` / `radioRenderer` | Mix/playlist shelves | ✅ Covered @js/filter_logic.js#206-215 |
| `shelfRenderer` | Home page shelf headers | ✅ Covered @js/filter_logic.js#145-147 |

### New DOM elements from sample
| DOM tag / component | Associated data | Coverage | Notes |
| --- | --- | --- | --- |
| `<ytd-rich-item-renderer>` | Hosts rich grid cards | ✅ Data surfaces through `richItemRenderer` which we filter pre-DOM |
| `<yt-lockup-view-model>` & child `<yt-lockup-metadata-view-model>` | Carries title, byline, metadata | ✅ JSON consumed via `lockupViewModel` paths @js/filter_logic.js#150-154 |
| `<yt-collection-thumbnail-view-model>` / `<yt-collections-stack>` | Visual mix thumbnail stack | ℹ️ Visual only; no keyword-bearing text | No filtering required unless we hide thumbnails later |
| `<yt-thumbnail-view-model>` | Thumbnail container | ℹ️ Covered indirectly when we hide filtered cards |
| `<yt-thumbnail-overlay-badge-view-model>` (Mix badge) | Badge text like “Mix” | ⚠️ Not parsed; consider adding to keyword scan if badges become relevant |

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

### Collaboration Videos (2025-12-01 sample, NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<div id="attributed-channel-name">` | `attributedChannelName` in `lockupViewModel.byline` | ✅ Covered | Extracts all collaborating channels; blocks if ANY collaborator is blocked |
| `<yt-text-view-model>` with attributed string | DOM-only collaboration display | ✅ Covered | Parses "Channel A ✓ and Channel B ✓" format; extracts names, handles, and IDs for all collaborators |

### Podcasts shelf (Podcasts tab, 2025-11-18 sample)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-rich-shelf-renderer layout="podcasts">` | `richShelfRenderer` | ℹ️ Layout | Container for podcasts shelf; traversal reaches nested `podcastRenderer` entries |
| `<ytd-rich-item-renderer is-shelf-item>` | `podcastRenderer` payload | ✅ Covered | Podcast title/description + publisher captured, including metadata rows |
| `<yt-collection-thumbnail-view-model>` | `lockupViewModel.collectionThumbnailViewModel` | ℹ️ | Stack thumbnail + square art; no additional text beyond badges |
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

### Watch Next chip cloud (2025-11-18 sample)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<yt-related-chip-cloud-renderer>` | `relatedChipCloudRenderer` | ✅ Covered | Container metadata now parsed for chip subtitles; keyword filtering can suppress chip groups |
| `<yt-chip-cloud-renderer>` | `chipCloudRenderer` | ℹ️ Layout | Hosts chip list; parser now recurses into child chips |
| `<yt-chip-cloud-chip-renderer>` | `chipCloudChipRenderer` | ✅ Covered | Chip labels & navigation endpoints feed into keyword + channel handle filtering |
| `<chip-shape>` button label | DOM-only | ⚠️ Fallback | Still monitor if chips ship DOM-only text without JSON |

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
- No new Shorts DOM included. Continue validating for `yt-reel-player-overlay` variants.

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

## Feed Filter Chips (New Sample)

| DOM tag / component | Associated data | Coverage | Notes |
| --- | --- | --- | --- |
| `<ytd-feed-filter-chip-bar-renderer>` | Horizontal chip bar | ❌ Not targeted |
| `<yt-chip-cloud-chip-renderer>` | Individual chips ("Music", "Mixes") | ❌ Not targeted |
| `<chip-shape>` button text | Visible string we might want to filter | ⚠️ Consider parsing if chips drive exposure to undesired topics |

These chips originate from the YouTube UI rather than API payloads we currently filter; we may need DOM-level observers if we want to auto-select or hide them.

## Notifications (Bell / Inbox)

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-notification-renderer>` | `notificationRenderer` | ✅ Covered | Headline, long message, and channel IDs/handles now parsed |
| `<yt-formatted-string class="message">` | `notificationRenderer.shortMessage` | ⚠️ Partial | JSON path parsed; confirm DOM-only variants |
| `<ytd-multi-page-menu-renderer>` / `<yt-multi-page-menu-section-renderer>` | `multiPageMenuRenderer` | ℹ️ Layout | Container; parser recurses into notification children |
| `<ytd-comment-video-thumbnail-header-renderer>` | `commentVideoThumbnailHeaderRenderer` | ✅ Covered | Provides video title + channel for context filtering |
| `<ytd-menu-renderer>` (notification actions) | `menuRenderer` | ℹ️ | Action menu labels (“Turn off”, “Hide this notification”); UI-only for now |
| `<ytd-comments>` / `<ytd-comment-thread-renderer>` | `commentThreadRenderer` | ✅ Covered | Notifications drawer reuses comment components; existing rules should filter replies once data is intercepted |

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

## 3-Dot Menu Blocking Targets (v3.0.3)

FilterTube now injects a "Block Channel" option into the 3-dot menu for the following content types. This allows users to block channels directly from the UI without visiting the channel page.

| Content Type | Targeted DOM Elements | Notes |
| --- | --- | --- |
| **Standard Videos** | `ytd-rich-item-renderer`, `ytd-video-renderer`, `ytd-grid-video-renderer`, `ytd-compact-video-renderer` | Covers Home, Search, Channel Videos, and Sidebar suggestions. |
| **Shorts** | `ytd-reel-item-renderer`, `ytd-reel-video-renderer`, `reel-item-endpoint`, `ytm-shorts-lockup-view-model`, `ytm-shorts-lockup-view-model-v2` | Covers Shorts Shelf, Shorts Player, and Mobile/Search Shorts. Uses async fetch for channel info. |
| **Posts** | `ytd-post-renderer` | Community posts on Home and Channel pages. |
| **Playlists** | `ytd-playlist-panel-video-renderer`, `ytd-playlist-video-renderer` | Videos within a playlist view. |
| **Mobile/Compact** | `ytd-compact-promoted-video-renderer`, `ytm-compact-video-renderer`, `ytm-video-with-context-renderer` | Mobile web and specific compact layouts. |
| **Containers** | `ytm-item-section-renderer`, `ytd-rich-shelf-renderer` | Shelves and sections containing shorts/videos. |

**Technical Note:**
The injection logic uses a `MutationObserver` to detect when a dropdown menu (`tp-yt-iron-dropdown` or `ytd-menu-popup-renderer`) appears. It then traces back to the `lastClickedMenuButton` to identify the parent video card from the list above. For Shorts, an asynchronous background fetch is often required to resolve the channel handle/ID from the video URL.
