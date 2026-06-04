# FilterTube Source-Of-Truth Claim Register - 2026-05-20

Status: audit-only proof. Runtime behavior is unchanged. This is not an implementation patch.

This register classifies every current `source of truth` / `source-of-truth`
wording occurrence outside this register and its test. The purpose is to keep
documentation wording from silently becoming implementation permission.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5912
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5912
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

The important rule for this audit is:

```text
Source of truth may describe a narrow owner for one artifact or one local
normalization job.

Source of truth must not be read as permission to hide, allow, fetch, mutate,
persist, restore, count stats, prune fallbacks, or ship public claims unless a
separate route + mode + source-confidence + side-effect authority proves it.
```

This is especially important for channel identity. The identity waterfall is a
source-confidence order, not a behavior authority:

```text
XHR JSON -> ytInitial* -> learned maps -> DOM extraction -> network fallback
```

## Current Occurrence Count

```text
scan roots: README.md, docs/, js/, tests/, package.json
excluded: this register and its current-behavior test
exact source-of-truth wording occurrences: 95
runtime source occurrences: 2
test assertion occurrences: 18
documentation/audit occurrences: 75
```

## Claim Classes

| Claim class | Meaning | Current action |
| --- | --- | --- |
| `narrow-local-owner` | The wording names one narrow implementation owner, such as handle parsing or current video id extraction. | Keep as a local claim, but do not let it authorize unrelated identity or hide effects. |
| `overbroad-runtime-risk` | The wording claims broad ownership while the audit already proves split ownership. | Keep pinned as a risk until the implementation has one authority/report or the comment/doc is narrowed. |
| `audit-boundary` | The wording is inside an audit doc/test and is already describing a boundary, missing proof, or corrected wording. | Keep as evidence. |
| `historical-plan` | The wording is in planning, handoff, scratch, or future app/website docs. | Treat as non-runtime evidence only. |
| `release-sync-owner` | The wording names ownership for app sync, release notes, or release-order docs. | Keep only as release-process evidence until package/source hash proof exists. |
| `misleading-identity-effect-risk` | The wording can imply JSON, DOM, or one document is enough to decide behavior. | Require source-tier/effect proof before any implementation relies on it. |

## Current Classified References

Recently narrowed: StateManager/importer wording was changed in `js/state_manager.js`,
`docs/TECHNICAL.md`, and `docs/CODEMAP.md` so it describes shared UI
coordination and importer input ordering instead of broad runtime authority.

