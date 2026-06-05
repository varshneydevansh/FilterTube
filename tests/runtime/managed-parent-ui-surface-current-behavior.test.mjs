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

function getProfileType(profilesV4, profileId) {
  if (profileId === 'default') return 'account';
  const profile = safeObject(profilesV4?.profiles?.[profileId]);
  const rawType = normalizeString(profile.type).toLowerCase();
  if (rawType === 'account' || rawType === 'child') return rawType;
  return normalizeString(profile.parentProfileId) ? 'child' : 'account';
}

function getParentAccountId(profilesV4, profileId) {
  const profile = safeObject(profilesV4?.profiles?.[profileId]);
  return getProfileType(profilesV4, profileId) === 'child'
    ? normalizeString(profile.parentProfileId) || 'default'
    : profileId;
}

function getAccountIds(profilesV4) {
  return Object.keys(safeObject(profilesV4?.profiles))
    .filter(profileId => getProfileType(profilesV4, profileId) === 'account')
    .sort();
}

function getChildrenForAccount(profilesV4, accountId) {
  return Object.keys(safeObject(profilesV4?.profiles))
    .filter(profileId => getProfileType(profilesV4, profileId) === 'child' && getParentAccountId(profilesV4, profileId) === accountId)
    .sort();
}

function getProfileName(profilesV4, profileId) {
  return normalizeString(profilesV4?.profiles?.[profileId]?.name) || (profileId === 'default' ? 'Default' : 'Profile');
}

function isProfileLocked(profilesV4, profileId) {
  const security = safeObject(profilesV4?.profiles?.[profileId]?.security);
  return !!(security.profilePinVerifier || security.pinVerifier || (profileId === 'default' && (security.masterPinVerifier || security.masterPin)));
}

function canActiveProfileManageProfile(profilesV4, targetProfileId) {
  const targetId = normalizeString(targetProfileId);
  const currentActive = normalizeString(profilesV4?.activeProfileId) || 'default';
  if (!targetId || getProfileType(profilesV4, currentActive) === 'child') return false;
  return currentActive === 'default' || currentActive === targetId || getParentAccountId(profilesV4, targetId) === currentActive;
}

function viewingAccessLabel(profile) {
  const settings = safeObject(profile?.settings);
  const main = settings.allowMainViewing !== false;
  const kids = settings.allowKidsViewing !== false;
  if (main && kids) return 'Main + Kids';
  if (main) return 'Main only';
  if (kids) return 'Kids only';
  return 'No viewing spaces';
}

function managedTimeLimitLabel(profile) {
  const policy = safeObject(safeObject(profile?.settings).timeLimitPolicy);
  if (policy.schema !== 'filtertube_managed_time_limit' || policy.enabled !== true) return 'No limit';
  const seconds = normalizeNonNegativeInteger(policy.dailyBudgetSeconds);
  if (!seconds) return '0m/day';
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours && remainingMinutes ? `${hours}h ${remainingMinutes}m/day` : (hours ? `${hours}h/day` : `${minutes}m/day`);
}

function buildManagedCommandCenterSummary(profilesV4, { revealDetails = false } = {}) {
  if (!revealDetails) {
    return {
      rows: [],
      profileCount: 0,
      limitedCount: 0,
      remoteScopeCount: 0,
      historyRowCount: 0,
      protectedRowCount: 0
    };
  }
  const profiles = safeObject(profilesV4?.profiles);
  const rows = [];
  getAccountIds(profilesV4).forEach((accountId) => {
    getChildrenForAccount(profilesV4, accountId).forEach((profileId) => {
      if (!canActiveProfileManageProfile(profilesV4, profileId)) return;
      const profile = safeObject(profiles[profileId]);
      const summary = summarizeManagedPolicyStateForProfile(profile);
      const timeLimit = managedTimeLimitLabel(profile);
      rows.push({
        profileId,
        profileName: getProfileName(profilesV4, profileId),
        parentName: getProfileName(profilesV4, accountId),
        locked: isProfileLocked(profilesV4, profileId),
        viewingAccess: viewingAccessLabel(profile),
        timeLimit,
        timeLimited: timeLimit !== 'No limit',
        syncLabel: summary.remoteScopeCount ? `Remote r${summary.latestRemoteRevision}` : (summary.localLabels.length ? 'Local managed' : 'No policy yet'),
        remoteScopeCount: summary.remoteScopeCount,
        historyRowCount: summary.historyRowCount,
        protectedRowCount: summary.protectedRowCount,
        latestActionLabel: summary.latestResult && summary.latestScope ? `${summary.latestResult}/${summary.latestScope}` : 'none'
      });
    });
  });
  return rows.reduce((acc, row) => ({
    ...acc,
    profileCount: acc.profileCount + 1,
    limitedCount: acc.limitedCount + (row.timeLimited ? 1 : 0),
    remoteScopeCount: acc.remoteScopeCount + row.remoteScopeCount,
    historyRowCount: acc.historyRowCount + row.historyRowCount,
    protectedRowCount: acc.protectedRowCount + row.protectedRowCount
  }), {
    rows,
    profileCount: 0,
    limitedCount: 0,
    remoteScopeCount: 0,
    historyRowCount: 0,
    protectedRowCount: 0
  });
}

