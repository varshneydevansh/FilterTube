# Self-Control Session implementation proof (2026-08-17)

## Scope

This record covers the next-release extension implementation of the voluntary
Self-Control Session. It does not claim that Chrome, Edge, Firefox, or the
operating system prevents the browser owner from disabling or uninstalling the
extension.

## Source evidence

- `js/background.js` owns the persisted session, fixed deadline, profile
  snapshot, activation, status query, profile-switch rejection, and storage
  restoration.
- `html/tab-view.html` and `js/tab-view.js` provide preset/custom activation,
  explicit irreversible-session confirmation, a full-page lock surface, and a
  live countdown.
- `js/popup.js` exposes the same background-owned countdown and rejects popup
  profile switching while active.
- `css/serene-shell.css` supplies the strict-session status and responsive card
  presentation.
- `docs/SELF_CONTROL_SESSION_SPEC_2026-08-17.md` records the product contract and
  unmanaged-browser limitation.

## Automated proof run

Passed locally on 2026-08-17:

```text
node --check js/background.js
node --check js/tab-view.js
node --check js/popup.js
node --test tests/runtime/self-control-session-current-behavior.test.mjs tests/runtime/managed-time-budget-enforcement-current-behavior.test.mjs
git diff --check
```

Result: 16 tests passed, 0 failed. The focused Self-Control test executes the
actual background helper source with a controlled storage runtime and verifies
that activation enables filtering, snapshots the selected allow-only policy,
pins the active profile, and restores both after a simulated mutation.

`npm run lanes:changed` also completed and identified the expected release,
settings, blocking, JSON, DOM, menu, performance, whitelist, and smoke lanes for
the broader dirty working tree.

## Remaining installed-extension gate

An installed-browser manual pass remains required before release packaging:

1. start a short session from an account profile;
2. verify popup and dashboard countdown agreement;
3. attempt profile switching, mode change, rule edit, import, and filtering
   pause from already-open extension pages;
4. restart the browser and verify the same deadline remains;
5. let the deadline expire and verify normal editing returns automatically; and
6. repeat once with a profile that also has a daily YouTube allowance to confirm
   the two mechanisms remain independent.
