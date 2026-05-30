import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_COLLAB_DIALOG_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/content/collab_dialog.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

function groupForMethod(name) {
  if ([
    'hasPendingCollabCards',
    'scheduleCollaboratorRefresh',
    'ensureCollabTriggerListeners',
    'removeCollabTriggerListeners',
    'ensureCollabDialogObserver',
    'disconnectCollabDialogObserver',
    'refreshCollabDialogRuntime'
  ].includes(name)) {
    return 'collabDialogRefreshAndBootLifecycle';
  }
  if ([
    'isCollabDialogTriggerTarget',
    'queuePendingDialogTrigger',
    'handlePotentialCollabTrigger',
    'handlePotentialCollabTriggerKeydown'
  ].includes(name)) {
    return 'collabDialogTriggerCaptureAndQueue';
  }
  if (name === 'resolveCollabEntryForDialog') {
    return 'collabDialogEntryResolution';
  }
  if ([
    'propagateCollaboratorsToMatchingCards',
    'applyCollaboratorsToCard'
  ].includes(name)) {
    return 'collabDialogCardMutationAndPropagation';
  }
  if ([
    'broadcastCollabDialogData',
    'extractCollaboratorsFromDialog'
  ].includes(name)) {
    return 'collabDialogBroadcastAndExtraction';
  }
  if (name === 'handleCollaborationDialog') {
    return 'collabDialogAcceptanceAndObserverDispatch';
  }
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    const fn = line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (fn) {
      rows.push({
        line: index + 1,
        kind: 'function',
        name: fn[1],
        group: groupForMethod(fn[1])
      });
    }
  });
  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countLiteral(source, token) {
  return source.split(token).length - 1;
}

function countRegex(source, regex) {
  return (source.match(regex) || []).length;
}

function sourceLineCount() {
  const source = read(sourcePath);
  return source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('collab dialog method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: current-behavior register with 2026-05-26 lazy lifecycle runtime fix/);
  assert.match(text, /source file: js\/content\/collab_dialog\.js/);
  assert.match(text, /line count: 393/);
  assert.equal(sourceLineCount(), 393);
  assert.match(text, /named function declarations in scope: 17/);
  assert.match(text, /plain function declarations: 17/);
  assert.match(text, /async function declarations: 0/);
  assert.match(text, /const helper\/callback declarations: 0/);
  assert.match(text, /arrow callback sites in scope: 9/);
  assert.match(text, /semantic method groups: 6/);
  assert.match(text, /browser\/global export: window\.collabDialogModule/);
  assert.match(text, /CommonJS export: none/);
  assert.match(text, /runtime behavior changed: yes; collaborator dialog listeners and MutationObserver are lazy/);
  assert.match(text, /not completion proof for collaborator lifecycle ownership/);
});

