# FilterTube Build Script Method Semantic Register - Current Behavior - 2026-05-27

Status: current-behavior register with a 2026-06-01 build prompt guard
addendum. Extension runtime behavior is unchanged; build prompt behavior
changed.

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
build script line count: 861
build script bytes: 33225
build script sha256: a198cc1d0bf98e410deb8f66ced0e56a046bbf987a0a5b878e1278577622fb2e
lexical callable rows in this semantic slice: 38
plain function declarations: 26
async function declarations: 5
arrow callable rows: 7
semantic method groups: 9
arrow token sites in build script: 55
require calls: 9
await expressions: 9
execSync occurrences: 4
fs.copySync occurrences: 3
fs.copyFileSync occurrences: 1
fs.rmSync occurrences: 2
fs.writeJsonSync occurrences: 1
fs.writeFileSync occurrences: 2
https.request occurrences: 0
readline.createInterface occurrences: 2
process.stdout.isTTY occurrences: 3
draft false occurrences: 0
MOBILE_ARTIFACT_FILE_RE occurrences: 3
console callsites: 34
runtime behavior changed: no
build behavior changed: yes
```

## Method Group Counts

```text
interactivePromptSurface: 2
manifestRewriteSurface: 1
mobileArtifactStaging: 9
packageBuildOrchestration: 5
packageCopySurface: 1
readmeBadgeMutation: 4
releaseBodyGeneration: 6
releasePublication: 9
zipArtifactCreation: 1
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `packageCopySurface` | 1 | Filters copied package files to exclude filesystem junk while still copying whole source directories. | Package manifest, quarantine policy, per-target package diff, and deletion-readiness proof. |
| `packageBuildOrchestration` | 5 | Runs generated UI build, mutates README badges, cleans target dist directories, copies package roots, rewrites target manifests, zips targets, stages optional mobile artifacts, and optionally prompts for release. | Dry-run contract, dirty-worktree policy, public doc mutation gate, artifact manifest, rollback plan, and CI/non-TTY publish contract. |
| `manifestRewriteSurface` | 1 | Mutates target manifest JSON to place `js/content/collab_dialog.js` before `js/content_bridge.js` in content-script arrays. | Full manifest validation for permissions, hosts, worlds, web-accessible resources, content script order, and target drift. |
| `zipArtifactCreation` | 1 | Streams each target directory into an archive with junk-file ignores and resolves after output close. | ZIP checksum manifest, expected file manifest, package size budget, and failed-archive cleanup proof. |
| `mobileArtifactStaging` | 9 | Optionally copies APK/AAB files matching the naming regex and package version into `dist/mobile`, treats blank/y/yes/default directory-prompt answers as the displayed default, prefers the sibling app artifact directory when present, selects latest versionCode artifacts, warns on missing APK/AAB pairs, and writes `.sha256` files. | Signing fingerprint manifest, package/versionCode proof, selected-artifact policy, release URL proof, and stale artifact cleanup. |
| `releaseBodyGeneration` | 6 | Reads changelog sections, builds release title/body, and constructs browser/mobile asset URLs. | Public-claim proof, artifact-exists preflight, markdown snapshot fixture, mobile store/direct APK gate, and rollback wording policy. |
| `releasePublication` | 9 | Creates a new draft through GitHub CLI, uploads missing assets, verifies expected names and publishes only its newly created draft; resuming an existing release preserves visibility. | Byte/checksum verification, rollback/delete-on-failure policy, asset manifest, and GitHub CLI fixture provenance. |
| `interactivePromptSurface` | 2 | Creates readline prompts for yes/no and free-text input when stdout is a TTY. | Non-interactive release authority, prompt timeout/cancel behavior, CI flag contract, and accidental publish prevention. |
| `readmeBadgeMutation` | 4 | Reads `git ls-files`, counts tracked text/JS lines, rewrites README shields, and tolerates read/count failures with warnings. | Public doc mutation policy, reproducible line-count fixture, separate explicit badge command, dirty-worktree gate, and release-note parity. |

