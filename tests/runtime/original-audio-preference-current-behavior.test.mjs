import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

function extractionHelpers() {
  const seed = read('js/seed.js');
  const start = seed.indexOf('    function audioTrackText(value) {');
  const end = seed.indexOf('    function playerTrackDescriptor(track) {');
  assert.ok(start >= 0 && end > start, 'original-audio extraction helpers must remain available');
  const source = seed.slice(start, end);
  return Function(`${source}\nreturn { extractProvenOriginalAudioTrack };`)();
}

test('original-audio extraction prefers a proven non-auto-dubbed original track', () => {
  const { extractProvenOriginalAudioTrack } = extractionHelpers();
  const result = extractProvenOriginalAudioTrack({
    videoDetails: { videoId: 'video-1' },
    streamingData: {
      adaptiveFormats: [
        { audioTrack: { id: 'en.4', languageCode: 'en', displayName: 'English (US) original', audioIsDefault: false, isAutoDubbed: false } },
        { audioTrack: { id: 'ru.10', languageCode: 'ru', displayName: 'Russian', audioIsDefault: true, isAutoDubbed: true } }
      ]
    }
  });

  assert.deepEqual(result, {
    id: 'en.4',
    languageCode: 'en',
    displayName: 'English (US) original',
    audioIsDefault: false,
    isAutoDubbed: false,
    videoId: 'video-1'
  });
});

test('original-audio extraction fails open when only an auto-dubbed default is known', () => {
  const { extractProvenOriginalAudioTrack } = extractionHelpers();
  const result = extractProvenOriginalAudioTrack({
    videoDetails: { videoId: 'video-2' },
    streamingData: {
      formats: [
        { audioTrack: { id: 'de.10', displayName: 'German', audioIsDefault: true, isAutoDubbed: true } }
      ]
    }
  });
  assert.equal(result, null);
});

test('original-audio preference is profile-aware and uses the existing in-page player only', () => {
  const seed = read('js/seed.js');
  const catalog = read('js/content_controls_catalog.js');
  const state = read('js/state_manager.js');
  const shared = read('js/settings_shared.js');
  const background = read('js/background.js');
  const bridge = read('js/content/bridge_settings.js');
  const io = read('js/io_manager.js');

  assert.match(catalog, /key: 'alwaysUseOriginalAudio'/);
  assert.match(catalog, /Always Use Original Audio \(Experimental\)/);
  for (const source of [state, shared, background, bridge, io]) {
    assert.match(source, /alwaysUseOriginalAudio/);
  }

  assert.match(seed, /getAvailableAudioTracks/);
  assert.match(seed, /getAudioTrack/);
  assert.match(seed, /setAudioTrack\(target\.track, true\)/);
  assert.match(seed, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(seed, /document\.addEventListener\('yt-page-data-updated'/);
  assert.match(seed, /originalAudioState\.attempts >= 10/);
  assert.doesNotMatch(seed, /setInterval\([^)]*applyOriginalAudioPreference/);
  assert.match(seed, /document\.location\.hostname\.includes\('youtubekids\.com'\)/);
});

test('help and engineering docs distinguish playback preference from language filtering', () => {
  const help = read('html/tab-view.html');
  const doc = read('docs/ORIGINAL_AUDIO_PREFERENCE_2026-08-18.md');
  assert.match(help, /This is a playback preference, not a language filter/);
  assert.match(help, /There is no caption download, language lookup, or repeated network polling/);
  assert.match(doc, /No additional Player, caption, timed-text, Watch, or language request is made/);
  assert.match(doc, /YouTube Kids is excluded/);
});
