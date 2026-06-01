# FilterTube Runtime Test File Provenance Index - Current Behavior - 2026-05-25

Status: audit-only generated current-behavior index. Runtime behavior is unchanged. This is not an implementation patch.

This generated index gives the audit one exact row per top-level runtime test file. It complements the narrative runtime fixture results ledger; it does not make JSON-first filtering, whitelist optimization, collector insertion, native sync, release packaging, or public claims implementation-ready.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Generation Boundary

```text
source directory: tests/runtime
file selector: top-level *.test.mjs files
runtime results ledger: docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md
top-level runtime test files: 534
indexed runtime test rows: 534
source top-level test declarations counted: 4719
runtime results exact backticked test-path rows: 534
runtime results missing exact backticked test-path rows: 0
```

## Full Runtime Freshness Boundary - 2026-06-01

The generated source count above is paired with the current broad runtime audit
backlog, not a completion proof. The latest broad audit snapshot is recorded in
`docs/audit/FILTERTUBE_CHANGE_SAFETY_RUNTIME_AUDIT_BACKLOG_2026-06-01.md`.

```text
latest broad runtime audit command: npm run audit:runtime
latest broad runtime audit tests: 4719
latest broad runtime audit pass: 4491
latest broad runtime audit fail: 228
fresh full runtime exit status for 4719 declaration set: nonzero
current full runtime proof for generated 4719 declaration set: NO-GO
runtime behavior changed: no
```

This keeps runtime assertion freshness blocked for broad audit completion. It
does not approve semantic completion, JSON-first promotion, whitelist/cache
optimization, release/public-claim use, or goal completion.

## Authority Boundary

This is file-level provenance proof only. A row here means the current worktree has the test file, the index saw its top-level test declarations, and the row records whether the narrative runtime fixture results ledger has an exact backticked path for that file. It does not prove semantic completeness for every feature, method, JSON path, DOM selector, listener, observer, timer, settings mode, or cross-feature interaction.

Future optimization work should cite this index for complete runtime-test file enumeration and cite feature-specific docs/tests for behavior authority.

## Complete Runtime Test File Index

