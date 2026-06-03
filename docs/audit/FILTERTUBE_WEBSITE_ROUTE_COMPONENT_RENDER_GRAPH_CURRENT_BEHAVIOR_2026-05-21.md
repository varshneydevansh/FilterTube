# FilterTube Website Route Component Render Graph - Current Behavior

Date: 2026-05-21

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch, website redesign, route screenshot proof, public-claim
approval, build proof, or first-class JSON filter public-claim gate.

This slice extends the active audit goal for tracked website routes and React
components. It complements the route/asset, package/config, and client
lifecycle slices by pinning the current render graph, route exports, component
imports, data-module ownership, exported callables, render primitive counts, and
code-burden risks before any website optimization or public-copy change.

## Source Boundary

Current `git ls-files website/app/*.js website/components/*.js` contains 22
tracked JavaScript files: 9 route/app files and 13 component/data files. The
surface has 4,608 newline counts and 185,419 bytes.

| Path | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `website/app/[slug]/page.js` | 54 | 1,229 | `0233757cc9b72d7292750fc0a83560b54969f6489aa397091b408a16f25716f3` |
| `website/app/downloads/page.js` | 364 | 14,976 | `946b20660d8633edda3d0ff1723e3c9229b66f03139eb28930647e9acf123eba` |
| `website/app/layout.js` | 129 | 3,621 | `9821e403c734a9b40c311be208a35fd6a3afc09e0ac240fa7c681e8aaba410b4` |
| `website/app/not-found.js` | 34 | 1,639 | `45633bebc0aba712e2dc4c3051e7ef834ed244b93f04721d67f685e228b618eb` |
| `website/app/page.js` | 661 | 31,825 | `f396b57a6b5a4e83a3546957df084c9e71c63b35d4e8ba28adb85784c5f93f05` |
| `website/app/privacy/page.js` | 819 | 35,232 | `41e818a2f2f8bf9da3daa81e2e7b25863951b9090ce19f8a6aaec353af6f0cb9` |
| `website/app/robots.js` | 9 | 163 | `53946fae34f7c435da974b11d5509492267511744a516155c5e0b73d94c8945b` |
| `website/app/sitemap.js` | 10 | 316 | `aee995ee3780b06c06a2f2a634b679922fe5c0d0bbb4f221aff884ca550392a9` |
| `website/app/terms/page.js` | 87 | 3,511 | `a06d00d4cfcde2113bb3c9a3dc66b7f5617e7875ac6ba22e264bf92cdb618e09` |
| `website/components/browser-logo-rail.js` | 64 | 2,681 | `2c6cf5821cc1120adfae0204e37336e69c2e90a2db603afe558b68188fc4652b` |
| `website/components/marketing-ui.js` | 89 | 3,155 | `f16f6e72b9761b09dc65e2fcd69f786e30b893afba76118401577254d8160302` |
| `website/components/reveal.js` | 11 | 194 | `64e73c6666e63a043b7f446824d042a0366caad2b26af40322b5bc9100c17a40` |
| `website/components/route-content.js` | 903 | 32,419 | `75cdf761288ad1f325c9d883715b98845a89a8859f7c13bf7752d658da592a26` |
| `website/components/scene-controller.js` | 88 | 1,871 | `9a396c57e3e91249916e3d0d1ecc3ce11a85885b32bd8dd8640311fbc1394a67` |
| `website/components/scenic-detail-page.js` | 332 | 14,521 | `2c8fcc51be06adc875c7496f478f6b61022d2ae8235216714f988ab8a5c27701` |
| `website/components/scenic-illustration.js` | 193 | 8,573 | `37238b5d80e68ef14db79433d28e3cf21f92108f42850e24466bb233f3ddeab5` |
| `website/components/scenic-tones.js` | 102 | 4,671 | `7732ffaa1751d9ceb403f5e0710e57a44a72d999b346cc96fb12dd1ffbb2a67c` |
| `website/components/site-data.js` | 211 | 6,999 | `54858021772c73c7d4ceaabf123470e0611b03b7267291bf7360bf68a151bfd9` |
| `website/components/site-footer.js` | 135 | 6,073 | `c7e344060916fa91cd8f597d661626ef82298032ce7615c777b8d5c61954a4f8` |
| `website/components/site-header.js` | 186 | 7,700 | `6ffe1ff1815300d7e9f407c27bebe7bff14e2e6c1a794ce5290b9c0eb8c6f734` |
| `website/components/site-shell-data.js` | 21 | 473 | `28a1ac9ce4806438149720a36b7e4c586dd09f99142ebc63e1c863afcbd145d0` |
| `website/components/theme-toggle.js` | 106 | 3,577 | `17352421ab9eee46d72aded73f0b1dacb27e8ab0b93dad7096c7343b4bdd323d` |

