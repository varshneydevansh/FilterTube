# FilterTube Popup Lifecycle Selector Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof. This is not an implementation patch.

This slice narrows the popup audit from method semantics into direct lifecycle, selector, dynamic DOM, runtime-message, and external-open proof for `js/popup.js` and `html/popup.html`. It does not prove that popup listeners, timers, selectors, list-mode controls, profile-lock paths, or generated shell markup can be optimized yet.

## Source Boundary

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/popup.js` | 1841 | 75587 | `cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a` |
| `html/popup.html` | 31 | 1213 | `c5e03a38b2737dbd01e2cd0c243b37754936e2e349e9d2275b195350159aea31` |

The runtime proof is `tests/runtime/popup-lifecycle-selector-boundary-current-behavior.test.mjs`.

## Current Lifecycle Primitive Totals

The `js/popup.js` hot file currently contains 33 lifecycle primitives:

| Primitive | Count |
| --- | ---: |
| `.addEventListener(` | 30 |
| `.removeEventListener(` | 0 |
| `MutationObserver` | 0 |
| `IntersectionObserver` | 0 |
| `setInterval(` | 0 |
| `clearInterval(` | 0 |
| `setTimeout(` | 2 |
| `clearTimeout(` | 0 |
| `requestAnimationFrame(` | 1 |
| `cancelAnimationFrame(` | 0 |

Additional listener-like and transport/open surfaces:

| Surface | Count |
| --- | ---: |
| `document.addEventListener(` | 3 |
| `window.addEventListener(` | 0 |
| `StateManager.subscribe(` | 2 |
| `sendRuntimeMessage(` tokens | 4 |
| `.runtime.sendMessage(` callsites | 1 |
| `window.open(` callsites | 5 |

Current interpretation: popup has no local observer or interval work, but it still has page-lifetime popup document listeners, delayed video-filter binding, profile dropdown global listeners, a runtime message helper, dynamic list-mode mutation controls, open-in-tab fallbacks, and two `StateManager.subscribe(...)` callbacks.

## Current DOM Selector Boundary

| Selector family | Count |
| --- | ---: |
| `document.getElementById("...")` tokens | 52 |
| Unique `getElementById` literal ids | 23 |
| Static `id="..."` tokens in `html/popup.html` | 1 |
| Unique static HTML ids | 1 |
| JS literal ids not present as static HTML ids | 23 |
| Static HTML ids not directly reached by JS `getElementById` literals | 1 |
| `.querySelector(` tokens | 4 |
| `.querySelectorAll(` tokens | 6 |
| `document.createElement(` tokens | 82 |
| `.innerHTML =` writes | 5 |

The only static HTML id is `popupRoot`, and it is not directly reached by `js/popup.js` through `document.getElementById(...)`. Popup runtime selectors depend on generated shell markup and dynamic DOM built by `initializePopupFiltersTabs()`, not on static `html/popup.html` alone.

The current 23 JS id literals outside static HTML are:

```text
addChannelBtn
addKeywordBtn
channelInput
channelList
extensionStatusText
ftProfileBadgeBtnPopup
ftProfileDropdownPopup
ftProfileMenuPopup
ftTopBarListModeControlsPopup
keywordList
newKeywordInput
openInTabBtn
popupFiltersTabsContainer
popupVideoFilter_duration_enabled
popupVideoFilter_duration_enabled_kids
popupVideoFilter_uploadDate_enabled
popupVideoFilter_uploadDate_enabled_kids
popupVideoFilter_uppercase_enabled
popupVideoFilter_uppercase_enabled_kids
searchChannelsPopup
searchContentControlsPopup
searchKeywordsPopup
toggleEnabledBrandBtn
```

## Selected Source/Effect Blocks

These blocks overlap intentionally. They pin the current hotspots that matter before any popup lifecycle or selector optimization.

| Block | Lines | Bytes | Key current facts |
| --- | ---: | ---: | --- |
| filters tabs dynamic DOM | 599 | 26836 | 7 listener installs, 1 delayed binding timer, 34 id lookups, 55 `createElement` calls, 3 `innerHTML` writes, 2 `window.open` fallbacks, and 1 StateManager subscription. |
| video filter delayed binding cluster | 87 | 4269 | 7 listener installs after a 100 ms delay, 6 id lookups, 2 `window.open` fallbacks, and 1 StateManager subscription. |
| DOMContentLoaded bootstrap | 1232 | 48499 | 23 listener installs, 1 timer, 1 animation frame, 18 id lookups, 4 query selectors, 6 querySelectorAll calls, 4 `sendRuntimeMessage` tokens, 1 `.runtime.sendMessage` callsite, 3 `window.open` fallbacks, 27 `createElement` calls, and 2 `innerHTML` writes. |
| runtime message helper | 29 | 1155 | 1 `sendRuntimeMessage` helper token and 1 `.runtime.sendMessage` callsite. |
| list mode controls | 172 | 7911 | 2 listener installs, 2 runtime message helper tokens, 1 `createElement`, and 1 `innerHTML` write. |
| profile dropdown lifecycle | 34 | 1320 | 1 animation-frame position pass for popup dropdown layout. |
| prompt modal lifecycle | 101 | 3530 | 4 listener installs, 1 focus timer, and 11 dynamic elements. |
| state subscription render cluster | 27 | 862 | 1 `StateManager.subscribe(...)` callback for UI render refresh. |
| profile badge global listeners | 24 | 719 | 3 listener installs for badge click, document click, and Escape key close. |
| search and mutation listeners | 100 | 3501 | 8 listener installs and 1 id lookup for search, row add, enter-key, and checkbox changes. |
| open tab enabled toggle listeners | 50 | 2203 | 3 listener installs and 3 `window.open` fallbacks. |

## Current Behavior Pinned

- `html/popup.html` is a shell with `#popupRoot`; popup working controls are generated by the UI shell and `initializePopupFiltersTabs()`.
- `initializePopupFiltersTabs()` builds keyword, channel, content-control, and popup video-filter controls dynamically.
- Video filter controls bind after a fixed 100 ms delay, then resolve active tab profile type before writing Main or Kids content filter flags.
- Popup has 30 listener installs and 0 remove paths; those listeners are popup-document lifetime today.
- List-mode controls send `FilterTube_SetListMode` or `FilterTube_TransferWhitelistToBlocklist` through the local runtime message helper.
- Profile unlock and profile switch are UI-local and rely on `FilterTubeSecurity`, IO helpers, and `StateManager.loadSettings()` rather than a shared popup mutation report.
- Popup open-in-tab flows use `runtime.getURL('html/tab-view.html')` when available and fall back to `window.open(..., 'noopener,noreferrer')`.
- Popup selector proof cannot be derived from static HTML because every direct JS id literal is outside the static HTML id set.

## Reliability, False-Hide/Leak, Performance, And Code-Burden Risks

| Risk | Current proof | Why it remains open |
| --- | --- | --- |
| Listener lifetime is popup-page lifetime. | 30 listener installs and 0 removeEventListener callsites. | Popup closes quickly, but duplicate bootstrap, generated shell reinjection, modal handlers, and delayed bindings still need owner/idempotence reports before cleanup. |
| Static selector proof is weak. | 23 unique JS id literals are absent from static HTML while 82 `createElement` calls and 5 `innerHTML` writes generate UI. | Future refactors need generated shell parity and dynamic id provenance before deleting or renaming selectors. |
| Delayed binding is timing-based. | Video filter controls bind through one 100 ms `setTimeout`. | There is no popup DOM readiness report proving the controls exist at that delay in every browser/package mode. |
| List-mode mutation path is UI-local. | List-mode controls send runtime messages through a local helper and rerender after `StateManager.loadSettings()`. | Future list-mode changes need mutation reports, lock reports, sender policy, and rollback evidence. |
| External open fallback is duplicated. | 5 `window.open` callsites exist in popup source. | This needs URL class and open-policy reports before centralizing or changing popup open behavior. |
| Code-burden concentrates dynamic UI setup. | `initializePopupFiltersTabs()` is 599 lines and the `DOMContentLoaded` bootstrap is 1232 lines. | The generated shell, dynamic tab construction, profile gate, list-mode controls, content-control filtering, and open flows are coupled. |

## Missing Future Authority

No product source currently defines:

- `popupLifecycleSelectorBoundaryContract`
- `popupLifecycleDecisionReport`
- `popupSelectorAuthorityReport`
- `popupDynamicIdProvenanceReport`
- `popupGeneratedShellParityReport`
- `popupListenerOwnerReport`
- `popupDelayedBindingBudgetReport`
- `popupRuntimeMessagePolicy`
- `popupListModeMutationReport`
- `popupProfileLockMutationReport`
- `popupExternalOpenPolicy`
- `popupLifecycleFixtureProvenance`

## Current Verdict

```text
Completion is not proven.
The popup lifecycle/selector boundary is current-behavior proof only.
It moves the audit closer to every DOM selector and every runtime listener/timer,
but it does not authorize optimizing, merging, or deleting popup lifecycle work.
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this profile/settings/UI surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6161
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6161
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
