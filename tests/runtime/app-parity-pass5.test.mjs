// Parity pass 5 with the Android app (docs/design/EXTENSION_ANDROID_PARITY_AUDIT_2026-11-16.md): the
// Study search explainer, the channel row's mapping line, a parent's update during a Self-Control
// session, "Skip this video" in a card's menu, an ask from a blocked channel page and Study's
// "Ask for time".
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');
const catalog = JSON.parse(fs.readFileSync('data/study/packs-v1.json', 'utf8'));

test('study search explainer: plan channels, two subjects and the first pack\'s example searches (StudySearchExplainer)', () => {
    const civil = Engine.searchExplainer({ activePackIds: ['in_gate'], packEdits: { in_gate: { variant: 'civil' } } }, catalog);
    assert.equal(civil.channels, 9);
    assert.deepEqual(civil.topics, ['fluid mechanics', 'structural analysis']);
    assert.deepEqual(civil.examples, ['cement', 'beam deflection']);
    const removed = Engine.searchExplainer({ activePackIds: ['in_gate'], packEdits: { in_gate: { variant: 'civil', channelsRemoved: [{ handle: catalog.packs.find(p => p.id === 'in_gate').channels[0].handle }] } } }, catalog);
    assert.ok(removed.channels <= civil.channels);
    assert.deepEqual(Engine.searchExplainer({ activePackIds: [] }, catalog), { channels: 0, topics: [], examples: [] });
});

function loadStudyUi() {
    const make = tag => ({
        tag, className: '', style: {}, children: [], attributes: {}, textContent: '', hidden: false, dataset: {}, handlers: {},
        classList: { toggle() {}, add() {}, remove() {} },
        setAttribute(key, value) { this.attributes[key] = value; },
        appendChild(child) { this.children.push(child); return child; },
        append(...nodes) { nodes.forEach(node => this.children.push(node)); },
        replaceChildren(...nodes) { this.children = nodes; },
        addEventListener(type, fn) { this.handlers[type] = fn; },
        querySelectorAll() { return []; }, querySelector() { return null; }, closest() { return null; }, remove() {}
    });
    const context = {
        document: { createElement: make, createElementNS: (_ns, tag) => make(tag), readyState: 'complete', getElementById: () => null },
        navigator: { language: 'en' }, setTimeout: () => 0, clearTimeout: () => {}, Date, Math, JSON, Promise, Intl, Number, String, Array, Object,
        chrome: { runtime: { lastError: null, getURL: path => path, sendMessage(message, cb) { cb?.({ ok: true }); } }, storage: { local: { get: (keys, cb) => cb({}) } } }
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('js/shared/study_engine.js', 'utf8'), context);
    vm.runInContext(fs.readFileSync('js/study_ui.js', 'utf8'), context);
    return context.FilterTubeStudyUi;
}

test('study search explainer card: the app\'s words, and "Ask a parent for more." only for a child', () => {
    const Ui = loadStudyUi();
    const study = { activePackIds: ['in_gate'], packEdits: { in_gate: { variant: 'civil' } } };
    const words = card => card.children.map(child => child.textContent).join(' | ');
    const self = Ui.searchExplainerCard(study, catalog, false);
    assert.equal(words(self), 'How search works while studying | While you study, search shows lessons from your 9 channels and your topics (Fluid mechanics, Structural analysis…). Anything else waits until study ends. Try “cement” or “beam deflection”.');
    assert.match(words(Ui.searchExplainerCard(study, catalog, true)), /Ask a parent for more\.$/);
    assert.equal(Ui.searchExplainerCard({ activePackIds: [] }, catalog, false), null);
    assert.doesNotMatch(words(self), /YouTube/);
});

