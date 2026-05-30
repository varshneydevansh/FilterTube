# FilterTube Generated Local Output / Dependency Surface - Current Behavior - 2026-05-21

Status: audit-only proof. Runtime behavior is unchanged.
This is not an implementation patch.

## Purpose

This slice separates tracked product source from ignored local output,
dependency caches, and generated release/deploy artifacts. It supports the
current codebase inspection for optimization locations and first-class JSON
filter promotion by making sure future work does not treat a stale generated
folder, installed dependency cache, or deploy output as implementation
authority.

The checked local surfaces are:

```text
dist
node_modules
website/.next
website/.vercel
website/node_modules
```

`docs/audit` and `tests` are the active audit corpus requested by the user, not
generated product output. They are intentionally outside the core docs tree
mess, but they do not close product-runtime proof obligations.

## Local Output Snapshot

| Local path | Git boundary | Current files | Current bytes | Current role |
| --- | --- | ---: | ---: | --- |
| `dist` | ignored by `.gitignore:6:dist/` | 178 | 61,356,521 | Browser package trees plus ZIPs from a previous build, plus one local `.DS_Store` filesystem artifact. |
| `node_modules` | ignored by `.gitignore:2:node_modules/` | 956 | 26,325,623 | Root npm dependency install cache. |
| `website/.next` | ignored by `.gitignore:12:website/.next/` | 2,288 | 346,208,509 | Next.js build/dev output and cache. |
| `website/.vercel` | ignored by `website/.gitignore:1:.vercel` | 291 | 29,815,128 | Local Vercel project/output metadata. |
| `website/node_modules` | ignored by `.gitignore:2:node_modules/` | 18,619 | 325,539,259 | Website npm dependency install cache. |

All five paths are absent from `git ls-files` today. Their presence is useful
local evidence, but it is not tracked source coverage, package parity proof,
deploy proof, or optimization proof.

## `dist` Package Output Boundary

The current `dist` tree contains three browser package directories and three
ZIP archives:

```text
dist/chrome
dist/firefox
dist/opera
dist/filtertube-chrome-v3.3.1.zip
dist/filtertube-firefox-v3.3.1.zip
dist/filtertube-opera-v3.3.1.zip
```

Each browser package directory currently has 58 files with this top-level
breakdown:

```text
CHANGELOG.md: 1
LICENSE: 1
README.md: 1
assets: 3
css: 8
data: 1
html: 3
icons: 7
js: 32
manifest.json: 1
```

Current browser package sizes and manifest hashes:

| Browser output | Files | Bytes | Manifest SHA-256 |
| --- | ---: | ---: | --- |
| `dist/chrome` | 58 | 11,769,056 | `96eb5e5c8733ecdfa9d3eb447d51a3bfc2c4743a80b1fde1f12d71bd46d1c8e4` |
| `dist/firefox` | 58 | 11,769,146 | `2221afbc831ea1b5d90f76cd3f1590022dcc92d3c5d992dd163a5d46844b0e72` |
| `dist/opera` | 58 | 11,769,061 | `f76d4a48b51fc5da65492347ce3f7cb31ebff057afd2185573176991e7d1d4b7` |

Current ZIP artifacts:

| ZIP path | Bytes | SHA-256 |
| --- | ---: | --- |
| `dist/filtertube-chrome-v3.3.1.zip` | 8,681,016 | `98e90fcae64fbe8edc3597fa4808359e1cba6b1411bd855e60e0bf3c069361d0` |
| `dist/filtertube-firefox-v3.3.1.zip` | 8,681,075 | `f0dd7d53ad62c9716a975d299326ab84f01fa4c88dac2042d89a4d91d11a8630` |
| `dist/filtertube-opera-v3.3.1.zip` | 8,681,019 | `4b1a53f931e2019163a7fc6f400dd168465350fcf0813055887a7140c3651ce5` |

The package tree is broad because `build.js` copies:

```text
COMMON_DIRS = js, css, html, icons, data, assets
COMMON_FILES = README.md, CHANGELOG.md, LICENSE
```

That means ignored `dist` currently carries active runtime files, generated UI
shell output, vendor bundles, quarantined CSS, the empty troubleshoot page,
release-note data, static media, and public docs copied as package files.
It does not copy `docs`, `package-lock.json`, or the root planning/audit docs.

Risk: a future optimization can be correct in tracked runtime source while the
local `dist` folder still shows stale package contents. Conversely, a stale ZIP
can look release-ready while tracked source and manifests have moved on.

## Website Generated Output Boundary

