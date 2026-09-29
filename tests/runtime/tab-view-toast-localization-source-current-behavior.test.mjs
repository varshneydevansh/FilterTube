import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const batchPath = path.join(root, 'data/ui_locales/batches/toasts-a.json');
const batchText = fs.readFileSync(batchPath, 'utf8');
const batch = JSON.parse(batchText);
const tabView = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');
const source = tabView.split('\n').slice(0, 10000).join('\n');
const english = batch.english;
const keys = Object.keys(english);

const placeholderNames = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
  .map(match => match[1]).sort();

const decodeLiteral = value => value[0] === '"'
  ? JSON.parse(value)
  : value.slice(1, -1)
    .replace(/\\(['\\])/g, '$1')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');

const literal = String.raw`(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")`;
const fallbackByKey = new Map();
const recordFallback = (key, fallback) => {
  if (!fallbackByKey.has(key)) fallbackByKey.set(key, fallback);
};

for (const match of source.matchAll(new RegExp(String.raw`\btabViewUiText\(\s*(${literal})\s*,\s*(${literal})`, 'g'))) {
  recordFallback(decodeLiteral(match[1]), decodeLiteral(match[2]));
}
for (const match of source.matchAll(new RegExp(String.raw`\bsetTabViewLocalizedCopy\(\s*[^,]+,\s*(${literal}),\s*(${literal}),\s*(${literal})`, 'g'))) {
  recordFallback(decodeLiteral(match[2]), decodeLiteral(match[3]));
}

// Some import-enrichment controls select a key and its English fallback in
// parallel ternaries rather than passing either value as a direct literal.
const metadataToggle = new RegExp(
  String.raw`\bpaused\s*\?\s*(${literal})\s*:\s*(${literal})\s*,\s*paused\s*\?\s*(${literal})\s*:\s*(${literal})`,
  'g'
);
for (const match of source.matchAll(metadataToggle)) {
  recordFallback(decodeLiteral(match[1]), decodeLiteral(match[3]));
  recordFallback(decodeLiteral(match[2]), decodeLiteral(match[4]));
}

const metadataToggleTitle = new RegExp(
  String.raw`\bblockedReason\s*===\s*(${literal})\s*\?\s*(${literal})\s*:\s*\(\s*paused\s*\?\s*(${literal})\s*:\s*(${literal})\s*\)\s*,\s*blockedReason\s*===\s*\1\s*\?\s*(${literal})\s*:\s*\(\s*paused\s*\?\s*(${literal})\s*:\s*(${literal})\s*\)`,
  'g'
);
for (const match of source.matchAll(metadataToggleTitle)) {
  recordFallback(decodeLiteral(match[2]), decodeLiteral(match[5]));
  recordFallback(decodeLiteral(match[3]), decodeLiteral(match[6]));
  recordFallback(decodeLiteral(match[4]), decodeLiteral(match[7]));
}

for (const property of ['label', 'text', 'title']) {
  const keyProperty = `${property}Key`;
  const forward = new RegExp(String.raw`\b${property}\s*:\s*(${literal})\s*,\s*${keyProperty}\s*:\s*(${literal})`, 'g');
  const reverse = new RegExp(String.raw`\b${keyProperty}\s*:\s*(${literal})\s*,\s*${property}\s*:\s*(${literal})`, 'g');
  for (const match of source.matchAll(forward)) recordFallback(decodeLiteral(match[2]), decodeLiteral(match[1]));
  for (const match of source.matchAll(reverse)) recordFallback(decodeLiteral(match[1]), decodeLiteral(match[2]));
}
const compactLabel = new RegExp(String.raw`\blabelText\s*:\s*(${literal})\s*,\s*labelKey\s*:\s*(${literal})`, 'g');
for (const match of source.matchAll(compactLabel)) recordFallback(decodeLiteral(match[2]), decodeLiteral(match[1]));

const filterTabLabel = new RegExp(
  String.raw`\b(?:keywords|channels|content|kidsKeywords|kidsChannels|kidsContent)\s*:\s*\[\s*(${literal})\s*,\s*(${literal})\s*\]`,
  'g'
);
for (const match of source.matchAll(filterTabLabel)) recordFallback(decodeLiteral(match[1]), decodeLiteral(match[2]));

for (const match of source.matchAll(/data-ft-tabview-i18n="([^"]+)"[^>]*>([^<]*)<\/option>/g)) {
  recordFallback(match[1], match[2]);
}

test('tab-view toast/modal source batch has unique keys and matches runtime English fallbacks', () => {
  assert.deepEqual(Object.keys(batch), ['english']);
  assert.ok(english && typeof english === 'object' && !Array.isArray(english));

  const englishBlock = batchText.match(/"english"\s*:\s*\{([\s\S]*)\n\s{2}\}/)?.[1];
  assert.ok(englishBlock, 'English source batch is a flat object');
  const writtenKeys = [...englishBlock.matchAll(/^\s*"([^"]+)"\s*:/gm)].map(match => match[1]);
  assert.equal(writtenKeys.length, keys.length, 'English source keys are unique');

  for (const key of keys) {
    assert.ok(typeof english[key] === 'string' && english[key].trim(), `${key}: English fallback is present`);
    assert.ok(source.includes(key), `${key}: runtime references the source key within the owned slice`);
    assert.ok(fallbackByKey.has(key), `${key}: runtime supplies an English fallback`);
    assert.equal(english[key], fallbackByKey.get(key), `${key}: source batch matches runtime fallback`);
    assert.deepEqual(placeholderNames(english[key]), placeholderNames(fallbackByKey.get(key)), `${key}: placeholder names match`);
  }

  assert.equal(new Set(keys).size, keys.length, 'source keys are unique after parsing');
});

test('managed extra-time confirmation uses separate singular and plural titles', () => {
  const singularKey = 'family.profileManager.grantExtraMinuteTitle';
  const pluralKey = 'family.profileManager.grantExtraMinutesTitle';
  assert.match(source, /title: minutes === 1\s*\?\s*tabViewUiText\('family\.profileManager\.grantExtraMinuteTitle', 'Grant \{minutes\} extra minute\?', \{ minutes \}\)\s*:\s*tabViewUiText\('family\.profileManager\.grantExtraMinutesTitle', 'Grant \{minutes\} extra minutes\?', \{ minutes \}\)/);
  assert.notEqual(english[singularKey], english[pluralKey]);
  assert.deepEqual(placeholderNames(english[singularKey]), ['minutes']);
  assert.deepEqual(placeholderNames(english[pluralKey]), ['minutes']);
  assert.ok(!english[singularKey].includes('{suffix}') && !english[pluralKey].includes('{suffix}'));
});
