# FilterTube Architecture

This document provides visual diagrams and explanations of FilterTube's architecture.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FilterTube Extension                            │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Popup UI    │  │ Tab View UI │  │ Background  │  │ Content     │     │
│  │             │  │             │  │ Script      │  │ Script      │     │
│  │ - Settings  │  │ - Advanced  │  │             │  │ - Filtering │     │
│  │ - Controls  │  │   Settings  │  │ - Tab       │  │ - DOM       │     │
│  │             │  │ - Help      │  │   Management│  │   Observers │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │                │            │
│         └────────────────┼────────────────┼────────────────┘            │
│                          │                │                             │
│                          ▼                ▼                             │
│                   ┌─────────────────────────────────┐                   │
│                   │        Chrome Storage API       │                   │
│                   │                                 │                   │
│                   │ - filterKeywords                │                   │
│                   │ - filterChannels                │                   │
│                   │ - hideAllComments               │                   │
│                   │ - filterComments                │                   │
│                   └─────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Content Script Flow

```
┌─────────────────────┐
│ Document Start      │
│                     │
│ - Inject CSS        │
│ - Setup variables   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ DOM Ready           │
│                     │
│ - Load settings     │
│ - Setup observers   │
│ - Apply filters     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐         ┌─────────────────────┐
│ Main Observer       │◄───────►│ Specialized         │
│                     │         │ Observers           │
│ - Watch for new     │         │                     │
│   content           │         │ - Sidebar Observer  │
│ - Apply filters     │         │ - Shorts Observer   │
│   on changes        │         │ - Comment Observer  │
└──────────┬──────────┘         └─────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Navigation          │
│ Detection           │
│                     │
│ - URL changes       │
│ - Page type changes │
│ - Re-initialization │
└─────────────────────┘
```

## Filtering Process

```
┌─────────────────────┐
│ Video Element       │
│ Detected            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│ Extract Text        │     │ Extract Channel     │
│ Content             │     │ Information         │
│                     │     │                     │
│ - Title             │     │ - Polymer Data      │
│ - Description       │     │ - DOM Elements      │
│ - Metadata          │     │ - Multiple Attempts │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           └───────────┬───────────────┘
                       │
                       ▼
             ┌─────────────────────┐
             │ Match Against       │
             │ User Filters        │
             │                     │
             │ - Keywords          │
             │ - Channels          │
             └──────────┬──────────┘
                        │
                        ▼
             ┌─────────────────────┐
  ┌─────────►│ Element Marked As   │◄────────┐
  │          │                     │         │
  │   YES    │ Allowed or Filtered │    NO   │
  │          │                     │         │
  │          └─────────────────────┘         │
  │                                          │
  ▼                                          ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Show Element        │            │ Hide Element        │
│                     │            │                     │
│ - Set attribute     │            │ - Set attribute     │
│ - Show with CSS     │            │ - Hide with CSS     │
└─────────────────────┘            └─────────────────────┘
```

