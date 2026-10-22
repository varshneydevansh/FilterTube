import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const source = fs.readFileSync('js/seed.js', 'utf8');
const currentId = 'current0001';
const oldId = 'oldoldold01';
const settings = { enabled: true, hideSponsoredCards: true, listMode: 'blocklist',
  filterChannels: [], filterKeywords: [], filterKeywordsComments: [], contentFilters: {},
  categoryFilters: { enabled: false, selected: [] }, languageFilters: { enabled: false, selected: [] } };
const details = (videoId, lengthSeconds) => ({ videoDetails: { videoId, lengthSeconds: String(lengthSeconds) } });

// Run the complete production script, exposing only private entry points for
// behavior assertions. The fetch interceptor, cache and seek implementation are real.
// Retained fallback seek coverage uses mobile YouTube; native desktop Watch
// intentionally leaves all playback to the original player and isolated owner.
function fixture({ payload = [], hostname = 'm.youtube.com', pathname = '/watch', search = `?v=${currentId}` } = {}) {
  const base = loadSeedRuntime({ hostname, origin: `https://${hostname}` });
  let now = 10000;
  let player = null;
  const document = base.context.document;
  Object.assign(document.location, { pathname, search });
  Object.assign(document, { getElementById: id => id === 'movie_player' ? player : null,
    querySelector: () => null, querySelectorAll: () => [],
    createElement: () => ({ style: {}, setAttribute() {}, removeAttribute() {}, remove() {} }),
    head: { appendChild() {} } });
  const context = { ...base.context, document, location: document.location,
    Response, Request, Headers, ReadableStream, TextEncoder, TextDecoder, URLSearchParams,
    Date: class extends Date { static now() { return now; } } };
  context.window = { fetch: async () => new Response(JSON.stringify(payload)),
    XMLHttpRequest: base.context.XMLHttpRequest, postMessage() {}, addEventListener() {},
    dispatchEvent() {}, setInterval: () => 1, clearInterval() {}, setTimeout: () => 1, clearTimeout() {} };
  context.globalThis = context;
  vm.createContext(context);
  const exposed = source.replace(/\}\)\(\);\s*$/, `window.__adVoidFixture = {
    duration: adVoidExpectedContentDuration, advance: adVoidAdvanceConfirmedAd,
    process: processWithEngine, state: adVoidState
  }; })();`);
  assert.notEqual(exposed, source);
  vm.runInContext(exposed, context, { filename: 'js/seed.js' });
  context.window.filterTube.updateSettings({ ...settings });
  return { window: context.window, document, api: context.window.__adVoidFixture,
    attach: value => { player = value; }, tick: (ms = 900) => { now += ms; } };
}

function advertFixture({ seek = 'accept' } = {}) {
  const state = fixture();
  state.window.ytInitialPlayerResponse = details(currentId, 215);
  let time = 0;
  let writes = 0;
  let behavior = seek;
  const video = { duration: 30, paused: false, readyState: 4, isConnected: true,
    get currentTime() { return time; }, set currentTime(value) {
      writes++;
      if (behavior === 'throw') throw new Error('temporarily unseekable');
      if (behavior === 'accept') time = value;
    }, getAttribute: () => null, getBoundingClientRect: () => ({ width: 640, height: 360 }) };
  const player = { className: 'html5-video-player ad-showing ad-interrupting',
    contains: candidate => candidate === video, querySelectorAll: selector => selector === 'video' ? [video] : [],
    querySelector: selector => selector === 'video.html5-main-video' ? video : null, getDuration: () => 30 };
  state.attach(player);
  return { ...state, video, player, writes: () => writes, behavior: value => { behavior = value; },
    rewind: () => { time = 0; }, advance: () => state.api.advance(video, player, 215) };
}

test('current exact video metadata wins over stale initial metadata', () => {
  const state = fixture();
  state.window.ytInitialPlayerResponse = details(oldId, 30);
  state.window.filterTube.lastYtPlayerResponse = details(currentId, 215);
  assert.equal(state.api.duration(), 215);
  state.document.location.search = `?v=${oldId}`;
  assert.equal(state.api.duration(), 30);
});

test('missing, mismatched or unkeyed duration metadata stays unknown', () => {
  for (const payload of [details(oldId, 30), { videoDetails: { lengthSeconds: '30' } }, { lengthSeconds: 30 }]) {
    const state = fixture(); state.window.ytInitialPlayerResponse = payload;
    assert.equal(state.api.duration(), 0);
  }
  const state = fixture({ search: '' });
  state.window.ytInitialPlayerResponse = details(currentId, 215);
  assert.equal(state.api.duration(), 0);
});

