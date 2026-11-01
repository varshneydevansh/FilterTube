# FilterTube All Callable Index - 2026-05-18

Status: audit artifact only. This file does not change product behavior.

This is the first repo-wide callable index over authoritative tracked source:

```text
git ls-files '*.js' '*.jsx' '*.mjs'
```

It deliberately excludes ignored raw captures, ignored generated package output,
dependency caches, website build output, and local scratch files. Those
boundaries are pinned in
`docs/audit/FILTERTUBE_SOURCE_BOUNDARY_AUDIT_2026-05-18.md`.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6315
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6315
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Parser Boundary

The count is lexical, not semantic. It counts:

- named function declarations,
- arrow functions assigned to variables,
- object-method shorthand,
- object properties assigned to functions,
- exported forms of the above.

It does not prove that a callable is safe. It only proves that the callable is
now visible to the audit and assigned to a source family.

## Semantic Method Boundary

The complete-codebase objective says "every method", but this index is not yet
that semantic proof. A counted callable becomes method-level audit proof only
after a later artifact records at least:

- owner family and source file,
- trigger path and caller class,
- settings/profile/list-mode inputs,
- route/surface scope,
- observable side effects such as DOM writes, fetches, storage writes,
  page messages, tab opens, timers, observers, or media/player actions,
- active/no-rule/disabled behavior,
- teardown or idempotence behavior for lifecycle work,
- positive and negative fixtures for the behavior being changed.

Until those fields exist, the callable is counted and visible, but behavior
changes remain blocked by the implementation gate.

## Summary

```text
tracked JS/JSX/MJS files: 73
repo-wide lexical callables: 6315
```

| Family | Files | Lexical callables | Boundary |
| --- | ---: | ---: | --- |
| Hot page/background runtime | 9 | 3177 | Already has detailed first-pass hot runtime table in `FILTERTUBE_FUNCTION_COVERAGE_2026-05-17.md`. |
| Content helper runtime | 9 | 348 | First-pass helper surface audit exists, but behavior fixtures remain incomplete. |
| UI/settings runtime | 14 | 2103 | First-pass UI/settings audit exists, but action-level fixtures remain incomplete. |
| Generated/quarantined UI | 6 | 147 | Generated source/output and `js/layout.js`; freshness and quarantine checks required. |
| Vendor bundles | 2 | 279 | API/provenance boundary, not product-owned method behavior. |
| Build/sync scripts | 4 | 58 | Release/package/native-sync behavior; separate release fixtures required. |
| Audit/test lane scripts | 3 | 80 | Change-safety classifier, drift guard, and lane runner proof; workflow behavior, not product runtime. |
| Website routes/components/config | 26 | 123 | Public website callable surface; public-claim and asset-budget fixtures required. |

## File-Level Index

