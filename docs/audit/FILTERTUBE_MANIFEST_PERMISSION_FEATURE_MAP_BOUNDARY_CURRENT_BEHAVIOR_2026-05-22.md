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
| `manifest.json` | 93 | 2654 | `95496eac74d72fd90491302211b7dc07f492ed405d4eb1a001b8b600a02bc16b` |
| `manifest.chrome.json` | 93 | 2654 | `95496eac74d72fd90491302211b7dc07f492ed405d4eb1a001b8b600a02bc16b` |
| `manifest.firefox.json` | 80 | 2150 | `8368c4b520a07d1e5d9647f6c141f06f8fbd24a92c8b053d722488859f201c32` |
| `manifest.opera.json` | 94 | 2659 | `f9a3b4182521d8b1594d7975c327daf772e418e4869e8e3d33d286bfb25b486e` |
| `js/background.js` | 7305 | 328748 | `80170fd6e70156fd26a047cd97dc6463850849c9c40c71c44096cc3c26ab367a` |
| `js/io_manager.js` | 2119 | 102123 | `d457bdcc4f7fc3acef401b48437fc707e2b9f2791e18ff4cafc1209f810bcc3c` |
| `js/tab-view.js` | 22700 | 1081906 | `5c088e40d3507cbdd0ad1fdf2a601f5e346fb87e527188192b86b9c598223f7f` |
| `js/popup.js` | 1841 | 75587 | `e04d512726b38b012d3866b829570b632dd784419db014447b6645a7a6f7fd1d` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/content/bridge_injection.js` | 152 | 6043 | `dcb84ff6f373b24951f9c1488c502987a599d70a54d14ac5f6e14d38b5bf7d9c` |
| `js/content/bridge_settings.js` | 1473 | 58402 | `bbee898990fd890385bcd723b2295611c20c23fee9642e8029489f756fbe73d2` |
| `js/content_bridge.js` | 13803 | 610592 | `cc838f9f12fc6941bba04b7a0244a14ef60581461bcc24dbb8ba7a9bce8e287b` |
| `js/settings_shared.js` | 1196 | 59725 | `2d4458a87dce945bf560123e54534854c52fe1de20ac5dae3e3b019bf7a37311` |
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
- Broad runtime permission API tokens in those files: 153.
- Manifest `activeTab` tokens: 4.
- Product runtime `activeTab` tokens in scanned source files: 0.
- Runtime `storage` API tokens: 60.
- Runtime `storage.local.get` tokens: 19.
- Runtime `storage.local.set` tokens: 31.
- Runtime `storage.onChanged` tokens: 4.
- Runtime `tabs` API tokens: 65.
- Runtime `tabs.query` tokens: 17.
- Runtime `tabs.sendMessage` tokens: 5.
- Runtime `tabs.create` tokens: 11.
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
