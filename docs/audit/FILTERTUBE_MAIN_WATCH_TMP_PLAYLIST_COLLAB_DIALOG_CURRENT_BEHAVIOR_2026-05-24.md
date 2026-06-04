# FilterTube Main Watch TMP Playlist Collaborator Dialog - Current Behavior

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged. This is not an implementation patch.

This slice promotes the previously unextracted `tmp.json` capture out of
historical-scratch status. The file is a mixed container: it starts with a
`var ytInitialData = ...` browse assignment, then later embeds a
`get_watch?printPretty=Flase JSON` array. The second array entry contains a
Main watch `watchNextResponse` with playlist panel rows, autoplay endpoint
objects, and player overlay end-screen rows.

The reduced fixture focuses on one watch Mix playlist row where the visible
byline is `Shakira and 2 more`. The inline `showDialogCommand` collaborator
dialog preserves a current identity split: the first collaborator title command
links `UCGnjeahCJW1AF34HBmQTJ-Q` / `/@shakiraVEVO`, while the row-level
`rendererContext.commandContext` used by current filter logic carries
`UCYLNGLIzMhRTi6ZOLjAPSmw` with no handle.

## Source Facts

| Artifact | Lines | Bytes | SHA-256 | Role |
| --- | ---: | ---: | --- | --- |
| `tmp.json` | 81428 logical lines | 10241427 | `4ffc80cf815c461a0251ca491431b392671e0569268b39e1c22c1ff833a56529` | Ignored mixed raw capture. |
| `tests/runtime/fixtures/captures/main-watch-tmp-playlist-collab-dialog.json` | reduced fixture | reduced fixture | pinned by runtime test | Minimal watch playlist collaborator dialog fixture. |
| `tests/runtime/main-watch-tmp-playlist-collab-dialog-current-behavior.test.mjs` | audit test | audit test | audit test | Pins raw facts, fixture behavior, ledger links, and missing future authority. |

Selected raw facts:

| Fact | Value |
| --- | ---: |
| `var ytInitialData = ` assignments | 1 |
| `get_watch?printPretty=Flase JSON` markers | 1 |
| get-watch array start line | 28512 |
| get-watch array bytes | 6048291 |
| parsed get-watch array entries | 2 |
| parsed `watchNextResponse` keys in get-watch array | 1 |
| parsed `playlistPanelVideoRenderer` keys in get-watch array | 25 |
| parsed `endScreenVideoRenderer` keys in get-watch array | 8 |
| parsed `autoplayVideo` keys in get-watch array | 2 |
| parsed `nextButtonVideo` keys in get-watch array | 2 |
| parsed `previousButtonVideo` keys in get-watch array | 0 |
| parsed `showDialogCommand` keys in get-watch array | 10 |
| parsed `listItemViewModel` keys in get-watch array | 196 |
| parsed `compactAutoplayRenderer` keys in get-watch array | 0 |

## Reduced Fixture

`tests/runtime/fixtures/captures/main-watch-tmp-playlist-collab-dialog.json`
keeps two adjacent playlist panel rows:

- selected Mix row `41ZY18JqI2A`, title `Shakira, Ed Sheeran, Beele - Hips Don't Lie (Anniversary Version)`, byline `Shakira and 2 more`, playlist `RD41ZY18JqI2A`;
- nonselected sibling `TUVcZfQe-Kw`, title `Dua Lipa - Levitating Featuring DaBaby (Official Music Video)`, channel `UC-J-KZfRV8c13fOCkhXdLiQ`.

The selected row keeps three collaborator dialog list items:

| Visible title | Title command identity | Renderer-context identity used by current filter logic |
| --- | --- | --- |
| `shakiraVEVO` | `UCGnjeahCJW1AF34HBmQTJ-Q` / `/@shakiraVEVO` | `UCYLNGLIzMhRTi6ZOLjAPSmw` |
| `Spotify` | none in reduced title command | `UCRMqQWxCWE0VMvtUElm-rEA` |
| `Beele` | none in reduced title command | `UCYAQgXVSRzUeNo34-RJOWUw` |

## Current Behavior

The current JSON engine:

- preserves both playlist rows with no active rules;
- harvests the title-command mapping `UCGnjeahCJW1AF34HBmQTJ-Q -> @shakiraVEVO` as a side effect;
- queues a video-channel map only for the normal Dua Lipa sibling in no-rule mode;
- blocks the collaborator row when a blocklist rule matches the renderer-context collaborator IDs such as `UCYLNGLIzMhRTi6ZOLjAPSmw`, `UCRMqQWxCWE0VMvtUElm-rEA`, or `UCYAQgXVSRzUeNo34-RJOWUw`;
- does not block the collaborator row when a blocklist rule matches only the title-command identity `UCGnjeahCJW1AF34HBmQTJ-Q`;
- in whitelist mode, preserves the collaborator row for `UCYLNGLIzMhRTi6ZOLjAPSmw`, but removes both rows for a whitelist that contains only `UCGnjeahCJW1AF34HBmQTJ-Q`.

That is a current reliability and false-hide/leak boundary, not a request to
change behavior in this slice. Before JSON-first playlist collaborator
optimization, the runtime needs an explicit authority that reconciles title
command identity, renderer-context identity, channel-map side effects, list
mode, and sibling preservation.

## Future Implementation Gate

No product runtime symbol exists yet for:

- `mainWatchTmpPlaylistCollabDialogContract`
- `mainWatchTmpPlaylistCollabIdentityReconciliationReport`
- `mainWatchTmpPlaylistCollabRendererContextPolicy`
- `mainWatchTmpPlaylistCollabTitleCommandPolicy`
- `mainWatchTmpPlaylistCollabWhitelistDecisionReport`
- `mainWatchTmpPlaylistCollabSideEffectReport`
- `mainWatchTmpMixedContainerAdmissionGate`
- `mainWatchTmpPlaylistCollabJsonFirstOptimizationBudget`

Do not treat this fixture as permission to broaden collaborator filtering,
playlist owner filtering, whitelist behavior, endpoint mutation, or menu
mutation until those reports exist with route, source tier, list mode, positive
and negative sibling fixtures, restore proof, and no-playback side-effect proof.

## Verification

```bash
node --test tests/runtime/main-watch-tmp-playlist-collab-dialog-current-behavior.test.mjs
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
