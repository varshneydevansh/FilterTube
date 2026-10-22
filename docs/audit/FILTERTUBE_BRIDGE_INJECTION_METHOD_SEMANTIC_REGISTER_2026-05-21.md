# FilterTube Bridge Injection Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/content/bridge_injection.js` from startup-injection
and content-helper surface evidence to a source-derived method inventory. It
covers isolated-world bridge bootstrap, browser API selection, debug/global
alias setup, Chromium background-mediated MAIN-world script injection,
Firefox/fallback DOM script injection, idempotence state, injection failure
reset, and the timer-based settings request that follows successful injection.

This is not completion proof for script injection trust, MAIN-world load-order
authority, Firefox/Chromium parity, settings replay ownership, retry/backoff,
global alias freshness, fallback script lifecycle, sender-class policy, or
future simultaneous allow/block semantics. It is a current-behavior boundary
before bridge bootstrap, manifest order, background injection, fallback script
tags, settings handoff timing, or injector readiness behavior changes.

## Source-Derived Summary

```text
source file: js/content/bridge_injection.js
line count: 152
source bytes: 6064
source sha256: 6097691b4c6f4d2ede943014694aec4f6cc1ef0134945e576ca9c6c94dd9c669
repo-wide broad parser lexical callable matches: 14
runtime method/helper declarations in scope: 7
broad-parser runtime declarations in scope: 5
assignment-expression method declarations outside broad parser: 2
control-flow lexical artifacts: 9
file-local executable behavior rows: 5
global method proof count promoted: 0
named method/helper declarations in scope: 7
plain function declarations: 3
async function declarations: 2
named function expression declarations: 1
async named function expression declarations: 1
const helper/callback declarations: 0
const arrow helper/callback declarations: 0
arrow callback sites in scope: 11
semantic method groups: 4
globalThis literal occurrences: 19
bridgeState references: 15
scriptsInjected references: 5
injectionInProgress references: 3
injectionPromise references: 7
browserAPI_BRIDGE references: 4
IS_FIREFOX_BRIDGE references: 4
currentSettings references: 5
debugLog references: 7
injectMainWorldScripts references: 4
requestSettingsFromBackground references: 2
api.runtime.sendMessage calls: 1
api.runtime.getURL calls: 1
api.scripting?.executeScript references: 1
document literal occurrences: 6
document.createElement calls: 1
document.head references: 1
document.documentElement references: 2
appendChild calls: 1
setTimeout calls: 2
addEventListener calls: 0
removeEventListener calls: 0
MutationObserver references: 0
postMessage calls: 0
new Promise calls: 2
Promise.resolve references: 1
new Error calls: 2
try blocks: 5
catch blocks: 5
finally blocks: 1
await expressions: 2
script.onload assignments: 1
script.onerror assignments: 1
scriptsToInject references: 5
shared/identity references: 1
filter_logic references: 2
seed references: 2
injector references: 2
browser word references: 3
chrome word references: 1
isFirefox references: 6
api references: 7
runtime behavior changed: no
```

## Method Group Counts

