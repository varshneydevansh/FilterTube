# FilterTube JSON-First Hide Playlist Cards Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, optimization patch, playlist-card behavior
patch, DOM fallback patch, Mix/radio policy patch, settings schema patch, or
selector cleanup patch.

This slice promotes the JSON-first feature audit into `hidePlaylistCards`
proof. It isolates how the playlist-card toggle currently crosses shared
settings, background compile, background cache invalidation, seed active-work
predicates, JSON renderer traversal, DOM fallback CSS, DOM direct lockup passes,
Mix/radio exclusion, and ordinary endpoint pass-through behavior.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |

## Boundary Counts

```text
hidePlaylistCards boundary source files: 5
hidePlaylistCards source/effect blocks: 8
seed active JSON rules block lines: 13
seed active JSON rules block bytes: 463
DOM fallback playlist-card CSS rules block lines: 16
DOM fallback playlist-card CSS rules block bytes: 998
DOM fallback playlist-card direct block lines: 26
DOM fallback playlist-card direct block bytes: 1457
DOM fallback active boolean keys block lines: 28
DOM fallback active boolean keys block bytes: 905
background boolean pass-through block lines: 35
background boolean pass-through block bytes: 3596
background storage refresh keys block lines: 16
background storage refresh keys block bytes: 461
settings_shared settings keys block lines: 38
settings_shared settings keys block bytes: 1031
settings_shared build compiled settings block lines: 54
settings_shared build compiled settings block bytes: 1916
filter_logic total hidePlaylistCards tokens: 0
seed total hidePlaylistCards tokens: 0
DOM fallback total hidePlaylistCards tokens: 3
DOM fallback total ytd-playlist-renderer tokens: 1
DOM fallback total ytd-grid-playlist-renderer tokens: 1
DOM fallback total ytd-compact-playlist-renderer tokens: 1
DOM fallback total yt-lockup-view-model tokens: 19
DOM fallback total yt-collection-thumbnail-view-model tokens: 2
DOM fallback total yt-collections-stack tokens: 2
DOM fallback total start_radio=1 tokens: 10
background total hidePlaylistCards tokens: 12
settings_shared total hidePlaylistCards tokens: 23
runtime hidePlaylistCards fixtures: 6
```

## Current Behavior Pinned

| Boundary | Current behavior | Missing first-class field |
| --- | --- | --- |
| Shared settings | `settings_shared.js` lists, loads, passes, and compiles `hidePlaylistCards`. | Settings parity report covering UI, V4 profile state, legacy values, Mix interactions, and compiled consumers. |
| Background compile | Background compiles `hidePlaylistCards` through the boolean pass-through path. | Compile decision record with cache revision, route permission, and stale-cache reporting. |
| Background invalidation | Background storage-change invalidation does not include `hidePlaylistCards` today. | Refresh-key authority proving stale-cache behavior for each consumer path. |
| Seed active work | Seed JSON active-work detection does not include `hidePlaylistCards`; the setting is not a JSON endpoint activation reason. | JSON no-work decision proving when playlist-card settings should parse, harvest, mutate, or skip endpoint bodies. |
| JSON renderer rules | `filter_logic.js` has no `hidePlaylistCards` token and no global playlist-card hide decision. | JSON playlist-card decision report and renderer inventory policy. |
| JSON hide decision | Playlist-like JSON renderer objects pass through unchanged when only `hidePlaylistCards` is enabled. | JSON/DOM parity report for renderer families, route, list mode, and sibling preservation. |
| DOM CSS | DOM CSS hides classic playlist renderers, grid playlist renderers, compact playlist renderers, collection-stack lockups, and playlist shelves. | Shared selector target matrix and CSS target policy. |
| DOM direct pass | DOM fallback directly hides `yt-lockup-view-model` collection stacks with `list=` links, plus enclosing shelf or horizontal-list containers. | Marker ownership report and restore proof for direct display writers. |
| Mix/radio exclusion | CSS and DOM direct pass exclude `start_radio=1` so Mix/radio lockups stay under `hideMixPlaylists` instead. | Cross-feature playlist/Mix conflict policy. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

- `hidePlaylistCards` does not remove a JSON `playlistRenderer`.
- `hidePlaylistCards` does not remove a JSON `compactPlaylistRenderer`.
- `hidePlaylistCards` does not remove a JSON collection-stack
  `lockupViewModel`.
- `hidePlaylistCards` does not remove a JSON radio renderer family.
- desktop home browse continuations with only `hidePlaylistCards` run
  harvest-only and skip JSON mutation.
- desktop home browse continuations with `hidePlaylistCards` plus an active
  keyword rule call the JSON engine because the keyword, not
  `hidePlaylistCards`, activates JSON work.

## Risk Interpretation

- Reliability: the user-visible setting is compiled, but background
  storage-change invalidation omits it and JSON endpoint filtering does not own
  a playlist-card decision.
- False-hide/leak: playlist JSON rows can remain present until DOM CSS or direct
  lockup passes see matching markup; JSON and DOM target sets are not
  equivalent.
- Performance: broad DOM selectors and direct lockup scans remain necessary
  because JSON has no hide decision for this setting.
- Code burden: settings, background compile, seed no-work logic, renderer
  traversal, CSS selectors, direct display writers, shelf/container hiding, and
  Mix/radio exclusion are split across five runtime owners.

## Non-Completion Boundary

This does not close JSON-first playlist-card filtering. Product runtime source
still lacks first-class hide-playlist-cards contracts, decision reports,
renderer inventory policies, JSON/DOM parity reports, DOM-only policy reports,
no-work budgets, Mix exclusion policies, marker/restore proof, settings parity
reports, fixture provenance, and metric artifacts. The following symbols are
intentionally absent from product runtime source today:

```text
jsonFirstHidePlaylistCardsContract
jsonFirstHidePlaylistCardsDecisionReport
jsonFirstPlaylistCardsRendererInventoryPolicy
jsonFirstPlaylistCardsJsonDomParityReport
jsonFirstPlaylistCardsDomOnlyPolicy
jsonFirstPlaylistCardsNoWorkBudget
jsonFirstPlaylistCardsMixExclusionPolicy
jsonFirstPlaylistCardsMarkerRestoreProof
jsonFirstPlaylistCardsSettingsParityReport
jsonFirstPlaylistCardsFixtureProvenance
jsonFirstPlaylistCardsMetricArtifact
```

## Validation

```text
node --test tests/runtime/json-first-hide-playlist-cards-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
