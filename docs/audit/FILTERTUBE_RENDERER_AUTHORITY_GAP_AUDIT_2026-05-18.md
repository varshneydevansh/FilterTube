# FilterTube Renderer Authority Gap Audit - 2026-05-18

Status: current-behavior audit artifact. This is not an implementation patch.

Purpose: rank the renderer/JSON authority gaps that matter most for reliability
and performance before changing `js/filter_logic.js`. The existing renderer
contract coverage document lists the broad inventory; this file narrows that
inventory into current JSON decisions that can leak blocked content, hide
non-matching content, or force expensive DOM fallback work.

Primary sources:

- `js/filter_logic.js`
- `docs/json_paths_encyclopedia.md`
- `docs/youtube_renderer_inventory.md`
- `tests/runtime/filter-engine-current-behavior.test.mjs`
- `tests/runtime/extracted-capture-current-behavior.test.mjs`

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

## Current JSON Authority Flow

```text
YouTube JSON object
        |
        v
renderer key ends with Renderer/ViewModel?
        |
        v
FILTER_RULES[rendererType] exists?
        |
        +-- no  -> keep object and recurse into children
        +-- yes -> build candidate from configured paths
                  apply blocklist/whitelist/content/comment rules
                  if blocked -> return null for the whole object
```

Source proof:

- Rule map begins in `js/filter_logic.js:429`.
- Unknown renderers return `false` in `js/filter_logic.js:1837-1844`.
- Whole renderer wrapper removal happens in `js/filter_logic.js:3408-3415`.
- `richItemRenderer` unwraps selected nested renderer types, including
  `compactPlaylistRenderer`, in `js/filter_logic.js:1594-1615`.

## High-Risk Leak Gaps

| Renderer / path family | Current behavior | Source proof | Why it matters |
| --- | --- | --- | --- |
| `compactPlaylistRenderer` | No direct rule; matching title/creator channel passes through even when nested under `richItemRenderer`. | Docs: `docs/json_paths_encyclopedia.md:930-972`, `4813-4835`; code unwrap includes it but no rule exists in `FILTER_RULES`; fixtures: `compactPlaylistRenderer currently has no direct JSON rule`, `extracted YTM compactPlaylistRenderer currently passes through keyword and channel rules`. | Playlists and YTM/watch/sidebar promos can leak blocked creators or blocked playlist titles and then rely on DOM fallback. |
| `showSheetCommand` collaborator rosters | Documented as the preferred collaborator source, but current filter extraction handles `showDialogCommand` only. | Docs: `docs/json_paths_encyclopedia.md:153-182`, `4753-4784`; code scans `showDialogCommand` in `js/filter_logic.js:3000-3027`; fixtures prove show-sheet pass-through and show-dialog baseline, including the real `YTM-XHR.json` extraction `ytm-show-sheet-collab-video-with-context-renderer.json`. | Collaboration channel rules can miss the authoritative modern roster. |
| Direct watch-card parts | `universalWatchCardRenderer` is covered, but direct `watchCardRichHeaderRenderer`, `watchCardHeroVideoRenderer`, and `watchCardRHPanelVideoRenderer` pass through. | Docs: `docs/json_paths_encyclopedia.md:2705-2723`, `4937-4944`; inventory: `docs/youtube_renderer_inventory.md:429-435`, `749-752`; fixtures for direct watch-card rich header/hero/RH panel. | Watch card entities, hero cards, and right-hand panel entries can leak when YouTube sends direct renderers instead of the universal wrapper. |
| Shorts owner identity | `shortsLockupViewModel` and `reelItemRenderer` handle title paths but miss documented direct owner UC/handle paths. | Docs: `docs/json_paths_encyclopedia.md:2141-2187`, `4851-4879`; code: `js/filter_logic.js:811-823`; fixtures for below-thumbnail owner and reel channel identity gaps. | Channel-only rules on Shorts can fail unless a separate video-to-channel map exists. |
| `lockupViewModel` metadata-row owner | Current rule uses decorated-avatar identity but not metadata-row command-run owner identity. | Docs: `docs/json_paths_encyclopedia.md:3199-3217`, `4909-4919`; code: `js/filter_logic.js:494-499`; fixture `lockupViewModel currently ignores metadata row command-run channel id`. | Modern home/search rows can leak channel-blocked content when the avatar identity is absent. |
| Community/search refinement renderers | `postRenderer`, `sharedPostRenderer`, `compactChannelRenderer`, `searchRefinementCardRenderer`, `horizontalCardListRenderer`, `channelMetadataRenderer`, and `expandableMetadataRenderer` pass through. | Docs: `docs/json_paths_encyclopedia.md:2715-2723`, `3275-3302`, `4944-4982`; fixtures cover each pass-through family. | Posts, refinements, channel cards, and metadata can leak or push the system toward broad DOM fallback selectors. |

