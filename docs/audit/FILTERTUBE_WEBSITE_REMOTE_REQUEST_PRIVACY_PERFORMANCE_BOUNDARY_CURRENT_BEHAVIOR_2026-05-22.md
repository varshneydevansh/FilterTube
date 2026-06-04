# FilterTube Website Remote Request Privacy/Performance Boundary - Current Behavior (2026-05-22)

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch, website deploy change, privacy-copy change, dependency
change, asset localization change, or filtering behavior change.

## Scope

This boundary promotes the public website remote-request surface from broad
website coverage toward direct privacy/performance proof. It covers tracked
website source and config text files under `website/app`, `website/components`,
and website build config.

The files here are public website source, config, CSS, metadata, and route data.
They are not YouTube response JSON and they are not extension page-runtime
filtering code. They still need first-class public-claim, remote-request,
asset-budget, analytics-scope, and JSON/config proof before optimization,
privacy, or release-copy changes.

Implementation changes remain blocked. This document only pins current
website-side remote request and public-claim behavior.

## Selected File Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `website/app/[slug]/page.js` | 54 | 1,229 | `0233757cc9b72d7292750fc0a83560b54969f6489aa397091b408a16f25716f3` |
| `website/app/downloads/page.js` | 364 | 14,976 | `946b20660d8633edda3d0ff1723e3c9229b66f03139eb28930647e9acf123eba` |
| `website/app/globals.css` | 486 | 12,528 | `2b583fc11e8f5a3a6fa5113daebf71b91d46bf685b02c544727167cf9ed7f760` |
| `website/app/layout.js` | 129 | 3,621 | `9821e403c734a9b40c311be208a35fd6a3afc09e0ac240fa7c681e8aaba410b4` |
| `website/app/page.js` | 661 | 31,825 | `f396b57a6b5a4e83a3546957df084c9e71c63b35d4e8ba28adb85784c5f93f05` |
| `website/app/privacy/page.js` | 819 | 35,232 | `41e818a2f2f8bf9da3daa81e2e7b25863951b9090ce19f8a6aaec353af6f0cb9` |
| `website/app/robots.js` | 9 | 163 | `53946fae34f7c435da974b11d5509492267511744a516155c5e0b73d94c8945b` |
| `website/app/sitemap.js` | 10 | 316 | `aee995ee3780b06c06a2f2a634b679922fe5c0d0bbb4f221aff884ca550392a9` |
| `website/components/browser-logo-rail.js` | 64 | 2,681 | `2c6cf5821cc1120adfae0204e37336e69c2e90a2db603afe558b68188fc4652b` |
| `website/components/route-content.js` | 903 | 32,419 | `75cdf761288ad1f325c9d883715b98845a89a8859f7c13bf7752d658da592a26` |
| `website/components/site-data.js` | 211 | 6,999 | `54858021772c73c7d4ceaabf123470e0611b03b7267291bf7360bf68a151bfd9` |
| `website/components/site-header.js` | 186 | 7,700 | `6ffe1ff1815300d7e9f407c27bebe7bff14e2e6c1a794ce5290b9c0eb8c6f734` |
| `website/components/site-shell-data.js` | 21 | 473 | `28a1ac9ce4806438149720a36b7e4c586dd09f99142ebc63e1c863afcbd145d0` |
| `website/next.config.mjs` | 12 | 250 | `ab2d3beb7a94f0264112c0cdb5372d724cdf36c683c0d44005352021b257b9f6` |

## Website URL Literal Surface

The current tracked website source/config text scan covers 29 files:

- `website/.gitignore`
- `website/.vercelignore`
- `website/app/[slug]/page.js`
- `website/app/downloads/page.js`
- `website/app/globals.css`
- `website/app/layout.js`
- `website/app/not-found.js`
- `website/app/page.js`
- `website/app/privacy/page.js`
- `website/app/robots.js`
- `website/app/sitemap.js`
- `website/app/terms/page.js`
- `website/components/browser-logo-rail.js`
- `website/components/marketing-ui.js`
- `website/components/reveal.js`
- `website/components/route-content.js`
- `website/components/scene-controller.js`
- `website/components/scenic-detail-page.js`
- `website/components/scenic-illustration.js`
- `website/components/scenic-tones.js`
- `website/components/site-data.js`
- `website/components/site-footer.js`
- `website/components/site-header.js`
- `website/components/site-shell-data.js`
- `website/components/theme-toggle.js`
- `website/jsconfig.json`
- `website/next.config.mjs`
- `website/package.json`
- `website/postcss.config.mjs`

Current scan facts:

