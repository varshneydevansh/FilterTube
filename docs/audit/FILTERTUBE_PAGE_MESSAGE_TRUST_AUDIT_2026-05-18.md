# FilterTube Page Message Trust Audit - 2026-05-18

Status: audit-only current-behavior proof. This file does not change product
behavior.

This slice covers `window.postMessage` traffic between the isolated extension
content world and the page/main world. It matters because these messages can
feed learned channel maps, video-channel maps, video metadata maps,
collaborator rosters, subscription-import results, settings delivery to the
injector, and DOM fallback reruns.

## Message Flow

```text
content_bridge.js (isolated world)
        |
        | postMessage source: content_bridge
        v
injector.js / seed.js / filter_logic.js / collab_dialog.js (main world helpers)
        |
        | postMessage source: injector | filter_logic | collab_dialog
        v
content_bridge.js / bridge_settings.js
        |
        +--> persist learned maps
        +--> stamp DOM identity
        +--> resolve pending requests
        +--> rerun DOM fallback
        +--> update seed settings
```

The bridge is intentionally same-window because extension isolated-world code
cannot directly read page `ytInitialData`. The risk is that the same primitive
also accepts page script messages unless every state-changing message has a
separate trust contract.

## Current Message Boundaries

| Receiver | Current source gate | Accepted message types | State-changing behavior | Current risk |
| --- | --- | --- | --- | --- |
| `js/content_bridge.js` `handleMainWorldMessages` | `event.source === window`, type starts with `FilterTube_`, and `source !== "content_bridge"` | `FilterTube_InjectorToBridge_Ready`, `FilterTube_Refresh`, `FilterTube_UpdateChannelMap`, `FilterTube_UpdateVideoChannelMap`, `FilterTube_UpdateVideoMetaMap`, `FilterTube_UpdateCustomUrlMap`, `FilterTube_CollaboratorInfoResponse`, `FilterTube_SubscriptionsImportProgress`, `FilterTube_SubscriptionsImportResponse`, `FilterTube_CacheCollaboratorInfo`, `FilterTube_ChannelInfoResponse`, `FilterTube_CollabDialogData` | Persists maps, stamps DOM, touches cached metadata, resolves pending requests, applies collaborator data, and can rerun DOM fallback. | Same-window page scripts can send `FilterTube_*` messages unless a per-type pending request/source proof exists. |
| `js/injector.js` main-world listener | `event.source === window`, ignores `source === "injector"`, then accepts selected `source` strings | `FilterTube_SettingsToInjector`, `FilterTube_CacheCollaboratorInfo`, `FilterTube_RequestCollaboratorInfo`, `FilterTube_RequestChannelInfo` | Updates `currentSettings`, updates seed settings, processes queued data, caches collaborator info, and returns channel/collaborator responses. | Source labels are strings in a shared page-message channel; no nonce/origin token is pinned today. |
| `js/content/bridge_settings.js` subscription listener | `event.source === window` and `data.source === "injector"` | `FilterTube_InjectorBridgeReady`, `FilterTube_InjectorToBridge_Ready`, `FilterTube_SubscriptionsImportBridgeReady`, `FilterTube_SubscriptionsImportProgress`, `FilterTube_SubscriptionsImportResponse` | Marks importer bridge readiness, refreshes timeouts, and resolves pending subscription import requests. | This listener is narrower than `content_bridge.js`, but still string-source based. |
| `js/content/collab_dialog.js` broadcaster | Sends with wildcard target and `source: "collab_dialog"` | `FilterTube_CollabDialogData` | Provides dialog-extracted collaborator rosters to `content_bridge.js`. | Useful current flow, but accepted by `content_bridge.js` without nonce/request ownership. |

## Pending-Request Coverage

Some message flows do have request IDs and pending maps:

| Flow | Request owner | Response handling |
| --- | --- | --- |
| Collaborator lookup | `window.pendingCollaboratorRequests` in `content_bridge.js` | `FilterTube_CollaboratorInfoResponse` resolves a pending request when `requestId` exists, but collaborator payload can still be applied by `videoId` after that branch. |
| Single-channel lookup | `window.pendingChannelInfoRequests` in `content_bridge.js` | `FilterTube_ChannelInfoResponse` resolves a pending request when `requestId` exists. |
| Subscription import | `window.pendingSubscriptionImportRequests` in `content_bridge.js` and `bridge_settings.js` | Progress/response messages refresh or resolve a pending request. |

