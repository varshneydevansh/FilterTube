# FilterTube Current Dirty Worktree Audit Boundary Current Behavior - 2026-05-23

Status: current-behavior proof only for the dirty-worktree shape. This
document is not a new implementation patch, package release patch, public-doc
rewrite patch, or optimization patch.

Runtime behavior has changed in the wider 2026-05-26 release-lag fix batch.
This slice records that tracked runtime changes now exist and keeps them
separate from public-doc wording and package metadata.

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
runtime behavior changed: yes in the 2026-05-26 release-lag fix batch
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Why This Slice Exists

The current worktree is not clean. Before using the recent whitelist work as an
optimization base, the audit needs a direct boundary around the current tracked
diff so product behavior is not inferred from public-doc text, package-script
metadata, or stale assumptions about a comment-only runtime-file edit.

This slice pins the current tracked dirty state and keeps the implementation
gate closed. It also confirms that the audit files created for this work remain
under `docs/audit` and runtime verifiers remain under `tests/runtime`.

## Current Tracked Diff Inventory

`git diff --numstat` for the current tracked files reports 27 modified tracked
files, 2593 additions, and 606 deletions.

| Path | Additions | Deletions | Current boundary classification |
| --- | ---: | ---: | --- |
| `README.md` | 44 | 26 | public documentation claim surface |
| `docs/ARCHITECTURE.md` | 36 | 21 | public/core documentation claim surface |
| `docs/CHANNEL_BLOCKING_SYSTEM.md` | 83 | 25 | public/core documentation claim surface |
| `docs/CODEMAP.md` | 2 | 2 | public/core documentation claim surface |
| `docs/CONTENT_HIDING_PLAYBOOK.md` | 14 | 11 | public/core documentation claim surface |
| `docs/DEVELOPER_GUIDE.md` | 7 | 3 | public/core documentation claim surface |
| `docs/FUNCTIONALITY.md` | 5 | 2 | public/core documentation claim surface |
| `docs/NETWORK_REQUEST_PIPELINE.md` | 27 | 16 | public/core documentation claim surface |
| `docs/PROACTIVE_CHANNEL_IDENTITY.md` | 40 | 33 | public/core documentation claim surface |
| `docs/TECHNICAL.md` | 38 | 26 | public/core documentation claim surface |
| `docs/THREE_DOT_MENU_IMPROVEMENTS.md` | 20 | 7 | public/core documentation claim surface |
| `docs/WATCH_PLAYLIST_BREAKDOWN.md` | 4 | 4 | public/core documentation claim surface |
| `docs/YOUTUBE_KIDS_INTEGRATION.md` | 33 | 13 | public/core documentation claim surface |
| `docs/youtube_renderer_inventory.md` | 6 | 6 | public/core documentation claim surface |
| `js/background.js` | 65 | 22 | release lag/identity runtime source surface |
| `js/content/block_channel.js` | 960 | 147 | release lag/quick-block runtime source surface |
| `js/content/bridge_settings.js` | 44 | 2 | release settings bridge runtime source surface |
| `js/content/collab_dialog.js` | 53 | 4 | release collaborator runtime source surface |
| `js/content/dom_fallback.js` | 25 | 2 | release DOM fallback runtime source surface |
| `js/content_bridge.js` | 765 | 151 | release lag/menu/whitelist runtime source surface |
| `js/injector.js` | 59 | 2 | release injector runtime source surface |
| `js/io_manager.js` | 41 | 19 | release storage runtime source surface |
| `js/nanah_sync_adapter.js` | 26 | 6 | release sync runtime source surface |
| `js/seed.js` | 156 | 47 | release JSON no-work runtime source surface |
| `js/settings_shared.js` | 13 | 5 | release settings alias runtime source surface |
| `js/state_manager.js` | 26 | 4 | release main-profile alias runtime source surface |
| `package.json` | 1 | 0 | package metadata audit command |

The documentation rows are claim surfaces, not behavior proof. They still need
claim-to-runtime parity before release or optimization claims can rely on them.

## Runtime File Diff Boundary

The modified tracked JavaScript runtime files are release lag and list-mode fix
surfaces. They cover JSON no-work transport gates, quick-block/menu lifecycle,
whitelist pending-hide gates, settings alias normalization, storage/sync
metadata, collaborator extraction, and background identity paths.

