# FilterTube XHR No-Work Boundary Current Behavior - 2026-05-19

Status: current-behavior proof slice with 2026-05-26 no-work optimization
addendum.

This document extends the empty-install and endpoint-policy audit to the XHR
interception path in `js/seed.js`. Fetch no-work already has runnable proof.
XHR is a separate surface: it patches `XMLHttpRequest.prototype`, computes
matching URLs by substring, wraps caller listeners only for marked XHRs, and can
install response-ready hooks when endpoint and active-work gates pass.

2026-05-26 update: disabled, missing-settings, and no-active-JSON-work XHRs now
return from `open()`/`send()` without setting `__filtertube_shouldProcessXhr` or
installing per-request response hooks. The older finding
`XHR open currently marks YouTubei URLs before settings exist` is superseded and
is no longer current behavior.

## Current XHR Flow

```text
setupXhrInterception()
  -> patch XMLHttpRequest.open
       -> compute dataName and mark __filtertube_shouldProcessXhr only when
          substring URL match and !shouldBypassYouTubeiNetworkResponse(dataName)
  -> patch XMLHttpRequest.send
       -> repeat substring URL match plus no-work bypass decision
       -> attach readystatechange/load hooks only after the no-work bypass passes
  -> patch addEventListener/removeEventListener
       -> wrap readystatechange/load listeners when marked
  -> ensureXhrResponseProcessed()
       -> return if no settings or disabled
       -> recheck no-work bypass before parsing JSON body
       -> processWithEngine()
       -> define response/responseText overrides
       -> JSON.stringify replacement body
```

The important remaining boundary is that endpoint detection is still substring
based and prototype patching remains page-lifetime work. The disabled,
missing-settings, and no-active-rule XHR body-work path is now guarded before
per-request marking and hook installation.

## Current Findings

| Area | Current behavior | Current proof | Future expectation |
| --- | --- | --- | --- |
| XHR endpoint match | `open()` and `send()` still use `urlStr.includes(endpoint)`, but that mark is now combined with `!shouldBypassYouTubeiNetworkResponse(dataName)`. A YouTubei endpoint string in a query or prefix can still mark the XHR when active JSON work exists. | `tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs`; `tests/runtime/seed-network-current-behavior.test.mjs` | XHR should use parsed origin/path endpoint policy, shared with fetch. |
| Disabled/no-settings/no-work lifecycle | Missing settings, disabled filtering, empty blocklists, and no active JSON work now leave `__filtertube_shouldProcessXhr` false and skip per-request ready-state/load hooks. | `tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs`; `tests/runtime/seed-xhr-no-work-list-mode-boundary-current-behavior.test.mjs` | This no-work guard should remain pinned and eventually be reported by a first-class endpoint/compiled-rule authority. |
| Listener wrapping | The prototype `addEventListener` / `removeEventListener` wrappers are global once installed, while listener wrapping is conditional on the per-XHR mark. | `tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs` | A lifecycle/endpoint registry should record why prototype patching is page-lifetime work and when it is allowed. |
| Response override | When processing proceeds, the XHR path can define `response` / `responseText` overrides and stringify a replacement body. | `tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs` | Response override must be gated by endpoint policy and compiled active-rule state before body parsing. |

## Why This Matters

The user-visible "fresh install is slower" report cannot be evaluated by fetch
fixtures alone. The current XHR path still has page-global prototype patches and
per-request listener hooks that are independent from the fetch no-work counter
wall.

```text
empty or disabled profile
  -> fetch path now bypasses YouTubei body work before parse/stringify
  -> XHR path now bypasses per-request marks and hooks before body work
  -> DOM lifecycle may still observe/scan
```

Those are separate costs and must stay separately proven before broader
optimization or JSON-first promotion.

## Required Future XHR Contract

Future no-work fixtures should assert:

```text
xhrOpenMarked: 0 for disabled/no-rule irrelevant endpoints [currently satisfied]
xhrSendMarked: 0 for disabled/no-rule irrelevant endpoints [currently satisfied]
xhrReadyHooks: 0 for disabled/no-rule irrelevant endpoints [currently satisfied]
xhrWrappedListeners: 0 unless endpointPolicy permits processing
jsonParse: 0 before endpointPolicy + compiledRuleState permit body work
jsonStringify: 0 before endpointPolicy + compiledRuleState permit response override
responseOverride: 0 before endpointPolicy + compiledRuleState permit mutation
```

## Current Verdict

```text
XHR no-work boundary is partially green: disabled, missing-settings, and no-active-JSON-work per-request XHR work now bypasses before marking and hooks; parsed endpoint policy and page-lifetime prototype-patch authority remain open.
Current behavior is proof-pinned.
Runtime behavior changed for the 2026-05-26 XHR no-work optimization.
```

Related artifacts:

- `docs/audit/FILTERTUBE_EMPTY_INSTALL_PERFORMANCE_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md`
- `docs/audit/FILTERTUBE_ENDPOINT_DECISION_MATRIX_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_ENDPOINT_POLICY_CURRENT_BEHAVIOR_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-18.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this XHR no-work boundary can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint rewrites, fetch/XHR no-work
changes, network authority changes, or whitelist behavior changes.
