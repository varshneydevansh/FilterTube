# FilterTube First Optimization Source Locus Callable Anchor Boundary - Current Behavior - 2026-05-24

Status: audit-only current-behavior first optimization source locus and
callable anchor boundary. Runtime behavior is unchanged. This is not an
implementation patch, optimization patch, metric collector patch, source-owner
map artifact, JSON-first behavior patch, whitelist patch, settings patch,
lifecycle patch, diagnostic patch, native sync patch, release patch, public
claim patch, or committed metric artifact.

## Purpose

The source-owner approval boundary requires line-anchored source ownership and
callable ownership before a future `source-owner-map.json` can approve runtime
collector insertion. This boundary pins representative current source loci for
the 12 metric owner families while preserving the approval gap: line anchors
and callables are observable, but no source-owner approval exists.

The current boundary is:

```text
Selected first optimization binding: FT-BIND-00-metric-artifact-foundation
Required source-owner map path: docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json
Source locus/callable boundary rows: 12
Line anchors covered: 38
Runtime source files covered: 14
Committed source-owner map files: 0
Runtime source-owner approvals: 0
Runtime metric collector approvals: 0
Implementation-ready source-locus callable rows: 0
```

This is a current-source anchor boundary, not source-owner approval. A future
approval still needs file revision hashes, owner signatures, callable teardown
proof, no-work preservation, side-effect budgets, fixture provenance,
diagnostic privacy, parity rollout, verification output, rollback limits,
native/release boundaries, raw-capture exclusions, and public-claim limits.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Requires line anchors, callable ownership, field production, and teardown ownership before source-owner approval can exist. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Requires `sourceLocus`, `sourceOwner`, `ownerFamily`, `sourceFiles`, `callables`, and `lineAnchors` in the future source owner map. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Provides the 12 metric owner families and 14 runtime source files to anchor. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md` | Provides the 12 metric schema rows whose future fields would need source owners. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves runtime collector approval remains absent. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves 0 approved collector insertion points. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves 0 implementation-ready first optimization rows. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as approval. |

## Current Counts

```text
source-locus callable boundary rows: 12
source-owner approval rows covered: 12
source owner map contract rows covered: 12
metric source-owner rows covered: 12
metric schema rows covered: 12
line anchors covered: 38
runtime source files covered: 14
audit/test anchor files covered: 2
listener/observer/timer surfaces pinned: 9
committed source-owner map files: 0
runtime source-owner approvals: 0
runtime metric collector approvals: 0
runtime collector insertion points approved: 0
implementation-ready source-locus callable rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for source-locus or callable approval authority
```

## Source Locus Callable Matrix

| Source locus row id | Owner family | Current line anchors | Current callable/lifecycle evidence | Current approval state |
| --- | --- | --- | --- | --- |
| `FT-SOURCE-LOCUS-CALLABLE-00-settings-scope` | Settings, profile, route, and list-mode scope. | `js/settings_shared.js:564`, `js/state_manager.js:178`, `js/seed.js:236`. | `loadSettings`, profile V4 reads, active profile settings projection, and injected list-mode checks are split across shared settings, dashboard state, and seed runtime. | Missing approval; settings scope is observable but not source-owner approved. |
| `FT-SOURCE-LOCUS-CALLABLE-01-fixture-audit-envelope` | Audit, fixture, and artifact envelope. | `tests/runtime/first-optimization-source-owner-approval-boundary-current-behavior.test.mjs:9`, `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md:24`. | The reserved source-owner map path is test/doc pinned, but no source-owner map artifact exists. | Missing approval; audit fixtures are not runtime source-owner approval. |
| `FT-SOURCE-LOCUS-CALLABLE-02-transport-json` | Fetch/XHR transport and JSON body work. | `js/seed.js:685`, `js/seed.js:813`, `js/seed.js:924`. | `window.fetch`, XHR response processing, XHR `open`, XHR listener wrapping, response getter replacement, and JSON stringify/parse work are source-local. | Missing approval; transport counters are not approved. |
| `FT-SOURCE-LOCUS-CALLABLE-03-filter-engine` | JSON filter engine traversal, harvesting, and mutation. | `js/filter_logic.js:853`, `js/filter_logic.js:1957`, `js/filter_logic.js:3528`. | `YouTubeDataFilter`, `_shouldBlock`, recursive `filter`, and queued map side effects are engine-local. | Missing approval; engine counters and field production are not approved. |
| `FT-SOURCE-LOCUS-CALLABLE-04-dom-fallback` | DOM fallback, selector scans, and passive lifecycle work. | `js/content/dom_fallback.js:2219`, `js/content/dom_fallback.js:2290`, `js/content_bridge.js:1195`. | `applyDOMFallback`, scroll listener attachment, and playlist-panel mutation observation split DOM lifecycle work across files. | Missing approval; DOM lifecycle counters are not approved. |
| `FT-SOURCE-LOCUS-CALLABLE-05-menu-quickblock` | Menu injection, quick-block affordances, and active UI lifecycle. | `js/content/block_channel.js:1963`, `js/content/block_channel.js:2232`, `js/content_bridge.js:11539`. | Quick-block sweep timers, mutation observers, global document/window listeners, and menu item interaction listeners are action-affordance owned. | Missing approval; action lifecycle counters are not approved. |
| `FT-SOURCE-LOCUS-CALLABLE-06-network-resolver` | Handle, watch, Shorts, Kids, and background resolver work. | `js/content/handle_resolver.js:149`, `js/content/handle_resolver.js:239`, `js/background.js:980`. | `fetchIdForHandle`, same-origin direct fetches, background resolver messages, and wait-for-enrichment timers remain split. | Missing approval; resolver/network counters are not approved. |
| `FT-SOURCE-LOCUS-CALLABLE-07-storage-map-mutation` | Storage, learned maps, cache flush, import/export, and refresh fanout. | `js/background.js:1737`, `js/background.js:1757`, `js/state_manager.js:2356`, `js/io_manager.js:473`. | Channel-map caches, flush timers, storage change listeners, and import/export storage wrappers are separate mutation authorities. | Missing approval; storage/map mutation counters are not approved. |
| `FT-SOURCE-LOCUS-CALLABLE-08-hide-restore-visual` | Hide, restore, stale-row cleanup, and visible side effects. | `js/content/dom_fallback.js:972`, `js/content/dom_fallback.js:1027`, `js/content_bridge.js:12206`. | Block markers, stale hide cleanup, and click-time optimistic hide/restore are visual side effects without one owner. | Missing approval; visual mutation counters are not approved. |
| `FT-SOURCE-LOCUS-CALLABLE-09-whitelist-policy` | Whitelist identity, pending-hide, and list-mode policy. | `js/content/dom_fallback.js:2074`, `js/content_bridge.js:6211`, `js/content_bridge.js:6271`. | Guide whitelist handling, pending refresh timers, and pending-hide candidate timers are split between DOM fallback and bridge lifecycle. | Missing approval; whitelist policy counters are not approved. |
| `FT-SOURCE-LOCUS-CALLABLE-10-diagnostic-privacy` | Runtime diagnostics, debug gates, and console budgets. | `js/seed.js:150`, `js/seed.js:153`, `js/filter_logic.js:21`. | Seed and filter-logic diagnostic relays are local console/postMessage decisions, not privacy-classed metric output. | Missing approval; diagnostic privacy and redaction are not approved. |
| `FT-SOURCE-LOCUS-CALLABLE-11-parity-release-verification` | Build, package, native sync, and release/public parity. | `build.js:82`, `build.js:147`, `scripts/build-extension-ui.mjs:23`, `scripts/build-nanah-vendor.mjs:18`, `scripts/sync-native-runtime.mjs:21`. | Extension UI bundling, zip creation, native runtime sync, and release paths are build/script owned rather than runtime metric collectors. | Missing approval; parity/release verification is not approved. |

## Current Source Locus Decision

```text
line anchors identified for current source: GO
source-locus/callable boundary documented: GO
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

