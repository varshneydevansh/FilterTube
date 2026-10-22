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

Current tracked root metadata inventory: 7 files, 3,388 newline counts, and
178,350 bytes.

| File | Newline count | Bytes | SHA-256 |
|---|---:|---:|---|
| `.gitignore` | 157 | 2,275 | `f3033e094938bb4fc6ecf30aad468286f1dccd8d18db1c136e348ab087208bcd` |
| `CHANGELOG.md` | 938 | 75,511 | `e57906dca95911874ef251aa45d8c3a76df00df576b36277d9c0e9b9654c3036` |
| `LICENSE` | 21 | 1,073 | `d0739cbb6232b0fb9ea59347feaf412bab5042768aa02856b16af24bb35e9d9d` |
| `README.md` | 456 | 28,669 | `db3a973e936abd66a84ab7888e5f466fe7b0c1274f5b58aa999c4ea6b12fdbfd` |
| `channel-identity-watch-mix-collab-recovery-plan.md` | 262 | 16,023 | `01f82169b06d3752e318b20b956c8a4284ae80166686e5c40aeee66c957d108a` |
| `package.json` | 86 | 4,580 | `c9cb2c3c4fea302fa3946f462dbfbb474381a78946ca59adb653814d06a4de51` |
| `package-lock.json` | 1,468 | 50,219 | `84e60039228a76c10550d2e3922706ef2b7dd3671ef218a1d6e9263598cef33d` |

Any release, package, or optimization claim that uses these files should cite
the exact current file state or an updated fingerprint.

## Package Script Surface

`package.json` currently declares package version `3.4.1`, license `MIT`,
repository `git+https://github.com/varshneydevansh/FilterTube.git`, homepage
`https://github.com/varshneydevansh/FilterTube`, 3 runtime dependencies, 3
development dependencies, and 51 scripts.

Current scripts:

```text
build:nanah-vendor -> node scripts/build-nanah-vendor.mjs
build:qr-scanner-vendor -> node scripts/build-qr-scanner-vendor.mjs
build:ui -> node scripts/build-extension-ui.mjs
check:ui-locales -> node scripts/check-ui-locales.mjs
check:json-keys -> node scripts/check-json-keys.cjs
check:ui-locales:targets -> node scripts/check-ui-locales.mjs --require-all
check:release-note-locales -> node scripts/check-release-note-locales.mjs
check:release-note-locales:complete -> node scripts/check-release-note-locales.mjs --require-all
audit:ui-copy -> python3 scripts/audit-ui-copy.py
audit:ui-copy:complete -> python3 scripts/audit-ui-copy.py --require-complete
dev -> node build.js
build -> node build.js
build:chrome -> node build.js chrome
build:firefox -> node build.js firefox
build:opera -> node build.js opera
sync:native-runtime -> node scripts/sync-native-runtime.mjs
managed:extension-smoke -> node scripts/create-managed-extension-installed-smoke-artifact.mjs
managed:native-handoff -> node scripts/create-managed-native-runtime-sync-handoff.mjs
managed:provider-ownership -> node scripts/create-managed-pickup-provider-ownership-artifact.mjs
managed:app-parity-smoke -> node scripts/create-managed-app-parity-smoke-artifact.mjs
managed:provider -> node scripts/managed-delivery-provider.mjs
managed:nearby -> node scripts/managed-delivery-provider.mjs --lan-discovery
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
audit:family-devices:phase11 -> node scripts/report-family-device-phase11-status.mjs --next
audit:family-devices:phase11:strict -> node scripts/report-family-device-phase11-status.mjs --require-minimum-pass
audit:family-devices:phase12 -> node scripts/report-family-device-phase12-status.mjs --next
audit:family-devices:phase12:strict -> node scripts/report-family-device-phase12-status.mjs --require-complete
audit:family-devices:provider -> node scripts/report-family-device-provider-surface.mjs --strict
audit:family-devices:import -> node scripts/import-family-device-downloaded-evidence.mjs
audit:family-devices:log -> node scripts/update-family-device-evidence-log.mjs
audit:family-devices:release -> node scripts/report-family-device-release-readiness.mjs
audit:family-devices:checklist -> node scripts/create-family-device-capture-checklist.mjs
verify:managed-app-policy -> node scripts/verify-managed-app-policy-contract.mjs
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
| Release drift | `package.json`, `package-lock.json`, README badges, browser manifests, changelog, and release notes currently point at `3.4.1`; app-store/direct APK availability still depends on artifact proof. | `rootReleaseClaimGate` linking package version, manifest versions, changelog section, README badge, release notes row, website copy, and package artifact. |
| Audit discoverability | `audit:runtime`, focused `test:*` lanes, `npm test`, `lanes:changed`, `test:changed`, and live-smoke helper scripts exist. | `packageScriptExecutionGate` for release and local verification commands. |
| Dev manifest mutation | `dev:chrome`, `dev:firefox`, and `dev:opera` overwrite tracked `manifest.json`. | Dirty-worktree and manifest-parity gate before release or implementation review. |
| Native parity | `sync:native-runtime` delegates to a sibling app repo; normal `npm run build` does not invoke it. | Runtime sync freshness and app-boundary proof before claiming extension/app parity. |

## 2026-07-02 Managed Sync Release Close-Out Addendum

`docs/audit/FILTERTUBE_MANAGED_SYNC_RELEASE_CLOSEOUT_2026-07-02.md` is now the
current release-boundary reference for Family Device Updates, explicit Home
Pickup, explicit Internet Pickup, and lazy saved-update checks.

Root metadata remains consistent at version `3.3.2` across `package.json`,
browser manifests, README badges, changelog, and release-note data. The root
package scripts expose the managed provider, native-runtime sync, provider
ownership artifact, app parity artifact, and installed-extension smoke artifact
lanes, but those scripts do not by themselves prove hosted Internet Pickup,
automatic LAN discovery, or native app parity.

Release copy should say the extension supports live Send Update and optional
configured pickup paths for verified devices. It should not say FilterTube
auto-discovers LAN devices, owns a hosted pickup provider, or has complete
native parity until separate provider/app evidence exists.

## Lockfile Surface

`package-lock.json` is lockfile version 3 with 113 `packages` entries, including
the root package, 112 non-root packages, and 0 top-level `dependencies` entries.
All non-root package entries currently have an integrity value.

License counts across non-root package entries:

```text
MIT: 92
ISC: 16
Apache-2.0: 3
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

