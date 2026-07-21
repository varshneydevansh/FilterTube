# FilterTube Update Refresh Notification Release Setting - 2026-07-20

Status: implementation proof for issue #37.

## Behavior

FilterTube keeps its existing post-update refresh reminder enabled by default.
Settings now exposes a device-wide checkbox that can suppress that reminder on
already-open YouTube and YouTube Kids tabs. The preference is stored separately
from `firstRunRefreshNeeded`, so disabling reminders does not erase pending
update state and a later re-enable can show the reminder again.

Fresh installs write `showUpdateRefreshPrompt: true`. Existing installations
without the key also read as enabled. The update path does not overwrite the
key, preserving an explicit `false` choice across extension updates.

## Source Boundary

- `html/tab-view.html` owns the Settings checkbox.
- `js/tab-view.js` loads and persists the preference, defaults read failures to
  enabled, and restores the checkbox after failed writes.
- `js/background.js` combines the preference with `firstRunRefreshNeeded`
  before answering `FilterTube_FirstRunCheck`.
- `js/content/first_run_prompt.js` remains the existing prompt renderer and
  completion owner; it requires no behavior change.

## Automated Proof

`tests/runtime/update-refresh-notification-setting.test.mjs` executes the
production preference helpers and checks:

- the checkbox exists and its initializer is wired into dashboard startup;
- missing, true, false, and read-error loading behavior;
- persistence of both checkbox choices and failed-write rollback;
- the background decision matrix and asynchronous message response contract;
- the fresh-install default and absence of preference overwrite on update.

Focused command:

```text
node --test tests/runtime/update-refresh-notification-setting.test.mjs
```

## Manual Boundary

No installed-extension visual smoke is claimed by this proof. Automated checks
cover the persisted decision and wiring; final placement, label readability,
and browser-rendered interaction remain manual release verification.
