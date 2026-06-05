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
  'js/background.js': [6789, 306239, '618e41011a6031c7a4eb3d022c4612536942a7a58a3c41eb0fd7e31c29a60311'],
  'js/settings_shared.js': [1181, 57535, '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c'],
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/content_bridge.js': [13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
  'js/content/bridge_settings.js': [1113, 44087, 'f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853']
};

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

function uniqueRowsFromDoc(text) {
  const section = sliceBetween(text, '## Unique Field Rows', '## Current Behavior Boundaries');
  return section
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /^js\/.*:\d+:[A-Za-z]+:[A-Za-z0-9_]+:\d+$/.test(line));
}

test('compiled settings field register is audit-only and source pinned', () => {
  const text = doc();
  const { rawRows, uniqueRows } = uniqueFieldRows();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /tracked product files scanned for compiled\/settings fields: 6/);
  assert.match(text, new RegExp(`raw compiled/settings field rows: ${rawRows.length}`));
  assert.match(text, new RegExp(`unique file-field-operation rows: ${uniqueRows.length}`));
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
  const actualRows = uniqueRows.map(row => `${row.file}:${row.line}:${row.operation}:${row.field}:${row.count}`);

  assert.equal(rawRows.length, 317);
  assert.equal(uniqueRows.length, 155);
  assert.deepEqual(countBy(rawRows, 'operation'), {
    cachedSettingsRead: 12,
    compiledAssign: 58,
    currentSettingsRead: 56,
    processedAssign: 7,
    settingsRead: 148,
    sharedCompiledReturn: 36
});
  assert.deepEqual(countBy(uniqueRows, 'operation'), {
    cachedSettingsRead: 7,
    compiledAssign: 48,
    currentSettingsRead: 6,
    processedAssign: 7,
    settingsRead: 51,
    sharedCompiledReturn: 36
});
  assert.deepEqual(countBy(uniqueRows, 'file'), {
    "js/background.js": 54,
    "js/content/bridge_settings.js": 7,
    "js/content_bridge.js": 16,
    "js/filter_logic.js": 26,
    "js/seed.js": 16,
    "js/settings_shared.js": 36
});

  assert.deepEqual(uniqueRowsFromDoc(text), actualRows);
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

  assert.equal(fields.compiledAssign.length, 48);
  assert.equal(fields.sharedCompiledReturn.length, 36);
  assert.equal(fields.processedAssign.length, 7);
  assert.deepEqual(
    fields.compiledAssign.filter(field => !fields.sharedCompiledReturn.includes(field)),
    [
      "activeProfileId",
      "activeProfileKind",
      "channelMap",
      "listMode",
      "managedTimeLimitPolicy",
      "managedViewingRouteGate",
      "profileType",
      "useExactWordMatching",
      "videoChannelMap",
      "videoMetaMap",
      "whitelistChannels",
      "whitelistKeywords"
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
  assert.match(text, /activeProfileId,activeProfileKind,channelMap,listMode,managedTimeLimitPolicy,managedViewingRouteGate,profileType,useExactWordMatching,videoChannelMap,videoMetaMap,whitelistChannels,whitelistKeywords/);
  assert.match(text, /Shared-only compiled fields not assigned by the background compiler/);
  assert.match(text, /none/);
  assert.match(text, /background compiler currently assigns 48 unique compiled fields/);
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
