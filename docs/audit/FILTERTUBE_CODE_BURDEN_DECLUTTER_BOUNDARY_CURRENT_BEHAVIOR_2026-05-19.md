# FilterTube Code-Burden Declutter Boundary - 2026-05-19

Status: current-behavior audit only. This is not an implementation patch and
does not delete, move, package, load, or consolidate any file.

This slice answers a narrow but important question: which code-burden surfaces
are cleanup candidates, and which similar-looking surfaces are still behavior
carriers that must not be removed without stronger fixtures?

## Declutter Rule

No file, generated output, vendor bundle, mirrored app asset, CSS file, runtime
observer, selector family, or duplicate mutation path is safe to remove just
because it looks unused or redundant.

Before cleanup, the candidate needs all of these:

```text
source family
runtime owner or package-only owner
manifest/package reference status
public/release claim impact
native app sync impact
raw-capture evidence boundary
positive behavior fixture if it is kept
negative behavior fixture if it is removed or gated
```

## Current Declutter Boundary

| Surface | Current proof | Cleanup direction | Blocked action |
| --- | --- | --- | --- |
| Quarantined YouTube CSS: `css/filter.css`, `css/content.css`, `css/layout.css` | Browser manifests do not content-script-load CSS, but `build.js` packages the whole `css` directory. The files contain broad default-hide and layout-forcing YouTube selectors. | Later either exclude them from ZIPs with package parity proof, or keep them explicitly recorded as packaged-but-unloaded. | Do not load, inject, or broaden these CSS files on YouTube surfaces without selector, route, and no-rule fixtures. |
| `html/troubleshoot.html` | The file is packaged through the whole `html` directory and is zero bytes today. | Later implement a real support page or remove the packaged surface after link/store proof. | Do not claim a working support/troubleshoot page until it has content and navigation proof. |
| Generated UI shell source/output | `scripts/build-extension-ui.mjs` generates `js/ui-shell/*` from `src/extension-shell/*`; both source and outputs are tracked. | Add a freshness manifest or generated-output check. | Do not hand-edit generated output or delete source/output without proving popup/dashboard behavior. |
| Vendor bundles | `js/vendor/nanah.bundle.js` and `js/vendor/qrcode.bundle.js` expose globals consumed by the dashboard/sync UI. | Add provenance/version/hash manifests. | Do not line-edit or inline vendor bundles without API-surface and source-version proof. |
| Whole-directory browser package roots | `build.js` copies `js`, `css`, `html`, `icons`, `data`, and `assets`, not only manifest-referenced files. | Add a package manifest with source family, manifest reference, hash, size, and quarantine status. | Do not assume an apparently unused packaged file is absent from the public ZIP. |
| Ignored raw capture corpus | `.gitignore` keeps root HTML/JSON/TXT captures out of product source and release artifacts. | Keep raw captures as evidence only; extract reduced committed fixtures when needed. | Do not copy raw captures into extension ZIPs, website downloads, native app assets, or generated runtime bundles. |
| Native app runtime copies and mirrors | Public sync wrapper delegates to the app repo; manifest-listed copies are current proof, broad mirrors can drift, generated app assets are not source authority. | Add native runtime sync authority before app release/runtime cleanup. | Do not hand-edit generated Android/iOS runtime assets or treat app mirrors as source truth. |
| Duplicate action/mutation surfaces | Primary menu, fallback menu, quick block, StateManager, background actions, import, Nanah, backup, stats, and learned identity paths still carry distinct behavior and side effects. | Consolidate only after mutation, lifecycle, selector, hide/restore, and side-effect authorities exist. | Do not delete duplicate-looking paths until every affected route/mode has positive and negative fixtures. |

## High-Confidence Declutter Findings

1. **There are real cleanup candidates, but they are release/package work first.**
   The safest near-term candidates are packaged-but-unloaded legacy YouTube CSS
   and the zero-byte troubleshoot page. Even these need package and claim proof
   before removal.

2. **Most runtime duplication is not dead code yet.**
   Fallback menu, quick-block, DOM fallback, background mutation, StateManager,
   import/export, Nanah, learned identity, and stats paths look repetitive
   because they are split authorities. They cannot be deleted safely until the
   new shared authority proves equivalent behavior.

3. **Generated output needs freshness proof, not manual cleanup.**
   `src/extension-shell/*` and `js/ui-shell/*` are both present by design today.
   The burden is drift risk. The fix is a generated manifest/check, not deleting
   one side.

4. **Vendor bundles need provenance proof, not product-line audits.**
   The useful boundary is the global API and source/version hash. Treating every
   vendor line as product-owned logic would increase noise and obscure real
   FilterTube behavior.

