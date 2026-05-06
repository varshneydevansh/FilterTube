# JSON-First Filtering Plan

## Purpose

FilterTube should hide matching YouTube content before YouTube paints it whenever the data is already available in JSON. DOM filtering should remain as a safety net, not the primary path for normal video title, description, channel, mix, playlist, Shorts, or comment keyword decisions.

The current pain point is visible flash: a card can render first, then `applyDOMFallback()` hides it after mutation/DOM scan. For simple blocklist keywords like `pitbull`, that feels wrong because the JSON response already includes the title and often description, channel, video ID, playlist ID, and metadata.

## Current Pipeline

```text
YouTube response JSON
  -> seed.js / injector.js intercepts or sees data
  -> filter_logic.js recursively mutates JSON
  -> YouTube renders remaining JSON
  -> content DOM appears
  -> dom_fallback.js scans rendered cards/comments/shelves
  -> content_bridge.js adds identity/menu/quick-block support
```

The intended order is already present, but JSON extraction is uneven across renderer families. When JSON filtering misses a renderer or field, DOM fallback catches it late.

## Desired Pipeline

```text
Raw YouTube JSON
  -> Normalize each content renderer into FilterTubeCandidate
  -> Run one policy decision function
  -> Remove blocked JSON item before paint
  -> Persist useful identity/meta maps
  -> DOM fallback only handles misses, UI affordances, and stale cleanup
```

## Candidate Shape

Create a normalized internal shape used by JSON filtering before any hide/allow decision:

```js
{
  rendererType: '',
  wrapperRendererType: '',
  surface: '',
  videoId: '',
  playlistId: '',
  title: '',
  description: '',
  tags: [],
  metadataText: '',
  durationText: '',
  publishedTimeText: '',
  viewCountText: '',
  channel: {
    id: '',
    handle: '',
    customUrl: '',
    name: '',
    logo: ''
  },
  collaborators: [],
  isMix: false,
  isShort: false,
  isPlaylist: false,
  isComment: false,
  isStructural: false
}
```

## Files To Change

### `js/filter_logic.js`

Primary work happens here.

Current important functions:

- `flattenText()`
- `getByPath()`
- `getTextFromPaths()`
- `FILTER_RULES`
- `YouTubeDataFilter._unwrapRendererForFiltering()`
- `YouTubeDataFilter._shouldBlock()`
- `YouTubeDataFilter.filter()`
- `YouTubeDataFilter.processData()`
- `window.FilterTubeEngine.processData()`

Planned additions:

- `buildCandidate(item, rendererType, wrapperRendererType)`
- `extractCandidateText(item, rules, rendererType)`
- `extractCandidateChannel(item, rules, rendererType)`
- `extractCandidateCollaborators(item, rendererType)`
- `extractCandidateFlags(item, rendererType)`
- `shouldHideCandidate(candidate, settings)`
- `getCandidateRemovalPolicy(rendererType, wrapperRendererType)`

Planned changes:

- Keep `FILTER_RULES`, but treat it as a path table feeding `buildCandidate()`.
- Move keyword/channel/whitelist/blocklist decision logic out of `_shouldBlock()` into `shouldHideCandidate()`.
- Make `_shouldBlock()` a thin wrapper:

```js
const candidate = this.buildCandidate(item, rendererType, wrapperRendererType);
return this.shouldHideCandidate(candidate);
```

- Ensure keyword matching uses:

```text
title + description + tags + metadataText
```

not only a visible DOM title.

### `js/seed.js`

This remains the earliest interception point.

Current responsibility:

- Intercept/stash YouTube JSON response roots.
- Forward/update settings and intercepted response data.

Planned changes:

- Confirm every intercepted browse/search/next/player response passes through `FilterTubeEngine.processData()`.
- Add debug counters only behind `window.__filtertubeDebug`.
- Do not add blocking decisions here. Keep seed as pipeline plumbing.

### `js/injector.js`

