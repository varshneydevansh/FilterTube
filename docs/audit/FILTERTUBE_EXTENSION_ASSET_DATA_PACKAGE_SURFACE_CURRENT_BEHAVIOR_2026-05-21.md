# FilterTube Extension Asset And Data Package Surface - Current Behavior

Date: 2026-05-21

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch, asset optimization, package cleanup, release approval, or
design-token migration.

This slice extends the active audit goal for tracked extension static assets,
packaged release data, and design inputs. It covers the open tracked-file rows
for `assets/images/*`, `icons/*`, `data/release_notes.json`, and
`design/design_tokens.json`.

## Tracked Asset/Data Surface

The tracked extension asset/data surface has 12 files and 8,372,040 bytes:

| Family | Files | Bytes | Current package role |
| --- | ---: | ---: | --- |
| `assets/images` | 3 | 8,327,776 | Copied wholesale by `build.js`; popup/dashboard ambient video and app-release artwork |
| `icons` | 7 | 19,342 | Copied wholesale by `build.js`; browser manifest icons plus one web-accessible menu asset |
| `data` | 1 | 23,020 | Copied wholesale by `build.js`; release-note data loaded by background and dashboard |
| `design` | 1 | 1,902 | Tracked design input; not copied by `build.js` current `COMMON_DIRS` |

Current file fingerprints:

| Path | Bytes | Shape / structure | SHA-256 |
| --- | ---: | --- | --- |
| `assets/images/Android_icon.png` | 2,203,736 | PNG 1536x1024 | `201e1b73771f39ad033241da2b20318aeaad1d81f72398b6099fc122d3df3cb0` |
| `assets/images/iOS_icon.png` | 1,586,597 | PNG 1536x1024 | `f165dd8170531ba1f467ad7a8e5c54b2715c2559c5ea0c6688cfbf03e6763689` |
| `assets/images/homepage_hero_day.mp4` | 4,537,443 | MP4 top-level boxes `ftyp`, `moov`, `mdat` | `9b1e853b60c861de124821161444ff54c0318b1a88f9c632a38128306811df74` |
| `icons/file.svg` | 3,818 | SVG `viewBox="0 0 128 128"` | `05cdc5bc1eeacc9530ec299f54e1c1465e4ba153e378b4ba845f8b3fcfc0cfff` |
| `icons/icon-128.png` | 3,406 | PNG 128x128 | `2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755` |
| `icons/icon-128.svg` | 5,434 | SVG width/height 128 | `c2168cc276e6070153b7ff7bb8298ed5b7f2291bc9919e70c665f90fd7d9da20` |
| `icons/icon-16.png` | 805 | PNG 16x16 | `37170ccc769506289cf2e2f0460142bc0ab715208e6c4bf395e4871cd13dde6b` |
| `icons/icon-32.png` | 1,396 | PNG 32x32 | `5e7b427aed06912c51fce9982bbbccc5b51b570f3c038c703f39d4816cbe75bf` |
| `icons/icon-48.png` | 1,650 | PNG 48x48 | `87c4199c7734d686f875b5086a6e7d7979667cfd09b8291cbb480bb703870a53` |
| `icons/icon-64.png` | 2,833 | PNG 64x64 | `da1f8d1e10a4a9f2a81a81dae309b1c431de24040650243386a725a33e72de88` |
| `data/release_notes.json` | 23,020 | 24 JSON rows: 1 comment row plus 23 version rows | `a8d59b18e9bffd1c828538ee58b3b8e9be7c641fea3ff064220311485a3b1c6b` |
| `design/design_tokens.json` | 1,902 | 6 color groups plus typography, spacing, radiuses, shadows | `57bada64f3690a22fedea5f07aadc029e129f971465f8c66baab4a005984b3f0` |

## Build And Manifest Inclusion

`build.js` currently defines:

```text
COMMON_DIRS = js, css, html, icons, data, assets
COMMON_FILES = README.md, CHANGELOG.md, LICENSE
```

That means browser packages copy every current root `assets/images`, `icons`,
and `data` file. The tracked `design` directory is not package-copied by the
current build script.

All four browser manifests use the same action and extension icon PNG paths:

- action default icon: `icons/icon-16.png`, `icons/icon-48.png`,
  `icons/icon-128.png`
- extension icons: `icons/icon-16.png`, `icons/icon-32.png`,
  `icons/icon-48.png`, `icons/icon-128.png`

`icons/icon-64.png` and `icons/icon-128.svg` are copied into browser packages
through `COMMON_DIRS`, but they are not referenced by current manifests.

`icons/file.svg` is web-accessible in `manifest.json`, `manifest.chrome.json`,
and `manifest.firefox.json`, but not in `manifest.opera.json`. This repeats the
browser resource parity risk from the manifest audit with a concrete asset
fingerprint and package-copy fact.

