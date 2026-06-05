# FilterTube Subscription Import Request Lifecycle Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, subscription import
patch, JSON filter patch, or permission to change message, network, whitelist,
profile, storage, DOM, or settings behavior.

## Purpose

This slice isolates the subscribed-channel import request lifecycle across the
isolated-world settings bridge, isolated-world content bridge, main-world
injector, extension manifests, StateManager, and tab-view UI.

The boundary matters for optimization and first-class JSON filtering because the
feature is not a pure JSON reader. It combines runtime messages, page messages,
pending request maps, timeout rearming, progress relays, credentialed YouTubei
fetches, profile locks, tab activation, whitelist mutation, and UI progress
state. Any future JSON-first subscription import gate needs one explicit owner
for this lifecycle before behavior changes can be made safely.

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/bridge_settings.js` | 1113 | 44087 | `f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853` |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/tab-view.js` | 14584 | 676581 | `7f3de6750e95adb81bfdec5df53425427be86b08044a833bc0288bfe8cbe6e58` |
| `manifest.json` | 87 | 2470 | `96eb5e5c8733ecdfa9d3eb447d51a3bfc2c4743a80b1fde1f12d71bd46d1c8e4` |
| `manifest.chrome.json` | 87 | 2470 | `96eb5e5c8733ecdfa9d3eb447d51a3bfc2c4743a80b1fde1f12d71bd46d1c8e4` |
| `manifest.firefox.json` | 74 | 1994 | `5d7175c23dbce4f9e86b0db0f34b1ae61bb465a9725ff37fc7069a45d4ceac5c` |
| `manifest.opera.json` | 88 | 2475 | `f76d4a48b51fc5da65492347ce3f7cb31ebff057afd2185573176991e7d1d4b7` |

Related proof layers:

- `docs/audit/FILTERTUBE_BRIDGE_SETTINGS_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_BRIDGE_INJECTION_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_INJECTOR_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_STATE_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_TAB_VIEW_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md`

## Current Counts

