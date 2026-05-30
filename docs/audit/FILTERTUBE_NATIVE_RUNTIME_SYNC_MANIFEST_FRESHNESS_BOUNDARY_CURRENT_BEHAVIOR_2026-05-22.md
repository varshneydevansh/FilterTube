# FilterTube Native Runtime Sync Manifest Freshness Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior proof. Runtime, build, package, website,
and native app sync behavior are unchanged.

This slice deepens the native sync wrapper audit into the sibling app manifest
and generated runtime freshness boundary. It confirms the current work is still
codebase inspection: the audit is finding native parity, optimization, and
first-class JSON filter blockers before any runtime or app release behavior
changes.

## Source Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `scripts/sync-native-runtime.mjs` | 34 | 1070 | `4f46c13bf6099092193712790d231ff4809b00b1b0061d04af71ac3ba6bf21c6` |
| `/Users/devanshvarshney/FilterTubeApp/tools/sync-runtime-from-extension.mjs` | 1758 | 76587 | `d48bdc271f707f0f960ac8a6b0d2712a602fb6c84a8c2bf2e0a138d112f9ba8e` |
| `/Users/devanshvarshney/FilterTubeApp/tools/runtime-sync-manifest.json` | 198 | 8178 | `e899e29d946270865750b8f6415c298a92da6b4e1917367b6a174afe2a0c6583` |
| `data/release_notes.json` | 316 | 23047 | `c9c860f17dae9f9f9e8d1536d3c0de72dd3b6bd917fc8d7fc725047adc421862` |
| `/Users/devanshvarshney/FilterTubeApp/apps/android/app/src/main/assets/extension_shell/data/release_notes.json` | 301 | 21095 | `911628cbd7f6354c58aa82064f3ef1f29cda3904a87e3ea263534600a0880737` |
| `/Users/devanshvarshney/FilterTubeApp/apps/ios/FilterTube/Resources/release_notes.json` | 301 | 21095 | `911628cbd7f6354c58aa82064f3ef1f29cda3904a87e3ea263534600a0880737` |

## Current Manifest And Copy Facts

