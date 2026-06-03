# FilterTube P0 No-Work Current Behavior - 2026-05-18

Status: current-behavior proof slice with 2026-05-26 no-work optimization addendum.

This document starts converting the counted P0 fixture wall into runnable
fixtures. It covers the first P0 family from
`docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md`: no-work.
This file records current behavior after the scoped no-work fix; it is not an implementation patch or permission for additional runtime changes.

## P0 Fixture Family

```text
P0 no-work:
  empty_blocklist_desktop_home_no_work
  empty_blocklist_mobile_home_no_work
  empty_blocklist_watch_no_player_mutation
  disabled_extension_no_mutation
```

These names are now executable release gates for the seed network no-work path.
The current tests prove that empty/no-rule and disabled YouTubei fetches return
through the native response path without cloned-response parse, stringify,
harvest-only, or engine mutation work.

## Current Findings

| P0 fixture | Current behavior | Current proof | Future expectation |
| --- | --- | --- | --- |
| `empty_blocklist_desktop_home_no_work` | Desktop home `/youtubei/v1/browse` with empty blocklist now skips `processData`, `harvestOnly`, cloned-response JSON parse, and replacement-body stringify. | `tests/runtime/p0-no-work-current-behavior.test.mjs` | Keep zero response parse, zero stringify, zero `processData`, zero `harvestOnly`, zero map writes unless identity harvest has an explicit active reason. |
| `empty_blocklist_mobile_home_no_work` | Mobile home `/youtubei/v1/browse` with empty blocklist now shares the same no-work pass-through budget as desktop home. | `tests/runtime/p0-no-work-current-behavior.test.mjs` | Mobile home must stay aligned with desktop home when no rules are active. |
| `empty_blocklist_watch_no_player_mutation` | Watch `/youtubei/v1/player` with empty blocklist now passes through without player response parse, engine mutation, or replacement-body stringify. | `tests/runtime/p0-no-work-current-behavior.test.mjs` | Player metadata should remain pass-through or metadata-only without recommendation mutation when no active rule needs it. |
| `disabled_extension_no_mutation` | Disabled filtering now passes intercepted YouTubei responses through without parse, stringify, harvest, or engine mutation. | `tests/runtime/p0-no-work-current-behavior.test.mjs` | Disabled mode should keep intercepted YouTubei responses side-effect free. |

## Why This Matters

The user-visible lag report can happen even when the user has no blocklist or
whitelist entries. The optimized seed path now avoids the earlier no-rule cost:

```text
YouTubei response
  -> endpoint match
  -> no active JSON work decision
  -> native fetch/XHR response path
```

That means follow-up optimization should focus on remaining DOM/lifecycle owners
instead of reintroducing seed response parsing when no JSON work is active.

## Required Future Counter Contract

Each no-work fixture must eventually assert:

```text
responseJson: 0
jsonParse: 0 for intercepted body
jsonStringify: 0
processData: 0
harvestOnly: 0 unless identity harvest reason is explicit
direct network fetches: 0
DOM scans: 0
quick/fallback menu sweeps: 0
stats/map/storage writes: 0
```

## Current Verdict

```text
P0 no-work family is green for seed network pass-through fixtures.
Current behavior is proof-pinned.
Runtime behavior changed on 2026-05-26.
Further JSON-first, DOM lifecycle, and release optimization remains blocked
until the broader proof packets and metric artifacts exist.
```

Related artifacts:

- `docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md`
- `docs/audit/FILTERTUBE_EMPTY_INSTALL_PERFORMANCE_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_ENDPOINT_DECISION_MATRIX_2026-05-18.md`
- `docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md`

## First Optimization Metric Collector No-Work Preservation Matrix Addendum

First optimization metric collector no-work preservation matrix addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-no-work-preservation-matrix-current-behavior.test.mjs`
maps these P0 no-work fixture names and counter groups to future metric
collector preservation rows. The addendum pins 12 collector no-work
preservation rows, 12 collector insertion rows covered, 4 P0 no-work fixture
names covered, 9 required no-work counter groups covered, 12 route/surface
obligations covered, 0 runtime collector no-work proofs approved, and 0
implementation-ready collector no-work rows.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 no-work gate can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
