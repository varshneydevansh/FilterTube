# FilterTube Root Package Metadata Script Surface - Current Behavior - 2026-05-21

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch.

## Purpose

This slice records the current root project metadata surface before any
optimization, release, dependency, JSON-first, or cleanup implementation work.
It covers the tracked root metadata family:

```text
.gitignore
CHANGELOG.md
LICENSE
README.md
channel-identity-watch-mix-collab-recovery-plan.md
package.json
package-lock.json
```

These files do not directly hide YouTube content, but they decide how engineers
build, audit, package, describe, and reason about the runtime. They therefore
affect reliability and code-burden risk, and they can make optimization or
first-class JSON filter work look safer than the runtime proof actually allows.

## File Fingerprints

Current tracked root metadata inventory: 7 files, 2,950 newline counts, and
134,214 bytes.

| File | Newline count | Bytes | SHA-256 |
|---|---:|---:|---|
| `.gitignore` | 153 | 2,197 | `c90a7834297cf0a7b65493f41a21947fd5d85d1e14740b902cb3a3664028e3ca` |
| `CHANGELOG.md` | 591 | 40,124 | `e22a87ce7eeb88d171587d4b0f4676881a2c3081a7fbf15978d7e8d8582cdfdd` |
| `LICENSE` | 21 | 1,073 | `d0739cbb6232b0fb9ea59347feaf412bab5042768aa02856b16af24bb35e9d9d` |
| `README.md` | 401 | 22,476 | `d006e9add205de3340dfae956b5566d7d397e950cfefe6400120c0ef123cbe43` |
| `channel-identity-watch-mix-collab-recovery-plan.md` | 262 | 16,023 | `01f82169b06d3752e318b20b956c8a4284ae80166686e5c40aeee66c957d108a` |
| `package.json` | 61 | 2,405 | `36053d322780ce787de403be574cc400936ef2a994b4c8eca62561154fe81aec` |
| `package-lock.json` | 1,461 | 49,916 | `f52d6482693be9cd4edacdc1f1491b4d2cda796522bfd0e4dcf86e0c879ad974` |

Any release, package, or optimization claim that uses these files should cite
the exact current file state or an updated fingerprint.

## Package Script Surface

`package.json` currently declares package version `3.3.2`, license `MIT`,
repository `git+https://github.com/varshneydevansh/FilterTube.git`, homepage
`https://github.com/varshneydevansh/FilterTube`, 2 runtime dependencies, 3
development dependencies, and 27 scripts.

Current scripts:

```text
build:nanah-vendor -> node scripts/build-nanah-vendor.mjs
build:ui -> node scripts/build-extension-ui.mjs
dev -> node build.js
build -> node build.js
build:chrome -> node build.js chrome
build:firefox -> node build.js firefox
build:opera -> node build.js opera
sync:native-runtime -> node scripts/sync-native-runtime.mjs
test -> node scripts/run-test-lane.mjs smoke
audit:runtime -> node --test tests/runtime/*.test.mjs
test:release -> node scripts/run-test-lane.mjs release
test:whitelist -> node scripts/run-test-lane.mjs whitelist
test:blocking -> node scripts/run-test-lane.mjs blocking
test:json -> node scripts/run-test-lane.mjs json
test:dom -> node scripts/run-test-lane.mjs dom
test:menu -> node scripts/run-test-lane.mjs menu
test:performance -> node scripts/run-test-lane.mjs performance
test:settings -> node scripts/run-test-lane.mjs settings
test:smoke -> node scripts/run-test-lane.mjs smoke
lanes:changed -> node scripts/run-test-lane.mjs --changed
test:changed -> node scripts/run-test-lane.mjs --run-changed
test:audit-drift -> node scripts/audit-proof-drift.mjs --lane-owned
smoke:youtube -> node docs/audit/artifacts/release-live-youtube-spa-smoke/run-live-smoke.mjs
smoke:youtube:verify -> node docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs
dev:chrome -> cp manifest.chrome.json manifest.json
dev:firefox -> cp manifest.firefox.json manifest.json
dev:opera -> cp manifest.opera.json manifest.json
```

Current package metadata does not declare `private`, `engines`,
or `packageManager`. The audit command exists as `audit:runtime`; focused
`test:*` lanes now call `scripts/run-test-lane.mjs`. `npm test` now runs the
smoke lane, giving contributors a conventional release-confidence entry point
without replacing `test:changed` for logical changes. `lanes:changed`
classifies current dirty paths into required focused lanes, and `test:changed`
runs those classified lanes sequentially. The live YouTube release smoke
handoff is exposed through `smoke:youtube` and `smoke:youtube:verify`; those
commands still require an installed Chrome/CDP session and a dated artifact
before they can count as release proof. The browser dev shortcuts still mutate tracked
`manifest.json` by copying a browser variant over it.

Risk classification:

| Risk | Current behavior | Missing gate |
|---|---|---|
| Release drift | `package.json`, `package-lock.json`, README badges, browser manifests, changelog, and release notes currently point at `3.3.2`; app-store/direct APK availability still depends on artifact proof. | `rootReleaseClaimGate` linking package version, manifest versions, changelog section, README badge, release notes row, website copy, and package artifact. |
| Audit discoverability | `audit:runtime`, focused `test:*` lanes, `npm test`, `lanes:changed`, `test:changed`, and live-smoke helper scripts exist. | `packageScriptExecutionGate` for release and local verification commands. |
| Dev manifest mutation | `dev:chrome`, `dev:firefox`, and `dev:opera` overwrite tracked `manifest.json`. | Dirty-worktree and manifest-parity gate before release or implementation review. |
| Native parity | `sync:native-runtime` delegates to a sibling app repo; normal `npm run build` does not invoke it. | Runtime sync freshness and app-boundary proof before claiming extension/app parity. |

