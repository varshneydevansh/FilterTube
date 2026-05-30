# FilterTube Subagent Review Convergence - 2026-05-19

Status: read-only audit consolidation. This is not an implementation patch.

This document preserves the five parallel review passes that were run against
the current worktree. The reviewers were intentionally asked to challenge the
audit from different angles, not to make fixes. Their outputs converge on the
same root cause already captured in the stabilization order: FilterTube has
split runtime authority across JSON mutation, DOM fallback, lifecycle work,
network side effects, settings mutation, security locks, and release/static
surfaces.

The value of this slice is not that five reviewers agreed. The value is that
their independent evidence points to the same blocker: the code has enough
current-behavior proof to explain lag, false hides, leaks, and recommendation
risk, but it does not yet have enough positive/negative fixtures to safely
change behavior.

## Convergence Map

```text
User symptoms
  - slow YouTube Main on empty install
  - wrong content hidden while visible lists are empty
  - blocked topics still appearing in end-screens or rails
  - possible recommendation/engagement side effects

Independent review convergence
  -> seed endpoint work happens before no-rule pass-through
  -> DOM selectors can target broad containers
  -> lifecycle work starts before feature/action gates
  -> renderer rules are incomplete for modern YouTube structures
  -> mutation/security/storage authorities are split
  -> release/native surfaces can claim more than artifact proof

Current safe next step
  -> add current-behavior fixtures and source-counted gates
  -> do not patch runtime behavior until the matching P0 family is green
```

## Review Slice Findings

| Review slice | Strongest evidence | Concrete source surface | Required gate before behavior changes |
| --- | --- | --- | --- |
| JSON/renderers | `compactPlaylistRenderer`, modern collaborator `showSheetCommand`, direct watch-card renderers, Shorts owner identity, shelf wrappers, and Mix avatar stacks are incomplete or risky. | `js/filter_logic.js`; `docs/json_paths_encyclopedia.md`; `docs/youtube_renderer_inventory.md` | Renderer authority must prove blocklist, whitelist, identity confidence, route/surface, and negative sibling-visible behavior for each renderer. |
| DOM/lifecycle | Members-only and playlist selectors can hide watch/shelf parents; quick-block and fallback menu install page-wide listeners/scans before final gates. | `js/content/dom_fallback.js`; `js/content_bridge.js`; `js/content/block_channel.js`; `js/content/dom_extractors.js` | Selector, lifecycle, and hide/restore authority must exist before deleting, broadening, or moving DOM fallback code. |
| Endpoint/network/performance | Fetch/XHR interception parses and rewrites before disabled/no-rule pass-through; endpoint matching is substring-based; direct identity/metadata fetches and synthetic clicks need budgets. | `js/seed.js`; `js/content_bridge.js`; `js/background.js`; `js/injector.js` | Endpoint policy, network authority, and engagement budgets must be added before no-work optimization or side-effect cleanup. |
| Settings/mutation/security | V3/V4 settings writes, list-mode transfer, secondary channel-add paths, PIN/session gates, storage invalidation, and Nanah scoped apply are split. | `js/settings_shared.js`; `js/state_manager.js`; `js/background.js`; `js/nanah_sync_adapter.js`; `js/tab-view.js`; `js/popup.js` | Mutation, rule mutation, storage/cache, message trust, and security lock authorities must exist before simultaneous allow/block or migration work. |
| Release/static/native | Package roots are broader than manifest truth; release creation is not artifact-proof-first; generated/vendor and native runtime freshness are manual or partially proven. | `build.js`; `scripts/build-extension-ui.mjs`; `scripts/build-nanah-vendor.mjs`; `scripts/sync-native-runtime.mjs`; `website/app/downloads/page.js` | Release/package/claim/native sync manifests must exist before public download or platform-readiness claim expansion. |

## High-Confidence Problem Families

### Empty Install And Disabled Mode Are Not Zero Work

The endpoint review confirms the same issue already pinned by
`docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md`: no-rule and
disabled states can still perform body work.

```text
YouTubei response
  -> substring endpoint match
  -> response.clone().json()
  -> no-rule/disabled branch
  -> harvestOnly or processData on some routes
  -> new Response(JSON.stringify(...))
```

Primary evidence:

- `js/seed.js` clones/parses matched responses before the no-rule budget is
  proven.
- `tests/runtime/p0-no-work-current-behavior.test.mjs` proves disabled mode
  avoids filter mutation but still parses and stringifies intercepted responses.
- `tests/runtime/empty-install-performance-current-behavior.test.mjs` proves
  empty blocklist paths still process mobile browse, player, watch-next, and
  guide endpoints.

Required future proof:

```text
compiledRuleState.noWork === true
  -> responseJson: 0
  -> jsonStringify: 0
  -> processData: 0
  -> harvestOnly: 0 unless explicit active identity reason
  -> DOM scans: 0
  -> menu/quick sweeps: 0
```

### DOM False-Hide Boundaries Are Still Too Broad

The DOM review flags broad hiding authority in members-only, playlist lockups,
watch shell handling, selected playlist rows, and parent container cleanup.
Those risks are broader than the user-visible false-hide symptom because they
can remove non-matching siblings or primary watch structure.

Primary evidence:

- `js/content/dom_fallback.js` contains members-only CSS/JS targets for broad
  watch and shelf containers.
