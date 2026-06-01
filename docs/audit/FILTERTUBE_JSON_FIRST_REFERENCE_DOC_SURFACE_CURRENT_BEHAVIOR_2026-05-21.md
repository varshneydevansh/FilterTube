# FilterTube JSON-First Reference Doc Surface - Current Behavior - 2026-05-21

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch.

## Purpose

This slice audits the tracked JSON-first reference documentation that can steer
optimization and first-class JSON filter work:

```text
docs/JSON_FIRST_FILTERING_PLAN.md
docs/json_paths_encyclopedia.md
docs/watch_json_paths.md
docs/youtube_renderer_inventory.md
```

These files are valuable evidence maps, but they are not loaded by product
runtime or build code. They cannot by themselves prove that a JSON path is
currently consumed, that a renderer can be mutated safely, that DOM fallback can
be pruned, or that a public performance claim is measurable.

## File Fingerprints

Current tracked JSON-first reference-doc inventory: 4 files, 6,486 newline
counts, and 402,371 bytes.

| File | Newline count | Bytes | SHA-256 |
|---|---:|---:|---|
| `docs/JSON_FIRST_FILTERING_PLAN.md` | 580 | 16,595 | `726394dc1c8108163228b82103e34c8f726ec96002aa87919b5a69101d47c1bb` |
| `docs/json_paths_encyclopedia.md` | 5,003 | 314,988 | `4e2cca8b1cac62d685d7597febfb151752158e1f3561de31854b81786c58ca05` |
| `docs/watch_json_paths.md` | 123 | 7,996 | `b56270d7a17987228e7b0e306d51374ddc64f834b25ab02b29df3ac52fc86f45` |
| `docs/youtube_renderer_inventory.md` | 780 | 62,792 | `595b00612f4c8e9dd42259239ffdf942f09c654984d68decae5d8f2606a19dc7` |

## Cross-Doc Token Counts

| File | H1 | H2 | H3 | Inline-code spans | `JSON-first` tokens | `renderer` tokens | `FILTER_RULES` tokens | `showSheetCommand` tokens | Bracket-index snippets | Dot-index snippets |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `docs/JSON_FIRST_FILTERING_PLAN.md` | 1 | 15 | 23 | 167 | 3 | 64 | 3 | 0 | 0 | 0 |
| `docs/json_paths_encyclopedia.md` | 12 | 0 | 22 | 637 | 0 | 470 | 0 | 32 | 264 | 54 |
| `docs/watch_json_paths.md` | 1 | 5 | 4 | 89 | 0 | 13 | 0 | 2 | 14 | 0 |
| `docs/youtube_renderer_inventory.md` | 1 | 15 | 45 | 566 | 0 | 345 | 0 | 4 | 1 | 29 |

The `json_paths_encyclopedia` file is the heaviest reference by far. It mixes
documented JSON paths, renderer notes, raw excerpts, DOM snippets, path syntax
variants, and later review notes. That makes it useful for fixture discovery,
but risky as direct implementation input.

## Current Reference Roles

### `docs/JSON_FIRST_FILTERING_PLAN.md`

This is a planning and rollout document. It describes an intended pipeline,
candidate shape, files to change, renderer coverage plan, implemented baseline,
future steps, test matrix, debug instrumentation, risks, and acceptance
criteria.

Current pinned facts:

- It says DOM filtering should remain a safety net rather than the primary path
  for normal title, description, channel, mix, playlist, Shorts, or comment
  keyword decisions.
- It names `js/filter_logic.js`, `js/seed.js`, `js/injector.js`,
  `js/content/dom_fallback.js`, `js/content/bridge_settings.js`, and
  `js/background.js` as change surfaces.
- It says `FILTER_RULES` should be kept as a path table feeding
  `buildCandidate()`.
- It includes P0 renderers such as `lockupViewModel` and
  `compactPlaylistRenderer`.
- It records an implemented active blocklist JSON-first pass, a watch-page cost
  reduction pass, and Android parity steps.
- It contains authority-style wording at line 205 that the separate claim
  register already classifies as misleading if read as runtime proof.

Risk: a future patch can read this plan as approval to rewrite the JSON engine
before proving the exact runtime path, renderer, field effect, route, list mode,
identity confidence, and DOM/native parity contract.

