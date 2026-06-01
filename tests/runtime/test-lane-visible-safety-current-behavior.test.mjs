import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { LANES } from '../../scripts/run-test-lane.mjs';

const repoRoot = process.cwd();
const matrixPath = 'docs/audit/TEST_LANE_MATRIX.md';
const claimRegisterTestPath = ['tests/runtime/source', 'of', 'truth-claim-register-current-behavior.test.mjs'].join('-');

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sectionBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);

  assert.notEqual(startIndex, -1, `missing section start ${start}`);
  assert.notEqual(endIndex, -1, `missing section end ${end}`);
  return source.slice(startIndex, endIndex);
}

function tableRowContaining(section, text) {
  const row = section.split('\n').find(line => line.startsWith('|') && line.includes(text));

  assert.ok(row, `missing table row for ${text}`);
  return row;
}

test('smoke lane keeps release confidence broad but bounded', () => {
  const smoke = LANES.smoke.tests.join('\n');

  assert.match(smoke, /active-rule-authority-current-behavior/);
  assert.match(smoke, /filter-engine-current-behavior/);
  assert.match(smoke, /main-profile-blocklist-keyword-alias-current-behavior/);
  assert.match(smoke, /json-first-whitelist-decision-identity-boundary-current-behavior/);
  assert.match(smoke, /content-bridge-whitelist-pending-refresh-boundary-current-behavior/);
  assert.match(smoke, /main-watch-autoplay-video-endpoint-current-behavior/);
  assert.match(smoke, /storage-refresh-force-reprocess-coalescing-current-behavior/);
  assert.match(smoke, /native-dropdown-close-state-current-behavior/);
  assert.match(smoke, /quick-block-block-menu-affordance-boundary-current-behavior/);
  assert.match(smoke, /dom-state-virtual-attributes-current-behavior/);
  assert.match(smoke, /empty-install-performance-current-behavior/);
  assert.match(smoke, /runtime-diagnostic-logging-policy-matrix-current-behavior/);
  assert.match(smoke, /public-release-surface-current-behavior/);
  assert.match(smoke, /release-live-youtube-spa-smoke-boundary-current-behavior/);
  assert.match(smoke, /all-callable-index-current-behavior/);
  assert.ok(LANES.smoke.tests.includes(claimRegisterTestPath));
  assert.ok(LANES.smoke.checks.includes('build.js'));
});

test('whitelist lane explicitly owns end-screen boundary proof', () => {
  const whitelist = LANES.whitelist.tests.join('\n');
  const matrix = read(matrixPath);

  assert.match(whitelist, /main-watch-initial-lockup-shorts-json-current-behavior/);
  assert.match(whitelist, /main-watch-initial-shorts-owner-absent-boundary-current-behavior/);
  assert.match(whitelist, /json-first-hide-all-shorts-boundary-current-behavior/);
  assert.match(whitelist, /shorts-dom-cleanup-boundary-current-behavior/);
  assert.match(whitelist, /main-watch-autoplay-video-endpoint-current-behavior/);
  assert.match(whitelist, /json-first-hide-endscreen-videowall-boundary-current-behavior/);
  assert.match(whitelist, /json-first-hide-endscreen-cards-boundary-current-behavior/);
  assert.match(whitelist, /json-first-disable-autoplay-annotations-boundary-current-behavior/);
  assert.match(whitelist, /player-endscreen-dom-cleanup-boundary-current-behavior/);
  assert.match(matrix, /Whitelist-only leaks, pending hides, Shorts\/watch\/end-screen\/Kids\/YTM allow behavior/);
  assert.match(matrix, /The whitelist lane explicitly owns end-screen videowall, card, autoplay, and player DOM boundary tests/);
});

test('change-type gate map keeps logical workflow classification explicit', () => {
  const matrix = read(matrixPath);
  const section = sectionBetween(matrix, '## Change-Type Gate Map', '## Resumed Goal Coverage');
  const rows = [
    {
      label: 'Runtime hot-path change',
      lanes: ['json', 'dom', 'performance', 'whitelist', 'blocking']
    },
    {
      label: 'Menu / quick-block / YouTube UI change',
      lanes: ['menu']
    },
    {
      label: 'Settings/profile/storage change',
      lanes: ['settings']
    },
    {
      label: 'Release/build/docs change',
      lanes: ['release', 'smoke']
    },
    {
      label: 'Broad/shared refactor',
      lanes: ['smoke']
    }
  ];

  assert.match(section, /Use this map before the touched file set is fully known/);
  assert.match(section, /classifier remains the source of truth/);
  assert.match(section, /Manual proof expectation/);
  assert.match(section, /manual YouTube smoke pass before release/);

  for (const { label, lanes } of rows) {
    const row = tableRowContaining(section, label);
    for (const lane of lanes) {
      assert.ok(LANES[lane], `unknown lane ${lane}`);
      assert.ok(row.includes(`test:${lane}`), `${label} row missing test:${lane}`);
    }
  }
});

