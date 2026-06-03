# FilterTube Page Runtime Owner/Effect Matrix Current Behavior - 2026-05-20

Status: current-behavior audit artifact. This is not an implementation patch.

This slice turns the lifecycle audit into an owner/effect matrix for the
YouTube page runtime. The source waterfall answers where data came from. The
lifecycle register answers which observers, listeners, timers, frames, and
patches exist. This matrix answers the missing question: which owner can spend
that lifecycle work and what side effect it can cause today.

The current runtime still lacks one shared decision object that answers:

```text
owner is installed
        |
        v
which route, surface, profile, mode, feature flag, native overlay state,
fullscreen state, and visible rule state allows this owner to work?
        |
        +--> no: no scan, no stamp, no fetch, no hide, no restore,
        |        no injected UI, no media action, no storage write
        |
        +--> yes: only the named effects for that owner
```

## Current Owner/Effect Matrix

| Owner | Install / wake trigger | Current side effects | Current gap |
| --- | --- | --- | --- |
| Seed page transport | Document-start page script installs `fetch`, XHR, and `ytInitial*` hooks. | Parse/clone/stringify YouTubei payloads, stash snapshots, replay queued data, harvest learned maps, mutate renderer JSON. | Endpoint patch lifetime is not decided by a route/mode/no-rule owner report before hooks install. |
| Bridge settings relay | Content script waits for seed readiness and storage refresh. | Sends compiled settings to page runtime, retries readiness, schedules storage refresh fanout. | Settings freshness and lifecycle work are separate from a revisioned owner decision. |
| Bridge learned-map receiver | Main-world messages such as `FilterTube_UpdateVideoChannelMap` and `FilterTube_UpdateVideoMetaMap`. | Persist maps, stamp DOM cards by `videoId`, schedule DOM fallback reruns, patch cached settings. | Identity learning can write and rescan even when no visible rule row is active. |
| Bridge prefetch / playlist hydration | `startCardPrefetchObserver()` and playlist/right-rail hooks. | Observe cards, listen for scroll/visibility/navigation, attach playlist observers, queue identity hydration. | No shared no-rule, route, or hidden-tab budget decides whether hydration should run. |
| Bridge whitelist pending | Whitelist mode mutation handling and delayed pending-hide refresh. | Directly apply pending hidden classes, later rerun DOM fallback and restore/hide based on identity. | Fail-closed recovery is mixed with generic fallback scheduling and can hide before full identity proof. |
| Bridge fallback menu | `ensureFallbackMenuButtons()` warmup scans, observer, scroll/click/navigation listeners. | Inject fallback buttons/popovers, scan broad card/comment/playlist/YTM selectors, run block actions. | It does not share the normal menu action gate and has only local native-overlay quiet guards. |
| Quick block | `setupQuickBlockObserver()` viewport, focus, pointer, mutation, resize, orientation, interval work. | Inject quick cross buttons, position them, sweep cards, build block context, call block flow. | Some lifecycle installs before the enabled guard and lacks a shared fullscreen/native-overlay pause decision. |
| Normal menu / Kids passive | `setupMenuObserver()` and `setupKidsPassiveBlockListener()`. | Observe dropdowns, inject normal menu rows, mirror Kids native block actions, track dropdown visibility. | Separate from fallback menu and quick block; no unified menu affordance owner exists. |
| DOM fallback core | `applyDOMFallback()` calls from initialization, map updates, metadata updates, fallback scheduling, and route events. | Query card selectors, extract identity/text, hide/restore, clear stale markers, count stats, pause media on some paths. | Active-work checks are local and not an owner-level no-work budget for all scheduled callers. |
| DOM playlist/player guard | Page-lifetime click/ended listeners and selected playlist-row logic. | Hide selected rows, pause playback, synthetic-click alternate targets, skip hidden playlist items. | Watch/player side effects are local route checks, not a registered watch lifecycle authority. |
| Collaborator dialog | Capture click/keydown listeners plus document mutation observer. | Capture collaborator trigger context, apply collaborator identity, rerun fallback. | Observation is not tied to a compiled collaborator-needed state. |
| Prompt surfaces | First-run and release-note prompts on DOM ready / storage state. | Inject prompt DOM, acknowledge prompt state, open What is New or settings surfaces. | Prompt lifecycle, navigation, and acknowledgement trust are separate from page runtime owner budget. |

## Why This Matters

The lag/false-hide symptoms are not caused by one listener alone. A single
YouTube navigation can wake multiple owners:

```text
YouTube route / payload / DOM mutation
        |
        +--> seed transport parses or harvests JSON
        +--> bridge learns maps and schedules fallback
        +--> prefetch observes or hydrates cards
        +--> fallback menu scans for missing actions
        +--> quick block sweeps and repositions buttons
        +--> DOM fallback scans/hides/restores/counts
        +--> playlist guard can pause/click on watch routes
        +--> collaborator observer can rerun fallback
```

Current docs and tests now prove those owners exist. They do not yet prove an
implementation-ready cleanup. Deleting one observer can leave equivalent work
alive in another owner, and gating one hide path can leave a storage write,
pending hide, media pause, or fallback scan alive elsewhere.

## Required Future Owner Decision

Before behavior changes, each owner needs a decision record:

```text
owner id
install trigger
route/surface scope
profile/list mode
visible-rule and compiled-rule state
feature flag state
native overlay / fullscreen / hidden-tab pause state
allowed effects:
  observe | scan | stamp | fetch | mutate-json | persist-map |
  hide | restore | inject-menu | inject-quick | pause | click | count | navigate
teardown or page-lifetime reason
negative budget:
  disabled | blocklist-empty | whitelist-empty | route-inactive |
  native-overlay-active | fullscreen-active | hidden-tab
```

## Implementation Boundary

Do not use this matrix as permission to remove runtime code. It is a map of
current behavior. The next implementation-safe step is to introduce owner
decision reports and counters, then prove each target change with positive,
negative, route, mode, side-effect, restore, provenance, and teardown fixtures.

## Current Verdict

```text
Completion is not proven.
The page runtime has named owners, but no shared owner/effect authority.
Runtime behavior remains not-ready-for-lifecycle or performance optimization.
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this page-runtime owner/effect matrix can
support runtime optimization or JSON-first promotion. Current proof pins:

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
