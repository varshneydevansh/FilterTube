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
| `README.md` | 456 | 28669 | `db3a973e936abd66a84ab7888e5f466fe7b0c1274f5b58aa999c4ea6b12fdbfd` |
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

## README Fingerprint Revalidation - 2026-10-22

The build-generated total-lines badge changed from 879.2k to 881.0k. The README remains 456 lines and 28,669 bytes; its SHA-256 above was recomputed from the current bytes. This refresh does not establish a published release, installed package parity, native build proof, or code coverage from a line-count badge.

## Popup And Streaming Build Fingerprint Revalidation - 2026-10-22

The frozen build refreshed only README badges: total lines changed from 881.0k to 881.9k and JavaScript lines from 121.3k to 121.5k. README remains 456 lines and 28,669 bytes; the current SHA-256 above was measured after the completed build. This pin refresh is not release publication, installed-package verification, or a code-coverage claim.


## Opt-In Content Player Manifest Source Pins - 2026-10-22

The new isolated dependencies and MAIN response resource update current manifest fingerprints only. Build/publish behavior, source/effect block assertions and the existing release boundary stay unchanged; historical source fingerprints above remain dated evidence.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `manifest.json` | 160 | 5545 | `b5229834ae6c291dbc4ad69b212c5ef086d8214b199678a0c09a46ae0eaa80c9` |
| `manifest.chrome.json` | 160 | 5545 | `b5229834ae6c291dbc4ad69b212c5ef086d8214b199678a0c09a46ae0eaa80c9` |
| `manifest.firefox.json` | 134 | 4431 | `f5ae06e03e855cd3c8c4a88e4fcc832c70341d56eb2edab33211d380a6b5c2fb` |
| `manifest.opera.json` | 168 | 5734 | `5f5809782261a21e8d8a6231178011c25a9de47fd8dfc8f4af834009a9084a07` |


## Owned Playback Package Source Revalidation - 2026-10-22

Current README and manifest bytes below were measured after the three browser builds. The two additional normal isolated scripts do not add permissions or web-accessible resources. Historical package and source rows remain dated evidence. Byte equality and source pins do not establish installed playback, publication or complete release readiness.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `README.md` | 456 | 28669 | `c86a3b7a701bbc48f653e3c916c464859317906ca1300805f027f7750932fa23` |
| `manifest.json` | 162 | 5663 | `f60a40c4344a7dd0390cb8dd88971b148b0600358c1d7b9bed609954f7ad633e` |
| `manifest.chrome.json` | 162 | 5663 | `f60a40c4344a7dd0390cb8dd88971b148b0600358c1d7b9bed609954f7ad633e` |
| `manifest.firefox.json` | 136 | 4533 | `f65bb52374d869f2b78f6a9b6b63679b68ef4fc0fb20e4725a536584c61d20ea` |
| `manifest.opera.json` | 170 | 5852 | `940b18bd821f9463260b6fb20f19bc32321132663a72f3de0d9cfee7b4eba30e` |


## Cold-Mount Coordinator Build Revalidation - 2026-10-22

The coordinator now retries a missing initial watch-page mount target at most twenty times at 500ms intervals, with cleanup on route/settings invalidation or successful mount. The final rebuild refreshed generated README line-count badges. Earlier hashes remain dated source checkpoints. This current pin is independent of installed playback acceptance.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `README.md` | 456 | 28669 | `93a31fb23de82c2bdb4b3d2da44be114dcf0ecc64fa771e7f8d05033e1b8e625` |


## Native Source Handoff Manifest Source Pins - 2026-10-22

The active stack uses the original YouTube engine through a bounded admitted source transaction. These are current source manifest pins; staged/archive equality and installed acceptance are independent gates. Permissions and web-accessible resources are unchanged.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `manifest.json` | 160 | 5544 | `78e3025b7b5bc01db2d88ab79edcb6294c815bf721060d384b2905d4adb21337` |
| `manifest.chrome.json` | 160 | 5544 | `78e3025b7b5bc01db2d88ab79edcb6294c815bf721060d384b2905d4adb21337` |
| `manifest.firefox.json` | 134 | 4430 | `8f177b22836825420d6967945b83eaa7cba8c48cd615bed2b05cdd1f54de430c` |
| `manifest.opera.json` | 168 | 5733 | `9070a9af9b7bf4b218c6a618b0ddf8c42f20c4e0f60661db41308e21da901a4e` |


