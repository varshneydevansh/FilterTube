# FilterTube Seed Method Semantic Register - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/seed.js` from representative page-global transport
tokens to a source-derived method and callback inventory. The seed runtime owns
document-start idempotency, `ytInitial*` page globals, fetch/XHR interception,
pending replay, settings relay, and the `window.filterTube` bridge object.

This is not completion proof for every inline array predicate callback, every
JSON field path, every endpoint effect, or every repository method. It is the
current-behavior boundary for the seed page-global transport file.

## Source-Derived Summary

```text
source file: js/seed.js
runtime owner: main-world seed runtime
global interface: window.filterTube
split source lines: 1137
wc line count: 1136
source bytes: 50026
source sha256: a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d
broad lexical matches: 92
method and callback rows: 43
accepted declaration/inventory rows: 43
semantic method rows promoted: 43
top-level function declarations: 21
local helper functions: 6
page/prototype patch functions: 5
property accessor functions: 6
timer callbacks: 1
local wrapped-listener callbacks: 1
global object methods: 1
bootstrap entrypoints: 2
semantic method groups: 8
control-flow lexical artifacts: 58
file-local executable proof probes: 7
runtime behavior changed: no
```

## Method Group Counts

```text
bootstrapAndIdempotency: 2
debugAndCloneHelpers: 4
engineDispatchAndNoWorkBoundary: 10
fetchInterception: 3
initialDataHooksAndAccessors: 5
settingsRelayAndGlobalInterface: 2
snapshotAndReplayQueue: 5
xhrInterception: 12
```

## Broad Lexical Reconciliation

The repo-wide callable parser intentionally over-counts `js/seed.js` because it
is a broad lexical scanner rather than an AST authority. This register reconciles
that scan to semantic rows before any runtime optimization or JSON-first
promotion can rely on seed behavior.

```text
broad parser source matches: 92
broad source names promoted or expanded: 34
semantic rows added from bootstrap/timer/page-patch context: 9
semantic method rows promoted: 43
rejected broad parser artifacts: 58
rejected `if` artifacts: 53
rejected `for` artifacts: 5
runtime behavior changed: no
```

The 34 broad source names are the 21 top-level functions, one lexical
initializer, five local helper function tokens, six accessor tokens, and the
`getStats` object method. The semantic inventory adds the IIFE bootstrap row,
the replay timer callback, the wrapped listener callback, the `processIfReady`
local function expression, and five page/prototype patch assignments that the
broad regex does not name directly. Those additions are audit rows, not product
source changes.

## Current Method And Callback Inventory

