# April 28 Watch / Playlist Regression Analysis

Date: 2026-04-29

## Problem

After the April 28 watch/Mix/collaboration fixes, several watch-page and player-playlist rows could be added by UC ID but still showed alternate ID as `Not fetched`. User-visible examples included:

- `UCU8hEdjK8u27TM7KA8JVIEw` / `UsherVEVO`
- `UCRSZzzNedo9M2629ZTKBANA` / `Sergey Lazarev`
- `UChtO6P3fzOVcFqMwGmXBJwA` / `7thfloorpizza`
- `UCPPrpXysCKd80NygXLdGX7g` / `Sourhouse`
- `UCgbuk8KQAdWxd60lJ6NHr8Q` / `MOLLY`

The Channel Management UI also visibly refreshed channel rows and avatars during simple row interactions such as toggling `Filter All`.

## April 28 Commit Range

```text
dd7d17e Port mobile runtime parity fixes
d04ce52 Backport exact filter and menu state parity
61c7e84 Soften collab menu selected tint
ae51de3 Fix Mix collaborator discriminator
af667b9 Prefer authoritative collaborator rosters
24a91f5 Document collaborator roster precedence
fc2f7c3 Document mobile app upstream checkpoint
073960d Fix weak watch menu identity recovery
```

## Relevant Change Groups

```text
content_bridge.js
  - Added stronger Mix/card discriminator logic.
  - Added authoritative Collaborators sheet precedence.
  - Routed weak watch/playlist menu identity through videoId-backed recovery.
  - Added desktop lockup metadata row extraction.

background.js
  - Made Filter All derived keywords Exact.
  - Added post-block enrichment and watch identity repair paths.
  - Added compiled settings refresh paths for video/channel maps.

dom_fallback.js
  - Added watch/Mix/player playlist row handling.
  - Temporarily made active handle resolution cache-only to avoid page-context CORS fetches.
```

## Root Cause

The regression was not that YouTube lacks alternate IDs. The documented JSON/HTML payloads do contain them through `canonicalBaseUrl`, `vanityChannelUrl`, and owner profile URLs.

The failure came from three local behaviors:

1. UC-first enrichment could return a successful row from channel-page metadata with `name`, `logo`, and `UC ID`, but no `@handle`/custom URL.
2. Post-block enrichment rewrote the existing channel row even when the newly fetched record was identical and still missing alternate identity. That storage write invalidated caches and made the options/app channel list redraw, so avatars appeared to refresh.
3. DOM fallback was changed to cache-only handle matching. That removed CORS noise, but it also meant handle-only DOM cards could stay visible when the saved block entry only had a UC ID and `channelMap` did not yet know the handle.
4. The first-save skip-fetch gate still treated `metadata.displayHandle` as enough metadata. Rows such as `@pitbull` and `@pragmaticengineer` could therefore be persisted before an authoritative name/logo fetch, leaving the saved row with a blank name and making the UI display the handle fallback until post-block enrichment repaired it.
5. SPA search responses were processed/harvested, but `seed.js` did not keep `/youtubei/v1/search` as a main-world snapshot root. After navigating from watch to search without a full reload, collaborator rosters that existed only in the search XHR were unavailable to `FilterTube_RequestCollaboratorInfo`, so the menu stayed on `Fetching collaborators...`.

## Fix Applied

```text
UC-first enrichment
  fetchChannelInfo(UC...) now performs a no-credentials public channel-page retry
  before returning a UC-only record. This second pass reads:
    - vanityChannelUrl
    - canonicalBaseUrl
    - /@handle URL candidates
    - handle text candidates

No-op storage guard
  handleAddFilteredChannel() now compares existing vs updated channel records.
  If post-block enrichment did not add any real data, it skips the channel-list
  storage write and avoids a full UI redraw/avatar reload.

DOM fallback handle matching
  fetchIdForHandle(..., { backgroundOnly: true }) now resolves through the
  background fetchChannelDetails path instead of page-context /@handle/about
  fetches. That keeps CORS noise out while still allowing UC-only blocked rows
  to hide handle-only DOM cards after channelMap is learned.

Options UI redraw
  tab-view no longer rebuilds the whole channel list for save events or simple
  Filter All / comments-toggle channelUpdated events.

First-save row completeness
  handleAddFilteredChannel() no longer skips fetchChannelInfo() just because a
  handle is already known. The skip path now requires a real channel name, so
  first writes have a chance to save name/logo before auto-backup observes them.

SPA search collaborator lookup
  seed.js now stashes latest and recent /youtubei/v1/search responses, and
  injector.js includes those roots in channel/collaborator main-world searches.
  This keeps collaborator roster lookup available after watch -> search SPA
  navigation.
```

## Current Risk

The static and source-level fix is in place, but live watch/player-playlist QA must still prove:

- A newly blocked `UsherVEVO` row saves `@ushervevo` or equivalent alternate ID.
- Existing UC-only rows are repaired without rewriting identical records.
- Toggling `Filter All` does not reload all channel avatars.
- Blocked UC-only rows hide handle-only DOM cards after background handle resolution populates `channelMap`.
- Watch -> search SPA navigation can still resolve collaborator rosters from the captured search response.
