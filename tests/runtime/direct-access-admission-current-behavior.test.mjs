import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing ${endNeedle}`);
  return source.slice(start, end);
}

function loadAdmissionDecision() {
  const source = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    source,
    'function getCurrentWatchAdmissionDecision(settings, context = {}) {',
    'function formatCurrentWatchAdmissionMessage(decision, ownerMeta = {}) {'
  );
  const context = {
    getCompiledKeywordRegexes(list) {
      return list.map(entry => new RegExp(typeof entry === 'string' ? entry : entry.pattern, 'i'));
    },
    keywordDateFilterAllows() {
      return true;
    },
    matchesKeyword(regex, value) {
      regex.lastIndex = 0;
      return regex.test(String(value || ''));
    },
    getCompiledChannelFilterIndex(_settings, list) {
      return { list };
    },
    channelMetaMatchesIndex(meta, index) {
      return index.list.some(entry => {
        const id = typeof entry === 'string' ? entry : entry.id;
        const name = typeof entry === 'object' ? entry.name : '';
        return Boolean((id && id === meta.id) || (name && name === meta.name));
      });
    }
  };
  vm.createContext(context);
  vm.runInContext(`${block}\nthis.decide = getCurrentWatchAdmissionDecision;`, context);
  return context.decide;
}

function loadContentFilterDecision() {
  const source = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    source,
    'function getCurrentWatchContentFilterDecision(settings, metadata = {}) {',
    'function getCurrentWatchDescriptionText() {'
  );
  const context = {
    getActiveCategoryPolicy(settings) {
      return settings.categoryFilters?.enabled ? settings.categoryFilters : null;
    },
    getCategoryPolicyDecision(settings, category) {
      if (!category) return 'unknown';
      return settings.categoryFilters.selected.includes(category) ? 'blocked' : 'allowed';
    },
    getActiveLanguagePolicy(settings) {
      return settings.languageFilters?.enabled ? settings.languageFilters : null;
    },
    getLanguagePolicyDecision(settings, languageCode) {
      if (!languageCode) return 'unknown';
      return settings.languageFilters.selected.includes(languageCode) ? 'blocked' : 'allowed';
    }
  };
  vm.createContext(context);
  vm.runInContext(`${block}\nthis.decideContent = getCurrentWatchContentFilterDecision;`, context);
  return context.decideContent;
}

test('Watch admission exposes the exact winning rule family without changing precedence', () => {
  const decide = loadAdmissionDecision();
  const ownerMeta = { id: 'UCED', name: 'Ed Sheeran' };
  const baseContext = {
    videoId: 'JGwWNGJdvx8',
    ownerMeta,
    searchText: 'Ed Sheeran Shape of You official song',
    textFields: [
      { label: 'title', text: 'Ed Sheeran Shape of You' },
      { label: 'YouTube metadata keywords', text: 'official song' }
    ]
  };

  assert.equal(decide({ blockedVideoIds: ['JGwWNGJdvx8'] }, baseContext).kind, 'video');
  assert.equal(decide({ filterChannels: [{ id: 'UCED' }] }, baseContext).kind, 'channel');
  assert.deepEqual(
    { ...decide({ filterKeywords: ['official'] }, baseContext) },
    { blocked: true, kind: 'keyword', pattern: 'official', source: 'YouTube metadata keywords' }
  );
  assert.equal(decide({ listMode: 'whitelist', whitelistChannels: [{ id: 'UCOTHER' }] }, baseContext).kind, 'allow-only');
  assert.equal(decide({
    filterChannels: [{ id: 'UCED' }],
    whitelistChannels: [{ id: 'UCED' }]
  }, baseContext).blocked, false, 'equal-specificity allow rules still win');
});

test('current-player overlays identify every video-admission rule family', () => {
  const source = read('js/content/dom_fallback.js');
  const formatter = sliceBetween(
    source,
    'function formatCurrentWatchAdmissionMessage(decision, ownerMeta = {}) {',
    'function enforceCurrentChannelPageDirectAccess(settings) {'
  );
  const categoryAdmission = sliceBetween(
    source,
    'function enforceCurrentWatchCategoryPolicy(settings) {',
    'function getWatchRailCategoryStateTargets(card) {'
  );
  const watchAdmission = sliceBetween(
    source,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'const FILTERTUBE_CATEGORY_PENDING_TTL_MS'
  );

  assert.match(formatter, /Blocked video\\nVideo ID:/);
  assert.match(formatter, /Blocked channel/);
  assert.match(formatter, /Blocked keyword\\nMatched:/);
  assert.match(formatter, /Not in Allow only selected/);
  assert.match(formatter, /Blocked by Duration Filter/);
  assert.match(formatter, /Blocked by Upload Date Filter/);
  assert.match(formatter, /Blocked by Uppercase Title Filter/);
  assert.doesNotMatch(watchAdmission, /`Blocked by FilterTube/);
  assert.match(watchAdmission, /shouldHideContent\(currentVideoSearchText, ownerName, settings/);
  assert.match(watchAdmission, /admissionDecision = \{ blocked: true, kind: 'rule' \}/);
  assert.match(categoryAdmission, /Blocked by Language Filter\\nLanguage:/);
  assert.match(categoryAdmission, /Blocked by Category Filter\\nCategory:/);
});

