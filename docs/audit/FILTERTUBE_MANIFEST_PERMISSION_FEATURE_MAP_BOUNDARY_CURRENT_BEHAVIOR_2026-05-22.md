# FilterTube Manifest Permission Feature Map Boundary - 2026-05-22

Status: audit-only current-behavior proof. Runtime behavior is unchanged.
This is not an implementation patch, manifest patch, build-validation patch,
trusted-sender patch, permission-pruning patch, host-scope patch, or
optimization patch.

## Scope

This slice maps the current browser manifest permission declarations to the
runtime feature owners that consume those permissions: storage, tabs,
scripting, downloads, active tab access, host permissions, content-script
matches, web-accessible resource matches, and build-time manifest validation.

It extends the open manifest/permission, tracked-file, runtime lifecycle,
message trust, external navigation, release/static/native, storage/cache,
settings-mode, reliability, false-hide/leak, performance, code-burden,
cross-feature, JSON-first filter readiness, source/evidence, and
implementation-change rows. It keeps the implementation gate closed.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Source Fingerprints

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `manifest.json` | 88 | 2513 | `282bbf5f84819af6af4edcab1c7a21f16c1f6f50501492226c1065125c287734` |
| `manifest.chrome.json` | 88 | 2513 | `282bbf5f84819af6af4edcab1c7a21f16c1f6f50501492226c1065125c287734` |
| `manifest.firefox.json` | 75 | 2029 | `c84368c9db6a4900bb6ff055b66a645a88176d3533e307eee0dcb8d230fae2bb` |
| `manifest.opera.json` | 89 | 2518 | `0f0b77df312bf8b45a40e652bd7fc4ee4af270945b4e38e9353ebfdc1caf1e2b` |
| `js/background.js` | 6789 | 306239 | `618e41011a6031c7a4eb3d022c4612536942a7a58a3c41eb0fd7e31c29a60311` |
| `js/io_manager.js` | 2030 | 96914 | `d04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21` |
| `js/tab-view.js` | 14926 | 695872 | `5cdae945aca165b11af3c3f9fc246e89da3ce6780939013081e5d035b4163323` |
| `js/popup.js` | 1841 | 75587 | `cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/content/bridge_injection.js` | 127 | 4741 | `d1b84cf4c43ec5ff5cdc3bd607d8f3d3bf448c12829780b0d05fb9fc14fb5d3e` |
| `js/content/bridge_settings.js` | 1113 | 44087 | `f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853` |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/handle_resolver.js` | 282 | 9785 | `67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff` |
| `build.js` | 740 | 26978 | `c8485cb2600aad89f44015cd7e49ebe4746ebcc35c91c1ff2bf29aec2f087a04` |

## Permission Feature Map

Manifest permission feature-map source/effect blocks: 8.

| Boundary | Current behavior | Risk before permission or optimization changes |
| --- | --- | --- |
| Manifest declarations | All four manifests declare exactly `storage`, `activeTab`, `scripting`, `tabs`, and `downloads`. | Permission removal or browser-specific drift can break unrelated features because there is no per-feature owner report. |
| Host permissions | All four manifests host-permit `*.youtube.com`, `*.youtube-nocookie.com`, and `*.youtubekids.com`. | `youtube-nocookie.com` is host-permitted but no content script or web-accessible resource match covers it, so host permission is broader than active runtime coverage. |
| Storage consumers | Runtime permission API callsites span background, StateManager, shared settings, content bridge, content bridge settings, handle resolver, IO, and tab-view storage paths. | Settings, profiles, stats, maps, cache invalidation, import/export, and content repair share one manifest permission without a feature owner matrix. |
| Tabs consumers | Background, popup, tab-view, and StateManager use tabs query, create, update, and sendMessage APIs. | Prompt injection, refresh propagation, dashboard/open-tab behavior, and active YouTube tab detection share one permission without sender-class ownership. |
| Scripting consumers | Background injects first-run/update prompts, MAIN-world scripts, and subscription import bridge files; bridge injection requests scripting-backed injection when not Firefox. | MAIN/ISOLATED injection policy is split between manifest load order, content bridge requesters, and background message handlers. |
| Downloads consumers | Background, IO manager, and tab-view use downloads API flows for auto-backup, manual backup/export, cleanup/rotation, and fallback handling. | Backup retention and user exports share permission with no download owner report or retention policy artifact. |
| `activeTab` declaration | `activeTab` appears in all four manifests and has 0 product runtime callsite tokens in the scanned source set. | The declaration may be intended for implicit tab/scripting affordances, but current code has no named active-tab use report. |
| Build validation | `build.js` calls `ensureCollabDialogScriptOrder()` but has no manifest permission, host, web-resource, or world validator. | Package builds can copy permission drift unless future validation gates reject it before release. |

## Selected Counts

- Runtime permission consumer source files: 10.
- Broad runtime permission API tokens in those files: 145.
- Manifest `activeTab` tokens: 4.
- Product runtime `activeTab` tokens in scanned source files: 0.
- Runtime `storage` API tokens: 56.
- Runtime `storage.local.get` tokens: 18.
- Runtime `storage.local.set` tokens: 28.
- Runtime `storage.onChanged` tokens: 4.
- Runtime `tabs` API tokens: 61.
- Runtime `tabs.query` tokens: 17.
- Runtime `tabs.sendMessage` tokens: 5.
- Runtime `tabs.create` tokens: 10.
- Runtime `tabs.update` tokens: 1.
- Runtime `scripting.executeScript` tokens: 9.
- Runtime `downloads` API tokens: 17.
- Runtime `downloads.download` tokens: 8.
- Runtime `downloads.search` tokens: 3.
- Runtime `downloads.erase` tokens: 3.
- Build `ensureCollabDialogScriptOrder` tokens: 2.
- Build `validateManifestPermissions` tokens: 0.
- Runtime manifest permission feature-map fixtures: 7.

## Current Behavior

The current permission set is consistent across browser manifests, but the
runtime feature owners are not first-class:

- `storage` backs settings/profile persistence, compiled cache refresh,
  statistics, channel maps, content identity repair, import/export, and
  bridge-driven settings updates.
- `tabs` backs active YouTube tab lookup, popup/dashboard navigation, tab
  refresh propagation, tab messaging, and open-tab reuse.
- `scripting` backs prompt injection, MAIN-world script injection, and
  subscription import bridge injection.
- `downloads` backs auto-backup, backup rotation, encrypted/plain exports,
  manual file saves, and browser-specific download fallbacks.
- `activeTab` is declared in manifests but is not represented by a named
  product runtime callsite in the scanned sources.
- Host permissions include `youtube-nocookie.com`, but content scripts and
  web-accessible resources match only `*.youtube.com` and
  `*.youtubekids.com`.
- Build validation currently repairs collaboration dialog script order only;
  it does not reject permission, host, web-accessible resource, or content
  script world drift.

## Runtime Fixture Results

- All four manifests still declare the same five permission strings.
- All four manifests still declare the same three host permission patterns.
- Content-script and web-accessible resource matches still exclude
  `youtube-nocookie.com`.
- Runtime source contains 10 files with storage/tabs/scripting/downloads API
  callsites.
- Runtime source contains no `activeTab` token outside manifests.
- Runtime source has storage, tabs, scripting, and downloads consumers in
  multiple feature families rather than one permission feature map.
- Product source still lacks manifest permission feature-map authority symbols.

## Risks

- Reliability: permission declarations are shared by prompt injection, backup,
  dashboard navigation, storage migration, content settings, and profile/cache
  refresh without a checked owner map.
- False-hide/leak: host and scripting drift can create surfaces that are
  permitted but not actively filtered, or actively injected without clear
  sender-class proof.
- Performance: tabs, scripting, storage, and downloads work can be triggered by
  unrelated feature flows without a no-work budget tied to permission use.
- Code burden: browser manifests, build packaging, background handlers, content
  bridges, popup, tab-view, IO, and StateManager each carry permission-specific
  assumptions that future cleanup must reconcile.

## Future Proof Required Before Behavior Changes

Before pruning permissions, changing host patterns, changing content-script
matches, changing MAIN/ISOLATED injection, moving backup/download behavior,
or optimizing tab/storage work, add fixture-backed reports for:

```text
manifestPermissionFeatureMapContract
manifestPermissionFeatureOwnerReport
manifestStoragePermissionOwnerReport
manifestTabsPermissionOwnerReport
manifestScriptingPermissionOwnerReport
manifestDownloadsPermissionOwnerReport
manifestActiveTabPermissionUseReport
manifestHostPermissionScopeReport
manifestPermissionTrustedSenderMatrix
manifestPermissionBuildValidationReport
manifestPermissionFixtureProvenance
manifestPermissionMetricArtifact
```

No `manifestPermissionFeatureMapContract`,
`manifestPermissionFeatureOwnerReport`,
`manifestStoragePermissionOwnerReport`,
`manifestTabsPermissionOwnerReport`,
`manifestScriptingPermissionOwnerReport`,
`manifestDownloadsPermissionOwnerReport`,
`manifestActiveTabPermissionUseReport`,
`manifestHostPermissionScopeReport`,
`manifestPermissionTrustedSenderMatrix`,
`manifestPermissionBuildValidationReport`,
`manifestPermissionFixtureProvenance`, or
`manifestPermissionMetricArtifact` exists in product runtime source yet.
