import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

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

test('list-mode changes preserve both arrays and only copy blocked rules when explicitly requested', () => {
  const background = read('js/background.js');
  const block = sliceBetween(
    background,
    "} else if (action === 'FilterTube_SetListMode') {",
    "} else if (action === 'addWhitelistChannelPersistent') {"
  );

  assert.match(block, /nextKids\.mode = requestedMode|nextMain\.mode = requestedMode/);
  assert.doesNotMatch(block, /mergeAndClearBlocklistIntoWhitelist/);
  assert.match(block, /const shouldCopyBlocklist = request\?\.copyBlocklist === true/);
  assert.match(block, /requestedMode === 'whitelist' && shouldCopyBlocklist/);
  assert.match(block, /nextMain\.whitelistChannels = mergeUniqueChannels\(priorChannels, blockedChannels, true\)/);
  assert.match(block, /nextKids\.whitelistChannels = mergeUniqueChannels\(priorChannels, nextKids\.blockedChannels, true\)/);
  assert.match(block, /modeBootstrapCopy: true/);
  assert.doesNotMatch(block, /nextMain\.(?:channels|blockedChannels) = \[\]/);
  assert.doesNotMatch(block, /nextKids\.blockedChannels = \[\]/);
});

test('bootstrap copies are visible in storage but do not neutralize Block-selected rules', () => {
  const background = read('js/background.js');
  assert.match(background, /compiledSettings\.listMode === 'whitelist' \|\| entry\?\.modeBootstrapCopy !== true/);
  assert.match(background, /compiledSettings\.listMode === 'whitelist' \|\| channel\?\.modeBootstrapCopy !== true/);

  const stateManager = read('js/state_manager.js');
  const source = read('js/tab-view.js');
  const settingsShared = read('js/settings_shared.js');
  const ioManager = read('js/io_manager.js');
  assert.match(stateManager, /delete entry\.modeBootstrapCopy/);
  assert.match(stateManager, /delete channel\.modeBootstrapCopy/);
  assert.match(source, /delete moved\.modeBootstrapCopy/);
  assert.match(settingsShared, /entry\.modeBootstrapCopy === true \? \{ modeBootstrapCopy: true \}/);
  assert.match(ioManager, /entry\?\.modeBootstrapCopy === true \? \{ modeBootstrapCopy: true \}/);
});

test('full dashboard exposes list views without presenting them as mode switches', () => {
  const source = read('js/tab-view.js');
  const renderer = read('js/render_engine.js');
  const stateManager = read('js/state_manager.js');
  const css = read('css/serene-shell.css');
  assert.match(source, /id="keywordRuleTarget"/);
  assert.match(source, /id="channelRuleTarget"/);
  assert.match(source, /View keyword rules/);
  assert.match(source, /data-rule-target="block">Blocked rules<\/button>/);
  assert.match(source, /data-rule-target="allow">Allowed rules<\/button>/);
  assert.match(source, /Changing this view does not change your Main filtering mode/);
  assert.match(source, /targetList: keywordRuleTarget\?\.value === 'allow' \? 'allow' : 'block'/);
  assert.match(source, /targetList: channelRuleTarget\?\.value === 'allow' \? 'allow' : 'block'/);
  assert.match(source, /StateManager\.moveKeyword/);
  assert.match(source, /StateManager\.moveChannel/);
  assert.match(stateManager, /async function moveKeyword/);
  assert.match(stateManager, /async function moveChannel/);
  assert.match(stateManager, /state\.userKeywords = fromAllow \? target : source/);
  assert.match(stateManager, /state\.userWhitelistKeywords = fromAllow \? source : target/);
  assert.match(stateManager, /state\.channels = fromAllow \? target : source/);
  assert.match(stateManager, /state\.whitelistChannels = fromAllow \? source : target/);
  assert.match(renderer, /ft-rule-entry-badge--\$\{target\}/);
  assert.match(renderer, /Move to \$\{destination\}/);
  assert.match(css, /\.ft-rule-target-tab/);
  assert.match(css, /min-height:\s*44px/);
});