function fakeNode(tag, className = '') {
    const node = {
        tagName: tag.toUpperCase(), className, children: [], attributes: {}, style: {}, handlers: {}, parentNode: null, textContent: '',
        classList: { contains: name => node.className.split(/\s+/).includes(name) },
        get firstElementChild() { return node.children[0] || null; },
        get nextSibling() { const list = node.parentNode?.children || []; return list[list.indexOf(node) + 1] || null; },
        setAttribute(key, value) { node.attributes[key] = String(value); },
        getAttribute(key) { return key in node.attributes ? node.attributes[key] : null; },
        appendChild(child) { child.parentNode = node; node.children.push(child); return child; },
        append(...nodes) { nodes.forEach(child => node.appendChild(child)); },
        insertBefore(child, before) {
            child.parentNode = node;
            const index = before ? node.children.indexOf(before) : -1;
            if (index < 0) node.children.push(child); else node.children.splice(index, 0, child);
            return child;
        },
        remove() { if (node.parentNode) node.parentNode.children.splice(node.parentNode.children.indexOf(node), 1); },
        addEventListener(type, fn) { node.handlers[type] = fn; },
        querySelectorAll(selector) {
            const name = selector.replace(/^\./, '');
            const out = [];
            const walk = current => current.children.forEach(child => { if (child.classList?.contains(name)) out.push(child); walk(child); });
            walk(node);
            return out;
        }
    };
    return node;
}

function loadSkipMenu(settings, response = { ok: true }) {
    const source = fs.readFileSync('js/content_bridge.js', 'utf8');
    const start = source.indexOf('function injectStudySkipMenuItem');
    const body = source.slice(start, source.indexOf('\n}\n', start) + 3);
    const sent = [];
    const closed = [];
    const context = {
        currentSettings: settings, sent, closed,
        document: { createElement: tag => fakeNode(tag) },
        createFilterTubeIconElement: () => fakeNode('svg'),
        filterTubeContentMenuText: (key, fallback) => fallback,
        extractVideoIdFromCard: card => card?.videoId || '',
        forceCloseDropdown: dropdown => closed.push(dropdown),
        browserAPI_BRIDGE: { runtime: { sendMessage: async message => { sent.push(message); return response; } } }
    };
    vm.createContext(context);
    vm.runInContext(`${body}\nthis.injectStudySkipMenuItem = injectStudySkipMenuItem;`, context);
    return context;
}

function menuWithFilterTubeEntry() {
    const dropdown = fakeNode('tp-yt-iron-dropdown');
    const list = dropdown.appendChild(fakeNode('yt-list-view-model'));
    const entry = list.appendChild(fakeNode('yt-list-item-view-model', 'yt-list-item-view-model filtertube-block-channel-item'));
    entry.appendChild(fakeNode('div', 'yt-list-item-view-model__container filtertube-menu-item'));
    list.appendChild(fakeNode('yt-list-item-view-model', 'site-item'));
    return { dropdown, list };
}

test('card menu: "Skip this video" sits under the FilterTube entry only while a study round runs', async () => {
    const card = { videoId: 'abcdEFGH123', style: {}, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; }, getAttribute() { return null; } };
    const off = loadSkipMenu({ study: { state: 'BREAK' } });
    const quiet = menuWithFilterTubeEntry();
    off.injectStudySkipMenuItem(quiet.dropdown, card, {});
    assert.equal(quiet.list.children.length, 2);

    const on = loadSkipMenu({ study: { state: 'STUDY' } });
    const { dropdown, list } = menuWithFilterTubeEntry();
    on.injectStudySkipMenuItem(dropdown, card, {});
    on.injectStudySkipMenuItem(dropdown, card, {});
    assert.equal(list.children.length, 3, 'one skip entry, however often the menu redraws');
    const skip = list.children[1];
    assert.ok(skip.classList.contains('filtertube-study-skip-item'));
    assert.ok(skip.classList.contains('filtertube-block-channel-item'), 'cleared with the other FilterTube entries');
    assert.equal(skip.children[0].children[1].textContent, 'Skip this video');
    await skip.handlers.click({ preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} });
    assert.deepEqual(JSON.parse(JSON.stringify(on.sent)), [{ action: 'FilterTube_StudySkipVideo', videoId: 'abcdEFGH123' }]);
    assert.equal(card.style.display, 'none');
    assert.equal(on.closed.length, 1);
});

// ---- Ask for time (Android StudyFamily.kt / StudyFamilyService) --------------------------------------

