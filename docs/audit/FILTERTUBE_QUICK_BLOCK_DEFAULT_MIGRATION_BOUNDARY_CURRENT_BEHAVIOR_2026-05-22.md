# FilterTube Quick Block Default Migration Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, settings patch, migration patch, quick-block patch, menu
patch, storage patch, or release/update patch.

This slice pins the current one-time quick-block default migration path in
`js/background.js`. It is separate from the quick-block/block-menu affordance
boundary because this path writes persistent setting state during install/update
handling rather than merely compiling or consuming `showQuickBlockButton`.

## Boundary Source Files

quick-block default migration boundary source files: 1

quick-block default migration source/effect blocks: 7

runtime quick-block default migration fixtures: 6

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |

## Pinned Source Counts

quick-block migration constants block lines: 7

quick-block migration constants block bytes: 379

compareSemver block lines: 18

compareSemver block bytes: 513

isVersionAtLeast block lines: 4

isVersionAtLeast block bytes: 98

applyQuickBlockDefaultMigrationOnce block lines: 53

applyQuickBlockDefaultMigrationOnce block bytes: 2485

onInstalled handler block lines: 93

onInstalled handler block bytes: 4239

install branch block lines: 47

install branch block bytes: 2072

update branch block lines: 41

update branch block bytes: 2010

applyQuickBlockDefaultMigrationOnce showQuickBlockButton tokens: 3

applyQuickBlockDefaultMigrationOnce migration-key tokens: 4

applyQuickBlockDefaultMigrationOnce storage.local.get callsites: 1

applyQuickBlockDefaultMigrationOnce storage.local.set callsites: 2

applyQuickBlockDefaultMigrationOnce resolve true tokens: 1

applyQuickBlockDefaultMigrationOnce resolve false tokens: 3

applyQuickBlockDefaultMigrationOnce Object.entries profiles callsites: 1

install branch showQuickBlockButton tokens: 1

update branch showQuickBlockButton tokens: 0

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| Migration key | The one-time marker is `quickBlockDefaultV327Applied`, while the version gate target is `3.2.9`. | A migration report that records historical release intent, exact affected versions, and whether the marker name/version mismatch is intentional. |
| Install handling | The install branch first writes root `showQuickBlockButton: true` and `showBlockMenuItem: true`, then calls `applyQuickBlockDefaultMigrationOnce({ isInstall: true })`. | An install mutation report with before/after storage state, profile coverage, revision, rollback, and duplicate-write policy. |
| Update handling | The update branch calls `applyQuickBlockDefaultMigrationOnce({ previousVersion: details.previousVersion || '' })`. | An update mutation report keyed by previous version, current version, marker state, profile count, and affected keys. |
| Already applied | If `quickBlockDefaultV327Applied` is present, the migration resolves `false` and writes nothing. | A migration audit record proving skipped state for root and profile settings. |
| Version gate | The migration resolves `false` when the previous version is at least `3.2.9`, or when the current extension version is below `3.2.9`. | A version-gate contract that ties semver comparison, install/update reason, and browser manifest version into one traceable decision. |
| Root storage write | When it applies, the migration writes `quickBlockDefaultV327Applied: true` and root `showQuickBlockButton: true`. | A storage-owner decision proving root legacy key precedence versus V4 profile settings. |
| V4 profile write | When V4 profiles exist, the migration copies every profile and writes each profile's `settings.showQuickBlockButton = true`, preserving other settings. | A profile mutation report with per-profile before/after values, child/default distinction, lock state, backup/revision, and rollback behavior. |
| Error path | On catch, the migration writes only `quickBlockDefaultV327Applied: true` and resolves `false`. | A failure report proving whether marking the migration applied after a partial/failed profile mutation is safe. |

## Runtime Proof

The runtime guard proves:

1. `compareSemver()` and `isVersionAtLeast()` preserve the current semver gate
   behavior.
2. A present `quickBlockDefaultV327Applied` marker skips the migration without
   writing storage.
3. An install on a current version below `3.2.9` skips the migration without
   writing storage.
4. An update from `3.2.9` or later skips the migration without writing storage.
5. An update from a pre-target version writes root `showQuickBlockButton: true`,
   marks `quickBlockDefaultV327Applied: true`, and writes every V4 profile
   setting `showQuickBlockButton: true` while preserving other profile fields.
6. The install and update `onInstalled` branches call the migration through
   different argument shapes after the install branch has already set root
   quick-block and block-menu defaults.

## Non-Completion Boundary

Quick-block default migration still needs a migration contract, per-profile
mutation report, install/update decision report, root-versus-profile precedence
policy, marker/version intent report, failure/rollback report, storage revision,
fixture provenance, metric artifact, and first-class affordance migration gate.

No `quickBlockDefaultMigrationContract`,
`quickBlockDefaultMigrationReport`,
`quickBlockDefaultProfileMutationReport`,
`quickBlockDefaultInstallUpdateGate`,
`quickBlockDefaultRootProfilePrecedencePolicy`,
`quickBlockDefaultMarkerVersionReport`,
`quickBlockDefaultFailureRollbackReport`,
`quickBlockDefaultStorageRevision`,
`quickBlockDefaultFixtureProvenance`, or
`quickBlockDefaultMetricArtifact` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this menu/dialog/injector/quick-block
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, menu action behavior, dialog lifecycle
behavior, injector behavior, quick-block behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
