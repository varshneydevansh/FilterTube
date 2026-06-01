# FilterTube First Optimization Source-Locus Side-Effect Ownership Boundary - Current Behavior - 2026-05-24

Status: audit-only current-behavior first optimization source-locus
side-effect ownership boundary. Runtime behavior is unchanged. This is not an
implementation patch, optimization patch, metric collector patch,
source-owner map artifact, JSON-first behavior patch, whitelist patch,
settings patch, lifecycle patch, diagnostic patch, native sync patch, release
patch, public claim patch, or committed metric artifact.

## Purpose

The source-locus no-work boundary classifies where disabled, empty, no-rule,
missing-settings, pass-through, menu-off, no-network, no-storage, no-visual,
and diagnostic-quiet states still lack owner-approved no-work proof. This
boundary records the side effects that those same source loci can produce
today, so a future JSON-first or whitelist optimization cannot claim safety
until settings, artifact, transport, engine, DOM, lifecycle, network, storage,
visual, whitelist, diagnostic, rollout, and verification effects are owned and
budgeted.

The current boundary is:

```text
Selected first optimization binding: FT-BIND-00-metric-artifact-foundation
Required side-effect budget path: docs/audit/artifacts/first-optimization/metric-foundation/side-effect-budget.json
Source-locus side-effect boundary rows: 12
Current source side-effect anchors covered: 53
Runtime/build source files with side-effect evidence covered: 12
Committed side-effect budget files: 0
Runtime source-owner approvals: 0
Runtime metric collector approvals: 0
Implementation-ready source-locus side-effect rows: 0
```

This is side-effect ownership classification, not side-effect budget approval.
A future approval still needs source-owner signatures, measured no-work
counters, explicit side-effect budgets, fixture provenance, diagnostic privacy,
parity rollout, verification output, rollback limits, native/release
boundaries, raw-capture exclusions, and public-claim limits.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Provides the 12 source-locus callable rows that need side-effect ownership. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Pins the current file revisions used for side-effect classification. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Classifies current lifecycle and teardown gaps that side-effect ownership must respect. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Classifies current no-work ownership gaps that side-effect budgets must preserve. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Provides 12 collector side-effect rows, 7 evidence side-effect rows, and 12 required work-budget fields. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future `side-effect-budget.json` structure but proves 0 files and approvals. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves runtime collector approval remains absent. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves 0 implementation-ready first optimization rows. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as approval. |

## Current Counts

```text
source-locus side-effect boundary rows: 12
source-locus callable rows covered: 12
source-locus fingerprint rows covered: 12
source-locus teardown rows covered: 12
source-locus no-work rows covered: 12
collector side-effect rows covered: 12
evidence side-effect rows covered: 7
required work-budget fields covered: 12
runtime/build source files classified: 14
runtime/build source files with side-effect evidence covered: 12
audit/test anchor files covered: 2
current source side-effect anchors covered: 53
side-effect risk classes covered: 8
committed side-effect budget files: 0
committed no-work preservation files: 0
committed source-owner map files: 0
runtime source-owner approvals: 0
runtime metric collector approvals: 0
runtime collector insertion points approved: 0
implementation-ready source-locus side-effect rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for source-locus side-effect approval authority
```

Covered collector side-effect rows from the side-effect budget matrix:

```text
FT-COLLECTOR-SIDEEFFECT-00-settings-refresh-broadcast-budget
FT-COLLECTOR-SIDEEFFECT-01-artifact-write-provenance-budget
FT-COLLECTOR-SIDEEFFECT-02-fetch-body-rebuild-budget
FT-COLLECTOR-SIDEEFFECT-03-xhr-listener-override-budget
FT-COLLECTOR-SIDEEFFECT-04-engine-map-side-effect-budget
FT-COLLECTOR-SIDEEFFECT-05-dom-selector-rerun-budget
FT-COLLECTOR-SIDEEFFECT-06-menu-quick-lifecycle-budget
FT-COLLECTOR-SIDEEFFECT-07-network-timeout-credential-budget
FT-COLLECTOR-SIDEEFFECT-08-storage-backup-refresh-budget
FT-COLLECTOR-SIDEEFFECT-09-visual-hide-restore-budget
FT-COLLECTOR-SIDEEFFECT-10-whitelist-pending-policy-budget
FT-COLLECTOR-SIDEEFFECT-11-diagnostic-rollout-budget
```

