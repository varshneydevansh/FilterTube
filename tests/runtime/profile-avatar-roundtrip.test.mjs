import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

// The profile `avatar` field (Android ProfileAvatarCodec, docs/app/design-system/DOODLES.md):
// "doodle:<name>" for a doodle avatar, no value for crayon initials. Any string up to 64 characters
// is kept exactly, even one this version doesn't know; anything else is dropped, never fatal. It
// travels in backups and whole-tree sync; scoped and managed receives keep this device's avatar.
const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

function tree({ defaultAvatar, childAvatar } = {}) {
  const surfaces = () => ({
    main: { mode: 'blocklist', channels: [], keywords: [], whitelistChannels: [], whitelistKeywords: [] },
    kids: { mode: 'blocklist', blockedKeywords: [], blockedChannels: [] }
  });
  return { schemaVersion: 4, activeProfileId: 'default', profiles: {
    default: { type: 'account', name: 'Meera', parentProfileId: null, settings: {}, ...surfaces(),
      ...(defaultAvatar !== undefined ? { avatar: defaultAvatar } : {}) },
    kid: { type: 'child', name: 'Aarav', parentProfileId: 'default', settings: {}, ...surfaces(),
      ...(childAvatar !== undefined ? { avatar: childAvatar } : {}) }
  } };
}

async function device(root) {
  const storage = { ftProfilesV4: clone(root), ftProfilesV3: { main: {}, kids: {} }, ftNanahTrustedLinks: [], ftNanahDeviceId: 'device' };
  const box = { console, setTimeout, clearTimeout, crypto: globalThis.crypto, TextEncoder, TextDecoder, btoa, atob,
    chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
      get(keys, done) { done(keys === null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
      set(payload, done) { Object.assign(storage, clone(payload)); done?.(); },
      remove(keys, done) { (Array.isArray(keys) ? keys : [keys]).forEach(key => delete storage[key]); done?.(); },
      getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
    } } }
  };
  box.window = box; vm.createContext(box); installNanahStorageLock(box);
  vm.runInContext(read('settings_shared'), box);
  vm.runInContext(read('shared/study_model'), box);
  vm.runInContext(read('security_manager'), box);
  vm.runInContext(read('io_manager'), box);
  vm.runInContext(read('nanah_sync_adapter'), box);
  await box.FilterTubeSettings.loadSettings();
  return { io: box.FilterTubeIO, adapter: box.FilterTubeNanahAdapter, storage,
    avatar: id => storage.ftProfilesV4.profiles[id].avatar,
    has: id => Object.hasOwn(storage.ftProfilesV4.profiles[id], 'avatar') };
}

test('a full backup carries every profile avatar, known or not', async () => {
  const laptop = await device(tree({ defaultAvatar: 'doodle:star', childAvatar: 'doodle:rocket-from-a-newer-app' }));
  const backup = await laptop.io.exportV3({ scope: 'full' });
  assert.equal(backup.profilesV4.profiles.default.avatar, 'doodle:star');
  assert.equal(backup.profilesV4.profiles.kid.avatar, 'doodle:rocket-from-a-newer-app', 'an unknown value is kept exactly');
});

test('a profile without an avatar exports without the field (initials)', async () => {
  const backup = await (await device(tree())).io.exportV3({ scope: 'full' });
  assert.equal(Object.hasOwn(backup.profilesV4.profiles.default, 'avatar'), false);
});

test('values that are not short strings are dropped, never fatal', async () => {
  const laptop = await device(tree({ defaultAvatar: { kind: 'doodle' }, childAvatar: 'x'.repeat(65) }));
  const backup = await laptop.io.exportV3({ scope: 'full' });
  assert.equal(Object.hasOwn(backup.profilesV4.profiles.default, 'avatar'), false);
  assert.equal(Object.hasOwn(backup.profilesV4.profiles.kid, 'avatar'), false);
  const blank = await (await device(tree({ defaultAvatar: '   ', childAvatar: 7 }))).io.exportV3({ scope: 'full' });
  assert.equal(Object.hasOwn(blank.profilesV4.profiles.default, 'avatar'), false);
  assert.equal(Object.hasOwn(blank.profilesV4.profiles.kid, 'avatar'), false);
  assert.equal(backup.profilesV4.profiles.kid.name, 'Aarav', 'the rest of the profile is untouched');
});

