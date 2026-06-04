import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_NANAH_SYNC_ADAPTER_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/nanah_sync_adapter.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

function groupForMethod(name) {
  if ([
    'normalizeString',
    'normalizeScope',
    'safeObject',
    'safeArray',
    'normalizeNonNegativeInteger',
    'parsePackedChannelKeywordSource',
    'normalizeKeywordEntry',
    'normalizeKeywordList',
    'keywordKey',
    'channelKey',
    'mergeKeywordLists',
    'mergeChannelLists',
    'mergeStringLists',
    'normalizeMainProfileAliasFields',
    'applyMainSurfaceData',
    'applyKidsSurfaceData',
    'cloneJson'
  ].includes(name)) {
    return 'nanahDefensiveNormalizationAndMerge';
  }
  if (['buildScopedPortablePayload', 'applyScopedPortablePayload'].includes(name)) {
    return 'nanahScopedPortableProfileTransfer';
  }
  if ([
    'stableManagedNanahJson',
    'buildManagedPolicyHash',
    'buildManagedPolicyPayloadHash',
    'decodeManagedNanahBase64Url',
    'encodeManagedNanahBase64Url',
    'getManagedNanahSourcePublicKeyJwk',
    'buildManagedPolicySignedFields',
    'createManagedNanahSigningKeyPair',
    'signManagedPolicyEnvelope',
    'verifyManagedNanahPolicyIntegritySignature'
  ].includes(name)) {
    return 'nanahManagedPolicyIntegrityVerifier';
  }
  if ([
    'normalizeManagedPolicyScope',
    'validationResult',
    'getManagedPayloadScopeFamily',
    'validateManagedPayloadScope',
    'validateManagedIntegrityBinding',
    'managedPolicyProfileMap',
    'getAcceptedManagedPolicyState',
    'normalizeMailboxTimestampMs',
    'validateManagedPolicyEnvelope',
    'getManagedMailboxEnvelope',
    'validateManagedMailboxBinding',
    'validateManagedMailboxItem'
  ].includes(name)) {
    return 'nanahManagedPolicyEnvelopeValidation';
  }
  if ([
    'managedPayloadSurface',
    'managedPayloadListKind',
    'managedPayloadReplace',
    'managedOperationKind',
    'managedKeywordFromOperation',
    'managedChannelFromOperation',
    'managedVideoIdFromOperation',
    'mergeWithFactory',
    'removeEntriesByKeys',
    'applyManagedListPayload',
    'applyManagedKeywordPolicy',
    'applyManagedChannelPolicy',
    'applyManagedVideoPolicy',
    'applyManagedViewingSpacePolicy',
    'applyManagedTimeLimitPolicy',
    'applyManagedPolicyPayloadToProfile',
    'withAcceptedManagedPolicyState',
    'applyManagedPolicyEnvelope',
    'applyManagedMailboxItem'
  ].includes(name)) {
    return 'nanahManagedPolicyEnvelopeApply';
  }
  if (['generateId', 'getIO', 'getDeviceDescriptor'].includes(name)) {
    return 'nanahAdapterRuntimeAndDescriptor';
  }
  if (['summarizePortablePayload', 'buildPortablePayload', 'buildSyncEnvelope', 'buildControlProposal'].includes(name)) {
    return 'nanahEnvelopeBuildAndSummary';
  }
  if (['extractPortableFromEnvelope', 'applyIncomingEnvelope'].includes(name)) {
    return 'nanahIncomingEnvelopeApply';
  }
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    const match = line.match(/^\s*(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (!match) return;

    const name = match[2];
    rows.push({
      line: index + 1,
      kind: match[1] ? 'async function' : 'function',
      name,
      group: groupForMethod(name)
    });
  });
  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countLiteral(source, token) {
  return source.split(token).length - 1;
}

function sourceLineCount() {
  const source = read(sourcePath);
  return source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
}

function createAdapter({ io = null, crypto = null, navigator = null } = {}) {
  const sandbox = {
    FilterTubeIO: io,
    crypto: crypto || { randomUUID: () => 'nanah-test-uuid' },
    navigator: navigator || { platform: 'TestOS' },
    Date: { now: () => 1779300000000 },
    Math
  };
  vm.runInNewContext(read(sourcePath), sandbox, { filename: sourcePath });
  assert.ok(sandbox.FilterTubeNanahAdapter, 'Nanah adapter export should exist');
  return sandbox.FilterTubeNanahAdapter;
}

function createProfilesFixture() {
  return {
    activeProfileId: 'default',
    profiles: {
      default: {
        name: 'Default',
        main: {
          mode: 'whitelist',
          channels: [{ id: 'A', name: 'Alpha' }],
          keywords: [{ word: 'alpha', exact: false, comments: true }],
          whitelistChannels: [{ id: 'W', name: 'Whitelisted' }],
          whitelistKeywords: []
        },
        kids: {
          mode: 'blocklist',
          strictMode: true,
          blockedChannels: [{ id: 'K1' }],
          blockedKeywords: [{ word: 'kid-alpha' }],
          whitelistChannels: [],
          whitelistKeywords: []
        }
      }
    }
  };
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('Nanah sync adapter method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: runtime managed-policy validation, adapter signature verification, and\s+validated apply boundary present/);
  assert.match(text, /Runtime behavior changed for\s+validated managed envelope apply support/);
  assert.match(text, /source file: js\/nanah_sync_adapter\.js/);
  assert.match(text, /line count: 1419/);
  assert.equal(sourceLineCount(), 1419);
  assert.match(text, /named declarations: 69/);
  assert.match(text, /plain function declarations: 57/);
  assert.match(text, /async function declarations: 12/);
  assert.match(text, /const arrow helper declarations: 0/);
  assert.match(text, /public FilterTubeNanahAdapter entries: 18/);
  assert.match(text, /semantic method groups: 8/);
  assert.match(text, /runtime behavior changed: validated managed envelope apply support/);
  assert.match(text, /not completion proof for live transport key distribution/);
});

test('Nanah sync adapter register accounts for every current named declaration', () => {
  const rows = methodRows();

  assert.equal(rows.length, 69);
  assert.deepEqual(countBy(rows, 'kind'), {
    'async function': 12,
    function: 57
  });
  assert.deepEqual(countBy(rows, 'group'), {
    nanahAdapterRuntimeAndDescriptor: 3,
    nanahDefensiveNormalizationAndMerge: 17,
    nanahEnvelopeBuildAndSummary: 4,
    nanahIncomingEnvelopeApply: 2,
    nanahManagedPolicyEnvelopeApply: 19,
    nanahManagedPolicyEnvelopeValidation: 12,
    nanahManagedPolicyIntegrityVerifier: 10,
    nanahScopedPortableProfileTransfer: 2
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('Nanah sync adapter register preserves every source row and public API entry', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing Nanah adapter method row ${row.kind}:${row.name}:${row.line}`
    );
  }

  for (const entry of [
    'appId',
    'payloadVersion',
    'supportedScopes',
    'getDeviceDescriptor',
    'summarizePortablePayload',
    'buildPortablePayload',
    'buildSyncEnvelope',
    'buildControlProposal',
    'validateManagedPolicyEnvelope',
    'validateManagedMailboxItem',
    'buildManagedPolicyPayloadHash',
    'verifyManagedNanahPolicyIntegritySignature',
    'createManagedNanahSigningKeyPair',
    'signManagedPolicyEnvelope',
    'applyManagedPolicyEnvelope',
    'applyManagedMailboxItem',
    'applyIncomingEnvelope',
    'extractPortableFromEnvelope'
  ]) {
    assert.ok(text.includes(entry), `missing public API entry ${entry}`);
  }
});

test('Nanah sync adapter register pins import export envelope and no-DOM surface counts', () => {
  const source = read(sourcePath);
  const text = doc();

  assert.equal(countLiteral(source, 'new Map('), 4);
  assert.equal(countLiteral(source, 'safeArray('), 37);
  assert.equal(countLiteral(source, 'safeObject('), 95);
  assert.equal(countLiteral(source, 'normalizeString('), 88);
  assert.equal(countLiteral(source, 'normalizeScope('), 6);
  assert.equal(countLiteral(source, 'JSON.stringify('), 6);
  assert.equal(countLiteral(source, 'JSON.parse('), 3);
  assert.equal(countLiteral(source, 'throw new Error('), 19);
  assert.equal(countLiteral(source, 'await io.loadProfilesV4'), 3);
  assert.equal(countLiteral(source, 'await io.saveProfilesV4'), 2);
  assert.equal(countLiteral(source, 'await io.exportV3'), 1);
  assert.equal(countLiteral(source, 'return io.importV3'), 1);
  assert.equal(countLiteral(source, 'global.FilterTubeIO'), 1);
  assert.equal(countLiteral(source, 'global.FilterTubeNanahAdapter'), 1);
  assert.equal(countLiteral(source, 'global.crypto.randomUUID'), 2);
  assert.equal(countLiteral(source, 'Date.now('), 5);
  assert.equal(countLiteral(source, 'Math.random('), 1);
  assert.equal(countLiteral(source, 'global.navigator'), 4);
  assert.equal(countLiteral(source, 'DEFAULT_DEVICE_CAPABILITIES'), 2);
  assert.equal(countLiteral(source, 'document.'), 0);
  assert.equal(countLiteral(source, 'window.'), 0);
  assert.equal(countLiteral(source, 'addEventListener('), 0);
  assert.equal(countLiteral(source, 'setTimeout('), 0);
  assert.equal(countLiteral(source, 'setInterval('), 0);
  assert.equal(countLiteral(source, 'requestAnimationFrame('), 0);
  assert.equal(countLiteral(source, 'MutationObserver'), 0);
  assert.equal(countLiteral(source, 'chrome.storage'), 0);
  assert.equal(countLiteral(source, 'browser.storage'), 0);
  assert.equal(countLiteral(source, 'module.exports'), 0);

  for (const token of [
    'new Map calls: 4',
    'safeArray references: 37',
    'safeObject references: 95',
    'normalizeString references: 88',
    'normalizeScope references: 6',
    'JSON.stringify calls: 6',
    'JSON.parse calls: 3',
    'throw new Error statements: 19',
    'await io.loadProfilesV4 calls: 3',
    'await io.saveProfilesV4 calls: 2',
    'await io.exportV3 calls: 1',
    'return io.importV3 calls: 1',
    'global.FilterTubeIO references: 1',
    'global.FilterTubeNanahAdapter assignments: 1',
    'global.crypto.randomUUID references: 2',
    'Date.now calls: 5',
    'Math.random calls: 1',
    'global.navigator references: 4',
    'DEFAULT_DEVICE_CAPABILITIES references: 2',
    'document references: 0',
    'window references: 0',
    'addEventListener calls: 0',
    'setTimeout calls: 0',
    'setInterval calls: 0',
    'requestAnimationFrame calls: 0',
    'MutationObserver references: 0',
    'storage API references: 0',
    'module.exports references: 0'
  ]) {
    assert.ok(text.includes(token), `missing Nanah adapter surface token ${token}`);
  }
});

test('Nanah sync adapter source still proves current payload and apply boundaries', async () => {
  let profiles = createProfilesFixture();
  let savedProfiles = null;
  const io = {
    loadProfilesV4: async () => profiles,
    saveProfilesV4: async (next) => {
      savedProfiles = next;
      profiles = next;
      return true;
    },
    exportV3: async ({ scope }) => ({ version: 'v3', meta: { exportType: scope }, exportedScope: scope }),
    importV3: async (portable, options) => ({ ok: true, portable, options })
  };
  const adapter = createAdapter({ io });

  assert.equal(adapter.appId, 'filtertube');
  assert.equal(adapter.payloadVersion, 'v3');
  assert.deepEqual(JSON.parse(JSON.stringify(adapter.supportedScopes)), ['main', 'kids', 'active', 'full']);
  assert.equal(adapter.getDeviceDescriptor({ deviceId: 'dev-1', deviceLabel: 'Desk', appVersion: '3.3.1' }).deviceLabel, 'Desk');
  assert.equal(typeof adapter.validateManagedPolicyEnvelope, 'function');

  const managedEnvelope = {
    type: 'filtertube_managed_policy',
    linkId: 'link-parent-child-1',
    scope: 'keywords',
    targetProfileId: 'child-profile-1',
    sourceProfileId: 'parent-profile-1',
    sourceDeviceId: 'parent-device-1',
    revision: 5,
    sourcePublicKeyId: 'parent-key-3',
    keyVersion: 3,
    payload: {
      scope: 'keywords',
      operations: [{ op: 'add_keyword', valueHash: 'sha256:redacted' }]
    }
  };
  managedEnvelope.policyHash = adapter.buildManagedPolicyPayloadHash(managedEnvelope);
  managedEnvelope.integrity = {
    algorithm: 'ed25519',
    signature: 'signature-keyword-5',
    signedFields: {
      linkId: managedEnvelope.linkId,
      scope: managedEnvelope.scope,
      targetProfileId: managedEnvelope.targetProfileId,
      sourceDeviceId: managedEnvelope.sourceDeviceId,
      revision: managedEnvelope.revision,
      policyHash: managedEnvelope.policyHash,
      payloadScope: 'keywords'
    }
  };
  const managedDecision = adapter.validateManagedPolicyEnvelope(managedEnvelope, {
    trustedLink: {
      id: 'link-parent-child-1',
      type: 'managed_link',
      localRole: 'replica',
      remoteRole: 'source',
      sourceDeviceId: 'parent-device-1',
      sourceProfileId: 'parent-profile-1',
      targetProfileId: 'child-profile-1',
      allowedScopes: ['keywords'],
      sourcePublicKeyId: 'parent-key-3',
      keyVersion: 3
    },
    profiles: {
      'parent-profile-1': { id: 'parent-profile-1', type: 'account' },
      'child-profile-1': { id: 'child-profile-1', type: 'child', parentProfileId: 'parent-profile-1' }
    },
    accepted: {
      revision: 4,
      policyHash: managedEnvelope.policyHash
    },
    verifyIntegritySignature: () => true
  });
  assert.equal(managedDecision.accepted, true);
  assert.equal(managedDecision.decision, 'accept_newer_revision');
  assert.equal(managedDecision.targetProfileId, 'child-profile-1');

  const mainPayload = await adapter.buildPortablePayload({ scope: 'main' });
  assert.equal(mainPayload.scope, 'main');
  assert.equal(mainPayload.payloadVersion, 'v3');
  assert.equal(mainPayload.portable.section, 'main');
  assert.deepEqual(JSON.parse(JSON.stringify(mainPayload.portable.data.channels)), [{ id: 'A', name: 'Alpha' }]);
  mainPayload.portable.data.channels.push({ id: 'mutated' });
  assert.equal(profiles.profiles.default.main.channels.length, 1);

  const activePayload = await adapter.buildPortablePayload({ scope: 'active' });
  assert.equal(activePayload.portable.exportedScope, 'active');

  const syncEnvelope = await adapter.buildSyncEnvelope({ scope: 'kids' });
  assert.equal(syncEnvelope.t, 'app_sync');
  assert.equal(syncEnvelope.app, 'filtertube');
  assert.equal(syncEnvelope.scope, 'kids');
  assert.equal(JSON.parse(syncEnvelope.payload).section, 'kids');

  const proposal = await adapter.buildControlProposal({ scope: 'main', strategy: 'preview' });
  assert.equal(proposal.t, 'control_proposal');
  assert.equal(proposal.action, 'filtertube.apply_sync_payload');
  assert.equal(JSON.parse(proposal.payload).strategy, 'preview');

  const incoming = {
    t: 'app_sync',
    scope: 'main',
    payload: JSON.stringify({
      version: 'v3',
      section: 'main',
      data: {
        channels: [{ id: 'B', name: 'Beta' }],
        keywords: [{ word: 'beta', exact: true }],
        whitelistChannels: [],
        whitelistKeywords: []
      }
    })
  };

  const preview = await adapter.applyIncomingEnvelope(incoming, { strategy: 'preview' });
  assert.equal(preview.preview, true);
  assert.equal(preview.scope, 'main');
  assert.equal(savedProfiles, null);

  const applied = await adapter.applyIncomingEnvelope(incoming, { strategy: 'merge' });
  assert.deepEqual(JSON.parse(JSON.stringify(applied)), { ok: true, scope: 'main', profileId: 'default', strategy: 'merge' });
  assert.equal(savedProfiles.profiles.default.main.mode, 'whitelist');
  assert.deepEqual(JSON.parse(JSON.stringify(savedProfiles.profiles.default.main.channels.map((channel) => channel.id))), ['A', 'B']);
  assert.deepEqual(JSON.parse(JSON.stringify(savedProfiles.profiles.default.main.keywords.map((keyword) => keyword.word))), ['alpha', 'beta']);

  const activeApply = await adapter.applyIncomingEnvelope(
    { t: 'app_sync', scope: 'active', payload: JSON.stringify({ version: 'v3', meta: { exportType: 'active' } }) },
    { strategy: 'replace', auth: { pin: '1234' }, targetProfileId: 'child' }
  );
  assert.equal(activeApply.options.scope, 'active');
  assert.equal(activeApply.options.strategy, 'replace');
  assert.equal(activeApply.options.targetProfileId, 'child');

  await assert.rejects(
    () => adapter.applyIncomingEnvelope(managedEnvelope, { strategy: 'merge' }),
    /Managed policy envelopes require validated managed apply flow/
  );
});

test('Nanah sync adapter source preserves envelope and mutation source snippets', () => {
  const source = read(sourcePath);
  const text = doc();

  assert.match(source, /const APP_ID = 'filtertube'/);
  assert.match(source, /const PAYLOAD_VERSION = 'v3'/);
  assert.match(source, /const MANAGED_POLICY_ENVELOPE_TYPE = 'filtertube_managed_policy'/);
  assert.match(source, /const DEFAULT_DEVICE_CAPABILITIES = \[/);
  assert.match(source, /function normalizeScope\(scope\)/);
  assert.match(source, /function validateManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(source, /async function applyManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(source, /Managed policy envelopes require validated managed apply flow/);
  assert.match(source, /if \(raw === 'main' \|\| raw === 'kids' \|\| raw === 'active' \|\| raw === 'full'\)/);
  assert.match(source, /function parsePackedChannelKeywordSource\(sourceValue\)/);
  assert.match(source, /if \(!raw\.toLowerCase\(\)\.startsWith\('channel:'\)\) return null/);
  assert.match(source, /async function buildScopedPortablePayload\(io, scope\)/);
  assert.match(source, /throw new Error\('Profile-scoped Nanah sync requires loadProfilesV4'\)/);
  assert.match(source, /data: cloneJson\(safeObject\(activeProfile\.main\)\)/);
  assert.match(source, /async function applyScopedPortablePayload\(io, portable, \{ strategy = 'merge', targetProfileId = null \} = \{\}\)/);
  assert.match(source, /function applyMainSurfaceData\(currentMain, data, replace\)/);
  assert.match(source, /function applyManagedPolicyPayloadToProfile\(profile, envelope\)/);
  assert.match(source, /function withAcceptedManagedPolicyState\(profile, envelope\)/);
  assert.match(source, /mode: normalizeString\(incoming\.mode\) === 'whitelist' \? 'whitelist' : \(current\.mode === 'whitelist' \? 'whitelist' : 'blocklist'\)/);
  assert.match(source, /await io\.saveProfilesV4\(\{/);
  assert.match(source, /async function buildSyncEnvelope\(\{ scope = 'active', auth = null \} = \{\}\)/);
  assert.match(source, /payload: JSON\.stringify\(built\.portable\)/);
  assert.match(source, /action: 'filtertube\.apply_sync_payload'/);
  assert.match(source, /function extractPortableFromEnvelope\(envelope\)/);
  assert.match(source, /if \(root\.t === 'app_sync'\)/);
  assert.match(source, /if \(root\.t === 'control_proposal'\)/);
  assert.match(source, /if \(effectiveStrategy === 'preview'\)/);
  assert.match(source, /return io\.importV3\(extracted\.portable/);
  assert.match(source, /global\.FilterTubeNanahAdapter = \{/);

  for (const token of [
    'APP_ID: filtertube',
    'PAYLOAD_VERSION: v3',
    'supportedScopes: main, kids, active, full',
    'default capabilities: sync.send, sync.receive, control.propose',
    'sync envelope type: app_sync',
    'control proposal type: control_proposal',
    'proposal action: filtertube.apply_sync_payload',
    'proposal strategies: replace, preview, merge',
    'incoming preview strategy writes storage: no',
    'main/kids incoming apply path: applyScopedPortablePayload then io.saveProfilesV4',
    'active/full incoming apply path: io.importV3',
    'main/kids outgoing scope path: buildScopedPortablePayload',
    'active/full outgoing scope path: io.exportV3',
    'required IO dependency: global.FilterTubeIO.exportV3 and global.FilterTubeIO.importV3',
    'scoped V4 dependency: io.loadProfilesV4 and io.saveProfilesV4',
    'no DOM selector ownership: true',
    'no listener ownership: true',
    'no timer ownership: true',
    'no direct storage API ownership inside this file: true'
  ]) {
    assert.ok(text.includes(token), `missing Nanah adapter boundary token ${token}`);
  }
});

test('Nanah sync adapter register preserves future proof fields', () => {
  const text = doc();

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'publicApiEntry',
    'callerSurface',
    'scope',
    'strategy',
    'targetProfileId',
    'trustedLinkState',
    'profileLockState',
    'ioDependency',
    'profileMutationEffect',
    'importMutationEffect',
    'previewEffect',
    'runtimeRefreshEffect',
    'backupEffect',
    'payloadSchema',
    'payloadVersion',
    'envelopeType',
    'proposalAction',
    'senderDevice',
    'deviceDescriptor',
    'listMergePolicy',
    'listReplacePolicy',
    'modePreservationPolicy',
    'emptyWhitelistPolicy',
    'channelSanitizerParity',
    'keywordSanitizerParity',
    'jsonParseFailureMode',
    'rollbackPolicy',
    'positiveScopedMergeFixture',
    'positiveScopedReplaceFixture',
    'positivePreviewFixture',
    'negativeMalformedEnvelopeFixture',
    'negativeUnsupportedScopeFixture',
    'negativeMissingIoFixture',
    'negativeLockedProfileFixture',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('runtime source lacks Nanah adapter method authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'nanahAdapterMethodAuthority',
    'nanahAdapterEnvelopeContract',
    'nanahAdapterScopedMutationReport',
    'nanahAdapterPreviewApplyEquivalenceReport',
    'nanahAdapterTargetProfileAuthority',
    'nanahAdapterTrustedSenderContract',
    'nanahAdapterProfileLockGate',
    'nanahAdapterRuntimeRefreshContract',
    'nanahAdapterSanitizerParityReport',
    'nanahAdapterFixtureProvenance'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
