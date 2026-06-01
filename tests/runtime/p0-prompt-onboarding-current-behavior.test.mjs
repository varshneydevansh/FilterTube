import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_P0_PROMPT_ONBOARDING_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

function isolatedScripts(manifestFile) {
  const manifest = readJson(manifestFile);
  return manifest.content_scripts.find((entry) =>
    Array.isArray(entry.js) && entry.js.includes('js/content/release_notes_prompt.js')
  )?.js || [];
}

const p0Fixtures = [
  'install_shows_one_prompt_owner',
  'update_prompt_priority_is_explicit',
  'replay_prompt_has_named_owner',
  'prompt_ack_rejects_wrong_sender_class',
  'whats_new_url_is_allowlisted',
  'prompt_overlay_fits_mobile_viewport',
  'current_manifest_version_has_release_note_entry'
];

test('P0 prompt onboarding doc lists fixture family and blocked verdict', () => {
  const doc = read(docPath);
  const readiness = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');

  for (const fixture of p0Fixtures) {
    assert.ok(doc.includes(fixture), `doc missing ${fixture}`);
    assert.ok(readiness.includes(fixture), `readiness gate missing ${fixture}`);
    assert.ok(register.includes(fixture), `P0 register missing ${fixture}`);
  }

  for (const token of [
    'P0 prompt/onboarding family is not green',
    'PromptCoordinator',
    'promptCoordinator',
    'senderClass',
    'viewportFit',
    'Runtime behavior remains unchanged'
  ]) {
    assert.ok(doc.includes(token), `doc missing token ${token}`);
  }
});

test('install_shows_one_prompt_owner is only source-local today, not authority-backed', () => {
  const background = read('js/background.js');
  const installBlock = sliceBetween(
    background,
    "if (details.reason === 'install') {",
    "} else if (details.reason === 'update') {"
  );

  assert.match(installBlock, /firstRunRefreshNeeded:\s*true/);
  assert.match(installBlock, /releaseNotesSeenVersion:\s*CURRENT_VERSION/);
  assert.match(installBlock, /files:\s*\['js\/content\/first_run_prompt\.js'\]/);
  assert.doesNotMatch(installBlock, /PromptCoordinator|promptQueue|activePromptOwner|promptCoordinator/);
});

test('update_prompt_priority_is_explicit is not satisfied today', () => {
  const background = read('js/background.js');
  const updateBlock = sliceBetween(
    background,
    "} else if (details.reason === 'update') {",
    '        // You could handle migration of settings between versions here if needed'
  );

  assert.match(updateBlock, /buildReleaseNotesPayload\(CURRENT_VERSION\)/);
  assert.match(updateBlock, /releaseNotesPayload:\s*payload/);
  assert.match(updateBlock, /firstRunRefreshNeeded:\s*true/);
  assert.match(updateBlock, /files:\s*\['js\/content\/first_run_prompt\.js'\]/);
  assert.doesNotMatch(updateBlock, /promptPriority|PromptCoordinator|activePromptOwner|releaseNotesSeenVersion:\s*CURRENT_VERSION/);

  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const scripts = isolatedScripts(manifestFile);
    assert.ok(scripts.includes('js/content/release_notes_prompt.js'), `${manifestFile} missing release prompt`);
    assert.ok(scripts.includes('js/content/first_run_prompt.js'), `${manifestFile} missing first-run prompt`);
  }
});

test('replay_prompt_has_named_owner is not satisfied today', () => {
  const source = [
    'js/content/first_run_prompt.js',
    'js/content/release_notes_prompt.js',
    'js/background.js',
    'js/tab-view.js',
    'js/popup.js',
    'js/ui_components.js'
  ].map(read).join('\n');

  for (const absent of [
    'PromptCoordinator',
    'promptQueue',
    'activePromptOwner',
    'FilterTube_ReplayPrompt',
    'FilterTube_ReplayCoachmark',
    'coachmarkReplay'
  ]) {
    assert.equal(source.includes(absent), false, `unexpected prompt owner token ${absent}`);
  }
});