Covered first-patch evidence rows:

```text
FT-EVIDENCE-02-metric-artifact
FT-EVIDENCE-04-false-hide-leak-restore
FT-EVIDENCE-05-json-dom-native-parity
FT-EVIDENCE-06-lifecycle-budget
FT-EVIDENCE-07-settings-mutation-profile
FT-EVIDENCE-08-diagnostic-privacy
FT-EVIDENCE-09-rollout-claim-boundary
```

Covered required work-budget fields:

```text
parseBudget
stringifyBudget
processDataBudget
harvestBudget
listenerBudget
observerBudget
timerBudget
networkBudget
storageBudget
hideBudget
restoreBudget
diagnosticBudget
```

## Classified Runtime And Build Source File Set

The side-effect ownership boundary classifies the same first-optimization
source set as the callable, teardown, and no-work gates:

```text
js/seed.js
js/filter_logic.js
js/content_bridge.js
js/content/dom_fallback.js
js/content/block_channel.js
js/content/handle_resolver.js
js/background.js
js/state_manager.js
js/settings_shared.js
js/io_manager.js
build.js
scripts/build-extension-ui.mjs
scripts/build-nanah-vendor.mjs
scripts/sync-native-runtime.mjs
```

Runtime/build source files with direct side-effect evidence in this slice:

```text
js/settings_shared.js
js/state_manager.js
js/seed.js
js/filter_logic.js
js/content/dom_fallback.js
js/content/block_channel.js
js/content/handle_resolver.js
js/background.js
js/io_manager.js
js/content_bridge.js
build.js
scripts/sync-native-runtime.mjs
```

## Source-Locus Side-Effect Matrix

