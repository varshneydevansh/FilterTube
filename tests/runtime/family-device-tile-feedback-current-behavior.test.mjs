import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const start = source.indexOf('    function getNanahDevicePickerTileState(');
const end = source.indexOf('    function selectNanahLiveMapDevice(', start);
const box = {
  safeObject: value => value || {},
  normalizeString: value => typeof value === 'string' ? value.trim() : '',
  familyDeviceMapCopy: value => value,
  familyDeviceMapDeliveryStatus: value => value === 'ready-live' ? 'Open now' : value
};
vm.runInNewContext(source.slice(start, end), box);
const state = (deliveryState, trustState = 'verified') => box.getNanahDevicePickerTileState({ deliveryState, trustState });

test('partial, pending and diagnostic statuses never become a whole-update Applied badge', () => {
  assert.equal(state('1/3 updates applied | 1 rejected | 1 waiting for receipt'), 'Partly applied');
  assert.equal(state('1 rejected | 2 waiting for receipt'), 'Review update status');
  assert.equal(state('Waiting for send receipt'), 'Waiting for receipt');
  assert.equal(state('Applied'), 'Applied');
  assert.equal(state('Rejected'), 'Rejected');
});

test('saved trust never claims online presence and revoked trust takes priority over old receipts', () => {
  assert.equal(state('Ready'), 'Verified device');
  assert.equal(state('No sent policy'), 'Verified device');
  assert.equal(state('ready-live', 'verified-live'), 'Open now');
  assert.equal(state('Applied', 'revoked'), 'Pairing removed');
  assert.equal(state('Applied', 'needs-pairing'), 'Pair again');
  assert.equal(state('ready-live', 'pairing'), 'Match safety phrase');
});
