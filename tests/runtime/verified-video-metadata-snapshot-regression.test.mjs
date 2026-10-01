import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const extract = (path, start, end) => {
    const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
    return source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
};
const id = 'gVRlg4BXKVo';
const verified = { channelId: 'UCabcdefghijklmnopqrstuv', channelName: 'English Speeches', title: 'Education', identityVerified: true, textVerified: true };
const retentionSource = extract('../../js/content/bridge_settings.js', 'function retainVerifiedVideoMetadata(', 'function sendSettingsToMainWorld(');
const ingestionSource = extract('../../js/content_bridge.js', 'function persistVideoMetaMapping(', 'let pendingVideoMetaDomRerunTimer');

test('playlist filtering has no autonomous skip scheduler and retains explicit navigation', () => {
    const source = fs.readFileSync(new URL('../../js/content/dom_fallback.js', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /__filtertubePlaylistAutoplayGuardInstalled|__filtertubeLastPlaylistSkipTs/);
    assert.doesNotMatch(source, /nextBtn\.click\(\)|target\.click\(\)/);
    assert.match(source, /event\.preventDefault\(\);[\s\S]*targetLink\.click\(\)/);
});

test('settings refresh retains exact-video verification without changing disabled state or rules', () => {
    const context = vm.createContext({ window: {}, currentSettings: { videoMetaMap: { [id]: verified } } });
    vm.runInContext(retentionSource, context);
    const settings = { enabled: false, filterChannels: ['Shakira'], videoMetaMap: { [id]: { channelName: 'Shakira', title: 'Unverified hint' } } };
    context.retainVerifiedVideoMetadata(settings);
    assert.equal(settings.enabled, false);
    assert.deepEqual(settings.filterChannels, ['Shakira']);
    assert.equal(settings.videoMetaMap[id].channelName, 'English Speeches');
    assert.equal(settings.videoMetaMap[id].title, 'Education');
    assert.equal(settings.videoMetaMap[id].identityVerified, true);
    const fresh = { videoMetaMap: { [id]: { ...verified, channelName: 'Verified correction' } } };
    context.retainVerifiedVideoMetadata(fresh);
    assert.equal(fresh.videoMetaMap[id].channelName, 'Verified correction');
    assert.equal(fresh.videoMetaMap.otherVideo1, undefined);
});

test('unverified metadata is never promoted by the snapshot cache', () => {
    const context = vm.createContext({ window: {}, currentSettings: { videoMetaMap: { [id]: { channelName: 'Hint' } } } });
    vm.runInContext(retentionSource, context);
    const settings = { videoMetaMap: {} };
    context.retainVerifiedVideoMetadata(settings);
    assert.equal(settings.videoMetaMap[id], undefined);
});

test('unverified ingestion cannot overwrite verified channel or text, but verified corrections can', () => {
    const sent = [];
    const context = vm.createContext({ currentSettings: { videoMetaMap: {} }, persistVideoChannelMapping() {}, browserAPI_BRIDGE: { runtime: { sendMessage(message) { sent.push(message); } } } });
    vm.runInContext(ingestionSource, context);
    context.persistVideoMetaMapping([{ videoId: id, ...verified }]);
    context.persistVideoMetaMapping([{ videoId: id, channelName: 'Shakira', channelId: 'UCwrongwrongwrongwrongwrong', title: 'Wrong title' }]);
    assert.equal(context.currentSettings.videoMetaMap[id].channelName, 'English Speeches');
    assert.equal(context.currentSettings.videoMetaMap[id].title, 'Education');
    context.persistVideoMetaMapping([{ videoId: id, ...verified, title: 'Verified correction' }]);
    assert.equal(context.currentSettings.videoMetaMap[id].title, 'Verified correction');
    assert.ok(sent.length > 0);
    assert.equal(sent.at(-1).entries[0].identityVerified, undefined);
    assert.equal(sent.at(-1).entries[0].textVerified, undefined);
});