test('a full replace restore brings the avatars back on another device', async () => {
  const backup = await (await device(tree({ defaultAvatar: 'doodle:heart', childAvatar: 'doodle:cloud' }))).io.exportV3({ scope: 'full' });
  const phone = await device(tree());
  const result = await phone.io.importV3(clone(backup), { scope: 'full', strategy: 'replace' });
  assert.equal(result.ok, true);
  assert.equal(phone.avatar('default'), 'doodle:heart');
  assert.equal(phone.avatar('kid'), 'doodle:cloud');
});

test('a full merge takes the incoming avatar and keeps the local one when the file has none', async () => {
  const backup = await (await device(tree({ childAvatar: 'doodle:flower' }))).io.exportV3({ scope: 'full' });
  const phone = await device(tree({ defaultAvatar: 'doodle:tick', childAvatar: 'doodle:star' }));
  await phone.io.importV3(clone(backup), { scope: 'full', strategy: 'merge' });
  assert.equal(phone.avatar('kid'), 'doodle:flower');
  assert.equal(phone.avatar('default'), 'doodle:tick', 'an older file without the field never clears it');
});

test('an Android raw v4 profile-tree backup keeps the avatar through the conversion', async () => {
  const appBackup = { ...tree({ defaultAvatar: 'doodle:magnifier', childAvatar: 'doodle:seal' }), meta: { exportType: 'full' } };
  const phone = await device(tree());
  const result = await phone.io.importV3(clone(appBackup), { scope: 'full', strategy: 'replace' });
  assert.equal(result.ok, true);
  assert.equal(phone.avatar('default'), 'doodle:magnifier');
  assert.equal(phone.avatar('kid'), 'doodle:seal');
});

test('an encrypted backup keeps the avatar', async () => {
  const laptop = await device(tree({ defaultAvatar: 'doodle:waves' }));
  if (typeof laptop.io.exportV3Encrypted !== 'function' || !globalThis.crypto?.subtle) return;
  const container = await laptop.io.exportV3Encrypted({ scope: 'full', password: 'correct horse' });
  const phone = await device(tree());
  const result = await phone.io.importV3Encrypted(clone(container), { password: 'correct horse', scope: 'full', strategy: 'replace' });
  assert.equal(result.ok, true);
  assert.equal(phone.avatar('default'), 'doodle:waves');
});

test('Nanah whole-tree sync carries avatars; a profile-scoped send keeps this device\'s', async () => {
  const laptop = await device(tree({ defaultAvatar: 'doodle:note', childAvatar: 'doodle:bubble' }));
  const full = await laptop.adapter.buildPortablePayload({ scope: 'full' });
  const active = await laptop.adapter.buildPortablePayload({ scope: 'active' });
  const main = await laptop.adapter.buildPortablePayload({ scope: 'main' });

  const phone = await device(tree({ defaultAvatar: 'doodle:arrow' }));
  await phone.adapter.applyIncomingEnvelope({ t: 'app_sync', scope: 'active', payload: JSON.stringify(active.portable) }, { strategy: 'merge' });
  assert.equal(phone.avatar('default'), 'doodle:arrow', 'Copy once into this profile keeps its own avatar, like its name');
  await phone.adapter.applyIncomingEnvelope({ t: 'app_sync', scope: 'main', payload: JSON.stringify(main.portable) }, { strategy: 'replace' });
  assert.equal(phone.avatar('default'), 'doodle:arrow', 'Main-only sends carry rules, not identity');
  await phone.adapter.applyIncomingEnvelope({ t: 'app_sync', scope: 'full', payload: JSON.stringify(full.portable) }, { strategy: 'replace' });
  assert.equal(phone.avatar('default'), 'doodle:note', 'Move account carries the whole tree');
  assert.equal(phone.avatar('kid'), 'doodle:bubble');
});