| # | Runtime test file | Top-level test declarations | Exact row in runtime fixture results | First top-level test title |
| --- | --- | ---: | --- | --- |
| 1 | `tests/runtime/active-goal-completion-audit-current-behavior.test.mjs` | 262 | `yes` | active goal completion audit is audit-only and keeps goal open |
| 2 | `tests/runtime/active-rule-authority-current-behavior.test.mjs` | 7 | `yes` | active-rule authority audit documents every split active predicate family |
| 3 | `tests/runtime/add-filtered-channel-filter-all-comments-default-current-behavior.test.mjs` | 11 | `yes` | addFilteredChannel Filter All comments default audit is audit-only and source pinned |
| 4 | `tests/runtime/alias-ingress-preservation-current-behavior.test.mjs` | 8 | `yes` | alias ingress preservation doc is audit-only and extends stale alias proof |
| 5 | `tests/runtime/all-callable-index-current-behavior.test.mjs` | 6 | `yes` | audit meta index docs carry the method proof gap blocker |
| 6 | `tests/runtime/audit-completion-gap-register-current-behavior.test.mjs` | 9 | `yes` | audit_completion_gap_register_is_audit_only_and_keeps_goal_open |
| 7 | `tests/runtime/audit-doc-layout-current-behavior.test.mjs` | 2 | `yes` | FilterTube audit markdown artifacts live under docs/audit |
| 8 | `tests/runtime/audit-runtime-backlog-current-behavior.test.mjs` | 3 | `yes` | audit runtime backlog remains explicit and outside release-lane completion claims |
| 9 | `tests/runtime/background-add-filtered-channel-list-target-current-behavior.test.mjs` | 11 | `yes` | background addFilteredChannel list-target audit is audit-only and source pinned |
| 10 | `tests/runtime/background-auto-backup-scheduler-boundary-current-behavior.test.mjs` | 8 | `yes` | background auto-backup scheduler audit is audit-only and source pinned |
| 11 | `tests/runtime/background-compiled-cache-invalidation-lifecycle-boundary-current-behavior.test.mjs` | 9 | `yes` | background compiled cache invalidation doc records audit-only boundary |
| 12 | `tests/runtime/background-identity-fetch-network-budget-boundary-current-behavior.test.mjs` | 8 | `yes` | background identity fetch network budget audit is audit-only and source pinned |
| 13 | `tests/runtime/background-identity-fetch-trigger-chain-current-behavior.test.mjs` | 6 | `yes` | background identity fetch trigger chain doc records the full DOM-to-background path |
| 14 | `tests/runtime/background-message-action-semantic-register-current-behavior.test.mjs` | 5 | `yes` | background message action semantic register is audit-only and scoped to current behavior |
| 15 | `tests/runtime/background-message-authority-current-behavior.test.mjs` | 12 | `yes` | background message authority audit documents listeners guards mutations and raw evidence boundary |
| 16 | `tests/runtime/background-method-semantic-register-current-behavior.test.mjs` | 7 | `yes` | background method semantic register is audit-only and scoped to current behavior |
| 17 | `tests/runtime/background-script-injection-trust-boundary-current-behavior.test.mjs` | 8 | `yes` | background script injection trust audit is audit-only and source counted |
| 18 | `tests/runtime/backup-download-blob-url-lifecycle-boundary-current-behavior.test.mjs` | 8 | `yes` | backup download blob URL lifecycle doc records audit-only boundary |
| 19 | `tests/runtime/backup-export-authority-current-behavior.test.mjs` | 10 | `yes` | backup export authority audit documents split writers and future contract |
| 20 | `tests/runtime/backup-nanah-trusted-state-boundary-current-behavior.test.mjs` | 7 | `yes` | backup Nanah trusted-state boundary audit is audit-only and source pinned |
| 21 | `tests/runtime/batch-whitelist-import-persistence-boundary-current-behavior.test.mjs` | 7 | `yes` | batch whitelist import persistence audit is audit-only and source pinned |
| 22 | `tests/runtime/block-channel-method-semantic-register-current-behavior.test.mjs` | 8 | `yes` | block channel method semantic register is audit-only and scoped to current behavior |
| 23 | `tests/runtime/bridge-injection-method-semantic-register-current-behavior.test.mjs` | 5 | `yes` | bridge injection method semantic register is audit-only and source scoped |
| 24 | `tests/runtime/bridge-settings-listener-timer-boundary-current-behavior.test.mjs` | 9 | `yes` | bridge settings listener/timer audit is audit-only and source pinned |
| 25 | `tests/runtime/bridge-settings-method-semantic-register-current-behavior.test.mjs` | 8 | `yes` | bridge settings method semantic register is audit-only and scoped to current behavior |
| 26 | `tests/runtime/browser-manifest-runtime-load-order-current-behavior.test.mjs` | 7 | `yes` | browser manifest runtime load-order doc is audit-only and manifest fingerprints are pinned |
| 27 | `tests/runtime/build-release-method-semantic-register-current-behavior.test.mjs` | 5 | `yes` | build release method semantic register is audit-only and source scoped |
| 28 | `tests/runtime/build-script-method-semantic-register-current-behavior.test.mjs` | 5 | `yes` | build script method semantic register is audit-only and source fingerprinted |
| 29 | `tests/runtime/build-website-callable-current-behavior.test.mjs` | 3 | `yes` | build/website callable audit accounts for every current build and website source file |
| 30 | `tests/runtime/candidate-obligation-binding-matrix-current-behavior.test.mjs` | 6 | `yes` | candidate obligation binding matrix is audit-only and source-backed |
| 31 | `tests/runtime/capture-corpus-current-behavior.test.mjs` | 6 | `yes` | ignored raw capture corpus is explicitly excluded from release source |
| 32 | `tests/runtime/capture-fixture-traceability-current-behavior.test.mjs` | 5 | `yes` | capture traceability doc matches the current ignored capture corpus counts |
| 33 | `tests/runtime/code-burden-declutter-boundary-current-behavior.test.mjs` | 7 | `yes` | code-burden declutter boundary is audit-only and blocks cleanup without proof |
| 34 | `tests/runtime/collab-dialog-lifecycle-current-behavior.test.mjs` | 8 | `yes` | collab dialog lifecycle audit documents current behavior and future gate |
| 35 | `tests/runtime/collab-dialog-method-semantic-register-current-behavior.test.mjs` | 7 | `yes` | collab dialog method semantic register is audit-only and scoped to current behavior |
| 36 | `tests/runtime/comments-dom-cleanup-boundary-current-behavior.test.mjs` | 9 | `yes` | comments DOM cleanup boundary audit is audit-only and source pinned |
| 37 | `tests/runtime/compact-autoplay-authority-current-behavior.test.mjs` | 5 | `yes` | compact autoplay audit documents current unsupported renderer verdict |
| 38 | `tests/runtime/compact-autoplay-raw-corpus-census-current-behavior.test.mjs` | 5 | `yes` | compact autoplay raw corpus census doc records the no-JSON/HTML verdict |
| 39 | `tests/runtime/compiled-cache-authority-current-behavior.test.mjs` | 8 | `yes` | compiled_cache_doc_lists_current_cache_authorities |
| 40 | `tests/runtime/compiled-settings-field-register-current-behavior.test.mjs` | 4 | `yes` | compiled settings field register is audit-only and source pinned |
| 41 | `tests/runtime/compiled-settings-profile-list-mode-assembly-boundary-current-behavior.test.mjs` | 7 | `yes` | compiled settings profile/list-mode assembly doc is audit-only and source pinned |
| 42 | `tests/runtime/compiler-parity-current-behavior.test.mjs` | 8 | `yes` | compiler_parity_doc_lists_current_compiler_authorities |
| 43 | `tests/runtime/compress-video-script-failure-mode-boundary-current-behavior.test.mjs` | 5 | `yes` | compress-video failure-mode boundary is audit-only and source pinned |
| 44 | `tests/runtime/content-bridge-collaborator-enrichment-retry-boundary-current-behavior.test.mjs` | 10 | `yes` | content bridge collaborator enrichment retry audit is audit-only and source pinned |
| 45 | `tests/runtime/content-bridge-collaborator-identity-promotion-handoff-current-behavior.test.mjs` | 12 | `yes` | collaborator identity promotion handoff audit and implementation addendum are source pinned |
| 46 | `tests/runtime/content-bridge-collaborator-main-world-merge-mutation-current-behavior.test.mjs` | 11 | `yes` | collaborator main-world merge audit is audit-only and source pinned |
| 47 | `tests/runtime/content-bridge-collaborator-metadata-extraction-side-effect-boundary-current-behavior.test.mjs` | 11 | `yes` | collaborator metadata extraction audit is audit-only and source pinned |
| 48 | `tests/runtime/content-bridge-lifecycle-callback-semantic-register-current-behavior.test.mjs` | 5 | `yes` | content bridge lifecycle callback register is audit-only and scoped to current behavior |
| 49 | `tests/runtime/content-bridge-main-world-message-dispatch-boundary-current-behavior.test.mjs` | 8 | `yes` | content bridge main-world dispatch audit is audit-only and source counted |
| 50 | `tests/runtime/content-bridge-menu-action-list-target-current-behavior.test.mjs` | 11 | `yes` | menu action list-target audit is audit-only and source pinned |
| 51 | `tests/runtime/content-bridge-menu-blocked-state-list-shape-current-behavior.test.mjs` | 11 | `yes` | menu blocked-state list-shape audit is audit-only and source pinned |
| 52 | `tests/runtime/content-bridge-menu-injection-action-boundary-current-behavior.test.mjs` | 9 | `yes` | content bridge menu injection action audit is audit-only and source pinned |
| 53 | `tests/runtime/content-bridge-prefetch-identity-lifecycle-boundary-current-behavior.test.mjs` | 6 | `yes` | content bridge prefetch identity lifecycle audit is audit-only and source pinned |
| 54 | `tests/runtime/content-bridge-production-console-gate-current-behavior.test.mjs` | 4 | `yes` | content_bridge installs an isolated-world production console gate for log/debug only |
| 55 | `tests/runtime/content-bridge-selector-semantic-register-current-behavior.test.mjs` | 5 | `yes` | content bridge selector semantic register is audit-only and scoped to current behavior |
| 56 | `tests/runtime/content-bridge-startup-timing-boundary-current-behavior.test.mjs` | 10 | `yes` | content bridge startup timing audit is audit-only and source counted |
| 57 | `tests/runtime/content-bridge-top-level-method-semantic-register-current-behavior.test.mjs` | 6 | `yes` | content bridge top-level method register is audit-only and not nested callable completion |
| 58 | `tests/runtime/content-bridge-whitelist-pending-refresh-boundary-current-behavior.test.mjs` | 12 | `yes` | content bridge whitelist pending refresh doc is audit-only and source pinned |
| 59 | `tests/runtime/content-category-predicate-authority-current-behavior.test.mjs` | 7 | `yes` | content predicate authority audit documents split activation and decision families |
| 60 | `tests/runtime/content-control-active-work-matrix-current-behavior.test.mjs` | 7 | `yes` | content-control active-work matrix is audit-only and source pinned |
| 61 | `tests/runtime/content-control-alias-mutation-boundary-current-behavior.test.mjs` | 5 | `yes` | content-control alias mutation boundary is audit-only and source pinned |
| 62 | `tests/runtime/content-control-dom-style-lifecycle-restore-current-behavior.test.mjs` | 6 | `yes` | content-control DOM style lifecycle audit is audit-only and source pinned |
| 63 | `tests/runtime/content-control-dom-style-selector-matrix-current-behavior.test.mjs` | 6 | `yes` | content-control DOM style selector matrix is audit-only and source pinned |
| 64 | `tests/runtime/content-control-json-first-boundary-index-current-behavior.test.mjs` | 5 | `yes` | content-control JSON-first boundary index is audit-only and source pinned |
| 65 | `tests/runtime/content-controls-catalog-method-semantic-register-current-behavior.test.mjs` | 8 | `yes` | content controls catalog method semantic register is audit-only and scoped to current behavior |
| 66 | `tests/runtime/content-direct-identity-fallback-side-effect-boundary-current-behavior.test.mjs` | 9 | `yes` | content direct identity fallback audit is audit-only and source pinned |
| 67 | `tests/runtime/content-filter-field-effect-manifest-gate-current-behavior.test.mjs` | 6 | `yes` | content-filter field-effect manifest gate is audit-only and source-backed |
| 68 | `tests/runtime/content-filter-field-effect-route-surface-matrix-current-behavior.test.mjs` | 7 | `yes` | content-filter route surface matrix is audit-only and source-backed |
| 69 | `tests/runtime/content-filter-field-semantics-contract-gate-current-behavior.test.mjs` | 5 | `yes` | content-filter field semantics contract gate is audit-only and source-backed |
| 70 | `tests/runtime/content-filter-route-surface-no-work-budget-current-behavior.test.mjs` | 6 | `yes` | content-filter no-work budget is audit-only and source-backed |
| 71 | `tests/runtime/content-helper-callable-current-behavior.test.mjs` | 3 | `yes` | content-helper callable audit accounts for every current content helper source file |
| 72 | `tests/runtime/content-menu-method-semantic-register-current-behavior.test.mjs` | 7 | `yes` | content menu method semantic register is audit-only and scoped to current behavior |
| 73 | `tests/runtime/cross-feature-authority-matrix-current-behavior.test.mjs` | 4 | `yes` | cross-feature authority matrix covers every current high-level authority family and feature row |
| 74 | `tests/runtime/css-load-style-surface-current-behavior.test.mjs` | 5 | `yes` | CSS load style surface register is audit-only and covers every tracked CSS file |
| 75 | `tests/runtime/css-style-hide-authority-current-behavior.test.mjs` | 7 | `yes` | CSS style hide audit documents live style authority and quarantined legacy CSS |
| 76 | `tests/runtime/current-dirty-worktree-audit-boundary-current-behavior.test.mjs` | 6 | `yes` | current dirty worktree boundary doc is audit-only and keeps implementation blocked |
| 77 | `tests/runtime/design-token-json-css-parity-boundary-current-behavior.test.mjs` | 6 | `yes` | design token JSON CSS parity doc is audit-only and scoped to current behavior |
| 78 | `tests/runtime/direct-hide-writer-register-current-behavior.test.mjs` | 6 | `yes` | direct hide writer register is audit-only and names the missing authority |
| 79 | `tests/runtime/direct-watch-card-authority-current-behavior.test.mjs` | 5 | `yes` | direct watch-card audit documents split wrapper and direct renderer authority |
| 80 | `tests/runtime/document-start-zero-flash-boundary-current-behavior.test.mjs` | 6 | `yes` | document_start_zero_flash_boundary_is_audit_only_and_runtime_unchanged |
| 81 | `tests/runtime/dom-broad-hide-boundary-current-behavior.test.mjs` | 8 | `yes` | broad hide boundary audit documents false-hide surfaces and blocked verdict |
| 82 | `tests/runtime/dom-extractors-method-semantic-register-current-behavior.test.mjs` | 8 | `yes` | DOM extractors method semantic register is audit-only and scoped to current behavior |
| 83 | `tests/runtime/dom-fallback-lifecycle-callback-semantic-register-current-behavior.test.mjs` | 5 | `yes` | DOM fallback lifecycle callback register is audit-only and scoped to current behavior |
| 84 | `tests/runtime/dom-fallback-method-semantic-register-current-behavior.test.mjs` | 8 | `yes` | DOM fallback method semantic register is audit-only and scoped to current behavior |
| 85 | `tests/runtime/dom-fallback-run-state-visibility-cleanup-boundary-current-behavior.test.mjs` | 9 | `yes` | DOM fallback run-state visibility cleanup doc is audit-only and source pinned |
| 86 | `tests/runtime/dom-fallback-selector-semantic-register-current-behavior.test.mjs` | 6 | `yes` | DOM fallback selector semantic register is audit-only and scoped to current behavior |
| 87 | `tests/runtime/dom-hide-side-effect-current-behavior.test.mjs` | 6 | `yes` | DOM hide side-effect audit documents shared, direct, container, and recycled-node hide authorities |
| 88 | `tests/runtime/dom-identity-confidence-current-behavior.test.mjs` | 6 | `yes` | dom_identity_confidence_doc_is_audit_only_and_names_the_missing_authority |
| 89 | `tests/runtime/dom-route-scope-current-behavior.test.mjs` | 8 | `yes` | DOM route-scope audit documents current selector authority gaps and future rule |
| 90 | `tests/runtime/dom-selector-instance-register-current-behavior.test.mjs` | 10 | `yes` | DOM selector instance register documents boundary and non-completion |
| 91 | `tests/runtime/dom-state-virtual-attributes-current-behavior.test.mjs` | 3 | `yes` | sensitive FilterTube state attributes are virtualized off the public DOM |
| 92 | `tests/runtime/dom-target-source-current-behavior.test.mjs` | 15 | `yes` | quick-block card selector covers watch-card and playlist surfaces but is disabled in whitelist mode |
| 93 | `tests/runtime/doms-html-mutated-main-dom-classification-current-behavior.test.mjs` | 5 | `yes` | doms_html_raw_shape_is_mixed_main_dom_already_mutated_by_filtertube |
| 94 | `tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs` | 8 | `yes` | empty desktop install keeps quick-block body observation mobile-only and pointer recovery target-gated |
| 95 | `tests/runtime/empty-install-performance-current-behavior.test.mjs` | 13 | `yes` | empty-install performance audit documents no-rule work and required future gates |
| 96 | `tests/runtime/enabled-master-switch-disabled-runtime-boundary-current-behavior.test.mjs` | 6 | `yes` | enabled disabled-runtime boundary is audit-only and source pinned |
| 97 | `tests/runtime/endpoint-decision-matrix-current-behavior.test.mjs` | 3 | `yes` | endpoint decision matrix documents the exact current YouTubei endpoint set |
| 98 | `tests/runtime/engagement-budget-current-behavior.test.mjs` | 10 | `yes` | engagement budget audit documents recommendation-risk boundaries and blocked verdict |
| 99 | `tests/runtime/engagement-side-effect-current-behavior.test.mjs` | 9 | `yes` | engagement side-effect audit documents observable effect owners and future budget contract |
| 100 | `tests/runtime/extension-asset-data-package-surface-current-behavior.test.mjs` | 6 | `yes` | extension asset data package surface doc is audit-only and fingerprint pinned |
| 101 | `tests/runtime/extension-icon-logo-package-parity-boundary-current-behavior.test.mjs` | 5 | `yes` | extension icon logo package parity doc is audit-only and file fingerprint pinned |
| 102 | `tests/runtime/extension-ui-css-page-state-boundary-current-behavior.test.mjs` | 5 | `yes` | extension UI CSS page-state boundary doc is audit-only and source pinned |
| 103 | `tests/runtime/external-navigation-authority-current-behavior.test.mjs` | 8 | `yes` | external navigation audit documents runtime static website and future authority boundaries |
| 104 | `tests/runtime/external-navigation-surface-boundary-current-behavior.test.mjs` | 7 | `yes` | external navigation surface boundary doc is audit-only and fingerprints are pinned |
| 105 | `tests/runtime/extracted-capture-current-behavior.test.mjs` | 21 | `yes` | extracted Main append comment entity response ignores entity payload keyword and channel rules today |
| 106 | `tests/runtime/extracted-watch-paths-text-dump-classification-current-behavior.test.mjs` | 5 | `yes` | extracted watch paths text dump audit doc and raw metadata are pinned |
| 107 | `tests/runtime/fallback-menu-action-gate-current-behavior.test.mjs` | 6 | `yes` | fallback menu action gate audit documents current popover execution drift |
| 108 | `tests/runtime/feature-source-dependency-register-current-behavior.test.mjs` | 8 | `yes` | feature_source_dependency_register_is_audit_only_and_defines_dependency_columns |
| 109 | `tests/runtime/filter-all-toggle-list-target-current-behavior.test.mjs` | 10 | `yes` | filter-all toggle list-target audit is audit-only and source pinned |
| 110 | `tests/runtime/filter-engine-current-behavior.test.mjs` | 49 | `yes` | empty blocklist mode leaves a simple videoRenderer intact |
| 111 | `tests/runtime/filter-logic-direct-renderer-rule-semantic-register-current-behavior.test.mjs` | 5 | `yes` | filter logic direct renderer rule register is audit-only and scoped to current behavior |
| 112 | `tests/runtime/filter-logic-method-semantic-register-current-behavior.test.mjs` | 8 | `yes` | filter logic method semantic register is audit-only and scoped to current behavior |
| 113 | `tests/runtime/filter-logic-rule-field-effect-semantic-register-current-behavior.test.mjs` | 4 | `yes` | filter logic rule field effect register is audit-only and source scoped |
| 114 | `tests/runtime/filter-logic-rule-path-semantic-register-current-behavior.test.mjs` | 6 | `yes` | filter logic rule path register is audit-only and source scoped |
| 115 | `tests/runtime/first-optimization-artifact-commit-readiness-gate-current-behavior.test.mjs` | 6 | `yes` | first optimization artifact commit readiness gate is audit-only and source-backed |
| 116 | `tests/runtime/first-optimization-candidate-selection-boundary-current-behavior.test.mjs` | 6 | `yes` | first optimization candidate selection boundary is audit-only and source-backed |
| 117 | `tests/runtime/first-optimization-collector-approval-authority-boundary-current-behavior.test.mjs` | 6 | `yes` | first optimization collector approval authority boundary is audit-only and source-backed |
| 118 | `tests/runtime/first-optimization-collector-diagnostic-privacy-approval-boundary-current-behavior.test.mjs` | 6 | `yes` | collector diagnostic privacy approval boundary is audit-only and source-backed |
| 119 | `tests/runtime/first-optimization-collector-fixture-provenance-approval-boundary-current-behavior.test.mjs` | 6 | `yes` | collector fixture provenance approval boundary is audit-only and source-backed |
| 120 | `tests/runtime/first-optimization-collector-insertion-approval-boundary-current-behavior.test.mjs` | 6 | `yes` | collector insertion approval boundary is audit-only and source-backed |
| 121 | `tests/runtime/first-optimization-collector-no-work-approval-boundary-current-behavior.test.mjs` | 6 | `yes` | collector no-work approval boundary is audit-only and source-backed |
| 122 | `tests/runtime/first-optimization-collector-parity-rollout-approval-boundary-current-behavior.test.mjs` | 6 | `yes` | collector parity rollout approval boundary is audit-only and source-backed |
| 123 | `tests/runtime/first-optimization-collector-rollback-unclaimed-approval-boundary-current-behavior.test.mjs` | 6 | `yes` | collector rollback unclaimed approval boundary is audit-only and source-backed |
| 124 | `tests/runtime/first-optimization-collector-side-effect-approval-boundary-current-behavior.test.mjs` | 6 | `yes` | collector side-effect approval boundary is audit-only and source-backed |
| 125 | `tests/runtime/first-optimization-collector-source-locus-closure-boundary-current-behavior.test.mjs` | 6 | `yes` | collector source-locus closure boundary is audit-only and source-backed |
| 126 | `tests/runtime/first-optimization-collector-verification-output-approval-boundary-current-behavior.test.mjs` | 6 | `yes` | collector verification output approval boundary is audit-only and source-backed |
| 127 | `tests/runtime/first-optimization-diagnostic-privacy-contract-current-behavior.test.mjs` | 6 | `yes` | first optimization diagnostic privacy contract is audit-only and source-backed |
| 128 | `tests/runtime/first-optimization-fixture-provenance-contract-current-behavior.test.mjs` | 6 | `yes` | first optimization fixture provenance contract is audit-only and source-backed |
| 129 | `tests/runtime/first-optimization-implementation-readiness-gate-current-behavior.test.mjs` | 6 | `yes` | first optimization implementation readiness gate is audit-only and source-backed |
| 130 | `tests/runtime/first-optimization-metric-artifact-foundation-packet-current-behavior.test.mjs` | 6 | `yes` | first optimization metric artifact foundation packet is audit-only and source-backed |
| 131 | `tests/runtime/first-optimization-metric-artifact-path-boundary-current-behavior.test.mjs` | 6 | `yes` | first optimization metric artifact path boundary is audit-only and source-backed |
| 132 | `tests/runtime/first-optimization-metric-artifact-schema-current-behavior.test.mjs` | 6 | `yes` | first optimization metric artifact schema is audit-only and source-backed |
| 133 | `tests/runtime/first-optimization-metric-collector-fixture-provenance-matrix-current-behavior.test.mjs` | 6 | `yes` | first optimization collector fixture provenance matrix is audit-only and source-backed |
| 134 | `tests/runtime/first-optimization-metric-collector-insertion-gate-current-behavior.test.mjs` | 6 | `yes` | first optimization metric collector insertion gate is audit-only and source-backed |
| 135 | `tests/runtime/first-optimization-metric-collector-no-work-preservation-matrix-current-behavior.test.mjs` | 6 | `yes` | first optimization collector no-work preservation matrix is audit-only and source-backed |
| 136 | `tests/runtime/first-optimization-metric-collector-parity-rollout-boundary-current-behavior.test.mjs` | 6 | `yes` | first optimization collector parity rollout boundary is audit-only and source-backed |
| 137 | `tests/runtime/first-optimization-metric-collector-side-effect-budget-matrix-current-behavior.test.mjs` | 6 | `yes` | first optimization collector side-effect budget matrix is audit-only and source-backed |
| 138 | `tests/runtime/first-optimization-metric-foundation-contract-coverage-gate-current-behavior.test.mjs` | 6 | `yes` | first optimization metric foundation contract coverage gate is audit-only and source-backed |
| 139 | `tests/runtime/first-optimization-metric-sample-contract-current-behavior.test.mjs` | 6 | `yes` | first optimization metric sample contract is audit-only and source-backed |
| 140 | `tests/runtime/first-optimization-metric-source-owner-matrix-current-behavior.test.mjs` | 6 | `yes` | first optimization metric source-owner matrix is audit-only and source-backed |
| 141 | `tests/runtime/first-optimization-no-work-preservation-contract-current-behavior.test.mjs` | 6 | `yes` | first optimization no-work preservation contract is audit-only and source-backed |
| 142 | `tests/runtime/first-optimization-packet-manifest-contract-current-behavior.test.mjs` | 6 | `yes` | first optimization packet manifest contract is audit-only and source-backed |
| 143 | `tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs` | 6 | `yes` | first optimization parity rollout contract is audit-only and source-backed |
| 144 | `tests/runtime/first-optimization-patch-evidence-packet-contract-current-behavior.test.mjs` | 6 | `yes` | first optimization patch evidence packet contract is audit-only and source-backed |
| 145 | `tests/runtime/first-optimization-rollback-unclaimed-surface-boundary-current-behavior.test.mjs` | 6 | `yes` | first optimization rollback unclaimed surface boundary is audit-only and source-backed |
| 146 | `tests/runtime/first-optimization-side-effect-budget-contract-current-behavior.test.mjs` | 6 | `yes` | first optimization side-effect budget contract is audit-only and source-backed |
| 147 | `tests/runtime/first-optimization-source-locus-callable-anchor-boundary-current-behavior.test.mjs` | 6 | `yes` | source locus callable anchor boundary is audit-only and source-backed |
| 148 | `tests/runtime/first-optimization-source-locus-diagnostic-privacy-ownership-boundary-current-behavior.test.mjs` | 6 | `yes` | source-locus diagnostic privacy ownership boundary is audit-only and source-backed |
| 149 | `tests/runtime/first-optimization-source-locus-fingerprint-boundary-current-behavior.test.mjs` | 6 | `yes` | source-locus fingerprint boundary is audit-only and source-backed |
| 150 | `tests/runtime/first-optimization-source-locus-fixture-provenance-ownership-boundary-current-behavior.test.mjs` | 6 | `yes` | source-locus fixture provenance ownership boundary is audit-only and source-backed |
| 151 | `tests/runtime/first-optimization-source-locus-implementation-authority-boundary-current-behavior.test.mjs` | 6 | `yes` | source-locus implementation authority boundary is audit-only and source-backed |
| 152 | `tests/runtime/first-optimization-source-locus-no-work-ownership-boundary-current-behavior.test.mjs` | 6 | `yes` | source-locus no-work ownership boundary is audit-only and source-backed |
| 153 | `tests/runtime/first-optimization-source-locus-parity-release-verification-ownership-boundary-current-behavior.test.mjs` | 6 | `yes` | source-locus parity release verification boundary is audit-only and source-backed |
| 154 | `tests/runtime/first-optimization-source-locus-side-effect-ownership-boundary-current-behavior.test.mjs` | 6 | `yes` | source-locus side-effect ownership boundary is audit-only and source-backed |
| 155 | `tests/runtime/first-optimization-source-locus-teardown-ownership-boundary-current-behavior.test.mjs` | 6 | `yes` | source-locus teardown ownership boundary is audit-only and source-backed |
| 156 | `tests/runtime/first-optimization-source-owner-approval-boundary-current-behavior.test.mjs` | 6 | `yes` | first optimization source-owner approval boundary is audit-only and source-backed |
| 157 | `tests/runtime/first-optimization-source-owner-map-contract-current-behavior.test.mjs` | 6 | `yes` | first optimization source owner map contract is audit-only and source-backed |
| 158 | `tests/runtime/first-optimization-source-owner-map-draft-readiness-current-behavior.test.mjs` | 7 | `yes` | source owner map draft readiness proof is audit-only and source-backed |
| 159 | `tests/runtime/first-optimization-verification-output-contract-current-behavior.test.mjs` | 6 | `yes` | first optimization verification output contract is audit-only and source-backed |
| 160 | `tests/runtime/function-coverage-current-behavior.test.mjs` | 3 | `yes` | function coverage artifact is explicit that lexical function coverage is not complete yet |
| 161 | `tests/runtime/generated-local-output-dependency-surface-current-behavior.test.mjs` | 6 | `yes` | generated local output dependency surface doc is audit-only and scoped to ignored output |
| 162 | `tests/runtime/generated-ui-shell-method-semantic-register-current-behavior.test.mjs` | 5 | `yes` | generated UI shell method register is audit-only and source scoped |
| 163 | `tests/runtime/handle-resolver-method-semantic-register-current-behavior.test.mjs` | 8 | `yes` | handle resolver method semantic register is audit-only and scoped to current behavior |
| 164 | `tests/runtime/hide-decision-pipeline-current-behavior.test.mjs` | 9 | `yes` | hide_decision_pipeline_doc_is_audit_only_and_names_the_split_pipeline |
| 165 | `tests/runtime/hide-restore-authority-current-behavior.test.mjs` | 8 | `yes` | hide/restore authority audit documents every current hide writer family |
| 166 | `tests/runtime/home-feed-dom-cleanup-boundary-current-behavior.test.mjs` | 8 | `yes` | home-feed DOM cleanup boundary audit is audit-only and source pinned |
| 167 | `tests/runtime/identity-effect-obligation-crosswalk-current-behavior.test.mjs` | 6 | `yes` | identity effect obligation crosswalk is audit-only and blocks runtime changes |
| 168 | `tests/runtime/identity-flow-diagram-register-current-behavior.test.mjs` | 7 | `yes` | identity flow diagram register is audit-only and defines route flow diagrams |
| 169 | `tests/runtime/identity-information-waterfall-current-behavior.test.mjs` | 10 | `yes` | identity_waterfall_doc_documents_actual_source_order |
| 170 | `tests/runtime/identity-resolver-cache-dedupe-current-behavior.test.mjs` | 6 | `yes` | identity resolver cache dedupe register is audit-only and keeps runtime behavior unchanged |
| 171 | `tests/runtime/identity-resolver-fanout-current-behavior.test.mjs` | 7 | `yes` | identity_resolver_fanout_doc_is_audit_only_and_scopes_the_resolver_layer |
| 172 | `tests/runtime/identity-waterfall-assertion-boundary-current-behavior.test.mjs` | 7 | `yes` | identity_waterfall_assertion_boundary_is_audit_only_and_corrects_the_shorthand |
| 173 | `tests/runtime/identity-waterfall-review-convergence-current-behavior.test.mjs` | 7 | `yes` | identity waterfall review convergence is audit-only and preserves the priority-order boundary |
| 174 | `tests/runtime/identity-work-budget-current-behavior.test.mjs` | 6 | `yes` | identity_work_budget_is_audit_only_and_separates_source_confidence_from_work_permission |
| 175 | `tests/runtime/ignored-local-planning-text-boundary-current-behavior.test.mjs` | 7 | `yes` | ignored local planning text audit is audit-only and keeps optimization blocked |
| 176 | `tests/runtime/ignored-root-evidence-corpus-current-behavior.test.mjs` | 6 | `yes` | ignored root evidence corpus doc records current counts and evidence role |
| 177 | `tests/runtime/ignored-whitelist-bundle-boundary-current-behavior.test.mjs` | 7 | `yes` | ignored whitelist bundle audit is audit-only and records the release boundary |
| 178 | `tests/runtime/immediacy-claim-boundary-current-behavior.test.mjs` | 6 | `yes` | immediacy_claim_boundary_is_audit_only_and_not_a_runtime_patch |
| 179 | `tests/runtime/implementation-readiness-gate-current-behavior.test.mjs` | 6 | `yes` | implementation readiness gate explicitly blocks broad behavior changes |
| 180 | `tests/runtime/import-export-nanah-authority-current-behavior.test.mjs` | 13 | `yes` | import export Nanah audit documents current authority flow and future contract |
| 181 | `tests/runtime/injector-main-world-message-dispatch-boundary-current-behavior.test.mjs` | 8 | `yes` | injector main-world message dispatch audit is audit-only and source counted |
| 182 | `tests/runtime/injector-method-semantic-register-current-behavior.test.mjs` | 7 | `yes` | injector method semantic register is audit-only and scoped to current behavior |
| 183 | `tests/runtime/injector-settings-capability-current-behavior.test.mjs` | 11 | `yes` | injector settings capability audit documents current bridge flow and future contract |
| 184 | `tests/runtime/io-manager-method-semantic-register-current-behavior.test.mjs` | 7 | `yes` | io manager method semantic register is audit-only and scoped to current behavior |
| 185 | `tests/runtime/json-comment-author-channel-provenance-boundary-current-behavior.test.mjs` | 10 | `yes` | JSON comment author channel provenance audit is audit-only and source pinned |
| 186 | `tests/runtime/json-comment-continuation-collection-root-parity-boundary-current-behavior.test.mjs` | 9 | `yes` | collection-root parity slice is audit-only and source pinned |
| 187 | `tests/runtime/json-comment-continuation-command-shape-parity-boundary-current-behavior.test.mjs` | 9 | `yes` | command-shape parity slice is audit-only and source pinned |
| 188 | `tests/runtime/json-comment-continuation-raw-url-admission-boundary-current-behavior.test.mjs` | 10 | `yes` | raw-URL admission slice is audit-only and source pinned |
| 189 | `tests/runtime/json-comment-continuation-sibling-preservation-boundary-current-behavior.test.mjs` | 8 | `yes` | JSON comment continuation sibling preservation slice is audit-only and pinned |
| 190 | `tests/runtime/json-comment-entity-payload-provenance-boundary-current-behavior.test.mjs` | 10 | `yes` | JSON comment entity payload provenance slice is audit-only and pinned |
| 191 | `tests/runtime/json-comment-keyword-provenance-boundary-current-behavior.test.mjs` | 10 | `yes` | JSON comment keyword provenance audit is audit-only and source pinned |
| 192 | `tests/runtime/json-comment-structural-wrapper-cleanup-boundary-current-behavior.test.mjs` | 11 | `yes` | JSON comment structural wrapper cleanup audit is audit-only and source pinned |
| 193 | `tests/runtime/json-comment-view-model-parity-boundary-current-behavior.test.mjs` | 10 | `yes` | JSON comment ViewModel parity audit is audit-only and source pinned |
| 194 | `tests/runtime/json-dom-inventory-truth-current-behavior.test.mjs` | 6 | `yes` | JSON DOM inventory truth audit defines docs as discovery maps not runtime proof |
| 195 | `tests/runtime/json-first-active-work-predicate-register-current-behavior.test.mjs` | 6 | `yes` | JSON-first active work predicate register is audit-only and source pinned |
| 196 | `tests/runtime/json-first-block-decision-effect-boundary-current-behavior.test.mjs` | 9 | `yes` | JSON-first block decision effect boundary audit is audit-only and source pinned |
| 197 | `tests/runtime/json-first-candidate-extraction-boundary-current-behavior.test.mjs` | 9 | `yes` | JSON-first candidate extraction boundary audit is audit-only and source pinned |
| 198 | `tests/runtime/json-first-channel-match-boundary-current-behavior.test.mjs` | 9 | `yes` | JSON-first channel match boundary audit is audit-only and source pinned |
| 199 | `tests/runtime/json-first-comment-continuation-shortcut-current-behavior.test.mjs` | 6 | `yes` | JSON-first comment continuation shortcut is audit-only and source pinned |
| 200 | `tests/runtime/json-first-disable-autoplay-annotations-boundary-current-behavior.test.mjs` | 7 | `yes` | JSON-first disableAutoplay/disableAnnotations boundary audit is audit-only and source pinned |
| 201 | `tests/runtime/json-first-endpoint-match-policy-current-behavior.test.mjs` | 6 | `yes` | JSON-first endpoint match policy is audit-only and source pinned |
| 202 | `tests/runtime/json-first-fetch-response-rebuild-metadata-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first fetch response rebuild metadata contract is audit-only and source pinned |
| 203 | `tests/runtime/json-first-filter-readiness-gate-current-behavior.test.mjs` | 6 | `yes` | JSON-first filter readiness gate is audit-only and links current proof layers |
| 204 | `tests/runtime/json-first-hide-all-comments-boundary-current-behavior.test.mjs` | 9 | `yes` | JSON-first hideAllComments boundary audit is audit-only and source pinned |
| 205 | `tests/runtime/json-first-hide-all-shorts-boundary-current-behavior.test.mjs` | 7 | `yes` | JSON-first hideAllShorts boundary audit is audit-only and source pinned |
| 206 | `tests/runtime/json-first-hide-ask-button-boundary-current-behavior.test.mjs` | 7 | `yes` | JSON-first hideAskButton boundary audit is audit-only and source pinned |
| 207 | `tests/runtime/json-first-hide-endscreen-cards-boundary-current-behavior.test.mjs` | 8 | `yes` | JSON-first hideEndscreenCards boundary audit is release-fix proof and source pinned |
| 208 | `tests/runtime/json-first-hide-endscreen-videowall-boundary-current-behavior.test.mjs` | 8 | `yes` | JSON-first hideEndscreenVideowall boundary audit is release-fix proof and source pinned |
| 209 | `tests/runtime/json-first-hide-explore-trending-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first hideExploreTrending boundary audit is audit-only and source pinned |
| 210 | `tests/runtime/json-first-hide-home-feed-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first hideHomeFeed boundary audit is audit-only and source pinned |
| 211 | `tests/runtime/json-first-hide-live-chat-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first hideLiveChat boundary audit is audit-only and source pinned |
| 212 | `tests/runtime/json-first-hide-members-only-boundary-current-behavior.test.mjs` | 7 | `yes` | JSON-first hideMembersOnly boundary audit is audit-only and source pinned |
| 213 | `tests/runtime/json-first-hide-merch-tickets-offers-boundary-current-behavior.test.mjs` | 7 | `yes` | JSON-first hideMerchTicketsOffers boundary audit is audit-only and source pinned |
| 214 | `tests/runtime/json-first-hide-mix-playlists-boundary-current-behavior.test.mjs` | 7 | `yes` | JSON-first hideMixPlaylists boundary audit is audit-only and source pinned |
| 215 | `tests/runtime/json-first-hide-more-from-youtube-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first hideMoreFromYouTube boundary audit is audit-only and source pinned |
| 216 | `tests/runtime/json-first-hide-notification-bell-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first hideNotificationBell boundary audit is audit-only and source pinned |
| 217 | `tests/runtime/json-first-hide-playlist-cards-boundary-current-behavior.test.mjs` | 5 | `yes` | JSON-first hidePlaylistCards boundary audit is audit-only and source pinned |
| 218 | `tests/runtime/json-first-hide-recommended-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first hideRecommended boundary audit is audit-only and source pinned |
| 219 | `tests/runtime/json-first-hide-search-shelves-boundary-current-behavior.test.mjs` | 7 | `yes` | JSON-first hideSearchShelves boundary audit is audit-only and source pinned |
| 220 | `tests/runtime/json-first-hide-sponsored-cards-boundary-current-behavior.test.mjs` | 5 | `yes` | JSON-first hideSponsoredCards boundary audit is audit-only and source pinned |
| 221 | `tests/runtime/json-first-hide-subscriptions-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first hideSubscriptions boundary audit is audit-only and source pinned |
| 222 | `tests/runtime/json-first-hide-top-header-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first hideTopHeader boundary audit is audit-only and source pinned |
| 223 | `tests/runtime/json-first-hide-video-buttons-bar-boundary-current-behavior.test.mjs` | 7 | `yes` | JSON-first hideVideoButtonsBar boundary audit is audit-only and source pinned |
| 224 | `tests/runtime/json-first-hide-video-channel-row-boundary-current-behavior.test.mjs` | 7 | `yes` | JSON-first hideVideoChannelRow boundary audit is audit-only and source pinned |
| 225 | `tests/runtime/json-first-hide-video-description-boundary-current-behavior.test.mjs` | 7 | `yes` | JSON-first hideVideoDescription boundary audit is audit-only and source pinned |
| 226 | `tests/runtime/json-first-hide-video-info-boundary-current-behavior.test.mjs` | 7 | `yes` | JSON-first hideVideoInfo boundary audit is audit-only and source pinned |
| 227 | `tests/runtime/json-first-hide-video-sidebar-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first hideVideoSidebar boundary audit is audit-only and source pinned |
| 228 | `tests/runtime/json-first-hide-watch-playlist-panel-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first hideWatchPlaylistPanel boundary audit is audit-only and source pinned |
| 229 | `tests/runtime/json-first-implementation-authority-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first implementation authority boundary is audit-only and source-backed |
| 230 | `tests/runtime/json-first-implementation-locus-register-current-behavior.test.mjs` | 5 | `yes` | JSON-first implementation locus register is audit-only and source pinned |
| 231 | `tests/runtime/json-first-keyword-match-boundary-current-behavior.test.mjs` | 9 | `yes` | JSON-first keyword match boundary audit is audit-only and source pinned |
| 232 | `tests/runtime/json-first-list-mode-matrix-boundary-current-behavior.test.mjs` | 9 | `yes` | JSON-first list-mode matrix audit is audit-only and source pinned |
| 233 | `tests/runtime/json-first-metric-artifact-gate-current-behavior.test.mjs` | 5 | `yes` | JSON-first metric artifact gate is audit-only and fingerprint pinned |
| 234 | `tests/runtime/json-first-network-snapshot-clone-isolation-current-behavior.test.mjs` | 8 | `yes` | JSON-first network snapshot clone isolation audit is audit-only and source pinned |
| 235 | `tests/runtime/json-first-network-snapshot-consumer-application-current-behavior.test.mjs` | 8 | `yes` | JSON-first network snapshot consumer application audit is audit-only and source pinned |
| 236 | `tests/runtime/json-first-network-snapshot-consumer-card-video-id-evidence-current-behavior.test.mjs` | 9 | `yes` | JSON-first network snapshot consumer card video-id evidence audit is audit-only and source pinned |
| 237 | `tests/runtime/json-first-network-snapshot-consumer-effect-boundary-current-behavior.test.mjs` | 5 | `yes` | JSON-first network snapshot consumer effect boundary audit is audit-only and source pinned |
| 238 | `tests/runtime/json-first-network-snapshot-consumer-freshness-current-behavior.test.mjs` | 8 | `yes` | JSON-first network snapshot consumer freshness audit is audit-only and source pinned |
| 239 | `tests/runtime/json-first-network-snapshot-consumer-permission-current-behavior.test.mjs` | 8 | `yes` | JSON-first network snapshot consumer permission audit is audit-only and source pinned |
| 240 | `tests/runtime/json-first-network-snapshot-consumer-request-transport-current-behavior.test.mjs` | 7 | `yes` | JSON-first network snapshot consumer request transport audit is audit-only and source pinned |
| 241 | `tests/runtime/json-first-network-snapshot-consumer-source-precedence-current-behavior.test.mjs` | 8 | `yes` | JSON-first network snapshot consumer source precedence audit is audit-only and source pinned |
| 242 | `tests/runtime/json-first-network-snapshot-consumer-stale-cache-cleanup-current-behavior.test.mjs` | 10 | `yes` | JSON-first network snapshot consumer stale-cache cleanup audit is audit-only and source pinned |
| 243 | `tests/runtime/json-first-network-snapshot-consumer-stale-marker-matrix-current-behavior.test.mjs` | 8 | `yes` | JSON-first network snapshot consumer stale-marker matrix audit is audit-only and source pinned |
| 244 | `tests/runtime/json-first-network-snapshot-consumer-traversal-budget-current-behavior.test.mjs` | 8 | `yes` | JSON-first network snapshot consumer traversal budget audit is audit-only and source pinned |
| 245 | `tests/runtime/json-first-network-snapshot-endpoint-admission-current-behavior.test.mjs` | 8 | `yes` | JSON-first network snapshot endpoint admission audit is audit-only and source pinned |
| 246 | `tests/runtime/json-first-network-snapshot-permission-boundary-current-behavior.test.mjs` | 8 | `yes` | JSON-first network snapshot permission boundary audit is audit-only and source pinned |
| 247 | `tests/runtime/json-first-network-snapshot-source-precedence-current-behavior.test.mjs` | 7 | `yes` | JSON-first network snapshot source precedence audit is audit-only and source pinned |
| 248 | `tests/runtime/json-first-network-snapshot-stash-contract-current-behavior.test.mjs` | 7 | `yes` | JSON-first network snapshot stash contract is audit-only and source pinned |
| 249 | `tests/runtime/json-first-no-work-optimization-crosswalk-current-behavior.test.mjs` | 6 | `yes` | JSON-first no-work optimization crosswalk is audit-only and source-pinned |
| 250 | `tests/runtime/json-first-pending-queue-replay-contract-current-behavior.test.mjs` | 7 | `yes` | JSON-first pending queue replay contract is audit-only and source pinned |
| 251 | `tests/runtime/json-first-reference-doc-surface-current-behavior.test.mjs` | 7 | `yes` | JSON-first reference doc surface is audit-only and fingerprint pinned |
| 252 | `tests/runtime/json-first-renderer-traversal-mutation-boundary-current-behavior.test.mjs` | 8 | `yes` | JSON-first renderer traversal mutation boundary audit is audit-only and source pinned |
| 253 | `tests/runtime/json-first-response-mutation-contract-current-behavior.test.mjs` | 5 | `yes` | JSON-first response mutation contract is audit-only and source pinned |
| 254 | `tests/runtime/json-first-route-surface-fixture-approval-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface fixture approval boundary is audit-only and source-backed |
| 255 | `tests/runtime/json-first-route-surface-fixture-artifact-commit-readiness-gate-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface fixture artifact commit readiness gate is audit-only and source-backed |
| 256 | `tests/runtime/json-first-route-surface-fixture-artifact-contract-coverage-gate-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface fixture artifact contract coverage gate is audit-only and source-backed |
| 257 | `tests/runtime/json-first-route-surface-fixture-artifact-path-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface fixture artifact path boundary is audit-only and source-backed |
| 258 | `tests/runtime/json-first-route-surface-fixture-manifest-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface fixture manifest contract is audit-only and source-backed |
| 259 | `tests/runtime/json-first-route-surface-fixture-packet-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface fixture packet contract is audit-only and source-backed |
| 260 | `tests/runtime/json-first-route-surface-fixture-parity-report-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface fixture parity report contract is audit-only and source-backed |
| 261 | `tests/runtime/json-first-route-surface-fixture-provenance-artifact-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface fixture provenance artifact contract is audit-only and source-backed |
| 262 | `tests/runtime/json-first-route-surface-fixture-sample-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface fixture sample contract is audit-only and source-backed |
| 263 | `tests/runtime/json-first-route-surface-fixture-verification-output-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface fixture verification output contract is audit-only and source-backed |
| 264 | `tests/runtime/json-first-route-surface-implementation-authority-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface implementation authority boundary is audit-only and source-backed |
| 265 | `tests/runtime/json-first-route-surface-metric-artifact-approval-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface metric artifact approval boundary is audit-only and source-backed |
| 266 | `tests/runtime/json-first-route-surface-metric-artifact-commit-readiness-gate-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface metric artifact commit readiness gate is audit-only and source-backed |
| 267 | `tests/runtime/json-first-route-surface-metric-artifact-contract-coverage-gate-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface metric artifact contract coverage gate is audit-only and source-backed |
| 268 | `tests/runtime/json-first-route-surface-metric-artifact-path-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface metric artifact path boundary is audit-only and source-backed |
| 269 | `tests/runtime/json-first-route-surface-metric-fixture-provenance-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface metric fixture provenance contract is audit-only and source-backed |
| 270 | `tests/runtime/json-first-route-surface-metric-no-work-budget-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface metric no-work budget contract is audit-only and source-backed |
| 271 | `tests/runtime/json-first-route-surface-metric-sample-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface metric sample contract is audit-only and source-backed |
| 272 | `tests/runtime/json-first-route-surface-metric-side-effect-budget-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface metric side-effect budget contract is audit-only and source-backed |
| 273 | `tests/runtime/json-first-route-surface-metric-verification-output-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first route/surface metric verification output contract is audit-only and source-backed |
| 274 | `tests/runtime/json-first-uppercase-title-boundary-current-behavior.test.mjs` | 9 | `yes` | JSON-first uppercase title boundary audit is audit-only and source pinned |
| 275 | `tests/runtime/json-first-url-normalization-contract-current-behavior.test.mjs` | 6 | `yes` | JSON-first URL normalization contract is audit-only and source pinned |
| 276 | `tests/runtime/json-first-video-meta-background-storage-current-behavior.test.mjs` | 8 | `yes` | JSON-first video meta background storage audit is audit-only and source pinned |
| 277 | `tests/runtime/json-first-video-meta-category-parity-current-behavior.test.mjs` | 7 | `yes` | JSON-first video meta category parity audit is audit-only and source pinned |
| 278 | `tests/runtime/json-first-video-meta-content-parity-current-behavior.test.mjs` | 8 | `yes` | JSON-first video meta content parity audit is audit-only and source pinned |
| 279 | `tests/runtime/json-first-video-meta-dom-rerun-current-behavior.test.mjs` | 8 | `yes` | JSON-first video meta DOM rerun audit is audit-only and source pinned |
| 280 | `tests/runtime/json-first-video-meta-fetch-policy-current-behavior.test.mjs` | 7 | `yes` | JSON-first video meta fetch policy audit is audit-only and source pinned |
| 281 | `tests/runtime/json-first-video-meta-freshness-eviction-boundary-current-behavior.test.mjs` | 8 | `yes` | JSON-first video meta freshness eviction audit is audit-only and source pinned |
| 282 | `tests/runtime/json-first-video-meta-merge-schema-boundary-current-behavior.test.mjs` | 8 | `yes` | JSON-first video meta merge schema audit is audit-only and source pinned |
| 283 | `tests/runtime/json-first-video-meta-no-work-budget-current-behavior.test.mjs` | 7 | `yes` | JSON-first video meta no-work budget audit is audit-only and source pinned |
| 284 | `tests/runtime/json-first-video-meta-profile-surface-boundary-current-behavior.test.mjs` | 8 | `yes` | JSON-first video meta profile/surface boundary audit is audit-only and source pinned |
| 285 | `tests/runtime/json-first-video-meta-revision-boundary-current-behavior.test.mjs` | 6 | `yes` | JSON-first video meta revision boundary audit is audit-only and source pinned |
| 286 | `tests/runtime/json-first-whitelist-decision-identity-boundary-current-behavior.test.mjs` | 9 | `yes` | JSON-first whitelist decision identity audit is audit-only and source pinned |
| 287 | `tests/runtime/json-first-xhr-response-override-contract-current-behavior.test.mjs` | 7 | `yes` | JSON-first XHR response override contract is audit-only and source pinned |
| 288 | `tests/runtime/json-path-authority-current-behavior.test.mjs` | 13 | `yes` | JSON path authority audit documents discovery/runtime split and blocked verdict |
| 289 | `tests/runtime/json-runtime-coverage-gap-current-behavior.test.mjs` | 12 | `yes` | json runtime coverage gap register is audit-only and defines coverage classes |
| 290 | `tests/runtime/json-section-coverage-index-current-behavior.test.mjs` | 7 | `yes` | json section coverage index is audit-only and defines current coverage classes |
| 291 | `tests/runtime/keyword-comments-scope-migration-boundary-current-behavior.test.mjs` | 9 | `yes` | keyword-comments scope migration audit is audit-only and source pinned |
| 292 | `tests/runtime/keyword-match-authority-current-behavior.test.mjs` | 9 | `yes` | keyword match authority audit documents matcher drift and future gates |
| 293 | `tests/runtime/kids-browse-malformed-fragment-boundary-current-behavior.test.mjs` | 7 | `yes` | Kids browse malformed fragment audit is audit-only and source pinned |
| 294 | `tests/runtime/kids-comments-filter-all-boundary-current-behavior.test.mjs` | 9 | `yes` | Kids comments Filter All audit is audit-only and source pinned |
| 295 | `tests/runtime/kids-latest-json-owner-extension-fixture-boundary-current-behavior.test.mjs` | 8 | `yes` | Kids latest JSON owner extension fixture audit is audit-only and source pinned |
| 296 | `tests/runtime/learned-identity-authority-current-behavior.test.mjs` | 11 | `yes` | learned identity authority audit documents map stores flow and future contract |
| 297 | `tests/runtime/learned-identity-map-cache-persistence-boundary-current-behavior.test.mjs` | 11 | `yes` | learned identity map cache persistence audit document records current boundary and fixtures |
| 298 | `tests/runtime/learned-identity-map-write-entrypoint-current-behavior.test.mjs` | 8 | `yes` | learned identity map write entrypoint register is audit-only and names the control plane |
| 299 | `tests/runtime/legacy-layout-method-semantic-register-current-behavior.test.mjs` | 5 | `yes` | legacy layout register is audit-only and source scoped |
| 300 | `tests/runtime/legacy-layout-quarantine-package-boundary-current-behavior.test.mjs` | 4 | `yes` | legacy layout quarantine package boundary is audit-only and source scoped |
| 301 | `tests/runtime/lifecycle-effect-budget-current-behavior.test.mjs` | 11 | `yes` | lifecycle effect budget doc is audit-only and separates source confidence from work permission |
| 302 | `tests/runtime/lifecycle-instance-register-current-behavior.test.mjs` | 11 | `yes` | lifecycle instance register documents source boundary and proof status |
| 303 | `tests/runtime/lifecycle-owner-matrix-current-behavior.test.mjs` | 6 | `yes` | lifecycle owner matrix defines the future owner contract and all owner families |
| 304 | `tests/runtime/lifecycle-source-current-behavior.test.mjs` | 5 | `yes` | page-resident lifecycle primitive counts are pinned for current behavior |
| 305 | `tests/runtime/lifecycle-teardown-decision-register-current-behavior.test.mjs` | 6 | `yes` | lifecycle teardown decision register is audit-only and keeps runtime behavior unchanged |
| 306 | `tests/runtime/list-mode-transition-persistence-boundary-current-behavior.test.mjs` | 9 | `yes` | list-mode transition persistence audit document records current boundary and fixtures |
| 307 | `tests/runtime/live-chat-dom-cleanup-boundary-current-behavior.test.mjs` | 6 | `yes` | live chat DOM cleanup boundary audit is audit-only and source pinned |
| 308 | `tests/runtime/main-collab-resolved-search-card-dialog-current-behavior.test.mjs` | 6 | `yes` | Main collab resolved search-card audit doc and fixture provenance are pinned |
| 309 | `tests/runtime/main-compact-radio-playlist-id-authority-boundary-current-behavior.test.mjs` | 6 | `yes` | Main compact radio playlist id authority doc and fixture provenance are pinned |
| 310 | `tests/runtime/main-filter-all-comments-scope-current-behavior.test.mjs` | 10 | `yes` | main Filter All comments scope audit is audit-only and source pinned |
| 311 | `tests/runtime/main-guide-endpoint-no-work-boundary-current-behavior.test.mjs` | 10 | `yes` | Main guide endpoint no-work boundary doc and fixture provenance are pinned |
| 312 | `tests/runtime/main-home-rich-grid-mix-video-current-behavior.test.mjs` | 8 | `yes` | Main home rich-grid Mix/video audit doc and fixture provenance are pinned |
| 313 | `tests/runtime/main-next-reload-modern-comments-current-behavior.test.mjs` | 7 | `yes` | main next reload modern comments doc and fixture provenance are pinned |
| 314 | `tests/runtime/main-post-community-dom-insertion-fixture-gap-current-behavior.test.mjs` | 6 | `yes` | Main post community DOM insertion fixture-gap doc is audit-only and source-backed |
| 315 | `tests/runtime/main-profile-blocklist-keyword-alias-current-behavior.test.mjs` | 3 | `yes` | background compiles main blocklist keywords from the visible StateManager field before the alias field |
| 316 | `tests/runtime/main-search-compact-channel-current-behavior.test.mjs` | 7 | `yes` | main search compact channel audit doc records fixture and current verdicts |
| 317 | `tests/runtime/main-search-direct-watch-card-subrenderer-current-behavior.test.mjs` | 8 | `yes` | main search direct watch-card subrenderer audit doc records fixture and current verdicts |
| 318 | `tests/runtime/main-search-refinement-card-current-behavior.test.mjs` | 8 | `yes` | Main search refinement card audit doc and fixture provenance are pinned |
| 319 | `tests/runtime/main-search-universal-watch-card-current-behavior.test.mjs` | 6 | `yes` | main search universal watch-card audit doc records fixture and current verdicts |
| 320 | `tests/runtime/main-upnext-feed-watchpage-lockup-continuation-current-behavior.test.mjs` | 7 | `yes` | watchpage lockup continuation audit doc and fixture provenance are pinned |
| 321 | `tests/runtime/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation-current-behavior.test.mjs` | 8 | `yes` | claim-prefaced watchpage2 continuation audit doc and fixture provenance are pinned |
| 322 | `tests/runtime/main-upnext-feed-watchpage3-autoplay-previous-end-screen-current-behavior.test.mjs` | 13 | `yes` | watchpage3 audit doc and reduced fixture provenance are pinned |
| 323 | `tests/runtime/main-watch-autoplay-video-endpoint-current-behavior.test.mjs` | 11 | `yes` | main watch autoplay endpoint audit doc and fixture provenance are pinned |
| 324 | `tests/runtime/main-watch-get-watch-playlist-end-screen-current-behavior.test.mjs` | 9 | `yes` | main watch get-watch audit doc and fixture provenance are pinned |
| 325 | `tests/runtime/main-watch-html-embedded-playlist-endscreen-json-current-behavior.test.mjs` | 8 | `yes` | YT_MAIN_WATCH embedded JSON audit doc and fixture provenance are pinned |
| 326 | `tests/runtime/main-watch-html-endscreen-shape-classification-current-behavior.test.mjs` | 5 | `yes` | raw YT_MAIN_WATCH.html metadata and token counts are pinned |
| 327 | `tests/runtime/main-watch-initial-lockup-shorts-json-current-behavior.test.mjs` | 9 | `yes` | YT_MAIN initial watch JSON audit doc and fixture provenance are pinned |
| 328 | `tests/runtime/main-watch-initial-shorts-owner-absent-boundary-current-behavior.test.mjs` | 6 | `yes` | Main watch initial Shorts owner-absent audit doc and fixture provenance are pinned |
| 329 | `tests/runtime/main-watch-player-fragment-metadata-current-behavior.test.mjs` | 8 | `yes` | YT_MAIN player fragment audit doc and fixture provenance are pinned |
| 330 | `tests/runtime/main-watch-tmp-playlist-collab-dialog-current-behavior.test.mjs` | 10 | `yes` | tmp playlist collaborator audit doc and fixture provenance are pinned |
| 331 | `tests/runtime/manifest-permission-authority-current-behavior.test.mjs` | 9 | `yes` | manifest permission audit documents browser package authority and future gates |
| 332 | `tests/runtime/manifest-permission-feature-map-boundary-current-behavior.test.mjs` | 8 | `yes` | manifest permission feature-map doc is audit-only and fingerprints are pinned |
| 333 | `tests/runtime/media-asset-duplicate-derivative-boundary-current-behavior.test.mjs` | 5 | `yes` | media asset duplicate derivative boundary doc is audit-only and source pinned |
| 334 | `tests/runtime/members-only-dom-cleanup-boundary-current-behavior.test.mjs` | 6 | `yes` | members-only DOM cleanup boundary audit is audit-only and source pinned |
| 335 | `tests/runtime/menu-observer-kids-passive-lifecycle-boundary-current-behavior.test.mjs` | 9 | `yes` | menu observer Kids passive lifecycle audit is audit-only and source pinned |
| 336 | `tests/runtime/message-sender-class-matrix-current-behavior.test.mjs` | 7 | `yes` | message sender class matrix documents the ignored capture corpus as evidence only |
| 337 | `tests/runtime/message-side-effect-register-current-behavior.test.mjs` | 8 | `yes` | message side-effect register defines every current side-effect class |
| 338 | `tests/runtime/message-transport-callsite-register-current-behavior.test.mjs` | 4 | `yes` | message transport callsite register is audit-only and source pinned |
| 339 | `tests/runtime/message-trust-hardening-gap-current-behavior.test.mjs` | 7 | `yes` | message trust hardening gap defines sender classes and negative fixture gates |
| 340 | `tests/runtime/method-semantic-audit-register-current-behavior.test.mjs` | 41 | `yes` | method semantic audit register is audit-only and does not certify lexical counts as behavior proof |
| 341 | `tests/runtime/mode-surface-effect-matrix-current-behavior.test.mjs` | 10 | `yes` | mode surface effect matrix doc treats waterfall as source priority not effect permission |
| 342 | `tests/runtime/nanah-sync-adapter-method-semantic-register-current-behavior.test.mjs` | 8 | `yes` | Nanah sync adapter method semantic register is audit-only and scoped to current behavior |
| 343 | `tests/runtime/nanah-vendor-build-method-semantic-register-current-behavior.test.mjs` | 5 | `yes` | Nanah vendor build register is audit-only and source scoped |
| 344 | `tests/runtime/nanah-vendor-runtime-session-lifecycle-boundary-current-behavior.test.mjs` | 5 | `yes` | Nanah vendor runtime session lifecycle doc is audit-only and source pinned |
| 345 | `tests/runtime/native-dropdown-close-state-current-behavior.test.mjs` | 3 | `yes` | forceCloseDropdown closes reusable desktop native dropdowns without poisoning inline display state |
| 346 | `tests/runtime/native-overlay-fullscreen-quiet-mode-boundary-current-behavior.test.mjs` | 7 | `yes` | native overlay/fullscreen quiet mode audit is audit-only and source pinned |
| 347 | `tests/runtime/native-runtime-sync-authority-current-behavior.test.mjs` | 10 | `yes` | native runtime sync audit documents sync model and future gate |
| 348 | `tests/runtime/native-runtime-sync-manifest-freshness-boundary-current-behavior.test.mjs` | 5 | `yes` | native runtime sync manifest freshness doc is audit-only and fingerprint pinned |
| 349 | `tests/runtime/native-runtime-sync-method-semantic-register-current-behavior.test.mjs` | 5 | `yes` | native runtime sync method register is audit-only and source scoped |
| 350 | `tests/runtime/navigation-header-search-dom-cleanup-boundary-current-behavior.test.mjs` | 6 | `yes` | navigation/header/search DOM cleanup boundary audit is audit-only and source pinned |
| 351 | `tests/runtime/network-authority-current-behavior.test.mjs` | 8 | `yes` | network authority audit documents primitive counts families and future gate |
| 352 | `tests/runtime/network-credential-policy-matrix-current-behavior.test.mjs` | 5 | `yes` | network credential policy matrix is audit-only and source pinned |
| 353 | `tests/runtime/network-fetch-reason-matrix-current-behavior.test.mjs` | 9 | `yes` | network fetch reason matrix is audit-only and separates source order from fetch reason |
| 354 | `tests/runtime/network-fetch-xhr-callsite-register-current-behavior.test.mjs` | 4 | `yes` | network fetch/xhr callsite register is audit-only and source pinned |
| 355 | `tests/runtime/notification-renderer-source-only-boundary-current-behavior.test.mjs` | 6 | `yes` | notification renderer source-only boundary doc is audit-only and source-backed |
| 356 | `tests/runtime/objective-coverage-ledger-current-behavior.test.mjs` | 289 | `yes` | objective coverage ledger explicitly refuses to declare audit completion |
| 357 | `tests/runtime/open-app-cleanup-boundary-current-behavior.test.mjs` | 6 | `yes` | open-app cleanup boundary audit is audit-only and source pinned |
| 358 | `tests/runtime/optimization-candidate-priority-register-current-behavior.test.mjs` | 6 | `yes` | optimization candidate priority register is audit-only and keeps runtime unchanged |
| 359 | `tests/runtime/optimization-stop-go-decision-record-current-behavior.test.mjs` | 7 | `yes` | optimization stop go decision record is audit-only and answers the current implementation question |
| 360 | `tests/runtime/p0-backup-export-current-behavior.test.mjs` | 13 | `yes` | P0 backup export current-behavior doc lists all twelve readiness fixtures |
| 361 | `tests/runtime/p0-capture-fixture-traceability-current-behavior.test.mjs` | 14 | `yes` | P0 capture fixture traceability doc lists all current-behavior fixtures and blocked verdict |
| 362 | `tests/runtime/p0-compiled-rule-state-current-behavior.test.mjs` | 9 | `yes` | compiled rule state audit documents blocked verdict and fixture surface |
| 363 | `tests/runtime/p0-content-category-current-behavior.test.mjs` | 11 | `yes` | P0 content/category audit documents fixture family and blocked verdict |
| 364 | `tests/runtime/p0-dom-renderer-current-behavior.test.mjs` | 12 | `yes` | dom_renderer_contract_documents_current_behavior_and_future_gate |
| 365 | `tests/runtime/p0-endpoint-policy-current-behavior.test.mjs` | 6 | `yes` | P0 endpoint policy audit documents current behavior and future endpoint contract |
| 366 | `tests/runtime/p0-external-navigation-current-behavior.test.mjs` | 11 | `yes` | P0 external navigation audit documents fixture family and blocked verdict |
| 367 | `tests/runtime/p0-family-proof-coverage-current-behavior.test.mjs` | 5 | `yes` | P0 family proof coverage documents all readiness-gate families without opening the gate |
| 368 | `tests/runtime/p0-fixture-gate-register-current-behavior.test.mjs` | 6 | `yes` | P0 fixture gate register documents counted backlog and non-completion |
| 369 | `tests/runtime/p0-hide-restore-current-behavior.test.mjs` | 13 | `yes` | P0 hide/restore audit documents fixture family and current blocked verdict |
| 370 | `tests/runtime/p0-keyword-match-current-behavior.test.mjs` | 11 | `yes` | P0 keyword match audit documents fixture family and current blocked verdict |
| 371 | `tests/runtime/p0-learned-identity-current-behavior.test.mjs` | 14 | `yes` | P0 learned identity doc lists all current-behavior fixtures and blocked verdict |
| 372 | `tests/runtime/p0-lifecycle-current-behavior.test.mjs` | 9 | `yes` | P0 lifecycle audit documents current behavior and future lifecycle contract |
| 373 | `tests/runtime/p0-manifest-permission-current-behavior.test.mjs` | 8 | `yes` | P0 manifest permission doc lists fixture family and blocked verdict |
| 374 | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | 9 | `yes` | P0 message mutation audit documents fixture families and current non-green verdict |
| 375 | `tests/runtime/p0-mutation-current-behavior.test.mjs` | 7 | `yes` | P0 mutation audit documents fixture family and current non-green verdict |
| 376 | `tests/runtime/p0-native-runtime-sync-current-behavior.test.mjs` | 10 | `yes` | P0 native runtime sync audit documents blocked verdict and all named gates |
| 377 | `tests/runtime/p0-network-authority-current-behavior.test.mjs` | 13 | `yes` | P0 network audit documents current behavior and future network contract |
| 378 | `tests/runtime/p0-no-work-current-behavior.test.mjs` | 5 | `yes` | P0 no-work audit documents current behavior and future counter contract |
| 379 | `tests/runtime/p0-obligation-index-current-behavior.test.mjs` | 4 | `yes` | P0 obligation index is audit-only and expands the readiness gate into per-obligation rows |
| 380 | `tests/runtime/p0-obligation-status-ledger-current-behavior.test.mjs` | 6 | `yes` | P0 obligation status ledger is audit-only and keeps future proof separate from current proof |
| 381 | `tests/runtime/p0-optimization-metric-work-decision-authority-current-behavior.test.mjs` | 6 | `yes` | P0 optimization metric work decision authority slice is audit-only |
| 382 | `tests/runtime/p0-optimization-route-surface-metric-fixture-matrix-current-behavior.test.mjs` | 6 | `yes` | P0 route surface metric fixture matrix is audit-only and source-backed |
| 383 | `tests/runtime/p0-profile-viewing-space-current-behavior.test.mjs` | 11 | `yes` | P0 profile viewing-space doc lists all ten readiness fixtures |
| 384 | `tests/runtime/p0-prompt-onboarding-current-behavior.test.mjs` | 9 | `yes` | P0 prompt onboarding doc lists fixture family and blocked verdict |
| 385 | `tests/runtime/p0-release-package-current-behavior.test.mjs` | 11 | `yes` | P0 release package audit documents blocked verdict and all named gates |
| 386 | `tests/runtime/p0-renderer-authority-current-behavior.test.mjs` | 9 | `yes` | P0 renderer authority audit documents fixture families and blocked verdict |
| 387 | `tests/runtime/p0-rule-mutation-current-behavior.test.mjs` | 12 | `yes` | P0 rule mutation doc lists all readiness fixtures and blocked verdict |
| 388 | `tests/runtime/p0-security-pin-lock-current-behavior.test.mjs` | 9 | `yes` | P0 security PIN lock doc lists all eight readiness fixtures |
| 389 | `tests/runtime/p0-selector-authority-current-behavior.test.mjs` | 13 | `yes` | P0 selector authority audit documents fixture family and current blocked verdict |
| 390 | `tests/runtime/p0-settings-mutation-current-behavior.test.mjs` | 10 | `yes` | P0 settings mutation audit documents fixture families and current blocked verdict |
| 391 | `tests/runtime/p0-stats-time-saved-current-behavior.test.mjs` | 11 | `yes` | P0 stats current-behavior doc lists all ten readiness fixtures |
| 392 | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | 11 | `yes` | P0 storage/cache audit documents fixture family and current blocked verdict |
| 393 | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | 12 | `yes` | P0 watch/player audit documents fixture family and current blocked verdict |
| 394 | `tests/runtime/package-lock-script-optional-dependency-boundary-current-behavior.test.mjs` | 6 | `yes` | package lock script optional dependency boundary doc is audit-only |
| 395 | `tests/runtime/page-global-patch-authority-current-behavior.test.mjs` | 6 | `yes` | page-global patch authority audit documents current behavior and future contract |
| 396 | `tests/runtime/page-message-trust-current-behavior.test.mjs` | 5 | `yes` | page-message trust audit documents current receivers and state-changing messages |
| 397 | `tests/runtime/page-runtime-lifecycle-authority-current-behavior.test.mjs` | 9 | `yes` | page runtime lifecycle authority audit documents the current owner families and future rule |
| 398 | `tests/runtime/page-runtime-owner-effect-matrix-current-behavior.test.mjs` | 8 | `yes` | page runtime owner/effect matrix is audit-only and separates data source from side-effect permission |
| 399 | `tests/runtime/performance-claim-evidence-boundary-current-behavior.test.mjs` | 5 | `yes` | performance claim evidence boundary is audit-only and defines the metric gate |
| 400 | `tests/runtime/player-endscreen-dom-cleanup-boundary-current-behavior.test.mjs` | 6 | `yes` | player/end-screen DOM cleanup boundary audit is audit-only and source pinned |
| 401 | `tests/runtime/playlist-json-player-metadata-boundary-current-behavior.test.mjs` | 8 | `yes` | playlist.json player metadata boundary doc and fixture provenance are pinned |
| 402 | `tests/runtime/playlist-mix-dom-cleanup-boundary-current-behavior.test.mjs` | 7 | `yes` | playlist/Mix DOM cleanup boundary audit is audit-only and source pinned |
| 403 | `tests/runtime/playlist-panel-header-mix-creator-current-behavior.test.mjs` | 6 | `yes` | raw playlist.html header evidence is pinned and lacks canonical creator identity |
| 404 | `tests/runtime/playlist-player-endscreen-dom-classification-current-behavior.test.mjs` | 5 | `yes` | raw playlist.html player end-screen DOM metadata and selector counts are pinned |
| 405 | `tests/runtime/popup-lifecycle-selector-boundary-current-behavior.test.mjs` | 6 | `yes` | popup lifecycle selector boundary audit is audit-only and source pinned |
| 406 | `tests/runtime/popup-method-semantic-register-current-behavior.test.mjs` | 12 | `yes` | popup method semantic register is audit-only and scoped to current behavior |
| 407 | `tests/runtime/profile-management-persistence-boundary-current-behavior.test.mjs` | 11 | `yes` | profile management persistence audit document records current boundary and fixtures |
| 408 | `tests/runtime/profile-viewing-space-authority-current-behavior.test.mjs` | 8 | `yes` | profile viewing-space audit documents UI policy and runtime authority gap |
| 409 | `tests/runtime/prompt-onboarding-authority-current-behavior.test.mjs` | 7 | `yes` | prompt onboarding audit documents overlay owners risks and future gates |
| 410 | `tests/runtime/prompt-onboarding-method-semantic-register-current-behavior.test.mjs` | 7 | `yes` | prompt onboarding method semantic register is audit-only and source scoped |
| 411 | `tests/runtime/prompt-release-overlay-boundary-current-behavior.test.mjs` | 6 | `yes` | prompt release overlay boundary is audit-only and source pinned |
| 412 | `tests/runtime/public-release-claim-boundary-current-behavior.test.mjs` | 9 | `yes` | public release claim boundary audit documents blocked public-claim authority |
| 413 | `tests/runtime/public-release-surface-current-behavior.test.mjs` | 9 | `yes` | extension package and browser manifest versions currently match |
| 414 | `tests/runtime/quarantined-content-css-package-boundary-current-behavior.test.mjs` | 4 | `yes` | quarantined content CSS package boundary is audit-only and source scoped |
| 415 | `tests/runtime/quick-block-block-menu-affordance-boundary-current-behavior.test.mjs` | 7 | `yes` | quick-block/block-menu affordance audit is audit-only and source pinned |
| 416 | `tests/runtime/quick-block-default-migration-boundary-current-behavior.test.mjs` | 7 | `yes` | quick-block default migration audit is audit-only and source pinned |
| 417 | `tests/runtime/quick-block-hover-lifecycle-timer-boundary-current-behavior.test.mjs` | 11 | `yes` | quick-block lifecycle audit is audit-only and source pinned |
| 418 | `tests/runtime/raw-capture-extraction-obligation-index-current-behavior.test.mjs` | 5 | `yes` | raw capture extraction index covers every unique ignored capture path exactly once |
| 419 | `tests/runtime/raw-capture-release-boundary-current-behavior.test.mjs` | 7 | `yes` | raw capture release boundary audit documents evidence-only status and blocked verdict |
| 420 | `tests/runtime/recommended-dom-cleanup-boundary-current-behavior.test.mjs` | 6 | `yes` | recommended DOM cleanup boundary audit is audit-only and source pinned |
| 421 | `tests/runtime/reference-doc-claim-drift-current-behavior.test.mjs` | 8 | `yes` | reference_doc_claim_drift_register_documents_current_scope |
| 422 | `tests/runtime/release-audit-proof-directory-boundary-current-behavior.test.mjs` | 3 | `yes` | release audit proof directory boundary is documented and lane-owned |
| 423 | `tests/runtime/release-build-artifact-claim-boundary-current-behavior.test.mjs` | 5 | `yes` | release build artifact claim boundary is audit-only and fingerprint pinned |
| 424 | `tests/runtime/release-live-youtube-spa-smoke-artifact-verifier-current-behavior.test.mjs` | 7 | `yes` | live smoke artifact verifier is wired into release and smoke lane proof |
| 425 | `tests/runtime/release-live-youtube-spa-smoke-boundary-current-behavior.test.mjs` | 5 | `yes` | release and smoke lanes keep the live YouTube SPA smoke boundary visible |
| 426 | `tests/runtime/release-notes-json-version-gate-boundary-current-behavior.test.mjs` | 5 | `yes` | release notes JSON version gate doc is audit-only and scoped to current behavior |
| 427 | `tests/runtime/release-package-parity-current-behavior.test.mjs` | 8 | `yes` | release package parity audit documents package roots and future gate |
| 428 | `tests/runtime/render-engine-method-semantic-register-current-behavior.test.mjs` | 11 | `yes` | render engine method semantic register is audit-only and scoped to current behavior |
| 429 | `tests/runtime/renderer-authority-gap-current-behavior.test.mjs` | 8 | `yes` | renderer and source coverage docs carry the method proof gap blocker |
| 430 | `tests/runtime/repo-lifecycle-primitive-coverage-current-behavior.test.mjs` | 6 | `yes` | repo lifecycle primitive coverage documents the tracked JS source boundary |
| 431 | `tests/runtime/right-rail-whitelist-observer-current-behavior.test.mjs` | 8 | `yes` | right-rail whitelist observer audit documents watch-route ambiguity and coalesced timer fix |
| 432 | `tests/runtime/root-evidence-source-taxonomy-current-behavior.test.mjs` | 6 | `yes` | root evidence source taxonomy doc records the mixed root-file boundary |
| 433 | `tests/runtime/root-package-metadata-script-surface-current-behavior.test.mjs` | 7 | `yes` | root package metadata script surface doc is audit-only and fingerprint pinned |
| 434 | `tests/runtime/root-planning-doc-boundary-current-behavior.test.mjs` | 6 | `yes` | root markdown files are explicitly split between public metadata and historical planning |
| 435 | `tests/runtime/route-identity-decision-index-current-behavior.test.mjs` | 7 | `yes` | route identity decision index is audit-only and defines decision classes |
| 436 | `tests/runtime/route-surface-effect-authority-current-behavior.test.mjs` | 10 | `yes` | route surface effect authority doc is audit-only and links information lifecycle and effects |
| 437 | `tests/runtime/rule-mutation-entrypoint-authority-current-behavior.test.mjs` | 9 | `yes` | rule mutation entrypoint audit documents every current writer family and evidence boundary |
| 438 | `tests/runtime/runtime-diagnostic-logging-policy-matrix-current-behavior.test.mjs` | 6 | `yes` | runtime diagnostic logging policy matrix is audit-only and source pinned |
| 439 | `tests/runtime/security-crypto-payload-boundary-current-behavior.test.mjs` | 9 | `yes` | security crypto payload doc records audit-only boundary |
| 440 | `tests/runtime/security-manager-method-semantic-register-current-behavior.test.mjs` | 7 | `yes` | security manager method semantic register is audit-only and scoped to current behavior |
| 441 | `tests/runtime/security-pin-lock-authority-current-behavior.test.mjs` | 10 | `yes` | security PIN lock audit documents current authority boundaries and required future contract |
| 442 | `tests/runtime/seed-fetch-no-work-list-mode-boundary-current-behavior.test.mjs` | 11 | `yes` | seed fetch no-work/list-mode audit is audit-only and source pinned |
| 443 | `tests/runtime/seed-initial-global-hook-current-behavior.test.mjs` | 9 | `yes` | seed initial global hook audit documents current behavior and future gate |
| 444 | `tests/runtime/seed-initial-global-no-work-list-mode-boundary-current-behavior.test.mjs` | 12 | `yes` | seed initial global no-work/list-mode audit is audit-only and source pinned |
| 445 | `tests/runtime/seed-method-semantic-register-current-behavior.test.mjs` | 8 | `yes` | seed method semantic register is audit-only and scoped to current behavior |
| 446 | `tests/runtime/seed-network-current-behavior.test.mjs` | 25 | `yes` | search fetch with empty blocklist passes through without parse harvest or processData |
| 447 | `tests/runtime/seed-page-global-patch-teardown-boundary-current-behavior.test.mjs` | 8 | `yes` | seed page-global patch teardown audit is audit-only and source pinned |
| 448 | `tests/runtime/seed-settings-replay-provenance-boundary-current-behavior.test.mjs` | 8 | `yes` | seed settings replay provenance audit is audit-only and source pinned |
| 449 | `tests/runtime/seed-xhr-no-work-list-mode-boundary-current-behavior.test.mjs` | 10 | `yes` | seed XHR no-work/list-mode audit is audit-only and source pinned |
| 450 | `tests/runtime/selector-authority-current-behavior.test.mjs` | 6 | `yes` | selector authority audit documents source counts evidence boundary and future gate |
| 451 | `tests/runtime/settings-authority-source-current-behavior.test.mjs` | 18 | `yes` | FilterTube_SetListMode currently reads copyBlocklist but does not use it to guard merge-and-clear |
| 452 | `tests/runtime/settings-mode-coverage-matrix-current-behavior.test.mjs` | 7 | `yes` | settings mode matrix explicitly refuses completion or behavior readiness |
| 453 | `tests/runtime/settings-mode-source-effect-current-behavior.test.mjs` | 9 | `yes` | settings mode source/effect doc is audit-only and connects source to allowed effect |
| 454 | `tests/runtime/settings-refresh-cross-context-consumer-boundary-current-behavior.test.mjs` | 5 | `yes` | settings refresh cross-context consumer doc records audit-only boundary and source files |
| 455 | `tests/runtime/settings-refresh-dirty-key-consumer-matrix-current-behavior.test.mjs` | 6 | `yes` | settings refresh dirty-key consumer matrix is audit-only and source-backed |
| 456 | `tests/runtime/settings-refresh-dirty-key-producer-consumer-join-matrix-current-behavior.test.mjs` | 7 | `yes` | settings refresh producer-consumer join matrix is audit-only and source-backed |
| 457 | `tests/runtime/settings-refresh-dirty-key-producer-matrix-current-behavior.test.mjs` | 7 | `yes` | settings refresh dirty-key producer matrix is audit-only and source-backed |
| 458 | `tests/runtime/settings-refresh-fanout-current-behavior.test.mjs` | 9 | `yes` | settings_refresh_doc_lists_fanout_entries |
| 459 | `tests/runtime/settings-refresh-key-parity-register-current-behavior.test.mjs` | 4 | `yes` | settings refresh key parity register is audit-only and source pinned |
| 460 | `tests/runtime/settings-refresh-optimization-candidate-binding-matrix-current-behavior.test.mjs` | 7 | `yes` | settings refresh optimization candidate binding matrix is audit-only and source-backed |
| 461 | `tests/runtime/settings-refresh-optimization-candidate-evidence-packet-contract-current-behavior.test.mjs` | 7 | `yes` | settings refresh candidate evidence packet contract is audit-only and source-backed |
| 462 | `tests/runtime/settings-refresh-optimization-readiness-boundary-current-behavior.test.mjs` | 8 | `yes` | settings refresh optimization readiness boundary is audit-only and source-backed |
| 463 | `tests/runtime/settings-shared-method-semantic-register-current-behavior.test.mjs` | 8 | `yes` | settings shared method semantic register is audit-only and scoped to current behavior |
| 464 | `tests/runtime/shared-identity-method-semantic-register-current-behavior.test.mjs` | 7 | `yes` | shared identity method semantic register is audit-only and scoped to current behavior |
| 465 | `tests/runtime/shared-post-renderer-source-only-boundary-current-behavior.test.mjs` | 6 | `yes` | shared post renderer doc is audit-only and source-backed |
| 466 | `tests/runtime/shorts-dom-cleanup-boundary-current-behavior.test.mjs` | 9 | `yes` | Shorts DOM cleanup boundary audit is audit-only and source pinned |
| 467 | `tests/runtime/shorts-reel-overlay-owner-authority-boundary-current-behavior.test.mjs` | 5 | `yes` | Shorts reel overlay owner audit doc and fixture provenance are pinned |
| 468 | `tests/runtime/single-channel-rule-mutation-persistence-boundary-current-behavior.test.mjs` | 11 | `yes` | single-channel rule mutation persistence audit document records current boundary and fixtures |
| 469 | `tests/runtime/source-boundary-current-behavior.test.mjs` | 4 | `yes` | source boundary audit documents tracked source, raw evidence, generated output, and audit artifacts |
| 470 | `tests/runtime/source-of-truth-claim-register-current-behavior.test.mjs` | 5 | `yes` | source of truth claim register is audit-only and keeps behavior unchanged |
| 471 | `tests/runtime/source-surface-current-behavior.test.mjs` | 11 | `yes` | all manifest-loaded scripts are classified in the source surface inventory |
| 472 | `tests/runtime/source-tier-effect-authority-current-behavior.test.mjs` | 8 | `yes` | source_tier_effect_authority_doc_is_audit_only_and_rejects_waterfall_as_effect_permission |
| 473 | `tests/runtime/sponsored-cards-dom-cleanup-boundary-current-behavior.test.mjs` | 6 | `yes` | sponsored-card DOM cleanup boundary audit is audit-only and source pinned |
| 474 | `tests/runtime/stabilization-fix-order-current-behavior.test.mjs` | 14 | `yes` | stabilization fix order is explicitly audit-only and keeps the implementation gate closed |
| 475 | `tests/runtime/stale-alias-false-hide-chain-current-behavior.test.mjs` | 7 | `yes` | stale alias false-hide chain doc is audit-only and names the exact authority split |
| 476 | `tests/runtime/startup-injection-readiness-current-behavior.test.mjs` | 8 | `yes` | startup injection readiness audit documents current behavior and future authority gate |
| 477 | `tests/runtime/state-manager-method-semantic-register-current-behavior.test.mjs` | 9 | `yes` | state manager method semantic register is audit-only and scoped to current behavior |
| 478 | `tests/runtime/state-manager-request-refresh-fanout-boundary-current-behavior.test.mjs` | 5 | `yes` | StateManager request refresh fanout doc records audit-only boundary and source blocks |
| 479 | `tests/runtime/state-manager-storage-reload-enrichment-lifecycle-boundary-current-behavior.test.mjs` | 7 | `yes` | state manager storage reload enrichment doc records audit-only boundary |
| 480 | `tests/runtime/static-generated-vendor-current-behavior.test.mjs` | 5 | `yes` | static/generated/vendor audit accounts for every current surface family |
| 481 | `tests/runtime/static-html-support-script-surface-current-behavior.test.mjs` | 6 | `yes` | static html support script surface doc is audit-only and source pinned |
| 482 | `tests/runtime/stats-surface-legacy-metric-boundary-current-behavior.test.mjs` | 6 | `yes` | stats surface legacy metric boundary is audit-only and source pinned |
| 483 | `tests/runtime/stats-time-saved-authority-current-behavior.test.mjs` | 9 | `yes` | stats time-saved authority audit documents split metric writers and future gates |
| 484 | `tests/runtime/storage-access-callsite-register-current-behavior.test.mjs` | 4 | `yes` | storage access callsite register is audit-only and source pinned |
| 485 | `tests/runtime/storage-key-authority-current-behavior.test.mjs` | 6 | `yes` | storage key authority audit documents access counts split watch lists and future gate |
| 486 | `tests/runtime/storage-payload-quota-boundary-current-behavior.test.mjs` | 8 | `yes` | storage payload quota doc records audit-only boundary |
| 487 | `tests/runtime/storage-refresh-force-reprocess-coalescing-current-behavior.test.mjs` | 4 | `yes` | pending map-only storage refresh is upgraded when a keyword/profile change arrives before the timer fires |
| 488 | `tests/runtime/subagent-review-convergence-current-behavior.test.mjs` | 8 | `yes` | subagent convergence document is audit-only and keeps the full objective open |
| 489 | `tests/runtime/subscription-import-request-lifecycle-boundary-current-behavior.test.mjs` | 8 | `yes` | subscription import lifecycle audit is audit-only and source pinned |
| 490 | `tests/runtime/surface-information-availability-current-behavior.test.mjs` | 7 | `yes` | surface_information_availability_doc_is_audit_only_and_lists_all_high_risk_surfaces |
| 491 | `tests/runtime/synthetic-event-action-register-current-behavior.test.mjs` | 5 | `yes` | synthetic event/action register is audit-only and keeps runtime unchanged |
| 492 | `tests/runtime/tab-view-lifecycle-selector-boundary-current-behavior.test.mjs` | 6 | `yes` | tab-view lifecycle selector boundary audit is audit-only and source pinned |
| 493 | `tests/runtime/tab-view-method-semantic-register-current-behavior.test.mjs` | 12 | `yes` | tab-view method semantic register is audit-only and scoped to current behavior |
| 494 | `tests/runtime/test-lane-matrix-current-behavior.test.mjs` | 22 | `yes` | test lane matrix defines every required lane and npm script |
| 495 | `tests/runtime/tracked-file-audit-coverage-current-behavior.test.mjs` | 6 | `yes` | tracked-file audit coverage documents the current git ls-files source universe |
| 496 | `tests/runtime/tracked-file-obligation-index-current-behavior.test.mjs` | 208 | `yes` | tracked_file_obligation_index_is_audit_only_and_keeps_completion_open |
| 497 | `tests/runtime/tracked-public-doc-claim-surface-current-behavior.test.mjs` | 5 | `yes` | tracked public doc claim surface is audit-only and fingerprint pinned |
| 498 | `tests/runtime/ui-components-method-semantic-register-current-behavior.test.mjs` | 7 | `yes` | UI components method semantic register is audit-only and scoped to current behavior |
| 499 | `tests/runtime/ui-components-portal-lifecycle-boundary-current-behavior.test.mjs` | 6 | `yes` | ui components portal lifecycle doc records audit-only boundary |
| 500 | `tests/runtime/ui-row-list-mode-authority-current-behavior.test.mjs` | 12 | `yes` | UI row list-mode audit documents current row authority and future contract |
| 501 | `tests/runtime/ui-settings-callable-current-behavior.test.mjs` | 3 | `yes` | UI/settings callable audit accounts for every current UI settings source file |
| 502 | `tests/runtime/unified-mutation-contract-current-behavior.test.mjs` | 6 | `yes` | unified mutation contract audit documents required future fields and current split owners |
| 503 | `tests/runtime/video-info-dom-cleanup-boundary-current-behavior.test.mjs` | 6 | `yes` | video-info DOM cleanup boundary audit is audit-only and source pinned |
| 504 | `tests/runtime/video-sidebar-dom-cleanup-boundary-current-behavior.test.mjs` | 6 | `yes` | video sidebar DOM cleanup boundary audit is audit-only and source pinned |
| 505 | `tests/runtime/visible-empty-runtime-active-current-behavior.test.mjs` | 9 | `yes` | visible-empty runtime-active audit documents split visible and compiled rule authority |
| 506 | `tests/runtime/watch-endscreen-authority-current-behavior.test.mjs` | 5 | `yes` | watch end-screen audit documents supported JSON path and remaining DOM gaps |
| 507 | `tests/runtime/watch-player-control-authority-current-behavior.test.mjs` | 9 | `yes` | watch/player control audit documents split authority and future contract |
| 508 | `tests/runtime/watch-playlist-panel-dom-cleanup-boundary-current-behavior.test.mjs` | 6 | `yes` | watch playlist panel DOM cleanup boundary audit is audit-only and source pinned |
| 509 | `tests/runtime/watchpage-embedded-post-renderer-current-behavior.test.mjs` | 8 | `yes` | watchpage.json is a Markdown plus embedded ytInitialData container, not direct JSON |
| 510 | `tests/runtime/website-client-lifecycle-surface-current-behavior.test.mjs` | 6 | `yes` | website client lifecycle surface doc is audit-only and source pinned |
| 511 | `tests/runtime/website-dynamic-route-method-semantic-register-current-behavior.test.mjs` | 4 | `yes` | website dynamic route method semantic register is audit-only and source pinned |
| 512 | `tests/runtime/website-package-config-dependency-surface-current-behavior.test.mjs` | 6 | `yes` | website package config dependency surface doc is audit-only and fingerprint pinned |
| 513 | `tests/runtime/website-remote-request-privacy-performance-boundary-current-behavior.test.mjs` | 5 | `yes` | website remote request privacy performance boundary doc is audit-only |
| 514 | `tests/runtime/website-route-asset-surface-current-behavior.test.mjs` | 6 | `yes` | website route asset surface doc is audit-only and source pinned |
| 515 | `tests/runtime/website-route-build-smoke-artifact-boundary-current-behavior.test.mjs` | 4 | `yes` | website route build smoke artifact boundary is audit-only and source pinned |
| 516 | `tests/runtime/website-route-component-render-graph-current-behavior.test.mjs` | 7 | `yes` | website route component render graph doc is audit-only and source pinned |
| 517 | `tests/runtime/whitelist-cache-hot-path-boundary-current-behavior.test.mjs` | 5 | `yes` | whitelist cache hot-path boundary records narrow dedupe and source pins |
| 518 | `tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs` | 5 | `yes` | whitelist/cache SPA metric packet gate is audit-only and source-backed |
| 519 | `tests/runtime/whitelist-optimization-readiness-gap-matrix-current-behavior.test.mjs` | 6 | `yes` | whitelist optimization readiness gap matrix is audit-only and source-backed |
| 520 | `tests/runtime/whitelist-pending-intake-no-work-contract-current-behavior.test.mjs` | 6 | `yes` | whitelist pending intake no-work contract is audit-only and source-backed |
| 521 | `tests/runtime/xhr-comment-continuation-parity-boundary-current-behavior.test.mjs` | 9 | `yes` | XHR comment continuation parity slice is audit-only and source pinned |
| 522 | `tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs` | 6 | `yes` | XHR no-work boundary audit documents current behavior and future counters |
| 523 | `tests/runtime/youtube-music-surface-identity-boundary-current-behavior.test.mjs` | 7 | `yes` | YouTube Music surface identity boundary audit is audit-only and source pinned |
| 524 | `tests/runtime/ytm-browse-channel-list-item-current-behavior.test.mjs` | 8 | `yes` | YTM browse channel-list audit doc and fixture provenance are pinned |
| 525 | `tests/runtime/ytm-compact-playlist-creator-authority-boundary-current-behavior.test.mjs` | 9 | `yes` | YTM compact playlist creator authority doc and fixture provenance are pinned |
| 526 | `tests/runtime/ytm-logs-playlist-bottom-sheet-stale-identity-current-behavior.test.mjs` | 6 | `yes` | YTM logs playlist bottom-sheet stale identity doc and fixture provenance are pinned |
| 527 | `tests/runtime/ytm-show-sheet-collaborator-roster-current-behavior.test.mjs` | 8 | `yes` | YTM showSheet collaborator audit doc and fixture provenance are pinned |
| 528 | `tests/runtime/ytm-show-sheet-enrichment-handoff-current-behavior.test.mjs` | 5 | `yes` | YTM showSheet enrichment handoff doc and source facts are pinned |
| 529 | `tests/runtime/ytm-show-sheet-injector-filter-logic-parity-current-behavior.test.mjs` | 7 | `yes` | YTM showSheet injector/filter-logic parity doc and source facts are pinned |
| 530 | `tests/runtime/ytm-watch-player-dom-current-behavior.test.mjs` | 6 | `yes` | raw YTM watch/player DOM capture metadata and token counts are pinned |
| 531 | `tests/runtime/ytm-watch-player-observer-timer-budget-current-behavior.test.mjs` | 6 | `yes` | YTM watch/player observer timer budget doc is audit-only and metric pinned |
| 532 | `tests/runtime/ytm-watch-player-selected-row-side-effect-boundary-current-behavior.test.mjs` | 6 | `yes` | YTM selected-row side-effect boundary audit doc is audit-only and source pinned |
| 533 | `tests/runtime/ytm-watch-player-whitelist-selected-row-mode-boundary-current-behavior.test.mjs` | 7 | `yes` | YTM whitelist selected-row mode audit doc is audit-only and source pinned |
| 534 | `tests/runtime/ytm-watch-playlist-panel-json-parity-current-behavior.test.mjs` | 6 | `yes` | YTM watch playlist-panel JSON parity doc and reduced fixture are pinned |

