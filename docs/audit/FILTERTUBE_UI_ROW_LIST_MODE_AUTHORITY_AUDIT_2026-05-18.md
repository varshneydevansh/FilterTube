# FilterTube UI Row / List Mode Authority Audit - 2026-05-18

Status: audit-only. No product behavior changed.

This slice checks how the extension UI decides whether a row action mutates the
blocklist or whitelist, and how the current either/or list-mode switch moves
data between those lists.

## Source Files

| File | Authority |
| --- | --- |
| `js/render_engine.js` | Renders keyword/channel row actions and delegates row mutations to `StateManager`. |
| `js/state_manager.js` | Branches row mutations by current `state.mode`, persists profile state, and refreshes runtime settings. |
| `js/popup.js` | Popup list-mode toggle and copy/transfer confirmation flow. |
| `js/tab-view.js` | Full tab UI list-mode toggle, subscription import whitelist flow, and managed-child surface branch. |
| `js/background.js` | Trusted list-mode mutation, whitelist import, whitelist-to-blocklist transfer, and persistent channel add paths. |
| `js/settings_shared.js` | Canonical save/load surface for main lists and V4 profile aliases. |

## Current Flow

```text
UI keyword/channel row
        |
        v
RenderEngine row button
        |
        v
StateManager method
        |
        +-- state.mode === "whitelist"
        |       write active profile main.whitelist*
        |       request background compiled refresh
        |
        +-- otherwise blocklist
                mutate state.userKeywords/state.channels
                recompute channel-derived keywords
                saveSettings()
```

List mode itself is not owned by row renderers:

```text
popup / tab-view toggle
        |
        v
FilterTube_SetListMode or FilterTube_TransferWhitelistToBlocklist
        |
        v
background writes ftProfilesV4 and refreshes YouTube/Kids tabs
```

## Proof Notes

- Keyword rows route comment toggle, exact toggle, and delete directly to
  `StateManager` (`js/render_engine.js:381`, `390`, `494`, `511`).
- Channel rows route delete and filter-all directly to `StateManager`
  (`js/render_engine.js:941`, `1045`, `1155`, `1194`).
- `createFilterAllToggle()` hides the Filter All control in whitelist mode by
  returning a hidden spacer instead of wiring an action (`js/render_engine.js:1121`).
- Main keyword mutations branch on `state.mode === 'whitelist'`; whitelist mode
  writes `whitelistKeywords` through `persistMainProfiles()`, while blocklist mode
  mutates `state.userKeywords`, recomputes, and calls `saveSettings()`
  (`js/state_manager.js:1346`, `1420`, `1474`, `1519`).
- Main channel add chooses `addWhitelistChannelPersistent` or
  `addChannelPersistent` based on `state.mode` (`js/state_manager.js:1613`).
- Main channel delete writes `whitelistChannels` in whitelist mode and
  `state.channels` in blocklist mode (`js/state_manager.js:1834`, `1851`).
- `toggleChannelFilterAll()` and channel-derived comment toggles return false
  in whitelist mode (`js/state_manager.js:1878`, `1911`).
- Popup and full tab both send `FilterTube_SetListMode` and both ask the user
  whether to copy existing blocklist entries into whitelist (`js/popup.js:821`,
  `855`; `js/tab-view.js:10548`, `10625`).
- The subscription import path enables whitelist with `copyBlocklist: false`
  after importing subscriptions (`js/tab-view.js:4648`, `4655`).
- Background reads `copyBlocklist` but the normal whitelist transition currently
  calls `mergeAndClearBlocklistIntoWhitelist()` whenever requested mode is
  whitelist (`js/background.js:3302`, `3406`, `3443`). This remains a pinned
  current-behavior gap.
- Managed-child tab surfaces mutate profile JSON directly for list-mode changes,
  with a separate copy/transfer branch from the background path
  (`js/tab-view.js:10563`, `10574`, `10597`).

## Current Risks

1. **List-mode is still either/or at the profile level.** Row controls infer the
   target list from `state.mode`, so a future simultaneous allow/block model
   cannot be added as a small UI toggle. It needs a canonical entry action:
   `allow`, `block`, or neutral.

2. **`copyBlocklist` has split semantics.** UI sends the user's choice, but the
   background whitelist transition currently merges and clears blocklist entries
   regardless of that flag. The tab managed-child branch does respect the flag.

3. **Filter All has no whitelist meaning today.** RenderEngine hides the control
   and StateManager rejects it in whitelist mode. In a simultaneous allow/block
   model, this needs a product decision: per-channel block all, allow all, or
   only apply under block entries.

4. **Whitelist channel duplicate detection is weaker in UI cache.** After a
   background whitelist add, StateManager only checks duplicate channel IDs in
   its local list. Background has stronger canonical handling, but row refresh
   behavior should be tested before UI cache optimizations.

5. **Row index actions depend on the rendered list order.** Channel remove and
   filter-all actions are index-based. Any future search/filter/sort view must
   preserve source index or move to stable entry IDs.

## Future Contract

Before implementing simultaneous allow/block, require these fixtures to pass
under the new model:

- Existing blocklist users migrate each current keyword/channel as `action:block`.
- Existing whitelist users migrate each current keyword/channel as `action:allow`.
- Main and Kids keep independent default policy/mode decisions.
- Quick block and 3-dot actions default to `block`, but UI can change an entry to
  `allow` without losing metadata.
- Row actions never infer list target only from page mode; each entry carries
  its action.
- Runtime compiled settings produce one explicit decision report per renderer:
  `blocked`, `allowed`, `neutral`, or `needs_identity`.
- Empty lists in blocklist mode are zero-work. Empty allow rules under strict
  whitelist remain explicit and confirmed.

## Runtime Proof

Pinned by:

```text
tests/runtime/ui-row-list-mode-authority-current-behavior.test.mjs
```

Raw root captures listed in `.gitignore` remain ignored evidence inputs. They
should be mined into small committed fixtures only when a row/list-mode behavior
requires real YouTube renderer evidence.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this list/settings-mode surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, settings-mode behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
