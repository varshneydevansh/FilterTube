#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MANUAL_YOUTUBE_SMOKE_LANE_REASONS = Object.freeze({
  whitelist: 'whitelist-only leaks, Shorts, watch/end-screen, Kids/YTM allow behavior',
  blocking: 'keyword/channel/comment hiding and blocklist false-hide/leak behavior',
  json: 'JSON-first filtering, network interception, and SPA response mutation',
  dom: 'DOM fallback hiding/restores and recycled YouTube nodes',
  menu: '3-dot menus, quick-block, collaborator actions, and native dropdown state',
  performance: 'empty-rule/no-work and repeated YouTube SPA navigation responsiveness',
  settings: 'profile/mode/storage changes reprocessing already-rendered cards'
});

const LIVE_SMOKE_ARTIFACT_TEMPLATE = 'docs/audit/artifacts/release-live-youtube-spa-smoke/template.json';
const LIVE_SMOKE_ARTIFACT_VERIFIER =
  'node docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs docs/audit/artifacts/release-live-youtube-spa-smoke/<artifact>.json';
const LIVE_SMOKE_REQUIRED_ROWS = Object.freeze([
  'FT-LIVE-SPA-00-home-to-search',
  'FT-LIVE-SPA-01-search-to-channel',
  'FT-LIVE-SPA-02-channel-to-watch',
  'FT-LIVE-SPA-03-watch-to-home',
  'FT-LIVE-SPA-04-watch-rail-scroll',
  'FT-LIVE-SPA-05-cache-repeat-navigation'
]);

const RUNTIME_FIXTURE_LANE_REASONS = Object.freeze({
  whitelist: 'whitelist allow/leak fixtures for touched YouTube surfaces',
  blocking: 'keyword/channel/comment hide-decision fixtures',
  json: 'JSON renderer, endpoint, response, or no-work fixtures',
  dom: 'DOM selector, cleanup, restore, or recycled-node fixtures',
  menu: '3-dot menu, quick-block, collaborator, or native dropdown fixtures',
  performance: 'empty-rule/no-work, SPA, timer, observer, or cache fixtures',
  settings: 'profile, storage, import/export, or compiled-mode fixtures'
});

