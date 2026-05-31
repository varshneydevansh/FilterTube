import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_RELEASE_NOTES_JSON_VERSION_GATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function sha256(textOrBuffer) {
  return crypto.createHash('sha256').update(textOrBuffer).digest('hex');
}

function count(source, regex) {
  return (source.match(regex) || []).length;
}

function sliceBetween(source, start, end, fromIndex = 0) {
  const startIndex = source.indexOf(start, fromIndex);
  assert.notEqual(startIndex, -1, `missing start marker ${start}`);
  const endIndex = source.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `missing end marker ${end}`);
  return source.slice(startIndex, endIndex).trimEnd();
}

function blockMetrics(text) {
  return {
    lines: text.split('\n').length,
    bytes: Buffer.byteLength(text),
    sha256: sha256(text),
  };
}

function doc() {
  return read(docPath);
}

const futureSymbols = [
  'releaseNotesJsonVersionGateContract',
  'releaseNotesJsonSchemaReport',
  'releaseNotesPackageVersionParityReport',
  'releaseNotesManifestVersionParityReport',
  'releaseNotesCurrentVersionEntryReport',
  'releaseNotesStagedEntryPolicy',
  'releaseNotesDetailsUrlPolicy',
  'releaseNotesRuntimeConsumerReport',
  'releaseNotesPromptSenderGate',
  'releaseNotesWhatsNewUrlPolicy',
  'releaseNotesDashboardRenderFixture',
  'releaseNotesNativeParityReport',
  'releaseNotesPublicClaimGate',
  'releaseNotesFirstClassJsonClaimGate',
];

test('release notes JSON version gate doc is audit-only and scoped to current behavior', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /first-class JSON filtering behavior changes/);
  assert.match(source, /not a\s+filter-engine JSON path/);
  assert.match(source, /same class of schema, version, runtime-consumer, and artifact-parity questions/);
  assert.match(source, /Implementation changes remain blocked/);
  assert.match(source, /does\s+not approve any first-class JSON filter expansion/);
});

