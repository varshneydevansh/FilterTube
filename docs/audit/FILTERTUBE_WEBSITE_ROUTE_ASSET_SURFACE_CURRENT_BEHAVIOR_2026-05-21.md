# FilterTube Website Route And Asset Surface - Current Behavior

Date: 2026-05-21

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch, website redesign, public-claim approval, build proof, or
release gate.

This slice extends the active audit goal for the tracked `website/` source
family. It complements the earlier build/website callable audit by pinning
current route topology, public-copy data surfaces, media assets, website-only
remotes, ignored generated output, and remaining proof gaps for public claims.

## Tracked Website Surface

Current `git ls-files website` contains 42 tracked files, 184,633 newline
counts, and 45,861,622 bytes:

| Family | Count | Current scope |
| --- | ---: | --- |
| `website/app` | 11 | Next App Router routes, metadata, globals CSS, icon, sitemap, robots, policy pages |
| `website/components` | 13 | Marketing UI, route data, header/footer, browser rail, scenic detail pages, theme and scene controllers |
| `website/assets` | 7 | Source logo, video prompts, source homepage video, source iOS video |
| `website/public` | 4 | Public logo and public video files served by route paths |
| `website config` | 7 | `.gitignore`, `.vercelignore`, `jsconfig`, Next config, PostCSS, website package and lockfile |

Representative source fingerprints:

| Path | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `website/app/page.js` | 661 | 31,825 | `f396b57a6b5a4e83a3546957df084c9e71c63b35d4e8ba28adb85784c5f93f05` |
| `website/app/downloads/page.js` | 364 | 14,976 | `946b20660d8633edda3d0ff1723e3c9229b66f03139eb28930647e9acf123eba` |
| `website/app/layout.js` | 129 | 3,621 | `9821e403c734a9b40c311be208a35fd6a3afc09e0ac240fa7c681e8aaba410b4` |
| `website/components/route-content.js` | 903 | 32,419 | `75cdf761288ad1f325c9d883715b98845a89a8859f7c13bf7752d658da592a26` |
| `website/components/site-shell-data.js` | 21 | 473 | `28a1ac9ce4806438149720a36b7e4c586dd09f99142ebc63e1c863afcbd145d0` |
| `website/components/site-data.js` | 211 | 6,999 | `54858021772c73c7d4ceaabf123470e0611b03b7267291bf7360bf68a151bfd9` |
| `website/components/scene-controller.js` | 88 | 1,871 | `9a396c57e3e91249916e3d0d1ecc3ce11a85885b32bd8dd8640311fbc1394a67` |
| `website/components/theme-toggle.js` | 106 | 3,577 | `17352421ab9eee46d72aded73f0b1dacb27e8ab0b93dad7096c7343b4bdd323d` |

## Route Topology

The website is a Next App Router app with these current route owners:

- `/` from `website/app/page.js`.
- `/downloads` from `website/app/downloads/page.js`.
- `/privacy` from `website/app/privacy/page.js`.
- `/terms` from `website/app/terms/page.js`.
- `/:slug` from `website/app/[slug]/page.js`.
- `/robots.txt` and `/sitemap.xml` from `website/app/robots.js` and
  `website/app/sitemap.js`.
- `not-found` from `website/app/not-found.js`.

`website/components/site-shell-data.js` currently defines 9 platform slugs:

`mobile`, `ios`, `ipados`, `android`, `tv`, `android-tv`, `fire-tv`, `kids`,
and `ml-ai`.

`website/components/route-content.js` has 9 matching `detailPages` entries,
4 `featuredRouteSlugs` entries (`mobile`, `tv`, `kids`, `ml-ai`), 6 browser
link rows, and one public hero video path:
`/videos/homepage/day/homepage_hero_day.mp4`.

`website/app/[slug]/page.js` sets `dynamicParams = false`, builds static params
from `platformOrder`, returns empty metadata for unknown pages, and calls
`notFound()` for unknown page rendering. `website/app/sitemap.js` builds 13
routes from `/`, `/downloads`, `/privacy`, `/terms`, and the 9 platform slugs,
with a static `lastModified: "2026-05-16"` for every route.

## Asset And Media Facts

The same 3,406-byte logo hash appears in:

- `website/assets/images/logo.png`
- `website/app/icon.png`
- `website/public/brand/logo.png`

All three have SHA-256
`2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755`.

The same 12,419,424-byte homepage video hash appears in:

- `website/assets/videos/homepage/day/homepage_hero_day.mp4`
- `website/public/videos/homepage/day/homepage_hero_day.mp4`
- `website/public/videos/homepage/homepage_hero_day.mp4`

All three have SHA-256
`3cf0edad24d9301bb3c43f3427996c8b364cd489a391c0d7ba917e58018b47f3`.

The source iOS video and public iOS hero video are not byte-identical:

- `website/assets/videos/ios/ios.mp4`: 6,152,963 bytes,
  SHA-256 `6a6b2b08fe198440ca1e25695f3029d9311039d5ce3d75e30c171d4fe5ebd463`.
- `website/public/videos/ios/ios_hero_slow_540.mp4`: 2,179,940 bytes,
  SHA-256 `00da591840296f2c0005dbb83800a6987edad7efda1536cf7b20304f92ba78fc`.

