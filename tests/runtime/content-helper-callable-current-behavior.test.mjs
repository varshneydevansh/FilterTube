import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = path.join(repoRoot, 'docs/audit/FILTERTUBE_CONTENT_HELPER_CALLABLE_AUDIT_2026-05-18.md');
const auditDoc = fs.readFileSync(auditDocPath, 'utf8');

const contentHelperFiles = [
  'js/content/bridge_injection.js',
  'js/content/collab_dialog.js',
  'js/content/dom_extractors.js',
  'js/content/dom_helpers.js',
  'js/content/first_run_prompt.js',
  'js/content/handle_resolver.js',
  'js/content/menu.js',
  'js/content/release_notes_prompt.js',
  'js/shared/identity.js'
];

const functionRe = /(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>/g;

function source(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function countLexicalCallables(file) {
  const text = source(file);
  const names = [];
  let match;
  while ((match = functionRe.exec(text))) {
    names.push(match[1] || match[2] || match[3]);
  }
  functionRe.lastIndex = 0;
  return names.length;
}

function docRowCount(file) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const row = auditDoc.match(new RegExp('\\| `' + escaped + '` \\| (\\d+) \\|'));
  assert.ok(row, `${file} should have a scope row in content-helper callable audit`);
  return Number(row[1]);
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

test('content-helper callable audit accounts for every current content helper source file', () => {
  let total = 0;
  for (const file of contentHelperFiles) {
    const actual = countLexicalCallables(file);
    const documented = docRowCount(file);
    total += actual;
    assert.equal(documented, actual, `${file} documented callable count should match current source`);
  }

  assert.equal(total, 92);
  assert.match(auditDoc, /Total first-pass content-helper lexical callables: 92\./);
  assert.match(auditDoc, /does not prove every user-visible workflow/);
});

test('content-helper callable audit documents each public and global surface', () => {
  const expectedSurfaces = [
    ['injectMainWorldScripts', 'js/content/bridge_injection.js'],
    ['window.collabDialogModule', 'js/content/collab_dialog.js'],
    ['DOM extractor globals', 'js/content/dom_extractors.js'],
    ['DOM hide helpers', 'js/content/dom_helpers.js'],
    ['Handle resolver helpers', 'js/content/handle_resolver.js'],
    ['Prompt scripts', 'js/content/first_run_prompt.js'],
    ['Menu style helper', 'js/content/menu.js'],
    ['FilterTubeIdentity', 'js/shared/identity.js']
  ];

  for (const [surface, file] of expectedSurfaces) {
    assert.match(auditDoc, new RegExp(surface.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(auditDoc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':[0-9]+'));
  }

  assert.match(source('js/content/bridge_injection.js'), /globalThis\.injectMainWorldScripts/);
  assert.match(source('js/content/collab_dialog.js'), /window\.collabDialogModule/);
  assert.match(source('js/shared/identity.js'), /root\.FilterTubeIdentity = Object\.assign/);
});

test('content-helper callable audit pins high-risk bridge, selector, cache, and UI side effects', () => {
  const contentBridge = source('js/content_bridge.js');
  const bridgeInjection = source('js/content/bridge_injection.js');
  const collabDialog = source('js/content/collab_dialog.js');
  const domExtractors = source('js/content/dom_extractors.js');
  const domHelpers = source('js/content/dom_helpers.js');
  const handleResolver = source('js/content/handle_resolver.js');
  const menu = source('js/content/menu.js');
  const firstRunPrompt = source('js/content/first_run_prompt.js');
  const releaseNotesPrompt = source('js/content/release_notes_prompt.js');
  const identity = source('js/shared/identity.js');

  assert.match(sliceBetween(contentBridge, 'function handleMainWorldMessages', 'async function initialize'), /event\.data\?\.type\?\.startsWith\('FilterTube_'\)/);
  assert.match(sliceBetween(contentBridge, 'function handleMainWorldMessages', 'async function initialize'), /FilterTube_UpdateVideoChannelMap|FilterTube_CollabDialogData/);

  assert.match(sliceBetween(bridgeInjection, 'globalThis.injectMainWorldScripts', '})();'), /setTimeout\(\(\) => \{/);
  assert.match(sliceBetween(collabDialog, 'function ensureCollabTriggerListeners', 'function resolveCollabEntryForDialog'), /document\.addEventListener\('click'/);
  assert.match(sliceBetween(collabDialog, 'function ensureCollabDialogObserver', '// Initialize'), /new MutationObserver/);
  assert.match(sliceBetween(collabDialog, '// Initialize', '// Export for content_bridge.js'), /document\.addEventListener\('DOMContentLoaded'/);
  assert.match(sliceBetween(collabDialog, 'function broadcastCollabDialogData', 'function extractCollaboratorsFromDialog'), /window\.postMessage/);

  assert.match(sliceBetween(domExtractors, 'const VIDEO_CARD_SELECTORS', 'function ensureVideoIdForCard'), /ytm-video-with-context-renderer/);
  assert.match(sliceBetween(domExtractors, 'function extractChannelMetadataFromElement', 'function clearCachedChannelMetadata'), /cachedId/);
  assert.match(sliceBetween(domExtractors, 'function extractChannelMetadataFromElement', 'function clearCachedChannelMetadata'), /innerText/);
  assert.match(sliceBetween(domExtractors, 'function extractChannelMetadataFromElement', 'function clearCachedChannelMetadata'), /setAttribute\('data-filtertube-channel-id'/);

  assert.match(sliceBetween(domHelpers, 'function ensureStyles', 'function toggleVisibility'), /\.filtertube-hidden \{ display: none !important; \}/);
  assert.match(sliceBetween(domHelpers, 'function toggleVisibility', 'function updateContainerVisibility'), /filteringTracker\.recordHide|incrementHiddenStats|handleMediaPlayback/);
  assert.match(sliceBetween(domHelpers, 'function updateContainerVisibility', '    // Check if all children are hidden'), /data-filtertube-container-had-children|filtertube-hidden-shelf/);

  assert.match(sliceBetween(handleResolver, 'const resolvedHandleCache', 'async function fetchIdForHandle'), /setTimeout\(\(\) => \{/);
  assert.match(handleResolver, /browserAPI_BRIDGE\.storage\.local\.get\(\['channelMap'\]\)/);
  assert.match(handleResolver, /resolvedHandleCache\.set\(cleanHandle, 'PENDING'\)/);
  assert.match(sliceBetween(handleResolver, 'if (backgroundOnly)', 'const encodedHandle'), /fetchChannelDetails/);
  assert.match(sliceBetween(handleResolver, 'if (backgroundOnly)', 'const encodedHandle'), /window\.postMessage/);
  assert.match(sliceBetween(handleResolver, 'const handlePaths = [', 'const text = await response.text'), /credentials: 'same-origin'/);
  assert.match(handleResolver, /FilterTube_UpdateChannelMap/);

  assert.match(sliceBetween(menu, 'function ensureFilterTubeMenuStyles', 'const styleTag'), /ytd-menu-popup-renderer/);
  assert.match(firstRunPrompt, /zIndex = '2147483647'/);
  assert.match(releaseNotesPrompt, /zIndex = '2147483646'/);

  assert.match(sliceBetween(identity, 'function channelMetaMatchesIndex', '/**\n     * Core matching primitive'), /nameOnlyNames|stableNames/);
  assert.match(sliceBetween(identity, 'function fastExtractIdentityFromHtmlChunk', 'function assignCanonicalPathIdentity'), /htmlChunk\.match/);
});
