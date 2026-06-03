# FilterTube First Optimization Source-Locus Fingerprint Boundary - Current Behavior - 2026-05-24

Status: audit-only current-behavior first optimization source-locus
fingerprint boundary. Runtime behavior is unchanged. This is not an
implementation patch, optimization patch, metric collector patch,
source-owner map artifact, JSON-first behavior patch, whitelist patch,
settings patch, lifecycle patch, diagnostic patch, native sync patch, release
patch, public claim patch, or committed metric artifact.

## Purpose

The source-locus callable boundary now has line anchors, but line anchors alone
do not prove revision freshness. This boundary pins current file fingerprints
for the first optimization source-locus files before any future
`source-owner-map.json`, metric collector, JSON-first behavior patch, or
whitelist optimization can treat those anchors as implementation permission.

The current boundary is:

```text
Selected first optimization binding: FT-BIND-00-metric-artifact-foundation
Required source-owner map path: docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json
Source-locus fingerprint boundary rows: 12
Current fingerprint rows covered: 16
Runtime source files fingerprinted: 14
Audit/test anchor files fingerprinted: 2
Upstream line anchors covered: 38
Committed source-owner map files: 0
Runtime source-owner approvals: 0
Runtime metric collector approvals: 0
Implementation-ready source-locus fingerprint rows: 0
```

Source hashes are a freshness pin, not approval. A future approval still needs
owner signatures, source-owner map artifacts, callable teardown proof, no-work
preservation, side-effect budgets, fixture provenance, diagnostic privacy,
parity rollout, verification output, rollback limits, native/release
boundaries, raw-capture exclusions, and public-claim limits.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Provides the 12 source-locus callable rows, 38 line anchors, 14 runtime source files, and 2 audit/test anchor files. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Requires source hashes before source-owner approval, but proves 0 runtime source-owner approvals. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines future source owner map fields, including source revisions and line anchors, while proving 0 committed source owner map files. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Provides the 12 source-owner families and 14 runtime source files covered by this fingerprint set. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves runtime metric collector approval remains absent. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves 0 approved collector insertion points. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves 0 implementation-ready first optimization rows. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as approval. |

## Current Counts

```text
source-locus fingerprint boundary rows: 12
source-locus callable rows covered: 12
current fingerprint rows covered: 16
runtime source files fingerprinted: 14
audit/test anchor files fingerprinted: 2
upstream line anchors covered: 38
committed source-owner map files: 0
runtime source-owner approvals: 0
runtime metric collector approvals: 0
runtime collector insertion points approved: 0
implementation-ready source-locus fingerprint rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for source-locus fingerprint approval authority
```

## Source Locus Fingerprint Matrix

