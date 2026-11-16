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
        // A new sentence may start with a capital ("Nothing here. Try fewer words.").
        assert.doesNotMatch(sample.slice(1).replace(/[.!?]\s+[A-Z]/g, '. x'), /\b(?!I\b|I'll\b)[A-Z][a-z]+/, `${key} has no title-case words`);
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

test('Kriti peeks over empty blocked lists and Uljhan shrugs at an empty search; allow lists stay plain', () => {
    const { Mascots } = load();
    const node = key => ({ __ftRendererCopy: { textContent: { key } }, querySelector: () => null });
    assert.equal(Mascots.emptyListKind(node('render.emptyKeywordsBlocked')), 'keywords');
    assert.equal(Mascots.emptyListKind(node('render.emptyChannelsBlocked')), 'channels');
    assert.equal(Mascots.emptyListKind(node('render.emptyKeywordsFound')), 'search');
    assert.equal(Mascots.emptyListKind(node('render.emptyChannelsFound')), 'search');
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

test('mascot images are WebP, Kriti and Uljhan only, none unused, under the 900 KB budget', () => {
    const { Mascots } = load();
    const assets = plain(Mascots.ASSETS);
    // Kriti and Uljhan only (aKriti brand library); "duo" sheets show the two together. The counter mark is a doodle.
    assert.deepEqual(Object.keys(assets).filter(key => !['counterMark', 'sieve'].includes(key)).map(key => key.replace(/[A-Z].*$/, '')).filter((v, i, a) => a.indexOf(v) === i).sort(), ['duo', 'kriti', 'uljhan']);
    assert.equal(assets.counterMark, '../doodles/sparkle.webp');
    const names = Object.entries(assets).filter(([key]) => key !== 'counterMark').flatMap(([, value]) => [].concat(value));
    let total = 0;
    for (const name of names) {
        assert.match(name, /^(kriti|uljhan|duo)_[a-z0-9_]+\.webp$/);
        const file = path.join('assets/images/mascots', name);
        assert.ok(fs.existsSync(file), `${file} exists`);
        total += fs.statSync(file).size;
        // Lossy-with-alpha or lossless WebP: every pose is cut out (no white card behind it on navy).
        const header = fs.readFileSync(file).subarray(0, 32);
        assert.equal(header.toString('latin1', 8, 12), 'WEBP', file);
        const chunk = header.toString('latin1', 12, 16);
        assert.ok(chunk === 'VP8L' || (chunk === 'VP8X' && (header[20] & 0x10) !== 0), `${file} carries transparency`);
    }
    const folder = fs.readdirSync('assets/images/mascots').reduce((sum, name) => sum + fs.statSync(path.join('assets/images/mascots', name)).size, 0);
    assert.equal(folder, total, 'no unused images ship');
    assert.ok(total < 900 * 1024, `${total} bytes`);
    for (const forbidden of ['kagaz', 'mohar', 'phoolu', 'bindu_', 'rekha']) {
        assert.equal(fs.readdirSync('assets/images/mascots').some(name => name.includes(forbidden)), false, forbidden);
    }
});

test('sounds are off by default; Gentle plays big moments only, Playful adds taps and pops', async () => {
    const { Mascots } = load();
    assert.equal(Mascots.normalizeSoundMode(undefined), 'off');
    assert.equal(Mascots.normalizeSoundMode('LOUD'), 'off');
    assert.equal(await Mascots.loadSoundMode(), 'off', 'nothing stored means off');
    for (const name of Object.keys(plain(Mascots.SOUND_FILES))) assert.equal(Mascots.soundAllowed('off', name), false, name);
    assert.equal(Mascots.soundAllowed('gentle', 'success'), true);
    assert.equal(Mascots.soundAllowed('gentle', 'celebrate'), true);
    assert.equal(Mascots.soundAllowed('gentle', 'select'), false, 'Gentle has no taps');
    assert.equal(Mascots.soundAllowed('playful', 'select'), true);
    assert.equal(Mascots.soundAllowed('playful', 'nope'), false);
    assert.equal(Mascots.playSound('success'), false, 'off plays nothing');
    const stored = load({ ftUiSounds: 'gentle' });
    assert.equal(await stored.Mascots.loadSoundMode(), 'gentle');
    let total = 0;
    for (const file of Object.values(plain(Mascots.SOUND_FILES))) {
        const full = path.join('assets/sounds', file);
        assert.ok(fs.existsSync(full), full);
        total += fs.statSync(full).size;
    }
    assert.ok(total < 64 * 1024, `${total} bytes of sound`);
    const options = fs.readFileSync('html/tab-view.html', 'utf8');
    assert.match(options, /<select id="ftUiSounds"[^>]*>\s*<option value="off"[^>]*selected>Off<\/option>\s*<option value="gentle"[^>]*>Gentle<\/option>\s*<option value="playful"[^>]*>Playful<\/option>/);
    assert.match(fs.readFileSync('js/ui_components.js', 'utf8'), /window\.FilterTubeMascots\?\.playSound\?\.\(sound\)/, 'toasts start the optional sound');
});

test('moments use Kriti or Uljhan only, and the Companion Off setting leaves the words alone', () => {
    const { Mascots } = load();
    const moments = plain(Mascots.MOMENTS);
    for (const [kind, spec] of Object.entries(moments)) {
        assert.ok(['Kriti', 'Uljhan'].includes(spec.character), kind);
        assert.ok(plain(Mascots.ASSETS)[spec.image], `${kind} has art`);
        assert.match(Mascots.stillImage(spec.image), /\.webp$/, `${kind} rests on a still`);
        assert.equal(spec.character === 'Uljhan', /^uljhan/.test(spec.image), `${kind} art matches its character`);
    }
    assert.equal(moments.noMatches.character, 'Uljhan', 'nothing found is Uljhan\'s');
    assert.equal(moments.loading.character, 'Uljhan', 'Uljhan fetches while a list loads');
    assert.equal(moments.break.character, 'Kriti');
    assert.equal(moments.offline.character, 'Uljhan');
    // Without a document (or with Companion Off) there is no character to draw.
    assert.equal(Mascots.moment('loading'), null);
    for (const locale of fs.readdirSync('data/ui_locales').filter(name => /^[a-z]{2,3}(-[A-Za-z]+)?\.json$/.test(name) && name !== 'targets.json')) {
        const catalog = JSON.parse(fs.readFileSync(path.join('data/ui_locales', locale), 'utf8'));
        for (const key of ['mascot.moment.loading', 'mascot.moment.noMatches', 'mascot.moment.error', 'mascot.sounds.title',
            'mascot.sounds.off', 'mascot.sounds.gentle', 'mascot.sounds.playful', 'mascot.sounds.description', 'profiles.emptyTitle', 'profiles.addKids']) {
            assert.equal(typeof catalog[key], 'string', `${locale} ${key}`);
        }
    }
});

test('sheets play once and rest on their last frame; reduced motion shows only that still', () => {
    const { Mascots } = load();
    const assets = plain(Mascots.ASSETS);
    for (const [sheet, still] of Object.entries(plain(Mascots.SHEET_STILL))) {
        assert.ok(Array.isArray(assets[sheet]) && assets[sheet].length >= 5, sheet);
        assert.equal(still, assets[sheet].length - 1, `${sheet} rests on its last frame`);
        assert.deepEqual(plain(Mascots.sheetFrames(sheet, false)), assets[sheet].map((_, index) => index));
        assert.deepEqual(plain(Mascots.sheetFrames(sheet, true)), [still]);
        assert.equal(Mascots.stillImage(sheet), assets[sheet][still]);
    }
    assert.deepEqual(plain(Mascots.sheetFrames('nope', false)), []);
    assert.equal(Mascots.SHEET_FRAME_MS, 180);
});

test('a loading line never repeats one of the last three', () => {
    const { Mascots } = load();
    const lines = plain(Mascots.LOADING_LINES);
    assert.equal(lines.length, 6);
    for (let first = 0; first < lines.length; first++) {
        for (const roll of [0, 0.34, 0.67, 0.999]) {
            const recent = [first, (first + 1) % 6, (first + 2) % 6];
            const next = Mascots.pickLoadingLine(recent, () => roll);
            assert.equal(recent.includes(next), false, `${recent} then ${next}`);
        }
    }
    assert.ok(Mascots.pickLoadingLine([], () => 0) >= 0);
    assert.ok(Mascots.pickLoadingLine('nope', () => 0.5) < lines.length);
});

test('the connection strip: offline, back online once, slow, otherwise nothing', () => {
    const { Mascots } = load();
    assert.equal(Mascots.networkState('ok', { online: false }), 'offline');
    assert.equal(Mascots.networkState('offline', { online: false }), 'offline');
    assert.equal(Mascots.networkState('offline', { online: true }), 'restored');
    assert.equal(Mascots.networkState('restored', { online: true }), 'ok', 'back online shows once');
    assert.equal(Mascots.networkState('ok', { online: true, effectiveType: '2g' }), 'slow');
    assert.equal(Mascots.networkState('ok', { online: true, effectiveType: 'slow-2g' }), 'slow');
    assert.equal(Mascots.networkState('ok', { online: true, effectiveType: '4g' }), 'ok');
    assert.equal(Mascots.networkState('ok'), 'ok');
});

test('support variants rotate, keep to their hours, and always say free and optional', () => {
    const { Mascots } = load();
    const variants = plain(Mascots.SUPPORT_VARIANTS);
    const ids = variants.map(variant => variant.id);
    assert.deepEqual(ids, ['classic', 'sieve', 'onePerson', 'morning', 'evening']);
    assert.equal(Mascots.pickSupportVariant([], 9).id, 'classic', 'the first one ever is classic');
    assert.equal(Mascots.pickSupportVariant(undefined, 9).id, 'classic');
    for (const hour of [0, 3, 4, 5, 11, 12, 17, 18, 23]) {
        for (const roll of [0, 0.25, 0.5, 0.75, 0.999]) {
            for (const history of [['classic'], ['classic', 'sieve'], ['sieve', 'onePerson'], ['morning', 'classic'], ['evening', 'sieve']]) {
                const picked = Mascots.pickSupportVariant(history, hour, 'quiet', () => roll);
                assert.equal(history.slice(-Mascots.SUPPORT_REMEMBERED).includes(picked.id), false, `${history} at ${hour}: ${picked.id}`);
                if (picked.time === 'morning') assert.ok(hour >= 5 && hour < 12, `morning at ${hour}`);
                if (picked.time === 'evening') assert.ok(hour >= 18 || hour < 4, `evening at ${hour}`);
                const plainOne = Mascots.pickSupportVariant(history, hour, 'off', () => roll);
                assert.equal(plainOne.characters, false, 'with the Companion off, no variant names a character');
            }
        }
    }
    assert.deepEqual(plain(Mascots.rememberSupportVariant(['classic', 'sieve'], 'onePerson')), ['sieve', 'onePerson']);
    assert.deepEqual(plain(Mascots.rememberSupportVariant(null, 'classic')), ['classic']);
    const copy = plain(Mascots.SUPPORT_COPY);
    const assets = plain(Mascots.ASSETS);
    for (const variant of variants) {
        assert.match(Mascots.stillImage(variant.image), /^kriti_/, `${variant.id} is Kriti's`);
        assert.ok(assets[variant.image], variant.id);
        const { title, body, note } = copy[variant.id];
        // Every note says, in its own voice, that it is free and that support is the person's choice.
        assert.match(note[1], /\bfree\b/i, `${variant.id} says free`);
        assert.match(note[1], /optional|up to you|if you'd like/i, `${variant.id} says optional`);
        const all = `${title[1]} ${body[1]} ${note[1]}`;
        assert.equal(/Kriti|Uljhan/.test(all), variant.characters, `${variant.id} names a character only when marked`);
        // Device sync uses a small relay, so the copy may say "no servers keeping your data", never "no servers".
        assert.doesNotMatch(all.replace(/no servers keeping your data/g, ''), /no servers?\b|no data on servers/i, variant.id);
        assert.doesNotMatch(all, /open source|unlock|premium/i, variant.id);
    }
});

test('the new lines are in every interface catalog and never name the site or another character', () => {
    const { Mascots } = load();
    const pairs = [
        ...plain(Mascots.LOADING_LINES), ...Object.values(plain(Mascots.NETWORK_COPY)), ...Object.values(plain(Mascots.DUO_COPY)),
        plain(Mascots.SESSION_SAVED), ...Object.values(plain(Mascots.SUPPORT_COPY)).flatMap(entry => Object.values(entry))
    ];
    assert.equal(pairs.length, 6 + 4 + 3 + 1 + 15);
    const directory = 'data/ui_locales';
    const targets = JSON.parse(fs.readFileSync(path.join(directory, 'targets.json'), 'utf8')).locales.map(entry => entry.code);
    const english = JSON.parse(fs.readFileSync(path.join(directory, 'en.json'), 'utf8'));
    const placeholders = value => [...String(value).matchAll(/\{([a-zA-Z]+)\}/g)].map(match => match[1]).sort().join(',');
    for (const [key, fallback] of pairs) assert.equal(english[key], fallback, `${key}: the code fallback matches the English catalog`);
    assert.equal(english['navigation.donate'], 'Support');
    for (const code of targets) {
        const catalog = JSON.parse(fs.readFileSync(path.join(directory, `${code}.json`), 'utf8'));
        for (const [key] of [...pairs, ['navigation.donate']]) {
            assert.equal(typeof catalog[key], 'string', `${code}: missing ${key}`);
            assert.ok(catalog[key].trim(), `${code}: empty ${key}`);
            assert.equal(placeholders(catalog[key]), placeholders(english[key]), `${code}: placeholders changed in ${key}`);
            assert.doesNotMatch(catalog[key], /youtube|\b(kagaz|mohar|phoolu|bindu|rekha)\b/i, `${code}: ${key}`);
        }
        // Nigerian Pidgin shares some short titles with English word for word.
        if (code !== 'en' && code !== 'pcm') {
            const same = pairs.filter(([key]) => !['mascot.about.title'].includes(key) && catalog[key] === english[key]).map(([key]) => key);
            assert.deepEqual(same, [], `${code}: left in English`);
        }
    }
});
