# FilterTube DOM Selector Instance Register - 2026-05-18

Status: source-derived audit register. This is not an implementation patch.

Completion is not proven. This register moves the audit closer to the
objective phrase `every DOM selector` by pinning every current selector API
site in tracked non-vendor JavaScript, separating static selector literals from
dynamic selector expressions, and naming the proof gates required before DOM
selector behavior changes.

## Register Boundary

The register scans tracked non-vendor JavaScript returned by:

```bash
git ls-files '*.js' '*.jsx' '*.mjs'
```

and excludes `js/vendor/**`, ignored root HTML/JSON/TXT captures, `dist/`,
dependency caches, and generated local website output.

This is a source register, not a runtime guarantee. It proves where selectors
exist today. It does not prove they are route-scoped, no-rule safe, false-hide
safe, or complete for every YouTube renderer.

## Covered Selector APIs

| Selector API | Current call sites | Static literal args | Dynamic/non-literal args |
| --- | ---: | ---: | ---: |
| `querySelectorAll()` | 145 | 106 | 39 |
| `querySelector()` | 399 | 375 | 24 |
| `closest()` | 96 | 93 | 3 |
| `matches()` | 6 | 5 | 1 |
| **Total** | **646** | **579** | **67** |

The 579 static literal argument sites contain 374 unique literal selector
strings. The 67 dynamic selector expressions include constants and assembled
selectors such as `VIDEO_CARD_SELECTORS`, `QUICK_BLOCK_CARD_SELECTORS`,
`FT_DROPDOWN_SELECTORS`, `linkSelectors`, `selectors.join(',')`, and template
selectors using runtime ids.

## Source Family Totals

| Source family | Selector API sites | Static literal args | Dynamic/non-literal args | Unique static selector literals |
| --- | ---: | ---: | ---: | ---: |
| `page-runtime` | 493 | 426 | 67 | 286 |
| `extension-ui` | 90 | 90 | 0 | 42 |
| `legacy-layout` | 63 | 63 | 0 | 52 |

## Hottest Selector Files

| File | Selector API sites | Static literal args | Dynamic/non-literal args | Current concern |
| --- | ---: | ---: | ---: | --- |
| `js/content_bridge.js` | 246 | 208 | 38 | Native menu, fallback menu, prefetch, identity, collaborator, dynamic video-id selectors, and optimistic hide selectors share one large bridge. |
| `js/content/dom_fallback.js` | 161 | 150 | 11 | Global card scans, route cleanup, comments, watch controls, members/playlist/Mix hides, and shelf cleanup. |
| `js/tab-view.js` | 68 | 68 | 0 | Dashboard UI settings/profile/import/Nanah selectors. |
| `js/layout.js` | 63 | 63 | 0 | Legacy/support layout selector surface; not active content-runtime authority unless explicitly loaded. |
| `js/content/block_channel.js` | 39 | 28 | 11 | Quick-block and 3-dot menu selectors, including broad constants and overlay/menu constants. |
| `js/content/dom_extractors.js` | 27 | 23 | 4 | Shared video-card/title/channel selectors and global `VIDEO_CARD_SELECTORS` usage. |
| `js/popup.js` | 16 | 16 | 0 | Popup settings/profile controls. |
| `js/content/collab_dialog.js` | 11 | 10 | 1 | Collaborator dialog selectors plus dynamic video-id lookup. |
| `js/injector.js` | 6 | 5 | 1 | Page-world subscription/import helper selectors. |
| `js/ui_components.js` | 6 | 6 | 0 | Shared extension UI selectors. |
| `js/content/dom_helpers.js` | 3 | 2 | 1 | Shared hide/container helper selector input. |

## Dynamic Selector Families

| Dynamic family | Example source | Why it needs explicit proof |
| --- | --- | --- |
| Global card constants | `VIDEO_CARD_SELECTORS`, `QUICK_BLOCK_CARD_SELECTORS` | These mix desktop Main, mobile Main, YTM-style, playlist, Shorts, channel, and Kids tags. |
| Dropdown/menu constants | `FT_DROPDOWN_SELECTORS`, `nativeMenuSelector` | Normal and fallback menu paths do not share one action gate today. |
| Joined selector arrays | `selectors.join(',')`, `linkSelectors`, `shortsSelectors`, `playlistSelectors` | Route-specific selector sets are assembled locally, not through one selector authority. |
| Runtime id templates | ``[data-filtertube-video-id="${videoId}"]`` and collaboration-group selectors | Correctness depends on the runtime id source, ownership, escaping, and stale-node cleanup. |
| Caller-provided selector variables | `selector`, `sel`, `hiddenSelector`, `childSelector` | These need caller/source ownership proof before broad cleanup or reuse. |

## Content Bridge Selector Semantic Addendum

