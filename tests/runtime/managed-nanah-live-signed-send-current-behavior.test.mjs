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
const sourceDeliveryDocPath = 'docs/audit/FILTERTUBE_MANAGED_LOCAL_NETWORK_SOURCE_DELIVERY_2026-06-05.md';
const mailboxSourceDeliveryDocPath = 'docs/audit/FILTERTUBE_MANAGED_MAILBOX_SOURCE_UPLOAD_HANDOFF_2026-06-05.md';
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

function expandManagedAllowedScopes(value) {
  const list = Array.isArray(value) ? value : [value];
  const normalized = list
    .map((item) => String(item || '').trim().toLowerCase())
    .flatMap((item) => {
      if (item === 'rules_bundle') return ['keywords', 'channels', 'videos'];
      if (item === 'active' || item === 'full') return ['main', 'kids', 'viewing_space', 'time_limits'];
      return [item];
    })
    .filter((item) => [
      'main',
      'kids',
      'videos',
      'keywords',
      'channels',
      'viewing_space',
      'time_limits'
    ].includes(item));
  return Array.from(new Set(normalized));
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
  const policyUpdates = [];
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
    getAllowedScopeList: expandManagedAllowedScopes,
    getScopeLabel: (scope) => scope,
    ensureSigningKeyPair: async () => ({
      managedPublicKeyId: 'managed-key-1',
      managedKeyVersion: 1,
      privateKeyJwk: { kty: 'OKP', crv: 'Ed25519', d: 'private', x: 'public' }
    }),
    getStableDeviceId: () => 'parent-device-1',
    findTrustedLinkById: () => trustedLink,
    updateTrustedLinkPolicy: async (linkId, patch) => {
      policyUpdates.push({ linkId, patch: plain(patch) });
      return true;
    },
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
      },
      buildManagedMailboxStorageItem(envelope, sealedPayload, options = {}) {
        return {
          schema: 'filtertube_managed_mailbox_item',
          version: 1,
          mailboxItemId: options.mailboxItemId || `mbx-${envelope.linkId}-${envelope.scope}-${envelope.revision}`,
          linkId: envelope.linkId,
          targetProfileId: envelope.targetProfileId,
          sourceDeviceId: envelope.sourceDeviceId,
          sourceProfileId: envelope.sourceProfileId,
          scope: envelope.scope,
          revision: envelope.revision,
          policyHash: envelope.policyHash,
          sourcePublicKeyId: envelope.sourcePublicKeyId,
          keyVersion: envelope.keyVersion,
          cipherSuite: sealedPayload.cipherSuite,
          keyAgreementId: sealedPayload.keyAgreementId,
          encryptedDek: sealedPayload.encryptedDek,
          nonce: sealedPayload.nonce,
          ciphertext: sealedPayload.ciphertext,
          ciphertextHash: sealedPayload.ciphertextHash,
          createdAtMs: options.createdAtMs || 1779300000000,
          expiresAtMs: options.expiresAtMs || 1779303600000,
          ackState: 'pending'
        };
      }
    }),
    now: () => 1779300000000
  });
  return { helper, parentProfile, trustedLink, policyUpdates };
}

