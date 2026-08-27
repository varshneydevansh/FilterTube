# Large Rule-List Runtime Optimization

Date: 2026-08-27

## Scope

This slice reduces repeated work caused by large channel and video-ID lists on YouTube and YouTube Kids. It does not change blocklist, allowlist, profile, Main/Kids, collaboration, category, keyword, or imported-rule semantics.

## Implemented behavior

- The JSON filter engine is reused while the exact settings snapshot and `channelMap` object remain unchanged.
- Replacing the settings snapshot or replacing `channelMap` constructs a fresh engine.
- Learned UC ID to handle mappings and custom-URL to UC ID mappings mark both channel indexes dirty. The indexes are rebuilt after harvesting and before filtering the payload.
- Blocked and allowed video IDs use compiled `Set` membership while preserving case-sensitive exact-ID behavior and allow-on-equal-specificity precedence.
- Per-card hidden-time counters still update immediately, but storage persistence is coalesced into one queued write for a synchronous hide/restore burst.
- A second stats write is scheduled if counters change while the first storage operation is in flight.
- The per-card saved-time console message and its channel-name DOM query now run only when `window.__filtertubeDebug` is enabled.
- Home-feed mutation bursts collect and deduplicate affected visual card owners. Ordinary card hydration/insertion uses an incremental card pass instead of immediately rescanning every card, shelf, Short, comment, chip, and guide entry.
- Structural Home mutations involving chip rails, sections, shelves, comments, guide entries, surveys, or grid shelves retain the full fallback pass.

## Channel identity contract

Channel matching continues to use the shared identity index and `channelMap`. The reusable engine retains and refreshes mappings for:

- UC channel ID to handle;
- handle to UC channel ID;
- custom channel URL to UC channel ID;
- block and allow channel indexes;
- imported channel objects and name-only compatibility rules already supported by the shared identity layer.

The per-payload `pageChannelMeta` and blocked counter are reset before harvesting so creator-page identity cannot leak into a later browse, search, Watch, or Kids response.

## Measured fixture

The post-change source-level benchmark used the supplied BlockTube backup with 17,165 channel IDs and 3,631 video IDs against a synthetic 100-card response:

| Path | Median | Minimum |
| --- | ---: | ---: |
| Reused engine and indexes | 3.75 ms | 3.38 ms |
| Replacement settings forcing rebuild | 17.87 ms | 15.53 ms |

This benchmark isolates JSON filtering work. Home mutation targeting is protected by source-level ownership tests and still needs live YouTube interaction proof after reloading the unpacked extension.

## Deliberately deferred

- Lightweight candidate extraction for channel-only policies.
- Dashboard projection and metadata-row index caching.
- Recursive JSON structural sharing or in-place mutation.

Those changes touch broader filtering or rendering boundaries and require separate measurement and parity gates.
