import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const adapterPath = 'js/nanah_sync_adapter.js';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function stablePolicyJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stablePolicyJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stablePolicyJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function buildLocalPolicyHash(prefix, seed) {
  const source = JSON.stringify(seed);
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }
  return `${prefix}-${Math.abs(hash).toString(16)}`;
}

function canonicalPolicyHashForEnvelope(envelope) {
  return buildLocalPolicyHash('remote-managed-policy', stablePolicyJson({
    linkId: String(envelope.linkId || '').trim(),
    scope: String(envelope.scope || '').trim().toLowerCase(),
    targetProfileId: String(envelope.targetProfileId || '').trim(),
    sourceProfileId: String(envelope.sourceProfileId || '').trim(),
    sourceDeviceId: String(envelope.sourceDeviceId || '').trim(),
    payload: safeObject(envelope.payload)
  }));
}

function createProfilesFixture() {
  return {
    schemaVersion: 4,
    activeProfileId: 'child-profile-1',
    profiles: {
      'parent-profile-1': {
        id: 'parent-profile-1',
        type: 'account',
        parentProfileId: null,
        name: 'Parent',
        settings: { allowMainViewing: true, allowKidsViewing: true },
        main: { mode: 'blocklist', channels: [], keywords: [], whitelistChannels: [], whitelistKeywords: [] },
        kids: { mode: 'blocklist', blockedChannels: [], blockedKeywords: [], whitelistChannels: [], whitelistKeywords: [] }
      },
      'child-profile-1': {
        id: 'child-profile-1',
        type: 'child',
        parentProfileId: 'parent-profile-1',
        name: 'Child',
        settings: { allowMainViewing: true, allowKidsViewing: true },
        main: {
          mode: 'blocklist',
          channels: [{ id: 'UC-existing', name: 'Existing' }],
          keywords: [{ word: 'existing', source: 'user' }],
          whitelistChannels: [],
          whitelistKeywords: [],
          videoIds: ['oldVideo']
        },
        kids: {
          mode: 'blocklist',
          strictMode: true,
          blockedChannels: [],
          blockedKeywords: [],
          whitelistChannels: [],
          whitelistKeywords: [],
          videoIds: []
        }
      }
    }
  };
}

function createAdapterHarness(initialProfiles = createProfilesFixture()) {
  let profiles = initialProfiles;
  let saveCount = 0;
  const io = {
    loadProfilesV4: async () => profiles,
    saveProfilesV4: async (next) => {
      saveCount += 1;
      profiles = next;
      return true;
    },
    exportV3: async ({ scope }) => ({ scope }),
    importV3: async (portable, options) => ({ ok: true, portable, options })
  };
  const sandbox = {
    FilterTubeIO: io,
    crypto: { randomUUID: () => 'nanah-managed-test-uuid' },
    navigator: { platform: 'TestOS' },
    Date: { now: () => 1779300000000 },
    Math
  };
  vm.runInNewContext(read(adapterPath), sandbox, { filename: adapterPath });
  return {
    adapter: sandbox.FilterTubeNanahAdapter,
    get profiles() {
      return profiles;
    },
    get saveCount() {
      return saveCount;
    }
  };
}

function signedEnvelope(overrides = {}) {
  const hasPolicyHashOverride = Object.prototype.hasOwnProperty.call(overrides, 'policyHash');
  const envelope = {
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
      surface: 'main',
      operations: [{ op: 'add_keyword', value: 'spiders' }]
    },
    ...overrides
  };
  if (!hasPolicyHashOverride) {
    envelope.policyHash = canonicalPolicyHashForEnvelope(envelope);
  }
  envelope.integrity = overrides.integrity || {
    algorithm: 'ed25519',
    signature: `signature-${envelope.scope}-${envelope.revision}`,
    signedFields: {
      linkId: envelope.linkId,
      scope: envelope.scope,
      targetProfileId: envelope.targetProfileId,
      sourceDeviceId: envelope.sourceDeviceId,
      revision: envelope.revision,
      policyHash: envelope.policyHash,
      payloadScope: envelope.payload.scope
    }
  };
  return envelope;
}

