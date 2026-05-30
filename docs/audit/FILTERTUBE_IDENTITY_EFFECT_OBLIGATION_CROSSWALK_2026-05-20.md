# FilterTube Identity Effect Obligation Crosswalk - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged.

This crosswalk turns the current identity-waterfall audit into implementation
obligations. It exists because the source waterfall alone:

```text
XHR / ytInitial JSON -> learned maps -> DOM -> resolver fetch
```

does not prove which visible effect is allowed. Each future behavior patch must
name the identity source, route/surface, settings mode, source confidence, and
allowed effect before it changes filtering, work budgets, map writes, resolver
fetches, DOM hides/restores, stats, or menu actions.

## Inputs

This crosswalk depends on the following current-behavior proof slices:

- `docs/audit/FILTERTUBE_IDENTITY_INFORMATION_WATERFALL_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_SOURCE_TIER_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md`
- `docs/audit/FILTERTUBE_DOM_IDENTITY_CONFIDENCE_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_IDENTITY_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_IDENTITY_RESOLVER_FANOUT_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_IDENTITY_WATERFALL_REVIEW_CONVERGENCE_2026-05-20.md`

## Obligation Crosswalk

| Obligation | Current source proof | Current risk | Required future proof before behavior changes |
| --- | --- | --- | --- |
| `endpoint_body_no_work` | `js/seed.js` can clone/parse/stringify YouTubei bodies and run `harvestOnly` or `processWithEngine` after endpoint interception. | Empty install, disabled-feeling, or no-actionable-rule states can still spend endpoint body work. | Route and endpoint counters proving zero clone, zero parse, zero stringify, zero harvest, zero renderer mutation, and zero DOM rerun when no rule can use the result. |
| `direct_json_renderer_effect` | `js/filter_logic.js` has direct rules for many renderers, but `docs/json_paths_encyclopedia.md` documents more fields than current runtime consumes. | A documented JSON path can be mistaken for live filtering authority. | Per-renderer positive and negative fixtures proving the runtime consumes the exact field for blocklist, whitelist, empty-list, sibling-visible, and route-specific behavior. |
| `harvest_only_map_write` | JSON/player data can update `channelMap`, `videoChannelMap`, and `videoMetaMap` through `js/filter_logic.js`, `js/content_bridge.js`, and `js/background.js` without directly hiding the current renderer. | Harvest-only can still write storage, stamp DOM, or trigger fallback reruns later. | Provenance, revision, source tier, route, active-rule need, allowed write set, and no-work budget for every learned-map write. |
| `learned_map_join_effect` | `videoId` can join through `videoChannelMap`, player owner payloads, or resolver output in `js/content_bridge.js` and `js/content/dom_fallback.js`. | A video id is useful but is not channel identity by itself. | `joinedByVideoId` proof that separates current video, Shorts row, playlist row, watch rail, and stale SPA card cases. |
| `dom_stable_link_effect` | DOM extraction in `js/content_bridge.js` and `js/content/dom_extractors.js` can find UC ids, handles, custom URLs, and card/menu targets from visible anchors or data attributes. | A stable DOM link can be correct for the visible target, but it still needs route and target ownership proof. | DOM confidence fixtures proving exact card ownership, recycled-node reset, clicked-target scope, and nonmatching sibling visibility. |
| `dom_display_name_effect` | DOM fallback in `js/content/dom_fallback.js` can match name-only indexes and visible text; menu extraction can use text snapshots when richer identity is absent. | Display text can collide, drift, or describe something other than the owner channel. | Display-only fixtures proving label-only behavior unless a stable endpoint backs the name before hide, persist, or resolver fanout. |
| `current_page_owner_injection` | DOM fallback in `js/content/dom_fallback.js` can inject current page owner context into cards that lack per-card identity. | Channel-page context can be valid for owner surfaces and wrong for nested recommendations or shelves. | Route/surface fixtures that distinguish channel-owner content from nested video cards, recommendations, and mixed shelves. |
| `whitelist_pending_hide_effect` | Whitelist mode in `js/content_bridge.js` can pending-hide new cards before identity is fully resolved. | Intended fail-closed behavior can look like false hiding when allowed identity arrives late or never arrives. | Whitelist fixtures covering unresolved, later-allowed, later-denied, timeout, restore, and stats/no-stats outcomes. |
| `network_resolver_effect` | Shorts, Main watch, Kids watch, and channel-detail resolvers in `js/background.js` still exist after cache/map/pending checks. | Network is last-resort current behavior, not deleted behavior; each resolver class has different trigger and credential semantics. | Reason-coded resolver reports with sender class, route, profile, list mode, user action, cache status, credential policy, retry limit, and allowed writes. |
| `post_action_fanout_effect` | A successful block in `js/content_bridge.js` can enrich visible Shorts and playlist rows beyond the clicked target. | User action proves one clicked target, not unlimited page-wide scan/fetch/hide work. | Fanout budget proving exact-target repair versus visible-sibling enrichment, max rows, max concurrency, restore policy, and nonmatching sibling visibility. |
| `playlist_mix_identity_effect` | Playlist rows, Mix/radio cards, and seed videos in `js/filter_logic.js` and `docs/json_paths_encyclopedia.md` can expose playlist identity, row owner identity, or byline text with different meanings. | Treating playlist/Mix text as channel identity can cause false hides; treating Mix as normal video can leak playlist-level intent. | Separate fixtures for playlist creator, playlist row owner, seed video, Mix/radio playlist id, and visible byline metadata. |
| `kids_ytm_surface_effect` | Kids can expose `kidsVideoOwnerExtension` in `js/filter_logic.js` while public Kids watch and YTM compact cards in `js/content_bridge.js` can still be sparse or video-id/map dependent. | Kids/YTM cannot inherit Main YouTube assumptions without route-specific proof. | Separate Main, Kids, YTM, native-app WebView, watch, browse/search, and compact-card fixtures with mode/source/effect decisions. |
| `comments_posts_author_effect` | Comment and post renderers in `js/filter_logic.js` and `docs/json_paths_encyclopedia.md` have author endpoints, body text, continuation wrappers, and shared-post identity splits. | Keyword/body filtering and author/channel blocking are different effects. Shared posts can blur sharer and original author. | Fixtures separating author identity, body keyword text, shared original identity, continuation type, menu target, and restore behavior. |
| `hide_restore_stats_effect` | `toggleVisibility`, direct display writes, parent cleanup, playlist/current-watch side effects, and stats writes in `js/content/dom_helpers.js`, `js/content/dom_fallback.js`, and `js/content_bridge.js` are not one unified effect. | A correct identity decision can still create broad hide, stale restore, playback, navigation, or stats side effects. | Hide/restore/stat authority proof with exact target, parent container, sibling visibility, media side effect, and counter ownership. |

## Required Decision Shape

Future patches should not answer only "where did identity come from?" They must
produce a decision with at least:

```text
identityEffectDecision
  routeSurface
  profileId
  profileType
  listMode
  activeRuleFamily
  sourceTier
  sourceFieldsPresent
  sourceConfidence
  targetKind
  targetVideoId
  targetChannelId
  userActionClass
  allowedEffects
  deniedEffects
  noWorkReason
  fallbackReason
  mapWritePolicy
  domScanPolicy
  hidePolicy
  restorePolicy
  statsPolicy
  networkPolicy
```

## Blocked Runtime Authority

No runtime symbol exists yet for:

- `identityEffectDecision`
- `identityEffectObligationRegistry`
- `endpointBodyNoWorkDecision`
- `directJsonRendererEffectAuthority`
- `harvestOnlyMapWriteAuthority`
- `learnedMapJoinAuthority`
- `domDisplayNameEffectAuthority`
- `whitelistPendingHideAuthority`
- `postActionFanoutAuthority`

Until those authorities or equivalent fixture-backed contracts exist, this
crosswalk keeps identity-related implementation changes blocked.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this identity effect obligation crosswalk can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
