import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_PROMPT_RELEASE_OVERLAY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceFingerprints = {
  'manifest.json': [88, 2513, 'c39c38d4e389f17803b1915c2d2d0673c60dd87e68a9301fac4faad14bfd31e1'],
  'manifest.chrome.json': [88, 2513, 'c39c38d4e389f17803b1915c2d2d0673c60dd87e68a9301fac4faad14bfd31e1'],
  'manifest.firefox.json': [75, 2029, '89e2f70a5f6bb34356ebed2f4ad357213a28a2872cfaebeff2474e702a98719d'],
  'manifest.opera.json': [89, 2518, 'ef0fa857517710853e82942bdb05bc14c9f2e2202b49775fd6e6a59a27e77017'],
  'package.json': [46, 1376, 'cd24685d1fb4940c1a67f12ce143bc1466200a299a82dbfa6f553b99e24ae23f'],
  'data/release_notes.json': [316, 23039, 'e012f6c071fffa67958f55544ecae9bbb26e7ec91edd2066df4d06a62de69962'],
  'js/content/first_run_prompt.js': [190, 7453, '5672d9060d29b08550ecfc3add54245212a5094ee5137f025b6f788f12e50409'],
  'js/content/release_notes_prompt.js': [250, 9866, '30b624cbbda1004f354f98dbf3b4513f8ebc298adecbceb4358782f248f80474'],
  'js/background.js': [6320, 285103, '77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad'],
  'js/tab-view.js': [11617, 526763, '1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7']
};

const blockSpecs = {
  firstRunCreatePrompt: {
    file: 'js/content/first_run_prompt.js',
    start: 'function createPrompt() {',
    end: '    function markComplete() {',
    startLine: 39,
    lines: 133,
    bytes: 5412
  },
  firstRunMarkComplete: {
    file: 'js/content/first_run_prompt.js',
    start: '    function markComplete() {',
    end: '    function init() {',
    startLine: 172,
    lines: 5,
    bytes: 139
  },
  firstRunInit: {
    file: 'js/content/first_run_prompt.js',
    start: '    function init() {',
    end: '    init();',
    startLine: 177,
    lines: 12,
    bytes: 453
  },
  releaseRemovePrompt: {
    file: 'js/content/release_notes_prompt.js',
    start: '    function removePrompt() {',
    end: '    /**\n     * Tells the background',
    startLine: 58,
    lines: 8,
    bytes: 250
  },
  releaseAckAndDismiss: {
    file: 'js/content/release_notes_prompt.js',
    start: '    function ackAndDismiss() {',
    end: '    /**\n     * Builds the banner DOM',
    startLine: 70,
    lines: 14,
    bytes: 349
  },
  releaseCreatePrompt: {
    file: 'js/content/release_notes_prompt.js',
    start: '    function createPrompt(payload) {',
    end: '    /**\n     * Entry point',
    startLine: 87,
    lines: 147,
    bytes: 6306
  },
  releaseInit: {
    file: 'js/content/release_notes_prompt.js',
    start: '    function init() {',
    end: '    init();',
    startLine: 237,
    lines: 12,
    bytes: 494
  },
  backgroundLoadReleaseNotesData: {
    file: 'js/background.js',
    start: 'async function loadReleaseNotesData() {',
    end: '/**\n * Looks up the given version',
    startLine: 1719,
    lines: 14,
    bytes: 523
  },
  backgroundBuildReleaseNotesPayload: {
    file: 'js/background.js',
    start: 'async function buildReleaseNotesPayload(version) {',
    end: 'function getBackgroundRuntimeLabel()',
    startLine: 1737,
    lines: 21,
    bytes: 864
  },
  backgroundInstalledPromptFlow: {
    file: 'js/background.js',
    start: '// Extension installed or updated handler\nbrowserAPI.runtime.onInstalled.addListener(function (details) {',
    end: 'function handleFetchShortsIdentityMessage',
    startLine: 2572,
    lines: 94,
    bytes: 4281
  },
  backgroundPromptMessageFlow: {
    file: 'js/background.js',
    start: "if (action === 'FilterTube_ReleaseNotesCheck') {",
    end: "} else if (action === 'FilterTube_SubscriptionsImportProgress') {",
    startLine: 3171,
    lines: 65,
    bytes: 3064
  },
  tabDashboardReleaseNotes: {
    file: 'js/tab-view.js',
    start: 'async function loadReleaseNotesIntoDashboard() {',
    end: "document.addEventListener('DOMContentLoaded'",
    startLine: 2652,
    lines: 105,
    bytes: 4047
  }
};

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function doc() {
  return read(docPath);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return {
    start,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const text = read(spec.file);
  const { start, block } = sliceBetween(text, spec.start, spec.end);
  return {
    startLine: text.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    block
  };
}

function isolatedScripts(manifestFile) {
  const manifest = readJson(manifestFile);
  return manifest.content_scripts.find((entry) =>
    Array.isArray(entry.js) && entry.js.includes('js/content/release_notes_prompt.js')
  )?.js || [];
}

test('prompt release overlay boundary is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior boundary/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /This is not an implementation patch/);
  assert.match(text, /first-class JSON filter promotion blockers/);
  assert.match(text, /prompt release boundary source files pinned \| 10/);
  assert.match(text, /prompt release source\/effect blocks pinned \| 12/);
  assert.match(text, /browser manifest prompt load-order lists pinned \| 4/);
  assert.match(text, /background prompt action branches pinned \| 5/);
  assert.match(text, /release note data entries \| 24/);
  assert.match(text, /release note version rows \| 23/);
  assert.match(text, /staged newest release-note version \| 3\.3\.2/);
  assert.match(text, /packaged extension\/browser version \| 3\.3\.1/);
  assert.match(text, /runtime implementation changed \| no/);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(source), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines.toLocaleString('en-US')} \\| ${expectedBytes.toLocaleString('en-US')} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('prompt release source/effect blocks remain current', () => {
  const text = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line drifted`);
    assert.equal(metric.lines, spec.lines, `${name} line count drifted`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${name}\` \\| \`${escapeRegExp(spec.file)}:${spec.startLine}\` \\| ${spec.lines.toLocaleString('en-US')} \\| ${spec.bytes.toLocaleString('en-US')} \\|`)
    );
  }
});

