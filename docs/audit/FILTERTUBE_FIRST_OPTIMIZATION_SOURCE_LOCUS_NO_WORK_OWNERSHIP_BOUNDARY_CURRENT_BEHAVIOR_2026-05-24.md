# FilterTube First Optimization Source-Locus No-Work Ownership Boundary - Current Behavior - 2026-05-24

Status: audit-only current-behavior first optimization source-locus no-work
ownership boundary. Runtime behavior is unchanged. This is not an
implementation patch, optimization patch, metric collector patch,
source-owner map artifact, JSON-first behavior patch, whitelist patch,
settings patch, lifecycle patch, diagnostic patch, native sync patch, release
patch, public claim patch, or committed metric artifact.

## Purpose

The source-locus teardown boundary classifies current listener, observer,
timer, page-global, storage, and visual lifetimes. This boundary records where
the same source loci still need no-work ownership before any JSON-first or
whitelist optimization can claim that disabled, empty, no-rule, missing
settings, pass-through, menu-off, no-network, no-storage, no-visual, or
diagnostic-quiet states remain quiet.

The current boundary is:

```text
Selected first optimization binding: FT-BIND-00-metric-artifact-foundation
Required no-work preservation path: docs/audit/artifacts/first-optimization/metric-foundation/no-work-preservation.json
Source-locus no-work boundary rows: 12
Current source no-work anchors covered: 48
Runtime/build source files with no-work evidence covered: 12
Committed no-work preservation files: 0
Runtime source-owner approvals: 0
Runtime metric collector approvals: 0
Implementation-ready source-locus no-work rows: 0
```

This is no-work ownership classification, not no-work approval. A future
approval still needs source-owner signatures, measured no-work counters,
side-effect budgets, fixture provenance, diagnostic privacy, parity rollout,
verification output, rollback limits, native/release boundaries, raw-capture
exclusions, and public-claim limits.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Provides the 12 source-locus callable rows that need no-work ownership. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Pins the current file revisions used for no-work classification. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Classifies current teardown/lifetime gaps that no-work ownership must respect. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Provides 12 collector no-work rows, 4 P0 no-work fixtures, and 9 required counter groups. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_NO_WORK_PRESERVATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future `no-work-preservation.json` structure but proves 0 files and approvals. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves runtime collector approval remains absent. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves 0 implementation-ready first optimization rows. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as approval. |

## Current Counts

```text
source-locus no-work boundary rows: 12
source-locus callable rows covered: 12
source-locus fingerprint rows covered: 12
source-locus teardown rows covered: 12
collector no-work rows covered: 12
P0 no-work fixture names covered: 4
required no-work counter groups covered: 9
runtime/build source files classified: 14
runtime/build source files with no-work evidence covered: 12
audit/test anchor files covered: 2
current source no-work anchors covered: 48
no-work risk classes covered: 7
committed no-work preservation files: 0
committed source-owner map files: 0
runtime source-owner approvals: 0
runtime metric collector approvals: 0
runtime collector insertion points approved: 0
implementation-ready source-locus no-work rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for source-locus no-work approval authority
```

Covered collector no-work rows from the collector preservation matrix:

```text
FT-COLLECTOR-NOWORK-00-settings-snapshot-preservation
FT-COLLECTOR-NOWORK-01-fixture-envelope-preservation
FT-COLLECTOR-NOWORK-02-fetch-pass-through-preservation
FT-COLLECTOR-NOWORK-03-xhr-hook-preservation
FT-COLLECTOR-NOWORK-04-engine-harvest-preservation
FT-COLLECTOR-NOWORK-05-dom-quiet-preservation
FT-COLLECTOR-NOWORK-06-menu-quick-off-preservation
FT-COLLECTOR-NOWORK-07-network-zero-fetch-preservation
FT-COLLECTOR-NOWORK-08-storage-zero-mutation-preservation
FT-COLLECTOR-NOWORK-09-visual-no-mutation-preservation
FT-COLLECTOR-NOWORK-10-whitelist-fail-state-preservation
FT-COLLECTOR-NOWORK-11-diagnostic-claim-preservation
```

Covered P0 no-work fixture names:

```text
empty_blocklist_desktop_home_no_work
empty_blocklist_mobile_home_no_work
empty_blocklist_watch_no_player_mutation
disabled_extension_no_mutation
```

Covered required no-work counter groups:

```text
responseJson
jsonParse
jsonStringify
processData
harvestOnly
direct network fetches
DOM scans
quick/fallback menu sweeps
stats/map/storage writes
```

## Classified Runtime And Build Source File Set

The no-work ownership boundary classifies the same first-optimization source
set as the source-locus callable and teardown gates:

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

