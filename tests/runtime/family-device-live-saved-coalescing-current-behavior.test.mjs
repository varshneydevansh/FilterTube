import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

// Exercise the existing production builder + DOM renderer + navigation fixture.
let fixtureSource = fs.readFileSync(new URL('./family-device-multiple-recipient-focus-current-behavior.test.mjs', import.meta.url), 'utf8').split("test('production builder")[0];
for (const name of ['tab-view', 'family_device_navigation']) {
  fixtureSource = fixtureSource.replaceAll(`new URL('../../js/${name}.js', import.meta.url)`, `new URL('${new URL(`../../js/${name}.js`, import.meta.url).href}')`);
}
const { fixture, actualFunction } = await import(`data:text/javascript;base64,${Buffer.from(`${fixtureSource}\nexport { fixture, actualFunction };`).toString('base64')}`);
function harness() {
  const f = fixture(), c = f.context;
  vm.runInNewContext(actualFunction('selectNanahLiveMapDevice'), c);
  c.getNanahRole = () => 'source';
  c.nanahSessionState = { connected: true, sasConfirmed: true, remoteRole: 'replica',
    remoteDevice: { deviceId: 'same-physical-tablet', deviceLabel: 'Shared tablet' }, remoteProfile: { profileId: 'mira', profileName: 'Mira' } };
  for (const link of c.nanahTrustedLinks) Object.assign(link, {
    sourceDeviceId: c.nanahStableDeviceId, sourceProfileId: 'default', targetDeviceId: 'same-physical-tablet',
    policy: { ...link.policy, targetProfileBehavior: 'fixed_profile' }
  });
  c.formatNanahManagedSourceAckSyncStatus = () => 'Waiting for send receipt';
  f.render = (liveReady = true) => {
    const model = c.buildNanahFamilyDeviceMapViewModel({ deliverySummary: { protectedProfileCount: 2, verifiedProfileCount: c.nanahTrustedLinks.length }, liveReady });
    c.renderNanahFamilyDeviceMapViewModel(model); return model;
  };
  return f;
}
const rows = model => model.devices.filter(row => row.source !== 'current-device');
const tileText = tile => tile.children[1].children.map(node => node.textContent).join(' ');

test('an exact saved/live managed recipient renders once with stable link, live presence and unchanged receipt', async () => {
  const f = harness(), model = f.render();
  assert.equal(rows(model).length, 2);
  assert.equal(rows(model).filter(row => row.source === 'live-session').length, 0);
  const mira = rows(model).find(row => row.linkId === 'link-mira');
  assert.equal(mira.source, 'trusted-link'); assert.equal(mira.id, 'link-mira');
  assert.equal(mira.liveConnected, true); assert.equal(mira.routeLabel, 'Open now');
  assert.equal(mira.deliveryState, 'Waiting for send receipt'); assert.equal(mira.primaryAction, 'Send update');
  assert.equal(f.strip.children.length, 2);
  assert.match(tileText(f.strip.children[0]), /Mira.*Waiting for receipt/);
  assert.doesNotMatch(tileText(f.strip.children[0]), /Open now/);
  assert.match(f.strip.children[0].getAttribute('aria-label'), /Open now/);
  assert.match(tileText(f.strip.children[1]), /Leo/); assert.doesNotMatch(tileText(f.strip.children[1]), /Open now/);
  f.strip.children[0].focus(); f.strip.children[0].dispatch('click'); await Promise.resolve();
  assert.equal(f.context.nanahFamilyDeviceSelectedIntent.source, 'trusted-link');
  assert.equal(f.context.nanahFamilyDeviceSelectedIntent.linkId, 'link-mira');
  assert.equal(f.context.nanahFamilyDeviceSelectedIntent.profileId, 'mira');
});

