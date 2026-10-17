import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function actualFunction(name) {
  const match = new RegExp(`    (?:async )?function ${name}\\(`).exec(source);
  assert.ok(match, `actual ${name} exists`);
  const end = source.indexOf('\n    }', match.index);
  assert.ok(end > match.index);
  return source.slice(match.index, end + '\n    }'.length);
}

function profiles(activeProfileId = 'parent') {
  return { schemaVersion: 4, activeProfileId, profiles: {
    default: { type: 'account', name: 'Main account', security: {} },
    parent: { type: 'account', name: 'Parent', security: {} },
    other: { type: 'account', name: 'Other parent', security: {} },
    child: { type: 'child', name: 'Own child', parentProfileId: 'parent', security: {} },
    sibling: { type: 'child', name: 'Other child', parentProfileId: 'other', security: {} }
  } };
}

function fixture(options = {}) {
  const root = profiles(options.actor || 'parent');
  const calls = { loads: 0, previews: [], exports: [], downloads: [], reviews: [], prompts: [], unlocks: [], toasts: [], focuses: 0 };
  const profile = {
    value: options.profileId ?? 'child', options: [],
    replaceChildren() { this.options = []; this.value = ''; },
    appendChild(option) { this.options.push(option); if (this.options.length === 1) this.value = option.value; }
  };
  const surface = { value: options.surface || 'main' };
  const button = { disabled: false, focus() { calls.focuses++; } };
  const report = {
    profileId: 'child', profileName: 'Own child', surface: surface.value,
    canExport: true, counts: { title: 3, channelId: 2 }, unsupported: [], warnings: [],
    reviewToken: { exact: 'reviewed-profile-surface-rules' }, ...options.report
  };
  const payload = { filterData: { title: ['reviewed rule'], channelId: [] }, options: {} };
  const io = {
    async loadProfilesV4() { calls.loads++; await options.onLoad?.({ profile, surface, root }); return root; },
    async previewBlockTubeExport(args) {
      calls.previews.push(plain(args)); await options.onPreview?.({ profile, surface, root, args });
      if (options.previewError) throw new Error(options.previewError);
      return report;
    },
    async exportBlockTube(args) {
      calls.exports.push(args); await options.onExport?.({ profile, surface, root, args });
      if (options.exportError) throw new Error(options.exportError);
      return { payload };
    }
  };
  const box = {
    window: { FilterTubeIO: io }, document: { createElement: () => ({ value: '', textContent: '' }) },
    ftBlockTubeExportProfile: profile, ftBlockTubeExportSurface: surface, ftBlockTubeExportBtn: button,
    IS_FIREFOX_TAB_VIEW: options.firefox === true, sessionMasterPin: 'master-session-pin',
    getActiveProfileType: () => root.profiles[root.activeProfileId]?.type,
    tabViewUiText: (_key, fallback, values = {}) => fallback.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match),
    UIComponents: { showToast: (message, type) => calls.toasts.push({ message, type }) },
    async showChoiceModal(spec) {
      calls.reviews.push(spec); await options.onReview?.({ profile, surface, root });
      const chosen = Object.hasOwn(options, 'choice') ? options.choice : 'download';
      return spec.choices.some(item => item.value === chosen) ? chosen : null;
    },
    async showPromptModal(spec) { calls.prompts.push(spec); return options.pin ?? ' 2468 '; },
    async ensureAdminUnlocked(current, request) { calls.unlocks.push({ current, request }); return options.unlocked !== false; },
    async downloadJsonToDownloadsFolder(...args) {
      calls.downloads.push(args);
      if (options.downloadError) throw new Error(options.downloadError);
    }
  };
  vm.createContext(box);
  const helpers = ['safeObject', 'normalizeString', 'extractMasterPinVerifier', 'extractProfilePinVerifier',
    'getProfileName', 'getProfileType', 'isChildProfileAdminSurface', 'ensureNonChildAdminAction', 'blockTubeOmissionLabel'];
  const exportHelpers = [...source.matchAll(/    (?:async )?function (\w*BlockTubeExport\w*)\(/g)].map(match => match[1]);
  vm.runInContext([...new Set([...helpers, ...exportHelpers])].map(actualFunction).join('\n'), box);
  return { box, root, calls, report, payload, profile, surface, button };
}