```text
subscription import request lifecycle source files: 9
subscription import request lifecycle JS source files: 5
subscription import request lifecycle manifest files: 4
subscription import request lifecycle source/effect blocks: 13
bridge_settings guarded requester block lines: 40
bridge_settings guarded requester block bytes: 1938
bridge_settings subscription listener block lines: 50
bridge_settings subscription listener block bytes: 2295
bridge_settings runtime import action block lines: 52
bridge_settings runtime import action block bytes: 2614
content_bridge requester block lines: 38
content_bridge requester block bytes: 1648
content_bridge requester assignment block lines: 1
content_bridge requester assignment block bytes: 97
content_bridge message handler header block lines: 5
content_bridge message handler header block bytes: 229
content_bridge subscription progress/response block lines: 27
content_bridge subscription progress/response block bytes: 1412
injector subscription bridge install block lines: 71
injector subscription bridge install block bytes: 2766
injector fetchSubscribedChannelsFromYoutubei block lines: 450
injector fetchSubscribedChannelsFromYoutubei block bytes: 19755
StateManager fetchSubscribedChannelsFromImportTab block lines: 54
StateManager fetchSubscribedChannelsFromImportTab block bytes: 2213
StateManager importSubscribedChannelsToWhitelist block lines: 109
StateManager importSubscribedChannelsToWhitelist block bytes: 4527
tab-view startSubscribedChannelsImport block lines: 201
tab-view startSubscribedChannelsImport block bytes: 8431
tab-view runtime progress listener block lines: 22
tab-view runtime progress listener block bytes: 874
core selected FilterTube_RequestSubscriptionImport tokens: 3
core selected FilterTube_SubscriptionsImportProgress tokens: 4
core selected FilterTube_SubscriptionsImportResponse tokens: 3
core selected FilterTubeRequestSubscribedChannelsFromMainWorld tokens: 4
core selected requestId tokens: 41
core selected wildcard postMessage target callsites: 5
core selected setTimeout callsites: 5
core selected clearTimeout callsites: 6
injector fetch import fetch() callsites: 1
injector fetch import AbortController tokens: 2
runtime subscription import lifecycle fixtures: 8
runtime behavior changed: no
not completion proof for subscription import lifecycle authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Current risk boundary | Missing proof before implementation |
| --- | --- | --- | --- |
| Manifest load order | All four manifests load `js/content/bridge_settings.js` before `js/content_bridge.js`. | Load order makes the guarded bridge-settings requester a temporary definition that can be replaced later by the content bridge. | Manifest load-order report with browser-specific content-script execution proof. |
| Requester ownership | `bridge_settings.js` defines `globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld` only when no function exists; `content_bridge.js` later assigns `window.FilterTubeRequestSubscribedChannelsFromMainWorld = requestSubscribedChannelsFromMainWorld` unconditionally. | Two files define the same callable boundary and the later unconditional assignment changes the effective timeout clamp from the bridge-settings 120000 ms max to the content-bridge 150000 ms max. | Requester ownership policy and override report before timeout, retry, or import-path changes. |
| Pending request lifecycle | Both requester implementations allocate `requestId`, write `window.pendingSubscriptionImportRequests`, arm a timeout, and post `FilterTube_RequestSubscriptionImport` to the page with target `*`. | Pending request state is shared on `window`, but there is no capability token, settings revision, profile revision, or request authority attached to the page message. | Capability token, settings/profile revision, timeout budget, and pending-map cleanup proof. |
| Progress and response trust | `bridge_settings.js` message handling requires `data.source === 'injector'`; `content_bridge.js` accepts same-window `FilterTube_*` messages unless `source === 'content_bridge'`, then resolves subscription progress and response by `requestId`. | The later content-bridge handler has a broader trust gate for subscription progress and response messages than the bridge-settings listener. | Page-message trust report with spoof-negative fixtures and progress/response policy. |
| Runtime import action | The `FilterTube_ImportSubscribedChannels` runtime action lives in `bridge_settings.js`, injects main-world scripts, waits for bridge ready flags, then calls the current global requester and relays progress to extension runtime. | The runtime action relies on the effective global requester after content-script load order, rather than binding one implementation locally. | Runtime action owner report covering injection failure, ready flags, retries, and progress relay scope. |
| Main-world bridge | `injector.js` accepts `FilterTube_RequestSubscriptionImport` only when `source === 'content_bridge'`, calls `fetchSubscribedChannelsFromYoutubei`, and posts wildcard progress and response messages as `source: 'injector'`. | The injector gate is type/source based and does not include nonce, origin capability, settings revision, or profile revision. | Main-world capability contract plus page-message replay/spoof fixtures. |
| YouTubei fetch loop | `fetchSubscribedChannelsFromYoutubei()` builds request profiles, seeds channels from page data, fetches `/youtubei/v1/browse?prettyPrint=false` with `method: 'POST'`, `credentials: 'include'`, JSON body, optional `AbortController`, continuation queue, page delays, and progress posts. | The feature performs credentialed network work and timed retries from the page context without a shared network budget artifact. | YouTubei fetch budget with endpoint, credentials, abort, retry, continuation, and logged-out behavior fixtures. |
| StateManager whitelist import | `StateManager.importSubscribedChannelsToWhitelist()` checks UI lock, tab id, target profile, active profile before and after fetch, then sends `FilterTube_BatchImportWhitelistChannels`, reloads settings, and requests refresh. | Profile-lock checks protect mutation, but they do not add a page-message capability to the prior fetch lifecycle. | Profile mutation report joining page fetch identity, active profile, storage write, and refresh side effects. |
| Tab-view user flow | `startSubscribedChannelsImport()` prepares UI state, resolves a YouTube tab, temporarily activates it, calls `StateManager.importSubscribedChannelsToWhitelist()` with `timeoutMs: 150000`, `maxChannels: 5000`, and `pageDelayMs: 140`, then renders success, empty, or failure states. | UI flow pins user-action intent and tab activation, but it is separate from message trust and network budget ownership. | User-action and tab-activation policy with progress listener and restore-tab proof. |
| UI progress relay | The tab-view runtime progress listener accepts `FilterTube_SubscriptionsImportProgress` only when an import is in progress, request ids match, and source tab ids match when finite. | UI progress is filtered by request and tab, but the page-message hop that produced the runtime progress has broader authority. | End-to-end progress policy from page event to runtime event to UI state. |

## Source-Derived Anchors

```text
bridge_settings guarded requester: `js/content/bridge_settings.js:104`
bridge_settings subscription listener: `js/content/bridge_settings.js:146`
bridge_settings runtime import action: `js/content/bridge_settings.js:231`
content_bridge requester: `js/content_bridge.js:5243`
content_bridge requester assignment: `js/content_bridge.js:5283`
content_bridge handleMainWorldMessages: `js/content_bridge.js:5468`
content_bridge subscription progress/response: `js/content_bridge.js:5596`
injector subscription bridge install: `js/injector.js:6`
injector fetchSubscribedChannelsFromYoutubei: `js/injector.js:1239`
StateManager fetchSubscribedChannelsFromImportTab: `js/state_manager.js:1656`
StateManager importSubscribedChannelsToWhitelist: `js/state_manager.js:1711`
tab-view startSubscribedChannelsImport: `js/tab-view.js:4807`
tab-view runtime progress listener: `js/tab-view.js:10971`
```

## Runtime Proof

The runtime fixture proves:

1. The audit document is audit-only and source pinned across five JS files and
   four manifest files.
2. The 13 lifecycle source/effect blocks remain line and byte pinned.
3. Every manifest loads `bridge_settings.js` before `content_bridge.js`.
4. The content-bridge requester is the later unconditional assignment and clamps
   `timeoutMs` to 150000, `maxChannels` to 5000, and `pageDelayMs` to 50..500
   before posting `FilterTube_RequestSubscriptionImport` with target `*`.
5. The bridge-settings listener requires `source: 'injector'`, while the
   content-bridge handler only rejects `source: 'content_bridge'` for same-window
   `FilterTube_*` messages before handling subscription progress and response.
6. The injector bridge accepts type/source gated import requests, posts wildcard
   progress and response messages, and performs one credentialed YouTubei POST
   path with abort timers and continuation delays.
7. StateManager and tab-view add profile, lock, tab, request id, and source tab
   gates around whitelist import and UI progress handling.
8. No first-class lifecycle authority symbols exist in product runtime source.

## Non-Completion Boundary

Subscription import request lifecycle behavior still needs one lifecycle
contract, requester override report, page-message capability token, progress and
response policy, timeout budget, YouTubei fetch budget, manifest load-order
report, profile mutation report, UI progress policy, fixture provenance, and
metric artifact before optimization or first-class JSON filter behavior can rely
on this feature.

No `subscriptionImportRequestLifecycleContract`,
`subscriptionImportRequesterOverrideReport`,
`subscriptionImportCapabilityToken`,
`subscriptionImportPageMessageTrustReport`,
`subscriptionImportProgressResponsePolicy`,
`subscriptionImportTimeoutBudget`,
`subscriptionImportYoutubeiFetchBudget`,
`subscriptionImportManifestLoadOrderReport`,
`subscriptionImportProfileMutationReport`,
`subscriptionImportUiProgressPolicy`,
`subscriptionImportFixtureProvenance`, or
`subscriptionImportMetricArtifact` exists in product runtime source yet.

## Runnable Proof

```bash
node --test tests/runtime/subscription-import-request-lifecycle-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this backup/import/Nanah/vendor surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, backup/export behavior, import behavior,
Nanah sync behavior, vendor runtime behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