function validationContext(profiles, overrides = {}) {
  return {
    trustedLink: {
      id: 'link-parent-child-1',
      type: 'managed_link',
      localRole: 'replica',
      remoteRole: 'source',
      sourceDeviceId: 'parent-device-1',
      sourceProfileId: 'parent-profile-1',
      targetProfileId: 'child-profile-1',
      allowedScopes: ['main', 'kids', 'videos', 'keywords', 'channels', 'viewing_space', 'time_limits'],
      sourcePublicKeyId: 'parent-key-3',
      keyVersion: 3
    },
    profiles: profiles.profiles,
    accepted: null,
    duplicateDeviceIds: [],
    verifyIntegritySignature: () => ({ verified: true }),
    ...overrides
  };
}

test('managed policy apply refuses to write without validation context', async () => {
  const harness = createAdapterHarness();
  const result = await harness.adapter.applyManagedPolicyEnvelope(signedEnvelope(), {});

  assert.deepEqual(plain(result), { accepted: false, reason: 'missing_managed_validation_context' });
  assert.equal(harness.saveCount, 0);
});

test('managed policy apply writes keyword policy only to fixed child profile and persists revision state', async () => {
  const harness = createAdapterHarness();
  const envelope = signedEnvelope();
  const result = await harness.adapter.applyManagedPolicyEnvelope(
    envelope,
    validationContext(harness.profiles, {
      accepted: { revision: 4, policyHash: envelope.policyHash }
    })
  );

  assert.deepEqual(plain(result), {
    ok: true,
    accepted: true,
    decision: 'accept_newer_revision',
    scope: 'keywords',
    profileId: 'child-profile-1',
    revision: 5,
    policyHash: envelope.policyHash,
    applied: true
  });
  assert.equal(harness.saveCount, 1);
  assert.deepEqual(plain(harness.profiles.profiles['parent-profile-1'].main.keywords), []);
  assert.deepEqual(
    plain(harness.profiles.profiles['child-profile-1'].main.keywords.map((entry) => entry.word)),
    ['existing', 'spiders']
  );
  assert.equal(
    harness.profiles.profiles['child-profile-1'].managedPolicyState.remoteManagedPolicies['link-parent-child-1'].keywords.revision,
    5
  );
});

test('managed policy apply blocks stale replay after accepted revision has been persisted', async () => {
  const harness = createAdapterHarness();
  await harness.adapter.applyManagedPolicyEnvelope(
    signedEnvelope(),
    validationContext(harness.profiles)
  );

  const replay = await harness.adapter.applyManagedPolicyEnvelope(
    signedEnvelope({
      revision: 4
    }),
    validationContext(harness.profiles, {
      accepted: { revision: 5, policyHash: signedEnvelope().policyHash }
    })
  );

  assert.deepEqual(plain(replay), { accepted: false, reason: 'stale_revision' });
  assert.equal(harness.saveCount, 1);
});

test('managed policy apply refuses revoked queued delivery without mutating the child profile', async () => {
  const harness = createAdapterHarness();
  const before = plain(harness.profiles.profiles['child-profile-1']);
  const envelope = signedEnvelope({ revision: 6 });

  const directResult = await harness.adapter.applyManagedPolicyEnvelope(
    envelope,
    validationContext(harness.profiles, {
      trustedLink: {
        ...validationContext(harness.profiles).trustedLink,
        revoked: true
      }
    })
  );

  assert.deepEqual(plain(directResult), { accepted: false, reason: 'link_revoked' });
  assert.equal(harness.saveCount, 0);
  assert.deepEqual(plain(harness.profiles.profiles['child-profile-1']), before);

  const mailboxResult = await harness.adapter.applyManagedMailboxItem(
    {
      schema: 'filtertube_managed_mailbox_item',
      version: 1,
      decryptedEnvelope: envelope
    },
    validationContext(harness.profiles, {
      trustedLink: {
        ...validationContext(harness.profiles).trustedLink,
        revoked: true
      }
    })
  );

  assert.deepEqual(plain(mailboxResult), {
    accepted: false,
    reason: 'link_revoked',
    ackState: 'revoked'
  });
  assert.equal(harness.saveCount, 0);
  assert.deepEqual(plain(harness.profiles.profiles['child-profile-1']), before);
});

