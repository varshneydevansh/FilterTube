import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_WHITELIST_CACHE_SPA_METRIC_PACKET_GATE_CURRENT_BEHAVIOR_2026-05-29.md';
const affectedCallableDocPath = 'docs/audit/FILTERTUBE_WHITELIST_CACHE_SPA_AFFECTED_CALLABLE_PROOF_BOUNDARY_CURRENT_BEHAVIOR_2026-05-30.md';
const methodSemanticGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const liveSmokeRoot = 'docs/audit/artifacts/release-live-youtube-spa-smoke';
const liveSmokeTemplatePath = `${liveSmokeRoot}/template.json`;
const liveSmokeRunnerPath = `${liveSmokeRoot}/run-live-smoke.mjs`;
const liveSmokeVerifierPath = `${liveSmokeRoot}/verify-live-smoke-artifact.mjs`;

const sourceDocs = [
  'docs/audit/FILTERTUBE_YOUTUBE_LAG_COMMIT_ATTRIBUTION_2026-05-26.md',
  'docs/audit/FILTERTUBE_RELEASE_FIX_AUDIT_STATUS_2026-05-26.md',
  'docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25.md',
  'docs/audit/FILTERTUBE_WHITELIST_CACHE_HOT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md',
  'docs/audit/FILTERTUBE_RELEASE_LIVE_YOUTUBE_SPA_SMOKE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md',
  liveSmokeTemplatePath,
  liveSmokeRunnerPath,
  liveSmokeVerifierPath,
  'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_IDENTITY_PROMOTION_HANDOFF_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_MENU_ACTION_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md'
];

const affectedCallableSourceDocs = [
  docPath,
  'docs/audit/FILTERTUBE_WHITELIST_CACHE_HOT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md',
  methodSemanticGapPath,
  'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_CANDIDATE_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md'
];

const affectedCallableLedgerDocs = [
  'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  'docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
];

const affectedCallableCentralLedgerDocs = [
  'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  'docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md'
];

const packetRows = [
  'FT-WLCACHE-SPA-PACKET-00-binding',
  'FT-WLCACHE-SPA-PACKET-01-installed-profile-bytes',
  'FT-WLCACHE-SPA-PACKET-02-route-sequence',
  'FT-WLCACHE-SPA-PACKET-03-list-modes',
  'FT-WLCACHE-SPA-PACKET-04-transport-no-work',
  'FT-WLCACHE-SPA-PACKET-05-dom-lifecycle',
  'FT-WLCACHE-SPA-PACKET-06-whitelist-pending-rail',
  'FT-WLCACHE-SPA-PACKET-07-cache-refresh',
  'FT-WLCACHE-SPA-PACKET-08-settings-mutation',
  'FT-WLCACHE-SPA-PACKET-09-behavior-invariants',
  'FT-WLCACHE-SPA-PACKET-10-json-first-first-class-gate',
  'FT-WLCACHE-SPA-PACKET-11-rollout-nonclaim'
];

const liveSmokeRows = [
  'FT-LIVE-SPA-00-home-to-search',
  'FT-LIVE-SPA-01-search-to-channel',
  'FT-LIVE-SPA-02-channel-to-watch',
  'FT-LIVE-SPA-03-watch-to-home',
  'FT-LIVE-SPA-04-watch-rail-scroll',
  'FT-LIVE-SPA-05-cache-repeat-navigation'
];

const installedByteParityRows = [
  'FT-WLCACHE-BYTE-00-scope-binding',
  'FT-WLCACHE-BYTE-01-visible-profile-id',
  'FT-WLCACHE-BYTE-02-extension-id-path-version',
  'FT-WLCACHE-BYTE-03-manifest-surface',
  'FT-WLCACHE-BYTE-04-source-byte-snapshot',
  'FT-WLCACHE-BYTE-05-active-youtube-tab-url',
  'FT-WLCACHE-BYTE-06-loaded-runtime-marker',
  'FT-WLCACHE-BYTE-07-reload-timestamp',
  'FT-WLCACHE-BYTE-08-source-loaded-comparison',
  'FT-WLCACHE-BYTE-09-automation-profile-exclusion',
  'FT-WLCACHE-BYTE-10-incognito-session-separation',
  'FT-WLCACHE-BYTE-11-live-smoke-acceptance'
];

const installedByteParityFields = [
  'packet_id',
  'workspace_revision_or_hash',
  'tester_initials',
  'manual_timestamp',
  'chrome_profile_label',
  'chrome_user_data_dir',
  'extension_id',
  'extension_path',
  'manifest_version',
  'service_worker_version',
  'active_tab_url',
  'content_script_marker_or_hash',
  'extension_reload_timestamp',
  'tab_reload_timestamp'
];

const routeModeStates = [
  'FT-WLCACHE-MODE-00-disabled',
  'FT-WLCACHE-MODE-01-empty-blocklist',
  'FT-WLCACHE-MODE-02-active-blocklist',
  'FT-WLCACHE-MODE-03-empty-whitelist',
  'FT-WLCACHE-MODE-04-active-whitelist',
  'FT-WLCACHE-MODE-05-no-useful-rule'
];

const routeModeFields = [
  'packet_id',
  'route_row_id',
  'list_mode_state',
  'profile_type',
  'extension_enabled',
  'rule_state',
  'route_start',
  'route_end',
  'navigation_type',
  'observed_stall',
  'false_hide_result',
  'leak_result',
  'menu_quick_result',
  'transport_budget_result',
  'dom_lifecycle_budget_result',
  'cache_refresh_result'
];

const transportBudgetRows = [
  'FT-WLCACHE-WORK-TRANSPORT-00-settings-revision',
  'FT-WLCACHE-WORK-TRANSPORT-01-fetch-clone-count',
  'FT-WLCACHE-WORK-TRANSPORT-02-fetch-json-parse-count',
  'FT-WLCACHE-WORK-TRANSPORT-03-xhr-json-parse-count',
  'FT-WLCACHE-WORK-TRANSPORT-04-process-data-count',
  'FT-WLCACHE-WORK-TRANSPORT-05-response-rebuild-count',
  'FT-WLCACHE-WORK-TRANSPORT-06-queued-snapshot-replay-count',
  'FT-WLCACHE-WORK-TRANSPORT-07-pass-through-reason'
];

const domLifecycleBudgetRows = [
  'FT-WLCACHE-WORK-DOM-00-selector-traversal-count',
  'FT-WLCACHE-WORK-DOM-01-node-visited-count',
  'FT-WLCACHE-WORK-DOM-02-observer-callback-count',
  'FT-WLCACHE-WORK-DOM-03-listener-callback-count',
  'FT-WLCACHE-WORK-DOM-04-timer-scheduled-count',
  'FT-WLCACHE-WORK-DOM-05-whitelist-pending-intake-count',
  'FT-WLCACHE-WORK-DOM-06-menu-scan-count',
  'FT-WLCACHE-WORK-DOM-07-quick-block-work-count',
  'FT-WLCACHE-WORK-DOM-08-identity-prefetch-count',
  'FT-WLCACHE-WORK-DOM-09-dom-fallback-rerun-count'
];

const workBudgetFields = [
  'packet_id',
  'route_row_id',
  'list_mode_state',
  'settings_revision',
  'budget_family',
  'counter_name',
  'expected_max',
  'observed_count',
  'observed_duration_ms',
  'observed_bytes',
  'source_owner',
  'allowed_work_reason',
  'forbidden_work_reason',
  'pass_through_reason',
  'side_effect_result',
  'no_work_result',
  'fixture_or_live_artifact',
  'verdict'
];

const pendingRailRows = [
  'FT-WLCACHE-PENDING-RAIL-00-route-binding',
  'FT-WLCACHE-PENDING-RAIL-01-eligible-surface-gate',
  'FT-WLCACHE-PENDING-RAIL-02-pending-intake-count',
  'FT-WLCACHE-PENDING-RAIL-03-right-rail-observer-fanout',
  'FT-WLCACHE-PENDING-RAIL-04-delayed-pass-cancellation',
  'FT-WLCACHE-PENDING-RAIL-05-selected-row-preservation',
  'FT-WLCACHE-PENDING-RAIL-06-scaffold-preservation',
  'FT-WLCACHE-PENDING-RAIL-07-false-hide-sample',
  'FT-WLCACHE-PENDING-RAIL-08-leak-sample',
  'FT-WLCACHE-PENDING-RAIL-09-queue-drain-on-settings-refresh'
];

const cacheRefreshRows = [
  'FT-WLCACHE-CACHE-REFRESH-00-settings-revision',
  'FT-WLCACHE-CACHE-REFRESH-01-learned-map-duplicate-row-count',
  'FT-WLCACHE-CACHE-REFRESH-02-learned-map-changed-row-count',
  'FT-WLCACHE-CACHE-REFRESH-03-storage-refresh-count',
  'FT-WLCACHE-CACHE-REFRESH-04-background-handoff-count',
  'FT-WLCACHE-CACHE-REFRESH-05-force-reprocess-upgrade-count',
  'FT-WLCACHE-CACHE-REFRESH-06-dom-rerun-count',
  'FT-WLCACHE-CACHE-REFRESH-07-route-cache-hit-count',
  'FT-WLCACHE-CACHE-REFRESH-08-stale-identity-invalidation-count',
  'FT-WLCACHE-CACHE-REFRESH-09-no-rule-cache-bypass-count'
];

const pendingCacheFields = [
  'packet_id',
  'route_row_id',
  'list_mode_state',
  'settings_revision',
  'surface_name',
  'candidate_video_id',
  'candidate_channel_id',
  'pending_intake_count',
  'right_rail_observer_count',
  'delayed_pass_cancelled',
  'selected_row_preserved',
  'scaffold_preserved',
  'false_hide_result',
  'leak_result',
  'learned_map_duplicate_rows',
  'learned_map_changed_rows',
  'force_reprocess_upgraded',
  'dom_rerun_count',
  'cache_refresh_result',
  'verdict'
];

const settingsMutationRows = [
  'FT-WLCACHE-SETTINGS-MUTATION-00-profile-id',
  'FT-WLCACHE-SETTINGS-MUTATION-01-settings-revision',
  'FT-WLCACHE-SETTINGS-MUTATION-02-list-mode-transition',
  'FT-WLCACHE-SETTINGS-MUTATION-03-keyword-alias-compile',
  'FT-WLCACHE-SETTINGS-MUTATION-04-channel-list-compile',
  'FT-WLCACHE-SETTINGS-MUTATION-05-whitelist-list-compile',
  'FT-WLCACHE-SETTINGS-MUTATION-06-import-merge-state',
  'FT-WLCACHE-SETTINGS-MUTATION-07-compiled-cache-invalidation',
  'FT-WLCACHE-SETTINGS-MUTATION-08-refresh-fanout-count',
  'FT-WLCACHE-SETTINGS-MUTATION-09-force-reprocess-request'
];

const behaviorInvariantRows = [
  'FT-WLCACHE-BEHAVIOR-00-blocklist-keyword-hide',
  'FT-WLCACHE-BEHAVIOR-01-blocklist-channel-hide',
  'FT-WLCACHE-BEHAVIOR-02-whitelist-allows-matching',
  'FT-WLCACHE-BEHAVIOR-03-whitelist-hides-nonmatching',
  'FT-WLCACHE-BEHAVIOR-04-empty-blocklist-no-work',
  'FT-WLCACHE-BEHAVIOR-05-quick-cross-first-channel',
  'FT-WLCACHE-BEHAVIOR-06-comment-native-menu-open-close',
  'FT-WLCACHE-BEHAVIOR-07-topic-ampersand-single-channel',
  'FT-WLCACHE-BEHAVIOR-08-collab-menu-multi-channel',
  'FT-WLCACHE-BEHAVIOR-09-json-first-gated-no-leak'
];

const settingsBehaviorFields = [
  'packet_id',
  'route_row_id',
  'list_mode_state',
  'profile_id',
  'settings_revision_before',
  'settings_revision_after',
  'mutation_source',
  'mutation_type',
  'keyword_state',
  'channel_state',
  'whitelist_state',
  'compiled_cache_invalidated',
  'refresh_fanout_count',
  'force_reprocess_requested',
  'behavior_invariant_id',
  'expected_result',
  'observed_result',
  'false_hide_result',
  'leak_result',
  'verdict'
];

const jsonFirstRows = [
  'FT-WLCACHE-JSON-FIRST-00-route-surface-binding',
  'FT-WLCACHE-JSON-FIRST-01-dom-json-parity',
  'FT-WLCACHE-JSON-FIRST-02-no-work-budget',
  'FT-WLCACHE-JSON-FIRST-03-side-effect-budget',
  'FT-WLCACHE-JSON-FIRST-04-fixture-provenance',
  'FT-WLCACHE-JSON-FIRST-05-verification-output',
  'FT-WLCACHE-JSON-FIRST-06-first-class-authority-decision',
  'FT-WLCACHE-JSON-FIRST-07-dom-fallback-retention',
  'FT-WLCACHE-JSON-FIRST-08-recommendation-engagement-noninteraction',
  'FT-WLCACHE-JSON-FIRST-09-promotion-rollback'
];

const rolloutRows = [
  'FT-WLCACHE-ROLLOUT-00-release-scope-binding',
  'FT-WLCACHE-ROLLOUT-01-unclaimed-surface-list',
  'FT-WLCACHE-ROLLOUT-02-native-mobile-tv-exclusion',
  'FT-WLCACHE-ROLLOUT-03-firefox-mobile-exclusion',
  'FT-WLCACHE-ROLLOUT-04-incognito-profile-exclusion',
  'FT-WLCACHE-ROLLOUT-05-raw-capture-exclusion',
  'FT-WLCACHE-ROLLOUT-06-public-performance-claim-boundary',
  'FT-WLCACHE-ROLLOUT-07-rollback-plan',
  'FT-WLCACHE-ROLLOUT-08-manual-release-checklist',
  'FT-WLCACHE-ROLLOUT-09-ship-decision'
];

const jsonRolloutFields = [
  'packet_id',
  'route_row_id',
  'surface_name',
  'renderer_family',
  'list_mode_state',
  'json_path',
  'dom_selector',
  'fixture_provenance_id',
  'dom_json_parity_result',
  'no_work_budget_result',
  'side_effect_budget_result',
  'verification_output_path',
  'first_class_authority_decision',
  'rollback_switch',
  'unclaimed_surfaces',
  'native_scope_result',
  'public_claim_boundary',
  'manual_release_checklist_result',
  'ship_decision',
  'verdict'
];

const packetExpansionRows = [
  'FT-WLCACHE-SPA-EXPANSION-00-binding',
  'FT-WLCACHE-SPA-EXPANSION-01-installed-byte-parity',
  'FT-WLCACHE-SPA-EXPANSION-02-route-mode',
  'FT-WLCACHE-SPA-EXPANSION-03-work-budget',
  'FT-WLCACHE-SPA-EXPANSION-04-pending-cache',
  'FT-WLCACHE-SPA-EXPANSION-05-settings-behavior',
  'FT-WLCACHE-SPA-EXPANSION-06-json-rollout'
];

const affectedCallableRows = [
  'FT-WLCACHE-AFFECTED-00-filter-map-producers',
  'FT-WLCACHE-AFFECTED-01-filter-whitelist-decision',
  'FT-WLCACHE-AFFECTED-02-right-rail-whitelist-refresh',
  'FT-WLCACHE-AFFECTED-03-visible-card-identity-prefetch',
  'FT-WLCACHE-AFFECTED-04-video-channel-content-cache',
  'FT-WLCACHE-AFFECTED-05-video-meta-content-cache',
  'FT-WLCACHE-AFFECTED-06-background-video-channel-cache',
  'FT-WLCACHE-AFFECTED-07-background-video-meta-cache',
  'FT-WLCACHE-AFFECTED-08-storage-refresh-fanout',
  'FT-WLCACHE-AFFECTED-09-dom-fallback-pending-recheck',
  'FT-WLCACHE-AFFECTED-10-handle-resolver-pending-cache',
  'FT-WLCACHE-AFFECTED-11-transport-active-work-gates'
];

const routeModeCallableRows = [
  'FT-WLCACHE-ROUTEMODE-CALLABLE-00-disabled-transport',
  'FT-WLCACHE-ROUTEMODE-CALLABLE-01-empty-blocklist-transport',
  'FT-WLCACHE-ROUTEMODE-CALLABLE-02-active-blocklist-json',
  'FT-WLCACHE-ROUTEMODE-CALLABLE-03-empty-whitelist-json',
  'FT-WLCACHE-ROUTEMODE-CALLABLE-04-active-whitelist-pending-rail',
  'FT-WLCACHE-ROUTEMODE-CALLABLE-05-visible-identity-prefetch',
  'FT-WLCACHE-ROUTEMODE-CALLABLE-06-map-only-refresh',
  'FT-WLCACHE-ROUTEMODE-CALLABLE-07-meta-rerun'
];

const transportNoWorkRows = [
  'FT-WLCACHE-TRANSPORT-NOWORK-00-seed-network-predicate',
  'FT-WLCACHE-TRANSPORT-NOWORK-01-seed-raw-snapshot-gate',
  'FT-WLCACHE-TRANSPORT-NOWORK-02-seed-pre-parse-bypass',
  'FT-WLCACHE-TRANSPORT-NOWORK-03-seed-route-skip-gates',
  'FT-WLCACHE-TRANSPORT-NOWORK-04-seed-process-pass-through',
  'FT-WLCACHE-TRANSPORT-NOWORK-05-seed-settings-queue-clear',
  'FT-WLCACHE-TRANSPORT-NOWORK-06-injector-network-predicate',
  'FT-WLCACHE-TRANSPORT-NOWORK-07-injector-processing-queue-gates'
];

const liveEvidenceExecutionBlockerRows = [
  'FT-WLCACHE-LIVE-BLOCKER-00-normal-profile-binding',
  'FT-WLCACHE-LIVE-BLOCKER-01-installed-byte-parity',
  'FT-WLCACHE-LIVE-BLOCKER-02-route-sequence-binding',
  'FT-WLCACHE-LIVE-BLOCKER-03-list-mode-fixtures',
  'FT-WLCACHE-LIVE-BLOCKER-04-transport-counter-proof',
  'FT-WLCACHE-LIVE-BLOCKER-05-dom-lifecycle-counter-proof',
  'FT-WLCACHE-LIVE-BLOCKER-06-behavior-invariant-samples',
  'FT-WLCACHE-LIVE-BLOCKER-07-artifact-and-approval-boundary'
];

const liveEvidenceExecutionBlockerFields = [
  'live_blocker_id',
  'packet_id',
  'route_row_id',
  'list_mode_state',
  'chrome_profile_label',
  'extension_id',
  'installed_byte_parity',
  'source_revision_or_hash',
  'affected_callable_row_id',
  'counter_family',
  'behavior_invariant_id',
  'side_effect_risk',
  'privacy_boundary',
  'approval_required',
  'verdict'
];

const routeModeCallableBudgetArtifactRoot = 'docs/audit/artifacts/whitelist-cache-spa';
const routeModeCallableBudgetArtifactPath = `${routeModeCallableBudgetArtifactRoot}/route-mode-callable-budget.json`;
const liveEvidenceResultArtifactPath = `${routeModeCallableBudgetArtifactRoot}/live-evidence-result.json`;

const liveEvidenceResultRows = [
  'FT-WLCACHE-LIVE-RESULT-00-profile-byte-binding',
  'FT-WLCACHE-LIVE-RESULT-01-route-mode-grid',
  'FT-WLCACHE-LIVE-RESULT-02-transport-counters',
  'FT-WLCACHE-LIVE-RESULT-03-dom-lifecycle-counters',
  'FT-WLCACHE-LIVE-RESULT-04-cache-pending-counters',
  'FT-WLCACHE-LIVE-RESULT-05-settings-behavior-invariants',
  'FT-WLCACHE-LIVE-RESULT-06-privacy-redaction',
  'FT-WLCACHE-LIVE-RESULT-07-approval-boundary'
];

const liveEvidenceResultSchemaRows = [
  'FT-WLCACHE-LIVE-SCHEMA-00-profile-byte-binding',
  'FT-WLCACHE-LIVE-SCHEMA-01-route-mode-grid',
  'FT-WLCACHE-LIVE-SCHEMA-02-transport-counters',
  'FT-WLCACHE-LIVE-SCHEMA-03-dom-lifecycle-counters',
  'FT-WLCACHE-LIVE-SCHEMA-04-cache-pending-counters',
  'FT-WLCACHE-LIVE-SCHEMA-05-settings-behavior-invariants',
  'FT-WLCACHE-LIVE-SCHEMA-06-privacy-redaction',
  'FT-WLCACHE-LIVE-SCHEMA-07-approval-boundary'
];

const liveEvidenceResultFieldGroups = [
  'profile_byte_binding',
  'route_mode_grid',
  'transport_counters',
  'dom_lifecycle_counters',
  'cache_pending_counters',
  'settings_behavior_invariants',
  'privacy_redaction',
  'approval_boundary'
];

const liveEvidenceResultValidatorRows = [
  'FT-WLCACHE-LIVE-VALIDATOR-00-profile-byte-binding',
  'FT-WLCACHE-LIVE-VALIDATOR-01-route-mode-grid',
  'FT-WLCACHE-LIVE-VALIDATOR-02-transport-counters',
  'FT-WLCACHE-LIVE-VALIDATOR-03-dom-lifecycle-counters',
  'FT-WLCACHE-LIVE-VALIDATOR-04-cache-pending-counters',
  'FT-WLCACHE-LIVE-VALIDATOR-05-settings-behavior-invariants',
  'FT-WLCACHE-LIVE-VALIDATOR-06-privacy-redaction',
  'FT-WLCACHE-LIVE-VALIDATOR-07-approval-boundary'
];

