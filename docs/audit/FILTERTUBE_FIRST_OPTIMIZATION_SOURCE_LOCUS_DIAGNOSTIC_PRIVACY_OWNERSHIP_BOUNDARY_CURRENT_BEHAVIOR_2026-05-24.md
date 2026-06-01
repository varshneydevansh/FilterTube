# FilterTube First Optimization Source-Locus Diagnostic Privacy Ownership Boundary - Current Behavior - 2026-05-24

Status: audit-only current-behavior first optimization source-locus
diagnostic privacy ownership boundary. Runtime behavior is unchanged. This is
not an implementation patch, optimization patch, metric collector patch,
diagnostic privacy packet, logging removal patch, JSON-first behavior patch,
whitelist patch, settings patch, lifecycle patch, native sync patch, release
patch, public claim patch, or committed metric artifact.

## Purpose

The source-locus fixture provenance boundary classifies where settings,
transport, engine, DOM, lifecycle, network, storage, visual, whitelist,
diagnostic, and release evidence still lacks approved fixture provenance. This
boundary records whether those same source loci have owner-approved diagnostic
privacy today. They do not. Current console inventory and privacy contracts are
useful evidence, but they are not a first-class `diagnostic-privacy.json`
packet and cannot authorize JSON-first or whitelist optimization behavior.

The current boundary is:

```text
Selected first optimization binding: FT-BIND-00-metric-artifact-foundation
Required diagnostic privacy path: docs/audit/artifacts/first-optimization/metric-foundation/diagnostic-privacy.json
Source-locus diagnostic privacy boundary rows: 12
Current diagnostic privacy anchors covered: 35
Active console callsites covered: 418
Runtime source-owner approvals: 0
Runtime metric collector approvals: 0
Implementation-ready source-locus diagnostic privacy rows: 0
```

This is diagnostic privacy ownership classification, not diagnostic privacy
approval. A future approval still needs a committed `diagnostic-privacy.json`
packet with console inventory, owner/reason scope, payload privacy classes,
redaction proof, debug gates, metric replacement, no-work budgets, fixture
provenance, rollout scope, verification output, source-owner signatures,
rollback limits, native/release boundaries, raw-capture exclusions, and
public-claim limits.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Provides the 12 source-locus callable rows that need diagnostic privacy ownership. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Pins the current source revisions used for diagnostic privacy classification. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Classifies lifecycle and teardown gaps that diagnostic privacy must not hide behind logs. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Classifies no-work gaps that diagnostic logging and metrics must preserve. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Classifies side-effect gaps that diagnostic logging must not replace with console-only evidence. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FIXTURE_PROVENANCE_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Classifies fixture provenance gaps that diagnostic privacy must bind to raw-source and reduced-fixture proof. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future `diagnostic-privacy.json` shape, but proves 0 committed diagnostic privacy files and 0 implementation-ready diagnostic privacy rows. |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Pins 21 diagnostic source files, 419 active `console.*` callsites, 196 page-runtime-core callsites, and 131 background-storage-state callsites. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves runtime collector approval remains absent. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves 0 implementation-ready first optimization rows. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as approval. |

## Current Counts

```text
source-locus diagnostic privacy boundary rows: 12
source-locus callable rows covered: 12
source-locus fingerprint rows covered: 12
source-locus teardown rows covered: 12
source-locus no-work rows covered: 12
source-locus side-effect rows covered: 12
source-locus fixture provenance rows covered: 12
diagnostic privacy contract rows covered: 12
diagnostic logging policy source files covered: 21
active console callsites covered: 418
console.log callsites covered: 203
console.warn callsites covered: 123
console.error callsites covered: 68
console.debug callsites covered: 24
console.info callsites covered: 0
page-runtime-core callsites covered: 196
background-storage-state callsites covered: 131
current diagnostic privacy anchors covered: 35
diagnostic privacy risk classes covered: 8
committed diagnostic privacy files: 0
committed fixture provenance files: 0
committed source-owner map files: 0
committed side-effect budget files: 0
committed no-work preservation files: 0
runtime source-owner approvals: 0
runtime metric collector approvals: 0
runtime collector insertion points approved: 0
implementation-ready source-locus diagnostic privacy rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for source-locus diagnostic privacy approval authority
```

Covered diagnostic privacy contract rows:

```text
FT-DIAGNOSTIC-PRIVACY-00-packet-binding
FT-DIAGNOSTIC-PRIVACY-01-artifact-binding
FT-DIAGNOSTIC-PRIVACY-02-console-inventory
FT-DIAGNOSTIC-PRIVACY-03-owner-reason-scope
FT-DIAGNOSTIC-PRIVACY-04-privacy-class
FT-DIAGNOSTIC-PRIVACY-05-redaction-policy
FT-DIAGNOSTIC-PRIVACY-06-debug-gate
FT-DIAGNOSTIC-PRIVACY-07-metric-replacement
FT-DIAGNOSTIC-PRIVACY-08-no-work-budget
FT-DIAGNOSTIC-PRIVACY-09-fixture-provenance
FT-DIAGNOSTIC-PRIVACY-10-release-public-scope
FT-DIAGNOSTIC-PRIVACY-11-verification
```

Covered diagnostic privacy risk classes:

```text
console-inventory-budget
identity-payload-redaction
import-payload-redaction
debug-gate
metric-replacement
no-work-preservation
fixture-provenance-coupling
release-public-claim-scope
```

## Source-Locus Diagnostic Privacy Matrix

| Source-locus diagnostic privacy row id | Covered callable row | Current diagnostic privacy ownership evidence | Missing proof before implementation |
| --- | --- | --- | --- |
| `FT-SOURCE-LOCUS-DIAGNOSTIC-00-settings-scope` | `FT-SOURCE-LOCUS-CALLABLE-00-settings-scope` | Settings/profile/list-mode diagnostics appear in background and storage logs, but no privacy owner binds profile type, missing-settings mode, import transitions, or list-mode changes to a redaction/debug policy. | Missing settings diagnostic owner, profile/list-mode privacy class, debug gate, no-work budget, and redacted transition/import report. |
| `FT-SOURCE-LOCUS-DIAGNOSTIC-01-fixture-audit-envelope` | `FT-SOURCE-LOCUS-CALLABLE-01-fixture-audit-envelope` | The future diagnostic privacy packet is reserved, but no committed packet binds console inventory to fixture provenance and verification output. | Missing packet id, artifact root, console inventory id, source-owner signatures, fixture hashes, and verification output. |
| `FT-SOURCE-LOCUS-DIAGNOSTIC-02-transport-json` | `FT-SOURCE-LOCUS-CALLABLE-02-transport-json` | Seed and filter transport paths relay logs and postMessage diagnostics, but no owner proves endpoint, body-read, parse/stringify, or pass-through diagnostics are redacted and budgeted. | Missing transport diagnostic owner, endpoint scope, body-read privacy class, metric replacement, and disabled/no-rule transport no-work proof. |
| `FT-SOURCE-LOCUS-DIAGNOSTIC-03-filter-engine` | `FT-SOURCE-LOCUS-CALLABLE-03-filter-engine` | Filter engine debug and whitelist JSON logs exist, but they are not first-class metric artifacts and can include decision details before a privacy packet exists. | Missing filter-engine diagnostic owner, list-mode privacy class, redaction proof, console-to-metric parity, and no-diagnostic no-work proof. |
| `FT-SOURCE-LOCUS-DIAGNOSTIC-04-dom-fallback` | `FT-SOURCE-LOCUS-CALLABLE-04-dom-fallback` | DOM whitelist logs can include title, channel, metadata, collaborators, and extra decision fields, but no DOM privacy owner approves that payload. | Missing DOM diagnostic owner, channel/collaborator redaction, visible-sibling negative leak fixture, DOM parity proof, and debug-disabled behavior. |
| `FT-SOURCE-LOCUS-DIAGNOSTIC-05-menu-quickblock` | `FT-SOURCE-LOCUS-CALLABLE-05-menu-quickblock` | Menu and quick-block diagnostics are spread across content bridge and injected paths without a shared user-action reason or route/surface policy. | Missing menu diagnostic owner, user-action reason, menu-off/quick-block-off no-work proof, observer/timer budget, and redaction proof. |
| `FT-SOURCE-LOCUS-DIAGNOSTIC-06-network-resolver` | `FT-SOURCE-LOCUS-CALLABLE-06-network-resolver` | Background and resolver logs cover channel fetch, parse, identity repair, handles, URLs, and fallback lookups, but no network diagnostic privacy owner is approved. | Missing network diagnostic owner, credential reason, request URL privacy class, handle/channel ID redaction, cache-hit/cache-miss proof, and fallback-fetch budget. |
| `FT-SOURCE-LOCUS-DIAGNOSTIC-07-storage-map-mutation` | `FT-SOURCE-LOCUS-CALLABLE-07-storage-map-mutation` | Storage, import, backup, channel-map, and compiled-settings logs exist, but no storage diagnostic owner binds them to map-write/no-storage budgets. | Missing storage diagnostic owner, map-write privacy class, import summary redaction, backup/refresh diagnostic budget, and rollback storage report. |
| `FT-SOURCE-LOCUS-DIAGNOSTIC-08-hide-restore-visual` | `FT-SOURCE-LOCUS-CALLABLE-08-hide-restore-visual` | Visual hide/restore decisions can be logged near DOM and content bridge paths, but no privacy packet proves false-hide, leak, restore, or sibling-visible diagnostics are safe. | Missing visual diagnostic owner, hide/restore privacy class, negative leak fixture, sibling-visible proof, stale-marker report, and metric replacement. |
| `FT-SOURCE-LOCUS-DIAGNOSTIC-09-whitelist-policy` | `FT-SOURCE-LOCUS-CALLABLE-09-whitelist-policy` | Whitelist JSON and DOM logs are debug-gated but not packetized, and unresolved identity/empty whitelist diagnostics are not approved as evidence. | Missing whitelist diagnostic owner, empty whitelist privacy class, unresolved identity redaction, pending hide TTL proof, selected-row parity, and debug gate proof. |
| `FT-SOURCE-LOCUS-DIAGNOSTIC-10-diagnostic-privacy` | `FT-SOURCE-LOCUS-CALLABLE-10-diagnostic-privacy` | The diagnostic privacy contract exists and the logging matrix pins current callsites, but no source-locus owner may approve diagnostics or replace metrics yet. | Missing diagnostic privacy owner, committed packet, redaction proof, debug-disabled behavior, console budget, metric replacement artifact, and authority approval. |
| `FT-SOURCE-LOCUS-DIAGNOSTIC-11-parity-release-verification` | `FT-SOURCE-LOCUS-CALLABLE-11-parity-release-verification` | Build/release scripts have console diagnostics, and rollout contracts require diagnostic privacy, but release/native/public claim use remains unapproved. | Missing release diagnostic owner, native parity budget, release artifact boundary, raw-capture exclusion, public claim scope, rollback boundary, and verification TAP output. |