test('managed policy apply supports channel and video blocking on child kids surface', async () => {
  const harness = createAdapterHarness();
  await harness.adapter.applyManagedPolicyEnvelope(
    signedEnvelope({
      scope: 'channels',
      revision: 6,
      payload: {
        scope: 'channels',
        surface: 'kids',
        operations: [{ op: 'add_channel', channelId: 'UC-kids-blocked', name: 'Kids Blocked' }]
      }
    }),
    validationContext(harness.profiles)
  );
  await harness.adapter.applyManagedPolicyEnvelope(
    signedEnvelope({
      scope: 'videos',
      revision: 7,
      payload: {
        scope: 'videos',
        surface: 'kids',
        operations: [{ op: 'add_video', videoId: 'badVideo123' }]
      }
    }),
    validationContext(harness.profiles)
  );

  const child = harness.profiles.profiles['child-profile-1'];
  assert.deepEqual(plain(child.kids.blockedChannels.map((entry) => entry.id)), ['UC-kids-blocked']);
  assert.deepEqual(plain(child.kids.videoIds), ['badVideo123']);
  assert.equal(child.managedPolicyState.remoteManagedPolicies['link-parent-child-1'].channels.revision, 6);
  assert.equal(child.managedPolicyState.remoteManagedPolicies['link-parent-child-1'].videos.revision, 7);
});

test('managed policy apply supports viewing-space and time-limit child policy updates', async () => {
  const harness = createAdapterHarness();
  await harness.adapter.applyManagedPolicyEnvelope(
    signedEnvelope({
      scope: 'viewing_space',
      revision: 8,
      payload: {
        scope: 'viewing_space',
        allowMain: false,
        allowKids: true,
        defaultLaunchTarget: 'kids'
      }
    }),
    validationContext(harness.profiles)
  );
  const timeLimitEnvelope = signedEnvelope({
    scope: 'time_limits',
    revision: 9,
    payload: {
      scope: 'time_limits',
      dailyBudgetMinutes: 120
    }
  });
  await harness.adapter.applyManagedPolicyEnvelope(
    timeLimitEnvelope,
    validationContext(harness.profiles)
  );

  const settings = harness.profiles.profiles['child-profile-1'].settings;
  assert.equal(settings.allowMainViewing, false);
  assert.equal(settings.allowKidsViewing, true);
  assert.equal(settings.defaultLaunchTarget, 'kids');
  assert.deepEqual(plain(settings.timeLimitPolicy), {
    schema: 'filtertube_managed_time_limit',
    version: 1,
    enabled: true,
    timezone: 'UTC',
    dailyBudgetSeconds: 7200,
    surfaceBudgets: {
      main: 7200,
      kids: 7200
    },
    countingMode: 'active_youtube_tab',
    activeDeviceBudgetPolicy: 'single_active_tab_no_double_count',
    resetPolicy: 'policy_timezone_midnight',
    graceSeconds: 0,
    parentGrant: {
      enabled: false,
      extraSeconds: 0,
      expiresAt: null,
      reason: ''
    },
    policyRevision: 9,
    policyHash: timeLimitEnvelope.policyHash,
    issuedAt: 1779300000000,
    validFrom: 1779300000000,
    validUntil: null
  });

  const saveCountBeforeInvalidTimezone = harness.saveCount;
  await assert.rejects(
    () => harness.adapter.applyManagedPolicyEnvelope(
      signedEnvelope({
        scope: 'time_limits',
        revision: 10,
        payload: {
          scope: 'time_limits',
          dailyBudgetMinutes: 60,
          timezone: 'Local'
        }
      }),
      validationContext(harness.profiles)
    ),
    /requires a valid timezone/
  );
  assert.equal(harness.saveCount, saveCountBeforeInvalidTimezone);

  await assert.rejects(
    () => harness.adapter.applyManagedPolicyEnvelope(
      signedEnvelope({
        scope: 'viewing_space',
        revision: 10,
        payload: {
          scope: 'viewing_space',
          allowMain: false,
          allowKids: false
        }
      }),
      validationContext(harness.profiles)
    ),
    /cannot disable every viewing space/
  );
});
