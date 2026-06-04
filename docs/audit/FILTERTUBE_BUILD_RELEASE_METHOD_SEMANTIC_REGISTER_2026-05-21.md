# FilterTube Build Release Method Semantic Register - Current Behavior - 2026-05-21

Status: current-behavior register with a 2026-06-01 build prompt guard
addendum. Extension runtime behavior is unchanged; build prompt behavior
changed.

This register promotes `build.js` from representative build/release callable
tokens to a source-derived method inventory. It covers extension UI shell
generation, README badge mutation, browser target selection, broad directory
copying, browser-specific manifest rewriting, ZIP creation, optional mobile
artifact staging/checksums, interactive GitHub release publishing, release body
generation, GitHub API transport, readline prompts, and line-count badge
calculation.

This is not completion proof for package manifest authority, draft-first
release safety, README mutation policy, artifact provenance, signing
fingerprint proof, generated UI freshness, browser manifest parity, native/app
runtime freshness, or website/public-claim readiness. It is a current-behavior
boundary before build script, ZIP contents, release publishing, mobile artifact,
README badge, manifest transformation, or public download claim changes.

## Source-Derived Summary

```text
source file: build.js
line count: 740
named method/helper/callback declarations in scope: 29
plain function declarations: 21
async function declarations: 4
const arrow helper/callback declarations: 4
semantic method groups: 6
arrow token sites: 42
callback-like sites: 40
fs.copySync references: 3
fs.readJsonSync references: 1
fs.writeJsonSync references: 1
fs.createWriteStream references: 1
fs.ensureDirSync references: 1
fs.copyFileSync references: 1
fs.writeFileSync references: 2
fs.readFileSync references: 4
fs.existsSync references: 9
fs.rmSync references: 2
fs.mkdirSync references: 2
fs.statSync references: 3
fs.readdirSync references: 1
fs.createReadStream references: 1
path.join references: 9
path.resolve references: 3
path.basename references: 5
path.extname references: 2
execSync references: 3
crypto.createHash references: 1
https.request references: 2
readline.createInterface references: 2
process.argv references: 1
process.env references: 2
process.stdout.isTTY references: 2
process.exitCode references: 1
console.log references: 14
console.warn references: 6
console.error references: 8
await expressions: 9
new Promise references: 5
JSON.parse references: 2
JSON.stringify references: 1
Buffer.concat references: 2
Buffer.byteLength references: 1
encodeURIComponent references: 2
archive.glob references: 1
archive.finalize references: 1
archive.pipe references: 1
output.on references: 2
archive.on references: 1
res.on references: 4
req.on references: 2
req.write references: 1
req.end references: 1
GITHUB_TOKEN references: 2
draft: false references: 1
prerelease: false references: 1
README.md references: 3
CHANGELOG.md references: 4
LICENSE references: 2
manifest.${browser}.json references: 1
manifest.json references: 2
collab_dialog.js references: 1
content_bridge.js references: 1
dist references: 12
release-artifacts references: 2
filtertube-${browser}-v${version}.zip references: 2
.sha256 references: 4
.apk references: 2
.aab references: 1
try blocks: 7
catch token occurrences: 8
finally blocks: 0
addEventListener calls: 0
setTimeout calls: 0
setInterval calls: 0
MutationObserver references: 0
fetch calls: 0
new Error calls: 2
runtime behavior changed: no
build prompt behavior changed: yes
```

## Method Group Counts

