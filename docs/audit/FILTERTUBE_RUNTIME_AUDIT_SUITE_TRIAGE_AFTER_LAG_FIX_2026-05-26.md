# FilterTube Runtime Audit Suite Triage After Lag Fix - 2026-05-26

Status: focused triage for the lag-fix implementation window.

## Context

The targeted YouTube lag fix intentionally changed empty-install runtime
behavior. The old current-behavior proof suite expected several always-on paths
to remain present; those expectations are now stale for the optimized runtime.

## Full Suite Result Before Retargeting

`npm run audit:runtime` was run after the first lag-fix slice.

```text
tests: 4530
pass: 4110
fail: 420
duration: about 71.5s
```

The failing cluster is not one product crash. It is mostly source-pin and
current-behavior drift from the intentional performance changes.

## Failure Clusters

- Seed no-work tests that expected empty/disabled blocklist YouTubei responses
  to clone and parse JSON are stale. The new runtime bypasses clone, parse,
  engine processing, and response rewriting before body work when no active JSON
  rule exists.
- DOM fallback source pins that expected blank category filters to be active are
  stale. Blank enabled categories are now inactive until `selected` is non-empty.
- DOM fallback lifecycle tests that expected an always-attached body
  MutationObserver are stale. Empty blocklist settings now disconnect that
  observer and storage refresh reattaches it only after active DOM work exists.
- Quick-block source pins that expected desktop body mutation observation,
  startup eager sweeps, or ungated pointermove recovery are stale. Desktop now
  relies on hover/focus/target-gated pointer recovery and keeps body observation
  mobile/coarse-only.
- Fallback menu source pins that expected desktop mutation/warmup/scroll eager
  scans are stale. Desktop fallback repair is now event-driven.
- Block-channel method inventory and selector-count tests drifted because the
  dropdown observer was changed from always-on body observation to
  interaction-armed short-lived observation.
- Seed source pins drifted again after the second-pass fix because the seed now
  bypasses settings-not-loaded YouTubei responses before JSON parse, avoids
  eager debug payload stringification, and clears empty-blocklist pending seed
  queues without replay.
- Collaborator dialog source pins drifted after the lazy lifecycle fix because
  `collab_dialog.js` no longer attaches document click/keydown capture listeners
  or a document-wide dialog `MutationObserver` at empty desktop startup.
- Quick-block source pins drifted again after the follow-up lag fix because
  empty desktop SPA navigation no longer forces quick-block overlay scans,
  stale tracked hosts are pruned, desktop quick-block creation is hover-intent
  delayed, and dropdown menu injection is frame-deferred.
- Quick-block source pins drifted again after the viewport lag fix because
  viewport occlusion probes are now cached for 250 ms, each RAF host refresh is
  capped to 32 updates, and dropdown visibility observer work now uses the
  deferred injector instead of synchronously entering dropdown injection.
- Seed fetch source pins drifted again because the empty/no-work fetch bypass
  now returns the native `fetch` promise before attaching response hooks.

## Retargeted Proof Already Updated

- `tests/runtime/empty-install-performance-current-behavior.test.mjs`
- `tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs`
- `tests/runtime/fallback-menu-action-gate-current-behavior.test.mjs`
- `docs/audit/FILTERTUBE_EMPTY_INSTALL_YOUTUBE_SPA_LAG_FIX_2026-05-25.md`
- `docs/audit/FILTERTUBE_EMPTY_INSTALL_DOM_PREFETCH_MUTATION_BYPASS_2026-05-26.md`
- `docs/audit/FILTERTUBE_FALLBACK_MENU_VIEWPORT_SCAN_BYPASS_2026-05-26.md`
- `docs/audit/FILTERTUBE_EMPTY_INSTALL_IDLE_OBSERVER_BUDGET_CURRENT_BEHAVIOR_2026-05-26.md`

## Second-Pass Lag Fix Triage

After the 2026-05-26 second-pass lag fix, the focused release gate below passes:

```text
node --test --test-reporter=dot \
  tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs \
  tests/runtime/empty-install-performance-current-behavior.test.mjs \
  tests/runtime/fallback-menu-action-gate-current-behavior.test.mjs

result: pass, 20 tests
```

After the settings-not-loaded seed bypass test was added, the focused release
gate passes with the expanded proof:

```text
node --test --test-reporter=dot \
  tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs \
  tests/runtime/empty-install-performance-current-behavior.test.mjs \
  tests/runtime/fallback-menu-action-gate-current-behavior.test.mjs

result: pass, 22 tests
```

After the collaborator dialog idle fix, the same focused gate includes the
lazy collaborator lifecycle proof:

```text
node --test --test-reporter=dot \
  tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs \
  tests/runtime/empty-install-performance-current-behavior.test.mjs \
  tests/runtime/fallback-menu-action-gate-current-behavior.test.mjs

result: pass, 23 tests
```

After the quick-block SPA/hover-intent and seed fetch preflight fixes, the
expanded focused gate passes:

```text
node --test --test-reporter=dot \
  tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs \
  tests/runtime/empty-install-performance-current-behavior.test.mjs \
  tests/runtime/fallback-menu-action-gate-current-behavior.test.mjs \
  tests/runtime/quick-block-hover-lifecycle-timer-boundary-current-behavior.test.mjs \
  tests/runtime/block-channel-method-semantic-register-current-behavior.test.mjs \
  tests/runtime/collab-dialog-method-semantic-register-current-behavior.test.mjs

result: pass, 50 tests
```

The broader block-channel source-pin audit has also been retargeted to the
second-pass idle-detach source:

```text
node --test --test-reporter=dot \
  tests/runtime/quick-block-hover-lifecycle-timer-boundary-current-behavior.test.mjs \
  tests/runtime/block-channel-method-semantic-register-current-behavior.test.mjs

result: pass, 18 tests
```

The collaborator dialog source-register proof was retargeted separately:

```text
node --test --test-reporter=dot \
  tests/runtime/collab-dialog-method-semantic-register-current-behavior.test.mjs

result: pass, 7 tests
```

Those two gates are the current proof for the lag-fix slice. The full
`npm run audit:runtime` suite can still contain stale current-behavior pins from
older audit files, so it should not be treated as a green release gate until the
remaining drift is retargeted.

## Release Interpretation

The full audit suite still needs a broader retargeting pass before it can be
used as a green release gate. For this lag release slice, the focused proof
suite plus the retargeted block-channel source-register proof are the relevant
gates because they pin the exact empty-install, quick-block, fallback-menu,
seed, and observer behaviors changed by the fix.
