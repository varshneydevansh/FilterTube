# FilterTube Content Bridge Whitelist Pending Refresh Boundary - Current Behavior

Date: 2026-05-23

Status: current-behavior boundary with a narrow runtime no-work optimization.

Runtime behavior changed only for whitelist pending-hide mutation intake in
`js/content_bridge.js`. This is not a cache patch, JSON filtering patch, DOM
fallback behavior patch, native sync patch, release package patch, or public
claim.

## Boundary

This slice pins the current content-bridge path that temporarily hides newly-added cards in whitelist mode until DOM fallback can re-evaluate them:

- `initializeDOMFallback()` installs debounced and immediate DOM fallback reruns after initial settings load.
- A local whitelist-pending queue collects new `VIDEO_CARD_SELECTORS` candidates from mutation batches, applies a bounded temporary hide, and schedules a focused DOM fallback recheck with `onlyWhitelistPending`.
- The fallback mutation observer scans added nodes for relevant content and hidden/pending marker state.
- DOM fallback consumes `onlyWhitelistPending` by narrowing `videoElements` to `[data-filtertube-whitelist-pending="true"]`, clearing stale processed state, and returning before later broad container passes.
- The separate right-rail observer still schedules forced reprocess passes outside watch routes while attaching to watch-rail selectors.

This boundary matters for whitelist optimization and first-class JSON filtering because this queue is a false-hide/leak and performance bridge: it intentionally hides content before full identity certainty, then depends on DOM fallback to remove or confirm that state.

## Source Fingerprints — refreshed 2026-10-22

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 15,054 | 678,313 | `4daad851b77516cbe723e6695d5553752f663be55813b7019bfddce2479a917a` |
| `js/content/dom_fallback.js` | 8,177 | 380,719 | `bc072cfd232c1b19fc02c38de008fd84c52de774752f802aef9dac8b560d4851` |

content bridge whitelist pending refresh source files pinned: 2

## Pinned Source/Effect Blocks

| Block | Source | Start line | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| `contentBridgeRightRailWhitelistObserver` | `js/content_bridge.js:1438` | 1,438 | 98 | 3,094 | `f657ce4b4b8ba815a4149d3508ebec0445450bf49c74478c0e2169da4c679bc4` |
| `contentBridgeInitializeFallbackThrottle` | `js/content_bridge.js:7142` | 7,142 | 255 | 12,647 | `f7ffef2af0d96ca65b0166b8940b15d46f8fd7a222940ae856fad8ee68562a52` |
| `contentBridgeWhitelistPendingQueue` | `js/content_bridge.js:7397` | 7,397 | 70 | 4,159 | `3181b672c5d3a1a558baa5b0dbb175c05f7d966b908b835ae7c216ebc7eaa86b` |
| `contentBridgeWhitelistPendingApply` | `js/content_bridge.js:7467` | 7,467 | 112 | 5,829 | `2ff0a4ef33bdaf0acde1b27bf31d8d026f675702adae2bbc03692c213c266ad8` |
| `contentBridgeFallbackMutationObserver` | `js/content_bridge.js:7579` | 7,579 | 217 | 9,542 | `644e542cd718856d5a3d447c3ecce919cf66cbad4bb0373efc61da62b3df09b9` |
| `domFallbackOnlyWhitelistPendingSelector` | `js/content/dom_fallback.js:5408` | 5,408 | 19 | 950 | `7235b5ea6e0689ab98e3e2e21e02e37d95b52675bc16a7c5bffa56b50c905894` |
| `domFallbackWhitelistPendingStateReset` | `js/content/dom_fallback.js:5671` | 5,671 | 74 | 4,342 | `7f374fecc191fc37bbef5af4e05b040ff3b3b2e0585baec5f8036b1d4f4c7c6f` |
| `domFallbackWhitelistPendingIdentityHide` | `js/content/dom_fallback.js:6954` | 6,954 | 16 | 993 | `2352973b418feb0a4da5f8b71c11940d6a0292b6bdb5db511262db89889c1f17` |
| `domFallbackOnlyWhitelistPendingReturn` | `js/content/dom_fallback.js:7249` | 7,249 | 4 | 83 | `438296f1dbec1d892317f6177e74323886b6830fd0697eb1b1c12e4779776ad0` |