test('Kids has independent blocked and allowed rule-list views and mutations', () => {
  const source = read('js/tab-view.js');
  const renderer = read('js/render_engine.js');
  const stateManager = read('js/state_manager.js');

  assert.match(source, /id="kidsKeywordRuleTarget"/);
  assert.match(source, /id="kidsChannelRuleTarget"/);
  assert.match(source, /data-rule-target-for="kids-keyword"/);
  assert.match(source, /data-rule-target-for="kids-channel"/);
  assert.match(source, /does not change Kids filtering mode or Main rules/);
  assert.match(source, /StateManager\.moveKidsKeyword/);
  assert.match(source, /StateManager\.moveKidsChannel/);
  assert.match(source, /targetList: kidsKeywordRuleTarget\?\.value === 'allow' \? 'allow' : 'block'/);
  assert.match(source, /targetList: kidsChannelRuleTarget\?\.value === 'allow' \? 'allow' : 'block'/);
  assert.match(stateManager, /function getKidsRuleListKey/);
  assert.match(stateManager, /async function moveKidsKeyword/);
  assert.match(stateManager, /async function moveKidsChannel/);
  assert.match(renderer, /allowKidsRuleTarget = false/);
  assert.match(renderer, /effectiveProfile === 'kids' && !allowKidsRuleTarget/);
});

