import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto, createHash } from 'node:crypto';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const fixturePath = './fixtures/blocktube-0.4.8/';
const upstreamOptions = read(`${fixturePath}options.js`);
const upstreamBackground = read(`${fixturePath}background.js`);
const channelId = 'UCabcdefghijklmnopqrstuv';
const videoId = 'abcdefghijk';
const profile = (name, extra = {}) => ({ type: 'account', name, parentProfileId: null, security: {}, settings: {},
  main: { mode: 'blocklist', channels: [], keywords: [{ word: `${name} marker` }], videoIds: [] },
  kids: { mode: 'blocklist', blockedChannels: [], blockedKeywords: [{ word: `${name} Kids marker` }], videoIds: [] }, ...extra });

function fixture() {
  const storage = { ftProfilesV4: { schemaVersion: 4, activeProfileId: 'parent', profiles: {
    default: profile('Master'), parent: profile('Parent'), other: profile('Other'),
    child: profile('Child', { type: 'child', parentProfileId: 'parent' }),
    sibling: profile('Sibling', { type: 'child', parentProfileId: 'other' })
  } }, ftNanahTrustedLinks: [{ syntheticSecret: 'trust-not-exported' }], ftNanahManagedSigningKeyPair: { privateKey: 'private-not-exported' } };
  const calls = { writes: 0, reads: 0 };
  const box = { console, crypto: webcrypto, TextEncoder, TextDecoder, btoa, atob, setTimeout, clearTimeout,
    chrome: { runtime: { lastError: null }, storage: { local: {
      get(keys, callback) { calls.reads++; calls.onRead?.(calls.reads); callback(Object.fromEntries(keys.map(key => [key, clone(storage[key] ?? null)]))); },
      set(_, callback) { calls.writes++; callback?.(); }
    } } } };
  box.window = box; vm.createContext(box);
  vm.runInContext(read('../../js/security_manager.js'), box);
  vm.runInContext(read('../../js/io_manager.js'), box);
  return { storage, calls, box, io: box.FilterTubeIO, selected: storage.ftProfilesV4.profiles.child };
}

async function exportReviewed(f, options = {}) {
  const args = { profileId: 'child', surface: 'main', ...options };
  const report = await f.io.previewBlockTubeExport(args);
  return f.io.exportBlockTube({ ...args, reviewToken: report.reviewToken, acceptUnsupported: true });
}

// These source slices are executed unmodified, including the upstream editor
// join/split and import -> populate -> save path, rather than a schema mock.
function upstreamImport(payload) {
  const editor = () => ({ value: '', setValue(value) { this.value = value; }, getValue() { return this.value; }, refresh() {} });
  const nodes = new Map();
  const box = { console, input: JSON.stringify(payload), saved: null, alerts: [], setTimeout: () => {},
    textAreas: ['title', 'channelName', 'channelId', 'videoId', 'comment'], jsEditors: Object.fromEntries(['title', 'channelName', 'channelId', 'videoId', 'comment', 'javascript'].map(key => [key, editor()])),
    storageData: { filterData: {}, options: {}, uiPass: 'existing-BlockTube-password' }, defaultJSFunction: '(video, objectType) => false',
    document: { getElementById(id) { if (!nodes.has(id)) nodes.set(id, { value: '', checked: false, style: { removeProperty() {} }, classList: { add() {} } }); return nodes.get(id); } },
    saveData() { this.saved = clone(this.storageData); }, detectColorScheme() {}, alert(message) { this.alerts.push(message); },
    FileReader: class { readAsText() { this.onload({ target: { result: box.input } }); } }
  };
  box.saveData = () => { box.saved = clone(box.storageData); };
  vm.createContext(box);
  const populateAndHelpers = upstreamOptions.slice(upstreamOptions.indexOf('  function populateForms('), upstreamOptions.indexOf('\n  function cmResizer('));
  const saveForm = upstreamOptions.slice(upstreamOptions.indexOf('  function saveForm()'), upstreamOptions.indexOf('\n  function loginForm()'));
  vm.runInContext(`const has = Object.prototype.hasOwnProperty;\n${populateAndHelpers}\n${saveForm}\nimportOptions({target:{files:[{}]}});`, box);
  return box;
}

