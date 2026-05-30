import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md';
const contentBridgePath = 'js/content_bridge.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
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

function groupForLine(line) {
  if (line <= 570) return 'dropdownCleanupAndFrameWait';
  if (line <= 1146) return 'prefetchObserverAndRouteHooks';
  if (line <= 1556) return 'prefetchMapWritesAndMetaRerun';
  if (line <= 3506) return 'collaborationRetryAndSelectionState';
  if (line <= 5860) return 'mainWorldRequestResponseBridge';
  if (line <= 6217) return 'domFallbackStartupAndPendingWhitelist';
  if (line <= 6778) return 'fallbackMenuButtonLifecycle';
  if (line <= 7475) return 'playlistFallbackPopoverLifecycle';
  if (line <= 8216) return 'postActionShortsPlaylistEnrichment';
  if (line <= 10566) return 'menuInjectionWaitAndLookup';
  if (line <= 11506) return 'menuItemActionHandlers';
  if (line <= 13016) return 'blockClickHideMutationFollowup';
  return 'globalBootstrap';
}

function dynamicFamily(expression) {
  if (expression === 'selector') return 'callerProvidedSelector';
  if (expression === 'linkSelectors') return 'linkSelectorConstant';
  if (expression === 'shortsSelectors' || expression === 'playlistSelectors') return 'postActionRouteSelectorConstant';
  if (expression === 'nativeMenuSelector') return 'nativeMenuSelectorConstant';
  if (expression === 'fallbackMenuCardSelector') return 'fallbackMenuCardSelectorConstant';
  if (expression.includes('VIDEO_CARD_SELECTORS')) return 'globalCardSelectorConstant';
  if (expression.includes('selectors.join')) return 'joinedSelectorArray';
  if (expression.includes('data-filtertube-video-id')) return 'runtimeVideoIdTemplate';
  if (expression.includes('data-collab-key')) return 'collaborationMenuKeyTemplate';
  if (expression.includes('data-collaboration-group-id')) return 'collaborationGroupTemplate';
  if (expression.includes('variantClass')) return 'variantClassTemplate';
  if (expression.includes('channelInfo.videoId')) return 'channelInfoVideoIdHrefTemplate';
  return 'unclassifiedDynamicSelector';
}