- `js/content/dom_fallback.js` contains playlist lockup logic that can escalate
  from one card to `ytd-horizontal-list-renderer` or `ytd-shelf-renderer`.
- `tests/runtime/dom-broad-hide-boundary-current-behavior.test.mjs` and
  `tests/runtime/p0-hide-restore-current-behavior.test.mjs` pin these as
  current behavior.

Required future proof:

```text
hideRestoreAuthority.report
  owner
  target kind
  exact selector
  reason marker
  restore owner
  stats policy
  media policy
  negative sibling-visible proof
```

### Runtime Lifecycle Starts Before Enough Gates

The lifecycle review confirms fallback menu and quick-block are not just UI
features. They are lifecycle owners: selectors, observers, listeners, intervals,
delayed rescans, and viewport event handlers. That matters even when the user
has no filters or is in a mode where the affordance is hidden.

Primary evidence:

- `js/content_bridge.js` installs fallback menu scanning around
  `ensureFallbackMenuButtons()`.
- `js/content/block_channel.js` installs quick-block styles/listeners/observer
  before the first enabled guard in `setupQuickBlockObserver()`.
- `tests/runtime/p0-lifecycle-current-behavior.test.mjs` and
  `tests/runtime/page-runtime-lifecycle-authority-current-behavior.test.mjs`
  pin the missing lifecycle registry.

Required future proof:

```text
lifecycleRegistry.owner
  feature predicate
  route/surface
  active rule state
  native overlay/fullscreen pause reason
  teardown handle
  no-rule budget
```

### JSON-First Is The Right Direction But Not Yet Complete

The renderer review supports the current strategy: prefer JSON path authority
over broad DOM hiding. But it also proves JSON-first is not yet complete enough
to delete defensive DOM paths or expand renderer rules blindly.

Primary evidence:

- `compactPlaylistRenderer` is unwrapped from `richItemRenderer` but has no
  direct rule authority.
- Modern collaborator rosters using `showSheetCommand` are documented in the
  renderer inventory but are not fully handled by the current runtime.
- Direct `watchCardRichHeaderRenderer`, `watchCardHeroVideoRenderer`, and
  `watchCardRHPanelVideoRenderer` are not direct rule owners.
- `docs/audit/FILTERTUBE_P0_RENDERER_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md` and
  `tests/runtime/p0-renderer-authority-current-behavior.test.mjs` pin these
  as current behavior.

Required future proof:

```text
rendererAuthority
  renderer type
  JSON path source
  route/surface
  blocklist decision
  whitelist decision
  identity-confidence decision
  false-hide sibling fixture
  raw capture traceability
```

### Engagement Risk Is Plausible And Must Be Budgeted

The network/performance review does not prove how YouTube ranks videos. It does
prove FilterTube has paths that can be YouTube-observable: direct watch/shorts
fetches, credentialed import fetches, synthetic clicks, scroll dispatch, and
media pause/stop.

Primary evidence:

- `docs/audit/FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md` documents
  these current paths.
- `tests/runtime/engagement-budget-current-behavior.test.mjs` pins direct
  metadata fetches, identity fallback fetches, current-watch clicks/pauses,
  playlist guard clicks/pauses, and import automation.

Required future proof:

```text
engagementSideEffectAuthority
  observable type
  owner
  user initiated?
  route/surface
  rule reason
  target id
  credentials policy
  max per navigation
  disabled/no-rule behavior
```

### Mutation And Lock Authority Are Split

The settings/security review confirms the UI can look protected while lower
paths write the same rule/profile state through different mutation branches.
This is especially important before simultaneous block/allow entries, Nanah
sync changes, profile lock changes, or list-mode migration.

Primary evidence:

- `js/settings_shared.js` can write V4 profile state during load/save flows.
- `js/state_manager.js`, `js/background.js`, and `js/nanah_sync_adapter.js`
  mutate related profile/rule state independently.
- Secondary channel-add/message paths do not share the same sender, list, lock,
  or revision report as the primary UI action.
- `docs/audit/FILTERTUBE_P0_RULE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md`,
  `docs/audit/FILTERTUBE_P0_SETTINGS_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md`, and
  `docs/audit/FILTERTUBE_P0_SECURITY_PIN_LOCK_CURRENT_BEHAVIOR_2026-05-19.md` pin
  these gaps.

Required future proof:

```text
ruleMutationAuthority.report
  actor class
  target profile
  target surface/list
  operation
  normalized input
  lock result
  storage keys
  cache invalidation
  backup trigger
  runtime broadcast
  compiled revision
```

## What This Allows Next

This convergence does not allow implementation changes. It allows only better
proof:

```text
allowed:
  - current-behavior tests
  - minimal capture extraction
  - neutral counters
  - source-counted registers
  - docs that connect source evidence to blocked fix lanes

blocked:
  - broad runtime behavior flips
  - DOM fallback deletion
  - renderer expansion without whitelist and false-hide proof
  - no-work optimization without endpoint/body counters
  - simultaneous allow/block migration
  - network/engagement side-effect changes
  - release claim expansion
```

## Current Verdict

```text
Subagent convergence is proof-pinned.
The reviewers agree on split authority as the disease.
The current audit suite explains several symptoms, but does not complete the
full objective.
The implementation gate remains closed.
```

Related artifacts:

- `docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md`
- `docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md`
- `docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
