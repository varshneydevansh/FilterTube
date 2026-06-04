# FilterTube Media Asset Duplicate And Derivative Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior proof. Runtime behavior is unchanged.

This is not an implementation patch, asset optimization patch, website media
change, package cleanup, release approval, or public-claim gate. This slice
promotes media optimization from broad website/asset and support-script notes
into direct file, route, package, and derivative proof for the current tracked
MP4 media set.

## Source Boundary

```text
tracked media/provenance files: 10
tracked MP4 files: 6
tracked MP4 bytes: 50,128,618
tracked media text/provenance files: 4
tracked media text/provenance bytes: 5,999
homepage duplicate group files: 3
homepage duplicate group bytes: 37,258,272
homepage duplicate overhead beyond one retained copy: 24,838,848
iOS derivative source bytes: 6,152,963
iOS derivative public bytes: 2,179,940
iOS derivative byte reduction: 3,973,023
extension ambient video source/output references: 4
website served media URL references: 2
website unreferenced public homepage alias source references: 0
package scripts referencing compress-video: 0
build.js compress-video references: 0
tracked non-doc source callers outside scripts/compress-video.swift: 0
runtime behavior changed: no
```

## MP4 File Register

| Path | Bytes | SHA-256 | Current role |
| --- | ---: | --- | --- |
| `assets/images/homepage_hero_day.mp4` | 4,537,443 | `9b1e853b60c861de124821161444ff54c0318b1a88f9c632a38128306811df74` | Extension popup/dashboard ambient video copied by root browser package builds. |
| `website/assets/videos/homepage/day/homepage_hero_day.mp4` | 12,419,424 | `3cf0edad24d9301bb3c43f3427996c8b364cd489a391c0d7ba917e58018b47f3` | Website source homepage video asset. |
| `website/public/videos/homepage/day/homepage_hero_day.mp4` | 12,419,424 | `3cf0edad24d9301bb3c43f3427996c8b364cd489a391c0d7ba917e58018b47f3` | Website served homepage hero video path used by route source. |
| `website/public/videos/homepage/homepage_hero_day.mp4` | 12,419,424 | `3cf0edad24d9301bb3c43f3427996c8b364cd489a391c0d7ba917e58018b47f3` | Website public homepage alias with no current tracked source URL reference. |
| `website/assets/videos/ios/ios.mp4` | 6,152,963 | `6a6b2b08fe198440ca1e25695f3029d9311039d5ce3d75e30c171d4fe5ebd463` | Website iOS source video. |
| `website/public/videos/ios/ios_hero_slow_540.mp4` | 2,179,940 | `00da591840296f2c0005dbb83800a6987edad7efda1536cf7b20304f92ba78fc` | Website served compressed iOS hero video path used by route source. |

## Text Provenance Register

| Path | Lines | Bytes | SHA-256 | Current role |
| --- | ---: | ---: | --- | --- |
| `website/assets/videos/README.md` | 61 | 1,681 | `c321b21761749792069312d52d297900071494d116c4a7af2a905f759e58137f` | Website media process notes. |
| `website/assets/videos/homepage/dawn/prompt.txt` | 13 | 1,441 | `ca487df5e75359a0fa8ceac72d43977351cdc223a179fcdcf2dd10ccbde1e4db` | Prompt-only homepage variant input. |
| `website/assets/videos/homepage/night/prompt.txt` | 13 | 1,439 | `a90a86b6bea54ef6a1275636d97d0b4ec57556378f595b56c7f053e42db9061e` | Prompt-only homepage variant input. |
| `website/assets/videos/homepage/sunset/prompt.txt` | 13 | 1,438 | `f67cbbea5c8abba14d2b4e4762681839a956776438e033b6bd01d5917354455a` | Prompt-only homepage variant input. |

## Current Consumer And Package Facts

- `build.js` still copies the root `assets` directory into browser extension
  packages through `COMMON_DIRS = js, css, html, icons, data, assets`.
- `src/extension-shell/popup.jsx`, `src/extension-shell/tab-view-decor.jsx`,
  `js/ui-shell/popup-shell.js`, and `js/ui-shell/tab-view-decor.js` all refer
  to `../assets/images/homepage_hero_day.mp4`.
- `website/components/route-content.js` exports
  `/videos/homepage/day/homepage_hero_day.mp4` as the homepage hero video and
  uses `/videos/ios/ios_hero_slow_540.mp4` for the iOS media row.
- No tracked website source currently references
  `/videos/homepage/homepage_hero_day.mp4`, even though that byte-identical
  public alias is tracked.
- The three tracked website homepage MP4s with hash
  `3cf0edad24d9301bb3c43f3427996c8b364cd489a391c0d7ba917e58018b47f3`
  account for 37,258,272 bytes. Keeping more than one current copy adds
  24,838,848 duplicate bytes before any deploy or package artifact exists.
- The iOS public video is smaller than `website/assets/videos/ios/ios.mp4` by
  3,973,023 bytes, but no tracked media derivative manifest ties source hash,
  output hash, command, route consumer, or budget.
- `docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md` records an `ffmpeg` command
  for the iOS derivative. `scripts/compress-video.swift` is not called by
  `package.json`, `build.js`, or tracked non-doc source.

## Optimization And Code-Burden Risks

1. Extension and website media are split across root `assets/images`,
   `website/assets/videos`, and `website/public/videos` without a shared media
   manifest.
2. The website homepage video has three tracked byte-identical copies, one of
   which is a public alias with no current source URL reference.
3. The extension ambient video is package-copied into browser builds as a root
   asset and is separate from the website homepage media family.
4. The iOS public served video is a derivative of a larger tracked source
   video, but the proof is changelog text plus current file hashes rather than
   an executable derivative record.
5. Prompt text files describe unserved homepage variants, but no current route
   or package policy classifies them as retained inputs, stale inputs, or
   deletion-ready evidence.

## Missing Runtime Or Build Authority Symbols

No tracked product, website, build, or support source currently implements:

- `mediaAssetDuplicateDerivativeBoundaryContract`
- `mediaAssetProvenanceManifest`
- `mediaDerivativeManifest`
- `mediaByteBudgetReport`
- `mediaRouteConsumerReport`
- `extensionWebsiteMediaSplitPolicy`
- `mediaDuplicateCleanupGate`
- `mediaCompressionCommandProvenance`
- `mediaReducedMotionBudget`
- `mediaPackageSizeBudget`
- `mediaArtifactHashManifest`

## Non-Completion Boundary

This proof does not close the media optimization, package, website asset,
public-claim, or support-script rows. Before optimizing, deleting, replacing,
or moving any MP4 asset, future work still needs route/render evidence,
package/deploy artifact proof, reduced-motion and startup budgets, derivative
command provenance, source/output hash manifests, duplicate-cleanup gates,
browser ZIP size budgets, and public-claim artifact gates.

## Runnable Proof

```bash
node --test tests/runtime/media-asset-duplicate-derivative-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this static/generated/asset package surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, asset optimization, generated-output
cleanup, package pruning, CSS activation/deletion, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
