# FilterTube YTD CamelCase Comment Sheet Boundary - 2026-07-03

## Question

After the recent YTD camelCase/lockup support, the Watch-page comments sheet
could fail to appear even when comments were not intentionally blocked. This
audit checked whether the new content-card selectors were touching comment
containers or engagement panels.

## Finding

The pasted desktop Watch DOM still exposes the normal comments path:

```text
ytd-watch-flexy[response-has-comments]
  ytd-comments#comments
    ytd-item-section-renderer[section-identifier="comment-item-section"]
      ytd-comments-header-renderer
      ytd-continuation-item-renderer[is-comments-section]
      yt-ghost-comments.ytGhostCommentsHost
```

The comments host itself did not move to a new camelCase content-card host in
the sampled DOM. The risk was instead a boundary problem: the 2026-07 YTD/YTM
refresh added generic content selectors such as `yt-lockup-view-model`,
`.ytLockupViewModelHost`, and `.ytLockupViewModelWrapper`. If YouTube places
any lockup/view-model node inside comments or a comment engagement panel, the
generic video-card fallback could attach work or evaluate card hiding inside
the comments surface.

That is a false-hide/performance risk because comments have their own dedicated
filtering path.

## Code Boundary Added

| File | Change |
| --- | --- |
| `js/content/dom_fallback.js` | Added `isFilterTubeCommentSurfaceElement()` and skipped generic `VIDEO_CARD_SELECTORS` processing under comments and comment engagement panels. |
| `js/content_bridge.js` | Added the same guard for prefetch observer attachment and whitelist pending-hide candidate queues. |
| `docs/youtube_renderer_inventory.md` | Documented the current desktop comment sheet path and the rule that camelCase content-card selectors are not comment-sheet selectors. |

## Preserved Behavior

- `hideAllComments` still hides comments through the existing comments path.
- Comment keyword/channel filtering still runs through the dedicated comment
  renderer logic.
- Video/channel/keyword filtering on Home, Search, Watch related rows,
  playlists, Shorts, and lockup cards remains handled by generic card fallback.
- The change does not remove or alter YTD/YTM camelCase card support; it only
  prevents that support from operating inside comment surfaces.

## Verification

```bash
node --check js/content/dom_fallback.js
node --check js/content_bridge.js
```

Both syntax checks passed after the change.

Chrome JavaScript-from-Apple-Events was disabled, so the live tab could not be
inspected through AppleScript in this run. The analysis used the current source
and the pasted Watch DOM snapshots.