test('popup follows global mode without exposing the advanced list selector', () => {
  const source = read('js/popup.js');
  assert.doesNotMatch(source, /id="keywordRuleTargetPopup"/);
  assert.doesNotMatch(source, /id="channelRuleTargetPopup"/);
  assert.match(source, /StateManager\.getState\(\)\?\.mode === 'whitelist' \? 'allow' : 'block'/);
  assert.match(source, /StateManager\.addKeyword\(word, \{\s*targetList: getPopupRuleTarget\(\)/s);
  assert.match(source, /StateManager\.addChannel\(input, \{\s*targetList: getPopupRuleTarget\(\)/s);
  assert.match(source, /StateManager\.removeKeyword\(entry\.word, \{ targetList \}\)/);
  assert.match(source, /StateManager\.removeChannel\(index, \{ targetList \}\)/);
});

test('global mode pill uses Blocklist and Whitelist labels distinct from rule-list views', () => {
  const popup = read('js/popup.js');
  const source = read('js/tab-view.js');
  const html = read('html/tab-view.html');
  assert.match(popup, /effectiveMode === 'whitelist' \? 'Whitelist' : 'Blocklist'/);
  assert.match(source, /currentMode === 'whitelist' \? 'Whitelist' : 'Blocklist'/);
  assert.match(html, /<strong>Blocked rules<\/strong> or <strong>Allowed rules<\/strong>/);
  assert.match(html, /does not switch <strong>Blocklist<\/strong> \/ <strong>Whitelist<\/strong> mode/);
});

test('popup policy pill and header actions fit the constrained popup width', () => {
  const css = read('css/serene-shell.css');
  assert.match(css, /\.ft-popup-brand\s*\{[^}]*flex:\s*0 1 9\.4rem/s);
  assert.match(css, /body\[data-surface="popup"\] \.header-actions\s*\{[^}]*flex:\s*1 1 auto[^}]*min-width:\s*0/s);
  assert.match(css, /body\[data-surface="popup"\] \.ft-topbar-list-mode \.ft-list-mode-pill\s*\{[^}]*min-width:\s*0[^}]*white-space:\s*nowrap/s);
  assert.match(css, /@media \(max-width: 23\.5rem\)/);
});

test('BlockTube migration recognizes safe, inactive, unsupported, invalid, and unknown outcomes', () => {
  const io = read('js/io_manager.js');
  for (const field of [
    'title', 'channelName', 'channelId', 'videoId', 'comment',
    'vidLength', 'javascript', 'percentWatchedHide'
  ]) {
    assert.match(io, new RegExp(`['"]${field}['"]`));
  }
  for (const field of [
    'trending', 'mixes', 'shorts', 'movies', 'suggestions_only',
    'autoplay', 'enable_javascript', 'block_message', 'block_feedback',
    'disable_db_normalize', 'disable_you_there', 'disable_on_history',
    'vidLength_type', 'percent_watched_hide'
  ]) {
    assert.match(io, new RegExp(`['"]${field}['"]`));
  }
  assert.match(io, /arbitrary_javascript_quarantined_and_never_executed/);
  assert.match(io, /never_imported_as_filtertube_pin/);
  assert.match(io, /migrationReport: parsed\.migrationReport \|\| null/);
  assert.match(read('js/tab-view.js'), /Download Migration Report/);
});

test('BlockTube preview translates safe data and reports unsafe or unsupported data without executing it', () => {
  const window = {};
  vm.runInNewContext(read('js/io_manager.js'), {
    window,
    chrome: { storage: { local: {} } },
    console,
    Date,
    setTimeout,
    clearTimeout,
    TextEncoder,
    crypto: globalThis.crypto
  });

  const preview = window.FilterTubeIO.previewBlockTubeMigration({
    filterData: {
      title: ['poop', '/music/iu'],
      channelId: [`UC${'1'.repeat(22)}`],
      channelName: [],
      videoId: ['abcdefghijk'],
      comment: ['bad comment'],
      vidLength: [60, 600],
      javascript: ['globalThis.__mustNeverRun = true'],
      percentWatchedHide: [50]
    },
    options: {
      vidLength_type: 'block',
      trending: true,
      autoplay: true,
      enable_javascript: true
    },
    uiPass: 'not-a-filtertube-pin',
    uiTheme: 'dark'
  });

  assert.equal(preview.ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(preview.counts)), {
    channels: 1,
    channelIds: 1,
    channelNameRules: 0,
    keywords: 2,
    comments: 1,
    regex: 1,
    videoIds: 1,
    mappedOptions: 1,
    durationFilters: 1
  });
  assert.equal(globalThis.__mustNeverRun, undefined);
  assert.ok(preview.report.inactive.some(row => row.field === 'filterData.javascript'));
  assert.ok(preview.report.inactive.some(row => row.field === 'uiPass'));
  assert.ok(preview.report.unsupported.some(row => row.field === 'options.autoplay'));
});

test('direct Shorts admission reuses the background cached identity resolver', () => {
  const dom = read('js/content/dom_fallback.js');
  assert.match(dom, /shorts.*a-zA-Z0-9_-/s);
  assert.match(dom, /action: 'fetchShortsIdentity'/);
  assert.match(dom, /scheduleCurrentShortIdentityResolution\(settings, routeVideoId\)/);
  assert.match(dom, /pauseCurrentShortPlayer\(\)/);
  assert.match(dom, /filtertube-current-short-admission-overlay/);
  assert.doesNotMatch(
    sliceBetween(dom, 'function scheduleCurrentShortIdentityResolution', 'function getPlaylistRowVideoId'),
    /fetch\s*\(/
  );
});

test('description filtering reuses supplied snippets and player metadata without a description-only request path', () => {
  const logic = read('js/filter_logic.js');
  const dom = read('js/content/dom_fallback.js');
  const bridge = read('js/content_bridge.js');
  const injector = read('js/injector.js');

  assert.match(logic, /gridVideoRenderer:\s*\{[^}]*descriptionSnippet\.simpleText/s);
  assert.match(logic, /videoDetails\?\.shortDescription/);
  assert.match(logic, /cachedVideoMeta\?\.shortDescription/);
  assert.match(dom, /keywordTarget = \[[\s\S]*descriptionText[\s\S]*keywordVideoMeta\?\.shortDescription/);
  assert.match(dom, /currentVideoSearchText = \[[\s\S]*cachedVideoMeta\?\.shortDescription/);
  assert.match(injector, /shortDescription: typeof details\?\.shortDescription/);
  assert.match(bridge, /page session so keyword matching can reuse/);
  assert.doesNotMatch(bridge, /needDescription/);
});
