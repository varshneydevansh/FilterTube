# Watch Playlist Identity Regression - 2026-04-29

## Symptom

Watch-page playlist and player-queue rows could block by UC ID, but Channel Management showed the alternate ID as `Not fetched`. Some rows needed a second filtering pass before disappearing from the player playlist.

## Root Cause

The regression came from the watch-menu recovery path added around the recent Mix/collaboration work:

1. Watch playlist rows correctly avoided saving weak row-only identity and routed through `watch:<videoId>`.
2. The background watch resolver could fall back to `videoChannelMap` and return only `{ id }` when watch HTML did not yield an alternate ID quickly.
3. `mergeStoredVideoIdentity()` preferred fetched IDs over the stored video map ID, so a weak watch fetch could overwrite the known row/video mapping.
4. The background `shouldSkipFetch` path dropped `metadata.displayHandle`, so even a resolved handle could be lost before persistence.
5. `fastExtractIdentityFromHtmlChunk()` did not strongly read owner/byline watch JSON fields such as `shortBylineText`, `ownerText`, and `ownerProfileUrl`.
6. UC-first enrichment depended too much on the parsed `ytInitialData` branch. When channel page parsing failed or short-circuited, the fallback kept name/logo/UC but did not broadly read documented JSON string fields like `vanityChannelUrl`, `canonicalBaseUrl`, or `/@handle` URLs already present in the HTML payload.
7. DOM fallback active handle resolution could still try page-context `/@handle/about` fetches, which can be CORS-blocked. That path should be cache/channelMap only; add/block flows resolve identity in the background service worker.
8. The save path could skip `fetchChannelInfo()` when only a handle was present. That kept blocking reliable, but the first stored row could have an empty channel name/logo, with the management UI falling back to showing the handle until enrichment ran.
9. Main-world collaborator lookup did not retain `/youtubei/v1/search` snapshots, so after watch -> search SPA navigation it could miss collaborator rosters that were present in the search XHR but not in the old watch `ytInitialData`.

## Fix

- Prefer the stored `videoChannelMap` UC ID when merging stored and fetched watch identities.
- Do not merge alternate metadata from a fetched identity if its UC ID conflicts with the stored video mapping.
- Extract owner IDs, handles, and names from watch HTML owner/byline blocks before falling back to generic page-wide matches.
- Preserve `metadata.displayHandle` in the skip-fetch save path.
- Feed the faster shared identity extractor into channel-page fallback parsing when `ytInitialData` parsing fails.
- Expand channel-page fallback parsing for UC-first rows to read `vanityChannelUrl`, `canonicalBaseUrl`, `/@handle` URLs, and handle text candidates before returning a UC-only channel record.
- Allow existing UC-only rows to queue a forced post-block enrichment repair so earlier failed `Not fetched` rows are not stuck behind the six-hour enrichment throttle.
- Retry UC-first alternate identity through a public/no-credentials channel-page fetch before accepting a UC-only record, because the extension background can receive a cookie/session page variant that exposes name/logo but not the handle through the first parse path.
- Skip channel-list storage writes when post-block enrichment produces an identical record; otherwise options/app UIs redraw every channel row and avatars visibly refresh.
- Resolve DOM-fallback handle misses through the background `fetchChannelDetails` path instead of page-context `/@handle/about` fetches, avoiding CORS noise while still letting `channelMap` learn aliases.
- Require a valid channel name before using the skip-fetch save path. A known handle alone is no longer considered complete enough for first persistence.
- Store latest/recent `/youtubei/v1/search` JSON snapshots and include them in main-world channel and collaborator searches.

## Expected Behavior

For normal watch playlist rows, fallback 3-dot rows, and quick-cross rows:

- A known `videoId -> UC...` mapping still blocks immediately.
- If watch HTML exposes a handle/custom URL, the saved channel row receives the alternate ID.
- If a fetched identity disagrees with the known video mapping, the stored video mapping wins.
- Mix and collaboration rows stay on their separate discriminator paths and should not become false positive collaborator menus.
