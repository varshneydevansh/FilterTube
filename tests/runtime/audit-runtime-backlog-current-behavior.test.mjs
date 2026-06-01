import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { LANES } from '../../scripts/run-test-lane.mjs';

const repoRoot = process.cwd();
const backlogPath = 'docs/audit/FILTERTUBE_CHANGE_SAFETY_RUNTIME_AUDIT_BACKLOG_2026-06-01.md';
const matrixPath = 'docs/audit/TEST_LANE_MATRIX.md';
const testPath = 'tests/runtime/audit-runtime-backlog-current-behavior.test.mjs';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

test('audit runtime backlog remains explicit and outside release-lane completion claims', () => {
  const doc = read(backlogPath);
  const matrix = read(matrixPath);

  assert.match(doc, /Status: broad audit backlog, not a release-lane gate/);
  assert.match(doc, /node --test --test-reporter=tap tests\/runtime\/\*\.test\.mjs > \/tmp\/filtertube-runtime\.tap 2>&1/);
  assert.match(doc, /tests: 4737/);
  assert.match(doc, /pass: 4682/);
  assert.match(doc, /fail: 55/);
  assert.match(doc, /duration_ms: 87826\.425917/);
  assert.match(doc, /56 failures to\s+55 failures/);
  assert.match(doc, /source-locus teardown anchor row/);
  assert.match(doc, /current `js\/filter_logic\.js` video-channel and\s+video-meta flush timer lines/);
  assert.match(doc, /source-locus teardown approval remains at\s+NO-GO/);
  assert.match(doc, /57 failures to\s+56 failures/);
  assert.match(doc, /source-locus side-effect anchor row/);
  assert.match(doc, /current `js\/filter_logic\.js` map flush/);
  assert.match(doc, /current `build\.js`\s+UI-shell and zip artifact lines/);
  assert.match(doc, /side-effect budget\s+approval remains at\s+NO-GO/);
  assert.match(doc, /58\s+failures to\s+57 failures/);
  assert.match(doc, /source-locus parity\/release\s+verification\s+anchor row/);
  assert.match(doc, /current `build\.js`\s+UI-shell, zip artifact, and mobile artifact collection lines/);
  assert.match(doc, /parity,\s+release, and verification approval remains at\s+NO-GO/);
  assert.match(doc, /59 failures to\s+58 failures/);
  assert.match(doc, /source-locus no-work anchor row/);
  assert.match(doc, /current `js\/filter_logic\.js` harvest/);
  assert.match(doc, /current `build\.js`\s+UI-shell and zip artifact lines/);
  assert.match(doc, /source-locus no-work approval remains at\s+NO-GO/);
  assert.match(doc, /60 failures to\s+59 failures/);
  assert.match(doc, /source-locus fingerprint fixture row/);
  assert.match(doc, /current bytes, lines, and hashes/);
  assert.match(doc, /source-owner approval remains at NO-GO/);
  assert.match(doc, /61 failures to\s+60 failures/);
  assert.match(doc, /source-locus diagnostic\s+privacy anchor row/);
  assert.match(doc, /current diagnostic\s+logging matrix owner-family rows/);
  assert.match(doc, /current `js\/filter_logic\.js` console line\s+anchors/);
  assert.match(doc, /diagnostic privacy approval at NO-GO/);
  assert.match(doc, /62 failures to\s+61 failures/);
  assert.match(doc, /collector verification\s+output approval objective-ledger row/);
  assert.match(doc, /current 69 method semantic proof gap file\s+count/);
  assert.match(doc, /collector\s+verification output approval at NO-GO/);
  assert.match(doc, /63 failures to\s+62 failures/);
  assert.match(doc, /external navigation\s+surface boundary row/);
  assert.match(doc, /website\/components\/site-footer\.js/);
  assert.match(doc, /website\/app\/downloads\/page\.js/);
  assert.match(doc, /selected navigation primitive counts and split\s+extension\/website navigation policy proof remain unchanged/);
  assert.match(doc, /64 failures to\s+63 failures/);
  assert.match(doc, /extension UI CSS page-state boundary\s+row/);
  assert.match(doc, /same-size dashboard loader shell hash/);
  assert.match(doc, /generated shell versus hand-owned UI\s+runtime state split remain\s+unchanged/);
  assert.match(doc, /65\s+failures to\s+64\s+failures/);
  assert.match(doc, /design-token build-configuration boundary row/);
  assert.match(doc, /66\s+failures to\s+65 failures/);
  assert.match(doc, /current-dirty worktree\s+package-version row/);
  assert.match(doc, /67 failures\s+to 66 failures/);
  assert.match(doc, /content-filter field semantics contract/);
  assert.match(doc, /compiled\/settings\s+field-register row count/);
  assert.match(doc, /69\s+failures to 67 failures/);
  assert.match(doc, /function-coverage source backlog row/);
  assert.match(doc, /stale\s+`compress-video`\s+package\/build boundary row/);
  assert.match(doc, /76\s+failures to 69 failures/);
  assert.match(doc, /release-note\/package-version proof/);
  assert.match(doc, /115 failures to 76 failures/);
  assert.match(doc, /stale method\s+semantic proof gap counts from 5,673 to 5,681 lexical callables/);
  assert.match(doc, /not clean enough\s+to be used as a release gate/);
  assert.match(doc, /node scripts\/audit-proof-drift\.mjs --all --report-only/);
  assert.match(doc, /no stale source fingerprint proof rows/);
  assert.match(doc, /The focused release lanes are the per-change proof system/);
  assert.match(doc, /not clean enough to be treated as a release blocker today/);

  assert.match(matrix, new RegExp(backlogPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(matrix, /full historical runtime audit/);
  assert.match(matrix, /broad backlog suite, not the default per-change release lane/);
  assert.match(matrix, /audit:runtime` stays the inventory to retire or refresh/);
});

test('audit runtime backlog names the broad failure clusters that still require smaller proof batches', () => {
  const doc = read(backlogPath);
  const requiredClusters = [
    'Callable, source-locus, and index drift',
    'Audit goal and completion ledgers',
    'Docs/audit boundary, packaging, and generated artifacts',
    'Settings and content-control registers',
    'DOM selector, hide, and lifecycle registers',
    'JSON comment continuation and provenance registers',
    'JSON content-control hide boundary registers',
    'JSON-first renderer, reference, metric, and video-meta registers',
    'YTM and YouTube Music parity slices'
  ];
  const requiredLanes = [
    'test:release',
    'test:whitelist',
    'test:blocking',
    'test:json',
    'test:dom',
    'test:menu',
    'test:performance',
    'test:settings',
    'test:smoke',
    'test:audit-drift'
  ];

  for (const cluster of requiredClusters) {
    assert.ok(doc.includes(cluster), `missing broad audit failure cluster: ${cluster}`);
  }

  for (const lane of requiredLanes) {
    assert.ok(doc.includes(lane), `missing focused lane decision: ${lane}`);
  }

  assert.match(doc, /compiled-settings-field-register` has been refreshed and promoted into `test:settings`/);
  assert.match(doc, /all-callable-index-current-behavior` has been refreshed and promoted into `test:smoke`/);
  assert.match(doc, /first-optimization-source-locus-callable-anchor-boundary` has been refreshed and promoted into `test:performance`/);
  assert.match(doc, /remaining source-locus ownership closure rows and route component register rows need regenerated proof/);
  assert.match(doc, /content-control-active-work-matrix` has been refreshed and promoted into `test:performance`/);
  assert.match(doc, /content-control-alias-mutation-boundary` has been refreshed and promoted into `test:settings`/);
  assert.match(
    doc,
    new RegExp('settings-mode-source-effect`, `source-' +
      'of-truth-claim-register`, `settings-refresh-cross-context-consumer-boundary`')
  );
  assert.match(doc, /have been refreshed and promoted into `test:settings`/);
  assert.match(doc, /settings-refresh-key-parity-register`/);
  assert.match(doc, /settings-refresh-dirty-key-producer-consumer-join-matrix`/);
  assert.match(doc, /settings-refresh-optimization-readiness-boundary`/);
  assert.match(doc, /settings-refresh-optimization-candidate-binding-matrix`/);
  assert.match(doc, /settings-refresh-optimization-candidate-evidence-packet-contract`/);
  assert.match(doc, /remaining settings rows are older broad-ledger references, not unpromoted settings-refresh lane proof/);
  assert.match(doc, /direct-hide-writer-register` has been refreshed and promoted into `test:dom`/);
  assert.match(doc, /dom-selector-instance-register` has been refreshed for `js\/content\/dom_state\.js` selector patch sites and promoted into `test:dom`/);
  assert.match(doc, /lifecycle-instance-register` and `repo-lifecycle-primitive-coverage` have been refreshed for website component lifecycle drift and promoted into `test:performance`/);
  assert.match(doc, /remaining lifecycle selector rows belong in smaller DOM batches/);
  assert.match(doc, /Comment JSON proof rows have been refreshed and promoted into `test:json`/);
  assert.match(doc, /author\/channel and keyword provenance are also promoted into `test:blocking`/);
  assert.match(doc, /Remaining broad-ledger failures in this family are older completion\/obligation references/);
  assert.match(doc, /content-control-json-first-boundary-index` plus the JSON-first content-control hide boundary set have been refreshed and promoted into `test:json`/);
  assert.match(doc, /json-first-implementation-locus-register` has been refreshed and promoted into `test:json`/);
  assert.match(doc, /json-first-implementation-authority-boundary` has been refreshed and promoted into `test:json`/);
  assert.match(doc, /json-first-renderer-traversal-mutation-boundary` has been refreshed and promoted into `test:json`/);
  assert.match(doc, /json-first-candidate-extraction-boundary` has been refreshed and promoted into `test:json`/);
  assert.match(doc, /network-fetch-xhr-callsite-register` has been refreshed and promoted into `test:json` and `test:performance`/);
  assert.match(doc, /shorts-reel-overlay-owner-authority-boundary` has been refreshed and promoted into `test:whitelist`, `test:blocking`, and `test:json`/);
  assert.match(doc, /youtube-music-surface-identity-boundary` has been refreshed and promoted into `test:whitelist` and `test:json`/);
  assert.match(doc, /ytm-show-sheet-injector-filter-logic-parity` and `ytm-show-sheet-enrichment-handoff` have been refreshed and promoted into `test:json`/);
});

test('audit runtime backlog pins the current broad-suite failure family snapshot', () => {
  const doc = read(backlogPath);
  const expectedRows = [
    ['generated/release/package/docs surfaces', '38'],
    ['source-locus/optimization/index contracts', '5'],
    ['JSON/video-meta/path/reference', '19'],
    ['website/public-doc/source inventory', '14'],
    ['settings/content-control/DOM lifecycle', '8'],
    ['native/Nanah/Kids/YTM', '8']
  ];

  assert.match(doc, /Current failing subtests are spread across 40 runtime test files/);
  assert.match(doc, /filtertube-runtime-current-after-source-locus-teardown-refresh\.tap/);
  assert.match(doc, /non-exclusive family snapshot/);
  assert.match(doc, /previous method-proof\/family blocker row is now retired/);
  assert.match(doc, /direct method semantic proof lane passes with 5,681\s+current lexical callables/);
  assert.match(doc, /previous release-note\/package-version drift rows are also retired/);
  assert.match(doc, /now align on `3\.3\.2`/);
  assert.match(doc, /previous function-coverage source backlog row is retired/);
  assert.match(doc, /every current product-owned JS\/JSX\/MJS source file is either cited/);
  assert.match(doc, /previous `compress-video`\s+package\/build boundary row is also retired/);
  assert.match(doc, /test-lane classifier mention is recognized as workflow\s+classification/);
  assert.match(doc, /previous content-filter field semantics contract row is retired/);
  assert.match(doc, /current 309 raw compiled\/settings field rows/);
  assert.match(doc, /previous current-dirty package-script row is retired/);
  assert.match(doc, /`9816c34` one-line `audit:runtime` script diff/);
  assert.match(doc, /previous design-token build-configuration row is retired/);
  assert.match(doc, /no-generator\/no-package-copy\s+boundary for `design\/design_tokens\.json`/);
  assert.match(doc, /previous extension UI CSS page-state row is retired/);
  assert.match(doc, /same-size dashboard shell hash now matches current source/);
  assert.match(doc, /CSS loader order plus generated-shell\/runtime\s+state-token separation/);
  assert.match(doc, /previous external navigation surface row is retired/);
  assert.match(doc, /selected extension,\s+website component, and website route fingerprints now match current source/);
  assert.match(doc, /uneven static-link policy and split navigation-owner\s+behavior as current state/);
  assert.match(doc, /previous collector verification output approval row is retired/);
  assert.match(doc, /objective coverage ledger now matches the 69-file method semantic proof gap\s+count/);
  assert.match(doc, /collector verification output\s+approval remains explicitly absent/);
  assert.match(doc, /previous source-locus diagnostic privacy row is retired/);
  assert.match(doc, /diagnostic\s+privacy ownership proof now uses current diagnostic logging matrix line anchors/);
  assert.match(doc, /current `js\/filter_logic\.js` console anchor lines/);
  assert.match(doc, /previous source-locus fingerprint row is retired/);
  assert.match(doc, /fingerprint boundary\s+now pins current source bytes, line counts, and SHA-256 hashes/);
  assert.match(doc, /source-owner approval remains\s+explicitly absent/);
  assert.match(doc, /previous source-locus no-work row is retired/);
  assert.match(doc, /no-work ownership proof\s+now uses current `js\/filter_logic\.js` and `build\.js` line anchors/);
  assert.match(doc, /source-locus no-work approval remains\s+explicitly absent/);
  assert.match(doc, /previous source-locus parity\/release verification row is retired/);
  assert.match(doc, /parity\/release ownership proof\s+now uses current `build\.js` line anchors/);
  assert.match(doc, /parity, release, and verification approval remains\s+explicitly absent/);
  assert.match(doc, /previous source-locus side-effect row is retired/);
  assert.match(doc, /side-effect ownership\s+proof now uses current `js\/filter_logic\.js` and `build\.js` line anchors/);
  assert.match(doc, /side-effect budget approval remains\s+explicitly absent/);
  assert.match(doc, /previous source-locus teardown row is retired/);
  assert.match(doc, /teardown ownership\s+proof\s+now uses current `js\/filter_logic\.js` video-channel and video-meta timer line\s+anchors/);
  assert.match(doc, /source-locus teardown approval remains\s+explicitly absent/);

  for (const [family, count] of expectedRows) {
    assert.match(doc, new RegExp(`\\| ${family.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\| ${count} \\|`));
  }
});

test('smoke lane keeps the broad audit backlog boundary visible', () => {
  assert.ok(
    LANES.smoke.tests.includes(testPath),
    `${testPath} must stay in test:smoke while audit:runtime remains a backlog gate`
  );
});
