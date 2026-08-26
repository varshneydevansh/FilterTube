import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const seed = fs.readFileSync('js/seed.js', 'utf8');
const domFallback = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
const background = fs.readFileSync('js/background.js', 'utf8');
const stateManager = fs.readFileSync('js/state_manager.js', 'utf8');
const sharedSettings = fs.readFileSync('js/settings_shared.js', 'utf8');
const catalog = fs.readFileSync('js/content_controls_catalog.js', 'utf8');
const help = fs.readFileSync('html/tab-view.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing ${endNeedle}`);
  return source.slice(start, end);
}

test('existing sponsored-content consent owns the Android-style Advert Void runtime', () => {
  assert.match(catalog, /key: 'hideSponsoredCards'[\s\S]*title: 'Send adverts to The Void'/);
  assert.match(seed, /cachedSettings\.hideSponsoredCards === true/);
  assert.match(seed, /const AD_VOID_POLL_MS = 900/);
  assert.match(seed, /window\.setInterval\(runAdVoidPass, AD_VOID_POLL_MS\)/);
});

test('Advert Void is default-on for installs, upgrades, profiles, and missing legacy values', () => {
  assert.match(background, /const ADVERT_VOID_DEFAULT_MIGRATION_KEY = 'advertVoidDefaultV336Applied'/);
  assert.match(background, /function applyAdvertVoidDefaultMigrationOnce\(\)/);
  assert.match(background, /\[ADVERT_VOID_DEFAULT_MIGRATION_KEY\]: true,[\s\S]*hideSponsoredCards: true/);
  assert.match(background, /settings: \{[\s\S]*hideSponsoredCards: true/);
  assert.match(background, /hideSponsoredCards: items\?\.hideSponsoredCards !== false/);
  assert.match(background, /applyAdvertVoidDefaultMigrationOnce\(\)/);
  assert.match(stateManager, /hideSponsoredCards: true/);
  assert.match(stateManager, /state\.hideSponsoredCards = data\.hideSponsoredCards !== false/);
  assert.match(sharedSettings, /hideSponsoredCards: storage\?\.hideSponsoredCards !== false/);
  assert.match(catalog, /title: 'Send adverts to The Void'[\s\S]*description: 'On by default\./);
});

test('Advert Void remains independent of Blocklist and Whitelist mode', () => {
  const enabled = sliceBetween(seed, 'function isAdVoidEnabled() {', '\n    function adVoidPlayerRoot');
  assert.match(enabled, /cachedSettings\.hideSponsoredCards === true/);
  assert.doesNotMatch(enabled, /listMode|blocklist|whitelist/);
  assert.match(help, /both Blocklist and Whitelist modes/);
});

test('Advert Void removes observed Player ad plans before YouTube schedules playback', () => {
  assert.match(seed, /const AD_VOID_PLAYER_PLAN_KEYS = new Set/);
  assert.match(seed, /'playerAds'/);
  assert.match(seed, /'adPlacements'/);
  assert.match(seed, /'adSlots'/);
  assert.match(seed, /'adBreakHeartbeatParams'/);
  assert.match(seed, /adVoidRemovePlayerAdPlan\(data, dataName\)/);
  assert.match(seed, /'player-ad-plan-removed'/);
  assert.match(seed, /settings\.hideSponsoredCards === true/);
  assert.match(seed, /'\/youtubei\/v1\/get_watch'/);
});

test('ad recognition requires player interruption or visible ad evidence', () => {
  const detection = sliceBetween(seed, 'function adVoidHasInterruption(player) {', '\n    function adVoidCaptureAudio');
  assert.match(detection, /className\.includes\('ad-showing'\) && className\.includes\('ad-interrupting'\)/);
  assert.match(detection, /!adVoidNodeIsVisible\(candidate\)/);
  assert.match(detection, /selector === '\.video-ads'/);
  assert.match(detection, /selector === '\.ytp-ad-module'/);
  assert.match(detection, /!adVoidContainerHasSignal\(candidate\)/);
});

test('active adverts are muted before scoped skip, parallel content, or confirmed ad advancement', () => {
  const pass = sliceBetween(seed, 'function runAdVoidPass() {', '\n    function syncAdVoidRuntime');
  assert.ok(pass.indexOf('adVoidQuarantine(adVideo, player, contentVideo);') < pass.indexOf('adVoidClickSkip(player)'));
  assert.match(pass, /adVoidClickSkip\(player\)/);
  assert.match(pass, /adVoidStartParallelContent\(contentVideo\)/);
  assert.match(pass, /adVoidAdvanceConfirmedAd\(adVideo, player, expectedDuration\)/);
  assert.match(seed, /contentVideo\.play\(\)/);
  assert.match(seed, /player\.contains\(adVideo\)/);
  assert.match(seed, /currentPlayerVideo !== adVideo/);
  assert.match(seed, /hasAdShowing\s*&&\s*hasAdInterrupting\s*&&\s*differsFromRequestedContent/);
  assert.match(seed, /if \(!hasImmediatePlayerIdentity && !adVoidContainerHasSignal\(player\)\) return false/);
  assert.match(seed, /adVoidContainerHasSignal\(player\)/);
  assert.match(seed, /adVideo\.currentTime = safeEnd/);
  assert.match(seed, /Math\.abs\(playerDuration - duration\) <= 0\.75/);
  assert.match(seed, /player\.seekTo\(safeEnd, true\)/);
  assert.match(seed, /playerSeekApplied/);
  assert.match(pass, /confirmed-ad-advanced-awaiting-transition/);
});

test('media-role discovery cannot classify an inline preview as Watch content', () => {
  const roles = sliceBetween(seed, 'function adVoidMediaRoles(player) {', '\n    function adVoidNodeIsVisible');
  assert.match(roles, /player\?\.querySelectorAll\?\.\('video'\)/);
  assert.match(roles, /player\.contains\(video\)/);
  assert.doesNotMatch(roles, /document\.querySelectorAll\('video\.html5-main-video'\)/);
});

test('Advert Void diagnostics expose bounded transition and playback evidence', () => {
  const runtime = sliceBetween(seed, 'const AD_VOID_POLL_MS = 900;', '\n    function isOriginalAudioPreferenceEnabled');
  assert.match(runtime, /window\.__filtertubeAdVoidLog/);
  assert.match(runtime, /history\.length > 100/);
  assert.match(runtime, /\[FilterTube\]\[Advert Void\]/);
  assert.match(runtime, /'ad-detected'/);
  assert.match(runtime, /'media-roles'/);
  assert.match(runtime, /'waiting-for-requested-content'/);
  assert.match(runtime, /'content-play-requested'/);
  assert.match(runtime, /'content-play-started'/);
  assert.match(runtime, /'content-play-rejected'/);
  assert.match(runtime, /'content-paused-during-ad'/);
  assert.match(runtime, /'confirmed-ad-advanced'/);
  assert.match(runtime, /'ad-ended'/);
  assert.match(runtime, /'requested-content-ready'/);
  assert.match(runtime, /placement = 'pre-roll'/);
  assert.match(runtime, /placement = 'post-roll'/);
  assert.match(runtime, /placement = 'mid-roll'/);
  assert.match(runtime, /transitionMs/);
  assert.match(seed, /document\.addEventListener\('durationchange', runAdVoidPass, true\)/);
  assert.match(seed, /document\.addEventListener\('canplay', runAdVoidPass, true\)/);
});

test('active ad frames are covered by the player state itself', () => {
  assert.match(seed, /data-filtertube-ad-void-enabled/);
  assert.match(seed, /\.html5-video-player\.ad-showing\.ad-interrupting video/);
  assert.doesNotMatch(seed, /\.html5-video-player\.ad-showing video,/);
  assert.doesNotMatch(seed, /\.html5-video-player\.ad-interrupting video \{/);
  assert.doesNotMatch(seed, /Sending advert to The Void/);
  assert.match(seed, /video\[data-filtertube-ad-void-content="true"\]/);
  assert.doesNotMatch(seed, /\.html5-video-player\.ad-created video/);
});

test('Advert Void does not activate generic renderer rescans', () => {
  const activeWork = sliceBetween(
    domFallback,
    'function hasActiveDOMFallbackWork(settings) {',
    'function clearStaleDOMFallbackVisibility() {'
  );
  const hasActiveWork = Function(`${activeWork}; return hasActiveDOMFallbackWork;`)();
  assert.doesNotMatch(activeWork, /'hideSponsoredCards'/);
  assert.match(domFallback, /if \(settings\.hideSponsoredCards\) \{[\s\S]*ytd-ad-slot-renderer/);
  assert.equal(hasActiveWork({ enabled: true, listMode: 'blocklist', hideSponsoredCards: true }), false);
});

test('the extension restores user audio and owns no network-blocking path', () => {
  const runtime = sliceBetween(seed, 'const AD_VOID_POLL_MS = 900;', '\n    function isOriginalAudioPreferenceEnabled');
  assert.match(runtime, /function adVoidCaptureAudio/);
  assert.match(runtime, /function adVoidRestoreAudio/);
  assert.match(runtime, /player\.setVolume\(snapshot\.playerVolume\)/);
  assert.match(runtime, /video\.muted = snapshot\.videoMuted/);
  assert.match(runtime, /window\.clearInterval\(adVoidState\.timer\)/);
  assert.doesNotMatch(runtime, /fetch\s*\(|XMLHttpRequest|webRequest|declarativeNetRequest/);
});

test('Help explains Player-plan prevention and the guarded fallback', () => {
  assert.match(help, /Send adverts to The Void/);
  assert.match(help, /default-on control/);
  assert.match(help, /applies on YouTube Main and YouTube Kids/);
  assert.match(help, /removes the observed advert plan from YouTube's existing Player response/);
  assert.match(help, /does not create extra YouTube API traffic/);
  assert.match(help, /advances only positively identified advert media/);
  assert.match(help, /prevent recommendation previews or the requested video from being advanced/);
  assert.match(help, /player-ad-plan-removed/);
});

test('the same default-on MAIN-world runtime is installed on Main and Kids', () => {
  const seedRegistration = manifest.content_scripts.find(entry => (
    entry.world === 'MAIN' && Array.isArray(entry.js) && entry.js.includes('js/seed.js')
  ));
  assert.ok(seedRegistration);
  assert.ok(seedRegistration.matches.includes('*://*.youtube.com/*'));
  assert.ok(seedRegistration.matches.includes('*://*.youtubekids.com/*'));
  assert.match(catalog, /Remove YouTube ad plans before playback and quietly suppress any advert that still reaches the player on YouTube and YouTube Kids/);
});