test('release notes JSON data shape and package version boundary remain pinned', () => {
  const releaseBytes = fs.readFileSync(path.join(repoRoot, 'data/release_notes.json'));
  const releaseText = releaseBytes.toString('utf8');
  const releaseNotes = JSON.parse(releaseText);
  const versionRows = releaseNotes.filter((entry) => entry && typeof entry.version === 'string');
  const packageVersion = readJson('package.json').version;
  const keySet = [...new Set(releaseNotes.flatMap((entry) => Object.keys(entry)))].sort();

  assert.equal(releaseText.split('\n').length, 317);
  assert.equal(releaseBytes.length, 23039);
  assert.equal(sha256(releaseBytes), 'e012f6c071fffa67958f55544ecae9bbb26e7ec91edd2066df4d06a62de69962');
  assert.equal(releaseNotes.length, 24);
  assert.equal(releaseNotes.filter((entry) => entry._comment).length, 1);
  assert.equal(versionRows.length, 23);
  assert.deepEqual(keySet, ['_comment', 'bannerSummary', 'detailsUrl', 'headline', 'highlights', 'summary', 'version']);

  assert.equal(versionRows[0].version, '3.3.2');
  assert.equal(packageVersion, '3.3.1');
  assert.ok(versionRows.some((entry) => entry.version === packageVersion), 'current package version needs a release-note entry');
  assert.deepEqual(versionRows.filter((entry) => !entry.detailsUrl).map((entry) => entry.version), ['3.3.2']);
  assert.equal(versionRows.filter((entry) => /releases\/tag\//.test(entry.detailsUrl || '')).length, 19);
  assert.equal(versionRows.filter((entry) => /\/commit\//.test(entry.detailsUrl || '')).length, 3);
  assert.equal(versionRows.filter((entry) => typeof entry.bannerSummary === 'string' && entry.bannerSummary.trim()).length, 18);
  assert.equal(versionRows.filter((entry) => typeof entry.headline === 'string' && entry.headline.trim()).length, 23);
  assert.equal(versionRows.filter((entry) => typeof entry.summary === 'string' && entry.summary.trim()).length, 23);
  assert.ok(versionRows.every((entry) => Array.isArray(entry.highlights)), 'every version row needs highlights today');
  assert.equal(versionRows.reduce((total, entry) => total + entry.highlights.length, 0), 110);
  assert.equal(Math.min(...versionRows.map((entry) => entry.highlights.length)), 3);
  assert.equal(Math.max(...versionRows.map((entry) => entry.highlights.length)), 9);
  assert.equal(count(releaseText, /detailsUrl/g), 22);

  for (const manifest of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.equal(readJson(manifest).version, packageVersion, `${manifest} version drifted from package.json`);
  }

  const audit = doc();
  for (const expected of [
    '317 lines, 23,039 bytes',
    '24 array rows, 1 comment row, and 23 version rows',
    'newest version row is `3.3.2`',
    'only version row without `detailsUrl`',
    'Version `3.3.1` exists in the JSON',
    '19 version rows use GitHub release-tag URLs',
    '3 use GitHub commit URLs',
    '110 total highlight strings',
  ]) {
    assert.ok(audit.includes(expected), `doc missing ${expected}`);
  }
});

test('background release-note loader payload and message gates remain current', () => {
  const background = read('js/background.js');
  const onInstalledStart = background.indexOf('browserAPI.runtime.onInstalled.addListener');
  assert.notEqual(onInstalledStart, -1);

  const loadBlock = sliceBetween(
    background,
    'async function loadReleaseNotesData()',
    '/**\n * Looks up the given version'
  );
  assert.deepEqual(blockMetrics(loadBlock), {
    lines: 13,
    bytes: 521,
    sha256: 'f0aba19f88ff0384f9d1626d09cd5a755246721ad1cf1d6b5ca8a8c667b29889',
  });
  assert.match(loadBlock, /browserAPI\.runtime\.getURL\('data\/release_notes\.json'\)/);
  assert.match(loadBlock, /releaseNotesCache = await response\.json\(\)/);
  assert.match(loadBlock, /releaseNotesCache = \[\]/);

  const payloadBlock = sliceBetween(
    background,
    'async function buildReleaseNotesPayload(version)',
    'function getBackgroundRuntimeLabel()'
  );
  assert.deepEqual(blockMetrics(payloadBlock), {
    lines: 20,
    bytes: 862,
    sha256: '4d9e0174a81bfd937a32e578badff3f8cbe529585672776081c403bfd3da5385',
  });
  assert.match(payloadBlock, /data\.find\(note => note\?\.version === version\)/);
  assert.match(payloadBlock, /body: entry\.bannerSummary \|\| entry\.summary \|\| entry\.body \|\| RELEASE_NOTES_TEMPLATE\.body/);
  assert.match(payloadBlock, /link: WHATS_NEW_PAGE_URL/);

  const installStateBlock = sliceBetween(
    background,
    '            firstRunRefreshNeeded: true,',
    '        });',
    onInstalledStart
  );
  assert.deepEqual(blockMetrics(installStateBlock), {
    lines: 3,
    bytes: 132,
    sha256: 'c99db7b1bf9ff50d953670dc0a26fbaa2d03b8dffb19d6a5727b948e4b2e6ce4',
  });
  assert.match(installStateBlock, /releaseNotesSeenVersion: CURRENT_VERSION/);
  assert.match(installStateBlock, /releaseNotesPayload: null/);

  const updateBlock = sliceBetween(
    background,
    "    } else if (details.reason === 'update') {",
    '        // Show refresh prompt in already-open YouTube tabs after update.',
    onInstalledStart
  );
  assert.deepEqual(blockMetrics(updateBlock), {
    lines: 14,
    bytes: 693,
    sha256: '9161b6a98d47fb175a79c2e6334b27318a48def266b0fd6641ece63a1432e2b8',
  });
  assert.match(updateBlock, /buildReleaseNotesPayload\(CURRENT_VERSION\)/);
  assert.match(updateBlock, /releaseNotesPayload: payload/);
  assert.match(updateBlock, /firstRunRefreshNeeded: true/);

  const messageBranch = sliceBetween(
    background,
    "    if (action === 'FilterTube_ReleaseNotesCheck') {",
    "    } else if (action === 'FilterTube_SubscriptionsImportProgress')"
  );
  assert.deepEqual(blockMetrics(messageBranch), {
    lines: 64,
    bytes: 3063,
    sha256: '1ddbd866050fe9dc52b74d8f613c898b9e21c5c32b9f891b75ca009d49edd4e5',
  });
  assert.match(messageBranch, /storageGet\(\['releaseNotesSeenVersion', 'releaseNotesPayload'\]\)/);
  assert.match(messageBranch, /cachedPayload\?\.version && cachedPayload\.version !== seenVersion/);
  assert.match(messageBranch, /seenVersion && seenVersion === CURRENT_VERSION/);
  assert.match(messageBranch, /buildReleaseNotesPayload\(CURRENT_VERSION\)/);
  assert.match(messageBranch, /releaseNotesSeenVersion: version \|\| CURRENT_VERSION/);
  assert.match(messageBranch, /const url = request\?\.url \|\| WHATS_NEW_PAGE_URL/);

  assert.equal(count(background, /data\/release_notes\.json/g), 2);
  assert.equal(count(background, /releaseNotesSeenVersion/g), 5);
  assert.equal(count(background, /releaseNotesPayload/g), 8);
  assert.equal(count(background, /FilterTube_ReleaseNotesCheck/g), 1);
  assert.equal(count(background, /FilterTube_ReleaseNotesAck/g), 1);
  assert.equal(count(background, /FilterTube_OpenWhatsNew/g), 1);
});

test('dashboard and prompt release-note consumers remain pinned to current JSON flow', () => {
  const tabView = read('js/tab-view.js');
  const prompt = read('js/content/release_notes_prompt.js');

  const dashboardBlock = sliceBetween(
    tabView,
    'async function loadReleaseNotesIntoDashboard()',
    "document.addEventListener('DOMContentLoaded'"
  );
  assert.deepEqual(blockMetrics(dashboardBlock), {
    lines: 104,
    bytes: 4045,
    sha256: '4d47f8e357695199c604c581064f03228ddad8ae4dc8f6b3d665a45008151b81',
  });
  assert.match(dashboardBlock, /document\.getElementById\('releaseNotesList'\)/);
  assert.match(dashboardBlock, /runtimeAPI\.runtime\.getURL\('data\/release_notes\.json'\)/);
  assert.match(dashboardBlock, /: 'data\/release_notes\.json'/);
  assert.match(dashboardBlock, /const validNotes = notes\.filter\(note => note && typeof note\.version === 'string' && note\.version\.trim\(\)\)/);
  assert.match(dashboardBlock, /const isCurrent = note\.version === manifestVersion/);
  assert.match(dashboardBlock, /highlights\.slice\(0, 4\)/);
  assert.match(dashboardBlock, /if \(note\.detailsUrl\)/);
  assert.match(dashboardBlock, /link\.rel = 'noopener noreferrer'/);

  assert.deepEqual(blockMetrics(prompt.trimEnd()), {
    lines: 250,
    bytes: 9865,
    sha256: '52ba9b4088fe8dc0d3b69843bdba28c59f4151fa7009c72c502787deae39777a',
  });
  assert.match(prompt, /const PROMPT_ID = 'ft-release-notes-banner'/);
  assert.match(prompt, /api\.runtime\.getURL\('html\/tab-view\.html\?view=whatsnew'\)/);
  assert.match(prompt, /action: 'FilterTube_ReleaseNotesCheck'/);
  assert.match(prompt, /action: 'FilterTube_ReleaseNotesAck'/);
  assert.match(prompt, /action: 'FilterTube_OpenWhatsNew', url: targetLink/);
  assert.match(prompt, /window\.open\(targetLink, '_blank', 'noopener'\)/);
  assert.match(prompt, /location\.href = targetLink/);
  assert.match(prompt, /document\.addEventListener\('DOMContentLoaded', ready, \{ once: true \}\)/);
  assert.match(prompt, /setTimeout\(\(\) => existing\.remove\(\), 180\)/);

  assert.equal(count(tabView, /data\/release_notes\.json/g), 3);
  assert.equal(count(tabView, /detailsUrl/g), 2);
  assert.equal(count(tabView, /fetch\(/g), 1);
  assert.equal(count(prompt, /FilterTube_ReleaseNotesCheck/g), 1);
  assert.equal(count(prompt, /FilterTube_ReleaseNotesAck/g), 1);
  assert.equal(count(prompt, /FilterTube_OpenWhatsNew/g), 1);
  assert.equal(count(prompt, /addEventListener/g), 1);
  assert.equal(count(prompt, /setTimeout/g), 1);

  for (const [manifest, expectedIndex] of [
    ['manifest.json', 12],
    ['manifest.chrome.json', 12],
    ['manifest.firefox.json', 11],
    ['manifest.opera.json', 12],
  ]) {
    const scripts = readJson(manifest).content_scripts.flatMap((entry) => entry.js || []);
    assert.equal(scripts.includes('js/content/release_notes_prompt.js'), true, `${manifest} missing release prompt`);
    assert.equal(scripts.indexOf('js/content/release_notes_prompt.js'), expectedIndex, `${manifest} prompt index changed`);
  }
});

test('release notes version gate future authority symbols are absent from product source', () => {
  const selectedProductSource = [
    'data/release_notes.json',
    'package.json',
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json',
    'js/background.js',
    'js/tab-view.js',
    'js/content/release_notes_prompt.js',
  ].map((file) => read(file)).join('\n');
  const audit = doc();

  for (const symbol of futureSymbols) {
    assert.equal(selectedProductSource.includes(symbol), false, `${symbol} unexpectedly exists in product source`);
    assert.ok(audit.includes(symbol), `audit doc missing future symbol ${symbol}`);
  }

  assert.match(audit, /schema report enforces required fields/);
  assert.match(audit, /sender-class\/version membership contract/);
  assert.match(audit, /not a release\s+version gate/);
  assert.match(audit, /not a\s+URL policy/);
  assert.match(audit, /renderer ownership, path syntax, field-effect, route\/surface, settings-mode/);
});
