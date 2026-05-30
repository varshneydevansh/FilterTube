import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_ROUTE_SURFACE_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md';

const sourceDocs = [
  'docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_MANIFEST_GATE_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_ROUTE_SURFACE_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25.md',
  'docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_SELECTED_ROW_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_RIGHT_RAIL_WHITELIST_OBSERVER_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_KIDS_LATEST_JSON_OWNER_EXTENSION_FIXTURE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'
];

const rows = [
  'FT-CFROUTE-00-scope',
  'FT-CFROUTE-01-json-renderers',
  'FT-CFROUTE-02-desktop-feed-search-channel',
  'FT-CFROUTE-03-watch-current-video',
  'FT-CFROUTE-04-watch-rail-playlist',
  'FT-CFROUTE-05-shorts-shelves-cards',
  'FT-CFROUTE-06-comments-exclusion',
  'FT-CFROUTE-07-mobile-ytm-browse-search',
  'FT-CFROUTE-08-mobile-ytm-watch-playlist',
  'FT-CFROUTE-09-kids-cards',
  'FT-CFROUTE-10-whitelist-pending-exclusions',
  'FT-CFROUTE-11-promotion-decision'
];

const routeSurfaceClosureRows = [
  'FT-CFROUTE-CLOSURE-00-scope',
  'FT-CFROUTE-CLOSURE-01-json-renderers',
  'FT-CFROUTE-CLOSURE-02-desktop-feed-search-channel',
  'FT-CFROUTE-CLOSURE-03-watch-current-video',
  'FT-CFROUTE-CLOSURE-04-watch-rail-playlist',
  'FT-CFROUTE-CLOSURE-05-shorts-shelves-cards',
  'FT-CFROUTE-CLOSURE-06-comments-exclusion',
  'FT-CFROUTE-CLOSURE-07-mobile-ytm-browse-search',
  'FT-CFROUTE-CLOSURE-08-mobile-ytm-watch-playlist',
  'FT-CFROUTE-CLOSURE-09-kids-cards',
  'FT-CFROUTE-CLOSURE-10-whitelist-pending-exclusions',
  'FT-CFROUTE-CLOSURE-11-promotion-decision'
];

const futureAuthorityTokens = [
  'contentFilterFieldEffectRouteSurfaceMatrix',
  'contentFilterRouteSurfaceEffectDecision',
  'contentFilterRouteSurfaceNoWorkBudget',
  'contentFilterRouteSurfaceJsonDomParityReport',
  'contentFilterRouteSurfaceWatchBudget',
  'contentFilterRouteSurfaceYtmBudget',
  'contentFilterRouteSurfaceKidsBudget',
  'contentFilterRouteSurfaceCommentExclusionReport',
  'contentFilterRouteSurfaceRollbackReport',
  'contentFilterRouteSurfacePublicClaimBoundary',
  'contentFilterRouteSurfaceClosure',
  'contentFilterRouteSurfaceClosureRuntimeApproval',
  'contentFilterRouteSurfaceImplementationReadiness',
  'contentFilterRouteSurfaceConvergenceAuthority',
  'contentFilterRouteSurfaceConvergenceReport',
  'contentFilterRouteSurfaceConvergenceApproval'
];

const productFiles = [
  'js/filter_logic.js',
  'js/content/dom_fallback.js',
  'js/content_bridge.js',
  'js/background.js',
  'js/seed.js',
  'js/injector.js',
  'js/settings_shared.js',
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

test('content-filter route surface matrix is audit-only and source-backed', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior content-filter field-effect route\/surface\s+matrix/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /content-filter field-effect route\/surface rows: 12/);
  assert.match(text, /route\/surface classes covered: 9/);
  assert.match(text, /JSON route\/surface approval rows: 0/);
  assert.match(text, /DOM fallback deletion approvals: 0/);
  assert.match(text, /content-filter route\/surface matrix approval: NO-GO/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /content-filter field-effect route\/surface closure rows: 12/);
  assert.match(text, /route\/surface matrix rows linked by closure: 12/);
  assert.match(text, /field-effect manifest rows linked by closure: 12/);
  assert.match(text, /field semantics contract rows linked by closure: 12/);
  assert.match(text, /route\/surface classes linked by closure: 9/);
  assert.match(text, /source input families linked by route\/surface closure: 8/);
  assert.match(text, /runtime route\/surface closure approvals: 0/);
  assert.match(text, /implementation-ready route\/surface rows: 0/);
  assert.match(text, /content-filter route\/surface closure: ROUTE-SURFACE-CHAIN-CLOSED/);
  assert.match(text, /content-filter route\/surface implementation readiness from closure: NO-GO/);
  assert.match(text, /content-filter route\/surface convergence rows: 10/);
  assert.match(text, /field-effect route\/surface rows covered: 12/);
  assert.match(text, /no-work budget rows covered: 12/);
  assert.match(text, /cheap no-work gate families covered: 7/);
  assert.match(text, /known over-work gap families covered: 6/);
  assert.match(text, /runtime content-filter convergence approvals: 0/);
  assert.match(text, /implementation-ready content-filter convergence rows: 0/);
  assert.match(text, /content-filter JSON-first route authority: NO-GO/);
  assert.match(text, /content-filter DOM fallback deletion approval: NO-GO/);

  for (const sourceDoc of sourceDocs) {
    assert.ok(exists(sourceDoc), `missing source doc ${sourceDoc}`);
    assert.ok(text.includes(sourceDoc), `matrix doc does not cite ${sourceDoc}`);
  }
});

