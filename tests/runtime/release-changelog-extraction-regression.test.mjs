import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../build.js', import.meta.url), 'utf8');
const changelog = fs.readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8');
const version = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version;
function extract(raw, requested) {
  const start = source.indexOf('function extractLatestChangelogEntry(');
  const end = source.indexOf('function buildReleaseTitle(', start);
  const context = { fs: { readFileSync: () => raw }, console };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  return context.extractLatestChangelogEntry(requested);
}

test('current release produces real notes and excludes the history index', () => {
  const entry = extract(changelog, version);
  assert.ok(entry.section.includes('38 bundled interface languages'));
  assert.ok(entry.section.includes('Dashboard startup fixes'));
  assert.ok(entry.section.includes('### Commit history after the last release'));
  assert.ok(entry.section.includes('`c9f070af`'));
  assert.ok(!entry.section.includes('`4a658584`'));
  assert.ok(!entry.section.includes('Post-v3.3.5 source-history index'));
  assert.equal(entry.previousVersion, '3.3.7');
});

test('canonical and bare version headings are recognized and bounded by any next section', () => {
  for (const heading of ['## Version 3.4.0 — Notes', '## 3.4.0 — Notes']) {
    const entry = extract(`${heading}\n\n- Actual fix\n\n## Audit index\nNot release copy\n## Version 3.3.7\nOlder notes`, '3.4.0');
    assert.equal(entry.section, '- Actual fix');
    assert.equal(entry.previousVersion, '3.3.7');
  }
});

test('release body refuses missing details rather than generating placeholder copy', () => {
  const start = source.indexOf('function buildReleaseBody(');
  const next = source.indexOf('    const tag =', start);
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source.slice(start, next)}\n}`, context);
  assert.throws(() => context.buildReleaseBody({ version, section: '' }), /refusing to generate placeholder/);
  assert.equal(extract(changelog, '999.0.0'), null);
  assert.match(source, /Refusing to publish v\$\{version\}/);
});