```text
public repo HEAD: 7f0e66641aa576fb264085baf59949244ea32291
app repo HEAD: cfc651cd4294e528c2c371778d7698ce82e94a71
app dirty tracked paths: 46
app dirty paths:
- apps/android/app/src/debug/java/com/filtertube/app/DebugNativeOwnedKidsActivity.kt
- apps/android/app/src/main/assets/filtertube_nanah/nanah_sync_adapter.js
- apps/android/app/src/main/assets/filtertube_runtime_full.js
- apps/android/app/src/main/java/com/filtertube/app/AppLaunchRouter.kt
- apps/android/app/src/main/java/com/filtertube/app/LauncherActivity.kt
- apps/android/app/src/main/java/com/filtertube/app/ManagedWebViewActivity.kt
- apps/android/app/src/main/java/com/filtertube/app/NativeOwnedMainPlaybackBridgeFallback.kt
- apps/android/app/src/main/java/com/filtertube/app/NativeOwnedPreviewEntryPoint.kt
- apps/android/app/src/main/java/com/filtertube/app/ProfileViewingAccess.kt
- apps/android/app/src/main/java/com/filtertube/app/ViewingLaunchCoordinator.kt
- apps/android/app/src/main/java/com/filtertube/app/ViewingSpaceChooserPolicy.kt
- apps/android/app/src/main/java/com/filtertube/app/ViewingTargetAccessUiState.kt
- apps/android/app/src/main/java/com/filtertube/app/ViewingTargetLaunchPolicy.kt
- apps/android/app/src/test/java/com/filtertube/app/AppLaunchRouterTest.kt
- apps/android/app/src/test/java/com/filtertube/app/NativeOwnedMainPlaybackBridgeFallbackTest.kt
- apps/android/app/src/test/java/com/filtertube/app/NativeOwnedPreviewEntryPointTest.kt
- apps/android/app/src/test/java/com/filtertube/app/ProfileViewingAccessTest.kt
- apps/android/app/src/test/java/com/filtertube/app/ViewingSpaceChooserPolicyTest.kt
- apps/android/app/src/test/java/com/filtertube/app/ViewingTargetAccessUiStateTest.kt
- apps/android/app/src/test/java/com/filtertube/app/ViewingTargetLaunchPolicyTest.kt
- apps/ios/FilterTube/Resources/filtertube_nanah/nanah_sync_adapter.js
- apps/ios/FilterTube/Resources/filtertube_runtime_full.js
- packages/extension-source/upstream/css/serene-shell.css
- packages/extension-source/upstream/html/tab-view.html
- packages/extension-source/upstream/js/background.js
- packages/extension-source/upstream/js/content/block_channel.js
- packages/extension-source/upstream/js/content/bridge_settings.js
- packages/extension-source/upstream/js/content/collab_dialog.js
- packages/extension-source/upstream/js/content/dom_fallback.js
- packages/extension-source/upstream/js/content_bridge.js
- packages/extension-source/upstream/js/injector.js
- packages/extension-source/upstream/js/io_manager.js
- packages/extension-source/upstream/js/nanah_sync_adapter.js
- packages/extension-source/upstream/js/seed.js
- packages/extension-source/upstream/js/settings_shared.js
- packages/extension-source/upstream/js/state_manager.js
- packages/extension-ui/src/upstream/io_manager.js
- packages/extension-ui/src/upstream/settings_shared.js
- packages/extension-ui/src/upstream/state_manager.js
- packages/runtime-adapters/src/upstream/block_channel.js
- packages/runtime-adapters/src/upstream/collab_dialog.js
- packages/runtime-adapters/src/upstream/dom_fallback.js
- packages/runtime-bridge/src/upstream/bridge_settings.js
- packages/runtime-bridge/src/upstream/content_bridge.js
- packages/runtime-bridge/src/upstream/injector.js
- packages/runtime-bridge/src/upstream/seed.js
runtime sync manifest entries: 28
manifest source repos: /Users/devanshvarshney/FilterTube
manifest sync modes: copy
manifest destinationKind fields present: 0
manifest entries missing destinationKind: 28
manifest includes js/layout.js: yes
manifest includes data/release_notes.json: no
runtimeBundleOrder entries: 15
runtimeBundleOrder includes js/layout.js: yes
source mirror dirs: js, html, css
direct manifest copy sources present: 28
direct manifest copy destinations present: 28
direct manifest source/destination hash matches: 28
direct manifest source/destination hash mismatches: 0
extension-source mirror files compared: 43
extension-source mirror hash matches: 43
extension-source mirror hash mismatches: 0
runtime behavior changed: no
```

Manifest destination roots:

| Destination root | Entries |
| --- | ---: |
| `apps/android` | 3 |
| `packages/extension-ui` | 8 |
| `packages/runtime-adapters` | 11 |
| `packages/runtime-bridge` | 5 |
| `packages/runtime-core` | 1 |

## Generated App Runtime Artifacts

| Artifact | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `apps/android/app/src/main/assets/filtertube_runtime_full.js` | 35747 | 1574364 | `df82c9ddfc77bbed1025741222d0468e55c760e3376a2cedc5fc45bc651787c6` |
| `apps/android/app/src/main/assets/filtertube_kids_runtime.js` | 370 | 13153 | `05b47e2310222a68ba5356cbf6dca24b507aa225bfbe6e971c2a4819d647b711` |
| `apps/ios/FilterTube/Resources/filtertube_runtime_full.js` | 35746 | 1572701 | `f146e2284af6429c8a30c87406ae30dce6e69003f64e9082aa459194df81fae2` |
| `apps/ios/FilterTube/Resources/filtertube_kids_runtime.js` | 575 | 20835 | `3f279f275bf93cca6385df6c8d0422a51c533c26cbd29ddd5d9ea5655efc7340` |
| `apps/android/app/src/main/assets/filtertube_nanah_engine.html` | 875 | 34907 | `e63d29f43a5c94790a665bfda985071b26b530dd7b532cdb66f0cd3d27a1a93e` |
| `apps/ios/FilterTube/Resources/filtertube_nanah_engine.html` | 875 | 34899 | `84df57dacdaaf394e47864cc7a70ed5185e7547b693afbe69a363811f787112d` |

## Current Boundary

The direct manifest copy rows currently match the public checkout byte-for-byte,
and the broad app source mirror currently matches `js`, `html`, and `css`
source files byte-for-byte. That is useful evidence, but it is not a release
freshness authority. The app worktree is dirty, generated runtime assets are
derived by the app-side script, and no emitted report ties source revision,
manifest hash, destination hash, generated runtime hash, app revision, and
release artifacts together.

