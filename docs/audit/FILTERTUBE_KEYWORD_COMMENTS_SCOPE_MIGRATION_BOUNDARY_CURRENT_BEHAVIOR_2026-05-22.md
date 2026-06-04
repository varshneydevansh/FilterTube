# FilterTube Keyword Comments Scope Migration Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, settings patch, migration patch, keyword patch, comments
patch, storage patch, or install/update patch.

This slice pins the current one-time keyword/comments scope migration path in
`js/background.js`. It is separate from the keyword-match and hide-all-comments
boundaries because this path mutates root keyword/channel rows and V4 profile
rows during install/update handling before later runtime compilation.

## Boundary Source Files

keyword-comments scope migration boundary source files: 1

keyword-comments scope migration source/effect blocks: 5

runtime keyword-comments scope migration fixtures: 7

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6657 | 299580 | `f05fe6f65f9de1218299374ac3c82dd6b6ae9e17e3d862926a20e6c2981c19c7` |

## Pinned Source Counts

keyword-comments migration constants block lines: 7

keyword-comments migration constants block bytes: 379

applyKeywordCommentsScopeMigrationOnce block lines: 87

applyKeywordCommentsScopeMigrationOnce block bytes: 4395

onInstalled handler block lines: 93

onInstalled handler block bytes: 4239

install branch block lines: 47

install branch block bytes: 2072

update branch block lines: 41

update branch block bytes: 2010

applyKeywordCommentsScopeMigrationOnce marker tokens: 4

applyKeywordCommentsScopeMigrationOnce filterComments tokens: 6

applyKeywordCommentsScopeMigrationOnce hideAllComments tokens: 2

applyKeywordCommentsScopeMigrationOnce uiKeywords tokens: 4

applyKeywordCommentsScopeMigrationOnce filterChannels tokens: 4

applyKeywordCommentsScopeMigrationOnce comments tokens: 10

applyKeywordCommentsScopeMigrationOnce filterAllComments tokens: 1

applyKeywordCommentsScopeMigrationOnce storage.local.get callsites: 1

applyKeywordCommentsScopeMigrationOnce storage.local.set callsites: 2

applyKeywordCommentsScopeMigrationOnce resolve true tokens: 1

applyKeywordCommentsScopeMigrationOnce resolve false tokens: 2

applyKeywordCommentsScopeMigrationOnce Object.entries profiles callsites: 1

applyKeywordCommentsScopeMigrationOnce migrateKeywordList tokens: 4

applyKeywordCommentsScopeMigrationOnce migrateChannelList tokens: 4

applyKeywordCommentsScopeMigrationOnce sanitizeSettings tokens: 2

applyKeywordCommentsScopeMigrationOnce blockedKeywords tokens: 0

applyKeywordCommentsScopeMigrationOnce blockedChannels tokens: 0

applyKeywordCommentsScopeMigrationOnce kids tokens: 0

install branch applyKeywordCommentsScopeMigrationOnce callsites: 1

update branch applyKeywordCommentsScopeMigrationOnce callsites: 1

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| Migration key | The one-time marker is `keywordCommentsScopeMigrationV332Applied`. | A migration report tying marker name, release version, affected rows, and user-visible comments-scope policy. |
| Already applied | If the marker exists, the migration resolves `false` and writes nothing. | A skip report that records marker state and confirms no root/profile comments-scope mutation was needed. |
| Root comments-enabled gate | Root migration treats comments as enabled only when `filterComments === true` and `hideAllComments` is not true. | A root comments-scope decision report that distinguishes global comment hiding from keyword/channel comments targeting. |
| Root keyword rows | When root comments are not enabled, `uiKeywords` object entries are copied with `comments: false`; non-object entries are preserved. When root comments are enabled, the list is preserved. | Per-row before/after proof for exactness flags, comments flags, non-object entries, and legacy compiled rows. |
| Root channel rows | When root comments are not enabled, `filterChannels` object entries are copied with `filterAllComments: false`; non-object entries are preserved. When root comments are enabled, the list is preserved. | Channel mutation proof for normal block, Filter All, Kids, imported, and collaborator-derived rows. |
| Root filterComments | The migration always writes root `filterComments: false` when it applies, even when root comments were enabled for row preservation. | A compatibility report proving root flag deprecation, compiled comment keyword behavior, and UI reload parity. |
| V4 profile settings | Each profile settings object is copied with `filterComments` deleted. `hideComments` remains in settings. | A V4 settings mutation report with profile id, lock state, active/default/child distinction, revision, backup, and rollback behavior. |
| V4 main rows | Each profile `main.channels`, `main.keywords`, `main.whitelistChannels`, and `main.whitelistKeywords` is migrated according to that profile's settings. | A list-mode-aware comments-scope report for blocklist, whitelist, empty lists, imported state, and simultaneous allow/block migration plans. |
| Alias rows | The migration does not mention `blockedKeywords`, `blockedChannels`, or Kids list rows. Existing alias rows are preserved by object spread but are not comments-scope migrated by this function. | Alias and Kids migration proof before relying on this path for complete comments-scope cleanup. |
| Error path | On catch, the migration writes only `keywordCommentsScopeMigrationV332Applied: true` and root `filterComments: false`, then resolves `false`. | A failure/rollback report proving whether marking the migration applied after an error is safe. |
| Install/update wiring | Install and update branches both call `applyKeywordCommentsScopeMigrationOnce()`. | Install/update sequencing proof across default writes, quick-block migration, release prompt writes, and settings refresh side effects. |

## Runtime Proof

The runtime guard proves:

1. A present `keywordCommentsScopeMigrationV332Applied` marker skips the
   migration without writing storage.
2. Root disabled-comments migration writes the marker, sets root
   `filterComments: false`, sets root keyword `comments: false`, and sets root
   channel `filterAllComments: false`.
3. Root comments-enabled migration preserves root keyword/channel row comments
   flags while still writing root `filterComments: false`.
4. V4 profile migration deletes `settings.filterComments`, preserves unrelated
   settings, migrates Main row comments fields according to each profile's
   effective comments gate, and preserves alias row objects outside the local
   migration target.
5. A thrown first storage write falls into the catch path and writes only the
   marker plus root `filterComments: false`.
6. Install and update branches both call this migration.

## Non-Completion Boundary

Keyword-comments scope migration still needs a migration contract, per-row
mutation report, root/profile comments-scope decision report, list-mode parity
report, alias row policy, Kids row policy, install/update sequencing report,
failure/rollback report, storage revision, fixture provenance, metric artifact,
and first-class comments-scope migration gate.

No `keywordCommentsScopeMigrationContract`,
`keywordCommentsScopeMigrationReport`,
`keywordCommentsScopeRowMutationReport`,
`keywordCommentsScopeRootProfileDecision`,
`keywordCommentsScopeListModeParityReport`,
`keywordCommentsScopeAliasRowPolicy`,
`keywordCommentsScopeKidsRowPolicy`,
`keywordCommentsScopeInstallUpdateSequence`,
`keywordCommentsScopeFailureRollbackReport`,
`keywordCommentsScopeStorageRevision`,
`keywordCommentsScopeFixtureProvenance`, or
`keywordCommentsScopeMetricArtifact` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
