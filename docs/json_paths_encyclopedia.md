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


# Absolute JSON Trace: Signed-in Subscribe and Unsubscribe Mutations
*Captured: 2026-07-19 from signed-in mobile web (`MWEB`, client version `2.20260717.00.00`).*

These endpoints mutate the signed-in YouTube account's subscription state.
They are distinct from the `FEchannels` browse response above, which reads the
current subscription list for FilterTube's reviewed whitelist-import flow.

The channel UC ID is the stable mutation target. Button state, entity state,
notification state, consistency tokens, and attestation commands are provider
receipts or session state; none of them should be treated as a FilterTube rule.

## Subscribe

**Endpoint**:
`POST https://m.youtube.com/youtubei/v1/subscription/subscribe?prettyPrint=false`

**Primary action receipt**:

- Base: `actions[i].updateSubscribeButtonAction`
- Channel UC ID: `.channelId`
- New state: `.subscribed` -> `true`

**Attestation instruction observed in the same response**:

- Base: `actions[i].runAttestationCommand`
- Channel UC ID: `.ids[j].externalChannelId`
- Engagement type: `.engagementType` -> `ENGAGEMENT_TYPE_SUBSCRIBE`

**Entity-state replacements**:

- Base: `frameworkUpdates.entityBatchUpdate.mutations[i]`
- Select mutations where `.type == ENTITY_MUTATION_TYPE_REPLACE`.
- Subscription state:
  `.payload.subscriptionStateEntity.subscribed` -> `true`
- Notification state:
  `.payload.subscriptionNotificationStateEntity.state` -> observed default
  `SUBSCRIPTION_NOTIFICATION_STATE_OCCASIONAL`
- Mutation time: `frameworkUpdates.entityBatchUpdate.timestamp`

**Short-lived consistency state**:

- Token: `responseContext.consistencyTokenJar.encryptedTokenJarContents`
- Lifetime: `responseContext.consistencyTokenJar.expirationSeconds` -> observed
  `600`

Reduced subscribe response:

```json
{
  "responseContext": {
    "consistencyTokenJar": {
      "encryptedTokenJarContents": "OPAQUE_TOKEN",
      "expirationSeconds": "600"
    }
  },
  "actions": [
    {
      "runAttestationCommand": {
        "ids": [
          { "externalChannelId": "UCc605luB7EcVs6X9ZvTXwKw" }
        ],
        "engagementType": "ENGAGEMENT_TYPE_SUBSCRIBE"
      }
    },
    {
      "updateSubscribeButtonAction": {
        "subscribed": true,
        "channelId": "UCc605luB7EcVs6X9ZvTXwKw"
      }
    }
  ],
  "frameworkUpdates": {
    "entityBatchUpdate": {
      "mutations": [
        {
          "type": "ENTITY_MUTATION_TYPE_REPLACE",
          "payload": {
            "subscriptionStateEntity": {
              "key": "OPAQUE_ENTITY_KEY",
              "subscribed": true
            }
          }
        },
        {
          "type": "ENTITY_MUTATION_TYPE_REPLACE",
          "payload": {
            "subscriptionNotificationStateEntity": {
              "key": "OPAQUE_ENTITY_KEY",
              "state": "SUBSCRIPTION_NOTIFICATION_STATE_OCCASIONAL"
            }
          }
        }
      ]
    }
  }
}
```

## Subscribe attestation follow-up

**Observed endpoint**:
`POST https://m.youtube.com/youtubei/v1/att/log?prettyPrint=false`

The provider issued this after the subscribe response returned a
`runAttestationCommand`. The captured response contains only
`responseContext`, including MWEB client tracking and a response ID. It does
not repeat the channel ID, subscription state, or mutation receipt.

Reduced response:

```json
{
  "responseContext": {
    "serviceTrackingParams": [
      {
        "service": "CSI",
        "params": [
          { "key": "c", "value": "MWEB" },
          { "key": "cver", "value": "2.20260717.00.00" },
          { "key": "LogAttestation_rid", "value": "OPAQUE_REQUEST_ID" }
        ]
      }
    ],
    "responseId": "OPAQUE_RESPONSE_ID"
  }
}
```

The response alone is not subscription-state authority. Keep the provider
client responsible for constructing and submitting the attestation request;
the supplied capture does not document its complete request body.

## Unsubscribe

**Endpoint**:
`POST https://m.youtube.com/youtubei/v1/subscription/unsubscribe?prettyPrint=false`

**Primary action receipt**:

- Base: `actions[i].updateSubscribeButtonAction`
- Channel UC ID: `.channelId`
- New state: `.subscribed` -> `false`

**Entity-state replacement**:

- Base: `frameworkUpdates.entityBatchUpdate.mutations[i]`
- Mutation type: `.type` -> `ENTITY_MUTATION_TYPE_REPLACE`
- New state: `.payload.subscriptionStateEntity.subscribed` -> `false`
- Mutation time: `frameworkUpdates.entityBatchUpdate.timestamp`

The captured unsubscribe response contains a new short-lived
`consistencyTokenJar`, but no `runAttestationCommand` and no
`subscriptionNotificationStateEntity` replacement. This is an observed
response-shape difference, not a guarantee that those fields can never appear.

Reduced unsubscribe response:

```json
{
  "responseContext": {
    "consistencyTokenJar": {
      "encryptedTokenJarContents": "OPAQUE_TOKEN",
      "expirationSeconds": "600"
    }
  },
  "actions": [
    {
      "updateSubscribeButtonAction": {
        "subscribed": false,
        "channelId": "UCc605luB7EcVs6X9ZvTXwKw"
      }
    }
  ],
  "frameworkUpdates": {
    "entityBatchUpdate": {
      "mutations": [
        {
          "type": "ENTITY_MUTATION_TYPE_REPLACE",
          "payload": {
            "subscriptionStateEntity": {
              "key": "OPAQUE_ENTITY_KEY",
              "subscribed": false
            }
          }
        }
      ]
    }
  }
}
```

## Identity, state, and FilterTube boundaries

1. Cross-check the UC ID in `updateSubscribeButtonAction.channelId`,
   `runAttestationCommand.ids[].externalChannelId` when present, and the
   originating channel command. Do not derive channel identity from opaque
   entity keys.
2. Treat `consistencyTokenJar`, entity keys, response IDs, request IDs, and
   tracking parameters as opaque, short-lived provider state. Do not persist
   or synthesize them.
3. A successful subscribe mutation changes the YouTube account. It does not
   automatically add that channel to a FilterTube whitelist. The user must
   explicitly run and approve the subscribed-channels import.
4. Unsubscribing on YouTube does not silently remove a previously imported
   FilterTube whitelist rule. Imported rules remain ordinary profile rules
   until the user reviews and changes them.
5. Do not optimistically claim success from the button click alone. Reconcile
   the action receipt and entity replacement; use a later `FEchannels` refresh
   when a full account-level subscription-list confirmation is required.
6. These are authenticated account mutations. Do not replay them from captured
   JSON or construct requests from response-only evidence; preserve the live
   YouTube client's authentication and integrity flow.

```text
Channel subscribe command
  -> subscription/subscribe
  -> subscribed=true action + entity replacements
  -> optional provider attestation follow-up
  -> later FEchannels read confirms account-list membership

Channel unsubscribe command
  -> subscription/unsubscribe
  -> subscribed=false action + entity replacement
  -> later FEchannels read confirms removal from the account list

FilterTube subscribed-channel import
  -> reads FEchannels
  -> previews normalized channels
  -> changes FilterTube rules only after explicit user approval
```


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

# Absolute JSON Trace: YTM Channel Page Tabs and Chips
*Files: `YTM Channel Page JSON/YTM_ChannelPageTabs_HOME.json`, `YTM_ChannelPageTabs_VIDEOS.json`, `YTM_ChannelPageTabs_SHORTS.json`, `YTM_ChannelPageTabs_LIVE.json`, `YTM_ChannelPageTabs_RELEASES.json`, `YTM_ChannelPageTabs_PODCASTS.json`, `YTM_ChannelPageTabs_PLAYLISTS.json`, `YTM_ChannelPageTabs_POSTS.json`, `YTM_ChannelPageTabs_SEARCH.json`*

*Captured: 2026-07-12 from the mobile YouTube channel surface (`MWEB`).*

These captures document the channel-page `browse` family, not the global
YouTube Search API. With the exception of the Home capture noted below, the
full tab responses are JSON bodies returned by:

```text
POST /youtubei/v1/browse?prettyPrint=false
```

The channel used by most captures is `UC1NF71EwP41VdjAU1iXdLkw`
(`/@NarendraModi`). The Releases example uses `UCv8nzwVPQDRjkPCkEsOdEwA`
(`/@Pitbull`). IDs and `params` are evidence from these captures, not constants
that FilterTube should hardcode.

The evidence files are capture bundles rather than directly parseable single
JSON documents: human-readable `====== ... ======` lines separate response
bodies. Videos, Shorts, and Live each contain the initial response plus Popular
and Oldest chip reload responses. Playlists contains two full browse responses.
The other tab files contain one full response, while Home contains the wrapper
exception documented below. Extract one balanced top-level object at a time
before calling `JSON.parse()`.

## Common tab navigation structure

**Tab array**:

```text
contents.singleColumnBrowseResultsRenderer.tabs[i].tabRenderer
```

**Fields**:

- Tab label: `...tabRenderer.title`
- Active tab: `...tabRenderer.selected == true`
- Channel ID: `...tabRenderer.endpoint.browseEndpoint.browseId`
- Tab-specific opaque selector: `...tabRenderer.endpoint.browseEndpoint.params`
- Canonical channel URL: `...tabRenderer.endpoint.browseEndpoint.canonicalBaseUrl`
- API endpoint: `...tabRenderer.endpoint.commandMetadata.webCommandMetadata.apiUrl`
  -> `/youtubei/v1/browse`
- Initial/reload token for an inactive tab:
  `...tabRenderer.content.sectionListRenderer.continuations[0].reloadContinuationData.continuation`

The `params` and continuation tokens select a tab or sort order, but they are
opaque server values. FilterTube may carry them back to YouTube; it must not
decode them into policy or infer channel identity from them.

## Common channel identity and header data

The full browse response repeats channel identity outside individual cards.
The strongest page-level channel ID is:

```text
metadata.channelMetadataRenderer.externalId
```

Related fields:

- Channel name: `metadata.channelMetadataRenderer.title`
- Description: `metadata.channelMetadataRenderer.description`
- Handle/owner URLs: `metadata.channelMetadataRenderer.ownerUrls[]`
- Canonical channel URL: `metadata.channelMetadataRenderer.channelUrl`
- Avatar: `metadata.channelMetadataRenderer.avatar.thumbnails[n].url`
- RSS feed: `metadata.channelMetadataRenderer.rssUrl`
- Page title:
  `header.pageHeaderRenderer.content.pageHeaderViewModel.title.dynamicTextViewModel.text.content`
- Header avatar:
  `header.pageHeaderRenderer.content.pageHeaderViewModel.image.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources[n].url`
- Canonical metadata fallback: `microformat.microformatDataRenderer.urlCanonical`

This page-level identity describes the channel surface being viewed. It is a
safe fallback for channel-owned cards that omit their own byline endpoint, but
it must not erase a different exact identity carried by a video, release,
collaborator sheet, post author, or playlist byline.

## Captured tab matrix

| File | Selected tab | Main content path | Main renderer | Tab-local choices |
| --- | --- | --- | --- | --- |
| `YTM_ChannelPageTabs_HOME.json` | Home | `...tabs[i].tabRenderer.content.sectionListRenderer.contents[]` | `channelFeaturedVideoRenderer`, `shelfRenderer`, `compactVideoRenderer`, `reelShelfRenderer`, `shortsLockupViewModel` | Shelf endpoints are independent browse/playlist links |
| `YTM_ChannelPageTabs_VIDEOS.json` | Videos | `...tabRenderer.content.richGridRenderer.contents[i].richItemRenderer.content.compactVideoRenderer` | `compactVideoRenderer` | Latest, Popular, Oldest |
| `YTM_ChannelPageTabs_SHORTS.json` | Shorts | `...tabRenderer.content.richGridRenderer.contents[i].richItemRenderer.content.shortsLockupViewModel` | `shortsLockupViewModel` | Latest, Popular, Oldest |
| `YTM_ChannelPageTabs_LIVE.json` | Live | `...tabRenderer.content.richGridRenderer.contents[i].richItemRenderer.content.compactVideoRenderer` | `compactVideoRenderer` | Latest, Popular, Oldest |
| `YTM_ChannelPageTabs_RELEASES.json` | Releases | `...tabRenderer.content.richGridRenderer.contents[i].richItemRenderer.content.compactPlaylistRenderer` | `compactPlaylistRenderer` | No sort chip in this capture |
| `YTM_ChannelPageTabs_PODCASTS.json` | Podcasts | `...tabRenderer.content.richGridRenderer.contents[i].richItemRenderer.content.lockupViewModel` | `lockupViewModel` with `LOCKUP_CONTENT_TYPE_PODCAST` | No sort chip in this capture |
| `YTM_ChannelPageTabs_PLAYLISTS.json` | Playlists | `...tabRenderer.content.sectionListRenderer.contents[i].itemSectionRenderer.contents[j].compactPlaylistRenderer` | `compactPlaylistRenderer` | Date added (newest), Last video added; represented by separate full browse responses |
| `YTM_ChannelPageTabs_POSTS.json` | Posts | `...tabRenderer.content.sectionListRenderer.contents[i].itemSectionRenderer.contents[j].backstagePostThreadRenderer` | `backstagePostThreadRenderer` -> `backstagePostRenderer` | No sort chip in this capture |
| `YTM_ChannelPageTabs_SEARCH.json` | Search | `...tabRenderer.content.sectionListRenderer.contents[i].itemSectionRenderer.contents[j].channelSearchBoxRenderer` | `channelSearchBoxRenderer` | Query results are loaded after submitting the channel-local search |

The LIVE file's human prefix incorrectly says `SHORTS TAB`. Its JSON has
`tabs[3].tabRenderer.title == "Live"` and `selected == true`, so the response
body, filename, and renderer evidence identify it as the Live tab.

The Releases tab is conditional. Channels without release/catalog data may
omit it, which changes later tab indexes. Code must locate tabs by
`tabRenderer.title`, selected state, endpoint URL, or renderer shape rather
than relying on a fixed numeric index.

## Videos, Shorts, and Live chip selection

The initial selected tab embeds its chip bar at:

```text
contents.singleColumnBrowseResultsRenderer.tabs[i].tabRenderer
  .content.richGridRenderer.header.chipBarViewModel.chips[j].chipViewModel
```

**Chip fields**:

- Label: `...chipViewModel.text`
- Active choice: `...chipViewModel.selected == true`
- Browse API: `...chipViewModel.tapCommand.innertubeCommand.commandMetadata.webCommandMetadata.apiUrl`
- Sort reload token: `...chipViewModel.tapCommand.innertubeCommand.continuationCommand.token`
- Request kind: `...continuationCommand.request`
  -> `CONTINUATION_REQUEST_TYPE_BROWSE`

The captures prove these chip sets for Videos, Shorts, and Live:

```text
Latest | Popular | Oldest
```

The evidence bundles preserve the sort chronology explicitly:

| File | Initial/first section | Second section | Third section | Returned card family |
| --- | --- | --- | --- | --- |
| `YTM_ChannelPageTabs_VIDEOS.json` | Videos tab, Latest selected | Popular reload | Oldest reload | `compactVideoRenderer` |
| `YTM_ChannelPageTabs_SHORTS.json` | Shorts tab, Latest selected | Popular reload | Oldest reload | `shortsLockupViewModel` |
| `YTM_ChannelPageTabs_LIVE.json` | Live tab, Latest selected despite the stale `SHORTS TAB` marker | Popular reload | Oldest reload | `compactVideoRenderer` |

The first section is a complete selected-tab browse response. Popular and
Oldest are continuation responses that contain replacement actions. This is
why the extension/app must process both the initial tab tree and every
`reloadContinuationItemsCommand`; handling only appended continuations would
leave a newly sorted grid unfiltered.

Selecting another chip does not return another complete tab tree. It returns
reload actions:

```text
onResponseReceivedActions[0].reloadContinuationItemsCommand
  .continuationItems[0].chipBarViewModel.chips[j].chipViewModel

onResponseReceivedActions[1].reloadContinuationItemsCommand
  .continuationItems[i].richItemRenderer.content.compactVideoRenderer
```

For Shorts, the second action ends in:

```text
...continuationItems[i].richItemRenderer.content.shortsLockupViewModel
```

Consequences for filtering:

- Re-run filtering for every `reloadContinuationItemsCommand`; chip changes
  replace the visible collection instead of performing a normal append.
- Read the currently selected chip from the response. Do not infer it from a
  previous DOM state.
- A selected sort chip changes ordering only. It does not change the owning
  channel or turn the returned cards into global Search results.

## Video and Live card fields

For `compactVideoRenderer` under Videos or Live:

- Video ID: `...compactVideoRenderer.videoId`
- Title: `...compactVideoRenderer.title.runs[0].text`
- Thumbnail: `...compactVideoRenderer.thumbnail.thumbnails[n].url`
- Watch endpoint: `...compactVideoRenderer.navigationEndpoint.watchEndpoint.videoId`
- Byline text: `...compactVideoRenderer.shortBylineText.runs[0].text`
- Channel ID when present:
  `...compactVideoRenderer.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- Menu actions: `...compactVideoRenderer.menu.menuRenderer.items[]`
- Duration: locate `thumbnailOverlayTimeStatusRenderer.text`
- Continuation card:
  `...richGridRenderer.contents[last].continuationItemRenderer.continuationEndpoint.continuationCommand.token`

The enclosing selected channel tab remains a strong owner context, but a card
may still expose a different byline for collaborations or catalog identities.
Preserve exact card identity when supplied; do not overwrite it merely because
the card appeared on a particular channel page.

## Shorts fields

For `shortsLockupViewModel`:

- Video ID: `...shortsLockupViewModel.onTap.innertubeCommand.reelWatchEndpoint.videoId`
- Shorts URL: `...onTap.innertubeCommand.commandMetadata.webCommandMetadata.url`
- Title: `...shortsLockupViewModel.overlayMetadata.primaryText.content`
- View text: `...shortsLockupViewModel.overlayMetadata.secondaryText.content`
- Thumbnail: `...shortsLockupViewModel.thumbnailViewModel.thumbnailViewModel.image.sources[n].url`
- Menu sheet: `...shortsLockupViewModel.menuOnTap.innertubeCommand.showSheetCommand`

Current channel-page Shorts cards may omit a direct channel browse endpoint.
In that case the selected channel tab supplies bounded channel-page context,
while the exact `videoId` remains the key for stronger JSON/player identity
enrichment. A missing per-card channel ID must not be treated as a different
or unknown global creator without checking this enclosing context.

## Releases, Podcasts, and Playlists

Releases use album/release playlists rather than video cards:

- Release playlist ID: `...compactPlaylistRenderer.playlistId`
  -> examples begin with `OLAK5uy_`
- Title: `...compactPlaylistRenderer.title.runs[0].text`
- Playlist endpoint:
  `...compactPlaylistRenderer.navigationEndpoint.browseEndpoint.browseId`
  -> commonly `VL` + playlist ID
- Artist/channel identities may appear in byline runs:
  `...compactPlaylistRenderer.longBylineText.runs[k].navigationEndpoint.browseEndpoint.browseId`

A release can expose more than one UC ID in its metadata. As with the
Shakira/VEVO collaborator example, retain those as distinct evidence. Do not
collapse them solely because they appear on one artist channel page.

Playlists use the same `compactPlaylistRenderer` family. The two captured
playlist orderings are separate full `/youtubei/v1/browse` responses, not the
Videos/Shorts `chipBarViewModel` reload shape.

### Channel-page Playlist sort menu

Channel-page Playlists exposes a submenu, not the Latest/Popular/Oldest chip
bar:

```text
contents.singleColumnBrowseResultsRenderer.tabs[i].tabRenderer.content
  .sectionListRenderer.subMenu.channelSubMenuRenderer
  .sortFilterSubMenuItems[j]
