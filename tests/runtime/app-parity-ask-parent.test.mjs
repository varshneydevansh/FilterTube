// Ask a parent, ported from the Android app's AskParentTest: the request model and its limits, who
// may answer, signed answers from a parent's device (the same filtertube.ask.v1 body and Ed25519
// Family key), passes ("Allow once"), and the study_family message both apps exchange.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Ask = require('../../js/shared/ask_parent.js');
const { createAskParentService, verifyEd25519, signEd25519 } = require('../../js/ask_parent_background.js');

const subtle = globalThis.crypto.subtle;
async function familyKeys() {
    const pair = await subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
    return { privateKeyJwk: await subtle.exportKey('jwk', pair.privateKey), publicKeyJwk: await subtle.exportKey('jwk', pair.publicKey), managedPublicKeyId: 'managed-1' };
}
const parentKeys = await familyKeys();
const otherKeys = await familyKeys();
const sign = async (payload, keys = parentKeys) => ({ payload, signature: await signEd25519(payload, keys), keyId: 'managed-1' });

const START = Date.UTC(2026, 10, 16, 15, 0, 0);
const video = Ask.videoTarget('abcdEFGH123', 'Volcano facts', 'UCsciencekids01', 'Science Kids', Ask.BLOCKED_CHANNEL);
const other = Ask.videoTarget('zyxwVUTS987', 'Lava lamps', null, '', Ask.BLOCKED_OTHER);

const childSideLink = () => ({
    linkId: 'link-mum', remoteDeviceId: 'android-parent', deviceLabel: "Mum's phone", localRole: 'replica', remoteRole: 'source',
    linkType: 'managed_link', sourceProfileId: 'mum', sourcePublicKeyJwk: parentKeys.publicKeyJwk,
    policy: { linkType: 'managed_link', targetProfileId: 'aarav', targetProfileName: 'Aarav', sourceProfileId: 'mum' }
});
const parentSideLink = () => ({ ...childSideLink(), linkId: 'link-aarav', remoteDeviceId: 'android-child', deviceLabel: "Aarav's tablet",
    localRole: 'source', remoteRole: 'replica', localPolicyProfileId: 'aarav-rules' });

function harness({ links = [childSideLink()], active = 'aarav', fresh = true, store = {} } = {}) {
    const clock = { now: START };
    const storage = {
        ftNanahTrustedLinks: links,
        ftNanahManagedSigningKeyPair: parentKeys,
        ftProfilesV4: { schemaVersion: 4, activeProfileId: active, profiles: {
            default: { name: 'Default', type: 'account' },
            mum: { name: 'Mum', type: 'account' },
            dad: { name: 'Dad', type: 'account' },
            aarav: { name: 'Aarav', type: 'child', parentProfileId: 'mum' },
            mira: { name: 'Mira', type: 'child', parentProfileId: 'mum' }
        } },
        ...store
    };
    const writes = [];
    const unlock = { fresh };
    const service = createAskParentService({
        Ask, now: () => clock.now, verify: verifyEd25519,
        parentUnlockFresh: async () => unlock.fresh,
        writeChannelRule: async args => { writes.push(args); return { ok: true }; },
        browserAPI: { storage: { local: {
            get(keys, cb) { const out = {}; for (const key of [].concat(keys)) if (key in storage) out[key] = structuredClone(storage[key]); cb(out); },
            set(items, cb) { Object.assign(storage, structuredClone(items)); cb?.(); }
        } } }
    });
    return { service, storage, clock, writes, unlock, as: id => { storage.ftProfilesV4.activeProfileId = id; } };
}

async function askOrFail(h, target = video, reason = 'school', note = 'For class') {
    const result = await h.service.ask({ target, reason, note });
    assert.equal(result.type, 'created', JSON.stringify(result));
    return result.ask;
}
const answer = (askId, decision, { nonce = Ask.randomId('n'), issuedAt, parent = 'mum', child = 'aarav' } = {}, now = START) =>
    Ask.answerPayload(child, parent, askId, decision, 'Have fun', 'Mum', issuedAt ?? now, nonce);

// ---- The request model -----------------------------------------------------------------------

