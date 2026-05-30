# FilterTube JSON-First Hide Mix Playlists Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, optimization patch, Mix behavior patch,
playlist behavior patch, DOM fallback patch, renderer rule patch, or settings
schema patch.

This slice promotes the JSON-first feature audit into `hideMixPlaylists` proof.
It isolates how Mix/radio playlist handling currently crosses background
settings compile, background cache invalidation, seed active-work predicates,
JSON renderer classification, playlist id extraction, DOM fallback CSS, DOM
Mix/radio detection, card markers, Mixes chip hiding, and playlist-card
exclusion logic.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3498 | 165151 | `4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |
| `js/background.js` | 6313 | 284710 | `46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb` |

## Boundary Counts

```text
hideMixPlaylists boundary source files: 4
hideMixPlaylists source/effect blocks: 16
filter_logic radio rules block lines: 17
filter_logic radio rules block bytes: 833
filter_logic unwrap mix nested block lines: 4
filter_logic unwrap mix nested block bytes: 183
filter_logic extract playlist id block lines: 15
filter_logic extract playlist id block bytes: 676
filter_logic candidate mix flag block lines: 7
filter_logic candidate mix flag block bytes: 314
filter_logic category renderer allowlist block lines: 8
filter_logic category renderer allowlist block bytes: 618
seed active JSON rules block lines: 13
seed active JSON rules block bytes: 463
DOM fallback mix helper block lines: 48
DOM fallback mix helper block bytes: 2207
DOM fallback mix CSS rules block lines: 15
DOM fallback mix CSS rules block bytes: 588
DOM fallback active boolean keys block lines: 28
DOM fallback active boolean keys block bytes: 905
DOM fallback playlist cards exclude radio block lines: 27
DOM fallback playlist cards exclude radio block bytes: 1459
DOM fallback mix chip direct block lines: 21
DOM fallback mix chip direct block bytes: 1127
DOM fallback mix card decision block lines: 14
DOM fallback mix card decision block bytes: 566
DOM fallback chip filtering block lines: 24
DOM fallback chip filtering block bytes: 968
background storage read keys block lines: 44
background storage read keys block bytes: 1408
background boolean pass-through block lines: 35
background boolean pass-through block bytes: 3596
background storage refresh keys block lines: 16
background storage refresh keys block bytes: 461
filter_logic total hideMixPlaylists tokens: 0
filter_logic total isMix tokens: 2
filter_logic total radioRenderer tokens: 5
filter_logic total compactRadioRenderer tokens: 5
filter_logic total playlistId tokens: 11
seed total hideMixPlaylists tokens: 0
DOM fallback total hideMixPlaylists tokens: 5
DOM fallback total isMix tokens: 2
DOM fallback total hidden-by-mix-radio marker tokens: 3
DOM fallback total start_radio markers: 10
background total hideMixPlaylists tokens: 12
runtime hideMixPlaylists fixtures: 6
```

## Current Behavior Pinned

| Boundary | Current behavior | Missing first-class field |
| --- | --- | --- |
| Background compile | Background reads and compiles `hideMixPlaylists` from V4 or legacy settings. | Settings alias and compile report proving V4, legacy, cache, and UI parity. |
| Background invalidation | Background storage-change invalidation does not list `hideMixPlaylists`, even though the compiler reads it. | Refresh-key authority and no-stale-cache proof. |
| Seed active work | Seed JSON active-work detection does not include `hideMixPlaylists`; Mix hiding is not a JSON endpoint activation reason. | JSON no-work decision proving when Mix settings may skip endpoint parsing. |
| JSON renderer rules | `radioRenderer` and `compactRadioRenderer` have JSON rules, and rich-item unwrap prefers those nested renderers. | Renderer inventory policy for Mix/radio families. |
| JSON classification | `_buildCandidate()` classifies radio renderers, compact radio renderers, `RD` playlist ids, and Mix title prefixes as `isMix`. | Mix candidate report with source paths and confidence. |
| JSON hide decision | `filter_logic.js` has no `hideMixPlaylists` token and no JSON block decision that removes Mix/radio rows for that setting. | JSON Mix hide contract or explicit DOM-only policy. |
| DOM CSS | DOM CSS hides radio renderer tags, lockups with `start_radio=1`, and video wall Mix stills when `hideMixPlaylists` is true. | Shared JSON/DOM Mix target matrix. |
| DOM direct scan | DOM fallback detects Mix/radio by renderer tag, badges, `start_radio=1`, titles, text prefixes, and hides a target with `data-filtertube-hidden-by-mix-radio`. | DOM Mix decision report and marker restore proof. |
| Playlist-card interaction | `hidePlaylistCards` explicitly avoids radio/mix lockups using `start_radio=1`, while `hideMixPlaylists` separately owns those rows and the Mixes chip. | Cross-feature decision order for playlist-card versus Mix toggles. |
| Category interaction | JSON category allowlist includes `radioRenderer` and `compactRadioRenderer`; category filters can evaluate Mix/radio cards, but `hideMixPlaylists` cannot remove them in JSON. | Category/Mix parity report. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

- `hideMixPlaylists` does not remove JSON `radioRenderer` rows.
- `hideMixPlaylists` does not remove JSON `compactRadioRenderer` rows.
- `hideMixPlaylists` does not remove JSON playlist rows with `RD` playlist ids.
- `hideMixPlaylists` does not remove JSON playlist rows with Mix-like titles.
- ordinary playlist and video rows remain visible under `hideMixPlaylists`.
- `_buildCandidate()` still marks radio, compact radio, `RD` playlist ids, and
  Mix title-prefix playlist rows as `isMix`, proving classification exists
  without a JSON hide decision.

## Risk Interpretation

- Reliability: Mix/radio classification exists in JSON but the Mix setting is
  enforced only by DOM fallback.
- False-hide/leak: JSON Mix/radio rows can leak until a later DOM pass sees a
  matching tag, title, badge, or `start_radio=1` marker; DOM and JSON target
  sets are not equivalent.
- Performance: the DOM fallback must keep broad Mix/radio selectors and chip
  scans active because JSON has no hide decision for this setting.
- Code burden: Mix/radio rules, candidate classification, CSS selectors,
  direct DOM scans, chip hiding, playlist-card exclusions, and background
  cache behavior are split across three runtime owners plus seed no-work logic.

## Non-Completion Boundary

This does not close JSON-first Mix/radio playlist filtering. Product runtime
source still lacks first-class hide-mix-playlists contracts, Mix decision
reports, renderer inventory policies, JSON/DOM Mix parity reports, DOM-only
policy reports, stale background cache reports, playlist/Mix interaction
policies, no-work budgets, marker restore proof, fixture provenance, and metric
artifacts. The following symbols are intentionally absent from product runtime
source today:

```text
jsonFirstHideMixPlaylistsContract
jsonFirstHideMixPlaylistsDecisionReport
jsonFirstMixRendererInventoryPolicy
jsonFirstMixJsonDomParityReport
jsonFirstMixDomOnlyPolicy
jsonFirstMixBackgroundCacheReport
jsonFirstMixPlaylistInteractionPolicy
jsonFirstMixNoWorkBudget
jsonFirstMixMarkerRestoreProof
jsonFirstMixFixtureProvenance
jsonFirstMixMetricArtifact
```

## Validation

```text
node --test tests/runtime/json-first-hide-mix-playlists-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
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
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
