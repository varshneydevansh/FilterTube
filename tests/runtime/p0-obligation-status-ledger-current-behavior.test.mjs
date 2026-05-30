import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const readinessPath = 'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md';
const ledgerPath = 'docs/audit/FILTERTUBE_P0_OBLIGATION_STATUS_LEDGER_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function parseP0Groups(text) {
  const block = text.match(/## Minimum Gate Before First Behavior Patch[\s\S]*?## Source Status/)?.[0] || '';
  const groups = [];
  let current = null;

  for (const line of block.split('\n')) {
    const groupMatch = line.match(/^P0 (.+):$/);
    if (groupMatch) {
      current = { name: groupMatch[1], items: [] };
      groups.push(current);
      continue;
    }

    const itemMatch = line.match(/^  ([a-z0-9_]+)$/);
    if (itemMatch && current) {
      current.items.push(itemMatch[1]);
    }
  }

  return groups;
}

test('P0 obligation status ledger is audit-only and keeps future proof separate from current proof', () => {
  const ledger = read(ledgerPath);

  assert.match(ledger, /Status: audit-only ledger/);
  assert.match(ledger, /This is not an implementation patch/);
  assert.match(ledger, /Runtime behavior is unchanged/);
  assert.match(ledger, /A current-behavior fixture can prove a gap\. It does not prove a fix/);
  assert.match(ledger, /family-current-proof/);
  assert.match(ledger, /obligation-current-gap/);
  assert.match(ledger, /future-proof-missing/);
  assert.match(ledger, /implementation-ready/);
});

test('P0 obligation status ledger matches readiness gate family and obligation counts', () => {
  const readiness = read(readinessPath);
  const ledger = read(ledgerPath);
  const groups = parseP0Groups(readiness);
  const obligationCount = groups.reduce((sum, group) => sum + group.items.length, 0);

  assert.equal(groups.length, 23);
  assert.equal(obligationCount, 217);

  assert.match(ledger, /P0 fixture families: 23/);
  assert.match(ledger, /P0 named obligations: 217/);
  assert.match(ledger, /families with current-behavior proof: 23/);
  assert.match(ledger, /obligations with future-behavior proof: 0/);
  assert.match(ledger, /implementation-ready obligations: 0/);
});

test('P0 obligation status ledger lists every readiness-gate family with current-only status', () => {
  const ledger = read(ledgerPath);
  const groups = parseP0Groups(read(readinessPath));

  for (const group of groups) {
    const expected = new RegExp(`\\| ${group.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\| ${group.items.length} \\| family-current-proof \\| future-proof-missing \\| blocked \\|`);
    assert.match(ledger, expected, `missing current-only status row for ${group.name}`);
  }
});

test('P0 obligation status ledger keeps all named obligations in readiness gate and snake case', () => {
  const readiness = read(readinessPath);
  const ledger = read(ledgerPath);
  const groups = parseP0Groups(readiness);

  for (const group of groups) {
    for (const item of group.items) {
      assert.match(item, /^[a-z0-9_]+$/, `${item} should be a stable fixture obligation name`);
      assert.ok(readiness.includes(item), `${item} should remain in readiness gate`);
    }
  }

  for (const example of [
    'empty_blocklist_desktop_home_no_work',
    'seed_next_watch_no_rule_pass_through',
    'keyword_exact_unicode_boundary_matches_json_and_dom',
    'watch_fullscreen_pauses_non_player_dom_work',
    'release_package_parity_github_release_is_draft_until_all_assets_upload'
  ]) {
    assert.ok(ledger.includes(example), `ledger should include example obligation ${example}`);
  }
});

test('P0 obligation status ledger defines future proof requirements before moving any obligation', () => {
  const ledger = read(ledgerPath);

  for (const token of [
    'the exact feature or method family',
    'route/surface and endpoint family',
    'settings mode and profile/lock state',
    'JSON/DOM/map/fallback source confidence',
    'DOM writes, fetches, storage writes, stats, messages',
    'tab opens, media/player actions, observers, listeners, timers, and RAFs',
    'positive fixtures',
    'negative fixtures',
    'teardown/restore/idempotence proof',
    'release/package/provenance proof'
  ]) {
    assert.ok(ledger.includes(token), `missing future-proof requirement ${token}`);
  }
});

test('P0 obligation status ledger names future runtime authorities without implementing them', () => {
  const ledger = read(ledgerPath);
  const runtimeSource = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js',
    'js/state_manager.js',
    'js/tab-view.js'
  ].map(read).join('\n');

  for (const authority of [
    'p0ObligationStatusAuthority',
    'futureBehaviorProofRegistry',
    'implementationReadyObligation'
  ]) {
    assert.ok(ledger.includes(authority), `ledger should name future authority ${authority}`);
    assert.doesNotMatch(runtimeSource, new RegExp(authority), `${authority} should not exist in runtime source yet`);
  }
});
