import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const repoRoot = process.cwd();
const tabViewPath = 'js/tab-view.js';
const tabViewHtmlPath = 'html/tab-view.html';
const managedLivePolicyPath = 'js/nanah_managed_live_policy.js';
const docPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_LIVE_SIGNED_SEND_2026-06-04.md';
const signingDocPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_SIGNING_KEYPAIR_2026-06-04.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';
const fanoutDocPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_MULTI_TARGET_FANOUT_BOUNDARY_2026-06-04.md';
const laneConfigPath = 'scripts/test-lane-config.mjs';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadManagedLivePolicyFactory() {
  const context = { window: {} };
  vm.runInNewContext(read(managedLivePolicyPath), context);
  return context.window.FilterTubeNanahManagedLivePolicy.create;
}

function createManagedLivePolicyHarness({ activeSurface = 'main', sourceProfile = null, allowedScopes = ['main', 'kids', 'keywords', 'channels', 'videos', 'viewing_space', 'time_limits'] } = {}) {
  const parentProfile = sourceProfile || {
    settings: {
      allowMainViewing: false,
      allowKidsViewing: true,
      defaultLaunchTarget: 'kids',
      timeLimitPolicy: {
        schema: 'filtertube_managed_time_limit',
        version: 1,
        enabled: true,
        timezone: 'Asia/Kolkata',
        dailyBudgetSeconds: 5400,
        surfaceBudgets: { main: 0, kids: 5400 },
        countingMode: 'active_youtube_tab',
        activeDeviceBudgetPolicy: 'single_active_tab_no_double_count',
        resetPolicy: 'policy_timezone_midnight',
        graceSeconds: 30,
        parentGrant: { enabled: false, extraSeconds: 0, expiresAt: null, reason: '' },
        policyRevision: 2,
        policyHash: 'local-time-limit-hash',
        issuedAt: 1779300000000,
        validFrom: 1779300000000,
        validUntil: null
      }
    },
    main: {
      mode: 'blocklist',
      keywords: [{ word: 'shakira' }],
      channels: [{ id: 'UC-shakira', name: 'Shakira' }],
      whitelistKeywords: [],
      whitelistChannels: [],
      videoIds: ['video-main-1']
    },
    kids: {
      mode: 'whitelist',
      blockedKeywords: [],
      blockedChannels: [],
      whitelistKeywords: [{ word: 'science' }],
      whitelistChannels: [{ id: 'UC-science', name: 'Science' }],
      videoIds: ['video-kids-1']
    }
  };
  const trustedLink = {
    linkType: 'managed_link',
    localRole: 'source',
    remoteRole: 'replica',
    linkId: 'link-parent-child-1',
    policy: {
      allowedScopes,
      targetProfileBehavior: 'fixed_profile',
      targetProfileId: 'child-profile-1',
      targetProfileName: 'Child'
    }
  };
  const create = loadManagedLivePolicyFactory();
  const helper = create({
    normalizeString(value) {
      return typeof value === 'string' ? value.trim() : '';
    },
    safeObject(value) {
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    },
    normalizeNonNegativeInteger(value) {
      const num = typeof value === 'number' ? value : Number(value);
      return Number.isInteger(num) && num >= 0 ? num : null;
    },
    getProfilesRoot: () => ({ profiles: { 'parent-profile-1': parentProfile } }),
    getLocalProfileContext: () => ({ profileId: 'parent-profile-1', profileName: 'Parent' }),
    getPolicySourceProfile: () => ({ profileId: 'child-profile-local-copy', profile: parentProfile, sourceKind: 'managed_child_edit' }),
    getActiveManagedSurface: () => activeSurface,
    getProfileSurface(profile, surface) {
      const key = surface === 'kids' ? 'kids' : 'main';
      return profile[key] || {};
    },
    getManagedTimeLimitPolicy(profile) {
      return profile.settings?.timeLimitPolicy || null;
    },
    normalizeTrustedLink: (link) => link,
    getTargetProfileBehavior: (value) => value === 'fixed_profile' ? 'fixed_profile' : 'current_active',
    normalizeTargetProfileContext: (value) => value || {},
    getRemoteTargetProfile: () => null,
    buildLocalPolicyHash: (prefix, seed) => `${prefix}-${String(seed).length}`,
    getCurrentTrustedLink: () => trustedLink,
    getAllowedScopeList: (value) => Array.isArray(value) ? value : [value],
    getScopeLabel: (scope) => scope,
    ensureSigningKeyPair: async () => ({
      managedPublicKeyId: 'managed-key-1',
      managedKeyVersion: 1,
      privateKeyJwk: { kty: 'OKP', crv: 'Ed25519', d: 'private', x: 'public' }
    }),
    getStableDeviceId: () => 'parent-device-1',
    findTrustedLinkById: () => trustedLink,
    updateTrustedLinkPolicy: async (linkId, patch) => ({ linkId, patch, ok: true }),
    getAdapter: () => ({
      async signManagedPolicyEnvelope(envelope) {
        return {
          ...envelope,
          integrity: {
            algorithm: 'ed25519',
            signature: 'signature',
            signedFields: {
              linkId: envelope.linkId,
              scope: envelope.scope,
              targetProfileId: envelope.targetProfileId,
              sourceDeviceId: envelope.sourceDeviceId,
              revision: envelope.revision,
              policyHash: envelope.policyHash,
              payloadScope: envelope.payload.scope
            }
          }
        };
      }
    }),
    now: () => 1779300000000
  });
  return { helper, parentProfile, trustedLink };
}