test('an ask keeps the child\'s words tidy', async () => {
    const h = harness();
    const ask = await askOrFail(h, video, 'school', '  please\n\nit\'s   for   science  ' + 'x'.repeat(200));
    assert.equal(Array.from(ask.note).length, Ask.NOTE_MAX);
    assert.ok(ask.note.startsWith('please it\'s for science'));
    assert.equal(ask.status, 'open');
    assert.equal(ask.expiresAt, START + Ask.TTL_MS);
    assert.deepEqual(Ask.toJson(Ask.fromJson(ask)), ask);
});

test('invalid targets and unknown reasons are refused or dropped', async () => {
    const h = harness();
    assert.equal((await h.service.ask({ target: Ask.videoTarget('../etc', 'x', null, '', 'other') })).type, 'invalid');
    assert.equal((await h.service.ask({ target: { ...video, title: '   ' } })).type, 'invalid');
    assert.equal((await askOrFail(h, video, 'bribe')).reason, '');
});

test('what crosses to the parent carries no decision', async () => {
    const h = harness();
    const ask = await askOrFail(h);
    const wire = Ask.wireJson({ ...Ask.fromJson(ask), status: 'allowed', decision: 'once', decidedAt: START });
    assert.equal(wire.status, 'open');
    assert.equal('decision' in wire, false);
    assert.equal('decidedAt' in wire, false);
});

test('limits: one open ask per thing, three open, a gap, five an hour, an hour after Not now', async () => {
    let h = harness();
    const first = await askOrFail(h);
    h.clock.now += 5 * 60 * 1000;
    const again = await h.service.ask({ target: video });
    assert.equal(again.type, 'already_open');
    assert.equal(again.ask.id, first.id);

    h = harness();
    for (const id of ['aaaaaaaaaa1', 'aaaaaaaaaa2', 'aaaaaaaaaa3']) { await askOrFail(h, { ...other, videoId: id }); h.clock.now += 2 * 60 * 1000; }
    assert.equal((await h.service.ask({ target: { ...other, videoId: 'aaaaaaaaaa4' } })).type, 'too_many');
    h.as('mira');
    assert.equal((await h.service.ask({ target: { ...other, videoId: 'aaaaaaaaaa4' } })).type, 'created', 'another child has their own allowance');

    h = harness();
    await askOrFail(h, { ...other, videoId: 'bbbbbbbbbb1' });
    h.clock.now += 10 * 1000;
    const quick = await h.service.ask({ target: { ...other, videoId: 'bbbbbbbbbb2' } });
    assert.deepEqual([quick.type, quick.at], ['wait', START + Ask.MIN_GAP_MS]);

    h = harness();
    for (let i = 0; i < Ask.MAX_PER_HOUR; i += 1) { await h.service.cancel((await askOrFail(h, { ...other, videoId: `cccccccccc${i}` })).id); h.clock.now += 2 * 60 * 1000; }
    const sixth = await h.service.ask({ target: { ...other, videoId: 'cccccccccc9' } });
    assert.deepEqual([sixth.type, sixth.at], ['wait', START + 60 * 60 * 1000]);

    h = harness({ links: [] });
    const asked = await askOrFail(h);
    h.as('mum');
    assert.equal((await h.service.answer({ askId: asked.id, decision: 'no', reply: 'Not tonight' })).ok, true);
    h.as('aarav');
    h.clock.now += 10 * 60 * 1000;
    assert.equal((await h.service.ask({ target: video })).type, 'recently_declined');
    h.clock.now += Ask.AFTER_NO_MS;
    assert.equal((await h.service.ask({ target: video })).type, 'created');
});

test('a parent can turn asking off, and only a parent', async () => {
    const h = harness({ links: [] });
    assert.equal((await h.service.setAsking({ childId: 'aarav', on: false })).ok, false, 'the child itself');
    const open = await askOrFail(h);
    h.as('mum');
    assert.equal((await h.service.setAsking({ childId: 'aarav', on: false })).ok, true);
    assert.equal((await h.service.inbox()).here.some(item => item.id === open.id), false, 'its open asks end');
    h.as('aarav');
    assert.equal((await h.service.ask({ target: other })).type, 'asking_off');
    assert.equal((await h.service.stateFor()).canAsk, false);
    h.as('mum');
    await h.service.setAsking({ childId: 'aarav', on: true });
    h.as('aarav');
    h.clock.now += Ask.MIN_GAP_MS;
    assert.equal((await h.service.ask({ target: other })).type, 'created');
});

