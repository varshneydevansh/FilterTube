// The options page's Home (js/dashboard_home.js) and "What Uljhan tried today" (js/shared/hidden_log.js):
// the greeting, the Study today card, the sidebar counts, the bounded hidden log and what Allow does.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Log = require('../../js/shared/hidden_log.js');
const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function home() {
  const box = { console, Intl, window: null };
  box.window = box;
  box.document = { readyState: 'complete', querySelector: () => null, getElementById: () => null, documentElement: { lang: 'en' } };
  vm.createContext(box);
  vm.runInContext(read('js/dashboard_home.js'), box);
  return box.FilterTubeDashboardHome;
}

const at = (h, m = 0) => new Date(2026, 10, 17, h, m).getTime();

test('the hidden log keeps the last 30, one entry per video a day, newest last', () => {
  let log = [];
  for (let i = 0; i < 40; i += 1) log = Log.push(log, { at: at(9) + i * 1000, videoId: `vid${String(i).padStart(8, '0')}`, title: `Video ${i}`, reason: 'keyword' });
  assert.equal(log.length, Log.MAX);
  assert.equal(log[0].title, 'Video 10');
  assert.equal(log.at(-1).title, 'Video 39');
  const again = Log.push(log, { at: at(10), videoId: 'vid00000020', title: 'Video 20', reason: 'channel' });
  assert.equal(again.length, Log.MAX);
  assert.equal(again.filter(item => item.videoId === 'vid00000020').length, 1);
  assert.equal(again.at(-1).reason, 'channel', 'the newest hide of a video wins');
});

test('the hidden log drops what it cannot show and never keeps more than it needs', () => {
  assert.equal(Log.entry({ at: at(9) }), null, 'no title and no video');
  const item = Log.entry({ at: at(9), title: '  A   title  ', videoId: 'not-an-id', channelId: 'nope', handle: 'bad handle', reason: 'weird', surface: 'x' });
  assert.deepEqual({ ...item }, { at: at(9), day: '2026-11-17', videoId: '', title: 'A title', channel: '', channelId: '', handle: '', reason: 'keyword', surface: 'main' });
  assert.equal(Log.entry({ title: 'x'.repeat(500) }).title.length, 140);
});

test('which rule hid a card: channel lines, content controls, allow mode, else a keyword', () => {
  assert.equal(Log.classify('Blocked channel: @x'), 'channel');
  assert.equal(Log.classify('Pending channel block: @x'), 'channel');
  assert.equal(Log.classify('Duration filter: A video'), 'control');
  assert.equal(Log.classify('Shorts hidden globally'), 'control');
  assert.equal(Log.classify('Mix/radio hidden: Mix'), 'control');
  assert.equal(Log.classify('Content: A video', { listMode: 'whitelist' }), 'allowOnly');
  assert.equal(Log.classify('Content: A video', { channelBlocked: true }), 'channel');
  assert.equal(Log.classify('Content: A video'), 'keyword');
  assert.equal(Log.videoIdFromHref('/watch?v=abcdefghijk&t=3'), 'abcdefghijk');
  assert.equal(Log.videoIdFromHref('/shorts/abcdefghijk'), 'abcdefghijk');
  assert.equal(Log.videoIdFromHref('/@someone'), '');
});

test('today\'s list is newest first and only today', () => {
  const log = Log.push([], [
    { at: at(8), videoId: 'aaaaaaaaaaa', title: 'Morning', reason: 'keyword' },
    { at: at(8) - 86400000, videoId: 'bbbbbbbbbbb', title: 'Yesterday', reason: 'keyword' },
    { at: at(9), videoId: 'ccccccccccc', title: 'Later', reason: 'channel' }
  ]);
  assert.deepEqual(Log.today(log, at(12)).map(item => item.title), ['Later', 'Morning']);
  assert.deepEqual(Log.today(log, at(12), 1).map(item => item.title), ['Later']);
});

test('Allow is a precise exception for that one video; a content control opens Content Controls', () => {
  const keyword = Log.entry({ at: at(9), videoId: 'aaaaaaaaaaa', title: 'A', reason: 'keyword', surface: 'kids' });
  assert.deepEqual({ ...Log.allowAction(keyword) }, { kind: 'allowVideo', videoId: 'aaaaaaaaaaa', surface: 'kids' });
  assert.deepEqual({ ...Log.allowAction({ ...keyword, reason: 'control' }) }, { kind: 'openControls' });
  assert.equal(Log.allowAction({ title: 'No video', reason: 'channel' }), null);
  const surface = { mode: 'blocklist', keywords: [{ word: 'prank' }] };
  const next = Log.withAllowedVideo(surface, 'aaaaaaaaaaa');
  assert.deepEqual(next.allowedVideoIds, ['aaaaaaaaaaa']);
  assert.deepEqual(next.keywords, surface.keywords, 'the blocked word stays');
  assert.equal(Log.withAllowedVideo(next, 'aaaaaaaaaaa'), next, 'once');
  assert.equal(Log.withAllowedVideo(next, 'bad'), next);
  assert.deepEqual(Log.without([keyword], 'aaaaaaaaaaa'), []);
  // An allowed video id outranks a blocked word or channel in the page filter (specificity 3).
  assert.match(read('js/content/dom_fallback.js'), /const allowSpecificity = explicitlyAllowed \? 3 :/);
});

