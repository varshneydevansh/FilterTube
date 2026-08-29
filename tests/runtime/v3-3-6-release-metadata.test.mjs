import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const read = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');
const readJson = (file) => JSON.parse(read(file));

test('v3.3.7 package, lockfile, and browser manifests agree', () => {
    const expected = '3.3.7';
    assert.equal(readJson('package.json').version, expected);
    assert.equal(readJson('package-lock.json').version, expected);
    assert.equal(readJson('package-lock.json').packages[''].version, expected);

    for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
        assert.equal(readJson(file).version, expected, `${file} should declare ${expected}`);
    }
});

test('v3.3.7 is the newest What’s New entry and is visible in the dashboard shell', () => {
    const releases = readJson('data/release_notes.json')
        .filter((entry) => entry && typeof entry.version === 'string');
    assert.equal(releases[0].version, '3.3.7');
    assert.equal(releases[0].detailsUrl, 'https://github.com/varshneydevansh/FilterTube/releases/tag/v3.3.7');
    assert.ok(releases[0].highlights.some((item) => item.includes('background-owned persisted enrichment queue')));

    const dashboard = read('html/tab-view.html');
    assert.match(dashboard, /<div class="version-info">v3\.3\.7<\/div>/);
    assert.match(dashboard, /Current version: v3\.3\.7/);
    assert.match(read('CHANGELOG.md'), /## Version 3\.3\.7/);
});
