import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BACKGROUND_AUTO_BACKUP_SCHEDULER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/background.js': [6641, 298986, '837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd'],
  'js/state_manager.js': [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'],
  'js/content_bridge.js': [13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
  'js/tab-view.js': [11617, 526763, '1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7'],
  'js/io_manager.js': [2030, 96914, 'd04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21']
};

const blockSpecs = {
  backgroundCreateAutoBackup: {
    file: 'js/background.js',
    start: 'async function createAutoBackupInBackground(triggerType, options = {}) {',
    end: 'function scheduleAutoBackupInBackground',
    label: 'background createAutoBackupInBackground block',
    startLine: 782,
    lines: 97,
    bytes: 3751
  },
  backgroundScheduleAutoBackup: {
    file: 'js/background.js',
    start: 'function scheduleAutoBackupInBackground(triggerType, options = {}, delay = 1000) {',
    end: 'function shouldWaitForPostBlockEnrichmentBeforeBackup',
    label: 'background scheduleAutoBackupInBackground block',
    startLine: 879,
    lines: 25,
    bytes: 863
  },
  backgroundShouldWait: {
    file: 'js/background.js',
    start: 'function shouldWaitForPostBlockEnrichmentBeforeBackup(triggerType, options = {}) {',
    end: 'async function waitForPostBlockEnrichmentBeforeBackup',
    label: 'background shouldWaitForPostBlockEnrichmentBeforeBackup block',
    startLine: 904,
    lines: 8,
    bytes: 376
  },
  backgroundWaitForEnrichment: {
    file: 'js/background.js',
    start: 'async function waitForPostBlockEnrichmentBeforeBackup(timeoutMs = 9000) {',
    end: '// Browser detection for compatibility',
    label: 'background waitForPostBlockEnrichmentBeforeBackup block',
    startLine: 912,
    lines: 11,
    bytes: 336
  },
  backgroundScheduleAction: {
    file: 'js/background.js',
    start: "} else if (action === 'FilterTube_ScheduleAutoBackup') {",
    end: "} else if (action === 'fetchShortsIdentity')",
    label: 'background FilterTube_ScheduleAutoBackup action block',
    startLine: 3964,
    lines: 12,
    bytes: 652
  },
  stateManagerSchedule: {
    file: 'js/state_manager.js',
    start: 'function scheduleAutoBackup(triggerType, delay = 1000) {',
    end: '// ============================================================================',
    label: 'StateManager scheduleAutoBackup block',
    startLine: 25,
    lines: 21,
    bytes: 861
  },
  contentBridgeAddChannelDirectly: {
    file: 'js/content_bridge.js',
    start: 'async function addChannelDirectly(input, filterAll = false',
    end: '/**\n * Add "Filter All Content" checkbox below the blocked channel',
    label: 'content_bridge addChannelDirectly block',
    startLine: 13375,
    lines: 54,
    bytes: 2662
  },
  tabViewSchedule: {
    file: 'js/tab-view.js',
    start: 'async function scheduleAutoBackup(triggerType, delay = 1000, options = null) {',
    end: 'async function syncSessionUnlockStateFromBackground',
    label: 'tab-view scheduleAutoBackup block',
    startLine: 3064,
    lines: 17,
    bytes: 617
  },
  ioManagerSchedule: {
    file: 'js/io_manager.js',
    start: 'function scheduleAutoBackup(triggerType, delay = 1000) {',
    end: '    // ============================================================================\n    // PUBLIC API',
    label: 'io_manager scheduleAutoBackup block',
    startLine: 1996,
    lines: 16,
    bytes: 489
  }
};

const futureAuthoritySymbols = [
  'backgroundAutoBackupSchedulerContract',
  'backgroundAutoBackupTriggerPolicy',
  'backgroundAutoBackupSenderPolicy',
  'backgroundAutoBackupDelayClampReport',
  'backgroundAutoBackupTimerLifecycleReport',
  'backgroundAutoBackupPostEnrichmentWaitBudget',
  'backgroundAutoBackupEncryptionSkipReport',
  'backgroundAutoBackupDownloadRotationReport',
  'backgroundAutoBackupSplitOwnerReport',
  'backgroundAutoBackupMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sliceWithStart(file, startNeedle, endNeedle) {
  const text = read(file);
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return {
    startLine: text.slice(0, start).split(/\r?\n/).length,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const { startLine, block } = sliceWithStart(spec.file, spec.start, spec.end);
  return {
    startLine,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    block
  };
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function loadSchedulerHarness() {
  const scheduleBlock = blockMetric(blockSpecs.backgroundScheduleAutoBackup).block;
  const shouldWaitBlock = blockMetric(blockSpecs.backgroundShouldWait).block;
  const waitBlock = blockMetric(blockSpecs.backgroundWaitForEnrichment).block;
  const context = {
    __scheduled: [],
    __cleared: [],
    __created: [],
    __pendingPostBlockEnrichments: new Map(),
    console: { warn() {} },
    Promise
  };

  vm.runInNewContext(`
    let autoBackupTimer = null;
    let pendingAutoBackupTrigger = null;
    let pendingAutoBackupOptions = null;
    const pendingPostBlockEnrichments = globalThis.__pendingPostBlockEnrichments;
    function setTimeout(fn, delay) {
      const id = { fn, delay, index: globalThis.__scheduled.length };
      globalThis.__scheduled.push(id);
      return id;
    }
    function clearTimeout(id) {
      globalThis.__cleared.push(id);
    }
    async function createAutoBackupInBackground(trigger, opts) {
      globalThis.__created.push({ trigger, opts });
      return { ok: true };
    }
    ${scheduleBlock}
    ${shouldWaitBlock}
    ${waitBlock}
    globalThis.__api = {
      scheduleAutoBackupInBackground,
      shouldWaitForPostBlockEnrichmentBeforeBackup,
      waitForPostBlockEnrichmentBeforeBackup,
      state() {
        return {
          hasTimer: !!autoBackupTimer,
          pendingAutoBackupTrigger,
          pendingAutoBackupOptions
        };
      }
    };
  `, context);

  return context;
}

test('background auto-backup scheduler audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior proof only/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /Runtime filtering, JSON mutation, DOM mutation, storage, message, lifecycle/);
  assert.match(doc, /background auto-backup scheduler source files: 5/);
  assert.match(doc, /background auto-backup scheduler source\/effect blocks: 9/);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drift`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drift`);
    assert.equal(sha256(source), expectedHash, `${file} hash drift`);
    assert.match(doc, new RegExp(`\\| \`${escapeRegex(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`));
  }
});

