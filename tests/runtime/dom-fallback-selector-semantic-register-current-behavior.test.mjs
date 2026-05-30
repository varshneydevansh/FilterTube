import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_DOM_FALLBACK_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md';
const sourceFiles = [
  'js/content/dom_fallback.js',
  'js/content/dom_helpers.js'
];

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

function semanticGroup(file, line) {
  if (file === 'js/content/dom_helpers.js') return 'helperVisualWriters';
  if (line <= 780) return 'mixPlaylistAndWatchIdentitySelectors';
  if (line <= 940) return 'currentWatchOwnerAndPlayerControlSelectors';
  if (line <= 1430) return 'styleAndMobileOpenAppCleanupSelectors';
  if (line <= 1888) return 'commentFallbackSelectors';
  if (line <= 1935) return 'guideSubscriptionFallbackSelectors';
  if (line <= 2310) return 'staleRestoreAndBroadControlSelectors';
  if (line <= 3655) return 'mainCardIdentityAndTargetSelectors';
  if (line <= 3820) return 'pendingWhitelistAndMetadataSelectors';
  if (line <= 4310) return 'surveyChipAndShortsSelectors';
  return 'shelfGridPlaylistGuardSelectors';
}

function dynamicFamily(expression) {
  if (expression === 'childSelector') return 'callerProvidedChildSelector';
  if (expression.startsWith('[') && expression.includes('ytm-comment-section-renderer')) return 'commentEntryCandidateArray';
  if (expression === 'homeFeedSelectors') return 'homeFeedSelectorArray';
  if (expression === 'hiddenSelector') return 'staleHiddenSelectorArgument';
  if (expression.includes('VIDEO_CARD_SELECTORS') && expression.includes('filtertube-whitelist-pending')) return 'videoCardPendingTemplate';
  if (expression === 'VIDEO_CARD_SELECTORS') return 'globalVideoCardSelectorConstant';
  if (expression === 'shortsContainerSelectors') return 'shortsContainerSelectorArray';
  if (expression.startsWith('[') && expression.includes('ytm-pivot-bar-renderer')) return 'mobileShortsNavSelectorArray';
  if (expression === 'disguisedShortsSelectors') return 'disguisedShortsSelectorArray';
  if (expression === 'sel') return 'iteratedLinkSelectorCandidate';
  if (expression === 'shortsSelectors') return 'shortsSelectorArray';
  if (expression === 'selector') return 'iteratedShortsSelectorCandidate';
  return 'unclassifiedDynamicSelector';
}

function selectorSites() {
  const rows = [];
  const selectorCall = /\b(querySelectorAll|querySelector|closest|matches)\s*\(/g;

  for (const file of sourceFiles) {
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
      const expression = isStaticLiteral ? literal.value : readArgExpression(text, argIndex);
      rows.push({
        id: `${file}:${match.index}:${match[1]}`,
        file,
        line,
        api: match[1],
        isStaticLiteral,
        selector: isStaticLiteral ? literal.value : null,
        expression,
        group: semanticGroup(file, line),
        dynamicFamily: isStaticLiteral ? null : dynamicFamily(expression),
        snippet: (lines[line - 1] || '').trim()
      });
    }
  }

  return rows.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.api.localeCompare(b.api));
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

test('DOM fallback selector semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source files: js\/content\/dom_fallback\.js, js\/content\/dom_helpers\.js/);
  assert.match(text, /selector API sites: 164/);
  assert.match(text, /static literal args: 152/);
  assert.match(text, /dynamic\/non-literal args: 12/);
  assert.match(text, /unique static selector literals: 120/);
  assert.match(text, /semantic selector groups: 11/);
  assert.match(text, /dynamic selector families: 12/);
  assert.match(text, /not completion proof for every\s+DOM selector/);
  assert.match(text, /not permission to broaden, prune, merge, escape, or\s+optimize selector behavior/);
});

test('DOM fallback selector semantic register accounts for every current selector API site', () => {
  const rows = selectorSites();
  const ids = new Set(rows.map(row => row.id));
  const staticRows = rows.filter(row => row.isStaticLiteral);
  const dynamicRows = rows.filter(row => !row.isStaticLiteral);
  const uniqueStatic = new Set(staticRows.map(row => row.selector));

  assert.equal(rows.length, 164);
  assert.equal(ids.size, rows.length, 'DOM fallback/helper selector site ids must remain unique');
  assert.equal(staticRows.length, 152);
  assert.equal(dynamicRows.length, 12);
  assert.equal(uniqueStatic.size, 120);
  assert.deepEqual(countBy(rows, 'api'), {
    closest: 32,
    querySelector: 92,
    querySelectorAll: 40
  });
  assert.deepEqual(countStaticDynamic(rows, 'file'), {
    'js/content/dom_fallback.js': { sites: 161, static: 150, dynamic: 11 },
    'js/content/dom_helpers.js': { sites: 3, static: 2, dynamic: 1 }
  });
});

