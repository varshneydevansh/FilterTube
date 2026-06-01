# FilterTube UI Components Portal Lifecycle Boundary - 2026-05-22

Status: audit-only current-behavior boundary. This is not an implementation patch.
Runtime behavior is unchanged.

This slice pins the current shared UI component lifecycle around transient button
success timers, enhanced select body portals, dropdown frame scheduling, dropdown
listeners, disabled-state observation, synthetic select events, and toast timers.
It extends runtime observer/listener/timer, DOM selector, extension UI,
settings-mode surface, reliability, leak, performance, code-burden,
cross-feature, and implementation-change rows for `js/ui_components.js`.

Runtime proof:

```text
tests/runtime/ui-components-portal-lifecycle-boundary-current-behavior.test.mjs
```

## Source Fingerprints

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/ui_components.js` | 998 | 37,002 | `5913af4a42b2e93909867c1e9d588677ae71d7b2bd53d4c331e004a14eb3305a` |

## Source / Effect Blocks

| Block | Source | Start line | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| `flashButtonSuccess` | `js/ui_components.js:97` | 97 | 26 | 1,132 | `72c69e2c9b35e7dc2311596c4fa91aa867f280afa0d4d66bd8acbaa616554f9d` |
| `createDropdownFromSelect` | `js/ui_components.js:468` | 468 | 378 | 14,973 | `14ad6c416f24a271430a7f53765a4540edd94164ee2c07f824e30f9e25a25465` |
| `showToast` | `js/ui_components.js:940` | 940 | 20 | 633 | `58749cb49277d5c82b9ab48fc467e364c9ffada37de32712a6f7960173ce7032` |

## Selected Token Counts

```text
UI components portal lifecycle source files pinned | 1
UI components portal lifecycle source/effect blocks pinned | 3
selected document.createElement tokens | 10
selected document.body.appendChild tokens | 2
selected addEventListener tokens | 7
selected window.addEventListener tokens | 2
selected document.addEventListener tokens | 1
selected setTimeout tokens | 3
selected clearTimeout tokens | 0
selected requestAnimationFrame tokens | 4
selected cancelAnimationFrame tokens | 1
selected MutationObserver tokens | 1
selected observe tokens | 1
selected disconnect tokens | 0
selected querySelector tokens | 1
selected querySelectorAll tokens | 1
selected closest tokens | 2
selected innerHTML writes | 1
selected textContent writes | 8
selected dispatchEvent tokens | 2
selected remove tokens | 4
selected hidden writes | 4
selected style.display writes | 3
selected dataset ftSelectEnhanced tokens | 2
selected btn-success-flash tokens | 2
selected ft-toast literal tokens | 3
selected .ft-toast selector tokens | 1
selected ft-select-menu tokens | 2
selected aria-expanded tokens | 4
selected aria-disabled tokens | 1
selected aria-selected tokens | 1
selected role listbox tokens | 1
selected role option tokens | 1
selected teardownRegistry tokens | 0
selected removeEventListener tokens | 0
```

## Runtime Fixtures Pinned

```text
ui_components_portal_lifecycle_doc_records_audit_only_boundary
ui_components_source_fingerprint_and_blocks_remain_current
ui_components_portal_lifecycle_token_counts_remain_current
ui_components_dropdown_portal_current_behavior_is_pinned
ui_components_transient_timer_current_behavior_is_pinned
ui_components_portal_lifecycle_authority_symbols_are_absent_from_runtime_source
```

## Current Findings

| Boundary | Current behavior | Current proof | Risk before shared UI lifecycle changes |
| --- | --- | --- | --- |
| Button success timer | `flashButtonSuccess()` stores original text in `button.dataset.originalText`, mutates text/styles/classes, then restores through one `setTimeout()`. | `flashButtonSuccess`. | Repeated calls can share one dataset key and have no cancel/owner report before a button is removed or repurposed. |
| Enhanced select duplicate guard | `createDropdownFromSelect()` returns `null` when `select.dataset.ftSelectEnhanced === 'true'` or when the select is already inside `.ft-select-menu`. | `createDropdownFromSelect`. | The guard is local and not a shared duplicate-enhancement policy for generated popup/tab controls. |
| Body portal ownership | The enhanced dropdown is appended to `document.body`, while the select is moved into a wrapper inserted at the original parent. | `createDropdownFromSelect`. | Portal lifetime is not tied to caller teardown, page navigation, or wrapper removal. |
| Dropdown listeners | The enhanced select installs trigger click, window resize, window scroll, document click, select change, select input, and per-option click listeners. | Selected token counts and `createDropdownFromSelect`. | The selected block has 7 listener registrations and 0 `removeEventListener` tokens, so leak/duplicate proofs cannot be inferred from local source alone. |
| Dropdown frame scheduling | The dropdown positions through `requestAnimationFrame()`, double-frame opening, and `cancelAnimationFrame()` only for one pending position frame on close. | `createDropdownFromSelect`. | Frame work has no route/surface budget or caller-level disposal report. |
| Disabled-state observer | The block creates one `MutationObserver`, observes the select `disabled` attribute, and has no local `disconnect()` path. | `createDropdownFromSelect`. | Observer lifetime is page/control lifetime today rather than an explicit teardown authority. |
| Synthetic select events | Option clicks set `select.value` and dispatch `change` plus `input` events. | `createDropdownFromSelect`. | Caller mutation effects are not classified by settings/profile/list-mode authority at the UI component layer. |
| Toast replacement and timers | `showToast()` removes existing `.ft-toast` nodes, appends a new body toast, animates through one frame, and removes through nested timers. | `showToast`. | Toast overlap is avoided by removal, but timer ownership and duration races are not budgeted or tied to caller disposal. |

## Required Future Authority Before Behavior Changes

No selected product runtime source currently defines:

```text
uiComponentsPortalLifecycleContract
uiComponentsDropdownPortalRegistry
uiComponentsDropdownListenerOwnerReport
uiComponentsDropdownObserverTeardownReport
uiComponentsFrameBudgetReport
uiComponentsToastTimerBudget
uiComponentsTransientButtonTimerReport
uiComponentsDuplicateEnhancementPolicy
uiComponentsBodyPortalCleanupProof
uiComponentsAccessibilityStateReport
uiComponentsFixtureProvenance
uiComponentsLifecycleMetricArtifact
```

## Current Verdict

```text
Shared UI component portal and transient timer behavior is proof-pinned.
Enhanced select dropdowns and toasts currently own body portals and timers without a shared teardown registry.
Runtime behavior remains unchanged.
```

This does not close runtime observer/listener/timer, DOM selector, extension UI,
settings-mode, reliability, leak, performance, code-burden, cross-feature, or
implementation-change rows. It adds current-behavior evidence only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this UI components portal lifecycle boundary
can support runtime optimization or JSON-first promotion. Current proof pins:

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
