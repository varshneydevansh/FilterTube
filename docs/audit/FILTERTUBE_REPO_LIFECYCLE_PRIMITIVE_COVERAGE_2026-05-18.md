# FilterTube Repo Lifecycle Primitive Coverage - 2026-05-18

Status: current-behavior audit artifact. This is not an implementation patch.

This file expands lifecycle proof from the hottest page-runtime files to the
whole tracked JavaScript source surface. The goal is to keep observers,
listeners, timers, message bridges, network calls, synthetic clicks, and direct
DOM side effects measurable before any cleanup changes.

## Source Boundary

Authoritative source command:

```bash
git ls-files '*.js' '*.jsx' '*.mjs'
```

Current tracked JS/JSX/MJS count:

```text
69
```

Ignored root captures and generated package output are excluded. Vendor bundles
are counted separately from product-authored runtime code because their
listener behavior is still packaged but should not be edited by hand.

## Primitive Families

The coverage test scans for these conservative lexical primitives:

- `addEventListener` / `removeEventListener`
- `new MutationObserver` / `new IntersectionObserver`
- `setInterval` / `clearInterval`
- `setTimeout` / `clearTimeout`
- `requestAnimationFrame` / `cancelAnimationFrame`
- `fetch(` / `XMLHttpRequest`
- `.postMessage(` / `.sendMessage(`
- `.dispatchEvent(` / `.click(`
- `.style.display =`
- `.classList.add/remove/toggle(`

These are lexical counts, not runtime frequency. They prove where lifecycle and
side-effect ownership exists; behavior fixtures are still needed before
changing any owner.

## Current Totals

| Primitive | Count | Audit meaning |
| --- | ---: | --- |
| `addEventListener` | 300 | Listener lifecycle surface. |
| `removeEventListener` | 18 | Explicit listener teardown surface. |
| `MutationObserver` | 16 | DOM mutation observation surface. |
| `IntersectionObserver` | 4 | Visibility/identity prefetch observation surface. |
| `setInterval` | 4 | Repeating work surface. |
| `clearInterval` | 5 | Repeating work teardown surface. |
| `setTimeout` | 124 | Delayed/debounced/retry work surface. |
| `clearTimeout` | 34 | Delayed work teardown surface. |
| `requestAnimationFrame` | 31 | Paint-frame scheduling surface. |
| `cancelAnimationFrame` | 4 | Paint-frame teardown surface. |
| `fetch(` | 14 | Direct network side-effect surface. |
| `XMLHttpRequest` | 2 | Prototype/network interception surface. |
| `.postMessage(` | 26 | Page-world message bridge surface. |
| `.sendMessage(` | 35 | Extension runtime/tab message surface. |
| `.dispatchEvent(` | 33 | Synthetic event surface. |
| `.click(` | 33 | Synthetic click/navigation surface. |
| `.style.display =` | 96 | Direct visual hide/show side-effect surface. |
| `.classList.add/remove/toggle(` | 110 | Class-based visual/state side-effect surface. |
| **Total** | **889** | Conservative lifecycle/side-effect primitive count. |

## Family Breakdown

| Audit family | Files | Primitive count | Current interpretation |
| --- | ---: | ---: | --- |
| `content-runtime-js` | 17 | 389 | Page-resident filtering, JSON interception, DOM fallback, quick/menu surfaces, learned identity, managed time-limit heartbeats, and bridge work. |
| `extension-ui-background-js` | 11 | 420 | Dashboard/popup/background settings, import/export, Nanah, row actions, profile/PIN, and UI state work. |
| `quarantined-legacy-js` | 1 | 37 | `js/layout.js`; direct style/class mutation risk if ever reactivated. |
| `website-components` | 15 | 24 | Website client components with theme/scene and hero/footer lifecycle; separate from extension runtime filtering. |
| `generated-ui-output` | 2 | 8 | Generated shell output; freshness proof required rather than hand edits. |
| `vendor-bundles` | 2 | 8 | Packaged vendor/runtime listener surface, especially Nanah transport. |
| `generated-ui-source` | 3 | 2 | Shell source visual-state writes. |
| `website-app-routes` | 9 | 1 | Mostly static route surface. |
| `build-release-sync-scripts` | 7 | 0 | No lifecycle primitives by this scan; still release-authority code. |
| `website-config` | 2 | 0 | Build/config files only. |

