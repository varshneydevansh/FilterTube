# FilterTube Learned Identity Authority Audit - 2026-05-18

Status: audit artifact only. This file does not change extension, website, or
runtime behavior.

This pass covers identity learned from YouTube JSON, DOM, page-world messages,
collaborator dialogs, and background helper fetches. These maps are powerful:
they are not user-facing rules, but they can make later blocklist/whitelist
decisions match or miss.

## Identity Stores

| Store | Shape | Writers | Readers / impact |
| --- | --- | --- | --- |
| `channelMap` | UC ID `<->` handle/custom URL mappings | JSON harvest, content bridge, background channel-add paths, custom URL map writes | Channel matching, UI display, handle-to-UC repair, channel add dedupe. |
| `videoChannelMap` | `videoId -> channelId` | JSON harvest, card prefetch, page-world map messages, channel-add helper | Shorts, playlist rows, watch-next, and cards that lack direct owner identity. |
| `videoMetaMap` | `videoId -> { lengthSeconds, publishDate, uploadDate, category }` | JSON/player metadata harvest, watch-page metadata fetches, page-world map messages | Duration/date/category filters and DOM fallback reprocessing. |
| `resolvedCollaboratorsByVideoId` | `videoId -> collaborators[]` in memory | collaborator dialog/sheet/main-world responses, cache messages | Collaboration menu rows, block-all collaborator actions, DOM fallback reruns. |
| DOM identity attrs | `data-filtertube-*` on cards | DOM extraction, page-message handlers, collaborator application, prefetch | Later DOM fallback and menu targeting. |

## Current Flow

```text
YouTube JSON / DOM / main-world message
        |
        +--> FilterTube_UpdateChannelMap
        |       -> channelMap storage/cache
        |
        +--> FilterTube_UpdateVideoChannelMap
        |       -> currentSettings.videoChannelMap
        |       -> background pending video map
        |       -> compiled settings can include pending map before flush
        |       -> DOM fallback may rerun
        |
        +--> FilterTube_UpdateVideoMetaMap
        |       -> currentSettings.videoMetaMap
        |       -> background pending meta map
        |       -> touched DOM flags + debounced rerun
        |
        +--> collaborator response/dialog/cache
                -> resolvedCollaboratorsByVideoId
                -> card attrs
                -> active menu refresh
                -> DOM fallback rerun
```

This is useful for hard YouTube surfaces, but it is also a separate authority
from user-visible keyword/channel rows.

## High-Confidence Findings

| Area | Current behavior | Source proof | Risk |
| --- | --- | --- | --- |
| Background channel-map validation | `enqueueChannelMapMappings()` requires only `id` and `handle`, then writes both directions through `enqueueChannelMapUpdate()`; it does not validate `id` as UC or `handle` as `@...`. | `js/background.js:1495-1525` | Bad learned mappings can cross-match future channel rules. |
| Background video-map validation | `enqueueVideoChannelMapUpdate()` trims non-empty strings but does not enforce 11-character video IDs or UC IDs. | `js/background.js:1648-1670` | Bad `videoId -> channelId` data can enter pending/cache state. |
| Engine-side video-map validation | `filter_logic.js` validates video IDs and UC IDs before posting `FilterTube_UpdateVideoChannelMap`. | `js/filter_logic.js:50-52` | Good source-side guard exists, but later content/background receivers do not preserve the same invariant. |
| Pending map compile | `getCompiledSettings()` merges pending `pendingVideoChannelMapUpdates` into compiled settings before the debounced storage flush completes. | `js/background.js:2411-2423` | Newly learned identity can affect runtime before durable storage/revision accounting. |
| Invalidation drift | Background storage invalidation omits `channelMap`, `videoChannelMap`, and `videoMetaMap`. | `js/background.js:4458-4476` | Direct storage writes or map changes can leave compiled caches stale unless another path manually patches them. |
| Content video-map persistence before DOM proof | `FilterTube_UpdateVideoChannelMap` calls `persistVideoChannelMapping()` before card ownership checks/stamping. | `js/content_bridge.js:5482-5497` | Storage/cache can learn a relationship even when no current DOM card has proven ownership. |
| Custom URL direct write | `FilterTube_UpdateCustomUrlMap` writes `channelMap` directly from content bridge storage APIs instead of using the background enqueue/cache path. | `js/content_bridge.js:5557-5568` | Background caches and invalidation can drift from storage. |
| Video metadata rerun | `FilterTube_UpdateVideoMetaMap` persists metadata, touches DOM processed flags, and schedules DOM rerun when matching nodes are touched. | `js/content_bridge.js:5531-5555` | Metadata harvest can wake DOM work and later date/duration/category decisions. |
| Collaborator response ownership | `FilterTube_CollaboratorInfoResponse` resolves pending requests when present, but also applies collaborators by `videoId` whenever a collaborators array exists. | `js/content_bridge.js:5570-5595` | Collaborator data can affect DOM/menu state without universal pending request ownership. |
| Collaborator cache ownership | `FilterTube_CacheCollaboratorInfo` stamps matching cards and forces collaborator application from a page-world cache message. | `js/content_bridge.js:5623-5661` | A cache message can mutate DOM identity and menu state. |
| Dialog collaborator ownership | `FilterTube_CollabDialogData` applies by pending `collabKey`, but also applies by `videoId` if provided. | `js/content_bridge.js:5673-5700` | Dialog and video-ID pathways can diverge. |
| Collaborator rerun side effect | `applyResolvedCollaborators()` sets `resolvedCollaboratorsByVideoId`, refreshes menus/popovers, and schedules forced DOM fallback. | `js/content_bridge.js:3298-3390` | Collaborator identity is also a runtime reprocessing trigger. |
| Channel matching dependence | `channelMatchesFilter()` uses `channelMap` for UC/handle cross-matching and still has name-based fallback for collaborator/name-only cases. | `js/content_bridge.js:4947-5100` | Map quality and name-only confidence directly affect false-hide/false-leak boundaries. |
| Avatar stack collaborator promotion | `filter_logic.js` can promote `avatarStackViewModel` to collaborators before later renderer-specific policy. | `js/filter_logic.js:2896-2996`; `docs/json_paths_encyclopedia.md:238-243` | Mix/radio avatar stacks need hard guardrails so playlist collection art does not become collaborator identity. |

## Required Future Contract

Every learned identity write should carry:

```text
source surface
source endpoint or DOM selector
route
videoId proof
channelId/handle proof
confidence
whether the identity may affect blocklist/whitelist decisions
whether the identity may be persisted
whether DOM fallback may rerun
revision/invalidation effect
```

Map writes should be rejected or quarantined if they lack a valid source class.
The important distinction is:

```text
harvested hint != filtering authority
```

Hints can improve menus and later resolver attempts, but filtering decisions
should require validated identity confidence.

## Fixture Coverage

Executable current-behavior fixtures are in:

```text
tests/runtime/learned-identity-authority-current-behavior.test.mjs
```

They pin:

- weak background map validation,
- stronger engine-side video-map validation,
- pending video maps entering compiled settings,
- map keys omitted from background invalidation,
- direct content-side custom URL storage writes,
- video-map persistence before DOM ownership proof,
- collaborator application and rerun side effects,
- channel matching dependence on learned maps.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this learned identity authority audit can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
