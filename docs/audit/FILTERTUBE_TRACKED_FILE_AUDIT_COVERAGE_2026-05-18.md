# FilterTube Tracked File Audit Coverage - 2026-05-18

This artifact pins the current `git ls-files` source universe for the
FilterTube repository. It is not a behavior fix and it is not a claim that every
file is fully stabilized. It records which audit family owns each tracked file
so the complete-codebase audit cannot accidentally focus only on hot runtime
files.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5875
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5875
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Source Boundary

Authoritative source command:

```bash
git ls-files
```

Current tracked source count:

```text
149
```

Ignored root captures, generated package output, dependency caches, local
Vercel metadata, and filesystem junk are outside this tracked-file universe.
They can be evidence for fixtures, but they are not product source authority.

## Worktree Draft Artifact Boundary

During this stabilization audit the worktree can contain untracked
`docs/audit/FILTERTUBE_*.md` files and untracked `tests/runtime/*.test.mjs` files.
Those files are draft proof artifacts until they are intentionally staged and
classified. They can be used to run the current local audit harness, but they
do not change the meaning of the tracked-file source universe above.

The distinction is deliberate:

```text
git ls-files
  -> committed/tracked product source and tracked docs
  -> must be assigned exactly one audit family here

git status --porcelain --untracked-files=all
  -> local draft proof artifacts and reduced fixtures while the audit is in progress
  -> not release/product source authority until staged, reviewed, and reclassified
```

If a draft audit artifact is committed later, this document and its classifier
must be updated in the same change so "tracked file coverage" continues to mean
the current tracked repository, not a stale 149-file snapshot.

## Current Classification

| Audit family | Count | Current ownership |
| --- | ---: | --- |
| `browser-manifests` | 4 | Browser loader, permissions, content-script ordering, and web-accessible resources. |
| `build-release-sync-scripts` | 5 | Extension packaging, GitHub release flow, Nanah vendor build, native runtime sync, and video compression helpers. |
| `content-runtime-js` | 16 | YouTube page runtime, JSON interception, DOM fallback, quick block, menu insertion, identity extraction, and page-world bridges. |
| `data-design-inputs` | 2 | Release notes and design-token source inputs. |
| `extension-assets` | 3 | Extension dashboard/download visuals and packaged media burden. |
| `extension-html` | 3 | Popup, dashboard, and troubleshoot extension-page loaders. |
| `extension-icons` | 7 | Browser/store identity and web-accessible icon resources. |
| `extension-ui-background-js` | 11 | Background settings authority, popup/dashboard state, rendering, import/export, PIN, Nanah, and UI components. |
| `extension-ui-css` | 5 | Active extension-page CSS only. |
| `generated-ui-output` | 2 | Generated popup/dashboard shell output requiring freshness proof. |
| `generated-ui-source` | 3 | Source files that generate extension shell output. |
| `quarantined-content-css` | 3 | Legacy YouTube content CSS with default-hide/reveal assumptions; packaged but not manifest-loaded. |
| `quarantined-legacy-js` | 1 | `js/layout.js`; legacy layout repair code not loaded by active manifests. |
| `root-project-metadata` | 7 | Repo policy, package metadata, README/changelog/license, and historical channel-identity plan. |
| `tracked-docs` | 33 | Product, architecture, renderer, sync, distribution, and planning documents. These are claims/evidence maps, not runtime proof by themselves. |
| `vendor-bundles` | 2 | Bundled Nanah and QR code vendor/runtime assets. |
| `website-app-routes` | 11 | Next.js app routes, metadata, policy/download pages, global CSS, icon, robots, and sitemap. |
| `website-assets` | 11 | Website images, prompts, source videos, and optimized public videos. |
| `website-components` | 13 | Marketing, route-data, scenic platform pages, navigation/footer, theme, and reveal components. |
| `website-config` | 7 | Website package/build/config/ignore files. |

## Coverage Meaning

```text
tracked file
  |
  +--> classified audit family
          |
          +--> source/evidence boundary proof
          +--> current behavior fixture, if runtime-affecting
          +--> release/public claim fixture, if user-visible
          +--> quarantine proof, if packaged but inactive
```

Classification is a coverage boundary, not completion. For example:

- `docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`
  are tracked docs and discovery maps; they do not prove runtime coverage.
- `js/layout.js` is tracked and packaged, but quarantined because active
  manifests do not load it.
- `css/filter.css`, `css/content.css`, and `css/layout.css` are tracked and
  packaged, but quarantined because active manifests do not load YouTube
  content-page CSS.
- Website pages and assets are tracked source, but their claims must be
  checked against real release artifacts and store availability.

## Current Gaps

| Gap | Why it matters | Required proof before completion |
| --- | --- | --- |
| Tracked docs are not all runtime proof. | Docs can overclaim coverage if inventory rows or plans are treated as implemented behavior. | Every renderer/selector/settings claim must map to either a current-behavior fixture or an explicit unsupported/quarantined classification. |
| Website release checks are not executable in CI yet. | Store/download/privacy claims can drift from actual artifacts. | Browser/build checks for download links, artifact names, policy copy, and release-state gating. |
| Release package parity is not complete. | Build output can include stale or quarantined assets. | Compare ZIP/package contents to manifests and tracked source families. |
| Vendor/native sync freshness is not fully enforced. | Nanah bundles and native app runtime copies can drift. | Source hash or generated manifest for vendor and native runtime artifacts. |

## Guardrail

Future audit work should fail loudly when a new tracked file appears without an
audit-family classification. Raw root captures should stay ignored and should
only enter the proof suite as minimal extracted fixtures with source-family
metadata; minimal extracted fixtures with source-family metadata are the only
  acceptable committed form of raw capture proof.
