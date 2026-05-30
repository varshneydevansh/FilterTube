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

function loadCapture(file) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf8'));
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
  return engine.processData(payload, baseSettings(settings), 'p0-renderer-authority');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function videoRenderer(overrides = {}) {
  return {
    videoId: 'abcdefghijk',
    title: { runs: [{ text: 'Calm child video' }] },
    shortBylineText: {
      runs: [{
        text: 'Calm Channel',
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UC1234567890123456789012',
            canonicalBaseUrl: '/@calmchannel'
          }
        }
      }]
    },
    ...overrides
  };
}

test('P0 renderer authority audit documents fixture families and blocked verdict', () => {
  const doc = read('docs/audit/FILTERTUBE_P0_RENDERER_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md');
  const readiness = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');

  for (const fixture of [
    'renderer_authority_compact_playlist_blocklist_and_whitelist_gap',
    'renderer_authority_show_sheet_collaborator_blocklist_and_whitelist_gap',
    'renderer_authority_direct_watch_card_parts_gap',
    'renderer_authority_shorts_owner_identity_gap',
    'renderer_authority_mix_avatar_stack_false_hide_gap',
    'renderer_authority_shelf_title_container_false_hide_gap',
    'renderer_authority_inventory_claims_need_fixture_status'
  ]) {
    assert.ok(doc.includes(fixture), `missing renderer fixture ${fixture}`);
  }

  assert.ok(readiness.includes('Renderer JSON expansion'));
  assert.ok(register.includes('Renderer Leaks And Whitelist Confidence'));
  assert.ok(convergence.includes('P0 renderer authority fixtures'));
  assert.ok(doc.includes('P0 renderer authority slice is not green'));
});

test('renderer_authority_compact_playlist_blocklist_and_whitelist_gap is capture-backed today', () => {
  const capture = loadCapture('ytm-compact-playlist-renderer.json');
  assert.equal(capture.provenance.rendererType, 'compactPlaylistRenderer');
  const input = { contents: [{ compactPlaylistRenderer: capture.renderer }] };

  const blockOutput = runEngine(input, {
    filterKeywords: [keyword('Mix danc pop')],
    filterChannels: [{ id: 'UCvjXCedQa9pCEMzeLKMc20A', handle: '@fabrizzioandresolguinolgui5752' }]
  });
  const whitelistMissOutput = runEngine(input, {
    listMode: 'whitelist',
    whitelistKeywords: [keyword('unrelated allowed term')],
    whitelistChannels: [{ id: 'UC0000000000000000000000' }]
  });
  const whitelistMatchOutput = runEngine(input, {
    listMode: 'whitelist',
    whitelistKeywords: [keyword('Mix danc pop')],
    whitelistChannels: [{ id: 'UCvjXCedQa9pCEMzeLKMc20A' }]
  });

  assert.deepEqual(plain(blockOutput), plain(input));
  assert.deepEqual(plain(whitelistMissOutput), plain(input));
  assert.deepEqual(plain(whitelistMatchOutput), plain(input));
});

test('renderer_authority_show_sheet_collaborator_blocklist_and_whitelist_gap is capture-backed today', () => {
  const capture = loadCapture('ytm-show-sheet-collab-video-with-context-renderer.json');
  assert.equal(capture.provenance.rendererType, 'videoWithContextRenderer');
  const input = { contents: [{ videoWithContextRenderer: capture.renderer }] };

  const blockOutput = runEngine(input, {
    filterChannels: [{ id: 'UCRMqQWxCWE0VMvtUElm-rEA', handle: '@beele' }]
  });
  const allowOutput = runEngine(input, {
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCRMqQWxCWE0VMvtUElm-rEA', handle: '@beele' }]
  });

  assert.match(JSON.stringify(capture.renderer), /showSheetCommand/);
  assert.deepEqual(plain(blockOutput), plain(input));
  assert.deepEqual(plain(allowOutput), { contents: [] });
});

test('renderer_authority_direct_watch_card_parts_gap passes through blocklist and whitelist today', () => {
  const input = {
    contents: [{
      watchCardRichHeaderRenderer: {
        title: { runs: [{ text: 'spider artist profile' }] },
        subtitle: {
          runs: [{
            text: 'Blocked Artist',
            navigationEndpoint: {
              browseEndpoint: {
                browseId: 'UC6666666666666666666666',
                canonicalBaseUrl: '/@blockedartist'
              }
            }
          }]
        }
      }
    }]
  };

  const blockOutput = runEngine(input, {
    filterKeywords: [keyword('spider')],
    filterChannels: [{ id: 'UC6666666666666666666666', handle: '@blockedartist' }]
  });
  const allowOutput = runEngine(input, {
    listMode: 'whitelist',
    whitelistKeywords: [keyword('spider')],
    whitelistChannels: [{ id: 'UC6666666666666666666666', handle: '@blockedartist' }]
  });

  assert.deepEqual(plain(blockOutput), plain(input));
  assert.deepEqual(plain(allowOutput), plain(input));
});

