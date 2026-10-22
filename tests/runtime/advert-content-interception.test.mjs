import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const copy = value => JSON.parse(JSON.stringify(value));
const organic = { videoRenderer: {
  videoId: 'abcdefghijk', title: { simpleText: 'An ordinary video about sponsored art' }
} };
const continuation = { continuationItemRenderer: {
  continuationEndpoint: { continuationCommand: { token: 'synthetic-next-page' } }
} };
const playerContent = {
  videoDetails: { videoId: 'abcdefghijk', title: 'Ordinary content' },
  playabilityStatus: { status: 'OK' },
  streamingData: { formats: [{ itag: 18, url: 'https://example.invalid/content' }] },
  microformat: { playerMicroformatRenderer: { category: 'Education' } }
};

function fixture() {
  return {
    responseContext: { visitorData: 'synthetic-context' },
    header: {
      videoMastheadAdV3Renderer: { title: { simpleText: 'Synthetic advert' } },
      unrelatedHeader: { title: 'Keep the page header' }
    },
    contents: [
      { richItemRenderer: { content: { adSlotRenderer: { slotId: 'synthetic-ad' } }, trackingParams: 'ad-only' } },
      { richItemRenderer: { content: copy(organic) } },
      copy(continuation)
    ],
    onResponseReceivedEndpoints: [{ appendContinuationItemsAction: {
      continuationItems: [
        { adSlotRenderer: { slotId: 'continuation-ad' } }, copy(organic), copy(continuation)
      ]
    } }],
    playerResponse: {
      ...copy(playerContent), playerAds: [{ ad: 'synthetic' }], adPlacements: [{ ad: 'synthetic' }],
      adSlots: [{ ad: 'synthetic' }], adBreakHeartbeatParams: { synthetic: true }
    }
  };
}

function expected() {
  return {
    responseContext: { visitorData: 'synthetic-context' },
    header: { unrelatedHeader: { title: 'Keep the page header' } },
    contents: [{ richItemRenderer: { content: copy(organic) } }, copy(continuation)],
    onResponseReceivedEndpoints: [{ appendContinuationItemsAction: {
      continuationItems: [copy(organic), copy(continuation)]
    } }],
    playerResponse: copy(playerContent)
  };
}

function settings(overrides = {}) {
  return {
    enabled: true, hideSponsoredCards: true, listMode: 'blocklist',
    filterChannels: [], filterKeywords: [], filterKeywordsComments: [],
    whitelistChannels: [], whitelistKeywords: [], hideAllComments: false, hideAllShorts: false,
    contentFilters: {}, categoryFilters: { enabled: false, selected: [] },
    languageFilters: { enabled: false, selected: [] }, ...overrides
  };
}

function addBrowserPresentationStubs(runtime) {
  const document = runtime.context.document;
  document.location.search = '';
  runtime.context.location = document.location;
  runtime.context.URLSearchParams = URLSearchParams;
  document.getElementById = () => null;
  document.querySelector = () => null;
  document.querySelectorAll = () => [];
  document.createElement = () => ({ style: {}, setAttribute() {}, removeAttribute() {}, remove() {} });
  document.head = { appendChild() {} };
  runtime.window.setInterval = () => 1;
  runtime.window.clearInterval = () => {};
  delete runtime.window.FilterTubeEngine;
  return runtime;
}

function runtime(payload = fixture(), options = {}) {
  return addBrowserPresentationStubs(loadSeedRuntime({ payload, pathname: '/', ...options }));
}

for (const endpoint of ['browse', 'next', 'get_watch', 'search', 'player']) {
  test(`actual fetch sanitizes explicit advert owners and player plans in ${endpoint} without an engine`, async () => {
    const state = runtime();
    state.window.filterTube.updateSettings(settings());
    const response = await state.window.fetch(`https://www.youtube.com/youtubei/v1/${endpoint}?prettyPrint=false`);
    assert.deepEqual(await response.json(), expected());
    assert.equal(state.calls.fetch.length, 1, 'the original content request is still sent exactly once');
    assert.equal(state.calls.processData.length, 0);
    assert.equal(state.calls.harvestOnly.length, 0);
  });
}

test('get_watch top-level array and player_response alias preserve the organic envelope', async () => {
  const input = [{ responseContext: { synthetic: true } }, { player_response: fixture() }];
  const state = runtime(input);
  state.window.filterTube.updateSettings(settings());
  const response = await state.window.fetch('/youtubei/v1/get_watch');
  assert.deepEqual(await response.json(), [{ responseContext: { synthetic: true } }, { player_response: expected() }]);
});

