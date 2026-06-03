# FilterTube P0 External Navigation Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

This document converts the P0 external navigation/link authority family from
`docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md` into dedicated
current-behavior proof. It covers every runtime and public-link path that can
open a tab, navigate a window, or expose a target-blank external link.

External navigation is not just a UI convenience. It is a side effect. A
caller-supplied What’s New URL, an extension dashboard route, a Ko-fi support
link, a YouTube subscription-import workflow tab, a public website store link,
and a raw captured YouTube URL require different trust and allowlist rules.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## P0 Fixture Family

```text
P0 external navigation/link authority:
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

These fixture names are future expectations. The current tests pin which
expectations are already locally true, which are only partially represented,
and which are not satisfied yet.

## Current Findings

| P0 fixture | Current behavior | Current proof | Future expectation |
| --- | --- | --- | --- |
| `external_navigation_authority_counts_extension_runtime_open_surfaces` | Runtime open surfaces are source-counted, but no central owner report exists. Current counted files are `js/background.js`, `js/popup.js`, `js/tab-view.js`, and `js/content/release_notes_prompt.js`. | `tests/runtime/p0-external-navigation-current-behavior.test.mjs`; `tests/runtime/external-navigation-authority-current-behavior.test.mjs` | One navigation registry must count owner, sender class, URL class, fallback, and user-action status before behavior changes. |
| `external_navigation_authority_open_whats_new_rejects_caller_supplied_url` | Not satisfied. `FilterTube_OpenWhatsNew` opens `request.url || WHATS_NEW_PAGE_URL` through privileged background `tabs.create`. | `js/background.js`; P0 test | Reject caller-supplied URLs or require allowlisted extension-owned What’s New URL plus trusted sender class. |
| `external_navigation_authority_release_banner_fallbacks_use_allowlisted_extension_url` | Partially represented. The banner prefers `WHATS_NEW_URL`, then sends `targetLink` to background, then falls back to `window.open` and `location.href`. | `js/content/release_notes_prompt.js`; P0 test | Fallbacks must use the same allowlisted extension URL and should not navigate to arbitrary payload links. |
| `external_navigation_authority_popup_internal_opens_use_runtime_geturl` | Locally true for primary URL construction. Popup dashboard opens use `runtime.getURL('html/tab-view.html...')`, then fallback to `window.open`. | `js/popup.js`; P0 test | Keep internal route URLs extension-owned and report fallback policy. |
| `external_navigation_authority_kofi_link_is_fixed_and_user_initiated` | Locally true as a fixed URL button handler, but not centrally reported. | `js/tab-view.js`; P0 test | Support links need fixed URL class, user-action source, and fallback policy. |
| `external_navigation_authority_subscription_import_tab_uses_fixed_youtube_channels_url` | Locally true for fallback tab creation: it opens `https://m.youtube.com/feed/channels` as an inactive tab. | `js/tab-view.js`; P0 test | Subscription-import navigation must stay fixed, user-triggered, inactive when appropriate, and separated from passive filtering. |
| `external_navigation_authority_extension_target_blank_links_have_noopener_policy` | Not satisfied for every static link. The dashboard brand link has `target="_blank"` without `rel`; app release cards use `rel="noreferrer"` without explicit `noopener`; Nanah/help links use `noopener noreferrer`. | `html/tab-view.html`; P0 test | Every extension static `target="_blank"` link must have one rel policy and URL class. |
| `external_navigation_authority_website_external_links_share_one_component_policy` | Partially represented. Website components use reusable external link helpers in some places, while route/page/header surfaces still define public links across several files. | `website/components/*`; `website/app/*`; P0 test | Public website external navigation should share one component/rel/target policy unless a page explicitly opts out. |
| `external_navigation_authority_public_link_data_is_classified_by_url_class` | Not satisfied. Public links exist for stores, GitHub, demo video, CDN remote assets, downloads, support, Nanah, and YouTube help, but there is no single URL-class manifest. | Website and extension source; P0 test | Add a URL class manifest for official site, downloads, repository, store, support, YouTube workflow/help, Nanah, demo, and remote asset links. |
| `external_navigation_authority_raw_capture_urls_never_become_open_targets` | Locally true by boundary: ignored raw captures are not tracked product source and are excluded from current navigation source scans. | `.gitignore`; source-boundary tests; P0 test | Keep raw capture URLs evidence-only and never use them as open-target allowlists or defaults. |

## Current Runtime Count Snapshot

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

These counts are useful as current behavior, not as the final contract. The
missing contract is a shared authority such as:

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

## Current Verdict

```text
P0 external navigation/link authority family is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
Do not change release banner links, popup open-in-tab routing, dashboard
support links, subscription-import tabs, extension static anchors, website
external links, or target-blank rel policy until this family has future
behavior proof.
```

Related artifacts:

- `docs/audit/FILTERTUBE_EXTERNAL_NAVIGATION_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md`
- `docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md`
- `tests/runtime/external-navigation-authority-current-behavior.test.mjs`