### `docs/json_paths_encyclopedia.md`

This is a broad evidence map. It contains 5,003 newline counts, 637 inline-code
spans, 470 renderer tokens, 264 bracket-index snippets, and 54 dot-index
snippets.

Current pinned facts:

- It documents high-risk path families for collaborator sheets, compact
  playlists, lockup view models, posts/community cards, shared posts, comment
  renderers, and modern UI view models.
- It uses many bracket-index examples such as `[0]`, while current runtime
  `getByPath()` expects dot-index syntax.
- It includes raw DOM/HTML excerpts and review notes near the end of the file.
- It is not loaded by runtime or build source today.

Risk: copying documented bracket-index paths into runtime dot-path rules can
silently fail, while treating every documented path as a filterable field can
false-hide wrapper/UI/metadata-only renderers.

### `docs/watch_json_paths.md`

This is a focused watch-page JSON path reference for `/youtubei/v1/next` and
`/youtubei/v1/player`.

Current pinned facts:

- It documents `videoSecondaryInfoRenderer`, `compactVideoRenderer`,
  `playlistPanelVideoRenderer`, `reelItemRenderer`, and `shortsLockupViewModel`.
- It records `showDialogCommand` and `showSheetCommand` collaborator roster
  variants.
- It warns that collaborator IDs can be missing in mix/watch views.
- It says not to mint a hard channel id from plain text collaborators.

Risk: watch-page optimization can otherwise collapse safe display hints,
collaborator roster evidence, playlist owner evidence, and hard block identity
into one path, causing leaks or false hides.

### `docs/youtube_renderer_inventory.md`

This is a mixed JSON/DOM renderer inventory with historical status wording.

Current pinned facts:

- It contains 780 newline counts, 45 H3 headings, 566 inline-code spans, 345
  renderer tokens, and 4 `compactAutoplayRenderer` tokens.
- It includes historical status words such as covered, implemented, partial,
  missing, verify, layout, and DOM-only.
- It maps JSON renderer keys, DOM components, endpoint snapshots, watch
  collaborator recovery, subscribed-channel import, Kids/YTM surfaces, and
  layout targets.
- It contains one `first-class` token, but runtime proof still lives in tests
  and audit gates, not in the inventory status wording.

Risk: "covered" or "implemented" wording in this document can be mistaken for
direct `FILTER_RULES` support, full whitelist behavior, or safe selector
coverage.

## First-Class JSON Filter Boundary

The current audit already has JSON-first readiness, no-work optimization, and
implementation-locus gates. This reference-doc slice adds the documentation
boundary:

- A documented JSON path is fixture source material until a runtime path
  manifest records syntax, renderer, field, endpoint, route, list mode, effect,
  identity confidence, and provenance.
- A renderer inventory status is a claim until current source and fixtures prove
  direct rule behavior, nested traversal behavior, DOM fallback parity, or an
  explicit unsupported/metadata-only status.
- A planning step is not an implementation gate.
- An optimization note is not a no-work budget or metric artifact.

Missing gate: no `jsonReferenceDocSurfaceAuthority`,
`jsonReferenceDocRuntimeParityReport`, `jsonReferenceDocFixtureProvenance`,
`jsonReferenceDocSyntaxClassifier`, `jsonReferenceDocClaimGate`,
`jsonReferenceDocOptimizationGate`, or
`jsonReferenceDocDeletionReadinessReport` exists in product source yet.

## Non-Completion Boundary

This register does not close tracked-doc obligations for the four reference
docs. Before adding JSON paths, pruning DOM fallback, narrowing network work,
changing watch/collaborator/Mix behavior, or claiming JSON-first optimization,
future work still needs:

- reduced fixtures for each path family being promoted;
- dot-path generation or syntax conversion proof for documented bracket paths;
- blocklist, whitelist, empty-list, disabled, and sibling-visible fixtures;
- route/surface/profile/list-mode proof;
- identity-confidence and allowed-effect records;
- no-work budgets for seed, XHR, DOM fallback, quick-block/menu lifecycle, and
  metadata fetch paths;
- metric artifacts before public performance claims are tightened.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this JSON-first reference surface can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