Runtime/build source files with direct no-work evidence in this slice:

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

## Source-Locus No-Work Matrix

| Source-locus no-work row id | Covered callable row | Current no-work ownership evidence | Missing proof before implementation |
| --- | --- | --- | --- |
| `FT-SOURCE-LOCUS-NOWORK-00-settings-scope` | `FT-SOURCE-LOCUS-CALLABLE-00-settings-scope` | Settings load and StateManager reload paths can read settings and later persist channel maps; disabled scope is observable but not one read-only snapshot owner. | Missing approval; settings no-work ownership, profile/list-mode scope, and storage read/write budgets are not approved. |
| `FT-SOURCE-LOCUS-NOWORK-01-fixture-audit-envelope` | `FT-SOURCE-LOCUS-CALLABLE-01-fixture-audit-envelope` | Audit docs/tests define future artifact shapes and fixture names, but no runtime no-work preservation packet exists. | Missing approval; audit fixtures cannot substitute for runtime no-work evidence. |
| `FT-SOURCE-LOCUS-NOWORK-02-transport-json` | `FT-SOURCE-LOCUS-CALLABLE-02-transport-json` | Seed fetch can clone, parse, process, and rebuild matching responses; XHR can mark, wrap, parse, and replace responses before body-work decisions complete. | Missing approval; disabled, missing-settings, no-rule, clone-free, parse-free, and response-identity no-work proof is absent. |
| `FT-SOURCE-LOCUS-NOWORK-03-filter-engine` | `FT-SOURCE-LOCUS-CALLABLE-03-filter-engine` | Filter logic harvests before the disabled kill-switch and then filters active data; harvest-only, map-write, and mutation paths are not one no-work authority. | Missing approval; engine no-work, harvest-only budget, and mutation-free pass-through proof are absent. |
| `FT-SOURCE-LOCUS-NOWORK-04-dom-fallback` | `FT-SOURCE-LOCUS-CALLABLE-04-dom-fallback` | DOM fallback has an active-work predicate, disabled cleanup scans, video selector scans, and metadata fetch scheduling. | Missing approval; zero-scan disabled/no-rule proof, selector budgets, and metadata no-work budgets are absent. |
| `FT-SOURCE-LOCUS-NOWORK-05-menu-quickblock` | `FT-SOURCE-LOCUS-CALLABLE-05-menu-quickblock` | Quick-block checks the setting inside work, while sweep timers, pointer listeners, observers, and route sweep listeners can already be installed. The previous periodic timer is gone. | Missing approval; menu-off, quick-block-off, fullscreen/native quiet, listener, observer, and timer no-work proof is absent. |
| `FT-SOURCE-LOCUS-NOWORK-06-network-resolver` | `FT-SOURCE-LOCUS-CALLABLE-06-network-resolver` | Handle resolution reads channelMap, uses pending sentinels, can direct-fetch same-origin pages, and can schedule DOM fallback reruns. | Missing approval; zero-fetch, cache-hit/cache-miss, credential, pending sentinel, and timeout budgets are absent. |
| `FT-SOURCE-LOCUS-NOWORK-07-storage-map-mutation` | `FT-SOURCE-LOCUS-CALLABLE-07-storage-map-mutation` | Background and StateManager channel maps, stats reads, and IO backup timers remain separate mutation paths. | Missing approval; no-storage/no-map-write proof, backup suppression proof, and refresh fanout budget are absent. |
| `FT-SOURCE-LOCUS-NOWORK-08-hide-restore-visual` | `FT-SOURCE-LOCUS-CALLABLE-08-hide-restore-visual` | Visual paths record previous hidden state, add hide classes/attributes, and restore markers; counters cannot be inserted without separating measurement from mutation. | Missing approval; no-visual-mutation, sibling-visible, restore, stale-marker cleanup, and selected-row proof are absent. |
| `FT-SOURCE-LOCUS-NOWORK-09-whitelist-policy` | `FT-SOURCE-LOCUS-CALLABLE-09-whitelist-policy` | Whitelist pending refresh and pending-hide timers can mark cards while identity remains unresolved. | Missing approval; empty whitelist, unresolved identity, pending TTL, false-hide, and leak budgets are absent. |
| `FT-SOURCE-LOCUS-NOWORK-10-diagnostic-privacy` | `FT-SOURCE-LOCUS-CALLABLE-10-diagnostic-privacy` | Seed, JSON whitelist, DOM whitelist, and harvest diagnostics remain console decisions rather than privacy-classed metric output. | Missing approval; diagnostic quiet/no-leak proof, redaction, debug gates, and console budgets are absent. |
| `FT-SOURCE-LOCUS-NOWORK-11-parity-release-verification` | `FT-SOURCE-LOCUS-CALLABLE-11-parity-release-verification` | Build UI shell execution, zip artifact creation, and native runtime sync are process-level paths, not runtime no-work owners. | Missing approval; native/release/public parity no-work and raw-capture exclusion proof are absent. |

