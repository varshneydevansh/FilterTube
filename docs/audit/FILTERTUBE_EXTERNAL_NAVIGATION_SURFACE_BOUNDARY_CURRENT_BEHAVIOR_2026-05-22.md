# FilterTube External Navigation Surface Boundary - 2026-05-22

Status: audit-only current-behavior proof. Runtime behavior is unchanged.
This is not an implementation patch, navigation policy patch, link-policy patch,
release-banner patch, popup patch, dashboard patch, website patch, or
optimization patch.

## Scope

This slice maps the current external navigation and open-target surfaces across
extension runtime code, static extension HTML, and public website components.
It covers privileged tab creation, popup/dashboard fallback opens, release
banner navigation, subscription-import YouTube tab opens, static target-blank
anchors, website external link components, and the absence of a shared URL
class report.

It extends the open external navigation/link authority, prompt/onboarding,
release-note, manifest/permission, message trust, static HTML, website route,
public claim, storage/cache, settings-mode, reliability, false-hide/leak,
performance, code-burden, cross-feature, source/evidence, and
implementation-change rows. It keeps the implementation gate closed.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Source Fingerprints

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/popup.js` | 1841 | 75587 | `cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a` |
| `js/tab-view.js` | 11617 | 526763 | `1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7` |
| `js/content/release_notes_prompt.js` | 250 | 9866 | `30b624cbbda1004f354f98dbf3b4513f8ebc298adecbceb4358782f248f80474` |
| `html/popup.html` | 31 | 1213 | `c5e03a38b2737dbd01e2cd0c243b37754936e2e349e9d2275b195350159aea31` |
| `html/tab-view.html` | 1577 | 133585 | `e33ef1e0d1f2c3d607cb58c3275137df54c1c82ed06cf5cd03c053690fedb0b6` |
| `website/components/marketing-ui.js` | 89 | 3155 | `f16f6e72b9761b09dc65e2fcd69f786e30b893afba76118401577254d8160302` |
| `website/components/site-header.js` | 186 | 7700 | `6ffe1ff1815300d7e9f407c27bebe7bff14e2e6c1a794ce5290b9c0eb8c6f734` |
| `website/components/site-footer.js` | 135 | 6073 | `c7e344060916fa91cd8f597d661626ef82298032ce7615c777b8d5c61954a4f8` |
| `website/components/browser-logo-rail.js` | 64 | 2681 | `2c6cf5821cc1120adfae0204e37336e69c2e90a2db603afe558b68188fc4652b` |
| `website/components/scenic-detail-page.js` | 332 | 14521 | `2c8fcc51be06adc875c7496f478f6b61022d2ae8235216714f988ab8a5c27701` |
| `website/components/site-shell-data.js` | 21 | 473 | `28a1ac9ce4806438149720a36b7e4c586dd09f99142ebc63e1c863afcbd145d0` |
| `website/app/page.js` | 661 | 31825 | `f396b57a6b5a4e83a3546957df084c9e71c63b35d4e8ba28adb85784c5f93f05` |
| `website/app/downloads/page.js` | 364 | 14976 | `946b20660d8633edda3d0ff1723e3c9229b66f03139eb28930647e9acf123eba` |
| `website/app/privacy/page.js` | 819 | 35232 | `41e818a2f2f8bf9da3daa81e2e7b25863951b9090ce19f8a6aaec353af6f0cb9` |

## Source And Effect Blocks

External navigation surface source/effect blocks: 10.

| Boundary | Current behavior | Risk before navigation changes |
| --- | --- | --- |
| Background What’s New open | `FilterTube_OpenWhatsNew` opens `request?.url || WHATS_NEW_PAGE_URL` through `browserAPI.tabs.create`. | A message caller can supply the privileged open target until an allowlist and sender-class gate exist. |
| Release banner fallback | The release banner prefers `WHATS_NEW_URL`, sends it to background, then falls back to `window.open()` and `location.href`. | The same CTA can move through three open paths with no shared URL class report. |
| Popup internal route opens | Popup content-control and dashboard opens build extension URLs with `runtime.getURL()` and fall back to `window.open()`. | Internal extension routes are locally constructed, but fallback policy is copied inline. |
| Dashboard support open | Tab-view Ko-fi opens use a fixed URL with `runtimeAPI.tabs.create` or `window.open()`. | Fixed support links are user-clicked locally but are not classified as official support links. |
| Subscription import tab | Tab-view updates or creates `https://m.youtube.com/feed/channels` tabs for import readiness. | YouTube workflow navigation is fixed today, but it lacks a shared user-intent and host policy. |
| Extension static links | `html/tab-view.html` has 7 target-blank anchors; 1 brand link has no `rel`, 2 app download links use only `noreferrer`, and 4 support/Nanah links use `noopener noreferrer`. | Static link safety is inconsistent and needs one extension HTML link policy. |
| Extension remote stylesheet | `html/popup.html` and `html/tab-view.html` load Google Fonts stylesheets. | Remote stylesheets are static resources, not opens, but remain part of external-resource policy. |
| Website shared action link | `website/components/marketing-ui.js` external `ActionLink` uses `rel="noreferrer" target="_blank"`. | Website CTA policy is component-local and does not classify URL types. |
| Website repeated link helpers | Site header, footer, downloads, browser rail, homepage, and privacy page each encode external link behavior locally. | Website external links do not share one URL class report across GitHub, stores, support, mail, Nanah, demo video, and downloads. |
| Public URL data | Website data and route content contain public URLs for install, GitHub, Nanah, support, and YouTube demo flows. | Public copy can drift from product link/open policy without fixture-backed URL classification. |

