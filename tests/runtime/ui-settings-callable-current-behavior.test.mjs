import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = path.join(repoRoot, 'docs/audit/FILTERTUBE_UI_SETTINGS_CALLABLE_AUDIT_2026-05-18.md');
const auditDoc = fs.readFileSync(auditDocPath, 'utf8');

const uiSettingsFiles = [
  'js/content_controls_catalog.js',
  'js/io_manager.js',
  'js/nanah_sync_adapter.js',
  'js/popup.js',
  'js/render_engine.js',
  'js/security_manager.js',
  'js/settings_shared.js',
  'js/state_manager.js',
  'js/tab-view.js',
  'js/ui_components.js'
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
  assert.ok(row, `${file} should have a scope row in UI/settings callable audit`);
  return Number(row[1]);
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

test('UI/settings callable audit accounts for every current UI settings source file', () => {
  let total = 0;
  for (const file of uiSettingsFiles) {
    const actual = countLexicalCallables(file);
    const documented = docRowCount(file);
    total += actual;
    assert.equal(documented, actual, `${file} documented callable count should match current source`);
  }

  assert.equal(total, 624);
  assert.match(auditDoc, /Total first-pass UI\/settings lexical callables: 624\./);
  assert.match(auditDoc, /This is not complete behavioral proof for every UI method yet/);
});

test('UI/settings callable audit documents each public exported surface', () => {
  const exportedSurfaces = [
    ['FilterTubeSettings', 'js/settings_shared.js'],
    ['FilterTubeIO', 'js/io_manager.js'],
    ['FilterTubeNanahAdapter', 'js/nanah_sync_adapter.js'],
    ['FilterTubeSecurity', 'js/security_manager.js'],
    ['StateManager', 'js/state_manager.js'],
    ['RenderEngine', 'js/render_engine.js'],
    ['UIComponents', 'js/ui_components.js'],
    ['FilterTubeContentControlsCatalog', 'js/content_controls_catalog.js']
  ];

  for (const [surface, file] of exportedSurfaces) {
    assert.match(
      auditDoc,
      new RegExp('\\| `' + surface + '` \\| `' + file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':[0-9]+`')
    );
    assert.match(source(file), new RegExp(surface.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('UI/settings callable audit pins high-risk mutation and lifecycle patterns to current source', () => {
  const stateManager = source('js/state_manager.js');
  const ioManager = source('js/io_manager.js');
  const nanahAdapter = source('js/nanah_sync_adapter.js');
  const renderEngine = source('js/render_engine.js');
  const popup = source('js/popup.js');
  const tabView = source('js/tab-view.js');

  assert.match(sliceBetween(stateManager, 'async function saveSettings', 'async function ensureLoaded'), /if \(isSaving\) return;/);
  assert.match(sliceBetween(stateManager, 'function broadcastSettings', 'async function requestRefresh'), /action: 'FilterTube_ApplySettings'/);
  assert.match(sliceBetween(stateManager, 'async function persistMainProfiles', 'async function persistKidsProfiles'), /console\.warn\('StateManager: Failed to persist main profiles \(v4\)'/);
  assert.match(sliceBetween(stateManager, 'async function persistKidsProfiles', '/**\n     * Broadcast settings'), /console\.warn\('StateManager: Failed to persist kids profiles'/);

  assert.match(sliceBetween(ioManager, 'async function loadProfilesV4', 'async function saveProfilesV4'), /await writeStorage\(\{ \[FT_PROFILES_V4_KEY\]:/);
  assert.match(sliceBetween(ioManager, 'async function importV3', 'async function exportV3Encrypted'), /await SettingsAPI\.saveSettings|await saveProfilesV4|await writeStorage\(nanahPayload\)/);

  assert.match(sliceBetween(nanahAdapter, 'async function applyScopedPortablePayload', 'function generateId'), /await io\.saveProfilesV4/);
  assert.match(sliceBetween(renderEngine, 'function createFallbackExactToggle', 'function createFallbackDeleteButton'), /StateManager\?\.toggleKidsKeywordExact|StateManager\?\.toggleKeywordExact/);

  assert.match(popup, /action: 'FilterTube_SetListMode'/);
  assert.match(tabView, /action: 'FilterTube_SetListMode'/);
  assert.match(tabView, /dashboardStatsRotationTimer = setInterval/);
});
