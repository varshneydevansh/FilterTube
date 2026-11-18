// Kids Mode has its own Quiet blocking (profile.kids.quietBlocking), separate from Main's
// settings.quietBlocking: off by default, read only when the Kids space compiles, parent-locked like
// the other Kids controls, and carried by backups and Personal Auto-sync.
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

const require = createRequire(import.meta.url);
const read = file => fs.readFileSync(file, 'utf8');

function sliceBetween(source, start, end) {
    const from = source.indexOf(start);
    assert.notEqual(from, -1, `missing ${start}`);
    const to = source.indexOf(end, from + start.length);
    assert.notEqual(to, -1, `missing ${end}`);
    return source.slice(from, to);
}

// The extension's real settings, backup and state modules over an in-memory chrome.storage.local.
function profileRuntime(kids = { blockedChannels: [], blockedKeywords: [], contentFilters: {} }) {
    const storage = { ftProfilesV4: { schemaVersion: 4, activeProfileId: 'default', profiles: { default: {
        type: 'account', name: 'Default', settings: {}, main: { channels: [], keywords: [] }, kids
    } } }, ftProfilesV3: { main: {}, kids: {} } };
    const clone = value => JSON.parse(JSON.stringify(value));
    const refreshes = [];
    const box = { console, setTimeout: () => 1, clearTimeout() {}, chrome: {
        runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }),
            sendMessage(message, done) { refreshes.push(message); done?.({ ok: true, success: true }); } },
        storage: { onChanged: { addListener() {} }, local: {
            get(keys, done) { done(keys === null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
            set(payload, done) { Object.assign(storage, clone(payload)); done?.(); },
            getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
        } }
    } };
    box.window = box;
    vm.createContext(box);
    installNanahStorageLock(box);
    for (const name of ['settings_shared', 'io_manager', 'state_manager']) {
        vm.runInContext(read(`js/${name}.js`), box);
    }
    return { box, storage, refreshes };
}

const loadOptions = { resetEnrichment: false, scheduleEnrichment: false };

test('Kids Quiet blocking is off by default and saves on profile.kids only', async () => {
    const runtime = profileRuntime();
    const manager = runtime.box.StateManager;
    await manager.loadSettings(loadOptions);
    assert.equal(manager.getState().kids.quietBlocking, false);
    assert.equal(manager.getState().quietBlocking, false);

    await manager.updateKidsQuietBlocking(true);
    const profile = runtime.storage.ftProfilesV4.profiles.default;
    assert.equal(profile.kids.quietBlocking, true);
    assert.notEqual(profile.settings.quietBlocking, true, "Main's Quiet blocking is untouched");
    assert.ok(runtime.refreshes.some(message => message.action === 'getCompiledSettings' && message.profileType === 'kids'),
        'the Kids space recompiles');

    await manager.loadSettings(loadOptions);
    assert.equal(manager.getState().kids.quietBlocking, true);
    assert.equal(manager.getState().quietBlocking, false);

    await manager.updateKidsQuietBlocking(false);
    assert.equal(runtime.storage.ftProfilesV4.profiles.default.kids.quietBlocking, false);
});

test('Main\'s Quiet blocking does not turn the Kids one on', async () => {
    const runtime = profileRuntime();
    const manager = runtime.box.StateManager;
    await manager.loadSettings(loadOptions);
    await manager.updateSetting('quietBlocking', true);
    await manager.loadSettings(loadOptions);
    assert.equal(manager.getState().quietBlocking, true);
    assert.equal(manager.getState().kids.quietBlocking, false);
});

test('a locked surface (child, PIN, Self-Control) cannot change Kids Quiet blocking', async () => {
    const runtime = profileRuntime();
    const manager = runtime.box.StateManager;
    await manager.loadSettings(loadOptions);
    const before = JSON.stringify(runtime.storage);
    runtime.box.FilterTubeIsUiLocked = () => true;
    await manager.updateKidsQuietBlocking(true);
    assert.equal(manager.getState().kids.quietBlocking, false);
    assert.equal(JSON.stringify(runtime.storage), before);
});