## Channel Information Extraction

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Channel Information Extraction Methods                                  │
│                                                                         │
│                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │
│  │ DOM-based           │  │ Polymer-based       │  │ URL-based       │  │
│  │ Extraction          │  │ Extraction          │  │ Extraction      │  │
│  │                     │  │                     │  │                  │  │
│  │ - Channel name      │  │ - Internal data     │  │ - href          │  │
│  │   selectors         │  │   structures        │  │   attributes    │  │
│  │ - Text content      │  │ - Navigation        │  │ - Channel ID    │  │
│  │ - Element           │  │   endpoints         │  │ - @handle       │  │
│  │   attributes        │  │ - Browse            │  │ - @handle       │  │
│  │                     │  │   endpoints         │  │   in URL        │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └────────┬────────┘  │
│             │                        │                      │           │
│             └────────────────────────┼──────────────────────┘           │
│                                      │                                  │
│                                      ▼                                  │
│                       ┌─────────────────────────────┐                   │
│                       │ Normalized Channel          │                   │
│                       │ Identifiers                 │                   │
│                       │                             │                   │
│                       │ - Channel ID                │                   │
│                       │ - @handle                   │                   │
│                       │ - Channel name              │                   │
│                       └─────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Performance Optimization Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Performance Optimization Techniques                                     │
│                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │
│  │ DOM-level           │  │ Processing-level    │  │ Observer-level  │  │
│  │ Optimizations       │  │ Optimizations       │  │ Optimizations   │  │
│  │                     │  │                     │  │                  │  │
│  │ - CSS-based hiding  │  │ - Batch processing  │  │ - Throttling    │  │
│  │ - Attribute-based   │  │ - Processing only   │  │ - Specialized   │  │
│  │   marking           │  │   when visible      │  │   observers     │  │
│  │ - Efficient         │  │ - Caching results   │  │ - Page-type     │  │
│  │   selectors         │  │ - Retry mechanism   │  │   observers     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Page-aware Optimization                                         │    │
│  │                                                                 │    │
│  │ Home Page    │ Watch Page   │ Search Page  │ Shorts Page       │    │
│  │              │              │              │                    │    │
│  │ - Grid items │ - Sidebar    │ - Results    │ - Vertical        │    │
│  │ - Shorts     │ - Comments   │ - Channels   │   scrolling       │    │
│  │ - Shelves    │ - Related    │ - Shorts     │ - Minimal         │    │
│  │              │   videos     │   results    │   metadata        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Zero-Flash Filtering Approach

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Zero-Flash Filtering Timeline                                           │
│                                                                         │
│                                                                         │
│  Load Start       CSS Injection       DOM Ready         First Paint     │
│  ┌───────┐        ┌───────┐          ┌───────┐         ┌───────┐        │
│  │       │        │       │          │       │         │       │        │
│──┘       └────────┘       └──────────┘       └─────────┘       └────────▶│
│                                                                         │
│                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │
│  │ "Pre-Hide" Phase    │  │ "Processing" Phase  │  │ "Reveal" Phase  │  │
│  │                     │  │                     │  │                  │  │
│  │ - Inject style      │  │ - Load settings     │  │ - Elements      │  │
│  │   element early     │  │ - Setup observers   │  │   marked as     │  │
│  │ - Hide all          │  │ - Extract channel   │  │   allowed are   │  │
│  │   potential video   │  │   info              │  │   shown         │  │
│  │   elements          │  │ - Match against     │  │ - Filtered      │  │
│  │ - Set up            │  │   filters           │  │   elements      │  │
│  │   transitions       │  │ - Mark elements     │  │   remain hidden │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## YouTube Component Types Handled

```
┌─────────────────────────────────────────────────────────────────────────┐
│ YouTube Component Types                                                 │
│                                                                         │
│                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │
│  │ Video Elements      │  │ Channel Elements    │  │ Shorts Elements │  │
│  │                     │  │                     │  │                  │  │
│  │ - ytd-video-        │  │ - ytd-channel-      │  │ - ytd-reel-     │  │
│  │   renderer          │  │   renderer          │  │   item-renderer │  │
│  │ - ytd-grid-video-   │  │ - channel-link      │  │ - ytm-shorts-   │  │
│  │   renderer          │  │ - owner-text        │  │   lockup-view-  │  │
│  │ - ytd-rich-item-    │  │ - author-text       │  │   model         │  │
│  │   renderer          │  │ - subscribers       │  │ - ytm-shorts-   │  │
│  │ - ytd-compact-      │  │                     │  │   lockup-view-  │  │
│  │   video-renderer    │  │                     │  │   model-v2      │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘  │
│                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │
│  │ Playlist Elements   │  │ Comment Elements    │  │ Misc Elements   │  │
│  │                     │  │                     │  │                  │  │
│  │ - ytd-playlist-     │  │ - ytd-comment-      │  │ - ytd-shelf-    │  │
│  │   renderer          │  │   thread-renderer   │  │   renderer      │  │
│  │ - ytd-radio-        │  │ - ytd-comment-      │  │ - ytd-channel-  │  │
│  │   renderer          │  │   renderer          │  │   video-player- │  │
│  │ - ytd-universal-    │  │ - ytd-comment-      │  │   renderer      │  │
│  │   watch-card-       │  │   replies-renderer  │  │ - ytd-ticket-   │  │
│  │   renderer          │  │                     │  │   shelf-        │  │
│  │                     │  │                     │  │   renderer      │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
``` 