| File | Family | Lexical callables | Audit status |
| --- | --- | ---: | --- |
| `build.js` | Build/sync scripts | 51 | release-audited first pass |
| `js/background.js` | Hot page/background runtime | 472 | hot runtime mapped |
| `js/content/block_channel.js` | Hot page/background runtime | 226 | hot runtime mapped |
| `js/content/bridge_injection.js` | Content helper runtime | 12 | helper counted |
| `js/content/bridge_settings.js` | Hot page/background runtime | 104 | hot runtime mapped |
| `js/content/collab_dialog.js` | Content helper runtime | 42 | helper counted |
| `js/content/dom_extractors.js` | Content helper runtime | 117 | helper counted |
| `js/content/dom_fallback.js` | Hot page/background runtime | 431 | hot runtime mapped |
| `js/content/dom_helpers.js` | Content helper runtime | 21 | helper counted |
| `js/content/dom_state.js` | Content helper runtime | 42 | helper counted |
| `js/content/first_run_prompt.js` | Content helper runtime | 7 | helper counted |
| `js/content/handle_resolver.js` | Hot page/background runtime | 22 | hot runtime mapped |
| `js/content/menu.js` | Content helper runtime | 3 | helper counted |
| `js/content/release_notes_prompt.js` | Content helper runtime | 12 | helper counted |
| `js/content_bridge.js` | Hot page/background runtime | 1203 | hot runtime mapped |
| `js/content_controls_catalog.js` | UI/settings runtime | 3 | UI/settings counted |
| `js/filter_logic.js` | Hot page/background runtime | 313 | hot runtime mapped |
| `js/injector.js` | Hot page/background runtime | 314 | hot runtime mapped |
| `js/io_manager.js` | UI/settings runtime | 121 | UI/settings counted |
| `js/layout.js` | Generated/quarantined UI | 52 | quarantined/generated boundary |
| `js/managed_admin_authority.js` | UI/settings runtime | 18 | UI/settings counted |
| `js/managed_parent_command_center.js` | UI/settings runtime | 14 | UI/settings counted |
| `js/nanah_managed_live_policy.js` | UI/settings runtime | 97 | UI/settings counted |
| `js/nanah_managed_open_sync.js` | UI/settings runtime | 33 | UI/settings counted |
| `js/nanah_sync_adapter.js` | UI/settings runtime | 177 | UI/settings counted |
| `js/popup.js` | UI/settings runtime | 131 | UI/settings counted |
| `js/render_engine.js` | UI/settings runtime | 126 | UI/settings counted |
| `js/security_manager.js` | UI/settings runtime | 18 | UI/settings counted |
| `js/seed.js` | Hot page/background runtime | 92 | hot runtime mapped |
| `js/settings_shared.js` | UI/settings runtime | 43 | UI/settings counted |
| `js/shared/identity.js` | Content helper runtime | 92 | helper counted |
| `js/state_manager.js` | UI/settings runtime | 155 | UI/settings counted |
| `js/tab-view.js` | UI/settings runtime | 1103 | UI/settings counted |
| `js/ui-shell/popup-shell.js` | Generated/quarantined UI | 42 | generated output boundary |
| `js/ui-shell/tab-view-decor.js` | Generated/quarantined UI | 41 | generated output boundary |
| `js/ui_components.js` | UI/settings runtime | 64 | UI/settings counted |
| `js/vendor/nanah.bundle.js` | Vendor bundles | 107 | vendor API/provenance boundary |
| `js/vendor/qrcode.bundle.js` | Vendor bundles | 172 | vendor API/provenance boundary |
| `scripts/audit-proof-drift.mjs` | Audit/test lane scripts | 19 | audit lane counted |
| `scripts/build-extension-ui.mjs` | Build/sync scripts | 2 | build/website counted |
| `scripts/build-nanah-vendor.mjs` | Build/sync scripts | 4 | build/website counted |
| `scripts/run-test-lane.mjs` | Audit/test lane scripts | 61 | audit lane counted |
| `scripts/sync-native-runtime.mjs` | Build/sync scripts | 1 | build/website counted |
| `scripts/test-lane-config.mjs` | Audit/test lane scripts | 0 | audit lane counted |
| `src/extension-shell/popup.jsx` | Generated/quarantined UI | 3 | generated source boundary |
| `src/extension-shell/shared/runtime.js` | Generated/quarantined UI | 7 | generated source boundary |
| `src/extension-shell/tab-view-decor.jsx` | Generated/quarantined UI | 2 | generated source boundary |
| `website/app/[slug]/page.js` | Website routes/components/config | 4 | website counted |
| `website/app/downloads/page.js` | Website routes/components/config | 2 | website counted |
| `website/app/layout.js` | Website routes/components/config | 0 | website counted |
| `website/app/not-found.js` | Website routes/components/config | 0 | website counted |
| `website/app/page.js` | Website routes/components/config | 2 | website counted |
| `website/app/privacy/page.js` | Website routes/components/config | 4 | website counted |
| `website/app/robots.js` | Website routes/components/config | 0 | website counted |
| `website/app/sitemap.js` | Website routes/components/config | 0 | website counted |
| `website/app/terms/page.js` | Website routes/components/config | 0 | website counted |
| `website/components/browser-logo-rail.js` | Website routes/components/config | 1 | website counted |
| `website/components/footer-signal-art.js` | Website routes/components/config | 63 | website counted |
| `website/components/hero-video.js` | Website routes/components/config | 4 | website counted |
| `website/components/marketing-ui.js` | Website routes/components/config | 6 | website counted |
| `website/components/reveal.js` | Website routes/components/config | 1 | website counted |
| `website/components/route-content.js` | Website routes/components/config | 0 | website counted |
| `website/components/scene-controller.js` | Website routes/components/config | 10 | website counted |
| `website/components/scenic-detail-page.js` | Website routes/components/config | 6 | website counted |
| `website/components/scenic-illustration.js` | Website routes/components/config | 3 | website counted |
| `website/components/scenic-tones.js` | Website routes/components/config | 1 | website counted |
| `website/components/site-data.js` | Website routes/components/config | 0 | website counted |
| `website/components/site-footer.js` | Website routes/components/config | 3 | website counted |
| `website/components/site-header.js` | Website routes/components/config | 3 | website counted |
| `website/components/site-shell-data.js` | Website routes/components/config | 0 | website counted |
| `website/components/theme-toggle.js` | Website routes/components/config | 10 | website counted |
| `website/next.config.mjs` | Website routes/components/config | 0 | website counted |
| `website/postcss.config.mjs` | Website routes/components/config | 0 | website counted |

