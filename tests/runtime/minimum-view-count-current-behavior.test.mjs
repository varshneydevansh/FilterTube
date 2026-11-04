import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function parser() { const context = {}; vm.createContext(context); vm.runInContext(read('shared/view_count'), context); return context.FilterTubeViewCount; }
const rule = { enabled: true, minViews: 500 };
for (const [label, value, count] of [
  ['zero', 0, 0], ['zero string', '0 views', 0], ['explicit no views', 'No views', 0],
  ['below minimum', '499 views', 499], ['at minimum', '500 views', 500],
  ['comma grouping', '1,234 views', 1234], ['period grouping', '1.234 Aufrufe', 1234],
  ['Indian grouping', '4,44,13,898 views', 44413898], ['narrow space grouping', '1\u202f234 vues', 1234],
  ['Arabic digits', '٤٩٩ مشاهدة', 499], ['Devanagari digits', '४९९ views', 499], ['Bengali digits', '৪৯৯ views', 499]
]) {
  test(`view parser preserves exact ${label}`, () => {
    const api = parser(), evidence = api.parse(value);
    assert.equal(evidence?.count, count); assert.equal(evidence?.exact, true);
    assert.equal(api.shouldBlock(evidence, rule), count < 500);
  });
}

test('compact counts carry conservative uncertainty instead of pretending to be exact', () => {
  const api = parser();
  for (const value of ['1.2K views', '1,2 k vues', '1,2 mil visualizaciones']) {
    const evidence = api.parse(value);
    assert.equal(evidence.count, 1200); assert.equal(evidence.exact, false);
    assert.equal(api.shouldBlock(evidence, { enabled: true, minViews: 1250 }), false);
    assert.equal(api.shouldBlock(evidence, { enabled: true, minViews: 1300 }), true);
    assert.equal(api.shouldBlock(evidence, rule), false);
  }
  assert.equal(api.parse('1.2万次播放').count, 12000);
  assert.equal(api.shouldBlock('1K+ views', { enabled: true, minViews: 1000000 }), false);
});

test('unknown, concurrent viewers, malformed values and unsafe integers never become zero', () => {
  const api = parser();
  for (const value of [null, undefined, '', '—', false, -1, NaN, Infinity, '1,2 views', '12 viewers', '438 watching now',
    '100 likes', '5 minutes ago', '500 views • 1 day ago', 'title 123 views', '9007199254740992', '1.234K views', '1,234.567 views']) {
    assert.equal(api.parse(value), null, String(value)); assert.equal(api.shouldBlock(value, rule), false, String(value));
  }
  assert.equal(api.parse('438 views', { isLive: true }), null);
  assert.equal(api.parse('438 views', { kind: 'concurrent' }), null);
  assert.equal(api.parse('438', { requireLabel: true }), null);
  assert.equal(api.parse('438 views', { requireLabel: true }).count, 438);
  for (const bad of [null, '', -1, 1.5, '1e3', Infinity]) assert.equal(api.shouldBlock('0 views', { enabled: true, minViews: bad }), false);
  assert.equal(api.shouldBlock('0 views', { enabled: false, minViews: 500 }), false);
});

function engine(settings = {}) {
  const fixture = loadFilterTubeEngine();
  vm.runInContext(read('shared/view_count'), fixture.context);
  const filter = new fixture.engine.YouTubeDataFilter({ enabled: true, contentFilters: { views: rule }, ...settings });
  return { ...fixture, filter, process: contents => filter.processData({ contents }).contents };
}
const video = (count, extra = {}) => ({ videoId: 'abcdefghijk', title: { simpleText: 'Ordinary title' },
  ...(count !== undefined ? { viewCountText: { simpleText: count } } : {}), ...extra });

test('actual JSON filtering removes only below-minimum videos with zero keyword rules and increments normal stats', () => {
  const f = engine();
  const rows = ['0 views', '499 views', '500 views', undefined, '12 watching now'].map(count => ({ videoRenderer: video(count) }));
  const output = f.process(rows);
  assert.equal(output.length, 3); assert.equal(f.filter.blockedCount, 2);
  assert.equal(output[0].videoRenderer.viewCountText.simpleText, '500 views');
  assert.deepEqual(clone(f.filter.settings.filterKeywords), []);
});