test('managed live signed-send audit is linked without claiming mailbox runtime', () => {
  const doc = read(docPath);
  const sourceDeliveryDoc = read(sourceDeliveryDocPath);
  const mailboxSourceDeliveryDoc = read(mailboxSourceDeliveryDocPath);
  const signingDoc = read(signingDocPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);

  assert.match(doc, /Eligible live-session source send runtime slice/);
  assert.match(doc, /fixed-target Main\/Kids, active\/full profile bundles, and granular\s+managed live sends/);
  assert.match(doc, /explicit Main\/Kids\s+rule-source\s+picker/);
  assert.match(doc, /Rule bundle/);
  assert.match(doc, /All unsupported live sends continue through the existing proposal path/);
  assert.match(doc, /not a mailbox runtime, built-in local-network discovery runtime,\s+key-rotation system, or complete offline later-delivery UI/);
  assert.match(sourceDeliveryDoc, /Source-side local-network managed policy delivery handoff/);
  assert.match(sourceDeliveryDoc, /Built-in LAN peer\s+discovery, LAN transport, server mailbox upload\/pull, and dashboard offline-send\s+UI remain absent/);
  assert.match(mailboxSourceDeliveryDoc, /Source-side mailbox upload-provider handoff is present/);
  assert.match(mailboxSourceDeliveryDoc, /runtime built-in mailbox server upload client: absent/);
  assert.match(mailboxSourceDeliveryDoc, /runtime mailbox plaintext policy upload: absent/);
  assert.match(doc, new RegExp(sourceDeliveryDocPath));
  assert.match(doc, new RegExp(mailboxSourceDeliveryDocPath));
  assert.match(signingDoc, new RegExp(docPath));
  assert.match(plan, new RegExp(docPath));
  assert.match(plan, new RegExp(sourceDeliveryDocPath));
  assert.match(plan, /Active\/full signed managed sends now expand into concrete\s+Main, Kids,\s+viewing-space, and optional time-limit envelopes for eligible fixed\s+targets/);
  assert.match(plan, /Built-in local-network peer discovery, LAN transport, built-in server\s+mailbox upload\/pull clients, app native enforcement proofs,\s+offline later delivery UI, and\s+built-in multi-device fanout remain gated/);
  assert.doesNotMatch(plan, /active\/full signed managed sends\s+remain gated/);
  assert.match(inventory, /fixed-target active\/full profile-policy bundles, Main\/Kids, keyword,\s+channel, video, viewing-space, and time-limit live sends can now build signed/);
  assert.match(inventory, new RegExp(sourceDeliveryDocPath));
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
  assert.match(doc, /runtime per-target outbound send history: present/);
  assert.match(doc, /runtime per-target accepted\/rejected live ack history: present/);
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
  assert.match(source, /active: \['main', 'kids', 'viewing_space', 'time_limits'\]/);
  assert.match(source, /full: \['main', 'kids', 'viewing_space', 'time_limits'\]/);
  assert.match(source, /function resolveConcreteSendScopes\(scope\)/);
  assert.match(source, /function resolveTargetProfile\(trustedLink\)/);
  assert.match(source, /function buildListPayload\(scope, profile, surface\)/);
  assert.match(source, /function buildViewingSpacePayload\(profile\)/);
  assert.match(source, /function buildTimeLimitPayload\(profile\)/);
  assert.match(source, /function buildLiveAckPayload\(envelope, decision, options = \{\}\)/);
  assert.match(source, /async function recordLiveAckPayload\(ackPayload\)/);
  assert.match(source, /async function recordRemoteDeliveryAckPayload\(ackPayload\)/);
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
  assert.match(source, /async function ensureNanahOutgoingAuth\(scope, options = \{\}\)/);
  assert.match(source, /const sensitiveAction = safeObject\(options\)\.sensitiveAction === true/);
  assert.match(source, /ensureProfileUnlocked\(profilesV4, activeId, \{ sensitiveAction \}\)/);
  assert.match(source, /ensureAdminUnlocked\(profilesV4, \{ sensitiveAction \}\)/);
  assert.match(sendButtonBlock, /const requiresManagedAdminReauth = policy\.linkType === 'managed_link' && policy\.authorityMode === 'managed'/);
  assert.match(sendButtonBlock, /ensureNanahOutgoingAuth\(policy\.scope, \{ sensitiveAction: requiresManagedAdminReauth \}\)/);
  assert.match(sendButtonBlock, /policy\.linkType === 'managed_link' && policy\.authorityMode === 'managed' && getNanahRole\(\) === 'source'/);
  assert.match(sendButtonBlock, /const selectedTargetLinks = getNanahSelectedManagedTargetLinks\(policy\.scope\)/);
  assert.match(sendButtonBlock, /buildEnvelopeBatchForTrustedLinks\(policy, selectedTargetLinks\)/);
  assert.match(sendButtonBlock, /buildEnvelopeBatchForLiveSend/);
  assert.match(sendButtonBlock, /for \(const signedEnvelope of signedEnvelopes\)/);
  assert.match(sendButtonBlock, /await nanahClient\.send\(signedEnvelope\)/);
  assert.match(sendButtonBlock, /await nanahManagedLivePolicy\.markSent\(/);
  assert.match(sendButtonBlock, /targetProfileId: signedEnvelope\.targetProfileId/);
  assert.match(sendButtonBlock, /issuedAt: signedEnvelope\.issuedAt/);
  assert.match(sendButtonBlock, /return;\s+\}\s+let envelope = await adapter\.buildControlProposal/);
  assert.match(source, /window\.FilterTubeNanahManagedLivePolicy\?\.create/);
  assert.match(source, /async function sendNanahManagedLivePolicyAck\(envelope, decision, context = \{\}\)/);
  assert.match(source, /nanahManagedLivePolicy\.buildLiveAckPayload/);
  assert.match(source, /async function handleNanahIncomingManagedLiveAck\(ackPayload\)/);
  assert.match(source, /nanahManagedLivePolicy\.recordLiveAckPayload/);
  assert.match(source, /async function handleNanahIncomingManagedRemoteDeliveryAck\(ackPayload, options = \{\}\)/);
  assert.match(source, /nanahManagedLivePolicy\.recordRemoteDeliveryAckPayload/);
  assert.match(source, /root\.schema === 'filtertube_nanah_managed_live_ack'/);
  assert.match(source, /root\.schema === 'filtertube_nanah_managed_open_sync_ack'/);
  assert.match(source, /root\.schema === 'filtertube_managed_local_network_candidate_ack'/);
  assert.match(read(managedLivePolicyPath), /outgoingManagedPolicies/);
  assert.match(read(managedLivePolicyPath), /outboundManagedPolicyHistory/);
  assert.match(read(managedLivePolicyPath), /inboundManagedAckHistory/);
  assert.match(read(managedLivePolicyPath), /filtertube_managed_remote_delivery_ack_history/);
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

test('managed live signed-send helper records redacted outbound history per target scope', async () => {
  const { helper, policyUpdates } = createManagedLivePolicyHarness({ activeSurface: 'main' });
  const envelope = await helper.buildEnvelopeForLiveSend({ scope: 'keywords' });

  const didMark = await helper.markSent(
    envelope.linkId,
    envelope.scope,
    envelope.revision,
    envelope.policyHash,
    {
      targetProfileId: envelope.targetProfileId,
      targetProfileName: envelope.targetProfileName,
      sourceProfileId: envelope.sourceProfileId,
      sourceDeviceId: envelope.sourceDeviceId,
      issuedAt: envelope.issuedAt
    }
  );

  assert.equal(didMark, true);
  assert.equal(policyUpdates.length, 1);
  const policyPatch = policyUpdates[0].patch.policy;
  assert.equal(policyPatch.outgoingManagedPolicies.keywords.revision, envelope.revision);
  assert.equal(policyPatch.outgoingManagedPolicies.keywords.policyHash, envelope.policyHash);
  assert.equal(policyPatch.outgoingManagedPolicies.keywords.sentAt, 1779300000000);

  const row = policyPatch.outboundManagedPolicyHistory[0];
  assert.equal(row.schema, 'filtertube_managed_outbound_policy_history');
  assert.equal(row.actionType, 'remote_policy.live_send');
  assert.equal(row.trustedLinkId, envelope.linkId);
  assert.equal(row.scope, 'keywords');
  assert.equal(row.targetProfileId, 'child-profile-1');
  assert.equal(row.sourceProfileId, 'parent-profile-1');
  assert.equal(row.sourceDeviceId, 'parent-device-1');
  assert.equal(row.revision, envelope.revision);
  assert.equal(row.policyHash, envelope.policyHash);
  assert.equal(row.result, 'sent');
  assert.equal(row.summary.redacted, true);
  assert.equal(row.summary.delivery, 'live_nanah_session');
  assert.equal(JSON.stringify(row).includes('shakira'), false);
  assert.equal(JSON.stringify(row).includes('UC-shakira'), false);
});

test('managed live signed-send helper publishes local-network candidates and marks only accepted deliveries', async () => {
  const { helper, trustedLink, policyUpdates } = createManagedLivePolicyHarness();
  const candidates = await helper.buildLocalNetworkCandidateBatchForTrustedLinks(
    { scope: 'rules_bundle', linkType: 'managed_link', authorityMode: 'managed' },
    [trustedLink],
    { candidateId: 'ln-candidate', ttlSeconds: 120 }
  );

  assert.deepEqual(plain(candidates.map((candidate) => candidate.schema)), [
    'filtertube_managed_local_network_candidate',
    'filtertube_managed_local_network_candidate',
    'filtertube_managed_local_network_candidate'
  ]);
  assert.deepEqual(plain(candidates.map((candidate) => candidate.scope)), ['keywords', 'channels', 'videos']);
  assert.deepEqual(plain(candidates.map((candidate) => candidate.candidateId)), [
    'ln-candidate-1',
    'ln-candidate-2',
    'ln-candidate-3'
  ]);
  assert.equal(candidates[0].envelope.type, 'filtertube_managed_policy');
  assert.equal(candidates[0].envelope.integrity.signedFields.payloadScope, 'keywords');
  assert.equal(candidates[0].expiresAt, 1779300120000);
  assert.equal(JSON.stringify(candidates).includes('privateKeyJwk'), false);
  assert.equal(JSON.stringify(candidates).includes('"d":"'), false);

  let capturedRequest = null;
  const provider = {
    async publishManagedPolicyCandidates(request) {
      capturedRequest = plain(request);
      return {
        ok: true,
        deliveredCandidateIds: [candidates[0].candidateId, candidates[2].candidateId]
      };
    }
  };

  const result = await helper.deliverLocalNetworkCandidates(candidates, provider, { reason: 'manual_source_send' });

  assert.equal(result.ok, true);
  assert.equal(result.candidateCount, 3);
  assert.equal(result.deliveredCandidateCount, 2);
  assert.equal(result.failedCandidateCount, 1);
  assert.equal(result.markedSentCount, 2);
  assert.equal(capturedRequest.schema, 'filtertube_managed_local_network_delivery_request');
  assert.equal(capturedRequest.reason, 'manual_source_send');
  assert.deepEqual(capturedRequest.scopes, ['keywords', 'channels', 'videos']);
  assert.equal(capturedRequest.candidates.length, 3);
  assert.deepEqual(plain(policyUpdates.map((entry) => entry.patch.policy.outboundManagedPolicyHistory[0].summary.delivery)), [
    'local_network_provider',
    'local_network_provider'
  ]);
  assert.deepEqual(plain(policyUpdates.map((entry) => entry.patch.policy.outgoingManagedPolicies)), [
    {
      keywords: {
        revision: candidates[0].revision,
        policyHash: candidates[0].policyHash,
        sentAt: 1779300000000
      }
    },
    {
      videos: {
        revision: candidates[2].revision,
        policyHash: candidates[2].policyHash,
        sentAt: 1779300000000
      }
    }
  ]);

  const unavailable = await helper.deliverLocalNetworkCandidates(candidates, {}, { reason: 'manual_source_send' });
  assert.equal(unavailable.ok, false);
  assert.equal(unavailable.reason, 'local_network_delivery_provider_unavailable');
  assert.equal(unavailable.markedSentCount, 0);
});

test('managed live signed-send helper uploads mailbox ciphertext items and marks only accepted uploads', async () => {
  const { helper, trustedLink, policyUpdates } = createManagedLivePolicyHarness();
  const sealedPayloadForEnvelope = (envelope, index) => ({
    cipherSuite: 'aes-kw+a256gcm',
    keyAgreementId: `link-parent-child-1:child-profile-1:managed-key-1:${index + 1}`,
    encryptedDek: `sealed-dek-${index + 1}`,
    nonce: `nonce-${index + 1}`,
    ciphertext: `ciphertext-${index + 1}`,
    ciphertextHash: `sha256:ciphertext-${index + 1}`
  });
  const items = await helper.buildMailboxStorageItemBatchForTrustedLinks(
    { scope: 'rules_bundle', linkType: 'managed_link', authorityMode: 'managed' },
    [trustedLink],
    { mailboxItemId: 'mbx-item', sealedPayloadForEnvelope }
  );

  assert.deepEqual(plain(items.map((item) => item.schema)), [
    'filtertube_managed_mailbox_item',
    'filtertube_managed_mailbox_item',
    'filtertube_managed_mailbox_item'
  ]);
  assert.deepEqual(plain(items.map((item) => item.scope)), ['keywords', 'channels', 'videos']);
  assert.deepEqual(plain(items.map((item) => item.mailboxItemId)), ['mbx-item-1', 'mbx-item-2', 'mbx-item-3']);
  assert.equal(items[0].cipherSuite, 'aes-kw+a256gcm');
  assert.equal(items[0].ciphertext, 'ciphertext-1');
  assert.equal(JSON.stringify(items).includes('"payload":'), false);
  assert.equal(JSON.stringify(items).includes('"envelope":'), false);
  assert.equal(JSON.stringify(items).includes('"managedPolicyEnvelope":'), false);
  assert.equal(JSON.stringify(items).includes('shakira'), false);
  assert.equal(JSON.stringify(items).includes('UC-shakira'), false);
  assert.equal(JSON.stringify(items).includes('privateKeyJwk'), false);

  let capturedRequest = null;
  const provider = {
    async uploadManagedMailboxItems(request) {
      capturedRequest = plain(request);
      return {
        ok: true,
        uploadedMailboxItemIds: [items[0].mailboxItemId, items[2].mailboxItemId]
      };
    }
  };

  const result = await helper.uploadMailboxItems(items, provider, { reason: 'manual_offline_send' });

  assert.equal(result.ok, true);
  assert.equal(result.mailboxItemCount, 3);
  assert.equal(result.uploadedMailboxItemCount, 2);
  assert.equal(result.failedMailboxItemCount, 1);
  assert.equal(result.markedSentCount, 2);
  assert.equal(capturedRequest.schema, 'filtertube_managed_mailbox_upload_request');
  assert.equal(capturedRequest.transport, 'encrypted_mailbox');
  assert.equal(capturedRequest.reason, 'manual_offline_send');
  assert.deepEqual(capturedRequest.scopes, ['keywords', 'channels', 'videos']);
  assert.equal(capturedRequest.items.length, 3);
  assert.equal(JSON.stringify(capturedRequest).includes('"payload":'), false);
  assert.equal(JSON.stringify(capturedRequest).includes('shakira'), false);
  assert.deepEqual(plain(policyUpdates.map((entry) => entry.patch.policy.outboundManagedPolicyHistory[0].summary.delivery)), [
    'encrypted_mailbox_provider',
    'encrypted_mailbox_provider'
  ]);
  assert.deepEqual(plain(policyUpdates.map((entry) => entry.patch.policy.outgoingManagedPolicies)), [
    {
      keywords: {
        revision: items[0].revision,
        policyHash: items[0].policyHash,
        sentAt: 1779300000000
      }
    },
    {
      videos: {
        revision: items[2].revision,
        policyHash: items[2].policyHash,
        sentAt: 1779300000000
      }
    }
  ]);

  const unavailable = await helper.uploadMailboxItems(items, {}, { reason: 'manual_offline_send' });
  assert.equal(unavailable.ok, false);
  assert.equal(unavailable.reason, 'mailbox_upload_provider_unavailable');
  assert.equal(unavailable.markedSentCount, 0);
});

test('managed live signed-send helper records matching live ack history without plaintext values', async () => {
  const { helper, trustedLink, policyUpdates } = createManagedLivePolicyHarness({ activeSurface: 'main' });
  const envelope = await helper.buildEnvelopeForLiveSend({ scope: 'keywords' });
  trustedLink.policy.outgoingManagedPolicies = {
    keywords: {
      revision: envelope.revision,
      policyHash: envelope.policyHash,
      sentAt: 1779300000000
    }
  };

  const ackPayload = helper.buildLiveAckPayload(envelope, {
    accepted: true,
    applied: true,
    decision: 'accept_newer_revision'
  });

  assert.equal(ackPayload.schema, 'filtertube_nanah_managed_live_ack');
  assert.equal(ackPayload.linkId, envelope.linkId);
  assert.equal(ackPayload.sourceDeviceId, 'parent-device-1');
  assert.equal(ackPayload.targetProfileId, 'child-profile-1');
  assert.equal(ackPayload.records[0].scope, 'keywords');
  assert.equal(ackPayload.records[0].revision, envelope.revision);
  assert.equal(ackPayload.records[0].policyHash, envelope.policyHash);
  assert.equal(ackPayload.records[0].ackState, 'delivered');
  assert.equal(JSON.stringify(ackPayload).includes('shakira'), false);
  assert.equal(JSON.stringify(ackPayload).includes('UC-shakira'), false);

  const result = await helper.recordLiveAckPayload(ackPayload);
  assert.deepEqual(plain({ ok: result.ok, reason: result.reason, recordedCount: result.recordedCount }), {
    ok: true,
    reason: '',
    recordedCount: 1
  });
  assert.equal(policyUpdates.length, 1);
  const policyPatch = policyUpdates[0].patch.policy;
  assert.equal(policyPatch.outgoingManagedPolicies.keywords.lastAckState, 'delivered');
  assert.equal(policyPatch.outgoingManagedPolicies.keywords.lastAckResult, 'accepted');
  assert.equal(policyPatch.outgoingManagedPolicies.keywords.lastAckReason, null);
  assert.equal(policyPatch.outgoingManagedPolicies.keywords.lastAckTargetProfileId, 'child-profile-1');

  const row = policyPatch.inboundManagedAckHistory[0];
  assert.equal(row.schema, 'filtertube_managed_live_ack_history');
  assert.equal(row.actionType, 'remote_policy.live_ack');
  assert.equal(row.trustedLinkId, envelope.linkId);
  assert.equal(row.scope, 'keywords');
  assert.equal(row.revision, envelope.revision);
  assert.equal(row.policyHash, envelope.policyHash);
  assert.equal(row.result, 'accepted');
  assert.equal(row.ackState, 'delivered');
  assert.equal(row.summary.redacted, true);
  assert.equal(JSON.stringify(row).includes('shakira'), false);
  assert.equal(JSON.stringify(row).includes('UC-shakira'), false);

  const staleAck = plain(ackPayload);
  staleAck.records[0].policyHash = 'remote-managed-policy-other';
  const staleResult = await helper.recordLiveAckPayload(staleAck);
  assert.deepEqual(plain({ ok: staleResult.ok, reason: staleResult.reason, recordedCount: staleResult.recordedCount }), {
    ok: false,
    reason: 'no_matching_ack_records',
    recordedCount: 0
  });
});

test('managed live signed-send helper records provider mailbox and local-network delivery acks by revision hash', async () => {
  const { helper, trustedLink, policyUpdates } = createManagedLivePolicyHarness({ activeSurface: 'main' });
  const envelope = await helper.buildEnvelopeForLiveSend({ scope: 'keywords' });
  trustedLink.policy.outgoingManagedPolicies = {
    keywords: {
      revision: envelope.revision,
      policyHash: envelope.policyHash,
      sentAt: 1779300000000
    }
  };

  const mailboxAck = {
    schema: 'filtertube_nanah_managed_open_sync_ack',
    version: 1,
    ackedAt: 1779300001000,
    linkId: envelope.linkId,
    sourceDeviceId: 'parent-device-1',
    sourceProfileId: 'parent-profile-1',
    targetProfileId: 'child-profile-1',
    records: [{
      mailboxItemId: 'mbx-child-keywords-1',
      scope: 'keywords',
      revision: envelope.revision,
      policyHash: envelope.policyHash,
      ackState: 'delivered',
      accepted: true,
      applied: true,
      ackedAt: 1779300001000
    }]
  };
  const mailboxResult = await helper.recordRemoteDeliveryAckPayload(mailboxAck);
  assert.deepEqual(plain({ ok: mailboxResult.ok, reason: mailboxResult.reason, recordedCount: mailboxResult.recordedCount }), {
    ok: true,
    reason: '',
    recordedCount: 1
  });
  const mailboxPatch = policyUpdates[0].patch.policy;
  assert.equal(mailboxPatch.outgoingManagedPolicies.keywords.lastAckState, 'delivered');
  assert.equal(mailboxPatch.outgoingManagedPolicies.keywords.lastAckResult, 'accepted');
  const mailboxRow = mailboxPatch.inboundManagedAckHistory[0];
  assert.equal(mailboxRow.schema, 'filtertube_managed_remote_delivery_ack_history');
  assert.equal(mailboxRow.actionType, 'remote_policy.mailbox.ack');
  assert.equal(mailboxRow.summary.transport, 'mailbox');
  assert.equal(mailboxRow.summary.mailboxItemId, 'mbx-child-keywords-1');
  assert.equal(JSON.stringify(mailboxRow).includes('shakira'), false);
  assert.equal(JSON.stringify(mailboxRow).includes('UC-shakira'), false);

  const localNetworkAck = {
    schema: 'filtertube_managed_local_network_candidate_ack',
    version: 1,
    ackedAt: 1779300002000,
    linkId: envelope.linkId,
    sourceDeviceId: 'parent-device-1',
    sourceProfileId: 'parent-profile-1',
    targetProfileId: 'child-profile-1',
    records: [{
      localNetworkCandidateId: 'lan-candidate-1',
      scope: 'keywords',
      revision: envelope.revision,
      policyHash: envelope.policyHash,
      ackState: 'accepted',
      accepted: true,
      applied: true,
      ackedAt: 1779300002000
    }]
  };
  const localNetworkResult = await helper.recordRemoteDeliveryAckPayload(localNetworkAck);
  assert.deepEqual(plain({ ok: localNetworkResult.ok, reason: localNetworkResult.reason, recordedCount: localNetworkResult.recordedCount }), {
    ok: true,
    reason: '',
    recordedCount: 1
  });
  const localNetworkPatch = policyUpdates[1].patch.policy;
  const localNetworkRow = localNetworkPatch.inboundManagedAckHistory[0];
  assert.equal(localNetworkRow.schema, 'filtertube_managed_remote_delivery_ack_history');
  assert.equal(localNetworkRow.actionType, 'remote_policy.local_network.ack');
  assert.equal(localNetworkRow.ackState, 'delivered');
  assert.equal(localNetworkRow.summary.transport, 'local_network');
  assert.equal(localNetworkRow.summary.localNetworkCandidateId, 'lan-candidate-1');

  const staleAck = plain(localNetworkAck);
  staleAck.records[0].policyHash = 'sha256:other-policy';
  const staleResult = await helper.recordRemoteDeliveryAckPayload(staleAck);
  assert.deepEqual(plain({ ok: staleResult.ok, reason: staleResult.reason, recordedCount: staleResult.recordedCount }), {
    ok: false,
    reason: 'no_matching_ack_records',
    recordedCount: 0
  });
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

test('managed live signed-send helper expands active and full into concrete signed profile policy envelopes', async () => {
  const { helper } = createManagedLivePolicyHarness({ allowedScopes: ['active'] });

  assert.deepEqual(plain(helper.expandScope('active')), ['main', 'kids', 'viewing_space', 'time_limits']);
  assert.deepEqual(plain(helper.expandScope('full')), ['main', 'kids', 'viewing_space', 'time_limits']);
  assert.throws(() => helper.buildPayload('active'), /expand into individual policy payloads/);
  assert.throws(() => helper.buildPayload('full'), /expand into individual policy payloads/);

  const activeEnvelopes = await helper.buildEnvelopeBatchForLiveSend({ scope: 'active' });
  assert.deepEqual(plain(activeEnvelopes.map((envelope) => envelope.scope)), ['main', 'kids', 'viewing_space', 'time_limits']);
  assert.deepEqual(plain(activeEnvelopes.map((envelope) => envelope.targetProfileId)), [
    'child-profile-1',
    'child-profile-1',
    'child-profile-1',
    'child-profile-1'
  ]);
  assert.deepEqual(plain(activeEnvelopes.map((envelope) => envelope.integrity.signedFields.payloadScope)), [
    'main',
    'kids',
    'viewing_space',
    'time_limits'
  ]);
  assert.equal(activeEnvelopes[0].payload.scope, 'main');
  assert.equal(activeEnvelopes[1].payload.scope, 'kids');
  assert.equal(activeEnvelopes[2].payload.scope, 'viewing_space');
  assert.equal(activeEnvelopes[3].payload.scope, 'time_limits');

  const fullEnvelopes = await helper.buildEnvelopeBatchForTrustedLinks(
    { scope: 'full', linkType: 'managed_link', authorityMode: 'managed' },
    [createManagedLivePolicyHarness({ allowedScopes: ['full'] }).trustedLink]
  );
  assert.deepEqual(plain(fullEnvelopes.map((envelope) => envelope.scope)), ['main', 'kids', 'viewing_space', 'time_limits']);
});

test('managed active and full bundle sends skip time-limit envelope when no policy exists', async () => {
  const sourceProfile = {
    settings: {
      allowMainViewing: true,
      allowKidsViewing: true
    },
    main: {
      mode: 'blocklist',
      keywords: [],
      channels: [],
      whitelistKeywords: [],
      whitelistChannels: [],
      videoIds: []
    },
    kids: {
      mode: 'blocklist',
      blockedKeywords: [],
      blockedChannels: [],
      whitelistKeywords: [],
      whitelistChannels: [],
      videoIds: []
    }
  };
  const { helper } = createManagedLivePolicyHarness({ sourceProfile, allowedScopes: ['full'] });

  assert.deepEqual(plain(helper.resolveConcreteSendScopes('full')), ['main', 'kids', 'viewing_space']);

  const envelopes = await helper.buildEnvelopeBatchForLiveSend({ scope: 'full' });
  assert.deepEqual(plain(envelopes.map((envelope) => envelope.scope)), ['main', 'kids', 'viewing_space']);
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
