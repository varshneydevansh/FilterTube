# FilterTube Runtime Fixture Results - 2026-05-17

This file records runnable audit proofs for the current runtime behavior.
These are not implementation fixes. Some passing fixtures intentionally prove
current gaps so later fixes can be made against a stable baseline.

Command:

```bash
npm run audit:runtime
```

Historical 2026-05-17 ledger snapshot:

```text
tests 4457
pass 4457
fail 0
```

Current count interpretation:

```text
historical snapshot count above: 4457
current generated source top-level declarations: 4667
latest full runtime pass evidence: current 4663/4663 pass, 0 fail, 83.213s from 2026-05-30 full runtime rerun
stored TAP output: /private/tmp/filtertube-runtime-full-after-lifecycle-convergence.tap
runtime-results ledger completion authority: NO-GO
```

The current source count includes four later audit-only declarations that extend
the content-filter route/surface convergence proof. The latest full-runtime TAP
evidence remains the earlier 4663-test lifecycle-convergence run until a new
full-suite rerun is recorded.

The historical snapshot is retained because May 24 metric contract rows still
use it as expected-result evidence. It is not current full-suite proof,
optimization approval, or broad audit completion proof.

## Harness

| File | Purpose |
| --- | --- |
| `tests/runtime/json-first-route-surface-fixture-approval-boundary-current-behavior.test.mjs` | JSON-first route/surface fixture approval boundary addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves the aggregate fixture packet contract, artifact path boundary, artifact commit readiness gate, artifact contract coverage gate, per-file fixture contracts, route/surface authority, route/surface metric obligations, and implementation-readiness gates are not runtime JSON-first fixture approval or route/surface metric artifact approval. It pins 12 JSON-first route/surface fixture approval boundary rows, 12 fixture packet contract rows covered, 6 fixture artifact path boundary rows covered, 10 fixture artifact commit readiness rows covered, 10 fixture artifact contract coverage rows covered, 12 manifest contract rows covered, 12 fixture sample contract rows covered, 12 provenance artifact contract rows covered, 12 parity report contract rows covered, 12 verification output contract rows covered, 12 route/surface authority rows covered, 12 route/surface metric obligations covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 0 runtime JSON-first fixture packet approvals, 0 runtime JSON-first fixture artifact approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 committed route/surface fixture packet files, 0 committed route/surface fixture verification output files, 0 implementation-ready JSON-first fixture approval rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-collector-rollback-unclaimed-approval-boundary-current-behavior.test.mjs` | First optimization collector rollback/unclaimed approval boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_ROLLBACK_UNCLAIMED_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves rollback/unclaimed boundary rows, verification output approval absence, parity approval absence, diagnostic approval absence, and implementation-readiness gates are not runtime rollback or unclaimed-surface approval. It pins 12 collector rollback/unclaimed approval boundary rows, 12 rollback/unclaimed rows covered, 12 collector verification output approval rows covered, 12 verification output contract rows covered, 12 collector parity rollout approval rows covered, 12 source-locus parity release verification rows covered, 12 collector diagnostic privacy approval rows covered, 12 collector fixture provenance approval rows covered, 12 collector side-effect approval rows covered, 12 collector no-work approval rows covered, 12 collector insertion approval rows covered, 12 collector approval authority rows covered, 68 current parity release verification anchors covered, 63 method semantic proof gap files covered, 5,469 lexical callables still requiring semantic proof, 0 files with complete per-callable semantic proof, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 runtime collector no-work proofs approved, 0 runtime collector side-effect budgets approved, 0 runtime collector fixture packets approved, 0 runtime collector diagnostic privacy approvals, 0 runtime collector parity rollout approvals, 0 runtime collector verification output approvals, 0 runtime collector rollback/unclaimed approvals, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 committed parity rollout files, 0 committed verification output files, 0 committed rollback/unclaimed artifacts, 0 implementation-ready collector rollback/unclaimed approval rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-collector-verification-output-approval-boundary-current-behavior.test.mjs` | First optimization collector verification output approval boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_VERIFICATION_OUTPUT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves verification output contract rows, runtime audit counts, parity rollout approval absence, diagnostic approval absence, rollback/unclaimed rows, and implementation-readiness gates are not runtime verification output approval. It pins 12 collector verification output approval boundary rows, 12 verification output contract rows covered, 12 collector parity rollout approval rows covered, 12 parity rollout contract rows covered, 12 source-locus parity release verification rows covered, 12 collector diagnostic privacy approval rows covered, 12 collector fixture provenance approval rows covered, 12 collector side-effect approval rows covered, 12 collector no-work approval rows covered, 12 collector insertion approval rows covered, 12 collector approval authority rows covered, 12 rollback/unclaimed rows covered, 68 current parity release verification anchors covered, 63 method semantic proof gap files covered, 5,469 lexical callables still requiring semantic proof, 0 files with complete per-callable semantic proof, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 runtime collector no-work proofs approved, 0 runtime collector side-effect budgets approved, 0 runtime collector fixture packets approved, 0 runtime collector diagnostic privacy approvals, 0 runtime collector parity rollout approvals, 0 runtime collector verification output approvals, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 committed parity rollout files, 0 committed verification output files, 0 implementation-ready collector verification output approval rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-collector-parity-rollout-approval-boundary-current-behavior.test.mjs` | First optimization collector parity rollout approval boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_PARITY_ROLLOUT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves parity rollout matrix rows, parity rollout contracts, source-locus parity/release/verification classification, and diagnostic privacy approval absence are not runtime parity rollout approval. It pins 12 collector parity rollout approval boundary rows, 12 collector parity rollout rows covered, 12 parity rollout contract rows covered, 12 source-locus parity release verification rows covered, 12 collector diagnostic privacy approval rows covered, 12 collector fixture provenance approval rows covered, 12 collector side-effect approval rows covered, 12 collector no-work approval rows covered, 12 collector insertion approval rows covered, 12 collector approval authority rows covered, 12 verification output contract rows covered, 12 rollback/unclaimed rows covered, 68 current parity release verification anchors covered, 63 method semantic proof gap files covered, 5,469 lexical callables still requiring semantic proof, 0 files with complete per-callable semantic proof, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 runtime collector no-work proofs approved, 0 runtime collector side-effect budgets approved, 0 runtime collector fixture packets approved, 0 runtime collector diagnostic privacy approvals, 0 runtime collector parity rollout approvals, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 committed parity rollout files, 0 committed verification output files, 0 implementation-ready collector parity rollout approval rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-source-locus-implementation-authority-boundary-current-behavior.test.mjs` | First optimization source-locus implementation authority boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` classifies the full source-locus ownership chain as implementation-authority blockers before any runtime patch can infer approval from callable, fingerprint, teardown, no-work, side-effect, fixture provenance, diagnostic privacy, parity/release/verification, source-owner, collector, artifact-commit, metric-foundation, or implementation-readiness docs: 12 source-locus implementation authority boundary rows, 12 source-locus callable rows covered, 12 source-locus fingerprint rows covered, 12 source-locus teardown rows covered, 12 source-locus no-work rows covered, 12 source-locus side-effect rows covered, 12 source-locus fixture provenance rows covered, 12 source-locus diagnostic privacy rows covered, 12 source-locus parity release verification rows covered, 12 source-owner approval rows covered, 12 collector approval authority rows covered, 12 artifact commit readiness rows covered, 12 metric foundation contract coverage rows covered, 14 first optimization implementation readiness rows covered, 9 reserved metric foundation artifact files covered, 60 current source-locus implementation authority anchors covered, 8 source-locus implementation risk classes covered, 0 committed metric foundation artifact files, 0 runtime first optimization approvals, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 implementation-ready source-locus implementation rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-source-locus-parity-release-verification-ownership-boundary-current-behavior.test.mjs` | First optimization source-locus parity release verification ownership boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_PARITY_RELEASE_VERIFICATION_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` classifies parity, release, and verification ownership for the first-optimization source-locus rows before any parity rollout artifact, verification output artifact, diagnostic privacy artifact, fixture provenance artifact, side-effect budget artifact, no-work preservation artifact, source-owner map artifact, runtime counter, metric artifact, JSON-first behavior, whitelist optimization, rollback implementation, native sync change, release package, public claim, raw-capture release input, or persisted TAP output can use JSON/DOM/native parity, package parity, public claim scope, rollback, unclaimed surfaces, diagnostic performance scope, or verification output as implementation permission: 12 source-locus parity release verification boundary rows, 12 source-locus callable rows covered, 12 source-locus fingerprint rows covered, 12 source-locus teardown rows covered, 12 source-locus no-work rows covered, 12 source-locus side-effect rows covered, 12 source-locus fixture provenance rows covered, 12 source-locus diagnostic privacy rows covered, 12 parity rollout contract rows covered, 12 verification output contract rows covered, 12 rollback/unclaimed boundary rows covered, 12 collector parity rollout rows covered, 2 evidence parity rollout rows covered, 8 parity and release boundary source docs covered, 8 release/native/public boundary source docs covered, 68 current parity release verification anchors covered, 8 parity release verification risk classes covered, 0 committed parity rollout files, 0 committed verification output files, 0 committed diagnostic privacy files, 0 committed fixture provenance files, 0 committed source-owner map files, 0 committed side-effect budget files, 0 committed no-work preservation files, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 implementation-ready source-locus parity release verification rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-source-locus-diagnostic-privacy-ownership-boundary-current-behavior.test.mjs` | First optimization source-locus diagnostic privacy ownership boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_DIAGNOSTIC_PRIVACY_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` classifies diagnostic privacy ownership for the first-optimization source-locus rows before any diagnostic privacy artifact, fixture provenance artifact, side-effect budget artifact, no-work preservation artifact, source-owner map artifact, runtime counter, metric artifact, logging removal patch, JSON-first behavior, whitelist optimization, rollback implementation, native sync change, release package, or public claim can use console logs, debug gates, redaction policy, metric replacement, fixture provenance, rollout scope, or verification output as implementation permission: 12 source-locus diagnostic privacy boundary rows, 12 source-locus callable rows covered, 12 source-locus fingerprint rows covered, 12 source-locus teardown rows covered, 12 source-locus no-work rows covered, 12 source-locus side-effect rows covered, 12 source-locus fixture provenance rows covered, 12 diagnostic privacy contract rows covered, 21 diagnostic logging policy source files covered, 418 active console callsites covered, 203 console.log callsites covered, 123 console.warn callsites covered, 68 console.error callsites covered, 24 console.debug callsites covered, 0 console.info callsites covered, 196 page-runtime-core callsites covered, 131 background-storage-state callsites covered, 35 current diagnostic privacy anchors covered, 8 diagnostic privacy risk classes covered, 0 committed diagnostic privacy files, 0 committed fixture provenance files, 0 committed source-owner map files, 0 committed side-effect budget files, 0 committed no-work preservation files, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 implementation-ready source-locus diagnostic privacy rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-source-locus-fixture-provenance-ownership-boundary-current-behavior.test.mjs` | First optimization source-locus fixture provenance ownership boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FIXTURE_PROVENANCE_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` classifies fixture provenance ownership for the first-optimization source-locus rows before any fixture provenance artifact, side-effect budget artifact, no-work preservation artifact, source-owner map artifact, runtime counter, metric artifact, JSON-first behavior, whitelist optimization, rollback implementation, native sync change, release package, or public claim can use raw captures, reduced fixtures, positive/negative fixtures, no-rule/disabled/empty-list fixtures, JSON/DOM/native parity, release exclusion, rollout scope, or verification output as implementation permission: 12 source-locus fixture provenance boundary rows, 12 source-locus callable rows covered, 12 source-locus fingerprint rows covered, 12 source-locus teardown rows covered, 12 source-locus no-work rows covered, 12 source-locus side-effect rows covered, 12 collector fixture provenance rows covered, 12 fixture provenance contract rows covered, 11 P0 capture traceability rows covered, 46 unique raw capture obligation paths covered, 47 ignored raw capture entries covered, 45 present local raw capture paths covered, 44 committed reduced fixture fragments covered, 33 fixture corpus JSON files covered, 11 fixture corpus HTML files covered, 12 fixture provenance anchor files covered, 25 current fixture provenance anchors covered, 8 fixture provenance risk classes covered, 0 committed fixture provenance files, 0 committed source-owner map files, 0 committed side-effect budget files, 0 committed no-work preservation files, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 implementation-ready source-locus fixture provenance rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-source-locus-side-effect-ownership-boundary-current-behavior.test.mjs` | First optimization source-locus side-effect ownership boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` classifies side-effect ownership for the first-optimization source-locus rows before any side-effect budget artifact, no-work preservation artifact, source-owner map artifact, runtime counter, metric artifact, JSON-first behavior, whitelist optimization, rollback implementation, native sync change, release package, or public claim can use settings, artifact, transport, engine, DOM, lifecycle, network, storage, visual, whitelist, diagnostic, rollout, or verification effects as implementation permission: 12 source-locus side-effect boundary rows, 12 source-locus callable rows covered, 12 source-locus fingerprint rows covered, 12 source-locus teardown rows covered, 12 source-locus no-work rows covered, 12 collector side-effect rows covered, 7 evidence side-effect rows covered, 12 required work-budget fields covered, 14 runtime/build source files classified, 12 runtime/build source files with side-effect evidence covered, 2 audit/test anchor files covered, 53 current source side-effect anchors covered, 8 side-effect risk classes covered, 0 committed side-effect budget files, 0 committed no-work preservation files, 0 committed source-owner map files, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 implementation-ready source-locus side-effect rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-source-locus-no-work-ownership-boundary-current-behavior.test.mjs` | First optimization source-locus no-work ownership boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` classifies no-work ownership for the first-optimization source-locus rows before any no-work preservation artifact, source-owner map artifact, runtime counter, metric artifact, JSON-first behavior, whitelist optimization, rollback implementation, native sync change, release package, or public claim can use disabled, missing-settings, no-rule, pass-through, menu-off, no-network, no-storage, no-visual, whitelist-pending, diagnostic, or build/release paths as implementation permission: 12 source-locus no-work boundary rows, 12 source-locus callable rows covered, 12 source-locus fingerprint rows covered, 12 source-locus teardown rows covered, 12 collector no-work rows covered, 4 P0 no-work fixture names covered, 9 required no-work counter groups covered, 14 runtime/build source files classified, 12 runtime/build source files with no-work evidence covered, 2 audit/test anchor files covered, 48 current source no-work anchors covered, 7 no-work risk classes covered, 0 committed no-work preservation files, 0 committed source-owner map files, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 implementation-ready source-locus no-work rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-source-locus-teardown-ownership-boundary-current-behavior.test.mjs` | First optimization source-locus teardown ownership boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` classifies teardown ownership for the first-optimization source-locus rows before any source-owner map artifact, runtime counter, metric artifact, JSON-first behavior, whitelist optimization, rollback implementation, native sync change, release package, or public claim can use listeners, observers, timers, page-global patches, map flushes, or visual side effects as implementation permission: 12 source-locus teardown boundary rows, 12 source-locus callable rows covered, 12 source-locus fingerprint rows covered, 8 runtime source files with teardown evidence covered, 14 runtime/build source files classified, 2 audit/test anchor files covered, 42 current source teardown anchors covered, 5 lifecycle teardown classes covered, 0 committed source-owner map files, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 implementation-ready source-locus teardown rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-source-locus-fingerprint-boundary-current-behavior.test.mjs` | First optimization source-locus fingerprint boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` pins the current SHA-256, line-count, and byte-count boundary for source-locus anchors before any source-owner map artifact, runtime counter, metric artifact, JSON-first behavior, whitelist optimization, rollback implementation, native sync change, release package, or public claim can use those anchors as implementation permission: 12 source-locus callable rows covered, 14 runtime source files fingerprinted, 2 audit/test anchor files fingerprinted, 16 current fingerprint rows covered, 38 upstream line anchors covered, 0 committed source-owner map files, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 implementation-ready source-locus fingerprint rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-source-locus-callable-anchor-boundary-current-behavior.test.mjs` | First optimization source locus callable anchor boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves current line/callable anchors are known before source-owner approval, source-owner map artifacts, runtime counters, metric artifacts, JSON-first behavior, whitelist optimization, rollback implementation, native sync changes, release packages, or public claims: 12 source-locus callable boundary rows, 12 source-owner approval rows covered, 12 source owner map contract rows covered, 12 metric source-owner rows covered, 12 metric schema rows covered, 38 line anchors covered, 14 runtime source files covered, 2 audit/test anchor files covered, 9 listener/observer/timer surfaces pinned, 0 committed source-owner map files, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 implementation-ready source-locus callable rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-source-owner-approval-boundary-current-behavior.test.mjs` | First optimization source-owner approval boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves first-optimization source-owner approval remains absent before a source-owner map artifact, runtime counters, metric artifacts, JSON-first behavior, whitelist optimization, rollback implementation, native sync changes, release packages, or public claims: 12 source-owner approval boundary rows, 1 selected first optimization binding covered, 12 source-owner matrix rows covered, 12 source-owner map contract rows covered, 12 metric schema rows covered, 12 metric sample contract rows covered, 12 manifest contract rows covered, 14 runtime source files referenced, 10 owner families referenced, 1 reserved source-owner map path covered, 0 committed source-owner map files, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 implementation-ready source-owner approval rows, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-collector-approval-authority-boundary-current-behavior.test.mjs` | First optimization collector approval authority boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves first-optimization collector approval remains absent before runtime counters, metric artifacts, JSON-first behavior, whitelist optimization, rollback implementation, native sync changes, release packages, or public claims: 12 collector approval authority rows, 1 selected first optimization binding covered, 12 collector insertion rows covered, 12 collector no-work rows covered, 12 collector side-effect rows covered, 12 collector fixture provenance rows covered, 12 collector parity rollout rows covered, 12 diagnostic privacy contract rows covered, 12 verification output contract rows covered, 12 rollback/unclaimed rows covered, 14 implementation readiness rows covered, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 runtime collector no-work proofs approved, 0 runtime collector side-effect budgets approved, 0 runtime collector fixture packets approved, 0 runtime collector parity rollout proofs approved, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 implementation-ready collector approval rows, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-artifact-commit-readiness-gate-current-behavior.test.mjs` | First optimization artifact commit readiness gate addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` proves the reserved metric-foundation artifact root and files are not commit-ready yet without creating the artifact root, artifact files, runtime collectors, rollback implementation, native sync changes, release package changes, or public claims: 12 artifact commit readiness rows, 1 reserved artifact root covered, 9 reserved artifact files covered, 9 contract docs covered, 9 contract tests covered, 0 committed metric foundation artifact files, 0 runtime metric collector approvals, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 implementation-ready artifact commit rows, 12 contract coverage rows covered, 12 rollback/unclaimed rows covered, 12 verification output contract rows covered, 12 parity rollout contract rows covered, 12 foundation packet rows covered, 10 artifact path boundary rows covered, 14 implementation readiness rows covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-rollback-unclaimed-surface-boundary-current-behavior.test.mjs` | First optimization rollback unclaimed surface boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` isolates rollback, unclaimed-surface, native sync, release package, raw-capture, diagnostic performance, and public-claim limits before any metric-foundation artifact is committed or runtime behavior changes: 12 rollback/unclaimed boundary rows, 12 upstream metric foundation contract coverage rows covered, 12 verification output contract rows covered, 12 parity rollout contract rows covered, 12 diagnostic privacy contract rows covered, 12 collector parity rollout rows covered, 8 release/native/public boundary source docs covered, 0 committed rollback/unclaimed artifacts, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 runtime metric collector approvals, 0 implementation-ready rollback/unclaimed rows, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-metric-foundation-contract-coverage-gate-current-behavior.test.mjs` | First optimization metric foundation contract coverage gate addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_FOUNDATION_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md` proves the reserved metric-foundation artifact contract set is complete without creating the artifact root, artifact files, runtime collectors, native sync changes, release package changes, or public claims: 12 contract coverage rows, 1 reserved artifact root covered, 9 reserved artifact files covered, 9 contract docs covered, 9 contract tests covered, 0 committed foundation metric artifact files, 0 runtime metric collector approvals, 0 implementation-ready contract coverage rows, 10 artifact path rows covered, 12 foundation packet rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-verification-output-contract-current-behavior.test.mjs` | First optimization verification output contract addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future `verification-output.tap` shape for the selected metric-foundation artifact without creating the output file, artifacts, runtime collectors, native sync changes, release package changes, or public claims: 12 verification output contract rows, 1 reserved verification output path covered, 0 committed verification output files, 0 runtime metric collector approvals, 0 implementation-ready verification output contract rows, 12 parity rollout contract rows covered, 12 diagnostic privacy contract rows covered, 12 side-effect budget contract rows covered, 12 no-work preservation contract rows covered, 12 fixture provenance contract rows covered, 12 source owner map contract rows covered, 12 metric sample contract rows covered, 12 manifest contract rows covered, 10 artifact path rows covered, 12 foundation packet rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |
| `tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs` | First optimization parity rollout contract addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future `parity-rollout.json` shape for the selected metric-foundation artifact without creating the rollout packet, artifacts, runtime collectors, native sync changes, release package changes, or public claims: 12 parity rollout contract rows, 1 reserved parity rollout path covered, 0 committed parity rollout files, 0 runtime metric collector approvals, 0 implementation-ready parity rollout contract rows, 12 diagnostic privacy contract rows covered, 12 side-effect budget contract rows covered, 12 no-work preservation contract rows covered, 12 fixture provenance contract rows covered, 12 source owner map contract rows covered, 12 metric sample contract rows covered, 12 manifest contract rows covered, 10 artifact path rows covered, 12 foundation packet rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, 2 evidence parity rollout rows covered, 8 parity/release boundary source docs covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, and no runtime behavior changed. |
| `tests/runtime/first-optimization-diagnostic-privacy-contract-current-behavior.test.mjs` | First optimization diagnostic privacy contract addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future `diagnostic-privacy.json` shape for the selected metric-foundation artifact without creating the privacy packet, artifacts, or runtime collectors: 12 diagnostic privacy contract rows, 1 reserved diagnostic privacy path covered, 0 committed diagnostic privacy files, 0 runtime metric collector approvals, 0 implementation-ready diagnostic privacy contract rows, 12 side-effect budget contract rows covered, 12 no-work preservation contract rows covered, 12 fixture provenance contract rows covered, 12 source owner map contract rows covered, 12 metric sample contract rows covered, 12 manifest contract rows covered, 10 artifact path rows covered, 12 foundation packet rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, 21 diagnostic logging policy source files covered, 418 active console callsites covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, and no runtime behavior changed. |
| `tests/runtime/first-optimization-side-effect-budget-contract-current-behavior.test.mjs` | First optimization side-effect budget contract addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future `side-effect-budget.json` shape for the selected metric-foundation artifact without creating the budget packet, artifacts, or runtime collectors: 12 side-effect budget contract rows, 1 reserved side-effect budget path covered, 0 committed side-effect budget files, 0 runtime metric collector approvals, 0 implementation-ready side-effect budget contract rows, 12 no-work preservation contract rows covered, 12 fixture provenance contract rows covered, 12 source owner map contract rows covered, 12 metric sample contract rows covered, 12 manifest contract rows covered, 10 artifact path rows covered, 12 foundation packet rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, and no runtime behavior changed. |
| `tests/runtime/first-optimization-no-work-preservation-contract-current-behavior.test.mjs` | First optimization no-work preservation contract addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_NO_WORK_PRESERVATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future `no-work-preservation.json` shape for the selected metric-foundation artifact without creating the preservation packet, artifacts, or runtime collectors: 12 no-work preservation contract rows, 1 reserved no-work preservation path covered, 0 committed no-work preservation files, 0 runtime metric collector approvals, 0 implementation-ready no-work preservation contract rows, 12 fixture provenance contract rows covered, 12 source owner map contract rows covered, 12 metric sample contract rows covered, 12 manifest contract rows covered, 10 artifact path rows covered, 12 foundation packet rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, and no runtime behavior changed. |
| `tests/runtime/first-optimization-fixture-provenance-contract-current-behavior.test.mjs` | First optimization fixture provenance contract addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future `fixture-provenance.json` shape for the selected metric-foundation artifact without creating the provenance packet, artifacts, or runtime collectors: 12 fixture provenance contract rows, 1 reserved fixture provenance path covered, 0 committed fixture provenance files, 0 runtime metric collector approvals, 0 implementation-ready fixture provenance contract rows, 12 source owner map contract rows covered, 12 metric sample contract rows covered, 12 manifest contract rows covered, 10 artifact path rows covered, 12 foundation packet rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, and no runtime behavior changed. |
| `tests/runtime/first-optimization-source-owner-map-contract-current-behavior.test.mjs` | First optimization source owner map contract addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future `source-owner-map.json` shape for the selected metric-foundation artifact without creating the map, artifacts, or runtime collectors: 12 source owner map contract rows, 1 reserved source owner map path covered, 0 committed source owner map files, 0 runtime metric collector approvals, 0 implementation-ready source owner map contract rows, 12 metric sample contract rows covered, 12 manifest contract rows covered, 10 artifact path rows covered, 12 foundation packet rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, and no runtime behavior changed. |
| `tests/runtime/first-optimization-source-owner-map-draft-readiness-current-behavior.test.mjs` | First optimization source owner map draft readiness addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_DRAFT_READINESS_CURRENT_BEHAVIOR_2026-05-29.md` consolidates the source-owner map contract, source-locus callable anchors, source-locus fingerprints, metric source-owner rows, source-owner approval boundary, artifact path boundary, collector approval boundary, collector insertion gate, and method semantic proof gap without creating `source-owner-map.json`: 12 draft readiness rows, 12 source owner map contract rows covered, 12 source-locus callable rows covered, 16 source-locus fingerprint rows covered, 12 metric source-owner rows covered, 12 source-owner approval rows covered, 38 line anchors covered, 14 runtime source files covered, 2 audit/test anchor files covered, 10 owner families covered, 1 reserved source-owner map path covered, 0 committed reserved source-owner map files, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 implementation-ready draft readiness rows, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, draft artifact promotion decision `NO-GO`, and no runtime behavior changed. |
| `tests/runtime/first-optimization-metric-sample-contract-current-behavior.test.mjs` | First optimization metric sample contract addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future `metric-sample.json` shape for the selected metric-foundation artifact without creating the sample, artifacts, or runtime collectors: 12 metric sample contract rows, 1 reserved metric sample path covered, 0 committed metric sample files, 0 runtime metric collector approvals, 0 implementation-ready metric sample contract rows, 12 manifest contract rows covered, 10 artifact path rows covered, 12 foundation packet rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, and no runtime behavior changed. |
| `tests/runtime/first-optimization-packet-manifest-contract-current-behavior.test.mjs` | First optimization packet manifest contract addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PACKET_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future `packet-manifest.json` shape for the selected metric-foundation artifact without creating the manifest, artifacts, or runtime collectors: 12 manifest contract rows, 1 reserved manifest path covered, 0 committed packet manifest files, 0 runtime metric collector approvals, 0 implementation-ready manifest contract rows, 10 artifact path rows covered, 12 foundation packet rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, and no runtime behavior changed. |
| `tests/runtime/first-optimization-metric-artifact-path-boundary-current-behavior.test.mjs` | First optimization metric artifact path boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` reserves the future audit artifact root `docs/audit/artifacts/first-optimization/metric-foundation/` without committing metric artifacts or approving collectors: 10 path boundary rows, 1 reserved future artifact root, 9 reserved future artifact files, 0 committed foundation metric artifact files, 0 runtime metric collector approvals, 0 implementation-ready artifact path rows, 12 foundation packet rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, and no runtime behavior changed. |
| `tests/runtime/first-optimization-metric-artifact-foundation-packet-current-behavior.test.mjs` | First optimization metric artifact foundation packet addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_FOUNDATION_PACKET_CURRENT_BEHAVIOR_2026-05-24.md` defines the current audit-only packet required before the selected `FT-BIND-00-metric-artifact-foundation` work packet can support a runtime collector or optimization patch: 12 foundation packet rows, 1 selected foundation binding row covered, 10 candidate selection rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, 12 route/surface obligations covered, 8 diagnostic logging policy rows covered, 0 committed foundation metric artifacts, 0 runtime metric collectors approved, and 0 implementation-ready foundation packet rows. |
| `tests/runtime/first-optimization-candidate-selection-boundary-current-behavior.test.mjs` | First optimization candidate selection boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_CANDIDATE_SELECTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` selects `FT-BIND-00-metric-artifact-foundation` as the next audit-only first-optimization work packet without opening runtime implementation: 10 candidate selection rows, 1 selected audit work packet, 0 selected runtime behavior patches, 0 implementation-ready selected candidate rows, 10 candidate-obligation bindings reviewed, 12 optimization candidates covered, 12 route/surface obligations covered, 10 evidence packet rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, and no runtime behavior changed. |
| `tests/runtime/first-optimization-implementation-readiness-gate-current-behavior.test.mjs` | First optimization implementation readiness gate addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` consolidates the first optimization prerequisite chain without changing runtime behavior: 14 implementation readiness rows, 8 stop/go rows covered, 12 optimization candidates covered, 6 P0 authority rows covered, 12 route/surface obligations covered, 10 whitelist readiness gaps covered, 10 evidence packet rows covered, 10 candidate binding rows covered, 12 metric schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 parity rollout rows covered, 0 runtime first optimization approvals, and 0 implementation-ready first optimization rows. |
| `tests/runtime/first-optimization-metric-collector-parity-rollout-boundary-current-behavior.test.mjs` | First optimization metric collector parity rollout boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` maps first-patch metric collector JSON/DOM/native parity and release/public rollout boundaries without adding instrumentation or changing release behavior: 12 collector parity rollout rows, 12 collector fixture provenance rows covered, 12 route/surface obligations covered, 2 evidence parity rollout rows covered, 8 parity and release boundary source docs covered, 0 runtime collector parity rollout proofs approved, and 0 implementation-ready parity rollout rows. |
| `tests/runtime/first-optimization-metric-collector-fixture-provenance-matrix-current-behavior.test.mjs` | First optimization metric collector fixture provenance matrix addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` maps the first-patch metric collector fixture provenance requirements without adding instrumentation or extracting fixtures: 12 collector fixture provenance rows, 12 route/surface obligations covered, 10 candidate binding rows covered, 6 evidence fixture/parity rows covered, 8 required fixture/parity fields covered, 11 P0 capture traceability rows covered, 46 unique raw capture obligation paths covered, 0 runtime collector fixture packets approved, and 0 implementation-ready fixture provenance rows. |
| `tests/runtime/first-optimization-metric-collector-side-effect-budget-matrix-current-behavior.test.mjs` | First optimization metric collector side-effect budget matrix addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` maps the first-patch metric collector side-effect budget requirements without adding instrumentation: 12 collector side-effect budget rows, 12 collector no-work preservation rows covered, 12 collector insertion rows covered, 7 evidence side-effect rows covered, 12 required work-budget fields covered, 12 route/surface obligations covered, 0 runtime collector side-effect budgets approved, and 0 implementation-ready side-effect rows. |
| `tests/runtime/first-optimization-metric-collector-no-work-preservation-matrix-current-behavior.test.mjs` | First optimization metric collector no-work preservation matrix addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` maps the first-patch metric collector no-work preservation requirements without adding instrumentation: 12 collector no-work preservation rows, 12 collector insertion rows covered, 4 P0 no-work fixture names covered, 9 required no-work counter groups covered, 12 route/surface obligations covered, 0 runtime collector no-work proofs approved, and 0 implementation-ready collector no-work rows. |
| `tests/runtime/first-optimization-metric-collector-insertion-gate-current-behavior.test.mjs` | First optimization metric collector insertion gate addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md` maps the first-patch metric collector insertion risks without adding instrumentation: 12 collector insertion gate rows, 12 metric source-owner rows covered, 12 metric schema rows covered, 12 route/surface obligations covered, 0 runtime collector insertion points approved, 0 collector rows with no-work preservation proof, and 0 implementation-ready collector rows. |
| `tests/runtime/first-optimization-metric-source-owner-matrix-current-behavior.test.mjs` | First optimization metric source-owner matrix addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` maps the first-patch metric schema rows to current source owners without adding a collector: 12 source-owner rows, 12 schema rows covered, 14 runtime source files referenced, 10 owner families referenced, 0 source-owner rows with implemented collectors, and 0 implementation-ready source-owner rows. |
| `tests/runtime/first-optimization-metric-artifact-schema-current-behavior.test.mjs` | First optimization metric artifact schema addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md` defines the minimum metric artifact shape for the first future optimization patch without adding a runtime collector: 12 schema rows, 10 candidate bindings requiring metric artifacts, 12 route/surface obligations requiring metric artifacts, 1 evidence row requiring a metric artifact, 0 committed first-optimization metric artifacts, 0 runtime metric collectors, and 0 implementation-ready metric artifacts. |
| `tests/runtime/candidate-obligation-binding-matrix-current-behavior.test.mjs` | Candidate obligation binding matrix addendum: `docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` binds optimization candidate ids to route/surface metric obligations, whitelist readiness rows, source loci, and first-patch evidence rows without opening the implementation gate: 10 binding rows, 12 candidates referenced, 12 obligations referenced, 10 whitelist readiness rows referenced, 10 evidence rows referenced, and 0 implementation-ready bindings. |
| `tests/runtime/optimization-candidate-priority-register-current-behavior.test.mjs` | Optimization candidate priority register addendum: `docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md` ranks 12 source-backed optimization candidates without opening the implementation gate: 6 P0 prerequisite candidates, 5 P1 follow-on candidates, 1 P2 rollout candidate, and 0 implementation-ready candidates. It ties JSON-first optimization to metric artifacts, seed fetch/XHR pass-through budgets, active-work decisions, harvest/mutation splits, list-mode policy, DOM/menu/quick-block/category lifecycle budgets, diagnostic logging policy, and native/release parity. |
| `tests/runtime/runtime-diagnostic-logging-policy-matrix-current-behavior.test.mjs` | Runtime diagnostic logging policy matrix addendum: `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` pins 418 active `console.*` callsites across page runtime, background/storage, content helpers, extension UI, build/release scripts, and quarantined legacy source. It proves diagnostic logging is source-scattered today and that first-class log privacy, redaction, no-work, metric-artifact, and JSON-first logging gates are absent from scoped product source. |
| `tests/runtime/network-credential-policy-matrix-current-behavior.test.mjs` | Network credential policy matrix addendum: `docs/audit/FILTERTUBE_NETWORK_CREDENTIAL_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` pins the 11 explicit fetch credential rows across background, content bridge, handle resolver, and injector source, plus the 2 extension-resource fetch rows without explicit credentials. It proves credential modes are local callsite choices today and that first-class credential policy/report tokens are absent from product runtime source. |
| `tests/runtime/harness/load-filter-engine.mjs` | Loads `js/filter_logic.js` in a Node VM with browser stubs and returns `window.FilterTubeEngine`. |
| `tests/runtime/harness/load-seed-runtime.mjs` | Loads `js/seed.js` in a Node VM with mock fetch/XHR/Response and an instrumented engine stub. |
| `tests/runtime/active-rule-authority-current-behavior.test.mjs` | Pins the current split active-rule authority across seed JSON predicates, DOM fallback predicates, quick-block lifecycle, normal/fallback menu gates, settings compile, list-mode transitions, and V4 aliases. |
| `tests/runtime/all-callable-index-current-behavior.test.mjs` | Pins the repo-wide tracked JS/JSX/MJS callable index, the method semantic proof gap index at `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`, and excludes ignored raw captures/generated output from source authority. |
| `tests/runtime/method-semantic-audit-register-current-behavior.test.mjs` | Pins the method semantic audit register: lexical callable counts are not behavior proof, high-risk method families require owner/trigger/input/route/side-effect/disabled-budget/teardown/fixture fields, the JSON/DOM/network identity waterfall remains surface-dependent, and no runtime method authority exists yet. |
| `tests/runtime/page-runtime-owner-effect-matrix-current-behavior.test.mjs` | Pins page-runtime owner/effect boundaries: seed transport, bridge settings/maps/prefetch/whitelist/fallback menu, quick block, normal menu/Kids passive, DOM fallback, playlist/player guard, collaborator dialog, and prompt surfaces are separate side-effect owners without a shared owner/effect authority. |
| `tests/runtime/network-fetch-reason-matrix-current-behavior.test.mjs` | Pins network fetch reason boundaries: passive YouTubei interception, extension release notes, subscription import, metadata fetch, Shorts/watch/Kids identity fallback, menu-open enrichment, DOM repair, direct handle fallback, clicked-target retry, post-block fanout, caller-requested channel fetches, and website remotes are separate reason classes with no shared fetch-reason authority. |
| `tests/runtime/audit-completion-gap-register-current-behavior.test.mjs` | Pins the audit completion gap register: the active broad audit goal remains open, every objective term maps to a closed implementation gate, the old four-step identity shorthand is not enough, the old proactive-XHR instant-blocking wording must not return, and no runtime completion authority exists. |
| `tests/runtime/audit-doc-layout-current-behavior.test.mjs` | Pins audit artifact placement: `docs/audit/FILTERTUBE_AUDIT_DOC_LAYOUT_CURRENT_BEHAVIOR_2026-05-24.md` records 0 root-level `FILTERTUBE_*.md` files under plain `docs/`, 543 `docs/audit/FILTERTUBE_*.md` files, root-level audit placement as NO-GO, new audit artifacts under `docs/audit` as GO, and runtime tests under `tests/runtime` as GO. |
| `tests/runtime/feature-source-dependency-register-current-behavior.test.mjs` | Pins the feature source dependency register: visible and hidden workflows must name rule-state, content/text, identity, DOM/lifecycle, side effects, confidence, and no-runtime-authority boundaries before behavior changes. |
| `tests/runtime/source-tier-effect-authority-current-behavior.test.mjs` | Pins the source-tier/effect authority boundary: XHR/YouTubei JSON, `ytInitial*` snapshots, learned maps, DOM extraction, and network fallback are information tiers, not automatic permission to harvest, mutate, hide, restore, write maps, fetch, optimistically hide, fan out, or count stats. |
| `tests/runtime/identity-waterfall-assertion-boundary-current-behavior.test.mjs` | Pins the identity waterfall assertion boundary: `XHR JSON -> ytInitial* -> DOM -> network fetch` is only a priority order, JSON/player fields are preferred but surface-dependent, `videoId` is a join key, DOM text may be display-only, network fallback and post-action Shorts/playlist enrichment still exist, and no `identityWaterfallAssertionAuthority` or `identityWorkBudget` runtime token exists yet. |
| `tests/runtime/identity-waterfall-review-convergence-current-behavior.test.mjs` | Pins the focused review convergence for the channel identity waterfall: direct JSON rules, harvest-only fields, `videoId` joins, display-only DOM, action fanout, background resolvers, and per-surface decision flow are distinct current-behavior authority classes, and no `identitySourceEffectDecision` or related runtime authority exists yet. |
| `tests/runtime/identity-work-budget-current-behavior.test.mjs` | Pins the identity work-budget boundary: source confidence is not work permission, current endpoint body work, harvest-only work, page-global hooks, learned-map writes, DOM stamping/reruns, metadata reruns, resolver fetches, post-action Shorts/playlist fanout, and stale restore scans remain split, and no `identityWorkBudgetDecision` or `postActionIdentityFanoutBudget` runtime token exists yet. |
| `tests/runtime/identity-resolver-fanout-current-behavior.test.mjs` | Pins the identity resolver/fanout boundary: menu-open main-world lookup, clicked-target watch/Shorts recovery, retry fallbacks, DOM fallback handle repair, background Shorts/watch/Kids identity fetches, and post-block Shorts/playlist fanout are separate resolver classes with local guardrails but no shared `identityResolverAuthority` or `identityResolverNetworkPolicy` runtime token yet. |
| `tests/runtime/dom-identity-confidence-current-behavior.test.mjs` | Pins the DOM identity confidence boundary: recycled-card resets, prefetch stamping, ownership checks, low-confidence name extraction, menu mismatch guards, whitelist pending hides, current-page identity, and name fallback are split across local guardrails with no shared `domIdentityConfidenceAuthority` runtime token yet. |
| `tests/runtime/background-message-authority-current-behavior.test.mjs` | Pins background/service-worker message authority: two listener shapes, trusted UI guard coverage, unguarded/split mutation paths, caller settings cache authority, script injection boundaries, and ignored root captures as evidence only. |
| `tests/runtime/backup-export-authority-current-behavior.test.mjs` | Pins backup/export/import authority: split background and IO auto-backup writers, caller-owned schedule payloads, encryption/session-PIN policy, filename/rotation policy, manual export/import gates, Firefox anchor fallback, and content-script/background duplicate scheduling. |
| `tests/runtime/p0-backup-export-current-behavior.test.mjs` | Starts converting the P0 backup/export fixture family into runnable proof: untrusted schedule sender gaps, unclamped schedule delay, timer-only dedupe, split encryption and filename policies, silent missing-session-PIN skip, download-record-only rotation, IO directory probe writes, manual-only UI gates, encrypted import target-profile drift, Nanah trusted-device restore same-device gap, and post-import/sync revision gaps. |
| `tests/runtime/code-burden-declutter-boundary-current-behavior.test.mjs` | Pins the code-burden declutter boundary: quarantined CSS, zero-byte troubleshoot page, generated UI shells, vendor bundles, whole-directory package roots, ignored raw captures, native runtime copies, and duplicate-looking runtime paths are classified before any cleanup. |
| `tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs` | Extends no-work proof to XHR: endpoint-like URLs are marked before settings exist or while disabled, ready-state/load hooks are installed before late guards run, and response override behavior remains gated after JSON parsing. |
| `tests/runtime/page-global-patch-authority-current-behavior.test.mjs` | Pins page-global patch authority: fetch and XHR patch page-native APIs first, endpoint/no-work decisions run later, XHR has an idempotence flag, fetch lacks a matching flag, and no shared patch restore/lifecycle registry exists. |
| `tests/runtime/background-identity-fetch-trigger-chain-current-behavior.test.mjs` | Pins the DOM-fallback-to-background identity fetch chain documented in `docs/audit/FILTERTUBE_BACKGROUND_IDENTITY_FETCH_TRIGGER_CHAIN_CURRENT_BEHAVIOR_2026-05-19.md`: unresolved handle repair can call background-only handle resolution, send `fetchChannelDetails`, fetch YouTube channel HTML with credentials included, post a learned channel-map update, and schedule another DOM fallback pass without one shared identity-fetch authority. |
| `tests/runtime/reference-doc-claim-drift-current-behavior.test.mjs` | Pins stale reference-doc claims as audit evidence: zero-network Kids, instant all-surface identity, always-successful DOM extraction, no enrichment loop, nullable source behavior, fallback fetches, and missing reference-doc claim authority. |
| `tests/runtime/performance-claim-evidence-boundary-current-behavior.test.mjs` | Pins performance claim evidence boundaries: historical numeric claims in docs remain unmeasured current claims until backed by route/device/rule-state metrics, while existing empty-install, XHR no-work, active-rule, selector, and identity-budget proofs show lag-relevant work remains. |
| `tests/runtime/content-category-predicate-authority-current-behavior.test.mjs` | Pins content/category predicate authority: raw enabled activation in seed/DOM, engine final decision validation, duration/upload-date late validation, duplicated Main/Kids save paths, noncanonical refresh keys, and future `contentPredicateAuthority` gates. |
| `tests/runtime/compact-autoplay-authority-current-behavior.test.mjs` | Pins compact autoplay authority: `compactAutoplayRenderer` is absent from direct rules, nested unwrap keys, category/content renderer allowlists, and committed capture fixtures; keyword, channel, and content/category rules currently pass through it. |
| `tests/runtime/compact-autoplay-raw-corpus-census-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_COMPACT_AUTOPLAY_RAW_CORPUS_CENSUS_CURRENT_BEHAVIOR_2026-05-23.md`: current ignored raw evidence has `compactAutoplayRenderer` mentions only in historical text notes, raw JSON/HTML captures: 0, committed compact-autoplay fixtures: 0, and a real capture is still required before JSON-first compact autoplay behavior changes. |
| `tests/runtime/ytm-compact-playlist-creator-authority-boundary-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_YTM_COMPACT_PLAYLIST_CREATOR_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md` with real `YTM.json` compact playlist proof from `tests/runtime/fixtures/captures/ytm-compact-playlist-renderer.json`: canonical creator-looking fields are present, but `compactPlaylistRenderer` remains unsupported/direct-gap and not first-class JSON filter authority; blocklist title/channel rules, whitelist nonmatch, whitelist match, and `hidePlaylistCards` preserve the row while channel-map side effects still fire. |
| `tests/runtime/ytm-show-sheet-collaborator-roster-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_YTM_SHOW_SHEET_COLLABORATOR_ROSTER_CURRENT_BEHAVIOR_2026-05-24.md` with real `YTM-XHR.json` YTM showSheetCommand collaborator roster proof from `tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json`: the row is a supported `videoWithContextRenderer` for title decisions, but the `showSheetCommand.sheetViewModel` roster is not first-class collaborator filter authority; no-rule and disabled processing preserve the row while queuing three channel-map side effects, blocklist channel rules for Shakira, Spotify, or Beele leak, and whitelist channel allow for the same collaborators false-hides the row. |
| `tests/runtime/ytm-show-sheet-injector-filter-logic-parity-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_YTM_SHOW_SHEET_INJECTOR_FILTER_LOGIC_PARITY_CURRENT_BEHAVIOR_2026-05-24.md` with cross-owner YTM collaborator proof: `js/injector.js` can parse the same YTM showSheet roster that `js/filter_logic.js` does not consume as candidate channel identity. Injector direct extraction and snapshot search return Shakira, Spotify, and Beele, while filter logic still leaks a matching blocklist collaborator and false-hides a matching whitelist collaborator. |
| `tests/runtime/main-guide-endpoint-no-work-boundary-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_MAIN_GUIDE_ENDPOINT_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md` with real `guide?prettyPrint=false.json` proof from `tests/runtime/fixtures/captures/main-guide-entry-renderer.json`: the guide endpoint is not a zero-work path today, the guide row has channel identity fields but `guideEntryRenderer` is not first-class guide JSON filter authority, empty blocklist, whitelist, and guide DOM-control-only fetches call `processData()` and rebuild, and disabled fetch still parses and rebuilds before returning unchanged data. |
| `tests/runtime/main-search-refinement-card-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_MAIN_SEARCH_REFINEMENT_CARD_CURRENT_BEHAVIOR_2026-05-24.md` with real Main mobile search refinement proof from `tests/runtime/fixtures/captures/main-search-refinement-card-renderer.json`: the escaped `strange_ytInitialData.json` source has 21 `searchRefinementCardRenderer` tokens, the reduced album card carries query, playlist endpoint, and byline channel identity, but `searchRefinementCardRenderer` is not first-class Main search JSON filter authority; blocklist keyword/channel rules, whitelist match, and whitelist nonmatch preserve the row while supported watch-card siblings can be removed, and search fetch no-work still parses/rebuilds with harvest-only, processData, or disabled pass-through depending on mode. |
| `tests/runtime/main-home-rich-grid-mix-video-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_MAIN_HOME_RICH_GRID_MIX_VIDEO_CURRENT_BEHAVIOR_2026-05-24.md` with real Main desktop home proof from `tests/runtime/fixtures/captures/main-home-rich-lockup-mix-renderer.json` and `tests/runtime/fixtures/captures/main-home-rich-video-renderer.json`: `logs.json` has rich-grid Mix and video rows, Mix display metadata is not creator channel identity, the home video filters by title/channel and queues channel/video map side effects, sibling whitelist/blocklist behavior separates Mix and video authority, and home browse fetch no-work still parses/rebuilds with harvest-only, processData, or disabled pass-through depending on mode. |
| `tests/runtime/main-collab-resolved-search-card-dialog-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_MAIN_COLLAB_RESOLVED_SEARCH_CARD_DIALOG_CURRENT_BEHAVIOR_2026-05-24.md` with real Main search collaboration DOM proof from `tests/runtime/fixtures/captures/main-collab-resolved-search-card-dialog.html`: `collab.html` is an already-mutated DOM capture with one resolved four-channel collaborator roster, a pending Google DeepMind block marker, avatar-stack markup, a native action menu, and a dialog roster carrying four `/channel/UC...` links; the slice contrasts this resolved form with the earlier blank-ID homepage avatar-stack fixture and keeps collaborator DOM evidence gated before whitelist/blocklist optimization. |
| `tests/runtime/ytm-logs-playlist-bottom-sheet-stale-identity-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_YTM_LOGS_PLAYLIST_BOTTOM_SHEET_STALE_IDENTITY_CURRENT_BEHAVIOR_2026-05-24.md` with raw `YTM-LOGS.txt` proof from `tests/runtime/fixtures/captures/ytm-logs-playlist-bottom-sheet-stale-identity.html`: the reduced YTM playlist card shows visible owner `@KillTony`, while the observed injected bottom-sheet item carries `UCWFKCr40YwOZQx8FHU_ZqqQ` and label `@JerryRigEverything`; this is stale menu identity evidence and keeps YTM menu blocking gated before optimization. |
| `tests/runtime/main-watch-tmp-playlist-collab-dialog-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_MAIN_WATCH_TMP_PLAYLIST_COLLAB_DIALOG_CURRENT_BEHAVIOR_2026-05-24.md` with raw `tmp.json` proof from `tests/runtime/fixtures/captures/main-watch-tmp-playlist-collab-dialog.json`: the mixed capture has a later get-watch array with a selected watch Mix playlist collaborator row where `UCGnjeahCJW1AF34HBmQTJ-Q` / `/@shakiraVEVO` is harvested from a title command, but current blocklist/whitelist filtering uses renderer-context collaborator ID `UCYLNGLIzMhRTi6ZOLjAPSmw`; this keeps parsed collaborator identity reconciliation gated before JSON-first playlist collaborator optimization. |
| `tests/runtime/playlist-panel-header-mix-creator-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_PLAYLIST_PANEL_HEADER_MIX_CREATOR_CURRENT_BEHAVIOR_2026-05-23.md` with real desktop `playlist.html` Mix header DOM proof from `tests/runtime/fixtures/captures/playlist-panel-header-mix-dom.html`: the header exists and says YouTube makes the Mix, but it is not creator channel identity proof, `playlist-selected-row.html` remains display-only byline proof, and `playlist.json` player metadata is current-video metadata rather than playlist header authority; a real playlist creator fixture is still required. |
| `tests/runtime/playlist-json-player-metadata-boundary-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_PLAYLIST_JSON_PLAYER_METADATA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md` with real `playlist.json` mixed-fragment proof from `tests/runtime/fixtures/captures/playlist-json-player-metadata.json`: fragment 0 is a generated Mix `compactRadioRenderer`, fragment 1 is current-video/player metadata for `Pkh8UtuejGw`/`ShawnMendesVEVO`, and that player fragment is current-video metadata, not playlist creator authority and not creator channel identity proof for the playlist; the playlist creator fixture remains required. |
| `tests/runtime/main-watch-autoplay-video-endpoint-current-behavior.test.mjs` | Pins real Main watch autoplay endpoint proof from `get_watch?prettyPrint=false.json`: the raw capture has `autoplayVideo`/`nextButtonVideo` endpoint objects and no `compactAutoplayRenderer`, and the endpoint objects survive after the matching supported playlist row is removed in blocklist and whitelist nonmatch modes. |
| `tests/runtime/main-upnext-feed-watchpage-lockup-continuation-current-behavior.test.mjs` | Pins real Main watch late continuation proof from `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json`: the raw capture is prose plus balanced JSON fragments, fragment index 1 appends `lockupViewModel` rows into `watch-next-feed`, supported video lockups filter by title/channel, Mix playlist metadata is not creator identity, whitelist mode removes unresolved Mix rows, and the parsed fragment has no compact-autoplay, autoplay endpoint, end-screen, or playlist-panel keys. |
| `tests/runtime/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation-current-behavior.test.mjs` | Pins real Main watch claim-prefaced continuation proof from `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`: the raw capture starts with prose claims and then one parsed `watch-next-feed` JSON fragment, primary decorated-avatar video lockups filter by title/channel in blocklist and whitelist modes, map side effects remain queued, and the parsed fragment has no compact-autoplay, autoplay endpoint, end-screen, playlist-panel, or collaborator roster keys. |
| `tests/runtime/main-upnext-feed-watchpage3-autoplay-previous-end-screen-current-behavior.test.mjs` | Pins real Main watch embedded `ytInitialData` proof from `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json`: the raw capture has `autoplayVideo`/`nextButtonVideo`/`previousButtonVideo` endpoint objects, player-overlay end-screen rows, no `compactAutoplayRenderer`, and endpoint watch controls survive after matching supported playlist or end-screen rows are removed in blocklist and whitelist modes. |
| `tests/runtime/main-watch-html-embedded-playlist-endscreen-json-current-behavior.test.mjs` | Pins real Main watch HTML embedded `ytInitialData[1]` proof from `YT_MAIN_WATCH.html`: the reduced fixture carries playlist-panel and player-overlay end-screen JSON rows, no-rule preserves rows while harvesting maps, blocklist channel/keyword modes remove only matching supported rows, whitelist mode preserves matching rows and removes unsupported siblings, and the rendered player DOM wall remains unproven. |
| `tests/runtime/main-watch-initial-lockup-shorts-json-current-behavior.test.mjs` | Pins real Main watch initial JSON proof from `YT_MAIN.json`: the raw capture is mixed text with initial watch JSON and a later player JSON fragment, fragment 0 has watch rail `lockupViewModel` rows plus a Shorts remix shelf, no-rule preserves rows and queues map side effects, blocklist/whitelist filter supported watch lockups, `hideAllShorts` removes Shorts JSON, and the file is not Main browse/search completion proof. |
| `tests/runtime/main-watch-initial-shorts-owner-absent-boundary-current-behavior.test.mjs` | Main watch initial Shorts owner-absent boundary addendum: pins the same real `YT_MAIN.json` watch-initial Shorts remix shelf as owner-absent proof. The isolated `shortsLockupViewModel` rows carry video/title signals but no browse endpoint, canonical URL, below-thumbnail metadata, decorated avatar, byline, owner, channel id, or channel name fields; channel blocklist preserves the rows and emits no map side effects, `hideAllShorts` and keyword rules still work, and channel whitelist fails closed while keyword whitelist can allow a matching row. |
| `tests/runtime/main-watch-player-fragment-metadata-current-behavior.test.mjs` | Pins real Main watch player metadata proof from fragment 1 of `YT_MAIN.json`: the `/player` payload carries `videoDetails`, `playerMicroformatRenderer`, cards, and endscreen element siblings; no-rule and disabled modes harvest owner/meta maps before pass-through; blocklist/whitelist rules do not remove metadata-only rows; and no direct recommendation renderer authority exists for this fragment. |
| `tests/runtime/playlist-player-endscreen-dom-classification-current-behavior.test.mjs` | Pins `docs/audit/FILTERTUBE_PLAYLIST_PLAYER_ENDSCREEN_DOM_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md` with real desktop playlist/player end-screen DOM proof from `playlist.html`: rendered player end-screen DOM exists and is reduced into `tests/runtime/fixtures/captures/playlist-player-endscreen-dom.html`, but the source is an already-mutated playlist capture and not clean Main watch DOM wall proof. |
| `tests/runtime/main-next-reload-modern-comments-current-behavior.test.mjs` | Pins real Main `/youtubei/v1/next` reload-comment proof from `YT_MAIN_NEXT.json`: the raw capture is direct JSON with `reloadContinuationItemsCommand` comment slots, no parsed watch/autoplay renderer keys, modern `commentThreadRenderer` rows removed by `hideAllComments`, and header/body continuation siblings preserved. |
| `tests/runtime/ytm-watch-playlist-panel-json-parity-current-behavior.test.mjs` | Pins real YTM watch playlist-panel JSON proof from `YTM.json`: three parsed `playlistPanelVideoRenderer` fragments filter in blocklist and whitelist modes, but the JSON fragments lack the selected/current row proved by the rendered YTM watch/player DOM fixture. |
| `tests/runtime/cross-feature-authority-matrix-current-behavior.test.mjs` | Pins the cross-feature authority matrix, feature-row coverage, cited source files, and source-backed risky-path tokens. |
| `tests/runtime/capture-fixture-traceability-current-behavior.test.mjs` | Pins capture-to-fixture traceability: ignored corpus counts, committed extracted fragments, JSON provenance sources, unextracted high-priority raw captures, and future fixture gate names. |
| `tests/runtime/p0-capture-fixture-traceability-current-behavior.test.mjs` | Starts converting the P0 capture fixture traceability family into runnable proof: raw corpus breadth versus reduced fixtures, unsatisfied Main watch/end-screen DOM, compact autoplay, Main search/guide no-rule real captures, append comment continuation entity-payload classification, reel owner identity, Kids public web drift, partial YTM DOM video-card and post-card guardrails, collaboration homepage avatar-stack proof, post insertion boundaries, playlist JSON creator identity, and missing future traceability authority. |
| `tests/runtime/css-style-hide-authority-current-behavior.test.mjs` | Pins CSS/style hide authority: manifests have no content CSS, build still packages `css/`, legacy CSS uses the old default-hide reveal model, runtime hide helper uses `.filtertube-hidden`, and dynamic style injectors own broad content-control CSS. |
| `tests/runtime/dom-hide-side-effect-current-behavior.test.mjs` | Pins the current DOM hide side-effect surface: shared hide helper, direct display writes, broad members-only/current-watch paths, and recycled-node cleanup. |
| `tests/runtime/dom-broad-hide-boundary-current-behavior.test.mjs` | Pins the current broad DOM false-hide boundary surface: missing central broad-hide authority, members-only watch-shell/shelf targets, playlist lockup parent hides, selected playlist-row pause/click/hide behavior, container collapse, and stale specialized marker gaps. |
| `tests/runtime/hide-restore-authority-current-behavior.test.mjs` | Pins hide/restore authority: shared helper, generated CSS, direct pending/optimistic writers, stale cleanup, marker-specific fallback restore, recycled-card cleanup, and future `hideRestoreAuthority` gate. |
| `tests/runtime/hide-decision-pipeline-current-behavior.test.mjs` | Pins the current hide-decision pipeline across background compile aliases/maps, seed JSON skip/mutate gates, JSON renderer removal, DOM fallback active predicates, `shouldHideContent()`, target selection, pending markers, background handle resolution, shared visual side effects, and future `hideDecisionAuthority` gates. |
| `tests/runtime/dom-route-scope-current-behavior.test.mjs` | Pins DOM route/surface selector scope for global card selectors, Kids/recycled marker guards, DOM fallback global scans, quick-block route gates, fallback/menu split gates, playlist/Mix identity safety, and watch/playlist broad false-hide selectors. |
| `tests/runtime/route-surface-effect-authority-current-behavior.test.mjs` | Pins route/surface effect authority gaps across YouTubei endpoints, Main home/search, watch/current video, Shorts, playlist/Mix, comments/posts, Kids, YTM/mobile, and native overlays: effects such as parse, mutate, scan, hide, restore, menu, quick-block, fetch, pause, click, and count still need one route/surface decision record. |
| `tests/runtime/dom-selector-instance-register-current-behavior.test.mjs` | Pins every current tracked non-vendor selector API site, static selector literal count, dynamic selector expression count, unique static selector literals, source-family totals, hot-file totals, dynamic selector families, evidence-boundary docs, and future selector instance fixture gates. |
| `tests/runtime/dom-target-source-current-behavior.test.mjs` | Pins current DOM target/source contracts for quick-block, native menu targeting, fallback menu scan scope, playlist selected rows, and clicked hide targets. |
| `tests/runtime/direct-watch-card-authority-current-behavior.test.mjs` | Pins direct watch-card authority: nested `universalWatchCardRenderer` rich-header filtering works, direct rich-header/hero/RHS panel renderers pass through matching rules, and documented watch-card subrenderers are not direct `FILTER_RULES` entries today. |
| `tests/runtime/main-search-universal-watch-card-current-behavior.test.mjs` | Pins one real Main search `universalWatchCardRenderer` fixture from `strange_ytInitialData.json`: wrapper title/channel filtering works in blocklist and whitelist modes, the raw escaped `ytInitialData` container is not direct JSON, and direct watch-card child renderers plus the hero-video nested path remain separate gaps. |
| `tests/runtime/main-search-direct-watch-card-subrenderer-current-behavior.test.mjs` | Pins one real Main search direct watch-card subrenderer gap fixture from `strange_ytInitialData.json`: real nested rich-header and hero child objects pass through when presented as direct top-level renderer keys, while the same child values filter under the supported universal wrapper; the raw source has no direct RHS panel token. |
| `tests/runtime/main-search-compact-channel-current-behavior.test.mjs` | Pins one real Main search `compactChannelRenderer` fixture from `strange_ytInitialData.json`: channel-card rows pass through blocklist keyword/channel and whitelist non-match modes while still queuing one channel-map side effect, and a matching rule removes a supported watch-card sibling but leaves the compact channel row visible. |
| `tests/runtime/doms-html-mutated-main-dom-classification-current-behavior.test.mjs` | Pins `DOMs.html` as a mixed already-mutated Main DOM capture, not clean post/community proof: it contains home/search/watch/playlist headings and FilterTube quick-block/fallback-menu markers, lacks post/header/action-menu/permalink tokens, and now has a reduced mixed-Main DOM fixture. |
| `tests/runtime/watchpage-embedded-post-renderer-current-behavior.test.mjs` | Pins `watchpage.json` as Markdown plus embedded `var ytInitialData`, classifies its `FEwhat_to_watch` `postRenderer` rows as browse/feed post proof rather than watch-next proof, and proves modern `postRenderer` rows pass through blocklist and whitelist modes while queuing channel-map side effects. |
| `tests/runtime/kids-latest-json-owner-extension-fixture-boundary-current-behavior.test.mjs` | Pins one `yt_kids_latest.json` Kids public-web fixture: two adjacent `compactVideoRenderer` siblings carry `kidsVideoOwnerExtension` owner IDs, blocklist removes a matching owner while preserving a sibling, whitelist preserves a matching owner, and map side effects remain queued. |
| `tests/runtime/kids-browse-malformed-fragment-boundary-current-behavior.test.mjs` | Pins one malformed `ytkids_browse?alt=json.json` fixture: the raw capture is not one valid JSON document, a parseable browse fragment carries compact videos plus `kidsSlimOwnerRenderer` owner rail entries, compact videos filter by owner, and owner rail entries remain visible. |
| `tests/runtime/empty-install-performance-current-behavior.test.mjs` | Pins the empty-install/no-rule performance surface: endpoint work with empty settings, harvest-only fast-path cost, disabled fetch parse/rewrite cost, DOM fallback lifecycle, quick-block lifecycle, fallback menu lifecycle, and blank enabled filter predicates. |
| `tests/runtime/endpoint-decision-matrix-current-behavior.test.mjs` | Pins the current YouTubei endpoint decision matrix, endpoint list parity, substring URL authority, eager fetch JSON work, and future endpoint-policy decision types. |
| `tests/runtime/engagement-budget-current-behavior.test.mjs` | Pins the current recommendation-risk side-effect budget surface: no shared budget authority, no-network normal card prefetch baseline, whitelist pending prefetch, direct metadata/identity fetches, current-watch and playlist pause/click work, subscription import automation, and hide/media-pause coupling. |
| `tests/runtime/engagement-side-effect-current-behavior.test.mjs` | Pins YouTube-observable side effects: prefetch budgets, no-network card identity prefetch, whitelist pending identity work, direct watch/shorts fetch fallbacks, current-watch pause/click behavior, playlist skip clicks, and subscription import scroll/fetch automation. |
| `tests/runtime/filter-engine-current-behavior.test.mjs` | Runs current-behavior JSON engine fixtures with Node's built-in test runner. |
| `tests/runtime/injector-settings-capability-current-behavior.test.mjs` | Pins injector/settings capability authority: revisionless settings relay, duplicate seed apply paths, seed snapshot reprocessing, revisionless queues, main-world lookup requests, subscription import side effects, and script injection ownership. |
| `tests/runtime/import-export-nanah-authority-current-behavior.test.mjs` | Pins import/export/Nanah authority: direct V4 writes, read-path profile writes, broad import mutation surface, swallowed V4 sync failures, encrypted target-profile drift, scoped Nanah sanitizer/refresh gaps, envelope validation gaps, preview baseline, trusted-state restore, and invalidation key drift. |
| `tests/runtime/ignored-root-evidence-corpus-current-behavior.test.mjs` | Pins the ignored root evidence corpus documented in `docs/audit/FILTERTUBE_IGNORED_ROOT_EVIDENCE_CORPUS_CURRENT_BEHAVIOR_2026-05-19.md`: 46 ignored evidence entries, 45 present local paths, extension-type counts, ignored/untracked status, no runtime/release source references, and reduced fixture separation. |
| `tests/runtime/implementation-readiness-gate-current-behavior.test.mjs` | Pins the implementation-readiness gate: broad behavior changes remain blocked until compiled-rule, endpoint-policy, message-trust, lifecycle, renderer, selector, settings-mutation, learned-identity, release-claim, and simultaneous allow/block fixture gates exist. |
| `tests/runtime/lifecycle-owner-matrix-current-behavior.test.mjs` | Pins owner-level lifecycle and side-effect rows across seed interception, bridge hydration, fallback menu, quick block, DOM fallback, UI/background, state/import, vendor, generated, website, and quarantined legacy owners. |
| `tests/runtime/lifecycle-instance-register-current-behavior.test.mjs` | Pins every current tracked observer/listener/timer/frame lifecycle instance as a source-derived register with file, line, primitive family, source family, owner class, hot-file totals, missing shared registry proof, and future lifecycle fixture gates. |
| `tests/runtime/lifecycle-source-current-behavior.test.mjs` | Pins current lifecycle primitive counts and key source-risk patterns for page-resident scripts. |
| `tests/runtime/lifecycle-effect-budget-current-behavior.test.mjs` | Pins lifecycle source counts versus effect-budget proof: seed, content-bridge prefetch, DOM fallback, fallback menu, quick block, normal menu/Kids passive listener, playlist guards, and collaborator dialog each need owner/effect/pause/no-rule budget authority before lifecycle optimization; it also now proves native/fullscreen quieting is local to some content-bridge scans and not a shared non-player pause authority. |
| `tests/runtime/manifest-permission-authority-current-behavior.test.mjs` | Pins manifest and permission authority across default/Chrome/Firefox/Opera packages: permissions, host scope, content-script worlds, Firefox fallback injection, Opera world ambiguity, web-accessible resources, NoCookie host mismatch, and build-time manifest guard limits. |
| `tests/runtime/p0-manifest-permission-current-behavior.test.mjs` | Starts converting the P0 manifest/permission fixture family into runnable proof: default/Chrome MAIN-world seed startup is source-local, Firefox fallback injection has no seed-ready report, Opera world behavior is not proven, YouTube NoCookie is host-permitted but not runtime-matched, web-accessible resources are only source-local allowlisted, build does not reject permission/resource/world drift, and permissions are not mapped to trusted sender classes. |
| `tests/runtime/startup-injection-readiness-current-behavior.test.mjs` | Pins startup injection readiness current behavior: isolated bridge idempotence, Firefox fallback script append timing, timer-based settings handoff, content bridge initialize/DOM fallback delays, split injector bridge/full-engine ready messages, and duplicate ready repost behavior. |
| `tests/runtime/seed-initial-global-hook-current-behavior.test.mjs` | Pins seed initial-global hook current behavior: existing `ytInitialData` / `ytInitialPlayerResponse` clone/process paths, captured getter ownership, eager debug payload-size stringify, missing-settings queue retention, replay CPU work after original pass-through, queued global reassignment through setters, and raw snapshot reprocess on every settings update. |
| `tests/runtime/settings-refresh-fanout-current-behavior.test.mjs` | Pins settings refresh fanout current behavior: runtime refresh broadcasts, UI-pushed settings, storage changes, background settings pulls, same-window refresh messages, startup DOM fallback initialization, mutation fallback scheduling, seed retry delivery, and background tab broadcasts can all wake settings and/or forced DOM fallback without one shared revision/no-op authority. |
| `tests/runtime/compiled-cache-authority-current-behavior.test.mjs` | Pins compiled cache authority current behavior: `compiledSettingsCache` is surface-only, cache can return before storage reads, message handling has a second cache gate, compiler and message handler both assign cache, `FilterTube_ApplySettings` can overwrite cache with caller settings, learned map writers patch cached objects, and storage invalidation recompiles without revision/source reports. |
| `tests/runtime/compiler-parity-current-behavior.test.mjs` | Pins compiler parity current behavior: shared UI compilation emits a smaller payload, background compilation derives profile/list-mode/whitelist meaning, `syncKidsToMain` merges lists, learned identity maps are background-only, shared/background read paths can write profiles, StateManager overlays profile state after shared load, and shared-compiled payloads can flow into the background cache path. |
| `tests/runtime/message-sender-class-matrix-current-behavior.test.mjs` | Pins the complete current message receiver inventory: background actions, secondary 3-dot messages, content-bridge page messages, injector main-world branches, subscription bridge runtime actions, uneven sender gates, and ignored capture-corpus evidence boundaries. |
| `tests/runtime/message-side-effect-register-current-behavior.test.mjs` | Pins message-driven side-effect classes across background and page-world receivers: tab opens, script injection, network fetches, storage writes, compiled cache broadcasts, DOM reruns, learned identity, stats mutation, backup scheduling, rule mutation, and future negative/provenance fixture gates. |
| `tests/runtime/message-trust-hardening-gap-current-behavior.test.mjs` | Pins the combined background/page-message trust hardening gap: sender classes, unguarded background actions, learned-map cache updates, same-window spoofable page messages, collaborator ownership gaps, and required future negative fixtures. |
| `tests/runtime/network-authority-current-behavior.test.mjs` | Pins network/fetch authority: direct fetch/XHR/open counts, extension-resource release notes, credentialed YouTube identity fallbacks, subscription import fetches, seed interception, website-only remotes, and future `networkAuthority` gates. |
| `tests/runtime/native-runtime-sync-authority-current-behavior.test.mjs` | Pins extension-to-native sync authority: public wrapper delegation, app manifest ownership, byte-identical direct copies, generated Android/iOS runtime outputs, iOS Kids intentional divergence, broad mirror drift, app build freshness asymmetry, and raw-capture exclusion. |
| `tests/runtime/objective-coverage-ledger-current-behavior.test.mjs` | Pins the broad audit objective ledger: every original objective term is mapped to current proof artifacts, partial status, missing proof, raw-capture evidence boundaries, and the rule that completion is not proven. |
| `tests/runtime/p0-fixture-gate-register-current-behavior.test.mjs` | Pins the P0 fixture gate register: 217 named P0 fixture obligations across 23 families, five-way review convergence, high-risk clusters, and the shared blocked state with the readiness gate and objective ledger. |
| `tests/runtime/p0-family-proof-coverage-current-behavior.test.mjs` | Pins the P0 family proof coverage index: every one of the 23 readiness-gate P0 families has at least one current-behavior doc/test pair, supplemental P0 slices remain separate blockers, and no family is future-proof or implementation-ready. |
| `tests/runtime/p0-obligation-status-ledger-current-behavior.test.mjs` | Pins the P0 obligation status ledger: all 217 named P0 obligations remain future-proof-missing, 0 obligations are implementation-ready, and family current-behavior proof cannot be treated as permission to change behavior. |
| `tests/runtime/p0-compiled-rule-state-current-behavior.test.mjs` | Pins the P0 compiled active-state split: missing `compiledRuleState`, strict seed/DOM content-filter booleans and selected-category gates without one validity/route report, quick-block lifecycle outside action gate, fallback-menu action gate drift, background raw predicate pass-through, stale `blocked*` alias precedence over canonical rows, and split dependency-key authority. |
| `tests/runtime/stabilization-fix-order-current-behavior.test.mjs` | Pins the stabilization fix order: audit-only status, split-authority root cause, five-way review convergence, high-risk clusters, proof artifacts, ordered authority-first fix lanes, and blocked behavior-change boundaries. |
| `tests/runtime/subagent-review-convergence-current-behavior.test.mjs` | Pins the five subagent review convergence as source-backed audit evidence: no-work endpoint body cost, broad DOM false-hide targets, eager quick-block/fallback-menu lifecycle work, JSON renderer gaps, engagement side-effect budgets, mutation/security splits, and release/static proof gates. |
| `tests/runtime/p0-external-navigation-current-behavior.test.mjs` | Starts converting the P0 external-navigation fixture family into runnable proof: runtime open-surface counts, caller-supplied What’s New URL gap, release-banner fallbacks, popup internal route opens, Ko-fi support link, subscription-import YouTube tab, extension target-blank rel drift, website external-link policy drift, missing URL-class manifest, and raw-capture URL exclusion. |
| `tests/runtime/p0-endpoint-policy-current-behavior.test.mjs` | Starts converting the P0 endpoint-policy fixture family into runnable proof: search, mobile browse, watch next, player, and guide endpoints still do parse/stringify, harvest, `processData`, or player response replacement work before the future policy exists. |
| `tests/runtime/p0-hide-restore-current-behavior.test.mjs` | Starts converting the P0 hide/restore authority family into runnable proof: shared helper signature gaps, direct display writer/restorer gaps, disabled cleanup marker gaps, CSS route-owner gaps, members-only broad/local restore behavior, open-app shell cleanup classification, pending whitelist identity-outcome gaps, recycled-card cleanup invariants, shelf-title local restore, current-watch playback side effects, no-rule stale inline display gaps, and missing writer registry. |
| `tests/runtime/p0-selector-authority-current-behavior.test.mjs` | Starts converting the P0 selector authority family into runnable proof: global card selector surface mixing, DOM fallback no-rule zero-scan partiality, quick-block disabled selector/lifecycle proof gaps, fallback-menu primary action gate drift, broad watch/player selectors, members-only watch-shell targets, selected playlist row preservation gap, Kids/YTM selector gate gaps, legacy layout quarantine, inventory proof status, and raw-capture DOM fixture boundaries. |
| `tests/runtime/p0-keyword-match-current-behavior.test.mjs` | Starts converting the P0 keyword match authority family into runnable proof: non-exact substring policy, JSON/DOM exact-boundary split, DOM normalized fallback both-boundary gap, serialized comment keyword reconstruction gap, global keyword comment reach, channel-derived metadata/comments drift, Kids-to-Main source/action gap, whitelist fail-closed keyword miss, and legacy compiled exactness partial migration. |
| `tests/runtime/p0-content-category-current-behavior.test.mjs` | Starts converting the P0 content/category predicate family into runnable proof: enabled-empty category activation drift, blank upload-date activation drift, zero-duration longer false-hide behavior, stale threshold save behavior, route-scope gaps for home/watch booleans, category storage refresh split, Main/Kids source-local independence, broad boolean route-scope gaps, and metadata-fetch pending reason gaps. |
| `tests/runtime/p0-lifecycle-current-behavior.test.mjs` | Starts converting the P0 lifecycle fixture family into runnable proof: disabled quick-block, disabled fallback menu, native overlay, fullscreen, and navigation teardown still lack one shared lifecycle registry and zero-work counter contract; now also pins source-level lifecycle budgets for quick-block and fallback-menu disabled states. |
| `tests/runtime/p0-network-authority-current-behavior.test.mjs` | Starts converting the P0 network/fetch fixture family into runnable proof: fetch/XHR/open counts, extension-resource release notes, YouTube identity fetch reason gaps, channel-detail sender gaps, subscription import authority, seed no-rule parse/stringify, credentials policy, website-only remotes, external open allowlisting, and raw-capture exclusion. |
| `tests/runtime/p0-native-runtime-sync-current-behavior.test.mjs` | Starts converting the P0 native runtime sync family into runnable proof: public wrapper delegation, manifest-owned source/destination existence, byte-identical direct copies, generated runtime output boundaries, iOS Kids intentional divergence, extension-source mirror drift, Android/iOS freshness asymmetry, raw-capture exclusion, and missing future sync authority. |
| `tests/runtime/p0-stats-time-saved-current-behavior.test.mjs` | Starts converting the P0 stats/time-saved fixture family into runnable proof: untrusted legacy background metric writes, negative/non-finite saved-time gaps, missing structured hide-decision ids, DOM-attribute restore accounting, `skipStats` media coupling, surface/legacy drift, dashboard refresh drift, unbatched storage writes, and no-rule hide count gaps. |
| `tests/runtime/p0-dom-renderer-current-behavior.test.mjs` | Starts converting the P0 DOM/renderer boundary into runnable proof: global selector target authority, split post menu targeting, fallback playlist menu gates, selected playlist row false-hide risk, direct watch-card/search-refinement renderer gaps, legacy post/comment baselines, capture-backed compact playlist/end-screen behavior, and raw-capture fixture boundaries. |
| `tests/runtime/p0-release-package-current-behavior.test.mjs` | Starts converting the P0 release package parity family into runnable proof: broad package roots, top-level docs, quarantined CSS package drift, missing package manifest, generated shell freshness gaps, README mutation during packaging, browser manifest validation gaps, public-before-upload GitHub release creation, mobile checksum-without-claim state, and raw-capture exclusion. |
| `tests/runtime/p0-renderer-authority-current-behavior.test.mjs` | Starts converting the P0 renderer authority family into runnable proof: compact playlist blocklist/whitelist gaps, show-sheet collaborator blocklist leak and whitelist false-hide, direct watch-card pass-through, Shorts owner identity drift, Mix avatar-stack false hides, shelf-title container false hides, duplicate/grid search gaps, and inventory wording that is not runtime authority. |
| `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Starts converting P0 message/mutation/security/rule-mutation fixture families into runnable proof: uneven sender gates, caller settings apply, script/bridge injection, arbitrary What's New URL, channel detail fetch, page spoof refresh/map/collab messages, list-mode merge/clear, secondary `addFilteredChannel` listType gap, and Nanah scoped apply authority gap. |
| `tests/runtime/p0-mutation-current-behavior.test.mjs` | Starts converting the generic P0 mutation/revision family into runnable proof: list-mode copy-false still moves/clears lists, caller `ApplySettings` payloads become compiled cache truth, concurrent StateManager saves can be dropped, and V3-to-V4 read migration does not preserve legacy modes or whitelist rows. |
| `tests/runtime/p0-settings-mutation-current-behavior.test.mjs` | Starts converting the P0 settings/mutation security slice into runnable proof: locked-profile gaps for list mode, whitelist add, and transfer actions; partial lock enforcement across sibling rule mutations; Kids block/whitelist mutation-report gaps; list-mode transfer report gaps; encrypted import target-profile drift; Nanah envelope validation gaps; and Nanah scoped apply revision/lock/report gaps. |
| `tests/runtime/p0-rule-mutation-current-behavior.test.mjs` | Starts converting the P0 rule-mutation authority family into runnable proof: StateManager keyword/channel writes, background persistent and secondary channel adds, Kids block/whitelist, list-mode transfer, managed child edits, import, Nanah scoped apply, learned identity writes, content-script channel adds, and page-world identity updates all lack one shared mutation authority report. |
| `tests/runtime/p0-learned-identity-current-behavior.test.mjs` | Starts converting the P0 learned-identity authority family into runnable proof: weak channel/video map validation, stronger engine-source guards than receivers, pending map compile, map-key invalidation drift, page video-map persistence before DOM ownership proof, custom URL direct writes, metadata-triggered DOM reruns, collaborator pending-ownership gaps, channel map/name fallback matching, avatar-stack identity risk, and missing future authority token. |
| `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Starts converting the P0 storage/cache key authority family into runnable proof: compiler/invalidation drift, content bridge map-only refresh policy, StateManager reload key drift, shared settings classification gaps, learned video map cache/DOM split policy, `statsBySurface` dashboard reload drift, read-path V4 writes, import/Nanah target-profile revision gaps, unknown-key no-op gap, and ignored raw-capture exclusion. |
| `tests/runtime/p0-watch-player-current-behavior.test.mjs` | Starts converting the P0 watch/player control authority family into runnable proof: background invalidation drift, content refresh schema drift, `/next` no-rule rewrite gap, `/player` metadata-only gap, comment continuation shape gap, comment scaffold authority gap, sidebar route-scope gap, playlist panel identity-safety gap, end-screen JSON/DOM split, broad movie-player end-card selectors, whitelist watch scaffolding partial guards, and fullscreen non-player pause gap. |
| `tests/runtime/p0-no-work-current-behavior.test.mjs` | Starts converting the P0 no-work fixture family into runnable proof: desktop empty blocklist, mobile empty blocklist, watch player empty blocklist, and disabled mode all still do some response parse/stringify, harvest, or `processData` work today. |
| `tests/runtime/external-navigation-authority-current-behavior.test.mjs` | Pins external navigation/link authority: privileged tab opens, release-banner fallback navigation, popup internal tab opens, dashboard support/import opens, extension target-blank links, website public links, and future `externalNavigationAuthority` gates. |
| `tests/runtime/fallback-menu-action-gate-current-behavior.test.mjs` | Pins fallback menu action-gate drift: primary dropdown rows honor `listMode`/`showBlockMenuItem`, while fallback scanner, popover creation, `performBlock()`, direct rule mutation, optimistic row hide, and forced refilter paths do not share one local menu action authority. |
| `tests/runtime/json-dom-inventory-truth-current-behavior.test.mjs` | Pins the JSON/DOM inventory truth boundary: docs and ignored captures are discovery evidence, while direct runtime coverage must be fixture-proven. |
| `tests/runtime/json-path-authority-current-behavior.test.mjs` | Pins JSON path documentation versus runtime authority: missing central `jsonPathAuthority`, bracket-index docs versus dot-index `getByPath()` runtime syntax, docs not loaded by runtime/build source, hand-authored `FILTER_RULES` with no per-path provenance, high-risk documented renderer direct-rule gaps, and show-sheet collaborator path drift. |
| `tests/runtime/json-runtime-coverage-gap-current-behavior.test.mjs` | Pins documented JSON fields versus actual runtime consumption: Shorts owner paths, reel owner id/handle/logo, showSheet collaborator rosters, compact playlist creator identity, Mix playlist identity, direct watch-card renderers, shared posts, and comment metadata remain split across direct-rule, harvest-only, joined-by-video-id, documented-gap, and unsupported/direct-gap states with no `jsonRuntimeCoverageAuthority` runtime token yet. |
| `tests/runtime/keyword-match-authority-current-behavior.test.mjs` | Pins keyword match authority: exact/substring compile policy, JSON regex behavior, DOM normalized boundary drift, comment keyword reconstruction gap, channel-derived metadata drift, and missing future `keywordMatchAuthority`. |
| `tests/runtime/page-message-trust-current-behavior.test.mjs` | Pins current same-window page-message trust boundaries, state-changing message types, pending-request coverage, and wildcard source-label flows. |
| `tests/runtime/page-runtime-lifecycle-authority-current-behavior.test.mjs` | Pins page-resident lifecycle owners for seed prototype patches, prefetch/hydration observers, fallback menu scans, quick-block viewport work, normal/Kids menu observers, DOM fallback guards, and collaborator dialog listeners. |
| `tests/runtime/prompt-onboarding-authority-current-behavior.test.mjs` | Pins prompt/onboarding authority: first-run and release-note overlay owners, manifest load order, overlapping top-right placement, update-flow eligibility, ack sender gaps, What’s New tab-open URL authority, and missing prompt coordinator. |
| `tests/runtime/p0-prompt-onboarding-current-behavior.test.mjs` | Starts converting the P0 prompt/onboarding family into runnable proof: install has only source-local one-prompt behavior, update can make release and refresh prompts eligible, replay lacks a named owner, prompt acknowledgements are not sender-classed, What’s New opens caller URL, mobile viewport fit is only partial, current manifest version release notes exist, and no prompt coordinator exists. |
| `tests/runtime/public-release-claim-boundary-current-behavior.test.mjs` | Pins public release/download claim boundaries: browser store claims are available, Android direct APK points to latest GitHub release before signed APK/checksum/fingerprint authority exists, iOS remains status-only without IPA distribution, TV remains a separate future package, build staging lacks a public claim manifest, and release notes are staged ahead of package/manifests. |
| `tests/runtime/raw-capture-release-boundary-current-behavior.test.mjs` | Pins the raw capture release boundary: ignored root captures remain untracked evidence, browser packages stage explicit roots and zip staged output, active release/public source surfaces do not reference raw capture filenames, native sync excludes captures, committed capture fixtures are reduced fragments, and no `rawCaptureReleaseBoundary` product authority exists yet. |
| `tests/runtime/root-evidence-source-taxonomy-current-behavior.test.mjs` | Pins the root evidence/source taxonomy: root JSON/HTML/TXT-like scans are mixed views, tracked manifests/package JSON are source rather than ignored evidence, the capture block and ignored corpus count different things, reduced fixtures remain separate, and no `rootEvidenceSourceTaxonomy` runtime authority exists yet. |
| `tests/runtime/profile-viewing-space-authority-current-behavior.test.mjs` | Pins profile/viewing-space authority: UI-only allowed viewing-space flags, active profile switching, Main/Kids compile surface selection, surface-keyed cache, child lock/admin gates, managed-child edit target writes, and split `syncKidsToMain` refresh. |
| `tests/runtime/release-package-parity-current-behavior.test.mjs` | Pins release-package parity: copied package roots, packaged quarantined CSS, browser manifest write policy, generated shell and README build mutations, missing package manifest, public-before-upload GitHub release flow, and mobile artifact checksum mechanics. |
| `tests/runtime/renderer-authority-gap-current-behavior.test.mjs` | Pins prioritized renderer authority gaps across compact playlists, collaborator show-sheet rosters, direct watch-card parts, Shorts/Reel/lockup owner identity, broad container false hides, Mix avatar-stack false positives, duplicate grid rules, and community/search renderer pass-throughs. |
| `tests/runtime/right-rail-whitelist-observer-current-behavior.test.mjs` | Pins the watch right-rail whitelist observer ambiguity: the observer installs after DOM fallback startup and attaches to watch rail selectors, but the forced whitelist reprocess scheduler returns on `/watch`, leaving watch rail whitelist repair outside one shared watch-surface authority. |
| `tests/runtime/repo-lifecycle-primitive-coverage-current-behavior.test.mjs` | Pins repo-wide lifecycle and side-effect primitive counts across all 63 tracked JS/JSX/MJS files. |
| `tests/runtime/rule-mutation-entrypoint-authority-current-behavior.test.mjs` | Pins rule mutation entrypoint authority: UI/StateManager writers, background trusted and content-script shaped writers, managed child direct V4 writes, import/export/Nanah rule writes, learned identity/cache writes, and ignored root captures as evidence only. |
| `tests/runtime/security-pin-lock-authority-current-behavior.test.mjs` | Pins security/PIN lock authority: PBKDF2/AES-GCM primitives, background session cache, guarded session/import paths, mutation paths without shared lock checks, secondary listener rule writes, import/export PIN scope, Nanah direct profile writes, and tab UI lock gates. |
| `tests/runtime/p0-security-pin-lock-current-behavior.test.mjs` | Starts converting the P0 security/PIN lock fixture family into runnable proof: list-mode, whitelist add, whitelist transfer, secondary content-script channel add, Nanah scoped apply, encrypted import target-profile forwarding, child policy UI gates, and `syncKidsToMain` setter authority still lack one shared lock contract. |
| `tests/runtime/selector-authority-current-behavior.test.mjs` | Pins selector authority: tracked source selector API counts, page-runtime selector dominance, inventory docs as evidence maps, global mixed-surface selectors, and future `selectorAuthority` fixture gates. |
| `tests/runtime/storage-key-authority-current-behavior.test.mjs` | Pins storage/cache key authority: storage access counts, background compiler/invalidation drift, content bridge map-only refresh policy, StateManager reload key drift, shared-settings key boundary, and future `storageKeyAuthority` gates. |
| `tests/runtime/seed-network-current-behavior.test.mjs` | Runs current-behavior seed endpoint fixtures for fetch interception and processing authority. |
| `tests/runtime/visible-empty-runtime-active-current-behavior.test.mjs` | Pins the visible-empty/runtime-active boundary: Main UI rows read canonical `state.keywords`/`state.channels`, background compile now prefers canonical keywords before `blockedKeywords`, shared settings save mirrors `blockedKeywords` in blocklist mode, and `blockedChannels` remains a stale-alias risk when visible canonical channel rows are empty. |
| `tests/runtime/stale-alias-false-hide-chain-current-behavior.test.mjs` | Isolates the stale-alias false-hide chain: the keyword branch is now fixed for normal Main compilation and settings save, while the channel branch can still preserve/activate `blockedChannels` without one `visibleRuntimeRuleAuthority` report. |
| `tests/runtime/watch-endscreen-authority-current-behavior.test.mjs` | Pins watch end-screen authority: direct nested `endScreenVideoRenderer` filtering works, `compactAutoplayRenderer` remains a direct-rule gap, player overlay DOM selectors are not ordinary card/quick-block targets, and current end-screen CSS controls are broad feature toggles rather than per-card block/allow decisions. |
| `tests/runtime/settings-authority-source-current-behavior.test.mjs` | Pins current settings/mutation authority source paths for list-mode, import, sync, and compiled settings cache behavior. |
| `tests/runtime/settings-mode-coverage-matrix-current-behavior.test.mjs` | Pins the settings-mode coverage matrix: enabled/disabled, Main/Kids blocklist and whitelist, empty and non-empty list states, profile/lock modes, syncKidsToMain, menu/quick-block gates, content predicates, keyword/comment scope, route/surface modes, import/Nanah apply, and future simultaneous allow/block fixture gates. |
| `tests/runtime/stats-time-saved-authority-current-behavior.test.mjs` | Pins stats/time-saved authority: hide helper side-effect coupling, surface-aware stats storage, background raw metric writes, StateManager reload drift, dashboard read behavior, and future `statsSideEffectAuthority` gates. |
| `tests/runtime/tracked-file-audit-coverage-current-behavior.test.mjs` | Pins all 149 current `git ls-files` paths to an audit family, while keeping ignored root captures outside source authority. |
| `tests/runtime/ui-row-list-mode-authority-current-behavior.test.mjs` | Pins UI row/list-mode authority: RenderEngine row actions, StateManager mode branching, popup/tab-view mode toggles, background copy/transfer behavior, and ordinary settings save ownership. |
| `tests/runtime/unified-mutation-contract-current-behavior.test.mjs` | Pins the missing shared mutation contract across UI, background, import, Nanah, learned maps, DOM side effects, stats, broadcasts, and ignored raw capture boundaries. |

## P0 Keyword Match Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 keyword match audit documents fixture family and current blocked verdict` | pass | The P0 keyword slice is explicitly blocked for implementation and names the missing future `keywordMatchAuthority`. | Implementation gate |
| `keyword_non_exact_substring_policy_is_explicit is not centrally reported today` | pass-current-gap | Non-exact keywords still compile and run as substring regexes, so `bug` can match `Debugging`; no central report states that policy. | False-hide / UX expectation |
| `keyword_exact_unicode_boundary_matches_json_and_dom is only partially unified today` | pass-current-gap | JSON exact matching honors the compiled Unicode boundary regex, while DOM fallback owns extra normalized fallback behavior. | JSON/DOM drift |
| `keyword_dom_normalized_fallback_requires_both_boundaries is not satisfied today` | pass-current-gap | DOM fallback accepts either a left or right boundary in normalized fallback matching, not a required both-boundary proof. | False-hide risk |
| `keyword_comment_serialized_rules_are_reconstructed is not satisfied today` | pass-current-gap | The engine reconstructs serialized main block/allow keywords but not serialized `filterKeywordsComments`. | Comment keyword leak |
| `keyword_global_rules_do_not_affect_comments_unless_enabled is only implicit today` | pass-current-gap | Comment filtering can still fall back to global keywords when explicit comment keyword authority is absent or empty. | Comment/global boundary drift |
| `keyword_channel_derived_metadata_round_trips is not satisfied by background persistence today` | pass-current-gap | Shared settings and background persistence disagree on channel-derived keyword `source`, `channelRef`, and exactness metadata. | Settings/persistence drift |
| `keyword_channel_derived_comments_policy_round_trips is not satisfied by background persistence today` | pass-current-gap | Shared settings preserves channel-derived comment policy, while background persistence writes channel-derived rows with `comments: false`. | Comments policy drift |
| `keyword_kids_to_main_sync_preserves_source_and_action is not centrally reported today` | pass-current-gap | Kids-to-Main keyword recomputation can merge Kids channel-derived rows into Main without a structured source/action report. | Cross-surface provenance |
| `keyword_whitelist_keyword_miss_reports_fail_closed_reason is not structured today` | pass-current-gap | Whitelist keyword misses fail closed but expose only local log labels, not a structured keyword miss report. | Whitelist fail-closed clarity |
| `keyword_import_legacy_compiled_exactness_round_trips is source-local but lacks authority report today` | pass-current-gap | Legacy exact regex parsing exists in shared settings, but there is no authority report preserving source, flags, comments, and exactness end-to-end. | Migration drift |

## P0 Content / Category Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 content/category audit documents fixture family and blocked verdict` | pass | The P0 content/category slice is explicitly blocked for implementation and names the missing future `contentPredicateAuthority`. | Implementation gate |
| `content_predicate_enabled_empty_category_is_inactive is satisfied for seed and DOM lifecycle today` | pass-current-gap | The engine leaves enabled-empty category cards intact, and seed plus DOM top-level predicates now require selected category values before category work is active. | Empty-state overwork reduced; compiled predicate authority still missing |
| `content_predicate_blank_upload_date_is_inactive is not satisfied before work today` | pass-current-gap | Blank upload-date decisions no-op at engine layer, but seed and DOM top-level predicates wake work from the raw enabled flag. | Empty-state overwork |
| `content_predicate_zero_duration_longer_is_inactive is not satisfied today` | pass-current-gap | `duration.longer` with min `0` removes any parsed-duration video. | False-hide risk |
| `content_predicate_blank_duration_save_clears_old_threshold is not satisfied by UI save today` | pass-current-gap | Main/Kids content-filter saves clone prior duration state and only replace thresholds when parsed positive values exist. | Stale settings drift |
| `content_predicate_route_scope_home_does_not_scan_watch_controls is not satisfied at top-level DOM gate` | pass-current-gap | Watch-only booleans can wake the top-level DOM fallback predicate without route proof. | Route overwork |
| `content_predicate_route_scope_watch_does_not_scan_home_feed_controls is not satisfied at top-level DOM gate` | pass-current-gap | Home/search/feed booleans can wake the top-level DOM fallback predicate without route proof. | Route overwork |
| `content_predicate_category_storage_change_refreshes_runtime is split today` | pass-current-gap | StateManager requests Main/Kids category refreshes, but background and bridge storage-key lists omit direct `categoryFilters`. | Storage refresh drift |
| `content_predicate_kids_and_main_are_independent is source-local but not reported today` | pass-current-gap | Main/Kids update and compile paths are separated in source, but no predicate report names target surface/profile. | Surface provenance gap |
| `content_predicate_boolean_controls_are_route_scoped is not centralized today` | pass-current-gap | Boolean controls are compiled and DOM-active as broad keys before route relevance is centrally proven. | Route authority drift |
| `content_predicate_metadata_fetch_requires_valid_pending_reason is only partially satisfied today` | pass-current-gap | Category metadata scheduling is selected-category guarded, while DOM upload-date can schedule metadata before final date validity proof. | Metadata fetch overwork |

## P0 Settings / Mutation Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 settings mutation audit documents fixture families and current blocked verdict` | pass | The P0 settings/mutation slice is explicitly blocked for implementation and names the lock, target-profile, and mutation-report fixture families. | Implementation gate |
| `locked_profile_rejects_set_list_mode is not enforced in the SetListMode branch today` | pass-current-gap | SetListMode checks trusted UI sender but does not check profile session authorization before mode/list/cache/backup/refresh side effects. | Lock bypass / mutation drift |
| `locked_profile_rejects_add_whitelist_channel is not enforced in the single-channel branch today` | pass-current-gap | Main whitelist add checks trusted UI sender but does not share the batch-import profile-lock gate. | Lock bypass |
| `locked_profile_rejects_transfer_whitelist_to_blocklist is not enforced today` | pass-current-gap | Whitelist-to-blocklist transfer moves and clears lists without lock/session proof or dry-run mutation report. | Destructive mutation |
| `settings_mode_locked_profile_rejects_all_rule_mutations is only partial today` | pass-current-gap | Batch subscription import checks `isProfileSessionAuthorized`, but SetListMode, Kids whitelist, and Kids block do not share that gate. | Split lock authority |
| `rule_mutation_report_exists_for_kids_block_and_whitelist is not satisfied today` | pass-current-gap | Kids whitelist and Kids block do not share sender policy and neither returns a structured rule mutation report. | Kids mutation authority |
| `rule_mutation_report_exists_for_list_mode_transfer is not satisfied today` | pass-current-gap | List-mode transfer combines storage writes, cache invalidation, backup, and refresh without dry-run, revision, rollback, or migration-plan proof. | Migration safety |
| `encrypted_import_preserves_target_profile_id is not satisfied today` | pass-current-gap | `importV3()` accepts `targetProfileId`, while `importV3Encrypted()` does not accept or forward it. | Import target drift |
| `nanah_envelope_requires_filtertube_app_action_version is not satisfied today` | pass-current-gap | Nanah envelope extraction parses payloads without validating FilterTube app identity, payload version, proposal action, or allowed operation. | P2P schema/trust |
| `rule_mutation_report_exists_for_nanah_scoped_apply is not satisfied today` | pass-current-gap | Nanah scoped apply falls back to active profile, writes V4 directly, and returns success without lock, revision, refresh, or mutation-report proof. | P2P mutation authority |

## P0 Rule Mutation Authority Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 rule mutation doc lists all readiness fixtures and blocked verdict` | pass | The P0 rule-mutation slice names all eleven readiness fixtures, the future actor/target/operation/effect report, and the blocked implementation verdict. | P0 fixture wall |
| `rule_mutation_report_exists_for_state_manager_add_keyword is not satisfied today` | pass-current-gap | Main keyword add mutates blocklist or whitelist state from `state.mode`, persists through separate paths, refreshes, notifies, and schedules backup without a mutation report. | Mode-inferred keyword mutation |
| `rule_mutation_report_exists_for_state_manager_add_channel is not satisfied today` | pass-current-gap | Main channel add chooses a background action from `state.mode` and updates local state without row-level list-target/revision authority. | Mode-inferred channel mutation |
| `rule_mutation_report_exists_for_background_add_filtered_channel is not satisfied today` | pass-current-gap | Background persistent and secondary typed channel-add paths write rule state through different branches; the secondary listener omits `listType` and sender/action authority. | Split channel-add authority |
| `rule_mutation_report_exists_for_kids_block_and_whitelist is not satisfied today` | pass-current-gap | Kids whitelist uses trusted UI sender checks while Kids block does not; neither emits one mutation report. | Kids mutation trust drift |
| `rule_mutation_report_exists_for_list_mode_transfer is not satisfied today` | pass-current-gap | Set-list-mode and whitelist-transfer paths move/clear lists, invalidate caches, refresh tabs, and schedule backups without dry-run, rollback, revision, or migration-plan proof. | Destructive migration |
| `rule_mutation_report_exists_for_managed_child_edit is not satisfied today` | pass-current-gap | Managed child edits check parent relationship but then write profile V4 directly through caller mutators without a shared mutation report. | Child edit authority |
| `rule_mutation_report_exists_for_import_v3 is not satisfied today` | pass-current-gap | Import can write settings, V3 profiles, V4 profiles, channel maps, themes, and trusted Nanah state without one pre/post mutation report. | Import mutation authority |
| `rule_mutation_report_exists_for_nanah_scoped_apply is not satisfied today` | pass-current-gap | Scoped Nanah apply merges/replaces Main or Kids profile sections and writes V4 directly, returning success without lock, refresh, broadcast, or revision proof. | P2P mutation authority |
| `rule_mutation_report_exists_for_learned_identity_writes is not satisfied today` | pass-current-gap | Page-world and background learned-map paths update video/channel/meta/custom-url identity inputs and can rerun DOM fallback without provenance report. | Identity poisoning / stale identity |
| `content_script_channel_add_requires_allowed_youtube_action is not satisfied today` | pass-current-gap | Content-script channel adds send `addFilteredChannel`, and the background secondary listener accepts it without `allowedYoutubeContentScript` or trusted UI classification. | Content-script mutation trust |
| `page_world_identity_update_requires_owned_request is not satisfied today` | pass-current-gap | Same-window page messages can update learned identity maps without nonce, capability, pending request id, or owned page-world request proof. | Page-world identity trust |

## Initial Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `empty blocklist mode leaves a simple videoRenderer intact` | pass | The pure engine does not remove a simple `videoRenderer` when blocklist mode has no rules. | Runtime no-work baseline |
| `disabled filtering returns the original payload reference` | pass | `settings.enabled=false` returns the original data reference after harvest guard; this is the strongest no-mutation baseline currently proven at engine layer. | Runtime no-work baseline |
| `empty whitelist mode currently removes a simple videoRenderer` | pass | Empty whitelist is fail-closed at engine layer for normal video cards. This may be intended for strict profiles but must be surfaced as an explicit product/UX choice. | Whitelist behavior |
| `category filter enabled with empty selected currently leaves videoRenderer intact at engine layer` | pass-boundary-proof | Engine category logic no-ops when `selected=[]`, even though seed/DOM active checks can still wake work. | Active-predicate drift |
| `duration longer filter enabled with zero threshold currently removes any video with duration` | pass-current-gap | A saved `duration.enabled=true`, `condition=longer`, `minMinutes=0` state blocks any card with a parsed duration. | False-hide risk |
| `duration shorter filter enabled with zero threshold currently leaves parsed-duration video intact` | pass-boundary-proof | Zero-threshold duration behavior is asymmetric: `shorter` does not hide parsed-duration videos while `longer` does. | Content-filter predicate drift |
| `duration between filter enabled with zero thresholds currently leaves parsed-duration video intact` | pass-boundary-proof | `between` with zero thresholds no-ops at engine layer, but raw enabled state can still wake endpoint and DOM work. | Content-filter predicate drift |
| `upload-date filter enabled with blank date fields currently leaves videoRenderer intact at engine layer` | pass-boundary-proof | Engine upload-date logic no-ops with blank date fields, but the raw enabled flag still wakes endpoint work. | Active-predicate drift |
| `duplicate gridVideoRenderer rule currently ignores descriptionSnippet text` | pass | The later `gridVideoRenderer` rule shadows the earlier `BASE_VIDEO_RULES` entry, so description-only keyword matches are not removed by JSON engine today. | Renderer contract gap |
| `duplicate gridVideoRenderer rule currently still supports common lengthText duration filtering` | pass | Despite the duplicate/narrow rule, common `lengthText` duration extraction still removes grid videos when a duration predicate matches. | Renderer contract boundary |
| `duplicate gridVideoRenderer rule currently ignores publishedTimeText upload-date filtering` | pass-current-gap | The later `gridVideoRenderer` rule omits published-time paths, and upload-date fallback does not read simple `publishedTimeText` for this renderer. | Renderer contract gap |
| `shelfRenderer currently hides the whole shelf when shelf title matches a keyword` | pass-current-behavior | A keyword match on shelf title removes the entire shelf container, including non-matching child videos. | Broad container hide risk |
| `richShelfRenderer currently hides the whole rich shelf when shelf title matches a keyword` | pass-current-behavior | A keyword match on rich shelf title removes the entire rich shelf container, including non-matching child videos. | Broad container hide risk |
| `compactAutoplayRenderer currently has no direct JSON rule` | pass | Keyword-matching `compactAutoplayRenderer` payloads are not removed by the JSON engine because there is no direct rule. | End-screen/up-next gap |
| `endScreenVideoRenderer currently uses direct BASE_VIDEO_RULES and is removed by keyword` | pass | The JSON engine can remove direct end-screen video renderers when YouTube sends this documented renderer. End-screen leaks are therefore likely DOM/alternate-renderer coverage gaps, not this direct rule. | Renderer contract baseline |
| `compactPlaylistRenderer currently has no direct JSON rule for keyword or channel rules` | pass-current-gap | Direct compact playlist suggestions with matching title and creator channel identity are not removed by the JSON engine. | Playlist/up-next gap |
| `richItemRenderer wrapping compactPlaylistRenderer currently unwraps to missing direct rule and passes through` | pass-current-gap | Rich-item unwrap reaches `compactPlaylistRenderer`, but because that renderer has no direct rule the wrapped playlist still passes through. | Playlist unwrap gap |
| `direct watchCardRichHeaderRenderer currently has no direct JSON rule` | pass-current-gap | Direct watch-card header renderer payloads are not removed by the JSON engine. | Watch-card gap |
| `nested universalWatchCardRenderer currently filters watch card header text` | pass | Watch-card header text is filtered when nested under `universalWatchCardRenderer`. | Renderer structural baseline |
| `watchCardCompactVideoRenderer currently uses direct BASE_VIDEO_RULES and is removed by keyword` | pass | Direct compact watch-card video renderers use `BASE_VIDEO_RULES` and are removed by keyword. | Watch-card baseline |
| `direct watchCardHeroVideoRenderer currently has no direct JSON rule` | pass-current-gap | Direct watch-card hero payloads are not removed by the JSON engine. | Watch-card gap |
| `direct watchCardRHPanelVideoRenderer currently has no direct JSON rule` | pass-current-gap | Direct RHS panel watch-card video payloads with matching keyword/channel data pass through. | Watch-card RHS gap |
| `postRenderer currently has no direct JSON rule` | pass-current-gap | Direct community post payloads with matching text are not removed by the JSON engine. | Community post gap |
| `legacy backstagePostRenderer currently blocks by keyword and author channel` | pass | Legacy backstage post payloads are filtered by text and author channel identity. | Legacy post baseline |
| `legacy backstagePostThreadRenderer currently blocks nested post text and author channel` | pass | Legacy thread-wrapped backstage posts are filtered by nested post text and author channel identity. | Legacy post baseline |
| `sharedPostRenderer currently has no direct JSON rule and does not filter nested original post text` | pass-current-gap | Shared community posts and nested original `postRenderer` text pass through the JSON engine today. | Community/shared post gap |
| `playlistPanelRenderer currently has no direct JSON rule but recurses into playlistPanelVideoRenderer entries` | pass-boundary-proof | Playlist panel header/title text is not a direct decision surface, but nested playlist videos are still filtered. | Playlist panel structural gap |
| `channelMetadataRenderer currently has no direct JSON rule` | pass-current-gap | Channel about/metadata text containing a blocked keyword is not removed by the JSON engine. | Channel metadata policy gap |
| `channelRenderer currently blocks by channel rule but ignores keyword-only text` | pass-boundary-proof | Search channel rows are intentionally channel-only: matching text does not trigger keyword blocking, while a matching channel ID/handle does block the row. | Channel result baseline |
| `compactChannelRenderer currently has no direct JSON rule for channel rules` | pass-current-gap | Documented compact channel cards carry UC/handle identity, but the JSON engine does not block them by matching channel rule today. | Compact channel gap |
| `searchRefinementCardRenderer currently has no direct JSON rule for keyword or channel rules` | pass-current-gap | Refinement cards with matching query text or associated channel identity pass through the JSON engine today. | Search refinement policy gap |
| `horizontalCardListRenderer currently preserves search refinement children with no direct rule` | pass-current-gap | Search refinement cards under horizontal card lists remain intact even when both keyword and channel rules match. | Search refinement structural gap |
| `commentRenderer currently ignores serialized comment keyword list` | pass-current-gap | `filterKeywordsComments` entries serialized as `{ pattern, flags }` are not reconstructed by the engine, so comment-specific keyword rules can be ignored in direct engine calls. | Comment keyword authority drift |
| `commentRenderer currently blocks when comment keyword list already contains RegExp objects` | pass-boundary-proof | The comment-specific keyword branch works when the list contains real `RegExp` objects. Future fixes must preserve this matching path while reconstructing serialized rules. | Comment keyword baseline |
| `commentRenderer currently still blocks by global keyword even when comment keyword list is empty` | pass-current-gap | Generic metadata keyword matching can remove comments before the comment-specific branch, even when the explicit comment keyword list is empty. | Comment/global rule boundary drift |
| `commentRenderer currently blocks by author channel rule` | pass | Comment author browse IDs are extracted and a matching channel rule removes the comment renderer. | Comment channel baseline |
| `commentThreadRenderer currently hides whole thread when hideAllComments is enabled` | pass | `hideAllComments=true` removes comment thread renderers by renderer-type classification. | Comment hide-all baseline |
| `commentsHeaderRenderer currently has no direct JSON rule even when hideAllComments is enabled` | pass-current-gap | Comment headers remain because they have no direct rule and their renderer name does not match the hide-all comment branch used for comment content. | Comment structural gap |
| `shortsLockupViewModel currently blocks title keywords but not channel-only rules without videoChannelMap` | pass-current-gap | Shorts title/accessibility keyword matches work, but channel-only rules do not work on this renderer unless a separate video-to-channel mapping exists. | Shorts owner identity gap |
| `shortsLockupViewModel currently ignores belowThumbnailMetadata owner identity for channel rules` | pass-current-gap | Search-style Shorts payloads can include a direct owner UC/handle under `belowThumbnailMetadata`, but the current JSON rule still does not use it for channel block decisions. | Shorts owner identity gap |
| `reelItemRenderer currently blocks by title keyword but has no UC or handle extraction path` | pass-current-gap | Classic reel title keyword matches work, but the documented channel-bar UC/handle path is not extracted by the direct rule. | Reel owner identity gap |
| `lockupViewModel currently ignores metadata row command-run channel id without decorated avatar identity` | pass-current-gap | Modern lockup rows can carry owner browse IDs in `metadataRows[].metadataParts[].text.commandRuns[]`; the current channel rule only uses decorated-avatar identity. | Modern lockup owner identity gap |
| `videoWithContextRenderer currently ignores showSheetCommand collaborator roster for channel rules` | pass-current-gap | Mobile/YTM-style collaborator rosters under `showSheetCommand.sheetViewModel` are not extracted by the current `showDialogCommand.dialogViewModel` collaboration path. | Collaboration leak risk |
| `videoWithContextRenderer currently blocks showDialogCommand collaborator roster for channel rules` | pass-boundary-proof | Legacy dialog-style collaborator rosters under `showDialogCommand.dialogViewModel` are extracted and can trigger channel blocking. This working path must be preserved while adding the documented show-sheet path. | Collaboration baseline |
| `radioRenderer avatar stacks currently can be treated as collaboration identity and blocked by channel rules` | pass-current-gap | Mix/Radio avatar stacks can become collaborator identity and trigger a channel block, even though the encyclopedia says radio renderers are not collaborator renderers. | False-hide risk |
| `expandableMetadataRenderer currently has no direct JSON rule` | pass-current-gap | Expandable metadata / generated-summary text is not removed by the JSON engine. | Metadata summary gap |
| `engine layer is endpoint agnostic and will filter a videoRenderer inside player-shaped data` | pass | The engine can remove renderers inside a player-shaped payload if called on it. `/player` safety must therefore be enforced at seed/endpoint policy, not inside the generic engine. | Endpoint authority boundary |
| `harvestOnly currently emits video-channel map writes from renderer bylines` | pass-current-gap | The real engine harvest-only path can post `FilterTube_UpdateVideoChannelMap` without mutating response JSON. | Harvest side-effect cost |
| `harvestOnly currently emits video-meta map writes from player metadata` | pass-current-gap | The real engine harvest-only path can post `FilterTube_UpdateVideoMetaMap` from player metadata. | Harvest side-effect cost |

## Initial Seed / Endpoint Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `search fetch with empty blocklist currently harvests only and does not call processData` | pass | `/youtubei/v1/search` on `/results` skips mutation in empty blocklist mode and calls `harvestOnly`. | Endpoint no-work baseline |
| `non-youtubei fetch currently bypasses JSON parsing and engine work` | pass | Non-YouTubei requests bypass the interception cost path: no response JSON parse, no engine call, and no response stringify. | Endpoint bypass baseline |
| `fetch URL with youtubei endpoint only in query currently still intercepts` | pass-current-gap | A non-YouTube URL whose query contains `/youtubei/v1/search` is still intercepted, parsed, stringified, and sent to `processData` as `fetch:/log`. | Endpoint substring-match overreach |
| `fetch path that only starts with youtubei endpoint text currently still intercepts` | pass-current-gap | `/youtubei/v1/searchExtra` is intercepted and processed because endpoint detection uses substring matching rather than exact pathname matching. | Endpoint substring-match overreach |
| `XHR URL with youtubei endpoint only in query currently marks request for processing` | pass-current-gap | XHR `.open()` sets `__filtertube_shouldProcessXhr=true` for a URL whose query contains `/youtubei/v1/search`. | Endpoint substring-match overreach |
| `search harvest-only skip still parses and stringifies the response body` | pass-current-gap | Harvest-only is not a true no-work path: seed still parses the cloned response and stringifies a replacement response body. | Empty-install performance cost |
| `search fetch with active blocklist rule currently calls processData` | pass | `/youtubei/v1/search` correctly switches from harvest-only to JSON processing once an active rule exists. | Endpoint active-rule baseline |
| `search fetch with category enabled but empty selected currently bypasses category JSON work` | pass-current-gap | Search category JSON activation now requires `selected` values, so enabled-empty category alone does not pay JSON processing for a category rule the engine cannot match. | Active-predicate overwork reduced; first-class predicate authority still missing |
| `search fetch with upload-date enabled but blank dates currently calls processData` | pass-current-gap | Search treats blank enabled upload-date filters as active and calls `processData`, even though the engine no-ops blank dates. | Active-predicate overwork |
| `desktop home browse continuation with empty blocklist currently harvests only` | pass | Desktop `/youtubei/v1/browse` home continuation skips mutation and calls `harvestOnly`. | Endpoint no-work baseline |
| `desktop home browse continuation with active blocklist rule currently calls processData` | pass | Desktop home browse correctly switches to JSON processing once an active rule exists. | Endpoint active-rule baseline |
| `desktop home browse with category enabled but empty selected currently bypasses category JSON work` | pass-current-gap | Seed category activation now requires selected values, so enabled-empty category alone does not wake JSON work. | Active-predicate overwork reduced; first-class predicate authority still missing |
| `desktop home browse with duration enabled but empty thresholds currently calls processData` | pass-current-gap | Seed treats `contentFilters.duration.enabled=true` as active even when thresholds are empty/zero. | Active-predicate overwork |
| `desktop home browse with upload-date enabled but blank dates currently calls processData` | pass-current-gap | Desktop home treats blank enabled upload-date filters as active and calls `processData`, despite blank dates being a no-op at engine layer. | Active-predicate overwork |
| `mobile home browse continuation with empty blocklist currently calls processData` | pass-current-gap | Mobile `m.youtube.com` home browse continuation still runs `processData` with no rules. This is a strong candidate for empty-install mobile lag. | Endpoint overwork |
| `disabled settings currently skip both harvestOnly and processData for fetch responses` | pass-current-gap | Seed does no engine work when `enabled=false`, but the intercepted YouTubei response is still parsed and stringified. | Disabled-mode interception cost |
| `player fetch with empty blocklist currently calls processData` | pass-current-gap | `/youtubei/v1/player` still runs `processData` with no rules. Player payload safety must be route/endpoint scoped. | Endpoint overwork |
| `player fetch currently replaces the response body with engine output` | pass-current-gap | `/youtubei/v1/player` is not metadata-only today; the fetch hook can return the engine result as the actual player response body. | Player response mutation authority |
| `player fetch with active rule can return actual engine-mutated renderer arrays` | pass-current-gap | The seed fetch hook can return real `FilterTubeEngine` mutations from `/youtubei/v1/player`; renderer arrays inside a player-shaped response can be removed. | Player response mutation authority |
| `watch next fetch with empty blocklist currently calls processData` | pass-current-gap | `/youtubei/v1/next` still runs `processData` with no rules. Watch-side endpoint policy needs active-rule gates. | Endpoint overwork |
| `watch next fetch with active rule returns actual engine-mutated recommendation arrays` | pass | `/youtubei/v1/next` with active rules returns real engine-filtered sidebar recommendation arrays. This is expected for watch recommendations but needs route scoping from comments/player-adjacent flows. | Watch next mutation baseline |
| `watch next comment continuation with hideAllComments currently bypasses engine and returns synthetic end marker` | pass-boundary-proof | Comment continuation hiding uses a pre-engine `/next` shortcut that returns a synthetic end-of-comments continuation. This behavior must be preserved while route-scoping generic `/next` work. | Comment continuation baseline |
| `watch next reload comment continuation with hideAllComments currently misses synthetic end shortcut` | pass-current-gap | Reload-style comment continuations with `hideAllComments=true` do not use the synthetic end marker path and instead call `processData`. | Comment continuation shape gap |
| `guide fetch with empty blocklist currently calls processData` | pass-current-gap | `/youtubei/v1/guide` still runs `processData` with no rules. Sidebar/guide processing needs an active sidebar rule or a harvest-only path. | Endpoint overwork |
| `youtubei fetch before settings are loaded currently parses and rebuilds response while queueing` | pass-current-gap | A YouTubei response arriving before settings are loaded is cloned, parsed, queued, stringified into a replacement response, and returned unchanged. | Startup parse/rebuild cost |
| `endpoint decision matrix documents the exact current YouTubei endpoint set` | pass | The current fetch/XHR endpoint lists both contain search, guide, browse, next, and player, and the new matrix documents all five. | Endpoint policy coverage |
| `endpoint decision matrix pins substring URL authority and eager fetch JSON work` | pass-current-gap | Source and docs now jointly pin substring matching plus clone/parse/stringify before no-settings, disabled, and harvest-only branches. | Endpoint parse/rewrite overwork |
| `endpoint decision matrix covers every current endpoint risk row and future decision type` | pass | The future decision vocabulary is explicit: `passThrough`, `harvestOnly`, `mutateRecommendations`, `commentsContinuationRewrite`, `playerMetadataOnly`, and `unsupportedNoop`. | Endpoint authority design gate |

## Network Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `network authority audit documents primitive counts families and future gate` | pass | The audit separates passive YouTubei interception, extension-owned fetches, explicit subscription import, extension-resource fetches, website remotes, and navigation opens. | Network authority coverage |
| `current tracked non-vendor network primitive counts match the audit` | pass | Current tracked non-vendor source has 14 `fetch()` sites, 2 `XMLHttpRequest` references, 11 credential option sites, 3 `tabs.create()` calls, and 7 `window.open()` calls. | Network source surface |
| `background owns release resource and credentialed YouTube identity fetches` | pass | Background fetches local release notes and owns credentialed watch/shorts/Kids/channel identity fetch paths plus public channel fallback. | YouTube-visible fetch risk |
| `content bridge active fetches are watch metadata or same-origin identity fallbacks` | pass | Content bridge owns same-origin `/watch` and `/shorts` fallback fetches plus watch metadata HTML fetch. | Route/identity fetch risk |
| `subscription import is the only injector fetch and is credentialed POST work` | pass | Injector fetches only the explicit subscription-import `/youtubei/v1/browse` path with `POST` and `credentials: include`. | User-action gate |
| `seed fetch and XHR interception are passive wrappers without networkAuthority yet` | pass-current-gap | Seed wraps fetch/XHR and can clone/parse/rewrite YouTubei responses, while product source has no central `networkAuthority`. | Endpoint/network split authority |
| `website remotes are website-only and not extension runtime fetches` | pass | Vercel Analytics and CDN browser logos are public website concerns, not extension/app filtering runtime fetches. | Privacy/release claim boundary |
| `network authority fixtures are named before network behavior changes` | pass | The readiness gate names P0 fixtures for counts, extension resources, identity fetch reasons, import gating, credentials, website remotes, tab opens, and raw-capture URL exclusion. | Behavior-change blocker |

## External Navigation Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `external navigation audit documents runtime static website and future authority boundaries` | pass | The audit separates extension runtime opens, static extension anchors, public website links, ignored raw captures, and the future `externalNavigationAuthority` token. | Navigation authority coverage |
| `current extension runtime navigation primitive counts match the audit` | pass | Runtime navigation call counts are pinned across background, popup, dashboard, and release-note prompt code. | Navigation source surface |
| `What’s New navigation currently accepts caller supplied URL and release banner has fallback navigation` | pass-current-gap | `FilterTube_OpenWhatsNew` accepts a caller-provided URL, and the release banner can fall back to `window.open` or `location.href`. | Caller URL / fallback navigation risk |
| `popup internal tab opens use runtime getURL but still have window.open fallbacks` | pass | Popup dashboard/content-control opens are extension-internal URLs produced by `runtime.getURL`, with browser fallbacks that still need one policy. | Internal navigation fallback policy |
| `tab-view external support and subscription import opens are fixed URL workflows today` | pass | Ko-fi and subscription-import navigation use fixed URLs, and subscription import opens `m.youtube.com/feed/channels` as an explicit workflow dependency. | User-action workflow boundary |
| `extension static HTML target blank links are mixed rel-policy surfaces today` | pass-current-gap | Static extension anchors mix no `rel`, `noreferrer`, and `noopener noreferrer`; this needs one target-blank policy before link changes. | Static link policy drift |
| `website external link data and components are public-site navigation surfaces` | pass | Website store, GitHub, demo, CDN logo, and download links are public website concerns, not extension runtime filtering authority. | Website/release surface boundary |
| `external navigation authority is a future gate and raw captures remain excluded` | pass | The readiness gate names P0 navigation fixtures, product source has no `externalNavigationAuthority`, and root ignored captures are evidence only. | Behavior-change blocker |

## Release Package Parity Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `release package parity audit documents package roots and future gate` | pass | The audit records package roots, common files, and the future `releasePackageParity` manifest gate. | Package authority coverage |
| `P0 release package audit documents blocked verdict and all named gates` | pass | The P0 release package slice records the blocked verdict and named package parity gates before release-package behavior changes. | Package authority coverage |
| `build script copies whole common directories and top-level common files` | pass | Browser ZIP inputs are directory-level roots (`js`, `css`, `html`, `icons`, `data`, `assets`) plus README/changelog/license, not a committed per-file manifest. | Over-broad package surface |
| `quarantined YouTube CSS is packaged by directory copy but not manifest loaded` | pass-current-gap | Legacy YouTube CSS remains in the package through `css/`, while manifests do not content-script-load CSS today. | Quarantine drift risk |
| `browser package manifest is selected per target and only collaborator order is repaired` | pass-current-gap | Build writes `manifest.<browser>.json` as package `manifest.json` and only repairs collaborator order; broader manifest parity is not validated. | Browser package drift |
| `build currently regenerates UI shells and mutates README badges before packaging` | pass-current-gap | Build is not a pure dry-run package step: it regenerates UI shells and writes README badges. | Release reproducibility |
| `zip packaging has only junk-file ignores and no committed package content manifest` | pass-current-gap | ZIP creation excludes OS junk but has no package content manifest or source-family allowlist. | Package content drift |
| `GitHub release is public before asset upload proof in the current script` | pass-current-gap | `createGitHubRelease()` uses `draft: false` before the asset upload loop. | Public release asset gap |
| `mobile artifact staging has naming and checksum mechanics but no public claim gate` | pass-current-gap | Android APK/AAB staging has deterministic naming and SHA-256 output, but no public claim manifest or website CTA gate. | Direct download claim drift |

## Initial Lifecycle / Source Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `page-resident lifecycle primitive counts are pinned for current behavior` | pass | `content_bridge`, `block_channel`, `dom_fallback`, and `injector` listener/observer/timer/RAF counts are now executable baseline data. | Lifecycle budget baseline |
| `quick-block source currently installs global lifecycle work without route teardown` | pass-current-gap | Quick block has resize/orientation listeners and a route sweep listener path, while `block_channel.js` has no owner teardown occurrence. | Runtime overwork / teardown |
| `quick-block observer setup currently installs lifecycle work before feature-enabled checks` | pass-current-gap | `setupQuickBlockObserver()` injects styles and installs document/window lifecycle listeners before the first `isQuickBlockEnabled()` guard inside event handling. | Disabled-affordance overwork |
| `fallback menu source currently has warmup and scroll rescan lifecycle work` | pass-current-gap | Fallback menu has scroll-triggered rescan and warmup interval work that must be gated by feature visibility and route. | Runtime overwork |
| `DOM fallback source currently attaches document or window listeners without local removal paths` | pass-current-gap | DOM fallback source has three listeners and no local `removeEventListener` path. | Runtime teardown / route scope |

## Initial Settings / Mutation Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `FilterTube_SetListMode currently reads copyBlocklist but does not use it to guard merge-and-clear` | pass-current-gap | Background reads `copyBlocklist` but the whitelist transition still unconditionally calls `mergeAndClearBlocklistIntoWhitelist`. | Settings mutation authority |
| `tab-view import path asks for copyBlocklist:false before enabling whitelist` | pass | The subscription import UI explicitly asks the background to enable whitelist without copying the existing blocklist. | UI/background contract |
| `FilterTube_ApplySettings currently lets request.settings become compiled cache authority` | pass-current-gap | The background branch directly writes `compiledSettingsCache[targetProfile] = request.settings` and forwards the caller payload, without local sender validation in that branch. | Runtime cache authority |
| `background compiler currently writes storage during getCompiledSettings read path` | pass-current-gap | `getCompiledSettings()` builds `storageUpdates`, can write generated V4 profiles, can persist channel-derived keywords to `ftProfilesV4`, and then updates compiled cache. | Compiler side effect / read-path mutation |
| `background currently has two separate channel-add implementations` | pass-current-gap | `addChannelPersistent` and `addFilteredChannel` use separate normalize/fetch/write paths, both schedule backup, and both can write channel/profile state. | Split channel mutation authority |
| `addFilteredChannel message path currently does not forward listType to handleAddFilteredChannel` | pass-current-gap | The handler supports `listType`, but the message bridge passes only profile and videoId, leaving the helper default `blocklist` path in effect. | List-type authority drift |
| `settings compilation currently merges Kids whitelist into Main whitelist when syncKidsToMain and modes match` | pass-boundary-proof | Main compiled whitelist can include Kids whitelist entries when `syncKidsToMain` is enabled and both modes are whitelist. This needs explicit product-policy coverage. | Cross-surface rule interaction |
| `settings_shared SETTINGS_KEYS currently omits several runtime compiler dependencies` | pass-current-gap | Shared settings key authority omits `contentFilters`, `categoryFilters`, `filterKeywordsComments`, learned video maps, `ftProfilesV4`, exact matching, and channel-derived keyword keys. | Settings key drift |
| `background compiler reads more setting keys than its storage invalidation listener watches` | pass-current-gap | `getCompiledSettings()` reads keys that the background storage listener does not invalidate for, including `enabled`, `categoryFilters`, learned video maps, exact matching, quick-block/menu flags, and endscreen controls. | Stale cache / invalidation drift |
| `bridge settings storage refresh currently omits category and exact-match keys` | pass-current-gap | The content bridge refresh list watches many runtime keys but omits `categoryFilters`, exact matching, channel-derived keyword keys, and stats keys. | Content/runtime refresh drift |
| `StateManager external reload key list currently omits content/category and learned video maps` | pass-current-gap | Tab state reload watches core lists/profiles but omits content/category filters, learned video maps, exact matching, channel-derived keyword keys, and `statsBySurface`. | UI/settings reload drift |
| `legacy V3 to V4 builder currently forces blocklist mode and empty whitelists` | pass-current-gap | Shared V3-to-V4 builder creates blocklist-mode profiles with empty allow lists, so a V3-only whitelist profile can be lossy if this migration runs first. | Migration data-loss risk |
| `settings_shared loadSettings currently writes generated V4 during read path when V4 is missing` | pass-current-gap | `loadSettings()` can write `ftProfilesV4` while callers think they are only reading settings, which can fan out storage changes and cement lossy migration output. | Read-path mutation / storage fanout |
| `V4 main blocked aliases are now secondary to canonical saved main lists` | fixed-current-path | Background compile now prefers canonical `activeMain.keywords` / `activeMain.channels` before aliases, and shared save mirrors blocklist aliases from canonical rows. Import/Nanah/direct profile writes still need conflict-policy proof. | Settings schema alias drift reduced |
| `compiled stale keyword authority can hide content even when visible canonical rows are empty` | pass-current-gap | A runtime payload with compiled `filterKeywords` hides a matching result while the simulated visible Main keyword list is empty, matching the stale-alias symptom class. | Visible-empty false-hide |
| `compiled channel payload still hides while normal compiler no longer prefers hidden channel aliases` | fixed-current-path | A runtime payload with compiled `filterChannels` still hides by design, but the normal Main compiler no longer prefers stale channel aliases over visible canonical channel rows. | Visible-empty false-hide reduced |
| `StateManager saveSettings currently drops concurrent save requests instead of queuing them` | pass-current-gap | If `isSaving` is true, later save calls return immediately rather than queueing a durable write. | Save race / stale runtime broadcast |
| `StateManager mutators update state before saveSettings and can notify after a dropped save` | pass-current-gap | Keyword/content/category mutators update in-memory state before save and can notify or refresh after a save path that may have been dropped. | Optimistic mutation consistency |
| `profile persistence helpers currently swallow V3 and V4 save failures` | pass-current-gap | Main/Kids profile persistence logs failures but does not surface them as failed mutations to callers. | Silent persistence failure |
| `syncKidsToMain keyword recomputation can merge Kids channel-derived keywords into Main keyword state` | pass-current-gap | Main keyword recomputation can include Kids `filterAll` channel-derived keywords, and shared save then treats the synthesized keyword list as Main save input. | Derived-rule persistence / false-hide risk |

## UI Row / List Mode Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `UI row list-mode audit documents current row authority and future contract` | pass | The focused audit pins row mutation ownership, mode switching, ignored-capture boundaries, and the future simultaneous allow/block contract. | UI/list-mode authority coverage |
| `keyword rows currently route comments exact and delete actions directly to StateManager` | pass | Rendered keyword row actions delegate directly to `StateManager`, including channel-derived comment toggles and Kids variants. | Row action authority |
| `channel rows currently route delete and filter all actions directly to StateManager` | pass | Rendered channel rows delegate delete/filter-all directly to `StateManager`, with profile-specific Kids variants. | Row action authority |
| `RenderEngine currently hides Filter All control in whitelist mode` | pass | The UI hides Filter All in whitelist mode by returning a hidden spacer rather than exposing a disabled semantic action. | Whitelist UI semantics |
| `StateManager keyword mutations currently branch on main list mode` | pass | Keyword add/comment/delete/exact mutate whitelist or blocklist paths based on `state.mode`. | List target inference |
| `StateManager channel add currently chooses persistent background action from mode` | pass | Channel add chooses `addWhitelistChannelPersistent` or `addChannelPersistent` from `state.mode`. | List target inference |
| `StateManager channel remove and Filter All currently branch on mode and reject Filter All in whitelist` | pass | Channel deletion branches by mode and Filter All/comment-derived channel toggles return false in whitelist mode. | Whitelist action gap |
| `popup and tab-view currently send FilterTube_SetListMode with copyBlocklist` | pass | Both primary UI surfaces ask for copy intent and send it to background. | UI/background contract |
| `subscription import flow currently enables whitelist with copyBlocklist false` | pass | Subscription import explicitly asks background to enable whitelist without copying blocklist entries. | Import/list-mode boundary |
| `background currently reads copyBlocklist but merges blocklist into whitelist whenever whitelist is requested` | pass-current-gap | Background reads `copyBlocklist` but normal whitelist switching still calls merge-and-clear unconditionally. | Settings mutation drift |
| `background whitelist transfer currently moves whitelist back into blocklist and clears whitelist arrays` | pass | The reverse transfer path merges allow lists into block lists and clears allow arrays. | Mode transfer baseline |
| `settings_shared ordinary save currently writes canonical main lists but does not own list mode switch` | pass | Ordinary settings save writes canonical main `channels`/`keywords` but does not set main mode or whitelist arrays. | Persistence authority split |

## Initial DOM Target / Selector Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `quick-block card selector covers watch-card and playlist surfaces but is disabled in whitelist mode` | pass | Quick-block source includes watch-card and playlist targets, and the feature is disabled in whitelist mode. | DOM target baseline |
| `native dropdown targeting prefers comment context before watch or playlist fallbacks` | pass | Native menu context resolution chooses comment containers before broader watch/playlist wrappers, and includes post renderers. | False-target prevention |
| `fallback 3-dot scan currently omits post renderers even though native dropdown targeting includes them` | pass-current-gap | The fallback insertion scan covers playlists/comments/mobile cards but omits `ytd-post-renderer` and mobile post renderers. | Channel post menu gap |
| `fallback 3-dot scan currently gates native overlays but not list mode or showBlockMenuItem` | pass-current-gap | The fallback scan checks native overlay quiet mode, but it can still scan without the whitelist/showBlockMenuItem gates used by the primary dropdown injection path. | Affordance lifecycle overwork |
| `normal dropdown injection has whitelist and showBlockMenuItem gates` | pass | The primary menu injection path exits in whitelist mode and when `showBlockMenuItem === false`, and clears existing injected menu state. | Affordance gate baseline |
| `fallback playlist menu button currently opens without list-mode or showBlockMenuItem gate` | pass-current-gap | The fallback button click opens the FilterTube popover without checking `currentSettings.listMode`, `showBlockMenuItem`, or `isQuickBlockEnabled()`. | Split affordance authority |
| `fallback playlist menu rows currently bind block actions without list-mode or showBlockMenuItem gate` | pass-current-gap | Fallback rows bind `performBlock(...)` actions without the gate used by the normal injected dropdown path. | Split affordance authority |
| `playlist selected-row detection is present, and current-watch owner block hides the selected playlist row` | pass-current-behavior | Selected playlist row detection exists, and current-watch owner blocking can mark and hide the selected row. This needs product-policy verification before changing playlist behavior. | Playlist selected-row risk |
| `clicked content hide target has shorts-specific handling and generic lockup parent scoping` | pass | Clicked hide targeting has Shorts-specific parent scoping and generic lockup parent scoping. | Hide-target baseline |
| `DOM fallback active predicate currently treats raw content and category enabled flags as active` | pass-current-gap | `hasActiveDOMFallbackWork()` wakes on raw `duration/uploadDate/uppercase/category.enabled` flags without validating inner predicate values. | Active-predicate overwork |
| `DOM fallback category card logic requires selected categories before metadata fetch scheduling` | pass | Per-card category metadata fetch is guarded by `selected.length > 0`, so category enabled-empty is mainly a wakeup/scan cost at this layer. | Category predicate boundary |
| `DOM fallback upload-date logic can schedule metadata before validating blank date predicates` | pass-current-gap | Upload-date metadata fetch scheduling occurs before the later valid-date `needsTimestamp` guard, so blank date settings can still fetch metadata. | Active-predicate fetch risk |
| `DOM fallback duration logic uses zero threshold for longer and shorter comparisons` | pass-current-gap | DOM fallback duration logic uses `0` fallback thresholds for `longer`/`shorter`, matching the engine-side zero-threshold risk. | False-hide risk |
| `DOM fallback keyword normalization currently accepts one-sided word boundary matches` | pass-current-gap | The normalized keyword fallback returns true when either the left or right side has a boundary, not both sides. | Keyword false-hide risk |
| `DOM fallback members-only badge host selector currently includes watch primary containers` | pass-current-gap | Members-only badge fallback can choose `ytd-watch-flexy`, `ytd-watch-metadata`, or `ytd-video-primary-info-renderer` as hide hosts and can hide parent shelves. | Broad container hide risk |

## DOM Route Scope Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `DOM route-scope audit documents current selector authority gaps and future rule` | pass | The focused route-scope audit documents global selector constants, ignored capture boundaries, split menu gates, Kids/recycled-node safety, and the future selector owner record. | Selector authority coverage |
| `VIDEO_CARD_SELECTORS currently mixes desktop mobile Kids and YTM tags in one global selector` | pass-current-gap | One global card selector currently mixes desktop, watch-card, radio/Mix, mobile YTM, and YouTube Kids tags with no route/surface registry. | Route/surface over-scan risk |
| `ensureVideoIdForCard has Kids and recycled-node stale marker guards to preserve` | pass | The DOM extractor intentionally avoids fast stamped-video returns for Kids/recycled high-risk tags and clears stale FilterTube identity/hide markers. | Recycled-node false-hide prevention |
| `applyDOMFallback uses global card selectors after active-work gate and only has local route cleanup` | pass-current-gap | DOM fallback has an active-work gate and `/feed/channels` cleanup, but then scans `VIDEO_CARD_SELECTORS` globally and lacks a route budget/selector registry. | Route-irrelevant scan cost |
| `quick-block has mobile watch-next gates but broad shared host and hide-target resolvers` | pass-current-gap | Quick-block has a focused `m.youtube.com` watch-next gate, but host/hide-target resolvers remain broad shared card selectors. | Affordance false-target risk |
| `primary menu injection and fallback menu scan currently use split action gates` | pass-current-gap | Primary dropdown injection checks whitelist and `showBlockMenuItem`; fallback scan checks native overlay quiet mode but not list mode or action visibility. | Split action authority |
| `playlist and Mix DOM identity guards are localized safety behavior that must be preserved` | pass | Playlist rows without explicit authors clear stale identity, lockup metadata text is not trusted as a channel name, and Mix cards clear collaborator metadata. | Anti-false-block baseline |
| `watch playlist and members-only selectors remain route-sensitive broad hide candidates` | pass-current-gap | Selected playlist rows and members-only badge host selectors still include watch/metadata containers that can affect broad UI surfaces. | Broad route-sensitive hide risk |

## Selector Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `selector authority audit documents source counts evidence boundary and future gate` | pass | The audit records selector counts, source/evidence boundary, high-risk selector families, future `selectorAuthority`, and raw-capture handling. | Selector authority coverage |
| `current tracked non-vendor JavaScript selector API counts match the audit` | pass | Current tracked non-vendor source has 643 selector API call sites across 11 files, with exact per-file and per-method counts. | Source-count drift |
| `page runtime owns the majority of current selector call sites` | pass-current-gap | Page runtime owns 490 selector call sites, extension UI owns 90, and legacy/supporting `layout.js` owns 63. | Page-runtime lag/false-hide risk |
| `selector inventory and renderer inventory are evidence maps rather than runtime authority` | pass | The static selector inventory, renderer inventory, JSON path encyclopedia, and raw captures are evidence maps, not runtime selector proof. | Inventory overclaim risk |
| `global card selector currently mixes surfaces before selectorAuthority exists` | pass-current-gap | `VIDEO_CARD_SELECTORS` mixes Main desktop, watch cards, radio, mobile/YTM, and Kids tags, and product source has no `selectorAuthority` token. | Global selector drift |
| `selector authority audit names the P0 fixture wall before selector behavior changes` | pass | The future fixture wall names route/action splitting, no-rule zero scans, quick-block/menu gates, watch/member boundaries, Kids/YTM gates, legacy layout quarantine, inventory status, and raw capture extraction. | Future behavior gate |

## Storage Key Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `storage key authority audit documents access counts split watch lists and future gate` | pass | The audit records storage access count, split watch lists, future `storageKeyAuthority`, and ignored-capture boundary. | Storage authority coverage |
| `current tracked non-vendor storage access counts match the audit` | pass | The current tracked non-vendor source has 72 storage access call sites across eight files. | Storage source surface |
| `background compiler reads more storage keys than background invalidation watches` | pass-current-gap | Background compile reads keys such as `videoChannelMap`, `videoMetaMap`, exactness, extra keywords, and watch flags that background invalidation does not watch. | Cache invalidation drift |
| `content bridge has map-only refresh policy that differs from background invalidation` | pass-current-gap | Content bridge watches learned maps and avoids forced DOM reprocess for video map-only changes, but this policy is local rather than central. | Map refresh drift |
| `StateManager external reload list is a third storage-key authority` | pass-current-gap | UI reload watches a different key list, includes legacy `stats`, and omits `videoChannelMap`, `videoMetaMap`, `contentFilters`, `categoryFilters`, and `statsBySurface`. | UI/runtime stale state |
| `shared settings load keys and future storage authority gates are explicit` | pass-current-gap | Shared settings load is UI-oriented and product source has no `storageKeyAuthority` token yet. | Settings key boundary |

## Engagement Side-Effect Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `engagement side-effect audit documents observable effect owners and future budget contract` | pass | The focused audit documents click, fetch, scroll, pause, and map-write side-effect owners plus the future owner/budget record. | Side-effect authority coverage |
| `card prefetch queue uses observer scheduling, de-dupe, queue cap, and concurrency budget` | pass | Card identity prefetch is observer-driven, de-duped for 30 seconds, capped at 10 queued items, and limited to concurrency 2. | Prefetch performance budget |
| `normal card prefetch currently avoids direct YouTube network fetches and uses DOM or ytInitialData search` | pass | `prefetchIdentityForCard()` uses saved maps, DOM extraction, and main-world `ytInitialData` search; it does not directly call `fetch()`. | No-network prefetch baseline |
| `whitelist pending hide can queue card identity prefetch before hiding unresolved cards` | pass-current-gap | Whitelist pending hide performs identity prefetch before marking unresolved cards hidden/pending. | Whitelist identity work budget |
| `watch metadata fetch performs direct YouTube watch HTML fetch for metadata extraction` | pass-current-gap | Metadata fallback can fetch `https://www.youtube.com/watch?v=...` HTML and parse player metadata. | YouTube-visible request risk |
| `legacy shorts and watch identity fallbacks still have direct page fetch paths` | pass-current-gap | Legacy identity fallbacks can fetch `/shorts/...` and `/watch?v=...` HTML when other resolvers fail. | YouTube-visible request risk |
| `current watch owner block can pause playback and synthetic-click playlist or player next targets` | pass-current-gap | Current-watch owner blocking can pause video, hide the selected playlist row, click alternate playlist links, open a collapsed panel, click next, or hide the watch shell. | Synthetic navigation/playback risk |
| `playlist navigation guards synthesize click-based skip behavior on blocked next entries` | pass-current-gap | Playlist next/ended guards and selected-row handling can prevent default behavior, pause/reset video, and click alternate links/buttons. | Synthetic playlist engagement risk |
| `subscription import main-world path is explicitly user-requested but performs scroll click and YouTubei fetch work` | pass | Subscription import intentionally scrolls/clicks/fetches, and must stay gated to explicit import requests. | Explicit import side-effect boundary |

## Engagement Budget Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `engagement budget audit documents recommendation-risk boundaries and blocked verdict` | pass | The engagement-budget audit is current-behavior proof only and explicitly keeps implementation changes blocked. | Recommendation-risk authority coverage |
| `product source still lacks one central engagement side-effect authority contract` | pass-current-gap | Product source has no central `engagementSideEffectAuthority`, `observableSideEffectBudget`, `sideEffectBudget`, or `maxPerNavigation` contract. | Missing side-effect budget |
| `engagement_side_effect_normal_prefetch_is_no_network_today but still owns observer and map-write work` | pass | Normal card identity prefetch remains no-network today, but still owns observer scheduling, queueing, identity stamping, map writes, and fallback reruns. | No-network prefetch CPU/storage budget |
| `engagement_side_effect_whitelist_pending_prefetches_before_hide_today` | pass-current-gap | Whitelist pending hide can prefetch identity before hiding unresolved cards. | Whitelist pending side-effect budget |
| `engagement_side_effect_watch_metadata_fetch_lacks_budget_today` | pass-current-gap | Watch metadata extraction can fetch watch HTML without one shared per-navigation side-effect budget. | YouTube-visible fetch risk |
| `engagement_side_effect_identity_fallback_fetch_lacks_budget_today` | pass-current-gap | Legacy watch/Shorts identity fallback can fetch page HTML without one shared per-navigation side-effect budget. | YouTube-visible fetch risk |
| `engagement_side_effect_current_watch_block_can_click_and_pause_today` | pass-current-gap | Current-watch blocking can pause playback and synthesize playlist/player clicks. | Synthetic playback/navigation risk |
| `engagement_side_effect_playlist_guard_can_click_and_pause_today` | pass-current-gap | Playlist guards can pause/reset video and synthesize alternate playlist clicks. | Synthetic playlist engagement risk |
| `engagement_side_effect_subscription_import_is_user_action_but_observable_today` | pass | Subscription import is explicit user action but still performs observable scroll/click/fetch work that needs separate authority. | Explicit import side-effect boundary |
| `engagement_side_effect_hide_helper_media_pause_is_not_separated_from_skipstats_today` | pass-current-gap | Shared hide/media helper behavior couples visual hiding with media pause/stop side effects rather than a separate side-effect authority. | Hide/media coupling |

## Empty-Install Performance Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `empty-install performance audit documents no-rule work and required future gates` | pass | The focused audit documents the empty-install definition, no-rule work map, and future compiled-rule/endpoint/lifecycle gates. | Empty-install authority coverage |
| `empty blocklist is not zero-work for mobile browse player watch-next and guide endpoints` | pass-current-gap | Mobile browse, player, watch-next, and guide endpoints call `processData` with no active rules. | Endpoint no-rule cost |
| `empty blocklist fast paths still parse stringify and harvest instead of true pass-through` | pass-current-gap | Search and desktop home avoid mutation but still parse/stringify and harvest identity. | Harvest-only no-rule cost |
| `disabled filtering avoids engine work but still parses and rebuilds intercepted YouTubei responses` | pass-current-gap | Disabled settings avoid engine work only after response clone/parse/rewrite overhead. | Disabled pass-through gap |
| `DOM fallback empty blocklist predicate is inactive but initialization still installs lifecycle work` | pass-current-gap | DOM fallback active predicate is not the full lifecycle owner; initialization still attaches mutation and prefetch machinery. | DOM lifecycle no-rule cost |
| `quick block action is disabled by default but lifecycle setup still precedes enabled guards` | pass-current-gap | Quick-block lifecycle installs styles, listeners, observer, and route sweep scheduling before enabled gates. | Quick-block no-rule cost |
| `fallback menu lifecycle installs scans without sharing normal menu action gates` | pass-current-gap | Fallback menu scanning does not share normal menu whitelist or `showBlockMenuItem` gates. | Fallback menu no-rule cost |
| `blank enabled category and content filters are treated as active before value validation` | pass-current-gap | Raw enabled flags wake work before selected categories, dates, and thresholds are validated. | Blank-settings active drift |

## CSS / Style Hide Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `CSS style hide audit documents live style authority and quarantined legacy CSS` | pass | The focused audit distinguishes manifest CSS, packaged legacy CSS, runtime hide helper CSS, dynamic content-control CSS, and fallback menu CSS. | CSS authority coverage |
| `current manifests do not load CSS content scripts on YouTube surfaces` | pass | Current manifests content-load JS only; no CSS file is directly injected by the manifest. | Live false-hide boundary |
| `release build still packages css directory even though content CSS is not manifest-loaded` | pass-current-gap | `build.js` copies `css/` into release ZIPs even though legacy content CSS is not manifest-loaded. | Release quarantine risk |
| `legacy CSS files use old default-hide and filter-tube-visible reveal model` | pass-current-gap | `filter.css`, `content.css`, and `layout.css` still carry default-hide / `.filter-tube-visible` reveal assumptions. | Accidental reactivation risk |
| `active runtime hide helper injects current filtertube-hidden model and not legacy reveal CSS` | pass | The active central helper uses `.filtertube-hidden` and `.filtertube-hidden-shelf`, not default-hide. | Current runtime baseline |
| `dynamic content-control style can own broad content hides and must be tied to settings` | pass-current-gap | DOM fallback can dynamically create broad display-none rules for open-app buttons, home/feed, playlists, Mix, members-only, comments, watch UI, and end-screen controls. | Dynamic CSS false-hide risk |
| `fallback menu style is dynamically injected but does not contain content hide rules` | pass | Fallback menu style is a UI affordance style, not a content-hide stylesheet. | Low-risk style lifecycle |

## Page Runtime Lifecycle Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `page runtime lifecycle authority audit documents the current owner families and future rule` | pass | The focused lifecycle authority audit documents the page-resident owner families and the future lifecycle contract. | Lifecycle authority coverage |
| `page runtime currently has no shared lifecycle registry symbol across page-resident source` | pass-current-gap | Page-resident source does not currently expose a shared registry for observers, listeners, timers, teardown, or pause ownership. | Split lifecycle authority |
| `seed XHR interception patches prototypes for page lifetime without a restore owner` | pass-current-gap | XHR prototype methods are wrapped and original methods are stored, but there is no restore owner in the current seed interception block. | Prototype lifetime / endpoint overwork |
| `content bridge prefetch lifecycle owns anonymous listeners without a shared removal owner` | pass-current-gap | Prefetch/hydration owns IntersectionObserver, visibility, scroll, mutation, and navigate-finish lifecycle work without remove-owner wiring for the anonymous listeners. | Harvest/hydration overwork |
| `fallback menu scan lifecycle has mutation, navigation, click, scroll, and warmup work but no teardown owner` | pass-current-gap | Fallback menu scanning has a body observer, navigation/click/scroll listeners, and bounded warmup timer, but no shared teardown owner for the installed lifecycle. | Hidden affordance scan cost |
| `quick block lifecycle installs viewport work before its first enabled guard and lacks interval cleanup` | pass-current-gap | Quick-block setup installs global focus/resize/orientation lifecycle work before the first enabled guard, and its periodic sweep has no clear path. | Disabled affordance / fullscreen churn |
| `normal and Kids menu observer lifecycles have split owners without shared teardown` | pass-current-gap | Normal 3-dot and Kids passive block paths install separate click/mutation observer lifecycles without a shared teardown authority. | Menu lifecycle drift |
| `DOM fallback installs playlist and media guards once without local removal paths` | pass-current-gap | Playlist next/prev and video-ended guards install once and can trigger media pause/navigation side effects without local removal paths. | Route-scoped side effects |
| `collaborator dialog lifecycle installs global trigger listeners and a document observer without teardown` | pass-current-gap | Collaborator extraction installs capture-phase trigger listeners and a document observer after DOMContentLoaded without removal/disconnect ownership. | Collaboration observer overwork |

## Repo Lifecycle Primitive Coverage Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `repo lifecycle primitive coverage documents the tracked JS source boundary` | pass | The lifecycle coverage doc uses `git ls-files '*.js' '*.jsx' '*.mjs'` and pins the current JS source count at 63 files. | Lifecycle source boundary |
| `every tracked JS JSX and MJS file is lifecycle-classified` | pass | Every tracked JS/JSX/MJS file is assigned to content runtime, UI/background, website, generated, vendor, build, or quarantine lifecycle families. | Unclassified lifecycle source |
| `repo-wide lifecycle primitive totals match current tracked source` | pass | The current tracked JS surface has 830 conservative lifecycle/side-effect primitives, including listeners, observers, timers, fetch/XHR, messages, synthetic events/clicks, display writes, and class mutations. | Lifecycle primitive drift |
| `lifecycle primitive family totals pin page runtime UI website vendor and quarantine burden` | pass-current-gap | UI/background files have 417 lifecycle/side-effect primitives, content runtime has 347, quarantined legacy JS has 37, and website/vendor/generated families are separately counted. | Non-page lifecycle burden |
| `hot lifecycle files and teardown imbalance are documented as current audit findings` | pass-current-gap | `js/tab-view.js`, `js/content_bridge.js`, `js/content/block_channel.js`, and `js/layout.js` are pinned as hot lifecycle files; listener/timer setup greatly exceeds teardown primitives. | Teardown imbalance / side-effect burden |

## Active Rule Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `active-rule authority audit documents every split active predicate family` | pass | The audit records seed JSON, DOM fallback, DOM lifecycle, quick block, normal menu, fallback menu, settings compile, invalidation, list-mode, and V4 alias active-state families. | Active authority coverage |
| `seed active predicate currently treats strict content booleans and selected categories as JSON-active` | pass-current-gap | Seed active work requires `contentFilters.*.enabled === true` and selected category values, but still does not validate date or duration thresholds before admitting JSON work. | JSON active-predicate overwork |
| `DOM fallback active predicate currently differs from seed and validates less than per-card logic` | pass-current-gap | `hasActiveDOMFallbackWork()` wakes on whitelist mode and raw enabled flags; per-card category work later requires `selected.length > 0`, proving page-level and card-level predicates differ. | DOM active-predicate drift |
| `quick block action gate and quick block lifecycle gate are currently separate` | pass-current-gap | `isQuickBlockEnabled()` has a real action gate, but setup installs styles, listeners, observer, and interval before the first enabled guard. | Disabled feature lifecycle cost |
| `normal and fallback menu action surfaces currently use different gates` | pass-current-gap | Normal dropdown injection checks whitelist and `showBlockMenuItem`; fallback scan/button code checks quiet overlay state but not list mode or menu visibility. | Split affordance authority |
| `settings compile currently passes raw content and category objects without a compiled active-state report` | pass-current-gap | Background compilation stores raw `contentFilters` and `categoryFilters` on compiled settings without a normalized `compiledRuleState` or valid-rule booleans. | Settings predicate drift |
| `list-mode and alias behavior can currently make saved UI intent diverge from compiled active state` | pass-current-gap | Whitelist mode transition ignores `copyBlocklist:false`, and background compile can prefer stale `blocked*` aliases while shared save writes canonical `keywords/channels`. | Mode and schema alias drift |

## Content / Category Predicate Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `content predicate authority audit documents split activation and decision families` | pass | The audit covers duration, upload date, uppercase, categories, boolean surface controls, activation/decision drift, settings transport, and future `contentPredicateAuthority` gates. | Predicate authority coverage |
| `seed endpoint activation currently treats strict content booleans and selected categories as active work` | pass-current-gap | Seed endpoint activation wakes on strict content-filter booleans and selected categories, but still lacks date and duration-threshold validation. | Endpoint overwork / blank predicate cost |
| `engine category decision currently validates selected categories after raw settings normalization` | pass | Final category hide decisions require non-empty selected values even though activation can occur earlier. | Engine decision boundary |
| `engine duration and upload-date predicates currently validate too late for activation` | pass-current-gap | Duration and upload-date branches validate thresholds/dates only after activation; `longer` with zero threshold remains broad. | Broad/incomplete predicate risk |
| `DOM fallback currently shares selected-category activation but still lacks one compiled predicate` | pass-current-gap | Top-level DOM fallback and per-card category logic now both require selected values, while content-filter date/duration validity and route scope remain split. | Split DOM predicate authority |
| `DOM upload-date path currently schedules metadata before final valid cutoff decision` | pass-current-gap | DOM upload-date can schedule video metadata work before proving the final cutoff is valid. | Metadata/pending work overrun |
| `content/category settings transport currently uses duplicated save paths and noncanonical refresh keys` | pass-current-gap | Main/Kids content save logic is duplicated, legacy settings keys omit content/category objects, and bridge refresh keys include `contentFilters` but omit `categoryFilters`. | Settings invalidation drift |

## Renderer Authority Gap Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `renderer authority gap audit documents the current high-risk leak and false-hide families` | pass | The focused renderer audit documents the prioritized leak/false-hide families before JSON rule changes. | Renderer gap coverage |
| `compactPlaylistRenderer is unwrapped from richItemRenderer but still has no direct FILTER_RULES entry` | pass-current-gap | `richItemRenderer` unwraps compact playlist content, but the unwrapped renderer still has no direct rule; synthetic and extracted YTM fixtures prove pass-through. | Playlist/YTM leak |
| `collaboration extraction currently handles showDialogCommand but not showSheetCommand in filter logic` | pass-current-gap | Docs identify `showSheetCommand.sheetViewModel` as the modern collaborator source, while `filter_logic.js` currently extracts dialog rosters only. | Collaboration leak |
| `direct watch-card renderer gaps are distinct from the covered universal watch-card wrapper` | pass-current-gap | Universal wrapper and compact watch-card video are covered; direct rich header, hero, and RHS panel video renderers still have no direct JSON rules. | Watch-card leak |
| `shorts, reel, and lockup owner identity gaps are fixture-backed against documented paths` | pass-current-gap | Shorts/Reel title matching works, and a reduced active overlay fixture proves owner UC/handle evidence exists in raw Shorts JSON, but `reelPlayerOverlayRenderer` and several lockup owner paths are still not direct rule coverage. | Owner identity leak |
| `broad container and avatar-stack false-hide risks are pinned to source and fixtures` | pass-current-gap | Whole-object renderer removal plus shelf/rich-shelf rules can hide non-matching children; generic avatar-stack collaborator extraction can falsely apply to Mix/Radio. | False-hide risk |
| `gridVideoRenderer duplicate rule and missing community/search renderer rules remain current gaps` | pass-current-gap | `gridVideoRenderer` is defined twice, and community/search/channel metadata renderer families still pass through without direct rules. | Docs/code drift and leak |

## P0 Renderer Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 renderer authority audit documents fixture families and blocked verdict` | pass | The P0 renderer slice names compact playlist, show-sheet collaborator, direct watch-card, Shorts owner, Mix avatar-stack, shelf-title, and inventory-proof fixture families and keeps the implementation gate closed. | P0 renderer gate |
| `renderer_authority_compact_playlist_blocklist_and_whitelist_gap is capture-backed today` | pass-current-gap | A captured YTM `compactPlaylistRenderer` is not JSON-authoritative: matching blocklist rules pass through, and whitelist miss/match states also preserve the renderer because no direct rule owns it. | Playlist leak / whitelist ambiguity |
| `renderer_authority_show_sheet_collaborator_blocklist_and_whitelist_gap is capture-backed today` | pass-current-gap | A captured `videoWithContextRenderer` with `showSheetCommand` collaborator identity leaks a blocked collaborator in blocklist mode and is removed in whitelist mode even when the collaborator is allowed. | Collaboration leak and whitelist false-hide |
| `renderer_authority_direct_watch_card_parts_gap passes through blocklist and whitelist today` | pass-current-gap | Direct `watchCardRichHeaderRenderer` payloads are not removed by matching keyword/channel blocklist rules and are not positively validated in whitelist mode. | Watch-card renderer gap |
| `renderer_authority_shorts_owner_identity_gap blocks title but misses below-thumbnail owner today` | pass-current-gap | `shortsLockupViewModel` can block title keyword matches, but channel-only rules do not use `belowThumbnailMetadata` owner identity and whitelist owner matches can still fail closed. | Shorts owner identity gap |
| `renderer_authority_mix_avatar_stack_false_hide_gap removes a generated radio mix today` | pass-current-gap | A generated `radioRenderer` Mix with multiple avatar-stack entries can be removed by a channel rule because generic avatar-stack extraction treats it like collaborator identity. | Mix false-hide risk |
| `renderer_authority_shelf_title_container_false_hide_gap removes nonmatching children today` | pass-current-gap | A matching `shelfRenderer` title removes the whole shelf container, including nonmatching child videos. | Broad container false-hide |
| `renderer_authority_grid_duplicate_and_search_refinement_gaps remain source-pinned` | pass-current-gap | `gridVideoRenderer` remains duplicated, while search refinement, horizontal list, compact playlist, and direct watch-card renderer keys have no direct rules. | Renderer docs/source drift |
| `renderer_authority_inventory_claims_need_fixture_status remains true today` | pass-current-gap | Inventory wording can say primary/implemented while runtime proof is narrower; inventory rows remain fixture backlog, not runtime authority. | Inventory truth boundary |

## Initial Capture Corpus Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `ignored raw capture corpus is explicitly excluded from release source` | pass | Required raw YouTube capture files are listed in `.gitignore`, so they are audit evidence rather than package/source inputs. | Release-source boundary |
| `fixture candidate matrix maps ignored capture families to proof obligations` | pass | The fixture matrix ties raw capture families to renderer, endpoint, and DOM proof duties. | Audit traceability |
| `runtime audit treats renderer inventories as proof source rather than coverage claims` | pass | Renderer inventories are documented as fixture source material, not as proof that runtime already covers every path. | Documentation truthfulness |
| `local ignored captures currently contain source material for high-risk renderer fixtures when present` | pass | Present local captures include tokens for watch/end-screen, comments, Shorts/reels, playlist DOM, collaborator roster, YTM, and Kids fixture extraction. | Evidence-corpus availability |

## Extracted Capture Fragment Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `extracted YTM compactPlaylistRenderer currently passes through keyword and channel rules` | pass-current-gap | A real `compactPlaylistRenderer` extracted from `YTM.json` is not filtered by captured title or creator channel rules. | YTM playlist leak / JSON renderer gap |
| `extracted Main collaboration videoRenderer currently blocks by secondary showDialog collaborator id` | pass | A real `videoRenderer` extracted from `collab.json` blocks when a secondary collaborator in a `showDialogCommand` roster matches a channel rule. | Collaborator roster baseline |
| `extracted YTM showSheet videoWithContextRenderer currently passes through collaborator channel rules` | pass-current-gap | A real `videoWithContextRenderer` extracted from `YTM-XHR.json` carries a `showSheetCommand.sheetViewModel` collaborator roster, but a matching collaborator channel rule does not remove it today. | Collaboration leak risk |
| `extracted Kids compactVideoRenderer currently blocks by kidsVideoOwnerExtension channel id` | pass | A real YouTube Kids `compactVideoRenderer` extracted from `YT_KIDS.json` blocks by `kidsVideoOwnerExtension.externalChannelId`. | Kids JSON owner baseline |
| `Kids compact blocklist decision removes matching owner and preserves sibling` | pass | A real Kids public-web `compactVideoRenderer` sibling pair extracted from `yt_kids_latest.json` filters by `kidsVideoOwnerExtension` owner identity, preserves a nonmatching sibling, and queues video/channel map side effects. | Kids public-web JSON owner baseline |
| `Kids browse blocklist removes matching compact video while owner rail remains visible` | pass-current-gap | A parseable Kids browse fragment extracted from malformed `ytkids_browse?alt=json.json` filters compact videos by owner while `kidsSlimOwnerRenderer` owner rail entries remain visible in blocklist and whitelist modes. | Kids owner-rail JSON renderer gap |
| `extracted active Shorts reel overlay carries owner identity but is not direct rule coverage today` | pass-current-gap | A reduced active `reelPlayerOverlayRenderer` from `reel_item_watch?prettyPrint=False.JSON` carries owner UC id, handle, and avatar evidence, but matching channel rules preserve the wrapper because no direct rule owns that renderer today. | Shorts owner identity gap |
| `extracted YTM endScreenVideoRenderer currently blocks by captured title keyword` | pass | A real YTM `endScreenVideoRenderer` extracted from `YTM-XHR.json` uses the direct end-screen rule and blocks by captured title. | End-screen baseline |
| `extracted classic commentThreadRenderer currently hides when hideAllComments is enabled` | pass | A real classic `commentThreadRenderer` extracted from `comments.json` is removed under `hideAllComments`. | Comment hide-all baseline |
| `extracted modern commentViewModel thread currently hides when hideAllComments is enabled` | pass | A real modern `commentThreadRenderer` with nested `commentViewModel` from `YT_MAIN_next?prettyPrint.json` is removed under `hideAllComments`. | Modern comment baseline |
| `hideAllComments removes modern thread wrappers but preserves header and continuation item` | pass | A real `/youtubei/v1/next` reload response extracted from `YT_MAIN_NEXT.json` removes modern comment thread wrappers while preserving the comments header and continuation sibling. | Modern comment reload baseline |
| `extracted playlist selected-row DOM fixture contains current row markers and action menu` | pass | A selected row extracted from `playlist.html` contains the selected marker, watch URL, title/byline, and action menu. | Selected playlist DOM baseline |
| `extracted collaboration mix selected-row DOM fixture carries FilterTube channel markers` | pass | A selected row extracted from `collab_in_playlist_mix.html` carries `data-filtertube-video-id`, `data-filtertube-channel-id`, selected state, and byline text. | Selected playlist / current-row risk |
| `extracted collaboration homepage avatar-stack fixture has incomplete collaborator identity` | pass-current-gap | A reduced card extracted from `collab_on_homepage.html` carries avatar-stack collaboration markup, display names, and a handle while collaborator UC IDs are blank. | Collaboration identity confidence |
| `extracted YTM DOM video card fixture pins owner link menu and quick-block anchor` | pass-current-gap | A reduced card extracted from `YTM-DOM.html` carries a Music DOM video card, canonical owner `/channel/UC...` link, video ID, native `ytm-menu-renderer`, and FilterTube quick-block anchor. | YTM DOM selector guardrail |
| `extracted YTM DOM post card fixture pins backstage author and action menu boundary` | pass-current-gap | A reduced post card extracted from `YTM-DOM.html` carries `ytm-backstage-post-thread-renderer`, `yt-post-header`, an author handle link, a `/post/...` permalink, and native post action menu with no FilterTube menu item already inserted. | Post menu insertion boundary |

## Source Surface Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `all manifest-loaded scripts are classified in the source surface inventory` | pass | Every script loaded by root/Chrome/Firefox/Opera manifests is listed in the source surface inventory. | Audit coverage gap |
| `manifest web-accessible runtime files are classified in the source surface inventory` | pass | Every web-accessible runtime file in the manifests is listed in the source surface inventory. | Injection/versioning gap |
| `extension page script and stylesheet dependencies are classified in the source surface inventory` | pass | Popup, dashboard, and troubleshoot local JS/CSS references are listed in the source surface inventory. | UI dependency audit gap |
| `generated extension shell source inputs are classified in the source surface inventory` | pass | `src/extension-shell/popup.jsx`, `src/extension-shell/tab-view-decor.jsx`, and `src/extension-shell/shared/runtime.js` are listed as real generated-shell source inputs, not just generated output noise. | Generated source/output drift |
| `extension page static image dependencies are covered by static asset families` | pass | Dashboard icon/app-card images are covered by the packaged static asset families in the inventory. | Static asset / release package drift |
| `content manifests currently do not load CSS content scripts` | pass | Current manifests do not inject CSS directly into YouTube content pages. | Legacy default-hide CSS boundary |
| `legacy YouTube default-hide CSS is quarantined in the source surface inventory` | pass | `filter.css`, `content.css`, and `layout.css` are explicitly classified as quarantined legacy/default-hide CSS. | False-hide release asset risk |
| `build and sync scripts are classified in the source surface inventory` | pass | Build, vendor, compression, and native runtime sync scripts are listed in the source surface inventory. | Release/sync audit gap |
| `extension build packages the same source families and excludes local filesystem junk` | pass | `build.js` packages `js/css/html/icons/data/assets` plus common docs and excludes `.DS_Store`, `Thumbs.db`, `._*`, and `__MACOSX` at copy/zip time. | Release package hygiene |
| `public website source files are classified without treating build caches as product source` | pass | Next app routes, website components, public media, and website build/config files are explicitly listed in the source inventory. | Website/release claim audit gap |
| `local website build output and dependency caches are classified as excluded audit noise` | pass | Present local `website/.next`, `website/node_modules`, `website/.vercel`, and dotfile artifacts are excluded from product-source accounting. | Generated/dependency noise boundary |

## Source Boundary Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `source boundary audit documents tracked source, raw evidence, generated output, and audit artifacts` | pass | The source-boundary audit records the difference between `git ls-files`, ignored raw captures, ignored generated output, and current audit artifacts. | Source/evidence confusion |
| `root raw capture evidence is ignored and untracked even when present locally` | pass | Representative root captures, including Main/YTM/Kids/playlist/collab/whitelist scratch files, are present locally but ignored and not tracked as source. | Raw capture leakage / over-auditing |
| `generated build output and dependency caches are ignored and untracked` | pass | `dist/`, `node_modules/`, `website/.next/`, and website dependency caches are ignored generated/dependency output, not source authority. | Generated package / dependency noise |
| `current nonignored untracked files are audit artifacts only` | pass | Current nonignored untracked files are limited to `docs/audit/FILTERTUBE_*.md` and `tests/runtime/**`, so no accidental product source is hiding in the audit worktree. | Worktree hygiene |

## Raw Capture Release Boundary Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `raw capture release boundary audit documents evidence-only status and blocked verdict` | pass | The slice documents current-behavior proof only, unchanged runtime/build/website/native behavior, and the future `rawCaptureReleaseBoundary` gate. | Raw-capture release boundary |
| `root raw captures are ignored and untracked when present locally` | pass | Every named raw capture from the current ignored corpus remains untracked and ignored. | Raw capture source leakage |
| `browser package script stages explicit roots and does not zip the repository root` | pass | Browser ZIPs are made from staged package roots/files, not from a repo-root archive that could sweep in ignored captures. | Package contamination |
| `active release and public source surfaces do not reference raw capture filenames` | pass | Active release scripts, manifests, website source, data, extension JS, and extension HTML do not reference raw capture filenames outside audit docs/tests. | Public claim / runtime contamination |
| `native sync manifest sources and destinations exclude raw captures` | pass | Native runtime sync sources/destinations do not include raw capture names. | App runtime contamination |
| `committed extracted capture fixtures are reduced fragments not raw corpus copies` | pass | Committed capture fixtures are small, renamed fragments rather than direct raw-corpus file copies. | Fixture hygiene |
| `product source has no rawCaptureReleaseBoundary implementation yet` | pass-current-gap | Product source does not yet implement the future raw-capture release-boundary authority. | Missing release-boundary manifest |

## Function Coverage Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `function coverage artifact is explicit that lexical function coverage is not complete yet` | pass-current-gap | The function coverage doc states the hot-path lexical map is not complete codebase function coverage and has a callable backlog. | Audit scope honesty |
| `every product-owned JS and MJS file is either mapped or listed as callable backlog` | pass | Every current JS/JSX/MJS file under `js`, `src`, `scripts`, `website/app`, and `website/components` is either in the hot function map or explicitly listed as not-yet-mapped. | Callable surface coverage gap |
| `current lexical function map covers the first hot runtime stack but excludes UI, website, vendor, and build families` | pass-current-gap | The first lexical function map covers the seed/injector/content_bridge/dom_fallback/block_channel/bridge_settings/handle_resolver/background/filter_logic stack, while UI, website, vendor, generated, and build families remain backlog. | Method-level audit backlog |

## Static / Generated / Vendor Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `static/generated/vendor audit accounts for every current surface family` | pass | Extension HTML, active UI CSS, quarantined YouTube CSS, generated shell source/output, vendor bundles, and release-note data are all cited in the static audit. | Static surface coverage gap |
| `extension HTML pages expose current dependency order and external request surfaces` | pass | Popup/dashboard dependency order is pinned, Google Fonts links are visible, dashboard external product/support links are visible, and `html/troubleshoot.html` is currently zero bytes. | Extension-page request/support drift |
| `quarantined YouTube CSS contains broad default-hide rules but is not manifest-loaded` | pass | Legacy CSS files still contain broad default-hide selectors and many `!important` rules, while current manifests do not load content CSS. | False-hide release asset risk |
| `generated shell source and generated output share markers but have no committed freshness manifest` | pass-current-gap | Source/output markers match today, but there is no committed generated-artifact or release manifest proving freshness. | Generated source/output drift |
| `vendor globals, staged release notes, and browser resource parity are pinned` | pass-current-gap | Nanah/QR globals exist, release notes stage `3.3.2` while package remains `3.3.1`, and Opera lacks the `icons/file.svg` web-accessible parity present in other manifests. | Vendor/version/browser parity drift |

## UI / Settings Callable Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `UI/settings callable audit accounts for every current UI settings source file` | pass | The first UI/settings callable pass covers all ten current UI/settings files and pins 621 lexical callables, including 311 in `js/tab-view.js`. | UI callable coverage gap |
| `UI/settings callable audit documents each public exported surface` | pass | `FilterTubeSettings`, `FilterTubeIO`, `FilterTubeNanahAdapter`, `FilterTubeSecurity`, `StateManager`, `RenderEngine`, `UIComponents`, and `FilterTubeContentControlsCatalog` are source-backed public surfaces in the audit doc. | Mutation surface authority |
| `UI/settings callable audit pins high-risk mutation and lifecycle patterns to current source` | pass-current-gap | Current source still contains save-drop, UI payload broadcast, swallowed profile persistence failures, read-path V4 writes, import breadth, Nanah direct V4 apply, row-level mutators, dual list-mode UI entry points, and dashboard timer patterns. | UI/settings reliability and performance |

## Content Helper Callable Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `content-helper callable audit accounts for every current content helper source file` | pass | The first content-helper callable pass covers eight helper files and pins 81 lexical callables across bridge injection, collaborator dialog, DOM extractors, DOM helpers, prompt scripts, menu CSS, and shared identity. | Content helper callable coverage gap |
| `content-helper callable audit documents each public and global surface` | pass | `injectMainWorldScripts`, `window.collabDialogModule`, DOM extractor globals, DOM hide helpers, prompt scripts, menu style helper, and `FilterTubeIdentity` are source-backed surfaces in the audit doc. | Helper surface authority |
| `content-helper callable audit pins high-risk bridge, selector, cache, and UI side effects` | pass-current-gap | Current source still accepts broad same-window `FilterTube_*` messages, trusts cached channel identity without a fresh href in some cases, uses broad card selectors, injects global hide/menu CSS, installs collaborator listeners/observer, and can overlap high-z-index prompts. | Identity poisoning, false-hide, and page-side UI/performance risk |

## Page Message Trust Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `page-message trust audit documents current receivers and state-changing messages` | pass | The trust audit covers `content_bridge.js`, `injector.js`, `bridge_settings.js`, `collab_dialog.js`, and the current state-changing `FilterTube_*` message types. | Page-message authority coverage |
| `content bridge currently accepts same-window FilterTube messages without nonce or origin proof` | pass-current-gap | `handleMainWorldMessages()` accepts same-window `FilterTube_*` messages and excludes only `source: "content_bridge"` before handling state-changing message types. | Spoofable page-message boundary |
| `state-changing map and dialog messages are not all tied to pending request ownership today` | pass-current-gap | Video-channel map, video-meta map, and dialog collaborator messages can persist maps, touch DOM, or apply collaborators without a universal pending request gate. | Identity poisoning / false-hide trigger |
| `FilterTube_Refresh currently lets same-window page messages force DOM fallback reprocessing` | pass-current-gap | A same-window refresh message calls `requestSettingsFromBackground()` and then `applyDOMFallback(..., { forceReprocess: true })` without request ownership, nonce, or source allowlist proof. | Page-triggered reprocessing |
| `main-world listeners use string source labels and wildcard postMessage responses today` | pass-current-gap | Injector, bridge settings, and collab dialog flows use string `source` labels and wildcard `postMessage(..., "*")` responses. | Source-label trust / replay boundary |

## Injector Settings Capability Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `injector settings capability audit documents current bridge flow and future contract` | pass | The focused audit documents the isolated/main-world settings flow, subscription import capability, and future revision/capability contract. | Injector/settings authority coverage |
| `bridge settings currently relays settings to injector without nonce capability token or revision` | pass-current-gap | Settings are posted to the main-world injector with `source: "content_bridge"` and wildcard target but no nonce, capability token, request id, or revision. | Page-message authority |
| `bridge settings currently has direct seed apply and retry in addition to injector relay` | pass-current-gap | The bridge both posts settings to injector and directly calls/retries `window.filterTube.updateSettings(settings)`. | Duplicate settings apply |
| `injector settings receiver currently merges payload and drains queue without revision gate` | pass-current-gap | Injector merges settings payload into `currentSettings`, updates seed, and drains queued data without a settings revision gate. | Runtime source drift |
| `injector updateSeedSettings currently can apply settings immediately and again after retry` | pass-current-gap | Injector can call `window.filterTube.updateSettings(currentSettings)` immediately or after a timer, with no last-applied revision check. | Duplicate reprocess risk |
| `seed updateSettings currently reprocesses queued and raw snapshots on every settings update` | pass-current-gap | Seed stores incoming settings and reprocesses queued data plus raw `ytInitialData` / `ytInitialPlayerResponse` snapshots without no-op/revision dedupe. | Empty/duplicate JSON work |
| `injector initialDataQueue stores revisionless process closures from the backup ytInitialData hook` | pass-current-gap | Backup `ytInitialData` hook stores process closures in `initialDataQueue` without queue limits or the settings revision that should process them. | Stale queue processing |
| `injector collaborator and channel lookups use source labels and wildcard responses` | pass-current-gap | Main-world collaborator/channel lookup requests use `source === "content_bridge"` and wildcard responses without a capability reason or active-rule/action token. | Identity lookup authority |
| `subscription import request currently uses requestId but no capability token across page message boundary` | pass-current-gap | Subscription import tracks a pending request id but does not authenticate the page-visible request with a capability/action token. | Import spoof boundary |
| `subscription import path currently owns scroll click and credentialed youtubei fetch side effects` | pass-current-gap | Import can scroll, dispatch scroll, click "More", and fetch `/youtubei/v1/browse` with credentials under bounded loops. | Explicit-action side effects |
| `bridge injection currently uses a fixed script list but background receives script names from caller` | pass-current-gap | The local bridge owner uses a fixed script list, but the background injection action still receives script names from the caller and fallback injection appends script tags. | Script injection authority |

## Import Export Nanah Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `import export Nanah audit documents current authority flow and future contract` | pass | The focused audit records the file import, encrypted import, scoped Nanah, trusted-state, and future dual-list migration contract. | Import/sync authority coverage |
| `saveProfilesV4 currently writes an empty payload for invalid profile state` | pass-current-gap | Invalid V4 profile data still results in a storage write call instead of a hard failure/no-op contract. | Persistence authority |
| `loadProfilesV4 currently can sanitize and write profiles during a read path` | pass-current-gap | A read helper can repair or create `ftProfilesV4` while callers are only loading. | Read/write lifecycle drift |
| `importV3 currently spans settings profiles maps theme and Nanah trusted state writes` | pass-current-gap | One import action can touch settings, V3, V4, learned channel map, theme, and Nanah trusted state. | Broad mutation surface |
| `importV3 currently catches V4 sync failures and can still return ok true` | pass-current-gap | A V4 sync failure is warned and swallowed before the success return. | Partial-success visibility |
| `importV3Encrypted currently drops targetProfileId while forwarding decrypted import options` | pass-current-gap | Encrypted imports do not expose the same target-profile contract as unencrypted imports. | Import option drift |
| `scoped Nanah apply currently writes V4 directly and returns no refresh or revision contract` | pass-current-gap | Scoped Nanah applies profile changes through `saveProfilesV4()` and relies on storage listeners for runtime convergence. | Sync/runtime convergence |
| `scoped Nanah replace currently uses safeArray for channel arrays instead of IO channel sanitizer` | pass-current-gap | Replacement scoped Nanah channel arrays have weaker normalization than IO imports. | Payload shape drift |
| `Nanah envelope extraction currently parses payload without app action or version validation` | pass-current-gap | Envelope parsing accepts the payload shape before checking FilterTube app id/action/version. | Envelope trust boundary |
| `Nanah preview mode currently returns parsed portable payload without applying writes` | pass | Preview is a safe existing path that can become the future required dry-run baseline. | Safe apply baseline |
| `trusted Nanah backup state restore is opt-in but writes trust and device state from backup payload` | pass-current-gap | Trusted state restore requires explicit auth but still writes trust/device values from backup data. | Trust-state portability |
| `settings invalidation key lists currently differ across shared settings background and StateManager` | pass-current-gap | Import/sync/runtime dependencies are split across different key lists. | Cache invalidation drift |

## Background Message Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `background message authority audit documents listeners guards mutations and raw evidence boundary` | pass | The focused audit documents the two background message listener shapes, guarded paths, unguarded/split mutation paths, injection/broadcast paths, and raw captures as evidence only. | Background message authority coverage |
| `background currently has two runtime message listeners with different action shapes` | pass-current-gap | `js/background.js` has one `request.action || request.type` listener and one `message.type` listener for channel menu actions. | Split message authority |
| `trusted UI guard coverage is present for several direct settings and whitelist actions` | pass | Session PIN, clear PIN, list-mode, whitelist add/import, Kids whitelist, and whitelist transfer paths currently use `isTrustedUiSender(sender)`. | Trusted UI baseline |
| `Kids block channel path currently lacks the trusted UI guard used by Kids whitelist` | pass-current-gap | Kids block and Kids whitelist have different sender-trust boundaries even though both mutate Kids channel rules. | Native/Kids mutation trust drift |
| `FilterTube_ApplySettings currently accepts caller settings as cache and broadcast authority` | pass-current-gap | The branch writes `compiledSettingsCache[targetProfile] = request.settings` and broadcasts the caller payload to matching tabs. | Runtime cache authority |
| `FilterTube_OpenWhatsNew currently accepts caller supplied URL without UI sender guard` | pass-current-gap | The release-notes tab-open branch uses `request.url || WHATS_NEW_PAGE_URL` and creates an active tab without a trusted UI sender check. | Arbitrary tab-open authority |
| `map metadata and stats message paths currently mutate background state without trusted UI guard` | pass-current-gap | Channel map, video-channel map, video-meta map, and stats writes are accepted as runtime messages without a shared mutation contract. | Learned-map/stat side effects |
| `recordTimeSaved currently accepts raw caller seconds without finite or range validation` | pass-current-gap | The stats branch adds `(request.seconds || 0)` directly to `stats.savedSeconds` without sender trust, finite-number validation, or range clamp. | Stats mutation authority |
| `fetchChannelDetails currently exposes caller-triggered YouTube channel fetch work` | pass-current-gap | The channel-details branch calls `fetchChannelInfo(request.channelIdOrHandle)`, and that helper fetches YouTube channel HTML with credentials included. | Caller-triggered network activity |
| `script injection and subscription bridge actions currently use caller supplied target data` | pass-current-gap | `injectScripts` uses caller-provided script names in `MAIN` world, and subscriptions bridge uses caller-provided `tabId` in isolated world. | Injection boundary |
| `second addFilteredChannel listener currently omits listType and owns backup side effects` | pass-current-gap | The secondary channel-add listener calls the helper without `message.listType` and schedules backups from the listener. | List-type/backup authority drift |
| `ignored root capture files are evidence inputs and not background source authority` | pass | Root capture files are ignored and cited by the capture inventory as evidence for JSON/DOM docs, not current background source. | Source/evidence boundary |

## P0 Message / Mutation Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 message mutation audit documents fixture families and current non-green verdict` | pass | The P0 message/mutation slice names the fixture families, the future sender/profile/list/revision/report contract, and the current blocked verdict. | P0 fixture wall |
| `message_sender_matrix_channel_mutations_have_uniform_sender_classes is not satisfied` | pass-current-gap | Similar channel mutations currently have uneven sender gates: whitelist paths are UI-gated, while Kids block, popup blocklist add, and secondary typed add/toggle paths are not governed by one sender-class contract. | Sender-class drift |
| `background_rejects_untrusted_apply_settings is not satisfied by current behavior` | pass-current-gap | `FilterTube_ApplySettings` accepts caller settings into `compiledSettingsCache` and broadcasts that payload without a background-owned revision or mutation report. | Runtime cache authority |
| `background script injection and subscriptions bridge injection are not trusted-flow gated` | pass-current-gap | Script injection and subscription bridge messages use caller target data without one shared trusted-flow/pending-request gate. | Injection boundary |
| `background arbitrary whats-new URL and channel detail fetch rejection are not satisfied` | pass-current-gap | The What's New branch accepts caller URL fallback and channel detail fetch accepts caller lookup input before a future allowlist/sender contract exists. | Navigation/network authority |
| `page spoof refresh and video-channel-map rejection are not satisfied` | pass-current-gap | Same-window page messages can force DOM fallback refresh and persist video-channel mappings before a universal owned-request/provenance gate. | Page-message spoof boundary |
| `page_message_requires_pending_collaborator_response is only partial today` | pass-current-gap | Collaborator responses have a pending branch, but video-id application can still occur outside a universal pending-owner proof. | Learned identity authority |
| `set_list_mode_copy_false_does_not_clear_blocklist is not satisfied` | pass-current-gap | `FilterTube_SetListMode` parses `copyBlocklist` but current whitelist-mode transfer still merges and clears blocklist state through the existing path. | Mode migration side effects |
| `content script addFilteredChannel and Nanah scoped apply lack future authority reports today` | pass-current-gap | The secondary `addFilteredChannel` listener omits listType authority, and Nanah scoped apply writes V4 profiles without a shared mutation report/lock/session authority. | Rule mutation authority |

## P0 Storage / Cache Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 storage/cache audit documents fixture family and current blocked verdict` | pass | The storage/cache family names all 12 P0 obligations, the future `storageKeyAuthority.report(...)` contract, and the current blocked verdict. | P0 fixture wall |
| `storage_key_background_invalidation_covers_compiler_dependencies is not satisfied` | pass-current-gap | The background compiler reads keys such as `enabled`, `categoryFilters`, exact matching, learned video maps, quick/menu flags, and watch flags that the storage invalidation listener does not watch. | Cache invalidation drift |
| `storage_key_content_bridge_map_only_refresh_policy_is_named is local-only today` | pass-current-gap | Content bridge treats `channelMap`, `videoChannelMap`, and `videoMetaMap` as special refresh cases, but that policy is local to the bridge and no shared storage-key authority exists. | Split refresh authority |
| `storage_key_state_manager_reload_keys_match_ui_claims is not satisfied` | pass-current-gap | StateManager reloads only a subset of UI-visible settings and omits content/category filters, learned video maps, exact matching, derived channel keywords, and `statsBySurface`. | Dashboard/settings reload drift |
| `storage_key_settings_shared_load_keys_are_classified is not satisfied` | pass-current-gap | `loadSettings()` loads broad settings/profile/stat/map data but has no shared classification tying each key to cache invalidation, content refresh, dashboard reload, backup, or migration revision behavior. | Settings key authority |
| `video map changes have split cache and DOM policies today` | pass-current-gap | Background writers update pending/compiled video maps while content bridge map-only changes refresh settings without forced DOM reprocess, leaving cache and DOM policy split. | Learned-map cache/DOM split |
| `storage_key_stats_by_surface_change_refreshes_dashboard is not satisfied` | pass-current-gap | Shared settings reads `statsBySurface`, while StateManager reload watches `stats` and currently omits `statsBySurface`. | Stats dashboard drift |
| `read-path V4 writes currently lack migration revision reports` | pass-current-gap | `loadSettings()` and `loadProfilesV4()` can write generated or migrated V4 profiles during read paths without a migration/settings revision report. | Read-path mutation |
| `import and Nanah profile writes lack shared target-profile revision report today` | pass-current-gap | Import and scoped Nanah apply write profile state directly without one target-profile, lock/session, revision, cache invalidation, and refresh report. | Import/sync mutation drift |
| `unknown storage keys have no shared no-runtime-reprocess report today` | pass-current-gap | Background, content bridge, and StateManager each ignore unknown keys through separate local lists, with no shared ignored-key/no-reprocess report. | Unknown-key policy drift |
| `raw capture evidence remains excluded from storage authority` | pass | Ignored root capture files remain evidence only and do not appear in product storage authority source. | Source/evidence boundary |

## Unified Mutation Contract Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `unified mutation contract audit documents required future fields and current split owners` | pass | The focused audit defines `senderClass`, `targetProfileId`, `allowedStorageWrites`, `broadcastScope`, `compiledSettingsRevision`, `domSideEffects`, `resultReport`, and the one-action/one-report/one-revision invariant. | Mutation-contract coverage |
| `current source has no central mutation contract registry or settings revision field` | pass-current-gap | Product source lacks `backgroundActionRegistry`, `filterTubeMutationIntent`, `compiledSettingsRevision`, and `mutationReport` fields today. | Split authority |
| `FilterTube_SetListMode currently combines storage writes cache invalidation backup and broad refresh broadcast` | pass-current-gap | The list-mode branch is UI sender-gated but still combines list transfer, storage writes, cache invalidation, backup scheduling, and tab refresh. | Mode migration side effects |
| `StateManager currently pushes caller compiled settings through FilterTube_ApplySettings instead of background revision` | pass-current-gap | UI code can broadcast caller-produced compiled settings through `FilterTube_ApplySettings` rather than requesting a background-owned revision. | Runtime cache authority |
| `import and Nanah apply paths write profile state without shared mutation report` | pass-current-gap | IO and Nanah paths write V4/profile state directly and can write during load/import/apply flows without one shared mutation result. | Import/sync convergence |
| `learned identity and stats mutations currently lack shared sender class revision and side-effect budgets` | pass-current-gap | Learned channel/video/meta maps and saved-time stats mutate without the shared sender/revision/side-effect fields the future contract requires. | Identity/stat side effects |

## Learned Identity Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `learned identity authority audit documents map stores flow and future contract` | pass | The focused audit documents `channelMap`, `videoChannelMap`, `videoMetaMap`, collaborator caches, DOM identity attrs, and the future source/provenance/confidence contract. | Learned identity authority coverage |
| `background channelMap enqueue currently lacks UC and handle shape validation` | pass-current-gap | Background channel-map enqueue accepts trimmed non-empty strings and does not enforce UC IDs or `@...` handles. | Map poisoning / false-match risk |
| `engine video-channel mapping source validates video and channel shape more strictly than background receiver` | pass-current-gap | Engine-side video-channel map emission validates 11-character video IDs and UC IDs, while the background receiver trims non-empty strings only. | Source/receiver validation drift |
| `background compiled settings currently include pending videoChannelMap before storage flush` | pass-current-gap | Pending video-channel map updates are merged into compiled settings and cache before debounced durable storage flush completes. | Pending identity authority |
| `background storage invalidation currently omits learned map keys` | pass-current-gap | Background storage invalidation omits `channelMap`, `videoChannelMap`, and `videoMetaMap` from the relevant-key list. | Cache invalidation drift |
| `content bridge video map handler persists before DOM ownership stamping checks` | pass-current-gap | The content bridge persists video-channel mappings before checking whether any current DOM card should be stamped for that video ID. | Ownership proof gap |
| `content bridge custom URL map writes channelMap directly instead of background enqueue path` | pass-current-gap | Custom URL map updates write `channelMap` directly from content bridge storage APIs instead of using the background enqueue/cache path. | Split map write authority |
| `collaborator responses can apply by videoId without requiring pending request ownership` | pass-current-gap | Collaborator response, cache, and dialog messages can apply collaborator identity by `videoId` without a universal pending-request gate. | Collaborator identity poisoning |
| `applyResolvedCollaborators owns cache menu refresh and forced DOM fallback rerun side effects` | pass-current-gap | Applying collaborators updates the cache, refreshes active menus/popovers, and schedules forced DOM fallback reprocessing. | Identity-triggered DOM work |
| `channel matching currently depends on channelMap cross matches and name fallback` | pass-current-gap | Channel matching uses learned map cross-matches and name fallback, so map quality directly affects allow/block decisions. | False-hide / false-leak boundary |
| `filter logic avatar-stack collaborator extraction remains a high-risk learned identity source` | pass-current-gap | Avatar-stack extraction can promote multiple avatars to collaborators, while the JSON encyclopedia warns Mix/Radio avatar stacks are not collaborator renderers. | Collection-art identity risk |

## P0 Learned Identity Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 learned identity doc lists all current-behavior fixtures and blocked verdict` | pass | The P0 learned identity slice names all fixture gates and keeps the implementation verdict blocked until `learnedIdentityAuthority` exists. | Implementation gate |
| `learned_identity_channel_map_requires_uc_handle_shape is not satisfied today` | pass-current-gap | Background channel-map writes accept non-empty strings without enforcing UC IDs or `@handle` shape. | Map poisoning / false-match risk |
| `learned_identity_video_channel_map_requires_video_and_uc_shape is not satisfied in background today` | pass-current-gap | Background video-channel map writes trim non-empty strings but do not enforce video ID or UC channel ID shape. | Source/receiver validation drift |
| `learned_identity_engine_source_guard_is_stronger_than_background_receiver today` | pass-current-gap | Engine-side emissions validate stricter shape than the background receiver, so one guarded source does not prove all learned-map inputs. | Bypassable source guard |
| `learned_identity_pending_video_map_enters_compiled_settings_before_flush today` | pass-current-gap | Pending video-channel mappings can enter compiled settings and cache before durable flush/revision proof. | Pending identity authority |
| `learned_identity_storage_invalidation_omits_map_keys today` | pass-current-gap | `channelMap`, `videoChannelMap`, and `videoMetaMap` are omitted from the background storage invalidation key list. | Cache invalidation drift |
| `learned_identity_page_video_map_persists_before_dom_ownership today` | pass-current-gap | Page-world video-channel map messages persist before current DOM card ownership is proven. | Ownership proof gap |
| `learned_identity_custom_url_map_bypasses_background_authority today` | pass-current-gap | Custom URL map messages write `channelMap` directly from the content bridge instead of through the background map authority path. | Split map write authority |
| `learned_identity_video_meta_map_can_trigger_dom_rerun today` | pass-current-gap | Video metadata map messages persist metadata, clear processed markers, and schedule DOM fallback reruns. | Identity-triggered DOM work |
| `learned_identity_collaborator_apply_lacks_universal_pending_request_ownership today` | pass-current-gap | Collaborator response/cache/dialog paths can apply by `videoId` without one universal pending request proof. | Collaborator identity poisoning |
| `learned_identity_resolved_collaborators_force_menu_and_dom_rerun today` | pass-current-gap | Resolved collaborator application refreshes menus/popovers and forces DOM fallback. | Performance / identity side effects |
| `learned_identity_channel_match_uses_map_and_name_fallback today` | pass-current-gap | Channel matching uses learned cross-map entries and name fallback. | False-hide / false-leak boundary |
| `learned_identity_avatar_stack_collaborator_source_is_high_risk today` | pass-current-gap | Avatar stacks can be promoted to collaborators even though Mix/Radio avatar stacks are collection art. | Collection-art identity risk |
| `learned_identity_future_authority_token_is_absent_from_product_source today` | pass-current-gap | Product source has no `learnedIdentityAuthority` report today. | Split authority |

## Build / Website Callable Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `build/website callable audit accounts for every current build and website source file` | pass | The first build/website callable pass covers `build.js`, all current `scripts/*.mjs`, every website app route, and every website component source file in the current tree. | Release and website callable coverage gap |
| `build/website callable counts match the current lexical source surface` | pass | The audit pins 26 accounted files and 82 lexical callables across build/sync scripts, website routes, and website components. | Method-level release/website drift |
| `build/website audit pins high-risk release and public claim patterns to current source` | pass-current-gap | Current source still has non-atomic GitHub release creation, README mutation during build, mobile artifact staging without a manifest gate, Nanah/native sync freshness gaps, website-only analytics, direct APK CTA without artifact proof, remote logo CDN requests, homepage video auto-preload, and static sitemap dates. | Public release truth, privacy wording, and website performance risk |

## Native Runtime Sync Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `native runtime sync audit documents sync model and future gate` | pass | The focused audit names the extension/app sync boundary, generated runtime outputs, mirror drift, raw capture evidence boundary, and future `nativeRuntimeSyncAuthority`. | Native sync audit coverage |
| `public wrapper delegates to the sibling or env-selected app sync script` | pass | `scripts/sync-native-runtime.mjs` resolves `FILTERTUBE_APP_REPO` or sibling `FilterTubeApp`, then runs the app sync script with Node. | Sync entrypoint boundary |
| `app sync manifest sources exist and are owned by the public repo path` | pass | The app manifest has 28 entries, all sourced from `/Users/devanshvarshney/FilterTube`, including runtime, UI parity, Nanah adapter, Nanah bundle, and QR bundle files. | Source authority |
| `manifest copy destinations are currently byte-identical to source files` | pass | Every manifest-listed source/destination pair hashes identically in the current app repo. | Direct copy freshness |
| `generated main runtime assets are large app outputs and not byte-identical source files` | pass-current-gap | Android and iOS Main runtime assets are generated app resources with different current hashes and sizes, so they need generated-output freshness proof rather than source-file identity claims. | Generated runtime drift |
| `iOS Kids runtime documents intentional divergence from Android Kids runtime` | pass | iOS Kids runtime contains WebKit-specific fit logic such as `ensureKidsPhoneFit` and watch-DOM ownership comments that Android Kids runtime does not contain. | Platform divergence |
| `broad extension source mirror drift is detected separately from manifest copy freshness` | pass-current-gap | The broad `packages/extension-source/upstream` mirror has two hash-different files today: `css/serene-shell.css` and `html/tab-view.html`. | Native UI parity drift |
| `app docs state Android prebuild freshness and iOS manual sync boundary` | pass-current-gap | App docs say Android prebuild runs sync, while iOS has no Gradle prebuild hook and needs manual sync before release. | App release freshness |
| `raw root captures are ignored evidence and not native sync inputs` | pass | Root YouTube capture files are ignored and absent from native sync manifest sources/destinations. | Raw capture source confusion |
| `native runtime sync future authority token is absent from product source` | pass-current-gap | Product source does not yet implement `nativeRuntimeSyncAuthority`; this remains an audit gate, not runtime behavior. | Future authority absence |

## All Callable Index Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `all-callable index accounts for every tracked JS JSX and MJS source file` | pass | The repo-wide callable index accounts for all 63 tracked JS/JSX/MJS files from `git ls-files`. | Complete-codebase source coverage gap |
| `all-callable index counts match current lexical callable source` | pass | The index pins 5,469 lexical callable forms across the tracked JavaScript source surface. | Callable drift |
| `all-callable family totals match the documented file rows` | pass | Family totals are derived from the documented file rows: hot runtime 2,930, helper runtime 298, UI/settings 1,556, generated/quarantined 147, vendor 279, build/sync 52, website 56. | Audit accounting drift |
| `all-callable index excludes ignored raw captures and generated package output` | pass | Ignored raw captures, `dist/`, dependency caches, and website build output are not treated as authoritative source rows. | Source/evidence boundary drift |

## Method Semantic Audit Register Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `method semantic audit register is audit-only and does not certify lexical counts as behavior proof` | pass | The register is explicitly non-runtime and treats counted callables as semantic audit candidates, not implementation-ready methods. | Implementation gate |
| `method semantic audit register preserves the identity waterfall and incomplete JSON boundary` | pass | JSON-first remains a waterfall across XHR/initial snapshots, learned maps, DOM, and bounded resolver fetches; watch/Shorts/Mix/Kids/YTM/collaborator surfaces are not treated as always-complete JSON. | JSON/DOM/network confidence drift |
| `method semantic audit register lists required semantic fields before behavior changes` | pass | Future method changes must record owner, trigger, caller, inputs, route/surface, side effects, no-rule/disabled behavior, teardown/idempotence, and positive/negative fixtures. | Method proof gap |
| `method semantic audit register covers high-risk callable families` | pass | The first semantic register covers seed transport, background mutation, content bridge actions, DOM fallback, lifecycle affordances, UI/settings mutation, Nanah/import/export, prompts, release/build, generated, and vendor paths. | Complete-codebase method coverage |
| `method semantic audit register cites representative source tokens that still exist` | pass | Representative tokens are tied back to current source in seed, background, content bridge, DOM fallback/helpers, StateManager, RenderEngine, IO, Nanah, and tab-view. | Doc/source drift |
| `method semantic audit register defines implementation boundary and user-symptom mapping` | pass | Empty-install lag, false hiding, end-screen/watch gaps, and engagement side effects are treated as symptoms of method-level split authority. | Symptom-only fix risk |
| `method semantic audit register names missing runtime authorities without implementing them` | pass-current-gap | Product source still lacks `methodSemanticAuthority`, `callableEffectReport`, `callableNoWorkBudget`, and `callableTeardownRegistry`. | Future authority absence |

## Tracked File Audit Coverage Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `tracked-file audit coverage documents the current git ls-files source universe` | pass | The audit coverage doc pins `git ls-files` as the source universe and records the current tracked source count as 149. | Complete-codebase source boundary |
| `every current tracked file is assigned exactly one audit family by the coverage classifier` | pass | Every tracked file is assigned to one of 20 audit families, including runtime, UI, docs, website, assets, manifests, scripts, vendor, quarantine, and config. | Unclassified source gap |
| `tracked docs are classified as claims and evidence maps rather than runtime proof` | pass | Tracked docs such as `json_paths_encyclopedia.md` and `youtube_renderer_inventory.md` remain discovery/claim surfaces until backed by fixtures. | Documentation overclaim |
| `quarantined legacy assets remain distinguished from active runtime coverage` | pass | `js/layout.js` and legacy content CSS are classified separately from active manifest-loaded runtime coverage. | Accidental reactivation risk |
| `ignored raw capture corpus remains outside the tracked-file audit universe` | pass | Root capture files like `YTM.json`, `YT_KIDS.json`, `comments.json`, and `WHITELIST_content.JS` remain untracked evidence inputs. | Raw capture source confusion |

## JSON/DOM Inventory Truth Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `JSON DOM inventory truth audit defines docs as discovery maps not runtime proof` | pass | The focused audit defines ignored captures and inventory docs as fixture sources, while `tests/runtime` is the executable proof boundary. | Documentation truthfulness |
| `inventory docs contain optimistic coverage wording for surfaces that require fixture proof` | pass-current-gap | `youtube_renderer_inventory.md` still contains historical `Covered`/`Implemented`/layout-fix wording for surfaces that need direct fixture proof. | Coverage overclaim |
| `documented high-risk renderer keys are not direct FILTER_RULES entries today` | pass-current-gap | `compactPlaylistRenderer`, search refinements, compact channel, modern post/shared post, and direct watch-card renderers are documented but not direct `FILTER_RULES` keys. | JSON renderer leak |
| `showSheet collaborator paths are documented while current filter logic primary scan is showDialog based` | pass-current-gap | The authoritative show-sheet collaborator path is documented, but current filter logic's primary extraction path is show-dialog based. | Collaborator roster leak |
| `layout-only inventory coverage is not active manifest-loaded runtime coverage` | pass-current-gap | `js/layout.js` is cited by inventory rows but is not loaded by active browser manifests. | Quarantined legacy coverage |
| `global DOM card selector mixes surfaces before a central selector registry exists` | pass-current-gap | `VIDEO_CARD_SELECTORS` mixes Main, mobile, YTM, Kids, playlist, radio, and watch-card hosts before a route-scoped selector registry exists. | Selector false-hide / scan cost |

## JSON Path Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `JSON path authority audit documents discovery/runtime split and blocked verdict` | pass | The slice documents current-behavior proof only and keeps implementation blocked. | JSON path authority coverage |
| `product source still lacks a central JSON path authority or generated path manifest` | pass-current-gap | Product source has no `jsonPathAuthority`, `rulePathManifest`, `jsonPathProvenance`, or `pathTraceabilityMap`. | Missing JSON path authority |
| `runtime getByPath supports dot notation but not documented bracket-index notation today` | pass-current-gap | Docs use bracket-index traces such as `listItems[0]` and `runs[0]`, while `getByPath()` uses `path.split('.')` dot-index syntax. | Path syntax drift |
| `json paths encyclopedia is not loaded by runtime or build code today` | pass | Runtime/build source does not load `json_paths_encyclopedia.md`; tests/docs are the evidence boundary. | Docs/runtime boundary |
| `FILTER_RULES is hand-authored and has no per-path provenance field today` | pass-current-gap | `FILTER_RULES` has no provenance, source capture, raw capture, JSON path source, or fixture id field per path. | Rule provenance gap |
| `documented high-risk paths still include runtime unsupported or partial renderer gaps` | pass-current-gap | Documented compact playlist, search refinement, compact channel, post, shared post, and direct watch-card renderers still lack direct rules. | JSON renderer leak |
| `showSheet collaborator path is documented but direct runtime extraction still uses showDialog primary scan` | pass-current-gap | Show-sheet roster paths are documented, but direct runtime collaborator scan remains show-dialog/dialog-model based. | Collaborator leak / whitelist false-hide risk |
| `existing JSON inventory tests keep documentation claims separate from runtime proof` | pass | Existing docs/tests keep inventory docs and raw captures as discovery evidence, not runtime proof. | Gate integrity |

## DOM Hide Side-Effect Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `DOM hide side-effect audit documents shared, direct, container, and recycled-node hide authorities` | pass | The audit covers shared `toggleVisibility()`, container cleanup, current-watch owner block, members-only fallback, playlist enrichment, optimistic/immediate hides, and recycled-card cleanup. | Hide authority coverage |
| `toggleVisibility currently couples visual hide with stats, inline display, pending whitelist, and media playback` | pass-current-gap | Shared hides update classes/attrs/inline display, stats/tracker, pending whitelist state, and media playback. | Hide side-effect coupling |
| `container visibility currently hides shelves when all children are hidden or prior children disappear` | pass-current-gap | `updateContainerVisibility()` can add `filtertube-hidden-shelf` when all children are hidden or a previously populated container becomes empty. | Broad container false-hide risk |
| `direct display-none writes currently bypass the shared toggleVisibility path in bridge and fallback code` | pass-current-gap | `content_bridge.js` has 10 direct display-none writes, `dom_fallback.js` has 10, and several key hide paths bypass shared stats/media/restore behavior. | Split hide authority |
| `current watch and members-only fallback paths include broad hide and playback/navigation side effects` | pass-current-gap | Current-watch owner block can pause video/click next playlist row/retry fallback; members-only CSS/JS fallback includes broad watch-container and shelf hides. | Playback/navigation/broad-parent risk |
| `recycled-card cleanup currently proves hidden and identity markers can survive until explicit reset` | pass-current-gap | DOM extractor cleanup removes stale identity/hide markers when YouTube recycles cards, proving stale state exists unless explicitly cleared. | Recycled DOM stale-state risk |

## DOM Broad Hide Boundary Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `broad hide boundary audit documents false-hide surfaces and blocked verdict` | pass | The focused broad-hide audit documents current behavior only, missing `broadHideBoundaryAuthority`, and the need for negative sibling-visible fixtures. | Broad-hide authority coverage |
| `product source still lacks one central broad-hide boundary authority` | pass-current-gap | Product source has no central broad-hide, hide-target, sibling-visible, or watch-shell hide policy token today. | Missing broad-hide contract |
| `members-only CSS and JS fallback can target watch shells and shelf parents today` | pass-current-gap | Members-only CSS/JS fallback can target watch shells and also hide parent shelves/horizontal lists. | Watch-shell / parent false-hide risk |
| `playlist card CSS and JS can hide parent shelf or horizontal list from one lockup today` | pass-current-gap | Playlist card CSS and JS fallback can hide parent shelf or horizontal-list nodes from one playlist lockup, without a local sibling-visible proof. | Mixed-shelf false-hide risk |
| `current-watch owner enforcement can hide selected playlist row and click alternate targets today` | pass-current-gap | Current-watch owner enforcement can hide selected rows, pause, and synthesize alternate playlist/player clicks. | Current-row playback/navigation risk |
| `container cleanup can collapse parent shelves from child hidden or missing state today` | pass-current-gap | Container cleanup can collapse a parent when children are hidden or disappear after prior population. | Container collapse risk |
| `disabled stale cleanup does not enumerate every specialized hide marker today` | pass-current-gap | Stale cleanup handles several markers but not every specialized direct-writer marker family. | Stale marker risk |
| `existing P0 and ledger docs keep broad false-hide proof partial rather than green` | pass | Existing P0 and objective docs still treat this as partial proof, not implementation readiness. | Gate integrity |

## Hide/Restore Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `hide/restore authority audit documents every current hide writer family` | pass | The audit covers shared helper, container cleanup, runtime CSS, open-app cleanup, stale cleanup, watch whitelist repair, members/playlist/mix fallback, main-card decisions, shelf hides, pending whitelist, optimistic menu hides, and recycled-card cleanup. | Hide authority coverage |
| `product source does not yet define a hideRestoreAuthority contract` | pass-current-gap | `hideRestoreAuthority` exists only as a future contract token in audit docs/tests, not product source. | Missing central hide/restore boundary |
| `shared toggleVisibility owns class attr inline display stats and media side effects today` | pass-current-gap | The shared helper owns visual state, stats, tracker restore, and media side effects. | Side-effect coupling |
| `stale cleanup restores generic hidden state but not every specialized direct-hide marker` | pass-current-gap | Generic cleanup clears common hidden/pending markers and CSS, but specialized markers like members-only/open-app/mix-radio are not covered by that one cleanup. | Stale marker risk |
| `direct hide writers still bypass shared toggleVisibility in pending whitelist and user action paths` | pass-current-gap | Pending whitelist and optimistic block paths directly write inline display/class/attrs. | Split writer/restore authority |
| `fallback direct hide owners have marker-specific or incomplete restore paths today` | pass-current-gap | Members-only and Mixes have marker-specific restore paths; playlist direct fallback hides do not have a symmetric off-restore in the same block. | Direct fallback restore drift |
| `recycled-card cleanup proves stale identity and hide markers must be reset with inline display` | pass | YouTube card reuse requires clearing identity, hide markers, block state, hidden class, and inline display. | Recycled DOM stale-state risk |
| `hide/restore audit names the required future P0 fixture wall` | pass | The future fixture wall names writer, direct display, disabled cleanup, CSS owner, pending whitelist, recycled-card, shelf title, watch/player, no-rule, and writer-registry cases. | Future behavior gate |

## P0 Hide / Restore Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 hide/restore audit documents fixture family and current blocked verdict` | pass | The P0 family is documented as current-behavior proof only, with `hideRestoreAuthority` still absent from product source. | P0 fixture wall |
| `hide_restore_shared_toggle_reports_writer_reason_and_marker` | pass-current-gap | `toggleVisibility()` owns class/attr/inline display, stats, tracker, and media side effects, but only receives a string reason and `skipStats`. | Split side-effect policy |
| `hide_restore_direct_display_writes_have_registered_restorers` | pass-current-gap | Bridge and fallback paths still write `display:none` directly, and not all direct writers have symmetric registered restore paths. | Split writer/restore authority |
| `hide_restore_disabled_extension_clears_all_filtertube_hide_markers` | pass-current-gap | Disabled/stale cleanup clears generic markers but omits specialized members-only, open-app, mix, playlist-enrichment, and hide-home-feed markers. | Stale hidden state risk |
| `hide_restore_css_control_rules_have_route_owner_and_disable_path` | pass-current-gap | Generated CSS hides have some route attrs, but no structured route owner, restore owner, or per-rule report. | CSS hide authority gap |
| `hide_restore_members_only_restore_clears_members_marker_and_generic_marker` | pass-current-partial | Members-only direct restore clears local markers, but the family still includes broad watch/shelf targets and no registry owner. | Broad watch/shelf false-hide risk |
| `hide_restore_open_app_button_hide_is_excluded_from_content_filter_stats` | pass-current-partial | Open-app cleanup avoids content stats because it bypasses `toggleVisibility()`, but this is not explicitly reported as shell cleanup. | Stats classification gap |
| `hide_restore_pending_whitelist_restore_requires_identity_outcome` | pass-current-gap | Pending whitelist hides cards directly and schedules recheck, but carries no TTL, identity outcome, or restore owner. | Whitelist stale-hide risk |
| `hide_restore_recycled_card_cleanup_clears_identity_and_hide_markers` | pass | Recycled-card cleanup clears identity, hidden, blocked, collaborator, class, and inline display state on video-id changes. | Recycled DOM invariant |
| `hide_restore_shelf_title_restore_clears_specific_marker` | pass-current-partial | Shelf-title local restore clears its marker, but mixed-shelf negative sibling-visible proof is still missing. | Parent container false-hide risk |
| `hide_restore_current_watch_owner_block_has_playback_side_effect_reason` | pass-current-gap | Current-watch owner block can pause, click, and hide, but those side effects are not structured as media/navigation policy. | Watch playback side-effect gap |
| `hide_restore_no_rule_path_does_not_leave_inline_display_none` | pass-current-gap | No-work cleanup can restore shared hides but does not globally prove all specialized direct markers and inline display writes are cleared. | No-rule stale-hide risk |
| `hide_restore_writer_registry_covers_toggle_visibility_direct_style_and_css` | pass-current-gap | Product source has no `hideRestoreAuthority`, writer registry, or shared restore owner model. | Missing central visual authority |

## P0 Selector Authority Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 selector authority audit documents fixture family and current blocked verdict` | pass | The P0 family is documented as current-behavior proof only, with `selectorAuthority` still absent from product source. | P0 fixture wall |
| `selector_authority_global_card_selector_split_by_surface_route_action` | pass-current-gap | `VIDEO_CARD_SELECTORS` still mixes Main desktop, mobile/YTM-shaped, Kids, playlist, radio, watch-card, channel, and Shorts hosts before one selector registry exists. | Mixed-surface scan / false-hide risk |
| `selector_authority_dom_fallback_no_rule_zero_card_scan` | pass-current-partial | Empty blocklist can return before the main card scan, but stale cleanup still has selector work and there is no central zero-card-scan report. | Empty-install scan budget gap |
| `selector_authority_quick_block_disabled_zero_selector_scan` | pass-current-gap | Quick-block scan bodies have guards, but setup still injects styles, listeners, observer, interval, and scheduled sweeps without a central disabled zero-work report. | Disabled affordance lifecycle/scan risk |
| `selector_authority_fallback_menu_uses_primary_menu_action_gate` | pass-current-gap | Primary menu injection checks list mode and `showBlockMenuItem`; fallback menu scanning uses its own body-wide selector path. | Split menu action authority |
| `selector_authority_watch_selectors_do_not_target_primary_player_shell_without_policy` | pass-current-gap | Watch selectors still target `ytd-watch-flexy`, `ytd-watch-metadata`, `#secondary`, `ytm-watch`, and primary info shells without a unified watch/player selector policy. | Watch shell false-hide risk |
| `selector_authority_members_only_badge_does_not_hide_watch_shell_without_fixture` | pass-current-gap | Members-only CSS and direct fallback can select watch shell/metadata/primary info hosts. | Members-only broad watch hide risk |
| `selector_authority_playlist_selected_row_preserves_current_watch_card` | pass-current-gap | Selected playlist rows are detected, but current-watch owner fallback can hide the selected row and synthesize navigation clicks. | Playlist current-card false-hide/navigation risk |
| `selector_authority_kids_selectors_have_kids_surface_gate` | pass-current-gap | Kids `ytk-*` selectors live in the global card selector and DOM fallback family; local Kids checks exist but no central Kids selector authority exists. | Kids surface bleed risk |
| `selector_authority_ytm_selectors_have_one_dom_fixture_but_remain_not_fully_proven_today` | pass-current-gap | Active selector source contains YTM-shaped selectors, and committed YTM evidence now includes video-card, post-card, watch/player DOM, and browse channel-list guardrails, but still lacks pass-through/whitelist/no-playback parity, no-rule, and broader negative sibling guardrails. | Mobile/YTM DOM proof gap |
| `selector_authority_legacy_layout_selectors_remain_quarantined_or_loaded_explicitly` | pass-current-partial | `js/layout.js` is not manifest-loaded but remains tracked/packaged with selector and visual side-effect density. | Legacy selector reactivation risk |
| `selector_authority_inventory_rows_require_runtime_source_or_fixture_status` | pass-current-gap | Inventory docs remain evidence maps and coverage wording still needs source-backed or fixture-backed status. | Coverage overclaim risk |
| `selector_authority_raw_capture_extracts_minimal_committed_dom_fixture` | pass-current-partial | Several committed DOM fixtures now exist, including YTM video/post, collaboration, and playlist fragments, while many ignored root HTML captures remain evidence-only. | Raw-capture proof gap |

## Cross Feature Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `cross-feature authority matrix covers every current high-level authority family and feature row` | pass | Endpoint, JSON renderer, DOM enforcement, affordance, identity, settings/mutation, and static/release authority families are mapped against the major product feature rows. | Feature coverage boundary |
| `cross-feature authority matrix only cites existing source files for primary authority rows` | pass | Every required source file cited by the matrix exists in the current repo, including runtime, helper, settings, sync, release, and release-note sources. | Source citation integrity |
| `cross-feature authority matrix is backed by current source tokens for risky feature paths` | pass-current-gap | The matrix pins source-backed risky paths, including `postRenderer` and `sharedPostRenderer` as documented JSON-path gaps rather than direct `filter_logic.js` rules. | Cross-feature proof authority |

## Public Release Surface Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `extension package and browser manifest versions currently match` | pass | `package.json`, root manifest, Chrome manifest, Firefox manifest, and Opera manifest are all `3.3.1`. | Version release drift |
| `release notes currently stage a newer entry than the packaged extension version` | pass-current-gap | First real release note entry is staged `3.3.2` while package/manifests remain `3.3.1`; the entry is marked `Upcoming:` and has no details URL. | Staged copy / release-note drift |
| `website analytics are website-only in code and privacy copy` | pass | Website layout imports/renders Vercel Analytics, and the privacy page scopes analytics to `filtertube.in`, not extension/native apps. | Privacy scope baseline |
| `README privacy language is broader than the current website privacy wording` | pass-current-gap | README broad no-analytics/no-server language coexists with optional Nanah signaling and website-only analytics. | Public privacy wording drift |
| `downloads page exposes direct APK CTA before an artifact manifest gate exists` | pass-current-gap | Direct APK button points to GitHub latest while no `release-artifacts/manifest.json` gate exists; page copy says a signed APK can be attached with checksum/fingerprint. | Download claim/artifact drift |
| `android direct apk claim points to latest release before artifact claim authority exists` | pass-current-gap | Android is labeled final release testing, but `Direct APK releases` links to GitHub latest before a committed `publicReleaseClaimAuthority`, artifact manifest, signing fingerprint gate, or release claim ID exists. | Public download claim boundary |
| `ios claim is status-only and does not expose public IPA install path` | pass | iPhone/iPad copy points users toward TestFlight/App Store status and does not expose a public `.ipa` install URL. | iOS distribution boundary |
| `tv claim remains a separate future package instead of a mobile apk claim` | pass | Android TV / Fire TV is still documented as a separate future app/package, not the current phone/tablet APK. | TV release separation |
| `release notes are staged ahead of package and browser manifest versions` | pass-current-gap | `data/release_notes.json` starts with staged `3.3.2` copy while package and browser manifests remain `3.3.1`. | Version/copy claim drift |
| `build script can stage mobile artifacts with sha256 but interactive release publishing is prompt-driven` | pass-current-gap | Build can stage/checksum mobile artifacts, but publishing is prompt/GITHUB_TOKEN dependent. | Release reproducibility |
| `build script currently mutates README badges as part of normal build` | pass-current-gap | Normal build calls `updateReadmeBadges()` and writes README. | Build side-effect |
| `release publishing currently creates a public release before asset uploads complete` | pass-current-gap | `maybePromptRelease()` calls `createGitHubRelease()` before the asset upload loop, and `createGitHubRelease()` sends `draft:false` and `prerelease:false`. | Release atomicity |
| `website home and browser-logo surfaces currently carry public performance and remote-request risks` | pass-current-gap | The homepage video uses `preload="auto"` and browser logos are rendered from `cdnjs.cloudflare.com` rather than local website assets. | Website performance/privacy |

## Watch / Player Control Authority Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `watch/player control audit documents split authority and future contract` | pass | The audit documents split UI, settings, background, seed, JSON, content refresh, and DOM ownership plus the future `watchSurfaceControlAuthority`. | Watch/player authority coverage |
| `UI catalog currently exposes watch and player controls as independent toggles` | pass | The product exposes watch/player toggles as separate UI controls without one watch-surface authority object. | UI control authority |
| `background compiles watch/player flags but invalidates only a subset of those dependencies` | pass-current-gap | Background compiled settings emit watch/player flags while the background storage invalidation list omits many of the same direct keys. | Cache invalidation gap |
| `content bridge storage refresh currently compensates with a broader watch/player key list` | pass-current-gap | Content bridge watches a broader settings key list and can force DOM refresh downstream, masking but not fixing background dependency drift. | Content refresh compensation |
| `seed endpoint active-rule detection only treats comments shorts and categories as watch-adjacent JSON controls` | pass-current-gap | Seed active JSON rules include comments, Shorts, and category, but omit watch sidebar, live chat, playlist panel, end-screen, autoplay, and annotations. | Endpoint policy gap |
| `DOM fallback currently owns broad watch player CSS selectors and a broad boolean active gate` | pass-current-gap | DOM fallback owns broad selectors for watch/player controls and treats many booleans as active without a central route/player-state report. | DOM selector authority |
| `comments currently have JSON endpoint JSON renderer and DOM fallback owners` | pass | Comments are handled by seed `/next`, JSON renderer rules, and DOM fallback, proving split current owners. | Comments authority coverage |
| `watch rail cleanup currently has a whitelist exception but no unified watch authority token` | pass-current-gap | DOM shelf cleanup has a whitelist watch-rail exception, but no unified watch-surface authority token exists in source. | Watch rail false-hide guard |
| `right-rail whitelist observer attaches to watch rail selectors but its scheduler skips watch routes` | pass-current-gap | `installRightRailWhitelistObserver()` observes `#related`, `#secondary`, `ytd-watch-next-secondary-results-renderer`, and `ytd-watch-flexy #secondary`, but `scheduleWhitelistRefresh()` returns when the path starts `/watch`. | Watch rail lifecycle / whitelist repair drift |
| `forced whitelist reprocess is present but unreachable after the current watch-route skip` | pass-current-gap | The observer has two forced `applyDOMFallback(...forceReprocess...)` passes, but the `/watch` guard runs first, so watch-route rail mutations cannot use that dedicated repair path. | Watch rail performance / leak tradeoff |
| `current product source has no watchSurfaceControlAuthority implementation yet` | pass-current-gap | Future authority token is absent from product JS, proving this is audit-stage documentation and tests only. | Future watch authority absence proof |
| `fallback menu action gate audit documents current popover execution drift` | pass-current-gap | The audit now pins fallback scanner, fallback popover, `performBlock()`, `addChannelDirectly()`, and `handleBlockChannelClick()` as action-side surfaces that need one shared menu action authority. | Menu action authority |
| `primary dropdown action has list-mode and showBlockMenuItem gates before injecting rows` | pass | Normal dropdown injection returns in whitelist mode and clears FilterTube menu rows when `showBlockMenuItem` is disabled. | Working primary menu baseline |
| `fallback scanner creates buttons without the primary dropdown action gate` | pass-current-gap | Fallback buttons are created from the scanner using native-overlay quiet mode, not the normal dropdown's list-mode/menu-visibility gate. | Fallback affordance drift |
| `fallback popover opens and builds block rows without rechecking primary menu settings` | pass-current-gap | The fallback popover builds `Block` and `Filter All` rows without local `currentSettings?.listMode` or `currentSettings?.showBlockMenuItem` checks. | Fallback action-surface drift |
| `fallback performBlock can mutate channel rules and hide rows without local shared action authority` | pass-current-gap | `performBlock()` can call `addChannelDirectly()` or `handleBlockChannelClick()`, directly hide the row, and force DOM fallback without one local shared action gate. | Rule mutation / optimistic hide drift |

## P0 Watch / Player Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 watch/player audit documents fixture family and current blocked verdict` | pass | The P0 family is documented as current-behavior proof only, with `watchSurfaceControlAuthority` still absent from product source. | P0 fixture wall |
| `watch_controls_background_invalidation_covers_all_compiled_keys` | pass-current-gap | Background compiles watch/player flags while storage invalidation omits several direct watch/player dependency keys. | Cache invalidation drift |
| `watch_controls_content_refresh_is_derived_from_background_schema` | pass-current-gap | Content refresh compensates with its own broader key list instead of deriving from one background schema. | Refresh schema drift |
| `watch_next_no_rule_pass_through_without_json_rewrite` | pass-current-gap | Watch `/next` still reaches generic JSON processing in no-rule states. | Watch endpoint overwork |
| `watch_player_no_rule_metadata_only_without_recommendation_mutation` | pass-current-gap | `/player` can still be rewritten by the engine instead of being metadata-only under no-rule player states. | Player mutation authority |
| `watch_comments_hide_all_uses_comment_continuation_rewrite_only_for_comments` | pass-current-partial | Comment handling has JSON and DOM proof, but continuation shape authority is not centralized. | Comment continuation drift |
| `watch_comments_keyword_filter_does_not_hide_non_comment_watch_scaffolding` | pass-current-gap | Comment keyword filtering lacks one watch-surface report proving non-comment scaffolding remains untouched. | Watch scaffold false-hide risk |
| `watch_sidebar_toggle_is_route_scoped_to_watch` | pass-current-gap | Sidebar/watch control toggles are not yet governed by one route-scoped authority report. | Route-scope drift |
| `watch_playlist_panel_toggle_does_not_disable_playlist_card_identity_fixtures` | pass-current-gap | Playlist panel hiding and playlist card identity still lack a shared boundary fixture. | Playlist identity safety |
| `watch_endscreen_videowall_json_and_dom_have_separate_fixtures` | pass-current-gap | End-screen JSON and DOM coverage remain split, including alternate video wall structures. | End-screen leak risk |
| `watch_whitelist_mode_keeps_watch_metadata_and_rail_scaffolding_visible` | pass-current-partial | Some local whitelist guards exist, but there is no unified watch metadata/rail scaffold authority. | Whitelist false-hide risk |
| `watch_fullscreen_pauses_non_player_dom_work` | pass-current-gap | Fullscreen/native state does not yet pause all non-player DOM work through a shared owner. | Fullscreen jank risk |

## P0 No-Work Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 no-work audit documents current behavior and future counter contract` | pass | The first no-work family names remain tied to the P0 register and carry explicit zero-work counter expectations. | P0 fixture wall |
| `empty_blocklist_desktop_home_no_work is not satisfied by current behavior` | pass-current-gap | Desktop home avoids `processData` but still parses, stringifies, and harvests identity in empty blocklist mode. | Empty-install performance cost |
| `empty_blocklist_mobile_home_no_work is not satisfied by current behavior` | pass-current-gap | Mobile home still reaches `processData` and rewrites the response in empty blocklist mode. | Mobile empty-install lag |
| `empty_blocklist_watch_no_player_mutation is not satisfied by current behavior` | pass-current-gap | Watch `/youtubei/v1/player` still reaches `processData` and rewrites the player response in empty blocklist mode. | Player endpoint overwork |
| `disabled_extension_no_mutation is not satisfied by current behavior` | pass-current-gap | Disabled mode avoids engine and harvest work but still parses and stringifies intercepted YouTubei responses. | Disabled-mode interception cost |

## P0 Endpoint Policy Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 endpoint policy audit documents current behavior and future endpoint contract` | pass | The endpoint-policy family names remain tied to the P0 register and carry explicit future endpoint-policy counter expectations. | P0 fixture wall |
| `seed_search_no_rule_pass_through is not satisfied by current behavior` | pass-current-gap | No-rule search skips `processData`, but still parses, stringifies, and harvests. | Search endpoint overwork |
| `seed_browse_mobile_home_no_rule_pass_through is not satisfied by current behavior` | pass-current-gap | Mobile home `/browse` still reaches `processData` and rewrites the response in empty blocklist mode. | Mobile endpoint overwork |
| `seed_next_watch_no_rule_pass_through is not satisfied by current behavior` | pass-current-gap | Watch `/next` still reaches `processData` and rewrites the response in empty blocklist mode. | Watch endpoint overwork |
| `seed_player_metadata_only is not satisfied by current behavior` | pass-current-gap | `/player` still reaches `processData` and can replace the player response body with engine output. | Player response mutation authority |
| `seed_guide_no_rule_pass_through is not satisfied by current behavior` | pass-current-gap | `/guide` still reaches `processData` and rewrites the response in empty blocklist mode. | Guide endpoint overwork |

## P0 Lifecycle Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 lifecycle audit documents current behavior and future lifecycle contract` | pass | The lifecycle family names remain tied to the P0 register and carry explicit future owner, active-state, pause, teardown, and zero-work counter expectations. | P0 fixture wall |
| `quick_block_disabled_zero_lifecycle_work is not satisfied by current behavior` | pass-current-gap | `setupQuickBlockObserver()` installs styles, document/window listeners, body mutation observation, and an interval before or outside the final quick-block enabled action checks. | Disabled-affordance lifecycle cost |
| `quick_block_disabled_zero_lifecycle_work source budget is pinned` | pass-current-gap | `setupQuickBlockObserver()` currently contains 8 document listeners, 3 window listeners, 1 mutation observer, 1 interval, 2 timeouts, 1 RAF callback, 1 `querySelectorAll`, and no local listener/observer teardown markers. | Disabled-affordance lifecycle budget |
| `menu_disabled_zero_fallback_insertion is not satisfied by current behavior` | pass-current-gap | `ensureFallbackMenuButtons()` injects fallback menu styles, mutation observation, route/click/scroll listeners, and warmup scans without the normal visible menu/list-mode action gate. | Disabled-menu lifecycle cost |
| `menu_disabled_zero_fallback_insertion source budget is pinned` | pass-current-gap | `ensureFallbackMenuButtons()` currently contains 3 document listeners, 1 window listener, 1 mutation observer, 1 interval, 3 timeouts, 1 RAF callback, 3 `querySelectorAll`, 23 `querySelector`, and no local listener/observer teardown markers. | Disabled-menu lifecycle budget |
| `native_overlay_quiet_mode_pauses_runtime is only partial in current behavior` | pass-current-gap | Native overlay quiet mode exists in content bridge, but quick block and DOM fallback do not share that pause authority. | Native overlay overwork |
| `fullscreen_pauses_non_player_runtime is not satisfied by current behavior` | pass-current-gap | Product source has no shared fullscreen lifecycle registry for pausing quick-block, fallback-menu, DOM fallback, prefetch, seed, or collaborator non-player work. | Fullscreen/orientation jank |
| `navigation_disconnects_route_observers is not satisfied by current behavior` | pass-current-gap | Some bridge observers disconnect on navigation, but fallback menu, quick block, and collaborator observers/listeners do not share one route teardown contract. | Route orphan lifecycle work |

## P0 Network Authority Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `P0 network audit documents current behavior and future network contract` | pass | The network family names remain tied to the P0 register and carry explicit owner, sender, route, surface, credential, user-action, active-reason, budget, pass-through, allowlist, and raw-capture exclusion expectations. | P0 fixture wall |
| `network_authority_counts_all_tracked_fetch_xhr_open_surfaces pins current primitive counts` | pass | Current tracked non-vendor source has 14 `fetch()` sites, 2 `XMLHttpRequest` references, 11 credential option sites, 3 `tabs.create()` calls, and 7 `window.open()` calls. | Network source surface |
| `network_authority_release_note_fetches_are_extension_resource_only is pinned for current behavior` | pass | Release-note fetches load `data/release_notes.json` from extension resources, not YouTube, YouTube Kids, or YouTubei. | Extension-resource boundary |
| `network_authority_watch_identity_fetch_requires_valid_video_id_and_active_reason is not fully satisfied today` | pass-current-gap | Watch identity fetch validates video id and uses credentialed YouTube HTML, but has no shared `networkAuthority`, active rule reason, metadata reason, or per-navigation budget. | YouTube-visible fetch authority |
| `network_authority_kids_identity_fetch_requires_kids_surface_reason is not fully satisfied today` | pass-current-gap | Kids identity fetch validates video id and uses credentialed YouTube Kids HTML, but has no shared Kids surface reason, network authority, or per-navigation budget. | Kids-visible fetch authority |
| `network_authority_channel_detail_fetch_rejects_untrusted_sender is not satisfied by current behavior` | pass-current-gap | `fetchChannelDetails` reaches `fetchChannelInfo()` without the trusted UI sender gate used by nearby mutation paths. | Message/network trust gap |
| `network_authority_content_bridge_watch_fetch_requires_metadata_or_identity_reason is not fully satisfied today` | pass-current-gap | Content bridge same-origin watch/shorts fallback fetches lack shared metadata/identity reason and per-navigation authority. | Page-resident fetch authority |
| `network_authority_subscription_import_fetch_requires_explicit_user_import is only partially represented today` | pass-current-gap | Subscription import is the only injector fetch and posts to `/youtubei/v1/browse`, but lacks a shared explicit user-import authority record. | User-action fetch gate |
| `network_authority_seed_interception_no_rule_passes_through_without_parse is not satisfied by current behavior` | pass-current-gap | Empty-rule search skips mutation but still parses, harvests, and stringifies the response. | No-rule network cost |
| `network_authority_fetch_credentials_policy_is_declared_per_owner is not satisfied by current behavior` | pass-current-gap | Credential modes exist per callsite, but no product-wide owner credential policy is declared. | Credential policy drift |
| `network_authority_website_remotes_are_website_only_claims is pinned for current behavior` | pass | Vercel Analytics and CDN browser-logo remotes are website-only and absent from the extension filtering runtime. | Privacy/release boundary |
| `network_authority_external_tab_open_urls_are_allowlisted is not fully satisfied today` | pass-current-gap | The What's New background action accepts a caller-supplied URL and lacks a shared external-navigation allowlist. | External navigation authority |
| `network_authority_raw_capture_urls_never_become_runtime_fetch_targets is pinned for current behavior` | pass | Ignored root HTML/JSON/TXT capture names are evidence inputs and do not appear as product runtime fetch targets. | Source/evidence boundary |

## P0 DOM / Renderer Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `dom_renderer_contract_documents_current_behavior_and_future_gate` | pass | The DOM/renderer slice documents current behavior, references selector/renderer gates, and names the future `domRendererAuthority` contract fields. | P0 fixture wall |
| `dom_renderer_global_card_selector_has_no_single_target_authority` | pass-current-gap | Global card selectors mix Main, mobile, Kids, YTM, watch-card, playlist, channel, Shorts, and Kids tags without a single target authority. | Selector false-hide / over-scan risk |
| `dom_renderer_post_menu_runtime_target_is_split_between_native_and_fallback` | pass-current-gap | Native dropdown targeting includes post renderers, but fallback 3-dot scanning omits post renderers. | Post action gap |
| `dom_renderer_fallback_playlist_menu_uses_weaker_action_gate_than_normal_menu` | pass-current-gap | Normal dropdowns gate whitelist mode and `showBlockMenuItem`; fallback playlist menu buttons/rows do not share those gates. | Action surface drift |
| `dom_renderer_selected_playlist_row_can_be_hidden_by_current_watch_owner_block` | pass-current-gap | Selected playlist rows are detectable and fixture-backed, but current-watch owner enforcement can still hide the selected row. | Playlist false-hide risk |
| `dom_renderer_watch_card_rhs_panel_video_gap_is_current_behavior` | pass-current-gap | Direct RHS watch-card renderer payloads with matching keyword/channel data pass through the JSON engine. | Watch-card leak |
| `dom_renderer_horizontal_card_search_refinement_gap_is_current_behavior` | pass-current-gap | Search refinement children under horizontal card lists pass through matching keyword/channel rules. | Search refinement leak |
| `dom_renderer_legacy_backstage_post_positive_baseline_is_current_behavior` | pass | Legacy `backstagePostRenderer` still blocks by keyword and author channel. | Working post baseline |
| `dom_renderer_comment_thread_hide_all_positive_baseline_is_current_behavior` | pass | `commentThreadRenderer` still hides when `hideAllComments` is enabled. | Working comment baseline |
| `dom_renderer_extracted_compact_playlist_gap_is_capture_backed` | pass-current-gap | Extracted YTM compact playlist fixture still passes through matching keyword/channel rules. | Capture-backed playlist leak |
| `dom_renderer_endscreen_json_and_dom_capture_split_is_current_behavior` | pass | Extracted YTM `endScreenVideoRenderer` blocks by keyword, while Main watch/end-screen DOM wall remains an unextracted capture family. | End-screen JSON/DOM split |
| `dom_renderer_raw_capture_sources_remain_fixture_only` | pass | Raw capture sources remain evidence-only; committed fixtures are the source-cited proof units. | Source/evidence boundary |

## Root Planning Doc Boundary Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `root markdown files are explicitly split between public metadata and historical planning` | pass | Root tracked markdown is currently `README.md`, `CHANGELOG.md`, and the historical channel-identity plan, with public docs separated from planning metadata. | Source/evidence boundary |
| `ignored root planning and raw evidence files remain untracked local evidence` | pass | Ignored root notes such as `watcher-collab-watchlist-spa-fix-plan.md`, `cher.md`, and `stash.txt` remain untracked local evidence when present. | Raw evidence leakage |
| `historical planning notes may cite ignored evidence without becoming runtime authority` | pass | The tracked historical plan can cite `stash.txt`, but that citation is only an audit clue and must be converted into executable proof before behavior changes. | Planning/source confusion |
| `browser release common files include public docs but not historical planning docs` | pass | Browser packaging includes `README.md`, `CHANGELOG.md`, and `LICENSE`, but not the historical channel-identity plan or ignored watcher plan. | Release package boundary |
| `active manifests do not reference root planning docs` | pass | Active manifests do not reference root planning docs or `stash.txt`. | Manifest/runtime boundary |
| `root planning boundary is documented as evidence classification, not a behavior fix` | pass | The proof slice is audit-only and keeps planning docs out of runtime authority. | Implementation gate |

## Identity Information Waterfall Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `identity_waterfall_doc_documents_actual_source_order` | pass | The current identity model is documented as page/endpoint payloads, main-world interception, JSON harvest, learned maps, DOM extraction, and background fallback. | Identity authority |
| `identity_waterfall_seed_intercepts_page_globals_and_youtubei_endpoints` | pass | `seed.js` hooks `ytInitialData`, `ytInitialPlayerResponse`, fetch, and XHR for YouTubei search/guide/browse/next/player paths. | JSON-first boundary |
| `identity_waterfall_filter_logic_harvests_player_renderer_playlist_and_kids_identity` | pass | The engine harvests owner, handle, video-channel, playlist, Kids owner extension, duration/date/category, and renderer byline identity into learned maps. | Learned identity |
| `identity_waterfall_content_bridge_persists_maps_and_uses_video_id_join_keys` | pass | Main-world map updates persist through the bridge, stamp DOM cards by video id, and can rerun DOM fallback after identity arrives. | Cross-context identity |
| `identity_waterfall_dom_extraction_has_explicit_low_confidence_boundaries` | pass | DOM extraction has modern lockup paths but also explicit low-confidence boundaries and watch owner `videoChannelMap` preference. | False-hide boundary |
| `identity_waterfall_background_fetch_checks_maps_or_caches_before_html_fetch` | pass | Shorts, Kids watch, and Main watch background fetches check stored/session/pending identity before credentialed HTML fetch. | Network fallback |
| `identity_waterfall_menu_actions_can_escalate_to_watch_or_shorts_resolvers` | pass | No-identifier menu actions can route through `shorts:VIDEO_ID` or `watch:VIDEO_ID` after map/ytInitialData attempts. | User-action resolver |
| `identity_waterfall_background_channel_details_fetch_is_action_fallback` | pass | `fetchChannelDetails` resolves channel pages through the background only as a channel-details fallback path. | Network fallback |
| `identity_waterfall_no_shared_authority_symbol_exists_yet` | pass-current-gap | The runtime has no shared `identityInformationWaterfallAuthority` or structured identity decision report. | Implementation gate |
| `identity_waterfall_reference_docs_do_not_overclaim_json_or_zero_network_completeness` | pass | The channel identity reference docs now describe learned maps as first-class, avoid blanket JSON completeness, and avoid claiming Kids is zero-network. | Documentation correctness |

## Audit Completion Gap Register Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `audit_completion_gap_register_is_audit_only_and_keeps_goal_open` | pass | The completion register is explicitly audit-only, changes no runtime behavior, and refuses to treat a green harness as complete audit coverage. | Implementation gate |
| `audit_completion_gap_register_derives_every_objective_term_into_a_closed_gate` | pass | Every objective term is mapped to a closed implementation gate: feature, file, method, JSON path, DOM selector, lifecycle primitive, settings mode, cross-feature interaction, and every risk class. | Objective coverage |
| `audit_completion_gap_register_lists_required_evidence_classes` | pass | The register names the proof classes still required before completion: positive/negative fixtures, owner/trigger/scope, route/action/target, disabled/no-rule cost, and zero-work counters. | Proof completeness |
| `audit_completion_gap_register_pins_identity_waterfall_over_old_four_step_shorthand` | pass | The identity model is pinned as JSON/page globals, learned maps, DOM/video-id joins, and background resolvers rather than a complete four-step guarantee. | Identity authority |
| `audit_completion_gap_register_blocks_implementation_categories` | pass | The register blocks JSON filtering changes, DOM fallback changes, empty-list semantic changes, simultaneous allow/block migration, learned-map trust changes, resolver deletion, lifecycle changes, and release claims without proof. | Implementation gate |
| `audit_completion_gap_register_has_no_runtime_authority_symbol_yet` | pass-current-gap | The runtime has no `auditCompletionAuthority`, `completeProofAuthority`, or `implementationGateOpen` symbol. | Implementation gate |
| `reference_docs_do_not_reintroduce_old_proactive_xhr_instant_blocking_claim` | pass | Current reference docs must not contain the old proactive-XHR instant-blocking claim and must retain the JSON-first caveat language. | Documentation correctness |

## Feature Source Dependency Register Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `feature_source_dependency_register_is_audit_only_and_defines_dependency_columns` | pass | The register is audit-only and requires rule-state source, content/text source, identity source, DOM/lifecycle source, side effects, current dependency risk, and proof gate columns. | Feature dependency authority |
| `feature_source_dependency_register_lists_required_feature_rows` | pass | The register covers visible feature rows such as blocklist, whitelist, content controls, comments, watch/player, Shorts, playlists, menus, quick block, Kids, YTM, sync, stats, profile/PIN, and release claims. | Feature coverage |
| `feature_source_dependency_register_pins_non_obvious_dependency_rows_from_review` | pass | Hidden dependency workflows from review are pinned, including endpoint no-work, collaborator/showSheet/avatar-stack recovery, posts/community, subscribed-channel whitelist import, prompt/onboarding, and simultaneous allow/block planning. | Cross-feature dependency |
| `feature_source_dependency_register_requires_source_confidence_and_side_effect_gates` | pass | Future behavior changes must name source confidence, allowed side effects, negative sibling-visible fixtures, no-work/budget fixtures, and cleanup/restore fixtures. | Implementation gate |
| `feature_source_dependency_register_cites_current_source_surfaces_for_rows` | pass | The register cites current source surfaces such as `js/seed.js`, `js/filter_logic.js`, `js/content_bridge.js`, `js/background.js`, `js/popup.js`, `js/settings_shared.js`, and release docs. | Source traceability |
| `feature_source_dependency_register_has_no_runtime_authority_symbol_yet` | pass-current-gap | Product source has no `featureSourceDependencyAuthority`, `featureDependencyReport`, or `sourceConfidenceByFeature` runtime symbol. | Implementation gate |
| `feature_source_dependency_register_is_linked_from_objective_and_stabilization_docs` | pass | The objective ledger and stabilization fix order now reference the feature-source dependency register as a blocked feature gate. | Audit continuity |

## Reference Doc Claim Drift Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `reference_doc_claim_drift_register_documents_current_scope` | pass | The claim-drift slice is audit-only and covers the current stale-doc families around identity, menu, network, Kids, playlist, and enrichment claims. | Documentation correctness |
| `reference_doc_claim_drift_scopes_public_readme_identity_and_privacy_claims` | pass | Public README, developer guide, and renderer inventory wording is scoped to JSON-first identity, learned maps, DOM fallback, bounded resolvers, and local-first extension storage instead of absolute instant, zero-network, or no-external-request claims. | Public claim correctness |
| `reference_doc_claim_drift_pins_stale_network_and_kids_claims` | pass-current-gap | Older network/technical docs still claim zero-network Kids and all-surface instant blocking while source retains Kids watch and normal watch fallback fetch paths. | Network fallback |
| `reference_doc_claim_drift_pins_channel_system_waterfall_as_source_tier_not_permission` | pass | Channel blocking docs now state the waterfall as source tier rather than source-of-truth authority, and tie future changes to profile/mode/route/renderer/source/effect proof. | Documentation correctness |
| `reference_doc_claim_drift_pins_menu_and_dom_overclaims` | pass-current-gap | Older 3-dot/functionality docs still claim always-successful DOM extraction or eliminated fetch delays while source has nullable extraction, `needsFetch`, and failure states. | Menu reliability |
| `reference_doc_claim_drift_pins_post_block_enrichment_as_post_action_not_passive_loop` | pass-current-gap | `CONTENT_HIDING_PLAYBOOK.md` now separates passive popup/tab enrichment from successful-block post-action enrichment, while source still lacks shared identity/fanout/network-fetch authorities. | Mutation/network authority |
| `reference_doc_claim_drift_links_to_source_truth_and_future_authorities` | pass-current-gap | The slice lists future reference-doc, identity-fetch, menu-resolution, and Kids-network authorities missing from source today. | Implementation gate |

## Collaborator Dialog Lifecycle Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `collab dialog lifecycle audit documents current behavior and future gate` | pass | The collaborator dialog slice is audit-only and names the future active-state, ownership, teardown, trust, and mutation authority fields. | Lifecycle authority |
| `collab dialog initializes only from DOMContentLoaded without a readyState branch` | pass-current-gap | Dialog recovery only initializes from a DOMContentLoaded listener and has no immediate late-injection path. | Late-init reliability |
| `collab dialog trigger listeners are permanent capture listeners today` | pass-current-gap | Click and keydown capture listeners are installed once on `document` without local removal. | No-rule lifecycle work |
| `collab dialog observer is document-wide and has no disconnect path` | pass-current-gap | A MutationObserver watches `documentElement || body` for dialog nodes with no local disconnect path. | Observer overwork |
| `pending collaborator trigger state is split between dialog helper and content bridge` | pass-current-gap | `content_bridge.js` owns pending entries while `collab_dialog.js` owns trigger state and timeout cleanup. | Split identity lifecycle |
| `collaboration dialog acceptance can proceed when title text is missing` | pass-current-gap | Non-collab titles are rejected, but no-title dialogs can proceed to collaborator-list extraction. | Dialog selector drift |
| `applyCollaboratorsToCard mutates card identity state and broadcasts page messages` | pass-current-gap | Dialog recovery writes collaborator attributes, updates maps/menu state, clears pending markers, and posts `FilterTube_CollabDialogData`. | Learned identity mutation |
| `collab dialog lifecycle has no central authority symbol today` | pass-current-gap | The current source has no central collaborator-dialog lifecycle authority. | Implementation gate |

## Settings Mode Source/Effect Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `settings mode source/effect doc is audit-only and connects source to allowed effect` | pass | The slice is audit-only and separates source selection from allowed effects under blocklist, whitelist, Main, Kids, and comments. | Settings-mode authority |
| `background compiler chooses profile and list mode before compiling block and allow sources` | pass | Background chooses profile from sender/request, sets `compiledSettings.listMode`, and compiles whitelist sources separately. | Compiler source authority |
| `main blocklist source is split between visible canonical rows and runtime alias precedence` | pass-current-gap | Visible Main rows read canonical lists while background blocklist compile can prefer stale `blocked*` aliases, and shared save does not clear aliases. | False-hide authority |
| `seed endpoint no-work currently treats empty blocklist and whitelist differently` | pass-current-gap | Search/channel JSON fast-skip is only retained outside whitelist mode; empty whitelist cannot reuse empty-blocklist no-work semantics. | Performance/no-work boundary |
| `JSON engine whitelist branch is fail-closed while blocklist rules run after that branch` | pass | JSON filtering hides on no whitelist rules, unresolved identity, or no allow match; blocklist rules still run outside that branch. | Hide decision |
| `DOM fallback whitelist path also fail-closes on no rules and unresolved identity` | pass | DOM fallback has matching fail-closed whitelist behavior plus local allow paths. | DOM hide authority |
| `engine behavior proves empty blocklist allows while empty whitelist hides normal video cards` | pass | Runtime behavior proves empty blocklist and empty whitelist have opposite meanings. | Mode semantics |
| `comment renderers remain a separate settings-mode proof surface` | pass-current-gap | Comment filtering has its own hide/comment-keyword/channel branch and must be proved separately from video-card whitelist behavior. | Comment mode boundary |
| `runtime source still lacks a unified settings mode source/effect authority` | pass-current-gap | No `settingsModeSourceEffectAuthority` or related decision object exists in runtime source. | Implementation gate |

## Mode/Surface Effect Matrix Current-Behavior Fixtures

| Fixture | Current result | What it proves | Risk class |
| --- | --- | --- | --- |
| `mode surface effect matrix doc treats waterfall as source priority not effect permission` | pass | The new slice is audit-only and separates source priority from allowed effects. | Source/effect authority |
| `background compile chooses surface from request or sender without viewing-space denial` | pass-current-gap | Background derives Main/Kids compile surface from request/sender and does not enforce viewing-space denial tokens. | Profile/runtime authority |
| `profile UI owns viewing-space flags while runtime source lacks enforcement authority token` | pass-current-gap | Tab-view edits `allowMainViewing` / `allowKidsViewing`, while runtime source lacks a mode/surface authority. | Viewing-space authority |
| `empty blocklist and empty whitelist remain opposite effect policies in JSON engine behavior` | pass | Empty blocklist allows a normal video card; empty whitelist hides unless an allow rule matches. | Mode semantics |
| `seed no-work logic is route and mode scoped rather than global zero work` | pass-current-gap | Search/channel/home no-work logic is route/mode-scoped and can still run harvest-only and snapshot work. | Performance/no-work boundary |
| `DOM fallback active-work predicate treats whitelist as active and blocklist as rule dependent` | pass | DOM fallback considers whitelist active by mode, while blocklist requires rules or enabled controls. | DOM lifecycle authority |
| `whitelist pending hides are a mode-specific effect separate from source tier` | pass-current-gap | Whitelist pending hide can add hidden markers before full source confidence is resolved, then schedules recheck. | False-hide boundary |
| `normal 3-dot menu action is gated, but lifecycle and enrichment need separate budgets` | pass-current-gap | Menu injection is gated by mode/settings, while successful blocks can still trigger Shorts and playlist enrichment. | Action/fanout authority |
| `surface-specific docs name YTM Kids Shorts watch playlist Mix comments and posts as separate proof rows` | pass | The doc records per-surface proof rows instead of treating the source waterfall as uniform. | Surface proof boundary |
| `runtime source lacks the future mode surface effect authority tokens` | pass-current-gap | No `modeSurfaceEffectAuthority` or related mode/surface policy token exists in runtime source. | Implementation gate |

## Next Proof Gates

The DOM-target and renderer-contract batch above covers the first bridge slice.
The next uncovered P0 fixture batch should add remaining positive/negative
DOM/renderer proof before runtime fixes:

```text
dom_watch_rail_no_primary_video_hide
dom_fallback_menu_post_insertion
main_watch_end_screen_dom_wall
compact_autoplay_renderer_positive_and_negative
post_menu_insertion_from_capture
playlist_json_creator_identity_from_capture
watch_card_direct_header_hero_rhs_negative_siblings_visible
```

Remaining endpoint policy fixtures after the no-rule baseline:

```text
seed_player_metadata_only_with_active_rules (current gap now fixture-proven)
seed_next_comment_hide_all_comments_scoped_rewrite
seed_guide_active_sidebar_rule
```

## Raw Capture Inputs

The root directory intentionally contains ignored YouTube capture files listed
in `.gitignore` (for example `YT_MAIN_NEXT.json`, `YT_MAIN_WATCH.html`,
`YT_MAIN_UPNEXT_FEED_WATCHPAGE*.json`, `reel_item_watch?prettyPrint=False.JSON`,
`ytkids_browse?alt=json.json`, and YTM captures). They are not shipped source,
but they are valid audit evidence inputs because they were used to build
`docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`.
Future fixture generation should copy only the minimal renderer fragments into
tracked tests, not commit the raw captures.

Current root capture families found during the audit:

| Capture family | Representative ignored files | Audit use |
| --- | --- | --- |
| YouTube Main JSON/XHR | `YT_MAIN.json`, `YT_MAIN_NEXT.json`, `YT_MAIN_next?prettyPrint.json`, `YT_MAIN_NEXT_RESPONSE_COMMENT.json`, `guide?prettyPrint=false.json` | Endpoint and renderer path evidence for Main feed/search/watch/comment/guide fixtures. |
| YouTube Main watch DOM | `YT_MAIN_WATCH.html`, `watchpage.json`, `get_watch?prettyPrint=false.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE*.json` | Watch-page DOM/JSON contract evidence for player, up-next, playlist, and end-screen fixture candidates. |
| Shorts/Reels | `reel_item_watch?prettyPrint=False.JSON` | Shorts/reel renderer identity evidence for channel and title matching fixtures. |
| YouTube Kids | `YT_KIDS.json`, `yt_kids_latest.json`, `ytkids_browse?alt=json.json` | Kids browse/watch route evidence; raw dumps stay ignored while small fragments become fixtures. |
| YouTube Music | `YTM.json`, `YTM-XHR.json`, `YTM-DOM.html`, `YTM-WATCH PLAYER.html`, `ytm_browse?prettyPrint=false.json` | YTM renderer/DOM comparison evidence for future YTM parity, not current Main YT fixes. |
| Collaboration/posts/playlists | `collab*.json`, `collab*.html`, `playlist.json`, `playlist.html`, `comments.json`, `DOMs.html` | Collaborator, post, comment, playlist, and 3-dot targeting evidence. |
| Local notes/imports/logs | `extracted_watch_paths.txt`, `import_channels.txt`, `logs.json`, `post_opt1_logs.txt`, `text.txt`, `tmp.json` | Temporary analysis notes and import test inputs; keep ignored unless distilled into docs/tests. |

## Main Watch HTML End-Screen Shape Classification Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/main-watch-html-endscreen-shape-classification-current-behavior.test.mjs` | Pins `YT_MAIN_WATCH.html` as embedded JSON evidence rather than DOM wall proof in `docs/audit/FILTERTUBE_MAIN_WATCH_HTML_ENDSCREEN_SHAPE_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md`: 69613 lines, 7873780 bytes, 21 raw `endScreenVideoRenderer` tokens, 27 raw `playlistPanelVideoRenderer` tokens, zero raw `compactAutoplayRenderer` tokens, zero player DOM end-screen selector tokens, parsed `ytInitialData` player overlay and playlist-panel renderer counts, and the remaining rendered DOM wall requirement. |

This addendum is audit-only. It does not add a reduced capture fixture because
the raw capture contains no rendered player end-screen DOM wall to preserve.

## Extracted Watch Paths Text Dump Classification Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/extracted-watch-paths-text-dump-classification-current-behavior.test.mjs` | Pins `extracted_watch_paths.txt` as a derived Main watch path dump rather than JSON, DOM, or fixture proof in `docs/audit/FILTERTUBE_EXTRACTED_WATCH_PATHS_TEXT_DUMP_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md`: 677 logical lines, 191278 bytes, two sections, 674 path/value rows, metadata and playlist collaborator-path tokens, zero `ytInitialData`, zero player DOM end-screen tokens, and zero watch-next/end-screen/compact-autoplay renderer keys. |

This addendum is audit-only. It does not close Main watch DOM wall,
`/player` metadata-only, endpoint, compact-autoplay, or no-playback gates.

## YTM Browse Channel List Item Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/ytm-browse-channel-list-item-current-behavior.test.mjs` | Pins one real YTM browse FEchannels `channelListItemRenderer` fixture from `ytm_browse?prettyPrint=false.json`: channel-list rows pass through blocklist and whitelist modes while two channel-map side effects are harvested, and `channelListItemRenderer` remains absent from direct `FILTER_RULES`. |

This addendum is audit-only. It keeps JSON browse channel-list proof separate
from the YTM watch/player DOM proof slice because browse JSON and rendered
player DOM have different failure modes.

## YTM Watch Player DOM Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/ytm-watch-player-dom-current-behavior.test.mjs` | Pins one already-mutated rendered YTM watch/player DOM capture from `YTM-WATCH PLAYER.html`: player-shell selectors, `ytm-watch-player-controls`, 25 playlist rows, selected hidden current row behavior, visible and hidden sibling rows, FilterTube markers, broad playlist/player CSS selectors, and selected-row pause/click side-effect source remain audit evidence rather than an implementation fix. |

This addendum is audit-only. It proves a partial watch/player DOM guardrail
while keeping pass-through, whitelist, no-playback-side-effect,
observer-budget, and JSON/DOM parity proof open.

## YTM Watch Player Selected Row Side Effect Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/ytm-watch-player-selected-row-side-effect-boundary-current-behavior.test.mjs` | Pins the YTM selected/current-row side-effect boundary from `YTM-WATCH PLAYER.html` and `js/content/dom_fallback.js`: selected hidden row plus player-video context, YTM selected-row detection, current-watch owner pause/hide/click/retry behavior, manual next/previous guard behavior, autoplay-ended guard behavior, selected-row skip scheduling, and hidden-selected-row retry behavior remain current side-effect evidence rather than a safe whitelist or JSON-first policy. |

This addendum is audit-only. It narrows the no-playback proof gap by naming the
current side-effect owners, but still keeps first-class selected-row playback
policy, mode matrix, synthetic navigation budget, autoplay budget, collapsed
panel budget, restore report, and metric proof open.

## YTM Watch Player Whitelist Selected Row Mode Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/ytm-watch-player-whitelist-selected-row-mode-boundary-current-behavior.test.mjs` | Pins the current YTM watch/player whitelist selected-row mode boundary across `YTM-WATCH PLAYER.html`, the reduced YTM watch/player DOM fixture, `js/content/dom_fallback.js`, and `js/filter_logic.js`: DOM selected rows are generically restored in whitelist mode, blocklist selected rows can schedule next-button clicks, current-watch side effects are skipped in whitelist, YTM watch metadata restore lacks a YTM-specific branch, and JSON `playlistPanelVideoRenderer` whitelist filtering has no selected/current-row exemption. |

This addendum is audit-only. It proves that DOM selected-row behavior and JSON
playlist-panel behavior are not interchangeable for YTM whitelist optimization.
The implementation gate remains closed pending selected-row policy, JSON/DOM
parity, current-video decision reports, playback side-effect reports, fixtures,
metrics, leak reports, and an explicit optimization gate.

## YTM Watch Player Observer Timer Budget Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/ytm-watch-player-observer-timer-budget-current-behavior.test.mjs` | Pins the YTM watch/player observer, listener, and timer budget across `YTM-WATCH PLAYER.html`, the reduced YTM watch/player DOM fixture, `js/content/dom_fallback.js`, `js/content_bridge.js`, and `js/content/block_channel.js`: raw observer markers and quick-block buttons, DOM playlist click/ended guards, content-bridge whitelist-pending and fallback mutation queues, YTM fallback-menu scans, quick-block YTM selector admission, and page-lifetime quick-block observer setup remain current behavior rather than an optimization contract. |

This addendum is audit-only. It proves YTM watch/player is still touched by
multiple observer/listener/timer owners even when whitelist action paths return
early. Observer budget, lifecycle ownership, whitelist no-work behavior, rerun
budgets, metrics, and first-class optimization authority remain open.

## YTM Show Sheet Enrichment Handoff Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/ytm-show-sheet-enrichment-handoff-current-behavior.test.mjs` | Pins the captured headerless YTM showSheet enrichment handoff from `content_bridge` to `injector`: the bridge sends partial expected name `Shakira` plus expected count `3`, injector promotes the expected count into roster fallback, fuzzy-matches `Shakira` to `shakiraVEVO`, returns the full Shakira/Spotify/Beele roster from `lastYtNextResponse`, and `filter_logic` still has zero `showSheetCommand` decision authority. |

This addendum is audit-only. It proves that enrichment can recover the roster
after a partial bridge seed, not that blocklist or whitelist filtering uses that
roster.

## Shorts Reel Overlay Owner Authority Boundary Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/shorts-reel-overlay-owner-authority-boundary-current-behavior.test.mjs` | Pins the active Shorts/reel overlay owner boundary from `reel_item_watch?prettyPrint=False.JSON`: the reduced `reelPlayerOverlayRenderer` fixture carries owner UC id `UC-6YsZ1GcOMIehkb8eHioUQ`, handle `@ElectricRevolution`, subscribe-button channel id, channel-name command run, canonical URL, and avatar evidence; processing queues a channel-map side effect, but direct overlay processing preserves the payload under matching blocklist and whitelist channel rules because `reelPlayerOverlayRenderer` is not a direct filter rule. |

This addendum is audit-only. It proves that active Shorts/reel overlay owner
fields are captured evidence, not first-class JSON filter authority.

## Main Compact Radio Playlist Id Authority Boundary Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/main-compact-radio-playlist-id-authority-boundary-current-behavior.test.mjs` | Main compact radio playlist id authority boundary addendum: pins the real `playlist.json` `compactRadioRenderer` fixture as generated Mix proof where `RDEPo5wWmKEaI`, seed video ids, and display-only YouTube bylines are present, but creator channel fields are absent. Current runtime preserves the row with no rule, channel blocklist, playlist-id keyword, seed-video keyword, and `hideMixPlaylists`; title keyword removes it; channel whitelist fails closed; title whitelist allows it; no map side effects fire. |

This addendum is audit-only. It proves playlist id, seed video id, display
byline, and creator/channel identity are separate authorities before any
JSON-first Mix/radio optimization.

## Notification Renderer Source-Only Boundary Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/notification-renderer-source-only-boundary-current-behavior.test.mjs` | Notification renderer source-only boundary addendum: pins that `js/filter_logic.js` has a direct `notificationRenderer` rule and synthetic notification rows can filter by keyword/channel or allow by whitelist channel, but committed capture fixtures contain no real `notificationRenderer` row. `hideNotificationBell` preserves the JSON notification row, and direct processing can queue a channel-map side effect when browse id and handle fields are present. |

This addendum is audit-only. It separates direct source behavior from
fixture-backed notification route authority before notification/bell
optimization.

## Shared Post Renderer Source-Only Boundary Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/shared-post-renderer-source-only-boundary-current-behavior.test.mjs` | Shared post renderer source-only boundary addendum: pins that `docs/json_paths_encyclopedia.md` documents `sharedPostRenderer` sharer/original-post paths, but `js/filter_logic.js` has no direct `postRenderer` or `sharedPostRenderer` rule and committed capture fixtures contain no real `sharedPostRenderer` row. Synthetic shared posts preserve under nested original keyword matches, sharer/original channel blocklist matches, whitelist matches, and whitelist nonmatches while channel-map side effects can still harvest both sharer and original identities; a supported legacy `backstagePostRenderer` sibling can be removed independently. |

This addendum is audit-only. It separates shared-post documentation and harvest
side effects from first-class shared-post hide/allow authority before any
JSON-first community-post optimization.

## Main Post Community DOM Insertion Fixture-Gap Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/main-post-community-dom-insertion-fixture-gap-current-behavior.test.mjs` | Main post community DOM insertion fixture-gap addendum: pins that native clicked-menu targeting and post author extraction source contain post renderer selectors, but the fallback 3-dot scan omits post renderers and the committed fixture corpus still lacks a clean Main post/community action-menu fixture. Existing evidence is split across a YTM post DOM fixture, an already-mutated Main DOM fixture with no post/header/action-menu/permalink tokens, and a Main embedded `postRenderer` JSON fixture that does not prove DOM insertion behavior. |

This addendum is audit-only. It keeps post/community menu insertion, fallback
scan parity, whitelist/no-work behavior, and sibling-visible proof gated until
a clean Main post DOM fixture exists.

## P0 Optimization Metric Work Decision Authority Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/p0-optimization-metric-work-decision-authority-current-behavior.test.mjs` | P0 optimization metric work decision authority addendum: `docs/audit/FILTERTUBE_P0_OPTIMIZATION_METRIC_WORK_DECISION_AUTHORITY_CURRENT_BEHAVIOR_2026-05-24.md` pins the six P0 authority rows that must exist before JSON-first or whitelist optimization behavior changes: metric artifact authority, seed transport work decision, harvest versus mutation decision, list-mode and whitelist work decision, lifecycle owner work decision, and diagnostic measurement policy. It proves that all six remain implementation-blocking current gaps and that runtime source still lacks first-class optimization metric/work-decision authority symbols. |

This addendum is audit-only. It keeps optimization blocked until one measured
route/surface/list-mode work decision report can cover endpoint transport,
harvest, mutation, lifecycle, diagnostics, side effects, parity, and fixtures.

## P0 Optimization Route Surface Metric Fixture Matrix Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/p0-optimization-route-surface-metric-fixture-matrix-current-behavior.test.mjs` | P0 optimization route surface metric fixture matrix addendum: `docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` pins 12 route/surface metric fixture obligations that must exist before JSON-first or whitelist optimization behavior changes. It ties disabled, empty blocklist, empty whitelist, active blocklist, unresolved whitelist, category/content, lifecycle-affordance, and diagnostic scenarios to five YouTubei endpoint families, settings-mode fixtures, route/surface effect classes, and future metric artifact columns. |

This addendum is audit-only. It keeps route/surface optimization blocked until
metric artifacts and work-decision reports exist for disabled, empty, active,
whitelist, lifecycle, side-effect, restore, parity, and diagnostic scenarios.

## Optimization Stop Go Decision Record Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/optimization-stop-go-decision-record-current-behavior.test.mjs` | Optimization stop go decision record addendum: `docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md` pins the current implementation decision: stop-now whitelist optimization is NO-GO, stop-now JSON-first optimization is NO-GO, continued proof-backed pre-implementation audit is GO, and the first future runtime patch remains gated behind candidate id, obligation id, route/surface/list-mode proof, metric artifact, side-effect budgets, DOM/native parity, and fixture provenance. |

This addendum is audit-only. It keeps whitelist, JSON-first, lifecycle,
logging, and transport optimization changes blocked until a future patch proves
one scoped work-decision or metric-artifact authority.

2026-05-27 release stabilization stop/go revalidation: no-work JSON gates,
forced visible-card reprocess, canonical Main keyword compilation,
quick-block/menu/native menu repairs, and `Kully B & Gussy G - Topic`
ampersand handling are documented in the same stop/go record; stop-now broad
whitelist optimization remains NO-GO, stop-now broad JSON-first promotion
remains NO-GO, continued audit remains GO, and the first future optimization
patch remains GATED.

## Whitelist Optimization Readiness Gap Matrix Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/whitelist-optimization-readiness-gap-matrix-current-behavior.test.mjs` | Whitelist optimization readiness gap matrix addendum: `docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` pins 10 whitelist readiness gaps that must be resolved before optimizing recent whitelist behavior: empty whitelist policy, unresolved identity policy, list-mode conflict policy, transition mutation policy, import dormant-mode policy, pending-hide lifecycle policy, watch right-rail policy, JSON/DOM selected-row parity, surface parity, and metric/entry gate. |

This addendum is audit-only. It keeps whitelist optimization blocked until
empty-list, identity, comment, pending-hide, selected-row, transition, import,
surface parity, side-effect, and metric evidence exists.

## First Optimization Patch Evidence Packet Contract Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/first-optimization-patch-evidence-packet-contract-current-behavior.test.mjs` | First optimization patch evidence packet contract addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` pins the evidence packet required before the first runtime optimization patch can leave audit mode. It requires one candidate id, one obligation id, scoped route/surface/list-mode/source-locus fields, work budgets, positive/negative fixtures, false-hide/leak/restore proof, JSON/DOM/native parity, lifecycle budgets, settings mutation policy, diagnostic privacy, and rollout claim boundaries. |

This addendum is audit-only. It keeps runtime optimization blocked until a
future patch provides the scoped evidence packet rather than only a source
change, path addition, local benchmark, or broad claim.

## JSON-First Implementation Authority Boundary Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/json-first-implementation-authority-boundary-current-behavior.test.mjs` | JSON-first implementation authority boundary addendum: `docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` consolidates the JSON-first readiness gate, no-work optimization crosswalk, implementation locus register, rule path/field proof, list-mode and whitelist identity boundaries, candidate-obligation binding matrix, first-optimization source-locus implementation authority, whitelist readiness, and implementation readiness gate into one NO-GO boundary. It pins 13 JSON-first implementation authority rows, 13 JSON-first readiness promotion rows covered, 7 no-work optimization candidates covered, 16 current JSON-first source anchors covered, 440 filter logic path semantic rows covered, 11 filter logic field-effect rows covered, 10 candidate-obligation binding rows covered, 12 first optimization source-locus implementation rows covered, 10 whitelist readiness gaps covered, 14 first optimization implementation readiness rows covered, 0 runtime JSON-first implementation approvals, 0 runtime JSON-first promotion authority rows, 0 runtime whitelist optimization approvals, 0 runtime metric collector approvals, 0 committed JSON-first metric artifacts, 0 implementation-ready JSON-first rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps JSON-first filtering as the first-class
future direction found by code inspection while preserving the current NO-GO
boundary for runtime JSON-first promotion, whitelist optimization, transport
pass-through, DOM fallback pruning, lifecycle pruning, diagnostics, metric
artifacts, release packages, native sync, and public claims.

## JSON-First Route/Surface Implementation Authority Boundary Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/json-first-route-surface-implementation-authority-boundary-current-behavior.test.mjs` | JSON-first route/surface implementation authority boundary addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` binds route/surface effect authority, route/surface metric obligations, JSON-first implementation authority, list-mode and whitelist identity boundaries, candidate-obligation bindings, and first-optimization readiness into one route/surface NO-GO boundary. It pins 12 JSON-first route/surface implementation authority rows, 9 route/surface effect classes covered, 12 route/surface metric obligations covered, 5 endpoint families covered, 6 surface families covered, 13 JSON-first implementation authority rows covered, 13 JSON-first readiness promotion rows covered, 6 JSON-first list-mode states covered, 7 JSON-first whitelist decision states covered, 10 candidate-obligation binding rows covered, 14 first optimization implementation readiness rows covered, 0 runtime JSON-first route/surface approvals, 0 runtime route/surface metric artifacts, 0 runtime JSON-first implementation approvals, 0 runtime whitelist optimization approvals, 0 runtime metric collector approvals, 0 implementation-ready JSON-first route/surface rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps endpoint-shaped JSON rows from becoming
route/surface implementation authority until exact route, surface, endpoint,
list-mode, side-effect, parity, fixture, metric, rollback, native/release, and
public-claim proof exists.

## JSON-First Route/Surface Fixture Packet Contract Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/json-first-route-surface-fixture-packet-contract-current-behavior.test.mjs` | JSON-first route/surface fixture packet contract addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the fixture packet still missing before JSON-first route/surface implementation authority can exist. It pins 12 JSON-first route/surface fixture packet rows, 12 route/surface authority rows covered, 12 route/surface metric obligations covered, 5 endpoint families covered, 6 surface families covered, 8 fixture mode classes required, 14 fixture evidence classes required, 13 JSON-first implementation authority rows covered, 14 first optimization implementation readiness rows covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 0 runtime JSON-first fixture packet approvals, 0 runtime route/surface metric artifacts, 0 runtime metric collector approvals, 0 committed route/surface fixture packet files, 0 implementation-ready JSON-first fixture packet rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps JSON-first route/surface filtering
blocked until route/surface fixture packets, metrics, parity, diagnostics,
rollback, native/release, and public-claim proof exist.

## JSON-First Route/Surface Fixture Artifact Path Boundary Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/json-first-route-surface-fixture-artifact-path-boundary-current-behavior.test.mjs` | JSON-first route/surface fixture artifact path boundary addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` reserves the future JSON-first route/surface fixture packet artifact location without creating files or approving implementation. It pins 6 JSON-first route/surface fixture artifact path rows, 1 reserved future artifact root, 5 reserved future artifact files, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 0 committed route/surface fixture packet files, 0 runtime JSON-first fixture packet approvals, 0 runtime route/surface metric artifacts, 0 runtime metric collector approvals, 0 implementation-ready route/surface fixture artifact path rows, 12 fixture packet contract rows covered, 12 route/surface authority rows covered, 12 route/surface metric obligations covered, 8 fixture mode classes covered, 14 fixture evidence classes covered, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps the reserved JSON-first route/surface
fixture packet paths from becoming implementation authority before committed
fixtures, metrics, parity, diagnostics, rollback, native/release, and
public-claim proof exist.

## JSON-First Route/Surface Fixture Artifact Commit Readiness Gate Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/json-first-route-surface-fixture-artifact-commit-readiness-gate-current-behavior.test.mjs` | JSON-first route/surface fixture artifact commit readiness gate addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` proves the reserved JSON-first route/surface fixture artifact root and files are not commit-ready. It pins 10 JSON-first route/surface fixture artifact commit readiness rows, 1 reserved future artifact root, 5 reserved future artifact files, 6 fixture artifact path boundary rows covered, 12 fixture packet contract rows covered, 12 route/surface authority rows covered, 12 route/surface metric obligations covered, 8 fixture mode classes covered, 14 fixture evidence classes covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 0 committed route/surface fixture packet files, 0 runtime JSON-first fixture packet approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 implementation-ready route/surface fixture artifact commit rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps the reserved JSON-first route/surface
fixture packet root and files from being committed until fixture provenance,
metrics, no-work, side effects, parity, diagnostics, rollback, native/release,
raw-capture exclusion, and public-claim proof exist.

## JSON-First Route/Surface Fixture Artifact Contract Coverage Gate Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/json-first-route-surface-fixture-artifact-contract-coverage-gate-current-behavior.test.mjs` | JSON-first route/surface fixture artifact contract coverage gate addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md` proves the reserved route/surface fixture artifact contract coverage is complete at the per-file contract level while artifact approval remains blocked. It pins 10 JSON-first route/surface fixture artifact contract coverage rows, 1 reserved future artifact root, 5 reserved future artifact files, 1 aggregate fixture packet contract doc, 1 aggregate fixture packet contract test, 5 per-file fixture artifact contract docs, 5 per-file fixture artifact contract tests, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 0 committed route/surface fixture packet files, 0 runtime JSON-first fixture packet approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 implementation-ready route/surface fixture artifact contract coverage rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps route/surface fixture artifacts from
becoming JSON-first implementation authority until per-file contract decisions,
fixture provenance, metrics, no-work, side effects, parity, diagnostics,
rollback, native/release, raw-capture exclusion, public-claim proof, and exact
verification output exist.

## JSON-First Route/Surface Fixture Manifest Contract Addendum

| File | Purpose |
| --- | --- |
| `tests/runtime/json-first-route-surface-fixture-manifest-contract-current-behavior.test.mjs` | JSON-first route/surface fixture manifest contract addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future route/surface fixture `manifest.json` contract without creating the manifest artifact. It pins 12 JSON-first route/surface fixture manifest contract rows, 1 reserved manifest path, 12 aggregate fixture packet contract rows covered, 10 artifact contract coverage rows covered, 6 artifact path boundary rows covered, 10 artifact commit readiness rows covered, 12 route/surface authority rows covered, 12 route/surface metric obligations covered, 8 fixture mode classes covered, 14 fixture evidence classes covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 0 committed route/surface fixture manifest files, 0 committed route/surface fixture packet files, 0 runtime JSON-first fixture manifest approvals, 0 runtime JSON-first fixture packet approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 implementation-ready JSON-first fixture manifest contract rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps the future route/surface fixture
manifest out of JSON-first implementation authority until the actual manifest,
fixture sample, provenance, parity report, verification output, metrics,
no-work, side effects, diagnostics, rollback, native/release, raw-capture
exclusion, and public-claim proof exist.

## JSON-First Route/Surface Fixture Sample Contract Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-fixture-sample-contract-current-behavior.test.mjs` | JSON-first route/surface fixture sample contract addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future route/surface fixture `fixture-sample.json` contract without creating the sample artifact. It pins 12 JSON-first route/surface fixture sample contract rows, 1 reserved sample path, 12 aggregate fixture packet contract rows covered, 10 artifact contract coverage rows covered, 6 artifact path boundary rows covered, 10 artifact commit readiness rows covered, 12 route/surface authority rows covered, 12 route/surface metric obligations covered, 8 fixture mode classes covered, 14 fixture evidence classes covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 0 committed route/surface fixture sample files, 0 committed route/surface fixture packet files, 0 runtime JSON-first fixture sample approvals, 0 runtime JSON-first fixture packet approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 implementation-ready JSON-first fixture sample contract rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps the future route/surface fixture sample
out of JSON-first implementation authority until the actual sample,
provenance, parity report, verification output, metrics, no-work, side
effects, diagnostics, rollback, native/release, raw-capture exclusion, and
public-claim proof exist.

## JSON-First Route/Surface Fixture Provenance Artifact Contract Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-fixture-provenance-artifact-contract-current-behavior.test.mjs` | JSON-first route/surface fixture provenance artifact contract addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PROVENANCE_ARTIFACT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future route/surface fixture `provenance.json` contract without creating the provenance artifact. It pins 12 JSON-first route/surface fixture provenance artifact contract rows, 1 reserved provenance path, 12 manifest contract rows covered, 12 fixture sample contract rows covered, 12 aggregate fixture packet contract rows covered, 12 source fixture provenance contract rows covered, 10 artifact contract coverage rows covered, 6 artifact path boundary rows covered, 10 artifact commit readiness rows covered, 12 route/surface authority rows covered, 12 route/surface metric obligations covered, 12 collector fixture provenance rows covered, 8 fixture mode classes covered, 14 fixture evidence classes covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 0 committed route/surface fixture provenance artifact files, 0 committed route/surface fixture packet files, 0 runtime JSON-first fixture provenance approvals, 0 runtime JSON-first fixture packet approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 implementation-ready JSON-first fixture provenance artifact contract rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps the future route/surface fixture
provenance artifact out of JSON-first implementation authority until the
actual provenance artifact, parity report, verification output, metrics,
no-work, side effects, diagnostics, rollback, native/release, raw-capture
exclusion, and public-claim proof exist.

## JSON-First Route/Surface Fixture Parity Report Contract Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-fixture-parity-report-contract-current-behavior.test.mjs` | JSON-first route/surface fixture parity report contract addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PARITY_REPORT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future route/surface fixture `parity-report.json` contract without creating the parity report artifact. It pins 12 JSON-first route/surface fixture parity report contract rows, 1 reserved parity report path, 12 manifest contract rows covered, 12 fixture sample contract rows covered, 12 provenance artifact contract rows covered, 12 aggregate fixture packet contract rows covered, 12 parity rollout contract rows covered, 12 collector parity rollout rows covered, 10 artifact contract coverage rows covered, 6 artifact path boundary rows covered, 10 artifact commit readiness rows covered, 12 route/surface authority rows covered, 12 route/surface metric obligations covered, 8 fixture mode classes covered, 14 fixture evidence classes covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 0 committed route/surface fixture parity report files, 0 committed route/surface fixture packet files, 0 runtime JSON-first fixture parity report approvals, 0 runtime JSON-first fixture packet approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 implementation-ready JSON-first fixture parity report contract rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps the future route/surface fixture parity
report out of JSON-first implementation authority until the actual parity
report, verification output, metrics, no-work, side effects, diagnostics,
rollback, native/release, raw-capture exclusion, and public-claim proof exist.

## JSON-First Route/Surface Fixture Verification Output Contract Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-fixture-verification-output-contract-current-behavior.test.mjs` | JSON-first route/surface fixture verification output contract addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future route/surface fixture `verification-output.tap` contract without creating the TAP artifact. It pins 12 JSON-first route/surface fixture verification output contract rows, 1 reserved verification output path, 12 manifest contract rows covered, 12 fixture sample contract rows covered, 12 provenance artifact contract rows covered, 12 parity report contract rows covered, 12 aggregate fixture packet contract rows covered, 12 first optimization verification output rows covered, 10 artifact contract coverage rows covered, 6 artifact path boundary rows covered, 10 artifact commit readiness rows covered, 12 route/surface authority rows covered, 12 route/surface metric obligations covered, 8 fixture mode classes covered, 14 fixture evidence classes covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 0 committed route/surface fixture verification output files, 0 committed route/surface fixture packet files, 0 runtime JSON-first fixture verification output approvals, 0 runtime JSON-first fixture packet approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 implementation-ready JSON-first fixture verification output contract rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps the future route/surface fixture
verification output out of JSON-first implementation authority until the
actual TAP output, metrics, no-work, side effects, diagnostics, rollback,
native/release, raw-capture exclusion, and public-claim proof exist.

## First Optimization Collector Source-Locus Closure Boundary Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/first-optimization-collector-source-locus-closure-boundary-current-behavior.test.mjs` | First optimization collector source-locus closure boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_SOURCE_LOCUS_CLOSURE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves source-locus classification coverage is not collector approval. It pins 12 collector source-locus closure rows, 12 collector approval authority rows covered, 12 source-locus implementation authority rows covered, 12 source-owner approval rows covered, 12 source-locus callable rows covered, 12 teardown rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 diagnostic privacy rows covered, 12 parity release verification rows covered, 12 artifact commit readiness rows covered, 12 metric foundation contract coverage rows covered, 14 implementation readiness rows covered, 63 method semantic proof gap files covered, 5,469 lexical callables still requiring semantic proof, 0 files with complete per-callable semantic proof, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 committed metric foundation artifact files, 0 implementation-ready collector source-locus closure rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps collector insertion, JSON-first runtime
behavior changes, whitelist optimization, native sync changes, release package
changes, and public claims blocked until source-locus classification is
replaced by owner-approved collector artifacts and exact verification output.

## First Optimization Collector Insertion Approval Boundary Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/first-optimization-collector-insertion-approval-boundary-current-behavior.test.mjs` | First optimization collector insertion approval boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_INSERTION_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves mapped collector insertion risks are not runtime insertion approval. It pins 12 collector insertion approval boundary rows, 12 collector approval authority rows covered, 12 collector insertion gate rows covered, 12 source-owner approval rows covered, 12 collector source-locus closure rows covered, 12 no-work rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 diagnostic privacy rows covered, 12 parity rollout rows covered, 12 verification output rows covered, 12 rollback/unclaimed rows covered, 63 method semantic proof gap files covered, 5,469 lexical callables still requiring semantic proof, 0 files with complete per-callable semantic proof, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 implementation-ready collector insertion approval rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps mapped insertion points, JSON-first
runtime behavior changes, whitelist optimization, native sync changes, release
package changes, and public claims blocked until passive read-only proof,
owner-approved artifacts, exact verification output, and rollback/public-claim
limits exist.

## First Optimization Collector No-Work Approval Boundary Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/first-optimization-collector-no-work-approval-boundary-current-behavior.test.mjs` | First optimization collector no-work approval boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_NO_WORK_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves no-work matrix rows, no-work contracts, source-locus no-work classifications, and lexical callable counts are not runtime no-work approval. It pins 12 collector no-work approval boundary rows, 12 collector no-work preservation rows covered, 12 no-work preservation contract rows covered, 12 source-locus no-work rows covered, 12 collector insertion approval rows covered, 12 collector approval authority rows covered, 12 collector insertion gate rows covered, 12 side-effect rows covered, 12 fixture provenance rows covered, 12 diagnostic privacy rows covered, 12 parity rollout rows covered, 12 verification output rows covered, 12 rollback/unclaimed rows covered, 4 P0 no-work fixture names covered, 9 required no-work counter groups covered, 63 method semantic proof gap files covered, 5,469 lexical callables still requiring semantic proof, 0 files with complete per-callable semantic proof, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 runtime collector no-work proofs approved, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 committed no-work preservation files, 0 implementation-ready collector no-work approval rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps no-work optimization, collector
insertion, JSON-first runtime behavior changes, whitelist optimization, native
sync changes, release package changes, and public claims blocked until a
persisted no-work packet, exact verification output, owner approval, and
rollback/public-claim limits exist.

## First Optimization Collector Side-Effect Approval Boundary Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/first-optimization-collector-side-effect-approval-boundary-current-behavior.test.mjs` | First optimization collector side-effect approval boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_SIDE_EFFECT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves side-effect matrix rows, side-effect contracts, source-locus side-effect classifications, and lexical callable counts are not runtime side-effect approval. It pins 12 collector side-effect approval boundary rows, 12 collector side-effect budget rows covered, 12 side-effect budget contract rows covered, 12 source-locus side-effect rows covered, 12 collector no-work approval rows covered, 12 collector insertion approval rows covered, 12 collector approval authority rows covered, 12 collector insertion gate rows covered, 12 collector no-work preservation rows covered, 12 fixture provenance rows covered, 12 diagnostic privacy rows covered, 12 parity rollout rows covered, 12 verification output rows covered, 12 rollback/unclaimed rows covered, 12 required work-budget fields covered, 53 current source side-effect anchors covered, 8 side-effect risk classes covered, 63 method semantic proof gap files covered, 5,469 lexical callables still requiring semantic proof, 0 files with complete per-callable semantic proof, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 runtime collector no-work proofs approved, 0 runtime collector side-effect budgets approved, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 committed side-effect budget files, 0 implementation-ready collector side-effect approval rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps side-effect-budgeted measurement,
collector insertion, JSON-first runtime behavior changes, whitelist
optimization, native sync changes, release package changes, and public claims
blocked until a persisted side-effect packet, exact verification output, owner
approval, and rollback/public-claim limits exist.

## First Optimization Collector Fixture Provenance Approval Boundary Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/first-optimization-collector-fixture-provenance-approval-boundary-current-behavior.test.mjs` | First optimization collector fixture provenance approval boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_FIXTURE_PROVENANCE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves fixture provenance matrix rows, fixture provenance contracts, source-locus fixture provenance classifications, and lexical callable counts are not runtime fixture provenance approval. It pins 12 collector fixture provenance approval boundary rows, 12 collector fixture provenance rows covered, 12 fixture provenance contract rows covered, 12 source-locus fixture provenance rows covered, 12 collector side-effect approval rows covered, 12 collector no-work approval rows covered, 12 collector insertion approval rows covered, 12 collector approval authority rows covered, 12 collector side-effect budget rows covered, 12 collector no-work preservation rows covered, 12 diagnostic privacy rows covered, 12 parity rollout rows covered, 12 verification output rows covered, 12 rollback/unclaimed rows covered, 11 P0 capture traceability rows covered, 46 unique raw capture obligation paths covered, 44 committed reduced fixture fragments covered, 25 current fixture provenance anchors covered, 8 fixture provenance risk classes covered, 63 method semantic proof gap files covered, 5,469 lexical callables still requiring semantic proof, 0 files with complete per-callable semantic proof, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 runtime collector no-work proofs approved, 0 runtime collector side-effect budgets approved, 0 runtime collector fixture packets approved, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 committed fixture provenance files, 0 implementation-ready collector fixture provenance approval rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps fixture-backed measurement, collector
insertion, JSON-first runtime behavior changes, whitelist optimization, native
sync changes, release package changes, and public claims blocked until a
persisted fixture provenance packet, exact verification output, owner approval,
and rollback/public-claim limits exist.

## First Optimization Collector Diagnostic Privacy Approval Boundary Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/first-optimization-collector-diagnostic-privacy-approval-boundary-current-behavior.test.mjs` | First optimization collector diagnostic privacy approval boundary addendum: `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_DIAGNOSTIC_PRIVACY_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves diagnostic privacy contracts, source-locus diagnostic classifications, and console inventory are not runtime diagnostic privacy approval. It pins 12 collector diagnostic privacy approval boundary rows, 12 diagnostic privacy contract rows covered, 12 source-locus diagnostic privacy rows covered, 12 collector fixture provenance approval rows covered, 12 collector side-effect approval rows covered, 12 collector no-work approval rows covered, 12 collector insertion approval rows covered, 12 collector approval authority rows covered, 12 collector fixture provenance rows covered, 12 parity rollout rows covered, 12 verification output rows covered, 12 rollback/unclaimed rows covered, 21 diagnostic logging policy source files covered, 418 active console callsites covered, 203 console.log callsites covered, 123 console.warn callsites covered, 68 console.error callsites covered, 24 console.debug callsites covered, 35 current diagnostic privacy anchors covered, 8 diagnostic privacy risk classes covered, 63 method semantic proof gap files covered, 5,469 lexical callables still requiring semantic proof, 0 files with complete per-callable semantic proof, 0 runtime source-owner approvals, 0 runtime metric collector approvals, 0 runtime collector insertion points approved, 0 runtime collector no-work proofs approved, 0 runtime collector side-effect budgets approved, 0 runtime collector fixture packets approved, 0 runtime collector diagnostic privacy approvals, 0 runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 committed diagnostic privacy files, 0 implementation-ready collector diagnostic privacy approval rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, and no runtime behavior changed. |

This addendum is audit-only. It keeps diagnostic/privacy measurement, logging
removal, collector insertion, JSON-first runtime behavior changes, whitelist
optimization, native sync changes, release package changes, and public claims
blocked until a persisted diagnostic privacy packet, exact verification output,
owner approval, and rollback/public-claim limits exist.

## JSON-First Route/Surface Metric Artifact Approval Boundary Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-metric-artifact-approval-boundary-current-behavior.test.mjs` | JSON-first route/surface metric artifact approval boundary addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` proves route/surface metric obligations, fixture approval absence, metric schema rows, source-owner rows, collector insertion rows, no-work rows, side-effect rows, and fixture provenance rows are not runtime metric artifact approval. It pins 12 JSON-first route/surface metric artifact approval boundary rows, 12 route/surface metric obligations covered, 12 JSON-first fixture approval rows covered, 12 metric artifact schema rows covered, 12 metric source-owner rows covered, 12 collector insertion rows covered, 12 collector no-work rows covered, 12 collector side-effect rows covered, 12 collector fixture provenance rows covered, 14 implementation readiness rows covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 runtime JSON-first implementation approvals, 0 runtime whitelist optimization approvals, 0 committed route/surface metric artifact files, 0 committed JSON-first fixture packet files, 0 implementation-ready route/surface metric artifact approval rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, runtime audit summary tests 4457, pass 4457, and no runtime behavior changed. |

This addendum is audit-only. It keeps route/surface metric artifact approval,
collector approval, JSON-first implementation, whitelist optimization, native
sync changes, release package changes, and public claims blocked until a
persisted, owner-approved metric artifact packet exists.

## JSON-First Route/Surface Metric Artifact Path Boundary Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-metric-artifact-path-boundary-current-behavior.test.mjs` | JSON-first route/surface metric artifact path boundary addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` reserves the future route/surface metric artifact root and files without creating them. It pins 6 JSON-first route/surface metric artifact path rows, 1 reserved future metric artifact root, 5 reserved future metric artifact files, 1 related first-optimization foundation sample path, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 0 committed route/surface metric artifact files, 0 committed first-optimization foundation metric sample files, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 runtime JSON-first implementation approvals, 0 runtime whitelist optimization approvals, 0 implementation-ready route/surface metric artifact path rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, runtime audit summary tests 4457, pass 4457, and no runtime behavior changed. It remains blocked on affected callable semantic proof. |

This addendum is audit-only. It keeps path reservation separate from metric
artifact approval, collector approval, affected callable semantic proof,
JSON-first runtime behavior, whitelist optimization, native sync changes,
release package changes, and public claims.

## JSON-First Route/Surface Metric Artifact Commit Readiness Gate Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-metric-artifact-commit-readiness-gate-current-behavior.test.mjs` | JSON-first route/surface metric artifact commit readiness gate addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` proves the reserved route/surface metric artifact root and files are not commit-ready and are not runtime approval. It pins 10 JSON-first route/surface metric artifact commit readiness rows, 1 reserved future metric artifact root, 5 reserved future metric artifact files, 1 related first-optimization foundation sample path, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 6 metric artifact path boundary rows covered, 12 metric artifact approval boundary rows covered, 12 route/surface metric obligations covered, 12 JSON-first fixture approval rows covered, 12 route/surface authority rows covered, 13 JSON-first implementation authority rows covered, 12 metric artifact schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 collector no-work rows covered, 12 collector side-effect rows covered, 12 collector fixture provenance rows covered, 14 first optimization implementation readiness rows covered, 0 committed route/surface metric artifact files, 0 committed first-optimization foundation metric sample files, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 runtime JSON-first implementation approvals, 0 runtime whitelist optimization approvals, 0 implementation-ready route/surface metric artifact commit rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, runtime audit summary tests 4457, pass 4457, and no runtime behavior changed. It remains blocked on affected callable semantic proof. |

This addendum is audit-only. It keeps metric artifact commit readiness separate
from metric artifact approval, collector approval, affected callable semantic
proof, JSON-first runtime behavior, whitelist optimization, native sync
changes, release package changes, and public claims.

## JSON-First Route/Surface Metric Artifact Contract Coverage Gate Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-metric-artifact-contract-coverage-gate-current-behavior.test.mjs` | JSON-first route/surface metric artifact contract coverage gate addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md` proves source metric foundation contracts exist and all five route/surface-specific per-file metric artifact contracts exist, while the route/surface metric artifacts and runtime approvals remain missing. It pins 10 JSON-first route/surface metric artifact contract coverage rows, 1 reserved future metric artifact root, 5 reserved future metric artifact files, 5 source metric foundation contract docs referenced, 5 source metric foundation contract tests referenced, 5 route/surface-specific per-file metric artifact contract docs covered, 5 route/surface-specific per-file metric artifact contract tests covered, 63 method semantic proof gap files covered, 5,469 method semantic proof gap lexical callables covered, 0 files with complete per-callable semantic proof, 6 metric artifact path boundary rows covered, 10 metric artifact commit readiness rows covered, 12 metric artifact approval boundary rows covered, 12 route/surface metric obligations covered, 12 JSON-first fixture approval rows covered, 12 route/surface authority rows covered, 13 JSON-first implementation authority rows covered, 12 metric artifact schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 collector no-work rows covered, 12 collector side-effect rows covered, 12 collector fixture provenance rows covered, 12 first optimization contract coverage rows covered, 12 first optimization artifact commit readiness rows covered, 14 first optimization implementation readiness rows covered, 0 committed route/surface metric artifact files, 0 committed first-optimization foundation metric sample files, 0 committed first-optimization foundation no-work preservation files, 0 committed first-optimization foundation side-effect budget files, 0 committed first-optimization foundation fixture provenance files, 0 committed first-optimization foundation verification output files, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 runtime JSON-first implementation approvals, 0 runtime whitelist optimization approvals, 0 implementation-ready route/surface metric artifact contract coverage rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, runtime audit summary tests 4457, pass 4457, and no runtime behavior changed. It remains blocked on affected callable semantic proof. |

This addendum is audit-only. It keeps route/surface metric artifact contract
coverage separate from metric artifact approval, collector approval, affected
callable semantic proof, JSON-first runtime behavior, whitelist optimization,
native sync changes, release package changes, and public claims.

## JSON-First Route/Surface Metric Sample Contract Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-metric-sample-contract-current-behavior.test.mjs` | JSON-first route/surface metric sample contract addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future route/surface `metric-sample.json` contract without creating the sample, artifact root, runtime collector, JSON-first behavior, whitelist optimization, native sync changes, release package changes, or public claims. It pins 12 JSON-first route/surface metric sample contract rows, 1 reserved route/surface metric sample path, 12 source metric sample contract rows covered, 10 metric artifact contract coverage rows covered, 6 metric artifact path boundary rows covered, 10 metric artifact commit readiness rows covered, 12 metric artifact approval boundary rows covered, 12 route/surface metric obligations covered, 12 JSON-first fixture approval rows covered, 12 route/surface authority rows covered, 13 JSON-first implementation authority rows covered, 12 metric artifact schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 collector no-work rows covered, 12 collector side-effect rows covered, 12 collector fixture provenance rows covered, 0 committed route/surface metric sample files, 0 committed route/surface metric artifact files, 0 committed first-optimization foundation metric sample files, 0 runtime route/surface metric sample approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 implementation-ready JSON-first route/surface metric sample contract rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, runtime audit summary tests 4457, pass 4457, and no runtime behavior changed. |

## JSON-First Route/Surface Metric No-Work Budget Contract Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-metric-no-work-budget-contract-current-behavior.test.mjs` | JSON-first route/surface metric no-work budget contract addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_NO_WORK_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future route/surface `no-work-budget.json` contract without creating the budget, artifact root, runtime collector, JSON-first behavior, whitelist optimization, native sync changes, release package changes, or public claims. It pins 12 JSON-first route/surface metric no-work budget contract rows, 1 reserved route/surface metric no-work budget path, 12 source no-work preservation contract rows covered, 10 metric artifact contract coverage rows covered, 6 metric artifact path boundary rows covered, 10 metric artifact commit readiness rows covered, 12 metric artifact approval boundary rows covered, 12 route/surface metric obligations covered, 12 JSON-first fixture approval rows covered, 12 route/surface authority rows covered, 13 JSON-first implementation authority rows covered, 12 metric artifact schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 collector no-work rows covered, 12 collector side-effect rows covered, 12 collector fixture provenance rows covered, 12 source-locus no-work rows covered, 12 collector no-work approval rows covered, 0 committed route/surface metric no-work budget files, 0 committed route/surface metric artifact files, 0 committed first-optimization foundation no-work preservation files, 0 runtime route/surface metric no-work budget approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 runtime collector no-work approvals, 0 implementation-ready JSON-first route/surface metric no-work budget contract rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, runtime audit summary tests 4457, pass 4457, and no runtime behavior changed. |

## JSON-First Route/Surface Metric Side-Effect Budget Contract Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-metric-side-effect-budget-contract-current-behavior.test.mjs` | JSON-first route/surface metric side-effect budget contract addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future route/surface `side-effect-budget.json` contract without creating the budget, artifact root, runtime collector, JSON-first behavior, whitelist optimization, native sync changes, release package changes, or public claims. It pins 12 JSON-first route/surface metric side-effect budget contract rows, 1 reserved route/surface metric side-effect budget path, 12 source side-effect budget contract rows covered, 10 metric artifact contract coverage rows covered, 6 metric artifact path boundary rows covered, 10 metric artifact commit readiness rows covered, 12 metric artifact approval boundary rows covered, 12 route/surface metric obligations covered, 12 JSON-first fixture approval rows covered, 12 route/surface authority rows covered, 13 JSON-first implementation authority rows covered, 12 metric artifact schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 collector no-work rows covered, 12 collector side-effect rows covered, 12 collector fixture provenance rows covered, 12 source-locus side-effect rows covered, 12 collector side-effect approval rows covered, 0 committed route/surface metric side-effect budget files, 0 committed route/surface metric artifact files, 0 committed first-optimization foundation side-effect budget files, 0 runtime route/surface metric side-effect budget approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 runtime collector side-effect approvals, 0 implementation-ready JSON-first route/surface metric side-effect budget contract rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, runtime audit summary tests 4457, pass 4457, and no runtime behavior changed. |

## JSON-First Route/Surface Metric Fixture Provenance Contract Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-metric-fixture-provenance-contract-current-behavior.test.mjs` | JSON-first route/surface metric fixture provenance contract addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future route/surface `fixture-provenance.json` contract without creating the provenance packet, artifact root, runtime collector, JSON-first behavior, whitelist optimization, native sync changes, release package changes, or public claims. It pins 12 JSON-first route/surface metric fixture provenance contract rows, 1 reserved route/surface metric fixture provenance path, 1 related first-optimization foundation fixture provenance path, 12 source fixture provenance contract rows covered, 10 metric artifact contract coverage rows covered, 6 metric artifact path boundary rows covered, 10 metric artifact commit readiness rows covered, 12 metric artifact approval boundary rows covered, 12 route/surface metric obligations covered, 12 JSON-first fixture approval rows covered, 12 route/surface authority rows covered, 13 JSON-first implementation authority rows covered, 12 metric artifact schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 collector no-work rows covered, 12 collector side-effect rows covered, 12 collector fixture provenance rows covered, 12 source-locus fixture provenance rows covered, 12 collector fixture provenance approval rows covered, 0 committed route/surface metric fixture provenance files, 0 committed route/surface metric artifact files, 0 committed first-optimization foundation fixture provenance files, 0 runtime route/surface metric fixture provenance approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 runtime collector fixture provenance approvals, 0 implementation-ready JSON-first route/surface metric fixture provenance contract rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, runtime audit summary tests 4457, pass 4457, and no runtime behavior changed. |

## JSON-First Route/Surface Metric Verification Output Contract Addendum

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-first-route-surface-metric-verification-output-contract-current-behavior.test.mjs` | JSON-first route/surface metric verification output contract addendum: `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` defines the future route/surface `verification-output.tap` contract without creating persisted TAP output, artifact root, runtime collector, JSON-first behavior, whitelist optimization, native sync changes, release package changes, or public claims. It pins 12 JSON-first route/surface metric verification output contract rows, 1 reserved route/surface metric verification output path, 1 related first-optimization foundation verification output path, 12 source verification output contract rows covered, 10 metric artifact contract coverage rows covered, 6 metric artifact path boundary rows covered, 10 metric artifact commit readiness rows covered, 12 metric artifact approval boundary rows covered, 12 route/surface metric obligations covered, 12 JSON-first fixture approval rows covered, 12 route/surface authority rows covered, 13 JSON-first implementation authority rows covered, 12 rollback/unclaimed boundary rows covered, 12 collector parity rollout rows covered, 12 collector verification output approval rows covered, 12 metric artifact schema rows covered, 12 source-owner rows covered, 12 collector insertion rows covered, 12 collector no-work rows covered, 12 collector side-effect rows covered, 12 collector fixture provenance rows covered, 0 committed route/surface metric verification output files, 0 committed route/surface metric artifact files, 0 committed first-optimization foundation verification output files, 0 runtime route/surface metric verification output approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric collector approvals, 0 runtime collector verification output approvals, 0 implementation-ready JSON-first route/surface metric verification output contract rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, expected runtime audit fail 0, runtime audit summary tests 4457, pass 4457, and no runtime behavior changed. |

## JSON Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the JSON-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/json-comment-author-channel-provenance-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON comment author channel provenance audit is audit-only and source pinned. Family: Comment provenance/parity. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-comment-continuation-collection-root-parity-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: collection-root parity slice is audit-only and source pinned. Family: Comment provenance/parity. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-comment-continuation-command-shape-parity-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: command-shape parity slice is audit-only and source pinned. Family: Comment provenance/parity. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-comment-continuation-raw-url-admission-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: raw-URL admission slice is audit-only and source pinned. Family: Comment provenance/parity. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-comment-continuation-sibling-preservation-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON comment continuation sibling preservation slice is audit-only and pinned. Family: Comment provenance/parity. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-comment-entity-payload-provenance-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON comment entity payload provenance slice is audit-only and pinned. Family: Comment provenance/parity. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-comment-keyword-provenance-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON comment keyword provenance audit is audit-only and source pinned. Family: Comment provenance/parity. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-comment-structural-wrapper-cleanup-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON comment structural wrapper cleanup audit is audit-only and source pinned. Family: Comment provenance/parity. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-comment-view-model-parity-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON comment ViewModel parity audit is audit-only and source pinned. Family: Comment provenance/parity. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-active-work-predicate-register-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first active work predicate register is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-block-decision-effect-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first block decision effect boundary audit is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-candidate-extraction-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first candidate extraction boundary audit is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-channel-match-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first channel match boundary audit is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-comment-continuation-shortcut-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first comment continuation shortcut is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-disable-autoplay-annotations-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first disableAutoplay/disableAnnotations boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-endpoint-match-policy-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first endpoint match policy is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-fetch-response-rebuild-metadata-contract-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first fetch response rebuild metadata contract is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-filter-readiness-gate-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first filter readiness gate is audit-only and links current proof layers. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-all-comments-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideAllComments boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-all-shorts-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideAllShorts boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-ask-button-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideAskButton boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-endscreen-cards-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideEndscreenCards boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-endscreen-videowall-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideEndscreenVideowall boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-explore-trending-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideExploreTrending boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-home-feed-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideHomeFeed boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-live-chat-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideLiveChat boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-members-only-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideMembersOnly boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-merch-tickets-offers-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideMerchTicketsOffers boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-mix-playlists-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideMixPlaylists boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-more-from-youtube-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideMoreFromYouTube boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-notification-bell-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideNotificationBell boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-playlist-cards-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hidePlaylistCards boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-recommended-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideRecommended boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-search-shelves-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideSearchShelves boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-sponsored-cards-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideSponsoredCards boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-subscriptions-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideSubscriptions boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-top-header-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideTopHeader boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-video-buttons-bar-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideVideoButtonsBar boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-video-channel-row-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideVideoChannelRow boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-video-description-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideVideoDescription boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-video-info-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideVideoInfo boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-video-sidebar-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideVideoSidebar boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-hide-watch-playlist-panel-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first hideWatchPlaylistPanel boundary audit is audit-only and source pinned. Family: Feature hide/toggle boundary. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-implementation-locus-register-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first implementation locus register is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-keyword-match-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first keyword match boundary audit is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-list-mode-matrix-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first list-mode matrix audit is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-metric-artifact-gate-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first metric artifact gate is audit-only and fingerprint pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-clone-isolation-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot clone isolation audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-consumer-application-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot consumer application audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-consumer-card-video-id-evidence-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot consumer card video-id evidence audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-consumer-effect-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot consumer effect boundary audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-consumer-freshness-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot consumer freshness audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-consumer-permission-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot consumer permission audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-consumer-request-transport-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot consumer request transport audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-consumer-source-precedence-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot consumer source precedence audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-consumer-stale-cache-cleanup-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot consumer stale-cache cleanup audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-consumer-stale-marker-matrix-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot consumer stale-marker matrix audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-consumer-traversal-budget-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot consumer traversal budget audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-endpoint-admission-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot endpoint admission audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-permission-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot permission boundary audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-source-precedence-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot source precedence audit is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-network-snapshot-stash-contract-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first network snapshot stash contract is audit-only and source pinned. Family: Network snapshot. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-no-work-optimization-crosswalk-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first no-work optimization crosswalk is audit-only and source-pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-pending-queue-replay-contract-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first pending queue replay contract is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-reference-doc-surface-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first reference doc surface is audit-only and fingerprint pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-renderer-traversal-mutation-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first renderer traversal mutation boundary audit is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-response-mutation-contract-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first response mutation contract is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-uppercase-title-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first uppercase title boundary audit is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-url-normalization-contract-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first URL normalization contract is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-video-meta-background-storage-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first video meta background storage audit is audit-only and source pinned. Family: Video metadata. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-video-meta-category-parity-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first video meta category parity audit is audit-only and source pinned. Family: Video metadata. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-video-meta-content-parity-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first video meta content parity audit is audit-only and source pinned. Family: Video metadata. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-video-meta-dom-rerun-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first video meta DOM rerun audit is audit-only and source pinned. Family: Video metadata. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-video-meta-fetch-policy-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first video meta fetch policy audit is audit-only and source pinned. Family: Video metadata. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-video-meta-freshness-eviction-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first video meta freshness eviction audit is audit-only and source pinned. Family: Video metadata. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-video-meta-merge-schema-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first video meta merge schema audit is audit-only and source pinned. Family: Video metadata. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-video-meta-no-work-budget-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first video meta no-work budget audit is audit-only and source pinned. Family: Video metadata. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-video-meta-profile-surface-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first video meta profile/surface boundary audit is audit-only and source pinned. Family: Video metadata. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-video-meta-revision-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first video meta revision boundary audit is audit-only and source pinned. Family: Video metadata. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-whitelist-decision-identity-boundary-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first whitelist decision identity audit is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-first-xhr-response-override-contract-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: JSON-first XHR response override contract is audit-only and source pinned. Family: Core policy/contract. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |
| `tests/runtime/json-section-coverage-index-current-behavior.test.mjs` | JSON runtime-test exact-row backfill: json section coverage index is audit-only and defines current coverage classes. Family: Coverage/path authority. This row records file-level provenance only and does not approve JSON-first filtering, whitelist optimization, DOM fallback changes, or runtime behavior changes. |

## Content Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the content-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/content-bridge-collaborator-enrichment-retry-boundary-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content bridge collaborator enrichment retry audit is audit-only and source pinned. Family: content bridge collaborator. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-collaborator-identity-promotion-handoff-current-behavior.test.mjs` | Content runtime-test exact-row backfill: collaborator identity promotion handoff audit is audit-only and source pinned. Family: content bridge collaborator. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-collaborator-main-world-merge-mutation-current-behavior.test.mjs` | Content runtime-test exact-row backfill: collaborator main-world merge audit is audit-only and source pinned. Family: content bridge collaborator. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-collaborator-metadata-extraction-side-effect-boundary-current-behavior.test.mjs` | Content runtime-test exact-row backfill: collaborator metadata extraction audit is audit-only and source pinned. Family: content bridge collaborator. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-lifecycle-callback-semantic-register-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content bridge lifecycle callback register is audit-only and scoped to current behavior. Family: content bridge lifecycle/message. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-main-world-message-dispatch-boundary-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content bridge main-world dispatch audit is audit-only and source counted. Family: content bridge lifecycle/message. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-menu-action-list-target-current-behavior.test.mjs` | Content runtime-test exact-row backfill: menu action list-target audit is audit-only and source pinned. Family: content bridge menu. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-menu-blocked-state-list-shape-current-behavior.test.mjs` | Content runtime-test exact-row backfill: menu blocked-state list-shape audit is audit-only and source pinned. Family: content bridge menu. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-menu-injection-action-boundary-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content bridge menu injection action audit is audit-only and source pinned. Family: content bridge menu. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-prefetch-identity-lifecycle-boundary-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content bridge prefetch identity lifecycle audit is audit-only and source pinned. Family: content bridge lifecycle/message. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-selector-semantic-register-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content bridge selector semantic register is audit-only and scoped to current behavior. Family: content bridge lifecycle/message. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-startup-timing-boundary-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content bridge startup timing audit is audit-only and source counted. Family: content bridge lifecycle/message. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-top-level-method-semantic-register-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content bridge top-level method register is audit-only and not nested callable completion. Family: content bridge lifecycle/message. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-bridge-whitelist-pending-refresh-boundary-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content bridge whitelist pending refresh doc is audit-only and source pinned. Family: content bridge lifecycle/message. This row records file-level provenance only and does not approve content bridge changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-control-active-work-matrix-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content-control active-work matrix is audit-only and source pinned. Family: content control. This row records file-level provenance only and does not approve content-control changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-control-alias-mutation-boundary-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content-control alias mutation boundary is audit-only and source pinned. Family: content control. This row records file-level provenance only and does not approve content-control changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-control-dom-style-lifecycle-restore-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content-control DOM style lifecycle audit is audit-only and source pinned. Family: content control. This row records file-level provenance only and does not approve content-control changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-control-dom-style-selector-matrix-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content-control DOM style selector matrix is audit-only and source pinned. Family: content control. This row records file-level provenance only and does not approve content-control changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-control-json-first-boundary-index-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content-control JSON-first boundary index is audit-only and source pinned. Family: content control. This row records file-level provenance only and does not approve content-control changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-controls-catalog-method-semantic-register-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content controls catalog method semantic register is audit-only and scoped to current behavior. Family: content controls catalog. This row records file-level provenance only and does not approve content-control changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-direct-identity-fallback-side-effect-boundary-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content direct identity fallback audit is audit-only and source pinned. Family: content direct identity. This row records file-level provenance only and does not approve direct identity fallback changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-helper-callable-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content-helper callable audit accounts for every current content helper source file. Family: content helper callable. This row records file-level provenance only and does not approve content helper changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |
| `tests/runtime/content-menu-method-semantic-register-current-behavior.test.mjs` | Content runtime-test exact-row backfill: content menu method semantic register is audit-only and scoped to current behavior. Family: content menu method. This row records file-level provenance only and does not approve content menu changes, DOM fallback changes, JSON-first filtering, whitelist optimization, or runtime behavior changes. |

## Background Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the background-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/background-add-filtered-channel-list-target-current-behavior.test.mjs` | Background runtime-test exact-row backfill: background addFilteredChannel list-target audit is audit-only and source pinned. Family: background rule/list mutation. This row records file-level provenance only and does not approve background mutation, message, cache, scheduler, identity fetch, script injection, or runtime behavior changes. |
| `tests/runtime/background-auto-backup-scheduler-boundary-current-behavior.test.mjs` | Background runtime-test exact-row backfill: background auto-backup scheduler audit is audit-only and source pinned. Family: background scheduler/cache lifecycle. This row records file-level provenance only and does not approve background mutation, message, cache, scheduler, identity fetch, script injection, or runtime behavior changes. |
| `tests/runtime/background-compiled-cache-invalidation-lifecycle-boundary-current-behavior.test.mjs` | Background runtime-test exact-row backfill: background compiled cache invalidation doc records audit-only boundary. Family: background scheduler/cache lifecycle. This row records file-level provenance only and does not approve background mutation, message, cache, scheduler, identity fetch, script injection, or runtime behavior changes. |
| `tests/runtime/background-identity-fetch-network-budget-boundary-current-behavior.test.mjs` | Background runtime-test exact-row backfill: background identity fetch network budget audit is audit-only and source pinned. Family: background identity/network/script trust. This row records file-level provenance only and does not approve background mutation, message, cache, scheduler, identity fetch, script injection, or runtime behavior changes. |
| `tests/runtime/background-message-action-semantic-register-current-behavior.test.mjs` | Background runtime-test exact-row backfill: background message action semantic register is audit-only and scoped to current behavior. Family: background message/method authority. This row records file-level provenance only and does not approve background mutation, message, cache, scheduler, identity fetch, script injection, or runtime behavior changes. |
| `tests/runtime/background-method-semantic-register-current-behavior.test.mjs` | Background runtime-test exact-row backfill: background method semantic register is audit-only and scoped to current behavior. Family: background message/method authority. This row records file-level provenance only and does not approve background mutation, message, cache, scheduler, identity fetch, script injection, or runtime behavior changes. |
| `tests/runtime/background-script-injection-trust-boundary-current-behavior.test.mjs` | Background runtime-test exact-row backfill: background script injection trust audit is audit-only and source counted. Family: background identity/network/script trust. This row records file-level provenance only and does not approve background mutation, message, cache, scheduler, identity fetch, script injection, or runtime behavior changes. |

## Website Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the website-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/website-client-lifecycle-surface-current-behavior.test.mjs` | Website runtime-test exact-row backfill: website client lifecycle surface doc is audit-only and source pinned. Family: website client lifecycle. This row records file-level provenance only and does not approve website route, asset, dependency, remote request, build smoke, component graph, or runtime behavior changes. |
| `tests/runtime/website-dynamic-route-method-semantic-register-current-behavior.test.mjs` | Website runtime-test exact-row backfill: website dynamic route method semantic register is audit-only and source pinned. Family: website dynamic route methods. This row records file-level provenance only and does not approve website route, asset, dependency, remote request, build smoke, component graph, or runtime behavior changes. |
| `tests/runtime/website-package-config-dependency-surface-current-behavior.test.mjs` | Website runtime-test exact-row backfill: website package config dependency surface doc is audit-only and fingerprint pinned. Family: website package/dependency surface. This row records file-level provenance only and does not approve website route, asset, dependency, remote request, build smoke, component graph, or runtime behavior changes. |
| `tests/runtime/website-remote-request-privacy-performance-boundary-current-behavior.test.mjs` | Website runtime-test exact-row backfill: website remote request privacy performance boundary doc is audit-only. Family: website remote request boundary. This row records file-level provenance only and does not approve website route, asset, dependency, remote request, build smoke, component graph, or runtime behavior changes. |
| `tests/runtime/website-route-asset-surface-current-behavior.test.mjs` | Website runtime-test exact-row backfill: website route asset surface doc is audit-only and source pinned. Family: website route/build surface. This row records file-level provenance only and does not approve website route, asset, dependency, remote request, build smoke, component graph, or runtime behavior changes. |
| `tests/runtime/website-route-build-smoke-artifact-boundary-current-behavior.test.mjs` | Website runtime-test exact-row backfill: website route build smoke artifact boundary is audit-only and source pinned. Family: website route/build surface. This row records file-level provenance only and does not approve website route, asset, dependency, remote request, build smoke, component graph, or runtime behavior changes. |
| `tests/runtime/website-route-component-render-graph-current-behavior.test.mjs` | Website runtime-test exact-row backfill: website route component render graph doc is audit-only and source pinned. Family: website route/build surface. This row records file-level provenance only and does not approve website route, asset, dependency, remote request, build smoke, component graph, or runtime behavior changes. |

## Seed Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the seed-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/seed-fetch-no-work-list-mode-boundary-current-behavior.test.mjs` | Seed runtime-test exact-row backfill: seed fetch no-work/list-mode audit is audit-only and source pinned. Family: seed no-work/list-mode. This row records file-level provenance only and does not approve seed fetch, XHR, global hook, settings replay, page patch, no-work, list-mode, or runtime behavior changes. |
| `tests/runtime/seed-initial-global-no-work-list-mode-boundary-current-behavior.test.mjs` | Seed runtime-test exact-row backfill: seed initial global no-work/list-mode audit is audit-only and source pinned. Family: seed no-work/list-mode. This row records file-level provenance only and does not approve seed fetch, XHR, global hook, settings replay, page patch, no-work, list-mode, or runtime behavior changes. |
| `tests/runtime/seed-method-semantic-register-current-behavior.test.mjs` | Seed runtime-test exact-row backfill: seed method semantic register is audit-only and scoped to current behavior. Family: seed method semantics. This row records file-level provenance only and does not approve seed fetch, XHR, global hook, settings replay, page patch, no-work, list-mode, or runtime behavior changes. |
| `tests/runtime/seed-page-global-patch-teardown-boundary-current-behavior.test.mjs` | Seed runtime-test exact-row backfill: seed page-global patch teardown audit is audit-only and source pinned. Family: seed page global patch. This row records file-level provenance only and does not approve seed fetch, XHR, global hook, settings replay, page patch, no-work, list-mode, or runtime behavior changes. |
| `tests/runtime/seed-settings-replay-provenance-boundary-current-behavior.test.mjs` | Seed runtime-test exact-row backfill: seed settings replay provenance audit is audit-only and source pinned. Family: seed settings replay. This row records file-level provenance only and does not approve seed fetch, XHR, global hook, settings replay, page patch, no-work, list-mode, or runtime behavior changes. |
| `tests/runtime/seed-xhr-no-work-list-mode-boundary-current-behavior.test.mjs` | Seed runtime-test exact-row backfill: seed XHR no-work/list-mode audit is audit-only and source pinned. Family: seed no-work/list-mode. This row records file-level provenance only and does not approve seed fetch, XHR, global hook, settings replay, page patch, no-work, list-mode, or runtime behavior changes. |

## DOM Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining DOM-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/dom-extractors-method-semantic-register-current-behavior.test.mjs` | DOM runtime-test exact-row backfill: DOM extractors method semantic register is audit-only and scoped to current behavior. Family: dom extractor methods. This row records file-level provenance only and does not approve selector, fallback, hide, identity, route, target, cleanup, or runtime behavior changes. |
| `tests/runtime/dom-fallback-lifecycle-callback-semantic-register-current-behavior.test.mjs` | DOM runtime-test exact-row backfill: DOM fallback lifecycle callback register is audit-only and scoped to current behavior. Family: dom fallback lifecycle/run-state. This row records file-level provenance only and does not approve selector, fallback, hide, identity, route, target, cleanup, or runtime behavior changes. |
| `tests/runtime/dom-fallback-method-semantic-register-current-behavior.test.mjs` | DOM runtime-test exact-row backfill: DOM fallback method semantic register is audit-only and scoped to current behavior. Family: dom fallback methods. This row records file-level provenance only and does not approve selector, fallback, hide, identity, route, target, cleanup, or runtime behavior changes. |
| `tests/runtime/dom-fallback-run-state-visibility-cleanup-boundary-current-behavior.test.mjs` | DOM runtime-test exact-row backfill: DOM fallback run-state visibility cleanup doc is audit-only and source pinned. Family: dom fallback lifecycle/run-state. This row records file-level provenance only and does not approve selector, fallback, hide, identity, route, target, cleanup, or runtime behavior changes. |
| `tests/runtime/dom-fallback-selector-semantic-register-current-behavior.test.mjs` | DOM runtime-test exact-row backfill: DOM fallback selector semantic register is audit-only and scoped to current behavior. Family: dom selector inventory. This row records file-level provenance only and does not approve selector, fallback, hide, identity, route, target, cleanup, or runtime behavior changes. |

## Filter Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining filter-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/filter-all-toggle-list-target-current-behavior.test.mjs` | Filter runtime-test exact-row backfill: filter-all toggle list-target audit is audit-only and source pinned. Family: filter all toggle/list target. This row records file-level provenance only and does not approve filter logic, JSON filtering, DOM fallback, direct renderer, list-mode, or runtime behavior changes. |
| `tests/runtime/filter-logic-direct-renderer-rule-semantic-register-current-behavior.test.mjs` | Filter runtime-test exact-row backfill: filter logic direct renderer rule register is audit-only and scoped to current behavior. Family: filter direct-renderer rules. This row records file-level provenance only and does not approve filter logic, JSON filtering, DOM fallback, direct renderer, list-mode, or runtime behavior changes. |
| `tests/runtime/filter-logic-method-semantic-register-current-behavior.test.mjs` | Filter runtime-test exact-row backfill: filter logic method semantic register is audit-only and scoped to current behavior. Family: filter logic methods. This row records file-level provenance only and does not approve filter logic, JSON filtering, DOM fallback, direct renderer, list-mode, or runtime behavior changes. |
| `tests/runtime/filter-logic-rule-field-effect-semantic-register-current-behavior.test.mjs` | Filter runtime-test exact-row backfill: filter logic rule field effect register is audit-only and source scoped. Family: filter rule field effects. This row records file-level provenance only and does not approve filter logic, JSON filtering, DOM fallback, direct renderer, list-mode, or runtime behavior changes. |
| `tests/runtime/filter-logic-rule-path-semantic-register-current-behavior.test.mjs` | Filter runtime-test exact-row backfill: filter logic rule path register is audit-only and source scoped. Family: filter rule paths. This row records file-level provenance only and does not approve filter logic, JSON filtering, DOM fallback, direct renderer, list-mode, or runtime behavior changes. |

## Identity Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining identity-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/identity-effect-obligation-crosswalk-current-behavior.test.mjs` | Identity runtime-test exact-row backfill: identity effect obligation crosswalk is audit-only and blocks runtime changes. Family: identity effect obligation. This row records file-level provenance only and does not approve identity waterfall, resolver, cache, source-confidence, effect, or runtime behavior changes. |
| `tests/runtime/identity-flow-diagram-register-current-behavior.test.mjs` | Identity runtime-test exact-row backfill: identity flow diagram register is audit-only and defines route flow diagrams. Family: identity flow diagrams. This row records file-level provenance only and does not approve identity waterfall, resolver, cache, source-confidence, effect, or runtime behavior changes. |
| `tests/runtime/identity-information-waterfall-current-behavior.test.mjs` | Identity runtime-test exact-row backfill: identity waterfall doc documents actual source order. Family: identity waterfall/order. This row records file-level provenance only and does not approve identity waterfall, resolver, cache, source-confidence, effect, or runtime behavior changes. |
| `tests/runtime/identity-resolver-cache-dedupe-current-behavior.test.mjs` | Identity runtime-test exact-row backfill: identity resolver cache dedupe register is audit-only and keeps runtime behavior unchanged. Family: identity resolver/cache/fanout. This row records file-level provenance only and does not approve identity waterfall, resolver, cache, source-confidence, effect, or runtime behavior changes. |

## Settings Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining settings-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/settings-mode-source-effect-current-behavior.test.mjs` | Settings runtime-test exact-row backfill: settings mode source/effect doc is audit-only and connects source to allowed effect. Family: settings mode/source matrix. This row records file-level provenance only and does not approve settings mode, refresh, fanout, key parity, source authority, list migration, or runtime behavior changes. |
| `tests/runtime/settings-refresh-cross-context-consumer-boundary-current-behavior.test.mjs` | Settings runtime-test exact-row backfill: settings refresh cross-context consumer doc records audit-only boundary and source files. Family: settings refresh/fanout parity. This row records file-level provenance only and does not approve settings mode, refresh, fanout, key parity, source authority, list migration, or runtime behavior changes. |
| `tests/runtime/settings-refresh-dirty-key-consumer-matrix-current-behavior.test.mjs` | Settings runtime-test exact-row backfill: settings refresh dirty-key consumer matrix is audit-only and source-backed. Family: settings refresh/fanout parity. This row records file-level provenance only and does not approve settings mode, refresh, fanout, dirty-key authority, no-op authority, key parity, source authority, list migration, or runtime behavior changes. |
| `tests/runtime/settings-refresh-dirty-key-producer-matrix-current-behavior.test.mjs` | Settings runtime-test exact-row backfill: settings refresh dirty-key producer matrix is audit-only and source-backed. Family: settings refresh/fanout parity. This row records file-level provenance only and does not approve settings mode, refresh, fanout, dirty-key producer authority, producer-consumer revision authority, no-op write authority, key parity, source authority, list migration, or runtime behavior changes. |
| `tests/runtime/settings-refresh-dirty-key-producer-consumer-join-matrix-current-behavior.test.mjs` | Settings runtime-test exact-row backfill: settings refresh producer-consumer join matrix is audit-only and source-backed. Family: settings refresh/fanout parity. This row records file-level provenance only and does not approve settings mode, refresh, fanout, producer-consumer join authority, write-consumer revision authority, JSON/DOM consumer budget, seed budget, observer/menu/quick-block budget, key parity, source authority, list migration, or runtime behavior changes. |
| `tests/runtime/settings-refresh-optimization-readiness-boundary-current-behavior.test.mjs` | Settings runtime-test exact-row backfill: settings refresh optimization readiness boundary is audit-only and source-backed. Family: settings refresh/fanout parity. This row records file-level provenance only and does not approve settings mode, refresh, fanout, settings refresh optimization authority, forced refresh pruning, map-only pruning, seed replay pruning, observer/menu/quick-block pruning, import/sync pruning, key parity, source authority, list migration, or runtime behavior changes. |
| `tests/runtime/settings-refresh-optimization-candidate-binding-matrix-current-behavior.test.mjs` | Settings runtime-test exact-row backfill: settings refresh optimization candidate binding matrix is audit-only and source-backed. Family: settings refresh/fanout parity. This row records file-level provenance only and does not approve settings mode, refresh, fanout, settings refresh candidate binding authority, forced refresh candidate pruning, map-only candidate pruning, seed replay candidate pruning, observer/menu/quick-block candidate pruning, import/sync candidate pruning, metric collector insertion, whitelist optimization, JSON-first promotion, release claims, or runtime behavior changes. |
| `tests/runtime/settings-refresh-optimization-candidate-evidence-packet-contract-current-behavior.test.mjs` | Settings runtime-test exact-row backfill: settings refresh candidate evidence packet contract is audit-only and source-backed. Family: settings refresh/fanout parity. This row records file-level provenance only and does not approve settings mode, refresh, fanout, settings refresh evidence packet authority, forced refresh evidence packet, map-only evidence packet, seed replay evidence packet, observer/menu/quick evidence packet, import/sync evidence packet, metric collector insertion, whitelist optimization, JSON-first promotion, release claims, or runtime behavior changes. |
| `tests/runtime/settings-refresh-key-parity-register-current-behavior.test.mjs` | Settings runtime-test exact-row backfill: settings refresh key parity register is audit-only and source pinned. Family: settings refresh/fanout parity. This row records file-level provenance only and does not approve settings mode, refresh, fanout, key parity, source authority, list migration, or runtime behavior changes. |
| `tests/runtime/settings-shared-method-semantic-register-current-behavior.test.mjs` | Settings runtime-test exact-row backfill: settings shared method semantic register is audit-only and scoped to current behavior. Family: settings shared methods. This row records file-level provenance only and does not approve settings mode, refresh, fanout, key parity, source authority, list migration, or runtime behavior changes. |

## Bridge Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the bridge-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/bridge-injection-method-semantic-register-current-behavior.test.mjs` | Bridge runtime-test exact-row backfill: bridge injection method semantic register is audit-only and source scoped. Family: bridge injection methods. This row records file-level provenance only and does not approve bridge injection, settings listener, timer, method, or runtime behavior changes. |
| `tests/runtime/bridge-settings-listener-timer-boundary-current-behavior.test.mjs` | Bridge runtime-test exact-row backfill: bridge settings listener/timer audit is audit-only and source pinned. Family: bridge settings listener/timer. This row records file-level provenance only and does not approve bridge injection, settings listener, timer, method, or runtime behavior changes. |
| `tests/runtime/bridge-settings-method-semantic-register-current-behavior.test.mjs` | Bridge runtime-test exact-row backfill: bridge settings method semantic register is audit-only and scoped to current behavior. Family: bridge settings methods. This row records file-level provenance only and does not approve bridge injection, settings listener, timer, method, or runtime behavior changes. |

## Extension Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the extension-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/extension-asset-data-package-surface-current-behavior.test.mjs` | Extension runtime-test exact-row backfill: extension asset data package surface doc is audit-only and fingerprint pinned. Family: extension asset/data package. This row records file-level provenance only and does not approve extension asset, data, icon, logo, CSS, page state, packaging, or runtime behavior changes. |
| `tests/runtime/extension-icon-logo-package-parity-boundary-current-behavior.test.mjs` | Extension runtime-test exact-row backfill: extension icon logo package parity doc is audit-only and file fingerprint pinned. Family: extension icon/logo parity. This row records file-level provenance only and does not approve extension asset, data, icon, logo, CSS, page state, packaging, or runtime behavior changes. |
| `tests/runtime/extension-ui-css-page-state-boundary-current-behavior.test.mjs` | Extension runtime-test exact-row backfill: extension UI CSS page-state boundary doc is audit-only and source pinned. Family: extension UI CSS/page state. This row records file-level provenance only and does not approve extension asset, data, icon, logo, CSS, page state, packaging, or runtime behavior changes. |

## Learned Identity Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the learned-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/learned-identity-authority-current-behavior.test.mjs` | Learned identity runtime-test exact-row backfill: learned identity authority audit documents map stores flow and future contract. Family: learned identity authority. This row records file-level provenance only and does not approve learned identity map, cache persistence, write entrypoint, provenance, confidence, or runtime behavior changes. |
| `tests/runtime/learned-identity-map-cache-persistence-boundary-current-behavior.test.mjs` | Learned identity runtime-test exact-row backfill: learned identity map cache persistence audit document records current boundary and fixtures. Family: learned map cache/persistence. This row records file-level provenance only and does not approve learned identity map, cache persistence, write entrypoint, provenance, confidence, or runtime behavior changes. |
| `tests/runtime/learned-identity-map-write-entrypoint-current-behavior.test.mjs` | Learned identity runtime-test exact-row backfill: learned identity map write entrypoint register is audit-only and names the control plane. Family: learned map write entrypoint. This row records file-level provenance only and does not approve learned identity map, cache persistence, write entrypoint, provenance, confidence, or runtime behavior changes. |

## Nanah Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the nanah-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/nanah-sync-adapter-method-semantic-register-current-behavior.test.mjs` | Nanah runtime-test exact-row backfill: Nanah sync adapter method semantic register is audit-only and scoped to current behavior. Family: nanah sync adapter. This row records file-level provenance only and does not approve Nanah sync adapter, vendor build, runtime session lifecycle, or runtime behavior changes. |
| `tests/runtime/nanah-vendor-build-method-semantic-register-current-behavior.test.mjs` | Nanah runtime-test exact-row backfill: Nanah vendor build register is audit-only and source scoped. Family: nanah vendor build. This row records file-level provenance only and does not approve Nanah sync adapter, vendor build, runtime session lifecycle, or runtime behavior changes. |
| `tests/runtime/nanah-vendor-runtime-session-lifecycle-boundary-current-behavior.test.mjs` | Nanah runtime-test exact-row backfill: Nanah vendor runtime session lifecycle doc is audit-only and source pinned. Family: nanah vendor runtime session. This row records file-level provenance only and does not approve Nanah sync adapter, vendor build, runtime session lifecycle, or runtime behavior changes. |

## Native Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining native-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/native-overlay-fullscreen-quiet-mode-boundary-current-behavior.test.mjs` | Native runtime-test exact-row backfill: native overlay/fullscreen quiet mode audit is audit-only and source pinned. Family: native overlay/fullscreen. This row records file-level provenance only and does not approve native runtime sync, overlay, fullscreen, quiet mode, manifest freshness, method, or runtime behavior changes. |
| `tests/runtime/native-runtime-sync-manifest-freshness-boundary-current-behavior.test.mjs` | Native runtime-test exact-row backfill: native runtime sync manifest freshness doc is audit-only and fingerprint pinned. Family: native runtime sync. This row records file-level provenance only and does not approve native runtime sync, overlay, fullscreen, quiet mode, manifest freshness, method, or runtime behavior changes. |
| `tests/runtime/native-runtime-sync-method-semantic-register-current-behavior.test.mjs` | Native runtime-test exact-row backfill: native runtime sync method register is audit-only and source scoped. Family: native runtime sync. This row records file-level provenance only and does not approve native runtime sync, overlay, fullscreen, quiet mode, manifest freshness, method, or runtime behavior changes. |

## Quick Block Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the quick-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/quick-block-block-menu-affordance-boundary-current-behavior.test.mjs` | Quick block runtime-test exact-row backfill: quick-block/block-menu affordance audit is audit-only and source pinned. Family: quick block affordance. This row records file-level provenance only and does not approve quick-block affordance, block menu, default migration, hover lifecycle, timer, or runtime behavior changes. |
| `tests/runtime/quick-block-default-migration-boundary-current-behavior.test.mjs` | Quick block runtime-test exact-row backfill: quick-block default migration audit is audit-only and source pinned. Family: quick block default migration. This row records file-level provenance only and does not approve quick-block affordance, block menu, default migration, hover lifecycle, timer, or runtime behavior changes. |
| `tests/runtime/quick-block-hover-lifecycle-timer-boundary-current-behavior.test.mjs` | Quick block runtime-test exact-row backfill: quick-block lifecycle audit is audit-only and source pinned. Family: quick block hover lifecycle/timer. This row records file-level provenance only and does not approve quick-block affordance, block menu, default migration, hover lifecycle, timer, or runtime behavior changes. |

## Source Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining source-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/source-boundary-current-behavior.test.mjs` | Source runtime-test exact-row backfill: source boundary audit documents tracked source, raw evidence, generated output, and audit artifacts. Family: source boundary. This row records file-level provenance only and does not approve source boundary, source-of-truth, source surface, source tier, effect authority, or runtime behavior changes. |
| `tests/runtime/source-of-truth-claim-register-current-behavior.test.mjs` | Source runtime-test exact-row backfill: source of truth claim register is audit-only and keeps behavior unchanged. Family: source of truth claims. This row records file-level provenance only and does not approve source boundary, source-of-truth, source surface, source tier, effect authority, or runtime behavior changes. |
| `tests/runtime/source-surface-current-behavior.test.mjs` | Source runtime-test exact-row backfill: all manifest-loaded scripts are classified in the source surface inventory. Family: source surface inventory. This row records file-level provenance only and does not approve source boundary, source-of-truth, source surface, source tier, effect authority, or runtime behavior changes. |

## State Manager Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the state-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/state-manager-method-semantic-register-current-behavior.test.mjs` | State manager runtime-test exact-row backfill: state manager method semantic register is audit-only and scoped to current behavior. Family: state manager methods. This row records file-level provenance only and does not approve StateManager method, request refresh fanout, storage reload enrichment, lifecycle, or runtime behavior changes. |
| `tests/runtime/state-manager-request-refresh-fanout-boundary-current-behavior.test.mjs` | State manager runtime-test exact-row backfill: StateManager request refresh fanout doc records audit-only boundary and source blocks. Family: state manager request refresh. This row records file-level provenance only and does not approve StateManager method, request refresh fanout, storage reload enrichment, lifecycle, or runtime behavior changes. |
| `tests/runtime/state-manager-storage-reload-enrichment-lifecycle-boundary-current-behavior.test.mjs` | State manager runtime-test exact-row backfill: state manager storage reload enrichment doc records audit-only boundary. Family: state manager storage reload. This row records file-level provenance only and does not approve StateManager method, request refresh fanout, storage reload enrichment, lifecycle, or runtime behavior changes. |

## Whitelist Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the latest whitelist-prefixed cache hot-path runtime
test file. It changes documentation provenance only; runtime behavior remains
unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/whitelist-cache-hot-path-boundary-current-behavior.test.mjs` | Whitelist runtime-test exact-row backfill: whitelist cache hot-path boundary records narrow learned-map dedupe and source pins. Family: whitelist cache hot path. This row records file-level provenance plus the scoped duplicate learned-map persistence suppression only; it does not approve broader whitelist cache optimization, JSON-first cache optimization, learned-map eviction, or DOM fallback cache behavior. |

## UI Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining UI-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/ui-components-method-semantic-register-current-behavior.test.mjs` | UI runtime-test exact-row backfill: UI components method semantic register is audit-only and scoped to current behavior. Family: UI components methods. This row records file-level provenance only and does not approve UI component methods, portal lifecycle, settings callable, row list-mode authority, or runtime behavior changes. |
| `tests/runtime/ui-components-portal-lifecycle-boundary-current-behavior.test.mjs` | UI runtime-test exact-row backfill: UI components portal lifecycle doc records audit-only boundary. Family: UI components portal lifecycle. This row records file-level provenance only and does not approve UI component methods, portal lifecycle, settings callable, row list-mode authority, or runtime behavior changes. |
| `tests/runtime/ui-settings-callable-current-behavior.test.mjs` | UI runtime-test exact-row backfill: UI/settings callable audit accounts for every current UI settings source file. Family: UI settings callable. This row records file-level provenance only and does not approve UI component methods, portal lifecycle, settings callable, row list-mode authority, or runtime behavior changes. |

## Backup Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining backup-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/backup-download-blob-url-lifecycle-boundary-current-behavior.test.mjs` | Backup runtime-test exact-row backfill: backup download blob URL lifecycle doc records audit-only boundary. Family: backup download blob URL lifecycle. This row records file-level provenance only and does not approve backup export, blob URL lifecycle, Nanah trusted state, or runtime behavior changes. |
| `tests/runtime/backup-nanah-trusted-state-boundary-current-behavior.test.mjs` | Backup runtime-test exact-row backfill: backup Nanah trusted-state boundary audit is audit-only and source pinned. Family: backup Nanah trusted state. This row records file-level provenance only and does not approve backup export, blob URL lifecycle, Nanah trusted state, or runtime behavior changes. |

## Build Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the build-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/build-release-method-semantic-register-current-behavior.test.mjs` | Build runtime-test exact-row backfill: build release method semantic register is audit-only and source scoped. Family: build release methods. This row records file-level provenance only and does not approve build, release packaging, website callable, or runtime behavior changes. |
| `tests/runtime/build-website-callable-current-behavior.test.mjs` | Build runtime-test exact-row backfill: build/website callable audit accounts for every current build and website source file. Family: build/website callable. This row records file-level provenance only and does not approve build, release packaging, website callable, or runtime behavior changes. |

## Collab Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the collab-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/collab-dialog-lifecycle-current-behavior.test.mjs` | Collab runtime-test exact-row backfill: collab dialog lifecycle audit documents current behavior and future gate. Family: collab dialog lifecycle. This row records file-level provenance only and does not approve collaborator dialog lifecycle, method, menu, or runtime behavior changes. |
| `tests/runtime/collab-dialog-method-semantic-register-current-behavior.test.mjs` | Collab runtime-test exact-row backfill: collab dialog method semantic register is audit-only and scoped to current behavior. Family: collab dialog methods. This row records file-level provenance only and does not approve collaborator dialog lifecycle, method, menu, or runtime behavior changes. |

## Compiled Settings Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining compiled-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/compiled-settings-field-register-current-behavior.test.mjs` | Compiled settings runtime-test exact-row backfill: compiled settings field register is audit-only and source pinned. Family: compiled settings fields. This row records file-level provenance only and does not approve compiled cache, settings field, profile/list-mode assembly, or runtime behavior changes. |
| `tests/runtime/compiled-settings-profile-list-mode-assembly-boundary-current-behavior.test.mjs` | Compiled settings runtime-test exact-row backfill: compiled settings profile/list-mode assembly doc is audit-only and source pinned. Family: compiled profile/list-mode assembly. This row records file-level provenance only and does not approve compiled cache, settings field, profile/list-mode assembly, or runtime behavior changes. |

## Generated Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the generated-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/generated-local-output-dependency-surface-current-behavior.test.mjs` | Generated runtime-test exact-row backfill: generated local output dependency surface doc is audit-only and scoped to ignored output. Family: generated local output/dependency surface. This row records file-level provenance only and does not approve generated output, UI shell methods, dependency surface, or runtime behavior changes. |
| `tests/runtime/generated-ui-shell-method-semantic-register-current-behavior.test.mjs` | Generated runtime-test exact-row backfill: generated UI shell method register is audit-only and source scoped. Family: generated UI shell methods. This row records file-level provenance only and does not approve generated output, UI shell methods, dependency surface, or runtime behavior changes. |

## Ignored Output Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining ignored-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/ignored-local-planning-text-boundary-current-behavior.test.mjs` | Ignored output runtime-test exact-row backfill: ignored local planning text audit is audit-only and keeps optimization blocked. Family: ignored local planning text. This row records file-level provenance only and does not approve ignored local planning text, whitelist bundle, root evidence corpus, or runtime behavior changes. |
| `tests/runtime/ignored-whitelist-bundle-boundary-current-behavior.test.mjs` | Ignored output runtime-test exact-row backfill: ignored whitelist bundle audit is audit-only and records the release boundary. Family: ignored whitelist bundle. This row records file-level provenance only and does not approve ignored local planning text, whitelist bundle, root evidence corpus, or runtime behavior changes. |

## Injector Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining injector-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/injector-main-world-message-dispatch-boundary-current-behavior.test.mjs` | Injector runtime-test exact-row backfill: injector main-world message dispatch audit is audit-only and source counted. Family: injector main-world message dispatch. This row records file-level provenance only and does not approve injector settings capability, method, message dispatch, or runtime behavior changes. |
| `tests/runtime/injector-method-semantic-register-current-behavior.test.mjs` | Injector runtime-test exact-row backfill: injector method semantic register is audit-only and scoped to current behavior. Family: injector methods. This row records file-level provenance only and does not approve injector settings capability, method, message dispatch, or runtime behavior changes. |

## Legacy Layout Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the legacy-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/legacy-layout-method-semantic-register-current-behavior.test.mjs` | Legacy layout runtime-test exact-row backfill: legacy layout register is audit-only and source scoped. Family: legacy layout methods. This row records file-level provenance only and does not approve legacy layout, quarantine package, or runtime behavior changes. |
| `tests/runtime/legacy-layout-quarantine-package-boundary-current-behavior.test.mjs` | Legacy layout runtime-test exact-row backfill: legacy layout quarantine package boundary is audit-only and source scoped. Family: legacy layout quarantine package. This row records file-level provenance only and does not approve legacy layout, quarantine package, or runtime behavior changes. |

## Main Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining main-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/main-filter-all-comments-scope-current-behavior.test.mjs` | Main runtime-test exact-row backfill: main Filter All comments scope audit is audit-only and source pinned. Family: main comments/filter-all scope. This row records file-level provenance only and does not approve main feed, watch, comments, playlist, fixture, or runtime behavior changes. |
| `tests/runtime/main-watch-get-watch-playlist-end-screen-current-behavior.test.mjs` | Main runtime-test exact-row backfill: main watch get-watch audit doc and fixture provenance are pinned. Family: main watch playlist/end-screen fixtures. This row records file-level provenance only and does not approve main feed, watch, comments, playlist, fixture, or runtime behavior changes. |

## P0 Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining P0-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/p0-obligation-index-current-behavior.test.mjs` | P0 runtime-test exact-row backfill: P0 obligation index is audit-only and expands the readiness gate into per-obligation rows. Family: P0 obligation/readiness gate. This row records file-level provenance only and does not approve P0 readiness, obligation, profile/viewing-space, optimization, or runtime behavior changes. |
| `tests/runtime/p0-profile-viewing-space-current-behavior.test.mjs` | P0 runtime-test exact-row backfill: P0 profile viewing-space doc lists all ten readiness fixtures. Family: P0 profile/viewing-space. This row records file-level provenance only and does not approve P0 readiness, obligation, profile/viewing-space, optimization, or runtime behavior changes. |

## Popup Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the popup-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/popup-lifecycle-selector-boundary-current-behavior.test.mjs` | Popup runtime-test exact-row backfill: popup lifecycle selector boundary audit is audit-only and source pinned. Family: popup lifecycle selector. This row records file-level provenance only and does not approve popup lifecycle, selector, method, or runtime behavior changes. |
| `tests/runtime/popup-method-semantic-register-current-behavior.test.mjs` | Popup runtime-test exact-row backfill: popup method semantic register is audit-only and scoped to current behavior. Family: popup methods. This row records file-level provenance only and does not approve popup lifecycle, selector, method, or runtime behavior changes. |

## Prompt Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining prompt-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/prompt-onboarding-method-semantic-register-current-behavior.test.mjs` | Prompt runtime-test exact-row backfill: prompt onboarding method semantic register is audit-only and source scoped. Family: prompt onboarding methods. This row records file-level provenance only and does not approve prompt onboarding, prompt release overlay, method, or runtime behavior changes. |
| `tests/runtime/prompt-release-overlay-boundary-current-behavior.test.mjs` | Prompt runtime-test exact-row backfill: prompt release overlay boundary is audit-only and source pinned. Family: prompt release overlay. This row records file-level provenance only and does not approve prompt onboarding, prompt release overlay, method, or runtime behavior changes. |

## Release Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining release-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/release-build-artifact-claim-boundary-current-behavior.test.mjs` | Release runtime-test exact-row backfill: release build artifact claim boundary is audit-only and fingerprint pinned. Family: release build artifact claims. This row records file-level provenance only and does not approve release artifacts, package parity, release notes, public claims, or runtime behavior changes. |
| `tests/runtime/release-notes-json-version-gate-boundary-current-behavior.test.mjs` | Release runtime-test exact-row backfill: release notes JSON version gate doc is audit-only and scoped to current behavior. Family: release notes JSON version gate. This row records file-level provenance only and does not approve release artifacts, package parity, release notes, public claims, or runtime behavior changes. |

## Root Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining root-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/root-package-metadata-script-surface-current-behavior.test.mjs` | Root runtime-test exact-row backfill: root package metadata script surface doc is audit-only and fingerprint pinned. Family: root package metadata/script surface. This row records file-level provenance only and does not approve root metadata, root docs, package scripts, planning docs, or runtime behavior changes. |
| `tests/runtime/root-planning-doc-boundary-current-behavior.test.mjs` | Root runtime-test exact-row backfill: root markdown files are explicitly split between public metadata and historical planning. Family: root planning doc boundary. This row records file-level provenance only and does not approve root metadata, root docs, package scripts, planning docs, or runtime behavior changes. |

## Security Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining security-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/security-crypto-payload-boundary-current-behavior.test.mjs` | Security runtime-test exact-row backfill: security crypto payload doc records audit-only boundary. Family: security crypto payload. This row records file-level provenance only and does not approve security payloads, PIN lock authority, manager methods, or runtime behavior changes. |
| `tests/runtime/security-manager-method-semantic-register-current-behavior.test.mjs` | Security runtime-test exact-row backfill: security manager method semantic register is audit-only and scoped to current behavior. Family: security manager methods. This row records file-level provenance only and does not approve security payloads, PIN lock authority, manager methods, or runtime behavior changes. |

## Static Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the static-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/static-generated-vendor-current-behavior.test.mjs` | Static runtime-test exact-row backfill: static/generated/vendor audit accounts for every current surface family. Family: static generated/vendor. This row records file-level provenance only and does not approve static output, vendor artifacts, HTML support scripts, or runtime behavior changes. |
| `tests/runtime/static-html-support-script-surface-current-behavior.test.mjs` | Static runtime-test exact-row backfill: static html support script surface doc is audit-only and source pinned. Family: static HTML support scripts. This row records file-level provenance only and does not approve static output, vendor artifacts, HTML support scripts, or runtime behavior changes. |

## Storage Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining storage-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/storage-access-callsite-register-current-behavior.test.mjs` | Storage runtime-test exact-row backfill: storage access callsite register is audit-only and source pinned. Family: storage access callsites. This row records file-level provenance only and does not approve storage access, key authority, payload quota, or runtime behavior changes. |
| `tests/runtime/storage-payload-quota-boundary-current-behavior.test.mjs` | Storage runtime-test exact-row backfill: storage payload quota doc records audit-only boundary. Family: storage payload quota. This row records file-level provenance only and does not approve storage access, key authority, payload quota, or runtime behavior changes. |

## Tab View Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the tab-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/tab-view-lifecycle-selector-boundary-current-behavior.test.mjs` | Tab view runtime-test exact-row backfill: tab-view lifecycle selector boundary audit is audit-only and source pinned. Family: tab view lifecycle selector. This row records file-level provenance only and does not approve tab-view lifecycle, selectors, methods, or runtime behavior changes. |
| `tests/runtime/tab-view-method-semantic-register-current-behavior.test.mjs` | Tab view runtime-test exact-row backfill: tab-view method semantic register is audit-only and scoped to current behavior. Family: tab view methods. This row records file-level provenance only and does not approve tab-view lifecycle, selectors, methods, or runtime behavior changes. |

## Tracked File Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining tracked-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/tracked-file-obligation-index-current-behavior.test.mjs` | Tracked file runtime-test exact-row backfill: tracked file obligation index is audit-only and keeps completion open. Family: tracked file obligation index. This row records file-level provenance only and does not approve tracked-file coverage, public-doc claims, obligation closure, or runtime behavior changes. |
| `tests/runtime/tracked-public-doc-claim-surface-current-behavior.test.mjs` | Tracked file runtime-test exact-row backfill: tracked public doc claim surface is audit-only and fingerprint pinned. Family: tracked public doc claim surface. This row records file-level provenance only and does not approve tracked-file coverage, public-doc claims, obligation closure, or runtime behavior changes. |

## Video Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the video-prefixed runtime test files that were previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/video-info-dom-cleanup-boundary-current-behavior.test.mjs` | Video runtime-test exact-row backfill: video-info DOM cleanup boundary audit is audit-only and source pinned. Family: video info DOM cleanup. This row records file-level provenance only and does not approve video info cleanup, sidebar cleanup, DOM fallback, or runtime behavior changes. |
| `tests/runtime/video-sidebar-dom-cleanup-boundary-current-behavior.test.mjs` | Video runtime-test exact-row backfill: video sidebar DOM cleanup boundary audit is audit-only and source pinned. Family: video sidebar DOM cleanup. This row records file-level provenance only and does not approve video info cleanup, sidebar cleanup, DOM fallback, or runtime behavior changes. |

## Watch Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining watch-prefixed runtime test files that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/watch-player-control-authority-current-behavior.test.mjs` | Watch runtime-test exact-row backfill: watch/player control audit documents split authority and future contract. Family: watch player control authority. This row records file-level provenance only and does not approve watch player controls, playlist panel DOM cleanup, end-screen authority, or runtime behavior changes. |
| `tests/runtime/watch-playlist-panel-dom-cleanup-boundary-current-behavior.test.mjs` | Watch runtime-test exact-row backfill: watch playlist panel DOM cleanup boundary audit is audit-only and source pinned. Family: watch playlist panel DOM cleanup. This row records file-level provenance only and does not approve watch player controls, playlist panel DOM cleanup, end-screen authority, or runtime behavior changes. |

## Active Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the remaining active-prefixed runtime test file that
was previously present only in the generated per-test provenance index. It
changes documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/active-goal-completion-audit-current-behavior.test.mjs` | Active runtime-test exact-row backfill: active goal completion audit is audit-only and keeps goal open. Family: active goal completion. This row records file-level provenance only and does not approve active-rule predicates, completion closure, goal completion, or runtime behavior changes. |

## Add Filtered Channel Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the add-prefixed runtime test file that was previously
present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/add-filtered-channel-filter-all-comments-default-current-behavior.test.mjs` | Add filtered channel runtime-test exact-row backfill: addFilteredChannel Filter All comments default audit is audit-only and source pinned. Family: addFilteredChannel Filter All comments default. This row records file-level provenance only and does not approve addFilteredChannel defaults, Filter All comments, list-target behavior, or runtime behavior changes. |

## Alias Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the alias-prefixed runtime test file that was
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/alias-ingress-preservation-current-behavior.test.mjs` | Alias runtime-test exact-row backfill: alias ingress preservation doc is audit-only and extends stale alias proof. Family: alias ingress preservation. This row records file-level provenance only and does not approve alias ingress, stale alias handling, migration, or runtime behavior changes. |

## Batch Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the batch-prefixed runtime test file that was
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/batch-whitelist-import-persistence-boundary-current-behavior.test.mjs` | Batch runtime-test exact-row backfill: batch whitelist import persistence audit is audit-only and source pinned. Family: batch whitelist import persistence. This row records file-level provenance only and does not approve batch import, whitelist persistence, storage writes, or runtime behavior changes. |

## Block Channel Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the block-prefixed runtime test file that was
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/block-channel-method-semantic-register-current-behavior.test.mjs` | Block channel runtime-test exact-row backfill: block channel method semantic register is audit-only and scoped to current behavior. Family: block channel methods. This row records file-level provenance only and does not approve block-channel method behavior, menu behavior, mutation behavior, or runtime behavior changes. |

## Browser Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the browser-prefixed runtime test file that was
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/browser-manifest-runtime-load-order-current-behavior.test.mjs` | Browser runtime-test exact-row backfill: browser manifest runtime load-order doc is audit-only and manifest fingerprints are pinned. Family: browser manifest runtime load order. This row records file-level provenance only and does not approve browser manifest load order, packaging, release claims, or runtime behavior changes. |

## Remaining Tail Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the remaining one-row runtime test families that were
previously present only in the generated per-test provenance index. It changes
documentation provenance only; runtime behavior remains unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/capture-corpus-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: ignored raw capture corpus is explicitly excluded from release source. Family: capture corpus. This row records file-level provenance only and does not approve capture corpus, release source, or runtime behavior changes. |
| `tests/runtime/comments-dom-cleanup-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: comments DOM cleanup boundary audit is audit-only and source pinned. Family: comments DOM cleanup. This row records file-level provenance only and does not approve comments DOM cleanup, selector behavior, or runtime behavior changes. |
| `tests/runtime/compress-video-script-failure-mode-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: compress-video failure-mode boundary is audit-only and source pinned. Family: compress video failure mode. This row records file-level provenance only and does not approve compression script behavior, failure handling, or runtime behavior changes. |
| `tests/runtime/css-load-style-surface-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: CSS load style surface register is audit-only and covers every tracked CSS file. Family: CSS load style surface. This row records file-level provenance only and does not approve CSS load behavior, style injection, or runtime behavior changes. |
| `tests/runtime/current-dirty-worktree-audit-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: current dirty worktree boundary doc is audit-only and keeps implementation blocked. Family: current dirty worktree boundary. This row records file-level provenance only and does not approve dirty worktree changes, implementation gating, or runtime behavior changes. |
| `tests/runtime/design-token-json-css-parity-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: design token JSON CSS parity doc is audit-only and scoped to current behavior. Family: design token JSON/CSS parity. This row records file-level provenance only and does not approve design token mutation, CSS parity changes, or runtime behavior changes. |
| `tests/runtime/direct-hide-writer-register-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: direct hide writer register is audit-only and names the missing authority. Family: direct hide writer register. This row records file-level provenance only and does not approve direct hide writer authority, restore behavior, or runtime behavior changes. |
| `tests/runtime/document-start-zero-flash-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: document start zero-flash boundary is audit-only and runtime unchanged. Family: document start zero flash. This row records file-level provenance only and does not approve document-start behavior, zero-flash claims, or runtime behavior changes. |
| `tests/runtime/enabled-master-switch-disabled-runtime-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: enabled disabled-runtime boundary is audit-only and source pinned. Family: enabled master switch disabled runtime. This row records file-level provenance only and does not approve master-switch behavior, disabled-runtime behavior, or runtime behavior changes. |
| `tests/runtime/external-navigation-surface-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: external navigation surface boundary doc is audit-only and fingerprints are pinned. Family: external navigation surface. This row records file-level provenance only and does not approve external navigation behavior, surface routing, or runtime behavior changes. |
| `tests/runtime/extracted-capture-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: extracted Main append comment entity response ignores entity payload keyword and channel rules today. Family: extracted capture. This row records file-level provenance only and does not approve extracted capture behavior, comment entity filtering, or runtime behavior changes. |
| `tests/runtime/function-coverage-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: function coverage artifact is explicit that lexical function coverage is not complete yet. Family: function coverage. This row records file-level provenance only and does not approve callable coverage completion, method behavior, or runtime behavior changes. |
| `tests/runtime/handle-resolver-method-semantic-register-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: handle resolver method semantic register is audit-only and scoped to current behavior. Family: handle resolver methods. This row records file-level provenance only and does not approve handle resolver behavior, method semantics, or runtime behavior changes. |
| `tests/runtime/home-feed-dom-cleanup-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: home-feed DOM cleanup boundary audit is audit-only and source pinned. Family: home feed DOM cleanup. This row records file-level provenance only and does not approve home feed cleanup, selector behavior, or runtime behavior changes. |
| `tests/runtime/immediacy-claim-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: immediacy claim boundary is audit-only and not a runtime patch. Family: immediacy claim boundary. This row records file-level provenance only and does not approve immediacy claims, zero-delay behavior, or runtime behavior changes. |
| `tests/runtime/io-manager-method-semantic-register-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: IO manager method semantic register is audit-only and scoped to current behavior. Family: IO manager methods. This row records file-level provenance only and does not approve IO manager behavior, method semantics, or runtime behavior changes. |
| `tests/runtime/keyword-comments-scope-migration-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: keyword-comments scope migration audit is audit-only and source pinned. Family: keyword comments scope migration. This row records file-level provenance only and does not approve keyword scope migration, comments filtering, or runtime behavior changes. |
| `tests/runtime/kids-comments-filter-all-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: Kids comments Filter All audit is audit-only and source pinned. Family: Kids comments Filter All. This row records file-level provenance only and does not approve Kids comments behavior, Filter All behavior, or runtime behavior changes. |
| `tests/runtime/lifecycle-teardown-decision-register-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: lifecycle teardown decision register is audit-only and keeps runtime behavior unchanged. Family: lifecycle teardown decision. This row records file-level provenance only and does not approve lifecycle teardown behavior, cleanup behavior, or runtime behavior changes. |
| `tests/runtime/list-mode-transition-persistence-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: list-mode transition persistence audit document records current boundary and fixtures. Family: list-mode transition persistence. This row records file-level provenance only and does not approve list-mode transitions, persistence behavior, or runtime behavior changes. |
| `tests/runtime/live-chat-dom-cleanup-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: live chat DOM cleanup boundary audit is audit-only and source pinned. Family: live chat DOM cleanup. This row records file-level provenance only and does not approve live chat cleanup, selector behavior, or runtime behavior changes. |
| `tests/runtime/manifest-permission-feature-map-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: manifest permission feature-map doc is audit-only and fingerprints are pinned. Family: manifest permission feature map. This row records file-level provenance only and does not approve manifest permissions, feature mapping, or runtime behavior changes. |
| `tests/runtime/media-asset-duplicate-derivative-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: media asset duplicate derivative boundary doc is audit-only and source pinned. Family: media asset duplicate derivative. This row records file-level provenance only and does not approve media asset cleanup, packaging behavior, or runtime behavior changes. |
| `tests/runtime/members-only-dom-cleanup-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: members-only DOM cleanup boundary audit is audit-only and source pinned. Family: members-only DOM cleanup. This row records file-level provenance only and does not approve members-only cleanup, selector behavior, or runtime behavior changes. |
| `tests/runtime/menu-observer-kids-passive-lifecycle-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: menu observer Kids passive lifecycle audit is audit-only and source pinned. Family: menu observer Kids passive lifecycle. This row records file-level provenance only and does not approve menu observer lifecycle, Kids passive behavior, or runtime behavior changes. |
| `tests/runtime/message-transport-callsite-register-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: message transport callsite register is audit-only and source pinned. Family: message transport callsites. This row records file-level provenance only and does not approve message transport, callsite behavior, or runtime behavior changes. |
| `tests/runtime/mode-surface-effect-matrix-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: mode surface effect matrix doc treats waterfall as source priority not effect permission. Family: mode surface effect matrix. This row records file-level provenance only and does not approve mode effect changes, source priority changes, or runtime behavior changes. |
| `tests/runtime/navigation-header-search-dom-cleanup-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: navigation/header/search DOM cleanup boundary audit is audit-only and source pinned. Family: navigation/header/search DOM cleanup. This row records file-level provenance only and does not approve navigation cleanup, header cleanup, search cleanup, or runtime behavior changes. |
| `tests/runtime/network-fetch-xhr-callsite-register-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: network fetch/xhr callsite register is audit-only and source pinned. Family: network fetch/XHR callsites. This row records file-level provenance only and does not approve network fetch behavior, XHR behavior, or runtime behavior changes. |
| `tests/runtime/open-app-cleanup-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: open-app cleanup boundary audit is audit-only and source pinned. Family: open-app cleanup. This row records file-level provenance only and does not approve open-app cleanup, selector behavior, or runtime behavior changes. |
| `tests/runtime/package-lock-script-optional-dependency-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: package lock script optional dependency boundary doc is audit-only. Family: package lock script optional dependency. This row records file-level provenance only and does not approve package dependency changes, script changes, or runtime behavior changes. |
| `tests/runtime/player-endscreen-dom-cleanup-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: player/end-screen DOM cleanup boundary audit is audit-only and source pinned. Family: player end-screen DOM cleanup. This row records file-level provenance only and does not approve player cleanup, end-screen cleanup, or runtime behavior changes. |
| `tests/runtime/playlist-mix-dom-cleanup-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: playlist/Mix DOM cleanup boundary audit is audit-only and source pinned. Family: playlist/Mix DOM cleanup. This row records file-level provenance only and does not approve playlist cleanup, Mix cleanup, or runtime behavior changes. |
| `tests/runtime/profile-management-persistence-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: profile management persistence audit document records current boundary and fixtures. Family: profile management persistence. This row records file-level provenance only and does not approve profile management, persistence behavior, or runtime behavior changes. |
| `tests/runtime/public-release-surface-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: extension package and browser manifest versions currently match. Family: public release surface. This row records file-level provenance only and does not approve public release claims, packaging, or runtime behavior changes. |
| `tests/runtime/quarantined-content-css-package-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: quarantined content CSS package boundary is audit-only and source scoped. Family: quarantined content CSS package. This row records file-level provenance only and does not approve quarantined package cleanup, CSS package changes, or runtime behavior changes. |
| `tests/runtime/raw-capture-extraction-obligation-index-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: raw capture extraction index covers every unique ignored capture path exactly once. Family: raw capture extraction obligation. This row records file-level provenance only and does not approve raw capture extraction, release inclusion, or runtime behavior changes. |
| `tests/runtime/recommended-dom-cleanup-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: recommended DOM cleanup boundary audit is audit-only and source pinned. Family: recommended DOM cleanup. This row records file-level provenance only and does not approve recommended cleanup, selector behavior, or runtime behavior changes. |
| `tests/runtime/render-engine-method-semantic-register-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: render engine method semantic register is audit-only and scoped to current behavior. Family: render engine methods. This row records file-level provenance only and does not approve render engine behavior, method semantics, or runtime behavior changes. |
| `tests/runtime/route-identity-decision-index-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: route identity decision index is audit-only and defines decision classes. Family: route identity decision index. This row records file-level provenance only and does not approve route identity decisions, authority changes, or runtime behavior changes. |
| `tests/runtime/shared-identity-method-semantic-register-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: shared identity method semantic register is audit-only and scoped to current behavior. Family: shared identity methods. This row records file-level provenance only and does not approve shared identity behavior, method semantics, or runtime behavior changes. |
| `tests/runtime/shorts-dom-cleanup-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: Shorts DOM cleanup boundary audit is audit-only and source pinned. Family: Shorts DOM cleanup. This row records file-level provenance only and does not approve Shorts cleanup, selector behavior, or runtime behavior changes. |
| `tests/runtime/single-channel-rule-mutation-persistence-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: single-channel rule mutation persistence audit document records current boundary and fixtures. Family: single-channel rule mutation persistence. This row records file-level provenance only and does not approve single-channel mutation, persistence behavior, or runtime behavior changes. |
| `tests/runtime/sponsored-cards-dom-cleanup-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: sponsored-card DOM cleanup boundary audit is audit-only and source pinned. Family: sponsored cards DOM cleanup. This row records file-level provenance only and does not approve sponsored-card cleanup, selector behavior, or runtime behavior changes. |
| `tests/runtime/stats-surface-legacy-metric-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: stats surface legacy metric boundary is audit-only and source pinned. Family: stats surface legacy metric. This row records file-level provenance only and does not approve stats surface changes, legacy metric behavior, or runtime behavior changes. |
| `tests/runtime/subscription-import-request-lifecycle-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: subscription import lifecycle audit is audit-only and source pinned. Family: subscription import request lifecycle. This row records file-level provenance only and does not approve subscription import lifecycle, request behavior, or runtime behavior changes. |
| `tests/runtime/surface-information-availability-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: surface information availability doc is audit-only and lists all high-risk surfaces. Family: surface information availability. This row records file-level provenance only and does not approve surface information authority, identity confidence, or runtime behavior changes. |
| `tests/runtime/synthetic-event-action-register-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: synthetic event/action register is audit-only and keeps runtime unchanged. Family: synthetic event/action register. This row records file-level provenance only and does not approve synthetic event behavior, action dispatch, or runtime behavior changes. |
| `tests/runtime/xhr-comment-continuation-parity-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: XHR comment continuation parity slice is audit-only and source pinned. Family: XHR comment continuation parity. This row records file-level provenance only and does not approve XHR comment continuation behavior, parity claims, or runtime behavior changes. |
| `tests/runtime/youtube-music-surface-identity-boundary-current-behavior.test.mjs` | Remaining tail runtime-test exact-row backfill: YouTube Music surface identity boundary audit is audit-only and source pinned. Family: YouTube Music surface identity. This row records file-level provenance only and does not approve YouTube Music identity behavior, surface authority, or runtime behavior changes. |

## Whitelist Pending Intake Runtime-Test Exact Row Backfill - 2026-05-25

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the whitelist pending intake no-work contract test
file. It changes documentation provenance only; runtime behavior remains
unchanged.

| Runtime proof | Result |
| --- | --- |
| `tests/runtime/whitelist-pending-intake-no-work-contract-current-behavior.test.mjs` | Whitelist pending intake runtime-test exact-row backfill: whitelist pending intake no-work contract is audit-only and source-backed. Family: whitelist pending intake no-work contract. This row records file-level provenance only and does not approve whitelist pending intake behavior, cache behavior, selector behavior, or runtime behavior changes. |

## Release Regression Runtime-Test Exact Row Backfill - 2026-05-27

This audit-only backfill gives the narrative runtime fixture results ledger exact
backticked rows for the release-regression tests added after the previous
runtime-test provenance snapshot. These rows are file-level provenance only and
do not claim complete semantic coverage, release readiness, or behavior safety.

| Runtime test file | Backfill note |
| --- | --- |
| `tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs` | Empty-install idle observer budget runtime-test exact-row backfill: proves lazy quick-block/menu/DOM fallback observer budget fixtures exist for the release lag fix. |
| `tests/runtime/main-profile-blocklist-keyword-alias-current-behavior.test.mjs` | Main profile blocklist keyword alias runtime-test exact-row backfill: proves the visible `main.keywords` field wins over stale alias fields in background compilation. |
| `tests/runtime/native-dropdown-close-state-current-behavior.test.mjs` | Native dropdown close-state runtime-test exact-row backfill: proves reusable YouTube native dropdowns are not poisoned by FilterTube close handling. |
| `tests/runtime/storage-refresh-force-reprocess-coalescing-current-behavior.test.mjs` | Storage refresh force-reprocess coalescing runtime-test exact-row backfill: proves forced reprocess is preserved when map-only and rule-changing refreshes coalesce. |

## Build Script Runtime-Test Exact Row Backfill - 2026-05-27

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the build-script semantic verifier added after the
previous runtime-test provenance snapshot. This row is file-level provenance
only and does not claim release-package safety, README mutation approval,
GitHub release workflow approval, or behavior-change readiness.

| Runtime test file | Backfill note |
| --- | --- |
| `tests/runtime/build-script-method-semantic-register-current-behavior.test.mjs` | Build script method semantic register runtime-test exact-row backfill: proves the `build.js` current-behavior register is source-fingerprinted, method-inventoried, side-effect-token pinned, and still blocked on missing build/release authority. |

## Whitelist Cache SPA Metric Packet Runtime-Test Exact Row Backfill - 2026-05-29

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the whitelist/cache SPA metric packet gate test file.
It changes documentation provenance only; runtime behavior remains unchanged.

| Runtime test file | Backfill note |
| --- | --- |
| `tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs` | Whitelist cache SPA metric packet runtime-test exact-row backfill: proves the whitelist/cache SPA metric packet gate is audit-only, source-backed, and still blocked on missing committed packet artifacts, live smoke rows, runtime collectors, optimization approval, and JSON-first first-class approval. |

## Content Filter Field Semantics Contract Runtime-Test Exact Row Backfill - 2026-05-29

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the content-filter field semantics contract gate test
file. It changes documentation provenance only; runtime behavior remains
unchanged.

| Runtime test file | Backfill note |
| --- | --- |
| `tests/runtime/content-filter-field-semantics-contract-gate-current-behavior.test.mjs` | Content-filter field semantics contract runtime-test exact-row backfill: proves the contract gate is audit-only, source-backed, and keeps JSON-first first-class content-filter authority, DOM fallback deletion, ingress normalization, release claims, and runtime behavior changes at NO-GO. |

## Content Filter Field Effect Manifest Runtime-Test Exact Row Backfill - 2026-05-29

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the content-filter field-effect manifest gate test
file. It changes documentation provenance only; runtime behavior remains
unchanged.

| Runtime test file | Backfill note |
| --- | --- |
| `tests/runtime/content-filter-field-effect-manifest-gate-current-behavior.test.mjs` | Content-filter field-effect manifest runtime-test exact-row backfill: proves the field-effect manifest gate is audit-only, source-backed, and keeps JSON-first content-filter authority, DOM fallback deletion, category fetch ownership merging, release claims, and runtime behavior changes at NO-GO. |

## Content Filter Field Effect Route Surface Matrix Runtime-Test Exact Row Backfill - 2026-05-29

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the content-filter field-effect route/surface matrix
test file. It changes documentation provenance only; runtime behavior remains
unchanged.

| Runtime test file | Backfill note |
| --- | --- |
| `tests/runtime/content-filter-field-effect-route-surface-matrix-current-behavior.test.mjs` | Content-filter field-effect route/surface matrix runtime-test exact-row backfill: proves the route/surface matrix is audit-only, source-backed, and keeps JSON-first route/surface authority, DOM fallback deletion, YTM selected-row parity, Kids/native parity, comment-exclusion approval, release claims, and runtime behavior changes at NO-GO. |

## Content Filter Route Surface No-Work Budget Runtime-Test Exact Row Backfill - 2026-05-29

This audit-only backfill gives the narrative runtime fixture results ledger an
exact backticked row for the content-filter route/surface no-work budget test
file. It changes documentation provenance only; runtime behavior remains
unchanged.

| Runtime test file | Backfill note |
| --- | --- |
| `tests/runtime/content-filter-route-surface-no-work-budget-current-behavior.test.mjs` | Content-filter route/surface no-work budget runtime-test exact-row backfill: proves the budget is audit-only, source-backed, and keeps JSON-first no-work authority, DOM fallback route deletion, empty-install completion, broad whitelist optimization, metadata fetch authority, release claims, and runtime behavior changes at NO-GO. |

## Runtime Fixture Index Completeness Snapshot - 2026-05-25

The stored TAP summary proves the 4663-assertion lifecycle-convergence runtime
set, and this file has an exact backticked row for every top-level runtime test
file. The generated provenance index now counts the four later audit-only
content-filter convergence declarations as current source.

```text
527 top-level `tests/runtime/*.test.mjs` files
527 exact backticked test-path entries in this runtime fixture results file
0 top-level runtime test files without exact backticked entries here
generated per-test provenance index: docs/audit/FILTERTUBE_RUNTIME_TEST_FILE_PROVENANCE_INDEX_CURRENT_BEHAVIOR_2026-05-25.md
generated per-test provenance rows: 527
source top-level test declarations counted by generated index: 4667
```

This closes the file-level runtime-test provenance gap in the narrative runtime
fixture results ledger. It is still not complete semantic coverage evidence for
optimization readiness: future behavior work still needs feature-specific
positive, negative, route, mode, side-effect, false-hide, leak, performance,
rollout, and rollback proof.
