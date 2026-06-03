import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IO_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/io_manager.js';

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
    'nowTs',
    'safeArray',
    'safeObject',
    'normalizeString',
    'normalizeBool',
    'normalizeNumber',
    'normalizeListMode',
    'normalizeNonNegativeInteger'
  ].includes(name)) return 'primitiveDefensiveHelpers';
  if (['revokeDownloadBlobUrlLater', 'downloadWithRuntimeApi', 'finish'].includes(name)) {
    return 'downloadRuntimeHelpers';
  }
  if ([
    'parsePackedChannelKeywordSource',
    'keywordKey',
    'sanitizeKeywordEntry',
    'channelKey',
    'mergeChannelEntries',
    'sanitizeChannelEntry',
    'mergeKeywordLists',
    'mergeChannelLists',
    'normalizeMainProfileAliasFields',
    'mergeStringList'
  ].includes(name)) return 'keywordChannelNormalization';
  if ([
    'resolveProfileScope',
    'extractMasterPinVerifier',
    'verifyPinAgainstVerifier',
    'requirePinOrThrow'
  ].includes(name)) return 'profileScopeAndSecurity';
  if ([
    'deriveProfilesV3FromV4',
    'sanitizeChannels',
    'sanitizeKeywords',
    'loadProfilesV3',
    'saveProfilesV3'
  ].includes(name)) return 'legacyProfileDerivationAndV3Persistence';
  if (['readStorage', 'writeStorage'].includes(name)) return 'storageAccessWrappers';
  if ([
    'isValidProfilesV4',
    'buildDefaultProfilesV4FromLegacyStorage',
    'loadProfilesV4',
    'saveProfilesV4',
    'sanitizeProfilesV4',
    'sanitizeMainKeywords',
    'sanitizeMainChannels',
    'normalizeManagedTimeLimitPolicy'
  ].includes(name)) return 'profilesV4MigrationAndSanitization';
  if (['detectFormat', 'parseBlockTube', 'normalizeIncomingV3'].includes(name)) return 'importFormatParsing';
  if (['buildV3Export', 'exportV3'].includes(name)) return 'exportSerialization';
  if (['importV3'].includes(name)) return 'importMergeAndPersistence';
  if (['normalizeNanahBackupState', 'exportV3Encrypted', 'importV3Encrypted'].includes(name)) {
    return 'encryptedAndNanahState';
  }
  if ([
    'createAutoBackup',
    'safePart',
    'getBackupDirectory',
    'saveBackupFile',
    'rotateBackups',
    'scheduleAutoBackup'
  ].includes(name)) return 'autoBackupDownloadRotation';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    let match = line.match(/^\s*(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      const name = match[2];
      rows.push({
        line: index + 1,
        kind: match[1] ? 'async function' : 'function',
        name,
        group: groupForMethod(name)
      });
      return;
    }

    match = line.match(/^\s*(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/);
    if (match) {
      const name = match[2];
      rows.push({
        line: index + 1,
        kind: /async/.test(line) ? `async ${match[1]} arrow` : `${match[1]} arrow`,
        name,
        group: groupForMethod(name)
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

function publicApiRows() {
  const source = read(sourcePath).split(/\r?\n/);
  const returnStart = source.findIndex((line) => /^\s{4}global\.FilterTubeIO = \{/.test(line));
  const returnEnd = source.findIndex((line, index) => index > returnStart && /^\s{4}\};/.test(line));
  const rows = [];

  for (let index = returnStart + 1; index < returnEnd; index += 1) {
    const match = source[index].match(/^\s{8}([A-Za-z_$][\w$]*)(?::\s*[A-Za-z_$][\w$]*)?,?\s*$/);
    if (match) rows.push({ line: index + 1, name: match[1] });
  }

  return rows;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('io manager method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/io_manager\.js/);
  assert.match(text, /line count: 2097/);
  assert.match(text, /named declarations: 55/);
  assert.match(text, /IIFE-scoped function declarations: 49/);
  assert.match(text, /plain function declarations: 33/);
  assert.match(text, /async function declarations: 16/);
  assert.match(text, /local const arrow helper declarations: 6/);
  assert.match(text, /public FilterTubeIO entries: 11/);
  assert.match(text, /semantic method groups: 12/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for every import strategy/);
});

test('io manager register accounts for every current named declaration', () => {
  const rows = methodRows();

  assert.equal(rows.length, 55);
  assert.deepEqual(countBy(rows, 'kind'), {
    'async function': 16,
    'const arrow': 6,
    function: 33
  });
  assert.deepEqual(countBy(rows, 'group'), {
    autoBackupDownloadRotation: 6,
    downloadRuntimeHelpers: 3,
    encryptedAndNanahState: 3,
    exportSerialization: 2,
    importFormatParsing: 3,
    importMergeAndPersistence: 1,
    keywordChannelNormalization: 10,
    legacyProfileDerivationAndV3Persistence: 5,
    primitiveDefensiveHelpers: 8,
    profileScopeAndSecurity: 4,
    profilesV4MigrationAndSanitization: 8,
    storageAccessWrappers: 2
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('io manager register preserves every source row and public API entry', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing io_manager method row ${row.kind}:${row.name}:${row.line}`
    );
  }

  assert.deepEqual(publicApiRows().map((row) => row.name), [
    'exportV3',
    'exportV3Encrypted',
    'importV3',
    'importV3Encrypted',
    'loadProfilesV3',
    'saveProfilesV3',
    'loadProfilesV4',
    'saveProfilesV4',
    'createAutoBackup',
    'scheduleAutoBackup',
    'rotateBackups'
  ]);

  for (const row of publicApiRows()) {
    assert.ok(text.includes(row.name), `missing public API entry ${row.name}`);
  }
});

test('io manager register pins storage download timer and dependency surface counts', () => {
  const source = read(sourcePath);
  const text = doc();

  for (const key of [
    'FT_PROFILES_V3_KEY',
    'FT_PROFILES_V4_KEY',
    'NANAH_TRUSTED_LINKS_KEY',
    'NANAH_DEVICE_ID_KEY'
  ]) {
    assert.match(source, new RegExp(`const ${key} = '`));
  }

  assert.equal((source.match(/\breadStorage\(/g) || []).length, 5);
  assert.equal((source.match(/\bwriteStorage\(/g) || []).length, 8);
  assert.equal((source.match(/STORAGE_NAMESPACE\.get\(/g) || []).length, 1);
  assert.equal((source.match(/STORAGE_NAMESPACE\.set\(/g) || []).length, 1);
  assert.equal((source.match(/chrome\?\.runtime\?\.lastError/g) || []).length, 1);
  assert.equal((source.match(/runtimeAPI\.downloads\.download\(/g) || []).length, 2);
  assert.equal((source.match(/\bdownloadWithRuntimeApi\(/g) || []).length, 3);
  assert.equal((source.match(/runtimeAPI\.downloads\.search\(/g) || []).length, 1);
  assert.equal((source.match(/runtimeAPI\.downloads\.erase\(/g) || []).length, 2);
  assert.equal((source.match(/URL\.createObjectURL\(/g) || []).length, 2);
  assert.equal((source.match(/URL\.revokeObjectURL\(/g) || []).length, 1);
  assert.equal((source.match(/new Blob\(/g) || []).length, 2);
  assert.equal((source.match(/\bsetTimeout\(/g) || []).length, 2);
  assert.equal((source.match(/\bclearTimeout\(/g) || []).length, 1);
  assert.equal((source.match(/\bsetInterval\(/g) || []).length, 0);
  assert.equal((source.match(/\.addEventListener\(/g) || []).length, 0);
  assert.equal((source.match(/querySelector/g) || []).length, 0);
  assert.equal((source.match(/document\.createElement\(/g) || []).length, 0);
  assert.equal((source.match(/FilterTubeSettings/g) || []).length, 5);
  assert.equal((source.match(/FilterTubeSecurity/g) || []).length, 3);

  for (const token of [
    'storage key constants: 4',
    'readStorage occurrences: 5',
    'writeStorage occurrences: 8',
    'STORAGE_NAMESPACE.get calls: 1',
    'STORAGE_NAMESPACE.set calls: 1',
    'chrome.runtime.lastError reads: 1',
    'runtimeAPI.downloads.download calls: 2',
    'runtimeAPI.downloads.search calls: 1',
    'runtimeAPI.downloads.erase calls: 2',
    'URL.createObjectURL calls: 2',
    'URL.revokeObjectURL calls: 1',
    'Blob constructor calls: 2',
    'setTimeout calls: 2',
    'clearTimeout calls: 1',
    'FilterTubeSettings references: 5',
    'FilterTubeSecurity references: 3'
  ]) {
    assert.ok(text.includes(token), `missing io manager surface token ${token}`);
  }
});

test('io manager source still proves current behavior boundaries', () => {
  const source = read(sourcePath);

  assert.match(source, /const FT_PROFILES_V3_KEY = 'ftProfilesV3'/);
  assert.match(source, /const FT_PROFILES_V4_KEY = 'ftProfilesV4'/);
  assert.match(source, /const NANAH_TRUSTED_LINKS_KEY = 'ftNanahTrustedLinks'/);
  assert.match(source, /const NANAH_DEVICE_ID_KEY = 'ftNanahDeviceId'/);
  assert.match(source, /const STORAGE_NAMESPACE = runtimeAPI\?\.storage\?\.local/);
  assert.match(source, /runtimeAPI\.downloads\.download\(downloadOptions/);
  assert.match(source, /const err = runtimeAPI\.runtime\?\.lastError/);
  assert.match(source, /setTimeout\(\(\) => \{[\s\S]*URL\.revokeObjectURL\(blobUrl\)/);
  assert.match(source, /return Security\.verifyPin\(pin, verifier\)/);
  assert.match(source, /profilesV4 = sanitizeProfilesV4\(mainSettings\?\.\[FT_PROFILES_V4_KEY\]/);
  assert.match(source, /const format = detectFormat\(data\)/);
  assert.match(source, /return parseBlockTube\(data\)/);
  assert.match(source, /await SettingsAPI\.saveSettings\(payload\)/);
  assert.match(source, /await saveProfilesV3\(nextProfiles\)/);
  assert.match(source, /await saveProfilesV4\(\{/);
  assert.match(source, /await writeStorage\(\{ channelMap: nextChannelMap \}\)/);
  assert.match(source, /restoreTrustedNanahState === true/);
  assert.match(source, /const encrypted = await Security\.encryptJson\(payload, password\)/);
  assert.match(source, /const decrypted = await Security\.decryptJson\(root\.encrypted, password\)/);
  assert.match(source, /backupScheduleTimer = setTimeout\(async \(\) => \{/);
  assert.match(source, /await createAutoBackup\(pendingBackupTrigger\)/);
});

test('io manager register preserves future proof fields', () => {
  const text = doc();

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'callerUi',
    'exportScope',
    'importScope',
    'targetProfileId',
    'activeProfileId',
    'strategy',
    'authPinPolicy',
    'localMasterPinEffect',
    'incomingMasterPinEffect',
    'storageKeysRead',
    'storageKeysWritten',
    'legacyProfileShape',
    'v4ProfileShape',
    'profileSanitizationEffect',
    'settingsSaveEffect',
    'v3WriteEffect',
    'v4WriteEffect',
    'channelMapWriteEffect',
    'nanahTrustedStateEffect',
    'encryptedPayloadEffect',
    'downloadApiEffect',
    'blobUrlLifecycleEffect',
    'backupRotationEffect',
    'backupScheduleTimerEffect',
    'runtimeErrorPolicy',
    'migrationModePolicy',
    'whitelistPreservationPolicy',
    'listModePolicy',
    'positiveFixture',
    'negativePinFixture',
    'negativeFormatFixture',
    'negativeProfileFixture',
    'negativeDownloadFixture',
    'performanceBudget',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('runtime source lacks io manager method authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'ioManagerMethodAuthority',
    'ioManagerProfileMigrationReport',
    'ioManagerImportMutationPlan',
    'ioManagerExportScopeContract',
    'ioManagerPinAuthContract',
    'ioManagerEncryptedBackupContract',
    'ioManagerNanahRestorePolicy',
    'ioManagerDownloadLifecycleBudget',
    'ioManagerAutoBackupScheduleAuthority',
    'ioManagerBackupRotationReport',
    'ioManagerStorageWriteEffectReport',
    'ioManagerFixtureProvenance'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