test('a profile rename or settings write elsewhere never drops the avatar', async () => {
  const phone = await device(tree({ childAvatar: 'doodle:crayon' }));
  const root = await phone.io.loadProfilesV4();
  root.profiles.kid = { ...root.profiles.kid, name: 'Aarav S' };
  await phone.io.saveProfilesV4(root);
  assert.equal(phone.avatar('kid'), 'doodle:crayon');
});

// ---------------------------------------------------------------------------
// Display: the same doodle list as Android ProfileAvatarDoodle, drawn by UIComponents.
// ---------------------------------------------------------------------------
function components() {
  const box = { console, window: {} };
  vm.createContext(box);
  vm.runInContext(`${read('ui_components')}\nthis.UI = UIComponents;`, box);
  return box.UI;
}

function fakeDocument() {
  const make = (tag) => {
    const node = { tagName: tag.toUpperCase(), children: [], style: { setProperty(k, v) { this[k] = v; } }, dataset: {}, attributes: {},
      classes: new Set(), textContent: '', innerHTML: '',
      appendChild(child) { this.children.push(child); return child; },
      setAttribute(k, v) { this.attributes[k] = v; } };
    node.classList = { add: (...names) => names.forEach(n => node.classes.add(n)), toggle: (n, on) => (on ? node.classes.add(n) : node.classes.delete(n)) };
    Object.defineProperty(node, 'textContent', { get() { return this._text || ''; }, set(v) { this._text = v; if (v === '') this.children = []; } });
    return node;
  };
  const doc = { body: make('body'), createElement: make, createElementNS: (_, tag) => make(tag) };
  return doc;
}

test('the doodle avatars are the app\'s fifteen, in order, and every file ships', () => {
  const UI = components();
  assert.deepEqual(clone(UI.PROFILE_AVATAR_DOODLES.map(entry => entry.value)), ['doodle:heart', 'doodle:flower', 'doodle:star', 'doodle:sparkle',
    'doodle:cloud', 'doodle:crayon', 'doodle:clip', 'doodle:stamp', 'doodle:magnifier', 'doodle:bubble', 'doodle:seal', 'doodle:note',
    'doodle:waves', 'doodle:arrow', 'doodle:tick']);
  for (const entry of UI.PROFILE_AVATAR_DOODLES) {
    const file = new URL(`../../assets/images/doodles/${entry.file}.webp`, import.meta.url);
    assert.ok(fs.existsSync(file), entry.file);
    assert.ok(fs.statSync(file).size < 8 * 1024, `${entry.file} stays small`);
  }
  for (const sticker of ['heart', 'star', 'sparkle']) assert.ok(fs.existsSync(new URL(`../../assets/images/doodles/${sticker}.webp`, import.meta.url)));
});

test('role, codec and sticker rules match ProfileAvatars', () => {
  const UI = components();
  assert.equal(UI.profileRole('default', 'account'), 'parent');
  assert.equal(UI.profileRole('p2', 'account'), 'adult');
  assert.equal(UI.profileRole('kid', 'child'), 'kids');
  assert.equal(UI.profileAvatarDoodle('doodle:star').file, 'star');
  assert.equal(UI.profileAvatarDoodle('doodle:rocket'), null, 'unknown values show initials');
  assert.equal(UI.normalizeProfileAvatar('doodle:rocket'), 'doodle:rocket', 'but they are kept');
  assert.equal(UI.normalizeProfileAvatar(5), null);
  assert.equal(UI.profileAvatarSticker('kid', 'adult'), null, 'adults get the plain initial');
  assert.equal(UI.profileAvatarSticker('kid', 'kids'), UI.profileAvatarSticker('kid', 'kids'), 'stable per id');
  assert.ok(['heart', 'star', 'sparkle'].includes(UI.profileAvatarSticker('kid', 'kids')));
  assert.equal(UI.profileInitial('  aarav'), 'A');
  assert.equal(UI.profileInitial(''), '?');
  assert.equal(UI.profileInitial('😀 Joy'), '😀', 'a whole code point');
});

