# FilterTube Lifecycle Owner Matrix - 2026-05-18

Status: current-behavior audit artifact. This is not an implementation patch.

This matrix promotes repo-wide lifecycle primitive counts into owner-level
audit rows. The purpose is to show which subsystem currently owns listeners,
observers, timers, messages, network calls, synthetic clicks, and direct visual
side effects, and what proof is still missing before any cleanup or optimization
work can be trusted.

## Required Owner Contract

Every lifecycle or side-effect owner eventually needs:

```text
owner id
source files and routes
active-state gate
pause rule for fullscreen/native overlays/hidden tabs when relevant
teardown or documented page-lifetime reason
side-effect reason for display/class/click/dispatch/network/message work
fixture proving no-rule and feature-hidden budgets
```

Current source has no shared `lifecycleRegistry`, `registerLifecycle`,
`observerRegistry`, `timerRegistry`, `sideEffectRegistry`, `disposeAll`, or
`teardownAll` authority.

## Owner Matrix

| Owner | Files | Current primitive evidence | Missing proof |
| --- | --- | --- | --- |
| Seed network owner | `js/seed.js` | Patches `XMLHttpRequest` prototype, posts seed/runtime messages, and owns delayed replay. | Endpoint policy, no-parse pass-through, and restore/page-lifetime reason. |
| Content bridge prefetch/hydration owner | `js/content_bridge.js` | Owns `IntersectionObserver`, mutation observers, navigation/scroll/visibility listeners, page messages, extension messages, direct fetches, direct hides, and synthetic events. | `needsIdentityHarvest` gate, route pause/teardown, message trust, and structured side-effect reasons. |
| Fallback menu owner | `js/content_bridge.js` | Owns mutation observation, warmup interval, click/scroll/navigation listeners, fallback buttons, and direct row hides. | Shared affordance gate with normal menu, list-mode gate, teardown owner, and no-rule budget. |
| Quick block owner | `js/content/block_channel.js` | Owns 34 listener installs, 6 mutation observers, periodic interval, hover/focus timers, resize/orientation lifecycle, direct hide after block, and extension messages. | Feature-enabled gate before lifecycle install, fullscreen pause, interval cleanup, and route-scoped selector ownership. |
| Normal/Kids menu owner | `js/content/block_channel.js` | Owns global menu click listeners, dropdown mutation observers, Kids passive listener, and block action messages. | Shared teardown and shared action gate with fallback menu. |
| DOM fallback owner | `js/content/dom_fallback.js` | Owns playlist/media guards, delayed passes, synthetic playlist clicks, class cleanup, and route-sensitive fallback work. | Compiled active-rule gate, route teardown, and side-effect reason for pause/click/class operations. |
| Collaborator dialog owner | `js/content/collab_dialog.js` | Owns capture-phase click/keydown listeners, pending trigger timer, document mutation observer, and page messages. | Request ownership, teardown/disconnect, and collaborator-needed active gate. |
| Injector/page-world owner | `js/injector.js` | Owns page message bridge, subscription import scroll/click/fetch side effects, readiness interval, and runtime settings delivery. | Capability token, source trust, import-only side-effect budget, and seed-apply revision gate. |
| Background authority owner | `js/background.js` | Owns map flush timers, backup/restore timers, direct YouTube/Kids fetches, tab broadcasts, and settings-cache messages. | Trusted sender class, finite/range validation, mutation report, and background-owned settings revision. |
| Dashboard UI owner | `js/tab-view.js` | Owns 147 listener installs, dashboard rotation interval, 14 timeouts, 22 direct display writes, 28 class mutations, import/export/Nanah/profile row actions, and runtime messages. | UI listener idempotence, save queue, explicit mutation intent, and visual-state ownership. |
| Popup UI owner | `js/popup.js` | Owns 30 listener installs, popup profile/filter mutation actions, direct display/class state, and runtime message calls. | Popup/tab parity, lock/profile action boundaries, and UI lifecycle idempotence. |
| State/import owner | `js/state_manager.js`, `js/io_manager.js`, `js/nanah_sync_adapter.js` | Owns delayed reloads, tab/runtime messages, backup timers, import/export writes, and Nanah apply paths. | Shared mutation report, queued saves, schema validation, and runtime revision broadcast proof. |
| Quarantined legacy owner | `js/layout.js`, legacy content CSS | `js/layout.js` alone has 34 direct display writes and 3 class mutations. | Quarantine guard and release-package proof that legacy layout/default-hide paths are not active coverage. |
| Vendor transport owner | `js/vendor/nanah.bundle.js`, `js/vendor/qrcode.bundle.js` | Nanah bundle owns 8 listener installs for WebSocket/WebRTC channel events. | Vendor/source hash proof and no hand-edit policy. |
| Generated shell owner | `js/ui-shell/*.js`, `src/extension-shell/**` | Generated output owns listener/remove-listener pairs plus shell display/class mutations. | Generated freshness proof and source/output parity. |
| Website client owner | `website/components/theme-toggle.js`, website components | Theme toggle owns storage/theme listeners, removals, and dispatch events; website components are much smaller than extension UI but still client lifecycle. | Website media/analytics/animation budget and route-level public claim proof. |

## Current Cross-Owner Findings

| Finding | Evidence | Risk |
| --- | --- | --- |
| No single owner registry exists. | No shared lifecycle/side-effect registry symbols exist across tracked JS. | Cleanup can stay local and miss other active owners. |
| Page runtime is split across several owners. | Seed, bridge, quick block, fallback menu, DOM fallback, collaborator, and injector each install page-lifetime work. | Empty installs and fullscreen/route changes can still wake unrelated work. |
| UI/background source is the largest lifecycle burden by primitive count. | `extension-ui-background-js` has 417 primitives versus `content-runtime-js` at 347. | Runtime fixes alone cannot prove settings/profile/import/Nanah consistency. |
| Direct visual side effects are multi-owner. | `content_bridge.js`, `tab-view.js`, `popup.js`, `ui_components.js`, `dom_fallback.js`, `dom_helpers.js`, and `layout.js` all write display/class state. | False-hide recovery needs one reason/restore vocabulary. |
| Quarantined/generated/vendor code needs proof, not edits. | `js/layout.js`, generated shell output, and vendor bundles all carry lifecycle/side-effect primitives. | Accidental reactivation or stale generated/vendor output can bypass product-source fixes. |

## Next Proof Gates

1. Add owner-level fixtures for every page-runtime owner before deleting or
   moving any observer/listener/timer.
2. Add UI/background mutation-owner fixtures before changing settings,
   import/export, Nanah, or simultaneous allow/block behavior.
3. Add a structured side-effect reason contract for direct display, class,
   click, dispatch, fetch, and message operations.
4. Add quarantine/freshness checks for `js/layout.js`, legacy CSS, generated
   shell output, and vendor bundles.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this lifecycle owner matrix can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
