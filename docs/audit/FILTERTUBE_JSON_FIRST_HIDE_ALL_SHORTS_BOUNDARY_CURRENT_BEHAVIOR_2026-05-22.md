# FilterTube JSON-First Hide All Shorts Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, optimization patch, Shorts behavior patch,
DOM fallback patch, renderer discovery patch, or settings schema patch.

This slice promotes the JSON-first feature audit into `hideAllShorts` proof. It
isolates how the Shorts global filter currently crosses background settings
compile, seed active-work predicates, JSON renderer traversal, JSON Shorts
renderer decisions, video-id map fallback, whitelist mode, DOM fallback card and
container hiding, markers, and restore cleanup.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |

## Boundary Counts

```text
hideAllShorts boundary source files: 4
hideAllShorts source/effect blocks: 17
filter_logic Shorts rules block lines: 15
filter_logic Shorts rules block bytes: 653
filter_logic renderer discovery block lines: 10
filter_logic renderer discovery block bytes: 464
filter_logic unwrap preferred nested block lines: 21
filter_logic unwrap preferred nested block bytes: 932
filter_logic build candidate Shorts block lines: 5
filter_logic build candidate Shorts block bytes: 219
filter_logic videoChannelMap Shorts block lines: 12
filter_logic videoChannelMap Shorts block bytes: 556
filter_logic hideAllShorts decision block lines: 5
filter_logic hideAllShorts decision block bytes: 326
filter_logic whitelist Shorts exception block lines: 5
filter_logic whitelist Shorts exception block bytes: 251
seed active JSON rules block lines: 13
seed active JSON rules block bytes: 463
DOM fallback active boolean keys block lines: 27
DOM fallback active boolean keys block bytes: 874
DOM fallback hidden marker block lines: 4
DOM fallback hidden marker block bytes: 125
DOM fallback restore selector block lines: 2
DOM fallback restore selector block bytes: 80
DOM fallback disguised Shorts detection block lines: 12
DOM fallback disguised Shorts detection block bytes: 788
DOM fallback global short video decision block lines: 18
DOM fallback global short video decision block bytes: 885
DOM fallback Shorts section block lines: 275
DOM fallback Shorts section block bytes: 13317
background boolean pass-through block lines: 35
background boolean pass-through block bytes: 3596
background install default block lines: 1
background install default block bytes: 34
background storage refresh keys block lines: 16
background storage refresh keys block bytes: 461
filter_logic total hideAllShorts tokens: 2
filter_logic total shortsLockupViewModelV2 tokens: 7
seed total hideAllShorts tokens: 5
DOM fallback total hideAllShorts tokens: 8
DOM fallback total hideShorts tokens: 1
DOM fallback total hidden-by-hide-all-shorts marker tokens: 15
background total hideAllShorts tokens: 8
background total hideShorts tokens: 6
runtime hideAllShorts fixtures: 6
```

## Current Behavior Pinned

| Boundary | Current behavior | Missing first-class field |
| --- | --- | --- |
| Background compile | Background compiles `hideAllShorts` from V4 `hideShorts` with legacy `hideAllShorts` fallback, installs a legacy default, and listens for `hideAllShorts` storage changes. | Settings alias report proving V4, legacy, cache, and refresh parity. |
| Seed active work | `hasActiveJsonFilterRules` treats `cachedSettings.hideAllShorts === true` as active JSON work for endpoint mutation. | No-work budget separating active global Shorts rules from endpoint families with no Shorts renderers. |
| JSON renderer discovery | Recursive discovery only considers object keys ending with `Renderer` or `ViewModel`. `shortsLockupViewModelV2` is declared in rules but does not match that suffix. | Renderer discovery policy covering V2 ViewModel-like keys. |
| Nested unwrap | `richItemRenderer` unwrapping explicitly includes `shortsLockupViewModelV2`, so nested V2 content can be blocked even when direct V2 content is not discovered. | Direct/nested renderer parity report. |
| JSON hide decision | `_shouldBlock()` removes `reelItemRenderer`, `shortsLockupViewModel`, and discovered nested `shortsLockupViewModelV2` when `hideAllShorts` is true. | Hide decision report with renderer, wrapper, and reason. |
| JSON non-Shorts rows | Ordinary `videoRenderer` rows are not treated as Shorts by JSON solely because they contain Shorts URL evidence. | JSON/DOM disguised Shorts parity policy. |
| DOM active and markers | DOM fallback treats `hideAllShorts` and legacy `hideShorts` as active work, records `data-filtertube-hidden-by-hide-all-shorts`, and includes that marker in restore cleanup. | Marker restore proof and stale-card policy. |
| DOM Shorts section | DOM fallback separately hides Shorts shelves, guide/nav entries, detected normal-card Shorts, reel items, and mobile Shorts lockups, with periodic yielding every 60 cards. | Shared JSON/DOM Shorts target matrix and work budget. |
| Whitelist interaction | Whitelist fail-closed identity handling treats Shorts-like renderers specially by skipping one no-identity fail-closed fallback, but global `hideAllShorts` still precedes whitelist checks. | Cross-feature decision order report for global Shorts versus whitelist. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

- direct `shortsLockupViewModel` is removed when `hideAllShorts` is true.
- direct `reelItemRenderer` is removed when `hideAllShorts` is true.
- direct `shortsLockupViewModelV2` currently remains because renderer discovery
  does not consider keys ending in `ViewModelV2`.
- nested `shortsLockupViewModelV2` inside `richItemRenderer` is removed through
  the unwrap path.
- ordinary `videoRenderer` rows with `/shorts/` URL evidence remain visible to
  the JSON engine.
- source proof pins the separate DOM fallback global Shorts target and marker
  paths that can catch DOM-only or disguised Shorts cards.

## Risk Interpretation

- Reliability: declared rules, traversal discovery, and nested unwraps disagree
  for the direct V2 renderer shape.
- False-hide/leak: direct V2 Shorts JSON can leak while nested V2 is hidden; DOM
  fallback may later hide a different target shape using marker-based logic.
- Performance: a single global setting wakes endpoint work and broad DOM Shorts
  scans, including shelf/nav/container paths and card loops.
- Code burden: settings aliases, seed activation, JSON decisions, renderer
  discovery, DOM detection, markers, and restore cleanup are split across four
  files.

## Non-Completion Boundary

This does not close JSON-first global Shorts filtering. Product runtime source
still lacks first-class hide-all-Shorts contracts, decision reports, renderer
discovery policies, JSON/DOM parity reports, V2 leak reports, disguised Shorts
policies, no-work budgets, marker restore proof, fixture provenance, and metric
artifacts. The following symbols are intentionally absent from product runtime
source today:

```text
jsonFirstHideAllShortsContract
jsonFirstHideAllShortsDecisionReport
jsonFirstHideAllShortsRendererDiscoveryPolicy
jsonFirstHideAllShortsJsonDomParityReport
jsonFirstHideAllShortsV2LeakReport
jsonFirstHideAllShortsDisguisedShortPolicy
jsonFirstHideAllShortsNoWorkBudget
jsonFirstHideAllShortsMarkerRestoreProof
jsonFirstHideAllShortsFixtureProvenance
jsonFirstHideAllShortsMetricArtifact
```

## Validation

```text
node --test tests/runtime/json-first-hide-all-shorts-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this Shorts/Reel/lockup surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, Shorts filtering behavior, Reel overlay
behavior, whitelist behavior, metric collectors, artifact creation, native
sync, release package changes, or public claims.