for (const name of ['ytInitialData', 'ytInitialPlayerResponse']) {
  test(`${name} actual setter sanitizes adverts and preserves organic siblings`, () => {
    const state = runtime();
    state.window.filterTube.updateSettings(settings());
    state.window[name] = fixture();
    assert.deepEqual(copy(state.window[name]), expected());
  });
}

test('a mixed owner loses only its explicit advert property, not its organic renderer or ordinary text', async () => {
  const mixed = { contents: [{
    adSlotRenderer: { slotId: 'synthetic-ad' }, ...copy(organic),
    description: 'adSlotRenderer is ordinary text here', trackingParams: 'organic-mixed-owner'
  }] };
  const state = runtime(mixed);
  state.window.filterTube.updateSettings(settings());
  const result = await (await state.window.fetch('/youtubei/v1/browse')).json();
  assert.deepEqual(result, { contents: [{ ...copy(organic),
    description: 'adSlotRenderer is ordinary text here', trackingParams: 'organic-mixed-owner'
  }] });
});

for (const overrides of [{ enabled: false }, { hideSponsoredCards: false }]) {
  test(`disabled advert sanitization leaves fetch and initial data unchanged: ${JSON.stringify(overrides)}`, async () => {
    const input = fixture();
    const state = runtime(input);
    state.window.filterTube.updateSettings(settings(overrides));
    const response = await state.window.fetch('/youtubei/v1/browse');
    assert.deepEqual(await response.json(), input);
    state.window.ytInitialData = copy(input);
    assert.deepEqual(copy(state.window.ytInitialData), input);
  });
}

test('advert sanitization remains independent of allow-only mode when no engine is available', async () => {
  const state = runtime();
  state.window.filterTube.updateSettings(settings({ listMode: 'whitelist' }));
  const response = await state.window.fetch('/youtubei/v1/next');
  assert.deepEqual(await response.json(), expected());
});

test('settings arriving after fetch starts but before its response is handled still sanitize adverts', async () => {
  const state = runtime();
  const pending = state.window.fetch('/youtubei/v1/get_watch');
  state.window.filterTube.updateSettings(settings());
  assert.deepEqual(await (await pending).json(), expected());
  assert.equal(state.calls.fetch.length, 1);
});

test('no settings at response time and an unrecognized endpoint remain unchanged', async () => {
  const input = fixture();
  const unloaded = runtime(input);
  assert.deepEqual(await (await unloaded.window.fetch('/youtubei/v1/get_watch')).json(), input);
  const outside = runtime(input);
  outside.window.filterTube.updateSettings(settings());
  assert.deepEqual(await (await outside.window.fetch('/youtubei/v1/unrelated_fixture')).json(), input);
});

// The shared harness's XHR stub has no events. Use a local fake transport with
// the same context primitives and run the full production seed again in a fresh
// window; no interception/sanitizer implementation is duplicated here.
function xhrRuntime() {
  class FakeXHR {
    constructor() { this.listeners = new Map(); this.readyState = 0; this.status = 200; this.responseType = ''; }
    open() {}
    send() {}
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(listener);
    }
    removeEventListener(type, listener) {
      const list = this.listeners.get(type) || [];
      const index = list.indexOf(listener);
      if (index >= 0) list.splice(index, 1);
    }
    trigger(type) { for (const listener of [...(this.listeners.get(type) || [])]) listener.call(this); }
  }
  const base = runtime();
  const context = { ...base.context };
  context.window = {
    __filtertubeDebug: false, fetch: () => Promise.resolve(new base.MockResponse({})),
    XMLHttpRequest: FakeXHR, postMessage() {}, addEventListener() {}, dispatchEvent() {},
    setInterval: () => 1, clearInterval() {}
  };
  context.XMLHttpRequest = FakeXHR;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('js/seed.js', 'utf8'), context, { filename: 'js/seed.js' });
  return { context, window: context.window };
}

for (const endpoint of ['browse', 'next', 'get_watch']) {
  test(`actual XHR text response sanitizes explicit adverts in ${endpoint}`, () => {
    const state = xhrRuntime();
    state.window.filterTube.updateSettings(settings());
    const xhr = new state.window.XMLHttpRequest();
    xhr.open('GET', `/youtubei/v1/${endpoint}?prettyPrint=false`);
    xhr.responseText = JSON.stringify(fixture());
    xhr.send();
    xhr.readyState = 4;
    xhr.trigger('readystatechange');
    assert.deepEqual(JSON.parse(xhr.responseText), expected());
  });
}

