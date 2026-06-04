import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('managed parent authority inventory tracks implemented route gate and pending authority areas', () => {
  const doc = read(docPath);

  assert.match(doc, /Status\*\*: Runtime route-gate, local managed-save revision\/history, protected\s+history access, time-limit enforcement, and receive-side managed-policy\s+validation\/history proofs updated/);
  assert.match(doc, /Runtime behavior\s+changed/);
  assert.match(doc, /Lane proof\*\*: `test:settings`/);
  assert.match(doc, /`test:release`/);
  assert.match(doc, /Local parent-managed child editing/);
  assert.match(doc, /PIN\/session authority/);
  assert.match(doc, /Nanah managed link policy/);
  assert.match(doc, /Main\/Kids viewing-space settings/);
  assert.match(doc, /Time-limit policy/);
  assert.match(doc, /FILTERTUBE_MANAGED_VIEWING_SPACE_ROUTE_GATE_CONTRACT_2026-06-03\.md/);
});

test('local parent child edit authority remains source-backed by active-profile and child gates', () => {
  const doc = read(docPath);
  const tabView = read('js/tab-view.js');

  assert.match(tabView, /function canActiveProfileManageProfile\(profilesV4, targetProfileId\)/);
  assert.match(tabView, /getProfileType\(profilesV4, currentActive\) === 'child'\) return false/);
  assert.match(tabView, /getParentAccountId\(profilesV4, targetId\) === currentActive/);
  assert.match(tabView, /async function saveManagedChildSurface\(surface, mutator\)/);
  assert.match(tabView, /if \(!canActiveProfileManageProfile\(fresh, profileId\)\)/);
  assert.match(tabView, /async function startManagedChildEdit\(profileId, surface\)/);
  assert.match(tabView, /getProfileType\(fresh, targetId\) !== 'child'/);
  assert.match(tabView, /const ok = await ensureProfileUnlocked\(fresh, currentActive\)/);

  assert.match(doc, /canActiveProfileManageProfile/);
  assert.match(doc, /saveManagedChildSurface/);
  assert.match(doc, /Child PIN unlock does not make the child an admin/);
});

test('session PIN authority remains trusted-ui gated and memory scoped', () => {
  const doc = read(docPath);
  const background = read('js/background.js');

  assert.match(background, /const sessionPinCache = new Map\(\)/);
  assert.match(background, /async function verifyAndCacheSessionPin\(profileId, pin\)/);
  assert.match(background, /FilterTube_SessionPinAuth/);
  assert.match(background, /if \(!isTrustedUiSender\(sender\)\)/);
  assert.match(background, /sessionPinCache\.set\(profileId, pin\)/);

  assert.match(doc, /sessionPinCache/);
  assert.match(doc, /trusted UI sender/i);
  assert.match(doc, /Current PIN authority is local and session-scoped/);
});

test('Nanah scoped apply has target-profile writes plus receive-side managed envelope validation history support', () => {
  const doc = read(docPath);
  const adapter = read('js/nanah_sync_adapter.js');
  const tabView = read('js/tab-view.js');

  assert.match(adapter, /async function buildScopedPortablePayload\(io, scope\)/);
  assert.match(adapter, /async function applyScopedPortablePayload\(io, portable, \{ strategy = 'merge', targetProfileId = null \} = \{\}\)/);
  assert.match(adapter, /const resolvedTargetProfileId = normalizeString\(targetProfileId\) \|\| activeId/);
  assert.match(adapter, /async function applyIncomingEnvelope\(envelope, \{ strategy = 'merge', auth = null, scope = null, targetProfileId = null \} = \{\}\)/);
  assert.match(tabView, /function normalizeNanahTrustedLink\(entry\)/);
  assert.match(tabView, /lockedChildMode/);
  assert.match(tabView, /targetProfileBehavior/);
  assert.match(tabView, /function resolveNanahLocalTargetProfile\(trustedLink, profilesV4 = profilesV4Cache\)/);
  assert.match(tabView, /trusted\.localRole !== 'replica' \|\| trusted\.remoteRole !== 'source'/);
  assert.match(tabView, /function resolveTrustedNanahManagedApply\(details, trustedLink\)/);
  assert.match(adapter, /function validateManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(tabView, /function handleNanahIncomingManagedPolicyEnvelope\(envelope\)/);
  assert.match(tabView, /function buildManagedNanahPolicyValidationContext\(envelope, profilesV4 = profilesV4Cache\)/);
  assert.match(tabView, /function recordManagedNanahPolicyValidationHistory\(envelope, decision, context = \{\}\)/);
  assert.match(tabView, /function getNanahManagedPolicyScopeList\(value\)/);
  assert.match(adapter, /Managed policy envelopes require validated managed apply flow/);

  const runtime = [adapter, tabView, read('js/io_manager.js'), read('js/background.js')].join('\n');
  assert.match(runtime, /filtertube_managed_policy/);
  assert.doesNotMatch(runtime, /managedPolicyRevisionStore/);

  assert.match(doc, /receive path now provides managed-policy envelope parsing/i);
  assert.match(doc, /no persisted accepted-revision writer/i);
  assert.match(doc, /There is still no persisted stale\/replay authority state/);
  assert.match(doc, /There is no cryptographic signature verification yet/);
});

test('viewing-space route gate and first time-limit runtime enforcement are runtime-backed', () => {
  const doc = read(docPath);
  const tabView = read('js/tab-view.js');
  const runtime = [
    read('js/background.js'),
    read('js/content/bridge_settings.js'),
    read('js/content_bridge.js'),
    read('js/settings_shared.js'),
    read('js/state_manager.js')
  ].join('\n');

  assert.match(tabView, /allowMainViewing/);
  assert.match(tabView, /allowKidsViewing/);
  assert.match(doc, /now pins Main\/Kids route-gate decisions and no-work states/);
  assert.match(doc, /Extension-side YouTube runtime now route-gates child Main\/Kids access/);
  assert.match(doc, /Runtime route-gate implementation, denied-route overlay, and open-tab SPA\s+revalidation are now present/);
  assert.match(doc, /Accounts & Sync can now set, change, and disable a profile-owned\s+`settings.timeLimitPolicy`/);
  assert.match(doc, /Extension runtime now compiles a valid active child profile\s+`settings.timeLimitPolicy` into `managedTimeLimitPolicy`/);
  assert.match(doc, /Background runtime stores whole-profile daily usage in `ftManagedTimeUsageV1`/);
  assert.match(doc, /FILTERTUBE_MANAGED_CHILD_TIME_LIMIT_SCHEMA_CONTRACT_2026-06-03\.md/);
  assert.match(runtime, /managedTimeLimitPolicy/);
  assert.match(runtime, /FilterTube_ManagedTimeLimitHeartbeat/);
  assert.match(runtime, /showManagedTimeoutOverlay/);
  assert.match(runtime, /managedViewingRouteGate/);
  assert.match(runtime, /showManagedViewingBlockedOverlay/);
  assert.match(runtime, /__filtertubeManagedViewingRouteDenied/);
});
