# FilterTube JSON-First Video Meta Background Storage - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, storage patch, timer
patch, message-trust patch, or permission to change JSON filtering behavior.

## Purpose

This register records the current background-side video metadata storage path
for `videoMetaMap`, including cache loading, queueing, debounced storage flush,
compiled-settings cache patching, cap enforcement, and the `updateVideoMetaMap`
message receiver. It extends the video-meta DOM rerun proof by pinning how the
learned metadata reaches background storage and cached runtime settings.

The current boundary is:

```text
Background accepts video metadata updates, cleans non-empty fields, stores
pending writes, may patch in-memory videoMetaMap and compiled settings caches,
and flushes storage after 75 ms. That timing is independent from the content
DOM rerun timer, and there is no shared revision/provenance report yet.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6313 | 284710 | `46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_DOM_RERUN_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_LEARNED_IDENTITY_MAP_WRITE_ENTRYPOINT_REGISTER_2026-05-20.md`
- `docs/audit/FILTERTUBE_COMPILED_CACHE_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_SETTINGS_REFRESH_KEY_PARITY_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_BACKGROUND_METHOD_SEMANTIC_REGISTER_2026-05-21.md`

## Current Counts

```text
video-meta background storage source files: 1
video-meta background storage source/effect blocks: 8
background videoMetaMap declaration block lines: 19
background videoMetaMap declaration block bytes: 655
ensureVideoMetaMapCache block lines: 19
ensureVideoMetaMapCache videoMetaMap token occurrences: 15
ensureVideoMetaMapCache storageGet callsites: 1
enforceVideoMetaMapCap block lines: 13
videoMetaMap cap maximum entries: 2000
videoMetaMap cap eviction count: 500
flushVideoMetaMapUpdates block lines: 21
flushVideoMetaMapUpdates pending token occurrences: 3
flushVideoMetaMapUpdates storage set callsites: 1
scheduleVideoMetaMapFlush block lines: 7
scheduleVideoMetaMapFlush setTimeout callsites: 1
background videoMetaMap flush debounce milliseconds: 75
enqueueVideoMetaMapUpdate block lines: 41
enqueueVideoMetaMapUpdate videoMetaMap token occurrences: 11
enqueueVideoMetaMapUpdate compiledSettingsCache token occurrences: 6
updateVideoMetaMap message branch lines: 16
updateVideoMetaMap message branch enqueue callsites: 1
compiler videoMetaMap pass-through block lines: 15
background file videoMetaMap token occurrences: 40
background file pendingVideoMetaMapUpdates token occurrences: 5
background file videoMetaMapFlushTimer token occurrences: 4
background file updateVideoMetaMap token occurrences: 1
background file enqueueVideoMetaMapUpdate token occurrences: 2
background file compiledSettingsCache token occurrences: 39
runtime background video-meta storage fixtures: 5
runtime behavior changed: no
not completion proof for JSON-first video metadata background authority
```

## Current Effect Path

| Step | Current owner | Current behavior | Risk boundary |
| --- | --- | --- | --- |
| Cache declaration | `js/background.js:1288` through `js/background.js:1305` | Maintains `compiledSettingsCache`, `videoMetaMapCache`, load promise, flush promise, flush timer, and pending map updates in service-worker memory. | No revision or sender provenance is stored with these objects. |
| Cache load | `ensureVideoMetaMapCache()` | Returns an existing object cache, reuses an in-flight load promise, or loads `videoMetaMap` from storage and shallow-copies it. Storage errors become an empty object. | Error recovery erases cache view without a diagnostic artifact. |
| Cap enforcement | `enforceVideoMetaMapCap()` | If the map has more than 2000 keys, deletes the first 500 keys in current `Object.keys()` order. | Eviction has no recency/provenance report. |
| Flush | `flushVideoMetaMapUpdates()` | Chains onto `videoMetaMapFlushPromise`, loads the cache if needed, rewrites pending entries, clears pending writes, enforces cap, and writes `{ videoMetaMap: map }` to storage. | Storage write result is not linked to content DOM rerun timing. |
| Flush timer | `scheduleVideoMetaMapFlush()` | Schedules one 75 ms timer while no timer is pending; it does not replace an existing timer. | Timer ownership is local to background map writes. |
| Queue update | `enqueueVideoMetaMapUpdate()` | Trims `videoId`, normalizes duration/date/category fields, drops empty metadata, stores pending clean metadata, patches `videoMetaMapCache` if it exists, points cached Main/Kids compiled settings at the cache if present, and schedules the flush timer. | If cache is not loaded, compiled cache patching can keep previous map objects until flush/load. |
| Message receiver | `updateVideoMetaMap` branch | Accepts array-form `entries` or a legacy single `videoId` shape, then enqueues each entry. The legacy single shape forwards `lengthSeconds`, `publishDate`, and `uploadDate`, but does not forward `category`. | Category metadata can be dropped for that older request shape. |
| Compiler pass-through | `getCompiledSettings()` | Reads `videoMetaMap` from storage and assigns `compiledSettings.videoMetaMap = items.videoMetaMap || {}`. | Pending in-memory video metadata is not merged into compile the way `videoChannelMap` pending entries are. |

## Runtime Fixture Summary

The cache-load fixture proves `ensureVideoMetaMapCache()` loads storage once,
returns the same cached object on the second call, shallow-copies storage data,
and falls back to an empty object after storage errors.

The enqueue fixture proves valid metadata is cleaned, empty metadata is dropped,
pending writes are recorded, loaded cache objects are patched, cached Main/Kids
compiled settings are pointed at the loaded video-meta cache, and only one 75 ms
flush timer is scheduled while a timer is pending.

The flush fixture proves pending updates are merged into the loaded cache,
pending writes are cleared, the cap is enforced, and one storage write is issued
with the final `videoMetaMap` object.

The scheduler fixture proves repeated scheduling while a timer exists creates
only one timer and the handler clears `videoMetaMapFlushTimer` before flushing.

The receiver fixture proves array-form messages can carry category metadata,
while the legacy single-video request shape omits category from the synthesized
entry.

## Risks Identified

- Reliability: background metadata storage, content DOM rerun, and compiled
  settings cache mutation do not share a revision or effect report.
- False-hide/leak: metadata changes can affect category/date/duration filtering
  through cached settings without proving the related DOM stale markers were
  cleared.
- Performance: the 75 ms background flush timer, 550 ms content DOM rerun
  timer, and watch metadata fetch queue remain separate budgets.
- Code burden: `videoMetaMap` behavior is split across background queues,
  content message receivers, DOM fallback reads, and compiler pass-through.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstVideoMetaBackgroundStorageContract
jsonFirstVideoMetaBackgroundFlushReport
jsonFirstVideoMetaCompiledCachePatchReport
jsonFirstVideoMetaBackgroundMessageSchema
jsonFirstVideoMetaBackgroundRevisionPolicy
jsonFirstVideoMetaEvictionPolicyReport
jsonFirstVideoMetaStorageErrorReport
jsonFirstVideoMetaBackgroundFixtureProvenance
jsonFirstVideoMetaBackgroundMetricArtifact
jsonFirstVideoMetaBackgroundContentRerunParity
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-video-meta-background-storage-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first metadata
gap into the current background queue, cache, timer, message, compiler, and
storage behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