const liveEvidenceResultValidatorCheckFamilies = [
  'profile_byte_binding',
  'route_mode_grid',
  'transport_counter_budget',
  'dom_lifecycle_budget',
  'cache_pending_budget',
  'settings_behavior_invariants',
  'privacy_redaction',
  'approval_boundary'
];

const liveEvidenceResultFields = [
  'live_result_row_id',
  'packet_id',
  'artifact_path',
  'chrome_profile_label',
  'extension_id',
  'installed_byte_parity',
  'source_revision_or_hash',
  'route_row_id',
  'list_mode_state',
  'settings_revision',
  'affected_callable_row_id',
  'counter_family',
  'counter_name',
  'observed_count',
  'observed_duration_ms',
  'observed_bytes',
  'behavior_invariant_id',
  'false_hide_result',
  'leak_result',
  'menu_quick_result',
  'privacy_redaction_result',
  'rollback_result',
  'approval_required',
  'verdict'
];

const liveEvidenceResultValidatorFields = [
  'validator_row_id',
  'packet_id',
  'artifact_path',
  'schema_version',
  'check_family',
  'route_row_id',
  'list_mode_state',
  'required_cell_count',
  'observed_cell_count',
  'missing_cell_count',
  'counter_family',
  'counter_name',
  'counter_budget_status',
  'installed_byte_parity_status',
  'source_revision_or_hash_status',
  'settings_revision_status',
  'behavior_invariant_status',
  'false_hide_status',
  'leak_status',
  'menu_quick_status',
  'privacy_redaction_status',
  'rollback_status',
  'approval_status',
  'failure_mode',
  'approval_required',
  'verdict'
];

const routeModeCallableBudgetSections = [
  'FT-WLCACHE-ROUTEMODE-BUDGET-00-contract-binding',
  'FT-WLCACHE-ROUTEMODE-BUDGET-01-route-list-mode-grid',
  'FT-WLCACHE-ROUTEMODE-BUDGET-02-affected-callable-link',
  'FT-WLCACHE-ROUTEMODE-BUDGET-03-transport-counter-family',
  'FT-WLCACHE-ROUTEMODE-BUDGET-04-dom-lifecycle-counter-family',
  'FT-WLCACHE-ROUTEMODE-BUDGET-05-pending-cache-counter-family',
  'FT-WLCACHE-ROUTEMODE-BUDGET-06-settings-behavior-family',
  'FT-WLCACHE-ROUTEMODE-BUDGET-07-approval-boundary'
];

const routeModeCallableBudgetCounterFamilies = [
  'transport',
  'domLifecycle',
  'pendingRail',
  'cacheRefresh',
  'settingsMutation',
  'behaviorInvariant'
];

const routeModeCallableBudgetFields = [
  'packet_id',
  'route_row_id',
  'list_mode_state',
  'profile_type',
  'settings_revision',
  'affected_callable_row_id',
  'budget_family',
  'counter_name',
  'expected_max',
  'observed_count',
  'observed_duration_ms',
  'observed_bytes',
  'allowed_work_reason',
  'forbidden_work_reason',
  'side_effect_result',
  'false_hide_result',
  'leak_result',
  'menu_quick_result',
  'transport_no_work_result',
  'cache_refresh_result',
  'fixture_or_live_artifact',
  'installed_byte_parity',
  'source_owner',
  'verdict'
];

const routeModeCallableBudgetSchemaRows = [
  'FT-WLCACHE-ROUTEMODE-SCHEMA-00-contract-binding',
  'FT-WLCACHE-ROUTEMODE-SCHEMA-01-route-list-mode-grid',
  'FT-WLCACHE-ROUTEMODE-SCHEMA-02-affected-callable-link',
  'FT-WLCACHE-ROUTEMODE-SCHEMA-03-transport-counter-family',
  'FT-WLCACHE-ROUTEMODE-SCHEMA-04-dom-lifecycle-counter-family',
  'FT-WLCACHE-ROUTEMODE-SCHEMA-05-pending-cache-counter-family',
  'FT-WLCACHE-ROUTEMODE-SCHEMA-06-settings-behavior-family',
  'FT-WLCACHE-ROUTEMODE-SCHEMA-07-approval-boundary'
];

const routeModeCallableBudgetFieldGroups = [
  'contract_binding',
  'route_list_mode_grid',
  'affected_callable_link',
  'transport_counter_family',
  'dom_lifecycle_counter_family',
  'pending_cache_counter_family',
  'settings_behavior_family',
  'approval_boundary'
];

const routeModeCallableBudgetValidatorRows = [
  'FT-WLCACHE-ROUTEMODE-VALIDATOR-00-contract-binding',
  'FT-WLCACHE-ROUTEMODE-VALIDATOR-01-route-list-mode-grid',
  'FT-WLCACHE-ROUTEMODE-VALIDATOR-02-affected-callable-link',
  'FT-WLCACHE-ROUTEMODE-VALIDATOR-03-transport-counter-family',
  'FT-WLCACHE-ROUTEMODE-VALIDATOR-04-dom-lifecycle-counter-family',
  'FT-WLCACHE-ROUTEMODE-VALIDATOR-05-pending-cache-counter-family',
  'FT-WLCACHE-ROUTEMODE-VALIDATOR-06-settings-behavior-family',
  'FT-WLCACHE-ROUTEMODE-VALIDATOR-07-approval-boundary'
];

const routeModeCallableBudgetValidatorCheckFamilies = [
  'packet_binding',
  'route_mode_grid',
  'affected_callable_link',
  'transport_budget',
  'dom_lifecycle_budget',
  'pending_cache_budget',
  'settings_behavior_invariants',
  'approval_boundary'
];

const routeModeCallableBudgetValidatorFields = [
  'validator_row_id',
  'packet_id',
  'artifact_path',
  'schema_version',
  'check_family',
  'route_row_id',
  'list_mode_state',
  'required_cell_count',
  'observed_cell_count',
  'missing_cell_count',
  'affected_callable_row_id',
  'budget_family',
  'counter_name',
  'expected_max',
  'observed_count',
  'observed_duration_ms',
  'observed_bytes',
  'installed_byte_parity_status',
  'source_owner_status',
  'side_effect_status',
  'false_hide_status',
  'leak_status',
  'menu_quick_status',
  'failure_mode',
  'approval_required',
  'verdict'
];

const routeModeCallableBudgetSourceOwnerRows = [
  'FT-WLCACHE-ROUTEMODE-OWNER-00-binding',
  'FT-WLCACHE-ROUTEMODE-OWNER-01-transport',
  'FT-WLCACHE-ROUTEMODE-OWNER-02-filter-decision',
  'FT-WLCACHE-ROUTEMODE-OWNER-03-dom-lifecycle',
  'FT-WLCACHE-ROUTEMODE-OWNER-04-pending-cache',
  'FT-WLCACHE-ROUTEMODE-OWNER-05-settings-mutation',
  'FT-WLCACHE-ROUTEMODE-OWNER-06-behavior-invariant',
  'FT-WLCACHE-ROUTEMODE-OWNER-07-approval-boundary'
];

const routeModeCallableBudgetSourceOwnerFields = [
  'source_owner_id',
  'packet_id',
  'affected_callable_row_id',
  'source_file',
  'source_line_anchor',
  'counter_family',
  'produced_fields',
  'consumed_fields',
  'expected_counter_names',
  'route_rows',
  'list_mode_states',
  'no_work_obligation',
  'side_effect_obligation',
  'false_hide_leak_obligation',
  'installed_byte_parity_required',
  'collector_approval_required',
  'artifact_path',
  'verdict'
];

const routeModeCallableBudgetCollectorPreflightRows = [
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-00-binding',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-01-installed-byte-parity',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-02-route-mode-coverage',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-03-no-work-preservation',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-04-side-effect-neutrality',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-05-false-hide-leak-sampling',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-06-diagnostic-privacy',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-07-approval-boundary'
];

const routeModeCallableBudgetCollectorPreflightFields = [
  'collector_preflight_id',
  'packet_id',
  'artifact_path',
  'collector_family',
  'source_owner_id',
  'route_rows',
  'list_mode_states',
  'installed_byte_parity_required',
  'no_work_result_required',
  'side_effect_result_required',
  'false_hide_result_required',
  'leak_result_required',
  'diagnostic_privacy_required',
  'fixture_or_live_artifact_required',
  'verification_output_required',
  'rollback_switch_required',
  'runtime_collector_insertion_approved',
  'collector_approval_required',
  'runtime_behavior_changed',
  'verdict'
];

const routeModeCallableBudgetCollectorApprovalDependencyRows = [
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-00-packet-binding',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-01-source-owner',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-02-insertion-point',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-03-no-work',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-04-side-effect',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-05-fixture-provenance',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-06-diagnostic-privacy',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-07-parity-rollout',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-08-verification-output',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-09-rollback-unclaimed',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-10-release-public',
  'FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-11-ledger-runtime-results'
];

const routeModeCallableBudgetCollectorApprovalDependencyFields = [
  'collector_approval_dependency_id',
  'packet_id',
  'artifact_path',
  'collector_preflight_id',
  'collector_family',
  'required_approval_row',
  'upstream_boundary_doc',
  'upstream_boundary_row_count',
  'upstream_approval_status',
  'source_owner_required',
  'insertion_required',
  'no_work_required',
  'side_effect_required',
  'fixture_provenance_required',
  'diagnostic_privacy_required',
  'parity_rollout_required',
  'verification_output_required',
  'rollback_required',
  'release_public_required',
  'verdict'
];

const routeModeCallableBudgetCollectorApprovalUpstreamDocs = [
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_INSERTION_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_NO_WORK_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_SIDE_EFFECT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_FIXTURE_PROVENANCE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_DIAGNOSTIC_PRIVACY_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_PARITY_ROLLOUT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_VERIFICATION_OUTPUT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_ROLLBACK_UNCLAIMED_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md'
];

const routeModeCallableBudgetCollectorRequiredMissingApprovals = [
  'sourceOwner',
  'collectorInsertion',
  'collectorNoWork',
  'collectorSideEffect',
  'fixtureProvenance',
  'diagnosticPrivacy',
  'parityRollout',
  'verificationOutput',
  'rollbackUnclaimed',
  'releasePublic',
  'collectorApprovalAuthority',
  'affectedCallableSemanticProof'
];

const affectedCallableFingerprintFiles = [
  'js/filter_logic.js',
  'js/content_bridge.js',
  'js/content/bridge_settings.js',
  'js/background.js',
  'js/content/dom_fallback.js',
  'js/content/handle_resolver.js',
  'js/seed.js',
  'js/injector.js'
];

const affectedCallableSemanticGapRows = [
  'FT-WLCACHE-SEMANTIC-GAP-00-filter-logic',
  'FT-WLCACHE-SEMANTIC-GAP-01-content-bridge',
  'FT-WLCACHE-SEMANTIC-GAP-02-bridge-settings',
  'FT-WLCACHE-SEMANTIC-GAP-03-background',
  'FT-WLCACHE-SEMANTIC-GAP-04-dom-fallback',
  'FT-WLCACHE-SEMANTIC-GAP-05-handle-resolver',
  'FT-WLCACHE-SEMANTIC-GAP-06-seed',
  'FT-WLCACHE-SEMANTIC-GAP-07-injector'
];

const affectedCallableSemanticFiles = [
  {
    id: 'FT-WLCACHE-SEMANTIC-GAP-00-filter-logic',
    file: 'js/filter_logic.js',
    family: 'Hot page/background runtime',
    lexicalCallables: 313,
    semanticStatus: 'semantic proof incomplete'
  },
  {
    id: 'FT-WLCACHE-SEMANTIC-GAP-01-content-bridge',
    file: 'js/content_bridge.js',
    family: 'Hot page/background runtime',
    lexicalCallables: 1198,
    semanticStatus: 'semantic proof incomplete'
  },
  {
    id: 'FT-WLCACHE-SEMANTIC-GAP-02-bridge-settings',
    file: 'js/content/bridge_settings.js',
    family: 'Hot page/background runtime',
    lexicalCallables: 65,
    semanticStatus: 'semantic proof incomplete'
  },
  {
    id: 'FT-WLCACHE-SEMANTIC-GAP-03-background',
    file: 'js/background.js',
    family: 'Hot page/background runtime',
    lexicalCallables: 440,
    semanticStatus: 'semantic proof incomplete'
  },
  {
    id: 'FT-WLCACHE-SEMANTIC-GAP-04-dom-fallback',
    file: 'js/content/dom_fallback.js',
    family: 'Hot page/background runtime',
    lexicalCallables: 418,
    semanticStatus: 'semantic proof incomplete'
  },
  {
    id: 'FT-WLCACHE-SEMANTIC-GAP-05-handle-resolver',
    file: 'js/content/handle_resolver.js',
    family: 'Hot page/background runtime',
    lexicalCallables: 22,
    semanticStatus: 'semantic proof incomplete'
  },
  {
    id: 'FT-WLCACHE-SEMANTIC-GAP-06-seed',
    file: 'js/seed.js',
    family: 'Hot page/background runtime',
    lexicalCallables: 92,
    semanticStatus: 'semantic proof incomplete'
  },
  {
    id: 'FT-WLCACHE-SEMANTIC-GAP-07-injector',
    file: 'js/injector.js',
    family: 'Hot page/background runtime',
    lexicalCallables: 314,
    semanticStatus: 'semantic proof incomplete'
  }
];

const affectedCallableSemanticRequiredFields = [
  'owner_family_and_source_file',
  'trigger_path_and_caller_class',
  'settings_profile_list_mode_inputs',
  'route_surface_scope',
  'observable_side_effects',
  'active_no_rule_disabled_behavior',
  'teardown_or_idempotence_behavior',
  'positive_and_negative_fixtures'
];

const affectedCallableSemanticBindingFields = [
  'semantic_gap_binding_id',
  'packet_id',
  'source_file',
  'method_gap_source_path',
  'method_gap_family',
  'lexical_callable_count',
  'semantic_status',
  'required_semantic_fields',
  'owner_trigger_input_surface_proof',
  'side_effect_no_work_teardown_proof',
  'positive_negative_fixture_set',
  'live_route_mode_budget_artifact',
  'behavior_change_approval',
  'verdict'
];

const affectedCallableSemanticFieldRows = [
  'FT-WLCACHE-SEMANTIC-FIELD-00-owner-source',
  'FT-WLCACHE-SEMANTIC-FIELD-01-trigger-caller',
  'FT-WLCACHE-SEMANTIC-FIELD-02-settings-profile-list-mode',
  'FT-WLCACHE-SEMANTIC-FIELD-03-route-surface',
  'FT-WLCACHE-SEMANTIC-FIELD-04-observable-side-effects',
  'FT-WLCACHE-SEMANTIC-FIELD-05-active-no-rule-disabled',
  'FT-WLCACHE-SEMANTIC-FIELD-06-teardown-idempotence',
  'FT-WLCACHE-SEMANTIC-FIELD-07-positive-negative-fixtures'
];

const affectedCallableSemanticRequiredFieldClosureFields = [
  'semantic_field_row_id',
  'packet_id',
  'method_gap_source_path',
  'affected_source_file',
  'semantic_field',
  'proof_owner',
  'trigger_caller_evidence',
  'input_mode_evidence',
  'route_surface_evidence',
  'side_effect_evidence',
  'no_work_disabled_empty_rule_evidence',
  'teardown_idempotence_evidence',
  'positive_negative_fixture_set',
  'live_route_mode_budget_artifact',
  'behavior_change_approval',
  'verdict'
];

const affectedCallableSemanticMatrixRows = [
  'FT-WLCACHE-SEMANTIC-MATRIX-00-filter-logic',
  'FT-WLCACHE-SEMANTIC-MATRIX-01-content-bridge',
  'FT-WLCACHE-SEMANTIC-MATRIX-02-bridge-settings',
  'FT-WLCACHE-SEMANTIC-MATRIX-03-background',
  'FT-WLCACHE-SEMANTIC-MATRIX-04-dom-fallback',
  'FT-WLCACHE-SEMANTIC-MATRIX-05-handle-resolver',
  'FT-WLCACHE-SEMANTIC-MATRIX-06-seed',
  'FT-WLCACHE-SEMANTIC-MATRIX-07-injector'
];

const affectedCallableSemanticMatrixFiles = affectedCallableSemanticFiles.map((row, index) => ({
  id: affectedCallableSemanticMatrixRows[index],
  file: row.file,
  lexicalCallables: row.lexicalCallables,
  fileFieldCellsRequired: 8,
  approvedFileFieldCells: 0
}));

const affectedCallableSemanticMatrixFields = [
  'semantic_matrix_row_id',
  'packet_id',
  'method_gap_source_path',
  'source_file',
  'lexical_callable_count',
  'required_semantic_fields',
  'file_field_cells_required',
  'owner_source_status',
  'trigger_caller_status',
  'settings_profile_list_mode_status',
  'route_surface_status',
  'side_effect_status',
  'active_no_rule_disabled_status',
  'teardown_idempotence_status',
  'positive_negative_fixture_status',
  'implementation_ready',
  'behavior_change_approval',
  'verdict'
];

const affectedCallableSemanticEvidenceRows = [
  'FT-WLCACHE-SEMANTIC-EVIDENCE-00-source-owner',
  'FT-WLCACHE-SEMANTIC-EVIDENCE-01-trigger-caller',
  'FT-WLCACHE-SEMANTIC-EVIDENCE-02-settings-mode',
  'FT-WLCACHE-SEMANTIC-EVIDENCE-03-route-surface',
  'FT-WLCACHE-SEMANTIC-EVIDENCE-04-side-effect',
  'FT-WLCACHE-SEMANTIC-EVIDENCE-05-no-work',
  'FT-WLCACHE-SEMANTIC-EVIDENCE-06-teardown-idempotence',
  'FT-WLCACHE-SEMANTIC-EVIDENCE-07-fixtures'
];

const affectedCallableSemanticEvidenceArtifactClasses = [
  'sourceAnchorAndOwnerTrace',
  'callerGraphAndTriggerTrace',
  'settingsProfileListModeTrace',
  'routeSurfaceCoverageTrace',
  'sideEffectBudgetTrace',
  'noWorkDisabledEmptyRuleTrace',
  'teardownIdempotenceTrace',
  'positiveNegativeFixtureSet'
];

const affectedCallableSemanticEvidenceFields = [
  'semantic_evidence_row_id',
  'packet_id',
  'method_gap_source_path',
  'semantic_matrix_row_id',
  'evidence_artifact_class',
  'affected_source_file',
  'semantic_field',
  'source_anchor_trace',
  'caller_graph_trace',
  'settings_mode_trace',
  'route_surface_trace',
  'side_effect_trace',
  'no_work_trace',
  'teardown_idempotence_trace',
  'positive_negative_fixture_set',
  'approved_artifact_path',
  'behavior_change_approval',
  'verdict'
];

const affectedCallableSemanticEvidenceArtifactRoot =
  'docs/audit/artifacts/whitelist-cache-spa-affected-callable-semantic-evidence';

const affectedCallableSemanticEvidenceArtifactRows = [
  'FT-WLCACHE-SEMANTIC-ARTIFACT-00-source-owner',
  'FT-WLCACHE-SEMANTIC-ARTIFACT-01-trigger-caller',
  'FT-WLCACHE-SEMANTIC-ARTIFACT-02-settings-mode',
  'FT-WLCACHE-SEMANTIC-ARTIFACT-03-route-surface',
  'FT-WLCACHE-SEMANTIC-ARTIFACT-04-side-effect',
  'FT-WLCACHE-SEMANTIC-ARTIFACT-05-no-work',
  'FT-WLCACHE-SEMANTIC-ARTIFACT-06-teardown-idempotence',
  'FT-WLCACHE-SEMANTIC-ARTIFACT-07-fixtures'
];

const affectedCallableSemanticEvidenceArtifactPaths = [
  'docs/audit/artifacts/whitelist-cache-spa-affected-callable-semantic-evidence/source-anchor-owner-trace.json',
  'docs/audit/artifacts/whitelist-cache-spa-affected-callable-semantic-evidence/caller-graph-trigger-trace.json',
  'docs/audit/artifacts/whitelist-cache-spa-affected-callable-semantic-evidence/settings-profile-list-mode-trace.json',
  'docs/audit/artifacts/whitelist-cache-spa-affected-callable-semantic-evidence/route-surface-coverage-trace.json',
  'docs/audit/artifacts/whitelist-cache-spa-affected-callable-semantic-evidence/side-effect-budget-trace.json',
  'docs/audit/artifacts/whitelist-cache-spa-affected-callable-semantic-evidence/no-work-disabled-empty-rule-trace.json',
  'docs/audit/artifacts/whitelist-cache-spa-affected-callable-semantic-evidence/teardown-idempotence-trace.json',
  'docs/audit/artifacts/whitelist-cache-spa-affected-callable-semantic-evidence/positive-negative-fixture-set.json'
];

const affectedCallableSemanticEvidenceArtifactRegistryRows = affectedCallableSemanticEvidenceArtifactRows.map((id, index) => ({
  id,
  evidenceRow: affectedCallableSemanticEvidenceRows[index],
  artifactClass: affectedCallableSemanticEvidenceArtifactClasses[index],
  artifactPath: affectedCallableSemanticEvidenceArtifactPaths[index],
  committed: false,
  approved: false
}));