```text
bridgeInjectionDebugGlobalState: 3
bridgeInjectionBackgroundScripting: 1
bridgeInjectionFallbackScriptDom: 2
bridgeInjectionMainWorldOrchestration: 1
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `bridgeInjectionDebugGlobalState` | 3 | Initializes `globalThis.__filtertubeBridgeState`, exports `IS_FIREFOX_BRIDGE`, `browserAPI_BRIDGE`, `currentSettings`, and `debugLog`, and increments a local debug sequence while console logging is commented out. The two additional named helpers gate log/info/debug by the explicit local debug switch or DOM debug attribute; warnings/errors remain available. | Global alias freshness, duplicate content-script execution proof, debug privacy policy, and cross-file owner contract. |
| `bridgeInjectionBackgroundScripting` | 1 | Sends `{ action: "injectScripts", scripts }` to background, then resolves only when the response has `success` and no `api.runtime.lastError`. | Sender-class trust, fixed script allowlist, target tab/frame proof, background action ownership, and failure provenance. |
| `bridgeInjectionFallbackScriptDom` | 2 | Creates web-accessible `<script>` tags one at a time, sets `src` with `api.runtime.getURL("js/...")`, waits for `onload`, spaces loads by 50ms, and rejects on `onerror`. | DOM script lifecycle, script removal/cleanup, ordered load proof, browser parity, retry budget, and failure fixture provenance. |
| `bridgeInjectionMainWorldOrchestration` | 1 | Guards injection with `scriptsInjected` and `injectionPromise`, injects `shared/identity`, `shared/view_count`, `filter_logic`, optional Firefox `seed`, and `injector`, marks success, then schedules `requestSettingsFromBackground()` after 100ms. | MAIN-world readiness signal, settings replay contract, retry/backoff budget, seed parity, duplicate readiness metrics, and no-rule startup budget. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 25 | `function` | `isFilterTubeContentDebugEnabled` | `bridgeInjectionDebugGlobalState` |
| 34 | `function` | `installFilterTubeContentConsoleGate` | `bridgeInjectionDebugGlobalState` |
| 55 | `functionExpression` | `debugLog` | `bridgeInjectionDebugGlobalState` |
| 61 | `asyncFunction` | `injectViaScriptingAPI` | `bridgeInjectionBackgroundScripting` |
| 76 | `asyncFunction` | `injectViaFallback` | `bridgeInjectionFallbackScriptDom` |
| 79 | `function` | `injectNext` | `bridgeInjectionFallbackScriptDom` |
| 100 | `asyncFunctionExpression` | `injectMainWorldScripts` | `bridgeInjectionMainWorldOrchestration` |

## Lexical Callable Reconciliation

The repo-wide broad callable parser is intentionally permissive and line-based.
For `js/content/bridge_injection.js`, the 14 broad-parser matches reconcile to
5 runtime declarations and 9 control-flow artifacts. `debugLog` and
`injectMainWorldScripts` are real assignment-expression method declarations
that the broad parser does not count as ordinary declarations. This file-local
reconciliation documents the mismatch; it does not promote the global method
proof count or alter the current 0 complete per-callable semantic files
boundary.

| Source line | Lexical token | Runtime callable? | Evidence |
| ---: | --- | --- | --- |
| 25 | `isFilterTubeContentDebugEnabled` | yes | `function isFilterTubeContentDebugEnabled() {` is a named runtime helper. |
| 34 | `installFilterTubeContentConsoleGate` | yes | `function installFilterTubeContentConsoleGate() {` is a named runtime helper. |
| 50 | `if` | no | `if (typeof globalThis.currentSettings === 'undefined') {` is control flow. |
| 54 | `if` | no | `if (typeof globalThis.debugLog !== 'function') {` is control flow. |
| 61 | `injectViaScriptingAPI` | yes | `async function injectViaScriptingAPI(scripts) {` is a named runtime helper. |
| 67 | `if` | no | `if (api.runtime.lastError || !response?.success) {` is control flow. |
| 76 | `injectViaFallback` | yes | `async function injectViaFallback(scripts) {` is a named runtime helper. |
| 79 | `injectNext` | yes | `function injectNext() {` is a named runtime helper. |
| 80 | `if` | no | `if (currentIndex >= scripts.length) {` is control flow. |
| 101 | `if` | no | `if (bridgeState.scriptsInjected) {` is control flow. |
| 104 | `if` | no | `if (bridgeState.injectionPromise) {` is control flow. |
| 115 | `if` | no | `if (!isFirefox && api.scripting?.executeScript) {` is control flow. |
| 123 | `if` | no | `if (typeof requestSettingsFromBackground === 'function') {` is control flow. |
| 138 | `if` | no | `if (!bridgeState.scriptsInjected) {` is control flow. |

## Local Callback Inventory

| Source line | Callback | Owner/effect |
| ---: | --- | --- |
| 11 | `(() =>` | bridge bootstrap immediately. |
| 40 | `console.log = (...args) =>` | debug-gated logging. |
| 41 | `console.info = (...args) =>` | debug-gated info. |
| 42 | `console.debug = (...args) =>` | debug-gated debug. |
| 62 | `new Promise((resolve, reject) =>` | background scripting request lifetime. |
| 66 | `sendMessage(..., (response) =>` | runtime.lastError. |
| 77 | `new Promise((resolve, reject) =>` | fallback sequential script tag injection lifetime. |
| 87 | `script.onload = () =>` | setTimeout(injectNext, 50). |
| 91 | `script.onerror = () =>` | Failed to inject. |
| 109 | `(async () =>` | resets bridge state on failure. |
| 121 | `setTimeout(() =>` | requestSettingsFromBackground(). |

## Current Entrypoints And Dependencies

```text
module entrypoint: manifest-loaded isolated-world content script before bridge_settings.js and content_bridge.js
manifest order: block_channel.js before bridge_injection.js before bridge_settings.js before content_bridge.js
Chromium content script world: ISOLATED for bridge_injection.js
default/chrome first MAIN-world content entry: shared/view_count before seed, before isolated bridge scripts
Firefox seed behavior: seed is not a separate MAIN-world manifest entry; fallback injection pushes seed when isFirefox is true
Opera seed behavior: shared/view_count precedes seed in a separate first content entry without an explicit world declaration
web-accessible scripts required by fallback: js/shared/identity.js, js/shared/view_count.js, js/filter_logic.js, js/seed.js, js/injector.js
browser API selection: browser when browser.runtime exists, otherwise chrome
global exports: globalThis.IS_FIREFOX_BRIDGE, globalThis.browserAPI_BRIDGE, globalThis.debugLog, globalThis.currentSettings, globalThis.injectMainWorldScripts
local aliases: var IS_FIREFOX_BRIDGE, browserAPI_BRIDGE, debugLog, currentSettings, injectMainWorldScripts
Chromium injection path: !isFirefox && api.scripting?.executeScript sends background action "injectScripts"
background injectScripts path: maps request.scripts to js/*.js files and calls browserAPI.scripting.executeScript({ target, files, world: 'MAIN' })
fallback injection path: document.createElement('script'), api.runtime.getURL(`js/${scriptName}.js`), append to document.head || document.documentElement
fallback script cleanup path: none
fallback load spacing: setTimeout(injectNext, 50)
post-injection settings replay: setTimeout(..., 100) calls requestSettingsFromBackground() when available
injection success guard: bridgeState.scriptsInjected and bridgeState.injectionPromise
injection failure reset: scriptsInjected false and injectionPromise null
injectionInProgress guard use: state is set and cleared, but guard decisions use scriptsInjected and injectionPromise
listeners: none
observers: none
intervals: none
runtime behavior changed: no
```

The background `injectScripts` action currently accepts caller-provided
`request.scripts`, derives `files` from those names, and targets the sender tab
and frame when available. This register documents that current shape; it does
not declare the branch safe for future expansion or public caller reuse.

## Current Behavior Boundaries

```text
script list base: ['shared/identity', 'shared/view_count', 'filter_logic']
Firefox-only script addition: seed
final script addition: injector
Chromium path error source: api.runtime.lastError?.message || response?.error
fallback path error source: Failed to inject ${scriptName}
fallback append target: document.head || document.documentElement
fallback script removal after load: absent
duplicate injection success behavior: returns existing injectionPromise or Promise.resolve()
duplicate in-progress behavior: returns existing injectionPromise
successful injection settings handoff: fixed 100ms timer
settings handoff readiness proof: checks only typeof requestSettingsFromBackground === 'function'
debug failure logging: globalThis.debugLog("Script injection failed:", error)
explicit retry budget: absent
explicit sender/capability token: absent
explicit script allowlist token in bridge file: absent
```

## File-Local Executable Behavior Proof

These VM-backed probes execute the current bridge-injection content script with
fake `chrome`, `browser`, `document`, `setTimeout`, and
`requestSettingsFromBackground` surfaces. They prove file-local effects only.
They do not prove background sender trust, frame targeting, real browser
MAIN-world execution, or YouTube page readiness.

| Probe | Current behavior proved | Boundary still open |
| --- | --- | --- |
| Chromium executable proof: one successful injectMainWorldScripts() call sends injectScripts for shared/identity, shared/view_count, filter_logic, and injector | In Chromium mode with `api.scripting.executeScript`, `injectMainWorldScripts()` posts `{ action: "injectScripts", scripts: ["shared/identity", "shared/view_count", "filter_logic", "injector"] }`, marks `scriptsInjected = true`, clears `injectionInProgress`, and schedules a `100` ms settings request timer. | Background allowlist, sender class, frame targeting, and real MAIN-world execution are still unproved. |
| Chromium executable proof: a duplicate in-progress injectMainWorldScripts() call reuses the same promise and sends no second injectScripts message | A second call before the first promise settles returns the same `injectionPromise`; the message array still contains one `injectScripts` request. | No metric or owner report records the dedupe decision. |
| Chromium executable proof: failed background injection rejects, clears injectionPromise, leaves scriptsInjected false, and calls debugLog once | A `{ success: false, error }` background response rejects, sets `scriptsInjected = false`, clears `injectionPromise`, clears `injectionInProgress`, and increments `debugSequence` through `debugLog`. | Retry/backoff, failure provenance, and user-visible recovery remain absent. |
| Firefox fallback executable proof: appends shared/identity, shared/view_count, filter_logic, seed, and injector script tags in order with 50ms load spacing | In Firefox mode, fallback injection appends `js/shared/identity.js`, `js/shared/view_count.js`, `js/filter_logic.js`, `js/seed.js`, and `js/injector.js` under extension URLs, using one `50` ms timer after each script `onload`. | Real browser load/error ordering and script execution readiness remain unproved. |
| Firefox fallback executable proof: fallback script tags are not removed after load and successful injection schedules the same 100ms settings request timer | Loaded fallback script nodes remain present, and successful fallback injection schedules the same `100` ms `requestSettingsFromBackground()` timer as Chromium. | DOM lifecycle cleanup and injector-ready synchronization remain absent. |

## Risk Notes

Reliability risk is concentrated in the startup boundary between isolated-world
state and MAIN-world readiness. Successful background or fallback injection
marks `scriptsInjected` before any explicit injector-ready proof, then a fixed
100ms timer asks background for settings. `bridge_settings.js` and
`content_bridge.js` have additional readiness handling, but this file itself
does not own a structured ready/error contract.

False-hide/leak risk is indirect: late or partial MAIN-world script injection
can leave seed/filter logic unavailable while DOM fallback still starts from
`content_bridge.js`. In fallback browsers, injected script elements are not
removed after load, so lifecycle cleanup is currently outside this bridge file.

Performance/code-burden risk comes from split browser paths and duplicate
startup signals. Chromium injection is delegated through a background message,
fallback injection is DOM-script based with fixed 50ms spacing, and settings
handoff is timer-based rather than tied to the injector's full ready message.

## Future Proof Fields

Each bridge-injection method row must eventually be backed by source line,
fixture, caller class, and observed success/failure effect before startup,
manifest, background injection, fallback script tag, or settings handoff
behavior changes can claim semantic coverage:

```text
bridgeInjectionMethodReference
sourceLine
semanticGroup
runtimeWorld
browserPackage
manifestFile
manifestContentScriptIndex
scriptList
scriptName
scriptFile
webAccessibleResource
senderClass
targetTabId
targetFrameId
backgroundAction
backgroundAllowlistDecision
mainWorldExecutionResult
fallbackAppendTarget
fallbackScriptLifecycle
loadOrderResult
settingsReplayReason
settingsReplayDelayMs
injectorReadySignal
seedReadySignal
failureReason
retryBudget
dedupeState
globalAliasState
positiveFixture
negativeFixture
sourceFamilyProvenance
```

## Missing Runtime Authorities

These authority/report tokens do not exist in runtime source yet:

```text
bridgeInjectionMethodAuthority
bridgeInjectionScriptManifest
bridgeInjectionMainWorldLoadOrderContract
bridgeInjectionSenderContract
bridgeInjectionFallbackDomLifecycleReport
bridgeInjectionRetryBudget
bridgeInjectionSettingsReplayContract
bridgeInjectionGlobalAliasContract
bridgeInjectionFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this bridge injection method surface can
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
optimization, JSON-first behavior, bridge injection changes, settings replay
changes, fallback lifecycle changes, or selector/message authority changes.

## Revalidation - 2026-10-18

The two added named helpers detect the local debug switch and install console log/info/debug gates. They belong to debug/global setup; warnings and errors remain available. A VM fixture verifies disabled logging, explicit debug logging, DOM-attribute debug logging, and idempotent reinstallation. Three console wrapper arrows are counted as callbacks rather than additional named methods.

The Chromium duplicate/failure and Firefox sequential fixtures execute the actual source. They now include `shared/view_count` before the engine, with Firefox seed before injector. Five executable scenarios are exercised (success, duplicate in progress, failure, Firefox fallback, debug console gating); the separate fallback cleanup row shares the Firefox scenario. Current counts are inventories and file-local evidence, not real-browser injection, sender authentication, load readiness, or exhaustive semantic proof. The global semantic proof count remains zero.


## Opt-In Content Player Injection Revalidation - 2026-10-22

The unchanged seven named methods and eleven callback sites now inject the bounded MAIN data-response helper before injector. Current real-source Chromium success/duplicate/failure and Firefox sequential lifecycle fixtures retain their assertions with the explicit added dependency. This does not grant page replies authority, close sender/allowlist gaps, or prove installed injection/readiness. The earlier source snapshot remains historical.

line count: 153
source bytes: 6135
source sha256: 495033ca85678f848c0a815791a0696ad870a92b00048dfcbab99d000fc162d8
globalThis literal occurrences: 19
bridgeState references: 15
scriptsInjected references: 5
injectionInProgress references: 3
injectionPromise references: 7
browserAPI_BRIDGE references: 4
IS_FIREFOX_BRIDGE references: 4
currentSettings references: 5
debugLog references: 7
injectMainWorldScripts references: 4
requestSettingsFromBackground references: 2
api.runtime.sendMessage calls: 1
api.runtime.getURL calls: 1
api.scripting?.executeScript references: 1
document literal occurrences: 6
document.createElement calls: 1
document.head references: 1
document.documentElement references: 2
appendChild calls: 1
setTimeout calls: 2
addEventListener calls: 0
removeEventListener calls: 0
MutationObserver references: 0
postMessage calls: 0
new Promise calls: 2
Promise.resolve references: 1
new Error calls: 2
try blocks: 5
catch blocks: 5
finally blocks: 1
await expressions: 2
script.onload assignments: 1
script.onerror assignments: 1
scriptsToInject references: 6
shared/identity references: 1
filter_logic references: 2
seed references: 2
injector references: 2
browser word references: 3
chrome word references: 1
isFirefox references: 6
api references: 7

| Current line | Lexical name | Runtime method | Current source |
| ---: | --- | --- | --- |
| 25 | `isFilterTubeContentDebugEnabled` | yes | `function isFilterTubeContentDebugEnabled() {` |
| 34 | `installFilterTubeContentConsoleGate` | yes | `function installFilterTubeContentConsoleGate() {` |
| 50 | `if` | no | `if (typeof globalThis.currentSettings === 'undefined') {` |
| 54 | `if` | no | `if (typeof globalThis.debugLog !== 'function') {` |
| 61 | `injectViaScriptingAPI` | yes | `async function injectViaScriptingAPI(scripts) {` |
| 67 | `if` | no | `if (api.runtime.lastError || !response?.success) {` |
| 76 | `injectViaFallback` | yes | `async function injectViaFallback(scripts) {` |
| 79 | `injectNext` | yes | `function injectNext() {` |
| 80 | `if` | no | `if (currentIndex >= scripts.length) {` |
| 101 | `if` | no | `if (bridgeState.scriptsInjected) {` |
| 104 | `if` | no | `if (bridgeState.injectionPromise) {` |
| 116 | `if` | no | `if (!isFirefox && api.scripting?.executeScript) {` |
| 124 | `if` | no | `if (typeof requestSettingsFromBackground === 'function') {` |
| 139 | `if` | no | `if (!bridgeState.scriptsInjected) {` |

| 122 | `setTimeout(() =>` | fixed settings replay timer; no new readiness guarantee |

Chromium executable proof: one successful injectMainWorldScripts() call sends injectScripts for shared/identity, shared/view_count, filter_logic, content/content_playback_response, and injector
Firefox fallback executable proof: appends shared/identity, shared/view_count, filter_logic, seed, content/content_playback_response, and injector script tags in order with 50ms load spacing