`docs/audit/FILTERTUBE_CONTENT_BRIDGE_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/content-bridge-selector-semantic-register-current-behavior.test.mjs`
promote the `js/content_bridge.js` 246-site hot-file row from selector-count
proof to source-derived selector/effect groups. The addendum pins 246 selector API sites, 208 static literal args, 38 dynamic/non-literal args, 137 unique static selector literals, 4 selector API families, 13 semantic selector groups,
and 12 dynamic selector families. The dynamic families are
`callerProvidedSelector`, `globalCardSelectorConstant`, `joinedSelectorArray`,
`runtimeVideoIdTemplate`, `collaborationGroupTemplate`,
`linkSelectorConstant`, `fallbackMenuCardSelectorConstant`,
`nativeMenuSelectorConstant`, `variantClassTemplate`,
`postActionRouteSelectorConstant`, `collaborationMenuKeyTemplate`, and
`channelInfoVideoIdHrefTemplate`. It records that no
`contentBridgeSelectorSemanticAuthority`,
`contentBridgeSelectorEffectReport`, `contentBridgeSelectorOwnerContract`,
`contentBridgeDynamicSelectorEscapePolicy`,
`contentBridgeSelectorNoRuleBudget`, or
`contentBridgeSelectorRestoreProof` exists in runtime source yet.

## DOM Fallback Selector Semantic Addendum

`docs/audit/FILTERTUBE_DOM_FALLBACK_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/dom-fallback-selector-semantic-register-current-behavior.test.mjs`
promote the `js/content/dom_fallback.js` and `js/content/dom_helpers.js`
hot-file rows from selector-count proof to source-derived selector/effect
groups. The addendum pins 164 selector API sites, 152 static literal args, 12 dynamic/non-literal args, 120 unique static selector literals, 3 selector API
families, 11 semantic selector groups, and 12 dynamic selector families. The
dynamic families are `commentEntryCandidateArray`, `homeFeedSelectorArray`,
`staleHiddenSelectorArgument`, `videoCardPendingTemplate`,
`globalVideoCardSelectorConstant`, `shortsContainerSelectorArray`,
`mobileShortsNavSelectorArray`, `disguisedShortsSelectorArray`,
`iteratedLinkSelectorCandidate`, `shortsSelectorArray`,
`iteratedShortsSelectorCandidate`, and `callerProvidedChildSelector`. It records
that no `domFallbackSelectorSemanticAuthority`,
`domFallbackSelectorEffectReport`, `domFallbackSelectorOwnerContract`,
`domFallbackDynamicSelectorEscapePolicy`, `domFallbackSelectorNoRuleBudget`,
`domFallbackSelectorRestoreProof`, `domFallbackSiblingVisibleFixtureReport`, or
`domHelperSelectorInputContract` exists in runtime source yet.

## Release Hot-Path Selector Addendum - 2026-05-27

This addendum records the selector sites involved in the release lag/menu/
quick-block/whitelist repair path. It is audit-only. It does not approve a
selector rewrite, broad DOM cleanup, menu behavior change, whitelist behavior
change, JSON-first promotion, or quick-block redesign.

| Selector row | Source pins | Current gate/effect | Release risk controlled |
| --- | --- | --- | --- |
| `release_selector_quick_block_overlay_exclusion` | `js/content/block_channel.js:461:closest` | Mobile watch-next quick-block hosts are rejected when they are inside YouTube dropdown/bottom-sheet selectors. | Prevents quick-cross hosts from being attached inside active native overlays. |
| `release_selector_quick_block_target_card` | `js/content/block_channel.js:1186:closest` | Pointer/focus targets resolve to `QUICK_BLOCK_CARD_SELECTORS` before falling back to bounded parent walking. | Preserves quick-cross recovery on deep Home/Shorts markup without global sweeping. |
| `release_selector_quick_block_sweep_cards` | `js/content/block_channel.js:1944:querySelectorAll` | Coalesced sweeps scan only queued roots for `QUICK_BLOCK_CARD_SELECTORS` after quick-block active gates pass. | Keeps the quick-cross affordance available while avoiding the old broad periodic body sweep. |
| `release_selector_menu_dropdown_repair_nested` | `js/content/block_channel.js:2330:querySelectorAll` | Hidden-state repair scans nested native menu/dropdown containers only during explicit menu-open repair. | Prevents reusable YouTube dropdown nodes from staying poisoned while avoiding unrelated dropdown mutation repair. |
| `release_selector_menu_button_activation` | `js/content/block_channel.js:2359:closest` | Capture click listener resolves YouTube menu buttons through the shared `menuButtonSelector`. | Keeps 3-dot menu augmentation tied to explicit menu activation rather than page-wide dropdown observation. |
| `release_selector_menu_outside_close_owned_items` | `js/content/block_channel.js:2481:querySelectorAll`, `js/content/block_channel.js:2484:querySelector` | Outside pointer close scans visible dropdown containers but closes only dropdowns containing `.filtertube-block-channel-item`. | Lets FilterTube-enriched comment/native menus close on outside selection without closing plain YouTube menus. |
| `release_selector_dropdown_discovery_added_node` | `js/content/block_channel.js:2542:matches`, `js/content/block_channel.js:2546:querySelectorAll` | Short-lived dropdown discovery accepts added dropdown nodes or nested dropdown descendants. | Keeps menu injection responsive after a menu click while limiting discovery to the armed 2500 ms window. |
| `release_selector_comment_menu_context_first` | `js/content/block_channel.js:2928-2935:closest` | Dropdown injection prefers comment-thread/comment-view-model/comment-renderer context before generic video-card selectors. | Prevents comment menu actions from falling back to the watch shell or right-rail wrapper. |
| `release_selector_menu_existing_item_check` | `js/content/block_channel.js:3062:querySelector`, `js/content/block_channel.js:3065:querySelector` | Completed dropdown state is trusted only if the injected item and title span still exist. | Avoids stale “blocked” state while YouTube reuses dropdown nodes. |
| `release_selector_menu_stale_item_cleanup` | `js/content/block_channel.js:3163:querySelectorAll` | Stale `.filtertube-block-channel-item` rows are removed before injection when the card cannot be identified. | Prevents an old FilterTube action row from leaking into a newly reused native menu. |
| `release_selector_whitelist_pending_card_intake` | `js/content_bridge.js:6191:matches`, `js/content_bridge.js:6192:querySelector`, `js/content_bridge.js:6193:querySelectorAll` | Pending-hide intake reaches `VIDEO_CARD_SELECTORS` only after mode, route, overlay, and queue-limit guards pass. | Keeps whitelist pending-hide fail-closed repair without charging blocklist/empty routes for nested selector traversal. |
| `release_selector_fallback_menu_mutation_card_intake` | `js/content_bridge.js:7101-7103:matches/closest` | Fallback-menu mutation scan checks `fallbackMenuCardSelector` only after overlay quiet mode and eager-scan gates pass. | Keeps fallback menu buttons lazy on desktop/no-work surfaces while preserving mobile/coarse-pointer recovery. |

