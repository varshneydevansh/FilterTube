# Time limits, reset preferences and autoplay review

Review of source revision `c6c75588` plus the local P2P wording update. This is a decision record, not an implementation of reset, autoplay or time-limit fixes. No native app or installed extension data was changed. Source-derived probes use disposable synthetic storage/runtime; installed reproduction remains separate.

## Decisions

1. Fix time-budget persistence and exhausted-state reliability first.
2. Fix playback startup intent and separate end-screen visibility from autoplay behavior.
3. Add an authorized profile-scoped preference reset after consolidating explicit defaults. Keep list clearing and installation reset separate.

The user requested analysis before acting on the two reviews. Those runtime changes and new reset controls have not been implemented here.

## Time limits: present, with reliability defects

Existing schema, parent authorization, compiled policy and signed managed sync are implemented. Parent updates can send approved time-limit policy to the fixed child. Usage is stored locally by profile/date, not pooled across devices. Main and Kids use that profile's allowance. Focused, visible YouTube tabs count even when paused; active playback also counts without focus. The heartbeat interval is approximately five seconds, so this is not exact-to-the-second billing. Timezone-midnight reset depends on the device clock.

Existing focused checks passed, including actual signed receiver persistence. However, probes using extracted production handlers exposed these gaps:

| Finding | Evidence | Proposed correction |
| --- | --- | --- |
| Concurrent tabs can lose counted time | One heartbeat reports 5 seconds consumed, a competing tab writes an older snapshot, persisted usage returns to 0 | Serialize the complete usage read/count/write transaction, revalidate policy and preserve unrelated profile rows |
| Frequent heartbeats discard fractional elapsed time | Ten half-second intervals produce zero stored seconds | Preserve the fractional remainder/last counted boundary instead of resetting the anchor on every floored-zero interval |
| A messaging failure clears an exhausted lock | An exhausted overlay is removed after `runtime.lastError` | Keep confirmed exhaustion until a successful response for the current exact profile/policy permits playback; reject missing/stale/error responses |

Relevant code: `js/background.js:2572` (usage read), `:2601` (floor), `:2611` (anchor), `:2633` (write); `js/content/bridge_settings.js:1709` (heartbeat response), `:1716`–`:1725` (overlay removal). Parent-scoped editing gates remain independently required. This review found no basis for claiming full time-limit reliability or an aggregate cross-device budget.

Worker restart retains persisted consumption but loses the in-memory active owner; its first new heartbeat counts zero. Advancing the system clock to an unused calendar date obtains that date's allowance. Strong trusted-clock enforcement and installed restart/foreground/background behavior remain separate work.

Run from the repository root:

```sh
node docs/audit/artifacts/time-limits-and-autoplay-review/time-limit-probe.mjs
```

The [recorded observations](artifacts/time-limits-and-autoplay-review/time-limit-results.json) deliberately expose current defects. An exit code of zero means the diagnostic ran; it does not mean these behaviors are correct. Convert these into regression tests against production functions when fixing them. The existing time-budget tests partly use modeled heartbeat logic and therefore do not establish transaction correctness.

## Review 1: restoring defaults

No genuine Restore defaults / Reset settings control or reset API was found in the dashboard, popup or public settings/state/IO helpers. The existing restore path imports a backup; it is not a reset.

Recommended primary action: **Restore this profile's content preferences**, placed in Settings with the affected profile named in the confirmation. Use an explicit allowlist of ordinary display/playback preferences. Retain rule lists, filter mode, Kids strictness, category/language restrictions, profiles/ownership, PINs, Notes, verified links, Auto-sync consent, viewing access, daily policy/usage and running hard/self-control sessions. Child changes require the authorized parent route.

Defaults are currently distributed across `js/state_manager.js`, `js/settings_shared.js` and account/child factories in `js/tab-view.js`. They differ by profile kind. First establish a shared explicit default contract; do not recreate the profile, erase its whole settings object or set all booleans false. Some features intentionally default true.

Offer **Clear filter lists** separately with exact Main/Kids scope and counts. Any future **Reset installation** belongs in an advanced destructive flow with export/recovery guidance, never behind the ordinary preference-reset button.

Reset writes are normal profile changes. Existing enabled personal settings Auto-sync will propagate supported preference changes. The confirmation must show affected links or provide a real pause-first workflow. Do not promise “this device only,” silently disable Auto-sync, or skip one outgoing event: later scans and reconnects can still send the reset. A new reset action needs storage failure, stale-profile/permission and linked-device regression coverage.

## Review 2: autoplay stops on a poster

Two own-code causes merit correction:

1. **Startup pause is confused with user pause.** `js/content/content_playback.js:279` captures the initial media `paused` value. MAIN's native reload stages with `pause_at_start:1` and `autoplay:0`. `js/content/content_playback_native.js:226` suppresses pre-acknowledgment play events, while resume at `:170` depends on that initial snapshot. An automatic next video initially paused can attempt to start, have that attempt swallowed, then finish handoff still paused. The actual-native-module probe reproduces this sequence; the same sequence with an initially playing snapshot resumes once. A genuinely paused session with no new play attempt remains paused.
2. **End-screen hiding removes autoplay endpoints.** `js/filter_logic.js:2399`–`:2404` strips autoplay endpoint sets when either hide-end-screen option is enabled, even if Disable Autoplay is off. This can suppress next-video navigation independently of the poster/startup race.

Recommended fix: distinguish a loading state from an explicit user pause, or defer source mutation until native play intent exists. Any intent must bind the same route/video/media node, expire on navigation/profile changes, and remain subordinate to current filter, time-limit, audio/caption and feature checks. Reload-generated events must not fabricate intent. Keep resume one-shot and preserve meaningful browser rejection diagnostics. Do not add unconditional `play()` loops, globally force autoplay or weaken admission guards.

End-screen display settings should hide the requested UI while preserving otherwise permitted autoplay/navigation. Test playlist next, Up-next, background-monitor playback, explicit pause, blocked successors, expired time, captions and selected audio independently. The separate-monitor report has not been reproduced in an installed browser yet.

Run from the repository root:

```sh
node docs/audit/artifacts/time-limits-and-autoplay-review/native-autoplay-probe.mjs
```

The [recorded observations](artifacts/time-limits-and-autoplay-review/native-autoplay-results.jsonl) use the real native module with the existing fixture, not a real YouTube decoder or monitor.

## P2P visibility change completed locally

The Accounts & Sync introduction now leads with peer-to-peer syncing. The website hero has a P2P capability label, and its existing device section explains direct verified-device transfer, supported extension Auto-sync, open connected dashboards and pending Android support. The README introduces P2P near the top. Existing controls and permissions were retained.

English copy uses a keyed dashboard string with the existing English fallback for other locales. No multilingual completion claim follows. Extension and website builds are local checks only; no website deployment, extension submission or push was performed. Installed pairing remains pending.

Local validation: all three browser packages and the website build pass; 1,379 smoke and 668 release-lane checks pass. The settings lane has 1,057 passes and the same 95 failing titles as the pre-change baseline. The release lane is packaging/source evidence, not proof that the defects above are resolved. [Package fingerprints and results](artifacts/time-limits-and-autoplay-review/validation.json) record the wording candidate. Existing audit fingerprints/counts and the README reference line were refreshed without changing their semantic approval boundaries.