| Reference | Claim class | Audit decision |
| --- | --- | --- |
| `js/shared/identity.js:12` | `narrow-local-owner` | Legitimate for handle parsing and normalization only. It is not a global channel-match or hide authority. |
| `js/content_bridge.js:2676` | `narrow-local-owner` | Local current-video-id extraction only. A video id is a join key, not channel identity. |
| `docs/JSON_FIRST_FILTERING_PLAN.md:205` | `misleading-identity-effect-risk` | `json_paths_encyclopedia.md` is an evidence map for documented fields, not proof that runtime consumes each path or may mutate a renderer. |
| `docs/NETWORK_REQUEST_PIPELINE.md:6` | `audit-boundary` | Acceptable as a pointer to the current waterfall audit doc, not as direct behavior authority. |
| `docs/THREE_DOT_MENU_IMPROVEMENTS.md:58` | `misleading-identity-effect-risk` | Collaborator roster precedence is plausible for that renderer shape, but still needs route/mode/effect proof before menu or hide behavior changes. |
| `docs/FUNCTIONALITY.md:206` | `narrow-local-owner` | Channel-derived keyword storage should be derived from channel `filterAll` state, but mutation authority remains split today. |
| `docs/CODEMAP.md:107` | `release-sync-owner` | Release notes data ownership is narrow and acceptable. |
| `docs/ARCHITECTURE.md:16`, `docs/CODEMAP.md:33` | `release-sync-owner` | Extension-to-native source ownership is currently split across docs/data; app sync still needs source hash/provenance proof. |
| `docs/APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md:5` | `release-sync-owner` | Release-order intent only; not proof that app assets contain the exact extension runtime. |
| `docs/MOBILE_APP_UI_SPEC.md:6`, `docs/MOBILE_APP_UI_SPEC.md:43` | `historical-plan` | Draft mobile planning language; not runtime or store-release proof. |
| `docs/filtertube_mobile_runtime_adapter_plan.md:18`, `docs/filtertube_mobile_runtime_adapter_plan.md:205`, `docs/filtertube_mobile_tv_architecture_plan.md:272` | `historical-plan` | Native/app planning language; needs app-side proof before release or runtime claims. |
| `docs/collab_three_dot_ui_google_aistudio.md:10`, `docs/collab_three_dot_ui_google_aistudio.md:275` | `historical-plan` | Prompt/handoff evidence only; not current implementation authority. |
| `docs/NANAH_POST_IMPLEMENTATION_CONCERNS_TRACKER.md:148` | `historical-plan` | Product behavior spec reference is a planning invariant, not current runtime proof in this repository. |
| `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:44`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:113`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:176`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:1406`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:1598`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:1726`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:1817`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:1850`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:1984`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:2547`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:4022`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:4074`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:4711`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:4723`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:5005`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:5371`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:5955`, `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md:7217`, `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md:180`, `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md:239`, `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md:273`, `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md:296`, `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_PARITY_RELEASE_VERIFICATION_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md:141`, `docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md:698` | `audit-boundary` | Audit findings. Several explicitly identify source-of-truth drift or missing authority; none should be treated as permission to patch behavior directly. |
| `docs/audit/FILTERTUBE_CHANGE_SAFETY_RUNTIME_AUDIT_BACKLOG_2026-06-01.md:393`, `docs/audit/FILTERTUBE_RUNTIME_TEST_FILE_PROVENANCE_INDEX_CURRENT_BEHAVIOR_2026-05-25.md:538`, `docs/audit/FILTERTUBE_RUNTIME_TEST_FILE_PROVENANCE_INDEX_CURRENT_BEHAVIOR_2026-05-25.md:623`, `docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md:705`, `docs/audit/TEST_LANE_MATRIX.md:27`, `docs/audit/TEST_LANE_MATRIX.md:47`, `docs/audit/TEST_LANE_MATRIX.md:334` | `audit-boundary` | Change-safety and proof-index wording. These entries keep the lane workflow and audit inventory honest; they do not authorize implementation behavior. |
| `docs/audit/FILTERTUBE_SOURCE_BOUNDARY_AUDIT_2026-05-18.md:133`, `docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md:205` | `audit-boundary` | Source/evidence boundary language. Raw captures and generated output remain evidence only. |
| `docs/audit/FILTERTUBE_RELEASE_FIX_AUDIT_STATUS_2026-05-26.md:245`, `docs/audit/FILTERTUBE_RELEASE_FIX_AUDIT_STATUS_2026-05-26.md:263`, `docs/audit/FILTERTUBE_RELEASE_FIX_AUDIT_STATUS_2026-05-26.md:555`, `docs/audit/FILTERTUBE_RELEASE_FIX_AUDIT_STATUS_2026-05-26.md:557`, `docs/audit/FILTERTUBE_RELEASE_FIX_AUDIT_STATUS_2026-05-26.md:712`, `docs/audit/FILTERTUBE_RELEASE_FIX_AUDIT_STATUS_2026-05-26.md:714`, `docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md:76`, `docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md:99`, `docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md:216`, `docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md:232`, `docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md:233` | `audit-boundary` | Release-fix audit status wording. These lines document proof refresh order and count drift only; they are not runtime authority. |
| `docs/audit/FILTERTUBE_P0_COMPILED_RULE_STATE_CURRENT_BEHAVIOR_2026-05-19.md:50`, `docs/audit/FILTERTUBE_P0_OBLIGATION_INDEX_2026-05-20.md:7`, `docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md:9`, `docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md:119`, `docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md:120`, `docs/audit/FILTERTUBE_REFERENCE_DOC_CLAIM_DRIFT_CURRENT_BEHAVIOR_2026-05-19.md:8`, `docs/audit/FILTERTUBE_REFERENCE_DOC_CLAIM_DRIFT_CURRENT_BEHAVIOR_2026-05-19.md:57`, `docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md:243`, `docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md:245`, `docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md:161`, `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md:1248`, `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md:2127`, `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md:2128`, `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md:2129`, `docs/audit/FILTERTUBE_RUNTIME_TEST_FILE_PROVENANCE_INDEX_CURRENT_BEHAVIOR_2026-05-25.md:531`, `docs/audit/FILTERTUBE_RUNTIME_TEST_FILE_PROVENANCE_INDEX_CURRENT_BEHAVIOR_2026-05-25.md:625` | `audit-boundary` | Current audit docs that explicitly separate source-tier wording from behavior permission. |
| `docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md:3152`, `docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md:3171`, `tests/runtime/active-goal-completion-audit-current-behavior.test.mjs:12129` | `audit-boundary` | Active-goal completion ledger wording. These lines document source-boundary/source-of-truth proof status and the refreshed completion guard only; they are not runtime authority or goal-completion proof. |
| `tests/runtime/identity-information-waterfall-current-behavior.test.mjs:41`, `tests/runtime/raw-capture-extraction-obligation-index-current-behavior.test.mjs:80`, `tests/runtime/reference-doc-claim-drift-current-behavior.test.mjs:200`, `tests/runtime/reference-doc-claim-drift-current-behavior.test.mjs:212`, `tests/runtime/p0-obligation-index-current-behavior.test.mjs:61`, `tests/runtime/objective-coverage-ledger-current-behavior.test.mjs:1022`, `tests/runtime/objective-coverage-ledger-current-behavior.test.mjs:1406`, `tests/runtime/objective-coverage-ledger-current-behavior.test.mjs:1411`, `tests/runtime/objective-coverage-ledger-current-behavior.test.mjs:1414`, `tests/runtime/objective-coverage-ledger-current-behavior.test.mjs:1416`, `tests/runtime/objective-coverage-ledger-current-behavior.test.mjs:1417`, `tests/runtime/first-optimization-verification-output-contract-current-behavior.test.mjs:42`, `tests/runtime/first-optimization-verification-output-contract-current-behavior.test.mjs:57`, `tests/runtime/first-optimization-source-locus-parity-release-verification-ownership-boundary-current-behavior.test.mjs:98`, `tests/runtime/stabilization-fix-order-current-behavior.test.mjs:121`, `tests/runtime/audit-completion-gap-register-current-behavior.test.mjs:323`, `tests/runtime/test-lane-visible-safety-current-behavior.test.mjs:97` | `audit-boundary` | Test assertions. They pin wording boundaries; they do not authorize runtime behavior. |

## Required Future Proof Before Changing Behavior

Any future patch that relies on a `source of truth` claim must provide:

```text
claimReference
claimedOwner
route
surface
profileType
listMode
ruleState
sourceTier
confidenceClass
allowedEffects
forbiddenEffects
positiveFixture
negativeSiblingFixture
restoreProof
noRuleBudget
teardownOrPauseProof
```

## Runtime Authority Status

No runtime symbol exists yet for:

- `sourceOfTruthClaimAuthority`
- `sourceOfTruthEffectDecision`
- `identitySourceTruthDecision`
- `runtimeStateTruthReport`

This register is a wording and authority-boundary layer only. It does not
permit renderer expansion, selector cleanup, DOM fallback deletion, network
fallback deletion, whitelist/blocklist mode changes, app sync changes, or public
release claims.
