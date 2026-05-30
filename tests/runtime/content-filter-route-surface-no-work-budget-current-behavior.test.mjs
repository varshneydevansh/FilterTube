import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md';

const sourceDocs = [
  'docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_ROUTE_SURFACE_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_MANIFEST_GATE_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25.md',
  'docs/audit/FILTERTUBE_EMPTY_INSTALL_IDLE_OBSERVER_BUDGET_CURRENT_BEHAVIOR_2026-05-26.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_NO_WORK_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md'
];

const rows = [
  'FT-CFNOWORK-00-scope',
  'FT-CFNOWORK-01-seed-network',
  'FT-CFNOWORK-02-json-work-predicate',
  'FT-CFNOWORK-03-main-world-injection',
  'FT-CFNOWORK-04-identity-prefetch',
  'FT-CFNOWORK-05-dom-fallback-active',
  'FT-CFNOWORK-06-dom-fallback-fail-open-catch',
  'FT-CFNOWORK-07-whitelist-pending-intake',
  'FT-CFNOWORK-08-metadata-scheduler',
  'FT-CFNOWORK-09-comments-exclusion',
  'FT-CFNOWORK-10-empty-install-boundary',
  'FT-CFNOWORK-11-promotion-decision'
];

const closureRows = [
  'FT-CFNOWORK-CLOSURE-00-scope-and-promotion',
  'FT-CFNOWORK-CLOSURE-01-seed-json-predicate',
  'FT-CFNOWORK-CLOSURE-02-main-world-identity',
  'FT-CFNOWORK-CLOSURE-03-dom-fallback-policy',
  'FT-CFNOWORK-CLOSURE-04-pending-hide-intake',
  'FT-CFNOWORK-CLOSURE-05-metadata-comments',
  'FT-CFNOWORK-CLOSURE-06-empty-install-boundary'
];

const futureAuthorityTokens = [
  'contentFilterRouteSurfaceNoWorkBudget',
  'contentFilterNoWorkDecisionReport',
  'contentFilterSeedNoWorkCounter',
  'contentFilterDomFallbackNoWorkCounter',
  'contentFilterMainWorldNoWorkCounter',
  'contentFilterPendingHideNoWorkCounter',
  'contentFilterMetadataFetchNoWorkCounter',
  'contentFilterNoWorkLiveTraceArtifact',
  'contentFilterNoWorkRollbackReport',
  'contentFilterNoWorkPublicClaimBoundary',
  'contentFilterNoWorkBudgetClosure',
  'contentFilterNoWorkBudgetClosureApproval',
  'contentFilterNoWorkImplementationReadiness',
  'contentFilterRouteSurfaceConvergenceAuthority',
  'contentFilterRouteSurfaceConvergenceReport'
];

const productFiles = [
  'js/seed.js',
  'js/content_bridge.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/filter_logic.js',
  'js/background.js',
  'js/injector.js',
  'build.js',
  'scripts/sync-native-runtime.mjs'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function doc() {
  return read(docPath);
}

function productSource() {
  return productFiles.filter(exists).map(read).join('\n');
}

test('content-filter no-work budget is audit-only and source-backed', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior content-filter route\/surface no-work\s+budget/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /content-filter route\/surface no-work budget rows: 12/);
  assert.match(text, /current cheap no-work gate families covered: 7/);
  assert.match(text, /known over-work gap families covered: 6/);
  assert.match(text, /runtime no-work authority approvals: 0/);
  assert.match(text, /content-filter no-work budget approval: NO-GO/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /content-filter no-work closure rows: 7/);
  assert.match(text, /budget rows covered by closure rows: 12/);
  assert.match(text, /source input families linked: 7/);
  assert.match(text, /committed no-work metric artifacts: 0/);
  assert.match(text, /committed live trace artifacts: 0/);
  assert.match(text, /runtime no-work closure approvals: 0/);
  assert.match(text, /content-filter no-work closure: BUDGET-CHAIN-CLOSED/);
  assert.match(text, /content-filter implementation readiness from closure: NO-GO/);
  assert.match(text, /content-filter route\/surface convergence rows: 10/);
  assert.match(text, /no-work budget rows covered by convergence: 12/);
  assert.match(text, /cheap no-work gate families covered by convergence: 7/);
  assert.match(text, /known over-work gap families covered by convergence: 6/);
  assert.match(text, /runtime content-filter convergence approvals: 0/);
  assert.match(text, /implementation-ready content-filter convergence rows: 0/);
  assert.match(text, /content-filter no-work authority from convergence: NO-GO/);

  for (const sourceDoc of sourceDocs) {
    assert.ok(exists(sourceDoc), `missing source doc ${sourceDoc}`);
    assert.ok(text.includes(sourceDoc), `no-work budget doc does not cite ${sourceDoc}`);
  }
});

