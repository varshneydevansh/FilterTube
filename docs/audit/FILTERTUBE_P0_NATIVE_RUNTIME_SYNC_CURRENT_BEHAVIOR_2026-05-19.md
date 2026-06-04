# FilterTube P0 Native Runtime Sync Current Behavior - 2026-05-19

Status: current-behavior audit only. This file does not change extension
runtime behavior, Android assets, iOS resources, native app build output,
YouTube Kids behavior, Nanah, release packaging, or public website claims.

This slice converts the named P0 native runtime sync family into runnable proof.
It exists because any extension filtering fix can fail on Android/iOS if the app
runtime copies are stale, generated outputs are hand-edited, or raw audit
captures are mistaken for native runtime source.

## Blocked Verdict

P0 native runtime sync authority is not green:

- The public repo only delegates sync to the sibling/private app repo.
- Manifest-listed source/destination copies are byte-identical today, but this
  is not a committed freshness manifest.
- Android and iOS generated Main runtime assets are build outputs, not source
  authority.
- iOS Kids runtime intentionally diverges from Android Kids runtime for WebKit
  phone-fit behavior.
- The broad app-side extension-source mirror currently has no hash drift, but
  it still needs to be reported separately from direct manifest copy freshness.
- Android has a documented prebuild sync dependency; iOS still needs an
  explicit release hash/sync gate.
- Ignored root capture files remain evidence-only and must not enter native
  app assets, generated runtime bundles, or public packages.

## Current Sync Flow

```text
public FilterTube repo
  |
  +--> scripts/sync-native-runtime.mjs
        |
        +--> FILTERTUBE_APP_REPO or ../FilterTubeApp
              |
              +--> tools/sync-runtime-from-extension.mjs
                    |
                    +--> tools/runtime-sync-manifest.json
                    +--> copied upstream runtime/UI/Nanah sources
                    +--> generated Android runtime assets
                    +--> generated iOS runtime resources
                    +--> extension-source mirror snapshot
```

## Current Behavior Fixtures

| Fixture | Current behavior pinned | Source proof | Future gate |
| --- | --- | --- | --- |
| `native_runtime_sync_public_wrapper_delegates_to_app_sync_script` | Public script resolves `FILTERTUBE_APP_REPO` or sibling `FilterTubeApp`, then runs the app sync script. | `scripts/sync-native-runtime.mjs`; P0 test | Wrapper should record app repo revision and sync command output. |
| `native_runtime_sync_manifest_sources_exist_and_are_public_repo_owned` | App manifest has 28 source entries owned by `/Users/devanshvarshney/FilterTube`; all sources and destinations exist. | App `runtime-sync-manifest.json`; P0 test | Add a committed freshness manifest with source repo revision and destination hashes. |
| `native_runtime_sync_manifest_destinations_are_byte_identical_after_sync` | Direct manifest copy destinations are byte-identical to public repo sources today. | P0 test | Keep direct copies byte-identical unless explicitly classified as generated or divergent. |
| `native_runtime_sync_generated_main_assets_are_not_source_authority` | Android/iOS Main runtime assets are large generated outputs and are not byte-identical source files. | App assets/resources; P0 test | Record generated-from list, source hashes, output hashes, and build command. |
| `native_runtime_sync_ios_kids_runtime_documents_intentional_divergence` | iOS Kids runtime contains iOS WebKit phone-fit behavior absent from Android Kids runtime. | App Kids runtime assets; P0 test | Record intentional divergence reason and watch-DOM non-touch invariant. |
| `native_runtime_sync_extension_source_mirror_drift_is_detected` | Broad `packages/extension-source/upstream` mirror currently reports zero hash-different files. | App mirror; P0 test | Mirror claims need explicit freshness status instead of relying on direct-copy freshness. |
| `native_runtime_sync_android_has_prebuild_freshness_but_ios_needs_release_gate` | Android docs state a `preBuild` sync dependency; iOS docs state manual sync is still required. | App docs; P0 test | Add iOS build-phase or release checklist hash gate before iOS release. |
| `native_runtime_sync_raw_root_captures_never_become_app_runtime_inputs` | Ignored root captures are absent from manifest sources/destinations and native runtime inputs. | `.gitignore`; app manifest; P0 test | Keep raw captures as evidence only; use minimal extracted fixtures for tests. |
| `native_runtime_sync_future_authority_token_is_absent_from_product_source` | Product source has no `nativeRuntimeSyncAuthority` implementation today. | P0 test | Add the authority record before app release/runtime sync changes. |

## Future Contract Before Native Sync Changes

Future token: `nativeRuntimeSyncAuthority`

```text
nativeRuntimeSyncAuthority.record({
  sourceRevision,
  appRepoRevision,
  sourcePath,
  destinationPath,
  destinationKind,
  generatedFrom,
  platform,
  hash,
  sizeBytes,
  syncCommand,
  syncRequiredBeforeBuild,
  freshnessStatus,
  intentionalDivergenceReason,
  rawCaptureInputAllowed
})
```

Minimum proof before changing native runtime sync:

- Every manifest source and destination has source repo, app repo, hash, size,
  and destination-kind metadata.
- Generated Android/iOS outputs list the exact upstream files used to build
  them.
- iOS Kids divergence is recorded as intentional and does not rewrite YouTube
  Kids watch/player DOM.
- Extension-source mirror drift status is reported separately from direct
  manifest copy freshness, even when the current drift count is zero.
- Android and iOS release builds both have freshness gates.
- Raw root captures remain evidence-only and never become app assets, generated
  runtime inputs, website public files, or package contents.

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