test('goal safety surfaces stay bound to focused lane proof tests', () => {
  const matrix = read(matrixPath);
  const surfaceCoverage = [
    {
      surface: 'blocklist behavior',
      lane: 'blocking',
      tests: [/filter-engine-current-behavior/, /main-profile-blocklist-keyword-alias-current-behavior/]
    },
    {
      surface: 'whitelist behavior',
      lane: 'whitelist',
      tests: [/json-first-whitelist-decision-identity-boundary/, /content-bridge-whitelist-pending-refresh-boundary/]
    },
    {
      surface: 'keyword/channel blocking',
      lane: 'blocking',
      tests: [/json-first-keyword-match-boundary/, /json-first-channel-match-boundary/]
    },
    {
      surface: 'Shorts behavior',
      lane: 'whitelist',
      tests: [
        /main-watch-initial-lockup-shorts-json-current-behavior/,
        /main-watch-initial-shorts-owner-absent-boundary-current-behavior/,
        /json-first-hide-all-shorts-boundary-current-behavior/,
        /shorts-dom-cleanup-boundary-current-behavior/
      ]
    },
    {
      surface: 'end screens',
      lane: 'whitelist',
      tests: [/json-first-hide-endscreen-videowall-boundary/, /json-first-hide-endscreen-cards-boundary/, /main-watch-autoplay-video-endpoint/, /player-endscreen-dom-cleanup-boundary/]
    },
    {
      surface: 'quick-block and 3-dot menus',
      lane: 'menu',
      tests: [
        /quick-block-block-menu-affordance-boundary/,
        /native-dropdown-close-state/,
        /content-bridge-collaborator-identity-promotion-handoff/
      ]
    },
    {
      surface: 'JSON-first filtering',
      lane: 'json',
      tests: [
        /seed-network-current-behavior/,
        /json-first-response-mutation-contract/,
        /ytm-show-sheet-injector-filter-logic-parity-current-behavior/,
        /ytm-show-sheet-enrichment-handoff-current-behavior/
      ]
    },
    {
      surface: 'DOM fallback',
      lane: 'dom',
      tests: [/dom-selector-instance-register/, /dom-fallback-selector-semantic-register/, /css-style-hide-authority/, /direct-hide-writer-register/, /quarantined-content-css-package-boundary/, /dom-state-virtual-attributes/]
    },
    {
      surface: 'direct hide writers',
      lane: 'dom',
      tests: [/direct-hide-writer-register-current-behavior/]
    },
    {
      surface: 'no-rule performance',
      lane: 'performance',
      tests: [
        /empty-install-performance-current-behavior/,
        /content-control-active-work-matrix-current-behavior/,
        /lifecycle-instance-register-current-behavior/,
        /repo-lifecycle-primitive-coverage-current-behavior/,
        /runtime-diagnostic-logging-policy-matrix-current-behavior/,
        /p0-no-work-current-behavior/
      ]
    },
    {
      surface: 'SPA navigation',
      lane: 'performance',
      tests: [/whitelist-cache-spa-metric-packet-gate/, /content-filter-route-surface-no-work-budget/]
    },
    {
      surface: 'code-burden growth',
      lane: 'performance',
      tests: [/code-burden-declutter-boundary/]
    },
    {
      surface: 'source-locus optimization proof',
      lane: 'performance',
      tests: [/first-optimization-source-locus-callable-anchor-boundary/]
    },
    {
      surface: 'repo-wide callable/method census',
      lane: 'smoke',
      tests: [/all-callable-index-current-behavior/]
    },
    {
      surface: 'settings',
      lane: 'settings',
      tests: [
        /settings-mode-coverage-matrix/,
        /settings-mode-source-effect/,
        new RegExp('source-' + 'of-truth-claim-register'),
        /settings-refresh-cross-context-consumer-boundary/,
        /compiled-settings-field-register/,
        /content-control-alias-mutation-boundary/,
        /compiled-settings-profile-list-mode-assembly/
      ]
    },
    {
      surface: 'release packaging',
      lane: 'release',
      tests: [/p0-release-package-current-behavior/, /release-package-parity-current-behavior/, /quarantined-content-css-package-boundary/]
    }
  ];

  assert.match(matrix, /Named Safety Surface Coverage/);

  for (const { surface, lane, tests } of surfaceCoverage) {
    assert.ok(matrix.includes(surface), `matrix missing safety surface ${surface}`);
    assert.ok(matrix.includes(`test:${lane}`), `matrix missing lane ${lane} for ${surface}`);

    for (const pattern of tests) {
      assert.ok(
        LANES[lane].tests.some((testPath) => pattern.test(testPath)),
        `${surface} is not bound to ${lane} proof ${pattern}`
      );
    }
  }
});

