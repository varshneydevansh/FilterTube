import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');
const batch = JSON.parse(fs.readFileSync(
  path.join(root, 'data/ui_locales/batches/remaining-dashboard-actions.json'),
  'utf8'
));
const english = batch.english;
const flowStart = source.indexOf('async function runExportV3() {');
const flowEnd = source.indexOf('\n    if (ftImportSyncDeviceBtn) {', flowStart);
assert.ok(flowStart >= 0 && flowEnd > flowStart, 'V3 backup export/import flow is available');
const flow = source.slice(flowStart, flowEnd);

test('backup master PIN placeholder agrees with the shared profile-access translation in every locale', () => {
  const targets = JSON.parse(fs.readFileSync('data/ui_locales/targets.json', 'utf8')).locales;
  for (const { code } of targets) {
    const catalog = JSON.parse(fs.readFileSync(`data/ui_locales/${code}.json`, 'utf8'));
    assert.equal(catalog['dashboard.backup.prompt.masterPin.placeholder'], catalog['profileAccess.masterPinPlaceholder'], code);
  }
});

function placeholders(value) {
  return [...new Set([...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
    .map(match => match[1]))].sort();
}

test('backup action English batch contains exactly the source keys used by the V3 flow', () => {
  assert.equal(batch.translations, undefined, 'locale translations stay in a separate draft');
  const keys = Object.keys(english);
  assert.ok(keys.length > 0);
  assert.ok(keys.every(key => key.startsWith('dashboard.backup.')));

  const referencedKeys = [...new Set([
    ...flow.matchAll(/['"](dashboard\.backup\.[^'"]+)['"]/g)
  ].map(match => match[1]))].sort();
  assert.deepEqual(keys.slice().sort(), referencedKeys);

  for (const [key, fallback] of Object.entries(english)) {
    assert.ok(typeof fallback === 'string' && fallback.trim(), key + ': nonempty English fallback');
    assert.doesNotMatch(fallback, /<[^>]+>/, key + ': plain text only');
    assert.ok(flow.includes(key), key + ': wired in the V3 export/import flow');
    assert.ok(flow.includes(fallback), key + ': English fallback is used by the flow');
  }

  assert.ok(flow.includes("'dashboard.managedLists.blockTubeBackupUnreadable'"),
    'reuse the existing unreadable BlockTube backup key');
  assert.ok(flow.includes("'dashboard.managedLists.blockTubeImportVerifiedTitle'"),
    'reuse the existing verified import title key');
});

test('backup action dynamic copy uses matching named placeholders', () => {
  const namedValues = {
    'dashboard.backup.blockTube.review.channelCounts': ['channelIds', 'channelNameRules', 'channels', 'videoIds'],
    'dashboard.backup.blockTube.review.ruleCounts': ['comments', 'keywords', 'regex'],
    'dashboard.backup.blockTube.review.settingCounts': ['durationFilters', 'mappedOptions'],
    'dashboard.backup.blockTube.review.statusCounts': ['inactive', 'invalid', 'unknown', 'unsupported'],
    'dashboard.backup.blockTube.verified.channelCounts': ['channelIds', 'channelNameRules', 'channels', 'videoIds'],
    'dashboard.backup.blockTube.verified.ruleCounts': ['keywords', 'regex'],
    'dashboard.backup.blockTube.verified.alreadyPresent': ['channels', 'keywords', 'videoIds'],
    'dashboard.backup.blockTube.verified.skipped': ['count'],
    'dashboard.backup.blockTube.verified.targetProfile': ['profile'],
    'dashboard.backup.blockTube.verified.metadataPending': ['count'],
    'dashboard.backup.blockTube.verified.metadataReviewSingular': ['count'],
    'dashboard.backup.blockTube.verified.metadataReviewPlural': ['count'],
    'dashboard.backup.import.metadataPendingToast': ['count'],
    'dashboard.backup.import.metadataReviewSingular': ['count'],
    'dashboard.backup.import.metadataReviewPlural': ['count'],
    'dashboard.backup.import.failed': ['message']
  };

  for (const [key, names] of Object.entries(namedValues)) {
    assert.deepEqual(placeholders(english[key]), names, key + ': declared placeholders');
    for (const name of names) assert.ok(flow.includes(name + ':'), key + ': supplies {' + name + '}');
  }
});

test('V3 backup prompts, modal copy, and toast copy have no raw English literals', () => {
  assert.doesNotMatch(flow, /UIComponents\.showToast\(\s*['"]/);
  assert.doesNotMatch(flow, /\b(?:title|message|placeholder|confirmText|label):\s*['"]/);
  assert.match(flow, /cancelText: tabViewUiText\("dashboard\.modal\.cancel", "Cancel"\)/,
    'Cancel uses the shared dashboard.modal.cancel key directly');
  assert.doesNotMatch(flow, /cancelText: 'Cancel'/);
});