test('real captured Home count 438 is removed while mobile Indian grouping stays above 500', () => {
  const readCapture = name => JSON.parse(fs.readFileSync(new URL(`./fixtures/captures/${name}.json`, import.meta.url), 'utf8'));
  const home = readCapture('main-home-rich-video-renderer');
  const mobile = readCapture('ytm-show-sheet-collab-video-with-context-renderer');
  const f = engine();
  assert.equal(f.process([{ richItemRenderer: home.renderer }]).length, 0);
  assert.equal(f.process([{ videoWithContextRenderer: mobile.renderer }]).length, 1);
});

test('modern Home and Shorts inspect explicit view parts, not channel, title, age or unrelated digits', () => {
  const f = engine();
  const modern = value => ({ lockupViewModel: { contentId: 'abcdefghijk', contentType: 'LOCKUP_CONTENT_TYPE_VIDEO',
    metadata: { lockupMetadataViewModel: { title: { content: '500 views in the title' }, metadata: {
      contentMetadataViewModel: { metadataRows: [{ metadataParts: [{ text: { content: '123' } }, { text: { content: value } }] }] }
    } } } } });
  assert.equal(f.process([modern('438 views')]).length, 0);
  assert.equal(f.process([modern('4 days ago')]).length, 1);
  for (const renderer of ['reelItemRenderer', 'shortsLockupViewModel', 'shortsLockupViewModelV2']) {
    assert.equal(f.process([{ [renderer]: { videoId: 'abcdefghijk', onTap: { innertubeCommand: { reelWatchEndpoint: { videoId: 'abcdefghijk' } } },
      belowThumbnailMetadata: { secondaryText: { content: '438 views' } } } }]).length, 0, renderer);
  }
});

test('live/upcoming, playlists, comments and missing view counts stay unchanged; off by default preserves JSON', () => {
  const f = engine();
  const rows = [
    { videoRenderer: video('10 views', { isLive: true }) },
    { videoRenderer: video('10 views', { thumbnailOverlays: [{ thumbnailOverlayTimeStatusRenderer: { style: 'LIVE' } }] }) },
    { videoRenderer: video('0 views', { upcomingEventData: { startTime: 'future' } }) },
    { playlistRenderer: { playlistId: 'PLdemo', viewCountText: { simpleText: '3 views' } } },
    { commentRenderer: { contentText: { simpleText: '0 views' } } }, { videoRenderer: video(undefined) }
  ];
  assert.deepEqual(clone(f.process(rows)), rows);
  const input = [{ videoRenderer: video('0 views') }];
  assert.deepEqual(clone(engine({ contentFilters: {} }).process(input)), input);
});

function settingsFixture() {
  const storage = { ftProfilesV4: { schemaVersion: 4, activeProfileId: 'default', profiles: { default: {
    type: 'account', name: 'Default', settings: {}, main: { channels: [], keywords: [] },
    kids: { blockedChannels: [], blockedKeywords: [], contentFilters: {} }
  } } }, ftProfilesV3: { main: {}, kids: {} } };
  const messages = [], box = { console, setTimeout: () => 1, clearTimeout() {}, chrome: {
    runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }),
      sendMessage(message, done) { messages.push(clone(message)); done?.({ ok: true, success: true }); } },
    storage: { onChanged: { addListener() {} }, local: {
      get(keys, done) { done(keys === null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
      set(payload, done) { Object.assign(storage, clone(payload)); done?.(); },
      getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
    } }
  } };
  box.window = box; vm.createContext(box); installNanahStorageLock(box);
  for (const name of ['settings_shared', 'io_manager', 'state_manager']) vm.runInContext(read(name), box);
  return { box, storage, messages };
}

test('actual profile settings Main/Kids saves preserve views through unrelated edits, reload, backup export and locked UI', async () => {
  const f = settingsFixture(), manager = f.box.StateManager;
  await manager.loadSettings({ resetEnrichment: false, scheduleEnrichment: false });
  assert.equal(manager.getState().contentFilters.views.enabled, false);
  await manager.updateContentFilters({ views: rule });
  await manager.updateContentFilters({ uppercase: { enabled: true } });
  await manager.updateKidsContentFilters({ views: { enabled: true, minViews: 750 } });
  await manager.updateKidsContentFilters({ duration: { enabled: true, minMinutes: 2 } });
  await manager.loadSettings({ resetEnrichment: false, scheduleEnrichment: false });
  assert.deepEqual(clone(manager.getState().contentFilters.views), rule);
  assert.deepEqual(clone(manager.getState().kids.contentFilters.views), { enabled: true, minViews: 750 });
  const backup = await f.box.FilterTubeIO.exportV3({ scope: 'full' });
  assert.deepEqual(clone(backup.profilesV4.profiles.default.settings.contentFilters.views), rule);
  assert.equal(backup.profilesV4.profiles.default.kids.contentFilters.views.minViews, 750);
  const restored = settingsFixture();
  await restored.box.FilterTubeIO.importV3(backup, { scope: 'full', strategy: 'replace' });
  assert.deepEqual(clone(restored.storage.ftProfilesV4.profiles.default.settings.contentFilters.views), rule);
  assert.equal(restored.storage.ftProfilesV4.profiles.default.kids.contentFilters.views.minViews, 750);
  const before = clone(f.storage);
  f.box.FilterTubeIsUiLocked = () => true;
  await manager.updateContentFilters({ views: { enabled: false } });
  await manager.updateKidsContentFilters({ views: { enabled: false } });
  assert.deepEqual(f.storage, before);
});

