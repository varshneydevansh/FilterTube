# FilterTube First Optimization Source-Locus Teardown Ownership Boundary - Current Behavior - 2026-05-24

Status: audit-only current-behavior first optimization source-locus teardown
ownership boundary. Runtime behavior is unchanged. This is not an
implementation patch, optimization patch, metric collector patch,
source-owner map artifact, JSON-first behavior patch, whitelist patch,
settings patch, lifecycle patch, diagnostic patch, native sync patch, release
patch, public claim patch, or committed metric artifact.

## Purpose

The source-locus callable boundary pins current callables, and the fingerprint
boundary pins current file revisions. Those facts still do not prove teardown
ownership. This boundary classifies the current teardown state for the same
first optimization source-locus rows before any future metric collector,
JSON-first behavior patch, or whitelist optimization can attach to runtime
listeners, observers, timers, page-global patches, map flushes, or visual
side effects.

The current boundary is:

```text
Selected first optimization binding: FT-BIND-00-metric-artifact-foundation
Required source-owner map path: docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json
Source-locus teardown boundary rows: 12
Source-locus callable rows covered: 12
Source-locus fingerprint rows covered: 12
Runtime source files with teardown evidence covered: 8
Runtime/build source files classified: 14
Audit/test anchor files covered: 2
Current source teardown anchors covered: 42
Lifecycle teardown classes covered: 5
Runtime source-owner approvals: 0
Runtime metric collector approvals: 0
Implementation-ready source-locus teardown rows: 0
```

This is teardown ownership classification, not teardown approval. A future
approval still needs owner signatures, a source-owner map artifact, no-work
preservation, side-effect budgets, fixture provenance, diagnostic privacy,
parity rollout, verification output, rollback limits, native/release
boundaries, raw-capture exclusions, and public-claim limits.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Provides the 12 source-locus callable rows, 38 line anchors, 14 runtime source files, and 9 listener/observer/timer surfaces. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Provides current source file hashes and keeps source hashes separate from approval. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Requires callable, listener, observer, timer, and teardown owner approval before source-owner approval can exist. |
| `docs/audit/FILTERTUBE_LIFECYCLE_TEARDOWN_DECISION_REGISTER_2026-05-20.md` | Defines the teardown classes and proves the current repo has local cleanup but no shared teardown decision report. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Requires observer/timer teardown proof before no-work preservation can be approved. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Requires listener-wrap, accessor lifetime, ready/load parity, and teardown proof before side-effect budgets can be approved. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves runtime metric collector approval remains absent. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves 0 implementation-ready first optimization rows. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as approval. |

## Current Counts

```text
source-locus teardown boundary rows: 12
source-locus callable rows covered: 12
source-locus fingerprint rows covered: 12
runtime source files with teardown evidence covered: 8
runtime/build source files classified: 14
audit/test anchor files covered: 2
current source teardown anchors covered: 42
lifecycle teardown classes covered: 5
committed source-owner map files: 0
runtime source-owner approvals: 0
runtime metric collector approvals: 0
runtime collector insertion points approved: 0
implementation-ready source-locus teardown rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for source-locus teardown approval authority
```

Classified runtime/build source file set:

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

Runtime source files with direct teardown evidence in this slice:

```text
js/seed.js
js/filter_logic.js
js/content_bridge.js
js/content/dom_fallback.js
js/content/block_channel.js
js/background.js
js/state_manager.js
js/io_manager.js
```

## Source Locus Teardown Matrix