function assertFinished(f) {
  assert.equal(f.button.disabled, false);
  assert.equal(f.calls.focuses, 1, 'the export button regains keyboard focus');
}

for (const surface of ['main', 'kids']) {
  test(`actual export captures the selected profile and ${surface} surface before waits and forwards the exact reviewed token`, async () => {
    const f = fixture({ surface, onLoad({ profile, surface: control }) { profile.value = 'other'; control.value = surface === 'main' ? 'kids' : 'main'; } });
    await f.box.runBlockTubeExport();
    assert.deepEqual(f.calls.previews, [{ profileId: 'child', surface, auth: null }]);
    assert.equal(f.calls.exports.length, 1);
    assert.equal(f.calls.exports[0].profileId, 'child');
    assert.equal(f.calls.exports[0].surface, surface);
    assert.equal(f.calls.exports[0].reviewToken, f.report.reviewToken);
    assert.equal(f.calls.exports[0].acceptUnsupported, false);
    assert.equal(f.calls.reviews[0].message, `Own child · ${surface === 'kids' ? 'YouTube Kids' : 'Main YouTube'}`);
    assert.ok(f.calls.reviews[0].details.some(item => /3/.test(item)));
    assert.ok(f.calls.reviews[0].details.some(item => /2/.test(item)));
    assert.equal(f.calls.downloads.length, 1);
    assert.equal(f.calls.downloads[0][1], `filtertube_for_blocktube_${surface}.json`);
    assert.equal(f.calls.downloads[0][2], f.payload);
    assert.equal(f.calls.toasts.at(-1).type, 'success');
    assertFinished(f);
  });
}

test('review cancellation downloads and exports nothing, and restores focus', async () => {
  const f = fixture({ choice: null });
  await f.box.runBlockTubeExport();
  assert.equal(f.calls.reviews.length, 1);
  assert.equal(f.calls.exports.length, 0);
  assert.equal(f.calls.downloads.length, 0);
  assertFinished(f);
});

test('an incompatible preview offers no download action and cannot produce a file', async () => {
  const f = fixture({ report: { canExport: false, warnings: ['Allow-only rules cannot be represented safely.'] } });
  await f.box.runBlockTubeExport();
  assert.equal(f.calls.reviews[0].choices.length, 0);
  assert.ok(f.calls.reviews[0].details.some(item => /Allow-only/.test(item)));
  assert.equal(f.calls.exports.length, 0);
  assert.equal(f.calls.downloads.length, 0);
  assertFinished(f);
});

test('unsupported rules are grouped in review and require the explicit omissions choice', async () => {
  const unsupported = [
    { field: 'keywords', reason: 'date_constraint_not_supported' }, { field: 'keywords', reason: 'date_constraint_not_supported' },
    { field: 'channels', reason: 'allow_rules_not_supported' }
  ];
  const f = fixture({ report: { unsupported } });
  await f.box.runBlockTubeExport();
  assert.equal(f.calls.reviews[0].details.length, 3, 'one count summary plus two grouped omission reasons');
  assert.ok(f.calls.reviews[0].details.some(item => /particular dates.*\(2\)/.test(item)));
  assert.equal(f.calls.reviews[0].details.some(item => /date_constraint_not_supported|allow_rules_not_supported/.test(item)), false);
  assert.match(f.calls.reviews[0].choices[0].label, /leave listed items out/i);
  assert.equal(f.calls.exports[0].acceptUnsupported, true);
  assert.equal(f.calls.exports[0].reviewToken, f.report.reviewToken);
  assert.equal(f.calls.downloads.length, 1);
  assertFinished(f);
});

for (const [option, message] of [['previewError', 'Preview unavailable'], ['exportError', 'Rules changed; review again']]) {
  test(`${option} fails without downloading and returns focus with the error`, async () => {
    const f = fixture({ [option]: message });
    await f.box.runBlockTubeExport();
    assert.equal(f.calls.downloads.length, 0);
    assert.deepEqual(f.calls.toasts.at(-1), { message, type: 'error' });
    assert.equal(f.calls.reviews.length, option === 'previewError' ? 0 : 1);
    assertFinished(f);
  });
}

test('download failure reports an error rather than a saved-file toast', async () => {
  const f = fixture({ downloadError: 'Download rejected' });
  await f.box.runBlockTubeExport();
  assert.deepEqual(f.calls.toasts, [{ message: 'Download rejected', type: 'error' }]);
  assertFinished(f);
});

