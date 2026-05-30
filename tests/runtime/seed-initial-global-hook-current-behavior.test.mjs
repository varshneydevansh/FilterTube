import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SEED_INITIAL_GLOBAL_HOOK_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

test('seed initial global hook audit documents current behavior and future gate', () => {
  const doc = read(docPath);

  for (const marker of [
    'Status: current-behavior proof',
    'This is not an implementation patch',
    'seedInitialDataAuthority',
    'Current Behavior Matrix',
    'Required Future Contract',
    'Blocked now'
  ]) {
    assert.ok(doc.includes(marker), `doc missing marker ${marker}`);
  }

  for (const risk of [
    'Existing `ytInitialData`',
    'Existing `ytInitialPlayerResponse`',
    'Setter debug size',
    'Missing settings queue',
    'Settings update raw snapshots'
  ]) {
    assert.ok(doc.includes(risk), `doc missing risk row ${risk}`);
  }
});

test('existing ytInitialData is processed before defineProperty while getter returns captured variable', () => {
  const source = read('js/seed.js');
  const block = sliceBetween(source, '// Hook ytInitialData', '// Hook ytInitialPlayerResponse');
  const existingBlock = sliceBetween(
    block,
    'if (originalYtInitialData && typeof originalYtInitialData === \'object\')',
    '// Set up defineProperty hook for future data'
  );

  assert.match(existingBlock, /rawYtInitialData = shouldCaptureRawSnapshot\(\) \? cloneData\(originalYtInitialData\) : null/);
  assert.match(existingBlock, /const processed = processWithEngine\(originalYtInitialData, 'ytInitialData-existing'\)/);
  assert.match(existingBlock, /window\.ytInitialData = processed/);
  assert.doesNotMatch(existingBlock, /originalYtInitialData\s*=\s*processed/);

  assert.match(block, /get: function\(\) \{\s*return originalYtInitialData;\s*\}/);
  assert.match(block, /set: function\(newValue\) \{[\s\S]*originalYtInitialData = processed;/);
});

test('existing ytInitialPlayerResponse follows the same processed assignment and captured getter pattern', () => {
  const source = read('js/seed.js');
  const block = sliceBetween(source, '// Hook ytInitialPlayerResponse', '// ============================================================================\n    // FETCH/XHR INTERCEPTION');
  const existingBlock = sliceBetween(
    block,
    'if (originalYtInitialPlayerResponse && typeof originalYtInitialPlayerResponse === \'object\')',
    '// Set up defineProperty hook for future data'
  );

  assert.match(existingBlock, /rawYtInitialPlayerResponse = shouldCaptureRawSnapshot\(\) \? cloneData\(originalYtInitialPlayerResponse\) : null/);
  assert.match(existingBlock, /const processed = processWithEngine\(originalYtInitialPlayerResponse, 'ytInitialPlayerResponse-existing'\)/);
  assert.match(existingBlock, /window\.ytInitialPlayerResponse = processed/);
  assert.doesNotMatch(existingBlock, /originalYtInitialPlayerResponse\s*=\s*processed/);

  assert.match(block, /get: function\(\) \{\s*return originalYtInitialPlayerResponse;\s*\}/);
  assert.match(block, /set: function\(newValue\) \{[\s\S]*originalYtInitialPlayerResponse = processed;/);
});

test('initial global setters guard debug payload sizing behind the debug flag', () => {
  const source = read('js/seed.js');
  const dataBlock = sliceBetween(source, '// Hook ytInitialData', '// Hook ytInitialPlayerResponse');
  const playerBlock = sliceBetween(source, '// Hook ytInitialPlayerResponse', '// ============================================================================\n    // FETCH/XHR INTERCEPTION');
  const debugSizeBlock = sliceBetween(source, 'function getDebugPayloadSize(data)', 'function shouldBypassYouTubeiNetworkResponse(dataName)');

  assert.match(dataBlock, /if \(isSeedDebugEnabled\(\)\) \{[\s\S]*seedDebugLog\('Data size:', getDebugPayloadSize\(newValue\), 'chars'\)/);
  assert.match(playerBlock, /if \(isSeedDebugEnabled\(\)\) \{[\s\S]*seedDebugLog\('Data size:', getDebugPayloadSize\(newValue\), 'chars'\)/);
  assert.match(debugSizeBlock, /if \(!isSeedDebugEnabled\(\)\) return 0;/);
  assert.match(debugSizeBlock, /return data \? JSON\.stringify\(data\)\.length : 0;/);

  const debugLogBlock = sliceBetween(source, 'function seedDebugLog(message, ...args)', 'seedDebugLog("🌱 Seed script starting early initialization")');
  assert.match(debugLogBlock, /if \(!isSeedDebugEnabled\(\)\) return;/);
  assert.doesNotMatch(dataBlock + playerBlock, /JSON\.stringify\(newValue\)/);
});

test('missing cached settings queues data and no-work settings return original without replay', () => {
  const source = read('js/seed.js');
  const processBlock = sliceBetween(source, 'function processWithEngine(data, dataName)', 'function basicProcessing(data, dataName)');

  assert.match(processBlock, /if \(!cachedSettings\) \{/);
  assert.match(processBlock, /pendingDataQueue\.push\(\{ data: data, name: dataName, timestamp: Date\.now\(\), reason: reason \|\| '' \}\)/);
  assert.match(processBlock, /queueForLater\('settings-missing'\)/);
  assert.match(processBlock, /if \(!hasNetworkJsonWork\(cachedSettings\)\) \{/);
  assert.match(processBlock, /return data; \/\/ Return unmodified data/);
  assert.doesNotMatch(processBlock, /seedInitialDataAuthority|compiledRuleState|settingsRevision/);
});

test('pending queue replay clones and processes queued data after original response was already returned', () => {
  const source = read('js/seed.js');
  const replayBlock = sliceBetween(source, 'function replayPendingQueueIfReady()', 'function scheduleReplay()');
  const processBlock = sliceBetween(source, 'function processWithEngine(data, dataName)', 'function basicProcessing(data, dataName)');

  assert.match(processBlock, /return data; \/\/ Return unmodified data/);
  assert.match(replayBlock, /const sourceData = cloneData\(item\.data\) \|\| item\.data/);
  assert.match(replayBlock, /processWithEngine\(sourceData, `\$\{item\.name\}-replay`\)/);
  assert.doesNotMatch(replayBlock, /window\.ytInitialData|window\.ytInitialPlayerResponse|responseBody|rewrite/);
});

test('settings update assigns processed queued globals through installed setters without an assignment guard', () => {
  const source = read('js/seed.js');
  const updateBlock = sliceBetween(
    source,
    'function updateSettings(newSettings)',
    '// ============================================================================\n    // GLOBAL INTERFACE'
  );

  assert.match(updateBlock, /const processed = processWithEngine\(sourceData, `\$\{item\.name\}-queued`\)/);
  assert.match(updateBlock, /if \(item\.name\.includes\('ytInitialData'\)\) \{[\s\S]*window\.ytInitialData = processed;/);
  assert.match(updateBlock, /else if \(item\.name\.includes\('ytInitialPlayerResponse'\)\) \{[\s\S]*window\.ytInitialPlayerResponse = processed;/);
  assert.doesNotMatch(updateBlock, /suppressSetter|assignmentGuard|alreadyProcessed|seedInitialDataAuthority/);
});

test('settings update clears no-work snapshots and reprocesses active stored snapshots without revision or dirty-key guard', () => {
  const source = read('js/seed.js');
  const updateBlock = sliceBetween(
    source,
    'function updateSettings(newSettings)',
    '// ============================================================================\n    // GLOBAL INTERFACE'
  );

  assert.match(updateBlock, /cachedSettings = newSettings;/);
  assert.match(updateBlock, /if \(!hasNetworkJsonWork\(cachedSettings\)\) \{[\s\S]*pendingDataQueue = \[\];[\s\S]*rawYtInitialData = null;[\s\S]*rawYtInitialPlayerResponse = null;[\s\S]*return;/);
  assert.match(updateBlock, /const sourceInitialData = rawYtInitialData\s*\?\s*cloneData\(rawYtInitialData\)/);
  assert.match(updateBlock, /processWithEngine\(sourceInitialData, 'ytInitialData-reprocess'\)/);
  assert.match(updateBlock, /window\.ytInitialData = reprocessed/);
  assert.match(updateBlock, /const sourcePlayerResponse = rawYtInitialPlayerResponse\s*\?\s*cloneData\(rawYtInitialPlayerResponse\)/);
  assert.match(updateBlock, /processWithEngine\(sourcePlayerResponse, 'ytInitialPlayerResponse-reprocess'\)/);
  assert.match(updateBlock, /window\.ytInitialPlayerResponse = reprocessed/);
  assert.doesNotMatch(updateBlock, /settingsRevision|revision|dirtyKeys|sameSettings|deepEqual|lastApplied/);
});

test('seed source has no central initial-data authority implementation today', () => {
  const source = read('js/seed.js');

  for (const missing of [
    'seedInitialDataAuthority',
    'initialDataAuthority',
    'payloadSizeBudget',
    'shouldRetainRawSnapshot',
    'assignmentWouldInvokeSetter'
  ]) {
    assert.equal(source.includes(missing), false, `${missing} should be absent in current product source`);
  }
});
