# FilterTube Content Control JSON-First Boundary Index Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, catalog patch, settings patch, JSON-first behavior patch,
DOM fallback patch, affordance patch, or cache invalidation patch.

This slice pins the current boundary between the user-facing content controls
catalog and the scattered JSON-first/current-behavior proof artifacts. It proves
that every catalog control has a current boundary artifact, while preserving the
non-completion fact that no single runtime manifest owns catalog key aliases,
JSON/DOM parity, no-work budgets, settings invalidation, or first-class JSON
promotion decisions.

## Boundary Source Files

content control JSON-first boundary source files: 4

catalog group count: 7

catalog control count: 29

catalog controls with JSON-first-named proof docs: 27

unique proof docs: 27

unique proof tests: 27

runtime alias controls: 2

direct runtime key controls: 27

default-on affordance controls: 2

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_controls_catalog.js` | 222 | 7822 | `780b35c8aa33161ccd6e489b0843f01d805620409715a50aaca0a0bf6cff7e10` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |

catalog group ids: core, feed, watch, video_info, player, navigation, search

catalog group sizes: core=3, feed=6, watch=4, video_info=6, player=4, navigation=5, search=1

catalog control keys: hideShorts, hideHomeFeed, hideComments, hideSponsoredCards, hidePlaylistCards, hideMembersOnly, hideMixPlaylists, showQuickBlockButton, showBlockMenuItem, hideVideoSidebar, hideRecommended, hideLiveChat, hideWatchPlaylistPanel, hideVideoInfo, hideVideoButtonsBar, hideAskButton, hideVideoChannelRow, hideVideoDescription, hideMerchTicketsOffers, hideEndscreenVideowall, hideEndscreenCards, disableAutoplay, disableAnnotations, hideTopHeader, hideNotificationBell, hideExploreTrending, hideMoreFromYouTube, hideSubscriptions, hideSearchShelves

## Catalog Boundary Map

| Catalog group | Catalog key | Runtime setting key | Current proof artifact |
| --- | --- | --- | --- |
| core | `hideShorts` | `hideAllShorts` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ALL_SHORTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| core | `hideHomeFeed` | `hideHomeFeed` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_HOME_FEED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| core | `hideComments` | `hideAllComments` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ALL_COMMENTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| feed | `hideSponsoredCards` | `hideSponsoredCards` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_SPONSORED_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| feed | `hidePlaylistCards` | `hidePlaylistCards` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_PLAYLIST_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| feed | `hideMembersOnly` | `hideMembersOnly` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MEMBERS_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| feed | `hideMixPlaylists` | `hideMixPlaylists` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MIX_PLAYLISTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| feed | `showQuickBlockButton` | `showQuickBlockButton` | `docs/audit/FILTERTUBE_QUICK_BLOCK_BLOCK_MENU_AFFORDANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| feed | `showBlockMenuItem` | `showBlockMenuItem` | `docs/audit/FILTERTUBE_QUICK_BLOCK_BLOCK_MENU_AFFORDANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| watch | `hideVideoSidebar` | `hideVideoSidebar` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_SIDEBAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| watch | `hideRecommended` | `hideRecommended` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_RECOMMENDED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| watch | `hideLiveChat` | `hideLiveChat` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_LIVE_CHAT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| watch | `hideWatchPlaylistPanel` | `hideWatchPlaylistPanel` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_WATCH_PLAYLIST_PANEL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| video_info | `hideVideoInfo` | `hideVideoInfo` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_INFO_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| video_info | `hideVideoButtonsBar` | `hideVideoButtonsBar` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_BUTTONS_BAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| video_info | `hideAskButton` | `hideAskButton` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ASK_BUTTON_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| video_info | `hideVideoChannelRow` | `hideVideoChannelRow` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_CHANNEL_ROW_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| video_info | `hideVideoDescription` | `hideVideoDescription` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_DESCRIPTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| video_info | `hideMerchTicketsOffers` | `hideMerchTicketsOffers` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MERCH_TICKETS_OFFERS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| player | `hideEndscreenVideowall` | `hideEndscreenVideowall` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_VIDEOWALL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| player | `hideEndscreenCards` | `hideEndscreenCards` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| player | `disableAutoplay` | `disableAutoplay` | `docs/audit/FILTERTUBE_JSON_FIRST_DISABLE_AUTOPLAY_ANNOTATIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| player | `disableAnnotations` | `disableAnnotations` | `docs/audit/FILTERTUBE_JSON_FIRST_DISABLE_AUTOPLAY_ANNOTATIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| navigation | `hideTopHeader` | `hideTopHeader` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_TOP_HEADER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| navigation | `hideNotificationBell` | `hideNotificationBell` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_NOTIFICATION_BELL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| navigation | `hideExploreTrending` | `hideExploreTrending` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_EXPLORE_TRENDING_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| navigation | `hideMoreFromYouTube` | `hideMoreFromYouTube` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MORE_FROM_YOUTUBE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| navigation | `hideSubscriptions` | `hideSubscriptions` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_SUBSCRIPTIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |
| search | `hideSearchShelves` | `hideSearchShelves` | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_SEARCH_SHELVES_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` |