The website has both Next.js and Vercel local outputs:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `website/.next/BUILD_ID` | 21 | `8d244758baeadb7aae3f8c29e219e701ee8c393ae4f08f02c5b9abf7fab4e32f` |
| `website/.next/routes-manifest.json` | 2,587 | `b23a2794a00d1493a1680bf76d595212116c761ee0c6b7b265d279730c5da9d0` |
| `website/.next/prerender-manifest.json` | 12,680 | `927d8e902155d2eb9731e0bb2ce0bdc7562a0389b974adde26833efb1468b5eb` |
| `website/.vercel/project.json` | 369 | `056ce6a7ea8449fb9e28d91b2164152ad5e91912a91adbfb97a8a5639d91eb5f` |
| `website/.vercel/output/config.json` | 6,050 | `ac5af2611c3ae7d01e654208ffa5f184ee3cb90f40899a093932b8b510d918c6` |

`website/.vercelignore` currently contains only:

```text
.git
.vercel
.next
node_modules
```

The local `.next` and `.vercel` outputs are evidence that builds have run, but
they are not a public deployment claim, screenshot proof, public route parity
proof, or release artifact gate. Any website performance or claim change still
needs a fresh build command, route checks, asset budget, and deploy evidence.

## Dependency Cache Boundary

The root dependency cache currently contains 956 files and 92 package manifests.
The website dependency cache currently contains 18,619 files and 295 package
manifests.

Current install-cache lock snapshots:

| Local cache lock | Bytes | SHA-256 |
| --- | ---: | --- |
| `node_modules/.package-lock.json` | 50,306 | `bfa5cbafaa82b0d6f33ec3eaa223c1afc5e28628e691569a1af04700ddad6c94` |
| `website/node_modules/.package-lock.json` | 23,958 | `3201e68ac25498574baf387d4d0260bfdef61bd74043ad587f71026f86d703e0` |

The tracked authority for dependency intent remains `package-lock.json` and
`website/package-lock.json`. The local install caches can prove what is present
on this machine, not what a clean install or CI run will reproduce.

## High-Confidence Findings

1. **Ignored output dominates the local workspace footprint.**
   The website dependency cache and `.next` output are much larger than tracked
   website source. Optimizations should separate product runtime cost from
   local development artifact size.

2. **`dist` is package evidence, not package authority.**
   It currently mirrors broad build roots and ZIP outputs, but the build script
   does not emit a committed package manifest or checksum manifest.

3. **Package breadth can preserve code burden after runtime cleanup.**
   Quarantined CSS, empty HTML, generated shells, vendor bundles, and static
   media remain visible in `dist` whenever broad roots are copied.

4. **Website build outputs are not public claim proof.**
   `.next` and `.vercel` outputs need command, revision, route, screenshot, and
   deploy evidence before any website/download claim depends on them.

5. **Dependency caches are local install state.**
   `node_modules` and `website/node_modules` can expose package presence and
   size, but they are not substitutes for lockfile reproducibility proof.

6. **First-class JSON filter changes need artifact gates after runtime proof.**
   A JSON-path optimization must eventually prove tracked runtime behavior,
   package output freshness, website/public claim parity, and native/app sync
   separately. This slice only pins the local artifact boundary.

## Missing Future Authority

No product/runtime/build authority exists yet for:

- `generatedLocalOutputBoundaryAuthority`
- `localDependencyCacheAuthority`
- `distPackageFreshnessReport`
- `distZipChecksumManifest`
- `nextBuildArtifactFreshnessReport`
- `vercelOutputReleaseAuthority`
- `nodeModulesDependencyProof`
- `generatedOutputCleanupDecision`
- `firstClassJsonFilterPackageGate`

## Required Follow-Up Proof

| Requirement | Proof needed before changing behavior or release claims |
| --- | --- |
| Dist package freshness | Regenerate browser packages from a known revision and compare a package manifest with source paths, hashes, sizes, manifest references, and quarantine status. |
| ZIP release gate | Emit checksums for browser ZIPs and block public release publication until every expected upload is verified. |
| Website build/deploy parity | Run a fresh website build, check generated route artifacts, verify screenshots, and tie deploy output to the tracked revision. |
| Dependency reproducibility | Install from lockfiles in a clean environment and record package count, integrity, engine, and deprecation results. |
| Generated-output cleanup | Prove whether a generated folder/file is stale, intentionally cached, package-only, or deletion-ready before removing or relying on it. |
| First-class JSON package gate | After runtime JSON behavior proof exists, prove the regenerated package/native/website artifacts carry that behavior and not stale output. |

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this static/generated/asset package surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, asset optimization, generated-output
cleanup, package pruning, CSS activation/deletion, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