test('background auto-backup scheduler source/effect blocks stay pinned', () => {
  const doc = read(docPath);

  for (const spec of Object.values(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${spec.label} start line drift`);
    assert.equal(metric.lines, spec.lines, `${spec.label} line count drift`);
    assert.equal(metric.bytes, spec.bytes, `${spec.label} byte count drift`);
    assert.match(
      doc,
      new RegExp(`${escapeRegex(spec.label)}: line ${spec.startLine}, ${spec.lines} lines, ${spec.bytes} bytes`)
    );
  }
});

test('selected background scheduler tokens keep timer and encryption side effects explicit', () => {
  const doc = read(docPath);
  const selected = [
    blockMetric(blockSpecs.backgroundCreateAutoBackup).block,
    blockMetric(blockSpecs.backgroundScheduleAutoBackup).block,
    blockMetric(blockSpecs.backgroundShouldWait).block,
    blockMetric(blockSpecs.backgroundWaitForEnrichment).block,
    blockMetric(blockSpecs.backgroundScheduleAction).block
  ].join('\n');

  const expectedCounts = {
    autoBackupEnabled: 1,
    autoBackupMode: 2,
    autoBackupFormat: 2,
    sessionPinCache: 1,
    missing_session_pin: 1,
    FilterTubeSecurity: 1,
    encryptJson: 2,
    downloadWithBrowserApi: 1,
    rotateAutoBackups: 1,
    setTimeout: 2,
    clearTimeout: 1,
    pendingAutoBackupTrigger: 3,
    pendingAutoBackupOptions: 3,
    waitForPostBlockEnrichmentBeforeBackup: 2,
    shouldWaitForPostBlockEnrichmentBeforeBackup: 2,
    'Number.isFinite': 1,
    isTrustedUiSender: 0,
    isProfileSessionAuthorized: 0
  };

  for (const [token, expected] of Object.entries(expectedCounts)) {
    assert.equal(countLiteral(selected, token), expected, `${token} count drift`);
    assert.match(doc, new RegExp(`${escapeRegex(token)}: ${expected}`));
  }
});

test('background schedule action accepts caller trigger options and finite delay without sender or clamp policy', () => {
  const block = blockMetric(blockSpecs.backgroundScheduleAction).block;

  assert.match(block, /const triggerType = typeof request\?\.triggerType === 'string' \? request\.triggerType : 'unknown'/);
  assert.match(block, /const delay = typeof request\?\.delay === 'number' && Number\.isFinite\(request\.delay\) \? request\.delay : 1000/);
  assert.match(block, /const options = request\?\.options && typeof request\.options === 'object' \? request\.options : \{\}/);
  assert.match(block, /scheduleAutoBackupInBackground\(triggerType, options, delay\)/);
  assert.doesNotMatch(block, /isTrustedUiSender|isProfileSessionAuthorized|Math\.max|Math\.min|clamp|allowedTrigger|triggerAllowlist/);
});

test('scheduler coalesces pending trigger and options into the latest timer callback', async () => {
  const context = loadSchedulerHarness();
  const api = context.__api;

  api.scheduleAutoBackupInBackground('first_trigger', { first: true }, 25);
  api.scheduleAutoBackupInBackground('second_trigger', { second: true }, 50);

  assert.equal(context.__scheduled.length, 2);
  assert.equal(context.__scheduled[0].delay, 25);
  assert.equal(context.__scheduled[1].delay, 50);
  assert.deepEqual(context.__cleared, [context.__scheduled[0]]);
  const pendingState = JSON.parse(JSON.stringify(api.state()));
  assert.deepEqual(pendingState, {
    hasTimer: true,
    pendingAutoBackupTrigger: 'second_trigger',
    pendingAutoBackupOptions: { second: true }
  });

  await context.__scheduled[1].fn();

  assert.deepEqual(JSON.parse(JSON.stringify(context.__created)), [
    { trigger: 'second_trigger', opts: { second: true } }
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(api.state())), {
    hasTimer: false,
    pendingAutoBackupTrigger: null,
    pendingAutoBackupOptions: null
  });
});

test('post-block enrichment wait policy is trigger-based and caller-overridable', () => {
  const context = loadSchedulerHarness();
  const { shouldWaitForPostBlockEnrichmentBeforeBackup } = context.__api;
  const waitBlock = blockMetric(blockSpecs.backgroundWaitForEnrichment).block;

  assert.equal(shouldWaitForPostBlockEnrichmentBeforeBackup('channel_added', {}), true);
  assert.equal(shouldWaitForPostBlockEnrichmentBeforeBackup('kids_channel_added', {}), true);
  assert.equal(shouldWaitForPostBlockEnrichmentBeforeBackup('whitelist_channel_added', {}), true);
  assert.equal(shouldWaitForPostBlockEnrichmentBeforeBackup('kids_whitelist_channel_added', {}), true);
  assert.equal(shouldWaitForPostBlockEnrichmentBeforeBackup('filter_all_toggled', {}), false);
  assert.equal(shouldWaitForPostBlockEnrichmentBeforeBackup('channel_added', { waitForPostBlockEnrichment: false }), false);

  assert.match(waitBlock, /timeoutMs = 9000/);
  assert.match(waitBlock, /Promise\.race/);
  assert.match(waitBlock, /Promise\.allSettled\(pending\)/);
  assert.match(waitBlock, /new Promise\(resolve => setTimeout\(resolve, timeoutMs\)\)/);
});

test('split auto-backup owners use separate background message and IO fallback paths', () => {
  const stateManager = blockMetric(blockSpecs.stateManagerSchedule).block;
  const contentBridge = blockMetric(blockSpecs.contentBridgeAddChannelDirectly).block;
  const tabView = blockMetric(blockSpecs.tabViewSchedule).block;
  const ioManager = blockMetric(blockSpecs.ioManagerSchedule).block;

  assert.match(stateManager, /chrome\.runtime\.sendMessage\(\{ action, triggerType: trigger, delay \}/);
  assert.match(stateManager, /window\.FilterTubeIO\.scheduleAutoBackup\(trigger, delay\)/);
  assert.match(contentBridge, /browserAPI_BRIDGE\.runtime\.sendMessage\(\{ action, triggerType: 'channel_added', delay: 1000 \}/);
  assert.match(contentBridge, /window\.FilterTubeIO\.scheduleAutoBackup\('channel_added'\)/);
  assert.match(tabView, /action: 'FilterTube_ScheduleAutoBackup'/);
  assert.match(tabView, /await sendRuntimeMessage\(payload\)/);
  assert.match(read('js/io_manager.js'), /let backupScheduleTimer = null/);
  assert.match(ioManager, /clearTimeout\(backupScheduleTimer\)/);
  assert.match(ioManager, /setTimeout\(async \(\) => \{/);
  assert.match(ioManager, /await createAutoBackup\(pendingBackupTrigger\)/);
});

test('background auto-backup scheduler authority symbols remain absent from product runtime source', () => {
  const source = productRuntimeSource();
  const doc = read(docPath);

  for (const symbol of futureAuthoritySymbols) {
    assert.match(doc, new RegExp(`- \`${symbol}\``));
    assert.equal(source.includes(symbol), false, `${symbol} leaked into product runtime source`);
  }
});
