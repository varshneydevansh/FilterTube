# FilterTube Content Helper Callable Audit - 2026-05-18

Status: audit-only callable expansion. This file does not change product
behavior. It expands the proof boundary around the smaller content-script
helper layer that runs before or beside `js/content_bridge.js`.

These helpers look small compared with `content_bridge.js` and
`dom_fallback.js`, but they own script injection, global hide styles, DOM
identity extraction, collaborator dialog observation, prompt overlays, menu
styles, handle resolution, learned channel-map repair, and shared channel
identity matching. Any one of those can still affect filtering correctness or
page performance.

Runnable proof:

```text
npm run audit:runtime
current-behavior tests pass when run with the full suite
```

## Scope

| File | Lexical callable count | Primary exported surface | Audit role |
| --- | ---: | --- | --- |
| `js/content/bridge_injection.js` | 3 | `globalThis.injectMainWorldScripts` | Isolated-world bootstrap and MAIN-world script injection ordering. |
| `js/content/collab_dialog.js` | 17 | `window.collabDialogModule` | Pending-card-gated collaboration dialog trigger/listener/observer and collaborator metadata broadcast. |
| `js/content/dom_extractors.js` | 23 | Global helper functions | Card selectors, video ID extraction, channel metadata extraction, cached DOM stamps. |
| `js/content/dom_helpers.js` | 3 | Global helper functions | Shared hide/unhide CSS and container visibility rules. |
| `js/content/first_run_prompt.js` | 4 | Self-running content prompt | First-install refresh prompt and first-run completion message. |
| `js/content/handle_resolver.js` | 7 | Global helper functions | Handle-to-UC resolver, learned channel-map persistence, background/direct fetch fallback, and DOM fallback rerun scheduling. |
| `js/content/menu.js` | 2 | Global helper functions | FilterTube menu HTML escaping and menu CSS injection. |
| `js/content/release_notes_prompt.js` | 6 | Self-running content prompt | One-time release notes prompt and What’s New opening flow. |
| `js/shared/identity.js` | 27 | `FilterTubeIdentity` | Shared channel input canonicalization, filter index, identity matching, and fast HTML identity extraction. |

Total first-pass content-helper lexical callables: 92.

## Public And Global Surfaces

| Surface | File | Entry points | Risk |
| --- | --- | --- | --- |
| `injectMainWorldScripts` | `js/content/bridge_injection.js:75` | Injects `shared/identity`, `filter_logic`, optional `seed`, and `injector`, then requests settings after a timer. | A failed or late injection changes whether JSON-first filtering, seed interception, and page-world lookups are available. |
| `window.collabDialogModule` | `js/content/collab_dialog.js:387` | `refreshCollabDialogRuntime`, `ensureCollabDialogObserver`, `ensureCollabTriggerListeners`, `scheduleCollaboratorRefresh`, `applyCollaboratorsToCard` | Dialog-derived collaborator identity can change menu labels, block-all behavior, and fallback filtering while listeners/observer stay gated on pending cards. |
| DOM extractor globals | `js/content/dom_extractors.js:10` | `VIDEO_CARD_SELECTORS`, `ensureVideoIdForCard`, `extractChannelMetadataFromElement`, `extractVideoIdFromCard` | Broad selectors and cached DOM stamps feed hide decisions and menu targets. |
| DOM hide helpers | `js/content/dom_helpers.js:11` | `ensureStyles`, `toggleVisibility`, `updateContainerVisibility` | Shared `.filtertube-hidden` and `.filtertube-hidden-shelf` classes decide page visibility and stats. |
| Handle resolver helpers | `js/content/handle_resolver.js:25`, `js/content/handle_resolver.js:149` | `persistChannelMappings`, `extractRawHandle`, `normalizeHandleValue`, `extractHandleFromString`, `fetchIdForHandle` | Handle repair can write learned maps, fetch background or direct handle pages, post same-window map updates, and force DOM fallback reruns. |
| Prompt scripts | `js/content/first_run_prompt.js:177`, `js/content/release_notes_prompt.js:237` | Runtime `sendMessage` checks and high-z-index fixed banners | Prompt UI can overlap YouTube controls and each other. |
| Menu style helper | `js/content/menu.js:25` | `ensureFilterTubeMenuStyles` | Injects global CSS affecting native YouTube menu containers, not only FilterTube entries. |
| `FilterTubeIdentity` | `js/shared/identity.js:782` | `canonicalizeChannelInput`, `buildChannelFilterIndex`, `channelMetaMatchesIndex`, `channelMatchesFilter`, `isChannelBlocked`, `fastExtractIdentityFromHtmlChunk` | This is the shared identity authority for UI, background, content scripts, and page scripts. |

