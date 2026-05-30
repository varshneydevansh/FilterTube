import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_STATE_MANAGER_STORAGE_RELOAD_ENRICHMENT_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const sourcePath = 'js/state_manager.js';

const sourceFingerprint = {
  lines: 2491,
  bytes: 99780,
  hash: '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'
};

const blockSpecs = {
  scheduleChannelNameEnrichment: {
    start: '    function scheduleChannelNameEnrichment() {',
    end: '\n\n    function resetEnrichmentState',
    startLine: 496,
    lines: 11,
    bytes: 343,
    hash: 'e7f5faa954cde32eeaab4a0a187dd411975f56e241834e22e0885feb72c4a172'
  },
  processChannelEnrichmentQueue: {
    start: '    function processChannelEnrichmentQueue() {',
    end: '\n\n    // ============================================================================\n    // KIDS PROFILE MANAGEMENT',
    startLine: 639,
    lines: 57,
    bytes: 2074,
    hash: '6c9cf0a07af47f993e967f3d34a7a9f82203f2510e28172acd49d2a10b6b3c13'
  },
  saveSettings: {
    start: "    async function saveSettings({ broadcast = true, profile = 'main' } = {}) {",
    end: '\n\n    /**\n     * Ensure settings are loaded before operations',
    startLine: 1009,
    lines: 58,
    bytes: 2675,
    hash: 'd8e54f713f42461db3416a5e746814c86958cd2bfa8a633bb115c1f624047523'
  },
  setupStorageListener: {
    start: '    function setupStorageListener() {',
    end: '\n\n    // Initialize listener',
    startLine: 2313,
    lines: 120,
    bytes: 5053,
    hash: '79fc928744231a416b3c7a9646aa8e5e219c72bb85ac3bb93c969d18170cb27d'
  }
};

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
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
  const source = read(sourcePath);
  const { start, block } = sliceBetween(source, spec.start, spec.end);
  return {
    startLine: source.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    hash: sha256(block),
    block
  };
}

function selectedSource() {
  const source = read(sourcePath);
  return Object.values(blockSpecs)
    .map((spec) => sliceBetween(source, spec.start, spec.end).block)
    .join('\n');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('state manager storage reload enrichment doc records audit-only boundary', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior boundary/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /non-queued settings\s+saves/);
  assert.match(doc, /channel-name enrichment timers/);
  assert.match(doc, /storage\s+change listening/);
  assert.match(doc, /debounced external reloads/);
  assert.match(doc, /StateManager storage reload\/enrichment lifecycle source files pinned \| 1/);
  assert.match(doc, /StateManager storage reload\/enrichment lifecycle source\/effect blocks pinned \| 4/);
  assert.match(doc, /selected clearTimeout tokens \| 0/);
  assert.match(doc, /selected removeListener tokens \| 0/);
});

test('state manager source fingerprint and blocks remain current', () => {
  const source = read(sourcePath);
  const doc = read(docPath);

  assert.equal(lineCount(source), sourceFingerprint.lines);
  assert.equal(Buffer.byteLength(source), sourceFingerprint.bytes);
  assert.equal(sha256(source), sourceFingerprint.hash);
  assert.match(
    doc,
    new RegExp(`\\| \`${sourcePath}\` \\| ${sourceFingerprint.lines.toLocaleString('en-US')} \\| ${sourceFingerprint.bytes.toLocaleString('en-US')} \\| \`${sourceFingerprint.hash}\` \\|`)
  );

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line drifted`);
    assert.equal(metric.lines, spec.lines, `${name} line count drifted`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count drifted`);
    assert.equal(metric.hash, spec.hash, `${name} hash drifted`);
    assert.match(
      doc,
      new RegExp(`\\| \`${name}\` \\| \`${sourcePath}:${spec.startLine}\` \\| ${spec.startLine} \\| ${spec.lines} \\| ${spec.bytes.toLocaleString('en-US')} \\| \`${spec.hash}\` \\|`)
    );
  }
});