## Extension UI Asset Consumers

The generated extension UI shell source uses the root ambient video:

- `src/extension-shell/popup.jsx:21`
- `src/extension-shell/tab-view-decor.jsx:17`
- generated outputs `js/ui-shell/popup-shell.js` and
  `js/ui-shell/tab-view-decor.js`

The video tag currently uses `autoPlay`, `loop`, `muted`, `playsInline`, and
`preload="metadata"`. That is a UI performance and reduced-motion proof gap,
not a filtering behavior fact.

`html/tab-view.html` uses the app artwork in the dashboard release cards:

- `assets/images/Android_icon.png` appears twice at `html/tab-view.html:207`
  and `html/tab-view.html:213`.
- `assets/images/iOS_icon.png` appears twice at `html/tab-view.html:223` and
  `html/tab-view.html:229`.

The large app PNGs are loaded directly; no thumbnail or responsive derivative
manifest exists today.

## Release Notes Data

`data/release_notes.json` currently has one comment row and 23 version rows.
The first version row is current `3.3.2`, matching `package.json` and all four
browser manifests. The current package version has a matching release-note
entry and every version row has a `detailsUrl`.

Runtime consumers:

- `js/background.js:1722` fetches
  `browserAPI.runtime.getURL('data/release_notes.json')`.
- `js/background.js:1737` builds the YouTube release-banner payload from the
  requested version.
- `js/tab-view.js:2661` uses `runtimeAPI.runtime.getURL('data/release_notes.json')`
  when available, with a local relative fallback for dashboard rendering.

This file is package-copied for browser extensions, but the native runtime sync
audit already records that the current app runtime manifest excludes
`data/release_notes.json`. Release copy parity therefore remains a public-claim
and app-sync gate.

## Design Token Input Boundary

`design/design_tokens.json` has metadata version `0.1.0`, updated
`2025-11-18`, and the source label `FilterTube neuroinclusive palette`. It
defines 6 color groups: `brand`, `background`, `text`, `interactive`,
`status`, and `semantic`.

Current packaging and CSS facts:

- `build.js` does not copy `design`.
- Runtime HTML loads `css/design_tokens.css`, not the JSON file.
- The JSON `colors.brand.primaryRed` value is `#FF2F2F`.
- `css/design_tokens.css` currently sets `--ft-color-brand-primary: #ab4438;`
  and does not contain `#FF2F2F`.

So the tracked design JSON is a design/planning input today, not a packaged
runtime contract. Any future token migration needs parity proof between JSON,
CSS variables, extension UI, website UI, and generated shell output.

## Code-Burden And Optimization Findings

1. The root extension package includes 8,327,776 bytes of `assets/images`
   because `build.js` copies `assets` wholesale. This is release-size burden
   before any browser ZIP is created.
2. The 4,537,443-byte ambient video is used by both popup and dashboard shell
   decorations. There is no current asset byte budget, reduced-motion fixture,
   startup timing metric, or low-power fallback proof.
3. The Android and iOS app images are 1536x1024 PNG files totaling 3,790,333
   bytes and are used directly in tab-view app cards without tracked
   derivatives.
4. `icons/icon-64.png` and `icons/icon-128.svg` are packaged but manifest
   inactive. That is not deletion-ready because store/app identity and generated
   UI consumers still need a complete reference scan and package artifact proof.
5. `icons/file.svg` has browser web-accessible drift: default, Chrome, and
   Firefox expose it; Opera does not.
6. Release notes, package metadata, and browser manifests are aligned on
   `3.3.2` today. Future staged-copy edits still need an explicit
   release-version gate before publication.
7. Design token JSON and CSS token values currently diverge. Cleanup or token
   migration is blocked until a design-token parity report exists.

## Missing Authority Symbols

No product source currently implements:

- `extensionAssetPackageAuthority`
- `extensionStaticAssetManifest`
- `extensionAssetByteBudget`
- `extensionMediaReducedMotionProof`
- `extensionIconManifestParityReport`
- `extensionWebAccessibleIconParityDecision`
- `extensionReleaseNotesSchemaAuthority`
- `extensionReleaseNotesVersionGate`
- `extensionDesignTokenParityReport`
- `extensionAssetDeletionReadinessReport`

## Completion Boundary

This register does not close tracked-file obligations. It pins current package
copying, file fingerprints, manifest references, UI consumers, release-note
version parity, and design-token input drift. Before optimizing assets, deleting
manifest-inactive icons, changing release-note behavior, relying on mobile app
artwork in public copy, moving media into website/app bundles, or migrating
design tokens, future work still needs package artifact proof, byte and startup
budgets, visual fixtures, reduced-motion proof, store/app icon parity,
release-version gating, native/app parity, and deletion readiness proof.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this static/generated/asset package surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, asset optimization, generated-output
cleanup, package pruning, CSS activation/deletion, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
