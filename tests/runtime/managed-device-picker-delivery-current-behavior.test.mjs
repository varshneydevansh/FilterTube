import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('verified device picker exposes a direct send action without hiding later devices', () => {
  const html = read('html/tab-view.html');
  const tabView = read('js/tab-view.js');
  const css = read('css/serene-shell.css');

  assert.match(html, /aria-label="Choose a verified device to send to"/);
  assert.match(tabView, /primaryAction: 'Send update'/);
  assert.match(tabView, /const visibleDevices = deviceRows;/);
  assert.doesNotMatch(tabView, /const visibleDevices = deviceRows\.slice\(0, 3\)/);
  assert.match(css, /grid-auto-flow: column/);
  assert.match(css, /overflow-x: auto/);
  assert.match(css, /scroll-snap-type: inline proximity/);
});

test('explicit device send targets one trusted link and one chosen delivery path', () => {
  const tabView = read('js/tab-view.js');

  assert.match(tabView, /linkIds = \[\]/);
  assert.match(tabView, /deliveryMode = 'all'/);
  assert.match(tabView, /requestedLinkIds\.has\(normalizeString\(link\.linkId\)\)/);
  assert.match(tabView, /normalizedDeliveryMode === 'auto' && !sendLive && localNetworkCanDeliver/);
  assert.match(tabView, /normalizedDeliveryMode === 'auto' && !sendLive && !sendLocal && mailboxCanDeliver/);
  assert.match(tabView, /linkIds: \[selectedLinkId\]/);
  assert.match(tabView, /value: 'live', label: 'Send Now'/);
  assert.match(tabView, /value: 'home', label: 'Home Pickup'/);
  assert.match(tabView, /value: 'later', label: 'Send for Later'/);
});

test('user guide explains offline delivery boundary and provider opacity', () => {
  const guide = read('docs/NANAH_USER_GUIDE.md');

  assert.match(guide, /The browser cannot deliver directly to a device that is offline/);
  assert.match(guide, /stores only an encrypted, signed envelope/);
  assert.match(guide, /provider cannot read the rules, choose a profile, grant itself trust, or apply the update/);
  assert.match(guide, /it is not an open torrent swarm/);
});