This boundary intentionally stops before approval. The current source anchors
show why a first optimization collector cannot be inserted as a quick local
counter: the relevant ownership crosses transport hooks, JSON traversal, DOM
fallback, active menu affordances, network repair, learned-map storage,
whitelist policy, diagnostics, and release parity.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input for this first-optimization boundary. Current proof
pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.

## Missing Runtime Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
firstOptimizationSourceLocusCallableBoundary
firstOptimizationSourceLocusCallableReport
firstOptimizationSourceLocusCallableApproval
metricFoundationSourceLocusApprovalAuthority
metricFoundationCallableOwnerApproval
sourceLocusLineAnchorApproval
sourceLocusCallableOwnerApproval
sourceLocusListenerOwnerApproval
sourceLocusObserverOwnerApproval
sourceLocusTimerOwnerApproval
jsonFirstSourceLocusCallableGate
whitelistSourceLocusCallableGate
```

## Verification

Current proof command:

```bash
node --test tests/runtime/first-optimization-source-locus-callable-anchor-boundary-current-behavior.test.mjs --test-reporter=spec
```

This gate is not a completion claim. It proves current line/callable anchors
are known while source-owner approval, source-owner map artifacts, runtime
collectors, metric artifacts, rollback implementation, native sync patches,
release package changes, public claim changes, and runtime optimization
approval remain absent.

## First Optimization Source-Locus Fingerprint Boundary Addendum

First optimization source-locus fingerprint boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-fingerprint-boundary-current-behavior.test.mjs`
move this anchor proof from line/callable presence into current file
fingerprint proof. The addendum pins 12 source-locus callable rows covered, 14
runtime source files fingerprinted, 2 audit/test anchor files fingerprinted,
16 current fingerprint rows covered, 38 upstream line anchors covered, 0
committed source-owner map files, 0 runtime source-owner approvals, 0 runtime
metric collector approvals, 0 runtime collector insertion points approved, 0
implementation-ready source-locus fingerprint rows, expected runtime audit
tests 4457, expected runtime audit pass: 4457, and expected runtime audit fail
0. It preserves the non-completion boundary: source hashes are only a freshness
pin, not owner approval, collector approval, JSON-first behavior approval,
whitelist optimization approval, artifact commit readiness, release parity, or
public-claim permission.

