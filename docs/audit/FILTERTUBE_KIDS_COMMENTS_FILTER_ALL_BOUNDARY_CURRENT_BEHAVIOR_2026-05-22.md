# FilterTube Kids Comments Filter All Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, settings patch, Kids patch, comments patch, Filter All
patch, row-action patch, compiler patch, or migration patch.

This slice pins the current Kids keyword comments and Kids channel Filter All
boundary after the keyword-comments scope migration audit. It is separate from
the migration slice because the migration does not mutate Kids rows, while the
runtime UI, StateManager, shared compiler, background compiler, and JSON comment
engine still have independent comments-scope behavior.

## Boundary Source Files

Kids comments Filter All boundary source files: 5

Kids comments Filter All source/effect blocks: 8

runtime Kids comments Filter All fixtures: 7

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/render_engine.js` | 1389 | 59073 | `ceb77f3e50a17affb726f099b15b52fdce311cd027b8f0903174b8d1433cbfa0` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

## Pinned Source Counts

StateManager toggleKidsKeywordComments block lines: 33

StateManager toggleKidsKeywordComments block bytes: 1187

StateManager toggleKidsChannelFilterAll block lines: 35

StateManager toggleKidsChannelFilterAll block bytes: 1184

RenderEngine keyword comments gate block lines: 64

RenderEngine keyword comments gate block bytes: 3192

RenderEngine channel Filter All toggle block lines: 44

RenderEngine channel Filter All toggle block bytes: 2100

background Kids compile block lines: 47

background Kids compile block bytes: 2401

background compiled channel object block lines: 27

background compiled channel object block bytes: 1850

settings_shared syncFilterAllKeywords block lines: 72

settings_shared syncFilterAllKeywords block bytes: 2967

filter_logic comment decision block lines: 34

filter_logic comment decision block bytes: 1999

combined toggleKidsKeywordComments tokens: 1

combined toggleKidsChannelFilterAll tokens: 2

combined filterAllComments tokens: 6

combined filterKeywordsComments tokens: 3

combined additionalKeywordsFromChannels tokens: 2

combined profile-not-kids comment gate tokens: 1

combined profile-is-kids action tokens: 2

combined mergeWithChannels tokens: 3

combined comments-true predicate tokens: 4

combined StateManager toggleChannelFilterAllCommentsByRef callsites: 3

combined StateManager toggleKidsChannelFilterAll callsites: 1

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| Kids keyword comments mutation | `StateManager.toggleKidsKeywordComments(word)` exists, branches on Kids `mode`, toggles `blockedKeywords` in blocklist mode and `whitelistKeywords` in whitelist mode, persists Kids profiles, requests Kids refresh, notifies listeners, and schedules `kids_keyword_comments_toggled`. | A Kids comments row policy proving which Kids UI surfaces should expose or suppress comment-targeting controls in blocklist and whitelist modes. |
| Rendered Kids keyword rows | `RenderEngine` sets `shouldShowCommentsToggle = shouldShowToggles && profile !== 'kids'`, so Kids keyword rows do not show the comment toggle even though StateManager exposes the mutation API. | UI/API parity proof for hidden row actions, managed-child overrides, keyboard fallback controls, and accessibility state. |
| Main channel-derived comments toggle | Main channel-derived keyword rows can call `StateManager.toggleChannelFilterAllCommentsByRef(entry.channelRef)`. | A cross-surface row-action report explaining whether Kids channel-derived rows should have an equivalent comments-scope action or an explicit unsupported policy. |
| Kids channel Filter All mutation | `StateManager.toggleKidsChannelFilterAll(index)` is blocklist-only, toggles `filterAll`, preserves `filterAllComments`, persists Kids profiles, requests Kids refresh, notifies listeners, and schedules `kids_filter_all_toggled`. | A Kids Filter All mutation report with row id, list mode, comments scope, compiled keyword effects, refresh scope, backup trigger, and rollback behavior. |
| Kids whitelist channel rows | Kids channel Filter All returns `false` in whitelist mode and writes nothing. `RenderEngine` also replaces Filter All controls with hidden spacers in whitelist mode. | A whitelist row-action policy proving disabled controls, hidden spacers, index stability, and allow-list false-hide/leak behavior. |
| Background Kids comment compile | In the Kids compile branch, `compiledKidsKeywordsComments` includes Kids keyword rows with `comments === true`, then `mergeWithChannels()` adds `additionalKeywordsFromChannels` into both `filterKeywords` and `filterKeywordsComments`. | A compiler policy proving whether Kids channel-derived Filter All should apply to comments when `filterAllComments` is false, absent, or stale. |
| Shared compiler behavior | `settings_shared.syncFilterAllKeywords()` derives channel keywords with `comments` from `channel.filterAllComments` defaulting true, then `buildCompiledSettings()` compiles comment keywords with `entry.comments === true`. | Background/shared compiler parity proof before making JSON-first comments filtering first-class across UI, import, and runtime paths. |
| JSON comment engine | `filter_logic.js` uses `settings.filterKeywordsComments` for comment renderer text. It does not know whether a pattern came from Kids UI rows, Main rows, shared compiler rows, or background channel-derived rows. | A first-class comment keyword provenance report that carries source surface, list mode, row id, and comments-scope decision into JSON comment filtering. |

## Runtime Proof

The runtime guard proves:

1. Kids blocklist keyword comments can be toggled through StateManager even
   though the rendered Kids keyword row hides the comment toggle.
2. Kids whitelist keyword comments can also be toggled through StateManager.
3. Kids channel Filter All in blocklist mode toggles `filterAll` and preserves
   `filterAllComments`.
4. Kids channel Filter All in whitelist mode returns `false` and performs no
   profile save, refresh, or backup side effect.
5. RenderEngine hides Kids keyword comment toggles while retaining the Main
   channel-derived comments toggle path.
6. Background Kids compile merges channel-derived Filter All patterns into
   `filterKeywordsComments` through `mergeWithChannels()`, while the shared
   compiler derives comment reach from `filterAllComments`.
7. Product runtime source still lacks a first-class Kids comments Filter All
   authority.

## Non-Completion Boundary

Kids comments Filter All behavior still needs a Kids comments row contract,
Kids row-action parity report, Kids channel comments-scope policy, background
and shared compiler parity report, list-mode effect report, managed-child
surface report, JSON comment keyword provenance report, fixture provenance,
metric artifact, refresh/backup mutation report, and first-class Kids comments
Filter All gate.

No `kidsCommentsFilterAllContract`,
`kidsCommentsRowActionParityReport`,
`kidsChannelCommentsScopePolicy`,
`kidsCommentsCompilerParityReport`,
`kidsCommentsListModeEffectReport`,
`kidsCommentsManagedChildSurfaceReport`,
`kidsCommentsKeywordProvenanceReport`,
`kidsCommentsFixtureProvenance`,
`kidsCommentsMetricArtifact`,
`kidsCommentsMutationRefreshReport`, or
`kidsCommentsFilterAllAuthorityGate` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