| Source-locus side-effect row id | Covered callable row | Current side-effect ownership evidence | Missing proof before implementation |
| --- | --- | --- | --- |
| `FT-SOURCE-LOCUS-SIDEEFFECT-00-settings-scope` | `FT-SOURCE-LOCUS-CALLABLE-00-settings-scope` | Shared settings and StateManager can read settings, send refresh messages, and persist channel maps. | Missing approval; settings read/write, refresh/broadcast, profile/list-mode, and rollback budgets are not approved. |
| `FT-SOURCE-LOCUS-SIDEEFFECT-01-fixture-audit-envelope` | `FT-SOURCE-LOCUS-CALLABLE-01-fixture-audit-envelope` | Audit docs/tests define future artifact paths, but no side-effect budget packet exists. | Missing approval; audit fixtures cannot authorize runtime, release, or public side effects. |
| `FT-SOURCE-LOCUS-SIDEEFFECT-02-transport-json` | `FT-SOURCE-LOCUS-CALLABLE-02-transport-json` | Seed fetch can clone JSON bodies and rebuild `Response` objects; XHR can wrap listeners and override response accessors. | Missing approval; body-read, parse/stringify, response rewrite, listener override, accessor lifetime, and pass-through budgets are absent. |
| `FT-SOURCE-LOCUS-SIDEEFFECT-03-filter-engine` | `FT-SOURCE-LOCUS-CALLABLE-03-filter-engine` | Filter logic can harvest maps, queue timer flushes, post main-world messages, log whitelist diagnostics, and mutate filtered payloads. | Missing approval; harvest, map-write, postMessage, processData, rule-check, mutation, and diagnostic budgets are absent. |
| `FT-SOURCE-LOCUS-SIDEEFFECT-04-dom-fallback` | `FT-SOURCE-LOCUS-CALLABLE-04-dom-fallback` | DOM fallback can scan selectors, schedule metadata fetches, set hide attributes, and restore marker state. | Missing approval; DOM query, DOM mutation, metadata fetch, restore, selected-row, and sibling-visible budgets are absent. |
| `FT-SOURCE-LOCUS-SIDEEFFECT-05-menu-quickblock` | `FT-SOURCE-LOCUS-CALLABLE-05-menu-quickblock` | Menu and quick-block paths can install listeners/observers/timers, remove quick buttons, inject menu items, send background messages, and hide cards. | Missing approval; listener, observer, timer, RAF, menu injection, quick action, fullscreen/native quiet, and teardown budgets are absent. |
| `FT-SOURCE-LOCUS-SIDEEFFECT-06-network-resolver` | `FT-SOURCE-LOCUS-CALLABLE-06-network-resolver` | Handle resolution can read channelMap, post updates, set pending sentinels, direct-fetch same-origin pages, and schedule fallback reruns. | Missing approval; zero-fetch, credential, pending sentinel, cache-hit/cache-miss, timeout, and privacy budgets are absent. |
| `FT-SOURCE-LOCUS-SIDEEFFECT-07-storage-map-mutation` | `FT-SOURCE-LOCUS-CALLABLE-07-storage-map-mutation` | Background, StateManager, content stats, and IO backup paths can write channel maps, read stats, schedule backup timers, and refresh caches. | Missing approval; storage read/write, map flush, backup, cache invalidation, refresh fanout, and rollback budgets are absent. |
| `FT-SOURCE-LOCUS-SIDEEFFECT-08-hide-restore-visual` | `FT-SOURCE-LOCUS-CALLABLE-08-hide-restore-visual` | Content bridge and DOM fallback can add `filtertube-hidden`, set hidden attributes, store previous state, and restore attributes. | Missing approval; hide/restore mutation, stale marker cleanup, selected-row, visible scaffold, false-hide, and leak budgets are absent. |
| `FT-SOURCE-LOCUS-SIDEEFFECT-09-whitelist-policy` | `FT-SOURCE-LOCUS-CALLABLE-09-whitelist-policy` | Whitelist pending timers can mark unresolved cards hidden and pending while identity resolution continues. | Missing approval; empty whitelist, unresolved identity, pending TTL, import/transition, false-hide, and leak budgets are absent. |
| `FT-SOURCE-LOCUS-SIDEEFFECT-10-diagnostic-privacy` | `FT-SOURCE-LOCUS-CALLABLE-10-diagnostic-privacy` | Seed, JSON whitelist, DOM whitelist, and harvest failure diagnostics are console/postMessage decisions, not privacy-classed metric output. | Missing approval; console budget, privacy class, redaction, debug gate, and metric replacement budgets are absent. |
| `FT-SOURCE-LOCUS-SIDEEFFECT-11-parity-release-verification` | `FT-SOURCE-LOCUS-CALLABLE-11-parity-release-verification` | Build scripts can execute UI-shell builds, create zip artifact paths, and invoke native runtime sync. | Missing approval; native/release/public parity, raw-capture exclusion, artifact write, rollout, and rollback budgets are absent. |

## Current Source Side-Effect Anchors

