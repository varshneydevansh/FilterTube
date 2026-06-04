# FilterTube Native Runtime Sync Manifest Freshness Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior proof. Extension runtime, build, package,
and website behavior are unchanged by this proof; the sibling native app mirror
has been synced to the current extension sources.

This slice deepens the native sync wrapper audit into the sibling app manifest
and generated runtime freshness boundary. It confirms the current work is still
codebase inspection: the audit is finding native parity, optimization, and
first-class JSON filter blockers before any runtime or app release behavior
changes.

## Source Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `scripts/sync-native-runtime.mjs` | 34 | 1070 | `4f46c13bf6099092193712790d231ff4809b00b1b0061d04af71ac3ba6bf21c6` |
| `/Users/devanshvarshney/FilterTubeApp/tools/sync-runtime-from-extension.mjs` | 2288 | 109519 | `1cd84715cb370b0935abeadc88bbb7285a16a097561e510d1eb3572928a394ae` |
| `/Users/devanshvarshney/FilterTubeApp/tools/runtime-sync-manifest.json` | 226 | 9654 | `f08e48f7e329fd7ac22b9c3b990f3c53771f356d6f8cbe2ebe5fe51226b5b540` |
| `data/release_notes.json` | 317 | 23020 | `a8d59b18e9bffd1c828538ee58b3b8e9be7c641fea3ff064220311485a3b1c6b` |
| `/Users/devanshvarshney/FilterTubeApp/apps/android/app/src/main/assets/extension_shell/data/release_notes.json` | 301 | 21095 | `911628cbd7f6354c58aa82064f3ef1f29cda3904a87e3ea263534600a0880737` |
| `/Users/devanshvarshney/FilterTubeApp/apps/ios/FilterTube/Resources/release_notes.json` | 301 | 21095 | `911628cbd7f6354c58aa82064f3ef1f29cda3904a87e3ea263534600a0880737` |

## Current Manifest And Copy Facts

```text
public repo HEAD: 7f0e66641aa576fb264085baf59949244ea32291
app repo HEAD: cfc651cd4294e528c2c371778d7698ce82e94a71
app dirty state authority: not pinned by this contract-copy slice
app dirty paths: out-of-scope native app changes may exist and are not release freshness proof
runtime sync manifest entries: 32
manifest source repos: /Users/devanshvarshney/FilterTube
manifest sync modes: copy
manifest destinationKind fields present: 0
manifest entries missing destinationKind: 32
manifest includes js/layout.js: yes
manifest includes data/release_notes.json: no
runtimeBundleOrder entries: 16
runtimeBundleOrder includes js/layout.js: yes
source mirror dirs: js, html, css
direct manifest copy sources present: 32
direct manifest copy destinations present: 32
direct manifest source/destination hash matches: 32
direct manifest source/destination hash mismatches: 0
extension-source mirror files compared: 46
extension-source mirror files present: 46
extension-source mirror hash matches: 46
extension-source mirror missing files: 0
extension-source mirror hash mismatches: 0
runtime behavior changed: no
```

Manifest destination roots:

| Destination root | Entries |
| --- | ---: |
| `apps/android` | 3 |
| `packages/extension-source` | 2 |
| `packages/extension-ui` | 8 |
| `packages/managed-policy-contract` | 1 |
| `packages/runtime-adapters` | 12 |
| `packages/runtime-bridge` | 5 |
| `packages/runtime-core` | 1 |

## Generated App Runtime Artifacts

| Artifact | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `apps/android/app/src/main/assets/filtertube_runtime_full.js` | 37213 | 1634163 | `4b0681ed60b3c9f80be10a0e46582e3c832ea9d287e6909995b3a9a5b79692d7` |
| `apps/android/app/src/main/assets/filtertube_kids_runtime.js` | 370 | 13153 | `05b47e2310222a68ba5356cbf6dca24b507aa225bfbe6e971c2a4819d647b711` |
| `apps/ios/FilterTube/Resources/filtertube_runtime_full.js` | 37213 | 1632501 | `6955e1934822b49222555fb201be9f18976610ddcc1855b0159e7bb3d7da567a` |
| `apps/ios/FilterTube/Resources/filtertube_kids_runtime.js` | 575 | 20835 | `3f279f275bf93cca6385df6c8d0422a51c533c26cbd29ddd5d9ea5655efc7340` |
| `apps/android/app/src/main/assets/filtertube_nanah_engine.html` | 875 | 34907 | `e63d29f43a5c94790a665bfda985071b26b530dd7b532cdb66f0cd3d27a1a93e` |
| `apps/ios/FilterTube/Resources/filtertube_nanah_engine.html` | 875 | 34899 | `84df57dacdaaf394e47864cc7a70ed5185e7547b693afbe69a363811f787112d` |

## Current Boundary

All manifest-listed direct copy rows, the managed app policy contract row, the
two managed Nanah helper source rows, and the broader extension-source mirror
currently match the public checkout byte-for-byte.

That is useful freshness evidence, but it is still not a release freshness
authority. Generated runtime assets are derived by the app-side script, and no
emitted report ties source revision, manifest hash, destination hash, generated
runtime hash, app revision, and release artifacts together.

Release notes also remain outside the direct runtime sync manifest. The public
`data/release_notes.json` file has 317 lines and hash
`a8d59b18e9bffd1c828538ee58b3b8e9be7c641fea3ff064220311485a3b1c6b`, while
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
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, native runtime sync behavior, native overlay
quiet-mode behavior, whitelist behavior, metric collectors, artifact creation,
release package changes, or public claims.
