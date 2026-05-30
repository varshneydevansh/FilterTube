import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const fixtureDir = path.join(repoRoot, 'tests/runtime/fixtures/captures');

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

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

function runEngine(payload, settings) {
  const { engine } = loadFilterTubeEngine();
  return engine.processData(payload, baseSettings(settings), 'p0-dom-renderer-fixture');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadCapture(file) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf8'));
}

test('dom_renderer_contract_documents_current_behavior_and_future_gate', () => {
  const doc = read('docs/audit/FILTERTUBE_P0_DOM_RENDERER_CURRENT_BEHAVIOR_2026-05-19.md');
  const gate = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');

  for (const fixture of [
    'dom_renderer_contract_documents_current_behavior_and_future_gate',
    'dom_renderer_global_card_selector_has_no_single_target_authority',
    'dom_renderer_post_menu_runtime_target_is_split_between_native_and_fallback',
    'dom_renderer_fallback_playlist_menu_uses_weaker_action_gate_than_normal_menu',
    'dom_renderer_selected_playlist_row_can_be_hidden_by_current_watch_owner_block',
    'dom_renderer_watch_card_rhs_panel_video_gap_is_current_behavior',
    'dom_renderer_horizontal_card_search_refinement_gap_is_current_behavior',
    'dom_renderer_legacy_backstage_post_positive_baseline_is_current_behavior',
    'dom_renderer_comment_thread_hide_all_positive_baseline_is_current_behavior',
    'dom_renderer_extracted_compact_playlist_gap_is_capture_backed',
    'dom_renderer_endscreen_json_and_dom_capture_split_is_current_behavior',
    'dom_renderer_raw_capture_sources_remain_fixture_only'
  ]) {
    assert.ok(doc.includes(fixture), `missing DOM/renderer fixture ${fixture}`);
  }

  for (const phrase of [
    'domRendererAuthority.ownerId',
    'domRendererAuthority.surface',
    'domRendererAuthority.route',
    'domRendererAuthority.targetSelector',
    'domRendererAuthority.rendererType',
    'domRendererAuthority.negativeSiblingVisibleFixture'
  ]) {
    assert.ok(doc.includes(phrase), `missing future contract phrase ${phrase}`);
  }

  assert.ok(gate.includes('Renderer JSON expansion'));
  assert.ok(gate.includes('DOM selector registry'));
  assert.ok(register.includes('False-Hide Boundaries'));
  assert.ok(register.includes('Renderer Leaks And Whitelist Confidence'));
});

