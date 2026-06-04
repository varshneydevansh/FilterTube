import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_ALIAS_INGRESS_PRESERVATION_CURRENT_BEHAVIOR_2026-05-21.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const finalMethodGapDocs = [
  'docs/audit/FILTERTUBE_ALIAS_INGRESS_PRESERVATION_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_STALE_ALIAS_FALSE_HIDE_CHAIN_2026-05-20.md',
  'docs/audit/FILTERTUBE_PERFORMANCE_CLAIM_EVIDENCE_BOUNDARY_2026-05-20.md',
  'docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

test('alias ingress preservation doc is audit-only and extends stale alias proof', () => {
  const doc = read(docPath);

  for (const phrase of [
    'Status: current-behavior proof',
    'Updated by the 2026-05-26 release regression fixes',
    'This slice extends the visible-empty/stale-alias false-hide audit',
    'normal Main save/compile paths prefer canonical',
    'Nanah scoped Main apply',
    'Full-profile import merge',
    'Target-profile import write',
    'StateManager direct Main persistence',
    'Shared settings save',
    'Background compile',
    'aliasIngressDecision',
    'current alias normalization boundary',
    'proof still needed before deleting migration aliases completely'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase: ${phrase}`);
  }
});

test('final alias performance and runtime audit docs carry the method proof gap blocker', () => {
  const methodGap = read(methodGapPath);

  assert.match(methodGap, /tracked JS\/JSX\/MJS files: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5812/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5812/);

  for (const finalDocPath of finalMethodGapDocs) {
    const finalDoc = read(finalDocPath);

    assert.ok(finalDoc.includes(methodGapPath), `${finalDocPath} should cite method semantic proof gap index`);
    assert.match(finalDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(finalDoc, /method semantic proof gap files covered: 69/);
    assert.match(finalDoc, /method semantic proof gap lexical callables covered: 5812/);
    assert.match(finalDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(finalDoc, /lexical callables requiring semantic proof before behavior changes: 5812/);
    assert.match(finalDoc, /affected callable semantic proof: NO-GO/);
    assert.match(finalDoc, /runtime behavior changed: no/);
    assert.match(finalDoc, /do not approve runtime\s+optimization/);
    assert.match(finalDoc, /JSON-first behavior/);
    assert.match(finalDoc, /whitelist behavior changes/);
  }
});

test('Nanah scoped Main apply normalizes Main blocked aliases after canonical list writes', () => {
  const source = read('js/nanah_sync_adapter.js');
  const block = sliceBetween(
    source,
    "if (scope === 'main') {",
    'profiles[resolvedTargetProfileId] = {'
  );

  assert.match(block, /const currentMain = safeObject\(activeProfile\.main\);/);
  assert.match(block, /const incomingChannels = Array\.isArray\(data\.channels\) \? data\.channels : data\.blockedChannels/);
  assert.match(block, /const incomingKeywords = Array\.isArray\(data\.keywords\) \? data\.keywords : data\.blockedKeywords/);
  assert.match(block, /const nextMain = normalizeMainProfileAliasFields\(\{\s*\.\.\.currentMain,\s*\.\.\.data,/);
  assert.match(block, /channels: replace\s*\?\s*safeArray\(incomingChannels\)\s*:\s*mergeChannelLists\(currentMain\.channels, incomingChannels\)/);
  assert.match(block, /keywords: replace\s*\?\s*normalizeKeywordList\(incomingKeywords\)\s*:\s*mergeKeywordLists\(currentMain\.keywords, incomingKeywords\)/);
  assert.match(source, /out\.blockedChannels = out\.channels/);
  assert.match(source, /out\.blockedKeywords = out\.keywords/);
  assert.doesNotMatch(block, /delete\s+.*blockedKeywords/);
  assert.doesNotMatch(block, /delete\s+.*blockedChannels/);
  assert.doesNotMatch(block, /aliasIngressDecision|visibleRuntimeRuleAuthority|aliasConflict/);
});

test('full-profile import merge normalizes Main aliases after canonical list merges', () => {
  const source = read('js/io_manager.js');
  const block = sliceBetween(
    source,
    'for (const [profileId, incProfileRaw] of Object.entries(incomingProfiles))',
    'nextV4 = {'
  );

  const mainBlock = sliceBetween(block, 'main: normalizeMainProfileAliasFields({', 'kids: {');

  assert.match(block, /const existingMain = safeObject\(existingProfile\.main\);/);
  assert.match(block, /const incMain = safeObject\(incProfile\.main\);/);
  assert.match(mainBlock, /\.\.\.existingMain,\s*\.\.\.incMain,/);
  assert.match(mainBlock, /channels: mergeChannelLists\(existingMain\.channels, incMain\.channels\)/);
  assert.match(mainBlock, /keywords: mergeKeywordLists\(existingMain\.keywords, incMain\.keywords\)/);
  assert.match(source, /out\.blockedChannels = out\.channels/);
  assert.match(source, /out\.blockedKeywords = out\.keywords/);
  assert.doesNotMatch(mainBlock, /delete\s+.*blockedKeywords|delete\s+.*blockedChannels/);
  assert.doesNotMatch(mainBlock, /aliasIngressDecision|visibleRuntimeRuleAuthority|aliasConflict/);
});

test('target-profile import write normalizes Main aliases after canonical list writes', () => {
  const source = read('js/io_manager.js');
  const block = sliceBetween(
    source,
    'profiles[targetProfileId] = {',
    'await saveProfilesV4({'
  );

  assert.match(block, /main: normalizeMainProfileAliasFields\(\{\s*\.\.\.targetMain,/);
  assert.match(block, /channels: targetNextChannels/);
  assert.match(block, /keywords: targetNextKeywords/);
  assert.match(block, /whitelistChannels: safeArray\(desiredMainWhitelistChannels\)/);
  assert.match(block, /whitelistKeywords: safeArray\(desiredMainWhitelistKeywords\)/);
  assert.doesNotMatch(block, /delete\s+.*blockedKeywords/);
  assert.doesNotMatch(block, /delete\s+.*blockedChannels/);
  assert.doesNotMatch(block, /aliasIngressDecision|visibleRuntimeRuleAuthority|aliasConflict/);
});

test('StateManager direct Main profile persistence normalizes blocked aliases before saveProfilesV4', () => {
  const source = read('js/state_manager.js');
  const helper = sliceBetween(
    source,
    'function normalizeMainProfileAliasFields(main) {',
    'async function persistMainProfiles(nextMain)'
  );
  const persist = sliceBetween(
    source,
    'async function persistMainProfiles(nextMain) {',
    'async function persistKidsProfiles(nextKids)'
  );

  assert.match(helper, /out\.blockedChannels = out\.channels/);
  assert.match(helper, /out\.blockedKeywords = out\.keywords/);
  assert.match(helper, /out\.blockedChannels = \[\]/);
  assert.match(helper, /out\.blockedKeywords = \[\]/);
  assert.match(persist, /main: normalizeMainProfileAliasFields\(\{/);
  assert.match(persist, /await io\.saveProfilesV4\(nextProfiles\)/);
});

test('shared settings save syncs Main blocklist aliases while background compile prefers canonical rows', () => {
  const sharedBlock = sliceBetween(
    read('js/settings_shared.js'),
    'const existingMain = safeObject(activeProfile.main);',
    'profiles[activeId] = {'
  );
  const background = read('js/background.js');
  const keywordCompile = sliceBetween(
    background,
    'const v4KeywordEntries = shouldUseKidsProfile',
    'if (v4KeywordEntries) {'
  );
  const channelCompile = sliceBetween(
    background,
    'const storedChannels = shouldUseKidsProfile',
    'let compiledChannels = [];'
  );

  assert.match(sharedBlock, /channels: sanitizedChannels/);
  assert.match(sharedBlock, /keywords: sanitizedKeywords/);
  assert.match(sharedBlock, /nextMainProfile\.blockedChannels = sanitizedChannels;/);
  assert.match(sharedBlock, /nextMainProfile\.blockedKeywords = sanitizedKeywords;/);
  assert.ok(keywordCompile.indexOf('activeMain.keywords') < keywordCompile.indexOf('activeMain.blockedKeywords'));
  assert.ok(channelCompile.indexOf('activeMain.channels') < channelCompile.indexOf('activeMain.blockedChannels'));
  assert.match(channelCompile, /activeMain\.blockedChannels/);
  assert.doesNotMatch(sharedBlock + keywordCompile + channelCompile, /aliasIngressDecision|visibleRuntimeRuleAuthority|aliasConflict/);
});

test('central ledgers include alias ingress as a blocker before stale-alias cleanup', () => {
  const objective = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const fixOrder = read('docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md');

  assert.match(objective, /Alias-ingress preservation addendum/);
  assert.match(objective, /FILTERTUBE_ALIAS_INGRESS_PRESERVATION_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(objective, /alias-ingress-preservation-current-behavior\.test\.mjs/);
  assert.match(objective, /Nanah scoped Main apply/);
  assert.match(objective, /full-profile import merge/);
  assert.match(objective, /target-profile import write/);

  assert.match(fixOrder, /Alias ingress and preservation/);
  assert.match(fixOrder, /aliasIngressDecision/);
  assert.match(fixOrder, /Nanah scoped Main apply, full-profile import merge, target-profile import write, and shared settings save/);
});