## Current Method Inventory

| Source file | Source line | Kind | Method or function | Semantic group |
| --- | ---: | --- | --- | --- |
| `build.js` | 76 | `arrowFunction` | `filterFunc` | `packageCopySurface` |
| `build.js` | 93 | `asyncFunction` | `main` | `packageBuildOrchestration` |
| `build.js` | 95 | `arrowFunction` | `onExit` | `packageBuildOrchestration` |
| `build.js` | 96 | `arrowFunction` | `onInterrupt` | `packageBuildOrchestration` |
| `build.js` | 97 | `arrowFunction` | `onTerminate` | `packageBuildOrchestration` |
| `build.js` | 111 | `asyncFunction` | `buildTargets` | `packageBuildOrchestration` |
| `build.js` | 193 | `function` | `ensureCollabDialogScriptOrder` | `manifestRewriteSurface` |
| `build.js` | 215 | `function` | `createZip` | `zipArtifactCreation` |
| `build.js` | 248 | `asyncFunction` | `maybeCollectMobileArtifacts` | `mobileArtifactStaging` |
| `build.js` | 338 | `function` | `resolveMobileArtifactPromptDir` | `mobileArtifactStaging` |
| `build.js` | 350 | `function` | `resolveDefaultMobileArtifactsDir` | `mobileArtifactStaging` |
| `build.js` | 359 | `function` | `parseMobileArtifactName` | `mobileArtifactStaging` |
| `build.js` | 370 | `function` | `summarizeMobileArtifacts` | `mobileArtifactStaging` |
| `build.js` | 381 | `function` | `describeAvailableMobileArtifacts` | `mobileArtifactStaging` |
| `build.js` | 405 | `function` | `selectLatestMobileArtifacts` | `mobileArtifactStaging` |
| `build.js` | 411 | `function` | `extractAndroidVersionCode` | `mobileArtifactStaging` |
| `build.js` | 415 | `function` | `sha256File` | `mobileArtifactStaging` |
| `build.js` | 421 | `function` | `resolveGitHubToken` | `releasePublication` |
| `build.js` | 445 | `asyncFunction` | `maybePromptRelease` | `releasePublication` |
| `build.js` | 530 | `function` | `extractLatestChangelogEntry` | `releaseBodyGeneration` |
| `build.js` | 556 | `function` | `deriveSubtitle` | `releaseBodyGeneration` |
| `build.js` | 565 | `function` | `buildReleaseTitle` | `releaseBodyGeneration` |
| `build.js` | 569 | `function` | `buildReleaseBody` | `releaseBodyGeneration` |
| `build.js` | 579 | `arrowFunction` | `assetLink` | `releaseBodyGeneration` |
| `build.js` | 581 | `arrowFunction` | `releaseAssetLink` | `releaseBodyGeneration` |
| `build.js` | 678 | `function` | `githubCliEnv` | `releasePublication` |
| `build.js` | 688 | `function` | `runGitHubCli` | `releasePublication` |
| `build.js` | 696 | `function` | `githubReleaseExists` | `releasePublication` |
| `build.js` | 712 | `function` | `createDraftGitHubRelease` | `releasePublication` |
| `build.js` | 722 | `function` | `listGitHubReleaseAssetNames` | `releasePublication` |
| `build.js` | 732 | `function` | `uploadGitHubReleaseAssets` | `releasePublication` |
| `build.js` | 743 | `function` | `publishDraftGitHubRelease` | `releasePublication` |
| `build.js` | 751 | `function` | `promptYesNo` | `interactivePromptSurface` |
| `build.js` | 764 | `function` | `promptText` | `interactivePromptSurface` |
| `build.js` | 777 | `asyncFunction` | `updateReadmeBadges` | `readmeBadgeMutation` |
| `build.js` | 796 | `arrowFunction` | `formatLoC` | `readmeBadgeMutation` |
| `build.js` | 840 | `function` | `shouldCountInTotalLoC` | `readmeBadgeMutation` |
| `build.js` | 846 | `function` | `sumFileLines` | `readmeBadgeMutation` |

