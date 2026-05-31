#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const LANES = Object.freeze({
  release: {
    description: 'Build, package, release docs, public claims, and artifact boundaries.',
    checks: ['build.js'],
    tests: [
      'tests/runtime/build-release-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/build-script-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/build-website-callable-current-behavior.test.mjs',
      'tests/runtime/browser-manifest-runtime-load-order-current-behavior.test.mjs',
      'tests/runtime/public-release-surface-current-behavior.test.mjs',
      'tests/runtime/public-release-claim-boundary-current-behavior.test.mjs',
      'tests/runtime/p0-release-package-current-behavior.test.mjs',
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
      'tests/runtime/dom-hide-side-effect-current-behavior.test.mjs',
      'tests/runtime/dom-broad-hide-boundary-current-behavior.test.mjs',
      'tests/runtime/dom-state-virtual-attributes-current-behavior.test.mjs',
      'tests/runtime/dom-target-source-current-behavior.test.mjs',
      'tests/runtime/comments-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/home-feed-dom-cleanup-boundary-current-behavior.test.mjs',
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
      'tests/runtime/seed-fetch-no-work-list-mode-boundary-current-behavior.test.mjs',
      'tests/runtime/seed-xhr-no-work-list-mode-boundary-current-behavior.test.mjs',
      'tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs',
      'tests/runtime/performance-claim-evidence-boundary-current-behavior.test.mjs',
      'tests/runtime/identity-work-budget-current-behavior.test.mjs',
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
      'tests/runtime/storage-refresh-force-reprocess-coalescing-current-behavior.test.mjs',
      'tests/runtime/native-dropdown-close-state-current-behavior.test.mjs',
      'tests/runtime/quick-block-block-menu-affordance-boundary-current-behavior.test.mjs',
      'tests/runtime/empty-install-performance-current-behavior.test.mjs',
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
    lanes: ['dom', 'blocking', 'performance']
  },
  {
    id: 'quick-block-menu-runtime',
    patterns: [/^js\/content\/block_channel\.js$/],
    lanes: ['menu', 'performance']
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
    lanes: ['menu', 'settings', 'json', 'dom', 'whitelist', 'performance']
  },
  {
    id: 'bridge-settings-runtime',
    patterns: [/^js\/content\/bridge_settings\.js$/],
    lanes: ['settings', 'json', 'performance']
  },
  {
    id: 'background-runtime',
    patterns: [/^js\/background\.js$/],
    lanes: ['settings', 'blocking', 'json']
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

function gitLines(args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  if (result.status !== 0) return [];
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function changedPaths() {
  return [
    ...gitLines(['diff', '--name-only', 'HEAD', '--']),
    ...gitLines(['ls-files', '--others', '--exclude-standard'])
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
    const result = classifyPaths(changedPaths());
    printClassification(result);
    process.exit(result.unmatched.length ? 2 : 0);
  }

  if (lane === '--run-changed' || lane === 'run-changed') {
    const result = classifyPaths(changedPaths());
    printClassification(result);
    if (result.unmatched.length) process.exit(2);
    if (!result.lanes.length) {
      console.log('\nNo changed lanes to run.');
      process.exit(0);
    }

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
