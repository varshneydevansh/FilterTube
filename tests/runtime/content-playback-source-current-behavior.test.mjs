import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const planner = require('../../js/shared/content_playback_source.js');
const videoId = 'abcdefghijk';
const now = 1700000000000;
const sourceUrl = 'https://rr1---sn-example.googlevideo.com/videoplayback?expire=1900000000&id=synthetic&sig=unchanged%2Bsignature';
const copy = value => JSON.parse(JSON.stringify(value));
const format = (changes = {}) => ({
  itag: 18, url: sourceUrl, mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"',
  width: 640, height: 360, qualityLabel: '360p', bitrate: 500000, ...changes
});
function response(changes = {}) {
  return { videoDetails: { videoId, title: 'Synthetic 音楽', lengthSeconds: '215' },
    playabilityStatus: { status: 'OK' }, streamingData: { formats: [format()] }, ...changes };
}
const plan = (payload = response(), changes = {}) => planner.plan({
  playerResponse: payload, videoId, now, canPlayType: mime => mime.startsWith('video/mp4') ? 'probably' : '', ...changes
});

test('module loads as packaged browser global and CommonJS with no DOM, fetch or remote evaluator', () => {
  const context = { URL, Date, console: { log() { assert.fail('planner must not log signed sources'); } } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('js/shared/content_playback_source.js', 'utf8'), context);
  assert.equal(typeof context.FilterTubeContentPlaybackSource.plan, 'function');
  const result = context.FilterTubeContentPlaybackSource.plan({ playerResponse: response(), videoId, now, canPlayType: () => 'maybe' });
  assert.equal(result.supported, true);
  assert.equal(result.source.url, sourceUrl);
});

test('chooses compatible progressive muxed source without mutating response or signed URL', () => {
  const payload = response(); const before = copy(payload);
  const result = plan(payload);
  assert.equal(result.supported, true);
  assert.equal(result.reason, 'direct_progressive');
  assert.equal(result.source.kind, 'progressive');
  assert.equal(result.source.hasAudio, true); assert.equal(result.source.hasVideo, true);
  assert.equal(result.source.url, sourceUrl);
  assert.equal(result.source.expiresAt, 1900000000000);
  assert.deepEqual(result.video, { id: videoId, title: 'Synthetic 音楽', durationSeconds: 215, isLive: false });
  assert.deepEqual(payload, before);
});

test('selects the best compatible muxed source while explicitly classifying unsupported alternatives', () => {
  const payload = response({ streamingData: {
    formats: [format(), format({ itag: 22, height: 720, width: 1280 }), format({ itag: 37, height: 1080, mimeType: 'video/webm; codecs="vp9, opus"' })],
    adaptiveFormats: [format({ mimeType: 'audio/mp4; codecs="mp4a.40.2"' })],
    hlsManifestUrl: 'https://example.invalid/hls', serverAbrStreamingUrl: 'https://example.invalid/sabr'
  } });
  const result = plan(payload);
  assert.equal(result.source.itag, 22);
  assert.equal(result.unsupported.incompatible, 1);
  assert.equal(result.unsupported.adaptive, 1); assert.equal(result.unsupported.manifest, 1); assert.equal(result.unsupported.sabr, 1);
});

for (const payload of [response(), { playerResponse: response() }, { player_response: response() }, [{ responseContext: {} }, { playerResponse: response() }]]) {
  test(`observed Player envelope ${Array.isArray(payload) ? 'streamed array' : Object.keys(payload)[0]} resolves exact identity`, () => {
    assert.equal(plan(payload).supported, true);
  });
}

