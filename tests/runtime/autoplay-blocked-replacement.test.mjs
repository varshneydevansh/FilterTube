// Issue #82: a blocked non-playlist autoplay/Next endpoint is pointed at the
// first related video in the same response that passes the full rule check.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const CURRENT = 'CURRENT0001';
const BLOCKED = 'BLOCKED0001';
const KEYWORD = 'KEYWORD0001';
const ALLOWED = 'ALLOWED0001';
const BLOCKED_CHANNEL = 'UCblockedblockedblocked1';
const OTHER_CHANNEL = 'UCotherotherotherother12';
const ALLOWED_CHANNEL = 'UCallowedallowedallowed1';

const plain = value => JSON.parse(JSON.stringify(value));

function byline(name, channelId) {
  return { runs: [{ text: name, navigationEndpoint: { browseEndpoint: { browseId: channelId, canonicalBaseUrl: `/channel/${channelId}` } } }] };
}

function compact(videoId, channelId, name, title) {
  return {
    compactVideoRenderer: {
      videoId,
      title: { simpleText: title },
      shortBylineText: byline(name, channelId),
      longBylineText: byline(name, channelId),
      navigationEndpoint: {
        commandMetadata: { webCommandMetadata: { url: `/watch?v=${videoId}`, webPageType: 'WEB_PAGE_TYPE_WATCH', rootVe: 3832 } },
        watchEndpoint: { videoId, nofollow: true }
      },
      lengthText: { simpleText: '4:00' }
    }
  };
}

function lockup(videoId, channelId, name, title) {
  return {
    lockupViewModel: {
      contentId: videoId,
      contentType: 'LOCKUP_CONTENT_TYPE_VIDEO',
      metadata: {
        lockupMetadataViewModel: {
          title: { content: title },
          image: { decoratedAvatarViewModel: { rendererContext: { commandContext: { onTap: { innertubeCommand: { browseEndpoint: { browseId: channelId, canonicalBaseUrl: `/channel/${channelId}` } } } } } } },
          metadata: { contentMetadataViewModel: { metadataRows: [{ metadataParts: [{ text: { content: name, commandRuns: [{ onTap: { innertubeCommand: { browseEndpoint: { browseId: channelId } } } }] } }] }] } }
        }
      },
      rendererContext: {
        commandContext: {
          onTap: {
            innertubeCommand: {
              commandMetadata: { webCommandMetadata: { url: `/watch?v=${videoId}`, webPageType: 'WEB_PAGE_TYPE_WATCH' } },
              watchEndpoint: { videoId }
            }
          }
        }
      }
    }
  };
}

function autoplayEndpoint(videoId, extra = {}) {
  return {
    clickTrackingParams: 'CLICK',
    commandMetadata: { webCommandMetadata: { url: `/watch?v=${videoId}&pp=QAFIAQ%3D%3D`, webPageType: 'WEB_PAGE_TYPE_WATCH', rootVe: 3832 } },
    watchEndpoint: { videoId, params: 'EAEYAdoBAggB', playerParams: 'QAFIAQ%3D%3D', ...extra }
  };
}

function response({ related, autoplayId = BLOCKED, endpointExtra = {}, playlist = false } = {}) {
  const watch = {
    results: { results: { contents: [] } },
    secondaryResults: { secondaryResults: { results: related } },
    autoplay: {
      autoplay: {
        sets: [{
          mode: 'NORMAL',
          autoplayVideo: autoplayEndpoint(autoplayId, endpointExtra),
          nextButtonVideo: autoplayEndpoint(autoplayId, endpointExtra),
          previousButtonVideo: autoplayEndpoint(autoplayId, endpointExtra)
        }],
        countDownSecs: 5
      }
    }
  };
  if (playlist) {
    watch.playlist = { playlist: { playlistId: 'PLtest', contents: [] } };
  }
  return { currentVideoEndpoint: { watchEndpoint: { videoId: CURRENT } }, contents: { twoColumnWatchNextResults: watch } };
}

const defaultRelated = () => [
  compact(BLOCKED, BLOCKED_CHANNEL, 'Blocked Owner', 'Blocked upload'),
  compact(KEYWORD, OTHER_CHANNEL, 'Other Owner', 'Forbidden topic review'),
  lockup(ALLOWED, ALLOWED_CHANNEL, 'Allowed Owner', 'Calm documentary')
];

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [{ pattern: 'forbidden', flags: 'i' }],
    filterChannels: [{ id: BLOCKED_CHANNEL }],
    whitelistKeywords: [],
    whitelistChannels: [],
    videoChannelMap: { [BLOCKED]: BLOCKED_CHANNEL },
    ...overrides
  };
}

