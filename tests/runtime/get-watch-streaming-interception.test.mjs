import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const encoder = new TextEncoder();
const clone = value => JSON.parse(JSON.stringify(value));
const player = {
  responseType: 'PLAYER_RESPONSE', subStreamResponseCompleted: true,
  playerResponse: {
    videoDetails: { videoId: 'abcdefghijk', lengthSeconds: '215', title: '音楽 😀 braces } ] and "quotes" \\ path' },
    streamingData: { formats: [{ itag: 18, url: 'https://example.invalid/requested' }] },
    playabilityStatus: { status: 'OK' }, adSlots: [{ synthetic: true }]
  }
};
const tail = {
  responseType: 'WATCH_NEXT_RESPONSE', subStreamResponseCompleted: true,
  responseContext: { synthetic: true }, watchNextResponse: { contents: [
    { adSlotRenderer: { slotId: 'synthetic' } },
    { videoRenderer: { videoId: 'abcdefghijk', title: { simpleText: 'Organic' } } },
    { continuationItemRenderer: { continuationEndpoint: { continuationCommand: { token: 'next😀' } } } }
  ] }
};
const cleanedPlayer = clone(player);
delete cleanedPlayer.playerResponse.adSlots;
const cleanedTail = clone(tail);
cleanedTail.watchNextResponse.contents.shift();
const activeSettings = {
  enabled: true, hideSponsoredCards: true, listMode: 'blocklist',
  filterChannels: [], filterKeywords: [], filterKeywordsComments: [],
  whitelistChannels: [], whitelistKeywords: [], contentFilters: {},
  categoryFilters: { enabled: false, selected: [] }, languageFilters: { enabled: false, selected: [] }
};

// Reuse the seed harness primitives but install real platform streams/Response in
// a fresh VM before running the complete production script. No parser is mocked.
function runtime(response, { settings = activeSettings, processData } = {}) {
  const base = loadSeedRuntime();
  const document = base.context.document;
  Object.assign(document.location, { search: '?v=abcdefghijk', origin: 'https://www.youtube.com', pathname: '/watch' });
  Object.assign(document, {
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    createElement: () => ({ style: {}, setAttribute() {}, removeAttribute() {}, remove() {} }),
    head: { appendChild() {} }
  });
  let fetchCount = 0;
  const context = { ...base.context, document, location: document.location,
    Response, Request, Headers, ReadableStream, TransformStream, TextEncoder, TextDecoder, URL, URLSearchParams };
  context.window = {
    __filtertubeDebug: false,
    fetch() { fetchCount++; return Promise.resolve(response); },
    XMLHttpRequest: base.context.XMLHttpRequest,
    postMessage() {}, addEventListener() {}, dispatchEvent() {}, setInterval: () => 1, clearInterval() {}
  };
  if (processData) context.window.FilterTubeEngine = { processData, harvestOnly() {} };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('js/seed.js', 'utf8'), context, { filename: 'js/seed.js' });
  if (settings) context.window.filterTube.updateSettings(clone(settings));
  return { window: context.window, fetchCount: () => fetchCount };
}
function controlled() {
  let controller;
  const cancellations = [];
  const stream = new ReadableStream({
    start(value) { controller = value; }, cancel(reason) { cancellations.push(reason); }
  }, { highWaterMark: 0 });
  return { stream, cancellations,
    send: text => controller.enqueue(typeof text === 'string' ? encoder.encode(text) : text),
    close: () => controller.close(), error: value => controller.error(value) };
}
async function readThroughRecord(reader, count = 1) {
  const decoder = new TextDecoder();
  let text = '';
  for (;;) {
    const value = await reader.read();
    assert.equal(value.done, false, 'response must remain open while its tail is pending');
    text += decoder.decode(value.value, { stream: true });
    try {
      const parsed = JSON.parse(`${text}]`);
      if (parsed.length === count) return { text, parsed };
    } catch {}
  }
}

