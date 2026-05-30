import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_CONTROL_ACTIVE_WORK_MATRIX_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const compiledContentControlReadinessDocs = [
  'docs/audit/FILTERTUBE_COMPILED_CACHE_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_COMPILER_PARITY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_CONTENT_CATEGORY_PREDICATE_AUTHORITY_AUDIT_2026-05-18.md',
  docPath,
  'docs/audit/FILTERTUBE_CONTENT_CONTROL_ALIAS_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_P0_COMPILED_RULE_STATE_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_P0_CONTENT_CATEGORY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_ENABLED_MASTER_SWITCH_DISABLED_RUNTIME_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_VISIBLE_EMPTY_RUNTIME_ACTIVE_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_EMPTY_INSTALL_PERFORMANCE_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_FILTER_ALL_TOGGLE_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_STARTUP_INJECTION_READINESS_CURRENT_BEHAVIOR_2026-05-19.md'
];

const authoritySymbols = [
  'contentControlActiveWorkMatrixContract',
  'contentControlJsonWorkDecision',
  'contentControlDomWorkDecision',
  'contentControlRuntimeKeyManifest',
  'contentControlNoWorkBudgetReport',
  'contentControlBackgroundInvalidationPolicy',
  'contentControlAffordanceWorkPolicy',
  'contentControlPlayerDomOnlyPolicy',
  'contentControlOptimizationMetricArtifact',
  'contentControlActiveWorkFixtureProvenance',
  'contentControlFirstClassJsonPromotionGate'
];

