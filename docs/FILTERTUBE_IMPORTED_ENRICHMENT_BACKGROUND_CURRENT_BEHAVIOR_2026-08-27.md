# FilterTube imported channel enrichment: background-owned behavior

Date: 2026-08-27

This note records the imported channel metadata behavior after the background-worker migration. It is a current-behavior record for the implementation in this worktree, not a claim of live Chrome or Firefox manual validation.

## Ownership

CSV, TXT, FilterTube rule-list JSON, BlockTube migration JSON, and managed-list imports all use the same source-agnostic enrichment route. Rows marked with `import`, `managed_channel_list`, `blocktube`, or `blocktube-channel-name` are excluded from the ordinary ten-item page/session enrichment queue.

`js/imported_channel_enrichment.js` owns the queue. The background entrypoint creates it with the existing profile storage, profile-PIN authorization, target-profile authority, and `handleAddFilteredChannel` resolver. `js/state_manager.js` is now a dashboard-facing command/status proxy; it does not own imported timers, in-flight state, or queue storage.

## Persisted job and recovery

The queue keeps the existing storage key `ftBlockTubeEnrichmentJobV1` so jobs created by the previous page-owned implementation are not discarded. The background schema is version 2 and stores:

- pending tasks and one `inFlight` task;
- `nextRunAt` and per-task retry timestamps/attempts;
- explicit user pause state;
- profile-lock or profile-context blocking state;
- the last error and completion timestamps.

The worker rescans all profiles when it starts. This both recovers interrupted work and discovers incomplete imported rows from an older build that never wrote a queue job. A dashboard reload can request the same rescan, but opening the dashboard is no longer required for the worker to continue.

## One lookup and completion contract

Each task calls the existing background `handleAddFilteredChannel` path with `enrichmentFromImport: true`. That path performs one channel-page lookup and merges the returned UC ID, display name, handle/canonical handle or legacy custom URL, avatar, and alternate IDs into the existing rule. The saved rule remains active from its identifier before enrichment finishes.

A task is complete when it has a valid UC ID, a non-placeholder display name, at least one alternate identity (`handle`, `handleDisplay`, `canonicalHandle`, or `customUrl`), and a logo. A failed or partial response remains in the persisted queue and is retried after about two minutes, then with exponential delay up to a 30-minute ceiling. The attempt counter is capped after four attempts, but the row is not discarded: it remains queued at the ceiling so a transient YouTube/CORS failure cannot be reported as complete. The retry timestamp belongs to that row; it never pauses fresh rows in the same import. Name-only rules still remain name-only because they do not provide a unique UC ID to resolve.

## Timing and lifecycle

While the background worker is awake, the next lookup is randomized between 7 and 15 seconds after the previous scheduling point, with only one request in flight. A Chrome alarm is also scheduled no earlier than 30 seconds as a coarse restart/suspension fallback. Chrome may delay alarms and does not guarantee a second-level wakeup; the 7–15 second interval is therefore a pacing target while the worker stays alive, not a guaranteed background execution interval. See the [Chrome alarms API](https://developer.chrome.com/docs/extensions/reference/api/alarms) for the platform constraint.

For the supplied BlockTube backup, 5,693 unique UC IDs require possible metadata lookups; at one lookup every 7–15 seconds, processing that entire ID set has a nominal active-worker time of roughly 11–24 hours. That is the total throughput of the safety pacing, not a six-hour wait before the next row. The 9,762 name-only BlockTube rules do not enter the metadata queue because a display name cannot identify one channel safely.

Closing the dashboard does not stop an unprotected queue. Browser shutdown or service-worker suspension stops active execution, but the persisted job is resumed/reconciled when the worker starts again. The dashboard exposes an explicit Pause/Resume control. If the active profile is PIN-protected and its background session authorization is gone, the worker records `profile_locked`, stops wakeups, and waits for the normal profile unlock; it never bypasses the PIN. A parent/account profile can manage its child target, while a child profile cannot use its PIN to edit parent-managed rules.

## User communication

The import confirmation and rule-list guidance now tell the user that metadata completion happens in the extension background, that large lists can take time, and that closing the dashboard does not stop the queue. The live status notice reports pending/in-flight counts, timing caveats, lock/block state, and the Pause/Resume action.

## Verification in this worktree

- `tests/runtime/imported-channel-enrichment-background-worker-current-behavior.test.mjs` covers startup discovery, 7–15 second jitter, coarse alarm scheduling, pause/resume, interrupted-task recovery, profile-lock blocking, isolated retry backoff, and recovery from the old queue-wide retry timestamp.
- `tests/runtime/blocktube-enrichment-route-current-behavior.test.mjs` covers the dashboard proxy boundary, all imported source labels, target-profile payload forwarding, and manifest wiring.
- Source syntax checks and `git diff --check` are required before this phase is committed.
