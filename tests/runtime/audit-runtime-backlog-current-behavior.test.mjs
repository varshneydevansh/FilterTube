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
  assert.match(doc, /pass: 4704/);
  assert.match(doc, /fail: 33/);
  assert.match(doc, /duration_ms: 37662\.8535/);
  assert.match(doc, /34\s+failures\s+to\s+33\s+failures/);
  assert.match(doc, /legacy layout quarantine package manifest\s+count rows/);
  assert.match(doc, /package-boundary proof now expects the current active and dist\s+content-script JS reference totals/);
  assert.match(doc, /`js\/layout\.js` absent from\s+active manifest loads, dist manifest loads, web-accessible resources, popup\s+HTML, dashboard HTML, and non-doc runtime callers/);
  assert.match(doc, /36\s+failures\s+to\s+34\s+failures/);
  assert.match(doc, /Kids browse malformed-fragment source\s+fingerprint and token-count rows/);
  assert.match(doc, /Kids malformed browse proof now expects\s+the current `js\/filter_logic\.js` line count, byte count, hash, and\s+`videoChannelMap` token count/);
  assert.match(doc, /Kids owner\s+rail policy, malformed-container authority, fragment extraction policy, native\s+parity, metric artifacts, and first-class Kids browse authority explicitly\s+absent/);
  assert.match(doc, /37\s+failures\s+to\s+36\s+failures/);
  assert.match(doc, /JSON path authority and audit-completion\s+source pin rows/);
  assert.match(doc, /JSON path authority proof now expects current\s+`js\/filter_logic\.js` owner-flow line ranges/);
  assert.match(doc, /audit-completion register\s+now asserts those same current ranges while keeping JSON-first promotion at\s+NO-GO/);
  assert.match(doc, /38\s+failures\s+to\s+37\s+failures/);
  assert.match(doc, /JSON-first video-meta revision boundary\s+source pin row/);
  assert.match(doc, /revision-boundary proof test now expects the current\s+`js\/filter_logic\.js` line count, byte count, and hash/);
  assert.match(doc, /content persistence, filter-logic queueing, background compiled\s+cache patching, and unpartitioned metadata-map fixtures remain unchanged/);
  assert.match(doc, /first-class video-meta revision authority remains absent/);
  assert.match(doc, /39\s+failures\s+to\s+38\s+failures/);
  assert.match(doc, /JSON-first video-meta profile\/surface source\s+pin row/);
  assert.match(doc, /profile\/surface proof\s+test now expects the current `js\/filter_logic\.js` line count, byte count, and\s+hash/);
  assert.match(doc, /content-side persistence, Kids-host\s+scheduling, background cache patching, filter-logic consumption, and DOM category\s+fixtures remain unchanged/);
  assert.match(doc, /first-class video-meta profile\/surface authority\s+remains absent/);
  assert.match(doc, /40\s+failures\s+to\s+39\s+failures/);
  assert.match(doc, /JSON-first video-meta no-work budget source\s+pin\s+row/);
  assert.match(doc, /no-work budget\s+proof test now expects the current\s+`js\/filter_logic\.js`\s+line count, byte count, and\s+hash/);
  assert.match(doc, /scheduler, duplicate,\s+DOM upload-date\/duration callsite fixtures\s+remain unchanged/);
  assert.match(doc, /first-class\s+video-meta no-work budget authority remains\s+absent/);
  assert.match(doc, /41\s+failures\s+to\s+40\s+failures/);
  assert.match(doc, /JSON-first video-meta merge schema source\s+pin row/);
  assert.match(doc, /merge-schema proof test now expects the current\s+`js\/filter_logic\.js` line count,\s+byte count, and hash/);
  assert.match(doc, /partial metadata\s+merge and category forwarding fixtures remain unchanged/);
  assert.match(doc, /first-class\s+video-meta merge schema authority remains absent/);
  assert.match(doc, /42\s+failures\s+to\s+41\s+failures/);
  assert.match(doc, /JSON-first\s+video-meta freshness eviction source pin row/);
  assert.match(doc, /freshness-eviction proof test\s+now expects the current `js\/filter_logic\.js` line count, byte count, and hash/);
  assert.match(doc, /persistence, scheduling, background\s+storage, and queue fixtures\s+remain unchanged/);
  assert.match(doc, /first-class video-meta\s+freshness eviction authority remains\s+absent/);
  assert.match(doc, /43\s+failures\s+to\s+42\s+failures/);
  assert.match(doc, /JSON-first video-meta fetch policy source\s+pin row/);
  assert.match(doc, /fetch policy proof test now expects the current `js\/filter_logic\.js` line count,\s+byte count, and hash/);
  assert.match(doc, /fetch scheduling and watch-metadata fixture behavior remains\s+unchanged/);
  assert.match(doc, /first-class video-meta fetch policy authority remains absent/);
  assert.match(doc, /44\s+failures\s+to\s+43\s+failures/);
  assert.match(doc, /JSON-first video-meta content parity source\s+pin row/);
  assert.match(doc, /content parity proof test now expects the current\s+`js\/filter_logic\.js` line\s+count, byte count, and hash/);
  assert.match(doc, /content\s+decision fixture behavior remains unchanged/);
  assert.match(doc, /first-class video-meta content\s+parity authority remains absent/);
  assert.match(doc, /45\s+failures\s+to\s+44\s+failures/);
  assert.match(doc, /JSON-first video-meta category parity\s+source pin row/);
  assert.match(doc, /category parity\s+proof test now expects the current `js\/filter_logic\.js` line count, byte count,\s+and hash/);
  assert.match(doc, /category decision fixture\s+behavior remains unchanged/);
  assert.match(doc, /first-class video-meta category parity authority\s+remains absent/);
  assert.match(doc, /46\s+failures\s+to\s+45\s+failures/);
  assert.match(doc, /JSON-first uppercase title boundary source\s+pin row/);
  assert.match(doc, /current\s+`js\/filter_logic\.js` line count, byte count, and hash/);
  assert.match(doc, /runtime uppercase-title fixture\s+behavior remains unchanged/);
  assert.match(doc, /first-class uppercase-title authority remains\s+absent/);
  assert.match(doc, /47\s+failures\s+to\s+46\s+failures/);
  assert.match(doc, /JSON-first route\/surface metric artifact\s+contract coverage ledger row/);
  assert.match(doc, /objective coverage ledger now matches the\s+active-goal and tracked-file ledgers at\s+69 method semantic proof gap files covered/);
  assert.match(doc, /route\/surface metric artifacts,\s+runtime metric collectors,\s+JSON-first implementation, and whitelist optimization\s+remain NO-GO/);
  assert.match(doc, /49\s+failures\s+to\s+47\s+failures/);
  assert.match(doc, /JSON-first reference doc surface rows/);
  assert.match(doc, /current `docs\/youtube_renderer_inventory\.md`\s+newline count, byte count, hash,\s+inline-code count, and dot-index count/);
  assert.match(doc, /reference docs remain evidence maps,\s+not runtime authority/);
  assert.match(doc, /51\s+failures\s+to\s+49\s+failures/);
  assert.match(doc, /JSON-first metric artifact gate rows/);
  assert.match(doc, /current\s+performance-claim and no-work crosswalk\s+doc hashes/);
  assert.match(doc, /current\s+`js\/filter_logic\.js` `processData\(\)` source line/);
  assert.match(doc, /metric artifact authority\s+remains absent/);
  assert.match(doc, /52\s+failures\s+to\s+51\s+failures/);
  assert.match(doc, /implementation\s+readiness gate lifecycle\s+count\s+row/);
  assert.match(doc, /current\s+524 tracked lifecycle\s+primitive instances, 469 install-or-schedule rows,\s+and 55 explicit teardown rows/);
  assert.match(doc, /runtime cleanup and optimization approval\s+remains at NO-GO/);
  assert.match(doc, /55\s+failures\s+to\s+52\s+failures/);
  assert.match(doc, /generated local output dependency surface\s+rows/);
  assert.match(doc, /current ignored `dist` v3\.3\.2 package output/);
  assert.match(doc, /current `website\/\.next` local build fingerprints/);
  assert.match(doc, /generated output remains\s+non-authoritative/);
  assert.match(doc, /56\s+failures\s+to\s+55\s+failures/);
  assert.match(doc, /source-locus teardown anchor row/);
  assert.match(doc, /current `js\/filter_logic\.js` video-channel and\s+video-meta flush timer lines/);
  assert.match(doc, /source-locus teardown approval remains at\s+NO-GO/);
  assert.match(doc, /57\s+failures\s+to\s+56\s+failures/);
  assert.match(doc, /source-locus side-effect anchor row/);
  assert.match(doc, /current `js\/filter_logic\.js` map flush/);
  assert.match(doc, /current `build\.js`\s+UI-shell and zip artifact lines/);
  assert.match(doc, /side-effect budget\s+approval remains at\s+NO-GO/);
  assert.match(doc, /58\s+failures\s+to\s+57\s+failures/);
  assert.match(doc, /source-locus parity\/release\s+verification\s+anchor row/);
  assert.match(doc, /current `build\.js`\s+UI-shell, zip artifact, and mobile artifact collection lines/);
  assert.match(doc, /parity,\s+release, and verification approval remains at\s+NO-GO/);
  assert.match(doc, /59\s+failures\s+to\s+58\s+failures/);
  assert.match(doc, /source-locus no-work anchor row/);
  assert.match(doc, /current `js\/filter_logic\.js` harvest/);
  assert.match(doc, /current `build\.js`\s+UI-shell and zip artifact lines/);
  assert.match(doc, /source-locus no-work approval remains at\s+NO-GO/);
  assert.match(doc, /60\s+failures\s+to\s+59\s+failures/);
  assert.match(doc, /source-locus fingerprint fixture row/);
  assert.match(doc, /current bytes, lines, and hashes/);
  assert.match(doc, /source-owner approval remains at NO-GO/);
  assert.match(doc, /61\s+failures\s+to\s+60\s+failures/);
  assert.match(doc, /source-locus diagnostic\s+privacy anchor row/);
  assert.match(doc, /current diagnostic\s+logging matrix owner-family rows/);
  assert.match(doc, /current `js\/filter_logic\.js` console line\s+anchors/);
  assert.match(doc, /diagnostic privacy approval at NO-GO/);
  assert.match(doc, /62\s+failures\s+to\s+61\s+failures/);
  assert.match(doc, /collector verification\s+output approval objective-ledger row/);
  assert.match(doc, /current 69 method semantic proof gap file\s+count/);
  assert.match(doc, /collector\s+verification output approval at NO-GO/);
  assert.match(doc, /63\s+failures\s+to\s+62\s+failures/);
  assert.match(doc, /external navigation\s+surface boundary row/);
  assert.match(doc, /website\/components\/site-footer\.js/);
  assert.match(doc, /website\/app\/downloads\/page\.js/);
  assert.match(doc, /selected navigation primitive counts and split\s+extension\/website navigation policy proof remain unchanged/);
  assert.match(doc, /64\s+failures\s+to\s+63\s+failures/);
  assert.match(doc, /extension UI CSS page-state boundary\s+row/);
  assert.match(doc, /same-size dashboard loader shell hash/);
  assert.match(doc, /generated shell versus hand-owned UI\s+runtime state split remain\s+unchanged/);
  assert.match(doc, /65\s+failures to\s+64\s+failures/);
  assert.match(doc, /design-token build-configuration boundary row/);
  assert.match(doc, /66\s+failures\s+to\s+65\s+failures/);
  assert.match(doc, /current-dirty worktree\s+package-version row/);
  assert.match(doc, /67\s+failures\s+to\s+66\s+failures/);
  assert.match(doc, /content-filter field semantics contract/);
  assert.match(doc, /compiled\/settings\s+field-register row count/);
  assert.match(doc, /69\s+failures\s+to\s+67\s+failures/);
  assert.match(doc, /function-coverage source backlog row/);
  assert.match(doc, /stale\s+`compress-video`\s+package\/build boundary row/);
  assert.match(doc, /76\s+failures\s+to\s+69\s+failures/);
  assert.match(doc, /release-note\/package-version proof/);
  assert.match(doc, /115\s+failures\s+to\s+76\s+failures/);
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
    ['generated/release/package/docs surfaces', '21'],
    ['source-locus/optimization/index contracts', '1'],
    ['JSON/video-meta/path/reference', '2'],
    ['website/public-doc/source inventory', '10'],
    ['settings/content-control/DOM lifecycle', '8'],
    ['native/Nanah/Kids/YTM', '6']
  ];

  assert.match(doc, /Current failing subtests are spread across 23 runtime test files/);
  assert.match(doc, /filtertube-runtime-current-after-legacy-layout-quarantine-refresh\.tap/);
  assert.match(doc, /non-exclusive family snapshot/);
  assert.match(doc, /previous legacy layout quarantine package row is now retired/);
  assert.match(doc, /current manifest content-script JS\s+reference totals/);
  assert.match(doc, /`js\/layout\.js`\s+is packaged but inactive and not web-accessible/);
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
  assert.match(doc, /previous JSON-first reference doc surface rows are retired/);
  assert.match(doc, /reference\s+proof now pins the current `docs\/youtube_renderer_inventory\.md` fingerprint and\s+syntax counts/);
  assert.match(doc, /reference docs as evidence maps, not runtime\s+authority/);
  assert.match(doc, /previous JSON-first route\/surface metric artifact contract coverage row is\s+retired/);
  assert.match(doc, /objective coverage ledger now matches the adjacent 69-file method\s+semantic proof gap count/);
  assert.match(doc, /route\/surface metric artifacts, runtime metric\s+collectors, JSON-first implementation, and whitelist optimization remain\s+explicitly NO-GO/);
  assert.match(doc, /previous JSON-first uppercase title boundary row is retired/);
  assert.match(doc, /uppercase-title proof test now matches the current `js\/filter_logic\.js`\s+fingerprint/);
  assert.match(doc, /runtime uppercase-title\s+fixture behavior remains unchanged/);
  assert.match(doc, /first-class uppercase-title authority\s+remains explicitly absent/);
  assert.match(doc, /previous JSON-first video-meta category parity row is retired/);
  assert.match(doc, /category\s+parity proof test now matches the current `js\/filter_logic\.js` fingerprint/);
  assert.match(doc, /category decision fixture behavior\s+remains unchanged/);
  assert.match(doc, /first-class video-meta category parity authority remains\s+explicitly absent/);
  assert.match(doc, /previous JSON-first video-meta content parity row is retired/);
  assert.match(doc, /content\s+parity proof test now matches the current `js\/filter_logic\.js` fingerprint/);
  assert.match(doc, /content decision fixture behavior remains\s+unchanged/);
  assert.match(doc, /first-class video-meta content parity authority remains explicitly\s+absent/);
  assert.match(doc, /previous JSON-first video-meta fetch policy row is retired/);
  assert.match(doc, /fetch policy\s+proof test now matches the current `js\/filter_logic\.js` fingerprint/);
  assert.match(doc, /fetch scheduling and watch-metadata fixture\s+behavior remains unchanged/);
  assert.match(doc, /first-class video-meta fetch policy authority\s+remains explicitly absent/);
  assert.match(doc, /previous JSON-first video-meta freshness eviction row is retired/);
  assert.match(doc, /freshness-eviction\s+proof test now matches the current `js\/filter_logic\.js`/);
  assert.match(doc, /persistence, scheduling,\s+background storage, and queue fixtures remain unchanged/);
  assert.match(doc, /first-class\s+video-meta freshness eviction authority remains explicitly absent/);
  assert.match(doc, /previous JSON-first video-meta merge schema row is retired/);
  assert.match(doc, /merge-schema\s+proof test now matches the current `js\/filter_logic\.js` fingerprint/);
  assert.match(doc, /partial metadata merge and category forwarding\s+fixtures remain unchanged/);
  assert.match(doc, /first-class video-meta merge schema authority\s+remains explicitly absent/);
  assert.match(doc, /previous JSON-first video-meta no-work budget row is retired/);
  assert.match(doc, /no-work\s+budget proof test now matches the current `js\/filter_logic\.js` fingerprint/);
  assert.match(doc, /scheduler, duplicate,\s+DOM upload-date\/duration callsite fixtures remain unchanged/);
  assert.match(doc, /first-class\s+video-meta no-work budget authority remains explicitly absent/);
  assert.match(doc, /previous JSON-first video-meta profile\/surface row is retired/);
  assert.match(doc, /profile\/surface proof test now matches the current `js\/filter_logic\.js`\s+fingerprint/);
  assert.match(doc, /content-side persistence,\s+Kids-host scheduling, background cache patching, filter-logic consumption, and\s+DOM category fixtures remain unchanged/);
  assert.match(doc, /first-class video-meta profile\/surface\s+authority remains explicitly absent/);
  assert.match(doc, /previous JSON-first video-meta revision boundary row is retired/);
  assert.match(doc, /revision-boundary proof test now matches the current `js\/filter_logic\.js`\s+fingerprint/);
  assert.match(doc, /content persistence,\s+filter-logic queueing, background compiled cache patching, and unpartitioned\s+metadata-map fixtures remain unchanged/);
  assert.match(doc, /first-class video-meta revision\s+authority remains explicitly absent/);
  assert.match(doc, /previous JSON path authority and audit-completion rows are retired/);
  assert.match(doc, /JSON\s+path authority owner-flow proof now matches the current `js\/filter_logic\.js`\s+line ranges/);
  assert.match(doc, /audit-completion register now asserts those same source pins while keeping\s+JSON-first promotion, generated path manifests, unsupported renderer policy,\s+field-effect authority, and JSON-vs-DOM ownership at `NO-GO`/);
  assert.match(doc, /previous Kids browse malformed-fragment rows are retired/);
  assert.match(doc, /Kids malformed\s+browse proof now matches the current `js\/filter_logic\.js` fingerprint and\s+`videoChannelMap` token count/);
  assert.match(doc, /compact video blocklist\/whitelist behavior,\s+owner rail visibility, malformed direct-JSON capture handling, and map side\s+effects remain unchanged/);
  assert.match(doc, /Kids browse raw-container contracts, fragment\s+extraction policy, native WebView parity, metric artifacts, and first-class Kids\s+browse malformed-fragment authority remain explicitly absent/);
  assert.match(doc, /previous JSON-first metric artifact gate rows are retired/);
  assert.match(doc, /metric proof\s+now pins current performance-claim and no-work crosswalk hashes/);
  assert.match(doc, /current\s+`js\/filter_logic\.js` `processData\(\)` anchor/);
  assert.match(doc, /metric artifact authority\s+remains explicitly absent/);
  assert.match(doc, /previous implementation readiness gate row is retired/);
  assert.match(doc, /readiness proof\s+now uses the current lifecycle register totals/);
  assert.match(doc, /runtime cleanup,\s+JSON-first promotion, whitelist\/cache optimization, release claims, and broad\s+behavior changes explicitly blocked/);
  assert.match(doc, /previous generated local output dependency surface rows are retired/);
  assert.match(doc, /current ignored `dist` v3\.3\.2 ZIP\/package tree snapshot/);
  assert.match(doc, /current `website\/\.next` local build fingerprints/);
  assert.match(doc, /non-authority boundary for generated output and dependency caches/);

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