test('content-filter route surface rows and diagrams stay explicit', () => {
  const text = doc();
  const foundRows = [...text.matchAll(/^\| `(FT-CFROUTE-(?!CLOSURE)[^`]+)` \|/gm)].map(match => match[1]);
  const foundClosureRows = [...text.matchAll(/^\| `(FT-CFROUTE-CLOSURE-[^`]+)` \|/gm)].map(match => match[1]);

  assert.deepEqual(foundRows, rows);
  assert.deepEqual(foundClosureRows, routeSurfaceClosureRows);
  assert.match(text, /ASCII flow:/);
  assert.match(text, /JSON renderer decisions without route-owned side-effect report/);
  assert.match(text, /DOM fallback route checks and broad card selectors/);
  assert.match(text, /watch\/YTM\/Kids\/pending\/comment special cases/);
  assert.match(text, /```mermaid\nflowchart TD/);
  assert.match(text, /Comments excluded from content-filter fields/);
  assert.match(text, /JSON-first content-filter authority remains NO-GO/);
  assert.match(text, /ASCII convergence flow:/);
  assert.match(text, /field semantics and manifest rows/);
  assert.match(text, /content-filter convergence authority remains NO-GO/);
  assert.match(text, /Mermaid convergence flow:/);
  assert.match(text, /Content-filter convergence authority NO-GO/);
});

test('content-filter route surface convergence boundary stays blocked', () => {
  const text = doc();
  const noWork = read('docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md');
  const foundRows = [...text.matchAll(/^\| `(FT-CFCONVERGE-[^`]+)` \|/gm)].map(match => match[1]);

  assert.deepEqual(foundRows, [
    'FT-CFCONVERGE-00-field-semantics-manifest',
    'FT-CFCONVERGE-01-json-renderer-decisions',
    'FT-CFCONVERGE-02-metadata-fetch-side-effects',
    'FT-CFCONVERGE-03-dom-fallback-side-effects',
    'FT-CFCONVERGE-04-watch-side-effects',
    'FT-CFCONVERGE-05-whitelist-pending-gates',
    'FT-CFCONVERGE-06-comments-exclusion',
    'FT-CFCONVERGE-07-ytm-kids-native-parity',
    'FT-CFCONVERGE-08-no-work-artifact-gap',
    'FT-CFCONVERGE-09-authority-absence'
  ]);

  assert.match(noWork, /content-filter route\/surface convergence rows: 10/);
  assert.match(noWork, /no-work budget rows covered by convergence: 12/);
  assert.match(noWork, /content-filter no-work authority from convergence: NO-GO/);

  for (const decision of [
    'define content-filter route/surface convergence boundary: GO',
    'accept convergence as JSON-first content-filter authority now: NO-GO',
    'accept convergence as DOM fallback deletion approval now: NO-GO',
    'accept convergence as metadata fetch pruning approval now: NO-GO',
    'accept convergence as watch/YTM/Kids/native parity proof now: NO-GO',
    'accept convergence as release/public-claim proof now: NO-GO'
  ]) {
    assert.ok(text.includes(decision), `missing convergence decision ${decision}`);
  }
});

test('JSON content-filter route facts and comment exclusion remain pinned', () => {
  const source = read('js/filter_logic.js');

  assert.match(source, /const isComment = rendererType\.includes\('comment'\) \|\| rendererType\.includes\('Comment'\)/);
  assert.match(source, /if \(!isCommentRenderer\) \{[\s\S]*?_checkContentFilters\(item, rules, rendererType\)/);
  assert.match(source, /if \(!isCommentRenderer\) \{[\s\S]*?_checkCategoryFilters\(item, rules, rendererType\)/);
  assert.match(source, /cf\.duration && cf\.duration\.enabled/);
  assert.match(source, /cf\.uploadDate\?\.enabled/);
  assert.match(source, /cf\.uppercase\?\.enabled/);
  assert.match(source, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);
  assert.doesNotMatch(source, /contentFilterRouteSurfaceEffectDecision/);
});

test('DOM route surface content-filter effects remain split across local gates', () => {
  const source = read('js/content/dom_fallback.js');

  assert.match(source, /document\.documentElement\.setAttribute\('data-filtertube-route-home', routePath === '\/' \? 'true' : 'false'\)/);
  assert.match(source, /document\.documentElement\.setAttribute\('data-filtertube-route-watch', routePath === '\/watch' \? 'true' : 'false'\)/);
  assert.match(source, /html\[data-filtertube-route-home="true"\] ytm-browse ytm-rich-grid-renderer/);
  assert.match(source, /html\[data-filtertube-route-watch="true"\] \[data-filtertube-mobile-comments-card="true"\]/);
  assert.match(source, /const isSearchSecondary = path === '\/results' && !!element\.closest\('ytd-secondary-search-container-renderer'\)/);
  assert.match(source, /path\.startsWith\('\/watch'\)/);
  assert.match(source, /targetToHide\.setAttribute\('data-filtertube-pending-category', 'true'\)/);
  assert.match(source, /targetToHide\.setAttribute\('data-filtertube-pending-upload-date', 'true'\)/);
  assert.match(source, /const isKidsVideoCard = \(/);
  assert.match(source, /const isCommentContext = typeof contentTag === 'string' && contentTag\.toLowerCase\(\)\.includes\('comment'\)/);
  assert.doesNotMatch(source, /contentFilterRouteSurfaceNoWorkBudget/);
});

test('content-filter route matrix is blocked by existing route and metric authority gaps', () => {
  const text = doc();
  const effectManifest = read('docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_MANIFEST_GATE_CURRENT_BEHAVIOR_2026-05-29.md');
  const routeAuthority = read('docs/audit/FILTERTUBE_ROUTE_SURFACE_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md');
  const sideEffectBudget = read('docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md');
  const pendingNoWork = read('docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25.md');
  const bridge = read('js/content_bridge.js');

  assert.match(effectManifest, /contentFilterFieldEffectRouteSurfaceMatrix/);
  assert.match(routeAuthority, /Route\/surface effect authority is documented but not implemented/);
  assert.match(sideEffectBudget, /Committed route\/surface metric side-effect budget files: 0/);
  assert.match(pendingNoWork, /whitelist pending intake no-work contract/);
  assert.match(bridge, /if \(path === '\/' \|\| path === '\/results' \|\| path === '\/feed\/channels' \|\| path\.startsWith\('\/watch'\)\) return/);

  for (const decision of [
    'approve JSON-first content-filter route/surface authority now: NO-GO',
    'delete DOM fallback content-filter route behavior now: NO-GO',
    'use YTM selected-row content-filter behavior as JSON parity proof now: NO-GO',
    'use Kids content-filter behavior as native parity proof now: NO-GO',
    'use comment exclusion as broad content-filter approval now: NO-GO',
    'close content-filter route/surface documentation chain now: GO',
    'accept route/surface closure as JSON-first content-filter route authority now: NO-GO',
    'accept route/surface closure as DOM fallback deletion approval now: NO-GO',
    'accept route/surface closure as YTM parity proof now: NO-GO',
    'accept route/surface closure as Kids/native parity proof now: NO-GO',
    'accept route/surface closure as comment-exclusion broad approval now: NO-GO',
    'accept route/surface closure as release/public-claim approval now: NO-GO'
  ]) {
    assert.ok(text.includes(decision), `missing decision ${decision}`);
  }
});

test('content-filter route surface future authority remains absent from product source', () => {
  const text = doc();
  const source = productSource();
  const artifactPaths = [
    'docs/audit/artifacts/content-filter-field-effect-route-surface-matrix.json',
    'docs/audit/artifacts/content-filter-route-surface-closure.json',
    'docs/audit/artifacts/content-filter-route-surface-implementation-readiness.json',
    'docs/audit/artifacts/content-filter-route-surface-no-work-budget.json',
    'docs/audit/artifacts/content-filter-route-surface-rollback-report.json'
  ];

  for (const token of futureAuthorityTokens) {
    assert.ok(text.includes(token), `doc missing future authority token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }

  for (const artifactPath of artifactPaths) {
    assert.equal(exists(artifactPath), false, `unexpected committed artifact ${artifactPath}`);
  }

  assert.match(text, /This matrix is not a completion claim/);
});