test('compiled settings reject malformed enabled thresholds without dropping other content filters', () => {
  const f = settingsFixture();
  for (const minViews of [-1, '1e3', null, NaN, 1.5]) {
    const output = f.box.FilterTubeSettings.buildCompiledSettings({ contentFilters: { duration: { enabled: true }, views: { enabled: true, minViews } } });
    assert.equal(output.contentFilters.views.enabled, false);
    assert.equal(output.contentFilters.duration.enabled, true);
  }
});

test('exact-ID Player capture carries zero and changing view counts through the actual session metadata bridge', () => {
  const f = engine(), id = 'abcdefghijk';
  f.filter.processData({ videoDetails: { videoId: id, title: 'Selected video', viewCount: '0', isLiveContent: false } });
  f.flushTimers();
  const entry = f.messages.find(message => message.type === 'FilterTube_UpdateVideoMetaMap')?.payload.find(row => row.videoId === id);
  assert.equal(entry?.viewCount, '0'); assert.equal(entry?.isLive, false);
  const source = read('content_bridge'), start = source.indexOf('function persistVideoMetaMapping(');
  const body = source.slice(start, source.indexOf('\nlet pendingVideoMetaDomRerunTimer', start));
  const persisted = [], context = { currentSettings: {}, browserAPI_BRIDGE: { runtime: { sendMessage: message => persisted.push(message) } }, persistVideoChannelMapping() {} };
  vm.createContext(context); vm.runInContext(body, context);
  context.persistVideoMetaMapping([entry]);
  assert.equal(context.currentSettings.videoMetaMap[id].viewCount, '0');
  context.persistVideoMetaMapping([{ ...entry, viewCount: '900' }]);
  assert.equal(context.currentSettings.videoMetaMap[id].viewCount, '900', 'a count-only update is not dropped by metadata deduplication');
  assert.ok(persisted.every(message => message.entries.every(row => !Object.hasOwn(row, 'viewCount'))), 'volatile popularity does not enter persistent background metadata');
});

test('actual external Player metadata and admission use available totals without holding missing counts pending', () => {
  const posted = [], id = 'abcdefghijk';
  const context = { URL, URLSearchParams, Promise, setTimeout, clearTimeout, location: { href: `https://www.youtube.com/embed/${id}` },
    document: { addEventListener() {}, querySelectorAll: () => [], getElementById: () => ({
      getPlayerResponse: () => ({ videoDetails: { videoId: id, title: 'Selected', viewCount: '0' } }),
      getVideoData: () => ({ video_id: id })
    }) },
    addEventListener() {}, postMessage: message => posted.push(message),
    chrome: { runtime: { sendMessage: (_, done) => done({ enabled: false }), onMessage: { addListener() {} } }, storage: { onChanged: { addListener() {} } } }
  };
  context.window = context; vm.createContext(context);
  for (const name of ['shared/view_count', 'content/external_youtube_network', 'content/external_youtube_guard']) vm.runInContext(read(name), context);
  context.FilterTubeExternalYouTubeNetwork.acceptControlMessage({ source: 'filtertube-external-guard', type: 'FilterTube_ExternalYouTubeAdmissionControl', active: true, revision: 1 });
  const metadata = posted.find(message => message.type === 'FilterTube_ExternalYouTubeMetadata')?.payload;
  assert.equal(metadata?.viewCount, '0'); assert.equal(metadata?.isLive, false);
  const guard = context.FilterTubeExternalYouTubeGuard, settings = { enabled: true, contentFilters: { views: rule } };
  assert.equal(guard.hasActiveVideoAdmissionRules(settings), true);
  assert.equal(guard.evaluateAdmission(settings, metadata, id).kind, 'views');
  assert.equal(guard.evaluateAdmission(settings, null, id).state, 'allowed');
  assert.equal(guard.evaluateAdmission(settings, null, '').state, 'pending', 'the existing selected-video identity boundary is retained');
  assert.equal(guard.evaluateAdmission(settings, { videoId: id }, id).state, 'allowed');
  assert.equal(guard.evaluateAdmission(settings, { ...metadata, viewCount: '500' }, id).state, 'allowed');
  assert.equal(guard.evaluateAdmission(settings, { ...metadata, isLive: true }, id).state, 'allowed');
  assert.equal(guard.evaluateAdmission({ ...settings, contentFilters: { views: rule, duration: { enabled: true } } }, null, id).state, 'pending', 'existing required-metadata gate is preserved');
});