`js/state_manager.js` now has both a leading module header clarification and
main-profile alias normalization so UI-written `main.keywords` and runtime
`main.blockedKeywords` stay aligned.

Current proof facts:

- `git diff --numstat -- js/state_manager.js` is `26 additions / 4 deletions`.
- The header still clarifies StateManager's UI-facing role.
- Executable StateManager behavior now normalizes `main.keywords`,
  `main.channels`, `main.blockedKeywords`, and `main.blockedChannels` before
  persisting active main-profile changes.

Risk before optimization: the comment correctly narrows StateManager's role, but
it does not itself prove compiled-cache parity, list-mode parity, runtime refresh
ownership, Nanah import behavior, or whitelist mutation safety.

## Package Script Boundary

The current `package.json` diff adds this script:

```text
audit:runtime -> node --test tests/runtime/*.test.mjs
```

Current proof facts:

- `git diff --numstat -- package.json` is `1 addition / 0 deletions`.
- Existing build/dev/browser/native-sync scripts are unchanged.
- Package version, license, dependencies, devDependencies, repository, homepage,
  browser manifests, and build script behavior are not changed by this diff.
- Current checkout package version is `3.3.2`; that release bump is a later
  release-alignment change and not part of the `9816c34` package-script diff.
- The script improves audit discoverability, but it is not release artifact
  proof and it is not permission to change whitelist or JSON-first runtime
  behavior.

## Audit Artifact Location Boundary

New audit artifacts for this effort are intentionally outside the core product
docs and runtime source:

```text
docs/audit/FILTERTUBE_CURRENT_DIRTY_WORKTREE_AUDIT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md
tests/runtime/current-dirty-worktree-audit-boundary-current-behavior.test.mjs
```

This preserves the user's requested layout: audit files stay in `docs/audit`
instead of expanding the core product documentation set.

## Current Findings

| Boundary | Current behavior | Risk before optimization | Proof still missing |
| --- | --- | --- | --- |
| Public/core docs | Fourteen tracked README/core-doc files are modified. | Public wording can sound more complete than runtime fixtures prove. | Claim parity report tying each public claim to runtime evidence and release artifacts. |
| Runtime source | Multiple tracked JavaScript runtime files now contain release lag, no-work, menu, quick-block, collaborator, settings alias, storage, and identity fixes. | Runtime changes can be mixed with public-doc wording unless each change has dated proof and focused fixtures. | Runtime-effect report tying each changed owner to focused tests, full audit counts, and manual YouTube verification. |
| Package metadata | `package.json` now exposes `audit:runtime`. | A convenient audit runner can be mistaken for implementation readiness. | Package-script gate tying local audit, release build, browser artifact, and CI commands. |
| Whitelist optimization input | Current dirty runtime code does not implement a whitelist optimization. | Optimizing now would rely on the existing behavior and audit docs rather than a completed authority model. | Current-runtime metric artifacts, reduced JSON fixtures, list-mode contracts, and decision reports. |
| Audit-file location | New proof artifacts remain in `docs/audit` and `tests/runtime`. | Core docs can become harder to review if audit files spill into them. | Continued hygiene checks for root-level FilterTube audit-doc count and audit/test placement. |

## Non-Completion Boundary

This slice does not make the current worktree implementation-ready. It only
proves the current tracked dirty diff shape and keeps optimization blocked until
the relevant runtime authority, fixture, and metric gates exist.

Still missing:

- `currentDirtyWorktreeAuditBoundaryContract`
- `currentDirtyWorktreeDiffClassificationReport`
- `currentDirtyWorktreeRuntimeEffectReport`
- `currentDirtyWorktreePackageScriptGate`
- `currentDirtyWorktreePublicDocClaimReview`
- `currentDirtyWorktreeOptimizationInputPolicy`
- `currentDirtyWorktreeImplementationChangeGate`
- `currentDirtyWorktreeFixtureProvenance`
- `currentDirtyWorktreeMetricArtifact`
- `currentDirtyWorktreeReleaseReadinessReport`

## Verification

```bash
node --test tests/runtime/current-dirty-worktree-audit-boundary-current-behavior.test.mjs
```
