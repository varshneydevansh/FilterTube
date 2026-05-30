import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_SELECTOR_AUTHORITY_AUDIT_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function trackedProductJs() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('js/vendor/'));
}

function selectorCountsFor(file) {
  const text = read(file);
  const counts = {
    querySelectorAll: 0,
    querySelector: 0,
    closest: 0,
    matches: 0
  };
  const re = /\b(querySelectorAll|querySelector|closest|matches)\s*\(/g;
  let match;
  while ((match = re.exec(text))) {
    counts[match[1]] += 1;
  }
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return { file, total, ...counts };
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
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
      return { value, hasTemplateExpression };
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

function sourceFamily(file) {
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

function classifySelectorTarget(row) {
  const expression = row.expression;
  if (row.sourceFamily === 'extension-ui') return 'extension-ui-owned';
  if (row.sourceFamily === 'legacy-layout') return 'legacy-layout-owned';
  if (/filtertube|data-filtertube|FILTERTUBE/i.test(expression)) return 'filtertube-page-owned';
  if (
    /\b(?:ytd|ytm|ytk|yt-|tp-yt|paper-|iron-|youtube|ytInitial|ytplayer)/i.test(expression) ||
    /#(?:related|secondary|video-title|contents|items|owner|menu|buttons|description|comments|meta|avatar|text|endpoint|thumbnail)/i.test(expression)
  ) {
    return 'youtube-dom-contract';
  }
  if (
    /[A-Z0-9_]{3,}|join\(|selector|Selector|childSelector|hiddenSelector|nativeMenuSelector|linkSelectors|playlistSelectors|shortsSelectors|VIDEO_CARD|DROPDOWN|CARD/i.test(expression)
  ) {
    return 'dynamic-or-caller-owned';
  }
  return 'generic-dom';
}

function selectorSites() {
  const selectorCall = /\b(querySelectorAll|querySelector|closest|matches)\s*\(/g;
  const rows = [];
  for (const file of trackedProductJs()) {
    const text = read(file);
    let match;
    while ((match = selectorCall.exec(text))) {
      let argIndex = selectorCall.lastIndex;
      while (/\s/.test(text[argIndex])) argIndex += 1;
      const literal = readStringLiteral(text, argIndex);
      const isStaticLiteral = Boolean(literal && !literal.hasTemplateExpression);
      rows.push({
        file,
        api: match[1],
        sourceFamily: sourceFamily(file),
        isStaticLiteral,
        expression: isStaticLiteral ? literal.value : readArgExpression(text, argIndex)
      });
    }
  }
  return rows;
}

function selectorTargetOwnershipCounts(rows) {
  const counts = {};
  for (const row of rows) {
    const owner = classifySelectorTarget(row);
    counts[owner] ||= { sites: 0, static: 0, dynamic: 0, unique: new Set() };
    counts[owner].sites += 1;
    if (row.isStaticLiteral) {
      counts[owner].static += 1;
      counts[owner].unique.add(row.expression);
    } else {
      counts[owner].dynamic += 1;
    }
  }
  return Object.fromEntries(
    Object.entries(counts)
      .sort()
      .map(([owner, count]) => [owner, {
        sites: count.sites,
        static: count.static,
        dynamic: count.dynamic,
        unique: count.unique.size
      }])
  );
}

function assertSelectorConvergenceBoundary(doc) {
  const boundary = sliceBetween(
    doc,
    '## Selector Convergence Boundary - 2026-05-30',
    '## Method Semantic Proof Gap Boundary'
  );

  for (const sourceInput of [
    'docs/audit/FILTERTUBE_DOM_SELECTOR_INSTANCE_REGISTER_2026-05-18.md',
    'docs/audit/FILTERTUBE_CONTENT_BRIDGE_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_DOM_FALLBACK_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_DOM_ROUTE_SCOPE_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_DOM_HIDE_SIDE_EFFECT_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_QUICK_BLOCK_HOVER_LIFECYCLE_TIMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
    'docs/audit/FILTERTUBE_MENU_OBSERVER_KIDS_PASSIVE_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
    'docs/audit/FILTERTUBE_WATCH_PLAYER_CONTROL_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_LEGACY_LAYOUT_QUARANTINE_PACKAGE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/youtube_renderer_inventory.md'
  ]) {
    assert.ok(boundary.includes(sourceInput), `missing selector convergence source input ${sourceInput}`);
  }

  for (const rowId of [
    'selector_convergence_instance_census',
    'selector_convergence_page_runtime_dominance',
    'selector_convergence_youtube_dom_contract',
    'selector_convergence_dynamic_expression_authority',
    'selector_convergence_content_bridge_hot_file',
    'selector_convergence_dom_fallback_hot_file',
    'selector_convergence_quick_menu_release_hot_path',
    'selector_convergence_watch_comment_playlist_boundaries',
    'selector_convergence_extension_ui_and_mutation',
    'selector_convergence_legacy_inventory_boundary'
  ]) {
    assert.ok(boundary.includes(rowId), `missing selector convergence row ${rowId}`);
  }

  for (const phrase of [
    '646 selector API sites',
    '493 page-runtime selectors',
    '90 extension UI selectors',
    '63 legacy layout selectors',
    'NO-GO until selectorAuthority reports owner, route, target, gate',
    'false-hide boundary, restore owner, and fixture status',
    'flowchart TD',
    'Route, sibling-visible, and restore proof required',
    'Selector behavior remains NO-GO',
    'selector convergence rows: 10',
    'implementation-ready selector convergence rows: 0',
    'selectorAuthority product source symbol: absent',
    'selectorEffectReport product source symbol: absent',
    'selectorTargetDecision product source symbol: absent',
    'selectorRouteSurfaceAuthority product source symbol: absent',
    'selectorRestoreAuthority product source symbol: absent',
    'runtime behavior changed by this addendum: no',
    'selector rewrite approval: NO-GO',
    'DOM fallback selector pruning approval: NO-GO',
    'quick/menu selector rewrite approval: NO-GO',
    'watch-shell selector behavior approval: NO-GO',
    'legacy layout selector reactivation approval: NO-GO',
    'JSON-first selector promotion approval: NO-GO',
    'release/public-claim use: NO-GO'
  ]) {
    assert.ok(boundary.includes(phrase), `missing selector convergence phrase ${phrase}`);
  }
}

test('selector authority audit documents source counts evidence boundary and future gate', () => {
  const doc = read(auditDocPath);

  for (const phrase of [
    'Selector authority is not centralized',
    'Total selector API call sites',
    'Page runtime',
    'Extension UI',
    'Evidence Boundary',
    'Current High-Risk Selector Families',
    'Selector Target Ownership Addendum - 2026-05-27',
    'Selector Convergence Boundary - 2026-05-30',
    'selectorAuthority',
    'selector convergence rows: 10',
    'implementation-ready selector convergence rows: 0',
    'selectorEffectReport product source symbol: absent',
    'selector rewrite approval: NO-GO',
    'JSON-first selector promotion approval: NO-GO',
    'Required P0 Fixtures Before Selector Behavior Changes',
    'ignored root HTML/JSON/TXT files remain valid evidence inputs'
  ]) {
    assert.ok(doc.includes(phrase), `missing selector audit phrase: ${phrase}`);
  }

  assertSelectorConvergenceBoundary(doc);
});

test('current tracked non-vendor JavaScript selector API counts match the audit', () => {
  const rows = trackedProductJs().map(selectorCountsFor);
  const nonzero = rows.filter(row => row.total > 0).sort((a, b) => b.total - a.total);
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const totals = rows.reduce((acc, row) => {
    acc.querySelectorAll += row.querySelectorAll;
    acc.querySelector += row.querySelector;
    acc.closest += row.closest;
    acc.matches += row.matches;
    return acc;
  }, { querySelectorAll: 0, querySelector: 0, closest: 0, matches: 0 });

  assert.equal(rows.length, 61);
  assert.equal(nonzero.length, 11);
  assert.equal(total, 646);
  assert.deepEqual(totals, {
    querySelectorAll: 145,
    querySelector: 399,
    closest: 96,
    matches: 6
  });

  assert.deepEqual(
    nonzero.map(row => [row.file, row.total, row.querySelectorAll, row.querySelector, row.closest, row.matches]),
    [
      ['js/content_bridge.js', 246, 29, 191, 25, 1],
      ['js/content/dom_fallback.js', 161, 39, 92, 30, 0],
      ['js/tab-view.js', 68, 27, 30, 11, 0],
      ['js/layout.js', 63, 18, 42, 3, 0],
      ['js/content/block_channel.js', 39, 13, 10, 13, 3],
      ['js/content/dom_extractors.js', 27, 4, 21, 1, 1],
      ['js/popup.js', 16, 6, 4, 6, 0],
      ['js/content/collab_dialog.js', 11, 2, 6, 2, 1],
      ['js/injector.js', 6, 3, 2, 1, 0],
      ['js/ui_components.js', 6, 3, 1, 2, 0],
      ['js/content/dom_helpers.js', 3, 1, 0, 2, 0]
    ]
  );

  assert.deepEqual(selectorTargetOwnershipCounts(selectorSites()), {
    'dynamic-or-caller-owned': { sites: 147, static: 105, dynamic: 42, unique: 76 },
    'extension-ui-owned': { sites: 90, static: 90, dynamic: 0, unique: 42 },
    'filtertube-page-owned': { sites: 92, static: 74, dynamic: 18, unique: 30 },
    'generic-dom': { sites: 3, static: 3, dynamic: 0, unique: 2 },
    'legacy-layout-owned': { sites: 63, static: 63, dynamic: 0, unique: 52 },
    'youtube-dom-contract': { sites: 251, static: 244, dynamic: 7, unique: 178 }
  });

  for (const phrase of [
    '| `youtube-dom-contract` | 251 | 244 | 7 | 178 |',
    '| `dynamic-or-caller-owned` | 147 | 105 | 42 | 76 |',
    '| `filtertube-page-owned` | 92 | 74 | 18 | 30 |',
    '| `extension-ui-owned` | 90 | 90 | 0 | 42 |',
    '| `legacy-layout-owned` | 63 | 63 | 0 | 52 |',
    '| `generic-dom` | 3 | 3 | 0 | 2 |',
    'page-runtime selector sites: 493',
    'central selector authority in product source: absent',
    'selector ownership behavior-change approval: NO-GO',
    'runtime behavior changed by this addendum: no'
  ]) {
    assert.ok(read(auditDocPath).includes(phrase), `missing selector ownership phrase ${phrase}`);
  }
});

test('page runtime owns the majority of current selector call sites', () => {
  const rows = Object.fromEntries(trackedProductJs().map(file => [file, selectorCountsFor(file).total]));
  const pageRuntime = [
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/block_channel.js',
    'js/content/dom_extractors.js',
    'js/content/collab_dialog.js',
    'js/injector.js',
    'js/content/dom_helpers.js'
  ].reduce((sum, file) => sum + rows[file], 0);
  const extensionUi = [
    'js/tab-view.js',
    'js/popup.js',
    'js/ui_components.js'
  ].reduce((sum, file) => sum + rows[file], 0);

  assert.equal(pageRuntime, 493);
  assert.equal(extensionUi, 90);
  assert.equal(rows['js/layout.js'], 63);
  assert.ok(pageRuntime > extensionUi + rows['js/layout.js']);
});

test('selector inventory and renderer inventory are evidence maps rather than runtime authority', () => {
  const selectorInventory = read('docs/audit/FILTERTUBE_SELECTOR_LIFECYCLE_INVENTORY_2026-05-17.md');
  const rendererInventory = read('docs/youtube_renderer_inventory.md');
  const jsonInventory = read('docs/json_paths_encyclopedia.md');
  const audit = read(auditDocPath);

  assert.match(selectorInventory, /Generated static audit artifact/);
  assert.match(selectorInventory, /dynamic selectors and callbacks assembled across variables need follow-up manual proof/);
  assert.match(selectorInventory, /A selector row does not prove a bug/);
  assert.match(rendererInventory, /✅ Covered|✅ \*\*IMPLEMENTED\*\*/);
  assert.match(jsonInventory, /Absolute JSON Trace/);
  assert.match(audit, /They are still valuable because they tell us where to extract real fixtures/);
});

test('global card selector currently mixes surfaces before selectorAuthority exists', () => {
  const extractors = read('js/content/dom_extractors.js');
  const block = sliceBetween(extractors, 'const VIDEO_CARD_SELECTORS = [', '].join');
  const productSource = trackedProductJs()
    .filter(file => !file.startsWith('tests/'))
    .map(read)
    .join('\n');

  for (const token of [
    'ytd-rich-item-renderer',
    'ytd-watch-card-rhs-panel-video-renderer',
    'ytd-radio-renderer',
    'ytm-video-with-context-renderer',
    'ytm-compact-playlist-renderer',
    'ytk-compact-video-renderer',
    'ytk-kids-slim-owner-renderer'
  ]) {
    assert.match(block, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const token of [
    'selectorAuthority',
    'selectorEffectReport',
    'selectorTargetDecision',
    'selectorRouteSurfaceAuthority',
    'selectorRestoreAuthority'
  ]) {
    assert.doesNotMatch(productSource, new RegExp(`\\b${token}\\b`));
  }
});

test('selector authority audit names the P0 fixture wall before selector behavior changes', () => {
  const doc = read(auditDocPath);

  for (const fixture of [
    'selector_authority_global_card_selector_split_by_surface_route_action',
    'selector_authority_dom_fallback_no_rule_zero_card_scan',
    'selector_authority_quick_block_disabled_zero_selector_scan',
    'selector_authority_fallback_menu_uses_primary_menu_action_gate',
    'selector_authority_watch_selectors_do_not_target_primary_player_shell_without_policy',
    'selector_authority_members_only_badge_does_not_hide_watch_shell_without_fixture',
    'selector_authority_playlist_selected_row_preserves_current_watch_card',
    'selector_authority_kids_selectors_have_kids_surface_gate',
    'selector_authority_ytm_selectors_are_not_claimed_for_main_release_without_fixture',
    'selector_authority_legacy_layout_selectors_remain_quarantined_or_loaded_explicitly',
    'selector_authority_inventory_rows_require_runtime_source_or_fixture_status',
    'selector_authority_raw_capture_extracts_minimal_committed_dom_fixture'
  ]) {
    assert.ok(doc.includes(fixture), `missing selector fixture: ${fixture}`);
  }
});
