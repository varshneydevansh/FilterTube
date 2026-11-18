// Android NativeMainRuleFilterSheet (Ports Android a5efd779d and 93cf50d53): on Keywords and Channels the
// date and sort options sit behind one filter button beside search, which fills brick-soft while they
// narrow the list. Its spoken label reuses the translated "More options".
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadParity() {
    const context = { document: { readyState: 'loading', addEventListener() {}, getElementById: () => null }, setTimeout: () => 0 };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('js/paperkit_parity.js', 'utf8'), context);
    return context.FilterTubePaperParity;
}

// A panel stand-in: the selectors syncRuleOptions reads, answered from a value map.
function panel(values) {
    const node = value => (value === undefined ? null : { value });
    return {
        querySelector(selector) {
            if (selector.startsWith('.sort-controls select')) return node(values.sort);
            if (selector === '.date-range-controls select') return node(values.preset);
            if (selector === '.channel-source-filter') return node(values.source);
            if (selector.includes(':first-of-type')) return node(values.from);
            if (selector.includes(':last-of-type')) return node(values.to);
            return null;
        }
    };
}

test('the button fills while a non-default sort, a date range or a source narrows the list', () => {
    const Parity = loadParity();
    const narrowed = values => !!Parity.ruleOptionsNarrowed(panel(values));
    assert.equal(narrowed({ sort: 'newest', preset: 'all', from: '', to: '' }), false);
    assert.equal(narrowed({ sort: 'oldest', preset: 'all', from: '', to: '' }), true);
    assert.equal(narrowed({ sort: 'az', preset: 'all' }), true);
    assert.equal(narrowed({ sort: 'newest', preset: '7d' }), true);
    assert.equal(narrowed({ sort: 'newest', preset: 'custom', from: '2026-11-01', to: '' }), true);
    assert.equal(narrowed({ sort: 'newest', preset: 'all', from: '', to: '2026-11-16' }), true);
    assert.equal(narrowed({ sort: 'newest', preset: 'all', source: 'all' }), false);
    assert.equal(narrowed({ sort: 'newest', preset: 'all', source: 'lists' }), true);
});

test('all four rule lists have the search, sort and date controls the button gathers', () => {
    const source = fs.readFileSync('js/tab-view.js', 'utf8');
    for (const [search, sort, preset] of [
        ['searchKeywords', 'keywordSort', 'keywordDatePreset'], ['searchChannels', 'channelSort', 'channelDatePreset'],
        ['kidsSearchKeywords', 'kidsKeywordSort', 'kidsKeywordDatePreset'], ['kidsSearchChannels', 'kidsChannelSort', 'kidsChannelDatePreset']]) {
        const block = source.slice(source.indexOf(`id="${search}"`) - 200, source.indexOf(`id="${preset}"`));
        assert.match(block, /<div class="filter-controls">\s*<input type="text" id="[a-zA-Z]+" class="search-input"/, search);
        assert.match(block, new RegExp(`<div class="sort-controls">[\\s\\S]*id="${sort}"`), sort);
        assert.match(block, /<\/div>\s*<\/div>\s*<div class="date-filter-controls">/, `${search}: dates follow the search row`);
    }
});

test('the label is "More options" in every catalog, and the button is 56 px with 18 px corners', () => {
    const Parity = loadParity();
    assert.deepEqual([...Parity.COPY.ruleOptions], ['dashboard.ruleEditor.moreOptions', 'More options']);
    const catalogs = fs.readdirSync('data/ui_locales').filter(name => /^[a-zA-Z-]+\.json$/.test(name) && !name.startsWith('release') && name !== 'targets.json');
    assert.ok(catalogs.length >= 38);
    for (const name of catalogs) {
        const catalog = JSON.parse(fs.readFileSync(path.join('data/ui_locales', name), 'utf8'));
        const statics = JSON.parse(fs.readFileSync(path.join('data/ui_locales', name.replace('.json', '_static.json')), 'utf8'));
        const expected = name === 'en.json' ? 'More options' : statics['More options'];
        assert.equal(catalog['dashboard.ruleEditor.moreOptions'], expected, name);
    }
    const css = fs.readFileSync('css/paperkit-parity.css', 'utf8');
    assert.match(css, /\.pk-rule-options-btn \{[^}]*width: 56px; height: 56px;[^}]*border-radius: 18px;/);
    assert.match(css, /\.pk-rule-options-btn__icon \{ width: 22px; height: 22px;/);
    assert.match(css, /\.pk-rule-options-btn\.is-active \{ background: #fee2e2;/);
    assert.match(css, /\.pk-rule-options-btn\.is-active \{ background: #3a2020; \}/);
    assert.match(css, /\.filter-controls\.pk-rule-search-row \{[^}]*gap: 8px;/);
});
