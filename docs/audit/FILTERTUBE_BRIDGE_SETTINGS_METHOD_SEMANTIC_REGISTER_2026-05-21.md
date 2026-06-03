# FilterTube Bridge Settings Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/content/bridge_settings.js` from callable-count and
settings-refresh evidence to a source-derived method inventory. It covers the
isolated-world settings bridge that waits for main-world injector readiness,
requests subscribed-channel import work, receives injector import progress and
responses, handles runtime refresh/apply/import/ping actions, fetches compiled
settings from background, forwards settings to the injector and seed runtime,
and schedules storage-triggered DOM fallback refreshes.

This is not completion proof for settings revision authority, sender trust,
subscription import capability tokens, storage-key parity, no-rule budgets,
profile/list-mode negative fixtures, seed retry dedupe, DOM fallback rerun
policy, listener teardown, or future simultaneous allow/block semantics. It is
a current-behavior boundary before bridge settings, import relay, storage
refresh, runtime message, seed relay, or page-message trust changes.

## Source-Derived Summary

```text
source file: js/content/bridge_settings.js
line count: 651
source bytes: 26462
source sha256: c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b
repo-wide broad parser lexical callable matches: 65
broad parser runtime callable/declaration matches: 23
assignment-expression function declarations outside broad parser: 1
control-flow lexical artifacts: 42
file-local executable proof probes: 5
global method proof count promoted: 0
named method/helper/callback declarations in scope: 24
plain function declarations: 13
named function expression declarations: 1
const helper/callback declarations: 10
const arrow helper/callback declarations: 5
const IIFE result declarations: 5
async function declarations: 0
async const arrow declarations: 0
arrow callback sites in scope: 39
semantic method groups: 7
document literal occurrences: 5
window literal occurrences: 61
location literal occurrences: 6
globalThis literal occurrences: 3
browserAPI_BRIDGE references: 9
currentSettings references: 2
latestSettings references: 1
pendingSubscriptionImportRequests references: 10
subscriptionImportRequestId references: 4
__filtertubeMainWorldImportBridgeReady references: 5
__filtertubeMainWorldSubscriptionsImportReady references: 5
__filtertubeMainWorldBridgeWaiters references: 8
__filtertubeMainWorldImportCapabilityWaiters references: 8
FilterTubeRequestSubscribedChannelsFromMainWorld references: 3
FilterTube_RequestSubscriptionImport references: 1
FilterTube_SubscriptionsImportProgress references: 2
FilterTube_SubscriptionsImportResponse references: 1
FilterTube_InjectorBridgeReady references: 1
FilterTube_InjectorToBridge_Ready references: 1
FilterTube_SubscriptionsImportBridgeReady references: 1
FilterTube_Ping references: 1
FilterTube_RefreshNow references: 1
FilterTube_ImportSubscribedChannels references: 1
FilterTube_ApplySettings references: 1
FilterTube_SettingsToInjector references: 1
getCompiledSettings references: 2
filterTubeSeedReady references: 1
window.addEventListener calls: 2
removeEventListener calls: 0
browserAPI_BRIDGE.runtime.onMessage.addListener calls: 1
browserAPI_BRIDGE.storage.onChanged.addListener calls: 1
setTimeout calls: 6
clearTimeout calls: 2
setInterval calls: 0
clearInterval calls: 0
MutationObserver references: 0
observe calls: 0
disconnect calls: 0
postMessage calls: 2
wildcard postMessage target calls: 2
browserAPI_BRIDGE.runtime.sendMessage calls: 2
sendMessage token occurrences: 3
applyDOMFallback references: 6
injectMainWorldScripts references: 4
refreshRuntimeObserversAfterSettingsUpdate references: 4
refreshFilterTubeRuntimeObservers references: 2
FilterTube_refreshRuntimeObservers references: 2
FilterTube_refreshQuickBlockAvailability references: 2
FilterTube_refreshDOMFallbackObserver references: 2
schedulePrefetchScan references: 2
normalizeSettingsForHost references: 5
requestSettingsFromBackground references: 5
sendSettingsToMainWorld references: 5
tryApplySettingsToSeed references: 4
scheduleSeedRetry references: 3
scheduleSettingsRefreshFromStorage references: 2
handleStorageChanges references: 2
Date.now references: 2
parseInt references: 4
isFinite references: 1
new Map references: 1
new Set references: 4
Promise.resolve references: 2
new Promise references: 4
console.warn references: 3
console.log references: 3
debugLog references: 4
document.documentElement references: 2
getAttribute references: 2
Object.keys references: 2
Array.isArray references: 6
Math.max references: 7
Math.min references: 4
MIN_STORAGE_REFRESH_INTERVAL_MS references: 3
forceRefresh references: 6
profileType references: 11
whitelist token occurrences: 18
blocklist token occurrences: 4
videoChannelMap token occurrences: 2
videoMetaMap token occurrences: 2
channelMap token occurrences: 2
browser/global export: globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld
CommonJS export: none
runtime behavior changed: no
```

