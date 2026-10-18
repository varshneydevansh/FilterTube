# FilterTube Release Build Artifact Claim Boundary - Current Behavior - 2026-05-22

Status: current-behavior proof with a 2026-06-01 build prompt guard addendum.
Extension runtime behavior is unchanged; release build prompt behavior changed.

This slice ties together build/package output, release publication, README
public copy, browser manifest versions, staged release-note data, mobile
artifact staging, and the public first-class JSON filter claim boundary.

It confirms the current work is codebase inspection: the audit is finding
future optimization locations and first-class JSON filter blockers before any
runtime, release, package, README, website, or generated artifact behavior
changes.

## Source Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `build.js` | 861 | 33225 | `a198cc1d0bf98e410deb8f66ced0e56a046bbf987a0a5b878e1278577622fb2e` |
| `package.json` | 86 | 4580 | `c9cb2c3c4fea302fa3946f462dbfbb474381a78946ca59adb653814d06a4de51` |
| `README.md` | 456 | 28669 | `bb4374abbe82478e01a6653f26be3149824c0efd6aaf75c2095d4611b1ee67d6` |
| `CHANGELOG.md` | 938 | 75511 | `e57906dca95911874ef251aa45d8c3a76df00df576b36277d9c0e9b9654c3036` |
| `manifest.json` | 154 | 5204 | `d8dea8d10e715d01bab25ea12ff6fc3055d403f2486654fcb6907f94bd4f4627` |
| `manifest.chrome.json` | 154 | 5204 | `d8dea8d10e715d01bab25ea12ff6fc3055d403f2486654fcb6907f94bd4f4627` |
| `manifest.firefox.json` | 128 | 4138 | `2c0fe680fe1d204250ce687ef29c00767d3ff6269024a410da5c9fccff4ebf79` |
| `manifest.opera.json` | 162 | 5393 | `a7c541876ed54303d3a21613f5eaacbef536d694bf6061da207456eca476fce1` |
| `data/release_notes.json` | 433 | 37594 | `9132b2e8809c5e1f01bf5715a115105f62387318b422ad681c0ef6a1be63c7f9` |

## Source And Effect Blocks

| Block | Start line | Lines | Bytes | Current boundary |
| --- | ---: | ---: | ---: | --- |
| `buildConfig` | 29 | 46 | 2153 | Build targets, package roots, common files, mobile artifact regex, mobile artifact source directories, and text LoC file families are local constants. |
| `mainBuildFlow` | 93 | 100 | 3705 | Normal build regenerates extension UI shells, mutates README badges, optionally cleans `dist`, copies broad package roots, writes browser manifest output, creates ZIPs, and then enters optional mobile/release paths. |
| `manifestOrderRepair` | 193 | 22 | 858 | Manifest repair only enforces `js/content/collab_dialog.js` before `js/content_bridge.js`; it does not validate permissions, hosts, web-accessible resources, versions, or JSON-first startup readiness. |
| `createZip` | 215 | 33 | 981 | ZIP creation archives all target-directory files except OS junk and does not emit a browser ZIP checksum or package manifest. |
| `mobileArtifacts` | 248 | 90 | 4332 | Android APK/AAB staging is opt-in through CLI/env/prompt, filters by filename regex and package version, copies artifacts into `dist/mobile`, and writes per-file `.sha256` outputs. |
| `mobileArtifactPromptDir` | 338 | 12 | 314 | The interactive artifact directory answer now treats blank, `y`, `yes`, and `default` as the displayed default directory instead of a literal relative path. |
| `mobileArtifactDefaults` | 350 | 9 | 376 | Default mobile artifact source prefers the sibling app repo artifact directory when present, with local `release-artifacts/mobile` as fallback. |
| `mobileArtifactParsing` | 359 | 11 | 291 | Mobile artifact filenames are parsed into version, versionCode, variant, and extension fields. |
| `mobileArtifactSummary` | 370 | 35 | 1174 | Selected mobile artifacts are summarized for APK/AAB pair warnings. |
| `mobileSelectionChecksum` | 405 | 16 | 568 | Latest mobile artifact selection is Android versionCode based, and checksum calculation reads the staged artifact bytes. |
| `releasePromptPublish` | 445 | 85 | 3235 | Interactive release publication resolves GitHub CLI or environment credentials, creates a new draft or resumes an existing release, uploads missing assets and verifies all expected names before publishing only its own new draft. |
| `releaseBody` | 569 | 109 | 5480 | Release copy constructs browser ZIP links and optional Android links from naming conventions, not from verified uploaded assets. |
| `githubReleaseCreate` | 712 | 10 | 269 | GitHub CLI release creation uses `--draft`; this function does not publish. |
| `githubAssetUpload` | 732 | 11 | 353 | GitHub CLI uploads missing paths before final expected-name verification. Upload failure leaves a new draft unpublished; no delete/rollback path exists. |
| `readmeBadges` | 777 | 63 | 2355 | README badge mutation uses `git ls-files`, counts text-like and JavaScript files, rewrites version/LoC badges, and treats failures as warnings. |