This remains the main-world helper for YouTube internals.

Current responsibility:

- Access `ytInitialData`, network snapshots, and collaborator/identity roots.
- Respond to isolated-world requests.

Planned changes:

- Keep collaborator extraction here when it needs main-world state.
- Add candidate extraction helpers only if a field is impossible to read in `filter_logic.js`.
- Do not duplicate policy logic here.

### `js/content/dom_fallback.js`

This becomes secondary.

Current important functions:

- `applyDOMFallback()`
- `shouldHideContent()`
- `matchesKeyword()`
- DOM card extraction in the main video loop
- `handleCommentsFallback()`

Planned changes:

- Keep DOM fallback for renderer misses and late DOM-only experiments.
- Add a small `data-filtertube-json-filtered` or debug-only stats bridge only if needed for proof.
- Avoid making DOM more complex to solve cases JSON can solve.
- Keep DOM quick response after settings changes until JSON path is proven complete.

### `js/content/bridge_settings.js`

Settings refresh must be correct or JSON filtering will use stale rules.

Current important functions:

- `requestSettingsFromBackground()`
- `sendSettingsToMainWorld()`
- `scheduleSettingsRefreshFromStorage()`
- `handleStorageChanges()`

Planned changes:

- Ensure `uiKeywords`, `filterKeywords`, `filterKeywordsComments`, `uiChannels`, `filterChannels`, profile keys, and mode keys all trigger refresh.
- Force refresh on storage changes that affect compiled settings.
- Keep this small and separate from candidate extraction.

### `js/background.js`

Compiled settings cache must invalidate on all rule changes.

Current important functions:

- `getCompiledSettings()`
- storage `onChanged` listener near the end of the file
- profile V4 compilation paths

Planned changes:

- Include all UI and compiled rule keys in cache invalidation:
  - `uiKeywords`
  - `filterKeywords`
  - `filterKeywordsComments`
  - `uiChannels`
  - `filterChannels`
  - `ftProfilesV4`
  - mode/policy keys
- Keep cache invalidation broad enough that content scripts never receive stale compiled rules after popup edits.

## Renderer Coverage Plan

Use `docs/json_paths_encyclopedia.md` as the source of truth for fields.

### P0 renderers

These must be JSON-filtered before DOM fallback:

- `richItemRenderer`
- `videoRenderer`
- `compactVideoRenderer`
- `videoWithContextRenderer`
- `lockupViewModel`
- `radioRenderer`
- `compactRadioRenderer`
- `playlistRenderer`
- `compactPlaylistRenderer`
- `playlistPanelVideoRenderer`
- `watchCardCompactVideoRenderer`
- `watchCardHeroVideoRenderer`
- `universalWatchCardRenderer`
- `secondarySearchContainerRenderer`
- `shortsLockupViewModel`
- `shortsLockupViewModelV2`
- `reelItemRenderer`
- comment renderers

### P1 renderers

- posts/community renderers
- podcast renderers
- channel cards
- refinement cards
- chips/search shelves
- Kids-only renderers where public JSON exposes enough local metadata

## Field Coverage Plan

### Keyword text fields

Candidate keyword text should include:

- title
- description snippet
- detailed metadata snippets
- short description
- `videoDetails.title`
- `videoDetails.shortDescription`
- `videoDetails.keywords[]`
- mix title/byline
- playlist title/byline
- comment text when comment keyword pill is active

### Channel fields

Candidate channel identity should include:

- UC ID
- handle
- custom URL
- display name
- logo URL when present
- collaborator list when present

UC ID remains the strongest key.

### Mix cards

Mix cards require special handling:

- `radioRenderer`
- `compactRadioRenderer`
- title uses a Mix prefix with hyphen, en-dash, em-dash, or colon
- `playlistId` starts with `RD`
- overlay badge is `MIX`

