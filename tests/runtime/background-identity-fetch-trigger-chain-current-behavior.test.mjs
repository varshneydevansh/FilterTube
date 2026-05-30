import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BACKGROUND_IDENTITY_FETCH_TRIGGER_CHAIN_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

test('background identity fetch trigger chain doc records the full DOM-to-background path', () => {
  const doc = read(docPath);

  for (const phrase of [
    'DOM fallback unresolved-handle repair',
    'fetchIdForHandle(`@${safeKey}`, { skipNetwork: true, backgroundOnly: true })',
    "action: 'fetchChannelDetails'",
    'fetchChannelInfo(request.channelIdOrHandle)',
    "credentials: 'include'",
    'FilterTube_UpdateChannelMap',
    'scheduleDomFallbackRerun()',
    'Runtime behavior remains unchanged'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase ${phrase}`);
  }
});

test('DOM fallback can trigger background-only handle resolution from an active fallback pass', () => {
  const block = sliceBetween(
    read('js/content/dom_fallback.js'),
    'if (channelMeta.id && !channelMeta.handle && Array.isArray(index.unresolvedHandleKeys)',
    '\n        }\n    }\n\n    return false;'
  );

  assert.match(block, /window\.__filtertubeActiveHandleResolveState/);
  assert.match(block, /window\.__filtertubeActiveHandleResolveAttempts/);
  assert.match(block, /now - lastAttemptTs < 10 \* 60 \* 1000/);
  assert.match(block, /fetchIdForHandle\(`@\$\{safeKey\}`, \{ skipNetwork: true, backgroundOnly: true \}\)/);
  assert.doesNotMatch(block, /networkAuthority|identityFetchAuthority|activeRuleReason|trustedSender/);
});

test('backgroundOnly handle resolver sends fetchChannelDetails then posts learned map and reruns DOM fallback', () => {
  const block = sliceBetween(
    read('js/content/handle_resolver.js'),
    'if (backgroundOnly) {',
    '\n        }\n\n        const encodedHandle = encodeURIComponent'
  );

  assert.match(block, /browserAPI_BRIDGE\.runtime\.sendMessage\(\{/);
  assert.match(block, /action: 'fetchChannelDetails'/);
  assert.match(block, /channelIdOrHandle: `@\$\{networkHandleCore\}`/);
  assert.match(block, /window\.postMessage\(\{/);
  assert.match(block, /type: 'FilterTube_UpdateChannelMap'/);
  assert.match(block, /source: 'content_bridge'/);
  assert.match(block, /scheduleDomFallbackRerun\(\)/);
  assert.doesNotMatch(block, /networkAuthority|identityFetchAuthority|activeRuleReason|trustedSender/);
});

test('background fetchChannelDetails branch calls channel fetch without sender or reason gate', () => {
  const background = read('js/background.js');
  const block = sliceBetween(
    background,
    'else if (request.action === "fetchChannelDetails")',
    '// Handle any browser-specific actions if needed'
  );

  assert.match(background, /function isTrustedUiSender\(sender\)/);
  assert.match(block, /fetchChannelInfo\(request\.channelIdOrHandle\)/);
  assert.match(block, /return true/);
  assert.doesNotMatch(block, /isTrustedUiSender|trustedUi|allowedYoutubeContentScript|networkAuthority|identityFetchAuthority|fetchBudget|activeRuleReason|explicitReason/);
});

test('fetchChannelInfo performs credentialed YouTube channel HTML fetches', () => {
  const block = sliceBetween(
    read('js/background.js'),
    'async function fetchChannelInfo(channelIdOrHandle)',
    'async function handleAddFilteredChannel(input, filterAll = false'
  );

  assert.match(block, /channelUrl = `https:\/\/www\.youtube\.com\/@\$\{encodedHandle\}\/about`/);
  assert.match(block, /channelUrl = `https:\/\/www\.youtube\.com\/channel\/\$\{resolvedChannelId\}`/);
  assert.match(block, /let response = await fetch\(channelUrl, \{/);
  assert.match(block, /credentials: 'include'/);
  assert.match(block, /const fallbackUrl = `https:\/\/www\.youtube\.com\/@\$\{encodedHandle\}`/);
  assert.match(block, /response = await fetch\(fallbackUrl, \{/);
  assert.doesNotMatch(block, /networkAuthority|identityFetchAuthority|fetchBudget|activeRuleReason|ownerCredentialPolicy/);
});

test('background identity fetch chain is listed as a supplemental stabilization blocker', () => {
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');
  const results = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const stabilization = read('docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md');
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  for (const doc of [convergence, results, stabilization, ledger]) {
    assert.ok(doc.includes('FILTERTUBE_BACKGROUND_IDENTITY_FETCH_TRIGGER_CHAIN_CURRENT_BEHAVIOR_2026-05-19.md'));
  }
});