test('a query parameter on another surface cannot identify Watch content', () => {
  const state = fixture({ pathname: '/', search: `?v=${currentId}` });
  state.window.ytInitialPlayerResponse = details(currentId, 215);
  assert.equal(state.api.duration(), 0);
});

test('an exact streamed player record supplies ad-only duration without trusting the following route', async () => {
  const state = fixture({ payload: [{ playerResponse: details(currentId, 215) }, { watchNextResponse: {} }] });
  await (await state.window.fetch('/youtubei/v1/get_watch')).json();
  assert.equal(state.api.duration(), 215);
  state.document.location.search = `?v=${oldId}`;
  assert.equal(state.api.duration(), 0);
});

test('a mismatched player payload or similarly named endpoint cannot supply duration', () => {
  const state = fixture();
  state.api.process({ playerResponse: details(oldId, 30) }, 'fetch:/youtubei/v1/get_watch');
  state.api.process({ playerResponse: details(currentId, 215) }, 'fetch:/youtubei/v1/get_watch_extra');
  assert.equal(state.api.duration(), 0);
});

for (const pathname of [`/shorts/${currentId}`, `/embed/${currentId}`, `/live/${currentId}`]) {
  test(`exact video route owns duration: ${pathname}`, () => {
    const state = fixture({ pathname, search: '' });
    state.window.ytInitialPlayerResponse = details(currentId, 215);
    assert.equal(state.api.duration(), 215);
  });
}

test('a path-owned video ID takes precedence over an unrelated query parameter', () => {
  const state = fixture({ pathname: `/shorts/${currentId}`, search: `?v=${oldId}` });
  state.window.ytInitialPlayerResponse = details(currentId, 215);
  assert.equal(state.api.duration(), 215);
});

test('a thrown seek can retry after cooldown and only successful readback latches advancement', () => {
  const state = advertFixture({ seek: 'throw' });
  assert.equal(state.advance(), false);
  assert.notEqual(state.api.state.advancedAdVideo, state.video);
  state.behavior('accept');
  assert.equal(state.advance(), false, 'immediate event retries are throttled');
  assert.equal(state.writes(), 1);
  state.tick();
  assert.equal(state.advance(), true);
  assert.equal(state.writes(), 2);
  assert.equal(state.api.state.advancedAdVideo, state.video);
  assert.equal(state.advance(), false, 'successful end seek is not repeated');
  assert.equal(state.writes(), 2);
});

test('ignored writes never claim success and stop after three spaced attempts', () => {
  const state = advertFixture({ seek: 'ignore' });
  for (let i = 0; i < 8; i++) { assert.equal(state.advance(), false); state.tick(); }
  assert.equal(state.writes(), 3);
  assert.notEqual(state.api.state.advancedAdVideo, state.video);
});

test('an accepted seek that rolls back may retry within the same bounded budget', () => {
  const state = advertFixture();
  assert.equal(state.advance(), true);
  state.rewind(); state.tick();
  assert.equal(state.advance(), true);
  assert.equal(state.writes(), 2);
});

test('a stale caller duration cannot authorize seeking the current requested content', () => {
  const state = advertFixture();
  state.video.duration = 215;
  assert.equal(state.api.advance(state.video, state.player, 30), false);
  assert.equal(state.writes(), 0);
});

test('the player API is sought only when it reports the same confirmed advert duration', () => {
  for (const playerDuration of [30, 215]) {
    const state = advertFixture();
    const calls = [];
    state.player.getDuration = () => playerDuration;
    state.player.seekTo = (...args) => calls.push(args);
    assert.equal(state.advance(), true);
    assert.deepEqual(calls, playerDuration === 30 ? [[29.75, true]] : []);
  }
});

for (const invalidation of ['disabled', 'ad-ended', 'content-duration', 'detached', 'different-playing-video', 'new-route']) {
  test(`a failed seek never authorizes a retry after ${invalidation}`, () => {
    const state = advertFixture({ seek: 'throw' });
    assert.equal(state.advance(), false);
    state.behavior('accept'); state.tick();
    if (invalidation === 'disabled') state.window.filterTube.updateSettings({ ...settings, enabled: false });
    if (invalidation === 'ad-ended') state.player.className = 'html5-video-player';
    if (invalidation === 'content-duration') state.video.duration = 215;
    if (invalidation === 'detached') state.player.contains = () => false;
    if (invalidation === 'different-playing-video') state.player.querySelectorAll = () => [{ paused: false }];
    if (invalidation === 'new-route') state.document.location.search = `?v=${oldId}`;
    assert.equal(state.advance(), false);
    assert.equal(state.writes(), 1);
  });
}