| Teardown row id | Source-locus callable row | Current teardown state | Approval state |
| --- | --- | --- | --- |
| `FT-SOURCE-LOCUS-TEARDOWN-00-settings-scope` | `FT-SOURCE-LOCUS-CALLABLE-00-settings-scope` | Shared settings reads are ordinary calls; StateManager storage refresh uses a debounced external reload timer and a page/UI-lifetime `chrome.storage.onChanged` listener. | Missing approval; settings refresh teardown is not source-owner approved. |
| `FT-SOURCE-LOCUS-TEARDOWN-01-fixture-audit-envelope` | `FT-SOURCE-LOCUS-CALLABLE-01-fixture-audit-envelope` | Audit/test anchors have no runtime teardown, but they also do not approve runtime owners. | Missing approval; audit fixtures are not teardown authority. |
| `FT-SOURCE-LOCUS-TEARDOWN-02-transport-json` | `FT-SOURCE-LOCUS-CALLABLE-02-transport-json` | Seed fetch/XHR/page-global hooks are page-lifetime once installed; XHR listener wrapping preserves `removeEventListener`, but no restore/unpatch owner exists. | Missing approval; transport teardown and accessor lifetime are not approved. |
| `FT-SOURCE-LOCUS-TEARDOWN-03-filter-engine` | `FT-SOURCE-LOCUS-CALLABLE-03-filter-engine` | Engine traversal is callable-local, while queued video-channel/video-meta postMessage flush timers have local drain behavior but no shared teardown owner. | Missing approval; engine metric collection is not approved. |
| `FT-SOURCE-LOCUS-TEARDOWN-04-dom-fallback` | `FT-SOURCE-LOCUS-CALLABLE-04-dom-fallback` | DOM fallback has page-lifetime scroll, click, ended, body mutation, delayed rerun, and whitelist-pending timers with local gates. | Missing approval; zero-scan disabled/no-rule teardown is not approved. |
| `FT-SOURCE-LOCUS-TEARDOWN-05-menu-quickblock` | `FT-SOURCE-LOCUS-CALLABLE-05-menu-quickblock` | Quick-block and fallback menu own page-lifetime listeners, body observers, periodic/warmup timers, and local popover cleanup. | Missing approval; menu-off and quick-block-off teardown are not approved. |
| `FT-SOURCE-LOCUS-TEARDOWN-06-network-resolver` | `FT-SOURCE-LOCUS-CALLABLE-06-network-resolver` | Resolver and background waits use fetches, caches, and timeout races without one cancellation/teardown owner for future counters. | Missing approval; network resolver teardown is not approved. |
| `FT-SOURCE-LOCUS-TEARDOWN-07-storage-map-mutation` | `FT-SOURCE-LOCUS-CALLABLE-07-storage-map-mutation` | Background channel-map flushes and IO backup scheduling use timers with local replacement/flush behavior, not one mutation teardown registry. | Missing approval; storage/map mutation teardown is not approved. |
| `FT-SOURCE-LOCUS-TEARDOWN-08-hide-restore-visual` | `FT-SOURCE-LOCUS-CALLABLE-08-hide-restore-visual` | Visual hide/restore has local marker cleanup and some restore scans, but no shared writer registry or lifecycle disposal owner. | Missing approval; visual side-effect teardown is not approved. |
| `FT-SOURCE-LOCUS-TEARDOWN-09-whitelist-policy` | `FT-SOURCE-LOCUS-CALLABLE-09-whitelist-policy` | Whitelist pending refresh timers and pending-hide candidate queues are locally gated and cleared, but fail-closed pending hide work is not globally budgeted. | Missing approval; whitelist teardown/no-work is not approved. |
| `FT-SOURCE-LOCUS-TEARDOWN-10-diagnostic-privacy` | `FT-SOURCE-LOCUS-CALLABLE-10-diagnostic-privacy` | Diagnostics are console/postMessage decisions rather than lifecycle owners, but future metrics still need diagnostic privacy and redaction ownership. | Missing approval; diagnostic replacement is not approved. |
| `FT-SOURCE-LOCUS-TEARDOWN-11-parity-release-verification` | `FT-SOURCE-LOCUS-CALLABLE-11-parity-release-verification` | Build and sync scripts are process-lifetime command paths, not page-runtime teardown owners. Package/release parity still needs artifact proof. | Missing approval; release/native/public teardown equivalence is not approved. |

## Current Source Teardown Anchors

| File | Line | Current evidence |
| --- | ---: | --- |
| `js/seed.js` | 685 | Fetch prototype patch is installed by direct assignment. |
| `js/seed.js` | 775 | XHR original `addEventListener` is captured. |
| `js/seed.js` | 776 | XHR original `removeEventListener` is captured. |
| `js/seed.js` | 863 | Per-XHR `response` getter override is installed. |
| `js/seed.js` | 912 | XHR `removeEventListener` is wrapped. |
| `js/filter_logic.js` | 74 | Video-channel map postMessage flush uses a timer. |
| `js/filter_logic.js` | 135 | Video-meta map postMessage flush uses a timer. |
| `js/content_bridge.js` | 1148 | Card prefetch uses an `IntersectionObserver`. |
| `js/content_bridge.js` | 1160 | Prefetch pause uses a visibility listener. |
| `js/content_bridge.js` | 1185 | Playlist panel prefetch uses a captured scroll listener. |
| `js/content_bridge.js` | 1193 | Playlist panel prefetch uses a `MutationObserver`. |
| `js/content_bridge.js` | 1208 | Playlist panel observer has navigation-scoped disconnect. |
| `js/content_bridge.js` | 1248 | Right-rail whitelist refresh uses a `MutationObserver`. |
| `js/content_bridge.js` | 1268 | Right-rail observer has navigation-scoped disconnect. |
| `js/content_bridge.js` | 5945 | Subscription import progress clears and rearms a request timeout. |
| `js/content_bridge.js` | 6107 | DOM fallback reruns use a debounced callback. |
| `js/content_bridge.js` | 6126 | Immediate DOM fallback rerun can schedule a timer. |
| `js/content_bridge.js` | 6148 | Whitelist pending refresh state stores timers and candidates. |
| `js/content_bridge.js` | 6208 | Whitelist pending hide uses a delayed timer. |
| `js/content_bridge.js` | 6416 | DOM fallback startup owns a body mutation observer. |
| `js/content_bridge.js` | 7094 | Fallback menu owns a body mutation observer. |
| `js/content_bridge.js` | 7178 | Fallback menu owns a scroll listener. |
| `js/content_bridge.js` | 7198 | Fallback menu warmup uses an interval. |
| `js/content_bridge.js` | 7204 | Fallback menu warmup clears that interval locally. |
| `js/content_bridge.js` | 7258 | Playlist fallback popover disconnects its row observer locally. |
| `js/content_bridge.js` | 7264 | Playlist fallback popover removes its document click listener locally. |
| `js/content/block_channel.js` | 1949 | Quick-block sweep scheduling is timer-backed. |
| `js/content/block_channel.js` | 1991 | Quick-block setup installs document focus listeners. |
| `js/content/block_channel.js` | 2201 | Quick-block hover tracking installs a pointermove listener. |
| `js/content/block_channel.js` | 2218 | Quick-block setup owns a body mutation observer. |
| `js/content/block_channel.js` | 2277 | Quick-block setup owns a route-navigation sweep listener. |
| `js/content/dom_fallback.js` | 2105 | DOM fallback installs a page scroll listener. |
| `js/content/dom_fallback.js` | 2339 | Playlist nav guard installs a document click listener. |
| `js/content/dom_fallback.js` | 2403 | Playlist autoplay guard installs an ended listener. |
| `js/background.js` | 912 | Background waits for post-block enrichment before backup. |
| `js/background.js` | 918 | Background wait includes a timeout race. |
| `js/background.js` | 1489 | Channel-map flush scheduling uses a timer. |
| `js/state_manager.js` | 2350 | External settings reload uses a debounce timer. |
| `js/state_manager.js` | 2356 | StateManager installs a storage change listener. |
| `js/io_manager.js` | 50 | Backup download blob cleanup uses a delayed revoke timer. |
| `js/io_manager.js` | 2000 | Auto-backup scheduling clears prior timers. |
| `js/io_manager.js` | 2003 | Auto-backup scheduling creates a delayed timer. |

