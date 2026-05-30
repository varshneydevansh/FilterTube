# FilterTube Seed Initial Global Hook Current Behavior - 2026-05-19

Status: current-behavior proof. This is not an implementation patch.

This slice narrows the startup/performance audit to the earliest page-world
global hooks in `js/seed.js`: `ytInitialData`, `ytInitialPlayerResponse`,
the pending queue used before settings are available, and the reprocess path
used after settings updates.

Runtime proof:

```text
tests/runtime/seed-initial-global-hook-current-behavior.test.mjs
```

## Current Behavior Matrix

| Area | Current behavior | Risk |
| --- | --- | --- |
| Existing `ytInitialData` | If `window.ytInitialData` already exists, seed conditionally snapshots it only when active JSON work exists, processes it, assigns `window.ytInitialData = processed`, then installs a getter that returns the original captured variable. | Existing globals can still be processed before authenticated settings, and getter ownership is subtle because the captured variable is not explicitly reassigned to the processed value before `defineProperty`. |
| Existing `ytInitialPlayerResponse` | The player response follows the same conditional-snapshot and processed-assignment pattern as `ytInitialData`. | Player data is latency-sensitive and should remain no-work when filters are inactive. |
| Setter debug size | Both setters call `getDebugPayloadSize(newValue)` only inside `isSeedDebugEnabled()`. | Debug-on sessions can still pay payload-size cost, so the budget remains explicit. |
| Missing settings queue | `processWithEngine()` pushes data into `pendingDataQueue` when `cachedSettings` is missing and returns the original data; later no-work settings clear that queue without replay. | Network/global startup data can still be retained briefly before settings arrive, so queue policy remains important. |
| Queue replay | `replayPendingQueueIfReady()` clones queued data and calls `processWithEngine()`, but it does not update returned network responses. | Replay can spend CPU/cache work after the original response was already returned to YouTube. |
| Settings update queued globals | `updateSettings()` processes queued items and assigns processed values back to `window.ytInitialData` / `window.ytInitialPlayerResponse`. | If setters are installed, those assignments can invoke the hook again, so queue processing can become double processing without a guard. |
| Settings update raw snapshots | `updateSettings()` clears raw snapshots when there is no active JSON work, but active-work updates can still clone stored snapshots and reprocess them. | Equivalent settings refreshes, UI saves, imports, or sync events can repeat large JSON traversal without revision/dirty-key proof. |
| Future authority absence | Current source has no `seedInitialDataAuthority`, startup revision, dirty-key report, or one-pass assignment guard. | Optimization must not remove zero-flash behavior blindly; it needs a contract that says when initial globals are allowed to be cloned, processed, retained, replayed, or reassigned. |

## Why This Matters

The user-visible symptom can be "YouTube feels slower even with empty filters."
This slice identifies a startup path that is separate from endpoint fetch/XHR
interception:

```text
existing ytInitialData / ytInitialPlayerResponse
        |
        +--> clone / process immediately
        +--> install setter/getter hooks
        +--> queue when settings are absent
        +--> clear queue/raw snapshots when settings have no active JSON work
        +--> replay after settings/engine readiness when active JSON work exists
        +--> reprocess raw snapshots on active-work settings updates
```

The current behavior is understandable because early hooks help zero-flash
filtering, but it needs revision, dirty-key, endpoint-kind, and active-rule
authority before performance changes.

## Required Future Contract

Before changing seed global hooks, add one initial-data authority:

```text
seedInitialDataAuthority({
  endpointKind,
  sourceKind,
  settingsRevision,
  activeRuleState,
  noWorkReason,
  shouldClone,
  shouldProcess,
  shouldRetainRawSnapshot,
  shouldReplayQueue,
  shouldAssignWindowGlobal,
  assignmentWouldInvokeSetter,
  dirtyKeys,
  payloadSizeBudget
})
```

This report should be available before:

- changing `ytInitialData` hooks,
- changing `ytInitialPlayerResponse` hooks,
- weakening debug payload size logging,
- changing pending queue behavior,
- changing settings update replay,
- changing raw snapshot retention,
- changing player-response mutation policy,
- claiming empty-install or disabled-mode zero work.

## Implementation Boundary

Allowed now:

- keep this current-behavior proof green,
- add read-only counters for payload size, queue size, revision, and replay count,
- add fixtures for no-rule initial globals.

Blocked now:

- removing initial global hooks,
- changing getter/setter semantics,
- changing replay timing,
- weakening raw snapshot retention,
- weakening player response processing,
- changing zero-flash behavior without fixture proof.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this seed initial global hook boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint rewrites, fetch/XHR no-work
changes, network authority changes, or whitelist behavior changes.
