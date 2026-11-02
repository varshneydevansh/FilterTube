import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto, createHash } from 'node:crypto';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

const require = createRequire(import.meta.url);
const kids = require('../../js/shared/kids_youtube_profiles.js');
const clone = value => JSON.parse(JSON.stringify(value));
const keyOf = id => 'sha256:' + createHash('sha256').update('filtertube-kids-persona-v1:' + id).digest('hex');
const KEY_A = keyOf('persona-A'), KEY_B = keyOf('child-B');
const PERSONA = 'REGISTERED_GAIA_SERVICES_IS_YOUTUBE_PERSONA';
const SUPERVISED = 'REGISTERED_GAIA_SERVICES_IS_UNICORN_CHILD_ACCOUNT';
const tree = (extra = {}) => ({ schemaVersion: 4, activeProfileId: 'default', profiles: {
    default: { type: 'account', name: 'Default', parentProfileId: null },
    parent2: { type: 'account', name: 'Second parent', parentProfileId: null },
    ana: { type: 'child', name: 'Ana', parentProfileId: 'default' },
    ben: { type: 'child', name: 'Ben', parentProfileId: 'parent2' }
}, ...extra });

test('the roster follows YouTube Kids\' own rules for parent, persona, supervised and onboarding rows', () => {
    const roster = kids.classify([
        { displayName: 'Parent', delegationType: 'GAIA_DELEGATION_TYPE_NONE', services: [], personaKey: keyOf('parent'), byline: 'parent@example.com' },
        { displayName: 'Ana', delegationType: 'GAIA_DELEGATION_TYPE_PERSONA', services: [PERSONA], personaKey: KEY_A, selected: true, ageYears: 7, avatarUrl: 'https://yt3.example/a.jpg' },
        { displayName: 'Ben', delegationType: 'GAIA_DELEGATION_TYPE_EARLY', services: [SUPERVISED], personaKey: KEY_B, selected: true, ageYears: 9 },
        { displayName: 'Setup', delegationType: 'GAIA_DELEGATION_TYPE_PERSONA', services: [PERSONA], personaKey: keyOf('setup'), supervisedAccessAllowed: false },
        { displayName: 'Other', delegationType: 'GAIA_DELEGATION_TYPE_LATE', services: [SUPERVISED], personaKey: keyOf('other') },
        { displayName: 'No key', delegationType: 'GAIA_DELEGATION_TYPE_PERSONA', services: [PERSONA], personaKey: 'raw-id' }
    ]);
    assert.equal(roster.hasParent, true);
    assert.equal(roster.hiddenForOnboarding, 1);
    assert.deepEqual(roster.profiles.map(p => [p.displayName, p.profileType, p.selected, p.ageYears]),
        [['Ana', 0, true, 7], ['Ben', 1, false, null]]);
    assert.equal(JSON.stringify(roster).includes('parent@example.com'), false, 'the parent\'s e-mail is dropped');
});

test('links keep only the key, the kid\'s name and the link time', () => {
    let links = kids.withLink(null, { profileId: 'ana', personaKey: KEY_A, displayName: 'Ana', linkedAtMillis: 10 });
    links = kids.normalizeLinks({ links: [...links.links, { profileId: 'ben', personaKey: 'not-a-key', displayName: 'Ben' },
        { profileId: 'ana', personaKey: KEY_B, displayName: 'Duplicate' }] });
    assert.deepEqual(links, { schemaVersion: 1, links: [{ profileId: 'ana', personaKey: KEY_A, displayName: 'Ana', linkedAtMillis: 10 }] });
    const withAvatar = kids.normalizeLinks({ links: [{ profileId: 'ana', personaKey: KEY_A, displayName: 'Ana', avatarUrl: 'https://x', linkedAtMillis: 1 }] });
    assert.equal('avatarUrl' in withAvatar.links[0], false);
    assert.deepEqual(kids.unlink(links, 'ana').links, []);
    assert.deepEqual(kids.retaining(links, ['ben']).links, []);
});

