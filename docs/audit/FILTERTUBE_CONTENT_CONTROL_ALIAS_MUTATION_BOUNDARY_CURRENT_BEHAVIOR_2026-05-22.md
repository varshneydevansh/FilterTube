# FilterTube Content Control Alias Mutation Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, settings patch, alias migration patch, cache invalidation
patch, JSON-first behavior patch, DOM fallback patch, or UI mutation patch.

This slice follows the `hideShorts`/`hideComments` catalog aliases through
StateManager mutation, shared settings persistence, profile storage, background
compile, seed active-work checks, filter logic, and DOM fallback. It proves the
current split behavior and keeps first-class JSON promotion blocked until alias
mutation, cache invalidation, route/surface effects, and no-work budgets are
owned by one explicit contract.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Boundary Source Files

content control alias mutation boundary source files: 7

content control alias mutation source/effect blocks: 13

runtime content-control alias mutation fixtures: 5

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_controls_catalog.js` | 222 | 7822 | `780b35c8aa33161ccd6e489b0843f01d805620409715a50aaca0a0bf6cff7e10` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/content/dom_fallback.js` | 5030 | 235555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Pinned Source Counts

settings_shared buildCompiledSettings block lines: 79

settings_shared buildCompiledSettings block bytes: 3162

settings_shared V4 save root payload block lines: 37

settings_shared V4 save root payload block bytes: 2916

settings_shared V4 profile settings block lines: 48

settings_shared V4 profile settings block bytes: 3459

settings_shared legacy save payload block lines: 191

settings_shared legacy save payload block bytes: 12311

settings_shared load alias block lines: 40

settings_shared load alias block bytes: 3417

state_manager saveSettings payload block lines: 37

state_manager saveSettings payload block bytes: 2094

state_manager updateSetting valid keys block lines: 33

state_manager updateSetting valid keys block bytes: 1063

state_manager external reload keys block lines: 41

state_manager external reload keys block bytes: 1604

background main compile alias block lines: 454

background main compile alias block bytes: 28209

background storage refresh keys block lines: 16

background storage refresh keys block bytes: 461

seed JSON predicate helpers block lines: 38

seed JSON predicate helpers block bytes: 1331

filter_logic processed defaults block lines: 12

filter_logic processed defaults block bytes: 425

DOM fallback active boolean keys block lines: 28

DOM fallback active boolean keys block bytes: 905

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| UI mutation key admission | `StateManager.updateSetting()` admits `hideShorts` and `hideComments`; it does not admit `hideAllShorts` or `hideAllComments`. | A catalog/runtime alias contract for every UI setting mutation key. |
| UI save payload | `StateManager.saveSettings()` passes `hideShorts: state.hideShorts` and `hideComments: state.hideComments` to shared settings. | A mutation report that proves profile, lock, mode, concurrent-save, broadcast, and backup behavior for alias keys. |
| Shared compiled payload | `buildCompiledSettings()` compiles `hideShorts` into `hideAllShorts` and `hideComments` into `hideAllComments`. | A shared compile schema that names both UI alias and runtime field with revision ownership. |
| Root storage payload | `saveSettings()` writes root storage keys `hideAllShorts` and `hideAllComments`; the root payload does not write `hideShorts` or `hideComments`. | A storage alias policy that separates legacy root keys from profile settings keys. |
| V4 profile settings | `saveSettings()` writes active profile settings as `hideShorts` and `hideComments`, derived from compiled `hideAllShorts` and `hideAllComments`. | A V4 profile schema report with migration, fallback, and stale-root precedence decisions. |
| Shared load path | `loadSettings()` reads profile settings through `hideShorts`/`hideComments` with legacy fallback to root `hideAllShorts`/`hideAllComments`. | A read-path fixture matrix for missing V4, partial V4, stale root, and conflicting root/profile values. |
| Background compile | Background compile reads V4 `hideShorts`/`hideComments` with legacy `hideAllShorts`/`hideAllComments` fallback, then emits runtime `hideAllShorts`/`hideAllComments`. | A background compile parity report across root storage, V4 profiles, cache reads, and `FilterTube_ApplySettings`. |
| Background invalidation | Background storage-change invalidation watches `hideAllShorts` and `hideComments`, but not `hideAllComments` or `hideShorts`. | A cache invalidation parity report proving which alias write invalidates which compiled cache entry. |
| Runtime JSON consumers | `seed.js` and `filter_logic.js` consume `hideAllShorts` and `hideAllComments`, not the UI alias names. | A first-class JSON setting-field manifest with route/surface/list-mode/no-work proof for each runtime field. |
| Runtime DOM fallback | DOM fallback active keys include both alias names and runtime names, while hide logic primarily consumes `hideAllShorts` and `hideAllComments`. | A DOM parity report proving alias refresh, restore, marker cleanup, and sibling-visible behavior. |

## Executed Alias Fixture Results

The runtime guard executes `js/settings_shared.js` with mocked storage and pins:

1. `saveSettings({ hideShorts: true, hideComments: true })` returns compiled
   runtime fields `hideAllShorts: true` and `hideAllComments: true`.
2. That V4 save writes root storage keys `hideAllShorts` and
   `hideAllComments`.
3. That V4 save writes active profile settings keys `hideShorts` and
   `hideComments`.
4. The root storage payload does not write root `hideShorts` or
   `hideComments`.
5. Legacy `loadSettings()` maps root `hideAllShorts` and `hideAllComments` back
   to UI-facing `hideShorts` and `hideComments`.

## Non-Completion Boundary

Content control alias mutation still needs a catalog/runtime alias contract,
storage alias policy, V4/root precedence report, StateManager mutation report,
background invalidation parity report, JSON setting-field manifest, DOM alias
parity report, per-alias no-work budgets, fixture provenance, metric artifacts,
and first-class JSON gate proof before behavior changes.

No `contentControlAliasMutationContract`,
`contentControlStorageAliasPolicy`, `contentControlAliasReadWriteReport`,
`contentControlStateManagerAliasMutationReport`,
`contentControlBackgroundInvalidationParityReport`,
`contentControlJsonSettingFieldManifest`, `contentControlDomAliasParityReport`,
`contentControlAliasNoWorkBudget`, `contentControlAliasFixtureProvenance`, or
`contentControlAliasFirstClassJsonGate` exists in product runtime source yet.

## 2026-06-01 Lane Promotion

Promoted focused lane: `test:settings`.

This promotion keeps alias storage, profile compile, background compile, and
legacy root/profile key behavior inside the settings lane. It is still
audit-only and does not approve alias migration, cache invalidation changes,
JSON-first promotion, DOM fallback changes, or no-work optimization.
