# FilterTube Website Package / Config Dependency Surface - Current Behavior - 2026-05-21

Status: audit-only proof. Runtime behavior is unchanged.
This is not an implementation patch.

## Purpose

This slice promotes the tracked website package/config files from broad website
route context to a dedicated dependency and build-config audit boundary. It
covers reproducibility, build/deploy compatibility, website analytics scope,
performance risk, code-burden risk, and the package/deploy side of future
first-class JSON filter claims.

Covered tracked files:

```text
website/.gitignore
website/.vercelignore
website/jsconfig.json
website/next.config.mjs
website/package.json
website/package-lock.json
website/postcss.config.mjs
```

This does not prove a fresh website build, public deployment, route screenshot,
download claim, or first-class JSON artifact gate.

## Tracked File Fingerprints

| File | Newline count | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `website/.gitignore` | 1 | 8 | `56537ebe03160a28fdb6e59ae18f408d6f8aba609df73c45917c9358fd3bad52` |
| `website/.vercelignore` | 4 | 32 | `c75b041d4aebf02fc3d9c6d5476ea87c352b2d6ed6847dc78bdc3d68c6475c2f` |
| `website/jsconfig.json` | 10 | 109 | `4bb3b6b8c5a33e560cd100639fde580f7b098c805bb0caf908ac2ad6d45e8ef1` |
| `website/next.config.mjs` | 12 | 250 | `ab2d3beb7a94f0264112c0cdb5372d724cdf36c683c0d44005352021b257b9f6` |
| `website/package.json` | 23 | 477 | `881918c3694fca755065dd9e29cb24613fa35af162c174dd8e68bf273ac62351` |
| `website/package-lock.json` | 1,678 | 55,337 | `468e8779d0c2826fb258a783ffe88a735b3269964c23ad510ae3118ac17b6b10` |
| `website/postcss.config.mjs` | 5 | 70 | `5b0bc4c78be977cd81f947fb5563aaa7cc6d451e6f1c53a3260b7656a7144d20` |

Total tracked website package/config surface:

```text
7 files
1,733 newline counts
56,283 bytes
```

## Package Scripts And Engine

`website/package.json` currently declares:

```text
name: filtertube-website
private: true
version: 1.0.0
scripts: dev, build, start
engine: node 22.x
```

The scripts are plain Next.js commands:

```text
dev: next dev
build: next build
start: next start
```

There is no website-specific `test`, `lint`, `typecheck`, `format`,
`audit:runtime`, screenshot, route-smoke, dependency-repro, or deploy-proof
script in this package metadata today.

## Direct Dependency Intent

Declared direct dependencies:

| Package | Requested range | Locked version | Current role |
| --- | --- | --- | --- |
| `@phosphor-icons/react` | `^2.1.10` | `2.1.10` | Website icon components. |
| `@tailwindcss/postcss` | `^4.2.1` | `4.2.1` | Tailwind v4 PostCSS integration. |
| `@vercel/analytics` | `^2.0.1` | `2.0.1` | Website-only analytics integration. |
| `next` | `^16.1.6` | `16.1.6` | Website framework/build runtime. |
| `postcss` | `^8.5.8` | `8.5.8` | CSS processing dependency. |
| `react` | `^19.2.4` | `19.2.4` | React runtime. |
| `react-dom` | `^19.2.4` | `19.2.4` | React DOM runtime. |
| `tailwindcss` | `^4.2.1` | `4.2.1` | Tailwind CSS runtime package. |

Important engine boundaries:

```text
website package engine: node 22.x
next engine: >=20.9.0
@tailwindcss/oxide engine: >= 20
sharp engine: ^18.17.0 || ^20.3.0 || >=21.0.0
```

The package metadata has a Node engine but no committed `.nvmrc`, no
Corepack `packageManager`, and no website-local clean-install proof.

## Lockfile Reproducibility Snapshot

`website/package-lock.json` currently records:

```text
lockfileVersion: 3
packages entries: 101
non-root package entries: 100
optional package entries: 65
dev package entries: 0
deprecated package entries: 0
```

License counts among non-root entries:

| License | Count |
| --- | ---: |
| `MIT` | 53 |
| `Apache-2.0` | 14 |
| `MPL-2.0` | 12 |
| `LGPL-3.0-or-later` | 10 |
| `ISC` | 3 |
| `Apache-2.0 AND LGPL-3.0-or-later` | 3 |
| `0BSD` | 2 |
| `Apache-2.0 AND LGPL-3.0-or-later AND MIT` | 1 |
| `BSD-3-Clause` | 1 |
| `CC-BY-4.0` | 1 |

