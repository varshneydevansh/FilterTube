// The narrowed mode (Allowed only and Study): one decision per page, the left pane, the page CSS and the
// mode bar (js/shared/narrowed_mode.js), and how the page scripts use it.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Mode = require('../../js/shared/narrowed_mode.js');

const exact = word => ({ pattern: `(^|[^\\p{L}\\p{N}_])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}_])`, flags: 'iu', titleOnly: true });
const ALLOW = {
    enabled: true,
    listMode: 'whitelist',
    whitelistChannels: [
        { id: 'UC4a-Gbdw7vOaccHmFo40b9g', handleDisplay: '@khanacademy', name: 'Khan Academy', source: 'user' },
        { id: 'UCYO_jab_esuFRV4b17AJtAw', handle: '@3blue1brown', name: '3Blue1Brown' },
        { name: 'Name only' }
    ],
    whitelistKeywords: [exact('calculus'), { pattern: 'tor(t|ts)', flags: 'i' }]
};
const STUDY = {
    ...ALLOW,
    whitelistChannels: [...ALLOW.whitelistChannels, { id: 'UCwSrz4e55Y6fnHiPUmXXIzg', handle: '@egmat', name: 'e-GMAT', source: 'study_pack' }],
    whitelistKeywords: [exact('sat'), exact('gmat'), exact('critical reasoning')],
    study: { phase: 'study', state: 'STUDY', packIds: ['us_sat', 'global_gmat'], round: 1, rounds: 2, source: 'session',
        endPolicy: { canEnd: true, pauseMs: 30000 }, endRequestedAt: null, until: 1_000_000 + 52 * 60000 }
};

test('modeOf: none, allowed only, study and a rest break', () => {
    assert.equal(Mode.modeOf(null).kind, 'none');
    assert.equal(Mode.modeOf({ enabled: true, listMode: 'blocklist' }).kind, 'none');
    assert.equal(Mode.modeOf({ ...ALLOW, enabled: false }).kind, 'none', 'FilterTube off narrows nothing');
    const allow = Mode.modeOf(ALLOW);
    assert.equal(allow.kind, 'allow');
    assert.deepEqual(allow.channels.map(ch => ch.handle), ['@khanacademy', '@3blue1brown'], 'rows without an id or handle are left out');
    assert.deepEqual(allow.words, ['calculus'], 'only plain words; a real pattern is not a word');
    const study = Mode.modeOf(STUDY);
    assert.equal(study.kind, 'study');
    assert.equal(study.channels.find(ch => ch.handle === '@egmat').plan, true);
    assert.equal(study.channels.find(ch => ch.handle === '@khanacademy').plan, false, 'the person\'s own allowed channel stays (Android studyProfile)');
    assert.equal(Mode.modeOf({ ...STUDY, study: { phase: 'rest' } }).kind, 'rest', 'a break is the study overlay\'s');
    assert.notEqual(Mode.modeOf(ALLOW).key, study.key);
});

test('pageOf names every page the layer handles', () => {
    const cases = { '/': 'home', '/results': 'search', '/watch': 'watch', '/live/abc': 'watch', '/shorts/x': 'shorts',
        '/feed/subscriptions': 'subscriptions', '/feed/history': 'history', '/feed/trending': 'feed', '/playlist': 'playlist',
        '/@egmat': 'channel', '/@egmat/videos': 'channel', '/channel/UC4a-Gbdw7vOaccHmFo40b9g': 'channel', '/c/khan': 'channel', '/account': 'other' };
    for (const [path, page] of Object.entries(cases)) assert.equal(Mode.pageOf(path), page, path);
});

test('pagePlan is the behaviour table: one decision per page and mode', () => {
    const none = Mode.modeOf(null);
    for (const page of ['home', 'search', 'watch', 'channel']) {
        const plan = Mode.pagePlan(none, page);
        assert.equal(plan.narrowed, false);
        assert.ok(!plan.builtFeed && !plan.hideSiteFeed && !plan.modeBar && !plan.holdChannel && !plan.guide, `${page}: the site's page as it is`);
    }
    for (const settings of [ALLOW, STUDY]) {
        const mode = Mode.modeOf(settings);
        const home = Mode.pagePlan(mode, 'home');
        assert.ok(home.builtFeed && home.hideSiteFeed && home.modeBar && home.guide, 'Home: the built feed owns the body');
        const search = Mode.pagePlan(mode, 'search');
        assert.ok(search.searchShelf && search.searchLine && search.hideSearchShelves && !search.builtFeed);
        const watch = Mode.pagePlan(mode, 'watch');
        assert.ok(watch.modeBar && !watch.builtFeed && !watch.holdChannel);
        assert.ok(Mode.pagePlan(mode, 'channel').holdChannel);
        assert.equal(home.studyCopy, mode.kind === 'study');
    }
    assert.equal(Mode.pagePlan(Mode.modeOf({ ...STUDY, study: { phase: 'rest' } }), 'home').builtFeed, false, 'a break is not narrowed here');
});