const Ask = require('../../js/shared/ask_parent.js');
const { createAskParentService, verifyEd25519, signEd25519 } = require('../../js/ask_parent_background.js');
const subtle = globalThis.crypto.subtle;
async function familyKeys() {
    const pair = await subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
    return { privateKeyJwk: await subtle.exportKey('jwk', pair.privateKey), publicKeyJwk: await subtle.exportKey('jwk', pair.publicKey), managedPublicKeyId: 'managed-1' };
}
const parentKeys = await familyKeys();
const otherKeys = await familyKeys();
const START = Date.UTC(2026, 10, 16, 15, 0, 0);

const childSideLink = () => ({
    linkId: 'link-mum', remoteDeviceId: 'android-parent', deviceLabel: "Mum's phone", localRole: 'replica', remoteRole: 'source',
    linkType: 'managed_link', sourceProfileId: 'mum', sourcePublicKeyJwk: parentKeys.publicKeyJwk,
    policy: { linkType: 'managed_link', targetProfileId: 'aarav', targetProfileName: 'Aarav', sourceProfileId: 'mum' }
});
const parentSideLink = () => ({ ...childSideLink(), linkId: 'link-aarav', remoteDeviceId: 'android-child', deviceLabel: "Aarav's tablet",
    localRole: 'source', remoteRole: 'replica' });

function harness({ links = [childSideLink()], active = 'aarav', fresh = true } = {}) {
    const clock = { now: START };
    const storage = {
        ftNanahTrustedLinks: links,
        ftNanahManagedSigningKeyPair: parentKeys,
        ftProfilesV4: { schemaVersion: 4, activeProfileId: active, profiles: {
            default: { name: 'Default', type: 'account' }, mum: { name: 'Mum', type: 'account' },
            aarav: { name: 'Aarav', type: 'child', parentProfileId: 'mum' }
        } }
    };
    const grants = [];
    const unlock = { fresh };
    const service = createAskParentService({
        Ask, now: () => clock.now, verify: verifyEd25519, parentUnlockFresh: async () => unlock.fresh,
        writeChannelRule: async () => ({ ok: true }),
        addGrant: async grant => { grants.push(grant); return { ok: true, grant }; },
        studyReport: async () => ({ dayMinutes: { '2026-11-16': 50 }, lockEndsAt: null }),
        browserAPI: { storage: { local: {
            get(keys, cb) { const out = {}; for (const key of [].concat(keys)) if (key in storage) out[key] = structuredClone(storage[key]); cb(out); },
            set(items, cb) { Object.assign(storage, structuredClone(items)); cb?.(); }
        } } }
    });
    return { service, storage, clock, grants, unlock, as: id => { storage.ftProfilesV4.activeProfileId = id; } };
}

test('time requests: 10, 20 or 30 minutes, one waiting at a time, 30 minutes to answer, never granted by themselves (StudyRequests)', () => {
    const made = Ask.createTimeRequest([], 'aarav', 20, '  finishing\nthe lecture ', START, 'ask-00000001');
    assert.equal(made.type, 'created');
    assert.equal(made.request.reason, 'finishing the lecture');
    assert.equal(made.request.expiresAt - START, 30 * 60 * 1000);
    assert.equal(Ask.createTimeRequest(made.list, 'aarav', 10, '', START + 1000, 'ask-00000002').type, 'already_waiting');
    assert.equal(Ask.createTimeRequest([], 'aarav', 15, '', START, 'ask-00000003').type, 'invalid_minutes');
    const later = START + 31 * 60 * 1000;
    assert.equal(Ask.normalizeTimeRequests(made.list, later)[0].status, 'expired', 'a waiting request only ever runs out');
    assert.equal(Ask.decideTimeRequest(made.list, made.request.id, true, later, 'mum').type, 'not_pending');
    const merged = Ask.mergeTimeRequests([{ ...made.request, status: 'granted', decidedAt: START + 5 }], made.list, START + 10);
    assert.equal(merged[0].status, 'granted', 'a decision always beats pending');
});

