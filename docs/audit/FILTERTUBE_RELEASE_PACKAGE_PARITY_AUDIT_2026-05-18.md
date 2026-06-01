# FilterTube Release Package Parity Audit - 2026-05-18

Status: current-behavior audit only. This file does not change build output,
release publishing, manifests, CSS, generated shells, or runtime behavior.

This slice covers the release package boundary: what `build.js` copies into
browser ZIPs, what it mutates before packaging, what it does not prove, and
which shipped files can drift from tracked source or audit claims.

## Current Build Package Model

`build.js` builds Chrome, Firefox, and Opera packages by:

1. running `scripts/build-extension-ui.mjs`,
2. updating README badges,
3. copying whole common directories,
4. copying common top-level docs,
5. writing one browser-specific manifest as `manifest.json`,
6. zipping the target directory,
7. optionally staging Android artifacts and checksums,
8. optionally creating a public GitHub release in an interactive terminal.

Current package roots:

```text
COMMON_DIRS = js, css, html, icons, data, assets
COMMON_FILES = README.md, CHANGELOG.md, LICENSE
```

That means package contents are directory-level, not manifest-referenced-only.
This is easy to understand but it is not a complete parity proof.

## Package Surface Matrix

| Packaged family | Current behavior | Risk |
| --- | --- | --- |
| `js/` | Entire JS tree is copied, including content runtime, background, UI, vendor, generated UI shell outputs, and inactive helper files. | Generated output and vendor provenance can drift unless a package manifest or hash gate exists. |
| `css/` | Entire CSS tree is copied, including active UI CSS and quarantined YouTube CSS files. | `css/filter.css`, `css/content.css`, and `css/layout.css` are not manifest-loaded today but still ship in ZIPs. |
| `html/` | Popup, dashboard, and empty troubleshoot page are copied. | `html/troubleshoot.html` is a zero-byte packaged support surface. |
| `icons/` | Entire icon directory is copied. | Low behavior risk; still needs package inventory parity if icon references change. |
| `data/` | Release-note JSON is copied. | Release copy can describe staged/upcoming work before manifest/package version changes. |
| `assets/` | App-card images and homepage video assets are copied. | Extension ZIP carries app-release imagery/media; size and disclosure should be explicit. |
| Top-level docs | README, changelog, and license are copied after README badge mutation. | Build is not a pure package operation; it mutates a tracked file before packaging. |
| Browser manifest | Selected `manifest.<browser>.json` is written as package `manifest.json`; build only repairs collaborator script order. | Browser parity is not validated beyond that one ordering repair. |
| Android artifacts | Optional APK/AAB files are copied from a release-artifact directory and `.sha256` files are generated. | This is release-side staging, not proof that a public website/download claim is valid. |

## High-Confidence Findings

1. **Release ZIPs copy directories, not a package manifest.**
   `COMMON_DIRS` includes `js`, `css`, `html`, `icons`, `data`, and `assets`.
   The ZIP creation step then archives everything in the target directory except
   OS junk files. There is no committed `releasePackageParity` manifest that
   declares each expected packaged path and its source family.

2. **Quarantined CSS still ships.**
   The manifest files do not content-script-load CSS, but the build copies the
   whole `css` directory. This is currently safe only because those legacy
   YouTube styles remain unloaded. A release-package gate should prove they
   remain quarantined or explicitly remove them from ZIPs.

3. **Build mutates tracked source before packaging.**
   The build runs `scripts/build-extension-ui.mjs` and `updateReadmeBadges()`.
   Regenerating UI shell output is expected, but README badge mutation means a
   normal package command can dirty source state before release.

4. **Generated shell freshness is not proven by package output.**
   The build regenerates shell files, but no committed freshness manifest ties
   `src/extension-shell/*` inputs to `js/ui-shell/*` outputs.

5. **GitHub release publishing is public before upload proof.**
   `createGitHubRelease()` sends `draft: false` and the upload loop happens
   afterward. If an asset upload fails, a public release can exist without the
   expected browser ZIP, APK, AAB, or checksum assets.

6. **Android artifact staging is deterministic but optional.**
   The file-name regex and SHA-256 generation are good release mechanics, but
   they do not by themselves prove that website download CTAs, store listings,
   or README links are safe to expose.

7. **Raw root captures remain outside the package model.**
   Ignored root HTML/JSON/TXT captures are not copied by `COMMON_DIRS` or
   `COMMON_FILES`. They are evidence inputs only and should only enter release
   proof as minimal committed fixtures.

## Missing Future Authority

Future token: `releasePackageParity`

Required record shape:

```text
releasePackageParity {
  browser,
  sourceRevision,
  packagePath,
  sourcePath,
  sourceFamily,
  manifestReferenced,
  webAccessible,
  generatedFrom,
  hash,
  sizeBytes,
  releaseClaimIds[],
  quarantineStatus,
  uploadStatus
}
```

The goal is not to make the package tiny. The goal is to make package contents,
public claims, and uploaded assets auditable before a release is created.

## P0 Fixture Gates

```text
release_package_parity_build_common_dirs_are_explicit
release_package_parity_common_files_are_explicit
release_package_parity_quarantined_css_is_packaged_but_not_manifest_loaded
release_package_parity_build_has_no_committed_package_manifest
release_package_parity_generated_shells_have_source_output_freshness_manifest
release_package_parity_build_does_not_mutate_readme_during_package_dry_run
release_package_parity_browser_manifest_validation_covers_permissions_and_resources
release_package_parity_github_release_is_draft_until_all_assets_upload
release_package_parity_mobile_artifacts_have_checksum_and_claim_gate
release_package_parity_raw_captures_never_enter_package_contents
```

## Safe Next Work

- Add a dry-run command that writes a package manifest without publishing.
- Compare expected package contents against manifest-loaded and
  web-accessible-resource lists.
- Keep quarantined CSS either explicitly excluded or explicitly recorded as
  packaged-but-unloaded.
- Generate checksums for browser ZIPs and Android artifacts before any public
  release object becomes visible.
- Keep raw captures ignored and extract only minimal runtime fixtures.

## First Optimization Metric Collector Parity Rollout Boundary Addendum

First optimization metric collector parity rollout boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-parity-rollout-boundary-current-behavior.test.mjs`
maps this release package parity boundary into first-collector parity and
rollout requirements. The addendum pins 12 collector parity rollout rows, 12
collector fixture provenance rows covered, 12 route/surface obligations covered,
2 evidence parity rollout rows covered, 8 parity and release boundary source
docs covered, 0 runtime collector parity rollout proofs approved, and 0
implementation-ready parity rollout rows. Runtime measurement remains separate
from package contents, generated shell freshness, quarantined files, mobile
artifacts, upload status, and public release claims.

## First Optimization Parity Rollout Contract Addendum

First optimization parity rollout contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs`
maps release package parity into the future `parity-rollout.json` contract
without creating rollout artifacts, package manifests, release assets, or public
claims. The addendum pins 12 parity rollout contract rows, 1 reserved parity
rollout path covered, 0 committed parity rollout files, 0 runtime metric
collector approvals, and 0 implementation-ready parity rollout contract rows.
Runtime measurement remains separate from package contents, generated output
freshness, mobile artifacts, upload state, and public release proof.

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
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, release package behavior, public release
claims, prompt release overlays, raw-capture packaging, whitelist behavior,
metric collectors, artifact creation, native sync, or release publication.
