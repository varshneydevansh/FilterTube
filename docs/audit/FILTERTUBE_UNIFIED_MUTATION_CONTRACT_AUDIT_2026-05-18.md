# FilterTube Unified Mutation Contract Audit - 2026-05-18

Status: audit-only. This document does not change runtime behavior.

## Purpose

FilterTube currently has several independent mutation owners: UI state helpers,
background message branches, import/export helpers, Nanah sync, content-script
identity learning, DOM hide routines, and page-message refresh triggers. Many of
those paths are individually reasonable, but they do not yet pass through one
shared contract that records who is allowed to write what, which profile/surface
is affected, which compiled settings revision was produced, and which tabs or
DOM surfaces may be refreshed.

The result is hard to optimize safely. A performance fix can accidentally change
filtering authority, and a filtering fix can accidentally add extra YouTube page
work on empty installs.

## Current Authority Shape

```text
UI StateManager
  -> SettingsAPI.saveSettings(...)
  -> FilterTube_ApplySettings caller payload broadcast

extension UI / content / extension pages
  -> background action branch
  -> storage writes, cache invalidation, tab broadcast, auto-backup, network work

content_bridge / page messages
  -> learned channel/video maps, DOM refilter triggers, refresh requests

import / Nanah sync
  -> FilterTubeIO direct profile/settings writes
  -> storage listeners / later refresh paths

DOM hide paths
  -> class/style/attribute mutations
  -> optional stats, media, navigation, and refilter side effects
```

The ignored root capture files (`YT_MAIN*.json`, `YT_MAIN_WATCH.html`,
`YT_KIDS.json`, `YTM*.json`, `playlist*.html/json`, `collab*.html/json`,
`comments.json`, and historical whitelist scratch files) remain raw evidence
inputs for fixture extraction. They are not mutation authority and should not be
treated as source files.

## Required Future Contract

Every persistent or cross-context mutation should eventually produce a structured
record with these fields before it writes storage, updates caches, broadcasts,
or mutates the DOM:

| Field | Purpose |
| --- | --- |
| `mutationId` | Stable id for one user/system action. |
| `senderClass` | Trusted UI, content bridge, page runtime, import, Nanah, background maintenance, or test. |
| `sourceSurface` | Popup, dashboard, YouTube Main, YouTube Kids, YTM, import screen, Nanah pairing, etc. |
| `targetProfileId` | Exact V4 profile receiving the change. |
| `viewingSurface` | Main, Kids, YTM, website, or all, with explicit route scope where needed. |
| `listScope` | Main blocklist, Main whitelist, Kids blocklist, Kids whitelist, learned map, stats, UI preference, etc. |
| `action` | Add/remove/toggle/import/sync/learn/refresh/hide/stats/inject/fetch. |
| `validatedPayload` | Sanitized, canonical payload after schema validation. |
| `allowedStorageWrites` | Exact storage keys this action may write. |
| `allowedCacheWrites` | Exact in-memory caches this action may invalidate or replace. |
| `networkBudget` | Whether this action may fetch YouTube or other endpoints. |
| `domSideEffects` | Whether it may hide nodes, touch media, navigate, synthesize clicks, or only report. |
| `statsSideEffects` | Whether it may increment counters/time-saved and with what clamp. |
| `broadcastScope` | Which tabs/routes may receive runtime updates. |
| `compiledSettingsRevision` | Background-owned revision that content scripts can compare before applying. |
| `resultReport` | Success/failure, counts, affected profile/list, and skipped side effects. |
| `rollback/error` | How partial writes are avoided or reported. |

Future invariant:

```text
one user action
  -> one mutation report
  -> one background-owned compiled settings revision
  -> one scoped runtime apply
```

## Current Gaps