## Per-file Primitive Footprint

Per-file primitive footprint rows: 69

These grouped counts are computed from the same `git ls-files '*.js' '*.jsx'
'*.mjs'` source boundary and the same lexical primitive patterns above.
`Listeners` is `addEventListener + removeEventListener`; `Observers` is
`MutationObserver + IntersectionObserver`; `Timers/frames` is intervals,
timeouts, and animation-frame scheduling plus clear/cancel calls;
`Network/messages` is fetch/XHR plus page and extension messages; `DOM side
effects` is dispatch/click/display/class mutation.

| File | Family | Listeners | Observers | Timers/frames | Network/messages | DOM side effects | Total |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `build.js` | `build-release-sync-scripts` | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/background.js` | `extension-ui-background-js` | 0 | 0 | 14 | 8 | 0 | 22 |
| `js/content/block_channel.js` | `content-runtime-js` | 38 | 7 | 26 | 2 | 8 | 81 |
| `js/content/bridge_injection.js` | `content-runtime-js` | 0 | 0 | 2 | 1 | 0 | 3 |
| `js/content/bridge_settings.js` | `content-runtime-js` | 12 | 0 | 10 | 5 | 0 | 27 |
| `js/content/collab_dialog.js` | `content-runtime-js` | 5 | 1 | 4 | 1 | 0 | 11 |
| `js/content/dom_extractors.js` | `content-runtime-js` | 0 | 0 | 0 | 0 | 4 | 4 |
| `js/content/dom_fallback.js` | `content-runtime-js` | 3 | 0 | 11 | 0 | 14 | 28 |
| `js/content/dom_helpers.js` | `content-runtime-js` | 0 | 0 | 0 | 0 | 10 | 10 |
| `js/content/dom_state.js` | `content-runtime-js` | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/content/first_run_prompt.js` | `content-runtime-js` | 1 | 0 | 2 | 2 | 3 | 8 |
| `js/content/handle_resolver.js` | `content-runtime-js` | 0 | 0 | 1 | 5 | 0 | 6 |
| `js/content/menu.js` | `content-runtime-js` | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/content/release_notes_prompt.js` | `content-runtime-js` | 1 | 0 | 1 | 3 | 2 | 7 |
| `js/content_bridge.js` | `content-runtime-js` | 26 | 8 | 57 | 18 | 56 | 165 |
| `js/content_controls_catalog.js` | `extension-ui-background-js` | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/filter_logic.js` | `content-runtime-js` | 0 | 0 | 2 | 6 | 0 | 8 |
| `js/injector.js` | `content-runtime-js` | 2 | 0 | 10 | 11 | 3 | 26 |
| `js/io_manager.js` | `extension-ui-background-js` | 0 | 0 | 3 | 0 | 0 | 3 |
| `js/layout.js` | `quarantined-legacy-js` | 0 | 0 | 0 | 0 | 37 | 37 |
| `js/nanah_sync_adapter.js` | `extension-ui-background-js` | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/popup.js` | `extension-ui-background-js` | 30 | 0 | 3 | 1 | 18 | 52 |
| `js/render_engine.js` | `extension-ui-background-js` | 7 | 0 | 2 | 0 | 8 | 17 |
| `js/security_manager.js` | `extension-ui-background-js` | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/seed.js` | `content-runtime-js` | 0 | 0 | 1 | 3 | 1 | 5 |
| `js/settings_shared.js` | `extension-ui-background-js` | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/shared/identity.js` | `content-runtime-js` | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/state_manager.js` | `extension-ui-background-js` | 0 | 0 | 6 | 8 | 0 | 14 |
| `js/tab-view.js` | `extension-ui-background-js` | 150 | 0 | 33 | 3 | 87 | 273 |
| `js/ui-shell/popup-shell.js` | `generated-ui-output` | 2 | 0 | 0 | 0 | 2 | 4 |
| `js/ui-shell/tab-view-decor.js` | `generated-ui-output` | 2 | 0 | 0 | 0 | 2 | 4 |
| `js/ui_components.js` | `extension-ui-background-js` | 17 | 1 | 8 | 0 | 13 | 39 |
| `js/vendor/nanah.bundle.js` | `vendor-bundles` | 8 | 0 | 0 | 0 | 0 | 8 |
| `js/vendor/qrcode.bundle.js` | `vendor-bundles` | 0 | 0 | 0 | 0 | 0 | 0 |
| `scripts/audit-proof-drift.mjs` | `build-release-sync-scripts` | 0 | 0 | 0 | 0 | 0 | 0 |
| `scripts/build-extension-ui.mjs` | `build-release-sync-scripts` | 0 | 0 | 0 | 0 | 0 | 0 |
| `scripts/build-nanah-vendor.mjs` | `build-release-sync-scripts` | 0 | 0 | 0 | 0 | 0 | 0 |
| `scripts/run-test-lane.mjs` | `build-release-sync-scripts` | 0 | 0 | 0 | 0 | 0 | 0 |
| `scripts/sync-native-runtime.mjs` | `build-release-sync-scripts` | 0 | 0 | 0 | 0 | 0 | 0 |
| `scripts/test-lane-config.mjs` | `build-release-sync-scripts` | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/extension-shell/popup.jsx` | `generated-ui-source` | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/extension-shell/shared/runtime.js` | `generated-ui-source` | 0 | 0 | 0 | 0 | 2 | 2 |
| `src/extension-shell/tab-view-decor.jsx` | `generated-ui-source` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/app/[slug]/page.js` | `website-app-routes` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/app/downloads/page.js` | `website-app-routes` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/app/layout.js` | `website-app-routes` | 0 | 0 | 0 | 0 | 1 | 1 |
| `website/app/not-found.js` | `website-app-routes` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/app/page.js` | `website-app-routes` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/app/privacy/page.js` | `website-app-routes` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/app/robots.js` | `website-app-routes` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/app/sitemap.js` | `website-app-routes` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/app/terms/page.js` | `website-app-routes` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/components/browser-logo-rail.js` | `website-components` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/components/footer-signal-art.js` | `website-components` | 4 | 2 | 3 | 0 | 0 | 9 |
| `website/components/hero-video.js` | `website-components` | 4 | 1 | 0 | 0 | 0 | 5 |
| `website/components/marketing-ui.js` | `website-components` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/components/reveal.js` | `website-components` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/components/route-content.js` | `website-components` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/components/scene-controller.js` | `website-components` | 2 | 0 | 3 | 0 | 0 | 5 |
| `website/components/scenic-detail-page.js` | `website-components` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/components/scenic-illustration.js` | `website-components` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/components/scenic-tones.js` | `website-components` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/components/site-data.js` | `website-components` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/components/site-footer.js` | `website-components` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/components/site-header.js` | `website-components` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/components/site-shell-data.js` | `website-components` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/components/theme-toggle.js` | `website-components` | 4 | 0 | 0 | 0 | 1 | 5 |
| `website/next.config.mjs` | `website-config` | 0 | 0 | 0 | 0 | 0 | 0 |
| `website/postcss.config.mjs` | `website-config` | 0 | 0 | 0 | 0 | 0 | 0 |

