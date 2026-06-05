# Audit: Managed Time-Limit Settings And Performance Boundary

**Generated**: 2026-06-05  
**Lane proof**: `test:settings` and `test:performance` focused managed
time-limit proof.  
**Goal slice**: Managed parent/caregiver time-limit safety.

## Change Boundary

This slice hardens managed child/protected-profile YouTube time-limit policy
acceptance before the runtime can arm heartbeat listeners, count budget, reset
daily usage, or save a remote Nanah time-limit update.

The accepted timezone is now validated with `Intl.DateTimeFormat` in these
authority paths:

- Background compile and heartbeat authority in `js/background.js`.
- Import/profile sanitation in `js/io_manager.js`.
- Content-side runtime arming in `js/content/bridge_settings.js`.
- Dashboard policy read/send boundary in `js/tab-view.js`.
- Nanah managed time-limit apply in `js/nanah_sync_adapter.js`.

Invalid timezone values such as `Local` fail closed before policy write or
runtime work. Valid IANA zones and `UTC` remain accepted.

## Why This Matters

Time-limit reset authority belongs to the parent-selected policy timezone, not
to the child device locale, browser fallback, or a malformed remote payload.
Without this guard, an invalid remote or imported policy could silently fall
through to fallback date behavior and make daily budget reset semantics
ambiguous.

The performance boundary is also explicit: malformed time-limit policy is a
no-work state. Content heartbeat listeners, timers, and timeout overlay work do
not arm for a child profile policy with an invalid timezone.

## Proof

Focused commands:

```bash
node --check js/background.js
node --check js/content/bridge_settings.js
node --check js/io_manager.js
node --check js/tab-view.js
node --check js/nanah_sync_adapter.js

node --test \
  tests/runtime/managed-time-budget-enforcement-current-behavior.test.mjs \
  tests/runtime/managed-child-time-limit-schema-current-behavior.test.mjs \
  tests/runtime/managed-policy-apply-current-behavior.test.mjs
```

Observed result: all focused syntax checks passed and the focused runtime test
command passed 17/17 tests.

## Regression Coverage

- `managed-policy-apply-current-behavior` now proves a signed Nanah
  `time_limits` envelope with `timezone: "Local"` rejects before saving the
  child profile.
- `managed-child-time-limit-schema-current-behavior` now proves the timezone
  validation guard is present across runtime/profile sources.
- `managed-time-budget-enforcement-current-behavior` now proves background and
  content runtime time-budget paths use the timezone guard before heartbeat
  authority can count time or arm the overlay.