test('all actual active-filter predicates recognize a views-only policy and reject a disabled view toggle', () => {
  for (const [name, functionName] of [['injector', 'hasEnabledContentFilters'], ['seed', 'hasEnabledContentFilters'], ['content_bridge', 'hasBridgeEnabledContentFilters'], ['content/block_channel', 'hasActiveQuickBlockRuleContext']]) {
    const source = read(name), match = new RegExp(`^([ ]*)function ${functionName}\\(`, 'm').exec(source);
    assert.ok(match, name);
    const end = source.indexOf(`\n${match[1]}}`, match.index) + match[1].length + 2;
    const context = {}; vm.createContext(context); vm.runInContext(source.slice(match.index, end), context);
    assert.equal(context[functionName]({ enabled: true, contentFilters: { views: rule } }), true, name);
    assert.equal(context[functionName]({ enabled: true, contentFilters: { views: { enabled: false, minViews: 500 } } }), false, name);
  }
});

test('engine minimum views preserves the existing duration-filter explicit video allowance precedence', () => {
  const row = { videoRenderer: video('0 views', { lengthText: { simpleText: '0:10' } }) };
  for (const contentFilters of [{ views: rule }, { duration: { enabled: true, condition: 'shorter', minMinutes: 1 } }]) {
    assert.equal(engine({ contentFilters }).process([row]).length, 0);
    assert.equal(engine({ contentFilters, allowedVideoIds: ['abcdefghijk'] }).process([row]).length, 1);
  }
});

test('actual page metadata retention preserves changing view totals through settings pushes without persisting popularity', () => {
  const source = read('content/bridge_settings'), start = source.indexOf('function retainVerifiedVideoMetadata(');
  const end = source.indexOf('\n}', start) + 2;
  const id = 'abcdefghijk', context = { window: {}, currentSettings: { videoMetaMap: { [id]: { identityVerified: true, viewCount: '0', isLive: false } } } };
  vm.createContext(context); vm.runInContext(source.slice(start, end), context);
  const first = { videoMetaMap: { [id]: { identityVerified: true, lengthSeconds: '120' } } };
  context.retainVerifiedVideoMetadata(first);
  assert.equal(first.videoMetaMap[id].viewCount, '0'); assert.equal(first.videoMetaMap[id].isLive, false);
  context.currentSettings = { videoMetaMap: { [id]: { identityVerified: true, viewCount: '900', isLive: false } } };
  const second = { videoMetaMap: {} }; context.retainVerifiedVideoMetadata(second);
  assert.equal(second.videoMetaMap[id].viewCount, '900');
});