## Native Source Handoff Final Build Metadata - 2026-10-22

All three browser packages were rebuilt from the frozen native source. The README generated badge is pinned below. Package/source equality is checked independently; this is not installed playback, fullscreen, profile or release-publication acceptance. Earlier build hashes remain dated evidence.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `README.md` | 456 | 28669 | `a700c32e22dcbfc3ea8e68b40aa4320006b634fef1843d5f117e9e55bc691f3c` |


## Automatic Native Playback Final Build Metadata - 2026-10-23

All three browser packages were rebuilt from the frozen automatic playback source. The generated README badge is pinned below. Source/stage/archive parity is checked independently; this is not installed playback, profile or publication acceptance. Healthy admitted native media remains unchanged, and fresh source selection is attempted only when needed. Earlier build hashes remain historical.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `README.md` | 456 | 28669 | `ddbbc23859fc87d2b7270e358db6c875660f927b70d0f96418f742d4aedeaa5f` |

## Watch Notes source inventory update - 2026-10-23

| `build.js` | 861 | 33225 | `a198cc1d0bf98e410deb8f66ced0e56a046bbf987a0a5b878e1278577622fb2e` |
| `package.json` | 86 | 4580 | `c9cb2c3c4fea302fa3946f462dbfbb474381a78946ca59adb653814d06a4de51` |
| `README.md` | 456 | 28669 | `b3f860c07748babe5f79c29116559ed9230020fdfa163f8c7ccfa8d778de316d` |
| `CHANGELOG.md` | 938 | 75511 | `e57906dca95911874ef251aa45d8c3a76df00df576b36277d9c0e9b9654c3036` |
| `manifest.json` | 162 | 5630 | `ba155d12e591c0306620bc57c59ad7378c5313084314a748414b5b1d39879d9d` |
| `manifest.chrome.json` | 162 | 5630 | `ba155d12e591c0306620bc57c59ad7378c5313084314a748414b5b1d39879d9d` |
| `manifest.firefox.json` | 136 | 4593 | `454805c26c62add8c1467d95ef41f1c4b6529b55ebcfbfbd81bfdcd93a0fb242` |
| `manifest.opera.json` | 170 | 5819 | `c516d8c0439a79016b0ed04ffb3658bbd40f8e0868fc146d8707a9da076636a4` |
| `data/release_notes.json` | 433 | 37594 | `9132b2e8809c5e1f01bf5715a115105f62387318b422ad681c0ef6a1be63c7f9` |

## Notes dialog build fingerprint - 2026-10-23

| `README.md` | 456 | 28669 | `002941cf5633b50fe77c0434639e3fe6b12ef85ab8a87d530a7bfee65ffe62af` |

The build badge changed during the Notes dialog fix. This source fingerprint is not installed-browser proof.

## Auto-sync source inventory - 2026-10-24

| `build.js` | 861 | 33225 | `a198cc1d0bf98e410deb8f66ced0e56a046bbf987a0a5b878e1278577622fb2e` |
| `package.json` | 86 | 4580 | `c9cb2c3c4fea302fa3946f462dbfbb474381a78946ca59adb653814d06a4de51` |
| `README.md` | 456 | 28669 | `e14c02036b3039e16101cc58cdf911deb22c59ff87da9d25843027f0cb49b8f2` |
| `CHANGELOG.md` | 938 | 75511 | `e57906dca95911874ef251aa45d8c3a76df00df576b36277d9c0e9b9654c3036` |
| `manifest.json` | 162 | 5630 | `ba155d12e591c0306620bc57c59ad7378c5313084314a748414b5b1d39879d9d` |
| `manifest.chrome.json` | 162 | 5630 | `ba155d12e591c0306620bc57c59ad7378c5313084314a748414b5b1d39879d9d` |
| `manifest.firefox.json` | 136 | 4668 | `30b981228a8214e0721d8c29ca3a74cac369508b0aca702e6b55286bc87ee7b8` |
| `manifest.opera.json` | 170 | 5819 | `c516d8c0439a79016b0ed04ffb3658bbd40f8e0868fc146d8707a9da076636a4` |
| `data/release_notes.json` | 433 | 37594 | `9132b2e8809c5e1f01bf5715a115105f62387318b422ad681c0ef6a1be63c7f9` |

These are current source measurements after Auto-sync and browser packaging changes. No installed-device, provider, native, publication, or release-readiness claim follows from these fingerprints.
