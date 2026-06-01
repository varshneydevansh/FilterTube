// Static lane data for scripts/run-test-lane.mjs.
// Keep this file declarative; execution belongs in the runner.

export const MANUAL_YOUTUBE_SMOKE_LANE_REASONS = Object.freeze({
  release: 'release packaging, public claims, installed-extension parity, and artifact handoff behavior',
  whitelist: 'whitelist-only leaks, Shorts, watch/end-screen, Kids/YTM allow behavior',
  blocking: 'keyword/channel/comment hiding and blocklist false-hide/leak behavior',
  json: 'JSON-first filtering, network interception, and SPA response mutation',
  dom: 'DOM fallback hiding/restores and recycled YouTube nodes',
  menu: '3-dot menus, quick-block, collaborator actions, and native dropdown state',
  performance: 'empty-rule/no-work and repeated YouTube SPA navigation responsiveness',
  settings: 'profile/mode/storage changes reprocessing already-rendered cards'
});

export const LIVE_SMOKE_ARTIFACT_TEMPLATE = 'docs/audit/artifacts/release-live-youtube-spa-smoke/template.json';
export const LIVE_SMOKE_RUNNER_COMMAND = 'npm run smoke:youtube';
export const LIVE_SMOKE_VERIFY_COMMAND =
  'npm run smoke:youtube:verify -- docs/audit/artifacts/release-live-youtube-spa-smoke/<artifact>.json';
export const LIVE_SMOKE_ARTIFACT_VERIFIER =
  'node docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs docs/audit/artifacts/release-live-youtube-spa-smoke/<artifact>.json';
export const LIVE_SMOKE_CHANGE_CONTEXT_ENV = Object.freeze([
  'FILTERTUBE_LOGICAL_CHANGE_TYPE',
  'FILTERTUBE_REQUIRED_LANES',
  'FILTERTUBE_AUTOMATED_PROOF_COMMAND',
  'FILTERTUBE_AUTOMATED_PROOF_STATUS=passed',
  'FILTERTUBE_AUTOMATED_PROOF_SUMMARY',
  'FILTERTUBE_AUTOMATED_PROOF_LANES'
]);
export const LIVE_SMOKE_REQUIRED_ROWS = Object.freeze([
  'FT-LIVE-SPA-00-home-to-search',
  'FT-LIVE-SPA-01-search-to-channel',
  'FT-LIVE-SPA-02-channel-to-watch',
  'FT-LIVE-SPA-03-watch-to-home',
  'FT-LIVE-SPA-04-watch-rail-scroll',
  'FT-LIVE-SPA-05-cache-repeat-navigation'
]);

export const RUNTIME_FIXTURE_LANE_REASONS = Object.freeze({
  whitelist: 'whitelist allow/leak fixtures for touched YouTube surfaces',
  blocking: 'keyword/channel/comment hide-decision fixtures',
  json: 'JSON renderer, endpoint, response, or no-work fixtures',
  dom: 'DOM selector, cleanup, restore, or recycled-node fixtures',
  menu: '3-dot menu, quick-block, collaborator, or native dropdown fixtures',
  performance: 'empty-rule/no-work, SPA, timer, observer, or cache fixtures',
  settings: 'profile, storage, import/export, or compiled-mode fixtures'
});

export const AUDIT_PROOF_PATH_PATTERN = /^docs\/audit\//;
export const RUNTIME_TEST_PROOF_PATH_PATTERN = /^tests\/runtime\/.*\.test\.mjs$/;
export const RUNTIME_FIXTURE_PROOF_PATH_PATTERN = /^tests\/runtime\/(?:fixtures\/|harness\/|.*\.test\.mjs$)/;
export const NON_PROOF_LANE = 'smoke';

const FILTER_LOGIC_AUDIT_PROOF_TESTS = Object.freeze([
  'tests/runtime/filter-logic-direct-renderer-rule-semantic-register-current-behavior.test.mjs',
  'tests/runtime/filter-logic-method-semantic-register-current-behavior.test.mjs',
  'tests/runtime/filter-logic-rule-field-effect-semantic-register-current-behavior.test.mjs',
  'tests/runtime/filter-logic-rule-path-semantic-register-current-behavior.test.mjs'
]);