- URL-like literal tokens: 39
- unique URL-like literal tokens: 23
- host counts:
  - `github.com`: 13
  - `cdnjs.cloudflare.com`: 6
  - `filtertube.in`: 6
  - `chromewebstore.google.com`: 4
  - `addons.mozilla.org`: 3
  - `microsoftedge.microsoft.com`: 2
  - `m.youtube.com`: 1
  - `nanah-signaling.varshney-devansh614.workers.dev`: 1
  - `support.google.com`: 1
  - `www.w3.org`: 1 embedded SVG namespace in CSS data URI, not a standalone remote asset request
  - `filtertube.in${route}`: 1 sitemap template literal token, not a literal deployed host

Current side-effect token facts across those 29 files:

- `@vercel/analytics/next` imports: 1
- `<Analytics />` render sites: 1
- `next/font/google` imports: 1
- `cdnjs.cloudflare.com/ajax/libs/browser-logos` URL literals: 6
- `fetch(` callsites: 0
- `MutationObserver` tokens: 0
- `new Image` tokens: 0
- raw `<img` JSX elements: 1
- Next `<Image` JSX elements: 1
- `target="_blank"` tokens: 8
- `rel="noreferrer"` tokens: 8
- `rel="noopener noreferrer"` tokens: 0
- `window.localStorage` tokens: 3

## Current Remote Request Carriers

`website/app/layout.js` currently imports `Analytics` from
`@vercel/analytics/next` and renders `<Analytics />` once. The privacy page
describes this as website-only analytics, but there is no runtime report tying
the rendered analytics component, route coverage, build artifact, and privacy
copy together.

`website/app/layout.js` also imports fonts from `next/font/google` and declares
four Google font families: `Outfit`, `Plus_Jakarta_Sans`,
`Cormorant_Garamond`, and `JetBrains_Mono`. There is no local font manifest,
font request budget, route metric artifact, or privacy-copy gate.

`website/components/route-content.js` currently declares 6 browser-logo CDN URL
literals, all under `cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0`.
`website/components/browser-logo-rail.js` renders those values through one raw
`<img src={browser.logo}>` path. `website/next.config.mjs` has no
`remotePatterns` policy, image-remote manifest, or local-logo asset policy for
those browser logos.

The website also contains store, GitHub, Nanah, support, YouTube, canonical,
robots, sitemap, and docs URL literals. These are public website navigation,
metadata, or copy surfaces. They are not extension filtering network work, but
they must be classified before changing privacy claims, reducing remote
requests, localizing logo assets, or tightening public navigation policy.

## Current Risk Boundary

| Risk family | Current evidence | Missing before implementation |
| --- | --- | --- |
| privacy claim drift | Privacy copy says Vercel Analytics is website-only while website source renders Analytics once. | Analytics route/build report and public-copy parity gate. |
| remote image performance | 6 browser-logo CDN URLs are rendered through a raw `<img>` path. | Local asset decision, remote image manifest, byte/latency budget, and visual parity proof. |
| font request policy | 4 Google font families are declared through `next/font/google`. | Font request manifest, local font packaging decision, privacy copy parity, and route metric artifact. |
| external URL classification | 39 URL-like literals include stores, GitHub, support, Nanah, YouTube, canonical, sitemap, and one CSS namespace. | URL class report with navigation, metadata, data-URI, remote-asset, and service categories. |
| no-work/performance | No tracked website app/components `fetch(`, `MutationObserver`, or `new Image` tokens are present today. | Route-level metric artifact before claiming optimized or no-remote behavior. |
| JSON/config authority | Website config and metadata shape remote/public behavior but lack one schema/claim gate. | First-class JSON/config public-claim gate and deploy artifact report. |

## Explicit Non-Completion Boundary

This slice does not prove website privacy compliance, route-level network
behavior, third-party request counts in a browser, font self-hosting, CDN logo
localization readiness, deploy artifact parity, public link policy, route
performance budgets, or permission to change website copy/assets.

Future implementation or release work still needs:

- `websiteRemoteRequestPrivacyPerformanceContract`
- `websiteRemoteRequestManifest`
- `websiteRemoteImageAssetPolicy`
- `websiteAnalyticsScopeReport`
- `websiteFontRequestPolicy`
- `websitePrivacyClaimParityReport`
- `websiteRemoteRequestPerformanceBudget`
- `websiteNoRemoteAssetBuildGate`
- `websiteExternalUrlClassReport`
- `websiteFirstClassJsonPublicClaimGate`

None of those authorities exists in selected website source or config yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this website/build-route surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, website route behavior, website public copy,
deployment claims, remote request changes, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
