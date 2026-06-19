import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const repoRoot = process.cwd();
const helperPath = 'js/nanah_managed_open_sync.js';
const tabViewPath = 'js/tab-view.js';
const tabHtmlPath = 'html/tab-view.html';
const docPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_PULL_ON_OPEN_2026-06-04.md';
const mailboxDocPath = 'docs/audit/FILTERTUBE_MANAGED_POLICY_ENCRYPTED_MAILBOX_PROTOCOL_2026-06-04.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadFactory({ provider = null, now = 1770600000000 } = {}) {
  const context = { window: {} };
  if (provider) context.window.FilterTubeManagedPolicyOpenSync = provider;
  vm.runInNewContext(read(helperPath), context);
  return context.window.FilterTubeNanahManagedOpenSync.create({
    normalizeString(value) {
      return typeof value === 'string' ? value.trim() : '';
    },
    safeObject(value) {
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    },
    safeArray(value) {
      return Array.isArray(value) ? value : [];
    },
    now: () => now
  });
}

function managedLink(overrides = {}) {
  return {
    linkId: 'link-parent-child-1',
    remoteDeviceId: 'parent-device-1',
    deviceLabel: 'Parent phone',
    localRole: 'replica',
    remoteRole: 'source',
    linkType: 'managed_link',
    sourceDeviceId: 'parent-device-1',
    sourceProfileId: 'parent-profile-1',
    sourcePublicKeyId: 'parent-key-1',
    keyVersion: 1,
    policy: {
      allowedScopes: ['keywords', 'channels'],
      defaultScope: 'keywords',
      targetProfileBehavior: 'fixed_profile',
      targetProfileId: 'child-profile-1',
      targetProfileName: 'Child',
      lockedChildMode: 'allow_trusted_updates',
      syncOnProfileOpen: true,
      sourceDeviceId: 'parent-device-1',
      sourceProfileId: 'parent-profile-1',
      sourcePublicKeyId: 'parent-key-1',
      keyVersion: 1
    },
    ...overrides
  };
}

function profilesV4() {
  return {
    activeProfileId: 'child-profile-1',
    profiles: {
      'child-profile-1': {
        type: 'child',
        name: 'Child',
        managedPolicyState: {
          remoteManagedPolicies: {
            'link-parent-child-1': {
              keywords: {
                revision: 3,
                policyHash: 'sha256:accepted-keywords-3'
              }
            }
          }
        }
      }
    }
  };
}

test('managed open-sync audit is docs-backed and linked from plan inventory and mailbox protocol', () => {
  const doc = read(docPath);
  const mailboxDoc = read(mailboxDocPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);

  assert.match(doc, /Provider-gated dashboard\/profile-open hook, provider ack handoff,\s+protected ack-handoff history writer, and explicitly configured browser HTTPS\s+mailbox pull\/decrypt client are present/);
  assert.match(doc, /Local-network discovery and mailbox\s+server authority are still absent/);
  assert.match(doc, /runtime pull-on-open candidate gate: present/);
  assert.match(doc, /runtime provider-gated decrypted item pull: present/);
  assert.match(doc, /runtime provider-gated mailbox ack handoff: present/);
  assert.match(doc, /runtime protected mailbox ack-handoff history writer: present/);
  assert.match(doc, /runtime provider failure fail-closed item apply guard: present/);
  assert.match(doc, /Provider failures and thrown provider errors do not apply or ack returned\s+items/);
  assert.match(doc, /runtime YouTube page hot-path work from this slice: absent/);
  assert.match(mailboxDoc, /provider-gated ack handoff: present/);
  assert.match(mailboxDoc, /runtime protected mailbox ack-handoff history rows: present/);
  assert.match(mailboxDoc, /provider failure fail-closed apply guard: present/);
  assert.match(mailboxDoc, /provider-gated dashboard\/profile-open pull hook: present/);
  assert.match(plan, /Provider rejection or provider\s+failure now fails closed\s+without applying or\s+acknowledging any returned\s+items/);
  assert.match(plan, /Provider `ok: false` responses and provider exceptions do not apply or ack\s+returned\s+items and leave the last accepted policy active/);
  assert.match(inventory, /Provider rejection\s+or\s+provider\s+failure\s+now fails closed\s+without applying or\s+acknowledging returned\s+mailbox items/);
  assert.match(inventory, /Provider rejection or provider\s+failure fails closed without applying or acknowledging returned items/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));
});

