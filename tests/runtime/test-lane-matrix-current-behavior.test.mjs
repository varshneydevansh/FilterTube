import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FILE_LANE_RULES,
  LANES,
  classifyPaths,
  laneNames,
  validateLaneFiles
} from '../../scripts/run-test-lane.mjs';
import { collectProofDrift, laneOwnedProofFiles } from '../../scripts/audit-proof-drift.mjs';

const repoRoot = process.cwd();
const matrixPath = 'docs/audit/TEST_LANE_MATRIX.md';
const requiredLanes = [
  'release',
  'whitelist',
  'blocking',
  'json',
  'dom',
  'menu',
  'performance',
  'settings',
  'smoke'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('test lane matrix defines every required lane and npm script', () => {
  const pkg = readJson('package.json');
  const matrix = read(matrixPath);
  const driftScript = read('scripts/audit-proof-drift.mjs');
  const resumedGoalTerms = [
    'FilterTube Change-Safety Audit and Test Lanes',
    'Keep audit proof files inside `docs/audit/`',
    'Turn confirmed risks into focused fixtures/tests',
    'Create `docs/audit/TEST_LANE_MATRIX.md`',
    'Define required lanes by touched area',
    'Commit only with passing lane'
  ];

  assert.deepEqual(laneNames().sort(), requiredLanes.toSorted());
  assert.equal(validateLaneFiles().length, 0);

  for (const lane of requiredLanes) {
    assert.equal(pkg.scripts[`test:${lane}`], `node scripts/run-test-lane.mjs ${lane}`);
    assert.match(matrix, new RegExp(`npm run test:${lane}`));
    assert.ok(LANES[lane].description);
    assert.ok(Array.isArray(LANES[lane].tests));
    assert.ok(LANES[lane].tests.length >= 8, `${lane} lane should have focused test coverage`);
  }

  assert.equal(pkg.scripts['test:audit-drift'], 'node scripts/audit-proof-drift.mjs --lane-owned');
  assert.equal(pkg.scripts['lanes:changed'], 'node scripts/run-test-lane.mjs --changed');
  assert.equal(pkg.scripts['test:changed'], 'node scripts/run-test-lane.mjs --run-changed');
  assert.equal(pkg.scripts['audit:runtime'], 'node --test tests/runtime/*.test.mjs');
  assert.match(matrix, /npm run test:audit-drift/);
  assert.match(matrix, /npm run lanes:changed/);
  assert.match(matrix, /npm run test:changed/);
  assert.match(matrix, /npm run audit:runtime/);
  assert.match(matrix, /Manual YouTube Smoke Handoff/);
  assert.match(matrix, /docs\/audit\/FILTERTUBE_RELEASE_LIVE_YOUTUBE_SPA_SMOKE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25\.md/);
  assert.match(matrix, /docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/template\.json/);
  assert.match(matrix, /docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/run-live-smoke\.mjs/);
  assert.match(driftScript, /args\.has\('--lane-owned'\) && args\.has\('--all'\)/);

  for (const term of resumedGoalTerms) {
    assert.ok(matrix.includes(term), `resumed goal coverage missing ${term}`);
  }
});

test('test lane matrix maps high-risk source files to expected lanes', () => {
  const matrix = read(matrixPath);

  const requiredMappings = [
    ['js/seed.js', ['test:json', 'test:performance']],
    ['js/injector.js', ['test:json', 'test:whitelist', 'test:performance']],
    ['js/content/dom_fallback.js', ['test:dom', 'test:blocking', 'test:performance']],
    ['js/content/block_channel.js', ['test:menu', 'test:performance']],
    ['js/content_bridge.js', ['test:menu', 'test:settings']],
    ['js/background.js', ['test:settings', 'test:blocking']],
    ['manifest*.json', ['test:release']],
    ['README.md', ['test:release', 'test:smoke']]
  ];

  for (const [file, lanes] of requiredMappings) {
    const row = matrix.split('\n').find(line => line.startsWith('|') && line.includes(file));
    assert.ok(row, `${file} mapping missing`);
    for (const lane of lanes) {
      assert.match(row, new RegExp(lane.replace(':', ':')));
    }
  }
});

test('executable classifier maps high-risk paths to required lanes', () => {
  assert.ok(FILE_LANE_RULES.length >= 30);

  const seed = classifyPaths(['js/seed.js']);
  assert.deepEqual(seed.lanes, ['json', 'performance']);
  assert.deepEqual(seed.unmatched, []);

  const bridge = classifyPaths(['js/content_bridge.js']);
  assert.deepEqual(bridge.lanes, ['whitelist', 'json', 'dom', 'menu', 'performance', 'settings']);
  assert.deepEqual(bridge.unmatched, []);

  const release = classifyPaths(['README.md', 'manifest.chrome.json', 'docs/audit/TEST_LANE_MATRIX.md']);
  assert.deepEqual(release.lanes, ['release', 'smoke']);
  assert.deepEqual(release.unmatched, []);

  const auditDoc = classifyPaths(['docs/audit/FILTERTUBE_JSON_FIRST_HIDE_HOME_FEED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md']);
  assert.deepEqual(auditDoc.lanes, ['json', 'smoke']);
  assert.deepEqual(auditDoc.unmatched, []);

  const packageSurface = classifyPaths(['package.json', 'website/components/footer-signal-art.js']);
  assert.deepEqual(packageSurface.lanes, ['release', 'smoke']);
  assert.deepEqual(packageSurface.unmatched, []);
});

test('executable classifier inherits lanes from lane-owned tests and rejects unknown paths', () => {
  const owned = classifyPaths(['tests/runtime/native-dropdown-close-state-current-behavior.test.mjs']);
  assert.deepEqual(owned.lanes, ['menu', 'smoke']);
  assert.deepEqual(owned.unmatched, []);
  assert.equal(owned.classifications[0].matched[0].id, 'lane-owned-test-or-check');

  const unknown = classifyPaths(['tools/new-unclassified-helper.js']);
  assert.deepEqual(unknown.lanes, []);
  assert.deepEqual(unknown.unmatched, ['tools/new-unclassified-helper.js']);
});

test('changed-lane runner is wired to the classifier and sequential lane execution', () => {
  const runner = read('scripts/run-test-lane.mjs');
  const matrix = read(matrixPath);

  assert.match(runner, /gitLines\(\['diff', '--name-only', 'HEAD', '--'\]\)/);
  assert.doesNotMatch(runner, /--diff-filter=ACMRTUXB/);
  assert.match(runner, /if \(result\.signal\) return 1/);
  assert.match(runner, /lane === '--run-changed' \|\| lane === 'run-changed'/);
  assert.match(runner, /const result = classifyPaths\(changedPaths\(\)\)/);
  assert.match(runner, /if \(result\.unmatched\.length\) process\.exit\(2\)/);
  assert.match(runner, /for \(const changedLane of result\.lanes\)/);
  assert.match(runner, /runLane\(changedLane\)/);
  assert.match(runner, /process\.exit\(runLane\(lane\)\)/);
  assert.match(matrix, /fails on any unclassified\s+changed path/);
  assert.match(matrix, /runs the required lanes sequentially in matrix order/);
});

test('smoke lane keeps release confidence broad but bounded', () => {
  const smoke = LANES.smoke.tests.join('\n');

  assert.match(smoke, /active-rule-authority-current-behavior/);
  assert.match(smoke, /filter-engine-current-behavior/);
  assert.match(smoke, /main-profile-blocklist-keyword-alias-current-behavior/);
  assert.match(smoke, /storage-refresh-force-reprocess-coalescing-current-behavior/);
  assert.match(smoke, /native-dropdown-close-state-current-behavior/);
  assert.match(smoke, /quick-block-block-menu-affordance-boundary-current-behavior/);
  assert.match(smoke, /empty-install-performance-current-behavior/);
  assert.match(smoke, /public-release-surface-current-behavior/);
  assert.match(smoke, /release-live-youtube-spa-smoke-boundary-current-behavior/);
  assert.ok(LANES.smoke.checks.includes('build.js'));
});

test('whitelist lane explicitly owns end-screen boundary proof', () => {
  const whitelist = LANES.whitelist.tests.join('\n');
  const matrix = read(matrixPath);

  assert.match(whitelist, /main-watch-autoplay-video-endpoint-current-behavior/);
  assert.match(whitelist, /json-first-hide-endscreen-videowall-boundary-current-behavior/);
  assert.match(whitelist, /json-first-hide-endscreen-cards-boundary-current-behavior/);
  assert.match(whitelist, /json-first-disable-autoplay-annotations-boundary-current-behavior/);
  assert.match(whitelist, /player-endscreen-dom-cleanup-boundary-current-behavior/);
  assert.match(matrix, /Whitelist-only leaks, pending hides, Shorts\/watch\/end-screen\/Kids\/YTM allow behavior/);
  assert.match(matrix, /The whitelist lane explicitly owns end-screen videowall, card, autoplay, and player DOM boundary tests/);
});

test('manual YouTube smoke handoff covers visible release-critical behavior', () => {
  const matrix = read(matrixPath);
  const requiredTerms = [
    'blocklist',
    'whitelist',
    'keyword/channel blocking',
    'no-rule/no-work performance',
    'blocklist keyword/channel hiding',
    'whitelist-only mode',
    'Shorts behavior',
    'end-screen behavior',
    'quick-block and 3-dot menus',
    'JSON-first and DOM fallback',
    'settings/profile/storage',
    'release packaging',
    'That test does not claim the manual smoke has passed'
  ];
  const requiredRows = [
    'FT-LIVE-SPA-00-home-to-search',
    'FT-LIVE-SPA-01-search-to-channel',
    'FT-LIVE-SPA-02-channel-to-watch',
    'FT-LIVE-SPA-03-watch-to-home',
    'FT-LIVE-SPA-04-watch-rail-scroll',
    'FT-LIVE-SPA-05-cache-repeat-navigation'
  ];

  for (const term of requiredTerms) {
    assert.ok(matrix.includes(term), `manual smoke handoff missing ${term}`);
  }

  for (const row of requiredRows) {
    assert.ok(matrix.includes(row), `manual smoke handoff missing ${row}`);
  }
});

test('lane-owned audit proof fingerprints do not silently drift', () => {
  const matrix = read(matrixPath);
  const files = laneOwnedProofFiles();
  const drift = collectProofDrift({ scope: 'lane-owned' });

  assert.ok(files.includes('tests/runtime/test-lane-matrix-current-behavior.test.mjs'));
  assert.ok(files.includes('scripts/audit-proof-drift.mjs'));
  assert.deepEqual(drift, []);
  assert.match(matrix, /full audit proof drift inventory/);
  assert.match(matrix, /4694` tests ran, `4533` passed, and `161` failed/);
  assert.match(matrix, /audit:runtime` is the\s+inventory to retire or refresh/);
});