test('DOM fallback selector semantic register preserves semantic group counts and future selector fields', () => {
  const rows = selectorSites();
  const text = doc();
  const expectedGroups = {
    commentFallbackSelectors: { sites: 18, static: 16, dynamic: 2 },
    currentWatchOwnerAndPlayerControlSelectors: { sites: 6, static: 6, dynamic: 0 },
    guideSubscriptionFallbackSelectors: { sites: 4, static: 4, dynamic: 0 },
    helperVisualWriters: { sites: 3, static: 2, dynamic: 1 },
    mainCardIdentityAndTargetSelectors: { sites: 59, static: 57, dynamic: 2 },
    mixPlaylistAndWatchIdentitySelectors: { sites: 12, static: 12, dynamic: 0 },
    pendingWhitelistAndMetadataSelectors: { sites: 1, static: 1, dynamic: 0 },
    shelfGridPlaylistGuardSelectors: { sites: 11, static: 11, dynamic: 0 },
    staleRestoreAndBroadControlSelectors: { sites: 27, static: 26, dynamic: 1 },
    styleAndMobileOpenAppCleanupSelectors: { sites: 2, static: 2, dynamic: 0 },
    surveyChipAndShortsSelectors: { sites: 21, static: 15, dynamic: 6 }
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

test('DOM fallback selector semantic register pins every dynamic selector expression by family', () => {
  const dynamicRows = selectorSites().filter(row => !row.isStaticLiteral);
  const text = doc();

  assert.equal(dynamicRows.length, 12);
  assert.deepEqual(countBy(dynamicRows, 'dynamicFamily'), {
    callerProvidedChildSelector: 1,
    commentEntryCandidateArray: 1,
    disguisedShortsSelectorArray: 1,
    globalVideoCardSelectorConstant: 1,
    homeFeedSelectorArray: 1,
    iteratedLinkSelectorCandidate: 1,
    iteratedShortsSelectorCandidate: 1,
    mobileShortsNavSelectorArray: 1,
    shortsContainerSelectorArray: 1,
    shortsSelectorArray: 1,
    staleHiddenSelectorArgument: 1,
    videoCardPendingTemplate: 1
  });

  for (const row of dynamicRows) {
    assert.notEqual(row.dynamicFamily, 'unclassifiedDynamicSelector', `${row.id} must be classified`);
    assert.ok(
      text.includes(`| \`${row.file}\` | ${row.line} | \`${row.api}\` | \`${row.group}\` | \`${row.dynamicFamily}\` |`),
      `missing dynamic selector inventory row for ${row.id}`
    );
  }

  for (const token of [
    'homeFeedSelectors',
    'hiddenSelector',
    'VIDEO_CARD_SELECTORS',
    'shortsContainerSelectors',
    'disguisedShortsSelectors',
    'shortsSelectors',
    'childSelector',
    'ytm-comment-section-renderer',
    'ytm-pivot-bar-renderer'
  ]) {
    assert.ok(text.includes(token), `missing dynamic selector token ${token}`);
  }
});

test('DOM fallback selector semantic register source-backs the current risk boundaries', () => {
  const text = doc();
  const fallback = read('js/content/dom_fallback.js');
  const helpers = read('js/content/dom_helpers.js');

  assert.match(text, /whitelist-pending template restricts a rerun to marked cards/);
  assert.match(fallback, /document\.querySelectorAll\(`\$\{VIDEO_CARD_SELECTORS\}\[data-filtertube-whitelist-pending="true"\]`\)/);
  assert.match(fallback, /document\.querySelectorAll\(VIDEO_CARD_SELECTORS\)/);

  assert.match(text, /`hiddenSelector` cleanup restores markers by source-local selector strings/);
  assert.match(fallback, /const hidden = document\.querySelectorAll\(hiddenSelector\)/);

  assert.match(text, /Comment selectors separate containers, threads, root comments, view models/);
  assert.match(fallback, /ytd-comment-thread-renderer, ytm-comment-thread-renderer/);
  assert.match(fallback, /ytd-comment-view-model, ytm-comment-view-model/);

  assert.match(text, /Members-only, playlist, Mix, Shorts, chip, survey, shelf, and grid selectors/);
  assert.match(fallback, /yt-chip-cloud-chip-renderer/);
  assert.match(fallback, /ytd-inline-survey-renderer/);
  assert.match(fallback, /ytd-shelf-renderer, ytd-rich-shelf-renderer/);

  assert.match(text, /`childSelector` in `updateContainerVisibility\(\)` remains caller-provided/);
  assert.match(helpers, /const children = container\.querySelectorAll\(childSelector\)/);
});

test('runtime source lacks DOM fallback selector semantic authority symbols', () => {
  const text = doc();
  const authorities = [
    'domFallbackSelectorSemanticAuthority',
    'domFallbackSelectorEffectReport',
    'domFallbackSelectorOwnerContract',
    'domFallbackDynamicSelectorEscapePolicy',
    'domFallbackSelectorNoRuleBudget',
    'domFallbackSelectorRestoreProof',
    'domFallbackSiblingVisibleFixtureReport',
    'domHelperSelectorInputContract'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    for (const sourceFile of [
      'js/content/dom_fallback.js',
      'js/content/dom_helpers.js',
      'js/content_bridge.js',
      'js/background.js'
    ]) {
      assert.doesNotMatch(read(sourceFile), new RegExp(authority), `${authority} should not exist in ${sourceFile}`);
    }
  }
});
