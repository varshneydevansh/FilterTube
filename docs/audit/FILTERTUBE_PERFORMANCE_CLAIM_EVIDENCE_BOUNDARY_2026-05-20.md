# FilterTube Performance Claim Evidence Boundary - Current Behavior - 2026-05-20

Status: audit-only proof slice. This is not an implementation patch.
Runtime behavior remains unchanged.

This slice separates historical performance claims from current measured
evidence. The extension has several directionally useful optimizations
(`compiled settings`, learned maps, batched writes, endpoint skips), but the
current repository does not yet include a measurement authority that proves
specific CPU, I/O, latency, or lag-reduction percentages across YouTube routes.

The practical rule for future fixes:

```text
Do not use a performance percentage or latency target as proof unless the
runtime has a named metric source, route/surface, device/browser profile,
active-rule state, sample size, and committed result artifact.
```

## Why This Matters

The active audit is investigating lag and false hides. A stale claim such as
"90%+ reduction in perceived lag" can cause a patch to preserve expensive work
because the doc says it is already solved. The current tests prove many
performance-relevant gaps still exist: empty installs can parse/rebuild
YouTubei responses, mobile home browse continuations can still reach
`processData`, broad DOM lifecycle work can start without a central active-work
authority, and fallback resolvers still exist for sparse identity surfaces.

## Claim Register

| Claim source | Claim shape | Current evidence boundary | Audit verdict |
| --- | --- | --- | --- |
| `docs/PROACTIVE_CHANNEL_IDENTITY.md` | "reducing CPU usage by 60-80%", "eliminating UI lag", "I/O overhead by 70-90%" | Current source contains caching, async, and batched-write mechanisms, but no committed benchmark artifact tying those percentages to browser/device/route/rule state. | Historical estimate, not current proof. |
| `docs/CONTENT_HIDING_PLAYBOOK.md` | "Near-zero lag in Chromium", "90%+ reduction in perceived lag", "CPU usage by 60-80%" | Runtime audit tests still pin empty/no-rule endpoint work, broad DOM lifecycle work, and raw enabled-predicate overwork. | Directional optimization note, not a release authority. |
| `docs/TECHNICAL.md` | "Reduces CPU usage by 60-80%" and "90%+ lag reduction" | Technical summary does not link to a measurement harness or fixture result with route/device/sample metadata. | Must be treated as stale until measured. |
| `docs/THREE_DOT_MENU_IMPROVEMENTS.md` | "DOM extraction time < 5ms", "Network fetch time < 2000ms (95th percentile)", "Cache hit rate > 80%" | Menu runtime has multiple `null`, `needsFetch`, background fetch, and failure paths. The numbers are goals or historical estimates, not verified current behavior. | Keep only as future metric targets unless measured. |
| `README.md` and website/product claims | "JSON-backed surfaces can be filtered before paint when YouTube exposes needed fields" | This scoped wording is safer because it is conditional and does not assert measured performance. | Acceptable as product direction, still needs route fixtures before stronger claims. |

## Current Runtime Facts That Contradict "Already Solved" Lag Claims

- `tests/runtime/empty-install-performance-current-behavior.test.mjs` proves
  empty or disabled states can still do parse/rebuild/lifecycle work.
- `tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs` proves XHR
  endpoint marking and ready-state hooks can install before settings/no-work
  guards reject processing.
- `tests/runtime/active-rule-authority-current-behavior.test.mjs` proves active
  predicates are split and strict content-filter booleans can still wake work before the
  final per-card predicate validates values.
- `tests/runtime/dom-route-scope-current-behavior.test.mjs` and
  `tests/runtime/selector-authority-current-behavior.test.mjs` prove selector
  work is still broad and not controlled by one route-aware selector authority.
- `tests/runtime/identity-work-budget-current-behavior.test.mjs` proves
  fallback resolver work exists without a global source-confidence/work-budget
  authority.

## Required Future Metric Authority

Before claiming a concrete performance number, add a runtime/reporting contract
that can produce:

```text
performanceClaimAuthority {
  claimId: string
  route: home | search | watch | shorts | kids | ytm | playlist | comments
  browser: chrome | firefox | edge | opera | mobile-webview
  deviceClass: high | mid | low | emulator | unknown
  ruleState: disabled | empty | blocklist | whitelist | content-controls
  source: seed | filterLogic | domFallback | menu | quickBlock | resolver
  work: parse | stringify | traverse | selectorScan | hide | restore | fetch | storage
  count: number
  bytes?: number
  elapsedMs?: number
  sampleSize: number
  resultArtifact: string
}
```

Missing future authority symbols today:

- `performanceClaimAuthority`
- `runtimeMetricSample`
- `emptyInstallNoWorkMetric`
- `routeWorkBudgetReport`
- `menuResolutionLatencyMetric`

## Implementation Boundary

Do not optimize by deleting fallback logic just because a historical doc says
performance was already solved. Each behavior change still needs:

1. A route/surface fixture proving the behavior remains correct.
2. A no-work fixture proving disabled/empty states do less work.
3. A metric fixture proving the changed path reduces parse/scan/fetch/storage
   work on the target route.
4. A negative false-hide fixture proving the optimization did not broaden a
   selector or weaken identity confidence.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