test('get_watch headers and complete first player record arrive before unreleased watch-next tail', { timeout: 1500 }, async t => {
  const source = controlled();
  t.after(() => { try { source.error(new Error('synthetic-test-cleanup')); } catch {} });
  const original = new Response(source.stream, { status: 200, statusText: 'OK',
    headers: { 'content-type': 'application/json', 'x-synthetic': 'retained', 'content-length': '99999' } });
  const state = runtime(original);
  let deadline;
  const response = await Promise.race([
    state.window.fetch('/youtubei/v1/get_watch?prettyPrint=false'),
    new Promise((resolve, reject) => {
      deadline = setTimeout(() => reject(new Error('get_watch headers waited for the unreleased response tail')), 500);
    })
  ]).finally(() => clearTimeout(deadline));
  assert.equal(response.headers.get('x-synthetic'), 'retained');
  assert.equal(response.headers.get('content-type'), 'application/json');
  assert.equal(response.headers.get('content-length'), null, 'transformed bytes do not retain a stale wire length');
  const reader = response.body.getReader();
  source.send(`[${JSON.stringify(player)},`);
  let prefix = '';
  while (!prefix.endsWith(',')) {
    const next = await reader.read();
    assert.equal(next.done, false);
    prefix += new TextDecoder().decode(next.value);
  }
  assert.deepEqual(JSON.parse(`${prefix.slice(0, -1)}]`), [cleanedPlayer]);
  source.send(`${JSON.stringify(tail)}]`);
  source.close();
  let text = prefix;
  for (;;) { const next = await reader.read(); if (next.done) break; text += new TextDecoder().decode(next.value); }
  assert.deepEqual(JSON.parse(text), [cleanedPlayer, cleanedTail]);
  assert.equal(state.fetchCount(), 1, 'no replacement request');
  assert.equal(source.stream.locked, false, 'reader released on completion');
});

test('every UTF-8 byte split preserves nested arrays, escaped quotes/backslashes, braces, Unicode and continuations', async () => {
  const input = [player, tail, [null, true, 12.5, 'nested 😀 " \\ } ]', { contents: [{ adSlotRenderer: {} }, { marker: 'kept' }] }]];
  const expected = [cleanedPlayer, cleanedTail, [null, true, 12.5, 'nested 😀 " \\ } ]', { contents: [{ marker: 'kept' }] }]];
  const bytes = encoder.encode(JSON.stringify(input));
  for (let split = 0; split <= bytes.length; split++) {
    const source = controlled();
    const state = runtime(new Response(source.stream));
    const response = await state.window.fetch('/youtubei/v1/get_watch');
    const parsed = response.json();
    source.send(bytes.slice(0, split)); source.send(bytes.slice(split)); source.close();
    assert.deepEqual(await parsed, expected, `split at byte ${split}`);
  }
});

test('one-byte chunks and top-level primitive records remain valid without losing empty or false values', async () => {
  const bytes = encoder.encode(JSON.stringify([player, '', false, null, 0, 1e12, '😀', [], tail]));
  const state = runtime(new Response(new ReadableStream({ start(controller) {
    for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
    controller.close();
  } })));
  assert.deepEqual(await (await state.window.fetch('/youtubei/v1/get_watch')).json(),
    [cleanedPlayer, '', false, null, 0, 1e12, '😀', [], cleanedTail]);
});

for (const [name, settings] of [
  ['Disabled', { ...activeSettings, enabled: false }],
  ['no active JSON work', { ...activeSettings, hideSponsoredCards: false }], ['settings unavailable', null]
]) {
  test(`${name} returns the original response before acquiring or reading its body`, async () => {
    const source = controlled();
    const original = new Response(source.stream);
    const state = runtime(original, { settings });
    assert.equal(await state.window.fetch('/youtubei/v1/get_watch'), original);
    assert.equal(source.stream.locked, false);
    assert.equal(original.bodyUsed, false);
    await original.body.cancel();
  });
}

test('normal object roots buffer safely then use the existing sanitizer, unknown text remains unchanged', async () => {
  for (const text of [JSON.stringify({ playerResponse: player.playerResponse, watchNextResponse: tail.watchNextResponse }), ")]}'\nunknown format", '']) {
    const source = controlled();
    const state = runtime(new Response(source.stream));
    const response = await state.window.fetch('/youtubei/v1/get_watch');
    const output = response.text();
    source.send(text.slice(0, 8)); source.send(text.slice(8)); source.close();
    const result = await output;
    if (text.startsWith('{')) assert.deepEqual(JSON.parse(result), {
      playerResponse: cleanedPlayer.playerResponse, watchNextResponse: cleanedTail.watchNextResponse
    });
    else assert.equal(result, text);
  }
});