```text
buildPackageAssembly: 4
buildMobileArtifactStaging: 8
buildReleasePromptAndBody: 7
buildGitHubReleaseTransport: 4
buildInteractivePromptHelpers: 2
buildReadmeBadgeAndLocMutation: 4
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `buildPackageAssembly` | 4 | Runs generated UI shell build, mutates README badges, optionally cleans `dist`, copies broad source directories/files, repairs only collaborator-before-bridge manifest order, and zips browser targets. | Explicit package manifest, source family classification, quarantine proof, manifest parity checks, and dry-run no-mutation mode. |
| `buildMobileArtifactStaging` | 8 | Reads mobile artifact CLI/env/prompt input, treats blank/y/yes/default directory-prompt answers as the displayed default, filters APK/AAB names by regex and package version, prefers the sibling app artifact directory with local fallback, selects latest Android versionCode unless all artifacts are requested, warns on missing APK/AAB pairs, copies artifacts to `dist/mobile`, and writes `.sha256` files. | Package name proof, signing fingerprint proof, release-channel proof, artifact manifest, website CTA gate, and stale artifact negative fixtures. |
| `buildReleasePromptAndBody` | 7 | In interactive terminals, asks whether to publish, requires `GITHUB_TOKEN`, builds changelog-derived release copy and GitHub asset links, and includes mobile artifact links when attached. | Release claim manifest, link-to-asset verification, changelog schema proof, public-claim owner, and draft-first release plan. |
| `buildGitHubReleaseTransport` | 4 | Creates a public non-draft GitHub release, uploads assets one by one with content-type selection, and wraps HTTPS request/response parsing. | Draft-first publish flow, all-assets-uploaded verification, rollback/failure handling, status-code fixtures, and GitHub API provenance. |
| `buildInteractivePromptHelpers` | 2 | Uses readline prompts for yes/no and free-text input. | CI/non-interactive release authority, prompt timeout/cancel handling, and scripted dry-run coverage. |
| `buildReadmeBadgeAndLocMutation` | 4 | Runs `git ls-files`, counts text-like files and JS files, formats LoC, rewrites three README badges, and catches failures as warnings. | README mutation contract, reproducible build mode, excluded/generated family proof, stale badge policy, and docs-write ownership. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 69 | `constArrow` | `filterFunc` | `buildPackageAssembly` |
| 82 | `asyncFunction` | `main` | `buildPackageAssembly` |
| 161 | `function` | `ensureCollabDialogScriptOrder` | `buildPackageAssembly` |
| 183 | `function` | `createZip` | `buildPackageAssembly` |
| 216 | `asyncFunction` | `maybeCollectMobileArtifacts` | `buildMobileArtifactStaging` |
| 283 | `function` | `resolveMobileArtifactPromptDir` | `buildMobileArtifactStaging` |
| 295 | `function` | `resolveDefaultMobileArtifactsDir` | `buildMobileArtifactStaging` |
| 304 | `function` | `parseMobileArtifactName` | `buildMobileArtifactStaging` |
| 315 | `function` | `summarizeMobileArtifacts` | `buildMobileArtifactStaging` |
| 326 | `function` | `selectLatestMobileArtifacts` | `buildMobileArtifactStaging` |
| 332 | `function` | `extractAndroidVersionCode` | `buildMobileArtifactStaging` |
| 336 | `function` | `sha256File` | `buildMobileArtifactStaging` |
| 342 | `asyncFunction` | `maybePromptRelease` | `buildReleasePromptAndBody` |
| 400 | `function` | `extractLatestChangelogEntry` | `buildReleasePromptAndBody` |
| 425 | `function` | `deriveSubtitle` | `buildReleasePromptAndBody` |
| 434 | `function` | `buildReleaseTitle` | `buildReleasePromptAndBody` |
| 438 | `function` | `buildReleaseBody` | `buildReleasePromptAndBody` |
| 445 | `constArrow` | `assetLink` | `buildReleasePromptAndBody` |
| 447 | `constArrow` | `releaseAssetLink` | `buildReleasePromptAndBody` |
| 536 | `function` | `createGitHubRelease` | `buildGitHubReleaseTransport` |
| 561 | `function` | `uploadReleaseAsset` | `buildGitHubReleaseTransport` |
| 596 | `function` | `contentTypeForAsset` | `buildGitHubReleaseTransport` |
| 604 | `function` | `httpRequest` | `buildGitHubReleaseTransport` |
| 630 | `function` | `promptYesNo` | `buildInteractivePromptHelpers` |
| 643 | `function` | `promptText` | `buildInteractivePromptHelpers` |
| 656 | `asyncFunction` | `updateReadmeBadges` | `buildReadmeBadgeAndLocMutation` |
| 675 | `constArrow` | `formatLoC` | `buildReadmeBadgeAndLocMutation` |
| 719 | `function` | `shouldCountInTotalLoC` | `buildReadmeBadgeAndLocMutation` |
| 725 | `function` | `sumFileLines` | `buildReadmeBadgeAndLocMutation` |

## Current Entrypoints And Dependencies

```text
npm script entrypoints: npm run build, build:chrome, build:firefox, build:opera
CLI target selection: first argv value in chrome/firefox/opera
mobile artifact CLI flags: --mobile-artifacts, --mobile-artifacts=..., --all-mobile-artifacts
mobile artifact env var: FILTERTUBE_MOBILE_ARTIFACTS_DIR
mobile artifact prompt directory answers treated as default: blank, y, yes, default
generated UI shell build: execSync('node scripts/build-extension-ui.mjs', { stdio: 'inherit' })
README mutation path: updateReadmeBadges(VERSION) before package copying
full build clean: removes dist only when no target browser is selected
package source directories: js, css, html, icons, data, assets
package common files: README.md, CHANGELOG.md, LICENSE
manifest source path: manifest.${browser}.json
manifest output path: dist/<browser>/manifest.json
manifest repair scope: collab_dialog.js before content_bridge.js only
zip output path: dist/filtertube-${browser}-v${version}.zip
zip ignore patterns: .DS_Store, __MACOSX, ._*, Thumbs.db
mobile artifact default source: sibling ../FilterTubeApp/release-artifacts/android-mobile-tablet when present, otherwise release-artifacts/mobile
mobile artifact staging target: dist/mobile
mobile checksum path: <artifact>.sha256
release prompt skip: non-interactive terminal or no release assets
GitHub token source: process.env.GITHUB_TOKEN
GitHub release endpoint: api.github.com/repos/varshneydevansh/FilterTube/releases
GitHub release mode: draft false and prerelease false
asset upload behavior: after public release creation, upload each path sequentially
content types: zip, apk, sha256/txt, octet-stream fallback
README LoC source: git ls-files
README badge writes: version, total lines, JavaScript LoC
explicit package manifest: absent
release claim manifest: absent
draft-first release flow: absent
runtime behavior changed: no
build prompt behavior changed: yes
```

## Current Behavior Boundaries

```text
normal build mutates README badges before copying packages
single-target build does not remove the whole dist directory
package roots are broad directories, not only manifest-referenced files
build copies css and html directories even when some files are quarantined or empty
manifest validation is limited to read/write success and collaborator script order
ZIP creation is archive-glob based and does not emit a checksum manifest
mobile artifact collection is opt-in by CLI/env/prompt, filename regex, and current package version
mobile artifact directory prompt treats blank, y, yes, and default as the displayed default directory
latest mobile artifact selection is versionCode-based when --all-mobile-artifacts is absent
mobile artifact staging warns when the selected versionCode lacks either APK or AAB output
mobile checksum files are staged but not bound to signing fingerprint or package name proof
non-interactive terminal skips release prompt and has no CI publish path
GitHub release is created as public before asset uploads start
asset upload failures are caught after public release creation and no rollback/delete path is present
release body can link browser ZIP names whether or not every upload later succeeds
README badge mutation failures warn and continue
```

## Risk Notes

Reliability risk is concentrated in release publication and package breadth:
the script creates a public GitHub release before all assets are uploaded, and
the package roots include broad directories rather than a generated release
manifest. A failed asset upload or stale packaged file can become public even
when the source audit has not certified the artifact set.

False-hide/leak risk is indirect but real for extension users: broad package
copying can ship quarantined CSS, empty HTML, generated shells, vendor bundles,
and data files even when manifests do not load them today. Future runtime
changes can accidentally activate packaged-but-unowned files unless package
contents are tied to a manifest and source-family proof.

Performance/code-burden risk comes from build side effects and split release
authority. Running a normal build mutates README badges, release body link
generation is independent of upload verification, mobile artifact staging has
checksums but no signing/package proof, and CI/non-interactive release semantics
are skipped rather than modeled.

## Future Proof Fields

Each build/release method row must eventually be backed by source line,
artifact, command output, and observed success/failure effect before packaging,
release publication, mobile artifact, README, manifest, or website download
claim behavior changes can claim semantic coverage:

```text
buildMethodReference
sourceLine
semanticGroup
commandName
cliTarget
browserTarget
sourceDirectory
sourceFile
generatedFile
manifestSource
manifestOutput
manifestValidationResult
packageFile
packageFamily
quarantineStatus
zipPath
zipChecksum
releaseAssetPath
releaseAssetChecksum
mobileArtifactName
androidVersionCode
androidPackageName
signingFingerprint
releaseClaimId
githubReleaseId
githubReleaseDraftState
assetUploadStatus
rollbackPolicy
readmeMutationAllowed
lineCountSource
nonInteractivePolicy
positiveFixture
negativeFixture
sourceFamilyProvenance
```

## Missing Runtime Authorities

These authority/report tokens do not exist in build/release source today:

```text
buildReleaseMethodAuthority
buildPackageManifestAuthority
buildReadmeMutationContract
buildReleaseDraftFirstContract
buildMobileArtifactClaimGate
buildGitHubAssetUploadManifest
buildGeneratedUiFreshnessReport
buildManifestParityReport
buildVendorNativeFreshnessContract
buildReleaseFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this release/package/public-claim surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 72
method semantic proof gap lexical callables covered: 6110
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6110
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
