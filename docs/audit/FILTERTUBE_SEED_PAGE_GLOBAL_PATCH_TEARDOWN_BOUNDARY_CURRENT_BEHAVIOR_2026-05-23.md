# FilterTube Seed Page-Global Patch Teardown Boundary - Current Behavior - 2026-05-23

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, seed patch, network
patch, teardown patch, or permission to change JSON filtering behavior.

## Purpose

This register narrows the page-global and prototype patch lifetime in
`js/seed.js`. Earlier seed slices proved fetch/XHR work decisions, page-global
initial data behavior, and settings replay. This slice proves the lower-level
lifetime boundary: the seed runtime patches page APIs and page globals, but does
not expose a restore owner or teardown registry.

The current boundary is:

```text
seed load installs configurable setters for ytInitialData and
ytInitialPlayerResponse, replaces window.fetch, replaces four
XMLHttpRequest.prototype methods, adds per-XHR response accessors after
processing, exposes window.filterTube, and dispatches filterTubeSeedReady. The
top-level filterTubeSeedHasRun guard prevents ordinary duplicate seed execution,
but fetch has no separate installed flag; forced re-entry can wrap fetch again
while the XHR installed flag keeps prototype methods stable. No restore,
dispose, teardown, clear, or delete owner exists for these page lifetime patches.
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_PAGE_GLOBAL_PATCH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_SEED_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_XHR_RESPONSE_OVERRIDE_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_SEED_FETCH_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_SEED_XHR_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_SEED_INITIAL_GLOBAL_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
seed page-global patch teardown source files: 1
establishDataHooks block lines: 110
establishDataHooks block bytes: 5772
setupFetchInterception block lines: 91
setupFetchInterception block bytes: 4430
setupXhrInterception block lines: 219
setupXhrInterception block bytes: 10322
seed global interface block lines: 25
seed global interface block bytes: 867
seed initialization block lines: 20
seed initialization block bytes: 564
seed Object.defineProperty tokens: 4
seed window Object.defineProperty tokens: 2
seed XHR Object.defineProperty tokens: 2
seed window.fetch assignment tokens: 1
seed originalFetch capture tokens: 1
seed filterTubeSeedHasRun tokens: 2
seed ftSeedInitialized tokens: 2
seed XHR installed flag tokens: 2
seed original XHR method capture tokens: 4
seed XHR prototype replacement tokens: 4
seed XHR removeEventListener tokens: 2
seed clearTimeout tokens: 0
seed teardown tokens: 0
seed dispose tokens: 0
seed delete window.filterTube tokens: 0
runtime seed page-global patch teardown fixtures: 5
runtime behavior changed: no
not completion proof for seed page-global patch teardown authority
```

## Current Decision Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Top-level guard | `window.filterTubeSeedHasRun` prevents ordinary duplicate seed execution. | Guard owner and forced re-entry policy. |
| Ready state | `window.ftSeedInitialized` is set false at startup and true after patch installation. | Readiness lifecycle and teardown state report. |
| Initial global setters | `Object.defineProperty(window, 'ytInitialData' / 'ytInitialPlayerResponse')` installs configurable accessors. | Accessor owner, restore decision, and stale data policy. |
| Fetch patch | Captures `originalFetch` in closure and assigns `window.fetch = function(...)`. | Fetch installed flag, idempotence proof, and restore/page-lifetime justification. |
| XHR patch | Captures four original prototype methods and replaces `open`, `send`, `addEventListener`, and `removeEventListener`. | Shared patch owner and teardown registry. |
| XHR idempotence | `window.__filtertubeXhrInterceptionInstalled` prevents XHR prototype replacement on forced seed re-entry. | Equivalent fetch idempotence policy. |
| Per-instance XHR response accessors | After processing, individual XHR objects receive `response` and `responseText` getters. | Override lifetime, compatibility, and removal policy. |
| Global interface | `window.filterTube` exposes settings, raw/last snapshots, updateSettings, and stats. | Internal surface ownership and cleanup policy. |
| Teardown | No source token exists for a seed teardown function, dispose function, clear timer, or deleting `window.filterTube`. | Explicit page-lifetime decision or restore fixtures. |

## Runtime Fixture Summary

The initial-load fixture proves one seed load patches fetch, four XHR prototype
methods, both `ytInitial*` accessors, global readiness flags, and the
`window.filterTube` interface.

The ordinary duplicate-load fixture proves the top-level guard prevents a second
ordinary execution from replacing already patched fetch/XHR functions or
dispatching a second ready event.

The forced re-entry fixture proves clearing `filterTubeSeedHasRun` can wrap
`window.fetch` again, while the XHR installed flag keeps prototype methods from
being replaced again.

The XHR response override fixture proves a processed XHR instance receives
per-instance `response` and `responseText` getters, with no paired removal path.

The teardown-surface fixture proves the exposed seed interface has no restore,
unpatch, dispose, destroy, teardown, or clear owner for page-global patches.

## Risks Identified

- Reliability: page-native API patches are page-lifetime and do not expose a
  restore owner if the runtime needs to unload, recover, or switch authority.
- False-hide/leak: per-instance XHR response accessors can persist for the
  object lifetime after a late mutation decision.
- Performance: forced seed re-entry can double-wrap fetch because fetch lacks an
  installed flag even though XHR has one.
- Code burden: fetch, XHR prototype methods, XHR instance accessors,
  `ytInitial*` accessors, readiness flags, and `window.filterTube` are patched
  by one file without a shared patch registry.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
seedPageGlobalPatchTeardownContract
seedPageGlobalPatchOwnerReport
seedFetchPatchIdempotenceReport
seedXhrPatchIdempotenceReport
seedInitialGlobalAccessorOwnerReport
seedXhrResponseAccessorLifetimeReport
seedPageGlobalPatchRestorePolicy
seedPageGlobalPatchLifetimeJustification
seedPageGlobalPatchFixtureProvenance
seedPageGlobalPatchMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/seed-page-global-patch-teardown-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one seed page-global patch
teardown gap into current fetch, XHR, initial-global accessor, response accessor,
readiness flag, and global interface behavior only.
