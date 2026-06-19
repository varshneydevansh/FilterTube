import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SOURCE_OF_TRUTH_CLAIM_REGISTER_2026-05-20.md';
const selfTestPath = 'tests/runtime/source-of-truth-claim-register-current-behavior.test.mjs';
const scanRoots = ['README.md', 'docs', 'js', 'tests', 'package.json'];
const excluded = new Set([docPath, selfTestPath]);
const sourceOfTruthPattern = /source[- ]of[- ]truth/i;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function walk(relativePath, result = []) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return result;
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath)) {
      walk(path.join(relativePath, entry), result);
    }
    return result;
  }
  result.push(relativePath.replaceAll(path.sep, '/'));
  return result;
}

function occurrenceRefs() {
  const refs = [];
  const files = scanRoots.flatMap((root) => walk(root));
  for (const file of files) {
    if (excluded.has(file)) continue;
    let source = '';
    try {
      source = read(file);
    } catch {
      continue;
    }
    source.split(/\r?\n/).forEach((line, index) => {
      if (sourceOfTruthPattern.test(line)) {
        refs.push(`${file}:${index + 1}`);
      }
    });
  }
  return refs.sort();
}

test('source of truth claim register is audit-only and keeps behavior unchanged', () => {
  const source = read(docPath);

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /documentation wording from silently becoming implementation permission/);
});

test('source of truth claim register accounts for every current exact wording occurrence', () => {
  const source = read(docPath);
  const refs = occurrenceRefs();

  assert.equal(refs.length, 95);
  assert.match(source, /exact source-of-truth wording occurrences: 95/);

  for (const ref of refs) {
    assert.ok(source.includes(ref), `missing source-of-truth claim ref ${ref}`);
  }
});

test('source of truth claim register separates narrow owners from effect authority', () => {
  const source = read(docPath);

  for (const claimClass of [
    'narrow-local-owner',
    'overbroad-runtime-risk',
    'audit-boundary',
    'historical-plan',
    'release-sync-owner',
    'misleading-identity-effect-risk'
  ]) {
    assert.ok(source.includes(claimClass), `missing claim class ${claimClass}`);
  }

  assert.match(source, /A video id is a join key, not channel identity/);
  assert.match(source, /not proof that runtime consumes each path or may mutate a renderer/);
  assert.match(source, /StateManager\/importer wording was changed/);
  assert.match(source, /source-confidence order, not a behavior authority/);
});

test('source of truth claim register requires authority proof before behavior changes', () => {
  const source = read(docPath);

  for (const field of [
    'claimReference',
    'claimedOwner',
    'route',
    'surface',
    'profileType',
    'listMode',
    'ruleState',
    'sourceTier',
    'confidenceClass',
    'allowedEffects',
    'forbiddenEffects',
    'positiveFixture',
    'negativeSiblingFixture',
    'restoreProof',
    'noRuleBudget',
    'teardownOrPauseProof'
  ]) {
    assert.ok(source.includes(field), `missing future proof field ${field}`);
  }
});

test('source of truth authority symbols are not implemented in runtime source yet', () => {
  const source = read(docPath);
  const runtime = ['js/background.js', 'js/content_bridge.js', 'js/filter_logic.js', 'js/seed.js', 'js/state_manager.js']
    .map((file) => read(file))
    .join('\n');

  for (const token of [
    'sourceOfTruthClaimAuthority',
    'sourceOfTruthEffectDecision',
    'identitySourceTruthDecision',
    'runtimeStateTruthReport'
  ]) {
    assert.match(source, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