test('dashboard loads open-sync helper and wires policy toggle status and open/profile hooks', () => {
  const tabView = read(tabViewPath);
  const html = read(tabHtmlPath);

  assert.match(html, /js\/nanah_managed_mailbox_client\.js/);
  assert.match(html, /js\/nanah_managed_open_sync\.js/);
  assert.match(tabView, /const NANAH_MANAGED_OPEN_SYNC_STATE_KEY = 'ftNanahManagedOpenSyncState'/);
  assert.match(tabView, /function formatNanahManagedOpenSyncStatus\(link\)/);
  assert.match(tabView, /async function runNanahManagedOpenSync\(\{ reason = 'dashboard_open' \} = \{\}\)/);
  assert.match(tabView, /async function recordManagedOpenSyncAckHistory\(details = \{\}\)/);
  assert.match(tabView, /transport === 'local_network' \? 'remote_policy\.local_network\.ack' : 'remote_policy\.mailbox\.ack'/);
  assert.match(tabView, /recordAckHistory: \(details\) => recordManagedOpenSyncAckHistory\(details\)/);
  assert.match(tabView, /window\.FilterTubeNanahManagedOpenSync\?\.create/);
  assert.match(tabView, /syncOnProfileOpen: linkType === 'managed_link' && syncOnProfileOpen/);
  assert.match(tabView, /Check for parent updates when this profile opens/);
  assert.match(tabView, /Internet Pickup/);
  assert.match(tabView, /await runNanahManagedOpenSync\(\{ reason: 'dashboard_open' \}\)/);
  assert.match(tabView, /await runNanahManagedOpenSync\(\{ reason: 'profile_switch' \}\)/);
});

test('open-sync helper collects only opted-in trusted replica links for the active target profile', () => {
  const helper = loadFactory();
  const candidates = helper.collectManagedOpenSyncLinks({
    links: [
      managedLink(),
      managedLink({ linkId: 'off-link', policy: { ...managedLink().policy, syncOnProfileOpen: false } }),
      managedLink({ linkId: 'wrong-role', localRole: 'source', remoteRole: 'replica' }),
      managedLink({ linkId: 'wrong-target', policy: { ...managedLink().policy, targetProfileId: 'sibling-profile-1' } })
    ],
    activeProfileId: 'child-profile-1',
    profilesV4: profilesV4()
  });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].linkId, 'link-parent-child-1');
  assert.equal(candidates[0].targetProfileId, 'child-profile-1');
  assert.equal(candidates[0].accepted.keywords.revision, 3);
});

test('open-sync provider absence records status without applying or pulling', async () => {
  const helper = loadFactory();
  let savedState = null;
  let applied = 0;
  const state = await helper.runOpenSync({
    links: [managedLink()],
    activeProfileId: 'child-profile-1',
    profilesV4: profilesV4(),
    applyMailboxItem: async () => {
      applied += 1;
      return { accepted: true };
    },
    writeState: async (nextState) => {
      savedState = nextState;
    }
  });

  assert.equal(applied, 0);
  assert.equal(state.reasonCode, 'pull_provider_unavailable');
  assert.equal(state.providerAvailable, false);
  assert.equal(state.eligibleLinkCount, 1);
  assert.deepEqual(savedState, state);
});

