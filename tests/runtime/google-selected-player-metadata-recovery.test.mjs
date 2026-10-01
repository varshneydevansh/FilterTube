import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('js/content/external_youtube_network.js', 'utf8');
function load(href, responseId = 'gVRlg4BXKVo') {
    const posted = [];
    const context = { URL, Promise, location: { href },
        document: { addEventListener() {}, querySelectorAll() { return []; }, getElementById() {
            return { getPlayerResponse: () => ({ videoDetails: { videoId: responseId, author: 'English Speeches', channelId: `UC${'a'.repeat(22)}`, title: 'Education' } }), getVideoData: () => ({ video_id: responseId }) };
        } }, addEventListener() {}, postMessage(message) { posted.push(message); } };
    context.window = context;
    vm.runInNewContext(source, context);
    context.FilterTubeExternalYouTubeNetwork.acceptControlMessage({ source: 'filtertube-external-guard', type: 'FilterTube_ExternalYouTubeAdmissionControl', active: true, revision: 1 });
    return posted;
}

test('explicitly selected Google player recovers its loaded API metadata immediately', () => {
    const posted = load('https://www.google.com/search?q=shakira#fpstate=ive&vld=cid:abc,vid:gVRlg4BXKVo,st:0');
    const metadata = posted.find(message => message.type === 'FilterTube_ExternalYouTubeMetadata')?.payload;
    assert.equal(metadata?.videoId, 'gVRlg4BXKVo');
    assert.equal(metadata?.channelName, 'English Speeches');
    assert.equal(metadata?.identityVerified, true);
});

test('search hover previews and stale player responses cannot create recovery candidates', () => {
    assert.equal(load('https://www.google.com/search?q=shakira').length, 0);
    assert.equal(load('https://www.google.com/search?q=shakira#vld=vid:gVRlg4BXKVo').length, 0);
    assert.equal(load('https://www.google.com/search?q=shakira#fpstate=ive&vld=vid:0CCwuWQiLTA').length, 0);
});