const affectedCallableSemanticEvidenceArtifactFields = [
  'semantic_artifact_row_id',
  'packet_id',
  'method_gap_source_path',
  'semantic_evidence_row_id',
  'evidence_artifact_class',
  'artifact_root',
  'artifact_path',
  'artifact_schema',
  'required_file_field_cells',
  'source_anchor_trace',
  'caller_graph_trace',
  'settings_mode_trace',
  'route_surface_trace',
  'side_effect_trace',
  'no_work_trace',
  'teardown_idempotence_trace',
  'positive_negative_fixture_set',
  'approval_authority',
  'behavior_change_approval',
  'verdict'
];

const affectedCallableSemanticEvidenceArtifactSchemaRows = [
  'FT-WLCACHE-SEMANTIC-SCHEMA-00-source-owner',
  'FT-WLCACHE-SEMANTIC-SCHEMA-01-trigger-caller',
  'FT-WLCACHE-SEMANTIC-SCHEMA-02-settings-mode',
  'FT-WLCACHE-SEMANTIC-SCHEMA-03-route-surface',
  'FT-WLCACHE-SEMANTIC-SCHEMA-04-side-effect',
  'FT-WLCACHE-SEMANTIC-SCHEMA-05-no-work',
  'FT-WLCACHE-SEMANTIC-SCHEMA-06-teardown-idempotence',
  'FT-WLCACHE-SEMANTIC-SCHEMA-07-fixtures'
];

const affectedCallableSemanticEvidenceArtifactTopLevelFields = [
  'schemaVersion',
  'packetId',
  'artifactId',
  'artifactClass',
  'artifactPath',
  'generatedAt',
  'sourceRevision',
  'methodGapPath',
  'semanticEvidenceRows',
  'fileFieldCells',
  'evidencePayload',
  'fixtures',
  'approval',
  'verdict'
];

const affectedCallableSemanticEvidenceArtifactSchemaContractRows = affectedCallableSemanticEvidenceArtifactSchemaRows.map((id, index) => ({
  id,
  artifactRow: affectedCallableSemanticEvidenceArtifactRows[index],
  artifactClass: affectedCallableSemanticEvidenceArtifactClasses[index],
  artifactPath: affectedCallableSemanticEvidenceArtifactPaths[index],
  requiredEvidencePayload: affectedCallableSemanticEvidenceArtifactClasses[index]
}));

const affectedCallableSemanticEvidenceArtifactSchemaFields = [
  'semantic_artifact_schema_row_id',
  'packet_id',
  'method_gap_source_path',
  'artifact_registry_schema',
  'semantic_artifact_row_id',
  'evidence_artifact_class',
  'artifact_path',
  'schema_version',
  'required_top_level_fields',
  'required_evidence_payload',
  'file_field_cell_reference',
  'source_revision_reference',
  'fixture_reference',
  'approval_state_field',
  'runtime_behavior_change_field',
  'privacy_redaction_field',
  'artifact_generation_command',
  'schema_approval_authority',
  'behavior_change_approval',
  'verdict'
];

const affectedCallableSemanticEvidenceArtifactValidatorRows = [
  'FT-WLCACHE-SEMANTIC-VALIDATOR-00-source-owner',
  'FT-WLCACHE-SEMANTIC-VALIDATOR-01-trigger-caller',
  'FT-WLCACHE-SEMANTIC-VALIDATOR-02-settings-mode',
  'FT-WLCACHE-SEMANTIC-VALIDATOR-03-route-surface',
  'FT-WLCACHE-SEMANTIC-VALIDATOR-04-side-effect',
  'FT-WLCACHE-SEMANTIC-VALIDATOR-05-no-work',
  'FT-WLCACHE-SEMANTIC-VALIDATOR-06-teardown-idempotence',
  'FT-WLCACHE-SEMANTIC-VALIDATOR-07-fixtures'
];

const affectedCallableSemanticEvidenceArtifactValidatorChecks = [
  'rejectMissingArtifact',
  'rejectSchemaVersionMismatch',
  'rejectSourceRevisionMismatch',
  'rejectIncompleteFileFieldCells',
  'rejectMissingEvidencePayload',
  'rejectMissingPositiveNegativeFixtures',
  'rejectUnapprovedBehaviorChange',
  'rejectReleaseClaimWithoutApproval'
];

const affectedCallableSemanticEvidenceArtifactValidatorContractRows =
  affectedCallableSemanticEvidenceArtifactValidatorRows.map((id, index) => ({
    id,
    artifactSchemaRow: affectedCallableSemanticEvidenceArtifactSchemaRows[index],
    artifactRow: affectedCallableSemanticEvidenceArtifactRows[index],
    artifactClass: affectedCallableSemanticEvidenceArtifactClasses[index],
    artifactPath: affectedCallableSemanticEvidenceArtifactPaths[index],
    requiredCheckCount: 8,
    approved: false
  }));

const affectedCallableSemanticEvidenceArtifactValidatorFields = [
  'semantic_artifact_validator_row_id',
  'packet_id',
  'method_gap_source_path',
  'artifact_schema_contract',
  'semantic_artifact_schema_row_id',
  'semantic_artifact_row_id',
  'evidence_artifact_class',
  'artifact_path',
  'validator_entrypoint',
  'validator_checks',
  'missing_artifact_rejection',
  'schema_version_rejection',
  'source_revision_rejection',
  'file_field_cell_coverage_rejection',
  'evidence_payload_rejection',
  'fixture_rejection',
  'behavior_change_rejection',
  'release_claim_rejection',
  'validator_output_path',
  'validator_approval_authority',
  'behavior_change_approval',
  'verdict'
];

const routeModeCallableFields = [
  'packet_id',
  'affected_callable_row_id',
  'route_start',
  'route_end',
  'surface',
  'list_mode_state',
  'settings_enabled',
  'rule_state',
  'expected_work_family',
  'allowed_work_reason',
  'forbidden_work_reason',
  'observed_counter_required',
  'side_effect_preservation',
  'verdict'
];

const affectedCallableAnchorChecks = [
  ['js/filter_logic.js', 58, 'function queueVideoChannelMapping(videoId, channelId) {'],
  ['js/filter_logic.js', 94, 'function queueVideoMetaMapping(videoId, meta) {'],
  ['js/filter_logic.js', 1957, '_shouldBlock(item, rendererType) {'],
  ['js/filter_logic.js', 2065, "if (listMode === 'whitelist' && !isCommentRenderer) {"],
  ['js/content_bridge.js', 1217, 'function installRightRailWhitelistObserver() {'],
  ['js/content_bridge.js', 1225, 'const runWhitelistRefreshPass = () => {'],
  ['js/content_bridge.js', 1391, 'async function prefetchIdentityForCard({ videoId, card }) {'],
  ['js/content_bridge.js', 1638, 'function persistVideoChannelMapping(videoId, channelId) {'],
  ['js/content_bridge.js', 1649, 'function persistVideoMetaMapping(entries = []) {'],
  ['js/content_bridge.js', 1714, 'function scheduleVideoMetaDomRerun() {'],
  ['js/content_bridge.js', 5851, "} else if (type === 'FilterTube_UpdateVideoChannelMap') {"],
  ['js/content_bridge.js', 5900, "} else if (type === 'FilterTube_UpdateVideoMetaMap') {"],
  ['js/content/bridge_settings.js', 557, 'function scheduleSettingsRefreshFromStorage({ forceReprocess = true } = {}) {'],
  ['js/content/bridge_settings.js', 589, 'function handleStorageChanges(changes, area) {'],
  ['js/background.js', 1648, 'function enqueueVideoChannelMapUpdate(videoId, channelId) {'],
  ['js/background.js', 1673, 'function enqueueVideoMetaMapUpdate(videoId, meta) {'],
  ['js/background.js', 1774, 'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false) {'],
  ['js/content/dom_fallback.js', 2035, 'async function applyDOMFallback(settings, options = {}) {'],
  ['js/content/dom_fallback.js', 3947, "if (onlyWhitelistPending && listMode === 'whitelist') {"],
  ['js/content/handle_resolver.js', 136, 'function scheduleDomFallbackRerun() {'],
  ['js/content/handle_resolver.js', 149, 'async function fetchIdForHandle(handle, options = {}) {'],
  ['js/seed.js', 220, 'function hasActiveJsonFilterRules(settings) {'],
  ['js/seed.js', 253, 'function shouldBypassYouTubeiNetworkResponse(dataName) {'],
  ['js/seed.js', 263, 'function shouldSkipEngineProcessing(data, dataName) {'],
  ['js/injector.js', 171, 'function hasActiveJsonFilterRules(settings) {'],
  ['js/injector.js', 3405, 'function processDataWithFilterLogic(data, dataName) {']
];

const transportNoWorkAnchorChecks = [
  ['js/seed.js', 234, 'function hasNetworkJsonWork(settings) {'],
  ['js/seed.js', 235, 'if (!settings || settings.enabled === false) return false;'],
  ['js/seed.js', 236, "if (settings.listMode === 'whitelist') return true;"],
  ['js/seed.js', 240, 'function shouldCaptureRawSnapshot() {'],
  ['js/seed.js', 241, 'return Boolean(cachedSettings && hasNetworkJsonWork(cachedSettings));'],
  ['js/seed.js', 253, 'function shouldBypassYouTubeiNetworkResponse(dataName) {'],
  ['js/seed.js', 258, 'if (hasNetworkJsonWork(cachedSettings)) return false;'],
  ['js/seed.js', 260, 'return true;'],
  ['js/seed.js', 263, 'function shouldSkipEngineProcessing(data, dataName) {'],
  ['js/seed.js', 311, "if (mode !== 'whitelist') {"],
  ['js/seed.js', 337, "if (mode !== 'whitelist' && !activeContentFilters && !activeJsonFilterRules) {"],
  ['js/seed.js', 352, "if (mode === 'whitelist') return false;"],
  ['js/seed.js', 406, 'if (!hasNetworkJsonWork(cachedSettings)) {'],
  ['js/seed.js', 416, 'if (shouldSkipEngineProcessing(data, dataName)) {'],
  ['js/seed.js', 423, 'window.FilterTubeEngine.harvestOnly(data, cachedSettings || { filterChannels: [], filterKeywords: [] });'],
  ['js/seed.js', 1002, 'if (!hasNetworkJsonWork(cachedSettings)) {'],
  ['js/seed.js', 1003, 'pendingDataQueue = [];'],
  ['js/seed.js', 1004, 'rawYtInitialData = null;'],
  ['js/injector.js', 185, 'function hasNetworkJsonWork(settings) {'],
  ['js/injector.js', 186, 'if (!settings || settings.enabled === false) return false;'],
  ['js/injector.js', 187, "if (settings.listMode === 'whitelist') return true;"],
  ['js/injector.js', 3405, 'function processDataWithFilterLogic(data, dataName) {'],
  ['js/injector.js', 3412, 'if (!hasNetworkJsonWork(currentSettings)) {'],
  ['js/injector.js', 3427, 'function processInitialDataQueue() {'],
  ['js/injector.js', 3433, 'if (!hasNetworkJsonWork(currentSettings)) {']
];

const requiredMetricArtifacts = [
  'docs/audit/artifacts/json-first/route-surface-metric-artifact/metric-sample.json',
  'docs/audit/artifacts/json-first/route-surface-metric-artifact/no-work-budget.json',
  'docs/audit/artifacts/json-first/route-surface-metric-artifact/side-effect-budget.json',
  'docs/audit/artifacts/json-first/route-surface-metric-artifact/fixture-provenance.json',
  'docs/audit/artifacts/json-first/route-surface-metric-artifact/verification-output.tap'
];

const productFiles = [
  'manifest.json',
  'js/seed.js',
  'js/injector.js',
  'js/filter_logic.js',
  'js/content_bridge.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/content/bridge_settings.js',
  'js/background.js',
  'js/state_manager.js',
  'js/settings_shared.js',
  'js/io_manager.js',
  'build.js',
  'scripts/build-extension-ui.mjs',
  'scripts/build-nanah-vendor.mjs',
  'scripts/sync-native-runtime.mjs'
];

const futureAuthorityTokens = [
  'whitelistCacheSpaMetricPacketGate',
  'whitelistCacheSpaMetricPacketReport',
  'whitelistCacheSpaRouteMetricArtifact',
  'whitelistCacheSpaLiveSmokeArtifact',
  'whitelistCacheSpaInstalledByteParity',
  'whitelistCacheSpaTransportBudget',
  'whitelistCacheSpaDomLifecycleBudget',
  'whitelistCacheSpaBehaviorInvariantReport',
  'whitelistCacheSpaJsonFirstFirstClassGate',
  'whitelistCacheSpaOptimizationApproval',
  'whitelistCacheSpaInstalledByteParityGate',
  'whitelistCacheSpaInstalledByteParityPacket',
  'whitelistCacheSpaActiveTabRuntimeMarker',
  'whitelistCacheSpaExtensionReloadTimestamp',
  'whitelistCacheSpaLoadedContentScriptHash',
  'whitelistCacheSpaAutomationProfileSubstitution',
  'whitelistCacheSpaIncognitoRuntimeProof',
  'whitelistCacheSpaLiveSmokeAcceptance',
  'whitelistCacheSpaReleaseReadinessApproval',
  'whitelistCacheSpaRouteModeMatrixGate',
  'whitelistCacheSpaRouteModeObservation',
  'whitelistCacheSpaListModeStateMatrix',
  'whitelistCacheSpaRouteModeReleaseApproval',
  'whitelistCacheSpaWorkBudgetGate',
  'whitelistCacheSpaTransportBudgetMatrix',
  'whitelistCacheSpaDomLifecycleBudgetMatrix',
  'whitelistCacheSpaRouteModeWorkBudget',
  'whitelistCacheSpaWorkBudgetReleaseApproval',
  'whitelistCacheSpaPendingCacheGate',
  'whitelistCacheSpaPendingRailMatrix',
  'whitelistCacheSpaCacheRefreshMatrix',
  'whitelistCacheSpaFalseHideLeakSample',
  'whitelistCacheSpaForceReprocessMetric',
  'whitelistCacheSpaPendingCacheReleaseApproval',
  'whitelistCacheSpaSettingsBehaviorGate',
  'whitelistCacheSpaSettingsMutationMatrix',
  'whitelistCacheSpaBehaviorInvariantMatrix',
  'whitelistCacheSpaSettingsRevisionSample',
  'whitelistCacheSpaMenuQuickInvariantSample',
  'whitelistCacheSpaSettingsBehaviorReleaseApproval',
  'whitelistCacheSpaJsonFirstRolloutGate',
  'whitelistCacheSpaJsonFirstPromotionMatrix',
  'whitelistCacheSpaRolloutNonclaimMatrix',
  'whitelistCacheSpaRecommendationNoninteractionProof',
  'whitelistCacheSpaRollbackPlan',
  'whitelistCacheSpaReleaseShipDecision',
  'whitelistCacheSpaPacketExpansionClosure',
  'whitelistCacheSpaPacketExpansionClosureApproval'
];

const affectedCallableFutureAuthorityTokens = [
  'whitelistCacheSpaAffectedCallableAuthority',
  'whitelistCacheSpaAffectedCallableReport',
  'whitelistCacheSpaAffectedCallableApproval',
  'whitelistCacheRouteModeCallableAuthority',
  'whitelistCacheSpaRouteModeCallableBudgetAuthority',
  'whitelistCacheSpaRouteModeCallableBudgetReport',
  'whitelistCacheSpaRouteModeCallableBudgetApproval',
  'whitelistCacheSpaRouteModeCallableBudgetArtifactContract',
  'whitelistCacheSpaRouteModeCallableBudgetArtifactReport',
  'whitelistCacheSpaRouteModeCallableBudgetArtifactPromotion',
  'whitelistCacheSpaRouteModeCallableBudgetArtifactSchemaContract',
  'whitelistCacheSpaRouteModeCallableBudgetArtifactSchemaReport',
  'whitelistCacheSpaRouteModeCallableBudgetArtifactSchemaApproval',
  'whitelistCacheSpaRouteModeCallableBudgetArtifactSchemaAuthority',
  'whitelistCacheSpaRouteModeCallableBudgetArtifactValidatorContract',
  'whitelistCacheSpaRouteModeCallableBudgetArtifactValidatorReport',
  'whitelistCacheSpaRouteModeCallableBudgetArtifactValidatorApproval',
  'whitelistCacheSpaRouteModeCallableBudgetArtifactValidatorAuthority',
  'whitelistCacheSpaRouteModeCallableBudgetSourceOwnerContract',
  'whitelistCacheSpaRouteModeCallableBudgetSourceOwnerReport',
  'whitelistCacheSpaRouteModeCallableBudgetSourceOwnerApproval',
  'whitelistCacheSpaRouteModeCallableBudgetCollectorPreflightContract',
  'whitelistCacheSpaRouteModeCallableBudgetCollectorPreflightReport',
  'whitelistCacheSpaRouteModeCallableBudgetCollectorPreflightApproval',
  'whitelistCacheSpaRouteModeCallableBudgetCollectorApprovalDependencyClosure',
  'whitelistCacheSpaRouteModeCallableBudgetCollectorApprovalDependencyReport',
  'whitelistCacheSpaRouteModeCallableBudgetCollectorApprovalDependencyApproval',
  'whitelistCacheSpaRouteModeCallableBudgetRuntimeCollectorApproval',
  'whitelistCacheSpaAffectedCallableSemanticGapBinding',
  'whitelistCacheSpaAffectedCallableSemanticGapReport',
  'whitelistCacheSpaAffectedCallableSemanticGapApproval',
  'whitelistCacheSpaAffectedCallableSemanticProofAuthority',
  'whitelistCacheSpaAffectedCallableSemanticFieldClosure',
  'whitelistCacheSpaAffectedCallableSemanticFieldReport',
  'whitelistCacheSpaAffectedCallableSemanticFieldApproval',
  'whitelistCacheSpaAffectedCallableSemanticFieldProofAuthority',
  'whitelistCacheSpaAffectedCallableSemanticFileFieldMatrix',
  'whitelistCacheSpaAffectedCallableSemanticFileFieldReport',
  'whitelistCacheSpaAffectedCallableSemanticFileFieldApproval',
  'whitelistCacheSpaAffectedCallableSemanticFileFieldProofAuthority',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceRequirement',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceReport',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceApproval',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactAuthority',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactRegistry',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactRegistryReport',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactRegistryApproval',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactPathAuthority',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactSchemaContract',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactSchemaReport',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactSchemaApproval',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactSchemaAuthority',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactValidatorContract',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactValidatorReport',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactValidatorApproval',
  'whitelistCacheSpaAffectedCallableSemanticEvidenceArtifactValidatorAuthority',
  'whitelistCacheSpaTransportNoWorkAuthority',
  'whitelistCacheSpaTransportNoWorkReport',
  'whitelistCacheSpaTransportNoWorkApproval',
  'whitelistCacheSpaLiveEvidenceExecutionBlockerMap',
  'whitelistCacheSpaLiveEvidenceExecutionReport',
  'whitelistCacheSpaLiveEvidenceExecutionApproval',
  'whitelistCacheSpaLiveEvidenceResultArtifactContract',
  'whitelistCacheSpaLiveEvidenceResultArtifactReport',
  'whitelistCacheSpaLiveEvidenceResultArtifactApproval',
  'whitelistCacheSpaLiveEvidenceResultArtifactPromotion',
  'whitelistCacheSpaAffectedCallableSourceFingerprint',
  'whitelistCacheSpaAffectedCallableSourceOwnerApproval',
  'jsonFirstCacheAffectedCallableAuthority',
  'liveSmokeAffectedCallableTrace'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineAt(file, lineNumber) {
  return read(file).split('\n')[lineNumber - 1] || '';
}

function fileStats(file) {
  const source = read(file);
  return {
    lines: source.split('\n').length,
    bytes: Buffer.byteLength(source),
    sha256: crypto.createHash('sha256').update(source).digest('hex')
  };
}

function methodSemanticGapRow(methodGapDoc, file) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const row = methodGapDoc.match(new RegExp('\\| `' + escaped + '` \\| ([^|]+) \\| (\\d+) \\| `semantic proof incomplete` \\|'));
  assert.ok(row, `method semantic gap index missing ${file}`);
  return {
    family: row[1].trim(),
    lexicalCallables: Number(row[2])
  };
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function jsonBlockWithSchema(markdown, schemaVersion) {
  const jsonBlocks = [...markdown.matchAll(/```json\n([\s\S]*?)\n```/g)].map(match => match[1]);
  for (const block of jsonBlocks) {
    const parsed = JSON.parse(block);
    if (parsed.schemaVersion === schemaVersion) return parsed;
  }
  return null;
}

function productSource() {
  return productFiles.filter(exists).map(read).join('\n');
}

function recursiveFiles(dir) {
  const root = path.join(repoRoot, dir);
  if (!fs.existsSync(root)) return [];
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else files.push(path.relative(repoRoot, full).replaceAll(path.sep, '/'));
    }
  };
  visit(root);
  return files.sort();
}

