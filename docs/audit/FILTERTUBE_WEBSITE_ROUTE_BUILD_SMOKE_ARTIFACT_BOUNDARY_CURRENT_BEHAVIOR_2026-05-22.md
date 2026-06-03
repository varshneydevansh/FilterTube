# FilterTube Website Route Build Smoke Artifact Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior proof. Runtime behavior is unchanged.
This is not an implementation patch and does not open the implementation gate.

Scope: ignored local Next.js output under `website/.next`, with tracked website
route source used only to compare current generated route artifacts to current
route declarations.

This slice addresses the repeated website route smoke/build proof gap without
treating generated local output as product authority. It pins which current
`.next` route artifacts exist, which tracked route/source paths they correspond
to, and what proof is still missing before website, release, public-claim,
media, accessibility, or first-class JSON public-claim work can rely on them.

## Source And Artifact Boundary

```text
tracked website route source files compared: 7
tracked website route data files compared: 2
ignored generated artifact root: website/.next
generated manifest files pinned: 6
public route source set size: 13
generated prerender routes: 18
generated dynamic routes: 1
generated notFoundRoutes entries: 0
generated app path manifest entries: 10
generated route html files: 15
generated route rsc files: 15
generated route meta files: 18
public source routes with generated html/rsc/meta triplets: 13
sitemap body loc entries: 13
local output tracked by git: no
fresh build command captured: no
browser screenshot proof captured: no
accessibility fixture captured: no
deploy artifact proof captured: no
runtime behavior changed: no
```

## Tracked Source Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `website/app/[slug]/page.js` | 54 | 1,229 | `0233757cc9b72d7292750fc0a83560b54969f6489aa397091b408a16f25716f3` |
| `website/app/downloads/page.js` | 364 | 14,976 | `946b20660d8633edda3d0ff1723e3c9229b66f03139eb28930647e9acf123eba` |
| `website/app/page.js` | 661 | 31,825 | `f396b57a6b5a4e83a3546957df084c9e71c63b35d4e8ba28adb85784c5f93f05` |
| `website/app/privacy/page.js` | 819 | 35,232 | `41e818a2f2f8bf9da3daa81e2e7b25863951b9090ce19f8a6aaec353af6f0cb9` |
| `website/app/robots.js` | 9 | 163 | `53946fae34f7c435da974b11d5509492267511744a516155c5e0b73d94c8945b` |
| `website/app/sitemap.js` | 10 | 316 | `aee995ee3780b06c06a2f2a634b679922fe5c0d0bbb4f221aff884ca550392a9` |
| `website/app/terms/page.js` | 87 | 3,511 | `a06d00d4cfcde2113bb3c9a3dc66b7f5617e7875ac6ba22e264bf92cdb618e09` |
| `website/components/route-content.js` | 903 | 32,419 | `75cdf761288ad1f325c9d883715b98845a89a8859f7c13bf7752d658da592a26` |
| `website/components/site-shell-data.js` | 21 | 473 | `28a1ac9ce4806438149720a36b7e4c586dd09f99142ebc63e1c863afcbd145d0` |

## Generated Artifact Fingerprints

| Generated artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `website/.next/BUILD_ID` | 21 | `8d244758baeadb7aae3f8c29e219e701ee8c393ae4f08f02c5b9abf7fab4e32f` |
| `website/.next/app-path-routes-manifest.json` | 332 | `59af3a4d53943a7f09a3ffdf334f2c98f692b1597670b1457ae59e4a887292cb` |
| `website/.next/routes-manifest.json` | 2,587 | `b23a2794a00d1493a1680bf76d595212116c761ee0c6b7b265d279730c5da9d0` |
| `website/.next/prerender-manifest.json` | 12,680 | `927d8e902155d2eb9731e0bb2ce0bdc7562a0389b974adde26833efb1468b5eb` |
| `website/.next/server/app-paths-manifest.json` | 444 | `b13aaac21a3d2045e205a671e0d80ce17b00335944b161ac09bc286f5f5ef5ac` |
| `website/.next/server/pages-manifest.json` | 58 | `c354059caa217e72bdeb145e351b2038990972872c52df215cb1e4105c35097b` |
| `website/.next/server/app/sitemap.xml.body` | 1,181 | `9ecbd1d75896eb929653717d842ee337fec06c1db51db9becd0ec44d781afa1a` |

