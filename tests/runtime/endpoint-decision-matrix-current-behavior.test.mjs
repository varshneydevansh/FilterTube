import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

const YOUTUBEI_ENDPOINTS = [
  '/youtubei/v1/search',
  '/youtubei/v1/guide',
  '/youtubei/v1/browse',
  '/youtubei/v1/next',
  '/youtubei/v1/player'
];

test('endpoint decision matrix documents the exact current YouTubei endpoint set', () => {
  const seed = read('js/seed.js');
  const doc = read('docs/audit/FILTERTUBE_ENDPOINT_DECISION_MATRIX_2026-05-18.md');
  const fetchBlock = sliceBetween(seed, 'const fetchEndpoints = [', '];');
  const xhrBlock = sliceBetween(seed, 'const xhrEndpoints = [', '];');

  for (const endpoint of YOUTUBEI_ENDPOINTS) {
    assert.match(fetchBlock, new RegExp(endpoint.replaceAll('/', '\\/')));
    assert.match(xhrBlock, new RegExp(endpoint.replaceAll('/', '\\/')));
    assert.match(doc, new RegExp(endpoint.replaceAll('/', '\\/')));
  }
});

test('endpoint decision matrix pins substring URL authority and eager fetch JSON work', () => {
  const seed = read('js/seed.js');
  const doc = read('docs/audit/FILTERTUBE_ENDPOINT_DECISION_MATRIX_2026-05-18.md');

  assert.match(seed, /fetchEndpoints\.some\(endpoint => urlStr\.includes\(endpoint\)\)/);
  assert.match(seed, /xhrEndpoints\.some\(endpoint => urlStr\.includes\(endpoint\)\)/);
  assert.match(seed, /response\.clone\(\)\.json\(\)\.then\(jsonData =>/);
  assert.match(seed, /return new Response\(JSON\.stringify\(processed\)/);

  assert.match(doc, /Endpoint matching must use parsed URL origin and exact pathname/);
  assert.match(doc, /even the no-settings, disabled, and harvest-only branches happen\s+after the fetch body has already been cloned and parsed/);
});

test('endpoint decision matrix covers every current endpoint risk row and future decision type', () => {
  const doc = read('docs/audit/FILTERTUBE_ENDPOINT_DECISION_MATRIX_2026-05-18.md');

  for (const phrase of [
    'Empty search still pays parse/harvest/rewrite cost',
    'Main mobile home and blank filter states can lag',
    'Comments, watch rails, playlists, and end-screen share one broad endpoint',
    'Playback/player payloads can compete with page load',
    'Guide/sidebar work happens without a proven active guide rule',
    'passThrough',
    'harvestOnly',
    'mutateRecommendations',
    'commentsContinuationRewrite',
    'playerMetadataOnly',
    'unsupportedNoop'
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
