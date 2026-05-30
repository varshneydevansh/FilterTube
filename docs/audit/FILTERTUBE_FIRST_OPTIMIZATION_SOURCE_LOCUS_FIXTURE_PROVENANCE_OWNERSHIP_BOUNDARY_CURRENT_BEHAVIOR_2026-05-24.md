# FilterTube First Optimization Source-Locus Fixture Provenance Ownership Boundary - Current Behavior - 2026-05-24

Status: audit-only current-behavior first optimization source-locus
fixture provenance ownership boundary. Runtime behavior is unchanged. This is
not an implementation patch, optimization patch, metric collector patch,
fixture extraction patch, source-owner map artifact, JSON-first behavior patch,
whitelist patch, settings patch, lifecycle patch, diagnostic patch, native sync
patch, release patch, public claim patch, or committed metric artifact.

## Purpose

The source-locus side-effect boundary classifies where settings, transport,
engine, DOM, lifecycle, network, storage, visual, whitelist, diagnostic, and
release effects still lack approved budgets. This boundary records whether
those same source loci have owner-approved fixture provenance today. They do
not. Current reduced fixtures and raw captures are useful evidence, but they
are not a first-class fixture provenance packet and cannot authorize JSON-first
or whitelist optimization behavior.

The current boundary is:

```text
Selected first optimization binding: FT-BIND-00-metric-artifact-foundation
Required fixture provenance path: docs/audit/artifacts/first-optimization/metric-foundation/fixture-provenance.json
Source-locus fixture provenance boundary rows: 12
Current fixture provenance anchors covered: 25
Committed reduced fixture fragments covered: 44
Runtime source-owner approvals: 0
Runtime metric collector approvals: 0
Implementation-ready source-locus fixture provenance rows: 0
```

This is fixture provenance ownership classification, not fixture provenance
approval. A future approval still needs a committed `fixture-provenance.json`
packet with source-owner signatures, raw-source hashes, committed fixture
hashes, positive and negative sibling proof, no-rule/disabled/empty-list proof,
side-effect and no-work coupling, diagnostic privacy, JSON/DOM/native parity,
release exclusion, rollout scope, verification output, rollback limits, and
public-claim limits.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Provides the 12 source-locus callable rows that need fixture provenance ownership. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Pins the current file revisions used for source-locus classification. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Classifies lifecycle and teardown gaps that fixture provenance must cover. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Classifies no-work gaps that fixture provenance must prove. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Classifies side-effect gaps that fixture provenance must bind to budgets. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Provides 12 collector fixture provenance rows, 12 route/surface obligations, 8 required fixture/parity fields, 11 P0 capture traceability rows, and 46 unique raw capture paths. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future `fixture-provenance.json` structure but proves 0 files and approvals. |
| `docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md` | Proves the capture-to-fixture chain is explicit but incomplete across 11 P0 rows, 44 committed reduced fixture fragments, and 31 represented raw source families. |
| `docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md` | Proves raw captures are evidence only, with 47 ignored entries, 46 unique paths, 45 local paths, and `releaseInputAllowed: false`. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves runtime collector approval remains absent. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves 0 implementation-ready first optimization rows. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as approval. |

## Current Counts

```text
source-locus fixture provenance boundary rows: 12
source-locus callable rows covered: 12
source-locus fingerprint rows covered: 12
source-locus teardown rows covered: 12
source-locus no-work rows covered: 12
source-locus side-effect rows covered: 12
collector fixture provenance rows covered: 12
fixture provenance contract rows covered: 12
P0 capture traceability rows covered: 11
unique raw capture obligation paths covered: 46
ignored raw capture entries covered: 47
present local raw capture paths covered: 45
committed reduced fixture fragments covered: 44
fixture corpus JSON files covered: 33
fixture corpus HTML files covered: 11
fixture provenance anchor files covered: 12
current fixture provenance anchors covered: 25
fixture provenance risk classes covered: 8
committed fixture provenance files: 0
committed source-owner map files: 0
committed side-effect budget files: 0
committed no-work preservation files: 0
runtime source-owner approvals: 0
runtime metric collector approvals: 0
runtime collector insertion points approved: 0
implementation-ready source-locus fixture provenance rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for source-locus fixture provenance approval authority
```

Covered collector fixture provenance rows:

```text
FT-COLLECTOR-FIXTURE-00-disabled-all-intercepts-provenance
FT-COLLECTOR-FIXTURE-01-empty-blocklist-desktop-home-provenance
FT-COLLECTOR-FIXTURE-02-empty-blocklist-mobile-home-provenance
FT-COLLECTOR-FIXTURE-03-empty-blocklist-watch-player-provenance
FT-COLLECTOR-FIXTURE-04-empty-blocklist-watch-next-provenance
FT-COLLECTOR-FIXTURE-05-empty-blocklist-guide-provenance
FT-COLLECTOR-FIXTURE-06-empty-whitelist-main-json-provenance
FT-COLLECTOR-FIXTURE-07-nonempty-blocklist-core-routes-provenance
FT-COLLECTOR-FIXTURE-08-nonempty-whitelist-unresolved-identity-provenance
FT-COLLECTOR-FIXTURE-09-content-category-empty-values-provenance
FT-COLLECTOR-FIXTURE-10-lifecycle-affordance-off-provenance
FT-COLLECTOR-FIXTURE-11-diagnostic-measurement-budget-provenance
```

Covered fixture provenance contract rows:

```text
FT-FIXTURE-PROVENANCE-00-packet-binding
FT-FIXTURE-PROVENANCE-01-artifact-binding
FT-FIXTURE-PROVENANCE-02-raw-source
FT-FIXTURE-PROVENANCE-03-committed-fixture
FT-FIXTURE-PROVENANCE-04-positive-fixture
FT-FIXTURE-PROVENANCE-05-negative-sibling-fixture
FT-FIXTURE-PROVENANCE-06-no-rule-disabled-empty
FT-FIXTURE-PROVENANCE-07-json-dom-parity
FT-FIXTURE-PROVENANCE-08-source-owner-coverage
FT-FIXTURE-PROVENANCE-09-side-effect-no-work
FT-FIXTURE-PROVENANCE-10-parity-rollout
FT-FIXTURE-PROVENANCE-11-verification
```

Covered fixture/parity fields:

```text
positiveFixture
negativeSiblingFixture
noRuleFixture
disabledFixture
emptyListFixture
unrelatedSurfaceFixture
domParityFixture
nativeParityFixture
```

Covered fixture provenance risk classes:

```text
raw-source-provenance
committed-fixture-scope
positive-negative-sibling-proof
no-rule-disabled-empty-proof
json-dom-parity-proof
source-owner-coverage
side-effect-no-work-coupling
native-release-public-rollout
```

## Source-Locus Fixture Provenance Matrix

| Source-locus fixture provenance row id | Covered callable row | Current fixture provenance ownership evidence | Missing proof before implementation |
| --- | --- | --- | --- |
| `FT-SOURCE-LOCUS-FIXTURE-00-settings-scope` | `FT-SOURCE-LOCUS-CALLABLE-00-settings-scope` | Settings and list-mode behavior are named in fixture contracts, but no committed packet proves disabled, missing-settings, empty blocklist, empty whitelist, transition, or import states for the selected binding. | Missing approved settings fixture owner, profile/list-mode fixture set, settings revision, transition/import parity, and rollback fixture proof. |
| `FT-SOURCE-LOCUS-FIXTURE-01-fixture-audit-envelope` | `FT-SOURCE-LOCUS-CALLABLE-01-fixture-audit-envelope` | Audit docs reserve `fixture-provenance.json`, and runtime fixtures exist under `tests/runtime/fixtures/captures/`, but the reserved metric-foundation artifact is absent. | Missing packet id, artifact root binding, raw-source hashes, committed fixture hashes, and source-owner signatures. |
| `FT-SOURCE-LOCUS-FIXTURE-02-transport-json` | `FT-SOURCE-LOCUS-CALLABLE-02-transport-json` | Existing JSON fixtures carry provenance fields for some sources, routes, and renderer types, but transport fetch/XHR body-read and rebuild proof is not packetized. | Missing endpoint-scoped raw/fixture pairs, body-read proof, parse/stringify counters, pass-through fixtures, and disabled/no-rule transport proof. |
| `FT-SOURCE-LOCUS-FIXTURE-03-filter-engine` | `FT-SOURCE-LOCUS-CALLABLE-03-filter-engine` | Reduced fixtures prove selected renderer decisions, but positive, negative sibling, no-rule, whitelist, and map side-effect decisions remain split across many local tests. | Missing one scoped positive/negative/no-rule fixture packet with expected decision, expected mutation, side effects, and counters. |
| `FT-SOURCE-LOCUS-FIXTURE-04-dom-fallback` | `FT-SOURCE-LOCUS-CALLABLE-04-dom-fallback` | DOM fixtures exist for YTM, playlist, collaborator, post, and mutated Main shapes, but several are already-mutated or not clean proof for the claimed surface. | Missing clean DOM fixture ownership, selector class, visible sibling proof, restore proof, selected-row proof, and DOM parity packet. |
| `FT-SOURCE-LOCUS-FIXTURE-05-menu-quickblock` | `FT-SOURCE-LOCUS-CALLABLE-05-menu-quickblock` | Menu and quick-block related DOM fixtures show some native action menus and injected markers, but no packet owns action-positive, menu-off, quick-block-off, observer, timer, and teardown fixtures together. | Missing menu/quick-block fixture owner, action-positive fixture, disabled/off fixtures, lifecycle counts, and teardown proof. |
| `FT-SOURCE-LOCUS-FIXTURE-06-network-resolver` | `FT-SOURCE-LOCUS-CALLABLE-06-network-resolver` | Capture traceability names unresolved identity and fallback fetch risks, but no fixture packet proves zero-fetch, same-origin credential, cache-hit/cache-miss, pending TTL, or fallback repair behavior. | Missing resolver fixture owner, network credential fixture, pending TTL proof, fallback-fetch proof, and privacy-bounded cache proof. |
| `FT-SOURCE-LOCUS-FIXTURE-07-storage-map-mutation` | `FT-SOURCE-LOCUS-CALLABLE-07-storage-map-mutation` | Fixtures and source docs identify channel-map side effects, but no provenance packet binds map writes, stats reads, backup timers, or cache refresh to expected storage budgets. | Missing storage fixture owner, map-write fixture, no-storage fixture, backup/refresh fixture, and rollback storage proof. |
| `FT-SOURCE-LOCUS-FIXTURE-08-hide-restore-visual` | `FT-SOURCE-LOCUS-CALLABLE-08-hide-restore-visual` | DOM fixtures show hidden markers and selected/sibling rows, but already-mutated captures cannot approve hide/restore behavior across surfaces. | Missing clean visual fixture owner, hide/restore expected state, stale marker cleanup proof, false-hide proof, leak proof, and sibling-visible proof. |
| `FT-SOURCE-LOCUS-FIXTURE-09-whitelist-policy` | `FT-SOURCE-LOCUS-CALLABLE-09-whitelist-policy` | Collector fixture rows require empty whitelist and unresolved identity proof, but no product-confirmed whitelist packet is committed. | Missing empty whitelist policy fixture, allow-match fixture, unresolved identity fixture, import/transition fixture, selected-row proof, and pending hide TTL proof. |
| `FT-SOURCE-LOCUS-FIXTURE-10-diagnostic-privacy` | `FT-SOURCE-LOCUS-CALLABLE-10-diagnostic-privacy` | Diagnostic privacy appears as a future contract and fixture requirement, but no fixture packet proves redaction, debug gating, metric replacement, or console budget. | Missing diagnostic fixture owner, privacy class, redaction proof, debug gate proof, metric replacement fixture, and no-diagnostic-no-work fixture. |
| `FT-SOURCE-LOCUS-FIXTURE-11-parity-release-verification` | `FT-SOURCE-LOCUS-CALLABLE-11-parity-release-verification` | Raw capture rows are release-excluded, and native/release/public rollout remains unapproved. | Missing JSON/DOM/native parity fixture, release input exclusion proof, public claim scope, unclaimed surfaces, rollback boundary, and verification output. |

