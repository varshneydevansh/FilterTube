# FilterTube Quarantined Content CSS Package Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior package boundary. Runtime, build, and
packaging behavior are unchanged. This is not CSS deletion readiness,
reactivation readiness, a manifest change, or package pruning.

## Purpose

This addendum promotes the three quarantined root content CSS files into a
direct package/load boundary. The broader CSS load register already classified
them as packaged-but-inactive CSS. This slice pins the exact source counters,
manifest absence, extension HTML absence, dist package inclusion, old
default-hide/reveal behavior, and missing activation/deletion gates before any
optimization or first-class JSON filtering implementation relies on removing or
reactivating them.

## Quarantined CSS Source Set

Selected quarantined content CSS files: 3.

```text
selected counted source lines: 1262
selected source bytes: 43883
selected lexical rule blocks: 137
selected !important declarations: 478
selected display:none declarations: 22
selected :not(.filter-tube-visible) clauses: 72
selected filter-tube-visible tokens: 167
selected filtertube-hidden tokens: 6
selected :has(...) selectors: 14
selected clip-path declarations: 1
selected pointer-events:none declarations: 8
selected visibility:hidden declarations: 10
selected opacity:0 declarations: 10
selected @media blocks: 0
selected @keyframes blocks: 0
selected [hidden] selectors: 0
```

| Path | Lines | Bytes | SHA-256 | Rule blocks | `!important` | `display:none` | `:not(.filter-tube-visible)` | `filter-tube-visible` | `filtertube-hidden` | `:has(...)` |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `css/content.css` | 385 | 12,890 | `442c6ad823ebed5075099036b057c29914b218b0bea9e823e9e0b216d771141b` | 45 | 113 | 6 | 5 | 35 | 0 | 0 |
| `css/filter.css` | 74 | 2,412 | `e2462d446b1a3738d937945eabf013ec05173224970b0c877593901aba5a5032` | 6 | 12 | 5 | 5 | 6 | 0 | 0 |
| `css/layout.css` | 803 | 28,581 | `9ae38491aeb2dc3a58027d4a005c6136042c66dc438786483285fdbd91cb1941` | 86 | 353 | 11 | 62 | 126 | 6 | 14 |

## Load And Package Evidence

```text
active manifest files checked: 4
active manifest content_script entries checked: 7
active manifest content script JS refs checked: 59
active manifest content script CSS refs checked: 0
active manifest web_accessible_resources entries checked: 4
active manifest web-accessible resource refs checked: 19
active manifest quarantined CSS content script refs: 0
active manifest quarantined CSS web-accessible refs: 0

dist manifest files checked: 3
dist manifest content_script entries checked: 5
dist manifest content script JS refs checked: 44
dist manifest content script CSS refs checked: 0
dist manifest web_accessible_resources entries checked: 3
dist manifest web-accessible resource refs checked: 14
dist manifest quarantined CSS content script refs: 0
dist manifest quarantined CSS web-accessible refs: 0

extension HTML files checked: 3
extension HTML link tags checked: 10
extension HTML quarantined CSS link refs: 0

packaged dist CSS copies: 9
dist CSS copies hash-match source: yes
```

The active manifest set is `manifest.json`, `manifest.chrome.json`,
`manifest.firefox.json`, and `manifest.opera.json`. The dist manifest set is
`dist/chrome/manifest.json`, `dist/firefox/manifest.json`, and
`dist/opera/manifest.json`.

`build.js` still includes `css` in `COMMON_DIRS`, and the build copy step still
copies each common directory with `fs.copySync(dir, path.join(targetDir, dir),
{ filter: filterFunc })`. As a result, these files are not active
content-script CSS today, but they are still shipped into:

- `dist/chrome/css/content.css`, `dist/chrome/css/filter.css`, and
  `dist/chrome/css/layout.css`.
- `dist/firefox/css/content.css`, `dist/firefox/css/filter.css`, and
  `dist/firefox/css/layout.css`.
- `dist/opera/css/content.css`, `dist/opera/css/filter.css`, and
  `dist/opera/css/layout.css`.

## Current Behavior Boundary

The selected files encode the old renderer CSS model:

```text
old quarantined model:
  default-hide renderer/card families with :not(.filter-tube-visible)
  reveal selected elements with .filter-tube-visible

current active runtime model:
  default-show content
  hide selected elements with .filtertube-hidden / .filtertube-hidden-shelf
```

Current non-doc tracked source outside the selected CSS files has only one
remaining `filter-tube-visible` consumer: `js/layout.js` with 32 token
occurrences. That file is separately package-quarantined and not manifest-loaded.

The risk is asymmetric:

- Accidental manifest activation could false-hide renderer families that are not
  explicitly marked `.filter-tube-visible`.
