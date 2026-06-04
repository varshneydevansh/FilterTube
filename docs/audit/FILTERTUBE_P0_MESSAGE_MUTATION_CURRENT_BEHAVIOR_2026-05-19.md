# FilterTube P0 Message And Mutation Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

This slice starts converting the P0 message-trust, security/PIN lock, mutation,
and rule-mutation families into runnable proof. It focuses on the paths most
likely to affect filtering correctness before simultaneous allow/block,
performance optimization, or sender hardening work begins.

## P0 Fixture Families Covered

```text
P0 message trust:
  message_sender_matrix_channel_mutations_have_uniform_sender_classes
  background_rejects_untrusted_apply_settings
  background_rejects_untrusted_script_injection
  background_rejects_untrusted_subscriptions_bridge_injection
  background_rejects_arbitrary_whats_new_url
  background_rejects_untrusted_channel_detail_fetch
  page_message_rejects_spoof_refresh
  page_message_rejects_spoof_video_channel_map
  page_message_requires_pending_collaborator_response

P0 security/PIN lock:
  content_script_rejects_add_filtered_channel_without_ui_owner
  nanah_apply_requires_target_profile_authority

P0 mutation:
  set_list_mode_copy_false_does_not_clear_blocklist
  apply_settings_payload_cannot_override_background_revision

P0 rule mutation authority:
  rule_mutation_report_exists_for_background_add_filtered_channel
  rule_mutation_report_exists_for_kids_block_and_whitelist
  rule_mutation_report_exists_for_list_mode_transfer
  content_script_channel_add_requires_allowed_youtube_action
  page_world_identity_update_requires_owned_request
```

These names are future expectations. The current tests intentionally pin where
today's source is weaker, split, or missing a structured authority report.

## Current Findings

| P0 fixture | Current behavior | Current proof | Future expectation |
| --- | --- | --- | --- |
| `message_sender_matrix_channel_mutations_have_uniform_sender_classes` | Similar channel mutations do not share sender policy: Kids whitelist and Main whitelist use `isTrustedUiSender(sender)`, while Kids block, Main block, secondary `addFilteredChannel`, and secondary `toggleChannelFilterAll` do not. | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | All rule-mutation entrypoints should report one sender class and one target profile/list authority. |
| `background_rejects_untrusted_apply_settings` | `FilterTube_ApplySettings` still lacks a sender guard, but caller settings now act only as an invalidation signal: the branch clears the target cache, recompiles from storage, and broadcasts background-compiled settings. | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Callers may request refresh, but sender class, background-owned compiled settings, and revision must remain runtime truth. |
| `background_rejects_untrusted_script_injection` | `injectScripts` maps caller-provided names into packaged `js/*.js` files and injects them in `MAIN` world for the sender tab/frame. | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Script injection should be allowlisted, route-scoped, and background-internal or tied to a named trusted flow. |
| `background_rejects_untrusted_subscriptions_bridge_injection` | `FilterTube_EnsureSubscriptionsImportBridge` injects fixed files into caller-provided `tabId` without a trusted UI/pending-import tab proof in that branch. | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Subscription bridge injection should require an active import request and target tab URL proof. |
| `background_rejects_arbitrary_whats_new_url` | `FilterTube_OpenWhatsNew` opens `request.url || WHATS_NEW_PAGE_URL`. | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Only packaged, allowlisted release/What's New URLs should open from this action. |
| `background_rejects_untrusted_channel_detail_fetch` | `fetchChannelDetails` calls `fetchChannelInfo(request.channelIdOrHandle)` without sender-class or fetch-budget proof in that branch. | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Channel-detail fetch should require a trusted UI action or allowed YouTube content-script resolver reason. |
| `page_message_rejects_spoof_refresh` | Same-window `FilterTube_Refresh` asks background for settings and forces `applyDOMFallback(..., { forceReprocess: true })` without nonce ownership. | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | DOM reruns should come from owned background broadcasts or nonce/request-bound page messages. |
| `page_message_rejects_spoof_video_channel_map` | Same-window `FilterTube_UpdateVideoChannelMap` persists `videoId -> channelId` before DOM/card provenance and can schedule another DOM fallback run. | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Learned video-channel maps need renderer/card provenance before persistence. |
| `page_message_requires_pending_collaborator_response` | `FilterTube_CollaboratorInfoResponse` resolves pending requests when present, but also applies collaborator data by `videoId` when collaborator data exists. | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Collaborator application should require a pending request, owned renderer source, or owned dialog key. |
| `set_list_mode_copy_false_does_not_clear_blocklist` | `FilterTube_SetListMode` parses `copyBlocklist`, but switching to whitelist still calls `mergeAndClearBlocklistIntoWhitelist(requestedProfile)`. | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Mode switching must have a dry-run mutation report and must not clear lists unless the user-selected migration plan says so. |
| `content_script_rejects_add_filtered_channel_without_ui_owner` | Secondary `addFilteredChannel` uses `message.type`, lacks `isTrustedUiSender(sender)`, and now forwards normalized `message.listType` to the shared helper. | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Content-script rule adds should still require allowed YouTube action proof, route/surface, row/menu target, and explicit list target authority. |
| `nanah_apply_requires_target_profile_authority` | `FilterTubeNanahAdapter.applyScopedPortablePayload()` writes V4 profile state through `io.saveProfilesV4()` without a shared rule mutation report or target-profile authority object. | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Nanah scoped apply needs target profile, sender/trust, preview/apply, revision, and storage-effect proof. |

## Why This Matters

```text
visible UI lock / profile mode / row intent
        |
        +--> one guarded background action
        |
        +--> sibling unguarded content-script action
        |
        +--> page-world learned identity update
        |
        +--> compiled settings payload broadcast
```

If these paths remain split, a future optimization can make the UI look faster
while stale settings, spoofable learned identity, or a weaker sibling mutation
path still changes what gets hidden. The same split blocks simultaneous
allow/block because current rows do not carry a durable `block | allow` action;
the system infers action from mode and mutation path.

## Required Future Message/Mutation Contract

Every persistent or cross-context message side effect needs one report:

```text
receiver/message
  -> senderClass
  -> trusted route/origin/profile/list target
  -> lock/session result
  -> operation type
  -> normalized input and provenance
  -> storage keys touched
  -> cache invalidation and broadcast target
  -> backup/stat/network/script/tab side effects
  -> negative spoof fixture
```

## Current Verdict

```text
P0 message/mutation slice is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
```

Related artifacts:

- `docs/audit/FILTERTUBE_MESSAGE_SENDER_CLASS_MATRIX_2026-05-18.md`
- `docs/audit/FILTERTUBE_MESSAGE_SIDE_EFFECT_REGISTER_2026-05-18.md`
- `docs/audit/FILTERTUBE_MESSAGE_TRUST_HARDENING_GAP_2026-05-18.md`
- `docs/audit/FILTERTUBE_RULE_MUTATION_ENTRYPOINT_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_UNIFIED_MUTATION_CONTRACT_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_SECURITY_PIN_LOCK_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 message/mutation gate can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
