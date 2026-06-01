# FilterTube Main Filter All Comments Scope Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, comments patch, settings patch, JSON-first patch,
whitelist patch, Filter All patch, compiler patch, or row-action patch.

This slice pins Main channel-derived `filterAllComments` behavior after the
Filter All list-target proof. It is separate from the boolean Filter All toggle:
`filterAll` decides whether a channel-derived keyword exists, while
`filterAllComments` decides whether that derived keyword enters comment
filtering. That split matters before JSON comment filtering can become a
first-class path.

## Boundary Source Files

Main Filter All comments scope source files: 5

Main Filter All comments scope source/effect blocks: 6

runtime Main Filter All comments scope fixtures: 10

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/render_engine.js` | 1389 | 59073 | `ceb77f3e50a17affb726f099b15b52fdce311cd027b8f0903174b8d1433cbfa0` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

## Pinned Source Blocks

| Block | Anchor | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `stateManagerToggleChannelFilterAllCommentsByRef` | `js/state_manager.js:1925` | 45 | 1434 | `13c85642e028eee9bb5dbd5b5f334c464539e8422a7d856632a58dfe98ebced3` |
| `renderEngineKeywordCommentsToggle` | `js/render_engine.js:370` | 64 | 3192 | `6b0c019df85e4af542a4bbacedcc2c6d3a2a38a8ea00227fcd3e805351d0aa8b` |
| `renderEngineFindChannelByRef` | `js/render_engine.js:1222` | 16 | 669 | `99f016287c15dc172db5d82e74739ee0059a7490e855ac302409fd733c851701` |
| `settingsSharedSyncFilterAllKeywords` | `js/settings_shared.js:412` | 72 | 2967 | `ce4e49c6055252ab9a6db6a30be91ddfb50efead1c1ef76bf736c38717febd25` |
| `backgroundSyncStoredMainKeywordsWithChannels` | `js/background.js:1196` | 82 | 2534 | `11ab05bc86763b098b430c9545feefdcab8efa58b4fa59ff7770717bdf081a3d` |
| `filterLogicCommentDecision` | `js/filter_logic.js:2214` | 33 | 1902 | `690889872bba60727d30a9544c2f3340e6df04631d970064869f641c4589a43d` |

## Selected Token Counts

| Token | Count |
| --- | ---: |
| `toggleChannelFilterAllCommentsByRef` | 4 |
| `filterAllComments` | 10 |
| `filterKeywordsComments` | 2 |
| `syncFilterAllKeywords` | 1 |
| `syncStoredMainKeywordsWithChannels` | 1 |
| `comments:` | 4 |
| `state.mode === 'whitelist'` | 1 |
| `isUiLocked` | 1 |
| `recomputeKeywords` | 1 |
| `saveSettings` | 1 |
| `notifyListeners` | 1 |
| `comment_filter_toggled` | 1 |
| `scheduleAutoBackup` | 1 |
| `profile !== 'kids'` | 1 |
| `onToggleComments` | 6 |
| `toggleKeywordComments` | 3 |
| `findChannelByRef` | 1 |
| `getChannelDerivedKey` | 6 |
| `source: 'channel'` | 5 |
| `channelRef` | 35 |
| `filterAll` | 13 |
| `hideAllComments` | 2 |
| `commentText` | 8 |
| `filterChannels` | 2 |
| `filterKeywords` | 3 |
| `addEventListener` | 2 |
| `keydown` | 1 |
| `click` | 1 |

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| Main UI row action | Main keyword rows show the comment toggle when `includeToggles` is enabled and `profile !== 'kids'`. Channel-derived rows call `StateManager.toggleChannelFilterAllCommentsByRef(entry.channelRef)` from the component callback, fallback click handler, and fallback keyboard handler. | A row-action contract that names the allowed profiles, list modes, keyboard state, disabled state, and fallback parity requirements. |
| Main StateManager mutation | `toggleChannelFilterAllCommentsByRef(channelRef)` loads settings, returns `false` if UI is locked, returns `false` in Main whitelist mode, requires a channel ref, matches a Main channel by `FilterTubeSettings.getChannelDerivedKey()` when available, defaults absent `filterAllComments` to `true`, toggles it, recomputes keywords, saves settings, notifies listeners, schedules `comment_filter_toggled`, and returns the new value. | A mutation report proving list target, row id, profile target, lock state, stale channel refs, and backup scope. |
| Inactive Filter All rows | The StateManager comments-scope toggle does not require `filterAll === true`. A blocklist channel with `filterAll: false` can still have `filterAllComments` toggled and persisted, while recompute emits no channel-derived keyword. | An inactive-row policy proving whether latent comments scope is intentional, should be exposed, or should be blocked before optimization. |
| Whitelist mode | Main whitelist mode returns `false` before mutation. The action is write-silent: no save, no channel update listener, no settings broadcast, and no backup message. | A whitelist comments-scope policy that covers hidden controls, stale row refs, and whitelist false-hide/leak semantics. |
| Shared compiler | `settings_shared.syncFilterAllKeywords()` creates channel-derived keywords only for `filterAll` channels and copies `comments` from `filterAllComments`, defaulting absent values to `true`. It drops stale channel-derived rows whose channel ref is no longer active. | Background/shared compiler parity proof with profile, list mode, and row provenance. |
| Background compiler helper | `background.js` has a parallel `syncStoredMainKeywordsWithChannels()` helper that also copies `filterAllComments` into `comments`, drops inactive channel-derived rows, and carries `source: 'channel'` plus `channelRef`, but the block does not carry explicit profile or list-mode fields. | A single compiler policy or parity report before making JSON comment mutation paths depend on this behavior. |
| JSON comment engine | JSON comment engine consumes compiled `filterKeywordsComments` for comment renderer text and falls back to `filterKeywords` when comment-specific keywords are absent. It can also block comment authors through `filterChannels`, but it does not carry row id, channelRef, profile, list mode, or comments-scope provenance into the decision. | A JSON comment keyword provenance report and metric artifact proving allowed effects, rollback/restore behavior, and false-hide/leak boundaries. |

## Runtime Proof

The runtime guard proves:

1. Main channel-derived comment-scope toggles default missing
   `filterAllComments` to `true`, then persist `false`.
2. Main blocklist toggles recompute channel-derived keywords and carry
   `comments: false` into the saved keyword payload.
3. Main blocklist toggles notify `channelUpdated`, notify `save`, broadcast
   compiled Main settings, and schedule `comment_filter_toggled`.
4. Main whitelist mode returns `false` and performs no save, broadcast, channel
   update event, or backup.
5. A Main blocklist row with `filterAll: false` can still persist
   `filterAllComments: false`, while recompute emits no channel-derived keyword.
6. `settings_shared.syncFilterAllKeywords()` carries `filterAllComments: false`
   into a channel-derived keyword, defaults absent comments scope to `true`, and
   drops stale channel-derived keywords.
7. RenderEngine routes Main channel-derived comment toggles by `entry.channelRef`
   through component, click, and keyboard paths.
8. RenderEngine suppresses Kids comment toggles through `profile !== 'kids'`.
9. Background Main compiler helper mirrors the comments flag without explicit
   profile/list-mode fields.
10. JSON comment filtering consumes compiled comment keyword regexes without
    first-class row provenance.

## Non-Completion Boundary

Main Filter All comments scope behavior still needs a comments-scope contract,
toggle mutation report, list-mode policy, channel-ref policy, background/shared
compiler parity report, JSON comment provenance report, inactive Filter All row
policy, fixture provenance, metric artifact, and first-class authority gate.

No runtime symbol exists yet for:

- `mainFilterAllCommentsScopeContract`
- `mainFilterAllCommentsToggleReport`
- `mainFilterAllCommentsListModePolicy`
- `mainFilterAllCommentsChannelRefPolicy`
- `mainFilterAllCommentsCompilerParityReport`
- `mainFilterAllCommentsJsonProvenanceReport`
- `mainFilterAllCommentsInactiveFilterAllReport`
- `mainFilterAllCommentsFixtureProvenance`
- `mainFilterAllCommentsMetricArtifact`
- `mainFilterAllCommentsAuthorityGate`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