test('open-sync provider failure never applies or acknowledges returned mailbox items', async () => {
  const provider = {
    async pullDecryptedMailboxItems() {
      return {
        ok: false,
        reason: 'parent_offline',
        items: [
          { schema: 'filtertube_managed_mailbox_item', mailboxItemId: 'must-not-apply' }
        ]
      };
    },
    async ackDecryptedMailboxItems() {
      throw new Error('ack should not run');
    }
  };
  const helper = loadFactory({ provider });
  let applied = 0;
  const state = await helper.runOpenSync({
    links: [managedLink()],
    activeProfileId: 'child-profile-1',
    profilesV4: profilesV4(),
    applyMailboxItem: async () => {
      applied += 1;
      return { accepted: true, applied: true };
    },
    writeState: async () => {}
  });

  assert.equal(applied, 0);
  assert.equal(state.providerAvailable, true);
  assert.equal(state.pulledItemCount, 0);
  assert.equal(state.appliedItemCount, 0);
  assert.equal(state.rejectedItemCount, 0);
  assert.equal(state.ackAttemptedCount, 0);
  assert.equal(state.ackedItemCount, 0);
  assert.equal(state.ackFailedCount, 0);
  assert.equal(state.linkResults[0].ok, false);
  assert.equal(state.linkResults[0].reason, 'parent_offline');
  assert.equal(state.linkResults[0].pulledItemCount, 0);
  assert.equal(helper.formatStatus(managedLink(), state, 'child-profile-1'), 'Provider rejected pull (just now)');
});

test('open-sync provider throw fails closed without applying or acknowledging items', async () => {
  const provider = {
    async pullDecryptedMailboxItems() {
      throw new Error('local provider unavailable');
    },
    async ackDecryptedMailboxItems() {
      throw new Error('ack should not run');
    }
  };
  const helper = loadFactory({ provider });
  let applied = 0;
  const state = await helper.runOpenSync({
    links: [managedLink()],
    activeProfileId: 'child-profile-1',
    profilesV4: profilesV4(),
    applyMailboxItem: async () => {
      applied += 1;
      return { accepted: true, applied: true };
    },
    writeState: async () => {}
  });

  assert.equal(applied, 0);
  assert.equal(state.providerAvailable, true);
  assert.equal(state.linkResults[0].ok, false);
  assert.equal(state.linkResults[0].reason, 'local provider unavailable');
  assert.equal(state.ackAttemptedCount, 0);
  assert.equal(helper.formatStatus(managedLink(), state, 'child-profile-1'), 'Provider rejected pull (just now)');
});

test('open-sync provider applies only returned decrypted mailbox items and emits redacted ack records', async () => {
  const ackPayloads = [];
  const historyCalls = [];
  const provider = {
    async pullDecryptedMailboxItems(request) {
      assert.equal(request.schema, 'filtertube_nanah_managed_open_sync_request');
      assert.equal(request.targetProfileId, 'child-profile-1');
      assert.deepEqual(request.allowedScopes, ['keywords', 'channels']);
      return {
        ok: true,
        items: [
          { schema: 'filtertube_managed_mailbox_item', mailboxItemId: 'accepted-item' },
          { schema: 'filtertube_managed_mailbox_item', mailboxItemId: 'rejected-item' }
        ]
      };
    },
    async ackDecryptedMailboxItems(payload) {
      ackPayloads.push(payload);
      return { ok: true, ackedItemCount: payload.records.length };
    }
  };
  const helper = loadFactory({ provider });
  const state = await helper.runOpenSync({
    links: [managedLink()],
    activeProfileId: 'child-profile-1',
    profilesV4: profilesV4(),
    applyMailboxItem: async (item) => item.mailboxItemId === 'accepted-item'
      ? { accepted: true, applied: true }
      : { accepted: false, reason: 'wrong_target_profile' },
    recordAckHistory: async (details) => {
      historyCalls.push(details);
      return { ok: true, recordedCount: details.records.length, failedCount: 0 };
    },
    writeState: async () => {}
  });

  assert.equal(state.providerAvailable, true);
  assert.equal(state.pulledItemCount, 2);
  assert.equal(state.appliedItemCount, 1);
  assert.equal(state.rejectedItemCount, 1);
  assert.equal(state.ackProviderAvailable, true);
  assert.equal(state.ackAttemptedCount, 2);
  assert.equal(state.ackedItemCount, 2);
  assert.equal(state.ackFailedCount, 0);
  assert.equal(state.ackHistoryRecordedCount, 2);
  assert.equal(state.ackHistoryFailedCount, 0);
  assert.equal(state.linkResults[0].appliedItemCount, 1);
  assert.equal(state.linkResults[0].rejectedItemCount, 1);
  assert.equal(state.linkResults[0].ackedItemCount, 2);
  assert.equal(state.linkResults[0].ackHistoryRecordedCount, 2);
  assert.equal(state.linkResults[0].ackHistoryFailedCount, 0);

  assert.equal(ackPayloads.length, 1);
  assert.equal(ackPayloads[0].schema, 'filtertube_nanah_managed_open_sync_ack');
  assert.equal(ackPayloads[0].linkId, 'link-parent-child-1');
  assert.deepEqual(
    JSON.parse(JSON.stringify(ackPayloads[0].records.map(row => [row.mailboxItemId, row.ackState, row.accepted, row.applied]))),
    [
      ['accepted-item', 'delivered', true, true],
      ['rejected-item', 'rejected', false, false]
    ]
  );
  assert.doesNotMatch(JSON.stringify(ackPayloads[0]), /spiders|keywordValue|channelName|videoTitle|plaintext/i);
  assert.equal(historyCalls.length, 1);
  assert.equal(historyCalls[0].request.schema, 'filtertube_nanah_managed_open_sync_request');
  assert.equal(historyCalls[0].candidate.linkId, 'link-parent-child-1');
  assert.deepEqual(
    JSON.parse(JSON.stringify(historyCalls[0].records.map(row => [row.mailboxItemId, row.ackState, row.accepted, row.applied]))),
    [
      ['accepted-item', 'delivered', true, true],
      ['rejected-item', 'rejected', false, false]
    ]
  );
  assert.doesNotMatch(JSON.stringify(historyCalls[0]), /spiders|keywordValue|channelName|videoTitle|plaintext/i);
});

