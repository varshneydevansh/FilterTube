import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const readinessPath = 'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md';
const docPath = 'docs/audit/FILTERTUBE_P0_FAMILY_PROOF_COVERAGE_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
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

const familyProofs = {
  'no-work': {
    doc: 'docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md',
    test: 'tests/runtime/p0-no-work-current-behavior.test.mjs'
  },
  'endpoint policy': {
    doc: 'docs/audit/FILTERTUBE_P0_ENDPOINT_POLICY_CURRENT_BEHAVIOR_2026-05-18.md',
    test: 'tests/runtime/p0-endpoint-policy-current-behavior.test.mjs'
  },
  'network/fetch authority': {
    doc: 'docs/audit/FILTERTUBE_P0_NETWORK_AUTHORITY_CURRENT_BEHAVIOR_2026-05-18.md',
    test: 'tests/runtime/p0-network-authority-current-behavior.test.mjs'
  },
  'external navigation/link authority': {
    doc: 'docs/audit/FILTERTUBE_P0_EXTERNAL_NAVIGATION_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-external-navigation-current-behavior.test.mjs'
  },
  'release package parity': {
    doc: 'docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-release-package-current-behavior.test.mjs'
  },
  'native runtime sync authority': {
    doc: 'docs/audit/FILTERTUBE_P0_NATIVE_RUNTIME_SYNC_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-native-runtime-sync-current-behavior.test.mjs'
  },
  'content/category predicates': {
    doc: 'docs/audit/FILTERTUBE_P0_CONTENT_CATEGORY_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-content-category-current-behavior.test.mjs'
  },
  'keyword match authority': {
    doc: 'docs/audit/FILTERTUBE_P0_KEYWORD_MATCH_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-keyword-match-current-behavior.test.mjs'
  },
  'stats/time-saved authority': {
    doc: 'docs/audit/FILTERTUBE_P0_STATS_TIME_SAVED_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-stats-time-saved-current-behavior.test.mjs'
  },
  'backup/export authority': {
    doc: 'docs/audit/FILTERTUBE_P0_BACKUP_EXPORT_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-backup-export-current-behavior.test.mjs'
  },
  'profile/viewing-space authority': {
    doc: 'docs/audit/FILTERTUBE_P0_PROFILE_VIEWING_SPACE_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-profile-viewing-space-current-behavior.test.mjs'
  },
  'watch/player control authority': {
    doc: 'docs/audit/FILTERTUBE_P0_WATCH_PLAYER_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-watch-player-current-behavior.test.mjs'
  },
  'capture fixture traceability': {
    doc: 'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-capture-fixture-traceability-current-behavior.test.mjs'
  },
  'message trust': {
    doc: 'docs/audit/FILTERTUBE_P0_MESSAGE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-message-mutation-current-behavior.test.mjs'
  },
  lifecycle: {
    doc: 'docs/audit/FILTERTUBE_P0_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-18.md',
    test: 'tests/runtime/p0-lifecycle-current-behavior.test.mjs'
  },
  'hide/restore authority': {
    doc: 'docs/audit/FILTERTUBE_P0_HIDE_RESTORE_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-hide-restore-current-behavior.test.mjs'
  },
  'selector authority': {
    doc: 'docs/audit/FILTERTUBE_P0_SELECTOR_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-selector-authority-current-behavior.test.mjs'
  },
  'storage/cache key authority': {
    doc: 'docs/audit/FILTERTUBE_P0_STORAGE_CACHE_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-storage-cache-current-behavior.test.mjs'
  },
  mutation: {
    doc: 'docs/audit/FILTERTUBE_P0_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-mutation-current-behavior.test.mjs'
  },
  'prompt/onboarding': {
    doc: 'docs/audit/FILTERTUBE_P0_PROMPT_ONBOARDING_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-prompt-onboarding-current-behavior.test.mjs'
  },
  'manifest/permission': {
    doc: 'docs/audit/FILTERTUBE_P0_MANIFEST_PERMISSION_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-manifest-permission-current-behavior.test.mjs'
  },
  'security/PIN lock': {
    doc: 'docs/audit/FILTERTUBE_P0_SECURITY_PIN_LOCK_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-security-pin-lock-current-behavior.test.mjs'
  },
  'rule mutation authority': {
    doc: 'docs/audit/FILTERTUBE_P0_RULE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md',
    test: 'tests/runtime/p0-rule-mutation-current-behavior.test.mjs'
  }
};