| File | Line | Current anchor |
| --- | ---: | --- |
| `js/settings_shared.js` | 564 | `function loadSettings()` |
| `js/state_manager.js` | 178 | `async function loadSettings(options = {})` |
| `js/state_manager.js` | 1233 | `chrome.runtime?.sendMessage({` |
| `js/seed.js` | 157 | `window.postMessage({` |
| `js/seed.js` | 701 | `return response.clone().json().then(jsonData =>` |
| `js/seed.js` | 731 | `return new Response(JSON.stringify(emptyCommentResponse), {` |
| `js/seed.js` | 741 | `return new Response(JSON.stringify(processed), {` |
| `js/seed.js` | 843 | `jsonData = JSON.parse(trimmed)` |
| `js/seed.js` | 878 | `Object.defineProperty(xhr, 'responseText'` |
| `js/seed.js` | 899 | `proto.addEventListener = function (type, listener, options)` |
| `js/filter_logic.js` | 65 | `pendingVideoChannelFlush = setTimeout(() =>` |
| `js/filter_logic.js` | 71 | `window.postMessage({` |
| `js/filter_logic.js` | 132 | `window.postMessage({` |
| `js/filter_logic.js` | 1502 | `window.postMessage({` |
| `js/filter_logic.js` | 1581 | `console.log('FilterTube Whitelist (JSON):'` |
| `js/filter_logic.js` | 2168 | `scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true })` |
| `js/filter_logic.js` | 3442 | `this._harvestChannelData(data)` |
| `js/filter_logic.js` | 3444 | `console.warn('FilterTube: Harvesting failed', e)` |
| `js/filter_logic.js` | 3459 | `const filtered = this.filter(data)` |
| `js/content/dom_fallback.js` | 2035 | `async function applyDOMFallback(settings, options = {})` |
| `js/content/dom_fallback.js` | 2310 | `document.querySelectorAll('[data-filtertube-hidden], .filtertube-hidden, [data-filtertube-pending-category], [data-filtertube-pending-upload-date]')` |
| `js/content/dom_fallback.js` | 2488 | `scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true })` |
| `js/content/dom_fallback.js` | 3668 | `targetToHide.setAttribute('data-filtertube-whitelist-pending', 'true')` |
| `js/content/dom_fallback.js` | 4559 | `console.log('FilterTube Whitelist (DOM):'` |
| `js/content/block_channel.js` | 1408 | `function removeQuickBlockButtons()` |
| `js/content/block_channel.js` | 1699 | `chrome.runtime?.sendMessage({` |
| `js/content/block_channel.js` | 1734 | `targetToHide.classList.add('filtertube-hidden')` |
| `js/content/block_channel.js` | 1735 | `targetToHide.setAttribute('data-filtertube-hidden', 'true')` |
| `js/content/block_channel.js` | 2218 | `const observer = new MutationObserver((mutations) =>` |
| `js/content/block_channel.js` | 2277 | `document.addEventListener('yt-navigate-finish'` |
| `js/content/block_channel.js` | 2835 | `chrome.runtime?.sendMessage({` |
| `js/content/block_channel.js` | 3149 | `await injectFilterTubeMenuItem(dropdown, videoCard)` |
| `js/content/handle_resolver.js` | 167 | `const storage = await browserAPI_BRIDGE.storage.local.get(['channelMap'])` |
| `js/content/handle_resolver.js` | 192 | `resolvedHandleCache.set(cleanHandle, 'PENDING')` |
| `js/content/handle_resolver.js` | 218 | `window.postMessage({` |
| `js/content/handle_resolver.js` | 239 | `response = await fetch(path` |
| `js/content/handle_resolver.js` | 240 | `credentials: 'same-origin'` |
| `js/background.js` | 1480 | `pendingChannelMapUpdates.clear()` |
| `js/background.js` | 1481 | `await browserAPI.storage.local.set({ channelMap: map })` |
| `js/background.js` | 1489 | `channelMapFlushTimer = setTimeout(() =>` |
| `js/state_manager.js` | 2004 | `await chrome.storage?.local.set({ channelMap: state.channelMap })` |
| `js/io_manager.js` | 2000 | `clearTimeout(backupScheduleTimer)` |
| `js/io_manager.js` | 2003 | `backupScheduleTimer = setTimeout(async () =>` |
| `js/content_bridge.js` | 3713 | `chrome.storage.local.get(['stats', 'statsBySurface']` |
| `js/content_bridge.js` | 6158 | `whitelistPendingRefreshState.timer = setTimeout(() =>` |
| `js/content_bridge.js` | 6208 | `whitelistPendingRefreshState.pendingHideTimer = setTimeout(() =>` |
| `js/content_bridge.js` | 6297 | `element.classList.add('filtertube-hidden')` |
| `js/content_bridge.js` | 6298 | `element.setAttribute('data-filtertube-hidden', 'true')` |
| `js/content_bridge.js` | 12216 | `prevHiddenAttr: element.getAttribute('data-filtertube-hidden')` |
| `js/content_bridge.js` | 12229 | `element.classList.add('filtertube-hidden')` |
| `build.js` | 82 | `execSync('node scripts/build-extension-ui.mjs', { stdio: 'inherit' })` |
| `build.js` | 184 | `const zipPath = path.join('dist', zipName)` |
| `scripts/sync-native-runtime.mjs` | 21 | `const result = spawnSync(process.execPath, [syncScript]` |

## Current Side-Effect Decision

```text
source-locus side-effect boundary documented: GO
runtime source-owner approval now: NO-GO
commit side-effect-budget.json now: NO-GO
commit no-work-preservation.json now: NO-GO
commit source-owner-map.json now: NO-GO
runtime metric collector approval now: NO-GO
runtime collector insertion now: NO-GO
commit metric foundation artifact files now: NO-GO
JSON-first runtime behavior patch: NO-GO
whitelist optimization patch: NO-GO
native sync patch: NO-GO
release package patch: NO-GO
public claim patch: NO-GO
continue proof-backed audit: GO
```