## First Optimization Source-Locus Teardown Ownership Boundary Addendum

First optimization source-locus teardown ownership boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-teardown-ownership-boundary-current-behavior.test.mjs`
move this anchor proof into current teardown ownership classification without
approving runtime changes. The addendum pins 12 source-locus teardown boundary
rows, 12 source-locus callable rows covered, 12 source-locus fingerprint rows
covered, 8 runtime source files with teardown evidence covered, 14
runtime/build source files classified, 2 audit/test anchor files covered, 42
current source teardown anchors covered, 5 lifecycle teardown classes covered,
0 committed source-owner map files, 0 runtime source-owner approvals, 0 runtime
metric collector approvals, 0 runtime collector insertion points approved, 0
implementation-ready source-locus teardown rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, and expected runtime audit fail 0. It
preserves the non-completion boundary: local teardown and page-lifetime
classifications are not owner approval, no-work proof, side-effect budget
approval, collector approval, JSON-first behavior approval, whitelist
optimization approval, release parity, or public-claim permission.

## First Optimization Source-Locus No-Work Ownership Boundary Addendum

First optimization source-locus no-work ownership boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-no-work-ownership-boundary-current-behavior.test.mjs`
move this anchor proof from callable presence into current no-work ownership
classification without approving runtime changes. The addendum pins 12
source-locus no-work boundary rows, 12 source-locus callable rows covered, 12
source-locus fingerprint rows covered, 12 source-locus teardown rows covered,
12 collector no-work rows covered, 4 P0 no-work fixture names covered, 9
required no-work counter groups covered, 14 runtime/build source files
classified, 12 runtime/build source files with no-work evidence covered, 2
audit/test anchor files covered, 48 current source no-work anchors covered, 7
no-work risk classes covered, 0 committed no-work preservation files, 0
committed source-owner map files, 0 runtime source-owner approvals, 0 runtime
metric collector approvals, 0 runtime collector insertion points approved, 0
implementation-ready source-locus no-work rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, and expected runtime audit fail 0. It
preserves the non-completion boundary: no-work classifications are not owner
approval, collector approval, JSON-first behavior approval, whitelist
optimization approval, release parity, or public-claim permission.

## First Optimization Source-Locus Side-Effect Ownership Boundary Addendum

First optimization source-locus side-effect ownership boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-side-effect-ownership-boundary-current-behavior.test.mjs`
move this anchor proof from callable presence into current side-effect
ownership classification without approving runtime changes. The addendum pins
12 source-locus side-effect boundary rows, 12 source-locus callable rows
covered, 12 source-locus fingerprint rows covered, 12 source-locus teardown
rows covered, 12 source-locus no-work rows covered, 12 collector side-effect
rows covered, 7 evidence side-effect rows covered, 12 required work-budget
fields covered, 14 runtime/build source files classified, 12 runtime/build
source files with side-effect evidence covered, 2 audit/test anchor files
covered, 53 current source side-effect anchors covered, 8 side-effect risk
classes covered, 0 committed side-effect budget files, 0 committed no-work
preservation files, 0 committed source-owner map files, 0 runtime source-owner
approvals, 0 runtime metric collector approvals, 0 runtime collector insertion
points approved, 0 implementation-ready source-locus side-effect rows,
expected runtime audit tests: 4457, expected runtime audit pass: 4457, and
expected runtime audit fail 0. It preserves the non-completion boundary:
side-effect classifications are not owner approval, collector approval,
JSON-first behavior approval, whitelist optimization approval, release parity,
or public-claim permission.

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
preserves the non-completion boundary: fixture provenance classifications are
not owner approval, collector approval, JSON-first behavior approval, whitelist
optimization approval, release parity, or public-claim permission.