## Quick Block Runtime-Test Family Snapshot

The rows above contain 3 `tests/runtime/quick*.test.mjs` files with 24 source top-level test declarations: 3 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| quick block affordance | 1 | 7 | 1 | 0 |
| quick block default migration | 1 | 7 | 1 | 0 |
| quick block hover lifecycle/timer | 1 | 10 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Source Runtime-Test Family Snapshot

The rows above contain 4 `tests/runtime/source*.test.mjs` files with 28 source top-level test declarations: 4 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| source boundary | 1 | 4 | 1 | 0 |
| source of truth claims | 1 | 5 | 1 | 0 |
| source surface inventory | 1 | 11 | 1 | 0 |
| source tier/effect authority | 1 | 8 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## State Manager Runtime-Test Family Snapshot

The rows above contain 3 `tests/runtime/state*.test.mjs` files with 21 source top-level test declarations: 3 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| state manager methods | 1 | 9 | 1 | 0 |
| state manager request refresh | 1 | 5 | 1 | 0 |
| state manager storage reload | 1 | 7 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## UI Runtime-Test Family Snapshot

The rows above contain 4 `tests/runtime/ui*.test.mjs` files with 28 source top-level test declarations: 4 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| UI components methods | 1 | 7 | 1 | 0 |
| UI components portal lifecycle | 1 | 6 | 1 | 0 |
| UI row/list-mode authority | 1 | 12 | 1 | 0 |
| UI settings callable | 1 | 3 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Backup Runtime-Test Family Snapshot