test('actual XHR JSON response preserves continuation and organic content', () => {
  const state = xhrRuntime();
  state.window.filterTube.updateSettings(settings());
  const xhr = new state.window.XMLHttpRequest();
  xhr.open('GET', '/youtubei/v1/get_watch');
  xhr.responseType = 'json';
  xhr.response = [fixture()];
  xhr.send();
  xhr.readyState = 4;
  xhr.trigger('load');
  assert.deepEqual(copy(xhr.response), [expected()]);
});


for (const endpoint of ['player_extra', 'get_watch_extra']) {
  test(`similarly named ${endpoint} endpoint is not treated as an advert payload`, async () => {
    const input = fixture();
    const state = runtime(input);
    state.window.filterTube.updateSettings(settings());
    assert.deepEqual(await (await state.window.fetch(`/youtubei/v1/${endpoint}`)).json(), input);
  });
}

test('null and scalar advert-owner values remain intact rather than removing their containing records', async () => {
  const input = { contents: [null, false, 0, '', 'not a renderer'].map(value => ({
    adSlotRenderer: value, videoMastheadAdV3Renderer: value, ...copy(organic)
  })) };
  const state = runtime(input);
  state.window.filterTube.updateSettings(settings());
  assert.deepEqual(await (await state.window.fetch('/youtubei/v1/next')).json(), input);
});

test('advert-related words, Sponsored titles, advertiserInfo and normal navigation masthead are organic data', async () => {
  const input = {
    masthead: { mastheadRenderer: { logo: { accessibility: { label: 'YouTube' } }, searchbox: { query: 'adwords' } } },
    contents: [{ videoRenderer: {
      videoId: 'abcdefghijk', title: { simpleText: 'Sponsored: adwords and advertising explained' },
      descriptionSnippet: { simpleText: 'adSlotRenderer and videoMastheadAdV3Renderer documentation' },
      advertiserInfo: { videoMastheadAdAdvertiserInfoRenderer: { advertiserName: { simpleText: 'Ordinary example' } } }
    } }],
    advertiserInfo: { note: 'An unrelated application field' }
  };
  const state = runtime(input);
  state.window.filterTube.updateSettings(settings());
  assert.deepEqual(await (await state.window.fetch('/youtubei/v1/browse')).json(), input);
});

test('advertised masthead owner is removed with its advertiser info while the navigation masthead survives', async () => {
  const navigation = { mastheadRenderer: { logo: { icon: { iconType: 'YOUTUBE_LOGO' } }, searchbox: { query: '' } } };
  const input = {
    masthead: copy(navigation),
    header: { videoMastheadAdV3Renderer: {
      videoId: 'advideo1234',
      advertiserInfo: { videoMastheadAdAdvertiserInfoRenderer: {
        advertiserName: { simpleText: 'Synthetic advertiser' },
        navigationEndpoint: { urlEndpoint: { url: 'https://example.invalid/advertiser' } }
      } }
    } },
    contents: [copy(organic), copy(continuation)]
  };
  const state = runtime(input);
  state.window.filterTube.updateSettings(settings());
  assert.deepEqual(await (await state.window.fetch('/youtubei/v1/browse')).json(), {
    masthead: navigation, contents: [copy(organic), copy(continuation)]
  });
});

test('live-shaped in-feed ad slot and its empty contentIndex rich-item wrapper are removed', async () => {
  const input = { contents: [
    { richItemRenderer: { contentIndex: 0, trackingParams: 'synthetic-ad', content: { adSlotRenderer: {
      fulfillmentContent: { fulfilledLayout: { inFeedAdLayoutRenderer: {
        adLayoutMetadata: { layoutId: 'synthetic' },
        renderingContent: { videoDisplayFullButtonedAdRenderer: { title: { simpleText: 'Synthetic advert' } } }
      } } }
    } } } },
    { richItemRenderer: { contentIndex: 1, content: copy(organic) } }, copy(continuation)
  ] };
  const state = runtime(input);
  state.window.filterTube.updateSettings(settings());
  assert.deepEqual(await (await state.window.fetch('/youtubei/v1/next')).json(), {
    contents: [{ richItemRenderer: { contentIndex: 1, content: copy(organic) } }, copy(continuation)]
  });
});