## Findings

| Area | Current behavior | Proof | Risk | Next proof/fix gate |
| --- | --- | --- | --- | --- |
| Same-window bridge messages | `content_bridge.js` accepts same-window `FilterTube_*` `postMessage` events unless `source === "content_bridge"`. | `js/content_bridge.js:5468`, `5479`, `5482`, `5531`, `5673`; collaborator helper broadcasts at `js/content/collab_dialog.js:224` | Any YouTube page script can spoof channel/video/collab map updates, poison identity, and force DOM reprocessing. | Nonce/request-id/source allowlist for page-world messages, plus spoof rejection fixtures. |
| MAIN-world injection authority | `bridge_injection.js` injects core page-world scripts and then requests settings after a fixed `100ms` timer. | `js/content/bridge_injection.js:85`, `96` | Injection failure or delayed settings can leave seed/engine connected late while DOM fallback still runs. | Injection status fixture with explicit ready/error state and no duplicate injection. |
| Collaborator dialog late init | `collab_dialog.js` calls `refreshCollabDialogRuntime()` from `DOMContentLoaded`, and that refresh can install or remove listener/observer work according to pending-card state. | `js/content/collab_dialog.js:370`, `382`, `387` | Late injection is now represented by the refresh surface, but collaborator discovery still depends on pending-card admission from the content bridge. | Idempotent pending-card lifecycle fixtures across early injection, late injection, and SPA route reuse. |
| Collaborator observer lifetime | Dialog observer and trigger listeners are no longer unconditional permanent work; they are installed when `window.pendingCollabCards` has entries and removed/disconnected when that queue drains. | `js/content/collab_dialog.js:84`, `326`, `370` | Better no-work behavior, but it still needs a shared lifecycle owner and route/settings budget proof. | Lifecycle registry with active route/settings gates, pending-card reason, and teardown proof. |
| Cached channel identity trust | `extractChannelMetadataFromElement()` trusts cached channel identity when no fresh href identity exists and writes identity back to DOM nodes. | `js/content/dom_extractors.js:648`, `663`, `899` | Recycled nodes without fresh href/video ID can keep stale channel stamps and drive false hides or wrong menu labels. | Freshness contract: cached channel identity must be tied to video ID, route, or timestamp confidence. |
| Broad card selector authority | `VIDEO_CARD_SELECTORS` spans desktop, mobile, Music, Kids, channel, playlist, radio, and watch-card hosts. | `js/content/dom_extractors.js:10` | Any helper or fallback using this selector can scan or classify across surfaces that should be route-scoped. | Route-scoped selector families and fixture proof for Main, YTM, Kids, watch, search, playlist. |
| `innerText` fallback cost | Channel metadata fallback scans `innerText` from cache target, element, and related elements. | `js/content/dom_extractors.js:882` | `innerText` can force layout and can pull unrelated text from large recycled cards. | Prefer structured attributes/JSON first; gate `innerText` to low-confidence fallback with scan budget. |
| Global hide CSS | `dom_helpers.js` injects `.filtertube-hidden { display: none !important; }` and pending shimmer styles globally. | `js/content/dom_helpers.js:15` | One global class namespace owns all visibility restoration; stale classes or third-party collisions are high-impact. | Namespaced state cleanup fixture for recycled nodes and container restores. |
| Hide helper side effects | `toggleVisibility()` records stats, manipulates inline display, and calls media playback handling. | `js/content/dom_helpers.js:67`, `91`, `98`, `104`, `107`, `147` | A wrong hide decision is not only visual; it can change stats and player/media state. | Structured hide reason fixture: decision source, stats delta, media action, and restore. |
| Container all-hidden rule | `updateContainerVisibility()` hides shelves when all tracked children are hidden and can hide empty containers after previous children existed. | `js/content/dom_helpers.js:160`, `171`, `197` | If child selector is too broad or stale hidden classes remain, whole shelves can disappear. | Container fixture for mixed visible/hidden/recycled children. |
| Handle resolver repair path | `fetchIdForHandle()` reads `channelMap`, uses a `PENDING` cache sentinel, delegates `backgroundOnly` calls to `fetchChannelDetails`, can fetch same-origin handle pages, posts `FilterTube_UpdateChannelMap` with wildcard target, and schedules forced DOM fallback reruns. | `js/content/handle_resolver.js:133`, `149`, `167`, `192`, `203`, `218`, `239`, `263`, `273` | A handle repair can become a learned-map write, background fetch, page-message trust hop, and DOM rerun without one resolver authority or no-rule budget. | Resolver fixture with cache state, sender class, network budget, map-write provenance, page-message trust, and rerun effect. |
| Menu CSS scope | `menu.js` injects CSS for global YouTube menu selectors such as `ytd-menu-popup-renderer` and `tp-yt-paper-listbox`. | `js/content/menu.js:31`, `36`, `304` | Native YouTube menus can inherit FilterTube max-height/overflow behavior after one menu render. | Scope CSS to FilterTube marker classes or only active injected menu containers. |
| Prompt overlap | First-run and release-notes prompts both render top-right fixed banners with adjacent max z-index values. | `js/content/first_run_prompt.js:47`; `js/content/release_notes_prompt.js:98`; manifest load order `manifest.json:52` | First install plus unseen release notes can stack or hide one prompt behind another. | Single prompt coordinator or queue fixture. |
| Shared identity name fallback | `FilterTubeIdentity` still allows name-only and stable-name matching when stronger identity is absent. | `js/shared/identity.js:390`, `391`, `392` | Name-only matches are useful for legacy entries but can false-match generic/renamed channels. | Confidence tier fixture for UC ID, handle, custom URL, stable name, and name-only fallback. |
| Fast HTML identity regex | `fastExtractIdentityFromHtmlChunk()` uses regex windows over HTML/JSON fragments. | `js/shared/identity.js:670`, `675`, `692`, `712` | Useful as a fallback, but must not become a high-confidence authority when JSON parser paths are available. | Fixture that compares regex fallback confidence against JSON path extraction. |