## Current Cross-Surface Facts

```text
release build artifact boundary source files: 9
release build artifact source/effect blocks: 15
browser package version: 3.4.1
package.json version: 3.4.1
newest release-note version: 3.4.1
release note data entries: 31
release note version rows: 30
package source directories: _locales, js, css, html, icons, data, assets
package common files: README.md, CHANGELOG.md, LICENSE
npm build scripts: build, build:chrome, build:firefox, build:opera
browser ZIP checksum writer: absent
release package manifest: absent
public claim manifest: absent
artifact manifest: absent
mobile artifact prompt y/default input: default directory
public release rollback/delete path: absent
build prompt behavior changed: yes
runtime behavior changed: no
```

README public copy currently claims:

- `filtertube.in/downloads` is the download hub for browser releases, Android
  phone/tablet builds, and future store links.
- Large Blocklist Matching uses shared set-backed indexes so 200+ saved
  channels do not create renderer-by-renderer scan costs.
- JSON-backed surfaces can be filtered before paint when YouTube exposes the
  needed fields.
- Current audit work is tightening no-rule, route, lifecycle, and resolver
  budgets.

Those claims are useful direction for users and maintainers, but they are not a
release artifact gate. The build/release boundary still needs executable proof
that public download links, ZIP contents, Android artifacts, checksums, signing
identity, browser manifest parity, generated UI freshness, and JSON-first
runtime claims all match the exact release output.

## 2026-07-02 Managed Sync Release Claim Addendum

`docs/audit/FILTERTUBE_MANAGED_SYNC_RELEASE_CLOSEOUT_2026-07-02.md` is the
current claim boundary for Family Device Updates and managed pickup delivery.

For release packaging and public wording:

- OK: claim live `Send Update` for verified devices open together.
- OK: claim optional `Internet Pickup` for a parent/admin configured HTTPS
  pickup service.
- OK: claim optional `Home Pickup` for a parent/admin configured same-network
  pickup service.
- OK: claim protected devices keep the last accepted policy if no newer valid
  signed update is reachable.
- NO-GO: claim automatic LAN peer discovery.
- NO-GO: claim hosted FilterTube Internet Pickup ownership without a provider
  ownership artifact.

## 2026-07-05 MVP App Artifact Reuse Addendum

`build.js` now keeps version-matched Android attachment as the default, but
supports an explicit `FILTERTUBE_MOBILE_ARTIFACT_VERSION` or
`--mobile-artifact-version=` override for intentional MVP app reuse. In
interactive release builds, if no Android app artifact matches the extension
version, the script can also show the existing app artifact versions and ask
whether to reuse the latest one.

Release-safe meaning:

- default release packaging still looks for Android artifacts matching the
  extension package version
- mismatched mobile artifacts require explicit operator input through env/CLI
  override or the interactive reuse prompt
