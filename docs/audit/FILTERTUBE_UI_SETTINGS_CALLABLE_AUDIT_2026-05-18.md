# FilterTube UI And Settings Callable Audit - 2026-05-18

Status: audit-only callable expansion. This file does not change product
behavior. It expands the proof boundary beyond the first page-resident runtime
stack into the extension UI, import/export, profile, PIN, Nanah, and settings
surfaces.

This is not complete behavioral proof for every UI method yet. It is the first
classified callable pass for the files that can mutate rules, list modes,
profiles, sync state, backups, dashboard controls, and public UI affordances.

Runnable proof:

```text
npm run audit:runtime
tests 274
pass 274
fail 0
```

## Scope

| File | Lexical callable count | Primary exported surface | Audit role |
| --- | ---: | --- | --- |
| `js/content_controls_catalog.js` | 3 | `FilterTubeContentControlsCatalog` | Shared catalog for content-control UI rows and labels. |
| `js/io_manager.js` | 53 | `FilterTubeIO` | Import/export, V3/V4 profile persistence, encrypted backups, Nanah trusted-state backup, auto-backup download rotation. |
| `js/nanah_sync_adapter.js` | 24 | `FilterTubeNanahAdapter` | Open-source P2P portable payload/envelope builder and incoming settings applier. |
| `js/popup.js` | 53 | DOMContentLoaded popup controller | Popup controls, profile dropdown, list-mode toggle, PIN unlock, quick edits, export/import entry points. |
| `js/render_engine.js` | 41 | `RenderEngine` | Dashboard list rendering for keywords/channels plus row-level toggle/delete actions. |
| `js/security_manager.js` | 12 | `FilterTubeSecurity` | PIN verifier, PBKDF2/AES backup encryption/decryption. |
| `js/settings_shared.js` | 29 | `FilterTubeSettings` | Shared schema normalization, local settings load/save, compile helpers, theme helpers. |
| `js/state_manager.js` | 65 | `StateManager` | Central UI state, mutations, saves, background broadcasts, subscriptions import, storage reload. |
| `js/tab-view.js` | 311 | DOMContentLoaded dashboard controller | Main dashboard, filters, Kids UI, profiles, sync, import/export, Nanah, settings, navigation. |
| `js/ui_components.js` | 33 | `UIComponents` | Shared controls, dropdowns, tabs, toasts, theme/profile UI primitives. |

Total first-pass UI/settings lexical callables: 624.

## Public API Surfaces

| Surface | File | Public methods / entry points | Risk |
| --- | --- | --- | --- |
| `FilterTubeSettings` | `js/settings_shared.js:1150` | `normalizeKeywords`, `normalizeChannels`, `compileKeywords`, `syncFilterAllKeywords`, `buildCompiledSettings`, `loadSettings`, `saveSettings`, theme helpers, settings-change helpers | This is both schema compiler and persistence authority. It still has key-list drift against background/runtime dependencies. |
| `FilterTubeIO` | `js/io_manager.js:1994` | `exportV3`, `exportV3Encrypted`, `importV3`, `importV3Encrypted`, `loadProfilesV3`, `saveProfilesV3`, `loadProfilesV4`, `saveProfilesV4`, backup helpers | Import/export and profile persistence can rewrite V3/V4 state; read paths can also repair/write V4 state. |
| `FilterTubeNanahAdapter` | `js/nanah_sync_adapter.js:401` | `buildPortablePayload`, `buildSyncEnvelope`, `buildControlProposal`, `applyIncomingEnvelope`, `extractPortableFromEnvelope`, descriptor helpers | P2P sync is user-controlled, but incoming envelopes can apply settings through IO. Needs explicit profile/scope/strategy proof. |
| `FilterTubeSecurity` | `js/security_manager.js:192` | PIN verifier and encrypted JSON helpers | Security surface is small but high-impact; requires stable KDF/version metadata and failure-report proof. |
| `StateManager` | `js/state_manager.js:2419` | `loadSettings`, `saveSettings`, keyword/channel mutators, content/category mutators, theme, subscribe, subscriptions import | This is the largest mutation authority after background. It updates memory before persistence in several paths and broadcasts settings to runtime. |
| `RenderEngine` | `js/render_engine.js:1378` | `renderKeywordList`, `renderChannelList`, row item factories | UI rows call StateManager mutators directly; must preserve profile/list-mode/source semantics. |
| `UIComponents` | `js/ui_components.js:965` | Buttons, toggles, tabs, selects, dropdowns, toasts | Mostly UI primitives, but dropdown/listener lifecycle still needs teardown and duplicate-listener proof. |
| `FilterTubeContentControlsCatalog` | `js/content_controls_catalog.js:217` | `getCatalog`, `getAllControls`, `getControlByKey` | Catalog labels and keys must stay aligned with StateManager/settings/compiler/runtime keys. |

## Mutation And Interaction Findings

