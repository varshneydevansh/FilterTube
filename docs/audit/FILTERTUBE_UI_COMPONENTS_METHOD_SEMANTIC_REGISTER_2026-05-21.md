# FilterTube UI Components Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/ui_components.js` from broad UI/settings callable
accounting to a source-derived method inventory. It covers shared UI primitives
used by popup, tab-view, and render-engine paths: buttons, toggles, inputs,
tabs, list rows, checkboxes, selects, enhanced select dropdowns, badges,
channel logos, input rows, profile colors, and toasts.

This is not completion proof for every UI listener callback, keyboard path,
dropdown portal teardown, duplicate enhancement path, raw HTML label/content
input, toast overlap, observer lifetime, frame/timer lifecycle, profile color
contract, accessibility state, or caller-side mutation effect. It is a
current-behavior boundary before shared UI primitive, dropdown, toast,
accessibility, listener, or row-control behavior changes.

## Source-Derived Summary

```text
source file: js/ui_components.js
line count: 998
named declarations: 33
plain function declarations: 22
const arrow helper declarations: 11
async function declarations: 0
public UIComponents entries: 19
semantic method groups: 7
document.createElement calls: 36
document.querySelector calls: 0
document.querySelectorAll calls: 1
querySelector calls: 1
querySelectorAll calls: 3
addEventListener calls: 17
document.addEventListener calls: 1
window.addEventListener calls: 2
setTimeout calls: 3
clearTimeout calls: 0
setInterval calls: 0
clearInterval calls: 0
requestAnimationFrame calls: 4
cancelAnimationFrame calls: 1
MutationObserver constructors: 1
observe calls: 1
disconnect calls: 0
innerHTML writes: 5
textContent writes: 16
setAttribute calls: 21
style.setProperty calls: 6
style.display writes: 3
hidden writes: 4
appendChild calls: 28
remove calls: 4
dispatchEvent calls: 2
getComputedStyle calls: 1
getBoundingClientRect calls: 2
document.body.appendChild calls: 2
window.UIComponents assignments: 1
module.exports references: 2
runtime behavior changed: no
```

## Method Group Counts

