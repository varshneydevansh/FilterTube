import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    hideAllComments: false,
    hideAllShorts: false,
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function homeContinuationPayload() {
  return {
    onResponseReceivedActions: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          richItemRenderer: {
            content: {
              videoRenderer: {
                videoId: 'abcdefghijk',
                title: { runs: [{ text: 'Calm home card' }] }
              }
            }
          }
        }]
      }
    }]
  };
}

function searchPayload() {
  return {
    header: { searchHeaderRenderer: {} },
    onResponseReceivedCommands: [{
      appendContinuationItemsAction: {
        continuationItems: [{ videoRenderer: { videoId: 'abcdefghijk' } }]
      }
    }]
  };
}

function actualEngineProcessData() {
  const { engine } = loadFilterTubeEngine();
  return (data, activeSettings, dataName) => engine.processData(data, activeSettings, dataName);
}

test('search fetch with empty blocklist passes through without parse harvest or processData', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/results',
    payload: searchPayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  const body = JSON.parse(await response.text());

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.deepEqual(body, searchPayload());
});

test('non-youtubei fetch currently bypasses JSON parsing and engine work', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/',
    payload: { ok: true }
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/api/stats/watchtime');

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('fetch URL with youtubei endpoint only in query bypasses no-work body processing', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: { ok: true }
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://example.invalid/log?u=/youtubei/v1/search');

  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
});

test('fetch path that only starts with youtubei endpoint text bypasses no-work body processing', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: { ok: true }
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/searchExtra?prettyPrint=false');

  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
});

test('XHR URL with youtubei endpoint only in query does not mark no-work requests for processing', () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: { ok: true }
  });
  runtime.window.filterTube.updateSettings(settings());

  const xhr = new runtime.window.XMLHttpRequest();
  xhr.open('GET', 'https://example.invalid/log?u=/youtubei/v1/search');

  assert.equal(xhr.__filtertube_shouldProcessXhr, false);
});

