import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_COMPILED_SETTINGS_FIELD_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md';
const centralLedgerPaths = [
  'docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md'
];

const productFieldFiles = [
  'js/background.js',
  'js/settings_shared.js',
  'js/filter_logic.js',
  'js/seed.js',
  'js/content_bridge.js',
  'js/content/bridge_settings.js'
];

const sourceFingerprints = {
  'js/background.js': [6313, 284710, '46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb'],
  'js/settings_shared.js': [1181, 57535, '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c'],
  'js/filter_logic.js': [3498, 165151, '4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641'],
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/content_bridge.js': [13571, 601694, '1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3'],
  'js/content/bridge_settings.js': [651, 26462, 'c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b']
};

const expectedUniqueRows = [
  'js/seed.js:269:cachedSettingsRead:listMode:2',
  'js/seed.js:411:cachedSettingsRead:enabled:3',
  'js/seed.js:439:cachedSettingsRead:profileType:1',
  'js/seed.js:441:cachedSettingsRead:filterKeywords:1',
  'js/seed.js:442:cachedSettingsRead:filterChannels:1',
  'js/seed.js:443:cachedSettingsRead:hideAllComments:3',
  'js/seed.js:444:cachedSettingsRead:hideAllShorts:1',
  'js/background.js:1894:compiledAssign:filterKeywords:6',
  'js/background.js:1930:compiledAssign:filterKeywordsComments:6',
  'js/background.js:1990:compiledAssign:listMode:1',
  'js/background.js:1991:compiledAssign:profileType:1',
  'js/background.js:2011:compiledAssign:whitelistKeywords:1',
  'js/background.js:2212:compiledAssign:whitelistChannels:1',
  'js/background.js:2330:compiledAssign:filterChannels:1',
  'js/background.js:2411:compiledAssign:channelMap:1',
  'js/background.js:2424:compiledAssign:videoChannelMap:1',
  'js/background.js:2427:compiledAssign:videoMetaMap:1',
  'js/background.js:2477:compiledAssign:enabled:1',
  'js/background.js:2478:compiledAssign:hideAllComments:1',
  'js/background.js:2479:compiledAssign:filterComments:1',
  'js/background.js:2480:compiledAssign:useExactWordMatching:1',
  'js/background.js:2481:compiledAssign:hideAllShorts:1',
  'js/background.js:2482:compiledAssign:hideHomeFeed:1',
  'js/background.js:2483:compiledAssign:hideSponsoredCards:1',
  'js/background.js:2484:compiledAssign:hideWatchPlaylistPanel:1',
  'js/background.js:2485:compiledAssign:hidePlaylistCards:1',
  'js/background.js:2486:compiledAssign:hideMembersOnly:1',
  'js/background.js:2487:compiledAssign:hideMixPlaylists:1',
  'js/background.js:2488:compiledAssign:hideVideoSidebar:1',
  'js/background.js:2489:compiledAssign:hideRecommended:1',
  'js/background.js:2490:compiledAssign:hideLiveChat:1',
  'js/background.js:2491:compiledAssign:hideVideoInfo:1',
  'js/background.js:2492:compiledAssign:hideVideoButtonsBar:1',
  'js/background.js:2493:compiledAssign:hideAskButton:1',
  'js/background.js:2494:compiledAssign:hideVideoChannelRow:1',
  'js/background.js:2495:compiledAssign:hideVideoDescription:1',
  'js/background.js:2496:compiledAssign:hideMerchTicketsOffers:1',
  'js/background.js:2497:compiledAssign:hideEndscreenVideowall:1',
  'js/background.js:2498:compiledAssign:hideEndscreenCards:1',
  'js/background.js:2499:compiledAssign:disableAutoplay:1',
  'js/background.js:2500:compiledAssign:disableAnnotations:1',
  'js/background.js:2501:compiledAssign:hideTopHeader:1',
  'js/background.js:2502:compiledAssign:hideNotificationBell:1',
  'js/background.js:2503:compiledAssign:hideExploreTrending:1',
  'js/background.js:2504:compiledAssign:hideMoreFromYouTube:1',
  'js/background.js:2505:compiledAssign:hideSubscriptions:1',
  'js/background.js:2506:compiledAssign:showQuickBlockButton:1',
  'js/background.js:2507:compiledAssign:showBlockMenuItem:1',
  'js/background.js:2508:compiledAssign:hideSearchShelves:1',
  'js/background.js:2527:compiledAssign:contentFilters:1',
  'js/background.js:2549:compiledAssign:categoryFilters:1',
  'js/content_bridge.js:254:currentSettingsRead:channelMap:8',
  'js/content_bridge.js:283:currentSettingsRead:videoChannelMap:24',
  'js/content_bridge.js:416:currentSettingsRead:filterChannels:5',
  'js/content_bridge.js:1218:currentSettingsRead:listMode:7',
  'js/content_bridge.js:1654:currentSettingsRead:videoMetaMap:11',
  'js/content_bridge.js:10678:currentSettingsRead:showBlockMenuItem:1',
  'js/filter_logic.js:968:processedAssign:contentFilters:1',
  'js/filter_logic.js:986:processedAssign:categoryFilters:1',
  'js/filter_logic.js:998:processedAssign:filterKeywords:1',
  'js/filter_logic.js:1012:processedAssign:whitelistKeywords:1',
  'js/filter_logic.js:1027:processedAssign:filterChannels:1',
  'js/filter_logic.js:1043:processedAssign:whitelistChannels:1',
  'js/filter_logic.js:1056:processedAssign:videoMetaMap:1',
  'js/background.js:788:settingsRead:autoBackupEnabled:1',
  'js/background.js:811:settingsRead:ftProfilesV4:1',
  'js/background.js:814:settingsRead:autoBackupFormat:2',
  'js/background.js:839:settingsRead:autoBackupMode:2',
  'js/background.js:1080:settingsRead:filterComments:1',
  'js/background.js:1080:settingsRead:hideComments:1',
  'js/content_bridge.js:1015:settingsRead:enabled:2',
  'js/content_bridge.js:1016:settingsRead:listMode:2',
  'js/content_bridge.js:1017:settingsRead:filterChannels:2',
  'js/content_bridge.js:1026:settingsRead:contentFilters:4',
  'js/content_bridge.js:1037:settingsRead:categoryFilters:2',
  'js/content_bridge.js:1046:settingsRead:filterKeywords:1',
  'js/content_bridge.js:1048:settingsRead:filterKeywordsComments:1',
  'js/content_bridge.js:1049:settingsRead:hideAllComments:1',
  'js/content_bridge.js:1050:settingsRead:hideAllShorts:1',
  'js/content_bridge.js:8327:settingsRead:videoChannelMap:2',
  'js/content/bridge_settings.js:295:settingsRead:profileType:4',
  'js/content/bridge_settings.js:329:settingsRead:listMode:1',
  'js/content/bridge_settings.js:332:settingsRead:whitelistChannels:2',
  'js/content/bridge_settings.js:333:settingsRead:whitelistKeywords:2',
  'js/filter_logic.js:848:settingsRead:channelMap:10',
  'js/filter_logic.js:849:settingsRead:filterChannels:10',
  'js/filter_logic.js:850:settingsRead:whitelistChannels:8',
  'js/filter_logic.js:964:settingsRead:contentFilters:5',
  'js/filter_logic.js:983:settingsRead:categoryFilters:5',
  'js/filter_logic.js:997:settingsRead:filterKeywords:6',
  'js/filter_logic.js:1011:settingsRead:whitelistKeywords:5',
  'js/filter_logic.js:1056:settingsRead:videoMetaMap:17',
  'js/filter_logic.js:1376:settingsRead:videoChannelMap:7',
  'js/filter_logic.js:1572:settingsRead:listMode:2',
  'js/filter_logic.js:1913:settingsRead:hideAllShorts:1',
  'js/filter_logic.js:2078:settingsRead:hideAllComments:1',
  'js/filter_logic.js:2085:settingsRead:filterKeywordsComments:2',
  'js/filter_logic.js:2862:settingsRead:mode:1',
  'js/filter_logic.js:2863:settingsRead:minWordLength:1',
  'js/filter_logic.js:3449:settingsRead:enabled:2',
  'js/seed.js:204:settingsRead:contentFilters:4',
  'js/seed.js:215:settingsRead:categoryFilters:2',
  'js/seed.js:224:settingsRead:filterKeywords:1',
  'js/seed.js:225:settingsRead:filterChannels:1',
  'js/seed.js:226:settingsRead:filterKeywordsComments:1',
  'js/seed.js:227:settingsRead:hideAllComments:1',
  'js/seed.js:228:settingsRead:hideAllShorts:1',
  'js/seed.js:235:settingsRead:enabled:1',
  'js/seed.js:236:settingsRead:listMode:1',
  'js/settings_shared.js:525:sharedCompiledReturn:enabled:1',
  'js/settings_shared.js:526:sharedCompiledReturn:filterKeywords:1',
  'js/settings_shared.js:527:sharedCompiledReturn:filterKeywordsComments:1',
  'js/settings_shared.js:528:sharedCompiledReturn:filterChannels:1',
  'js/settings_shared.js:529:sharedCompiledReturn:hideAllShorts:1',
  'js/settings_shared.js:530:sharedCompiledReturn:hideAllComments:1',
  'js/settings_shared.js:531:sharedCompiledReturn:filterComments:1',
  'js/settings_shared.js:532:sharedCompiledReturn:hideHomeFeed:1',
  'js/settings_shared.js:533:sharedCompiledReturn:hideSponsoredCards:1',
  'js/settings_shared.js:534:sharedCompiledReturn:hideWatchPlaylistPanel:1',
  'js/settings_shared.js:535:sharedCompiledReturn:hidePlaylistCards:1',
  'js/settings_shared.js:536:sharedCompiledReturn:hideMembersOnly:1',
  'js/settings_shared.js:537:sharedCompiledReturn:hideMixPlaylists:1',
  'js/settings_shared.js:538:sharedCompiledReturn:hideVideoSidebar:1',
  'js/settings_shared.js:539:sharedCompiledReturn:hideRecommended:1',
  'js/settings_shared.js:540:sharedCompiledReturn:hideLiveChat:1',
  'js/settings_shared.js:541:sharedCompiledReturn:hideVideoInfo:1',
  'js/settings_shared.js:542:sharedCompiledReturn:hideVideoButtonsBar:1',
  'js/settings_shared.js:543:sharedCompiledReturn:hideAskButton:1',
  'js/settings_shared.js:544:sharedCompiledReturn:hideVideoChannelRow:1',
  'js/settings_shared.js:545:sharedCompiledReturn:hideVideoDescription:1',
  'js/settings_shared.js:546:sharedCompiledReturn:hideMerchTicketsOffers:1',
  'js/settings_shared.js:547:sharedCompiledReturn:hideEndscreenVideowall:1',
  'js/settings_shared.js:548:sharedCompiledReturn:hideEndscreenCards:1',
  'js/settings_shared.js:549:sharedCompiledReturn:disableAutoplay:1',
  'js/settings_shared.js:550:sharedCompiledReturn:disableAnnotations:1',
  'js/settings_shared.js:551:sharedCompiledReturn:hideTopHeader:1',
  'js/settings_shared.js:552:sharedCompiledReturn:hideNotificationBell:1',
  'js/settings_shared.js:553:sharedCompiledReturn:hideExploreTrending:1',
  'js/settings_shared.js:554:sharedCompiledReturn:hideMoreFromYouTube:1',
  'js/settings_shared.js:555:sharedCompiledReturn:hideSubscriptions:1',
  'js/settings_shared.js:556:sharedCompiledReturn:showQuickBlockButton:1',
  'js/settings_shared.js:557:sharedCompiledReturn:showBlockMenuItem:1',
  'js/settings_shared.js:558:sharedCompiledReturn:hideSearchShelves:1',
  'js/settings_shared.js:559:sharedCompiledReturn:contentFilters:1',
  'js/settings_shared.js:560:sharedCompiledReturn:categoryFilters:1'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function uniqueFieldRows() {
  const patterns = [
    ['compiledAssign', /\bcompiledSettings\.([A-Za-z0-9_]+)\s*=/g],
    ['processedAssign', /\bprocessed\.([A-Za-z0-9_]+)\s*=/g],
    ['settingsRead', /\b(?:this\.)?settings\??\.([A-Za-z0-9_]+)/g],
    ['currentSettingsRead', /\bcurrentSettings\??\.([A-Za-z0-9_]+)/g],
    ['cachedSettingsRead', /\bcachedSettings\??\.([A-Za-z0-9_]+)/g]
  ];
  const rawRows = [];

  for (const file of productFieldFiles) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/**')) return;
      for (const [operation, regex] of patterns) {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(line))) {
          rawRows.push({ file, line: index + 1, operation, field: match[1] });
        }
      }
    });
  }

  const sharedSource = read('js/settings_shared.js');
  const start = sharedSource.indexOf('function buildCompiledSettings({');
  const end = sharedSource.indexOf('function loadSettings()');
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const linesBeforeBuildCompiledSettings = sharedSource.slice(0, start).split(/\r?\n/).length - 1;
  sharedSource.slice(start, end).split(/\r?\n/).forEach((line, index) => {
    const match = /^\s{12}([A-Za-z0-9_]+):/.exec(line);
    if (match) {
      rawRows.push({
        file: 'js/settings_shared.js',
        line: linesBeforeBuildCompiledSettings + index + 1,
        operation: 'sharedCompiledReturn',
        field: match[1]
      });
    }
  });

  const unique = new Map();
  for (const row of rawRows) {
    const key = `${row.file}:${row.operation}:${row.field}`;
    const current = unique.get(key);
    if (current) current.count += 1;
    else unique.set(key, { ...row, count: 1 });
  }

  const uniqueRows = [...unique.values()]
    .sort((a, b) => (
      a.operation.localeCompare(b.operation) ||
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.field.localeCompare(b.field)
    ));

  return { rawRows, uniqueRows };
}

function fieldsByOperation(rows) {
  const result = {};
  for (const row of rows) {
    if (!result[row.operation]) result[row.operation] = new Set();
    result[row.operation].add(row.field);
  }
  return Object.fromEntries(
    Object.entries(result)
      .sort()
      .map(([operation, fields]) => [operation, [...fields].sort()])
  );
}

test('compiled settings field register is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /tracked product files scanned for compiled\/settings fields: 6/);
  assert.match(text, /raw compiled\/settings field rows: 296/);
  assert.match(text, /unique file-field-operation rows: 145/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for settings authority/);
  assert.match(text, /first-class JSON filtering/);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(source), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('compiled settings field register counts and rows remain source-derived', () => {
  const { rawRows, uniqueRows } = uniqueFieldRows();
  const text = doc();

  assert.equal(rawRows.length, 296);
  assert.equal(uniqueRows.length, 145);
  assert.deepEqual(countBy(rawRows, 'operation'), {
    cachedSettingsRead: 12,
    compiledAssign: 54,
    currentSettingsRead: 56,
    processedAssign: 7,
    settingsRead: 131,
    sharedCompiledReturn: 36
  });
  assert.deepEqual(countBy(uniqueRows, 'operation'), {
    cachedSettingsRead: 7,
    compiledAssign: 44,
    currentSettingsRead: 6,
    processedAssign: 7,
    settingsRead: 45,
    sharedCompiledReturn: 36
  });
  assert.deepEqual(countBy(uniqueRows, 'file'), {
    'js/background.js': 50,
    'js/content/bridge_settings.js': 4,
    'js/content_bridge.js': 16,
    'js/filter_logic.js': 23,
    'js/seed.js': 16,
    'js/settings_shared.js': 36
  });

  const actualRows = uniqueRows.map(row => `${row.file}:${row.line}:${row.operation}:${row.field}:${row.count}`);
  assert.deepEqual(actualRows, expectedUniqueRows);
  for (const row of expectedUniqueRows) {
    assert.ok(text.includes(row), `missing compiled settings row ${row}`);
  }
});

test('compiled settings field register records compiler parity and consumer boundaries', () => {
  const { uniqueRows } = uniqueFieldRows();
  const text = doc();
  const fields = fieldsByOperation(uniqueRows);
  const settingsShared = read('js/settings_shared.js');
  const background = read('js/background.js');
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');
  const bridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');

  assert.equal(fields.compiledAssign.length, 44);
  assert.equal(fields.sharedCompiledReturn.length, 36);
  assert.equal(fields.processedAssign.length, 7);
  assert.deepEqual(
    fields.compiledAssign.filter(field => !fields.sharedCompiledReturn.includes(field)),
    [
      'channelMap',
      'listMode',
      'profileType',
      'useExactWordMatching',
      'videoChannelMap',
      'videoMetaMap',
      'whitelistChannels',
      'whitelistKeywords'
    ]
  );
  assert.deepEqual(
    fields.sharedCompiledReturn.filter(field => !fields.compiledAssign.includes(field)),
    []
  );
  assert.deepEqual(fields.processedAssign, [
    'categoryFilters',
    'contentFilters',
    'filterChannels',
    'filterKeywords',
    'videoMetaMap',
    'whitelistChannels',
    'whitelistKeywords'
  ]);

  assert.match(text, /Background-only compiled fields not returned by `buildCompiledSettings/);
  assert.match(text, /channelMap,listMode,profileType,useExactWordMatching,videoChannelMap,videoMetaMap,whitelistChannels,whitelistKeywords/);
  assert.match(text, /Shared-only compiled fields not assigned by the background compiler/);
  assert.match(text, /none/);
  assert.match(text, /background compiler currently assigns 44 unique compiled fields/);
  assert.match(text, /shared UI compiler currently returns 36 unique compiled fields/);
  assert.match(text, /filter_logic\.js` spreads incoming settings before normalizing seven fields/);
  assert.match(text, /seed\.js` uses 7 cached settings fields in current no-work and route gates/);
  assert.match(text, /content_bridge\.js` reads current settings heavily for learned map and list\s+behavior/);
  assert.match(text, /bridge_settings\.js` reads profile, list mode, and whitelist\s+fields/);

  assert.match(text, /Content Filter Enabled Normalization Addendum - 2026-05-27/);
  assert.match(text, /content-filter enabled normalization rows: 7/);
  assert.match(text, /deep content-filter enabled coercion in shared compiler: absent/);
  assert.match(text, /deep content-filter enabled coercion in background compiler: absent/);
  assert.match(text, /deep content-filter enabled coercion in filter_logic processing: absent/);
  assert.match(text, /seed content-filter enabled admission: strict/);
  assert.match(text, /truthy content-filter enabled effect consumer group: present/);
  assert.match(text, /strict content-filter enabled consumer group: present/);
  assert.match(text, /schema authority for content-filter enabled values: NO-GO/);
  assert.match(text, /JSON-first predicate merge approval from this addendum: NO-GO/);
  assert.match(text, /runtime behavior changed by normalization addendum: yes; seed JSON admission ignores malformed truthy enabled values/);
  assert.match(text, /Content Filter Value Normalization Addendum - 2026-05-28/);
  assert.match(text, /content-filter value normalization rows: 7/);
  assert.match(text, /dashboard blank duration clears prior threshold fields: no/);
  assert.match(text, /dashboard blank upload-date clears prior cutoff fields: no/);
  assert.match(text, /StateManager content-filter value cleanup owner: absent/);
  assert.match(text, /compiled content-filter value cleanup owner: absent/);
  assert.match(text, /JSON-first value-normalized content-filter approval: NO-GO/);
  assert.match(text, /runtime behavior changed by value addendum: no/);
  assert.match(text, /Possible stale threshold\/date effects/);

  for (const row of [
    'content_enabled_shared_pass_through',
    'content_enabled_background_pass_through',
    'content_enabled_filter_logic_pass_through',
    'content_enabled_seed_strict_admission',
    'content_enabled_truthy_effect_consumers',
    'content_enabled_strict_consumers',
    'content_enabled_schema_gap'
  ]) {
    assert.ok(text.includes(row), `missing content-filter normalization row ${row}`);
  }

  for (const row of [
    'content_value_main_duration_prior_spread',
    'content_value_main_upload_prior_spread',
    'content_value_kids_duration_prior_spread',
    'content_value_kids_upload_prior_spread',
    'content_value_main_state_merge',
    'content_value_kids_state_merge',
    'content_value_compiler_pass_through'
  ]) {
    assert.ok(text.includes(row), `missing content-filter value row ${row}`);
  }

  const sharedCompiler = sliceBetween(settingsShared, 'function buildCompiledSettings({', 'function loadSettings() {');
  assert.match(sharedCompiler, /const sanitizedContentFilters = safeObject\(contentFilters\);/);
  assert.match(sharedCompiler, /contentFilters: sanitizedContentFilters/);
  assert.doesNotMatch(sharedCompiler, /contentFilters[\s\S]*duration[\s\S]*enabled === true/);

  const backgroundContent = sliceBetween(background, 'const profileContentFilters =', 'const profileCategoryFilters =');
  assert.match(backgroundContent, /compiledSettings\.contentFilters = profileContentFilters \|\| legacyContentFilters \|\| \{/);
  assert.doesNotMatch(backgroundContent, /contentFilters[\s\S]*enabled === true/);

  const filterLogicContent = sliceBetween(filterLogic, 'const contentFilterDefaults = {', 'const incomingCategoryFilters =');
  assert.match(filterLogicContent, /processed\.contentFilters = \{/);
  assert.match(filterLogicContent, /\.\.\.\(incomingContentFilters\.duration/);
  assert.doesNotMatch(filterLogicContent, /enabled: incomingContentFilters\.duration\?\.enabled === true/);

  const seedContent = sliceBetween(seed, 'function hasEnabledContentFilters(settings) {', 'function hasSelectedCategoryFilters(settings) {');
  assert.match(seedContent, /settings\.contentFilters\.duration\?\.enabled === true/);
  assert.match(seedContent, /settings\.contentFilters\.uploadDate\?\.enabled === true/);
  assert.match(seedContent, /settings\.contentFilters\.uppercase\?\.enabled === true/);

  const filterLogicContentChecks = sliceBetween(filterLogic, 'const cf = this.settings.contentFilters;', '_checkUppercaseTitle(title, settings)');
  assert.match(filterLogicContentChecks, /if \(cf\.duration && cf\.duration\.enabled\)/);
  assert.match(filterLogicContentChecks, /if \(cf\.uploadDate\?\.enabled\)/);
  assert.match(filterLogicContentChecks, /if \(cf\.uppercase\?\.enabled\)/);

  const injectorContent = sliceBetween(injector, 'function hasEnabledContentFilters(settings) {', 'function hasSelectedCategoryFilters(settings) {');
  assert.match(injectorContent, /settings\.contentFilters\.duration\?\.enabled === true/);
  assert.match(injectorContent, /settings\.contentFilters\.uploadDate\?\.enabled === true/);
  assert.match(injectorContent, /settings\.contentFilters\.uppercase\?\.enabled === true/);

  const bridgeContent = sliceBetween(bridge, 'function hasBridgeEnabledContentFilters(settings) {', 'function hasBridgeSelectedCategoryFilters(settings) {');
  assert.match(bridgeContent, /settings\.contentFilters\.duration\?\.enabled === true/);
  assert.match(bridgeContent, /settings\.contentFilters\.uploadDate\?\.enabled === true/);
  assert.match(bridgeContent, /settings\.contentFilters\.uppercase\?\.enabled === true/);

  const domActive = sliceBetween(domFallback, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility() {');
  assert.match(domActive, /contentFilters\?\.duration\?\.enabled === true/);
  assert.match(domActive, /contentFilters\?\.uploadDate\?\.enabled === true/);
  assert.match(domActive, /contentFilters\?\.uppercase\?\.enabled === true/);

  const domEffect = sliceBetween(domFallback, 'if (durationSettings && durationSettings.enabled', 'const matchesFilters = shouldHideContent');
  assert.match(domEffect, /durationSettings && durationSettings\.enabled/);
  assert.match(domEffect, /cf\.duration\?\.enabled \|\|/);
  assert.match(domEffect, /cf\.uploadDate\?\.enabled \|\|/);
  assert.match(domEffect, /cf\.uppercase\?\.enabled/);

  const tabView = read('js/tab-view.js');
  const stateManager = read('js/state_manager.js');
  const mainSave = sliceBetween(tabView, 'function saveVideoFilters(options = {}) {', '// Attach listeners after a short delay to ensure elements are in DOM');
  const kidsSave = sliceBetween(tabView, 'function saveKidsVideoFilters(options = {}) {', 'function applyKidsVideoFiltersToUI(contentFilters = {}) {');
  const mainStateUpdate = sliceBetween(stateManager, 'async function updateContentFilters(nextContentFilters) {', 'async function updateKidsContentFilters(nextContentFilters) {');
  const kidsStateUpdate = sliceBetween(stateManager, 'async function updateKidsContentFilters(nextContentFilters) {', 'async function updateCategoryFilters(nextCategoryFilters) {');

  assert.match(mainSave, /const nextDuration = \{\s+\.\.\.\(prior\.duration \|\| \{\}\),\s+enabled: durationEnabled,\s+condition: durationCondition\s+\};/);
  assert.match(mainSave, /const nextUpload = \{\s+\.\.\.\(prior\.uploadDate \|\| \{\}\),\s+enabled: uploadEnabled,\s+condition: uploadCondition\s+\};/);
  assert.match(mainSave, /const val = parsePositiveFloat\(durationLongerValueRaw\);\s+if \(val !== null\) \{/);
  assert.match(mainSave, /const val = parsePositiveFloat\(uploadNewerRaw\);\s+if \(val !== null\) \{/);
  assert.doesNotMatch(mainSave, /else\s*\{[\s\S]{0,160}(minMinutes|maxMinutes|fromDate|toDate|valueMax)\s*=/);
  assert.match(kidsSave, /const nextDuration = \{\s+\.\.\.\(prior\.duration \|\| \{\}\),\s+enabled: durationEnabled,\s+condition: durationCondition\s+\};/);
  assert.match(kidsSave, /const nextUpload = \{\s+\.\.\.\(prior\.uploadDate \|\| \{\}\),\s+enabled: uploadEnabled,\s+condition: uploadCondition\s+\};/);
  assert.match(kidsSave, /const val = parsePositiveFloat\(durationLongerValueRaw\);\s+if \(val !== null\) \{/);
  assert.match(kidsSave, /const val = parsePositiveFloat\(uploadNewerRaw\);\s+if \(val !== null\) \{/);
  assert.doesNotMatch(kidsSave, /else\s*\{[\s\S]{0,160}(minMinutes|maxMinutes|fromDate|toDate|valueMax)\s*=/);
  assert.match(mainStateUpdate, /duration: \{ \.\.\.state\.contentFilters\.duration, \.\.\.\(nextContentFilters\.duration \|\| \{\}\) \}/);
  assert.match(mainStateUpdate, /uploadDate: \{ \.\.\.state\.contentFilters\.uploadDate, \.\.\.\(nextContentFilters\.uploadDate \|\| \{\}\) \}/);
  assert.doesNotMatch(mainStateUpdate, /delete\s+state\.contentFilters|fromDate:\s*''|minMinutes:\s*0/);
  assert.match(kidsStateUpdate, /duration: \{ \.\.\.\(current\.duration \|\| \{\}\), \.\.\.\(nextContentFilters\.duration \|\| \{\}\) \}/);
  assert.match(kidsStateUpdate, /uploadDate: \{ \.\.\.\(current\.uploadDate \|\| \{\}\), \.\.\.\(nextContentFilters\.uploadDate \|\| \{\}\) \}/);
  assert.doesNotMatch(kidsStateUpdate, /delete\s+kids\.contentFilters|fromDate:\s*''|minMinutes:\s*0/);
  assert.doesNotMatch(sharedCompiler, /contentFilterValueNormalizationAuthority|contentFilterDurationValueCleanupReport/);

  for (const ledgerPath of centralLedgerPaths) {
    const ledger = read(ledgerPath);
    assert.ok(
      ledger.includes('2026-05-27 content-filter enabled normalization continuation') ||
        ledger.includes('2026-05-28 content-filter enabled normalization continuation'),
      `${ledgerPath} should cite content-filter enabled normalization continuation`
    );
    assert.ok(ledger.includes(docPath), `${ledgerPath} should cite ${docPath}`);
    assert.match(ledger, /7 normalization rows|7 rows across shared compiler pass-through|carries 7 normalization rows/);
    assert.doesNotMatch(ledger, /pins 6 normalization rows|pins 6 rows across shared compiler pass-through/);
  }
});

test('compiled settings field register records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const field of [
    'compiledSettingsFieldReference',
    'compilerOwner',
    'emittedByBackgroundCompiler',
    'emittedBySharedCompiler',
    'normalizedByFilterLogic',
    'consumedBySeed',
    'consumedByContentBridge',
    'consumedByBridgeSettings',
    'jsonFirstFieldDecision',
    'fieldEffectClass',
    'storageRevisionPolicy',
    'seedNoWorkBudget',
    'filterProcessBudget',
    'bridgeLifecycleBudget',
    'negativeEmptyRuleFixture',
    'negativeSiblingFixture'
  ]) {
    assert.match(text, new RegExp(`\\b${field}\\b`), `missing future proof field ${field}`);
  }

  const productSource = productFieldFiles.map(read).join('\n');
  for (const symbol of [
    'compiledSettingsFieldRegisterAuthority',
    'compiledSettingsSchemaManifest',
    'compiledSettingsFieldParityReport',
    'compiledSettingsConsumerManifest',
    'settingsJsonFirstFieldDecision',
    'settingsJsonFirstNoWorkBudget',
    'compiledSettingsRevisionContract',
    'compiledSettingsFixtureProvenance',
    'contentFilterValueNormalizationAuthority',
    'contentFilterDurationValueCleanupReport',
    'contentFilterUploadDateValueCleanupReport',
    'contentFilterStateManagerValueCleanupOwner',
    'contentFilterDashboardBlankValuePolicy',
    'contentFilterJsonFirstValueNormalizedPredicate'
  ]) {
    assert.match(text, new RegExp(`\\b${symbol}\\b`));
    assert.doesNotMatch(productSource, new RegExp(`\\b${symbol}\\b`));
  }
});