test('each completed record still runs through the real general filtering-engine boundary', async () => {
  const records = [];
  const state = runtime(new Response(JSON.stringify([player, tail])), {
    settings: { ...activeSettings, filterKeywords: ['synthetic-rule'] },
    processData(data, settings, name) { records.push({ data: clone(data), name }); return { ...data, engineProcessed: true }; }
  });
  const parsed = await (await state.window.fetch('/youtubei/v1/get_watch')).json();
  assert.deepEqual(parsed, [{ ...cleanedPlayer, engineProcessed: true }, { ...cleanedTail, engineProcessed: true }]);
  assert.equal(records.length, 2);
  assert.ok(records.every(value => value.name === 'fetch:/youtubei/v1/get_watch'));
});

for (const suffix of ['[{"x":1}', '[{"x":1},]', '[{"x":1}]garbage', '[{"x":1}{"x":2}]', '[{"x":1},falsee]', '[\u00a0{"x":1}]']) {
  test(`malformed streamed array rejects instead of producing plausible valid JSON: ${suffix}`, async () => {
    const source = controlled();
    const state = runtime(new Response(source.stream));
    const response = await state.window.fetch('/youtubei/v1/get_watch');
    const output = response.text();
    source.send(suffix); source.close();
    await assert.rejects(output);
    assert.equal(source.stream.locked, false);
  });
}

test('consumer cancellation forwards its reason and releases the original reader', async () => {
  const source = controlled();
  const state = runtime(new Response(source.stream));
  const response = await state.window.fetch('/youtubei/v1/get_watch');
  const reader = response.body.getReader();
  source.send(`[${JSON.stringify(player)}`);
  await readThroughRecord(reader);
  await reader.cancel('synthetic-consumer-cancel');
  assert.deepEqual(source.cancellations, ['synthetic-consumer-cancel']);
  assert.equal(source.stream.locked, false);
});

test('upstream body errors propagate and release the reader after a delivered first player record', async () => {
  const source = controlled();
  const state = runtime(new Response(source.stream));
  const response = await state.window.fetch('/youtubei/v1/get_watch');
  const reader = response.body.getReader();
  source.send(`[${JSON.stringify(player)}`);
  await readThroughRecord(reader);
  source.error(new Error('synthetic-upstream-failure'));
  await assert.rejects(reader.read(), /synthetic-upstream-failure/);
  assert.equal(source.stream.locked, false);
});

test('similarly named endpoint keeps the prior whole-response path rather than acquiring a streaming reader', async () => {
  const source = controlled();
  const state = runtime(new Response(source.stream));
  let settled = false;
  const pending = state.window.fetch('/youtubei/v1/get_watch_extra').then(value => { settled = true; return value; });
  source.send(`[${JSON.stringify(player)}`);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(settled, false);
  source.send(']'); source.close();
  assert.deepEqual(await (await pending).json(), [player]);
});


test('settings disabled between records preserve later records without restarting or blocking the stream', async () => {
  const source = controlled();
  const state = runtime(new Response(source.stream));
  const response = await state.window.fetch('/youtubei/v1/get_watch');
  const reader = response.body.getReader();
  source.send(`[${JSON.stringify(player)}`);
  const first = await readThroughRecord(reader);
  state.window.filterTube.updateSettings({ ...activeSettings, enabled: false });
  source.send(`,${JSON.stringify(tail)}]`); source.close();
  let text = first.text;
  for (;;) { const next = await reader.read(); if (next.done) break; text += new TextDecoder().decode(next.value); }
  assert.deepEqual(JSON.parse(text), [cleanedPlayer, tail]);
  assert.equal(state.fetchCount(), 1);
});

test('native TransformStream transport preserves early delivery and cancellation during a pending upstream read', { timeout: 1500 }, async () => {
  const source = controlled();
  const transport = source.stream.pipeThrough(new TransformStream({ transform(chunk, controller) { controller.enqueue(chunk); } }));
  const state = runtime(new Response(transport));
  const response = await state.window.fetch('/youtubei/v1/get_watch');
  const reader = response.body.getReader();
  source.send(`[${JSON.stringify(player)}`);
  await readThroughRecord(reader);
  const pending = reader.read();
  await reader.cancel('synthetic-pending-cancel');
  assert.equal((await pending).done, true);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(source.cancellations, ['synthetic-pending-cancel']);
  assert.equal(transport.locked, false);
});


