import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('js/ui_components.js', 'utf8');
function load(locale) {
    const catalog = locale ? JSON.parse(fs.readFileSync(`data/ui_locales/${locale}.json`, 'utf8')) : null;
    const window = catalog ? { FilterTubeUiLocalization: { text: key => catalog[key] } } : {};
    const context = vm.createContext({ window, document: { createElement: () => ({
        attributes: {}, dataset: {}, style: {}, classList: { add() {}, remove() {} },
        setAttribute(key, value) { this.attributes[key] = value; }, addEventListener() {}
    }) }, setTimeout() {} });
    vm.runInContext(source, context);
    return { api: window.UIComponents, catalog };
}

test('shared component labels use bundled locale text with English fallback', () => {
    for (const locale of [null, 'ru', 'ta', 'gu', 'ar']) {
        const { api, catalog } = load(locale);
        const button = api.createDeleteButton(() => {});
        assert.equal(button.attributes['aria-label'], catalog?.['render.deleteRule'] || 'Delete');
        assert.equal(button.attributes.title, button.attributes['aria-label']);
        assert.equal(button.attributes['data-ft-i18n-title'], 'render.deleteRule');
        api.flashButtonSuccess(button);
        assert.equal(button.textContent, catalog?.['render.saved'] || 'Saved!');
        api.flashButtonSuccess(button, 'User supplied message');
        assert.equal(button.textContent, 'User supplied message');
    }
});

test('icon button accessible name follows translated caller label', () => {
    const { api } = load('ru');
    assert.equal(api.createIconButton({ title: 'Удалить', icon: '' }).attributes['aria-label'], 'Удалить');
    assert.equal(api.createIconButton({ title: 'Удалить', ariaLabel: 'Удалить правило', icon: '' }).attributes['aria-label'], 'Удалить правило');
});
