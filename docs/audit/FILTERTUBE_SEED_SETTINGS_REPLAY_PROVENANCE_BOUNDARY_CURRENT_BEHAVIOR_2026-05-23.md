# FilterTube Seed Settings Replay Provenance Boundary - Current Behavior - 2026-05-23

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, settings patch, seed
patch, bridge patch, or permission to change JSON filtering behavior.

## Purpose

This register narrows the settings replay path that can wake JSON work after
startup, UI saves, profile switches, imports, or background broadcasts. The
boundary spans the background apply-settings relay, StateManager broadcast,
content bridge main-world relay, injector seed relay, and `js/seed.js`
`updateSettings()` replay behavior.

The current boundary is:

```text
compiled settings can be broadcast without a replay revision; the content
bridge can send settings to the injector and seed, retry seed delivery every
250 ms when seed is absent, and also force DOM fallback reprocessing; injector
keeps its own seed update and retry path; seed caches the incoming object,
drains queued data, assigns queued globals back through installed setters, and
skips duplicate raw-snapshot replay when the same update already replayed that
surface. Settings with no active JSON work clear queued/raw seed data without a
dirty-key or revision report.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/bridge_settings.js` | 1113 | 44087 | `f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853` |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/background.js` | 6789 | 306239 | `618e41011a6031c7a4eb3d022c4612536942a7a58a3c41eb0fd7e31c29a60311` |

Related proof layers:

- `docs/audit/FILTERTUBE_SEED_INITIAL_GLOBAL_HOOK_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_PENDING_QUEUE_REPLAY_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_SEED_INITIAL_GLOBAL_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_STATE_MANAGER_REQUEST_REFRESH_FANOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_BACKGROUND_COMPILED_CACHE_INVALIDATION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_BRIDGE_INJECTION_METHOD_SEMANTIC_REGISTER_2026-05-21.md`

## Current Counts

```text
seed settings replay provenance source files: 5
seed updateSettings block lines: 98
seed updateSettings block bytes: 4640
seed global interface block lines: 25
seed global interface block bytes: 867
bridge apply-settings message block lines: 33
bridge apply-settings message block bytes: 1454
bridge seed relay block lines: 51
bridge seed relay block bytes: 1335
injector seed relay block lines: 115
injector seed relay block bytes: 4346
StateManager broadcastSettings block lines: 11
StateManager broadcastSettings block bytes: 309
background apply-settings block lines: 28
background apply-settings block bytes: 1487
seed updateSettings cachedSettings assignment tokens: 1
seed updateSettings window.filterTube.settings assignment tokens: 1
seed updateSettings pendingDataQueue tokens: 5
seed updateSettings cloneData tokens: 7
seed updateSettings processWithEngine tokens: 3
seed updateSettings queued suffix tokens: 1
seed updateSettings ytInitialData queued assignment tokens: 1
seed updateSettings ytInitialPlayerResponse queued assignment tokens: 1
seed updateSettings rawYtInitialData tokens: 6
seed updateSettings rawYtInitialPlayerResponse tokens: 6
seed updateSettings ytInitialData-reprocess tokens: 1
seed updateSettings ytInitialPlayerResponse-reprocess tokens: 1
seed updateSettings settingsRevision tokens: 0
seed updateSettings dirtyKeys tokens: 0
bridge apply-settings FilterTube_ApplySettings tokens: 1
bridge apply-settings requestSettingsFromBackground tokens: 1
bridge apply-settings sendSettingsToMainWorld tokens: 1
bridge apply-settings applyDOMFallback tokens: 2
bridge seed relay updateSettings tokens: 2
bridge seed relay filterTubeSeedReady tokens: 1
bridge seed relay setTimeout tokens: 1
bridge seed relay pendingSeedSettings tokens: 6
bridge seed relay scheduleSeedRetry tokens: 3
bridge seed relay postMessage tokens: 1
injector seed relay updateSettings tokens: 6
injector seed relay setTimeout tokens: 2
StateManager broadcast FilterTube_ApplySettings tokens: 1
background apply-settings FilterTube_ApplySettings tokens: 2
background apply-settings compiledSettingsCache tokens: 2
background apply-settings getCompiledSettings tokens: 1
background apply-settings sendMessageToTabQuietly tokens: 1
runtime seed settings replay provenance fixtures: 5
runtime behavior changed: no
not completion proof for seed settings replay authority
```

## Current Decision Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| StateManager broadcast | Sends `FilterTube_ApplySettings` with caller-provided compiled settings and profile. | Broadcast revision, payload source, and replay reason report. |
| Background apply-settings | Clears `compiledSettingsCache[targetProfile]`, recompiles background settings, queries profile-matched tabs, and forwards `compiledSettings`. | Sender class, revision, dirty-key, and cache provenance policy. |
| Bridge profile mismatch | Refetches settings and forces DOM fallback when incoming profile differs from host expectation. | Cross-profile replay and no-stale-payload policy. |
| Bridge normal apply | Normalizes settings, posts them to injector, tries seed update, and forces DOM fallback. | Single replay owner and duplicate delivery report. |
| Bridge seed retry | Keeps `pendingSeedSettings`, attaches one `filterTubeSeedReady` listener, and schedules recursive 250 ms retry until seed accepts settings. | Retry cap, teardown, visibility, and duplicate timer policy. |
| Injector seed relay | Has its own `updateSeedSettings()` direct path, one 300 ms retry, `connectToSeedGlobal()` update path, and one 200 ms connection retry. | Bridge/injector owner split report. |
| Seed settings cache | Assigns incoming settings to `cachedSettings` and `window.filterTube.settings`. | Settings revision and payload identity report. |
| Seed queue drain | Drains queued data synchronously and appends `-queued` to replay names. | Queue drain work budget and response-effect report. |
| Seed queued global assignment | Assigns queued `ytInitialData` / `ytInitialPlayerResponse` back through globals, invoking setters when installed. | Setter reentry guard. |
| Seed raw snapshot replay | Reprocesses raw or last processed snapshots only when active JSON work remains and that surface was not already replayed from the queue. | Dirty-key policy and route/surface replay permission. |

## Runtime Fixture Summary

The existing-global fixture proves the first settings update can process queued
initial globals, assign through both installed setters, and avoid replaying the
same raw snapshots again during that update.

The duplicate-settings fixture proves a second equivalent active settings update
can replay last processed `ytInitialData` and `ytInitialPlayerResponse` snapshots
without a revision or dirty-key guard.

The public raw-snapshot fallback fixture proves `window.filterTube.rawYtInitialData`
and `window.filterTube.rawYtInitialPlayerResponse` can act as replay inputs even
when closure raw snapshots are absent.

The disabled replay fixture proves disabled settings skip engine calls and clear
public raw snapshots without setter replay.

The relay-source fixture proves current settings delivery can pass through
StateManager, background, content bridge, and injector paths before reaching
seed update replay.

## Risks Identified

- Reliability: settings can be delivered by multiple owners without a single
  replay reason, revision, or accepted-owner report.
- False-hide/leak: raw snapshot replay and queued global setter reentry can
  mutate page globals after a settings broadcast even when the replay cause is
  unrelated to JSON filtering.
- Performance: duplicate settings delivery can clone and traverse stored startup
  payloads again, and disabled replay still pays setter bookkeeping.
- Code burden: background, StateManager, bridge, injector, and seed each own a
  piece of settings delivery without a shared replay contract.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
seedSettingsReplayProvenanceContract
seedSettingsReplayDecisionReport
seedSettingsRevisionReport
seedSettingsDirtyKeyPolicy
seedSettingsQueueDrainBudget
seedSettingsRawSnapshotReplayPolicy
seedSettingsSetterReentryGuard
seedSettingsRelayOwnerReport
seedSettingsDuplicateDeliveryPolicy
seedSettingsReplayFixtureProvenance
seedSettingsReplayMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/seed-settings-replay-provenance-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one settings replay
provenance gap into current seed, bridge, injector, StateManager, and background
settings-delivery behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