Release notes also remain outside the direct runtime sync manifest. The public
`data/release_notes.json` file has 316 lines and hash
`c9c860f17dae9f9f9e8d1536d3c0de72dd3b6bd917fc8d7fc725047adc421862`, while
the current Android/iOS native release-note resources have 301 lines and hash
`911628cbd7f6354c58aa82064f3ef1f29cda3904a87e3ea263534600a0880737`.

## Risk Notes

Reliability risk is concentrated in freshness reporting. A direct-copy equality
check can pass while the app worktree remains dirty and generated assets are
not tied to a machine-readable sync report.

False-hide/leak risk matters because `runtimeBundleOrder` includes JSON
filtering, DOM fallback, quick-block, collaborator, injector, content bridge,
and quarantined `js/layout.js` code. A future first-class JSON filter change
can be correct in the extension but stale, mixed, or over-broad in native assets
without manifest and generated-runtime proof.

Performance and code-burden risk come from split ownership. The public wrapper
delegates; the app script copies direct manifest entries, mirrors broad source
trees, adapts Android/iOS runtime bundles, patches iOS Kids runtime code, and
copies Nanah/release-note resources. Those effects need a single report before
release, pruning, or optimization claims can rely on native parity.

## Missing Future Authority

No `nativeRuntimeSyncManifestFreshnessContract`,
`nativeRuntimeSyncDirectCopyHashReport`,
`nativeRuntimeSyncGeneratedRuntimeHashReport`,
`nativeRuntimeSyncAppDirtyStateReport`,
`nativeRuntimeSyncReleaseNotesParityReport`,
`nativeRuntimeSyncDestinationKindManifest`,
`nativeRuntimeSyncSourceMirrorReport`,
`nativeRuntimeSyncRuntimeBundleOrderGate`,
`nativeRuntimeSyncLayoutQuarantineGate`, or
`nativeRuntimeSyncFirstClassJsonParityGate` exists in the public wrapper,
package file, build script, app sync script, or current app runtime manifest
yet.

## Required Proof Before Behavior Changes

Future native sync, JSON-first filtering, DOM fallback pruning, release, or app
runtime changes need:

- a sync report containing public repo revision, public dirty state, app repo
  revision, app dirty state, manifest hash, and sync command result;
- per-entry source hash, destination hash, destination kind, sync mode, and
  generated-output participation metadata;
- generated Android/iOS runtime hashes after app-side adaptation, with
  `runtimeBundleOrder` and layout-quarantine decisions recorded;
- release-note parity proof or an intentional native divergence record;
- negative drift fixtures for missing app repo, missing manifest row, stale
  destination, stale source mirror, stale generated runtime, and release-note
  mismatch;
- native parity gates for first-class JSON filtering, DOM fallback parity,
  quick-block/menu behavior, learned identity, Nanah sync, and app release
  public claims.

Executable proof for this current boundary lives in:

```bash
node --test tests/runtime/native-runtime-sync-manifest-freshness-boundary-current-behavior.test.mjs
```

## First Optimization Rollback Unclaimed Surface Boundary Addendum

First optimization rollback unclaimed surface boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-rollback-unclaimed-surface-boundary-current-behavior.test.mjs`
isolates rollback, unclaimed-surface, native sync, release package,
raw-capture, diagnostic performance, and public-claim limits before any
metric-foundation artifact is committed or runtime behavior changes. The
addendum pins 12 rollback/unclaimed boundary rows, 8 release/native/public
source docs covered, 0 committed rollback/unclaimed artifacts, 0 runtime
rollback approvals, 0 runtime unclaimed-surface approvals, 0 runtime metric
collector approvals, 0 implementation-ready rollback/unclaimed rows, expected
runtime audit tests 4457, expected runtime audit pass: 4457, and expected
runtime audit fail 0. It keeps JSON-first, whitelist, collector, native,
release, and public claim work blocked until measured surfaces, unclaimed
surfaces, rollback command, artifact absence, authority absence, raw-capture
exclusion, and release/public claim limits are proved.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this native/runtime sync and overlay surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, native runtime sync behavior, native overlay
quiet-mode behavior, whitelist behavior, metric collectors, artifact creation,
release package changes, or public claims.
