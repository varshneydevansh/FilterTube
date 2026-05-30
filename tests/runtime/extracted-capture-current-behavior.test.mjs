import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const fixtureDir = path.join(repoRoot, 'tests/runtime/fixtures/captures');

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function baseSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    ...overrides
  };
}

function loadCapture(file) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf8'));
}

function runCapturedRenderer(file, rendererType, settings) {
  const capture = loadCapture(file);
  assert.equal(capture.provenance.rendererType, rendererType);

  const input = {
    contents: [{
      [rendererType]: capture.renderer
    }]
  };
  const { engine } = loadFilterTubeEngine();
  const output = engine.processData(input, baseSettings(settings), file);
  return { input, output, capture };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('extracted Main append comment entity response ignores entity payload keyword and channel rules today', () => {
  const capture = loadCapture('main-comment-append-entity-response.json');
  const input = plain(capture.response);
  const { engine } = loadFilterTubeEngine();

  const keywordOutput = engine.processData(input, baseSettings({
    filterKeywords: [keyword('YOONGI')]
  }), 'main-comment-append-entity-response.json');

  const channelOutput = engine.processData(input, baseSettings({
    filterChannels: [{
      id: 'UCUooqKoZc3DF4KlktYF_vzQ',
      handle: '@miguelsantiagocalderonmore9380'
    }]
  }), 'main-comment-append-entity-response.json');

  const hideAllOutput = engine.processData(input, baseSettings({
    hideAllComments: true
  }), 'main-comment-append-entity-response.json');

  assert.equal(capture.provenance.source, 'YT_MAIN_NEXT_RESPONSE_COMMENT.json');
  assert.equal(capture.provenance.rendererType, 'commentThreadRenderer');
  assert.match(JSON.stringify(capture.response), /commentEntityPayload/);
  assert.match(JSON.stringify(capture.response), /YOONGI/);
  assert.match(JSON.stringify(capture.response), /UCUooqKoZc3DF4KlktYF_vzQ/);
  assert.deepEqual(plain(keywordOutput), plain(input));
  assert.deepEqual(plain(channelOutput), plain(input));
  assert.deepEqual(
    plain(hideAllOutput.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems),
    []
  );
  assert.match(JSON.stringify(hideAllOutput.frameworkUpdates), /commentEntityPayload/);
  assert.match(JSON.stringify(hideAllOutput.frameworkUpdates), /YOONGI/);
});

test('extracted YTM compactPlaylistRenderer currently passes through keyword and channel rules', () => {
  const { input, output, capture } = runCapturedRenderer(
    'ytm-compact-playlist-renderer.json',
    'compactPlaylistRenderer',
    {
      filterKeywords: [keyword('Mix danc pop')],
      filterChannels: [{
        id: 'UCvjXCedQa9pCEMzeLKMc20A',
        handle: '@fabrizzioandresolguinolgui5752'
      }]
    }
  );

  assert.equal(capture.provenance.source, 'YTM.json');
  assert.deepEqual(plain(output), plain(input));
});

test('extracted Main collaboration videoRenderer currently blocks by secondary showDialog collaborator id', () => {
  const { output, capture } = runCapturedRenderer(
    'main-collab-dialog-video-renderer.json',
    'videoRenderer',
    {
      filterChannels: [{
        id: 'UCRMqQWxCWE0VMvtUElm-rEA'
      }]
    }
  );

  assert.equal(capture.provenance.source, 'collab.json');
  assert.match(JSON.stringify(capture.renderer), /showDialogCommand/);
  assert.deepEqual(plain(output), { contents: [] });
});

test('extracted Main compactRadioRenderer from playlist.json blocks by title keyword but not creator channel identity', () => {
  const keywordRun = runCapturedRenderer(
    'main-compact-radio-renderer.json',
    'compactRadioRenderer',
    {
      filterKeywords: [keyword('Pitbull')]
    }
  );

  assert.equal(keywordRun.capture.provenance.source, 'playlist.json');
  assert.match(JSON.stringify(keywordRun.capture.renderer), /RDEPo5wWmKEaI/);
  assert.match(JSON.stringify(keywordRun.capture.renderer), /EPo5wWmKEaI/);
  assert.match(JSON.stringify(keywordRun.capture.renderer), /YouTube/);
  assert.deepEqual(plain(keywordRun.output), { contents: [] });

  const channelRun = runCapturedRenderer(
    'main-compact-radio-renderer.json',
    'compactRadioRenderer',
    {
      filterChannels: [{
        id: 'UC4-TgOSMJHn-LtY4zCzbQhw',
        handle: '@pitbull'
      }]
    }
  );

  const serialized = JSON.stringify(channelRun.capture.renderer);
  assert.doesNotMatch(serialized, /browseEndpoint|canonicalBaseUrl|channelId|externalChannelId/);
  assert.deepEqual(plain(channelRun.output), plain(channelRun.input));
});

test('extracted Main searchRefinementCardRenderer currently passes through keyword and channel rules', () => {
  const { input, output, capture } = runCapturedRenderer(
    'main-search-refinement-card-renderer.json',
    'searchRefinementCardRenderer',
    {
      filterKeywords: [keyword('Solaris')],
      filterChannels: [{
        id: 'UCm9VWKAFz0aXpuEHPHMae7w',
        handle: '@NYUSHAmusic'
      }]
    }
  );

  assert.equal(capture.provenance.source, 'strange_ytInitialData.json');
  assert.match(JSON.stringify(capture.renderer), /Solaris Es/);
  assert.match(JSON.stringify(capture.renderer), /UCm9VWKAFz0aXpuEHPHMae7w/);
  assert.deepEqual(plain(output), plain(input));
});

test('extracted Main home richItemRenderer lockup Mix hides by title keyword but not inferred creator channel', () => {
  const noRuleRun = runCapturedRenderer(
    'main-home-rich-lockup-mix-renderer.json',
    'richItemRenderer',
    {}
  );

  assert.equal(noRuleRun.capture.provenance.source, 'logs.json');
  assert.match(JSON.stringify(noRuleRun.capture.renderer), /lockupViewModel/);
  assert.deepEqual(plain(noRuleRun.output), plain(noRuleRun.input));

  const keywordRun = runCapturedRenderer(
    'main-home-rich-lockup-mix-renderer.json',
    'richItemRenderer',
    {
      filterKeywords: [keyword('Shakira')]
    }
  );

  assert.deepEqual(plain(keywordRun.output), { contents: [] });

  const channelRun = runCapturedRenderer(
    'main-home-rich-lockup-mix-renderer.json',
    'richItemRenderer',
    {
      filterChannels: [{
        id: 'UC0C-w0YjGpqDXGB8IHb662A',
        handle: '@edsheeran'
      }]
    }
  );

  const serialized = JSON.stringify(channelRun.capture.renderer);
  assert.doesNotMatch(serialized, /browseEndpoint|canonicalBaseUrl|channelId|externalChannelId/);
  assert.deepEqual(plain(channelRun.output), plain(channelRun.input));
});

test('extracted Main home richItemRenderer video blocks by title or channel while sibling remains visible', () => {
  const noRuleRun = runCapturedRenderer(
    'main-home-rich-video-renderer.json',
    'richItemRenderer',
    {}
  );

  assert.equal(noRuleRun.capture.provenance.source, 'logs.json');
  assert.match(JSON.stringify(noRuleRun.capture.renderer), /UCt4t-jeY85JegMlZ-E5UWtA/);
  assert.match(JSON.stringify(noRuleRun.capture.renderer), /@aajtak/);
  assert.deepEqual(plain(noRuleRun.output), plain(noRuleRun.input));

  const keywordRun = runCapturedRenderer(
    'main-home-rich-video-renderer.json',
    'richItemRenderer',
    {
      filterKeywords: [keyword('Holi 2026')]
    }
  );

  assert.deepEqual(plain(keywordRun.output), { contents: [] });

  const channelRun = runCapturedRenderer(
    'main-home-rich-video-renderer.json',
    'richItemRenderer',
    {
      filterChannels: [{
        id: 'UCt4t-jeY85JegMlZ-E5UWtA',
        handle: '@aajtak'
      }]
    }
  );

  assert.deepEqual(plain(channelRun.output), { contents: [] });

  const sibling = loadCapture('main-home-rich-lockup-mix-renderer.json');
  const input = {
    contents: [
      { richItemRenderer: noRuleRun.capture.renderer },
      { richItemRenderer: sibling.renderer }
    ]
  };
  const { engine } = loadFilterTubeEngine();
  const output = engine.processData(input, baseSettings({
    filterChannels: [{
      id: 'UCt4t-jeY85JegMlZ-E5UWtA',
      handle: '@aajtak'
    }]
  }), 'main-home-rich-video-renderer.json');

  assert.deepEqual(plain(output), {
    contents: [
      { richItemRenderer: sibling.renderer }
    ]
  });
});

test('extracted Main guideEntryRenderer currently passes through keyword and channel rules', () => {
  const { input, output, capture } = runCapturedRenderer(
    'main-guide-entry-renderer.json',
    'guideEntryRenderer',
    {
      filterKeywords: [keyword('DrGameria')],
      filterChannels: [{
        id: 'UC4REwc30LXHzKSkpqSwhR-Q',
        handle: '@DrJango1'
      }]
    }
  );

  assert.equal(capture.provenance.source, 'guide?prettyPrint=false.json');
  assert.match(JSON.stringify(capture.renderer), /UC4REwc30LXHzKSkpqSwhR-Q/);
  assert.match(JSON.stringify(capture.renderer), /@DrJango1/);
  assert.deepEqual(plain(output), plain(input));
});

test('extracted YTM showSheet videoWithContextRenderer currently passes through collaborator channel rules', () => {
  const { input, output, capture } = runCapturedRenderer(
    'ytm-show-sheet-collab-video-with-context-renderer.json',
    'videoWithContextRenderer',
    {
      filterChannels: [{
        id: 'UCRMqQWxCWE0VMvtUElm-rEA',
        handle: '@beele'
      }]
    }
  );

  assert.equal(capture.provenance.source, 'YTM-XHR.json');
  assert.match(JSON.stringify(capture.renderer), /showSheetCommand/);
  assert.match(JSON.stringify(capture.renderer), /UCRMqQWxCWE0VMvtUElm-rEA/);
  assert.deepEqual(plain(output), plain(input));
});

test('extracted Kids compactVideoRenderer currently blocks by kidsVideoOwnerExtension channel id', () => {
  const { output, capture } = runCapturedRenderer(
    'kids-compact-video-renderer.json',
    'compactVideoRenderer',
    {
      filterChannels: [{
        id: 'UCRxdo0UD_OU2a2ACG7LZHtA'
      }]
    }
  );

  assert.equal(capture.provenance.source, 'YT_KIDS.json');
  assert.match(JSON.stringify(capture.renderer), /kidsVideoOwnerExtension/);
  assert.deepEqual(plain(output), { contents: [] });
});

test('extracted active Shorts reel overlay carries owner identity but is not direct rule coverage today', () => {
  const capture = loadCapture('main-reel-player-overlay-renderer.json');
  const input = {
    overlay: {
      [capture.provenance.rendererType]: capture.renderer
    }
  };
  const { engine } = loadFilterTubeEngine();
  const output = engine.processData(input, baseSettings({
    filterChannels: [{
      id: 'UC-6YsZ1GcOMIehkb8eHioUQ',
      handle: '@ElectricRevolution'
    }]
  }), 'main-reel-player-overlay-renderer.json');

  assert.equal(capture.provenance.source, 'reel_item_watch?prettyPrint=False.JSON');
  assert.equal(capture.provenance.rendererType, 'reelPlayerOverlayRenderer');
  assert.match(JSON.stringify(capture.renderer), /UC-6YsZ1GcOMIehkb8eHioUQ/);
  assert.match(JSON.stringify(capture.renderer), /@ElectricRevolution/);
  assert.deepEqual(plain(output), plain(input));
});

test('extracted YTM endScreenVideoRenderer currently blocks by captured title keyword', () => {
  const { output, capture } = runCapturedRenderer(
    'ytm-end-screen-video-renderer.json',
    'endScreenVideoRenderer',
    {
      filterKeywords: [keyword('Shakira')]
    }
  );

  assert.equal(capture.provenance.source, 'YTM-XHR.json');
  assert.deepEqual(plain(output), { contents: [] });
});

test('extracted classic commentThreadRenderer currently hides when hideAllComments is enabled', () => {
  const { output, capture } = runCapturedRenderer(
    'main-comment-thread-renderer.json',
    'commentThreadRenderer',
    {
      hideAllComments: true
    }
  );

  assert.equal(capture.provenance.source, 'comments.json');
  assert.deepEqual(plain(output), { contents: [] });
});

test('extracted modern commentViewModel thread currently hides when hideAllComments is enabled', () => {
  const { output, capture } = runCapturedRenderer(
    'main-modern-comment-thread-renderer.json',
    'commentThreadRenderer',
    {
      hideAllComments: true
    }
  );

  assert.equal(capture.provenance.source, 'YT_MAIN_next?prettyPrint.json');
  assert.match(JSON.stringify(capture.renderer), /commentViewModel/);
  assert.deepEqual(plain(output), { contents: [] });
});

test('extracted playlist selected-row DOM fixture contains current row markers and action menu', () => {
  const html = fs.readFileSync(path.join(fixtureDir, 'playlist-selected-row.html'), 'utf8');

  assert.match(html, /<ytd-playlist-panel-video-renderer\b/);
  assert.match(html, /\sselected(?:=""|\b)/);
  assert.match(html, /href="\/watch\?v=/);
  assert.match(html, /id="video-title"/);
  assert.match(html, /id="byline"/);
  assert.match(html, /aria-label="Action menu"/);
});

test('extracted collaboration mix selected-row DOM fixture carries FilterTube channel markers', () => {
  const html = fs.readFileSync(path.join(fixtureDir, 'collab-mix-selected-row.html'), 'utf8');

  assert.match(html, /<ytd-playlist-panel-video-renderer\b/);
  assert.match(html, /\sselected(?:=""|\b)/);
  assert.match(html, /data-filtertube-video-id="NFnAuiklEug"/);
  assert.match(html, /data-filtertube-channel-id="UCg8ZzloDPTrOiGztK0C9txQ"/);
  assert.match(html, /THEBLACKLABEL and TAEYANG/);
  assert.match(html, /aria-label="Action menu"/);
});

test('extracted collaboration homepage avatar-stack fixture has incomplete collaborator identity', () => {
  const html = fs.readFileSync(path.join(fixtureDir, 'main-collab-homepage-avatar-stack.html'), 'utf8');

  assert.match(html, /Reduced from ignored raw capture: collab_on_homepage\.html/);
  assert.match(html, /<ytd-video-renderer\b/);
  assert.match(html, /yt-avatar-stack-view-model/);
  assert.match(html, /aria-label="Collaboration channels"/);
  assert.match(html, /data-filtertube-collaborators='\[\{"name":"Veritasium","handle":"@veritasium","id":""\},\{"name":"fern","handle":"","id":""\}\]'/);
  assert.match(html, /data-filtertube-channel-handle="@veritasium"/);
  assert.match(html, /Veritasium and fern/);
  assert.doesNotMatch(html, /"id":"UC/);
  assert.doesNotMatch(html, /data-filtertube-channel-id=/);
  assert.match(html, /aria-label="Action menu"/);
});

test('extracted DOMs.html fixture is mixed already-mutated Main DOM not clean post proof', () => {
  const html = fs.readFileSync(path.join(fixtureDir, 'main-doms-mutated-main-dom.html'), 'utf8');

  assert.match(html, /Reduced from ignored raw capture: DOMs\.html/);
  assert.match(html, /data-current-filtertube-mutated="true"/);
  assert.match(html, /data-raw-heading="MIX CARD DOM HOME PAGE"/);
  assert.match(html, /data-filtertube-video-id="6cfCgLgiFDM"/);
  assert.match(html, /class="filtertube-playlist-menu-fallback-btn"/);
  assert.match(html, /data-raw-heading="NORMAL VIDEO DOM HOME PAGE -"/);
  assert.match(html, /href="\/@anthropic-ai"/);
  assert.match(html, /data-raw-heading="SEARCH PAGE COLLAB VIDEO DOM"/);
  assert.match(html, /yt-avatar-stack-view-model/);
  assert.match(html, /data-raw-heading="PLAYLIST DOM ON WATHC PAGE RIGHT RAIL"/);
  assert.match(html, /ytd-watch-next-secondary-results-renderer/);
  assert.match(html, /filtertube-quick-block-wrap/);
  assert.doesNotMatch(html, /<yt-post-header\b|ytPostHeaderHostActionMenu|href="\/post\//);
});

test('extracted watchpage embedded postRenderer fixture passes through modern post rules today', () => {
  const capture = loadCapture('main-watchpage-embedded-post-renderer.json');
  const input = plain(capture.response);
  const { engine, messages } = loadFilterTubeEngine();
  const output = engine.processData(input, baseSettings({
    filterKeywords: [keyword('Nastya')],
    filterChannels: [{
      id: 'UCXRt-HjEaTF6J6regWoopjw',
      handle: '@Russianlanguage'
    }]
  }), 'main-watchpage-embedded-post-renderer.json');

  assert.equal(capture.provenance.source, 'watchpage.json');
  assert.equal(capture.provenance.rendererType, 'postRenderer');
  assert.equal(capture.provenance.route, 'browse/feed, not watch-next');
  assert.deepEqual(plain(output), plain(capture.response));
  assert.equal(messages.filter((message) => message.type === 'FilterTube_UpdateChannelMap').length, 2);
});

test('extracted YTM DOM video card fixture pins owner link menu and quick-block anchor', () => {
  const html = fs.readFileSync(path.join(fixtureDir, 'ytm-dom-video-card-with-menu.html'), 'utf8');

  assert.match(html, /Reduced from ignored raw capture: YTM-DOM\.html/);
  assert.match(html, /<ytm-video-with-context-renderer\b/);
  assert.match(html, /class="item adaptive-feed-item filtertube-quick-block-host filtertube-quick-block-anchor"/);
  assert.match(html, /href="\/watch\?v=nUwTnJ8yFXY/);
  assert.match(html, /href="\/channel\/UCu7TZ_ATWgjgD9IrNLdnYDA"/);
  assert.match(html, /alt="Go to channel Little Big"/);
  assert.match(html, /LITTLE BIG - TACOS \(Official Music Video\)/);
  assert.match(html, /<ytm-menu-renderer class="media-item-menu">/);
  assert.match(html, /aria-label="Action menu"/);
  assert.match(html, /filtertube-quick-block-wrap/);
  assert.match(html, /aria-label="Quick block all channels on this card"/);
});

test('extracted YTM DOM post card fixture pins backstage author and action menu boundary', () => {
  const html = fs.readFileSync(path.join(fixtureDir, 'ytm-dom-post-card-with-menu.html'), 'utf8');

  assert.match(html, /Source: YTM-DOM\.html/);
  assert.match(html, /<ytm-backstage-post-thread-renderer\b/);
  assert.match(html, /<ytm-backstage-post-renderer\b/);
  assert.match(html, /<yt-post-header\b/);
  assert.match(html, /href="\/@MajorAlex"/);
  assert.match(html, /Major Alex/);
  assert.match(html, /href="\/post\/UgkxP4-pkY-qukYP5m8oOWMIRwgfR5AwGCEM"/);
  assert.match(html, /ytPostHeaderHostActionMenu/);
  assert.match(html, /aria-label="Action menu"/);
  assert.match(html, /ytmBackstagePostRendererHostContentText/);
  assert.match(html, /Guess Who was that Dude with Epstein\?/);
  assert.doesNotMatch(html, /filtertube-quick-block-anchor/);
  assert.doesNotMatch(html, /filtertube-menu-item/);
});
