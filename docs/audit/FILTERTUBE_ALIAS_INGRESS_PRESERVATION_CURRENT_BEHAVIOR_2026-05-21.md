# FilterTube Alias Ingress Preservation Current Behavior - 2026-05-21

Status: current-behavior proof. Updated by the 2026-05-26 release regression fixes.

This slice extends the visible-empty/stale-alias false-hide audit. The prior
slice now proves that normal Main save/compile paths prefer canonical
`main.keywords` / `main.channels` before stale aliases. This slice keeps the
remaining ingress question open: aliases can still survive or enter profile data
through mutation/import/sync paths before the background compiler ever sees
them.

## Current Ingress And Preservation Paths

```text
Nanah scoped Main apply
        |
        +--> nextMain = normalizeMainProfileAliasFields({ ...currentMain, ...data, channels, keywords, ... })
        |
        v
incoming blocked* aliases are migration fallbacks; normal output mirrors canonical rows

Full-profile import merge
        |
        +--> main = normalizeMainProfileAliasFields({ ...existingMain, ...incMain, channels, keywords, ... })
        |
        v
merged Main output mirrors canonical rows

Target-profile import write
        |
        +--> main = normalizeMainProfileAliasFields({ ...targetMain, channels, keywords, ... })
        |
        v
target-profile Main output mirrors canonical rows

Shared settings save
        |
        +--> main = { ...activeProfile.main, channels, keywords, blockedChannels, blockedKeywords }
        |
        v
normal save mirrors blocklist aliases from canonical rows
```

## Source-Backed Evidence

| Path | Current source | Evidence | Risk |
| --- | --- | --- | --- |
| Nanah scoped Main apply | `js/nanah_sync_adapter.js:193-215` | `nextMain` accepts incoming aliases only as fallback when canonical rows are absent, then `normalizeMainProfileAliasFields()` mirrors or clears blocked aliases by mode. | Conflict-reporting is still implicit rather than first-class, but normal output no longer preserves stale Main aliases over canonical rows. |
| Full-profile import merge | `js/io_manager.js:1512-1528` | Imported `incMain` is merged into canonical rows, then `normalizeMainProfileAliasFields()` mirrors or clears blocked aliases by mode. | Conflict-reporting is still implicit, but merged Main output no longer preserves stale aliases over canonical rows. |
| Target-profile import write | `js/io_manager.js:1629-1635` | Final target Main write uses `normalizeMainProfileAliasFields()` after canonical target rows are chosen. | Existing target aliases no longer survive as independent Main rule sources. |
| StateManager direct Main persistence | `js/state_manager.js:1077-1154` | V4 Main persistence wraps the saved Main object in `normalizeMainProfileAliasFields()`. | Direct UI-facing persistence now mirrors/clears aliases by mode, but still lacks a mutation report. |
| Shared settings save | `js/settings_shared.js:918-936` | Normal save spreads `activeProfile.main`, writes canonical `channels` and `keywords`, and mirrors blocklist aliases from those canonical rows. | UI saves now refresh normal Main blocklist aliases. |
| Background compile | `js/background.js:2055-2064`, `js/background.js:2217-2225` | Compiler prefers canonical `activeMain.keywords` / `activeMain.channels` before `blockedKeywords` / `blockedChannels` aliases. | Preserved aliases are now migration fallbacks in normal Main compile, but incoming alias conflicts still lack an authority report. |

## Current Classification

This is now mostly an ingress/reporting risk, not a direct filtering bug by itself.
The hide happens later when the background compiler turns a selected rule source
into compiled rule payloads. The normal Main compiler now prefers canonical rows
over aliases, and the normal Main writers mirror aliases from canonical rows.
Future cleanup must still cover both sides:

1. Writers must emit a visible conflict report when aliases and canonical rows
   disagree.
2. The compiler must not silently prefer hidden aliases over the visible
   canonical rule source without a `visibleRuntimeRuleAuthority` decision.

## Required Future Proof

Before removing migration aliases entirely or implementing simultaneous
allow/block storage, a migration authority must prove:

```text
aliasIngressDecision {
  actor,
  mutationPath,
  profileId,
  scope,
  strategy,
  incomingAliasKeywordCount,
  incomingAliasChannelCount,
  existingAliasKeywordCount,
  existingAliasChannelCount,
  canonicalKeywordCount,
  canonicalChannelCount,
  conflictPolicy,
  migrationAction,
  backupProof,
  revision,
  compiledRuntimeAfterWrite
}
```

Required fixtures:

1. Nanah scoped Main merge with incoming `blockedKeywords` / `blockedChannels`.
2. Nanah scoped Main replace with current aliases already present.
3. Full-profile import merge with incoming aliases.
4. Target-profile import replace with existing aliases.
5. Normal UI save after visible rows are emptied.
6. Background compile after each write, proving visible rows and runtime-active
   state agree.

## Executable Proof

Current behavior is pinned by:

```bash
node --test tests/runtime/alias-ingress-preservation-current-behavior.test.mjs
```

This document records the current alias normalization boundary and the proof still needed before deleting migration aliases completely.

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
