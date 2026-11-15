// FilterTube's companions in the popup and options page (js/mascots.js): milestones once each and stored,
// the Companion setting, frame timing, and every new string in every interface catalog.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function load(initial = {}) {
    const store = { ...initial };
    const writes = [];
    const context = {
        Intl, Number, String, Array, Object, Math, JSON, Promise, Set,
        setTimeout: () => 0, clearTimeout: () => {},
        chrome: {
            runtime: { getURL: value => `chrome-extension://id/${value}` },
            storage: {
                local: {
                    get(keys, callback) {
                        const result = {};
                        for (const key of [].concat(keys)) if (key in store) result[key] = store[key];
                        callback(result);
                    },
                    set(items, callback) {
                        Object.assign(store, items);
                        writes.push(items);
                        callback?.();
                    }
                }
            }
        }
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('js/mascots.js', 'utf8'), context);
    return { Mascots: context.FilterTubeMascots, store, writes };
}

const plain = value => JSON.parse(JSON.stringify(value));

test('milestones play once each at 100, 1,000 and 10,000, and the seen list is what gets stored', () => {
    const { Mascots } = load();
    assert.deepEqual(plain(Mascots.MILESTONES), [100, 1000, 10000]);

    let seen = [];
    const open = total => {
        const verdict = Mascots.evaluateMilestone(total, seen, 'quiet');
        seen = plain(verdict.seen);
        return verdict.celebrate;
    };
    assert.equal(open(99), null, 'nothing below 100');
    assert.equal(open(100), 100, 'the first 100 plays');
    assert.equal(open(140), null, 'and never again');
    assert.equal(open(999), null);
    assert.equal(open(1000), 1000);
    assert.equal(open(1000), null);
    assert.equal(open(25000), 10000);
    assert.equal(open(99999), null);
    assert.deepEqual(seen, [100, 1000, 10000]);
});

test('crossing several milestones at once plays only the highest and marks every one seen', () => {
    const { Mascots } = load();
    const verdict = Mascots.evaluateMilestone(1500, [], 'lively');
    assert.equal(verdict.celebrate, 1000);
    assert.deepEqual(plain(verdict.seen), [100, 1000]);
    assert.equal(verdict.changed, true);
    const again = Mascots.evaluateMilestone(1500, verdict.seen, 'lively');
    assert.equal(again.celebrate, null);
    assert.equal(again.changed, false, 'no write when nothing new was reached');
});

test('with Companion off a milestone is marked seen but never plays later', () => {
    const { Mascots } = load();
    const off = Mascots.evaluateMilestone(120, [], 'off');
    assert.equal(off.celebrate, null);
    assert.deepEqual(plain(off.seen), [100]);
    assert.equal(Mascots.evaluateMilestone(130, off.seen, 'lively').celebrate, null);
});

test('stored seen lists are cleaned: unknown values, strings and duplicates', () => {
    const { Mascots } = load();
    const verdict = Mascots.evaluateMilestone(50, ['100', 100, 7, null, 'x'], 'quiet');
    assert.deepEqual(plain(verdict.seen), [100]);
    assert.deepEqual(plain(Mascots.evaluateMilestone(50, 'broken', 'quiet').seen), []);
});

test('the hidden total adds every surface and falls back to the legacy main entry', () => {
    const { Mascots } = load();
    assert.equal(Mascots.totalHidden({ statsBySurface: { main: { totalHiddenCount: 900 }, kids: { totalHiddenCount: 150 } } }), 1050);
    assert.equal(Mascots.totalHidden({ stats: { totalHiddenCount: 40 }, statsBySurface: { kids: { totalHiddenCount: 2 } } }), 42);
    assert.equal(Mascots.totalHidden({ stats: { totalHiddenCount: 40 }, statsBySurface: { main: { totalHiddenCount: 5 } } }), 5);
    assert.equal(Mascots.totalHidden({ statsBySurface: { main: { hiddenCount: 12 } } }), 0, 'the daily count is not the running total');
    assert.equal(Mascots.totalHidden(null), 0);
});

test('the sieve loop is frames 1 to 5 twice at 180 ms; reduced motion shows only the last frame', () => {
    const { Mascots } = load();
    assert.equal(Mascots.SIEVE_FRAME_MS, 180);
    assert.deepEqual(plain(Mascots.sieveFrames(false)), [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]);
    assert.deepEqual(plain(Mascots.sieveFrames(true)), [5]);
    assert.equal(plain(Mascots.ASSETS.sieve).length, 5);
});