5. **Package contents and public claims are a separate authority.**
   A file can be unused by the manifest and still be shipped in ZIPs. Cleanup
   must pass the release package boundary before it becomes a public claim.

## Blocked Until Future Proof

```text
declutter_delete_quarantined_css_without_package_manifest: blocked
declutter_remove_troubleshoot_page_without_link_claim_audit: blocked
declutter_delete_generated_shell_output_without_freshness_gate: blocked
declutter_inline_vendor_bundle_without_provenance_manifest: blocked
declutter_remove_fallback_menu_without_action_authority: blocked
declutter_remove_quick_block_without_lifecycle_authority: blocked
declutter_remove_dom_fallback_without_json_renderer_parity: blocked
declutter_merge_state_manager_background_mutations_without_revision: blocked
declutter_remove_native_runtime_copy_without_sync_authority: blocked
declutter_publish_release_claim_without_package_manifest: blocked
```

## Safe Next Work

- Add a release package manifest dry-run before changing ZIP contents.
- Add generated-shell freshness checks for `src/extension-shell/*` to
  `js/ui-shell/*`.
- Add vendor provenance records for Nanah and QR code bundles.
- Extract minimal raw-capture fixtures for high-risk renderer/selector families.
- Add authority-backed replacement fixtures before deleting any runtime path.

## First Optimization Source-Locus Structural Burden Addendum

Status: audit-only structural queue. Runtime behavior is unchanged. This is not
an implementation patch, optimization patch, JSON-first behavior patch,
whitelist patch, settings patch, metric collector patch, package patch, native
sync patch, or release claim.

This addendum applies the strict code-quality lens to the first optimization
source-locus boundary. It records where cleanup pressure is real without
turning any cleanup, consolidation, or JSON-first work into implementation
permission.

Source inputs:

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | 12 source-locus callable rows, 38 line anchors, 14 runtime source files, 0 source-owner approvals, and 0 implementation-ready rows. |
| `docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md` | JSON-first source loci across seed transport, filter engine rules, category metadata, DOM fallback, menu lifecycle, and quick-block lifecycle. |
| `docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md` | 12 ranked optimization candidates, with 6 P0 prerequisites and 0 implementation-ready candidates. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_CANDIDATE_SELECTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | `FT-BIND-00-metric-artifact-foundation` selected only as an audit work packet; runtime behavior patches remain NO-GO. |

Current counts:

```text
structural burden queue rows: 12
large runtime source files over 1000 lines covered: 5
source-locus callable rows covered: 12
optimization priority candidates covered: 12
implementation-ready structural cleanup rows: 0
runtime source-owner approvals: 0
runtime metric collector approvals: 0
JSON-first structural optimization approvals: 0
runtime behavior changed: no
not completion proof for code-burden cleanup or JSON-first implementation
```

Current high-pressure runtime files:

| File | Current structural pressure |
| --- | --- |
| `js/content_bridge.js` | Giant coordination surface for settings, DOM fallback, menu repair, metadata fetch, pending whitelist state, diagnostics, and user actions. |
| `js/content/dom_fallback.js` | Large selector and lifecycle surface with broad fallback predicates, hide/restore mutations, route special cases, and category metadata work. |
| `js/filter_logic.js` | Large JSON traversal and mutation surface with hand-authored renderer rules, runtime path syntax, harvest side effects, and filter recursion. |
| `js/content/block_channel.js` | Quick-block affordance, observer, timer, listener, and menu-action logic live beside active-card mutation behavior. |
| `js/seed.js` | Transport interception, settings projection, active-work predicates, harvest-only behavior, fetch/XHR response rewriting, and diagnostics are tightly coupled. |

Structural burden queue:

| Structural row id | Source-locus row | Current burden | Cleaner future direction | Blocked authority |
| --- | --- | --- | --- | --- |
| `FT-BURDEN-00-settings-work-snapshot` | `FT-SOURCE-LOCUS-CALLABLE-00-settings-scope` | Settings state is projected separately through shared settings, dashboard state, and seed runtime checks. | One explicit work-decision snapshot that states enabled/list-mode/profile/route/work classes before transport, DOM, and actions run. | Source-owner approval, settings-mode fixtures, and measured work-decision artifact. |
| `FT-BURDEN-01-audit-fixture-envelope` | `FT-SOURCE-LOCUS-CALLABLE-01-fixture-audit-envelope` | Audit fixtures and reserved artifact paths prove boundaries, not runtime owner authority. | A committed metric artifact envelope with source owner, fixture provenance, schema, and rollback metadata. | Metric artifact foundation packet and source-owner map. |
| `FT-BURDEN-02-transport-policy` | `FT-SOURCE-LOCUS-CALLABLE-02-transport-json` | Fetch and XHR own similar endpoint parsing, wrapping, and response-rewrite work in separate flows. | A shared endpoint/work policy that tells both transports when to parse, harvest, mutate, pass through, or collect metrics. | Transport metric counters, active-rule proof, and response parity fixtures. |
| `FT-BURDEN-03-filter-engine-contract` | `FT-SOURCE-LOCUS-CALLABLE-03-filter-engine` | Renderer paths, harvest, allow/block decisions, and mutation side effects share the same large traversal surface. | Split contracts for path provenance, harvest-only learning, visible mutation, and side-effect reporting without changing behavior first. | Renderer rule manifest, path syntax manifest, harvest/mutation budget, and false-hide/leak fixtures. |
| `FT-BURDEN-04-dom-fallback-owner` | `FT-SOURCE-LOCUS-CALLABLE-04-dom-fallback` | DOM fallback predicates, selector scans, observers, route special cases, and pending work are spread across bridge and fallback code. | A route/surface selector owner table with explicit active DOM work and no-work states. | DOM lifecycle budget, selector owner proof, and DOM parity fixtures. |
| `FT-BURDEN-05-action-affordance-owner` | `FT-SOURCE-LOCUS-CALLABLE-05-menu-quickblock` | Menu repair and quick-block setup install listeners/observers/timers before one owner proves action necessity. | One action-affordance owner that separates explicit user-action availability from passive filtering work. | Menu/quick-block lifecycle budgets and action-click positive fixtures. |
| `FT-BURDEN-06-network-metadata-owner` | `FT-SOURCE-LOCUS-CALLABLE-06-network-resolver` | Handle resolution, metadata fetch, background enrichment, and wait timers are split across content and background surfaces. | A network metadata owner with reason, cache-hit/miss, retry, dedupe, and privacy boundaries. | Network/storage counters, resolver fixtures, and diagnostic privacy class. |
| `FT-BURDEN-07-storage-mutation-owner` | `FT-SOURCE-LOCUS-CALLABLE-07-storage-map-mutation` | Channel-map caches, flush timers, storage listeners, imports, backups, and learned identity mutate shared state from separate authorities. | A mutation-owner map that names write source, side effect, restore behavior, and rollback impact. | Storage side-effect budget, revision proof, import/export fixtures, and source-owner approval. |
| `FT-BURDEN-08-hide-restore-owner` | `FT-SOURCE-LOCUS-CALLABLE-08-hide-restore-visual` | Optimistic hide, fallback hide, stale cleanup, and restore flows are visible mutations without one reporting contract. | One hide/restore report that records reason, source, sibling safety, stale cleanup, and allowed restore. | Hide/restore counters, visual parity fixtures, and false-hide/leak evidence. |
| `FT-BURDEN-09-whitelist-policy-owner` | `FT-SOURCE-LOCUS-CALLABLE-09-whitelist-policy` | Whitelist behavior is split between list-mode policy, pending identity refresh, guide handling, and hide timers. | First-class whitelist policy that models unresolved identity, empty lists, allow/block conflicts, and pending-hide states. | Whitelist readiness gap closure, list-mode decision report, and pending identity fixtures. |
| `FT-BURDEN-10-diagnostic-measurement-owner` | `FT-SOURCE-LOCUS-CALLABLE-10-diagnostic-privacy` | Console diagnostics and metric proof are separate, so measurement can be noisy and privacy class is not assigned. | A diagnostic policy that distinguishes debug logs from measurement artifacts with redaction and console budgets. | Diagnostic privacy contract and metric artifact schema. |
| `FT-BURDEN-11-parity-package-owner` | `FT-SOURCE-LOCUS-CALLABLE-11-parity-release-verification` | Extension packages, generated UI, vendor bundles, native sync, and release ZIPs are separate proof layers. | Package/native parity reports generated after runtime proof, with hashes, source family, and public-claim gates. | Package manifest, native sync proof, release checksum manifest, and public claim boundary. |

Current decision:

```text
structural optimization queue: GO as audit-only map
runtime structural cleanup: NO-GO
JSON-first structural optimization patch: NO-GO
whitelist cleanup or optimization patch: NO-GO
source-owner map commit: NO-GO
runtime metric collector insertion: NO-GO
continue proof-backed audit: GO
```

## Large-File Growth Guard Addendum - 2026-06-01

Status: audit-only guard. Runtime behavior is unchanged. This is not a
decomposition patch, runtime cleanup patch, JSON-first patch, whitelist patch,
performance optimization, generated-output patch, vendor patch, or release
package patch.