test('manifest and overlay placement keep split prompt owners visible', () => {
  const firstRun = read('js/content/first_run_prompt.js');
  const release = read('js/content/release_notes_prompt.js');

  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const scripts = isolatedScripts(manifestFile);
    assert.ok(scripts.includes('js/content/release_notes_prompt.js'), `${manifestFile} missing release prompt`);
    assert.ok(scripts.includes('js/content/first_run_prompt.js'), `${manifestFile} missing first-run prompt`);
    assert.ok(scripts.includes('js/content_bridge.js'), `${manifestFile} missing content bridge`);
    assert.ok(
      scripts.indexOf('js/content/release_notes_prompt.js') < scripts.indexOf('js/content/first_run_prompt.js'),
      `${manifestFile} should load release prompt before first-run prompt`
    );
    assert.ok(
      scripts.indexOf('js/content/first_run_prompt.js') < scripts.indexOf('js/content_bridge.js'),
      `${manifestFile} should load first-run prompt before content bridge`
    );
  }

  assert.match(firstRun, /PROMPT_ID = 'ft-first-run-refresh-prompt'/);
  assert.match(release, /PROMPT_ID = 'ft-release-notes-banner'/);
  assert.match(firstRun, /container\.style\.zIndex = '2147483647'/);
  assert.match(release, /container\.style\.zIndex = '2147483646'/);

  for (const source of [firstRun, release]) {
    assert.match(source, /container\.style\.top = '16px'/);
    assert.match(source, /container\.style\.right = '16px'/);
    assert.match(source, /container\.style\.width = 'clamp\(280px, 32vw, 360px\)'/);
    assert.match(source, /@media \(max-width: 600px\)/);
    assert.match(source, /document\.head\.appendChild\(style\)/);
    assert.doesNotMatch(source, /visualViewport|safe-area-inset|env\(safe-area|style\.remove\(\)|promptPriority|PromptCoordinator/);
  }
});