for (const prefix of ['videoFilter', 'kidsVideoFilter']) {
  test(`actual ${prefix} controls retain native labels and toggle state; invalid input does not schedule saving`, () => {
    const source = read('tab-view'), start = source.indexOf('function appendMinimumViewsControls(');
    const body = source.slice(start, source.indexOf('\nfunction initializeFiltersTabs()', start));
    const createElement = tag => {
      const events = new Map();
      return { tagName: tag.toUpperCase(), children: [], attributes: {}, validity: { valid: true },
        appendChild(node) { this.children.push(node); return node; },
        setAttribute(key, value) { this.attributes[key] = value; },
        addEventListener(name, handler) { events.set(name, handler); },
        fire(name) { events.get(name)?.(); }, reportValidity() { return this.validity.valid; }
      };
    };
    const rows = createElement('div'), saves = [], context = {
      document: { createElement }, setTabViewLocalizedCopy(node, property, _key, value) {
        if (property === 'textContent') node.textContent = value; else node.setAttribute(property, value);
      }
    };
    vm.createContext(context); vm.runInContext(body, context);
    context.appendMinimumViewsControls(rows, prefix, options => saves.push(clone(options)));
    const row = rows.children[0], panel = rows.children[1];
    const toggle = row.children[1].children[0], input = panel.children[1];
    assert.equal(row.children[0].children[0].htmlFor, toggle.id);
    assert.equal(panel.children[0].htmlFor, input.id);
    assert.equal(input.min, '1'); assert.equal(input.step, '1'); assert.equal(input.value, '500');
    assert.equal(toggle.attributes['aria-describedby'], `${prefix}_views_hint`);
    assert.equal(input.attributes['aria-describedby'], `${prefix}_views_hint`);
    assert.equal(panel.hidden, true); assert.equal(input.disabled, true);
    toggle.checked = true; toggle.fire('change');
    assert.equal(panel.hidden, false); assert.equal(input.disabled, false);
    assert.deepEqual(saves, [{ showToast: true }]);
    input.validity.valid = false; input.fire('input'); input.fire('change'); assert.equal(saves.length, 1);
    input.validity.valid = true; input.fire('input'); assert.deepEqual(saves[1], { showToast: false });
    toggle.checked = false; toggle.fire('change');
    assert.equal(input.disabled, true); assert.equal(panel.hidden, true);
    assert.deepEqual(saves[2], { showToast: true });
  });
}

// #81: YouTube renders counts in the account's display language, not English.
for (const [label, value, count, exact] of [
  ['Korean exact', '조회수 500회', 500, true], ['Korean grouped', '조회수 1,234회', 1234, true],
  ['Korean cheon', '조회수 1.2천회', 1200, false], ['Korean man', '조회수 1.2만회', 12000, false], ['Korean eok', '조회수 3억회', 3e8, false],
  ['Korean no views', '조회수 없음', 0, true],
  ['Japanese prefix exact', '視聴回数 500 回', 500, true], ['Japanese prefix man', '視聴回数 1.2万 回', 12000, false],
  ['Japanese suffix', '1.2万 回視聴', 12000, false], ['Japanese sen', '視聴回数 1.2千 回', 1200, false], ['Japanese oku', '2億 回視聴', 2e8, false],
  ['Japanese zero', '視聴回数 0 回', 0, true],
  ['Chinese simplified', '1.2万次观看', 12000, false], ['Chinese simplified exact', '500次观看', 500, true],
  ['Chinese simplified yi', '1.2亿次观看', 1.2e8, false], ['Chinese simplified prefix', '观看次数：1.2万次', 12000, false],
  ['Chinese traditional', '1.2萬次觀看', 12000, false], ['Chinese traditional prefix', '觀看次數：500次', 500, true],
  ['Chinese traditional yi', '3億次觀看', 3e8, false], ['Chinese qian', '1.2千次观看', 1200, false],
  ['German Mio', '1,2 Mio. Aufrufe', 1.2e6, false], ['German Tsd', '1,2 Tsd. Aufrufe', 1200, false],
  ['German grouping', '12.345 Aufrufe', 12345, true], ['German nbsp', '1,2 Mio. Aufrufe', 1.2e6, false],
  ['French k', '1,2 k vues', 1200, false], ['French M de', '1,2 M de vues', 1.2e6, false],
  ['French narrow nbsp', '1 234 vues', 1234, true], ['French narrow nbsp unit', '1,2 k vues', 1200, false],
  ['Spanish mil', '1,2 mil visualizaciones', 1200, false], ['Spanish M de', '1,2 M de visualizaciones', 1.2e6, false],
  ['Portuguese mil', '1,2 mil visualizações', 1200, false], ['Portuguese mi', '1,2 mi de visualizações', 1.2e6, false],
  ['Russian tys', '1,2 тыс. просмотров', 1200, false], ['Russian mln', '1,2 млн просмотров', 1.2e6, false],
  ['Russian grouping', '1 234 просмотра', 1234, true],
  ['Italian exact', '1234 visualizzazioni', 1234, true], ['Italian Mln', '1,2 Mln di visualizzazioni', 1.2e6, false],
  ['Turkish B is bin', '1,2 B görüntüleme', 1200, false], ['Turkish Mn', '1,2 Mn görüntüleme', 1.2e6, false],
  ['Polish tys', '1,2 tys. wyświetleń', 1200, false], ['Indonesian rb', '1,2 rb x ditonton', 1200, false],
  ['Vietnamese N', '1,2 N lượt xem', 1200, false], ['Hindi hazaar', '1.2 हज़ार बार देखा गया', 1200, false],
  ['English float-noisy compact', '1.1K views', 1100, false], ['English long form', '1.2 million views', 1.2e6, false]
]) {
  test(`localized view parser: ${label}`, () => {
    const api = parser(), evidence = api.parse(value);
    assert.ok(evidence, value);
    assert.equal(evidence.count, count); assert.equal(evidence.exact, exact);
    if (!exact) {
      // Conservative rounding: only the top of the display range proves "below".
      assert.equal(api.shouldBlock(evidence, { enabled: true, minViews: Math.round(evidence.upperBoundExclusive) }), true, value);
      assert.equal(api.shouldBlock(evidence, { enabled: true, minViews: Math.round(evidence.upperBoundExclusive) - 1 }), false, value);
    }
  });
}

