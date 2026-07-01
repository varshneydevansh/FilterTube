# FilterTube YouTube Desktop Lockup DOM Refresh - 2026-07-02

## Question

After YouTube's recent desktop UI refresh, channel block actions could add a
channel to FilterTube's blocklist, but matching Home and Watch-page content did
not reliably hide. The investigation checked whether this came from YouTube
blocking FilterTube DOM attributes, new DOM selector drift, stale settings, or
old runtime behavior exposed by the new markup.

## Finding

The regression was caused by a mixed selector and freshness gap, not by proof
that YouTube was stripping FilterTube's DOM attributes.

1. YouTube now uses `yt-lockup-view-model` and camelCase `ytLockup*` classes
   broadly across desktop Home cards, Watch related rows, and compact lockups.
2. Some current lockup rows expose the channel name only through text metadata
   or an avatar label like `Go to channel ...`; avatar image `alt` can be empty.
3. Existing FilterTube extraction still favored older dashed lockup classes,
   classic `ytd-channel-name`, and `#thumbnail` paths.
4. Some post-block flows refreshed settings without forcing the background to
   rebuild compiled runtime settings, so a just-added block could be stored but
   visible cards could still be evaluated against stale compiled state.
5. Sampled pages still contained `data-filtertube-*` attributes. Issue #59
   remains valid privacy and code-burden debt, but there is no current evidence
   that those attributes caused this hide failure.

## Old DOM vs Current DOM

| Surface / identity field | Older DOM expectation | Current DOM seen 2026-07-01/02 | Runtime implication |
| --- | --- | --- | --- |
| Home normal card host | `ytd-rich-grid-media` or older dashed lockup helper classes | `ytd-rich-item-renderer[lockup]` wrapping `yt-lockup-view-model.ytLockupViewModelWrapper` | Card discovery must include the host and the nested lockup wrapper. |
| Lockup title | `.yt-lockup-metadata-view-model__title` / heading reset variants | `a.ytLockupMetadataViewModelTitle` inside `.ytLockupMetadataViewModelTextContainer` | Title and video-id extraction must support camelCase classes. |
| Thumbnail/video id | `a#thumbnail[href*="watch?v="]` or dashed lockup content image | `a.ytLockupViewModelContentImage[href*="watch?v="]` | Video-id extraction cannot depend on `#thumbnail` being present. |
| Byline channel link | Channel anchor inside `ytd-channel-name` or dashed metadata rows | First `.ytContentMetadataViewModelMetadataRow` may have a channel anchor, but can be plain text only | Channel blocking needs text fallback and enrichment. |
| Channel display name | Anchor text or avatar image `alt` | `.ytSpecAvatarShapeHost[aria-label="Go to channel ..."]` while avatar image `alt` is often empty | DOM fallback and menu extraction need the avatar label as a narrow fallback. |
| Native menu host | `ytd-menu-renderer` or dashed lockup menu button | `.ytLockupMetadataViewModelMenuButton` with optional `.ytLockupMetadataViewModelBottomRight` placement | Fallback menu anchoring needs the camelCase menu host. |
| Collaboration signal | `#attributed-channel-name`, dialog roster, or multiple channel links | `yt-avatar-stack-view-model[aria-label="Collaboration channels"]` plus text like `Name ... and Name` | Collaboration remains enrichment-dependent; bare `and` text is not authority by itself. |

## Code Changes

| File | Change | Reason |
| --- | --- | --- |
| `js/content_bridge.js` | Added current lockup title, menu, metadata, byline, and avatar-label selector support. | Quick-block/menu extraction must understand current desktop lockup cards. |
| `js/content_bridge.js` | Forced settings refresh after channel block, playlist block, Shorts enrichment, and playlist-row enrichment paths. | A just-added rule must be visible to the next DOM pass without waiting for another user interaction. |
| `js/content/dom_fallback.js` | Mirrored current lockup selectors and added avatar `Go to channel ...` display-name fallback. | Actual hide decisions must work on Home/Watch rows that no longer expose classic channel links. |
| `js/content/dom_extractors.js` | Added camelCase lockup title and content-image selectors for title and video-id extraction. | New `ytLockup*` rows can omit the older `#thumbnail` and dashed title classes. |
| `js/background.js` | Clears `compiledSettingsCache.main` and `compiledSettingsCache.kids` after the persistent add storage write. | Prevents stored blocklist changes from compiling against stale cached settings. |
| `docs/youtube_renderer_inventory.md` | Added old-vs-current DOM history and current surface inventory for lockups, Home Shorts shelf, and playlist rows. | Keeps the renderer inventory useful for future YouTube UI refreshes. |

## Behavior Preserved

- Blocklist keyword and channel hiding remain the intended behavior.
- Whitelist/list-mode behavior was not deliberately changed.
- Collaboration detection still requires explicit collaboration surfaces or
  enrichment. A plain channel name containing `and` is not treated as a
  collaborator list by itself.
- Existing `data-filtertube-*` markers remain implementation state, not public
  API. Moving more state into scoped maps should remain a future hardening task.
- No broad runtime/test suite was run because the user asked to preserve compute
  and focus on the urgent YouTube hide regression.

## Verification

- User manually refreshed the installed extension and reported the hiding path
  was working again.
- `node --check js/content_bridge.js` passed.
- `node --check js/content/dom_fallback.js` passed.
- `node --check js/content/dom_extractors.js` passed.
- `node --check js/background.js` passed.
- `git diff --check` passed.
