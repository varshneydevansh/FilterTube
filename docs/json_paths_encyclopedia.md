# Root Response Wrappers (XHR vs Initial Data)

---

# Absolute JSON Trace: Subscribed Channels Import (`FEchannels`)
*Files: `ytm_browse?prettyPrint=false.json`, desktop `/feed/channels` page data, live `youtubei/v1/browse?prettyPrint=false` responses*

For subscribed-channels import, the important payload family is `browseId: "FEchannels"`.

**Primary renderer path**:
- recursively discovered `...channelListItemRenderer`
- desktop fallback `...channelRenderer`

**Fields FilterTube currently normalizes**:
- **Channel ID (Primary)**: `...channelListItemRenderer.channelId`
- **Channel ID (Endpoint Fallback)**: `...channelListItemRenderer.navigationEndpoint.browseEndpoint.browseId`
- **Canonical URL / Handle Path**: `...channelListItemRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl`
- **Navigation URL Fallback**: `...channelListItemRenderer.navigationEndpoint.commandMetadata.webCommandMetadata.url`
- **Display Name**: `...channelListItemRenderer.title.runs[0].text`
- **Thumbnail**: `...channelListItemRenderer.thumbnail.thumbnails[n].url`
- **Timestamp**: `...channelListItemRenderer.timestampMs`

**Continuation token**:
- recursive `...continuationCommand.token`

**Equivalent desktop DOM shell**:
- `ytd-channel-renderer`

**Equivalent mobile DOM shell**:
- `ytm-channel-list-item-renderer`

These paths are used for whitelist import normalization, not for normal feed filtering.


SUBSCRIBER list JSON

"collapsedItemCount": 983,
                          "collapsedStateButtonText": {
                            "runs": [
                              {
                                "text": "More"
                              }
                            ],
                            "accessibility": {
                              "accessibilityData": {
                                "label": "More"
                              }
                            }
                          },
                          "trackingParams": "CAoQuj4iEwiav--jg6yTAxUkLbcAHcDiD9w="
                        }
                      },
                      "trackingParams": "CAkQ3BwYACITCJq_76ODrJMDFSQttwAdwOIP3A=="
                    }
                  },
                  {
                    "continuationItemRenderer": {
                      "trigger": "CONTINUATION_TRIGGER_ON_ITEM_SHOWN",
                      "continuationEndpoint": {
                        "clickTrackingParams": "CAcQui8iEwiav--jg6yTAxUkLbcAHcDiD9zKAQS7jUeA",
                        "commandMetadata": {
                          "webCommandMetadata": {
                            "sendPost": true,
                            "apiUrl": "/youtubei/v1/browse"
                          }
                        },
                        "continuationCommand": {
                          "token": "4qmFsgKIARIKRkVjaGFubmVscxpiQ0FGNlEwTkJRVkZCYVVselEyaG9WbEV3TVRSVGJFSnFZVVZrVFZKV09VUlRha1pPVTIxS1MyVlRNVFJTUmtWVFJVZHNkVmt6U214YVIyeHBZa2RWWjJGWE5XdGhWMFUlM0SaAhVicm93c2UtZmVlZEZFY2hhbm5lbHM%3D",
                          "request": "CONTINUATION_REQUEST_TYPE_BROWSE"
                        }
                      }
                    }
                  }
                ],
                "continuations": [
                  {
                    "reloadContinuationData": {
                      "continuation": "4qmFsgIMEgpGRWNoYW5uZWxz",
                      "clickTrackingParams": "CAgQxqYCIhMImr_vo4OskwMVJC23AB3A4g_cygEEu41HgA=="
                    }
                  }
                ],
                "trackingParams": "CAcQui8iEwiav--jg6yTAxUkLbcAHcDiD9w=",
                "targetId": "browse-feedFEchannels"
              }
            },
            "tabIdentifier": "FEchannels",
            "accessibility": {
              "accessibilityData": {
                "label": "channels"
              }
            },
            "trackingParams": "CAYQ8JMBGAEiEwiav--jg6yTAxUkLbcAHcDiD9w="
          }
        }
      ]
    }
  },







----

Before diving into specific components, it's crucial to understand how YouTube delivers JSON payloads. They generally arrive in two structural wrappers depending on the context:

### 1. Main Feed / Initial Page Load (`ytInitialData` or Browse XHR)
When navigating to the homepage or a fresh page load, content is nested deep within standard page tabs.
**Base Path**: `contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents[i].richItemRenderer.content`

**Hex-Encoded `ytInitialData` Note**:
Often, on direct page loads, the DOM will contain a script tag with `var ytInitialData = '\x7b\x22...`. This is a Hex-encoded JSON string used by YouTube to prevent XSS.
- `\x7b` = `{`, `\x22` = `"`, `\x5b` = `[`
- *Extractor Logic*: If scraping this from the DOM regex, you must unescape the hex values (e.g., `str.replace(/\\x([0-9A-Fa-f]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)))`) before calling `JSON.parse()`.

### 2. Up Next / Infinite Scroll / XHR (`onResponseReceivedEndpoints` / `onResponseReceivedCommands`)
When scrolling or loading sidebar recommendations via AJAX/Fetch, YouTube appends items via continuation actions.
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i]`
*(Note: Depending on the specific API endpoint, such as `/search`, this wrapper is sometimes named `onResponseReceivedCommands[0]...` instead of `Endpoints`.)*
*(Specific components then follow directly, e.g., `.videoWithContextRenderer`, `.compactRadioRenderer`, `.richItemRenderer`, or are wrapped in an `.itemSectionRenderer.contents[0]`)*

---

# Absolute JSON Trace: Collaborator Roster (`videoWithContextRenderer`)
*File: `YTM-XHR.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`, `collab.json`*

**Base Path to Item**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer`

**Main Video Context**:
- **Video ID**: `...videoId` -> Value: `"41ZY18JqI2A"`
- **Length/Duration Badge**: `...lengthText.runs[0].text` -> Value: `"3:37"`
- **View Count Category**: `...shortViewCountText.runs[0].text` -> Value: `"4.6 crore views"`
- **Thumbnail URL**: `...thumbnail.thumbnails[0].url`
- **Is Watched State**: `...isWatched` -> Value: `false`
- **Resume Playback Overlay**: `...thumbnailOverlays[0].thumbnailOverlayResumePlaybackRenderer.percentDurationWatched` -> Value: `100` (Found when `isWatched` is true)

**Action Menu / Feedback**:
- **Menu Items Path**: `...menu.menuRenderer.items[]`
- **"Save to Watch Later"**: *Found in `menuServiceItemRenderer` where `iconType` is `"ADD_TO_WATCH_LATER"`* -> `...serviceEndpoint.playlistEditEndpoint.playlistId` -> Value: `"WL"`
- **"Save to playlist"**: *Found in `menuNavigationItemRenderer` where `iconType` is `"BOOKMARK_BORDER"`* -> `...navigationEndpoint.showSheetCommand.panelLoadingStrategy.requestTemplate.panelId` -> Value: `"PAadd_to_playlist"`
- **"Not interested" Feedback Token**: *Found in `menuServiceItemRenderer` where `iconType` is `"NOT_INTERESTED"`* -> `...serviceEndpoint.feedbackEndpoint.feedbackToken`
- **"Don't recommend channel" Feedback Token**: *Found in `menuServiceItemRenderer` where `iconType` is `"REMOVE"`* -> `...serviceEndpoint.feedbackEndpoint.feedbackToken`

**Main Uploader Details (Outside the Sheet)**:
- **Main Uploader Name**: `...shortBylineText.runs[0].text` -> Value: `"Shakira and 2 more"` (Note: requires regex to strip 'and N more')
- **Main Uploader ID (Fallback 1 - Avatar)**: `...channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId` -> Value: `"UCYLNGLIzMhRTi6ZOLjAPSmw"`
- **Main Uploader ID (Fallback 2 - Byline)**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId` (Sometimes missing if replaced by `showSheetCommand`)

**Header/Trigger Check (The Roster)**:
- Path: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.header.panelHeaderViewModel.title.content`
- Expected Value: `"Collaborators"`

**Authoritative roster rule (2026-04-28)**:
- Treat the sheet above as the canonical collaborator roster for that `videoId`.
- `avatarStackViewModel`, direct `listViewModel`, DOM byline, and collapsed text (`"A and 2 more"`) are only fallback/warm-up signals.
- A fallback candidate must not replace a header-backed `"Collaborators"` sheet just because it has more rows.
- Weak name-only composite entries must be pruned before caching or menu rendering. Example: if a fallback returns `Bizarrap`, `Daddy Yankee Bizarrap`, and `Daddy Yankee`, the middle entry is a composite label, not a third channel.
- Expected collaborator count must collapse with that pruned list when the inflated count came from the fallback candidate.

**Uploader / Collaborator 1 (Index 0 - e.g., shakiraVEVO)**:
- **Channel ID**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` -> Value: `"UCYLNGLIzMhRTi6ZOLjAPSmw"`
- **Channel Name**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.title.content` -> Value: `"shakiraVEVO"`
- **Channel Handle (Alternate ID)**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl` -> Value: `"/@shakiraVEVO"`
- **Category/Sub-Count Badge**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.subtitle.content` -> Value: `"‎⁨@shakiraVEVO⁩ • ⁨4.98 crore subscribers⁩"`
- **Channel Logo**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.leadingAccessory.avatarViewModel.image.sources[0].url` -> Value: `"https://yt3.ggpht.com/..."`

**Collaborator 2 (Index 1 - e.g., Spotify)**:
- **Channel ID**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` -> Value: `"UCRMqQWxCWE0VMvtUElm-rEA"`
- **Channel Name**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.title.content` -> Value: `"Spotify"`
- **Channel Handle (Alternate ID)**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl` -> Value: `"/@Spotify"`
- **Category/Sub-Count Badge**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.subtitle.content` -> Value: `"‎⁨@Spotify⁩ • ⁨22.4 lakh subscribers⁩"`
- **Channel Logo**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[1].listItemViewModel.leadingAccessory.avatarViewModel.image.sources[0].url` -> Value: `"https://yt3.ggpht.com/..."`

**Collaborator 3 (Index 2 - e.g., Beéle)**:
- **Channel ID**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[2].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` -> Value: `"UCYAQgXVSRzUeNo34-RJOWUw"`
- **Channel Name**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[2].listItemViewModel.title.content` -> Value: `"Beéle"`
- **Channel Handle (Alternate ID)**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[2].listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl` -> Value: `"/@beele"`
- **Category/Sub-Count Badge**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[2].listItemViewModel.subtitle.content` -> Value: `"‎⁨@beele⁩ • ⁨23.7 lakh subscribers⁩"`
- **Channel Logo**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[2].listItemViewModel.leadingAccessory.avatarViewModel.image.sources[0].url` -> Value: `"https://yt3.ggpht.com/..."`

THE JSON STRUCTURE CAN BE FIND IN @collab.json file

---

# Absolute JSON Trace: YouTube Generated MIX (`compactRadioRenderer` & `radioRenderer`)
*File: `YTM-XHR.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json`, `Home Page Context`*

MIX cards appear in two variants based on their location. `radioRenderer` is found on the main Home feed (`richItemRenderer`), while `compactRadioRenderer` is found in the Up Next sidebar.

### `radioRenderer` (Main Feed / Home)
**Base Path**: `...richItemRenderer.content.radioRenderer`

**Identifiers**:
- **MIX ID (Playlist ID)**: `...playlistId` -> Value: `"RDrQI5REp1gio"` (Always starts with `RD`)
- **Seed Video ID (Fallback Watch Target)**: `...navigationEndpoint.watchEndpoint.videoId` -> Value: `"rQI5REp1gio"`
- **Inline Playback Video ID (Preview)**: `...inlinePlaybackEndpoint.watchEndpoint.videoId` -> Value: `"rQI5REp1gio"`

**Display Details**:
- **Title**: `...title.runs[0].text` -> Value: `"Mix – BTS (방탄소년단) 'Filter' by Jimin FMV"`
- **Byline Artists (Long Byline)**: `...longBylineText.runs[0].text` -> Value: `"BTS, Jimin, DJ Snake and more"` *(Note: `shortBylineText` is entirely omitted in this variant).*
- **Artist Metadata Runs**: `...longBylineText.runs` (Contains list of artists in the mix)
- **Badge / Category Indicator (Bottom Panel Icon)**: `...thumbnailOverlays[0].thumbnailOverlayBottomPanelRenderer.icon.iconType` -> Value: `"MIX"`
- **Mix Icon**: `...thumbnailOverlays[0].thumbnailOverlayBottomPanelRenderer.icon.iconType` -> Value: `"MIX"`
- **Video Count Text**: `...videoCountText.runs[0].text` -> Value: `"50+ videos"`
- **Menu / Feedback Token**: `...menu.menuRenderer.items[2].menuServiceItemRenderer.serviceEndpoint.feedbackEndpoint.feedbackToken`

### `compactRadioRenderer` (Up Next / Sidebar)
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].compactRadioRenderer`

**Identifiers**:
- **MIX ID (Playlist ID)**: `...playlistId` -> Value: `"RDEPo5wWmKEaI"` (Always starts with `RD`)
- **Seed Video ID (Fallback Watch Target)**: `...navigationEndpoint.watchEndpoint.videoId` -> Value: `"EPo5wWmKEaI"`
- **Seed Video URL**: `...navigationEndpoint.commandMetadata.webCommandMetadata.url` -> Value: `"/watch?v=EPo5wWmKEaI&list=RDEPo5wWmKEaI&start_radio=1&rv=WbmzuLlq7pw"`
- **Seed Video Params**: `...navigationEndpoint.watchEndpoint.params` -> Value: `"OALAAQHCAwtXYm16dUxscTdwdw%3D%3D"`
- **Alternate / Next Video ID (Secondary)**: `...secondaryNavigationEndpoint.watchEndpoint.videoId` -> Value: `"t4H_Zoh7G5A"`
- **Alternate Video URL**: `...secondaryNavigationEndpoint.commandMetadata.webCommandMetadata.url` -> Value: `"/watch?v=t4H_Zoh7G5A&list=RDEPo5wWmKEaI&start_radio=1"`
- **Alternate Video Params**: `...secondaryNavigationEndpoint.watchEndpoint.params` -> Value: `"OALAAQE%3D"`

**Display Details**:
- **Title**: `...title.runs[0].text` -> Value: `"Mix – Pitbull - Give Me Everything ft. Ne-Yo, Afrojack, Nayer"`
- **Byline Channel Name (Short)**: `...shortBylineText.runs[0].text` -> Value: `"YouTube"`
- **Byline Channel Name (Long)**: `...longBylineText.runs[0].text` -> Value: `"YouTube"`
- **Video Count Text**: `...videoCountText.runs[0].text` -> Value: `"50+ videos"`
- **Video Count Short**: `...videoCountShortText.runs[0].text` -> Value: `"50+"`
- **Thumbnail Overlay Text**: `...thumbnailText.runs[0].text` + `...thumbnailText.runs[1].text` -> Value: `"50+ videos"` (With `bold: true` on the first run)
- **Share URL**: `...shareUrl` -> Value: `"https://www.youtube.com/watch?v=EPo5wWmKEaI&playnext=1&list=RDEPo5wWmKEaI"`
- **Like Button Status**: `...likeButton.likeButtonRenderer.likeStatus` -> Value: `"INDIFFERENT"`
- **Like Button Target ID**: `...likeButton.likeButtonRenderer.target.playlistId` -> Value: `"RDEPo5wWmKEaI"`
- **Thumbnail URL**: `...thumbnail.thumbnails[0].url` -> Value: `"https://i.ytimg.com/vi/EPo5wWmKEaI/default.jpg..."`
- **Badge / Category Indicator (Bottom Panel Icon)**: `...thumbnailOverlays[0].thumbnailOverlayBottomPanelRenderer.icon.iconType` -> Value: `"MIX"`
- **Badge / Category Indicator (Bottom Panel Text)**: `...thumbnailOverlays[0].thumbnailOverlayBottomPanelRenderer.text.runs[0].text` -> Value: `"Mix"`

*Important Note: MIX cards are generated by YouTube ("YouTube" byline) and do NOT have an owner `channelId` anywhere in the payload. The `playlistId` (starting with RD) is the primary, deterministic identifier. Filtering must occur on the `playlistId` or by intercepting the seed video ID if a strict channel block is required.*

**Mix-vs-collaborator discriminator rule (2026-04-28)**:
- `radioRenderer` and `compactRadioRenderer` are Mix/Radio playlist renderers, not collaborator renderers.
- `thumbnailOverlayBottomPanelRenderer.icon.iconType == "MIX"` and/or overlay text `"Mix"` must block collaborator promotion for that card.
- Titles beginning with `Mix -`, `Mix –`, or `Mix —` are Mix title signals, not collaborator labels.
- Seed artist text in a Mix title/byline can contain commas, `and`, `&`, or `more`; that text must not create collaborator menu rows.
- A Mix card can still link to a seed video that is itself a collaboration. In that case collaborator recovery must happen from the seed video's watch/search JSON, not from the Mix container text.