Important: Mix byline often says `YouTube`, so channel filtering should not treat `YouTube` as the owner. Keyword filtering should still match the mix title and seed text, so `pitbull` should block `Mix - Pitbull...` before paint.

## Policy Function

Target decision structure:

```js
function shouldHideCandidate(candidate, settings) {
  if (!settings || settings.enabled === false) return false;

  if (candidate.isStructural) return false;

  if (settings.listMode === 'whitelist') {
    return !matchesWhitelist(candidate, settings);
  }

  return matchesBlocklist(candidate, settings) ||
    matchesContentControls(candidate, settings);
}
```

Rules:

- Structural containers are never removed directly.
- Remove the closest content item, not section/page scaffolding.
- Blocklist with no active rules fails open.
- Whitelist with no allow rules fails closed for content cards, but not for watch scaffolding needed for page usability.
- Keywords match text fields.
- Channels match UC ID first, then handle/custom URL/name fallback.
- Comments use per-keyword comment pill rules.

## JSON Removal Rules

Safe removals:

- remove whole `richItemRenderer`
- remove whole `videoRenderer`
- remove whole `compactVideoRenderer`
- remove whole `videoWithContextRenderer`
- remove whole `lockupViewModel`
- remove whole `radioRenderer`
- remove whole `compactRadioRenderer`
- remove whole playlist/card renderer
- remove individual continuation item wrapping a content renderer

Avoid direct removal of:

- `sectionListRenderer`
- `itemSectionRenderer` unless every child is removed and cleanup is explicitly safe
- `richGridRenderer`
- `twoColumnWatchNextResults`
- watch metadata scaffolding
- comment composer scaffolding

## Rollout Steps

## Implemented Baseline

### 2026-05-06: active blocklist JSON-first pass

Files changed:

- `js/filter_logic.js`
- `js/seed.js`

What changed:

- Added a `FilterTubeCandidate` extraction path inside `YouTubeDataFilter`.
- Keyword decisions now search normalized JSON text from title, description, tags, metadata rows, accessibility labels, and channel identity text.
- `radioRenderer` and `compactRadioRenderer` now read `title.runs`, byline text, video count text, and inline/secondary watch IDs, so Mix cards can be filtered before DOM paint.
- `universalWatchCardRenderer` now reads header/call-to-action paths used by search and music hero cards.
- Channel ID extraction now correctly iterates an array of candidate JSON paths instead of treating the array as one path.
- `seed.js` no longer skips JSON mutation on home/search/channel feeds when blocklist mode has active rules. The old skip remains only for blocklist mode with no active rules, preserving the fast no-filter path.

Observed result:

- Blocklist keyword filtering on home/search is materially faster and avoids most visible card flash.
- DOM fallback still remains as the safety net for renderers or late surfaces not yet covered by JSON.

Known remaining work:

- Watch page navigation/video start still has some delay. Treat this as a separate watch-page performance pass, likely around `/youtubei/v1/next` processing scope, right-rail hydration, and avoiding unnecessary full-response scans during player startup.

### Step 1: Prove settings freshness

Files:

- `js/background.js`
- `js/content/bridge_settings.js`

Goal:

- Adding/removing a keyword updates compiled JSON rules immediately.
- No stale background cache after popup edits.

Validation:

- Add `pitbull` in blocklist.
- Confirm `filterKeywords.length > 0` in main-world debug logs after refresh.
- Confirm no need to reload YouTube page.

### Step 2: Add `FilterTubeCandidate`

File:

- `js/filter_logic.js`

Goal:

- Add candidate builder without changing behavior.
- `_shouldBlock()` can log candidate shape under debug.

Validation:

- `node --check js/filter_logic.js`
- With debug enabled, inspect candidate for:
  - normal home video
  - `Mix - Pitbull`
  - search result
  - watch right rail

### Step 3: Move keyword policy to candidate text

File:

- `js/filter_logic.js`

Goal:

- Blocklist keyword uses normalized candidate text:

```text
title + description + tags + metadataText
```