for (const endpoint of ['browse', 'next', 'search', 'ytInitialData']) {
  test(`${endpoint} confines player-plan deletion to explicit player ownership`, async () => {
    const unrelatedPlans = {
      playerAds: ['unrelated-playerAds'], adPlacements: ['unrelated-adPlacements'],
      adSlots: ['unrelated-adSlots'], adBreakHeartbeatParams: { unrelated: true }
    };
    const actualPlans = {
      playerAds: [{ synthetic: true }], adPlacements: [{ synthetic: true }],
      adSlots: [{ synthetic: true }], adBreakHeartbeatParams: { synthetic: true }
    };
    const input = {
      responseContext: { ...copy(unrelatedPlans), synthetic: true },
      otherMetadata: copy(unrelatedPlans),
      playerResponse: { ...copy(playerContent), ...copy(actualPlans) },
      player_response: { ...copy(playerContent), ...copy(actualPlans) },
      directConfirmedPlayer: { ...copy(playerContent), ...copy(actualPlans) },
      contents: [copy(organic), copy(continuation)]
    };
    const state = runtime(input);
    state.window.filterTube.updateSettings(settings());
    let result;
    if (endpoint === 'ytInitialData') {
      state.window.ytInitialData = copy(input);
      result = copy(state.window.ytInitialData);
    } else {
      result = await (await state.window.fetch(`/youtubei/v1/${endpoint}`)).json();
    }
    assert.deepEqual(result, {
      responseContext: { ...unrelatedPlans, synthetic: true }, otherMetadata: unrelatedPlans,
      playerResponse: copy(playerContent), player_response: copy(playerContent),
      directConfirmedPlayer: copy(playerContent), contents: [copy(organic), copy(continuation)]
    });
  });
}

for (const [name, rawName] of [
  ['ytInitialData', 'rawYtInitialData'], ['ytInitialPlayerResponse', 'rawYtInitialPlayerResponse']
]) {
  test(`${name} captures a detached unfiltered raw snapshot before advert sanitization`, () => {
    const state = runtime();
    state.window.filterTube.updateSettings(settings());
    const input = fixture();
    state.window[name] = input;
    assert.deepEqual(copy(state.window[name]), expected());
    assert.deepEqual(copy(state.window.filterTube[rawName]), fixture());
    state.window[name].contents.push({ synthetic: 'later organic mutation' });
    assert.deepEqual(copy(state.window.filterTube[rawName]), fixture(), 'processed data never aliases the raw copy');
  });

  test(`${name} arriving before settings is preserved initially and sanitized by the real queued replay`, () => {
    const state = runtime();
    const input = fixture();
    state.window[name] = input;
    assert.deepEqual(copy(state.window[name]), fixture());
    state.window.filterTube.updateSettings(settings());
    assert.deepEqual(copy(state.window[name]), expected());
    assert.deepEqual(input, fixture(), 'replay works from a clone rather than mutating the original queued input');
    assert.equal(state.window.filterTube.getStats().queuedItems, 0);
  });
}

test('actual DOM style builder targets advert mastheads without hiding the navigation masthead', () => {
  const source = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
  const start = source.indexOf('function ensureContentControlStyles(settings) {');
  const end = source.indexOf('\nconst INLINE_MOBILE_SEARCH_CONTROL_HOST_SELECTORS', start);
  assert.ok(start >= 0 && end > start);
  let style;
  const document = {
    location: { pathname: '/' }, documentElement: { setAttribute() {} },
    head: { appendChild(value) { style = value; } },
    getElementById: () => style || null, createElement: () => ({ textContent: '' })
  };
  const update = Function('document', 'hideYouTubeOpenAppButtons', `${source.slice(start, end)}; return ensureContentControlStyles;`)(document, () => {});
  update({ hideSponsoredCards: true });
  const enabledCss = style.textContent;
  for (const selector of ['ytd-video-masthead-ad-renderer', 'ytd-video-masthead-ad-v3-renderer', 'ytm-video-masthead-ad-v3-renderer']) {
    assert.ok(enabledCss.includes(selector), `generated CSS includes explicit advert owner ${selector}`);
  }
  assert.doesNotMatch(enabledCss, /(?:^|[\s,])(?:ytd-masthead|#masthead-container)(?:[\s,{.:]|$)/);
  assert.doesNotMatch(enabledCss, /advertiserInfo|\[.*(?:Sponsored|adwords)/);
  update({ hideSponsoredCards: false });
  assert.doesNotMatch(style.textContent, /video-masthead-ad|ytd-ad-slot-renderer|ytm-ad-slot-renderer/);
});
