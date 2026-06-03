# FilterTube Compress Video Script Failure Mode Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior proof. Runtime, build, website, and release
behavior are unchanged. This is not a script rewrite, asset optimization,
release pipeline change, or media recompression.

## Purpose

This addendum promotes `scripts/compress-video.swift` from the broader static
HTML/support-script surface into a direct failure-mode boundary. The script is a
manual optimization helper for video assets, so it is relevant to package size,
website media weight, release reproducibility, and code-burden cleanup. It is
not currently a build step or package script.

## Source Shape

```text
script path: scripts/compress-video.swift
counted source lines: 97
source bytes: 3339
source sha256: 196c1ebf918b94e3d36fd2bd04658c4fa4762a85ad5657b49ede7aaa93e2e36b

CompressionError enum block: 22 lines, 834 bytes
presetName(for:) block: 14 lines, 407 bytes
top-level driver block: 56 lines, 2054 bytes
destructive output preflight block: 8 lines, 271 bytes
export execution block: 24 lines, 845 bytes
size-report print block: 3 lines, 318 bytes
catch/exit block: 4 lines, 106 bytes
```

## Current Script Semantics

| Surface | Current behavior |
| --- | --- |
| Imports | `AVFoundation` and `Foundation`. |
| CLI arguments | Requires at least input and output path; optional preset label defaults to `540p`. |
| Presets | Supports `480p`, `540p`, `720p`, and `medium` through 4 `AVAssetExportPreset*` constants. |
| Exporter creation | Constructs `AVURLAsset` and `AVAssetExportSession` once in the top-level driver. |
| Existing output | If the output path exists, `try fileManager.removeItem(at: outputURL)` runs before `.mp4` support is checked. |
| File type check | Throws `unsupportedFileType` when `exporter.supportedFileTypes.contains(.mp4)` is false. |
| Modern export path | On macOS 15+, calls `try await exporter.export(to: outputURL, as: .mp4)`. |
| Legacy export path | Sets `outputURL`, sets `.mp4`, uses `DispatchSemaphore`, calls `exporter.exportAsynchronously`, waits, then switches on `exporter.status`. |
| Completion reporting | Reads input/output byte sizes with `attributesOfItem` and prints one compression summary line. |
| Failure reporting | Writes localized error text to stderr and exits `1`. |

Current primitive counts:

```text
CompressionError enum declarations: 1
CompressionError cases: 5
presetName(for:) functions: 1
AVAssetExportPreset tokens: 4
CommandLine.arguments reads: 1
AVURLAsset constructions: 1
AVAssetExportSession tokens: 2
fileExists checks: 1
removeItem calls: 1
supported .mp4 checks: 1
shouldOptimizeForNetworkUse writes: 1
modern export(to:as:) calls: 1
legacy exportAsynchronously calls: 1
DispatchSemaphore/semaphore tokens: 3
exporter.status switches: 1
attributesOfItem reads: 2
stdout print calls: 1
stderr writes: 1
exit(1) calls: 1
```

## Integration Boundary

Current package/build integration is absent:

```text
package.json scripts referencing compress-video: 0
build.js compress-video references: 0
test-lane classifier references to scripts/compress-video.swift: 1
release/build/website media callers outside scripts/compress-video.swift: 0
```

`scripts/test-lane-config.mjs` mentions the helper only to route changes in the
manual compression script through release and smoke proof lanes. That
classification is not a build step, package script, or website media manifest.

Current website/media references are also split:

- `website/components/route-content.js` serves
  `/videos/homepage/day/homepage_hero_day.mp4` and
  `/videos/ios/ios_hero_slow_540.mp4`.
- `website/assets/videos/README.md` documents homepage video source/output
  expectations.
- `docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md` records an `ffmpeg` command
  for the iOS public video, not a `compress-video.swift` invocation.
- No committed media manifest maps `scripts/compress-video.swift` inputs,
  presets, outputs, hashes, dimensions, route consumers, and release claims.

## Failure Mode Boundary

The important current ordering is:

```text
1. create exporter
2. delete existing output if present
3. check whether exporter supports .mp4
4. configure export
5. write output through modern or legacy AVFoundation path
```

That means an existing output file can be removed before unsupported file type,
export failure, cancellation, process interruption, or unexpected status is
reported. The script has no current dry-run mode, no temporary output path, no
atomic move/replace step, no output checksum manifest, no source-output mapping,
and no package-script gate.

This does not prove that the script is unsafe in every manual use. It proves
that the current source lacks the artifacts needed before the script can be
treated as a release optimization authority.

## Missing Authority Symbols

No product runtime, build, website, package metadata, tracked media, or support
script source currently defines:

```text
compressVideoFailureModeBoundaryContract
compressVideoPresetManifest
compressVideoOutputDestructionReport
compressVideoDryRunPlan
compressVideoTemporaryOutputContract
compressVideoAtomicReplacementContract
compressVideoSourceOutputManifest
compressVideoPackageScriptGate
compressVideoMediaBudgetReport
compressVideoFailureFixtureProvenance
```

## Completion Boundary

This addendum does not close the `scripts/compress-video.swift` tracked-file
obligation. It proves only the current behavior: the helper exists, can write
MP4 through AVFoundation, is not wired into package/build scripts, deletes an
existing output before export success is known, and lacks dry-run, temporary
output, atomic replacement, checksum/source-output manifest, failure fixture,
and release-media budget proof.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this static/generated/asset package surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, asset optimization, generated-output
cleanup, package pruning, CSS activation/deletion, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