content bridge whitelist pending refresh source/effect blocks pinned: 9

## Selected Token Counts

Counts below are over the pinned source/effect blocks, not whole files.

| Token | Count |
| --- | ---: |
| `whitelistPendingRefreshState` | 15 |
| `pendingHideTimer` | 4 |
| `pendingHideCandidates` | 9 |
| `WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT` | 5 |
| `scheduleWhitelistPendingRecheck` | 2 |
| `queueWhitelistPendingHide` | 2 |
| `applyWhitelistPendingHide` | 2 |
| `onlyWhitelistPending` | 3 |
| `data-filtertube-whitelist-pending` | 6 |
| `filtertube-hidden` | 10 |
| `data-filtertube-hidden` | 4 |
| `forceReprocess: true` | 2 |
| `preserveScroll: true` | 3 |
| `setTimeout` | 6 |
| `requestAnimationFrame` | 1 |
| `MutationObserver` | 11 |
| `observer.observe` | 2 |
| `observer.disconnect` | 2 |
| `yt-navigate-finish` | 2 |
| `isFilterTubeNativeOverlayQuietMode` | 8 |
| `currentSettings?.listMode` | 6 |
| `listMode !== 'whitelist'` | 5 |
| `path === '/'` | 3 |
| `path === '/results'` | 3 |
| `path === '/feed/channels'` | 2 |
| `path.startsWith('/watch')` | 3 |
| `VIDEO_CARD_SELECTORS` | 15 |
| `queuePrefetchForCard` | 1 |
| `data-filtertube-processed` | 7 |
| `data-filtertube-last-processed-id` | 6 |
| `clearCachedChannelMetadata` | 5 |
| `hasExplicitHideReasonMarker` | 1 |
| `applyDOMFallback(null, { preserveScroll: true, onlyWhitelistPending: true })` | 1 |
| `hasActiveFallbackLifecycleWork` | 3 |
| `fallbackMutationObserverActive` | 4 |
| `disconnectFallbackMutationObserver` | 3 |
| `FilterTube_refreshDOMFallbackObserver` | 3 |

Selected missing policy/report tokens over pinned blocks:

| Token | Count |
| --- | ---: |
| `contentBridgeWhitelistPendingRefreshContract` | 0 |
| `contentBridgeWhitelistPendingRefreshReport` | 0 |
| `whitelistPendingHideQueueBudget` | 0 |
| `whitelistPendingPlaceholderPolicy` | 0 |
| `whitelistPendingObserverOwnerReport` | 0 |
| `whitelistPendingRouteExclusionPolicy` | 0 |
| `whitelistPendingRerunBudgetReport` | 0 |
| `whitelistPendingDomFallbackConsumerParity` | 0 |

## Current Behavior Pinned

`contentBridgeRightRailWhitelistObserver`: the right-rail observer is singleton-guarded, attaches to `#related`, `#secondary`, and watch-next rail selectors, and uses mutation and `yt-navigate-finish` callbacks to coalesce one immediate and one follow-up forced DOM fallback pass. The scheduler exits unless current settings are whitelist mode and the delayed runner rechecks mode before applying fallback.

`contentBridgeInitializeFallbackThrottle`: DOM fallback startup waits 1000 ms, requests settings if missing, runs `applyDOMFallback(settings)`, installs fallback menu buttons, defines a debounced 200 ms fallback, defines a 250 ms immediate fallback throttle, and schedules prefetch scans after immediate reruns.