```text
uiComponentsButtonAndIconFactory: 5
uiComponentsEnhancedSelectDropdown: 11
uiComponentsInputAndSelectFactory: 4
uiComponentsListAndCardFactory: 5
uiComponentsModuleThemeAndProfile: 4
uiComponentsTabFactory: 3
uiComponentsToastLifecycle: 1
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `uiComponentsModuleThemeAndProfile` | 4 | Exposes the module, reads the current theme attribute, hashes profile seeds, and returns profile color tokens. | Theme read contract, profile color collision fixture, dark/light parity proof, and caller ownership. |
| `uiComponentsButtonAndIconFactory` | 5 | Creates primary/icon/delete/toggle controls, binds caller click/toggle handlers, writes SVG/icon HTML, and flashes success state with a timer. | Raw HTML policy, keyboard/click equivalence, button flash race proof, and teardown ownership for caller listeners. |
| `uiComponentsInputAndSelectFactory` | 4 | Creates inputs, search inputs, checkboxes, and plain selects with caller-owned input/change/keypress handlers. | Caller mutation contract, disabled-state fixture, IME/Enter-key policy, and listener idempotence proof. |
| `uiComponentsTabFactory` | 3 | Creates tab buttons and panes, writes tab label/content HTML when strings are supplied, and toggles active/ARIA state. | Raw HTML label/content boundary, dynamic tab replacement proof, keyboard tab navigation proof, and hidden-pane state fixtures. |
| `uiComponentsListAndCardFactory` | 5 | Builds list rows, empty states, badges, channel logos, and input rows using nested UI primitive helpers. | Row action provenance, logo fallback/onerror proof, icon/title accessibility proof, and caller state dependency manifest. |
| `uiComponentsEnhancedSelectDropdown` | 11 | Hides a native select, appends a dropdown portal to `document.body`, mirrors selected labels, positions through animation frames, observes disabled changes, dispatches change/input events, and binds window/document listeners. | Portal teardown, observer disconnect, duplicate enhancement proof, scroll/resize listener budget, focus/keyboard trap, option rebuild performance, and disabled-state no-op fixtures. |
| `uiComponentsToastLifecycle` | 1 | Removes existing `.ft-toast` nodes, appends a new toast to `document.body`, animates it through a frame, and removes it through nested timers. | Toast replacement authority, duration race proof, reduced-motion/accessibility fixture, and timer cleanup budget. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 6 | `const arrow` | `UIComponents` | `uiComponentsModuleThemeAndProfile` |
| 26 | `function` | `isDarkTheme` | `uiComponentsModuleThemeAndProfile` |
| 34 | `function` | `hashHue` | `uiComponentsModuleThemeAndProfile` |
| 43 | `function` | `getProfileColors` | `uiComponentsModuleThemeAndProfile` |
| 82 | `function` | `createButton` | `uiComponentsButtonAndIconFactory` |
| 97 | `function` | `flashButtonSuccess` | `uiComponentsButtonAndIconFactory` |
| 133 | `function` | `createToggleButton` | `uiComponentsButtonAndIconFactory` |
| 164 | `function` | `createDeleteButton` | `uiComponentsButtonAndIconFactory` |
| 193 | `function` | `createInput` | `uiComponentsInputAndSelectFactory` |
| 222 | `function` | `createSearchInput` | `uiComponentsInputAndSelectFactory` |
| 244 | `function` | `createTabs` | `uiComponentsTabFactory` |
| 286 | `function` | `switchTab` | `uiComponentsTabFactory` |
| 304 | `function` | `getCurrentTab` | `uiComponentsTabFactory` |
| 331 | `function` | `createListItem` | `uiComponentsListAndCardFactory` |
| 367 | `function` | `createEmptyState` | `uiComponentsListAndCardFactory` |
| 389 | `function` | `createCheckbox` | `uiComponentsInputAndSelectFactory` |
| 448 | `function` | `createSelect` | `uiComponentsInputAndSelectFactory` |
| 468 | `function` | `createDropdownFromSelect` | `uiComponentsEnhancedSelectDropdown` |
| 503 | `const arrow` | `updateTriggerLabel` | `uiComponentsEnhancedSelectDropdown` |
| 518 | `const arrow` | `close` | `uiComponentsEnhancedSelectDropdown` |
| 527 | `const arrow` | `syncDisabled` | `uiComponentsEnhancedSelectDropdown` |
| 538 | `const arrow` | `position` | `uiComponentsEnhancedSelectDropdown` |
| 599 | `const arrow` | `schedulePosition` | `uiComponentsEnhancedSelectDropdown` |
| 608 | `const arrow` | `toggle` | `uiComponentsEnhancedSelectDropdown` |
| 645 | `const arrow` | `resolveContextSubtitle` | `uiComponentsEnhancedSelectDropdown` |
| 665 | `const arrow` | `getAccentVars` | `uiComponentsEnhancedSelectDropdown` |
| 696 | `const arrow` | `applyAccentVars` | `uiComponentsEnhancedSelectDropdown` |
| 703 | `const arrow` | `rebuildOptions` | `uiComponentsEnhancedSelectDropdown` |
| 860 | `function` | `createIconButton` | `uiComponentsButtonAndIconFactory` |
| 882 | `function` | `createBadge` | `uiComponentsListAndCardFactory` |
| 898 | `function` | `createChannelLogo` | `uiComponentsListAndCardFactory` |
| 922 | `function` | `createInputRow` | `uiComponentsListAndCardFactory` |
| 940 | `function` | `showToast` | `uiComponentsToastLifecycle` |

## Current Public API Surface

```text
Colors
getProfileColors
createButton
flashButtonSuccess
createToggleButton
createDeleteButton
createInput
createSearchInput
createCheckbox
createSelect
createDropdownFromSelect
createIconButton
createBadge
createChannelLogo
createInputRow
createTabs
createListItem
createEmptyState
showToast
```

## Current Selector Surface

```text
tabButtons.querySelectorAll('.tab-button')
tabContent.querySelectorAll('.tab-pane')
container.querySelector('.label, .toggle-title')
document.querySelectorAll('.ft-toast')
```

## Current Entrypoints And Dependencies

```text
module entrypoint: const UIComponents = (() => { ... })()
browser global write: window.UIComponents = UIComponents
CommonJS export: module.exports = UIComponents
DOM portal writes: document.body.appendChild(dropdown), document.body.appendChild(toast)
enhanced-select event bridge: select.dispatchEvent(change), select.dispatchEvent(input)
theme dependency: document.documentElement[data-theme]
profile accent dependency: CSS custom properties on document.documentElement
```

## Future Proof Fields

Each UI component method row must eventually be backed by a source line,
fixture, and observed UI/runtime effect before shared UI behavior changes can
claim semantic coverage:

```text
methodReference
sourceLine
semanticGroup
publicApiEntry
callerSurface
domElementsCreated
selectorsRead
innerHtmlInput
listenersRegistered
listenerTeardown
timerEffect
frameEffect
observerEffect
bodyPortalEffect
dispatchEventEffect
ariaRoleEffect
classStateEffect
styleWriteEffect
profileColorSeed
toastReplacementEffect
positiveFixture
negativeDisabledFixture
negativeKeyboardFixture
negativeTeardownFixture
performanceBudget
fixtureProvenance
```

## Missing Runtime Authorities

These names intentionally do not exist in runtime source yet. They name the
contracts that would be needed before implementation changes can be treated as
covered:

```text
uiComponentsMethodAuthority
uiComponentsDomEffectReport
uiComponentsListenerLifecycleContract
uiComponentsDropdownTeardownRegistry
uiComponentsToastLifecycleBudget
uiComponentsAccessibilityContract
uiComponentsSelectorScopeReport
uiComponentsPublicApiManifest
uiComponentsRawHtmlPolicy
uiComponentsProfileColorContract
uiComponentsFixtureProvenance
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
