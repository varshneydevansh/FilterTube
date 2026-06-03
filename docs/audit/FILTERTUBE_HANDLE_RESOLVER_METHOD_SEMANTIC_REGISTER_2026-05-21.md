# FilterTube Handle Resolver Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/content/handle_resolver.js` from indirect identity
and content-helper coverage to a source-derived method inventory. It covers the
isolated-world handle-to-channel-id resolver, learned channel-map persistence,
handle normalization fallbacks, resolver cache sentinel behavior, background
identity fetch delegation, direct same-origin handle page fetches, wildcard
page-message map updates, and DOM fallback rerun scheduling.

This is not completion proof for resolver network authority, learned map write
authority, page-message trust, identity confidence, no-rule work budgets,
settings/profile/list-mode routing, background fetch sender trust, cache
revision ownership, DOM fallback rerun ownership, or fixture provenance. It is
a current-behavior boundary before handle resolver, identity fallback, learned
map persistence, background resolver, network, or DOM fallback rerun changes.

## Source-Derived Summary

```text
source file: js/content/handle_resolver.js
line count: 282
source bytes: 9785
source sha256: 67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff
repo-wide broad parser lexical callable matches: 22
broad parser runtime callable/declaration matches: 7
assignment-expression function declarations outside broad parser: 0
control-flow lexical artifacts: 15
file-local executable proof probes: 5
global method proof count promoted: 0
named method/helper declarations in scope: 7
plain function declarations: 6
async function declarations: 1
const helper/callback declarations: 0
const arrow helper/callback declarations: 0
arrow callback sites in scope: 5
semantic method groups: 4
document literal occurrences: 0
window literal occurrences: 5
location literal occurrences: 0
globalThis literal occurrences: 0
browserAPI_BRIDGE references: 4
currentSettings references: 8
applyDOMFallback references: 3
resolvedHandleCache references: 15
pendingDomFallbackRerunTimer references: 4
persistChannelMappings references: 2
normalizeHandleGlyphs references: 2
extractRawHandle references: 6
normalizeHandleValue references: 5
extractHandleFromString references: 2
scheduleDomFallbackRerun references: 3
fetchIdForHandle references: 2
FilterTube_UpdateChannelMap references: 2
fetchChannelDetails references: 1
updateChannelMap references: 1
channelMap references: 12
PENDING token occurrences: 4
skipNetwork token occurrences: 2
backgroundOnly token occurrences: 3
setTimeout calls: 1
clearTimeout calls: 0
setInterval calls: 0
clearInterval calls: 0
MutationObserver references: 0
observe calls: 0
disconnect calls: 0
addEventListener calls: 0
removeEventListener calls: 0
postMessage calls: 2
browserAPI_BRIDGE.runtime.sendMessage calls: 2
sendMessage token occurrences: 2
fetch calls: 1
credentials token occurrences: 1
same-origin token occurrences: 1
decodeURIComponent references: 1
encodeURIComponent references: 1
console.warn references: 3
console.log references: 2
new Map references: 1
Array.isArray references: 1
forEach references: 2
browserAPI_BRIDGE.storage.local.get references: 1
response.text references: 1
text.match references: 1
browser/global export: implicit isolated-world helper functions
CommonJS export: none
runtime behavior changed: no
```

## Method Group Counts

