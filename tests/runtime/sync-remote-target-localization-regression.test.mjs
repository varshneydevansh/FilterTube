import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('js/tab-view.js', 'utf8');
const slice = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));

test('remote profile options localize UI labels without changing profile names, IDs or selection', () => {
    const rows = [
        { profileId: 'child-raw-id', profileName: 'Mira <tablet>', profileType: 'child', locked: true },
        { profileId: 'default', profileName: 'User named Default', profileType: 'account', locked: false }
    ];
    const before = JSON.stringify(rows);
    const options = [];
    const select = { value: 'child-raw-id', appendChild(option) { options.push(option); } };
    const ru = JSON.parse(fs.readFileSync('data/ui_locales/ru.json', 'utf8'));
    const context = vm.createContext({
        window: {}, document: { createElement: () => ({}) },
        ftNanahRemoteTarget: select,
        nanahSessionState: { remoteProfileInventory: rows, remoteProfile: { profileId: 'default' } },
        normalizeNanahProfileInventory: value => value,
        normalizeString: value => String(value || '').trim(), safeObject: value => value || {},
        tabViewUiText: (key, fallback) => ru[key] || fallback
    });
    vm.runInContext(slice('    function getNanahProfileTypeLabel(', '\n    function getNanahLocalProfileContext(')
        + '\n' + slice('    function syncNanahRemoteTargetOptions() {', '\n    function '), context);
    context.syncNanahRemoteTargetOptions();
    assert.equal(options[0].textContent, ru['dashboard.sync.remoteTarget.default']);
    assert.equal(options[1].value, 'child-raw-id');
    assert.ok(options[1].textContent.startsWith('Mira <tablet>'));
    assert.ok(options[1].textContent.includes(ru['managedOverlay.profile.protected']));
    assert.ok(options[1].textContent.endsWith(ru['dashboard.selfControl.state.locked']));
    assert.ok(options[2].textContent.startsWith('User named Default'));
    assert.equal(select.value, 'child-raw-id');
    assert.equal(JSON.stringify(rows), before);
});