test('dom_renderer_global_card_selector_has_no_single_target_authority', () => {
  const extractors = read('js/content/dom_extractors.js');
  const bridge = read('js/content_bridge.js');
  const selectorBlock = sliceBetween(extractors, 'const VIDEO_CARD_SELECTORS = [', '].join');
  const productSource = [
    'js/content/dom_extractors.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/block_channel.js',
    'js/filter_logic.js'
  ].map(read).join('\n');

  for (const token of [
    'ytd-watch-card-rhs-panel-video-renderer',
    'ytd-playlist-panel-video-renderer',
    'ytm-compact-playlist-renderer',
    'ytk-compact-video-renderer',
    'ytd-channel-renderer'
  ]) {
    assert.match(selectorBlock, new RegExp(token));
  }
  assert.match(bridge, /document\.querySelectorAll\(typeof VIDEO_CARD_SELECTORS === 'string' \? VIDEO_CARD_SELECTORS/);
  assert.match(extractors, /element\.closest\(VIDEO_CARD_SELECTORS\)/);
  assert.doesNotMatch(productSource, /\bdomRendererAuthority\b|\bselectorAuthority\b/);
});

test('dom_renderer_post_menu_runtime_target_is_split_between_native_and_fallback', () => {
  const blockChannel = read('js/content/block_channel.js');
  const bridge = read('js/content_bridge.js');
  const nativeBlock = sliceBetween(
    blockChannel,
    '// Prefer comment context first',
    'if (!videoCard && !clickInComments)'
  );
  const fallbackSelector = sliceBetween(
    bridge,
    'const fallbackMenuCardSelector = [',
    '].join'
  );

  assert.match(nativeBlock, /'ytd-post-renderer, '/);
  assert.match(nativeBlock, /'ytm-backstage-post-thread-renderer, '/);
  assert.match(fallbackSelector, /'ytd-comment-thread-renderer'/);
  assert.doesNotMatch(fallbackSelector, /ytd-post-renderer/);
  assert.doesNotMatch(fallbackSelector, /ytm-backstage-post-renderer|ytm-post-renderer/);
});

test('dom_renderer_fallback_playlist_menu_uses_weaker_action_gate_than_normal_menu', () => {
  const bridge = read('js/content_bridge.js');
  const normal = sliceBetween(
    bridge,
    'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
    'const videoCardTagName ='
  );
  const fallbackButton = sliceBetween(
    bridge,
    'const createFallbackButton = (card, surface) => {',
    'const ensureFallbackButtonForCard = (card, debug = null) => {'
  );
  const fallbackRow = sliceBetween(
    bridge,
    'const bindFallbackRow = ({ item, toggle }, channelInfo) => {',
    'let baseInfo = resolveFallbackBaseInfo();'
  );

  assert.match(normal, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(normal, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(fallbackButton, /openFilterTubePlaylistFallbackPopover\(btn, card\)/);
  assert.match(fallbackRow, /performBlock\(channelInfo, isFilterAllToggleActive\(toggle\)\)/);
  assert.doesNotMatch(fallbackButton + fallbackRow, /showBlockMenuItem|listMode|currentSettings/);
});

test('dom_renderer_selected_playlist_row_can_be_hidden_by_current_watch_owner_block', () => {
  const fallback = read('js/content/dom_fallback.js');
  const selectedFn = sliceBetween(
    fallback,
    'function isSelectedPlaylistPanelRow(element) {',
    'function extractPlaylistPanelBylineChannelName(value) {'
  );
  const currentWatchBlock = sliceBetween(
    fallback,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'function markedChannelIsStillBlocked(settings, blockedChannelId, blockedChannelHandle, blockedChannelCustom) {'
  );
  const selectedFixture = fs.readFileSync(path.join(fixtureDir, 'playlist-selected-row.html'), 'utf8');

  assert.match(selectedFn, /row\.hasAttribute\('selected'\)/);
  assert.match(selectedFn, /row\.getAttribute\('aria-selected'\) === 'true'/);
  assert.match(currentWatchBlock, /find\(row => isSelectedPlaylistPanelRow\(row\)\)/);
  assert.match(currentWatchBlock, /toggleVisibility\(selected, true, `Current watch blocked:/);
  assert.match(selectedFixture, /<ytd-playlist-panel-video-renderer\b/);
  assert.match(selectedFixture, /aria-label="Action menu"/);
});

test('dom_renderer_watch_card_rhs_panel_video_gap_is_current_behavior', () => {
  const input = {
    contents: [{
      watchCardRHPanelVideoRenderer: {
        videoId: 'abcdefghijk',
        title: { runs: [{ text: 'spider rhs panel card' }] },
        shortBylineText: {
          runs: [{
            text: 'RHS Panel Channel',
            navigationEndpoint: {
              browseEndpoint: {
                browseId: 'UC6666666666666666666666',
                canonicalBaseUrl: '/@rhspanel'
              }
            }
          }]
        }
      }
    }]
  };
  const output = runEngine(input, {
    filterKeywords: [keyword('spider')],
    filterChannels: [{ id: 'UC6666666666666666666666', handle: '@rhspanel' }]
  });

  assert.deepEqual(plain(output), plain(input));
});

test('dom_renderer_horizontal_card_search_refinement_gap_is_current_behavior', () => {
  const input = {
    contents: [{
      horizontalCardListRenderer: {
        cards: [{
          searchRefinementCardRenderer: {
            query: { runs: [{ text: 'spider refinement chip' }] },
            bylineText: {
              runs: [{
                text: 'Blocked Refinement Channel',
                navigationEndpoint: {
                  browseEndpoint: {
                    browseId: 'UC5555555555555555555555',
                    canonicalBaseUrl: '/@blockedrefinement'
                  }
                }
              }]
            }
          }
        }]
      }
    }]
  };
  const output = runEngine(input, {
    filterKeywords: [keyword('spider')],
    filterChannels: [{ id: 'UC5555555555555555555555', handle: '@blockedrefinement' }]
  });

  assert.deepEqual(plain(output), plain(input));
});

test('dom_renderer_legacy_backstage_post_positive_baseline_is_current_behavior', () => {
  const input = {
    contents: [{
      backstagePostRenderer: {
        authorText: { simpleText: 'Legacy Post Channel' },
        authorEndpoint: {
          browseEndpoint: {
            browseId: 'UC8888888888888888888888',
            canonicalBaseUrl: '/@legacypost'
          }
        },
        contentText: { runs: [{ text: 'spider legacy community post' }] }
      }
    }]
  };
  const output = runEngine(input, {
    filterKeywords: [keyword('spider')],
    filterChannels: [{ id: 'UC8888888888888888888888', handle: '@legacypost' }]
  });

  assert.deepEqual(plain(output), { contents: [] });
});

test('dom_renderer_comment_thread_hide_all_positive_baseline_is_current_behavior', () => {
  const input = {
    contents: [{
      commentThreadRenderer: {
        comment: {
          commentRenderer: {
            contentText: { runs: [{ text: 'ordinary comment' }] },
            authorEndpoint: {
              browseEndpoint: {
                browseId: 'UC4444444444444444444444',
                canonicalBaseUrl: '/@calmcommenter'
              }
            }
          }
        },
        replies: { commentRepliesRenderer: { contents: [] } }
      }
    }]
  };
  const output = runEngine(input, { hideAllComments: true });

  assert.deepEqual(plain(output), { contents: [] });
});

test('dom_renderer_extracted_compact_playlist_gap_is_capture_backed', () => {
  const capture = loadCapture('ytm-compact-playlist-renderer.json');
  const input = { contents: [{ compactPlaylistRenderer: capture.renderer }] };
  const output = runEngine(input, {
    filterKeywords: [keyword('Mix danc pop')],
    filterChannels: [{
      id: 'UCvjXCedQa9pCEMzeLKMc20A',
      handle: '@fabrizzioandresolguinolgui5752'
    }]
  });

  assert.equal(capture.provenance.source, 'YTM.json');
  assert.equal(capture.provenance.rendererType, 'compactPlaylistRenderer');
  assert.deepEqual(plain(output), plain(input));
});

test('dom_renderer_endscreen_json_and_dom_capture_split_is_current_behavior', () => {
  const capture = loadCapture('ytm-end-screen-video-renderer.json');
  const input = { contents: [{ endScreenVideoRenderer: capture.renderer }] };
  const output = runEngine(input, {
    filterKeywords: [keyword('Shakira')]
  });
  const traceability = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');

  assert.equal(capture.provenance.source, 'YTM-XHR.json');
  assert.equal(capture.provenance.rendererType, 'endScreenVideoRenderer');
  assert.deepEqual(plain(output), { contents: [] });
  assert.match(traceability, /Main watch \/ next[\s\S]*clean Main watch end-screen video wall DOM coverage/);
  assert.match(traceability, /YT_MAIN_WATCH\.html/);
});

test('dom_renderer_raw_capture_sources_remain_fixture_only', () => {
  const traceability = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const sourceBoundary = read('docs/audit/FILTERTUBE_SOURCE_BOUNDARY_AUDIT_2026-05-18.md');
  const productSource = [
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_extractors.js',
    'js/content/dom_fallback.js',
    'js/content/block_channel.js'
  ].map(read).join('\n');

  for (const fixture of [
    'ytm-compact-playlist-renderer.json',
    'ytm-end-screen-video-renderer.json',
    'playlist-selected-row.html',
    'collab-mix-selected-row.html'
  ]) {
    assert.ok(fs.existsSync(path.join(fixtureDir, fixture)), `missing committed fixture ${fixture}`);
    assert.ok(traceability.includes(fixture), `traceability must cite ${fixture}`);
  }

  assert.match(sourceBoundary, /valid audit evidence, not release source/);
  assert.doesNotMatch(productSource, /YT_MAIN_WATCH\.html|YTM-XHR\.json|collab_in_playlist_mix\.html|playlist\.html/);
});