## Current Source No-Work Anchors

| File | Line | Current anchor |
| --- | ---: | --- |
| `js/settings_shared.js` | 564 | `function loadSettings()` |
| `js/state_manager.js` | 178 | `async function loadSettings(options = {})` |
| `js/seed.js` | 391 | `pendingDataQueue.push({ data: data, name: dataName, timestamp: Date.now(), reason: reason || '' })` |
| `js/seed.js` | 411 | `if (cachedSettings.enabled === false)` |
| `js/seed.js` | 423 | `window.FilterTubeEngine.harvestOnly(data, cachedSettings || { filterChannels: [], filterKeywords: [] })` |
| `js/seed.js` | 701 | `return response.clone().json().then(jsonData =>` |
| `js/seed.js` | 819 | `if (cachedSettings.enabled === false) return` |
| `js/seed.js` | 843 | `jsonData = JSON.parse(trimmed)` |
| `js/seed.js` | 863 | `Object.defineProperty(xhr, 'response'` |
| `js/filter_logic.js` | 3442 | `this._harvestChannelData(data)` |
| `js/filter_logic.js` | 3444 | `console.warn('FilterTube: Harvesting failed', e)` |
| `js/filter_logic.js` | 3449 | `if (this.settings.enabled === false)` |
| `js/filter_logic.js` | 3459 | `const filtered = this.filter(data)` |
| `js/content/dom_fallback.js` | 1933 | `function hasActiveDOMFallbackWork(settings)` |
| `js/content/dom_fallback.js` | 2035 | `async function applyDOMFallback(settings, options = {})` |
| `js/content/dom_fallback.js` | 2304 | `if (effectiveSettings.enabled === false)` |
| `js/content/dom_fallback.js` | 2310 | `document.querySelectorAll('[data-filtertube-hidden], .filtertube-hidden, [data-filtertube-pending-category], [data-filtertube-pending-upload-date]')` |
| `js/content/dom_fallback.js` | 2326 | `const videoElements = (onlyWhitelistPending && listMode === 'whitelist')` |
| `js/content/dom_fallback.js` | 2488 | `scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true })` |
| `js/content/block_channel.js` | 1211 | `currentSettings.showQuickBlockButton !== true` |
| `js/content/block_channel.js` | 1962 | `quickBlockSweepTimer = setTimeout(() =>` |
| `js/content/block_channel.js` | 2201 | `document.addEventListener('pointermove'` |
| `js/content/block_channel.js` | 2218 | `const observer = new MutationObserver((mutations) =>` |
| `js/content/block_channel.js` | 2277 | `document.addEventListener('yt-navigate-finish'` |
| `js/content/handle_resolver.js` | 149 | `async function fetchIdForHandle(handle, options = {})` |
| `js/content/handle_resolver.js` | 167 | `const storage = await browserAPI_BRIDGE.storage.local.get(['channelMap'])` |
| `js/content/handle_resolver.js` | 192 | `resolvedHandleCache.set(cleanHandle, 'PENDING')` |
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
| `js/seed.js` | 153 | ``console.log(`[${seedDebugSequence}] FilterTube (Seed):`, message, ...args)`` |
| `js/filter_logic.js` | 1581 | `console.log('FilterTube Whitelist (JSON):'` |
| `js/content/dom_fallback.js` | 4559 | `console.log('FilterTube Whitelist (DOM):'` |
| `build.js` | 82 | `execSync('node scripts/build-extension-ui.mjs', { stdio: 'inherit' })` |
| `build.js` | 184 | `const zipPath = path.join('dist', zipName)` |
| `scripts/sync-native-runtime.mjs` | 21 | `const result = spawnSync(process.execPath, [syncScript]` |

## Current No-Work Decision

```text
source-locus no-work boundary documented: GO
runtime source-owner approval now: NO-GO
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

The current anchors show why a no-work claim cannot be inferred from a single
settings check. Work remains split across transport body reads, engine harvest,
DOM cleanup, selector scans, active menu lifecycle, resolver fetches, storage
flushes, visual marker writes, whitelist pending hides, diagnostics, and
build/release parity paths.

## Missing Runtime Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
firstOptimizationSourceLocusNoWorkBoundary
firstOptimizationSourceLocusNoWorkReport
sourceLocusNoWorkApproval
sourceLocusCallableNoWorkOwnerApproval
jsonFirstSourceLocusNoWorkGate
whitelistSourceLocusNoWorkGate
metricFoundationNoWorkAuthority
runtimeSourceNoWorkOwnerMap
runtimeSourceNoWorkCollector
sourceLocusNoWorkMetricArtifact
sourceLocusNoWorkPreservationPacket
runtimeNoWorkOptimizationAuthority
```