The rows above contain 3 `tests/runtime/backup*.test.mjs` files with 25 source top-level test declarations: 3 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| backup download blob URL lifecycle | 1 | 8 | 1 | 0 |
| backup export authority | 1 | 10 | 1 | 0 |
| backup Nanah trusted state | 1 | 7 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Build Runtime-Test Family Snapshot

The rows above contain 3 `tests/runtime/build*.test.mjs` files with 13 source top-level test declarations: 3 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| build release methods | 1 | 5 | 1 | 0 |
| build other | 1 | 5 | 1 | 0 |
| build/website callable | 1 | 3 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Collab Runtime-Test Family Snapshot

The rows above contain 2 `tests/runtime/collab*.test.mjs` files with 15 source top-level test declarations: 2 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| collab dialog lifecycle | 1 | 8 | 1 | 0 |
| collab dialog methods | 1 | 7 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Compiled Settings Runtime-Test Family Snapshot

The rows above contain 3 `tests/runtime/compiled*.test.mjs` files with 19 source top-level test declarations: 3 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| compiled cache authority | 1 | 8 | 1 | 0 |
| compiled profile/list-mode assembly | 1 | 7 | 1 | 0 |
| compiled settings fields | 1 | 4 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Generated Runtime-Test Family Snapshot

The rows above contain 2 `tests/runtime/generated*.test.mjs` files with 11 source top-level test declarations: 2 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| generated local output/dependency surface | 1 | 6 | 1 | 0 |
| generated UI shell methods | 1 | 5 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Ignored Output Runtime-Test Family Snapshot