## High-Impact Scale Findings

1. **`js/content_bridge.js` is the largest callable surface.**
   The broad parser finds 1,203 callable forms in this file. That reinforces
   the earlier split-authority finding: content bridge is too large to treat as
   one behavior surface.

2. **`js/tab-view.js` is the largest UI surface.**
   The broad parser finds 1,101 callable forms. Any dashboard change can cross
   profiles, filters, Kids, Nanah, import/export, release notes, settings, and
   app-card flows.

3. **The hot runtime is not the whole product.**
   Hot runtime has 3,177 lexical callables, but UI/settings, content helpers,
   generated shell, vendor, build scripts, and website add another 3,138
   lexical callable forms.

4. **Vendor and generated files must stay explicitly bounded.**
   Vendor bundles and generated shell output contribute 279 and 83 callable
   forms respectively. They need provenance/freshness proof, not line-by-line
   product-logic ownership claims.

5. **Website files are small but public-facing.**
   Only 123 lexical callable forms are in the website surface, but they control
   public privacy, download, platform, analytics, and release-state claims.

## Required Follow-Up

| Area | Next proof |
| --- | --- |
| Hot runtime | Split `js/content_bridge.js` and `js/content/dom_fallback.js` callable groups into route/feature/side-effect subfamilies. |
| UI/settings | Add action-level fixtures for saves, row actions, imports, Nanah apply, profile switches, list-mode changes, and listener idempotence. |
| Content helpers | Add message-auth, cached-identity, route-selector, prompt, menu-CSS, and hide/restore fixtures. |
| Generated shell | Add source/output freshness check for `src/extension-shell/*` -> `js/ui-shell/*`. |
| Vendor | Add Nanah and QR source hash/provenance manifest. |
| Website/build | Add release artifact manifest, draft-first release publication proof, local asset/privacy decision, and website media budgets. |

## Fixture Coverage

Executable current-behavior fixture:

```text
tests/runtime/all-callable-index-current-behavior.test.mjs
```

That fixture pins:

- all tracked JS/JSX/MJS files are listed,
- documented callable counts match current lexical source,
- documented family totals sum to 6,315,
- no ignored raw captures or generated package output are part of this index.


## Current Lexical Inventory - 2026-10-18

The preceding dated sections retain their historical evidence and NO-GO limits.
This current-source refresh expands lexical accounting to newly tracked files;
it does not promote any callable to complete semantic proof. The parser remains
lexical and its scope remains tracked JS/JSX/MJS: CJS/Python tooling requires its
separate release/workflow review and is not silently counted as JavaScript here.

```text
current tracked JS/JSX/MJS files: 141
current repo-wide lexical callables: 9986
current complete per-callable semantic proofs: 0
current callable behavior-change approval: NO-GO
runtime behavior changed by inventory refresh: no
```

