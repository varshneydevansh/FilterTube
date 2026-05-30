import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SYNTHETIC_EVENT_ACTION_REGISTER_2026-05-20.md';

const pageRuntimeFiles = [
  'js/content_bridge.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/injector.js',
  'js/seed.js',
  'js/content/bridge_settings.js',
  'js/content/collab_dialog.js',
  'js/content/first_run_prompt.js',
  'js/content/release_notes_prompt.js',
  'js/content/handle_resolver.js',
  'js/content/dom_helpers.js'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function syntheticActionRefs() {
  const refs = [];
  for (const file of pageRuntimeFiles) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/\.click\s*\(/.test(line)) {
        refs.push({ ref: `${file}:${index + 1}`, family: 'click', line: line.trim() });
      }
      if (/\.dispatchEvent\s*\(/.test(line)) {
        refs.push({ ref: `${file}:${index + 1}`, family: 'dispatchEvent', line: line.trim() });
      }
    });
  }
  return refs.sort((a, b) => a.ref.localeCompare(b.ref) || a.family.localeCompare(b.family));
}

function runtimeSource() {
  return pageRuntimeFiles.map(read).join('\n');
}

test('synthetic event/action register is audit-only and keeps runtime unchanged', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /source code cannot prove YouTube's recommendation model/);
});

test('synthetic event/action register enumerates every current page-runtime click and dispatch write', () => {
  const doc = read(docPath);
  const refs = syntheticActionRefs();
  const clickRefs = refs.filter((entry) => entry.family === 'click');
  const dispatchRefs = refs.filter((entry) => entry.family === 'dispatchEvent');
  const fileCount = new Set(refs.map((entry) => entry.ref.split(':')[0])).size;

  assert.equal(refs.length, 18);
  assert.equal(clickRefs.length, 8);
  assert.equal(dispatchRefs.length, 10);
  assert.equal(fileCount, 5);

  assert.match(doc, /page-runtime synthetic event\/action writes: 18/);
  assert.match(doc, /direct click calls: 8/);
  assert.match(doc, /direct dispatchEvent calls: 10/);
  assert.match(doc, /files with direct synthetic actions: 5/);

  for (const { ref } of refs) {
    assert.ok(doc.includes(ref), `missing synthetic event/action ref ${ref}`);
  }
});

test('synthetic event/action register separates observable risk classes', () => {
  const doc = read(docPath);

  for (const riskClass of [
    'menu-cleanup-event',
    'watch-playlist-navigation-click',
    'generic-target-click',
    'subscription-import-automation',
    'readiness-event'
  ]) {
    assert.ok(doc.includes(riskClass), `missing risk class ${riskClass}`);
  }

  assert.match(doc, /Correct skip\/block behavior can still look like navigation/);
  assert.match(doc, /must remain impossible during passive filtering/);
  assert.match(doc, /startup authority/);
});

test('synthetic event/action register is backed by current source snippets', () => {
  const bridge = read('js/content_bridge.js');
  const blockChannel = read('js/content/block_channel.js');
  const fallback = read('js/content/dom_fallback.js');
  const injector = read('js/injector.js');
  const seed = read('js/seed.js');

  assert.match(bridge, /dropdown\.dispatchEvent\(escapeEvent\)/);
  assert.match(bridge, /closeTarget\.dispatchEvent\(escapeEvent\)/);
  assert.match(bridge, /ytdApp\.dispatchEvent\(clickEvent\)/);
  assert.match(bridge, /popup\.dispatchEvent\(new CustomEvent\('iron-resize'/);
  assert.match(blockChannel, /dropdown\.dispatchEvent\(new KeyboardEvent\('keydown'/);
  assert.match(fallback, /clickable\.click\(\)/);
  assert.match(fallback, /targetLink\.click\(\)/);
  assert.match(fallback, /nextButton\.click\(\)/);
  assert.match(fallback, /nextBtn\.click\(\)/);
  assert.match(fallback, /target\.click\(\)/);
  assert.match(injector, /window\.dispatchEvent\(new Event\('scroll'\)\)/);
  assert.match(injector, /button\.click\(\)/);
  assert.match(injector, /window\.dispatchEvent\(new CustomEvent\('filterTubeReady'\)\)/);
  assert.match(seed, /window\.dispatchEvent\(new CustomEvent\('filterTubeSeedReady'/);
});

test('synthetic event/action authority symbols are absent from runtime source today', () => {
  const doc = read(docPath);
  const source = runtimeSource();

  for (const token of [
    'syntheticEventActionAuthority',
    'observableActionBudget',
    'syntheticClickDecision',
    'syntheticDispatchDecision',
    'navigationSideEffectBudget',
    'userInitiatedActionProof'
  ]) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(source, new RegExp(token));
  }
});