test('device sync adopts mapped links and the newer link wins per profile', () => {
    const local = { links: [{ profileId: 'ana', personaKey: KEY_A, displayName: 'Ana', linkedAtMillis: 50 }] };
    const incoming = { links: [
        { profileId: 'ana', personaKey: KEY_B, displayName: 'Older', linkedAtMillis: 40 },
        { profileId: 'remote-ben', personaKey: KEY_B, displayName: 'Ben', linkedAtMillis: 60 },
        { profileId: 'stranger', personaKey: KEY_B, displayName: 'Unmapped', linkedAtMillis: 99 }] };
    const adopted = kids.adopt(local, incoming, { ana: 'ana', 'remote-ben': 'ben' }, ['default', 'ana', 'ben']);
    assert.deepEqual(adopted.links.map(l => [l.profileId, l.displayName]), [['ana', 'Ana'], ['ben', 'Ben']]);
    const newer = kids.adopt(local, { links: [{ profileId: 'ana', personaKey: KEY_B, displayName: 'Newer', linkedAtMillis: 70 }] }, { ana: 'ana' }, ['ana']);
    assert.equal(newer.links[0].displayName, 'Newer');
});

test('only a parent context links its own profiles; a child never changes or escapes a link', () => {
    const root = tree();
    assert.equal(kids.linkDecision(root, 'default', 'ana'), 'allowed');
    assert.equal(kids.linkDecision(root, 'default', 'ben'), 'allowed', 'Default manages every profile');
    assert.equal(kids.linkDecision(root, 'parent2', 'ben'), 'allowed');
    assert.equal(kids.linkDecision(root, 'parent2', 'ana'), 'not_managed');
    assert.equal(kids.linkDecision(root, 'ana', 'ana'), 'child', 'refused inside a child, even for itself');
    const links = { links: [{ profileId: 'ana', personaKey: KEY_A, displayName: 'Ana', linkedAtMillis: 1 }] };
    assert.equal(kids.switchDecision(root, links, 'ana', KEY_A), 'allowed');
    assert.equal(kids.switchDecision(root, links, 'ana', KEY_B), 'linked');
    assert.equal(kids.switchDecision(root, links, 'ben', KEY_B), 'child');
    assert.equal(kids.switchDecision(root, links, 'default', KEY_B), 'allowed');
});

function kidsPage({ loggedIn = true, stored = null, personaAge = 7, failPersona = false } = {}) {
    const storage = new Map(stored ? [['yt.identity.kids::childprofile', JSON.stringify(stored)]] : []);
    const calls = [], assigned = [];
    const item = (name, delegation, services, id, extra = {}) => ({ accountItem: { accountName: { simpleText: name },
        identity: { gaiaDelegationType: delegation, registeredGaiaServices: services },
        accountPhoto: { thumbnails: [{ url: 'https://yt3.example/' + name + '.jpg' }] },
        serviceEndpoint: { selectActiveIdentityEndpoint: { supportedTokens: [{ accountStateToken: { obfuscatedGaiaId: id } },
            ...(services.includes(PERSONA) ? [{ personaIdToken: { personaId: id, ownerId: 'owner-raw' } }] : [])] } }, ...extra } });
    const accounts = { contents: [{ accountSectionListRenderer: { contents: [{ accountItemSectionRenderer: { contents: [
        item('Parent', 'GAIA_DELEGATION_TYPE_NONE', [], 'parent-raw', { accountByline: { simpleText: 'parent@example.com' } }),
        item('Ana', 'GAIA_DELEGATION_TYPE_PERSONA', [PERSONA], 'persona-A'),
        item('Ben', 'GAIA_DELEGATION_TYPE_EARLY', [SUPERVISED], 'child-B'),
        item('Setup', 'GAIA_DELEGATION_TYPE_PERSONA', [PERSONA], 'setup-raw', { kidsSupervisedAccountAccessAllowed: false })
    ] } }] } }] };
    const response = (body, ok = true) => ({ ok, text: async () => body, json: async () => JSON.parse(body) });
    const context = { TextEncoder, crypto: webcrypto, setTimeout: fn => fn(), JSON, Array, String, Number, Object, Promise, Error, Uint8Array,
        fetch: async (url, init = {}) => {
            calls.push({ url, auth: init.headers?.authorization || null, body: init.body || null });
            if (url === '/get_access_token') return response(")]}'\n" + JSON.stringify({ accessToken: 'parent-token' }));
            if (url.startsWith('/youtubei/v1/account/accounts_list')) return response(JSON.stringify(accounts));
            if (url.startsWith('/youtubei/v1/account/get_persona')) return failPersona ? response('{}', false)
                : response(JSON.stringify({ persona: { approximateAge: { age: personaAge }, birthday: { year: 2018 } } }));
            return response('{}', false);
        },
        window: { ytcfg: { get: key => ({ LOGGED_IN: loggedIn, INNERTUBE_CONTEXT: { client: { clientName: 'WEB_KIDS' } } })[key] },
            localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
            location: { assign: url => assigned.push(url) } } };
    vm.createContext(context);
    return { context, storage, calls, assigned, run: (fn, ...args) => vm.runInContext(`(${fn.toString()})(...${JSON.stringify(args)})`, context) };
}