## High-Risk False-Hide Gaps

| Renderer / path family | Current behavior | Source proof | Why it matters |
| --- | --- | --- | --- |
| `shelfRenderer` and `richShelfRenderer` | Matching shelf title removes the whole shelf object, including non-matching child videos. | Code rules: `js/filter_logic.js:486-487`, `706-707`; whole-object removal: `js/filter_logic.js:3408-3415`; fixtures: shelf/rich shelf whole-container removal. | A topic label can hide calm child content. |
| `radioRenderer` / `compactRadioRenderer` avatar stacks | Generic avatar-stack collaborator extraction can treat Mix/Radio avatar stacks as collaboration identity. | Docs warn Mix cards are not collaborator renderers: `docs/json_paths_encyclopedia.md:239-243`; code scans avatar stacks before renderer-specific mix guard in `js/filter_logic.js:2899-2995`; fixture proves radio avatar-stack channel block. | Mix cards can be falsely removed by a channel rule that should apply only to real collaborators. |
| `universalWatchCardRenderer` wrapper | Header/entity text can remove the whole universal watch card wrapper. | Code rule: `js/filter_logic.js:528-567`; whole-object removal: `js/filter_logic.js:3408-3415`; fixture proves nested header removal. | Wrapper-level decisions must be explicitly intended because one entity header may hide multiple child entries. |
| Duplicate `gridVideoRenderer` rule | Later rule wins and loses some fields from the earlier `BASE_VIDEO_RULES` assignment. | Code assigns `gridVideoRenderer: BASE_VIDEO_RULES` near `js/filter_logic.js:431` and redefines `gridVideoRenderer` near `js/filter_logic.js:604`; fixtures prove description and published-time gaps. | Duplicate rules create silent docs-vs-code drift and inconsistent metadata behavior. |

## Current Fixture-Backed Priority Queue

Do not broaden rules blindly. Each row needs blocklist, whitelist, and identity
confidence fixtures before implementation.

1. Add `compactPlaylistRenderer` JSON fixtures from real YTM/watch captures.
2. Add rule-change fixtures for `showSheetCommand.sheetViewModel`
   collaborator rosters now that the current real-capture pass-through is pinned.
3. Add Mix/Radio avatar-stack guard fixtures so collaborator extraction does not
   falsely block generated mixes.
4. Add direct watch-card rich header, hero, RHS panel, and section-sequence
   fixtures.
5. Add Shorts owner identity fixtures for `belowThumbnailMetadata` and reel
   overlay channel bars.
6. Add `lockupViewModel` metadata-row command-run owner fixtures.
7. Add post/search-refinement/channel-card fixtures with explicit policy:
   content rule, channel rule, or unsupported-noop.
8. Add whole-container policy fixtures for shelf/rich shelf/universal watch card
   so future changes cannot silently hide non-matching children.

## Rule For Future JSON Work

```text
No renderer should move from gap -> rule without:
  1. captured or minimal synthetic fixture,
  2. blocklist expected behavior,
  3. whitelist expected behavior,
  4. channel identity confidence proof,
  5. false-hide boundary fixture when the renderer is a container/wrapper.
```