Other state-changing flows are not request-owned today:

| Message | Current side effect |
| --- | --- |
| `FilterTube_UpdateChannelMap` | Persists learned channel mappings. |
| `FilterTube_UpdateVideoChannelMap` | Persists video-to-channel mappings, stamps matching DOM cards, and schedules DOM fallback. |
| `FilterTube_UpdateVideoMetaMap` | Persists video metadata, clears cached duration/processed flags, and can schedule metadata DOM rerun. |
| `FilterTube_UpdateCustomUrlMap` | Persists custom URL to UC ID mappings. |
| `FilterTube_CacheCollaboratorInfo` | Stamps cards and applies collaborator data by video ID. |
| `FilterTube_CollabDialogData` | Applies dialog collaborators by `collabKey` and `videoId`. |
| `FilterTube_Refresh` | Requests settings and forces DOM fallback reprocessing. |

## Same-Window State-Changing Message Snapshot - 2026-05-27

This addendum pins the current message trust surface that can change learned
identity, collaborator state, settings refresh, or DOM fallback work from the
same-window bridge. It is audit-only. It does not approve message trust
changes, nonce insertion, map-write changes, collaborator behavior changes,
DOM rerun changes, or JSON-first promotion.

```text
content_bridge accepted FilterTube message rows: 12
state-changing rows without required pending request ownership: 8
content_bridge pending request maps: 3
injector string-source message listener rows: 1
subscription string-source message listener rows: 1
wildcard collab dialog broadcaster rows: 1
page-message trust behavior approval from this addendum: NO-GO
runtime behavior changed by this addendum: no
```

Accepted `content_bridge.js` message rows:

| Message row | Source pin | Pending/request ownership today | Current side-effect class |
| --- | --- | --- | --- |
| `FilterTube_InjectorToBridge_Ready` | `js/content_bridge.js:5842` | Not request-owned. | Requests settings from background. |
| `FilterTube_Refresh` | `js/content_bridge.js:5844` | Not request-owned. | Requests settings and forces DOM fallback reprocessing. |
| `FilterTube_UpdateChannelMap` | `js/content_bridge.js:5848` | Not request-owned. | Persists learned channel mappings. |
| `FilterTube_UpdateVideoChannelMap` | `js/content_bridge.js:5851` | Not request-owned. | Persists learned video-channel mappings, stamps matching DOM cards, and can rerun DOM fallback. |
| `FilterTube_UpdateVideoMetaMap` | `js/content_bridge.js:5900` | Not request-owned. | Persists learned video metadata, touches DOM flags, and can schedule metadata rerun. |
| `FilterTube_UpdateCustomUrlMap` | `js/content_bridge.js:5926` | Not request-owned. | Writes `channelMap` directly from the content bridge storage path. |
| `FilterTube_CollaboratorInfoResponse` | `js/content_bridge.js:5939` | Pending request may resolve, but `videoId` collaborator application still runs when collaborators exist. | Applies collaborator identity and can rerun menus/DOM fallback. |
| `FilterTube_SubscriptionsImportProgress` | `js/content_bridge.js:5965` | Owned by `pendingSubscriptionImportRequests`. | Refreshes pending import timeout and progress. |
| `FilterTube_SubscriptionsImportResponse` | `js/content_bridge.js:5984` | Owned by `pendingSubscriptionImportRequests`. | Resolves pending import response. |
| `FilterTube_CacheCollaboratorInfo` | `js/content_bridge.js:5992` | Not request-owned. | Stamps cards and applies collaborator identity by video ID. |
| `FilterTube_ChannelInfoResponse` | `js/content_bridge.js:6031` | Owned by `pendingChannelInfoRequests`. | Resolves pending single-channel lookup. |
| `FilterTube_CollabDialogData` | `js/content_bridge.js:6042` | Partially owned by `pendingCollabCards` when `collabKey` matches; `videoId` application still runs independently. | Applies dialog collaborators by card key and/or video ID. |

