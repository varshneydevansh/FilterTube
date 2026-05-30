# FilterTube Message Sender Class Matrix - 2026-05-18

Status: current-behavior audit only. This document does not change runtime behavior.

This matrix exists because the same bug class appears in several shapes:
settings mutation, learned identity writes, DOM reruns, tab opens, injected
scripts, network lookups, and UI-only mutations are all carried through message
handlers. A future fix must not harden only one visible path while leaving a
sibling message path with the same authority.

## Capture Corpus Boundary

The ignored root capture files are valid evidence inputs, not runtime source.
They are intentionally listed in `.gitignore` and are summarized into:

- `docs/json_paths_encyclopedia.md`
- `docs/youtube_renderer_inventory.md`

Relevant ignored capture families currently include Main watch/next/up-next,
comments, playlists, collaboration pages, YouTube Music DOM/XHR, YouTube Kids,
and imported channel lists:

```text
DOMs.html
YT_MAIN.json
YT_MAIN_NEXT.json
YT_MAIN_UPNEXT_FEED_WATCHPAGE*.json
YT_MAIN_WATCH.html
YT_MAIN_NEXT_RESPONSE_COMMENT.json
playlist.json / playlist.html
collab.json / collab.html / collab_on_homepage.html / collab_in_playlist_mix.html
YTM.json / YTM-XHR.json / YTM-DOM.html / YTM-WATCH PLAYER.html
YT_KIDS.json / yt_kids_latest.json / ytkids_browse?alt=json.json
```

Future message hardening should keep those captures as fixtures/evidence only.
They must not become runtime fetch targets, packaged release files, or trusted
message senders.

## Current Background Runtime Message Inventory

Receiver: `browserAPI.runtime.onMessage` in `js/background.js`.

Current branch inventory:

| Action/message | Current receiver class | Current side effect | Future sender class |
| --- | --- | --- | --- |
| `FilterTube_ReleaseNotesCheck` | Any extension sender with runtime access | Reads/caches release-note state | `trustedUi` or `backgroundInternal` |
| `FilterTube_ReleaseNotesAck` | Any extension sender with runtime access | Writes seen release-note version | `trustedUi` |
| `FilterTube_FirstRunCheck` | Any extension sender with runtime access | Reads first-run state | `trustedUi` |
| `FilterTube_FirstRunComplete` | Any extension sender with runtime access | Writes first-run state | `trustedUi` |
| `FilterTube_OpenWhatsNew` | Any extension sender with runtime access | Opens a tab using caller URL fallback | `trustedUi` plus allowlisted URL |
| `FilterTube_SubscriptionsImportProgress` | Any extension sender with runtime access | Logs import progress | `allowedYoutubeContentScript` with pending import request |
| `getCompiledSettings` | Any extension sender with runtime access | Compiles/caches settings for inferred/requested profile | `allowedYoutubeContentScript` |
| `FilterTube_SessionPinAuth` | Guarded by `isTrustedUiSender(sender)` | Verifies and caches session PIN | `trustedUi` |
| `FilterTube_ClearSessionPin` | Guarded by `isTrustedUiSender(sender)` | Clears cached session PIN | `trustedUi` |
| `FilterTube_SetListMode` | Guarded by `isTrustedUiSender(sender)` | Mutates active profile mode and optionally migrates lists | `trustedUi` with lock/profile authority |
| `addWhitelistChannelPersistent` | Guarded by `isTrustedUiSender(sender)` | Adds Main whitelist channel and schedules backup | `trustedUi` |
| `FilterTube_BatchImportWhitelistChannels` | Guarded by `isTrustedUiSender(sender)` | Imports whitelist channels and schedules backup | `trustedUi` |
| `FilterTube_KidsWhitelistChannel` | Guarded by `isTrustedUiSender(sender)` | Adds Kids whitelist channel and schedules backup | `trustedUi` |
| `FilterTube_TransferWhitelistToBlocklist` | Guarded by `isTrustedUiSender(sender)` | Moves whitelist entries into blocklist | `trustedUi` with migration contract |
| `FilterTube_ScheduleAutoBackup` | Any extension sender with runtime access | Schedules auto backup from caller trigger/delay | `backgroundInternal` or `trustedUi` with clamp |
| `fetchShortsIdentity` | Any extension sender with runtime access | Performs YouTube Shorts identity fetch | `allowedYoutubeContentScript` with valid route/reason |
| `fetchWatchIdentity` | Any extension sender with runtime access | Performs YouTube watch identity fetch | `allowedYoutubeContentScript` with valid route/reason |
| `FilterTube_KidsBlockChannel` | Any extension sender with runtime access | Adds Kids blocklist channel and schedules backup | `trustedUi` or `allowedYoutubeContentScript` with Kids route/action proof |
| `injectScripts` | Any extension sender with tab/frame shape | Injects caller-selected packaged scripts into MAIN world | `backgroundInternal` only, or fixed allowlisted caller flow |
| `FilterTube_EnsureSubscriptionsImportBridge` | Any extension sender with caller tab ID | Injects subscription import bridge into caller-provided tab | `trustedUi` plus active pending import tab |
| `processFetchData` | Any extension sender with runtime access | Logging-only placeholder today | Remove or `backgroundInternal` |
| `addChannelPersistent` | Any extension sender with runtime access | Adds Main blocklist channel and schedules backup | `trustedUi` or `allowedYoutubeContentScript` with user action proof |
| `FilterTube_ApplySettings` | Any extension sender with settings payload | Overwrites compiled cache and broadcasts caller settings | `trustedUi` plus background-owned compile revision |
| `updateChannelMap` | Any extension sender with mappings payload | Writes learned channel map queue/cache | `allowedYoutubeContentScript` with provenance schema |
| `updateVideoChannelMap` | Any extension sender with video/channel payload | Writes learned video-channel map queue/cache | `allowedYoutubeContentScript` with provenance schema |
| `updateVideoMetaMap` | Any extension sender with meta payload | Writes learned video metadata queue/cache | `allowedYoutubeContentScript` with provenance schema |
| `recordTimeSaved` | Any extension sender with seconds payload | Writes stats from caller-provided seconds | `backgroundInternal` from structured hide decisions |
| `fetchChannelDetails` | Any extension sender with channel ID/handle | Performs YouTube channel detail fetch | `trustedUi` or `allowedYoutubeContentScript` with explicit reason |
| `getBrowserInfo` | Any extension sender with runtime access | Returns browser family | `allowedYoutubeContentScript` or `trustedUi` |
| `addFilteredChannel` | Secondary listener, any extension sender with type | Adds blocklist/Kids channel through 3-dot flow | `allowedYoutubeContentScript` with menu action proof and list target |
| `toggleChannelFilterAll` | Secondary listener, any extension sender with type | Mutates Filter All state | `trustedUi` or `allowedYoutubeContentScript` with menu action proof |

## Current Page-World Message Inventory

Receiver: `window.addEventListener('message', handleMainWorldMessages)` in
`js/content_bridge.js`. Current gate is same-window plus `FilterTube_` prefix;
the bridge ignores `source: 'content_bridge'`, but does not have nonce,
origin, pending request, or sender-class proof for every branch.

| Page message | Current gate | Current side effect | Future sender class |
| --- | --- | --- | --- |
| `FilterTube_InjectorToBridge_Ready` | Same window, source not bridge | Requests settings from background | `ownedPageWorldRequest` |
| `FilterTube_Refresh` | Same window, source not bridge | Forces settings reload and DOM fallback rerun | `ownedPageWorldRequest` with nonce |
| `FilterTube_UpdateChannelMap` | Same window, source not bridge | Persists learned channel mappings | `ownedPageWorldRequest` with schema/provenance |
| `FilterTube_UpdateVideoChannelMap` | Same window, source not bridge | Persists video-channel map, stamps DOM, reruns fallback | `ownedPageWorldRequest` with schema/provenance |
| `FilterTube_UpdateVideoMetaMap` | Same window, source not bridge | Persists video metadata and reruns duration DOM work | `ownedPageWorldRequest` with schema/provenance |
| `FilterTube_UpdateCustomUrlMap` | Same window, source not bridge | Writes custom URL -> UC map directly to storage | `ownedPageWorldRequest` with schema/provenance |
| `FilterTube_CollaboratorInfoResponse` | Same window, source not bridge, partial pending check | Resolves pending request and can still apply by video ID | `ownedPageWorldRequest` plus pending request |
| `FilterTube_SubscriptionsImportProgress` | Same window, pending request ID | Updates pending subscription import progress | `ownedPageWorldRequest` plus pending import |
| `FilterTube_SubscriptionsImportResponse` | Same window, pending request ID | Resolves pending subscription import | `ownedPageWorldRequest` plus pending import |
| `FilterTube_CacheCollaboratorInfo` | Same window, source not bridge | Applies collaborator cache to matching cards | `ownedPageWorldRequest` with provenance |
| `FilterTube_ChannelInfoResponse` | Same window, pending request ID | Resolves pending channel info request | `ownedPageWorldRequest` plus pending request |
| `FilterTube_CollabDialogData` | Same window, partial collab-key check | Applies collaborators by collab key and by video ID | `ownedPageWorldRequest` plus owned dialog key |