| Path | Current behavior | Risk |
| --- | --- | --- |
| `js/background.js` `FilterTube_SetListMode` | Sender-gated, but one branch reads V4/legacy storage, merges/clears lists, writes storage, invalidates both compiled caches, schedules backup, and broadcasts `FilterTube_RefreshNow`. `copyBlocklist` is parsed but the branch still copies when switching to whitelist. | Mode migration and refresh behavior are coupled; simultaneous allow/block migration cannot be layered safely without per-entry action metadata. |
| `js/state_manager.js` `saveSettings` / `broadcastSettings` | UI state saves through `SettingsAPI.saveSettings`, then sends caller-provided compiled settings through `FilterTube_ApplySettings`. | The UI can become runtime truth instead of requesting a background-owned revision. |
| `js/background.js` `FilterTube_ApplySettings` | Accepts request settings, stores them in `compiledSettingsCache[targetProfile]`, and broadcasts them to matching tabs. | No sender class, schema, source revision, or target-tab ownership proof in the branch. |
| Learned maps | `updateChannelMap`, `updateVideoChannelMap`, `updateVideoMetaMap`, and content-side `persistVideoChannelMapping` write learned identity/meta state without a shared source/provenance record. | Learned identity can affect later filtering with weak traceability, especially after node reuse or stale page data. |
| Import and Nanah | `io_manager.js` and `nanah_sync_adapter.js` can write profile/settings structures directly. Some read paths also sanitize/migrate and write storage. | Bulk writes lack a single dry-run/mutation report, revision, and broadcast result. |
| DOM hide and stats | DOM fallback, quick-block, direct hide helpers, and `recordTimeSaved` can mutate classes/styles or stats without a common side-effect budget. | False hides, algorithm-visible side effects, and inflated stats are harder to distinguish from expected filtering. |
| Injection and fetch helpers | `injectScripts`, `FilterTube_EnsureSubscriptionsImportBridge`, `fetchChannelDetails`, and metadata fallback paths own script/network work in separate branches. | Performance and trust boundaries are split across code paths instead of one allowlisted operation table. |

## Source Proof

| Source | Lines / identifiers | Proof |
| --- | --- | --- |
| `js/background.js` | `FilterTube_SetListMode`, `shouldCopyBlocklist`, `mergeAndClearBlocklistIntoWhitelist`, `browserAPI.storage.local.set(writePayload)`, `compiledSettingsCache.main = null`, `compiledSettingsCache.kids = null`, `scheduleAutoBackupInBackground('mode_changed')`, `FilterTube_RefreshNow` | Mode switch combines migration, storage, cache, backup, and broadcast authority. |
| `js/state_manager.js` | `saveSettings`, `broadcastSettings`, `requestRefresh`, `FilterTube_ApplySettings` | UI-side compiled settings can be sent to background/content as applied runtime truth. |
| `js/background.js` | `FilterTube_ApplySettings`, `updateChannelMap`, `updateVideoChannelMap`, `updateVideoMetaMap`, `recordTimeSaved`, `injectScripts`, `FilterTube_EnsureSubscriptionsImportBridge` | Background has multiple mutation/injection/stat branches with different or missing trust checks. |
| `js/io_manager.js` | `loadProfilesV4`, `saveProfilesV4`, `importV3` | Load/import paths can write storage outside a central mutation report. |
| `js/nanah_sync_adapter.js` | `applyScopedPortablePayload`, `applyIncomingEnvelope` | Nanah applies scoped payloads through IO writes without a shared revision/broadcast contract. |
| `js/content_bridge.js` | `persistVideoChannelMapping`, `stampChannelIdentity`, `applyDOMFallback(null)` | Learned identity writes can trigger later DOM refilter work. |

## Fix Direction After Audit

Do not start by deleting behavior. Add the contract around current behavior first:

1. Build a background-owned mutation registry for all persistent writes and cross-context applies.
2. Make `FilterTube_ApplySettings` accept only background-generated revisions, not arbitrary caller settings.
3. Move import/Nanah writes through preview/apply mutation reports.
4. Attach source/provenance/confidence to learned channel and video metadata maps.
5. Give DOM hide paths explicit side-effect flags: visual hide, stats, media control, navigation, network, or report-only.
6. Require no-rule/no-work states to emit zero storage writes, zero JSON rewrites, zero DOM scans, and zero learned-map flushes unless the user started an explicit action.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this unified mutation contract audit can
support runtime optimization or JSON-first promotion. Current proof pins:

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