## Current Alias and Proof Boundary

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| Catalog shape | `js/content_controls_catalog.js` exposes 29 controls in 7 groups. | One catalog-owned control manifest that records runtime key, settings key, JSON owner, DOM owner, mode scope, route scope, and proof artifacts. |
| Runtime aliases | The catalog exposes `hideShorts` and `hideComments`, while shared settings storage uses `hideAllShorts` and `hideAllComments`. | A runtime alias policy for storage migration, UI state, compiled settings, background invalidation, and JSON-first decision rows. |
| Shared settings keys | `SETTINGS_KEYS` includes `hideAllShorts` and `hideAllComments`, and does not include catalog keys `hideShorts` or `hideComments`. | A settings schema report tying catalog keys to storage keys and compiled settings for every profile/list mode. |
| StateManager UI keys | `StateManager.updateSetting()` accepts catalog keys `hideShorts` and `hideComments`, and does not accept `hideAllShorts` or `hideAllComments` in its valid-key list. | A UI-to-storage mutation report proving the exact save path and external reload parity for alias keys. |
| StateManager external reload | The external reload list watches storage keys `hideAllShorts` and `hideAllComments`, not the catalog alias keys. | A refresh parity report showing which owner reacts to catalog-key writes versus storage-key writes. |
| Background invalidation | The background storage-change list includes `hideAllShorts` and `hideComments`, but not `hideAllComments` or `hideShorts`. | A background cache invalidation parity report for all catalog/runtime alias pairs before changing JSON-first active-work decisions. |
| Proof artifact spread | 29 catalog controls map to 27 unique proof docs and 27 unique runtime guard tests; `showQuickBlockButton`/`showBlockMenuItem` share an affordance proof, and `disableAutoplay`/`disableAnnotations` share a player-control proof. | A single proof manifest with positive/negative fixtures, route/surface/mode matrices, JSON/DOM parity, no-work budgets, and metric artifacts. |
| JSON-first promotion | 27 catalog controls have JSON-first-named proof docs, but the action affordance controls are not JSON row filters and still need separate lifecycle/action budgets. | A first-class JSON gate that rejects control promotion until aliases, route effects, DOM/native parity, fixture provenance, and no-work budgets are complete. |

## Runtime Proof

The runtime guard proves:

1. The catalog still has exactly 7 groups and 29 controls.
2. Every catalog control has a current boundary doc/test artifact.
3. The catalog-to-runtime alias set is exactly `hideShorts -> hideAllShorts`
   and `hideComments -> hideAllComments`.
4. `showQuickBlockButton` and `showBlockMenuItem` are action affordances, not
   JSON row-filter controls.
5. Shared settings, StateManager, and background invalidation currently split
   alias handling for Shorts/comments controls.
6. The current proof set is scattered across 27 proof docs/tests and is not a
   first-class runtime manifest.

## Non-Completion Boundary

Content control JSON-first promotion still needs a catalog/runtime key
contract, alias policy, route and surface matrix, settings-mode matrix,
JSON/DOM parity matrix, settings invalidation parity report, per-control
no-work budgets, fixture provenance, metric artifacts, native parity, and
rollback/restore proof.

No `contentControlJsonFirstBoundaryIndex`,
`contentControlRuntimeSettingContract`, `contentControlBoundaryProofManifest`,
`contentControlAliasPolicy`, `contentControlJsonDomParityMatrix`,
`contentControlNoWorkBudgetMatrix`,
`contentControlSettingsInvalidationParityReport`,
`contentControlFixtureProvenance`, or `contentControlFirstClassJsonGate`
exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content-control JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content-control promotion, DOM selector
changes, no-work changes, native parity changes, or whitelist behavior changes.