test('content-filter no-work rows and diagrams stay explicit', () => {
  const text = doc();
  const foundRows = [...text.matchAll(/^\| `(FT-CFNOWORK-(?!CLOSURE)[^`]+)` \|/gm)].map(match => match[1]);
  const foundClosureRows = [...text.matchAll(/^\| `(FT-CFNOWORK-CLOSURE-[^`]+)` \|/gm)].map(match => match[1]);

  assert.deepEqual(foundRows, rows);
  assert.deepEqual(foundClosureRows, closureRows);
  for (const row of rows) {
    const references = text.match(new RegExp(row, 'g')) || [];
    assert.ok(references.length >= 2, `budget row lacks closure reference: ${row}`);
  }
  assert.match(text, /ASCII flow:/);
  assert.match(text, /seed hasNetworkJsonWork gate/);
  assert.match(text, /DOM fallback hasActiveDOMFallbackWork gate/);
  assert.match(text, /metadata scheduler field-need gates/);
  assert.match(text, /```mermaid\nflowchart TD/);
  assert.match(text, /Route\/surface no-work authority remains NO-GO/);
});

test('seed and bridge no-work predicates remain split and fail open on exceptions', () => {
  const seed = read('js/seed.js');
  const bridge = read('js/content_bridge.js');

  assert.match(seed, /function hasNetworkJsonWork\(settings\) \{[\s\S]*?if \(!settings \|\| settings\.enabled === false\) return false;[\s\S]*?if \(settings\.listMode === 'whitelist'\) return true;[\s\S]*?return hasEnabledContentFilters\(settings\) \|\| hasActiveJsonFilterRules\(settings\);/);
  assert.match(seed, /function shouldBypassYouTubeiNetworkResponse\(dataName\) \{[\s\S]*?if \(!cachedSettings\)[\s\S]*?return true;[\s\S]*?if \(hasNetworkJsonWork\(cachedSettings\)\) return false;[\s\S]*?return true;/);
  assert.match(bridge, /function needsMainWorldRuntimeWork\(settings\) \{[\s\S]*?if \(!settings \|\| typeof settings !== 'object'\) return false;[\s\S]*?if \(settings\.enabled === false\) return false;[\s\S]*?if \(settings\.listMode === 'whitelist'\) return true;[\s\S]*?return hasBridgeEnabledContentFilters\(settings\) \|\| hasBridgeActiveJsonFilterRules\(settings\);[\s\S]*?\} catch \(e\) \{[\s\S]*?return true;/);
  assert.match(bridge, /function needsIdentityPrefetchWork\(settings\) \{[\s\S]*?if \(settings\.listMode === 'whitelist'\) return true;[\s\S]*?return bridgeHasList\(settings\.filterChannels\);[\s\S]*?\} catch \(e\) \{[\s\S]*?return true;/);
});

test('DOM fallback and whitelist pending no-work gates remain source-pinned', () => {
  const dom = read('js/content/dom_fallback.js');
  const bridge = read('js/content_bridge.js');

  assert.match(dom, /function hasActiveDOMFallbackWork\(settings\) \{[\s\S]*?if \(!settings \|\| typeof settings !== 'object'\) return false;[\s\S]*?if \(settings\.enabled === false\) return false;[\s\S]*?if \(listMode === 'whitelist'\) return true;/);
  assert.match(dom, /booleanFilterKeys = \[[\s\S]*?'hideHomeFeed'[\s\S]*?'hideEndscreenVideowall'[\s\S]*?\]/);
  assert.match(dom, /contentFilters\?\.duration\?\.enabled === true \|\|[\s\S]*?contentFilters\?\.uploadDate\?\.enabled === true \|\|[\s\S]*?contentFilters\?\.uppercase\?\.enabled === true/);
  assert.match(dom, /return categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\);[\s\S]*?\} catch \(e\) \{[\s\S]*?return true;/);
  assert.match(bridge, /function queueWhitelistPendingHide\(mutations, delayMs = 40\) \{[\s\S]*?if \(currentSettings\?\.listMode !== 'whitelist'\) return;[\s\S]*?if \(path === '\/' \|\| path === '\/results' \|\| path === '\/feed\/channels' \|\| path\.startsWith\('\/watch'\)\) return;[\s\S]*?if \(whitelistPendingRefreshState\.pendingHideCandidates\.length >= WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT\) return;/);
  assert.ok(bridge.indexOf("path === '/' || path === '/results'") < bridge.indexOf('node.querySelector?.(VIDEO_CARD_SELECTORS)'));
});

test('no-work budget decisions stay blocked by existing proof gaps', () => {
  const text = doc();
  const routeMatrix = read('docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_ROUTE_SURFACE_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md');
  const metadataNoWork = read('docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-22.md');
  const pendingNoWork = read('docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25.md');
  const idleBudget = read('docs/audit/FILTERTUBE_EMPTY_INSTALL_IDLE_OBSERVER_BUDGET_CURRENT_BEHAVIOR_2026-05-26.md');

  assert.match(routeMatrix, /approve JSON-first content-filter route\/surface authority now: NO-GO/);
  assert.match(metadataNoWork, /not completion proof for JSON-first video metadata no-work authority/);
  assert.match(pendingNoWork, /runtime whitelist optimization patch now: NO-GO/);
  assert.match(idleBudget, /broad observer\/listener\/timer completion: NO-GO/);

  for (const decision of [
    'approve JSON-first content-filter no-work authority now: NO-GO',
    'delete DOM fallback no-work route behavior now: NO-GO',
    'use empty-install idle observer proof as broad no-work completion now: NO-GO',
    'use whitelist pending-intake patch as broad whitelist optimization proof now: NO-GO',
    'use metadata scheduler no-work gates as route/surface fetch authority now: NO-GO',
    'close content-filter no-work documentation chain now: GO',
    'accept closure as JSON-first no-work authority now: NO-GO',
    'accept closure as DOM fallback deletion approval now: NO-GO',
    'accept closure as live trace or metric artifact evidence now: NO-GO',
    'accept closure as whitelist optimization approval now: NO-GO',
    'accept closure as metadata scheduler fetch authority now: NO-GO',
    'accept closure as release/public-claim approval now: NO-GO',
    'use no-work budget in content-filter convergence boundary: GO',
    'accept no-work budget as standalone optimization approval now: NO-GO',
    'accept convergence handoff as live route/surface metric proof now: NO-GO',
    'accept convergence handoff as JSON-first content-filter authority now: NO-GO',
    'accept convergence handoff as release/public-claim proof now: NO-GO'
  ]) {
    assert.ok(text.includes(decision), `missing decision ${decision}`);
  }
});

test('content-filter no-work future authority remains absent from product source', () => {
  const text = doc();
  const source = productSource();
  const artifactPaths = [
    'docs/audit/artifacts/content-filter-route-surface-no-work-budget.json',
    'docs/audit/artifacts/content-filter-no-work-live-trace.json',
    'docs/audit/artifacts/content-filter-no-work-rollback-report.json'
  ];

  for (const token of futureAuthorityTokens) {
    assert.ok(text.includes(token), `doc missing future authority token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }

  for (const artifactPath of artifactPaths) {
    assert.equal(exists(artifactPath), false, `unexpected committed artifact ${artifactPath}`);
  }

  assert.match(text, /This budget is not a completion claim/);
});