## Current Teardown Decision

```text
source-locus teardown boundary documented: GO
local teardown and page-lifetime classifications pinned: GO
runtime source-owner approval now: NO-GO
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

This boundary makes teardown ownership gaps explicit. It does not authorize
deleting, moving, delaying, merging, or adding any fetch/XHR hook, DOM scan,
observer, listener, timer, interval, animation frame, storage listener, map
flush, visual hide/restore writer, or release artifact path.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input for this first-optimization boundary. Current proof
pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.

## Missing Runtime Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
firstOptimizationSourceLocusTeardownBoundary
firstOptimizationSourceLocusTeardownReport
sourceLocusTeardownApproval
sourceLocusCallableTeardownOwnerApproval
jsonFirstSourceLocusTeardownGate
whitelistSourceLocusTeardownGate
metricFoundationTeardownAuthority
runtimeSourceTeardownOwnerMap
runtimeSourceTeardownCollector
sourceLocusTeardownMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/first-optimization-source-locus-teardown-ownership-boundary-current-behavior.test.mjs --test-reporter=spec
```

This gate is not a completion claim. It proves current teardown classifications
are known while source-owner approval, source-owner map artifacts, runtime
collectors, metric artifacts, rollback implementation, native sync patches,
release package changes, public claim changes, and runtime optimization
approval remain absent.

## First Optimization Source-Locus No-Work Ownership Boundary Addendum

First optimization source-locus no-work ownership boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-no-work-ownership-boundary-current-behavior.test.mjs`
move this teardown classification into current no-work ownership
classification without creating no-work artifacts or approving runtime
changes. The addendum pins 12 source-locus no-work boundary rows, 12
source-locus callable rows covered, 12 source-locus fingerprint rows covered,
12 source-locus teardown rows covered, 12 collector no-work rows covered, 4 P0
no-work fixture names covered, 9 required no-work counter groups covered, 14
runtime/build source files classified, 12 runtime/build source files with
no-work evidence covered, 2 audit/test anchor files covered, 48 current source
no-work anchors covered, 7 no-work risk classes covered, 0 committed no-work
preservation files, 0 committed source-owner map files, 0 runtime source-owner
approvals, 0 runtime metric collector approvals, 0 runtime collector insertion
points approved, 0 implementation-ready source-locus no-work rows, expected
runtime audit tests 4457, expected runtime audit pass: 4457, and expected
runtime audit fail 0. It preserves the non-completion boundary: local teardown
and no-work classifications are not owner approval, measured no-work proof,
side-effect budget approval, collector approval, JSON-first behavior approval,
whitelist optimization approval, release parity, or public-claim permission.

## First Optimization Source-Locus Side-Effect Ownership Boundary Addendum

First optimization source-locus side-effect ownership boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-side-effect-ownership-boundary-current-behavior.test.mjs`
move this teardown classification into current side-effect ownership
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
boundary: local teardown and side-effect classifications are not owner
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
preserves the non-completion boundary: local teardown, side-effect, and fixture
provenance classifications are not owner approval, measured no-work proof,
side-effect budget approval, collector approval, JSON-first behavior approval,
whitelist optimization approval, release parity, or public-claim permission.
