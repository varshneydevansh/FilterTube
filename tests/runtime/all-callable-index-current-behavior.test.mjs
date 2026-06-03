import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const auditMetaReadinessDocs = [
  'docs/audit/FILTERTUBE_AUDIT_DOC_LAYOUT_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_ALL_CALLABLE_INDEX_2026-05-18.md',
  'docs/audit/FILTERTUBE_CURRENT_DIRTY_WORKTREE_AUDIT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_METHOD_SEMANTIC_AUDIT_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md',
  'docs/audit/FILTERTUBE_REFERENCE_DOC_CLAIM_DRIFT_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_ROOT_PLANNING_DOC_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_RUNTIME_TEST_FILE_PROVENANCE_INDEX_CURRENT_BEHAVIOR_2026-05-25.md',
  'docs/audit/FILTERTUBE_SOURCE_OF_TRUTH_CLAIM_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_TRACKED_FILE_AUDIT_COVERAGE_2026-05-18.md',
  'docs/audit/FILTERTUBE_TRACKED_PUBLIC_DOC_CLAIM_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md'
];
const indexDoc = fs.readFileSync(
  path.join(repoRoot, 'docs/audit/FILTERTUBE_ALL_CALLABLE_INDEX_2026-05-18.md'),
  'utf8'
);
const methodSemanticGapDoc = fs.readFileSync(
  path.join(repoRoot, methodGapPath),
  'utf8'
);
const releaseFixStatusDoc = fs.readFileSync(
  path.join(repoRoot, 'docs/audit/FILTERTUBE_RELEASE_FIX_AUDIT_STATUS_2026-05-26.md'),
  'utf8'
);
const expectedFamilyTotals = new Map([
  ['Hot page/background runtime', { files: 9, count: 3166 }],
  ['Content helper runtime', { files: 9, count: 348 }],
  ['UI/settings runtime', { files: 10, count: 1590 }],
  ['Generated/quarantined UI', { files: 6, count: 147 }],
  ['Vendor bundles', { files: 2, count: 279 }],
  ['Build/sync scripts', { files: 4, count: 58 }],
  ['Audit/test lane scripts', { files: 3, count: 78 }],
  ['Website routes/components/config', { files: 26, count: 123 }]
]);

const callableRe = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>|(?:^|\n)\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?function\s*\(|(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;
const buildWebsiteCallableRe = /(?:^|\n)\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>/g;
const buildWebsiteParserComparisonFiles = [
  'build.js',
  'scripts/build-extension-ui.mjs',
  'scripts/build-nanah-vendor.mjs',
  'scripts/sync-native-runtime.mjs',
  'website/app/[slug]/page.js',
  'website/app/downloads/page.js',
  'website/app/layout.js',
  'website/app/not-found.js',
  'website/app/page.js',
  'website/app/privacy/page.js',
  'website/app/robots.js',
  'website/app/sitemap.js',
  'website/app/terms/page.js',
  'website/components/browser-logo-rail.js',
  'website/components/footer-signal-art.js',
  'website/components/hero-video.js',
  'website/components/marketing-ui.js',
  'website/components/reveal.js',
  'website/components/route-content.js',
  'website/components/scene-controller.js',
  'website/components/scenic-detail-page.js',
  'website/components/scenic-illustration.js',
  'website/components/scenic-tones.js',
  'website/components/site-data.js',
  'website/components/site-footer.js',
  'website/components/site-header.js',
  'website/components/site-shell-data.js',
  'website/components/theme-toggle.js',
  'website/next.config.mjs',
  'website/postcss.config.mjs'
];

function trackedJsFiles() {
  return execFileSync('git', [
    'ls-files',
    '*.js',
    '*.jsx',
    '*.mjs',
    ':(exclude)docs/**',
    ':(exclude)tests/**'
  ], {
    cwd: repoRoot,
    encoding: 'utf8'
  }).trim().split('\n').filter(Boolean).sort();
}

function source(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  assert.notEqual(startIndex, -1, `missing start marker ${start}`);
  const endIndex = text.indexOf(end, startIndex + start.length);
  assert.notEqual(endIndex, -1, `missing end marker ${end}`);
  return text.slice(startIndex, endIndex);
}

function countCallables(file) {
  const text = source(file);
  let count = 0;
  while (callableRe.exec(text)) count += 1;
  callableRe.lastIndex = 0;
  return count;
}

function countBuildWebsiteCallables(file) {
  const text = source(file);
  let count = 0;
  while (buildWebsiteCallableRe.exec(text)) count += 1;
  buildWebsiteCallableRe.lastIndex = 0;
  return count;
}

function lineOf(file, needle, occurrence = 0) {
  const lines = source(file).split(/\r?\n/);
  const indexes = [];
  lines.forEach((line, index) => {
    if (line.includes(needle)) indexes.push(index + 1);
  });
  assert.ok(indexes.length > occurrence, `${file} missing occurrence ${occurrence} for ${needle}`);
  return indexes[occurrence];
}

function docRow(file) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const row = indexDoc.match(new RegExp('\\| `' + escaped + '` \\| ([^|]+) \\| (\\d+) \\| ([^|]+) \\|'));
  assert.ok(row, `${file} should have a row in the all-callable index`);
  return {
    family: row[1].trim(),
    count: Number(row[2]),
    status: row[3].trim()
  };
}

function methodGapRow(file) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const row = methodSemanticGapDoc.match(new RegExp('\\| `' + escaped + '` \\| ([^|]+) \\| (\\d+) \\| `semantic proof incomplete` \\|'));
  assert.ok(row, `${file} should have a row in the method semantic proof gap index`);
  return {
    family: row[1].trim(),
    count: Number(row[2])
  };
}

function assertMethodSemanticConvergenceBoundary(doc) {
  const section = sliceBetween(
    doc,
    '## Method Semantic Convergence Boundary - 2026-05-30',
    '## Evidence Inputs'
  );

  for (const sourceInput of [
    'docs/audit/FILTERTUBE_ALL_CALLABLE_INDEX_2026-05-18.md',
    'docs/audit/FILTERTUBE_METHOD_SEMANTIC_AUDIT_REGISTER_2026-05-20.md',
    'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md',
    'docs/audit/FILTERTUBE_WHITELIST_CACHE_SPA_AFFECTED_CALLABLE_PROOF_BOUNDARY_CURRENT_BEHAVIOR_2026-05-30.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
    'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
    'per-file `FILTERTUBE_*_METHOD_SEMANTIC_REGISTER_*.md` artifacts',
    'tests/runtime/all-callable-index-current-behavior.test.mjs'
  ]) {
    assert.ok(section.includes(sourceInput), `method convergence boundary missing source input ${sourceInput}`);
  }

  for (const rowId of [
    'method_convergence_repo_census',
    'method_convergence_zero_complete_files',
    'method_convergence_family_weight',
    'method_convergence_hot_runtime_dominance',
    'method_convergence_selected_triage_not_closure',
    'method_convergence_required_field_gate',
    'method_convergence_parser_visibility_debt',
    'method_convergence_affected_callable_packet_gap',
    'method_convergence_json_first_blocker',
    'method_convergence_authority_absence'
  ]) {
    assert.ok(section.includes(rowId), `method convergence boundary missing row ${rowId}`);
  }

  for (const phrase of [
    '69 tracked JS/JSX/MJS files',
    '5,789 lexical callables',
    '3,166 hot page/background runtime',
    '2,623 UI, helper, generated, vendor, build, audit-lane, website',
    '149 selected semantic triage rows',
    '4 rejected closure candidates',
    '0 files with complete per-callable semantic proof',
    'NO-GO until affected callables have owner, trigger, inputs, route/surface',
    'side effects, no-work behavior, teardown/idempotence, fixtures, metrics',
    'flowchart TD',
    'Affected-callable closure packet required',
    'Method behavior changes remain NO-GO',
    'method semantic convergence rows: 10',
    'implementation-ready method semantic convergence rows: 0',
    'methodSemanticCoverageComplete product source symbol: absent',
    'callableBehaviorProofReady product source symbol: absent',
    'behaviorPatchMayProceed product source symbol: absent',
    'methodSemanticAuthority product source symbol: absent',
    'callableEffectReport product source symbol: absent',
    'callableNoWorkBudget product source symbol: absent',
    'callableTeardownRegistry product source symbol: absent',
    'runtime behavior changed by this addendum: no',
    'method deletion approval: NO-GO',
    'method merge approval: NO-GO',
    'affected-callable closure approval: NO-GO',
    'whitelist/cache method optimization approval: NO-GO',
    'JSON-first method promotion approval: NO-GO',
    'release/public-claim use: NO-GO'
  ]) {
    assert.ok(section.includes(phrase), `method convergence boundary missing phrase ${phrase}`);
  }
}

test('audit meta index docs carry the method proof gap blocker', () => {
  for (const phrase of [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5789',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5789',
    'optimization work and a first-class JSON\nfilter model remain blocked',
    'runtime behavior changed: no',
    'Method Semantic Convergence Boundary - 2026-05-30',
    'method semantic convergence rows: 10',
    'implementation-ready method semantic convergence rows: 0',
    'methodSemanticAuthority product source symbol: absent',
    'method deletion approval: NO-GO',
    'JSON-first method promotion approval: NO-GO'
  ]) {
    assert.ok(methodSemanticGapDoc.includes(phrase), `method gap source missing ${phrase}`);
  }

  assertMethodSemanticConvergenceBoundary(methodSemanticGapDoc);

  for (const docPath of auditMetaReadinessDocs) {
    const doc = source(docPath);
    assert.ok(doc.includes(methodGapPath), `${docPath} must cite method semantic gap source`);
    assert.ok(doc.includes('method semantic proof gap lexical callables covered: 5789'), `${docPath} must pin callable gap count`);
    assert.ok(doc.includes('affected callable semantic proof: NO-GO'), `${docPath} must keep behavior-change blocker`);
    if (docPath.includes('CURRENT_DIRTY_WORKTREE_AUDIT_BOUNDARY')) {
      assert.ok(doc.includes('runtime behavior changed: yes in the 2026-05-26 release-lag fix batch'), `${docPath} must record release-lag runtime changes`);
    } else {
      assert.ok(doc.includes('runtime behavior changed: no'), `${docPath} must preserve audit-only boundary`);
    }
  }
});

