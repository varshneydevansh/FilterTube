import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
const json = file => JSON.parse(read(file));
const version = json('package.json').version;

test('prepared version agrees across package, lockfile, browser manifests and dashboard', () => {
  assert.equal(json('package-lock.json').version, version);
  assert.equal(json('package-lock.json').packages[''].version, version);
  for (const name of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.equal(json(name).version, version, name);
  }
  assert.ok(read('html/tab-view.html').includes(`Current version: v${version}`));
  assert.ok(read('README.md').includes(`version-${version}-blue.svg`));
});

test('current release has translated notices without overriding canonical links', () => {
  const latest = json('data/release_notes.json').find(note => note.version);
  assert.equal(latest.version, version);
  assert.equal(latest.detailsUrl, `https://github.com/varshneydevansh/FilterTube/releases/tag/v${version}`);
  assert.ok(latest.highlights.length >= 7, 'Keep full user-facing release highlights, not one compressed bullet');
  const previous = json('data/release_notes.json').find(note => note.version === '3.4.0');
  assert.ok(previous.highlights.length >= 7, 'Retain expanded 3.4.0 history');
  for (const { code } of json('data/ui_locales/targets.json').locales.filter(item => item.code !== 'en')) {
    const entry = json(`data/ui_locales/release_notes.${code}.json`)[version];
    for (const field of ['headline', 'summary', 'bannerSummary', 'ctaLabel']) assert.ok(entry[field]?.trim(), `${code}:${field}`);
    assert.equal(entry.highlights.length, latest.highlights.length, code);
    assert.equal(entry.detailsUrl, undefined, code);
    assert.equal(json(`data/ui_locales/release_notes.${code}.json`)['3.4.0'].highlights.length, previous.highlights.length, code);
    assert.equal(json(`data/ui_locales/${code}_static.json`)[`v${version}`], `v${version}`, code);
    assert.ok(json(`data/ui_locales/${code}_static.json`)[`Current version: v${version}`], code);
  }
});