## Export And Callable Shape

Across these 22 files, current source has:

| Shape | Count | Current meaning |
| --- | ---: | --- |
| Function declarations | 44 | Route handlers, React components, render helpers, metadata helpers, theme/scene helpers |
| Exported function declarations | 24 | 9 route/default exports plus 15 named route/component/helper exports |
| Local function declarations | 20 | Render helpers, link helpers, card helpers, theme/scene helpers |
| `export const` declarations | 31 | Metadata objects, route data, platform data, tone presets, public link constants |
| Re-export declarations | 1 | `route-content.js` re-exports install/navigation data from `site-shell-data.js` |
| Default exports | 9 | All current `website/app` route entry files |

The tracked app/component source also has 55 `import` lines, 12 JSX `<Link>`
sites, 1 JSX `<Image>` site, 2 JSX `<video>` sites, 1 JSX `<Script>` site, 14
literal `<a>` sites, 2 `<button>` sites, 35 `.map(...)` calls, 2
`.filter(...)` calls, one `notFound()` call, one `generateMetadata` export, one
`generateStaticParams` export, and one `dynamicParams = false` declaration.

## Route Owners

Current route entry ownership:

- `/` uses `website/app/page.js` and renders home sections from `route-content`,
  `marketing-ui`, `reveal`, `browser-logo-rail`, and `scenic-tones`.
- `/downloads` uses `website/app/downloads/page.js`.
- `/privacy` uses `website/app/privacy/page.js`.
- `/terms` uses `website/app/terms/page.js`.
- `/:slug` uses `website/app/[slug]/page.js`.
- `/robots.txt` uses `website/app/robots.js`.
- `/sitemap.xml` uses `website/app/sitemap.js`.
- The app shell uses `website/app/layout.js`.
- Not-found rendering uses `website/app/not-found.js`.

The dynamic platform route has `dynamicParams = false`,
`generateStaticParams()`, `generateMetadata()`, and default async
`DetailPage()`. It reads `detailPages[slug]`, returns empty metadata for unknown
slugs, calls `notFound()` during rendering for unknown slugs, and renders
`ScenicDetailPage` with related pages filtered through `Boolean`.

`website/app/sitemap.js` currently builds 13 routes from `/`, `/downloads`,
`/privacy`, `/terms`, and the 9 `platformOrder` slugs, all with static
`lastModified: "2026-05-16"`. `website/app/robots.js` allows `/` for `*` and
points to `https://filtertube.in/sitemap.xml`.

## Component And Data Import Graph

Current internal website module consumers:

| Module | Current consumers |
| --- | --- |
| `@/components/site-shell-data` | `route-content.js`, `site-header.js` |
| `@/components/route-content` | `[slug]/page.js`, `downloads/page.js`, `page.js`, `sitemap.js`, `browser-logo-rail.js`, `site-footer.js`, `site-header.js` |
| `@/components/marketing-ui` | `downloads/page.js`, `not-found.js`, `page.js`, `privacy/page.js`, `terms/page.js`, `scenic-detail-page.js`, `site-footer.js` |
| `@/components/reveal` | `page.js`, `terms/page.js`, `scenic-detail-page.js` |
| `@/components/scenic-tones` | `page.js`, `scenic-detail-page.js` |
| `@/components/scenic-detail-page` | `[slug]/page.js` |
| `@/components/scenic-illustration` | `site-footer.js` |
| `@/components/browser-logo-rail` | `page.js` |
| `@/components/theme-toggle` | `site-header.js` |
| `@/components/scene-controller` | `layout.js` |
| `@/components/site-footer` | `layout.js` |
| `@/components/site-header` | `layout.js` |

`@/components/site-data` has 0 current imports from tracked app/component
source. It still exports 7 public-copy data groups, so it remains a tracked
code-burden surface rather than deletion-ready dead code.

## Route Data Ownership

`website/components/site-shell-data.js` currently owns the Chrome extension
install URL, 4 navigation links, and 9 platform slugs.

`website/components/route-content.js` imports those values, re-exports
`extensionInstallHref` and `navigationLinks`, defines the public homepage video
path, browser links, footer links, home page sections, platform order, and 9
`detailPages` entries matching the platform slug list:

`mobile`, `ios`, `ipados`, `android`, `tv`, `android-tv`, `fire-tv`, `kids`,
and `ml-ai`.