## Current Diagnostic Privacy Anchors

| File | Line | Current anchor |
| --- | ---: | --- |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 65 | `first optimization diagnostic privacy contract rows: 12` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 66 | `reserved diagnostic privacy paths covered: 1` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 68 | `runtime metric collector approvals: 0` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 69 | `implementation-ready diagnostic privacy contract rows: 0` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 85 | `diagnostic logging policy source files covered: 21` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 86 | `active console callsites covered: 418` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 87 | `console.log callsites covered: 203` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 88 | `console.warn callsites covered: 123` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 89 | `console.error callsites covered: 68` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 90 | `console.debug callsites covered: 24` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | 91 | `console.info callsites covered: 0` |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 57 | `diagnostic logging policy matrix source files: 21` |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 58 | `active console callsites: 419` |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 59 | `console.log callsites: 203` |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 60 | `console.warn callsites: 124` |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 61 | `console.error callsites: 68` |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 62 | `console.debug callsites: 24` |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 63 | `console.info callsites: 0` |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 100 | `` `page-runtime-core` | 196 `` |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 101 | `` `background-storage-state` | 131 `` |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 111 | `Page runtime extraction` |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 112 | `Background identity repair` |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 113 | `JSON filter engine` |
| `js/seed.js` | 33 | `FilterTube: seed.js initializing (MAIN world)` |
| `js/seed.js` | 157 | `window.postMessage({` |
| `js/filter_logic.js` | 1566 | `console.log(`FilterTube (Filter):`, message, ...args);` |
| `js/filter_logic.js` | 1581 | `console.log('FilterTube Whitelist (JSON):', {` |
| `js/filter_logic.js` | 3444 | `console.warn('FilterTube: Harvesting failed', e);` |
| `js/content/dom_fallback.js` | 4559 | `console.log('FilterTube Whitelist (DOM):', {` |
| `js/background.js` | 3236 | `console.log('FilterTube Subscriptions Import:', {` |
| `js/background.js` | 3254 | `FilterTube Background: Received getCompiledSettings message` |
| `js/background.js` | 5206 | `console.log('FilterTube Background: Extracted -'` |
| `js/content_bridge.js` | 10571 | `console.log('FilterTube: Extracted from lockup data attrs:'` |
| `js/content_bridge.js` | 10651 | `console.log('FilterTube: Falling back to main-world lookup for video:'` |
| `js/injector.js` | 1274 | `postLog('log', 'FilterTube Subscriptions Import:', {` |

## Current Diagnostic Privacy Decision

