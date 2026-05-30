import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

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

function videoRenderer(overrides = {}) {
  return {
    videoId: 'abcdefghijk',
    title: { runs: [{ text: 'Calm test video' }] },
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

function runEngine(payload, settings, options = {}) {
  const { engine } = loadFilterTubeEngine(options);
  return engine.processData(payload, settings, options.dataName || 'fixture');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('empty blocklist mode leaves a simple videoRenderer intact', () => {
  const input = { contents: [{ videoRenderer: videoRenderer() }] };
  const output = runEngine(input, baseSettings());

  assert.deepEqual(plain(output), plain(input));
});

test('disabled filtering returns the original payload reference', () => {
  const input = {
    contents: [{
      videoRenderer: videoRenderer({
        title: { runs: [{ text: 'spider documentary' }] }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    enabled: false,
    filterKeywords: [keyword('spider')]
  }));

  assert.equal(output, input);
});

test('empty whitelist mode currently removes a simple videoRenderer', () => {
  const input = { contents: [{ videoRenderer: videoRenderer() }] };
  const output = runEngine(input, baseSettings({ listMode: 'whitelist' }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('category filter enabled with empty selected currently leaves videoRenderer intact at engine layer', () => {
  const input = { contents: [{ videoRenderer: videoRenderer() }] };
  const output = runEngine(input, baseSettings({
    categoryFilters: { enabled: true, mode: 'block', selected: [] }
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('duration longer filter enabled with zero threshold currently removes any video with duration', () => {
  const input = {
    contents: [{
      videoRenderer: videoRenderer({
        lengthText: { simpleText: '4:00' }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    contentFilters: {
      duration: { enabled: true, condition: 'longer', minMinutes: 0, maxMinutes: 0, value: '' },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    }
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('duration shorter filter enabled with zero threshold currently leaves parsed-duration video intact', () => {
  const input = {
    contents: [{
      videoRenderer: videoRenderer({
        lengthText: { simpleText: '4:00' }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    contentFilters: {
      duration: { enabled: true, condition: 'shorter', minMinutes: 0, maxMinutes: 0, value: '' },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    }
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('duration between filter enabled with zero thresholds currently leaves parsed-duration video intact', () => {
  const input = {
    contents: [{
      videoRenderer: videoRenderer({
        lengthText: { simpleText: '4:00' }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    contentFilters: {
      duration: { enabled: true, condition: 'between', minMinutes: 0, maxMinutes: 0, value: '' },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    }
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('upload-date filter enabled with blank date fields currently leaves videoRenderer intact at engine layer', () => {
  const input = {
    contents: [{
      videoRenderer: videoRenderer({
        publishedTimeText: { simpleText: '2 years ago' }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: true, condition: 'newer', fromDate: '', toDate: '', value: '' },
      uppercase: { enabled: false }
    }
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('duplicate gridVideoRenderer rule currently ignores descriptionSnippet text', () => {
  const input = {
    contents: [{
      gridVideoRenderer: videoRenderer({
        title: { simpleText: 'Neutral title' },
        descriptionSnippet: { runs: [{ text: 'spider appears only in description' }] }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('duplicate gridVideoRenderer rule currently still supports common lengthText duration filtering', () => {
  const input = {
    contents: [{
      gridVideoRenderer: videoRenderer({
        title: { simpleText: 'Neutral grid video' },
        lengthText: { simpleText: '45:00' }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    contentFilters: {
      duration: { enabled: true, condition: 'longer', minMinutes: 10, maxMinutes: 0, value: '' },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    }
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('duplicate gridVideoRenderer rule currently ignores publishedTimeText upload-date filtering', () => {
  const input = {
    contents: [{
      gridVideoRenderer: videoRenderer({
        title: { simpleText: 'Neutral grid video' },
        publishedTimeText: { simpleText: '1 hour ago' }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: true, condition: 'newer', fromDate: '2026-01-01', toDate: '', value: '' },
      uppercase: { enabled: false }
    }
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('shelfRenderer currently hides the whole shelf when shelf title matches a keyword', () => {
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
                title: { runs: [{ text: 'Calm video inside shelf' }] }
              })
            }]
          }
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('richShelfRenderer currently hides the whole rich shelf when shelf title matches a keyword', () => {
  const input = {
    contents: [{
      richShelfRenderer: {
        title: { simpleText: 'spider rich shelf' },
        contents: [{
          richItemRenderer: {
            content: {
              videoRenderer: videoRenderer({
                title: { runs: [{ text: 'Calm rich shelf child video' }] }
              })
            }
          }
        }]
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('compactAutoplayRenderer currently has no direct JSON rule', () => {
  const input = {
    contents: [{
      compactAutoplayRenderer: videoRenderer({
        title: { runs: [{ text: 'spider autoplay suggestion' }] }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('endScreenVideoRenderer currently uses direct BASE_VIDEO_RULES and is removed by keyword', () => {
  const input = {
    elements: [{
      endScreenVideoRenderer: videoRenderer({
        title: { simpleText: 'spider end screen suggestion' }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), { elements: [] });
});

test('compactPlaylistRenderer currently has no direct JSON rule for keyword or channel rules', () => {
  const input = {
    contents: [{
      compactPlaylistRenderer: {
        playlistId: 'PL123',
        title: { simpleText: 'spider playlist suggestion' },
        shortBylineText: {
          runs: [{
            text: 'Playlist Channel',
            navigationEndpoint: {
              browseEndpoint: {
                browseId: 'UC1234567890123456789012',
                canonicalBaseUrl: '/@playlistchannel'
              }
            }
          }]
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')],
    filterChannels: [{ id: 'UC1234567890123456789012', handle: '@playlistchannel' }]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('richItemRenderer wrapping compactPlaylistRenderer currently unwraps to missing direct rule and passes through', () => {
  const input = {
    contents: [{
      richItemRenderer: {
        content: {
          compactPlaylistRenderer: {
            playlistId: 'PL456',
            title: { simpleText: 'spider wrapped playlist suggestion' },
            shortBylineText: {
              runs: [{
                text: 'Wrapped Playlist Channel',
                navigationEndpoint: {
                  browseEndpoint: {
                    browseId: 'UC7777777777777777777777',
                    canonicalBaseUrl: '/@wrappedplaylist'
                  }
                }
              }]
            }
          }
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')],
    filterChannels: [{ id: 'UC7777777777777777777777', handle: '@wrappedplaylist' }]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('direct watchCardRichHeaderRenderer currently has no direct JSON rule', () => {
  const input = {
    contents: [{
      watchCardRichHeaderRenderer: {
        title: { runs: [{ text: 'spider watch card header' }] },
        subtitle: {
          runs: [{
            text: 'Watch Card Channel',
            navigationEndpoint: {
              browseEndpoint: {
                browseId: 'UC1234567890123456789012',
                canonicalBaseUrl: '/@watchcard'
              }
            }
          }]
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('watchCardCompactVideoRenderer currently uses direct BASE_VIDEO_RULES and is removed by keyword', () => {
  const input = {
    contents: [{
      watchCardCompactVideoRenderer: videoRenderer({
        title: { runs: [{ text: 'spider compact watch card' }] }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('nested universalWatchCardRenderer currently filters watch card header text', () => {
  const input = {
    contents: [{
      universalWatchCardRenderer: {
        header: {
          watchCardRichHeaderRenderer: {
            title: { runs: [{ text: 'spider nested watch card header' }] }
          }
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('direct watchCardHeroVideoRenderer currently has no direct JSON rule', () => {
  const input = {
    contents: [{
      watchCardHeroVideoRenderer: {
        watchEndpoint: { videoId: 'abcdefghijk' },
        callToActionButton: {
          callToActionButtonRenderer: {
            label: { simpleText: 'spider hero video' }
          }
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('direct watchCardRHPanelVideoRenderer currently has no direct JSON rule', () => {
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
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')],
    filterChannels: [{ id: 'UC6666666666666666666666', handle: '@rhspanel' }]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('postRenderer currently has no direct JSON rule', () => {
  const input = {
    contents: [{
      postRenderer: {
        authorText: { runs: [{ text: 'Post Channel' }] },
        contentText: { runs: [{ text: 'spider community post' }] }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('legacy backstagePostRenderer currently blocks by keyword and author channel', () => {
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
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')],
    filterChannels: [{ id: 'UC8888888888888888888888', handle: '@legacypost' }]
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('legacy backstagePostThreadRenderer currently blocks nested post text and author channel', () => {
  const input = {
    contents: [{
      backstagePostThreadRenderer: {
        post: {
          backstagePostRenderer: {
            authorText: { simpleText: 'Legacy Thread Channel' },
            authorEndpoint: {
              browseEndpoint: {
                browseId: 'UC9999999999999999999999',
                canonicalBaseUrl: '/@legacythread'
              }
            },
            contentText: { runs: [{ text: 'spider legacy thread post' }] }
          }
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')],
    filterChannels: [{ id: 'UC9999999999999999999999', handle: '@legacythread' }]
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('sharedPostRenderer currently has no direct JSON rule and does not filter nested original post text', () => {
  const input = {
    contents: [{
      sharedPostRenderer: {
        authorText: { simpleText: 'Sharer Channel' },
        originalPost: {
          postRenderer: {
            authorText: { runs: [{ text: 'Original Channel' }] },
            contentText: { runs: [{ text: 'spider shared community post' }] }
          }
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('playlistPanelRenderer currently has no direct JSON rule but recurses into playlistPanelVideoRenderer entries', () => {
  const input = {
    contents: [{
      playlistPanelRenderer: {
        title: { simpleText: 'spider playlist panel header' },
        contents: [{
          playlistPanelVideoRenderer: videoRenderer({
            title: { runs: [{ text: 'spider playlist panel video' }] }
          })
        }]
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), {
    contents: [{
      playlistPanelRenderer: {
        title: { simpleText: 'spider playlist panel header' },
        contents: []
      }
    }]
  });
});

test('channelMetadataRenderer currently has no direct JSON rule', () => {
  const input = {
    metadata: {
      channelMetadataRenderer: {
        title: 'Neutral Channel',
        description: 'spider appears in the channel about text',
        externalId: 'UC1234567890123456789012',
        vanityChannelUrl: 'https://www.youtube.com/@neutralchannel'
      }
    }
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('channelRenderer currently blocks by channel rule but ignores keyword-only text', () => {
  const input = {
    contents: [{
      channelRenderer: {
        channelId: 'UC5555555555555555555555',
        title: { simpleText: 'spider channel title' },
        displayName: { simpleText: 'spider channel title' },
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UC5555555555555555555555',
            canonicalBaseUrl: '/@spiderchannel'
          }
        }
      }
    }]
  };

  const keywordOutput = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));
  assert.deepEqual(plain(keywordOutput), plain(input));

  const channelOutput = runEngine(input, baseSettings({
    filterChannels: [{ id: 'UC5555555555555555555555', handle: '@spiderchannel' }]
  }));
  assert.deepEqual(plain(channelOutput), { contents: [] });
});

test('compactChannelRenderer currently has no direct JSON rule for channel rules', () => {
  const input = {
    contents: [{
      compactChannelRenderer: {
        channelId: 'UC5555555555555555555555',
        displayName: { runs: [{ text: 'Blocked Compact Channel' }] },
        subscriberCountText: { runs: [{ text: '@blockedcompact' }] },
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UC5555555555555555555555',
            canonicalBaseUrl: '/@blockedcompact'
          }
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterChannels: [{ id: 'UC5555555555555555555555', handle: '@blockedcompact' }]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('searchRefinementCardRenderer currently has no direct JSON rule for keyword or channel rules', () => {
  const input = {
    contents: [{
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
        },
        thumbnail: { thumbnails: [{ url: 'https://example.invalid/thumb.jpg' }] }
      }
    }]
  };

  const keywordOutput = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));
  assert.deepEqual(plain(keywordOutput), plain(input));

  const channelOutput = runEngine(input, baseSettings({
    filterChannels: [{ id: 'UC5555555555555555555555', handle: '@blockedrefinement' }]
  }));
  assert.deepEqual(plain(channelOutput), plain(input));
});

test('horizontalCardListRenderer currently preserves search refinement children with no direct rule', () => {
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
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')],
    filterChannels: [{ id: 'UC5555555555555555555555', handle: '@blockedrefinement' }]
  }));

  assert.deepEqual(plain(output), plain(input));
});

function commentRenderer(overrides = {}) {
  return {
    commentId: 'Ugw-comment-fixture',
    authorText: { simpleText: 'Calm Commenter' },
    authorEndpoint: {
      browseEndpoint: {
        browseId: 'UC4444444444444444444444',
        canonicalBaseUrl: '/@calmcommenter'
      }
    },
    contentText: { runs: [{ text: 'Calm comment body' }] },
    ...overrides
  };
}

test('commentRenderer currently ignores serialized comment keyword list', () => {
  const input = {
    contents: [{
      commentRenderer: commentRenderer({
        contentText: { runs: [{ text: 'spider appears in comment body' }] }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywordsComments: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('commentRenderer currently blocks when comment keyword list already contains RegExp objects', () => {
  const input = {
    contents: [{
      commentRenderer: commentRenderer({
        contentText: { runs: [{ text: 'spider appears in comment body' }] }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywordsComments: [/spider/i]
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('commentRenderer currently still blocks by global keyword even when comment keyword list is empty', () => {
  const input = {
    contents: [{
      commentRenderer: commentRenderer({
        contentText: { runs: [{ text: 'spider appears in comment body' }] }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')],
    filterKeywordsComments: []
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('commentRenderer currently blocks by author channel rule', () => {
  const input = {
    contents: [{
      commentRenderer: commentRenderer()
    }]
  };
  const output = runEngine(input, baseSettings({
    filterChannels: [{ id: 'UC4444444444444444444444', handle: '@calmcommenter' }]
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('commentThreadRenderer currently hides whole thread when hideAllComments is enabled', () => {
  const input = {
    contents: [{
      commentThreadRenderer: {
        comment: {
          commentRenderer: commentRenderer()
        },
        replies: {
          commentRepliesRenderer: {
            contents: []
          }
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    hideAllComments: true
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('commentsHeaderRenderer currently has no direct JSON rule even when hideAllComments is enabled', () => {
  const input = {
    contents: [{
      commentsHeaderRenderer: {
        countText: { runs: [{ text: '10 comments' }] },
        titleText: { simpleText: 'Comments' }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    hideAllComments: true
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('shortsLockupViewModel currently blocks title keywords but not channel-only rules without videoChannelMap', () => {
  const keywordInput = {
    contents: [{
      shortsLockupViewModel: {
        accessibilityText: 'spider short from Shorts Channel',
        onTap: { innertubeCommand: { reelWatchEndpoint: { videoId: 'abcdefghijk' } } }
      }
    }]
  };
  const keywordOutput = runEngine(keywordInput, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(keywordOutput), { contents: [] });

  const channelInput = {
    contents: [{
      shortsLockupViewModel: {
        accessibilityText: 'Neutral short from Blocked Shorts Channel',
        onTap: { innertubeCommand: { reelWatchEndpoint: { videoId: 'abcdefghijk' } } }
      }
    }]
  };
  const channelOutput = runEngine(channelInput, baseSettings({
    filterChannels: ['@blockedshortschannel']
  }));

  assert.deepEqual(plain(channelOutput), plain(channelInput));
});

test('shortsLockupViewModel currently ignores belowThumbnailMetadata owner identity for channel rules', () => {
  const input = {
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
  const output = runEngine(input, baseSettings({
    filterChannels: [{ id: 'UC9999999999999999999999', handle: '@blockedshortsowner' }]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('reelItemRenderer currently blocks by title keyword but has no UC or handle extraction path', () => {
  const input = {
    contents: [{
      reelItemRenderer: {
        videoId: 'abcdefghijk',
        headline: { simpleText: 'Neutral reel title' },
        navigationEndpoint: {
          reelWatchEndpoint: {
            overlay: {
              reelPlayerOverlayRenderer: {
                reelPlayerHeaderSupportedRenderers: {
                  reelPlayerHeaderRenderer: {
                    channelTitleText: { simpleText: 'Blocked Reel Channel' },
                    channelNavigationEndpoint: {
                      browseEndpoint: {
                        browseId: 'UC9999999999999999999999',
                        canonicalBaseUrl: '/@blockedreel'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterChannels: [{ handle: '@blockedreel' }]
  }));

  assert.deepEqual(plain(output), plain(input));

  const keywordOutput = runEngine({
    contents: [{
      reelItemRenderer: {
        videoId: 'abcdefghijk',
        headline: { simpleText: 'spider reel title' }
      }
    }]
  }, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(keywordOutput), { contents: [] });
});

test('lockupViewModel currently ignores metadata row command-run channel id without decorated avatar identity', () => {
  const input = {
    contents: [{
      lockupViewModel: {
        contentId: 'abcdefghijk',
        metadata: {
          lockupMetadataViewModel: {
            title: { content: 'Neutral lockup video' },
            metadata: {
              contentMetadataViewModel: {
                metadataRows: [{
                  metadataParts: [{
                    text: {
                      content: 'Blocked Row Channel',
                      commandRuns: [{
                        onTap: {
                          innertubeCommand: {
                            browseEndpoint: {
                              browseId: 'UC8888888888888888888888',
                              canonicalBaseUrl: '/@blockedrow'
                            }
                          }
                        }
                      }]
                    }
                  }]
                }]
              }
            }
          }
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterChannels: [{ id: 'UC8888888888888888888888', handle: '@blockedrow' }]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('videoWithContextRenderer currently ignores showSheetCommand collaborator roster for channel rules', () => {
  const input = {
    contents: [{
      videoWithContextRenderer: {
        videoId: 'abcdefghijk',
        headline: { runs: [{ text: 'Neutral collaboration video' }] },
        shortBylineText: {
          runs: [{
            text: 'Creator A and Blocked Collaborator',
            navigationEndpoint: {
              showSheetCommand: {
                panelLoadingStrategy: {
                  inlineContent: {
                    sheetViewModel: {
                      content: {
                        listViewModel: {
                          listItems: [{
                            listItemViewModel: {
                              title: { content: 'Creator A' },
                              rendererContext: {
                                commandContext: {
                                  onTap: {
                                    innertubeCommand: {
                                      browseEndpoint: {
                                        browseId: 'UC1111111111111111111111',
                                        canonicalBaseUrl: '/@creatora'
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }, {
                            listItemViewModel: {
                              title: { content: 'Blocked Collaborator' },
                              rendererContext: {
                                commandContext: {
                                  onTap: {
                                    innertubeCommand: {
                                      browseEndpoint: {
                                        browseId: 'UC7777777777777777777777',
                                        canonicalBaseUrl: '/@blockedcollab'
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
                  }
                }
              }
            }
          }]
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterChannels: [{ id: 'UC7777777777777777777777', handle: '@blockedcollab' }]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('videoWithContextRenderer currently blocks showDialogCommand collaborator roster for channel rules', () => {
  const input = {
    contents: [{
      videoWithContextRenderer: {
        videoId: 'abcdefghijk',
        headline: { runs: [{ text: 'Neutral collaboration video' }] },
        shortBylineText: {
          runs: [{
            text: 'Creator A and Blocked Collaborator',
            navigationEndpoint: {
              showDialogCommand: {
                panelLoadingStrategy: {
                  inlineContent: {
                    dialogViewModel: {
                      customContent: {
                        listViewModel: {
                          listItems: [{
                            listItemViewModel: {
                              title: { content: 'Creator A' },
                              rendererContext: {
                                commandContext: {
                                  onTap: {
                                    innertubeCommand: {
                                      browseEndpoint: {
                                        browseId: 'UC1111111111111111111111',
                                        canonicalBaseUrl: '/@creatora'
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }, {
                            listItemViewModel: {
                              title: { content: 'Blocked Collaborator' },
                              rendererContext: {
                                commandContext: {
                                  onTap: {
                                    innertubeCommand: {
                                      browseEndpoint: {
                                        browseId: 'UC7777777777777777777777',
                                        canonicalBaseUrl: '/@blockedcollab'
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
                  }
                }
              }
            }
          }]
        }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterChannels: [{ id: 'UC7777777777777777777777', handle: '@blockedcollab' }]
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('radioRenderer avatar stacks currently can be treated as collaboration identity and blocked by channel rules', () => {
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
  const output = runEngine(input, baseSettings({
    filterChannels: [{ id: 'UC6666666666666666666666', handle: '@blockedartist' }]
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('expandableMetadataRenderer currently has no direct JSON rule', () => {
  const input = {
    contents: [{
      expandableMetadataRenderer: {
        header: { runs: [{ text: 'AI summary' }] },
        expandedContent: { runs: [{ text: 'spider appears in generated summary' }] }
      }
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('engine layer is endpoint agnostic and will filter a videoRenderer inside player-shaped data', () => {
  const input = {
    playabilityStatus: { status: 'OK' },
    related: {
      contents: [{
        videoRenderer: videoRenderer({
          title: { runs: [{ text: 'spider match inside player response' }] }
        })
      }]
    }
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }), { dataName: 'player' });

  assert.deepEqual(plain(output), {
    playabilityStatus: { status: 'OK' },
    related: { contents: [] }
  });
});

test('harvestOnly currently emits video-channel map writes from renderer bylines', () => {
  const runtime = loadFilterTubeEngine();
  const input = {
    contents: [{
      videoRenderer: videoRenderer({
        videoId: 'abcdeFGHI12',
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
        }
      })
    }]
  };

  runtime.engine.harvestOnly(input, baseSettings());
  runtime.flushTimers();

  assert.deepEqual(plain(runtime.messages.filter(message => message?.type === 'FilterTube_UpdateVideoChannelMap')), [{
    type: 'FilterTube_UpdateVideoChannelMap',
    payload: [{ videoId: 'abcdeFGHI12', channelId: 'UC1234567890123456789012' }],
    source: 'filter_logic'
  }]);
});

test('harvestOnly currently emits video-meta map writes from player metadata', () => {
  const runtime = loadFilterTubeEngine();
  const input = {
    videoDetails: {
      videoId: 'abcdeFGHI12',
      videoOwnerChannelId: 'UC1234567890123456789012',
      lengthSeconds: '245'
    },
    microformat: {
      playerMicroformatRenderer: {
        ownerProfileUrl: 'https://www.youtube.com/@calmchannel',
        publishDate: '2026-05-01',
        uploadDate: '2026-05-02',
        category: 'Education'
      }
    }
  };

  runtime.engine.harvestOnly(input, baseSettings());
  runtime.flushTimers();

  assert.deepEqual(plain(runtime.messages.filter(message => message?.type === 'FilterTube_UpdateVideoMetaMap')), [{
    type: 'FilterTube_UpdateVideoMetaMap',
    payload: [{
      videoId: 'abcdeFGHI12',
      lengthSeconds: '245',
      publishDate: '2026-05-01',
      uploadDate: '2026-05-02',
      category: 'Education'
    }],
    source: 'filter_logic'
  }]);
});
