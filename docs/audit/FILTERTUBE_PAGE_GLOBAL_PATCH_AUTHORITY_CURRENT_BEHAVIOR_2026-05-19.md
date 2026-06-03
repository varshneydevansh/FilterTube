# FilterTube Page Global Patch Authority Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

This document pins the page-global patch boundary in `js/seed.js`. The empty
install, endpoint, and XHR no-work slices prove response work. This slice proves
the lower-level lifetime issue: the runtime patches page-native APIs first, and
only later decides whether endpoint work is useful.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Current Patch Surface

```text
setupFetchInterception()
  -> const originalFetch = window.fetch
  -> window.fetch = function(resource, init) { ... }

setupXhrInterception()
  -> const originalOpen = XMLHttpRequest.prototype.open
  -> const originalSend = XMLHttpRequest.prototype.send
  -> const originalAddEventListener = XMLHttpRequest.prototype.addEventListener
  -> const originalRemoveEventListener = XMLHttpRequest.prototype.removeEventListener
  -> XMLHttpRequest.prototype.addEventListener = function(...)
  -> XMLHttpRequest.prototype.removeEventListener = function(...)
  -> XMLHttpRequest.prototype.open = function(...)
  -> XMLHttpRequest.prototype.send = function(...)
```

The XHR path has an idempotence flag:

```text
window.__filtertubeXhrInterceptionInstalled
```

The fetch path currently has no matching installed flag or restore owner in the
source slice. Both paths are page-lifetime patches.

## Current Findings

| Patch owner | Current behavior | Current proof | Future expectation |
| --- | --- | --- | --- |
| Fetch patch | Stores `originalFetch` and assigns `window.fetch`. Endpoint policy and no-work checks happen inside the patched function after the page-global patch exists. | `tests/runtime/page-global-patch-authority-current-behavior.test.mjs`; `js/seed.js` | Fetch patch should have an explicit page-lifetime owner, idempotence proof, and no-work counter contract. |
| XHR patch | Stores original XHR prototype methods and replaces `open`, `send`, `addEventListener`, and `removeEventListener`. | `tests/runtime/page-global-patch-authority-current-behavior.test.mjs`; `js/seed.js` | XHR patch should be governed by the same endpoint policy and lifecycle authority as fetch. |
| Restore/teardown | Current source has no named `restoreFetch`, `restoreXhr`, `unpatch`, or lifecycle registry for these page-global patches. | `tests/runtime/page-global-patch-authority-current-behavior.test.mjs` | Either restore must exist or page-lifetime ownership must be explicitly justified and counter-proven. |
| Response override | XHR can add per-instance `response` and `responseText` getters after JSON parsing and processing. | `tests/runtime/page-global-patch-authority-current-behavior.test.mjs`; `docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md` | Response override must be impossible unless endpoint policy and compiled active-rule state permit mutation. |

## Why This Matters

Prototype patches are not ordinary feature functions. Once installed, they sit
in the page's critical path for YouTube networking. That means performance and
reliability fixes need a page-global patch authority, not only local endpoint
branch fixes.

```text
manifest-loaded seed runtime
  -> patch page APIs
  -> YouTube calls fetch / XHR
  -> FilterTube endpoint checks run
  -> only then no-work/disabled/settings decisions run
```

This order is valid only if the patch lifetime itself is intentional,
idempotent, and measured.

## Required Future Patch Contract

Future fixtures should prove:

```text
patch owner id exists
fetch patch idempotence is explicit
XHR patch idempotence is explicit
endpointPolicy runs before body parsing
compiledRuleState runs before mutation/override
disabled/no-rule mode has zero parse/rewrite/override counters
restore or page-lifetime justification exists
patches do not double-wrap after seed reinjection
```

## Current Verdict

```text
Page-global patch authority is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
```

Related artifacts:

- `docs/audit/FILTERTUBE_PAGE_RUNTIME_LIFECYCLE_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_ENDPOINT_DECISION_MATRIX_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md`
