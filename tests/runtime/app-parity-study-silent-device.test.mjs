// Android StudyEnforcementP1Test "the parent sees a child's device that stopped reporting" (Ports Android
// 910016a10: StudyFamily.kt StudyReportFreshness, StudyFamilyActivity.kt, strings_study_enforce.xml
// study_family_stopped): a linked child whose last report is more than 3 days old is flagged.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Ask = require('../../js/shared/ask_parent.js');
const { createAskParentService, verifyEd25519 } = require('../../js/ask_parent_background.js');
const START = Date.UTC(2026, 10, 16, 15, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

const childSideLink = () => ({
    linkId: 'link-mum', remoteDeviceId: 'android-parent', deviceLabel: "Mum's phone", localRole: 'replica', remoteRole: 'source',
    linkType: 'managed_link', sourceProfileId: 'mum',
    policy: { linkType: 'managed_link', targetProfileId: 'aarav', targetProfileName: 'Aarav', sourceProfileId: 'mum' }
});
const parentSideLink = () => ({ ...childSideLink(), linkId: 'link-aarav', remoteDeviceId: 'android-child', deviceLabel: "Aarav's tablet",
    localRole: 'source', remoteRole: 'replica' });

function harness(links, active) {
    const clock = { now: START };
    const storage = { ftNanahTrustedLinks: links, ftProfilesV4: { schemaVersion: 4, activeProfileId: active, profiles: {
        mum: { name: 'Mum', type: 'account' }, aarav: { name: 'Aarav', type: 'child', parentProfileId: 'mum' } } } };
    const service = createAskParentService({
        Ask, now: () => clock.now, verify: verifyEd25519, parentUnlockFresh: async () => true,
        studyReport: async () => ({ dayMinutes: {}, lockEndsAt: null }),
        browserAPI: { storage: { local: {
            get(keys, cb) { const out = {}; for (const key of [].concat(keys)) if (key in storage) out[key] = structuredClone(storage[key]); cb(out); },
            set(items, cb) { Object.assign(storage, structuredClone(items)); cb?.(); }
        } } }
    });
    return { service, clock };
}

test('the parent sees a linked child\'s device that stopped reporting', async () => {
    const child = harness([childSideLink()], 'aarav');
    await child.service.askTime({ minutes: 20, reason: '' });
    const built = await child.service.outbox({ deviceId: 'android-parent', capabilities: ['filtertube.study.v1'] });
    const parent = harness([parentSideLink()], 'mum');
    // No report yet: nothing to say.
    assert.equal((await parent.service.inbox()).remoteChildren[0].stoppedSince, null);
    await parent.service.receive('android-child', built.message);
    parent.clock.now = START + 3 * DAY;
    assert.equal((await parent.service.inbox()).remoteChildren[0].stoppedSince, null, 'fresh at exactly 3 days');
    parent.clock.now = START + 3 * DAY + 1;
    assert.equal((await parent.service.inbox()).remoteChildren[0].stoppedSince, START);
});

test('the notice is in every catalog with its placeholders', () => {
    const catalogs = fs.readdirSync('data/ui_locales').filter(name => /^[a-zA-Z-]+\.json$/.test(name) && !name.startsWith('release') && name !== 'targets.json');
    for (const name of catalogs) {
        const catalog = JSON.parse(fs.readFileSync(`data/ui_locales/${name}`, 'utf8'));
        assert.match(catalog['study.family.stopped'] || '', /\{name\}/, name);
        assert.match(catalog['study.family.stoppedBody'] || '', /\{time\}/, name);
    }
});
