import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SECURITY_CRYPTO_PAYLOAD_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceFingerprints = {
  'js/security_manager.js': [198, 6374, '1fb1ec9c8339cbdad57107c5b596d893a025af68870ae7928083977a8d29ebd3'],
  'js/background.js': [6789, 306239, '618e41011a6031c7a4eb3d022c4612536942a7a58a3c41eb0fd7e31c29a60311'],
  'js/io_manager.js': [2097, 100479, 'f6f4119992f63a92dd984cd5eb9d5d5c946c839f63abef070ad0dace77474d62'],
  'js/tab-view.js': [12437, 564952, 'b7174155f23ee5b006a9f37be921a1aad0506030af56f96695710ac10d436066'],
  'js/popup.js': [1841, 75587, 'cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a']
};

const blockSpecs = {
  createPinVerifier: {
    file: 'js/security_manager.js',
    start: '    async function createPinVerifier',
    end: '    async function verifyPin',
    startLine: 97,
    lines: 15,
    bytes: 565,
    hash: 'a3831ca695ef4ea8fdef257365a3fa8f766ff9c47998bb93dee4e7e032464db3'
  },
  verifyPin: {
    file: 'js/security_manager.js',
    start: '    async function verifyPin',
    end: '    async function encryptJson',
    startLine: 112,
    lines: 13,
    bytes: 620,
    hash: 'eb642568bc033675ae2f945c7b02c1cc0c3dbbdf60db23caaf37d1c1821ca0c5'
  },
  encryptJson: {
    file: 'js/security_manager.js',
    start: '    async function encryptJson',
    end: '    async function decryptJson',
    startLine: 125,
    lines: 31,
    bytes: 1051,
    hash: '752dcf24ac84a9bc896b94e83745f7206f0b6289882f7328ff8a38003f1f1549'
  },
  decryptJson: {
    file: 'js/security_manager.js',
    start: '    async function decryptJson',
    end: '    global.FilterTubeSecurity',
    startLine: 156,
    lines: 36,
    bytes: 1264,
    hash: '9a8659936cfea24b95bca95535311f083a098794863f5fbafd9477f575596c6a'
  },
  backgroundEncryptedAutoBackup: {
    file: 'js/background.js',
    start: '    if (shouldEncrypt) {',
    end: '\n\n    const mode = typeof settings?.autoBackupMode',
    startLine: 901,
    lines: 21,
    bytes: 803,
    hash: '0f19dcb14b25fec0add42586fb91f54ff223b7324c0a852020e93310e5ec6e54'
  },
  ioExportV3Encrypted: {
    file: 'js/io_manager.js',
    start: '    async function exportV3Encrypted',
    end: '    async function importV3Encrypted',
    startLine: 1796,
    lines: 30,
    bytes: 1415,
    hash: '861997baefd50a8347f487b34383dc57628c73b3aadc3d122cdeea303480b7fc'
  },
  ioImportV3Encrypted: {
    file: 'js/io_manager.js',
    start: '    async function importV3Encrypted',
    end: '\n\n    // ============================================================================\n    // AUTO-BACKUP SYSTEM',
    startLine: 1826,
    lines: 13,
    bytes: 686,
    hash: '4d7589e51eb4c0bb622645a1dfbe912d61d5c9eb48cc5c16177de5fbd6bcc079'
  },
  tabManualEncryptedDecrypt: {
    file: 'js/tab-view.js',
    start: '            if (safeObject(parsed?.meta).encrypted === true && parsed?.encrypted) {',
    end: '\n\n            let auth = null;',
    startLine: 10120,
    lines: 17,
    bytes: 890,
    hash: '8fbbe7a9da2d4e609eedcf2edd58d4d926b3439d8f087dd3de4e462b9cac6a56'
  },
  popupVerifyPinWrapper: {
    file: 'js/popup.js',
    start: '    async function verifyPin(pin, verifier) {',
    end: '\n\n    async function ensureProfileUnlocked',
    startLine: 1226,
    lines: 7,
    bytes: 286,
    hash: '777e585119022de23e3c23f64689848b8327494e5ea11ae7c6273258f4794815'
  },
  tabVerifyPinWrapper: {
    file: 'js/tab-view.js',
    start: '    async function verifyPin(pin, verifier) {',
    end: '\n\n    async function ensureProfileUnlocked',
    startLine: 9126,
    lines: 7,
    bytes: 286,
    hash: '777e585119022de23e3c23f64689848b8327494e5ea11ae7c6273258f4794815'
  }
};