for (const [name, change] of [
  ['another parent', c => { c.nanahTrustedLinks[0].sourceProfileId = 'another-parent'; }],
  ['unknown parent', c => { c.nanahTrustedLinks[0].sourceProfileId = ''; }],
  ['unknown source device', c => { c.nanahTrustedLinks[0].sourceDeviceId = ''; }],
  ['different receiver', c => { c.nanahTrustedLinks[0].targetDeviceId = 'other-tablet'; }],
  ['different target with same name', c => { c.nanahTrustedLinks[0].policy.targetProfileId = 'another-mira'; }],
  ['missing fixed target', c => { c.nanahTrustedLinks[0].policy.targetProfileBehavior = 'current_active'; c.nanahTrustedLinks[0].policy.targetProfileId = ''; }],
  ['different role', c => { c.nanahSessionState.remoteRole = 'source'; }],
  ['unconfirmed phrase', c => { c.nanahSessionState.sasConfirmed = false; }],
  ['revoked link', c => { c.nanahTrustedLinks[0].revoked = true; }],
  ['ambiguous same tuple', c => { c.nanahTrustedLinks.push({ ...c.nanahTrustedLinks[0], linkId: 'ambiguous-other-link' }); }]
]) {
  test(`${name} keeps the live session separate rather than choosing saved authority`, () => {
    const f = harness(); change(f.context); const model = f.render();
    assert.equal(rows(model).filter(row => row.source === 'live-session').length, 1);
    assert.equal(rows(model).filter(row => row.liveConnected).length, 0);
    assert.equal(f.strip.children.length, f.context.nanahTrustedLinks.length + 1);
  });
}

test('two independently saved source parents and two recipients remain separate as actual source parent changes', () => {
  const f = harness(), c = f.context;
  c.nanahTrustedLinks.push({ ...c.nanahTrustedLinks[0], linkId: 'other-parent-mira', sourceProfileId: 'other-parent' });
  let model = f.render();
  assert.deepEqual(Array.from(rows(model), row => row.linkId), ['link-mira', 'link-leo', 'other-parent-mira']);
  assert.equal(rows(model).find(row => row.liveConnected).linkId, 'link-mira');
  c.profilesV4Cache.profiles['other-parent'] = { name: 'Other parent', type: 'account' };
  c.profilesV4Cache.activeProfileId = 'other-parent'; c.activeProfileId = 'other-parent';
  model = f.render(); assert.equal(rows(model).find(row => row.liveConnected).linkId, 'other-parent-mira');
  assert.equal(f.strip.children.length, 3);
  c.nanahSessionState.remoteProfile = { profileId: 'leo', profileName: 'Leo' };
  model = f.render(); assert.equal(rows(model).filter(row => row.source === 'live-session').length, 1, 'other parent has no Leo grant');
});

test('a replica matches pinned remote parent and actual local receiving child, preserving sibling saved links', () => {
  const f = harness(), c = f.context;
  c.getNanahRole = () => 'replica'; c.profilesV4Cache.activeProfileId = 'mira'; c.activeProfileId = 'mira';
  c.profilesV4Cache.profiles.mira = { name: 'Mira', type: 'child', parentProfileId: 'default' };
  c.nanahSessionState.remoteRole = 'source'; c.nanahSessionState.remoteProfile = { profileId: 'remote-parent', profileName: 'Remote parent' };
  c.nanahTrustedLinks.forEach(link => Object.assign(link, { localRole: 'replica', remoteRole: 'source', sourceDeviceId: 'same-physical-tablet',
    sourceProfileId: 'remote-parent', targetDeviceId: c.nanahStableDeviceId }));
  c.formatNanahProtectedUpdateCheckStatus = () => 'Applied';
  const model = f.render(); assert.equal(rows(model).length, 2);
  assert.equal(rows(model).find(row => row.liveConnected).linkId, 'link-mira');
  assert.equal(rows(model).find(row => row.liveConnected).role, 'parent');
  c.nanahSessionState.remoteProfile.profileId = 'other-parent';
  assert.equal(rows(f.render()).filter(row => row.source === 'live-session').length, 1);
});

test('saved tile focus and selection stay on the same recipient through connect, drop and reconnect', async () => {
  const f = harness(); f.render(false);
  const mira = f.strip.children.find(tile => tile.dataset.familyDeviceId === 'link-mira');
  mira.focus(); mira.dispatch('click'); await Promise.resolve();
  f.action.dispatch('keydown', { key: 'Escape' }); assert.equal(f.document.activeElement, mira);
  f.render(true); assert.equal(f.document.activeElement.dataset.familyDeviceId, 'link-mira');
  assert.equal(f.document.activeElement.dataset.source, 'trusted-link');
  f.context.nanahSessionState.connected = false; f.render(false);
  assert.equal(f.document.activeElement.dataset.familyDeviceId, 'link-mira');
  assert.equal(f.context.nanahFamilyDeviceSelectedIntent.linkId, 'link-mira');
  f.context.nanahSessionState.connected = true; f.render(true);
  assert.equal(f.document.activeElement.dataset.familyDeviceId, 'link-mira');
  assert.deepEqual(f.strip.children.map(tile => tile.attributes['aria-pressed']), ['true', 'false']);
});