test('localized concurrent, waiting and label-less values stay unknown; English B stays billion', () => {
  const api = parser();
  for (const value of ['1.2천명 시청 중', '1.2万 人が視聴中', '1,2 тыс. смотрят', '12 waiting', '1,2 B izleyici', '조회수', '1.2만']) {
    assert.equal(api.parse(value, { requireLabel: true }), null, value);
  }
  assert.equal(api.parse('1,2 B views').count, 1.2e9);
  assert.equal(api.parse('1,2 M x ditonton').count, 1.2e9, 'Indonesian M is miliar; a larger count never over-blocks');
  assert.equal(api.parse('조회수 1.2천회', { requireLabel: true }).count, 1200);
  assert.equal(api.shouldBlock('조회수 1.2천회', rule), false);
  assert.equal(api.shouldBlock('조회수 499회', rule), true);
});

const allowedOwner = 'UCzyxwvutsrqponmlkjihgfe', otherOwner = 'UCabcdefghijklmnopqrstuv';
let rendererKey = 'videoRenderer';
const owned = (id, owner, count, extra = {}) => ({ [rendererKey]: video(count, { videoId: id,
  shortBylineText: { runs: [{ text: 'Creator', navigationEndpoint: { browseEndpoint: { browseId: owner } } }] }, ...extra }) });
const ids = rows => clone(rows).map(row => Object.values(row)[0].videoId);
// Kids compiles its own listMode/contentFilters into the same engine; its feeds
// arrive as compactVideoRenderer rows.
for (const renderer of ['videoRenderer', 'compactVideoRenderer']) {
  test(`allow-only mode still applies minimum views and duration in the JSON layer (${renderer})`, () => {
    rendererKey = renderer;
    const base = { listMode: 'whitelist', whitelistChannels: [{ id: allowedOwner }], whitelistKeywords: [], filterChannels: [], filterKeywords: [] };
    const f = engine(base);
    const output = f.process([
      owned('allowedLow1', allowedOwner, '조회수 499회'), owned('allowedHigh', allowedOwner, '1,2 k vues'),
      owned('allowedNone', allowedOwner, undefined), owned('otherHigh01', otherOwner, '1.2M views'),
      owned('allowedLive', allowedOwner, '3 watching', { isLive: true })
    ]);
    assert.deepEqual(ids(output), ['allowedHigh', 'allowedNone', 'allowedLive']);
    const duration = engine({ ...base, contentFilters: { duration: { enabled: true, condition: 'shorter', minMinutes: 1 } } });
    assert.deepEqual(ids(duration.process([owned('allowShort1', allowedOwner, '9 views', { lengthText: { simpleText: '0:10' } }),
      owned('allowLong01', allowedOwner, '9 views', { lengthText: { simpleText: '5:00' } })])), ['allowLong01']);
    const keyword = engine({ ...base, whitelistChannels: [], whitelistKeywords: [{ pattern: 'ordinary', flags: 'i' }] });
    assert.deepEqual(ids(keyword.process([owned('keywordLow1', otherOwner, '3 views'), owned('keywordHigh', otherOwner, '3,000 views')])), ['keywordHigh']);
  });
}

test('blocklist-mode allow rules no longer bypass content filters; exact allowed IDs keep their precedence', () => {
  rendererKey = 'videoRenderer';
  const f = engine({ listMode: 'blocklist', whitelistChannels: [{ id: allowedOwner }], filterChannels: [{ id: allowedOwner }], allowedVideoIds: ['explicitAll'] });
  assert.deepEqual(ids(f.process([owned('allowedLow1', allowedOwner, '3 views'), owned('allowedHigh', allowedOwner, '3,000 views'),
    owned('explicitAll', otherOwner, '3 views')])), ['allowedHigh', 'explicitAll']);
});
