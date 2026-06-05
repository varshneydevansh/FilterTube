import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANAGED_PARENT_UI_SURFACE_SPEC_2026-06-03.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function managedPolicyRevisionLabel(state, label) {
  const root = safeObject(state);
  const revision = normalizeNonNegativeInteger(root.policyRevision || root.revision);
  const updatedAt = normalizeNonNegativeInteger(root.updatedAt || root.receivedAt || root.issuedAt);
  if (!revision) return '';
  const suffix = updatedAt ? `, ${new Date(updatedAt).toLocaleDateString()}` : '';
  return `${label} r${revision}${suffix}`;
}

function managedActionHistoryRowIsProtected(row) {
  const result = normalizeString(row?.result);
  const actionType = normalizeString(row?.actionType);
  return ['rejected', 'conflict', 'failed_auth', 'expired_session'].includes(result)
    || ['trust_link.revoke', 'policy.time_limit.update', 'policy.viewing_space.update'].includes(actionType);
}

function summarizeManagedPolicyStateForProfile(profile) {
  const managedState = safeObject(profile?.managedPolicyState);
  const localEdits = safeObject(managedState.localManagedEdits);
  const remotePolicies = safeObject(managedState.remoteManagedPolicies);
  const localLabels = ['main', 'kids']
    .map(scope => managedPolicyRevisionLabel(localEdits[scope], scope === 'kids' ? 'Kids' : 'Main'))
    .filter(Boolean);
  let remoteLinkCount = 0;
  let remoteScopeCount = 0;
  let latestRemoteRevision = 0;
  Object.values(remotePolicies).forEach((linkPolicies) => {
    const scopes = Object.values(safeObject(linkPolicies)).filter((entry) => {
      const state = safeObject(entry);
      return !!(normalizeNonNegativeInteger(state.revision) && normalizeString(state.policyHash));
    });
    if (!scopes.length) return;
    remoteLinkCount += 1;
    remoteScopeCount += scopes.length;
    scopes.forEach((entry) => {
      latestRemoteRevision = Math.max(
        latestRemoteRevision,
        normalizeNonNegativeInteger(safeObject(entry).revision) || 0
      );
    });
  });
  const historyRows = Array.isArray(profile?.managedActionHistory)
    ? profile.managedActionHistory.filter(row => safeObject(row).schema === 'filtertube_managed_action_history')
    : [];
  const protectedRows = historyRows.filter(managedActionHistoryRowIsProtected);
  const latestRow = safeObject(historyRows[historyRows.length - 1]);
  return {
    localLabels,
    remoteLinkCount,
    remoteScopeCount,
    latestRemoteRevision,
    historyRowCount: historyRows.length,
    protectedRowCount: protectedRows.length,
    latestResult: normalizeString(latestRow.result),
    latestScope: normalizeString(latestRow.scope)
  };
}

function buildManagedProfileStatusText(profile, { revealDetails = false } = {}) {
  if (!revealDetails) return '';
  const summary = summarizeManagedPolicyStateForProfile(profile);
  const parts = [];
  if (summary.localLabels.length) {
    parts.push(`Local edits: ${summary.localLabels.join(', ')}`);
  }
  if (summary.remoteScopeCount) {
    const linkLabel = summary.remoteLinkCount === 1 ? 'link' : 'links';
    const scopeLabel = summary.remoteScopeCount === 1 ? 'scope' : 'scopes';
    parts.push(`Remote sync: ${summary.remoteScopeCount} ${scopeLabel} across ${summary.remoteLinkCount} ${linkLabel}, latest r${summary.latestRemoteRevision}`);
  }
  if (summary.historyRowCount) {
    const rowLabel = summary.historyRowCount === 1 ? 'row' : 'rows';
    const latest = summary.latestResult && summary.latestScope
      ? `, latest ${summary.latestResult}/${summary.latestScope}`
      : '';
    parts.push(`History: ${summary.historyRowCount} ${rowLabel}, ${summary.protectedRowCount} protected${latest}`);
  }
  return parts.length
    ? `Managed status: ${parts.join(' | ')}`
    : 'Managed status: no parent-managed policy revisions yet.';
}

test('managed parent UI surface docs and runtime binding are linked', () => {
  const doc = read(docPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);
  const source = read('js/tab-view.js');

  assert.match(doc, /Status\*\*: Spec plus first dashboard child-row status increment present/);
  assert.match(doc, /full\s+command-center panel is not implemented yet/);
  assert.match(doc, /Parent-Facing States/);
  assert.match(doc, /UI Boundaries/);
  assert.match(doc, /Current Runtime Binding/);
  assert.match(doc, /Next Command-Center Slice/);
  assert.match(doc, /runtime managed parent child-row status helper: present/);
  assert.match(doc, /runtime child\/protected detailed status suppression: present/);
  assert.match(doc, /runtime status plaintext rule value exposure: absent/);
  assert.match(doc, /runtime full managed command-center panel: absent/);
  assert.match(plan, new RegExp(docPath));
  assert.match(plan, /next\s+command-center slice is pinned as a dashboard\/profile surface requirement/);
  assert.match(inventory, new RegExp(docPath));
  assert.match(inventory, /compact,\s+read-only managed status line/);
  assert.match(inventory, /display evidence only/);

  assert.match(source, /function buildManagedProfileStatusText\(profile, \{ revealDetails = false \} = \{\}\)/);
  assert.match(source, /function summarizeManagedPolicyStateForProfile\(profile\)/);
  assert.match(source, /const managedStatusText = type === 'child'/);
  assert.match(source, /revealDetails: canManageTarget && !childAdminRestricted/);
  assert.match(source, /ft-managed-profile-status/);
  assert.match(source, /historyBtn\.textContent = 'History'/);
  assert.match(source, /ensureProfileUnlocked\(fresh, currentActive, \{ sensitiveAction: true \}\)/);
});