The rows above contain 3 `tests/runtime/ignored*.test.mjs` files with 20 source top-level test declarations: 3 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| ignored local planning text | 1 | 7 | 1 | 0 |
| ignored root evidence corpus | 1 | 6 | 1 | 0 |
| ignored whitelist bundle | 1 | 7 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Injector Runtime-Test Family Snapshot

The rows above contain 3 `tests/runtime/injector*.test.mjs` files with 26 source top-level test declarations: 3 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| injector main-world message dispatch | 1 | 8 | 1 | 0 |
| injector methods | 1 | 7 | 1 | 0 |
| injector settings capability | 1 | 11 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Legacy Layout Runtime-Test Family Snapshot

The rows above contain 2 `tests/runtime/legacy*.test.mjs` files with 9 source top-level test declarations: 2 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| legacy layout methods | 1 | 5 | 1 | 0 |
| legacy layout quarantine package | 1 | 4 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Main Runtime-Test Family Snapshot

The rows above contain 23 `tests/runtime/main*.test.mjs` files with 178 source top-level test declarations: 23 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| main watch/upnext/end-screen fixtures | 10 | 83 | 10 | 0 |
| main search fixtures | 4 | 29 | 4 | 0 |
| main collab/community fixtures | 3 | 22 | 3 | 0 |
| main guide/home/next fixtures | 3 | 25 | 3 | 0 |
| main comments/filter-all scope | 1 | 10 | 1 | 0 |
| main compact/radio authority | 1 | 6 | 1 | 0 |
| main other | 1 | 3 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## P0 Runtime-Test Family Snapshot