function run(data, overrides) {
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(plain(data), settings(overrides), 'autoplay-82');
  harness.flushTimers();
  return output;
}

const set = output => output.contents.twoColumnWatchNextResults.autoplay?.autoplay?.sets?.[0];

test('blocked autoplay and Next are replaced by the first related video passing all rules', () => {
  const output = run(response({ related: defaultRelated() }));
  const entry = set(output);
  for (const key of ['autoplayVideo', 'nextButtonVideo']) {
    assert.equal(entry[key].watchEndpoint.videoId, ALLOWED, key);
    assert.equal(entry[key].commandMetadata.webCommandMetadata.url, `/watch?v=${ALLOWED}&pp=QAFIAQ%3D%3D`);
    assert.equal(entry[key].watchEndpoint.playerParams, 'QAFIAQ%3D%3D');
    assert.equal(entry[key].clickTrackingParams, 'CLICK');
  }
  // History is not a successor; a blocked Previous endpoint is still removed.
  assert.equal(entry.previousButtonVideo, undefined);
  // The keyword-blocked related card was skipped even though its channel is fine.
  const related = output.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results;
  assert.deepEqual(plain(related.map(item => item.lockupViewModel?.contentId || item.compactVideoRenderer?.videoId)), [ALLOWED]);
});

test('blocked autoplay is removed when no related video passes the rules', () => {
  const output = run(response({ related: defaultRelated().slice(0, 2) }));
  assert.equal(set(output), undefined);
});

test('the current video is never chosen as the replacement', () => {
  const output = run(response({ related: [compact(CURRENT, ALLOWED_CHANNEL, 'Allowed Owner', 'Current'), ...defaultRelated()] }));
  assert.equal(set(output).autoplayVideo.watchEndpoint.videoId, ALLOWED);
});

test('allow-only mode replaces an unmapped autoplay endpoint with an allowed related video', () => {
  const output = run(response({ related: defaultRelated() }), {
    listMode: 'whitelist',
    filterChannels: [],
    filterKeywords: [],
    videoChannelMap: {},
    whitelistChannels: [{ id: ALLOWED_CHANNEL }]
  });
  assert.equal(set(output).autoplayVideo.watchEndpoint.videoId, ALLOWED);
  assert.equal(set(output).nextButtonVideo.watchEndpoint.videoId, ALLOWED);
});

test('allow-only mode keeps YouTube\'s pick when its fully described related card is allowed', () => {
  const output = run(response({ related: defaultRelated(), autoplayId: ALLOWED }), {
    listMode: 'whitelist',
    filterChannels: [],
    filterKeywords: [],
    videoChannelMap: {},
    whitelistChannels: [{ id: ALLOWED_CHANNEL }]
  });
  assert.equal(set(output).autoplayVideo.watchEndpoint.videoId, ALLOWED);
  assert.equal(set(output).autoplayVideo.commandMetadata.webCommandMetadata.url, `/watch?v=${ALLOWED}&pp=QAFIAQ%3D%3D`);
});

test('Disable Autoplay still removes the whole autoplay set', () => {
  const output = run(response({ related: defaultRelated() }), { disableAutoplay: true });
  assert.deepEqual(plain(output.contents.twoColumnWatchNextResults.autoplay.autoplay.sets), []);
});

test('Disabled FilterTube leaves the response untouched', () => {
  const input = response({ related: defaultRelated() });
  const output = run(input, { enabled: false });
  assert.deepEqual(plain(output), plain(input));
});

test('playlist autoplay is not replaced and keeps the existing removal behavior', () => {
  const byEndpoint = run(response({ related: defaultRelated(), endpointExtra: { playlistId: 'PLtest', index: 3 } }));
  assert.equal(set(byEndpoint), undefined);
  const byPage = run(response({ related: defaultRelated(), playlist: true }));
  assert.equal(set(byPage), undefined);
});

test('an allowed autoplay endpoint is left exactly as YouTube sent it', () => {
  const input = response({ related: defaultRelated(), autoplayId: ALLOWED });
  const output = run(input);
  assert.deepEqual(plain(set(output).autoplayVideo), plain(input.contents.twoColumnWatchNextResults.autoplay.autoplay.sets[0].autoplayVideo));
});
