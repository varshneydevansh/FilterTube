import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');
const background = read('js/background.js');
const dashboard = read('js/tab-view.js');
const dashboardHtml = read('html/tab-view.html');

function sectionBetween(source, startMarker, endMarker) {
    const start = source.indexOf(startMarker);
    assert.notEqual(start, -1, `missing start marker: ${startMarker}`);
    const end = source.indexOf(endMarker, start + startMarker.length);
    assert.notEqual(end, -1, `missing end marker: ${endMarker}`);
    return source.slice(start, end);
}

function extractFunction(source, signature) {
    const start = source.indexOf(signature);
    assert.notEqual(start, -1, `missing function: ${signature}`);
    const openBrace = source.indexOf('{', start + signature.length);
    assert.notEqual(openBrace, -1, `missing opening brace: ${signature}`);
    let depth = 0;
    for (let index = openBrace; index < source.length; index += 1) {
        if (source[index] === '{') depth += 1;
        if (source[index] === '}') depth -= 1;
        if (depth === 0) return source.slice(start, index + 1);
    }
    assert.fail(`missing closing brace: ${signature}`);
}

function makeCheckbox() {
    return {
        checked: false,
        dataset: {},
        listeners: new Map(),
        addEventListener(type, listener) {
            this.listeners.set(type, listener);
        }
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

function loadDecision() {
    const context = {};
    vm.createContext(context);
    vm.runInContext(`
        const SHOW_UPDATE_REFRESH_PROMPT_KEY = 'showUpdateRefreshPrompt';
        ${extractFunction(background, 'function shouldShowUpdateRefreshPrompt(settings = {})')}
        this.shouldShow = shouldShowUpdateRefreshPrompt;
    `, context);
    return context.shouldShow;
}

function loadSettingRuntime({ stored = {}, getError = null, setError = null } = {}) {
    const writes = [];
    const toasts = [];
    const context = {
        runtimeAPI: {
            storage: {
                local: {
                    async get() {
                        if (getError) throw getError;
                        return stored;
                    },
                    async set(value) {
                        writes.push(value);
                        if (setError) throw setError;
                    }
                }
            }
        },
        UIComponents: {
            showToast(message, type) {
                toasts.push({ message, type });
            }
        }
    };
    vm.createContext(context);
    vm.runInContext(`
        const SHOW_UPDATE_REFRESH_PROMPT_KEY = 'showUpdateRefreshPrompt';
        ${extractFunction(dashboard, 'async function initializeUpdateRefreshPromptSetting(setting)')}
        this.initializeSetting = initializeUpdateRefreshPromptSetting;
    `, context);
    return { context, writes, toasts };
}

test('Settings exposes a device-wide automatic update notification control', () => {
    assert.match(dashboardHtml, /id="setting_showUpdateRefreshPrompt" type="checkbox"/);
    assert.match(dashboardHtml, /Disable update notifications/);
    assert.match(dashboardHtml, /Device-wide opt-out/);
    assert.match(dashboardHtml, /Can I hide update notifications\?/);
    assert.match(dashboard, /const settingShowUpdateRefreshPrompt = document\.getElementById\('setting_showUpdateRefreshPrompt'\)/);
    assert.match(dashboard, /await initializeUpdateRefreshPromptSetting\(settingShowUpdateRefreshPrompt\)/);
});

test('setting uses an unchecked opt-out, persists both choices, and rolls back failed writes', async () => {
    for (const [stored, expected] of [
        [{}, false],
        [{ showUpdateRefreshPrompt: true }, false],
        [{ showUpdateRefreshPrompt: false }, true]
    ]) {
        const checkbox = makeCheckbox();
        const runtime = loadSettingRuntime({ stored });
        await runtime.context.initializeSetting(checkbox);
        assert.equal(checkbox.checked, expected);
        checkbox.checked = !expected;
        await checkbox.listeners.get('change')();
        assert.deepEqual(plain(runtime.writes), [{ showUpdateRefreshPrompt: expected }]);
    }

    const checkbox = makeCheckbox();
    const runtime = loadSettingRuntime({
        getError: new Error('read failed'),
        setError: new Error('write failed')
    });
    await runtime.context.initializeSetting(checkbox);
    assert.equal(checkbox.checked, false);
    checkbox.checked = false;
    await checkbox.listeners.get('change')();
    assert.equal(checkbox.checked, true);
    assert.deepEqual(plain(runtime.toasts), [{
        message: 'Could not update notification preference',
        type: 'error'
    }]);
});

test('background reminder decision requires both enabled preference and pending flag', () => {
    const shouldShow = loadDecision();
    assert.equal(shouldShow({}), true);
    assert.equal(shouldShow({ showUpdateRefreshPrompt: true, firstRunRefreshNeeded: true }), true);
    assert.equal(shouldShow({ showUpdateRefreshPrompt: false, firstRunRefreshNeeded: true }), false);
    assert.equal(shouldShow({ showUpdateRefreshPrompt: true, firstRunRefreshNeeded: false }), false);
    assert.equal(shouldShow({ showUpdateRefreshPrompt: false, firstRunRefreshNeeded: false }), false);
});

test('background wiring applies the opt-out to both automatic update prompts', () => {
    const installBlock = sectionBetween(
        background,
        "if (details.reason === 'install') {",
        "} else if (details.reason === 'update') {"
    );
    assert.match(installBlock, /\[SHOW_UPDATE_REFRESH_PROMPT_KEY\]: true/);

    const updateBlock = sectionBetween(
        background,
        "} else if (details.reason === 'update') {",
        'browserAPI.runtime.onMessage.addListener'
    );
    assert.match(updateBlock, /releaseNotesPayload: payload/);
    assert.match(updateBlock, /firstRunRefreshNeeded: true/);
    assert.doesNotMatch(updateBlock, /SHOW_UPDATE_REFRESH_PROMPT_KEY/);

    const firstRunBlock = sectionBetween(
        background,
        "} else if (action === 'FilterTube_FirstRunCheck') {",
        "} else if (action === 'FilterTube_FirstRunComplete') {"
    );
    assert.match(firstRunBlock, /storageGet\(\['firstRunRefreshNeeded', SHOW_UPDATE_REFRESH_PROMPT_KEY\]\)/);
    assert.match(firstRunBlock, /needed: shouldShowUpdateRefreshPrompt\(data\)/);

    const releaseBlock = sectionBetween(
        background,
        "if (action === 'FilterTube_ReleaseNotesCheck') {",
        "} else if (action === 'FilterTube_ReleaseNotesAck') {"
    );
    assert.match(releaseBlock, /storageGet\(\[SHOW_UPDATE_REFRESH_PROMPT_KEY, 'releaseNotesSeenVersion', 'releaseNotesPayload'\]\)/);
    assert.match(releaseBlock, /data\?\.\[SHOW_UPDATE_REFRESH_PROMPT_KEY\] === false/);
    assert.match(releaseBlock, /sendResponse\(\{ needed: false \}\)/);

    const manualWhatsNewBlock = sectionBetween(
        background,
        "} else if (action === 'FilterTube_OpenWhatsNew') {",
        "} else if (action === 'FilterTube_OpenDashboard') {"
    );
    assert.doesNotMatch(manualWhatsNewBlock, /showUpdateRefreshPrompt|SHOW_UPDATE_REFRESH_PROMPT_KEY/);
});