test('whitelist/cache SPA metric packet gate is audit-only and source-backed', () => {
  const doc = read(docPath);
  const affectedDoc = read(affectedCallableDocPath);

  assert.match(doc, /Status: audit-only current-behavior whitelist\/cache SPA metric packet gate/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /selected metric packet gate: FT-WLCACHE-SPA-PACKET-00-binding/);
  assert.match(doc, /whitelist\/cache SPA metric packet rows: 12/);
  assert.match(doc, /live YouTube SPA smoke rows required: 6/);
  assert.match(doc, /route\/surface metric artifact files required: 5/);
  assert.match(doc, /committed whitelist\/cache SPA metric packet files: 0/);
  assert.match(doc, /committed live YouTube SPA smoke result files: 0/);
  assert.match(doc, /runtime whitelist\/cache optimization approvals: 0/);
  assert.match(doc, /runtime JSON-first first-class promotion approvals: 0/);
  assert.match(doc, /release readiness from this gate: NO-GO/);
  assert.match(doc, /not completion proof for whitelist\/cache optimization/);
  assert.match(doc, /selected packet row: FT-WLCACHE-SPA-PACKET-01-installed-profile-bytes/);
  assert.match(doc, /installed byte parity gate rows: 12/);
  assert.match(doc, /required installed byte parity fields: 14/);
  assert.match(doc, /runner installed byte parity schema: PRESENT/);
  assert.match(doc, /runner smoke-slice readiness without byte parity: NONRELEASE_ONLY/);
  assert.match(doc, /active YouTube tab content-script byte authority: NO-GO/);
  assert.match(doc, /extension reload timestamp authority: NO-GO/);
  assert.match(doc, /connected Chrome profile parity probe: NOT-PARITY/);
  assert.match(doc, /installed Chrome CDP preflight: UNAVAILABLE/);
  assert.match(doc, /live smoke acceptance from this gate: NO-GO/);
  assert.match(doc, /2026-05-30 Connected Chrome Profile Probe Addendum/);
  assert.match(doc, /connected Chrome profile parity probe rows: 5/);
  assert.match(doc, /connected Chrome profile label observed: Devansh/);
  assert.match(doc, /FilterTube extension id from user-visible screenshots: gkgjigdfdccckblmglboobikfcpeelio/);
  assert.match(doc, /connected open-tab matches for FilterTube or YouTube: 0/);
  assert.match(doc, /connected Chrome profile accepted as installed-byte parity: NO-GO/);
  assert.match(doc, /new Chrome profile\/window opened for this probe: no/);
  assert.match(doc, /2026-05-31 Installed Chrome CDP Preflight Addendum/);
  assert.match(doc, /installed Chrome CDP preflight rows: 4/);
  assert.match(doc, /Chrome running process observed: yes/);
  assert.match(doc, /CDP endpoint status: unavailable/);
  assert.match(doc, /installed Chrome CDP preflight accepted as live smoke proof: NO-GO/);
  assert.match(doc, /selected packet rows: FT-WLCACHE-SPA-PACKET-02-route-sequence, FT-WLCACHE-SPA-PACKET-03-list-modes/);
  assert.match(doc, /route sequence rows required: 6/);
  assert.match(doc, /list-mode states required: 6/);
  assert.match(doc, /route-mode observation cells required: 36/);
  assert.match(doc, /required route-mode fields: 16/);
  assert.match(doc, /committed route-mode matrix files: 0/);
  assert.match(doc, /runtime route-mode smoke approvals: 0/);
  assert.match(doc, /route-mode release readiness: NO-GO/);
  assert.match(doc, /selected packet rows: FT-WLCACHE-SPA-PACKET-04-transport-no-work, FT-WLCACHE-SPA-PACKET-05-dom-lifecycle/);
  assert.match(doc, /transport budget rows required: 8/);
  assert.match(doc, /DOM lifecycle budget rows required: 10/);
  assert.match(doc, /required work-budget fields: 18/);
  assert.match(doc, /committed route-mode work-budget files: 0/);
  assert.match(doc, /runtime work-budget collectors approved: 0/);
  assert.match(doc, /work-budget release readiness: NO-GO/);
  assert.match(doc, /selected packet rows: FT-WLCACHE-SPA-PACKET-06-whitelist-pending-rail, FT-WLCACHE-SPA-PACKET-07-cache-refresh/);
  assert.match(doc, /pending-hide rail rows required: 10/);
  assert.match(doc, /cache refresh rows required: 10/);
  assert.match(doc, /required pending\/cache fields: 20/);
  assert.match(doc, /committed pending\/cache metric files: 0/);
  assert.match(doc, /runtime pending\/cache collectors approved: 0/);
  assert.match(doc, /pending\/cache release readiness: NO-GO/);
  assert.match(doc, /selected packet rows: FT-WLCACHE-SPA-PACKET-08-settings-mutation, FT-WLCACHE-SPA-PACKET-09-behavior-invariants/);
  assert.match(doc, /settings mutation rows required: 10/);
  assert.match(doc, /behavior invariant rows required: 10/);
  assert.match(doc, /required settings\/behavior fields: 20/);
  assert.match(doc, /committed settings\/behavior metric files: 0/);
  assert.match(doc, /runtime settings\/behavior collectors approved: 0/);
  assert.match(doc, /settings\/behavior release readiness: NO-GO/);
  assert.match(doc, /selected packet rows: FT-WLCACHE-SPA-PACKET-10-json-first-first-class-gate, FT-WLCACHE-SPA-PACKET-11-rollout-nonclaim/);
  assert.match(doc, /JSON-first promotion rows required: 10/);
  assert.match(doc, /rollout nonclaim rows required: 10/);
  assert.match(doc, /required JSON-first\/rollout fields: 20/);
  assert.match(doc, /committed JSON-first\/rollout metric files: 0/);
  assert.match(doc, /runtime JSON-first\/rollout collectors approved: 0/);
  assert.match(doc, /JSON-first\/rollout release readiness: NO-GO/);
  assert.match(doc, /packet row expansion rows: 7/);
  assert.match(doc, /packet rows covered by expansion rows: 12/);
  assert.match(doc, /packet rows without an expansion row: 0/);
  assert.match(doc, /implementation packet artifacts committed: 0/);
  assert.match(doc, /executed live smoke artifacts committed: 0/);
  assert.match(doc, /packet row expansion closure: ROW-EXPANSION-CLOSED/);
  assert.match(doc, /release readiness from expansion closure: NO-GO/);
  assert.match(doc, /2026-05-30 Current-Source Freshness Addendum/);
  assert.match(doc, /current-source freshness rows: 8/);
  assert.match(doc, /packet rows still covered by expansion rows: 12/);
  assert.match(doc, /executed live smoke artifacts committed: 0/);
  assert.match(doc, /route\/surface metric artifacts committed: 0/);
  assert.match(doc, /runtime metric collectors approved: 0/);
  assert.match(doc, /installed-tab byte parity trace: MISSING/);
  assert.match(doc, /release readiness from current-source freshness: NO-GO/);

  for (const sourceDoc of sourceDocs) {
    assert.ok(exists(sourceDoc), `missing source input ${sourceDoc}`);
    assert.ok(doc.includes(sourceDoc), `doc does not cite ${sourceDoc}`);
  }

  assert.match(affectedDoc, /Status: audit-only current-behavior whitelist\/cache SPA affected-callable proof boundary/);
  assert.match(affectedDoc, /Runtime behavior is unchanged/);
  assert.match(affectedDoc, /selected affected-callable packet: FT-WLCACHE-SPA-AFFECTED-00-boundary/);
  assert.match(affectedDoc, /affected callable proof rows: 12/);
  assert.match(affectedDoc, /affected source files covered: 8/);
  assert.match(affectedDoc, /line or branch anchors covered: 26/);
  assert.match(affectedDoc, /affected source fingerprint rows: 8/);
  assert.match(affectedDoc, /route\/mode callable obligation rows: 8/);
  assert.match(affectedDoc, /route\/mode states considered: 6/);
  assert.match(affectedDoc, /route\/mode callable budget fields required: 14/);
  assert.match(affectedDoc, /route\/mode callable budget contract rows: 8/);
  assert.match(affectedDoc, /route\/mode callable budget artifact paths reserved: 1/);
  assert.match(affectedDoc, /committed route\/mode callable budget artifacts: 0/);
  assert.match(affectedDoc, /route\/mode callable budget artifact root exists: no/);
  assert.match(affectedDoc, /route\/mode callable budget JSON sections: 8/);
  assert.match(affectedDoc, /route\/mode callable budget route cells required: 36/);
  assert.match(affectedDoc, /route\/mode callable budget counter families required: 6/);
  assert.match(affectedDoc, /route\/mode callable budget artifact required fields: 24/);
  assert.match(affectedDoc, /route\/mode callable budget artifact schema rows: 8/);
  assert.match(affectedDoc, /route\/mode callable budget artifact schema field groups required: 8/);
  assert.match(affectedDoc, /route\/mode callable budget artifact schemas approved: 0/);
  assert.match(affectedDoc, /route\/mode callable budget artifact schema fields required: 24/);
  assert.match(affectedDoc, /route\/mode callable budget artifact validator rows: 8/);
  assert.match(affectedDoc, /route\/mode callable budget artifact validator check families required: 8/);
  assert.match(affectedDoc, /route\/mode callable budget artifact validators approved: 0/);
  assert.match(affectedDoc, /route\/mode callable budget artifact validator fields required: 26/);
  assert.match(affectedDoc, /route\/mode callable budget source-owner contract rows: 8/);
  assert.match(affectedDoc, /route\/mode callable budget source-owner files covered: 8/);
  assert.match(affectedDoc, /route\/mode callable budget source-owner anchors reused: 26/);
  assert.match(affectedDoc, /route\/mode callable budget source-owner required fields: 18/);
  assert.match(affectedDoc, /route\/mode callable budget collector preflight rows: 8/);
  assert.match(affectedDoc, /route\/mode callable budget collector preflight fields required: 20/);
  assert.match(affectedDoc, /route\/mode callable budget collector preflight counter families covered: 6/);
  assert.match(affectedDoc, /route\/mode callable budget collector approval dependency rows: 12/);
  assert.match(affectedDoc, /route\/mode callable budget collector approval upstream docs covered: 10/);
  assert.match(affectedDoc, /route\/mode callable budget collector approval dependency fields required: 20/);
  assert.match(affectedDoc, /affected callable semantic gap binding rows: 8/);
  assert.match(affectedDoc, /affected source files with method-gap rows: 8/);
  assert.match(affectedDoc, /affected lexical callables requiring semantic proof: 2854/);
  assert.match(affectedDoc, /affected semantic proof required fields: 8/);
  assert.match(affectedDoc, /affected callable semantic required-field closure rows: 8/);
  assert.match(affectedDoc, /affected callable semantic file-field cells required: 64/);
  assert.match(affectedDoc, /affected callable semantic required-field closure fields required: 16/);
  assert.match(affectedDoc, /affected callable semantic file-field matrix rows: 8/);
  assert.match(affectedDoc, /affected callable semantic file-field matrix cells required: 64/);
  assert.match(affectedDoc, /affected callable semantic file-field matrix approved cells: 0/);
  assert.match(affectedDoc, /affected callable semantic file-field matrix fields required: 18/);
  assert.match(affectedDoc, /affected callable semantic evidence requirement rows: 8/);
  assert.match(affectedDoc, /affected callable semantic evidence file-field cells gated: 64/);
  assert.match(affectedDoc, /affected callable semantic evidence required artifacts: 8/);
  assert.match(affectedDoc, /affected callable semantic evidence approved artifacts: 0/);
  assert.match(affectedDoc, /affected callable semantic evidence closure fields required: 18/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact registry rows: 8/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact paths reserved: 8/);
  assert.match(affectedDoc, /committed affected callable semantic evidence artifacts: 0/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact registry fields required: 20/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact root exists: no/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact schema rows: 8/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact schema field groups required: 8/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact schemas approved: 0/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact schema fields required: 20/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact validator rows: 8/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact validator check families required: 8/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact validators approved: 0/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact validator fields required: 22/);
  assert.match(affectedDoc, /affected files with complete per-callable semantic proof: 0/);
  assert.match(affectedDoc, /transport no-work source evidence rows: 8/);
  assert.match(affectedDoc, /transport no-work source anchors covered: 25/);
  assert.match(affectedDoc, /live evidence execution blocker rows: 8/);
  assert.match(affectedDoc, /live evidence execution blocker fields required: 15/);
  assert.match(affectedDoc, /live evidence result artifact contract rows: 8/);
  assert.match(affectedDoc, /live evidence result artifact path reserved: 1/);
  assert.ok(affectedDoc.includes(liveEvidenceResultArtifactPath));
  assert.match(affectedDoc, /committed live evidence result artifacts: 0/);
  assert.match(affectedDoc, /live evidence result artifact root exists: no/);
  assert.match(affectedDoc, /live evidence result artifact route cells required: 36/);
  assert.match(affectedDoc, /live evidence result artifact counter families covered: 6/);
  assert.match(affectedDoc, /live evidence result artifact fields required: 24/);
  assert.match(affectedDoc, /live evidence result artifact schema rows: 8/);
  assert.match(affectedDoc, /live evidence result artifact schema field groups required: 8/);
  assert.match(affectedDoc, /live evidence result artifact schemas approved: 0/);
  assert.match(affectedDoc, /live evidence result artifact schema fields required: 24/);
  assert.match(affectedDoc, /live evidence result artifact validator rows: 8/);
  assert.match(affectedDoc, /live evidence result artifact validator check families required: 8/);
  assert.match(affectedDoc, /live evidence result artifact validators approved: 0/);
  assert.match(affectedDoc, /live evidence result artifact validator fields required: 26/);
  assert.match(affectedDoc, /current implementation-ready affected callable rows: 0/);
  assert.match(affectedDoc, /implementation-ready route\/mode callable rows: 0/);
  assert.match(affectedDoc, /route\/mode callable budget implementation-ready rows: 0/);
  assert.match(affectedDoc, /route\/mode callable budget artifact schema implementation-ready rows: 0/);
  assert.match(affectedDoc, /route\/mode callable budget artifact validator implementation-ready rows: 0/);
  assert.match(affectedDoc, /route\/mode callable budget source-owner implementation-ready rows: 0/);
  assert.match(affectedDoc, /route\/mode callable budget collector preflight implementation-ready rows: 0/);
  assert.match(affectedDoc, /route\/mode callable budget collector approval dependency implementation-ready rows: 0/);
  assert.match(affectedDoc, /implementation-ready affected semantic rows: 0/);
  assert.match(affectedDoc, /implementation-ready affected semantic field rows: 0/);
  assert.match(affectedDoc, /implementation-ready affected semantic matrix rows: 0/);
  assert.match(affectedDoc, /implementation-ready affected semantic evidence rows: 0/);
  assert.match(affectedDoc, /implementation-ready affected semantic artifact rows: 0/);
  assert.match(affectedDoc, /implementation-ready affected semantic artifact schema rows: 0/);
  assert.match(affectedDoc, /implementation-ready affected semantic artifact validator rows: 0/);
  assert.match(affectedDoc, /implementation-ready transport no-work rows: 0/);
  assert.match(affectedDoc, /implementation-ready live evidence execution blocker rows: 0/);
  assert.match(affectedDoc, /implementation-ready live evidence result artifact rows: 0/);
  assert.match(affectedDoc, /implementation-ready live evidence result artifact schema rows: 0/);
  assert.match(affectedDoc, /implementation-ready live evidence result artifact validator rows: 0/);
  assert.match(affectedDoc, /runtime whitelist\/cache optimization approvals: 0/);
  assert.match(affectedDoc, /runtime route\/mode callable budget approvals: 0/);
  assert.match(affectedDoc, /runtime route\/mode callable budget artifact schema approvals: 0/);
  assert.match(affectedDoc, /runtime route\/mode callable budget artifact validator approvals: 0/);
  assert.match(affectedDoc, /runtime route\/mode callable budget source-owner approvals: 0/);
  assert.match(affectedDoc, /runtime route\/mode callable budget collector insertion approvals: 0/);
  assert.match(affectedDoc, /runtime route\/mode callable budget collector approvals: 0/);
  assert.match(affectedDoc, /runtime route\/mode callable budget collector approval dependencies approved: 0/);
  assert.match(affectedDoc, /runtime affected callable semantic approvals: 0/);
  assert.match(affectedDoc, /runtime affected callable semantic field approvals: 0/);
  assert.match(affectedDoc, /runtime affected callable semantic matrix approvals: 0/);
  assert.match(affectedDoc, /runtime affected callable semantic evidence approvals: 0/);
  assert.match(affectedDoc, /runtime affected callable semantic artifact approvals: 0/);
  assert.match(affectedDoc, /runtime affected callable semantic artifact schema approvals: 0/);
  assert.match(affectedDoc, /runtime affected callable semantic artifact validator approvals: 0/);
  assert.match(affectedDoc, /runtime transport no-work approvals: 0/);
  assert.match(affectedDoc, /runtime live evidence execution approvals: 0/);
  assert.match(affectedDoc, /runtime live evidence result artifact approvals: 0/);
  assert.match(affectedDoc, /runtime live evidence result artifact schema approvals: 0/);
  assert.match(affectedDoc, /runtime live evidence result artifact validator approvals: 0/);
  assert.match(affectedDoc, /runtime JSON-first first-class promotion approvals: 0/);
  assert.match(affectedDoc, /release readiness from affected callable proof: NO-GO/);
  assert.match(affectedDoc, /source fingerprint release readiness: NO-GO/);
  assert.match(affectedDoc, /route\/mode callable budget release readiness: NO-GO/);
  assert.match(affectedDoc, /route\/mode callable budget artifact promotion decision: NO-GO/);
  assert.match(affectedDoc, /route\/mode callable budget artifact schema promotion decision: NO-GO/);
  assert.match(affectedDoc, /route\/mode callable budget artifact validator promotion decision: NO-GO/);
  assert.match(affectedDoc, /route\/mode callable budget source-owner promotion decision: NO-GO/);
  assert.match(affectedDoc, /route\/mode callable budget collector preflight promotion decision: NO-GO/);
  assert.match(affectedDoc, /route\/mode callable budget collector approval dependency promotion decision: NO-GO/);
  assert.match(affectedDoc, /affected callable semantic proof promotion decision: NO-GO/);
  assert.match(affectedDoc, /affected callable semantic required-field promotion decision: NO-GO/);
  assert.match(affectedDoc, /affected callable semantic file-field matrix promotion decision: NO-GO/);
  assert.match(affectedDoc, /affected callable semantic evidence promotion decision: NO-GO/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact registry promotion decision: NO-GO/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact schema promotion decision: NO-GO/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact validator promotion decision: NO-GO/);
  assert.match(affectedDoc, /transport no-work release readiness: NO-GO/);
  assert.match(affectedDoc, /live evidence execution release readiness: NO-GO/);
  assert.match(affectedDoc, /live evidence result artifact promotion decision: NO-GO/);
  assert.match(affectedDoc, /live evidence result artifact schema promotion decision: NO-GO/);
  assert.match(affectedDoc, /live evidence result artifact validator promotion decision: NO-GO/);
  assert.match(affectedDoc, /not completion proof for whitelist\/cache optimization/);
  assert.match(affectedDoc, /affected callable packet defined: GO/);
  assert.match(affectedDoc, /line anchors current-source verified: GO/);
  assert.match(affectedDoc, /affected source fingerprints current-source verified: GO/);
  assert.match(affectedDoc, /route\/mode callable obligation matrix defined: GO/);
  assert.match(affectedDoc, /define route\/mode callable budget artifact contract: GO/);
  assert.match(affectedDoc, /parse inline route\/mode callable budget JSON contract: GO/);
  assert.match(affectedDoc, /define route\/mode callable budget artifact schema contract: GO/);
  assert.match(affectedDoc, /parse inline route\/mode callable budget artifact schema JSON contract: GO/);
  assert.match(affectedDoc, /define route\/mode callable budget artifact validator contract: GO/);
  assert.match(affectedDoc, /parse inline route\/mode callable budget artifact validator JSON contract: GO/);
  assert.match(affectedDoc, /define route\/mode callable budget source-owner contract: GO/);
  assert.match(affectedDoc, /parse inline route\/mode callable budget source-owner JSON contract: GO/);
  assert.match(affectedDoc, /define route\/mode callable budget collector preflight contract: GO/);
  assert.match(affectedDoc, /parse inline route\/mode callable budget collector preflight JSON contract: GO/);
  assert.match(affectedDoc, /define route\/mode callable budget collector approval dependency closure: GO/);
  assert.match(affectedDoc, /parse inline route\/mode callable budget collector approval dependency JSON contract: GO/);
  assert.match(affectedDoc, /define affected callable semantic gap binding: GO/);
  assert.match(affectedDoc, /parse inline affected callable semantic gap JSON contract: GO/);
  assert.match(affectedDoc, /define affected callable semantic required-field closure: GO/);
  assert.match(affectedDoc, /parse inline affected callable semantic required-field JSON contract: GO/);
  assert.match(affectedDoc, /define affected callable semantic file-field matrix: GO/);
  assert.match(affectedDoc, /parse inline affected callable semantic file-field matrix JSON contract: GO/);
  assert.match(affectedDoc, /define affected callable semantic evidence requirement closure: GO/);
  assert.match(affectedDoc, /parse inline affected callable semantic evidence requirement JSON contract: GO/);
  assert.match(affectedDoc, /define affected callable semantic evidence artifact registry: GO/);
  assert.match(affectedDoc, /parse inline affected callable semantic evidence artifact registry JSON contract: GO/);
  assert.match(affectedDoc, /define affected callable semantic evidence artifact schema contract: GO/);
  assert.match(affectedDoc, /parse inline affected callable semantic evidence artifact schema JSON contract: GO/);
  assert.match(affectedDoc, /define affected callable semantic evidence artifact validator contract: GO/);
  assert.match(affectedDoc, /parse inline affected callable semantic evidence artifact validator JSON contract: GO/);
  assert.match(affectedDoc, /transport no-work source evidence defined: GO/);
  assert.match(affectedDoc, /define live evidence execution blocker map: GO/);
  assert.match(affectedDoc, /parse inline live evidence execution blocker JSON contract: GO/);
  assert.match(affectedDoc, /define live evidence result artifact contract: GO/);
  assert.match(affectedDoc, /parse inline live evidence result artifact JSON contract: GO/);
  assert.match(affectedDoc, /define live evidence result artifact schema contract: GO/);
  assert.match(affectedDoc, /parse inline live evidence result artifact schema JSON contract: GO/);
  assert.match(affectedDoc, /define live evidence result artifact validator contract: GO/);
  assert.match(affectedDoc, /parse inline live evidence result artifact validator JSON contract: GO/);
  assert.match(affectedDoc, /commit route\/mode callable budget artifact now: NO-GO/);
  assert.match(affectedDoc, /create route\/mode callable budget artifact root now: NO-GO/);
  assert.match(affectedDoc, /promote route\/mode callable budget artifact schema contract now: NO-GO/);
  assert.match(affectedDoc, /use route\/mode callable budget artifact schema as metric proof now: NO-GO/);
  assert.match(affectedDoc, /use route\/mode callable budget artifact schema as optimization approval now: NO-GO/);
  assert.match(affectedDoc, /promote route\/mode callable budget artifact validator contract now: NO-GO/);
  assert.match(affectedDoc, /use route\/mode callable budget artifact validator as metric proof now: NO-GO/);
  assert.match(affectedDoc, /use route\/mode callable budget artifact validator as optimization approval now: NO-GO/);
  assert.match(affectedDoc, /promote route\/mode callable budget source-owner contract now: NO-GO/);
  assert.match(affectedDoc, /use route\/mode callable budget source-owner contract as collector approval now: NO-GO/);
  assert.match(affectedDoc, /promote route\/mode callable budget collector preflight contract now: NO-GO/);
  assert.match(affectedDoc, /use route\/mode callable budget collector preflight as runtime collector insertion approval now: NO-GO/);
  assert.match(affectedDoc, /use route\/mode callable budget collector preflight as artifact promotion approval now: NO-GO/);
  assert.match(affectedDoc, /promote route\/mode callable budget collector approval dependency closure now: NO-GO/);
  assert.match(affectedDoc, /use route\/mode callable budget collector approval dependency closure as runtime collector approval now: NO-GO/);
  assert.match(affectedDoc, /use route\/mode callable budget collector approval dependency closure as whitelist\/cache optimization approval now: NO-GO/);
  assert.match(affectedDoc, /promote affected callable semantic proof from gap binding now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic gap binding as optimization approval now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic gap binding as route\/mode collector approval now: NO-GO/);
  assert.match(affectedDoc, /promote affected callable semantic required-field closure now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic required-field closure as per-callable proof now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic required-field closure as optimization approval now: NO-GO/);
  assert.match(affectedDoc, /promote affected callable semantic file-field matrix now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic file-field matrix as per-file proof now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic file-field matrix as optimization approval now: NO-GO/);
  assert.match(affectedDoc, /promote affected callable semantic evidence requirement closure now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic evidence requirement closure as file-field proof now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic evidence requirement closure as optimization approval now: NO-GO/);
  assert.match(affectedDoc, /create affected callable semantic evidence artifact root now: NO-GO/);
  assert.match(affectedDoc, /commit affected callable semantic evidence artifacts now: NO-GO/);
  assert.match(affectedDoc, /promote affected callable semantic evidence artifact registry now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic evidence artifact registry as proof now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic evidence artifact registry as optimization approval now: NO-GO/);
  assert.match(affectedDoc, /promote affected callable semantic evidence artifact schema contract now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic evidence artifact schema as artifact proof now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic evidence artifact schema as optimization approval now: NO-GO/);
  assert.match(affectedDoc, /promote affected callable semantic evidence artifact validator contract now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic evidence artifact validator as artifact proof now: NO-GO/);
  assert.match(affectedDoc, /use affected callable semantic evidence artifact validator as optimization approval now: NO-GO/);
  assert.match(affectedDoc, /treat affected-callable anchors as measured budget evidence now: NO-GO/);
  assert.match(affectedDoc, /use source-only transport no-work evidence as live budget approval now: NO-GO/);
  assert.match(affectedDoc, /accept connected Chrome profile inventory as live evidence now: NO-GO/);
  assert.match(affectedDoc, /accept scratch\/private Chrome profile as installed-profile proof now: NO-GO/);
  assert.match(affectedDoc, /accept source-only affected-callable packet as live execution proof now: NO-GO/);
  assert.match(affectedDoc, /accept live evidence blocker map as executed smoke proof now: NO-GO/);
  assert.match(affectedDoc, /commit live evidence result artifact now: NO-GO/);
  assert.match(affectedDoc, /create live evidence result artifact root now: NO-GO/);
  assert.match(affectedDoc, /promote live evidence result artifact contract now: NO-GO/);
  assert.match(affectedDoc, /use live evidence result artifact contract as executed smoke proof now: NO-GO/);
  assert.match(affectedDoc, /use live evidence result artifact contract as release approval now: NO-GO/);
  assert.match(affectedDoc, /promote live evidence result artifact schema contract now: NO-GO/);
  assert.match(affectedDoc, /use live evidence result artifact schema as artifact proof now: NO-GO/);
  assert.match(affectedDoc, /use live evidence result artifact schema as optimization approval now: NO-GO/);
  assert.match(affectedDoc, /promote live evidence result artifact validator contract now: NO-GO/);
  assert.match(affectedDoc, /use live evidence result artifact validator as executed smoke proof now: NO-GO/);
  assert.match(affectedDoc, /use live evidence result artifact validator as release approval now: NO-GO/);
  assert.match(affectedDoc, /approve whitelist\/cache optimization from this contract now: NO-GO/);
  assert.match(affectedDoc, /approve JSON-first first-class filtering from this contract now: NO-GO/);
  assert.match(affectedDoc, /approve release\/public performance claim from this contract now: NO-GO/);
  assert.match(affectedDoc, /use affected callable packet as optimization approval now: NO-GO/);
  assert.match(affectedDoc, /use affected source fingerprints as source-owner approval now: NO-GO/);
  assert.match(affectedDoc, /use route\/mode callable matrix as work-budget approval now: NO-GO/);
  assert.match(affectedDoc, /use transport no-work evidence as live budget approval now: NO-GO/);
  assert.match(affectedDoc, /use affected callable packet as JSON-first promotion approval now: NO-GO/);
  assert.match(affectedDoc, /use affected callable packet as release readiness now: NO-GO/);

  for (const sourceDoc of affectedCallableSourceDocs) {
    assert.ok(exists(sourceDoc), `missing affected-callable source input ${sourceDoc}`);
    assert.ok(affectedDoc.includes(sourceDoc), `affected-callable doc does not cite ${sourceDoc}`);
  }
});

