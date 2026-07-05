# FilterTube Shorts Channel Identity Prefetch - 2026-07-05

## Trigger

Blocked-channel Shorts could remain visible until the user hovered a card or opened
the quick-block/menu path. After that interaction, the same Shorts began hiding,
which showed the block rule was correct but channel identity arrived too late.

## Root Cause

The existing runtime already had the needed pieces:

- JSON filtering can block Shorts when YouTube includes channel identity.
- `videoChannelMap` can hide `shortVideoId -> channelId` matches.
- the background script can fetch `/shorts/<videoId>` and resolve the owner.
- DOM fallback can hide Shorts after the map exists.

The gap was scheduling. The background Shorts identity resolver was mainly used
after an explicit block action, while visible Shorts with only a `videoId` could
wait for hover/menu work before identity was learned.

## Implemented Behavior

`js/content_bridge.js`

- Adds explicit prefetch observer hosts for Shorts:
  - `ytd-reel-item-renderer`
  - `ytm-shorts-lockup-view-model`
  - `ytm-shorts-lockup-view-model-v2`
  - `.shortsLockupViewModelHost`
  - `.ytGridShelfViewModelGridShelfItem`
  - `[data-filtertube-short="true"]`
  - `a[href*="/shorts/"]`
- Keeps the prefetch path gated behind active identity work:
  - blocklist channel rules, or
  - whitelist mode.
- If DOM and `ytInitialData` do not expose a channel for a visible Shorts card,
  it uses the existing background `fetchShortsIdentity` path.
- If a `UC...` channel ID is learned, it persists `videoChannelMap` and forces a
  scroll-preserving DOM fallback reprocess.

`js/content/dom_fallback.js`

- Adds `.shortsLockupViewModelHost` and `.ytGridShelfViewModelGridShelfItem` to
  the dedicated Shorts fallback selector set so learned mappings are applied to
  the newer desktop Shorts host shape.

## Safety Contract

- Empty/no-channel-rule sessions do not start Shorts identity work.
- Blocklist mode does not hide unknown Shorts before identity is resolved.
- Whitelist mode remains stricter through the existing whitelist pending path.
- YouTube Kids stays network-free in this prefetch path.
- The resolver uses the existing bounded queue/concurrency and background fetch
  path instead of broad page-wide fetching.

## Validation

Static validation completed:

```bash
node --check js/content_bridge.js
node --check js/content/dom_fallback.js
```

Manual installed-extension validation is still needed on:

- desktop YouTube Home Shorts
- desktop YouTube Search Shorts
- desktop YouTube Watch right-rail Shorts
- Firefox with a known blocked channel such as the reported Welch Labs case