## Verification

Current proof command:

```bash
node --test tests/runtime/first-optimization-source-locus-no-work-ownership-boundary-current-behavior.test.mjs --test-reporter=spec
```

This gate is not a completion claim. It proves current no-work risk anchors
are known while source-owner approval, no-work preservation artifacts, runtime
collectors, metric artifacts, rollback implementation, native sync patches,
release package changes, public claim changes, and runtime optimization
approval remain absent.

## First Optimization Source-Locus Side-Effect Ownership Boundary Addendum

First optimization source-locus side-effect ownership boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-side-effect-ownership-boundary-current-behavior.test.mjs`
move this no-work classification into current side-effect ownership
classification without creating side-effect budget artifacts or approving
runtime changes. The addendum pins 12 source-locus side-effect boundary rows,
12 source-locus callable rows covered, 12 source-locus fingerprint rows
covered, 12 source-locus teardown rows covered, 12 source-locus no-work rows
covered, 12 collector side-effect rows covered, 7 evidence side-effect rows
covered, 12 required work-budget fields covered, 14 runtime/build source files
classified, 12 runtime/build source files with side-effect evidence covered, 2
audit/test anchor files covered, 53 current source side-effect anchors covered,
8 side-effect risk classes covered, 0 committed side-effect budget files, 0
committed no-work preservation files, 0 committed source-owner map files, 0
runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime
collector insertion points approved, 0 implementation-ready source-locus
side-effect rows, expected runtime audit tests: 4457, expected runtime audit
pass 4457, and expected runtime audit fail 0. It preserves the non-completion
boundary: source-local no-work and side-effect classifications are not owner
approval, measured no-work proof, side-effect budget approval, collector
approval, JSON-first behavior approval, whitelist optimization approval,
release parity, or public-claim permission.

## First Optimization Source-Locus Fixture Provenance Ownership Boundary Addendum

First optimization source-locus fixture provenance ownership boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FIXTURE_PROVENANCE_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-fixture-provenance-ownership-boundary-current-behavior.test.mjs`
move the active audit from source-locus side-effect classification into
current source-locus fixture provenance ownership classification without
changing runtime behavior. The addendum pins 12 source-locus fixture provenance
boundary rows, 12 source-locus callable rows covered, 12 source-locus
fingerprint rows covered, 12 source-locus teardown rows covered, 12
source-locus no-work rows covered, 12 source-locus side-effect rows covered,
12 collector fixture provenance rows covered, 12 fixture provenance contract
rows covered, 11 P0 capture traceability rows covered, 46 unique raw capture
obligation paths covered, 44 committed reduced fixture fragments covered, 25
current fixture provenance anchors covered, 0 committed fixture provenance
files, 0 runtime source-owner approvals, 0 runtime metric collector approvals,
0 runtime collector insertion points approved, 0 implementation-ready
source-locus fixture provenance rows, expected runtime audit tests: 4457,
expected runtime audit pass: 4457, and expected runtime audit fail 0. It
preserves the non-completion boundary: source-local no-work, side-effect, and
fixture provenance classifications are not owner approval, measured no-work
proof, side-effect budget approval, collector approval, JSON-first behavior
approval, whitelist optimization approval, release parity, or public-claim
permission.

## First Optimization Collector No-Work Approval Boundary Addendum

`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_NO_WORK_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-collector-no-work-approval-boundary-current-behavior.test.mjs`
bind this source-locus no-work classification to the no-work approval NO-GO
without approving collectors. The addendum pins 12 collector no-work approval
boundary rows, 12 source-locus no-work rows covered, 12 collector no-work
preservation rows covered, 12 no-work preservation contract rows covered, 0
runtime source-owner approvals, 0 runtime metric collector approvals, 0
runtime collector insertion points approved, 0 runtime collector no-work
proofs approved, 69 method semantic proof gap files covered, 5,673 lexical callables still requiring semantic proof, 0 files with complete per-callable
semantic proof, 0 committed no-work preservation files, 0 implementation-ready
collector no-work approval rows, expected runtime audit tests: 4457, expected
runtime audit pass: 4457, and expected runtime audit fail 0. It keeps
source-local no-work anchors from being treated as measured no-work approval or
callable semantic authority.