The rows above contain 34 `tests/runtime/p0*.test.mjs` files with 326 source top-level test declarations: 34 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| P0 mutation authority | 4 | 38 | 4 | 0 |
| P0 endpoint/network/navigation authority | 3 | 30 | 3 | 0 |
| P0 fixture/gate traceability | 3 | 25 | 3 | 0 |
| P0 renderer/selector authority | 3 | 34 | 3 | 0 |
| P0 hide/keyword behavior | 2 | 24 | 2 | 0 |
| P0 manifest/release package | 2 | 19 | 2 | 0 |
| P0 obligation/readiness gate | 2 | 10 | 2 | 0 |
| P0 optimization metrics/route surface | 2 | 12 | 2 | 0 |
| P0 backup/export | 1 | 13 | 1 | 0 |
| P0 compiled rule state | 1 | 9 | 1 | 0 |
| P0 content/category | 1 | 11 | 1 | 0 |
| P0 learned identity | 1 | 14 | 1 | 0 |
| P0 lifecycle | 1 | 9 | 1 | 0 |
| P0 native runtime sync | 1 | 10 | 1 | 0 |
| P0 no-work | 1 | 5 | 1 | 0 |
| P0 profile/viewing-space | 1 | 11 | 1 | 0 |
| P0 prompt onboarding | 1 | 9 | 1 | 0 |
| P0 security PIN lock | 1 | 9 | 1 | 0 |
| P0 stats/time saved | 1 | 11 | 1 | 0 |
| P0 storage/cache | 1 | 11 | 1 | 0 |
| P0 watch/player | 1 | 12 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Popup Runtime-Test Family Snapshot

