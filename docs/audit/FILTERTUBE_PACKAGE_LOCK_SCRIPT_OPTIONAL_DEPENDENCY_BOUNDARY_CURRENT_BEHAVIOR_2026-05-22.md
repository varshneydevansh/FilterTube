# FilterTube Package Lock Script/Optional Dependency Boundary - Current Behavior (2026-05-22)

Status: audit-only proof. Runtime behavior is unchanged. This is not an implementation patch.
It is not a package upgrade, dependency cleanup, install-policy change, build
change, release change, or JSON filtering behavior change.

## Scope

This boundary promotes the open root and website package metadata rows from
broad dependency coverage toward direct JSON-path proof for package lockfiles.
It covers:

- `package.json`
- `package-lock.json`
- `website/package.json`
- `website/package-lock.json`

These files are JSON configuration and release/build inputs. They are not
YouTube response JSON, but they still need first-class schema, install, package,
license, dependency-health, and reproducibility proof before code-burden or
release optimization changes.

Implementation changes remain blocked. This document only pins current package
lock behavior and the proof still missing before dependency or packaging work.

## File Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `package.json` | 61 | 2,405 | `36053d322780ce787de403be574cc400936ef2a994b4c8eca62561154fe81aec` |
| `package-lock.json` | 1,461 | 49,916 | `f52d6482693be9cd4edacdc1f1491b4d2cda796522bfd0e4dcf86e0c879ad974` |
| `website/package.json` | 23 | 477 | `881918c3694fca755065dd9e29cb24613fa35af162c174dd8e68bf273ac62351` |
| `website/package-lock.json` | 1,678 | 55,337 | `468e8779d0c2826fb258a783ffe88a735b3269964c23ad510ae3118ac17b6b10` |

## Root Package JSON Path Facts

`package.json` currently declares:

- name: `filtertube`
- version: `3.3.2`
- 27 scripts
- 2 direct runtime dependencies: `preact`, `qrcode`
- 3 direct development dependencies: `archiver`, `esbuild`, `fs-extra`
- no `private`, `engines`, or `packageManager` field
- conventional `test` script: `node scripts/run-test-lane.mjs smoke`; full historical audit execution is `audit:runtime`

`package-lock.json` currently pins:

- lockfileVersion: 3
- total `packages` entries: 112
- non-root package entries: 111
- root package name/version: `filtertube` / `3.3.2`
- root dependency keys matching `package.json`: `preact`, `qrcode`
- root devDependency keys matching `package.json`: `archiver`, `esbuild`, `fs-extra`
- non-root package entries with missing `integrity`: 0
- non-root package entries with missing `resolved`: 0
- non-root package entries with missing `license`: 0
- resolved hosts: `registry.npmjs.org` for all 111 non-root entries

Root lifecycle and executable-entry facts:

- `hasInstallScript` entries: 1 (`node_modules/esbuild`)
- `bin` entries: 3 (`node_modules/crc-32`, `node_modules/esbuild`, `node_modules/qrcode`)
- optional package entries: 26, all in the `@esbuild/*` platform package family
- dev package entries: 81
- peer dependency entries: 0
- entries with `optionalDependencies`: 2 (`node_modules/esbuild`, `node_modules/jsonfile`)
- bundled marker entries: 0
- package entries with `engines`: 66

Root non-root license counts:

- `MIT`: 92
- `ISC`: 16
- `Apache-2.0`: 2
- `BSD-3-Clause`: 1

## Website Package JSON Path Facts

`website/package.json` currently declares:

- name: `filtertube-website`
- private package: true
- version: `1.0.0`
- 3 scripts: `dev`, `build`, `start`
- engine: `node` = `22.x`
- 8 direct dependencies: `@phosphor-icons/react`, `@tailwindcss/postcss`,
  `@vercel/analytics`, `next`, `postcss`, `react`, `react-dom`, `tailwindcss`
- no `devDependencies`
- no website-local `test`, `lint`, screenshot, route-smoke, dependency-repro,
  audit, or deploy-proof script

`website/package-lock.json` currently pins:

- lockfileVersion: 3
- total `packages` entries: 101
- non-root package entries: 100
- root package name/version: `filtertube-website` / `1.0.0`
- root dependency keys matching `website/package.json`: all 8 direct
  dependencies listed above