test('adult profile PIN is requested and forwarded without a child PIN fallback', async () => {
  const f = fixture();
  f.root.profiles.parent.security.profilePinVerifier = { hash: 'adult-verifier' };
  f.root.profiles.child.security.profilePinVerifier = { hash: 'child-verifier' };
  await f.box.runBlockTubeExport();
  assert.equal(f.calls.prompts.length, 1);
  assert.equal(f.calls.unlocks.length, 0);
  assert.deepEqual(f.calls.previews[0].auth, { localProfilePin: '2468' });
  assert.deepEqual(plain(f.calls.exports[0].auth), { localProfilePin: '2468' });
  assertFinished(f);
});

test('a PIN-free parent does not request the selected child switching PIN', async () => {
  const f = fixture();
  f.root.profiles.child.security.profilePinVerifier = { hash: 'child-switching-verifier' };
  await f.box.runBlockTubeExport();
  assert.equal(f.calls.prompts.length, 0);
  assert.equal(f.calls.unlocks.length, 0);
  assert.equal(f.calls.previews[0].auth, null);
  assert.equal(f.calls.exports[0].auth, null);
  assertFinished(f);
});

test('master PIN uses the sensitive account unlock and its session PIN for preview and export', async () => {
  const f = fixture({ actor: 'default' });
  f.root.profiles.default.security.masterPinVerifier = { hash: 'master-verifier' };
  await f.box.runBlockTubeExport();
  assert.equal(f.calls.prompts.length, 0);
  assert.equal(f.calls.unlocks.length, 1);
  assert.equal(f.calls.unlocks[0].current, f.root);
  assert.deepEqual(plain(f.calls.unlocks[0].request), { sensitiveAction: true });
  assert.deepEqual(f.calls.previews[0].auth, { localMasterPin: 'master-session-pin' });
  assert.deepEqual(plain(f.calls.exports[0].auth), { localMasterPin: 'master-session-pin' });
  assertFinished(f);
});

for (const master of [false, true]) {
  test(`cancelled ${master ? 'master unlock' : 'adult PIN'} never previews or downloads`, async () => {
    const f = fixture({ actor: master ? 'default' : 'parent', pin: ' ', unlocked: false });
    if (master) f.root.profiles.default.security.masterPinVerifier = {};
    else f.root.profiles.parent.security.profilePinVerifier = {};
    await f.box.runBlockTubeExport();
    assert.equal(f.calls.previews.length, 0);
    assert.equal(f.calls.exports.length, 0);
    assert.equal(f.calls.downloads.length, 0);
    assertFinished(f);
  });
}

test('a child cannot start export and an empty selection never falls back to a child or account', async () => {
  const child = fixture({ actor: 'child' });
  await child.box.runBlockTubeExport();
  assert.equal(child.calls.loads, 0);
  assert.equal(child.calls.previews.length, 0);
  assert.equal(child.calls.downloads.length, 0);
  assert.equal(child.calls.toasts[0].type, 'error');
  const empty = fixture({ profileId: '' });
  await empty.box.runBlockTubeExport();
  assert.equal(empty.calls.loads, 0);
  assert.equal(empty.calls.downloads.length, 0);
});

test('refresh lists only the parent and their own children, preserving an eligible selection', async () => {
  const f = fixture();
  await f.box.refreshBlockTubeExportProfiles();
  assert.deepEqual(f.profile.options.map(option => option.value), ['parent', 'child']);
  assert.equal(f.profile.value, 'child');
  f.profile.value = 'sibling';
  await f.box.refreshBlockTubeExportProfiles();
  assert.equal(f.profile.value, 'parent');
  assert.deepEqual(f.profile.options.map(option => option.textContent), ['Parent', 'Own child']);
});

test('refresh lets the master choose every profile and clears stale options on a child account', async () => {
  const f = fixture({ actor: 'default' });
  await f.box.refreshBlockTubeExportProfiles();
  assert.deepEqual(f.profile.options.map(option => option.value), ['default', 'parent', 'other', 'child', 'sibling']);
  f.root.activeProfileId = 'child';
  await f.box.refreshBlockTubeExportProfiles();
  assert.equal(f.profile.options.length, 0);
  assert.equal(f.profile.value, '');
});
