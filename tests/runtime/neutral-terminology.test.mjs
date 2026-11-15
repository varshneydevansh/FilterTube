// FilterTube's own words in the extension's interface (docs/app/design-system/TERMINOLOGY.md in the
// app repo): Clips, Following, Saved, Auto playlist, Popular, Posts, Paid chat, Sangeet, Kids. The
// English catalogs are the guard; platform-sent labels shown in the extension's own UI go through
// UIComponents.neutralizePlatformLabel (Android PlatformLabelNeutralizer).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const en = JSON.parse(read('data/ui_locales/en.json'));
const staticCopy = JSON.parse(read('data/ui_locales/en_static.json'));

// Product terms of the video platform, as the app's UserFacingTerminologyTest checks them.
const PLATFORM_TERMS = /YouTube|\bYT\b|\bShorts\b|Subscrib|Subscription|\bMix(?:es)?\b|Trending|Watch later|Super (?:Chat|Thanks|Stickers)/;

// Kept on purpose: each names the platform's own controls, account or help, which the user has to
// use directly (the same rule as "Google account" in the app's glossary).
const STATIC_ALLOWLIST = new Set([
  'YouTube Kids profiles',
  'Your children\'s profiles on youtubekids.com. Link a FilterTube profile to one, and switching to that profile picks that child on YouTube Kids.',
  'YouTube blocks and FilterTube blocks are separate',
  'YouTube Kids\' own parent-account block list.',
  'If removing a rule from FilterTube does not bring the channel back, check YouTube\'s official unblock steps:',
  'Unblock channels from YouTube using your linked parent account',
  'YouTube Kids parent account',
  'YouTube Kids Help Center',
  'for YouTube-owned controls.',
  // The About section's link to the developer's channel on that platform.
  'YouTube'
]);
const STATIC_ALLOWLIST_PREFIXES = [
  'FilterTube avoids adding rule-changing shortcut buttons inside Kids',
  'If you block something inside YouTube Kids itself, YouTube manages that block.',
  'Some YouTube Kids actions still require YouTube\'s linked parent account.'
];

test('no interface catalog string names the platform\'s products', () => {
  const offenders = Object.entries(en).filter(([, value]) => PLATFORM_TERMS.test(value)).map(([key]) => key);
  assert.deepEqual(offenders, []);
});

test('the options page\'s static copy names the platform only for its own controls', () => {
  const offenders = Object.keys(staticCopy).filter(text => PLATFORM_TERMS.test(text)
    && !STATIC_ALLOWLIST.has(text) && !STATIC_ALLOWLIST_PREFIXES.some(prefix => text.startsWith(prefix)));
  assert.deepEqual(offenders, []);
});

test('role words: Parent, Adult and Kids; "Master PIN" keeps its name', () => {
  assert.equal(en['popup.profile.groupMaster'], '{name} (Parent)');
  assert.equal(en['popup.profile.groupAccount'], '{name} (Adult)');
  assert.equal(en['popup.profile.labelChildLocked'], '{name} (Kids, PIN protected)');
  assert.ok(Object.values(en).some(value => value.includes('Master PIN')));
});

function components(catalog = {}) {
  const box = { console, window: { FilterTubeUiLocalization: { text: (key, values = {}) => {
    const value = catalog[key];
    return typeof value === 'string' ? value.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? '')) : null;
  } } } };
  vm.createContext(box);
  vm.runInContext(`${read('js/ui_components.js')}\nthis.UI = UIComponents;`, box);
  return box.UI;
}

test('platform-sent labels map to FilterTube\'s words, whole labels and known affixes only', () => {
  const UI = components();
  const cases = {
    Shorts: 'Clips', 'Subscriptions': 'Following', 'Subscribe': 'Follow', 'Subscribed': 'Following', 'Watch later': 'Saved',
    'Watch Later:': 'Saved', Trending: 'Popular', 'Trending on YouTube': 'Popular', 'YouTube Music': 'Sangeet', 'YouTube Kids': 'Kids',
    Community: 'Posts', 'Super Chat': 'Paid chat', Mixes: 'Auto playlists', 'My Mix': 'Auto playlist',
    'Mix – Arijit Singh': 'Auto playlist · Arijit Singh', 'YouTube Originals': 'Originals',
    'Später ansehen': 'Saved', '登録チャンネル': 'Following', 'ショート': 'Clips'
  };
  for (const [raw, expected] of Object.entries(cases)) assert.equal(UI.neutralizePlatformLabel(raw), expected, raw);
  for (const content of ['Mixing a track in Ableton', 'How subscriptions work', 'Short videos about cats', 'Trending topics this week']) {
    assert.equal(UI.neutralizePlatformLabel(content), content, `content stays as sent: ${content}`);
  }
  assert.equal(UI.neutralizePlatformLabel(''), '');
  assert.equal(UI.neutralizePlatformLabel(null), null);
});

test('the mapped word follows the interface language', () => {
  const de = JSON.parse(read('data/ui_locales/de.json'));
  const UI = components(de);
  assert.equal(UI.neutralizePlatformLabel('Watch later'), de['platformLabel.saved']);
  assert.equal(UI.neutralizePlatformLabel('Mix – Nena'), de['platformLabel.autoPlaylistNamed'].replace('{name}', 'Nena'));
});

test('every catalog carries the platform-label words with the named placeholder', () => {
  const names = fs.readdirSync(new URL('data/ui_locales/', root)).filter(name => /^[a-z]{2,3}(-[A-Za-z]+)?\.json$/.test(name) && name !== 'targets.json');
  assert.equal(names.length, 38);
  for (const name of names) {
    const catalog = JSON.parse(read(`data/ui_locales/${name}`));
    for (const term of ['clips', 'followingTab', 'follow', 'followingState', 'saved', 'popular', 'posts', 'paidChat', 'music', 'kids',
      'autoPlaylist', 'autoPlaylists']) {
      assert.equal(typeof catalog[`platformLabel.${term}`], 'string', `${name} ${term}`);
      assert.equal(PLATFORM_TERMS.test(catalog[`platformLabel.${term}`]), false, `${name} ${term}`);
    }
    assert.match(catalog['platformLabel.autoPlaylistNamed'], /\{name\}/, name);
  }
});

test('the dashboard shows the local Watch later playlist as Saved, keeping its stored name', () => {
  const source = read('js/tab-view.js');
  const start = source.indexOf('function renderDashboardLocalPlaylists()');
  const render = source.slice(start, source.indexOf("document.addEventListener('DOMContentLoaded'", start));
  assert.match(render, /contract\.isWatchLater\?\.\(playlist\)/);
  assert.match(render, /neutralizePlatformLabel\?\.\('Watch later'\)/);
});

test('in-page overlays and bulk prompts name the space as Main or Kids', () => {
  const bridge = read('js/content/bridge_settings.js');
  assert.equal(/'YouTube Kids' : 'YouTube'/.test(bridge), false);
  assert.equal(/'kids' \? 'YouTube Kids' : '(?:Main YouTube|YouTube Main)'/.test(read('js/tab-view.js')), false);
});
