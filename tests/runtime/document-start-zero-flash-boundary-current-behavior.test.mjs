import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_DOCUMENT_START_ZERO_FLASH_BOUNDARY_2026-05-21.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

test('document_start_zero_flash_boundary_is_audit_only_and_runtime_unchanged', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /document-start seed\s+injection exists to catch YouTube JSON and page globals as early as possible/);
  assert.match(source, /not a global guarantee that every route is filtered before paint/);
  assert.match(source, /not permission to spend endpoint\/body\/DOM work when no active rule can use/);
});

test('document_start_zero_flash_boundary_is_backed_by_current_seed_startup_shape', () => {
  const source = doc();
  const seed = read('js/seed.js');

  assert.match(source, /manifest document_start/);
  assert.match(source, /establishDataHooks\(\)/);
  assert.match(source, /setupFetchInterception\(\)/);
  assert.match(source, /setupXhrInterception\(\)/);
  assert.match(source, /filterTubeSeedReady event/);

  assert.match(seed, /Must run before YouTube scripts to ensure zero-flash filtering/);
  assert.match(seed, /establishDataHooks\(\);/);
  assert.match(seed, /setupFetchInterception\(\);/);
  assert.match(seed, /setupXhrInterception\(\);/);
  assert.match(seed, /new CustomEvent\('filterTubeSeedReady'/);
});

test('document_start_zero_flash_boundary_rejects_global_prepaint_and_zero_work_claims', () => {
  const source = doc();

  for (const phrase of [
    'all blocked content is removed before paint',
    'all routes are zero-flash',
    'empty installs are zero-work',
    'fallback resolvers can be deleted',
    'DOM fallback can trust video-id-only surfaces',
    'Empty blocklist or disabled states can still install hooks',
    'Watch, Shorts, playlist, Kids, YTM, collaborators, posts, and weak menu'
  ]) {
    assert.ok(source.includes(phrase), `missing boundary phrase: ${phrase}`);
  }
  assert.match(source, /not every\s+early payload can still enforce after first paint/);
});

test('document_start_zero_flash_boundary_connects_to_current_empty_install_and_queue_risks', () => {
  const source = doc();
  const seedDoc = read('docs/audit/FILTERTUBE_SEED_INITIAL_GLOBAL_HOOK_CURRENT_BEHAVIOR_2026-05-19.md');
  const emptyDoc = read('docs/audit/FILTERTUBE_EMPTY_INSTALL_PERFORMANCE_AUDIT_2026-05-18.md');
  const xhrDoc = read('docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md');

  assert.match(source, /first\s+source of empty-install lag/);
  assert.match(source, /clone \/ stringify \/ parse \/ process \/ queue payloads/);
  assert.match(source, /settings later prove no active rule needed the work/);
  assert.match(seedDoc, /Missing settings queue/);
  assert.match(seedDoc, /Queue replay/);
  assert.match(seedDoc, /zero-flash behavior without fixture proof/);
  assert.match(emptyDoc, /empty filters|empty blocklist|no-rule/i);
  assert.match(xhrDoc, /skip per-request ready-state\/load hooks/);
  assert.match(xhrDoc, /attach readystatechange\/load hooks/);
});

test('document_start_zero_flash_boundary_lists_future_prepaint_work_decision_contract', () => {
  const source = doc();

  for (const phrase of [
    'which endpoint/global is being observed',
    'whether settings are loaded',
    'whether active rules can use the payload',
    'route/surface supports JSON mutation or harvest-only work',
    'whether the response can still be rewritten before YouTube consumes it',
    'no-work behavior for empty blocklist, empty whitelist, and disabled state',
    'player-response metadata versus mutation policy',
    'queue retention and replay budget',
    'negative proof that nonmatching siblings remain visible'
  ]) {
    assert.ok(source.includes(phrase), `missing future proof phrase: ${phrase}`);
  }
});

test('document_start_zero_flash_boundary_confirms_missing_authority_tokens', () => {
  const source = doc();
  const runtime = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/background.js'
  ].map(read).join('\n');

  for (const token of [
    'documentStartWorkDecision',
    'zeroFlashClaimAuthority',
    'prePaintMutationDecision',
    'seedNoWorkDecision',
    'initialGlobalReplayBudget'
  ]) {
    assert.match(source, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