```text
source-locus diagnostic privacy boundary documented: GO
runtime source-owner approval now: NO-GO
commit diagnostic-privacy.json now: NO-GO
commit fixture-provenance.json now: NO-GO
commit source-owner-map.json now: NO-GO
commit side-effect-budget.json now: NO-GO
commit no-work-preservation.json now: NO-GO
runtime metric collector approval now: NO-GO
runtime collector insertion now: NO-GO
commit metric foundation artifact files now: NO-GO
diagnostic logging removal patch: NO-GO
JSON-first runtime behavior patch: NO-GO
whitelist optimization patch: NO-GO
native sync patch: NO-GO
release package patch: NO-GO
public claim patch: NO-GO
continue proof-backed audit: GO
```

The current anchors show why diagnostic privacy cannot be inferred from debug
guards, console inventory, one future contract, or local line anchors.
Ownership remains split across source loci, diagnostic logging callsites,
privacy-contract rows, fixture provenance, side-effect/no-work budgets,
rollout verification, release exclusion, and public claim limits.

## Missing Runtime Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
firstOptimizationSourceLocusDiagnosticPrivacyBoundary
firstOptimizationSourceLocusDiagnosticPrivacyReport
sourceLocusDiagnosticPrivacyApproval
sourceLocusDiagnosticOwnerApproval
jsonFirstSourceLocusDiagnosticPrivacyGate
whitelistSourceLocusDiagnosticPrivacyGate
metricFoundationDiagnosticPrivacyAuthority
runtimeSourceDiagnosticPrivacyMap
sourceLocusDiagnosticPrivacyArtifact
sourceLocusDiagnosticPrivacyPacket
runtimeDiagnosticPrivacyOptimizationAuthority
sourceLocusDiagnosticRedactionReport
```

## Verification

Current proof command:

```bash
node --test tests/runtime/first-optimization-source-locus-diagnostic-privacy-ownership-boundary-current-behavior.test.mjs --test-reporter=spec
```

This gate is not a completion claim. It proves current source-locus diagnostic
privacy ownership remains classification-only while diagnostic privacy
artifacts, fixture provenance artifacts, source-owner map artifacts,
side-effect budget artifacts, no-work preservation artifacts, metric
collectors, runtime approvals, JSON-first behavior changes, whitelist
optimization changes, native sync changes, release package changes, public
claims, and rollback authority remain unapproved.

## First Optimization Source-Locus Parity Release Verification Ownership Boundary Addendum

First optimization source-locus parity release verification ownership boundary
addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_PARITY_RELEASE_VERIFICATION_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-parity-release-verification-ownership-boundary-current-behavior.test.mjs`
moves the active audit from diagnostic privacy ownership classification into
current parity, release, and verification ownership classification without
changing runtime behavior. The addendum pins 12 source-locus parity release
verification rows, 12 source-locus diagnostic privacy rows covered, 12 parity
rollout contract rows covered, 12 verification output contract rows covered,
12 rollback/unclaimed boundary rows covered, 12 collector parity rollout rows
covered, 68 current parity release verification anchors covered, 0 committed
parity rollout files, 0 committed verification output files, 0 runtime
source-owner approvals, 0 runtime metric collector approvals, 0 runtime
rollback approvals, 0 runtime unclaimed-surface approvals, 0
implementation-ready source-locus parity release verification rows, expected
runtime audit tests 4457, expected runtime audit pass: 4457, and expected
runtime audit fail 0. It preserves the non-completion boundary: parity rollout,
verification output, native sync freshness, release package parity,
raw-capture exclusion, public claim scope, rollback, and unclaimed-surface
approval remain NO-GO.

## First Optimization Collector Diagnostic Privacy Approval Boundary Addendum

`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_DIAGNOSTIC_PRIVACY_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-collector-diagnostic-privacy-approval-boundary-current-behavior.test.mjs`
prove source-locus diagnostic privacy classification is not runtime diagnostic
privacy approval. The addendum pins 12 collector diagnostic privacy approval
boundary rows, 12 source-locus diagnostic privacy rows covered, 12 diagnostic
privacy contract rows covered, 35 current diagnostic privacy anchors covered,
8 diagnostic privacy risk classes covered, 69 method semantic proof gap files
covered, 5,681 lexical callables still requiring semantic proof, 0 files with
complete per-callable semantic proof, 0 runtime source-owner approvals, 0
runtime metric collector approvals, 0 runtime collector insertion points
approved, 0 runtime collector diagnostic privacy approvals, 0 committed
diagnostic privacy files, 0 implementation-ready collector diagnostic privacy
approval rows, expected runtime audit tests: 4457, expected runtime audit
pass: 4457, and expected runtime audit fail 0. It keeps classification
separate from approval until measured diagnostic privacy, rollback limits,
verification output, and affected callable semantic authority exist.
