import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_CANDIDATE_EXTRACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    videoChannelMap: {},
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function makeFilter(overrides = {}, options = {}) {
  const harness = loadFilterTubeEngine(options);
  const filter = new harness.engine.YouTubeDataFilter(settings(overrides));
  return { ...harness, filter };
}

function videoRenderer(overrides = {}) {
  return {
    videoId: 'abc123DEF45',
    title: { runs: [{ text: 'Neutral Title' }] },
    shortBylineText: {
      runs: [{
        text: 'Blocked Metadata Channel',
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UCabcabcabcabcabcabcab',
            canonicalBaseUrl: '/@blockedmeta'
          }
        }
      }]
    },
    ...overrides
  };
}

function collaboratorRun() {
  return {
    text: 'Creator One and Creator Two',
    navigationEndpoint: {
      showDialogCommand: {
        panelLoadingStrategy: {
          inlineContent: {
            dialogViewModel: {
              customContent: {
                listViewModel: {
                  listItems: [
                    {
                      listItemViewModel: {
                        title: { content: 'Creator One' },
                        leadingElement: {
                          avatarViewModel: {
                            image: { sources: [{ url: 'https://example.test/one.jpg' }] }
                          }
                        },
                        rendererContext: {
                          commandContext: {
                            onTap: {
                              innertubeCommand: {
                                browseEndpoint: {
                                  browseId: 'UCCreatorOne000000000000',
                                  canonicalBaseUrl: '/@creatorone'
                                }
                              }
                            }
                          }
                        }
                      }
                    },
                    {
                      listItemViewModel: {
                        title: { content: 'Creator Two' },
                        rendererContext: {
                          commandContext: {
                            onTap: {
                              innertubeCommand: {
                                browseEndpoint: {
                                  browseId: 'UCCreatorTwo000000000000',
                                  canonicalBaseUrl: '/c/CreatorTwo'
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    }
  };
}

function showSheetRun() {
  return {
    text: 'Sheet One and Sheet Two',
    navigationEndpoint: {
      showSheetCommand: {
        panelLoadingStrategy: {
          inlineContent: {
            sheetViewModel: {
              header: {
                panelHeaderViewModel: {
                  title: { content: 'Collaborators' }
                }
              },
              content: {
                listViewModel: {
                  listItems: [
                    {
                      listItemViewModel: {
                        title: {
                          content: 'Sheet One',
                          commandRuns: [{
                            onTap: {
                              innertubeCommand: {
                                browseEndpoint: {
                                  browseId: 'UCSheetOne0000000000000',
                                  canonicalBaseUrl: '/@sheetone'
                                }
                              }
                            }
                          }]
                        },
                        rendererContext: {
                          commandContext: {
                            onTap: {
                              innertubeCommand: {
                                browseEndpoint: {
                                  browseId: 'UCSheetOne0000000000000'
                                }
                              }
                            }
                          }
                        }
                      }
                    },
                    {
                      listItemViewModel: {
                        title: {
                          content: 'Sheet Two',
                          commandRuns: [{
                            onTap: {
                              innertubeCommand: {
                                browseEndpoint: {
                                  browseId: 'UCSheetTwo0000000000000',
                                  canonicalBaseUrl: '/@sheettwo'
                                }
                              }
                            }
                          }]
                        },
                        rendererContext: {
                          commandContext: {
                            onTap: {
                              innertubeCommand: {
                                browseEndpoint: {
                                  browseId: 'UCSheetTwo0000000000000'
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    }
  };
}

function avatarStackRadioRenderer() {
  return {
    radioRenderer: {
      videoId: 'radio000001',
      title: { simpleText: 'Mix - Neutral' },
      navigationEndpoint: {
        watchEndpoint: {
          videoId: 'radio000001',
          playlistId: 'RDavatarstack'
        }
      },
      contentImage: {
        avatarStackViewModel: {
          avatars: [
            {
              avatarViewModel: {
                a11yLabel: 'Matched Avatar go to channel',
                rendererContext: {
                  commandContext: {
                    onTap: {
                      innertubeCommand: {
                        browseEndpoint: {
                          browseId: 'UCmatched00000000000000',
                          canonicalBaseUrl: '/@matchedavatar'
                        }
                      }
                    }
                  }
                },
                image: { sources: [{ url: 'https://example.test/matched.jpg' }] }
              }
            },
            {
              avatarViewModel: {
                a11yLabel: 'Other Avatar go to channel',
                rendererContext: {
                  commandContext: {
                    onTap: {
                      innertubeCommand: {
                        browseEndpoint: {
                          browseId: 'UCother0000000000000000',
                          canonicalBaseUrl: '/@otheravatar'
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        }
      }
    }
  };
}

test('JSON-first candidate extraction boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior register/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not completion proof for JSON-first candidate extraction authority/);

  const source = read('js/filter_logic.js');
  assert.equal(lineCount(source), 3498);
  assert.equal(Buffer.byteLength(source), 165151);
  assert.equal(sha256('js/filter_logic.js'), '4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641');
  assert.ok(doc.includes('`js/filter_logic.js`'));

  for (const artifact of [
    'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_RENDERER_TRAVERSAL_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_BLOCK_DECISION_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('candidate extraction source counts remain pinned', () => {
  const doc = read(docPath);
  const filterLogic = read('js/filter_logic.js');

  const collectBlock = sliceBetween(filterLogic, '_collectTextFromPaths(item, paths) {', '        _extractVideoId(item, rules) {');
  const videoIdBlock = sliceBetween(filterLogic, '_extractVideoId(item, rules) {', '        _extractPlaylistId(item) {');
  const playlistIdBlock = sliceBetween(filterLogic, '_extractPlaylistId(item) {', '        _emptyChannelInfo() {');
  const buildBlock = sliceBetween(filterLogic, '_buildCandidate(item, rendererType, wrapperRendererType = null, options = {}) {', '        _candidateSearchText(candidate) {');
  const searchTextBlock = sliceBetween(filterLogic, '_candidateSearchText(candidate) {', '        _regexMatches(regex, text) {');
  const titleBlock = sliceBetween(filterLogic, '_extractTitle(item, rules) {', '        /**\n         * Extract description with fallback methods');
  const descriptionBlock = sliceBetween(filterLogic, '_extractDescription(item, rules) {', '        /**\n         * Parse duration string');
  const channelBlock = sliceBetween(filterLogic, '_extractChannelInfo(item, rules) {', '        /**\n         * Check if a channel matches');
  const avatarBlock = sliceBetween(filterLogic, '            // PRIORITY: Avatar stack collaborations', '            // PRIORITY: Check for collaboration video');
  const dialogBlock = sliceBetween(filterLogic, '            // PRIORITY: Check for collaboration video', '            // Extract using rules');
  const ruleChannelBlock = sliceBetween(filterLogic, '            // Extract using rules', '            return channelInfo;');

  assert.equal(lineCount(collectBlock), 25);
  assert.equal(Buffer.byteLength(collectBlock), 1249);
  assert.equal(lineCount(videoIdBlock), 23);
  assert.equal(Buffer.byteLength(videoIdBlock), 1033);
  assert.equal(lineCount(playlistIdBlock), 16);
  assert.equal(Buffer.byteLength(playlistIdBlock), 670);
  assert.equal(lineCount(buildBlock), 80);
  assert.equal(Buffer.byteLength(buildBlock), 4260);
  assert.equal(lineCount(searchTextBlock), 15);
  assert.equal(Buffer.byteLength(searchTextBlock), 655);
  assert.equal(lineCount(titleBlock), 21);
  assert.equal(Buffer.byteLength(titleBlock), 681);
  assert.equal(lineCount(descriptionBlock), 34);
  assert.equal(Buffer.byteLength(descriptionBlock), 1556);
  assert.equal(lineCount(channelBlock), 318);
  assert.equal(Buffer.byteLength(channelBlock), 18196);
  assert.equal(lineCount(avatarBlock), 101);
  assert.equal(Buffer.byteLength(avatarBlock), 5289);
  assert.equal(lineCount(dialogBlock), 117);
  assert.equal(Buffer.byteLength(dialogBlock), 7760);
  assert.equal(lineCount(ruleChannelBlock), 94);
  assert.equal(Buffer.byteLength(ruleChannelBlock), 4977);

  assert.equal(countLiteral(buildBlock, '_collectTextFromPaths'), 11);
  assert.equal(countLiteral(buildBlock, 'metadataText'), 3);
  assert.equal(countLiteral(buildBlock, 'extractChannelIdentity'), 1);
  assert.equal(countLiteral(channelBlock, 'avatarStackViewModel'), 3);
  assert.equal(countLiteral(channelBlock, 'showDialogCommand'), 11);
  assert.equal(countLiteral(channelBlock, 'getByPath'), 4);
  assert.equal(countLiteral(channelBlock, 'getTextFromPaths'), 3);
  assert.equal(countLiteral(channelBlock, 'return collaborators'), 3);
  assert.equal(countLiteral(channelBlock, 'return channelInfo'), 1);

  for (const phrase of [
    'candidate extraction source/effect blocks: 11',
    'collect text block lines: 25',
    'extract video id block lines: 23',
    'extract playlist id block lines: 16',
    'build candidate block lines: 80',
    'candidate search text block lines: 15',
    'extract title block lines: 21',
    'extract description block lines: 34',
    'extract channel info block lines: 318',
    'avatar stack extraction block lines: 101',
    'showDialog extraction block lines: 117',
    'rule channel extraction block lines: 94',
    'runtime candidate extraction fixtures: 6'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('buildCandidate gates channel identity extraction but still builds metadata text', () => {
  const { filter, messages } = makeFilter();
  const item = videoRenderer();

  const withoutIdentity = filter._buildCandidate(item, 'videoRenderer', null, {
    extractChannelIdentity: false
  });
  assert.equal(withoutIdentity.videoId, 'abc123DEF45');
  assert.equal(withoutIdentity.title, 'Neutral Title');
  assert.equal(withoutIdentity.channel.id, '');
  assert.equal(withoutIdentity.channel.handle, '');
  assert.equal(withoutIdentity.channel.name, '');
  assert.equal(withoutIdentity.metadataText, 'Blocked Metadata Channel');
  assert.deepEqual(messages, []);

  const withIdentity = filter._buildCandidate(item, 'videoRenderer', null, {
    extractChannelIdentity: true
  });
  assert.equal(withIdentity.channel.id, 'UCabcabcabcabcabcabcab');
  assert.equal(withIdentity.channel.handle, '@blockedmeta');
  assert.equal(withIdentity.channel.name, 'Blocked Metadata Channel');
  assert.equal(withIdentity.metadataText, 'Blocked Metadata Channel');
});

test('keyword filtering can match channelName metadata even when channel identity extraction is skipped', () => {
  const harness = loadFilterTubeEngine();
  const payload = {
    items: [{ videoRenderer: videoRenderer({ title: { runs: [{ text: 'Unrelated Title' }] } }) }]
  };

  const result = harness.engine.processData(
    payload,
    settings({ filterKeywords: [keyword('Blocked Metadata Channel')] }),
    'candidate-metadata-keyword-fixture'
  );

  assert.deepEqual(plain(result), { items: [] });
  assert.equal(harness.messages.some((message) => message.type === 'FilterTube_CacheCollaboratorInfo'), false);
});

test('video and playlist extraction validate video ids but accept non-empty playlist ids for mix flags', () => {
  const { filter } = makeFilter();

  assert.equal(
    filter._extractVideoId(
      {
        videoId: 'invalid-video-id',
        navigationEndpoint: { watchEndpoint: { videoId: 'goodID00001' } }
      },
      { videoId: ['videoId', 'navigationEndpoint.watchEndpoint.videoId'] }
    ),
    'goodID00001'
  );
  assert.equal(filter._extractVideoId({ videoId: 'invalid-video-id' }, { videoId: 'videoId' }), '');
  assert.equal(filter._extractPlaylistId({ navigationEndpoint: { watchEndpoint: { playlistId: 'RDabcdef' } } }), 'RDabcdef');

  const candidate = filter._buildCandidate(
    {
      navigationEndpoint: { watchEndpoint: { videoId: 'goodID00001', playlistId: 'RDabcdef' } },
      title: { simpleText: 'Neutral mix' }
    },
    'radioRenderer',
    null,
    { extractChannelIdentity: false }
  );
  assert.equal(candidate.videoId, 'goodID00001');
  assert.equal(candidate.playlistId, 'RDabcdef');
  assert.equal(candidate.isMix, true);
});

test('showDialog collaborator extraction can emit mapping side effects during candidate construction', () => {
  const { filter, messages } = makeFilter();
  const item = videoRenderer({
    videoId: 'collab00001',
    title: { runs: [{ text: 'Joint Upload' }] },
    shortBylineText: { runs: [collaboratorRun()] }
  });

  const candidate = filter._buildCandidate(item, 'videoRenderer', null, {
    extractChannelIdentity: true
  });

  assert.deepEqual(
    plain(
      candidate.collaborators.map((entry) => ({
        name: entry.name,
        id: entry.id,
        handle: entry.handle,
        customUrl: entry.customUrl,
        logo: entry.logo
      }))
    ),
    [
      {
        name: 'Creator One',
        id: 'UCCreatorOne000000000000',
        handle: '@creatorone',
        customUrl: '',
        logo: 'https://example.test/one.jpg'
      },
      {
        name: 'Creator Two',
        id: 'UCCreatorTwo000000000000',
        handle: '',
        customUrl: 'c/CreatorTwo',
        logo: ''
      }
    ]
  );
  assert.deepEqual(
    messages.map((message) => message.type),
    ['FilterTube_UpdateChannelMap', 'FilterTube_UpdateCustomUrlMap']
  );
  assert.deepEqual(plain(messages[1].payload), {
    customUrl: 'c/creatortwo',
    id: 'UCCreatorTwo000000000000'
  });
});

test('documented showSheet collaborator roster is not parsed by filter_logic candidate extraction today', () => {
  const { filter, messages } = makeFilter();
  const item = videoRenderer({
    videoId: 'sheet000001',
    shortBylineText: { runs: [showSheetRun()] }
  });

  const candidate = filter._buildCandidate(item, 'videoRenderer', null, {
    extractChannelIdentity: true
  });

  assert.equal(Array.isArray(candidate.channel), false);
  assert.equal(candidate.collaborators.length, 1);
  assert.equal(candidate.channel.name, 'Sheet One and Sheet Two');
  assert.equal(candidate.channel.id, '');
  assert.equal(candidate.channel.handle, '');
  assert.equal(candidate.channel.customUrl, '');
  assert.deepEqual(messages, []);
});

test('avatar-stack collaborators can remove a mix-like radio renderer through channel rules', () => {
  const harness = loadFilterTubeEngine();
  const payload = { items: [avatarStackRadioRenderer()] };

  const result = harness.engine.processData(
    payload,
    settings({
      filterChannels: [{ id: '', handle: '@matchedavatar', name: '', customUrl: '' }]
    }),
    'candidate-avatar-stack-mix-fixture'
  );

  assert.deepEqual(plain(result), { items: [] });
  assert.equal(harness.messages.some((message) => message.type === 'FilterTube_CacheCollaboratorInfo'), true);

  const { filter } = makeFilter({
    filterChannels: [{ id: '', handle: '@matchedavatar', name: '', customUrl: '' }]
  });
  const candidate = filter._buildCandidate(
    avatarStackRadioRenderer().radioRenderer,
    'radioRenderer',
    null,
    { extractChannelIdentity: true }
  );
  assert.equal(candidate.isMix, true);
  assert.equal(candidate.collaborators.length, 2);
  assert.equal(candidate.collaborators[0].handle, '@matchedavatar');
});

test('runtime source lacks candidate extraction authority symbols', () => {
  const source = productRuntimeSource();

  for (const missing of [
    'jsonFirstCandidateExtractionContract',
    'jsonFirstCandidateExtractionReport',
    'jsonFirstCandidateIdentityGate',
    'jsonFirstCandidateMetadataSearchPolicy',
    'jsonFirstCandidateVideoIdPolicy',
    'jsonFirstCandidatePlaylistPolicy',
    'jsonFirstCandidateCollaborationSourcePolicy',
    'jsonFirstCandidateAvatarStackPolicy',
    'jsonFirstCandidateShowSheetPolicy',
    'jsonFirstCandidateExtractionFixtureProvenance'
  ]) {
    assert.doesNotMatch(source, new RegExp(missing));
  }
});
