import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_TOP_LEVEL_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const allCallableIndexPath = 'docs/audit/FILTERTUBE_ALL_CALLABLE_INDEX_2026-05-18.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const narrowRuntimeChangeDoc = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_PREFETCH_IDENTITY_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const contentBridgeSemanticFamilyDocs = [
  'docs/audit/FILTERTUBE_BRIDGE_INJECTION_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_TOP_LEVEL_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_PREFETCH_IDENTITY_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_MAIN_WORLD_MESSAGE_DISPATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_STARTUP_TIMING_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_CONTENT_DIRECT_IDENTITY_FALLBACK_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_CONTENT_HELPER_CALLABLE_AUDIT_2026-05-18.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function contentBridgeSource() {
  return read('js/content_bridge.js');
}

function allCallableIndexContentBridgeCount() {
  const source = read(allCallableIndexPath);
  const match = source.match(/\| `js\/content_bridge\.js` \| Hot page\/background runtime \| (\d+) \| hot runtime mapped \|/);
  assert.ok(match, 'all-callable index should include current content bridge row');
  return Number(match[1]);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function duplicatePlaceholderBlocks() {
  const source = contentBridgeSource();
  const needle = "function injectCollaboratorPlaceholderMenu(newMenuList, oldMenuList, message = 'Fetching collaborators…') {";
  const firstStart = source.indexOf(needle);
  const secondStart = source.indexOf(needle, firstStart + needle.length);
  const firstEnd = source.indexOf('function getMenuContainers', firstStart + needle.length);
  const secondEnd = source.indexOf('// Debounce helper', secondStart + needle.length);

  assert.notEqual(firstStart, -1);
  assert.notEqual(secondStart, -1);
  assert.notEqual(firstEnd, -1);
  assert.notEqual(secondEnd, -1);

  const summarize = (start, end) => {
    const block = source.slice(start, end);
    const startLine = lineNumberAt(source, start);
    const markerLine = lineNumberAt(source, end);
    return {
      block,
      startLine,
      endLine: markerLine - 1,
      lineCount: markerLine - startLine,
      bytes: Buffer.byteLength(block, 'utf8'),
      hash: sha256(block)
    };
  };

  return {
    first: summarize(firstStart, firstEnd),
    second: summarize(secondStart, secondEnd)
  };
}

function topLevelFunctions() {
  const source = contentBridgeSource();
  const rows = [];
  const lines = source.split(/\r?\n/);

  lines.forEach((line, index) => {
    const match = line.match(/^(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({
        line: index + 1,
        name: match[2],
        kind: match[1] ? 'async function' : 'function'
      });
    }
  });

  return rows;
}

function groupForLine(line) {
  if (line <= 30) return 'debugStartup';
  if (line <= 410) return 'identityMetadataNormalization';
  if (line <= 945) return 'menuDropdownLifecycle';
  if (line <= 1824) return 'prefetchAndMetadataWork';
  if (line < 3506) return 'collaborationRosterState';
  if (line <= 3754) return 'statsAndMediaSideEffects';
  if (line <= 5159) return 'collaborationRendererHydration';
  if (line <= 5803) return 'mainWorldMessageBridge';
  if (line <= 6160) return 'startupDomFallbackBridge';
  if (line <= 7418) return 'fallbackMenuAndPlaylistPopover';
  if (line <= 8350) return 'ytInitialAndBackgroundResolvers';
  if (line <= 8660) return 'cardIdentityExtraction';
  if (line <= 11498) return 'menuInjectionAndActionBinding';
  return 'clickedHideAndRuleMutation';
}

test('content bridge top-level method register is audit-only and not nested callable completion', () => {
  const source = doc();
  const currentCallableCount = allCallableIndexContentBridgeCount();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.equal(currentCallableCount, 1198);
  assert.match(source, new RegExp(`lexical callable forms: ${currentCallableCount}`));
  assert.match(source, /top-level function declarations: 190/);
  assert.match(source, /unique top-level function names: 189/);
  assert.match(source, /duplicate top-level name: injectCollaboratorPlaceholderMenu at lines 599 and 7845/);
  assert.match(source, /This is not completion proof for every nested callback/);
  assert.match(source, /Duplicate Function Runtime Binding Addendum - 2026-05-29/);
  assert.match(source, /effective runtime declaration: 7845/);
  assert.match(source, /first declaration shadowed by later function declaration: yes/);
  assert.match(source, /runtime behavior changed by this addendum: no/);
  assert.match(source, /duplicate runtime-binding proof: PARTIAL/);
});

test('content bridge semantic family docs carry the method semantic proof gap blocker', () => {
  const methodGap = read(methodGapPath);

  assert.match(methodGap, /repo-wide lexical callables: 5812/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5812/);

  assert.equal(contentBridgeSemanticFamilyDocs.length, 9);
  for (const familyDocPath of contentBridgeSemanticFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5812/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5812/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    if (familyDocPath === narrowRuntimeChangeDoc) {
      assert.match(familyDoc, /runtime behavior changed: yes, duplicate right-rail timer fanout and no-op stamp reruns only/);
    } else {
      assert.match(familyDoc, /runtime behavior changed: no/);
    }
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }
});

test('content bridge top-level method register accounts for every current top-level function declaration', () => {
  const source = doc();
  const rows = topLevelFunctions();
  const uniqueNames = new Set(rows.map((row) => row.name));
  const duplicateNames = rows
    .map((row) => row.name)
    .filter((name, index, names) => names.indexOf(name) !== index);

  assert.equal(rows.length, 190);
  assert.equal(uniqueNames.size, 189);
  assert.deepEqual([...new Set(duplicateNames)], ['injectCollaboratorPlaceholderMenu']);

  for (const row of rows) {
    const group = groupForLine(row.line);
    assert.ok(
      source.includes(`| ${row.line} | \`${row.name}\` | ${row.kind} | \`${group}\` |`),
      `missing top-level method row for ${row.name} at line ${row.line}`
    );
  }
});

test('content bridge top-level method register preserves semantic group counts and future proof fields', () => {
  const source = doc();
  const rows = topLevelFunctions();
  const counts = new Map();

  for (const row of rows) {
    const group = groupForLine(row.line);
    counts.set(group, (counts.get(group) || 0) + 1);
  }

  const expectedCounts = new Map([
    ['debugStartup', 3],
    ['identityMetadataNormalization', 8],
    ['menuDropdownLifecycle', 12],
    ['prefetchAndMetadataWork', 29],
    ['collaborationRosterState', 66],
    ['statsAndMediaSideEffects', 3],
    ['collaborationRendererHydration', 20],
    ['mainWorldMessageBridge', 8],
    ['startupDomFallbackBridge', 4],
    ['fallbackMenuAndPlaylistPopover', 5],
    ['ytInitialAndBackgroundResolvers', 5],
    ['cardIdentityExtraction', 3],
    ['menuInjectionAndActionBinding', 6],
    ['clickedHideAndRuleMutation', 18]
  ]);

  assert.deepEqual(counts, expectedCounts);

  for (const [group, count] of expectedCounts) {
    assert.ok(source.includes(`| \`${group}\` | ${count} |`), `missing group count for ${group}`);
  }

  for (const field of [
    'methodName',
    'ownerFamily',
    'callerClass',
    'triggerPath',
    'routeOrSurface',
    'settingsPredicate',
    'identitySourceTier',
    'identityConfidence',
    'messageAuthority',
    'networkAuthority',
    'hideRestoreAuthority',
    'statsMediaPolicy',
    'negativeSiblingVisibleFixture',
    'rollbackOrRestoreProof'
  ]) {
    assert.ok(source.includes(field), `missing future method contract field ${field}`);
  }

  for (const auditToken of [
    'duplicate_first_placeholder_declaration',
    'duplicate_second_placeholder_declaration',
    'duplicate_early_menu_callsite',
    'duplicate_cleanup_gate',
    'e3e38a43b0bf8caaf6706e024a5c200c18f9d4ad86c5fcf296fb676ff60101b9',
    'f8db8367dfa7560e3c929a3e6f13e5865c65b73ff3b9f78f36f95bffbe6f7a2e'
  ]) {
    assert.ok(source.includes(auditToken), `missing duplicate function audit token ${auditToken}`);
  }
});

test('content bridge source still proves selected top-level method side effects', () => {
  const source = contentBridgeSource();
  const { first, second } = duplicatePlaceholderBlocks();

  assert.match(source, /window\.addEventListener\('message', handleMainWorldMessages, false\)/);
  assert.match(source, /setTimeout\(\(\) => initialize\(\), 50\)/);
  assert.match(source, /window\.postMessage\(\{\s*type: 'FilterTube_RequestCollaboratorInfo'/);
  assert.match(source, /window\.postMessage\(\{\s*type: 'FilterTube_RequestSubscriptionImport'/);
  assert.match(source, /action: 'fetchWatchIdentity'[\s\S]*type: 'fetchWatchIdentity'/);
  assert.match(source, /action: 'fetchShortsIdentity'[\s\S]*type: 'fetchShortsIdentity'/);
  assert.match(source, /type: 'addFilteredChannel'/);
  assert.match(source, /type: 'toggleChannelFilterAll'/);
  assert.match(source, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`,[\s\S]*credentials: 'same-origin'/);
  assert.match(source, /fetch\(`\/watch\?v=\$\{encodeURIComponent\(videoId\)\}`,[\s\S]*credentials: 'same-origin'/);
  assert.match(source, /fetch\(`\/shorts\/\$\{encodeURIComponent\(videoId\)\}`,[\s\S]*credentials: 'same-origin'/);
  assert.match(source, /new MutationObserver/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /setInterval/);
  assert.match(source, /style\.display = 'none'/);
  assert.match(source, /chrome\.storage\.local\.set\(payload\)/);
  assert.match(source, /media\.pause\(\)/);

  assert.deepEqual(
    {
      first: {
        startLine: first.startLine,
        endLine: first.endLine,
        lineCount: first.lineCount,
        bytes: first.bytes,
        hash: first.hash
      },
      second: {
        startLine: second.startLine,
        endLine: second.endLine,
        lineCount: second.lineCount,
        bytes: second.bytes,
        hash: second.hash
      }
    },
    {
      first: {
        startLine: 599,
        endLine: 663,
        lineCount: 65,
        bytes: 3758,
        hash: 'e3e38a43b0bf8caaf6706e024a5c200c18f9d4ad86c5fcf296fb676ff60101b9'
      },
      second: {
        startLine: 7845,
        endLine: 7900,
        lineCount: 56,
        bytes: 3142,
        hash: 'f8db8367dfa7560e3c929a3e6f13e5865c65b73ff3b9f78f36f95bffbe6f7a2e'
      }
    }
  );
  assert.ok(first.block.includes("item.setAttribute('tabindex', '0')"));
  assert.ok(first.block.includes('const isMobileMenu = Boolean('));
  assert.ok(first.block.includes("'ytm-menu-service-item-renderer'"));
  assert.ok(second.block.includes("item.setAttribute('tabindex', '-1')"));
  assert.ok(second.block.includes('firstChild?.nextSibling || null'));
  assert.ok(!second.block.includes('const isMobileMenu = Boolean('));

  const context = {};
  vm.createContext(context);
  vm.runInContext(`
    function injectCollaboratorPlaceholderMenu() { return 'first'; }
    const before = injectCollaboratorPlaceholderMenu();
    function injectCollaboratorPlaceholderMenu() { return 'second'; }
    const after = injectCollaboratorPlaceholderMenu();
    globalThis.result = { before, after };
  `, context);
  assert.equal(context.result.before, 'second');
  assert.equal(context.result.after, 'second');
});

test('runtime source lacks content bridge method semantic authority symbols', () => {
  const source = doc();
  const runtime = [
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/dom_helpers.js',
    'js/background.js',
    'js/state_manager.js'
  ].map(read).join('\n');

  for (const authority of [
    'contentBridgeMethodAuthority',
    'contentBridgeMethodEffectReport',
    'contentBridgeCallerContract',
    'contentBridgeLifecycleBudget',
    'contentBridgeIdentityConfidenceReport',
    'contentBridgeDuplicateFunctionBindingReport',
    'contentBridgeDuplicateCallableCleanupAuthority',
    'contentBridgePlaceholderMenuParityFixture'
  ]) {
    assert.ok(source.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(authority), `${authority} should not exist in runtime source yet`);
  }
});
