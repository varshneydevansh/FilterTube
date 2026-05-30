import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_INJECTOR_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/injector.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

function groupForMethod(name, line) {
  if ([
    'announceSubscriptionsImportBridgeReady',
    'handleSubscriptionsImportBridgeMessage',
    'installSubscriptionsImportBridge',
    'postLog'
  ].includes(name)) {
    return 'injectorBridgeLifecycleAndLogging';
  }
  if ([
    'hasList',
    'hasEnabledContentFilters',
    'hasSelectedCategoryFilters',
    'hasActiveJsonFilterRules',
    'hasNetworkJsonWork',
    'updateSeedSettings',
    'processDataWithFilterLogic',
    'processInitialDataQueue',
    'connectToSeedGlobal',
    'setupAdditionalHooks'
  ].includes(name)) {
    return 'injectorSeedHookAndQueueLifecycle';
  }
  if ([
    'extractRawHandle',
    'hasStrongCollaboratorIdentity',
    'normalizeCompositeCollaboratorLabel',
    'collaboratorCompositeLabelVariants',
    'isPlaceholderCollaboratorEntry',
    'isCompositeNameOnlyCollaborator',
    'sanitizeCollaboratorList',
    'markCollaboratorListSource',
    'getCollaboratorListSource',
    'getCollaboratorListQuality',
    'normalizeLooseText',
    'normalizeExpectedHandle'
  ].includes(name)) {
    return 'injectorCollaboratorIdentitySanitization';
  }
  if ([
    'safeStructuredClone',
    'sleep',
    'getYtcfgValue',
    'extractTextFromRenderer',
    'normalizeThumbnailUrl',
    'buildSubscriptionImportHeaders',
    'buildSubscriptionImportRequestProfiles',
    'isMobileHost',
    'isYoutubeChannelsFeedPath',
    'detectLoggedOutBrowseResponse'
  ].includes(name)) {
    return 'injectorSubscriptionContextAndPrimitiveHelpers';
  }
  if ([
    'collectSubscriptionImportArtifacts',
    'pushContinuationRequest',
    'visit',
    'collectSubscriptionImportDomSeed',
    'addSource',
    'collectSubscriptionImportPageSeed',
    'buildSubscriptionImportContext',
    'isElementVisibleForSubscriptionsImport',
    'getSubscriptionImportMoreButtons'
  ].includes(name) && line < 900) {
    return 'injectorSubscriptionSeedCollection';
  }
  if ([
    'expandSubscriptionsImportPageSeed',
    'performScrollStep',
    'getLatestSubscriptionImportBrowseSnapshotTs',
    'waitForSubscriptionImportSeed',
    'shouldKeepWaitingForGrowth'
  ].includes(name)) {
    return 'injectorSubscriptionExpansionAndWait';
  }
  if ([
    'getSubscriptionImportEntryKey',
    'normalizeSubscriptionImportEntry',
    'mergeSubscriptionImportEntries',
    'getSubscriptionsImportTrackedMatches',
    'buildSubscriptionsImportSample',
    'summarizeSubscriptionImportResponse',
    'visit',
    'logSubscriptionsImport'
  ].includes(name) && line >= 900 && line < 1282) {
    return 'injectorSubscriptionEntryNormalizationAndSummary';
  }
  if ([
    'fetchSubscribedChannelsFromYoutubei',
    'postProgress',
    'queueInitialProfile',
    'queueContinuation'
  ].includes(name)) {
    return 'injectorSubscriptionYoutubeiFetchAndQueue';
  }
  if ([
    'tokenizeExpectedCollaboratorNames',
    'pushToken',
    'buildExpectedMatcher',
    'isValidCollaboratorResponse',
    'scoreCollaboratorCandidate',
    'cacheCollaboratorsIfBetter'
  ].includes(name) && line >= 1690 && line < 1900) {
    return 'injectorCollaboratorMatcherAndCache';
  }
  if ([
    'extractCollaboratorsFromDataObject',
    'extractFromAvatarStackViewModel',
    'parseBrowseIdFromUrl',
    'pickEndpointUrl',
    'resolveBrowseEndpoint',
    'extractFromSheetLikeCommand',
    'normalizeUcId',
    'pickTextContent',
    'pickTitleText',
    'pickSubtitleText',
    'resolveCommandContext',
    'extractCollaboratorsFromListItems',
    'scan',
    'deepScanForShowDialog'
  ].includes(name) && line >= 2000 && line < 2448) {
    return 'injectorCollaboratorDataExtraction';
  }
  if ([
    'normalizeChannelName',
    'extractCustomUrlFromCanonicalBaseUrl',
    'decoded',
    'extractChannelLogoFromObject',
    'mergeChannelCandidates',
    'searchYtInitialDataForVideoChannel',
    'isWatchContext',
    'isCurrentWatchVideo',
    'extractOwnerCandidate',
    'extractThumbnailOwnerCandidate',
    'extractFromPlayerResponse',
    'watchOwnerCandidate',
    'scan',
    'matchesExpectations',
    'extractVideoIdFromNode',
    'pickSingleChannelFromCollaborators',
    'extractSingleChannelFromSheetLikeData',
    'searchNode',
    'searchRoot',
    'playerCandidate'
  ].includes(name) && line >= 2448 && line < 3055) {
    return 'injectorChannelSnapshotIdentitySearch';
  }
  if ([
    'searchYtInitialDataForCollaborators',
    'extractVideoIdFromNode',
    'searchObject',
    'currentVideoId',
    'hydrateFromStampedAttributes',
    'attemptExtraction'
  ].includes(name) && line >= 3055 && line < 3336) {
    return 'injectorCollaboratorSnapshotDomSearch';
  }
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    const fn = line.match(/^\s*(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (fn) {
      const name = fn[2];
      rows.push({
        line: index + 1,
        kind: fn[1] ? 'async function' : 'function',
        name,
        group: groupForMethod(name, index + 1)
      });
      return;
    }

    const constIife = line.match(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*\(\(\)\s*=>/);
    if (constIife) {
      const name = constIife[1];
      rows.push({
        line: index + 1,
        kind: 'const IIFE result',
        name,
        group: groupForMethod(name, index + 1)
      });
      return;
    }

    const constArrow = line.match(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*(async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/);
    if (constArrow) {
      const name = constArrow[1];
      rows.push({
        line: index + 1,
        kind: constArrow[2] ? 'async const arrow' : 'const arrow',
        name,
        group: groupForMethod(name, index + 1)
      });
    }
  });
  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countLiteral(source, token) {
  return source.split(token).length - 1;
}

function countRegex(source, regex) {
  return (source.match(regex) || []).length;
}

function sourceLineCount() {
  const source = read(sourcePath);
  return source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('injector method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/injector\.js/);
  assert.match(text, /line count: 3593/);
  assert.equal(sourceLineCount(), 3593);
  assert.match(text, /named method\/helper\/callback declarations in scope: 108/);
  assert.match(text, /function declarations in scope: 69/);
  assert.match(text, /plain function declarations: 66/);
  assert.match(text, /async function declarations: 3/);
  assert.match(text, /const helper\/callback declarations: 39/);
  assert.match(text, /const arrow helper\/callback declarations: 31/);
  assert.match(text, /async const arrow helper\/callback declarations: 1/);
  assert.match(text, /const IIFE result declarations: 7/);
  assert.match(text, /arrow callback sites in scope: 100/);
  assert.match(text, /semantic method groups: 12/);
  assert.match(text, /browser\/global export: none/);
  assert.match(text, /CommonJS export: none/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not\s+completion proof for injector message authority/);
});

test('injector method register accounts for every current declaration row', () => {
  const rows = methodRows();

  assert.equal(rows.length, 108);
  assert.deepEqual(countBy(rows, 'kind'), {
    'async const arrow': 1,
    'async function': 3,
    'const IIFE result': 7,
    'const arrow': 31,
    function: 66
  });
  assert.deepEqual(countBy(rows, 'group'), {
    injectorBridgeLifecycleAndLogging: 4,
    injectorChannelSnapshotIdentitySearch: 20,
    injectorCollaboratorDataExtraction: 14,
    injectorCollaboratorIdentitySanitization: 12,
    injectorCollaboratorMatcherAndCache: 6,
    injectorCollaboratorSnapshotDomSearch: 6,
    injectorSeedHookAndQueueLifecycle: 10,
    injectorSubscriptionContextAndPrimitiveHelpers: 10,
    injectorSubscriptionEntryNormalizationAndSummary: 8,
    injectorSubscriptionExpansionAndWait: 5,
    injectorSubscriptionSeedCollection: 9,
    injectorSubscriptionYoutubeiFetchAndQueue: 4
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('injector method register preserves every source row', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing injector method row ${row.kind}:${row.name}:${row.line}`
    );
  }
});

test('injector register pins page message fetch selector and lifecycle counts', () => {
  const text = doc();
  const source = read(sourcePath);

  assert.equal(countRegex(source, /=>/g), 100);
  assert.equal(countRegex(source, /^\s*function\s+[A-Za-z_$][\w$]*\s*\(/gm), 66);
  assert.equal(countRegex(source, /^\s*async\s+function\s+[A-Za-z_$][\w$]*\s*\(/gm), 3);
  assert.equal(countRegex(source, /^\s*const\s+[A-Za-z_$][\w$]*\s*=\s*\(\(\)\s*=>/gm), 7);
  assert.equal(countLiteral(source, 'document'), 15);
  assert.equal(countLiteral(source, 'window'), 123);
  assert.equal(countLiteral(source, 'location'), 10);
  assert.equal(countLiteral(source, 'document.querySelector('), 1);
  assert.equal(countLiteral(source, 'document.querySelectorAll('), 3);
  assert.equal(countLiteral(source, 'querySelector(') - countLiteral(source, 'document.querySelector('), 1);
  assert.equal(countLiteral(source, 'querySelectorAll?.('), 2);
  assert.equal(countLiteral(source, 'closest('), 1);
  assert.equal(countLiteral(source, 'matches('), 0);
  assert.equal(countLiteral(source, 'document.addEventListener'), 0);
  assert.equal(countLiteral(source, 'window.addEventListener'), 2);
  assert.equal(countLiteral(source, 'removeEventListener'), 0);
  assert.equal(countLiteral(source, 'MutationObserver'), 0);
  assert.equal(countLiteral(source, 'observe('), 0);
  assert.equal(countLiteral(source, 'disconnect('), 0);
  assert.equal(countLiteral(source, 'setTimeout'), 5);
  assert.equal(countLiteral(source, 'clearTimeout'), 2);
  assert.equal(countLiteral(source, 'setInterval'), 1);
  assert.equal(countLiteral(source, 'clearInterval'), 2);
  assert.equal(countLiteral(source, 'requestAnimationFrame'), 0);
  assert.equal(countLiteral(source, 'cancelAnimationFrame'), 0);
  assert.equal(countLiteral(source, 'fetch('), 1);
  assert.equal(countLiteral(source, 'AbortController'), 2);
  assert.equal(countLiteral(source, 'postMessage'), 10);
  assert.equal(countLiteral(source, "}, '*')"), 10);
  assert.equal(countLiteral(source, 'dispatchEvent'), 2);
  assert.equal(countLiteral(source, '.click('), 1);
  assert.equal(countLiteral(source, 'scrollTo'), 3);
  assert.equal(countLiteral(source, 'Object.defineProperty'), 2);
  assert.equal(countLiteral(source, 'Object.getOwnPropertyDescriptor'), 1);
  assert.equal(countLiteral(source, 'JSON.parse'), 4);
  assert.equal(countLiteral(source, 'JSON.stringify'), 2);
  assert.equal(countLiteral(source, 'new Map'), 7);
  assert.equal(countLiteral(source, 'new Set'), 19);
  assert.equal(countLiteral(source, 'WeakSet'), 7);
  assert.equal(countLiteral(source, 'window.filterTube'), 58);
  assert.equal(countLiteral(source, 'FilterTubeEngine'), 15);
  assert.equal(countLiteral(source, 'currentSettings'), 10);
  assert.equal(countLiteral(source, 'initialDataQueue'), 9);
  assert.equal(countLiteral(source, 'collaboratorCache'), 6);
  assert.equal(countLiteral(source, 'window.ytInitialData'), 10);
  assert.equal(countLiteral(source, 'ytInitialPlayerResponse'), 4);
  assert.equal(countLiteral(source, 'recentYtSearchResponses'), 6);
  assert.equal(countLiteral(source, 'recentYtBrowseResponses'), 4);

  for (const token of [
    'document literal occurrences: 15',
    'window literal occurrences: 123',
    'location literal occurrences: 10',
    'document.querySelector calls: 1',
    'document.querySelectorAll calls: 3',
    'element querySelector calls: 1',
    'querySelectorAll?. calls: 2',
    'closest calls: 1',
    'matches calls: 0',
    'document.addEventListener calls: 0',
    'window.addEventListener calls: 2',
    'removeEventListener calls: 0',
    'MutationObserver references: 0',
    'observe calls: 0',
    'disconnect calls: 0',
    'setTimeout calls: 5',
    'clearTimeout calls: 2',
    'setInterval calls: 1',
    'clearInterval calls: 2',
    'requestAnimationFrame calls: 0',
    'cancelAnimationFrame calls: 0',
    'fetch calls: 1',
    'AbortController references: 2',
    'postMessage calls: 10',
    'wildcard postMessage target calls: 10',
    'dispatchEvent calls: 2',
    'click calls: 1',
    'scrollTo calls: 3',
    'Object.defineProperty calls: 2',
    'Object.getOwnPropertyDescriptor calls: 1',
    'JSON.parse calls: 4',
    'JSON.stringify calls: 2',
    'new Map calls: 7',
    'new Set calls: 19',
    'WeakSet references: 7',
    'window.filterTube references: 58',
    'FilterTubeEngine references: 15',
    'currentSettings references: 10',
    'initialDataQueue references: 9',
    'collaboratorCache references: 6',
    'window.ytInitialData references: 10',
    'ytInitialPlayerResponse references: 4',
    'recentYtSearchResponses references: 6',
    'recentYtBrowseResponses references: 4',
    "source === 'content_bridge' checks: 3",
    "source === 'injector' checks: 2",
    'credentialed YouTubei fetch policy occurrences: 1',
    'YouTubei browse endpoint literal occurrences: 2'
  ]) {
    assert.ok(text.includes(token), `missing injector count token ${token}`);
  }
});

test('injector source still proves current message fetch hook and lookup boundaries', () => {
  const text = doc();
  const source = read(sourcePath);

  for (const token of [
    'installSubscriptionsImportBridge();',
    'if (window.filterTubeInjectorHasRun) {',
    "window.addEventListener('message', handleSubscriptionsImportBridgeMessage);",
    "window.addEventListener('message', (event) => {",
    "type !== 'FilterTube_RequestSubscriptionImport' || source !== 'content_bridge'",
    'fetchSubscribedChannelsFromYoutubei(requestId, payload || {})',
    "type: 'FilterTube_SubscriptionsImportResponse'",
    "type: 'FilterTube_SubscriptionsImportProgress'",
    "/youtubei/v1/browse?prettyPrint=false",
    "credentials: 'include'",
    "window.dispatchEvent(new Event('scroll'))",
    'button.click();',
    'currentSettings = { ...currentSettings, ...payload };',
    'settingsReceived = true;',
    'updateSeedSettings();',
    'processInitialDataQueue();',
    "type === 'FilterTube_CacheCollaboratorInfo' && source === 'filter_logic'",
    "type === 'FilterTube_RequestCollaboratorInfo' && source === 'content_bridge'",
    "type === 'FilterTube_RequestChannelInfo' && source === 'content_bridge'",
    'searchYtInitialDataForCollaborators(videoId, matcher)',
    'searchYtInitialDataForVideoChannel(videoId',
    "document.querySelectorAll('ytd-channel-renderer, ytm-channel-list-item-renderer')",
    'document.querySelector(selector)',
    "Object.defineProperty(window, 'ytInitialData'",
    'window.filterTube.processFetchResponse = function (url, data)',
    'window.filterTube.processXhrResponse = function (url, data)',
    'const engineCheckInterval = setInterval',
    'clearInterval(engineCheckInterval)',
    'window.ftInitialized = true;',
    "type: 'FilterTube_InjectorToBridge_Ready'",
    '}, 5000);'
  ]) {
    assert.ok(source.includes(token), `missing current source token ${token}`);
  }

  for (const token of [
    'boot order: `installSubscriptionsImportBridge();` runs before the duplicate-run idempotency guard',
    'subscription import request authority: request type `FilterTube_RequestSubscriptionImport` is accepted',
    'settings receiver: `FilterTube_SettingsToInjector` merges caller payload',
    'filter logic bridge: `connectToSeedGlobal()` writes `window.filterTube.processFetchResponse`',
    "backup global hook: `setupAdditionalHooks()` uses `Object.defineProperty(window, 'ytInitialData'",
    'engine lifecycle: a 100ms `setInterval` polls `window.FilterTubeEngine?.processData`',
    'collaborator lookup path: `FilterTube_RequestCollaboratorInfo` is accepted',
    'channel lookup path: `FilterTube_RequestChannelInfo` is accepted',
    'teardown path: no `removeEventListener` exists'
  ]) {
    assert.ok(text.includes(token), `missing current behavior boundary token ${token}`);
  }

  assert.doesNotMatch(source, /removeEventListener/);
  assert.doesNotMatch(source, /MutationObserver/);
  assert.doesNotMatch(source, /module\.exports/);
});

test('injector register preserves future proof fields', () => {
  const text = doc();

  for (const token of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'callerSurface',
    'messageType',
    'sourceLabel',
    'capability',
    'requestId',
    'actionToken',
    'settingsRevision',
    'routeSurface',
    'settingsMode',
    'listMode',
    'profileTarget',
    'compiledActiveState',
    'subscriptionImportReason',
    'youtubeiEndpoint',
    'fetchCredentialsPolicy',
    'maxChannels',
    'timeoutBudgetMs',
    'abortBudget',
    'pageExpansionBudget',
    'seedSnapshotSource',
    'continuationTokenSource',
    'collaboratorMatcher',
    'identityConfidence',
    'cacheEffect',
    'DOMHydrationSelector',
    'snapshotRootProvenance',
    'pageGlobalWrite',
    'hookOwner',
    'timerOwner',
    'intervalOwner',
    'teardownPolicy',
    'noRuleBudget',
    'negativeFixture',
    'positiveFixture',
    'sourceFamilyProvenance'
  ]) {
    assert.ok(text.includes(token), `missing future proof field ${token}`);
  }
});

test('runtime source lacks injector method authority symbols', () => {
  const runtime = productRuntimeSource();

  for (const missingAuthority of [
    'injectorMethodAuthority',
    'injectorBridgeMessageTrustContract',
    'injectorSettingsRevisionContract',
    'injectorSubscriptionImportActionToken',
    'injectorSubscriptionImportWorkBudget',
    'injectorYoutubeiFetchPolicy',
    'injectorSnapshotSearchProvenance',
    'injectorCollaboratorIdentityConfidenceReport',
    'injectorChannelLookupAuthority',
    'injectorSeedHookLifecycleContract',
    'injectorPageGlobalPatchReport',
    'injectorFixtureProvenance'
  ]) {
    assert.doesNotMatch(runtime, new RegExp(missingAuthority));
  }
});
