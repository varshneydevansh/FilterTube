# FilterTube Visible-Empty Runtime-Active Current Behavior - 2026-05-19

This is current-behavior proof only. It does not change filtering, settings,
storage, UI rendering, or release behavior. The implementation gate remains closed.

## Purpose

This slice exists because a user can see an apparently empty keyword/channel
list while the runtime still has active rules from another authority path. That
is a different disease from a normal false-positive keyword match: the visible
control state and the compiled runtime state do not share one canonical list
authority.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Current Source Shape

```text
visible dashboard row source
        |
        +--> render_engine.js reads state.keywords / state.channels
        |
        v
user sees empty Main blocklist rows

background compile source
        |
        +--> background.js now prefers activeMain.keywords before activeMain.blockedKeywords
        +--> background.js now prefers activeMain.channels before activeMain.blockedChannels
        |
        v
runtime visible-empty alias masking is fixed for normal Main blocklist compile paths
```

The current split is source-backed:

| Owner | Current behavior | Risk |
| --- | --- | --- |
| Main keyword UI rows | `render_engine.js` uses `state.keywords` in Main blocklist mode. | A stale `blockedKeywords` alias is not visible through the normal Main keyword row source. |
| Main channel UI rows | `render_engine.js` uses `state.channels` in Main blocklist mode. | A stale `blockedChannels` alias is not visible through the normal Main channel row source. |
| Background keyword compile | `background.js` now prefers `activeMain.keywords` before `activeMain.blockedKeywords`. | The main keyword stale-alias masking chain is fixed for normal compilation, but imports/migrations still need authority proof. |
| Background channel compile | `background.js` now prefers `activeMain.channels` before `activeMain.blockedChannels`. | The main channel stale-alias masking chain is fixed for normal compilation, but imports/migrations still need authority proof. |
| Shared save path | `settings_shared.js` writes canonical Main `channels` and `keywords`; in blocklist mode it mirrors `blockedChannels` and `blockedKeywords` from canonical rows. | Normal settings saves now refresh Main blocklist aliases; import/Nanah/direct profile writes still need conflict-policy proof. |

## Why This Matters

This explains one credible path for the report class:

```text
"My blocklist looks empty, but YouTube results still disappear."
```

The runtime engine itself will hide matching content if compiled
`filterKeywords` or `filterChannels` are present. The remaining problem is the
missing authority that proves compiled channel lists came from the same user-visible list
the dashboard is showing.

## Required Future Authority

The future gate should be a single `visibleRuntimeRuleAuthority` report, or a
field in `compiledRuleState`, that records:

```text
visibleRuntimeRuleAuthority {
  profileId,
  surface,
  listMode,
  canonicalVisibleKeywords,
  canonicalVisibleChannels,
  legacyAliasKeywords,
  legacyAliasChannels,
  aliasConflict,
  migrationAction,
  compiledKeywordCount,
  compiledChannelCount,
  userVisibleEmpty,
  runtimeActive,
  decision
}
```

Before behavior changes, fixtures must prove:

1. Empty visible Main keyword rows compile zero Main keyword rules, and empty visible Main channel rows must still produce zero compiled Main channel rules.
2. Stale aliases are either migrated into the visible list with UI disclosure or
   cleared with backup/revision proof.
3. Saving an empty list clears conflicting aliases or reports a conflict.
4. Import, Nanah, legacy migration, profile switching, and list-mode transfer
   cannot create a hidden active alias state.
5. JSON, DOM fallback, quick block, fallback menu, and native app sync all read
   from the same compiled authority.

## Executable Proof

Current behavior is pinned in:

```bash
node --test tests/runtime/visible-empty-runtime-active-current-behavior.test.mjs
```
