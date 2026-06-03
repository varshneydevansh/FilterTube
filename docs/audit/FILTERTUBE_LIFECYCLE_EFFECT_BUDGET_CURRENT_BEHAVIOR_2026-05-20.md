# FilterTube Lifecycle Effect Budget Current Behavior - 2026-05-20

Status: current-behavior audit artifact. This is not an implementation patch.

This slice tightens the lifecycle audit from "which primitives exist" to
"which feature is allowed to spend lifecycle work and what effect that work can
have." It is deliberately separate from implementation. The current code still
needs a shared runtime authority before observers, listeners, timers, request
animation frames, or page-global patches are gated, removed, or merged.

## Why This Slice Exists

The identity waterfall is a source-confidence order:

```text
XHR JSON / ytInitial* / learned maps / DOM / bounded network fallback
```

The lifecycle budget is the separate permission layer:

```text
source is available
        |
        v
is this feature active for this profile, list mode, route, surface, and UI state?
        |
        +--> yes: spend exact owner work
        +--> no: do not scan, observe, patch, fetch, mutate, hide, restore, or count
```

Current runtime code does not yet have this shared layer. Instead, several
feature owners install their own page-resident lifecycle work.

## Current Page Runtime Owners

| Owner | Current work surface | Current allowed effect | Current gap |
| --- | --- | --- | --- |
| Seed transport | Page-global `fetch` and XHR hooks, initial global snapshot replay, endpoint body parse/mutate. | Harvest identity and mutate JSON responses when later gates allow. | Patch lifetime and endpoint work are not decided by one `endpointPolicy + lifecycleBudget` report before install. |
| Content bridge prefetch / hydration | `IntersectionObserver`, visibility listener, playlist scroll listener, playlist panel `MutationObserver`, `yt-navigate-finish` listener. | Attach near-viewport cards for identity hydration and playlist-panel rechecks. | It has no shared no-rule or route-scoped budget deciding whether identity harvest is needed on that page. |
| DOM fallback observer | Body `MutationObserver`, pending whitelist hides, forced fallback scheduling, prefetch bootstrap. | Re-run DOM fallback and pending whitelist evaluation as YouTube hydrates. | It mixes whitelist fail-closed recovery, metadata harvest, and generic fallback scan scheduling without one owner report. |
| Fallback 3-dot menu | Style injection, body observer, navigation/click/scroll listeners, eight warmup scans, per-card button injection. | Restore FilterTube actions on cards that lack native menu affordances. | It scans many YouTube surfaces independently of quick-block/menu authority and only has local native-overlay quiet guards. |
| Quick block | Style injection, focus/input/click/scroll/resize/orientation/pointer listeners, body observer, periodic sweep. | Keep quick cross buttons aligned and visible on supported cards. | Several listeners install before the first feature-enabled guard, and the interval has no clear teardown path. |
| Normal menu / Kids passive menu | Global click listener, dropdown observers, Kids toast/body observer. | Inject menu items or mirror Kids native block actions. | This is separate from fallback-menu lifecycle and has no shared menu-affordance budget. |
| DOM fallback playlist guards | Window/document click and ended listeners plus delayed navigation clicks. | Skip hidden playlist items and prevent immediate hidden-next playback. | Watch/playlist side effects are page-lifetime listeners with local route checks instead of registered route-owned lifecycle. |
| Collaborator dialog | Capture click/keydown listeners and document mutation observer. | Capture collaborator cards and ownership context. | Page-wide observation is not tied to a compiled collaborator-needed state. |

## Current Gap Shape

```text
compiled settings / current route
        |
        +--> seed decides endpoint work
        +--> content bridge decides prefetch and fallback scheduling
        +--> quick block decides button lifecycle
        +--> fallback menu decides action affordance lifecycle
        +--> DOM fallback decides scan/hide/restore work
        +--> watch playlist guards decide media/click side effects

Missing center:
        lifecycleEffectBudget
        lifecycleOwnerDecision
        routeSurfaceLifecycleScope
        fullscreenPauseAuthority
        nativeOverlayPauseAuthority
        noRuleLifecycleCounter
```

