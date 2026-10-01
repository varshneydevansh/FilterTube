import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

test('one membership badge does not hide its search section or unrelated siblings', () => {
  const source = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
  const start = source.indexOf('            const membershipBadges =');
  const end = source.indexOf('            // 2) Shelves/playlists', start);
  assert.ok(start >= 0 && end > start);
  const hidden = new Set();
  const section = { style: { setProperty: () => hidden.add('section') }, setAttribute() {} };
  const card = {
    style: { setProperty: () => hidden.add('card') }, setAttribute() {}, closest: () => section
  };
  const badge = {
    textContent: 'Members only', getAttribute: () => '', classList: { contains: () => true },
    closest(selector) {
      assert.doesNotMatch(selector, /ytd-watch-flexy|ytd-watch-metadata|ytd-video-primary-info-renderer/);
      return card;
    }
  };
  Function('document', source.slice(start, end))({ querySelectorAll: () => [badge] });
  assert.deepEqual([...hidden], ['card']);
  const cssStart = source.indexOf('    if (settings.hideMembersOnly) {');
  const cssEnd = source.indexOf('    if (', cssStart + 10);
  const css = source.slice(cssStart, cssEnd);
  assert.doesNotMatch(css, /ytd-watch-flexy:has|ytd-watch-metadata:has|ytd-video-primary-info-renderer:has/);
  assert.doesNotMatch(css, /ytd-shelf-renderer:has\((?:\.yt-badge|\[aria-label)/);
});
