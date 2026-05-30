import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  assert.notEqual(startIndex, -1, `missing start marker ${start}`);
  const endIndex = text.indexOf(end, startIndex + start.length);
  assert.notEqual(endIndex, -1, `missing end marker ${end}`);
  return text.slice(startIndex, endIndex);
}

const collabDialog = read('js/content/collab_dialog.js');
const bridge = read('js/content_bridge.js');
const doc = read('docs/audit/FILTERTUBE_COLLAB_DIALOG_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-19.md');

test('collab dialog lifecycle audit documents current behavior and future gate', () => {
  assert.match(doc, /current-behavior audit artifact only/);
  assert.match(doc, /does not change\s+runtime behavior/);
  assert.match(doc, /content_bridge\.js[\s\S]*window\.pendingCollabCards/);
  assert.match(doc, /collab_dialog\.js[\s\S]*postMessages FilterTube_CollabDialogData/);
  assert.match(doc, /Required Future Gate/);
  assert.match(doc, /compiled active state requiring collaborator recovery/);
  assert.match(doc, /pending card key ownership/);
});

test('collab dialog DOMContentLoaded init now delegates through pending-card runtime gate', () => {
  const initBlock = sliceBetween(collabDialog, '// Initialize', '// Export for content_bridge.js');

  assert.match(initBlock, /document\.addEventListener\('DOMContentLoaded', \(\) => \{/);
  assert.match(initBlock, /refreshCollabDialogRuntime\(\)/);
  assert.doesNotMatch(initBlock, /ensureCollabTriggerListeners\(\)/);
  assert.doesNotMatch(initBlock, /ensureCollabDialogObserver\(\)/);
  assert.doesNotMatch(initBlock, /document\.readyState/);
  assert.doesNotMatch(initBlock, /\binteractive\b|\bcomplete\b/);
});

test('collab dialog trigger listeners are gated and removable capture listeners today', () => {
  const listenerBlock = sliceBetween(
    collabDialog,
    'function ensureCollabTriggerListeners() {',
    'function resolveCollabEntryForDialog'
  );

  assert.match(listenerBlock, /if \(collabTriggerListenersAttached\) return/);
  assert.match(listenerBlock, /document\.addEventListener\('click', handlePotentialCollabTrigger, true\)/);
  assert.match(listenerBlock, /document\.addEventListener\('keydown', handlePotentialCollabTriggerKeydown, true\)/);
  assert.match(listenerBlock, /function removeCollabTriggerListeners\(\) \{/);
  assert.match(listenerBlock, /document\.removeEventListener\('click', handlePotentialCollabTrigger, true\)/);
  assert.match(listenerBlock, /document\.removeEventListener\('keydown', handlePotentialCollabTriggerKeydown, true\)/);
});

test('collab dialog observer is pending-card gated and disconnectable today', () => {
  const observerBlock = sliceBetween(
    collabDialog,
    'function ensureCollabDialogObserver() {',
    '// Initialize'
  );

  assert.match(observerBlock, /if \(!hasPendingCollabCards\(\)\) return false/);
  assert.match(observerBlock, /if \(collabDialogObserverInitialized\) return/);
  assert.match(observerBlock, /collabDialogObserver = new MutationObserver/);
  assert.match(observerBlock, /node\.matches\('tp-yt-paper-dialog'\)/);
  assert.match(observerBlock, /node\.querySelector\?\.\('tp-yt-paper-dialog'\)/);
  assert.match(observerBlock, /const target = document\.documentElement \|\| document\.body/);
  assert.match(observerBlock, /collabDialogObserver\.observe\(target, \{/);
  assert.match(observerBlock, /childList: true/);
  assert.match(observerBlock, /subtree: true/);
  assert.match(observerBlock, /function disconnectCollabDialogObserver\(\) \{/);
  assert.match(observerBlock, /collabDialogObserver\?\.disconnect\?\.\(\)/);
  assert.match(observerBlock, /function refreshCollabDialogRuntime\(\) \{/);
  assert.match(observerBlock, /removeCollabTriggerListeners\(\)/);
  assert.match(observerBlock, /disconnectCollabDialogObserver\(\)/);
});

test('pending collaborator trigger state is split between dialog helper and content bridge', () => {
  const triggerBlock = sliceBetween(
    collabDialog,
    'function queuePendingDialogTrigger(card) {',
    'function handlePotentialCollabTrigger'
  );

  assert.match(collabDialog, /if \(!window\.pendingCollabCards\) \{/);
  assert.match(bridge, /if \(!window\.pendingCollabCards\) \{/);
  assert.match(bridge, /window\.pendingCollabCards\.set\(key, entry\)/);
  assert.match(triggerBlock, /card\.getAttribute\('data-filtertube-collab-key'\)/);
  assert.match(triggerBlock, /window\.pendingCollabCards\?\.has\(key\)/);
  assert.match(triggerBlock, /window\.pendingCollabDialogTrigger = \{ key, timestamp: Date\.now\(\) \}/);
  assert.match(triggerBlock, /setTimeout\(\(\) => \{\s*window\.pendingCollabDialogTrigger = null;\s*\}, 5000\)/);
});

test('collaboration dialog acceptance can proceed when title text is missing', () => {
  const dialogBlock = sliceBetween(
    collabDialog,
    'function handleCollaborationDialog(dialogNode) {',
    'function ensureCollabDialogObserver() {'
  );

  assert.match(dialogBlock, /const titleText = dialogNode\.querySelector\('yt-dialog-header-view-model, h2, \[role="heading"\]'\)\?\.textContent \|\| ''/);
  assert.match(dialogBlock, /if \(titleText && !COLLAB_DIALOG_TITLE_PATTERN\.test\(titleText\)\) return/);
  assert.match(dialogBlock, /const collaborators = extractCollaboratorsFromDialog\(dialogNode\)/);
  assert.match(dialogBlock, /if \(!collaborators \|\| collaborators\.length < 2\) return/);
});

test('applyCollaboratorsToCard mutates card identity state and broadcasts page messages', () => {
  const applyBlock = sliceBetween(
    collabDialog,
    'function applyCollaboratorsToCard(entry, collaborators) {',
    'function broadcastCollabDialogData'
  );
  const broadcastBlock = sliceBetween(
    collabDialog,
    'function broadcastCollabDialogData',
    'function extractCollaboratorsFromDialog'
  );

  for (const token of [
    "entry.card.setAttribute('data-filtertube-collaborators'",
    "entry.card.setAttribute('data-filtertube-collaborators-source', 'dialog')",
    "entry.card.removeAttribute('data-filtertube-collab-awaiting-dialog')",
    "entry.card.setAttribute('data-filtertube-collab-state', 'resolved')",
    "entry.card.setAttribute('data-filtertube-video-id', entry.videoId)",
    'propagateCollaboratorsToMatchingCards(entry.videoId',
    'resolvedCollaboratorsByVideoId.set(entry.videoId',
    'refreshActiveCollaborationMenu(entry.videoId',
    'window.pendingCollabCards.delete(entry.key)',
    'broadcastCollabDialogData({'
  ]) {
    assert.ok(applyBlock.includes(token), `missing side-effect token ${token}`);
  }

  assert.match(broadcastBlock, /window\.postMessage\(\{/);
  assert.match(broadcastBlock, /type: 'FilterTube_CollabDialogData'/);
  assert.match(broadcastBlock, /source: 'collab_dialog'/);
  assert.match(broadcastBlock, /\}, '\*'\)/);
});

test('collab dialog lifecycle has no central authority symbol today', () => {
  const combined = [
    collabDialog,
    bridge,
    read('js/content/block_channel.js'),
    read('js/content/dom_fallback.js')
  ].join('\n');

  assert.doesNotMatch(
    combined,
    /collabDialogLifecycleAuthority|collaboratorLifecycleAuthority|registerCollabDialogLifecycle|collabDialogActiveState/
  );
});
