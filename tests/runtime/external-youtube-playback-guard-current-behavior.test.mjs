import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const guardSource = fs.readFileSync(path.join(root, 'js/content/external_youtube_guard.js'), 'utf8');
const networkSource = fs.readFileSync(path.join(root, 'js/content/external_youtube_network.js'), 'utf8');

function activeSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterChannels: [{ id: 'UCGnjeahCJW1AF34HBmQTJ-Q', name: 'shakiraVEVO' }],
    ...overrides
  };
}

function playerMetadata(overrides = {}) {
  return {
    videoId: 'fcnDmrtj6Sk',
    title: 'Shakira, Burna Boy - Dai Dai (Official Video)',
    shortDescription: 'Official video',
    keywords: ['Shakira', 'Dai Dai'],
    lengthSeconds: '240',
    channelId: 'UCGnjeahCJW1AF34HBmQTJ-Q',
    channelName: 'shakiraVEVO',
    channelHandle: '',
    publishDate: '',
    uploadDate: '',
    category: '',
    languageCode: '',
    identityVerified: true,
    textVerified: true,
    ...overrides
  };
}

function loadGuard(settings, href = 'https://www.google.com/search?q=shakira#fpstate=ive&vld=cid:abc,vid:fcnDmrtj6Sk,st:0') {
  const documentListeners = new Map();
  const windowListeners = new Map();
  const videos = [];
  const overlays = new Map();
  const document = {
    body: { appendChild(node) { overlays.set(node.id, node); } },
    documentElement: { appendChild(node) { overlays.set(node.id, node); } },
    addEventListener(type, listener) { documentListeners.set(type, listener); },
    querySelectorAll(selector) { return selector === 'video' ? videos : []; },
    getElementById(id) { return overlays.get(id) || null; },
    createElement() {
      return {
        id: '', dataset: {}, style: {}, textContent: '',
        setAttribute() {},
        remove() { overlays.delete(this.id); }
      };
    }
  };
  const context = {
    URL, Promise, Date, Map, Set, WeakSet, RegExp,
    setTimeout, clearTimeout, document,
    location: { href },
    addEventListener(type, listener) { windowListeners.set(type, listener); },
    chrome: {
      runtime: {
        sendMessage(_message, callback) { callback(settings); },
        onMessage: { addListener() {} }
      },
      storage: { onChanged: { addListener() {} } }
    },
    FilterTubeIdentity: {
      isChannelBlocked(entries, meta) {
        return entries.some(entry => entry.id === meta.id || entry.name?.toLowerCase() === meta.name?.toLowerCase());
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(guardSource, context);
  return { context, guard: context.FilterTubeExternalYouTubeGuard, documentListeners, windowListeners, videos, overlays };
}

function makeVideo() {
  return {
    nodeType: 1,
    tagName: 'VIDEO',
    paused: false,
    parentElement: null,
    pauseCount: 0,
    playCount: 0,
    getAttribute() { return null; },
    querySelectorAll() { return []; },
    pause() { this.pauseCount += 1; this.paused = true; },
    play() { this.playCount += 1; this.paused = false; return Promise.resolve(); }
  };
}

test('Google Search registers a MAIN-world metadata bridge and an isolated in-place guard', () => {
  for (const name of ['manifest.json', 'manifest.chrome.json', 'manifest.opera.json', 'manifest.firefox.json']) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
    const network = manifest.content_scripts.find(entry => entry.matches?.includes('https://*.google.com/search*') && entry.js?.includes('js/content/external_youtube_network.js'));
    const guard = manifest.content_scripts.find(entry => entry.matches?.includes('https://*.google.com/search*') && entry.js?.includes('js/content/external_youtube_guard.js'));
    const embedNetwork = manifest.content_scripts.find(entry => entry.matches?.includes('*://*.youtube.com/embed/*') && entry.js?.includes('js/content/external_youtube_network.js'));
    const embedGuard = manifest.content_scripts.find(entry => entry.matches?.includes('*://*.youtube.com/embed/*') && entry.js?.includes('js/content/external_youtube_guard.js'));
    assert.ok(network, `${name} must register the network bridge`);
    assert.ok(guard, `${name} must register the admission guard`);
    assert.deepEqual(network.matches, ['https://*.google.com/search*']);
    assert.deepEqual(guard.matches, ['https://*.google.com/search*']);
    assert.equal(network.run_at, 'document_start');
    assert.equal(guard.run_at, 'document_start');
    assert.equal(network.world, 'MAIN');
    assert.ok(guard.js.includes('js/shared/identity.js'));
    assert.ok(embedNetwork, `${name} must install the playback bridge inside YouTube embeds`);
    assert.ok(embedGuard, `${name} must install the decision guard inside YouTube embeds`);
    assert.equal(embedNetwork.run_at, 'document_start');
    assert.equal(embedNetwork.all_frames, true);
    assert.equal(embedNetwork.world, 'MAIN');
  }
});

test('Google inline-player fragments expose the exact current video ID', () => {
  const { guard } = loadGuard(activeSettings());
  assert.equal(
    guard.extractGooglePlayerVideoId('https://www.google.com/search?q=shakira#fpstate=ive&vld=cid:12c2e439,vid:41ZY18JqI2A,st:0'),
    '41ZY18JqI2A'
  );
  assert.equal(guard.extractYouTubeCandidate('https://www.youtube.com/watch?v=fcnDmrtj6Sk').videoId, 'fcnDmrtj6Sk');
  assert.equal(guard.extractYouTubeCandidate('https://i.ytimg.com/vi/fcnDmrtj6Sk/hqdefault.jpg').videoId, 'fcnDmrtj6Sk');
});

test('the supplied Player identity produces an exact blocked-channel decision in place', async () => {
  const loaded = loadGuard(activeSettings());
  await new Promise(resolve => setTimeout(resolve, 0));
  const decision = loaded.guard.evaluateAdmission(activeSettings(), playerMetadata(), 'fcnDmrtj6Sk');
  assert.equal(decision.state, 'blocked');
  assert.equal(decision.kind, 'channel');
});

test('allowed Player metadata resumes the Google media without navigating away', async () => {
  const loaded = loadGuard(activeSettings({ filterChannels: [{ id: 'UC-other' }] }));
  await new Promise(resolve => setTimeout(resolve, 0));
  const video = makeVideo();
  loaded.videos.push(video);
  loaded.documentListeners.get('play')({ target: video });
  assert.equal(video.pauseCount, 1);

  loaded.guard.acceptExternalMetadata(playerMetadata());
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(video.playCount, 1);
  assert.equal(loaded.context.location.href.includes('youtube.com'), false);
});

test('blocked Player metadata keeps Google media paused with the verified reason', async () => {
  const loaded = loadGuard(activeSettings());
  await new Promise(resolve => setTimeout(resolve, 0));
  const video = makeVideo();
  loaded.documentListeners.get('play')({ target: video });
  loaded.guard.acceptExternalMetadata(playerMetadata());
  assert.equal(video.pauseCount, 1);
  assert.equal(video.playCount, 0);
  assert.match(loaded.overlays.get('filtertube-external-youtube-admission').textContent, /Blocked channel/);
  assert.match(loaded.overlays.get('filtertube-external-youtube-admission').textContent, /shakiraVEVO/);
});

test('allowed autoplay play and playing events never re-pause the admitted video', async () => {
  const loaded = loadGuard(activeSettings({ filterChannels: [{ id: 'UC-other' }] }));
  await new Promise(resolve => setTimeout(resolve, 0));
  loaded.guard.acceptExternalMetadata(playerMetadata());
  const video = makeVideo();
  for (let attempt = 0; attempt < 4; attempt++) {
    loaded.documentListeners.get('play')({ target: video });
    loaded.documentListeners.get('playing')({ target: video });
  }
  assert.equal(video.pauseCount, 0);
  assert.equal(video.playCount, 0);
  assert.equal(video.paused, false);
});

test('decorative FilterTube banner media is never subjected to content admission', async () => {
  const loaded = loadGuard(activeSettings());
  await new Promise(resolve => setTimeout(resolve, 0));
  const video = makeVideo();
  video.getAttribute = key => key === 'data-filtertube-admission-background' ? 'true' : null;
  loaded.documentListeners.get('play')({ target: video });
  assert.equal(video.pauseCount, 0);
});

test('missing metadata for an active metadata rule remains pending instead of being guessed', () => {
  const settings = activeSettings({ filterChannels: [], categoryFilters: { enabled: true, mode: 'block', selected: ['Music'] } });
  const { guard } = loadGuard(settings);
  const decision = guard.evaluateAdmission(settings, playerMetadata({ category: '' }), 'fcnDmrtj6Sk');
  assert.deepEqual({ state: decision.state, missing: decision.missing }, { state: 'pending', missing: 'category' });
});

test('external duration admission preserves the Watch default block-mode and range-string semantics', () => {
  const settings = activeSettings({
    filterChannels: [],
    contentFilters: { duration: { enabled: true, condition: 'between', value: '3-5' } }
  });
  const { guard } = loadGuard(settings);
  assert.equal(guard.evaluateAdmission(settings, playerMetadata({ lengthSeconds: '240' }), 'fcnDmrtj6Sk').kind, 'duration');
  assert.equal(guard.evaluateAdmission(settings, playerMetadata({ lengthSeconds: '600' }), 'fcnDmrtj6Sk').state, 'allowed');
});

test('Global Disabled and presentation-only settings never hold Google media', async () => {
  for (const settings of [
    { enabled: false, filterChannels: [{ id: 'UCGnjeahCJW1AF34HBmQTJ-Q' }] },
    { enabled: true, hideAllComments: true, hideVideoSidebar: true, hidePlayables: true, advertVoid: true }
  ]) {
    const loaded = loadGuard(settings);
    await new Promise(resolve => setTimeout(resolve, 0));
    const video = makeVideo();
    loaded.documentListeners.get('play')({ target: video });
    assert.equal(video.pauseCount, 0);
  }
});

test('network bridge sanitizes Player JSON and never rewrites the response', async () => {
  const posted = [];
  const payload = {
    playabilityStatus: { status: 'OK' },
    videoDetails: {
      videoId: 'fcnDmrtj6Sk', title: 'Dai Dai', lengthSeconds: '240',
      channelId: 'UCGnjeahCJW1AF34HBmQTJ-Q', author: 'shakiraVEVO', keywords: ['Shakira']
    }
  };
  const response = {
    ok: true,
    clone() { return { json: async () => payload }; }
  };
  const context = {
    URL, Promise, Request: class Request {},
    location: { origin: 'https://www.google.com' },
    fetch: async () => response,
    postMessage(message) { posted.push(message); },
    XMLHttpRequest: function XMLHttpRequest() {}
  };
  context.XMLHttpRequest.prototype = {};
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(networkSource, context);
  const returned = await context.fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false');
  assert.equal(returned, response);
  assert.equal(posted[0].payload.videoId, 'fcnDmrtj6Sk');
  assert.equal(posted[0].payload.channelId, 'UCGnjeahCJW1AF34HBmQTJ-Q');
  assert.equal(posted[0].payload.shortDescription, '');
  assert.equal('streamingData' in posted[0].payload, false);
});

test('an ID-less Google YouTube embed holds programmatic play until its Player metadata is allowed', async () => {
  const posted = [];
  const listeners = new Map();
  class HTMLMediaElement {
    constructor() { this.paused = true; this.playCount = 0; this.pauseCount = 0; }
    play() { this.playCount += 1; this.paused = false; return Promise.resolve(); }
    pause() { this.pauseCount += 1; this.paused = true; }
  }
  const payload = {
    videoDetails: {
      videoId: 'fcnDmrtj6Sk', title: 'Dai Dai', lengthSeconds: '240',
      channelId: 'UCGnjeahCJW1AF34HBmQTJ-Q', author: 'shakiraVEVO'
    }
  };
  const response = { ok: true, clone() { return { json: async () => payload }; } };
  const context = {
    URL, Promise, Request: class Request {}, HTMLMediaElement,
    location: { href: 'https://www.youtube.com/embed/?enablejsapi=1', origin: 'https://www.youtube.com' },
    document: { addEventListener(type, listener) { listeners.set(`document:${type}`, listener); } },
    addEventListener(type, listener) { listeners.set(`window:${type}`, listener); },
    fetch: async () => response,
    postMessage(message) {
      posted.push(message);
      listeners.get('window:message')?.({ source: context, data: message });
    },
    XMLHttpRequest: function XMLHttpRequest() {}
  };
  context.XMLHttpRequest.prototype = {};
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(networkSource, context);

  context.FilterTubeExternalYouTubeNetwork.acceptControlMessage({
    type: 'FilterTube_ExternalYouTubeAdmissionControl', source: 'filtertube-external-guard', active: true
  });
  const video = new context.HTMLMediaElement();
  await video.play();
  assert.equal(video.playCount, 0, 'native play must not start before the ID-less embed returns Player metadata');
  assert.equal(video.pauseCount, 1);

  await context.fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.ok(posted.some(message => message.type === 'FilterTube_ExternalYouTubePlaybackAttempt' && message.payload.videoId === 'fcnDmrtj6Sk'));

  context.FilterTubeExternalYouTubeNetwork.acceptControlMessage({
    type: 'FilterTube_ExternalYouTubeAdmissionDecision', source: 'filtertube-external-guard',
    videoId: 'fcnDmrtj6Sk', decision: 'allowed'
  });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(video.playCount, 1, 'the exact held media resumes only after an allowed decision');
  assert.equal(video.paused, false);
});

test('the Google parent never treats unrelated top-document media as the current YouTube iframe', async () => {
  const listeners = new Map();
  class HTMLMediaElement {
    constructor() { this.playCount = 0; this.pauseCount = 0; }
    play() { this.playCount += 1; return Promise.resolve(); }
    pause() { this.pauseCount += 1; }
  }
  const context = {
    URL, Promise, Request: class Request {}, HTMLMediaElement,
    location: {
      href: 'https://www.google.com/search?q=shakira#fpstate=ive&vld=cid:x,vid:fcnDmrtj6Sk,st:0',
      origin: 'https://www.google.com'
    },
    document: { addEventListener(type, listener) { listeners.set(`document:${type}`, listener); }, querySelectorAll() { return []; } },
    addEventListener(type, listener) { listeners.set(`window:${type}`, listener); },
    fetch: async () => ({ ok: false }), postMessage() {}, XMLHttpRequest: function XMLHttpRequest() {}
  };
  context.XMLHttpRequest.prototype = {};
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(networkSource, context);
  context.FilterTubeExternalYouTubeNetwork.acceptControlMessage({
    type: 'FilterTube_ExternalYouTubeAdmissionControl', source: 'filtertube-external-guard', active: true
  });
  const unrelated = new context.HTMLMediaElement();
  await unrelated.play();
  assert.equal(unrelated.playCount, 1);
  assert.equal(unrelated.pauseCount, 0);
});

test('a blocked Google YouTube embed remains held and disabling admission releases it', async () => {
  const listeners = new Map();
  class HTMLMediaElement {
    constructor() { this.paused = true; this.playCount = 0; this.pauseCount = 0; }
    play() { this.playCount += 1; this.paused = false; return Promise.resolve(); }
    pause() { this.pauseCount += 1; this.paused = true; }
  }
  const response = {
    ok: true,
    clone() { return { json: async () => ({ videoDetails: { videoId: 'fcnDmrtj6Sk' } }) }; }
  };
  const context = {
    URL, Promise, Request: class Request {}, HTMLMediaElement,
    location: { href: 'https://www.youtube.com/embed/?enablejsapi=1', origin: 'https://www.youtube.com' },
    document: { addEventListener(type, listener) { listeners.set(`document:${type}`, listener); } },
    addEventListener(type, listener) { listeners.set(`window:${type}`, listener); },
    fetch: async () => response,
    postMessage(message) { listeners.get('window:message')?.({ source: context, data: message }); },
    XMLHttpRequest: function XMLHttpRequest() {}
  };
  context.XMLHttpRequest.prototype = {};
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(networkSource, context);
  context.FilterTubeExternalYouTubeNetwork.acceptControlMessage({
    type: 'FilterTube_ExternalYouTubeAdmissionControl', source: 'filtertube-external-guard', active: true
  });
  await context.fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false');
  await new Promise(resolve => setTimeout(resolve, 0));
  const video = new context.HTMLMediaElement();
  await video.play();
  context.FilterTubeExternalYouTubeNetwork.acceptControlMessage({
    type: 'FilterTube_ExternalYouTubeAdmissionDecision', source: 'filtertube-external-guard',
    videoId: 'fcnDmrtj6Sk', decision: 'blocked'
  });
  assert.equal(video.playCount, 0);
  assert.equal(video.paused, true);
  context.FilterTubeExternalYouTubeNetwork.acceptControlMessage({
    type: 'FilterTube_ExternalYouTubeAdmissionControl', source: 'filtertube-external-guard', active: false
  });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(video.playCount, 1);
  assert.equal(video.paused, false);
});
