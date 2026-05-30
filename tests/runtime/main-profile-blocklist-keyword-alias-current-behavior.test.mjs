import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

test('background compiles main blocklist keywords from the visible StateManager field before the alias field', () => {
  const background = read('js/background.js');
  const block = sliceBetween(
    background,
    'const v4KeywordEntries = shouldUseKidsProfile',
    'const storedProfilesV3'
  );

  assert.match(block, /const mainKeywords = Array\.isArray\(activeMain\.keywords\)/);
  assert.ok(
    block.indexOf('activeMain.keywords') < block.indexOf('activeMain.blockedKeywords'),
    'main.keywords must win over stale or empty main.blockedKeywords'
  );
  assert.match(block, /`blockedKeywords` is kept as a migration\/schema alias/);
});

test('settings save keeps the main blocklist alias in sync while blocklist mode is active', () => {
  const shared = read('js/settings_shared.js');
  const block = sliceBetween(
    shared,
    'const existingMain = safeObject(activeProfile.main);',
    'profiles[activeId] = {'
  );

  assert.match(block, /const mainMode = existingMain\.mode === 'whitelist' \? 'whitelist' : 'blocklist';/);
  assert.match(block, /keywords: sanitizedKeywords/);
  assert.match(block, /if \(mainMode === 'blocklist'\) \{/);
  assert.match(block, /nextMainProfile\.blockedKeywords = sanitizedKeywords;/);
});

test('mode switches clear or rehydrate the main blocklist alias with the canonical keyword list', () => {
  const background = read('js/background.js');
  const toWhitelist = sliceBetween(
    background,
    'const blockedChannels = Array.isArray(nextMain.channels)',
    'if (requestedMode === \'whitelist\')'
  );

  assert.match(toWhitelist, /Array\.isArray\(nextMain\.blockedKeywords\)/);
  assert.match(toWhitelist, /nextMain\.blockedKeywords = \[\];/);
  assert.match(background, /const blockedKeywords = Array\.isArray\(nextMain\.keywords\)[\s\S]*Array\.isArray\(nextMain\.blockedKeywords\)/);
  assert.match(background, /nextMain\.blockedKeywords = nextMain\.keywords;/);
});