The rows above contain 2 `tests/runtime/popup*.test.mjs` files with 18 source top-level test declarations: 2 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| popup lifecycle selector | 1 | 6 | 1 | 0 |
| popup methods | 1 | 12 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Prompt Runtime-Test Family Snapshot

The rows above contain 3 `tests/runtime/prompt*.test.mjs` files with 20 source top-level test declarations: 3 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| prompt onboarding authority | 1 | 7 | 1 | 0 |
| prompt onboarding methods | 1 | 7 | 1 | 0 |
| prompt release overlay | 1 | 6 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Release Runtime-Test Family Snapshot

The rows above contain 3 `tests/runtime/release*.test.mjs` files with 18 source top-level test declarations: 3 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| release build artifact claims | 1 | 5 | 1 | 0 |
| release notes JSON version gate | 1 | 5 | 1 | 0 |
| release package parity | 1 | 8 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Root Runtime-Test Family Snapshot

The rows above contain 3 `tests/runtime/root*.test.mjs` files with 19 source top-level test declarations: 3 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| root evidence source taxonomy | 1 | 6 | 1 | 0 |
| root package metadata/script surface | 1 | 7 | 1 | 0 |
| root planning doc boundary | 1 | 6 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Security Runtime-Test Family Snapshot

The rows above contain 3 `tests/runtime/security*.test.mjs` files with 26 source top-level test declarations: 3 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| security crypto payload | 1 | 9 | 1 | 0 |
| security manager methods | 1 | 7 | 1 | 0 |
| security PIN lock authority | 1 | 10 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Static Runtime-Test Family Snapshot

The rows above contain 2 `tests/runtime/static*.test.mjs` files with 11 source top-level test declarations: 2 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| static generated/vendor | 1 | 5 | 1 | 0 |
| static HTML support scripts | 1 | 6 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Storage Runtime-Test Family Snapshot

The rows above contain 4 `tests/runtime/storage*.test.mjs` files with 21 source top-level test declarations: 4 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| storage access callsites | 1 | 4 | 1 | 0 |
| storage key authority | 1 | 6 | 1 | 0 |
| storage other | 1 | 3 | 1 | 0 |
| storage payload quota | 1 | 8 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Tab View Runtime-Test Family Snapshot

The rows above contain 2 `tests/runtime/tab*.test.mjs` files with 18 source top-level test declarations: 2 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| tab view lifecycle selector | 1 | 6 | 1 | 0 |
| tab view methods | 1 | 12 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Tracked File Runtime-Test Family Snapshot

The rows above contain 3 `tests/runtime/tracked*.test.mjs` files with 219 source top-level test declarations: 3 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| tracked file audit coverage | 1 | 6 | 1 | 0 |
| tracked file obligation index | 1 | 208 | 1 | 0 |
| tracked public doc claim surface | 1 | 5 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Video Runtime-Test Family Snapshot

The rows above contain 2 `tests/runtime/video*.test.mjs` files with 12 source top-level test declarations: 2 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| video info DOM cleanup | 1 | 6 | 1 | 0 |
| video sidebar DOM cleanup | 1 | 6 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Watch Runtime-Test Family Snapshot

The rows above contain 4 `tests/runtime/watch*.test.mjs` files with 28 source top-level test declarations: 4 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| watch end-screen authority | 1 | 5 | 1 | 0 |
| watch page embedded post renderer | 1 | 8 | 1 | 0 |
| watch player control authority | 1 | 9 | 1 | 0 |
| watch playlist panel DOM cleanup | 1 | 6 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Active Runtime-Test Family Snapshot

The rows above contain 2 `tests/runtime/active*.test.mjs` files with 267 source top-level test declarations: 2 have exact runtime-results ledger entries and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| active goal completion | 1 | 260 | 1 | 0 |
| active rule authority | 1 | 7 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Add Filtered Channel Runtime-Test Family Snapshot

The rows above contain 1 `tests/runtime/add*.test.mjs` file with 11 source top-level test declarations: 1 has exact runtime-results ledger entry and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| addFilteredChannel Filter All comments default | 1 | 11 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Alias Runtime-Test Family Snapshot

The rows above contain 1 `tests/runtime/alias*.test.mjs` file with 8 source top-level test declarations: 1 has exact runtime-results ledger entry and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| alias ingress preservation | 1 | 8 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Batch Runtime-Test Family Snapshot

The rows above contain 1 `tests/runtime/batch*.test.mjs` file with 7 source top-level test declarations: 1 has exact runtime-results ledger entry and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| batch whitelist import persistence | 1 | 7 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Block Channel Runtime-Test Family Snapshot

The rows above contain 1 `tests/runtime/block*.test.mjs` file with 8 source top-level test declarations: 1 has exact runtime-results ledger entry and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| block channel methods | 1 | 8 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Browser Runtime-Test Family Snapshot

The rows above contain 1 `tests/runtime/browser*.test.mjs` file with 7 source top-level test declarations: 1 has exact runtime-results ledger entry and 0 do not.

| Runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| browser manifest runtime load order | 1 | 7 | 1 | 0 |

This snapshot is file-level audit provenance only. It does not approve runtime optimization, JSON-first filtering, whitelist behavior changes, or release claims without feature-specific positive, negative, side-effect, rollout, and rollback proof.