## Current Fixture Provenance Anchors

| File | Line | Current anchor |
| --- | ---: | --- |
| `docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md` | 12 | `workspace currently has 47 ignored capture entries` |
| `docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md` | 13 | `paths, 44 committed reduced fixture fragments` |
| `docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md` | 21 | `no committed clean Main watch end-screen DOM wall fixture exists` |
| `docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md` | 22 | `No literal `compactAutoplayRenderer` fragment has a committed fixture` |
| `docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md` | 49 | `releaseInputAllowed: false` |
| `docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md` | 55 | `P0 capture fixture traceability is not implementation-ready` |
| `docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md` | 5 | `Raw captures are evidence, not product source` |
| `docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md` | 7 | `Loose substring matches are forbidden` |
| `docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md` | 14 | `47 ignored capture entries` |
| `docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md` | 15 | `46 unique ignored capture paths` |
| `docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md` | 16 | `45 present in this local workspace` |
| `docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md` | 18 | `releaseInputAllowed: false` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 41 | `collector fixture provenance rows: 12` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 45 | `required fixture/parity fields covered: 8` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 47 | `unique raw capture obligation paths covered: 46` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 58 | `first optimization fixture provenance contract rows: 12` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 59 | `reserved fixture provenance paths covered: 1` |
| `tests/runtime/fixtures/captures/main-home-rich-video-renderer.json` | 3 | `"source": "logs.json"` |
| `tests/runtime/fixtures/captures/main-watch-player-fragment-metadata.json` | 4 | `"sourceSha256":` |
| `tests/runtime/fixtures/captures/main-upnext-feed-watchpage3-autoplay-previous-end-screen.json` | 3 | `"source": "YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json"` |
| `tests/runtime/fixtures/captures/main-guide-entry-renderer.json` | 8 | `"route": "guide"` |
| `tests/runtime/fixtures/captures/kids-latest-compact-video-owner-extension.json` | 4 | `"rendererType": "compactVideoRenderer"` |
| `tests/runtime/fixtures/captures/ytm-watch-player-dom.html` | 4 | `Raw shape: rendered mobile watch/player DOM after FilterTube mutation.` |
| `tests/runtime/fixtures/captures/main-collab-resolved-search-card-dialog.html` | 15 | `data-filtertube-collaborators=` |
| `tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json` | 6 | `"reason": "minimal showSheetCommand collaborator roster with multiple UC browse IDs"` |