`browserLinks` has 6 rows and every logo is a cdnjs URL. `BrowserLogoRail`
renders those logo URLs through plain `<img src={browser.logo}>`, which is
website-only network behavior and not extension or app runtime behavior.

## BrowserLogoRail Method-Semantic Addendum - 2026-05-27

This addendum pins the current method shape for
`website/components/browser-logo-rail.js` without claiming that website route
or public browser-support evidence is complete.

```text
BrowserLogoRail(props)
        |
        v
imports browserLinks from route-content.js
        |
        v
maps 6 browser rows into external anchors
        |
        v
renders plain img tags for cdnjs browser logos
        |
        v
public website evidence only, not extension/runtime parity proof
```

Current source facts:

```text
source file: website/components/browser-logo-rail.js
line count: 64
source bytes: 2681
source sha256: 2c6cf5821cc1120adfae0204e37336e69c2e90a2db603afe558b68188fc4652b
method rows covered: 1
exported function declarations covered: 1
prop defaults covered: 3
import lines: 2
internal state variables: 3
rendered browser link rows: 6
remote browser logo URL rows: 6
raw img render sites: 1
target blank anchor sites: 1
rel noreferrer sites: 1
rel noopener sites: 0
map call sites: 1
runtime behavior changed: no
```

| Method | Owner / source | Trigger and inputs | Observable effects | Current proof | Remaining blocker |
| --- | --- | --- | --- | --- | --- |
| `BrowserLogoRail` | Website server component at `website/components/browser-logo-rail.js:5`. | Rendered by the homepage through `website/app/page.js`; receives optional `className`, `muted`, and `panel` props with defaults. | Returns JSX for one browser-logo rail, maps the six `browserLinks` rows into external anchors, renders plain `<img>` elements from `browser.logo`, and renders `ArrowUpRight` icons. No storage, timers, listeners, observers, fetch calls, or extension runtime mutations. | Runtime audit checks the source fingerprint, import graph, prop defaults, six browser rows, six cdnjs logo URLs, anchor/link attributes, and raw image render path. | Browser support claims still need public-claim parity, accessibility/visual screenshots, remote-asset privacy policy, deploy artifact proof, route smoke proof, and release freshness evidence. |

This addendum reduces ambiguity for one website component callable. It does not
reduce the repo-wide method semantic gap count because browser-support evidence,
remote asset policy, accessibility proof, visual proof, and deploy/release
freshness remain incomplete.

## Reliability, Performance, And Code-Burden Findings

1. The website route graph is data-driven through `route-content.js`, but there
   is no route screenshot, static export, or deploy artifact proving every route
   renders with the current data.
2. Dynamic platform metadata and rendering use separate unknown-slug behavior:
   metadata returns `{}`, while rendering calls `notFound()`.
3. The sitemap has static `lastModified: "2026-05-16"` for all routes rather
   than deriving from release or route data.
4. `site-data.js` is currently unimported but still tracked and carries older
   public copy, browser links, FAQ rows, roadmap rows, and capability claims.
5. Data arrays drive 35 render `.map(...)` sites without route-level visual or
   accessibility fixture proof.
6. The website render graph includes 14 literal anchor sites, 12 `next/link`
   sites, 2 video sites, and one Next image site; external navigation and media
   performance policy remain split across component-local patterns.
7. This graph is public-copy and website-render evidence only. It does not
   prove extension JSON filtering, DOM fallback behavior, native parity, or
   current store/mobile availability claims.

## Missing Authority Symbols

No tracked website app/component source currently implements:

- `websiteRouteComponentGraphAuthority`
- `websiteRouteRenderManifest`
- `websiteRouteScreenshotProof`
- `websiteStaticParamMetadataContract`
- `websiteRouteDataOwnershipReport`
- `websiteComponentImportGraphManifest`
- `websiteLegacySiteDataDeletionDecision`
- `websiteRenderMapAccessibilityReport`
- `websitePublicCopyRuntimeParityGate`
- `websiteJsonFirstPublicClaimGate`

## Completion Boundary

This register does not close website tracked-file obligations. It pins current
route/component source shape, exports, imports, data ownership, render
primitive counts, route topology, and code-burden risks. Before changing
website route data, deleting `site-data.js`, consolidating public-copy modules,
rewriting route components, changing browser-logo media, publishing platform
availability claims, or using website copy as evidence for first-class JSON
filtering, future work still needs route smoke/build proof, browser screenshots,
accessibility fixtures, external-navigation policy, media budgets, deploy
artifact evidence, public-claim parity, and runtime/native parity proof.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this website/build-route surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, website route behavior, website public copy,
deployment claims, remote request changes, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
