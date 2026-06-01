# FilterTube Prompt Onboarding Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/content/first_run_prompt.js` and
`js/content/release_notes_prompt.js` from a P0 prompt/onboarding surface row to
a source-derived method inventory. It covers first-run refresh, release-note
banner rendering, prompt acknowledgement, DOM overlay lifecycle, What New tab
navigation, reload behavior, manifest content-script load order, and current
cross-prompt risks that can affect reliability, false-hide/leak symptoms,
performance, and code burden.

This is not completion proof for prompt priority, replay ownership, sender
trust, URL authority, viewport fit, style lifecycle, cross-prompt exclusivity,
or release-note schema provenance. It is a current-behavior boundary before
prompt, coachmark, release-note, dashboard route, background-message, or
content-script lifecycle behavior changes.

## Source-Derived Summary

```text
source files: js/content/first_run_prompt.js, js/content/release_notes_prompt.js
first_run_prompt.js bytes: 7453
first_run_prompt.js sha256: 5672d9060d29b08550ecfc3add54245212a5094ee5137f025b6f788f12e50409
release_notes_prompt.js bytes: 9866
release_notes_prompt.js sha256: 30b624cbbda1004f354f98dbf3b4513f8ebc298adecbceb4358782f248f80474
combined source lines: 440
prompt content-script modules: 2
repo-wide broad parser lexical callable matches in scope: 19
runtime function declarations in scope: 9
runtime const arrow callable declarations in scope: 1
control-flow lexical artifacts in scope: 9
file-local executable behavior rows: 7
global method proof count promoted: 0
named function declarations: 9
plain function declarations: 9
async function declarations: 0
const arrow callback declarations: 1
arrow token sites: 14
semantic method groups: 4
document literal occurrences: 31
window literal occurrences: 6
location literal occurrences: 2
browserAPI_BRIDGE references: 6
browser references: 4
chrome references: 5
document.createElement calls: 18
document.getElementById calls: 3
document.head.appendChild calls: 2
document.body.appendChild calls: 2
appendChild calls: 18
remove calls: 3
setAttribute calls: 4
classList.add calls: 3
textContent references: 12
onclick assignments: 6
addEventListener calls: 2
removeEventListener calls: 0
MutationObserver references: 0
setTimeout calls: 3
setInterval calls: 0
clearTimeout calls: 0
fetch calls: 0
runtime sendMessage calls: 5
runtime getURL calls: 1
runtime lastError references: 1
window.open calls: 1
location.href writes: 1
window.location.reload calls: 1
try blocks: 1
catch blocks: 1
matchMedia calls: 2
DOMContentLoaded tokens: 2
PROMPT_ID references: 11
dismissed references: 6
payloadCache references: 4
FilterTube action token occurrences: 5
runtime behavior changed: no
```

## Per-File Counts

| Source file | Lines | Named functions | Plain functions | Async functions | Const arrow callbacks | Arrow token sites | Broad parser matches | Control-flow artifacts | Runtime messages | Timers | DOMContentLoaded listeners |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `js/content/first_run_prompt.js` | 190 | 4 | 4 | 0 | 0 | 6 | 7 | 3 | 2 | 2 | 1 |
| `js/content/release_notes_prompt.js` | 250 | 5 | 5 | 0 | 1 | 8 | 12 | 6 | 3 | 1 | 1 |

## Method Group Counts