function upstreamCompile(payload) {
  const box = { console, json: JSON.stringify(payload), compiled: null }; vm.createContext(box);
  vm.runInContext(`${upstreamBackground.slice(0, upstreamBackground.indexOf("chrome.storage.local.get("))}\ncompiled = utils.compileAll(JSON.parse(json));`, box);
  return clone(box.compiled);
}

function matches(compiled, field, value) {
  return compiled.filterData[field].some(([pattern, flags]) => new RegExp(pattern, flags).test(value));
}

test('upstream fixtures are byte-pinned, attributed and unmodified', () => {
  const provenance = JSON.parse(read(`${fixturePath}provenance.json`));
  assert.equal(provenance.commit, 'd8a1bdba062ab603726b0ac3ea06c229d61fd710');
  for (const [file, entry] of Object.entries(provenance.files)) {
    assert.equal(createHash('sha256').update(read(`${fixturePath}${file}`)).digest('hex'), entry.sha256);
  }
});

test('actual BlockTube importer silently ignores old FilterTube shape but imports the explicit export', async () => {
  assert.equal(upstreamImport({ meta: { application: 'FilterTube', version: 3 }, profiles: {}, settings: {} }).saved, null);
  const f = fixture(), { payload, report } = await exportReviewed(f);
  const actual = upstreamImport(payload);
  assert.deepEqual(actual.alerts, []);
  assert.deepEqual(actual.saved.filterData.title, clone(payload.filterData.title));
  assert.equal(actual.saved.options.enable_javascript, false);
  assert.equal(actual.saved.uiPass, '', 'the actual upstream importer resets the receiving options-page password');
  assert.match(report.warnings.join('\n'), /configure its password again/);
  assert.equal(matches(upstreamCompile(actual.saved), 'title', 'a Child marker b'), true);
  assert.equal(f.calls.writes, 0);
});

test('multilingual rules survive actual editor import and compile into their matching fields', async () => {
  const f = fixture();
  f.selected.main = { mode: 'blocklist', channels: [{ id: channelId }], videoIds: [videoId], keywords: [
    { word: 'हिन्दी 中文 한국어 العربية', scope: 'title' },
    { word: 'комментарий 😀', scope: 'comment', comments: true },
    { word: 'தமிழ் チャンネル', scope: 'channel_name' }
  ] };
  const before = clone(f.storage), { payload, report } = await exportReviewed(f);
  const actual = upstreamImport(JSON.parse(JSON.stringify(payload))), compiled = upstreamCompile(actual.saved);
  assert.equal(matches(compiled, 'title', 'xहिन्दी 中文 한국어 العربيةy'), true);
  assert.equal(matches(compiled, 'comment', 'тест комментарий 😀!'), true);
  assert.equal(matches(compiled, 'channelName', 'தமிழ் チャンネル actual'), true);
  assert.equal(matches(compiled, 'title', 'комментарий 😀'), false);
  assert.equal(matches(compiled, 'comment', 'हिन्दी 中文 한국어 العربية'), false);
  assert.equal(matches(compiled, 'channelId', channelId), true);
  assert.equal(matches(compiled, 'channelId', `${channelId}x`), false);
  assert.equal(matches(compiled, 'videoId', videoId), true);
  assert.deepEqual(clone(report.counts), { title: 1, channelName: 1, channelId: 1, videoId: 1, comment: 1 });
  assert.deepEqual(f.storage, before);
});