test('P0 family proof coverage documents all readiness-gate families without opening the gate', () => {
  const doc = read(docPath);
  const readiness = read(readinessPath);
  const groups = parseP0Groups(readiness);

  assert.equal(groups.length, 23);
  assert.equal(Object.keys(familyProofs).length, 23);
  assert.match(doc, /Every readiness-gate P0 family has at least one current-behavior proof slice/);
  assert.match(doc, /No readiness-gate P0 family has future-behavior proof yet/);
  assert.match(doc, /The implementation gate remains closed/);

  for (const group of groups) {
    assert.ok(doc.includes(`| ${group.name} |`), `missing family row ${group.name}`);
  }
});

test('every readiness-gate P0 family has an existing doc and runtime proof test', () => {
  const groups = parseP0Groups(read(readinessPath));

  for (const group of groups) {
    const proof = familyProofs[group.name];
    assert.ok(proof, `missing proof mapping for ${group.name}`);
    assert.ok(exists(proof.doc), `missing proof doc for ${group.name}: ${proof.doc}`);
    assert.ok(exists(proof.test), `missing proof test for ${group.name}: ${proof.test}`);

    const coverageDoc = read(docPath);
    assert.ok(coverageDoc.includes(proof.doc), `coverage doc should cite ${proof.doc}`);
    assert.ok(coverageDoc.includes(proof.test), `coverage doc should cite ${proof.test}`);
  }
});

test('P0 family proof docs preserve current-behavior and blocked implementation wording', () => {
  for (const [family, proof] of Object.entries(familyProofs)) {
    const text = read(proof.doc);
    assert.match(text, /current-behavior proof|current-behavior proof slice|current-behavior proof\.|current-behavior audit only|proof-only current-behavior slice|Current Behavior Fixtures/i, `${family} doc should be current-behavior proof`);
    assert.match(text, /not an implementation patch|does not change[\s\S]{0,160}runtime behavior|does not change build output/i, `${family} doc should reject implementation patch status`);
    assert.match(text, /not green|not implementation-ready|blocked|not prove future behavior|Runtime behavior remains unchanged|keep this current-behavior proof green/i, `${family} doc should keep future behavior blocked`);
  }
});

test('P0 family proof coverage keeps fixture names in the readiness gate', () => {
  const readiness = read(readinessPath);
  const groups = parseP0Groups(readiness);

  for (const group of groups) {
    assert.ok(group.items.length > 0, `${group.name} should have fixture names`);
    for (const fixture of group.items) {
      assert.ok(readiness.includes(fixture), `readiness gate should retain ${fixture}`);
      assert.match(fixture, /^[a-z0-9_]+$/, `fixture name should remain snake_case: ${fixture}`);
    }
  }
});

test('supplemental P0 slices are cited as blockers without changing the 23-family wall', () => {
  const doc = read(docPath);
  const supplemental = [
    'docs/audit/FILTERTUBE_P0_COMPILED_RULE_STATE_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_P0_DOM_RENDERER_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_P0_RENDERER_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_P0_SETTINGS_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_P0_LEARNED_IDENTITY_CURRENT_BEHAVIOR_2026-05-19.md'
  ];

  for (const file of supplemental) {
    assert.ok(exists(file), `missing supplemental proof ${file}`);
    assert.ok(doc.includes(file), `coverage doc should cite supplemental proof ${file}`);
  }

  assert.equal(parseP0Groups(read(readinessPath)).length, 23);
});
