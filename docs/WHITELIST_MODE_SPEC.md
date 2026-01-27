# Whitelist Mode Specification (v3.2.3)

## Overview

This document specifies the implementation of Whitelist Mode for FilterTube v3.2.3, allowing users to hide all content except explicitly allowed channels and keywords.

## Goals

- Support **Blocklist mode** (current behavior): hide content matching blocked channels/keywords.
- Support **Whitelist mode** (new behavior): hide all content **except** content that matches whitelisted channels and/or whitelisted keywords.
- Provide a **fast list-building workflow** using existing 3-dot "Block Channel" flow:
  - User switches to Blocklist mode to browse freely.
  - User blocks channels using existing UI, which adds entries to the blocklist.
  - When user switches back to Whitelist mode, the current blocklist is **merged into whitelist** and the blocklist is **cleared** (staging model).

## Storage Model (Profiles V4)

Profiles are stored in `ftProfilesV4`.

### Main (YouTube)

- `profiles[profileId].main.mode`: `'blocklist' | 'whitelist'` (default: `'blocklist'`)
- `profiles[profileId].main.channels`: existing **blocklist** channel entries
- `profiles[profileId].main.keywords`: existing **blocklist** keyword entries
- `profiles[profileId].main.whitelistChannels`: **allowlist** channel entries
- `profiles[profileId].main.whitelistKeywords`: **allowlist** keyword entries

### Kids (YouTube Kids)

- `profiles[profileId].kids.mode`: `'blocklist' | 'whitelist'` (default remains `'blocklist'`)
- `profiles[profileId].kids.blockedChannels`: existing blocklist channels
- `profiles[profileId].kids.blockedKeywords`: existing blocklist keywords
- `profiles[profileId].kids.whitelistChannels`: allowlist channels
- `profiles[profileId].kids.whitelistKeywords`: allowlist keywords

## Compiled Settings Payload (Background -> Content)

Content scripts receive compiled settings from background via the existing settings request path.

New fields:

- `listMode`: `'blocklist' | 'whitelist'`
- `whitelistChannels`: channel entries list
- `whitelistKeywords`: compiled keyword list (`[{pattern, flags, ...}]`)

Existing fields remain:

- `filterChannels` (blocklist channels)
- `filterKeywords` (blocklist keywords)
- `filterKeywordsComments` (blocklist comments)

## Filtering Semantics

### Blocklist mode (current)

- Block when **any** blocked-channel match OR **any** blocked-keyword match.

### Whitelist mode (new)

- Default behavior: **block** content.
- Allow when **any** whitelist rule matches:
  - **Channel allow**: channel metadata matches an entry in `whitelistChannels`.
  - **Keyword allow**: title/description matches any regex in `whitelistKeywords`.

Notes:

- If both allowlists are empty, whitelist mode will effectively hide everything.
- Comment filtering behavior is unchanged initially (whitelist mode focuses on primary content surfaces).

## Mode Switching (Staging Merge)

New background message: `FilterTube_SetListMode`

- When switching to `'blocklist'`: only updates mode.
- When switching to `'whitelist'`:
  - Merge current blocklist channels -> whitelistChannels (dedupe)
  - Merge current blocklist keywords -> whitelistKeywords (dedupe)
  - Clear the blocklist (channels/keywords)

This enables:

- Use existing 3-dot "Block Channel" as a quick way to build whitelist.

## PIN / Profile Rules

- UI should only allow modifications while unlocked for PIN-protected profiles.
- Profile switching remains available regardless of lock state (existing behavior).

## UI Implementation (v3.2.3)

- Blocklist/Whitelist toggle added to:
  - Popup header
  - Tab UI (filters page)
- Optional "Transfer" helpers:
  - whitelist -> blocklist
  - blocklist -> whitelist (manual trigger)

## User Flow (Whitelist Mode)

This section describes the expected end-to-end user experience so users understand what will be visible, what will be hidden, and how to build a whitelist without confusion.

### Core Mental Model

- Whitelist mode means: **Hide everything by default**.
- Only allow content that matches at least one rule:
  - A whitelisted channel (by UC id, @handle, customUrl, or name fallback), OR
  - A whitelisted keyword (title/description match).

### Primary Workflow (Staging Model)

1. Start in **Whitelist mode** to enforce an “allow only” feed.
2. Temporarily switch to **Blocklist mode** to browse normally.
3. Use existing 3-dot **Block Channel** flow to quickly collect channels.
4. Switch back to **Whitelist mode**:
   - Blocklist channels/keywords are merged into whitelist.
   - Blocklist is cleared.

### YouTube Main: Surface-by-surface Behavior

#### Home / Search / Subscriptions / Channel pages

- Video cards:
  - Show only whitelisted matches.
  - Hide non-matching videos.
- Playlist cards (normal playlists):
  - The playlist card itself should be openable.
  - When opened, the user may land on a playlist page or watch page; the playlist’s video list is then filtered by whitelist rules.
- Mix / Radio cards:
  - Mix cards should be openable.
  - Once the watch/queue UI is visible, the queue/playlist panel should only show playable whitelisted items.

#### Watch page (video details, actions, right rail)

- The watch page chrome should remain usable (e.g., video title area, channel row, buttons bar, right rail) unless the user has explicit content-control toggles enabled to hide them.
- Recommendations / right rail:
  - Non-whitelisted recommended videos should be hidden.
  - Whitelisted recommended videos should stay visible.

#### Watch page: Playlist panel (when `?list=...` is present)

- The playlist panel should remain visible unless the user explicitly enabled the content control `hideWatchPlaylistPanel`.
- Playlist rows:
  - Non-whitelisted videos in the playlist panel should be hidden.
  - Whitelisted videos should remain visible.
- Playback safety:
  - When the next/prev or autoplay would move into a hidden (non-whitelisted) playlist item, navigation should skip to the next visible item.
- Identity resolution:
  - If a playlist row is hidden and identity for that row is temporarily unknown, it should remain hidden until identity is resolved (prevents a blocked/non-whitelisted item from becoming playable during async enrichment).

#### Shorts

- If `hideAllShorts` is enabled, Shorts are hidden (same as Blocklist mode).
- If `hideAllShorts` is disabled:
  - In Whitelist mode, Shorts should still be filtered by whitelist rules:
    - Whitelisted Shorts show.
    - Non-whitelisted Shorts hide.

#### Comments

- In Whitelist mode, the goal is to avoid “comment content browsing”, but still allow the user to interact when needed.
- Expected behavior:
  - Hide comment threads.
  - Keep the user’s ability to add a comment (input / composer) usable.

### YouTube Kids: Surface-by-surface Behavior

- The same whitelist semantics apply.
- Because Kids often relies on DOM-only components:
  - Video cards must be filtered reliably even when channel identity is learned after initial render.
  - Playlists within Kids should behave like Main: openable, but the playable list is filtered to whitelisted items.

## Acceptance Checklist

- Whitelist mode:
  - When both allowlists are empty, nearly all content is hidden (no “leak”).
  - When allowlists are non-empty, content that matches shows without requiring a page refresh.
- Watch page:
  - Video details/actions/right rail do not disappear unless content controls request it.
  - Right rail recommendations re-filter live as settings change.
- Playlist/Mix:
  - Playlist and Mix cards are openable.
  - Watch playlist panel shows only whitelisted rows.
  - Autoplay / next / prev do not land on hidden rows.
- Shorts:
  - Whitelisted Shorts show; non-whitelisted Shorts hide.
- Comments:
  - Threads hidden, comment input remains usable.