test('grants: running window, a second grant starts when the first ends (StudyGrants.add)', () => {
    const first = { id: 'give-00000001', profileId: 'aarav', minutes: 20, startsAt: START, source: 'parent_here' };
    const list = Ask.addGrant([], first, START);
    assert.equal(Ask.addGrant(list, first, START), null, 'once by id');
    const both = Ask.addGrant(list, { ...first, id: 'give-00000002', minutes: 10, startsAt: START + 60000 }, START + 60000);
    assert.equal(both[1].startsAt, START + 20 * 60000);
    assert.equal(Ask.activeGrant(both, 'aarav', START + 25 * 60000).id, 'give-00000002');
    assert.equal(Ask.activeGrant(both, 'aarav', START + 31 * 60000), null);
    assert.equal(Ask.grantFrom({ ...first, minutes: 61 }), null, 'at most an hour');
});

test('Ask for time on this device: the child asks, only its parent with a fresh PIN gives, and the minutes go to Study', async () => {
    const h = harness({ links: [] });
    assert.equal((await h.service.askTime({ minutes: 20, reason: 'lecture' })).type, 'created');
    const state = await h.service.timeState();
    assert.equal(state.latest.status, 'pending');
    assert.equal(state.parentName, 'Mum');
    assert.equal((await h.service.answerTime({ requestId: state.latest.id, grant: true })).type, 'not_allowed', 'never the child itself');
    h.as('mum');
    h.unlock.fresh = false;
    assert.equal((await h.service.answerTime({ requestId: state.latest.id, grant: true })).type, 'parent_unlock_required');
    h.unlock.fresh = true;
    const inbox = await h.service.inbox();
    assert.equal(inbox.timeHere.length, 1);
    assert.equal(await h.service.openRequestCount(), 1);
    const given = await h.service.answerTime({ requestId: state.latest.id, grant: true });
    assert.equal(given.ok, true);
    assert.equal(h.grants.length, 1);
    assert.deepEqual([h.grants[0].profileId, h.grants[0].minutes, h.grants[0].source, h.grants[0].parentProfileId], ['aarav', 20, 'parent_here', 'mum']);
    assert.equal(await h.service.openRequestCount(), 0);
    h.as('aarav');
    assert.equal((await h.service.timeState()).latest.status, 'granted');
});

test('Ask for time across devices: the report carries the request, the parent signs a filtertube.study.grant.v1 the child checks', async () => {
    const child = harness();
    await child.service.askTime({ minutes: 30, reason: 'exam tomorrow' });
    const built = await child.service.outbox({ deviceId: 'android-parent', capabilities: ['filtertube.study.v1'] });
    const report = built.message.reports[0];
    assert.equal(report.type, 'filtertube.study.report.v1');
    assert.equal(report.childProfileId, 'aarav');
    assert.equal(report.weekStart, Ask.weekStart(START));
    assert.deepEqual(report.channels, []);
    assert.equal(report.requests[0].minutes, 30);

    const parent = harness({ links: [parentSideLink()], active: 'mum' });
    const received = await parent.service.receive('android-child', built.message);
    assert.equal(received.fresh, 1);
    const inbox = await parent.service.inbox();
    assert.equal(inbox.timeRemote.length, 1);
    assert.equal(inbox.timeRemote[0].childName, 'Aarav');
    const answer = await parent.service.answerTime({ requestId: inbox.timeRemote[0].id, linkId: 'link-aarav', grant: true });
    assert.equal(answer.sendsLater, true);
    assert.equal((await parent.service.inbox()).timeRemote.length, 0, 'answered, waiting to send');
    const out = await parent.service.outbox({ deviceId: 'android-child', capabilities: ['filtertube.study.v1'] });
    const signed = out.message.signed[0];
    const body = JSON.parse(signed.payload);
    assert.deepEqual(Object.keys(body), ['childProfileId', 'issuedAt', 'minutes', 'nonce', 'parentProfileId', 'requestId', 'type'], 'sorted keys, the apps\' canonical form');
    assert.equal(body.type, 'filtertube.study.grant.v1');
    assert.equal(body.minutes, 30);

    const applied = await child.service.receive('android-parent', { signed: [signed] });
    assert.equal(applied.granted, 1);
    assert.equal(child.grants[0].source, 'signed');
    assert.equal(child.grants[0].minutes, 30);
    assert.equal((await child.service.timeState()).latest.status, 'granted');
    const replay = await child.service.receive('android-parent', { signed: [signed] });
    assert.equal(replay.granted, 0, 'a nonce works once');

    const forged = { ...signed, signature: await signEd25519(signed.payload, otherKeys) };
    const forgedResult = await child.service.applyGrantSigned('android-parent', { ...forged, payload: signed.payload.replace(body.nonce, 'n-forged000000000000') });
    assert.equal(forgedResult.ok, false);
    assert.equal(forgedResult.reason, 'bad_signature');
});

