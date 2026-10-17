import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

// Synthetic fixtures use the registered shelf/list/video renderer structure.
// They prove this extraction boundary, not the #76 reporter's unavailable
// response JSON, imported list, or installed Chrome/Windows behavior.

const blocked = 'UCabcdefghijklmnopqrstuv';
const allowed = 'UCzyxwvutsrqponmlkjihgfe';
const clone = value => JSON.parse(JSON.stringify(value));
const settings = extra => ({ enabled: true, listMode: 'blocklist', filterChannels: [{ id: blocked }],
  filterKeywords: [], whitelistChannels: [], whitelistKeywords: [], hideAllShorts: false, hideAllComments: false, ...extra });

function video(id = 'abcdefghijk', owner = null, extra = {}) {
  return { videoRenderer: { videoId: id, title: { simpleText: 'A calm episode' }, ...(owner ? {
    shortBylineText: { runs: [{ text: 'An explicit creator', navigationEndpoint: { browseEndpoint: { browseId: owner } } }] }
  } : {}), ...extra } };
}

function shelf(items, id = blocked, list = 'horizontalListRenderer') {
  return { shelfRenderer: {
    header: { shelfHeaderRenderer: { title: { simpleText: 'Latest uploads' },
      ...(id ? { navigationEndpoint: { browseEndpoint: { browseId: id } } } : {}) } },
    ...(id ? { endpoint: { browseEndpoint: { browseId: id } } } : {}),
    content: { [list]: { items } }
  } };
}

function run(contents, options = {}, runtime = loadFilterTubeEngine({ pathname: '/results' })) {
  return { output: clone(runtime.engine.processData({ contents }, settings(options), 'synthetic-explicit-channel-shelf')), runtime };
}

function children(output, index = 0, list = 'horizontalListRenderer') {
  return output.contents[index].shelfRenderer.content[list].items;
}

for (const list of ['horizontalListRenderer', 'verticalListRenderer', 'expandedShelfContentsRenderer']) {
  test(`explicit channel shelf blocks ownerless immediate videos in ${list} without a title/query rule`, () => {
    const input = shelf([video()], blocked, list), before = clone(input);
    const { output } = run([input]);
    assert.equal(output.contents.length, 1, 'the structural shelf itself is preserved');
    assert.equal(children(output, 0, list).length, 0);
    assert.deepEqual(input, before, 'scoped attribution does not edit the input or persist owner metadata');
  });
}

test('explicit other owner survives beside inherited and explicitly blocked videos in the same shelf', () => {
  const { output } = run([shelf([video('inherited01'), video('blocked0001', blocked), video('allowed0001', allowed)])]);
  assert.deepEqual(children(output).map(item => item.videoRenderer.videoId), ['allowed0001']);
});

test('card owner name without an ID is not replaced by a containing channel', () => {
  const named = video('namedvideo1', null, { shortBylineText: { runs: [{ text: 'Another creator' }] } });
  const simple = video('simpletext1', null, { shortBylineText: { simpleText: 'Another creator' } });
  const { output } = run([shelf([named, simple])]);
  assert.deepEqual(children(output).map(item => item.videoRenderer.videoId), ['namedvideo1', 'simpletext1']);
});

for (const field of ['shortBylineText', 'longBylineText']) {
  for (const [label, value] of [
    ['empty object', {}], ['empty runs', { runs: [] }],
    ['blank run text', { runs: [{ text: ' \t ' }] }], ['blank simple text', { simpleText: '' }]
  ]) {
    test(`empty byline ${field}: ${label} permits only the explicit channel-shelf fallback`, () => {
      const item = video('abcdefghijk', null, { [field]: value });
      const { output } = run([shelf([item]), shelf([clone(item)], null), clone(item)]);
      assert.equal(children(output, 0).length, 0, 'an empty byline is not a known conflicting owner');
      assert.equal(children(output, 1).length, 1, 'an empty byline supplies no owner to a generic shelf');
      assert.equal(output.contents[2].videoRenderer.videoId, 'abcdefghijk', 'no attribution leaks to adjacent cards');
    });
  }
}

test('partial owner fields and endpoints remain conservative when current extraction cannot resolve their owner', () => {
  const cases = [
    { shortBylineText: { runs: [{ text: 'Other creator' }] } },
    { longBylineText: { simpleText: 'Other creator' } },
    { shortBylineText: { runs: [{}, { navigationEndpoint: { browseEndpoint: { browseId: allowed } } }] } },
    { longBylineText: { runs: [{ navigationEndpoint: { browseEndpoint: { canonicalBaseUrl: '/@other' } } }] } },
    { authorEndpoint: { browseEndpoint: { canonicalBaseUrl: '/@other' } } },
    { ownerText: { unknownOwnerMetadata: 'preserve unrecognized owner information' } }
  ];
  cases.forEach((extra, index) => {
    assert.equal(children(run([shelf([video('abcdefghijk', null, extra)])]).output).length, 1, `partial owner ${index}`);
  });
});

test('a UCID shelf does not turn a name-only imported rule into owner evidence from its title or query', () => {
  const item = shelf([video('abcdefghijk', null, { shortBylineText: { runs: [] } })]);
  item.shelfRenderer.header.shelfHeaderRenderer.title = { runs: [
    { text: 'SML', navigationEndpoint: { browseEndpoint: { browseId: blocked } } }
  ] };
  const { output } = run([item], { filterChannels: [{ id: '', name: 'SML', originalInput: 'SML', source: 'blocktube-channel-name' }] });
  assert.equal(children(output).length, 1, 'the fallback carries only the explicit UCID; reporter name-only coverage still needs its real identity data');
});

