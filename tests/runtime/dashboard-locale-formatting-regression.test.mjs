import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('js/tab-view.js', 'utf8');
const start = source.indexOf('const tabViewIntlLocales = new Map();');
const end = source.indexOf('\nfunction tabViewTaxonomyDisplayLabel', start);
function load() {
    const window = { FilterTubeUiLocalization: { locale: 'en' } };
    const locale = vm.runInNewContext(source.slice(start, end) + '\ntabViewIntlLocale;', { window, Intl });
    return { window, locale };
}

test('date and count formatting follows current interface language, not the browser default', () => {
    const { window, locale } = load();
    assert.equal(locale(), 'en');
    window.FilterTubeUiLocalization.locale = 'ru';
    assert.equal(locale(), 'ru');
    assert.equal((12345).toLocaleString(locale()), (12345).toLocaleString('ru'));
    const date = new Date('2026-10-01T10:00:00Z');
    assert.equal(date.toLocaleDateString(locale()), date.toLocaleDateString('ru'));
    window.FilterTubeUiLocalization.locale = 'gu';
    assert.equal(locale(), 'gu');
    window.FilterTubeUiLocalization.locale = 'en';
    assert.equal(locale(), 'en', 'cached formats cannot retain an old language after switching');
});

test('every bundled locale formats safely and malformed locales fall back', () => {
    const { window, locale } = load();
    for (const file of fs.readdirSync('data/ui_locales').filter(file => file.endsWith('.json'))) {
        const catalog = JSON.parse(fs.readFileSync(`data/ui_locales/${file}`, 'utf8'));
        if (!catalog['popup.blocklist']) continue;
        window.FilterTubeUiLocalization.locale = file.slice(0, -5);
        assert.doesNotThrow(() => new Date(0).toLocaleDateString(locale()));
        assert.doesNotThrow(() => (12345).toLocaleString(locale()));
    }
    window.FilterTubeUiLocalization.locale = 'invalid_locale';
    assert.equal(locale(), 'en');
});
