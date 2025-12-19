# Legacy Channel Identity Guide

This document specifies how FilterTube identifies and matches channels using legacy YouTube URL formats.

## 1. Legacy URL Formats

Before the introduction of `@handles`, YouTube used two primary custom URL schemes:

1.  **`/user/Name` (Legacy User URLs)**
    - Examples: `youtube.com/user/PartnerName`, `youtube.com/user/shakira`.
    - These are the oldest URLs and often map to a channel's original global UID.
    - **FilterTube slug**: `user/shakira`

2.  **`/c/Name` (Custom URLs)**
    - Examples: `youtube.com/c/VídeoseMensagens`, `youtube.com/c/ChannelName`.
    - Introduced between 2013 and 2022.
    - **FilterTube slug**: `c/vídeosemensagens`

## 2. Extraction Logic

FilterTube extracts these slugs from `browseEndpoint.canonicalBaseUrl` or DOM `href` attributes.

- **Normalization**: Slugs are always **percent-decoded** and **lowercased**.
  - Internal logic: `decodeURIComponent(path).toLowerCase()`.
- **UC ID Resolution**: When a legacy channel is encountered, FilterTube attempts to resolve it to a canonical `UC...` ID via:
  - `channelMap` lookup (pre-learned or cached).
  - Background `/about` fetch.
  - Interception of browse endpoints in the Main World.

## 3. Matching Semantics (`identity.js`)

Matching is performed in `FilterTubeIdentity.channelMatchesFilter`:

1.  **Direct Match**: If the filter is `c/name`, it is compared directly against the channel metadata's `customUrl` field.
2.  **Mapping Match**: If the channel metadata only contains a UC ID, FilterTube checks `channelMap` to see if `c/name` maps to that ID.
3.  **Bidirectional Sync**: Once a mapping is established, it is broadcast to all tabs, ensuring legacy channels are filtered via their stable ID even when the page only provides the legacy URL.

## 4. Why This Matters

YouTube often omits `@handles` in Shorts metadata and some legacy API responses, providing only the `canonicalBaseUrl`. By treating `customUrl` as a first-class identifier, FilterTube ensures 100% coverage for these channels across all surfaces.
