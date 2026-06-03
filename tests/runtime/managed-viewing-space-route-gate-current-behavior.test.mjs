import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANAGED_VIEWING_SPACE_ROUTE_GATE_CONTRACT_2026-06-03.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';
const p0DocPath = 'docs/audit/FILTERTUBE_P0_PROFILE_VIEWING_SPACE_CURRENT_BEHAVIOR_2026-05-19.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function runtimeSource() {
  return [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/bridge_settings.js',
    'js/content/dom_fallback.js',
    'js/io_manager.js',
    'js/state_manager.js',
    'js/tab-view.js'
  ].map(read).join('\n');
}

function viewingPolicy(overrides = {}) {
  return {
    schema: 'filtertube_managed_viewing_space_route_gate',
    version: 1,
    allowMainViewing: true,
    allowKidsViewing: true,
    profileId: 'child-profile-1',
    profileName: 'Child Profile',
    policySource: 'local_profile_settings',
    ...overrides
  };
}

function classifyViewingRoute(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return { surface: 'external', reason: 'missing_url' };
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (e) {
    return { surface: 'external', reason: 'invalid_url' };
  }
  const host = String(parsed.hostname || '').toLowerCase();
  if (host === 'youtubekids.com' || host.endsWith('.youtubekids.com')) {
    return { surface: 'kids', host };
  }
  if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
    return { surface: 'main', host };
  }
  return { surface: 'external', host };
}

function validateViewingPolicy(policy) {
  if (!policy || typeof policy !== 'object') return { ok: false, reason: 'missing_policy' };
  if (policy.schema !== 'filtertube_managed_viewing_space_route_gate') return { ok: false, reason: 'wrong_schema' };
  if (policy.version !== 1) return { ok: false, reason: 'wrong_version' };
  if (typeof policy.allowMainViewing !== 'boolean') return { ok: false, reason: 'missing_allowMainViewing' };
  if (typeof policy.allowKidsViewing !== 'boolean') return { ok: false, reason: 'missing_allowKidsViewing' };
  if (!policy.allowMainViewing && !policy.allowKidsViewing) return { ok: false, reason: 'no_viewing_spaces' };
  if (!policy.profileId) return { ok: false, reason: 'missing_profileId' };
  if (policy.policySource !== 'local_profile_settings' && policy.policySource !== 'managed_policy') {
    return { ok: false, reason: 'invalid_policySource' };
  }
  return { ok: true };
}

function routeGateDecision({ policy, url }) {
  const route = classifyViewingRoute(url);
  if (route.surface === 'external') {
    return { allowed: true, gated: false, surface: 'external', reason: 'external_route_no_work' };
  }
  if (!policy) {
    return { allowed: true, gated: false, surface: route.surface, reason: 'missing_policy_no_work' };
  }
  const validation = validateViewingPolicy(policy);
  if (!validation.ok && validation.reason === 'no_viewing_spaces') {
    return { allowed: false, gated: true, surface: route.surface, reason: 'no_viewing_spaces_parent_repair_required' };
  }
  if (!validation.ok) {
    return { allowed: true, gated: false, surface: route.surface, reason: 'invalid_policy_no_work' };
  }
  if (route.surface === 'main' && policy.allowMainViewing !== true) {
    return { allowed: false, gated: true, surface: 'main', reason: 'main_viewing_space_denied' };
  }
  if (route.surface === 'kids' && policy.allowKidsViewing !== true) {
    return { allowed: false, gated: true, surface: 'kids', reason: 'kids_viewing_space_denied' };
  }
  return { allowed: true, gated: true, surface: route.surface, reason: 'viewing_space_allowed' };
}

function routeRevalidationDecision({ profileChanged = false, policyChanged = false, spaNavigation = false, activeOwnedRoute = false }) {
  if (!activeOwnedRoute) return { revalidate: false, reason: 'external_route_no_work' };
  if (profileChanged || policyChanged || spaNavigation) {
    return { revalidate: true, reason: 'active_route_policy_revalidation_required' };
  }
  return { revalidate: false, reason: 'no_gate_revalidation_needed' };
}

test('managed viewing-space route-gate contract is runtime-backed and linked from plan inventory and P0 proof', () => {
  const doc = read(docPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);
  const p0Doc = read(p0DocPath);
  const source = runtimeSource();

  assert.match(doc, /Status\*\*: Runtime route gate implemented/);
  assert.match(doc, /Runtime behavior changed/);
  assert.match(doc, /Route Classification/);
  assert.match(doc, /Required Route Decisions/);
  assert.match(doc, /managed_viewing_main_only/);
  assert.match(doc, /managed_viewing_kids_only/);
  assert.match(doc, /managed_viewing_missing_policy_no_work/);
  assert.match(doc, /runtime managed viewing-space route gate: present/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));
  assert.match(p0Doc, /Background compile now exposes `managedViewingRouteGate`/);
  assert.match(p0Doc, /content bridge now blocks denied child Main\/Kids routes/);

  assert.match(source, /allowMainViewing/);
  assert.match(source, /allowKidsViewing/);
  assert.match(source, /filtertube_managed_viewing_space_route_gate/);
  assert.match(source, /activeProfileKind === 'child'/);
  assert.match(source, /managedViewingRouteGate/);
  assert.match(source, /applyManagedViewingRouteGate/);
  assert.match(source, /showManagedViewingBlockedOverlay/);
  assert.match(source, /__filtertubeManagedViewingRouteDenied/);
  assert.match(source, /yt-navigate-finish/);
});