const expectedVerifier = {
  kdf: 'PBKDF2',
  hashAlg: 'SHA-256',
  iterations: 5,
  salt: 'AQIDBAUGBwgJCgsMDQ4PEA==',
  hash: 'plx3DxZlRFNLCtO5en/mZdQ2GjETxGU91mJi3BbJlww='
};

const expectedEncrypted = {
  kdf: {
    name: 'PBKDF2',
    hash: 'SHA-256',
    iterations: 5,
    salt: 'AQIDBAUGBwgJCgsMDQ4PEA=='
  },
  cipher: {
    name: 'AES-GCM',
    iv: 'oKGio6Slpqeoqaqr'
  },
  data: 'UekGIWXP9DYKPpuDhFOnB1ka6r9nVerZ/5xJwibxs3TSocBluuKsIQqmhSUibpsOvLe6ug=='
};

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return {
    start,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const source = read(spec.file);
  const { start, block } = sliceBetween(source, spec.start, spec.end);
  return {
    startLine: source.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    hash: sha256(block),
    block
  };
}

function selectedSource() {
  return Object.keys(sourceFingerprints).map(read).join('\n');
}

function loadSecurity() {
  const context = {
    crypto: crypto.webcrypto,
    btoa: (binary) => Buffer.from(binary, 'binary').toString('base64'),
    atob: (base64) => Buffer.from(base64, 'base64').toString('binary'),
    TextEncoder,
    TextDecoder,
    Uint8Array,
    Array,
    Object,
    Number,
    JSON,
    Error
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(read('js/security_manager.js'), context);
  return context.FilterTubeSecurity;
}

function fixtureSalt() {
  return new Uint8Array(Array.from({ length: 16 }, (_, index) => index + 1));
}

function fixtureIv() {
  return new Uint8Array(Array.from({ length: 12 }, (_, index) => 0xa0 + index));
}

function normalizeRealmObject(value) {
  return JSON.parse(JSON.stringify(value));
}

async function rejectionInfo(fn) {
  try {
    await fn();
  } catch (error) {
    return {
      name: error?.name || '',
      message: error?.message || ''
    };
  }
  assert.fail('expected operation to reject');
}

test('security crypto payload doc records audit-only boundary', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior boundary/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /cryptographic container boundary/);
  assert.match(doc, /PIN verifiers and encrypted JSON backups/);
  assert.match(doc, /security crypto payload source files pinned \| 5/);
  assert.match(doc, /security crypto payload source\/effect blocks pinned \| 10/);
  assert.match(doc, /security additionalData tokens \| 0/);
  assert.match(doc, /security version tokens \| 0/);
});

test('source fingerprints for security crypto payload files remain current', () => {
  const doc = read(docPath);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(source), expectedHash, `${file} hash drifted`);
    assert.match(
      doc,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines.toLocaleString('en-US')} \\| ${expectedBytes.toLocaleString('en-US')} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('source effect block metrics for security crypto payload paths remain current', () => {
  const doc = read(docPath);

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line drifted`);
    assert.equal(metric.lines, spec.lines, `${name} line count drifted`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count drifted`);
    assert.equal(metric.hash, spec.hash, `${name} hash drifted`);
    assert.match(
      doc,
      new RegExp(`\\| \`${name}\` \\| \`${escapeRegExp(spec.file)}:${spec.startLine}\` \\| ${spec.startLine} \\| ${spec.lines.toLocaleString('en-US')} \\| ${spec.bytes.toLocaleString('en-US')} \\| \`${spec.hash}\` \\|`)
    );
  }
});