- Silent deletion could hide package, dist, release, native parity, or fallback
  dependency drift because the files are still copied into browser packages.
- Keeping the files without a package decision preserves code-burden and review
  noise around an inactive behavior model.
- The broad `:has(...)`, `visibility:hidden`, `opacity:0`, and
  `pointer-events:none` selectors make this a false-hide/leak risk if activated
  without renderer and sibling-visible fixtures.

## Package And Activation Gates Still Missing

No product runtime, build, manifest, CSS, HTML, website, or tracked data source
currently defines:

```text
quarantinedContentCssPackageBoundaryContract
quarantinedContentCssManifestLoadReport
quarantinedContentCssDistCopyParityReport
quarantinedContentCssLegacyRevealPolicy
quarantinedContentCssActivationFixtureProvenance
quarantinedContentCssDeletionReadinessArtifact
quarantinedContentCssNativeSyncParityReport
quarantinedContentCssFalseHideFixtureReport
quarantinedContentCssPackageCleanupGate
quarantinedContentCssWebAccessiblePolicy
```

## Completion Boundary

This addendum does not close the `css/content.css`, `css/filter.css`, or
`css/layout.css` rows in the tracked-file obligation index. It proves only the
current package/load boundary: the files are inactive in manifests and extension
HTML, byte-identical in dist package copies, and risky to activate or delete
without explicit package cleanup, native/runtime parity, release artifact,
renderer fixture, false-hide, and first-class JSON/DOM parity proof.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this static/generated/asset package surface
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
optimization, JSON-first behavior, asset optimization, generated-output
cleanup, package pruning, CSS activation/deletion, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.


## October 18, 2026 manifest scope review

The prior manifest-count snapshot is historical. Source and currently built manifests include new embed and Google preview paths; all three quarantined stylesheets remain outside content scripts and web resources. Packaged copies must still hash-match source. `_locales` is an additional build root. This is a load-topology check, not FirefoxAndroid visual proof.

- active manifest files checked: 4
- active manifest content_script entries checked: 24
- active manifest content script JS refs checked: 168
- active manifest content script CSS refs checked: 0
- active manifest web_accessible_resources entries checked: 8
- active manifest web-accessible resource refs checked: 47
- active manifest quarantined CSS content script refs: 0
- active manifest quarantined CSS web-accessible refs: 0
- dist manifest files checked: 3
- dist manifest content_script entries checked: 18
- dist manifest content script JS refs checked: 125
- dist manifest content script CSS refs checked: 0
- dist manifest web_accessible_resources entries checked: 6
- dist manifest web-accessible resource refs checked: 35
- dist manifest quarantined CSS content script refs: 0
- dist manifest quarantined CSS web-accessible refs: 0
- extension HTML link tags checked: 10


## Opt-In Content Player Manifest Counts - 2026-10-22

The new runtime dependencies change only the manifest JS/resource totals below. All quarantine counts remain zero and packaged CSS bytes must still match source. Earlier counts are historical; no quarantined stylesheet is activated or deletion approved.

active manifest content script JS refs checked: 188
active manifest web-accessible resource refs checked: 51
dist manifest content script JS refs checked: 140
dist manifest web-accessible resource refs checked: 38


## Owned Resolver And Transport Script Closure Revalidation - 2026-10-22

The new resolver and indexed transport add two normal isolated script references per target. Quarantined content CSS remains unreferenced. Historical measurements remain dated. Current counters:

```text
active manifest content script JS refs checked: 196
dist manifest content script JS refs checked: 146
```


## Native Source Handoff Script Closure - 2026-10-22

The five-module isolated stack replaces the earlier seven-module overlay stack. Quarantined content CSS remains unreferenced. Final stage equality is checked after the build.

```text
active manifest content script JS refs checked: 188
dist manifest content script JS refs checked: 140
```

## Watch Notes source inventory update - 2026-10-23

active manifest content script JS refs checked: 192
active manifest web-accessible resource refs checked: 55
dist manifest content script JS refs checked: 143
dist manifest web-accessible resource refs checked: 41
extension HTML files checked: 4
extension HTML link tags checked: 11

Notes adds a private extension stylesheet; the three quarantined CSS files remain inactive.

## Auto-sync source inventory - 2026-10-24

extension HTML files checked: 4
extension HTML link tags checked: 12
extension HTML quarantined CSS link refs: 0

The extra dashboard stylesheet is css/device-auto-sync.css. It does not activate any quarantined content CSS. Existing packaging and manifest no-content-CSS assertions remain unchanged.

## Page tone source inventory - 2026-11-01

extension HTML files checked: 4
extension HTML link tags checked: 14
extension HTML quarantined CSS link refs: 0

The popup and dashboard each load css/page-tones.css last. It does not activate any quarantined content CSS. Existing packaging and manifest no-content-CSS assertions remain unchanged.
