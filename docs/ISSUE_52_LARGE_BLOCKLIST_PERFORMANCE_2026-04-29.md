# Issue #52: Large Blocklist Performance - 2026-04-29

## Problem

Firefox and Waterfox users reported that YouTube could slow to a crawl once the blocked-channel list reached roughly 200+ rows.

The visible symptom is page-level sluggishness on YouTube, not only dashboard sluggishness. The likely hot path is the filtering runtime doing repeated channel comparisons while YouTube streams large JSON payloads and continuously recycles DOM cards.

## Root Cause

The DOM fallback already had a compiled channel index, but the Main World JSON filter still checked channels with nested loops:

```text
renderer collaborators x every blocked channel
comment author x every blocked channel
whitelist candidates x every allowed channel
```

That is correct for small lists, but it scales poorly when YouTube delivers hundreds or thousands of renderers and the user has hundreds of blocked channels.

The DOM fallback also had a safety-net path that tries to resolve unresolved `@handle` filters when the page only exposes a UC ID. That path is intentionally best-effort, but without a per-handle retry window it can keep attempting the same unresolved handles while an idle page keeps mutating.

## Fix

- Added shared channel-filter indexes in `js/shared/identity.js`:
  - `buildChannelFilterIndex(filterChannels, channelMap)`
  - `channelMetaMatchesIndex(channelInfo, index, channelMap)`
- Updated `js/filter_logic.js` so JSON/XHR filtering uses the indexed matcher for:
  - blocklist channel checks
  - collaborator channel checks
  - comment-author checks
  - whitelist channel allow checks
  - creator-page whitelist allow checks
- Kept the older `_matchesChannel()` path as a fallback if the shared helper is unavailable.
- Added a 10-minute per-handle retry window to the DOM fallback active resolver so large handle-heavy lists do not repeatedly ask the background resolver for the same unresolved handle.

## Expected Behavior

- Large blocked-channel lists should no longer multiply filtering cost by the number of saved channels for every renderer.
- YouTube JSON filtering should scale closer to renderer count, with channel checks handled by set lookups.
- Existing UC ID, `@handle`, custom URL, strict name fallback, and `channelMap` alias matching remain supported.
- The DOM fallback still learns missing aliases, but avoids repeated background resolver churn for unresolved handles.

## Verification

- Syntax checks for changed JavaScript files.
- Chrome extension build.
- Runtime parity sync into the mobile app mirror.
- Android runtime parity and Gradle build checks.