function contentBridgeSelectorSites() {
  const text = read(contentBridgePath);
  const starts = lineStarts(text);
  const lines = text.split('\n');
  const selectorCall = /\b(querySelectorAll|querySelector|closest|matches)\s*\(/g;
  const rows = [];
  let match;

  while ((match = selectorCall.exec(text))) {
    let argIndex = selectorCall.lastIndex;
    while (/\s/.test(text[argIndex])) argIndex += 1;
    const literal = readStringLiteral(text, argIndex);
    const isStaticLiteral = Boolean(literal && !literal.hasTemplateExpression);
    const line = lineForIndex(starts, match.index);
    const expression = isStaticLiteral ? literal.value : readArgExpression(text, argIndex);
    rows.push({
      id: `${contentBridgePath}:${match.index}:${match[1]}`,
      line,
      api: match[1],
      group: groupForLine(line),
      isStaticLiteral,
      selector: isStaticLiteral ? literal.value : null,
      expression,
      dynamicFamily: isStaticLiteral ? null : dynamicFamily(expression),
      snippet: (lines[line - 1] || '').trim()
    });
  }

  return rows.sort((a, b) => a.line - b.line || a.api.localeCompare(b.api));
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
    out[bucket] ||= { sites: 0, static: 0, dynamic: 0 };
    out[bucket].sites += 1;
    if (row.isStaticLiteral) out[bucket].static += 1;
    else out[bucket].dynamic += 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

test('content bridge selector semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/content_bridge\.js/);
  assert.match(text, /selector API sites: 246/);
  assert.match(text, /static literal args: 208/);
  assert.match(text, /dynamic\/non-literal args: 38/);
  assert.match(text, /unique static selector literals: 137/);
  assert.match(text, /semantic selector groups: 13/);
  assert.match(text, /dynamic selector families: 12/);
  assert.match(text, /not completion proof for every DOM selector/);
  assert.match(text, /not permission to broaden, prune, merge, escape, or optimize selector behavior/);
});

test('content bridge selector semantic register accounts for every current content bridge selector API site', () => {
  const rows = contentBridgeSelectorSites();
  const ids = new Set(rows.map(row => row.id));
  const staticRows = rows.filter(row => row.isStaticLiteral);
  const dynamicRows = rows.filter(row => !row.isStaticLiteral);
  const uniqueStatic = new Set(staticRows.map(row => row.selector));

  assert.equal(rows.length, 246);
  assert.equal(ids.size, rows.length, 'content bridge selector site ids must remain unique');
  assert.equal(staticRows.length, 208);
  assert.equal(dynamicRows.length, 38);
  assert.equal(uniqueStatic.size, 137);
  assert.deepEqual(countBy(rows, 'api'), {
    closest: 25,
    matches: 1,
    querySelector: 191,
    querySelectorAll: 29
  });
  assert.deepEqual(countBy(dynamicRows, 'api'), {
    querySelector: 18,
    querySelectorAll: 20
  });
});

test('content bridge selector semantic register preserves semantic group counts and future selector fields', () => {
  const rows = contentBridgeSelectorSites();
  const text = doc();
  const expectedGroups = {
    blockClickHideMutationFollowup: { sites: 21, static: 18, dynamic: 3 },
    collaborationRetryAndSelectionState: { sites: 42, static: 31, dynamic: 11 },
    domFallbackStartupAndPendingWhitelist: { sites: 4, static: 0, dynamic: 4 },
    dropdownCleanupAndFrameWait: { sites: 3, static: 2, dynamic: 1 },
    fallbackMenuButtonLifecycle: { sites: 11, static: 9, dynamic: 2 },
    globalBootstrap: { sites: 12, static: 8, dynamic: 4 },
    mainWorldRequestResponseBridge: { sites: 27, static: 21, dynamic: 6 },
    menuInjectionWaitAndLookup: { sites: 73, static: 69, dynamic: 4 },
    menuItemActionHandlers: { sites: 12, static: 12, dynamic: 0 },
    playlistFallbackPopoverLifecycle: { sites: 23, static: 21, dynamic: 2 },
    postActionShortsPlaylistEnrichment: { sites: 3, static: 3, dynamic: 0 },
    prefetchMapWritesAndMetaRerun: { sites: 3, static: 3, dynamic: 0 },
    prefetchObserverAndRouteHooks: { sites: 12, static: 11, dynamic: 1 }
  };

  assert.deepEqual(countStaticDynamic(rows, 'group'), expectedGroups);

  for (const [group, counts] of Object.entries(expectedGroups)) {
    assert.ok(
      text.includes(`| \`${group}\` | ${counts.sites} | ${counts.static} | ${counts.dynamic} |`),
      `missing group count for ${group}`
    );
  }

  for (const field of [
    'selectorSiteId',
    'selectorApi',
    'expressionKind',
    'staticLiteralOrExpression',
    'semanticGroup',
    'ownerFunction',
    'sourceTier',
    'routeOrSurface',
    'settingsPredicate',
    'listMode',
    'targetKind',
    'actionKind',
    'identitySourceTier',
    'dynamicFamily',
    'escapePolicy',
    'allowedDomRead',
    'allowedDomWrite',
    'hideTargetBoundary',
    'restoreOwner',
    'teardownOwner',
    'noRuleBudget',
    'positiveFixture',
    'negativeRouteFixture',
    'negativeSiblingVisibleFixture',
    'negativeNoRuleFixture'
  ]) {
    assert.ok(text.includes(field), `missing future selector field ${field}`);
  }
});

test('content bridge selector semantic register pins every dynamic selector expression by family', () => {
  const dynamicRows = contentBridgeSelectorSites().filter(row => !row.isStaticLiteral);
  const text = doc();

  assert.equal(dynamicRows.length, 38);
  assert.deepEqual(countBy(dynamicRows, 'dynamicFamily'), {
    callerProvidedSelector: 7,
    channelInfoVideoIdHrefTemplate: 3,
    collaborationGroupTemplate: 5,
    collaborationMenuKeyTemplate: 2,
    fallbackMenuCardSelectorConstant: 1,
    globalCardSelectorConstant: 1,
    joinedSelectorArray: 4,
    linkSelectorConstant: 3,
    nativeMenuSelectorConstant: 1,
    postActionRouteSelectorConstant: 2,
    runtimeVideoIdTemplate: 8,
    variantClassTemplate: 1
  });

  for (const row of dynamicRows) {
    assert.notEqual(row.dynamicFamily, 'unclassifiedDynamicSelector', `${row.id} must be classified`);
    assert.ok(
      text.includes(`| ${row.line} | \`${row.api}\` | \`${row.group}\` | \`${row.dynamicFamily}\` |`),
      `missing dynamic selector inventory row for ${row.id}`
    );
  }

  for (const token of [
    "typeof VIDEO_CARD_SELECTORS === 'string' ? VIDEO_CARD_SELECTORS : 'ytd-rich-item-renderer'",
    "selectors.join(',')",
    '[data-filtertube-video-id="${videoId}"]',
    'nativeMenuSelector',
    'fallbackMenuCardSelector',
    'shortsSelectors',
    'playlistSelectors',
    'channelInfo.videoId'
  ]) {
    assert.ok(text.includes(token), `missing dynamic selector token ${token}`);
  }
});

test('runtime source lacks content bridge selector semantic authority symbols', () => {
  const text = doc();
  const authorities = [
    'contentBridgeSelectorSemanticAuthority',
    'contentBridgeSelectorEffectReport',
    'contentBridgeSelectorOwnerContract',
    'contentBridgeDynamicSelectorEscapePolicy',
    'contentBridgeSelectorNoRuleBudget',
    'contentBridgeSelectorRestoreProof'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    for (const sourceFile of [
      'js/content_bridge.js',
      'js/content/block_channel.js',
      'js/content/dom_fallback.js',
      'js/background.js'
    ]) {
      assert.doesNotMatch(read(sourceFile), new RegExp(authority), `${authority} should not exist in ${sourceFile}`);
    }
  }
});