| Source line | Scope | Method or callback | Semantic group |
| --- | --- | --- | --- |
| 4 | `bootstrapEntrypoint` | `seedIifeEntrypoint` | `bootstrapAndIdempotency` |
| 25 | `bootstrapEntrypoint` | `filterTubeSeedDebugEnabled.initializer` | `bootstrapAndIdempotency` |
| 43 | `topLevelFunction` | `stashNetworkSnapshot` | `snapshotAndReplayQueue` |
| 100 | `topLevelFunction` | `replayPendingQueueIfReady` | `snapshotAndReplayQueue` |
| 129 | `topLevelFunction` | `scheduleReplay` | `snapshotAndReplayQueue` |
| 131 | `timerCallback` | `replayTimer.setTimeout` | `snapshotAndReplayQueue` |
| 139 | `topLevelFunction` | `isSeedDebugEnabled` | `debugAndCloneHelpers` |
| 150 | `topLevelFunction` | `seedDebugLog` | `debugAndCloneHelpers` |
| 180 | `topLevelFunction` | `cloneData` | `debugAndCloneHelpers` |
| 197 | `topLevelFunction` | `hasList` | `engineDispatchAndNoWorkBoundary` |
| 201 | `topLevelFunction` | `hasEnabledContentFilters` | `engineDispatchAndNoWorkBoundary` |
| 213 | `topLevelFunction` | `hasSelectedCategoryFilters` | `engineDispatchAndNoWorkBoundary` |
| 220 | `topLevelFunction` | `hasActiveJsonFilterRules` | `engineDispatchAndNoWorkBoundary` |
| 234 | `topLevelFunction` | `hasNetworkJsonWork` | `engineDispatchAndNoWorkBoundary` |
| 240 | `topLevelFunction` | `shouldCaptureRawSnapshot` | `snapshotAndReplayQueue` |
| 244 | `topLevelFunction` | `getDebugPayloadSize` | `debugAndCloneHelpers` |
| 253 | `topLevelFunction` | `shouldBypassYouTubeiNetworkResponse` | `engineDispatchAndNoWorkBoundary` |
| 263 | `topLevelFunction` | `shouldSkipEngineProcessing` | `engineDispatchAndNoWorkBoundary` |
| 383 | `topLevelFunction` | `processWithEngine` | `engineDispatchAndNoWorkBoundary` |
| 389 | `localHelperFunction` | `queueForLater` | `engineDispatchAndNoWorkBoundary` |
| 490 | `topLevelFunction` | `basicProcessing` | `engineDispatchAndNoWorkBoundary` |
| 549 | `topLevelFunction` | `establishDataHooks` | `initialDataHooksAndAccessors` |
| 580 | `propertyAccessorFunction` | `ytInitialData.get` | `initialDataHooksAndAccessors` |
| 583 | `propertyAccessorFunction` | `ytInitialData.set` | `initialDataHooksAndAccessors` |
| 629 | `propertyAccessorFunction` | `ytInitialPlayerResponse.get` | `initialDataHooksAndAccessors` |
| 632 | `propertyAccessorFunction` | `ytInitialPlayerResponse.set` | `initialDataHooksAndAccessors` |
| 666 | `topLevelFunction` | `setupFetchInterception` | `fetchInterception` |
| 675 | `localHelperFunction` | `getPathname` | `fetchInterception` |
| 685 | `pagePatchFunction` | `window.fetch` | `fetchInterception` |
| 757 | `topLevelFunction` | `setupXhrInterception` | `xhrInterception` |
| 779 | `localHelperFunction` | `getPathname` | `xhrInterception` |
| 790 | `localHelperFunction` | `getWrappedListener` | `xhrInterception` |
| 800 | `localCallbackFunction` | `getWrappedListener.wrapped` | `xhrInterception` |
| 813 | `localHelperFunction` | `ensureXhrResponseProcessed` | `xhrInterception` |
| 865 | `propertyAccessorFunction` | `XMLHttpRequest.response.get` | `xhrInterception` |
| 880 | `propertyAccessorFunction` | `XMLHttpRequest.responseText.get` | `xhrInterception` |
| 899 | `pagePatchFunction` | `XMLHttpRequest.prototype.addEventListener` | `xhrInterception` |
| 912 | `pagePatchFunction` | `XMLHttpRequest.prototype.removeEventListener` | `xhrInterception` |
| 924 | `pagePatchFunction` | `XMLHttpRequest.prototype.open` | `xhrInterception` |
| 940 | `pagePatchFunction` | `XMLHttpRequest.prototype.send` | `xhrInterception` |
| 953 | `localHelperFunction` | `processIfReady` | `xhrInterception` |
| 983 | `topLevelFunction` | `updateSettings` | `settingsRelayAndGlobalInterface` |
| 1099 | `globalObjectMethod` | `window.filterTube.getStats` | `settingsRelayAndGlobalInterface` |

## Current Behavior Boundaries

- `window.filterTubeSeedHasRun` and `window.ftSeedInitialized` are page-global
  flags, not a teardown registry. The fetch/XHR patches are page-lifetime work.
- `scheduleReplay()` owns the only seed `setTimeout()` callback. There is no
  seed `setInterval()` or `MutationObserver()` in current source.
- `stashNetworkSnapshot()` clones successful results into `window.filterTube`
  raw/last fields; snapshot size is capped by queue trimming, not by one shared
  transport budget.
- `setupFetchInterception()` fetch interception checks the no-work bypass before cloning and
  parsing matching endpoint bodies; missing settings and empty blocklist mode
  now return the original fetch response without seed queue, harvest, or stash
  work.
- `shouldSkipEngineProcessing()` can skip mutation for search/home/channel
  surfaces while still attempting `FilterTubeEngine.harvestOnly()`, so no-rule
  and harvest-only behavior are separate effect classes.
- `establishDataHooks()` installs `Object.defineProperty()` accessors for
  `ytInitialData` and `ytInitialPlayerResponse`; settings replay can reassign
  these globals through the installed setters.
- `setupFetchInterception()` replaces `window.fetch`, clones matching YouTubei
  responses, parses JSON, can synthesize an empty comment continuation response,
  and writes a new `Response(JSON.stringify(...))`.