test('prompt_ack_rejects_wrong_sender_class is not satisfied today', () => {
  const background = read('js/background.js');
  const releaseAckBlock = sliceBetween(
    background,
    "} else if (action === 'FilterTube_ReleaseNotesAck') {",
    "} else if (action === 'FilterTube_FirstRunCheck') {"
  );
  const firstRunCompleteBlock = sliceBetween(
    background,
    "} else if (action === 'FilterTube_FirstRunComplete') {",
    "} else if (action === 'FilterTube_OpenWhatsNew') {"
  );

  assert.ok(background.includes('function isTrustedUiSender'), 'trusted sender helper should exist elsewhere');
  assert.match(releaseAckBlock, /releaseNotesSeenVersion:\s*version \|\| CURRENT_VERSION/);
  assert.match(firstRunCompleteBlock, /firstRunRefreshNeeded:\s*false/);
  for (const block of [releaseAckBlock, firstRunCompleteBlock]) {
    assert.doesNotMatch(block, /isTrustedUiSender|promptCapability|senderClass|ownedPromptInstance/);
  }
});

test('whats_new_url_is_allowlisted is not satisfied today', () => {
  const release = read('js/content/release_notes_prompt.js');
  const background = read('js/background.js');
  const releaseBlock = sliceBetween(
    release,
    'const targetLink = WHATS_NEW_URL || payload.link;',
    'actions.appendChild(learnBtn);'
  );
  const openBlock = sliceBetween(
    background,
    "} else if (action === 'FilterTube_OpenWhatsNew') {",
    "} else if (action === 'FilterTube_SubscriptionsImportProgress') {"
  );

  assert.match(releaseBlock, /action:\s*'FilterTube_OpenWhatsNew',\s*url:\s*targetLink/);
  assert.match(releaseBlock, /window\.open\(targetLink, '_blank', 'noopener'\)/);
  assert.match(releaseBlock, /location\.href = targetLink/);
  assert.match(openBlock, /const url = request\?\.url \|\| WHATS_NEW_PAGE_URL/);
  assert.match(openBlock, /browserAPI\.tabs\.create\(\{ url: url, active: true \}/);
  assert.doesNotMatch(openBlock, /allowedWhatsNewUrl|externalNavigationAuthority|urlClass|WHATS_NEW_PAGE_URL\s*===\s*url/);
});

test('prompt_overlay_fits_mobile_viewport is only partial today', () => {
  const firstRun = read('js/content/first_run_prompt.js');
  const release = read('js/content/release_notes_prompt.js');

  for (const source of [firstRun, release]) {
    assert.match(source, /container\.style\.top = '16px'/);
    assert.match(source, /container\.style\.right = '16px'/);
    assert.match(source, /container\.style\.width = 'clamp\(280px, 32vw, 360px\)'/);
    assert.match(source, /@media \(max-width: 600px\)/);
    assert.match(source, /left: 12px;/);
    assert.match(source, /right: 12px;/);
    assert.doesNotMatch(source, /visualViewport|safe-area-inset|env\(safe-area|youtubeChrome|arrowPosition|viewportFit/);
  }

  assert.match(firstRun, /container\.style\.zIndex = '2147483647'/);
  assert.match(release, /container\.style\.zIndex = '2147483646'/);
});

test('current_manifest_version_has_release_note_entry is locally satisfied today', () => {
  const packageVersion = readJson('package.json').version;
  const manifestVersions = ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']
    .map(file => readJson(file).version);
  const releaseNoteVersions = readJson('data/release_notes.json')
    .filter(entry => entry && typeof entry.version === 'string')
    .map(entry => entry.version);

  assert.equal(packageVersion, '3.3.2');
  assert.deepEqual([...new Set(manifestVersions)], [packageVersion]);
  assert.ok(releaseNoteVersions.includes(packageVersion));
  assert.equal(releaseNoteVersions[0], '3.3.2');
});

test('product source has no promptCoordinator implementation yet', () => {
  const source = [
    'js/content/first_run_prompt.js',
    'js/content/release_notes_prompt.js',
    'js/background.js',
    'js/tab-view.js',
    'js/ui_components.js',
    'js/popup.js'
  ].map(read).join('\n');

  assert.doesNotMatch(source, /\bpromptCoordinator\b|\bPromptCoordinator\b|\bactivePromptOwner\b|\bpromptQueue\b/);
});