test('the page roster posts hashed keys, names and ages only, and clears the parent token', async () => {
    const page = kidsPage({ stored: { profileId: 'persona-A', profileType: 0 } });
    const result = await page.run(kids.pageRoster, 8);
    assert.equal(result.status, 'ok');
    const text = JSON.stringify(result);
    for (const secret of ['persona-A', 'child-B', 'parent-raw', 'owner-raw', 'parent-token', 'parent@example.com', '2018']) {
        assert.equal(text.includes(secret), false, `no ${secret} in the result`);
    }
    const roster = kids.classify(result.rows);
    assert.deepEqual(roster.profiles.map(p => [p.personaKey, p.selected, p.ageYears, p.profileType]), [[KEY_A, true, 7, 0], [KEY_B, false, null, 1]]);
    assert.equal(roster.hiddenForOnboarding, 1);
    assert.ok(page.calls.filter(call => call.url.includes('get_persona')).every(call => call.auth === 'Bearer parent-token'));
    assert.equal(page.calls.filter(call => call.url.includes('get_persona')).length, 2, 'ages are asked for YouTube Kids profiles only');
    assert.equal((await kidsPage({ failPersona: true }).run(kids.pageRoster, 8)).rows.find(row => row.displayName === 'Ana').ageYears, undefined);
    assert.equal((await kidsPage({ loggedIn: false }).run(kids.pageRoster, 8)).status, 'signed_out');
});

test('activation writes the page\'s own selection and reloads; it never selects a profile still in setup', async () => {
    const page = kidsPage({ stored: { profileId: 'persona-A', profileType: 0 } });
    assert.equal((await page.run(kids.pageActivate, KEY_A)).status, 'already_selected');
    assert.equal(page.calls.length, 0, 'no network when the linked kid is already selected');
    assert.equal((await page.run(kids.pageActivate, KEY_B)).status, 'activation_started');
    assert.deepEqual(JSON.parse(page.storage.get('yt.identity.kids::childprofile')), { profileId: 'child-B', profileType: 1 });
    assert.deepEqual(page.assigned, ['/']);
    const setup = kidsPage();
    assert.equal((await setup.run(kids.pageActivate, keyOf('setup-raw'))).status, 'persona_unavailable');
    assert.equal(setup.assigned.length, 0);
});

