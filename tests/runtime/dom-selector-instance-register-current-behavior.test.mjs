import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const registerPath = 'docs/audit/FILTERTUBE_DOM_SELECTOR_INSTANCE_REGISTER_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function trackedNonVendorJs() {
  return git([
    'ls-files',
    '*.js',
    '*.jsx',
    '*.mjs',
    ':(exclude)docs/**',
    ':(exclude)tests/**'
  ])
    .filter(file => !file.startsWith('js/vendor/'));
}

function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function lineForIndex(starts, index) {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (starts[mid] <= index) low = mid + 1;
    else high = mid - 1;
  }
  return high + 1;
}

function lineOf(file, needle) {
  const lines = read(file).split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle}`);
  return index + 1;
}

function lineOfAfter(file, afterNeedle, needle) {
  const lines = read(file).split(/\r?\n/);
  const start = lines.findIndex((line) => line.includes(afterNeedle));
  assert.ok(start >= 0, `${file} missing anchor ${afterNeedle}`);
  const index = lines.findIndex((line, lineIndex) => lineIndex >= start && line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle} after ${afterNeedle}`);
  return index + 1;
}

function readStringLiteral(text, index) {
  const quote = text[index];
  if (!['"', "'", '`'].includes(quote)) return null;
  let value = '';
  let escaped = false;
  let hasTemplateExpression = false;
  for (let i = index + 1; i < text.length; i += 1) {
    const char = text[i];
    if (escaped) {
      value += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (quote === '`' && char === '$' && text[i + 1] === '{') {
      hasTemplateExpression = true;
    }
    if (char === quote) {
      return { value, end: i + 1, quote, hasTemplateExpression };
    }
    value += char;
  }
  return null;
}

function readArgExpression(text, index) {
  let expression = '';
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = index; i < text.length; i += 1) {
    const char = text[i];
    if (quote) {
      expression += char;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (['"', "'", '`'].includes(char)) {
      quote = char;
      expression += char;
      continue;
    }
    if (char === '(') {
      depth += 1;
      expression += char;
      continue;
    }
    if (char === ')') {
      if (depth === 0) return expression.trim();
      depth -= 1;
      expression += char;
      continue;
    }
    if (char === ',' && depth === 0) return expression.trim();
    expression += char;
  }
  return expression.trim();
}

function classifySourceFamily(file) {
  if ([
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/block_channel.js',
    'js/content/dom_extractors.js',
    'js/content/collab_dialog.js',
    'js/injector.js',
    'js/content/dom_helpers.js'
  ].includes(file)) return 'page-runtime';
  if (['js/tab-view.js', 'js/popup.js', 'js/ui_components.js'].includes(file)) return 'extension-ui';
  if (file === 'js/layout.js') return 'legacy-layout';
  return 'other';
}

function enumerateSelectorSites() {
  const rows = [];
  const selectorCall = /\b(querySelectorAll|querySelector|closest|matches)\s*\(/g;
  for (const file of trackedNonVendorJs()) {
    const text = read(file);
    const starts = lineStarts(text);
    const lines = text.split('\n');
    let match;
    while ((match = selectorCall.exec(text))) {
      let argIndex = selectorCall.lastIndex;
      while (/\s/.test(text[argIndex])) argIndex += 1;
      const literal = readStringLiteral(text, argIndex);
      const isStaticLiteral = Boolean(literal && !literal.hasTemplateExpression);
      const line = lineForIndex(starts, match.index);
      rows.push({
        id: `${file}:${match.index}:${match[1]}`,
        file,
        line,
        api: match[1],
        sourceFamily: classifySourceFamily(file),
        isStaticLiteral,
        selector: isStaticLiteral ? literal.value : null,
        expression: isStaticLiteral ? literal.value : readArgExpression(text, argIndex),
        snippet: (lines[line - 1] || '').trim()
      });
    }
  }
  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countStaticDynamic(rows, key) {
  const out = {};
  for (const row of rows) {
    const bucket = row[key];
    out[bucket] ||= { sites: 0, static: 0, dynamic: 0, unique: new Set() };
    out[bucket].sites += 1;
    if (row.isStaticLiteral) {
      out[bucket].static += 1;
      out[bucket].unique.add(row.selector);
    } else {
      out[bucket].dynamic += 1;
    }
  }
  return Object.fromEntries(
    Object.entries(out)
      .sort()
      .map(([bucket, value]) => [bucket, {
        sites: value.sites,
        static: value.static,
        dynamic: value.dynamic,
        unique: value.unique.size
      }])
  );
}

test('DOM selector instance register documents boundary and non-completion', () => {
  const doc = read(registerPath);

  assert.match(doc, /Status: source-derived audit register/);
  assert.match(doc, /Completion is not proven/);
  assert.match(doc, /not-ready-for-behavior-change/);
  assert.match(doc, /git ls-files '\*\.js' '\*\.jsx' '\*\.mjs'/);
  assert.match(doc, /excludes `js\/vendor\/\*\*`/);
  assertReleaseHotPathSelectorAddendum(doc);
});

function assertReleaseHotPathSelectorAddendum(doc) {
  assert.match(doc, /Release Hot-Path Selector Addendum - 2026-05-27/);
  assert.match(doc, /release hot-path selector rows: 12/);
  assert.match(doc, /release selector source files covered: 2/);
  assert.match(doc, /central selector authority in product source: absent/);
  assert.match(doc, /selector behavior change approval from this addendum: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);

  const sourcePins = [
    ['release_selector_quick_block_overlay_exclusion', 'js/content/block_channel.js', 'hostCard.closest?.(`${FT_DROPDOWN_SELECTORS}, ytm-bottom-sheet-renderer`)', 'closest'],
    ['release_selector_quick_block_target_card', 'js/content/block_channel.js', 'const closestCard = target.closest?.(QUICK_BLOCK_CARD_SELECTORS);', 'closest'],
    ['release_selector_quick_block_sweep_cards', 'js/content/block_channel.js', 'root.querySelectorAll(QUICK_BLOCK_CARD_SELECTORS).forEach((card) => {', 'querySelectorAll'],
    ['release_selector_menu_dropdown_repair_nested', 'js/content/block_channel.js', 'dropdown.querySelectorAll?.(\'ytd-menu-popup-renderer, ytm-menu-popup-renderer, bottom-sheet-container, div.menu-content[role="dialog"]\').forEach(el => {', 'querySelectorAll'],
    ['release_selector_menu_button_activation', 'js/content/block_channel.js', 'const menuButton = target.closest(', 'closest', 'menuButtonSelector'],
    ['release_selector_menu_outside_close_owned_items', 'js/content/block_channel.js', 'document.querySelectorAll(FT_DROPDOWN_SELECTORS).forEach(dropdown => {', 'querySelectorAll', null, 'const closeFilterTubeInjectedDropdownsOnOutsidePointer = (event) =>'],
    ['release_selector_menu_outside_close_owned_items', 'js/content/block_channel.js', 'if (!dropdown.querySelector?.(\'.filtertube-block-channel-item\')) return;', 'querySelector'],
    ['release_selector_dropdown_discovery_added_node', 'js/content/block_channel.js', 'if (node.matches?.(FT_DROPDOWN_SELECTORS)) {', 'matches'],
    ['release_selector_dropdown_discovery_added_node', 'js/content/block_channel.js', 'node.querySelectorAll?.(FT_DROPDOWN_SELECTORS).forEach(handleCandidateDropdown);', 'querySelectorAll'],
    ['release_selector_menu_existing_item_check', 'js/content/block_channel.js', 'const existingMenuItem = dropdown.querySelector(\'.filtertube-block-channel-item\');', 'querySelector'],
    ['release_selector_menu_existing_item_check', 'js/content/block_channel.js', 'const titleSpan = existingMenuItem.querySelector(\'.filtertube-menu-title\');', 'querySelector'],
    ['release_selector_menu_stale_item_cleanup', 'js/content/block_channel.js', 'const oldItems = dropdown.querySelectorAll(\'.filtertube-block-channel-item\');', 'querySelectorAll'],
    ['release_selector_whitelist_pending_card_intake', 'js/content_bridge.js', 'if (node.matches?.(VIDEO_CARD_SELECTORS)) return queueCandidate(node);', 'matches'],
    ['release_selector_whitelist_pending_card_intake', 'js/content_bridge.js', 'if (!node.querySelector?.(VIDEO_CARD_SELECTORS)) return;', 'querySelector'],
    ['release_selector_whitelist_pending_card_intake', 'js/content_bridge.js', 'const nested = node.querySelectorAll?.(VIDEO_CARD_SELECTORS) || [];', 'querySelectorAll']
  ];

  for (const [rowId, file, needle, api, requiredDocNeedle = null, afterNeedle = null] of sourcePins) {
    const line = afterNeedle ? lineOfAfter(file, afterNeedle, needle) : lineOf(file, needle);
    assert.ok(doc.includes(`| \`${rowId}\` |`), `missing addendum row ${rowId}`);
    assert.ok(doc.includes(`\`${file}:${line}:${api}\``), `missing selector source pin ${file}:${line}:${api}`);
    if (requiredDocNeedle) assert.ok(doc.includes(requiredDocNeedle), `missing required doc token ${requiredDocNeedle}`);
  }

  const commentStart = lineOf('js/content/block_channel.js', 'const commentContextCard = lastClickedMenuButton.closest(');
  const commentEnd = lineOfAfter(
    'js/content/block_channel.js',
    'const commentContextCard = lastClickedMenuButton.closest(',
    ');'
  );
  assert.ok(doc.includes(`\`js/content/block_channel.js:${commentStart}-${commentEnd}:closest\``));

  const fallbackStart = lineOfAfter(
    'js/content_bridge.js',
    'const observer = new MutationObserver((mutations) => {',
    'const targetCard = target.matches?.(fallbackMenuCardSelector)'
  );
  const fallbackEnd = lineOfAfter(
    'js/content_bridge.js',
    'const targetCard = target.matches?.(fallbackMenuCardSelector)',
    ': target.closest?.(fallbackMenuCardSelector);'
  );
  assert.ok(doc.includes(`\`js/content_bridge.js:${fallbackStart}-${fallbackEnd}:matches/closest\``));

  const blockChannel = read('js/content/block_channel.js');
  const contentBridge = read('js/content_bridge.js');
  assert.ok(blockChannel.includes('if (!dropdown.querySelector?.(\'.filtertube-block-channel-item\')) return;'));
  assert.ok(blockChannel.includes('const commentContextCard = lastClickedMenuButton.closest('));
  assert.ok(contentBridge.indexOf("if (currentSettings?.listMode !== 'whitelist') return;") < contentBridge.indexOf('if (node.matches?.(VIDEO_CARD_SELECTORS)) return queueCandidate(node);'));
  assert.ok(contentBridge.indexOf('if (!shouldEagerFallbackMenuScan()) return;') < contentBridge.indexOf('const targetCard = target.matches?.(fallbackMenuCardSelector)'));
}

test('DOM selector instance register enumerates current API sites and literal dynamic split', () => {
  const rows = enumerateSelectorSites();
  const staticRows = rows.filter(row => row.isStaticLiteral);
  const dynamicRows = rows.filter(row => !row.isStaticLiteral);
  const uniqueStatic = new Set(staticRows.map(row => row.selector));

  assert.equal(rows.length, 646);
  assert.equal(staticRows.length, 579);
  assert.equal(dynamicRows.length, 67);
  assert.equal(uniqueStatic.size, 374);
  assert.deepEqual(countBy(rows, 'api'), {
    closest: 96,
    matches: 6,
    querySelector: 399,
    querySelectorAll: 145
  });
  assert.deepEqual(countBy(staticRows, 'api'), {
    closest: 93,
    matches: 5,
    querySelector: 375,
    querySelectorAll: 106
  });
});

test('every selector API site has file line api expression snippet and source family metadata', () => {
  const rows = enumerateSelectorSites();
  const ids = new Set(rows.map(row => row.id));

  assert.equal(ids.size, rows.length, 'selector site ids should be unique by file:source-index:api');
  for (const row of rows) {
    assert.ok(row.file, `missing file for ${row.id}`);
    assert.ok(Number.isInteger(row.line) && row.line > 0, `missing line for ${row.id}`);
    assert.ok(row.api, `missing api for ${row.id}`);
    assert.ok(row.expression, `missing expression for ${row.id}`);
    assert.ok(row.snippet, `missing snippet for ${row.id}`);
    assert.notEqual(row.sourceFamily, 'other', `${row.id} must have a source family`);
  }
});

test('selector source-family totals match the current register doc', () => {
  const rows = enumerateSelectorSites();
  const doc = read(registerPath);

  assert.deepEqual(countStaticDynamic(rows, 'sourceFamily'), {
    'extension-ui': { sites: 90, static: 90, dynamic: 0, unique: 42 },
    'legacy-layout': { sites: 63, static: 63, dynamic: 0, unique: 52 },
    'page-runtime': { sites: 493, static: 426, dynamic: 67, unique: 286 }
  });

  for (const phrase of [
    '| `page-runtime` | 493 | 426 | 67 | 286 |',
    '| `extension-ui` | 90 | 90 | 0 | 42 |',
    '| `legacy-layout` | 63 | 63 | 0 | 52 |',
    '| **Total** | **646** | **579** | **67** |'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase ${phrase}`);
  }
});

test('selector hot-file totals match the source-derived register', () => {
  const rows = enumerateSelectorSites();
  const byFile = countStaticDynamic(rows, 'file');

  assert.deepEqual(
    Object.fromEntries(Object.entries(byFile).filter(([, value]) => value.sites > 0)),
    {
      'js/content/block_channel.js': { sites: 39, static: 28, dynamic: 11, unique: 21 },
      'js/content/collab_dialog.js': { sites: 11, static: 10, dynamic: 1, unique: 10 },
      'js/content/dom_extractors.js': { sites: 27, static: 23, dynamic: 4, unique: 21 },
      'js/content/dom_fallback.js': { sites: 161, static: 150, dynamic: 11, unique: 118 },
      'js/content/dom_helpers.js': { sites: 3, static: 2, dynamic: 1, unique: 2 },
      'js/content_bridge.js': { sites: 246, static: 208, dynamic: 38, unique: 137 },
      'js/injector.js': { sites: 6, static: 5, dynamic: 1, unique: 5 },
      'js/layout.js': { sites: 63, static: 63, dynamic: 0, unique: 52 },
      'js/popup.js': { sites: 16, static: 16, dynamic: 0, unique: 7 },
      'js/tab-view.js': { sites: 68, static: 68, dynamic: 0, unique: 33 },
      'js/ui_components.js': { sites: 6, static: 6, dynamic: 0, unique: 6 }
    }
  );
});

test('dynamic selector expressions include the high-risk constants and runtime templates', () => {
  const dynamicExpressions = enumerateSelectorSites()
    .filter(row => !row.isStaticLiteral)
    .map(row => row.expression);

  for (const expected of [
    'VIDEO_CARD_SELECTORS',
    'QUICK_BLOCK_CARD_SELECTORS',
    'FT_DROPDOWN_SELECTORS',
    "`${VIDEO_CARD_SELECTORS}[data-filtertube-whitelist-pending=\"true\"]`",
    "selectors.join(',')",
    'linkSelectors',
    '`[data-filtertube-video-id="${videoId}"]`',
    'nativeMenuSelector',
    'playlistSelectors',
    'childSelector'
  ]) {
    assert.ok(dynamicExpressions.includes(expected), `missing dynamic selector expression ${expected}`);
  }
});

test('DOM selector instance register links the source-derived content bridge selector semantic addendum', () => {
  const doc = read(registerPath);

  for (const token of [
    'Content Bridge Selector Semantic Addendum',
    'docs/audit/FILTERTUBE_CONTENT_BRIDGE_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/content-bridge-selector-semantic-register-current-behavior.test.mjs',
    '`js/content_bridge.js` 246-site hot-file row',
    'source-derived selector/effect groups',
    '246 selector API sites',
    '208 static literal args',
    '38 dynamic/non-literal args',
    '137 unique static selector literals',
    '13 semantic selector groups',
    '12 dynamic selector families',
    'contentBridgeSelectorSemanticAuthority',
    'contentBridgeSelectorEffectReport',
    'contentBridgeSelectorOwnerContract',
    'contentBridgeDynamicSelectorEscapePolicy',
    'contentBridgeSelectorNoRuleBudget',
    'contentBridgeSelectorRestoreProof'
  ]) {
    assert.ok(doc.includes(token), `missing content bridge selector addendum token ${token}`);
  }
});

test('DOM selector instance register links the source-derived DOM fallback selector semantic addendum', () => {
  const doc = read(registerPath);

  for (const token of [
    'DOM Fallback Selector Semantic Addendum',
    'docs/audit/FILTERTUBE_DOM_FALLBACK_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/dom-fallback-selector-semantic-register-current-behavior.test.mjs',
    '`js/content/dom_fallback.js` and `js/content/dom_helpers.js`',
    'source-derived selector/effect groups',
    '164 selector API sites',
    '152 static literal args',
    '12 dynamic/non-literal args',
    '120 unique static selector literals',
    '11 semantic selector groups',
    '12 dynamic selector families',
    'domFallbackSelectorSemanticAuthority',
    'domFallbackSelectorEffectReport',
    'domFallbackSelectorOwnerContract',
    'domFallbackDynamicSelectorEscapePolicy',
    'domFallbackSelectorNoRuleBudget',
    'domFallbackSelectorRestoreProof',
    'domFallbackSiblingVisibleFixtureReport',
    'domHelperSelectorInputContract'
  ]) {
    assert.ok(doc.includes(token), `missing DOM fallback selector addendum token ${token}`);
  }
});

test('selector register keeps inventory docs and raw captures outside selector authority', () => {
  const doc = read(registerPath);
  const selectorAudit = read('docs/audit/FILTERTUBE_SELECTOR_AUTHORITY_AUDIT_2026-05-18.md');
  const rendererInventory = read('docs/youtube_renderer_inventory.md');
  const jsonInventory = read('docs/json_paths_encyclopedia.md');

  assert.match(doc, /Inventory docs remain evidence maps/);
  assert.match(selectorAudit, /Evidence Boundary/);
  assert.match(rendererInventory, /✅ Covered|✅ \*\*IMPLEMENTED\*\*/);
  assert.match(jsonInventory, /Absolute JSON Trace/);
});

test('DOM selector instance register names future fixture gates before behavior changes', () => {
  const doc = read(registerPath);

  for (const fixtureName of [
    'selector_instance_register_every_site_has_file_line_api_owner',
    'selector_instance_static_literal_unique_registry_matches_source',
    'selector_instance_dynamic_expression_has_source_owner_and_escape_policy',
    'selector_instance_video_card_constants_split_by_surface_route_action',
    'selector_instance_quick_block_constants_have_feature_and_route_gate',
    'selector_instance_fallback_menu_selectors_share_primary_action_gate',
    'selector_instance_video_id_templates_require_owned_identity_source',
    'selector_instance_comment_selectors_do_not_target_watch_scaffolding',
    'selector_instance_watch_shell_selectors_require_explicit_whole_container_policy',
    'selector_instance_legacy_layout_selectors_remain_quarantined_or_loaded_explicitly',
    'selector_instance_inventory_docs_require_runtime_source_or_fixture_status',
    'selector_instance_raw_capture_dom_extracts_minimal_fixture_before_behavior_change'
  ]) {
    assert.ok(doc.includes(fixtureName), `missing fixture gate ${fixtureName}`);
  }
});