const controlRows = [
  ['hideShorts', 'hideAllShorts', 'seed-json', 'filter-logic', 'dom-active', 'dom-js', 'bg-exact'],
  ['hideHomeFeed', 'hideHomeFeed', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-exact'],
  ['hideComments', 'hideAllComments', 'seed-json', 'filter-logic', 'dom-active', 'dom-style', 'bg-alias-only'],
  ['hideSponsoredCards', 'hideSponsoredCards', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-exact'],
  ['hidePlaylistCards', 'hidePlaylistCards', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideMembersOnly', 'hideMembersOnly', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-exact'],
  ['hideMixPlaylists', 'hideMixPlaylists', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['showQuickBlockButton', 'showQuickBlockButton', 'no-seed', 'no-filter', 'no-dom-active', 'no-dom-style', 'bg-omitted'],
  ['showBlockMenuItem', 'showBlockMenuItem', 'no-seed', 'no-filter', 'no-dom-active', 'no-dom-style', 'bg-omitted'],
  ['hideVideoSidebar', 'hideVideoSidebar', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideRecommended', 'hideRecommended', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideLiveChat', 'hideLiveChat', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideWatchPlaylistPanel', 'hideWatchPlaylistPanel', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideVideoInfo', 'hideVideoInfo', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideVideoButtonsBar', 'hideVideoButtonsBar', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideAskButton', 'hideAskButton', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideVideoChannelRow', 'hideVideoChannelRow', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideVideoDescription', 'hideVideoDescription', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideMerchTicketsOffers', 'hideMerchTicketsOffers', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideEndscreenVideowall', 'hideEndscreenVideowall', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideEndscreenCards', 'hideEndscreenCards', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['disableAutoplay', 'disableAutoplay', 'no-seed', 'no-filter', 'no-dom-active', 'dom-style', 'bg-omitted'],
  ['disableAnnotations', 'disableAnnotations', 'no-seed', 'no-filter', 'no-dom-active', 'dom-style', 'bg-omitted'],
  ['hideTopHeader', 'hideTopHeader', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideNotificationBell', 'hideNotificationBell', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideExploreTrending', 'hideExploreTrending', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideMoreFromYouTube', 'hideMoreFromYouTube', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideSubscriptions', 'hideSubscriptions', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted'],
  ['hideSearchShelves', 'hideSearchShelves', 'no-seed', 'no-filter', 'dom-active', 'dom-style', 'bg-omitted']
].map(([uiKey, runtimeKey, seedJson, filterLogic, domActive, domStyle, bgInvalidation]) => ({
  uiKey,
  runtimeKey,
  seedJson,
  filterLogic,
  domActive,
  domStyle,
  bgInvalidation
}));

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function loadCatalog() {
  const sandbox = { window: {}, console };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(read('js/content_controls_catalog.js'), sandbox);
  return JSON.parse(JSON.stringify(sandbox.window.FilterTubeContentControlsCatalog.getCatalog()));
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function blockContains(block, row) {
  return block.includes(row.runtimeKey) || block.includes(row.uiKey);
}

function exactRuntimeInvalidates(block, row) {
  return block.includes(`'${row.runtimeKey}'`);
}

function sourceBlocks() {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const background = read('js/background.js');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const settingsShared = read('js/settings_shared.js');
  const stateManager = read('js/state_manager.js');
  const bgGetStart = background.indexOf('async function getCompiledSettings');
  const bgRefreshStart = background.indexOf('// Listen for storage changes to re-compile settings');

  return {
    seed,
    filterLogic,
    domFallback,
    background,
    bridgeSettings,
    settingsShared,
    stateManager,
    seedJsonPredicateHelpers: sliceBetween(
      seed,
      '    function hasEnabledContentFilters(settings) {',
      '\n\n    function shouldCaptureRawSnapshot'
    ),
    seedProcessDebugSettings: sliceBetween(
      seed,
      '        seedDebugLog(`Settings available:`, {',
      '        });\n\n        // Use the comprehensive filtering engine'
    ),
    filterShortsCommentsDecision: sliceBetween(
      filterLogic,
      '            // Shorts filtering',
      '                // Apply keyword filters to comments'
    ),
    domActiveBooleanKeys: sliceBetween(
      domFallback,
      '        const booleanFilterKeys = [',
      '        ];\n        if (booleanFilterKeys.some'
    ),
    domContentControlStyles: sliceBetween(
      domFallback,
      'function ensureContentControlStyles(settings) {',
      'function hideYouTubeOpenAppButtons()'
    ),
    bgCompilerStorageGet: sliceBetween(
      background,
      '        browserAPI.storage.local.get([',
      '        ], (items) => {',
      bgGetStart
    ),
    bgBooleanPassThrough: sliceBetween(
      background,
      '            // Pass through boolean flags',
      '            const profileContentFilters ='
    ),
    bgStorageInvalidationKeys: sliceBetween(
      background,
      '        const relevantKeys = [',
      '        let settingsChanged = false;',
      bgRefreshStart
    ),
    bridgeRefreshKeys: sliceBetween(
      bridgeSettings,
      '    const relevantKeys = [',
      '    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
    ),
    sharedSettingsKeys: sliceBetween(
      settingsShared,
      '    const SETTINGS_KEYS = [',
      '\n\n    const SETTINGS_CHANGE_KEYS'
    ),
    stateValidKeys: sliceBetween(
      stateManager,
      '        const validKeys = [',
      '        ];\n\n        if (!validKeys.includes(key))'
    ),
    stateExternalReloadKeys: sliceBetween(
      stateManager,
      '                const storageKeys = [',
      '                const hasSettingsChange = storageKeys.some'
    )
  };
}

test('content-control active-work matrix is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, JSON filter patch/);
  assert.match(doc, /content control active-work matrix source files: 8/);
  assert.match(doc, /content control active-work source\/effect blocks: 12/);
  assert.match(doc, /catalog controls: 29/);
  assert.match(doc, /seed active JSON predicate controls: 2/);
  assert.match(doc, /filter_logic direct content-control decision controls: 2/);
  assert.match(doc, /DOM active gate controls: 25/);
  assert.match(doc, /DOM style controls: 26/);
  assert.match(doc, /background exact-runtime invalidation controls: 4/);
  assert.match(doc, /background alias-only invalidation controls: 1/);
  assert.match(doc, /background omitted invalidation controls: 24/);
  assert.match(doc, /content bridge refresh controls: 29/);
  assert.match(doc, /StateManager reload controls: 29/);
  assert.match(doc, /runtime content-control active-work matrix fixtures: 6/);

  assert.ok(doc.includes(`| \`js/content_controls_catalog.js\` | 222 | 7822 | \`${sha256('js/content_controls_catalog.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3498 | 165151 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6313 | 284710 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 651 | 26462 | \`${sha256('js/content/bridge_settings.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/state_manager.js\` | 2491 | 99780 | \`${sha256('js/state_manager.js')}\` |`));
});

test('compiled settings and content-control docs carry the method proof gap blocker', () => {
  const gap = read(methodGapPath);

  for (const token of [
    'tracked JS/JSX/MJS files: 63',
    'repo-wide lexical callables: 5469',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5469',
    'runtime behavior changed: no'
  ]) {
    assert.ok(gap.includes(token), `method gap index missing token ${token}`);
  }

  for (const auditDoc of compiledContentControlReadinessDocs) {
    const text = read(auditDoc);

    for (const token of [
      methodGapPath,
      'method semantic proof gap files covered: 63',
      'method semantic proof gap lexical callables covered: 5469',
      'files with complete per-callable semantic proof: 0',
      'lexical callables requiring semantic proof before behavior changes: 5469',
      'affected callable semantic proof: NO-GO',
      'runtime behavior changed: no',
      'JSON-first promotion',
      'optimization',
      'whitelist behavior changes'
    ]) {
      assert.ok(text.includes(token), `${auditDoc} missing blocker token ${token}`);
    }
  }
});

test('content-control active-work source block counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['seed JSON predicate helpers block', blocks.seedJsonPredicateHelpers, 38, 1331],
    ['seed process debug settings block', blocks.seedProcessDebugSettings, 7, 395],
    ['filter_logic Shorts/comments decision block', blocks.filterShortsCommentsDecision, 177, 9067],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 29, 941],
    ['DOM fallback content-control styles block', blocks.domContentControlStyles, 345, 12583],
    ['background compiler storage-get block', blocks.bgCompilerStorageGet, 44, 1408],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage invalidation keys block', blocks.bgStorageInvalidationKeys, 16, 461],
    ['content bridge storage refresh keys block', blocks.bridgeRefreshKeys, 44, 1263],
    ['settings_shared settings keys block', blocks.sharedSettingsKeys, 38, 1031],
    ['StateManager valid keys block', blocks.stateValidKeys, 33, 1063],
    ['StateManager external reload keys block', blocks.stateExternalReloadKeys, 41, 1604]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }
});

test('catalog controls match the documented active-work matrix rows', () => {
  const doc = read(docPath);
  const catalog = loadCatalog();
  const actualRows = catalog.flatMap((group) => (group.controls || []).map((control) => control.key));

  assert.deepEqual(catalog.map((group) => group.id), ['core', 'feed', 'watch', 'video_info', 'player', 'navigation', 'search']);
  assert.deepEqual(actualRows, controlRows.map((row) => row.uiKey));
  assert.equal(controlRows.length, 29);
  assert.equal(controlRows.filter((row) => row.uiKey !== row.runtimeKey).length, 2);

  for (const row of controlRows) {
    assert.ok(
      doc.includes([
        row.uiKey,
        row.runtimeKey,
        row.seedJson,
        row.filterLogic,
        row.domActive,
        row.domStyle,
        row.bgInvalidation
      ].join('|')),
      `missing matrix row for ${row.uiKey}`
    );
  }
});

test('seed and filter logic direct content-control work is limited to Shorts and comments controls', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const seedControls = controlRows.filter((row) => blockContains(blocks.seedJsonPredicateHelpers, row)).map((row) => row.uiKey);
  const seedDebugControls = controlRows.filter((row) => blockContains(blocks.seedProcessDebugSettings, row)).map((row) => row.uiKey);
  const filterControls = controlRows.filter((row) => blockContains(blocks.filterShortsCommentsDecision, row)).map((row) => row.uiKey);

  assert.deepEqual(seedControls, ['hideShorts', 'hideComments']);
  assert.deepEqual(seedDebugControls, ['hideShorts', 'hideComments']);
  assert.deepEqual(filterControls, ['hideShorts', 'hideComments']);

  assert.match(doc, /Only `hideAllShorts` and `hideAllComments` from the catalog appear in `hasActiveJsonFilterRules`/);
  assert.match(doc, /Selected categories and enabled content filters are separate non-catalog JSON work predicates/);
  assert.match(doc, /Only `hideAllShorts` and `hideAllComments` are direct content-control decisions/);
});

test('DOM and settings owners split active gate style refresh and invalidation coverage', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const domActiveControls = controlRows.filter((row) => blockContains(blocks.domActiveBooleanKeys, row)).map((row) => row.uiKey);
  const domStyleControls = controlRows.filter((row) => blockContains(blocks.domContentControlStyles, row)).map((row) => row.uiKey);
  const bgPassControls = controlRows.filter((row) => blockContains(blocks.bgBooleanPassThrough, row)).map((row) => row.uiKey);
  const bridgeControls = controlRows.filter((row) => blockContains(blocks.bridgeRefreshKeys, row)).map((row) => row.uiKey);
  const stateReloadControls = controlRows.filter((row) => blockContains(blocks.stateExternalReloadKeys, row)).map((row) => row.uiKey);
  const bgExactInvalidationControls = controlRows.filter((row) => exactRuntimeInvalidates(blocks.bgStorageInvalidationKeys, row)).map((row) => row.uiKey);
  const bgAliasOnlyControls = controlRows.filter((row) => !exactRuntimeInvalidates(blocks.bgStorageInvalidationKeys, row) && blocks.bgStorageInvalidationKeys.includes(`'${row.uiKey}'`)).map((row) => row.uiKey);

  assert.equal(domActiveControls.length, 25);
  assert.deepEqual(controlRows.filter((row) => !domActiveControls.includes(row.uiKey)).map((row) => row.uiKey), [
    'showQuickBlockButton',
    'showBlockMenuItem',
    'disableAutoplay',
    'disableAnnotations'
  ]);

  assert.equal(domStyleControls.length, 26);
  assert.deepEqual(controlRows.filter((row) => !domStyleControls.includes(row.uiKey)).map((row) => row.uiKey), [
    'hideShorts',
    'showQuickBlockButton',
    'showBlockMenuItem'
  ]);

  assert.equal(bgPassControls.length, 29);
  assert.equal(bridgeControls.length, 29);
  assert.equal(stateReloadControls.length, 29);
  assert.deepEqual(bgExactInvalidationControls, ['hideShorts', 'hideHomeFeed', 'hideSponsoredCards', 'hideMembersOnly']);
  assert.deepEqual(bgAliasOnlyControls, ['hideComments']);
  assert.equal(controlRows.length - bgExactInvalidationControls.length - bgAliasOnlyControls.length, 24);

  assert.match(doc, /25 catalog controls are active DOM fallback triggers/);
  assert.match(doc, /26 catalog controls have content-control style branches/);
  assert.match(doc, /Exact runtime invalidation covers `hideAllShorts`, `hideHomeFeed`, `hideSponsoredCards`, and `hideMembersOnly`/);
  assert.match(doc, /`hideComments` is alias-only; 24 catalog controls do not invalidate background cache by exact runtime key/);
});

test('content-control active-work matrix records non-completion authority gap', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  assert.match(doc, /Content control active-work behavior still needs a runtime key manifest/);
  assert.match(doc, /JSON\s+work decisions/);
  assert.match(doc, /DOM work decisions/);
  assert.match(doc, /background invalidation policy/);
  assert.match(doc, /affordance-work policy/);
  assert.match(doc, /player DOM-only policy/);
  assert.match(doc, /no-work budgets/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class JSON\s+promotion gate/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc missing missing-authority symbol ${symbol}`);
    assert.doesNotMatch(runtime, new RegExp(symbol));
  }
});