test('managed command-center spec pins parent workflow without making UI authority', () => {
  const doc = read(docPath);

  for (const area of [
    'Managed profile selection',
    'Rule editing',
    'Viewing spaces',
    'Time limits',
    'Sync status',
    'Action history',
    'Multi-profile apply'
  ]) {
    assert.match(doc, new RegExp(area));
  }

  for (const state of [
    'empty managed profile list',
    'locked parent/account session',
    'successful local save',
    'pending P2P/local-network delivery',
    'offline trusted device',
    'rejected or conflicted remote update',
    'failed provider/mailbox pull',
    'time limit exhausted',
    'no-policy/no-work state'
  ]) {
    assert.match(doc, new RegExp(state));
  }

  assert.match(doc, /UI choice is not authority; runtime route gate remains the enforcement layer/);
  assert.match(doc, /Runtime budget accounting remains background-owned/);
  assert.match(doc, /Reachability is never authorization/);
  assert.match(doc, /Each target needs its own target profile, trusted link, scope, revision, hash, and signature\/integrity proof/);
  assert.match(doc, /Mobile-first layout with a single-column protected-profile list/);
  assert.match(doc, /Touch targets .* at\s+least 44px high/);
  assert.match(doc, /Use segmented controls for Main\/Kids access/);
  assert.match(doc, /dense table only for action\s+history/);
  assert.match(doc, /Avoid nested cards and marketing-style hero sections/);
  assert.match(doc, /Do not add YouTube content-script observers, timers, DOM scans, or JSON work/);
  assert.match(doc, /Avoid showing raw JSON, plaintext sensitive rule values, PINs, private keys,\s+mailbox ciphertext, or YouTube DOM\/debug identifiers/);
});

test('managed parent status summary shows revisions without plaintext rule values', () => {
  const status = buildManagedProfileStatusText({
    managedPolicyState: {
      localManagedEdits: {
        main: {
          policyRevision: 3,
          updatedAt: Date.UTC(2026, 5, 4)
        },
        kids: {
          policyRevision: 1
        }
      },
      remoteManagedPolicies: {
        'link-parent-child-1': {
          keywords: {
            revision: 5,
            policyHash: 'hash-keywords-5',
            plaintextValue: 'spiders'
          },
          channels: {
            revision: 4,
            policyHash: 'hash-channels-4',
            channelName: 'UC-secret'
          },
          videos: {
            revision: 0,
            policyHash: 'hash-video-secret',
            videoId: 'video-secret'
          }
        },
        'empty-link': {
          keywords: {
            revision: 0,
            policyHash: ''
          }
        }
      }
    },
    managedActionHistory: [
      {
        schema: 'filtertube_managed_action_history',
        actionType: 'remote_policy.accept',
        result: 'accepted',
        scope: 'keywords',
        summary: {
          plaintextValue: 'spiders',
          label: 'Added keyword'
        }
      },
      {
        schema: 'filtertube_managed_action_history',
        actionType: 'remote_policy.reject',
        result: 'rejected',
        scope: 'keywords',
        reason: 'signature_invalid',
        summary: {
          ciphertext: 'unreadable-secret',
          label: 'Rejected keyword update'
        }
      }
    ]
  }, { revealDetails: true });

  assert.match(status, /^Managed status: /);
  assert.match(status, /Local edits: Main r3, .*, Kids r1/);
  assert.match(status, /Remote sync: 2 scopes across 1 link, latest r5/);
  assert.match(status, /History: 2 rows, 1 protected, latest rejected\/keywords/);
  assert.doesNotMatch(status, /spiders/);
  assert.doesNotMatch(status, /UC-secret/);
  assert.doesNotMatch(status, /video-secret/);
  assert.doesNotMatch(status, /ciphertext/);
  assert.doesNotMatch(status, /privateKey/i);
  assert.doesNotMatch(status, /pin/i);
});

test('managed parent status is suppressed for protected child views and empty state is explicit for parents', () => {
  assert.equal(buildManagedProfileStatusText({
    managedPolicyState: {
      localManagedEdits: {
        main: {
          policyRevision: 9
        }
      }
    },
    managedActionHistory: [
      {
        schema: 'filtertube_managed_action_history',
        result: 'accepted',
        scope: 'main'
      }
    ]
  }, { revealDetails: false }), '');

  assert.equal(
    buildManagedProfileStatusText({}, { revealDetails: true }),
    'Managed status: no parent-managed policy revisions yet.'
  );
});