test('open-sync provider pull without ack writer records ack-unavailable without retrying YouTube hot paths', async () => {
  const provider = {
    async pullDecryptedMailboxItems() {
      return {
        ok: true,
        items: [{ schema: 'filtertube_managed_mailbox_item', mailboxItemId: 'accepted-item' }]
      };
    }
  };
  const helper = loadFactory({ provider });
  const state = await helper.runOpenSync({
    links: [managedLink()],
    activeProfileId: 'child-profile-1',
    profilesV4: profilesV4(),
    applyMailboxItem: async () => ({ accepted: true, applied: true }),
    writeState: async () => {}
  });

  assert.equal(state.providerAvailable, true);
  assert.equal(state.ackProviderAvailable, false);
  assert.equal(state.ackAttemptedCount, 1);
  assert.equal(state.ackedItemCount, 0);
  assert.equal(state.ackFailedCount, 1);
  assert.equal(state.linkResults[0].ackReason, 'ack_provider_unavailable');
  assert.equal(helper.formatStatus(managedLink(), state, 'child-profile-1'), '1 applied, 0 rejected, 1 ack failed (just now)');
});

test('open-sync helper does not add page hot-path observers timers or network clients', () => {
  const helperSource = read(helperPath);

  assert.match(helperSource, /filtertube_nanah_managed_open_sync_ack/);
  assert.match(helperSource, /recordAckHistory/);
  assert.match(helperSource, /ackHistoryRecordedCount/);
  assert.match(helperSource, /ackDecryptedMailboxItems/);
  assert.match(helperSource, /ackMailboxItems/);
  assert.match(helperSource, /items: ok \? safeArray\(result\?\.items\) : \[\]/);
  assert.match(helperSource, /catch \(error\)/);
  assert.match(helperSource, /if \(result\.ok !== true\)/);
  assert.doesNotMatch(helperSource, /MutationObserver/);
  assert.doesNotMatch(helperSource, /addEventListener/);
  assert.doesNotMatch(helperSource, /setInterval/);
  assert.doesNotMatch(helperSource, /\bfetch\s*\(/);
  assert.doesNotMatch(helperSource, /XMLHttpRequest/);
  assert.doesNotMatch(helperSource, /chrome\.tabs/);
  assert.doesNotMatch(helperSource, /browser\.tabs/);
});