Current generated build id:

```text
mU-54AWzEaOTVx1n8fwjP
```

## Route Artifact Matrix

The current source-derived public route set is:

```text
/, /downloads, /privacy, /terms, /mobile, /ios, /ipados, /android, /tv, /android-tv, /fire-tv, /kids, /ml-ai
```

Each current source-derived public route has a generated `.html`, `.rsc`, and
`.meta` artifact under `website/.next/server/app`:

```text
index:true:true:true
downloads:true:true:true
privacy:true:true:true
terms:true:true:true
mobile:true:true:true
ios:true:true:true
ipados:true:true:true
android:true:true:true
tv:true:true:true
android-tv:true:true:true
fire-tv:true:true:true
kids:true:true:true
ml-ai:true:true:true
```

`website/.next/prerender-manifest.json` currently contains 18 routes:

```text
/, /_global-error, /_not-found, /android, /android-tv, /downloads, /fire-tv, /icon.png, /ios, /ipados, /kids, /ml-ai, /mobile, /privacy, /robots.txt, /sitemap.xml, /terms, /tv
```

`website/.next/routes-manifest.json` currently has one dynamic route entry for
`/[slug]`, while `website/.next/prerender-manifest.json` expands the 9 platform
slug routes into generated prerender entries. The sitemap generated body has 13
`<loc>` entries, matching the source route set.

## Current Risk Boundaries

| Boundary | Current fact | Risk class |
| --- | --- | --- |
| Ignored local output | `website/.next` is ignored and absent from `git ls-files`. | Build artifacts can be stale, local-only, or machine-specific. |
| Artifact presence | 13 source-derived public routes currently have generated `.html`, `.rsc`, and `.meta` files. | Presence is not proof that the artifacts came from the current revision or a clean build. |
| Build command evidence | No committed build command report, exit-code record, environment record, or source revision record accompanies these artifacts. | A future website/public-claim change could cite stale generated output. |
| Browser proof | No screenshot, viewport, accessibility, link-click, media-load, or hydration proof is attached to this route artifact set. | Generated pages can exist while the user-visible experience is broken. |
| Public claim proof | Platform route copy and metadata are generated from current data, but no release artifact, native runtime, store status, or date-stamped claim manifest is attached. | Public platform claims can outrun product and native evidence. |
| First-class JSON public claim | Website artifacts have no gate tying future JSON-first runtime behavior to public copy or release evidence. | A public optimization claim can land before runtime, package, or native proof exists. |

## Missing Runtime Or Build Authority Symbols

No tracked website source, build config, or generated-output audit source
currently defines:

```text
websiteRouteBuildSmokeAuthority
websiteFreshBuildCommandReport
websiteRouteArtifactManifest
websiteRouteSmokeScreenshotProof
websiteRouteAccessibilityProof
websiteRouteHydrationSmokeProof
websiteRouteMediaLoadBudget
websiteRouteDeployArtifactReport
websiteRoutePublicClaimParityReport
websiteRouteFirstClassJsonClaimGate
```

## Required Future Proof Fields

Before route smoke/build proof can close any website obligation row, a future
artifact report needs:

```text
buildCommand
buildExitCode
nodeVersion
npmVersion
sourceRevision
dirtyWorktreePolicy
routePath
routeSourceFile
generatedHtmlPath
generatedRscPath
generatedMetaPath
generatedArtifactHash
browserViewport
browserScreenshot
accessibilityResult
hydrationResult
mediaLoadBudget
externalLinkResult
deployArtifactReference
publicClaimReference
nativeRuntimeFreshnessReference
firstClassJsonRuntimeReference
lastVerifiedDate
```

## Non-Completion Boundary

This slice proves only that the current ignored local `.next` route artifacts
exist and line up with the current source-derived route list. It does not prove
a fresh build, clean dependency reproducibility, browser rendering, screenshot
quality, accessibility, deploy parity, public claim parity, native runtime
freshness, media performance, or first-class JSON public-claim readiness. The
complete audit remains open.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this website/build-route surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, website route behavior, website public copy,
deployment claims, remote request changes, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
