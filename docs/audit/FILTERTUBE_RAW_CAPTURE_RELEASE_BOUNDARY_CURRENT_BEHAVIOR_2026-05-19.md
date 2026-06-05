# FilterTube Raw Capture Release Boundary - Current Behavior - 2026-05-19

Status: current-behavior proof only. Runtime, build, website, and native sync
behavior are unchanged. The implementation gate remains closed.

This slice exists because the root ignored HTML/JSON/TXT captures are useful
evidence, but they are not product source and must not become release inputs by
accident. They helped build `docs/json_paths_encyclopedia.md` and
`docs/youtube_renderer_inventory.md`; future fixes should mine them into small
fixtures, not package or sync them directly.

## Current Boundary

```text
ignored root captures
  -> raw evidence only
  -> may be manually reduced into tests/runtime/fixtures/captures/*
  -> must not enter browser ZIPs, website source, native sync manifests,
     generated runtime bundles, public download claims, or release artifacts
```

## Current Build Facts

The browser package script copies explicit package roots:

```text
COMMON_DIRS = js, css, html, icons, data, assets
COMMON_FILES = README.md, CHANGELOG.md, LICENSE
```

It then zips the staged target directory, not the repository root. That current
shape keeps root captures out of package contents, but the safety is implicit:
there is still no committed `releasePackageParity` manifest that records every
packaged path, raw-capture exclusion, hash, quarantine status, and public claim.

## Proof Surfaces

| Surface | Current behavior | Risk |
| --- | --- | --- |
| `.gitignore` | Root captures such as `YT_MAIN.json`, `YT_KIDS.json`, `YTM.json`, `comments.json`, `playlist.json`, and collaboration captures are ignored. | A future release script could still copy from the repo root if not fixture-gated. |
| `build.js` | Copies explicit package dirs/files and zips from `targetDir`. | There is no raw-capture exclusion manifest; safety depends on copy roots. |
| Browser manifests | Do not reference raw capture filenames. | A future web-accessible-resource entry could expose raw evidence. |
| Website source | Should not reference raw capture filenames outside audit docs. | Public pages must not use local raw evidence as content/source. |
| Native sync manifest | Syncs selected runtime files from the public repo, not captures. | App release freshness gates must keep raw evidence out of native assets. |
| Extracted fixtures | Small committed fragments live under `tests/runtime/fixtures/captures/`. | Fixtures need source-family metadata and must remain small enough to audit. |

## Required Future Authority

Future token: `rawCaptureReleaseBoundary`

Required record shape:

```text
rawCaptureReleaseBoundary {
  captureName,
  ignored,
  tracked,
  usedByDocs,
  extractedFixturePaths[],
  packageIncluded,
  websiteReferenced,
  nativeSyncSource,
  generatedRuntimeInput,
  releaseClaimId,
  proofStatus
}
```

## Runnable Proof

```bash
node --test tests/runtime/raw-capture-release-boundary-current-behavior.test.mjs --test-reporter=spec
```

The test pins these facts:

- the audit document keeps the boundary current-behavior only,
- root captures remain ignored and untracked,
- `build.js` packages explicit directories/files and zips from staged output,
- active release/public surfaces do not reference raw capture filenames,
- native sync manifest sources/destinations exclude raw captures,
- extracted committed capture fixtures are small reduced fragments,
- product source has no `rawCaptureReleaseBoundary` implementation yet.

## First Optimization Metric Collector Parity Rollout Boundary Addendum

First optimization metric collector parity rollout boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-parity-rollout-boundary-current-behavior.test.mjs`
maps this raw capture release boundary into first-collector parity and rollout
requirements. The addendum pins 12 collector parity rollout rows, 12 collector
fixture provenance rows covered, 12 route/surface obligations covered, 2
evidence parity rollout rows covered, 8 parity and release boundary source docs
covered, 0 runtime collector parity rollout proofs approved, and 0
implementation-ready parity rollout rows. Raw captures remain evidence-only and
must not become JSON/DOM/native parity proof, package input, generated runtime
input, website content, release artifact, or public claim source.

## First Optimization Parity Rollout Contract Addendum

First optimization parity rollout contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs`
maps raw capture release exclusion into the future `parity-rollout.json`
contract without creating rollout artifacts, package inputs, generated runtime
inputs, website content, release assets, or public claims. The addendum pins 12
parity rollout contract rows, 1 reserved parity rollout path covered, 0
committed parity rollout files, 0 runtime metric collector approvals, and 0
implementation-ready parity rollout contract rows. Raw captures remain
evidence-only and cannot substitute for reduced fixtures, parity proof, package
proof, native sync proof, release proof, or public claim proof.

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
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6227
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6227
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