test('managed live signed-send audit is linked without claiming mailbox runtime', () => {
  const doc = read(docPath);
  const signingDoc = read(signingDocPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);

  assert.match(doc, /Eligible live-session source send runtime slice/);
  assert.match(doc, /fixed-target Main\/Kids and granular managed live sends/);
  assert.match(doc, /explicit Main\/Kids rule-source picker/);
  assert.match(doc, /Rule bundle/);
  assert.match(doc, /All unsupported live sends continue through the existing proposal path/);
  assert.match(doc, /not a mailbox runtime, local-network discovery runtime, key-rotation\s+system, or offline later-delivery mechanism/);
  assert.match(signingDoc, new RegExp(docPath));
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, /fixed-target Main\/Kids, keyword, channel, video, viewing-space, and time-limit managed live sends build signed `filtertube_managed_policy` envelopes/);
});

test('managed trusted links are profile scoped and connected target fanout is bounded', () => {
  const doc = read(fanoutDocPath);
  const liveDoc = read(docPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);
  const tabView = read(tabViewPath);
  const helperSource = read(managedLivePolicyPath);

  assert.match(doc, /Profile-scoped identity foundation present/);
  assert.match(doc, /findNanahTrustedLink\(remoteDeviceId, options = \{\}\)/);
  assert.match(doc, /saveNanahTrustedLink\(entry\)[\s\S]*replaces an existing row by exact link id or trustedLinkIdentityKey/);
  assert.match(doc, /buildEnvelopeBatchForTrustedLinks\(policy, trustedLinks\)/);
  assert.match(doc, /A device-level trusted link is still not enough for multi-target authority/);
  assert.match(doc, /runtime profile-scoped trusted link id: present/);
  assert.match(doc, /runtime connected-device multi-target chooser: present/);
  assert.match(doc, /runtime signed fanout send loop: present for selected targets on the connected replica only/);
  assert.match(doc, /runtime per-target ack\/history summary: absent/);
  assert.match(doc, /runtime mailbox\/local-network fanout delivery: absent/);
  assert.match(doc, /Runtime behavior changed by this proof: yes, the dashboard can now choose\s+multiple saved fixed-profile targets on the connected replica/);
  assert.match(doc, /flowchart TD/);
  assert.match(liveDoc, new RegExp(fanoutDocPath));
  assert.match(plan, new RegExp(fanoutDocPath));
  assert.match(inventory, new RegExp(fanoutDocPath));
  assert.match(inventory, /profile-scoped trusted-link identity/);

  assert.match(tabView, /function buildNanahProfileScopedLinkId\(remoteDeviceId, targetProfileId\)/);
  assert.match(tabView, /function getNanahTrustedLinkTargetProfileId\(entry\)/);
  assert.match(tabView, /function getNanahTrustedLinkIdentityKey\(entry\)/);
  assert.match(tabView, /trustedLinkIdentityKey/);
  assert.match(tabView, /function findNanahTrustedLink\(remoteDeviceId, options = \{\}\)/);
  assert.match(tabView, /const requestedTargetProfileId = normalizeString\(filters\.targetProfileId\)/);
  assert.match(tabView, /getNanahTrustedLinkTargetProfileId\(entry\) === requestedTargetProfileId/);
  assert.match(tabView, /const existingIndex = nanahTrustedLinks\.findIndex\(\(item\) => \{/);
  assert.match(tabView, /currentIdentityKey === nextIdentityKey/);
  assert.match(tabView, /function getNanahManagedDuplicateDeviceIds\(sourceDeviceId, trustedLinkId, targetProfileId = ''\)/);
  assert.match(tabView, /candidateTargetProfileId === currentTargetProfileId/);
  assert.match(tabView, /function findNanahTrustedLinkForManagedEnvelope\(envelope\)[\s\S]*targetProfileId/);
  assert.match(tabView, /function getNanahEligibleManagedTargetLinks\(scope = getNanahScope\(\)\)/);
  assert.match(tabView, /normalizeString\(entry\.remoteDeviceId\) === remoteDeviceId/);
  assert.match(tabView, /entry\.linkType === 'managed_link'[\s\S]*entry\.localRole === 'source'[\s\S]*entry\.remoteRole === 'replica'/);
  assert.match(tabView, /function syncNanahManagedTargetOptions\(scope = getNanahScope\(\)\)/);
  assert.match(tabView, /const showChooser = eligibleLinks\.length > 1/);
  assert.match(tabView, /function getNanahSelectedManagedTargetLinks\(scope = getNanahScope\(\)\)/);
  assert.match(helperSource, /function resolveTargetProfile\(trustedLink\)[\s\S]*policyBehavior === 'fixed_profile'/);
  assert.match(helperSource, /async function buildEnvelopeBatchForTrustedLinks\(policy, trustedLinks\)/);
});

test('dashboard exposes explicit Main Kids rule source picker for granular managed sends', () => {
  const html = read(tabViewHtmlPath);
  const source = read(tabViewPath);

  assert.match(html, /id="ftNanahGranularSurfaceField" hidden/);
  assert.match(html, /id="ftNanahGranularSurface"/);
  assert.match(html, /id="ftNanahManagedTargetsField" hidden/);
  assert.match(html, /id="ftNanahManagedTargets"/);
  assert.match(html, /id="ftNanahManagedTargetsHint"/);
  assert.match(html, /YouTube Main rules/);
  assert.match(html, /YouTube Kids rules/);
  assert.match(html, /value="rules_bundle">Rule bundle/);
  assert.match(source, /const ftNanahGranularSurfaceField = document\.getElementById\('ftNanahGranularSurfaceField'\)/);
  assert.match(source, /const ftNanahGranularSurface = document\.getElementById\('ftNanahGranularSurface'\)/);
  assert.match(source, /const ftNanahManagedTargetsField = document\.getElementById\('ftNanahManagedTargetsField'\)/);
  assert.match(source, /const ftNanahManagedTargets = document\.getElementById\('ftNanahManagedTargets'\)/);
  assert.match(source, /const ftNanahManagedTargetsHint = document\.getElementById\('ftNanahManagedTargetsHint'\)/);
  assert.match(source, /const granularScope = \['keywords', 'channels', 'videos', 'rules_bundle'\]\.includes\(scope\)/);
  assert.match(source, /ftNanahGranularSurfaceField\.hidden = !granularScope \|\| childReceiveOnly \|\| childReplicaOnly/);
  assert.match(source, /function getNanahActiveManagedSurface\(\)[\s\S]*ftNanahGranularSurface\?\.value[\s\S]*return selectedSurface/);
});

test('dashboard builds signed managed envelopes only after source link scope target and key gates', () => {
  const source = read(managedLivePolicyPath);

  assert.match(source, /global\.FilterTubeNanahManagedLivePolicy = \{ create \}/);
  assert.match(source, /function normalizeScope\(scope\)/);
  assert.match(source, /MANAGED_LIVE_POLICY_SCOPES\.includes\(normalized\)/);
  assert.match(source, /function resolveTargetProfile\(trustedLink\)/);
  assert.match(source, /function buildListPayload\(scope, profile, surface\)/);
  assert.match(source, /function buildViewingSpacePayload\(profile\)/);
  assert.match(source, /function buildTimeLimitPayload\(profile\)/);
  assert.match(source, /async function buildEnvelopeForLiveSend\(policy\)/);
  assert.match(source, /async function buildEnvelopeBatchForLiveSend\(policy\)/);
  assert.match(source, /async function buildEnvelopeBatchForTrustedLinks\(policy, trustedLinks\)/);
  assert.match(source, /if \(!trustedLink \|\| trustedLink\.linkType !== 'managed_link'\)/);
  assert.match(source, /if \(trustedLink\.localRole !== 'source' \|\| trustedLink\.remoteRole !== 'replica'\)/);
  assert.match(source, /MANAGED_LIVE_BUNDLE_SCOPES/);
  assert.match(source, /if \(!allowedScopes\.includes\(normalizedScope\)\)/);
  assert.match(source, /if \(!normalizeString\(targetProfile\?\.profileId\)\)/);
  assert.match(source, /deps\.ensureSigningKeyPair\(\{ required: true \}\)/);
  assert.match(source, /privateKeyJwk: keyPair\.privateKeyJwk/);
  assert.match(source, /adapter\.signManagedPolicyEnvelope/);
});

test('managed source send uses signed envelope before proposal fallback and records outbound revision state', () => {
  const source = read(tabViewPath);
  const listenerStart = source.indexOf("ftNanahSendBtn.addEventListener('click'");
  assert.notEqual(listenerStart, -1);
  const listenerEnd = source.indexOf('if (ftNanahTrustBtn) {', listenerStart);
  assert.notEqual(listenerEnd, -1);
  const sendButtonBlock = source.slice(listenerStart, listenerEnd);
  assert.match(sendButtonBlock, /policy\.linkType === 'managed_link' && policy\.authorityMode === 'managed' && getNanahRole\(\) === 'source'/);
  assert.match(sendButtonBlock, /const selectedTargetLinks = getNanahSelectedManagedTargetLinks\(policy\.scope\)/);
  assert.match(sendButtonBlock, /buildEnvelopeBatchForTrustedLinks\(policy, selectedTargetLinks\)/);
  assert.match(sendButtonBlock, /buildEnvelopeBatchForLiveSend/);
  assert.match(sendButtonBlock, /for \(const signedEnvelope of signedEnvelopes\)/);
  assert.match(sendButtonBlock, /await nanahClient\.send\(signedEnvelope\)/);
  assert.match(sendButtonBlock, /await nanahManagedLivePolicy\.markSent\(/);
  assert.match(sendButtonBlock, /return;\s+\}\s+let envelope = await adapter\.buildControlProposal/);
  assert.match(source, /window\.FilterTubeNanahManagedLivePolicy\?\.create/);
  assert.match(read(managedLivePolicyPath), /outgoingManagedPolicies/);
});

test('managed live signed-send helper can build connected per-target envelope batches', async () => {
  const { helper, trustedLink } = createManagedLivePolicyHarness({
    allowedScopes: ['keywords', 'channels', 'videos']
  });
  const siblingLink = plain({
    ...trustedLink,
    linkId: 'link-parent-child-2',
    policy: {
      ...trustedLink.policy,
      targetProfileId: 'child-profile-2',
      targetProfileName: 'Sibling'
    }
  });

  const envelopes = await helper.buildEnvelopeBatchForTrustedLinks(
    { scope: 'rules_bundle', linkType: 'managed_link', authorityMode: 'managed' },
    [trustedLink, siblingLink]
  );

  assert.equal(envelopes.length, 6);
  assert.deepEqual(plain([...new Set(envelopes.map((envelope) => envelope.linkId))]), [
    'link-parent-child-1',
    'link-parent-child-2'
  ]);
  assert.deepEqual(plain([...new Set(envelopes.map((envelope) => envelope.targetProfileId))]), [
    'child-profile-1',
    'child-profile-2'
  ]);
  assert.deepEqual(plain(envelopes.map((envelope) => `${envelope.linkId}:${envelope.scope}`)), [
    'link-parent-child-1:keywords',
    'link-parent-child-1:channels',
    'link-parent-child-1:videos',
    'link-parent-child-2:keywords',
    'link-parent-child-2:channels',
    'link-parent-child-2:videos'
  ]);
  assert.ok(envelopes.every((envelope) => envelope.type === 'filtertube_managed_policy'));
  assert.ok(envelopes.every((envelope) => envelope.integrity?.signedFields?.linkId === envelope.linkId));

  await assert.rejects(
    () => helper.buildEnvelopeBatchForTrustedLinks(
      { scope: 'keywords', linkType: 'managed_link', authorityMode: 'managed' },
      []
    ),
    /at least one saved profile-scoped trusted link/
  );
});

test('managed live signed-send helper builds granular parent-control payloads from selected surface', async () => {
  const { helper } = createManagedLivePolicyHarness({ activeSurface: 'main' });

  assert.deepEqual(plain(helper.buildPayload('keywords')), {
    scope: 'keywords',
    surface: 'main',
    list: 'blocklist',
    replace: true,
    keywords: [{ word: 'shakira' }]
  });
  assert.deepEqual(plain(helper.buildPayload('channels')), {
    scope: 'channels',
    surface: 'main',
    list: 'blocklist',
    replace: true,
    channels: [{ id: 'UC-shakira', name: 'Shakira' }]
  });
  assert.deepEqual(plain(helper.buildPayload('videos')), {
    scope: 'videos',
    surface: 'main',
    replace: true,
    videoIds: ['video-main-1']
  });
  assert.deepEqual(plain(helper.buildPayload('viewing_space')), {
    scope: 'viewing_space',
    allowMain: false,
    allowKids: true,
    defaultLaunchTarget: 'kids'
  });
  assert.deepEqual(plain(helper.buildPayload('time_limits')), {
    scope: 'time_limits',
    enabled: true,
    timezone: 'Asia/Kolkata',
    dailyBudgetMinutes: 90,
    dailyBudgetSeconds: 5400,
    surfaceBudgets: { main: 0, kids: 5400 },
    countingMode: 'active_youtube_tab',
    activeDeviceBudgetPolicy: 'single_active_tab_no_double_count',
    resetPolicy: 'policy_timezone_midnight',
    graceSeconds: 30,
    parentGrant: { enabled: false, extraSeconds: 0, expiresAt: null, reason: '' },
    validFrom: 1779300000000,
    validUntil: null
  });

  const envelope = await helper.buildEnvelopeForLiveSend({ scope: 'channels' });
  assert.equal(envelope.type, 'filtertube_managed_policy');
  assert.equal(envelope.scope, 'channels');
  assert.equal(envelope.targetProfileId, 'child-profile-1');
  assert.equal(envelope.sourceProfileId, 'parent-profile-1');
  assert.deepEqual(plain(envelope.payload.channels), [{ id: 'UC-shakira', name: 'Shakira' }]);
  assert.equal(envelope.integrity.signedFields.payloadScope, 'channels');
});

test('managed live signed-send helper expands rule bundle into individual signed envelopes', async () => {
  const { helper } = createManagedLivePolicyHarness({ activeSurface: 'main' });

  assert.deepEqual(plain(helper.expandScope('rules_bundle')), ['keywords', 'channels', 'videos']);
  assert.throws(() => helper.buildPayload('rules_bundle'), /expand into individual policy payloads/);

  const envelopes = await helper.buildEnvelopeBatchForLiveSend({ scope: 'rules_bundle' });
  assert.deepEqual(plain(envelopes.map((envelope) => envelope.scope)), ['keywords', 'channels', 'videos']);
  assert.deepEqual(plain(envelopes.map((envelope) => envelope.targetProfileId)), ['child-profile-1', 'child-profile-1', 'child-profile-1']);
  assert.deepEqual(plain(envelopes[0].payload.keywords), [{ word: 'shakira' }]);
  assert.deepEqual(plain(envelopes[1].payload.channels), [{ id: 'UC-shakira', name: 'Shakira' }]);
  assert.deepEqual(plain(envelopes[2].payload.videoIds), ['video-main-1']);
  assert.deepEqual(plain(envelopes.map((envelope) => envelope.integrity.signedFields.payloadScope)), ['keywords', 'channels', 'videos']);

  const limited = createManagedLivePolicyHarness({ allowedScopes: ['keywords'] }).helper;
  await assert.rejects(
    () => limited.buildEnvelopeBatchForLiveSend({ scope: 'rules_bundle' }),
    /does not allow signed channels policy sends/
  );
});

test('managed live signed-send helper uses Kids surface for granular scopes when selected', () => {
  const { helper } = createManagedLivePolicyHarness({ activeSurface: 'kids' });

  assert.deepEqual(plain(helper.buildPayload('keywords')), {
    scope: 'keywords',
    surface: 'kids',
    list: 'whitelist',
    replace: true,
    whitelistKeywords: [{ word: 'science' }]
  });
  assert.deepEqual(plain(helper.buildPayload('channels')), {
    scope: 'channels',
    surface: 'kids',
    list: 'whitelist',
    replace: true,
    whitelistChannels: [{ id: 'UC-science', name: 'Science' }]
  });
  assert.deepEqual(plain(helper.buildPayload('videos')), {
    scope: 'videos',
    surface: 'kids',
    replace: true,
    videoIds: ['video-kids-1']
  });
});

test('settings lane includes managed live signed-send regression proof', () => {
  const laneConfig = read(laneConfigPath);
  assert.match(laneConfig, /tests\/runtime\/managed-nanah-live-signed-send-current-behavior\.test\.mjs/);
});