test('known video-owner cache takes precedence over a shelf fallback', () => {
  const { output } = run([shelf([video()])], { videoChannelMap: { abcdefghijk: allowed } });
  assert.equal(children(output).length, 1);
});

test('allow exceptions and allow-only mode evaluate the scoped owner without changing precedence', () => {
  const exception = run([shelf([video()])], { whitelistChannels: [{ id: blocked }] });
  assert.equal(children(exception.output).length, 1);
  const allowOnly = run([shelf([video()], allowed)], { listMode: 'whitelist', filterChannels: [], whitelistChannels: [{ id: allowed }] });
  assert.equal(children(allowOnly.output).length, 1);
  const rejected = run([shelf([video()], blocked)], { listMode: 'whitelist', filterChannels: [], whitelistChannels: [{ id: allowed }] });
  assert.equal(children(rejected.output).length, 0);
});

test('generic shelf never inherits identity from its label, query or first explicitly owned child', () => {
  const item = shelf([video('blocked0001', blocked), video('unknown0001')], null);
  item.shelfRenderer.header.shelfHeaderRenderer.title.simpleText = 'Latest from SML';
  item.shelfRenderer.endpoint = { searchEndpoint: { query: 'SML' } };
  const { output } = run([item]);
  assert.deepEqual(children(output).map(item => item.videoRenderer.videoId), ['unknown0001']);
});

test('non-channel browse endpoint and conflicting explicit channel endpoints cannot establish shelf ownership', () => {
  const generic = shelf([video()], 'FEtrending');
  const conflicting = shelf([video()]);
  conflicting.shelfRenderer.header.shelfHeaderRenderer.navigationEndpoint.browseEndpoint.browseId = allowed;
  const { output } = run([generic, conflicting]);
  assert.equal(children(output, 0).length, 1);
  assert.equal(children(output, 1).length, 1);
});

test('navigable channel title run supplies only its explicit UCID, never its text', () => {
  const item = shelf([video()], null);
  item.shelfRenderer.header.shelfHeaderRenderer.title = { runs: [
    { text: 'An unrelated label', navigationEndpoint: { browseEndpoint: { browseId: blocked } } }
  ] };
  assert.equal(children(run([item]).output).length, 0);
  item.shelfRenderer.header.shelfHeaderRenderer.title.runs[0].navigationEndpoint.browseEndpoint.browseId = allowed;
  assert.equal(children(run([item]).output).length, 1);
});

test('shelf attribution never propagates into metadata, sibling cards or nested generic shelves', () => {
  const item = shelf([video(), shelf([video('nested00001')], null)]);
  item.shelfRenderer.header.shelfHeaderRenderer.preview = video('preview0001');
  item.shelfRenderer.content.adjacent = video('adjacent001');
  const outside = video('outside0001');
  const { output } = run([item, outside]);
  assert.equal(children(output).length, 1, 'only the nested generic shelf survives the blocked direct video');
  const nested = children(output)[0];
  assert.equal(nested.shelfRenderer.content.horizontalListRenderer.items.length, 1);
  assert.equal(output.contents[0].shelfRenderer.header.shelfHeaderRenderer.preview.videoRenderer.videoId, 'preview0001');
  assert.equal(output.contents[0].shelfRenderer.content.adjacent.videoRenderer.videoId, 'adjacent001');
  assert.equal(output.contents[1].videoRenderer.videoId, 'outside0001');
});

test('shared card objects and reused engine never retain inferred owners across shelves or payloads', () => {
  const shared = video(); const runtime = loadFilterTubeEngine({ pathname: '/results' });
  const { output } = run([shelf([shared], blocked), shelf([shared], allowed)], {}, runtime);
  assert.equal(children(output, 0).length, 0); assert.equal(children(output, 1).length, 1);
  const next = run([shared], {}, runtime).output;
  assert.equal(next.contents.length, 1);
  assert.equal(runtime.messages.some(message => message.type === 'FilterTube_UpdateVideoChannelMap'), false);
});

test('wrapped richItem video receives the scoped fallback but playlists, comments and shorts do not', () => {
  const items = [
    { richItemRenderer: { content: video() } },
    { playlistRenderer: { playlistId: 'PLfixture', title: { simpleText: 'Collection' } } },
    { commentRenderer: { commentId: 'comment', contentText: { simpleText: 'ordinary' } } },
    { reelItemRenderer: { videoId: 'shorts00001', headline: { simpleText: 'Ordinary short' } } }
  ];
  const { output } = run([shelf(items)]);
  assert.deepEqual(children(output).map(item => Object.keys(item)[0]), ['playlistRenderer', 'commentRenderer', 'reelItemRenderer']);
});

test('Disabled bypasses shelf attribution and a 15k-rule list has no matching-position cap', () => {
  const input = [shelf([video()])];
  assert.deepEqual(run(clone(input), { enabled: false }).output, { contents: input });
  const filterChannels = Array.from({ length: 15453 }, (_, index) => ({ id: `UC${String(index).padStart(22, '0')}` }));
  filterChannels[filterChannels.length - 1] = { id: blocked };
  assert.equal(children(run(clone(input), { filterChannels }).output).length, 0);
});