This addendum turns the strict code-quality rule into an executable boundary:
new product-owned source files must not silently cross 1000 lines, and existing
large files must not keep growing without owner, fixture, and decomposition
proof.

Current guard counts:

```text
large product-owned JS/JSX/MJS files at or above 1000 lines guarded: 16
near-threshold product-owned JS/JSX/MJS files from 900 to 999 lines guarded: 2
large vendor bundle files recorded separately: 1
new product-owned file crossing 1000 lines without proof: NO-GO
existing large-file growth without owner or decomposition proof: NO-GO
runtime behavior changed: no
```

Large product-owned source files:

| File | Current lines | Boundary |
| --- | ---: | --- |
| `js/content_bridge.js` | 13636 | Giant cross-context hub. Any growth needs source-owner proof and focused runtime fixtures. |
| `js/tab-view.js` | 13631 | Dashboard/settings UI surface. Current residual growth is owned by the managed Nanah live signed-send, rule-bundle send expansion UI, explicit granular rule-source UI, managed mailbox intake, managed parent status surface, managed action-history clear-evidence, provider-gated open-sync UI wiring, persisted managed-admin failed-unlock rate-limit slices, trusted-link revocation cleanup, and outbound live-send history metadata plumbing after extracting policy construction to `js/nanah_managed_live_policy.js` and open-sync status/pull logic to `js/nanah_managed_open_sync.js`; any further growth needs UI/state owner proof and release smoke. |
| `js/background.js` | 6711 | Background storage/message/profile authority. Any growth needs mutation and settings proof. |
| `js/content/dom_fallback.js` | 5030 | DOM fallback selector/hide/restore authority. Any growth needs DOM/no-work proof. |
| `js/filter_logic.js` | 3652 | JSON renderer rule and decision engine. Any growth needs rule/path proof. |
| `js/injector.js` | 3593 | Main-world JSON interception and page bridge. Any growth needs JSON/no-work proof. |
| `js/content/block_channel.js` | 3189 | Quick-block/native menu/Kids action surface. Any growth needs menu/action lifecycle proof. |
| `js/state_manager.js` | 2491 | Settings persistence and profile mutation surface. Any growth needs storage proof. |
| `js/io_manager.js` | 2097 | Import/export and backup surface. Any growth needs payload and migration proof. |
| `js/popup.js` | 1841 | Popup settings/action UI. Any growth needs settings UI proof and popup smoke. |
| `js/nanah_sync_adapter.js` | 1393 | Nanah portable payload, managed-policy apply surface, WebCrypto verifier helper, managed public-key descriptor advertisement, source signing-key helpers, and local decrypted managed mailbox item intake. Current growth is owned by the managed mailbox intake slice; follow-up should extract managed-policy helpers behind the same validation tests before broadening transport. |
| `js/render_engine.js` | 1389 | Dashboard renderer helper. Any growth needs release UI proof. |
| `js/settings_shared.js` | 1181 | Canonical settings compiler and migration surface. Any growth needs mode/list proof. |
| `js/content/dom_extractors.js` | 1137 | DOM identity extraction surface. Any growth needs identity false-hide/leak proof. |
| `js/seed.js` | 1136 | Transport interception and JSON active-work gate. Any growth needs JSON/no-work proof. |
| `js/content/bridge_settings.js` | 1113 | Content-script settings relay and managed time-limit runtime. Any growth needs settings, route, and no-work proof. |

Near-threshold product-owned source files:

| File | Current lines | Boundary |
| --- | ---: | --- |
| `js/ui_components.js` | 998 | One small edit can cross 1000 lines; split or add proof before growth. |
| `website/components/route-content.js` | 903 | Website route copy/components are close enough to require review before broadening. |

Large vendor bundle files recorded separately:

| File | Current lines | Boundary |
| --- | ---: | --- |
| `js/vendor/qrcode.bundle.js` | 2085 | Vendor provenance surface, not product-owned logic. Do not line-edit; update provenance/package proof instead. |

This guard does not require immediate decomposition. It blocks invisible growth:
if a new product-owned `js`, `jsx`, or `mjs` file reaches 1000 lines, or a
near-threshold file crosses the threshold, the code-burden proof and matching
test must be updated in the same logical change and the reviewer should ask
whether a smaller module boundary is available first.

No product runtime source currently defines:

```text
firstOptimizationStructuralBurdenQueue
sourceLocusStructuralCleanupApproval
jsonFirstStructuralOptimizationAuthority
whitelistStructuralOptimizationAuthority
runtimeStructuralOwnerMapApproval
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