`contentBridgeWhitelistPendingQueue`: a local state object carries one recheck timer, one pending-hide timer, and a bounded candidate array capped at 160. The recheck timer calls `applyDOMFallback(null, { preserveScroll: true, onlyWhitelistPending: true })`. The pending-hide queue now rejects non-whitelist mode, `/`, `/results`, `/feed/channels`, `/watch`, and already-full candidate queues before selector traversal. It still ignores non-elements and script/style/link/svg/path nodes, accepts direct or nested `VIDEO_CARD_SELECTORS` on admitted routes, dedupes candidate object references, and coalesces pending hide work into one timer.

`contentBridgeWhitelistPendingApply`: pending hide only runs in exact whitelist mode and returns on `/`, `/results`, `/feed/channels`, and watch routes. It skips watch/comment/secondary scaffolding unless the element is a content-card tag, maps some renderer tags to enclosing hide targets, skips selected playlist rows, skips processed, already pending, or already hidden elements, queues prefetch, then writes `filtertube-hidden`, `data-filtertube-hidden="true"`, `data-filtertube-whitelist-pending="true"`, and inline display none. If any card was hidden, it schedules a focused pending recheck.

`contentBridgeFallbackMutationObserver`: fallback-relevant selectors include video cards, rich sections, shelves, item sections, guide entries, comment threads, and chips. Added nodes with relevant content or hidden/pending markers trigger `queueWhitelistPendingHide()`, and relevant content also triggers `scheduleImmediateFallback()`. The observer now checks `hasActiveFallbackLifecycleWork()`, disconnects through `disconnectFallbackMutationObserver()` when no fallback work remains active, exposes `window.FilterTube_refreshDOMFallbackObserver`, and attaches to `document.body` or `document.documentElement`, with a once-only `DOMContentLoaded` fallback if neither exists yet.

`domFallbackOnlyWhitelistPendingSelector`: when `onlyWhitelistPending` and exact whitelist mode are both true, DOM fallback narrows video elements to `${VIDEO_CARD_SELECTORS}[data-filtertube-whitelist-pending="true"]`; otherwise it scans all `VIDEO_CARD_SELECTORS`.

`domFallbackWhitelistPendingStateReset`: pending whitelist nodes that were already processed have `data-filtertube-processed` and `data-filtertube-last-processed-id` removed and cached channel metadata cleared, forcing re-evaluation.

`domFallbackWhitelistPendingIdentityHide`: whitelist watch right-rail cards with filter matches but no card identity and no card text receive `data-filtertube-whitelist-pending="true"` and have `filtertube-hidden-shelf` removed.

`domFallbackOnlyWhitelistPendingReturn`: a focused pending recheck in whitelist mode returns immediately after card processing, before later survey, chip, Shorts shelf, duplicate item, and other broad passes.

## Runtime Fixtures

runtime content bridge whitelist pending refresh fixtures: 9

- Whitelist pending recheck currently coalesces to one timer and calls DOM fallback with `preserveScroll: true` plus `onlyWhitelistPending: true`.
- Pending hide application currently hides unprocessed whitelist candidates outside excluded routes with `filtertube-hidden`, `data-filtertube-hidden`, `data-filtertube-whitelist-pending`, inline display none, and a prefetch request.
- Pending hide application currently skips blocklist mode, home/search/feed-channels/watch routes, selected playlist rows, already processed nodes, already pending nodes, and already hidden nodes.
- Pending hide queue currently collects direct or nested video-card candidates from admitted added mutation nodes, ignores script/style/link/svg/path nodes, dedupes object references, caps the queue at 160, and coalesces work behind one timer.
- Pending hide queue now rejects blocklist mode and excluded routes (`/`, `/results`, `/feed/channels`, and `/watch`) before candidate collection, nested selector traversal, and pending-hide timer arming.
- Nested added containers now avoid `querySelector()` and `querySelectorAll()` when mode, route, or candidate budget makes pending-hide application a no-op.
- A full pending-hide candidate queue now returns before nested traversal and does not arm a new pending-hide timer from the already-full queue.
- Fallback mutation observation currently queues pending hide for any added-node batch and schedules an immediate fallback only when added nodes look fallback-relevant.
- DOM fallback currently restricts `onlyWhitelistPending` work to pending whitelist cards, clears processed state on pending cards, and returns before later broad passes.

