import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('js/tab-view.js', 'utf8');
const start = source.indexOf('    function renderListModeControls() {');
const end = source.indexOf('\n    try {\n        window.__filtertubeRenderTopBarListModeControls', start);
const render = source.slice(start, end);
const english = JSON.parse(fs.readFileSync('data/ui_locales/en.json', 'utf8'));

test('language switching refreshes generated list-mode and Family Devices controls without network work', () => {
    const marker = "    window.addEventListener('filtertube-ui-locale-changed', () => {\n        renderListModeControls();";
    const eventStart = source.indexOf(marker);
    assert.ok(eventStart >= 0);
    const eventEnd = source.indexOf('\n    });', eventStart) + '\n    });'.length;
    const calls = [];
    let refresh;
    vm.runInNewContext(source.slice(eventStart, eventEnd), {
        window: { addEventListener(name, callback) { assert.equal(name, 'filtertube-ui-locale-changed'); refresh = callback; } },
        renderListModeControls() { calls.push('listMode'); },
        renderNanahDeliveryPathStrip() { calls.push('familyDevices'); },
        profilesV4Cache: null
    });
    refresh();
    assert.deepEqual(calls, ['listMode', 'familyDevices']);
});

test('dashboard profile availability errors share the existing popup translation', () => {
    assert.doesNotMatch(source, /UIComponents\.showToast\('Profiles unavailable'/);
    assert.ok([...source.matchAll(/tabViewUiText\('popup\.profile\.unavailable', 'Profiles unavailable'\)/g)].length >= 6);
});

test('dashboard list mode reuses the translated popup contract in every locale', () => {
    const keys = [...new Set([...render.matchAll(/'((?:popup\.)[^']+)'/g)].map(match => match[1]))];
    assert.equal(keys.length, 11);
    for (const file of fs.readdirSync('data/ui_locales').filter(file => file.endsWith('.json') && file !== 'manifest.json')) {
        const catalog = JSON.parse(fs.readFileSync(`data/ui_locales/${file}`, 'utf8'));
        if (!catalog['popup.blocklist']) continue;
        for (const key of keys) assert.ok(catalog[key], `${file}: ${key}`);
    }
});

test('translated mode labels, empty allowlist warning and failure message retain behavior', async () => {
    for (const kids of [false, true]) {
        const callbacks = {};
        const toasts = [];
        const toggle = { setAttribute() {}, addEventListener(name, fn) { callbacks[name] = fn; } };
        const context = vm.createContext({
            StateManager: { getState: () => ({ mode: 'blocklist', kids: { mode: 'blocklist' } }) },
            ftTopBarListModeControlsTab: { appendChild() {} },
            document: { querySelector: () => ({ getAttribute: () => kids ? 'kids' : 'dashboard' }), createElement: () => toggle },
            normalizeString: value => value || '', isManagedChildEditFor: () => false, isUiLocked: () => false,
            tabViewUiText: (key, fallback, values = {}) => `translated:${key}:` + english[key].replace(/\{(\w+)\}/g, (_, key) => values[key]),
            syncSubscriptionsImportControls() {},
            UIComponents: { showToast(message, tone) { toasts.push({ message, tone }); } },
            sendRuntimeMessage: async () => ({ ok: false })
        });
        vm.runInContext(render + '\nrenderListModeControls();', context);
        assert.match(toggle.textContent, /^translated:popup.blocklist:/);
        assert.match(toggle.title, /^translated:popup.listMode.blocklistTooltip:/);
        await callbacks.click();
        assert.match(toasts[0].message, new RegExp(`^translated:popup.listMode.${kids ? 'emptyKidsAllowedRules' : 'emptyAllowedRules'}:`));
        assert.match(toasts[1].message, /^translated:popup.listMode.updateFailed:/);
        assert.equal(toasts[0].tone, 'info');
        assert.equal(toasts[1].tone, 'error');
    }
});
