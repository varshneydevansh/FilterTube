# FilterTube P0 Network Authority Current Behavior - 2026-05-18

Status: current-behavior proof slice. This is not an implementation patch.

This document converts the P0 network/fetch authority family from
`docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md` into runnable
fixtures. It does not change fetches, XHR interception, credentials,
tab/window opens, release-note loading, identity fallback, subscription import,
or website remotes.

## P0 Fixture Family

```text
P0 network/fetch authority:
  network_authority_counts_all_tracked_fetch_xhr_open_surfaces
  network_authority_release_note_fetches_are_extension_resource_only
  network_authority_watch_identity_fetch_requires_valid_video_id_and_active_reason
  network_authority_kids_identity_fetch_requires_kids_surface_reason
  network_authority_channel_detail_fetch_rejects_untrusted_sender
  network_authority_content_bridge_watch_fetch_requires_metadata_or_identity_reason
  network_authority_subscription_import_fetch_requires_explicit_user_import
  network_authority_seed_interception_no_rule_passes_through_without_parse
  network_authority_fetch_credentials_policy_is_declared_per_owner
  network_authority_website_remotes_are_website_only_claims
  network_authority_external_tab_open_urls_are_allowlisted
  network_authority_raw_capture_urls_never_become_runtime_fetch_targets
```

These names are future expectations. The current tests intentionally prove
where today's source already has useful boundaries and where it lacks the
single network authority needed before behavior changes.

## Current Findings

| P0 fixture | Current behavior | Current proof | Future expectation |
| --- | --- | --- | --- |
| `network_authority_counts_all_tracked_fetch_xhr_open_surfaces` | Current tracked non-vendor source has 14 `fetch()` sites, 2 `XMLHttpRequest` references, 11 credentials option sites, 3 `tabs.create()` sites, and 7 `window.open()` sites. | `tests/runtime/p0-network-authority-current-behavior.test.mjs` | Counts should remain source-derived and must be tied to owner records before changing fetch/open behavior. |
| `network_authority_release_note_fetches_are_extension_resource_only` | Release-note fetches load `data/release_notes.json` through extension resource URLs or local relative dashboard fallback, not YouTube URLs. | `tests/runtime/p0-network-authority-current-behavior.test.mjs` | Release-note fetches should remain extension-resource/local dashboard work and never become YouTube-visible filtering work. |
| `network_authority_watch_identity_fetch_requires_valid_video_id_and_active_reason` | Watch identity fetches validate video ID shape, but there is no shared `networkAuthority` record proving active-rule reason, route, budget, or user-visible purpose. | `tests/runtime/p0-network-authority-current-behavior.test.mjs` | Watch identity fetches should require valid video ID plus explicit active metadata/identity reason and per-navigation budget. |
| `network_authority_kids_identity_fetch_requires_kids_surface_reason` | Kids watch identity fetches validate video ID shape and target YouTube Kids, but there is no shared route/surface authority record. | `tests/runtime/p0-network-authority-current-behavior.test.mjs` | Kids identity fetches should require Kids surface reason and must not be callable from Main/YTM surfaces without an authority record. |
| `network_authority_channel_detail_fetch_rejects_untrusted_sender` | `fetchChannelDetails` calls `fetchChannelInfo()` without the `isTrustedUiSender()` guard used by several settings mutations. | `tests/runtime/p0-network-authority-current-behavior.test.mjs` | Caller-triggered channel detail fetches should reject untrusted senders and report owner/actor class. |
| `network_authority_content_bridge_watch_fetch_requires_metadata_or_identity_reason` | Content bridge has direct watch/shorts metadata and identity fetches with video ID guards, but no shared reason/budget owner. | `tests/runtime/p0-network-authority-current-behavior.test.mjs` | Content bridge watch fetches should require a metadata or identity reason and route/surface owner before network work starts. |
| `network_authority_subscription_import_fetch_requires_explicit_user_import` | Subscription import fetch is concentrated in the injector and is requested through the subscription-import message path, but it still lacks a central network authority record. | `tests/runtime/p0-network-authority-current-behavior.test.mjs` | Subscription import fetches should require explicit user import, request id, timeout, credentials policy, and caller authority. |
| `network_authority_seed_interception_no_rule_passes_through_without_parse` | Seed no-rule/disabled YouTubei interception still clones/parses/stringifies responses before pass-through-like outcomes. | `tests/runtime/p0-network-authority-current-behavior.test.mjs`; `tests/runtime/p0-endpoint-policy-current-behavior.test.mjs` | No-rule and disabled interception should return original responses before JSON parse/stringify when endpoint policy says pass-through. |
| `network_authority_fetch_credentials_policy_is_declared_per_owner` | Individual fetch calls declare raw credentials options, but no owner-level credentials policy exists. | `tests/runtime/p0-network-authority-current-behavior.test.mjs` | Every fetch owner should declare credentials policy through one network authority record. |
| `network_authority_website_remotes_are_website_only_claims` | Vercel Analytics and CDN browser logos live in website source and privacy copy says analytics is website-only. | `tests/runtime/p0-network-authority-current-behavior.test.mjs` | Website remotes should stay website-only and must not be described as extension/app runtime collection. |
| `network_authority_external_tab_open_urls_are_allowlisted` | Runtime open surfaces exist, and at least one What's New path accepts caller-supplied URL fallback today. | `tests/runtime/p0-network-authority-current-behavior.test.mjs`; `tests/runtime/external-navigation-authority-current-behavior.test.mjs` | External open targets should be fixed or allowlisted by owner and user action. |
| `network_authority_raw_capture_urls_never_become_runtime_fetch_targets` | Ignored raw captures remain evidence only and are not product fetch target source. | `tests/runtime/p0-network-authority-current-behavior.test.mjs`; `docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md` | Raw root captures must never become runtime fetch targets or shipped URL allowlists. |

## Required Future Network Contract

Each network/fetch fixture must eventually assert:

```text
networkAuthority owner id exists
trigger and sender class exist
route and surface exist
credentials policy is declared by owner
userInitiated is explicit
activeRuleReason or metadataReason exists for YouTube-visible fetches
maxPerNavigation and timeoutMs exist for identity fallbacks
pass-through endpoint decisions happen before JSON parse/stringify
external open target is fixed or allowlisted
raw capture path count in runtime fetch targets: 0
```

## Current Verdict

```text
P0 network/fetch authority family is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
```

Related artifacts:

- `docs/audit/FILTERTUBE_NETWORK_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_EXTERNAL_NAVIGATION_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_ENDPOINT_DECISION_MATRIX_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_ENDPOINT_POLICY_CURRENT_BEHAVIOR_2026-05-18.md`
- `docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 network authority family can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint rewrites, fetch/XHR no-work
changes, network authority changes, or whitelist behavior changes.
