# FilterTube Page Runtime Lifecycle Authority Audit - 2026-05-18

Status: current-behavior audit artifact. This is not an implementation patch.

Purpose: identify page-resident observers, listeners, timers, prototype patches,
and delayed work that can stay active independently of a single compiled
feature/lifecycle authority. This complements the broader lifecycle ledger by
pinning the lifecycle owners that matter most for YouTube page lag and
false-hide recovery work.

Primary sources:

- `js/seed.js`
- `js/content_bridge.js`
- `js/content/block_channel.js`
- `js/content/dom_fallback.js`
- `js/content/collab_dialog.js`
- `docs/audit/FILTERTUBE_LIFECYCLE_TEARDOWN_AUDIT_2026-05-17.md`

## Current Lifecycle Authority Shape

```text
manifest-loaded page runtime
        |
        +--> seed network patches fetch/XHR
        +--> content bridge initializes DOM fallback and prefetch lifecycle
        +--> quick block installs viewport/listener/observer lifecycle
        +--> fallback menu installs scan/listener/observer lifecycle
        +--> DOM fallback installs playlist/media guards and delayed passes
        +--> collaborator dialog installs trigger listeners and mutation observer

Current missing center:
        no shared page-runtime lifecycle registry,
        no unified active-state budget,
        no shared pause/teardown owner for fullscreen, native overlays,
        disabled feature state, route changes, or no-rule states.
```

Source proof:

- The current source tree has no `lifecycleRegistry`, `registerLifecycle`,
  `disposeAll`, `teardownAll`, `observerRegistry`, or `timerRegistry` symbol.
- The lifecycle ledger currently counts 212 page-resident marker rows across
  `content_bridge.js`, `block_channel.js`, `dom_fallback.js`, `injector.js`,
  `bridge_settings.js`, `collab_dialog.js`, `bridge_injection.js`,
  `handle_resolver.js`, and `seed.js`.
- The existing runtime harness pins 200 current-behavior tests before this
  slice.

## High-Risk Page-Resident Lifecycle Owners

| Owner | Current behavior | Source proof | Risk |
| --- | --- | --- | --- |
| Seed network interception | `fetch` and XHR prototypes are patched for the page lifetime. XHR stores original prototype methods but has no restore owner, and endpoint detection still uses endpoint substring checks. | `js/seed.js:710-880`; endpoint fixtures in `tests/runtime/seed-network-current-behavior.test.mjs`. | Network parse/rewrite work can remain page-global even when the runtime should be no-work or metadata-only. |
| Content bridge prefetch / hydration | Card prefetch owns an `IntersectionObserver`, visibility listener, playlist scroll listener, playlist mutation observer, and `yt-navigate-finish` listener. The observer can disconnect/re-attach, but the anonymous listeners have no removal owner. | `js/content_bridge.js:969-1073`. | Identity harvest and card hydration can remain alive without a compiled `needsIdentityHarvest` decision. |
| Fallback menu scan lifecycle | Fallback menu setup owns body mutation observation, DOMContentLoaded, navigation, click, scroll debounce, and an eight-pass warmup timer. It can pause under native overlay quiet mode but has no global teardown or list-mode/showBlockMenu lifecycle owner. | `js/content_bridge.js:6059-6623`. | Hidden/disabled affordances can still scan and react to page churn. |
| Quick block viewport lifecycle | Quick block setup injects styles, global focus/input/click/scroll/resize/orientation listeners, a body mutation observer, pointer tracking, and a periodic sweep. Several listeners are installed before the first `isQuickBlockEnabled()` guard; the interval has no clear path. | `js/content/block_channel.js:1454-1662`. | Disabled quick buttons can still contribute resize/orientation/mutation work, especially during fullscreen and low-end mobile/tablet sessions. |
| Normal menu observer / Kids passive listener | Normal menu setup installs a global click listener and dropdown mutation observers; Kids passive listener installs a click listener and body mutation observer. Neither branch has a shared teardown owner. | `js/content/block_channel.js:1669-1840`. | Menu surfaces can remain live after route/profile/mode changes and can diverge from fallback-menu gates. |
| DOM fallback guards | DOM fallback installs playlist next/prev click and video `ended` guards once on `window`, plus delegated click handlers and delayed `applyDOMFallback` passes. | `js/content/dom_fallback.js:2339-2440`, `3728-3816`, `4530`. | Guard listeners can persist even when playlist/current-watch rules should be inactive, and media/playlist side effects can survive route changes. |
| Collaborator dialog lifecycle | The collaborator module installs capture-phase click/keydown listeners and a document mutation observer after DOMContentLoaded. It tracks pending cards globally and has no removal/disconnect owner. | `js/content/collab_dialog.js:24-79`, `307-333`. | Collaboration extraction can keep page-wide trigger observation active even when collaborator filtering is not needed. |

## Current Lifecycle Risk Classes

| Risk class | Current symptom | Needed proof before fixing |
| --- | --- | --- |
| No-rule runtime work | Empty blocklist / blank filters can still leave observers, listeners, harvest, or scan paths active. | A no-rule page lifecycle fixture that proves zero JSON mutation, zero DOM fallback scan, zero fallback menu scan, and zero quick-block sweep. |
| Feature-hidden work | UI affordance disabled states and whitelist mode do not share one lifecycle gate across quick block, normal menu, and fallback menu. | One menu/quick affordance authority fixture that checks installed lifecycle and visible actions together. |
| Fullscreen / orientation churn | Quick-block resize/orientation listeners, DOM fallback timers, prefetch, and fallback menu scans can wake during player fullscreen. | A fullscreen lifecycle budget fixture that proves non-player observers are paused while fullscreen/custom view is active. |
| Route-change leftovers | Playlist/watch-specific guards and observers are installed once and generally live for the page lifetime. | Route-scoped lifecycle fixtures proving watch, search, home, playlist, Kids, and YTM each own only the needed lifecycle. |
| Prototype patch lifetime | Seed patches fetch/XHR for the page lifetime, while endpoint policy decides later whether work is useful. | Exact endpoint policy plus no-parse/no-rewrite pass-through fixtures before changing patch timing. |

## Future Lifecycle Rule

```text
Every page-resident observer/listener/timer/prototype patch should have:
  1. one named owner,
  2. one active-state predicate from compiledRuleState/endpointPolicy,
  3. one pause rule for native overlays/fullscreen/hidden tabs when relevant,
  4. one teardown or documented page-lifetime reason,
  5. counters proving no-rule and feature-hidden budgets.
```

This file intentionally does not prescribe deletion. Some lifecycle work is
needed for correctness; the gap is that the current runtime does not yet have a
single authority that can prove when that work is needed.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this page-runtime lifecycle authority audit
can support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
