# FilterTube Collaborator Dialog Lifecycle - 2026-05-19

Status: current-behavior audit artifact only. This document does not change
runtime behavior.

## Why This Exists

Collaborator recovery is not only a JSON renderer problem. The content runtime
also has a separate dialog helper in `js/content/collab_dialog.js` that watches
for YouTube collaborator dialogs, maps them back to pending cards, stamps
collaborator metadata, and broadcasts page messages.

That helper is useful for 3-dot collaboration menus, but it is also another
page-resident lifecycle owner. It needs explicit proof before future cleanup or
optimization changes touch collaborator, Mix, whitelist, quick/menu, or DOM
fallback behavior.

## Current Lifecycle Shape

```text
content_bridge.js
  -> marks card data-filtertube-collab-awaiting-dialog="true"
  -> stores entry in window.pendingCollabCards
  -> may call window.collabDialogModule.applyCollaboratorsToCard(...)

collab_dialog.js
  -> waits for DOMContentLoaded, then calls refreshCollabDialogRuntime()
  -> installs capture click/keydown listeners only when pending cards exist
  -> installs document-wide MutationObserver only when pending cards exist
  -> watches added tp-yt-paper-dialog nodes
  -> extracts yt-list-item-view-model collaborators
  -> applies data-filtertube-collaborators to cards
  -> postMessages FilterTube_CollabDialogData
  -> removes listeners and disconnects observer when no pending cards remain
```

## Current Findings

| Area | Current behavior | Risk |
| --- | --- | --- |
| Boot timing | Initialization is still attached to `DOMContentLoaded` with no `document.readyState` branch, but it now calls `refreshCollabDialogRuntime()` instead of unconditionally arming listeners and observer work. | A late-loaded content script still needs content-bridge refresh calls to arm dialog recovery if pending cards already exist. |
| Trigger listeners | `click` and `keydown` capture listeners are installed on `document` only while `window.pendingCollabCards` has entries, and `removeCollabTriggerListeners()` removes both listeners when pending cards drain. | Listener lifetime is improved, but pending-card ownership is still split across content bridge and dialog helper. |
| Dialog observer | One document-wide `MutationObserver` watches `documentElement || body` with `childList` and `subtree` only while pending cards exist; `disconnectCollabDialogObserver()` disconnects it when pending cards drain. | Observer work is now gated, but route/profile/list-mode authority and explicit no-work counters are still missing. |
| Pending trigger timer | Pending trigger state uses a 5 second timeout and shared `window.pendingCollabCards` state. | Pending-card lifecycle is split between `content_bridge.js` and `collab_dialog.js`. |
| Dialog acceptance | `handleCollaborationDialog()` rejects non-collab titles, but a dialog with no heading text can still proceed to list extraction. | A future selector change needs strict title/header fixtures before broadening dialog handling. |
| Card mutation | `applyCollaboratorsToCard()` writes collaborator attributes, clears pending markers, updates `resolvedCollaboratorsByVideoId`, refreshes active collaboration menu, and posts a page message. | Collaborator recovery is a learned-identity mutation path, not a passive UI helper. |

## Required Future Gate

Before changing this helper, add a lifecycle/identity authority that records:

- compiled active state requiring collaborator recovery,
- route/surface and menu affordance reason,
- pending card key ownership,
- dialog title/header acceptance result,
- observer/listener owner and teardown or page-lifetime reason,
- page-message trust boundary,
- exact card attributes mutated,
- DOM fallback rerun budget.

## Proof Fixture

Executable current-behavior proof lives in:

```text
tests/runtime/collab-dialog-lifecycle-current-behavior.test.mjs
```

It pins boot timing, pending-card-gated listener/observer setup, shared
pending-card state, dialog acceptance behavior, card mutation side effects, and
the lack of a central collaborator-dialog lifecycle authority today.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this menu/dialog/injector/quick-block
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, menu action behavior, dialog lifecycle
behavior, injector behavior, quick-block behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
