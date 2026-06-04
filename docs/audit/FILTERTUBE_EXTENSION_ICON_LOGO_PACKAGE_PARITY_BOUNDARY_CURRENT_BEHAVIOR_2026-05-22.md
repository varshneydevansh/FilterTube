# FilterTube Extension Icon Logo Package Parity Boundary - Current Behavior

Date: 2026-05-22

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch, icon replacement, package cleanup, website asset
migration, or release approval.

This slice extends the active audit goal for extension icon files, website logo
duplicates, browser manifests, static extension UI consumers, website metadata,
release/package burden, public identity claims, performance, code-burden, and
source/evidence boundaries. It narrows the broader asset/data package proof into
direct icon/logo parity proof before any asset deletion, optimization, or
first-viewport brand-image changes.

## Selected Source Files

The selected icon/logo surface has 10 tracked binary/vector files and 29,560
bytes:

| Path | Bytes | Shape | SHA-256 |
| --- | ---: | --- | --- |
| `icons/file.svg` | 3,818 | SVG `viewBox="0 0 128 128"` | `05cdc5bc1eeacc9530ec299f54e1c1465e4ba153e378b4ba845f8b3fcfc0cfff` |
| `icons/icon-128.png` | 3,406 | PNG 128x128 | `2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755` |
| `icons/icon-128.svg` | 5,434 | SVG width/height 128 | `c2168cc276e6070153b7ff7bb8298ed5b7f2291bc9919e70c665f90fd7d9da20` |
| `icons/icon-16.png` | 805 | PNG 16x16 | `37170ccc769506289cf2e2f0460142bc0ab715208e6c4bf395e4871cd13dde6b` |
| `icons/icon-32.png` | 1,396 | PNG 32x32 | `5e7b427aed06912c51fce9982bbbccc5b51b570f3c038c703f39d4816cbe75bf` |
| `icons/icon-48.png` | 1,650 | PNG 48x48 | `87c4199c7734d686f875b5086a6e7d7979667cfd09b8291cbb480bb703870a53` |
| `icons/icon-64.png` | 2,833 | PNG 64x64 | `da1f8d1e10a4a9f2a81a81dae309b1c431de24040650243386a725a33e72de88` |
| `website/app/icon.png` | 3,406 | PNG 128x128 | `2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755` |
| `website/assets/images/logo.png` | 3,406 | PNG 128x128 | `2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755` |
| `website/public/brand/logo.png` | 3,406 | PNG 128x128 | `2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755` |

The duplicate 128px PNG group is byte-identical across
`icons/icon-128.png`, `website/app/icon.png`,
`website/assets/images/logo.png`, and `website/public/brand/logo.png`. The
group is 13,624 bytes, so the duplicate overhead beyond one retained copy is
10,218 bytes. This is a code-burden finding only; it is not deletion-ready
because the files have different package and route roles.

## Manifest And Package Facts

`build.js` copies the root `icons` directory through `COMMON_DIRS = ['js',
'css', 'html', 'icons', 'data', 'assets']`.

All four browser manifests use the same extension icon set:

- action default icons: `icons/icon-16.png`, `icons/icon-48.png`,
  `icons/icon-128.png`
- extension icons: `icons/icon-16.png`, `icons/icon-32.png`,
  `icons/icon-48.png`, `icons/icon-128.png`

Across four manifests that is 28 active manifest icon references: 12 action
icon entries and 16 extension icon entries.

Current web-accessible icon parity is not uniform:

- `manifest.json`, `manifest.chrome.json`, and `manifest.firefox.json` expose
  `icons/file.svg`.
- `manifest.opera.json` does not expose `icons/file.svg`.

`icons/icon-64.png` and `icons/icon-128.svg` are copied into browser packages
through the root `icons` directory, but selected tracked non-doc source does not
reference those paths today. They are therefore manifest-inactive package
burden, not deletion candidates.

## Runtime And Website Consumers

Selected current consumers:

- `html/tab-view.html` references `../icons/icon-128.png` once for the dashboard
  logo image.
- `src/extension-shell/popup.jsx` references `../icons/icon-48.png` once.
- `js/ui-shell/popup-shell.js` references `../icons/icon-48.png` once.
- `website/app/layout.js` references `/brand/logo.png` twice, once for icon
  metadata and once for Open Graph images.
- `website/components/site-header.js` references `/brand/logo.png` once.

Current tracked source has no selected non-doc references to
`icons/icon-64.png`, `icons/icon-128.svg`, or
`website/assets/images/logo.png`.

`website/app/icon.png` is a Next app-route icon file by path convention rather
than a literal import in tracked source. `website/public/brand/logo.png` is the
served website brand image used by metadata and the header.

## Current Risk Findings

1. Extension browser packages copy all root icons, including two manifest
   inactive files: `icons/icon-64.png` and `icons/icon-128.svg`.
2. `icons/file.svg` has manifest parity drift: three browser manifests expose
   it as a web-accessible resource and Opera does not.
3. The website has three 128px logo/icon files that are byte-identical to the
   root extension 128px icon. This is small in bytes but important as a release
   and identity-governance burden.
4. `website/assets/images/logo.png` is tracked and byte-identical to the served
   public logo, but selected tracked website source currently uses
   `/brand/logo.png` rather than the source asset path.
5. No package artifact manifest proves which icon/logo files are shipped in each
   browser zip, website build artifact, native app bundle, or store listing.
6. No visual fixture proves icon parity across popup, dashboard, website header,
   metadata icons, store assets, Android/iOS handoff artwork, and native
   runtime copies.

## Missing Authority Symbols

No selected product/runtime source currently implements:

- `extensionIconLogoPackageParityContract`
- `extensionIconManifestReferenceReport`
- `extensionIconWebAccessibleParityReport`
- `extensionIconPackageInclusionReport`
- `extensionIconInactiveAssetDecision`
- `websiteLogoDuplicateManifest`
- `websiteLogoRouteConsumerReport`
- `iconLogoReleaseArtifactParityReport`
- `iconLogoVisualFixtureProvenance`
- `iconLogoDeletionReadinessGate`

## Completion Boundary

This register does not close tracked-file obligations. It pins current
icon/logo file fingerprints, duplicate identity, browser manifest references,
web-accessible-resource drift, package-copy behavior, extension UI consumers,
website route consumers, and missing authority symbols. Before deleting,
renaming, deduplicating, replacing, or optimizing any selected icon/logo file,
future work still needs package artifact proof, manifest parity reports,
website route artifact proof, native/store parity proof, visual fixtures,
metadata/browser-render proof, and an explicit deletion-readiness gate.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this static/generated/asset package surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, asset optimization, generated-output
cleanup, package pruning, CSS activation/deletion, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