test('managed viewing-space route classifier separates Main Kids external and unsupported hosts', () => {
  assert.deepEqual(classifyViewingRoute('https://www.youtube.com/watch?v=abc'), { surface: 'main', host: 'www.youtube.com' });
  assert.deepEqual(classifyViewingRoute('https://m.youtube.com/feed/channels'), { surface: 'main', host: 'm.youtube.com' });
  assert.deepEqual(classifyViewingRoute('https://music.youtube.com/watch?v=abc'), { surface: 'main', host: 'music.youtube.com' });
  assert.deepEqual(classifyViewingRoute('https://www.youtubekids.com/watch?v=abc'), { surface: 'kids', host: 'www.youtubekids.com' });
  assert.deepEqual(classifyViewingRoute('https://youtube-nocookie.com/embed/abc'), { surface: 'external', host: 'youtube-nocookie.com' });
  assert.deepEqual(classifyViewingRoute('https://example.com/watch?v=abc'), { surface: 'external', host: 'example.com' });
});

test('managed viewing-space route decisions cover both main-only kids-only and neither-invalid policies', () => {
  const mainUrl = 'https://www.youtube.com/watch?v=abc';
  const kidsUrl = 'https://www.youtubekids.com/watch?v=abc';

  assert.deepEqual(routeGateDecision({ policy: viewingPolicy(), url: mainUrl }), {
    allowed: true,
    gated: true,
    surface: 'main',
    reason: 'viewing_space_allowed'
  });
  assert.deepEqual(routeGateDecision({ policy: viewingPolicy(), url: kidsUrl }), {
    allowed: true,
    gated: true,
    surface: 'kids',
    reason: 'viewing_space_allowed'
  });

  assert.deepEqual(routeGateDecision({ policy: viewingPolicy({ allowKidsViewing: false }), url: mainUrl }), {
    allowed: true,
    gated: true,
    surface: 'main',
    reason: 'viewing_space_allowed'
  });
  assert.deepEqual(routeGateDecision({ policy: viewingPolicy({ allowKidsViewing: false }), url: kidsUrl }), {
    allowed: false,
    gated: true,
    surface: 'kids',
    reason: 'kids_viewing_space_denied'
  });

  assert.deepEqual(routeGateDecision({ policy: viewingPolicy({ allowMainViewing: false }), url: mainUrl }), {
    allowed: false,
    gated: true,
    surface: 'main',
    reason: 'main_viewing_space_denied'
  });
  assert.deepEqual(routeGateDecision({ policy: viewingPolicy({ allowMainViewing: false }), url: kidsUrl }), {
    allowed: true,
    gated: true,
    surface: 'kids',
    reason: 'viewing_space_allowed'
  });

  const neither = viewingPolicy({ allowMainViewing: false, allowKidsViewing: false });
  assert.deepEqual(validateViewingPolicy(neither), { ok: false, reason: 'no_viewing_spaces' });
  assert.deepEqual(routeGateDecision({ policy: neither, url: mainUrl }), {
    allowed: false,
    gated: true,
    surface: 'main',
    reason: 'no_viewing_spaces_parent_repair_required'
  });
  assert.deepEqual(routeGateDecision({ policy: neither, url: kidsUrl }), {
    allowed: false,
    gated: true,
    surface: 'kids',
    reason: 'no_viewing_spaces_parent_repair_required'
  });
});

test('managed viewing-space route gate preserves missing-policy and external-route no-work states', () => {
  assert.deepEqual(routeGateDecision({
    policy: null,
    url: 'https://www.youtube.com/watch?v=abc'
  }), { allowed: true, gated: false, surface: 'main', reason: 'missing_policy_no_work' });

  assert.deepEqual(routeGateDecision({
    policy: viewingPolicy({ allowMainViewing: false, allowKidsViewing: true }),
    url: 'https://example.com/watch?v=abc'
  }), { allowed: true, gated: false, surface: 'external', reason: 'external_route_no_work' });

  assert.deepEqual(routeGateDecision({
    policy: { allowMainViewing: 'no', allowKidsViewing: true },
    url: 'https://www.youtube.com/watch?v=abc'
  }), { allowed: true, gated: false, surface: 'main', reason: 'invalid_policy_no_work' });
});

test('managed viewing-space route-gate fixtures require SPA profile and policy revalidation on owned routes only', () => {
  assert.deepEqual(routeRevalidationDecision({
    profileChanged: true,
    activeOwnedRoute: true
  }), { revalidate: true, reason: 'active_route_policy_revalidation_required' });

  assert.deepEqual(routeRevalidationDecision({
    policyChanged: true,
    activeOwnedRoute: true
  }), { revalidate: true, reason: 'active_route_policy_revalidation_required' });

  assert.deepEqual(routeRevalidationDecision({
    spaNavigation: true,
    activeOwnedRoute: true
  }), { revalidate: true, reason: 'active_route_policy_revalidation_required' });

  assert.deepEqual(routeRevalidationDecision({
    profileChanged: true,
    activeOwnedRoute: false
  }), { revalidate: false, reason: 'external_route_no_work' });

  assert.deepEqual(routeRevalidationDecision({
    activeOwnedRoute: true
  }), { revalidate: false, reason: 'no_gate_revalidation_needed' });
});