test('asks expire and are never answered by time; passes run out', async () => {
    let h = harness({ links: [] });
    const ask = await askOrFail(h);
    h.clock.now += Ask.TTL_MS;
    const stored = Ask.normalize(h.storage.ftAskParentV1.asks, h.clock.now)[0];
    assert.equal(stored.status, 'expired');
    assert.equal(stored.decision, null);
    h.as('mum');
    assert.equal((await h.service.answer({ askId: ask.id, decision: 'once' })).ok, false);
    assert.deepEqual(await h.service.passVideoIds('aarav'), []);

    h = harness({ links: [] });
    const fresh = await askOrFail(h);
    h.as('mum');
    await h.service.answer({ askId: fresh.id, decision: 'once' });
    assert.deepEqual(await h.service.passVideoIds('aarav'), [video.videoId]);
    assert.deepEqual(await h.service.passVideoIds('mira'), []);
    h.clock.now += Ask.PASS_MS;
    assert.deepEqual(await h.service.passVideoIds('aarav'), []);
});

test('an ask alone changes nothing, not even a forged "allowed" copy arriving on the parent\'s device', async () => {
    const h = harness();
    const ask = await askOrFail(h);
    h.clock.now += 60 * 1000;
    assert.deepEqual(await h.service.passVideoIds('aarav'), []);
    assert.deepEqual((await h.service.stateFor()).unseen, []);
    const parent = harness({ links: [parentSideLink()], active: 'mum' });
    const incoming = { ...ask, status: 'allowed', decision: 'once', reply: 'yes' };
    assert.equal(await parent.service.receiveAsks('android-child', [incoming]), 0, 'only open asks are received');
    assert.equal(await parent.service.receiveAsks('android-child', [{ ...ask, decision: 'once', reply: 'yes' }]), 1);
    const stored = (await parent.service.inbox()).remote[0];
    assert.equal(stored.decision, undefined);
    assert.equal(stored.reply, undefined);
    assert.equal(await parent.service.receiveAsks('android-child', [{ ...ask, id: 'pa-incoming-2', childProfileId: 'mira' }]), 0);
    assert.equal(await parent.service.receiveAsks('stranger', [{ ...ask, id: 'pa-incoming-3' }]), 0);
});

test('on this device only the child\'s parent with a fresh unlock can answer; the master profile can too', async () => {
    const h = harness({ links: [], fresh: false });
    const ask = await askOrFail(h);
    for (const who of ['aarav', 'mira', 'dad']) {
        h.as(who);
        assert.equal((await h.service.answer({ askId: ask.id, decision: 'once' })).ok, false, who);
    }
    h.as('mum');
    const locked = await h.service.answer({ askId: ask.id, decision: 'once' });
    assert.deepEqual([locked.ok, locked.type], [false, 'parent_unlock_required']);
    assert.deepEqual(await h.service.passVideoIds('aarav'), []);
    h.unlock.fresh = true;
    const decided = await h.service.answer({ askId: ask.id, decision: 'once' });
    assert.equal(decided.ok, true);
    assert.equal(decided.ask.parentName, 'Mum');
    assert.deepEqual(await h.service.passVideoIds('aarav'), [video.videoId]);
    h.as('aarav');
    assert.equal((await h.service.stateFor()).unseen.length, 1);
    assert.equal(Ask.canDecide({ id: 'default', type: 'account' }, { id: 'mira', type: 'child', parentProfileId: 'mum' }, false, false), true);
    assert.equal(Ask.canDecide({ id: 'default', type: 'account' }, { id: 'mira', type: 'child', parentProfileId: 'mum' }, true, false), false);
});