test('all-callable index accounts for every tracked JS JSX and MJS source file', () => {
  const files = trackedJsFiles();
  assert.equal(files.length, 69);
  assert.match(indexDoc, /tracked JS\/JSX\/MJS files: 69/);

  for (const file of files) {
    docRow(file);
  }
});

test('all-callable index counts match current lexical callable source', () => {
  const files = trackedJsFiles();
  let total = 0;
  for (const file of files) {
    const actual = countCallables(file);
    const documented = docRow(file).count;
    total += actual;
    assert.equal(documented, actual, `${file} callable count should match current source`);
  }

  assert.equal(total, 5789);
  assert.match(indexDoc, /repo-wide lexical callables: 5789/);
});

test('all-callable family totals match the documented file rows', () => {
  const totals = new Map();
  for (const file of trackedJsFiles()) {
    const row = docRow(file);
    totals.set(row.family, {
      files: (totals.get(row.family)?.files || 0) + 1,
      count: (totals.get(row.family)?.count || 0) + row.count
    });
  }

  assert.deepEqual(totals, expectedFamilyTotals);
});

test('all-callable index excludes ignored raw captures and generated package output', () => {
  for (const excluded of [
    'WHITELIST_content.JS',
    'WHITELIST_background.js',
    'playlist.js',
    'dist/chrome/js/filter_logic.js',
    'node_modules/.package-lock.json',
    'website/.next/BUILD_ID'
  ]) {
    const escapedExcluded = excluded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.doesNotMatch(indexDoc, new RegExp('\\| `' + escapedExcluded + '`'));
  }

  assert.match(indexDoc, /git ls-files '\*\.js' '\*\.jsx' '\*\.mjs'/);
  assert.match(indexDoc, /ignored raw captures/);
});

