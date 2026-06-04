# FilterTube Network Credential Policy Matrix Current Behavior - 2026-05-24

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, network-policy patch,
credentials patch, fetch cleanup, endpoint cleanup, whitelist patch, or
JSON-first promotion.

## Purpose

This slice narrows the network authority gap from broad fetch/XHR row counts to
explicit credential-mode ownership. The current source has credential choices
encoded per local callsite, but no first-class policy object or report tying
each request to owner, reason, route, profile, list mode, active rule, and
budget.

This matters for optimization and JSON-first work because a future no-network or
reduced-fallback claim can be wrong even if JSON filtering is correct: some
identity repair and import paths still use credentialed YouTube-visible fetches,
while release-note fetches currently omit an explicit credential option.

## Source Scope

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |
| `js/content/handle_resolver.js` | 282 | 9785 | `67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff` |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |
| `js/tab-view.js` | 11617 | 526763 | `1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7` |

Adjacent proof:

- `docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_BACKGROUND_IDENTITY_FETCH_NETWORK_BUDGET_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_FETCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
network credential policy matrix source files: 5
product fetch callsites in scoped files: 13
fetch callsites with explicit credentials: 11
fetch callsites without explicit credentials: 2
explicit credentials source files: 4
credentials include rows: 6
credentials same-origin rows: 4
credentials omit rows: 1
runtime network credential policy matrix fixtures: 5
runtime behavior changed: no
not completion proof for network credential policy authority
```

## Credential Row Matrix

| File | Line | Owner / reason | Credential mode |
| --- | ---: | --- | --- |
| `js/background.js` | 2892 | Background Shorts identity HTML fetch | `include` |
| `js/background.js` | 3008 | Background Kids watch identity HTML fetch | `include` |
| `js/background.js` | 3101 | Background Main watch identity HTML fetch | `include` |
| `js/background.js` | 4644 | Background channel info primary HTML fetch | `include` |
| `js/background.js` | 4658 | Background channel info handle fallback HTML fetch | `include` |
| `js/background.js` | 4811 | Background channel info public fallback HTML fetch | `omit` |
| `js/content/handle_resolver.js` | 240 | Content handle resolver direct same-origin HTML fetch | `same-origin` |
| `js/content_bridge.js` | 1944 | Content bridge watch metadata direct HTML fetch | `same-origin` |
| `js/content_bridge.js` | 8707 | Content bridge Shorts direct HTML fetch | `same-origin` |
| `js/content_bridge.js` | 8856 | Content bridge watch identity direct HTML fetch | `same-origin` |
| `js/injector.js` | 1473 | Main-world subscription import YouTubei POST | `include` |

## Fetch Rows Without Explicit Credentials

| File | Line | Owner / reason | Boundary |
| --- | ---: | --- | --- |
| `js/background.js` | 1723 | Background release-note extension-resource fetch | No explicit credentials option. |
| `js/tab-view.js` | 2664 | Dashboard release-note extension-resource fetch | No explicit credentials option. |

These two rows are still network request primitives, but they are extension
resource fetches. They are not YouTube identity repair, YouTubei mutation, or
JSON filtering authority.

## Current Behavior Boundaries

| Boundary | Current behavior | Missing proof before optimization |
| --- | --- | --- |
| Background identity repair | Shorts, Kids watch, Main watch, and channel-info primary/fallback HTML fetches use `credentials: 'include'`. | Per-request sender, route, profile, tab, active-rule reason, cache-hit, timeout, and max-per-navigation budget. |
| Public channel fallback | The secondary channel fallback uses `credentials: 'omit'`. | Explicit public-fallback permission and privacy report. |
| Content direct repair | Watch metadata, Shorts identity, watch identity, and handle resolver direct fetches use `credentials: 'same-origin'`. | Direct-versus-background fallback policy plus user-action/active-rule proof. |
| Main-world import | Subscription import POST uses `credentials: 'include'`. | Import action-token, origin, nonce, session, and body-size policy. |
| Extension release notes | Background and dashboard release-note fetches omit explicit credentials options. | Extension-resource fetch policy and public-claim/privacy parity. |
| Shared credential policy | Product runtime source lacks `networkCredentialPolicyReport`, `ownerCredentialPolicy`, and `networkFetchXhrCallsiteAuthority`. | A first-class credential policy report tied to every fetch owner/reason. |

## Risk Boundary

- Reliability: credential modes are local code choices, not policy decisions
  that can be inspected at runtime or asserted by an optimization pass.
- False-hide/leak: identity repair fetches can change learned maps and
  whitelist/blocklist outcomes, so credentialed fallback work needs reason and
  route proof before pruning or broadening it.
- Performance: credentialed HTML fetches, direct same-origin repair, and
  subscription import are not equivalent costs and should not share one generic
  "network fallback" budget.
- Code burden: background, content bridge, handle resolver, injector, and
  dashboard/release-note surfaces encode request behavior independently.

## Future Proof Fields

```text
networkCredentialPolicyReport
networkCredentialDecision
requestOwner
requestReason
requestCredentialMode
explicitCredentialOption
implicitCredentialDefault
senderClass
route
surface
profileType
listMode
activeRuleReason
userActionReason
cacheState
dedupeKey
timeoutBudgetMs
maxPerNavigationBudget
bodyReadBudget
privacyClass
fixtureProvenance
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
networkCredentialPolicyMatrixContract
networkCredentialPolicyReport
networkCredentialDecision
ownerCredentialPolicy
networkCredentialRequestReasonReport
networkCredentialPrivacyClassReport
networkCredentialNoWorkBudget
networkCredentialFixtureProvenance
networkCredentialMetricArtifact
networkCredentialJsonFirstGate
```

## Verification

Current proof command:

```bash
node --test tests/runtime/network-credential-policy-matrix-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one network authority gap
into current credential-mode rows, credentialless extension-resource fetch rows,
and missing first-class policy gates only.

## First Optimization Metric Collector Side-Effect Budget Matrix Addendum

First optimization metric collector side-effect budget matrix addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-side-effect-budget-matrix-current-behavior.test.mjs`
maps current network credential rows to collector side-effect budget rows. The
addendum pins 12 collector side-effect budget rows, 12 collector no-work
preservation rows covered, 12 collector insertion rows covered, 7 evidence
side-effect rows covered, 12 required work-budget fields covered, 12
route/surface obligations covered, 0 runtime collector side-effect budgets
approved, and 0 implementation-ready side-effect rows. It keeps network-backed
measurement blocked until credential, timeout, cache, privacy, and zero-fetch
budgets are explicit.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network credential policy matrix can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint rewrites, fetch/XHR no-work
changes, network authority changes, or whitelist behavior changes.