test('"Not now" gives no pass and carries the reply; "Always allow this channel" writes the parent\'s rule first', async () => {
    const h = harness({ links: [] });
    const ask = await askOrFail(h);
    h.as('mum');
    const no = await h.service.answer({ askId: ask.id, decision: 'no', reply: "Let's watch it together on Saturday" });
    assert.equal(no.ask.reply, "Let's watch it together on Saturday");
    assert.deepEqual(await h.service.passVideoIds('aarav'), []);
    h.as('aarav');
    h.clock.now += Ask.AFTER_NO_MS;
    const second = await askOrFail(h);
    h.as('mum');
    assert.equal((await h.service.answer({ askId: second.id, decision: 'channel' })).ok, true);
    assert.deepEqual(h.writes, [{ parentId: 'mum', childId: 'aarav', channelId: 'UCsciencekids01', channelName: 'Science Kids' }]);
    assert.deepEqual(await h.service.passVideoIds('aarav'), [video.videoId], 'the asked video plays now too');
});

test('a signed answer from the child\'s parent is applied; anything else is refused', async () => {
    const h = harness();
    const ask = await askOrFail(h);
    const refused = async (message, device = 'android-parent') => (await h.service.applySigned(device, message)).reason;
    assert.equal(await refused(await sign(answer(ask.id, 'once'), otherKeys)), 'bad_signature');
    assert.equal(await refused(await sign(answer(ask.id, 'once')), 'android-stranger'), 'no_link');
    assert.equal(await refused(await sign(answer(ask.id, 'once', { parent: 'dad' }))), 'not_this_parent');
    assert.equal(await refused(await sign(answer(ask.id, 'once', { child: 'mira' }))), 'no_link');
    assert.equal(await refused(await sign(answer('pa-made-up-id', 'once'))), 'unknown_ask');
    assert.equal(await refused(await sign(answer(ask.id, 'once', { issuedAt: START - 3 * 60 * 60 * 1000 }))), 'stale');
    const tamperedSource = await sign(answer(ask.id, 'no'));
    assert.equal(await refused({ ...tamperedSource, payload: tamperedSource.payload.replace('"no"', '"once"') }), 'bad_signature');
    assert.deepEqual(await h.service.passVideoIds('aarav'), []);
    const good = await sign(answer(ask.id, 'once', { nonce: 'n-replay-0001' }));
    const applied = await h.service.applySigned('android-parent', good);
    assert.equal(applied.type, 'answered');
    assert.deepEqual(await h.service.passVideoIds('aarav'), [video.videoId]);
    assert.equal((await h.service.stateFor()).unseen[0].reply, 'Have fun');
    assert.equal(await refused(good), 'replayed');
});

test('a signed answer for an expired ask is refused; a signed asking switch applies newest first', async () => {
    let h = harness();
    const ask = await askOrFail(h);
    h.clock.now += Ask.TTL_MS + 1;
    assert.equal((await h.service.applySigned('android-parent', await sign(answer(ask.id, 'once', {}, h.clock.now)))).reason, 'not_open');

    h = harness();
    const off = await sign(Ask.askingPayload('aarav', 'mum', false, START, Ask.randomId('n')));
    const olderOn = await sign(Ask.askingPayload('aarav', 'mum', true, START - 60 * 1000, Ask.randomId('n')));
    assert.equal((await h.service.applySigned('android-parent', off)).type, 'asking');
    await h.service.applySigned('android-parent', olderOn);
    assert.equal((await h.service.ask({ target: video })).type, 'asking_off');
});

