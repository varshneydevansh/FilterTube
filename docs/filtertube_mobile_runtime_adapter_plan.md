# FilterTube Mobile Runtime Adapter Plan

## Goal

Adapt the current browser-extension runtime into an app-managed runtime for Android, iPhone, iPad, Android TV, and Fire TV without carrying over extension-only assumptions.

The target model is:

- native shell owns authority, storage, PIN, sync, import/export, and supervision UX
- injected JS runtime owns page observation, matching, and surface-level filtering
- a narrow message bridge connects both sides
- watch-next, continuation, and restore state are modeled explicitly instead of being treated as incidental DOM state

## 2026-04-28 upstream checkpoint

Current extension-side mobile/runtime parity is summarized in [MOBILE_APP_UPSTREAM_CHECKPOINT_2026-04-28.md](/Users/devanshvarshney/FilterTube/docs/MOBILE_APP_UPSTREAM_CHECKPOINT_2026-04-28.md).

The app runtime adapter should treat these as source-of-truth behaviors:

- 3-dot menu entry works independently of Quick Block visibility.
- Home, Search, Shorts, comments, watch playlist rows, YTM watch-like rows, and Mix rows all use the same identity recovery principles.
- Comment-origin blocks target the comment author only.
- Watch playlist and Mix rows may recover through `watch:VIDEO_ID`, `videoChannelMap`, and intercepted player/next data, but must not fake success without stable identity.
- Mix containers are not collaboration rosters. Real collaboration recovery must come from video/watch/search JSON.
- Header-backed `Collaborators` sheets outrank avatar/direct-list/DOM fallback candidates.
- Composite fallback collaborator names are pruned when covered by real roster names.
- `Filter All` is channel-owned state that regenerates exact channel-derived keywords.
- Kids and Main remain independent rule spaces; Kids -> Main sync applies only when list modes match.
- Semantic ML remains disabled/future until runtime matching exists.

## 1. Runtime Split

### Native Kotlin / Swift responsibilities

- active profile authority
- lock state and PIN verification
- persistent storage
- Nanah trusted-device sync
- import/export and encrypted backup flows
- Main vs Kids launch routing
- fullscreen and back-stack policy
- parent overlay and safe exit
- onboarding and recovery
- telemetry for adapter health and fallback rate
- watch-context restore state for back navigation, unlock flows, and profile switches
- default launch target resolution for `Main Viewing` vs `Kids Viewing`

### Injected JS responsibilities

- page-shape detection
- DOM and JSON observation
- normalized identity extraction
- compiled allow/block matching
- DOM stamping and incremental hide/show behavior
- reporting adapter health back to native shell
- continuation and watch-next boundary observation

## 2. Current Extension Files: Reuse vs Refactor

### Reuse with minimal change

- [identity.js](/Users/devanshvarshney/FilterTube/js/shared/identity.js)
  - Pure identity normalization and matching helper surface.
  - Good candidate for direct reuse in a shared app runtime bundle.

### Reuse after refactor

- [filter_logic.js](/Users/devanshvarshney/FilterTube/js/filter_logic.js)
  - Keep the matcher engine, queueing concepts, and hybrid JSON plus DOM strategy.
  - Split into:
    - compiled matcher core
    - YTD adapter
    - YTM adapter
    - YTK adapter
    - watch-next state tracker
    - continuation tracker
    - mutation scheduler
    - bridge-facing runtime API

- [content_bridge.js](/Users/devanshvarshney/FilterTube/js/content_bridge.js)
  - Keep payload extraction and bridge concepts.
  - Remove extension-port assumptions.
  - Refactor into app bridge client plus structured message schema.

- [injector.js](/Users/devanshvarshney/FilterTube/js/injector.js)
  - Keep page-context hook points.
  - Refactor for mobile WebView timing and narrower responsibilities.

- [state_manager.js](/Users/devanshvarshney/FilterTube/js/state_manager.js)
  - Use as reference for business rules and state transitions.
  - Do not port directly as app shell state.

### Native-owned replacement required

- [background.js](/Users/devanshvarshney/FilterTube/js/background.js)
  - Browser extension concerns are too broad and environment-specific.
  - Replace with native services:
    - storage service
    - profile service
    - import/export service
    - sync service
    - compiled payload builder

## 3. Proposed Runtime Modules

### Shared JS bundle

- `identity_core`
- `compiled_matcher`
- `page_surface_detector`
- `ytm_adapter`
- `ytd_adapter`
- `ytk_adapter`
- `watch_context_tracker`
- `continuation_tracker`
- `mutation_scheduler`
- `dom_stamper`
- `bridge_client`
- `runtime_bootstrap`

### Native app modules

- `ProfileStore`
- `PinGate`
- `FilterPayloadCompiler`
- `NanahSyncService`
- `ImportExportService`
- `ManagedWebSessionController`
- `ParentOverlayController`
- `FullscreenController`
- `AdapterHealthLogger`
- `WatchContextStore`

## 4. Message Bridge Contract

The bridge should stay small and explicit.

### Native -> JS

- `BOOTSTRAP_RUNTIME`
  - active profile metadata
  - current surface mode: main or kids
  - compiled filter payload
  - feature flags

- `PROFILE_UPDATED`
  - new compiled payload
  - lock-sensitive flags

- `SET_SURFACE_MODE`
  - switch between main and kids

- `REQUEST_SNAPSHOT`
  - ask runtime for current page adapter state and metrics