| Source locus row id | Fingerprinted files | Current state |
| --- | --- | --- |
| `FT-SOURCE-LOCUS-CALLABLE-00-settings-scope` | `js/settings_shared.js`, `js/state_manager.js`, `js/seed.js` | Current hashes pinned; approval missing. |
| `FT-SOURCE-LOCUS-CALLABLE-01-fixture-audit-envelope` | `tests/runtime/first-optimization-source-owner-approval-boundary-current-behavior.test.mjs`, `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Current audit/test anchor hashes pinned; approval missing. |
| `FT-SOURCE-LOCUS-CALLABLE-02-transport-json` | `js/seed.js` | Current transport hash pinned; approval missing. |
| `FT-SOURCE-LOCUS-CALLABLE-03-filter-engine` | `js/filter_logic.js` | Current engine hash pinned; approval missing. |
| `FT-SOURCE-LOCUS-CALLABLE-04-dom-fallback` | `js/content/dom_fallback.js`, `js/content_bridge.js` | Current DOM fallback hashes pinned; approval missing. |
| `FT-SOURCE-LOCUS-CALLABLE-05-menu-quickblock` | `js/content/block_channel.js`, `js/content_bridge.js` | Current menu and quick-block hashes pinned; approval missing. |
| `FT-SOURCE-LOCUS-CALLABLE-06-network-resolver` | `js/content/handle_resolver.js`, `js/background.js` | Current resolver hashes pinned; approval missing. |
| `FT-SOURCE-LOCUS-CALLABLE-07-storage-map-mutation` | `js/background.js`, `js/state_manager.js`, `js/io_manager.js` | Current storage and map-mutation hashes pinned; approval missing. |
| `FT-SOURCE-LOCUS-CALLABLE-08-hide-restore-visual` | `js/content/dom_fallback.js`, `js/content_bridge.js` | Current hide/restore hashes pinned; approval missing. |
| `FT-SOURCE-LOCUS-CALLABLE-09-whitelist-policy` | `js/content/dom_fallback.js`, `js/content_bridge.js` | Current whitelist policy hashes pinned; approval missing. |
| `FT-SOURCE-LOCUS-CALLABLE-10-diagnostic-privacy` | `js/seed.js`, `js/filter_logic.js` | Current diagnostic hashes pinned; approval missing. |
| `FT-SOURCE-LOCUS-CALLABLE-11-parity-release-verification` | `build.js`, `scripts/build-extension-ui.mjs`, `scripts/build-nanah-vendor.mjs`, `scripts/sync-native-runtime.mjs` | Current build and release-script hashes pinned; approval missing. |

## Current File Fingerprints

Line counts use newline-delimited logical lines. Byte counts and SHA-256 hashes
are calculated from the exact current file bytes.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/content/dom_fallback.js` | 5030 | 235555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/content/block_channel.js` | 3189 | 127857 | `c040b57e0b107fd7b6fb0a18bc4ca014e5a22fbb82755f81e51a497eee387dba` |
| `js/content/handle_resolver.js` | 282 | 9785 | `67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff` |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/io_manager.js` | 2030 | 96914 | `d04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21` |
| `build.js` | 740 | 26978 | `c8485cb2600aad89f44015cd7e49ebe4746ebcc35c91c1ff2bf29aec2f087a04` |
| `scripts/build-extension-ui.mjs` | 50 | 1188 | `6326362ebf90f448ccdbf68945b3fb522b7b215edaf9b3e28589a4e166239cf3` |
| `scripts/build-nanah-vendor.mjs` | 65 | 1818 | `dae8d3ef29c4cd44b0bf975090e9d53f3bb05b523355f5038930fc03b27e921c` |
| `scripts/sync-native-runtime.mjs` | 34 | 1070 | `4f46c13bf6099092193712790d231ff4809b00b1b0061d04af71ac3ba6bf21c6` |
| `tests/runtime/first-optimization-source-owner-approval-boundary-current-behavior.test.mjs` | 297 | 12983 | `0d5217c6674b32ac2a4cb4dcace0cda60558ad6481e01e5a0fb1de39fe6d5521` |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | 254 | 16411 | `ddab073bf8fe0b5d0f5f69d2c31e92990ba47c46eda93d3d5fe669cd05290c88` |

## Current Fingerprint Decision

```text
current source hashes pinned: GO
source-locus fingerprint boundary documented: GO
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

This boundary intentionally stops before approval. It makes stale-anchor drift
detectable, but it does not say which owner may instrument a callable, record a
metric, mutate JSON, skip DOM work, change whitelist behavior, or ship release
claims.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input for this first-optimization boundary. Current proof
pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.

## Missing Runtime Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
firstOptimizationSourceLocusFingerprintBoundary
firstOptimizationSourceLocusFingerprintReport
sourceLocusFingerprintApproval
sourceLocusHashOwnerApproval
jsonFirstSourceLocusHashGate
whitelistSourceLocusHashGate
metricFoundationSourceHashAuthority
runtimeSourceFingerprintOwnerMap
runtimeSourceFingerprintCollector
sourceLocusFingerprintMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/first-optimization-source-locus-fingerprint-boundary-current-behavior.test.mjs --test-reporter=spec
```