## Selected Counts

- External navigation source files: 15.
- Runtime `tabs.create` callsites in selected files: 5.
- Runtime `window.open` callsites in selected files: 7.
- Runtime `location.href` assignment callsites in selected files: 1.
- Runtime `runtime.getURL` callsites in selected files: 8.
- `FilterTube_OpenWhatsNew` tokens in selected files: 2.
- `createBrowserTab()` tokens in selected files: 2.
- `updateBrowserTab()` tokens in selected files: 5.
- `queryBrowserTabs()` tokens in selected files: 4.
- Static/component `target="_blank"` tokens in selected files: 15.
- Static/component `rel` tokens containing `noopener`: 4.
- Static/component `rel` tokens containing `noreferrer`: 14.
- Static/component literal external `href="https://...` tokens: 15.
- Static/component `mailto:` href tokens: 2.
- HTTPS literal tokens in selected files: 35.
- Runtime external-navigation surface fixtures: 7.

## Current Behavior

- Background What’s New opening still accepts `request?.url` before falling
  back to the extension-owned `WHATS_NEW_PAGE_URL`.
- The release banner CTA delegates to background and then falls back to
  `window.open(targetLink, '_blank', 'noopener')` and `location.href =
  targetLink`.
- Popup internal tab opens use `runtime.getURL()` for extension-owned tab-view
  routes, but the fallback open policy is duplicated inline.
- Tab-view support and subscription import flows use fixed URLs today, while
  subscription import can also update an existing YouTube tab to the channels
  feed.
- Extension static anchors do not share one rel policy: the brand link has no
  `rel`, app download links use `noreferrer`, and help/Nanah links use
  `noopener noreferrer`.
- Website external links are spread across shared and page-local helpers:
  `ActionLink`, `FooterLink`, `ExternalTextLink`, `PolicyLink`, site header
  GitHub links, browser logo rail links, and homepage support/demo links.
- Product source has no shared URL class, navigation owner, or public link data
  classification artifact.

## Runtime Fixture Results

- The background What’s New block still opens caller-supplied URLs and lacks
  `isTrustedUiSender`, `allowedWhatsNewUrl`, and `externalNavigationAuthority`.
- The release banner still has three open paths for the same CTA:
  background message, `window.open`, and `location.href`.
- Popup internal opens still build extension routes with `runtime.getURL()` and
  use `window.open` fallbacks.
- Tab-view still opens a fixed Ko-fi support link and a fixed YouTube channels
  feed for subscription import.
- Extension target-blank anchors and website external helpers remain
  source-local rather than one checked link policy.
- Public website and extension URL literals remain unclassified by URL class.
- Product source still lacks external navigation authority symbols.

## Risks

- Reliability: runtime opens, static anchors, website links, support URLs,
  release prompts, and subscription import tab movement are controlled by
  different local policies.
- False-hide/leak: a caller-supplied or drifted link can move users to the
  wrong surface while related filtering, prompt, and import state assumes an
  extension-owned or YouTube-owned target.
- Performance: subscription import can query, update, create, and ping tabs
  without a navigation budget shared with message and lifecycle budgets.
- Code burden: extension runtime, static HTML, website components, page-local
  helpers, and public copy all repeat link/open assumptions.

## Future Proof Required Before Behavior Changes

Before changing any open/link target, release CTA, popup route open, dashboard
support link, subscription import tab behavior, extension target-blank anchor,
website external link, or public URL data, add fixture-backed reports for:

```text
externalNavigationSurfaceBoundaryContract
externalNavigationDecisionReport
externalNavigationUrlClassReport
externalNavigationTrustedSenderReport
externalNavigationWhatsNewUrlPolicy
externalNavigationReleaseFallbackPolicy
externalNavigationExtensionHtmlLinkPolicy
externalNavigationWebsiteLinkPolicy
externalNavigationSubscriptionImportTabPolicy
externalNavigationPublicUrlDataReport
externalNavigationFixtureProvenance
externalNavigationMetricArtifact
```

No `externalNavigationSurfaceBoundaryContract`,
`externalNavigationDecisionReport`,
`externalNavigationUrlClassReport`,
`externalNavigationTrustedSenderReport`,
`externalNavigationWhatsNewUrlPolicy`,
`externalNavigationReleaseFallbackPolicy`,
`externalNavigationExtensionHtmlLinkPolicy`,
`externalNavigationWebsiteLinkPolicy`,
`externalNavigationSubscriptionImportTabPolicy`,
`externalNavigationPublicUrlDataReport`,
`externalNavigationFixtureProvenance`, or
`externalNavigationMetricArtifact` exists in product runtime or website source
yet.