```

For each choice:

- Label: `sortFilterSubMenuItems[j].title`
- Selected state: `sortFilterSubMenuItems[j].selected`
- Browse URL:
  `sortFilterSubMenuItems[j].endpoint.commandMetadata.webCommandMetadata.url`
- Channel ID: `sortFilterSubMenuItems[j].endpoint.browseEndpoint.browseId`
- Opaque sort selector: `sortFilterSubMenuItems[j].endpoint.browseEndpoint.params`

The supplied channel-page capture proves exactly these two choices:

```text
Date added (newest) | Last video added
```

They are stored as two complete browse responses in
`YTM_ChannelPageTabs_PLAYLISTS.json`. The first has `Date added (newest)`
selected; the second has `Last video added` selected.

**Reduced channel Playlist sort excerpt**:

```json
{
  "channelSubMenuRenderer": {
    "sortFilterSubMenuItems": [
      {
        "endpoint": {
          "commandMetadata": {
            "webCommandMetadata": {
              "url": "/@NarendraModi/playlists?view=1&sort=dd&flow=list",
              "apiUrl": "/youtubei/v1/browse"
            }
          },
          "browseEndpoint": {
            "browseId": "UC1NF71EwP41VdjAU1iXdLkw",
            "params": "EglwbGF5bGlzdHMYAyABMALyBgQKAkIA"
          }
        },
        "title": "Date added (newest)",
        "selected": true
      },
      {
        "endpoint": {
          "commandMetadata": {
            "webCommandMetadata": {
              "url": "/@NarendraModi/playlists?view=1&sort=lad&flow=list",
              "apiUrl": "/youtubei/v1/browse"
            }
          },
          "browseEndpoint": {
            "browseId": "UC1NF71EwP41VdjAU1iXdLkw",
            "params": "EglwbGF5bGlzdHMYBCABMALyBgQKAkIA"
          }
        },
        "title": "Last video added",
        "selected": false
      }
    ]
  }
}
```

Do not conflate this menu with the separate signed-in **You page** Playlists
sort documented later. That surface proves `Recently added | A-Z`; the current
channel-page capture does not contain an A-Z choice.

Podcasts use the newer lockup model in this capture:

- Item: `...richItemRenderer.content.lockupViewModel`
- Playlist/content ID: `...lockupViewModel.contentId`
- Type discriminator: `...lockupViewModel.contentType`
  -> `LOCKUP_CONTENT_TYPE_PODCAST`
- Title: `...lockupViewModel.metadata.lockupMetadataViewModel.title.content`
- Episode-count badge:
  `...collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel.overlays[].thumbnailOverlayBadgeViewModel.thumbnailBadges[].thumbnailBadgeViewModel.text`
- Playlist endpoint:
  `...lockupViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`

Podcast grids remain channel-dependent and can still be empty. Filtering must
therefore support both `lockupViewModel` items and a valid empty grid.

## Posts and channel-local Search

Posts:

```text
...backstagePostThreadRenderer.post.backstagePostRenderer
```

Relevant fields include `postId`, author text/endpoint, `contentText`, image or
attachment renderers, published-time text, action buttons, and the post menu.
Post author identity must come from its endpoint when present, not from the
selected channel tab alone (for example, reposted/shared content can carry
other identities).

The Search tab initially supplies:

```text
...channelSearchBoxRenderer
```

This is the input surface for searching within the selected channel. It is not
the same as `/youtubei/v1/search`, and the initial capture does not itself
contain submitted-query result cards. Subsequent result/continuation payloads
must be classified from their returned renderer type before filtering.

## Reduced captured JSON structures

The complete responses remain in `YTM Channel Page JSON/`. These reduced
excerpts preserve the identity, selection, renderer, and continuation shapes
without copying tracking parameters, thumbnails, menus, or every returned
item into this encyclopedia.

### Common selected-tab wrapper

```json
{
  "contents": {
    "singleColumnBrowseResultsRenderer": {
      "tabs": [{
        "tabRenderer": {
          "endpoint": {
            "commandMetadata": {
              "webCommandMetadata": {
                "url": "/@NarendraModi/videos",
                "apiUrl": "/youtubei/v1/browse"
              }
            },
            "browseEndpoint": {
              "browseId": "UC1NF71EwP41VdjAU1iXdLkw",
              "params": "EgZ2aWRlb3PyBgQKAjoA",
              "canonicalBaseUrl": "/@NarendraModi"
            }
          },
          "title": "Videos",
          "selected": true,
          "content": {
            "richGridRenderer": {
              "contents": []
            }
          }
        }
      }]
    }
  },
  "metadata": {
    "channelMetadataRenderer": {
      "title": "Narendra Modi",
      "externalId": "UC1NF71EwP41VdjAU1iXdLkw",
      "ownerUrls": ["http://www.youtube.com/@NarendraModi"],
      "channelUrl": "https://www.youtube.com/channel/UC1NF71EwP41VdjAU1iXdLkw"
    }
  }
}
```

### Videos and Live cards

Videos and Live share the same item renderer; the selected tab and endpoint
distinguish the surfaces.

```json
{
  "richItemRenderer": {
    "content": {
      "compactVideoRenderer": {
        "videoId": "CMSf79xfRfY",
        "title": {
          "runs": [{
            "text": "PM Christopher Luxon's speech during community programme in Auckland, New Zealand"
          }]
        },
        "navigationEndpoint": {
          "watchEndpoint": {
            "videoId": "CMSf79xfRfY"
          }
        }
      }
    }
  }
}
```

The Live capture has the equivalent shape with, for example,
`videoId: "HenpnhlFFsg"` and tab endpoint `"/@NarendraModi/streams"`.

### Videos, Shorts, and Live chip reload

```json
{
  "onResponseReceivedActions": [
    {
      "reloadContinuationItemsCommand": {
        "continuationItems": [{
          "chipBarViewModel": {
            "chips": [
              { "chipViewModel": { "text": "Latest", "selected": false } },
              { "chipViewModel": { "text": "Popular", "selected": true } },
              { "chipViewModel": { "text": "Oldest", "selected": false } }
            ]
          }
        }]
      }
    },
    {
      "reloadContinuationItemsCommand": {
        "continuationItems": [{
          "richItemRenderer": {
            "content": {
              "compactVideoRenderer": {
                "videoId": "returned-video-id"
              }
            }
          }
        }]
      }
    }
  ]
}
```

Each real `chipViewModel` also includes:

```json
{
  "tapCommand": {
    "innertubeCommand": {
      "commandMetadata": {
        "webCommandMetadata": {
          "sendPost": true,
          "apiUrl": "/youtubei/v1/browse"
        }
      },
      "continuationCommand": {
        "token": "opaque-sort-token",
        "request": "CONTINUATION_REQUEST_TYPE_BROWSE"
      }
    }
  }
}
```

### Shorts card

```json
{
  "richItemRenderer": {
    "content": {
      "shortsLockupViewModel": {
        "onTap": {
          "innertubeCommand": {
            "commandMetadata": {
              "webCommandMetadata": {
                "url": "/shorts/Oy0JrfRUpR8",
                "webPageType": "WEB_PAGE_TYPE_SHORTS"
              }
            },
            "reelWatchEndpoint": {
              "videoId": "Oy0JrfRUpR8"
            }
          }
        },
        "overlayMetadata": {
          "primaryText": { "content": "Short title" },
          "secondaryText": { "content": "View count" }
        }
      }
    }
  }
}
```

For a Shorts chip reload, replace `compactVideoRenderer` in the preceding
reload example with this `shortsLockupViewModel` shape.

### Releases

```json
{
  "tabRenderer": {
    "endpoint": {
      "browseEndpoint": {
        "browseId": "UCv8nzwVPQDRjkPCkEsOdEwA",
        "canonicalBaseUrl": "/@Pitbull"
      }
    },
    "title": "Releases",
    "selected": true,
    "content": {
      "richGridRenderer": {
        "contents": [{
          "richItemRenderer": {
            "content": {
              "compactPlaylistRenderer": {
                "playlistId": "OLAK5uy_k7IB6X1KI0yleCwrVVC-FS6BuulJcBrV8",
                "title": {
                  "runs": [{ "text": "Satalanaaa" }]
                },
                "shortBylineText": {
                  "runs": [
                    {
                      "text": "Pitbull",
                      "navigationEndpoint": {
                        "browseEndpoint": {
                          "browseId": "UCv8nzwVPQDRjkPCkEsOdEwA"
                        }
                      }
                    },
                    { "text": ", " },
                    {
                      "text": "Lil Jon",
                      "navigationEndpoint": {
                        "browseEndpoint": {
                          "browseId": "UCak_T_U_EWN49_aTdl7FCqw"
                        }
                      }
                    }
                  ]
                },
                "navigationEndpoint": {
                  "browseEndpoint": {
                    "browseId": "VLOLAK5uy_k7IB6X1KI0yleCwrVVC-FS6BuulJcBrV8"
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
```

This excerpt is important identity evidence: the selected channel is Pitbull,
while one release byline supplies both Pitbull and Lil Jon UC IDs. The release
is one playlist entry with multiple attributed artists, not proof that the two
channel IDs are aliases of one creator.

### Playlists

```json
{
  "itemSectionRenderer": {
    "contents": [{
      "compactPlaylistRenderer": {
        "playlistId": "PLY6-jURUlWtc",
        "title": {
          "runs": [{
            "text": "Listen Mann Ki Baat in your language, in PM Modi's own voice | June 2026"
          }]
        },
        "shortBylineText": {
          "runs": [{
            "text": "Narendra Modi",
            "navigationEndpoint": {
              "browseEndpoint": {
                "browseId": "UC1NF71EwP41VdjAU1iXdLkw",
                "canonicalBaseUrl": "/@NarendraModi"
              }
            }
          }]
        },
        "navigationEndpoint": {
          "browseEndpoint": {
            "browseId": "VLPLY6-jURUlWtc"
          }
        }
      }
    }]
  }
}
```

### Podcasts

```json
{
  "richItemRenderer": {
    "content": {
      "lockupViewModel": {
        "contentImage": {
          "collectionThumbnailViewModel": {
            "primaryThumbnail": {
              "thumbnailViewModel": {
                "overlays": [{
                  "thumbnailOverlayBadgeViewModel": {
                    "thumbnailBadges": [{
                      "thumbnailBadgeViewModel": {
                        "text": "41 episodes"
                      }
                    }]
                  }
                }]
              }
            }
          }
        },
        "metadata": {
          "lockupMetadataViewModel": {
            "title": {
              "content": "PM Modi's interviews during 2024 Lok Sabha Elections campaign"
            }
          }
        },
        "contentId": "PLBG6UuYpOcTvjoTaWl9y0Vc_PW9JAZ_17",
        "contentType": "LOCKUP_CONTENT_TYPE_PODCAST",
        "rendererContext": {
          "commandContext": {
            "onTap": {
              "innertubeCommand": {
                "browseEndpoint": {
                  "browseId": "VLPLBG6UuYpOcTvjoTaWl9y0Vc_PW9JAZ_17"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

An empty Podcasts grid is also valid and must not cause a page-level
pending-hide state to persist forever.

### Posts

```json
{
  "itemSectionRenderer": {
    "contents": [{
      "backstagePostThreadRenderer": {
        "post": {
          "backstagePostRenderer": {
            "postId": "Ugkx3xdaUyWKsqq9dwiHoUOqkpzU6uVzqOAw",
            "authorText": {
              "runs": [{
                "text": "Narendra Modi",
                "navigationEndpoint": {
                  "browseEndpoint": {
                    "browseId": "UC1NF71EwP41VdjAU1iXdLkw",
                    "canonicalBaseUrl": "/@NarendraModi"
                  }
                }
              }]
            },
            "contentText": {
              "runs": [{ "text": "Post body" }]
            },
            "publishedTimeText": {
              "runs": [{
                "text": "15 hours ago",
                "navigationEndpoint": {
                  "browseEndpoint": {
                    "browseId": "FEpost_detail",
                    "canonicalBaseUrl": "/post/Ugkx3xdaUyWKsqq9dwiHoUOqkpzU6uVzqOAw"
                  }
                }
              }]
            }
          }
        }
      }
    }]
  }
}
```

### Channel-local Search input

```json
{
  "itemSectionRenderer": {
    "contents": [{
      "channelSearchBoxRenderer": {
        "text": "",
        "endpoint": {
          "commandMetadata": {
            "webCommandMetadata": {
              "url": "/@NarendraModi/search",
              "webPageType": "WEB_PAGE_TYPE_CHANNEL",
              "apiUrl": "/youtubei/v1/browse"
            }
          },
          "browseEndpoint": {
            "browseId": "UC1NF71EwP41VdjAU1iXdLkw",
            "params": "EgZzZWFyY2g%3D",
            "canonicalBaseUrl": "/@NarendraModi"
          }
        }
      }
    }]
  }
}
```

### Home heterogeneous content

After decoding the embedded `ytInitialData`, the selected Home tab begins like:

```json
{
  "tabRenderer": {
    "title": "Home",
    "selected": true,
    "content": {
      "sectionListRenderer": {
        "contents": [
          {
            "itemSectionRenderer": {
              "contents": [{
                "channelFeaturedVideoRenderer": {
                  "videoId": "35vdFvHDsOc"
                }
              }]
            }
          },
          {
            "shelfRenderer": {
              "title": {
                "runs": [{ "text": "Videos" }]
              },
              "content": {
                "verticalListRenderer": {
                  "items": [{
                    "compactVideoRenderer": {
                      "videoId": "CMSf79xfRfY"
                    }
                  }]
                }
              }
            }
          },
          {
            "reelShelfRenderer": {
              "items": [{ "shortsLockupViewModel": {} }]
            }
          }
        ]
      }
    }
  }
}
```

## Home capture wrapper exception

`YTM_ChannelPageTabs_HOME.json` now contains four captured resources:

1. a `/youtubei/v1/guide?prettyPrint=false` JSON response; and
2. the full channel Home HTML document, whose channel payload is stored as a
   hex-escaped JavaScript string in `var ytInitialData = '\\x7b\\x22...'`;
3. a second mobile Pitbull channel Home HTML document; and
4. a desktop YTD Pitbull channel Home browse JSON response under
   `====== MORE PITBULL JSON FOR CHANNLE HOME PAGE ======`.

After decoding the `\\xNN` escapes and parsing JSON, the Home data uses the
same tab base path documented above. Its selected Home content contains a
featured video and heterogeneous shelves, so code must recursively handle
`channelFeaturedVideoRenderer`, `shelfRenderer`/`verticalListRenderer`,
`compactVideoRenderer`, `reelShelfRenderer`, and `shortsLockupViewModel`.
The preceding `guide` response is navigation chrome and is not channel-content
authority.

## Added Pitbull Home, Live, and Posts captures

The later Pitbull captures are important because they prove that channel-page
content does not use one platform-independent tree. Preserve the renderer root
before traversing it:

| Capture marker | Client surface | Selected-content root |
| --- | --- | --- |
| `MORE PITBULL JSON FOR CHANNLE HOME PAGE` | Desktop YTD Home browse JSON | `contents.twoColumnBrowseResultsRenderer.tabs[i].tabRenderer.content` |
| `PITBULL LIVE PAGE ... /youtubei/v1/browse` | Mobile YTM Live browse JSON | `contents.singleColumnBrowseResultsRenderer.tabs[i].tabRenderer.content` |
| `PITBULL POSTS ... /youtubei/v1/browse` | Desktop YTD Posts browse JSON | `contents.twoColumnBrowseResultsRenderer.tabs[i].tabRenderer.content` |

The mobile Pitbull Home HTML remains a wrapper capture. Extract and parse its
`ytInitialData`; do not treat the surrounding page source as an API body. The
desktop Home, mobile Live, and desktop Posts additions are direct browse JSON.

### Desktop channel Home: featured lockups, Posts, and Collaborations

The desktop Home response uses heterogeneous `itemSectionRenderer` entries:

```text
contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer
  .content.sectionListRenderer.contents[i].itemSectionRenderer.contents[0]
```

Observed children include:

- Featured content:
  `channelFeaturedContentRenderer.items[i].lockupViewModel`
- Horizontal shelves:
  `shelfRenderer.content.horizontalListRenderer.items[i].lockupViewModel`
- Posts shelf:
  `shelfRenderer.title.runs[0].text == "Posts"`, then
  `...horizontalListRenderer.items[i].postRenderer`
- Collaborations shelf:
  `shelfRenderer.title.simpleText == "Collaborations"`, then
  `...horizontalListRenderer.items[i].lockupViewModel`

The Home Collaborations shelf is not merely a byline heuristic. Its lockups
carry an avatar stack whose action opens a header-backed collaborator dialog:

```text
lockupViewModel.metadata.lockupMetadataViewModel.image.avatarStackViewModel
  .rendererContext.commandContext.onTap.innertubeCommand.showDialogCommand
  .panelLoadingStrategy.inlineContent.dialogViewModel
```

Authority discriminator:

```text
...dialogViewModel.header.dialogHeaderViewModel.headline.content
  == "Collaborators"
```

Roster:

```text
...dialogViewModel.customContent.listViewModel.listItems[i].listItemViewModel
```

For each row:

- Name: `title.content`
- Handle endpoint:
  `title.commandRuns[0].onTap.innertubeCommand.browseEndpoint`
- Canonical UC ID:
  `rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- Avatar: `leadingAccessory.avatarViewModel.image.sources[n].url`

This is the desktop dialog equivalent of the mobile `sheetViewModel`
Collaborators roster. Both are authoritative only when their exact header says
`Collaborators`. An avatar stack alone is a lookup signal, not roster proof.

**Reduced Home Collaborations excerpt**:

```json
{
  "shelfRenderer": {
    "title": { "simpleText": "Collaborations" },
    "content": {
      "horizontalListRenderer": {
        "items": [{
          "lockupViewModel": {
            "contentId": "ftBAyfV2Gf8",
            "metadata": {
              "lockupMetadataViewModel": {
                "image": {
                  "avatarStackViewModel": {
                    "rendererContext": {
                      "commandContext": {
                        "onTap": {
                          "innertubeCommand": {
                            "showDialogCommand": {
                              "panelLoadingStrategy": {
                                "inlineContent": {
                                  "dialogViewModel": {
                                    "header": {
                                      "dialogHeaderViewModel": {
                                        "headline": {
                                          "content": "Collaborators"
                                        }
                                      }
                                    },
                                    "customContent": {
                                      "listViewModel": {
                                        "listItems": [{
                                          "listItemViewModel": {
                                            "title": {
                                              "content": "Pitbull",
                                              "commandRuns": [{
                                                "onTap": {
                                                  "innertubeCommand": {
                                                    "browseEndpoint": {
                                                      "browseId": "UCv8nzwVPQDRjkPCkEsOdEwA",
                                                      "canonicalBaseUrl": "/@Pitbull"
                                                    }
                                                  }
                                                }
                                              }]
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
                        }
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
  }
}
```

The desktop Home Posts shelf uses the newer top-level `postRenderer`, rather
than the Posts-tab `backstagePostThreadRenderer` wrapper:

```text
...shelfRenderer.content.horizontalListRenderer.items[i].postRenderer
```

Relevant paths remain author-driven:

- Post ID: `postRenderer.postId`
- Author name: `postRenderer.authorText.runs[0].text`
- Author UC ID: `postRenderer.authorEndpoint.browseEndpoint.browseId`
- Author handle: `postRenderer.authorEndpoint.browseEndpoint.canonicalBaseUrl`
- Text: `postRenderer.contentText.runs[].text`
- Published time: `postRenderer.publishedTimeText.runs[0].text`
- Attachment: `postRenderer.backstageAttachment.*`

Mentioned channels inside `contentText.runs[]` are text/link entities, not the
post owner. Do not replace `authorEndpoint` with a mentioned channel endpoint.

### Mobile Live browse response

The added Pitbull Live response selects the Live tab under the mobile root:

```text
contents.singleColumnBrowseResultsRenderer.tabs[i].tabRenderer
```

where `title == "Live"` and `selected == true`. Cards are:

```text
...content.richGridRenderer.contents[i]
  .richItemRenderer.content.compactVideoRenderer
```

**Reduced Live excerpt**:

```json
{
  "tabRenderer": {
    "title": "Live",
    "selected": true,
    "content": {
      "richGridRenderer": {
        "contents": [{
          "richItemRenderer": {
            "content": {
              "compactVideoRenderer": {
                "videoId": "I9qyqbD2hFY",
                "title": {
                  "runs": [{
                    "text": "Live from BST Hyde Park: Pitbull Attempts To Break His First Guinness World Records Title"
                  }]
                },
                "publishedTimeText": {
                  "runs": [{ "text": "Streamed 1 day ago" }]
                },
                "lengthText": {
                  "runs": [{ "text": "3:01:56" }]
                }
              }
            }
          }
        }]
      }
    }
  }
}
```

The capture confirms the old file prefixes saying `SHORTS TAB` are labels only;
the actual selected JSON tab and `compactVideoRenderer` content define Live.

### Mobile YTM Posts browse response

The first section of `YTM_ChannelPageTabs_POSTS.json`, marked
`Channel Page POSTS TAB`, is the mobile `MWEB` response. It selects:

```text
contents.singleColumnBrowseResultsRenderer.tabs[i].tabRenderer
```

with `title == "Posts"` and `selected == true`. Its rows use the same semantic
post chain as desktop, but under the mobile single-column root:

```text
...content.sectionListRenderer.contents[i].itemSectionRenderer.contents[j]
  .backstagePostThreadRenderer.post.backstagePostRenderer
```

**Reduced mobile YTM Posts excerpt**:

```json
{
  "tabRenderer": {
    "title": "Posts",
    "selected": true,
    "content": {
      "sectionListRenderer": {
        "contents": [{
          "itemSectionRenderer": {
            "contents": [{
              "backstagePostThreadRenderer": {
                "post": {
                  "backstagePostRenderer": {
                    "postId": "Ugkx3xdaUyWKsqq9dwiHoUOqkpzU6uVzqOAw",
                    "authorText": {
                      "runs": [{
                        "text": "Narendra Modi",
                        "navigationEndpoint": {
                          "browseEndpoint": {
                            "browseId": "UC1NF71EwP41VdjAU1iXdLkw",
                            "canonicalBaseUrl": "/@NarendraModi"
                          }
                        }
                      }]
                    },
                    "authorEndpoint": {
                      "browseEndpoint": {
                        "browseId": "UC1NF71EwP41VdjAU1iXdLkw",
                        "canonicalBaseUrl": "/@NarendraModi"
                      }
                    },
                    "contentText": {
                      "runs": [{
                        "text": "Extremely saddened to learn about the tragic news of a boat accident involving Indian nationals near Phu Quoc, Vietnam."
                      }]
                    },
                    "publishedTimeText": {
                      "runs": [{ "text": "15 hours ago" }]
                    }
                  }
                }
              }
            }]
          }
        }]
      }
    }
  }
}
```

The mobile JSON renderer names remain `backstagePostThreadRenderer` and
`backstagePostRenderer`; the corresponding rendered DOM uses the
`ytm-backstage-*` tags and camelCase host classes documented in the renderer
inventory. JSON renderer keys and DOM tag names must not be conflated.

### Desktop YTD Posts browse response

The added desktop Posts payload selects:

```text
contents.twoColumnBrowseResultsRenderer.tabs[i].tabRenderer
```

with `title == "Posts"` and `selected == true`. Each feed row is:

```text
...content.sectionListRenderer.contents[0].itemSectionRenderer.contents[i]
  .backstagePostThreadRenderer.post.backstagePostRenderer
```

**Reduced Posts excerpt**:

```json
{
  "backstagePostThreadRenderer": {
    "post": {
      "backstagePostRenderer": {
        "postId": "Ugkx-zFt06jpu0gycE9kFwOkDTFZMP-VPQZA",
        "authorText": {
          "runs": [{
            "text": "Pitbull",
            "navigationEndpoint": {
              "browseEndpoint": {
                "browseId": "UCv8nzwVPQDRjkPCkEsOdEwA",
                "canonicalBaseUrl": "/@Pitbull"
              }
            }
          }]
        },
        "contentText": {
          "runs": [
            { "text": "Tomorrow's the day. Join me LIVE from " },
            {
              "text": "@BSTHydePark",
              "navigationEndpoint": {
                "browseEndpoint": {
                  "browseId": "UCr2hOkpuCoE739MafsT3wYg"
                }
              }
            }
          ]
        },
        "publishedTimeText": {
          "runs": [{ "text": "2 days ago" }]
        },
        "backstageAttachment": {
          "backstageImageRenderer": {}
        }
      }
    }
  }
}
```

Again, the linked `@BSTHydePark` identity belongs to a mention in the body. The
post owner remains the exact Pitbull `authorEndpoint`.

---

# Absolute JSON Trace: YTM Subscriptions Page (`FEsubscriptions`)
*Files: `YTM Channel Page JSON/YTM_SubscriberPage.json`, `YTM_SubscriberPage.html`*

*Captured: 2026-07-13 from the signed-in mobile YouTube Subscriptions surface.*

## Capture order and parsing boundary

The JSON evidence bundle contains these markers in order:

```text
1. /youtubei/v1/guide?prettyPrint=false
2. /youtubei/v1/browse?prettyPrint=false
3. FEED SUBSCRIBER PAGE SHEET /youtubei/v1/guide?prettyPrint=false
4. /getDatasyncIdsEndpoint
```

The first and third responses are guide/navigation chrome. They contain pivot
items, topbar/account menu data, and application links; they are not
subscription-feed card authority.

The browse marker contains **two concatenated top-level JSON objects**. Both
are continuation responses. Extract balanced objects individually before
calling `JSON.parse()`; parsing the whole marker body as one object will fail.
The capture does not contain the initial full `FEsubscriptions` browse tree.
Its rendered initial state is preserved in `YTM_SubscriberPage.html`.

The final datasync response uses an XSSI prefix and contains account-routing
identifiers. Treat those values as sensitive transport state, never as channel
IDs, profile IDs, or filtering authority.

## Subscription continuation response

Both captured browse objects use:

```text
onResponseReceivedActions[i].appendContinuationItemsAction
```

Fields:

- Feed target: `...appendContinuationItemsAction.targetId`
  -> `browse-feedFEsubscriptions`
- Appended rows:
  `...appendContinuationItemsAction.continuationItems[i]`
- Video card:
  `...continuationItems[i].richItemRenderer.content.videoWithContextRenderer`
- Next page:
  `...continuationItems[last].continuationItemRenderer.continuationEndpoint.continuationCommand`

Each captured response appends five video cards plus one continuation row.
This is append behavior, unlike Videos/Shorts channel sort chips, which use
`reloadContinuationItemsCommand` to replace a collection.

## Subscription video identity

For each `videoWithContextRenderer`:

- Video ID: `videoId`
- Title: `headline.runs[0].text`
- Watch endpoint: `navigationEndpoint.watchEndpoint.videoId`
- Channel name: `shortBylineText.runs[0].text`
- Channel UC ID:
  `shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- Channel handle:
  `shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl`
- Corroborating channel endpoint:
  `channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint`
- Published/streamed age: `publishedTimeText.runs[0].text`
- Views: `shortViewCountText.runs[0].text`
- Duration: `lengthText.runs[0].text`
- Menu: `menu.menuRenderer.items[]`

Prefer exact byline and thumbnail endpoints over visible text. If both
endpoints exist and disagree, preserve both observations for exact-video
identity resolution rather than silently choosing the enclosing feed.

**Reduced continuation excerpt**:

```json
{
  "onResponseReceivedActions": [{
    "appendContinuationItemsAction": {
      "targetId": "browse-feedFEsubscriptions",
      "continuationItems": [
        {
          "richItemRenderer": {
            "content": {
              "videoWithContextRenderer": {
                "videoId": "fW7GPoDxD_8",
                "headline": {
                  "runs": [{
                    "text": "Scarlett Johansson Doesn't Like Jump Scares"
                  }]
                },
                "shortBylineText": {
                  "runs": [{
                    "text": "TheEllenShow",
                    "navigationEndpoint": {
                      "browseEndpoint": {
                        "browseId": "UCp0hYYBW6IMayGgR-WeoCvQ",
                        "canonicalBaseUrl": "/@TheEllenShow"
                      }
                    }
                  }]
                },
                "navigationEndpoint": {
                  "watchEndpoint": {
                    "videoId": "fW7GPoDxD_8"
                  }
                },
                "publishedTimeText": {
                  "runs": [{ "text": "25 minutes ago" }]
                }
              }
            }
          }
        },
        {
          "continuationItemRenderer": {
            "continuationEndpoint": {
              "continuationCommand": {
                "request": "CONTINUATION_REQUEST_TYPE_BROWSE"
              }
            }
          }
        }
      ]
    }
  }]
}
```

The menu can contain YouTube feedback tokens for Hide/Undo actions. Those
tokens are ephemeral private page state and must not be logged, exported,
synced, or treated as FilterTube rule identifiers.

## Subscription-channel avatar strip and rendered feed

The rendered DOM begins with a channel-selector strip:

```html
<ytm-channel-list-sub-menu-renderer
  class="YtmChannelListSubMenuRendererHost">
  <div class="YtmChannelListSubMenuRendererAvatars">
    <ytm-channel-list-sub-menu-avatar-renderer
      class="YtmChannelListSubMenuAvatarRendererHost">
```

The capture contains 60 avatar rows. Each can expose a handle URL through
`a[href]`, display name through `a[aria-label]`, optional `status="unread"`,
and an avatar under `ytm-profile-icon.ytProfileIconHost`.

This strip is navigation/filter UI for subscribed channels. It is not a video
list, and selecting one channel must not create a block/allow rule. Its handles
may feed the explicit user-approved "Import Subscribed Channels" workflow.

The initial rendered feed proves:

| Content | DOM path | Correct hide target |
| --- | --- | --- |
| Normal/live videos | `ytm-rich-item-renderer -> ytm-video-with-context-renderer -> ytm-media-item` | Video-with-context card / owning rich item |
| Shorts shelf | `ytm-rich-section-renderer -> ytm-reel-shelf-renderer -> ytm-shorts-lockup-view-model` | Individual Shorts lockup, not the shelf |
| Next page | `ytm-continuation-item-renderer.YtmContinuationItemRendererHost` | Loading only; never content |

The DOM contains 18 normal video cards and 15 Shorts lockups. Normal card
identity is exposed through `YtmChannelThumbnailWithLinkRendererHost` and
`YtmBadgeAndBylineRendererHost`; Shorts may still need exact-video enrichment.

## All subscriptions directory (`FEchannels`)

The later `====== https://m.youtube.com/feed/channels ======` marker is a full
mobile HTML response, not a bare InnerTube JSON response. Its server script
stores a hex-escaped JSON string in `var ytInitialData`; decode the JavaScript
string and then parse the resulting JSON. The page contract identifies:

```text
ytPageType: browse
ytCommand.browseEndpoint.browseId: FEchannels
ytCommand.commandMetadata.webCommandMetadata.apiUrl: /youtubei/v1/browse
header.feedTabbedHeaderRenderer.title.runs[0].text: All subscriptions
```

The channel rows use this absolute path:

```text
contents
  .singleColumnBrowseResultsRenderer
  .tabs[0].tabRenderer
  .content.sectionListRenderer
  .contents[0].shelfRenderer
  .content.verticalListRenderer
  .items[i].channelListItemRenderer
```

Per row:

- display name: `title.runs[0].text`;
- canonical UC ID: `channelId`;
- corroborating UC ID: `navigationEndpoint.browseEndpoint.browseId`;
- channel handle/path:
  `navigationEndpoint.browseEndpoint.canonicalBaseUrl`;
- navigable URL:
  `navigationEndpoint.commandMetadata.webCommandMetadata.url`;
- avatar: `thumbnail.thumbnails[]`;
- row state: `presentationStyle` and, when present, new/live metadata; and
- pagination: the final
  `verticalListRenderer.items[].continuationItemRenderer`.

The captured initial page contains **984 channel rows** and one continuation
row. The direct `channelId` and browse endpoint make this stronger identity
evidence than the 60-item avatar selector on the Subscriptions feed.

**Reduced initial-data excerpt**:

```json
{
  "header": {
    "feedTabbedHeaderRenderer": {
      "title": {
        "runs": [{ "text": "All subscriptions" }]
      }
    }
  },
  "contents": {
    "singleColumnBrowseResultsRenderer": {
      "tabs": [{
        "tabRenderer": {
          "tabIdentifier": "FEchannels",
          "content": {
            "sectionListRenderer": {
              "contents": [{
                "shelfRenderer": {
                  "content": {
                    "verticalListRenderer": {
                      "items": [{
                        "channelListItemRenderer": {
                          "title": {
                            "runs": [{ "text": "*NSYNC" }]
                          },
                          "channelId": "UCjkyfFH-MWZhasolgds05EA",
                          "navigationEndpoint": {
                            "browseEndpoint": {
                              "browseId": "UCjkyfFH-MWZhasolgds05EA",
                              "canonicalBaseUrl": "/@OfficialNSYNC"
                            }
                          },
                          "presentationStyle": { "style": "NONE" }
                        }
                      }, {
                        "continuationItemRenderer": {
                          "continuationEndpoint": {
                            "continuationCommand": {
                              "token": "<opaque continuation>"
                            }
                          }
                        }
                      }]
                    }
                  }
                }
              }]
            }
          }
        }
      }]
    }
  }
}
```

This directory is an explicit navigation/import source. FilterTube may use it
when the user chooses **Import Subscribed Channels**, but merely loading,
continuing, or selecting a row must never add, remove, block, or allow a
channel automatically. Opaque continuation and tracking values must not be
persisted as rule identity.

---

# Absolute JSON Trace: YTM You Page (`FElibrary`)
*Files: `YTM Channel Page JSON/YTM_You_Page/YTM_YOU_Page.json`, `YTM_YOU_PAGE.html`*

*Captured: 2026-07-12 from the signed-in mobile YouTube You/Library surface.*

## Evidence-file and response order

Each `====== ... ======` marker starts a new captured resource. The files are
documented below one at a time, and resources within each file retain capture
order:

| Evidence file | Captured resources in order |
| --- | --- |
| `YTM_YOU_Page.json` | Player JSON -> `FElibrary` Browse JSON -> `/feed/library` HTML |
| `YTM_YOU_Page_AccountSwitcher.json` | Settings-origin `/getAccountSwitcherEndpoint` response |
| `YTM_YOU_Page_History.json` | Initial `FEhistory` Browse -> next continuation Browse -> `/feed/history` HTML |
| `YTM_YOU_Page_Playlists.json` | Recently added Browse -> A-Z reload Browse |
| `YTM_YOU_Page_Settings.json` | `account/get_setting` -> `guide` -> `getDatasyncIdsEndpoint` -> `/select_site` HTML |

Exact literal marker lines in the current evidence files:

| File | Marker lines |
| --- | --- |
| `YTM_YOU_Page.json` | 1 Player; 1349 `FElibrary` Browse; 29713 Library HTML |
| `YTM_YOU_PAGE.html` | 1 You; 11606 Settings; 12009 History; 44993 Playlists |
| `YTM_YOU_Page_AccountSwitcher.json` | 1 account switcher |
| `YTM_YOU_Page_History.json` | 1 initial History; 72063 continuation; 144668 History HTML |
| `YTM_YOU_Page_Playlists.json` | 1 Recently added; 31422 A-Z |
| `YTM_YOU_Page_Settings.json` | 1 settings; 6945 Guide; 7800 datasync; 7883 select-site HTML |

These line numbers are evidence boundaries for the current captured files, not
runtime API constants. Recompute them if a fixture is appended.

Capture bundles are not necessarily valid as one JSON document. Strip the
human marker and any endpoint-specific XSSI prefix, then parse one balanced
top-level object at a time.

**Literal capture markers, in file order**:

```text
YTM_YOU_Page.json
  YTM You Page player?prettyPrint=false
  YTM You Page browse?prettyPrint=false
  https: //m.youtube.com/feed/library?ra=m

YTM_YOU_Page_AccountSwitcher.json
  https: //m.youtube.com/getAccountSwitcherEndpoint

YTM_YOU_Page_History.json
  YTM You Page HISTORY browse?prettyPrint=false
  YTM You Page HISTORY browse?prettyPrint=false  NEXT CHUNK JSON
  https: //m.youtube.com/feed/history?ra=m

YTM_YOU_Page_Playlists.json
  YTM You Page PLAYLISTS browse?prettyPrint=false SORTED BY RECENTLY
  YTM You Page PLAYLISTS browse?prettyPrint=false SORTED BY A-Z

YTM_YOU_Page_Settings.json
  https: //m.youtube.com/youtubei/v1/account/get_setting?prettyPrint=false
  https: //m.youtube.com/youtubei/v1/guide?prettyPrint=false
  https: //m.youtube.com/getDatasyncIdsEndpoint
  https://m.youtube.com/select_site?ra=m
```

The spaces after `https:` occur in the human capture labels; normalize them
only when interpreting the URL, not while locating evidence boundaries.

This capture bundle contains three resources separated by `======` markers:

1. `/youtubei/v1/player?prettyPrint=false` for `_Wcf2rKEB8E`;
2. `/youtubei/v1/browse?prettyPrint=false` for `browseId: "FElibrary"`; and
3. the complete `https://m.youtube.com/feed/library?ra=m` HTML document.

The Player response is playback/identity evidence for one video that happened
to be loaded during capture. It is not the You-page feed. The Browse response
is the authoritative structured You-page payload.

The separate `YTM_YOU_PAGE.html` bundle preserves four rendered surfaces in
chronological order: the You overview, Settings, History, and Playlists with
the Recently added/A-Z sorting control. Its DOM is companion evidence for the
JSON paths below; DOM classes do not replace structured browse identity.

## Player response bundled with the capture

**Root fields**:

- Playability: `playabilityStatus.status`
- Video ID: `videoDetails.videoId`
- Title: `videoDetails.title`
- Duration: `videoDetails.lengthSeconds`
- Owner channel ID: `videoDetails.channelId`
- Owner name: `videoDetails.author`
- Publish/upload dates:
  `microformat.playerMicroformatRenderer.publishDate` and `.uploadDate`
- Corroborating owner ID:
  `microformat.playerMicroformatRenderer.externalChannelId`

This response provides another exact-video identity observation for the
Shakira/VEVO case documented later: `_Wcf2rKEB8E` reports
`UCGnjeahCJW1AF34HBmQTJ-Q` / `shakiraVEVO`. It does not replace the separate
current creator/card alias `UCYLNGLIzMhRTi6ZOLjAPSmw`.

```json
{
  "playabilityStatus": { "status": "OK" },
  "videoDetails": {
    "videoId": "_Wcf2rKEB8E",
    "title": "Shakira - La Pared (Anniversary Version)",
    "lengthSeconds": "177",
    "channelId": "UCGnjeahCJW1AF34HBmQTJ-Q",
    "author": "shakiraVEVO"
  },
  "microformat": {
    "playerMicroformatRenderer": {
      "publishDate": "2025-10-22T06:01:18-07:00",
      "uploadDate": "2025-10-22T06:01:18-07:00",
      "ownerChannelName": "shakiraVEVO",
      "externalChannelId": "UCGnjeahCJW1AF34HBmQTJ-Q"
    }
  }
}
```

## You-page browse root and signed-in profile header

**Tab base**:

```text
contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer
```

**You-page discriminator**:

- `...tabRenderer.endpoint.browseEndpoint.browseId == "FElibrary"`
- `...tabRenderer.tabIdentifier == "FElibrary"`
- `...tabRenderer.selected == true`

**Signed-in profile header**:

- Display name:
  `header.pageHeaderRenderer.content.pageHeaderViewModel.title.dynamicTextViewModel.text.content`
- Profile channel ID:
  `...title.dynamicTextViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- Avatar:
  `...pageHeaderViewModel.image.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources[n].url`
- Handle:
  `...pageHeaderViewModel.metadata.contentMetadataViewModel.metadataRows[0].metadataParts[0].text.content`

The captured profile is `Devansh Varshney`, `@varshneydevansh`, channel
`UCCNAxDIG4VWcXBL3wCt76UQ`. These are private capture values and must never be
hardcoded or treated as the owner of cards displayed in History or Playlists.

```json
{
  "contents": {
    "singleColumnBrowseResultsRenderer": {
      "tabs": [{
        "tabRenderer": {
          "endpoint": {
            "browseEndpoint": { "browseId": "FElibrary" }
          },
          "selected": true,
          "tabIdentifier": "FElibrary",
          "content": {
            "sectionListRenderer": { "contents": [] }
          }
        }
      }]
    }
  },
  "header": {
    "pageHeaderRenderer": {
      "content": {
        "pageHeaderViewModel": {
          "title": {
            "dynamicTextViewModel": {
              "text": { "content": "Devansh Varshney" },
              "rendererContext": {
                "commandContext": {
                  "onTap": {
                    "innertubeCommand": {
                      "browseEndpoint": {
                        "browseId": "UCCNAxDIG4VWcXBL3wCt76UQ"
                      }
                    }
                  }
                }
              }
            }
          },
          "metadata": {
            "contentMetadataViewModel": {
              "metadataRows": [{
                "metadataParts": [{
                  "text": { "content": "@varshneydevansh" }
                }]
              }]
            }
          }
        }
      }
    }
  }
}
```

## History shelf

**Shelf**:

```text
...tabRenderer.content.sectionListRenderer.contents[0]
  .itemSectionRenderer.contents[0].horizontalCardListRenderer
```

- Shelf title: `...header.richListHeaderRenderer.title.runs[0].text`
  -> `History`
- Full-history browse ID: `...header.richListHeaderRenderer.endpoint.browseEndpoint.browseId`
  -> `FEhistory`
- Cards: `...horizontalCardListRenderer.cards[i].videoCardRenderer`

**Video card fields**:

- Video ID: `...videoCardRenderer.videoId`
- Title: `...videoCardRenderer.title.runs[0].text`
- Channel name: `...videoCardRenderer.bylineText.runs[0].text`
- Channel ID:
  `...videoCardRenderer.bylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- Watch target: `...videoCardRenderer.navigationEndpoint.watchEndpoint.videoId`
- Thumbnail: `...videoCardRenderer.thumbnail.thumbnails[n].url`
- Duration: locate `thumbnailOverlayTimeStatusRenderer.text`
- Watched progress: locate `thumbnailOverlayResumePlaybackRenderer.percentDurationWatched`
- Remove-history action: find the menu item whose text is
  `Remove from watch history`; its service endpoint uses `/youtubei/v1/feedback`

```json
{
  "horizontalCardListRenderer": {
    "header": {
      "richListHeaderRenderer": {
        "title": { "runs": [{ "text": "History" }] },
        "endpoint": {
          "browseEndpoint": { "browseId": "FEhistory" }
        }
      }
    },
    "cards": [{
      "videoCardRenderer": {
        "videoId": "hHUbLv4ThOo",
        "title": {
          "runs": [{
            "text": "Pitbull, Ke$ha - Timber (featuring Ke$ha - Official Video)"
          }]
        },
        "bylineText": {
          "runs": [{
            "text": "Pitbull",
            "navigationEndpoint": {
              "browseEndpoint": {
                "browseId": "UCv8nzwVPQDRjkPCkEsOdEwA"
              }
            }
          }]
        },
        "navigationEndpoint": {
          "watchEndpoint": { "videoId": "hHUbLv4ThOo" }
        }
      }
    }]
  }
}
```

## Playlists shelf

**Shelf**:

```text
...tabRenderer.content.sectionListRenderer.contents[1]
  .itemSectionRenderer.contents[0].horizontalCardListRenderer
```

- Shelf title: `...header.richListHeaderRenderer.title.runs[0].text`
  -> `Playlists`
- Aggregation browse ID:
  `...header.richListHeaderRenderer.endpoint.browseEndpoint.browseId`
  -> `FEplaylist_aggregation`
- Cards: `...horizontalCardListRenderer.cards[i].playlistCardRenderer`
- Playlist title: `...playlistCardRenderer.title.runs[0].text`
- Privacy/type byline: `...playlistCardRenderer.bylineText.runs[].text`
- Playlist browse ID:
  `...playlistCardRenderer.navigationEndpoint.browseEndpoint.browseId`
- Playlist ID for destructive/edit actions:
  `...deletePlaylistEndpoint.playlistId` or `...playlistEditorEndpoint.playlistId`

```json
{
  "horizontalCardListRenderer": {
    "header": {
      "richListHeaderRenderer": {
        "title": { "runs": [{ "text": "Playlists" }] },
        "endpoint": {
          "browseEndpoint": { "browseId": "FEplaylist_aggregation" }
        }
      }
    },
    "cards": [{
      "playlistCardRenderer": {
        "title": { "runs": [{ "text": "Liked videos" }] },
        "bylineText": {
          "runs": [
            { "text": "Private" },
            { "text": " · " },
            { "text": "Playlist" }
          ]
        },
        "navigationEndpoint": {
          "browseEndpoint": { "browseId": "VLLL" }
        }
      }
    }]
  }
}
```

`Liked videos` uses the special playlist target `VLLL`; user-created playlists
use `VL` plus their playlist ID. A title such as `Liked videos` is display text,
not the stable identity.
The parallel account-maintained `Watch Later` preview uses `VLWL`.

## Library shortcut links

The final item section contains `compactLinkRenderer` entries rather than
filterable video cards. Captured destinations include:

| Label | Stable destination |
| --- | --- |
| Your videos | Profile channel browse ID and `/channel/{UCID}/videos` |
| Films | `FEstorefront` |
| Courses | `FEcourses` |
| Help | External Support URL |
| Feedback | `userFeedbackEndpoint` |
| Get YouTube Premium | `SPunlimited` |

These are navigation controls. Channel/keyword filtering must not hide them as
if they were content cards.

## Full HTML wrapper

The `/feed/library?ra=m` capture contains configuration objects and the page's
serialized initial data. When extracting from HTML, locate and decode the
`ytInitialData` assignment, then apply the same `FElibrary` paths above.
Do not scan unrelated `ytcfg`, localization strings, or player configuration
objects as if they were Library feed renderers.

## Settings-origin account switcher endpoint

*File: `YTM Channel Page JSON/YTM_You_Page/YTM_YOU_Page_AccountSwitcher.json`*

**Endpoint**: `GET /getAccountSwitcherEndpoint`

**Invocation surface**: YouTube Settings/account switching. This is not a
child payload of `FElibrary`; it is documented beside the You page because its
selected identity determines the profile header and private Library data that
subsequent You-page requests return.

The response begins with an XSSI guard (`)]}'`) before the JSON object. Strip
that guard and parse from the first object whose root contains
`code: "SUCCESS"` and `data`.

**Popup root**:

```text
data.actions[0].openPopupAction.popup.multiPageMenuRenderer
```

**Account sections**:

```text
...multiPageMenuRenderer.sections[i].accountSectionListRenderer
  .contents[j].accountItemSectionRenderer.contents[k].accountItem
```

**Account/channel fields**:

- Display name: `...accountItem.accountName.runs[0].text`
- Avatar: `...accountItem.accountPhoto.thumbnails[n].url`
- Selected identity: `...accountItem.isSelected`
- Disabled identity: `...accountItem.isDisabled`
- Has a YouTube channel: `...accountItem.hasChannel`
- Subscriber/no-channel byline: `...accountItem.accountByline.runs[].text`
- Channel handle: `...accountItem.channelHandle.runs[0].text` (optional)
- Switch command: `...accountItem.serviceEndpoint.selectActiveIdentityEndpoint`
- Post-switch destination:
  `...selectActiveIdentityEndpoint.nextNavigationEndpoint.urlEndpoint.url`
- Google-account grouping header:
  `...accountSectionListRenderer.header.googleAccountHeaderRenderer`
- Other-account group label:
  `...accountSectionListRenderer.header.accountsDialogHeaderRenderer`
- Per-account email/group label:
  `...accountItemSectionRenderer.header.accountItemSectionHeaderRenderer.title.runs[0].text`

The permanent fixture contains three account-section groups, seven rows, one
selected row, one `hasChannel: false` row, and four rows with an optional
`pageIdToken`. Those are capture counts, not fixed product limits. Primary or
no-channel rows can omit `pageIdToken`; all row arrays must be traversed rather
than addressed by a fixed index.

**Sensitive switch tokens**:

```text
...selectActiveIdentityEndpoint.supportedTokens[].pageIdToken
...selectActiveIdentityEndpoint.supportedTokens[].accountStateToken
...supportedTokens[].offlineCacheKeyToken
...supportedTokens[].accountSigninToken
...supportedTokens[].datasyncIdToken
```

These values are authentication/session routing material, not channel IDs and
not FilterTube profile identities. Never log, export, synchronize, persist in
FilterTube settings, or place their real values in public documentation.
FilterTube should observe the resulting active YouTube identity after the
switch rather than replaying these private tokens itself.

**Reduced redacted structure**:

```json
{
  "code": "SUCCESS",
  "data": {
    "actions": [{
      "openPopupAction": {
        "popup": {
          "multiPageMenuRenderer": {
            "header": {
              "simpleMenuHeaderRenderer": {
                "title": { "runs": [{ "text": "Accounts" }] }
              }
            },
            "sections": [{
              "accountSectionListRenderer": {
                "contents": [{
                  "accountItemSectionRenderer": {
                    "contents": [{
                      "accountItem": {
                        "accountName": {
                          "runs": [{ "text": "Account display name" }]
                        },
                        "isSelected": true,
                        "isDisabled": false,
                        "hasChannel": true,
                        "channelHandle": {
                          "runs": [{ "text": "@channelHandle" }]
                        },
                        "serviceEndpoint": {
                          "selectActiveIdentityEndpoint": {
                            "supportedTokens": [
                              { "accountStateToken": { "hasChannel": true } },
                              { "offlineCacheKeyToken": { "clientCacheKey": "REDACTED" } },
                              { "accountSigninToken": { "signinUrl": "REDACTED" } },
                              { "datasyncIdToken": { "datasyncIdToken": "REDACTED" } }
                            ],
                            "nextNavigationEndpoint": {
                              "urlEndpoint": {
                                "url": "https://m.youtube.com/feed/library?ra=m"
                              }
                            }
                          }
                        }
                      }
                    }]
                  }
                }]
              }
            }]
          }
        }
      }
    }]
  }
}
```

An `accountItem` with `hasChannel: false` is a Google identity without a
YouTube channel. It must not be synthesized into a blockable channel. The
footer `compactLinkRenderer` entries such as `Add account` and `Sign out` are
account actions, not content cards.

### Correlated before/after channel-profile switch evidence

The following three preserved responses form one bounded switch trace. They
must be interpreted in capture order rather than merged into one JSON object:

| Evidence | Response role | Proven identity state |
| --- | --- | --- |
| `/Users/devanshvarshney/.codex/attachments/1a2a4453-7685-469d-87dd-82ea52cea889/pasted-text.txt` | `getAccountSwitcherEndpoint` chooser response | `@varshneydevansh` channel row selected; `@ttv_tej` row available but unselected |
| `/Users/devanshvarshney/.codex/attachments/586f94a5-d7cf-4cf0-a6af-3883f035e2df/pasted-text.txt` | Wrapped `FElibrary` Browse response | Pre-switch You header remains `@varshneydevansh`; 16 History cards, 130 Playlist cards, two horizontal shelves, six compact links, and no continuation row |
| `/Users/devanshvarshney/.codex/attachments/f303874c-2a5c-459d-826a-705b2036a4d3/pasted-text.txt` | Post-selection `guide` response | Active account header is Tej / `@ttv_tej`; the `Your channel` menu endpoint carries Tej's canonical UC browse ID |

A fourth attachment is a later, independent chooser epoch rather than part of
that three-response chronology:

```text
/Users/devanshvarshney/.codex/attachments/
  a27394fc-aa80-4edf-8b8e-35bfc030ace8/pasted-text.txt
```

After stripping its XSSI prefix, it contains only one
`getAccountSwitcherEndpoint` response body. It has three account sections and
seven rows; its selected row reports `hasChannel: false`, has no handle, and
has no `pageIdToken`. All seven rows omit `channelHandle`. This does not
contradict the earlier selected channel-backed row: it proves that chooser
fields are response-epoch-dependent and that the same display name can occur
on distinct channel-backed and no-channel identities.

Traverse all `sections[]`, section `contents[]`, and row `contents[]`. A fixed
index such as `sections[0]...contents[1]` is invalid: in this later response,
the first group exposes only one account row.

**Pre-switch chooser root**:

```text
data.actions[0].openPopupAction.popup.multiPageMenuRenderer
  .sections[i].accountSectionListRenderer
  .contents[j].accountItemSectionRenderer
  .contents[k].accountItem
```

The selected-row fields and response-owned switch command are:

```text
...accountItem.isSelected
...accountItem.hasChannel
...accountItem.serviceEndpoint.selectActiveIdentityEndpoint
...selectActiveIdentityEndpoint.supportedTokens[]
...selectActiveIdentityEndpoint.nextNavigationEndpoint
```

**Pre-switch You header**:

```text
response.header.pageHeaderRenderer.content.pageHeaderViewModel
  .title.dynamicTextViewModel.text.content
response.header.pageHeaderRenderer.content.pageHeaderViewModel
  .title.dynamicTextViewModel.rendererContext.commandContext.onTap
  .innertubeCommand.browseEndpoint.browseId
response.header.pageHeaderRenderer.content.pageHeaderViewModel
  .metadata.contentMetadataViewModel.metadataRows[0]
  .metadataParts[0].text.content
```

**Post-switch Guide owner**:

```text
items[1].mobileTopbarRenderer.buttons[0].topbarMenuButtonRenderer
  .menuRenderer.multiPageMenuRenderer.header.activeAccountHeaderRenderer

...activeAccountHeaderRenderer.accountName.runs[0].text
...activeAccountHeaderRenderer.channelHandle.runs[0].text

items[1].mobileTopbarRenderer.buttons[0].topbarMenuButtonRenderer
  .menuRenderer.multiPageMenuRenderer.sections[0]
  .multiPageMenuSectionRenderer.items[0].compactLinkRenderer
  .navigationEndpoint.browseEndpoint.browseId
```

Additional response-context evidence:

```text
responseContext.maxAgeSeconds
responseContext.serviceTrackingParams[].params[]
  [key == "encrypted_pageid"].value
```

The captured pre- and post-switch Guides use `maxAgeSeconds: 3600`. That is a
provider response-cache hint, not permission to reuse a pre-switch owner after
selection; explicitly switching accounts requires a fresh Guide verification.
`encrypted_pageid` is opaque session decoration and must not be decoded,
persisted, logged, or used as the durable account key.

This proves that YouTube accepted the
`@varshneydevansh -> @ttv_tej` channel-profile change at the post-switch Guide
identity layer. It does **not** prove that a Tej-owned Home, `FElibrary`,
History, Subscriptions, continuation, Like, or comment response was fetched
after that switch: the supplied Library response is explicitly the pre-switch
Devansh snapshot.

The switcher response describes a provider-owned
`selectActiveIdentityEndpoint`, but the captures do not contain the exact
network request by which MWEB commits that command. Do not invent a generic
`/browse` or `/next` POST containing copied token values. The safe existing
boundary is to let the authenticated MWEB client execute the response-owned
command, then verify the resulting canonical UC browse ID from a new Guide or
equivalent strong account response before committing native account state.

The permanent account-switcher fixture and the chronological attachment are
different response epochs. Across them, the same display name can identify a
channel-backed row and a separate `hasChannel: false` Google identity. Display
name, email-group header, `authuser`, page ID, Gaia ID, datasync value, handle,
and avatar are therefore not interchangeable account keys. Only the verified
canonical YouTube UC browse ID may become FilterTube's durable linked identity;
the other fields remain presentation aliases or opaque provider session data.

### Switch-support calls: exact authority limits

| Call/object | What the capture proves | What it does not prove |
| --- | --- | --- |
| `GET /getAccountSwitcherEndpoint` | Grouped account/channel rows plus exact selection commands | That reading the menu performs a switch |
| `selectActiveIdentityEndpoint` | Provider semantic command with session-owned supported tokens and next navigation | Which private token MWEB consumes internally or a stable public POST schema |
| `POST /youtubei/v1/guide` | Current pivot/topbar/menu state and a strongly correlated active channel endpoint | Account page content or successful engagement writes |
| `GET /getDatasyncIdsEndpoint` | Opaque session relationships available to the current cookie jar | Selected order, canonical UC mapping, or FilterTube permission |
| `POST /youtubei/v1/browse` | Account-owned content consumed from the already active provider session | The identity mutation mechanism itself |
| `/api/jnn/v1/GenerateIT` | Mentioned in a user-supplied DevTools analysis, but not present in the preserved raw fixtures above | Its purpose, expiry contract, downstream header, or required account-switch usage |

`datasyncIds[]` has no `isSelected` field and no canonical channel
`browseEndpoint`. Array position must not be interpreted as the active owner.
Likewise, `encrypted_pageid` in response tracking is opaque account-context
evidence; it does not replace a canonical UC observation.

All supported switch tokens, datasync values, sign-in URLs, Google account
group labels, authorization material, integrity responses, cookies, and
tracking/feedback tokens are private session state. Documentation and runtime
diagnostics may retain only field presence, row counts, response status,
duration buckets, safe handle/name aliases when appropriate, and whether a
canonical UC verification succeeded. Never copy the real opaque values into
logs, backups, FilterTube profiles, or reduced examples.

## Watch History browse and continuation

*File: `YTM Channel Page JSON/YTM_You_Page/YTM_YOU_Page_History.json`*

The capture contains three resources:

1. initial `POST /youtubei/v1/browse?prettyPrint=false` for `FEhistory`;
2. a subsequent Browse continuation response; and
3. the complete `/feed/history?ra=m` HTML page.

Observed renderer counts are capture diagnostics, not fixed API limits:

| Capture segment | Normal videos | Shorts | Continuation behavior |
| --- | ---: | ---: | --- |
| Initial History JSON | 146 `compactVideoRenderer` | 54 `shortsLockupViewModel` across two shelves | One next-page row |
| Next History JSON | 174 `compactVideoRenderer` | 25 `shortsLockupViewModel` across three shelves | `appendContinuationItemsAction`, target `browse-feedFEhistory`, then one next-page row |
| Rendered History DOM | 324 `ytm-compact-video-renderer` | 75 `ytm-shorts-lockup-view-model` across five shelves | One continuation host |

The two JSON responses total 320 normal videos plus 79 Shorts; the DOM totals
324 plus 75. Both contain 399 content cards. The family split differs because
the responses and DOM were captured/materialized at different moments. Code
must dispatch by the renderer actually returned; it must not assert these
individual family counts as a permanent equality.

**Initial item base**:

```text
contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer
  .content.sectionListRenderer.contents[i].itemSectionRenderer
```

**Continuation base**:

```text
onResponseReceivedActions[0].appendContinuationItemsAction
  .continuationItems[i].itemSectionRenderer
```

History is grouped into date sections. The capture includes labels such as
`Today`, `Yesterday`, weekday names, and localized day/month strings.

- Date header: `...itemSectionRenderer.header.itemSectionHeaderRenderer.title`
- Normal videos: `...itemSectionRenderer.contents[i].compactVideoRenderer`
- Shorts group: `...itemSectionRenderer.contents[i].reelShelfRenderer.items[j].shortsLockupViewModel`
- Next-page token:
  `...continuationItemRenderer.continuationEndpoint.continuationCommand.token`
- Initial reload token:
  `...sectionListRenderer.continuations[0].reloadContinuationData.continuation`

### Normal history video

- Video ID: `...compactVideoRenderer.videoId`
- Title: `...compactVideoRenderer.title.runs[0].text`
- Channel/byline text: `...compactVideoRenderer.longBylineText.runs[0].text`
- Direct channel ID when present:
  `...longBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- Collaborator sheet when present:
  `...longBylineText.runs[0].navigationEndpoint.showSheetCommand`
- View count: `...compactVideoRenderer.viewCountText.runs[0].text`
- Watch target: `...compactVideoRenderer.navigationEndpoint.watchEndpoint.videoId`
- Watched progress: locate `thumbnailOverlayResumePlaybackRenderer.percentDurationWatched`
- Duration: locate `thumbnailOverlayTimeStatusRenderer.text`

A History card can contain the same header-backed Collaborators sheet as
Search or Watch recommendations. Preserve that exact-video roster; do not
flatten text such as `HBO Max and 2 more` into guessed names.

```json
{
  "itemSectionRenderer": {
    "header": {
      "itemSectionHeaderRenderer": {
        "title": { "runs": [{ "text": "Today" }] }
      }
    },
    "contents": [{
      "compactVideoRenderer": {
        "videoId": "hHUbLv4ThOo",
        "title": {
          "runs": [{
            "text": "Pitbull, Ke$ha - Timber (featuring Ke$ha - Official Video)"
          }]
        },
        "longBylineText": {
          "runs": [{
            "text": "Pitbull",
            "navigationEndpoint": {
              "browseEndpoint": {
                "browseId": "UCv8nzwVPQDRjkPCkEsOdEwA"
              }
            }
          }]
        },
        "navigationEndpoint": {
          "watchEndpoint": { "videoId": "hHUbLv4ThOo" }
        }
      }
    }]
  }
}
```

### History Shorts group

```json
{
  "itemSectionRenderer": {
    "contents": [{
      "reelShelfRenderer": {
        "items": [{
          "shortsLockupViewModel": {
            "onTap": {
              "innertubeCommand": {
                "commandMetadata": {
                  "webCommandMetadata": {
                    "url": "/shorts/2CGCoTuMX8U"
                  }
                },
                "reelWatchEndpoint": {
                  "videoId": "2CGCoTuMX8U"
                }
              }
            },
            "overlayMetadata": {
              "primaryText": { "content": "My Back Hurts..." },
              "secondaryText": { "content": "3.7 lakh views" }
            }
          }
        }]
      }
    }]
  }
}
```

### Continuation response

```json
{
  "onResponseReceivedActions": [{
    "appendContinuationItemsAction": {
      "continuationItems": [
        { "itemSectionRenderer": { "contents": [] } },
        {
          "continuationItemRenderer": {
            "continuationEndpoint": {
              "continuationCommand": {
                "token": "opaque-history-token",
                "request": "CONTINUATION_REQUEST_TYPE_BROWSE"
              }
            }
          }
        }
      ]
    }
  }]
}
```

History continuations append date sections; unlike a sort-chip response, they
do not use `reloadContinuationItemsCommand` in this capture.

### History mutation controls

Per-card removal is exposed through a menu item whose text is
`Remove from watch history` and whose service command posts to
`/youtubei/v1/feedback`. The response may include a toast such as
`All views of this video removed from history`.

Page-level controls are under:

```text
toolbarMenu.menuRenderer.items[]
```

Captured actions include:

- `Pause watch history` -> confirmation dialog -> `/youtubei/v1/feedback`
- `Clear all watch history` -> confirmation dialog -> `/youtubei/v1/feedback`
- `Manage all history` -> external `myactivity.google.com` URL

Feedback tokens and confirmation text can contain private account details.
They are transient mutation authority and must never be logged, exported, or
used as filtering identity. FilterTube should filter rendered History cards,
not invoke destructive YouTube-history actions automatically.

The full HTML capture again embeds initial page data among configuration and
localized strings. Decode only the `ytInitialData` payload before applying the
paths above.

## Playlist aggregation and sorting

*File: `YTM Channel Page JSON/YTM_You_Page/YTM_YOU_Page_Playlists.json`*

This file contains two Browse responses in chronological interaction order:

1. full `FEplaylist_aggregation` page sorted by `Recently added`; and
2. an `A-Z` sort response that reloads the existing grid target.

The Recently added response contains 129 playlist `lockupViewModel` rows. The
A-Z replacement contains 131 rows. The separately captured rendered DOM
contains 130 `yt-lockup-view-model` rows. These are chronological account/page
snapshots, not a contradiction and not a fixed playlist-total contract. Sort
selection must apply the returned `reloadContinuationItemsCommand` atomically
to its target grid and re-run filtering on exactly those replacement rows.

### Initial Recently added response

**Item base**:

```text
contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer
  .content.richGridRenderer.contents[i].richItemRenderer.content.lockupViewModel
```

**Playlist fields**:

- Stable playlist ID: `...lockupViewModel.contentId`
- Type: `...lockupViewModel.contentType`
  -> `LOCKUP_CONTENT_TYPE_PLAYLIST`
- Title: `...metadata.lockupMetadataViewModel.title.content`
- Metadata rows:
  `...metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows[]`
- Owner/channel ID when supplied:
  `...metadataParts[].text.commandRuns[].onTap.innertubeCommand.browseEndpoint.browseId`
- Playlist target:
  `...rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- Video-count badge:
  `...collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel.overlays[].thumbnailOverlayBadgeViewModel.thumbnailBadges[].thumbnailBadgeViewModel.text`

Special playlists use special IDs. In the capture, `Liked videos` has
`contentId: "LL"` and browse target `VLLL`; ordinary playlists use `PL...` and
`VLPL...` forms.
`Watch Later` has `contentId: "WL"` and browse target `VLWL`.

```json
{
  "richItemRenderer": {
    "content": {
      "lockupViewModel": {
        "contentImage": {
          "collectionThumbnailViewModel": {
            "primaryThumbnail": {
              "thumbnailViewModel": {
                "overlays": [{
                  "thumbnailOverlayBadgeViewModel": {
                    "thumbnailBadges": [{
                      "thumbnailBadgeViewModel": {
                        "text": "5,000 videos"
                      }
                    }]
                  }
                }]
              }
            }
          }
        },
        "metadata": {
          "lockupMetadataViewModel": {
            "title": { "content": "Liked videos" },
            "metadata": {
              "contentMetadataViewModel": {
                "metadataRows": [
                  {
                    "metadataParts": [
                      { "text": { "content": "Private" } },
                      { "text": { "content": "Playlist" } }
                    ]
                  },
                  {
                    "metadataParts": [{
                      "text": { "content": "Updated today" }
                    }]
                  }
                ]
              }
            }
          }
        },
        "contentId": "LL",
        "contentType": "LOCKUP_CONTENT_TYPE_PLAYLIST",
        "rendererContext": {
          "commandContext": {
            "onTap": {
              "innertubeCommand": {
                "browseEndpoint": { "browseId": "VLLL" }
              }
            }
          }
        }
      }
    }
  }
}
```

### Sort dropdown

The visible sort control is one dropdown chip:

```text
...richGridRenderer.header.chipBarViewModel.chips[0].chipViewModel
```

- Current label: `...chipViewModel.text`
- Accessibility label: `...chipViewModel.accessibilityLabel`
- Dropdown marker:
  `...displayType == "CHIP_VIEW_MODEL_DISPLAY_TYPE_DROP_DOWN"`
- Choices:
  `...tapCommand.innertubeCommand.showSheetCommand...listViewModel.listItems[]`
- Choice label: `...listItemViewModel.title.content`
- Choice state update: locate `entityUpdateCommand.entityBatchUpdate`
- Choice Browse token: locate `continuationCommand.token`

Captured choices are `Recently added` and `A-Z`. They are sort modes, not
filtering categories or playlist ownership.

```json
{
  "chipViewModel": {
    "text": "Recently added",
    "displayType": "CHIP_VIEW_MODEL_DISPLAY_TYPE_DROP_DOWN",
    "tapCommand": {
      "innertubeCommand": {
        "showSheetCommand": {
          "panelLoadingStrategy": {
            "inlineContent": {
              "sheetViewModel": {
                "content": {
                  "listViewModel": {
                    "listItems": [
                      {
                        "listItemViewModel": {
                          "title": { "content": "A-Z" },
                          "rendererContext": {
                            "commandContext": {
                              "onTap": {
                                "innertubeCommand": {
                                  "commandExecutorCommand": {
                                    "commands": [
                                      { "entityUpdateCommand": {} },
                                      {
                                        "continuationCommand": {
                                          "token": "opaque-a-z-token",
                                          "request": "CONTINUATION_REQUEST_TYPE_BROWSE"
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
                          "title": { "content": "Recently added" }
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
```

### A-Z reload response

The second response keeps a skeletal selected tab and replaces the existing
grid by target ID:

```text
onResponseReceivedActions[0].reloadContinuationItemsCommand
```

- Target: `...reloadContinuationItemsCommand.targetId`
- Replacement items: `...continuationItems[i].richItemRenderer.content.lockupViewModel`

```json
{
  "contents": {
    "singleColumnBrowseResultsRenderer": {
      "tabs": [{
        "tabRenderer": {
          "selected": true,
          "targetId": "playlist-grid-target"
        }
      }]
    }
  },
  "onResponseReceivedActions": [{
    "reloadContinuationItemsCommand": {
      "targetId": "playlist-grid-target",
      "continuationItems": [{
        "richItemRenderer": {
          "content": {
            "lockupViewModel": {
              "metadata": {
                "lockupMetadataViewModel": {
                  "title": {
                    "content": "15: Twitter Bot Tutorial - Node.js and Processing"
                  }
                }
              },
              "contentId": "PLRqwX-V7Uu6atTSxoRiVnSuOn6JHnq2yV",
              "contentType": "LOCKUP_CONTENT_TYPE_PLAYLIST",
              "rendererContext": {
                "commandContext": {
                  "onTap": {
                    "innertubeCommand": {
                      "browseEndpoint": {
                        "browseId": "VLPLRqwX-V7Uu6atTSxoRiVnSuOn6JHnq2yV"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }]
    }
  }]
}
```

Filtering must reprocess the replacement items and must not mistake the
skeletal selected tab for an empty playlist page.

## YTM Settings and identity-support resources

*File: `YTM Channel Page JSON/YTM_You_Page/YTM_YOU_Page_Settings.json`*

The file captures four resources in this exact order:

1. `/youtubei/v1/account/get_setting?prettyPrint=false`;
2. `/youtubei/v1/guide?prettyPrint=false`;
3. `/getDatasyncIdsEndpoint`; and
4. the full `/select_site?ra=m` HTML page.

Observed API versus DOM materialization:

- the Settings API contains four category collections, ten boolean renderers,
  four single-option menus, three read-only rows, and 280 option rows;
- the rendered Settings DOM capture materializes four category collections,
  two boolean hosts, and three single-option-menu hosts;
- the Guide response contains one pivot bar and one mobile topbar/account menu;
  the accompanying datasync response contains seven opaque entries and no
  selected-row or canonical channel-browse field.

The API remains command/data authority. A currently collapsed or unmounted DOM
control is not evidence that the corresponding setting is absent.

### 1. Account settings response

**Root list**: `items[]`

The response mixes several renderer families:

- Direct category link: `settingCategoryEntryRenderer`
- Category with controls: `settingCategoryCollectionRenderer`
- Boolean control: `settingBooleanRenderer`
- Single-choice control: `settingSingleOptionMenuRenderer`
- Choice: `settingMenuItemRenderer`
- Read-only row: `settingReadOnlyItemRenderer`
- Nested section: `settingCategorySectionRenderer`
- Connected-account row: `connectedAccountsSettingCategoryEntryRenderer`
- Product/billing row: `subscriptionProductsSettingCategoryEntryRenderer`

Captured top-level areas include Switch account, General, History and privacy,
Your data in YouTube, Notifications, Billing and payments, connected accounts,
subscription products, and About/Google-company links.

**Boolean fields**:

- Label: `...settingBooleanRenderer.title.runs[0].text`
- Explanation: `...settingBooleanRenderer.summary.runs[].text`
- Stable item ID: `...settingBooleanRenderer.itemId`
- Enable mutation:
  `...enableServiceEndpoint.setClientSettingEndpoint.settingDatas[]`
- Disable mutation:
  `...disableServiceEndpoint.setClientSettingEndpoint.settingDatas[]`
- Setting enum: `...clientSettingEnum.item`
- Boolean value: `...boolValue`

Examples include `SAFETY_MODE` (Restricted Mode) and `INLINE_MUTED` (Video
previews). These are YouTube settings, not FilterTube rules. Reading them may
help explain the host surface, but FilterTube must not silently mutate them.

```json
{
  "items": [
    {
      "settingCategoryEntryRenderer": {
        "title": { "runs": [{ "text": "Switch account" }] },
        "categoryId": "SETTING_CAT_ACCOUNT_SWITCHER_MWEB",
        "serviceEndpoint": {
          "getAccountSwitcherEndpoint": { "popup": true }
        }
      }
    },
    {
      "settingCategoryCollectionRenderer": {
        "title": { "runs": [{ "text": "General" }] },
        "items": [{
          "settingBooleanRenderer": {
            "title": { "runs": [{ "text": "Restricted Mode" }] },
            "summary": {
              "runs": [{
                "text": "This helps hide potentially mature videos. No filter is 100% accurate. This setting only applies to this browser."
              }]
            },
            "enableServiceEndpoint": {
              "setClientSettingEndpoint": {
                "settingDatas": [{
                  "clientSettingEnum": { "item": "SAFETY_MODE" },
                  "boolValue": true
                }]
              }
            },
            "disableServiceEndpoint": {
              "setClientSettingEndpoint": {
                "settingDatas": [{
                  "clientSettingEnum": { "item": "SAFETY_MODE" },
                  "boolValue": false
                }]
              }
            },
            "itemId": "SAFETY_MODE"
          }
        }]
      }
    }
  ]
}
```

**Single-option fields**:

- Label: `...settingSingleOptionMenuRenderer.title.runs[0].text`
- Choices: `...settingSingleOptionMenuRenderer.items[]`
- Choice name/value: `...settingMenuItemRenderer.name` and `.value`
- Mutation:
  `...settingMenuItemRenderer.updateServiceEndpoint.setClientSettingEndpoint.settingDatas[]`

Captured option menus include Language (`I18N_LANGUAGE`), Location
(`I18N_REGION`), Appearance (`APP_THEME`), and Email language.

```json
{
  "settingSingleOptionMenuRenderer": {
    "title": { "runs": [{ "text": "Language" }] },
    "items": [{
      "settingMenuItemRenderer": {
        "name": "Afrikaans",
        "value": "af",
        "updateServiceEndpoint": {
          "setClientSettingEndpoint": {
            "settingDatas": [{
              "clientSettingEnum": { "item": "I18N_LANGUAGE" },
              "stringValue": "af"
            }]
          }
        }
      }
    }]
  }
}
```

The actual mutation API advertised by these endpoints is
`/youtubei/v1/account/set_setting`. Mutation commands and account settings are
host authority; they must not be imported into FilterTube profile backups as
if they were FilterTube preferences.

### 2. Guide response

The Guide response supplies shared mobile navigation and account-menu chrome.

**Bottom/pivot navigation**:

```text
items[0].pivotBarRenderer.items[i].pivotBarItemRenderer
```

- Stable pivot ID: `...pivotIdentifier`
- Label: `...title.runs[0].text`
- Browse ID: `...navigationEndpoint.browseEndpoint.browseId`
- URL: `...navigationEndpoint.commandMetadata.webCommandMetadata.url`

Captured pivots include `FEwhat_to_watch`, `FEshorts`, `FEsubscriptions`, and
`FElibrary`.

**Account menu**:

```text
items[1].mobileTopbarRenderer.buttons[0].topbarMenuButtonRenderer
  .menuRenderer.multiPageMenuRenderer
```

Its `activeAccountHeaderRenderer` displays the current account and exposes
`getAccountSwitcherEndpoint`. Settings navigation is exposed through an
`applicationSettingsEndpoint` in a `compactLinkRenderer`.

```json
{
  "items": [
    {
      "pivotBarRenderer": {
        "items": [{
          "pivotBarItemRenderer": {
            "pivotIdentifier": "FElibrary",
            "navigationEndpoint": {
              "commandMetadata": {
                "webCommandMetadata": {
                  "url": "/feed/library",
                  "apiUrl": "/youtubei/v1/browse"
                }
              },
              "browseEndpoint": { "browseId": "FElibrary" }
            },
            "title": { "runs": [{ "text": "You" }] }
          }
        }]
      }
    },
    {
      "mobileTopbarRenderer": {
        "buttons": [{
          "topbarMenuButtonRenderer": {
            "menuRenderer": {
              "multiPageMenuRenderer": {
                "header": {
                  "activeAccountHeaderRenderer": {
                    "accountName": {
                      "runs": [{ "text": "Active account" }]
                    },
                    "serviceEndpoint": {
                      "getAccountSwitcherEndpoint": { "hack": true }
                    }
                  }
                }
              }
            }
          }
        }]
      }
    }
  ]
}
```

Guide links and pivots are navigation, not filterable content cards.

### 3. Datasync ID endpoint

**Endpoint**: `GET /getDatasyncIdsEndpoint`

**Root field**: `datasyncIds[]`

```json
{
  "datasyncIds": [
    "REDACTED_ACCOUNT_DATASYNC_ID",
    "REDACTED_CHANNEL_AND_ACCOUNT_DATASYNC_ID"
  ],
  "responseContext": {}
}
```

Datasync IDs bind YouTube account/channel state across requests. They are not
public channel browse IDs, FilterTube device IDs, Nanah peer IDs, or permission
proof. Treat them as sensitive session/account-routing material: never log,
export, sync, or display their real values.

### 4. Select-site HTML page

`/select_site?ra=m` is a complete HTML/configuration surface rather than a
single JSON API body. It contains `ytcfg`, localized strings, player context,
and account/session configuration including `DATASYNC_ID` references.

Relevant configuration may describe host language, theme, MWEB capabilities,
and the account switcher experiment, but it is not content data. If a JSON
payload is needed, extract only the intended serialized object. Do not
recursively interpret every page configuration object as a renderer response,
and never persist the embedded account/session values.

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

**Card-Level Channel / Byline Signals (Outside the Sheet)**:
- **Collapsed Byline Text**: `...shortBylineText.runs[0].text` -> Example: `"Shakira and 2 more"` (Note: this is display text, not proof that the first name is the uploader.)
- **Card Channel ID (Avatar/Thumbnail Link)**: `...channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId` -> Example: `"UCYLNGLIzMhRTi6ZOLjAPSmw"`
- **Direct Byline Channel ID Fallback**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId` (Sometimes missing because the navigation endpoint is replaced by `showSheetCommand`.)
- The card-level channel endpoint and collaborator-sheet entries are independent signals. Do not assume that collaborator index `0` is the uploader, and do not overwrite one channel ID with the other when YouTube exposes merged or aliased channel identities.

**Header/Trigger Check (The Roster)**:
- Path: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.header.panelHeaderViewModel.title.content`
- Expected Value: `"Collaborators"`

**Authoritative roster rule (2026-04-28)**:
- Treat the sheet above as the canonical collaborator roster for that `videoId`.
- `avatarStackViewModel`, direct `listViewModel`, DOM byline, and collapsed text (`"A and 2 more"`) are only fallback/warm-up signals.
- A fallback candidate must not replace a header-backed `"Collaborators"` sheet just because it has more rows.
- Weak name-only composite entries must be pruned before caching or menu rendering. Example: if a fallback returns `Bizarrap`, `Daddy Yankee Bizarrap`, and `Daddy Yankee`, the middle entry is a composite label, not a third channel.
- Expected collaborator count must collapse with that pruned list when the inflated count came from the fallback candidate.

**Collaborator 1 (Index 0 - e.g., shakiraVEVO)**:
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

## Search Result Fixture: Shakira / VEVO Merged-Identity Case (2026-07-11)

*Local ignored fixture: `collab.json`*

**Search query**: `shakira la pared (anniversery version)` (YouTube suggested the corrected spelling `anniversary`.)

**Search Base Path**:
`contents.sectionListRenderer.contents[i].itemSectionRenderer.contents[j].videoWithContextRenderer`

**Video and visible byline**:
- **Video ID**: `...videoId` -> `"_Wcf2rKEB8E"`
- **Title**: `...headline.runs[0].text` -> `"Shakira - La Pared (Anniversary Version)"`
- **Collapsed collaboration byline**: `...shortBylineText.runs[0].text` -> `"Shakira and Spotify"`
- **Roster trigger**: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.header.panelHeaderViewModel.title.content` -> `"Collaborators"`

**Collaborator sheet row 0 - Shakira/VEVO identity**:
- **Name**: `...listItems[0].listItemViewModel.title.content` -> `"shakiraVEVO"`
- **Handle URL**: `...listItems[0].listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl` -> `"/@shakiraVEVO"`
- **Sheet browse ID**: `...listItems[0].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` -> `"UCGnjeahCJW1AF34HBmQTJ-Q"`

**Collaborator sheet row 1 - Spotify**:
- **Name**: `...listItems[1].listItemViewModel.title.content` -> `"Spotify"`
- **Handle shown in subtitle**: `...listItems[1].listItemViewModel.subtitle.content` contains `"@Spotify"`
- **Sheet browse ID**: `...listItems[1].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` -> `"UCRMqQWxCWE0VMvtUElm-rEA"`

**Separate card-level Shakira/VEVO channel signal**:
- **Path**: `...channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId`
- **Value**: `"UCYLNGLIzMhRTi6ZOLjAPSmw"`
- **Accessibility label**: `...channelThumbnail.channelThumbnailWithLinkRenderer.accessibility.accessibilityData.label` -> `"Go to channel shakiraVEVO"`
- `UCYLNGLIzMhRTi6ZOLjAPSmw` is the merged/current Shakira creator channel (`@shakira`). This card still carries the stale/legacy accessibility label `Go to channel shakiraVEVO` while routing to that creator-channel ID.
- `UCGnjeahCJW1AF34HBmQTJ-Q` is the separate VEVO channel identity exposed by the collaborator sheet as `/@shakiraVEVO`.
- This is therefore not evidence for a third collaborator. It is a creator-channel plus legacy VEVO-channel identity relationship attached to the one visible Shakira roster member.

**Interpretation rule**:
- Row `0` means “first roster entry,” not “uploader.” The sheet does not include an `uploader`, `owner`, or `primaryChannelId` field.
- Preserve the current creator channel (`UCYLNGLIzMhRTi6ZOLjAPSmw` / `@shakira`) and the VEVO channel (`UCGnjeahCJW1AF34HBmQTJ-Q` / `@shakiraVEVO`) as two UC-ID aliases on one visible creator rule. Do not overwrite either ID.
- The accessibility label is not global proof that two arbitrary channels are equivalent. Here the exact video-scoped renderer supplies both the header-backed roster and the card channel, and `Go to channel shakiraVEVO` matches exactly one normalized roster member. That bounded association is sufficient to attach the card ID to the existing Shakira member as `alternateIds`.
- Blocking that one Shakira member must match content attributed to either linked UC ID. Persist one channel rule and one visible settings/menu row; never render the alternate ID as an additional collaborator.
- If the label matches zero or multiple roster members, retain no alias relationship. Do not infer one from similar names.
- Spotify remains an independent collaborator/company channel. Its presence does not turn the Mix byline into a collaborator roster.

**SOLO video rule**:
- The same mismatch can occur without a collaborator sheet: a search/watch card can route to the current creator channel while player/owner metadata names a legacy VEVO channel for the same `videoId`.
- Merge the two UC IDs only when the exact video's card/owner/player candidates share an exact normalized handle, name, or custom URL. Store the later corroborated ID in `alternateIds` on the one creator identity.
- If the labels disagree, keep the first resolved identity and do not manufacture an alias. A later authoritative payload may promote it in place.

**Why camelCase is mentioned**:
- CamelCase selectors are only needed because current YTM Search DOM uses elements such as `ytm-video-with-context-renderer` and `.YtmBadgeAndBylineRendererItemByline`.
- The DOM byline `Shakira and Spotify` is a lookup hint for `_Wcf2rKEB8E`; it is not collaborator or alias truth.
- The retained `/youtubei/v1/search` JSON, its header-backed `Collaborators` sheet, and its exact browse endpoints are the authority. The adjacent `compactRadioRenderer` remains MIX metadata and is excluded.

**Reduced identity excerpt** (the complete renderer is in ignored local fixture `collab.json`):

```json
{
  "videoId": "_Wcf2rKEB8E",
  "shortBylineText": {
    "runs": [{
      "text": "Shakira and Spotify",
      "navigationEndpoint": {
        "showSheetCommand": {
          "panelLoadingStrategy": {
            "inlineContent": {
              "sheetViewModel": {
                "header": {
                  "panelHeaderViewModel": {
                    "title": { "content": "Collaborators" }
                  }
                },
                "content": {
                  "listViewModel": {
                    "listItems": [
                      {
                        "listItemViewModel": {
                          "title": {
                            "content": "shakiraVEVO",
                            "commandRuns": [{
                              "onTap": {
                                "innertubeCommand": {
                                  "browseEndpoint": {
                                    "browseId": "UCGnjeahCJW1AF34HBmQTJ-Q",
                                    "canonicalBaseUrl": "/@shakiraVEVO"
                                  }
                                }
                              }
                            }]
                          }
                        }
                      },
                      {
                        "listItemViewModel": {
                          "title": { "content": "Spotify" },
                          "rendererContext": {
                            "commandContext": {
                              "onTap": {
                                "innertubeCommand": {
                                  "browseEndpoint": {
                                    "browseId": "UCRMqQWxCWE0VMvtUElm-rEA"
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
    }]
  },
  "channelThumbnail": {
    "channelThumbnailWithLinkRenderer": {
      "navigationEndpoint": {
        "browseEndpoint": {
          "browseId": "UCYLNGLIzMhRTi6ZOLjAPSmw"
        }
      },
      "accessibility": {
        "accessibilityData": {
          "label": "Go to channel shakiraVEVO"
        }
      }
    }
  }
}
```

---

# Absolute JSON Trace: YouTube Generated MIX (`compactRadioRenderer` & `radioRenderer`)
*File: `YTM-XHR.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json`, `mix.json`, `Home Page Context`*

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

## Search Result Fixture: Shakira Generated Mix (2026-07-11)

*Local ignored fixture: `mix.json`*

**Search Base Path**:
`contents.sectionListRenderer.contents[i].itemSectionRenderer.contents[j].compactRadioRenderer`

**Identifiers**:
- **Playlist ID**: `...playlistId` -> `"RD_Wcf2rKEB8E"`
- **Seed video ID**: `...navigationEndpoint.watchEndpoint.videoId` -> `"_Wcf2rKEB8E"`
- **Secondary/alternate video ID**: `...secondaryNavigationEndpoint.watchEndpoint.videoId` -> `"OOqhtWs_6qI"`
- **Title**: `...title.runs[0].text` -> `"Mix - Shakira - La Pared (Anniversary Version)"`
- **Mix description/byline**: `...longBylineText.runs[0].text` -> `"Shakira, KAROL G, and more"`
- **Mix marker**: `...thumbnailOverlays[0].thumbnailOverlayBottomPanelRenderer.icon.iconType` -> `"MIX"`

**Channel identity result**:
- This `compactRadioRenderer` contains no `browseEndpoint.browseId`, canonical channel URL, collaborator sheet, or UC channel ID for Shakira, KAROL G, or the other Mix participants.
- `"Shakira, KAROL G, and more"` is generated playlist description text. It must not be split into collaborator identities.
- If channel filtering needs the identities behind this Mix, resolve the seed video (`_Wcf2rKEB8E`) through its own video/search/watch identity data. In this fixture, that seed video is the adjacent collaboration card documented above.
- The deterministic Mix identity is `playlistId = RD_Wcf2rKEB8E`; the seed video is a recovery key, not proof that every name in the Mix byline owns or collaborated on the Mix card.

**Reduced Mix excerpt** (the complete renderer is in ignored local fixture `mix.json`):

```json
{
  "compactRadioRenderer": {
    "playlistId": "RD_Wcf2rKEB8E",
    "title": {
      "runs": [{
        "text": "Mix - Shakira - La Pared (Anniversary Version)"
      }]
    },
    "navigationEndpoint": {
      "watchEndpoint": {
        "videoId": "_Wcf2rKEB8E",
        "playlistId": "RD_Wcf2rKEB8E"
      }
    },
    "secondaryNavigationEndpoint": {
      "watchEndpoint": {
        "videoId": "OOqhtWs_6qI",
        "playlistId": "RD_Wcf2rKEB8E"
      }
    },
    "longBylineText": {
      "runs": [{
        "text": "Shakira, KAROL G, and more"
      }]
    },
    "thumbnailOverlays": [{
      "thumbnailOverlayBottomPanelRenderer": {
        "text": { "runs": [{ "text": "Mix" }] },
        "icon": { "iconType": "MIX" }
      }
    }]
  }
}
```

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

# Absolute JSON Trace: MWEB Age-Gated Watch (`get_watch` and `verify_age`)
*Captured: 2026-07-18 from signed-in mobile web (`MWEB`, client version `2.20260717.00.00`).*

This is a two-endpoint provider flow. The initial `get_watch` stream reports
that playback requires an age acknowledgement and carries the exact command
for the proceed button. The later `verify_age` response returns the navigation
that YouTube permits after that acknowledgement.

These responses are playback-gate authority owned by YouTube. They are not
FilterTube family policy, a whitelist decision, or proof that the video is
appropriate for a protected profile.

## Initial watch response: `get_watch`

**Endpoint**: `POST https://m.youtube.com/youtubei/v1/get_watch?prettyPrint=false`

The captured response is a streamed JSON array with two independently typed
subresponses:

```json
[
  {
    "playerResponse": {
      "playabilityStatus": {
        "status": "AGE_CHECK_REQUIRED"
      }
    },
    "responseType": "STREAMING_WATCH_RESPONSE_TYPE_PLAYER_RESPONSE",
    "subStreamResponseCompleted": true
  },
  {
    "watchNextResponse": {},
    "responseType": "STREAMING_WATCH_RESPONSE_TYPE_WATCH_NEXT_RESPONSE",
    "subStreamResponseCompleted": true
  }
]
```

Do not treat the array as one ordinary player object. Select each item by its
`responseType` before reading `playerResponse` or `watchNextResponse`.

**Player subresponse base**: `[i].playerResponse` where
`[i].responseType == STREAMING_WATCH_RESPONSE_TYPE_PLAYER_RESPONSE`

- Gate state: `.playabilityStatus.status` -> `AGE_CHECK_REQUIRED`
- User-facing reason: `.playabilityStatus.reason`
- Legacy reason discriminator: `.playabilityStatus.desktopLegacyAgeGateReason`
  -> observed value `4`
- Opaque provider context: `.playabilityStatus.contextParams`
- Error UI base:
  `.playabilityStatus.errorScreen.playerErrorMessageRenderer`
- Proceed label:
  `...proceedButton.buttonRenderer.text.runs[].text`
- Proceed request endpoint:
  `...proceedButton.buttonRenderer.serviceEndpoint.commandMetadata.webCommandMetadata.apiUrl`
  -> `/youtubei/v1/verify_age`
- POST requirement:
  `...serviceEndpoint.commandMetadata.webCommandMetadata.sendPost` -> `true`
- Verification command:
  `...proceedButton.buttonRenderer.serviceEndpoint.verifyAgeEndpoint`
- Provider acknowledgement flag:
  `...verifyAgeEndpoint.setRacy` -> `true`
- Post-verification destination:
  `...verifyAgeEndpoint.nextEndpoint.watchEndpoint`
- Target video ID: `...nextEndpoint.watchEndpoint.videoId`
- Destination URL:
  `...nextEndpoint.commandMetadata.webCommandMetadata.url`

Reduced age-gate excerpt:

```json
{
  "playabilityStatus": {
    "status": "AGE_CHECK_REQUIRED",
    "reason": "This video may be inappropriate for some users.",
    "errorScreen": {
      "playerErrorMessageRenderer": {
        "proceedButton": {
          "buttonRenderer": {
            "text": {
              "runs": [{ "text": "I understand and wish to proceed" }]
            },
            "serviceEndpoint": {
              "commandMetadata": {
                "webCommandMetadata": {
                  "sendPost": true,
                  "apiUrl": "/youtubei/v1/verify_age"
                }
              },
              "verifyAgeEndpoint": {
                "nextEndpoint": {
                  "watchEndpoint": {
                    "videoId": "RWBFvQJQZn4",
                    "racyCheckOk": true,
                    "contentCheckOk": true
                  }
                },
                "setRacy": true
              }
            }
          }
        }
      }
    },
    "desktopLegacyAgeGateReason": 4,
    "contextParams": "OPAQUE_PROVIDER_CONTEXT"
  }
}
```

The age-gated player response can still contain useful metadata:

- Video identity: `.videoDetails.videoId`
- Title: `.videoDetails.title`
- Channel UC ID: `.videoDetails.channelId`
- Author name: `.videoDetails.author`
- Duration: `.videoDetails.lengthSeconds`
- Tags: `.videoDetails.keywords[]`
- Description: `.videoDetails.shortDescription`
- Owner handle URL: `.microformat.playerMicroformatRenderer.ownerProfileUrl`
- External channel ID:
  `.microformat.playerMicroformatRenderer.externalChannelId`
- Upload and publish dates:
  `.microformat.playerMicroformatRenderer.uploadDate` and `.publishDate`
- Provider family-safe declaration:
  `.microformat.playerMicroformatRenderer.isFamilySafe`

The captured second subresponse remains a normal watch-next surface under
`[i].watchNextResponse`, including `contents`, `engagementPanels`,
`playerOverlays`, and `frameworkUpdates`. Its presence does not change the
player subresponse from `AGE_CHECK_REQUIRED` to playable.

## Verification response: `verify_age`

**Endpoint**: `POST https://m.youtube.com/youtubei/v1/verify_age?prettyPrint=false`

The captured response does not return a new player object. It returns an action
that navigates back to the watch route with the provider acknowledgement flags
set on the destination `watchEndpoint`.

**Navigation base**: `actions[i].navigateAction.endpoint`

- Destination URL: `.commandMetadata.webCommandMetadata.url`
- Destination page type: `.commandMetadata.webCommandMetadata.webPageType`
  -> `WEB_PAGE_TYPE_WATCH`
- Video ID: `.watchEndpoint.videoId`
- Player parameters: `.watchEndpoint.playerParams`
- Age/racy acknowledgement: `.watchEndpoint.racyCheckOk` -> `true`
- Content-check acknowledgement: `.watchEndpoint.contentCheckOk` -> `true`
- MWEB request evidence:
  `responseContext.serviceTrackingParams[].params[]`, including observed
  `c == MWEB`, `cver == 2.20260717.00.00`, and `yt_li == 1`

Reduced verification response:

```json
{
  "actions": [
    {
      "navigateAction": {
        "endpoint": {
          "commandMetadata": {
            "webCommandMetadata": {
              "url": "/watch?v=RWBFvQJQZn4&...&rco=1",
              "webPageType": "WEB_PAGE_TYPE_WATCH"
            }
          },
          "watchEndpoint": {
            "videoId": "RWBFvQJQZn4",
            "playerParams": "OPAQUE_PLAYER_PARAMS",
            "racyCheckOk": true,
            "contentCheckOk": true
          }
        }
      }
    }
  ]
}
```

## Runtime and filtering boundaries

1. `AGE_CHECK_REQUIRED` is a playability state, not a missing video and not a
   FilterTube block decision. Preserve its distinct state in any app/runtime
   model.
2. Never auto-submit `verify_age`. The proceed action is an explicit signed-in
   user acknowledgement owned by YouTube.
3. Treat `contextParams`, `playerParams`, tracking values, response IDs, and
   encrypted page IDs as opaque and short-lived. Do not persist them as content
   identity or synthesize replacement values.
4. `racyCheckOk` and `contentCheckOk` acknowledge YouTube's playback checks.
   They do not grant FilterTube parent/admin authority and do not override a
   blocked channel, blocked keyword, viewing-space restriction, or time limit.
5. After the returned watch navigation, run the ordinary FilterTube rule path
   again using the stable video/channel metadata. Do not assume the previous
   age-gate response is the final player state.
6. The supplied capture documents the responses, not the complete request
   bodies. Keep the authenticated MWEB client responsible for constructing and
   submitting provider verification requests unless the request contract is
   captured separately.

```text
get_watch
  -> PLAYER_RESPONSE: AGE_CHECK_REQUIRED
  -> WATCH_NEXT_RESPONSE: surrounding watch UI data
  -> user selects YouTube's proceed action
  -> verify_age
  -> navigateAction to the same video with provider check flags
  -> fetch/re-enter normal watch state
  -> reapply FilterTube profile, rule, and time-limit enforcement
```

---

# Absolute JSON Trace: MWEB Upcoming Premiere (`get_watch`)
*Captured: 2026-07-21 from mobile YouTube (`MWEB`) for video `rpPpyanUiPo`.*

Source capture:
`008dda47-c965-4ae3-91d0-893e16c9da65/pasted-text.txt` (local Codex
attachment). The matching rendered mobile Watch DOM is inventoried in
`docs/youtube_renderer_inventory.md`.

**Endpoint**:
`POST https://m.youtube.com/youtubei/v1/get_watch?prettyPrint=false`

This response uses the same streamed two-item envelope documented for the
age-gated capture above, but the player subresponse reports a scheduled
premiere rather than an age gate:

```json
[
  {
    "playerResponse": {
      "playabilityStatus": {
        "status": "LIVE_STREAM_OFFLINE",
        "reason": "Premieres in 3 days"
      }
    },
    "responseType": "STREAMING_WATCH_RESPONSE_TYPE_PLAYER_RESPONSE",
    "subStreamResponseCompleted": true
  },
  {
    "watchNextResponse": {},
    "responseType": "STREAMING_WATCH_RESPONSE_TYPE_WATCH_NEXT_RESPONSE",
    "subStreamResponseCompleted": true
  }
]
```

Select each streamed item by `responseType`. The player subresponse owns
playability and schedule authority. The Watch-next subresponse owns the
surrounding Watch UI and contains unrelated recommendation renderers that
must not be used as fallbacks for the current video's metadata.

## Player subresponse: upcoming and offline

**Player base**: `[i].playerResponse` where
`[i].responseType == STREAMING_WATCH_RESPONSE_TYPE_PLAYER_RESPONSE`

- Playability state: `.playabilityStatus.status` ->
  `LIVE_STREAM_OFFLINE`
- Relative user-facing status: `.playabilityStatus.reason` ->
  `Premieres in 3 days`
- Upcoming slate base:
  `.playabilityStatus.liveStreamability.liveStreamabilityRenderer`
- Slate video identity: `...videoId` -> `rpPpyanUiPo`
- Suggested playability poll interval: `...pollDelayMs` -> `15000`
- Offline slate base:
  `...offlineSlate.liveStreamOfflineSlateRenderer`
- Scheduled epoch seconds: `...scheduledStartTime` -> `1784912400`
- Relative slate text: `...mainText.runs[].text` ->
  `Premieres in ` + `3 days`
- Localized slate schedule: `...subtitleText.runs[].text` ->
  `July 24 at 10:30 PM`
- Slate style: `...offlineSlateStyle` ->
  `OFFLINE_SLATE_STYLE_ABSTRACT`

The independently encoded canonical schedule is:

- Base: `.microformat.playerMicroformatRenderer.liveBroadcastDetails`
- Live now: `.isLiveNow` -> `false`
- Start timestamp: `.startTimestamp` ->
  `2026-07-24T17:00:00+00:00` (July 24 at 10:30 PM IST)

Do not persist the relative `Premieres in 3 days` text as schedule authority.
It ages immediately. Prefer `startTimestamp`, with `scheduledStartTime` as the
matching epoch representation, and format the remaining time in the user's
current locale.

## Video identity and the absence of playable media

**Identity base**: `[i].playerResponse.videoDetails`

- Video ID: `.videoId` -> `rpPpyanUiPo`
- Title: `.title` ->
  `Day 22/365 Understand Russian in 365 Days | Russian Listening Practice | Everyday Dialogues`
- Channel UC ID: `.channelId` -> `UCXRt-HjEaTF6J6regWoopjw`
- Author: `.author` -> `Russian with Nastya`
- Upcoming flag: `.isUpcoming` -> `true`
- Live-content flag before the premiere starts: `.isLiveContent` -> `false`
- Duration: `.lengthSeconds` -> `0`
- View count: `.viewCount` -> `0`

**Microformat identity base**:
`[i].playerResponse.microformat.playerMicroformatRenderer`

- Owner name: `.ownerChannelName` -> `Russian with Nastya`
- External channel UC ID: `.externalChannelId` ->
  `UCXRt-HjEaTF6J6regWoopjw`
- Category: `.category` -> `Education`
- Upload and publish timestamps: `.uploadDate` and `.publishDate`

In this capture, `playerResponse.streamingData` and
`playerResponse.captions` are absent. There are no `formats`,
`adaptiveFormats`, or HLS manifest to prepare. `lengthSeconds == "0"` is
therefore unknown/not-yet-published duration for this upcoming premiere, not
a playable zero-second video and not evidence for an ending-time label.

A readiness or playback system should stop at semantic schedule readiness:
thumbnail, title, channel identity, status, and start time may be retained,
but source resolution, Media3 source construction, and byte warming have no
playable target yet. Polling, if the waiting room remains active, must stay
bounded and should respect the provider's `pollDelayMs` rather than retrying
as a generic playback failure.

## Notify-me action

The offline slate exposes a toggle action:

- Toggle base: `...liveStreamOfflineSlateRenderer.actionButtons[i].toggleButtonRenderer`
- Default label: `.defaultText.runs[].text` -> `Notify me`
- Add-reminder API:
  `.defaultServiceEndpoint.commandMetadata.webCommandMetadata.apiUrl` ->
  `/youtubei/v1/notification/add_upcoming_event_reminder`
- Remove-reminder API:
  `.toggledServiceEndpoint.commandMetadata.webCommandMetadata.apiUrl` ->
  `/youtubei/v1/notification/remove_upcoming_event_reminder`
- Toggled label: `.toggledText.runs[].text` -> `Notification on`

The corresponding endpoint parameters and tracking values are opaque,
session-bound provider state. Do not replay them from this capture or infer a
FilterTube notification/subscription rule from the toggle state.

## Watch-next subresponse: current-video UI versus recommendations

**Watch-next base**: `[i].watchNextResponse` where
`[i].responseType == STREAMING_WATCH_RESPONSE_TYPE_WATCH_NEXT_RESPONSE`

Current-video evidence observed in the capture:

- Current route identity:
  `.currentVideoEndpoint.watchEndpoint.videoId` -> `rpPpyanUiPo`
- Current title:
  `...slimVideoInformationRenderer.title.runs[].text`
- Waiting count:
  `...slimVideoInformationRenderer.collapsedSubtitle.runs[].text` ->
  `1 waiting`
- Owner label:
  `...slimOwnerRenderer.title.runs[].text` -> `Russian with Nastya`
- Owner UC ID:
  `...slimOwnerRenderer.navigationEndpoint.browseEndpoint.browseId` ->
  `UCXRt-HjEaTF6J6regWoopjw`
- Owner handle:
  `...slimOwnerRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl`
  -> `/@Russianlanguage`
- Structured waiting factoid:
  `...viewCountFactoidRenderer.viewCountType` ->
  `VIEW_COUNT_FACTOID_TYPE_CONCURRENT_VIEWERS`
- Structured premiere date:
  `...videoDescriptionHeaderRenderer.factoid[].factoidRenderer.accessibilityText`
  -> `Premieres Jul 24, 2026`

The same Watch-next response also contains many
`videoWithContextRenderer` recommendations with different `videoId`, title,
channel, duration, view-count, accessibility, and action values. Those nested
strings are rail-card evidence only. A parser must not search the complete
Watch-next tree for the first text containing `views`, `ago`, a duration, or a
description and then attach it to `currentVideoEndpoint.videoId`.

Current-video metadata must come from the player response or a renderer that
is structurally scoped to the current Watch metadata/description panels.
Recommendation metadata remains owned by each recommendation's exact
`videoId`.

## State and filtering boundaries

1. `LIVE_STREAM_OFFLINE` plus `videoDetails.isUpcoming == true` is a scheduled
   premiere state, not a network error, deleted video, or FilterTube block.
2. Show the offline slate/status and scheduled local time. Disable ordinary
   playback and seeking until the provider exposes playable formats.
3. Do not show `0:00` as a real duration and do not borrow a recommendation's
   duration. An ending time is unknown in this capture.
4. Continue applying FilterTube title/channel/category policy using the stable
   current-video fields. Playability state does not bypass filtering.
5. Keep the player, Watch metadata, recommendations, comments, and reminder
   action as separately owned surfaces. Failure or absence in one must not
   populate another from arbitrary deep text.
6. Opaque tracking values, entity keys, player parameters, reminder params,
   response IDs, and visitor/session context must remain opaque.

```text
get_watch streamed array
  -> PLAYER_RESPONSE
       -> LIVE_STREAM_OFFLINE + isUpcoming=true
       -> exact schedule + offline slate + optional Notify me action
       -> no playable formats, duration, captions, or media byte warm
  -> WATCH_NEXT_RESPONSE
       -> current Watch metadata/owner/waiting count
       -> independently scoped recommendations and engagement panels
  -> when the scheduled time approaches
       -> bounded provider-directed playability refresh
       -> prepare playback only after playable formats appear
```

---

# Absolute JSON Trace: MWEB Active LIVE (`get_watch`)
*Captured: 2026-07-21 from mobile YouTube (`MWEB`) for video `a0gQvm4DEms`.*

Source captures:

- `fd4dc846-32dd-4798-8d49-faa073339089/pasted-text.txt` contains the streamed
  `get_watch` JSON.
- `86561eac-9768-4905-ba3b-790f76728c79/pasted-text.txt` contains the rendered
  mobile description engagement panel for the same current video.

**Endpoint**:
`POST https://m.youtube.com/youtubei/v1/get_watch?prettyPrint=false`

The response again uses two independently completed streamed items:

```json
[
  {
    "playerResponse": {
      "playabilityStatus": { "status": "OK" },
      "videoDetails": {
        "videoId": "a0gQvm4DEms",
        "isLive": true,
        "isLiveContent": true,
        "isLiveDvrEnabled": true,
        "lengthSeconds": "0"
      }
    },
    "responseType": "STREAMING_WATCH_RESPONSE_TYPE_PLAYER_RESPONSE",
    "subStreamResponseCompleted": true
  },
  {
    "watchNextResponse": {
      "currentVideoEndpoint": {
        "watchEndpoint": { "videoId": "a0gQvm4DEms" }
      }
    },
    "responseType": "STREAMING_WATCH_RESPONSE_TYPE_WATCH_NEXT_RESPONSE",
    "subStreamResponseCompleted": true
  }
]
```

As with the upcoming capture, select by `responseType`; do not rely on array
position or recursively mix current-video and recommendation fields.

## Player subresponse: actively playable live broadcast

**Player base**: `[i].playerResponse` where
`[i].responseType == STREAMING_WATCH_RESPONSE_TYPE_PLAYER_RESPONSE`

- Playability: `.playabilityStatus.status` -> `OK`
- Live-streamability base:
  `.playabilityStatus.liveStreamability.liveStreamabilityRenderer`
- Video ID: `...videoId` -> `a0gQvm4DEms`
- Broadcast ID: `...broadcastId` -> `1`
- Suggested provider refresh interval: `...pollDelayMs` -> `15000`
- Offline slate: `...offlineSlate` -> absent

The missing `offlineSlate` is meaningful only in combination with `OK`, live
flags, and playable media. It distinguishes this active broadcast from the
scheduled-premiere capture; it is not sufficient as a standalone LIVE test.

**Video details base**: `[i].playerResponse.videoDetails`

- Title: `.title` -> `Career Updates and Coding`
- Channel UC ID: `.channelId` -> `UCfvJirlbRTN-bU9sMWMb_ZQ`
- Author: `.author` -> `Fritz's Tech Tips and Chatter`
- Active-live flags: `.isLive` -> `true`; `.isLiveContent` -> `true`
- DVR availability: `.isLiveDvrEnabled` -> `true`
- Live chunk readahead hint: `.liveChunkReadahead` -> `3`
- Latency class: `.latencyClass` ->
  `MDE_STREAM_OPTIMIZATIONS_RENDERER_LATENCY_NORMAL`
- Duration: `.lengthSeconds` -> `0`
- Captured view count: `.viewCount` -> `136`

**Live player configuration**:
`[i].playerResponse.playerConfig.livePlayerConfig`

- Desired live readahead: `.liveReadaheadSeconds` -> `12`
- Live head playable: `.isLiveHeadPlayable` -> `true`

**Canonical live-state base**:
`[i].playerResponse.microformat.playerMicroformatRenderer.liveBroadcastDetails`

- Live now: `.isLiveNow` -> `true`
- Actual start timestamp: `.startTimestamp` ->
  `2026-07-21T13:07:58+00:00`

For an active broadcast, `lengthSeconds == "0"` means open-ended live media,
not a zero-second video. It must not produce a fixed end time or disable
playback. Because this capture has DVR enabled, seeking can still be offered
inside the provider's current seekable window even though the broadcast has
no fixed total duration.

## Live media, signed-source lifetime, and DVR

**Streaming base**: `[i].playerResponse.streamingData`

- Adaptive streams: `.adaptiveFormats` -> 16 entries in this capture
- HLS manifest: `.hlsManifestUrl` -> present
- Server-driven ABR endpoint: `.serverAbrStreamingUrl` -> present
- Progressive `.formats` -> absent
- Signed response lifetime: `.expiresInSeconds` -> `21540`

The adaptive set contains separate video variants from 144p through 1080p,
one MP4 audio entry (`itag 140`), and three `text/mp4` entries. Every captured
adaptive entry reports:

- `.targetDurationSec` -> `5`
- `.maxDvrDurationSec` -> `43200` (12 hours)

The top-level `playerResponse.captions` object is absent. The `text/mp4`
entries prove text-bearing adaptive tracks, but without the semantic captions
mapping they must not be presented as named/selectable caption tracks solely
from MIME type or itag.

Media URLs and manifests are signed, session-sensitive playback material. A
source-plan/readiness cache must retain their expiry and live-state epoch. Do
not reuse an active-LIVE manifest after its signed lifetime, after the
broadcast changes state, or as the source for an archived VOD. A nominal
video-ID cache hit is not sufficient when the cached media contract is stale.

Preloading remains bounded: prepare the exact live source and a useful live
head/buffer window for a probable tap; never attempt to download the open-ended
broadcast or fill the DVR window. Once selected, live playback and an
unbuffered seek own network/buffer priority over speculative card warming.

### Active-LIVE quality is an adaptive-manifest constraint

The captured active-LIVE media ladder tops out at 1080p. A consumer may retain
a broader user preference such as 1440p or 2160p from another video/device, but
that persisted value is not proof that the current manifest contains or is
decoding that resolution.

For active LIVE, Auto and fixed quality should remain on the HLS/adaptive media
contract. A fixed value is a preferred maximum rendition height: Media3 may
select a lower available variant when the manifest or measured throughput
requires it and move upward again without replacing the live source. Resolving
fixed 1080p as separate progressive video/audio URLs is not equivalent: an
observed FilterTubeApp trace exposed the absolute LIVE timestamp as more than
3,287 seconds buffered at player position zero and never entered PLAYING.
Switching the same selected item to Auto mounted HLS and played immediately.

Accepted downstream device evidence later recorded a persisted 1440p ceiling
with `sourceKind=adaptive_hls`, first frame in 881 ms, and READY in 1.386 s.
The resolver log could not report the currently selected HLS height, so this is
evidence for the requested ceiling and working adaptive source, not evidence
that 1440p was delivered. Settings UI must intersect persisted preference with
the current mounted track groups and expose the actual selected rendition when
available.

## Watch-next and description-panel current-video metadata

**Watch-next base**: `[i].watchNextResponse` where
`[i].responseType == STREAMING_WATCH_RESPONSE_TYPE_WATCH_NEXT_RESPONSE`

Captured slim-metadata bases beneath that object:

- Current information:
  `.contents.singleColumnWatchNextResults.results.results.contents[1].slimVideoMetadataSectionRenderer.contents[0].slimVideoInformationRenderer`
- Current owner:
  `.contents.singleColumnWatchNextResults.results.results.contents[1].slimVideoMetadataSectionRenderer.contents[1].slimOwnerRenderer`
- Current description header:
  `.engagementPanels[1].engagementPanelSectionListRenderer.content.structuredDescriptionContentRenderer.items[0].videoDescriptionHeaderRenderer`

The numeric positions describe this capture. A resilient parser should select
the keyed renderer object within the structurally scoped current-video area,
not assume those positions remain permanent.

- Current route identity:
  `.currentVideoEndpoint.watchEndpoint.videoId` -> `a0gQvm4DEms`
- Current title:
  current-information base + `.title.runs[].text`
- Current concurrent label:
  current-information base + `.collapsedSubtitle.accessibility.accessibilityData.label`
  ->
  `19 watching now`
- Owner handle:
  current-owner base +
  `.navigationEndpoint.browseEndpoint.canonicalBaseUrl`
  -> `/@csharpfritz`
- Structured current concurrency:
  current-description-header base +
  `.factoid[1].viewCountFactoidRenderer.viewCountType` ->
  `VIEW_COUNT_FACTOID_TYPE_CONCURRENT_VIEWERS`
- Start-age accessibility text:
  current-description-header base +
  `.factoid[2].factoidRenderer.accessibilityText`
  -> `Started streaming 2 hours ago`

The matching description engagement panel renders the same current title,
channel, `19 watching now`, start date, likes, description, and authoritative
channel links. Its DOM is inventoried separately. It is a current-video UI
surface and a useful display fallback, but the player response remains the
authority for playability, live/DVR flags, exact start timestamp, manifests,
and source expiry.

`videoDetails.viewCount == "136"` and the Watch/description label
`19 watching now` represent different or differently refreshed metrics. The
structured concurrent-viewer renderer/accessible label owns the current
concurrency display; do not relabel the player-level count as “watching now.”

### Description creator infocard and newer Video details rows

The supplied active-LIVE fragments
`b6c99789-4255-4420-94b7-13bfbc1ec37d/pasted-text.txt` and
`0e8eb834-4039-4b5e-98d9-4be023e02976/pasted-text.txt` are adjoining portions
of the Watch-next description panel. Select the engagement panel by
`panelIdentifier == "video-description-ep-identifier"`, then use this base:

`[i].watchNextResponse.engagementPanels[].engagementPanelSectionListRenderer.content.structuredDescriptionContentRenderer.items[]`

Creator-infocard paths, where the selected item contains
`videoDescriptionInfocardsSectionRenderer`:

- `.sectionTitle.runs[].text` -> `Francesco Ciulla`;
- `.sectionSubtitle.runs[].text` -> `343K subscribers`;
- `.sectionSubtitle.accessibility.accessibilityData.label` ->
  `343 thousand subscribers`;
- `.channelAvatar.thumbnails[]` -> channel avatar candidates;
- `.channelEndpoint.browseEndpoint` -> exact channel identity/navigation;
- `.creatorVideosButton.buttonRenderer.command.browseEndpoint` and
  `.creatorAboutButton.buttonRenderer.command.browseEndpoint` -> Videos/About
  channel actions; and
- `.creatorCustomUrlButtons[].buttonViewModel` -> titled creator link action,
  icon, and `.onTap.innertubeCommand` endpoint.

Custom URL buttons are actions. Their titles must not become description body
text, statistics, filtering keywords, or cards. External links can remain
YouTube redirect URLs until a user gesture hands them to the navigation layer;
do not resolve or preload them as media.

The newer Video details block is an item containing
`linearLayoutViewModel.items[].listItemViewModel`:

- `.title.content == "Date"` -> `.trailingLabel.content` (`Jul 21, 2026`);
- `.title.content == "Viewers"` -> `.trailingLabel.content` (`20`), semantically
  the current concurrent-viewer metric for this active LIVE response; and
- `.title.content == "Likes"` ->
  `.trailingAccessoriesList.trailingAccessories[]`
  `.listItemLikeCountViewModel`.

For the Likes row, select `.valueIfLiked`, `.valueIfDisliked`, or
`.valueIfIndifferent` using the `likeStatusEntity.likeStatus` whose key equals
`.statusEntityKey`. Header factoids remain first display authority when both
schemas are present; these rows supply compatible structured fallbacks rather
than duplicate labels. The values are response data and can change between
captures.

## Correlated mobile Home LIVE card DOM

The supplied Home DOM capture
`344f990e-eb01-4891-af2a-d7492a633763/pasted-text.txt` carries the same video
ID, `a0gQvm4DEms`, in the outer lockup class and both preview/static Watch
links. It renders:

- `badge-shape.ytBadgeShapeThumbnailLive` -> `LIVE`;
- title accessibility text ending in `21 watching`;
- a metadata-row `21 watching` label;
- an active `ytm-video-preview`/HTML5 player child; and
- no duration badge.

That DOM is display and tap-probability evidence, not a substitute for the
player subresponse. Correlate it to this JSON trace by exact video ID:

| Home DOM signal | `get_watch` authority | Result |
| --- | --- | --- |
| `LIVE` badge | `playabilityStatus.status == OK`, `videoDetails.isLive == true`, `liveBroadcastDetails.isLiveNow == true` | Active-LIVE presentation only while the fresh player tuple remains true. |
| `21 watching` | Watch-current concurrent renderer/accessibility text | Localized concurrent-viewer display; it may refresh independently of captured `videoDetails.viewCount`. |
| Missing duration | `videoDetails.lengthSeconds == "0"` with active-LIVE tuple | Open-ended LIVE, not a zero-second VOD. |
| Inline preview progress near `100%` | current HLS live edge and optional DVR window | Near live edge, not media completion. Do not run VOD near-end/ended logic. |
| Inline preview child | playable streaming data and HLS manifest | One transient preview owned by the Home card; never a second card/readiness owner. |

The Home badge may make this card a high-probability readiness candidate, but
the app must refresh manifests/playability at Watch selection and keep live
playlist requests out of stale persistent-manifest reuse. Bounded media bytes
may still be reused under the current signed-source/live epoch.

This capture contains no `liveChatRenderer`. That documents only this response
and must not become a rule that active LIVE videos never expose chat. The
Watch-next response also contains independently scoped recommendation cards;
their dates, durations, titles, channels, and view counts must never fill
missing current-live fields.

## First-load document versus same-tab `get_watch`

Mobile Watch has two delivery shapes that must normalize into the same owned
model:

1. A full navigation to `GET https://m.youtube.com/watch?...&ra=m` returns an
   HTML document. The supplied `FilterTubeApp/docs/app/native-owned-main/Description_sheet.html`
   embeds escaped `ytInitialData` (Watch UI, current metadata, description and
   engagement panels) and a separate `ytInitialPlayerResponse` (playability,
   media, duration, live state).
2. A same-tab mobile Watch navigation issues
   `POST /youtubei/v1/get_watch?prettyPrint=false` and returns the streamed
   two-item array documented above.

The observed `get_watch` request does not use the flat `/next` body. Its stable
top-level contract is:

```json
{
  "context": { "client": { "clientName": "MWEB" } },
  "playerRequest": {
    "videoId": "VIDEO_ID",
    "playbackContext": {
      "contentPlaybackContext": {
        "currentUrl": "/watch?v=VIDEO_ID",
        "vis": 0,
        "splay": false,
        "autoCaptionsDefaultOn": false,
        "autonavState": "STATE_NONE",
        "html5Preference": "HTML5_PREF_WANTS",
        "lactMilliseconds": "-1"
      },
      "devicePlaybackCapabilities": {
        "supportsVp9Encoding": true,
        "supportXhr": true
      }
    },
    "racyCheckOk": false,
    "contentCheckOk": false
  },
  "watchNextRequest": {
    "videoId": "VIDEO_ID",
    "racyCheckOk": false,
    "contentCheckOk": false,
    "autonavState": "STATE_NONE",
    "playbackContext": { "vis": 0, "lactMilliseconds": "-1" },
    "captionsRequested": false
  }
}
```

Treat client/session fields, signature timestamps, tracking, visitor data, and
experiment configuration as captured provider context, not constants to
synthesize. The important structural rule is the paired `playerRequest` and
`watchNextRequest`; a flat `videoId` request produces `INVALID_ARGUMENT` in
the observed MWEB contract.

## Ended-LIVE replay (`OAzAu0PbpqM`)

Source capture:
`04125704-0cb0-493f-a32d-86efd22237b2/pasted-text.txt`.

The streamed array contains two items selected by `responseType`:

- `STREAMING_WATCH_RESPONSE_TYPE_PLAYER_RESPONSE`
- `STREAMING_WATCH_RESPONSE_TYPE_WATCH_NEXT_RESPONSE`

Player fields proving an archived replay:

| Path under `[i].playerResponse` | Captured value | Meaning |
| --- | --- | --- |
| `playabilityStatus.status` | `OK` | Playable replay. |
| `videoDetails.videoId` | `OAzAu0PbpqM` | Current-video identity. |
| `videoDetails.lengthSeconds` | `35216` | Finite `9:46:56` replay duration in this capture. |
| `videoDetails.isLiveContent` | `true` | Historical live origin only; not sufficient for active-LIVE classification. |
| `videoDetails.isLive` | absent | Does not satisfy the active-LIVE tuple. |
| `microformat.playerMicroformatRenderer.liveBroadcastDetails.isLiveNow` | `false` | Broadcast is no longer active. |
| `...liveBroadcastDetails.startTimestamp` | `2026-07-20T09:39:42+00:00` | Actual broadcast start. |
| `...liveBroadcastDetails.endTimestamp` | `2026-07-20T19:26:40+00:00` | Actual broadcast end. |

The exact creator body is available in both player and Watch-next authorities:

- `playerResponse.videoDetails.shortDescription`
- `playerResponse.microformat.playerMicroformatRenderer.description.runs[].text`
- `watchNextResponse.engagementPanels[].engagementPanelSectionListRenderer`
  selected where `.panelIdentifier == "video-description-ep-identifier"`, then
  `.content.structuredDescriptionContentRenderer.items[]`
  `.expandableVideoDescriptionBodyRenderer.attributedDescriptionBodyText.content`

The description header in that same exact panel exposes:

- `.videoDescriptionHeaderRenderer.title`
- `.videoDescriptionHeaderRenderer.views` -> `20,007 views`
- `.videoDescriptionHeaderRenderer.publishDate` ->
  `Streamed live on Jul 20, 2026`
- `.videoDescriptionHeaderRenderer.factoid[0].sentimentFactoidRenderer`
  selects `factoidIfLiked`, `factoidIfDisliked`, or
  `factoidIfIndifferent` from `.likeStatusEntity.likeStatus`; the selected
  `.factoidRenderer.accessibilityText` is `225 likes` in the supplied
  first-load document;
- `.videoDescriptionHeaderRenderer.factoid[1].factoidRenderer.accessibilityText`
  -> `20,009 views` in the first-load document;
- `.videoDescriptionHeaderRenderer.factoid[2].factoidRenderer.accessibilityText`
  -> `Streamed live on Jul 20, 2026`;
- `.videoDescriptionHeaderRenderer.clickableMetadataButtons[]`
  `.buttonViewModel.title` -> `#mande`, `#apexpredator`, and
  `#apexseason28`; and
- `.structuredDescriptionContentRenderer.items[]`
  `.videoAttributesSectionViewModel` -> `headerTitle == "Games"`,
  `.videoAttributeViewModels[].videoAttributeViewModel.title == "Apex Legends"`,
  `.subtitle == "2019"`, and `.footerButton.buttonViewModel.title == "Gaming"`.

The description-sheet payload is therefore a structured current-video unit:
header identity + selected factoids + metadata buttons + full attributed body
+ optional attributes. Consumers should retain these fields with the selected
video id and render them from the same Watch state; recursively collecting all
`factoidRenderer` or description nodes from the response can import
recommendation/ad metadata and is not safe.

Classification rule:

```text
isLiveContent=true
  + isLive absent/false
  + liveBroadcastDetails.isLiveNow=false
  + positive lengthSeconds
  = finite ended-LIVE replay, not active LIVE
```

Do not suppress its duration, label it `LIVE`, retain a live-head seek window,
or continue polling an active manifest. It follows ordinary bounded VOD
readiness while retaining the useful `Streamed live on ...` presentation.

## Upcoming -> active LIVE -> ended/archived transition

| State | Required authority | Player presentation | Readiness/cache rule |
| --- | --- | --- | --- |
| Scheduled upcoming | `LIVE_STREAM_OFFLINE`, `isUpcoming == true`, schedule fields, no playable streaming data | Offline slate, local start time, optional reminder; no `0:00` duration | Retain semantic schedule readiness only. A no-media result is temporary and may be refreshed at a bounded provider-directed interval. |
| Active LIVE | `OK`, `isLive == true`, `isLiveNow == true`, playable HLS/adaptive source | Active player, LIVE status, concurrent viewers; no fixed end time; optional DVR seek | Replace upcoming negative/source state. Cache signed media only within its live-state epoch and expiry; warm a bounded live window. |
| Ended or archived | A fresh response no longer satisfying the active-LIVE tuple; archived playback may expose ordinary VOD duration/formats | Ended status or normal VOD controls and fixed duration when supplied | Invalidate live manifests, live-head positions, and upcoming state. Build a new archived/ended source contract rather than reusing the live one. |

Transition handling must be keyed by video ID **and** semantic playback epoch,
not video ID alone. Title, channel identity, thumbnail, and policy decisions may
survive when unchanged; incompatible playability, source plans, prepared media,
byte readiness, duration semantics, and seek windows must be replaced.

```text
scheduled premiere
  -> semantic waiting-room readiness; no media warm
  -> provider refresh exposes OK + active-live fields + streamingData
active LIVE
  -> exact live source + bounded live-head/DVR readiness
  -> signed source expires or provider state changes
ended / archived
  -> discard live media contract
  -> resolve the new ended or VOD contract before playback
```

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

# Absolute JSON Trace: Signed-in Comment Mutations
*Files: captured `create_comment`, `update_comment`, `perform_comment_action`, and post-create `att/log` responses (2026-07-15 samples)*

These responses are mutation authority. They are not interchangeable with the
later comments continuation response, and the endpoint URL alone is not enough
to identify a Like, Dislike, or Delete performed through
`perform_comment_action`.

## Create comment

**Endpoint**: `/youtubei/v1/comment/create_comment`

**Acceptance**:

- `actions[i].createCommentAction.actionResult.status`
- `actions[i].createCommentAction.actionResult.feedbackText`

**Authoritative returned row**:

- Base: `actions[i].createCommentAction.contents.commentThreadRenderer.comment.commentRenderer`
- Comment ID: `.commentId`
- Body: `.contentText.runs[].text`
- Published label: `.publishedTimeText.runs[].text`
- Viewer ownership: `.viewerIsAuthor`
- Visible author alias: `.authorText.runs[].text`
- Canonical author UC ID: `.authorEndpoint.browseEndpoint.browseId`
- Canonical handle URL: `.authorEndpoint.browseEndpoint.canonicalBaseUrl`
- Author avatar: `.authorThumbnail.thumbnails[].url`
- Exact returned Reply/Like/Dislike/Delete commands remain nested in the
  returned renderer.

**Attestation instruction returned with creation**:

- `actions[i].runAttestationCommand.ids[].commentId`
- `actions[i].runAttestationCommand.ids[].encryptedVideoId`
- `actions[i].runAttestationCommand.ids[].externalChannelId`
- `actions[i].runAttestationCommand.engagementType == ENGAGEMENT_TYPE_COMMENT_POST`

The same handle can appear in `authorText`, accessibility labels, and avatar
labels. These are aliases for one author. Do not create multiple identities;
retain the UC ID as the stable identity and the handle/name as aliases.

Reduced valid response shape:

```json
{
  "actions": [
    {
      "runAttestationCommand": {
        "ids": [
          { "commentId": "COMMENT_ID" },
          { "encryptedVideoId": "VIDEO_ID" },
          { "externalChannelId": "VIDEO_OWNER_UC_ID" }
        ],
        "engagementType": "ENGAGEMENT_TYPE_COMMENT_POST"
      }
    },
    {
      "createCommentAction": {
        "actionResult": {
          "status": "STATUS_SUCCEEDED",
          "feedbackText": { "runs": [{ "text": "Comment added" }] }
        },
        "contents": {
          "commentThreadRenderer": {
            "comment": {
              "commentRenderer": {
                "commentId": "COMMENT_ID",
                "authorText": { "runs": [{ "text": "@handle" }] },
                "authorEndpoint": {
                  "browseEndpoint": {
                    "browseId": "AUTHOR_UC_ID",
                    "canonicalBaseUrl": "/@handle"
                  }
                },
                "contentText": { "runs": [{ "text": "Comment body" }] },
                "publishedTimeText": { "runs": [{ "text": "0 seconds ago" }] },
                "viewerIsAuthor": true
              }
            }
          }
        }
      }
    }
  ]
}
```

## Update comment

**Endpoint**: `/youtubei/v1/comment/update_comment`

The receipt and replacement entity are separate structures in one response.

**Receipt**:

- Comment ID: `actions[i].updateCommentAction.commentId`
- Acceptance: `actions[i].updateCommentAction.actionResult.status`

**Replacement entity**:

- Base: `frameworkUpdates.entityBatchUpdate.mutations[i]`
- Select the mutation where
  `.type == ENTITY_MUTATION_TYPE_REPLACE` and
  `.payload.commentEntityPayload.properties.commentId` matches the receipt.
- Edited body: `.payload.commentEntityPayload.properties.content.content`
- Edited time: `.payload.commentEntityPayload.properties.publishedTime`
- Reply level: `.payload.commentEntityPayload.properties.replyLevel`
- Author UC ID: `.payload.commentEntityPayload.author.channelId`
- Author alias: `.payload.commentEntityPayload.author.displayName`
- Author avatar: `.payload.commentEntityPayload.author.avatarThumbnailUrl`
- Viewer ownership: `.payload.commentEntityPayload.author.isCurrentUser`
- Canonical channel route:
  `.payload.commentEntityPayload.author.channelPageEndpoint.innertubeCommand.browseEndpoint`
- Toolbar labels/state: `.payload.commentEntityPayload.toolbar`
- Refreshed Like/Unlike/Dislike/Undislike commands can be supplied by companion
  `engagementToolbarSurfaceEntityPayload` replacement mutations.

Reduced valid response shape:

```json
{
  "actions": [
    {
      "updateCommentAction": {
        "commentId": "COMMENT_ID",
        "actionResult": { "status": "STATUS_SUCCEEDED" }
      }
    }
  ],
  "frameworkUpdates": {
    "entityBatchUpdate": {
      "mutations": [
        {
          "type": "ENTITY_MUTATION_TYPE_REPLACE",
          "payload": {
            "commentEntityPayload": {
              "properties": {
                "commentId": "COMMENT_ID",
                "content": { "content": "Edited body" },
                "publishedTime": "58 seconds ago (edited)",
                "replyLevel": 0
              },
              "author": {
                "channelId": "AUTHOR_UC_ID",
                "displayName": "@handle",
                "isCurrentUser": true
              }
            }
          }
        }
      ]
    }
  }
}
```

## Delete, Like, and Dislike comment

**Endpoint**: `/youtubei/v1/comment/perform_comment_action`

Delete response paths:

- Comment ID: `actions[i].removeCommentAction.commentId`
- Acceptance: `actions[i].removeCommentAction.actionResult.status`
- Result kind: `actions[i].removeCommentAction.actionResult.feedback == FEEDBACK_REMOVE`
- User feedback:
  `actions[i].openPopupAction.popup.notificationActionRenderer.responseText.runs[].text`

Like/Dislike response paths:

- Acceptance: `actionResults[i].status`
- Result kind: `actionResults[i].feedback`, observed values
  `FEEDBACK_LIKE` and `FEEDBACK_DISLIKE`
- Attestation IDs and engagement type:
  `actions[i].runAttestationCommand`
- A short-lived `consistencyTokenJar` may also be returned. Treat it as opaque
  provider session state, never as durable identity or filtering metadata.

Reduced valid delete response:

```json
{
  "actions": [
    {
      "removeCommentAction": {
        "commentId": "COMMENT_ID",
        "actionResult": {
          "status": "STATUS_SUCCEEDED",
          "feedback": "FEEDBACK_REMOVE"
        }
      }
    },
    {
      "openPopupAction": {
        "popup": {
          "notificationActionRenderer": {
            "responseText": { "runs": [{ "text": "Comment deleted" }] }
          }
        },
        "popupType": "TOAST"
      }
    }
  ]
}
```

Reduced valid Like response (Dislike changes the two enum values):

```json
{
  "actionResults": [
    {
      "status": "STATUS_SUCCEEDED",
      "feedback": "FEEDBACK_LIKE"
    }
  ],
  "actions": [
    {
      "runAttestationCommand": {
        "ids": [
          { "commentId": "COMMENT_ID" },
          { "encryptedVideoId": "VIDEO_ID" },
          { "externalChannelId": "VIDEO_OWNER_UC_ID" }
        ],
        "engagementType": "ENGAGEMENT_TYPE_COMMENT_LIKE"
      }
    }
  ]
}
```

## Post-mutation attestation log

**Observed endpoint**: `/youtubei/v1/att/log`

The provider issued this immediately after `create_comment` returned a
`runAttestationCommand`. Its response proves a signed-in provider context via
`responseContext.mainAppWebResponseContext.datasyncId` and `loggedOut`, but it
contains no comment renderer and is not content authority. The captured
response is insufficient to reconstruct the request payload. Do not invent or
replay attestation requests; keep the live provider client responsible for the
integrity protocol unless the exact request contract is separately captured.

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
  - microformat.playerMicroformatRenderer.publishDate and uploadDate feed learned videoMetaMap date metadata.
  - 2026-07-02: per-keyword date filters reuse the same date evidence as upload-date content filters:
      1. learned videoMetaMap uploadDate/publishDate from /player microformat,
      2. renderer publishedTimeText relative strings, and
      3. DOM metadata fallback text when JSON date evidence is not present.
    Comment keyword date filters use the current/linked video's uploadDate/publishDate,
    not the commentRenderer/commentThreadRenderer posted-time label.
    Old keyword rows without dateFilter metadata keep the previous behavior.

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