test('end to end over study_family: the child\'s ask reaches the parent, the signed answer unlocks the video', async () => {
    const child = harness();
    const ask = await askOrFail(child);
    assert.equal(await child.service.outbox({ deviceId: 'android-parent', capabilities: [] }), null, 'never to a device without filtertube.study.v1');
    const fromChild = await child.service.outbox({ deviceId: 'android-parent', capabilities: ['filtertube.study.v1'] });
    assert.equal(fromChild.message.t, 'study_family');
    // The child's study report rides along (Android StudyFamilyService.reportsFor): totals and time requests only.
    assert.deepEqual(fromChild.message.reports.map(report => [report.type, report.childProfileId, report.requests.length]), [['filtertube.study.report.v1', 'aarav', 0]]);
    assert.equal(fromChild.message.asks.length, 1);
    assert.equal(await child.service.outbox({ deviceId: 'android-stranger', capabilities: ['filtertube.study.v1'] }), null);

    const parent = harness({ links: [parentSideLink()], active: 'mum', fresh: false });
    assert.equal((await parent.service.receive('android-child', fromChild.message)).fresh, 1);
    const card = (await parent.service.inbox()).remote[0];
    assert.equal(card.title, 'Volcano facts');
    assert.equal((await parent.service.answer({ linkId: card.linkId, askId: card.id, decision: 'once' })).type, 'parent_unlock_required');
    parent.unlock.fresh = true;
    assert.equal((await parent.service.answer({ linkId: card.linkId, askId: card.id, decision: 'channel', reply: 'Enjoy' })).sendsLater, true);
    assert.deepEqual((await parent.service.inbox()).remote, []);
    const fromParent = await parent.service.outbox({ deviceId: 'android-child', capabilities: ['filtertube.study.v1'] });
    assert.equal(fromParent.message.signed.length, 1);
    assert.equal(Ask.parseAnswer(fromParent.message.signed[0].payload).reply, 'Enjoy');
    await parent.service.markSent(fromParent.sentByLink);
    assert.equal(await parent.service.outbox({ deviceId: 'android-child', capabilities: ['filtertube.study.v1'] }), null, 'sent once');

    child.clock.now += 30 * 60 * 1000;
    assert.deepEqual(await child.service.passVideoIds('aarav'), []);
    assert.equal((await child.service.receive('android-parent', fromParent.message)).answered, 1);
    assert.deepEqual(await child.service.passVideoIds('aarav'), [video.videoId]);
    assert.equal((await child.service.stateFor()).unseen[0].decision, 'channel');
});

test('signed bodies are canonical JSON, the app\'s filtertube.ask.v1, and told apart from Study bodies', () => {
    const payload = answer('pa-x-000001', 'no');
    assert.equal(payload, JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(payload)).sort(([a], [b]) => a.localeCompare(b)))));
    assert.equal(Ask.isAskPayload(payload), true);
    assert.equal(Ask.isAskPayload('{"type":"filtertube.study.grant.v1"}'), false);
});

test('delivery: this device first, then the parent\'s device; only usable links count', async () => {
    assert.deepEqual(Ask.routes(true, 1), ['same_device', 'relay']);
    assert.deepEqual(Ask.routes(false, 1), ['relay']);
    assert.deepEqual(Ask.routes(false, 0), ['none']);
    const h = harness({ links: [{ ...childSideLink(), revoked: true }] });
    h.storage.ftProfilesV4.profiles.mum.type = 'child';
    h.storage.ftProfilesV4.profiles.default.type = 'child';
    h.storage.ftProfilesV4.profiles.dad.type = 'child';
    const state = await h.service.stateFor();
    assert.equal(state.route, 'none');
    assert.equal(state.canAsk, false);
});

test('the extension wires Ask a parent into the background, the filters, the page and Nanah', () => {
    const background = fs.readFileSync('js/background.js', 'utf8');
    assert.match(background, /createAskParentService/);
    assert.match(background, /askParentPassVideoIds/);
    // The compiler reads the passes in the same storage read as the profiles (caught on the live site).
    const compile = background.slice(background.indexOf('async function getCompiledSettings('), background.indexOf('const compiledSettings = {};', background.indexOf('async function getCompiledSettings(')));
    assert.match(compile, /FT_PROFILES_V4_KEY,\n\s+ASK_PARENT_STORE_KEY\n\s+\], \(items\) => \{/);
    const filter = fs.readFileSync('js/filter_logic.js', 'utf8');
    assert.match(filter, /askParentPassVideoIdSet/);
    const tabView = fs.readFileSync('js/tab-view.js', 'utf8');
    assert.match(tabView, /FilterTube_AskParentNanahOutbox/);
    assert.match(tabView, /root\.t === 'study_family'/);
    const overlay = fs.readFileSync('js/content/admission_overlay.js', 'utf8');
    assert.match(overlay, /FilterTube_AskParentCreate/);
});