test('Companion defaults to Quiet and accepts only Lively, Quiet or Off', () => {
    const { Mascots } = load();
    assert.equal(Mascots.DEFAULT_MODE, 'quiet');
    assert.equal(Mascots.normalizeMode(undefined), 'quiet');
    assert.equal(Mascots.normalizeMode('LIVELY'), 'lively');
    assert.equal(Mascots.normalizeMode(' off '), 'off');
    assert.equal(Mascots.normalizeMode('loud'), 'quiet');
    assert.equal(Mascots.normalizeMode(3), 'quiet');
});

test('Lively speaks in bubbles; Quiet keeps poses with no automatic bubbles; Off shows nothing', () => {
    const { Mascots } = load();
    assert.equal(Mascots.linePresentation('lively', 'event'), 'bubble');
    assert.equal(Mascots.linePresentation('lively', 'static'), 'bubble');
    assert.equal(Mascots.linePresentation('quiet', 'event'), 'on-demand', 'event lines wait for hover, focus or a click');
    assert.equal(Mascots.linePresentation('quiet', 'static'), 'caption', 'welcome and empty-list guidance stays as plain text');
    assert.equal(Mascots.linePresentation('off', 'event'), 'none');
    assert.equal(Mascots.linePresentation('off', 'static'), 'none');
    assert.equal(Mascots.showsCharacters('off'), false);
    assert.equal(Mascots.showsCharacters('quiet'), true);
});

test('the Companion setting is stored in chrome.storage.local and read back', async () => {
    const { Mascots, store } = load({ ftCompanionMode: 'off' });
    assert.equal(await Mascots.loadMode(), 'off');
    assert.equal(Mascots.mode, 'off');
    assert.equal(await Mascots.setMode('lively'), 'lively');
    assert.equal(store.ftCompanionMode, 'lively');
    assert.equal(Mascots.mode, 'lively');
    assert.equal(await Mascots.setMode('shouty'), 'quiet', 'unknown values fall back to Quiet');
    assert.equal(store.ftCompanionMode, 'quiet');

    const fresh = load();
    assert.equal(await fresh.Mascots.loadMode(), 'quiet', 'nothing stored means Quiet');
    assert.equal(Object.hasOwn(fresh.store, 'ftCompanionMode'), false, 'reading never writes a default');
});

test('the allow-list bubble pops only when the mode turns on, not on every open', () => {
    const { Mascots } = load();
    assert.equal(Mascots.allowListSwitchedOn('blocklist', 'whitelist'), true);
    assert.equal(Mascots.allowListSwitchedOn('whitelist', 'whitelist'), false);
    assert.equal(Mascots.allowListSwitchedOn(undefined, 'whitelist'), false, 'first ever open has nothing to compare');
    assert.equal(Mascots.allowListSwitchedOn('whitelist', 'blocklist'), false);
});

test('every new line is in every interface catalog, keeps its placeholders and never names the site', () => {
    const { Mascots } = load();
    const directory = 'data/ui_locales';
    const targets = JSON.parse(fs.readFileSync(path.join(directory, 'targets.json'), 'utf8')).locales.map(entry => entry.code);
    assert.equal(targets.length, 38);
    const keys = [
        ...Object.values(plain(Mascots.COPY)).map(([key]) => key),
        'mascot.setting.title', 'mascot.setting.description', 'mascot.setting.lively', 'mascot.setting.quiet', 'mascot.setting.off'
    ];
    const english = JSON.parse(fs.readFileSync(path.join(directory, 'en.json'), 'utf8'));
    for (const [key, fallback] of Object.values(plain(Mascots.COPY))) {
        assert.equal(english[key], fallback, `${key}: the code fallback matches the English catalog`);
    }
    const placeholders = value => [...String(value).matchAll(/\{([a-zA-Z]+)\}/g)].map(match => match[1]).sort().join(',');
    for (const code of targets) {
        const catalog = JSON.parse(fs.readFileSync(path.join(directory, `${code}.json`), 'utf8'));
        for (const key of keys) {
            assert.equal(typeof catalog[key], 'string', `${code}: missing ${key}`);
            assert.ok(catalog[key].trim(), `${code}: empty ${key}`);
            assert.equal(placeholders(catalog[key]), placeholders(english[key]), `${code}: placeholders changed in ${key}`);
            assert.doesNotMatch(catalog[key], /youtube/i, `${code}: ${key} names the site`);
        }
    }
});