test('collab dialog method register accounts for every current function row', () => {
  const rows = methodRows();

  assert.equal(rows.length, 17);
  assert.deepEqual(countBy(rows, 'kind'), { function: 17 });
  assert.deepEqual(countBy(rows, 'group'), {
    collabDialogAcceptanceAndObserverDispatch: 1,
    collabDialogBroadcastAndExtraction: 2,
    collabDialogCardMutationAndPropagation: 2,
    collabDialogEntryResolution: 1,
    collabDialogRefreshAndBootLifecycle: 7,
    collabDialogTriggerCaptureAndQueue: 4
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('collab dialog method register preserves every source row', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing collab dialog method row ${row.kind}:${row.name}:${row.line}`
    );
  }
});

test('collab dialog register pins DOM lifecycle message and mutation counts', () => {
  const text = doc();
  const source = read(sourcePath);

  assert.equal(countRegex(source, /=>/g), 9);
  assert.equal(countLiteral(source, 'document'), 9);
  assert.equal(countLiteral(source, 'window'), 16);
  assert.equal(countLiteral(source, 'location'), 0);
  assert.equal(countLiteral(source, 'document.querySelector('), 0);
  assert.equal(countLiteral(source, 'document.querySelectorAll('), 1);
  assert.equal(countLiteral(source, 'querySelector('), 6);
  assert.equal(countLiteral(source, 'querySelector?.('), 1);
  assert.equal(countLiteral(source, 'querySelectorAll(') - countLiteral(source, 'document.querySelectorAll('), 1);
  assert.equal(countLiteral(source, 'closest('), 2);
  assert.equal(countLiteral(source, 'matches('), 1);
  assert.equal(countLiteral(source, 'document.createElement'), 0);
  assert.equal(countLiteral(source, 'addEventListener'), 3);
  assert.equal(countLiteral(source, 'removeEventListener'), 2);
  assert.equal(countLiteral(source, 'MutationObserver'), 1);
  assert.equal(countLiteral(source, 'observe('), 1);
  assert.equal(countLiteral(source, 'disconnect('), 0);
  assert.equal(countLiteral(source, 'setTimeout'), 2);
  assert.equal(countLiteral(source, 'clearTimeout'), 2);
  assert.equal(countLiteral(source, 'setInterval'), 0);
  assert.equal(countLiteral(source, 'clearInterval'), 0);
  assert.equal(countLiteral(source, 'requestAnimationFrame'), 0);
  assert.equal(countLiteral(source, 'cancelAnimationFrame'), 0);
  assert.equal(countLiteral(source, 'innerHTML'), 0);
  assert.equal(countLiteral(source, 'textContent'), 3);
  assert.equal(countLiteral(source, 'setAttribute'), 7);
  assert.equal(countLiteral(source, 'removeAttribute'), 4);
  assert.equal(countLiteral(source, 'appendChild'), 0);
  assert.equal(countLiteral(source, '.remove('), 0);
  assert.equal(countLiteral(source, 'postMessage'), 1);
  assert.equal(countLiteral(source, 'applyDOMFallback'), 2);
  assert.equal(countLiteral(source, 'pendingCollabCards'), 9);
  assert.equal(countLiteral(source, 'pendingCollabDialogTrigger'), 12);
  assert.equal(countLiteral(source, 'resolvedCollaboratorsByVideoId'), 2);
  assert.equal(countLiteral(source, 'refreshActiveCollaborationMenu'), 1);

  for (const token of [
    'document literal occurrences: 9',
    'window literal occurrences: 16',
    'location literal occurrences: 0',
    'document.querySelector calls: 0',
    'document.querySelectorAll calls: 1',
    'element querySelector calls: 6',
    'querySelector?. calls: 1',
    'element querySelectorAll calls: 1',
    'closest calls: 2',
    'matches calls: 1',
    'document.createElement calls: 0',
    'addEventListener calls: 3',
    'removeEventListener calls: 2',
    'MutationObserver references: 1',
    'observe calls: 1',
    'disconnect calls: 0',
    'setTimeout calls: 2',
    'clearTimeout calls: 2',
    'setInterval calls: 0',
    'clearInterval calls: 0',
    'requestAnimationFrame calls: 0',
    'cancelAnimationFrame calls: 0',
    'innerHTML references: 0',
    'textContent references: 3',
    'setAttribute calls: 7',
    'removeAttribute calls: 4',
    'appendChild calls: 0',
    'remove calls: 0',
    'postMessage calls: 1',
    'applyDOMFallback references: 2',
    'pendingCollabCards references: 9',
    'pendingCollabDialogTrigger references: 12',
    'resolvedCollaboratorsByVideoId references: 2',
    'refreshActiveCollaborationMenu references: 1',
    'window.collabDialogModule public entries: 5'
  ]) {
    assert.ok(text.includes(token), `missing collab dialog count token ${token}`);
  }
});

test('collab dialog source still proves current lifecycle mutation and message boundaries', () => {
  const text = doc();
  const source = read(sourcePath);

  for (const token of [
    "document.addEventListener('DOMContentLoaded'",
    'refreshCollabDialogRuntime();',
    'function hasPendingCollabCards()',
    "document.addEventListener('click', handlePotentialCollabTrigger, true)",
    "document.addEventListener('keydown', handlePotentialCollabTriggerKeydown, true)",
    "document.removeEventListener('click', handlePotentialCollabTrigger, true)",
    "document.removeEventListener('keydown', handlePotentialCollabTriggerKeydown, true)",
    'if (!hasPendingCollabCards()) return false;',
    'collabDialogObserver = new MutationObserver',
    'collabDialogObserver.observe(target',
    'collabDialogObserver?.disconnect?.();',
    "node.matches('tp-yt-paper-dialog')",
    "node.querySelector?.('tp-yt-paper-dialog')",
    'applyDOMFallback(null, { preserveScroll: true, forceReprocess: false })',
    'pendingCollabDialogTriggerTimeoutId = setTimeout',
    'window.pendingCollabDialogTrigger = { key, timestamp: Date.now() }',
    "entry.card.setAttribute('data-filtertube-collaborators'",
    "entry.card.setAttribute('data-filtertube-collaborators-source', 'dialog')",
    "entry.card.setAttribute('data-filtertube-collab-state', 'resolved')",
    'resolvedCollaboratorsByVideoId.set(entry.videoId',
    'refreshActiveCollaborationMenu(entry.videoId',
    'window.pendingCollabCards.delete(entry.key)',
    'refreshCollabDialogRuntime();',
    "type: 'FilterTube_CollabDialogData'",
    "source: 'collab_dialog'",
    "}, '*')",
    'window.collabDialogModule = {',
    'ensureCollabDialogObserver,',
    'ensureCollabTriggerListeners,',
    'refreshCollabDialogRuntime,',
    'scheduleCollaboratorRefresh,',
    'applyCollaboratorsToCard'
  ]) {
    assert.ok(source.includes(token), `missing current source token ${token}`);
  }

  for (const token of [
    'late readyState branch: none',
    'observer teardown path: disconnectCollabDialogObserver',
    'listener teardown path: removeCollabTriggerListeners',
    'dialog selector: tp-yt-paper-dialog',
    'dialog title selector: yt-dialog-header-view-model, h2, [role="heading"]',
    'collaborator row selector: yt-list-item-view-model',
    'card mutation path: data-filtertube-collaborators',
    'learned map mutation path: resolvedCollaboratorsByVideoId.set',
    "page message path: window.postMessage({ type: 'FilterTube_CollabDialogData', source: 'collab_dialog' }, '*')",
    'identity helper dependencies: sanitizeCollaboratorList'
  ]) {
    assert.ok(text.includes(token), `missing current behavior boundary token ${token}`);
  }

  assert.doesNotMatch(source, /document\.readyState/);
  assert.match(source, /removeEventListener/);
  assert.match(source, /disconnect\?\.\(\)/);
  assert.doesNotMatch(source, /module\.exports/);
});

test('collab dialog register preserves future proof fields', () => {
  const text = doc();

  for (const token of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'callerSurface',
    'routeSurface',
    'settingsMode',
    'listMode',
    'profileTarget',
    'compiledActiveState',
    'collaboratorRecoveryReason',
    'pendingCardKey',
    'pendingCardOwner',
    'dialogTriggerSource',
    'dialogTitleState',
    'dialogSelector',
    'collaboratorSelector',
    'identityConfidence',
    'sanitizationResult',
    'mutationAttributes',
    'learnedMapEffect',
    'menuRefreshEffect',
    'fallbackRerunEffect',
    'pageMessageType',
    'pageMessageTarget',
    'senderClass',
    'lifecyclePrimitive',
    'observerOwner',
    'listenerOwner',
    'timerOwner',
    'teardownPolicy',
    'noRuleBudget',
    'negativeFixture',
    'positiveFixture',
    'sourceFamilyProvenance'
  ]) {
    assert.ok(text.includes(token), `missing future proof field ${token}`);
  }
});

test('runtime source lacks collab dialog method authority symbols', () => {
  const runtime = productRuntimeSource();

  for (const missingAuthority of [
    'collabDialogMethodAuthority',
    'collabDialogLifecycleContract',
    'collabDialogPendingCardAuthority',
    'collabDialogMutationReport',
    'collabDialogMessageTrustContract',
    'collabDialogSelectorTargetReport',
    'collabDialogIdentityConfidenceReport',
    'collabDialogNoWorkBudget',
    'collabDialogTeardownRegistry',
    'collabDialogFixtureProvenance'
  ]) {
    assert.doesNotMatch(runtime, new RegExp(missingAuthority));
  }
});