for (const scenario of [
  { mode: 'blocklist', rules: { filterKeywords: [{ pattern: 'Organic', flags: 'i' }] } },
  { mode: 'whitelist', rules: { whitelistKeywords: [{ pattern: 'Allowed recommendation', flags: 'i' }] } }
]) {
  test(`actual filter engine enforces ${scenario.mode} rules across streamed watch-next records`, async () => {
    const { engine } = loadFilterTubeEngine({ pathname: '/watch' });
    const recommendation = (videoId, title) => ({ compactVideoRenderer: {
      videoId, title: { simpleText: title },
      shortBylineText: { runs: [{ text: 'Synthetic channel', navigationEndpoint: {
        browseEndpoint: { browseId: 'UC1234567890123456789012' }
      } }] }
    } });
    const blocked = recommendation('blockedABCD', 'An Organic recommendation');
    const allowed = recommendation('allowedABCD', 'Allowed recommendation');
    const continuation = clone(tail.watchNextResponse.contents[2]);
    const watchNext = {
      responseContext: { synthetic: true }, responseType: 'WATCH_NEXT_RESPONSE', subStreamResponseCompleted: true,
      watchNextResponse: { contents: { twoColumnWatchNextResults: { secondaryResults: { secondaryResults: {
        results: [blocked, allowed, continuation]
      } } } } }
    };
    const source = controlled();
    const state = runtime(new Response(source.stream), {
      settings: { ...activeSettings, listMode: scenario.mode, ...scenario.rules },
      processData: (data, settings, name) => engine.processData(data, settings, name)
    });
    const response = await state.window.fetch('/youtubei/v1/get_watch?prettyPrint=false');
    const reader = response.body.getReader();
    source.send(`[${JSON.stringify(player)}`);
    const first = await readThroughRecord(reader);
    assert.deepEqual(first.parsed, [cleanedPlayer], 'the real engine preserves requested player identity and stream formats');
    source.send(`,${JSON.stringify(watchNext)}]`); source.close();
    let text = first.text;
    for (;;) { const next = await reader.read(); if (next.done) break; text += new TextDecoder().decode(next.value); }
    const output = JSON.parse(text);
    assert.deepEqual(output[0], cleanedPlayer);
    assert.deepEqual(output[1], {
      ...watchNext,
      watchNextResponse: { contents: { twoColumnWatchNextResults: { secondaryResults: { secondaryResults: {
        results: [allowed, continuation]
      } } } } }
    }, 'real keyword authority removes the disallowed row and preserves allowed siblings and pagination');
    assert.equal(state.fetchCount(), 1);
  });
}

test('actual engine keeps unresolved category rows for the existing viewport hydration policy while enforcing known allow-only categories', async () => {
  const { engine } = loadFilterTubeEngine({ pathname: '/watch' });
  const row = (videoId, title) => ({ videoRenderer: { videoId, title: { simpleText: title } } });
  const unknown = row('unknownABCD', 'Needs category hydration');
  const allowed = row('allowedABCD', 'Known Education');
  const rejected = row('blockedABCD', 'Known Gaming');
  const continuation = clone(tail.watchNextResponse.contents[2]);
  const inputTail = { ...clone(tail), watchNextResponse: { contents: [unknown, rejected, allowed, continuation] } };
  const state = runtime(new Response(JSON.stringify([player, inputTail])), {
    settings: {
      ...activeSettings, categoryFilters: { enabled: true, mode: 'allow', selected: ['Education'] },
      videoMetaMap: { allowedABCD: { category: 'Education' }, blockedABCD: { category: 'Gaming' } }
    },
    processData: (data, settings, name) => engine.processData(data, settings, name)
  });
  const output = await (await state.window.fetch('/youtubei/v1/get_watch')).json();
  assert.deepEqual(output, [cleanedPlayer, {
    ...inputTail, watchNextResponse: { contents: [unknown, allowed, continuation] }
  }]);
  assert.equal(state.fetchCount(), 1);
  // Unknown category survival here is only the existing JSON-stage contract;
  // the separate DOM hydration/pending guard remains responsible for display.
});