export const LANES = Object.freeze({
  release: {
    description: 'Build, package, release docs, public claims, and artifact boundaries.',
    checks: ['build.js'],
    tests: [
      'tests/runtime/build-release-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/build-script-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/build-website-callable-current-behavior.test.mjs',
      'tests/runtime/browser-manifest-runtime-load-order-current-behavior.test.mjs',
      'tests/runtime/css-load-style-surface-current-behavior.test.mjs',
      'tests/runtime/public-release-surface-current-behavior.test.mjs',
      'tests/runtime/public-release-claim-boundary-current-behavior.test.mjs',
      'tests/runtime/p0-release-package-current-behavior.test.mjs',
      'tests/runtime/quarantined-content-css-package-boundary-current-behavior.test.mjs',
      'tests/runtime/release-audit-proof-directory-boundary-current-behavior.test.mjs',
      'tests/runtime/release-build-artifact-claim-boundary-current-behavior.test.mjs',
      'tests/runtime/release-live-youtube-spa-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/release-live-youtube-spa-smoke-boundary-current-behavior.test.mjs',
      'tests/runtime/release-notes-json-version-gate-boundary-current-behavior.test.mjs',
      'tests/runtime/release-package-parity-current-behavior.test.mjs',
      'tests/runtime/root-package-metadata-script-surface-current-behavior.test.mjs',
      'tests/runtime/background-script-injection-trust-boundary-current-behavior.test.mjs',
      'tests/runtime/bridge-injection-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/page-message-trust-current-behavior.test.mjs',
      'tests/runtime/startup-injection-readiness-current-behavior.test.mjs',
      'tests/runtime/test-lane-matrix-current-behavior.test.mjs'
    ]
  },
  whitelist: {
    description: 'Whitelist-only mode, pending hides, allow-list leaks, Shorts, watch, end-screen, Kids, and YTM allow behavior.',
    tests: [
      ...FILTER_LOGIC_AUDIT_PROOF_TESTS,
      'tests/runtime/json-first-whitelist-decision-identity-boundary-current-behavior.test.mjs',
      'tests/runtime/content-bridge-whitelist-pending-refresh-boundary-current-behavior.test.mjs',
      'tests/runtime/whitelist-pending-intake-no-work-contract-current-behavior.test.mjs',
      'tests/runtime/whitelist-cache-hot-path-boundary-current-behavior.test.mjs',
      'tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs',
      'tests/runtime/whitelist-optimization-readiness-gap-matrix-current-behavior.test.mjs',
      'tests/runtime/right-rail-whitelist-observer-current-behavior.test.mjs',
      'tests/runtime/batch-whitelist-import-persistence-boundary-current-behavior.test.mjs',
      'tests/runtime/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation-current-behavior.test.mjs',
      'tests/runtime/main-watch-initial-lockup-shorts-json-current-behavior.test.mjs',
      'tests/runtime/main-watch-initial-shorts-owner-absent-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-all-shorts-boundary-current-behavior.test.mjs',
      'tests/runtime/shorts-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/main-watch-autoplay-video-endpoint-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-endscreen-videowall-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-endscreen-cards-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-disable-autoplay-annotations-boundary-current-behavior.test.mjs',
      'tests/runtime/player-endscreen-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/kids-latest-json-owner-extension-fixture-boundary-current-behavior.test.mjs',
      'tests/runtime/ytm-watch-player-whitelist-selected-row-mode-boundary-current-behavior.test.mjs'
    ]
  },
  blocking: {
    description: 'Keyword, channel, comment, blocklist, list-target, and hide-decision behavior.',
    tests: [
      ...FILTER_LOGIC_AUDIT_PROOF_TESTS,
      'tests/runtime/filter-engine-current-behavior.test.mjs',
      'tests/runtime/keyword-match-authority-current-behavior.test.mjs',
      'tests/runtime/p0-keyword-match-current-behavior.test.mjs',
      'tests/runtime/json-first-keyword-match-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-channel-match-boundary-current-behavior.test.mjs',
      'tests/runtime/main-profile-blocklist-keyword-alias-current-behavior.test.mjs',
      'tests/runtime/background-add-filtered-channel-list-target-current-behavior.test.mjs',
      'tests/runtime/content-bridge-menu-action-list-target-current-behavior.test.mjs',
      'tests/runtime/filter-all-toggle-list-target-current-behavior.test.mjs',
      'tests/runtime/add-filtered-channel-filter-all-comments-default-current-behavior.test.mjs',
      'tests/runtime/single-channel-rule-mutation-persistence-boundary-current-behavior.test.mjs',
      'tests/runtime/hide-decision-pipeline-current-behavior.test.mjs'
    ]
  },
  json: {
    description: 'JSON-first filtering, network interception, response mutation, list mode, and endpoint work gates.',
    tests: [
      ...FILTER_LOGIC_AUDIT_PROOF_TESTS,
      'tests/runtime/seed-network-current-behavior.test.mjs',
      'tests/runtime/seed-fetch-no-work-list-mode-boundary-current-behavior.test.mjs',
      'tests/runtime/seed-xhr-no-work-list-mode-boundary-current-behavior.test.mjs',
      'tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-active-work-predicate-register-current-behavior.test.mjs',
      'tests/runtime/json-first-filter-readiness-gate-current-behavior.test.mjs',
      'tests/runtime/json-first-block-decision-effect-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-network-snapshot-clone-isolation-current-behavior.test.mjs',
      'tests/runtime/json-first-network-snapshot-consumer-application-current-behavior.test.mjs',
      'tests/runtime/json-first-network-snapshot-consumer-traversal-budget-current-behavior.test.mjs',
      'tests/runtime/json-first-list-mode-matrix-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-response-mutation-contract-current-behavior.test.mjs',
      'tests/runtime/json-first-whitelist-decision-identity-boundary-current-behavior.test.mjs',
      'tests/runtime/bridge-injection-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/content-bridge-main-world-message-dispatch-boundary-current-behavior.test.mjs',
      'tests/runtime/injector-main-world-message-dispatch-boundary-current-behavior.test.mjs',
      'tests/runtime/startup-injection-readiness-current-behavior.test.mjs'
    ]
  },
  dom: {
    description: 'DOM fallback selectors, hide/restore state, cleanup passes, and recycled node behavior.',
    tests: [
      ...FILTER_LOGIC_AUDIT_PROOF_TESTS,
      'tests/runtime/dom-fallback-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/dom-fallback-selector-semantic-register-current-behavior.test.mjs',
      'tests/runtime/dom-fallback-run-state-visibility-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/css-style-hide-authority-current-behavior.test.mjs',
      'tests/runtime/dom-hide-side-effect-current-behavior.test.mjs',
      'tests/runtime/dom-broad-hide-boundary-current-behavior.test.mjs',
      'tests/runtime/dom-state-virtual-attributes-current-behavior.test.mjs',
      'tests/runtime/dom-target-source-current-behavior.test.mjs',
      'tests/runtime/comments-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/home-feed-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/quarantined-content-css-package-boundary-current-behavior.test.mjs',
      'tests/runtime/shorts-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/player-endscreen-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/watch-playlist-panel-dom-cleanup-boundary-current-behavior.test.mjs'
    ]
  },
  menu: {
    description: '3-dot menu, quick-block, collaborator menus, native dropdown close state, and affordance gates.',
    tests: [
      'tests/runtime/native-dropdown-close-state-current-behavior.test.mjs',
      'tests/runtime/quick-block-block-menu-affordance-boundary-current-behavior.test.mjs',
      'tests/runtime/quick-block-default-migration-boundary-current-behavior.test.mjs',
      'tests/runtime/quick-block-hover-lifecycle-timer-boundary-current-behavior.test.mjs',
      'tests/runtime/block-channel-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/content-menu-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/content-bridge-menu-action-list-target-current-behavior.test.mjs',
      'tests/runtime/content-bridge-menu-blocked-state-list-shape-current-behavior.test.mjs',
      'tests/runtime/content-bridge-menu-injection-action-boundary-current-behavior.test.mjs',
      'tests/runtime/content-bridge-collaborator-identity-promotion-handoff-current-behavior.test.mjs',
      'tests/runtime/collab-dialog-lifecycle-current-behavior.test.mjs',
      'tests/runtime/main-collab-resolved-search-card-dialog-current-behavior.test.mjs',
      'tests/runtime/ytm-show-sheet-collaborator-roster-current-behavior.test.mjs'
    ]
  },
  performance: {
    description: 'No-rule/no-work budgets, SPA lag guards, disabled mode, active-rule gates, and identity work budgets.',
    tests: [
      ...FILTER_LOGIC_AUDIT_PROOF_TESTS,
      'tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs',
      'tests/runtime/empty-install-performance-current-behavior.test.mjs',
      'tests/runtime/visible-empty-runtime-active-current-behavior.test.mjs',
      'tests/runtime/enabled-master-switch-disabled-runtime-boundary-current-behavior.test.mjs',
      'tests/runtime/active-rule-authority-current-behavior.test.mjs',
      'tests/runtime/content-filter-route-surface-no-work-budget-current-behavior.test.mjs',
      'tests/runtime/json-first-no-work-optimization-crosswalk-current-behavior.test.mjs',
      'tests/runtime/whitelist-pending-intake-no-work-contract-current-behavior.test.mjs',
      'tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs',
      'tests/runtime/seed-fetch-no-work-list-mode-boundary-current-behavior.test.mjs',
      'tests/runtime/seed-xhr-no-work-list-mode-boundary-current-behavior.test.mjs',
      'tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs',
      'tests/runtime/performance-claim-evidence-boundary-current-behavior.test.mjs',
      'tests/runtime/identity-work-budget-current-behavior.test.mjs',
      'tests/runtime/runtime-diagnostic-logging-policy-matrix-current-behavior.test.mjs',
      'tests/runtime/code-burden-declutter-boundary-current-behavior.test.mjs',
      'tests/runtime/p0-no-work-current-behavior.test.mjs'
    ]
  },
  settings: {
    description: 'Settings compile, profiles, storage refresh, migrations, import/export, backups, and sync boundaries.',
    tests: [
      'tests/runtime/settings-shared-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/settings-mode-coverage-matrix-current-behavior.test.mjs',
      'tests/runtime/settings-refresh-fanout-current-behavior.test.mjs',
      'tests/runtime/settings-refresh-dirty-key-producer-matrix-current-behavior.test.mjs',
      'tests/runtime/settings-refresh-dirty-key-consumer-matrix-current-behavior.test.mjs',
      'tests/runtime/compiled-settings-profile-list-mode-assembly-boundary-current-behavior.test.mjs',
      'tests/runtime/compiled-cache-authority-current-behavior.test.mjs',
      'tests/runtime/compiler-parity-current-behavior.test.mjs',
      'tests/runtime/state-manager-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/state-manager-request-refresh-fanout-boundary-current-behavior.test.mjs',
      'tests/runtime/profile-management-persistence-boundary-current-behavior.test.mjs',
      'tests/runtime/list-mode-transition-persistence-boundary-current-behavior.test.mjs',
      'tests/runtime/import-export-nanah-authority-current-behavior.test.mjs',
      'tests/runtime/backup-export-authority-current-behavior.test.mjs',
      'tests/runtime/io-manager-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/background-message-action-semantic-register-current-behavior.test.mjs',
      'tests/runtime/background-message-authority-current-behavior.test.mjs',
      'tests/runtime/content-bridge-main-world-message-dispatch-boundary-current-behavior.test.mjs',
      'tests/runtime/message-sender-class-matrix-current-behavior.test.mjs',
      'tests/runtime/message-side-effect-register-current-behavior.test.mjs',
      'tests/runtime/message-transport-callsite-register-current-behavior.test.mjs',
      'tests/runtime/p0-message-mutation-current-behavior.test.mjs'
    ]
  },
  smoke: {
    description: 'Small release confidence lane for common lag, blocking, menu, and release-surface regressions.',
    checks: ['build.js'],
    tests: [
      'tests/runtime/active-rule-authority-current-behavior.test.mjs',
      'tests/runtime/filter-engine-current-behavior.test.mjs',
      'tests/runtime/main-profile-blocklist-keyword-alias-current-behavior.test.mjs',
      'tests/runtime/json-first-whitelist-decision-identity-boundary-current-behavior.test.mjs',
      'tests/runtime/content-bridge-whitelist-pending-refresh-boundary-current-behavior.test.mjs',
      'tests/runtime/main-watch-autoplay-video-endpoint-current-behavior.test.mjs',
      'tests/runtime/storage-refresh-force-reprocess-coalescing-current-behavior.test.mjs',
      'tests/runtime/native-dropdown-close-state-current-behavior.test.mjs',
      'tests/runtime/quick-block-block-menu-affordance-boundary-current-behavior.test.mjs',
      'tests/runtime/dom-state-virtual-attributes-current-behavior.test.mjs',
      'tests/runtime/empty-install-performance-current-behavior.test.mjs',
      'tests/runtime/runtime-diagnostic-logging-policy-matrix-current-behavior.test.mjs',
      'tests/runtime/public-release-surface-current-behavior.test.mjs',
      'tests/runtime/release-audit-proof-directory-boundary-current-behavior.test.mjs',
      'tests/runtime/release-live-youtube-spa-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/release-live-youtube-spa-smoke-boundary-current-behavior.test.mjs',
      'tests/runtime/audit-runtime-backlog-current-behavior.test.mjs',
      'tests/runtime/test-lane-visible-safety-current-behavior.test.mjs',
      'tests/runtime/test-lane-matrix-current-behavior.test.mjs'
    ]
  }
});

