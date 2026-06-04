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
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5830
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5830
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
tracked JS/JSX/MJS files: 69
repo-wide lexical callables: 5830
```

| Family | Files | Lexical callables | Boundary |
| --- | ---: | ---: | --- |
| Hot page/background runtime | 9 | 3166 | Already has detailed first-pass hot runtime table in `FILTERTUBE_FUNCTION_COVERAGE_2026-05-17.md`. |
| Content helper runtime | 9 | 348 | First-pass helper surface audit exists, but behavior fixtures remain incomplete. |
| UI/settings runtime | 10 | 1631 | First-pass UI/settings audit exists, but action-level fixtures remain incomplete. |
| Generated/quarantined UI | 6 | 147 | Generated source/output and `js/layout.js`; freshness and quarantine checks required. |
| Vendor bundles | 2 | 279 | API/provenance boundary, not product-owned method behavior. |
| Build/sync scripts | 4 | 58 | Release/package/native-sync behavior; separate release fixtures required. |
| Audit/test lane scripts | 3 | 78 | Change-safety classifier, drift guard, and lane runner proof; workflow behavior, not product runtime. |
| Website routes/components/config | 26 | 123 | Public website callable surface; public-claim and asset-budget fixtures required. |

## File-Level Index

| File | Family | Lexical callables | Audit status |
| --- | --- | ---: | --- |
| `build.js` | Build/sync scripts | 51 | release-audited first pass |
| `js/background.js` | Hot page/background runtime | 463 | hot runtime mapped |
| `js/content/block_channel.js` | Hot page/background runtime | 226 | hot runtime mapped |
| `js/content/bridge_injection.js` | Content helper runtime | 12 | helper counted |
| `js/content/bridge_settings.js` | Hot page/background runtime | 102 | hot runtime mapped |
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
| `js/io_manager.js` | UI/settings runtime | 119 | UI/settings counted |
| `js/layout.js` | Generated/quarantined UI | 52 | quarantined/generated boundary |
| `js/nanah_sync_adapter.js` | UI/settings runtime | 57 | UI/settings counted |
| `js/popup.js` | UI/settings runtime | 131 | UI/settings counted |
| `js/render_engine.js` | UI/settings runtime | 126 | UI/settings counted |
| `js/security_manager.js` | UI/settings runtime | 18 | UI/settings counted |
| `js/seed.js` | Hot page/background runtime | 92 | hot runtime mapped |
| `js/settings_shared.js` | UI/settings runtime | 43 | UI/settings counted |
| `js/shared/identity.js` | Content helper runtime | 92 | helper counted |
| `js/state_manager.js` | UI/settings runtime | 155 | UI/settings counted |
| `js/tab-view.js` | UI/settings runtime | 915 | UI/settings counted |
| `js/ui-shell/popup-shell.js` | Generated/quarantined UI | 42 | generated output boundary |
| `js/ui-shell/tab-view-decor.js` | Generated/quarantined UI | 41 | generated output boundary |
| `js/ui_components.js` | UI/settings runtime | 64 | UI/settings counted |
| `js/vendor/nanah.bundle.js` | Vendor bundles | 107 | vendor API/provenance boundary |
| `js/vendor/qrcode.bundle.js` | Vendor bundles | 172 | vendor API/provenance boundary |
| `scripts/audit-proof-drift.mjs` | Audit/test lane scripts | 19 | audit lane counted |
| `scripts/build-extension-ui.mjs` | Build/sync scripts | 2 | build/website counted |
| `scripts/build-nanah-vendor.mjs` | Build/sync scripts | 4 | build/website counted |
| `scripts/run-test-lane.mjs` | Audit/test lane scripts | 59 | audit lane counted |
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
   The broad parser finds 915 callable forms. Any dashboard change can cross
   profiles, filters, Kids, Nanah, import/export, release notes, settings, and
   app-card flows.

3. **The hot runtime is not the whole product.**
   Hot runtime has 3,166 lexical callables, but UI/settings, content helpers,
   generated shell, vendor, build scripts, and website add another 2,664
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
- documented family totals sum to 5,830,
- no ignored raw captures or generated package output are part of this index.
