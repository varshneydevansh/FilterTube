import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const gatePath = 'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md';
const registerPath = 'docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md';
const objectivePath = 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md';

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

test('P0 fixture gate register documents counted backlog and non-completion', () => {
  const doc = read(registerPath);

  assert.match(doc, /Status: source-derived audit register/);
  assert.match(doc, /Completion is not proven/);
  assert.match(doc, /P0 fixture families: 23/);
  assert.match(doc, /P0 fixture names: 217/);
  assert.match(doc, /Behavior changes allowed before this wall is green: no/);
  assert.match(doc, /The implementation gate remains closed/);
});

test('P0 fixture family counts match the implementation readiness gate', () => {
  const gate = read(gatePath);
  const register = read(registerPath);
  const groups = parseP0Groups(gate);
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  assert.equal(groups.length, 23);
  assert.equal(total, 217);

  for (const group of groups) {
    const row = new RegExp(`\\| ${group.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\| ${group.items.length} \\|`);
    assert.match(register, row, `register must include count row for ${group.name}`);
  }
});

test('every P0 fixture name is unique snake_case and remains in the readiness gate', () => {
  const groups = parseP0Groups(read(gatePath));
  const allNames = groups.flatMap(group => group.items);
  const unique = new Set(allNames);

  assert.equal(unique.size, allNames.length);

  for (const name of allNames) {
    assert.match(name, /^[a-z0-9_]+$/, `fixture name must be snake_case: ${name}`);
  }
});

test('P0 register carries the five-way review convergence into auditable families', () => {
  const doc = read(registerPath);

  for (const phrase of [
    'JSON/renderers',
    'DOM/lifecycle',
    'Endpoint/network/performance',
    'Settings/mutation/security',
    'Release/static/native',
    'compactPlaylistRenderer',
    'showSheetCommand',
    'Members-only',
    'Fetch/XHR interception',
    'Nanah scoped apply',
    'native runtime sync'
  ]) {
    assert.ok(doc.includes(phrase), `missing convergence phrase ${phrase}`);
  }
});

test('P0 register preserves the highest-risk fixture clusters before implementation changes', () => {
  const doc = read(registerPath);

  for (const fixture of [
    'empty_blocklist_desktop_home_no_work',
    'seed_interception_no_rule_passes_through_without_parse',
    'quick_block_disabled_zero_lifecycle_work',
    'selector_authority_members_only_badge_does_not_hide_watch_shell_without_fixture',
    'watch_whitelist_mode_keeps_watch_metadata_and_rail_scaffolding_visible',
    'capture_traceability_collab_homepage_avatar_stack_false_positive',
    'set_list_mode_copy_false_does_not_clear_blocklist',
    'apply_settings_payload_cannot_override_background_revision',
    'content_script_channel_add_requires_allowed_youtube_action',
    'nanah_apply_requires_target_profile_authority'
  ]) {
    assert.ok(doc.includes(fixture), `missing high-risk fixture ${fixture}`);
  }
});

test('objective ledger and readiness gate point to the same blocked state as the P0 register', () => {
  const objective = read(objectivePath);
  const gate = read(gatePath);
  const register = read(registerPath);

  assert.ok(objective.includes('Completion is not proven'));
  assert.ok(objective.includes('NOT READY for implementation changes'));
  assert.ok(gate.includes('Implementation readiness: NOT READY for broad behavior changes'));
  assert.ok(gate.includes('Minimum Gate Before First Behavior Patch'));
  assert.ok(register.includes('The wall is not green'));
});
