import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    hideAllComments: false,
    hideAllShorts: false,
    showQuickBlockButton: false,
    showBlockMenuItem: false,
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function searchPayload() {
  return {
    contents: {
      twoColumnSearchResultsRenderer: {
        primaryContents: {
          sectionListRenderer: {
            contents: [{
              itemSectionRenderer: {
                contents: [{
                  videoRenderer: {
                    videoId: 'searchvideo1',
                    title: { runs: [{ text: 'Calm search result' }] }
                  }
                }]
              }
            }]
          }
        }
      }
    }
  };
}

function homePayload() {
  return {
    onResponseReceivedActions: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          richItemRenderer: {
            content: {
              videoRenderer: {
                videoId: 'mobilehome01',
                title: { runs: [{ text: 'Calm mobile home card' }] }
              }
            }
          }
        }]
      }
    }]
  };
}

function nextPayload() {
  return {
    contents: {
      twoColumnWatchNextResults: {
        secondaryResults: {
          secondaryResults: {
            results: [{
              compactVideoRenderer: {
                videoId: 'watchnext01',
                title: { simpleText: 'Calm watch next card' }
              }
            }]
          }
        }
      }
    }
  };
}

function playerPayload() {
  return {
    playabilityStatus: { status: 'OK' },
    videoDetails: {
      videoId: 'playeronly01',
      title: 'Calm player metadata'
    },
    microformat: {
      playerMicroformatRenderer: {
        ownerChannelName: 'Calm Channel',
        externalChannelId: 'UCcalmplayer0000000001'
      }
    },
    nestedRendererSurface: {
      videoRenderer: {
        videoId: 'nestedcard01',
        title: { runs: [{ text: 'Nested renderer inside player payload' }] }
      }
    }
  };
}

function guidePayload() {
  return {
    items: [{
      guideEntryRenderer: {
        formattedTitle: { simpleText: 'Subscriptions' }
      }
    }]
  };
}

test('P0 endpoint policy audit documents current behavior and future endpoint contract', () => {
  const doc = read('docs/audit/FILTERTUBE_P0_ENDPOINT_POLICY_CURRENT_BEHAVIOR_2026-05-18.md');
  const p0Register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');

  for (const fixture of [
    'seed_search_no_rule_pass_through',
    'seed_browse_mobile_home_no_rule_pass_through',
    'seed_next_watch_no_rule_pass_through',
    'seed_player_metadata_only',
    'seed_guide_no_rule_pass_through'
  ]) {
    assert.ok(doc.includes(fixture), `missing endpoint fixture ${fixture}`);
    assert.ok(p0Register.includes(fixture), `fixture must remain in P0 register ${fixture}`);
  }

  for (const phrase of [
    'endpointPolicy decision exists before response body work',
    'parsed URL origin and exact pathname are used',
    'route and surface are part of the decision',
    'compiledRuleState is part of the decision',
    'player response mutation: 0',
    'P0 endpoint-policy family is green for no-rule pass-through fixtures'
  ]) {
    assert.ok(doc.includes(phrase), `missing endpoint contract phrase ${phrase}`);
  }
});

test('seed_search_no_rule_pass_through is satisfied by current behavior', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/results',
    payload: searchPayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 0, 'search skips processData');
  assert.equal(runtime.calls.harvestOnly.length, 0, 'search skips harvest without active work');
  assert.equal(runtime.calls.responseJson.length, 0, 'search does not parse a cloned response');
  assert.equal(runtime.calls.jsonStringify.length, 0, 'search does not rebuild the response body');
});

test('seed_browse_mobile_home_no_rule_pass_through is satisfied by current behavior', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'm.youtube.com',
    origin: 'https://m.youtube.com',
    pathname: '/',
    payload: homePayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://m.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 0, 'mobile browse skips processData');
  assert.equal(runtime.calls.responseJson.length, 0, 'mobile browse does not parse a cloned response');
  assert.equal(runtime.calls.jsonStringify.length, 0, 'mobile browse does not rebuild the response body');
});

test('seed_next_watch_no_rule_pass_through is satisfied by current behavior', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: nextPayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 0, 'watch next skips processData without active work');
  assert.equal(runtime.calls.responseJson.length, 0, 'watch next does not parse a cloned response');
  assert.equal(runtime.calls.jsonStringify.length, 0, 'watch next does not rebuild the response body');
});

test('seed_player_metadata_only is satisfied by current behavior', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: playerPayload(),
    processData(data, settingsArg, dataName) {
      assert.equal(dataName, 'fetch:/youtubei/v1/player');
      return {
        filterTubeMutatedPlayerBody: true,
        originalVideoId: data?.videoDetails?.videoId || null
      };
    }
  });
  runtime.window.filterTube.updateSettings(settings());

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false');
  const body = JSON.parse(await response.text());

  assert.equal(runtime.calls.processData.length, 0, 'player skips processData without active work');
  assert.equal(runtime.calls.responseJson.length, 0, 'player does not parse a cloned response');
  assert.equal(runtime.calls.jsonStringify.length, 0, 'player does not rebuild the response body');
  assert.equal(body.videoDetails.videoId, 'playeronly01');
  assert.equal(body.filterTubeMutatedPlayerBody, undefined);
});

test('seed_guide_no_rule_pass_through is satisfied by current behavior', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: guidePayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/guide?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 0, 'guide skips processData without active work');
  assert.equal(runtime.calls.responseJson.length, 0, 'guide does not parse a cloned response');
  assert.equal(runtime.calls.jsonStringify.length, 0, 'guide does not rebuild the response body');
});