## Main-World Receiver Inventory

Receivers: `js/injector.js` and `js/content/bridge_settings.js`.

| Receiver message/action | Current gate | Current side effect | Future sender class |
| --- | --- | --- | --- |
| `FilterTube_SettingsToInjector` | `source === 'content_bridge'` | Updates main-world settings and processes queued data | `allowedYoutubeContentScript` with nonce |
| `FilterTube_CacheCollaboratorInfo` | `source === 'filter_logic'` | Caches collaborator payload in main world | `backgroundInternal`/owned filter runtime only |
| `FilterTube_RequestCollaboratorInfo` | `source === 'content_bridge'` | Reads main-world cache/ytInitialData and posts response | `allowedYoutubeContentScript` with request ID |
| `FilterTube_RequestChannelInfo` | `source === 'content_bridge'` | Reads ytInitialData channel identity and posts response | `allowedYoutubeContentScript` with request ID |
| `FilterTube_Ping` | Content-script runtime message | May inject main-world scripts for subscription import | `trustedUi` import flow |
| `FilterTube_RefreshNow` | Content-script runtime message | Forces DOM fallback rerun | `backgroundInternal` refresh broadcast |
| `FilterTube_ImportSubscribedChannels` | Content-script runtime message | Starts main-world subscription import | `trustedUi` import flow |
| `FilterTube_ApplySettings` | Content-script runtime message | Applies pushed settings after profile check | `backgroundInternal` compiled revision broadcast |

## Split-Authority Findings

### Similar Mutations Have Different Gates

```text
Kids whitelist add -> trusted UI guard
Kids block add     -> no trusted UI guard in primary background action

Main whitelist add -> trusted UI guard
Main block add     -> no trusted UI guard in addChannelPersistent path

Normal menu action -> separate UI/list-mode gating in content code
Fallback menu add  -> secondary background listener accepts type payload
```

This is dangerous because a future simultaneous allow/block model will need
per-entry action semantics. Sender class, list target, profile target, lock
state, backup trigger, cache invalidation, and broadcast target must be one
contract instead of branch-local behavior.

### Learned Identity Writes Are Authority-Changing

`updateChannelMap`, `updateVideoChannelMap`, `updateVideoMetaMap`,
`FilterTube_UpdateCustomUrlMap`, collaborator cache messages, and DOM identity
stamps are not just metadata. They affect later block/allow decisions,
whitelist pending behavior, quick menu labels, and persistence.

Future contract:

```text
learnedIdentityProvenance
  source surface: main | kids | ytm | app
  source route: home | search | watch | shorts | comments | playlist
  source channel: seed-json | page-world | dom-extractor | user-action
  confidence: explicit-UC | handle | byline | guessed | collaborator
  ttl/cap: required
  pending request id: required when response-based
```

### Page Messages Need Pending Ownership, Not Just Same Window

Current same-window checks prevent cross-frame messages, but not page-world
spoofing from the same YouTube document. The branches that mutate storage,
rerun DOM fallback, or apply collaborator data need either:

- a pending request ID created by FilterTube,
- an owned dialog/card key,
- an owned runtime nonce,
- or a route-scoped schema/provenance record.

## Required Future Contract

Before changing message behavior, add a `messageSenderClassMatrix` fixture set
covering:

```text
receiver
action/messageType
current gate
future sender class
allowed sender files
target profile/surface/list
storage keys touched
network/tab/script side effects
pending request or nonce requirement
route requirement
backup/cache/broadcast side effects
negative spoof fixture
```

This contract is a prerequisite for safe fixes to message trust, learned
identity provenance, stats, backup, list-mode mutation, and simultaneous
allow/block UI.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this message sender class matrix can support
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