test('literal delimiters, comment prefixes, newlines and Unicode exact boundaries retain meaning', async () => {
  const f = fixture();
  f.selected.main.keywords = [
    { word: '//literal' }, { word: '/pattern/i' }, { word: 'one\ntwo' }, { word: 'a/b.*[c]' },
    { word: '猫', exact: true }, { word: '^тест$', matchMode: 'regex', regexFlags: 'i', scope: 'comment' }
  ];
  const { payload } = await exportReviewed(f), actual = upstreamImport(payload), compiled = upstreamCompile(actual.saved);
  assert.equal(actual.saved.filterData.title.length, 5);
  for (const text of ['//literal', '/pattern/i', 'one\ntwo', 'a/b.*[c]']) assert.equal(matches(compiled, 'title', text), true, text);
  assert.equal(matches(compiled, 'title', 'a/bZZc'), false);
  // Exact Han/Hangul/Kana rules export as substrings, mirroring FilterTube's compilers (#79).
  assert.equal(matches(compiled, 'title', 'a猫b'), true);
  assert.equal(matches(compiled, 'title', '猫咪'), true);
  assert.equal(matches(compiled, 'title', 'x 猫 😀'), true);
  assert.equal(matches(compiled, 'comment', 'ТЕСТ'), true);
  assert.equal(matches(compiled, 'comment', 'preтест'), false);
});

test('channel filterAll regenerates title/comment rules while imported channel-name syntax remains separate', async () => {
  const f = fixture();
  f.selected.main.channels = [{ id: channelId, name: 'विज्ञान', filterAll: true, filterAllComments: true },
    { name: 'Friendly label', originalInput: '/^Official 中文$/', source: 'blocktube-channel-name' },
    { name: 'Japanese 日本', source: 'blocktube-channel-name' }];
  f.selected.main.keywords = [{ word: 'deleted channel stale', source: 'channel' }];
  const { payload } = await exportReviewed(f), compiled = upstreamCompile(upstreamImport(payload).saved);
  assert.equal(matches(compiled, 'title', 'विज्ञान news'), true);
  assert.equal(matches(compiled, 'comment', 'विज्ञान news'), true);
  assert.equal(matches(compiled, 'channelName', 'Official 中文'), true);
  assert.equal(matches(compiled, 'channelName', 'official 中文'), false, 'an imported flagless regex remains case sensitive');
  assert.equal(matches(compiled, 'title', 'Official 中文'), false);
  assert.equal(matches(compiled, 'channelName', 'Japanese 日本!'), true);
  assert.equal(matches(compiled, 'title', 'deleted channel stale'), false);
});

test('selected Main/Kids and independent parent profiles do not flatten into one BlockTube file', async () => {
  const f = fixture();
  const main = await exportReviewed(f), kids = await exportReviewed(f, { surface: 'kids' });
  assert.equal(matches(upstreamCompile(main.payload), 'title', 'Child marker'), true);
  assert.equal(matches(upstreamCompile(main.payload), 'title', 'Child Kids marker'), false);
  assert.equal(matches(upstreamCompile(kids.payload), 'title', 'Child Kids marker'), true);
  assert.equal(matches(upstreamCompile(kids.payload), 'title', 'Parent marker'), false);
  assert.match(kids.report.warnings.join('\n'), /does not provide a separate YouTube Kids/);
  await assert.rejects(f.io.previewBlockTubeExport({ profileId: 'sibling', surface: 'main' }), /parent\/account/);
  f.storage.ftProfilesV4.activeProfileId = 'default';
  assert.equal((await exportReviewed(f, { profileId: 'sibling' })).report.profileName, 'Sibling');
});

test('large multilingual exports retain every distinct row without a truncation cap or case-folding loss', async () => {
  const f = fixture();
  f.selected.main.keywords = Array.from({ length: 10050 }, (_, index) => ({ word: `हिन्दी 中文 row-${index}`, comments: true }));
  f.selected.main.keywords.push({ word: 'Case' }, { word: 'case' }, { word: 'Case' });
  const { payload } = await exportReviewed(f);
  const imported = upstreamImport(payload), compiled = upstreamCompile(imported.saved);
  assert.equal(imported.saved.filterData.title.length, 10052);
  assert.equal(imported.saved.filterData.comment.length, 10050);
  assert.equal(matches(compiled, 'title', 'हिन्दी 中文 row-10049'), true);
  assert.equal(imported.saved.filterData.title.includes('/Case/i'), true);
  assert.equal(imported.saved.filterData.title.includes('/case/i'), true);
});

