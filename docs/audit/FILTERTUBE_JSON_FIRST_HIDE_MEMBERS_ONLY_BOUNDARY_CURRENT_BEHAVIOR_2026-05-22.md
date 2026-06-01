# FilterTube JSON-First Hide Members Only Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, optimization patch, members-only behavior
patch, DOM fallback patch, renderer rule patch, settings schema patch, or
selector cleanup patch.

This slice promotes the JSON-first feature audit into `hideMembersOnly` proof.
It isolates how the Members-only toggle currently crosses shared settings,
background compile, background cache invalidation, seed active-work predicates,
JSON candidate extraction, DOM fallback CSS, broad watch/shelf selectors,
direct DOM scans, hide markers, and restore behavior.

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
hideMembersOnly boundary source files: 5
hideMembersOnly source/effect blocks: 9
filter_logic candidate builder block lines: 79
filter_logic candidate builder block bytes: 4266
seed active JSON rules block lines: 13
seed active JSON rules block bytes: 463
DOM fallback members CSS rules block lines: 41
DOM fallback members CSS rules block bytes: 2483
DOM fallback active boolean keys block lines: 28
DOM fallback active boolean keys block bytes: 905
DOM fallback members direct block lines: 81
DOM fallback members direct block bytes: 5060
background boolean pass-through block lines: 35
background boolean pass-through block bytes: 3596
background storage refresh keys block lines: 16
background storage refresh keys block bytes: 461
settings_shared settings keys block lines: 38
settings_shared settings keys block bytes: 1031
settings_shared build compiled settings block lines: 54
settings_shared build compiled settings block bytes: 1916
filter_logic total hideMembersOnly tokens: 0
filter_logic total membership-evidence tokens: 0
seed total hideMembersOnly tokens: 0
seed total membership-evidence tokens: 0
DOM fallback total hideMembersOnly tokens: 3
DOM fallback total membership tokens: 18
DOM fallback total yt-badge-shape--membership tokens: 13
DOM fallback total data-filtertube-members-only-hidden marker tokens: 7
DOM fallback total UUMO markers: 3
background total hideMembersOnly tokens: 13
settings_shared total hideMembersOnly tokens: 23
runtime hideMembersOnly fixtures: 6
```

## Current Behavior Pinned

| Boundary | Current behavior | Missing first-class field |
| --- | --- | --- |
| Shared settings | `settings_shared.js` lists, loads, passes, and compiles `hideMembersOnly`. | Settings parity report that covers UI, V4 profile state, legacy values, and compiled consumers. |
| Background compile | Background compiles `hideMembersOnly` through the boolean pass-through path. | Compile decision record with cache revision and consumer permissions. |
| Background invalidation | Background storage-change invalidation includes `hideMembersOnly` today. | Refresh-key authority proving stale-cache behavior for each consumer path. |
| Seed active work | Seed JSON active-work detection does not include `hideMembersOnly`; the setting is not a JSON endpoint activation reason. | JSON no-work decision proving when members-only settings should parse or skip endpoint bodies. |
| JSON candidate extraction | `_buildCandidate()` can collect Members-only evidence through generic metadata paths such as `accessibility.accessibilityData.label`, but it exposes no `isMembersOnly` field. | Members-only candidate report with source paths, confidence, and renderer scope. |
| JSON hide decision | `filter_logic.js` has no `hideMembersOnly`, `membership`, or Members-only tokens and no JSON block decision for this setting. | JSON Members-only hide contract or explicit DOM-only policy. |
| DOM CSS | DOM CSS hides card renderers, metadata blocks, watch containers, shelves, and `UUMO` playlist links when the setting is true. | Shared JSON/DOM target matrix and broad-container false-hide report. |
| DOM direct scan | DOM fallback scans title aria labels, badge renderers, membership classes, `UUMO` links, and shelf titles, then writes `data-filtertube-members-only-hidden`. | DOM decision report and marker restore proof. |
| Restore path | When the setting is false, DOM fallback removes display style and members-only markers from previously hidden elements. | Restore authority proving exact target ownership and sibling safety. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

- `hideMembersOnly` does not remove a JSON `videoRenderer` with a
  `metadataBadgeRenderer.label` of `Members only`.
- `hideMembersOnly` does not remove a JSON `videoRenderer` whose accessibility
  label says `Members only`.
- `hideMembersOnly` does not remove a JSON `playlistRenderer` titled
  `Members-only videos`.
- `hideMembersOnly` does not remove a JSON `playlistRenderer` with a `UUMO`
  playlist id.
- ordinary video and playlist rows remain visible under `hideMembersOnly`.
- `_buildCandidate()` can surface Members-only words in generic metadata text
  while still exposing no first-class `isMembersOnly` candidate field.

## Risk Interpretation

- Reliability: the user-visible setting is compiled and refreshed, but JSON
  endpoint filtering does not own a Members-only decision.
- False-hide/leak: Members-only JSON rows can leak until a later DOM pass sees
  a matching badge, aria label, link, or shelf title; broad DOM selectors can
  also hide watch or shelf containers rather than a precise row.
- Performance: DOM fallback must keep broad CSS selectors and direct scans for
  title nodes, badges, links, and shelf headings because JSON has no hide
  decision for this setting.
- Code burden: settings, background, seed no-work logic, JSON candidate
  extraction, CSS selectors, direct DOM scans, markers, and restore behavior are
  split across five runtime owners.

## Non-Completion Boundary

This does not close JSON-first Members-only filtering. Product runtime source
still lacks first-class hide-members-only contracts, decision reports, renderer
inventory policies, JSON/DOM parity reports, DOM-only policy reports,
broad-hide reports, no-work budgets, marker restore proof, settings parity
reports, fixture provenance, and metric artifacts. The following symbols are
intentionally absent from product runtime source today:

```text
jsonFirstHideMembersOnlyContract
jsonFirstHideMembersOnlyDecisionReport
jsonFirstMembersOnlyRendererInventoryPolicy
jsonFirstMembersOnlyJsonDomParityReport
jsonFirstMembersOnlyDomOnlyPolicy
jsonFirstMembersOnlyBroadHideReport
jsonFirstMembersOnlyNoWorkBudget
jsonFirstMembersOnlyMarkerRestoreProof
jsonFirstMembersOnlySettingsParityReport
jsonFirstMembersOnlyFixtureProvenance
jsonFirstMembersOnlyMetricArtifact
```

## Validation

```text
node --test tests/runtime/json-first-hide-members-only-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content-control JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content-control promotion, DOM selector
changes, no-work changes, native parity changes, or whitelist behavior changes.