test('channelInMode and whyShown: the plan, the person\'s own channels, a topic as the title writes it', () => {
    const study = Mode.modeOf(STUDY);
    assert.equal(Mode.channelInMode(study, { id: 'UCwSrz4e55Y6fnHiPUmXXIzg' }), true);
    assert.equal(Mode.channelInMode(study, { handle: 'EGMAT' }), true, 'handles match without case or @');
    assert.equal(Mode.channelInMode(study, { handle: '@learn-with-mrinal' }), false);
    assert.equal(Mode.channelInMode(Mode.modeOf(null), { handle: '@egmat' }), false);
    assert.equal(Mode.whyShown(study, { channelHandle: '@egmat', title: 'GMAT 740' }).kind, 'plan');
    assert.equal(Mode.whyShown(study, { channelId: 'UC4a-Gbdw7vOaccHmFo40b9g', title: 'x' }).kind, 'own');
    const topic = Mode.whyShown(study, { channelHandle: '@learn-with-mrinal', title: 'How I scored a 740 on the GMAT' });
    assert.deepEqual([topic.kind, topic.word], ['word', 'GMAT']);
    assert.equal(Mode.whyShown(study, { title: 'GMAT Critical Reasoning drills' }).word, 'Critical Reasoning', 'the longest topic reads best');
    assert.equal(Mode.whyShown(study, { title: 'Saturday cooking' }).kind, 'none', 'whole words only');
});

test('guideSectionKind: Explore, the product links and the site\'s channel list go; the rest stays', () => {
    assert.equal(Mode.guideSectionKind(['/', null, '/feed/subscriptions', '/feed/you', '/feed/history']), 'keep');
    assert.equal(Mode.guideSectionKind(['/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ', '/feed/storefront?bp=ogUCKAU%3D', '/channel/UC4R8DWoMoI7CAwX8_LjQHig']), 'explore');
    assert.equal(Mode.guideSectionKind(['/feed/trending', '/gaming']), 'explore');
    assert.equal(Mode.guideSectionKind(['/premium', 'https://music.youtube.com/', 'https://www.youtubekids.com/?source=youtube_web', '/labs']), 'more');
    assert.equal(Mode.guideSectionKind(['/feed/channels', '/@mkbhd', '/channel/UCBJycsmduvYEL83R_U4JriQ']), 'subscriptions');
    assert.equal(Mode.guideSectionKind(['/reporthistory']), 'keep');
    assert.equal(Mode.guideSectionKind([]), 'keep');
    const study = Mode.modeOf(STUDY);
    assert.equal(Mode.guideSectionAction(study, 'explore'), 'hide');
    assert.equal(Mode.guideSectionAction(study, 'more'), 'hide');
    assert.equal(Mode.guideSectionAction(study, 'subscriptions'), 'hide');
    assert.equal(Mode.guideSectionAction(study, 'keep'), 'show');
    assert.equal(Mode.guideSectionAction(Mode.modeOf(null), 'explore'), 'show', 'restored when the mode ends');
});

