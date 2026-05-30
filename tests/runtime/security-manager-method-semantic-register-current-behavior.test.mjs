import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SECURITY_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/security_manager.js';

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
  if (['ensureCrypto', 'normalizeString', 'randomBytes', 'safeObject'].includes(name)) {
    return 'securityCryptoDefensiveHelpers';
  }
  if (['toBase64', 'fromBase64'].includes(name)) {
    return 'securityByteEncodingHelpers';
  }
  if (['deriveBitsPBKDF2', 'deriveAesKeyPBKDF2'].includes(name)) {
    return 'securityPbkdf2Derivation';
  }
  if (['createPinVerifier', 'verifyPin'].includes(name)) {
    return 'securityPinVerifierLifecycle';
  }
  if (['encryptJson', 'decryptJson'].includes(name)) {
    return 'securityEncryptedJsonLifecycle';
  }
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    const match = line.match(/^\s*(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (!match) return;

    const name = match[2];
    rows.push({
      line: index + 1,
      kind: match[1] ? 'async function' : 'function',
      name,
      group: groupForMethod(name)
    });
  });
  return rows;
}

function publicApiRows() {
  const source = read(sourcePath).split(/\r?\n/);
  const returnStart = source.findIndex((line) => /^\s{4}global\.FilterTubeSecurity\s+=\s+\{/.test(line));
  const returnEnd = source.findIndex((line, index) => index > returnStart && /^\s{4}\};/.test(line));
  const rows = [];

  for (let index = returnStart + 1; index < returnEnd; index += 1) {
    const match = source[index].match(/^\s{8}([A-Za-z_$][\w$]*),?\s*$/);
    if (match) rows.push({ line: index + 1, name: match[1] });
  }

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

test('security manager method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/security_manager\.js/);
  assert.match(text, /line count: 198/);
  assert.equal(sourceLineCount(), 198);
  assert.match(text, /named declarations: 12/);
  assert.match(text, /plain function declarations: 6/);
  assert.match(text, /async function declarations: 6/);
  assert.match(text, /const arrow helper declarations: 0/);
  assert.match(text, /public FilterTubeSecurity entries: 4/);
  assert.match(text, /semantic method groups: 5/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for every caller authorization path/);
  assert.match(text, /Caller Boundary Snapshot - 2026-05-27/);
  assert.match(text, /flowchart TD/);
  assert.match(text, /security manager caller mutation authority: NO-GO/);
  assert.match(text, /security manager encrypted payload caller authority: NO-GO/);
  assert.match(text, /security manager profile unlock authority: NO-GO/);
  assert.match(text, /runtime behavior changed by this addendum: no/);
});

