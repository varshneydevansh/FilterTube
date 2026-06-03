import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('managed parent authority inventory is audit-only and names required current authority areas', () => {
  const doc = read(docPath);

  assert.match(doc, /Status\*\*: Audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /Lane proof\*\*: `test:settings`/);
  assert.match(doc, /`test:release`/);
  assert.match(doc, /Local parent-managed child editing/);
  assert.match(doc, /PIN\/session authority/);
  assert.match(doc, /Nanah managed link policy/);
  assert.match(doc, /Main\/Kids viewing-space settings/);
  assert.match(doc, /Time-limit policy/);
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

test('Nanah scoped apply currently has target-profile writes but no durable managed policy revision contract', () => {
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

  const runtime = [adapter, tabView, read('js/io_manager.js'), read('js/background.js')].join('\n');
  assert.doesNotMatch(runtime, /filtertube_managed_policy/);
  assert.doesNotMatch(runtime, /managedPolicyRevisionStore/);

  assert.match(doc, /no managed policy revision store/i);
  assert.match(doc, /There is no stale\/replay rejection/);
  assert.match(doc, /There is no signed managed policy envelope/);
});

test('viewing-space and time-limit enforcement are explicitly not implemented yet', () => {
  const doc = read(docPath);
  const tabView = read('js/tab-view.js');
  const runtime = [
    read('js/background.js'),
    read('js/content_bridge.js'),
    read('js/settings_shared.js'),
    read('js/state_manager.js')
  ].join('\n');

  assert.match(tabView, /allowMainViewing/);
  assert.match(tabView, /allowKidsViewing/);
  assert.match(doc, /Extension-side YouTube runtime does not yet route-gate Main\/Kids access/);
  assert.match(doc, /No extension runtime time-limit schema, UI, budget counter, overlay, or\s+route gate exists/);
  assert.doesNotMatch(runtime, /timeLimits/);
});