test('install update ack and whats-new actions remain locally gated only', () => {
  const background = read('js/background.js');
  const installUpdateBlock = blockMetric(blockSpecs.backgroundInstalledPromptFlow).block;
  const messageBlock = blockMetric(blockSpecs.backgroundPromptMessageFlow).block;
  const release = read('js/content/release_notes_prompt.js');

  const installBlock = sliceBetween(
    installUpdateBlock,
    "if (details.reason === 'install') {",
    "} else if (details.reason === 'update') {"
  ).block;
  const updateBlock = sliceBetween(
    installUpdateBlock,
    "} else if (details.reason === 'update') {",
    '        // You could handle migration of settings between versions here if needed'
  ).block;

  assert.match(installBlock, /firstRunRefreshNeeded:\s*true/);
  assert.match(installBlock, /releaseNotesSeenVersion:\s*CURRENT_VERSION/);
  assert.match(installBlock, /files:\s*\['js\/content\/first_run_prompt\.js'\]/);
  assert.doesNotMatch(installBlock, /releaseNotesPayload:\s*payload|PromptCoordinator|promptQueue|activePromptOwner/);

  assert.match(updateBlock, /buildReleaseNotesPayload\(CURRENT_VERSION\)/);
  assert.match(updateBlock, /releaseNotesPayload:\s*payload/);
  assert.match(updateBlock, /firstRunRefreshNeeded:\s*true/);
  assert.match(updateBlock, /files:\s*\['js\/content\/first_run_prompt\.js'\]/);
  assert.doesNotMatch(updateBlock, /promptPriority|PromptCoordinator|activePromptOwner|releaseNotesSeenVersion:\s*CURRENT_VERSION/);

  const releaseAckBlock = sliceBetween(
    messageBlock,
    "} else if (action === 'FilterTube_ReleaseNotesAck') {",
    "} else if (action === 'FilterTube_FirstRunCheck') {"
  ).block;
  const firstRunCompleteBlock = sliceBetween(
    messageBlock,
    "} else if (action === 'FilterTube_FirstRunComplete') {",
    "} else if (action === 'FilterTube_OpenWhatsNew') {"
  ).block;
  const openBlock = sliceBetween(
    background,
    "} else if (action === 'FilterTube_OpenWhatsNew') {",
    "} else if (action === 'FilterTube_SubscriptionsImportProgress') {"
  ).block;

  assert.ok(background.includes('function isTrustedUiSender'), 'trusted UI guard should exist elsewhere');
  assert.match(releaseAckBlock, /releaseNotesSeenVersion:\s*version \|\| CURRENT_VERSION/);
  assert.match(firstRunCompleteBlock, /firstRunRefreshNeeded:\s*false/);
  assert.match(openBlock, /const url = request\?\.url \|\| WHATS_NEW_PAGE_URL/);
  assert.match(openBlock, /browserAPI\.tabs\.create\(\{ url: url, active: true \}/);
  for (const block of [releaseAckBlock, firstRunCompleteBlock, openBlock]) {
    assert.doesNotMatch(block, /isTrustedUiSender|promptCapability|senderClass|ownedPromptInstance|allowedWhatsNewUrl|promptWhatsNewUrlPolicy/);
  }

  assert.match(release, /const targetLink = WHATS_NEW_URL \|\| payload\.link/);
  assert.match(release, /action:\s*'FilterTube_OpenWhatsNew',\s*url:\s*targetLink/);
  assert.match(release, /window\.open\(targetLink, '_blank', 'noopener'\)/);
  assert.match(release, /location\.href = targetLink/);
});

test('release-note data and dashboard render stay version-gated only by local fields', () => {
  const text = doc();
  const packageVersion = readJson('package.json').version;
  const manifestVersions = ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']
    .map(file => readJson(file).version);
  const releaseNotes = readJson('data/release_notes.json');
  const versionRows = releaseNotes.filter(note => note && typeof note.version === 'string');
  const dashboard = blockMetric(blockSpecs.tabDashboardReleaseNotes).block;
  const buildPayload = blockMetric(blockSpecs.backgroundBuildReleaseNotesPayload).block;

  assert.equal(releaseNotes.length, 24);
  assert.equal(versionRows.length, 23);
  assert.equal(versionRows[0].version, '3.3.2');
  assert.equal(packageVersion, '3.3.1');
  assert.deepEqual([...new Set(manifestVersions)], ['3.3.1']);
  assert.ok(versionRows.some(note => note.version === packageVersion));
  assert.equal(versionRows.filter(note => note.detailsUrl).length, 22);
  assert.equal(versionRows.filter(note => note.bannerSummary).length, 18);
  assert.equal(versionRows.filter(note => Array.isArray(note.highlights)).length, 23);

  assert.match(buildPayload, /data\.find\(note => note\?\.version === version\)/);
  assert.match(buildPayload, /bannerSummary \|\| entry\.summary \|\| entry\.body/);
  assert.match(buildPayload, /link: WHATS_NEW_PAGE_URL/);

  assert.match(dashboard, /const response = await fetch\(url\)/);
  assert.match(dashboard, /const validNotes = notes\.filter\(note => note && typeof note\.version === 'string'/);
  assert.match(dashboard, /const isCurrent = note\.version === manifestVersion/);
  assert.match(dashboard, /link\.href = note\.detailsUrl/);
  assert.match(dashboard, /link\.target = '_blank'/);
  assert.match(dashboard, /link\.rel = 'noopener noreferrer'/);

  assert.match(text, /Release version gate/);
  assert.match(text, /JSON-first public claim gate/);
});

test('prompt release overlay future authority symbols are absent from product source', () => {
  const source = [
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json',
    'package.json',
    'data/release_notes.json',
    'js/content/first_run_prompt.js',
    'js/content/release_notes_prompt.js',
    'js/background.js',
    'js/tab-view.js'
  ].map(read).join('\n');

  for (const absentToken of [
    'promptReleaseOverlayBoundaryContract',
    'promptCoordinatorDecisionReport',
    'promptPriorityQueueContract',
    'promptAckSenderClassGate',
    'promptWhatsNewUrlPolicy',
    'promptViewportFitReport',
    'promptReleaseNoteVersionGate',
    'promptStyleTeardownRegistry',
    'promptInstallUpdateFixtureProvenance',
    'promptFirstClassJsonClaimGate'
  ]) {
    assert.equal(source.includes(absentToken), false, `unexpected prompt release authority token ${absentToken}`);
    assert.match(doc(), new RegExp(`- \`${absentToken}\``));
  }
});