`README.md` is public release copy. It currently displays version `3.4.1`,
license `MIT`, total line count `534.5k`, JavaScript line count `81.9k`, and
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

`CHANGELOG.md` currently starts with `## Unreleased` and retains `## Version 3.4.1`; `README.md` also links
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

## 2026-10-18 Source Refresh

Current fingerprints, package version, 51 script entrypoints, jsqr dependency and 113 lockfile package entries were checked against source. The dated July close-out above remains historical, not current version proof. README aggregate LoC badges are generated estimates and change with tracked source; their numerical value is not a runtime guarantee. Public platform availability and installed/browser/native acceptance require their separate evidence.

## README Fingerprint Revalidation - 2026-10-22

The build-generated total-lines badge changed from 879.2k to 881.0k. The README remains 456 lines and 28,669 bytes; its SHA-256 above was recomputed from the current bytes. This refresh does not establish a published release, installed package parity, native build proof, or code coverage from a line-count badge.

## Popup And Streaming Build Fingerprint Revalidation - 2026-10-22

The frozen build refreshed only README badges: total lines changed from 881.0k to 881.9k and JavaScript lines from 121.3k to 121.5k. README remains 456 lines and 28,669 bytes; the current SHA-256 above was measured after the completed build. This pin refresh is not release publication, installed-package verification, or a code-coverage claim.


## Owned Playback Build Metadata Revalidation - 2026-10-22

The README generated line-count badges were refreshed by the build. Its line and byte totals are unchanged; only its current hash changes. Earlier hashes remain historical, and this pin supplies no new runtime, dependency or release-publication authority.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `README.md` | 456 | 28669 | `c86a3b7a701bbc48f653e3c916c464859317906ca1300805f027f7750932fa23` |


## Cold-Mount Coordinator Build Revalidation - 2026-10-22

The coordinator now retries a missing initial watch-page mount target at most twenty times at 500ms intervals, with cleanup on route/settings invalidation or successful mount. The final rebuild refreshed generated README line-count badges. Earlier hashes remain dated source checkpoints. This current pin is independent of installed playback acceptance.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `README.md` | 456 | 28669 | `93a31fb23de82c2bdb4b3d2da44be114dcf0ecc64fa771e7f8d05033e1b8e625` |


## Native Source Handoff Final Build Metadata - 2026-10-22

All three browser packages were rebuilt from the frozen native source. The README generated badge is pinned below. Package/source equality is checked independently; this is not installed playback, fullscreen, profile or release-publication acceptance. Earlier build hashes remain dated evidence.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `README.md` | 456 | 28669 | `a700c32e22dcbfc3ea8e68b40aa4320006b634fef1843d5f117e9e55bc691f3c` |


## Automatic Native Playback Final Build Metadata - 2026-10-23

All three browser packages were rebuilt from the frozen automatic playback source. The generated README badge is pinned below. Source/stage/archive parity is checked independently; this is not installed playback, profile or publication acceptance. Healthy admitted native media remains unchanged, and fresh source selection is attempted only when needed. Earlier build hashes remain historical.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `README.md` | 456 | 28669 | `8020a7f53a3380d7e47887c7d0c8c106953225a43b205f246da64e6ba75e6d93` |
