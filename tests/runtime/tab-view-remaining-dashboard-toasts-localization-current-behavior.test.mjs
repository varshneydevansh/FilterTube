import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const batchText = fs.readFileSync(path.join(root, 'data/ui_locales/batches/remaining-dashboard-toasts.json'), 'utf8');
const batch = JSON.parse(batchText);
const source = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');
const english = batch.english;
const keys = Object.keys(english);

const placeholderNames = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
  .map(match => match[1]).sort();

const literal = String.raw`(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")`;
const decodeLiteral = value => value[0] === '"'
  ? JSON.parse(value)
  : value.slice(1, -1)
    .replace(/\\(['\\])/g, '$1')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');

const fallbacksByKey = new Map();
for (const match of source.matchAll(new RegExp(String.raw`\btabViewUiText\(\s*(${literal})\s*,\s*(${literal})`, 'g'))) {
  const key = decodeLiteral(match[1]);
  const fallback = decodeLiteral(match[2]);
  const fallbacks = fallbacksByKey.get(key) || new Set();
  fallbacks.add(fallback);
  fallbacksByKey.set(key, fallbacks);
}

test('remaining dashboard-toast English batch matches tab-view runtime fallbacks', () => {
  assert.ok(Object.keys(batch).every(key => ['english', 'translations'].includes(key)));
  assert.ok(english && typeof english === 'object' && !Array.isArray(english));

  const englishBlock = batchText.match(/"english"\s*:\s*\{([\s\S]*?)\n\s{2}\}/)?.[1];
  assert.ok(englishBlock, 'English source batch is a flat object');
  const writtenKeys = [...englishBlock.matchAll(/^\s*"([^"]+)"\s*:/gm)].map(match => match[1]);
  assert.equal(writtenKeys.length, keys.length, 'English source keys are unique');

  for (const key of keys) {
    assert.ok(english[key].trim(), `${key}: English source is present`);
    assert.ok(source.includes(key), `${key}: runtime references the source key`);
    assert.deepEqual(fallbacksByKey.get(key), new Set([english[key]]), `${key}: source matches the runtime fallback`);
    assert.deepEqual(placeholderNames(english[key]), placeholderNames([...fallbacksByKey.get(key)][0]), `${key}: placeholder names match`);
  }
});

test('owned toast call sites use keyed copy and leave V3 backup status untouched', () => {
  const backupImportStatusText = source.indexOf('`${importStatus}. ${metadataNotice}`');
  const backupImportStatusToast = source.lastIndexOf('UIComponents.showToast(', backupImportStatusText);
  assert.ok(backupImportStatusText >= 0 && backupImportStatusToast >= 0, 'the already-wired V3 backup status toast is present');

  const rawToastStarts = [];
  const familyStart = source.indexOf('const FAMILY_DEVICE_MAP_COPY = Object.freeze({');
  const familyEnd = source.indexOf('function renderNanahDeliveryPathStrip', familyStart);
  assert.ok(familyStart >= 0 && familyEnd > familyStart);
  const matcher = /UIComponents\.showToast\(\s*(['"`])/g;
  for (const match of source.matchAll(matcher)) {
    const line = source.slice(0, match.index).split('\n').length;
    const inFamilyDeviceOwnerRange = match.index >= familyStart && match.index < familyEnd;
    const isV3BackupStatusToast = match.index === backupImportStatusToast;
    if (line > 10000 && !inFamilyDeviceOwnerRange && !isV3BackupStatusToast) rawToastStarts.push(line);
  }
  assert.deepEqual(rawToastStarts, [], 'no unkeyed string/template starts remain in the owned toast ranges');
});

test('available toast translations preserve placeholders and product names without claiming all locales', () => {
  assert.ok(batch.translations?.ru, 'Russian draft is present');
  for (const [locale, values] of Object.entries(batch.translations || {})) {
    assert.equal(values.length, keys.length, `${locale}: exact message count`);
    keys.forEach((key, index) => {
      assert.ok(typeof values[index] === 'string' && values[index].trim());
      assert.deepEqual(placeholderNames(values[index]), placeholderNames(english[key]), `${locale}: ${key}`);
      for (const name of ['FilterTube', 'Home Pickup', 'Internet Pickup', 'Nanah']) {
        if (english[key].includes(name)) assert.ok(values[index].includes(name), `${locale}: preserves ${name}`);
      }
    });
  }
});

test('error details retain precedence over localized toast fallbacks', () => {
  assert.match(source, /UIComponents\.showToast\(error\?\.message \|\| tabViewUiText\('dashboard\.sync\.toast\.nanahSessionFailed', 'Nanah session failed'\), 'error'\)/);
  assert.match(source, /UIComponents\.showToast\(result\.error \|\| tabViewUiText\('dashboard\.importEnrichment\.updateMetadataCompletionFailed', 'Could not update metadata completion'\), 'error'\)/);
});

test('saved-update confirmation uses explicit singular and plural copy', () => {
  const branches = [
    ['dashboard.sync.toast.savedUpdatesEnabledForOneDevice', 'Saved updates enabled for {count} verified device'],
    ['dashboard.sync.toast.savedUpdatesEnabledForManyDevices', 'Saved updates enabled for {count} verified devices'],
    ['dashboard.sync.toast.savedUpdatesDisabledForOneDevice', 'Saved updates disabled for {count} verified device'],
    ['dashboard.sync.toast.savedUpdatesDisabledForManyDevices', 'Saved updates disabled for {count} verified devices']
  ];
  for (const [key, fallback] of branches) {
    assert.equal(english[key], fallback);
    assert.deepEqual(placeholderNames(fallback), ['count']);
    assert.ok(source.includes(`'${key}'`));
  }
});