test('selected security crypto payload token counts remain current', () => {
  const security = read('js/security_manager.js');
  const selected = selectedSource();
  const doc = read(docPath);

  const counts = {
    'security default iterations = 150000 tokens': countLiteral(security, 'iterations = 150000'),
    'security randomBytes(16) tokens': countLiteral(security, 'randomBytes(16)'),
    'security randomBytes(12) tokens': countLiteral(security, 'randomBytes(12)'),
    'security PBKDF2 tokens': countLiteral(security, 'PBKDF2'),
    'security SHA-256 tokens': countLiteral(security, 'SHA-256'),
    'security AES-GCM tokens': countLiteral(security, 'AES-GCM'),
    'security Number.isFinite tokens': countLiteral(security, 'Number.isFinite'),
    'security got === expected tokens': countLiteral(security, 'got === expected'),
    'security JSON.stringify tokens': countLiteral(security, 'JSON.stringify'),
    'security JSON.parse tokens': countLiteral(security, 'JSON.parse'),
    'security additionalData tokens': countLiteral(security, 'additionalData'),
    'security version tokens': countLiteral(security, 'version'),
    'selected Security.encryptJson tokens': countLiteral(selected, 'Security.encryptJson'),
    'selected Security.decryptJson tokens': countLiteral(selected, 'Security.decryptJson'),
    'selected Security.verifyPin tokens': countLiteral(selected, 'Security.verifyPin'),
    'selected Security.createPinVerifier tokens': countLiteral(selected, 'Security.createPinVerifier'),
    'selected meta.encrypted tokens': countLiteral(selected, 'meta.encrypted')
  };

  assert.deepEqual(counts, {
    'security default iterations = 150000 tokens': 2,
    'security randomBytes(16) tokens': 2,
    'security randomBytes(12) tokens': 1,
    'security PBKDF2 tokens': 14,
    'security SHA-256 tokens': 6,
    'security AES-GCM tokens': 5,
    'security Number.isFinite tokens': 2,
    'security got === expected tokens': 1,
    'security JSON.stringify tokens': 1,
    'security JSON.parse tokens': 1,
    'security additionalData tokens': 0,
    'security version tokens': 0,
    'selected Security.encryptJson tokens': 4,
    'selected Security.decryptJson tokens': 4,
    'selected Security.verifyPin tokens': 8,
    'selected Security.createPinVerifier tokens': 4,
    'selected meta.encrypted tokens': 1
  });

  for (const [label, count] of Object.entries(counts)) {
    assert.match(doc, new RegExp(`${escapeRegExp(label)} \\| ${count}`), `doc missing token count ${label}`);
  }
});

test('pin verifier container shape and verify behavior are executable', async () => {
  const Security = loadSecurity();
  const verifier = await Security.createPinVerifier(' 1234 ', {
    iterations: 5,
    saltBytes: fixtureSalt()
  });

  assert.deepEqual(normalizeRealmObject(verifier), expectedVerifier);
  assert.equal(await Security.verifyPin('1234', verifier), true);
  assert.equal(await Security.verifyPin(' 1234 ', verifier), true);
  assert.equal(await Security.verifyPin('1235', verifier), false);
  assert.equal(await Security.verifyPin('1234', { ...verifier, kdf: 'X' }), false);
  assert.equal(await Security.verifyPin('1234', { ...verifier, iterations: NaN }), false);
  assert.equal(await Security.verifyPin('1234', { ...verifier, salt: '' }), false);
});

test('encrypted JSON container shape and decrypt behavior are executable', async () => {
  const Security = loadSecurity();
  const encrypted = await Security.encryptJson(
    { answer: 42, rows: ['main', 'kids'] },
    ' pass ',
    {
      iterations: 5,
      saltBytes: fixtureSalt(),
      ivBytes: fixtureIv()
    }
  );

  assert.deepEqual(normalizeRealmObject(encrypted), expectedEncrypted);
  assert.deepEqual(Object.keys(encrypted).sort(), ['cipher', 'data', 'kdf']);
  assert.deepEqual(Object.keys(encrypted.kdf).sort(), ['hash', 'iterations', 'name', 'salt']);
  assert.deepEqual(Object.keys(encrypted.cipher).sort(), ['iv', 'name']);
  assert.equal('version' in encrypted, false);
  assert.equal('additionalData' in encrypted, false);
  assert.deepEqual(normalizeRealmObject(await Security.decryptJson(encrypted, 'pass')), { answer: 42, rows: ['main', 'kids'] });
  assert.deepEqual(normalizeRealmObject(await Security.decryptJson(encrypted, ' pass ')), { answer: 42, rows: ['main', 'kids'] });
});

