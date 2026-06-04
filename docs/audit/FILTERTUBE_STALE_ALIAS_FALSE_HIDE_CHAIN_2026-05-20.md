# FilterTube Stale Alias False-Hide Chain - 2026-05-20

Status: current-behavior proof. Updated by the 2026-05-26 release regression fixes.

This document isolates one concrete false-hide disease path:

```text
visible Main blocklist rows are empty
        |
        v
UI row renderer reads canonical main.keywords / main.channels
        |
        v
shared save writes canonical main.keywords / main.channels
        |
        v
legacy blockedKeywords / blockedChannels aliases can remain present
        |
        v
background compiler now prefers main.keywords before blockedKeywords
        |
        v
keyword stale-alias masking is fixed for normal Main blocklist compilation
        |
        v
background compiler now prefers main.channels before blockedChannels
        |
        v
normal Main blocklist compilation ignores stale aliases when canonical rows exist
        |
        v
JSON engine and DOM fallback can hide matching content
```

This is not a keyword matching bug by itself. It is an authority split: the UI
can display one rule source while the runtime compiles another.

## Current Evidence Chain

| Hop | Current source | Evidence | Risk |
| --- | --- | --- | --- |
| Visible keyword rows | `js/render_engine.js:169-225` | Main blocklist keyword rows use `state.keywords`; whitelist rows use `state.whitelistKeywords`. | `state.blockedKeywords` is not visible through the normal Main keyword row list. |
| Visible channel rows | `js/render_engine.js:548-605` | Main blocklist channel rows use `state.channels`; whitelist rows use `state.whitelistChannels`. | `state.blockedChannels` is not visible through the normal Main channel row list. |
| Shared save path | `js/settings_shared.js:918-940` | Save writes `main.channels` and `main.keywords`; in blocklist mode it mirrors `main.blockedChannels` and `main.blockedKeywords` from canonical rows. | Normal Main settings saves now refresh aliases; direct import/Nanah/profile writes still need conflict policy proof. |
| Background keyword compile | `js/background.js:2055-2064` | Background compiler now prefers `activeMain.keywords` before `activeMain.blockedKeywords`. | The reported `shakira`-style keyword masking path is fixed for normal Main compilation. |
| Background channel compile | `js/background.js:2217-2225` | Background compiler now prefers `activeMain.channels` before `activeMain.blockedChannels`. | The visible-empty channel alias path is fixed for normal Main compilation. |
| Engine hide | `js/filter_logic.js` | The engine removes matching renderers when compiled `filterKeywords` or `filterChannels` are present. | The hide behavior is correct when compiled rules are authoritative; the remaining risk is proving every ingress path selects the intended rule source. |

## Current Behavior Classification

| Scenario | Visible UI state | Alias state | Runtime state | Current classification |
| --- | --- | --- | --- | --- |
| Empty canonical Main blocklist, no aliases | empty | empty | should compile empty | intended no-rule state |
| Empty canonical Main blocklist, stale `blockedKeywords` | empty | non-empty | normal compiler now prefers canonical keywords | keyword alias masking fixed in normal compile path |
| Empty canonical Main blocklist, stale `blockedChannels` | empty | non-empty | normal compiler now prefers canonical channels | channel alias masking fixed in normal compile path |
| Save empty canonical list while stale alias exists | empty after save | keyword and channel aliases mirrored | normal settings save clears runtime-active alias masking | normal save path fixed |
| Import/Nanah/profile migration writes aliases | depends on path | may be non-empty | can become runtime active | current migration risk until proven otherwise |

## Required Future Authority

Before changing this behavior, add one authority object or equivalent report
that is emitted by the background-owned compiler and inspected by UI/tests:

```text
visibleRuntimeRuleAuthority {
  profileId,
  surface,
  listMode,
  visibleKeywordSource,
  visibleChannelSource,
  canonicalKeywordCount,
  canonicalChannelCount,
  aliasKeywordCount,
  aliasChannelCount,
  aliasConflict,
  migrationAction,
  compiledKeywordCount,
  compiledChannelCount,
  userVisibleEmpty,
  runtimeActive,
  revision,
  decision
}
```

The future fix must prove each of these invariants:

1. Empty visible Main keyword rows compile zero Main keyword rules, and empty visible Main channel rows compile zero Main channel blocklist rules.
2. If stale aliases are migrated into canonical rows, the UI shows them before
   runtime hides content from them.
3. If stale aliases are cleared, the write has backup/revision proof and cannot
   be lost by a concurrent settings save.
4. Import, Nanah apply, profile switching, legacy migration, list-mode transfer,
   quick block, and 3-dot menu mutations cannot recreate hidden active aliases.
5. JSON filtering, DOM fallback, quick-block UI, fallback-menu UI, and native app
   sync read the same compiled authority rather than independently deciding list
   activity from different fields.

## Why This Must Stay Separate From Keyword Matching

Keyword matching can still have its own false-positive risks, such as substring
matching or JSON/DOM boundary drift. This chain is different: even a perfect
keyword matcher will hide content if the background compiled stale rules the user
cannot see. Fixing keyword alias precedence does not fix channel
visible-empty/runtime-active drift.

## Executable Proof

Current behavior is pinned by:

```bash
node --test tests/runtime/stale-alias-false-hide-chain-current-behavior.test.mjs
```

This file is a blocker for any future simultaneous allow/block migration,
stale-alias cleanup, settings compiler rewrite, import/Nanah behavior change, or
release claim that says empty visible lists mean no active rules.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
