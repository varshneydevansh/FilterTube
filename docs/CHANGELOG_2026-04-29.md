# FilterTube Change Log - 2026-04-29

## Scope

This checkpoint documents the runtime, UI, and documentation work completed on 2026-04-29 after the April 28 Mix/collaboration backports exposed watch-page and player-playlist identity edge cases.

## Runtime Fixes

- Watch/player playlist blocks now keep stored `videoId -> UC...` mappings authoritative when later watch identity fetches are weak or conflicting.
- UC-first channel enrichment now makes a public/no-credentials channel-page retry before accepting a row with no `@handle` or custom URL.
- Handle-first block rows no longer skip `fetchChannelInfo()` just because a handle is known. A real channel name is required before the first-save skip path is used, avoiding blank-name rows that display `@handle` as the visible fallback.
- Auto-backup waits briefly for post-block enrichment on channel-added writes, reducing backup snapshots that capture incomplete first-save rows.
- DOM fallback handle resolution now uses background-only `fetchChannelDetails` instead of page-context `/@handle/about` fetches, avoiding CORS noise while still learning UC aliases.
- Search-page SPA collaborator recovery now keeps latest/recent `/youtubei/v1/search` response snapshots and includes them in main-world channel and collaborator lookup roots.
- Comment 3-dot menus no longer display the current playing video's channel identity when the click target is a comment author; the block still targets the comment channel.
- Post-block enrichment skips identical channel-list writes, and Channel Management avoids full row/avatar rebuilds for simple `Filter All` and comments-toggle updates.
- Quick-block controls now track sticky top bars and viewport bounds so mobile/search crosses hide before a card slides under YouTube's header instead of overlaying top UI while scrolling.
- Search quick-block hover state is retained across YouTube hover/preview overlays by using longer sticky timing, wrapper-level pointer handling, and a bounds fallback when `elementsFromPoint()` lands on an overlay instead of the card.
- Mobile search no longer treats a merely focused search input as an open search overlay; quick-block controls are suppressed only when suggestions/dropdowns are actually visible or explicitly expanded.
- Expected duplicate MAIN-world script loads now log only in debug mode. First-install reloads can legitimately hit the idempotency guards for `seed.js`, `filter_logic.js`, or `injector.js`, but they no longer surface as Chrome extension warnings.
- Firefox/Waterfox manual export now bypasses extension-driven subfolder downloads for both plain and encrypted JSON, keeps blob URLs alive longer, and supports Promise-style download APIs in backup helpers. See [ISSUE_51_FIREFOX_EXPORT_2026-04-29.md](/Users/devanshvarshney/FilterTube/docs/ISSUE_51_FIREFOX_EXPORT_2026-04-29.md).
- Fresh installs now follow the browser/OS light or dark theme until the user manually toggles a preference. See [ISSUE_42_SYSTEM_THEME_2026-04-29.md](/Users/devanshvarshney/FilterTube/docs/ISSUE_42_SYSTEM_THEME_2026-04-29.md).
- Dashboard sidebar navigation now remains reachable on short desktop windows by scrolling the nav list instead of clipping it. See [ISSUE_54_DASHBOARD_SIDEBAR_HEIGHT_2026-04-29.md](/Users/devanshvarshney/FilterTube/docs/ISSUE_54_DASHBOARD_SIDEBAR_HEIGHT_2026-04-29.md).

## Mix And Collaboration Safety

- Mix cards remain excluded from collaborator extraction through the `thumbnailOverlayBottomPanelRenderer.icon.iconType === "MIX"` discriminator.
- Authoritative `Collaborators` sheet rosters remain preferred over inferred/composite names.
- Composite weak names such as combined artist/title strings are pruned so they cannot inflate collaborator counts.
- Collaborator menus continue to render pending rows only when the expected roster is incomplete, then replace them when a validated roster arrives.

## UI/UX Changes

- Collaborator selected/blocked row tint was softened so text remains readable.
- Channel Management row interactions no longer trigger broad avatar refresh behavior.
- Handle-first rows are acceptable as input/original identity, but channel display names must come from fetched or renderer metadata rather than the handle fallback.
- Quick-block z-index was reduced from page-global overlay levels and paired with viewport clipping, preventing the cross button from punching through sticky chrome while preserving card-level access.

## App Backport

The extension runtime changes were synced into `FilterTubeApp` through `tools/sync-runtime-from-extension.mjs`, updating:

- Android bundled runtime asset
- extension source mirror
- runtime bridge/adapters/core upstream copies
- extension UI upstream tab-view copy
- app parity docs

## Verification

- `node --check` on changed extension and mirrored runtime JavaScript
- `npm run build:chrome`
- `git diff --check`
- `node tools/validate-filters-parity.mjs`
- Android `./gradlew :app:compileDebugKotlin :app:assembleDebug --console=plain`