## Release Regression Triage - 2026-05-25

The reported YouTube SPA slowdown was consistent with the previous
whitelist-pending queue shape: selector traversal could run before blocklist,
route, or candidate-budget no-op gates. The current narrow patch moves those
cheap mode, route, and cap decisions into `queueWhitelistPendingHide()` before
nested `VIDEO_CARD_SELECTORS` traversal.

This means the first release optimization target is no longer the cache itself;
the queue now avoids the proven no-op selector work while preserving admitted
whitelist pending-hide behavior and apply-time parity. The fallback
MutationObserver and fallback relevance scan are otherwise unchanged, so this
does not claim a broader observer/cache optimization.

## Release Optimization Acceptance Gate

release whitelist-pending intake gate rows: 10

The first safe optimization patch is now implemented as direct no-work gates
inside `queueWhitelistPendingHide()`, before candidate collection, not as
another cache layer. The implementation uses the existing queue owner rather
than introducing a first-class `shouldRunWhitelistPendingIntake()` symbol.

| Gate row | Required decision before candidate collection | Release risk covered |
| --- | --- | --- |
| `WL-INTAKE-00-native-overlay-quiet` | Reject immediately while native overlay or fullscreen quiet mode is active. | Prevents hidden background observer work while a native overlay owns the viewport. |
| `WL-INTAKE-01-blocklist-mode` | Reject immediately when `currentSettings.listMode !== 'whitelist'`. | Fixes the proven blocklist no-op work path. |
| `WL-INTAKE-02-empty-whitelist-fail-close` | Treat empty whitelist mode as eligible on admitted routes until an explicit empty-whitelist policy changes. | Avoids turning a performance patch into a whitelist leak. |
| `WL-INTAKE-03-whitelist-rules-admitted-route` | Admit whitelist mode on eligible non-excluded routes with allow rules. | Preserves temporary false-hide protection where it is currently intentional. |
| `WL-INTAKE-04-route-exclusions` | Reject `/`, `/results`, `/feed/channels`, and `/watch` before candidate collection. | Fixes the proven route no-op work path without changing current apply exclusions. |
| `WL-INTAKE-05-remove-only-mutations` | Reject mutation batches with no added nodes. | Keeps remove-only SPA churn out of pending-hide work. |
| `WL-INTAKE-06-resource-only-added-nodes` | Reject script/style/link/svg/path-only additions before selector traversal. | Avoids selector work for non-card resource churn. |
| `WL-INTAKE-07-nested-card-container` | Admit added containers only when they can contain a video-card candidate. | Preserves current nested-card protection on subscription-like surfaces. |
| `WL-INTAKE-08-candidate-cap-exhaustion` | Stop candidate collection when the queue is already at the cap and do no further nested scans. | Prevents the cap from still allowing expensive selector traversal. |
| `WL-INTAKE-09-current-behavior-parity` | For admitted cases, keep the current pending hide, prefetch, and focused recheck behavior unchanged. | Prevents a no-work optimization from changing whitelist false-hide/leak semantics. |

The release gate is implemented without new product authority symbols. No
`whitelistPendingIntakeReleaseGate`, `shouldRunWhitelistPendingIntake`,
`whitelistPendingIntakeNoWorkBudget`, `whitelistPendingIntakeRoutePolicy`,
`whitelistPendingIntakeMutationBudget`, or
`whitelistPendingIntakeParityReport` exists in product runtime source yet.

## Whitelist Pending Intake No-Work Contract Addendum

`docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25.md`
and
`tests/runtime/whitelist-pending-intake-no-work-contract-current-behavior.test.mjs`
define the current contract for the narrow pending-intake no-work checks that
address the reported SPA slowdown. The addendum pins 12 contract
rows, 10 release whitelist-pending intake gate rows covered, 9 current runtime
fixtures covered, 1 narrow implementation-ready whitelist pending intake row, 0
runtime whitelist pending intake authority symbols, and narrow runtime behavior
changed: yes. It keeps broad whitelist optimization at NO-GO while focused fixtures prove
blocklist, route-excluded, remove-only, resource-only, cap-exhausted, empty
whitelist, admitted nested-card, timer, and apply parity behavior.

## Whitelist Pending Intake Implementation Readiness Gate Addendum

`docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-25.md`
extends the no-work contract into a scoped preparation gate with narrow runtime
behavior changed. It pins 14 implementation readiness rows, allows preparing a
narrow pending-intake patch, and keeps `runtime whitelist pending intake patch
in this audit slice: GO`, broad whitelist optimization, cache behavior,
JSON-first behavior, release package changes, and public claims at NO-GO.

## Whitelist Pending Intake Patch Source Locus Boundary Addendum

`docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_PATCH_SOURCE_LOCUS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md`
pins the reported SPA slowdown to the pending-hide intake source locus in
`js/content_bridge.js`. The addendum records 12 source-locus rows, 1 allowed
runtime source file family, `js/content_bridge.js` as the only allowed runtime
file, 4 read-only parity runtime source loci, 8 forbidden runtime source
families, 1 narrow implementation-ready whitelist pending intake row, `patch source
locus approval: GO`, and `runtime whitelist pending intake patch in this
audit slice: GO`. It does not approve changes to apply semantics, DOM
fallback, JSON filtering, cache behavior, selected-row policy, native sync,
release packaging, or public claims.

## Risk Boundary

This queue deliberately creates a temporary false-hide state while identity is pending. That can reduce leaks in whitelist mode, but it also means any future JSON-first shortcut must prove when the temporary state is safe, when it is cleared, and how many observer/timer/rerun passes it can create.

The current route exclusions also mean the same whitelist-pending concept is handled differently across home, search, feed/channels, watch, right rail, playlist rows, and generic surfaces. An optimization that treats whitelist pending as a global rule could either leak unreviewed cards or hide route scaffolding that is currently excluded.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this whitelist surface can support runtime
optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
narrow runtime behavior changed: yes
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.

## Future Proof Still Missing

This file does not close the implementation gate. Content bridge whitelist pending refresh still needs:

- a whitelist pending refresh contract;
- pending hide queue and candidate budget reports;
- placeholder hide policy by route and renderer;
- observer and timer ownership reports;
- route exclusion policy for home, search, feed/channels, watch, right rail, and playlist rows;
- DOM fallback focused-rerun parity proof;
- whitelist pending intake no-work policy;
- settings revision and dirty-key policies;
- metric artifacts for mutation volume, queued candidates, hidden placeholders, reruns, and cleanup latency;
- fixture provenance for pending identity, selected playlist rows, nested card containers, and route exclusions.

No `contentBridgeWhitelistPendingRefreshContract`, `contentBridgeWhitelistPendingRefreshReport`, `whitelistPendingHideQueueBudget`, `whitelistPendingPlaceholderPolicy`, `whitelistPendingObserverOwnerReport`, `whitelistPendingRouteExclusionPolicy`, `whitelistPendingRerunBudgetReport`, `whitelistPendingDomFallbackConsumerParity`, `whitelistPendingFixtureProvenance`, or `whitelistPendingMetricArtifact` exists in product runtime source yet.

## Revalidation - 2026-10-18

Source fingerprints and bounded extraction inventories were refreshed against the current checkout after source review. These are drift detectors, not exhaustive semantic proof, installed-browser evidence, or approval of the broader missing-authority gates. Executable fixtures below remain the behavior checks.


## Advert startup and selector revalidation - 2026-10-22

The opening runtime-change statement describes this slice's historical
whitelist intake optimization. The current source fingerprint tables include
separate advert corrections: `needsMainWorldRuntimeWork()` now admits an
enabled profile whose only active setting is `hideSponsoredCards`, and the
shared content-control stylesheet includes exact mobile ad-slot, promoted-video,
and video-masthead-ad selectors. The Disabled and managed-route-denial guards
remain ahead of advert startup. These changes do not grant a general masthead
or organic-card hide rule.