- root engine matching `website/package.json`: `node` = `22.x`
- non-root package entries with missing `integrity`: 6
- non-root package entries with missing `resolved`: 6
- non-root package entries with missing `license`: 0
- resolved hosts: `registry.npmjs.org` for 94 non-root entries

The six no-integrity/no-resolved entries are bundled nested dependencies under
`node_modules/@tailwindcss/oxide-wasm32-wasi`:

- `node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/core`
- `node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/runtime`
- `node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/wasi-threads`
- `node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@napi-rs/wasm-runtime`
- `node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@tybys/wasm-util`
- `node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/tslib`

Website lifecycle and executable-entry facts:

- `hasInstallScript` entries: 1 (`node_modules/sharp`)
- `bin` entries: 5 (`node_modules/baseline-browser-mapping`, `node_modules/jiti`,
  `node_modules/nanoid`, `node_modules/next`, `node_modules/semver`)
- optional package entries: 65, mostly Next/SWC, Sharp/libvips, Tailwind oxide,
  Lightning CSS, Semver, and Sharp platform package families
- dev package entries: 0
- peer dependency entries: 5 (`node_modules/@phosphor-icons/react`,
  `node_modules/@vercel/analytics`, `node_modules/next`,
  `node_modules/react-dom`, `node_modules/styled-jsx`)
- entries with `optionalDependencies`: 14
- bundled marker entries: 7, all in or under
  `node_modules/@tailwindcss/oxide-wasm32-wasi`
- package entries with `engines`: 64

Website non-root license counts:

- `MIT`: 53
- `Apache-2.0`: 14
- `LGPL-3.0-or-later`: 10
- `Apache-2.0 AND LGPL-3.0-or-later AND MIT`: 1
- `Apache-2.0 AND LGPL-3.0-or-later`: 3
- `0BSD`: 2
- `CC-BY-4.0`: 1
- `ISC`: 3
- `MPL-2.0`: 12
- `BSD-3-Clause`: 1

## Current Risk Boundary

| Risk family | Current evidence | Missing before implementation |
| --- | --- | --- |
| install lifecycle | Root `esbuild` and website `sharp` have lockfile install-script markers. | Lifecycle-script allowlist, clean install transcript, platform result matrix, and CI policy. |
| executable entry points | Root lockfile has 3 `bin` entries; website lockfile has 5. | Script invocation report and release/package executable-entry policy. |
| optional platform packages | Root has 26 optional entries; website has 65. | Platform/package-family manifest and install-size/runtime relevance budget. |
| integrity exceptions | Website has 6 no-integrity/no-resolved bundled nested entries. | Bundled dependency explanation tied to package manager, clean install, and artifact hash proof. |
| license policy | Root and website lockfiles include permissive, copyleft-adjacent, and mixed license strings. | Dependency license policy and release artifact license report. |
| JSON config authority | Package JSON and lockfile JSON paths are pinned but not schema-authority backed. | First-class JSON config gate, JSON schema report, lockfile/package parity report, and reproducible install gate. |
| code burden | Optional platform packages and transitive toolchain packages increase package surface. | Dependency-burden budget, deletion/upgrade decision report, and generated bundle impact report. |
| release proof | Lockfiles prove current package graph only. | Current revision clean install, build, package artifact, checksum, and publish-proof evidence. |

## Explicit Non-Completion Boundary

This slice does not prove dependency health, clean-install reproducibility,
license compliance, package artifact contents, vulnerability status, deploy
parity, generated bundle freshness, or permission to upgrade/delete packages.

Future implementation or release work still needs:

- `packageLockScriptOptionalDependencyBoundaryContract`
- `packageLockLifecycleScriptReport`
- `packageLockOptionalPlatformPackageReport`
- `packageLockBinEntryReport`
- `packageLockIntegrityExceptionReport`
- `packageLockReproducibleInstallGate`
- `packageLockLicensePolicyReport`
- `packageLockFirstClassJsonConfigGate`
- `packageLockDependencyBurdenBudget`
- `packageLockReleaseArtifactDependencyReport`

None of those authorities exists in selected product source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this static/generated/asset package surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, asset optimization, generated-output
cleanup, package pruning, CSS activation/deletion, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