test('unsupported constraints, unresolved identities and paused rows are reported and require explicit review', async () => {
  const f = fixture();
  f.selected.main.channels = [{ handle: '@unresolved', name: 'Not an ID' }, { id: channelId, name: 'Paused', filterAll: true, managedListPaused: true }];
  f.selected.main.keywords.push(
    { word: 'future rule', dateFilter: { enabled: true, after: '2099-01-01' } },
    { word: 'semantic', semantic: true }, { word: 'global', matchMode: 'regex', regexFlags: 'g' },
    { word: '[', matchMode: 'regex' }, { word: 'unknown', scope: 'description' }
  );
  f.selected.main.whitelistChannels = [{ id: channelId }];
  f.selected.settings = { contentFilters: { duration: { enabled: true, condition: 'longer', minMinutes: 5 } }, syncKidsToMain: true, hideShorts: true };
  const args = { profileId: 'child', surface: 'main' }, report = await f.io.previewBlockTubeExport(args);
  const reasons = report.unsupported.map(row => row.reason);
  for (const reason of ['unresolved_channel_id', 'paused_rule_not_exported', 'date_constraint_not_supported', 'semantic_matching_not_supported', 'unsupported_regex_flags', 'invalid_regex', 'unknown_keyword_scope', 'allow_rules_not_supported', 'setting_not_supported', 'kids_rules_not_merged_into_main_export']) assert.ok(reasons.includes(reason), reason);
  await assert.rejects(f.io.exportBlockTube({ ...args, reviewToken: report.reviewToken }), /explicitly accept/);
  const { payload } = await f.io.exportBlockTube({ ...args, reviewToken: report.reviewToken, acceptUnsupported: true });
  assert.equal(payload.filterData.title.length, 1); assert.equal(payload.filterData.channelId.length, 0);
  assert.equal(payload.options.shorts, true);
  assert.equal(payload.options.enable_javascript, false); assert.equal(payload.filterData.javascript, '');
});

test('whitelist mode and entirely unconvertible rules cannot be exported even after accepting omissions', async () => {
  for (const kind of ['whitelist', 'empty']) {
    const f = fixture();
    if (kind === 'whitelist') f.selected.main.mode = 'whitelist';
    else f.selected.main.keywords = [{ word: 'conditional', dateFilter: { enabled: true } }];
    const args = { profileId: 'child', surface: 'main' }, report = await f.io.previewBlockTubeExport(args);
    assert.equal(report.canExport, false);
    await assert.rejects(f.io.exportBlockTube({ ...args, reviewToken: report.reviewToken, acceptUnsupported: true }), /cannot be safely exported/);
  }
});

test('Kids-specific content constraints and disabled access are reported instead of disappearing', async () => {
  const f = fixture();
  f.selected.kids.contentFilters = { duration: { enabled: true, minMinutes: 10 }, uploadDate: { enabled: true } };
  f.selected.kids.categoryFilters = { enabled: true, mode: 'block', selected: ['Gaming'] };
  f.selected.settings = { enabled: false, allowKidsViewing: false };
  const report = await f.io.previewBlockTubeExport({ profileId: 'child', surface: 'kids' });
  for (const field of ['kids.contentFilters.duration', 'kids.contentFilters.uploadDate', 'kids.categoryFilters.enabled', 'settings.enabled', 'settings.allowKidsViewing']) {
    assert.ok(report.unsupported.some(row => row.field === field), field);
  }
});

test('malformed list and unknown mode cannot quietly become an empty successful export', async () => {
  const f = fixture(); f.selected.main.channels = { id: channelId }; f.selected.main.mode = 'unknown-mode';
  const report = await f.io.previewBlockTubeExport({ profileId: 'child', surface: 'main' });
  assert.equal(report.canExport, false);
  assert.ok(report.unsupported.some(row => row.reason === 'invalid_rule_list'));
  assert.ok(report.unsupported.some(row => row.reason === 'unknown_list_mode'));
});

test('export contains no profile PINs, parent authority, trusted links, history or signing keys', async () => {
  const f = fixture();
  f.selected.security = { pinVerifier: { secret: 'child-pin-not-exported' } };
  f.selected.managedPolicyState = { history: ['history-not-exported'] };
  const { payload, report } = await exportReviewed(f), json = JSON.stringify({ payload, report });
  for (const secret of ['child-pin-not-exported', 'trust-not-exported', 'private-not-exported', 'history-not-exported']) assert.equal(json.includes(secret), false);
  assert.deepEqual(Object.keys(payload).sort(), ['filterData', 'options', 'uiPass']); assert.equal(payload.uiPass, '');
});

