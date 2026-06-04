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

  assert.match(doc, /Provider-gated dashboard\/profile-open hook is present/);
  assert.match(doc, /Server\s+mailbox client, server ack writer, mailbox decryption client, and local-network\s+discovery are still absent/);
  assert.match(doc, /runtime pull-on-open candidate gate: present/);
  assert.match(doc, /runtime provider-gated decrypted item pull: present/);
  assert.match(doc, /runtime YouTube page hot-path work from this slice: absent/);
  assert.match(mailboxDoc, /provider-gated dashboard\/profile-open pull hook: present/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));
});

test('dashboard loads open-sync helper and wires policy toggle status and open/profile hooks', () => {
  const tabView = read(tabViewPath);
  const html = read(tabHtmlPath);

  assert.match(html, /js\/nanah_managed_open_sync\.js/);
  assert.match(tabView, /const NANAH_MANAGED_OPEN_SYNC_STATE_KEY = 'ftNanahManagedOpenSyncState'/);
  assert.match(tabView, /function formatNanahManagedOpenSyncStatus\(link\)/);
  assert.match(tabView, /async function runNanahManagedOpenSync\(\{ reason = 'dashboard_open' \} = \{\}\)/);
  assert.match(tabView, /window\.FilterTubeNanahManagedOpenSync\?\.create/);
  assert.match(tabView, /syncOnProfileOpen: linkType === 'managed_link' && syncOnProfileOpen/);
  assert.match(tabView, /Check for parent updates when this profile opens/);
  assert.match(tabView, /Open sync/);
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

test('open-sync provider applies only returned decrypted mailbox items and counts rejected results', async () => {
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
    writeState: async () => {}
  });

  assert.equal(state.providerAvailable, true);
  assert.equal(state.pulledItemCount, 2);
  assert.equal(state.appliedItemCount, 1);
  assert.equal(state.rejectedItemCount, 1);
  assert.equal(state.linkResults[0].appliedItemCount, 1);
  assert.equal(state.linkResults[0].rejectedItemCount, 1);
});

test('open-sync helper does not add page hot-path observers timers or network clients', () => {
  const helperSource = read(helperPath);

  assert.doesNotMatch(helperSource, /MutationObserver/);
  assert.doesNotMatch(helperSource, /addEventListener/);
  assert.doesNotMatch(helperSource, /setInterval/);
  assert.doesNotMatch(helperSource, /\bfetch\s*\(/);
  assert.doesNotMatch(helperSource, /XMLHttpRequest/);
  assert.doesNotMatch(helperSource, /chrome\.tabs/);
  assert.doesNotMatch(helperSource, /browser\.tabs/);
});