```text
promptDismissalAndAck: 3
promptDomAssembly: 2
promptEligibilityRequest: 2
promptThemePalette: 2
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `promptThemePalette` | 2 | Each prompt locally reads `window.matchMedia('(prefers-color-scheme: dark)')` and returns inline color tokens. | Theme parity fixtures, dashboard/content prompt consistency, accessible contrast proof, and no duplicate palette authority. |
| `promptDomAssembly` | 2 | Each prompt independently builds a fixed-position section, action buttons, close button, animation style element, and body-mounted overlay guarded only by its own `PROMPT_ID`. | Cross-prompt overlay coordinator, target viewport proof, duplicate style ownership, teardown proof, and mobile safe-area fixtures. |
| `promptDismissalAndAck` | 3 | First-run uses `markComplete()` to send `FilterTube_FirstRunComplete`; release notes use `ackAndDismiss()` to send `FilterTube_ReleaseNotesAck` when `payloadCache.version` exists and `removePrompt()` to close the DOM node. | Sender-class authority, prompt instance capability, storage ack result policy, lost-response behavior, and style cleanup proof. |
| `promptEligibilityRequest` | 2 | Each module asks background for eligibility, renders immediately when the document is ready, or registers a one-shot `DOMContentLoaded` callback. | Shared queue/priority, replay owner, route/profile/list-mode negative fixtures, and no-work budget proof. |

## Current Method Inventory

| Source file | Source line | Kind | Method or function | Semantic group |
| --- | ---: | --- | --- | --- |
| `js/content/first_run_prompt.js` | 11 | `function` | `getPalette` | `promptThemePalette` |
| `js/content/first_run_prompt.js` | 39 | `function` | `createPrompt` | `promptDomAssembly` |
| `js/content/first_run_prompt.js` | 172 | `function` | `markComplete` | `promptDismissalAndAck` |
| `js/content/first_run_prompt.js` | 177 | `function` | `init` | `promptEligibilityRequest` |
| `js/content/release_notes_prompt.js` | 27 | `function` | `getPalette` | `promptThemePalette` |
| `js/content/release_notes_prompt.js` | 58 | `function` | `removePrompt` | `promptDismissalAndAck` |
| `js/content/release_notes_prompt.js` | 70 | `function` | `ackAndDismiss` | `promptDismissalAndAck` |
| `js/content/release_notes_prompt.js` | 87 | `function` | `createPrompt` | `promptDomAssembly` |
| `js/content/release_notes_prompt.js` | 237 | `function` | `init` | `promptEligibilityRequest` |

## Lexical Callable Reconciliation

The repo-wide broad callable parser is intentionally permissive. For these two
prompt scripts, the 19 broad-parser matches reconcile to 9 named functions, 1
local `ready` callback, and 9 control-flow artifacts. This register documents
those artifacts so the prompt/onboarding audit remains file-local evidence, and
it does not promote the global method proof count or alter the current 0 complete
per-callable semantic files boundary.

| Source file | Broad parser matches | Runtime callable declarations | Control-flow lexical artifacts | Reconciliation |
| --- | ---: | --- | ---: | --- |
| `js/content/first_run_prompt.js` | 7 | 4 named functions | 3 | Broad `if` matches are parser artifacts, not standalone runtime methods. |
| `js/content/release_notes_prompt.js` | 12 | 5 named functions + 1 local const arrow callback | 6 | Broad `if` matches are parser artifacts; `ready` is a real local callback owned by `init()`. |

| Source file | Source line | Lexical token | Runtime callable? | Evidence |
| --- | ---: | --- | --- | --- |
| `js/content/first_run_prompt.js` | 13 | `if` | no | `if (prefersDark) {` inside `getPalette()`; control-flow artifact from the broad method-shorthand branch. |
| `js/content/first_run_prompt.js` | 179 | `if` | no | `if (resp && resp.needed) {` inside the `FilterTube_FirstRunCheck` callback. |
| `js/content/first_run_prompt.js` | 180 | `if` | no | `if (document.readyState === 'complete' || document.readyState === 'interactive') {` inside the first-run readiness branch. |
| `js/content/release_notes_prompt.js` | 29 | `if` | no | `if (prefersDark) {` inside `getPalette()`; control-flow artifact from the broad method-shorthand branch. |
| `js/content/release_notes_prompt.js` | 60 | `if` | no | `if (existing) {` inside `removePrompt()`. |
| `js/content/release_notes_prompt.js` | 71 | `if` | no | `if (!payloadCache?.version) {` inside `ackAndDismiss()`. |
| `js/content/release_notes_prompt.js` | 149 | `if` | no | `if (targetLink) {` inside release-note DOM assembly. |
| `js/content/release_notes_prompt.js` | 166 | `if` | no | `if (api.runtime.lastError) {` inside the tab-open callback fallback branch. |
| `js/content/release_notes_prompt.js` | 240 | `ready` | yes | `const ready = () => createPrompt(resp.payload);` is a local one-shot readiness callback owned by `init()`. |
| `js/content/release_notes_prompt.js` | 241 | `if` | no | `if (document.readyState === 'complete' || document.readyState === 'interactive') {` inside the release-note readiness branch. |

## Local Callback Inventory

| Source file | Source line | Callback | Owner/effect |
| --- | ---: | --- | --- |
| `js/content/first_run_prompt.js` | 104 | `refreshBtn.onclick = () =>` | Sends first-run completion and calls `window.location.reload()` without waiting for the background response. |
| `js/content/first_run_prompt.js` | 119 | `dismissBtn.onclick = () =>` | Sends first-run completion, adds the closing class, and schedules DOM removal. |
| `js/content/first_run_prompt.js` | 122 | `setTimeout(() => container.remove(), 180)` | Removes the first-run prompt after the close transition. |
| `js/content/first_run_prompt.js` | 140 | `closeBtn.onclick = () =>` | Sends first-run completion, adds the closing class, and schedules DOM removal. |
| `js/content/first_run_prompt.js` | 143 | `setTimeout(() => container.remove(), 180)` | Removes the first-run prompt after the close transition. |
| `js/content/first_run_prompt.js` | 178 | `sendMessage(..., (resp) =>` | Reads first-run eligibility and either renders or registers `DOMContentLoaded`. |
| `js/content/release_notes_prompt.js` | 62 | `setTimeout(() => existing.remove(), 180)` | Removes the release-note prompt after the close transition. |
| `js/content/release_notes_prompt.js` | 78 | `sendMessage(..., () =>` | Removes the release-note prompt and sets local `dismissed = true` after ack callback. |
| `js/content/release_notes_prompt.js` | 162 | `learnBtn.onclick = () =>` | Requests `FilterTube_OpenWhatsNew` and then acknowledges/dismisses release notes. |
| `js/content/release_notes_prompt.js` | 165 | `sendMessage(..., () =>` | Falls back to `window.open()` or `location.href` when the background open reports `lastError`. |
| `js/content/release_notes_prompt.js` | 190 | `dismissBtn.onclick = () => ackAndDismiss()` | Acknowledges and dismisses release notes. |
| `js/content/release_notes_prompt.js` | 205 | `closeBtn.onclick = () => ackAndDismiss()` | Acknowledges and dismisses release notes. |
| `js/content/release_notes_prompt.js` | 238 | `sendMessage(..., (resp) =>` | Reads release-note eligibility and payload before rendering. |
| `js/content/release_notes_prompt.js` | 240 | `const ready = () => createPrompt(resp.payload)` | Defers release-note rendering until `DOMContentLoaded` when needed. |

## Current Entrypoints And Message Actions

```text
manifest.json content script order: release_notes_prompt.js before first_run_prompt.js before content_bridge.js
manifest.firefox.json content script order: release_notes_prompt.js before first_run_prompt.js before content_bridge.js
manifest run_at: document_start
manifest world: ISOLATED in Chromium manifest
install background injection: first_run_prompt.js only
update background injection: first_run_prompt.js only
first-run eligibility action: FilterTube_FirstRunCheck
first-run ack action: FilterTube_FirstRunComplete
release-note eligibility action: FilterTube_ReleaseNotesCheck
release-note ack action: FilterTube_ReleaseNotesAck
release-note tab-open action: FilterTube_OpenWhatsNew
release-note preferred URL: api.runtime.getURL('html/tab-view.html?view=whatsnew')
release-note fallback URL: payload.link
background tab-open URL: request?.url || WHATS_NEW_PAGE_URL
```

The five prompt actions are implemented in the background runtime message
listener. The ack and tab-open branches do not currently require a
prompt-instance capability, sender class, explicit prompt owner id, or URL
allowlist decision beyond using the caller-provided `request.url` fallback
shape.

## Current Behavior Boundaries

```text
cross-prompt coordination: no PromptCoordinator, promptQueue, or activePromptOwner token exists in prompt/background/dashboard source
per-prompt duplicate guard: document.getElementById(PROMPT_ID)
cross-prompt duplicate guard: absent
first-run prompt id: ft-first-run-refresh-prompt
release-note prompt id: ft-release-notes-banner
first-run z-index: 2147483647
release-note z-index: 2147483646
first-run refresh click: sends FilterTube_FirstRunComplete, then reloads current page
first-run dismiss/close click: sends FilterTube_FirstRunComplete, then schedules prompt DOM removal after 180ms
release-note learn click: sends FilterTube_OpenWhatsNew with targetLink, falls back to window.open/location.href on lastError, then acks/dismisses
release-note dismiss/close click: sends FilterTube_ReleaseNotesAck when payloadCache.version exists
release-note payload without version: removePrompt() runs without ack storage write
style element lifecycle: each prompt appends an anonymous style element and removes only the prompt container
install storage shape: firstRunRefreshNeeded true, releaseNotesSeenVersion CURRENT_VERSION, releaseNotesPayload null
update storage shape: releaseNotesPayload payload, firstRunRefreshNeeded true
mobile CSS: both prompts use @media (max-width: 600px) with left/right 12px and width auto
safe-area/visualViewport authority: absent
listeners: two one-shot DOMContentLoaded listeners, no explicit removeEventListener path
observers: none
intervals: none
network/fetch ownership in prompt scripts: none
```

## File-Local Executable Behavior Proof

These VM-backed probes execute the current prompt scripts with fake
`browserAPI_BRIDGE`, `document`, `window`, `location`, and `setTimeout`
surfaces. They prove file-local effects only. They do not prove prompt
priority, sender trust, storage durability, viewport fit, or YouTube page
compatibility.

| Probe | Current behavior proved | Boundary still open |
| --- | --- | --- |
| first-run executable proof: ready document plus needed response creates ft-first-run-refresh-prompt | `FilterTube_FirstRunCheck` with `{ needed: true }` appends one anonymous style node to `document.head` and one `ft-first-run-refresh-prompt` section to `document.body` with z-index `2147483647`. | No cross-prompt owner or viewport fixture. |
| first-run executable proof: Refresh now sends FilterTube_FirstRunComplete and increments reload count without scheduling a timer | Clicking `Refresh now` sends `FilterTube_FirstRunComplete` and calls `window.location.reload()` without waiting for ack and without scheduling prompt removal. | Ack failure and reload race remain unproved. |
| first-run executable proof: Not now adds ft-first-run-closing and schedules one 180ms removal timer | Clicking `Not now` sends `FilterTube_FirstRunComplete`, adds `ft-first-run-closing`, and the scheduled `180` ms callback removes the prompt container. | Anonymous style node teardown remains absent. |
| first-run executable proof: loading document registers one one-shot DOMContentLoaded listener before rendering | With `document.readyState = 'loading'`, first-run does not render immediately and registers one `{ once: true }` `DOMContentLoaded` listener. | No replay or navigation teardown proof. |
| release-note executable proof: Learn click sends FilterTube_OpenWhatsNew to the in-extension What New URL and then FilterTube_ReleaseNotesAck with payload version | Clicking the release-note CTA sends `FilterTube_OpenWhatsNew` with `chrome-extension://filtertube/html/tab-view.html?view=whatsnew`, then sends `FilterTube_ReleaseNotesAck` with the payload version and schedules one `180` ms close timer. | URL authority and background tab-open trust remain unproved. |
| release-note executable proof: payload without version removes the prompt without sending FilterTube_ReleaseNotesAck | Clicking `Got it` with a payload missing `version` adds the closing class and schedules prompt removal, but sends no release ack. | Payload schema provenance and lost-ack reporting remain absent. |
| release-note executable proof: loading document registers one one-shot DOMContentLoaded listener before rendering | With `document.readyState = 'loading'`, release notes do not render immediately and register one `{ once: true }` `DOMContentLoaded` listener. | Cross-prompt queue and replay ownership remain absent. |

## Risk Notes

Reliability risk remains concentrated in independent prompt owners: update can
make the release-note prompt and first-run prompt eligible from separate paths,
while only per-prompt `PROMPT_ID` guards prevent duplicates. The first-run
refresh path marks completion before reload without waiting for the ack result.
The release-note ack path removes UI after a message callback but has no sender
class or prompt instance token in the background ack branch.

False-hide/leak risk is indirect but still relevant: prompt overlays are fixed
top-right DOM nodes on YouTube pages with very high z-index values and anonymous
style nodes that are not removed with the prompt container. This can interfere
with visible page controls or accumulate style nodes during future replay
behavior unless a prompt lifecycle owner is introduced.

Performance/code-burden risk is small per prompt but split across two nearly
parallel DOM builders, two palette functions, two readiness flows, local
dismissal state, and background message branches. The current shape increases
future regression risk when adding coachmarks, replay prompts, release-note
schema changes, or mobile viewport behavior.

## Future Proof Fields

Each prompt/onboarding method row must eventually be backed by source line,
fixture, caller class, and observed positive/negative effect before prompt,
coachmark, release-note, dashboard route, background-message, or content-script
lifecycle behavior changes can claim semantic coverage:

```text
promptMethodReference
sourceFile
sourceLine
semanticGroup
promptOwnerId
promptInstanceId
runtimeWorld
routeSurface
settingsMode
profileTarget
triggerReason
eligibilityAction
ackAction
senderClass
ackAllowed
visibleOwner
blockedByOwner
priority
promptId
styleOwner
viewportFit
zIndexPolicy
navigationTarget
urlClass
urlAllowed
fallbackNavigation
storageKeysWritten
timerBudget
listenerBudget
teardownPolicy
positiveFixture
negativeFixture
```

## Missing Runtime Authorities

These authority/report tokens do not exist in runtime source yet:

```text
promptOnboardingMethodAuthority
promptOnboardingQueueContract
promptOnboardingSenderClassContract
promptOnboardingStorageAckReport
promptOnboardingUrlNavigationPolicy
promptOnboardingDomLifecycleContract
promptOnboardingViewportFitProof
promptOnboardingDuplicateOverlayRegistry
promptOnboardingStyleTeardownRegistry
promptOnboardingFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this method semantic register can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