MIX card JSON -
{
    "compactRadioRenderer": {
        "playlistId": "RDEPo5wWmKEaI",
        "thumbnail": {
            "thumbnails": [
                {
                    "url": "https://i.ytimg.com/vi/EPo5wWmKEaI/default.jpg?sqp=-oaymwEkCHgQWvKriqkDGvABAfgB_gmAAtAFigIMCAAQARhTIFooZTAP&rs=AOn4CLBNMEyX5e-GY-c8NTDaTvx1AXlMGg",
                    "width": 120,
                    "height": 90
                },
                {
                    "url": "https://i.ytimg.com/vi/EPo5wWmKEaI/mqdefault.jpg?sqp=-oaymwEmCMACELQB8quKqQMa8AEB-AH-CYAC0AWKAgwIABABGFMgWihlMA8=&rs=AOn4CLCJAxBBD3t3aWTS0UjVymK7PhPolQ",
                    "width": 320,
                    "height": 180
                },
                {
                    "url": "https://i.ytimg.com/vi/EPo5wWmKEaI/hqdefault.jpg?sqp=-oaymwEmCOADEOgC8quKqQMa8AEB-AH-CYAC0AWKAgwIABABGFMgWihlMA8=&rs=AOn4CLD7n251X_hsfTEtgNxd3sUrSg12Pg",
                    "width": 480,
                    "height": 360
                }
            ],
            "sampledThumbnailColor": {
                "red": 72,
                "green": 79,
                "blue": 89
            },
            "darkColorPalette": {
                "section2Color": 2698547,
                "iconInactiveColor": 7898003,
                "iconDisabledColor": 4738905
            },
            "vibrantColorPalette": {
                "iconInactiveColor": 8161433
            }
        },
        "title": {
            "runs": [
                {
                    "text": "Mix – Pitbull - Give Me Everything ft. Ne-Yo, Afrojack, Nayer"
                }
            ]
        },
        "navigationEndpoint": {
            "clickTrackingParams": "CDkQozAYBCITCMGFi6CN_5IDFeqfSwUd2scnVDIJbWl4LXdhdGNomgEFCAwQ-B3KAQS7jUeA",
            "commandMetadata": {
                "webCommandMetadata": {
                    "url": "/watch?v=EPo5wWmKEaI&list=RDEPo5wWmKEaI&start_radio=1&rv=WbmzuLlq7pw",
                    "webPageType": "WEB_PAGE_TYPE_WATCH",
                    "rootVe": 3832
                }
            },
            "watchEndpoint": {
                "videoId": "EPo5wWmKEaI",
                "playlistId": "RDEPo5wWmKEaI",
                "params": "OALAAQHCAwtXYm16dUxscTdwdw%3D%3D",
                "continuePlayback": true,
                "loggingContext": {
                    "vssLoggingContext": {
                        "serializedContextData": "Gg1SREVQbzV3V21LRWFJ"
                    }
                }
            }
        },
        "videoCountText": {
            "runs": [
                {
                    "text": "50+ videos"
                }
            ]
        },
        "secondaryNavigationEndpoint": {
            "clickTrackingParams": "CDkQozAYBCITCMGFi6CN_5IDFeqfSwUd2scnVDIJbWl4LXdhdGNomgEFCAwQ-B3KAQS7jUeA",
            "commandMetadata": {
                "webCommandMetadata": {
                    "url": "/watch?v=t4H_Zoh7G5A&list=RDEPo5wWmKEaI&start_radio=1",
                    "webPageType": "WEB_PAGE_TYPE_WATCH",
                    "rootVe": 3832
                }
            },
            "watchEndpoint": {
                "videoId": "t4H_Zoh7G5A",
                "playlistId": "RDEPo5wWmKEaI",
                "params": "OALAAQE%3D",
                "loggingContext": {
                    "vssLoggingContext": {
                        "serializedContextData": "Gg1SREVQbzV3V21LRWFJ"
                    }
                }
            }
        },
        "shortBylineText": {
            "runs": [
                {
                    "text": "YouTube"
                }
            ]
        },
        "longBylineText": {
            "runs": [
                {
                    "text": "YouTube"
                }
            ]
        },
        "trackingParams": "CDkQozAYBCITCMGFi6CN_5IDFeqfSwUd2scnVA==",
        "thumbnailText": {
            "runs": [
                {
                    "text": "50+",
                    "bold": true
                },
                {
                    "text": " videos"
                }
            ]
        },
        "videoCountShortText": {
            "runs": [
                {
                    "text": "50+"
                }
            ]
        },
        "likeButton": {
            "likeButtonRenderer": {
                "target": {
                    "playlistId": "RDEPo5wWmKEaI"
                },
                "likeStatus": "INDIFFERENT",
                "trackingParams": "CDsQpUEiEwjBhYugjf-SAxXqn0sFHdrHJ1Q=",
                "likesAllowed": true
            }
        },
        "shareUrl": "https://www.youtube.com/watch?v=EPo5wWmKEaI&playnext=1&list=RDEPo5wWmKEaI",
        "menu": {
            "menuRenderer": {
                "items": [
                    {
                        "menuServiceItemRenderer": {
                            "text": {
                                "runs": [
                                    {
                                        "text": "Save to library"
                                    }
                                ]
                            },
                            "icon": {
                                "iconType": "LIBRARY_ADD"
                            },
                            "serviceEndpoint": {
                                "clickTrackingParams": "CDkQozAYBCITCMGFi6CN_5IDFeqfSwUd2scnVMoBBLuNR4A=",
                                "commandMetadata": {
                                    "webCommandMetadata": {
                                        "sendPost": true,
                                        "apiUrl": "/youtubei/v1/like/like"
                                    }
                                },
                                "likeEndpoint": {
                                    "status": "LIKE",
                                    "target": {
                                        "playlistId": "RDEPo5wWmKEaI"
                                    }
                                }
                            },
                            "trackingParams": "CDkQozAYBCITCMGFi6CN_5IDFeqfSwUd2scnVA=="
                        }
                    },
                    {
                        "menuNavigationItemRenderer": {
                            "text": {
                                "runs": [
                                    {
                                        "text": "Share"
                                    }
                                ]
                            },
                            "icon": {
                                "iconType": "SHARE"
                            },
                            "navigationEndpoint": {
                                "clickTrackingParams": "CDkQozAYBCITCMGFi6CN_5IDFeqfSwUd2scnVMoBBLuNR4A=",
                                "commandMetadata": {
                                    "webCommandMetadata": {
                                        "ignoreNavigation": true
                                    }
                                },
                                "shareEntityEndpoint": {
                                    "serializedShareEntity": "Eg1SREVQbzV3V21LRWFJ",
                                    "sharePanelType": "SHARE_PANEL_TYPE_UNIFIED_SHARE_PANEL"
                                }
                            },
                            "trackingParams": "CDkQozAYBCITCMGFi6CN_5IDFeqfSwUd2scnVA=="
                        }
                    },
                    {
                        "menuServiceItemRenderer": {
                            "text": {
                                "runs": [
                                    {
                                        "text": "Not interested"
                                    }
                                ]
                            },
                            "icon": {
                                "iconType": "NOT_INTERESTED"
                            },
                            "serviceEndpoint": {
                                "clickTrackingParams": "CDkQozAYBCITCMGFi6CN_5IDFeqfSwUd2scnVMoBBLuNR4A=",
                                "commandMetadata": {
                                    "webCommandMetadata": {
                                        "sendPost": true,
                                        "apiUrl": "/youtubei/v1/feedback"
                                    }
                                },
                                "feedbackEndpoint": {
                                    "feedbackToken": "AB9zfpIsq0Fu5FLOoN50IqrMpIgKIGVIl3qrTP2XHKj1QWyL4KcegIZ2ss5AnrPeQ4Bp8ybYwIAUnfcYrkJTIMlacemIf8na7nGWBlJJuAaN382pgB6pXG7W307rOLHywZtAk2qb2ZLvMJ80ZihuidJQMwd9MyyVig",
                                    "uiActions": {
                                        "hideEnclosingContainer": true
                                    },
                                    "actions": [
                                        {
                                            "clickTrackingParams": "CDkQozAYBCITCMGFi6CN_5IDFeqfSwUd2scnVMoBBLuNR4A=",
                                            "replaceEnclosingAction": {
                                                "item": {
                                                    "notificationTextRenderer": {
                                                        "successResponseText": {
                                                            "runs": [
                                                                {
                                                                    "text": "Playlist removed"
                                                                }
                                                            ]
                                                        },
                                                        "trackingParams": "CDoQyscDIhMIwYWLoI3_kgMV6p9LBR3axydU"
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            },
                            "trackingParams": "CDkQozAYBCITCMGFi6CN_5IDFeqfSwUd2scnVA=="
                        }
                    }
                ],
                "trackingParams": "CDkQozAYBCITCMGFi6CN_5IDFeqfSwUd2scnVA==",
                "accessibility": {
                    "accessibilityData": {
                        "label": "Action menu"
                    }
                }
            }
        },
        "thumbnailOverlays": [
            {
                "thumbnailOverlayBottomPanelRenderer": {
                    "text": {
                        "runs": [
                            {
                                "text": "Mix"
                            }
                        ]
                    },
                    "icon": {
                        "iconType": "MIX"
                    }
                }
            }
        ]
    }
}


ANOTHER MIX CARD JSON

"responseContext": {
           "serviceTrackingParams": [
               {
                   "service": "CSI",
                   "params": [
                       {
                           "key": "yt_fn",
                           "value": "what_to_watch"
                       },
                       {
                           "key": "c",
                           "value": "MWEB"
                       },
                       {
                           "key": "cver",
                           "value": "2.20260226.11.00"
                       },
                       {
                           "key": "yt_li",
                           "value": "1"
                       },
                       {
                           "key": "GetHome_rid",
                           "value": "0xc40105dbf44aa5a0"
                       }
                   ]
               },
               {
                   "service": "GFEEDBACK",
                   "params": [
                       {
                           "key": "browse_id",
                           "value": "FEwhat_to_watch"
                       },
                       {
                           "key": "browse_id_prefix",
                           "value": ""
                       },
                       {
                           "key": "logged_in",
                           "value": "1"
                       }
                   ]
               },
               {
                   "service": "ECATCHER",
                   "params": [
                       {
                           "key": "client.version",
                           "value": "2.20260226"
                       },
                       {
                           "key": "client.name",
                           "value": "MWEB"
                       }
                   ]
               }
           ],
           "maxAgeSeconds": 30,
           "webResponseContextExtensionData": {
               "webResponseContextPreloadData": {
                   "preloadMessageNames": [
                       "feedTabbedHeaderRenderer",
                       "singleColumnBrowseResultsRenderer",
                       "tabRenderer",
                       "richGridRenderer",
                       "richItemRenderer",
                       "radioRenderer",
                       "thumbnailOverlayBottomPanelRenderer",
                       "menuRenderer",
                       "menuServiceItemRenderer",
                       "menuNavigationItemRenderer",
                       "notificationTextRenderer",
                       "richSectionRenderer",
                       "gridShelfViewModel",
                       "shortsLockupViewModel",
                       "reelPlayerOverlayRenderer",
                       "reelWatchAccessibilityRenderer",
                       "sheetViewModel",
                       "listViewModel",
                       "listItemViewModel",
                       "notificationMultiActionRenderer",
                       "buttonRenderer",
                       "sectionHeaderViewModel",
                       "flexibleActionsViewModel",
                       "buttonViewModel",
                       "backstagePostThreadRenderer",
                       "backstagePostRenderer",
                       "backstageImageRenderer",
                       "commentActionButtonsRenderer",
                       "toggleButtonRenderer",
                       "engagementPanelSectionListRenderer",
                       "engagementPanelTitleHeaderRenderer",
                       "contentLoadingRenderer",
                       "videoWithContextRenderer",
                       "channelThumbnailWithLinkRenderer",
                       "thumbnailOverlayTimeStatusRenderer",
                       "movingThumbnailRenderer",
                       "continuationItemRenderer",
                       "feedFilterChipBarRenderer",
                       "chipCloudChipRenderer",
                       "moreDrawerViewModel",
                       "logoViewModel",
                       "navigationItemViewModel",
                       "dividerViewModel",
                       "privacyTosViewModel",
                       "chipDividerRenderer",
                       "mobileTopbarRenderer",
                       "topbarLogoRenderer",
                       "voiceSearchDialogRenderer"
                   ]
               },
               "hasDecorated": true
           }
       },
       "contents": {
           "singleColumnBrowseResultsRenderer": {
               "tabs": [
                   {
                       "tabRenderer": {
                           "endpoint": {
                               "clickTrackingParams": "CAYQ8JMBGAIiEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                               "commandMetadata": {
                                   "webCommandMetadata": {
                                       "url": "/",
                                       "webPageType": "WEB_PAGE_TYPE_BROWSE",
                                       "rootVe": 3854,
                                       "apiUrl": "/youtubei/v1/browse"
                                   }
                               },
                               "browseEndpoint": {
                                   "browseId": "FEwhat_to_watch"
                               }
                           },
                           "title": "Home",
                           "selected": true,
                           "content": {
                               "richGridRenderer": {
                                   "contents": [
                                       {
                                           "richItemRenderer": {
                                               "content": {
                                                   "radioRenderer": {
                                                       "playlistId": "RDrQI5REp1gio",
                                                       "title": {
                                                           "runs": [
                                                               {
                                                                   "text": "Mix – BTS (방탄소년단) 'Filter' by Jimin FMV"
                                                               }
                                                           ]
                                                       },
                                                       "thumbnail": {
                                                           "thumbnails": [
                                                               {
                                                                   "url":
   "https://i.ytimg.com/vi/rQI5REp1gio/default.jpg?sqp=-oaymwEkCHgQWvKriqkDGvABAfgB_gmAAtAFigIMCAAQARhlIFgoWzAP&rs=AOn4CLC6CNrkqgoxPP4toeNFfhuuoC0RgQ",
                                                                   "width": 120,
                                                                   "height": 90
                                                               },
                                                               {
                                                                   "url":
   "https://i.ytimg.com/vi/rQI5REp1gio/mqdefault.jpg?sqp=-oaymwEmCMACELQB8quKqQMa8AEB-AH-CYAC0AWKAgwIABABGGUgWChbMA8=&rs=AOn4CLCEcqSv0TFsHZaeONN1n_nQDhGh-A",
                                                                   "width": 320,
                                                                   "height": 180
                                                               },
                                                               {
                                                                   "url":
   "https://i.ytimg.com/vi/rQI5REp1gio/hqdefault.jpg?sqp=-oaymwEmCOADEOgC8quKqQMa8AEB-AH-CYAC0AWKAgwIABABGGUgWChbMA8=&rs=AOn4CLDLgTkiHPjlU3nhSFqCa6tjQMi68Q",
                                                                   "width": 480,
                                                                   "height": 360
                                                               }
                                                           ],
                                                           "sampledThumbnailColor": {
                                                               "red": 89,
                                                               "green": 77,
                                                               "blue": 79
                                                           },
                                                           "darkColorPalette": {
                                                               "section2Color": 3353645,
                                                               "iconInactiveColor": 9206397,
                                                               "iconDisabledColor": 5326665
                                                           },
                                                           "vibrantColorPalette": {
                                                               "iconInactiveColor": 10061193
                                                           }
                                                       },
                                                       "videoCountText": {
                                                           "runs": [
                                                               {
                                                                   "text": "50+ videos"
                                                               }
                                                           ]
                                                       },
                                                       "navigationEndpoint": {
                                                           "clickTrackingParams": "CHYQuzcYACITCPTdsZ6g_5IDFcODVgEdpWIi_zIKZy1oaWdoLXJlY1oPRkV3aGF0X3RvX3dhdGNomgEGEI4eGJ4BygEEu41HgA==",
                                                           "commandMetadata": {
                                                               "webCommandMetadata": {
                                                                   "url": "/watch?v=rQI5REp1gio&list=RDrQI5REp1gio&start_radio=1&pp=0gcJCbUEOCosWNin",
                                                                   "webPageType": "WEB_PAGE_TYPE_WATCH",
                                                                   "rootVe": 3832
                                                               }
                                                           },
                                                           "watchEndpoint": {
                                                               "videoId": "rQI5REp1gio",
                                                               "playlistId": "RDrQI5REp1gio",
                                                               "params": "OALAAQE%3D",
                                                               "continuePlayback": true,
                                                               "playerParams": "0gcJCbUEOCosWNin",
                                                               "loggingContext": {
                                                                   "vssLoggingContext": {
                                                                       "serializedContextData": "Gg1SRHJRSTVSRXAxZ2lv"
                                                                   }
                                                               }
                                                           }
                                                       },
                                                       "trackingParams": "CHYQuzcYACITCPTdsZ6g_5IDFcODVgEdpWIi_w==",
                                                       "thumbnailText": {
                                                           "runs": [
                                                               {
                                                                   "text": "50+",
                                                                   "bold": true
                                                               },
                                                               {
                                                                   "text": " videos"
                                                               }
                                                           ]
                                                       },
                                                       "longBylineText": {
                                                           "runs": [
                                                               {
                                                                   "text": "BTS, Jimin, DJ Snake and more"
                                                               }
                                                           ]
                                                       },
                                                       "menu": {
                                                           "menuRenderer": {
                                                               "items": [
                                                                   {
                                                                       "menuServiceItemRenderer": {
                                                                           "text": {
                                                                               "runs": [
                                                                                   {
                                                                                       "text": "Save to library"
                                                                                   }
                                                                               ]
                                                                           },
                                                                           "icon": {
                                                                               "iconType": "LIBRARY_ADD"
                                                                           },
                                                                           "serviceEndpoint": {
                                                                               "clickTrackingParams": "CHYQuzcYACITCPTdsZ6g_5IDFcODVgEdpWIi_8oBBLuNR4A=",
                                                                               "commandMetadata": {
                                                                                   "webCommandMetadata": {
                                                                                       "sendPost": true,
                                                                                       "apiUrl": "/youtubei/v1/like/like"
                                                                                   }
                                                                               },
                                                                               "likeEndpoint": {
                                                                                   "status": "LIKE",
                                                                                   "target": {
                                                                                       "playlistId": "RDrQI5REp1gio"
                                                                                   }
                                                                               }
                                                                           },
                                                                           "trackingParams": "CHYQuzcYACITCPTdsZ6g_5IDFcODVgEdpWIi_w=="
                                                                       }
                                                                   },
                                                                   {
                                                                       "menuNavigationItemRenderer": {
                                                                           "text": {
                                                                               "runs": [
                                                                                   {
                                                                                       "text": "Share"
                                                                                   }
                                                                               ]
                                                                           },
                                                                           "icon": {
                                                                               "iconType": "SHARE"
                                                                           },
                                                                           "navigationEndpoint": {
                                                                               "clickTrackingParams": "CHYQuzcYACITCPTdsZ6g_5IDFcODVgEdpWIi_8oBBLuNR4A=",
                                                                               "commandMetadata": {
                                                                                   "webCommandMetadata": {
                                                                                       "ignoreNavigation": true
                                                                                   }
                                                                               },
                                                                               "shareEntityEndpoint": {
                                                                                   "serializedShareEntity": "Eg1SRHJRSTVSRXAxZ2lv",
                                                                                   "sharePanelType": "SHARE_PANEL_TYPE_UNIFIED_SHARE_PANEL"
                                                                               }
                                                                           },
                                                                           "trackingParams": "CHYQuzcYACITCPTdsZ6g_5IDFcODVgEdpWIi_w=="
                                                                       }
                                                                   },
                                                                   {
                                                                       "menuServiceItemRenderer": {
                                                                           "text": {
                                                                               "runs": [
                                                                                   {
                                                                                       "text": "Not interested"
                                                                                   }
                                                                               ]
                                                                           },
                                                                           "icon": {
                                                                               "iconType": "NOT_INTERESTED"
                                                                           },
                                                                           "serviceEndpoint": {
                                                                               "clickTrackingParams": "CHYQuzcYACITCPTdsZ6g_5IDFcODVgEdpWIi_8oBBLuNR4A=",
                                                                               "commandMetadata": {
                                                                                   "webCommandMetadata": {
                                                                                       "sendPost": true,
                                                                                       "apiUrl": "/youtubei/v1/feedback"
                                                                                   }
                                                                               },
                                                                               "feedbackEndpoint": {
                                                                                   "feedbackToken":
   "AB9zfpLRdTBME5e7XJGteg_9fZsDYXgPRGmHLqU7dk0UK19pg_EJTzB5poNNK7hF2HEZ12JLeaXBTk5y0upvdsmNdqMeUlNI3_tOsOpg3G6puduYrIElJvxwlf4B-0k4mI8msh1jcPAU",
                                                                                   "uiActions": {
                                                                                       "hideEnclosingContainer": true
                                                                                   },
                                                                                   "actions": [
                                                                                       {
                                                                                           "clickTrackingParams": "CHYQuzcYACITCPTdsZ6g_5IDFcODVgEdpWIi_8oBBLuNR4A=",
                                                                                           "replaceEnclosingAction": {
                                                                                               "item": {
                                                                                                   "notificationTextRenderer": {
                                                                                                       "successResponseText": {
                                                                                                           "runs": [
                                                                                                               {
                                                                                                                   "text": "OK, we'll tune your recommendations"
                                                                                                               }
                                                                                                           ]
                                                                                                       },
                                                                                                       "trackingParams": "CHcQyscDIhMI9N2xnqD_kgMVw4NWAR2lYiL_"
                                                                                                   }
                                                                                               }
                                                                                           }
                                                                                       }
                                                                                   ]
                                                                               }
                                                                           },
                                                                           "trackingParams": "CHYQuzcYACITCPTdsZ6g_5IDFcODVgEdpWIi_w=="
                                                                       }
                                                                   }
                                                               ],
                                                               "trackingParams": "CHYQuzcYACITCPTdsZ6g_5IDFcODVgEdpWIi_w==",
                                                               "accessibility": {
                                                                   "accessibilityData": {
                                                                       "label": "Action menu"
                                                                   }
                                                               }
                                                           }
                                                       },
                                                       "thumbnailOverlays": [
                                                           {
                                                               "thumbnailOverlayBottomPanelRenderer": {
                                                                   "text": {
                                                                       "runs": [
                                                                           {
                                                                               "text": "Mix"
                                                                           }
                                                                       ]
                                                                   },
                                                                   "icon": {
                                                                       "iconType": "MIX"
                                                                   }
                                                               }
                                                           }
                                                       ],
                                                       "videoCountShortText": {
                                                           "runs": [
                                                               {
                                                                   "text": "50+"
                                                               }
                                                           ]
                                                       },
                                                       "inlinePlaybackEndpoint": {
                                                           "clickTrackingParams": "CHYQuzcYACITCPTdsZ6g_5IDFcODVgEdpWIi_zIKZy1oaWdoLXJlY1oPRkV3aGF0X3RvX3dhdGNomgEGEI4eGJ4BygEEu41HgA==",
                                                           "commandMetadata": {
                                                               "webCommandMetadata": {
                                                                   "url": "/watch?v=rQI5REp1gio&list=RDrQI5REp1gio&start_radio=1&pp=YAHIAQHwBAD4BACiBhUBO2AyIvnb_19fISVBaTqvT2F8evM%3D",
                                                                   "webPageType": "WEB_PAGE_TYPE_WATCH",
                                                                   "rootVe": 3832
                                                               }
                                                           },
                                                           "watchEndpoint": {
                                                               "videoId": "rQI5REp1gio",
                                                               "playlistId": "RDrQI5REp1gio",
                                                               "params": "OALAAQE%3D",
                                                               "continuePlayback": true,
                                                               "playerParams": "YAHIAQHwBAD4BACiBhUBO2AyIvnb_19fISVBaTqvT2F8evM%3D",
                                                               "loggingContext": {
                                                                   "vssLoggingContext": {
                                                                       "serializedContextData": "Gg1SRHJRSTVSRXAxZ2lv"
                                                                   }
                                                               }
                                                           }
                                                       }
                                                   }
                                               },
                                               "trackingParams": "CHUQmY0FGAAiEwj03bGeoP-SAxXDg1YBHaViIv8="
                                           }
                                       }


---

# Absolute JSON Trace: User Created Playlist Cards
*File: `YTM.json`, `playlist.json`*

### `compactPlaylistRenderer`
**Base Path (Sidebar/XHR)**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].compactPlaylistRenderer`
**Base Path (Watch/Search XHR)**: `onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems[i].itemSectionRenderer.contents[0].compactPlaylistRenderer`

- **Playlist ID**: `...playlistId` -> Value: `"PLZHQObOWTQDN52m7Y21ePrTbvXkPaWVSg"`
- **Playlist Title**: `...title.runs[0].text` -> Value: `"Explainers"`
- **Creator Channel ID (Owner)**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId` -> Value: `"UCYO_jab_esuFRV4b17AJtAw"`
- **Creator Channel Name**: `...shortBylineText.runs[0].text` -> Value: `"3Blue1Brown"`
- **Creator Channel Handle (Alternate ID)**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl` -> Value: `"/@3blue1brown"`
- **Creator URL**: `...shortBylineText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url` -> Value: `"/@3blue1brown"`
- **Creator Logo (Search Context)**: `...channelThumbnail.channelThumbnailWithLinkRenderer.thumbnail.thumbnails[0].url`
- **Creator ID Fallback (Search Context)**: `...channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId`
- **Video Count Text**: `...videoCountText.runs[0].text` + `...videoCountText.runs[1].text` -> Value: `"27 videos"`
- **Video Count Short**: `...videoCountShortText.runs[0].text` -> Value: `"27"`
- **Thumbnail URL**: `...thumbnail.thumbnails[0].url` -> Value: `"https://i.ytimg.com/vi/aircAruvnKk/default.jpg"`
- **Navigation URL (Watch Endpoint)**: `...navigationEndpoint.commandMetadata.webCommandMetadata.url` -> Value: `"/playlist?list=PLZHQObOWTQDN52m7Y21ePrTbvXkPaWVSg"`
- **Inline Playback Seed Video ID (Preview)**: `...inlinePlaybackEndpoint.watchEndpoint.videoId`
- **Sidebar Thumbnails**: `...sidebarThumbnails[0].thumbnails[0].url` (Provides preview images of videos inside the playlist)
- **Thumbnail Overlay Text (Side Panel)**: `...thumbnailText.runs[0].text` + `...thumbnailText.runs[1].text` -> Value: `"27 videos"`
- **Share URL**: `...shareUrl` -> Value: `"https://www.youtube.com/playlist?list=PLZHQObOWTQDN52m7Y21ePrTbvXkPaWVSg"`
- **Owner Badge (Verified Indicator)**: `...ownerBadges[0].metadataBadgeRenderer.tooltip` -> Value: `"Verified"`
- **Side Panel Badge Text**: `...thumbnailOverlays[0].thumbnailOverlaySidePanelRenderer.text.runs[0].text` -> Value: `"27"`
- **Bottom Panel Badge Text**: `...thumbnailOverlays[1].thumbnailOverlayBottomPanelRenderer.text.runs[0].text` -> Value: `"27 videos"`
- **Secondary Playlist Endpoint (Long Byline)**: `...longBylineText.runs[2].navigationEndpoint.browseEndpoint.browseId` -> Value: `"UCYO_jab_esuFRV4b17AJtAw"`

**DOM Identifiers (YTM Compact Playlist)**:
- **Host Element Tag**: `ytm-compact-playlist-renderer`
- **Link Target**: `a.media-item-thumbnail-container`
- **Thumbnail Container**: `ytm-thumbnail-cover`
- **Title Target**: `h3.media-item-title`
- **Author/Creator Name**: `div.media-item-subtitle` (Text inside usually contains "Playlist • Channel Name")
- **Collections Stack**: `yt-collections-stack` (Indicates it's a playlist/mix)

**Action Menu / Feedback**:
- **Menu Items Path**: `...menu.menuRenderer.items[]`
- **"Not interested" Feedback Token**: *Found in `menuServiceItemRenderer` where `iconType` is `"NOT_INTERESTED"`* -> `...serviceEndpoint.feedbackEndpoint.feedbackToken`



Playlist JSON -

{
    "compactPlaylistRenderer": {
        "playlistId": "PLZHQObOWTQDN52m7Y21ePrTbvXkPaWVSg",
        "thumbnail": {
            "thumbnails": [
                {
                    "url": "https://i.ytimg.com/vi/aircAruvnKk/default.jpg",
                    "width": 120,
                    "height": 90
                },
                {
                    "url": "https://i.ytimg.com/vi/aircAruvnKk/mqdefault.jpg",
                    "width": 320,
                    "height": 180
                },
                {
                    "url": "https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg",
                    "width": 480,
                    "height": 360
                }
            ],
            "sampledThumbnailColor": {
                "red": 15,
                "green": 90,
                "blue": 101
            },
            "darkColorPalette": {
                "section2Color": 336166,
                "iconInactiveColor": 7374988,
                "iconDisabledColor": 4413017
            },
            "vibrantColorPalette": {
                "iconInactiveColor": 7049881
            }
        },
        "title": {
            "runs": [
                {
                    "text": "Explainers"
                }
            ]
        },
        "shortBylineText": {
            "runs": [
                {
                    "text": "3Blue1Brown",
                    "navigationEndpoint": {
                        "clickTrackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxDIHcmVsbGlzdMoBBLuNR4A=",
                        "commandMetadata": {
                            "webCommandMetadata": {
                                "url": "/@3blue1brown",
                                "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                "rootVe": 3611,
                                "apiUrl": "/youtubei/v1/browse"
                            }
                        },
                        "browseEndpoint": {
                            "browseId": "UCYO_jab_esuFRV4b17AJtAw",
                            "canonicalBaseUrl": "/@3blue1brown"
                        }
                    }
                },
                {
                    "text": " · "
                },
                {
                    "text": "Playlist",
                    "navigationEndpoint": {
                        "clickTrackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxDIHcmVsbGlzdMoBBLuNR4A=",
                        "commandMetadata": {
                            "webCommandMetadata": {
                                "url": "/@3blue1brown",
                                "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                "rootVe": 3611,
                                "apiUrl": "/youtubei/v1/browse"
                            }
                        },
                        "browseEndpoint": {
                            "browseId": "UCYO_jab_esuFRV4b17AJtAw",
                            "canonicalBaseUrl": "/@3blue1brown"
                        }
                    }
                }
            ]
        },
        "videoCountText": {
            "runs": [
                {
                    "text": "27"
                },
                {
                    "text": " videos"
                }
            ]
        },
        "navigationEndpoint": {
            "clickTrackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxDIHcmVsbGlzdMoBBLuNR4A=",
            "commandMetadata": {
                "webCommandMetadata": {
                    "url": "/playlist?list=PLZHQObOWTQDN52m7Y21ePrTbvXkPaWVSg",
                    "webPageType": "WEB_PAGE_TYPE_PLAYLIST",
                    "rootVe": 5754,
                    "apiUrl": "/youtubei/v1/browse"
                }
            },
            "browseEndpoint": {
                "browseId": "VLPLZHQObOWTQDN52m7Y21ePrTbvXkPaWVSg"
            }
        },
        "videoCountShortText": {
            "runs": [
                {
                    "text": "27"
                }
            ]
        },
        "trackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxA==",
        "sidebarThumbnails": [
            {
                "thumbnails": [
                    {
                        "url": "https://i.ytimg.com/vi/WUvTyaaNkzM/default.jpg",
                        "width": 43,
                        "height": 20
                    }
                ]
            },
            {
                "thumbnails": [
                    {
                        "url": "https://i.ytimg.com/vi/EmKQsSDlaa4/default.jpg",
                        "width": 43,
                        "height": 20
                    }
                ]
            },
            {
                "thumbnails": [
                    {
                        "url": "https://i.ytimg.com/vi/r6sGWTCMz2k/default.jpg",
                        "width": 43,
                        "height": 20
                    }
                ]
            },
            {
                "thumbnails": [
                    {
                        "url": "https://i.ytimg.com/vi/RQWpF2Gb-gU/default.jpg",
                        "width": 43,
                        "height": 20
                    }
                ]
            }
        ],
        "thumbnailText": {
            "runs": [
                {
                    "text": "27",
                    "bold": true
                },
                {
                    "text": " videos"
                }
            ]
        },
        "ownerBadges": [
            {
                "metadataBadgeRenderer": {
                    "icon": {
                        "iconType": "CHECK_CIRCLE_THICK"
                    },
                    "style": "BADGE_STYLE_TYPE_VERIFIED",
                    "tooltip": "Verified",
                    "trackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxA=="
                }
            }
        ],
        "menu": {
            "menuRenderer": {
                "items": [
                    {
                        "menuServiceItemRenderer": {
                            "text": {
                                "runs": [
                                    {
                                        "text": "Not interested"
                                    }
                                ]
                            },
                            "icon": {
                                "iconType": "NOT_INTERESTED"
                            },
                            "serviceEndpoint": {
                                "clickTrackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxMoBBLuNR4A=",
                                "commandMetadata": {
                                    "webCommandMetadata": {
                                        "sendPost": true,
                                        "apiUrl": "/youtubei/v1/feedback"
                                    }
                                },
                                "feedbackEndpoint": {
                                    "feedbackToken": "AB9zfpKgNW66uDobhCkkNskSLBYU6piWmuJfbwfO-wCQ0g4CWi8Cq_J1V17oDYg6JDX5yqEjK-1YJw3djzdtKP9wV1Lk4i5gtpdBxIkxYpJE-K6N1Scgkj6GeEtl2sOmk8dkuKINld4QuTwzd0z83qBdFb1Ec11-jvUetzFF-bI3EQggoQerKxQ",
                                    "uiActions": {
                                        "hideEnclosingContainer": true
                                    },
                                    "actions": [
                                        {
                                            "clickTrackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxMoBBLuNR4A=",
                                            "replaceEnclosingAction": {
                                                "item": {
                                                    "notificationTextRenderer": {
                                                        "successResponseText": {
                                                            "runs": [
                                                                {
                                                                    "text": "Playlist removed"
                                                                }
                                                            ]
                                                        },
                                                        "trackingParams": "CB8QyscDIhMIh6iMypz_kgMVW4qsAh1s1wzE"
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            },
                            "trackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxA=="
                        }
                    },
                    {
                        "menuNavigationItemRenderer": {
                            "text": {
                                "runs": [
                                    {
                                        "text": "Share"
                                    }
                                ]
                            },
                            "icon": {
                                "iconType": "SHARE"
                            },
                            "navigationEndpoint": {
                                "clickTrackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxMoBBLuNR4A=",
                                "commandMetadata": {
                                    "webCommandMetadata": {
                                        "ignoreNavigation": true
                                    }
                                },
                                "shareEntityEndpoint": {
                                    "serializedShareEntity": "EiJQTFpIUU9iT1dUUURONTJtN1kyMWVQclRidlhrUGFXVlNn",
                                    "sharePanelType": "SHARE_PANEL_TYPE_UNIFIED_SHARE_PANEL"
                                }
                            },
                            "trackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxA=="
                        }
                    }
                ],
                "trackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxA==",
                "accessibility": {
                    "accessibilityData": {
                        "label": "Action menu"
                    }
                }
            }
        },
        "shareUrl": "https://www.youtube.com/playlist?list=PLZHQObOWTQDN52m7Y21ePrTbvXkPaWVSg",
        "thumbnailRenderer": {
            "playlistVideoThumbnailRenderer": {
                "thumbnail": {
                    "thumbnails": [
                        {
                            "url": "https://i.ytimg.com/vi/aircAruvnKk/default.jpg",
                            "width": 120,
                            "height": 90
                        },
                        {
                            "url": "https://i.ytimg.com/vi/aircAruvnKk/mqdefault.jpg",
                            "width": 320,
                            "height": 180
                        },
                        {
                            "url": "https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg",
                            "width": 480,
                            "height": 360
                        }
                    ],
                    "sampledThumbnailColor": {
                        "red": 15,
                        "green": 90,
                        "blue": 101
                    },
                    "darkColorPalette": {
                        "section2Color": 336166,
                        "iconInactiveColor": 7374988,
                        "iconDisabledColor": 4413017
                    },
                    "vibrantColorPalette": {
                        "iconInactiveColor": 7049881
                    }
                },
                "trackingParams": "CB4Qy-wJIhMIh6iMypz_kgMVW4qsAh1s1wzE"
            }
        },
        "longBylineText": {
            "runs": [
                {
                    "text": "3Blue1Brown",
                    "navigationEndpoint": {
                        "clickTrackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxDIHcmVsbGlzdMoBBLuNR4A=",
                        "commandMetadata": {
                            "webCommandMetadata": {
                                "url": "/@3blue1brown",
                                "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                "rootVe": 3611,
                                "apiUrl": "/youtubei/v1/browse"
                            }
                        },
                        "browseEndpoint": {
                            "browseId": "UCYO_jab_esuFRV4b17AJtAw",
                            "canonicalBaseUrl": "/@3blue1brown"
                        }
                    }
                },
                {
                    "text": " · "
                },
                {
                    "text": "Playlist",
                    "navigationEndpoint": {
                        "clickTrackingParams": "CB0QojAYCCITCIeojMqc_5IDFVuKrAIdbNcMxDIHcmVsbGlzdMoBBLuNR4A=",
                        "commandMetadata": {
                            "webCommandMetadata": {
                                "url": "/@3blue1brown",
                                "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                "rootVe": 3611,
                                "apiUrl": "/youtubei/v1/browse"
                            }
                        },
                        "browseEndpoint": {
                            "browseId": "UCYO_jab_esuFRV4b17AJtAw",
                            "canonicalBaseUrl": "/@3blue1brown"
                        }
                    }
                }
            ]
        },
        "thumbnailOverlays": [
            {
                "thumbnailOverlaySidePanelRenderer": {
                    "text": {
                        "runs": [
                            {
                                "text": "27"
                            }
                        ]
                    },
                    "icon": {
                        "iconType": "PLAYLISTS"
                    }
                }
            },
            {
                "thumbnailOverlayBottomPanelRenderer": {
                    "text": {
                        "runs": [
                            {
                                "text": "27 videos"
                            }
                        ]
                    },
                    "icon": {
                        "iconType": "PLAYLISTS"
                    }
                }
            }
        ]
    }
}


Playlist JSON from search page -

{
    "compactPlaylistRenderer": {
        "playlistId": "PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV",
        "thumbnail": {
            "thumbnails": [
                {
                    "url": "https://i.ytimg.com/vi/F3N5EkMX_ks/default.jpg",
                    "width": 120,
                    "height": 90
                },
                {
                    "url": "https://i.ytimg.com/vi/F3N5EkMX_ks/mqdefault.jpg",
                    "width": 320,
                    "height": 180
                },
                {
                    "url": "https://i.ytimg.com/vi/F3N5EkMX_ks/hqdefault.jpg",
                    "width": 480,
                    "height": 360
                },
                {
                    "url": "https://i.ytimg.com/vi/F3N5EkMX_ks/hq720.jpg?sqp=-oaymwEXCK4FEIIDSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLCI82gh0dI33aqK84aKJDQu8rk2-g",
                    "width": 686,
                    "height": 386
                }
            ],
            "sampledThumbnailColor": {
                "red": 101,
                "green": 64,
                "blue": 47
            },
            "darkColorPalette": {
                "section2Color": 3350551,
                "iconInactiveColor": 9666422,
                "iconDisabledColor": 6312009
            },
            "vibrantColorPalette": {
                "iconInactiveColor": 10058091
            }
        },
        "title": {
            "runs": [
                {
                    "text": "MIT 8.01SC Classical Mechanics, Fall 2016"
                }
            ]
        },
        "shortBylineText": {
            "runs": [
                {
                    "text": "MIT OpenCourseWare",
                    "navigationEndpoint": {
                        "clickTrackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76DIGc2VhcmNoygEEu41HgA==",
                        "commandMetadata": {
                            "webCommandMetadata": {
                                "url": "/@mitocw",
                                "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                "rootVe": 3611,
                                "apiUrl": "/youtubei/v1/browse"
                            }
                        },
                        "browseEndpoint": {
                            "browseId": "UCEBb1b_L6zDS3xTUrIALZOw",
                            "canonicalBaseUrl": "/@mitocw"
                        }
                    }
                },
                {
                    "text": " · "
                },
                {
                    "text": "Playlist",
                    "navigationEndpoint": {
                        "clickTrackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76DIGc2VhcmNoygEEu41HgA==",
                        "commandMetadata": {
                            "webCommandMetadata": {
                                "url": "/@mitocw",
                                "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                "rootVe": 3611,
                                "apiUrl": "/youtubei/v1/browse"
                            }
                        },
                        "browseEndpoint": {
                            "browseId": "UCEBb1b_L6zDS3xTUrIALZOw",
                            "canonicalBaseUrl": "/@mitocw"
                        }
                    }
                }
            ]
        },
        "videoCountText": {
            "runs": [
                {
                    "text": "215"
                },
                {
                    "text": " videos"
                }
            ]
        },
        "navigationEndpoint": {
            "clickTrackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76DIGc2VhcmNoygEEu41HgA==",
            "commandMetadata": {
                "webCommandMetadata": {
                    "url": "/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV",
                    "webPageType": "WEB_PAGE_TYPE_PLAYLIST",
                    "rootVe": 5754,
                    "apiUrl": "/youtubei/v1/browse"
                }
            },
            "browseEndpoint": {
                "browseId": "VLPLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV"
            }
        },
        "videoCountShortText": {
            "runs": [
                {
                    "text": "215"
                }
            ]
        },
        "trackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76A==",
        "sidebarThumbnails": [
            {
                "thumbnails": [
                    {
                        "url": "https://i.ytimg.com/vi/5ucfHd8FWKw/default.jpg?sqp=-oaymwEkCHgQWvKriqkDGvABAfgB_gmAAtAFigIMCAAQARhdIF0oXTAP&rs=AOn4CLB96q9FcdBtudS-aXbvYja4YQ-mKg",
                        "width": 43,
                        "height": 20
                    }
                ]
            },
            {
                "thumbnails": [
                    {
                        "url": "https://i.ytimg.com/vi/Jf2PgGInUEk/default.jpg?sqp=-oaymwEkCHgQWvKriqkDGvABAfgB_gmAAtAFigIMCAAQARhlIGUoZTAP&rs=AOn4CLAyjZ3QuRJ4aeCW67oSAD2xXzt52w",
                        "width": 43,
                        "height": 20
                    }
                ]
            }
        ],
        "thumbnailText": {
            "runs": [
                {
                    "text": "215",
                    "bold": true
                },
                {
                    "text": " videos"
                }
            ]
        },
        "menu": {
            "menuRenderer": {
                "items": [
                    {
                        "menuServiceItemRenderer": {
                            "text": {
                                "runs": [
                                    {
                                        "text": "Save to library"
                                    }
                                ]
                            },
                            "icon": {
                                "iconType": "LIBRARY_ADD"
                            },
                            "serviceEndpoint": {
                                "clickTrackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76MoBBLuNR4A=",
                                "commandMetadata": {
                                    "webCommandMetadata": {
                                        "sendPost": true,
                                        "apiUrl": "/youtubei/v1/like/like"
                                    }
                                },
                                "likeEndpoint": {
                                    "status": "LIKE",
                                    "target": {
                                        "playlistId": "PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV"
                                    }
                                }
                            },
                            "trackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76A=="
                        }
                    },
                    {
                        "menuNavigationItemRenderer": {
                            "text": {
                                "runs": [
                                    {
                                        "text": "Share"
                                    }
                                ]
                            },
                            "icon": {
                                "iconType": "SHARE"
                            },
                            "navigationEndpoint": {
                                "clickTrackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76MoBBLuNR4A=",
                                "commandMetadata": {
                                    "webCommandMetadata": {
                                        "ignoreNavigation": true
                                    }
                                },
                                "shareEntityEndpoint": {
                                    "serializedShareEntity": "EiJQTFVsNHUzY05HUDYxcURleDdYc2x3TkoteHh4RUZ6TU5W",
                                    "sharePanelType": "SHARE_PANEL_TYPE_UNIFIED_SHARE_PANEL"
                                }
                            },
                            "trackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76A=="
                        }
                    }
                ],
                "trackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76A==",
                "accessibility": {
                    "accessibilityData": {
                        "label": "Action menu"
                    }
                }
            }
        },
        "shareUrl": "https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV",
        "thumbnailRenderer": {
            "playlistVideoThumbnailRenderer": {
                "thumbnail": {
                    "thumbnails": [
                        {
                            "url": "https://i.ytimg.com/vi/F3N5EkMX_ks/default.jpg",
                            "width": 120,
                            "height": 90
                        },
                        {
                            "url": "https://i.ytimg.com/vi/F3N5EkMX_ks/mqdefault.jpg",
                            "width": 320,
                            "height": 180
                        },
                        {
                            "url": "https://i.ytimg.com/vi/F3N5EkMX_ks/hqdefault.jpg",
                            "width": 480,
                            "height": 360
                        },
                        {
                            "url": "https://i.ytimg.com/vi/F3N5EkMX_ks/hq720.jpg?sqp=-oaymwEXCK4FEIIDSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLCI82gh0dI33aqK84aKJDQu8rk2-g",
                            "width": 686,
                            "height": 386
                        }
                    ],
                    "sampledThumbnailColor": {
                        "red": 101,
                        "green": 64,
                        "blue": 47
                    },
                    "darkColorPalette": {
                        "section2Color": 3350551,
                        "iconInactiveColor": 9666422,
                        "iconDisabledColor": 6312009
                    },
                    "vibrantColorPalette": {
                        "iconInactiveColor": 10058091
                    }
                },
                "trackingParams": "CEIQy-wJIhMI8_rKl67_kgMVrS2DAx3Kgjvo"
            }
        },
        "longBylineText": {
            "runs": [
                {
                    "text": "MIT OpenCourseWare",
                    "navigationEndpoint": {
                        "clickTrackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76DIGc2VhcmNoygEEu41HgA==",
                        "commandMetadata": {
                            "webCommandMetadata": {
                                "url": "/@mitocw",
                                "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                "rootVe": 3611,
                                "apiUrl": "/youtubei/v1/browse"
                            }
                        },
                        "browseEndpoint": {
                            "browseId": "UCEBb1b_L6zDS3xTUrIALZOw",
                            "canonicalBaseUrl": "/@mitocw"
                        }
                    }
                },
                {
                    "text": " · "
                },
                {
                    "text": "Playlist",
                    "navigationEndpoint": {
                        "clickTrackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76DIGc2VhcmNoygEEu41HgA==",
                        "commandMetadata": {
                            "webCommandMetadata": {
                                "url": "/@mitocw",
                                "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                "rootVe": 3611,
                                "apiUrl": "/youtubei/v1/browse"
                            }
                        },
                        "browseEndpoint": {
                            "browseId": "UCEBb1b_L6zDS3xTUrIALZOw",
                            "canonicalBaseUrl": "/@mitocw"
                        }
                    }
                }
            ]
        },
        "thumbnailOverlays": [
            {
                "thumbnailOverlaySidePanelRenderer": {
                    "text": {
                        "runs": [
                            {
                                "text": "215"
                            }
                        ]
                    },
                    "icon": {
                        "iconType": "PLAYLISTS"
                    }
                }
            },
            {
                "thumbnailOverlayBottomPanelRenderer": {
                    "text": {
                        "runs": [
                            {
                                "text": "215 videos"
                            }
                        ]
                    },
                    "icon": {
                        "iconType": "PLAYLISTS"
                    }
                }
            }
        ],
        "channelThumbnail": {
            "channelThumbnailWithLinkRenderer": {
                "thumbnail": {
                    "thumbnails": [
                        {
                            "url": "https://yt3.googleusercontent.com/swNtJDBP8xHP_zwrbL4tCUQt02B-7Mr8XggFMBjANHn_Q5aUtPmxPs8f8Ag3wO2O-rJpsQQGpA=s88-c-k-c0x00ffffff-no-rj",
                            "width": 68,
                            "height": 68
                        }
                    ]
                },
                "navigationEndpoint": {
                    "clickTrackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76MoBBLuNR4A=",
                    "commandMetadata": {
                        "webCommandMetadata": {
                            "url": "/@mitocw",
                            "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                            "rootVe": 3611,
                            "apiUrl": "/youtubei/v1/browse"
                        }
                    },
                    "browseEndpoint": {
                        "browseId": "UCEBb1b_L6zDS3xTUrIALZOw",
                        "canonicalBaseUrl": "/@mitocw"
                    }
                },
                "accessibility": {
                    "accessibilityData": {
                        "label": "Go to channel MIT OpenCourseWare"
                    }
                }
            }
        },
        "inlinePlaybackEndpoint": {
            "clickTrackingParams": "CEEQojAYASITCPP6ypeu_5IDFa0tgwMdyoI76DIGc2VhcmNoygEEu41HgA==",
            "commandMetadata": {
                "webCommandMetadata": {
                    "url": "/watch?v=F3N5EkMX_ks&list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV&pp=YAHwBAD4BAA%3D",
                    "webPageType": "WEB_PAGE_TYPE_WATCH",
                    "rootVe": 3832
                }
            },
            "watchEndpoint": {
                "videoId": "F3N5EkMX_ks",
                "playlistId": "PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV",
                "playerParams": "YAHwBAD4BAA%3D",
                "loggingContext": {
                    "vssLoggingContext": {
                        "serializedContextData": "GiJQTFVsNHUzY05HUDYxcURleDdYc2x3TkoteHh4RUZ6TU5W"
                    }
                }
            }
        }
    }
}


### `playlistPanelVideoRenderer` / `playlistVideoRenderer` (Items inside a Playlist / Watch Page Playing Queue)
This represents a single video item listed inside a playlist, including the active playing queue (the playlist panel) on a Watch Page.

**Base Path (Sidebar/XHR)**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].playlistPanelVideoRenderer`
**Base Path (Watch Page Initial Data)**: `ytInitialData.contents.twoColumnWatchNextResults.playlist.playlist.contents[i].playlistPanelVideoRenderer`
**Base Path (Watch Page Dedicated Playlist Fetch)**: `contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents[i].playlistVideoRenderer`

**JSON Path Identifiers**:
- **Video ID**: `...videoId` -> Value: `"Uc8KFRqO3IM"` / `"nykOeWgQcHM"`
- **Video Title**: `...title.simpleText` / `...title.runs[0].text`
- **Channel ID**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId` (Sometimes found in `longBylineText`) -> Value: `"UCEBb1b_L6zDS3xTUrIALZOw"`
- **Channel Name**: `...shortBylineText.runs[0].text` -> Value: `"MIT OpenCourseWare"`
- **Channel Handle (Alternate ID)**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl` -> Value: `"/@mitocw"`
- **Length/Duration**: `...lengthText.runs[0].text` -> Value: `"43:06"`
- **Index in Playlist**: `...index.runs[0].text` (or `...indexText.simpleText`) -> Value: `"1"`
- **Play Endpoint / URL**: `...navigationEndpoint.commandMetadata.webCommandMetadata.url`
- **Video Info (Views & Date)**: `...videoInfo.runs[0].text` (Views) and `...videoInfo.runs[2].text` (Date)

**DOM Identifiers (Watch Page Playlist Panel)**:
- **Host Element Tag**: `<ytm-playlist-panel-video-renderer>`
- **Active Video Class Check**: Checks if `.ytmPlaylistPanelVideoRendererV2Selected` is present on the host.
- **Link Target**: `<a class="YtmCompactMediaItemImage" href="...">` or `<a class="YtmCompactMediaItemMetadataContent" href="...">`
- **Thumbnail Target**: `<ytm-compact-thumbnail>` -> `<img class="ytCoreImageHost">`
- **Title Target**: `<h4 class="YtmCompactMediaItemHeadline">`
- **Channel Name Target**: `.YtmCompactMediaItemByline` (Usually the first div inside `.subhead`)
- **Stats (Views/Date) Target**: `.YtmCompactMediaItemByline` (Usually the second div inside `.subhead`)

**DOM Identifiers (Desktop - `ytd-`)**:
- **Host Element Tag**: `ytd-playlist-panel-video-renderer`
- **Active Video Attribute**: `selected` (present on the host element)
- **Link Target**: `a#wc-endpoint`
- **Thumbnail Container**: `div#thumbnail-container`
- **Title Target**: `span#video-title`
- **Channel Name Target**: `span#byline`
- **Reorder Handle**: `div.playlist-drag-handle`
- **Play Icon Overlay**: `span#play-icon` (visible when playing)

{
    "responseContext": {
        "serviceTrackingParams": [
            {
                "service": "GFEEDBACK",
                "params": [
                    {
                        "key": "is_podcast_show_page",
                        "value": "0"
                    },
                    {
                        "key": "browse_id",
                        "value": "VLPLUl4u3cNGP63WbdFxL8giv4yhgdMGaZNA"
                    },
                    {
                        "key": "browse_id_prefix",
                        "value": ""
                    },
                    {
                        "key": "logged_in",
                        "value": "1"
                    }
                ]
            },
            {
                "service": "CSI",
                "params": [
                    {
                        "key": "c",
                        "value": "MWEB"
                    },
                    {
                        "key": "cver",
                        "value": "2.20260226.11.00"
                    },
                    {
                        "key": "yt_li",
                        "value": "1"
                    },
                    {
                        "key": "GetPlaylist_rid",
                        "value": "0x039b3334fb7885af"
                    }
                ]
            },
            {
                "service": "ECATCHER",
                "params": [
                    {
                        "key": "client.version",
                        "value": "2.20260226"
                    },
                    {
                        "key": "client.name",
                        "value": "MWEB"
                    }
                ]
            }
        ],
        "webResponseContextExtensionData": {
            "webResponseContextPreloadData": {
                "preloadMessageNames": [
                    "pageHeaderRenderer",
                    "pageHeaderViewModel",
                    "cinematicContainerViewModel",
                    "dynamicTextViewModel",
                    "contentPreviewImageViewModel",
                    "contentMetadataViewModel",
                    "avatarStackViewModel",
                    "avatarViewModel",
                    "flexibleActionsViewModel",
                    "buttonViewModel",
                    "toggleButtonViewModel",
                    "descriptionPreviewViewModel",
                    "singleColumnBrowseResultsRenderer",
                    "tabRenderer",
                    "sectionListRenderer",
                    "itemSectionRenderer",
                    "playlistVideoListRenderer",
                    "playlistVideoRenderer",
                    "menuRenderer",
                    "menuServiceItemRenderer",
                    "menuNavigationItemRenderer",
                    "thumbnailOverlayTimeStatusRenderer",
                    "continuationItemRenderer",
                    "mobileTopbarRenderer",
                    "topbarLogoRenderer",
                    "buttonRenderer",
                    "voiceSearchDialogRenderer",
                    "microformatDataRenderer"
                ]
            },
            "hasDecorated": true
        }
    },
    "contents": {
        "singleColumnBrowseResultsRenderer": {
            "tabs": [
                {
                    "tabRenderer": {
                        "selected": true,
                        "content": {
                            "sectionListRenderer": {
                                "contents": [
                                    {
                                        "itemSectionRenderer": {
                                            "contents": [
                                                {
                                                    "playlistVideoListRenderer": {
                                                        "contents": [
                                                            {
                                                                "playlistVideoRenderer": {
                                                                    "videoId": "nykOeWgQcHM",
                                                                    "thumbnail": {
                                                                        "thumbnails": [
                                                                            {
                                                                                "url": "https://i.ytimg.com/vi_webp/nykOeWgQcHM/default.webp",
                                                                                "width": 120,
                                                                                "height": 90
                                                                            },
                                                                            {
                                                                                "url": "https://i.ytimg.com/vi_webp/nykOeWgQcHM/mqdefault.webp",
                                                                                "width": 320,
                                                                                "height": 180
                                                                            },
                                                                            {
                                                                                "url": "https://i.ytimg.com/vi_webp/nykOeWgQcHM/hqdefault.webp",
                                                                                "width": 480,
                                                                                "height": 360
                                                                            },
                                                                            {
                                                                                "url": "https://i.ytimg.com/vi_webp/nykOeWgQcHM/sddefault.webp",
                                                                                "width": 640,
                                                                                "height": 480
                                                                            },
                                                                            {
                                                                                "url": "https://i.ytimg.com/vi/nykOeWgQcHM/hq720.jpg?sqp=-oaymwEcCK4FEIIDSEbyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLD8W4d6CIX8niWZMSbtM3EpxBglVg",
                                                                                "width": 686,
                                                                                "height": 386
                                                                            }
                                                                        ]
                                                                    },
                                                                    "title": {
                                                                        "runs": [
                                                                            {
                                                                                "text": "1. What is Computation?"
                                                                            }
                                                                        ],
                                                                        "accessibility": {
                                                                            "accessibilityData": {
                                                                                "label": "1. What is Computation? by MIT OpenCourseWare 21,59,079 views 6 years ago 43 minutes"
                                                                            }
                                                                        }
                                                                    },
                                                                    "index": {
                                                                        "runs": [
                                                                            {
                                                                                "text": "1"
                                                                            }
                                                                        ]
                                                                    },
                                                                    "shortBylineText": {
                                                                        "runs": [
                                                                            {
                                                                                "text": "MIT OpenCourseWare",
                                                                                "navigationEndpoint": {
                                                                                    "clickTrackingParams": "CDwQxjQYACITCLnmmbGx_5IDFUE6VAkdfkMkxsoBBLuNR4A=",
                                                                                    "commandMetadata": {
                                                                                        "webCommandMetadata": {
                                                                                            "url": "/@mitocw",
                                                                                            "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                                                                            "rootVe": 3611,
                                                                                            "apiUrl": "/youtubei/v1/browse"
                                                                                        }
                                                                                    },
                                                                                    "browseEndpoint": {
                                                                                        "browseId": "UCEBb1b_L6zDS3xTUrIALZOw",
                                                                                        "canonicalBaseUrl": "/@mitocw"
                                                                                    }
                                                                                }
                                                                            }
                                                                        ]
                                                                    },
                                                                    "lengthText": {
                                                                        "runs": [
                                                                            {
                                                                                "text": "43:06"
                                                                            }
                                                                        ],
                                                                        "accessibility": {
                                                                            "accessibilityData": {
                                                                                "label": "43 minutes, 6 seconds"
                                                                            }
                                                                        }
                                                                    },
                                                                    "navigationEndpoint": {
                                                                        "clickTrackingParams": "CDwQxjQYACITCLnmmbGx_5IDFUE6VAkdfkMkxjIKcGxwcF92aWRlb1okVkxQTFVsNHUzY05HUDYzV2JkRnhMOGdpdjR5aGdkTUdhWk5BmgEHCAwQ-iwYAcoBBLuNR4A=",
                                                                        "commandMetadata": {
                                                                            "webCommandMetadata": {
                                                                                "url": "/watch?v=nykOeWgQcHM&list=PLUl4u3cNGP63WbdFxL8giv4yhgdMGaZNA&index=1&pp=iAQB0gcJCaIKAYcqIYzv",
                                                                                "webPageType": "WEB_PAGE_TYPE_WATCH",
                                                                                "rootVe": 3832
                                                                            }
                                                                        },
                                                                        "watchEndpoint": {
                                                                            "videoId": "nykOeWgQcHM",
                                                                            "playlistId": "PLUl4u3cNGP63WbdFxL8giv4yhgdMGaZNA",
                                                                            "index": 0,
                                                                            "params": "OAI%3D",
                                                                            "playerParams": "iAQB0gcJCaIKAYcqIYzv",
                                                                            "loggingContext": {
                                                                                "vssLoggingContext": {
                                                                                    "serializedContextData": "GiJQTFVsNHUzY05HUDYzV2JkRnhMOGdpdjR5aGdkTUdhWk5B"
                                                                                }
                                                                            }
                                                                        }
                                                                    },
                                                                    "lengthSeconds": "2586",
                                                                    "trackingParams": "CDwQxjQYACITCLnmmbGx_5IDFUE6VAkdfkMkxg==",
                                                                    "isPlayable": true,
                                                                    "menu": {
                                                                        "menuRenderer": {
                                                                            "items": [
                                                                                {
                                                                                    "menuServiceItemRenderer": {
                                                                                        "text": {
                                                                                            "runs": [
                                                                                                {
                                                                                                    "text": "Save to Watch Later"
                                                                                                }
                                                                                            ]
                                                                                        },
                                                                                        "icon": {
                                                                                            "iconType": "ADD_TO_WATCH_LATER"
                                                                                        },
                                                                                        "serviceEndpoint": {
                                                                                            "clickTrackingParams": "CDwQxjQYACITCLnmmbGx_5IDFUE6VAkdfkMkxsoBBLuNR4A=",
                                                                                            "commandMetadata": {
                                                                                                "webCommandMetadata": {
                                                                                                    "sendPost": true,
                                                                                                    "apiUrl": "/youtubei/v1/browse/edit_playlist"
                                                                                                }
                                                                                            },
                                                                                            "playlistEditEndpoint": {
                                                                                                "playlistId": "WL",
                                                                                                "actions": [
                                                                                                    {
                                                                                                        "addedVideoId": "nykOeWgQcHM",
                                                                                                        "action": "ACTION_ADD_VIDEO"
                                                                                                    }
                                                                                                ]
                                                                                            }
                                                                                        },
                                                                                        "trackingParams": "CDwQxjQYACITCLnmmbGx_5IDFUE6VAkdfkMkxg=="
                                                                                    }
                                                                                },
                                                                                {
                                                                                    "menuNavigationItemRenderer": {
                                                                                        "text": {
                                                                                            "runs": [
                                                                                                {
                                                                                                    "text": "Save to playlist"
                                                                                                }
                                                                                            ]
                                                                                        },
                                                                                        "icon": {
                                                                                            "iconType": "BOOKMARK_BORDER"
                                                                                        },
                                                                                        "navigationEndpoint": {
                                                                                            "clickTrackingParams": "CD0QlKwJGAYiEwi55pmxsf-SAxVBOlQJHX5DJMbKAQS7jUeA",
                                                                                            "commandMetadata": {
                                                                                                "interactionLoggingCommandMetadata": {
                                                                                                    "screenVisualElement": {
                                                                                                        "uiType": 264491
                                                                                                    }
                                                                                                }
                                                                                            },
                                                                                            "showSheetCommand": {
                                                                                                "panelLoadingStrategy": {
                                                                                                    "requestTemplate": {
                                                                                                        "panelId": "PAadd_to_playlist",
                                                                                                        "params": "-gYNCgtueWtPZVdnUWNITQ%3D%3D"
                                                                                                    },
                                                                                                    "screenVe": 264491
                                                                                                }
                                                                                            }
                                                                                        },
                                                                                        "trackingParams": "CD0QlKwJGAYiEwi55pmxsf-SAxVBOlQJHX5DJMY="
                                                                                    }
                                                                                }
                                                                            ],
                                                                            "trackingParams": "CDwQxjQYACITCLnmmbGx_5IDFUE6VAkdfkMkxg==",
                                                                            "accessibility": {
                                                                                "accessibilityData": {
                                                                                    "label": "Action menu"
                                                                                }
                                                                            }
                                                                        }
                                                                    },
                                                                    "thumbnailOverlays": [
                                                                        {
                                                                            "thumbnailOverlayTimeStatusRenderer": {
                                                                                "text": {
                                                                                    "runs": [
                                                                                        {
                                                                                            "text": "43:06"
                                                                                        }
                                                                                    ],
                                                                                    "accessibility": {
                                                                                        "accessibilityData": {
                                                                                            "label": "43 minutes, 6 seconds"
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "style": "DEFAULT"
                                                                            }
                                                                        }
                                                                    ],
                                                                    "videoInfo": {
                                                                        "runs": [
                                                                            {
                                                                                "text": "21 lakh views"
                                                                            },
                                                                            {
                                                                                "text": " • "
                                                                            },
                                                                            {
                                                                                "text": "6 years ago"
                                                                            }
                                                                        ]
                                                                    }
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            ]
        }
    }
}


---

# Absolute JSON Trace: Shorts Cards
*File: `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`, `reel_item_watch?prettyPrint=False.JSON`*

### `shortsLockupViewModel` (Modern Feed / Up Next)
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].shortsLockupViewModel`

- **Video ID**: `...onTap.innertubeCommand.reelWatchEndpoint.videoId`
- **Shorts URL**: `...onTap.innertubeCommand.commandMetadata.webCommandMetadata.url` -> Value: `"/shorts/qLw-e9M0EBE"`
- **Title (Often used as Name)**: `...metadata.lockupMetadataViewModel.title.content`
- **Channel ID (Primary/Owner)**: `...metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Channel Handle (Alternate ID)**: `...metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Channel Name**: `...metadata.lockupMetadataViewModel.title.content` (Note: In shorts, titles are frequently repurposed as names)
- **Views Badge**: `...metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[1].metadataParts[0].text.content`
- **Thumbnail**: `...contentImage.thumbnailViewModel.image.sources[0].url`

### `shortsLockupViewModel` (Grid Shelf Variant)
*Found nested within `richSectionRenderer.content.gridShelfViewModel.contents[]` (Home/Search Feed)*

- **Video ID**: `...onTap.innertubeCommand.reelWatchEndpoint.videoId` -> Value: `"26gjbwjJpm0"`
- **Inline Playback Video ID**: `...inlinePlayerData.onVisible.innertubeCommand.watchEndpoint.videoId` -> Value: `"9SWDV9_VmVc"` (This is an alternative, more robust path to extract the videoId from Shorts that support preview playback on scroll (which is common on the Home Feed). )
- **Shorts URL**: `...onTap.innertubeCommand.commandMetadata.webCommandMetadata.url` -> Value: `"/shorts/26gjbwjJpm0"`
- **Accessibility Text (Title + Author + Views)**: `...accessibilityText` -> Value: `"Nyusha big love show 2026 – play Short"`
- **Overlay Primary Text**: `...overlayMetadata.primaryText.content` -> Value: `"Nyusha big love show 2026"`
- **Feedback Endpoint**: `...menuOnTap.innertubeCommand.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[0].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.feedbackEndpoint.feedbackToken`

This is the shortsLockupViewModel (Grid Shelf Variant). It matches exactly what we've mapped out for Home Page shorts, meaning that unlike Search Page shorts, it does not contain the
  `belowThumbnailMetadata` object (so it lacks the direct Channel ID, which confirms our previous structural fallback strategy is required for Home page shorts!).

**Rich Metadata (Often Present in Search Results, Sometimes Missing on Home)**:
- **Video ID**: `...onTap.innertubeCommand.reelWatchEndpoint.videoId` -> Value: `"Cyfdl_uJJa0"`
- **Shorts URL**: `...onTap.innertubeCommand.commandMetadata.webCommandMetadata.url` -> Value: `"/shorts/Cyfdl_uJJa0"`
- **Author/Channel Name**: `...belowThumbnailMetadata.primaryText.content` -> Value: `"Billboard"`
- **Author Handle URL**: `...belowThumbnailMetadata.avatar.avatarViewModel.endpoint.innertubeCommand.commandMetadata.webCommandMetadata.url` -> Value: `"/@Billboard"`
- **Author Channel ID**: `...belowThumbnailMetadata.avatar.avatarViewModel.endpoint.innertubeCommand.browseEndpoint.browseId` -> Value: `"UCsVcseUYbYjldc-XgcsiEbg"`
- **Author Logo**: `...belowThumbnailMetadata.avatar.avatarViewModel.image.sources[0].url`
"additionalDatas": 
[
    {
        "userFeedbackEndpointProductSpecificValueData":
        {
            "key": "video_id",
            "value": "Cyfdl_uJJa0"
        }
    }
]

*Important Note: In the `gridShelfViewModel` layout for Shorts, YouTube **sometimes omits the channel ID entirely** from the JSON payload (specifically on the home page). However, when performing a search, the `belowThumbnailMetadata` object often appears, providing a direct route to the `browseId`.*

### `reelItemRenderer` (Classic Shelf)
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].reelItemRenderer`

- **Video ID**: `...videoId`
- **Channel ID**: `...navigationEndpoint.reelWatchEndpoint.overlay.reelPlayerOverlayRenderer.reelChannelBarViewModel.channelTitle.onTap.innertubeCommand.browseEndpoint.browseId`
- **Title**: `...headline.simpleText`
- **Views**: `...viewCountText.simpleText`

### `reelPlayerOverlayRenderer` (Active Playback via XHR)
*File: `reel_item_watch?prettyPrint=False.JSON`*
**Base Path**: `overlay.reelPlayerOverlayRenderer`

- **Channel ID**: `...reelChannelBarViewModel.channelTitle.onTap.innertubeCommand.browseEndpoint.browseId`
- **Channel Name**: `...reelChannelBarViewModel.channelTitle.content`
- **Channel Handle**: `...reelChannelBarViewModel.channelTitle.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Channel Logo**: `...reelChannelBarViewModel.avatar.avatarViewModel.image.sources[0].url`
- **Like Count**: `...likeButton.likeButtonViewModel.likeCountText.content`



 {
    "richSectionRenderer": {
        "content": {
            "gridShelfViewModel": {
                "contents": [
                    {
                        "shortsLockupViewModel": {
                            "entityId": "shorts-shelf-item-26gjbwjJpm0",
                            "accessibilityText": "Nyusha big love show 2026 – play Short",
                            "thumbnail": {
                                "sources": [
                                    {
                                        "url": "https://i.ytimg.com/vi/26gjbwjJpm0/oar3.jpg?sqp=-oaymwEdCJUDENAFSEaQAgHyq4qpAwwIARUAAIhCcAHAAQY=&rs=AOn4CLANUfD6mxn1034ySh6E4QjxSLkHpg&usqp=CCk",
                                        "width": 405,
                                        "height": 720
                                    },
                                    {
                                        "url": "https://i.ytimg.com/vi/26gjbwjJpm0/oar3.jpg?sqp=-oaymwEgCJUDEOAESEaQAgHyq4qpAw8IARUAAIhCcAHAAQbIAQE=&rs=AOn4CLCW_sfLZCQsclwQdE-fRdtg5V5yAQ&usqp=CCk",
                                        "width": 405,
                                        "height": 608
                                    }
                                ]
                            },
                            "onTap": {
                                "innertubeCommand": {
                                    "clickTrackingParams": "CHAQh_YEGAAiEwj03bGeoP-SAxXDg1YBHaViIv9aD0ZFd2hhdF90b193YXRjaJoBBQgkEI4eygEEu41HgA==",
                                    "commandMetadata": {
                                        "webCommandMetadata": {
                                            "url": "/shorts/26gjbwjJpm0",
                                            "webPageType": "WEB_PAGE_TYPE_SHORTS",
                                            "rootVe": 37414
                                        }
                                    },
                                    "reelWatchEndpoint": {
                                        "videoId": "26gjbwjJpm0",
                                        "playerParams": "8AEBoAMByAMkuAQFogYVATtgMiJI9bdg7bS5CuwTiMh_w4l-kAcC",
                                        "thumbnail": {
                                            "thumbnails": [
                                                {
                                                    "url": "https://i.ytimg.com/vi/26gjbwjJpm0/frame0.jpg?usqp=CCk",
                                                    "width": 720,
                                                    "height": 1280
                                                }
                                            ],
                                            "isOriginalAspectRatio": true
                                        },
                                        "overlay": {
                                            "reelPlayerOverlayRenderer": {
                                                "style": "REEL_PLAYER_OVERLAY_STYLE_SHORTS",
                                                "trackingParams": "CHQQsLUEIhMI9N2xnqD_kgMVw4NWAR2lYiL_",
                                                "reelPlayerNavigationModel": "REEL_PLAYER_NAVIGATION_MODEL_UNSPECIFIED"
                                            }
                                        },
                                        "params": "CAUwAroBGFVDUDJIN2FSYnhfN0REY052WVplaDZsQQ%3D%3D",
                                        "sequenceProvider": "REEL_WATCH_SEQUENCE_PROVIDER_RPC",
                                        "sequenceParams": "CgsyNmdqYndqSnBtMCoCGAVQGWgA",
                                        "loggingContext": {
                                            "vssLoggingContext": {
                                                "serializedContextData": "CgIIDA%3D%3D"
                                            },
                                            "qoeLoggingContext": {
                                                "serializedContextData": "CgIIDA%3D%3D"
                                            }
                                        },
                                        "ustreamerConfig": "CAw=",
                                        "accessibilityRenderer": {
                                            "reelWatchAccessibilityRenderer": {
                                                "enablePlayPauseA11yButton": true,
                                                "loggingDirectives": {
                                                    "trackingParams": "CHMQ2MsOIhMI9N2xnqD_kgMVw4NWAR2lYiL_",
                                                    "visibility": {
                                                        "types": "4"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "inlinePlayerData": {
                                "onVisible": {
                                    "innertubeCommand": {
                                        "clickTrackingParams": "CHAQh_YEGAAiEwj03bGeoP-SAxXDg1YBHaViIv8yBmctaGlnaFoPRkV3aGF0X3RvX3dhdGNomgEFCCQQjh7KAQS7jUeA",
                                        "commandMetadata": {
                                            "webCommandMetadata": {
                                                "url": "/watch?v=26gjbwjJpm0&pp=YAHIAQHwAQG6AwIYAugFAaIGFQE7YDIiyhQ69DMBtSW96b7AxeW-lZAHAg%3D%3D",
                                                "webPageType": "WEB_PAGE_TYPE_WATCH",
                                                "rootVe": 3832
                                            }
                                        },
                                        "watchEndpoint": {
                                            "videoId": "26gjbwjJpm0",
                                            "playerParams": "YAHIAQHwAQG6AwIYAugFAaIGFQE7YDIiyhQ69DMBtSW96b7AxeW-lZAHAg%3D%3D"
                                        }
                                    }
                                }
                            },
                            "menuOnTap": {
                                "innertubeCommand": {
                                    "clickTrackingParams": "CHAQh_YEGAAiEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                    "showSheetCommand": {
                                        "panelLoadingStrategy": {
                                            "inlineContent": {
                                                "sheetViewModel": {
                                                    "content": {
                                                        "listViewModel": {
                                                            "listItems": [
                                                                {
                                                                    "listItemViewModel": {
                                                                        "title": {
                                                                            "content": "Not interested"
                                                                        },
                                                                        "leadingImage": {
                                                                            "sources": [
                                                                                {
                                                                                    "clientResource": {
                                                                                        "imageName": "NOT_INTERESTED"
                                                                                    }
                                                                                }
                                                                            ]
                                                                        },
                                                                        "rendererContext": {
                                                                            "commandContext": {
                                                                                "onTap": {
                                                                                    "innertubeCommand": {
                                                                                        "clickTrackingParams": "CHAQh_YEGAAiEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                                                                        "commandMetadata": {
                                                                                            "webCommandMetadata": {
                                                                                                "sendPost": true,
                                                                                                "apiUrl": "/youtubei/v1/feedback"
                                                                                            }
                                                                                        },
                                                                                        "feedbackEndpoint": {
                                                                                            "feedbackToken": "AB9zfpI1sDf3TpeB23hfgBbYftQXOU3AXzkZUA79kIcpynfDbav9D666oEFZmd-YqsOQ67BBDcBgmxu1kK0qBEAv4djG-GHWSHhYpm8O-oWLw6XGb9MfW-cOgkPsaDAf5JTHEtzWK4Sm",
                                                                                            "actions": [
                                                                                                {
                                                                                                    "clickTrackingParams": "CHAQh_YEGAAiEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                                                                                    "replaceEnclosingAction": {
                                                                                                        "item": {
                                                                                                            "notificationMultiActionRenderer": {
                                                                                                                "responseText": {
                                                                                                                    "runs": [
                                                                                                                        {
                                                                                                                            "text": "Video removed"
                                                                                                                        }
                                                                                                                    ]
                                                                                                                },
                                                                                                                "buttons": [
                                                                                                                    {
                                                                                                                        "buttonRenderer": {
                                                                                                                            "style": "STYLE_BLUE_TEXT",
                                                                                                                            "text": {
                                                                                                                                "runs": [
                                                                                                                                    {
                                                                                                                                        "text": "Undo"
                                                                                                                                    }
                                                                                                                                ]
                                                                                                                            },
                                                                                                                            "serviceEndpoint": {
                                                                                                                                "clickTrackingParams": "CHIQ8FsYACITCPTdsZ6g_5IDFcODVgEdpWIi_8oBBLuNR4A=",
                                                                                                                                "commandMetadata": {
                                                                                                                                    "webCommandMetadata": {
                                                                                                                                        "sendPost": true,
                                                                                                                                        "apiUrl": "/youtubei/v1/feedback"
                                                                                                                                    }
                                                                                                                                },
                                                                                                                                "undoFeedbackEndpoint": {
                                                                                                                                    "undoToken": "AB9zfpJq5mo2HlVkl06-KJRlfXQtGmq6c9jPRqy5Zhf9LDW2m8uy7pjPydKjkbyZEVaa20F2f00wrglBGB2Qz0FmOUiT5Vl8kMOjPRgHzdeF4k5C9DU5rLildf1GGXZ_kugWauZqOd-d",
                                                                                                                                    "actions": [
                                                                                                                                        {
                                                                                                                                            "clickTrackingParams": "CHIQ8FsYACITCPTdsZ6g_5IDFcODVgEdpWIi_8oBBLuNR4A=",
                                                                                                                                            "undoFeedbackAction": {
                                                                                                                                                "hack": true
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    ]
                                                                                                                                }
                                                                                                                            },
                                                                                                                            "trackingParams": "CHIQ8FsYACITCPTdsZ6g_5IDFcODVgEdpWIi_w=="
                                                                                                                        }
                                                                                                                    }
                                                                                                                ],
                                                                                                                "trackingParams": "CHEQpbwBIhMI9N2xnqD_kgMVw4NWAR2lYiL_"
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
                                                                },
                                                                {
                                                                    "listItemViewModel": {
                                                                        "title": {
                                                                            "content": "Send feedback"
                                                                        },
                                                                        "leadingImage": {
                                                                            "sources": [
                                                                                {
                                                                                    "clientResource": {
                                                                                        "imageName": "FEEDBACK"
                                                                                    }
                                                                                }
                                                                            ]
                                                                        },
                                                                        "rendererContext": {
                                                                            "commandContext": {
                                                                                "onTap": {
                                                                                    "innertubeCommand": {
                                                                                        "clickTrackingParams": "CHAQh_YEGAAiEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                                                                        "commandMetadata": {
                                                                                            "webCommandMetadata": {
                                                                                                "ignoreNavigation": true
                                                                                            }
                                                                                        },
                                                                                        "userFeedbackEndpoint": {
                                                                                            "additionalDatas": [
                                                                                                {
                                                                                                    "userFeedbackEndpointProductSpecificValueData": {
                                                                                                        "key": "video_id",
                                                                                                        "value": "26gjbwjJpm0"
                                                                                                    }
                                                                                                },
                                                                                                {
                                                                                                    "userFeedbackEndpointProductSpecificValueData": {
                                                                                                        "key": "lockup",
                                                                                                        "value": "shelf"
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
                                                            ]
                                                        }
                                                    }
                                                }
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


SHORTS VIDEO from Search page -

{
    "shortsLockupViewModel": {
        "entityId": "shorts-shelf-item-Cyfdl_uJJa0",
        "accessibilityText": "Shakira Talks About How \"Waka Waka\" Led To The Birth of Her Kids | Billboard Cover #Shorts, 41 lakh views, Billboard, 2 years ago – play Short",
        "thumbnail": {
            "sources": [
                {
                    "url": "https://i.ytimg.com/vi/Cyfdl_uJJa0/oar2.jpg?sqp=-oaymwEdCJUDENAFSEaQAgHyq4qpAwwIARUAAIhCcAHAAQY=&rs=AOn4CLDFWwyJSc6_K-rv9nqID7VfILPRGQ&usqp=CCk",
                    "width": 405,
                    "height": 720
                },
                {
                    "url": "https://i.ytimg.com/vi/Cyfdl_uJJa0/oar2.jpg?sqp=-oaymwEgCJUDEOAESEaQAgHyq4qpAw8IARUAAIhCcAHAAQbIAQE=&rs=AOn4CLCaQ080jZ8bDgXYXHeqEoEahAc7Bg&usqp=CCk",
                    "width": 405,
                    "height": 608
                }
            ]
        },
        "onTap": {
            "innertubeCommand": {
                "clickTrackingParams": "CD0Qh_YEGAEiEwjls6nCqv-SAxWfkksFHVhHFg5SB3NoYWtpcmGaAQUIMhD0JMoBBLuNR4A=",
                "commandMetadata": {
                    "webCommandMetadata": {
                        "url": "/shorts/Cyfdl_uJJa0",
                        "webPageType": "WEB_PAGE_TYPE_SHORTS",
                        "rootVe": 37414
                    }
                },
                "reelWatchEndpoint": {
                    "videoId": "Cyfdl_uJJa0",
                    "playerParams": "8AEByAMyuAQUogYVATtgMiKLmo72otCLzkrm6tCS4vIMkAcC",
                    "thumbnail": {
                        "thumbnails": [
                            {
                                "url": "https://i.ytimg.com/vi/Cyfdl_uJJa0/frame0.jpg?usqp=CCk",
                                "width": 1080,
                                "height": 1920
                            }
                        ],
                        "isOriginalAspectRatio": true
                    },
                    "overlay": {
                        "reelPlayerOverlayRenderer": {
                            "style": "REEL_PLAYER_OVERLAY_STYLE_SHORTS",
                            "trackingParams": "CD8QsLUEIhMI5bOpwqr_kgMVn5JLBR1YRxYO",
                            "reelPlayerNavigationModel": "REEL_PLAYER_NAVIGATION_MODEL_UNSPECIFIED"
                        }
                    },
                    "params": "CBQwAkoWCgsKCQoHc2hha2lyYRIHc2hha2lyYboBGFVDc1Zjc2VVWWJZamxkYy1YZ2NzaUViZw%3D%3D",
                    "sequenceProvider": "REEL_WATCH_SEQUENCE_PROVIDER_RPC",
                    "sequenceParams": "CgtDeWZkbF91SkphMCr0BAoNCgt5U0hMWEkyalFNbwoNCgtSYVhPRzFGU012SQoNCgtXbjRpNzRZV0pJbwoNCgtqMHBSel9PUGdWSQoNCgs1UTJuUWpDTFl6SQoNCgtqZ09NVHBOZHY0ZwoNCgsyWmM5Y0FTTU95ZwoNCgtqb3pwMDI2eTJCcwoNCgt0ZDZGNm4wUGpLZwoNCgtiR003R1owbGtkNAoNCgt0UlQtSlZrZ05DQQoNCgtQRmQ5MldOemgtYwoNCgtSTlVTb3IxaFFEOAoNCgttNzNMWmJ4djdPWQoNCgtFMUc3Zjhxb3otVQoNCgstZ055cDY4d1hxWQoNCgtVYjFNemFCTVhRWQoNCgtBWHZvbmtYa2ZDYwoNCgtKYnpNYll4Mjg4ZwoNCgt2SzlwdGtOX0M4ZwoNCgs4azNBZkJsblJkOAoNCgs3bU0wQWtxeHdvYwoNCgtvdjFnSlFjZGQtawoNCgtlUjZ4dGVKNEhtQQoNCgtrWG5XT01UUUJpcwoNCgtSYjRWRkZINWtsdwoNCgtWekJaX2J6QXlLTQoNCgthWS0ySDRHdG5nWQoNCgt1M2FTUmtVTThNawoNCgtSczM3VXZhSjdabwoNCgt4bG1JQVhTd295WQoNCgtnQnNFTmlobS05RQoNCgtEc291aWhyM1NVTQoNCgtDeVRCWXFYeW55cwoNCgtJTnJnck5rYkNJMAoNCgt1WWl4ZjZGUmMtawoNCgtHZlc1T29yV1hYQQoNCgtTaVZmY2VhTWI0YwoNCgtQNzRubmVlTDdFVQoNCgtXX203d2RveS03YxABGBQiFgoLCgkKB3NoYWtpcmESB3NoYWtpcmFwBIABAQ%3D%3D",
                    "loggingContext": {
                        "vssLoggingContext": {
                            "serializedContextData": "CgIIDA%3D%3D"
                        },
                        "qoeLoggingContext": {
                            "serializedContextData": "CgIIDA%3D%3D"
                        }
                    },
                    "ustreamerConfig": "CAw=",
                    "accessibilityRenderer": {
                        "reelWatchAccessibilityRenderer": {
                            "enablePlayPauseA11yButton": true,
                            "loggingDirectives": {
                                "trackingParams": "CD4Q2MsOIhMI5bOpwqr_kgMVn5JLBR1YRxYO",
                                "visibility": {
                                    "types": "4"
                                }
                            }
                        }
                    }
                }
            }
        },
        "inlinePlayerData": {
            "onVisible": {
                "innertubeCommand": {
                    "clickTrackingParams": "CD0Qh_YEGAEiEwjls6nCqv-SAxWfkksFHVhHFg4yBnNlYXJjaFIHc2hha2lyYZoBBQgyEPQkygEEu41HgA==",
                    "commandMetadata": {
                        "webCommandMetadata": {
                            "url": "/watch?v=Cyfdl_uJJa0&pp=YAHIAQHwAQG6AwIYAugFAaIGFQE7YDIiXu2RoZBbncsJRGs-KlQE7pAHAg%3D%3D",
                            "webPageType": "WEB_PAGE_TYPE_WATCH",
                            "rootVe": 3832
                        }
                    },
                    "watchEndpoint": {
                        "videoId": "Cyfdl_uJJa0",
                        "playerParams": "YAHIAQHwAQG6AwIYAugFAaIGFQE7YDIiXu2RoZBbncsJRGs-KlQE7pAHAg%3D%3D"
                    }
                }
            }
        },
        "menuOnTap": {
            "innertubeCommand": {
                "clickTrackingParams": "CD0Qh_YEGAEiEwjls6nCqv-SAxWfkksFHVhHFg7KAQS7jUeA",
                "showSheetCommand": {
                    "panelLoadingStrategy": {
                        "inlineContent": {
                            "sheetViewModel": {
                                "content": {
                                    "listViewModel": {
                                        "listItems": [
                                            {
                                                "listItemViewModel": {
                                                    "title": {
                                                        "content": "Send feedback"
                                                    },
                                                    "leadingImage": {
                                                        "sources": [
                                                            {
                                                                "clientResource": {
                                                                    "imageName": "FEEDBACK"
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    "rendererContext": {
                                                        "commandContext": {
                                                            "onTap": {
                                                                "innertubeCommand": {
                                                                    "clickTrackingParams": "CD0Qh_YEGAEiEwjls6nCqv-SAxWfkksFHVhHFg7KAQS7jUeA",
                                                                    "commandMetadata": {
                                                                        "webCommandMetadata": {
                                                                            "ignoreNavigation": true
                                                                        }
                                                                    },
                                                                    "userFeedbackEndpoint": {
                                                                        "additionalDatas": [
                                                                            {
                                                                                "userFeedbackEndpointProductSpecificValueData": {
                                                                                    "key": "video_id",
                                                                                    "value": "Cyfdl_uJJa0"
                                                                                }
                                                                            },
                                                                            {
                                                                                "userFeedbackEndpointProductSpecificValueData": {
                                                                                    "key": "lockup",
                                                                                    "value": "shelf"
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
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "indexInCollection": 0,
        "menuOnTapA11yLabel": "More actions",
        "overlayMetadata": {
            "primaryText": {
                "content": "Shakira Talks About How \"Waka Waka\" Led To The Birth of Her Kids | Billboard Cover #Shorts"
            },
            "secondaryText": {
                "content": "41 lakh views"
            }
        },
        "belowThumbnailMetadata": {
            "primaryText": {
                "content": "Billboard"
            },
            "secondaryText": {
                "content": "2 years ago"
            },
            "avatar": {
                "avatarViewModel": {
                    "image": {
                        "sources": [
                            {
                                "url": "https://yt3.ggpht.com/1XHRrQzHhh1wqc_O1fCKOz60axnwpoLiVa3CtsHsuMVY593bkTfuLirdh7ew4AJV-fRwTSUYAQ=s68-c-k-c0x00ffffff-no-rj",
                                "width": 68,
                                "height": 68
                            }
                        ],
                        "processor": {
                            "borderImageProcessor": {
                                "circular": true
                            }
                        }
                    },
                    "accessibilityText": "Go to channel Billboard",
                    "avatarImageSize": "AVATAR_SIZE_M",
                    "endpoint": {
                        "innertubeCommand": {
                            "clickTrackingParams": "CD0Qh_YEGAEiEwjls6nCqv-SAxWfkksFHVhHFg7KAQS7jUeA",
                            "commandMetadata": {
                                "webCommandMetadata": {
                                    "url": "/@Billboard",
                                    "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                    "rootVe": 3611,
                                    "apiUrl": "/youtubei/v1/browse"
                                }
                            },
                            "browseEndpoint": {
                                "browseId": "UCsVcseUYbYjldc-XgcsiEbg",
                                "canonicalBaseUrl": "/@Billboard"
                            }
                        }
                    }
                }
            }
        },
        "stackedFrameData": {},
        "titleTruncationStyle": "SHORTS_LOCKUP_TITLE_TRUNCATION_STYLE_UNKNOWN",
        "loggingDirectives": {
            "trackingParams": "CD0Qh_YEGAEiEwjls6nCqv-SAxWfkksFHVhHFg4=",
            "visibility": {
                "types": "12"
            }
        }
    }
}





---

# Absolute JSON Trace: Search Page Hero Cards (`universalWatchCardRenderer` & `compactChannelRenderer`)
*File: `strange_ytInitialData.json`, Search Page Initial Load*

When searching for a major entity (Artist, Topic), YouTube often places a "Hero" card at the top.

### `universalWatchCardRenderer`
**Base Path**: `contents.sectionListRenderer.contents[0].universalWatchCardRenderer`

**Header Identity**:
- **Entity Title**: `...header.watchCardRichHeaderRenderer.title.runs[0].text` -> Value: `"Nyusha"`
- **Primary Channel ID**: `...header.watchCardRichHeaderRenderer.titleNavigationEndpoint.browseEndpoint.browseId` -> Value: `"UCm9VWKAFz0aXpuEHPHMae7w"`
- **Handle**: `...header.watchCardRichHeaderRenderer.subtitle.runs[0].text` -> Value: `"@NYUSHAmusic"`
- **Avatar Logo**: `...header.watchCardRichHeaderRenderer.avatar.thumbnails[0].url`

**Hero Content / CTA**:
- **Hero Video ID**: `...callToAction.watchCardHeroVideoRenderer.watchEndpoint.videoId` -> Value: `"XuHro6TjXww"`
- **Hero Playlist ID**: `...callToAction.watchCardHeroVideoRenderer.watchEndpoint.playlistId` -> Value: `"RDEMgF031uDlRkNZ1d0qT2a8QA"`
- **CTA Label**: `...callToAction.watchCardHeroVideoRenderer.callToActionButton.callToActionButtonRenderer.label.runs[0].text` -> Value: `"YouTube Mix"`

### `searchRefinementCardRenderer` (Search Refinement Chips)
Refinement cards usually appear in a horizontal list at the top or middle of search results.
**Base Path**: `onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems[i].itemSectionRenderer.contents[0].horizontalCardListRenderer.cards[j].searchRefinementCardRenderer`

**Identifiers**:
- **Refinement Query**: `...searchRefinementCardRenderer.query.runs[0].text` -> Value: `"Ed Sheeran and Justin Bieber"`
- **Associated Entity ID (Channel ID)**: `...searchRefinementCardRenderer.bylineText.runs[0].navigationEndpoint.browseEndpoint.browseId` -> Value: `"UCYLNGLIzMhRTi6ZOLjAPSmw"`
- **Associated Entity Name**: `...searchRefinementCardRenderer.bylineText.runs[0].text` -> Value: `"Ed Sheeran"`
- **Thumbnail**: `...searchRefinementCardRenderer.thumbnail.thumbnails[0].url`

### `compactChannelRenderer` (Standalone Channel Card)
**Base Path**: `...itemSectionRenderer.contents[i].compactChannelRenderer`

- **Channel ID**: `...channelId` -> Value: `"UCm9VWKAFz0aXpuEHPHMae7w"`
- **Display Name**: `...displayName.runs[0].text` -> Value: `"NYUSHA MUSIC"`
- **Subscriber Count String**: `...videoCountText.runs[0].text` -> Value: `"6.48 lakh subscribers"`
- **Handle**: `...subscriberCountText.runs[0].text` -> Value: `"@NYUSHAmusic"`
- **Navigation Browse ID**: `...navigationEndpoint.browseEndpoint.browseId` -> Value: `"UCm9VWKAFz0aXpuEHPHMae7w"`

---

# Absolute JSON Trace: Normal Video Cards
*File: `YTM-XHR.json`, `YTM.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json`, `Home Page Context`*

### `videoWithContextRenderer`
This is the standard video card format. It appears wrapped differently depending on if it's the main feed or a sidebar continuation.
**Base Path (Main Feed)**: `...richItemRenderer.content.videoWithContextRenderer`
**Base Path (Sidebar/XHR)**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].videoWithContextRenderer`
**Base Path (Search XHR)**: `onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems[i].itemSectionRenderer.contents[0].videoWithContextRenderer`

**Video Details**:
- **Video ID**: `...videoId` -> Value: `"63zGtiv89bA"`
- **Title**: `...headline.runs[0].text` -> Value: `"The C Iceberg"`
- **Length/Duration Badge**: `...lengthText.runs[0].text` -> Value: `"9:38"`
- **View Count Category**: `...shortViewCountText.runs[0].text` -> Value: `"1.2 lakh views"`
- **Published Time Category**: `...publishedTimeText.runs[0].text` -> Value: `"9 days ago"`
- **Inline Playback Video ID**: `...inlinePlaybackEndpoint.watchEndpoint.videoId` -> Value: `"63zGtiv89bA"`
- **Nofollow Flag (Related/Watch)**: `...navigationEndpoint.watchEndpoint.nofollow` -> Value: `true`

**Channel Identities**:
- **Primary Channel ID (Byline)**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId` -> Value: `"UCzvvjULGBVuXZMN_yLS8OUQ"`
- **Primary Channel Name**: `...shortBylineText.runs[0].text` -> Value: `"Xander Gouws"`
- **Primary Channel Handle (Alternate ID)**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl` -> Value: `"/@XanderGouws"`
- **Alternate Channel ID (Thumbnail Fallback)**: `...channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId` -> Value: `"UCzvvjULGBVuXZMN_yLS8OUQ"`
- **Primary Channel Logo**: `...channelThumbnail.channelThumbnailWithLinkRenderer.thumbnail.thumbnails[0].url`

**Collaborator Roster (Show Sheet Logic - YTM)**:
If `shortBylineText.runs[0].navigationEndpoint.showSheetCommand` exists:
- **List Items**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems`
- **Collaborator ID**: `listItems[i].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Collaborator Handle**: `listItems[i].listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`

**DOM Identifiers (YTM Video Card)**:
- **Host Element Tag**: `ytm-video-with-context-renderer`
- **Main Link**: `a.media-item-thumbnail-container`
- **Thumbnail**: `img.ytCoreImageHost`
- **Title**: `h3.media-item-title`
- **Channel Name Link**: `a.media-item-subtitle` (Usually contains channel name and views)
- **Menu Button**: `ytm-menu-popup-renderer` or `button.icon-button` inside metadata.

**Action Menu / Feedback**:
- **Menu Items Path**: `...menu.menuRenderer.items[]`
- **"Save to Watch Later"**: *Found in `menuServiceItemRenderer` where `iconType` is `"ADD_TO_WATCH_LATER"`* -> `...serviceEndpoint.playlistEditEndpoint.playlistId` -> Value: `"WL"`
- **"Save to playlist"**: *Found in `menuNavigationItemRenderer` where `iconType` is `"BOOKMARK_BORDER"`* -> `...navigationEndpoint.showSheetCommand.panelLoadingStrategy.requestTemplate.panelId` -> Value: `"PAadd_to_playlist"`
- **"Not interested" Feedback Token**: *Found in `menuServiceItemRenderer` where `iconType` is `"NOT_INTERESTED"`* -> `...serviceEndpoint.feedbackEndpoint.feedbackToken`
- **"Don't recommend channel" Feedback Token**: *Found in `menuServiceItemRenderer` where `iconType` is `"REMOVE"`* -> `...serviceEndpoint.feedbackEndpoint.feedbackToken`

**State Indicators**:
- **Is Watched**: `...isWatched` -> Value: `true` / `false`
- **Resume Playback Overlay**: `...thumbnailOverlays[0].thumbnailOverlayResumePlaybackRenderer.percentDurationWatched` -> Value: `100` (Or `10`, `50`, etc., indicating partial watch state, found when `isWatched` is present but can be false or true depending on completion)

Main Feed Video Card JSON -

{
    "richItemRenderer": {
        "content": {
            "videoWithContextRenderer": {
                "headline": {
                    "runs": [
                        {
                            "text": "The C Iceberg"
                        }
                    ]
                },
                "thumbnail": {
                    "thumbnails": [
                        {
                            "url": "https://i.ytimg.com/vi_webp/63zGtiv89bA/default.webp",
                            "width": 120,
                            "height": 90
                        }
                    ]
                },
                "shortBylineText": {
                    "runs": [
                        {
                            "text": "Xander Gouws",
                            "navigationEndpoint": {
                                "browseEndpoint": {
                                    "browseId": "UCzvvjULGBVuXZMN_yLS8OUQ",
                                    "canonicalBaseUrl": "/@XanderGouws"
                                }
                            }
                        }
                    ]
                },
                "lengthText": {
                    "runs": [
                        {
                            "text": "9:38"
                        }
                    ]
                },
                "shortViewCountText": {
                    "runs": [
                        {
                            "text": "1.2 lakh views"
                        }
                    ]
                },
                "navigationEndpoint": {
                    "watchEndpoint": {
                        "videoId": "63zGtiv89bA"
                    }
                },
                "menu": {
                    "menuRenderer": {
                        "items": [
                            {
                                "menuServiceItemRenderer": {
                                    "icon": {
                                        "iconType": "NOT_INTERESTED"
                                    },
                                    "serviceEndpoint": {
                                        "feedbackEndpoint": {
                                            "feedbackToken": "AB9zfpKn6..."
                                        }
                                    }
                                }
                            },
                            {
                                "menuServiceItemRenderer": {
                                    "icon": {
                                        "iconType": "REMOVE"
                                    },
                                    "serviceEndpoint": {
                                        "feedbackEndpoint": {
                                            "feedbackToken": "AB9zfpJX..."
                                        }
                                    }
                                }
                            }
                        ]
                    }
                },
                "videoId": "63zGtiv89bA",
                "channelThumbnail": {
                    "channelThumbnailWithLinkRenderer": {
                        "thumbnail": {
                            "thumbnails": [
                                {
                                    "url": "https://yt3.ggpht.com/...=s68-c-k-c0x00ffffff-no-rj"
                                }
                            ]
                        },
                        "navigationEndpoint": {
                            "browseEndpoint": {
                                "browseId": "UCzvvjULGBVuXZMN_yLS8OUQ",
                                "canonicalBaseUrl": "/@XanderGouws"
                            }
                        }
                    }
                },
                "publishedTimeText": {
                    "runs": [
                        {
                            "text": "9 days ago"
                        }
                    ]
                },
                "inlinePlaybackEndpoint": {
                    "watchEndpoint": {
                        "videoId": "63zGtiv89bA"
                    }
                }
            }
        }
    }
}

JSON of normal video from Search Page-

{
    "videoWithContextRenderer": {
        "headline": {
            "runs": [
                {
                    "text": "Enrique Iglesias - I Like It (Official Music Video)"
                }
            ],
            "accessibility": {
                "accessibilityData": {
                    "label": "Enrique Iglesias - I Like It (Official Music Video) by Enrique Iglesias 40,52,59,349 views 15 years ago 3 minutes, 54 seconds"
                }
            }
        },
        "thumbnail": {
            "thumbnails": [
                {
                    "url": "https://i.ytimg.com/vi_webp/X9_n8jakvWU/default.webp",
                    "width": 120,
                    "height": 90
                },
                {
                    "url": "https://i.ytimg.com/vi_webp/X9_n8jakvWU/mqdefault.webp",
                    "width": 320,
                    "height": 180
                },
                {
                    "url": "https://i.ytimg.com/vi_webp/X9_n8jakvWU/hqdefault.webp",
                    "width": 480,
                    "height": 360
                },
                {
                    "url": "https://i.ytimg.com/vi_webp/X9_n8jakvWU/sddefault.webp",
                    "width": 640,
                    "height": 480
                },
                {
                    "url": "https://i.ytimg.com/vi/X9_n8jakvWU/hq720.jpg?sqp=-oaymwEcCK4FEIIDSEbyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDUzGKHROgyBgkk8thoZSHbh9YYRA",
                    "width": 686,
                    "height": 386
                }
            ]
        },
        "shortBylineText": {
            "runs": [
                {
                    "text": "Enrique Iglesias",
                    "navigationEndpoint": {
                        "clickTrackingParams": "CEQQ_FoYASITCOWzqcKq_5IDFZ-SSwUdWEcWDsoBBLuNR4A=",
                        "commandMetadata": {
                            "webCommandMetadata": {
                                "url": "/channel/UC-6czyMkxDi8E8akPl0c7_w",
                                "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                "rootVe": 3611,
                                "apiUrl": "/youtubei/v1/browse"
                            }
                        },
                        "browseEndpoint": {
                            "browseId": "UC-6czyMkxDi8E8akPl0c7_w",
                            "canonicalBaseUrl": "/channel/UC-6czyMkxDi8E8akPl0c7_w"
                        }
                    }
                }
            ]
        },
        "lengthText": {
            "runs": [
                {
                    "text": "3:54"
                }
            ],
            "accessibility": {
                "accessibilityData": {
                    "label": "3 minutes, 54 seconds"
                }
            }
        },
        "shortViewCountText": {
            "runs": [
                {
                    "text": "40 crore views"
                }
            ],
            "accessibility": {
                "accessibilityData": {
                    "label": "40 crore views"
                }
            }
        },
        "navigationEndpoint": {
            "clickTrackingParams": "CEQQ_FoYASITCOWzqcKq_5IDFZ-SSwUdWEcWDjIGc2VhcmNoUgdzaGFraXJhmgEDEPQkygEEu41HgA==",
            "commandMetadata": {
                "webCommandMetadata": {
                    "url": "/watch?v=X9_n8jakvWU&pp=ygUHc2hha2lyYQ%3D%3D",
                    "webPageType": "WEB_PAGE_TYPE_WATCH",
                    "rootVe": 3832
                }
            },
            "watchEndpoint": {
                "videoId": "X9_n8jakvWU",
                "params": "8gMFDejn_j0%3D",
                "playerParams": "ygUHc2hha2lyYQ%3D%3D"
            }
        },
        "menu": {
            "menuRenderer": {
                "items": [
                    {
                        "menuServiceItemRenderer": {
                            "text": {
                                "runs": [
                                    {
                                        "text": "Save to Watch Later"
                                    }
                                ]
                            },
                            "icon": {
                                "iconType": "ADD_TO_WATCH_LATER"
                            },
                            "serviceEndpoint": {
                                "clickTrackingParams": "CEQQ_FoYASITCOWzqcKq_5IDFZ-SSwUdWEcWDsoBBLuNR4A=",
                                "commandMetadata": {
                                    "webCommandMetadata": {
                                        "sendPost": true,
                                        "apiUrl": "/youtubei/v1/browse/edit_playlist"
                                    }
                                },
                                "playlistEditEndpoint": {
                                    "playlistId": "WL",
                                    "actions": [
                                        {
                                            "addedVideoId": "X9_n8jakvWU",
                                            "action": "ACTION_ADD_VIDEO"
                                        }
                                    ]
                                }
                            },
                            "trackingParams": "CEQQ_FoYASITCOWzqcKq_5IDFZ-SSwUdWEcWDg=="
                        }
                    },
                    {
                        "menuNavigationItemRenderer": {
                            "text": {
                                "runs": [
                                    {
                                        "text": "Save to playlist"
                                    }
                                ]
                            },
                            "icon": {
                                "iconType": "BOOKMARK_BORDER"
                            },
                            "navigationEndpoint": {
                                "clickTrackingParams": "CEUQlKwJGAciEwjls6nCqv-SAxWfkksFHVhHFg7KAQS7jUeA",
                                "commandMetadata": {
                                    "interactionLoggingCommandMetadata": {
                                        "screenVisualElement": {
                                            "uiType": 264491
                                        }
                                    }
                                },
                                "showSheetCommand": {
                                    "panelLoadingStrategy": {
                                        "requestTemplate": {
                                            "panelId": "PAadd_to_playlist",
                                            "params": "-gYNCgtYOV9uOGpha3ZXVQ%3D%3D"
                                        },
                                        "screenVe": 264491
                                    }
                                }
                            },
                            "trackingParams": "CEUQlKwJGAciEwjls6nCqv-SAxWfkksFHVhHFg4="
                        }
                    }
                ],
                "trackingParams": "CEQQ_FoYASITCOWzqcKq_5IDFZ-SSwUdWEcWDg==",
                "accessibility": {
                    "accessibilityData": {
                        "label": "Action menu"
                    }
                }
            }
        },
        "isWatched": true,
        "trackingParams": "CEQQ_FoYASITCOWzqcKq_5IDFZ-SSwUdWEcWDkDl-pK1o_75718=",
        "videoId": "X9_n8jakvWU",
        "thumbnailOverlays": [
            {
                "thumbnailOverlayResumePlaybackRenderer": {
                    "percentDurationWatched": 100
                }
            },
            {
                "thumbnailOverlayTimeStatusRenderer": {
                    "text": {
                        "runs": [
                            {
                                "text": "3:54"
                            }
                        ],
                        "accessibility": {
                            "accessibilityData": {
                                "label": "3 minutes, 54 seconds"
                            }
                        }
                    },
                    "style": "DEFAULT",
                    "icon": {
                        "iconType": "MUSIC"
                    }
                }
            }
        ],
        "channelThumbnail": {
            "channelThumbnailWithLinkRenderer": {
                "thumbnail": {
                    "thumbnails": [
                        {
                            "url": "https://yt3.ggpht.com/kYe56za0VurtSHjxdg7tH8SaKQDtRxZdnOGlXp_ijCGMUZHIPQjsR57OGP6Npgj7XK_8UEZTTw8=s88-c-k-c0x00ffffff-no-rj",
                            "width": 68,
                            "height": 68
                        }
                    ]
                },
                "navigationEndpoint": {
                    "clickTrackingParams": "CEQQ_FoYASITCOWzqcKq_5IDFZ-SSwUdWEcWDsoBBLuNR4A=",
                    "commandMetadata": {
                        "webCommandMetadata": {
                            "url": "/channel/UC-6czyMkxDi8E8akPl0c7_w",
                            "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                            "rootVe": 3611,
                            "apiUrl": "/youtubei/v1/browse"
                        }
                    },
                    "browseEndpoint": {
                        "browseId": "UC-6czyMkxDi8E8akPl0c7_w"
                    }
                },
                "accessibility": {
                    "accessibilityData": {
                        "label": "Go to channel EnriqueIglesiasVEVO"
                    }
                }
            }
        },
        "publishedTimeText": {
            "runs": [
                {
                    "text": "15 years ago"
                }
            ]
        },
        "richThumbnail": {
            "movingThumbnailRenderer": {
                "movingThumbnailDetails": {
                    "thumbnails": [
                        {
                            "url": "https://i.ytimg.com/an_webp/X9_n8jakvWU/mqdefault_6s.webp?du=3000&sqp=CILkkc0G&rs=AOn4CLC7Z4sHUWZIOUVVZVZwpXHkKD-v6Q",
                            "width": 320,
                            "height": 180
                        }
                    ],
                    "logAsMovingThumbnail": true
                }
            }
        },
        "accessibility": {
            "accessibilityData": {
                "label": "Enrique Iglesias - I Like It (Official Music Video) – 3 minutes, 54 seconds – Go to channel EnriqueIglesiasVEVO – Enrique Iglesias - 40 crore views - 15 years ago – play video"
            }
        },
        "inlinePlaybackEndpoint": {
            "clickTrackingParams": "CEQQ_FoYASITCOWzqcKq_5IDFZ-SSwUdWEcWDjIGc2VhcmNoUgdzaGFraXJhmgEDEPQkygEEu41HgA==",
            "commandMetadata": {
                "webCommandMetadata": {
                    "url": "/watch?v=X9_n8jakvWU&pp=YAHIAQGiBhUBO2AyIpMqFncbywW7D_j4rIb9Rbc%3D",
                    "webPageType": "WEB_PAGE_TYPE_WATCH",
                    "rootVe": 3832
                }
            },
            "watchEndpoint": {
                "videoId": "X9_n8jakvWU",
                "params": "8gMFDejn_j0%3D",
                "playerParams": "YAHIAQGiBhUBO2AyIpMqFncbywW7D_j4rIb9Rbc%3D"
            }
        }
    }
}

----


### `lockupViewModel` (Modern High-Nesting)
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].lockupViewModel`

- **Content ID (Video ID)**: `...contentId`
- **Watch Endpoint Video ID**: `...rendererContext.commandContext.onTap.innertubeCommand.watchEndpoint.videoId`
- **Primary Channel ID**: `...metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Channel Name**: `...metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[0].metadataParts[0].text.content`
- **Primary Channel ID (Run Logic)**: `...metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[0].metadataParts[0].text.commandRuns[0].onTap.innertubeCommand.browseEndpoint.browseId`
- **Channel Handle (Alternate ID)**: `...metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Primary Channel Logo**: `...metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources[0].url`
- **Title Text**: `...metadata.lockupMetadataViewModel.title.content` -> Value: `"KILL TONY"`
- **View Count/Date Metadata**: `...metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[1].metadataParts[0].text.content`
- **Primary Channel ID (Run Logic - 'Kill Tony' Variant)**: `...metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[0].metadataParts[0].text.commandRuns[0].onTap.innertubeCommand.browseEndpoint.browseId` -> Value: `"UCwzCMiicL-hBUzyjWiJaseg"`
- **Secondary Metadata (Episodes/Update Time)**: `...metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[1].metadataParts[0].text.content` -> Value: `"Updated 2 days ago"`
- **Metadata Delimiter**: `...metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.delimiter` -> Value: `" • "`

**Nested Collaborator Roster (Show Sheet Logic - YTM)**:
If `shortBylineText.runs[0].navigationEndpoint.showSheetCommand` exists (Common in `videoWithContextRenderer` and `lockupViewModel` on mobile):
- **List Items**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems`
- **Collaborator ID**: `listItems[i].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Collaborator Handle**: `listItems[i].listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl`
- **Collaborator Custom URL**: `listItems[i].listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl` (Fallback)
- **Collaborator Name**: `listItems[i].listItemViewModel.title.content`

**DOM Identifiers (Modern Desktop Lockup)**:
- **Host Element Tag**: `yt-lockup-view-model`
- **Main Link**: `a.yt-lockup-view-model__content-image`
- **Title**: `a.yt-lockup-metadata-view-model__title`
- **Metadata Container**: `yt-content-metadata-view-model`
- **Collaborations (Avatars)**: `yt-avatar-stack-view-model` (Contains multiple `avatar-view-model` elements)
- **Collaborations (Text)**: `yt-content-metadata-view-model__metadata-row` -> `.yt-core-attributed-string` (Contains "Channel A and Channel B" text)

### `compactVideoRenderer` (Kids / Sidebars)
**Base Path (Sidebar/XHR)**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].compactVideoRenderer`
**Base Path (YT Kids Initial Data)**: `contents.kidsHomeScreenRenderer.anchors[0].anchoredSectionRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[i].compactVideoRenderer`
*File: `YT_KIDS.json`, `YTM-XHR.json`*

- **Video ID**: `...videoId` -> Value: `"6m25h6hvEGw"`
- **Start Time (Seconds)**: `...navigationEndpoint.watchEndpoint.startTimeSeconds` -> Value: `148` (Optional, used for resume playback)
- **Primary Channel ID**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId` -> Value: `"UCRxdo0UD_OU2a2ACG7LZHtA"`
- **Primary Channel Name**: `...shortBylineText.runs[0].text` -> Value: `"Titipo Titipo Hindi"`
- **Kids External Channel ID**: `...kidsVideoOwnerExtension.externalChannelId` -> Value: `"UCRxdo0UD_OU2a2ACG7LZHtA"`
- **Duration**: `...lengthText.runs[0].text`
- **Channel Logo**: `...channelThumbnail.thumbnails[0].url`

**Action Menu / Feedback**:
- **"Block this video" Endpoint**: `...menu.menuRenderer.items[0].menuServiceItemRenderer.serviceEndpoint.updateKidsBlacklistEndpoint.items[0].action` -> Value: `"BLOCKLIST_ACTION_BLOCK"`

# Absolute JSON Trace: Player Response / Video Meta (`/player` Endpoint)
*File: `Player?prettyPrint=false`, Inline Player Hover / Active Watch Page*

When a video starts playing (or hovering in a preview), YouTube issues a request to the `/player` endpoint. This response does not contain feed items; it contains direct metadata about the currently playing video. 

**Base Path**: `videoDetails` (Directly at the root of the player response)

- **Video ID**: `videoDetails.videoId` -> Value: `"DUT5rEU6pqM"`
- **Title**: `videoDetails.title` -> Value: `"Shakira - Hips Don't Lie..."`
- **Primary Channel ID**: `videoDetails.channelId` -> Value: `"UCGnjeahCJW1AF34HBmQTJ-Q"`
- **Author/Channel Name**: `videoDetails.author` -> Value: `"shakiraVEVO"`
- **View Count**: `videoDetails.viewCount` -> Value: `"1757151323"`
- **Keywords/Tags**: `videoDetails.keywords[]` *(Array of string tags)*
- **Short Description**: `videoDetails.shortDescription`

**Secondary / Fallback Context**:
**Base Path**: `microformat.playerMicroformatRenderer`

- **Author Handle URL**: `...ownerProfileUrl` -> Value: `"http://www.youtube.com/@shakiraVEVO"`
- **Alternate Channel ID**: `...externalChannelId` -> Value: `"UCGnjeahCJW1AF34HBmQTJ-Q"`
- **Family Safe Flag**: `...isFamilySafe` -> Value: `true`

---

# Absolute JSON Trace: Posts / Community Cards
*File: `YTM-XHR.json`, `YT_MAIN_NEXT.json`, `Channel Page Context`*

### `backstagePostRenderer` (Community Post / Thread)
**Base Path**: `...richSectionRenderer.content.backstagePostThreadRenderer.post.backstagePostRenderer` OR `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].postRenderer`

**Identifiers & Author**:
- **Post ID**: `...postId` -> Value: `"UgkxSvWRZtiCPAdVhqpAt7PCYPZ7c-Sf-gzx"`
- **Author Name**: `...authorText.runs[0].text` -> Value: `"dr Jonas Birch"`
- **Author Channel ID**: `...authorText.runs[0].navigationEndpoint.browseEndpoint.browseId` -> Value: `"UC6Q8NDGqQ2eJ7QXX693ikdw"`
- **Author Handle**: `...authorText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl` -> Value: `"/@dr-Jonas-Birch"`
- **Alternate Author ID (Endpoint)**: `...authorEndpoint.browseEndpoint.browseId`
- **Author URL**: `...authorText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url` -> Value: `"/@dr-Jonas-Birch"`
- **Author Thumbnail (Logo)**: `...authorThumbnail.thumbnails[0].url` -> Value: `"//yt3.googleusercontent.com/..."`
- **Fallback Author ID**: `...authorEndpoint.browseEndpoint.browseId` -> Value: `"UC6Q8NDGqQ2eJ7QXX693ikdw"`


**Content & Engagement**:
- **Post Text Content**: `...contentText.runs[0].text` -> Value: `"Watch for free\n\nDid you know..."`
- **Attached Image**: `...backstageAttachment.backstageImageRenderer.image.thumbnails[0].url` -> Value: `"https://yt3.ggpht.com/..."`
- **Published Time Text**: `...publishedTimeText.runs[0].text` -> Value: `"1 month ago"`
- **Published Endpoint**: `...publishedTimeText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl` -> Value: `"/post/UgkxSvWRZtiCPAdVhqpAt7PCYPZ7c-Sf-gzx"`
- **Vote Count**: `...voteCount.runs[0].text` -> Value: `"562"`
- **Comment Count**: `...actionButtons.commentActionButtonsRenderer.replyButton.buttonRenderer.text.runs[0].text` -> Value: `"37"`

### `sharedPostRenderer`
**Base Path**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].sharedPostRenderer`

- **Shared Post ID**: `...postId`
- **Sharer Channel ID**: `...endpoint.browseEndpoint.browseId`
- **Sharer Name**: `...displayName.runs[0].text`
- **Original Post Content**: (Nest into `...originalPost.postRenderer` or `...originalPost.backstagePostRenderer` and follow paths above)


{
    "richSectionRenderer": {
        "content": {
            "backstagePostThreadRenderer": {
                "post": {
                    "backstagePostRenderer": {
                        "postId": "UgkxSvWRZtiCPAdVhqpAt7PCYPZ7c-Sf-gzx",
                        "authorText": {
                            "runs": [
                                {
                                    "text": "dr Jonas Birch",
                                    "navigationEndpoint": {
                                        "clickTrackingParams": "CDUQ9LwCIhMI9N2xnqD_kgMVw4NWAR2lYiL_ygEEu41HgA==",
                                        "commandMetadata": {
                                            "webCommandMetadata": {
                                                "url": "/@dr-Jonas-Birch",
                                                "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                                "rootVe": 3611,
                                                "apiUrl": "/youtubei/v1/browse"
                                            }
                                        },
                                        "browseEndpoint": {
                                            "browseId": "UC6Q8NDGqQ2eJ7QXX693ikdw",
                                            "canonicalBaseUrl": "/@dr-Jonas-Birch"
                                        }
                                    }
                                }
                            ],
                            "accessibility": {
                                "accessibilityData": {
                                    "label": "dr Jonas Birch"
                                }
                            }
                        },
                        "authorThumbnail": {
                            "thumbnails": [
                                {
                                    "url": "//yt3.googleusercontent.com/4_Szk3f070zqaSZsakx_aG7NcUjuJzvyZdanX1VF4iNkDTBWFgBxTgKaIrDCG7cJdKZ_0FapFw=s32-c-k-c0x00ffffff-no-rj-mo",
                                    "width": 32,
                                    "height": 32
                                },
                                {
                                    "url": "//yt3.googleusercontent.com/4_Szk3f070zqaSZsakx_aG7NcUjuJzvyZdanX1VF4iNkDTBWFgBxTgKaIrDCG7cJdKZ_0FapFw=s48-c-k-c0x00ffffff-no-rj-mo",
                                    "width": 48,
                                    "height": 48
                                },
                                {
                                    "url": "//yt3.googleusercontent.com/4_Szk3f070zqaSZsakx_aG7NcUjuJzvyZdanX1VF4iNkDTBWFgBxTgKaIrDCG7cJdKZ_0FapFw=s76-c-k-c0x00ffffff-no-rj-mo",
                                    "width": 76,
                                    "height": 76
                                }
                            ],
                            "accessibility": {
                                "accessibilityData": {
                                    "label": "dr Jonas Birch"
                                }
                            }
                        },
                        "authorEndpoint": {
                            "clickTrackingParams": "CDUQ9LwCIhMI9N2xnqD_kgMVw4NWAR2lYiL_ygEEu41HgA==",
                            "commandMetadata": {
                                "webCommandMetadata": {
                                    "url": "/@dr-Jonas-Birch",
                                    "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                    "rootVe": 3611,
                                    "apiUrl": "/youtubei/v1/browse"
                                }
                            },
                            "browseEndpoint": {
                                "browseId": "UC6Q8NDGqQ2eJ7QXX693ikdw",
                                "canonicalBaseUrl": "/@dr-Jonas-Birch"
                            }
                        },
                        "contentText": {
                            "runs": [
                                {
                                    "text": "Watch for free\n\nDid you know that my most popular cybersecurity course (about firewalls and network security) is now available for free for everyone with Udemy for Business as well as personal plan? I can't link, but search for the course title. JB"
                                }
                            ]
                        },
                        "backstageAttachment": {
                            "backstageImageRenderer": {
                                "image": {
                                    "thumbnails": [
                                        {
                                            "url": "https://yt3.ggpht.com/Tu0IlYbEvLUj-GlqkxX8GI-JJ-mD2OIYqIY20-Q1IXJq6QCPI_N6qVXsAj7jfNfFjpazYuSVFnAgWA=s1600-rw-nd-v1",
                                            "width": 1600,
                                            "height": 900
                                        }
                                    ]
                                },
                                "trackingParams": "CD4Q2rgBIhMI9N2xnqD_kgMVw4NWAR2lYiL_"
                            }
                        },
                        "expandButton": {
                            "buttonRenderer": {
                                "style": "STYLE_TEXT",
                                "size": "SIZE_DEFAULT",
                                "text": {
                                    "runs": [
                                        {
                                            "text": "Read more"
                                        }
                                    ],
                                    "accessibility": {
                                        "accessibilityData": {
                                            "label": "Read more"
                                        }
                                    }
                                },
                                "accessibility": {
                                    "label": "Read more"
                                },
                                "trackingParams": "CD0Qr9gCIhMI9N2xnqD_kgMVw4NWAR2lYiL_"
                            }
                        },
                        "collapseButton": {
                            "buttonRenderer": {
                                "style": "STYLE_TEXT",
                                "size": "SIZE_DEFAULT",
                                "text": {
                                    "runs": [
                                        {
                                            "text": "Show less"
                                        }
                                    ],
                                    "accessibility": {
                                        "accessibilityData": {
                                            "label": "Show less"
                                        }
                                    }
                                },
                                "accessibility": {
                                    "label": "Show less"
                                },
                                "trackingParams": "CDwQsNgCIhMI9N2xnqD_kgMVw4NWAR2lYiL_"
                            }
                        },
                        "publishedTimeText": {
                            "runs": [
                                {
                                    "text": "1 month ago",
                                    "navigationEndpoint": {
                                        "clickTrackingParams": "CDUQ9LwCIhMI9N2xnqD_kgMVw4NWAR2lYiL_ygEEu41HgA==",
                                        "commandMetadata": {
                                            "webCommandMetadata": {
                                                "url": "/post/UgkxSvWRZtiCPAdVhqpAt7PCYPZ7c-Sf-gzx",
                                                "webPageType": "WEB_PAGE_TYPE_BROWSE",
                                                "rootVe": 247244,
                                                "apiUrl": "/youtubei/v1/browse"
                                            }
                                        },
                                        "browseEndpoint": {
                                            "browseId": "FEpost_detail",
                                            "params": "wgNaEhhVQzZROE5ER3FRMmVKN1FYWDY5M2lrZHcaJFVna3hTdldSWnRpQ1BBZFZocXBBdDdQQ1lQWjdjLVNmLWd6eFoYVUM2UThOREdxUTJlSjdRWFg2OTNpa2R3",
                                            "canonicalBaseUrl": "/post/UgkxSvWRZtiCPAdVhqpAt7PCYPZ7c-Sf-gzx"
                                        }
                                    }
                                }
                            ]
                        },
                        "voteCount": {
                            "runs": [
                                {
                                    "text": "562"
                                }
                            ],
                            "accessibility": {
                                "accessibilityData": {
                                    "label": "562 likes"
                                }
                            }
                        },
                        "voteStatus": "INDIFFERENT",
                        "actionButtons": {
                            "commentActionButtonsRenderer": {
                                "likeButton": {
                                    "toggleButtonRenderer": {
                                        "style": {
                                            "styleType": "STYLE_TEXT"
                                        },
                                        "size": {
                                            "sizeType": "SIZE_DEFAULT"
                                        },
                                        "isToggled": false,
                                        "isDisabled": false,
                                        "defaultIcon": {
                                            "iconType": "LIKE"
                                        },
                                        "defaultServiceEndpoint": {
                                            "clickTrackingParams": "CDsQmE0iEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                            "commandMetadata": {
                                                "webCommandMetadata": {
                                                    "sendPost": true,
                                                    "apiUrl": "/youtubei/v1/comment/perform_comment_action"
                                                }
                                            },
                                            "performCommentActionEndpoint": {
                                                "action": "CAUaJFVna3hTdldSWnRpQ1BBZFZocXBBdDdQQ1lQWjdjLVNmLWd6eDgAWhhVQzZROE5ER3FRMmVKN1FYWDY5M2lrZHc%3D",
                                                "clientActions": [
                                                    {
                                                        "clickTrackingParams": "CDsQmE0iEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                                        "updateCommentVoteAction": {
                                                            "voteCount": {
                                                                "runs": [
                                                                    {
                                                                        "text": "563"
                                                                    }
                                                                ],
                                                                "accessibility": {
                                                                    "accessibilityData": {
                                                                        "label": "563 likes"
                                                                    }
                                                                }
                                                            },
                                                            "voteStatus": "LIKE",
                                                            "postId": "UgkxSvWRZtiCPAdVhqpAt7PCYPZ7c-Sf-gzx"
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        "toggledServiceEndpoint": {
                                            "clickTrackingParams": "CDsQmE0iEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                            "commandMetadata": {
                                                "webCommandMetadata": {
                                                    "sendPost": true,
                                                    "apiUrl": "/youtubei/v1/comment/perform_comment_action"
                                                }
                                            },
                                            "performCommentActionEndpoint": {
                                                "action": "CAUaJFVna3hTdldSWnRpQ1BBZFZocXBBdDdQQ1lQWjdjLVNmLWd6eDgBWhhVQzZROE5ER3FRMmVKN1FYWDY5M2lrZHc%3D",
                                                "clientActions": [
                                                    {
                                                        "clickTrackingParams": "CDsQmE0iEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                                        "updateCommentVoteAction": {
                                                            "voteCount": {
                                                                "runs": [
                                                                    {
                                                                        "text": "562"
                                                                    }
                                                                ],
                                                                "accessibility": {
                                                                    "accessibilityData": {
                                                                        "label": "562 likes"
                                                                    }
                                                                }
                                                            },
                                                            "voteStatus": "INDIFFERENT",
                                                            "postId": "UgkxSvWRZtiCPAdVhqpAt7PCYPZ7c-Sf-gzx"
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        "accessibility": {
                                            "label": "Like this post along with 562 other people"
                                        },
                                        "trackingParams": "CDsQmE0iEwj03bGeoP-SAxXDg1YBHaViIv8=",
                                        "defaultTooltip": "Like",
                                        "toggledTooltip": "Unlike",
                                        "toggledStyle": {
                                            "styleType": "STYLE_DEFAULT_ACTIVE"
                                        },
                                        "accessibilityData": {
                                            "accessibilityData": {
                                                "label": "Like this post along with 562 other people"
                                            }
                                        },
                                        "toggledAccessibilityData": {
                                            "accessibilityData": {
                                                "label": "Unlike"
                                            }
                                        }
                                    }
                                },
                                "replyButton": {
                                    "buttonRenderer": {
                                        "style": "STYLE_COUNT",
                                        "size": "SIZE_DEFAULT",
                                        "text": {
                                            "runs": [
                                                {
                                                    "text": "37"
                                                }
                                            ],
                                            "accessibility": {
                                                "accessibilityData": {
                                                    "label": "37 comments"
                                                }
                                            }
                                        },
                                        "icon": {
                                            "iconType": "COMMENT"
                                        },
                                        "navigationEndpoint": {
                                            "clickTrackingParams": "CDoQ6PAJIhMI9N2xnqD_kgMVw4NWAR2lYiL_ygEEu41HgA==",
                                            "commandMetadata": {
                                                "webCommandMetadata": {
                                                    "url": "/post/UgkxSvWRZtiCPAdVhqpAt7PCYPZ7c-Sf-gzx",
                                                    "webPageType": "WEB_PAGE_TYPE_BROWSE",
                                                    "rootVe": 247244,
                                                    "apiUrl": "/youtubei/v1/browse"
                                                }
                                            },
                                            "browseEndpoint": {
                                                "browseId": "FEpost_detail",
                                                "params": "wgNaEhhVQzZROE5ER3FRMmVKN1FYWDY5M2lrZHcaJFVna3hTdldSWnRpQ1BBZFZocXBBdDdQQ1lQWjdjLVNmLWd6eFoYVUM2UThOREdxUTJlSjdRWFg2OTNpa2R3",
                                                "canonicalBaseUrl": "/post/UgkxSvWRZtiCPAdVhqpAt7PCYPZ7c-Sf-gzx"
                                            }
                                        },
                                        "accessibility": {
                                            "label": "37 comments"
                                        },
                                        "tooltip": "Comment",
                                        "trackingParams": "CDoQ6PAJIhMI9N2xnqD_kgMVw4NWAR2lYiL_",
                                        "accessibilityData": {
                                            "accessibilityData": {
                                                "label": "37 comments"
                                            }
                                        }
                                    }
                                },
                                "dislikeButton": {
                                    "toggleButtonRenderer": {
                                        "style": {
                                            "styleType": "STYLE_TEXT"
                                        },
                                        "size": {
                                            "sizeType": "SIZE_DEFAULT"
                                        },
                                        "isToggled": false,
                                        "isDisabled": false,
                                        "defaultIcon": {
                                            "iconType": "DISLIKE"
                                        },
                                        "defaultServiceEndpoint": {
                                            "clickTrackingParams": "CDkQmE0iEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                            "commandMetadata": {
                                                "webCommandMetadata": {
                                                    "sendPost": true,
                                                    "apiUrl": "/youtubei/v1/comment/perform_comment_action"
                                                }
                                            },
                                            "performCommentActionEndpoint": {
                                                "action": "CAQaJFVna3hTdldSWnRpQ1BBZFZocXBBdDdQQ1lQWjdjLVNmLWd6eDgAWhhVQzZROE5ER3FRMmVKN1FYWDY5M2lrZHc%3D",
                                                "clientActions": [
                                                    {
                                                        "clickTrackingParams": "CDkQmE0iEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                                        "updateCommentVoteAction": {
                                                            "voteCount": {
                                                                "runs": [
                                                                    {
                                                                        "text": "562"
                                                                    }
                                                                ],
                                                                "accessibility": {
                                                                    "accessibilityData": {
                                                                        "label": "562 likes"
                                                                    }
                                                                }
                                                            },
                                                            "voteStatus": "DISLIKE",
                                                            "postId": "UgkxSvWRZtiCPAdVhqpAt7PCYPZ7c-Sf-gzx"
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        "toggledServiceEndpoint": {
                                            "clickTrackingParams": "CDkQmE0iEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                            "commandMetadata": {
                                                "webCommandMetadata": {
                                                    "sendPost": true,
                                                    "apiUrl": "/youtubei/v1/comment/perform_comment_action"
                                                }
                                            },
                                            "performCommentActionEndpoint": {
                                                "action": "CAQaJFVna3hTdldSWnRpQ1BBZFZocXBBdDdQQ1lQWjdjLVNmLWd6eDgBWhhVQzZROE5ER3FRMmVKN1FYWDY5M2lrZHc%3D",
                                                "clientActions": [
                                                    {
                                                        "clickTrackingParams": "CDkQmE0iEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                                        "updateCommentVoteAction": {
                                                            "voteCount": {
                                                                "runs": [
                                                                    {
                                                                        "text": "562"
                                                                    }
                                                                ],
                                                                "accessibility": {
                                                                    "accessibilityData": {
                                                                        "label": "562 likes"
                                                                    }
                                                                }
                                                            },
                                                            "voteStatus": "INDIFFERENT",
                                                            "postId": "UgkxSvWRZtiCPAdVhqpAt7PCYPZ7c-Sf-gzx"
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        "accessibility": {
                                            "label": "Dislike this post"
                                        },
                                        "trackingParams": "CDkQmE0iEwj03bGeoP-SAxXDg1YBHaViIv8=",
                                        "defaultTooltip": "Dislike",
                                        "toggledTooltip": "Remove dislike",
                                        "toggledStyle": {
                                            "styleType": "STYLE_DEFAULT_ACTIVE"
                                        },
                                        "accessibilityData": {
                                            "accessibilityData": {
                                                "label": "Dislike this post"
                                            }
                                        },
                                        "toggledAccessibilityData": {
                                            "accessibilityData": {
                                                "label": "Remove dislike"
                                            }
                                        }
                                    }
                                },
                                "trackingParams": "CDgQtXUiEwj03bGeoP-SAxXDg1YBHaViIv8="
                            }
                        },
                        "actionMenu": {
                            "menuRenderer": {
                                "items": [
                                    {
                                        "menuServiceItemRenderer": {
                                            "text": {
                                                "runs": [
                                                    {
                                                        "text": "Report"
                                                    }
                                                ],
                                                "accessibility": {
                                                    "accessibilityData": {
                                                        "label": "Report"
                                                    }
                                                }
                                            },
                                            "icon": {
                                                "iconType": "FLAG"
                                            },
                                            "serviceEndpoint": {
                                                "clickTrackingParams": "CDUQ9LwCIhMI9N2xnqD_kgMVw4NWAR2lYiL_ygEEu41HgA==",
                                                "showEngagementPanelEndpoint": {
                                                    "identifier": {
                                                        "tag": "PAabuse_report"
                                                    },
                                                    "globalConfiguration": {
                                                        "initialState": {
                                                            "engagementPanelSectionListRenderer": {
                                                                "header": {
                                                                    "engagementPanelTitleHeaderRenderer": {
                                                                        "visibilityButton": {
                                                                            "buttonRenderer": {
                                                                                "icon": {
                                                                                    "iconType": "CLOSE"
                                                                                },
                                                                                "accessibility": {
                                                                                    "label": "Close"
                                                                                },
                                                                                "trackingParams": "CDcQ8FsiEwj03bGeoP-SAxXDg1YBHaViIv8=",
                                                                                "accessibilityData": {
                                                                                    "accessibilityData": {
                                                                                        "label": "Close"
                                                                                    }
                                                                                },
                                                                                "command": {
                                                                                    "clickTrackingParams": "CDcQ8FsiEwj03bGeoP-SAxXDg1YBHaViIv_KAQS7jUeA",
                                                                                    "changeEngagementPanelVisibilityAction": {
                                                                                        "targetId": "PAabuse_report",
                                                                                        "visibility": "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"
                                                                                    }
                                                                                }
                                                                            }
                                                                        },
                                                                        "trackingParams": "CDYQ040EIhMI9N2xnqD_kgMVw4NWAR2lYiL_"
                                                                    }
                                                                },
                                                                "content": {
                                                                    "contentLoadingRenderer": {
                                                                        "useSpinner": true
                                                                    }
                                                                },
                                                                "visibility": "ENGAGEMENT_PANEL_VISIBILITY_FULL_BLEED",
                                                                "resizability": "ENGAGEMENT_PANEL_RESIZABILITY_SNAP",
                                                                "identifier": {
                                                                    "tag": "PAabuse_report"
                                                                },
                                                                "allowedSnapStates": [
                                                                    "ENGAGEMENT_PANEL_SNAP_STATE_FULL_BLEED"
                                                                ]
                                                            }
                                                        },
                                                        "params": "qgeHBQgDEiRVZ2t4U3ZXUlp0aUNQQWRWaHFwQXQ3UENZUFo3Yy1TZi1nenga3ARHaVJWWjJ0NFUzWlhVbHAwYVVOUVFXUldhSEZ3UVhRM1VFTlpVRm8zWXkxVFppMW5lbmdvQWpwRUNBRVFCQm9rVldkcmVGTjJWMUphZEdsRFVFRmtWbWh4Y0VGME4xQkRXVkJhTjJNdFUyWXRaM3A0V2hoVlF6WlJPRTVFUjNGUk1tVktOMUZZV0RZNU0ybHJaSGRLMGdJSUFoSkVDQUVRQkJva1ZXZHJlRk4yVjFKYWRHbERVRUZrVm1oeGNFRjBOMUJEV1ZCYU4yTXRVMll0WjNwNFdoaFZRelpST0U1RVIzRlJNbVZLTjFGWVdEWTVNMmxyWkhjYS13RVMtQUZYWVhSamFDQm1iM0lnWm5KbFpRb0tSR2xrSUhsdmRTQnJibTkzSUhSb1lYUWdiWGtnYlc5emRDQndiM0IxYkdGeUlHTjVZbVZ5YzJWamRYSnBkSGtnWTI5MWNuTmxJQ2hoWW05MWRDQm1hWEpsZDJGc2JITWdZVzVrSUc1bGRIZHZjbXNnYzJWamRYSnBkSGtwSUdseklHNXZkeUJoZG1GcGJHRmliR1VnWm05eUlHWnlaV1VnWm05eUlHVjJaWEo1YjI1bElIZHBkR2dnVldSbGJYa2dabTl5SUVKMWMybHVaWE56SUdGeklIZGxiR3dnWVhNZ2NHVnljMjl1WVd3Z2NHeGhiajhnU1NCallXNG5kQ0JzYVc1ckxDQmlkWFFnYzJWaGNtTm9JR1p2Y2lCMGFHVWdZMjkxY25ObElIUnBkR3hsTGlCS1FqSUtDQU1xQmdqWW9mUExCbmdD"
                                                    }
                                                }
                                            },
                                            "trackingParams": "CDUQ9LwCIhMI9N2xnqD_kgMVw4NWAR2lYiL_"
                                        }
                                    }
                                ],
                                "trackingParams": "CDUQ9LwCIhMI9N2xnqD_kgMVw4NWAR2lYiL_",
                                "accessibility": {
                                    "accessibilityData": {
                                        "label": "Action menu"
                                    }
                                }
                            }
                        },
                        "trackingParams": "CDUQ9LwCIhMI9N2xnqD_kgMVw4NWAR2lYiL_",
                        "truncationText": {
                            "content": "...Read more"
                        },
                        "maxLines": 2,
                        "loggingDirectives": {
                            "trackingParams": "CDUQ9LwCIhMI9N2xnqD_kgMVw4NWAR2lYiL_",
                            "visibility": {
                                "types": "12"
                            }
                        }
                    }
                },
                "trackingParams": "CDQQzL8CIhMI9N2xnqD_kgMVw4NWAR2lYiL_",
                "useUpdatedRepostUi": false,
                "loggingDirectives": {
                    "trackingParams": "CDQQzL8CIhMI9N2xnqD_kgMVw4NWAR2lYiL_",
                    "visibility": {
                        "types": "12"
                    }
                }
            }
        },
        "trackingParams": "CDMQ45cFGAMiEwj03bGeoP-SAxXDg1YBHaViIv8="
    }
}

---

# Absolute JSON Trace: Comments (`commentThreadRenderer`)
*File: `next?prettyPrint=false`, Watch Page Comments XHR*

When scrolling down the Watch Page, comments are loaded via XHR continuation commands.

**Base Path**: `onResponseReceivedEndpoints[i].reloadContinuationItemsCommand.continuationItems[i].commentThreadRenderer`
*(Or `appendContinuationItemsAction` depending on the exact load state).*

**Thread Components**:
A comment thread consists of a top-level `comment.commentRenderer` and optionally nested `replies.commentRepliesRenderer`.

### `commentRenderer` (Individual Comment)
**Base Path**: `...commentThreadRenderer.comment.commentRenderer`

**Author Identity**:
- **Author Handle / Name**: `...authorText.runs[0].text` -> Value: `"@sayee3"`
- **Author Channel ID**: `...authorEndpoint.browseEndpoint.browseId` -> Value: `"UCPDrAc59YiFEBOO3ICqS71g"`
- **Author Handle URL**: `...authorEndpoint.commandMetadata.webCommandMetadata.url` -> Value: `"/@sayee3"`
- **Author Logo**: `...authorThumbnail.thumbnails[0].url`
- **Is Channel Owner?**: `...authorIsChannelOwner` -> Value: `false`

**Content & Engagement**:
- **Comment Text**: `...contentText.runs[0].text` -> Value: `"Thanks. I can only dream of MIT..."`
- **Published Time**: `...publishedTimeText.runs[0].text` -> Value: `"6 years ago"`
- **Like Count**: `...voteCount.runs[0].text` -> Value: `"4.1K"`
- **Reply Count (Numeric)**: `...replyCount` -> Value: `131`
- **Reply Count (Text)**: `...repliesCount.runs[0].text` -> Value: `"131 replies"`
- **Comment ID**: `...commentId` -> Value: `"Ugw8Xj9pyuwXT1xJZQd4AaABAg"`

**Action Menu**:
- **Report Token Path**: `...actionMenu.menuRenderer.items[]` -> Look for `menuServiceItemRenderer` with `iconType`: `"REPORT_PROBLEM"` -> Extract from `...serviceEndpoint.showEngagementPanelEndpoint...`

**DOM Identifiers (Mobile Web Comments)**:
- **Host Element**: `<ytm-comment-thread-renderer>` (Contains the whole thread)
- **Individual Comment Element**: `<ytm-comment-renderer>`
- **Author Identity Check**: `<span class="YtmCommentRendererTitle">` (Contains the handle/name)
- **Comment Text**: `<p class="YtmCommentRendererText">`
- **Avatar Link Target**: `<a class="YtmCommentRendererIconContainer" href="/@handle">`



{
    "responseContext": {
        "serviceTrackingParams": [
            {
                "service": "CSI",
                "params": [
                    {
                        "key": "c",
                        "value": "MWEB"
                    },
                    {
                        "key": "cver",
                        "value": "2.20260226.11.00"
                    },
                    {
                        "key": "yt_li",
                        "value": "1"
                    },
                    {
                        "key": "GetWatchMwebTopLevelComments_rid",
                        "value": "0x6d3db35e079573d5"
                    }
                ]
            },
            {
                "service": "GFEEDBACK",
                "params": [
                    {
                        "key": "logged_in",
                        "value": "1"
                    }
                ]
            },
            {
                "service": "ECATCHER",
                "params": [
                    {
                        "key": "client.version",
                        "value": "2.20260226"
                    },
                    {
                        "key": "client.name",
                        "value": "MWEB"
                    }
                ]
            }
        ],
        "webResponseContextExtensionData": {
            "webResponseContextPreloadData": {
                "preloadMessageNames": [
                    "commentsHeaderRenderer",
                    "commentSimpleboxRenderer",
                    "commentDialogRenderer",
                    "buttonRenderer",
                    "commentThreadRenderer",
                    "commentRenderer",
                    "menuRenderer",
                    "menuNavigationItemRenderer",
                    "commentReplyDialogRenderer",
                    "toggleMenuServiceItemRenderer",
                    "menuServiceItemRenderer",
                    "engagementPanelSectionListRenderer",
                    "engagementPanelTitleHeaderRenderer",
                    "contentLoadingRenderer",
                    "commentRepliesRenderer",
                    "continuationItemRenderer",
                    "creatorHeartRenderer"
                ]
            },
            "hasDecorated": true
        }
    },
    "trackingParams": "CAAQg2ciEwiu_6zjtP-SAxVVpawCHZHrKGSCARwIHxC7LxgAIhMIuO_ftbH_kgMVY6RmAh2XNiGG",
    "onResponseReceivedEndpoints": [
        {
            "clickTrackingParams": "CAAQg2ciEwiu_6zjtP-SAxVVpawCHZHrKGTKAQS7jUeA",
            "reloadContinuationItemsCommand": {
                "targetId": "engagement-panel-comments-section",
                "continuationItems": [
                    {
                        "commentsHeaderRenderer": {
                            "createRenderer": {
                                "commentSimpleboxRenderer": {
                                    "authorThumbnail": {
                                        "thumbnails": [
                                            {
                                                "url": "https://yt3.ggpht.com/yti/ANjgQV9xn7Xw0BTUw9acpPYp8jgaNmv7AKH9mLoy4mI1ACpK2hwB=s48-c-k-c0x00ffffff-no-rj",
                                                "width": 48,
                                                "height": 48
                                            },
                                            {
                                                "url": "https://yt3.ggpht.com/yti/ANjgQV9xn7Xw0BTUw9acpPYp8jgaNmv7AKH9mLoy4mI1ACpK2hwB=s88-c-k-c0x00ffffff-no-rj",
                                                "width": 88,
                                                "height": 88
                                            },
                                            {
                                                "url": "https://yt3.ggpht.com/yti/ANjgQV9xn7Xw0BTUw9acpPYp8jgaNmv7AKH9mLoy4mI1ACpK2hwB=s176-c-k-c0x00ffffff-no-rj",
                                                "width": 176,
                                                "height": 176
                                            }
                                        ],
                                        "accessibility": {
                                            "accessibilityData": {
                                                "label": "Devansh Varshney"
                                            }
                                        }
                                    },
                                    "placeholderText": {
                                        "runs": [
                                            {
                                                "text": "Add a comment…"
                                            }
                                        ]
                                    },
                                    "trackingParams": "CMwBEMF1IhMIrv-s47T_kgMVVaWsAh2R6yhk",
                                    "avatarSize": "SIMPLEBOX_AVATAR_SIZE_TYPE_DEFAULT",
                                    "navigationEndpoint": {
                                        "clickTrackingParams": "CMwBEMF1IhMIrv-s47T_kgMVVaWsAh2R6yhkygEEu41HgA==",
                                        "createCommentDialogEndpoint": {
                                            "dialog": {
                                                "commentDialogRenderer": {
                                                    "authorThumbnail": {
                                                        "thumbnails": [
                                                            {
                                                                "url": "https://yt3.ggpht.com/yti/ANjgQV9xn7Xw0BTUw9acpPYp8jgaNmv7AKH9mLoy4mI1ACpK2hwB=s48-c-k-c0x00ffffff-no-rj",
                                                                "width": 48,
                                                                "height": 48
                                                            },
                                                            {
                                                                "url": "https://yt3.ggpht.com/yti/ANjgQV9xn7Xw0BTUw9acpPYp8jgaNmv7AKH9mLoy4mI1ACpK2hwB=s88-c-k-c0x00ffffff-no-rj",
                                                                "width": 88,
                                                                "height": 88
                                                            },
                                                            {
                                                                "url": "https://yt3.ggpht.com/yti/ANjgQV9xn7Xw0BTUw9acpPYp8jgaNmv7AKH9mLoy4mI1ACpK2hwB=s176-c-k-c0x00ffffff-no-rj",
                                                                "width": 176,
                                                                "height": 176
                                                            }
                                                        ],
                                                        "accessibility": {
                                                            "accessibilityData": {
                                                                "label": "Devansh Varshney"
                                                            }
                                                        }
                                                    },
                                                    "submitButton": {
                                                        "buttonRenderer": {
                                                            "text": {
                                                                "runs": [
                                                                    {
                                                                        "text": "Comment"
                                                                    }
                                                                ]
                                                            },
                                                            "serviceEndpoint": {
                                                                "clickTrackingParams": "CM4BEPBbIhMIrv-s47T_kgMVVaWsAh2R6yhkygEEu41HgA==",
                                                                "commandMetadata": {
                                                                    "webCommandMetadata": {
                                                                        "sendPost": true,
                                                                        "apiUrl": "/youtubei/v1/comment/create_comment"
                                                                    }
                                                                },
                                                                "createCommentEndpoint": {
                                                                    "createCommentParams": "EgtueWtPZVdnUWNITSoCCABQB-gCAQ%3D%3D"
                                                                }
                                                            },
                                                            "trackingParams": "CM4BEPBbIhMIrv-s47T_kgMVVaWsAh2R6yhk"
                                                        }
                                                    },
                                                    "cancelButton": {
                                                        "buttonRenderer": {
                                                            "text": {
                                                                "runs": [
                                                                    {
                                                                        "text": "Cancel"
                                                                    }
                                                                ]
                                                            },
                                                            "trackingParams": "CM0BEPBbIhMIrv-s47T_kgMVVaWsAh2R6yhk"
                                                        }
                                                    },
                                                    "placeholderText": {
                                                        "runs": [
                                                            {
                                                                "text": "Add a comment…"
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "aadcGuidelinesStateEntityKey": "Egs5ODU4ODEyMDUxMiCZAigB",
                                    "disabledText": "Comments are turned off.",
                                    "disabledTextUrl": "https://support.google.com/youtube/answer/9706180"
                                }
                            },
                            "trackingParams": "CMsBEO6YARgXIhMIrv-s47T_kgMVVaWsAh2R6yhk"
                        }
                    }
                ],
                "slot": "RELOAD_CONTINUATION_SLOT_HEADER"
            }
        },
        {
            "clickTrackingParams": "CAAQg2ciEwiu_6zjtP-SAxVVpawCHZHrKGTKAQS7jUeA",
            "reloadContinuationItemsCommand": {
                "targetId": "engagement-panel-comments-section",
                "continuationItems": [
                    {
                        "commentThreadRenderer": {
                            "comment": {
                                "commentRenderer": {
                                    "authorText": {
                                        "runs": [
                                            {
                                                "text": "@sayee3"
                                            }
                                        ]
                                    },
                                    "authorThumbnail": {
                                        "thumbnails": [
                                            {
                                                "url": "https://yt3.ggpht.com/szuW2FpZcC2sGKn2F7a_-4gzSeMbbOLwbekPiClt8eB6NJbq0COP5wu9Y5I_g4K7JlIz0c6pMQ=s48-c-k-c0x00ffffff-no-rj",
                                                "width": 48,
                                                "height": 48
                                            },
                                            {
                                                "url": "https://yt3.ggpht.com/szuW2FpZcC2sGKn2F7a_-4gzSeMbbOLwbekPiClt8eB6NJbq0COP5wu9Y5I_g4K7JlIz0c6pMQ=s88-c-k-c0x00ffffff-no-rj",
                                                "width": 88,
                                                "height": 88
                                            },
                                            {
                                                "url": "https://yt3.ggpht.com/szuW2FpZcC2sGKn2F7a_-4gzSeMbbOLwbekPiClt8eB6NJbq0COP5wu9Y5I_g4K7JlIz0c6pMQ=s176-c-k-c0x00ffffff-no-rj",
                                                "width": 176,
                                                "height": 176
                                            }
                                        ],
                                        "accessibility": {
                                            "accessibilityData": {
                                                "label": "@sayee3"
                                            }
                                        }
                                    },
                                    "authorEndpoint": {
                                        "clickTrackingParams": "CMMBELZ1IhMIrv-s47T_kgMVVaWsAh2R6yhkygEEu41HgA==",
                                        "commandMetadata": {
                                            "webCommandMetadata": {
                                                "url": "/@sayee3",
                                                "webPageType": "WEB_PAGE_TYPE_CHANNEL",
                                                "rootVe": 3611,
                                                "apiUrl": "/youtubei/v1/browse"
                                            }
                                        },
                                        "browseEndpoint": {
                                            "browseId": "UCPDrAc59YiFEBOO3ICqS71g",
                                            "canonicalBaseUrl": "/@sayee3"
                                        }
                                    },
                                    "contentText": {
                                        "runs": [
                                            {
                                                "text": "Thanks. I can only dream of MIT but thanks to their free opencourseware, I am able to attend lectures and learn Python, from a village in India. Isn't that cool?"
                                            }
                                        ]
                                    },
                                    "publishedTimeText": {
                                        "runs": [
                                            {
                                                "text": "6 years ago"
                                            }
                                        ]
                                    },
                                    "isLiked": false,
                                    "actionMenu": {
                                        "menuRenderer": {
                                            "items": [
                                                {
                                                    "menuNavigationItemRenderer": {
                                                        "text": {
                                                            "runs": [
                                                                {
                                                                    "text": "Reply"
                                                                }
                                                            ]
                                                        },
                                                        "icon": {
                                                            "iconType": "COMMENT"
                                                        },
                                                        "navigationEndpoint": {
                                                            "clickTrackingParams": "CMMBELZ1IhMIrv-s47T_kgMVVaWsAh2R6yhkygEEu41HgA==",
                                                            "commandMetadata": {
                                                                "webCommandMetadata": {
                                                                    "ignoreNavigation": true
                                                                }
                                                            },
                                                            "createCommentReplyDialogEndpoint": {
                                                                "dialog": {
                                                                    "commentReplyDialogRenderer": {
                                                                        "replyButton": {
                                                                            "buttonRenderer": {
                                                                                "style": "STYLE_PRIMARY",
                                                                                "size": "SIZE_DEFAULT",
                                                                                "text": {
                                                                                    "runs": [
                                                                                        {
                                                                                            "text": "Reply"
                                                                                        }
                                                                                    ]
                                                                                },
                                                                                "serviceEndpoint": {
                                                                                    "clickTrackingParams": "CMoBEPBbIhMIrv-s47T_kgMVVaWsAh2R6yhkygEEu41HgA==",
                                                                                    "commandMetadata": {
                                                                                        "webCommandMetadata": {
                                                                                            "sendPost": true,
                                                                                            "apiUrl": "/youtubei/v1/comment/create_comment_reply"
                                                                                        }
                                                                                    },
                                                                                    "createCommentReplyEndpoint": {
                                                                                        "createReplyParams": "EgtueWtPZVdnUWNITSIaVWd3OFhqOXB5dXdYVDF4SlpRZDRBYUFCQWcqAggAUAfoAQDaAgDoAgE%3D"
                                                                                    }
                                                                                },
                                                                                "trackingParams": "CMoBEPBbIhMIrv-s47T_kgMVVaWsAh2R6yhk"
                                                                            }
                                                                        },
                                                                        "cancelButton": {
                                                                            "buttonRenderer": {
                                                                                "text": {
                                                                                    "runs": [
                                                                                        {
                                                                                            "text": "Cancel"
                                                                                        }
                                                                                    ]
                                                                                },
                                                                                "trackingParams": "CMkBEPBbIhMIrv-s47T_kgMVVaWsAh2R6yhk"
                                                                            }
                                                                        },
                                                                        "authorThumbnail": {
                                                                            "thumbnails": [
                                                                                {
                                                                                    "url": "https://yt3.ggpht.com/yti/ANjgQV9xn7Xw0BTUw9acpPYp8jgaNmv7AKH9mLoy4mI1ACpK2hwB=s48-c-k-c0x00ffffff-no-rj",
                                                                                    "width": 48,
                                                                                    "height": 48
                                                                                },
                                                                                {
                                                                                    "url": "https://yt3.ggpht.com/yti/ANjgQV9xn7Xw0BTUw9acpPYp8jgaNmv7AKH9mLoy4mI1ACpK2hwB=s88-c-k-c0x00ffffff-no-rj",
                                                                                    "width": 88,
                                                                                    "height": 88
                                                                                },
                                                                                {
                                                                                    "url": "https://yt3.ggpht.com/yti/ANjgQV9xn7Xw0BTUw9acpPYp8jgaNmv7AKH9mLoy4mI1ACpK2hwB=s176-c-k-c0x00ffffff-no-rj",
                                                                                    "width": 176,
                                                                                    "height": 176
                                                                                }
                                                                            ],
                                                                            "accessibility": {
                                                                                "accessibilityData": {
                                                                                    "label": "Devansh Varshney"
                                                                                }
                                                                            }
                                                                        },
                                                                        "placeholderText": {
                                                                            "runs": [
                                                                                {
                                                                                    "text": "Add a reply..."
                                                                                }
                                                                            ]
                                                                        },
                                                                        "aadcGuidelinesStateEntityKey": "Egs5ODU4ODEyMDUxMiCZAigB"
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "trackingParams": "CMMBELZ1IhMIrv-s47T_kgMVVaWsAh2R6yhk"
                                                    }
                                                },
                                                {
                                                    "toggleMenuServiceItemRenderer": {
                                                        "defaultText": {
                                                            "runs": [
                                                                {
                                                                    "text": "Like"
                                                                }
                                                            ]
                                                        },
                                                        "defaultIcon": {
                                                            "iconType": "LIKE"
                                                        },
                                                        "defaultServiceEndpoint": {
                                                            "clickTrackingParams": "CMgBEPtLGAMiEwiu_6zjtP-SAxVVpawCHZHrKGTKAQS7jUeA",
                                                            "commandMetadata": {
                                                                "webCommandMetadata": {
                                                                    "sendPost": true,
                                                                    "apiUrl": "/youtubei/v1/comment/perform_comment_action"
                                                                }
                                                            },
                                                            "performCommentActionEndpoint": {
                                                                "action": "CAUQAhoaVWd3OFhqOXB5dXdYVDF4SlpRZDRBYUFCQWcqC255a09lV2dRY0hNMAA4AKgBDLoBGFVDRUJiMWJfTDZ6RFMzeFRVcklBTFpPd_ABAPgCAQ%3D%3D",
                                                                "clientActions": [
                                                                    {
                                                                        "clickTrackingParams": "CMgBEPtLGAMiEwiu_6zjtP-SAxVVpawCHZHrKGTKAQS7jUeA",
                                                                        "updateCommentVoteAction": {
                                                                            "voteCount": {
                                                                                "runs": [
                                                                                    {
                                                                                        "text": "4.1K"
                                                                                    }
                                                                                ],
                                                                                "accessibility": {
                                                                                    "accessibilityData": {
                                                                                        "label": "4.1K likes"
                                                                                    }
                                                                                }
                                                                            },
                                                                            "voteStatus": "LIKE"
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        },
                                                        "toggledText": {
                                                            "runs": [
                                                                {
                                                                    "text": "Unlike"
                                                                }
                                                            ]
                                                        },
                                                        "toggledIcon": {
                                                            "iconType": "LIKE_SELECTED"
                                                        },
                                                        "toggledServiceEndpoint": {
                                                            "clickTrackingParams": "CMgBEPtLGAMiEwiu_6zjtP-SAxVVpawCHZHrKGTKAQS7jUeA",
                                                            "commandMetadata": {
                                                                "webCommandMetadata": {
                                                                    "sendPost": true,
                                                                    "apiUrl": "/youtubei/v1/comment/perform_comment_action"
                                                                }
                                                            },
                                                            "performCommentActionEndpoint": {
                                                                "action": "CAUQAhoaVWd3OFhqOXB5dXdYVDF4SlpRZDRBYUFCQWcqC255a09lV2dRY0hNMAA4AagBDLoBGFVDRUJiMWJfTDZ6RFMzeFRVcklBTFpPd_ABAPgCAQ%3D%3D",
                                                                "clientActions": [
                                                                    {
                                                                        "clickTrackingParams": "CMgBEPtLGAMiEwiu_6zjtP-SAxVVpawCHZHrKGTKAQS7jUeA",
                                                                        "updateCommentVoteAction": {
                                                                            "voteCount": {
                                                                                "runs": [
                                                                                    {
                                                                                        "text": "4.1K"
                                                                                    }
                                                                                ],
                                                                                "accessibility": {
                                                                                    "accessibilityData": {
                                                                                        "label": "4.1K likes"
                                                                                    }
                                                                                }
                                                                            },
                                                                            "voteStatus": "INDIFFERENT"
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        },
                                                        "trackingParams": "CMgBEPtLGAMiEwiu_6zjtP-SAxVVpawCHZHrKGQ=",
                                                        "isToggled": false
                                                    }
                                                },
                                                {
                                                    "toggleMenuServiceItemRenderer": {
                                                        "defaultText": {
                                                            "runs": [
                                                                {
                                                                    "text": "Dislike"
                                                                }
                                                            ]
                                                        },
                                                        "defaultIcon": {
                                                            "iconType": "DISLIKE"
                                                        },
                                                        "defaultServiceEndpoint": {
                                                            "clickTrackingParams": "CMcBEPtLGAQiEwiu_6zjtP-SAxVVpawCHZHrKGTKAQS7jUeA",
                                                            "commandMetadata": {
                                                                "webCommandMetadata": {
                                                                    "sendPost": true,
                                                                    "apiUrl": "/youtubei/v1/comment/perform_comment_action"
                                                                }
                                                            },
                                                            "performCommentActionEndpoint": {
                                                                "action": "CAQQAhoaVWd3OFhqOXB5dXdYVDF4SlpRZDRBYUFCQWcqC255a09lV2dRY0hNMAA4AKgBDLoBGFVDRUJiMWJfTDZ6RFMzeFRVcklBTFpPd_ABAPgCAQ%3D%3D",
                                                                "clientActions": [
                                                                    {
                                                                        "clickTrackingParams": "CMcBEPtLGAQiEwiu_6zjtP-SAxVVpawCHZHrKGTKAQS7jUeA",
                                                                        "updateCommentVoteAction": {
                                                                            "voteCount": {
                                                                                "runs": [
                                                                                    {
                                                                                        "text": "4.1K"
                                                                                    }
                                                                                ],
                                                                                "accessibility": {
                                                                                    "accessibilityData": {
                                                                                        "label": "4.1K likes"
                                                                                    }
                                                                                }
                                                                            },
                                                                            "voteStatus": "DISLIKE"
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        },
                                                        "toggledText": {
                                                            "runs": [
                                                                {
                                                                    "text": "Remove dislike"
                                                                }
                                                            ]
                                                        },
                                                        "toggledIcon": {
                                                            "iconType": "DISLIKE_SELECTED"
                                                        },
                                                        "toggledServiceEndpoint": {
                                                            "clickTrackingParams": "CMcBEPtLGAQiEwiu_6zjtP-SAxVVpawCHZHrKGTKAQS7jUeA",
                                                            "commandMetadata": {
                                                                "webCommandMetadata": {
                                                                    "sendPost": true,
                                                                    "apiUrl": "/youtubei/v1/comment/perform_comment_action"
                                                                }
                                                            },
                                                            "performCommentActionEndpoint": {
                                                                "action": "CAQQAhoaVWd3OFhqOXB5dXdYVDF4SlpRZDRBYUFCQWcqC255a09lV2dRY0hNMAA4AagBDLoBGFVDRUJiMWJfTDZ6RFMzeFRVcklBTFpPd_ABAPgCAQ%3D%3D",
                                                                "clientActions": [
                                                                    {
                                                                        "clickTrackingParams": "CMcBEPtLGAQiEwiu_6zjtP-SAxVVpawCHZHrKGTKAQS7jUeA",
                                                                        "updateCommentVoteAction": {
                                                                            "voteCount": {
                                                                                "runs": [
                                                                                    {
                                                                                        "text": "4.1K"
                                                                                    }
                                                                                ],
                                                                                "accessibility": {
                                                                                    "accessibilityData": {
                                                                                        "label": "4.1K likes"
                                                                                    }
                                                                                }
                                                                            },
                                                                            "voteStatus": "INDIFFERENT"
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        },
                                                        "trackingParams": "CMcBEPtLGAQiEwiu_6zjtP-SAxVVpawCHZHrKGQ=",
                                                        "isToggled": false
                                                    }
                                                },
                                                {
                                                    "menuServiceItemRenderer": {
                                                        "text": {
                                                            "runs": [
                                                                {
                                                                    "text": "Report"
                                                                }
                                                            ]
                                                        },
                                                        "icon": {
                                                            "iconType": "REPORT_PROBLEM"
                                                        },
                                                        "serviceEndpoint": {
                                                            "clickTrackingParams": "CMMBELZ1IhMIrv-s47T_kgMVVaWsAh2R6yhkygEEu41HgA==",
                                                            "showEngagementPanelEndpoint": {
                                                                "identifier": {
                                                                    "tag": "PAabuse_report"
                                                                },
                                                                "globalConfiguration": {
                                                                    "initialState": {
                                                                        "engagementPanelSectionListRenderer": {
                                                                            "header": {
                                                                                "engagementPanelTitleHeaderRenderer": {
                                                                                    "visibilityButton": {
                                                                                        "buttonRenderer": {
                                                                                            "icon": {
                                                                                                "iconType": "CLOSE"
                                                                                            },
                                                                                            "accessibility": {
                                                                                                "label": "Close"
                                                                                            },
                                                                                            "trackingParams": "CMYBEPBbIhMIrv-s47T_kgMVVaWsAh2R6yhk",
                                                                                            "accessibilityData": {
                                                                                                "accessibilityData": {
                                                                                                    "label": "Close"
                                                                                                }
                                                                                            },
                                                                                            "command": {
                                                                                                "clickTrackingParams": "CMYBEPBbIhMIrv-s47T_kgMVVaWsAh2R6yhkygEEu41HgA==",
                                                                                                "changeEngagementPanelVisibilityAction": {
                                                                                                    "targetId": "PAabuse_report",
                                                                                                    "visibility": "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    },
                                                                                    "trackingParams": "CMUBENONBCITCK7_rOO0_5IDFVWlrAIdkesoZA=="
                                                                                }
                                                                            },
                                                                            "content": {
                                                                                "contentLoadingRenderer": {
                                                                                    "useSpinner": true
                                                                                }
                                                                            },
                                                                            "visibility": "ENGAGEMENT_PANEL_VISIBILITY_FULL_BLEED",
                                                                            "resizability": "ENGAGEMENT_PANEL_RESIZABILITY_SNAP",
                                                                            "identifier": {
                                                                                "tag": "PAabuse_report"
                                                                            },
                                                                            "allowedSnapStates": [
                                                                                "ENGAGEMENT_PANEL_SNAP_STATE_FULL_BLEED"
                                                                            ]
                                                                        }
                                                                    },
                                                                    "params": "qgfFAQgCEhpVZ3c4WGo5cHl1d1hUMXhKWlFkNEFhQUJBZxqkAUdocFZaM2M0V0dvNWNIbDFkMWhVTVhoS1dsRmtORUZoUVVKQlp5Z0NPbFlJQVJBQ0docFZaM2M0V0dvNWNIbDFkMWhVTVhoS1dsRmtORUZoUVVKQlp5b0xibmxyVDJWWFoxRmpTRTB3QUtnQkRMb0JHRlZEUlVKaU1XSmZURFo2UkZNemVGUlZja2xCVEZwUGQtQUJBUEFCQVBnQ0FRJTNEJTNE"
                                                                }
                                                            }
                                                        },
                                                        "trackingParams": "CMMBELZ1IhMIrv-s47T_kgMVVaWsAh2R6yhk"
                                                    }
                                                }
                                            ],
                                            "trackingParams": "CMMBELZ1IhMIrv-s47T_kgMVVaWsAh2R6yhk",
                                            "accessibility": {
                                                "accessibilityData": {
                                                    "label": "Action menu"
                                                }
                                            }
                                        }
                                    },
                                    "commentId": "Ugw8Xj9pyuwXT1xJZQd4AaABAg",
                                    "authorIsChannelOwner": false,
                                    "voteStatus": "INDIFFERENT",
                                    "trackingParams": "CMMBELZ1IhMIrv-s47T_kgMVVaWsAh2R6yhk",
                                    "voteCount": {
                                        "runs": [
                                            {
                                                "text": "4.1K"
                                            }
                                        ],
                                        "accessibility": {
                                            "accessibilityData": {
                                                "label": "4.1K likes"
                                            }
                                        }
                                    },
                                    "expandButton": {
                                        "buttonRenderer": {
                                            "style": "STYLE_TEXT",
                                            "size": "SIZE_DEFAULT",
                                            "text": {
                                                "runs": [
                                                    {
                                                        "text": "Read more"
                                                    }
                                                ]
                                            },
                                            "accessibility": {
                                                "label": "Read more"
                                            },
                                            "trackingParams": "CMQBEK_YAiITCK7_rOO0_5IDFVWlrAIdkesoZA=="
                                        }
                                    },
                                    "replyCount": 131,
                                    "accessibilityData": {
                                        "accessibilityData": {
                                            "label": "@sayee3. 6 years ago. Thanks. I can only dream of MIT but thanks to their free opencourseware, I am able to attend lectures and learn Python, from a village in India. Isn't that cool?. 4.1K likes. 131 replies"
                                        }
                                    },
                                    "repliesCount": {
                                        "runs": [
                                            {
                                                "text": "131 replies"
                                            }
                                        ],
                                        "accessibility": {
                                            "accessibilityData": {
                                                "label": "131 replies"
                                            }
                                        }
                                    },
                                    "hideReplyIcon": false,
                                    "loggingDirectives": {
                                        "trackingParams": "CMMBELZ1IhMIrv-s47T_kgMVVaWsAh2R6yhk",
                                        "visibility": {
                                            "types": "12"
                                        }
                                    }
                                }
                            },
                            "replies": {
                                "commentRepliesRenderer": {
                                    "contents": [
                                        {
                                            "continuationItemRenderer": {
                                                "button": {
                                                    "buttonRenderer": {
                                                        "text": {
                                                            "runs": [
                                                                {
                                                                    "text": "Show more replies"
                                                                }
                                                            ]
                                                        },
                                                        "trackingParams": "CMIBEPBbIhMIrv-s47T_kgMVVaWsAh2R6yhk",
                                                        "command": {
                                                            "clickTrackingParams": "CMIBEPBbIhMIrv-s47T_kgMVVaWsAh2R6yhkygEEu41HgA==",
                                                            "commandMetadata": {
                                                                "webCommandMetadata": {
                                                                    "sendPost": true,
                                                                    "apiUrl": "/youtubei/v1/next"
                                                                }
                                                            },
                                                            "continuationCommand": {
                                                                "token": "Eg0SC255a09lV2dRY0hNGAYygwEaUBIaVWd3OFhqOXB5dXdYVDF4SlpRZDRBYUFCQWciAggAKhhVQ0VCYjFiX0w2ekRTM3hUVXJJQUxaT3cyC255a09lV2dRY0hNQAFICoIBAggBQi9jb21tZW50LXJlcGxpZXMtaXRlbS1VZ3c4WGo5cHl1d1hUMXhKWlFkNEFhQUJBZw%3D%3D",
                                                                "request": "CONTINUATION_REQUEST_TYPE_WATCH_NEXT"
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    ],
                                    "trackingParams": "CMEBEL51IhMIrv-s47T_kgMVVaWsAh2R6yhk",
                                    "targetId": "comment-replies-item-Ugw8Xj9pyuwXT1xJZQd4AaABAg"
                                }
                            },
                            "trackingParams": "CMABEMJ1GAIiEwiu_6zjtP-SAxVVpawCHZHrKGQ=",
                            "renderingPriority": "RENDERING_PRIORITY_UNKNOWN",
                            "isModeratedElqComment": false,
                            "loggingDirectives": {
                                "trackingParams": "CMABEMJ1GAIiEwiu_6zjtP-SAxVVpawCHZHrKGQ=",
                                "visibility": {
                                    "types": "12"
                                }
                            }
                        }
                    }



COMMENT DOM -

<ytm-comment-thread-renderer class="YtmCommentThreadRendererHost item" data-filtertube-channel-handle="@sayee3" style=""><ytm-comment-renderer class="YtmCommentRendererHost" expanded="true" data-filtertube-unique-id="card-ujfmlva1x"><a href="/@sayee3" class="YtmCommentRendererIconContainer" aria-haspopup="false" aria-label="@sayee3" style=""><ytm-profile-icon class="ytProfileIconHost comment-icon"><img alt="" class="ytProfileIconImage" src="https://yt3.ggpht.com/szuW2FpZcC2sGKn2F7a_-4gzSeMbbOLwbekPiClt8eB6NJbq0COP5wu9Y5I_g4K7JlIz0c6pMQ=s48-c-k-c0x00ffffff-no-rj"></ytm-profile-icon></a><button class="YtmCommentRendererContent" aria-label="@sayee3. 6 years ago. Thanks. I can only dream of MIT but thanks to their free opencourseware, I am able to attend lectures and learn Python, from a village in India. Isn't that cool?. 4.1K likes. 131 replies"><div class="YtmCommentRendererHeader"><span class="YtmCommentRendererTitle" aria-hidden="true" dir="auto" is-owner="false"><span class="yt-core-attributed-string" role="text" style="">@sayee3</span></span><span class="YtmCommentRendererPublishedTime"><span class="yt-core-attributed-string" role="text" style="">6 years ago</span></span></div><p class="YtmCommentRendererText user-text" aria-hidden="true"><span class="yt-core-attributed-string" role="text" style="">Thanks. I can only dream of MIT but thanks to their free opencourseware, I am able to attend lectures and learn Python, from a village in India. Isn't that cool?</span></p><ytm-button-renderer class="YtmCommentRendererExpand"><button class="yt-spec-button-shape-next yt-spec-button-shape-next--text yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--align-by-text yt-spec-button-shape-next--enable-backdrop-filter-experiment" title="" aria-label="Read more"><div class="yt-spec-button-shape-next__button-text-content"><span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text" style="">Read more</span></div><yt-touch-feedback-shape aria-hidden="true" class="yt-spec-touch-feedback-shape yt-spec-touch-feedback-shape--touch-response"><div class="yt-spec-touch-feedback-shape__stroke"></div><div class="yt-spec-touch-feedback-shape__fill"></div></yt-touch-feedback-shape></button></ytm-button-renderer><div aria-hidden="true" class="YtmCommentRendererDetails secondary-text cbox"><div class="YtmCommentRendererIcons"><c3-icon class="YtmCommentRendererActionIcon" data-selected="false" fill-icon="false"><span class="yt-icon-shape ytSpecIconShapeHost"><div style="width: 100%; height: 100%; display: block; fill: currentcolor;"><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;"><path d="M9.221 1.795a1 1 0 011.109-.656l1.04.173a4 4 0 013.252 4.784L14 9h4.061a3.664 3.664 0 013.576 2.868A3.68 3.68 0 0121 14.85l.02.087A3.815 3.815 0 0120 18.5v.043l-.01.227a2.82 2.82 0 01-.135.663l-.106.282A3.754 3.754 0 0116.295 22h-3.606l-.392-.007a12.002 12.002 0 01-5.223-1.388l-.343-.189-.27-.154a2.005 2.005 0 00-.863-.26l-.13-.004H3.5a1.5 1.5 0 01-1.5-1.5V12.5A1.5 1.5 0 013.5 11h1.79l.157-.013a1 1 0 00.724-.512l.063-.145 2.987-8.535Zm-1.1 9.196A3 3 0 015.29 13H4v4.998h1.468a4 4 0 011.986.528l.27.155.285.157A10 10 0 0012.69 20h3.606c.754 0 1.424-.483 1.663-1.2l.03-.126a.819.819 0 00.012-.131v-.872l.587-.586c.388-.388.577-.927.523-1.465l-.038-.23-.02-.087-.21-.9.55-.744A1.663 1.663 0 0018.061 11H14a2.002 2.002 0 01-1.956-2.418l.623-2.904a2 2 0 00-1.626-2.392l-.21-.035-2.71 7.741Z"></path></svg></div></span></c3-icon><span class="YtmCommentRendererCount"><span class="yt-core-attributed-string" aria-label="4.1K likes" role="text" style="">4.1K</span></span></div><div class="YtmCommentRendererIcons"><c3-icon class="YtmCommentRendererActionIcon" data-selected="false" fill-icon="false"><span class="yt-icon-shape ytSpecIconShapeHost"><div style="width: 100%; height: 100%; display: block; fill: currentcolor;"><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;"><path d="m11.31 2 .392.007c1.824.06 3.61.534 5.223 1.388l.343.189.27.154c.264.152.56.24.863.26l.13.004H20.5a1.5 1.5 0 011.5 1.5V11.5a1.5 1.5 0 01-1.5 1.5h-1.79l-.158.013a1 1 0 00-.723.512l-.064.145-2.987 8.535a1 1 0 01-1.109.656l-1.04-.174a4 4 0 01-3.251-4.783L10 15H5.938a3.664 3.664 0 01-3.576-2.868A3.682 3.682 0 013 9.15l-.02-.088A3.816 3.816 0 014 5.5v-.043l.008-.227a2.86 2.86 0 01.136-.664l.107-.28A3.754 3.754 0 017.705 2h3.605ZM7.705 4c-.755 0-1.425.483-1.663 1.2l-.032.126a.818.818 0 00-.01.131v.872l-.587.586a1.816 1.816 0 00-.524 1.465l.038.23.02.087.21.9-.55.744a1.686 1.686 0 00-.321 1.18l.029.177c.17.76.844 1.302 1.623 1.302H10a2.002 2.002 0 011.956 2.419l-.623 2.904-.034.208a2.002 2.002 0 001.454 2.139l.206.045.21.035 2.708-7.741A3.001 3.001 0 0118.71 11H20V6.002h-1.47c-.696 0-1.38-.183-1.985-.528l-.27-.155-.285-.157A10.002 10.002 0 0011.31 4H7.705Z"></path></svg></div></span></c3-icon></div><div class="YtmCommentRendererIcons"><c3-icon class="YtmCommentRendererActionIcon" fill-icon="false"><span class="yt-icon-shape ytSpecIconShapeHost"><div style="width: 100%; height: 100%; display: block; fill: currentcolor;"><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;"><path d="M1 6a4 4 0 014-4h14a4 4 0 014 4v10a4 4 0 01-4 4h-4.8l-5.105 2.836A1.41 1.41 0 017 21.604V20H5a4 4 0 01-4-4V6Zm8 12v2.601l4.229-2.35.453-.251H19a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h4ZM7 8a1 1 0 000 2h10a1 1 0 100-2H7Zm-1 5a1 1 0 001 1h6a1 1 0 000-2H7a1 1 0 00-1 1Z"></path></svg></div></span></c3-icon><span class="YtmCommentRendererCount">131</span></div><button class="icon-button YtmCommentRendererMenu" aria-label="More options" aria-haspopup="true"><c3-icon fill-icon="false" style=""><span class="yt-icon-shape ytSpecIconShapeHost"><div style="width: 100%; height: 100%; display: block; fill: currentcolor;"><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;"><path d="M12 4a2 2 0 100 4 2 2 0 000-4Zm0 6a2 2 0 100 4 2 2 0 000-4Zm0 6a2 2 0 100 4 2 2 0 000-4Z"></path></svg></div></span></c3-icon></button></div></button><button type="button" class="filtertube-playlist-menu-fallback-btn filtertube-playlist-menu-fallback-btn--mobile" aria-label="FilterTube menu" data-filtertube-fallback-menu="ytm">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M12 4a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm0 6a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm0 6a2 2 0 1 0 0 4a2 2 0 0 0 0-4Z"></path>
            </svg>
        </button></ytm-comment-renderer><ytm-comment-replies-renderer><ytm-continuation-item-renderer class="YtmContinuationItemRendererHost"><ytm-button-renderer class="YtmContinuationItemRendererButton"><button class="yt-spec-button-shape-next yt-spec-button-shape-next--text yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--align-by-text yt-spec-button-shape-next--enable-backdrop-filter-experiment" title="" aria-label="Show more replies"><div class="yt-spec-button-shape-next__button-text-content"><span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text" style="">Show more replies</span></div><yt-touch-feedback-shape aria-hidden="true" class="yt-spec-touch-feedback-shape yt-spec-touch-feedback-shape--touch-response"><div class="yt-spec-touch-feedback-shape__stroke"></div><div class="yt-spec-touch-feedback-shape__fill"></div></yt-touch-feedback-shape></button></ytm-button-renderer></ytm-continuation-item-renderer></ytm-comment-replies-renderer><button type="button" class="filtertube-playlist-menu-fallback-btn filtertube-playlist-menu-fallback-btn--mobile" aria-label="FilterTube menu" data-filtertube-fallback-menu="ytm">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M12 4a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm0 6a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm0 6a2 2 0 1 0 0 4a2 2 0 0 0 0-4Z"></path>
            </svg>
        </button></ytm-comment-thread-renderer>

---

# Modern UI ViewModels (Desktop)
*File: `collab_on_homepage.html`, `collab.html`*

### `yt-badge-view-model` (Status Badges)
Used for "Auto-dubbed", "4K", "Subtitles", etc.
**DOM Structure**:
```html
<yt-badge-view-model class="ytBadgeViewModelHost">
    <badge-shape class="yt-badge-shape">
        <div class="yt-badge-shape__icon">...</div>
        <div class="yt-badge-shape__text">Auto-dubbed</div>
    </badge-shape>
</yt-badge-view-model>
```

### `yt-avatar-stack-view-model` (Collaborations)
Used to show multiple channel avatars in a single card.
**DOM Structure**:
```html
<yt-avatar-stack-view-model class="yt-avatar-stack-view-model">
    <div class="yt-avatar-stack-view-model__avatars">
        <avatar-view-model>...</avatar-view-model>
        <avatar-view-model>...</avatar-view-model>
    </div>
</yt-avatar-stack-view-model>
```
**Extraction Logic**: If this element is present, the video is a collaboration. The individual channel links and IDs are usually nested inside the `avatar-view-model` elements or in the adjacent metadata text.

### `ytm-bottom-sheet-renderer` (Custom 3-Dot Fallback Menu)
Used when the native YouTube menu is missing or stripped (e.g., in active playlist queues).

**DOM Structure (Injection Target)**:
```html
<ytm-bottom-sheet-renderer>
    <div class="bottom-sheet-media-menu-item">
        <!-- FilterTube Injects Here -->
        <div class="bottom-sheet-media-menu-item filtertube-block-channel-item" data-filtertube-channel-id="..." data-filtertube-channel-handle="...">
            <ytm-menu-service-item-renderer class="filtertube-menu-service-item">
                <ytm-menu-item>
                    <button class="menu-item-button filtertube-menu-button">
                        <c3-icon>...</c3-icon>
                        <span class="yt-core-attributed-string filtertube-menu-label">Block • @Handle</span>
                    </button>
                </ytm-menu-item>
            </ytm-menu-service-item-renderer>
        </div>
    </div>
</ytm-bottom-sheet-renderer>
```

**Mobile Menu (yt-list-view-model) Structure**:
Used in modern YTM layouts (Shorts, some Feed items).
```html
<yt-list-view-model class="ytListViewModelHost">
    <yt-list-item-view-model class="filtertube-block-channel-item" data-filtertube-channel-id="...">
        <div class="yt-list-item-view-model__label">
            <button class="filtertube-menu-button">
                <span class="filtertube-menu-label">Block • @Handle</span>
            </button>
        </div>
    </yt-list-item-view-model>
</yt-list-view-model>
```

Code review of current changes (ordered by severity):

  1. [High] Mix/playlist/collab card classification drift is likely causing incorrect card typing and blocking behavior
      - js/content_bridge.js now uses permissive mix detection (e.g. isMixCardElement) on ytm-compact-radio-renderer / ytm-radio-renderer and start_radio patterns, then branches in
        isPlaylistCreatorFlowForCard / extractChannelFromCard depend on that.
      - Result: mix cards can be treated as playlist/collab variants unpredictably, which matches your observed “mix vs collab confusion” and wrong 3-dot labels.
  2. [High] Strict collaborator mode can under-fill identity when explicit collaborator payload isn’t present in the right spot
      - js/content_bridge.js collaborator extraction path now defaults to stricter behavior for non-mix cards (extractChannelFromCard / strict extraction path).
      - If explicit collaborators header or showSheet data is missing/late on that renderer, collaborator/owner context gets dropped and fallback may happen too late.
  3. [High] Quick-block coverage regression risk on playlist DOMs
      - js/content/block_channel.js removed ytd-playlist-panel-video-renderer and ytd-playlist-panel-video-wrapper-renderer from desktop quick-block selector scope in findQuickBlockButton.
      - This can reduce/disable expected quick-block affordance on some playlist/video card variants before fallback logic can compensate.
  4. [Medium] Overlay-host gating + lowered z-index can hide or suppress UI affordance
      - js/content/block_channel.js changed quick-block wrap layering and introduced stricter data-filtertube-quick-overlay-host gating.
      - Cards that don’t get tagged as overlay-host (or get retagged after mutations) can miss the cross button even when identity is present.
  5. [Medium] Stamping cleanup/state-reset logic is aggressive and can cause churn/flicker
      - js/content_bridge.js multiple branches clear a broad set of data-filtertube-* attributes and re-stamp later.
      - On virtualized/recycled feeds, this can oscillate between partial and full states and delay stable UI actionability.
  6. [Medium] Collaborator sheet parsing has weak validation in one helper path
      - js/content/dom_extractors.js (extractCollaboratorsFromData) can ingest collaborator-like entries from sheet list items without ensuring the enclosing “Collaborators” context in that branch.
      - This risks false-positive collaborator payloads that then look like deterministic identity.
  7. [Medium] Identity overwrite policy can leave stale/weak identity in place
      - js/content_bridge.js stamp merge logic intentionally preserves “stronger” source values but can skip later better data depending on source precedence and timing.
      - Given your “always pre-stamp complete fields first” goal, this is risky because late-arriving higher-fidelity JSON might not replace earlier partial identity.
  8. [Low] Payload expansion is useful but increases matching complexity
      - js/content/filter_logic.js now carries richer fields (playlist/collab/category/fetch strategy). Good direction, but dedupe/match keys should be guarded to avoid false misses from noisy
        fields.


  What is not done well yet / gap against our goal:

  - Pre-stamp is not yet guaranteed complete for every DOM variant on first paint.
  - Some paths still rely on weak identity derived from byline text like “Shakira and 2 more” instead of canonical per-card JSON identity.
  - Mix cards are still being handled conservatively to avoid false collaboration detection, but this is also leaving gaps in menu context in some cases.
  - Some 3-dot/native menu paths still behave as if they only got partial context (often name-only), then improve only after blocking or additional extraction.
  - For a few card renderers, customUrl/handle/id/logo can be missing or late, so “quick block” and menu labels are not consistently reliable.

  What I can confidently extract from docs/json_paths_encyclopedia.md for your target types:

  - Collab cards: explicit detection via longBylineText / shortBylineText -> showSheetCommand -> sheetViewModel -> header.title.content === "Collaborators" and listViewModel.listItems[] with per-
    collab title, subtitle, leadingAccessory, and rendererContext.commandContext.innertubeCommand.browseEndpoint.browseId.
  - Playlist cards: playlistPanelVideoRenderer / playlist-like renderers with playlistId + owner byline / channel endpoint metadata; seed channel should come from owner/creator, not byline-summary
    text.
  - Mix cards: playlistId present, often mix badge in metadata/overlay; byline YouTube is often seed channel placeholder, not the full collaborator set.
  - Shorts cards: shortsLockupViewModel / reel payloads with dedicated lockup/watch endpoint + menu/video endpoint fields; fallback via currently-playing short payload when needed.
  - Channel post/other ytd/ytm rich variants: use lockup-level headline/shortBylineText + navigation endpoints as canonical channel entry.
  - Video cards: videoId, navigationEndpoint.watchEndpoint.videoId, and channel browse endpoint in shortBylineText/runs[0].navigationEndpoint.


BELOW acknowledgement generated via GPT 5.3 -

From docs/json_paths_encyclopedia.md, these are the JSON field definitions currently documented (per type), including the pieces you asked about (ID/handle/name/logo/etc.):

  1. videoWithContextRenderer as Collaborator Roster (collab cards)

  - Base: ...continuationItems[i].videoWithContextRenderer
  - Core fields
      - videoId, lengthText.runs[0].text, shortViewCountText.runs[0].text, thumbnail.thumbnails[*].url, isWatched, trackingParams
      - headline.runs[0].text, headline.accessibility.accessibilityData.label
      - shortBylineText.runs[0].text (often Shakira and 2 more), navigationEndpoint
      - menu.menuRenderer.items[*] (save/watch/later/not interested/don’t recommend channel tokens)
      - channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId
      - channelThumbnail...thumbnail.thumbnails[0].url
  - Collaborator roster discriminator
      - shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.header.panelHeaderViewModel.title.content == "Collaborators"
  - Collaborator item list (for each listItems[n])
      - ...listViewModel.listItems[n].listItemViewModel.title.content (name)
      - ...listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl (handle)
      - ...listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId (UC ID)
      - ...listItemViewModel.subtitle.content (badge/subscribers text)
      - ...listItemViewModel.leadingAccessory.avatarViewModel.image.sources[0].url (logo)
  - Alternate collaborator access
      - ...listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId
      - ...title.commandRuns[0].onTap...canonicalBaseUrl

  2. compactRadioRenderer / radioRenderer (MIX cards)

  - Base:
      - radioRenderer: ...richItemRenderer.content.radioRenderer
      - compactRadioRenderer: ...continuationItems[i].compactRadioRenderer
  - Core:
      - playlistId (always RD..., primary identity)
      - title.runs[0].text
      - navigationEndpoint.watchEndpoint.videoId
      - navigationEndpoint.watchEndpoint.playlistId (same as above)
      - navigationEndpoint.watchEndpoint.params
      - secondaryNavigationEndpoint.watchEndpoint.videoId (compact only)
      - shortBylineText.runs[0].text, longBylineText.runs[0].text (often YouTube)
      - videoCountText.runs[0].text, videoCountShortText.runs[0].text
      - thumbnailOverlays[0].thumbnailOverlayBottomPanelRenderer.icon.iconType == MIX
      - thumbnailOverlays[0].thumbnailOverlayBottomPanelRenderer.text.runs[0].text == Mix
      - thumbnail.thumbnails[*].url
      - inlinePlaybackEndpoint.watchEndpoint.videoId (home feed radioRenderer variant)
      - shareUrl
  - Menu tokens
      - menu.menuRenderer.items[2]...feedbackEndpoint.feedbackToken (not interested)
  - Notes in doc:
      - Mix usually has no owner channelId in payload; use playlistId + seed video fallback where needed.

  3. compactPlaylistRenderer (user-created playlists)

  - Base:
      - ...continuationItems[i].compactPlaylistRenderer
      - or ...itemSectionRenderer.contents[0].compactPlaylistRenderer (search/watch XHR path listed)
  - Core identity:
      - playlistId
      - shortBylineText.runs[0].text (creator name)
      - shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId (creator UC ID)
      - shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl (handle)
      - navigationEndpoint.commandMetadata.webCommandMetadata.url
      - navigationEndpoint.browseEndpoint.browseId (playlist browse id)
  - Metadata:
      - title.runs[0].text, videoCountText.runs, videoCountShortText.runs, thumbnail.thumbnails
      - sidebarThumbnails[]
      - thumbnailText.runs (e.g. 27 videos)
      - thumbnailOverlays[0/1]...text.runs[0].text
      - longBylineText path mirrors short byline
      - optional channelThumbnail.channelThumbnailWithLinkRenderer... (search context)
  - Menu:
      - menu.menuRenderer.items with NOT_INTERESTED, SHARE, optional SAVE TO LIBRARY
  - Logo fallback:
      - ownerBadges[].metadataBadgeRenderer.tooltip and channelThumbnail path where present

  4. playlistPanelVideoRenderer / playlistVideoRenderer

  - Core:
      - videoId
      - title.simpleText or title.runs[0].text
      - shortBylineText.runs[0].text (channel name)
      - shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId (UC ID, sometimes longBylineText fallback)
      - shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl (handle)
      - lengthText.runs[0].text
      - index.runs[0].text or indexText.simpleText
      - navigationEndpoint.commandMetadata.webCommandMetadata.url
      - videoInfo.runs (views/date)
  - Base paths for watch/playlist views are explicitly documented.

  5. shortsLockupViewModel

  - Base: ...continuationItems[i].shortsLockupViewModel
  - Core:
      - onTap.innertubeCommand.reelWatchEndpoint.videoId
      - onTap.innertubeCommand.commandMetadata.webCommandMetadata.url
      - metadata.lockupMetadataViewModel.title.content (title/name)
      - metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId (channel ID)
      - ...canonicalBaseUrl (handle)
      - metadata.lockupMetadataViewModel.image...avatar... (logo path shown)
      - metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[1].metadataParts[0].text.content (views)
      - contentImage.thumbnailViewModel.image.sources[0].url (thumbnail)
  - Grid Shelf variant (home/search):
      - inlinePlayerData.onVisible.innertubeCommand.watchEndpoint.videoId (fallback videoId)
      - accessibilityText
      - overlayMetadata.primaryText.content
      - optional belowThumbnailMetadata.primaryText.content (author name)
      - optional belowThumbnailMetadata.avatar.avatarViewModel.endpoint.innertubeCommand.browseEndpoint.browseId (author UC ID)
      - optional belowThumbnailMetadata.avatar.avatarViewModel.image.sources[0].url
      - menuOnTap...feedbackEndpoint.feedbackToken path documented for sheet usage

  6. reelItemRenderer (classic shorts shelf)

  - Base: ...continuationItems[i].reelItemRenderer
  - videoId
  - headline.simpleText
  - viewCountText.simpleText
  - navigationEndpoint.reelWatchEndpoint.overlay.reelPlayerOverlayRenderer.reelChannelBarViewModel.channelTitle.onTap.innertubeCommand.browseEndpoint.browseId (channel ID)

  7. reelPlayerOverlayRenderer (active playback JSON)

  - Base: overlay.reelPlayerOverlayRenderer
  - reelChannelBarViewModel.channelTitle.content (channel name)
  - reelChannelBarViewModel.channelTitle.onTap.innertubeCommand.browseEndpoint.browseId (UC ID)
  - reelChannelBarViewModel.channelTitle.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl (handle)
  - reelChannelBarViewModel.avatar.avatarViewModel.image.sources[0].url (logo)
  - likeButton.likeButtonViewModel.likeCountText.content (count)

  8. videoWithContextRenderer (Normal Video cards)

  - Base paths: main feed / sidebar XHR / search XHR
  - Core:
      - videoId, headline.runs[0].text
      - lengthText.runs[0].text, shortViewCountText.runs[0].text
      - publishedTimeText.runs[0].text
      - navigationEndpoint.watchEndpoint.videoId, navigationEndpoint.watchEndpoint.nofollow
      - channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId (logo-channel fallback)
      - shortBylineText.runs[0].text, shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId, canonicalBaseUrl
      - channelThumbnail...thumbnail.thumbnails[0].url
      - inlinePlaybackEndpoint.watchEndpoint.videoId
      - thumbnailOverlays[0].thumbnailOverlayResumePlaybackRenderer.percentDurationWatched
      - thumbnailOverlays[1].thumbnailOverlayTimeStatusRenderer...
      - richThumbnail.movingThumbnailRenderer...
      - accessibility.accessibilityData.label
  - Collaborator/rostering hook (if available):
      - shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems... (same collaborator ID/handle/name/logo
        extraction idea as above)

  9. lockupViewModel (modern high-nesting)

  - Base: ...continuationItems[i].lockupViewModel
  - contentId
  - rendererContext.commandContext.onTap.innertubeCommand.watchEndpoint.videoId
  - metadata.lockupMetadataViewModel.title.content (title)
  - metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel...browseEndpoint.browseId (channel UC)
  - metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl (handle)
  - metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources[0].url (logo)
  - metadata.contentMetadataViewModel.metadataRows[*] (metadata rows + delimiter)
  - collaborators may appear via same showSheetCommand roster path as above in mobile contexts

  10. compactVideoRenderer (kids + sidebars)

  - Base:
      - XHR sidebar: ...continuationItems[i].compactVideoRenderer
      - YT Kids initial: ...anchors...itemSectionRenderer.contents[i].compactVideoRenderer
  - videoId
  - shortBylineText.runs[0].text + ...browseEndpoint.browseId (UC ID) + canonicalBaseUrl
  - lengthText.runs[0].text
  - navigationEndpoint.watchEndpoint.startTimeSeconds (resume seconds)
  - channelThumbnail.thumbnails[0].url
  - kidsVideoOwnerExtension.externalChannelId
  - menu block action path for kids blacklist if present

  11. universalWatchCardRenderer (hero card)

  - Base: contents.sectionListRenderer.contents[0].universalWatchCardRenderer
  - header.watchCardRichHeaderRenderer.title.runs[0].text (entity title)
  - header.watchCardRichHeaderRenderer.titleNavigationEndpoint.browseEndpoint.browseId (UC)
  - header.watchCardRichHeaderRenderer.subtitle.runs[0].text (handle)
  - header.watchCardRichHeaderRenderer.avatar.thumbnails[0].url
  - callToAction.watchCardHeroVideoRenderer.callToActionButton.callToActionButtonRenderer.label.runs[0].text etc
  - hero video/playlist IDs in callToAction.watchCardHeroVideoRenderer.watchEndpoint

  12. searchRefinementCardRenderer

  - query.runs[0].text
  - bylineText.runs[0].text and .navigationEndpoint.browseEndpoint.browseId
  - thumbnail.thumbnails[0].url

  13. compactChannelRenderer

  - channelId
  - displayName.runs[0].text
  - videoCountText.runs[0].text (subs)
  - subscriberCountText.runs[0].text (handle)
  - navigationEndpoint.browseEndpoint.browseId

  14. /player Response

  - videoDetails: videoId, title, channelId, author, viewCount, keywords[], shortDescription
  - microformat.playerMicroformatRenderer: ownerProfileUrl, externalChannelId, isFamilySafe

  15. backstagePostRenderer (community posts)

  - postId
  - authorText.runs[0].text (author name)
  - authorText.runs[0].navigationEndpoint.browseEndpoint.browseId (channel UC)
  - authorText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl (handle)
  - authorEndpoint.browseEndpoint.browseId (alternate ID)
  - authorThumbnail.thumbnails[0].url
  - contentText.runs[0].text
  - publishedTimeText.runs[0].text
  - actionButtons.commentActionButtonsRenderer.replyButton.buttonRenderer.text.runs[0].text
  - voteCount.runs[0].text
  - publishedTime, share fields vary by payload shape

  16. sharedPostRenderer

  - postId
  - endpoint.browseEndpoint.browseId (sharer UC)
  - displayName.runs[0].text
  - original post nested under originalPost.postRenderer or originalPost.backstagePostRenderer

  17. commentRenderer under commentThreadRenderer

  - Base: ...reloadContinuationItemsCommand...commentThreadRenderer.comment.commentRenderer (and appendContinuation variant noted)
  - authorText.runs[0].text (handle/name)
  - authorEndpoint.browseEndpoint.browseId (UC)
  - authorEndpoint.commandMetadata.webCommandMetadata.url (handle URL)
  - authorThumbnail.thumbnails[0].url
  - authorIsChannelOwner
  - contentText.runs[0].text
  - publishedTimeText.runs[0].text
  - voteCount.runs[0].text
  - replyCount / repliesCount.runs[0].text
  - commentId
  - action menu item scan for REPORT_PROBLEM in actionMenu.menuRenderer.items

  18. Modern UI model notes (for runtime stamping hooks)

  - yt-avatar-stack-view-model (collab signal)
  - yt-badge-view-model (status badges like 4K/Subtitles)
  - ytm-bottom-sheet-renderer and yt-list-view-model for injected fallback menu entry placement