Current source references only the public served paths:
`/brand/logo.png`, `/videos/homepage/day/homepage_hero_day.mp4`, and
`/videos/ios/ios_hero_slow_540.mp4`. The source asset files under
`website/assets` are not served by those URL strings directly.

## Config And Generated Output Boundary

`website/package.json` defines only `dev`, `build`, and `start` scripts, uses
Node `22.x`, and depends on Next `^16.1.6`, React `^19.2.4`,
`@vercel/analytics` `^2.0.1`, Tailwind `^4.2.1`, and
`@phosphor-icons/react` `^2.1.10`.

`website/next.config.mjs` enables `optimizePackageImports` for
`@phosphor-icons/react` and sets Turbopack root to the website directory.
`website/.vercelignore` excludes `.git`, `.vercel`, `.next`, and
`node_modules`. Representative generated/local files are ignored by current git
rules: `website/.next/BUILD_ID`, `website/node_modules/.package-lock.json`,
`website/.vercel/project.json`, `website/.DS_Store`, and
`website/assets/.DS_Store`.

## Website Runtime Lifecycle

Only three tracked website files are client components today:

- `website/components/scene-controller.js`
- `website/components/site-header.js`
- `website/components/theme-toggle.js`

`website/app/layout.js` also embeds a `beforeInteractive` script that reads
`window.localStorage.getItem('filtertube-theme')`, derives a scene from the
current hour, writes `data-theme`, `data-theme-preference`, `data-scene`, and
`colorScheme`, and falls back to light/day state on error.

`website/components/scene-controller.js` has one `document.addEventListener`,
one matching `document.removeEventListener`, one `window.setTimeout`, and two
`window.clearTimeout` references for scene-boundary updates. It also updates on
`visibilitychange`.

`website/components/theme-toggle.js` has two `window.addEventListener` calls,
two matching `window.removeEventListener` calls, two `localStorage` references,
and one `window.dispatchEvent` call for cross-component theme sync.

There are no `fetch` calls and no `MutationObserver` references in tracked
`website/app` or `website/components` source.

## Website Remotes And Navigation

Excluding `website/package-lock.json` registry metadata and the SVG data URL in
CSS, tracked website source currently contains 22 unique HTTP(S)-style strings.
Important public remotes include:

- `https://filtertube.in` canonical and sitemap URLs.
- Chrome Web Store, Firefox Add-ons, Microsoft Edge Add-ons, and GitHub release
  links.
- `https://m.youtube.com/watch?v=dmLUu3lm7dE` for the demo video CTA.
- `https://support.google.com/youtubekids/thread/54649605/how-to-block-videos-by-keyword-or-tag?hl=en`.
- Nanah relay and Nanah GitHub links in the privacy page.
- 6 cdnjs browser-logo image URLs rendered by `BrowserLogoRail`.

Static JSX contains 8 literal `target="_blank"` tokens and 8 literal
`rel="noreferrer"` tokens, while `PolicyLink` sets `target` and `rel`
dynamically when `href.startsWith("http")`. `ActionLink external` is reused for
several website CTAs. The policy is consistent enough to be observable, but it
is not a central external-navigation authority.

## Code-Burden Findings

1. `website/components/site-data.js` has no current import from tracked
   `website/app` or `website/components` source. It still contains public
   product and browser-link copy, so it is a tracked code-burden surface until a
   deletion or reactivation decision has proof.
2. The homepage video is tracked three times with identical bytes across one
   source asset path and two public paths. That is a release-size and asset
   provenance burden, not a deletion-ready finding.
3. The logo is tracked three times with identical bytes across source, app icon,
   and public brand paths. That may be intentional for Next metadata, but it
   still needs an asset-owner manifest before consolidation.
4. The public iOS video is a compressed derivative of a larger source video, but
   there is no tracked manifest linking source hash, derivative hash,
   compression command, target size, or route consumer.
5. The website privacy text scopes Vercel Analytics to the website, but browser
   logo images still load from a third-party CDN. This is website-only network
   behavior and must not be described as extension/app runtime collection.
6. Download and platform copy can say Android/iOS are in final release testing
   and direct APK releases point to GitHub latest, but no public claim manifest
   proves current store state, signed APK, checksum, signer fingerprint, or last
   verification date.

## Missing Authority Symbols

No tracked website source currently implements:

- `websiteRouteSurfaceAuthority`
- `websiteRouteManifest`
- `websitePlatformClaimManifest`
- `websiteAssetProvenanceManifest`
- `websiteMediaDerivativeManifest`
- `websiteExternalNavigationAuthority`
- `websiteRemoteRequestManifest`
- `websitePublicClaimArtifactGate`
- `websiteGeneratedOutputBoundary`
- `websiteLegacyDataDeletionDecision`

## Completion Boundary

This register does not close website tracked-file obligations. It pins current
source behavior for route topology, public data, assets, remotes, lifecycle, and
ignored generated output. Before changing website copy, deleting duplicated
assets, changing media preload behavior, moving browser-logo assets, publishing
availability claims, or consolidating legacy data files, future work still needs
route screenshots/build proof, public claim artifacts, asset provenance,
performance budgets, external-navigation policy, and package/deploy evidence.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this website/build-route surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, website route behavior, website public copy,
deployment claims, remote request changes, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