## Hottest Files

| File | Primitive count | Why it matters |
| --- | ---: | --- |
| `js/tab-view.js` | 273 | Large UI mutation/listener surface for settings, profiles, Nanah, import/export, app cards, and dashboard state. |
| `js/content_bridge.js` | 165 | Page-runtime bridge with prefetch, fallback menu, whitelist pending work, message bridges, direct hides, and synthetic side effects. |
| `js/content/block_channel.js` | 81 | Quick-block and native 3-dot affordance lifecycle. |
| `js/popup.js` | 52 | Popup UI listener and profile/filter mutation surface. |
| `js/ui_components.js` | 39 | Shared UI widget lifecycle and class/display mutations. |
| `js/layout.js` | 37 | Quarantined legacy style/class mutation surface. |
| `js/injector.js` | 26 | Page-world bridge, subscription import, collaborator lookup, and JSON runtime readiness. |
| `js/content/dom_fallback.js` | 28 | DOM fallback, playlist/watch side effects, synthetic clicks, and delayed passes. |
| `js/background.js` | 22 | Background timers, direct fetches, and message broadcasts. |

## Findings

| Finding | Evidence | Risk |
| --- | --- | --- |
| Listener teardown is much smaller than listener install surface. | 298 `addEventListener` vs 17 `removeEventListener` lexical hits. | Listeners can become page-lifetime or UI-lifetime by default unless explicitly justified. |
| Delayed work teardown is smaller than delayed work setup. | 124 `setTimeout` vs 34 `clearTimeout`. | Debounced/retry work can outlive route, profile, or feature state. |
| Direct visual side effects are broad. | 96 `.style.display =` and 110 class mutations. | False-hide recovery requires a structured hide reason/restore contract. |
| Page-runtime work is not the only burden. | Extension UI/background files have 419 primitives, more than content runtime's 384. | Settings/profile/import/Nanah/UI work can still create stale or conflicting runtime state. |
| Quarantined code still carries side-effect density. | `js/layout.js` has 37 direct style/class primitives. | If reactivated, it can bring old default-hide/reveal assumptions back into product behavior. |

