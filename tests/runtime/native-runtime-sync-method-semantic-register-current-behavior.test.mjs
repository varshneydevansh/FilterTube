import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const appRoot = path.resolve(repoRoot, '..', 'FilterTubeApp');
const docPath = 'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const wrapperPath = 'scripts/sync-native-runtime.mjs';
const packagePath = 'package.json';
const buildPath = 'build.js';
const appSyncScriptPath = path.join(appRoot, 'tools', 'sync-runtime-from-extension.mjs');
const appManifestPath = path.join(appRoot, 'tools', 'runtime-sync-manifest.json');

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readAbs(file) {
  return fs.readFileSync(file, 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function readJsonAbs(file) {
  return JSON.parse(readAbs(file));
}

function git(cwd, args) {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
}

function doc() {
  return read(docPath);
}

function sourceLineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function count(text, regex) {
  return [...text.matchAll(regex)].length;
}

function countLiteral(text, token) {
  return text.split(token).length - 1;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function sha256Abs(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lineNumberForToken(source, token) {
  const lines = source.split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(token));
  assert.notEqual(index, -1, `missing token ${token}`);
  return index + 1;
}

function phaseRows() {
  const source = read(wrapperPath);
  return [
    {
      file: wrapperPath,
      line: lineNumberForToken(source, 'const publicRepoRoot = process.cwd();'),
      kind: 'scriptPhase',
      phase: 'publicRepoRootAndAppPathResolution',
      group: 'nativeSyncWrapperPathResolution'
    },
    {
      file: wrapperPath,
      line: lineNumberForToken(source, 'if (!fs.existsSync(syncScript))'),
      kind: 'scriptPhase',
      phase: 'syncScriptExistenceGate',
      group: 'nativeSyncWrapperExistenceGate'
    },
    {
      file: wrapperPath,
      line: lineNumberForToken(source, 'const result = spawnSync(process.execPath'),
      kind: 'scriptPhase',
      phase: 'syncProcessDelegation',
      group: 'nativeSyncWrapperProcessDelegation'
    },
    {
      file: wrapperPath,
      line: lineNumberForToken(source, 'if (result.error)'),
      kind: 'scriptPhase',
      phase: 'syncErrorAndStatusPropagation',
      group: 'nativeSyncWrapperStatusPropagation'
    }
  ];
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function runtimeBundleOrder() {
  const source = readAbs(appSyncScriptPath);
  const match = source.match(/const runtimeBundleOrder = \[([\s\S]*?)\];/);
  assert.ok(match, 'app sync script should define runtimeBundleOrder');
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

function manifestShapeStats() {
  const manifest = readJsonAbs(appManifestPath);
  const countByRoot = (field) => {
    const out = {};
    for (const entry of manifest) {
      const root = String(entry[field] || '').split('/')[0] || '(root)';
      out[root] = (out[root] || 0) + 1;
    }
    return out;
  };
  return {
    keys: [...new Set(manifest.flatMap((entry) => Object.keys(entry)))].sort(),
    sourceRoots: countByRoot('source'),
    destinationRoots: countByRoot('destination')
  };
}

function assertNativeSyncFreshnessFlow() {
  const text = doc();
  const sourceStatusRows = git(repoRoot, ['status', '--short']).split('\n').filter(Boolean);
  const appStatusRows = git(appRoot, ['status', '--short']).split('\n').filter(Boolean);
  const manifestStats = manifestShapeStats();

  assert.match(text, /## Native Sync Freshness Flow - 2026-05-27/);
  assert.match(text, /npm run sync:native-runtime/);
  assert.match(text, /node scripts\/sync-native-runtime\.mjs/);
  assert.match(text, /resolve FILTERTUBE_APP_REPO or \.\.\/FilterTubeApp/);
  assert.match(text, /spawn same Node executable inside app repo/);
  assert.match(text, /app-side sync script reads runtime-sync-manifest\.json/);
  assert.match(text, /public wrapper only propagates process status/);
  assert.match(text, /flowchart TD/);
  assert.match(text, /native freshness still needs manifest\/hash\/release report/);

  assert.ok(text.includes(`public repo path: ${repoRoot}`));
  assert.ok(text.includes(`public repo HEAD: ${git(repoRoot, ['rev-parse', 'HEAD'])}`));
  assert.ok(text.includes(`public repo dirty status rows: ${sourceStatusRows.length}`));
  assert.ok(text.includes(`public repo has docs/audit untracked row: ${sourceStatusRows.some((row) => row === '?? docs/audit/') ? 'yes' : 'no'}`));
  assert.ok(text.includes(`public repo has tests untracked row: ${sourceStatusRows.some((row) => row === '?? tests/') ? 'yes' : 'no'}`));
  assert.ok(text.includes(`app repo path: ${appRoot}`));
  assert.ok(text.includes(`app repo branch: ${git(appRoot, ['rev-parse', '--abbrev-ref', 'HEAD'])}`));
  assert.ok(text.includes(`app repo HEAD: ${git(appRoot, ['rev-parse', 'HEAD'])}`));
  const appDirtySnapshot = text.match(/app repo dirty status rows observed in snapshot: (\d+)/);
  assert.ok(appDirtySnapshot, 'missing app repo dirty status snapshot');
  assert.ok(Number(appDirtySnapshot[1]) <= appStatusRows.length, 'app dirty snapshot should not exceed current dirty rows');

  const currentDirtyFiles = new Set(appStatusRows.map((row) => row.replace(/^[ MADRCU?!]{1,2}\s+/, '')));
  const documentedDirtyFiles = [...text.matchAll(/^app dirty file: (.+)$/gm)].map((match) => match[1]);
  assert.ok(documentedDirtyFiles.length > 0, 'missing documented app dirty file snapshot');
  for (const dirtyFile of documentedDirtyFiles) {
    assert.ok(currentDirtyFiles.has(dirtyFile), `documented app dirty file is no longer dirty: ${dirtyFile}`);
  }

  assert.ok(text.includes(`manifest keys: ${manifestStats.keys.join(', ')}`));
  assert.ok(text.includes(`manifest source root js entries: ${manifestStats.sourceRoots.js}`));
  assert.ok(text.includes(`manifest destination root apps entries: ${manifestStats.destinationRoots.apps}`));
  assert.ok(text.includes(`manifest destination root packages entries: ${manifestStats.destinationRoots.packages}`));

  for (const token of [
    'manifest destinationKind release gate: absent',
    'pre/post sync hash ledger: absent',
    'native release freshness proof: NO-GO',
    'The current state is useful evidence, but it is not release authority.',
    'which public source revision each app output came from',
    'packaged assets are',
    'ready to ship'
  ]) {
    assert.ok(text.includes(token), `missing native sync freshness token ${token}`);
  }
}

test('native runtime sync method register is audit-only and source scoped', () => {
  const text = doc();
  const wrapper = read(wrapperPath);

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime, build, package, and\s+native app sync behavior are unchanged/);
  assert.match(text, /scripts\/sync-native-runtime\.mjs/);
  assert.match(text, /package\.json/);
  assert.match(text, /FilterTubeApp\/tools\/sync-runtime-from-extension\.mjs/);
  assert.equal(sourceLineCount(wrapper), 34);
  assert.equal(fs.statSync(path.join(repoRoot, wrapperPath)).size, 1070);
  assert.match(text, /public wrapper line count: 34/);
  assert.match(text, /public wrapper bytes: 1070/);
  assert.match(text, new RegExp(`public wrapper sha256: ${sha256(wrapperPath)}`));
  assert.match(text, /package line count: 46/);
  assert.match(text, /package bytes: 1376/);
  assert.match(text, new RegExp(`package sha256: ${sha256(packagePath)}`));
  assert.match(text, /runtime behavior changed: no/);
  assert.doesNotMatch(wrapper, /nativeSyncWrapperMethodAuthority/);
});

test('native runtime sync method register accounts for every public wrapper phase row', () => {
  const text = doc();
  const rows = phaseRows();

  assert.equal(rows.length, 4);
  assert.deepEqual(countBy(rows, 'kind'), {
    scriptPhase: 4
  });
  assert.deepEqual(countBy(rows, 'group'), {
    nativeSyncWrapperExistenceGate: 1,
    nativeSyncWrapperPathResolution: 1,
    nativeSyncWrapperProcessDelegation: 1,
    nativeSyncWrapperStatusPropagation: 1
  });

  for (const row of rows) {
    assert.ok(
      text.includes(`| \`${row.file}\` | ${row.line} | \`${row.kind}\` | \`${row.phase}\` | \`${row.group}\` |`),
      `missing native sync wrapper phase row ${row.file}:${row.kind}:${row.phase}:${row.line}`
    );
  }
});

test('native runtime sync method register pins wrapper counts and delegation behavior', () => {
  const text = doc();
  const wrapper = read(wrapperPath);
  const packageJson = readJson(packagePath);
  const build = read(buildPath);
  const countPairs = [
    ['script-level semantic phases', phaseRows().length],
    ['named method declarations in public wrapper', 0],
    ['plain function declarations in public wrapper', count(wrapper, /(^|\n)function\s+[A-Za-z_$][\w$]*\s*\(/g)],
    ['async function declarations in public wrapper', count(wrapper, /(^|\n)async function\s+[A-Za-z_$][\w$]*\s*\(/g)],
    ['arrow token sites in public wrapper', count(wrapper, /=>/g)],
    ['import declarations in public wrapper', count(wrapper, /^import\s/gm)],
    ['const declarations in public wrapper', count(wrapper, /\bconst\s+[A-Za-z_$][\w$]*/g)],
    ['path.resolve occurrences in public wrapper', count(wrapper, /path\.resolve/g)],
    ['path.join occurrences in public wrapper', count(wrapper, /path\.join/g)],
    ['fs.existsSync occurrences in public wrapper', count(wrapper, /fs\.existsSync/g)],
    ['spawnSync token occurrences in public wrapper', count(wrapper, /spawnSync/g)],
    ['spawnSync call sites in public wrapper', count(wrapper, /\bspawnSync\(/g)],
    ['process.exit calls in public wrapper', count(wrapper, /process\.exit\(/g)],
    ['process.exitCode occurrences in public wrapper', count(wrapper, /process\.exitCode/g)],
    ['console.error calls in public wrapper', count(wrapper, /console\.error/g)],
    ['console.log calls in public wrapper', count(wrapper, /console\.log/g)],
    ['process.env occurrences in public wrapper', count(wrapper, /process\.env/g)],
    ['process.cwd occurrences in public wrapper', count(wrapper, /process\.cwd/g)],
    ['process.execPath occurrences in public wrapper', count(wrapper, /process\.execPath/g)],
    ['stdio inherit occurrences in public wrapper', count(wrapper, /stdio:\s*["']inherit["']/g)],
    ['runtime-sync-manifest literal occurrences in public wrapper', countLiteral(wrapper, 'runtime-sync-manifest.json')],
    ['addEventListener calls in public wrapper', count(wrapper, /addEventListener/g)],
    ['removeEventListener calls in public wrapper', count(wrapper, /removeEventListener/g)],
    ['setTimeout calls in public wrapper', count(wrapper, /setTimeout/g)],
    ['setInterval calls in public wrapper', count(wrapper, /setInterval/g)],
    ['requestAnimationFrame calls in public wrapper', count(wrapper, /requestAnimationFrame/g)],
    ['MutationObserver references in public wrapper', count(wrapper, /MutationObserver/g)],
    ['fetch calls in public wrapper', count(wrapper, /\bfetch\b/g)],
    ['write/copy/rm file mutation calls in public wrapper', count(wrapper, /\b(?:writeFile|copyFile|rmSync)\b/g)]
  ];

  for (const [label, value] of countPairs) {
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${value}`));
  }

  assert.equal(packageJson.scripts['sync:native-runtime'], 'node scripts/sync-native-runtime.mjs');
  assert.equal(packageJson.scripts.build, 'node build.js');
  assert.equal(packageJson.scripts['build:chrome'], 'node build.js chrome');
  assert.doesNotMatch(build, /sync-native-runtime/);

  for (const token of [
    'process.cwd()',
    'process.env.FILTERTUBE_APP_REPO',
    'path.resolve(publicRepoRoot, "..", "FilterTubeApp")',
    'path.join(appRepo, "tools", "sync-runtime-from-extension.mjs")',
    'fs.existsSync(syncScript)',
    'process.exit(1)',
    'spawnSync(process.execPath, [syncScript]',
    'cwd: appRepo',
    '...process.env',
    'stdio: "inherit"',
    'result.status ?? 1'
  ]) {
    assert.ok(wrapper.includes(token), `wrapper missing ${token}`);
  }
});

test('native runtime sync method register preserves sibling app script and manifest boundary', () => {
  const text = doc();
  const appScript = readAbs(appSyncScriptPath);
  const manifestText = readAbs(appManifestPath);
  const manifest = readJsonAbs(appManifestPath);
  const order = runtimeBundleOrder();

  assertNativeSyncFreshnessFlow();

  assert.equal(fs.existsSync(appSyncScriptPath), true);
  assert.equal(fs.existsSync(appManifestPath), true);
  assert.equal(sourceLineCount(appScript), 1758);
  assert.equal(fs.statSync(appSyncScriptPath).size, 76587);
  assert.equal(sourceLineCount(manifestText), 198);
  assert.equal(fs.statSync(appManifestPath).size, 8178);
  assert.match(text, /app sync script line count: 1758/);
  assert.match(text, /app sync script bytes: 76587/);
  assert.match(text, new RegExp(`app sync script sha256: ${sha256Abs(appSyncScriptPath)}`));
  assert.match(text, /manifest line count: 198/);
  assert.match(text, /manifest bytes: 8178/);
  assert.match(text, new RegExp(`manifest sha256: ${sha256Abs(appManifestPath)}`));

  const countPairs = [
    ['plain function declarations in app sync script', count(appScript, /(^|\n)function\s+[A-Za-z_$][\w$]*\s*\(/g)],
    ['async function declarations in app sync script', count(appScript, /(^|\n)async function\s+[A-Za-z_$][\w$]*\s*\(/g)],
    ['total named function declarations in app sync script', count(appScript, /(^|\n)(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(/g)],
    ['runtimeBundleOrder entries in app sync script', order.length],
    ['runtime-sync-manifest literal occurrences in app sync script', countLiteral(appScript, 'runtime-sync-manifest.json')],
    ['fs.copyFile occurrences in app sync script', count(appScript, /fs\.copyFile/g)],
    ['fs.cp occurrences in app sync script', count(appScript, /fs\.cp/g)],
    ['fs.rm occurrences in app sync script', count(appScript, /fs\.rm/g)],
    ['fs.writeFile occurrences in app sync script', count(appScript, /fs\.writeFile/g)],
    ['fs.readFile occurrences in app sync script', count(appScript, /fs\.readFile/g)],
    ['fs.mkdir occurrences in app sync script', count(appScript, /fs\.mkdir/g)],
    ['FILTERTUBE_APP_RUNTIME_BUNDLE_START occurrences in app sync script', countLiteral(appScript, 'FILTERTUBE_APP_RUNTIME_BUNDLE_START')],
    ['js/layout.js literal occurrences in app sync script', countLiteral(appScript, 'js/layout.js')],
    ['manifest entries', manifest.length],
    ['manifest destinationKind fields present', manifest.filter((entry) => Object.hasOwn(entry, 'destinationKind')).length],
    ['manifest entries missing destinationKind', manifest.filter((entry) => !Object.hasOwn(entry, 'destinationKind')).length]
  ];

  for (const [label, value] of countPairs) {
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${value}`));
  }

  assert.equal(order.length, 15);
  assert.ok(order.includes('js/layout.js'));
  assert.equal(manifest.length, 28);
  assert.deepEqual([...new Set(manifest.map((entry) => entry.sourceRepo))], [repoRoot]);
  assert.equal(manifest.some((entry) => entry.source === 'js/layout.js'), true);
  assert.equal(manifest.some((entry) => entry.source === 'js/vendor/nanah.bundle.js'), true);
  assert.equal(manifest.some((entry) => entry.source === 'js/vendor/qrcode.bundle.js'), true);
  assert.equal(manifest.some((entry) => entry.source === 'data/release_notes.json'), false);
  assert.match(text, /manifest source repos: \/Users\/devanshvarshney\/FilterTube/);
  assert.match(text, /manifest includes js\/layout\.js: yes/);
  assert.match(text, /manifest includes js\/vendor\/nanah\.bundle\.js: yes/);
  assert.match(text, /manifest includes js\/vendor\/qrcode\.bundle\.js: yes/);
  assert.match(text, /manifest includes data\/release_notes\.json: no/);
});

test('native runtime sync method register lists future proof fields and missing authorities', () => {
  const text = doc();
  const productBoundary = [
    read(wrapperPath),
    read(packagePath),
    read(buildPath),
    readAbs(appSyncScriptPath),
    readAbs(appManifestPath)
  ].join('\n');

  for (const field of [
    'nativeSyncWrapperMethodReference',
    'sourceFile',
    'sourceLine',
    'semanticGroup',
    'packageScript',
    'syncCommand',
    'appRepoPath',
    'appRepoRevision',
    'appRepoDirtyState',
    'sourceRepoRevision',
    'sourceRepoDirtyState',
    'appSyncScriptPath',
    'appSyncScriptHash',
    'runtimeSyncManifestPath',
    'runtimeSyncManifestHash',
    'manifestEntryCount',
    'destinationKind',
    'sourcePath',
    'destinationPath',
    'preSyncHash',
    'postSyncHash',
    'generatedRuntimeHash',
    'rawCaptureAllowed',
    'spawnStatus',
    'spawnSignal',
    'stdoutStderrArtifact',
    'buildIntegration',
    'releaseGate',
    'positiveFixture',
    'negativeMissingAppFixture',
    'negativeDriftFixture',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  for (const token of [
    '## Complete-Proof Closure Review - 2026-05-30',
    'closure candidate: scripts/sync-native-runtime.mjs',
    'local wrapper phase proof status: present',
    'local wrapper phases covered: 4',
    'named callable declarations in public wrapper: 0',
    'runtime listeners/timers/observers/fetch in public wrapper: 0',
    'write/copy/remove mutations in public wrapper: 0',
    'complete per-callable file proof accepted: no',
    'complete per-callable file proof rejection: native app contract, app/source revision report, manifest hash report, pre/post sync hash ledger, missing-app negative fixture, drift negative fixture, status artifact, raw-capture exclusion report, and release freshness report are absent',
    'runtime behavior changed: no'
  ]) {
    assert.ok(text.includes(token), `missing closure review token ${token}`);
  }

  for (const token of [
    'nativeSyncWrapperMethodAuthority',
    'nativeSyncWrapperAppRepoContract',
    'nativeSyncWrapperAppRevisionReport',
    'nativeSyncWrapperManifestHashReport',
    'nativeSyncWrapperDestinationKindManifest',
    'nativeSyncWrapperBuildIntegrationGate',
    'nativeSyncWrapperReleaseFreshnessReport',
    'nativeSyncWrapperStatusContract',
    'nativeSyncWrapperFixtureProvenance',
    'nativeSyncWrapperRawCaptureExclusionReport',
    'nativeSyncWrapperDirtyStateReleaseGate',
    'nativeSyncWrapperPrePostHashLedger'
  ]) {
    assert.match(text, new RegExp(token));
    assert.doesNotMatch(productBoundary, new RegExp(token));
  }
});
