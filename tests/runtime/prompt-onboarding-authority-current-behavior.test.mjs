import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function between(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

test('prompt onboarding audit documents overlay owners risks and future gates', () => {
  const doc = read('docs/audit/FILTERTUBE_PROMPT_ONBOARDING_AUTHORITY_AUDIT_2026-05-18.md');

  for (const marker of [
    'First-run refresh prompt',
    'Release-notes banner',
    'What’s New dashboard',
    'Extension toasts',
    'Managed child banner',
    'Prompt/onboarding UX is mapped but not implementation-ready',
  ]) {
    assert.ok(doc.includes(marker), `missing prompt audit marker ${marker}`);
  }

  for (const gate of [
    'Fresh install',
    'Extension update',
    'Prompt replay',
    'Prompt acknowledgement',
    'What’s New CTA',
    'Mobile viewport',
    'Dashboard release data',
  ]) {
    assert.ok(doc.includes(gate), `missing required future gate ${gate}`);
  }
});

test('manifest currently loads release and first-run prompt scripts before content bridge', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const isolatedScripts = manifest.content_scripts.find((entry) =>
    Array.isArray(entry.js) && entry.js.includes('js/content/release_notes_prompt.js')
  )?.js;

  assert.ok(isolatedScripts, 'missing isolated content script list');

  const releaseIndex = isolatedScripts.indexOf('js/content/release_notes_prompt.js');
  const firstRunIndex = isolatedScripts.indexOf('js/content/first_run_prompt.js');
  const bridgeIndex = isolatedScripts.indexOf('js/content_bridge.js');

  assert.ok(releaseIndex !== -1, 'missing release prompt script');
  assert.ok(firstRunIndex !== -1, 'missing first-run prompt script');
  assert.ok(bridgeIndex !== -1, 'missing content bridge script');
  assert.ok(releaseIndex < firstRunIndex, 'release prompt currently loads before first-run prompt');
  assert.ok(firstRunIndex < bridgeIndex, 'prompt scripts currently load before content bridge');
});

test('first-run and release prompts currently share top-right placement with adjacent z-indexes', () => {
  const firstRun = read('js/content/first_run_prompt.js');
  const release = read('js/content/release_notes_prompt.js');

  assert.match(firstRun, /PROMPT_ID = 'ft-first-run-refresh-prompt'/);
  assert.match(release, /PROMPT_ID = 'ft-release-notes-banner'/);

  for (const source of [firstRun, release]) {
    assert.match(source, /container\.style\.top = '16px'/);
    assert.match(source, /container\.style\.right = '16px'/);
    assert.match(source, /container\.style\.width = 'clamp\(280px, 32vw, 360px\)'/);
  }

  assert.match(firstRun, /container\.style\.zIndex = '2147483647'/);
  assert.match(release, /container\.style\.zIndex = '2147483646'/);
});

test('update path can make both refresh and release prompts eligible', () => {
  const background = read('js/background.js');
  const updateBlock = between(
    background,
    "} else if (details.reason === 'update') {",
    '        // You could handle migration of settings between versions here if needed'
  );

  assert.match(updateBlock, /buildReleaseNotesPayload\(CURRENT_VERSION\)/);
  assert.match(updateBlock, /releaseNotesPayload:\s*payload/);
  assert.match(updateBlock, /firstRunRefreshNeeded:\s*true/);
  assert.match(updateBlock, /files:\s*\['js\/content\/first_run_prompt\.js'\]/);
  assert.doesNotMatch(updateBlock, /releaseNotesSeenVersion:\s*CURRENT_VERSION/);
});

test('prompt completion and release ack messages currently lack trusted sender guard', () => {
  const background = read('js/background.js');
  const trustedGuard = 'function isTrustedUiSender';
  assert.ok(background.includes(trustedGuard), 'trusted UI guard should exist elsewhere');

  const releaseAckBlock = between(
    background,
    "} else if (action === 'FilterTube_ReleaseNotesAck') {",
    "} else if (action === 'FilterTube_FirstRunCheck') {"
  );
  const firstRunCompleteBlock = between(
    background,
    "} else if (action === 'FilterTube_FirstRunComplete') {",
    "} else if (action === 'FilterTube_OpenWhatsNew') {"
  );

  assert.match(releaseAckBlock, /releaseNotesSeenVersion:\s*version \|\| CURRENT_VERSION/);
  assert.match(firstRunCompleteBlock, /firstRunRefreshNeeded:\s*false/);
  assert.doesNotMatch(releaseAckBlock, /isTrustedUiSender/);
  assert.doesNotMatch(firstRunCompleteBlock, /isTrustedUiSender/);
});

test('release banner CTA currently passes caller URL to background tab-open action', () => {
  const release = read('js/content/release_notes_prompt.js');
  const background = read('js/background.js');

  assert.match(release, /const targetLink = WHATS_NEW_URL \|\| payload\.link/);
  assert.match(release, /action:\s*'FilterTube_OpenWhatsNew',\s*url:\s*targetLink/);

  const openBlock = between(
    background,
    "} else if (action === 'FilterTube_OpenWhatsNew') {",
    "} else if (action === 'FilterTube_SubscriptionsImportProgress') {"
  );
  assert.match(openBlock, /const url = request\?\.url \|\| WHATS_NEW_PAGE_URL/);
  assert.match(openBlock, /browserAPI\.tabs\.create\(\{\s*url:\s*url,\s*active:\s*true\s*\}/);
  assert.doesNotMatch(openBlock, /isTrustedUiSender/);
});

test('prompt surface currently has no central coordinator source token', () => {
  const sourceFiles = [
    'js/content/first_run_prompt.js',
    'js/content/release_notes_prompt.js',
    'js/background.js',
    'js/tab-view.js',
    'js/ui_components.js',
  ];
  const joined = sourceFiles.map(read).join('\n');

  for (const absentToken of [
    'PromptCoordinator',
    'promptQueue',
    'activePromptOwner',
    'FilterTubePromptCoordinator',
  ]) {
    assert.equal(joined.includes(absentToken), false, `unexpected coordinator token ${absentToken}`);
  }
});