test('all-callable index documents semantic method proof boundary', () => {
  assert.match(indexDoc, /Semantic Method Boundary/);
  assert.match(indexDoc, /complete-codebase objective says "every method"/);
  assert.match(indexDoc, /trigger path and caller class/);
  assert.match(indexDoc, /settings\/profile\/list-mode inputs/);
  assert.match(indexDoc, /route\/surface scope/);
  assert.match(indexDoc, /DOM writes, fetches, storage writes/);
  assert.match(indexDoc, /active\/no-rule\/disabled behavior/);
  assert.match(indexDoc, /teardown or idempotence behavior/);
  assert.match(indexDoc, /behavior\s+changes remain blocked by the implementation gate/);
  assert.doesNotMatch(indexDoc, /2,834 lexical callables/);
  assert.doesNotMatch(indexDoc, /another 2,483/);
  assert.match(indexDoc, /Hot runtime has 3,166 lexical callables/);
  assert.match(indexDoc, /another 2,623/);
  assert.match(indexDoc, /Only 123 lexical callable forms/);

  assert.match(methodSemanticGapDoc, /Status: audit-only current-behavior gap index/);
  assert.match(methodSemanticGapDoc, /tracked JS\/JSX\/MJS files: 69/);
  assert.match(methodSemanticGapDoc, /repo-wide lexical callables: 5789/);
  assert.match(methodSemanticGapDoc, /files with lexical accounting: 69/);
  assert.match(methodSemanticGapDoc, /files with complete per-callable semantic proof: 0/);
  assert.match(methodSemanticGapDoc, /lexical callables requiring semantic proof before behavior changes: 5789/);
  assert.match(methodSemanticGapDoc, /required semantic proof fields: 8/);
  assert.match(methodSemanticGapDoc, /selected release hot-path semantic triage rows: 13/);
  assert.match(methodSemanticGapDoc, /selected visual-writer semantic triage rows: 8/);
  assert.match(methodSemanticGapDoc, /selected collaborator-cache semantic triage rows: 7/);
  assert.match(methodSemanticGapDoc, /selected collaborator writer-side semantic triage rows: 8/);
  assert.match(methodSemanticGapDoc, /selected Topic menu renderer guard semantic triage rows: 1/);
  assert.match(methodSemanticGapDoc, /selected native-dropdown lifecycle semantic triage rows: 12/);
  assert.match(methodSemanticGapDoc, /selected JSON active-work semantic triage rows: 12/);
  assert.match(methodSemanticGapDoc, /selected content\/category field semantic triage rows: 16/);
  assert.match(methodSemanticGapDoc, /selected rule\/settings mutation persistence semantic triage rows: 13/);
  assert.match(methodSemanticGapDoc, /selected DOM fallback run\/selector traversal semantic triage rows: 12/);
  assert.match(methodSemanticGapDoc, /selected content-bridge runtime lifecycle semantic triage rows: 13/);
  assert.match(methodSemanticGapDoc, /selected background compiled-cache\/refresh semantic triage rows: 14/);
  assert.match(methodSemanticGapDoc, /selected quick-block affordance lifecycle semantic triage rows: 20/);
  assert.match(methodSemanticGapDoc, /evaluated complete-proof closure candidates: 4/);
  assert.match(methodSemanticGapDoc, /complete-proof closure candidates accepted: 0/);
  assert.match(methodSemanticGapDoc, /rejected closure candidate: scripts\/sync-native-runtime\.mjs/);
  assert.match(methodSemanticGapDoc, /closure rejection reason: public wrapper phase proof exists, but native app contract, manifest\/hash\/status fixture provenance, missing-app negative fixture, drift negative fixture, and release freshness report are absent/);
  assert.match(methodSemanticGapDoc, /rejected closure candidate: js\/content\/menu\.js/);
  assert.match(methodSemanticGapDoc, /closure rejection reason: content-menu VM and source proof exists, but CSS scope, native menu visual side effects, duplicate-DOM recovery, dark\/light parity, block\/allow vocabulary, no-rule budget, and teardown proof remain absent/);
  assert.match(methodSemanticGapDoc, /rejected closure candidate: website app zero-count default-export row cluster/);
  assert.match(methodSemanticGapDoc, /closure rejection reason: broad-parser zero rows are not callable-free proof; current website source contains default-export route functions and still lacks route render, public-claim, deploy, accessibility, and release freshness proof/);
  assert.match(methodSemanticGapDoc, /rejected closure candidate: build\/website cross-parser count convergence/);
  assert.match(methodSemanticGapDoc, /closure rejection reason: repo-wide broad parser and build\/website route parser intentionally count different lexical shapes; current build\/sync plus website\/config broad total is 181 while build\/website audit total is 108, so parser agreement and complete semantic proof remain absent/);
  assert.match(methodSemanticGapDoc, /2026-05-30 Current-Source Method Gap Freshness Addendum/);
  assert.match(methodSemanticGapDoc, /tracked JS\/JSX\/MJS files still covered: 69/);
  assert.match(methodSemanticGapDoc, /repo-wide lexical callables still requiring semantic proof: 5789/);
  assert.match(methodSemanticGapDoc, /latest full runtime proof: broad audit backlog 4754 tests, 4661 pass, 93 fail/);
  assert.match(methodSemanticGapDoc, /method semantic completion from freshness rerun: NO-GO/);
  assert.match(methodSemanticGapDoc, /JSON-first first-class promotion from method freshness rerun: NO-GO/);
  assert.match(methodSemanticGapDoc, /affected-callable closure packet required fields:/);
  assert.match(methodSemanticGapDoc, /positive_negative_fixture_set/);
  assert.match(methodSemanticGapDoc, /Release Hot-Path Semantic Addendum - 2026-05-27/);
  assert.match(methodSemanticGapDoc, /DOM Visual-Writer Semantic Addendum - 2026-05-27/);
  assert.match(methodSemanticGapDoc, /Collaborator Cache Provenance Semantic Addendum - 2026-05-28/);
  assert.match(methodSemanticGapDoc, /Collaborator Writer-Side Guard Semantic Addendum - 2026-05-29/);
  assert.match(methodSemanticGapDoc, /Topic Menu Renderer Guard Semantic Continuation - 2026-05-29/);
  assert.match(methodSemanticGapDoc, /Native Dropdown\/Menu Lifecycle Semantic Addendum - 2026-05-28/);
  assert.match(methodSemanticGapDoc, /JSON Active-Work Predicate Semantic Addendum - 2026-05-28/);
  assert.match(methodSemanticGapDoc, /Content\/Category Field Semantics Method Addendum - 2026-05-29/);
  assert.match(methodSemanticGapDoc, /Rule\/Settings Mutation Persistence Semantic Addendum - 2026-05-28/);
  assert.match(methodSemanticGapDoc, /DOM Fallback Run\/Selector Traversal Semantic Addendum - 2026-05-28/);
  assert.match(methodSemanticGapDoc, /Content Bridge Runtime Lifecycle Semantic Addendum - 2026-05-28/);
  assert.match(methodSemanticGapDoc, /Background Compiled-Cache\/Refresh Semantic Addendum - 2026-05-28/);
  assert.match(methodSemanticGapDoc, /Quick-Block Affordance Lifecycle Semantic Addendum - 2026-05-28/);
  assert.match(methodSemanticGapDoc, /2026-05-30 Content Menu Closure Candidate Rejection/);
  assert.match(methodSemanticGapDoc, /closure candidate evaluated: js\/content\/menu\.js/);
  assert.match(methodSemanticGapDoc, /closure candidate accepted: no/);
  assert.match(methodSemanticGapDoc, /current file-local proof is strong enough for audit evidence, but not/);
  assert.match(methodSemanticGapDoc, /2026-05-30 Website Zero-Count Closure Candidate Rejection/);
  assert.match(methodSemanticGapDoc, /closure candidate evaluated: website app zero-count default-export row cluster/);
  assert.match(methodSemanticGapDoc, /source-visibility classifier debt: present/);
  assert.match(methodSemanticGapDoc, /zero broad-parser count means callable closure: no/);
  assert.match(methodSemanticGapDoc, /default-export route semantic completion: NO-GO/);
  assert.match(methodSemanticGapDoc, /2026-05-30 Build\/Website Parser Divergence Closure Candidate Rejection/);
  assert.match(methodSemanticGapDoc, /build\/sync plus website\/config files compared: 30/);
  assert.match(methodSemanticGapDoc, /repo-wide broad parser total for compared files: 181/);
  assert.match(methodSemanticGapDoc, /build\/website route parser total for compared files: 108/);
  assert.match(methodSemanticGapDoc, /net broad-minus-build\/website delta: 73/);
  assert.match(methodSemanticGapDoc, /parser agreement as completion proof: NO-GO/);
  assert.match(methodSemanticGapDoc, /closure candidate evaluated: build\/website cross-parser count convergence/);
  assert.match(methodSemanticGapDoc, /parser convergence proof status: ABSENT/);
  assert.match(methodSemanticGapDoc, /source visibility proof status: PARTIAL_BY_LAYER/);
  assert.match(methodSemanticGapDoc, /semantic completion from parser agreement: NO-GO/);
  assert.match(methodSemanticGapDoc, /filter_logic_duration_decision_alias_range_mode/);
  assert.match(methodSemanticGapDoc, /dom_fallback_uploadDate_fetch_pending_side_effect/);
  assert.match(methodSemanticGapDoc, /content_bridge_videoMeta_fetch_persist_rerun_pipeline/);

  for (const [file, exportedFunction] of [
    ['website/app/layout.js', 'export default function RootLayout({ children })'],
    ['website/app/not-found.js', 'export default function NotFound()'],
    ['website/app/robots.js', 'export default function robots()'],
    ['website/app/sitemap.js', 'export default function sitemap()'],
    ['website/app/terms/page.js', 'export default function TermsPage()']
  ]) {
    assert.equal(methodGapRow(file).count, 0, `${file} should remain a broad-parser zero row`);
    assert.ok(source(file).includes(exportedFunction), `${file} should prove the default-export source shape`);
    assert.match(methodSemanticGapDoc, new RegExp(`\\| \`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\` \\| 0 \\|`));
    assert.match(methodSemanticGapDoc, new RegExp(exportedFunction.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  let broadBuildWebsiteTotal = 0;
  let routeParserTotal = 0;
  for (const file of buildWebsiteParserComparisonFiles) {
    broadBuildWebsiteTotal += countCallables(file);
    routeParserTotal += countBuildWebsiteCallables(file);
  }

  assert.equal(buildWebsiteParserComparisonFiles.length, 30);
  assert.equal(broadBuildWebsiteTotal, 181);
  assert.equal(routeParserTotal, 108);
  assert.equal(broadBuildWebsiteTotal - routeParserTotal, 73);

  for (const [file, broadCount, routeCount] of [
    ['build.js', 51, 29],
    ['scripts/sync-native-runtime.mjs', 1, 0],
    ['website/app/layout.js', 0, 1],
    ['website/app/robots.js', 0, 1],
    ['website/components/scene-controller.js', 10, 5]
  ]) {
    assert.equal(countCallables(file), broadCount, `${file} broad-parser comparison count drifted`);
    assert.equal(countBuildWebsiteCallables(file), routeCount, `${file} build/website parser comparison count drifted`);
  }

  for (const field of [
    'owner family and source file',
    'trigger path and caller class',
    'settings/profile/list-mode inputs',
    'route/surface scope',
    'observable side effects',
    'active/no-rule/disabled behavior',
    'teardown or idempotence behavior',
    'positive and negative fixtures'
  ]) {
    assert.ok(methodSemanticGapDoc.includes(field), `missing method proof field ${field}`);
  }

  const methodTotals = new Map();
  let total = 0;
  for (const file of trackedJsFiles()) {
    const allCallableRow = docRow(file);
    const methodRow = methodGapRow(file);
    const actual = countCallables(file);
    total += methodRow.count;

    assert.equal(methodRow.family, allCallableRow.family, `${file} family should match all-callable index`);
    assert.equal(methodRow.count, actual, `${file} gap count should match current source`);
    methodTotals.set(methodRow.family, {
      files: (methodTotals.get(methodRow.family)?.files || 0) + 1,
      count: (methodTotals.get(methodRow.family)?.count || 0) + methodRow.count
    });
  }

  assert.equal(total, 5789);
  assert.deepEqual(methodTotals, expectedFamilyTotals);

  for (const authority of [
    'methodSemanticCoverageComplete',
    'callableBehaviorProofReady',
    'behaviorPatchMayProceed',
    'methodSemanticAuthority',
    'callableEffectReport',
    'callableNoWorkBudget',
    'callableTeardownRegistry'
  ]) {
    assert.ok(methodSemanticGapDoc.includes(authority), `gap doc should name future authority ${authority}`);
    for (const file of trackedJsFiles()) {
      assert.doesNotMatch(source(file), new RegExp(authority), `${authority} should not exist in ${file}`);
    }
  }

  const semanticRows = [
    ['seed_hasNetworkJsonWork', 'js/seed.js', 'function hasNetworkJsonWork(settings)'],
    ['seed_shouldBypassYouTubeiNetworkResponse', 'js/seed.js', 'function shouldBypassYouTubeiNetworkResponse(dataName)'],
    ['injector_hasNetworkJsonWork', 'js/injector.js', 'function hasNetworkJsonWork(settings)'],
    ['bridge_settings_refreshRuntimeObserversAfterSettingsUpdate', 'js/content/bridge_settings.js', 'function refreshRuntimeObserversAfterSettingsUpdate()'],
    ['bridge_settings_scheduleSettingsRefreshFromStorage', 'js/content/bridge_settings.js', 'function scheduleSettingsRefreshFromStorage({ forceReprocess = true } = {})'],
    ['background_v4KeywordEntries', 'js/background.js', 'const v4KeywordEntries = shouldUseKidsProfile'],
    ['content_bridge_forceCloseDropdown', 'js/content_bridge.js', 'function forceCloseDropdown(dropdown)'],
    ['content_bridge_parseCollaboratorNames', 'js/content_bridge.js', "function parseCollaboratorNames(rawText = '', options = {})"],
    ['block_refreshQuickBlockRuntimeState', 'js/content/block_channel.js', 'function refreshQuickBlockRuntimeState(options = {})'],
    ['block_refreshQuickBlockAvailability', 'js/content/block_channel.js', 'function refreshQuickBlockAvailability(options = {})'],
    ['block_resolveOutermostShortsQuickBlockHost', 'js/content/block_channel.js', 'function resolveOutermostShortsQuickBlockHost(hostCard)'],
    ['block_repairFilterTubeHiddenDropdownState', 'js/content/block_channel.js', 'const repairFilterTubeHiddenDropdownState = (dropdown) =>'],
    ['block_closeFilterTubeInjectedDropdownsOnOutsidePointer', 'js/content/block_channel.js', 'const closeFilterTubeInjectedDropdownsOnOutsidePointer = (event) =>'],
    ['dom_helper_ensureStyles', 'js/content/dom_helpers.js', 'function ensureStyles()'],
    ['dom_helper_whitelistPendingConversion', 'js/content/dom_helpers.js', "element.removeAttribute('data-filtertube-whitelist-pending')"],
    ['dom_helper_newHideSideEffects', 'js/content/dom_helpers.js', 'if (!wasAlreadyHidden) {'],
    ['dom_helper_skipStatsMediaCoupling', 'js/content/dom_helpers.js', 'const duration = extractVideoDuration(element);'],
    ['dom_helper_restoreSideEffects', 'js/content/dom_helpers.js', 'const wasHidden = element.classList.contains'],
    ['dom_helper_updateContainerVisibility', 'js/content/dom_helpers.js', 'function updateContainerVisibility(container, childSelector)'],
    ['dom_helper_containerRestoreGap', 'js/content/dom_helpers.js', 'if (allHidden) {'],
    ['dom_helper_externalGlobalDependencies', 'js/content/dom_helpers.js', 'filteringTracker.recordHide(element, reason);'],
    ['content_bridge_getValidatedCachedCollaborators_ampersand_topic_guard', 'js/content_bridge.js', 'function getValidatedCachedCollaborators(card)'],
    ['content_bridge_ampersandTopicNameOnlyCollaboratorState_guard', 'js/content_bridge.js', 'function isAmpersandTopicNameOnlyCollaboratorState(videoCard, collaborators = [])'],
    ['content_bridge_applyResolvedCollaborators_card_stamp_provenance', 'js/content_bridge.js', 'function applyResolvedCollaborators(videoId, collaborators, options = {})'],
    ['content_bridge_applyCollaboratorsByVideoId_unstamped_cache', 'js/content_bridge.js', 'function applyCollaboratorsByVideoId(videoId, collaborators, options = {})'],
    ['content_bridge_prefetchCollaboratorsForCard_single_card_warmup', 'js/content_bridge.js', 'async function prefetchCollaboratorsForCard(videoCard, options = {})'],
    ['content_bridge_normalizeCollaboratorCache_before_fresh_parser', 'js/content_bridge.js', 'function normalizeCollaboratorChannelInfoForCard(initialChannelInfo, videoCard, options = {})'],
    ['content_bridge_menu_enrichment_list_only_cache', 'js/content_bridge.js', 'resolvedCollaboratorsByVideoId.set(videoId, sanitized);', 2],
    ['content_bridge_block_all_stale_delete_no_op', 'js/content_bridge.js', 'resolvedCollaboratorsByVideoId.delete(cacheVideoId);'],
    ['content_bridge_rejectAmpersandTopicCollaboratorWrite_topic_writer_guard', 'js/content_bridge.js', "function rejectAmpersandTopicCollaboratorWrite(videoId = '', collaborators = [], candidateCards = [])"],
    ['content_bridge_applyResolvedCollaborators_writer_guard', 'js/content_bridge.js', 'function applyResolvedCollaborators(videoId, collaborators, options = {})'],
    ['content_bridge_applyCollaboratorsByVideoId_writer_guard', 'js/content_bridge.js', 'function applyCollaboratorsByVideoId(videoId, collaborators, options = {})'],
    ['content_bridge_renderer_hydration_writer_guard', 'js/content_bridge.js', "card.setAttribute('data-filtertube-collaborators-source', 'lockup');"],
    ['content_bridge_cacheResult_writer_guard', 'js/content_bridge.js', 'function cacheResultAndMaybeEnrich({'],
    ['content_bridge_active_menu_refresh_writer_partial_guard', 'js/content_bridge.js', 'function refreshActiveCollaborationMenu(videoId, collaborators, options = {})'],
    ['block_quick_collectCollaborators_action_trust_boundary', 'js/content/block_channel.js', 'function collectQuickBlockCollaborators(base = {}, videoCard = null)'],
    ['content_bridge_menu_renderer_action_trust_boundary', 'js/content_bridge.js', 'function renderFilterTubeMenuEntries({ dropdown, newMenuList, oldMenuList, channelInfo, videoCard, placeholder = false })'],
    ['content_bridge_ampersandTopic_menu_renderer_guard', 'js/content_bridge.js', 'function contentBridgeAmpersandTopicSingleChannelMenuGuard(channelInfo, videoCard)'],
    ['content_bridge_cleanupDropdownState_native_menu_state', 'js/content_bridge.js', 'function cleanupDropdownState(dropdown)'],
    ['content_bridge_getReusableNativeDropdownRoot_close_target', 'js/content_bridge.js', 'function getReusableNativeDropdownRoot(dropdown)'],
    ['content_bridge_forceCloseDropdown_native_close_policy', 'js/content_bridge.js', 'function forceCloseDropdown(dropdown)'],
    ['content_bridge_renderFilterTubeMenuEntries_dropdown_writer', 'js/content_bridge.js', 'function renderFilterTubeMenuEntries({ dropdown, newMenuList, oldMenuList, channelInfo, videoCard, placeholder = false })'],
    ['content_bridge_injectFilterTubeMenuItem_async_open_wait', 'js/content_bridge.js', 'async function injectFilterTubeMenuItem(dropdown, videoCard)'],
    ['block_setupMenuObserver_page_lifetime_owner', 'js/content/block_channel.js', 'function setupMenuObserver()'],
    ['block_ensureDropdownVisibilityObserver_attribute_scope', 'js/content/block_channel.js', 'function ensureDropdownVisibilityObserver(dropdown)'],
    ['block_scheduleDropdownInjection_deferred_dedupe', 'js/content/block_channel.js', 'const scheduleDropdownInjection = (dropdown) =>'],
    ['block_scanExistingDropdowns_explicit_repair_scope', 'js/content/block_channel.js', 'const scanExistingDropdowns = () =>'],
    ['block_closeFilterTubeInjectedDropdownsOnOutsidePointer_owned_close', 'js/content/block_channel.js', 'const closeFilterTubeInjectedDropdownsOnOutsidePointer = (event) =>'],
    ['block_armDropdownDiscoveryObserver_short_lived_body_observer', 'js/content/block_channel.js', 'const armDropdownDiscoveryObserver = () =>'],
    ['block_handleDropdownAppearedInternal_reusable_node_identity_cleanup', 'js/content/block_channel.js', 'async function handleDropdownAppearedInternal(dropdown)'],
    ['seed_hasEnabledContentFilters_strict_boolean', 'js/seed.js', 'function hasEnabledContentFilters(settings)'],
    ['seed_hasActiveJsonFilterRules_rule_branches', 'js/seed.js', 'function hasActiveJsonFilterRules(settings)'],
    ['seed_shouldSkipEngineProcessing_harvest_only_scope', 'js/seed.js', 'function shouldSkipEngineProcessing(data, dataName)'],
    ['seed_processWithEngine_transport_dispatcher', 'js/seed.js', 'function processWithEngine(data, dataName)'],
    ['seed_setupFetchInterception_clone_parse_gate', 'js/seed.js', 'function setupFetchInterception()'],
    ['seed_setupXhrInterception_parse_override_gate', 'js/seed.js', 'function setupXhrInterception()'],
    ['injector_processDataWithFilterLogic_active_gate', 'js/injector.js', 'function processDataWithFilterLogic(data, dataName)'],
    ['injector_processInitialDataQueue_no_work_clear', 'js/injector.js', 'function processInitialDataQueue()'],
    ['bridge_needsIdentityPrefetchWork_non_json_branch', 'js/content_bridge.js', 'function needsIdentityPrefetchWork(settings)'],
    ['bridge_needsMainWorldRuntimeWork_admission', 'js/content_bridge.js', 'function needsMainWorldRuntimeWork(settings)'],
    ['bridge_ensureMainWorldRuntimeForSettings_injection_gate', 'js/content_bridge.js', 'async function ensureMainWorldRuntimeForSettings(settings)'],
    ['filter_logic_processData_harvest_then_mutate', 'js/filter_logic.js', "processData(data, dataName = 'unknown')"],
    ['state_manager_addKeyword_mode_split_persistence', 'js/state_manager.js', 'async function addKeyword(word, options = {})'],
    ['state_manager_persistMainProfiles_dual_schema_alias_writer', 'js/state_manager.js', 'async function persistMainProfiles(nextMain)'],
    ['state_manager_addChannel_background_action_branch', 'js/state_manager.js', 'async function addChannel(input)'],
    ['state_manager_importSubscribedChannelsToWhitelist_batch_handoff', 'js/state_manager.js', 'async function importSubscribedChannelsToWhitelist(options = {})'],
    ['settings_shared_loadSettings_read_path_v4_writer', 'js/settings_shared.js', 'function loadSettings()'],
    ['settings_shared_saveSettings_v4_root_mirror_writer', 'js/settings_shared.js', 'function saveSettings(options = {})'],
    ['background_setListMode_destructive_transition_writer', 'js/background.js', "} else if (action === 'FilterTube_SetListMode') {"],
    ['background_addWhitelistChannelPersistent_trusted_whitelist_call', 'js/background.js', "} else if (action === 'addWhitelistChannelPersistent') {"],
    ['background_addChannelPersistent_legacy_block_writer', 'js/background.js', '} else if (request.action === "addChannelPersistent") {'],
    ['background_addFilteredChannel_secondary_default_blocklist', 'js/background.js', "if (message.type === 'addFilteredChannel') {"],
    ['background_handleAddFilteredChannel_multi_surface_writer', 'js/background.js', 'async function handleAddFilteredChannel(input, filterAll = false'],
    ['content_bridge_addChannelDirectly_content_payload', 'js/content_bridge.js', 'async function addChannelDirectly(input, filterAll = false'],
    ['io_manager_importV3_multi_profile_import_writer', 'js/io_manager.js', 'async function importV3(json, { strategy ='],
    ['dom_fallback_hasActiveDOMFallbackWork_admission', 'js/content/dom_fallback.js', 'function hasActiveDOMFallbackWork(settings)'],
    ['dom_fallback_clearStaleDOMFallbackVisibility_cleanup', 'js/content/dom_fallback.js', 'function clearStaleDOMFallbackVisibility()'],
    ['dom_fallback_applyDOMFallback_run_state_gate', 'js/content/dom_fallback.js', 'async function applyDOMFallback(settings, options = {})'],
    ['dom_fallback_applyDOMFallback_no_work_cleanup_return', 'js/content/dom_fallback.js', 'const hasActiveFallbackWork = hasActiveDOMFallbackWork(effectiveSettings);'],
    ['dom_fallback_feed_channels_cleanup_return', 'js/content/dom_fallback.js', "document.querySelectorAll('[data-filtertube-whitelist-pending=\"true\"], [data-filtertube-hidden], .filtertube-hidden, .filtertube-hidden-shelf').forEach(el => {"],
    ['dom_fallback_whitelist_watch_scaffolding_restore', 'js/content/dom_fallback.js', "if (listMode === 'whitelist') {", 1],
    ['dom_fallback_videoElements_selector_scope', 'js/content/dom_fallback.js', 'const videoElements = (onlyWhitelistPending && listMode === '],
    ['dom_fallback_processed_identity_skip_gate', 'js/content/dom_fallback.js', "const alreadyProcessed = element.hasAttribute('data-filtertube-processed');"],
    ['dom_fallback_channel_identity_selector_waterfall', 'js/content/dom_fallback.js', 'const titleElement = element.querySelector('],
    ['dom_fallback_pending_meta_recheck_timer', 'js/content/dom_fallback.js', 'const pendingTimerState = window.__filtertubePendingMetaRecheck'],
    ['dom_fallback_playlist_selected_row_safeguard', 'js/content/dom_fallback.js', 'Never hide the currently-selected playlist row'],
    ['dom_fallback_run_state_pending_rerun_timer', 'js/content/dom_fallback.js', 'setTimeout(() => applyDOMFallback(runState.latestSettings, runState.latestOptions), 0);'],
    ['content_bridge_schedulePrefetchScan_frame_gate', 'js/content_bridge.js', 'function schedulePrefetchScan()'],
    ['content_bridge_attachPrefetchObservers_card_cap', 'js/content_bridge.js', 'function attachPrefetchObservers()'],
    ['content_bridge_startCardPrefetchObserver_visibility_listener', 'js/content_bridge.js', 'function startCardPrefetchObserver()'],
    ['content_bridge_installPlaylistPanelPrefetchHook_scroll_observer', 'js/content_bridge.js', 'function installPlaylistPanelPrefetchHook()'],
    ['content_bridge_installRightRailWhitelistObserver_mode_route_timers', 'js/content_bridge.js', 'function installRightRailWhitelistObserver()'],
    ['content_bridge_refreshFilterTubeRuntimeObservers_fanout', 'js/content_bridge.js', 'function refreshFilterTubeRuntimeObservers()'],
    ['content_bridge_scheduleVideoMetaDomRerun_debounce', 'js/content_bridge.js', 'function scheduleVideoMetaDomRerun()'],
    ['content_bridge_initializeDOMFallback_delayed_boot', 'js/content_bridge.js', 'async function initializeDOMFallback(settings)'],
    ['content_bridge_scheduleWhitelistPendingRecheck_timer', 'js/content_bridge.js', 'function scheduleWhitelistPendingRecheck(delayMs = 120)'],
    ['content_bridge_queueWhitelistPendingHide_pending_timer', 'js/content_bridge.js', 'function queueWhitelistPendingHide(mutations, delayMs = 40)'],
    ['content_bridge_refreshDOMFallbackMutationObserver_active_gate', 'js/content_bridge.js', 'function refreshDOMFallbackMutationObserver()'],
    ['content_bridge_ensureFallbackMenuButtons_lifecycle_scan', 'js/content_bridge.js', 'function ensureFallbackMenuButtons()'],
    ['content_bridge_tail_message_listener_initialize_timer', 'js/content_bridge.js', "window.addEventListener('message', handleMainWorldMessages, false);"],
    ['background_compiledSettingsCache_profile_shape', 'js/background.js', 'let compiledSettingsCache = { main: null, kids: null };'],
    ['background_enqueueChannelMapUpdate_cache_patch', 'js/background.js', 'function enqueueChannelMapUpdate(key, value)'],
    ['background_enqueueVideoChannelMapUpdate_cache_patch', 'js/background.js', 'function enqueueVideoChannelMapUpdate(videoId, channelId)'],
    ['background_enqueueVideoMetaMapUpdate_cache_patch', 'js/background.js', 'function enqueueVideoMetaMapUpdate(videoId, meta)'],
    ['background_getCompiledSettings_cache_return_gate', 'js/background.js', 'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false) {'],
    ['background_getCompiledSettings_compile_assign', 'js/background.js', 'compiledSettingsCache[targetProfile] = compiledSettings;'],
    ['background_runtime_getCompiledSettings_cache_branch', 'js/background.js', '} else if (action === "getCompiledSettings") {'],
    ['background_setListMode_cache_invalidation_refresh', 'js/background.js', "} else if (action === 'FilterTube_SetListMode') {"],
    ['background_batchImportWhitelist_cache_invalidation_refresh', 'js/background.js', "} else if (action === 'FilterTube_BatchImportWhitelistChannels') {"],
    ['background_transferWhitelistToBlocklist_cache_invalidation_refresh', 'js/background.js', "} else if (action === 'FilterTube_TransferWhitelistToBlocklist') {"],
    ['background_applySettings_recompile_broadcast', 'js/background.js', '} else if (request.action === "FilterTube_ApplySettings" && request.settings) {'],
    ['background_learned_map_message_receivers', 'js/background.js', '} else if (request.action === "updateChannelMap") {'],
    ['background_storage_onChanged_cache_invalidation', 'js/background.js', 'browserAPI.storage.onChanged.addListener((changes, area) => {'],
    ['background_handleAddFilteredChannel_mutation_cache_invalidation', 'js/background.js', 'async function handleAddFilteredChannel(input, filterAll = false'],
    ['block_quick_shouldRefresh_runtime_state_gate', 'js/content/block_channel.js', 'function shouldRefreshQuickBlockRuntimeState()'],
    ['block_quick_refreshRuntimeState_lazy_observer', 'js/content/block_channel.js', 'function refreshQuickBlockRuntimeState(options = {})'],
    ['block_quick_refreshAvailability_disable_cleanup', 'js/content/block_channel.js', 'function refreshQuickBlockAvailability(options = {})'],
    ['block_quick_hoverIntent_desktop_delay', 'js/content/block_channel.js', 'function scheduleQuickBlockHoverIntent(card, event)'],
    ['block_quick_isShortsCard_surface_detection', 'js/content/block_channel.js', 'function isShortsQuickBlockCard(card)'],
    ['block_quick_resolveHost_shorts_outer_card', 'js/content/block_channel.js', 'function resolveQuickBlockHost(node)'],
    ['block_quick_resolveOutermostShortsHost_depth_cap', 'js/content/block_channel.js', 'function resolveOutermostShortsQuickBlockHost(hostCard)'],
    ['block_quick_resolveAnchor_renderable_target', 'js/content/block_channel.js', 'function resolveQuickBlockAnchor(hostCard)'],
    ['block_quick_findCardFromTarget_bounded_lookup', 'js/content/block_channel.js', 'function findQuickBlockCardFromTarget(target, maxDepth = 18)'],
    ['block_quick_isEnabled_mode_gate', 'js/content/block_channel.js', 'const isQuickBlockEnabled = () => {'],
    ['block_quick_shouldEagerSweep_mobile_only', 'js/content/block_channel.js', 'function shouldEagerQuickBlockSweep()'],
    ['block_quick_removeButtons_cleanup', 'js/content/block_channel.js', 'function removeQuickBlockButtons()'],
    ['block_quick_buildContext_identity_source', 'js/content/block_channel.js', 'function buildQuickBlockContext(videoCard)'],
    ['block_quick_runFallback_mutation_path', 'js/content/block_channel.js', 'async function runQuickBlockFallback(context, info, source = '],
    ['block_quick_applyImmediateHide_optimistic_writer', 'js/content/block_channel.js', 'function applyQuickBlockImmediateHide(videoCard, channelInfo)'],
    ['block_quick_ensureButton_anchor_wrap_events', 'js/content/block_channel.js', 'function ensureQuickBlockButton(card)'],
    ['block_quick_scheduleSweep_coalesced_roots', 'js/content/block_channel.js', 'function scheduleQuickBlockSweep(root = document)'],
    ['block_quick_setupObserver_page_lifecycle', 'js/content/block_channel.js', 'function setupQuickBlockObserver()'],
    ['block_quick_pointerRecovery_dynamic_listener', 'js/content/block_channel.js', 'quickBlockPointerRecoveryArmer = () => {'],
    ['block_quick_mobileMutationObserver_eager_only', 'js/content/block_channel.js', 'const observer = new MutationObserver((mutations) => {']
  ];

  for (const [rowId, file, needle, occurrence = 0] of semanticRows) {
    assert.ok(methodSemanticGapDoc.includes(`| \`${rowId}\` |`), `missing semantic row ${rowId}`);
    assert.ok(
      methodSemanticGapDoc.includes(`\`${file}:${lineOf(file, needle, occurrence)}\``),
      `missing current line ref for ${rowId}`
    );
  }

  const seed = source('js/seed.js');
  assert.match(seed, /if \(!settings \|\| settings\.enabled === false\) return false;/);
  assert.match(seed, /if \(settings\.listMode === 'whitelist'\) return true;/);
  assert.match(seed, /return hasEnabledContentFilters\(settings\) \|\| hasActiveJsonFilterRules\(settings\);/);
  assert.match(seed, /Passing through \$\{dataName\} before JSON parse \(no active JSON work\)/);
  assert.match(seed, /settings\.contentFilters\.duration\?\.enabled === true/);
  assert.match(seed, /hasList\(settings\.filterKeywordsComments\)/);
  assert.match(seed, /if \(mode !== 'whitelist' && !activeContentFilters && !activeJsonFilterRules\)/);
  assert.match(seed, /window\.FilterTubeEngine\.harvestOnly\(data, cachedSettings \|\| \{ filterChannels: \[\], filterKeywords: \[\] \}\);/);
  assert.match(seed, /const result = window\.FilterTubeEngine\.processData\(data, cachedSettings, dataName\);/);
  assert.match(seed, /const originalFetch = window\.fetch;/);
  assert.match(seed, /return response\.clone\(\)\.json\(\)\.then\(jsonData => \{/);
  assert.match(seed, /const originalOpen = proto\.open;/);
  assert.match(seed, /Object\.defineProperty\(xhr, 'responseText'/);

  const injector = source('js/injector.js');
  assert.match(injector, /function hasNetworkJsonWork\(settings\)/);
  assert.match(injector, /if \(!settings \|\| settings\.enabled === false\) return false;/);
  assert.match(injector, /if \(settings\.listMode === 'whitelist'\) return true;/);
  assert.match(injector, /function processDataWithFilterLogic\(data, dataName\)/);
  assert.match(injector, /No active JSON work for \$\{dataName\}; passing through injector hook/);
  assert.match(injector, /function processInitialDataQueue\(\)/);
  assert.match(injector, /initialDataQueue = \[\];/);

  const domHelpers = source('js/content/dom_helpers.js');
  assert.match(domHelpers, /style\.id = 'filtertube-style';/);
  assert.match(domHelpers, /\.filtertube-hidden \{ display: none !important; \}/);
  assert.match(domHelpers, /wasAlreadyHidden && wasWhitelistPending && !skipStats/);
  assert.match(domHelpers, /element\.style\.setProperty\('display', 'none', 'important'\);/);
  assert.match(domHelpers, /handleMediaPlayback\(element, true\);/);
  assert.match(domHelpers, /handleMediaPlayback\(element, false\);/);
  assert.match(domHelpers, /const children = container\.querySelectorAll\(childSelector\);/);
  assert.match(domHelpers, /container\.classList\.remove\('filtertube-hidden-shelf'\);/);
  assert.match(methodSemanticGapDoc, /visual hide\/stats\/media policy approved for behavior change: NO-GO/);
  assert.match(methodSemanticGapDoc, /container restore authority approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /collaborator writer-side guard proof status: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(methodSemanticGapDoc, /collaborator action-layer patch approval: NO-GO/);
  assert.match(methodSemanticGapDoc, /collaborator installed-tab parity authority: NO-GO/);

  const bridgeSettings = source('js/content/bridge_settings.js');
  assert.match(bridgeSettings, /pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess \|\| shouldForceReprocess;/);
  assert.match(bridgeSettings, /const forcePendingReprocess = pendingStorageRefreshForceReprocess === true;/);
  assert.match(bridgeSettings, /applyDOMFallback\(result\.settings, \{ forceReprocess: forcePendingReprocess \}\);/);

  const background = source('js/background.js');
  assert.match(background, /Main profile blocklist keywords are written by the dashboard\/popup under\s+\/\/ `keywords`;/);
  assert.match(background, /const mainKeywords = Array\.isArray\(activeMain\.keywords\)\s+\? activeMain\.keywords\s+: \(Array\.isArray\(activeMain\.blockedKeywords\) \? activeMain\.blockedKeywords : null\);/);
  assert.match(background, /const shouldCopyBlocklist = request\?\.copyBlocklist === true;/);
  assert.match(background, /if \(requestedMode === 'whitelist'\) \{\s+mergeAndClearBlocklistIntoWhitelist\(requestedProfile\);/);
  assert.match(background, /handleAddFilteredChannel\([\s\S]*\{ source: 'user' \}[\s\S]*'main'[\s\S]*'whitelist'/);
  assert.match(background, /\} else if \(request\.action === "addChannelPersistent"\) \{/);
  assert.match(background, /if \(message\.type === 'addFilteredChannel'\) \{/);
  assert.match(background, /async function handleAddFilteredChannel\(input, filterAll = false/);
  assert.match(background, /const targetListType = listType === 'whitelist' \? 'whitelist' : 'blocklist';/);
  assert.match(background, /storageWritePayload\[FT_PROFILES_V4_KEY\] = \{/);
  assert.match(background, /compiledSettingsCache\.main = null;\s+compiledSettingsCache\.kids = null;/);
  assert.match(background, /let compiledSettingsCache = \{ main: null, kids: null \};/);
  assert.match(background, /if \(!forceRefresh && compiledSettingsCache\[targetProfile\]\) \{\s+return compiledSettingsCache\[targetProfile\];/);
  assert.match(background, /compiledSettingsCache\[targetProfile\] = compiledSettings;/);
  assert.match(background, /if \(compiledSettingsCache\[profileType\] && !request\.forceRefresh\) \{\s+sendResponse\(compiledSettingsCache\[profileType\]\);/);
  assert.match(background, /function enqueueChannelMapUpdate\(key, value\) \{[\s\S]*compiledSettingsCache\.main\.channelMap = channelMapCache \|\| compiledSettingsCache\.main\.channelMap;[\s\S]*scheduleChannelMapFlush\(\);/);
  assert.match(background, /function enqueueVideoChannelMapUpdate\(videoId, channelId\) \{[\s\S]*compiledSettingsCache\.main\.videoChannelMap = \{[\s\S]*scheduleVideoChannelMapFlush\(\);/);
  assert.match(background, /function enqueueVideoMetaMapUpdate\(videoId, meta\) \{[\s\S]*compiledSettingsCache\.main\.videoMetaMap = videoMetaMapCache \|\| compiledSettingsCache\.main\.videoMetaMap;[\s\S]*scheduleVideoMetaMapFlush\(\);/);
  assert.match(background, /action === 'FilterTube_SetListMode'[\s\S]*compiledSettingsCache\.main = null;[\s\S]*sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_RefreshNow' \}\)/);
  assert.match(background, /action === 'FilterTube_BatchImportWhitelistChannels'[\s\S]*compiledSettingsCache\.main = null;[\s\S]*sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_RefreshNow' \}\)/);
  assert.match(background, /action === 'FilterTube_TransferWhitelistToBlocklist'[\s\S]*compiledSettingsCache\.main = null;[\s\S]*sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_RefreshNow' \}\)/);
  assert.match(background, /request\.action === "FilterTube_ApplySettings" && request\.settings[\s\S]*compiledSettingsCache\[targetProfile\] = null;[\s\S]*getCompiledSettings\(syntheticSender, targetProfile, true\)[\s\S]*sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\)/);
  assert.doesNotMatch(background, /compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings/);
  assert.match(background, /request\.action === "updateChannelMap"[\s\S]*enqueueChannelMapMappings\(request\.mappings\);/);
  assert.match(background, /request\.action === "updateVideoChannelMap"[\s\S]*enqueueVideoChannelMapUpdate\(request\.videoId, request\.channelId\);/);
  assert.match(background, /request\.action === "updateVideoMetaMap"[\s\S]*enqueueVideoMetaMapUpdate\(videoId, entry\);/);
  assert.match(background, /browserAPI\.storage\.onChanged\.addListener\(\(changes, area\) => \{[\s\S]*const relevantKeys = \[[\s\S]*compiledSettingsCache\.main = null;[\s\S]*getCompiledSettings\(\{ url: 'https:\/\/www\.youtube\.com\/' \}\);/);
  assert.match(methodSemanticGapDoc, /background compiled-cache authority approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /background refresh delivery optimization approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /learned-map cache patching authority approved: NO-GO/);

  const contentBridge = source('js/content_bridge.js');
  assert.match(contentBridge, /function needsIdentityPrefetchWork\(settings\)/);
  assert.match(contentBridge, /return bridgeHasList\(settings\.filterChannels\);/);
  assert.match(contentBridge, /function needsMainWorldRuntimeWork\(settings\)/);
  assert.match(contentBridge, /return hasBridgeEnabledContentFilters\(settings\) \|\| hasBridgeActiveJsonFilterRules\(settings\);/);
  assert.match(contentBridge, /async function ensureMainWorldRuntimeForSettings\(settings\)/);
  assert.match(contentBridge, /if \(!needsMainWorldRuntimeWork\(settings\)\) return false;/);
  assert.match(contentBridge, /const tokens = normalizedText\.split\(\/\\s\*\(\?:,\|\\band\\b\)\\s\*\/i\);/);
  assert.doesNotMatch(contentBridge, /const tokens = normalizedText\.split\(\/[^/]*&/);
  assert.match(contentBridge, /dropdown\.removeAttribute\('data-filtertube-force-hidden'\);/);
  assert.match(contentBridge.replace(/\s+/g, ' '), /closeTarget\?\.removeAttribute\?\.\('data-filtertube-force-hidden'\);/);
  assert.match(contentBridge, /function cleanupDropdownState\(dropdown\)/);
  assert.match(contentBridge, /pendingDropdownFetches\.delete\(dropdown\);/);
  assert.match(contentBridge, /return dropdown\.closest\('tp-yt-iron-dropdown'\) \|\| dropdown;/);
  assert.match(contentBridge, /const isFilterTubeOwnedPopover = Boolean\(dropdown\.matches\?\.\('\.filtertube-playlist-menu-fallback-popover'\)\);/);
  assert.match(contentBridge, /function renderFilterTubeMenuEntries\(\{ dropdown, newMenuList, oldMenuList, channelInfo, videoCard, placeholder = false \}\)/);
  assert.match(contentBridge, /clearMultiStepStateForDropdown\(dropdown\);/);
  assert.doesNotMatch(contentBridge, /setupMultiStepMenu\(dropdown, groupId, collaborators\.slice\(0, collaboratorCount\), blockAllMenuItem\);/);
  assert.match(contentBridge, /isBlockAllOption: true,[\s\S]*allCollaborators: collaborators\.slice\(0, collaboratorCount\)/);
  assert.match(contentBridge, /window\.FilterTube_prefetchCollaboratorsForCard = prefetchCollaboratorsForCard;/);
  assert.match(contentBridge, /async function injectFilterTubeMenuItem\(dropdown, videoCard\)/);
  assert.match(contentBridge, /if \(currentSettings\?\.listMode === 'whitelist'\) return;/);
  assert.match(contentBridge, /if \(currentSettings\?\.showBlockMenuItem === false\) \{/);
  assert.match(contentBridge, /const isDropdownOpen = \(\) => \{/);
  assert.match(contentBridge, /closeObserver\.observe\(dropdown, \{ attributes: true, attributeFilter: \['style', 'aria-hidden', 'hidden'\] \}\);/);
  assert.match(contentBridge, /function getValidatedCachedCollaborators\(card\)/);
  assert.match(contentBridge, /const cachedCollaborators = getCachedCollaboratorsFromCard\(card\);/);
  assert.match(contentBridge, /isAmpersandTopicNameOnlyCollaboratorState\(card, cachedCollaborators\)/);
  assert.match(contentBridge, /clearAmpersandTopicCollaboratorState\(card, currentVideoId\);/);
  assert.match(contentBridge, /card\.setAttribute\('data-filtertube-collaborators-source', sourceLabel\);/);
  assert.match(contentBridge, /card\.setAttribute\('data-filtertube-collaborators-ts', String\(timestamp\)\);/);
  assert.match(contentBridge, /function applyCollaboratorsByVideoId\(videoId, collaborators, options = \{\}\)/);
  assert.match(contentBridge, /card\.setAttribute\('data-filtertube-collaborators', serialized\);/);
  assert.match(contentBridge, /if \(cacheVideoId && !resolvedCollaboratorsByVideoId\.has\(cacheVideoId\)\) \{/);
  const addChannelDirectlyBlock = contentBridge.slice(
    contentBridge.indexOf('async function addChannelDirectly(input, filterAll = false'),
    contentBridge.indexOf('function addFilterAllContentCheckbox(menuItem, channelData)')
  );
  assert.match(addChannelDirectlyBlock, /type: 'addFilteredChannel'/);
  assert.match(addChannelDirectlyBlock, /profile,/);
  assert.match(addChannelDirectlyBlock, /FilterTube_ScheduleAutoBackup/);
  assert.doesNotMatch(addChannelDirectlyBlock, /listType|listTarget|whitelistChannels|filterChannels/);
  assert.match(methodSemanticGapDoc, /collaborator cache provenance validation approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /collaborator stale-state invalidation approved: PARTIAL_FOR_NAME_ONLY_AMPERSAND_TOPIC/);

  const blockChannel = source('js/content/block_channel.js');
  assert.match(blockChannel, /if \(!isQuickBlockEnabled\(\)\) return;/);
  assert.match(blockChannel, /if \(!shouldRefreshQuickBlockRuntimeState\(\)\) return;/);
  assert.match(blockChannel, /while \(depth < 8\)/);
  assert.match(blockChannel, /function shouldRefreshQuickBlockRuntimeState\(\) \{\s+pruneQuickBlockViewportHosts\(\);\s+return shouldEagerQuickBlockSweep\(\) \|\| quickBlockViewportHosts\.size > 0;/);
  assert.match(blockChannel, /function refreshQuickBlockAvailability\(options = \{\}\) \{\s+if \(!isQuickBlockEnabled\(\)\) \{\s+cancelQuickBlockHoverIntent\(\);\s+removeQuickBlockButtons\(\);/);
  assert.match(blockChannel, /function scheduleQuickBlockHoverIntent\(card, event\) \{[\s\S]*const delayMs = isMobile \? 0 : QUICK_BLOCK_DESKTOP_HOVER_INTENT_MS;[\s\S]*armQuickBlockPointerRecovery\(\);[\s\S]*ensureQuickBlockButton\(targetCard\);/);
  assert.match(blockChannel, /function isShortsQuickBlockCard\(card\) \{[\s\S]*ytm-shorts-lockup-view-model-v2[\s\S]*\.shortsLockupViewModelHost[\s\S]*a\[href\*="\/shorts\/"\]/);
  assert.match(blockChannel, /function resolveQuickBlockHost\(node\) \{[\s\S]*shortsNode\.closest\?\.\('ytd-rich-item-renderer'\)[\s\S]*yt-lockup-view-model, ytm-lockup-view-model/);
  assert.match(blockChannel, /function resolveQuickBlockAnchor\(hostCard\) \{[\s\S]*const preferred = \[[\s\S]*'\.shortsLockupViewModelHost'[\s\S]*if \(isRenderableQuickBlockAnchor\(candidate\)\) \{/);
  assert.match(blockChannel, /function findQuickBlockCardFromTarget\(target, maxDepth = 18\) \{[\s\S]*const closestCard = target\.closest\?\.\(QUICK_BLOCK_CARD_SELECTORS\);[\s\S]*while \(node && node instanceof Element && depth < maxDepth\)/);
  assert.match(blockChannel, /const isQuickBlockEnabled = \(\) => \{[\s\S]*currentSettings\.showQuickBlockButton !== true[\s\S]*currentSettings\.listMode === 'whitelist'[\s\S]*return true;/);
  assert.match(blockChannel, /function shouldEagerQuickBlockSweep\(\) \{\s+return isMobileYouTubeSurface\(\);/);
  assert.match(blockChannel, /function removeQuickBlockButtons\(\) \{\s+quickBlockViewportHosts\.clear\(\);[\s\S]*document\.querySelectorAll\('\.filtertube-quick-block-wrap'\)/);
  assert.match(blockChannel, /function buildQuickBlockContext\(videoCard\) \{[\s\S]*fetchStrategy: 'shorts'[\s\S]*currentSettings\?\.videoChannelMap\?\.\[videoId\]/);
  assert.match(blockChannel, /async function runQuickBlockFallback\(context, info, source = 'quickBlock'\) \{[\s\S]*addChannelDirectly\(input, false, otherChannels, targetGroup, metadata\)[\s\S]*type: 'addFilteredChannel'/);
  assert.match(blockChannel, /function applyQuickBlockImmediateHide\(videoCard, channelInfo\) \{[\s\S]*targetToHide\.style\.display = 'none';[\s\S]*targetToHide\.setAttribute\('data-filtertube-hidden', 'true'\);/);
  assert.match(blockChannel, /function ensureQuickBlockButton\(card\) \{[\s\S]*const hostCard = resolveOutermostShortsQuickBlockHost\(resolvedHostCard\);[\s\S]*if \(hostCard\.closest\(`\$\{FT_DROPDOWN_SELECTORS\}, ytd-menu-popup-renderer`\)\) return;[\s\S]*trigger\.textContent = '×';/);
  assert.match(blockChannel, /function scheduleQuickBlockSweep\(root = document\) \{[\s\S]*if \(quickBlockSweepTimer\) return;[\s\S]*\}, 80\);/);
  assert.match(blockChannel, /function setupQuickBlockObserver\(\) \{[\s\S]*document\.addEventListener\('pointerenter'[\s\S]*document\.addEventListener\('yt-navigate-finish'/);
  assert.match(blockChannel, /quickBlockPointerRecoveryArmer = \(\) => \{[\s\S]*document\.addEventListener\('pointermove', onPointerMove, \{ passive: true, capture: true \}\);[\s\S]*schedulePointerMoveRecoveryStop\(\);/);
  assert.match(blockChannel, /if \(shouldEagerQuickBlockSweep\(\)\) \{\s+const observer = new MutationObserver\(\(mutations\) => \{[\s\S]*observer\.observe\(document\.body, \{ childList: true, subtree: true \}\);/);
  assert.match(blockChannel, /const forceHidden = el\.getAttribute\('data-filtertube-force-hidden'\) === 'true';/);
  assert.match(blockChannel, /function setupMenuObserver\(\) \{/);
  assert.match(blockChannel, /function ensureDropdownVisibilityObserver\(dropdown\) \{/);
  assert.match(blockChannel, /obs\.observe\(dropdown, \{ attributes: true, attributeFilter: \['style', 'aria-hidden', 'hidden'\] \}\);/);
  assert.match(blockChannel, /const scheduleDropdownInjection = \(dropdown\) => \{/);
  assert.match(blockChannel, /if \(scheduledDropdownInjections\.has\(dropdown\) \|\| processingDropdowns\.has\(dropdown\)\) return;/);
  assert.match(blockChannel, /requestAnimationFrame\(\(\) => setTimeout\(run, 0\)\);/);
  assert.match(blockChannel, /const scanExistingDropdowns = \(\) => \{/);
  assert.ok(blockChannel.includes("if (!dropdown.querySelector?.('.filtertube-block-channel-item')) return;"));
  assert.match(blockChannel, /if \(target\?\.closest\?\.\(menuButtonSelector\)\) return;/);
  assert.match(blockChannel, /dropdownDiscoveryStopTimer = setTimeout\(stopDropdownDiscoveryObserver, 2500\);/);
  assert.match(blockChannel, /async function handleDropdownAppearedInternal\(dropdown\) \{/);
  assert.match(blockChannel, /injectedDropdowns\.set\(dropdown, \{ videoCardId, isProcessing: true, isComplete: false \}\);/);
  assert.match(methodSemanticGapDoc, /repo-wide behavior-change approval from method proof: NO-GO/);
  assert.match(methodSemanticGapDoc, /native dropdown lifecycle optimization approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /native reusable-node menu state authority approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /quick-block affordance availability optimization approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /quick-block selector\/anchor rewrite approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /quick-block mutation and optimistic-hide behavior change approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /shared JSON active-work predicate authority approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /JSON-first predicate merge optimization approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /JSON-first first-class runtime promotion approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /rule mutation persistence optimization approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /blocklist\/whitelist mutation authority approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /cross-context settings refresh authority approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /runtime behavior changed by this addendum: no/);

  const filterLogic = source('js/filter_logic.js');
  assert.match(filterLogic, /processData\(data, dataName = 'unknown'\) \{/);
  assert.match(filterLogic, /this\._harvestChannelData\(data\);/);
  assert.match(filterLogic, /if \(this\.settings\.enabled === false\) \{/);
  assert.match(filterLogic, /const filtered = this\.filter\(data\);/);

  const stateManager = source('js/state_manager.js');
  assert.match(stateManager, /async function addKeyword\(word, options = \{\}\) \{/);
  assert.match(stateManager, /if \(state\.mode === 'whitelist'\) \{/);
  assert.match(stateManager, /await persistMainProfiles\(\{\s+mode: 'whitelist',\s+whitelistChannels:/);
  assert.match(stateManager, /await saveSettings\(\);/);
  assert.match(stateManager, /async function persistMainProfiles\(nextMain\) \{/);
  assert.match(stateManager, /out\.blockedKeywords = out\.keywords;/);
  assert.match(stateManager, /const action = state\.mode === 'whitelist' \? 'addWhitelistChannelPersistent' : 'addChannelPersistent';/);
  assert.match(stateManager, /action: 'FilterTube_BatchImportWhitelistChannels'/);
  assert.match(stateManager, /if \(latestProfileContext\.activeId !== targetProfileId\) \{/);

  const settingsShared = source('js/settings_shared.js');
  assert.match(settingsShared, /function loadSettings\(\) \{/);
  assert.match(settingsShared, /STORAGE_NAMESPACE\?\.set\(\{ \[FT_PROFILES_V4_KEY\]: nextProfilesV4 \}/);
  assert.match(settingsShared, /if \(needsWrite\) \{/);
  assert.match(settingsShared, /function saveSettings\(options = \{\}\) \{/);
  assert.match(settingsShared, /uiKeywords: sanitizedKeywords/);
  assert.match(settingsShared, /nextMainProfile\.blockedKeywords = sanitizedKeywords;/);
  assert.match(settingsShared, /payload\[FT_PROFILES_V4_KEY\] = nextProfilesV4;/);
  assert.match(settingsShared, /STORAGE_NAMESPACE\?\.set\(payload, \(\) => \{/);

  const ioManager = source('js/io_manager.js');
  assert.match(ioManager, /async function importV3\(json, \{ strategy = 'merge', scope = 'auto', auth = null, targetProfileId = null \} = \{\}\) \{/);
  assert.match(ioManager, /const result = shouldImportIntoSeparateProfile[\s\S]*: await SettingsAPI\.saveSettings\(payload\);/);
  assert.match(ioManager, /await saveProfilesV3\(nextProfiles\);/);
  assert.match(ioManager, /await saveProfilesV4\(\{/);
  assert.match(ioManager, /await writeStorage\(\{ channelMap: nextChannelMap \}\);/);
  assert.match(ioManager, /await writeStorage\(nanahPayload\);/);

  const domFallback = source('js/content/dom_fallback.js');
  assert.match(domFallback, /function hasActiveDOMFallbackWork\(settings\) \{/);
  assert.match(domFallback, /if \(listMode === 'whitelist'\) return true;/);
  assert.match(domFallback, /function clearStaleDOMFallbackVisibility\(\) \{/);
  assert.match(domFallback, /const hidden = document\.querySelectorAll\(hiddenSelector\);/);
  assert.match(domFallback, /async function applyDOMFallback\(settings, options = \{\}\) \{/);
  assert.match(domFallback, /if \(runState\.running\) \{\s+runState\.pending = true;/);
  assert.match(domFallback, /const hasActiveFallbackWork = hasActiveDOMFallbackWork\(effectiveSettings\);/);
  assert.match(domFallback, /clearStaleDOMFallbackVisibility\(\);\s+state\.lastCleanupTs = Date\.now\(\);/);
  assert.match(domFallback, /path === '\/feed\/channels'/);
  assert.match(domFallback, /const watchTargets = \[/);
  assert.match(domFallback, /const videoElements = \(onlyWhitelistPending && listMode === 'whitelist'\)/);
  assert.match(domFallback, /const alreadyProcessed = element\.hasAttribute\('data-filtertube-processed'\);/);
  assert.match(domFallback, /if \(alreadyProcessed && !forceReprocess && !contentChanged\) \{/);
  assert.match(domFallback, /const titleElement = element\.querySelector\(/);
  assert.match(domFallback, /const pendingTimerState = window\.__filtertubePendingMetaRecheck/);
  assert.match(domFallback, /applyDOMFallback\(null, \{ preserveScroll: true \}\);/);
  assert.match(domFallback, /Never hide the currently-selected playlist row/);
  assert.match(domFallback, /const shouldHideSelectedRow = shouldHide && \(hasExplicitBlockMarker \|\| \(hasActiveBlockRules && matchesFilters\)\);/);
  assert.match(domFallback, /setTimeout\(\(\) => applyDOMFallback\(runState\.latestSettings, runState\.latestOptions\), 0\);/);
  assert.match(methodSemanticGapDoc, /DOM fallback run admission optimization approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /DOM selector traversal narrowing approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /DOM fallback hide\/restore behavior change approved: NO-GO/);

  assert.match(contentBridge, /function schedulePrefetchScan\(\) \{/);
  assert.match(contentBridge, /if \(!needsIdentityPrefetchWork\(currentSettings\)\) return;/);
  assert.match(contentBridge, /requestAnimationFrame\(\(\) => \{\s+prefetchScanScheduled = false;\s+attachPrefetchObservers\(\);/);
  assert.match(contentBridge, /function attachPrefetchObservers\(\) \{/);
  assert.match(contentBridge, /const maxAttach = 120;/);
  assert.match(contentBridge, /prefetchObserver\.observe\(card\);/);
  assert.match(contentBridge, /function startCardPrefetchObserver\(\) \{/);
  assert.match(contentBridge, /prefetchObserver = new IntersectionObserver\(\(entries\) => \{/);
  assert.match(contentBridge, /document\.addEventListener\('visibilitychange', \(\) => \{/);
  assert.match(contentBridge, /function installPlaylistPanelPrefetchHook\(\) \{/);
  assert.match(contentBridge, /document\.addEventListener\('scroll', \(event\) => \{/);
  assert.match(contentBridge, /observer\.observe\(panel, \{ childList: true, subtree: true \}\);/);
  assert.match(contentBridge, /function installRightRailWhitelistObserver\(\) \{/);
  assert.match(contentBridge, /if \(currentSettings\?\.listMode !== 'whitelist'\) return;/);
  assert.match(contentBridge, /whitelistRefreshImmediateTimer = setTimeout\(\(\) => \{ whitelistRefreshImmediateTimer = 0; runWhitelistRefreshPass\(\); \}, 0\)/);
  assert.match(contentBridge, /whitelistRefreshFollowupTimer = setTimeout\(\(\) => \{ whitelistRefreshFollowupTimer = 0; runWhitelistRefreshPass\(\); \}, 120\)/);
  assert.match(contentBridge, /function refreshFilterTubeRuntimeObservers\(\) \{/);
  assert.match(contentBridge, /window\.FilterTube_refreshQuickBlockAvailability\(\{ force: true \}\);/);
  assert.match(contentBridge, /window\.FilterTube_refreshDOMFallbackObserver\(\);/);
  assert.match(contentBridge, /function scheduleVideoMetaDomRerun\(\) \{/);
  assert.match(contentBridge, /clearTimeout\(pendingVideoMetaDomRerunTimer\);/);
  assert.match(contentBridge, /pendingVideoMetaDomRerunTimer = setTimeout\(\(\) => \{/);
  assert.match(contentBridge, /async function initializeDOMFallback\(settings\) \{/);
  assert.match(contentBridge, /await new Promise\(resolve => setTimeout\(resolve, 1000\)\);/);
  assert.match(contentBridge, /function scheduleWhitelistPendingRecheck\(delayMs = 120\) \{/);
  assert.match(contentBridge, /applyDOMFallback\(null, \{ preserveScroll: true, onlyWhitelistPending: true \}\);/);
  assert.match(contentBridge, /function queueWhitelistPendingHide\(mutations, delayMs = 40\) \{/);
  assert.match(contentBridge, /WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT = 160/);
  assert.match(contentBridge, /whitelistPendingRefreshState\.pendingHideTimer = setTimeout\(\(\) => \{/);
  assert.match(contentBridge, /function refreshDOMFallbackMutationObserver\(\) \{/);
  assert.match(contentBridge, /disconnectFallbackMutationObserver\(\);/);
  assert.match(contentBridge, /window\.FilterTube_refreshDOMFallbackObserver = refreshDOMFallbackMutationObserver;/);
  assert.match(contentBridge, /function ensureFallbackMenuButtons\(\) \{/);
  assert.match(contentBridge, /const observer = new MutationObserver\(\(mutations\) => \{/);
  assert.match(contentBridge, /const warmupTimer = setInterval\(\(\) => \{/);
  assert.match(contentBridge, /window\.addEventListener\('message', handleMainWorldMessages, false\);/);
  assert.match(contentBridge, /setTimeout\(\(\) => initialize\(\), 50\);/);
  assert.match(methodSemanticGapDoc, /content-bridge lifecycle pruning approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /content-bridge observer\/listener\/timer cleanup approved: NO-GO/);
  assert.match(methodSemanticGapDoc, /content-bridge prefetch\/whitelist pending budget authority approved: NO-GO/);

  assert.match(releaseFixStatusDoc, /## Release Behavior Change Flow - 2026-05-27/);
  assert.match(releaseFixStatusDoc, /Before May 5[\s\S]*May 5-11 whitelist \+ JSON-first work[\s\S]*May 26 release-lag fix batch[\s\S]*May 27 proof refresh[\s\S]*May 29 Topic menu guard/);
  assert.match(releaseFixStatusDoc, /```mermaid\nflowchart TD/);
  assert.match(releaseFixStatusDoc, /May 29 Topic menu guard for stale ampersand Topic collaborator state/);
  assert.match(releaseFixStatusDoc, /Manual installed-extension Chrome validation remains the release gate/);
  assert.match(releaseFixStatusDoc, /2026-05-25[\s\S]*Whitelist pending-hide intake/);
  assert.match(releaseFixStatusDoc, /2026-05-26[\s\S]*Release lag\/menu\/quick-block fix batch/);
  assert.match(releaseFixStatusDoc, /2026-05-27[\s\S]*Proof refresh/);
  assert.match(releaseFixStatusDoc, /2026-05-29[\s\S]*Topic menu guard[\s\S]*Kully B & Gussy G - Topic/);
  assert.match(releaseFixStatusDoc, /contentBridgeAmpersandTopicSingleChannelMenuGuard\(\)/);
  assert.match(releaseFixStatusDoc, /clears stale same-video\s+collaborator-shaped Topic state/);
  assert.match(releaseFixStatusDoc, /without\s+changing blocklist, whitelist, direct-add payload, optimistic-hide, or true\s+collaborator menu behavior/);
  assert.match(releaseFixStatusDoc, /Documentation Ledger Confirmation - 2026-05-28/);
  assert.match(releaseFixStatusDoc, /May 28: audit-only continuation for content\/category active-work/);
  assert.match(releaseFixStatusDoc, /Callable Count Reconciliation - 2026-05-28/);
  assert.match(releaseFixStatusDoc, /current method semantic proof\s+gap index, which records `5,789` lexical callables/);
  assert.match(releaseFixStatusDoc, /stale older counts in prior ledgers/);
  assert.match(releaseFixStatusDoc, /full runtime verifier after reconciliation: pass, 0 fail/);

  const releaseRegressionDoc = fs.readFileSync(
    path.join(repoRoot, 'docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md'),
    'utf8'
  );
  assert.match(releaseRegressionDoc, /2026-05-28 Documentation Ledger Confirmation/);
  assert.match(releaseRegressionDoc, /content-filter validity, route\/surface, and value-normalization gaps pinned/);
  assert.match(releaseRegressionDoc, /callable proof gap ledgers reconciled to 5,789 lexical callables/);
  assert.match(releaseRegressionDoc, /Callable proof gap count reconciliation/);
  assert.match(releaseRegressionDoc, /```mermaid\nflowchart TD/);
});