The current anchors show why side effects cannot be inferred from one
settings-mode guard or one future metric schema. Effects remain split across
settings messages, transport rewrites, XHR listener/accessor overrides, engine
postMessage queues, DOM scans, metadata fetches, menu/quick lifecycle,
network/credentialed repair, storage writes, visual hide/restore, whitelist
pending hide, diagnostics, and build/native release paths.

## Missing Runtime Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
firstOptimizationSourceLocusSideEffectBoundary
firstOptimizationSourceLocusSideEffectReport
sourceLocusSideEffectApproval
sourceLocusCallableSideEffectOwnerApproval
jsonFirstSourceLocusSideEffectGate
whitelistSourceLocusSideEffectGate
metricFoundationSideEffectAuthority
runtimeSourceSideEffectOwnerMap
runtimeSourceSideEffectCollector
sourceLocusSideEffectMetricArtifact
sourceLocusSideEffectBudgetPacket
runtimeSideEffectOptimizationAuthority
```

## Verification

Current proof command:

```bash
node --test tests/runtime/first-optimization-source-locus-side-effect-ownership-boundary-current-behavior.test.mjs --test-reporter=spec
```

This gate is not a completion claim. It proves current side-effect risk
anchors are known while source-owner approval, side-effect budget artifacts,
runtime collectors, metric artifacts, rollback implementation, native sync
patches, release package changes, public claim changes, and runtime
optimization approval remain absent.

## First Optimization Source-Locus Fixture Provenance Ownership Boundary Addendum

First optimization source-locus fixture provenance ownership boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FIXTURE_PROVENANCE_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-fixture-provenance-ownership-boundary-current-behavior.test.mjs`
move this source-locus side-effect classification into current source-locus
fixture provenance ownership classification without changing runtime behavior
or approving runtime collectors. The addendum pins 12 source-locus fixture
provenance boundary rows, 12 source-locus callable rows covered, 12
source-locus fingerprint rows covered, 12 source-locus teardown rows covered,
12 source-locus no-work rows covered, 12 source-locus side-effect rows
covered, 12 collector fixture provenance rows covered, 12 fixture provenance
contract rows covered, 11 P0 capture traceability rows covered, 46 unique raw
capture obligation paths covered, 44 committed reduced fixture fragments
covered, 25 current fixture provenance anchors covered, 0 committed fixture
provenance files, 0 runtime source-owner approvals, 0 runtime metric collector
approvals, 0 runtime collector insertion points approved, 0 implementation-ready
source-locus fixture provenance rows, expected runtime audit tests: 4457,
expected runtime audit pass: 4457, and expected runtime audit fail 0. It keeps
side-effect ownership blocked until fixture provenance is approved with
source-owner, no-work, side-effect, diagnostic, parity, verification, rollback,
native/release, raw-capture, and public-claim proof.

## First Optimization Collector Side-Effect Approval Boundary Addendum

`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_SIDE_EFFECT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-collector-side-effect-approval-boundary-current-behavior.test.mjs`
prove source-locus side-effect classification is not runtime side-effect
approval. The addendum pins 12 collector side-effect approval boundary rows,
12 source-locus side-effect rows covered, 12 collector side-effect rows
covered, 12 side-effect budget contract rows covered, 53 current source
side-effect anchors covered, 8 side-effect risk classes covered, 0 runtime
source-owner approvals, 0 runtime metric collector approvals, 0 runtime
collector insertion points approved, 0 runtime collector side-effect budgets
approved, 69 method semantic proof gap files covered, 5,681 lexical callables
still requiring semantic proof, 0 files with complete per-callable semantic
proof, 0 committed side-effect budget files, 0 implementation-ready collector
side-effect approval rows, expected runtime audit tests: 4457, expected runtime
audit pass: 4457, and expected runtime audit fail 0. It keeps classification
separate from approval until measured side-effect budgets, rollback limits,
verification output, and affected callable semantic authority exist.