test('state manager storage reload enrichment token counts remain current', () => {
  const selected = selectedSource();
  const setupBlock = blockMetric(blockSpecs.setupStorageListener).block;
  const doc = read(docPath);

  const counts = {
    'selected setTimeout tokens': countLiteral(selected, 'setTimeout('),
    'selected clearTimeout tokens': countLiteral(selected, 'clearTimeout('),
    'selected storage.onChanged listener tokens': countLiteral(selected, 'chrome.storage.onChanged.addListener'),
    'selected storage key literal rows': (setupBlock.match(/^\s{20}'[^']+'[,]?$/gm) || []).length,
    'selected saveSettings tokens': countLiteral(selected, 'saveSettings'),
    'selected isSaving tokens': countLiteral(selected, 'isSaving'),
    'selected loadSettings tokens': countLiteral(selected, 'loadSettings'),
    'selected notifyListeners tokens': countLiteral(selected, 'notifyListeners'),
    'selected broadcastSettings tokens': countLiteral(selected, 'broadcastSettings'),
    'selected channelEnrichmentQueue tokens': countLiteral(selected, 'channelEnrichmentQueue'),
    'selected channelEnrichmentScheduled tokens': countLiteral(selected, 'channelEnrichmentScheduled'),
    'selected isEnriching tokens': countLiteral(selected, 'isEnriching'),
    'selected externalReloadTimer tokens': countLiteral(selected, 'externalReloadTimer'),
    'selected externalReloadInFlight tokens': countLiteral(selected, 'externalReloadInFlight'),
    'selected externalReloadPending tokens': countLiteral(selected, 'externalReloadPending'),
    'selected computeChannelSignature tokens': countLiteral(selected, 'computeChannelSignature'),
    'selected scheduleExternalReload tokens': countLiteral(selected, 'scheduleExternalReload'),
    'selected runExternalReload tokens': countLiteral(selected, 'runExternalReload'),
    'selected resetEnrichment false tokens': countLiteral(selected, 'resetEnrichment: false'),
    'selected scheduleEnrichment false tokens': countLiteral(selected, 'scheduleEnrichment: false'),
    'selected notify false tokens': countLiteral(selected, 'notify: false'),
    'selected channelMap tokens': countLiteral(selected, 'channelMap'),
    'selected ftProfilesV4 tokens': countLiteral(selected, 'ftProfilesV4'),
    'selected ftProfilesV3 tokens': countLiteral(selected, 'ftProfilesV3'),
    'selected ftThemePreference tokens': countLiteral(selected, 'ftThemePreference'),
    'selected chrome.runtime.sendMessage tokens': countLiteral(selected, 'chrome.runtime.sendMessage'),
    'selected addFilteredChannel tokens': countLiteral(selected, 'addFilteredChannel'),
    'selected MAX_CHANNEL_ENRICHMENTS_PER_SESSION tokens': countLiteral(selected, 'MAX_CHANNEL_ENRICHMENTS_PER_SESSION'),
    'selected Math.random tokens': countLiteral(selected, 'Math.random'),
    'selected removeListener tokens': countLiteral(selected, 'removeListener'),
    'selected clear enrichment queue tokens': countLiteral(selected, 'channelEnrichmentQueue.length = 0')
  };

  assert.deepEqual(counts, {
    'selected setTimeout tokens': 5,
    'selected clearTimeout tokens': 0,
    'selected storage.onChanged listener tokens': 1,
    'selected storage key literal rows': 39,
    'selected saveSettings tokens': 4,
    'selected isSaving tokens': 4,
    'selected loadSettings tokens': 1,
    'selected notifyListeners tokens': 4,
    'selected broadcastSettings tokens': 1,
    'selected channelEnrichmentQueue tokens': 5,
    'selected channelEnrichmentScheduled tokens': 3,
    'selected isEnriching tokens': 3,
    'selected externalReloadTimer tokens': 4,
    'selected externalReloadInFlight tokens': 4,
    'selected externalReloadPending tokens': 4,
    'selected computeChannelSignature tokens': 2,
    'selected scheduleExternalReload tokens': 2,
    'selected runExternalReload tokens': 3,
    'selected resetEnrichment false tokens': 1,
    'selected scheduleEnrichment false tokens': 1,
    'selected notify false tokens': 1,
    'selected channelMap tokens': 2,
    'selected ftProfilesV4 tokens': 1,
    'selected ftProfilesV3 tokens': 1,
    'selected ftThemePreference tokens': 5,
    'selected chrome.runtime.sendMessage tokens': 1,
    'selected addFilteredChannel tokens': 1,
    'selected MAX_CHANNEL_ENRICHMENTS_PER_SESSION tokens': 1,
    'selected Math.random tokens': 1,
    'selected removeListener tokens': 0,
    'selected clear enrichment queue tokens': 1
  });

  for (const [label, value] of Object.entries(counts)) {
    assert.ok(doc.includes(`${label} | ${value}`), `missing doc token count ${label}`);
  }
});

test('state manager save gate current behavior is pinned', () => {
  const block = blockMetric(blockSpecs.saveSettings).block;

  assert.match(block, /if \(isSaving\) return/);
  assert.match(block, /if \(!SettingsAPI\.saveSettings\)/);
  assert.match(block, /isSaving = true/);
  assert.match(block, /const result = await SettingsAPI\.saveSettings\(\{/);
  assert.match(block, /if \(broadcast && result\.compiledSettings\) \{/);
  assert.match(block, /broadcastSettings\(result\.compiledSettings, profile\)/);
  assert.match(block, /notifyListeners\('save', state\)/);
  assert.match(block, /finally \{\n\s+isSaving = false;\n\s+\}/);
});

test('state manager channel enrichment lifecycle current behavior is pinned', () => {
  const scheduleBlock = blockMetric(blockSpecs.scheduleChannelNameEnrichment).block;
  const processBlock = blockMetric(blockSpecs.processChannelEnrichmentQueue).block;

  assert.match(scheduleBlock, /if \(channelEnrichmentScheduled\) return/);
  assert.match(scheduleBlock, /channelEnrichmentScheduled = true/);
  assert.match(scheduleBlock, /setTimeout\(\(\) => \{/);
  assert.match(scheduleBlock, /channelEnrichmentScheduled = false/);
  assert.match(scheduleBlock, /enqueueChannelEnrichment\(\)/);

  assert.match(processBlock, /if \(isEnriching\) return/);
  assert.match(processBlock, /if \(channelEnrichmentQueue\.length === 0\) return/);
  assert.match(processBlock, /channelEnrichmentProcessedThisSession >= MAX_CHANNEL_ENRICHMENTS_PER_SESSION/);
  assert.match(processBlock, /channelEnrichmentQueue\.length = 0/);
  assert.match(processBlock, /setTimeout\(processChannelEnrichmentQueue, 0\)/);
  assert.match(processBlock, /chrome\.runtime\.sendMessage\(\{/);
  assert.match(processBlock, /type: 'addFilteredChannel'/);
  assert.match(processBlock, /channelEnrichmentProcessedThisSession\+\+/);
  assert.match(processBlock, /const delayMs = 5000 \+ Math\.floor\(Math\.random\(\) \* 2000\)/);
  assert.match(processBlock, /setTimeout\(\(\) => \{\n\s+isEnriching = false;\n\s+processChannelEnrichmentQueue\(\);\n\s+\}, delayMs\)/);
});

test('state manager storage reload listener current behavior is pinned', () => {
  const block = blockMetric(blockSpecs.setupStorageListener).block;

  assert.match(block, /chrome\.storage\.onChanged\.addListener\(async \(changes, area\) => \{/);
  assert.match(block, /if \(area !== 'local' \|\| isSaving\) return/);
  assert.match(block, /if \(changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'\) \{/);
  assert.match(block, /if \(changes\.ftThemePreference\) \{/);
  assert.match(block, /SettingsAPI\.applyThemePreference\(newTheme\)/);
  assert.match(block, /notifyListeners\('themeChanged', \{ theme: newTheme \}\)/);
  assert.match(block, /const hasSettingsChange = storageKeys\.some\(key => changes\[key\]\)/);
  assert.match(block, /if \(externalReloadTimer\) return/);
  assert.match(block, /externalReloadTimer = setTimeout\(\(\) => \{/);
  assert.match(block, /\}, 150\)/);
  assert.match(block, /await loadSettings\(\{ notify: false, resetEnrichment: false, scheduleEnrichment: false \}\)/);
  assert.match(block, /if \(afterSig !== beforeSig\) \{\n\s+notifyListeners\('load', state\)/);
  assert.match(block, /notifyListeners\('externalUpdate', state\)/);
  assert.match(block, /setTimeout\(runExternalReload, 0\)/);
  assert.doesNotMatch(block, /removeListener/);
  assert.doesNotMatch(block, /clearTimeout\(/);
});

test('state manager storage reload enrichment authority symbols are absent from runtime source', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();
  const authorities = [
    'stateManagerStorageReloadLifecycleContract',
    'stateManagerExternalReloadDecisionReport',
    'stateManagerExternalReloadTimerBudget',
    'stateManagerExternalReloadRaceReport',
    'stateManagerExternalReloadTeardownReport',
    'stateManagerSaveQueueContract',
    'stateManagerChannelEnrichmentLifecycleContract',
    'stateManagerChannelEnrichmentNetworkBudget',
    'stateManagerChannelEnrichmentRetryPolicy',
    'stateManagerStorageKeyParityReport',
    'stateManagerListenerTeardownRegistry',
    'stateManagerLifecycleMetricArtifact'
  ];

  for (const authority of authorities) {
    assert.ok(doc.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