## What This Explains

The user-visible symptoms can share one root cause:

- an empty install can still have page-resident lifecycle owners,
- blocklist mode with no rows can still spend lifecycle work for affordances or harvest,
- whitelist mode can intentionally fail closed while also waking recovery scans,
- fullscreen/orientation can trigger quick-block viewport refreshes while YouTube is resizing the player,
- watch/playlist side effects can be alive even when a route-specific authority has not been reported,
- fallback menu and quick block can diverge because they do not share one menu/affordance authority.

## Fullscreen And Native Overlay Pause Gap

Current source has local pause guards, not one shared fullscreen lifecycle
authority:

| Owner | Current fullscreen/native-overlay behavior | Current gap |
| --- | --- | --- |
| `content_bridge.js` fallback-menu and pending-whitelist paths | `isFilterTubeNativeOverlayQuietMode()` checks `window.__filterTubeNativeOverlayCovered`, `data-filtertube-native-overlay-covered`, `window.__filterTubeNativeFullscreenActive`, and `data-filtertube-native-fullscreen`; fallback-menu scans, warmups, click rescans, scroll rescans, and pending whitelist refreshes consult that local guard. | This protects several content-bridge owners, but the guard is local. It is not a route/profile/list-mode lifecycle decision shared by seed, quick block, DOM fallback, playlist guards, prompts, or settings refresh. |
| `content/block_channel.js` quick block | Quick block listens to `resize` and `orientationchange`, schedules viewport refreshes, and consumes cached `getQuickBlockSurfaceState().overlayOpen` values from `isYouTubeOverlaySurfaceOpen()` for YouTube overlays. | It does not consume `isFilterTubeNativeOverlayQuietMode()` or a named fullscreen pause authority. Fullscreen/orientation can still wake quick-block lifecycle before any future shared pause decision. |
| `content/dom_fallback.js` playlist/player guards | Playlist next/ended listeners use local watch route, playlist, and list-mode checks before pausing/clicking. | They do not register with a fullscreen/native-overlay pause authority, so player-sensitive side effects remain locally guarded rather than centrally budgeted. |
| Seed transport and settings refresh | Fetch/XHR hooks, page-global replay, and settings-triggered reruns are not paused by fullscreen/native overlay state. | Endpoint processing and refresh fanout need separate no-work/fullscreen budgets before claiming fullscreen smoothness. |

The current safe audit conclusion is narrow: some content-bridge scans quiet down
under native fullscreen/overlay flags, but FilterTube does not yet have a
shared `fullscreenPauseAuthority` that pauses all non-player work across page
runtime owners.

## Required Future Contract

Every lifecycle owner needs one explicit decision record:

```text
owner: seed | contentBridgePrefetch | domFallback | fallbackMenu | quickBlock | normalMenu | kidsPassive | playlistGuard | collaborator
route/surface: home | search | watch | shorts | playlist | kids | ytm | comments | unknown
profile/list mode: disabled | blocklist-empty | blocklist-active | whitelist-empty | whitelist-active
feature gate: visible/hidden/native-owned/disabled
allowed effects: observe | scan | mutate-json | hide | restore | inject-menu | inject-quick | fetch | pause | click | count
pause states: native overlay | fullscreen | hidden tab | mini-player/native app overlay
teardown: disconnect/remove/clear/restore or documented page-lifetime reason
negative budget: zero work in disabled/no-rule/route-inactive states
```

## Implementation Boundary

Do not optimize by deleting isolated listeners or observers first. The safe
order is:

1. Define the lifecycle effect budget report.
2. Add counters proving no-rule, disabled, native-overlay, fullscreen, and route-inactive budgets.
3. Move each owner behind that report.
4. Only then remove duplicate scans, collapse observers, or change page-global patch timing.

## Current Verdict

```text
Completion is not proven.
The lifecycle effect budget is documented but not implemented.
Runtime behavior remains not-ready-for-lifecycle optimization.
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this lifecycle effect budget can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
