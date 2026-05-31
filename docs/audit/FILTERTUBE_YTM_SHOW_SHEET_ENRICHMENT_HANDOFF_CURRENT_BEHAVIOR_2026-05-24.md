# FilterTube YTM Show Sheet Enrichment Handoff Current Behavior - 2026-05-24

Status: audit-only current-behavior fixture slice. Runtime behavior is
unchanged. This is not an implementation patch, whitelist patch, page-message
patch, filter-authority patch, or YTM optimization patch.

## Scope

This slice follows the captured headerless YTM showSheet collaborator row after
the bridge metadata extractor falls back to the collapsed byline. It proves the
handoff from `js/content_bridge.js` lookup options to `js/injector.js` matcher
and snapshot lookup for the same `capture-show-sheet-collab` fixture.

The current handoff is:

```text
content_bridge partial seed: Shakira
content_bridge expected count: 3
content_bridge roster fallback flag: false
injector expected count: 3
injector roster fallback flag: true
injector snapshot result: shakiraVEVO, Spotify, Beele
filter_logic showSheetCommand tokens: 0
```

This is not first-class JSON filter authority. It proves that the enrichment
path can recover the full roster after a partial bridge seed, while the filter
decision path still does not use that roster for blocklist or whitelist
decisions.

## Source Facts

| Artifact | Lines | Bytes | SHA-256 | Role |
| --- | ---: | ---: | --- | --- |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` | Builds collaborator lookup options from partial DOM/metadata evidence. |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` | Builds expected matchers and searches main-world snapshots for collaborators. |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` | JSON filtering and candidate decision owner. |
| `tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json` | 104 | 3818 | `e23da0992cec33040ce286d767c002a9171543dc07c5f5983cc505265fbaabfc` | Reduced YTM showSheet roster fixture. |

## Handoff Matrix

| Layer | Current behavior | Risk boundary |
| --- | --- | --- |
| Bridge metadata extraction | The captured headerless showSheet command does not hydrate as a full bridge renderer roster; the element path falls back to partial byline collaborator `Shakira` and expected count `3`. | Bridge-side metadata is not equivalent to complete roster authority for this shape. |
| Bridge lookup options | `buildCollaboratorLookupRequestOptions()` sends expected name `Shakira`, expected count `3`, no expected handles, and leaves `allowRosterFallbackForCollabMarkup` false because the hidden-collaborator markup was already reduced to a partial seed plus count. | The bridge request carries enough count/name hint for lookup, but not a complete decision report. |
| Injector matcher | `buildExpectedMatcher()` turns expected count `3` into `allowRosterFallbackForCollabMarkup=true`, fuzzy-matches `Shakira` to `shakiraVEVO`, and validates the three-item roster. | Injector lookup policy is broader than the bridge option flag and must be named before optimization. |
| Injector snapshot search | `searchYtInitialDataForCollaborators("capture-show-sheet-collab", matcher)` returns Shakira, Spotify, and Beele from `lastYtNextResponse`. | Main-world enrichment can recover the roster for menus/cache/application. |
| Filter logic decision | `js/filter_logic.js` still has zero `showSheetCommand` tokens. | Blocklist leaks and whitelist false-hides remain current behavior for the same captured row. |

## Current Fixture Result

The paired verifier is
`tests/runtime/ytm-show-sheet-enrichment-handoff-current-behavior.test.mjs`.

It pins:

- Bridge lookup options from the captured partial seed: `expectedNames=["Shakira"]`,
  `expectedHandles=[]`, `expectedCollaboratorCount=3`, and
  `allowRosterFallbackForCollabMarkup=false`.
- Injector matcher behavior for those same options:
  `allowRosterFallbackForCollabMarkup=true`, first collaborator fuzzy-match
  succeeds, and the full roster is accepted as a valid collaborator response.
- Injector snapshot lookup returns:

```text
shakiraVEVO | UCGnjeahCJW1AF34HBmQTJ-Q | @shakiraVEVO
Spotify | UCYLNGLIzMhRTi6ZOLjAPSmw | @spotify
Beele | UCRMqQWxCWE0VMvtUElm-rEA | @beele
```

## Why This Matters

A future JSON-first collaborator optimization can look correct if it only proves
that main-world enrichment eventually recovers collaborators. That would miss
the current split: bridge metadata extraction, injector lookup, collaborator
application, and filter decisions are separate owners. The same captured roster
can be available to enrichment while still absent from the JSON filter
candidate used in blocklist and whitelist modes.

## Future Proof Required

Before using this handoff for behavior changes, add a fixture-backed contract
that names:

```text
ytmShowSheetEnrichmentHandoffContract
ytmShowSheetBridgeLookupOptionReport
ytmShowSheetInjectorMatcherReport
ytmShowSheetEnrichmentApplicationReport
ytmShowSheetFilterAuthorityBoundary
ytmShowSheetHandoffSideEffectBudget
ytmShowSheetHandoffNoWorkBudget
ytmShowSheetSharedRosterDecisionGate
```

None of those authority symbols exists in product runtime source today.

## Verification

Current proof command:

```bash
node --test tests/runtime/ytm-show-sheet-enrichment-handoff-current-behavior.test.mjs --test-reporter=spec
```

This report narrows one captured YTM showSheet enrichment handoff only. It does
not complete the broad audit or grant permission to change filtering behavior.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this YouTube Music/YTM surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, YTM behavior, Music surface behavior,
whitelist behavior, metric collectors, artifact creation, native sync, release
package changes, or public claims.