for (const [name, payload, changes, reason] of [
  ['missing response', null, {}, 'missing_player_response'],
  ['bad requested id', response(), { videoId: 'bad' }, 'invalid_video_id'],
  ['foreign response', response({ videoDetails: { videoId: 'foreignABCD', lengthSeconds: '215' } }), {}, 'video_identity_mismatch'],
  ['ambiguous responses', [response(), { playerResponse: response() }], {}, 'ambiguous_player_response'],
  ['LOGIN_REQUIRED', response({ playabilityStatus: { status: 'LOGIN_REQUIRED' } }), {}, 'playability_not_ok'],
  ['missing playability', response({ playabilityStatus: undefined }), {}, 'playability_not_ok'],
  ['live content', response({ videoDetails: { videoId, isLiveContent: true } }), {}, 'live_unsupported'],
  ['live streamability', response({ playabilityStatus: { status: 'OK', liveStreamability: {} } }), {}, 'live_unsupported'],
  ['DRM source', response({ streamingData: { formats: [format()], drmFamilies: ['WIDEVINE'] } }), {}, 'drm_unsupported'],
  ['codec probe absent', response(), { canPlayType: undefined }, 'codec_probe_required'],
  ['codec unsupported', response(), { canPlayType: () => '' }, 'codec_unsupported'],
  ['codec probe throws', response(), { canPlayType: () => { throw Error('unsupported'); } }, 'codec_unsupported']
]) {
  test(`fails closed on ${name}`, () => {
    const result = plan(payload, changes);
    assert.equal(result.supported, false); assert.equal(result.reason, reason); assert.equal(result.source, null);
    assert.equal(JSON.stringify(result).includes('unchanged%2Bsignature'), false, 'unsupported results never expose signed source URLs');
  });
}

for (const url of [
  'http://rr1.googlevideo.com/videoplayback', 'https://googlevideo.com.evil.invalid/videoplayback',
  'https://evilgooglevideo.com/videoplayback', 'https://googlevideo.com@evil.invalid/videoplayback',
  'https://user:pass@rr1.googlevideo.com/videoplayback', 'https://rr1.googlevideo.com:444/videoplayback',
  'https://rr1.googlevideo.com/other', 'https://rr1.googlevideo.com/videoplayback#fragment',
  'blob:https://www.youtube.com/synthetic', 'javascript:alert(1)', 'data:video/mp4,synthetic'
]) {
  test(`rejects unsafe or unowned source URL ${url.split('?')[0]}`, () => {
    assert.equal(plan(response({ streamingData: { formats: [format({ url })] } })).reason, 'source_url_invalid');
  });
}

for (const [changes, reason] of [
  [{ signatureCipher: 'url=synthetic&s=secret' }, 'cipher_unsupported'],
  [{ cipher: 'url=synthetic&s=secret' }, 'cipher_unsupported'],
  [{ url: `${sourceUrl}&n=unresolved` }, 'throttling_transform_required'],
  [{ url: sourceUrl.replace('1900000000', '1600000000') }, 'source_expired'],
  [{ url: sourceUrl.replace('1900000000', 'notanumber') }, 'source_expired'],
  [{ url: `${sourceUrl}&expire=1900000001` }, 'source_expired'],
  [{ mimeType: 'video/mp4; codecs="avc1.42001E"' }, 'muxed_format_unavailable'],
  [{ mimeType: 'audio/mp4; codecs="mp4a.40.2"' }, 'muxed_format_unavailable'],
  [{ width: true }, 'muxed_format_unavailable']
]) {
  test(`classifies progressive record limitation as ${reason}: ${Object.keys(changes)[0]}`, () => {
    assert.equal(plan(response({ streamingData: { formats: [format(changes)] } })).reason, reason);
  });
}

for (const [streamingData, reason] of [
  [{ adaptiveFormats: [format()] }, 'adaptive_unsupported'],
  [{ serverAbrStreamingUrl: 'https://example.invalid/sabr' }, 'sabr_unsupported'],
  [{ hlsManifestUrl: 'https://example.invalid/hls' }, 'manifest_unsupported'],
  [{ dashManifestUrl: 'https://example.invalid/dash' }, 'manifest_unsupported'],
  [{}, 'media_source_unavailable'],
  [{ formats: Array.from({ length: 257 }, () => format()) }, 'source_metadata_limit']
]) {
  test(`does not pretend ${reason} is directly playable`, () => {
    assert.equal(plan(response({ streamingData })).reason, reason);
  });
}