This gate is not a completion claim. It proves current source-locus file
fingerprints are known while source-owner approval, source-owner map artifacts,
runtime collectors, metric artifacts, rollback implementation, native sync
patches, release package changes, public claim changes, and runtime
optimization approval remain absent.

## First Optimization Source-Locus Teardown Ownership Boundary Addendum

First optimization source-locus teardown ownership boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-teardown-ownership-boundary-current-behavior.test.mjs`
move this freshness proof into current teardown ownership classification
without approving runtime changes. The addendum pins 12 source-locus teardown
boundary rows, 12 source-locus callable rows covered, 12 source-locus
fingerprint rows covered, 8 runtime source files with teardown evidence
covered, 14 runtime/build source files classified, 2 audit/test anchor files
covered, 42 current source teardown anchors covered, 5 lifecycle teardown
classes covered, 0 committed source-owner map files, 0 runtime source-owner
approvals, 0 runtime metric collector approvals, 0 runtime collector insertion
points approved, 0 implementation-ready source-locus teardown rows, expected
runtime audit tests 4457, expected runtime audit pass: 4457, and expected
runtime audit fail 0. It preserves the non-completion boundary: current hashes
and local teardown classifications still do not approve source owners, runtime
collectors, JSON-first behavior changes, whitelist optimization, artifact
commits, release parity, or public claims.

## First Optimization Source-Locus No-Work Ownership Boundary Addendum

First optimization source-locus no-work ownership boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-no-work-ownership-boundary-current-behavior.test.mjs`
move this freshness proof into current no-work ownership classification
without creating no-work artifacts or approving runtime changes. The addendum
pins 12 source-locus no-work boundary rows, 12 source-locus callable rows
covered, 12 source-locus fingerprint rows covered, 12 source-locus teardown
rows covered, 12 collector no-work rows covered, 4 P0 no-work fixture names
covered, 9 required no-work counter groups covered, 14 runtime/build source
files classified, 12 runtime/build source files with no-work evidence covered,
2 audit/test anchor files covered, 48 current source no-work anchors covered, 7
no-work risk classes covered, 0 committed no-work preservation files, 0
committed source-owner map files, 0 runtime source-owner approvals, 0 runtime
metric collector approvals, 0 runtime collector insertion points approved, 0
implementation-ready source-locus no-work rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, and expected runtime audit fail 0. It
preserves the non-completion boundary: current hashes and no-work
classifications still require measured no-work proof, side-effect budgets,
fixture provenance, diagnostic privacy, parity, rollback, native/release,
raw-capture, and public-claim limits.

## First Optimization Source-Locus Side-Effect Ownership Boundary Addendum

First optimization source-locus side-effect ownership boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-side-effect-ownership-boundary-current-behavior.test.mjs`
move this freshness proof into current side-effect ownership classification
without creating side-effect budget artifacts or approving runtime changes.
The addendum pins 12 source-locus side-effect boundary rows, 12 source-locus
callable rows covered, 12 source-locus fingerprint rows covered, 12
source-locus teardown rows covered, 12 source-locus no-work rows covered, 12
collector side-effect rows covered, 7 evidence side-effect rows covered, 12
required work-budget fields covered, 14 runtime/build source files classified,
12 runtime/build source files with side-effect evidence covered, 2 audit/test
anchor files covered, 53 current source side-effect anchors covered, 8
side-effect risk classes covered, 0 committed side-effect budget files, 0
committed no-work preservation files, 0 committed source-owner map files, 0
runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime
collector insertion points approved, 0 implementation-ready source-locus
side-effect rows, expected runtime audit tests: 4457, expected runtime audit
pass 4457, and expected runtime audit fail 0. It preserves the non-completion
boundary: current hashes and side-effect classifications still require
measured no-work proof, side-effect budgets, fixture provenance, diagnostic
privacy, parity, rollback, native/release, raw-capture, and public-claim
limits.

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
preserves the non-completion boundary: current hashes and fixture provenance
classifications still require owner approval, measured no-work proof,
side-effect budgets, diagnostic privacy, parity, rollback, native/release,
raw-capture, and public-claim limits.
