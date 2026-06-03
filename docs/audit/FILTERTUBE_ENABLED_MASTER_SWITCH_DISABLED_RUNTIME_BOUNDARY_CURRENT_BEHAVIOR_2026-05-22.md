# FilterTube Enabled Master Switch Disabled Runtime Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior boundary.
Runtime behavior reflects the scoped disabled/no-rule fast-path optimization.
This document is not a standalone implementation patch.

## Purpose

This slice records the current `enabled` master-switch behavior after the scoped
seed fetch fast path was added for disabled/no-active-JSON-work states. The
codebase inspection is looking for places where runtime work can be reduced
safely and where first-class JSON filter work can replace weaker fallback paths,
but this document only pins current behavior.

The active question is whether `enabled:false` is already a single shared
runtime authority across seed interception, JSON filtering, DOM fallback,
background compilation, settings refresh, and StateManager. Current behavior is
mixed: several consumers check `enabled:false`, but the checks do not form one
shared runtime decision with parse/stringify, harvest, DOM restore, storage
cache, and lifecycle budgets.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Current Proof Surface

| Metric | Current value |
| --- | ---: |
| enabled disabled-runtime source files pinned | 7 |
| enabled disabled-runtime source/effect blocks pinned | 15 |
| seed fetch bypass decision block lines | 5 |
| seed active JSON-work response JSON decode sites in pinned body block | 1 |
| seed active JSON-work stringify sites in pinned body block | 2 |
| seed processWithEngine disabled gate block lines | 5 |
| engine harvest-before-disabled block lines | 20 |
| DOM active-work predicate block lines | 68 |
| DOM disabled cleanup gate block lines | 21 |
| background storage invalidation `enabled` entries | 0 |
| content bridge storage refresh `enabled` entries | 1 |
| StateManager external reload `enabled` entries | 1 |
| runtime implementation changed | yes |

