# FilterTube Build Script Method Semantic Register - Current Behavior - 2026-05-27

Status: audit-only current-behavior register. Runtime and build behavior are
unchanged.

This register promotes `build.js` from broad release/package risk notes to a
source-derived method semantic slice. It covers extension UI shell build
orchestration, browser package copy, manifest rewrite, ZIP creation, optional
mobile artifact staging, GitHub release body/publication, interactive prompts,
README badge mutation, and line-count helper behavior.

This is not completion proof for release package safety, draft-first release
publishing, README mutation policy, mobile artifact signing, ZIP checksum
manifests, manifest permission validation, build reproducibility, or public
claim readiness. It is a current-behavior boundary before changing build,
release, website, native sync, package, or public release behavior.

Paired verifier:
`tests/runtime/build-script-method-semantic-register-current-behavior.test.mjs`
pins this register to the current `build.js` fingerprint, semantic method row
inventory, package/release side-effect tokens, package script entrypoints, broad
copy roots, release publication shape, and missing future authority symbols.
The verifier changes no build or runtime behavior.

## Source-Derived Summary

```text
build script: build.js
build script line count: 728
build script bytes: 26641
build script sha256: 7ef8a2fd6796ec6758d7724544469a623d7c2d9407247a12b482e1f55cdc243b
lexical callable rows in this semantic slice: 28
plain function declarations: 20
async function declarations: 4
arrow callable rows: 4
semantic method groups: 9
arrow token sites in build script: 42
require calls: 8
await expressions: 9
execSync occurrences: 3
fs.copySync occurrences: 3
fs.copyFileSync occurrences: 1
fs.rmSync occurrences: 2
fs.writeJsonSync occurrences: 1
fs.writeFileSync occurrences: 2
https.request occurrences: 2
readline.createInterface occurrences: 2
process.stdout.isTTY occurrences: 2
draft false occurrences: 1
MOBILE_ARTIFACT_FILE_RE occurrences: 3
console callsites: 28
runtime behavior changed: no
build behavior changed: no
```

## Method Group Counts

