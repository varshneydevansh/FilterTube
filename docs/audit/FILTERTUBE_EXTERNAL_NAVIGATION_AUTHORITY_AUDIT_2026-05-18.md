# FilterTube External Navigation Authority Audit - 2026-05-18

Status: current-behavior audit. This is not an implementation patch.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Why This Slice Exists

Opening a tab or navigating a window is a side effect with a different risk
profile from passive filtering. It can expose a user to an external page,
trigger browser permission behavior, bypass intended extension-page routing, or
turn a data field into a navigable target.

Current navigation surfaces are split across:

```text
extension runtime actions
  -> background privileged tabs.create
  -> popup open-in-tab fallbacks
  -> tab-view support/import tab creation
  -> release-notes banner fallbacks

extension static HTML
  -> dashboard brand, app release cards, Nanah relay/source links, YouTube Kids help links

public website
  -> external store/GitHub/documentation/video links
  -> reusable ActionLink/ExternalTextLink components
  -> route-data href arrays
```

These surfaces should not share one informal "just open a URL" rule. A
`chrome-extension://` dashboard URL, a fixed Ko-fi URL, a YouTube subscription
import helper URL, a public website store link, and a release-banner CTA all
need different owner, allowlist, sender, and fallback rules.

## Current Extension Runtime Navigation Counts

Authoritative scan command:

```bash
node - <<'NODE'
const fs=require('fs');
const files=['js/background.js','js/popup.js','js/tab-view.js','js/content/release_notes_prompt.js'];
const pats={
  windowOpen:/\bwindow\.open\s*\(/g,
  locationHref:/\blocation\.href\s*=/g,
  browserTabsCreate:/\bbrowserAPI\.tabs\.create\s*\(/g,
  tabsApiCreate:/\btabsApi\.create\s*\(/g,
  runtimeTabsCreate:/\bruntimeAPI\.tabs\.create\s*\(/g,
  createBrowserTab:/\bcreateBrowserTab\s*\(/g
};
for(const f of files){
  const t=fs.readFileSync(f,'utf8');
  const row={};
  for(const [k,p] of Object.entries(pats)) row[k]=(t.match(p)||[]).length;
  console.log(f, JSON.stringify(row));
}
NODE
```

Current counts:

```text
js/background.js:
  browserAPI.tabs.create: 1

js/popup.js:
  tabsApi.create: 2
  window.open: 5

js/tab-view.js:
  runtimeAPI.tabs.create: 2
  createBrowserTab references: 2
  window.open: 1

js/content/release_notes_prompt.js:
  window.open: 1
  location.href assignment: 1
```

## Current Runtime Families

### What’s New / Release Banner

The background `FilterTube_OpenWhatsNew` branch opens
`request.url || WHATS_NEW_PAGE_URL` with `browserAPI.tabs.create`.

Source: `js/background.js:3221-3225`.

The content release banner computes `targetLink = WHATS_NEW_URL || payload.link`,
delegates to `FilterTube_OpenWhatsNew`, then falls back to `window.open` and
finally `location.href`.

Source: `js/content/release_notes_prompt.js:147-170`.

Risk: the packaged payload currently uses the extension What’s New URL, but the
background action still accepts caller-supplied `request.url`. That belongs
with message-trust and allowlist fixtures before any release prompt changes.

### Popup Internal Dashboard Opens

The popup opens extension-owned `html/tab-view.html` URLs with
`runtime.getURL(...)` and falls back to `window.open` when tab creation fails.

Sources: `js/popup.js:552-570`, `js/popup.js:1797-1813`.

Risk: this is internal extension navigation, but fallback behavior should still
be an owned action because popup routing controls which profile/filter section
the user lands on.

### Dashboard Support And Subscription Import

The dashboard Support button opens a fixed Ko-fi URL with `runtimeAPI.tabs.create`
or `window.open`.

Source: `js/tab-view.js:2924-2929`.

The subscription import flow creates a background tab for the fixed YouTube
mobile subscriptions URL.

Source: `js/tab-view.js:3154-3169`, `js/tab-view.js:4775-4778`.

Risk: Ko-fi is an external support link; subscription import opens YouTube as a
workflow dependency. Both need explicit owner labels and allowlisted URLs.

## Static Extension HTML Link Surfaces

Current extension HTML external link facts:

```text
html/tab-view.html target="_blank" anchors: 7
html/tab-view.html https:// href anchors: 8
html/popup.html https:// href anchors: 1 font stylesheet
```

Important current gaps:

- The dashboard brand link opens `https://filtertube.in` with `target="_blank"`
  and no `rel`.
- Android/iOS app dashboard cards open `https://www.filtertube.in/downloads`
  with `rel="noreferrer"` but not explicit `noopener`.
- Nanah and YouTube Kids help links use `rel="noopener noreferrer"`.

Sources: `html/tab-view.html:22`, `200`, `216`, `837`, `1327`, `1469`,
`1475`.

Risk: static links are user-visible product navigation, not filtering logic.
They need a public-link allowlist and one target-blank policy.

## Website Link Surfaces

Website public links live in both data files and components:

- `website/components/route-content.js` exports `demoVideoHref`, `docsHref`,
  `githubHref`, browser store links, and CDN browser-logo URLs.
- `website/components/site-data.js` exports footer/resource/store links.
- `website/components/marketing-ui.js` uses `ActionLink external` with
  `target="_blank"` and `rel="noreferrer"`.
- `website/app/downloads/page.js` uses `ExternalTextLink` with
  `target="_blank"` and `rel="noreferrer"`.
- `website/components/site-header.js` opens GitHub in a new tab.

Risk: these are public website links, not extension runtime actions. They
should be validated as store/public-claim surfaces and kept separate from
content-script or background tab-opening authority.

## Ignored Raw Capture Boundary

Root ignored HTML/JSON/TXT captures can contain YouTube URLs, channel URLs,
watch URLs, and endpoint strings. They are evidence inputs for minimal fixtures
only. They must not become navigation allowlists, default tab-open targets, or
release-package link data.

## Required Future Authority

Future token: `externalNavigationAuthority`

Required shape:

```text
externalNavigationAuthority.open({
  owner,
  senderClass,
  sourceSurface,
  url,
  urlClass,
  userInitiated,
  allowlistName,
  fallbackPolicy,
  relPolicy,
  targetPolicy
})
```

Required URL classes:

- `extension_internal`
- `official_filtertube_site`
- `official_filtertube_downloads`
- `official_repository`
- `official_store_listing`
- `official_support_link`
- `youtube_workflow_dependency`
- `youtube_help_reference`
- `nanah_reference`
- `public_website_demo`
- `website_remote_asset`

## P0 Fixture Gates

```text
external_navigation_authority_counts_extension_runtime_open_surfaces
external_navigation_authority_open_whats_new_rejects_caller_supplied_url
external_navigation_authority_release_banner_fallbacks_use_allowlisted_extension_url
external_navigation_authority_popup_internal_opens_use_runtime_geturl
external_navigation_authority_kofi_link_is_fixed_and_user_initiated
external_navigation_authority_subscription_import_tab_uses_fixed_youtube_channels_url
external_navigation_authority_extension_target_blank_links_have_noopener_policy
external_navigation_authority_website_external_links_share_one_component_policy
external_navigation_authority_public_link_data_is_classified_by_url_class
external_navigation_authority_raw_capture_urls_never_become_open_targets
```

## Implementation Rule

Do not change release banner links, popup open-in-tab routing, dashboard support
links, subscription-import tab creation, extension-page anchors, website
external links, or target-blank/rel policy until the matching navigation
authority fixtures exist.
