# FilterTube Main Guide Endpoint No-Work Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch.

This slice pins the Main `/youtubei/v1/guide` optimization boundary. The guide
endpoint has a no-work path for empty and disabled Main settings: fetch
interception now returns the original response before cloned JSON parse when no
network JSON work is active. Whitelist mode remains active JSON work, while
guide DOM-control-only settings stay DOM-owned and bypass guide JSON parsing.
The reduced guide row also proves that channel identity fields can be present
while `guideEntryRenderer` remains not first-class guide JSON filter authority.

## Evidence

| Artifact | Lines | Bytes | SHA-256 | Classification |
| --- | ---: | ---: | --- | --- |
| `guide?prettyPrint=false.json` | 5508 | 231459 | `ab931c49096c2307063d315cfa06f7827df51d0017cd3db5ffdbb9422412a022` | Main guide endpoint raw capture. |
| `tests/runtime/fixtures/captures/main-guide-entry-renderer.json` | 49 | 1337 | `d27f1181c569da3f9424841f961b1cdf8ea46681ac61c0c01c5795206a9e201f` | Reduced `guideEntryRenderer` subscription row. |
| `tests/runtime/main-guide-endpoint-no-work-boundary-current-behavior.test.mjs` | audit test | audit test | audit test | Pins row identity, direct-rule absence, engine side effects, seed endpoint no-work behavior, whitelist exception, ledger links, and missing future authority. |

## Current Fixture

The reduced guide row carries channel identity:

```text
formattedTitle.simpleText: DrGameria
browseEndpoint.browseId: UC4REwc30LXHzKSkpqSwhR-Q
browseEndpoint.canonicalBaseUrl: /@DrJango1
entryData.guideEntryData.guideEntryId: UC4REwc30LXHzKSkpqSwhR-Q
accessibility label: DrGameria. New content available.
```

That evidence is useful, but the runtime rule table has no direct
`guideEntryRenderer` rule. The row currently passes through matching blocklist
keyword/channel rules, whitelist nonmatch, and `hideSubscriptions` direct engine
processing. It still queues a `FilterTube_UpdateChannelMap` side effect for
`UC4REwc30LXHzKSkpqSwhR-Q` / `@DrJango1`, including direct disabled engine
processing.

## Seed Endpoint Work

The seed fetch path currently includes `/youtubei/v1/guide` in the intercepted
endpoint list. For a guide response:

- empty blocklist mode bypasses before cloned JSON parse, `processData()`, and
  `JSON.stringify()`;
- disabled mode also bypasses before cloned JSON parse and engine work;
- whitelist mode still calls `processData()` and rebuilds because whitelist is
  an active JSON-work mode;
- `hideSubscriptions`, `hideMoreFromYouTube`, and `hideExploreTrending` bypass
  guide JSON parsing because their guide decisions are DOM-owned today.

This means the guide endpoint now has empty/disabled/DOM-only no-work coverage,
but it is still not a first-class guide JSON filter authority.

## Boundary

This slice narrows the open `capture_traceability_main_guide_no_rule_real_capture_pass_through`
gap but does not close it. Full guide no-work proof remains incomplete because
the current fixture is a single row, not a full guide section/container with
route-scoped disabled, empty blocklist, empty whitelist, DOM-only controls,
negative siblings, cache invalidation, metric, and side-effect budgets.

Future runtime authority tokens intentionally absent today:

```text
mainGuideEndpointNoWorkContract
mainGuideEndpointDecisionReport
mainGuideEntryRendererFilterRulePromotion
mainGuideDisabledNoParseBudget
mainGuideEmptyBlocklistNoWorkBudget
mainGuideWhitelistNoWorkPolicy
mainGuideChannelMapSideEffectBudget
mainGuideJsonFirstAuthorityGate
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this main guide no-work boundary can support
runtime optimization or JSON-first promotion. Current proof pins:

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