Validation:

- `pitbull` blocks:
  - normal videos
  - mix cards
  - search result cards
  - watch right rail cards
- JSON removes them before paint when response data exists.

### Step 4: Expand renderer path coverage

File:

- `js/filter_logic.js`

Use paths from:

- `docs/json_paths_encyclopedia.md`
- `docs/youtube_renderer_inventory.md`

Goal:

- Fill missing `FILTER_RULES` title/description/channel paths for P0 renderer list.

Validation:

- Use existing sample JSON files in repo.
- Add small fixture script if useful:

```text
tools/validate-json-filtering.mjs
```

This script should load sample JSON, compile a test keyword, run `FilterTubeEngine.processData()`, and assert matching renderers are removed.

### Step 5: Keep DOM fallback as safety net

File:

- `js/content/dom_fallback.js`

Goal:

- Do not remove DOM fallback.
- Reduce reliance only after JSON proof.
- Keep DOM fallback for rendered misses, quick block UI, and WebView/browser differences.

Validation:

- Turn off/disable JSON interception in a debug run and confirm DOM fallback still hides.
- Normal run should show much less visible flash.

### Step 6: Android parity

Repo:

- `/Users/devanshvarshney/FilterTubeApp`

Files:

- `tools/sync-runtime-from-extension.mjs`
- `apps/android/app/src/main/assets/filtertube_runtime_full.js`

Goal:

- Sync the proven JSON-first filtering changes into app runtime after extension test passes.

Validation:

- `node --check apps/android/app/src/main/assets/filtertube_runtime_full.js`
- `node tools/validate-filters-parity.mjs`
- Android emulator test for blocklist/whitelist keywords.

## Test Matrix

### Extension Chrome

- Empty blocklist does not hide.
- Add `pitbull`; visible Pitbull cards hide without page reload.
- Refresh YouTube home; Pitbull cards do not flash.
- Search `pitbull`; matching results are removed by JSON.
- Watch page right rail removes matching suggestions.
- Mix card `Mix - Pitbull...` is removed by JSON.
- Remove `pitbull`; content can show again after refresh/rerun.

### Extension Firefox

- Same as Chrome.
- Special attention to visible flash and CPU usage, because Firefox is less forgiving with DOM scans.

### Whitelist

- Keyword whitelist shows matching candidate text.
- Channel whitelist uses UC ID first.
- Watch scaffolding does not disappear.
- Right rail hydrates without leaking non-whitelisted content.

### Comments

- Keyword comments pill controls comment filtering.
- General video keyword entries do not unexpectedly filter comments unless the comment pill is active.

## Debug Instrumentation

Only behind `window.__filtertubeDebug`:

```text
FilterTube JSON candidate
FilterTube JSON decision
FilterTube JSON removed renderer
FilterTube DOM fallback hidden renderer
```

Fields to log:

- `rendererType`
- `wrapperRendererType`
- `videoId`
- `playlistId`
- `title`
- `channel.id`
- `channel.handle`
- `matchedRuleType`
- `matchedTextField`
- `decision`

No always-on console logging.

## Risks

- Removing structural containers can break YouTube layout.
- Whitelist can over-hide watch page scaffolding if not guarded.
- Mix cards do not have real owner channels, so channel blocking and keyword blocking must be separated.
- Some renderers use `content` string fields instead of `runs`.
- Background compiled settings cache can make filtering look broken even when JSON logic is correct.
- DOM fallback can mask JSON misses; tests must prove JSON removal before paint where possible.

## Acceptance Criteria

- Blocklist keyword filtering is instant for JSON-backed surfaces.
- `pitbull` blocks normal cards and mix cards before visible paint on fresh home/search loads.
- DOM fallback still catches late/missed cards.
- No regression to whitelist watch page behavior.
- No regression to quick block / 3-dot menu identity extraction.
- Extension passes syntax/build checks.
- Android runtime is synced only after extension behavior is proven.
