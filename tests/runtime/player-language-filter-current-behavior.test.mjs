import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../js/injector.js', import.meta.url), 'utf8');
const start = source.indexOf('    function normalizeVideoLanguageCode');
const end = source.indexOf('    function extractVideoMetaFromPlayerResponse', start);
assert.ok(start >= 0 && end > start, 'language extraction helpers must remain present');

const context = {};
vm.createContext(context);
vm.runInContext(`${source.slice(start, end)}\nthis.extract = extractVideoLanguageFromPlayerResponse;`, context);

const player = renderer => ({ captions: { playerCaptionsTracklistRenderer: renderer } });

assert.deepEqual(
  JSON.parse(JSON.stringify(context.extract({
    streamingData: {
      adaptiveFormats: [
        { mimeType: 'audio/webm', audioTrack: { id: 'ru.10', displayName: 'Russian', audioIsDefault: false, isAutoDubbed: true } },
        { mimeType: 'audio/webm', audioTrack: { id: 'en-US.4', displayName: 'English (US) original', audioIsDefault: true } }
      ]
    },
    captions: {
      playerCaptionsTracklistRenderer: {
        defaultAudioTrackIndex: 0,
        audioTracks: [{ audioTrackId: 'ru.10', defaultCaptionTrackIndex: 0, captionTrackIndices: [0] }],
        captionTracks: [{ languageCode: 'en', kind: 'asr' }]
      }
    }
  }))),
  { languageCode: 'en-US', languageSource: 'default-audio-format', languageConfidence: 'high' },
  'explicit original/default audio format wins over auto-dub and shared caption linkage'
);

assert.deepEqual(
  JSON.parse(JSON.stringify(context.extract(player({
    defaultAudioTrackIndex: 1,
    audioTracks: [
      { defaultCaptionTrackIndex: 0, captionTrackIndices: [0] },
      { defaultCaptionTrackIndex: 1, captionTrackIndices: [1] }
    ],
    captionTracks: [
      { languageCode: 'es', kind: 'asr' },
      { languageCode: 'pt-BR', kind: 'asr' }
    ],
    translationLanguages: [{ languageCode: 'en' }]
  })))),
  { languageCode: 'pt-BR', languageSource: 'default-asr-track', languageConfidence: 'high' },
  'the default audio mapping wins; translation choices do not'
);

assert.equal(context.extract(player({
  audioTracks: [{ captionTrackIndices: [0, 1] }],
  captionTracks: [{ languageCode: 'ru', kind: 'asr' }, { languageCode: 'en' }]
})).languageCode, 'ru', 'one linked ASR track is strong spoken-language evidence');

assert.equal(context.extract(player({
  audioTracks: [{ captionTrackIndices: [0, 1] }],
  captionTracks: [{ languageCode: 'en' }, { languageCode: 'fr' }]
})).languageCode, 'und', 'ambiguous caption languages are never guessed');

assert.deepEqual(
  JSON.parse(JSON.stringify(context.extract({}))),
  { languageCode: 'und', languageSource: 'player-unavailable-v2', languageConfidence: 'unknown' },
  'missing evidence is explicit and uses the current negative-cache version'
);

assert.deepEqual(
  JSON.parse(JSON.stringify(context.extract({
    videoDetails: {
      title: 'Nyusha & Артем Качер – между нами',
      shortDescription: 'русская музыка между нами',
      keywords: ['нюша', 'музыка', 'русская']
    }
  }))),
  { languageCode: 'ru', languageSource: 'player-metadata-script', languageConfidence: 'medium' },
  'captionless Player metadata can supply strong Russian script evidence'
);

assert.equal(context.extract({
  videoDetails: { title: 'An ordinary video', shortDescription: 'No audio language is declared.' }
}).languageCode, 'und', 'Latin-script metadata is not guessed without authoritative audio evidence');