function backgroundFixture({ profilesV4 = tree(), authorized = true, tabs = [{ id: 7, url: 'https://www.youtubekids.com/watch?v=x' }] } = {}) {
    const listeners = { updated: [], removed: [], changed: [] }, executed = [];
    let clock = 1000;
    const api = { runtime: { lastError: null },
        scripting: { executeScript: (details, done) => { executed.push(details); done([{ result: details.func.name === 'pageRoster'
            ? { status: 'ok', signedIn: true, rows: [{ displayName: 'Ana', delegationType: 'GAIA_DELEGATION_TYPE_PERSONA', services: [PERSONA], personaKey: KEY_A }] }
            : { status: 'activation_started' } }]); } },
        tabs: { query: (_q, done) => done(tabs), get: (id, done) => done(tabs.find(tab => tab.id === id)), create: (_d, done) => done({ id: 99 }), remove: (_id, done) => done?.(),
            onUpdated: { addListener: fn => listeners.updated.push(fn), removeListener: () => {} }, onRemoved: { addListener: fn => listeners.removed.push(fn) } },
        storage: { onChanged: { addListener: fn => listeners.changed.push(fn) } } };
    const box = {}; vm.createContext(box); box.globalThis = box;
    vm.runInContext(fs.readFileSync(new URL('../../js/kids_youtube_profiles_background.js', import.meta.url), 'utf8'), box);
    const state = { profilesV4 };
    const instance = box.FilterTubeKidsYouTubeProfilesBackground.install({ api, contract: kids, readProfilesV4: async () => clone(state.profilesV4),
        isTrustedSender: sender => sender?.url?.startsWith('chrome-extension://ext/'), isProfileAuthorized: async () => authorized, now: () => clock });
    return { instance, executed, listeners, state, advance: ms => { clock += ms; } };
}
const dashboard = { url: 'chrome-extension://ext/html/tab-view.html' };

test('the background serves extension pages only and enforces the switch rules', async () => {
    const f = backgroundFixture();
    assert.deepEqual(clone(await f.instance.handle({ action: 'FilterTube_KidsProfilesRoster' }, { url: 'https://evil.example/' })), { ok: false, error: 'untrusted_sender' });
    const roster = await f.instance.handle({ action: 'FilterTube_KidsProfilesRoster' }, dashboard);
    assert.deepEqual(clone(roster.profiles.map(p => p.personaKey)), [KEY_A]);
    assert.equal(f.executed[0].world, 'MAIN');
    const linked = backgroundFixture({ profilesV4: tree({ activeProfileId: 'ana', kidsPersonaLinks: { links: [{ profileId: 'ana', personaKey: KEY_A, displayName: 'Ana', linkedAtMillis: 1 }] } }) });
    assert.deepEqual(clone(await linked.instance.handle({ action: 'FilterTube_KidsProfilesSwitch', personaKey: KEY_B }, dashboard)), { ok: false, error: 'linked' });
    const child = backgroundFixture({ profilesV4: tree({ activeProfileId: 'ben' }) });
    assert.deepEqual(clone(await child.instance.handle({ action: 'FilterTube_KidsProfilesSwitch', personaKey: KEY_B }, dashboard)), { ok: false, error: 'child' });
    const locked = backgroundFixture({ authorized: false });
    assert.deepEqual(clone(await locked.instance.handle({ action: 'FilterTube_KidsProfilesSwitch', personaKey: KEY_B }, dashboard)), { ok: false, error: 'locked' });
    const ok = await f.instance.handle({ action: 'FilterTube_KidsProfilesSwitch', personaKey: KEY_B, tabId: 7 }, dashboard);
    assert.deepEqual(clone(ok), { ok: true, status: 'activation_started' });
    assert.deepEqual(clone(f.executed.at(-1).args), [KEY_B]);
});