Pending request map rows:

| Pending map | Source pin | Current coverage |
| --- | --- | --- |
| `pendingCollaboratorRequests` | `js/content_bridge.js:5481` | Collaborator lookup request/response, but not all collaborator application. |
| `pendingChannelInfoRequests` | `js/content_bridge.js:5489` | Single-channel lookup request/response. |
| `pendingSubscriptionImportRequests` | `js/content_bridge.js:5497` | Subscription import progress/response. |

String-source and wildcard bridge rows:

| Bridge row | Source pin | Current trust boundary |
| --- | --- | --- |
| `injector_message_listener` | `js/injector.js:1916` | Same-window listener accepts string source labels such as `content_bridge` and `filter_logic`. |
| `subscription_import_listener` | `js/content/bridge_settings.js:148` | Same-window listener requires `data.source === "injector"` and pending import requests. |
| `collab_dialog_broadcast` | `js/content/collab_dialog.js:244-247` | Broadcasts collaborator dialog data with wildcard target and `source: "collab_dialog"`. |

## Source Proof

| Claim | Current source |
| --- | --- |
| `content_bridge.js` accepts same-window `FilterTube_*` messages and excludes only `source: "content_bridge"` at the top of the handler. | `js/content_bridge.js:5838`, `js/content_bridge.js:5839` |
| Learned video-channel map messages persist maps and can rerun DOM fallback. | `js/content_bridge.js:5859`, `js/content_bridge.js:5867`, `js/content_bridge.js:5899` |
| Video metadata map messages persist data and can schedule DOM rerun. | `js/content_bridge.js:5909`, `js/content_bridge.js:5913`, `js/content_bridge.js:5921` |
| Custom URL map messages write `channelMap` directly from the content bridge instead of a pending request or background enqueue path. | `js/content_bridge.js:5929`, `js/content_bridge.js:5933`, `js/content_bridge.js:5934` |
| Collaborator cache messages can apply collaborator data by `videoId` without pending request ownership. | `js/content_bridge.js:5992`, `js/content_bridge.js:6024` |
| Collaborator dialog messages are accepted and applied by `collabKey` or `videoId`. | `js/content_bridge.js:6042`, `js/content_bridge.js:6053`, `js/content_bridge.js:6064` |
| Refresh messages can fetch settings and force DOM fallback reprocessing. | `js/content_bridge.js:5845`, `js/content_bridge.js:5846` |
| Injector accepts string-source messages from `content_bridge` and `filter_logic`. | `js/injector.js:1873`, `js/injector.js:1881`, `js/injector.js:1901`, `js/injector.js:1914`, `js/injector.js:1964` |
| Collab dialog broadcasts with wildcard target and `source: "collab_dialog"`. | `js/content/collab_dialog.js:224` |

## Required Future Trust Contract

No runtime change should happen before fixtures prove the intended contract.
The minimum future contract should answer:

```text
message type
  -> allowed sender source label
  -> must have pending request? yes/no
  -> expected request id? yes/no
  -> allowed side effects
  -> allowed route/surface
  -> stale/replay handling
  -> DOM fallback rerun allowed? yes/no
```

Recommended next fixtures:

| Fixture | Required proof |
| --- | --- |
| `page_message_spoof_update_video_channel_map` | A page-origin spoof cannot persist learned maps or trigger DOM fallback. |
| `page_message_spoof_refresh` | A page-origin spoof cannot force DOM fallback reprocessing. |
| `page_message_spoof_custom_url_map` | A page-origin spoof cannot write `channelMap` directly from the content bridge. |
| `page_message_spoof_cache_collaborator_info` | A page-origin spoof cannot apply collaborator identity by `videoId` without an owned request. |
| `collaborator_response_requires_pending_request` | Response payloads cannot apply collaborators unless the request is pending or a separate trusted dialog flow is proven. |
| `collab_dialog_data_requires_owned_key` | Dialog payloads must match an owned pending `collabKey` before applying by `videoId`. |
| `injector_settings_requires_bridge_nonce` | Injector settings delivery must come from an owned bridge session, not just `source: "content_bridge"`. |

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this page message trust audit can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