test('managed parent UI surface docs and runtime binding are linked', () => {
  const doc = read(docPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);
  const source = read('js/tab-view.js');
  const helperSource = read('js/managed_parent_command_center.js');
  const tabViewHtml = read('html/tab-view.html');

  assert.match(doc, /Status\*\*: Spec, dashboard child-row status, and a read-only parent command\s+center overview are present/);
  assert.match(doc, /bulk\/multi-profile command-center writes are not implemented yet/);
  assert.match(doc, /Parent-Facing States/);
  assert.match(doc, /UI Boundaries/);
  assert.match(doc, /Current Runtime Binding/);
  assert.match(doc, /Command-Center Slice/);
  assert.match(doc, /runtime managed parent child-row status helper: present/);
  assert.match(doc, /runtime child\/protected detailed status suppression: present/);
  assert.match(doc, /runtime status plaintext rule value exposure: absent/);
  assert.match(doc, /runtime read-only managed command-center overview: present/);
  assert.match(doc, /runtime managed command-center write\/bulk apply controls: absent/);
  assert.match(doc, /runtime YouTube hot-path work from command-center UI: absent/);
  assert.match(plan, new RegExp(docPath));
  assert.match(plan, /read-only\s+command-center overview for protected profiles/);
  assert.match(inventory, new RegExp(docPath));
  assert.match(inventory, /read-only\s+managed status line on that child row plus a read-only command\s+center overview/);
  assert.match(inventory, /display evidence\s+only/);

  assert.match(source, /function buildManagedProfileStatusText\(profile, \{ revealDetails = false \} = \{\}\)/);
  assert.match(source, /function summarizeManagedPolicyStateForProfile\(profile\)/);
  assert.match(helperSource, /function buildManagedCommandCenterSummary\(profilesV4, \{ revealDetails = false, helpers = \{\} \} = \{\}\)/);
  assert.match(helperSource, /function renderManagedCommandCenter\(profilesV4, \{ revealDetails = false, helpers = \{\} \} = \{\}\)/);
  assert.match(helperSource, /panel\.setAttribute\('aria-label', 'Managed parent command center'\)/);
  assert.match(helperSource, /Read-only overview of protected profiles, policy sync, time limits, and action history/);
  assert.match(helperSource, /global\.FilterTubeManagedParentCommandCenter = \{/);
  assert.match(tabViewHtml, /managed_parent_command_center\.js[\s\S]*tab-view\.js/);
  assert.match(source, /const managedStatusText = type === 'child'/);
  assert.match(source, /revealDetails: canManageTarget && !childAdminRestricted/);
  assert.match(source, /FilterTubeManagedParentCommandCenter\?\.render\?\.\(profilesV4/);
  assert.match(source, /helpers:\s*\{\s*safeObject, getAccountIds,/);
  assert.match(source, /ft-managed-profile-status/);
  assert.match(source, /historyBtn\.textContent = 'History'/);
  assert.match(source, /ensureProfileUnlocked\(fresh, currentActive, \{ sensitiveAction: true \}\)/);
});

test('managed command-center spec pins parent workflow without making UI authority', () => {
  const doc = read(docPath);
  const css = read('css/tab-view.css');

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
  assert.match(doc, /Future bulk writes require each target to have its own target profile, trusted link, scope, revision, hash, and signature\/integrity proof/);
  assert.match(doc, /Mobile-first layout with a single-column protected-profile list/);
  assert.match(doc, /Touch targets .* at\s+least 44px high/);
  assert.match(doc, /Use segmented controls for Main\/Kids access/);
  assert.match(doc, /dense table only for action\s+history/);
  assert.match(doc, /Avoid nested cards and marketing-style hero sections/);
  assert.match(doc, /Do not add YouTube content-script observers, timers, DOM scans, or JSON work/);
  assert.match(doc, /Avoid showing raw JSON, plaintext sensitive rule values, PINs, private keys,\s+mailbox ciphertext, or YouTube DOM\/debug identifiers/);

  assert.match(css, /\.ft-managed-command-center\s*\{/);
  assert.match(css, /\.ft-managed-command-center__row\s*\{/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /@media \(max-width: 768px\)/);
  assert.match(css, /\.ft-managed-command-center__heading,\s*\.ft-managed-command-center__row\s*\{\s*grid-template-columns: 1fr;/s);
});

test('managed command-center overview aggregates parent-visible profiles without plaintext rule leaks', () => {
  const fixture = {
    activeProfileId: 'parentA',
    profiles: {
      default: { id: 'default', type: 'account', name: 'Default' },
      parentA: { id: 'parentA', type: 'account', name: 'Parent A' },
      parentB: { id: 'parentB', type: 'account', name: 'Parent B' },
      childA: {
        id: 'childA',
        type: 'child',
        name: 'Child A',
        parentProfileId: 'parentA',
        security: { profilePinVerifier: { salt: 'salt' } },
        settings: {
          allowMainViewing: true,
          allowKidsViewing: false,
          timeLimitPolicy: {
            schema: 'filtertube_managed_time_limit',
            version: 1,
            enabled: true,
            dailyBudgetSeconds: 7200
          }
        },
        managedPolicyState: {
          localManagedEdits: {
            main: { policyRevision: 2, updatedAt: Date.UTC(2026, 5, 4), plaintextValue: 'spiders' }
          },
          remoteManagedPolicies: {
            'link-parent-child-1': {
              keywords: { revision: 4, policyHash: 'hash-keyword', plaintextValue: 'spiders' },
              channels: { revision: 3, policyHash: 'hash-channel', channelName: 'UC-secret' }
            }
          }
        },
        managedActionHistory: [
          {
            schema: 'filtertube_managed_action_history',
            result: 'accepted',
            actionType: 'remote_policy.accept',
            scope: 'keywords',
            summary: { plaintextValue: 'spiders', label: 'Added keyword' }
          },
          {
            schema: 'filtertube_managed_action_history',
            result: 'rejected',
            actionType: 'remote_policy.reject',
            scope: 'channels',
            reason: 'signature_invalid',
            summary: { ciphertext: 'mailbox-secret', label: 'Rejected channel' }
          }
        ]
      },
      childB: {
        id: 'childB',
        type: 'child',
        name: 'Child B',
        parentProfileId: 'parentB',
        settings: {
          allowMainViewing: true,
          allowKidsViewing: true
        },
        managedPolicyState: {
          localManagedEdits: {
            main: { policyRevision: 9 }
          }
        }
      }
    }
  };

  const summary = buildManagedCommandCenterSummary(fixture, { revealDetails: true });
  assert.equal(summary.profileCount, 1);
  assert.equal(summary.limitedCount, 1);
  assert.equal(summary.remoteScopeCount, 2);
  assert.equal(summary.historyRowCount, 2);
  assert.equal(summary.protectedRowCount, 1);
  assert.deepEqual(summary.rows.map(row => row.profileName), ['Child A']);
  assert.equal(summary.rows[0].parentName, 'Parent A');
  assert.equal(summary.rows[0].locked, true);
  assert.equal(summary.rows[0].viewingAccess, 'Main only');
  assert.equal(summary.rows[0].timeLimit, '2h/day');
  assert.equal(summary.rows[0].syncLabel, 'Remote r4');
  assert.equal(summary.rows[0].latestActionLabel, 'rejected/channels');

  const serialized = JSON.stringify(summary);
  assert.doesNotMatch(serialized, /spiders/);
  assert.doesNotMatch(serialized, /UC-secret/);
  assert.doesNotMatch(serialized, /mailbox-secret/);
  assert.doesNotMatch(serialized, /privateKey/i);
  assert.doesNotMatch(serialized, /pin/i);

  const childView = buildManagedCommandCenterSummary({ ...fixture, activeProfileId: 'childA' }, { revealDetails: true });
  assert.equal(childView.profileCount, 0);
  assert.deepEqual(childView.rows, []);

  const hidden = buildManagedCommandCenterSummary(fixture, { revealDetails: false });
  assert.equal(hidden.profileCount, 0);
  assert.deepEqual(hidden.rows, []);
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
