# FilterTube Website Dynamic Route Method Semantic Register - Current Behavior - 2026-05-22

Status: audit-only current-behavior proof. Runtime behavior is unchanged.
This is not an implementation patch and does not open the implementation gate.

Scope: `website/app/[slug]/page.js`, plus the route data it consumes from
`website/components/route-content.js` and `website/components/site-shell-data.js`.

This slice narrows the website route/component render graph into method-level
proof for the dynamic platform route. It covers the static-param method,
metadata method, render method, data dependencies, public-claim surface, and
the absence of route-local network or lifecycle primitives.

## Source Boundary

```text
dynamic route source file: website/app/[slug]/page.js
route data source files: 2
render component source file: website/components/scenic-detail-page.js
dynamic route source lines: 54
dynamic route source bytes: 1229
import lines: 3
export const declarations: 1
exported function declarations: 3
async exported function declarations: 2
default async route exports: 1
method rows: 3
platform slugs: 9
detail page entries: 9
related-page references: 22
unresolved related-page references: 0
map callsites: 2
filter callsites: 1
notFound callsites: 1
await params callsites: 2
fetch callsites: 0
setTimeout callsites: 0
setInterval callsites: 0
addEventListener callsites: 0
MutationObserver tokens: 0
runtime behavior changed: no
```

## Source Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `website/app/[slug]/page.js` | 54 | 1,229 | `0233757cc9b72d7292750fc0a83560b54969f6489aa397091b408a16f25716f3` |
| `website/components/route-content.js` | 903 | 32,419 | `75cdf761288ad1f325c9d883715b98845a89a8859f7c13bf7752d658da592a26` |
| `website/components/site-shell-data.js` | 21 | 473 | `28a1ac9ce4806438149720a36b7e4c586dd09f99142ebc63e1c863afcbd145d0` |
| `website/components/scenic-detail-page.js` | 332 | 14,521 | `2c8fcc51be06adc875c7496f478f6b61022d2ae8235216714f988ab8a5c27701` |

## Method Rows

| Line | Method | Kind | Current behavior | Missing proof before behavior changes |
| ---: | --- | --- | --- | --- |
| 11 | `generateStaticParams()` | exported static route enumerator | Maps every `platformOrder` slug to `{ slug }` and relies on `dynamicParams = false` to keep the route list closed. | A route manifest proving every slug has a page, sitemap row, screenshots, accessibility proof, and release/public-claim owner. |
| 15 | `generateMetadata({ params })` | exported async metadata method | Awaits `params`, looks up `detailPages[slug]`, returns `{}` for unknown pages, and otherwise emits title, description, canonical URL, Open Graph, and Twitter metadata from route data. | Metadata/public-claim parity proof tying every platform description to release state, artifact availability, native runtime freshness, and last verification date. |
| 41 | `DetailPage({ params })` | default async route render method | Awaits `params`, calls `notFound()` for missing pages, resolves related pages by `page.related.map(...).filter(Boolean)`, and renders `ScenicDetailPage`. | Route smoke/build proof, related-link negative fixtures, visual/browser screenshots, media budgets, and accessibility checks for every platform route. |

## Current Data Contract

`platformOrder` is currently `platformSlugs`, with these 9 entries:

```text
mobile, ios, ipados, android, tv, android-tv, fire-tv, kids, ml-ai
```

`detailPages` currently has the same 9 keys. The 22 related-page references all
resolve to current detail-page keys. This proves the current data shape only; it
does not prove route copy, availability claims, native app freshness, download
artifact state, or screenshot quality.

## Current Risk Boundaries

| Boundary | Current fact | Risk class |
| --- | --- | --- |
| Static route closure | `dynamicParams = false` and `generateStaticParams()` enumerate platform slugs from shared data. | A data edit can add, remove, or rename a public route without a route smoke, sitemap, and claim proof. |
| Unknown slug behavior split | Metadata returns `{}` for unknown pages, while rendering calls `notFound()`. | Metadata and render behavior can diverge unless route tests cover both paths. |
| Metadata from public-copy data | Title, description, canonical, Open Graph, and Twitter values are derived from `detailPages`. | Public platform claims can outrun extension/native/release artifact proof. |
| Related route filtering | Unknown related slugs are silently removed by `.filter(Boolean)`. | Broken related links can disappear instead of failing a build or audit gate. |
| Render dependency | The route delegates the page body to `ScenicDetailPage`. | Responsive, media, animation, and accessibility proof live outside the route method itself. |
| No local lifecycle/network work | The dynamic route has 0 `fetch`, timer, listener, interval, and `MutationObserver` tokens. | Route-level performance risk is mostly data/media/render-component driven, not local effects. |

## Missing Runtime Authority Symbols

No tracked website route/component source currently defines:

```text
websiteDynamicRouteMethodAuthority
websiteDynamicRouteStaticParamManifest
websiteDynamicRouteMetadataParityReport
websiteDynamicRouteRelatedPageIntegrityReport
websiteDynamicRouteNotFoundFixture
websiteDynamicRouteScreenshotProof
websiteDynamicRouteAccessibilityReport
websiteDynamicRoutePublicClaimGate
websiteDynamicRouteMediaBudget
websiteDynamicRouteFirstClassJsonClaimGate
```

## Required Future Proof Fields

Before changing dynamic platform routes, public platform copy, route metadata,
or platform availability claims, future fixtures need:

```text
routeSlug
routeExistsInStaticParams
routeExistsInSitemap
routeMetadataTitle
routeMetadataDescription
canonicalUrl
openGraphUrl
twitterTitle
detailPageKey
relatedSlug
relatedSlugResolved
unknownSlugMetadataBehavior
unknownSlugRenderBehavior
platformAvailabilityClaim
downloadArtifactReference
nativeRuntimeFreshnessReference
firstClassJsonClaimReference
desktopScreenshot
mobileScreenshot
accessibilityResult
mediaBudget
externalLinkPolicy
releaseClaimOwner
lastVerifiedDate
```

## Non-Completion Boundary

This register proves only the current method/data shape for one dynamic website
route. It does not prove every website route, component, rendered viewport,
public claim, release artifact, external link, media budget, accessibility
state, native runtime parity, or first-class JSON public claim. The complete
audit remains open.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this website/build-route surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, website route behavior, website public copy,
deployment claims, remote request changes, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