test('English speech lines are sentence case and fit a 48-character bubble', () => {
    const { Mascots } = load();
    for (const [key, line] of Object.values(plain(Mascots.COPY))) {
        const sample = line.replace('{count}', '10,000');
        assert.ok([...sample].length <= Mascots.BUBBLE_MAX_CHARS, `${key} is ${sample.length} characters`);
        assert.match(sample, /^[A-Z0-9{I]/, `${key} starts with a capital or a number`);
        assert.doesNotMatch(sample.slice(1), /\b(?!I\b|I'll\b)[A-Z][a-z]+/, `${key} has no title-case words`);
    }
    assert.equal(Mascots.clampLine('x'.repeat(60)).length, 48);
});

test('the popup and options page load the companions, and the import and install hooks call them', () => {
    for (const page of ['html/popup.html', 'html/tab-view.html']) {
        const html = fs.readFileSync(page, 'utf8');
        assert.match(html, /<link rel="stylesheet" href="\.\.\/css\/mascots\.css">/, page);
        assert.match(html, /<script src="\.\.\/js\/mascots\.js"><\/script>/, page);
    }
    const options = fs.readFileSync('html/tab-view.html', 'utf8');
    assert.match(options, /<select id="ftCompanionMode"[^>]*>\s*<option value="lively"[^>]*>Lively<\/option>\s*<option value="quiet"[^>]*selected>Quiet<\/option>\s*<option value="off"[^>]*>Off<\/option>/);
    assert.match(fs.readFileSync('js/tab-view.js', 'utf8'), /window\.FilterTubeMascots\?\.celebrateImport\?\.\(\);/);
    assert.match(fs.readFileSync('js/background.js', 'utf8'), /ftMascotWelcomePending: true/);
});

test('Kagaz joins only the blocked-list empty states RenderEngine draws, not searches or allow lists', () => {
    const { Mascots } = load();
    const node = key => ({ __ftRendererCopy: { textContent: { key } }, querySelector: () => null });
    assert.equal(Mascots.emptyListKind(node('render.emptyKeywordsBlocked')), 'keywords');
    assert.equal(Mascots.emptyListKind(node('render.emptyChannelsBlocked')), 'channels');
    assert.equal(Mascots.emptyListKind(node('render.emptyKeywordsFound')), null);
    assert.equal(Mascots.emptyListKind(node('render.emptyChannelsAllowed')), null);
    assert.equal(Mascots.emptyListKind({ querySelector: () => null }), null);
    const renderer = fs.readFileSync('js/render_engine.js', 'utf8');
    assert.match(renderer, /\['render\.emptyKeywordsBlocked', 'No keywords blocked'\]/);
    assert.match(renderer, /\['render\.emptyChannelsBlocked', 'No channels blocked'\]/);
    assert.match(renderer, /emptyState\.className = minimal \? 'empty-state' : 'empty-state-large';/, 'only the options page uses the large empty state');
});

test('the hidden counter keeps a running total that survives the daily reset', () => {
    const bridge = fs.readFileSync('js/content_bridge.js', 'utf8');
    assert.match(bridge, /statsCountToday\+\+;\s*statsTotalHiddenDelta\+\+;/);
    assert.match(bridge, /statsCountToday = Math\.max\(0, statsCountToday - 1\);\s*statsTotalHiddenDelta--;/);
    assert.match(bridge, /nextStats\.totalHiddenCount = Math\.max\(0, previousTotal \+ statsTotalHiddenDelta\);\s*statsTotalHiddenDelta = 0;/);
});

test('mascot images are WebP and stay under the 250 KB budget', () => {
    const { Mascots } = load();
    const assets = plain(Mascots.ASSETS);
    const names = [assets.bindu, assets.kritiLogo, assets.kritiAllow, assets.kagazNote, assets.moharStamp, ...assets.sieve];
    let total = 0;
    for (const name of names) {
        assert.match(name, /\.webp$/);
        const file = path.join('assets/images/mascots', name);
        assert.ok(fs.existsSync(file), `${file} exists`);
        total += fs.statSync(file).size;
    }
    const folder = fs.readdirSync('assets/images/mascots').reduce((sum, name) => sum + fs.statSync(path.join('assets/images/mascots', name)).size, 0);
    assert.equal(folder, total, 'no unused images ship');
    assert.ok(total < 250 * 1024, `${total} bytes`);
});