const captionTrack = (changes = {}) => ({ vssId: '.en', languageCode: 'en', name: { simpleText: 'English' },
  baseUrl: 'https://www.youtube.com/api/timedtext?v=abcdefghijk&sig=caption-secret', ...changes });
const withCaptions = tracks => response({ captions: { playerCaptionsTracklistRenderer: { captionTracks: tracks } } });
test('caption availability blocks default handoff and exposes bounded capabilities without signed URLs', () => {
  const result = plan(withCaptions([captionTrack()]));
  assert.equal(result.reason, 'captions_unsupported');
  assert.equal(result.capabilities.captions.tracks[0].languageCode, 'en');
  assert.equal(JSON.stringify(result).includes('caption-secret'), false);
});
test('native VTT handoff requires explicit opt-in and an actual VTT URL for the selected track', () => {
  const payload = withCaptions([captionTrack({ baseUrl: `${captionTrack().baseUrl}&fmt=vtt` }), captionTrack({ vssId: '.hi', languageCode: 'hi' })]);
  assert.equal(plan(payload, { requirements: { captionMode: 'native_vtt' } }).reason, 'caption_format_unsupported');
  const result = plan(payload, { requirements: { captionMode: 'native_vtt', captionTrackId: '.en' } });
  assert.equal(result.supported, true);
  assert.equal(result.source.captionTracks.length, 1);
  assert.equal(result.source.captionTracks[0].url, `${captionTrack().baseUrl}&fmt=vtt`);
});
for (const captions of [{}, [], 'malformed', { playerCaptionsTracklistRenderer: { captionTracks: [captionTrack({ baseUrl: 'https://evil.invalid/api/timedtext?fmt=vtt' })] } }]) {
  test(`malformed caption metadata does not silently disable captions: ${JSON.stringify(captions).slice(0, 32)}`, () => {
    assert.equal(plan(response({ captions })).reason, 'caption_metadata_invalid');
  });
}
test('requested missing or ambiguous captions remain unsupported', () => {
  assert.equal(plan(response(), { requirements: { captionsRequired: true } }).reason, 'caption_track_unavailable');
  const vtt = captionTrack({ baseUrl: `${captionTrack().baseUrl}&fmt=vtt` });
  assert.equal(plan(withCaptions([vtt, vtt]), { requirements: { captionMode: 'native_vtt', captionTrackId: '.en' } }).reason, 'caption_track_ambiguous');
});

test('audio preference must match exact embedded track; default or language alone never proves original audio', () => {
  const dubbed = { id: 'hi.1', languageCode: 'hi', displayName: 'Hindi', audioIsDefault: true, isAutoDubbed: true };
  const original = { id: 'en.4', languageCode: 'en', displayName: 'English (original)', isAutoDubbed: false };
  const payload = response({ streamingData: { formats: [format({ audioTrack: dubbed }), format({ itag: 22, audioTrack: original })] } });
  assert.equal(plan(payload, { requirements: { audioTrackId: 'en.4' } }).source.itag, 22);
  assert.equal(plan(payload, { requirements: { preferOriginalAudio: true } }).source.itag, 22);
  assert.equal(plan(payload, { requirements: { audioTrackId: 'en.3' } }).reason, 'audio_preference_unsupported');
  assert.equal(plan(response(), { requirements: { preferOriginalAudio: true } }).reason, 'audio_preference_unsupported');
  const unproven = response({ streamingData: { formats: [format({ audioTrack: { id: 'en', languageCode: 'en', audioIsDefault: true, isAutoDubbed: false } })] } });
  assert.equal(plan(unproven, { requirements: { preferOriginalAudio: true } }).reason, 'audio_preference_unsupported');
});
