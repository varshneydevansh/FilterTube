import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function source(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function productRuntimeSource() {
  return execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.mjs'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('docs/'))
    .map(source)
    .join('\n');
}

function assertFallbackReportContract(doc) {
  assert.match(doc, /Fallback Menu Action Report Contract Continuation - 2026-05-29/);
  assert.match(doc, /fallback menu action report contract rows: 12/);
  assert.match(doc, /required fallback menu action report fields: 20/);
  assert.match(doc, /implementation-ready fallback menu action rows: 0/);
  assert.match(doc, /runtime fallback menu action approvals: 0/);
  assert.match(doc, /fallback menu behavior-change approval from report contract: NO-GO/);
  assert.match(doc, /runtime behavior changed by this continuation: no/);
  assert.match(doc, /fallback scanner admits a card/);
  assert.match(doc, /flowchart TD/);

  for (const rowId of [
    'FT-FMAR-00-scope',
    'FT-FMAR-01-primary-gate-parity',
    'FT-FMAR-02-scanner-admission',
    'FT-FMAR-03-button-popover',
    'FT-FMAR-04-target-identity',
    'FT-FMAR-05-mutation-path',
    'FT-FMAR-06-optimistic-hide',
    'FT-FMAR-07-forced-refilter',
    'FT-FMAR-08-failure-rollback',
    'FT-FMAR-09-cross-feature',
    'FT-FMAR-10-fixture-packet',
    'FT-FMAR-11-artifact-gate'
  ]) {
    assert.match(doc, new RegExp(`\\| \`${rowId}\` \\|`), `missing report row ${rowId}`);
  }

  for (const field of [
    'route',
    'surface',
    'profile',
    'listMode',
    'showBlockMenuItem',
    'fallbackSurfaceClass',
    'scannerTrigger',
    'popoverOwner',
    'targetIdentity',
    'filterAllState',
    'mutationDestination',
    'optimisticHideState',
    'restoreOwner',
    'domFallbackRerunReason',
    'settingsRefreshEffect',
    'failureRollbackState',
    'negativeDisabledProof',
    'negativeWhitelistProof',
    'noWorkBudget',
    'metricArtifact'
  ]) {
    assert.match(doc, new RegExp(`\\b${field}\\b`), `missing required field ${field}`);
  }
}

test('fallback menu action gate audit documents current popover execution drift', () => {
  const doc = source('docs/audit/FILTERTUBE_FALLBACK_MENU_ACTION_GATE_CURRENT_BEHAVIOR_2026-05-19.md');

  for (const phrase of [
    'primary dropdown gate',
    'fallback scanner',
    'fallback popover',
    'performBlock',
    'addChannelDirectly',
    'handleBlockChannelClick',
    'current-gap',
    'shared menu action authority'
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assertFallbackReportContract(doc);
});

test('primary dropdown action has list-mode and showBlockMenuItem gates before injecting rows', () => {
  const text = source('js/content_bridge.js');
  const primary = sliceBetween(
    text,
    'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
    'const videoCardTagName ='
  );

  assert.match(primary, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(primary, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(primary, /clearFilterTubeMenuItems\(dropdown\)/);
  assert.match(primary, /clearMultiStepStateForDropdown\(dropdown\)/);
});

test('fallback scanner creates buttons without the primary dropdown action gate', () => {
  const text = source('js/content_bridge.js');
  const buttonFactory = sliceBetween(
    text,
    'const createFallbackButton = (card, surface) => {',
    'const ensureFallbackButtonForCard = (card, debug = null) => {'
  );
  const fallbackScanner = sliceBetween(
    text,
    'const scan = (root = document) => {',
    'let scanQueued = false;'
  );

  assert.match(buttonFactory, /openFilterTubePlaylistFallbackPopover\(btn, card\)/);
  assert.match(fallbackScanner, /isFilterTubeNativeOverlayQuietMode\(\)/);
  assert.doesNotMatch(buttonFactory, /showBlockMenuItem/);
  assert.doesNotMatch(buttonFactory, /listMode/);
  assert.doesNotMatch(fallbackScanner, /showBlockMenuItem/);
  assert.doesNotMatch(fallbackScanner, /listMode/);
});

test('fallback popover opens and builds block rows without rechecking primary menu settings', () => {
  const text = source('js/content_bridge.js');
  const popover = sliceBetween(
    text,
    'function openFilterTubePlaylistFallbackPopover(button, row) {',
    'const performBlock = async (channelInfo, filterAll) => {'
  );

  assert.match(popover, /pop\.className = 'filtertube-playlist-menu-fallback-popover'/);
  assert.match(popover, /createFallbackMenuRow/);
  assert.match(popover, /label\.textContent = 'Block'/);
  assert.match(popover, /toggleEl\.textContent = 'Filter All'/);
  assert.doesNotMatch(popover, /currentSettings\?\.showBlockMenuItem/);
  assert.doesNotMatch(popover, /currentSettings\?\.listMode/);
});

test('fallback performBlock can mutate channel rules and hide rows without local shared action authority', () => {
  const text = source('js/content_bridge.js');
  const performBlock = sliceBetween(
    text,
    'const performBlock = async (channelInfo, filterAll) => {',
    'const list = document.createElement'
  );

  assert.match(performBlock, /addChannelDirectly\(/);
  assert.match(performBlock, /handleBlockChannelClick/);
  assert.match(performBlock, /row\.style\.display = 'none'/);
  assert.match(performBlock, /row\.classList\.add\('filtertube-hidden'\)/);
  assert.match(performBlock, /row\.setAttribute\('data-filtertube-hidden', 'true'\)/);
  assert.match(performBlock, /applyDOMFallback\(null, \{ forceReprocess: true, preserveScroll: true \}\)/);
  assert.doesNotMatch(performBlock, /currentSettings\?\.showBlockMenuItem/);
  assert.doesNotMatch(performBlock, /currentSettings\?\.listMode/);
});

test('fallback menu action future authority symbols remain absent from product runtime', () => {
  const doc = source('docs/audit/FILTERTUBE_FALLBACK_MENU_ACTION_GATE_CURRENT_BEHAVIOR_2026-05-19.md');
  const runtime = productRuntimeSource();

  for (const symbol of [
    'fallbackMenuActionReportContract',
    'fallbackMenuActionReportApproval',
    'fallbackMenuScannerGateParityReport',
    'fallbackMenuOptimisticHideRollbackReport',
    'fallbackMenuNegativeFixturePacket',
    'fallbackMenuDomFallbackRerunBudget',
    'fallbackMenuMetricArtifact'
  ]) {
    assert.match(doc, new RegExp(`\\\`${symbol}\\\``));
    assert.doesNotMatch(runtime, new RegExp(symbol));
  }
});
