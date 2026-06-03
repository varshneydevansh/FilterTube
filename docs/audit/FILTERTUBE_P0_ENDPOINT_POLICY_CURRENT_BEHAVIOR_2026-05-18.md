# FilterTube P0 Endpoint Policy Current Behavior - 2026-05-18

Status: current-behavior proof slice with 2026-05-26 no-work optimization addendum.

This document converts the P0 endpoint-policy family from
`docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md` into runnable
fixtures.
This file records current behavior after the scoped endpoint no-work fix; it is not an implementation patch or permission for additional runtime changes.

## P0 Fixture Family

```text
P0 endpoint policy:
  seed_search_no_rule_pass_through
  seed_browse_mobile_home_no_rule_pass_through
  seed_next_watch_no_rule_pass_through
  seed_player_metadata_only
  seed_guide_no_rule_pass_through
```

These names are now executable release gates for no-rule endpoint pass-through.

## Current Findings

| P0 fixture | Current behavior | Current proof | Future expectation |
| --- | --- | --- | --- |
| `seed_search_no_rule_pass_through` | Search on `/results` with empty blocklist now passes through without cloned-response parse, stringify, mutation, or harvest. | `tests/runtime/p0-endpoint-policy-current-behavior.test.mjs` | No-rule search should keep passing through unless a compiled identity reason exists. |
| `seed_browse_mobile_home_no_rule_pass_through` | Mobile home `/youtubei/v1/browse` with empty blocklist now shares desktop's no-rule pass-through budget. | `tests/runtime/p0-endpoint-policy-current-behavior.test.mjs` | Mobile home should not run generic processing with no active rules. |
| `seed_next_watch_no_rule_pass_through` | Watch `/youtubei/v1/next` with empty blocklist now skips engine work when no watch recommendation, comment, or route control needs mutation. | `tests/runtime/p0-endpoint-policy-current-behavior.test.mjs` | Watch-next should remain route-scoped: pass-through unless a recommendation/comment/playlist/watch-control rule is active. |
| `seed_player_metadata_only` | `/youtubei/v1/player` with empty blocklist now passes through without response-body replacement. | `tests/runtime/p0-endpoint-policy-current-behavior.test.mjs` | Player should remain metadata-only unless a specific future policy proves response mutation is required and safe. |
| `seed_guide_no_rule_pass_through` | `/youtubei/v1/guide` with empty blocklist now passes through without engine work. | `tests/runtime/p0-endpoint-policy-current-behavior.test.mjs` | Guide/sidebar should pass through unless a compiled guide/sidebar policy is active. |

## Why This Matters

The endpoint layer is currently a broad transport hook:

```text
URL contains endpoint fragment
  -> no active JSON work decision
  -> native response path
```

That is different from an endpoint policy. A policy must decide work before
body parse when possible:

```text
parsed URL + current route + compiledRuleState
  -> passThrough
  -> harvestOnly with explicit reason
  -> mutateRecommendations
  -> commentsContinuationRewrite
  -> playerMetadataOnly
  -> unsupportedNoop
```

The optimized path still should not rely on endpoint names alone. `/next` can mean
recommendations, comments, watch rails, playlist panels, or end-screen adjacent
data. `/player` can carry metadata that should be harvested without rewriting
the player response. `/browse` behaves differently on desktop home, mobile
home, channel pages, Kids, and subscription import.

## Required Future Endpoint Contract

Each endpoint fixture must eventually assert:

```text
endpointPolicy decision exists before response body work
parsed URL origin and exact pathname are used
route and surface are part of the decision
compiledRuleState is part of the decision
responseJson: 0 for passThrough
jsonStringify: 0 for passThrough
processData: 0 for passThrough or metadata-only
player response mutation: 0 unless explicitly authorized
comment continuation rewrite only for proven comment continuation shapes
```

## Current Verdict

```text
P0 endpoint-policy family is green for no-rule pass-through fixtures.
Current behavior is proof-pinned.
Runtime behavior changed on 2026-05-26.
Further endpoint expansion remains blocked until route/surface/list-mode,
negative-sibling, and metric proof exists.
```

Related artifacts:

- `docs/audit/FILTERTUBE_ENDPOINT_DECISION_MATRIX_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md`
- `docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 endpoint-policy gate can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