test('packet rows, live smoke rows, and diagrams remain explicit', () => {
  const doc = read(docPath);
  const affectedDoc = read(affectedCallableDocPath);
  const selectedPacketRow = doc.match(/selected metric packet gate: (FT-WLCACHE-SPA-PACKET-[^\n]+)/)?.[1];
  const rows = [...doc.matchAll(/^\| `(FT-WLCACHE-SPA-PACKET-[^`]+)` \|/gm)].map(match => match[1]);
  const byteRows = [...doc.matchAll(/^\| `(FT-WLCACHE-BYTE-[^`]+)` \|/gm)].map(match => match[1]);
  const routeRows = [...doc.matchAll(/^\| `(FT-LIVE-SPA-[^`]+)` \|/gm)].map(match => match[1]);
  const modeRows = [...doc.matchAll(/^\| `(FT-WLCACHE-MODE-[^`]+)` \|/gm)].map(match => match[1]);
  const transportRows = [...doc.matchAll(/^\| `(FT-WLCACHE-WORK-TRANSPORT-[^`]+)` \|/gm)].map(match => match[1]);
  const domRows = [...doc.matchAll(/^\| `(FT-WLCACHE-WORK-DOM-[^`]+)` \|/gm)].map(match => match[1]);
  const pendingRows = [...doc.matchAll(/^\| `(FT-WLCACHE-PENDING-RAIL-[^`]+)` \|/gm)].map(match => match[1]);
  const cacheRows = [...doc.matchAll(/^\| `(FT-WLCACHE-CACHE-REFRESH-[^`]+)` \|/gm)].map(match => match[1]);
  const settingsRows = [...doc.matchAll(/^\| `(FT-WLCACHE-SETTINGS-MUTATION-[^`]+)` \|/gm)].map(match => match[1]);
  const behaviorRows = [...doc.matchAll(/^\| `(FT-WLCACHE-BEHAVIOR-[^`]+)` \|/gm)].map(match => match[1]);
  const jsonRows = [...doc.matchAll(/^\| `(FT-WLCACHE-JSON-FIRST-[^`]+)` \|/gm)].map(match => match[1]);
  const rolloutRowsInDoc = [...doc.matchAll(/^\| `(FT-WLCACHE-ROLLOUT-[^`]+)` \|/gm)].map(match => match[1]);
  const expansionRows = [...doc.matchAll(/^\| `(FT-WLCACHE-SPA-EXPANSION-[^`]+)` \|/gm)].map(match => match[1]);
  const affectedRows = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-AFFECTED-[^`]+)` \|/gm)].map(match => match[1]);
  const routeModeCallableRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-ROUTEMODE-CALLABLE-[^`]+)` \|/gm)].map(match => match[1]);
  const routeModeCallableBudgetRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-ROUTEMODE-BUDGET-[^`]+)` \|/gm)].map(match => match[1]);
  const routeModeCallableBudgetSchemaRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-ROUTEMODE-SCHEMA-[^`]+)` \|/gm)].map(match => match[1]);
  const routeModeCallableBudgetValidatorRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-ROUTEMODE-VALIDATOR-[^`]+)` \|/gm)].map(match => match[1]);
  const routeModeCallableBudgetSourceOwnerRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-ROUTEMODE-OWNER-[^`]+)` \|/gm)].map(match => match[1]);
  const routeModeCallableBudgetCollectorPreflightRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-ROUTEMODE-COLLECTOR-[^`]+)` \|/gm)].map(match => match[1]);
  const routeModeCallableBudgetCollectorApprovalRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-ROUTEMODE-COLLECTOR-APPROVAL-[^`]+)` \|/gm)].map(match => match[1]);
  const affectedCallableSemanticGapRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-SEMANTIC-GAP-[^`]+)` \|/gm)].map(match => match[1]);
  const affectedCallableSemanticFieldRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-SEMANTIC-FIELD-[^`]+)` \|/gm)].map(match => match[1]);
  const affectedCallableSemanticMatrixRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-SEMANTIC-MATRIX-[^`]+)` \|/gm)].map(match => match[1]);
  const affectedCallableSemanticEvidenceRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-SEMANTIC-EVIDENCE-[^`]+)` \|/gm)].map(match => match[1]);
  const affectedCallableSemanticEvidenceArtifactRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-SEMANTIC-ARTIFACT-[^`]+)` \|/gm)].map(match => match[1]);
  const affectedCallableSemanticEvidenceArtifactSchemaRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-SEMANTIC-SCHEMA-[^`]+)` \|/gm)].map(match => match[1]);
  const affectedCallableSemanticEvidenceArtifactValidatorRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-SEMANTIC-VALIDATOR-[^`]+)` \|/gm)].map(match => match[1]);
  const transportNoWorkRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-TRANSPORT-NOWORK-[^`]+)` \|/gm)].map(match => match[1]);
  const liveEvidenceExecutionBlockerRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-LIVE-BLOCKER-[^`]+)` \|/gm)].map(match => match[1]);
  const liveEvidenceResultRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-LIVE-RESULT-[^`]+)` \|/gm)].map(match => match[1]);
  const liveEvidenceResultSchemaRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-LIVE-SCHEMA-[^`]+)` \|/gm)].map(match => match[1]);
  const liveEvidenceResultValidatorRowsInDoc = [...affectedDoc.matchAll(/^\| `(FT-WLCACHE-LIVE-VALIDATOR-[^`]+)` \|/gm)].map(match => match[1]);
  const routeModeCallableBudgetContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-route-mode-callable-budget-contract-2026-05-30'
  );
  const routeModeCallableBudgetArtifactSchemaContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-route-mode-callable-budget-artifact-schema-contract-2026-05-30'
  );
  const routeModeCallableBudgetArtifactValidatorContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-route-mode-callable-budget-artifact-validator-contract-2026-05-30'
  );
  const routeModeCallableBudgetSourceOwnerContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-route-mode-callable-budget-source-owner-contract-2026-05-30'
  );
  const routeModeCallableBudgetCollectorPreflightContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-route-mode-callable-budget-collector-preflight-contract-2026-05-30'
  );
  const routeModeCallableBudgetCollectorApprovalDependencyContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-route-mode-callable-budget-collector-approval-dependency-closure-2026-05-30'
  );
  const affectedCallableSemanticGapContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-affected-callable-semantic-gap-binding-2026-05-30'
  );
  const affectedCallableSemanticRequiredFieldContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-affected-callable-semantic-required-field-closure-2026-05-30'
  );
  const affectedCallableSemanticFileFieldMatrixContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-affected-callable-semantic-file-field-matrix-2026-05-30'
  );
  const affectedCallableSemanticEvidenceRequirementContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-affected-callable-semantic-evidence-requirement-closure-2026-05-30'
  );
  const affectedCallableSemanticEvidenceArtifactRegistryContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-affected-callable-semantic-evidence-artifact-registry-2026-05-30'
  );
  const affectedCallableSemanticEvidenceArtifactSchemaContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-affected-callable-semantic-evidence-artifact-schema-contract-2026-05-30'
  );
  const affectedCallableSemanticEvidenceArtifactValidatorContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-affected-callable-semantic-evidence-artifact-validator-contract-2026-05-30'
  );
  const liveEvidenceExecutionBlockerContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-live-evidence-execution-blocker-map-2026-05-30'
  );
  const liveEvidenceResultArtifactContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-live-evidence-result-artifact-contract-2026-05-30'
  );
  const liveEvidenceResultArtifactSchemaContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-live-evidence-result-artifact-schema-contract-2026-05-30'
  );
  const liveEvidenceResultArtifactValidatorContract = jsonBlockWithSchema(
    affectedDoc,
    'whitelist-cache-spa-live-evidence-result-artifact-validator-contract-2026-05-30'
  );

  assert.deepEqual(rows, packetRows);
  assert.equal(selectedPacketRow, 'FT-WLCACHE-SPA-PACKET-00-binding');
  assert.ok(rows.includes(selectedPacketRow), `selected packet row is not declared: ${selectedPacketRow}`);
  assert.deepEqual(byteRows, installedByteParityRows);
  assert.deepEqual(routeRows, liveSmokeRows);
  assert.deepEqual(modeRows, routeModeStates);
  assert.deepEqual(transportRows, transportBudgetRows);
  assert.deepEqual(domRows, domLifecycleBudgetRows);
  assert.deepEqual(pendingRows, pendingRailRows);
  assert.deepEqual(cacheRows, cacheRefreshRows);
  assert.deepEqual(settingsRows, settingsMutationRows);
  assert.deepEqual(behaviorRows, behaviorInvariantRows);
  assert.deepEqual(jsonRows, jsonFirstRows);
  assert.deepEqual(rolloutRowsInDoc, rolloutRows);
  assert.deepEqual(expansionRows, packetExpansionRows);
  assert.deepEqual(affectedRows, affectedCallableRows);
  assert.deepEqual(routeModeCallableRowsInDoc, routeModeCallableRows);
  assert.deepEqual(routeModeCallableBudgetRowsInDoc, routeModeCallableBudgetSections);
  assert.deepEqual(routeModeCallableBudgetSchemaRowsInDoc, routeModeCallableBudgetSchemaRows);
  assert.deepEqual(routeModeCallableBudgetValidatorRowsInDoc, routeModeCallableBudgetValidatorRows);
  assert.deepEqual(routeModeCallableBudgetSourceOwnerRowsInDoc, routeModeCallableBudgetSourceOwnerRows);
  assert.deepEqual(
    routeModeCallableBudgetCollectorPreflightRowsInDoc.filter(row => !row.includes('-APPROVAL-')),
    routeModeCallableBudgetCollectorPreflightRows
  );
  assert.deepEqual(routeModeCallableBudgetCollectorApprovalRowsInDoc, routeModeCallableBudgetCollectorApprovalDependencyRows);
  assert.deepEqual(affectedCallableSemanticGapRowsInDoc, affectedCallableSemanticGapRows);
  assert.deepEqual(affectedCallableSemanticFieldRowsInDoc, affectedCallableSemanticFieldRows);
  assert.deepEqual(affectedCallableSemanticMatrixRowsInDoc, affectedCallableSemanticMatrixRows);
  assert.deepEqual(affectedCallableSemanticEvidenceRowsInDoc, affectedCallableSemanticEvidenceRows);
  assert.deepEqual(affectedCallableSemanticEvidenceArtifactRowsInDoc, affectedCallableSemanticEvidenceArtifactRows);
  assert.deepEqual(
    affectedCallableSemanticEvidenceArtifactSchemaRowsInDoc,
    affectedCallableSemanticEvidenceArtifactSchemaRows
  );
  assert.deepEqual(
    affectedCallableSemanticEvidenceArtifactValidatorRowsInDoc,
    affectedCallableSemanticEvidenceArtifactValidatorRows
  );
  assert.deepEqual(transportNoWorkRowsInDoc, transportNoWorkRows);
  assert.deepEqual(liveEvidenceExecutionBlockerRowsInDoc, liveEvidenceExecutionBlockerRows);
  assert.deepEqual(liveEvidenceResultRowsInDoc, liveEvidenceResultRows);
  assert.deepEqual(liveEvidenceResultSchemaRowsInDoc, liveEvidenceResultSchemaRows);
  assert.deepEqual(liveEvidenceResultValidatorRowsInDoc, liveEvidenceResultValidatorRows);
  assert.ok(routeModeCallableBudgetContract, 'missing route/mode callable budget JSON contract');
  assert.equal(routeModeCallableBudgetContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(routeModeCallableBudgetContract.artifactPath, routeModeCallableBudgetArtifactPath);
  assert.equal(routeModeCallableBudgetContract.artifactPromotionDecision, 'NO-GO');
  assert.equal(routeModeCallableBudgetContract.runtimeBehaviorChanged, false);
  assert.deepEqual(routeModeCallableBudgetContract.routeRows, liveSmokeRows);
  assert.deepEqual(routeModeCallableBudgetContract.listModeStates, routeModeStates);
  assert.deepEqual(
    routeModeCallableBudgetContract.sections.map(section => section.id),
    routeModeCallableBudgetSections
  );
  assert.deepEqual(
    routeModeCallableBudgetContract.requiredCounterFamilies,
    routeModeCallableBudgetCounterFamilies
  );
  assert.deepEqual(routeModeCallableBudgetContract.requiredFields, routeModeCallableBudgetFields);
  assert.ok(routeModeCallableBudgetArtifactSchemaContract, 'missing route/mode callable budget artifact schema JSON contract');
  assert.equal(routeModeCallableBudgetArtifactSchemaContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(routeModeCallableBudgetArtifactSchemaContract.artifactPath, routeModeCallableBudgetArtifactPath);
  assert.equal(routeModeCallableBudgetArtifactSchemaContract.schemaPromotionDecision, 'NO-GO');
  assert.equal(routeModeCallableBudgetArtifactSchemaContract.runtimeBehaviorChanged, false);
  assert.deepEqual(routeModeCallableBudgetArtifactSchemaContract.schemaRows, routeModeCallableBudgetSchemaRows);
  assert.deepEqual(routeModeCallableBudgetArtifactSchemaContract.requiredFieldGroups, routeModeCallableBudgetFieldGroups);
  assert.deepEqual(routeModeCallableBudgetArtifactSchemaContract.requiredFields, routeModeCallableBudgetFields);
  assert.deepEqual(routeModeCallableBudgetArtifactSchemaContract.approvalCounts, {
    schemaRows: 8,
    fieldGroupsRequired: 8,
    approvedSchemas: 0,
    implementationReadyRows: 0,
    runtimeSchemaApprovals: 0
  });
  assert.ok(routeModeCallableBudgetArtifactValidatorContract, 'missing route/mode callable budget artifact validator JSON contract');
  assert.equal(routeModeCallableBudgetArtifactValidatorContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(routeModeCallableBudgetArtifactValidatorContract.artifactPath, routeModeCallableBudgetArtifactPath);
  assert.equal(routeModeCallableBudgetArtifactValidatorContract.validatorPromotionDecision, 'NO-GO');
  assert.equal(routeModeCallableBudgetArtifactValidatorContract.runtimeBehaviorChanged, false);
  assert.deepEqual(routeModeCallableBudgetArtifactValidatorContract.validatorRows, routeModeCallableBudgetValidatorRows);
  assert.deepEqual(
    routeModeCallableBudgetArtifactValidatorContract.requiredCheckFamilies,
    routeModeCallableBudgetValidatorCheckFamilies
  );
  assert.deepEqual(
    routeModeCallableBudgetArtifactValidatorContract.requiredFields,
    routeModeCallableBudgetValidatorFields
  );
  assert.deepEqual(routeModeCallableBudgetArtifactValidatorContract.failClosedRules, [
    'missing_route_mode_cell_fails',
    'missing_required_field_fails',
    'missing_installed_byte_parity_fails',
    'missing_source_owner_fails',
    'missing_behavior_invariant_fails',
    'missing_approval_boundary_fails'
  ]);
  assert.deepEqual(routeModeCallableBudgetArtifactValidatorContract.approvalCounts, {
    validatorRows: 8,
    checkFamiliesRequired: 8,
    approvedValidators: 0,
    implementationReadyRows: 0,
    runtimeValidatorApprovals: 0
  });
  assert.ok(routeModeCallableBudgetSourceOwnerContract, 'missing route/mode callable budget source-owner JSON contract');
  assert.equal(routeModeCallableBudgetSourceOwnerContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(routeModeCallableBudgetSourceOwnerContract.artifactPath, routeModeCallableBudgetArtifactPath);
  assert.equal(routeModeCallableBudgetSourceOwnerContract.sourceOwnerPromotionDecision, 'NO-GO');
  assert.equal(routeModeCallableBudgetSourceOwnerContract.runtimeBehaviorChanged, false);
  assert.deepEqual(routeModeCallableBudgetSourceOwnerContract.sourceOwnerRows, routeModeCallableBudgetSourceOwnerRows);
  assert.deepEqual(routeModeCallableBudgetSourceOwnerContract.sourceFiles, affectedCallableFingerprintFiles);
  assert.deepEqual(
    routeModeCallableBudgetSourceOwnerContract.counterFamilyOwners.map(row => row.family),
    routeModeCallableBudgetCounterFamilies
  );
  assert.deepEqual(routeModeCallableBudgetSourceOwnerContract.requiredFields, routeModeCallableBudgetSourceOwnerFields);
  assert.ok(routeModeCallableBudgetCollectorPreflightContract, 'missing route/mode callable budget collector preflight JSON contract');
  assert.equal(routeModeCallableBudgetCollectorPreflightContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(routeModeCallableBudgetCollectorPreflightContract.artifactPath, routeModeCallableBudgetArtifactPath);
  assert.equal(routeModeCallableBudgetCollectorPreflightContract.collectorPreflightPromotionDecision, 'NO-GO');
  assert.equal(routeModeCallableBudgetCollectorPreflightContract.runtimeBehaviorChanged, false);
  assert.deepEqual(
    routeModeCallableBudgetCollectorPreflightContract.collectorPreflightRows,
    routeModeCallableBudgetCollectorPreflightRows
  );
  assert.deepEqual(
    routeModeCallableBudgetCollectorPreflightContract.collectorFamilies,
    routeModeCallableBudgetCounterFamilies
  );
  assert.deepEqual(routeModeCallableBudgetCollectorPreflightContract.upstreamContracts, [
    'whitelist-cache-spa-route-mode-callable-budget-contract-2026-05-30',
    'whitelist-cache-spa-route-mode-callable-budget-artifact-schema-contract-2026-05-30',
    'whitelist-cache-spa-route-mode-callable-budget-artifact-validator-contract-2026-05-30',
    'whitelist-cache-spa-route-mode-callable-budget-source-owner-contract-2026-05-30'
  ]);
  assert.deepEqual(
    routeModeCallableBudgetCollectorPreflightContract.requiredFields,
    routeModeCallableBudgetCollectorPreflightFields
  );
  assert.ok(
    routeModeCallableBudgetCollectorApprovalDependencyContract,
    'missing route/mode callable budget collector approval dependency JSON contract'
  );
  assert.equal(routeModeCallableBudgetCollectorApprovalDependencyContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(routeModeCallableBudgetCollectorApprovalDependencyContract.artifactPath, routeModeCallableBudgetArtifactPath);
  assert.equal(
    routeModeCallableBudgetCollectorApprovalDependencyContract.collectorApprovalDependencyPromotionDecision,
    'NO-GO'
  );
  assert.equal(routeModeCallableBudgetCollectorApprovalDependencyContract.runtimeBehaviorChanged, false);
  assert.deepEqual(
    routeModeCallableBudgetCollectorApprovalDependencyContract.dependencyRows,
    routeModeCallableBudgetCollectorApprovalDependencyRows
  );
  assert.deepEqual(
    routeModeCallableBudgetCollectorApprovalDependencyContract.upstreamBoundaryDocs,
    routeModeCallableBudgetCollectorApprovalUpstreamDocs
  );
  assert.deepEqual(
    routeModeCallableBudgetCollectorApprovalDependencyContract.requiredMissingApprovals,
    routeModeCallableBudgetCollectorRequiredMissingApprovals
  );
  assert.deepEqual(routeModeCallableBudgetCollectorApprovalDependencyContract.approvalCounts, {
    runtimeCollectorApprovals: 0,
    runtimeCollectorInsertionApprovals: 0,
    runtimeCollectorNoWorkApprovals: 0,
    runtimeCollectorSideEffectApprovals: 0,
    runtimeCollectorFixtureApprovals: 0,
    runtimeCollectorDiagnosticPrivacyApprovals: 0,
    runtimeCollectorParityRolloutApprovals: 0,
    runtimeCollectorVerificationOutputApprovals: 0,
    runtimeRollbackApprovals: 0,
    runtimeUnclaimedSurfaceApprovals: 0,
    implementationReadyDependencyRows: 0
  });
  assert.deepEqual(
    routeModeCallableBudgetCollectorApprovalDependencyContract.requiredFields,
    routeModeCallableBudgetCollectorApprovalDependencyFields
  );
  assert.ok(affectedCallableSemanticGapContract, 'missing affected callable semantic gap binding JSON contract');
  assert.equal(affectedCallableSemanticGapContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(affectedCallableSemanticGapContract.methodGapPath, methodSemanticGapPath);
  assert.equal(affectedCallableSemanticGapContract.affectedSemanticPromotionDecision, 'NO-GO');
  assert.equal(affectedCallableSemanticGapContract.runtimeBehaviorChanged, false);
  assert.deepEqual(affectedCallableSemanticGapContract.methodGapTotals, {
    filesCovered: 69,
    lexicalCallablesCovered: 5681,
    filesWithCompletePerCallableSemanticProof: 0,
    requiredSemanticProofFields: 8
  });
  assert.deepEqual(affectedCallableSemanticGapContract.affectedFiles, affectedCallableSemanticFiles);
  assert.deepEqual(affectedCallableSemanticGapContract.requiredSemanticFields, affectedCallableSemanticRequiredFields);
  assert.deepEqual(affectedCallableSemanticGapContract.approvalCounts, {
    affectedFileRows: 8,
    affectedLexicalCallablesRequiringSemanticProof: 2854,
    filesWithCompletePerCallableSemanticProof: 0,
    implementationReadyAffectedSemanticRows: 0,
    runtimeAffectedCallableSemanticApprovals: 0
  });
  assert.deepEqual(affectedCallableSemanticGapContract.blockingMissingProof, [
    'perCallableOwnerTriggerInputSurfaceProof',
    'noWorkDisabledEmptyRuleProof',
    'sideEffectAndTeardownProof',
    'positiveNegativeFixtureSet',
    'liveRouteModeBudgetArtifact',
    'behaviorChangeApproval'
  ]);
  assert.deepEqual(affectedCallableSemanticGapContract.requiredFields, affectedCallableSemanticBindingFields);
  assert.ok(
    affectedCallableSemanticRequiredFieldContract,
    'missing affected callable semantic required-field JSON contract'
  );
  assert.equal(affectedCallableSemanticRequiredFieldContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(affectedCallableSemanticRequiredFieldContract.methodGapPath, methodSemanticGapPath);
  assert.equal(
    affectedCallableSemanticRequiredFieldContract.semanticGapBindingSchema,
    'whitelist-cache-spa-affected-callable-semantic-gap-binding-2026-05-30'
  );
  assert.equal(affectedCallableSemanticRequiredFieldContract.semanticRequiredFieldPromotionDecision, 'NO-GO');
  assert.equal(affectedCallableSemanticRequiredFieldContract.runtimeBehaviorChanged, false);
  assert.deepEqual(affectedCallableSemanticRequiredFieldContract.affectedSourceFiles, affectedCallableFingerprintFiles);
  assert.deepEqual(affectedCallableSemanticRequiredFieldContract.fieldRows, affectedCallableSemanticFieldRows);
  assert.deepEqual(
    affectedCallableSemanticRequiredFieldContract.requiredSemanticFields,
    affectedCallableSemanticRequiredFields
  );
  assert.deepEqual(affectedCallableSemanticRequiredFieldContract.approvalCounts, {
    affectedSemanticFieldRows: 8,
    affectedSourceFiles: 8,
    fileFieldCellsRequired: 64,
    implementationReadySemanticFieldRows: 0,
    runtimeAffectedCallableSemanticFieldApprovals: 0
  });
  assert.deepEqual(
    affectedCallableSemanticRequiredFieldContract.requiredFields,
    affectedCallableSemanticRequiredFieldClosureFields
  );
  assert.ok(
    affectedCallableSemanticFileFieldMatrixContract,
    'missing affected callable semantic file-field matrix JSON contract'
  );
  assert.equal(affectedCallableSemanticFileFieldMatrixContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(affectedCallableSemanticFileFieldMatrixContract.methodGapPath, methodSemanticGapPath);
  assert.equal(
    affectedCallableSemanticFileFieldMatrixContract.semanticRequiredFieldSchema,
    'whitelist-cache-spa-affected-callable-semantic-required-field-closure-2026-05-30'
  );
  assert.equal(affectedCallableSemanticFileFieldMatrixContract.semanticFileFieldMatrixPromotionDecision, 'NO-GO');
  assert.equal(affectedCallableSemanticFileFieldMatrixContract.runtimeBehaviorChanged, false);
  assert.deepEqual(affectedCallableSemanticFileFieldMatrixContract.matrixRows, affectedCallableSemanticMatrixFiles);
  assert.deepEqual(
    affectedCallableSemanticFileFieldMatrixContract.requiredSemanticFields,
    affectedCallableSemanticRequiredFields
  );
  assert.deepEqual(affectedCallableSemanticFileFieldMatrixContract.approvalCounts, {
    matrixRows: 8,
    fileFieldCellsRequired: 64,
    approvedFileFieldCells: 0,
    implementationReadyMatrixRows: 0,
    runtimeAffectedCallableSemanticMatrixApprovals: 0
  });
  assert.deepEqual(
    affectedCallableSemanticFileFieldMatrixContract.requiredFields,
    affectedCallableSemanticMatrixFields
  );
  assert.ok(
    affectedCallableSemanticEvidenceRequirementContract,
    'missing affected callable semantic evidence requirement JSON contract'
  );
  assert.equal(affectedCallableSemanticEvidenceRequirementContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(affectedCallableSemanticEvidenceRequirementContract.methodGapPath, methodSemanticGapPath);
  assert.equal(
    affectedCallableSemanticEvidenceRequirementContract.semanticFileFieldMatrixSchema,
    'whitelist-cache-spa-affected-callable-semantic-file-field-matrix-2026-05-30'
  );
  assert.equal(
    affectedCallableSemanticEvidenceRequirementContract.semanticEvidencePromotionDecision,
    'NO-GO'
  );
  assert.equal(affectedCallableSemanticEvidenceRequirementContract.runtimeBehaviorChanged, false);
  assert.deepEqual(
    affectedCallableSemanticEvidenceRequirementContract.evidenceRows,
    affectedCallableSemanticEvidenceRows
  );
  assert.deepEqual(
    affectedCallableSemanticEvidenceRequirementContract.evidenceArtifactClasses,
    affectedCallableSemanticEvidenceArtifactClasses
  );
  assert.deepEqual(affectedCallableSemanticEvidenceRequirementContract.approvalCounts, {
    evidenceRows: 8,
    fileFieldCellsGated: 64,
    requiredEvidenceArtifacts: 8,
    approvedEvidenceArtifacts: 0,
    implementationReadyEvidenceRows: 0,
    runtimeAffectedCallableSemanticEvidenceApprovals: 0
  });
  assert.deepEqual(
    affectedCallableSemanticEvidenceRequirementContract.requiredFields,
    affectedCallableSemanticEvidenceFields
  );
  assert.ok(
    affectedCallableSemanticEvidenceArtifactRegistryContract,
    'missing affected callable semantic evidence artifact registry JSON contract'
  );
  assert.equal(affectedCallableSemanticEvidenceArtifactRegistryContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(affectedCallableSemanticEvidenceArtifactRegistryContract.methodGapPath, methodSemanticGapPath);
  assert.equal(
    affectedCallableSemanticEvidenceArtifactRegistryContract.semanticEvidenceRequirementSchema,
    'whitelist-cache-spa-affected-callable-semantic-evidence-requirement-closure-2026-05-30'
  );
  assert.equal(
    affectedCallableSemanticEvidenceArtifactRegistryContract.artifactRegistryPromotionDecision,
    'NO-GO'
  );
  assert.equal(affectedCallableSemanticEvidenceArtifactRegistryContract.runtimeBehaviorChanged, false);
  assert.equal(
    affectedCallableSemanticEvidenceArtifactRegistryContract.artifactRoot,
    affectedCallableSemanticEvidenceArtifactRoot
  );
  assert.deepEqual(
    affectedCallableSemanticEvidenceArtifactRegistryContract.artifactRows,
    affectedCallableSemanticEvidenceArtifactRegistryRows
  );
  assert.deepEqual(affectedCallableSemanticEvidenceArtifactRegistryContract.approvalCounts, {
    artifactRows: 8,
    reservedArtifactPaths: 8,
    committedEvidenceArtifacts: 0,
    approvedEvidenceArtifacts: 0,
    implementationReadyArtifactRows: 0,
    runtimeAffectedCallableSemanticArtifactApprovals: 0
  });
  assert.deepEqual(
    affectedCallableSemanticEvidenceArtifactRegistryContract.requiredFields,
    affectedCallableSemanticEvidenceArtifactFields
  );
  assert.ok(
    affectedCallableSemanticEvidenceArtifactSchemaContract,
    'missing affected callable semantic evidence artifact schema JSON contract'
  );
  assert.equal(affectedCallableSemanticEvidenceArtifactSchemaContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(affectedCallableSemanticEvidenceArtifactSchemaContract.methodGapPath, methodSemanticGapPath);
  assert.equal(
    affectedCallableSemanticEvidenceArtifactSchemaContract.artifactRegistrySchema,
    'whitelist-cache-spa-affected-callable-semantic-evidence-artifact-registry-2026-05-30'
  );
  assert.equal(
    affectedCallableSemanticEvidenceArtifactSchemaContract.artifactSchemaPromotionDecision,
    'NO-GO'
  );
  assert.equal(affectedCallableSemanticEvidenceArtifactSchemaContract.runtimeBehaviorChanged, false);
  assert.deepEqual(
    affectedCallableSemanticEvidenceArtifactSchemaContract.requiredTopLevelFields,
    affectedCallableSemanticEvidenceArtifactTopLevelFields
  );
  assert.deepEqual(
    affectedCallableSemanticEvidenceArtifactSchemaContract.artifactSchemaRows,
    affectedCallableSemanticEvidenceArtifactSchemaContractRows
  );
  assert.deepEqual(affectedCallableSemanticEvidenceArtifactSchemaContract.approvalCounts, {
    artifactSchemaRows: 8,
    requiredSchemaFieldGroups: 8,
    approvedArtifactSchemas: 0,
    implementationReadyArtifactSchemaRows: 0,
    runtimeAffectedCallableSemanticArtifactSchemaApprovals: 0
  });
  assert.deepEqual(
    affectedCallableSemanticEvidenceArtifactSchemaContract.requiredFields,
    affectedCallableSemanticEvidenceArtifactSchemaFields
  );
  assert.ok(
    affectedCallableSemanticEvidenceArtifactValidatorContract,
    'missing affected callable semantic evidence artifact validator JSON contract'
  );
  assert.equal(affectedCallableSemanticEvidenceArtifactValidatorContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(affectedCallableSemanticEvidenceArtifactValidatorContract.methodGapPath, methodSemanticGapPath);
  assert.equal(
    affectedCallableSemanticEvidenceArtifactValidatorContract.artifactSchemaContractSchema,
    'whitelist-cache-spa-affected-callable-semantic-evidence-artifact-schema-contract-2026-05-30'
  );
  assert.equal(
    affectedCallableSemanticEvidenceArtifactValidatorContract.artifactValidatorPromotionDecision,
    'NO-GO'
  );
  assert.equal(affectedCallableSemanticEvidenceArtifactValidatorContract.runtimeBehaviorChanged, false);
  assert.deepEqual(
    affectedCallableSemanticEvidenceArtifactValidatorContract.requiredValidatorChecks,
    affectedCallableSemanticEvidenceArtifactValidatorChecks
  );
  assert.deepEqual(
    affectedCallableSemanticEvidenceArtifactValidatorContract.validatorRows,
    affectedCallableSemanticEvidenceArtifactValidatorContractRows
  );
  assert.deepEqual(affectedCallableSemanticEvidenceArtifactValidatorContract.approvalCounts, {
    validatorRows: 8,
    requiredValidatorCheckFamilies: 8,
    approvedArtifactValidators: 0,
    implementationReadyValidatorRows: 0,
    runtimeAffectedCallableSemanticArtifactValidatorApprovals: 0
  });
  assert.deepEqual(
    affectedCallableSemanticEvidenceArtifactValidatorContract.requiredFields,
    affectedCallableSemanticEvidenceArtifactValidatorFields
  );
  assert.ok(liveEvidenceExecutionBlockerContract, 'missing live evidence execution blocker JSON contract');
  assert.equal(liveEvidenceExecutionBlockerContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(liveEvidenceExecutionBlockerContract.metricPacketGate, 'FT-WLCACHE-SPA-PACKET-00-binding');
  assert.equal(liveEvidenceExecutionBlockerContract.liveEvidenceExecutionReleaseReadiness, 'NO-GO');
  assert.equal(liveEvidenceExecutionBlockerContract.runtimeBehaviorChanged, false);
  assert.deepEqual(liveEvidenceExecutionBlockerContract.liveSmokeRows, liveSmokeRows);
  assert.deepEqual(liveEvidenceExecutionBlockerContract.listModeStates, routeModeStates);
  assert.deepEqual(liveEvidenceExecutionBlockerContract.blockerRows, liveEvidenceExecutionBlockerRows);
  assert.deepEqual(liveEvidenceExecutionBlockerContract.rejectedSubstitutes, [
    'connectedChromeProfileInventoryWithoutRelevantYouTubeTab',
    'scratchOrPrivateChromeProfile',
    'incognitoProfileWithoutSeparateInstalledByteParity',
    'userScreenshotOnly',
    'sourceAnchorOnly',
    'runnerReadinessWithoutInstalledByteParity'
  ]);
  assert.deepEqual(liveEvidenceExecutionBlockerContract.requiredFields, liveEvidenceExecutionBlockerFields);
  assert.deepEqual(liveEvidenceExecutionBlockerContract.approvalCounts, {
    blockerRows: 8,
    implementationReadyBlockerRows: 0,
    runtimeLiveEvidenceExecutionApprovals: 0
  });
  assert.ok(liveEvidenceResultArtifactContract, 'missing live evidence result artifact JSON contract');
  assert.equal(liveEvidenceResultArtifactContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(liveEvidenceResultArtifactContract.artifactPath, liveEvidenceResultArtifactPath);
  assert.equal(liveEvidenceResultArtifactContract.artifactPromotionDecision, 'NO-GO');
  assert.equal(liveEvidenceResultArtifactContract.runtimeBehaviorChanged, false);
  assert.deepEqual(liveEvidenceResultArtifactContract.routeRows, liveSmokeRows);
  assert.deepEqual(liveEvidenceResultArtifactContract.listModeStates, routeModeStates);
  assert.deepEqual(liveEvidenceResultArtifactContract.counterFamilies, routeModeCallableBudgetCounterFamilies);
  assert.deepEqual(liveEvidenceResultArtifactContract.resultRows, liveEvidenceResultRows);
  assert.deepEqual(liveEvidenceResultArtifactContract.requiredFields, liveEvidenceResultFields);
  assert.deepEqual(liveEvidenceResultArtifactContract.approvalCounts, {
    resultRows: 8,
    routeCellsRequired: 36,
    committedArtifacts: 0,
    implementationReadyRows: 0,
    runtimeLiveEvidenceResultApprovals: 0
  });
  assert.ok(liveEvidenceResultArtifactSchemaContract, 'missing live evidence result artifact schema JSON contract');
  assert.equal(liveEvidenceResultArtifactSchemaContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(liveEvidenceResultArtifactSchemaContract.artifactPath, liveEvidenceResultArtifactPath);
  assert.equal(liveEvidenceResultArtifactSchemaContract.schemaPromotionDecision, 'NO-GO');
  assert.equal(liveEvidenceResultArtifactSchemaContract.runtimeBehaviorChanged, false);
  assert.deepEqual(liveEvidenceResultArtifactSchemaContract.schemaRows, liveEvidenceResultSchemaRows);
  assert.deepEqual(liveEvidenceResultArtifactSchemaContract.requiredFieldGroups, liveEvidenceResultFieldGroups);
  assert.deepEqual(liveEvidenceResultArtifactSchemaContract.requiredFields, liveEvidenceResultFields);
  assert.deepEqual(liveEvidenceResultArtifactSchemaContract.approvalCounts, {
    schemaRows: 8,
    fieldGroupsRequired: 8,
    approvedSchemas: 0,
    implementationReadyRows: 0,
    runtimeSchemaApprovals: 0
  });
  assert.ok(liveEvidenceResultArtifactValidatorContract, 'missing live evidence result artifact validator JSON contract');
  assert.equal(liveEvidenceResultArtifactValidatorContract.packetId, 'FT-WLCACHE-SPA-AFFECTED-00-boundary');
  assert.equal(liveEvidenceResultArtifactValidatorContract.artifactPath, liveEvidenceResultArtifactPath);
  assert.equal(liveEvidenceResultArtifactValidatorContract.validatorPromotionDecision, 'NO-GO');
  assert.equal(liveEvidenceResultArtifactValidatorContract.runtimeBehaviorChanged, false);
  assert.deepEqual(liveEvidenceResultArtifactValidatorContract.validatorRows, liveEvidenceResultValidatorRows);
  assert.deepEqual(liveEvidenceResultArtifactValidatorContract.requiredCheckFamilies, liveEvidenceResultValidatorCheckFamilies);
  assert.deepEqual(liveEvidenceResultArtifactValidatorContract.requiredFields, liveEvidenceResultValidatorFields);
  assert.deepEqual(liveEvidenceResultArtifactValidatorContract.failClosedRules, [
    'missing_route_mode_cell_fails',
    'missing_required_field_fails',
    'missing_installed_byte_parity_fails',
    'missing_behavior_invariant_fails',
    'missing_privacy_redaction_fails',
    'missing_approval_boundary_fails'
  ]);
  assert.deepEqual(liveEvidenceResultArtifactValidatorContract.approvalCounts, {
    validatorRows: 8,
    checkFamiliesRequired: 8,
    approvedValidators: 0,
    implementationReadyRows: 0,
    runtimeValidatorApprovals: 0
  });
  assert.equal(exists(routeModeCallableBudgetArtifactPath), false, `artifact should remain absent: ${routeModeCallableBudgetArtifactPath}`);
  assert.equal(exists(liveEvidenceResultArtifactPath), false, `artifact should remain absent: ${liveEvidenceResultArtifactPath}`);
  assert.equal(exists(routeModeCallableBudgetArtifactRoot), false, `artifact root should remain absent: ${routeModeCallableBudgetArtifactRoot}`);
  assert.equal(
    exists(affectedCallableSemanticEvidenceArtifactRoot),
    false,
    `artifact root should remain absent: ${affectedCallableSemanticEvidenceArtifactRoot}`
  );
  for (const artifactPath of affectedCallableSemanticEvidenceArtifactPaths) {
    assert.equal(exists(artifactPath), false, `semantic evidence artifact should remain absent: ${artifactPath}`);
  }

  for (const file of affectedCallableFingerprintFiles) {
    const stats = fileStats(file);
    const rowPrefix = `| \`${file}\` | ${stats.lines} | ${stats.bytes} | \`${stats.sha256}\` |`;
    assert.ok(affectedDoc.includes(rowPrefix), `affected-callable fingerprint row drift for ${file}`);
  }

  const methodGapDoc = read(methodSemanticGapPath);
  assert.match(methodGapDoc, /method semantic proof gap files covered: 69/);
  assert.match(methodGapDoc, /method semantic proof gap lexical callables covered: 5681/);
  assert.match(methodGapDoc, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGapDoc, /lexical callables requiring semantic proof before behavior changes: 5681/);
  assert.match(methodGapDoc, /affected callable semantic proof: NO-GO/);
  for (const row of affectedCallableSemanticFiles) {
    const methodGapRow = methodSemanticGapRow(methodGapDoc, row.file);
    assert.equal(methodGapRow.family, row.family, `${row.file} method gap family drift`);
    assert.equal(methodGapRow.lexicalCallables, row.lexicalCallables, `${row.file} method gap callable count drift`);
    assert.ok(
      affectedDoc.includes(`| \`${row.id}\` | \`${row.file}\` / ${row.family} / ${row.lexicalCallables} lexical callables |`),
      `affected-callable semantic gap row missing for ${row.file}`
    );
  }

  for (const packetRow of packetRows) {
    const references = doc.match(new RegExp(packetRow, 'g')) || [];
    assert.ok(references.length >= 2, `packet row lacks expansion coverage reference: ${packetRow}`);
  }
  assert.match(doc, /ASCII flow:/);
  assert.match(doc, /source-level fixes\s+-> metric packet gate\s+-> live normal-profile YouTube SPA smoke/);
  assert.match(doc, /```mermaid\nflowchart TD/);
  assert.match(doc, /Live YouTube SPA smoke in normal installed Chrome profile/);
  assert.match(affectedDoc, /ASCII flow:/);
  assert.match(affectedDoc, /user-reported SPA lag\s+-> whitelist\/cache metric packet gate\s+-> affected callable anchor packet/);
  assert.match(affectedDoc, /affected callable anchor packet\s+-> route\/mode callable work-budget obligations/);
  assert.match(affectedDoc, /route\/mode callable work-budget obligations\s+-> route\/mode callable budget artifact contract/);
  assert.match(affectedDoc, /route\/mode callable budget artifact contract\s+-> route\/mode callable budget artifact schema contract/);
  assert.match(affectedDoc, /route\/mode callable budget artifact schema contract\s+-> route\/mode callable budget artifact validator contract/);
  assert.match(affectedDoc, /route\/mode callable budget artifact validator contract\s+-> route\/mode callable budget source-owner contract/);
  assert.match(affectedDoc, /route\/mode callable budget source-owner contract\s+-> route\/mode callable budget collector preflight contract/);
  assert.match(affectedDoc, /route\/mode callable budget collector preflight contract\s+-> route\/mode callable budget collector approval dependency closure/);
  assert.match(affectedDoc, /route\/mode callable budget collector approval dependency closure\s+-> affected callable semantic gap binding/);
  assert.match(affectedDoc, /affected callable semantic gap binding\s+-> affected callable semantic required-field closure/);
  assert.match(affectedDoc, /affected callable semantic required-field closure\s+-> affected callable semantic file-field matrix/);
  assert.match(affectedDoc, /affected callable semantic file-field matrix\s+-> affected callable semantic evidence requirement closure/);
  assert.match(affectedDoc, /affected callable semantic evidence requirement closure\s+-> affected callable semantic evidence artifact registry/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact registry\s+-> affected callable semantic evidence artifact schema contract/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact schema contract\s+-> affected callable semantic evidence artifact validator contract/);
  assert.match(affectedDoc, /affected callable semantic evidence artifact validator contract\s+-> transport no-work source evidence/);
  assert.match(affectedDoc, /transport no-work source evidence\s+-> live evidence execution blocker map/);
  assert.match(affectedDoc, /live evidence execution blocker map\s+-> live evidence result artifact contract/);
  assert.match(affectedDoc, /live evidence result artifact contract\s+-> live evidence result artifact schema contract/);
  assert.match(affectedDoc, /live evidence result artifact schema contract\s+-> live evidence result artifact validator contract/);
  assert.match(affectedDoc, /```mermaid\nflowchart TD/);
  assert.match(affectedDoc, /User-reported YouTube SPA lag/);
  assert.match(affectedDoc, /Route\/mode callable work-budget obligations/);
  assert.match(affectedDoc, /Route\/mode callable budget artifact contract/);
  assert.match(affectedDoc, /Route\/mode callable budget artifact schema contract/);
  assert.match(affectedDoc, /Route\/mode callable budget artifact validator contract/);
  assert.match(affectedDoc, /Route\/mode callable budget source-owner contract/);
  assert.match(affectedDoc, /Route\/mode callable budget collector preflight contract/);
  assert.match(affectedDoc, /Route\/mode callable budget collector approval dependency closure/);
  assert.match(affectedDoc, /Affected callable semantic gap binding/);
  assert.match(affectedDoc, /Affected callable semantic required-field closure/);
  assert.match(affectedDoc, /Affected callable semantic file-field matrix/);
  assert.match(affectedDoc, /Affected callable semantic evidence requirement closure/);
  assert.match(affectedDoc, /Affected callable semantic evidence artifact registry/);
  assert.match(affectedDoc, /Affected callable semantic evidence artifact schema contract/);
  assert.match(affectedDoc, /Affected callable semantic evidence artifact validator contract/);
  assert.match(affectedDoc, /Transport no-work source evidence/);
  assert.match(affectedDoc, /Live evidence execution blocker map/);
  assert.match(affectedDoc, /Live evidence result artifact contract/);
  assert.match(affectedDoc, /Live evidence result artifact schema contract/);
  assert.match(affectedDoc, /Live evidence result artifact validator contract/);

  for (const field of installedByteParityFields) {
    assert.ok(doc.includes(field), `missing installed byte parity field ${field}`);
  }

  for (const field of routeModeFields) {
    assert.ok(doc.includes(field), `missing route-mode field ${field}`);
  }

  for (const field of workBudgetFields) {
    assert.ok(doc.includes(field), `missing work-budget field ${field}`);
  }

  for (const field of pendingCacheFields) {
    assert.ok(doc.includes(field), `missing pending/cache field ${field}`);
  }

  for (const field of settingsBehaviorFields) {
    assert.ok(doc.includes(field), `missing settings/behavior field ${field}`);
  }

  for (const field of jsonRolloutFields) {
    assert.ok(doc.includes(field), `missing JSON-first/rollout field ${field}`);
  }

  for (const field of routeModeCallableFields) {
    assert.ok(affectedDoc.includes(field), `missing route/mode callable field ${field}`);
  }

  for (const field of routeModeCallableBudgetFields) {
    assert.ok(affectedDoc.includes(field), `missing route/mode callable budget artifact field ${field}`);
  }

  for (const field of routeModeCallableBudgetFieldGroups) {
    assert.ok(affectedDoc.includes(field), `missing route/mode callable budget artifact schema field group ${field}`);
  }

  for (const field of routeModeCallableBudgetValidatorCheckFamilies) {
    assert.ok(affectedDoc.includes(field), `missing route/mode callable budget artifact validator check family ${field}`);
  }

  for (const field of routeModeCallableBudgetValidatorFields) {
    assert.ok(affectedDoc.includes(field), `missing route/mode callable budget artifact validator field ${field}`);
  }

  for (const field of routeModeCallableBudgetSourceOwnerFields) {
    assert.ok(affectedDoc.includes(field), `missing route/mode callable budget source-owner field ${field}`);
  }

  for (const field of routeModeCallableBudgetCollectorPreflightFields) {
    assert.ok(affectedDoc.includes(field), `missing route/mode callable budget collector preflight field ${field}`);
  }

  for (const field of routeModeCallableBudgetCollectorApprovalDependencyFields) {
    assert.ok(affectedDoc.includes(field), `missing route/mode callable budget collector approval dependency field ${field}`);
  }

  for (const field of affectedCallableSemanticRequiredFields) {
    assert.ok(affectedDoc.includes(field), `missing affected callable semantic required field ${field}`);
  }

  for (const field of affectedCallableSemanticBindingFields) {
    assert.ok(affectedDoc.includes(field), `missing affected callable semantic binding field ${field}`);
  }

  for (const field of affectedCallableSemanticRequiredFieldClosureFields) {
    assert.ok(affectedDoc.includes(field), `missing affected callable semantic required-field closure field ${field}`);
  }

  for (const field of affectedCallableSemanticMatrixFields) {
    assert.ok(affectedDoc.includes(field), `missing affected callable semantic file-field matrix field ${field}`);
  }

  for (const field of affectedCallableSemanticEvidenceFields) {
    assert.ok(affectedDoc.includes(field), `missing affected callable semantic evidence requirement field ${field}`);
  }

  for (const field of affectedCallableSemanticEvidenceArtifactFields) {
    assert.ok(affectedDoc.includes(field), `missing affected callable semantic evidence artifact field ${field}`);
  }

  for (const field of affectedCallableSemanticEvidenceArtifactSchemaFields) {
    assert.ok(affectedDoc.includes(field), `missing affected callable semantic evidence artifact schema field ${field}`);
  }

  for (const field of affectedCallableSemanticEvidenceArtifactValidatorFields) {
    assert.ok(affectedDoc.includes(field), `missing affected callable semantic evidence artifact validator field ${field}`);
  }

  for (const field of liveEvidenceExecutionBlockerFields) {
    assert.ok(affectedDoc.includes(field), `missing live evidence execution blocker field ${field}`);
  }

  for (const field of liveEvidenceResultFields) {
    assert.ok(affectedDoc.includes(field), `missing live evidence result artifact field ${field}`);
  }

  for (const field of liveEvidenceResultFieldGroups) {
    assert.ok(affectedDoc.includes(field), `missing live evidence result artifact schema field group ${field}`);
  }

  for (const field of liveEvidenceResultValidatorCheckFamilies) {
    assert.ok(affectedDoc.includes(field), `missing live evidence result artifact validator check family ${field}`);
  }

  for (const field of liveEvidenceResultValidatorFields) {
    assert.ok(affectedDoc.includes(field), `missing live evidence result artifact validator field ${field}`);
  }

  for (const upstreamDoc of routeModeCallableBudgetCollectorApprovalUpstreamDocs) {
    assert.ok(exists(upstreamDoc), `missing route/mode callable budget collector approval upstream doc ${upstreamDoc}`);
    assert.ok(affectedDoc.includes(upstreamDoc), `affected-callable doc does not cite ${upstreamDoc}`);
  }

  for (const row of liveSmokeRows) {
    assert.ok(doc.includes(row), `missing live smoke row ${row}`);
  }

  for (const invariant of [
    'blocklist keyword match hides matching content: required',
    'blocklist channel match hides matching content: required',
    'whitelist mode allows only matching content: required',
    'empty blocklist avoids clone/parse/eager DOM work: required',
    'quick-cross first channel block affordance remains available: required',
    'comment/native 3-dot menu opens and outside-click closes: required',
    'literal ampersand Topic byline stays single-channel unless stronger evidence exists: required',
    'JSON-first filtering remains gated by route/surface metric proof: required'
  ]) {
    assert.ok(doc.includes(invariant), `missing invariant: ${invariant}`);
  }
});

test('live smoke template is still non-executed and no result artifact is present', () => {
  const doc = read(docPath);
  const template = JSON.parse(read(liveSmokeTemplatePath));
  const runner = read(liveSmokeRunnerPath);
  const artifactFiles = recursiveFiles(liveSmokeRoot);
  const resultJsonFiles = artifactFiles.filter(file => file.endsWith('.json') && file !== liveSmokeTemplatePath);

  assert.equal(template.artifactType, 'filtertube-release-live-youtube-spa-smoke');
  assert.equal(template.schemaVersion, 3);
  assert.equal(template.status, 'template-not-executed');
  assert.equal(template.smokeSliceReadiness, 'NO-GO');
  assert.equal(template.releaseReadiness, 'NO-GO');
  assert.deepEqual(template.changeContext.requiredLanes, []);
  assert.deepEqual(template.changeContext.automatedLaneEvidence, []);
  assert.equal(template.installedByteParity.packet_id, 'FT-WLCACHE-SPA-PACKET-01-installed-profile-bytes');
  assert.equal(template.installedByteParity.verdict, 'NO-GO');
  for (const field of installedByteParityFields) {
    assert.ok(
      Object.hasOwn(template.installedByteParity, field),
      `template installedByteParity missing field ${field}`
    );
  }
  assert.equal(template.completionRules.installedByteParityMustPass, true);
  assert.equal(template.completionRules.automatedLaneEvidenceMustPass, true);
  assert.equal(template.completionRules.automatedLaneEvidenceMustCoverRequiredLanes, true);
  assert.equal(template.completionRules.releaseReadinessWhenByteParityMissing, 'NO-GO');
  assert.equal(template.completionRules.releaseReadinessWhenAutomatedLaneEvidenceMissing, 'NO-GO');
  assert.deepEqual(template.requiredRows.map(row => row.id), liveSmokeRows);
  assert.deepEqual([...new Set(template.requiredRows.map(row => row.status))], ['missing']);
  assert.equal(resultJsonFiles.length, 0, `unexpected executed live smoke artifacts: ${resultJsonFiles.join(', ')}`);
  assert.deepEqual(artifactFiles, [liveSmokeRunnerPath, liveSmokeTemplatePath, liveSmokeVerifierPath]);

  for (const row of liveSmokeRows) {
    assert.ok(runner.includes(row), `runner missing ${row}`);
  }
  assert.match(runner, /artifactType: 'filtertube-release-live-youtube-spa-smoke'/);
  assert.match(runner, /schemaVersion: 3/);
  assert.match(runner, /function buildInstalledByteParity/);
  assert.match(runner, /function sourceHashSnapshot/);
  assert.match(runner, /packet_id: 'FT-WLCACHE-SPA-PACKET-01-installed-profile-bytes'/);
  assert.match(runner, /content_script_marker_or_hash: runtimeMarker/);
  assert.match(runner, /extension_reload_timestamp: process\.env\.FILTERTUBE_EXTENSION_RELOAD_TIMESTAMP \|\| ''/);
  assert.match(runner, /tab_reload_timestamp: process\.env\.FILTERTUBE_TAB_RELOAD_TIMESTAMP \|\| ''/);
  assert.match(runner, /const smokeSliceReadiness = allRowsPassed && consoleIssues\.length === 0 \? 'GO-FOR-THIS-SMOKE-SLICE' : 'NO-GO'/);
  assert.match(runner, /const changeContext = buildChangeContext\(\)/);
  assert.match(runner, /releaseReadiness: smokeSliceReadiness === 'GO-FOR-THIS-SMOKE-SLICE' && installedByteParity\.verdict === 'GO' && changeContextReady \? 'GO-FOR-RELEASE-SMOKE' : 'NO-GO'/);
  assert.match(runner, /installedByteParityMustPass: true/);
  assert.match(runner, /automatedLaneEvidenceMustPass: true/);
  assert.match(runner, /automatedLaneEvidenceMustCoverRequiredLanes: true/);
  assert.match(runner, /releaseReadinessWhenByteParityMissing: 'NO-GO'/);
  assert.match(runner, /releaseReadinessWhenAutomatedLaneEvidenceMissing: 'NO-GO'/);
  assert.match(doc, /The current directory only contains `template\.json`,\s+`run-live-smoke\.mjs`, and\s+`verify-live-smoke-artifact\.mjs`; that is contract\/tooling, not execution\s+proof/);
});

test('required route/surface metric artifacts are reserved but absent', () => {
  const doc = read(docPath);
  const contractCoverage = read('docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md');
  const approvalBoundary = read('docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md');

  for (const artifact of requiredMetricArtifacts) {
    assert.ok(doc.includes(artifact), `doc missing required artifact ${artifact}`);
    assert.ok(contractCoverage.includes(artifact), `contract coverage missing ${artifact}`);
    assert.equal(exists(artifact), false, `artifact should remain absent: ${artifact}`);
  }

  assert.match(contractCoverage, /Route\/surface-specific per-file metric artifact contract docs covered: 5/);
  assert.match(contractCoverage, /Committed route\/surface metric artifact files: 0/);
  assert.match(approvalBoundary, /Committed route\/surface metric artifact files: 0/i);
  assert.match(approvalBoundary, /Runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /commit route\/surface metric artifact files now: NO-GO/);
});

test('metric packet gate preserves optimization and JSON-first approval absence', () => {
  const doc = read(docPath);
  const affectedDoc = read(affectedCallableDocPath);
  const lagAttribution = read('docs/audit/FILTERTUBE_YOUTUBE_LAG_COMMIT_ATTRIBUTION_2026-05-26.md');
  const releaseStatus = read('docs/audit/FILTERTUBE_RELEASE_FIX_AUDIT_STATUS_2026-05-26.md');
  const firstPacket = read('docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md');
  const releasePackage = read('docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md');
  const source = productSource();

  assert.match(lagAttribution, /pre-existing always-on DOM affordance lifecycles/);
  assert.match(lagAttribution, /May 6 JSON-first response interception/);
  assert.match(lagAttribution, /May 9-11 whitelist pending\/rail observers/);
  assert.match(releaseStatus, /Manual installed-extension Chrome validation remains the release gate/);
  assert.match(firstPacket, /First optimization evidence packet required: yes/);
  assert.match(firstPacket, /Current runtime evidence packet exists: no/);
  assert.match(releasePackage, /secure preferences path matches workspace root: yes/);
  assert.match(releasePackage, /running-tab content-script byte authority: NO-GO/);
  assert.match(releasePackage, /extension reload timestamp authority: NO-GO/);
  assert.match(releasePackage, /visible YouTube tab content-script byte parity authority: NO-GO/);

  for (const token of futureAuthorityTokens) {
    assert.ok(doc.includes(token), `doc missing future token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }

  for (const token of affectedCallableFutureAuthorityTokens) {
    assert.ok(affectedDoc.includes(token), `affected-callable doc missing future token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }

  for (const [file, lineNumber, needle] of affectedCallableAnchorChecks) {
    assert.ok(affectedDoc.includes(`\`${file}:${lineNumber}\``), `affected-callable doc missing anchor ${file}:${lineNumber}`);
    assert.ok(lineAt(file, lineNumber).includes(needle), `anchor drift at ${file}:${lineNumber}`);
  }

  for (const [file, lineNumber, needle] of transportNoWorkAnchorChecks) {
    assert.ok(affectedDoc.includes(`\`${file}:${lineNumber}\``), `transport no-work doc missing anchor ${file}:${lineNumber}`);
    assert.ok(lineAt(file, lineNumber).includes(needle), `transport no-work anchor drift at ${file}:${lineNumber}`);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.ok(ledgerSource.includes(affectedCallableDocPath), `${ledgerDoc} does not cite affected-callable doc`);
    assert.ok(ledgerSource.includes('FT-WLCACHE-SPA-AFFECTED-00-boundary'), `${ledgerDoc} does not cite affected-callable packet`);
    assert.match(ledgerSource, /runtime behavior changed by this\s+continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableCentralLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache affected-callable current-source rerun/);
    assert.match(ledgerSource, /12 affected callable rows/);
    assert.match(ledgerSource, /26 callable\s+or branch anchors/);
    assert.match(ledgerSource, /8 source\s+fingerprint rows/);
    assert.match(ledgerSource, /8 route\/mode callable obligation\s+rows/);
    assert.match(ledgerSource, /14 required\s+route\/mode callable\s+budget fields/);
    assert.match(ledgerSource, /8 transport no-work source\s+evidence rows/);
    assert.match(ledgerSource, /25 transport no-work source anchors/);
    assert.match(ledgerSource, /(?:runtime )?route\/mode callable\s+budget approvals\s+(?:remain )?0/);
    assert.match(ledgerSource, /(?:runtime )?transport no-work approvals\s+(?:remain )?0/);
    assert.match(ledgerSource, /whitelist\/cache optimization\s+(?:remains\s+)?`NO-GO`/);
    assert.match(ledgerSource, /JSON-first first-class promotion\s+(?:remains\s+)?`NO-GO`/);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache route-mode callable budget artifact contract\s+continuation/);
    assert.match(ledgerSource, /8\s+route\/mode callable budget contract rows/);
    assert.match(ledgerSource, /1 reserved artifact\s+path/);
    assert.ok(ledgerSource.includes(routeModeCallableBudgetArtifactPath), `${ledgerDoc} missing reserved route/mode callable budget artifact path`);
    assert.match(ledgerSource, /0\s+committed route\/mode callable budget artifacts/);
    assert.match(ledgerSource, /artifact root exists no/);
    assert.match(ledgerSource, /8 JSON\s+sections/);
    assert.match(ledgerSource, /36 route\/list cells/);
    assert.match(ledgerSource, /6 counter families/);
    assert.match(ledgerSource, /24 required artifact\s+fields/);
    assert.match(ledgerSource, /route\/mode callable budget runtime\s+approvals remain 0/i);
    assert.match(ledgerSource, /implementation-ready\s+rows remain 0/);
    assert.match(ledgerSource, /artifact promotion\s+remains `NO-GO`/);
    assert.match(ledgerSource, /whitelist\/cache optimization\s+remains `NO-GO`/);
    assert.match(ledgerSource, /JSON-first (?:first-class )?promotion\s+remains\s+`NO-GO`/);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache route-mode callable budget artifact schema\/validator\s+contract continuation/);
    assert.match(ledgerSource, /8\s+route\/mode\s+callable budget artifact schema rows/);
    assert.match(ledgerSource, /8\s+schema field groups/);
    assert.match(ledgerSource, /24\s+schema fields/);
    assert.match(ledgerSource, /0\s+approved budget schemas/);
    assert.match(ledgerSource, /8\s+route\/mode\s+callable budget\s+artifact validator rows/);
    assert.match(ledgerSource, /8\s+validator check families/);
    assert.match(ledgerSource, /26\s+validator fields/);
    assert.match(ledgerSource, /0\s+approved budget validators/);
    assert.match(ledgerSource, /runtime\s+budget schema approvals\s+(?:remain )?0/i);
    assert.match(ledgerSource, /runtime\s+budget validator approvals\s+(?:remain )?0/i);
    assert.match(ledgerSource, /implementation-ready\s+schema rows\s+(?:remain )?0/i);
    assert.match(ledgerSource, /implementation-ready\s+validator rows\s+(?:remain )?0/i);
    assert.match(ledgerSource, /schema\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /validator\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /whitelist\/cache optimization\s+(?:remains\s+)?`NO-GO`/);
    assert.match(ledgerSource, /JSON-first (?:first-class )?promotion\s+(?:remains\s+)?`NO-GO`/);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache route-mode callable budget source-owner contract\s+continuation/);
    assert.match(ledgerSource, /8\s+route\/mode\s+callable budget\s+source-owner\s+contract rows/);
    assert.match(ledgerSource, /8 source-owner files/);
    assert.match(ledgerSource, /26\s+reused\s+anchors/);
    assert.match(ledgerSource, /6 counter families/);
    assert.match(ledgerSource, /18\s+required source-owner fields/);
    assert.match(ledgerSource, /source-owner\s+runtime approvals\s+(?:remain )?0/i);
    assert.match(ledgerSource, /source-owner\s+implementation-ready rows\s+(?:remain )?0/i);
    assert.match(ledgerSource, /source-owner\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /collector approval\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache route-mode callable budget collector preflight contract\s+continuation/);
    assert.match(ledgerSource, /8\s+route\/mode\s+callable budget\s+collector\s+preflight rows/);
    assert.match(ledgerSource, /20\s+collector\s+preflight\s+fields/);
    assert.match(ledgerSource, /6 counter families/);
    assert.match(ledgerSource, /runtime\s+collector\s+insertion\s+approvals\s+(?:remain )?0/i);
    assert.match(ledgerSource, /collector\s+approvals\s+(?:remain )?0/i);
    assert.match(ledgerSource, /collector\s+preflight\s+implementation-ready rows\s+(?:remain )?0/i);
    assert.match(ledgerSource, /collector\s+preflight\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache route-mode callable budget collector approval dependency closure\s+continuation/);
    assert.match(ledgerSource, /12\s+route\/mode\s+callable\s+budget\s+collector\s+approval\s+dependency\s+rows/);
    assert.match(ledgerSource, /10\s+upstream\s+collector\s+approval\s+docs/);
    assert.match(ledgerSource, /20\s+collector\s+approval\s+dependency\s+fields/);
    assert.match(ledgerSource, /runtime\s+collector\s+approvals\s+(?:remain )?0/i);
    assert.match(ledgerSource, /collector\s+approval\s+dependencies\s+approved\s+(?:remain )?0/i);
    assert.match(ledgerSource, /collector\s+approval\s+dependency\s+implementation-ready\s+rows\s+(?:remain )?0/i);
    assert.match(ledgerSource, /collector\s+approval\s+dependency\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache affected callable semantic gap binding\s+continuation/);
    assert.match(ledgerSource, /8\s+affected\s+callable\s+semantic\s+gap\s+binding\s+rows/);
    assert.match(ledgerSource, /8\s+affected\s+source\s+files\s+with\s+method-gap\s+rows/);
    assert.match(ledgerSource, /2854\s+affected\s+lexical\s+callables\s+requiring\s+semantic\s+proof/);
    assert.match(ledgerSource, /8\s+affected\s+semantic\s+proof\s+required\s+fields/);
    assert.match(ledgerSource, /affected\s+files\s+with\s+complete\s+per-callable\s+semantic\s+proof\s+(?:remain )?0/i);
    assert.match(ledgerSource, /runtime\s+affected\s+callable\s+semantic\s+approvals\s+(?:remain )?0/i);
    assert.match(ledgerSource, /implementation-ready\s+affected\s+semantic\s+rows\s+(?:remain )?0/i);
    assert.match(ledgerSource, /affected\s+callable\s+semantic\s+proof\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache affected callable semantic required-field closure\s+continuation/);
    assert.match(ledgerSource, /8\s+affected\s+callable\s+semantic\s+required-field\s+closure\s+rows/);
    assert.match(ledgerSource, /8\s+affected\s+source\s+files\s+with\s+method-gap\s+rows/);
    assert.match(ledgerSource, /64\s+affected\s+callable\s+semantic\s+file-field\s+cells\s+required/);
    assert.match(ledgerSource, /16\s+affected\s+callable\s+semantic\s+required-field\s+closure\s+fields/);
    assert.match(ledgerSource, /runtime\s+affected\s+callable\s+semantic\s+field\s+approvals\s+(?:remain )?0/i);
    assert.match(ledgerSource, /implementation-ready\s+affected\s+semantic\s+field\s+rows\s+(?:remain )?0/i);
    assert.match(ledgerSource, /affected\s+callable\s+semantic\s+required-field\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache affected callable semantic file-field matrix\s+continuation/);
    assert.match(ledgerSource, /8\s+affected\s+callable\s+semantic\s+file-field\s+matrix\s+rows/);
    assert.match(ledgerSource, /8\s+affected\s+source\s+files\s+with\s+method-gap\s+rows/);
    assert.match(ledgerSource, /64\s+affected\s+callable\s+semantic\s+file-field\s+matrix\s+cells\s+required/);
    assert.match(ledgerSource, /0\s+affected\s+callable\s+semantic\s+file-field\s+matrix\s+approved\s+cells/);
    assert.match(ledgerSource, /18\s+affected\s+callable\s+semantic\s+file-field\s+matrix\s+fields/);
    assert.match(ledgerSource, /runtime\s+affected\s+callable\s+semantic\s+matrix\s+approvals\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /implementation-ready\s+affected\s+semantic\s+matrix\s+rows\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /affected\s+callable\s+semantic\s+file-field\s+matrix\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache affected callable semantic evidence requirement closure\s+continuation/);
    assert.match(ledgerSource, /8\s+affected\s+callable\s+semantic\s+evidence\s+requirement\s+rows/);
    assert.match(ledgerSource, /64\s+affected\s+callable\s+semantic\s+evidence\s+file-field\s+cells\s+gated/);
    assert.match(ledgerSource, /8\s+affected\s+callable\s+semantic\s+evidence\s+required\s+artifacts/);
    assert.match(ledgerSource, /0\s+affected\s+callable\s+semantic\s+evidence\s+approved\s+artifacts/);
    assert.match(ledgerSource, /18\s+affected\s+callable\s+semantic\s+evidence\s+closure\s+fields/);
    assert.match(ledgerSource, /runtime\s+affected\s+callable\s+semantic\s+evidence\s+approvals\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /implementation-ready\s+affected\s+semantic\s+evidence\s+rows\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /affected\s+callable\s+semantic\s+evidence\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache affected callable semantic evidence artifact registry\s+continuation/);
    assert.match(ledgerSource, /8\s+affected\s+callable\s+semantic\s+evidence\s+artifact\s+registry\s+rows/);
    assert.match(ledgerSource, /8\s+affected\s+callable\s+semantic\s+evidence\s+artifact\s+paths\s+reserved/);
    assert.match(ledgerSource, /0\s+committed\s+affected\s+callable\s+semantic\s+evidence\s+artifacts/);
    assert.match(ledgerSource, /20\s+affected\s+callable\s+semantic\s+evidence\s+artifact\s+registry\s+fields/);
    assert.match(ledgerSource, /affected\s+callable\s+semantic\s+evidence\s+artifact\s+root\s+exists\s+no/i);
    assert.match(ledgerSource, /runtime\s+affected\s+callable\s+semantic\s+artifact\s+approvals\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /implementation-ready\s+affected\s+semantic\s+artifact\s+rows\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /affected\s+callable\s+semantic\s+evidence\s+artifact\s+registry\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache affected callable semantic evidence artifact schema contract\s+continuation/);
    assert.match(ledgerSource, /8\s+affected\s+callable\s+semantic\s+evidence\s+artifact\s+schema\s+rows/);
    assert.match(ledgerSource, /8\s+affected\s+callable\s+semantic\s+evidence\s+artifact\s+schema\s+field\s+groups\s+required/);
    assert.match(ledgerSource, /0\s+affected\s+callable\s+semantic\s+evidence\s+artifact\s+schemas\s+approved/);
    assert.match(ledgerSource, /20\s+affected\s+callable\s+semantic\s+evidence\s+artifact\s+schema\s+fields/);
    assert.match(ledgerSource, /runtime\s+affected\s+callable\s+semantic\s+artifact\s+schema\s+approvals\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /implementation-ready\s+affected\s+semantic\s+artifact\s+schema\s+rows\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /affected\s+callable\s+semantic\s+evidence\s+artifact\s+schema\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache affected callable semantic evidence artifact validator contract\s+continuation/);
    assert.match(ledgerSource, /8\s+affected\s+callable\s+semantic\s+evidence\s+artifact\s+validator\s+rows/);
    assert.match(ledgerSource, /8\s+affected\s+callable\s+semantic\s+evidence\s+artifact\s+validator\s+check\s+families\s+required/);
    assert.match(ledgerSource, /0\s+affected\s+callable\s+semantic\s+evidence\s+artifact\s+validators\s+approved/);
    assert.match(ledgerSource, /22\s+affected\s+callable\s+semantic\s+evidence\s+artifact\s+validator\s+fields/);
    assert.match(ledgerSource, /runtime\s+affected\s+callable\s+semantic\s+artifact\s+validator\s+approvals\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /implementation-ready\s+affected\s+semantic\s+artifact\s+validator\s+rows\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /affected\s+callable\s+semantic\s+evidence\s+artifact\s+validator\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache live evidence execution blocker map\s+continuation/);
    assert.match(ledgerSource, /8\s+live\s+evidence\s+execution\s+blocker\s+rows/);
    assert.match(ledgerSource, /15\s+live\s+evidence\s+execution\s+blocker\s+fields/);
    assert.match(ledgerSource, /runtime\s+live\s+evidence\s+execution\s+approvals\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /implementation-ready\s+live\s+evidence\s+execution\s+blocker\s+rows\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /live\s+evidence\s+execution\s+release\s+readiness\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /connected\s+Chrome\s+profile\s+inventory\s+acceptance\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /scratch\/private\s+Chrome\s+profile\s+acceptance\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /source-only\s+affected-callable\s+packet acceptance\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /executed smoke proof from\s+the\s+blocker map\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /whitelist\/cache optimization\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /JSON-first (?:first-class )?promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache live evidence result artifact contract\s+continuation/);
    assert.match(ledgerSource, /8\s+live\s+evidence\s+result\s+artifact\s+contract\s+rows/);
    assert.match(ledgerSource, /1\s+reserved\s+result\s+artifact\s+path/);
    assert.ok(ledgerSource.includes(liveEvidenceResultArtifactPath), `${ledgerDoc} missing reserved live evidence result artifact path`);
    assert.match(ledgerSource, /0\s+committed\s+live\s+evidence\s+result\s+artifacts/);
    assert.match(ledgerSource, /artifact\s+root\s+exists\s+no/i);
    assert.match(ledgerSource, /36\s+route\s+cells/);
    assert.match(ledgerSource, /6\s+counter\s+families/);
    assert.match(ledgerSource, /24\s+result\s+artifact\s+fields/);
    assert.match(ledgerSource, /runtime\s+live\s+evidence\s+result\s+artifact\s+approvals\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /implementation-ready\s+live\s+evidence\s+result\s+artifact\s+rows\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /live\s+evidence\s+result\s+artifact\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /source-only\s+affected-callable\s+packets?[\s\S]{0,120}`NO-GO`/i);
    assert.match(ledgerSource, /whitelist\/cache optimization\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /JSON-first (?:first-class )?promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  for (const ledgerDoc of affectedCallableLedgerDocs) {
    const ledgerSource = read(ledgerDoc);
    assert.match(ledgerSource, /2026-05-30 whitelist\/cache live evidence result artifact schema\/validator\s+contract continuation/);
    assert.match(ledgerSource, /8\s+live\s+evidence\s+result\s+artifact\s+schema\s+rows/);
    assert.match(ledgerSource, /8\s+schema\s+field\s+groups/);
    assert.match(ledgerSource, /24\s+schema\s+fields/);
    assert.match(ledgerSource, /0\s+approved\s+result\s+schemas/);
    assert.match(ledgerSource, /8\s+live\s+evidence\s+result\s+artifact\s+validator\s+rows/);
    assert.match(ledgerSource, /8\s+validator\s+check\s+families/);
    assert.match(ledgerSource, /26\s+validator\s+fields/);
    assert.match(ledgerSource, /0\s+approved\s+result\s+validators/);
    assert.match(ledgerSource, /runtime\s+(?:live\s+evidence\s+result\s+artifact\s+)?schema\s+approvals\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /runtime\s+(?:live\s+evidence\s+result\s+artifact\s+)?validator\s+approvals\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /implementation-ready\s+schema\s+rows\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /implementation-ready\s+validator\s+rows\s+(?:remain\s+)?0/i);
    assert.match(ledgerSource, /schema\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /validator\s+promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /whitelist\/cache optimization\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /JSON-first (?:first-class )?promotion\s+(?:remains\s+)?`NO-GO`/i);
    assert.match(ledgerSource, /runtime behavior changed by this continuation: no/i);
  }

  assert.match(doc, /approve broad whitelist\/cache optimization now: NO-GO/);
  assert.match(doc, /approve JSON-first as first-class filter authority now: NO-GO/);
  assert.match(doc, /accept Default Secure Preferences as active-tab parity proof now: NO-GO/);
  assert.match(doc, /accept automation CDP profile proof as visible-tab proof now: NO-GO/);
  assert.match(doc, /accept connected Chrome profile tab inventory as installed-byte parity now: NO-GO/);
  assert.match(doc, /accept missing relevant tabs as active YouTube tab proof now: NO-GO/);
  assert.match(doc, /accept user-visible screenshots as content-script byte proof now: NO-GO/);
  assert.match(doc, /accept scratch\/private Chrome profile as substitute proof now: NO-GO/);
  assert.match(doc, /installed Chrome CDP preflight accepted as live smoke proof: NO-GO/);
  assert.match(doc, /accept runner smokeSliceReadiness as release proof without byte parity now: NO-GO/);
  assert.match(doc, /accept stale already-open YouTube tabs for release smoke now: NO-GO/);
  assert.match(doc, /approve whitelist\/cache optimization from this gate now: NO-GO/);
  assert.match(doc, /define route sequence and list-mode matrix gate: GO/);
  assert.match(doc, /accept six route template rows as executed route-mode proof now: NO-GO/);
  assert.match(doc, /accept source-only list-mode fixtures as live route-mode proof now: NO-GO/);
  assert.match(doc, /accept route-mode matrix without installed byte parity now: NO-GO/);
  assert.match(doc, /approve whitelist\/cache optimization from route-mode matrix now: NO-GO/);
  assert.match(doc, /approve JSON-first first-class filtering from route-mode matrix now: NO-GO/);
  assert.match(doc, /define transport and DOM lifecycle budget gate: GO/);
  assert.match(doc, /accept source-only no-work gates as route-mode budget proof now: NO-GO/);
  assert.match(doc, /accept live smoke without transport counters now: NO-GO/);
  assert.match(doc, /accept live smoke without DOM lifecycle counters now: NO-GO/);
  assert.match(doc, /accept work-budget matrix without route-mode coverage now: NO-GO/);
  assert.match(doc, /approve whitelist\/cache optimization from work-budget gate now: NO-GO/);
  assert.match(doc, /approve JSON-first first-class filtering from work-budget gate now: NO-GO/);
  assert.match(doc, /approve public performance claim from work-budget gate now: NO-GO/);
  assert.match(doc, /define whitelist pending-rail and cache refresh gate: GO/);
  assert.match(doc, /accept source-only pending-hide tests as route-mode behavior proof now: NO-GO/);
  assert.match(doc, /accept source-only cache hot-path tests as route-mode behavior proof now: NO-GO/);
  assert.match(doc, /accept live smoke without false-hide and leak samples now: NO-GO/);
  assert.match(doc, /accept live smoke without forceReprocess upgrade samples now: NO-GO/);
  assert.match(doc, /accept pending\/cache matrix without installed byte parity now: NO-GO/);
  assert.match(doc, /approve whitelist\/cache optimization from pending\/cache gate now: NO-GO/);
  assert.match(doc, /approve JSON-first first-class filtering from pending\/cache gate now: NO-GO/);
  assert.match(doc, /approve public performance claim from pending\/cache gate now: NO-GO/);
  assert.match(doc, /define settings mutation and behavior invariant gate: GO/);
  assert.match(doc, /accept source-only settings refresh tests as route-mode mutation proof now: NO-GO/);
  assert.match(doc, /accept source-only behavior fixture tests as live invariant proof now: NO-GO/);
  assert.match(doc, /accept live smoke without settings revision before\/after now: NO-GO/);
  assert.match(doc, /accept live smoke without blocklist and whitelist invariant samples now: NO-GO/);
  assert.match(doc, /accept live smoke without menu and quick-block invariant samples now: NO-GO/);
  assert.match(doc, /accept settings\/behavior matrix without installed byte parity now: NO-GO/);
  assert.match(doc, /approve whitelist\/cache optimization from settings\/behavior gate now: NO-GO/);
  assert.match(doc, /approve JSON-first first-class filtering from settings\/behavior gate now: NO-GO/);
  assert.match(doc, /approve public performance claim from settings\/behavior gate now: NO-GO/);
  assert.match(doc, /define JSON-first promotion and rollout nonclaim gate: GO/);
  assert.match(doc, /accept JSON-first as first-class authority now: NO-GO/);
  assert.match(doc, /accept route\/surface contracts without committed artifacts now: NO-GO/);
  assert.match(doc, /accept promotion without recommendation-engagement noninteraction proof now: NO-GO/);
  assert.match(doc, /accept rollout without explicit rollback plan now: NO-GO/);
  assert.match(doc, /accept browser packet as native\/mobile\/TV proof now: NO-GO/);
  assert.match(doc, /accept public performance claims from this packet now: NO-GO/);
  assert.match(doc, /approve whitelist\/cache optimization from JSON-first\/rollout gate now: NO-GO/);
  assert.match(doc, /approve JSON-first first-class filtering from JSON-first\/rollout gate now: NO-GO/);
  assert.match(doc, /approve release ship decision from JSON-first\/rollout gate now: NO-GO/);
  assert.match(doc, /close packet row documentation expansion now: GO/);
  assert.match(doc, /accept row expansion as live smoke evidence now: NO-GO/);
  assert.match(doc, /accept row expansion as route-mode metric artifact evidence now: NO-GO/);
  assert.match(doc, /accept row expansion as optimization approval now: NO-GO/);
  assert.match(doc, /accept row expansion as JSON-first first-class approval now: NO-GO/);
  assert.match(doc, /accept row expansion as release ship decision now: NO-GO/);
  assert.match(doc, /accept current-source freshness as packet-row expansion proof: GO/);
  assert.match(doc, /accept current-source freshness as live smoke evidence now: NO-GO/);
  assert.match(doc, /accept current-source freshness as installed-tab byte parity now: NO-GO/);
  assert.match(doc, /accept current-source freshness as metric artifact creation now: NO-GO/);
  assert.match(doc, /accept current-source freshness as whitelist\/cache optimization approval now: NO-GO/);
  assert.match(doc, /accept current-source freshness as JSON-first first-class approval now: NO-GO/);
  assert.match(doc, /accept current-source freshness as release ship decision now: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);
});
