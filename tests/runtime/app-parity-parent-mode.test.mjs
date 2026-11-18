// Android ParentModeTest and ParentModeHandOffTest (Ports Android c95f2c6a8, 9af03736d and 5b9b8d079:
// ParentMode.kt remoteLinkFor, spaceTarget, sync, isLiveSync and syncTone, ParentModeSession): which
// link makes a session remote, which local child "Open Aarav's space" opens, and a sync badge that never
// claims a send it can't see.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Mode = require('../../js/parent_mode.js');
const { SYNC } = Mode;

const link = (childId, { label = "Aarav's tablet", type = 'managed_link', role = 'source', revoked = false, used = '2026-11-01T10:00:00Z' } = {}) => ({
    linkId: `link-${childId}-${used}`, remoteDeviceId: `device-${childId}`, deviceLabel: label, localRole: role, remoteRole: 'replica',
    linkType: type, sourceProfileId: 'mom', policy: { targetProfileId: childId }, createdAt: used, lastUsedAt: used, revoked
});

test('a remote edit is found from the Family link that sends the child\'s rules', () => {
    assert.equal(Mode.remoteLinkFor('aarav', [link('mia', { label: "Mia's TV" }), link('aarav')]).deviceLabel, "Aarav's tablet");
    for (const other of [link('aarav', { revoked: true }), link('aarav', { role: 'replica' }), link('aarav', { type: 'peer_link' })]) {
        assert.equal(Mode.remoteLinkFor('aarav', [other]), null, 'only a live sending Family link makes it remote');
    }
    const recent = Mode.remoteLinkFor('aarav', [link('aarav', { label: 'Old phone', used: '2026-01-01T00:00:00Z' }), link('aarav', { used: '2026-11-01T00:00:00Z' })]);
    assert.equal(recent.deviceLabel, "Aarav's tablet", 'the most recently used link names the device');
});

test('Ask a parent opens the child\'s space, same device or remote', () => {
    const sending = link('aarav');
    assert.equal(Mode.spaceTarget('aarav', null, []), 'aarav');
    assert.equal(Mode.spaceTarget(null, sending.linkId, [sending]), 'aarav', 'a linked device opens through its local child');
    assert.equal(Mode.spaceTarget(null, 'missing', [sending]), null);
    assert.equal(Mode.spaceTarget(null, 'x', [{ ...link('aarav', { revoked: true }), linkId: 'x' }]), null);
    assert.equal(Mode.spaceTarget(null, 'y', [{ ...link('aarav', { role: 'replica' }), linkId: 'y' }]), null);
    // The page opens it through Manage rules' gate (a fresh, sensitive unlock), never by switching profile.
    const page = fs.readFileSync('js/tab-view.js', 'utf8');
    const opener = page.slice(page.indexOf('function askParentSpaceButton('), page.indexOf('function renderAskParentRequest('));
    assert.match(opener, /startManagedChildEdit\(target, ''\)/);
    assert.doesNotMatch(opener, /switchProfile|setActiveProfile/);
    const start = page.slice(page.indexOf('async function startManagedChildEdit('), page.indexOf('async function startManagedChildEdit(') + 1500);
    assert.match(start, /sensitiveAction: true/);
});

test('remote sync never claims a send it cannot see', () => {
    assert.equal(Mode.sync(null, true, 0), SYNC.UP_TO_DATE);
    assert.equal(Mode.sync(null, true, 2), SYNC.WAITING);
    assert.equal(Mode.sync(null, false, 2), SYNC.OFFLINE);
    assert.equal(Mode.sync(SYNC.SENDING, false, 2), SYNC.SENDING);
    assert.equal(Mode.sync(SYNC.CONNECTED, true, 0), SYNC.CONNECTED);
    assert.equal(Mode.sync(SYNC.SAVED_TO_DEVICE, true, 0), SYNC.SAVED_TO_DEVICE);
    assert.equal(Mode.sync(SYNC.SAVED_TO_DEVICE, true, 1), SYNC.WAITING, 'a change after the save is waiting again');
    for (const state of Object.values(SYNC)) assert.ok(['busy', 'done', 'waiting'].includes(Mode.syncTone(state)));
});

