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
        window: { ytcfg: { get: key => ({ LOGGED_IN: loggedIn, INNERTUBE_CONTEXT: { client: { clientName: 'WEB_KIDS' } },
                OAUTH_CLIENT_ID: 'kids-client.apps.example', OAUTH_CLIENT_SCOPE: 'https://www.googleapis.com/auth/youtube openid' })[key] },
            localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
            location: { hostname: 'www.youtubekids.com', assign: url => assigned.push(url) } } };
    vm.createContext(context);
    return { context, storage, calls, assigned, run: (fn, ...args) => vm.runInContext(`(${fn.toString()})(...${JSON.stringify(args)})`, context) };
}

test('the page roster posts hashed keys, names and ages only, and clears the parent token', async () => {
    const page = kidsPage({ stored: { profileId: 'persona-A', profileType: 0 } });
    const result = await page.run(kids.pageRoster, 8);
    assert.equal(result.status, 'ok');
    const text = JSON.stringify(result);
    for (const secret of ['persona-A', 'child-B', 'parent-raw', 'owner-raw', 'parent-token', '2018']) {
        assert.equal(text.includes(secret), false, `no ${secret} in the result`);
    }
    assert.equal(JSON.stringify(result.rows).includes('parent@example.com'), false, 'the e-mail is only on the parent, for display');
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

const parentKeyOf = email => 'sha256:' + createHash('sha256').update('filtertube-kids-parent-v1:' + email).digest('hex');
const DAD = parentKeyOf('dad@example.com'), MUM = parentKeyOf('parent@example.com');

test('links remember the parent as a key and a name only; old links without a parent still load', () => {
    const links = kids.normalizeLinks({ links: [
        { profileId: 'ana', personaKey: KEY_A, displayName: 'Ana', linkedAtMillis: 1, parentKey: DAD, parentName: 'Dad', parentEmail: 'dad@example.com' },
        { profileId: 'ben', personaKey: KEY_B, displayName: 'Ben', linkedAtMillis: 1 },
        { profileId: 'mia', personaKey: keyOf('mia'), displayName: 'Mia', linkedAtMillis: 1, parentKey: 'broken', parentName: 'Nobody' }] });
    assert.deepEqual(links.links.map(l => [l.profileId, l.parentKey || null, l.parentName || null]),
        [['ana', DAD, 'Dad'], ['ben', null, null], ['mia', null, null]]);
    assert.equal(JSON.stringify(links).includes('@'), false, 'no e-mail is ever stored');
    assert.equal(kids.linkedParentDecision(links, 'ana', DAD), 'current');
    assert.equal(kids.linkedParentDecision(links, 'ana', MUM), 'switch_needed');
    assert.equal(kids.linkedParentDecision(links, 'ben', MUM), 'no_parent_in_link');
    assert.equal(kids.parentChangeDecision(tree(), 'ana'), 'child');
    assert.equal(kids.parentChangeDecision(tree(), 'parent2'), 'allowed');
});

test('the parent sign-in is YouTube Kids\' own request: Google accounts only, chooser unless the account is known', () => {
    const base = { clientId: 'kids-client.apps.example', scope: 'https://www.googleapis.com/auth/youtube openid', state: 'a'.repeat(32) };
    const chooser = new URL(kids.oauthUrl(base));
    assert.equal(chooser.origin + chooser.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
    assert.equal(chooser.searchParams.get('prompt'), 'select_account');
    assert.equal(chooser.searchParams.get('pageId'), 'none', 'brand accounts are ruled out');
    assert.equal(chooser.searchParams.get('redirect_uri'), 'https://www.youtubekids.com/signin?gaia_popup_redirect=1');
    assert.equal(chooser.searchParams.get('response_type'), 'none gsession');
    const hinted = new URL(kids.oauthUrl({ ...base, loginHint: ' Dad@Example.com ' }));
    assert.equal(hinted.searchParams.get('login_hint'), 'dad@example.com');
    assert.equal(hinted.searchParams.has('prompt'), false);
    for (const bad of [{ ...base, state: 'short' }, { ...base, clientId: 'x' }, { ...base, scope: '' }]) assert.equal(kids.oauthUrl(bad), null);
    assert.equal(kids.parentSwitchOutcome({ targetKey: DAD, beforeKey: MUM, afterSignedIn: true, afterKey: DAD }), 'SWITCHED');
    assert.equal(kids.parentSwitchOutcome({ targetKey: DAD, beforeKey: MUM, afterSignedIn: true, afterKey: MUM }), 'UNCHANGED');
    assert.equal(kids.parentSwitchOutcome({ targetKey: DAD, beforeKey: MUM, afterSignedIn: true, afterKey: parentKeyOf('x@example.com') }), 'OTHER_ACCOUNT');
    assert.equal(kids.parentSwitchOutcome({ targetKey: null, beforeKey: MUM, afterSignedIn: true, afterKey: DAD }), 'SWITCHED');
    assert.equal(kids.parentSwitchOutcome({ targetKey: DAD, afterSignedIn: false }), 'SIGNED_OUT');
});

test('the page roster names the parent with the app-scoped key; prepare keeps the page\'s own state list', async () => {
    const page = kidsPage();
    const result = await page.run(kids.pageRoster, 0);
    assert.equal(result.parent.parentKey, MUM);
    assert.equal(result.parent.email, 'parent@example.com', 'shown to the parent, never stored');
    assert.equal(result.rows.some(row => JSON.stringify(row).includes('@')), false);
    page.storage.set('yt.identity.kids::popup-xsrf', JSON.stringify({ data: JSON.stringify(['1', '2', '3', '4', '5', '6']), expiration: Date.now() + 1000, creation: 0 }));
    const prepared = await page.run(kids.pagePrepareParentSignIn);
    assert.equal(prepared.status, 'ready');
    assert.match(prepared.state, /^[0-9a-f]{32}$/);
    const list = JSON.parse(JSON.parse(page.storage.get('yt.identity.kids::popup-xsrf')).data);
    assert.deepEqual(list, ['2', '3', '4', '5', '6', prepared.state], 'at most six states, like the web');
    assert.equal(await page.run(kids.pageParentReturnStatus, prepared.state), 'pending');
    page.storage.set('yt.identity.kids::popup-xsrf', JSON.stringify({ data: '[]', expiration: Date.now() + 1000, creation: 0 }));
    page.storage.set('yt.identity.kids::versioninfo', 'opaque');
    assert.equal(await page.run(kids.pageParentReturnStatus, prepared.state), 'consumed_version');
    page.context.window.location.hostname = 'evil.example';
    assert.equal((await page.run(kids.pagePrepareParentSignIn)).status, 'untrusted_origin');
});

function parentFixture({ profilesV4, parents }) {
    const executed = [], updates = [], announced = [], listeners = [];
    let rosterCall = 0;
    const api = { runtime: { lastError: null, sendMessage: (message, done) => { announced.push(message); done?.(); } },
        scripting: { executeScript: (details, done) => {
            executed.push(details.func.name);
            const name = details.func.name;
            const result = name === 'pageRoster' ? { status: 'ok', signedIn: true, rows: [], parent: parents[Math.min(rosterCall++, parents.length - 1)] }
                : name === 'pagePrepareParentSignIn' ? { status: 'ready', clientId: 'kids-client.apps.example', scope: 'openid', state: 'b'.repeat(32) }
                    : name === 'pageParentReturnStatus' ? 'consumed_version' : name === 'pageClearSelection' ? 'cleared' : { status: 'persona_unavailable' };
            done([{ result }]);
        } },
        tabs: { query: (_q, done) => done([{ id: 7, url: 'https://www.youtubekids.com/' }]), get: (id, done) => done({ id, url: 'https://www.youtubekids.com/' }),
            update: (id, details, done) => { updates.push(details.url); done?.({ id }); }, reload: (_id, done) => done?.(),
            onUpdated: { addListener: fn => listeners.push(fn), removeListener: () => {} }, onRemoved: { addListener: () => {} } },
        storage: { onChanged: { addListener: () => {} } } };
    const box = {}; vm.createContext(box); box.globalThis = box;
    vm.runInContext(fs.readFileSync(new URL('../../js/kids_youtube_profiles_background.js', import.meta.url), 'utf8'), box);
    const instance = box.FilterTubeKidsYouTubeProfilesBackground.install({ api, contract: kids, readProfilesV4: async () => clone(profilesV4),
        isTrustedSender: () => true, isProfileAuthorized: async () => true, now: () => 1000 });
    return { instance, executed, updates, announced, fire: async url => { for (const fn of listeners) fn(7, { status: 'complete' }, { id: 7, url }); await new Promise(r => setTimeout(r, 20)); } };
}
const mum = { displayName: 'Mum', email: 'parent@example.com', parentKey: MUM };
const dad = { displayName: 'Dad', email: 'dad@example.com', parentKey: DAD };
const linkedToDad = tree({ activeProfileId: 'ana', kidsPersonaLinks: { links: [{ profileId: 'ana', personaKey: KEY_A, displayName: 'Ana', linkedAtMillis: 1, parentKey: DAD, parentName: 'Dad' }] } });

test('switching to a linked parent runs the sign-in, reloads, checks the outcome and never signs out', async () => {
    const f = parentFixture({ profilesV4: linkedToDad, parents: [mum, dad] });
    assert.deepEqual(clone(await f.instance.handle({ action: 'FilterTube_KidsParentSwitch', mode: 'change' }, dashboard)), { ok: false, error: 'child' });
    const started = clone(await f.instance.handle({ action: 'FilterTube_KidsParentSwitch', mode: 'apply_link' }, dashboard));
    assert.deepEqual(started, { ok: true, status: 'started' });
    const oauth = new URL(f.updates[0]);
    assert.equal(oauth.searchParams.get('pageId'), 'none');
    assert.equal(oauth.searchParams.get('prompt'), 'select_account', 'no e-mail is stored, so Google shows its chooser');
    await f.fire('https://accounts.google.com/o/oauth2/v2/auth?x=1');
    await f.fire('https://www.youtubekids.com/signin?gaia_popup_redirect=1&state=' + 'b'.repeat(32));
    assert.equal(f.updates.at(-1), 'https://www.youtubekids.com/');
    await f.fire('https://www.youtubekids.com/');
    assert.deepEqual(clone(f.announced), [{ action: 'FilterTube_KidsParentSwitchResult', outcome: 'SWITCHED', parentName: 'Dad' }]);
    assert.ok(f.executed.includes('pageClearSelection'), 'the old parent\'s kid selection is cleared');
    assert.equal(f.updates.some(url => /ClearOSID|Logout|signout/i.test(url)), false);
    const already = parentFixture({ profilesV4: linkedToDad, parents: [dad] });
    assert.deepEqual(clone(await already.instance.handle({ action: 'FilterTube_KidsParentSwitch', mode: 'apply_link' }, dashboard)), { ok: true, status: 'already_current' });
    const noParent = parentFixture({ profilesV4: tree(), parents: [mum] });
    assert.deepEqual(clone(await noParent.instance.handle({ action: 'FilterTube_KidsParentSwitch', mode: 'apply_link' }, dashboard)), { ok: false, error: 'no_parent_in_link' });
    const rejected = parentFixture({ profilesV4: tree(), parents: [mum] });
    await rejected.instance.handle({ action: 'FilterTube_KidsParentSwitch', mode: 'change' }, dashboard);
    await rejected.fire('https://www.youtubekids.com/signin/rejected');
    assert.equal(rejected.announced[0].outcome, 'REJECTED');
});
