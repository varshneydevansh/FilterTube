# FilterTube Release Build Artifact Claim Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior proof. Runtime behavior is unchanged.

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
| `build.js` | 686 | 24689 | `f6778ce29f1d7f520a66ab689f8c1a2999e5887ffa8c53bd5039f4976b2671b6` |
| `package.json` | 46 | 1376 | `cd24685d1fb4940c1a67f12ce143bc1466200a299a82dbfa6f553b99e24ae23f` |
| `README.md` | 416 | 24330 | `8435890aa3fc5bb10fb9206353978a53b4b1847809ce9ca3ffbb4f7bfecac9ac` |
| `CHANGELOG.md` | 591 | 40157 | `71949d5506a2e9acd27b7f1a1578edef49b06dc578314293863d425d32251bd5` |
| `manifest.json` | 88 | 2513 | `c39c38d4e389f17803b1915c2d2d0673c60dd87e68a9301fac4faad14bfd31e1` |
| `manifest.chrome.json` | 88 | 2513 | `c39c38d4e389f17803b1915c2d2d0673c60dd87e68a9301fac4faad14bfd31e1` |
| `manifest.firefox.json` | 75 | 2029 | `89e2f70a5f6bb34356ebed2f4ad357213a28a2872cfaebeff2474e702a98719d` |
| `manifest.opera.json` | 89 | 2518 | `ef0fa857517710853e82942bdb05bc14c9f2e2202b49775fd6e6a59a27e77017` |
| `data/release_notes.json` | 316 | 23039 | `e012f6c071fffa67958f55544ecae9bbb26e7ec91edd2066df4d06a62de69962` |

## Source And Effect Blocks

| Block | Start line | Lines | Bytes | Current boundary |
| --- | ---: | ---: | ---: | --- |
| `buildConfig` | 28 | 38 | 1476 | Build targets, package roots, common files, mobile artifact regex, and text LoC file families are local constants. |
| `mainBuildFlow` | 80 | 79 | 2790 | Normal build regenerates extension UI shells, mutates README badges, optionally cleans `dist`, copies broad package roots, writes browser manifest output, creates ZIPs, and then enters optional mobile/release paths. |
| `manifestOrderRepair` | 159 | 22 | 858 | Manifest repair only enforces `js/content/collab_dialog.js` before `js/content_bridge.js`; it does not validate permissions, hosts, web-accessible resources, versions, or JSON-first startup readiness. |
| `createZip` | 181 | 33 | 981 | ZIP creation archives all target-directory files except OS junk and does not emit a browser ZIP checksum or package manifest. |
| `mobileArtifacts` | 214 | 61 | 2331 | Android APK/AAB staging is opt-in through CLI/env/prompt, filters by filename regex, copies artifacts into `dist/mobile`, and writes per-file `.sha256` outputs. |
| `mobileSelectionChecksum` | 275 | 17 | 625 | Latest mobile artifact selection is Android versionCode based, and checksum calculation reads the staged artifact bytes. |
| `releasePromptPublish` | 292 | 58 | 1805 | Interactive release publication requires `GITHUB_TOKEN`, creates release body/title text, creates the GitHub release, then uploads assets sequentially. |
| `releaseBody` | 388 | 94 | 4166 | Release copy constructs browser ZIP links and optional Android links from naming conventions, not from verified uploaded assets. |
| `githubReleaseCreate` | 482 | 25 | 699 | GitHub release creation posts `draft: false` and `prerelease: false`. |
| `githubAssetUpload` | 507 | 35 | 1350 | Asset upload is sequential after public release creation; upload failure rejects without a rollback/delete path. |
| `readmeBadges` | 602 | 63 | 2355 | README badge mutation uses `git ls-files`, counts text-like and JavaScript files, rewrites version/LoC badges, and treats failures as warnings. |

## Current Cross-Surface Facts

```text
release build artifact boundary source files: 9
release build artifact source/effect blocks: 11
browser package version: 3.3.1
package.json version: 3.3.1
staged newest release-note version: 3.3.2
release note data entries: 24
release note version rows: 23
package source directories: js, css, html, icons, data, assets
package common files: README.md, CHANGELOG.md, LICENSE
npm build scripts: build, build:chrome, build:firefox, build:opera
browser ZIP checksum writer: absent
release package manifest: absent
public claim manifest: absent
artifact manifest: absent
public release rollback/delete path: absent
runtime behavior changed: no
```

README public copy currently claims:

- `filtertube.in/downloads` is the download hub for browser releases, Android
  phone/tablet builds, and future store links.
- Large blocked-channel lists filter faster because YouTube JSON payloads use
  indexed channel matching.
- JSON-backed surfaces can be filtered before paint when YouTube exposes the
  needed fields.
- Current audit work is tightening no-rule, route, lifecycle, and resolver
  budgets.

Those claims are useful direction for users and maintainers, but they are not a
release artifact gate. The build/release boundary still needs executable proof
that public download links, ZIP contents, Android artifacts, checksums, signing
identity, browser manifest parity, generated UI freshness, and JSON-first
runtime claims all match the exact release output.

## Current Risk Notes

Reliability risk is concentrated in publication ordering. The script creates a
non-draft public GitHub release before upload proof exists, and release body
links are built from expected names rather than confirmed uploaded assets.

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
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, release package behavior, public release
claims, prompt release overlays, raw-capture packaging, whitelist behavior,
metric collectors, artifact creation, native sync, or release publication.