test('narrowedCss: every rule is gated on the mode attribute, Home hides the site grid and its chip bar only', () => {
    const css = Mode.narrowedCss('data-ft-n', { guideId: 'g' });
    const rules = css.split('\n').filter(Boolean);
    for (const rule of rules) assert.match(rule, /html(\[data-ft-n\]|:not\(\[data-ft-n\]\))/, rule);
    assert.match(css, /\[data-ft-n-page="home"\] ytd-browse\[page-subtype="home"\] ytd-rich-grid-renderer,/);
    assert.match(css, /ytd-feed-filter-chip-bar-renderer/);
    assert.match(css, /#frosted-glass\.with-chipbar\{height:/, 'the chip bar\'s backdrop shrinks, it never covers the feed');
    assert.match(css, /\[data-ft-n-page="search"\] ytd-search grid-shelf-view-model/);
    assert.match(css, /a\[href="\/feed\/storefront"\]/);
    assert.match(css, /a\[href\*="music\.youtube\.com"\]/);
    assert.match(css, /\[data-ft-n-done\] ytd-continuation-item-renderer/);
    assert.match(css, /html:not\(\[data-ft-n\]\) #g\{display:none!important\}/);
    assert.doesNotMatch(css, /ytd-rich-item-renderer\{/, 'cards are the filters\' business, not the layer\'s');
    const shelves = Mode.emptyShelfCss();
    assert.match(shelves, /grid-shelf-view-model:not\(:has\(\.ytGridShelfViewModelGridShelfRow > :not\(\[data-filtertube-hidden\]\)/);
    assert.match(shelves, /ytd-rich-shelf-renderer:not\(:has\(/);
});

test('modeBarModel: Allowed only; Study with the round, minutes left and End by the lock rules', () => {
    const now = 1_000_000;
    const allow = Mode.modeBarModel(Mode.modeOf(ALLOW), null, { kind: 'own' }, { now });
    assert.equal(allow.kind, 'allow');
    assert.equal(allow.label.fallback, 'Allowed only');
    assert.equal(allow.reason.key, 'narrowed.why.own');
    assert.equal(allow.action, null);
    const mode = Mode.modeOf(STUDY);
    const bar = Mode.modeBarModel(mode, STUDY.study, { kind: 'word', word: 'GMAT' }, { now, label: 'SAT + GMAT' });
    assert.deepEqual(bar.label.values, { plan: 'SAT + GMAT' });
    assert.deepEqual(bar.detail.values, { round: 1, rounds: 2, minutes: 52 });
    assert.equal(bar.reason.key, 'narrowed.why.topic');
    assert.deepEqual(bar.action, { kind: 'end' });
    const ending = Mode.modeBarModel(mode, { ...STUDY.study, endRequestedAt: now - 10_000 }, null, { now });
    assert.deepEqual(ending.action, { kind: 'cancel', seconds: 20 });
    const locked = Mode.modeBarModel(mode, { ...STUDY.study, endPolicy: { canEnd: false, reason: 'locked' }, lockedUntil: now + 3_600_000 }, null, { now });
    assert.deepEqual(locked.action, { kind: 'locked', until: now + 3_600_000 });
    const scheduled = Mode.modeBarModel(mode, { ...STUDY.study, source: 'plan' }, null, { now });
    assert.equal(scheduled.action.kind, 'locked', 'a scheduled plan window has no End (Android)');
    const oneRound = Mode.modeBarModel(mode, { ...STUDY.study, rounds: 1 }, null, { now });
    assert.equal(oneRound.detail.key, 'study.strip.minutesLeft');
    assert.equal(Mode.modeBarModel(Mode.modeOf(null), null, null), null);
});

test('the page scripts read the one decision and redraw on events only', () => {
    const manifest = JSON.parse(fs.readFileSync('manifest.chrome.json', 'utf8'));
    const scripts = manifest.content_scripts.find(entry => entry.js.includes('js/content/allowlist_feed_view.js')).js;
    assert.ok(scripts.indexOf('js/shared/narrowed_mode.js') < scripts.indexOf('js/content/narrowed_view.js'));
    assert.ok(scripts.indexOf('js/content/narrowed_view.js') < scripts.indexOf('js/content/allowlist_feed_view.js'));
    for (const file of ['manifest.json', 'manifest.firefox.json', 'manifest.opera.json']) {
        assert.match(fs.readFileSync(file, 'utf8'), /"js\/shared\/narrowed_mode\.js", "js\/content\/narrowed_view\.js", "js\/shared\/allowlist_feed\.js"/, file);
    }
    const view = fs.readFileSync('js/content/allowlist_feed_view.js', 'utf8');
    const narrowed = fs.readFileSync('js/content/narrowed_view.js', 'utf8');
    assert.doesNotMatch(view, /setInterval/, 'the feed view no longer polls');
    assert.doesNotMatch(narrowed, /setInterval/);
    assert.match(view, /layer\.plan\.builtFeed\) return 'feed'/);
    assert.match(fs.readFileSync('js/content/bridge_settings.js', 'utf8'), /dispatchEvent\(new Event\('filtertube-settings-applied'\)\)/);
    // Every new phrase has its English catalog entry.
    const en = JSON.parse(fs.readFileSync('data/ui_locales/en.json', 'utf8'));
    const keys = new Set([...view.matchAll(/(?<![\w.])t\('([\w.]+)'/g), ...narrowed.matchAll(/(?<![\w.])t\('([\w.]+)'/g),
        ...fs.readFileSync('js/shared/narrowed_mode.js', 'utf8').matchAll(/key: '(\w+\.[\w.]+)'/g),
        ...fs.readFileSync('js/content/channel_search_shelf.js', 'utf8').matchAll(/\['([\w.]+)', '/g)].map(match => match[1]));
    for (const key of keys) assert.equal(typeof en[key], 'string', key);
});
