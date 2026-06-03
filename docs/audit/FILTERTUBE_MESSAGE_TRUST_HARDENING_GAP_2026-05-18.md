# FilterTube Message Trust Hardening Gap - 2026-05-18

Status: current-behavior audit artifact. This is not an implementation patch.

This file connects two previously separate trust surfaces:

- background `runtime.onMessage` actions in `js/background.js`
- same-window page messages in `js/content_bridge.js`, `js/injector.js`, and
  `js/content/bridge_settings.js`

The purpose is to make the next implementation phase explicit: no background
mutation, learned-map write, script injection, tab open, fetch, DOM fallback
rerun, or caller-supplied settings broadcast should be changed until a negative
fixture proves who is allowed to trigger it.

## Required Sender Classes

Future message handling needs a small sender vocabulary:

| Sender class | Meaning | Examples |
| --- | --- | --- |
| `trustedUi` | Extension pages opened from the FilterTube extension origin. | Dashboard, popup, options-style UI, release notes. |
| `allowedYoutubeContentScript` | FilterTube content scripts running on allowed YouTube, YouTube Music, or YouTube Kids origins. | 3-dot block action, learned identity reports, current-tab route status. |
| `ownedPageWorldRequest` | Page-world response tied to a nonce/request id issued by FilterTube. | channel lookup response, collaborator lookup response, subscription import bridge response. |
| `backgroundInternal` | Background-owned retry/cache/flush work that is not caller-controlled. | debounced map flush, compiled settings revision, backup scheduling. |

Current source has partial `trustedUi` coverage through
`isTrustedUiSender(sender)`, but it does not yet have one contract that covers
all message classes.

## Current High-Risk Background Actions

| Action | Current caller proof | Side effect | Missing negative fixture |
| --- | --- | --- | --- |
| `FilterTube_OpenWhatsNew` | none beyond runtime message reachability | opens caller-provided URL or fallback release URL | untrusted sender cannot open arbitrary URL |
| `injectScripts` | sender tab/frame exists | injects caller-selected packaged JS into page `MAIN` world | only approved script names on allowed YouTube routes can execute |
| `FilterTube_EnsureSubscriptionsImportBridge` | caller-provided `tabId` is numeric | injects import bridge into caller-provided tab | only trusted UI can inject into the active subscriptions route |
| `FilterTube_ApplySettings` | caller provides `settings` object | overwrites compiled cache and broadcasts caller settings to matching tabs | untrusted sender cannot change runtime settings cache or broadcast |
| `updateChannelMap` | caller provides mappings | writes learned channel map | invalid/untrusted map entries cannot persist |
| `updateVideoChannelMap` | caller provides video/channel IDs | writes learned video-channel map and updates compiled cache immediately | invalid/untrusted video mapping cannot affect compiled settings |
| `updateVideoMetaMap` | caller provides video metadata | writes learned metadata map and updates compiled cache | invalid/untrusted metadata cannot wake duration/date filtering |
| `recordTimeSaved` | caller provides seconds | writes stats | negative/huge/non-finite values cannot mutate stats |
| `fetchChannelDetails` | caller provides channel identifier | performs credentialed YouTube channel HTML fetch | untrusted sender cannot trigger authenticated YouTube fetch work |
| `FilterTube_KidsBlockChannel` | no `trustedUi` guard, unlike Kids whitelist | writes Kids blocklist and broadcasts refresh | Kids block and Kids whitelist must use the same caller class |
| `addFilteredChannel` listener #2 | content-script message type | writes blocklist/default list and backup side effects | list type and sender class must be explicit |

## Current High-Risk Page Messages

| Message | Current caller proof | Side effect | Missing negative fixture |
| --- | --- | --- | --- |
| `FilterTube_Refresh` | same `window`, `FilterTube_` prefix, not `source: "content_bridge"` | forces DOM fallback reprocessing | page-origin spoof cannot force reprocess |
| `FilterTube_UpdateVideoChannelMap` | same-window message | persists video-channel mapping, stamps DOM, reruns DOM fallback | spoofed video/channel pair cannot persist or rerun fallback |
| `FilterTube_UpdateVideoMetaMap` | same-window message | persists metadata, touches processed DOM flags, schedules rerun | spoofed video metadata cannot touch DOM/cache |
| `FilterTube_UpdateCustomUrlMap` | same-window message | writes `channelMap` directly from content bridge storage APIs | spoofed custom URL cannot bypass background map path |
| `FilterTube_CollaboratorInfoResponse` | pending request optional | may apply collaborators by `videoId` after pending resolution branch | response cannot apply without owned pending request or trusted dialog key |
| `FilterTube_CacheCollaboratorInfo` | same-window message | applies collaborators by `videoId` without pending request | cache message cannot stamp/apply identity without owned request |
| `FilterTube_CollabDialogData` | same-window message, optional `collabKey` | can apply by `videoId` even when `collabKey` is missing or not pending | dialog data must match owned `collabKey` before applying by video ID |

## Learned Identity Poison Chain

```text
page-world message
        |
        v
content_bridge.js message handler
        |
        +--> persistVideoChannelMapping(videoId, channelId)
        |         |
        |         v
        |   background updateVideoChannelMap
        |         |
        |         v
        |   pendingVideoChannelMapUpdates
        |         |
        |         +--> storage flush later
        |         +--> compiledSettingsCache.main/kids immediate merge
        |
        +--> applyDOMFallback(null)
```

That chain is useful when the data came from a real YouTube JSON response or an
owned lookup. It is risky when a page-world message can send the same shape
without nonce, pending request ownership, route proof, or renderer provenance.

## Required Negative Fixture Names

These are intentionally named as future proof gates. They should fail against
the current behavior until implementation changes are made.

```text
background_rejects_untrusted_apply_settings
background_rejects_untrusted_script_injection
background_rejects_untrusted_subscriptions_bridge_injection
background_rejects_arbitrary_whats_new_url
background_rejects_untrusted_channel_detail_fetch
background_rejects_invalid_learned_channel_map_entries
background_rejects_invalid_video_channel_map_entries
background_rejects_invalid_video_meta_map_entries
background_rejects_unbounded_time_saved_stats
page_message_rejects_spoof_refresh
page_message_rejects_spoof_video_channel_map
page_message_rejects_spoof_video_meta_map
page_message_rejects_spoof_custom_url_map
page_message_requires_pending_collaborator_response
page_message_requires_owned_collab_dialog_key
```

## Implementation Gate

Do not harden one message path in isolation. The correct next implementation
surface is a shared message/mutation contract:

```text
message type
  -> sender class
  -> allowed source files
  -> target route/origin
  -> target profile/list/surface
  -> allowed storage keys
  -> allowed runtime cache updates
  -> allowed tab broadcasts
  -> allowed page side effects
  -> required nonce/request id/provenance
  -> response/error contract
```

Once this exists, JSON filtering, DOM fallback, quick block, whitelist pending,
and future simultaneous allow/block work can depend on a single trust boundary
instead of many local assumptions.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this message trust hardening gap can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