test('a focused former live tile hands focus to its uniquely equivalent saved tile', () => {
  const f = harness(); f.render(false);
  const live = f.strip.children.find(tile => tile.dataset.source === 'live-session'); live.focus();
  assert.equal(live.dataset.profileId, 'mira');
  f.render(true);
  assert.equal(f.document.activeElement.dataset.source, 'trusted-link');
  assert.equal(f.document.activeElement.dataset.familyDeviceId, 'link-mira');
  assert.equal(f.document.activeElement.dataset.profileId, 'mira');
});

test('personal peer tiles retain their existing independent live/copy choices', () => {
  const f = harness(), c = f.context;
  c.getNanahRole = () => 'peer'; c.ftNanahSyncShell.dataset.personalSyncOpen = 'true';
  c.nanahSessionState.remoteRole = 'peer';
  c.nanahTrustedLinks.forEach(link => Object.assign(link, { localRole: 'peer', remoteRole: 'peer', linkType: 'peer_link' }));
  assert.equal(rows(f.render()).filter(row => row.source === 'live-session').length, 1);
  assert.equal(f.strip.children.length, 3);
});

test('Home preview for the same link retains one recipient, live presence and the saved receipt status', () => {
  const f = harness(), c = f.context;
  c.isNanahHomeBridgePreviewFresh = () => true;
  c.nanahHomeBridgePreviewState = { configured: true, healthOk: true, candidates: [{
    id: 'home-mira', linkId: 'link-mira', label: 'Shared tablet', profileId: 'mira', profileName: 'Mira',
    source: 'home-bridge-preview', trustState: 'verified', deliveryState: 'Ready', route: 'same-network', canSend: true
  }] };
  f.render(); assert.equal(f.strip.children.length, 2);
  const mira = f.strip.children.find(tile => tile.dataset.familyDeviceId === 'home-mira');
  assert.match(tileText(mira), /Mira.*Waiting for receipt/);
});

test('live tile click → review → unique saved merge → Escape returns to the exact saved recipient', async () => {
  const f = harness(); f.render(false);
  const live = f.strip.children.find(tile => tile.dataset.source === 'live-session');
  live.focus(); live.dispatch('click'); await Promise.resolve(); assert.equal(f.document.activeElement, f.action);
  f.render(true); assert.equal(f.document.activeElement, f.action);
  f.action.dispatch('keydown', { key: 'Escape' });
  assert.equal(f.document.activeElement.dataset.familyDeviceId, 'link-mira');
  assert.equal(f.document.activeElement.dataset.profileId, 'mira');
});

test('former live selection does not return to a sibling or another source parent on Escape', async () => {
  for (const changed of ['sibling', 'parent']) {
    const f = harness(), c = f.context; f.render(false);
    const live = f.strip.children.find(tile => tile.dataset.source === 'live-session');
    live.focus(); live.dispatch('click'); await Promise.resolve();
    if (changed === 'sibling') c.nanahSessionState.remoteProfile = { profileId: 'leo', profileName: 'Leo' };
    else {
      c.nanahTrustedLinks.push({ ...c.nanahTrustedLinks[0], linkId: 'other-parent-mira', sourceProfileId: 'other-parent' });
      c.profilesV4Cache.profiles['other-parent'] = { name: 'Other parent', type: 'account' };
      c.profilesV4Cache.activeProfileId = 'other-parent'; c.activeProfileId = 'other-parent';
    }
    f.render(true); f.action.dispatch('keydown', { key: 'Escape' });
    assert.equal(f.document.activeElement, f.action, changed);
    assert.ok(f.strip.children.every(tile => tile.attributes['aria-pressed'] !== 'true'), changed);
  }
});

test('Escape refuses ambiguous aliases instead of choosing the first same-device row', async () => {
  const f = harness(); f.render(false);
  const live = f.strip.children.find(tile => tile.dataset.source === 'live-session');
  live.focus(); live.dispatch('click'); await Promise.resolve(); f.render(true);
  const duplicate = f.document.createElement('button');
  Object.assign(duplicate.dataset, f.strip.children[0].dataset, { familyDeviceId: 'ambiguous-link' });
  f.strip.appendChild(duplicate);
  f.action.dispatch('keydown', { key: 'Escape' }); assert.equal(f.document.activeElement, f.action);
});

test('a merged idle tile shows Open now as its single short state', () => {
  const f = harness(); f.context.formatNanahManagedSourceAckSyncStatus = () => 'No sent policy'; f.render();
  assert.match(tileText(f.strip.children[0]), /Mira \| Open now/);
  assert.doesNotMatch(tileText(f.strip.children[0]), /Verified device|No sent policy/);
});
