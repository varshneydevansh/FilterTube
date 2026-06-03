# FilterTube P0 Rule Mutation Current Behavior - 2026-05-19

Status: current-behavior proof. This is not an implementation patch.

This slice converts the P0 rule-mutation fixture names from
`docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md` into runnable
source proof. It answers one question: can every path that changes a rule,
rule-adjacent identity map, list mode, import payload, or synced profile section
produce one shared rule-mutation authority report today?

Current answer: no. The product has many legitimate writers, but there is no
single `ruleMutationAuthority` report that records actor class, target profile,
surface, list target, operation, storage keys, cache invalidation, lock result,
backup trigger, refresh scope, and compiled settings revision for each writer.

## Fixture Status

| P0 fixture | Current result | Source proof | Risk |
| --- | --- | --- | --- |
| `rule_mutation_report_exists_for_state_manager_add_keyword` | Not satisfied today. | `js/state_manager.js:1338-1405` writes blocklist or whitelist keyword state from `state.mode`, calls `saveSettings()` or `persistMainProfiles()`, requests refresh, notifies listeners, and schedules backup without a mutation report. | Keyword rows inherit mode at write time, which blocks simultaneous allow/block migration and makes audit trails incomplete. |
| `rule_mutation_report_exists_for_state_manager_add_channel` | Not satisfied today. | `js/state_manager.js:1582-1617` chooses `addWhitelistChannelPersistent` or `addChannelPersistent` from `state.mode` and sends a background message without a row-level list target report. | Channel adds rely on mode inference and split background actions. |
| `rule_mutation_report_exists_for_background_add_filtered_channel` | Not satisfied today. | `js/background.js:4109-4394` handles `addChannelPersistent`; `js/background.js:5244-5281` handles secondary `addFilteredChannel`, normalizes `message.listType`, and forwards explicit whitelist requests to the helper. | Quick/menu/native writes can add rules through a different trust path than popup/tab UI; the receiver now preserves explicit list-target intent but still has no mutation report. |
| `rule_mutation_report_exists_for_kids_block_and_whitelist` | Not satisfied today. | `js/background.js:3706-3758` gates Kids whitelist with `isTrustedUiSender()`, while `js/background.js:3967-4008` Kids block lacks the same sender gate; neither returns a structured mutation report. | Kids block and whitelist have similar side effects but different sender classes. |
| `rule_mutation_report_exists_for_list_mode_transfer` | Not satisfied today. | `js/background.js:3290-3497` and `js/background.js:3759-3949` move, merge, clear, invalidate caches, broadcast refresh, and schedule backup without dry-run, rollback, or revision proof. | List-mode migration can destructively move state with no shared before/after report. |
| `rule_mutation_report_exists_for_managed_child_edit` | Not satisfied today. | `js/tab-view.js:4252-4301` checks parent authority, applies a caller mutator, writes `saveProfilesV4()`, reloads StateManager, rerenders UI, and updates stats without a mutation authority report. | Child edits bypass the same writer/report path normal profile edits need. |
| `rule_mutation_report_exists_for_import_v3` | Not satisfied today. | `js/io_manager.js:1223-1704` can call `SettingsAPI.saveSettings()`, `saveProfilesV3()`, `saveProfilesV4()`, `writeStorage({ channelMap })`, theme writes, and Nanah trusted-state restore without one mutation report. | Import can rewrite multiple rule families and profile metadata at once. |
| `rule_mutation_report_exists_for_nanah_scoped_apply` | Not satisfied today. | `js/nanah_sync_adapter.js:168-256` merges or replaces Main/Kids profile sections and writes `saveProfilesV4()` directly, returning only `ok`, `scope`, `profileId`, and `strategy`. | P2P sync can alter profile rules without lock, revision, refresh, or mutation-report proof. |
| `rule_mutation_report_exists_for_learned_identity_writes` | Not satisfied today. | `js/content_bridge.js:5468-5568` accepts same-window page messages that persist video/channel/meta/custom-url maps and can rerun DOM fallback; `js/background.js:4381-4420` accepts compiled settings and learned-map updates without provenance report. | Learned identity maps are rule inputs; poisoned or stale identity can make later rules match the wrong content. |
| `content_script_channel_add_requires_allowed_youtube_action` | Not satisfied today. | `js/content_bridge.js:12792-12822` sends `addFilteredChannel`; `js/background.js:5209-5246` accepts it without `isTrustedUiSender()` or a separate `allowedYoutubeContentScript` action token. | Content-script rule writes are not classified apart from UI/internal writers. |
| `page_world_identity_update_requires_owned_request` | Not satisfied today. | `js/content_bridge.js:5468-5568` accepts `FilterTube_UpdateVideoChannelMap`, `FilterTube_UpdateVideoMetaMap`, and `FilterTube_UpdateCustomUrlMap` after only same-window/source checks. | Page-world identity writes are not tied to a pending owned request id or capability. |

## Required Future Report

Before changing rule mutation behavior, add a `ruleMutationAuthority` report that
records at least:

```text
actor:
  trustedUi | allowedYoutubeContentScript | ownedPageWorldRequest | backgroundInternal | import | nanah

target:
  profileId, profileType, surface, ruleFamily, listTarget

operation:
  add | remove | toggle | transfer | import | sync | learnedIdentityWrite

guards:
  sender class, route/surface allowlist, active user action, profile lock,
  parent/child authority, schema sanitizer, identity confidence

effects:
  V3/V4 storage keys, learned-map keys, cache invalidation, backup trigger,
  runtime broadcast scope, stats side effects, compiled settings revision
```

## Current Verdict

P0 rule mutation authority is not implementation-ready. The current behavior is
now fixture-proven so future work can centralize mutation reports without
silently breaking the existing writers that users rely on today.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 rule mutation gate can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