- generated release copy names the exact APK/AAB files and states when an
  existing app build is reused for a newer extension release
- MVP app files must keep their real filename/version, for example
  `FilterTube-mobile-tablet-v3.3.2-code30312-debug.apk`
- no release may claim that a `v3.3.2-code30312` mobile artifact is a rebuilt
  `v3.3.5` app artifact
- NO-GO: claim native Android/iOS parity until native runtime sync and installed
  app smoke artifacts are complete.

This addendum changes release wording authority only. Runtime and build behavior
are unchanged.

## Current Risk Notes

New-release publication follows draft creation, upload and expected-name verification. Existing releases preserve visibility. Reliability risk remains in name-only verification: matching names do not establish matching bytes, signatures or an artifact manifest.

False-hide/leak risk is indirect. Broad directory packaging can ship inactive,
quarantined, generated, or stale files. That is not a live hide/restore effect
today, but it can become one if future manifest or runtime changes activate a
packaged file without package-family proof.

Performance and code-burden risk come from split authority. `npm run build`
does package work, generated UI work, README mutation, optional mobile staging,
and optional release publication from one script. That makes clean dry-run,
artifact comparison, and public-claim verification harder to reason about.

First-class JSON filter risk is public-copy drift. README copy says JSON-backed
surfaces can filter early and current audit work is tightening optimization
budgets, but promotion still needs per-path route/surface/list-mode decisions,
negative sibling fixtures, metric artifacts, and native/DOM parity proof.

## Missing Future Authority

No `releaseBuildArtifactClaimContract`, `releasePackageManifestAuthority`,
`releaseReadmeMutationGate`, `releaseDraftFirstGate`,
`releaseAssetUploadRollbackPlan`, `releaseMobileArtifactClaimGate`,
`releaseZipChecksumManifest`, `releaseGeneratedUiFreshnessGate`,
`releaseBrowserManifestParityReport`, `releasePublicClaimFixtureProvenance`, or
`releaseFirstClassJsonClaimGate` exists in product, build, website, or audit
runtime source yet.

## Required Proof Before Behavior Changes

Future release/build changes need:

- a generated package manifest for every ZIP path with source family,
  manifest-reference, web-accessible-resource, quarantine, size, hash, and
  generated-input metadata;
- browser ZIP checksums generated before public release creation;
- draft-first release publication with all asset uploads verified before the
  release becomes public;
- Android artifact proof for package name, signing fingerprint, release/debug
  channel, checksum, install test, and website/README claim linkage;
- README/public website claim IDs that map to exact artifacts or store URLs;
- generated UI freshness proof between extension shell inputs and packaged JS;
- browser manifest parity proof for permissions, host scope, content-script
  load order, and web-accessible resources;
- first-class JSON filter claim gates tied to runtime path, route, surface,
  list-mode, fixture, metric, and rollback proof.

Executable proof for this current boundary lives in:

```bash
node --test tests/runtime/release-build-artifact-claim-boundary-current-behavior.test.mjs
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
is a required source input before this release/package/public-claim surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6315
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6315
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

Historical compatibility snapshot retained for older current-behavior lanes:

```text
historical pre-managed-policy callable snapshot: 2026-05-25 through 2026-05-30
method semantic proof gap lexical callables covered: 5836
repo-wide lexical callables: 5836
lexical callables requiring semantic proof before behavior changes: 5836
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, release package behavior, public release
claims, prompt release overlays, raw-capture packaging, whitelist behavior,
metric collectors, artifact creation, native sync, or release publication.

## 2026-10-18 Workflow Review

The source/effect blocks and fingerprints above now describe the reviewed current workflow. Actual-orchestrator VM tests cover new draft creation/upload/verification/publication, preserved existing visibility, incomplete uploads and cancellation. No GitHub command or release was executed. The former public-before-upload behavior is historical, not the current contract. Expected asset names are verified; byte hashes, signing and native-device compatibility are separate gates.