| Family | Files | Lexical callables |
| --- | ---: | ---: |
| Build/sync scripts | 5 | 75 |
| Hot page/background runtime | 13 | 3931 |
| Content helper runtime | 25 | 860 |
| UI/settings runtime | 33 | 4028 |
| Generated/quarantined UI | 6 | 147 |
| Vendor bundles | 3 | 279 |
| Audit/test lane scripts | 25 | 517 |
| Website routes/components/config | 31 | 149 |

| File | Family | Lexical callables | Audit status |
| --- | --- | ---: | --- |
| `js/content/video_notes.js` | Content helper runtime | 26 | helper counted; semantic proof incomplete |
| `js/shared/local_playlists.js` | Content helper runtime | 40 | helper counted; semantic proof incomplete |
| `js/shared/saved_video_notes.js` | Content helper runtime | 20 | helper counted; semantic proof incomplete |
| `js/video_notes_background.js` | Hot page/background runtime | 18 | helper counted; semantic proof incomplete |
| `js/video_notes_editor.js` | UI/settings runtime | 25 | helper counted; semantic proof incomplete |
| `js/local_playlists_store.js` | Hot page/background runtime | 7 | helper counted; semantic proof incomplete |
| `js/video_notes_store.js` | Hot page/background runtime | 13 | helper counted; semantic proof incomplete |
| `js/auto_sync_queue.js` | UI/settings runtime | 33 | helper counted; semantic proof incomplete |
| `js/auto_sync_wakeup.js` | Hot page/background runtime | 11 | helper counted; semantic proof incomplete |
| `js/device_auto_sync.js` | UI/settings runtime | 27 | helper counted; semantic proof incomplete |
| `js/device_auto_sync_ui.js` | UI/settings runtime | 25 | helper counted; semantic proof incomplete |
| `js/managed_auto_sync.js` | UI/settings runtime | 16 | helper counted; semantic proof incomplete |
| `js/personal_auto_sync_runtime.js` | UI/settings runtime | 68 | helper counted; semantic proof incomplete |
| `js/personal_sync.js` | UI/settings runtime | 56 | helper counted; semantic proof incomplete |
| `js/nanah_pairing_ui.js` | UI/settings runtime | 6 | helper counted; semantic proof incomplete |
| `js/profile_preference_defaults.js` | UI/settings runtime | 14 | helper counted; semantic proof incomplete |
| `build.js` | Build/sync scripts | 68 | release-audited first pass |
| `js/background.js` | Hot page/background runtime | 586 | hot runtime mapped |
| `js/content/admission_overlay.js` | Content helper runtime | 25 | helper counted; semantic proof incomplete |
| `js/content/block_channel.js` | Hot page/background runtime | 234 | hot runtime mapped |
| `js/content/bridge_injection.js` | Content helper runtime | 14 | helper counted |
| `js/content/bridge_settings.js` | Hot page/background runtime | 157 | hot runtime mapped |
| `js/content/collab_dialog.js` | Content helper runtime | 42 | helper counted |
| `js/content/content_playback.js` | Content helper runtime | 36 | helper counted; semantic proof incomplete |
| `js/content/content_playback_admission.js` | Content helper runtime | 12 | helper counted; semantic proof incomplete |
| `js/content/content_playback_captions.js` | Content helper runtime | 19 | helper counted; semantic proof incomplete |
| `js/content/content_playback_native.js` | Content helper runtime | 47 | helper counted; semantic proof incomplete |
| `js/content/content_playback_player.js` | Content helper runtime | 45 | helper counted; semantic proof incomplete |
| `js/content/content_playback_response.js` | Content helper runtime | 30 | helper counted; semantic proof incomplete |
| `js/content/content_playback_transport.js` | Content helper runtime | 51 | helper counted; semantic proof incomplete |
| `js/content/dom_extractors.js` | Content helper runtime | 117 | helper counted |
| `js/content/dom_fallback.js` | Hot page/background runtime | 671 | hot runtime mapped |
| `js/content/dom_helpers.js` | Content helper runtime | 21 | helper counted |
| `js/content/dom_state.js` | Content helper runtime | 42 | helper counted |
| `js/content/external_youtube_guard.js` | Content helper runtime | 62 | helper counted; semantic proof incomplete |
| `js/content/external_youtube_network.js` | Content helper runtime | 28 | helper counted; semantic proof incomplete |
| `js/content/first_run_prompt.js` | Content helper runtime | 11 | helper counted |
| `js/content/handle_resolver.js` | Hot page/background runtime | 23 | hot runtime mapped |
| `js/content/menu.js` | Content helper runtime | 3 | helper counted |
| `js/content/release_notes_prompt.js` | Content helper runtime | 12 | helper counted |
| `js/content_bridge.js` | Hot page/background runtime | 1286 | hot runtime mapped |
| `js/content_controls_catalog.js` | UI/settings runtime | 5 | UI/settings counted |
| `js/family_device_navigation.js` | UI/settings runtime | 10 | UI/settings counted; semantic proof incomplete |
| `js/filter_logic.js` | Hot page/background runtime | 375 | hot runtime mapped |
| `js/imported_channel_enrichment.js` | UI/settings runtime | 81 | UI/settings counted; semantic proof incomplete |
| `js/injector.js` | Hot page/background runtime | 352 | hot runtime mapped |
| `js/io_manager.js` | UI/settings runtime | 225 | UI/settings counted |
| `js/layout.js` | Generated/quarantined UI | 52 | quarantined/generated boundary |
| `js/managed_admin_authority.js` | UI/settings runtime | 18 | UI/settings counted |
| `js/managed_parent_command_center.js` | UI/settings runtime | 78 | UI/settings counted |
| `js/nanah_managed_live_policy.js` | UI/settings runtime | 120 | UI/settings counted |
| `js/nanah_managed_local_network_client.js` | UI/settings runtime | 48 | UI/settings counted; semantic proof incomplete |
| `js/nanah_managed_mailbox_client.js` | UI/settings runtime | 37 | UI/settings counted; semantic proof incomplete |
| `js/nanah_managed_open_sync.js` | UI/settings runtime | 35 | UI/settings counted |
| `js/nanah_qr_scanner.js` | UI/settings runtime | 15 | UI/settings counted; semantic proof incomplete |
| `js/nanah_storage_lock.js` | UI/settings runtime | 3 | UI/settings counted; semantic proof incomplete |
| `js/nanah_sync_adapter.js` | UI/settings runtime | 208 | UI/settings counted |
| `js/popup.js` | UI/settings runtime | 170 | UI/settings counted |
| `js/render_engine.js` | UI/settings runtime | 171 | UI/settings counted |
| `js/rule_list_import_reports.js` | UI/settings runtime | 38 | UI/settings counted; semantic proof incomplete |
| `js/security_manager.js` | UI/settings runtime | 18 | UI/settings counted |
| `js/seed.js` | Hot page/background runtime | 198 | hot runtime mapped |
| `js/settings_shared.js` | UI/settings runtime | 45 | UI/settings counted |
| `js/shared/content_playback_resolver.js` | Content helper runtime | 25 | helper counted; semantic proof incomplete |
| `js/shared/content_playback_source.js` | Content helper runtime | 18 | helper counted; semantic proof incomplete |
| `js/shared/identity.js` | Content helper runtime | 110 | helper counted |
| `js/shared/view_count.js` | Content helper runtime | 4 | helper counted; semantic proof incomplete |
| `js/state_manager.js` | UI/settings runtime | 180 | UI/settings counted |
| `js/tab-view.js` | UI/settings runtime | 2158 | UI/settings counted |
| `js/ui-shell/popup-shell.js` | Generated/quarantined UI | 42 | generated output boundary |
| `js/ui-shell/tab-view-decor.js` | Generated/quarantined UI | 41 | generated output boundary |
| `js/ui_components.js` | UI/settings runtime | 65 | UI/settings counted |
| `js/ui_localization.js` | UI/settings runtime | 20 | UI/settings counted; semantic proof incomplete |
| `js/ui_localization_boot.js` | UI/settings runtime | 10 | UI/settings counted; semantic proof incomplete |
| `js/ui_static_copy_capture.js` | UI/settings runtime | 0 | UI/settings counted; semantic proof incomplete |
| `js/vendor/jsqr.bundle.js` | Vendor bundles | 0 | vendor API/provenance boundary |
| `js/vendor/nanah.bundle.js` | Vendor bundles | 107 | vendor API/provenance boundary |
| `js/vendor/qrcode.bundle.js` | Vendor bundles | 172 | vendor API/provenance boundary |
| `scripts/audit-proof-drift.mjs` | Audit/test lane scripts | 19 | audit lane counted |
| `scripts/build-extension-ui.mjs` | Build/sync scripts | 2 | build/website counted |
| `scripts/build-nanah-vendor.mjs` | Build/sync scripts | 4 | build/website counted |
| `scripts/build-qr-scanner-vendor.mjs` | Build/sync scripts | 0 | build provenance counted; semantic proof incomplete |
| `scripts/check-release-note-locales.mjs` | Audit/test lane scripts | 4 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/check-ui-locales.mjs` | Audit/test lane scripts | 16 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/create-family-device-capture-checklist.mjs` | Audit/test lane scripts | 17 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/create-family-device-evidence-packet.mjs` | Audit/test lane scripts | 12 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/create-managed-app-parity-smoke-artifact.mjs` | Audit/test lane scripts | 35 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/create-managed-extension-installed-smoke-artifact.mjs` | Audit/test lane scripts | 24 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/create-managed-native-runtime-sync-handoff.mjs` | Audit/test lane scripts | 27 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/create-managed-pickup-provider-ownership-artifact.mjs` | Audit/test lane scripts | 28 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/extract-family-ui-fallbacks.mjs` | Audit/test lane scripts | 1 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/import-family-device-downloaded-evidence.mjs` | Audit/test lane scripts | 34 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/managed-delivery-lan-discovery.mjs` | Audit/test lane scripts | 25 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/managed-delivery-provider.mjs` | Audit/test lane scripts | 66 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/merge-ui-locale-batch.mjs` | Audit/test lane scripts | 5 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/merge-ui-locale-drafts.mjs` | Audit/test lane scripts | 5 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/report-family-device-phase11-status.mjs` | Audit/test lane scripts | 30 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/report-family-device-phase12-status.mjs` | Audit/test lane scripts | 26 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/report-family-device-provider-surface.mjs` | Audit/test lane scripts | 14 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/report-family-device-release-readiness.mjs` | Audit/test lane scripts | 7 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/run-test-lane.mjs` | Audit/test lane scripts | 61 | audit lane counted |
| `scripts/sync-native-runtime.mjs` | Build/sync scripts | 1 | build/website counted |
| `scripts/test-lane-config.mjs` | Audit/test lane scripts | 0 | audit lane counted |
| `scripts/test-lane-file-rules.mjs` | Audit/test lane scripts | 0 | audit lane counted |
| `scripts/update-family-device-evidence-log.mjs` | Audit/test lane scripts | 23 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/validate-family-device-evidence.mjs` | Audit/test lane scripts | 24 | workflow/evidence tooling counted; semantic proof incomplete |
| `scripts/verify-managed-app-policy-contract.mjs` | Audit/test lane scripts | 14 | workflow/evidence tooling counted; semantic proof incomplete |
| `src/extension-shell/popup.jsx` | Generated/quarantined UI | 3 | generated source boundary |
| `src/extension-shell/shared/runtime.js` | Generated/quarantined UI | 7 | generated source boundary |
| `src/extension-shell/tab-view-decor.jsx` | Generated/quarantined UI | 2 | generated source boundary |
| `website/app/[slug]/page.js` | Website routes/components/config | 4 | website counted |
| `website/app/downloads/page.js` | Website routes/components/config | 2 | website counted |
| `website/app/layout.js` | Website routes/components/config | 0 | website counted |
| `website/app/not-found.js` | Website routes/components/config | 0 | website counted |
| `website/app/page.js` | Website routes/components/config | 4 | website counted |
| `website/app/privacy/page.js` | Website routes/components/config | 4 | website counted |
| `website/app/robots.js` | Website routes/components/config | 0 | website counted |
| `website/app/sitemap.js` | Website routes/components/config | 0 | website counted |
| `website/app/terms/page.js` | Website routes/components/config | 0 | website counted |
| `website/components/app-screen-stack.js` | Website routes/components/config | 1 | website counted |
| `website/components/p2p-sync-explainer.js` | Website routes/components/config | 4 | website counted |
| `website/components/latest-release-assets.js` | Website routes/components/config | 5 | website counted |
| `website/components/screenshot-carousel.js` | Website routes/components/config | 11 | website counted |
| `website/components/screenshot-viewer.js` | Website routes/components/config | 4 | website counted |
| `website/components/browser-logo-rail.js` | Website routes/components/config | 1 | website counted |
| `website/components/footer-signal-art.js` | Website routes/components/config | 63 | website counted |
| `website/components/hero-video.js` | Website routes/components/config | 4 | website counted |
| `website/components/marketing-ui.js` | Website routes/components/config | 6 | website counted |
| `website/components/reveal.js` | Website routes/components/config | 1 | website counted |
| `website/components/route-content.js` | Website routes/components/config | 0 | website counted |
| `website/components/scene-controller.js` | Website routes/components/config | 10 | website counted |
| `website/components/scenic-detail-page.js` | Website routes/components/config | 6 | website counted |
| `website/components/scenic-illustration.js` | Website routes/components/config | 3 | website counted |
| `website/components/scenic-tones.js` | Website routes/components/config | 1 | website counted |
| `website/components/site-data.js` | Website routes/components/config | 0 | website counted |
| `website/components/site-footer.js` | Website routes/components/config | 2 | website counted |
| `website/components/site-header.js` | Website routes/components/config | 3 | website counted |
| `website/components/site-shell-data.js` | Website routes/components/config | 0 | website counted |
| `website/components/theme-toggle.js` | Website routes/components/config | 10 | website counted |
| `website/next.config.mjs` | Website routes/components/config | 0 | website counted |
| `website/postcss.config.mjs` | Website routes/components/config | 0 | website counted |

### Advert And Workflow Inventory Revalidation - 2026-10-22

The same lexical parser now measures 111 tracked files and 9,167 matches. The seed change adds `isAdVoidContentPayload` plus two control-flow matches, moving its lexical count from 170 to 173; this is not three new semantic method proofs. Moving the declarative lane rules into `scripts/test-lane-file-rules.mjs` adds one tracked audit/workflow file with zero matches and leaves that family's 517 matches unchanged. Zero lexical matches do not establish absence of runtime effects or complete review. The hot runtime family now totals 3,820 matches.

This dated refresh changes only inventories. All callable completeness, affected-method review, runtime behavior, and installed-browser proof boundaries remain separate; complete per-callable semantic proofs remain zero.

### Streaming Response And Popup Inventory Revalidation - 2026-10-22

After the frozen streaming `get_watch` response helper and popup intrinsic-width fix, the unchanged lexical parser measures 111 tracked source files and 9,187 matches. Only `js/seed.js` changes its count, from 173 to 193, bringing the hot runtime family to 3,840. The 20 added matches include nested callbacks and control-flow syntax; they are not 20 newly proved semantic methods. The source UI helper and both generated bundles retain their callable counts. Current seed fetch/XHR locations were measured from the frozen source where listed. Earlier dated measurements remain historical.

This is bookkeeping only. The dedicated streaming tests cover record boundaries, early player delivery, settings guards and stream cleanup; they do not establish installed playback timing, complete per-callable proof, or a published release.


### Exact-Duration Fallback Inventory Revalidation - 2026-10-22

The final seed duration/seek correction moves the current lexical count from
193 to 195, with 111 tracked source files unchanged. Current tables therefore
show 9,189 total matches and 3,842 hot-runtime matches. The two added duration
helpers and shifted seed locations are inventory records, not complete semantic
method proofs. Earlier dated 9,187/193 measurements remain historical.

The correction binds known duration to the exact current video and bounds
confirmed-ad seek retries. Its dedicated behavior test is registered in JSON,
performance and smoke lanes. This does not establish independent media
acquisition, resolve live SABR backoff, prove installed playback timing, or
change the wider semantic/security completion boundaries. This refresh changes
only bookkeeping and test assertions about current inventories.

### Opt-In Content Player Inventory Revalidation - 2026-10-22

Six new playback modules are now tracked: source planning, isolated admission, VTT preparation, an explicitly started player, its isolated coordinator, and a bounded MAIN response bridge. The unchanged lexical parser measures 117 files and 9,299 matches (3,843 hot-runtime and 600 helper matches). New helper matches include callbacks and control-flow forms; they are not complete semantic method proofs. Current counters include the playback invalidation hooks and the profile-change classifier correction.

The six dedicated runtime suites cover planning, authority, response projection, caption preparation, controller lifecycle and coordinator boundaries. Source/VM evidence does not establish installed playable-source availability, browser caption/audio success, native parity, or a solution to live SABR backoff. Default playback remains native until an explicit experimental action; missing authority or unsupported features retain that path. Existing historical measurements and NO-GO limits remain unchanged. This inventory refresh changes no runtime behavior.


### Owned Resolver And Indexed Transport Lexical Revalidation - 2026-10-22

The unchanged parser now measures 119 tracked files and 9,406 lexical matches: 3,855 hot-runtime matches and 695 helper matches across 21 helper files. The two new source files are the locally replaceable resolver and bounded indexed-media transport; the refreshed counts also include managed heartbeat receipts, explicit audio selection and native timeline provenance checks. This is current lexical coverage, not complete per-callable semantic proof, installed playback acceptance or release approval. Earlier dated revalidation measurements remain historical.


### Cold-Mount Retry Lexical Revalidation - 2026-10-22

A bounded coordinator mount retry adds two lexical matches. Current accounting is 119 files, 9,408 total matches and 697 helper matches across 21 files; hot runtime remains 3,855. Earlier follow-on source counts above describe the pre-retry checkpoint. The retry and its source inventory do not establish installed acceptance or complete semantic proof.


### Native Source Handoff Lexical Revalidation - 2026-10-22

The unchanged parser now measures 120 tracked files and 9,471 lexical matches: 3,855 hot-runtime matches and 760 helper matches across 22 helper files. The new native source transaction joins the repository inventory. Legacy transport, separate player and caption modules remain tracked but are not in the active manifest stack. Counts establish lexical coverage only; installed native playback, profile enforcement and release acceptance require separate evidence. Earlier dated counts remain historical.


### Automatic Native Playback Lexical Revalidation - 2026-10-23

The unchanged parser measures 120 tracked files and 9,478 lexical matches: 3,857 hot-runtime matches and 765 helper matches across 22 helper files. The five-module active native stack is unchanged. The new default-on contentOnlyPlayback preference is profile-scoped; explicit false survives persistence and backup migration. Trusted admission and managed permit readiness can wake one automatic attempt; same-route settings and metadata refreshes do not restart a completed or failed extraction. These are source/fixture boundaries, not installed acceptance. Earlier measurements remain historical.

Healthy admitted same-video native media is now preserved before extraction and before source commit. Buffered content past its startup position, with exact native identity and explicit inactive-ad API evidence, is marked native_ready without fetching a fresh source or pausing/reloading the player. This guard adds two lexical matches; it does not grant profile admission or claim a fresh source was selected.

## Native fallback retirement revalidation - 2026-10-23

The unchanged lexical parser now measures 120 tracked files and 9,484 matches: 3,860 hot-runtime and 768 helper matches. Seed changes from 195 to 198 and the coordinator from 27 to 30. The desktop media fallback retirement and one fresh precommit observation are behavior changes documented separately; these counts remain lexical inventory rather than semantic completion proof.

## Auto-sync source inventory - 2026-10-24

The current lexical inventory above was remeasured after adding the opt-in Auto-sync modules. Older May snapshots remain historical. New module rows retain semantic proof incomplete; counts alone do not establish behavior, network delivery, or native parity.

## Conservative website lexical refresh - 2026-10-25

The existing broad lexical matcher was rerun after the authorized content and platform-grouping simplification. It accounts for 139 files and 9918 lexical callables. The comparison subset reports 199 broad matches and 119 build/website matches (80 difference); the parsers intentionally count different shapes. No complete semantic proof, source-classifier convergence, release approval, native acceptance or deployment claim follows. The original homepage hero and scenic identity are retained; authorized website additions include the P2P walkthrough and same-page screenshot viewer.