test('security manager register accounts for every current named declaration', () => {
  const rows = methodRows();

  assert.equal(rows.length, 12);
  assert.deepEqual(countBy(rows, 'kind'), {
    'async function': 6,
    function: 6
  });
  assert.deepEqual(countBy(rows, 'group'), {
    securityByteEncodingHelpers: 2,
    securityCryptoDefensiveHelpers: 4,
    securityEncryptedJsonLifecycle: 2,
    securityPbkdf2Derivation: 2,
    securityPinVerifierLifecycle: 2
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('security manager register preserves every source row and public API entry', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing security manager method row ${row.kind}:${row.name}:${row.line}`
    );
  }

  assert.deepEqual(publicApiRows().map((row) => row.name), [
    'createPinVerifier',
    'verifyPin',
    'encryptJson',
    'decryptJson'
  ]);
  for (const row of publicApiRows()) {
    assert.ok(text.includes(row.name), `missing public API entry ${row.name}`);
  }
});

test('security manager register pins crypto data and no-DOM surface counts', () => {
  const source = read(sourcePath);
  const text = doc();

  assert.equal(countLiteral(source, 'new TextEncoder'), 3);
  assert.equal(countLiteral(source, 'new TextDecoder'), 1);
  assert.equal(countLiteral(source, 'btoa('), 1);
  assert.equal(countLiteral(source, 'atob('), 1);
  assert.equal(countLiteral(source, 'cryptoApi.getRandomValues'), 1);
  assert.equal(countLiteral(source, 'subtle.importKey'), 2);
  assert.equal(countLiteral(source, 'subtle.deriveBits'), 1);
  assert.equal(countLiteral(source, 'subtle.deriveKey'), 1);
  assert.equal(countLiteral(source, 'subtle.encrypt'), 1);
  assert.equal(countLiteral(source, 'subtle.decrypt'), 1);
  assert.equal(countLiteral(source, 'JSON.stringify'), 1);
  assert.equal(countLiteral(source, 'JSON.parse'), 1);
  assert.equal(countLiteral(source, 'throw new Error'), 7);
  assert.equal(countLiteral(source, 'Number.isFinite'), 2);
  assert.equal(countLiteral(source, 'setTimeout('), 0);
  assert.equal(countLiteral(source, 'addEventListener('), 0);
  assert.equal(countLiteral(source, 'document.'), 0);
  assert.equal(countLiteral(source, 'window.'), 0);
  assert.equal(countLiteral(source, 'global.FilterTubeSecurity'), 1);
  assert.equal(countLiteral(source, 'module.exports'), 0);

  for (const token of [
    'TextEncoder constructions: 3',
    'TextDecoder constructions: 1',
    'btoa calls: 1',
    'atob calls: 1',
    'cryptoApi.getRandomValues calls: 1',
    'subtle.importKey calls: 2',
    'subtle.deriveBits calls: 1',
    'subtle.deriveKey calls: 1',
    'subtle.encrypt calls: 1',
    'subtle.decrypt calls: 1',
    'JSON.stringify calls: 1',
    'JSON.parse calls: 1',
    'throw new Error statements: 7',
    'Number.isFinite calls: 2',
    'setTimeout calls: 0',
    'addEventListener calls: 0',
    'document references: 0',
    'window references: 0',
    'global.FilterTubeSecurity assignments: 1',
    'module.exports references: 0'
  ]) {
    assert.ok(text.includes(token), `missing security manager surface token ${token}`);
  }
});

test('security manager source still proves current behavior boundaries', () => {
  const source = read(sourcePath);
  const text = doc();

  assert.match(source, /const cryptoApi = \(typeof globalThis !== 'undefined' && globalThis\.crypto\) \? globalThis\.crypto : null/);
  assert.match(source, /const subtle = cryptoApi\?\.subtle/);
  assert.match(source, /throw new Error\('WebCrypto unavailable'\)/);
  assert.match(source, /return typeof value === 'string' \? value\.trim\(\) : ''/);
  assert.match(source, /return btoa\(binary\)/);
  assert.match(source, /const binary = atob\(normalized\)/);
  assert.match(source, /cryptoApi\.getRandomValues\(out\)/);
  assert.match(source, /name: 'PBKDF2'/);
  assert.match(source, /hash: 'SHA-256'/);
  assert.match(source, /\{ name: 'AES-GCM', length: 256 \}/);
  assert.match(source, /async function createPinVerifier\(pin, \{ iterations = 150000, saltBytes = null \} = \{\}\)/);
  assert.match(source, /if \(!normalized\) throw new Error\('PIN required'\)/);
  assert.match(source, /const salt = saltBytes instanceof Uint8Array \? saltBytes : randomBytes\(16\)/);
  assert.match(source, /return got === expected/);
  assert.match(source, /async function encryptJson\(obj, password, \{ iterations = 150000, saltBytes = null, ivBytes = null \} = \{\}\)/);
  assert.match(source, /const iv = ivBytes instanceof Uint8Array \? ivBytes : randomBytes\(12\)/);
  assert.match(source, /const json = JSON\.stringify\(obj\)/);
  assert.match(source, /data: toBase64\(new Uint8Array\(ciphertext\)\)/);
  assert.match(source, /throw new Error\('Unsupported KDF'\)/);
  assert.match(source, /throw new Error\('Unsupported cipher'\)/);
  assert.match(source, /throw new Error\('Invalid encrypted payload'\)/);
  assert.match(source, /return JSON\.parse\(json\)/);
  assert.match(source, /global\.FilterTubeSecurity = \{/);

  for (const token of [
    "failure when unavailable: throw new Error('WebCrypto unavailable')",
    'PIN verifier KDF: PBKDF2',
    'PIN verifier hash: SHA-256',
    'default iterations: 150000',
    'PIN salt length: randomBytes(16) unless injected',
    'PIN comparison: got === expected',
    'encrypted JSON cipher: AES-GCM',
    'encrypted JSON IV length: randomBytes(12) unless injected',
    'encrypted JSON payload shape: kdf, cipher, data',
    "unsupported KDF failure: throw new Error('Unsupported KDF')",
    "unsupported cipher failure: throw new Error('Unsupported cipher')",
    "invalid payload failure: throw new Error('Invalid encrypted payload')"
  ]) {
    assert.ok(text.includes(token), `missing crypto/data behavior token ${token}`);
  }

  for (const token of [
    '| Popup unlock wrapper | `js/popup.js:1226-1262` |',
    '| Dashboard unlock wrapper | `js/tab-view.js:8349-8397` |',
    '| Background session cache | `js/background.js:634-655`, `js/background.js:3268-3284`, `js/background.js:3571-3579` |',
    '| IO PIN requirement | `js/io_manager.js:190-212`, `js/io_manager.js:1241-1289` |',
    '| IO encrypted export/import | `js/io_manager.js:1729-1770` |',
    '| Background encrypted backup | `js/background.js:819-837` |',
    '| Dashboard encrypted import decrypt | `js/tab-view.js:9299-9315` |',
    'The security manager remains intentionally pure: no DOM selectors, listeners,',
    'every behavior change',
    'must cite the caller'
  ]) {
    assert.ok(text.includes(token), `missing caller-boundary token ${token}`);
  }
});

test('security manager register preserves future proof fields', () => {
  const text = doc();

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'publicApiEntry',
    'callerSurface',
    'cryptoDependency',
    'kdfName',
    'hashAlgorithm',
    'cipherName',
    'iterationsPolicy',
    'saltSource',
    'ivSource',
    'passwordNormalization',
    'encodedPayloadShape',
    'failureMode',
    'callerMutationGate',
    'timingComparisonPolicy',
    'browserCompatibilityFixture',
    'positiveFixture',
    'negativeMissingCryptoFixture',
    'negativeWrongPinFixture',
    'negativeWrongPasswordFixture',
    'negativeMalformedPayloadFixture',
    'negativeUnsupportedKdfFixture',
    'negativeUnsupportedCipherFixture',
    'importPreviewBoundary',
    'profileLockBoundary',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('runtime source lacks security manager method authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'securityManagerMethodAuthority',
    'securityManagerCryptoAvailabilityContract',
    'securityManagerPinVerifierContract',
    'securityManagerEncryptedJsonContract',
    'securityManagerKdfCompatibilityReport',
    'securityManagerTimingComparisonPolicy',
    'securityManagerPayloadValidationReport',
    'securityManagerCallerMutationGate',
    'securityManagerFixtureProvenance'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