test('Kids Quiet blocking survives a backup export and import (replace and merge)', async () => {
    const source = profileRuntime();
    await source.box.StateManager.loadSettings(loadOptions);
    await source.box.StateManager.updateKidsQuietBlocking(true);
    const exported = await source.box.FilterTubeIO.exportV3({ scope: 'full' });
    assert.equal(exported.profilesV4.profiles.default.kids.quietBlocking, true);
    assert.notEqual(exported.settings.main.quietBlocking, true);

    for (const strategy of ['replace', 'merge']) {
        const restored = profileRuntime();
        await restored.box.FilterTubeIO.importV3(JSON.parse(JSON.stringify(exported)), { scope: 'full', strategy });
        const profile = restored.storage.ftProfilesV4.profiles.default;
        assert.equal(profile.kids.quietBlocking, true, strategy);
        assert.notEqual(profile.settings.quietBlocking, true, strategy);
        await restored.box.StateManager.loadSettings(loadOptions);
        assert.equal(restored.box.StateManager.getState().kids.quietBlocking, true, strategy);
    }

    // A backup made before this setting existed restores with it off.
    const older = profileRuntime();
    await older.box.StateManager.loadSettings(loadOptions);
    const oldBackup = await older.box.FilterTubeIO.exportV3({ scope: 'full' });
    delete oldBackup.profilesV4.profiles.default.kids.quietBlocking;
    const restoredOld = profileRuntime();
    await restoredOld.box.FilterTubeIO.importV3(oldBackup, { scope: 'full', strategy: 'replace' });
    await restoredOld.box.StateManager.loadSettings(loadOptions);
    assert.equal(restoredOld.box.StateManager.getState().kids.quietBlocking, false);
});

// The compiled settings each space receives: the background's own lines, run for Main and for Kids.
function compiledQuietBlocking({ kidsSpace, mainQuiet, kidsQuiet }) {
    const background = read('js/background.js');
    const lines = sliceBetween(background,
        "            compiledSettings.quietBlocking = boolFromV4('quietBlocking', items.quietBlocking || false);",
        '            compiledSettings.alwaysUseOriginalAudio');
    const context = {
        compiledSettings: {},
        shouldUseKidsProfile: kidsSpace,
        items: {},
        activeKids: kidsQuiet === undefined ? {} : { quietBlocking: kidsQuiet },
        boolFromV4: key => (key === 'quietBlocking' ? mainQuiet : false)
    };
    vm.createContext(context);
    vm.runInContext(lines, context);
    return context.compiledSettings.quietBlocking;
}

test('each space reads its own Quiet blocking', () => {
    assert.equal(compiledQuietBlocking({ kidsSpace: false, mainQuiet: true, kidsQuiet: false }), true);
    assert.equal(compiledQuietBlocking({ kidsSpace: false, mainQuiet: false, kidsQuiet: true }), false);
    assert.equal(compiledQuietBlocking({ kidsSpace: true, mainQuiet: true, kidsQuiet: false }), false);
    assert.equal(compiledQuietBlocking({ kidsSpace: true, mainQuiet: false, kidsQuiet: true }), true);
    assert.equal(compiledQuietBlocking({ kidsSpace: true, mainQuiet: true, kidsQuiet: undefined }), false, 'unset is off');
});

test('Personal Auto-sync carries Kids Quiet blocking, written only when on', () => {
    const protocol = require('../../js/personal_sync.js');
    const on = protocol.snapshotSettings({ settings: { quietBlocking: false }, kids: { mode: 'blocklist', quietBlocking: true } });
    assert.equal(on.kids.quietBlocking, true);
    assert.equal(on.settings.quietBlocking, false, "Main's value still travels as before");
    const off = protocol.snapshotSettings({ kids: { mode: 'blocklist', quietBlocking: false } });
    assert.equal(Object.hasOwn(off.kids, 'quietBlocking'), false);
    assert.throws(() => protocol.validateSettings({ settings: {}, main: {}, kids: { quietBlocking: 'yes' } }));
});

test('the Kids Mode page has the toggle, parent-locked, in every locale', () => {
    const tabView = read('js/tab-view.js');
    assert.match(tabView, /kidsQuietCheckbox\.setAttribute\('data-ft-kids-setting', 'quietBlocking'\)/);
    assert.match(tabView, /StateManager\.updateKidsQuietBlocking\(value\)/);
    assert.match(tabView, /target\.quietBlocking = value;/, 'a parent editing a protected profile saves that profile');
    assert.match(tabView, /kidsQuietBlockingToggle\.disabled = isChild \|\| isUiLocked\(\);/);
    const binding = sliceBetween(tabView, '    kidsSettingCheckboxes.forEach(el => {\n        el.addEventListener', '\n    });\n');
    assert.match(binding, /if \(isUiLocked\(\) \|\| el\.disabled\)/);
    const targets = JSON.parse(read('data/ui_locales/targets.json')).locales.map(entry => entry.code);
    for (const locale of targets) {
        const catalog = JSON.parse(read(`data/ui_locales/${locale}.json`));
        assert.ok(String(catalog['tabView.kidsQuietBlocking.hint'] || '').includes('Kids'), locale);
        assert.doesNotMatch(String(catalog['tabView.kidsQuietBlocking.hint']), /YouTube/, locale);
        assert.ok(String(catalog['controls.title.quietBlocking'] || '').trim(), locale);
    }
});