```text
interactivePromptSurface: 2
manifestRewriteSurface: 1
mobileArtifactStaging: 7
packageBuildOrchestration: 1
packageCopySurface: 1
readmeBadgeMutation: 4
releaseBodyGeneration: 6
releasePublication: 5
zipArtifactCreation: 1
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `packageCopySurface` | 1 | Filters copied package files to exclude filesystem junk while still copying whole source directories. | Package manifest, quarantine policy, per-target package diff, and deletion-readiness proof. |
| `packageBuildOrchestration` | 1 | Runs generated UI build, mutates README badges, cleans target dist directories, copies package roots, rewrites target manifests, zips targets, stages optional mobile artifacts, and optionally prompts for release. | Dry-run contract, dirty-worktree policy, public doc mutation gate, artifact manifest, rollback plan, and CI/non-TTY publish contract. |
| `manifestRewriteSurface` | 1 | Mutates target manifest JSON to place `js/content/collab_dialog.js` before `js/content_bridge.js` in content-script arrays. | Full manifest validation for permissions, hosts, worlds, web-accessible resources, content script order, and target drift. |
| `zipArtifactCreation` | 1 | Streams each target directory into an archive with junk-file ignores and resolves after output close. | ZIP checksum manifest, expected file manifest, package size budget, and failed-archive cleanup proof. |
| `mobileArtifactStaging` | 7 | Optionally copies APK/AAB files matching the naming regex and package version into `dist/mobile`, prefers the sibling app artifact directory when present, selects latest versionCode artifacts, warns on missing APK/AAB pairs, and writes `.sha256` files. | Signing fingerprint manifest, package/versionCode proof, selected-artifact policy, release URL proof, and stale artifact cleanup. |
| `releaseBodyGeneration` | 6 | Reads changelog sections, builds release title/body, and constructs browser/mobile asset URLs. | Public-claim proof, artifact-exists preflight, markdown snapshot fixture, mobile store/direct APK gate, and rollback wording policy. |
| `releasePublication` | 5 | Creates a non-draft GitHub release, then uploads assets one by one over HTTPS. | Draft-first or preflight-all-assets contract, upload verification, rollback/delete-on-failure plan, asset list manifest, and API fixture provenance. |
| `interactivePromptSurface` | 2 | Creates readline prompts for yes/no and free-text input when stdout is a TTY. | Non-interactive release authority, prompt timeout/cancel behavior, CI flag contract, and accidental publish prevention. |
| `readmeBadgeMutation` | 4 | Reads `git ls-files`, counts tracked text/JS lines, rewrites README shields, and tolerates read/count failures with warnings. | Public doc mutation policy, reproducible line-count fixture, separate explicit badge command, dirty-worktree gate, and release-note parity. |

## Current Method Inventory

| Source file | Source line | Kind | Method or function | Semantic group |
| --- | ---: | --- | --- | --- |
| `build.js` | 69 | `arrowFunction` | `filterFunc` | `packageCopySurface` |
| `build.js` | 82 | `asyncFunction` | `main` | `packageBuildOrchestration` |
| `build.js` | 161 | `function` | `ensureCollabDialogScriptOrder` | `manifestRewriteSurface` |
| `build.js` | 183 | `function` | `createZip` | `zipArtifactCreation` |
| `build.js` | 216 | `asyncFunction` | `maybeCollectMobileArtifacts` | `mobileArtifactStaging` |
| `build.js` | 283 | `function` | `resolveDefaultMobileArtifactsDir` | `mobileArtifactStaging` |
| `build.js` | 292 | `function` | `parseMobileArtifactName` | `mobileArtifactStaging` |
| `build.js` | 303 | `function` | `summarizeMobileArtifacts` | `mobileArtifactStaging` |
| `build.js` | 314 | `function` | `selectLatestMobileArtifacts` | `mobileArtifactStaging` |
| `build.js` | 320 | `function` | `extractAndroidVersionCode` | `mobileArtifactStaging` |
| `build.js` | 324 | `function` | `sha256File` | `mobileArtifactStaging` |
| `build.js` | 330 | `asyncFunction` | `maybePromptRelease` | `releasePublication` |
| `build.js` | 388 | `function` | `extractLatestChangelogEntry` | `releaseBodyGeneration` |
| `build.js` | 413 | `function` | `deriveSubtitle` | `releaseBodyGeneration` |
| `build.js` | 422 | `function` | `buildReleaseTitle` | `releaseBodyGeneration` |
| `build.js` | 426 | `function` | `buildReleaseBody` | `releaseBodyGeneration` |
| `build.js` | 433 | `arrowFunction` | `assetLink` | `releaseBodyGeneration` |
| `build.js` | 435 | `arrowFunction` | `releaseAssetLink` | `releaseBodyGeneration` |
| `build.js` | 524 | `function` | `createGitHubRelease` | `releasePublication` |
| `build.js` | 549 | `function` | `uploadReleaseAsset` | `releasePublication` |
| `build.js` | 584 | `function` | `contentTypeForAsset` | `releasePublication` |
| `build.js` | 592 | `function` | `httpRequest` | `releasePublication` |
| `build.js` | 618 | `function` | `promptYesNo` | `interactivePromptSurface` |
| `build.js` | 631 | `function` | `promptText` | `interactivePromptSurface` |
| `build.js` | 644 | `asyncFunction` | `updateReadmeBadges` | `readmeBadgeMutation` |
| `build.js` | 663 | `arrowFunction` | `formatLoC` | `readmeBadgeMutation` |
| `build.js` | 707 | `function` | `shouldCountInTotalLoC` | `readmeBadgeMutation` |
| `build.js` | 713 | `function` | `sumFileLines` | `readmeBadgeMutation` |

## Current Entrypoints And Dependencies

```text
npm script entrypoint: npm run build -> node build.js
target browsers: chrome, firefox, opera
single-target args: chrome, firefox, opera
mobile artifact args: --mobile-artifacts, --mobile-artifacts=<dir>, --all-mobile-artifacts
mobile artifact env: FILTERTUBE_MOBILE_ARTIFACTS_DIR
release token env: GITHUB_TOKEN
normal package build invokes: node scripts/build-extension-ui.mjs
normal package build does not invoke: scripts/build-nanah-vendor.mjs
normal package build does not invoke: scripts/sync-native-runtime.mjs
common copied directories: js, css, html, icons, data, assets
common copied files: README.md, CHANGELOG.md, LICENSE
manifest source files: manifest.chrome.json, manifest.firefox.json, manifest.opera.json
manifest output path: dist/<browser>/manifest.json
ZIP output pattern: dist/filtertube-<browser>-v<version>.zip
mobile output directory: dist/mobile
mobile checksum output pattern: <artifact>.sha256
mobile default source: sibling ../FilterTubeApp/release-artifacts/android-mobile-tablet when present, otherwise release-artifacts/mobile
GitHub release endpoint: /repos/varshneydevansh/FilterTube/releases
GitHub release draft state: false
README mutation: updateReadmeBadges(VERSION) runs during main()
runtime behavior changed: no
build behavior changed: no
```

## Current Behavior Boundaries

```text
normal npm run build mutates README.md badge URLs
normal npm run build regenerates generated UI shell output before package copy
normal npm run build packages tracked vendor bundles without rebuilding Nanah or QR vendor output
normal npm run build packages whole js/css/html/icons/data/assets roots
normal npm run build can package quarantined-but-unloaded files unless separate audits keep them classified
non-TTY builds skip release publication instead of providing a CI release contract
TTY release publication creates a public non-draft GitHub release before uploading assets
asset upload happens one file at a time after public release creation
mobile APK/AAB files are copied only when requested or prompted and must match the current package version
mobile APK/AAB staging warns when the selected versionCode lacks either APK or AAB output
mobile checksum files are SHA-256 text sidecars, not a signed release manifest
manifest rewrite repairs collab_dialog load order but does not validate permission, host, world, or web-accessible drift
ZIP creation ignores filesystem junk but does not write a checksum or expected-file manifest
release body links browser ZIP names before proving those assets were uploaded
README line-count badges depend on current git ls-files and local filesystem reads
build failure sets process.exitCode but does not rollback README, dist, staged mobile artifacts, or created releases
```

## Risk Notes

Reliability risk is concentrated in release atomicity. A public GitHub release
can be visible before every ZIP, APK, AAB, and checksum upload has succeeded.
The build script also mutates README before package and release steps complete.

False-hide/leak risk is indirect but still release-relevant. Build packaging
copies broad directories, including generated, vendor, quarantined, and
unloaded files. A package change can ship inactive code or public docs without
changing filter runtime logic.

Performance and code-burden risk come from broad copy roots and generated
assets. Build output freshness, ZIP contents, media/package size, and generated
UI/vendor provenance need manifests before cleanup or optimization changes can
be treated as safe.

## Future Proof Fields

Each build-script method row must eventually be backed by source line, input
surface, output surface, side effect, failure behavior, rollback behavior, and
artifact proof before release or package behavior can claim semantic coverage:

```text
buildScriptMethodReference
sourceFile
sourceLine
semanticGroup
entrypointCommand
cliArgs
environmentInputs
sourceInputPath
generatedOutputPath
packageTarget
manifestInput
manifestOutput
zipOutputPath
mobileArtifactInput
mobileArtifactChecksum
publicDocMutation
releaseDraftState
releaseAssetPreflight
releaseUploadVerification
releaseRollbackPlan
checksumManifest
packageFileManifest
buildFailureBehavior
dirtyWorktreePolicy
positiveFixture
negativeFixture
releasePackageProof
```

## Missing Runtime/Build Authorities

These authority/report tokens do not exist in `build.js`, package metadata,
manifest files, release docs, generated UI scripts, or tracked runtime source
today:

```text
buildScriptMethodAuthority
buildPackageManifestAuthority
buildReleaseDraftFirstGate
buildReadmeMutationGate
buildZipChecksumManifest
buildMobileArtifactManifest
buildManifestValidationReport
buildReleaseAssetPreflightReport
buildReleaseRollbackPlan
buildDirtyWorktreePolicy
buildGeneratedOutputFreshnessReport
buildPackageFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this build/release/package surface can
support runtime optimization, package cleanup, release workflow changes, public
claim changes, or first-class JSON rollout. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, build package cleanup,
README mutation changes, GitHub release changes, mobile artifact publication,
native sync rollout, or public availability claims.