## Current Fixture Provenance Decision

```text
source-locus fixture provenance boundary documented: GO
runtime source-owner approval now: NO-GO
commit fixture-provenance.json now: NO-GO
commit source-owner-map.json now: NO-GO
commit side-effect-budget.json now: NO-GO
commit no-work-preservation.json now: NO-GO
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

The current anchors show why fixture provenance cannot be inferred from raw
capture names, one committed fixture, one DOM snapshot, or one future contract.
Ownership remains split across raw captures, reduced fixtures, route/surface
obligations, renderer-specific current-behavior tests, source-owner rows,
side-effect/no-work contracts, diagnostic privacy, release exclusion, and
rollout verification.

## Missing Runtime Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
firstOptimizationSourceLocusFixtureProvenanceBoundary
firstOptimizationSourceLocusFixtureProvenanceReport
sourceLocusFixtureProvenanceApproval
sourceLocusFixtureOwnerApproval
jsonFirstSourceLocusFixtureGate
whitelistSourceLocusFixtureGate
metricFoundationFixtureProvenanceAuthority
runtimeSourceFixtureProvenanceMap
sourceLocusFixtureProvenanceArtifact
sourceLocusFixtureProvenancePacket
runtimeFixtureProvenanceOptimizationAuthority
sourceLocusFixtureTraceabilityReport
```

## Verification

Current proof command:

```bash
node --test tests/runtime/first-optimization-source-locus-fixture-provenance-ownership-boundary-current-behavior.test.mjs --test-reporter=spec
```

This gate is not a completion claim. It proves current source-locus fixture
provenance ownership remains classification-only while fixture provenance
artifacts, source-owner map artifacts, metric collectors, runtime approvals,
JSON-first behavior changes, whitelist optimization changes, native sync
changes, release package changes, public claims, and rollback authority remain
unapproved.

## First Optimization Source-Locus Diagnostic Privacy Ownership Boundary Addendum

First optimization source-locus diagnostic privacy ownership boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_DIAGNOSTIC_PRIVACY_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-diagnostic-privacy-ownership-boundary-current-behavior.test.mjs`
move this source-locus fixture provenance classification into current
source-locus diagnostic privacy ownership classification without changing
runtime behavior or approving runtime collectors. The addendum pins 12
source-locus diagnostic privacy boundary rows, 12 source-locus callable rows
covered, 12 source-locus fingerprint rows covered, 12 source-locus teardown
rows covered, 12 source-locus no-work rows covered, 12 source-locus
side-effect rows covered, 12 source-locus fixture provenance rows covered, 12
diagnostic privacy contract rows covered, 21 diagnostic logging policy source
files covered, 418 active console callsites covered, 196 page-runtime-core
callsites covered, 131 background-storage-state callsites covered, 35 current
diagnostic privacy anchors covered, 0 committed diagnostic privacy files, 0
runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime
collector insertion points approved, 0 implementation-ready source-locus
diagnostic privacy rows, expected runtime audit tests: 4457, expected runtime
audit pass 4457, and expected runtime audit fail 0. It keeps fixture
provenance and diagnostic privacy blocked until privacy classes, redaction,
debug gates, metric replacement, no-work, fixture provenance, parity,
verification, rollback, native/release, raw-capture, and public-claim proof are
approved as a scoped packet.

## First Optimization Collector Fixture Provenance Approval Boundary Addendum

`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_FIXTURE_PROVENANCE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-collector-fixture-provenance-approval-boundary-current-behavior.test.mjs`
prove source-locus fixture provenance classification is not runtime fixture
provenance approval. The addendum pins 12 collector fixture provenance approval
boundary rows, 12 source-locus fixture provenance rows covered, 12 collector
fixture provenance rows covered, 12 fixture provenance contract rows covered,
25 current fixture provenance anchors covered, 8 fixture provenance risk
classes covered, 63 method semantic proof gap files covered, 5,469 lexical
callables still requiring semantic proof, 0 files with complete per-callable
semantic proof, 0 runtime source-owner approvals, 0 runtime metric collector
approvals, 0 runtime collector insertion points approved, 0 runtime collector
fixture packets approved, 0 committed fixture provenance files, 0
implementation-ready collector fixture provenance approval rows, expected
runtime audit tests: 4457, expected runtime audit pass: 4457, and expected
runtime audit fail 0. It keeps classification separate from approval until a
measured fixture packet, rollback limits, verification output, and affected
callable semantic authority exist.