const bridge = fs.readFileSync(new URL('../../js/content_bridge.js', import.meta.url), 'utf8');
assert.match(bridge, /needLanguage: Boolean\(left\.needLanguage \|\| right\.needLanguage\)/);
assert.match(bridge, /needCategory: missingCategory,[\s\S]*needLanguage: missingLanguage/);
assert.match(bridge, /languageSource === 'player-unavailable'/);
assert.match(bridge, /languageSource === 'player-unavailable'[\s\S]*missingLanguage = needsLanguage/);

const fallback = fs.readFileSync(new URL('../../js/content/dom_fallback.js', import.meta.url), 'utf8');
assert.match(fallback, /getLanguagePolicyDecision/);
assert.match(fallback, /data-filtertube-hidden-by-language/);
assert.match(fallback, /data-filtertube-pending-language/);
assert.doesNotMatch(fallback, /if \(languageExplicitlyUnavailable && mode === 'allow'\)\s*\{\s*hideByLanguage = true/);
assert.match(fallback, /const requiresKnownMetadata = decision === 'unknown' && policy\?\.mode === 'allow'/);
assert.doesNotMatch(
  fallback,
  /policy\?\.mode === 'allow' \|\| languagePolicy\?\.mode === 'allow'/,
  'language allow-only must not activate the strict Category rail veil'
);
assert.match(
  fallback,
  /languageDecision === 'unknown'[\s\S]*setWatchRailCategoryState\(card, 'allowed'/,
  'unresolved rail language remains provisionally visible'
);

assert.doesNotMatch(bridge, /const pendingAttr = missingCategory \? 'data-filtertube-pending-category' : 'data-filtertube-pending-language'/);

const filterLogic = fs.readFileSync(new URL('../../js/filter_logic.js', import.meta.url), 'utf8');
assert.match(filterLogic, /if \(code === 'und'\) return false;/, 'JSON continuation filtering must keep unresolved language renderers');

const tabView = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
assert.match(tabView, /id="languageFilter_panel" class="language-filter-picker" style="display: none;"/);
assert.doesNotMatch(tabView, /id="languageFilter_panel" class="ft-category-panel"/);
assert.doesNotMatch(tabView, /id="languageFilter_panel"[^>]*data-ft-control-row/);
assert.match(tabView, /getLanguageOptions/);
assert.match(tabView, /languagePanelMain\.style\.display = enabled \? 'block' : 'none'/);
assert.match(tabView, /languageModeMain\.disabled = !enabled/);
assert.match(tabView, /languageEnabledMain\?\.addEventListener\('change'/);
assert.match(tabView, /Language Filters <span class="ft-experimental-badge">Experimental<\/span>/);
assert.match(tabView, /contentTab\.appendChild\(languageFiltersSection\)/, 'Language Filters belongs at the bottom of Main Content Controls');
assert.doesNotMatch(tabView, /categoryFiltersSection\.insertAdjacentElement\('afterend', languageFiltersSection\)/);
assert.doesNotMatch(tabView, /document\.getElementById\('languageFilter_enabled'\)\?\.addEventListener/);

const popup = fs.readFileSync(new URL('../../js/popup.js', import.meta.url), 'utf8');
assert.match(popup, /languageMode\.disabled = !languageEnabled\.checked/);
assert.match(popup, /languagePanel\.style\.display = languageEnabled\.checked \? 'block' : 'none'/);
assert.match(popup, /Language Filters <span class="ft-experimental-badge">Experimental<\/span>/);
assert.match(popup, /contentTab\.appendChild\(languageGroup\)/, 'popup keeps experimental Language Filters after stable controls');
assert.doesNotMatch(popup, /categoryGroup\.insertAdjacentElement\('afterend', languageGroup\)/);

const tabViewCss = fs.readFileSync(new URL('../../css/tab-view.css', import.meta.url), 'utf8');
assert.match(tabViewCss, /\.language-filter-picker\s*\{[\s\S]*?display:\s*block/);

console.log('player language filtering behavior: ok');