- `setupXhrInterception()` keeps the prototype patches page-lifetime, but XHR
  marking is gated by the same no-work bypass before ready/load hooks or
  response processing are armed. When armed, it wraps `addEventListener()` /
  `removeEventListener()`, installs `response` and `responseText` accessors on
  individual XHR objects, and rewrites parsed JSON only after
  ready-state/status/type gates pass.
- `updateSettings()` replays queued blobs and reprocesses stored raw snapshots;
  it is a settings relay plus replay owner, not a general revision authority.
- `window.dispatchEvent(new CustomEvent('filterTubeSeedReady', ...))` publishes
  readiness, but this register does not certify a page-message sender contract.

## Executable Current-Behavior Proof

The current proof uses a VM seed-runtime harness against the unmodified
`js/seed.js` source.

| Probe | Current executable proof | Risk boundary |
| --- | --- | --- |
| ready dispatch executable proof: seed load sets idempotency flags and emits one ready event | Loading `js/seed.js` sets `window.filterTubeSeedHasRun = true`, sets `window.ftSeedInitialized = true`, creates `window.filterTube`, and dispatches `filterTubeSeedReady`. | No teardown owner or multi-frame readiness authority exists. |
| missing-settings executable proof: matching fetch bypasses cloning and queue work before engine calls | A matching `/youtubei/v1/search` fetch before settings are loaded returns the original payload body, queues no item, and calls neither `processData` nor `harvestOnly`. | The optimized no-settings path is now a pre-parse pass-through branch. |
| empty-blocklist executable proof: search no-work bypass performs no harvest or stash work | On `/results` with enabled blocklist mode and no active JSON rules, a matching search fetch returns the original payload body, calls neither `FilterTubeEngine.harvestOnly` nor `processData`, and does not write `lastYtSearchResponseName`. | Empty blocklist no-work now avoids fetch body work, while active-rule paths still process. |
| active-rule executable proof: matching browse fetch calls processData and stashes processed output | With an active keyword rule, a matching browse fetch calls `processData` with `fetch:/youtubei/v1/browse`, returns the processed response body, and stashes the processed browse snapshot. | The fetch path rebuilds the body and snapshot from engine output. |
| hide-all-comments executable proof: append comment continuation returns synthetic end marker before engine | With `hideAllComments`, an append comment continuation on `/youtubei/v1/next` returns one synthetic `continuationItemRenderer` end marker and calls no engine method. | The shortcut can bypass generic engine sibling handling. |
| ytInitialData setter executable proof: accessor processes assignment and updates last snapshot | After settings load, assigning `window.ytInitialData` invokes `processData` with `ytInitialData`, stores the processed value behind the getter, and updates `window.filterTube.lastYtInitialData`. | Setter replay remains a page-global side effect, not a revisioned settings authority. |
| XHR no-work executable proof: open does not mark matching YouTubei URLs when disabled | After disabled settings load, `XMLHttpRequest.prototype.open()` sets `__filtertube_shouldProcessXhr = false` and resets `__filtertube_responseProcessed = false` for matching `/youtubei/v1/player` URLs. | Disabled mode now avoids per-request XHR processing marks, while prototype patches remain page-lifetime. |

## Future Seed Proof Fields

Any future behavior change in this file needs rows with at least:

```text
methodReference
sourceLine
semanticGroup
ownerRuntime
callerClass
installTrigger
routeOrEndpoint
settingsModeInput
profileInput
listModeInput
jsonSource
identitySourceTier
observableSideEffects
endpointBodyWork
harvestOnlyBehavior
disabledBehavior
noRuleBehavior
emptyListBehavior
queueOrReplayBoundary
teardownOrPatchOwner
positiveFixture
disabledFixture
noRuleFixture
negativeSiblingFixture
performanceBudget
fixtureProvenance
```

## Missing Runtime Authorities

No runtime source currently implements:

- `seedMethodAuthority`
- `seedMethodEffectReport`
- `seedNoWorkBudget`
- `seedTransportPatchOwner`
- `seedReplayQueueBudget`
- `seedAccessorContract`
- `seedPageGlobalFixtureProvenance`

These are future contract names. This register does not authorize endpoint
optimization, fetch/XHR patch cleanup, JSON mutation changes, settings replay
changes, `ytInitial*` hook changes, harvest pruning, or lifecycle teardown.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this method semantic register can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
