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

function homePayload() {
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

function playerPayload() {
  return {
    playabilityStatus: { status: 'OK' },
    videoDetails: {
      videoId: 'watchvideo01',
      title: 'Calm watch video'
    }
  };
}

test('P0 no-work audit documents current behavior and future counter contract', () => {
  const doc = read('docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md');
  const p0Register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');

  for (const fixture of [
    'empty_blocklist_desktop_home_no_work',
    'empty_blocklist_mobile_home_no_work',
    'empty_blocklist_watch_no_player_mutation',
    'disabled_extension_no_mutation'
  ]) {
    assert.ok(doc.includes(fixture), `missing no-work fixture ${fixture}`);
    assert.ok(p0Register.includes(fixture), `fixture must remain in P0 register ${fixture}`);
  }

  for (const phrase of [
    'responseJson: 0',
    'jsonStringify: 0',
    'processData: 0',
    'harvestOnly: 0',
    'DOM scans: 0',
    'P0 no-work family is green for seed network pass-through fixtures'
  ]) {
    assert.ok(doc.includes(phrase), `missing no-work counter phrase ${phrase}`);
  }
});

test('empty_blocklist_desktop_home_no_work is satisfied by current behavior', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homePayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 0, 'desktop home skips processData');
  assert.equal(runtime.calls.harvestOnly.length, 0, 'desktop home skips identity harvest without active work');
  assert.equal(runtime.calls.responseJson.length, 0, 'desktop home does not parse a cloned response');
  assert.equal(runtime.calls.jsonStringify.length, 0, 'desktop home does not rebuild the response body');
});

test('empty_blocklist_mobile_home_no_work is satisfied by current behavior', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'm.youtube.com',
    origin: 'https://m.youtube.com',
    pathname: '/',
    payload: homePayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://m.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 0, 'mobile home skips processData');
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0, 'mobile home does not parse a cloned response');
  assert.equal(runtime.calls.jsonStringify.length, 0, 'mobile home does not rebuild the response body');
});

test('empty_blocklist_watch_no_player_mutation is satisfied by current behavior', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: playerPayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 0, 'watch player skips processData without active work');
  assert.equal(runtime.calls.responseJson.length, 0, 'watch player does not parse a cloned response');
  assert.equal(runtime.calls.jsonStringify.length, 0, 'watch player does not rebuild the response body');
});

test('disabled_extension_no_mutation is satisfied by current behavior', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homePayload()
  });
  runtime.window.filterTube.updateSettings(settings({ enabled: false }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 0, 'disabled mode avoids processData today');
  assert.equal(runtime.calls.harvestOnly.length, 0, 'disabled mode avoids harvestOnly today');
  assert.equal(runtime.calls.responseJson.length, 0, 'disabled mode does not parse a cloned response');
  assert.equal(runtime.calls.jsonStringify.length, 0, 'disabled mode does not rebuild the response body');
});