## Current Entrypoints And Dependencies

```text
npm script entrypoint: npm run build -> node build.js
target browsers: chrome, firefox, opera
single-target args: chrome, firefox, opera
mobile artifact args: --mobile-artifacts, --mobile-artifacts=<dir>, --all-mobile-artifacts
mobile artifact env: FILTERTUBE_MOBILE_ARTIFACTS_DIR
mobile artifact prompt directory answers treated as default: blank, y, yes, default
release credentials: gh keyring, GH_TOKEN or GITHUB_TOKEN
normal package build invokes: node scripts/build-extension-ui.mjs
normal package build does not invoke: scripts/build-nanah-vendor.mjs
normal package build does not invoke: scripts/sync-native-runtime.mjs
common copied directories: _locales, js, css, html, icons, data, assets
common copied files: README.md, CHANGELOG.md, LICENSE
manifest source files: manifest.chrome.json, manifest.firefox.json, manifest.opera.json
manifest output path: dist/<browser>/manifest.json
ZIP output pattern: dist/filtertube-<browser>-v<version>.zip
mobile output directory: dist/mobile
mobile checksum output pattern: <artifact>.sha256
mobile default source: sibling ../FilterTubeApp/release-artifacts/android-mobile-tablet when present, otherwise release-artifacts/mobile
GitHub release endpoint: /repos/varshneydevansh/FilterTube/releases
GitHub release draft state: new releases start draft; existing visibility is preserved
README mutation: updateReadmeBadges(VERSION) runs during main()
runtime behavior changed: no
build behavior changed: yes
build prompt behavior changed: yes
```

## Current Behavior Boundaries

```text
normal npm run build mutates README.md badge URLs
normal npm run build regenerates generated UI shell output before package copy
normal npm run build packages tracked vendor bundles without rebuilding Nanah or QR vendor output
normal npm run build packages whole _locales/js/css/html/icons/data/assets roots
normal npm run build can package quarantined-but-unloaded files unless separate audits keep them classified
non-TTY builds skip release publication instead of providing a CI release contract
TTY release publication creates a draft, uploads missing assets, verifies expected names, then publishes only its new draft
asset upload precedes expected-name verification and publication of a newly created draft
mobile APK/AAB files are copied only when requested or prompted and must match the current package version
mobile artifact directory prompt treats blank, y, yes, and default as the displayed default directory
mobile APK/AAB staging warns when the selected versionCode lacks either APK or AAB output
mobile checksum files are SHA-256 text sidecars, not a signed release manifest
manifest rewrite repairs collab_dialog load order but does not validate permission, host, world, or web-accessible drift
ZIP creation ignores filesystem junk but does not write a checksum or expected-file manifest
release body links browser ZIP names before proving those assets were uploaded
README line-count badges depend on current git ls-files and local filesystem reads
build failure sets process.exitCode but does not rollback README, dist, staged mobile artifacts, or created releases
```

## Risk Notes

New drafts publish after expected-name verification; existing releases retain
their visibility. Name-only checks do not prove asset bytes or signing. The build
script also mutates README before package and release steps complete.

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
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, build package cleanup,
README mutation changes, GitHub release changes, mobile artifact publication,
native sync rollout, or public availability claims.

## 2026-10-18 Source Review

Current counters and method rows above were re-extracted from the reviewed build source. New releases use draft → upload missing assets → verify expected asset names → publish. Existing releases retain their visibility, including intentional review drafts. Name verification is not byte/checksum, signing or physical-device proof. The workflow VM tests execute the actual orchestrator with synthetic command boundaries; no network release action was performed. Normal builds also hold the build lock, validate copied JSON before mutation, include `_locales`, and still mutate README badges. Historical proof-gap counts below remain dated audit inventory, not current behavioral completeness.