test('Accounts & Sync reports at the four places, and a failure never leaves a live state', () => {
    const session = Mode.createSession('aarav');
    session.recordChange();
    assert.equal(session.badge(true), SYNC.WAITING);
    for (const state of [SYNC.CONNECTING, SYNC.CONNECTED, SYNC.SENDING]) {
        session.report('aarav', state);
        assert.equal(session.badge(true), state);
    }
    session.report('aarav', SYNC.SAVED_TO_DEVICE, "Aarav's tablet");
    assert.equal(session.state.unsentChanges, 0);
    assert.equal(session.badge(true), SYNC.SAVED_TO_DEVICE);
    assert.equal(session.state.savedTo, "Aarav's tablet");
    session.recordChange();
    assert.equal(session.badge(true), SYNC.WAITING);
    // Another child's events are ignored.
    assert.equal(session.report('mia', SYNC.SENDING), false);
    session.report('aarav', SYNC.SENDING);
    session.clearLive('aarav');
    assert.equal(session.state.reported, null);
    session.report('aarav', SYNC.SAVED_TO_DEVICE);
    session.clearLive('aarav');
    assert.equal(session.state.reported, SYNC.SAVED_TO_DEVICE, 'a confirmed "Saved to" stays');
    assert.ok(Mode.isLiveSync(SYNC.CONNECTING) && Mode.isLiveSync(SYNC.CONNECTED) && Mode.isLiveSync(SYNC.SENDING));
    assert.ok(!Mode.isLiveSync(SYNC.SAVED_TO_DEVICE) && !Mode.isLiveSync(null));
});

test('the bar\'s sync words are in every catalog', () => {
    const catalogs = fs.readdirSync('data/ui_locales').filter(name => /^[a-zA-Z-]+\.json$/.test(name) && !name.startsWith('release') && name !== 'targets.json');
    for (const name of catalogs) {
        const catalog = JSON.parse(fs.readFileSync(`data/ui_locales/${name}`, 'utf8'));
        for (const key of ['parentMode.sync.connecting', 'parentMode.sync.sending', 'parentMode.sync.offline', 'parentMode.sync.upToDate']) assert.ok(catalog[key], `${name} ${key}`);
        assert.match(catalog['parentMode.sync.savedTo'], /\{device\}/, name);
        assert.match(catalog['askParent.openSpace'], /\{name\}/, name);
    }
});

// Ports Android 3c204e3fe (SettingsSectionActivity.kt requestChildNanahParentAuthority): inside a child,
// rules from another device merge only after the managing parent's PIN, every time, and a child never
// sets up or turns off pickup.
test('a Kids profile can\'t merge Nearby rules or change pickup alone', () => {
    const page = fs.readFileSync('js/tab-view.js', 'utf8');
    const gate = page.slice(page.indexOf('async function ensureChildNanahParentAuthorityUnlocked('), page.indexOf('function getNanahScopeDescription('));
    assert.match(gate, /ensureProfileUnlocked\(profilesV4, parentId, \{ everyTime: true \}\)/);
    const unlock = page.slice(page.indexOf('async function ensureProfileUnlocked('), page.indexOf('async function ensureAdminUnlocked('));
    assert.match(unlock, /options\.everyTime !== true && isProfileUnlockSessionValid\.check/, 'a fresh unlock never carries over');
    const decision = page.slice(page.indexOf('if (isNanahChildReceiveOnly() && !isManagedReceiver) {'), page.indexOf('if (isNanahChildReceiveOnly() && !isManagedReceiver) {') + 300);
    assert.match(decision, /ensureChildNanahParentAuthorityUnlocked\(\)/);
    for (const name of ['async function configureNanahManagedMailboxServer(', 'async function configureNanahManagedLocalNetwork']) {
        const body = page.slice(page.indexOf(name), page.indexOf(name) + 1200);
        assert.match(body, /=== 'child'\)/, `${name} refuses a child`);
    }
});
