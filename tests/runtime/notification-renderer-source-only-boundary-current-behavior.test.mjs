import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_NOTIFICATION_RENDERER_SOURCE_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const fixtureDir = 'tests/runtime/fixtures/captures';

const futureAuthorityTokens = [
  'notificationRendererRouteFixtureContract',
  'notificationRendererDecisionReport',
  'notificationRendererInventoryCoveragePolicy',
  'notificationRendererMapSideEffectBudget',
  'notificationRendererHideBellParityGate',
  'notificationRendererWhitelistPolicy',
  'notificationRendererNoRuleBudget',
  'notificationRendererJsonFirstGate'
];

const indexPaths = [
  'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md',
  'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function walk(relativePath, result = []) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return result;
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath)) {
      walk(path.join(relativePath, entry), result);
    }
    return result;
  }
  result.push(relativePath.replaceAll(path.sep, '/'));
  return result;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    ...overrides
  };
}

function syntheticNotification() {
  return {
    notificationRenderer: {
      title: { simpleText: 'Important upload' },
      shortMessage: { simpleText: 'New video from Notify Channel' },
      longMessage: { simpleText: 'Notify Channel uploaded an update' },
      sentTimeText: { simpleText: '1 hour ago' },
      navigationEndpoint: {
        browseEndpoint: {
          browseId: 'UCnotifychannel0000000000',
          canonicalBaseUrl: '/@notifychannel'
        },
        commandMetadata: {
          webCommandMetadata: {
            url: '/@notifychannel'
          }
        }
      }
    }
  };
}

function runNotification(overrides = {}) {
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(
    { contents: [plain(syntheticNotification())] },
    baseSettings(overrides),
    'synthetic-notification-renderer'
  );
  harness.flushTimers();
  return { output: plain(output), messages: plain(harness.messages) };
}

function notificationRows(output) {
  return (output.contents || [])
    .map((item) => item.notificationRenderer)
    .filter(Boolean);
}

function productRuntimeSource() {
  return [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js'
  ].map(read).join('\n');
}

test('notification renderer source-only boundary doc is audit-only and source-backed', () => {
  const doc = read(docPath);
  const filterLogic = read('js/filter_logic.js');
  const inventory = read('docs/youtube_renderer_inventory.md');

  assert.match(doc, /Status: audit-only current-behavior source slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /source coverage from fixture-backed route coverage/);
  assert.match(filterLogic, /notificationRenderer:\s*\{/);
  assert.match(inventory, /`notificationRenderer`\s*\|\s*✅ Covered/);
  assert.match(inventory, /`<ytd-notification-renderer>`\s*\|\s*`notificationRenderer`\s*\|\s*✅ Covered/);
});

test('notification renderer direct rule paths are present while committed fixtures have no real row', () => {
  const filterLogic = read('js/filter_logic.js');
  const ruleStart = filterLogic.indexOf('notificationRenderer: {');
  const ruleEnd = filterLogic.indexOf('commentVideoThumbnailHeaderRenderer:', ruleStart);
  const rule = filterLogic.slice(ruleStart, ruleEnd);
  const fixtureText = walk(fixtureDir).map(read).join('\n');

  for (const token of [
    'title.simpleText',
    'shortMessage.simpleText',
    'longMessage.simpleText',
    'sentTimeText.simpleText',
    'navigationEndpoint.browseEndpoint.browseId',
    'feedbackButton.buttonRenderer.navigationEndpoint.browseEndpoint.browseId',
    'navigationEndpoint.browseEndpoint.canonicalBaseUrl',
    'navigationEndpoint.commandMetadata.webCommandMetadata.url'
  ]) {
    assert.match(rule, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(fixtureText, /notificationRenderer/);
});

test('synthetic notification row preserves no-rule and queues channel-map side effect', () => {
  const { output, messages } = runNotification();

  assert.deepEqual(notificationRows(output).map((row) => row.title.simpleText), ['Important upload']);
  assert.deepEqual(messages.filter((message) => message.type === 'FilterTube_UpdateChannelMap').map((message) => message.payload[0]), [
    { id: 'UCnotifychannel0000000000', handle: '@notifychannel' }
  ]);
});

test('synthetic notification row filters by keyword and channel rules today', () => {
  const keywordRun = runNotification({ filterKeywords: [{ pattern: 'Important upload', flags: 'i' }] });
  assert.deepEqual(notificationRows(keywordRun.output), []);

  const channelRun = runNotification({
    filterChannels: [{ id: 'UCnotifychannel0000000000', handle: '@notifychannel' }]
  });
  assert.deepEqual(notificationRows(channelRun.output), []);
});

test('synthetic notification row whitelist and hideNotificationBell remain separate authorities', () => {
  const whitelistRun = runNotification({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCnotifychannel0000000000', handle: '@notifychannel' }]
  });
  assert.deepEqual(notificationRows(whitelistRun.output).map((row) => row.title.simpleText), ['Important upload']);

  const hideBellRun = runNotification({ hideNotificationBell: true });
  assert.deepEqual(notificationRows(hideBellRun.output).map((row) => row.title.simpleText), ['Important upload']);
});

test('notification renderer source-only boundary indexes and future symbols stay audit-only', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);

  for (const indexPath of indexPaths) {
    assert.match(read(indexPath), /Notification renderer source-only boundary addendum/);
    assert.match(read(indexPath), /notification-renderer-source-only-boundary-current-behavior\.test\.mjs/);
  }

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