test('review is mandatory, changes stale it, and changing the recipient or rule space cannot reuse it', async () => {
  const f = fixture(), args = { profileId: 'child', surface: 'main' };
  await assert.rejects(f.io.exportBlockTube(args), /Review the current/);
  const report = await f.io.previewBlockTubeExport(args);
  await assert.rejects(f.io.exportBlockTube({ ...args, surface: 'kids', reviewToken: report.reviewToken }), /Review the current/);
  f.selected.main.keywords.push({ word: 'new reviewed data needed' });
  await assert.rejects(f.io.exportBlockTube({ ...args, reviewToken: report.reviewToken }), /Review the current/);
  assert.equal(f.calls.writes, 0);
});

test('actual PIN verifier authorizes the current adult, never the selected child PIN', async () => {
  const f = fixture();
  f.storage.ftProfilesV4.profiles.parent.security.profilePinVerifier = await f.box.FilterTubeSecurity.createPinVerifier('2468', { iterations: 1000 });
  f.selected.security.profilePinVerifier = await f.box.FilterTubeSecurity.createPinVerifier('1234', { iterations: 1000 });
  const args = { profileId: 'child', surface: 'main' };
  await assert.rejects(f.io.previewBlockTubeExport(args), /PIN required/);
  await assert.rejects(f.io.previewBlockTubeExport({ ...args, auth: { localProfilePin: '1234' } }), /PIN required/);
  const report = await f.io.previewBlockTubeExport({ ...args, auth: { localProfilePin: '2468' } });
  await assert.rejects(f.io.exportBlockTube({ ...args, reviewToken: report.reviewToken }), /PIN required/);
  assert.equal((await f.io.exportBlockTube({ ...args, auth: { localProfilePin: '2468' }, reviewToken: report.reviewToken })).report.profileId, 'child');
  f.storage.ftProfilesV4.activeProfileId = 'child';
  await assert.rejects(f.io.previewBlockTubeExport({ ...args, auth: { localProfilePin: '1234' } }), /parent\/account/);
  assert.equal(f.calls.writes, 0);
});

for (const [name, change] of [
  ['actor switch', f => { f.storage.ftProfilesV4.activeProfileId = 'default'; }],
  ['target reparent', f => { f.selected.parentProfileId = 'other'; }],
  ['actor PIN replacement', f => { f.storage.ftProfilesV4.profiles.parent.security.profilePinVerifier = { iterations: 2, salt: 'changed' }; }],
  ['target deletion', f => { delete f.storage.ftProfilesV4.profiles.child; }]
]) {
  test(`authority change during PIN verification rejects ${name} without any writes`, async () => {
    const f = fixture(); f.storage.ftProfilesV4.profiles.parent.security.profilePinVerifier = { marker: 'initial' };
    f.box.FilterTubeSecurity.verifyPin = async () => { change(f); return true; };
    await assert.rejects(f.io.previewBlockTubeExport({ profileId: 'child', surface: 'main', auth: { localProfilePin: '2468' } }), /changed|parent\/account/);
    assert.equal(f.calls.writes, 0);
  });
}

test('rule changes while the review digest awaits cannot return a stale payload', async () => {
  const f = fixture();
  f.calls.onRead = count => { if (count === 3) f.selected.main.keywords.push({ word: 'late update' }); };
  await assert.rejects(f.io.previewBlockTubeExport({ profileId: 'child', surface: 'main' }), /rules changed/);
  assert.equal(f.calls.writes, 0);
});

test('required storage read errors do not fall back to another profile or create storage', async () => {
  const f = fixture();
  f.box.chrome.storage.local.get = (_, callback) => { f.box.chrome.runtime.lastError = { message: 'synthetic export read failed' }; callback({}); f.box.chrome.runtime.lastError = null; };
  await assert.rejects(f.io.previewBlockTubeExport({ profileId: 'child', surface: 'main' }), /synthetic export read failed/);
  assert.equal(f.calls.writes, 0);
});