## Method Group Counts

```text
bridgeSettingsBackgroundFetchAndDebug: 6
bridgeSettingsHostNormalization: 2
bridgeSettingsImportReadinessWaiters: 6
bridgeSettingsRuntimeActionProfileGate: 1
bridgeSettingsSeedRelayLifecycle: 5
bridgeSettingsStorageRefreshFanout: 2
bridgeSettingsSubscriptionImportRequest: 2
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `bridgeSettingsImportReadinessWaiters` | 6 | Maintains main-world bridge/import readiness booleans and waiter sets, resolves waiters, and times waits out with `setTimeout(..., Math.max(250, timeoutMs))`. | Capability token, duplicate-ready idempotence, timeout reason reporting, per-tab ownership, teardown, and negative spoof fixtures. |
| `bridgeSettingsSubscriptionImportRequest` | 2 | Exposes `globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld`, clamps import options, tracks pending requests in `window.pendingSubscriptionImportRequests`, posts `FilterTube_RequestSubscriptionImport` with wildcard target, and resolves timeout failures. | User-action token, request capability, bounded work budget, progress/retry provenance, wildcard target policy, and stale request cleanup proof. |
| `bridgeSettingsRuntimeActionProfileGate` | 1 | Computes the expected profile for `FilterTube_ApplySettings` from `location.hostname` and falls back to storage-derived refresh when caller profile does not match host. | Sender class, profile authority, locked-profile/session proof, revision ownership, Kids/YTM route fixtures, and stale caller payload negatives. |
| `bridgeSettingsHostNormalization` | 2 | On Kids host, converts empty whitelist-mode Main settings to blocklist mode and can emit debug warnings from `window.__filtertubeDebug` or `data-filtertube-debug`. | Explicit fail-open policy authority, list-mode transition report, content-control parity, future allow/block semantics, and profile-specific fixtures. |
| `bridgeSettingsBackgroundFetchAndDebug` | 6 | Sends `getCompiledSettings` to background with host-derived `profileType`, retries with `forceRefresh` on profile mismatch, normalizes the response, forwards it to main world, and logs debug counts. | Background-owned revision, cache freshness, sender trust, dependency-key parity, no-op equivalent settings proof, and runtime debug privacy policy. |
| `bridgeSettingsSeedRelayLifecycle` | 5 | Writes `latestSettings` and `currentSettings`, posts `FilterTube_SettingsToInjector` with wildcard target, applies settings directly to `window.filterTube.updateSettings`, waits for `filterTubeSeedReady`, retries every 250ms, and refreshes runtime observers after settings delivery. | One-seed-apply-per-revision proof, retry cap, listener teardown, page-global patch ownership, queued snapshot provenance, observer refresh ownership, and duplicate apply metrics. |
| `bridgeSettingsStorageRefreshFanout` | 2 | Throttles storage refreshes with `MIN_STORAGE_REFRESH_INTERVAL_MS`, ignores `channelMap`-only writes, treats `videoChannelMap` and `videoMetaMap` as no-force reprocess refreshes, and watches a local relevant-key list. | Shared storage dependency manifest, map-only refresh policy, no-rule budget, stale key drift proof, and route/profile/list-mode negative fixtures. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 34 | `function` | `markMainWorldImportBridgeReady` | `bridgeSettingsImportReadinessWaiters` |
| 46 | `function` | `markMainWorldSubscriptionsImportReady` | `bridgeSettingsImportReadinessWaiters` |
| 58 | `function` | `waitForMainWorldImportBridgeReady` | `bridgeSettingsImportReadinessWaiters` |
| 69 | `constArrow` | `finish` | `bridgeSettingsImportReadinessWaiters` |
| 81 | `function` | `waitForMainWorldSubscriptionsImportReady` | `bridgeSettingsImportReadinessWaiters` |
| 92 | `constArrow` | `finish` | `bridgeSettingsImportReadinessWaiters` |
| 105 | `functionExpression` | `requestSubscribedChannelsFromMainWorld` | `bridgeSettingsSubscriptionImportRequest` |
| 112 | `constArrow` | `armTimeout` | `bridgeSettingsSubscriptionImportRequest` |
| 286 | `constIifeResult` | `expectedProfile` | `bridgeSettingsRuntimeActionProfileGate` |
| 322 | `function` | `normalizeSettingsForHost` | `bridgeSettingsHostNormalization` |
| 336 | `constIifeResult` | `debugEnabled` | `bridgeSettingsHostNormalization` |
| 353 | `function` | `requestSettingsFromBackground` | `bridgeSettingsBackgroundFetchAndDebug` |
| 355 | `constArrow` | `safeResolveFailure` | `bridgeSettingsBackgroundFetchAndDebug` |
| 358 | `constArrow` | `sendRuntimeMessage` | `bridgeSettingsBackgroundFetchAndDebug` |
| 379 | `constIifeResult` | `profileType` | `bridgeSettingsBackgroundFetchAndDebug` |
| 416 | `constIifeResult` | `debugEnabled` | `bridgeSettingsBackgroundFetchAndDebug` |
| 425 | `constIifeResult` | `host` | `bridgeSettingsBackgroundFetchAndDebug` |
| 468 | `function` | `tryApplySettingsToSeed` | `bridgeSettingsSeedRelayLifecycle` |
| 481 | `function` | `ensureSeedReadyListener` | `bridgeSettingsSeedRelayLifecycle` |
| 491 | `function` | `scheduleSeedRetry` | `bridgeSettingsSeedRelayLifecycle` |
| 501 | `function` | `sendSettingsToMainWorld` | `bridgeSettingsSeedRelayLifecycle` |
| 524 | `function` | `refreshRuntimeObserversAfterSettingsUpdate` | `bridgeSettingsSeedRelayLifecycle` |
| 557 | `function` | `scheduleSettingsRefreshFromStorage` | `bridgeSettingsStorageRefreshFanout` |
| 589 | `function` | `handleStorageChanges` | `bridgeSettingsStorageRefreshFanout` |

## Lexical Callable Reconciliation

The repo-wide callable parser intentionally uses a broad JavaScript regex so it
can catch top-level declarations, object-method shorthand, and generated output
without requiring a full parser. For `js/content/bridge_settings.js`, that
broad parser currently reports 65 lexical callable matches:

| Broad parser class | Count | Runtime callable? | Semantic interpretation |
| --- | ---: | --- | --- |
| Plain function declarations | 13 | yes | The parser captures each top-level `function` declaration in this file. These are the bridge waiters, host normalization, settings fetch, seed relay, runtime observer refresh, and storage refresh helpers listed in the inventory. |
| Const arrow/IIFE helpers | 10 | yes | The parser captures `finish` twice, `armTimeout`, `safeResolveFailure`, `sendRuntimeMessage`, and the five IIFE result helpers `expectedProfile`, `debugEnabled` twice, `profileType`, and `host`. |
| Assignment function expression | 1 | yes, outside broad parser | `globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld = function requestSubscribedChannelsFromMainWorld(...)` is a real exported helper, but the broad parser does not count assignment-expression function declarations. The method inventory covers it explicitly. |
| `if` artifacts | 42 | no | The broad method-shorthand branch misclassifies `if (...) {` control-flow lines as lexical callables. These remain part of the current 5,697 lexical count until the repo-wide proof layer has a callable-kind classifier. |

This file-local reconciliation reduces ambiguity for
`js/content/bridge_settings.js`, but it does not promote the global method
proof count. The repo-wide index still pins 0 complete per-callable semantic
files because the audit has not yet reconciled broad-parser artifacts across
all 69 tracked JS/JSX/MJS files.

## File-Local Executable Behavior Proof

The current verifier executes `js/content/bridge_settings.js` in a VM context
with stubbed `window`, `document`, timers, runtime messaging, and storage
listeners. It proves these current behaviors without changing runtime source:

| Probe | Current executable proof | Risk boundary |
| --- | --- | --- |
| Top-level bridge state and listeners | Loading the file initializes `pendingSubscriptionImportRequests`, `subscriptionImportRequestId`, main-world readiness booleans, waiter sets, one page-message listener, one runtime-message listener, and one storage listener. | Listener teardown, duplicate page lifetime ownership, and sender trust are still not proved. |
| Main-world readiness waiters | Waiting before readiness adds one waiter and arms a timeout with a minimum 250ms delay; an injector ready page message resolves waiters true and clears the set. | There is still no capability token, origin nonce, per-tab owner, or timeout reason report. |
| Subscription import request lifecycle | The exported import requester clamps timeout/channel/page-delay inputs, stores a pending request, posts `FilterTube_RequestSubscriptionImport` to `*`, re-arms timeout on progress, calls the progress callback, resolves on response, clears timers, and deletes the pending entry. | Wildcard postMessage, spoofed injector responses, stale request cleanup, and user-action capability remain future gates. |
| Host normalization and seed relay | On YouTube Kids, empty Main whitelist settings normalize to blocklist; `sendSettingsToMainWorld` writes `latestSettings`/`currentSettings`, posts `FilterTube_SettingsToInjector` to `*`, applies directly to `window.filterTube.updateSettings` when ready, or stores pending settings and schedules a 250ms retry when not ready. It also asks runtime observers, quick-block availability, DOM fallback observers, and prefetch scanning to refresh after settings delivery. | One-apply-per-revision, retry cap, page-global patch ownership, observer ownership, and duplicate apply metrics remain missing. |
| Storage refresh fanout | A `channelMap`-only local storage change is ignored; a `videoChannelMap`-only change requests forced background settings refresh but applies DOM fallback with `forceReprocess: false`; ordinary relevant keys apply with forced reprocess on the immediate path. | Shared storage dependency manifests, stale-key drift, route/profile/list-mode negative fixtures, and no-rule budgets remain missing. |

## Current Entrypoints And Dependencies

```text
module entrypoint: manifest-loaded isolated-world content script before content_bridge.js
top-level state initialization: pendingSubscriptionImportRequests Map, subscriptionImportRequestId number, main-world ready booleans, bridge waiter Sets
subscription import public entrypoint: globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld
subscription import request path: window.postMessage({ type: 'FilterTube_RequestSubscriptionImport', source: 'content_bridge' }, '*')
subscription import response listener: window.addEventListener('message', event => ...)
message source gate: event.source === window and data.source === 'injector'
recognized injector messages: FilterTube_InjectorBridgeReady, FilterTube_InjectorToBridge_Ready, FilterTube_SubscriptionsImportBridgeReady, FilterTube_SubscriptionsImportProgress, FilterTube_SubscriptionsImportResponse
runtime message listener: browserAPI_BRIDGE.runtime.onMessage.addListener((request, sender, sendResponse) => ...)
recognized runtime actions: FilterTube_Ping, FilterTube_RefreshNow, FilterTube_ImportSubscribedChannels, FilterTube_ApplySettings
background settings request: browserAPI_BRIDGE.runtime.sendMessage({ action: "getCompiledSettings", profileType, forceRefresh }, ...)
settings page-message path: window.postMessage({ type: 'FilterTube_SettingsToInjector', source: 'content_bridge' }, '*')
seed direct apply path: window.filterTube.updateSettings(settings)
seed ready listener: window.addEventListener('filterTubeSeedReady', () => ...)
seed retry path: setTimeout(..., 250) while pendingSeedSettings remains
storage listener path: browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges)
storage refresh throttle: MIN_STORAGE_REFRESH_INTERVAL_MS = 250
channelMap-only behavior: ignored
videoChannelMap/videoMetaMap behavior: request settings refresh without forced DOM reprocess
profile source: location.hostname implies kids/main
Kids empty whitelist normalization: listMode whitelist with zero whitelist channels/keywords becomes blocklist
listener teardown path: none
pending request timeout cleanup: deletes request and resolves timeout failure
settings revision gate: none
subscription import capability token: none
CommonJS export: none
```

## Future Proof Fields

Each bridge-settings method row must eventually be backed by source line,
fixture, caller path, and observed success/failure effect before settings
relay, subscription import, seed delivery, storage refresh, or runtime message
behavior changes can claim semantic coverage:

```text
methodReference
sourceLine
semanticGroup
callerSurface
routeSurface
settingsMode
listMode
profileTarget
compiledActiveState
senderClass
runtimeAction
messageAction
pageMessageType
pageMessageTarget
requestId
timeoutBudget
capabilityToken
subscriptionImportCapability
settingsRevision
profileSource
hostProfile
hostNormalizationResult
backgroundCacheSource
storageChangedKeys
storageKey
forceRefresh
forceRefreshReason
forceReprocess
seedApplyResult
seedRetryBudget
domFallbackEffect
subscriptionImportProgressEffect
subscriptionImportResponseEffect
lifecyclePrimitive
listenerOwner
timerOwner
teardownPolicy
noRuleBudget
negativeFixture
positiveFixture
sourceFamilyProvenance
```

## Missing Runtime Authorities

These names intentionally do not exist in runtime source today:

```text
bridgeSettingsMethodAuthority
bridgeSettingsMessageTrustContract
bridgeSettingsSubscriptionImportActionToken
bridgeSettingsSubscriptionImportProgressBudget
bridgeSettingsRuntimeActionSenderContract
bridgeSettingsSettingsRevisionContract
bridgeSettingsSeedRelayBudget
bridgeSettingsStorageRefreshAuthority
bridgeSettingsProfileHostContract
bridgeSettingsFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