Current release selector status:

```text
release hot-path selector rows: 12
release selector source files covered: 2
central selector authority in product source: absent
selector behavior change approval from this addendum: NO-GO
runtime behavior changed by this addendum: no
```

## Current Findings

| Finding | Evidence | Risk |
| --- | --- | --- |
| Selector authority is not centralized. | 646 selector API call sites across 11 non-vendor tracked files and no product `selectorAuthority` token. | A cleanup can narrow one selector path while another broad path still targets the same DOM. |
| Page runtime dominates selector risk. | Page-runtime owns 493 of 646 selector API sites and all 67 dynamic selector expressions. | Empty-install lag, false hides, and route drift are mostly page-runtime selector risks. |
| Static selector literals are numerous. | 579 literal selector-argument sites and 374 unique literal selector strings. | A broad edit needs a source-derived register, not manual memory of a few constants. |
| Dynamic selectors need ownership proof. | 66 sites use constants, joined arrays, runtime templates, or caller-provided selector variables. | These cannot be proven safe by static literal review alone. |
| Inventory docs remain evidence maps. | `docs/youtube_renderer_inventory.md`, `docs/json_paths_encyclopedia.md`, and ignored root captures inform fixtures but are not selector authority. | A documented DOM tag is not proof that current runtime selects it safely. |

## Required Selector Instance Contract

Before changing selector behavior, every selector site needs:

```text
selector site id: file:line:api
selector expression or literal value
owner class
surface and route
action: extract | hide | quick-block | menu | prefetch | whitelist-pending | UI
target kind: card | row | shelf | watch-shell | comment | channel | control
active-state gate
false-hide boundary
restore/teardown owner when the selector can hide or mutate DOM
fixture status: no-rule, disabled, blocklist, whitelist, route, and negative sibling-visible
```

## Future Fixture Gates

```text
selector_instance_register_every_site_has_file_line_api_owner
selector_instance_static_literal_unique_registry_matches_source
selector_instance_dynamic_expression_has_source_owner_and_escape_policy
selector_instance_video_card_constants_split_by_surface_route_action
selector_instance_quick_block_constants_have_feature_and_route_gate
selector_instance_fallback_menu_selectors_share_primary_action_gate
selector_instance_video_id_templates_require_owned_identity_source
selector_instance_comment_selectors_do_not_target_watch_scaffolding
selector_instance_watch_shell_selectors_require_explicit_whole_container_policy
selector_instance_legacy_layout_selectors_remain_quarantined_or_loaded_explicitly
selector_instance_inventory_docs_require_runtime_source_or_fixture_status
selector_instance_raw_capture_dom_extracts_minimal_fixture_before_behavior_change
```

## Current Verdict

```text
Completion is not proven.
Selector instance coverage is proof-started, not complete.
The selector area remains not-ready-for-behavior-change.
```

Related artifacts:

- `docs/audit/FILTERTUBE_SELECTOR_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_DOM_ROUTE_SCOPE_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_DOM_HIDE_SIDE_EFFECT_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_DOM_FALLBACK_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/youtube_renderer_inventory.md`
- `docs/json_paths_encyclopedia.md`
- `docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md`
- `docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