test('malformed encrypted payload failures remain current', async () => {
  const Security = loadSecurity();
  const encrypted = await Security.encryptJson(
    { answer: 42, rows: ['main', 'kids'] },
    'pass',
    {
      iterations: 5,
      saltBytes: fixtureSalt(),
      ivBytes: fixtureIv()
    }
  );

  assert.deepEqual(await rejectionInfo(() => Security.decryptJson(encrypted, '')), {
    name: 'Error',
    message: 'Password required'
  });
  assert.deepEqual(await rejectionInfo(() => Security.decryptJson({ ...encrypted, kdf: { ...encrypted.kdf, name: 'X' } }, 'pass')), {
    name: 'Error',
    message: 'Unsupported KDF'
  });
  assert.deepEqual(await rejectionInfo(() => Security.decryptJson({ ...encrypted, cipher: { ...encrypted.cipher, name: 'X' } }, 'pass')), {
    name: 'Error',
    message: 'Unsupported cipher'
  });
  assert.deepEqual(await rejectionInfo(() => Security.decryptJson({ ...encrypted, data: '' }, 'pass')), {
    name: 'Error',
    message: 'Invalid encrypted payload'
  });

  const wrongPassword = await rejectionInfo(() => Security.decryptJson(encrypted, 'wrong'));
  assert.equal(wrongPassword.name, 'OperationError');
  assert.match(wrongPassword.message, /operation-specific reason/);
});

test('caller blocks expect current security payload shape', () => {
  const background = blockMetric(blockSpecs.backgroundEncryptedAutoBackup).block;
  const exportBlock = blockMetric(blockSpecs.ioExportV3Encrypted).block;
  const importBlock = blockMetric(blockSpecs.ioImportV3Encrypted).block;
  const tabDecrypt = blockMetric(blockSpecs.tabManualEncryptedDecrypt).block;
  const popupPin = blockMetric(blockSpecs.popupVerifyPinWrapper).block;
  const tabPin = blockMetric(blockSpecs.tabVerifyPinWrapper).block;

  assert.match(background, /const pinEntry = safeObject\(sessionPinCache\.get\(activeId\)\)/);
  assert.match(background, /if \(!isSessionPinCacheEntryFresh\(pinEntry\)\)/);
  assert.match(background, /const pin = pinEntry\.pin/);
  assert.match(background, /reason: 'missing_session_pin'/);
  assert.match(background, /typeof Security\.encryptJson !== 'function'/);
  assert.match(background, /const encrypted = await Security\.encryptJson\(payload, pin\)/);
  assert.match(background, /encrypted: true/);
  assert.match(background, /ext = 'encrypted\.json'/);

  assert.match(exportBlock, /const encrypted = await Security\.encryptJson\(payload, password\)/);
  assert.match(exportBlock, /meta: \{/);
  assert.match(exportBlock, /encrypted: true/);
  assert.match(importBlock, /const decrypted = await Security\.decryptJson\(root\.encrypted, password\)/);
  assert.match(importBlock, /return importV3\(decrypted, \{ strategy, scope, auth \}\)/);
  assert.doesNotMatch(importBlock, /targetProfileId/);

  assert.match(tabDecrypt, /safeObject\(parsed\?\.meta\)\.encrypted === true/);
  assert.match(tabDecrypt, /typeof Security\.decryptJson !== 'function'/);
  assert.match(tabDecrypt, /payload = await Security\.decryptJson\(parsed\.encrypted, password\)/);
  assert.match(popupPin, /return Security\.verifyPin\(pin, verifier\)/);
  assert.match(tabPin, /return Security\.verifyPin\(pin, verifier\)/);
});

test('security crypto payload authority symbols are absent from selected runtime source', () => {
  const doc = read(docPath);
  const selected = selectedSource();
  const authorities = [
    'securityCryptoPayloadBoundaryContract',
    'securityCryptoPayloadSchemaReport',
    'securityPinVerifierTimingPolicy',
    'securityPinVerifierIterationBounds',
    'securityEncryptedJsonVersionPolicy',
    'securityEncryptedJsonAadPolicy',
    'securityEncryptedPayloadSizeBudget',
    'securityEncryptedPayloadCompatibilityMatrix',
    'securityEncryptedPayloadTamperFixture',
    'securityEncryptedPayloadCallerContract'
  ];

  for (const authority of authorities) {
    assert.ok(doc.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(selected, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in selected runtime source`);
  }
});