## Remaining Tail Runtime-Test Family Snapshot

The rows above contain 181 runtime test files with 1556 source top-level test declarations: 181 have exact runtime-results ledger entries and 0 do not.

| Remaining tail runtime-test family | Files | Source top-level tests | Exact runtime-results rows | Missing exact runtime-results rows |
| --- | ---: | ---: | ---: | ---: |
| All Callable Index | 1 | 6 | 1 | 0 |
| Audit Completion Gap Register | 1 | 7 | 1 | 0 |
| Audit Doc Layout | 1 | 2 | 1 | 0 |
| Candidate Obligation Binding Matrix | 1 | 6 | 1 | 0 |
| Capture Corpus | 1 | 6 | 1 | 0 |
| Capture Fixture Traceability | 1 | 5 | 1 | 0 |
| Code Burden Declutter Boundary | 1 | 7 | 1 | 0 |
| Comments Dom Cleanup Boundary | 1 | 9 | 1 | 0 |
| Compact Autoplay Authority | 1 | 5 | 1 | 0 |
| Compact Autoplay Raw Corpus Census | 1 | 5 | 1 | 0 |
| Compiler Parity | 1 | 8 | 1 | 0 |
| Compress Video Script Failure Mode Boundary | 1 | 5 | 1 | 0 |
| Cross Feature Authority Matrix | 1 | 4 | 1 | 0 |
| Css Load Style Surface | 1 | 5 | 1 | 0 |
| Css Style Hide Authority | 1 | 7 | 1 | 0 |
| Current Dirty Worktree Audit Boundary | 1 | 6 | 1 | 0 |
| Design Token Json Css Parity Boundary | 1 | 6 | 1 | 0 |
| Direct Hide Writer Register | 1 | 6 | 1 | 0 |
| Direct Watch Card Authority | 1 | 5 | 1 | 0 |
| Document Start Zero Flash Boundary | 1 | 6 | 1 | 0 |
| Empty Install Idle Observer Budget | 1 | 8 | 1 | 0 |
| Empty Install Performance | 1 | 13 | 1 | 0 |
| Enabled Master Switch Disabled Runtime Boundary | 1 | 6 | 1 | 0 |
| Endpoint Decision Matrix | 1 | 3 | 1 | 0 |
| Engagement Budget | 1 | 10 | 1 | 0 |
| Engagement Side Effect | 1 | 9 | 1 | 0 |
| External Navigation Authority | 1 | 8 | 1 | 0 |
| External Navigation Surface Boundary | 1 | 7 | 1 | 0 |
| Extracted Capture | 1 | 21 | 1 | 0 |
| Extracted Watch Paths Text Dump Classification | 1 | 5 | 1 | 0 |
| Fallback Menu Action Gate | 1 | 5 | 1 | 0 |
| Feature Source Dependency Register | 1 | 8 | 1 | 0 |
| First Optimization Artifact Commit Readiness Gate | 1 | 6 | 1 | 0 |
| First Optimization Candidate Selection Boundary | 1 | 6 | 1 | 0 |
| First Optimization Collector Approval Authority Boundary | 1 | 6 | 1 | 0 |
| First Optimization Collector Diagnostic Privacy Approval Boundary | 1 | 6 | 1 | 0 |
| First Optimization Collector Fixture Provenance Approval Boundary | 1 | 6 | 1 | 0 |
| First Optimization Collector Insertion Approval Boundary | 1 | 6 | 1 | 0 |
| First Optimization Collector No Work Approval Boundary | 1 | 6 | 1 | 0 |
| First Optimization Collector Parity Rollout Approval Boundary | 1 | 6 | 1 | 0 |
| First Optimization Collector Rollback Unclaimed Approval Boundary | 1 | 6 | 1 | 0 |
| First Optimization Collector Side Effect Approval Boundary | 1 | 6 | 1 | 0 |
| First Optimization Collector Source Locus Closure Boundary | 1 | 6 | 1 | 0 |
| First Optimization Collector Verification Output Approval Boundary | 1 | 6 | 1 | 0 |
| First Optimization Diagnostic Privacy Contract | 1 | 6 | 1 | 0 |
| First Optimization Fixture Provenance Contract | 1 | 6 | 1 | 0 |
| First Optimization Implementation Readiness Gate | 1 | 6 | 1 | 0 |
| First Optimization Metric Artifact Foundation Packet | 1 | 6 | 1 | 0 |
| First Optimization Metric Artifact Path Boundary | 1 | 6 | 1 | 0 |
| First Optimization Metric Artifact Schema | 1 | 6 | 1 | 0 |
| First Optimization Metric Collector Fixture Provenance Matrix | 1 | 6 | 1 | 0 |
| First Optimization Metric Collector Insertion Gate | 1 | 6 | 1 | 0 |
| First Optimization Metric Collector No Work Preservation Matrix | 1 | 6 | 1 | 0 |
| First Optimization Metric Collector Parity Rollout Boundary | 1 | 6 | 1 | 0 |
| First Optimization Metric Collector Side Effect Budget Matrix | 1 | 6 | 1 | 0 |
| First Optimization Metric Foundation Contract Coverage Gate | 1 | 6 | 1 | 0 |
| First Optimization Metric Sample Contract | 1 | 6 | 1 | 0 |
| First Optimization Metric Source Owner Matrix | 1 | 6 | 1 | 0 |
| First Optimization No Work Preservation Contract | 1 | 6 | 1 | 0 |
| First Optimization Packet Manifest Contract | 1 | 6 | 1 | 0 |
| First Optimization Parity Rollout Contract | 1 | 6 | 1 | 0 |
| First Optimization Patch Evidence Packet Contract | 1 | 6 | 1 | 0 |
| First Optimization Rollback Unclaimed Surface Boundary | 1 | 6 | 1 | 0 |
| First Optimization Side Effect Budget Contract | 1 | 6 | 1 | 0 |
| First Optimization Source Locus Callable Anchor Boundary | 1 | 6 | 1 | 0 |
| First Optimization Source Locus Diagnostic Privacy Ownership Boundary | 1 | 6 | 1 | 0 |
| First Optimization Source Locus Fingerprint Boundary | 1 | 6 | 1 | 0 |
| First Optimization Source Locus Fixture Provenance Ownership Boundary | 1 | 6 | 1 | 0 |
| First Optimization Source Locus Implementation Authority Boundary | 1 | 6 | 1 | 0 |
| First Optimization Source Locus No Work Ownership Boundary | 1 | 6 | 1 | 0 |
| First Optimization Source Locus Parity Release Verification Ownership Boundary | 1 | 6 | 1 | 0 |
| First Optimization Source Locus Side Effect Ownership Boundary | 1 | 6 | 1 | 0 |
| First Optimization Source Locus Teardown Ownership Boundary | 1 | 6 | 1 | 0 |
| First Optimization Source Owner Approval Boundary | 1 | 6 | 1 | 0 |
| First Optimization Source Owner Map Contract | 1 | 6 | 1 | 0 |
| First Optimization Verification Output Contract | 1 | 6 | 1 | 0 |
| Function Coverage | 1 | 3 | 1 | 0 |
| Handle Resolver Method Semantic Register | 1 | 8 | 1 | 0 |
| Hide Decision Pipeline | 1 | 9 | 1 | 0 |
| Hide Restore Authority | 1 | 8 | 1 | 0 |
| Home Feed Dom Cleanup Boundary | 1 | 8 | 1 | 0 |
| Immediacy Claim Boundary | 1 | 6 | 1 | 0 |
| Implementation Readiness Gate | 1 | 6 | 1 | 0 |
| Import Export Nanah Authority | 1 | 12 | 1 | 0 |
| Io Manager Method Semantic Register | 1 | 7 | 1 | 0 |
| Keyword Comments Scope Migration Boundary | 1 | 9 | 1 | 0 |
| Keyword Match Authority | 1 | 9 | 1 | 0 |
| Kids Browse Malformed Fragment Boundary | 1 | 7 | 1 | 0 |
| Kids Comments Filter All Boundary | 1 | 9 | 1 | 0 |
| Kids Latest Json Owner Extension Fixture Boundary | 1 | 8 | 1 | 0 |
| Lifecycle Effect Budget | 1 | 11 | 1 | 0 |
| Lifecycle Instance Register | 1 | 10 | 1 | 0 |
| Lifecycle Owner Matrix | 1 | 6 | 1 | 0 |
| Lifecycle Source | 1 | 5 | 1 | 0 |
| Lifecycle Teardown Decision Register | 1 | 6 | 1 | 0 |
| List Mode Transition Persistence Boundary | 1 | 9 | 1 | 0 |
| Live Chat Dom Cleanup Boundary | 1 | 6 | 1 | 0 |
| Manifest Permission Authority | 1 | 9 | 1 | 0 |
| Manifest Permission Feature Map Boundary | 1 | 8 | 1 | 0 |
| Media Asset Duplicate Derivative Boundary | 1 | 5 | 1 | 0 |
| Members Only Dom Cleanup Boundary | 1 | 6 | 1 | 0 |
| Menu Observer Kids Passive Lifecycle Boundary | 1 | 9 | 1 | 0 |
| Message Sender Class Matrix | 1 | 7 | 1 | 0 |
| Message Side Effect Register | 1 | 8 | 1 | 0 |
| Message Transport Callsite Register | 1 | 4 | 1 | 0 |
| Message Trust Hardening Gap | 1 | 7 | 1 | 0 |
| Method Semantic Audit Register | 1 | 41 | 1 | 0 |
| Mode Surface Effect Matrix | 1 | 10 | 1 | 0 |
| Navigation Header Search Dom Cleanup Boundary | 1 | 6 | 1 | 0 |
| Network Authority | 1 | 8 | 1 | 0 |
| Network Credential Policy Matrix | 1 | 5 | 1 | 0 |
| Network Fetch Reason Matrix | 1 | 9 | 1 | 0 |
| Network Fetch Xhr Callsite Register | 1 | 4 | 1 | 0 |
| Notification Renderer Source Only Boundary | 1 | 6 | 1 | 0 |
| Objective Coverage Ledger | 1 | 288 | 1 | 0 |
| Open App Cleanup Boundary | 1 | 6 | 1 | 0 |
| Optimization Candidate Priority Register | 1 | 6 | 1 | 0 |
| Optimization Stop Go Decision Record | 1 | 7 | 1 | 0 |
| Package Lock Script Optional Dependency Boundary | 1 | 6 | 1 | 0 |
| Page Global Patch Authority | 1 | 6 | 1 | 0 |
| Page Message Trust | 1 | 5 | 1 | 0 |
| Page Runtime Lifecycle Authority | 1 | 9 | 1 | 0 |
| Page Runtime Owner Effect Matrix | 1 | 8 | 1 | 0 |
| Performance Claim Evidence Boundary | 1 | 5 | 1 | 0 |
| Player Endscreen Dom Cleanup Boundary | 1 | 6 | 1 | 0 |
| Playlist Json Player Metadata Boundary | 1 | 8 | 1 | 0 |
| Playlist Mix Dom Cleanup Boundary | 1 | 7 | 1 | 0 |
| Playlist Panel Header Mix Creator | 1 | 6 | 1 | 0 |
| Playlist Player Endscreen Dom Classification | 1 | 5 | 1 | 0 |
| Profile Management Persistence Boundary | 1 | 11 | 1 | 0 |
| Profile Viewing Space Authority | 1 | 8 | 1 | 0 |
| Public Release Claim Boundary | 1 | 9 | 1 | 0 |
| Public Release Surface | 1 | 9 | 1 | 0 |
| Quarantined Content Css Package Boundary | 1 | 4 | 1 | 0 |
| Raw Capture Extraction Obligation Index | 1 | 5 | 1 | 0 |
| Raw Capture Release Boundary | 1 | 7 | 1 | 0 |
| Recommended Dom Cleanup Boundary | 1 | 6 | 1 | 0 |
| Reference Doc Claim Drift | 1 | 8 | 1 | 0 |
| Render Engine Method Semantic Register | 1 | 11 | 1 | 0 |
| Renderer Authority Gap | 1 | 8 | 1 | 0 |
| Repo Lifecycle Primitive Coverage | 1 | 5 | 1 | 0 |
| Right Rail Whitelist Observer | 1 | 8 | 1 | 0 |
| Route Identity Decision Index | 1 | 7 | 1 | 0 |
| Route Surface Effect Authority | 1 | 10 | 1 | 0 |
| Rule Mutation Entrypoint Authority | 1 | 9 | 1 | 0 |
| Runtime Diagnostic Logging Policy Matrix | 1 | 6 | 1 | 0 |
| Selector Authority | 1 | 6 | 1 | 0 |
| Shared Identity Method Semantic Register | 1 | 7 | 1 | 0 |
| Shared Post Renderer Source Only Boundary | 1 | 6 | 1 | 0 |
| Shorts Dom Cleanup Boundary | 1 | 9 | 1 | 0 |
| Shorts Reel Overlay Owner Authority Boundary | 1 | 5 | 1 | 0 |
| Single Channel Rule Mutation Persistence Boundary | 1 | 11 | 1 | 0 |
| Sponsored Cards Dom Cleanup Boundary | 1 | 6 | 1 | 0 |
| Stabilization Fix Order | 1 | 14 | 1 | 0 |
| Stale Alias False Hide Chain | 1 | 7 | 1 | 0 |
| Startup Injection Readiness | 1 | 8 | 1 | 0 |
| Stats Surface Legacy Metric Boundary | 1 | 6 | 1 | 0 |
| Stats Time Saved Authority | 1 | 9 | 1 | 0 |
| Subagent Review Convergence | 1 | 8 | 1 | 0 |
| Subscription Import Request Lifecycle Boundary | 1 | 8 | 1 | 0 |
| Surface Information Availability | 1 | 7 | 1 | 0 |
| Synthetic Event Action Register | 1 | 5 | 1 | 0 |
| Unified Mutation Contract | 1 | 6 | 1 | 0 |
| Visible Empty Runtime Active | 1 | 9 | 1 | 0 |
| Whitelist Cache Hot Path Boundary | 1 | 5 | 1 | 0 |
| Whitelist Optimization Readiness Gap Matrix | 1 | 6 | 1 | 0 |
| Whitelist Pending Intake No Work Contract | 1 | 6 | 1 | 0 |
| Xhr Comment Continuation Parity Boundary | 1 | 9 | 1 | 0 |
| Xhr No Work Boundary | 1 | 6 | 1 | 0 |
| Youtube Music Surface Identity Boundary | 1 | 7 | 1 | 0 |
| Ytm Browse Channel List Item | 1 | 8 | 1 | 0 |
| Ytm Compact Playlist Creator Authority Boundary | 1 | 9 | 1 | 0 |
| Ytm Logs Playlist Bottom Sheet Stale Identity | 1 | 6 | 1 | 0 |
| Ytm Show Sheet Collaborator Roster | 1 | 8 | 1 | 0 |
| Ytm Show Sheet Enrichment Handoff | 1 | 5 | 1 | 0 |
| Ytm Show Sheet Injector Filter Logic Parity | 1 | 7 | 1 | 0 |
| Ytm Watch Player Dom | 1 | 6 | 1 | 0 |
| Ytm Watch Player Observer Timer Budget | 1 | 6 | 1 | 0 |
| Ytm Watch Player Selected Row Side Effect Boundary | 1 | 6 | 1 | 0 |
| Ytm Watch Player Whitelist Selected Row Mode Boundary | 1 | 7 | 1 | 0 |
| Ytm Watch Playlist Panel Json Parity | 1 | 6 | 1 | 0 |

This snapshot closes the file-level runtime-test provenance gap for the remaining tail. It makes the audit ledger complete at exact test-path level, not at semantic implementation-readiness level; runtime optimization still needs feature-specific fixtures, side-effect proof, false-hide proof, performance proof, rollout proof, and rollback proof.