## 2026-05-30 Page-Resident Teardown Imbalance Addendum

This addendum narrows the repo-wide primitive scan to the page-resident runtime
files that can affect YouTube lag, false-hide/leak behavior, or SPA navigation
work. It uses the lifecycle-source token scan, not runtime execution counts.
Runtime behavior is unchanged.

Current selected page-resident files:

```text
js/content_bridge.js
js/content/block_channel.js
js/content/dom_fallback.js
js/injector.js
js/content/bridge_settings.js
js/content/collab_dialog.js
js/content/bridge_injection.js
js/content/handle_resolver.js
js/seed.js
```

Current token totals across those files:

| Marker family | Install / schedule tokens | Teardown / cancel tokens | Current meaning |
| --- | ---: | ---: | --- |
| Listeners | 79 `addEventListener` | 11 `removeEventListener` | Page listeners are mostly lifetime or internally gated today. |
| Mutation observers | 14 `new MutationObserver` | 8 `.disconnect()` | Some observer families have disconnect paths, but observer ownership is not centralized. |
| Intervals | 3 `setInterval` | 4 `clearInterval` | Repeating checks are bounded in places, but not represented by a shared registry. |
| Timeouts | 81 `setTimeout` | 22 `clearTimeout` | Delayed/debounced work is still much broader than explicit cancellation. |
| Animation frames | 15 `requestAnimationFrame` | 0 `cancelAnimationFrame` | Frame work is coalesced locally, not cancellable through a shared route/disable gate. |
| **Total** | **192** | **45** | **237 selected page-resident lifecycle tokens** |

Per-file selected token totals:

| File | Token total |
| --- | ---: |
| `js/content_bridge.js` | 97 |
| `js/content/block_channel.js` | 74 |
| `js/content/dom_fallback.js` | 14 |
| `js/injector.js` | 12 |
| `js/content/bridge_settings.js` | 22 |
| `js/content/collab_dialog.js` | 10 |
| `js/seed.js` | 5 |
| `js/content/bridge_injection.js` | 2 |
| `js/content/handle_resolver.js` | 1 |

This does not prove a leak by itself. It proves that optimization cannot be
approved merely because empty-install smoke tests are better: page-resident
lifecycle work still needs owner-by-owner active gates, disabled/no-rule
counters, teardown or no-op proof, and SPA route transition evidence.

```text
page-resident lifecycle teardown completeness: NO-GO
observer/listener/timer cleanup optimization approval: NO-GO
JSON-first runtime promotion from lifecycle token scan: NO-GO
runtime behavior changed: no
```

## Required Next Proof

Classification does not prove safety. Completion still requires:

1. A lifecycle registry or equivalent proof for every page-resident observer,
   listener, timer, and prototype patch.
2. A no-rule lifecycle budget proving empty installs avoid JSON mutation, DOM
   scans, quick-block sweeps, fallback-menu scans, synthetic clicks, and direct
   network requests.
3. A structured side-effect contract for direct display/class/click/dispatch
   operations.
4. UI/background mutation fixtures for high-density surfaces like
   `js/tab-view.js`, `js/popup.js`, `js/state_manager.js`, and
   `js/background.js`.
5. Quarantine guards for `js/layout.js`, legacy CSS, generated UI output, and
   vendor bundles.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this repo lifecycle primitive coverage audit
can support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
