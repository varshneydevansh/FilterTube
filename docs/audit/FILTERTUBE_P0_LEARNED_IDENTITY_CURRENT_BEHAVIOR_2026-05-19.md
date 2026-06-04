# FilterTube P0 Learned Identity Current Behavior - 2026-05-19

Status: current-behavior proof. This is not an implementation patch.

This slice converts learned identity into a P0 stabilization family because
learned maps can affect filtering even when the visible user lists look empty
or correct. The stores are useful, but they need one shared authority before we
trust them more, prune them, or let them drive allow/block decisions.

Current answer: no shared `learnedIdentityAuthority` exists today. Identity can
be learned from JSON, DOM, page-world messages, collaborator dialogs, custom URL
messages, and background helper paths. Some source paths validate strongly, but
later receivers and caches can accept weaker proof, write storage directly,
merge pending maps into compiled settings, or trigger DOM fallback reruns.
The affected stores include `channelMap`, `videoChannelMap`, `videoMetaMap`,
`resolvedCollaboratorsByVideoId`, and DOM `data-filtertube-*` identity markers.

## Fixture Status

| P0 fixture | Current result | Source proof | Risk |
| --- | --- | --- | --- |
| `learned_identity_channel_map_requires_uc_handle_shape` | Not satisfied today. | `js/background.js:1495-1525` accepts trimmed non-empty `key`/`value` pairs and mapping `id`/`handle` pairs without enforcing UC ID or `@handle` shape. | Bad learned channel mappings can make later channel rules match the wrong identity. |
| `learned_identity_video_channel_map_requires_video_and_uc_shape` | Not satisfied today in the background receiver. | `js/background.js:1933-1670` trims non-empty `videoId` and `channelId` strings but does not enforce 11-character video IDs or UC channel IDs. | Bad `videoId -> channelId` links can enter pending/cache state. |
| `learned_identity_engine_source_guard_is_stronger_than_background_receiver` | Satisfied only at the engine source edge. | `js/filter_logic.js:50-52` validates video and UC shape before posting, while `js/background.js:1933-1670` does not preserve the same invariant. | A strong source guard can be bypassed by another receiver path. |
| `learned_identity_pending_video_map_enters_compiled_settings_before_flush` | Current behavior. | `js/background.js:2411-2423` merges `pendingVideoChannelMapUpdates` into compiled settings before debounced durable storage flush completes. | Pending learned identity can influence runtime decisions before revision/durability proof. |
| `learned_identity_storage_invalidation_omits_map_keys` | Current behavior. | `js/background.js:4458-4476` omits `channelMap`, `videoChannelMap`, and `videoMetaMap` from storage-change invalidation keys. | Direct map changes can leave compiled caches stale. |
| `learned_identity_page_video_map_persists_before_dom_ownership` | Current behavior. | `js/content_bridge.js:5482-5497` persists `FilterTube_UpdateVideoChannelMap` before checking `shouldStampCardForVideoId()`. | Storage can learn an owner relation before current DOM ownership is proven. |
| `learned_identity_custom_url_map_bypasses_background_authority` | Current behavior. | `js/content_bridge.js:5557-5568` writes `channelMap` directly through content storage APIs. | Background cache and invalidation policy can drift from storage. |
| `learned_identity_video_meta_map_can_trigger_dom_rerun` | Current behavior. | `js/content_bridge.js:5531-5555` persists video metadata, touches DOM processed flags, and schedules DOM fallback when matching nodes are touched. | Metadata harvest can wake DOM work and later content/date/duration/category decisions. |
| `learned_identity_collaborator_apply_lacks_universal_pending_request_ownership` | Current behavior. | `js/content_bridge.js:5570-5700` has pending branches but can still apply collaborators by `videoId` from response, cache, or dialog data. | Collaborator identity can affect menus/cards without universal request ownership. |
| `learned_identity_resolved_collaborators_force_menu_and_dom_rerun` | Current behavior. | `js/content_bridge.js:3298-3390` caches collaborators, refreshes menus/popovers, and schedules forced DOM fallback. | Learned identity is also a performance trigger. |
| `learned_identity_channel_match_uses_map_and_name_fallback` | Current behavior. | `js/content_bridge.js:4947-5100` uses `channelMap` cross-matches and name fallback in channel matching. | Map quality and name-only confidence directly affect false-hide/false-leak boundaries. |
| `learned_identity_avatar_stack_collaborator_source_is_high_risk` | Current behavior. | `js/filter_logic.js:2896-2996` can promote `avatarStackViewModel` entries to collaborators; `docs/json_paths_encyclopedia.md` warns Mix/Radio avatar stacks are collection art, not collaborator renderers. | Mix/radio art can be mistaken for collaborator identity without stronger source classification. |
| `learned_identity_future_authority_token_is_absent_from_product_source` | Current behavior. | The product source has no `learnedIdentityAuthority` token or report. | Fixes can harden one path while another identity writer still influences filtering. |

## Required Future Authority

Before changing learned-map trust, pruning stale maps, broadening JSON renderer
coverage, or reducing DOM fallback work, add a `learnedIdentityAuthority` report
that records at least:

```text
source:
  jsonEndpoint | domSelector | pageWorldMessage | collaboratorDialog |
  backgroundFetch | import | nanah | migration

target:
  mapKey, mapValue, videoId, channelId, handle, profileId, surface, route

proof:
  endpoint/path, renderer path, DOM selector, pending request id, nonce or
  capability, owner card proof, timestamp, confidence, source revision

permissions:
  mayPersist, mayAffectFiltering, mayStampDom, mayRerunDomFallback,
  mayRefreshMenus, mayEnterCompiledSettings

effects:
  storage keys, cache keys, invalidation keys, compiled settings revision,
  DOM marker keys, menu refresh scope, rerun budget
```

## Current Verdict

P0 learned identity authority is not implementation-ready. The current product
has useful learned identity plumbing, but it does not yet distinguish a
harvested hint from filtering authority across every writer and receiver.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 learned identity gate can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
