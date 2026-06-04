# FilterTube P0 Renderer Authority Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

This slice converts the highest-risk renderer authority gaps into executable
proof. It focuses on JSON-first reliability before broadening
`js/filter_logic.js`, because a missing renderer rule can leak blocked content,
make whitelist mode hide trusted content, or force the page runtime back into
expensive DOM fallback selectors.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## P0 Fixture Families Covered

```text
P0 renderer authority:
  renderer_authority_compact_playlist_blocklist_and_whitelist_gap
  renderer_authority_show_sheet_collaborator_blocklist_and_whitelist_gap
  renderer_authority_direct_watch_card_parts_gap
  renderer_authority_shorts_owner_identity_gap
  renderer_authority_mix_avatar_stack_false_hide_gap
  renderer_authority_shelf_title_container_false_hide_gap
  renderer_authority_inventory_claims_need_fixture_status
```

These names are future expectations. Current tests intentionally pin the source
state that must be preserved or corrected later with fixtures.

## Current Findings

| P0 fixture | Current behavior | Current proof | Future expectation |
| --- | --- | --- | --- |
| `renderer_authority_compact_playlist_blocklist_and_whitelist_gap` | A captured `compactPlaylistRenderer` passes through blocklist keyword/channel rules. In whitelist mode it also remains visible whether it matches or misses allow rules because there is no direct renderer authority. | `tests/runtime/p0-renderer-authority-current-behavior.test.mjs`; `tests/runtime/fixtures/captures/ytm-compact-playlist-renderer.json` | Playlist renderers need blocklist, whitelist, creator identity, and negative sibling-visible fixtures before a JSON rule is added. |
| `renderer_authority_show_sheet_collaborator_blocklist_and_whitelist_gap` | A captured `videoWithContextRenderer` with `showSheetCommand` collaborator roster passes through a blocked collaborator in blocklist mode, but is removed in whitelist mode even when the collaborator is whitelisted because the allow identity is not extracted. | `tests/runtime/p0-renderer-authority-current-behavior.test.mjs`; `tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json` | `showSheetCommand` collaborator extraction needs both block and allow fixtures plus identity-confidence proof. |
| `renderer_authority_direct_watch_card_parts_gap` | Direct `watchCardRichHeaderRenderer` stays visible under matching keyword/channel blocklist rules and also stays visible in whitelist mode. The covered path today is the `universalWatchCardRenderer` wrapper, not all direct parts. | `tests/runtime/p0-renderer-authority-current-behavior.test.mjs` | Direct watch-card header, hero, RHS panel, and section sequence renderers need direct JSON fixtures before watch-card claims are upgraded. |
| `renderer_authority_shorts_owner_identity_gap` | `shortsLockupViewModel` blocks title keyword matches, but misses `belowThumbnailMetadata` owner identity for channel block rules. In whitelist mode, a matching allowed owner can still be removed because owner identity is unresolved. | `tests/runtime/p0-renderer-authority-current-behavior.test.mjs` | Shorts owner identity needs direct UC/handle path extraction with blocklist, whitelist, and no-map fixtures. |
| `renderer_authority_mix_avatar_stack_false_hide_gap` | A generated `radioRenderer` Mix can be removed because generic avatar-stack extraction treats Mix avatars like collaborator identities. | `tests/runtime/p0-renderer-authority-current-behavior.test.mjs` | Mix/Radio avatar stacks need explicit non-collaborator identity policy and false-hide fixtures. |
| `renderer_authority_shelf_title_container_false_hide_gap` | A keyword match on a `shelfRenderer` title removes the whole shelf, including nonmatching child videos. | `tests/runtime/p0-renderer-authority-current-behavior.test.mjs` | Shelf/rich shelf decisions need container policy and negative sibling-visible fixtures. |
| `renderer_authority_inventory_claims_need_fixture_status` | Inventory docs contain optimistic coverage labels for paths whose direct runtime rule is absent or narrower than claimed. | `tests/runtime/p0-renderer-authority-current-behavior.test.mjs`; `docs/audit/FILTERTUBE_JSON_DOM_INVENTORY_TRUTH_AUDIT_2026-05-18.md` | Every inventory row should be classified as direct JSON, nested JSON, DOM-only, metadata-only, unsupported gap, or quarantined, with fixtures. |

## Why This Matters

```text
YouTube renderer
  -> direct FILTER_RULES entry exists?
      -> yes: block/allow/content decision can happen JSON-first
      -> no: renderer is kept and children are recursively scanned
          -> blocklist can leak whole cards
          -> whitelist can fail closed or pass unknown containers
          -> DOM fallback has to recover late with broad selectors
```

JSON-first work is the right direction, but it must be fixture-led. Adding a
renderer rule without allow/block/identity/false-hide proof can simply move the
bug earlier in the pipeline.

## Required Future Renderer Authority Contract

Every renderer promotion from gap to rule needs:

```text
rendererAuthority
  -> renderer type and route/surface
  -> raw capture or minimal fixture path
  -> title/description/channel/owner paths used
  -> list mode: blocklist, whitelist, empty whitelist, empty blocklist
  -> identity confidence and source path
  -> container/wrapper policy
  -> negative sibling-visible fixture
  -> DOM fallback handoff or no-DOM-needed proof
```

## Current Verdict

```text
P0 renderer authority slice is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
Inventory row is not runtime authority.
```

Related artifacts:

- `docs/audit/FILTERTUBE_RENDERER_AUTHORITY_GAP_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_RENDERER_CONTRACT_COVERAGE_2026-05-17.md`
- `docs/audit/FILTERTUBE_JSON_DOM_INVENTORY_TRUTH_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md`
- `docs/json_paths_encyclopedia.md`
- `docs/youtube_renderer_inventory.md`
- `tests/runtime/renderer-authority-gap-current-behavior.test.mjs`
- `tests/runtime/extracted-capture-current-behavior.test.mjs`
- `tests/runtime/p0-dom-renderer-current-behavior.test.mjs`
