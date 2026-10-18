# FilterTube Startup Injection Readiness Current Behavior - 2026-05-19

Status: current-behavior proof. This is not an implementation patch.

The original diagrams, inventory counts, and implementation boundaries below
record the May 19 snapshot. The dated October source review at the end supersedes
its dependency list and initialization order; those historical sections are not
a description of the current startup sequence.

This slice is narrower than the manifest/permission audit. The manifest audit
proves which browser package starts which scripts. This page pins what happens
after that package startup: isolated-world bridge injection, Firefox fallback
script insertion, page-world injector readiness, seed connection, settings
handoff, and the delayed DOM fallback start.

Runtime proof:

```text
tests/runtime/startup-injection-readiness-current-behavior.test.mjs
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Current Boot Path — historical May snapshot

```text
manifest content script
        |
        v
js/content/bridge_injection.js
        |
        +--> injects shared/identity
        +--> injects filter_logic
        +--> injects seed only on Firefox fallback path
        +--> injects injector
        |
        v
js/content_bridge.js initialize()
        |
        +--> requestSettingsFromBackground()
        +--> await ensureMainWorldRuntimeForSettings(response.settings)
             only when settings need MAIN-world work
        +--> initializeDOMFallback()
        |
        v
js/injector.js
        |
        +--> posts FilterTube_InjectorBridgeReady
        +--> waits for FilterTubeEngine on a 100ms interval
        +--> posts FilterTube_InjectorToBridge_Ready only when engine exists
```

## Current Behavior Matrix — historical May snapshot

| Surface | Current behavior | Risk |
| --- | --- | --- |
| Bridge injection state | `bridge_injection.js` tracks `scriptsInjected`, `injectionInProgress`, and `injectionPromise` in isolated-world `globalThis.__filtertubeBridgeState`. | Idempotence is local to the isolated world and does not itself prove page-world readiness. |
| Chrome/default injection path | Non-Firefox packages may use `api.scripting.executeScript` through a background `injectScripts` action. | Runtime readiness depends on both background message trust and page-world script execution. |
| Firefox fallback injection | Firefox fallback appends page `<script>` tags for shared identity, filter logic, seed, and injector, with a 50ms delay between loads. | There is no structured fallback readiness/error report beyond promise resolution/rejection. |
| Settings request after injection | `bridge_injection.js` schedules `requestSettingsFromBackground()` after a fixed 100ms timer when injection succeeds. | Settings handoff is timer-based and separate from page-world `FilterTube_InjectorToBridge_Ready`. |
| Content bridge initialization | `content_bridge.js` waits 50ms, calls `initialize()`, requests compiled settings, gates MAIN-world injection through `ensureMainWorldRuntimeForSettings(response.settings)`, then waits another 1000ms before first DOM fallback setup. | Empty/disabled blocklist startup can skip MAIN-world injection, but DOM fallback can still start from a fixed delay rather than a single startup authority report. |
| MAIN-world runtime gate | `needsMainWorldRuntimeWork()` returns false for missing settings or `enabled:false`, true for whitelist mode, and true for active content filters, category filters, keywords, channels, comment keywords, hide-all-comments, or hide-all-shorts. | Startup injection is no longer unconditional, but the gate is not yet a shared startup authority artifact and explicit bridge identity requests can still inject runtime later. |
| Injector bridge ready | `injector.js` posts `FilterTube_InjectorBridgeReady` when request listeners are installed. | `content_bridge.js` does not branch on this message today. |
| Full injector ready | `injector.js` polls every 100ms and posts `FilterTube_InjectorToBridge_Ready` only when `FilterTubeEngine.processData` exists. | Engine readiness has an interval and a 5s timeout, but no shared startup authority record. |
| Duplicate injector execution | Duplicate runs can repost both readiness messages if `filterTubeInjectorBridgeReady`, `ftInitialized`, or `FilterTubeEngine.processData` is already present. | Duplicate ready posts are useful for recovery but need an explicit idempotence counter before behavior changes. |

## Why This Matters For The User-Reported Lag

Startup cost is not only filtering logic. A fresh page can do all of this before
any visible rule match:

```text
script injection
  -> settings request timer
  -> engine readiness interval
  -> page-message listener
  -> settings-gated MAIN-world runtime injection when active work exists
  -> delayed DOM fallback initialization
  -> fallback menu / quick block / observer owners later
