# FilterTube Managed Time Limit Open Tab Refresh Fix

Date: 2026-07-02
Scope: protected-profile daily YouTube time limits, already-open YouTube tabs,
fresh install/update tabs, and profile-policy refresh behavior.

## Problem

Protected profile time limits must block both:

- already-open YouTube / YouTube Kids tabs
- newly-open YouTube / YouTube Kids tabs

The runtime already had the background-owned heartbeat budget and timeout
overlay, but two refresh gaps could make a manual test look broken:

1. `FilterTube_RefreshNow` used the normal compiled-settings request. If a
   cached `main` or `kids` settings object was still present, an open tab could
   reprocess with stale policy instead of the newly-saved `ftProfilesV4`
   `timeLimitPolicy`.
2. Fresh install/update only injected the refresh prompt into already-open
   YouTube tabs. If the tab had no live FilterTube content receiver, it could
   not receive later `FilterTube_RefreshNow` messages until the page was
   reloaded.

## Code Change

Changed files:

- `js/content/bridge_settings.js`
- `js/background.js`
- `js/content/first_run_prompt.js`
- `docs/FUNCTIONALITY.md`
- `docs/TECHNICAL.md`

Behavior changes:

- `FilterTube_RefreshNow` now calls `requestSettingsFromBackground({
  forceRefresh: true })`, then forces DOM fallback reprocessing and observer
  refresh.
- background `storage.onChanged` still invalidates `compiledSettingsCache.main`
  and `compiledSettingsCache.kids` for relevant settings keys, including
  `ftProfilesV4`.
- after relevant settings changes, background now broadcasts
  `FilterTube_RefreshNow` to YouTube and YouTube Kids tabs.
- when `ftProfilesV4` changes, background uses a guarded tab activation path:
  ping the content runtime first; if no receiver exists, inject the MAIN-world
  seed and the ISOLATED-world content runtime files, then send
  `FilterTube_RefreshNow`.
- install/update now uses the same guarded activation path for already-open
  YouTube tabs.
- the first-run prompt no longer says refresh is required to activate
  FilterTube. It now says the tab can use FilterTube controls, while reload is
  still recommended for earliest document-start YouTube data coverage.

## Expected Runtime Behavior

When the active FilterTube profile is a protected profile with an enabled daily
time limit:

1. A new YouTube / YouTube Kids tab receives the manifest content scripts and
   starts the managed time-limit heartbeat.
2. An already-open tab with a live FilterTube receiver receives
   `FilterTube_RefreshNow`, pulls fresh compiled settings, and starts or updates
   the heartbeat.
3. An already-open tab without a live FilterTube receiver is guarded-injected,
   then receives `FilterTube_RefreshNow`.
4. Once the background-owned daily budget reaches zero, the content runtime
   shows the FilterTube timeout surface.

The policy still applies only to the active protected profile. Setting a limit
on a protected profile while browsing as `Default (Master)` must not block the
master profile.

## Boundaries

- Late injection cannot recreate true `document_start` JSON interception for
  YouTube data that already loaded before the extension/runtime existed.
- Reload remains the strongest path for zero-flash JSON-first filtering on an
  already-open tab.
- The guarded injection path is for runtime recovery, DOM filtering,
  time-limit enforcement, menu behavior, and current settings refresh.
- `managedTimeUsage` storage writes are intentionally not treated as compiled
  settings changes.

## Validation

Static checks run after the change:

```bash
node --check js/background.js
node --check js/content/bridge_settings.js
node --check js/content/first_run_prompt.js
```

Manual installed-extension smoke still needed:

1. Create/switch to a protected profile.
2. Set a 0 minute limit and confirm YouTube blocks immediately.
3. Set a 1 minute limit and keep a visible/focused YouTube tab active until the
   timeout screen appears.
4. Repeat with a YouTube tab that was already open before setting the limit.
5. Repeat with a new YouTube tab after setting the limit.