const AUDIT_PROOF_PATH_PATTERN = /^docs\/audit\//;
const RUNTIME_TEST_PROOF_PATH_PATTERN = /^tests\/runtime\/.*\.test\.mjs$/;
const RUNTIME_FIXTURE_PROOF_PATH_PATTERN = /^tests\/runtime\/(?:fixtures\/|harness\/|.*\.test\.mjs$)/;
const NON_PROOF_LANE = 'smoke';

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
      'tests/runtime/release-build-artifact-claim-boundary-current-behavior.test.mjs',
      'tests/runtime/release-live-youtube-spa-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/release-live-youtube-spa-smoke-boundary-current-behavior.test.mjs',
      'tests/runtime/release-notes-json-version-gate-boundary-current-behavior.test.mjs',
      'tests/runtime/release-package-parity-current-behavior.test.mjs',
      'tests/runtime/root-package-metadata-script-surface-current-behavior.test.mjs',
      'tests/runtime/test-lane-matrix-current-behavior.test.mjs'
    ]
  },
  whitelist: {
    description: 'Whitelist-only mode, pending hides, allow-list leaks, Shorts, watch, end-screen, Kids, and YTM allow behavior.',
    tests: [
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
      'tests/runtime/json-first-whitelist-decision-identity-boundary-current-behavior.test.mjs'
    ]
  },
  dom: {
    description: 'DOM fallback selectors, hide/restore state, cleanup passes, and recycled node behavior.',
    tests: [
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
      'tests/runtime/io-manager-method-semantic-register-current-behavior.test.mjs'
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
      'tests/runtime/release-live-youtube-spa-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/release-live-youtube-spa-smoke-boundary-current-behavior.test.mjs',
      'tests/runtime/audit-runtime-backlog-current-behavior.test.mjs',
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
    patterns: [/^scripts\/(?:run-test-lane|audit-proof-drift)\.mjs$/, /^docs\/audit\/TEST_LANE_MATRIX\.md$/],
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
    id: 'audit-performance-proof-doc',
    patterns: [/^docs\/audit\/.*(?:PERFORMANCE|NO_WORK|CACHE|SPA|LAG|ACTIVE_WORK).*\.md$/i],
    lanes: ['performance']
  },
  {
    id: 'audit-settings-proof-doc',
    patterns: [/^docs\/audit\/.*(?:SETTING|PROFILE|STORAGE|IMPORT|EXPORT|SYNC|COMPILED).*\.md$/i],
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

export function laneNames() {
  return Object.keys(LANES);
}

function normalizePath(file) {
  return file.replace(/\\/g, '/').replace(/^\.\//, '');
}

function orderedLanes(values) {
  const known = laneNames();
  return [...new Set(values)].sort((a, b) => known.indexOf(a) - known.indexOf(b));
}

function laneOwnershipForFile(file) {
  const owners = [];
  for (const [lane, config] of Object.entries(LANES)) {
    if ([...(config.checks || []), ...(config.tests || [])].includes(file)) {
      owners.push(lane);
    }
  }
  return owners;
}

export function classifyPaths(paths) {
  const lanes = new Set();
  const classifications = [];
  const unmatched = [];

  for (const rawPath of paths) {
    const file = normalizePath(String(rawPath || '').trim());
    if (!file) continue;

    const matched = [];
    const laneOwned = laneOwnershipForFile(file);
    if (laneOwned.length) {
      for (const lane of laneOwned) lanes.add(lane);
      matched.push({
        id: 'lane-owned-test-or-check',
        lanes: orderedLanes(laneOwned)
      });
    }

    for (const rule of FILE_LANE_RULES) {
      if (rule.patterns.some(pattern => pattern.test(file))) {
        for (const lane of rule.lanes) lanes.add(lane);
        matched.push({
          id: rule.id,
          lanes: orderedLanes(rule.lanes)
        });
      }
    }

    if (matched.length) {
      classifications.push({ file, matched });
    } else {
      unmatched.push(file);
    }
  }

  return {
    lanes: orderedLanes(lanes),
    classifications,
    unmatched
  };
}

export function validateLaneFiles() {
  const missing = [];
  for (const [lane, config] of Object.entries(LANES)) {
    for (const file of [...(config.checks || []), ...(config.tests || [])]) {
      if (!fs.existsSync(path.join(repoRoot, file))) {
        missing.push(`${lane}:${file}`);
      }
    }
  }
  return missing;
}

export function auditProofRequirement(result) {
  const auditProofFiles = [];
  const proofRelevantFiles = [];
  const auditProofLanes = new Set();
  const proofRelevantLanes = new Set();

  for (const entry of result.classifications) {
    const entryLanes = entry.matched
      .flatMap(rule => rule.lanes)
      .filter(lane => lane !== NON_PROOF_LANE);

    if (AUDIT_PROOF_PATH_PATTERN.test(entry.file)) {
      auditProofFiles.push(entry.file);
      for (const lane of entryLanes) auditProofLanes.add(lane);
    } else if (!RUNTIME_TEST_PROOF_PATH_PATTERN.test(entry.file)) {
      proofRelevantFiles.push(entry.file);
      for (const lane of entryLanes) proofRelevantLanes.add(lane);
    }
  }

  const sharedProofLanes = orderedLanes(
    [...proofRelevantLanes].filter(lane => auditProofLanes.has(lane))
  );

  return {
    auditProofFiles,
    proofRelevantFiles,
    auditProofLanes: orderedLanes(auditProofLanes),
    proofRelevantLanes: orderedLanes(proofRelevantLanes),
    sharedProofLanes,
    missing: proofRelevantFiles.length > 0 && auditProofFiles.length === 0,
    irrelevant:
      proofRelevantFiles.length > 0 &&
      auditProofFiles.length > 0 &&
      proofRelevantLanes.size > 0 &&
      sharedProofLanes.length === 0
  };
}

export function runtimeFixtureRequirement(result) {
  const runtimeRelevantFiles = [];
  const runtimeProofFiles = [];
  const runtimeRelevantLanes = new Set();
  const runtimeProofLanes = new Set();

  for (const entry of result.classifications) {
    const entryLanes = entry.matched
      .flatMap(rule => rule.lanes)
      .filter(lane => Object.hasOwn(RUNTIME_FIXTURE_LANE_REASONS, lane));

    if (!entryLanes.length) continue;

    if (RUNTIME_FIXTURE_PROOF_PATH_PATTERN.test(entry.file)) {
      runtimeProofFiles.push(entry.file);
      for (const lane of entryLanes) runtimeProofLanes.add(lane);
    } else if (!AUDIT_PROOF_PATH_PATTERN.test(entry.file)) {
      runtimeRelevantFiles.push(entry.file);
      for (const lane of entryLanes) runtimeRelevantLanes.add(lane);
    }
  }

  const sharedRuntimeProofLanes = orderedLanes(
    [...runtimeRelevantLanes].filter(lane => runtimeProofLanes.has(lane))
  );

  return {
    runtimeRelevantFiles,
    runtimeProofFiles,
    runtimeRelevantLanes: orderedLanes(runtimeRelevantLanes),
    runtimeProofLanes: orderedLanes(runtimeProofLanes),
    sharedRuntimeProofLanes,
    missing: runtimeRelevantFiles.length > 0 && runtimeProofFiles.length === 0,
    irrelevant:
      runtimeRelevantFiles.length > 0 &&
      runtimeProofFiles.length > 0 &&
      runtimeRelevantLanes.size > 0 &&
      sharedRuntimeProofLanes.length === 0
  };
}

function gitLines(args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  if (result.status !== 0) return [];
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

export function changedPathsFromGit(gitLineReader = gitLines) {
  return [
    ...gitLineReader(['diff', '--name-only', 'HEAD', '--']),
    ...gitLineReader(['ls-files', '--others', '--exclude-standard'])
  ];
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    stdio: 'inherit'
  });
  if (typeof result.status === 'number') return result.status;
  if (result.signal) return 1;
  return 1;
}

function formatLaneList(lanes) {
  return lanes.length ? lanes.map(lane => `test:${lane}`).join(', ') : 'none';
}

function runLane(lane) {
  const config = LANES[lane];
  if (!config) {
    console.error(`Unknown test lane "${lane}".`);
    console.error(`Known lanes: ${laneNames().join(', ')}`);
    return 1;
  }

  const missing = validateLaneFiles().filter(item => item.startsWith(`${lane}:`));
  if (missing.length) {
    console.error(`Missing files for ${lane}:`);
    for (const item of missing) console.error(`- ${item.slice(lane.length + 1)}`);
    return 1;
  }

  for (const file of config.checks || []) {
    const status = runNode(['--check', file]);
    if (status !== 0) return status;
  }

  return runNode(['--test', ...config.tests]);
}

function runAuditDrift() {
  return runNode(['scripts/audit-proof-drift.mjs', '--lane-owned']);
}

function printClassification(result) {
  if (!result.classifications.length && !result.unmatched.length) {
    console.log('No changed paths to classify.');
    return;
  }

  if (result.lanes.length) {
    console.log('Required lane commands:');
    for (const lane of result.lanes) console.log(`  npm run test:${lane}`);
  } else {
    console.log('Required lane commands: none');
  }

  const manualSmokeReasons = [];
  for (const lane of result.lanes) {
    if (Object.hasOwn(MANUAL_YOUTUBE_SMOKE_LANE_REASONS, lane)) {
      manualSmokeReasons.push([lane, MANUAL_YOUTUBE_SMOKE_LANE_REASONS[lane]]);
    }
  }

  if (manualSmokeReasons.length) {
    console.log('\nManual YouTube smoke required when user-facing:');
    for (const [lane, reason] of manualSmokeReasons) {
      console.log(`  test:${lane}: ${reason}`);
    }
    console.log('  Live smoke artifact handoff:');
    console.log(`    template: ${LIVE_SMOKE_ARTIFACT_TEMPLATE}`);
    console.log(`    verifier: ${LIVE_SMOKE_ARTIFACT_VERIFIER}`);
    console.log(`    required rows: ${LIVE_SMOKE_REQUIRED_ROWS.join(', ')}`);
  }

  const {
    auditProofFiles,
    proofRelevantFiles,
    proofRelevantLanes,
    auditProofLanes,
    sharedProofLanes,
    missing,
    irrelevant
  } = auditProofRequirement(result);

  if (auditProofFiles.length) {
    console.log('\nAudit proof files in this change:');
    for (const file of auditProofFiles) console.log(`  ${file}`);
    if (proofRelevantFiles.length) {
      if (sharedProofLanes.length) {
        console.log(`  Shared proof lane(s): ${formatLaneList(sharedProofLanes)}`);
      } else if (irrelevant) {
        console.log('  Audit proof relevance mismatch:');
        console.log(`    touched lane(s): ${formatLaneList(proofRelevantLanes)}`);
        console.log(`    proof lane(s): ${formatLaneList(auditProofLanes)}`);
        console.log('    test:changed will fail until docs/audit proof shares a non-smoke lane with the touched files.');
      }
    }
  } else if (proofRelevantFiles.length) {
    console.log('\nAudit proof update expected before commit:');
    console.log('  Add or update a relevant docs/audit/ proof file for:');
    for (const file of proofRelevantFiles) console.log(`  - ${file}`);
    if (missing) {
      console.log('  test:changed will fail until this logical change includes docs/audit proof.');
    }
  }

  const runtimeFixture = runtimeFixtureRequirement(result);
  const runtimeFixtureReasons = [];
  for (const lane of runtimeFixture.runtimeRelevantLanes) {
    runtimeFixtureReasons.push([lane, RUNTIME_FIXTURE_LANE_REASONS[lane]]);
  }

  if (runtimeFixture.runtimeProofFiles.length) {
    console.log('\nRuntime fixture/test proof files in this change:');
    for (const file of runtimeFixture.runtimeProofFiles) console.log(`  ${file}`);
    if (runtimeFixture.runtimeRelevantFiles.length) {
      if (runtimeFixture.sharedRuntimeProofLanes.length) {
        console.log(`  Shared runtime proof lane(s): ${formatLaneList(runtimeFixture.sharedRuntimeProofLanes)}`);
      } else if (runtimeFixture.irrelevant) {
        console.log('  Runtime fixture/test proof relevance mismatch:');
        console.log(`    touched runtime lane(s): ${formatLaneList(runtimeFixture.runtimeRelevantLanes)}`);
        console.log(`    proof runtime lane(s): ${formatLaneList(runtimeFixture.runtimeProofLanes)}`);
        console.log('    behavior changes should update a fixture/test that shares a touched runtime lane.');
      }
    }
  }

  if (runtimeFixtureReasons.length) {
    console.log('\nRuntime fixture proof expected when behavior changes:');
    for (const [lane, reason] of runtimeFixtureReasons) {
      console.log(`  test:${lane}: ${reason}`);
    }
    if (runtimeFixture.missing) {
      console.log('  No runtime fixture/test proof file changed; refactor-only changes must be covered by the passing lane.');
    }
  }

  if (result.classifications.length) {
    console.log('\nMatched paths:');
    for (const entry of result.classifications) {
      const ruleText = entry.matched
        .map(rule => `${rule.id} -> ${rule.lanes.map(lane => `test:${lane}`).join(', ')}`)
        .join('; ');
      console.log(`  ${entry.file}: ${ruleText}`);
    }
  }

  if (result.unmatched.length) {
    console.log('\nUnmatched paths requiring explicit lane classification:');
    for (const file of result.unmatched) console.log(`  ${file}`);
  }
}

function printList() {
  for (const [name, config] of Object.entries(LANES)) {
    console.log(`${name}: ${config.description}`);
    if (config.checks?.length) console.log(`  checks: ${config.checks.join(', ')}`);
    console.log(`  tests: ${config.tests.length}`);
  }
}

function main() {
  const lane = process.argv[2];

  if (lane === '--classify' || lane === 'classify') {
    const result = classifyPaths(process.argv.slice(3));
    printClassification(result);
    process.exit(result.unmatched.length ? 2 : 0);
  }

  if (lane === '--changed' || lane === 'changed') {
    const result = classifyPaths(changedPathsFromGit());
    printClassification(result);
    process.exit(result.unmatched.length ? 2 : 0);
  }

  if (lane === '--run-changed' || lane === 'run-changed') {
    const result = classifyPaths(changedPathsFromGit());
    printClassification(result);
    if (result.unmatched.length) process.exit(2);
    const auditProof = auditProofRequirement(result);
    if (auditProof.missing) process.exit(3);
    if (auditProof.irrelevant) process.exit(4);
    if (!result.lanes.length) {
      console.log('\nNo changed lanes to run.');
      process.exit(0);
    }

    console.log('\n==> Running test:audit-drift');
    const driftStatus = runAuditDrift();
    if (driftStatus !== 0) process.exit(driftStatus);

    for (const changedLane of result.lanes) {
      console.log(`\n==> Running test:${changedLane}`);
      const status = runLane(changedLane);
      if (status !== 0) process.exit(status);
    }

    process.exit(0);
  }

  if (!lane || lane === '--list' || lane === 'list') {
    printList();
    process.exit(lane ? 0 : 1);
  }

  process.exit(runLane(lane));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