## Source Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1,136 | 50,026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/filter_logic.js` | 3,652 | 172,174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6,343 | 286,370 | `ce17fee7a80398be91f89e286ef0dea8c85deff0b4363729d79a957c9989cd36` |
| `js/settings_shared.js` | 1,181 | 57,535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/bridge_settings.js` | 845 | 34,241 | `aea46dd241248db1d1d9bcbdfdf65320d1399ecd84cc7792678f29b1b26ee092` |
| `js/state_manager.js` | 2,491 | 99,780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |

## Source/Effect Blocks

| Block | Source anchor | Lines | Bytes | Current behavior pinned |
| --- | --- | ---: | ---: | --- |
| `seedProcessDisabledGate` | `js/seed.js:411` | 5 | 192 | `processWithEngine()` returns the original data when `cachedSettings.enabled === false`, before skip-mode harvest-only logic. |
| `seedFetchBypassDecision` | `js/seed.js:693` | 5 | 202 | Fetch computes the YouTubei `dataName` and returns the original fetch promise before attaching body parsing when `shouldBypassYouTubeiNetworkResponse(dataName)` is true. |
| `seedFetchBodyRewrite` | `js/seed.js:701` | 45 | 2,750 | Active JSON-work fetch responses call `response.clone().json()`, then later call `processWithEngine()`, then rebuild a `Response` with `JSON.stringify(processed)`. |
| `seedXhrDisabledGuard` | `js/seed.js:813` | 8 | 394 | XHR response processing returns before status/body parsing when `cachedSettings.enabled === false`. |
| `engineHarvestBeforeDisabled` | `js/filter_logic.js:3588` | 20 | 826 | `processData()` calls `_harvestChannelData(data)` before the `this.settings.enabled === false` mutation skip. |
| `domActiveWorkPredicate` | `js/content/dom_fallback.js:2117` | 68 | 2,333 | DOM fallback active-work detection returns false for `enabled:false`, but true for whitelist mode, non-empty lists, true boolean toggles, content filters, or enabled category filters with selected categories. |
| `domDisabledCleanupGate` | `js/content/dom_fallback.js:2487` | 18 | 791 | `applyDOMFallback()` calls `clearContentControlStyles()` and restores previously hidden/pending elements before returning on `effectiveSettings.enabled === false`. |
| `backgroundEnabledFromV4` | `js/background.js:285` | 10 | 359 | Background compilation resolves `enabledFromV4` from profile settings, falling back to legacy `items.enabled !== false`. |
| `backgroundBooleanPassThrough` | `js/background.js:2499` | 34 | 3,529 | Background compiled settings assign `compiledSettings.enabled = enabledFromV4` with other boolean flags. |
| `backgroundInvalidationKeys` | `js/background.js:4510` | 16 | 461 | Background storage-change cache invalidation does not include `enabled`. |
| `sharedSettingsKeys` | `js/settings_shared.js:17` | 39 | 1,033 | Shared settings persistence includes `enabled`. |
| `sharedCompileEnabled` | `js/settings_shared.js:524` | 6 | 315 | Shared compilation emits `enabled: enabled !== false`. |
| `bridgeRefreshKeys` | `js/content/bridge_settings.js:793` | 44 | 1,263 | Content bridge storage refresh includes `enabled`. |
| `stateValidKeys` | `js/state_manager.js:2028` | 35 | 1,075 | StateManager accepts `enabled` as a valid UI setting key. |
| `stateExternalReloadKeys` | `js/state_manager.js:2380` | 41 | 1,604 | StateManager external storage reload includes `enabled`. |

## Current Runtime Findings

| Runtime path | Current behavior | Risk class |
| --- | --- | --- |
| Seed fetch interception | Disabled settings and no-active-JSON-work settings now return the native fetch promise before cloning, parsing, processing, or stringifying matching YouTubei responses. Active JSON-work requests still clone, parse, process, and rebuild. | no-work improvement, active-work predicate risk, response mutation burden |
| Seed XHR interception | Disabled settings return before JSON parse/rewrite in `ensureXhrResponseProcessed()`, after endpoint marking/listener wrapping can already exist. | listener burden, endpoint policy burden |
| Filter engine | Disabled settings return the original payload reference, but channel harvest already runs if callers invoke `processData()` directly. | learned-identity side effect, no-work boundary |
| DOM fallback active predicate | Disabled settings suppress active work, while whitelist mode and raw enabled nested filters are active. | settings-mode drift, false-hide/leak if future gates diverge |
| DOM fallback application | Disabled settings restore previously hidden/pending elements and clear content-control CSS. | restore correctness, stale marker cleanup |
| Background compiler/cache | `enabled` is compiled and read, but background storage-change invalidation omits the direct `enabled` key. | stale compiled cache, cross-context refresh drift |
| Content bridge and StateManager | Both include `enabled` in refresh/reload key sets. | background/content/UI parity gap |

## Optimization And JSON-First Boundary

This slice identifies the first concrete optimization that has now been applied:
matching seed fetches bypass body work when disabled or when there is no active
JSON work. This is not approval to broaden the fast path. Future optimization
must still prove endpoint permission, active-rule state, response-body mutation
permission, no-work budgets, DOM parity, native parity, and metric artifacts
before changing additional disabled/no-work paths.

A future optimization must prove endpoint permission before expanding this
fast path beyond the currently covered seed fetch no-work cases.

This slice also blocks first-class JSON filter promotion until the `enabled`
decision is represented as a shared JSON/DOM/settings work decision. A JSON field
cannot be promoted as first-class behavior if disabled mode still has unbudgeted
transport work, harvest work, DOM cleanup work, or cache invalidation drift.

## Missing Runtime Authority Symbols

The current product runtime does not contain these symbols:

- `enabledMasterSwitchRuntimeContract`
- `enabledDisabledNoWorkDecisionReport`
- `enabledSeedTransportNoWorkBudget`
- `enabledEngineHarvestBeforeSkipReport`
- `enabledDomFallbackActiveGateReport`
- `enabledSettingsRefreshParityReport`
- `enabledBackgroundCacheInvalidationReport`
- `enabledDisabledRuntimeFixtureProvenance`
- `enabledDisabledRuntimeMetricArtifact`
- `enabledRuntimeAuthorityGate`

Until those or equivalent reviewed mechanisms exist with fixtures and metrics,
this audit slice is evidence of current behavior only.

## Non-Completion Boundary

This does not complete the active goal. It adds current-behavior proof for one
cross-feature boundary, but it does not prove every feature, file, method, JSON
path, DOM selector, runtime observer/listener/timer, settings mode, or
cross-feature interaction. It also does not permit additional broad
implementation changes.

Required future proof before changing disabled-runtime behavior:

| Gate | Required proof before implementation |
| --- | --- |
| Seed fetch disabled pass-through | Current fixture proof shows zero clone/parse/stringify work on the covered disabled browse endpoint; broader endpoint, content-type/cache/stream, and native parity coverage remain required. |
| Seed XHR disabled pass-through | Endpoint marking/listener wrapping budget and compatibility proof for disabled requests. |
| Engine harvest split | Explicit decision on whether disabled mode may harvest identity mappings, with fixture provenance. |
| DOM fallback restore | Sibling-visible hide/restore fixtures proving disabled cleanup restores only FilterTube-owned mutations. |
| Settings refresh parity | Shared key authority proving background, content bridge, shared settings, and StateManager react to `enabled` consistently. |
| JSON-first promotion | Route, endpoint, surface, profile, list-mode, rule-state, mutation-effect, no-work, DOM parity, native parity, and rollback proof. |

## Linked Evidence

- `tests/runtime/enabled-master-switch-disabled-runtime-boundary-current-behavior.test.mjs`
- `docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md`
- `docs/audit/FILTERTUBE_SETTINGS_REFRESH_KEY_PARITY_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_EMPTY_INSTALL_PERFORMANCE_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md`

## First Optimization Metric Collector No-Work Preservation Matrix Addendum

First optimization metric collector no-work preservation matrix addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-no-work-preservation-matrix-current-behavior.test.mjs`
adds a collector-specific preservation gate for disabled-runtime behavior. The
addendum pins 12 collector no-work preservation rows, 4 P0 no-work fixture
names covered, 9 required no-work counter groups covered, 0 runtime collector
no-work proofs approved, and 0 implementation-ready collector no-work rows. It
does not approve changing disabled pass-through, harvest, DOM cleanup, storage
refresh, or settings behavior.