test('hides are logged where they are counted, on this device only', () => {
  const bridge = read('js/content_bridge.js');
  assert.match(bridge, /function incrementHiddenStats\(element, reason = ''\)/);
  assert.match(bridge, /const logged = hiddenLogEntryFor\(element, title, reason\);/);
  assert.match(bridge, /payload\[logKey\] = globalThis\.FilterTubeHiddenLog\.push\(safeResult\[logKey\], logItems\);/);
  assert.equal((read('js/content/dom_helpers.js').match(/incrementHiddenStats\(element, reason\);/g) || []).length, 2);
  assert.doesNotMatch(read('js/shared/hidden_log.js'), /fetch\(|XMLHttpRequest|sendBeacon/);
  for (const manifest of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.match(read(manifest), /"js\/shared\/hidden_log\.js", "js\/content_bridge\.js"/, manifest);
  }
});

test('the greeting follows the time of day, and Study today reads the plan', () => {
  const Home = home();
  assert.equal(Home.partOfDay(4), 'evening');
  assert.equal(Home.partOfDay(5), 'morning');
  assert.equal(Home.partOfDay(12), 'afternoon');
  assert.equal(Home.partOfDay(18), 'evening');
  assert.equal(Home.studyToday(null).kind, 'setup');
  assert.equal(Home.studyToday({ study: { plan: null } }).kind, 'setup');
  const now = at(15);
  const plan = { study: { plan: { days: ['tue'], start: '16:00', end: '18:30' } }, todayMinutes: 50, next: { at: at(16) } };
  const view = Home.studyToday(plan, now);
  assert.equal(view.kind, 'plan');
  assert.equal(view.planned, 150);
  assert.equal(view.today, true, '17 November 2026 is a Tuesday');
  assert.equal(view.nextAt, at(16));
  assert.equal(view.progress, 50 / 150);
  assert.equal(Home.studyToday({ ...plan, study: { plan: { ...plan.study.plan, days: ['sat'] } } }, now).today, false);
  const running = Home.studyToday({ ...plan, state: 'STUDY', until: at(16, 30) }, now);
  assert.equal(running.studying, true);
  assert.equal(running.until, at(16, 30));
});

test('the sidebar rows count like the tiles did: Filters and Kids add up, Content Controls has one', () => {
  const Home = home();
  assert.equal(Home.navCount('filters', 'Channels: 1 · Keywords: 3'), 4);
  assert.equal(Home.navCount('kids', 'No rules yet'), 0);
  assert.equal(Home.navCount('content', 'Turned on: 2'), 2);
  assert.equal(Home.navCount('study', 'Self-Control is off'), null);
  assert.equal(Home.navCount('plain', 'Auto backup off'), null);
});

test('Home replaces the tile grid and keeps the wiring the page already has', () => {
  const html = read('html/tab-view.html');
  assert.match(html, /<div id="dashboardView" class="view-section active" data-ft-home>/);
  for (const id of ['ftHomeHello', 'ftHomeKept', 'ftHomeDuo', 'ftDashProfileAvatar', 'ftDashSwitchProfile', 'dashboardStatsMainBtn', 'dashboardStatsKidsBtn',
    'statHiddenToday', 'statSavedTime', 'statActiveKeywords', 'statFilteredChannels', 'ftHomeStudyBody', 'ftHomeTriedList',
    'quickAddKeywordBtn', 'quickAddChannelBtn', 'quickStartStudyBtn', 'quickKidsModeBtn', 'ftControlCenterApps', 'dashboardLocalPlaylists']) {
    assert.ok(html.includes(`id="${id}"`), id);
  }
  for (const tint of ['home', 'filters', 'content', 'kids', 'study', 'family', 'plain']) assert.match(html, new RegExp(`data-pk-tint="${tint}"`));
  assert.equal((html.match(/nav-item nav-item--quiet/g) || []).length, 4);
  assert.match(html, /<script src="\.\.\/js\/shared\/hidden_log\.js"><\/script>\n\s*<script src="\.\.\/js\/dashboard_home\.js"><\/script>/);
  assert.match(read('js/paperkit_parity.js'), /view\.hasAttribute\('data-ft-home'\)/);
  // The iOS card: sideload guide while Apple reviews the developer account.
  const tab = read('js/tab-view.js');
  assert.match(tab, /href: 'https:\/\/filtertube\.in\/ios'/);
  assert.match(html, /href="https:\/\/ko-fi\.com\/filtertube"/);
});

test('About tells the Kriti and Uljhan story and keeps open source straight', () => {
  const html = read('html/tab-view.html');
  const story = html.slice(html.indexOf('<section class="ft-about-duo" data-ft-duo-story'), html.indexOf('<div class="ft-about-feature-grid">'));
  assert.match(story, /Kriti is my sister/);
  assert.match(story, /Uljhan means tangle, or confusion, in Hindi\. He isn't evil\./);
  assert.match(story, /This browser extension is open source; the phone and TV apps are not\./);
  assert.match(story, /no servers keep your data and there's no FilterTube sign-up/);
  assert.match(story, /duo_sieve_06\.webp/);
});

test('during a study session the greeting and the Home and Filters rows say Study (the effective mode)', () => {
  const source = read('js/dashboard_home.js');
  assert.match(source, /FilterTubeEffectiveMode\?\.effectiveModeFor\?\.\(own, state, Date\.now\(\)\)/);
  assert.match(source, /const studyRows = rows\.filter\(row => \['home', 'filters'\]\.includes\(row\.dataset\.pkTint\)\);/);
  assert.match(source, /modeLine\.textContent = text \? text\.title : '';/);
  // Quiet links and tinted rows keep their height in the fixed-height sidebar column.
  assert.match(read('css/dashboard-home.css'), /\.nav-item\.nav-item--quiet \{ flex-shrink: 0 !important; \}/);
});