test('the study clock: a running grant means normal rules, on both clocks, until it ends (StudyRuntime.clockState)', async () => {
    const { createStudyBackground } = require('../../js/study_background.js');
    const Model = require('../../js/shared/study_model.js');
    const storage = {
        ftProfilesV4: { schemaVersion: 4, activeProfileId: 'aarav', profiles: { aarav: { type: 'child', parentProfileId: 'mum',
            study: Model.normalizeStudy({ activePackIds: ['in_gate'], plan: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], start: '00:00', end: '23:59', setByParentId: 'mum' } }) } } }
    };
    const clock = { now: START };
    const background = createStudyBackground({
        Engine, Model, Ask, Packs: { load: async () => catalog }, loadCatalog: async () => catalog, now: () => clock.now,
        writeProfile: async () => ({ ok: true }), onTransition: async () => {}, zoneId: () => 'UTC',
        browserAPI: { storage: { local: {
            get(keys, cb) { const out = {}; for (const key of [].concat(keys)) if (key in storage) out[key] = structuredClone(storage[key]); cb(out); },
            set(items, cb) { Object.assign(storage, structuredClone(items)); cb?.(); }
        } } }
    });
    assert.equal((await background.getState()).state, 'STUDY');
    await background.addGrant({ id: 'give-00000001', profileId: 'aarav', minutes: 20, startsAt: START, source: 'parent_here', parentProfileId: 'mum' });
    const given = await background.getState();
    assert.equal(given.state, 'NORMAL');
    assert.equal(given.grantUntil, START + 20 * 60000);
    assert.equal(given.grantMinutes, 20);
    clock.now = START + 21 * 60000;
    assert.equal((await background.getState()).state, 'STUDY');
});

test('a blocked channel page asks for the channel: the target is the UC id, else the @handle; a child gets the card, not a redirect', () => {
    const source = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
    const start = source.indexOf('function blockedChannelAskId');
    const context = {};
    vm.createContext(context);
    vm.runInContext(`${source.slice(start, source.indexOf('\n}\n', start) + 3)}\nthis.f = blockedChannelAskId;`, context);
    assert.equal(context.f({ id: 'UCsciencekids0000000001x', handle: '@sci' }), 'UCsciencekids0000000001x');
    assert.equal(context.f({ id: '', handle: 'sciencekids' }), '@sciencekids');
    assert.equal(context.f({}), '');
    const enforce = source.slice(source.indexOf('function enforceCurrentChannelPageDirectAccess'), source.indexOf('function enforceCurrentWatchOwnerBlock'));
    assert.ok(enforce.indexOf('showBlockedChannelPage(') < enforce.indexOf("document.location.replace('/')"), 'the child\'s card comes before the redirect');
    assert.match(enforce, /settings\?\.askParentChild === true/);
    const overlay = fs.readFileSync('js/content/admission_overlay.js', 'utf8');
    assert.match(overlay, /askParent\.titleChannel/);
    assert.match(overlay, /target\?\.kind === 'channel'/);
    const background = fs.readFileSync('js/background.js', 'utf8');
    assert.match(background, /compiledSettings\.askParentChild = activeProfileKind === 'child'/);
    // "Always allow this channel" from a handle-only ask writes the handle, not a fake id.
    assert.match(background, /const row = \{ id: handle \? '' : id, name: .*handle, filterAll: false, source: 'ask_parent'/);
    // Alerts without the notifications permission: the toolbar badge.
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    assert.equal(manifest.permissions.includes('notifications'), false);
    assert.match(background, /setBadgeText\(\{ text \}\)/);
});