```

The no-rule and empty-install audits already prove response parse/rewrite and
DOM lifecycle costs. This slice adds the boot handshake: before optimizing
filtering, the product needs one startup authority that says which owners are
ready, which owners are disabled, and which work is allowed for this browser,
surface, route, and profile.

## Required Future Contract

Before changing injection, seed startup, browser package startup, or first DOM
fallback timing, add one startup authority report:

```text
startupInjectionAuthority({
  browserPackage,
  worldModel,
  injectionMethod,
  injectedScripts,
  scriptLoadResult,
  injectorBridgeReady,
  engineReady,
  seedConnected,
  settingsRevision,
  firstDomFallbackAllowed,
  duplicateInjectionCount,
  failureReason
})
```

This report should be available before any of these changes:

- removing or reordering page-world scripts,
- changing Firefox fallback injection,
- changing the 50ms/100ms/1000ms startup timers,
- changing how seed receives settings,
- changing duplicate injection behavior,
- changing first DOM fallback timing,
- claiming Chrome, Firefox, Opera, Android, or iOS runtime parity.

## Implementation Boundary

Allowed now:

- keep this current-behavior proof green,
- add read-only startup counters,
- add readiness diagnostics,
- add browser-package-specific startup reports.

Blocked now:

- changing injection order,
- changing `FilterTube_InjectorBridgeReady` / `FilterTube_InjectorToBridge_Ready` semantics,
- removing duplicate ready reposts,
- changing Firefox fallback script insertion,
- moving first DOM fallback earlier or later,
- treating manifest readiness as proof of page-world engine readiness.


## October 18, 2026 source review

This is a source-code ordering review, not an installed-browser timing or native
startup acceptance result. It does not establish a shared startup authority or
complete per-callable semantic proof. The historical May ordering above is
preserved as evidence of the earlier snapshot.

The current `js/content/bridge_injection.js` dependency sequence is:

```text
shared/identity -> shared/view_count -> filter_logic
    -> seed (Firefox fallback only) -> injector
```

The fallback still inserts scripts sequentially and schedules the next load
50ms after `onload`. The bridge still schedules a settings request after a
100ms timer. Browser manifest paths and their worlds are reviewed separately in
`FILTERTUBE_BROWSER_MANIFEST_RUNTIME_LOAD_ORDER_CURRENT_BEHAVIOR_2026-05-21.md`.

The current `js/content_bridge.js` initialization sequence is:

```text
50ms initialization timer
    -> requestSettingsFromBackground()
    -> successful settings response: synchronize category policy shell state
    -> initializeDOMFallback(response.settings) (started without awaiting)
    -> await ensureMainWorldRuntimeForSettings(response.settings)
```

`initializeDOMFallback()` installs navigation listeners and establishes direct
video admission before the general DOM hydration delay. On the Home path `/`,
it also starts `applyDOMFallback()` before that delay. It retains its 1000ms
wait before the later DOM setup. Therefore the May statement that MAIN-world
injection finishes before the first DOM fallback work is stale: DOM startup and
optional MAIN-world injection now overlap. This does not imply that the entire
DOM fallback or the Home pass completes before MAIN-world injection.

The readiness messages, duplicate-run guard, Firefox sequential loading, and
absence of a `startupInjectionAuthority` remain covered by the existing runtime
source checks. This correction grants no browser, mobile, TV, or native parity
claim and does not alter the runtime.
