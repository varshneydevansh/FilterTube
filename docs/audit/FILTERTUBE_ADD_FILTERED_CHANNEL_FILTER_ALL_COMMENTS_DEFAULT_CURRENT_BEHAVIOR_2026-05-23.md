# FilterTube addFilteredChannel Filter All Comments Default Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, comments patch, settings patch, JSON-first patch,
channel-add patch, Filter All patch, backup patch, or compiler patch.

This slice pins how content and background channel-add paths handle the
comment-scope half of Filter All. The previous Main comments-scope proof showed
how `filterAllComments` can be toggled after a channel exists. This proof shows
that `addFilteredChannel` paths can carry `filterAll`, but do not carry an
initial `filterAllComments` choice, so missing comments scope later compiles as
comment-enabled.

## Boundary Source Files

addFilteredChannel Filter All comments default source files: 4

addFilteredChannel Filter All comments default source/effect blocks: 8

runtime addFilteredChannel Filter All comments default fixtures: 11

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |
| `js/state_manager.js` | 2,491 | 99,780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/settings_shared.js` | 1,181 | 57,535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |

## Pinned Source Blocks

| Block | Anchor | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `contentBridgeAddChannelDirectly` | `js/content_bridge.js:13440` | 54 | 2662 | `4eb280573a5611b695c8284a8e6b85d17b2a97c459143a3054d02374cdf7c2ca` |
| `backgroundAddFilteredChannelReceiver` | `js/background.js:5565` | 39 | 1579 | `f681057e88e4c6aef657464bca124f8d3ae4d59f4d11ca5f05e1135dcf1615f2` |
| `backgroundHandleAddFilteredChannelSignature` | `js/background.js:5630` | 2 | 204 | `ce94174aa1b2f302e1e89a75b463271aa13d1c95f62cb89ee34364fb9c3ab603` |
| `backgroundExistingChannelUpdate` | `js/background.js:6273` | 21 | 1247 | `9ac97ce884e9c319e0267a60bbbacbdb26b0a3ea6f1f0cca416615ad234e96dd` |
| `backgroundNewChannelObject` | `js/background.js:6323` | 20 | 1081 | `5fa1776809d1d10187ead655c7b8a566c15935b2667f95e8cd5f7875c28f4be4` |
| `backgroundChannelDerivedKeywordHelpersAndSync` | `js/background.js:1240` | 106 | 3482 | `22f1f880c4b67f0b366020641f94e988d19a4e0312b073c20048c4f2bcd0a455` |
| `stateManagerChannelEnrichmentMessage` | `js/state_manager.js:665` | 12 | 460 | `1f802c946742b856d5c4f6aea62777de9e1e3fcebae08085d632259d1bac0132` |
| `settingsSharedSyncFilterAllKeywords` | `js/settings_shared.js:412` | 72 | 2967 | `ce4e49c6055252ab9a6db6a30be91ddfb50efead1c1ef76bf736c38717febd25` |

## Selected Token Counts

| Token | Count |
| --- | ---: |
| `addFilteredChannel` | 3 |
| `filterAllComments` | 4 |
| `message.filterAllComments` | 0 |
| `filterAll: filterAll` | 2 |
| `filterAll: false` | 1 |
| `filterAll` | 19 |
| `comments:` | 4 |
| `channelRef` | 26 |
| `syncStoredMainKeywordsWithChannels` | 1 |
| `syncFilterAllKeywords` | 1 |
| `filterKeywordsComments` | 0 |
| `profile` | 6 |
| `listType` | 2 |
| `metadata` | 18 |
| `comment_filter_toggled` | 0 |
| `channel_added` | 6 |
| `kids_channel_added` | 1 |
| `whitelist_channel_added` | 2 |
| `kids_whitelist_channel_added` | 1 |
| `scheduleAutoBackupInBackground` | 1 |
| `FilterTube_ScheduleAutoBackup` | 1 |
| `browserAPI_BRIDGE.runtime.sendMessage` | 2 |
| `chrome.runtime.sendMessage` | 1 |
| `source: 'channel'` | 6 |
| `parsePackedChannelKeywordSource` | 2 |
| `filterAll !== true` | 1 |
| `filterAll) return` | 1 |

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| Content direct add payload | Content `addChannelDirectly()` forwards `filterAll` but does not forward `filterAllComments`, even if metadata contains a `filterAllComments` field. It derives `profile` from the hostname and schedules `FilterTube_ScheduleAutoBackup` after a successful background response. | A content payload contract naming all mutable row fields, profile/list target, backup ownership, and comments-scope defaults. |
| Secondary background receiver | The `addFilteredChannel` receiver forwards input, `filterAll`, collaboration metadata, profile, video id, and normalized list target to `handleAddFilteredChannel()`. It does not read `message.filterAllComments` and does not pass comments scope into metadata. | A receiver report that includes sender, profile, list target, comments-scope, and backup scheduling policy. |
| Helper signature | `handleAddFilteredChannel(input, filterAll = false, ..., listType = 'blocklist')` has no `filterAllComments` parameter. | A helper contract proving whether comments scope should be part of initial channel creation, only post-create mutation, or unsupported in this path. |
| New channel rows | The new channel object stores `filterAll: filterAll` without a `filterAllComments` field. A channel added with Filter All enabled therefore carries no explicit comment-scope decision. | A default comments policy for new Main/Kids blocklist and whitelist rows. |
| Existing channel rows | Existing rows are spread into `updated`; setting incoming `filterAll` can flip `updated.filterAll = true`, but there is no incoming comments-scope merge. Existing rows preserve whatever `filterAllComments` they already had. | A merge policy covering whether a direct add should preserve, clear, or set comments scope when upgrading a row. |
| Background compiler default | `syncStoredMainKeywordsWithChannels()` emits channel-derived keywords only for `filterAll === true`, carries `filterAllComments` into `comments` when present, and defaults missing `filterAllComments` to `comments: true`. | A compiler report tying add-time defaults to JSON comment effects and route/surface fixtures. |
| Shared compiler default | `settings_shared.syncFilterAllKeywords()` mirrors the same default: missing `filterAllComments` compiles as `comments: true`, while explicit `false` remains muted. | Shared/background parity proof before changing JSON-first comment filtering or add-channel payloads. |
| StateManager enrichment | StateManager channel-name enrichment messages send `type: 'addFilteredChannel'` with `filterAll: false` and no comments-scope field. | A background enrichment policy proving this silent path cannot change comments behavior or leak a default into JSON filtering unexpectedly. |
| Backup triggers | Content can schedule `channel_added` after background success; the background receiver schedules blocklist or whitelist channel-add triggers from the normalized profile/list target. No trigger distinguishes comment-scope defaults. | Backup/revision policy for add-time comments-scope changes if they become first-class. |
| JSON comment provenance | Neither the payload nor stored new row records whether comment scope was intentionally enabled. JSON comment filtering later only receives compiled comment regexes. | A JSON comment provenance report that carries add-time source, row id, profile, list mode, and comments-scope decision. |

## Runtime Proof

The runtime guard proves:

1. Content `addChannelDirectly()` sends `type: 'addFilteredChannel'`,
   `filterAll`, profile, metadata fields, and no `filterAllComments`.
2. YouTube Kids hostnames switch the payload profile to `kids` while still
   omitting `filterAllComments`.
3. The secondary background receiver drops `filterAllComments` even when the
   caller sends it, forwards eight helper arguments including list target, and
   schedules backup from normalized profile/list target.
4. The helper signature has `listType = 'blocklist'` and no comments-scope
   parameter.
5. The new channel object stores `filterAll: filterAll` and no
   `filterAllComments` field.
6. Existing channel updates preserve existing row fields and can enable
   `filterAll`, but do not merge an incoming comments-scope field.
7. Background channel-derived keyword sync compiles missing
   `filterAllComments` as `comments: true` and explicit `false` as
   `comments: false`.
8. Shared settings sync mirrors the same default behavior.
9. StateManager enrichment messages are comment-scope silent.
10. Product runtime still lacks first-class addFilteredChannel comments-scope
    authority symbols.

## Non-Completion Boundary

addFilteredChannel Filter All comments defaults still need a payload contract,
payload policy, receiver report, default comments policy, compiler report,
existing-row merge report, JSON comment provenance report, backup policy,
fixture provenance, metric artifact, and first-class authority gate.

No runtime symbol exists yet for:

- `addFilteredChannelFilterAllCommentsContract`
- `addFilteredChannelFilterAllCommentsPayloadPolicy`
- `addFilteredChannelFilterAllCommentsReceiverReport`
- `addFilteredChannelFilterAllCommentsDefaultPolicy`
- `addFilteredChannelFilterAllCommentsCompilerReport`
- `addFilteredChannelFilterAllCommentsExistingRowReport`
- `addFilteredChannelFilterAllCommentsJsonProvenanceReport`
- `addFilteredChannelFilterAllCommentsBackupPolicy`
- `addFilteredChannelFilterAllCommentsFixtureProvenance`
- `addFilteredChannelFilterAllCommentsAuthorityGate`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