test('search no-work skip avoids cloned response parse and stringify', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/results',
    payload: searchPayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('search fetch with active blocklist rule currently calls processData', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/results',
    payload: searchPayload()
  });
  runtime.window.filterTube.updateSettings(settings({
    filterKeywords: [{ pattern: 'spider', flags: 'i' }]
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/search');
});

test('search fetch with category enabled but empty selected is no active JSON work', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/results',
    payload: searchPayload()
  });
  runtime.window.filterTube.updateSettings(settings({
    categoryFilters: { enabled: true, mode: 'block', selected: [] }
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('search fetch with upload-date enabled but blank dates currently calls processData', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/results',
    payload: searchPayload()
  });
  runtime.window.filterTube.updateSettings(settings({
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: true, condition: 'newer', fromDate: '', toDate: '', value: '' },
      uppercase: { enabled: false }
    }
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/search');
});

test('desktop home browse continuation with empty blocklist passes through without harvest', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('desktop home browse continuation with active blocklist rule currently calls processData', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  runtime.window.filterTube.updateSettings(settings({
    filterChannels: [{ id: 'UC1234567890123456789012', handle: '@calmchannel' }]
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/browse');
});

test('desktop home browse with category enabled but empty selected is no active JSON work', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  runtime.window.filterTube.updateSettings(settings({
    categoryFilters: { enabled: true, mode: 'block', selected: [] }
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('desktop home browse with duration enabled but empty thresholds currently calls processData', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  runtime.window.filterTube.updateSettings(settings({
    contentFilters: {
      duration: { enabled: true, condition: 'longer', minMinutes: 0, maxMinutes: 0, value: '' },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    }
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/browse');
});

test('desktop home browse with upload-date enabled but blank dates currently calls processData', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  runtime.window.filterTube.updateSettings(settings({
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: true, condition: 'newer', fromDate: '', toDate: '', value: '' },
      uppercase: { enabled: false }
    }
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/browse');
});

test('mobile home browse continuation with empty blocklist passes through without processData', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'm.youtube.com',
    origin: 'https://m.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://m.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('disabled settings skip harvest processData cloned parse and stringify for fetch responses', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  runtime.window.filterTube.updateSettings(settings({ enabled: false }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('player fetch with empty blocklist passes through without processData', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/watch',
    payload: {
      playabilityStatus: { status: 'OK' },
      videoDetails: { title: 'Calm watch video' }
    }
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('player fetch currently replaces the response body with engine output', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/watch',
    payload: {
      playabilityStatus: { status: 'OK' },
      videoDetails: { title: 'Calm watch video' }
    },
    processData(data) {
      return {
        ...data,
        filterTubeAuditMarker: 'player-response-replaced'
      };
    }
  });
  runtime.window.filterTube.updateSettings(settings({
    filterKeywords: [{ pattern: 'spider', flags: 'i' }]
  }));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false');
  const body = await response.json();

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/player');
  assert.equal(body.filterTubeAuditMarker, 'player-response-replaced');
});

test('player fetch with active rule can return actual engine-mutated renderer arrays', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/watch',
    payload: {
      playabilityStatus: { status: 'OK' },
      videoDetails: { title: 'Calm watch video' },
      contents: [{
        videoRenderer: {
          videoId: 'abcdefghijk',
          title: { runs: [{ text: 'spider renderer inside player-shaped response' }] }
        }
      }]
    },
    processData: actualEngineProcessData()
  });
  runtime.window.filterTube.updateSettings(settings({
    filterKeywords: [{ pattern: 'spider', flags: 'i' }]
  }));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false');
  const body = await response.json();

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/player');
  assert.deepEqual(body.contents, []);
  assert.equal(body.videoDetails.title, 'Calm watch video');
});

test('watch next fetch with empty blocklist passes through without processData', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/watch',
    payload: {
      contents: {
        twoColumnWatchNextResults: {
          secondaryResults: {
            secondaryResults: { results: [] }
          }
        }
      }
    }
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('watch next fetch with active rule returns actual engine-mutated recommendation arrays', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/watch',
    payload: {
      contents: {
        twoColumnWatchNextResults: {
          secondaryResults: {
            secondaryResults: {
              results: [{
                compactVideoRenderer: {
                  videoId: 'abcdefghijk',
                  title: { simpleText: 'spider sidebar recommendation' }
                }
              }]
            }
          }
        }
      }
    },
    processData: actualEngineProcessData()
  });
  runtime.window.filterTube.updateSettings(settings({
    filterKeywords: [{ pattern: 'spider', flags: 'i' }]
  }));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  const body = await response.json();
  const results = body.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results;

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
  assert.deepEqual(results, []);
});

test('watch next comment continuation with hideAllComments currently bypasses engine and returns synthetic end marker', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/watch',
    payload: {
      onResponseReceivedEndpoints: [{
        appendContinuationItemsAction: {
          continuationItems: [{
            commentThreadRenderer: {
              comment: {
                commentRenderer: {
                  commentId: 'Ugw-seed-comment',
                  contentText: { runs: [{ text: 'Comment body' }] }
                }
              }
            }
          }]
        }
      }]
    }
  });
  runtime.window.filterTube.updateSettings(settings({
    hideAllComments: true
  }));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  const body = await response.json();
  const continuationItems = body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems;

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(continuationItems?.length, 1);
  assert.equal(continuationItems[0].continuationItemRenderer?.continuationEndpoint, null);
});

test('watch next reload comment continuation with hideAllComments currently misses synthetic end shortcut', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/watch',
    payload: {
      onResponseReceivedEndpoints: [{
        reloadContinuationItemsCommand: {
          continuationItems: [{
            commentThreadRenderer: {
              comment: {
                commentRenderer: {
                  commentId: 'Ugw-seed-reload-comment',
                  contentText: { runs: [{ text: 'Reloaded comment body' }] }
                }
              }
            }
          }]
        }
      }]
    }
  });
  runtime.window.filterTube.updateSettings(settings({
    hideAllComments: true
  }));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  const body = await response.json();
  const continuationItems = body.onResponseReceivedEndpoints?.[0]?.reloadContinuationItemsCommand?.continuationItems;

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(continuationItems?.[0]?.commentThreadRenderer?.comment?.commentRenderer?.commentId, 'Ugw-seed-reload-comment');
});

test('guide fetch with empty blocklist passes through without processData', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/',
    payload: {
      items: [{ guideEntryRenderer: { formattedTitle: { simpleText: 'Subscriptions' } } }]
    }
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/guide?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('youtubei fetch before settings are loaded passes through without parse or queueing', async () => {
  const payload = homeContinuationPayload();
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload
  });

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');
  const body = JSON.parse(await response.text());

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.deepEqual(body, payload);
});