## Lockfile Surface

`package-lock.json` is lockfile version 3 with 112 `packages` entries, including
the root package, 111 non-root packages, and 0 top-level `dependencies` entries.
All non-root package entries currently have an integrity value.

License counts across non-root package entries:

```text
MIT: 92
ISC: 16
Apache-2.0: 2
BSD-3-Clause: 1
```

Two locked packages currently carry deprecation metadata:

```text
node_modules/glob: Glob versions prior to v9 are no longer supported
node_modules/inflight: This module is not supported, and leaks memory...
```

The `inflight` deprecation is a code-burden and dependency-health signal, not a
runtime observer leak inside FilterTube product code. It should still block any
claim that the package graph has been dependency-reviewed or optimized.

Missing gate: no `packageLockReproducibilityReport` exists yet to connect
package install, Node/npm version, dependency license/deprecation review,
vendor-bundle freshness, generated UI freshness, and release ZIP contents.

## Public Root Documents

`README.md` is public release copy. It currently displays version `3.3.2`,
license `MIT`, total line count `534.3k`, JavaScript line count `81.9k`, and
links the download hub `https://filtertube.in/downloads`.

Current README claims relevant to optimization and JSON-first filtering:

- Large Blocklist Matching uses shared set-backed indexes so 200+ saved
  channels do not create renderer-by-renderer scan costs.
- JSON-backed surfaces can filter before paint when YouTube exposes needed
  fields.
- Channel identity is preferred from intercepted JSON and learned maps, while
  bounded fallback resolvers remain for weak targets.
- Current audit work is tightening no-rule, route, lifecycle, and resolver
  budgets.

`CHANGELOG.md` currently starts with `## Version 3.3.2`; `README.md` also links
to it as the detailed change history. `LICENSE` is the MIT license file.

`build.js` packages only these root common files into browser release outputs:

```text
README.md
CHANGELOG.md
LICENSE
```

The historical planning file
`channel-identity-watch-mix-collab-recovery-plan.md` is tracked, but it is not
copied by `build.js` as a browser package common file and is not referenced by
browser manifests. Its JSON-first wording is useful audit context only until
runtime fixtures and gates prove the exact behavior.

Missing gate: no `rootDocClaimParityReport` exists yet to prove public copy,
changelog, package metadata, release notes, website claims, package artifacts,
and runtime behavior describe the same shipped state.

## Gitignore Evidence Boundary

`.gitignore` excludes build output (`build/`, `dist/`, `release-artifacts/`,
`mobile-artifacts/`, `*.zip`, `*.apk`, `*.aab`, `website/.next/`) and many local
raw evidence captures such as `logs.json`, `comments.json`, `YT_MAIN.json`,
`YTM.json`, `YT_KIDS.json`, `get_watch?prettyPrint=false.json`, and
`watcher-collab-watchlist-spa-fix-plan.md`.

The file also documents commented-out lockfile ignore lines:

```text
# package-lock.json
# yarn.lock
```

Current behavior is that `package-lock.json` remains tracked and is not ignored.
Several raw JSON/HTML/text captures exist locally and are ignored; they are
evidence inputs, not product source, package inputs, or first-class runtime
filters.

Missing gate: no `rootGitignoreEvidenceBoundary` exists yet to promote a raw
capture into a reduced fixture with provenance, route, endpoint, expected
positive/negative behavior, side-effect policy, and deletion readiness.

## JSON-First And Optimization Boundary

The active audit is intentionally finding optimization locations before
implementation. Existing JSON-first audit slices already pin that optimization
is blocked until a first-class JSON filter contract records path syntax,
renderer ownership, field effect, route/surface, list mode, identity confidence,
mutation effect, no-work budget, fixture provenance, DOM parity, native parity,
and rollback/restore proof.

This root metadata slice adds the outer boundary around that work:

- README and changelog copy can claim JSON-first direction or performance
  improvements before every runtime path is proven.
- `package.json` can expose audit scripts, build scripts, and native sync
  wrappers, but it does not itself prove runtime behavior.
- `.gitignore` keeps many JSON captures out of tracked source; those captures
  must become reduced fixtures before they can drive first-class filter changes.
- `channel-identity-watch-mix-collab-recovery-plan.md` says JSON engine
  filtering should be restored first, but it remains a plan until runtime proof
  exists.

Missing gate: no `rootJsonFirstClaimGate` exists yet to connect public copy,
planning copy, package scripts, captured JSON fixtures, runtime rule paths,
and current-behavior tests before promoting more JSON paths as first-class
filters.

## Current Missing Authority Symbols

No product source currently defines:

```text
rootPackageMetadataAuthority
packageScriptExecutionGate
packageLockReproducibilityReport
rootDocClaimParityReport
rootGitignoreEvidenceBoundary
rootReleaseClaimGate
rootJsonFirstClaimGate
rootMetadataDeletionReadinessReport
```

## Non-Completion Boundary

This register does not close root-project-metadata tracked-file obligations.
Before optimizing, deleting, rewriting, packaging, or claiming first-class JSON
filter behavior through this metadata surface, future work still needs:

- package script execution proof for release, audit, generated UI, vendor, and
  native-sync paths;
- dependency reproducibility, license, deprecation, and generated-bundle
  freshness proof;
- public claim parity across README, changelog, release notes, website,
  manifests, and built artifacts;
- reduced JSON fixture provenance for ignored capture files;
- dirty-worktree and browser manifest parity gates for dev shortcut scripts;
- explicit JSON-first promotion gates before runtime code changes.

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
