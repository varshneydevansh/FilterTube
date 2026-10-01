import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { assertUniqueJsonKeys, validateJsonPaths } = require('../../scripts/check-json-keys.cjs');

test('rejects duplicate keys even with identical values', () => {
    assert.throws(() => assertUniqueJsonKeys('{"Settings":"same",\n"Settings":"same"}', 'ko.json'), /ko.json:2: duplicate JSON key/);
});
test('compares decoded keys and checks nested objects in arrays', () => {
    assert.throws(() => assertUniqueJsonKeys('[{"a":1,"\\u0061":2}]'), /duplicate JSON key "a"/);
    assert.throws(() => assertUniqueJsonKeys('{"outer":{"nested":0,"nested":1}}'), /duplicate JSON key "nested"/);
});
test('allows repeated keys in separate objects and punctuation inside strings', () => {
    assert.doesNotThrow(() => assertUniqueJsonKeys('{"items":[{"a":1},{"a":2}],"text":"{\\\"a\\\":[]}","empty":{},"list":[],"n":-2.5e3}'));
});
test('rejects invalid JSON grammar', () => {
    assert.throws(() => assertUniqueJsonKeys('{"a":1,}'), SyntaxError);
});
test('all runtime locale JSON has unique keys and builds enforce the check', () => {
    const root = new URL('../../', import.meta.url);
    assert.ok(validateJsonPaths([new URL('data/ui_locales', root).pathname], filename => !filename.split('/').includes('batches')) > 38);
    const build = fs.readFileSync(new URL('build.js', root), 'utf8');
    assert.match(build, /validateJsonPaths\(COMMON_DIRS/);
    assert.match(build, /validateJsonPaths\(\[targetDir\]\)/);
});