| Area | Current behavior | Proof | Risk | Next proof/fix gate |
| --- | --- | --- | --- | --- |
| Callable scale | The UI/settings layer alone has 624 lexical callables, with `js/tab-view.js` accounting for 311. | `tests/runtime/ui-settings-callable-current-behavior.test.mjs`; this file's Scope table | Feature changes can look local while actually crossing import/export, profile, sync, and runtime broadcast paths. | Split dashboard controller into audited sub-surfaces only after fixture-backed action contracts exist. |
| Shared settings key drift | `FilterTubeSettings.STORAGE_KEYS` is exported as authority but omits runtime compiler dependencies such as content/category filters, learned maps, exact matching, and V4 profiles. | `js/settings_shared.js:17`, `1150`; existing settings-authority fixtures | UI/storage change checks can miss rules that runtime uses, leaving stale or inconsistent filtering. | One shared dependency key list imported by settings, background, bridge, and StateManager. |
| Read path writes | `FilterTubeIO.loadProfilesV4()` can sanitize or migrate and then write `ftProfilesV4` while loading. | `js/io_manager.js:561`, `604`, `615` | Read operations can trigger storage listeners, backups, and runtime refresh cascades. | Split pure read from explicit migration/repair with a migration report. |
| V3 to V4 defaulting | IO and shared settings legacy builders default Main/Kids modes to blocklist and initialize whitelist arrays empty. | `js/io_manager.js:490`, `542`, `545`, `549`, `553`; `js/settings_shared.js:102`, `152`, `155`, `159`, `163` | Legacy whitelist/profile imports can become blocklist-shaped unless another path preserves allow lists first. | Migration fixtures for existing whitelist, mixed Main/Kids modes, and profile-specific imports. |
| StateManager save race | `StateManager.saveSettings()` returns immediately when `isSaving` is true. | `js/state_manager.js:1009` | Rapid UI changes can mutate memory and notify UI while a durable write is skipped. | Queue saves or mark dirty and retry after in-flight save. |
| Runtime broadcast authority | StateManager sends `FilterTube_ApplySettings` with locally compiled settings. | `js/state_manager.js:1209` | Background can treat UI payload as compiled cache authority unless background rebuilds from storage. | Background-owned revision and compile-from-storage response after save. |
| Profile persistence failures | `persistMainProfiles()` and `persistKidsProfiles()` catch/write warnings without returning failure to callers. | `js/state_manager.js:1077`, `1112`, `1143`, `1148`, `1170`, `1201` | UI can report success after V3/V4 profile persistence failed. | Mutation result object must include V3/V4 persistence status. |
| Nanah scoped apply | `applyScopedPortablePayload()` merges or replaces Main/Kids lists and writes `saveProfilesV4()` directly. | `js/nanah_sync_adapter.js:168`, `193`, `217`, `246` | P2P import can bypass StateManager's normal save/broadcast path unless caller refreshes runtime afterward. | Scope/strategy fixture plus mandatory UI/runtime refresh proof after apply. |
| Import path breadth | `FilterTubeIO.importV3()` can save settings, save profiles, merge V4 profiles, restore Nanah trusted state, and theme. | `js/io_manager.js:1223`, `1411`, `1494`, `1648`, `1671`, `1700` | A single import action can change filtering, profiles, sync trust, and theme. | Import dry-run report with explicit mutation plan before write. |
| Auto-backup lifecycle | IO and StateManager schedule delayed backups after many mutations. | `js/io_manager.js:1974`; `js/state_manager.js:25` | Saves/backups can be triggered by optimistic mutations or read-path repairs. | Backups only after successful durable mutation with trigger/source metadata. |
| RenderEngine row actions | Rendered keyword/channel rows call StateManager mutators directly. | `js/render_engine.js:377`, `481`, `932`, `1036`, `1121`, `1334` | UI row affordances must stay aligned with profile, Kids/Main, blocklist/whitelist, and derived-channel source policy. | Row-action fixtures for blocklist, whitelist, Kids, synced Kids-to-Main, and channel-derived keywords. |
| Popup and dashboard mode toggles | Popup and tab-view both send `FilterTube_SetListMode`; both have local confirmation/copy/transfer paths. | `js/popup.js:843`, `856`; `js/tab-view.js:10613`, `10626` | Mode-switch behavior can diverge between popup and full dashboard. | One list-mode action helper plus fixtures for copy/transfer/no-copy on both surfaces. |
| UI lifecycle/listeners | Popup, tab-view, UIComponents, RenderEngine install many listeners and timers. | `js/popup.js:609`, `1665`, `1831`; `js/tab-view.js:2757`, `8933`, `10892`, `11489`; `js/ui_components.js:790`, `821` | Dashboard/popup can duplicate listeners or timers after rerenders/navigation unless controlled. | UI listener registry or idempotent initialization proof. |

## Required Follow-Up Fixtures

```text
ui_settings_key_authority_single_source
io_load_profiles_v4_pure_read_no_write
state_manager_save_queue_dirty_retry
state_manager_apply_settings_background_owned_revision
nanah_apply_incoming_forces_runtime_refresh
import_v3_dry_run_mutation_report
render_engine_row_action_list_mode_profile_contract
popup_tab_list_mode_toggle_contract_parity
ui_listener_idempotent_init
content_controls_catalog_keys_match_state_settings_runtime
```

## Audit Boundary

This pass improves callable accounting, but it does not yet prove every UI
interaction. It proves that the UI/settings surface is now named, counted, and
connected to the existing split-authority findings. The complete goal still
requires method-level fixtures for each exported action and every high-impact
user workflow.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this profile/settings/UI surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 71
method semantic proof gap lexical callables covered: 6086
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6086
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
