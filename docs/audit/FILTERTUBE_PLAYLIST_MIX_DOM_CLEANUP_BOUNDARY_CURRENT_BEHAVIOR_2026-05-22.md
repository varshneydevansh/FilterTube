# FilterTube Playlist/Mix DOM Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch, selector
patch, cleanup patch, restore patch, playlist behavior patch, Mix behavior
patch, DOM fallback patch, JSON filter patch, or settings patch.

This slice pins the DOM-owned boundary between `hidePlaylistCards` and
`hideMixPlaylists` in `js/content/dom_fallback.js`. The JSON-first playlist and
Mix slices prove both settings lack first-class JSON hide decisions today. This
slice proves the DOM cleanup contract currently split across CSS selectors,
direct lockup scans, Mix chip hide/restore, Mix card marker writes, and stale or
disabled cleanup omissions.

## Boundary Source Files

playlist/Mix DOM cleanup boundary source files: 1

playlist/Mix DOM cleanup boundary source/effect blocks: 8

runtime playlist/Mix DOM cleanup fixtures: 6

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Pinned Source Counts

ensureContentControlStyles block lines: 345

ensureContentControlStyles block bytes: 12583

playlist-card CSS block lines: 16

playlist-card CSS block bytes: 998

Mix CSS block lines: 15

Mix CSS block bytes: 588

playlist/Mix direct cleanup block lines: 48

playlist/Mix direct cleanup block bytes: 2586

playlist-card direct block lines: 26

playlist-card direct block bytes: 1457

Mix chip direct block lines: 21

Mix chip direct block bytes: 1127

Mix card decision block lines: 13

Mix card decision block bytes: 564

explicit marker guard block lines: 18

explicit marker guard block bytes: 1301

clearStaleDOMFallbackVisibility block lines: 33

clearStaleDOMFallbackVisibility block bytes: 1412

disabled cleanup branch lines: 21

disabled cleanup branch bytes: 959

playlist CSS `rules.push` callsites: 1

playlist CSS display-none declarations: 1

playlist CSS `start_radio=1` exclusions: 4

playlist CSS lockup tokens: 7

playlist CSS shelf selector tokens: 1

playlist CSS horizontal-list selector tokens: 1

Mix CSS `rules.push` callsites: 1

Mix CSS display-none declarations: 1

Mix CSS `start_radio=1` selectors: 2

Mix CSS radio-renderer tokens: 6

Mix CSS lockup tokens: 1

playlist direct querySelectorAll callsites: 1

playlist direct forEach callsites: 1

playlist direct querySelector callsites: 4

playlist direct `start_radio=1` checks: 2

playlist direct `list=` checks: 2

playlist direct inline display writes: 3

playlist direct generic marker writes: 3

playlist direct closest callsites: 2

playlist direct restore callsites: 0

Mix chip querySelectorAll callsites: 2

Mix chip forEach callsites: 2

Mix chip inline display writes: 1

Mix chip generic marker writes: 1

Mix chip local display restore callsites: 1

Mix chip local generic marker removal callsites: 1

Mix chip `mixes` text predicates: 2

Mix card marker write callsites: 1

Mix card marker removal callsites: 1

explicit hidden-marker guard Mix marker references: 1

clear-stale cleanup Mix marker references: 0

disabled cleanup Mix marker references: 0

product runtime Mix marker references: 3

product runtime `hidePlaylistCards` tokens: 3

product runtime `hideMixPlaylists` tokens: 5

product runtime `start_radio=1` tokens: 10

## Current Boundary Matrix

| Boundary | Current behavior | Reliability / optimization boundary |
| --- | --- | --- |
| Playlist CSS | `hidePlaylistCards` emits classic playlist selectors plus lockup and shelf selectors that exclude `start_radio=1`. | CSS separates playlist cards from Mix/radio through substring selector exclusions, not a shared decision report. |
| Mix CSS | `hideMixPlaylists` emits radio renderer, mobile radio renderer, `start_radio=1` lockup, and player videowall Mix selectors. | DOM and player surfaces share one CSS branch without JSON parity proof. |
| Playlist direct scan | The direct pass scans `yt-lockup-view-model.yt-lockup-view-model--collection-stack-2`, skips `start_radio=1`, requires a collection stack, requires `list=`, then hides the lockup plus optional shelf/horizontal containers. | Playlist direct hides have no specialized marker and no local restore branch. |
| Mix chip hide | When `hideMixPlaylists` is true, direct cleanup hides `yt-chip-cloud-chip-renderer` whose normalized text is `mixes`. | Chip cleanup uses only the generic marker and text equality. |
| Mix chip restore | When `hideMixPlaylists` is false, direct cleanup restores generic hidden chip elements whose normalized text is `mixes`. | This local restore does not restore Mix card markers or playlist direct lockups. |
| Mix card marker | Per-card DOM fallback marks Mix/radio targets with `data-filtertube-hidden-by-mix-radio` when the setting is true and removes that marker when the setting is false or the element is not Mix/radio. | Marker ownership is inside card processing, not the top-level cleanup branch. |
| Pending hidden guard | Playlist-row pending logic treats `data-filtertube-hidden-by-mix-radio` as an explicit hidden marker. | A stale Mix marker can keep pending behavior alive if identity is unresolved. |
| Stale cleanup | `clearStaleDOMFallbackVisibility()` has no Mix marker reference. | Generic stale cleanup does not clear `data-filtertube-hidden-by-mix-radio`. |
| Disabled cleanup | The disabled cleanup branch has no Mix marker reference. | Disabled mode does not prove specialized Mix marker cleanup. |
| JSON-first status | Playlist/Mix cleanup remains DOM-owned today even though JSON classification can identify Mix-like rows. | First-class JSON promotion still needs JSON/DOM parity, marker restore, and playlist/Mix interaction policy. |

## Runtime Proof

The runtime guard proves:

1. The source blocks and primitive counts above match current
   `js/content/dom_fallback.js`.
2. Playlist CSS excludes Mix/radio via `start_radio=1`, while Mix CSS owns
   radio renderer and `start_radio=1` selectors.
3. Fake DOM execution hides a valid playlist lockup and its shelf/horizontal
   containers, while leaving radio, missing-stack, and missing-`list=` lockups
   untouched.
4. Fake DOM execution hides the Mixes chip when `hideMixPlaylists` is true and
   restores only Mixes chips when it is false.
5. Fake card-decision execution sets and removes
   `data-filtertube-hidden-by-mix-radio` in the per-card path.
6. Stale cleanup and disabled cleanup currently omit the specialized Mix/radio
   marker.

## Non-Completion Boundary

Playlist/Mix DOM cleanup still needs a DOM cleanup contract, selector policy,
target-shape report, playlist/Mix interaction policy, route/surface policy,
sibling-visible fixture, shared restore owner, stale cleanup budget,
disabled-state restore proof, metric artifact, CSS/direct-writer parity report,
JSON/DOM parity gate, and explicit DOM-only policy before selector cleanup,
restore cleanup, no-work optimization, or first-class JSON promotion can
proceed.

No `playlistMixDomCleanupBoundaryContract`,
`playlistMixDomCleanupDecisionReport`, `playlistMixDomCleanupRestoreProof`,
`playlistMixDomCleanupSelectorPolicy`,
`playlistMixDomCleanupTargetShapeReport`,
`playlistMixDomCleanupInteractionPolicy`,
`playlistMixDomCleanupStaleCleanupBudget`,
`playlistMixDomCleanupDisabledRestoreProof`,
`playlistMixDomCleanupMetricArtifact`, or
`playlistMixDomCleanupJsonParityGate` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