test('renderProfileAvatar draws initials with a Kids sticker, or the doodle without one', () => {
  const UI = components();
  const doc = fakeDocument();
  const host = doc.createElement('span');
  host.ownerDocument = doc;
  UI.renderProfileAvatar(host, { id: 'kid', name: 'Aarav', type: 'child', size: 40 });
  assert.ok(host.classes.has('ft-avatar--kids'));
  assert.equal(host.dataset.ftAvatar, 'initial');
  assert.equal(host.attributes['aria-hidden'], 'true', 'decorative: the row text carries the meaning');
  assert.equal(host.children.find(node => node.className === 'ft-avatar__initial').textContent, 'A');
  assert.ok(host.children.some(node => node.className === 'ft-avatar__sticker'));

  UI.renderProfileAvatar(host, { id: 'kid', name: 'Aarav', type: 'child', avatar: 'doodle:arrow', size: 40 });
  assert.equal(host.dataset.ftAvatar, 'doodle:arrow');
  assert.equal(host.children.some(node => node.className === 'ft-avatar__sticker'), false, 'a doodle avatar has no sticker');
  assert.ok(host.children.some(node => node.className === 'ft-avatar__doodle ft-avatar__doodle--mask'), 'mask doodles take the role ink');

  UI.renderProfileAvatar(host, { id: 'kid', name: 'Aarav', type: 'child', avatar: 'doodle:flower', size: 40 });
  assert.ok(host.children.some(node => node.className === 'ft-avatar__doodle'), 'Kids keep the doodle\'s own colours');
  UI.renderProfileAvatar(host, { id: 'default', name: 'Meera', type: 'account', avatar: 'doodle:flower', size: 40 });
  assert.ok(host.children.some(node => node.className === 'ft-avatar__doodle ft-avatar__doodle--mask'), 'Parent doodles take the Family ink');
  UI.renderProfileAvatar(host, { id: 'kid', name: 'Aarav', type: 'child', size: 24 });
  assert.equal(host.children.some(node => node.className === 'ft-avatar__sticker'), false, 'no sticker under 34 px');
});

test('the profile picker, manager and dashboard card draw avatars and use the role words', () => {
  const tab = read('tab-view');
  const popup = read('popup');
  for (const source of [tab, popup]) {
    assert.match(source, /renderProfileAvatar/);
    assert.match(source, /'profiles\.statusCurrent', 'You’re here'/);
  }
  assert.match(tab, /async function changeProfileAvatar\(profileId\)/);
  const gate = tab.slice(tab.indexOf('async function changeProfileAvatar('), tab.indexOf('async function loadAuthorizedProfileMutationRoot('));
  assert.ok(gate.indexOf('ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true })') < gate.indexOf('showAvatarPickerModal('),
    'the manager unlocks before the grid opens');
  assert.ok(gate.indexOf('showAvatarPickerModal(') < gate.indexOf('profileMutationStillAuthorized(latest'), 'and checks again before the write');
  const en = JSON.parse(fs.readFileSync(new URL('../../data/ui_locales/en.json', import.meta.url), 'utf8'));
  assert.equal(en['popup.profile.subtitleMaster'], 'Parent profile');
  assert.equal(en['popup.profile.subtitleAccount'], 'Adult profile');
  assert.equal(en['popup.profile.subtitleChild'], 'Kids profile');
  for (const file of fs.readdirSync(new URL('../../data/ui_locales/', import.meta.url)).filter(name => /^[a-z]{2,3}(-[A-Za-z]+)?\.json$/.test(name) && name !== 'targets.json')) {
    const catalog = JSON.parse(fs.readFileSync(new URL(`../../data/ui_locales/${file}`, import.meta.url), 'utf8'));
    for (const key of ['profiles.statusCurrent', 'profiles.avatar.heart', 'profiles.avatar.tick', 'parentMode.spaceTitle', 'parentMode.done',
      'parentMode.exitToast', 'popup.profile.subtitleChild']) {
      assert.equal(typeof catalog[key], 'string', `${file} ${key}`);
    }
    assert.match(catalog['parentMode.spaceTitle'], /\{name\}/, `${file} keeps the placeholder`);
  }
});