```text
handleResolverDomFallbackRerun: 1
handleResolverFetchAndCache: 1
handleResolverMappingPersistence: 1
handleResolverNormalization: 4
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `handleResolverMappingPersistence` | 1 | Sends `updateChannelMap` to background, mutates `currentSettings.channelMap`, and stores both id-to-handle and handle-to-id entries. | Map write authority, sender class, revision, profile/list-mode scope, stale alias conflict policy, and negative storage fixtures. |
| `handleResolverNormalization` | 4 | Normalizes handle glyphs, extracts raw `@handle` values, delegates to `window.FilterTubeIdentity` when available, rejects UC-shaped handles, and exposes string extraction helpers. | Shared identity parity, Unicode/encoded handle fixture matrix, confidence tier reporting, and fallback divergence proof. |
| `handleResolverDomFallbackRerun` | 1 | Coalesces DOM fallback reruns with a single 250ms `setTimeout` and calls `applyDOMFallback(currentSettings, { forceReprocess: true })`. | No-rule budget, rerun ownership, teardown, route/profile/list-mode gate, duplicate rerun metrics, and failure reporting. |
| `handleResolverFetchAndCache` | 1 | Resolves from `channelMap`, uses `PENDING` cache sentinel, honors `skipNetwork` and `backgroundOnly`, delegates to background `fetchChannelDetails`, fetches same-origin handle pages, regex extracts UC ids, posts learned map updates with wildcard target, and clears failed cache entries. | Resolver network policy, background sender trust, page-message trust, request budget, cache revision, identity confidence, and fixture provenance. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 25 | `function` | `persistChannelMappings` | `handleResolverMappingPersistence` |
| 50 | `function` | `normalizeHandleGlyphs` | `handleResolverNormalization` |
| 58 | `function` | `extractRawHandle` | `handleResolverNormalization` |
| 100 | `function` | `normalizeHandleValue` | `handleResolverNormalization` |
| 125 | `function` | `extractHandleFromString` | `handleResolverNormalization` |
| 136 | `function` | `scheduleDomFallbackRerun` | `handleResolverDomFallbackRerun` |
| 149 | `asyncFunction` | `fetchIdForHandle` | `handleResolverFetchAndCache` |

## Lexical Callable Reconciliation

The repo-wide callable parser intentionally uses a broad JavaScript regex so it
can catch top-level declarations, object-method shorthand, and generated output
without requiring a full parser. For `js/content/handle_resolver.js`, that
broad parser currently reports 22 lexical callable matches:

| Broad parser class | Count | Runtime callable? | Semantic interpretation |
| --- | ---: | --- | --- |
| Plain function declarations | 6 | yes | The parser captures `persistChannelMappings`, `normalizeHandleGlyphs`, `extractRawHandle`, `normalizeHandleValue`, `extractHandleFromString`, and `scheduleDomFallbackRerun`. |
| Async function declarations | 1 | yes | The parser captures `fetchIdForHandle`, the resolver/cache/network owner. |
| Assignment function expression | 0 | no | This file exposes helpers implicitly through isolated-world globals and does not add assignment-expression function declarations outside the broad parser. |
| `if` artifacts | 13 | no | The broad method-shorthand branch misclassifies `if (...) {` control-flow lines as lexical callables. |
| `for` artifacts | 2 | no | The same broad branch misclassifies `for (...) {` control-flow lines as lexical callables. |

This file-local reconciliation reduces ambiguity for
`js/content/handle_resolver.js`, but it does not promote the global method proof
count. The repo-wide index still pins 0 complete per-callable semantic files
because the audit has not yet reconciled broad-parser artifacts across all 63
tracked JS/JSX/MJS files.

## File-Local Executable Behavior Proof

The current verifier executes `js/content/handle_resolver.js` in a VM context
with stubbed `window`, timers, storage, runtime messaging, fetch, page messages,
and DOM fallback. It proves these current behaviors without changing runtime
source:

| Probe | Current executable proof | Risk boundary |
| --- | --- | --- |
| Handle normalization fallback | Encoded and typography-normalized handles decode through `extractRawHandle`, normalize to lowercase `@handle` form, and UC-shaped handles are rejected as handle values. | Shared identity parity, Unicode fixture coverage, and confidence reporting remain future gates. |
| Learned map persistence | `persistChannelMappings` sends `updateChannelMap` to background and writes both lowercase id-to-handle and lowercase handle-to-id entries into `currentSettings.channelMap`. | Map write authority, sender class, revision, profile/list-mode scope, and stale alias conflict policy remain missing. |
| Storage/cache and skip-network path | `fetchIdForHandle` reads `channelMap` before network work, caches matching `@handle` ids, and `skipNetwork` returns `null` without fetch or background resolver work when storage misses. | Cache revision ownership, stale storage provenance, and no-rule work budgets remain unproved. |
| Background resolver path | `backgroundOnly` sends `fetchChannelDetails`, accepts UC-shaped ids, posts `FilterTube_UpdateChannelMap` to `*`, schedules one 250ms DOM fallback rerun, and applies fallback with `{ forceReprocess: true }` when the timer fires. | Background sender trust, wildcard page-message trust, rerun ownership, teardown, and duplicate rerun metrics remain future gates. |
| Direct network fallback path | Non-background resolution fetches `/@handle/about` then `/@handle` with same-origin credentials, extracts `channel/(UC...)`, posts the learned map update to `*`, and schedules the same DOM fallback rerun path. | Resolver network policy, request budget, privacy classification, fixture provenance, and failure telemetry remain missing. |

## Current Entrypoints And Dependencies

```text
module entrypoint: manifest-loaded isolated-world content script before content_bridge.js
implicit helper exports: persistChannelMappings, extractRawHandle, normalizeHandleValue, extractHandleFromString, fetchIdForHandle
shared identity dependency: window.FilterTubeIdentity?.extractRawHandle and window.FilterTubeIdentity?.normalizeHandleValue
background learned-map write: browserAPI_BRIDGE.runtime.sendMessage({ action: "updateChannelMap", mappings })
in-memory learned-map write: currentSettings.channelMap[idLower] = handle and currentSettings.channelMap[handleLower] = id
resolver cache: resolvedHandleCache Map keyed by clean lowercase handle core
pending sentinel: string PENDING returns null to callers and suppresses duplicate work
storage first path: browserAPI_BRIDGE.storage.local.get(['channelMap'])
background resolver path: browserAPI_BRIDGE.runtime.sendMessage({ action: 'fetchChannelDetails', channelIdOrHandle: '@...' })
direct resolver path: fetch('/@handle/about') then fetch('/@handle') with credentials same-origin and Accept text/html
direct parse path: response.text() then text.match(/channel\/(UC[\w-]{22})/)
page-message map update: window.postMessage({ type: 'FilterTube_UpdateChannelMap', source: 'content_bridge' }, '*')
DOM fallback rerun path: setTimeout(..., 250) then applyDOMFallback(currentSettings, { forceReprocess: true })
listener ownership: none
observer ownership: none
interval ownership: none
teardown path: none
settings revision gate: none
network budget gate: none
message trust token: none
CommonJS export: none
```

## Future Proof Fields

Each handle-resolver method row must eventually be backed by source line,
fixture, caller path, and observed success/failure effect before identity
resolver, learned map, network fallback, cache, page-message, or DOM fallback
rerun behavior changes can claim semantic coverage:

```text
methodReference
sourceLine
semanticGroup
callerSurface
routeSurface
settingsMode
listMode
profileTarget
handleInput
normalizedHandle
identityConfidence
cacheKey
cacheState
pendingSentinel
storageKey
channelMapMutation
backgroundAction
networkPath
networkBudget
pageMessageType
pageMessageTarget
forceReprocess
domFallbackEffect
settingsRevision
senderClass
teardownPolicy
noRuleBudget
negativeFixture
positiveFixture
sourceFamilyProvenance
```

## Missing Runtime Authorities

These names intentionally do not exist in runtime source today:

```text
handleResolverMethodAuthority
handleResolverNetworkPolicy
handleResolverCacheContract
handleResolverMapWriteAuthority
handleResolverPageMessageTrustContract
handleResolverDomFallbackRerunBudget
handleResolverBackgroundFetchContract
handleResolverIdentityConfidenceReport
handleResolverNoRuleBudget
handleResolverFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this method semantic register can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