test('youtubekids.com keeps the active profile\'s linked kid selected, without reload loops', async () => {
    const f = backgroundFixture({ profilesV4: tree({ activeProfileId: 'ana', kidsPersonaLinks: { links: [{ profileId: 'ana', personaKey: KEY_A, displayName: 'Ana', linkedAtMillis: 1 }] } }) });
    const tab = { id: 7, url: 'https://www.youtubekids.com/' };
    await f.instance.reconcile(tab);
    assert.deepEqual(clone(f.executed.map(call => [call.func.name, call.args])), [['pageActivate', [KEY_A]]]);
    await f.instance.reconcile(tab);
    assert.equal(f.executed.length, 1, 'a second load within the gap does not run again');
    f.advance(30000); await f.instance.reconcile(tab);
    assert.equal(f.executed.length, 2);
    await f.instance.reconcile({ id: 8, url: 'https://www.youtube.com/' });
    assert.equal(f.executed.length, 2, 'other sites are never touched');
    const unlinked = backgroundFixture();
    await unlinked.instance.reconcile(tab);
    assert.equal(unlinked.executed.length, 0, 'nothing happens without a link');
});

const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
async function ioFixture(profilesV4) {
    const storage = { ftProfilesV4: profilesV4, ftProfilesV3: { main: {}, kids: {} } };
    const box = { console, setTimeout, clearTimeout, TextEncoder,
        chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
            get(keyList, done) { done(keyList === null ? clone(storage) : Object.fromEntries((Array.isArray(keyList) ? keyList : [keyList]).filter(key => key in storage).map(key => [key, clone(storage[key])]))); },
            set(payload, done) { Object.assign(storage, clone(payload)); done?.(); },
            remove(keyList, done) { (Array.isArray(keyList) ? keyList : [keyList]).forEach(key => delete storage[key]); done?.(); },
            getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
        } } } };
    box.window = box; vm.createContext(box); installNanahStorageLock(box);
    for (const name of ['shared/saved_video_notes', 'shared/local_playlists', 'shared/kids_youtube_profiles', 'settings_shared', 'io_manager']) vm.runInContext(read(name), box);
    await box.FilterTubeSettings.loadSettings();
    return { box, storage };
}
const fullTree = links => ({ schemaVersion: 4, activeProfileId: 'default', profiles: {
    default: { type: 'account', name: 'Default', parentProfileId: null, settings: {}, main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist', blockedKeywords: [] } },
    ana: { type: 'child', name: 'Ana', parentProfileId: 'default', settings: {}, main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist', blockedKeywords: [] } }
}, kidsPersonaLinks: { schemaVersion: 1, links } });

test('manual backups carry no links and keep this device\'s links; Nanah sync carries and adopts them', async () => {
    const mine = [{ profileId: 'ana', personaKey: KEY_A, displayName: 'Ana', linkedAtMillis: 10 }];
    const source = await ioFixture(fullTree(mine));
    const backup = clone(await source.box.FilterTubeIO.exportV3({ scope: 'full' }));
    assert.deepEqual(backup.profilesV4.kidsPersonaLinks, { schemaVersion: 1, links: [] });
    const synced = clone(await source.box.FilterTubeIO.exportV3({ scope: 'full', includeKidsPersonaLinks: true }));
    assert.deepEqual(synced.profilesV4.kidsPersonaLinks.links.map(l => l.profileId), ['ana']);

    const otherLinks = [{ profileId: 'ana', personaKey: KEY_B, displayName: 'Ben', linkedAtMillis: 5 }];
    const target = await ioFixture(fullTree(otherLinks));
    await target.box.FilterTubeIO.importV3(clone(synced), { scope: 'full', strategy: 'replace' });
    assert.deepEqual(target.storage.ftProfilesV4.kidsPersonaLinks.links.map(l => l.personaKey), [KEY_B], 'a manual import adopts no links');
    await target.box.FilterTubeIO.importV3(clone(synced), { scope: 'full', adoptKidsPersonaLinks: true });
    assert.deepEqual(target.storage.ftProfilesV4.kidsPersonaLinks.links.map(l => l.personaKey), [KEY_A], 'device sync adopts the newer link');
});