test('direct admission checks URL video IDs before owner identity is required', () => {
  const source = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    source,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'const FILTERTUBE_CATEGORY_PENDING_TTL_MS'
  );

  assert.match(block, /const explicitlyBlocked = Array\.isArray\(settings\?\.blockedVideoIds\)/);
  assert.match(block, /const explicitlyAllowed = Array\.isArray\(settings\?\.allowedVideoIds\)/);
  assert.ok(block.indexOf('if (explicitlyBlocked)') < block.indexOf('if (!ownerMeta || !ownerMeta.videoId)'));
  assert.match(block, /pauseCurrentWatchForDirectAccess\(ownerMeta\.videoId, 'blocked'\)/);
  assert.match(block, /setDirectAccessOverlay\(/);
});

test('global Disabled releases direct-access state before any route enforcement', () => {
  const source = read('js/content/dom_fallback.js');
  const channelAdmission = sliceBetween(
    source,
    'function enforceCurrentChannelPageDirectAccess(settings) {',
    'function enforceCurrentWatchOwnerBlock(settings) {'
  );
  const watchAdmission = sliceBetween(
    source,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'const FILTERTUBE_CATEGORY_PENDING_TTL_MS'
  );
  const applyBody = source.slice(source.indexOf('async function applyDOMFallback(settings, options = {}) {'));

  assert.match(channelAdmission, /if \(!isFilterTubeFilteringEnabled\(settings\)\) \{\s*releaseDisabledDirectAccessState\(\);\s*return false;/);
  assert.match(watchAdmission, /if \(!isFilterTubeFilteringEnabled\(settings\)\) \{\s*releaseDisabledDirectAccessState\(\);\s*return;/);
  assert.ok(
    applyBody.indexOf('if (!isFilterTubeFilteringEnabled(effectiveSettings))') <
      applyBody.indexOf('enforceCurrentChannelPageDirectAccess(effectiveSettings)'),
    'the global enabled boundary must run before direct-access side effects'
  );
  assert.match(source, /function releaseDisabledDirectAccessState\(\) \{[\s\S]*releaseDirectAccessGuard\(videoId, true\);/);
  assert.match(source, /releaseDisabledDirectAccessState\(\)[\s\S]*clearCurrentShortAdmissionOverlay\(\);/);
  assert.match(source, /removeAttribute\?\.\('data-filtertube-direct-channel-redirect'\)/);
  assert.match(source, /querySelectorAll\('\[data-filtertube-current-watch-blocked="true"\]'\)/);
});

test('unresolved direct playback is held, delays neutral UI, and requests every active metadata family', () => {
  const dom = read('js/content/dom_fallback.js');
  const bridge = read('js/content_bridge.js');

  assert.match(dom, /FILTERTUBE_DIRECT_ACCESS_PENDING_TTL_MS = 6000/);
  assert.match(dom, /FILTERTUBE_DIRECT_ACCESS_OVERLAY_DELAY_MS = 180/);
  assert.match(dom, /needIdentity: requirements\.needsIdentity/);
  assert.match(dom, /needText: requirements\.needsText/);
  assert.match(dom, /needDuration: requirements\.needsDuration/);
  assert.match(dom, /needDates: requirements\.needsKeywordDates/);
  assert.match(dom, /needDates: requirements\.needsUploadDate/);
  assert.match(dom, /needCategory: requirements\.needsCategory/);
  assert.match(dom, /needLanguage: requirements\.needsLanguage/);
  assert.match(dom, /document\.addEventListener\('play',[\s\S]*media\.pause\?\.\(\)/);
  assert.match(bridge, /needIdentity: Boolean\(left\.needIdentity \|\| right\.needIdentity\)/);
  assert.match(bridge, /needText: Boolean\(left\.needText \|\| right\.needText\)/);
  assert.match(bridge, /WATCH_META_FETCH_MAX_PER_WINDOW = 24/);
});

test('direct Watch content admission applies duration, date, uppercase, category, and language rules', () => {
  const decide = loadContentFilterDecision();
  assert.equal(decide({ contentFilters: { duration: { enabled: true, condition: 'longer', minMinutes: 3 } } }, { lengthSeconds: 240 }).kind, 'duration');
  assert.equal(decide({ contentFilters: { duration: { enabled: true, condition: 'longer', minMinutes: 5 } } }, { lengthSeconds: 240 }).blocked, false);
  assert.equal(decide({ contentFilters: { uploadDate: { enabled: true, condition: 'newer', fromDate: '2026-01-01' } } }, { publishDate: '2025-01-01' }).kind, 'upload-date');
  assert.equal(decide({ contentFilters: { uppercase: { enabled: true, mode: 'all_caps' } } }, { textVerified: true, title: 'THIS IS A VIDEO' }).kind, 'uppercase');
  assert.equal(decide({ categoryFilters: { enabled: true, selected: ['Music'] } }, { category: 'Music' }).kind, 'category');
  assert.equal(decide({ languageFilters: { enabled: true, selected: ['es'] } }, { languageCode: 'es' }).kind, 'language');
  assert.equal(decide({ contentFilters: { duration: { enabled: true } } }, {}).pending, true);
});

test('a verified allow rule keeps its existing precedence over general content filters', () => {
  const source = read('js/content/dom_fallback.js');
  const admission = sliceBetween(
    source,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'const FILTERTUBE_CATEGORY_PENDING_TTL_MS'
  );
  assert.ok(
    admission.indexOf("admissionDecision.kind === 'allowed-rule'") <
      admission.indexOf('getCurrentWatchContentFilterDecision(settings, cachedVideoMeta || {})'),
    'specific allow decisions must remain the fast-path exception before general content filters'
  );
});

test('direct admission uses only route-bound Player metadata for current Watch identity and text', () => {
  const dom = read('js/content/dom_fallback.js');
  const bridge = read('js/content_bridge.js');
  const injector = read('js/injector.js');
  const admission = sliceBetween(
    dom,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'const FILTERTUBE_CATEGORY_PENDING_TTL_MS'
  );
  const playerFetch = sliceBetween(
    injector,
    'async function fetchVideoMetaFromYoutubeiPlayer(videoId, needs = {}) {',
    'function isYoutubeChannelsFeedPath()'
  );

  assert.match(dom, /function getCurrentWatchExactOwnerMeta\(settings\)/);
  assert.match(dom, /exactMeta\.identityVerified !== true/);
  assert.match(admission, /const exactOwnerMeta = getCurrentWatchExactOwnerMeta\(settings\)/);
  assert.match(admission, /cachedVideoMeta\?\.textVerified === true/);
  assert.doesNotMatch(admission, /getCurrentWatchDescriptionText\(\)/);
  assert.doesNotMatch(admission, /document\.querySelector\('ytm-watch h1/);
  assert.match(bridge, /const hasIdentity = existing\?\.identityVerified === true/);
  assert.match(bridge, /const hasText = existing\?\.textVerified === true/);
  assert.match(injector, /function extractVideoMetaFromPlayerResponse\(candidate, expectedVideoId\)/);
  assert.match(injector, /responseVideoId !== expectedVideoId/);
  assert.match(injector, /identityVerified: true/);
  assert.match(injector, /textVerified: true/);
  assert.match(injector, /window\.filterTube\?\.rawYtInitialPlayerResponse/);
  assert.match(injector, /window\.ytInitialPlayerResponse/);
  assert.match(injector, /function loadedVideoMetaSatisfies\(metadata, needs = \{\}\)/);
  assert.match(injector, /!needs\.needCategory \|\| Boolean\(metadata\.category\)/);
  assert.ok(playerFetch.indexOf('getLoadedVideoMeta(videoId, needs)') < playerFetch.indexOf('fetch(endpointUrl'));
  assert.match(playerFetch, /source: 'loaded_player_response'/);
});

test('blocked-A to allowed-B Watch or Shorts SPA navigation never reuses A identity or visible DOM text', () => {
  const source = read('js/content/dom_fallback.js');
  const exactOwnerBlock = sliceBetween(
    source,
    'function getCurrentWatchExactOwnerMeta(settings) {',
    'function getCurrentShortPlayerHost() {'
  );
  let routeVideoId = 'BBBBBBBBBBB';
  const context = {
    getCurrentWatchVideoId() {
      return routeVideoId;
    },
    normalizeHandleForComparison(value) {
      return String(value || '').toLowerCase();
    }
  };
  vm.createContext(context);
  vm.runInContext(`${exactOwnerBlock}\nthis.getExactOwner = getCurrentWatchExactOwnerMeta;`, context);

  const staleOnly = context.getExactOwner({
    videoChannelMap: { BBBBBBBBBBB: 'UCAAAAAAAAAAAAAAAAAAAAAA' },
    videoMetaMap: {
      AAAAAAAAAAA: {
        identityVerified: true,
        channelId: 'UCAAAAAAAAAAAAAAAAAAAAAA',
        channelName: 'Blocked A'
      }
    }
  });
  assert.equal(staleOnly, null, 'a stored map and previous-route metadata cannot authorize B identity');

  const exactB = context.getExactOwner({
    videoChannelMap: { BBBBBBBBBBB: 'UCAAAAAAAAAAAAAAAAAAAAAA' },
    videoMetaMap: {
      BBBBBBBBBBB: {
        identityVerified: true,
        channelId: 'UCBBBBBBBBBBBBBBBBBBBBBB',
        channelName: 'Allowed B',
        channelHandle: '@AllowedB'
      }
    }
  });
  assert.equal(exactB.videoId, 'BBBBBBBBBBB');
  assert.equal(exactB.id, 'UCBBBBBBBBBBBBBBBBBBBBBB');
  assert.equal(exactB.name, 'Allowed B');

  routeVideoId = 'CCCCCCCCCCC';
  assert.equal(context.getExactOwner({ videoMetaMap: { BBBBBBBBBBB: exactB } }), null,
    'a Shorts route change cannot inherit the preceding Watch identity');
});

test('a persistent video-channel mapping alone cannot satisfy exact current-route identity', () => {
  const bridge = read('js/content_bridge.js');
  const needsBlock = sliceBetween(
    bridge,
    'function areWatchMetaFetchNeedsSatisfied(videoId, needs) {',
    'function isVideoNearCategoryViewport(videoId) {'
  );
  const context = {
    currentSettings: {
      videoChannelMap: { BBBBBBBBBBB: 'UCAAAAAAAAAAAAAAAAAAAAAA' },
      videoMetaMap: {}
    }
  };
  vm.createContext(context);
  vm.runInContext(`${needsBlock}\nthis.needsSatisfied = areWatchMetaFetchNeedsSatisfied;`, context);

  assert.equal(context.needsSatisfied('BBBBBBBBBBB', { needIdentity: true }), false);
  context.currentSettings.videoMetaMap.BBBBBBBBBBB = {
    identityVerified: true,
    channelId: 'UCBBBBBBBBBBBBBBBBBBBBBB'
  };
  assert.equal(context.needsSatisfied('BBBBBBBBBBB', { needIdentity: true }), true);
});

test('exact Player identity repairs a conflicting persisted video channel mapping', () => {
  const bridge = read('js/content_bridge.js');
  const persist = sliceBetween(
    bridge,
    'function persistVideoMetaMapping(entries = []) {',
    'let pendingVideoMetaDomRerunTimer = 0;'
  );
  assert.match(persist, /meta\.identityVerified === true[\s\S]*persistVideoChannelMapping\(videoId, meta\.channelId\)/);
  assert.ok(
    persist.indexOf('persistVideoChannelMapping(videoId, meta.channelId)') <
      persist.indexOf('existing && typeof existing'),
    'mapping repair must run even when exact session metadata was already present'
  );
  assert.match(bridge, /entries: cleaned\.map\(\(\{[\s\S]*identityVerified,[\s\S]*textVerified,[\s\S]*\.\.\.entry/);
});

test('Block selected never converts unresolved Watch metadata into an allowed decision', () => {
  const dom = read('js/content/dom_fallback.js');
  const admission = sliceBetween(
    dom,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'const FILTERTUBE_CATEGORY_PENDING_TTL_MS'
  );
  assert.match(admission, /Required video metadata unavailable\\nPlayback remains blocked/);
  assert.match(admission, /pauseCurrentWatchForDirectAccess\(routeVideoId, 'pending'\)/);
  assert.doesNotMatch(admission, /failOpenVideoId/);
  assert.doesNotMatch(dom, /failOpenVideoId/);
});

test('metadata bridge carries exact needs so text-only admission does not wait for category', () => {
  const bridge = read('js/content_bridge.js');
  const injector = read('js/injector.js');
  assert.match(bridge, /fetchVideoMetaFromWatchUrl\(nextVideoId, needs\)/);
  assert.match(bridge, /requestVideoMetaFromMainWorld\(videoId, needs\)/);
  assert.match(bridge, /payload: \{ requestId, videoId: normalizedVideoId, needs:/);
  assert.match(injector, /fetchVideoMetaFromYoutubeiPlayer\(videoId, payload\?\.needs \|\| \{\}\)/);
});

test('blocked channel pages redirect within YouTube without external-site permissions', () => {
  const source = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    source,
    'function enforceCurrentChannelPageDirectAccess(settings) {',
    'function enforceCurrentWatchOwnerBlock(settings) {'
  );

  assert.match(block, /isCreatorChannelPagePath\(path\)/);
  assert.match(block, /channelMetaMatchesIndex\(pageMeta, index, channelMap\)/);
  assert.match(block, /document\.location\.replace\('\/'\)/);
});

test('YouTube embeds run in matching frames while search-engine pages stay out of scope', () => {
  for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const manifest = JSON.parse(read(file));
    const embedEntries = manifest.content_scripts.filter(entry =>
      entry.matches?.some(pattern => pattern.endsWith('/embed/*'))
    );
    assert.ok(embedEntries.length > 0, `${file} must declare embed-only content scripts`);
    for (const entry of embedEntries) {
      assert.equal(entry.all_frames, true, `${file} content script must cover matching frames`);
      assert.ok(entry.matches.includes('*://*.youtube.com/embed/*'));
      assert.ok(entry.matches.includes('*://*.youtube-nocookie.com/embed/*'));
      assert.ok(!entry.matches.some(pattern => pattern.includes('google.')));
    }
    const topLevelEntries = manifest.content_scripts.filter(entry =>
      entry.matches?.includes('*://*.youtube.com/*')
    );
    assert.ok(topLevelEntries.length > 0, `${file} must retain ordinary YouTube content scripts`);
    for (const entry of topLevelEntries) {
      assert.notEqual(entry.all_frames, true, `${file} broad scripts must remain top-level`);
      assert.ok(entry.exclude_matches?.includes('*://*.youtube.com/embed/*'));
    }
  }

  const dom = read('js/content/dom_fallback.js');
  assert.match(dom, /\/embed\\\/\(\[a-zA-Z0-9_-\]\{11\}\)/);
  assert.match(read('js/content/release_notes_prompt.js'), /window\.top !== window/);
  assert.match(read('js/content/first_run_prompt.js'), /window\.top !== window/);
});

test('blocked playlist playback advances only to a verified allowed queue item and otherwise stays blocked', () => {
  const dom = read('js/content/dom_fallback.js');
  const help = read('html/tab-view.html');
  const spec = read('docs/USER_FEEDBACK_RULES_AND_GUIDANCE_SPEC_2026-08-08.md');
  const admission = sliceBetween(
    dom,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'const FILTERTUBE_CATEGORY_PENDING_TTL_MS'
  );

  assert.match(admission, /findNextAllowedWatchPlaylistLink\(settings, ownerMeta\.videoId\)/);
  assert.match(admission, /targetLink\.click\(\)/);
  assert.doesNotMatch(admission, /nextButton\.click\(\)/);
  assert.doesNotMatch(admission, /toggleVisibility\(shell, true/);
  assert.match(admission, /No verified allowed successor exists/);
  assert.match(help, /automatically moves to the next allowed video/);
  assert.match(help, /does not read or remove ordinary YouTube links on Google Search or other websites/);
  assert.match(spec, /external search-result links remain visible/);
  assert.match(spec, /youtube-nocookie\.com\/embed\//);
});