## Helper-Layer Flow

```text
manifest content script order
  -> shared/identity.js exposes FilterTubeIdentity
  -> menu/dom_helpers/dom_extractors expose global helper functions
  -> handle_resolver.js exposes handle repair and learned map helpers
  -> content_bridge.js loads main runtime logic
  -> bridge_injection.js injects MAIN-world identity/filter_logic/injector/seed
  -> collab_dialog.js observes YouTube dialogs and postMessages collab payloads
  -> content_bridge.js accepts FilterTube_* postMessages and may refresh DOM fallback
  -> dom_helpers.toggleVisibility hides/restores elements and updates stats/media state
```

The weak boundary is the page-message hop: page-world data becomes isolated-world
state, then can become background storage and DOM hide decisions. That hop needs
the same proof level as JSON endpoint mutation.

## Required Follow-Up Fixtures

```text
content_bridge_rejects_spoofed_filtertube_window_messages
bridge_injection_ready_error_no_duplicate_state
collab_dialog_late_injection_still_initializes
collab_dialog_listener_observer_teardown_or_gate
dom_extractor_cached_identity_requires_fresh_confidence
dom_extractor_route_scoped_selector_families
dom_extractor_innerText_budget_and_fallback_confidence
handle_resolver_cache_network_map_write_rerun_contract
toggle_visibility_structured_side_effect_report
container_visibility_recycled_children_restore
menu_css_scoped_to_filtertube_menu_only
prompt_queue_first_run_release_notes
identity_confidence_tier_matching_contract
fast_html_identity_fallback_confidence_contract
```

## Capture Corpus Tie-In

The ignored parent-directory captures listed in `.gitignore` remain the raw
evidence pool for this helper layer too. For this slice, the most useful
families are:

- `collab.html`, `collab.json`, `collab_on_homepage.html`, and
  `collab_in_playlist_mix.html` for dialog/collaborator identity confidence.
- `playlist.html` and `YT_MAIN_WATCH.html` for recycled watch/playlist DOM
  stamps and selected-row behavior.
- `YTM-DOM.html`, `YTM-XHR.json`, and `YTM-WATCH PLAYER.html` for cross-surface
  selector scoping.
- `YT_KIDS.json` and `ytkids_browse?alt=json.json` for Kids DOM-only card
  extractor limits.

The extraction rule stays the same: keep raw captures ignored, extract minimal
fixtures into `tests/runtime/fixtures/...`, and cite the source family in the
fixture result doc.

## Audit Boundary

This pass accounts for the content-helper callable layer and pins its highest
risk side effects. It still does not prove every user-visible workflow. The
complete audit needs action-level fixtures around every message, prompt,
observer, selector family, cache stamp, and hide/restore side effect before
behavioral fixes are made.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content helper callable surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content helper cleanup, selector/cache
changes, prompt behavior changes, or hide/restore authority changes.