export const FILE_LANE_RULES = Object.freeze([
  {
    id: 'seed-json-runtime',
    patterns: [/^js\/seed\.js$/],
    lanes: ['json', 'performance']
  },
  {
    id: 'injector-main-world-json',
    patterns: [/^js\/injector\.js$/],
    lanes: ['json', 'whitelist', 'performance']
  },
  {
    id: 'filter-logic-core',
    patterns: [/^js\/filter_logic\.js$/],
    lanes: ['json', 'blocking', 'whitelist', 'performance']
  },
  {
    id: 'dom-fallback-runtime',
    patterns: [/^js\/content\/dom_fallback\.js$/],
    lanes: ['whitelist', 'dom', 'blocking', 'performance']
  },
  {
    id: 'quick-block-menu-runtime',
    patterns: [/^js\/content\/block_channel\.js$/],
    lanes: ['menu', 'blocking', 'performance']
  },
  {
    id: 'content-menu-runtime',
    patterns: [/^js\/content\/menu\.js$/],
    lanes: ['menu']
  },
  {
    id: 'content-bridge-injection-runtime',
    patterns: [/^js\/content\/bridge_injection\.js$/],
    lanes: ['release', 'json', 'performance', 'settings']
  },
  {
    id: 'collab-dialog-runtime',
    patterns: [/^js\/content\/collab_dialog\.js$/],
    lanes: ['whitelist', 'blocking', 'menu', 'performance']
  },
  {
    id: 'dom-helper-state-runtime',
    patterns: [/^js\/content\/(?:dom_helpers|dom_state)\.js$/],
    lanes: ['whitelist', 'blocking', 'dom', 'performance']
  },
  {
    id: 'prompt-overlay-runtime',
    patterns: [/^js\/content\/(?:first_run_prompt|release_notes_prompt)\.js$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'content-bridge-runtime',
    patterns: [/^js\/content_bridge\.js$/],
    lanes: ['menu', 'settings', 'blocking', 'json', 'dom', 'whitelist', 'performance']
  },
  {
    id: 'bridge-settings-runtime',
    patterns: [/^js\/content\/bridge_settings\.js$/],
    lanes: ['settings', 'json', 'performance']
  },
  {
    id: 'background-runtime',
    patterns: [/^js\/background\.js$/],
    lanes: ['release', 'whitelist', 'blocking', 'json', 'performance', 'settings']
  },
  {
    id: 'shared-settings-runtime',
    patterns: [/^js\/settings_shared\.js$/],
    lanes: ['settings', 'blocking', 'whitelist']
  },
  {
    id: 'state-io-runtime',
    patterns: [/^js\/(?:state_manager|io_manager)\.js$/],
    lanes: ['settings']
  },
  {
    id: 'extension-ui-runtime',
    patterns: [/^js\/(?:popup|tab-view|render_engine|ui_components)\.js$/],
    lanes: ['release', 'whitelist', 'blocking', 'menu', 'settings', 'smoke']
  },
  {
    id: 'content-controls-catalog-runtime',
    patterns: [/^js\/content_controls_catalog\.js$/],
    lanes: ['whitelist', 'blocking', 'json', 'dom', 'menu', 'performance', 'settings']
  },
  {
    id: 'nanah-sync-runtime',
    patterns: [/^js\/nanah_sync_adapter\.js$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'security-crypto-runtime',
    patterns: [/^js\/security_manager\.js$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'legacy-layout-quarantine',
    patterns: [/^js\/layout\.js$/],
    lanes: ['release', 'dom', 'smoke']
  },
  {
    id: 'identity-runtime',
    patterns: [/^js\/shared\/identity\.js$/, /^js\/content\/(?:dom_extractors|handle_resolver)\.js$/],
    lanes: ['blocking', 'menu', 'whitelist']
  },
  {
    id: 'extension-ui-build-helper-surface',
    patterns: [/^scripts\/build-extension-ui\.mjs$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'vendor-sync-build-helper-surface',
    patterns: [/^scripts\/build-nanah-vendor\.mjs$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'release-build-surface',
    patterns: [/^manifest(?:\.[a-z]+)?\.json$/, /^build\.js$/, /^scripts\/build-.*\.mjs$/],
    lanes: ['release']
  },
  {
    id: 'root-metadata-surface',
    patterns: [/^package(?:-lock)?\.json$/, /^\.gitignore$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'root-legal-doc-surface',
    patterns: [/^LICENSE$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'root-product-doc-surface',
    patterns: [/^(?!README\.md$|CHANGELOG\.md$)[^/]+\.md$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'lane-workflow-surface',
    patterns: [/^scripts\/(?:run-test-lane|test-lane-config|audit-proof-drift)\.mjs$/, /^docs\/audit\/TEST_LANE_MATRIX\.md$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'live-smoke-artifact-surface',
    patterns: [/^docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/.*\.(?:json|mjs)$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'audit-performance-artifact-surface',
    patterns: [/^docs\/audit\/artifacts\/empty-install-idle-probe\.mjs$/],
    lanes: ['performance', 'smoke']
  },
  {
    id: 'public-release-copy',
    patterns: [/^README\.md$/, /^CHANGELOG\.md$/, /^data\/release_notes\.json$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'product-doc-surface',
    patterns: [/^docs\/(?!audit\/)[^/]+\.md$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'extension-popup-shell-surface',
    patterns: [
      /^html\/popup\.html$/,
      /^css\/popup\.css$/,
      /^js\/ui-shell\/popup-shell\.js$/,
      /^src\/extension-shell\/popup\.jsx$/
    ],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'extension-tab-view-settings-shell-surface',
    patterns: [/^html\/tab-view\.html$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'quarantined-content-css-surface',
    patterns: [/^css\/(?:content|filter|layout)\.css$/],
    lanes: ['release', 'dom', 'smoke']
  },
  {
    id: 'extension-ui-surface',
    patterns: [/^html\/.*\.html$/, /^css\/.*\.css$/, /^js\/ui-shell\/.*\.js$/, /^src\/extension-shell\//],
    lanes: ['release', 'smoke']
  },
  {
    id: 'extension-static-asset-surface',
    patterns: [/^assets\/.*\.(?:png|mp4)$/, /^icons\/.*\.(?:png|svg)$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'design-token-surface',
    patterns: [/^design\/.*\.json$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'vendor-bundle-surface',
    patterns: [/^js\/vendor\/.*\.bundle\.js$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'release-helper-script-surface',
    patterns: [/^scripts\/(?:compress-video\.swift|sync-native-runtime\.mjs)$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'website-public-surface',
    patterns: [/^website\//],
    lanes: ['release', 'smoke']
  },
  {
    id: 'audit-release-proof-doc',
    patterns: [/^docs\/audit\/.*(?:RELEASE|PACKAGE|MANIFEST|PUBLIC|BUILD|ROOT_PACKAGE|SOURCE_BOUNDARY|TRACKED_PUBLIC).*\.md$/i],
    lanes: ['release']
  },
  {
    id: 'audit-whitelist-proof-doc',
    patterns: [/^docs\/audit\/.*WHITELIST.*\.md$/i],
    lanes: ['whitelist']
  },
  {
    id: 'audit-blocking-proof-doc',
    patterns: [/^docs\/audit\/.*(?:BLOCK|KEYWORD|CHANNEL|COMMENT).*\.md$/i],
    lanes: ['blocking']
  },
  {
    id: 'audit-json-proof-doc',
    patterns: [/^docs\/audit\/.*(?:JSON|YTM|YOUTUBE_MUSIC|INJECTOR).*\.md$/i],
    lanes: ['json']
  },
  {
    id: 'audit-dom-proof-doc',
    patterns: [/^docs\/audit\/.*DOM.*\.md$/i],
    lanes: ['dom']
  },
  {
    id: 'audit-menu-proof-doc',
    patterns: [/^docs\/audit\/.*(?:MENU|QUICK|COLLAB|DROPDOWN).*\.md$/i],
    lanes: ['menu']
  },
  {
    id: 'audit-identity-proof-doc',
    patterns: [/^docs\/audit\/.*(?:IDENTITY|RESOLVER|HANDLE|WATERFALL).*\.md$/i],
    lanes: ['whitelist', 'blocking', 'menu']
  },
  {
    id: 'audit-list-state-proof-doc',
    patterns: [/^docs\/audit\/.*(?:ALIAS|LIST_MODE|ROW_LIST_MODE).*\.md$/i],
    lanes: ['whitelist', 'blocking', 'settings']
  },
  {
    id: 'audit-renderer-surface-proof-doc',
    patterns: [/^docs\/audit\/.*(?:RENDERER|LOCKUP|WATCH|UPNEXT|SEARCH|SHORTS|ENDSCREEN|END_SCREEN|AUTOPLAY|PLAYER|PLAYLIST|KIDS_BROWSE|CARD).*\.md$/i],
    lanes: ['whitelist', 'blocking', 'json', 'dom']
  },
  {
    id: 'audit-filter-logic-rule-proof-doc',
    patterns: [/^docs\/audit\/.*FILTER_LOGIC_(?:METHOD_SEMANTIC_REGISTER|RULE_FIELD_EFFECT_SEMANTIC_REGISTER|RULE_PATH_SEMANTIC_REGISTER|DIRECT_RENDERER_RULE_SEMANTIC_REGISTER).*\.md$/i],
    lanes: ['whitelist', 'blocking', 'json', 'dom', 'performance']
  },
  {
    id: 'audit-network-transport-proof-doc',
    patterns: [/^docs\/audit\/.*(?:NETWORK|FETCH|XHR|CREDENTIAL).*\.md$/i],
    lanes: ['json', 'performance']
  },
  {
    id: 'audit-message-trust-injection-proof-doc',
    patterns: [/^docs\/audit\/.*(?:_|\/)(?:MAIN_WORLD_MESSAGE|INJECTION|TRUST|STARTUP_INJECTION)(?:_|\.md$)/i],
    lanes: ['release', 'json', 'settings']
  },
  {
    id: 'audit-message-state-proof-doc',
    patterns: [/^docs\/audit\/.*MESSAGE.*\.md$/i],
    lanes: ['settings']
  },
  {
    id: 'audit-page-lifecycle-proof-doc',
    patterns: [/^docs\/audit\/.*(?:CONTENT_BRIDGE_LIFECYCLE|CONTENT_BRIDGE_STARTUP_TIMING|EMPTY_INSTALL_IDLE_OBSERVER|LIFECYCLE_EFFECT|LIFECYCLE_INSTANCE|LIFECYCLE_OWNER|LIFECYCLE_TEARDOWN|PAGE_RUNTIME_LIFECYCLE|P0_LIFECYCLE|SELECTOR_LIFECYCLE).*\.md$/i],
    lanes: ['dom', 'performance']
  },
  {
    id: 'audit-seed-startup-proof-doc',
    patterns: [/^docs\/audit\/.*(?:DOCUMENT_START_ZERO_FLASH|SEED_PAGE_GLOBAL_PATCH_TEARDOWN).*\.md$/i],
    lanes: ['json', 'performance']
  },
  {
    id: 'audit-performance-proof-doc',
    patterns: [/^docs\/audit\/.*(?:_|\/)(?:PERFORMANCE|NO_WORK|CACHE|SPA|LAG|ACTIVE_WORK|ACTIVE_RULE|DISABLED_RUNTIME|MASTER_SWITCH|DIAGNOSTIC|LOGGING|CONSOLE)(?:_|\.md$)/i],
    lanes: ['performance']
  },
  {
    id: 'audit-code-burden-proof-doc',
    patterns: [/^docs\/audit\/.*(?:CODE_BURDEN|DECLUTTER|STRUCTURAL_BURDEN|LARGE_FILE|LARGE_SOURCE).*\.md$/i],
    lanes: ['performance']
  },
  {
    id: 'audit-settings-proof-doc',
    patterns: [/^docs\/audit\/.*(?:SETTING|PROFILE|STORAGE|IMPORT|EXPORT|SYNC|COMPILED|BACKUP|NANAH).*\.md$/i],
    lanes: ['settings']
  },
  {
    id: 'audit-proof-doc',
    patterns: [/^docs\/audit\/.*\.md$/],
    lanes: ['smoke']
  },
  {
    id: 'runtime-release-test',
    patterns: [/^tests\/runtime\/.*(?:release|package|manifest|public|build|root-package).*\.test\.mjs$/i],
    lanes: ['release']
  },
  {
    id: 'runtime-whitelist-test',
    patterns: [/^tests\/runtime\/.*whitelist.*\.test\.mjs$/i],
    lanes: ['whitelist']
  },
  {
    id: 'runtime-blocking-test',
    patterns: [/^tests\/runtime\/.*(?:block|keyword|channel|comment).*\.test\.mjs$/i],
    lanes: ['blocking']
  },
  {
    id: 'runtime-json-test',
    patterns: [/^tests\/runtime\/.*(?:json|seed|xhr|network|ytm|youtube-music).*\.test\.mjs$/i],
    lanes: ['json']
  },
  {
    id: 'runtime-dom-test',
    patterns: [/^tests\/runtime\/.*dom.*\.test\.mjs$/i],
    lanes: ['dom']
  },
  {
    id: 'runtime-menu-test',
    patterns: [/^tests\/runtime\/.*(?:menu|quick|collab|dropdown).*\.test\.mjs$/i],
    lanes: ['menu']
  },
  {
    id: 'runtime-performance-test',
    patterns: [/^tests\/runtime\/.*(?:performance|no-work|cache|spa|active-work).*\.test\.mjs$/i],
    lanes: ['performance']
  },
  {
    id: 'runtime-code-burden-test',
    patterns: [/^tests\/runtime\/.*(?:code-burden|declutter|large-file|structural-burden).*\.test\.mjs$/i],
    lanes: ['performance']
  },
  {
    id: 'runtime-settings-test',
    patterns: [/^tests\/runtime\/.*(?:setting|profile|storage|import|export|sync|compiled).*\.test\.mjs$/i],
    lanes: ['settings']
  },
  {
    id: 'runtime-filter-engine-harness',
    patterns: [/^tests\/runtime\/harness\/load-filter-engine\.mjs$/],
    lanes: ['whitelist', 'blocking', 'json', 'dom', 'menu', 'performance', 'settings', 'smoke']
  },
  {
    id: 'runtime-seed-harness',
    patterns: [/^tests\/runtime\/harness\/load-seed-runtime\.mjs$/],
    lanes: ['whitelist', 'json', 'performance', 'smoke']
  },
  {
    id: 'youtube-json-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\/.*\.json$/],
    lanes: ['json', 'smoke']
  },
  {
    id: 'youtube-dom-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\/.*\.html$/],
    lanes: ['dom', 'smoke']
  },
  {
    id: 'youtube-whitelist-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\/.*(?:whitelist|allow|kids|shorts|watch|upnext|endscreen|autoplay|playlist|ytm).*$/i],
    lanes: ['whitelist']
  },
  {
    id: 'youtube-blocking-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\/.*(?:block|keyword|channel|comment|guide|post).*$/i],
    lanes: ['blocking']
  },
  {
    id: 'youtube-collaborator-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\/.*(?:collab|dialog|show-sheet).*$/i],
    lanes: ['whitelist', 'blocking', 'menu']
  },
  {
    id: 'youtube-menu-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\/.*(?:menu|quick|bottom-sheet).*$/i],
    lanes: ['menu']
  },
  {
    id: 'youtube-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\//],
    lanes: ['smoke']
  },
  {
    id: 'runtime-test-surface',
    patterns: [/^tests\/runtime\/.*\.test\.mjs$/],
    lanes: ['smoke']
  }
]);