- `PARENT_OVERRIDE`
  - temporary shell-authorized override signals such as pause filtering during diagnostic flow

- `RESTORE_WATCH_CONTEXT`
  - last known video or page context
  - optional continuation snapshot
  - shell restore intent

### JS -> Native

- `RUNTIME_READY`
  - adapter detection status
  - injection timing info

- `SURFACE_DETECTED`
  - YTD, YTM, or YTK
  - key DOM shape info

- `FILTER_STATS`
  - processed nodes
  - hidden nodes
  - fallback rate
  - mutation latency

- `SETTINGS_MUTATION_REQUEST`
  - requested mutation
  - requires native authorization

- `PROFILE_CONTEXT_REQUEST`
  - request active profile metadata needed by runtime

- `ADAPTER_MISS`
  - selector/path drift
  - parser failure

- `WATCH_CONTEXT_UPDATED`
  - current video/page identity
  - watch-next adapter state
  - continuation availability

- `CONTINUATION_STATE_UPDATED`
  - surface-specific continuation token or paging state summary

## 5. Storage Abstraction

The extension currently assumes browser-managed persistence. Mobile and TV should not.

Native storage model:

- single source of truth in native storage
- profile-scoped documents
- compiled payload cache per profile
- encrypted export artifact generated natively
- JS runtime gets read-only compiled payload snapshots unless native explicitly authorizes mutation

Recommended shape:

- `profiles`
- `activeProfileId`
- `pinState`
- `syncTrustLinks`
- `nanahDeviceState`
- `compiledPayloadCache`
- `appPreferences`
- `watchContextCache`
- `continuationStateCache`
- `defaultLaunchSurface`

## 6. Compiled Settings Payload Shape

The app should not ship raw UI settings only. It should inject a compiled payload optimized for fast matching.

Recommended payload sections:

- `profile`
  - `profileId`
  - `profileType`
  - `locked`
  - `surfaceMode`

- `matching`
  - normalized blocked channels map
  - normalized allowed channels map
  - blocked keyword matchers
  - allowed keyword matchers
  - filter mode

- `uiToggles`
  - hideShorts
  - hideComments
  - hideSponsored
  - hideMixes
  - hideExplore
  - other existing toggles

- `runtimeFlags`
  - enableJsonObservation
  - enableDomFallback
  - maxMutationBatch
  - adapterVersion
  - enableWatchContextTracking
  - enableContinuationTracking

- `policy`
  - childRestrictions
  - allowSettingsMutation
  - parentOverlayEnabled

## 7. YTD / YTM / YTK Adapter Boundaries

Do not keep one monolithic selector system.

### YTD adapter

- desktop-like YouTube structures when encountered in larger/tablet contexts
- richer renderer tree assumptions
- watch sidebar, shelves, comments, cards

### YTM adapter

- `m.youtube.com`
- compact mobile cards
- mobile watch page
- mobile search and shorts rails

### YTK adapter

- YouTube Kids-specific surface
- tighter card model
- kids-first tabs and shelves
- stricter supervision defaults

Each adapter should expose:

- `detect()`
- `attachObservers()`
- `collectCandidates()`
- `extractIdentity()`
- `applyDecision()`
- `reportHealth()`
- `captureContinuationState()`
- `captureWatchContext()`

## 8. Performance Constraints

The app runtime must operate under tighter mobile constraints than desktop extension runtime.

Rules:

- precompile everything possible natively
- do not re-normalize the same channel identity repeatedly
- use cached identity comparisons
- process mutations incrementally
- batch DOM writes
- stamp nodes after evaluation
- avoid whole-document rescans
- keep bridge calls low-frequency and structured
- log adapter misses without flooding native storage/logs
- cache recent watch-next and continuation decisions so back navigation and repeated recommendation loads do not reprocess from zero

Budget targets for prototype:

- no visible UI hitch during normal feed scroll
- no repeated full-list rescans on minor mutations
- bounded processing queue per mutation burst
- graceful degradation to partial filtering instead of catastrophic slowdown

## 9. Migration Path From Extension Runtime

### Step 1

Extract shared identity and matcher modules from extension-specific globals.

### Step 2

Create a new app runtime bootstrap that accepts a compiled payload from native shell.

### Step 3

Split surface-specific selectors into explicit adapters for YTD, YTM, and YTK.

### Step 4

Replace browser storage and messaging assumptions with bridge calls.

### Step 5

Add explicit watch-context and continuation-state capture before porting more UI behavior.

### Step 6

Move import/export, sync, and profile authority entirely native.

### Step 7

Keep the extension and app runtime sharing matcher logic, not environment glue.

## 10. Immediate Refactor Targets

1. Extract shared matcher core from [filter_logic.js](/Users/devanshvarshney/FilterTube/js/filter_logic.js).
2. Extract a bridge-neutral runtime API from [content_bridge.js](/Users/devanshvarshney/FilterTube/js/content_bridge.js).
3. Identify page-context hooks in [injector.js](/Users/devanshvarshney/FilterTube/js/injector.js) that must survive in WebView.
4. Define native-owned storage schema from current [background.js](/Users/devanshvarshney/FilterTube/js/background.js) state model.
5. Build a compiled payload contract and serializer.
6. Create YTM adapter skeleton.
7. Create YTK adapter skeleton.
8. Add adapter health telemetry schema.
9. Define JS boot order for Android WebView and WKWebView.
10. Write a runtime test harness against saved page snapshots.
11. Define watch-context snapshot shape for native restore.
12. Define continuation-state snapshot shape per adapter.