All nine selected whitelist source/effect blocks retain their previous bytes,
lengths and SHA-256 values; only their source line anchors moved. The whitelist
queue, coalescing, route exclusion, identity reset, focused rerun and observer
assertions remain unchanged. Source pins were recalculated from the current
files rather than treating stale line numbers as a behavior contract.

The separate advert behavior fixtures are
`tests/runtime/advert-runtime-startup.test.mjs` and
`tests/runtime/advert-content-interception.test.mjs`. They do not replace this
slice's whitelist fixtures. This inventory refresh changes no product runtime,
provides no installed-browser or physical-device acceptance, and closes none of
the missing-authority gates above.


## Opt-In Playback Hook Source Revalidation - 2026-10-22

The current fallback initializer adds two opt-in playback initialization/refresh calls; direct/category route guards add invalidation hooks. These change the initializer block bytes and subsequent source anchors while the other eight whitelist blocks retain their exact bytes. All whitelist token, no-work and executable intake assertions remain unchanged. The older source measurements above remain historical; this pin refresh neither authorizes page media nor proves installed playback.

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 15,056 | 678,414 | `9e0bca2973ffb01d0216ea8b096531ad3c1afe7af4acc7363fa4b1cc2ca09f18` |
| `js/content/dom_fallback.js` | 8,180 | 381,121 | `121f71b40a27024636d448cd5b5de0f1e9a33e3e4e118377f1b07c20e52eb49d` |

| Block | Source | Start line | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| `contentBridgeRightRailWhitelistObserver` | `js/content_bridge.js:1438` | 1,438 | 98 | 3,094 | `f657ce4b4b8ba815a4149d3508ebec0445450bf49c74478c0e2169da4c679bc4` |
| `contentBridgeInitializeFallbackThrottle` | `js/content_bridge.js:7142` | 7,142 | 257 | 12,748 | `ee1f260f090adeea22e50c42a62df41bfe23402eabf2178bea4ebeac0bfda2bc` |
| `contentBridgeWhitelistPendingQueue` | `js/content_bridge.js:7399` | 7,399 | 70 | 4,159 | `3181b672c5d3a1a558baa5b0dbb175c05f7d966b908b835ae7c216ebc7eaa86b` |
| `contentBridgeWhitelistPendingApply` | `js/content_bridge.js:7469` | 7,469 | 112 | 5,829 | `2ff0a4ef33bdaf0acde1b27bf31d8d026f675702adae2bbc03692c213c266ad8` |
| `contentBridgeFallbackMutationObserver` | `js/content_bridge.js:7581` | 7,581 | 217 | 9,542 | `644e542cd718856d5a3d447c3ecce919cf66cbad4bb0373efc61da62b3df09b9` |
| `domFallbackOnlyWhitelistPendingSelector` | `js/content/dom_fallback.js:5411` | 5,411 | 19 | 950 | `7235b5ea6e0689ab98e3e2e21e02e37d95b52675bc16a7c5bffa56b50c905894` |
| `domFallbackWhitelistPendingStateReset` | `js/content/dom_fallback.js:5674` | 5,674 | 74 | 4,342 | `7f374fecc191fc37bbef5af4e05b040ff3b3b2e0585baec5f8036b1d4f4c7c6f` |
| `domFallbackWhitelistPendingIdentityHide` | `js/content/dom_fallback.js:6957` | 6,957 | 16 | 993 | `2352973b418feb0a4da5f8b71c11940d6a0292b6bdb5db511262db89889c1f17` |
| `domFallbackOnlyWhitelistPendingReturn` | `js/content/dom_fallback.js:7252` | 7,252 | 4 | 83 | `438296f1dbec1d892317f6177e74323886b6830fd0697eb1b1c12e4779776ad0` |