Six non-root package entries lack a top-level integrity value because they are
bundled optional dependencies nested under `@tailwindcss/oxide-wasm32-wasi`:

```text
node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/core
node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/runtime
node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/wasi-threads
node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@napi-rs/wasm-runtime
node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@tybys/wasm-util
node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/tslib
```

This is a current lockfile fact, not a clean-install proof. Future dependency,
build, or deploy changes need a reproducibility report that distinguishes
registry integrity, bundled optional dependencies, local `node_modules`, and
deployed output.

## Build Config Boundary

`website/next.config.mjs` currently:

```text
imports fileURLToPath from node:url
enables optimizePackageImports for @phosphor-icons/react
sets turbopack.root to the website directory URL
```

`website/postcss.config.mjs` currently enables only:

```text
@tailwindcss/postcss
```

`website/jsconfig.json` currently sets:

```text
baseUrl: .
paths: @/* -> ./*
```

`website/.vercelignore` currently excludes:

```text
.git
.vercel
.next
node_modules
```

`website/.gitignore` currently ignores:

```text
.vercel
```

The root `.gitignore` also ignores `website/.next/` and `node_modules/`, so
local Next.js output and dependency caches stay outside tracked source.

## Website Analytics And Runtime Scope

The tracked website app imports:

```text
@vercel/analytics/next
next/script
```

Current source facts:

```text
website/app/layout.js imports Analytics and renders <Analytics />
website/app/layout.js injects a beforeInteractive theme script
website/components/theme-toggle.js uses localStorage, storage listeners, and a custom sync event
website/components/scene-controller.js uses a visibilitychange listener and setTimeout/clearTimeout
website/app/components source contains no fetch() calls
website/app/components source contains no MutationObserver usage
```

This supports the privacy/docs distinction already pinned elsewhere: website
analytics are website-only and do not prove or change browser extension,
Android, iOS, TV, or YouTube filtering runtime behavior.

## High-Confidence Findings

1. **Website package metadata is production-owned build surface.**
   It is private and small, but it drives the public website build and deploy
   path. It needs dependency and build proof before release or public-claim
   changes depend on it.

2. **The direct dependency set is modern and narrow.**
   The website depends on Next 16, React 19, Tailwind 4, Phosphor icons, PostCSS,
   and Vercel Analytics. That narrows the audit surface but also makes Node 22
   and clean install/build proof important.

3. **The lockfile contains optional platform/build packages.**
   Optional Next/SWC, Sharp, Tailwind oxide, and libvips entries dominate the
   lockfile risk profile. Local `website/node_modules` proves only the current
   machine state, not every supported deploy environment.

4. **There is no website-local verification script.**
   The package exposes `dev`, `build`, and `start`, but no command that proves
   route screenshots, accessibility, external navigation policy, analytics
   scope, dependency reproducibility, or deploy parity.

5. **Build config is simple but not a deploy gate.**
   Next, PostCSS, jsconfig, gitignore, and Vercel ignore files are pinned, but
   no artifact ties them to the current `.next`, `.vercel`, public route output,
   or website download claims.

6. **First-class JSON filter promotion remains runtime-first.**
   Website package/config proof can later help public claim and artifact gates,
   but it cannot prove JSON path behavior, DOM fallback parity, native parity, or
   YouTube filtering safety by itself.

## Missing Future Authority

No tracked website source currently implements:

- `websitePackageConfigAuthority`
- `websiteDependencyReproducibilityReport`
- `websiteLockfileIntegrityReport`
- `websiteNodeEngineContract`
- `websiteBuildScriptProof`
- `websiteRouteSmokeProof`
- `websiteAnalyticsScopeAuthority`
- `websiteDeployArtifactGate`
- `websiteFirstClassJsonClaimGate`

## Required Follow-Up Proof

| Requirement | Proof needed before changing website package/config or public claims |
| --- | --- |
| Dependency reproducibility | Clean install from `website/package-lock.json`, with package counts, no-integrity explanation, engine result, and deprecation/audit review. |
| Build proof | Fresh `npm run build` in `website`, tied to current tracked revision and saved route/build output evidence. |
| Route smoke | Browser or rendered artifact checks for homepage, downloads, legal pages, sitemap, robots, and every platform slug. |
| Analytics scope | Verification that `@vercel/analytics` stays website-only and is absent from extension/native runtime package paths. |
| Config parity | Proof that Next, PostCSS, jsconfig, Vercel ignore, root ignore, `.next`, and `.vercel` outputs match the intended deploy target. |
| Public claim gate | A website artifact manifest tying download/platform claims to release packages, native sync state, and first-class JSON filter proof only after runtime behavior is proven. |

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this website/build-route surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, website route behavior, website public copy,
deployment claims, remote request changes, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