test('user-reported regression anchors stay bound to proof lanes', () => {
  const matrix = read(matrixPath);

  const issue55 = [
    'Issue #55: whitelist leaks after SPA/cache reuse',
    'json-first-whitelist-decision-identity-boundary',
    'content-bridge-whitelist-pending-refresh-boundary',
    'right-rail-whitelist-observer',
    'whitelist-cache-spa-metric-packet-gate'
  ];
  const issue56 = [
    'Issue #56: Shorts hidden on whitelisted channels while Hide Shorts is disabled',
    'main-watch-initial-lockup-shorts-json-current-behavior',
    'main-watch-initial-shorts-owner-absent-boundary-current-behavior',
    'json-first-hide-all-shorts-boundary-current-behavior',
    'shorts-dom-cleanup-boundary-current-behavior'
  ];
  const issue57 = [
    'Issue #57: end-screen videowall/cards/autoplay panel leak in whitelist mode',
    'json-first-hide-endscreen-videowall',
    'json-first-hide-endscreen-cards',
    'json-first-disable-autoplay-annotations',
    'player-endscreen-dom-cleanup'
  ];
  const issue59 = [
    'Issue #59: public `data-filtertube-*` DOM fingerprint risk',
    'dom-state-virtual-attributes-current-behavior',
    'stale marker cleanup'
  ];

  assert.match(matrix, /User-Reported Regression Anchors/);

  for (const term of [...issue55, ...issue56, ...issue57, ...issue59]) {
    assert.ok(matrix.includes(term), `regression anchor missing ${term}`);
  }

  assert.ok(
    LANES.whitelist.tests.some(testPath => /main-watch-initial-shorts-owner-absent-boundary/.test(testPath)),
    'issue #56 owner-absent Shorts proof must stay in whitelist lane'
  );
  assert.ok(
    LANES.whitelist.tests.some(testPath => /json-first-hide-all-shorts-boundary/.test(testPath)),
    'issue #56 Hide Shorts proof must stay in whitelist lane'
  );
  assert.ok(
    LANES.dom.tests.some(testPath => /dom-state-virtual-attributes/.test(testPath)),
    'issue #59 DOM fingerprint proof must stay in DOM lane'
  );
  assert.ok(
    LANES.smoke.tests.some(testPath => /json-first-whitelist-decision-identity-boundary/.test(testPath)),
    'issue #55/#56 whitelist identity sentinel must stay in smoke lane'
  );
  assert.ok(
    LANES.smoke.tests.some(testPath => /content-bridge-whitelist-pending-refresh-boundary/.test(testPath)),
    'issue #55 pending refresh sentinel must stay in smoke lane'
  );
  assert.ok(
    LANES.smoke.tests.some(testPath => /main-watch-autoplay-video-endpoint/.test(testPath)),
    'issue #57 autoplay endpoint sentinel must stay in smoke lane'
  );
  assert.ok(
    LANES.smoke.tests.some(testPath => /dom-state-virtual-attributes/.test(testPath)),
    'issue #59 virtual attribute sentinel must stay in smoke lane'
  );
});

test('menu lane owns collaborator identity promotion handoff proof', () => {
  const matrix = read(matrixPath);
  const menu = LANES.menu.tests.join('\n');

  assert.match(menu, /content-bridge-collaborator-identity-promotion-handoff-current-behavior/);
  assert.match(menu, /quick-block-block-menu-affordance-boundary-current-behavior/);
  assert.match(menu, /native-dropdown-close-state-current-behavior/);
  assert.match(matrix, /content-bridge-collaborator-identity-promotion-handoff/);
  assert.match(matrix, /ampersand Topic guard/);
  assert.match(matrix, /collaborator identity promotion handoff proof/);
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
    'verify-live-smoke-artifact.mjs',
    'installedByteParity.verdict=GO',
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

test('done criteria keep the active change-safety objective release gates intact', () => {
  const matrix = read(matrixPath);
  const doneCriteria = sectionBetween(matrix, '## Done Criteria', '## Current Boundary');
  const requiredCriteria = [
    'A change is not release-ready until:',
    '- the relevant lane command passes;',
    '- `npm run test:audit-drift` passes when lane-owned source fingerprints changed;',
    '- a fixture or runtime test proves any behavior change;',
    '- the relevant proof doc under `docs/audit/` is updated;',
    '- visible YouTube behavior gets a manual smoke pass when user-facing;',
    '- blocklist and whitelist behavior remain intact;',
    '- empty-rule and SPA navigation paths remain snappy;',
    '- unrelated docs/product files are not dirtied.',
    '`tests/runtime/test-lane-visible-safety-current-behavior.test.mjs` pins these',
    'done criteria in `test:smoke`'
  ];

  for (const criterion of requiredCriteria) {
    assert.ok(doneCriteria.includes(criterion), `Done Criteria missing ${criterion}`);
  }

  assert.ok(
    LANES.smoke.tests.includes('tests/runtime/test-lane-visible-safety-current-behavior.test.mjs'),
    'Done Criteria guard must stay in test:smoke'
  );
});