test('renderer_authority_shorts_owner_identity_gap blocks title but misses below-thumbnail owner today', () => {
  const channelOnly = {
    contents: [{
      shortsLockupViewModel: {
        accessibilityText: 'Neutral search short',
        onTap: { innertubeCommand: { reelWatchEndpoint: { videoId: 'abcdefghijk' } } },
        belowThumbnailMetadata: {
          primaryText: { content: 'Blocked Shorts Owner' },
          avatar: {
            avatarViewModel: {
              endpoint: {
                innertubeCommand: {
                  commandMetadata: { webCommandMetadata: { url: '/@blockedshortsowner' } },
                  browseEndpoint: {
                    browseId: 'UC9999999999999999999999',
                    canonicalBaseUrl: '/@blockedshortsowner'
                  }
                }
              }
            }
          }
        }
      }
    }]
  };
  const titleMatch = {
    contents: [{
      shortsLockupViewModel: {
        accessibilityText: 'spider short',
        onTap: { innertubeCommand: { reelWatchEndpoint: { videoId: 'abcdefghijk' } } }
      }
    }]
  };

  const channelOutput = runEngine(channelOnly, {
    filterChannels: [{ id: 'UC9999999999999999999999', handle: '@blockedshortsowner' }]
  });
  const titleOutput = runEngine(titleMatch, {
    filterKeywords: [keyword('spider')]
  });
  const allowChannelOutput = runEngine(channelOnly, {
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC9999999999999999999999', handle: '@blockedshortsowner' }]
  });

  assert.deepEqual(plain(channelOutput), plain(channelOnly));
  assert.deepEqual(plain(titleOutput), { contents: [] });
  assert.deepEqual(plain(allowChannelOutput), { contents: [] });
});

test('renderer_authority_mix_avatar_stack_false_hide_gap removes a generated radio mix today', () => {
  const input = {
    contents: [{
      radioRenderer: {
        playlistId: 'RDabcdefghijk',
        title: { simpleText: 'Mix - Neutral music' },
        metadata: {
          avatarStackViewModel: {
            avatars: [{
              avatarViewModel: {
                a11yLabel: 'Go to channel Artist One',
                rendererContext: {
                  commandContext: {
                    onTap: {
                      innertubeCommand: {
                        browseEndpoint: {
                          browseId: 'UC1111111111111111111111',
                          canonicalBaseUrl: '/@artistone'
                        }
                      }
                    }
                  }
                }
              }
            }, {
              avatarViewModel: {
                a11yLabel: 'Go to channel Blocked Artist',
                rendererContext: {
                  commandContext: {
                    onTap: {
                      innertubeCommand: {
                        browseEndpoint: {
                          browseId: 'UC6666666666666666666666',
                          canonicalBaseUrl: '/@blockedartist'
                        }
                      }
                    }
                  }
                }
              }
            }]
          }
        }
      }
    }]
  };
  const output = runEngine(input, {
    filterChannels: [{ id: 'UC6666666666666666666666', handle: '@blockedartist' }]
  });

  assert.deepEqual(plain(output), { contents: [] });
});

test('renderer_authority_shelf_title_container_false_hide_gap removes nonmatching children today', () => {
  const input = {
    contents: [{
      shelfRenderer: {
        header: {
          shelfHeaderRenderer: {
            title: { simpleText: 'spider shelf' }
          }
        },
        content: {
          verticalListRenderer: {
            items: [{
              videoRenderer: videoRenderer({
                title: { runs: [{ text: 'Calm nonmatching child video' }] }
              })
            }]
          }
        }
      }
    }]
  };
  const output = runEngine(input, {
    filterKeywords: [keyword('spider')]
  });

  assert.deepEqual(plain(output), { contents: [] });
});

test('renderer_authority_grid_duplicate_and_search_refinement_gaps remain source-pinned', () => {
  const filterLogic = read('js/filter_logic.js');
  const rulesStart = filterLogic.indexOf('const FILTER_RULES = {');
  const rulesEnd = filterLogic.indexOf('// ============================================================================\n    // FILTERING ENGINE', rulesStart);
  assert.notEqual(rulesStart, -1);
  assert.notEqual(rulesEnd, -1);
  const rules = filterLogic.slice(rulesStart, rulesEnd);

  assert.equal((rules.match(/\n\s*gridVideoRenderer\s*:/g) || []).length, 2);
  for (const renderer of [
    'searchRefinementCardRenderer',
    'horizontalCardListRenderer',
    'compactPlaylistRenderer',
    'watchCardRichHeaderRenderer',
    'watchCardHeroVideoRenderer',
    'watchCardRHPanelVideoRenderer'
  ]) {
    assert.doesNotMatch(rules, new RegExp(`\\n\\s*${renderer}\\s*:`));
  }
});

test('renderer_authority_inventory_claims_need_fixture_status remains true today', () => {
  const inventory = read('docs/youtube_renderer_inventory.md');
  const truthAudit = read('docs/audit/FILTERTUBE_JSON_DOM_INVENTORY_TRUTH_AUDIT_2026-05-18.md');
  const p0Doc = read('docs/audit/FILTERTUBE_P0_RENDERER_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md');

  assert.match(inventory, /showSheetCommand[\s\S]*✅ \*\*PRIMARY\*\*/);
  assert.match(inventory, /watchCardRichHeaderRenderer[\s\S]*IMPLEMENTED/);
  assert.match(inventory, /watchCardRHPanelVideoRenderer[\s\S]*not parsed/);
  assert.match(truthAudit, /optimistic historical\s+phrasing/i);
  assert.match(p0Doc, /inventory row is not runtime authority/i);
});
