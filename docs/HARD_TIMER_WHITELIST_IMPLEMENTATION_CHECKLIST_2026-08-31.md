# Hard Timer Whitelist implementation checklist

Status: implemented; validation complete except for the pre-existing aggregate iOS test-target link failure noted below.

## Product contract

Hard Timer Whitelist is an explicit session type alongside the existing general
Self-Control Session. It applies to the active profile's Main YouTube surface:

- [x] Require a duration from 1 minute through 7 days and explicit confirmation.
- [x] Require at least one existing Main `whitelistChannels` rule; do not start
      an empty allow-only session.
- [x] Snapshot the active profile, its selected Main allowed-channel rows, and
      the session deadline in local durable storage.
- [x] Force Main filtering on (`enabled: true`) and Main `mode: whitelist`.
- [x] Make the selected Main channel rows the only allow set for the session;
      clear Main whitelist keywords and allowed video IDs so neither bypass can
      widen this channel-only path. Main blocked rules remain harmless because
      Whitelist mode uses the allow-side fallback.
- [x] Pin the active profile and reject profile switching, rule/mode changes,
      settings changes, imports, and sync writes until expiry.
- [x] Restore the snapshot if a stale UI or external write reaches storage.
- [x] Restore the pinned snapshot after app/browser restart; expire and clear it
      automatically at the persisted deadline. The extension owns a browser
      alarm for the deadline and reconciles again on service-worker startup;
      native shells reconcile on launch/foreground and while an active scene is
      open. If restoration cannot be persisted, retain the hard-session record
      and fail closed for a later retry.
- [x] Show the remaining countdown and session type on each management surface.
- [x] Expose no FilterTube cancel action. The unmanaged-browser limitation must
      remain documented (the browser owner can disable/uninstall the extension).

## Surface boundary

- [x] Main YouTube is the selected-channel allow-only surface.
- [x] Kids is not silently switched to whitelist. Its existing mode/rules stay
      frozen in the profile snapshot, because Main and Kids are independent
      surfaces in the current profile model. A future Kids hard-whitelist flow
      must be explicit and separately scoped.
- [x] Keep the existing general Self-Control Session behavior and persisted
      storage backward-compatible; decode old sessions as the general type.
- [x] Do not redesign Android or iOS into an Unhook-style one-page interface.

## Implementation and proof

- [x] Add extension background start/query/enforcement paths and UI controls.
- [x] Add extension-focused contract tests for validation, forced policy,
      mutation rejection/restoration, expiry, restart, and countdown metadata.
- [x] Add Android parity using the existing native Self-Control persistence and
      write guards, with focused unit tests, including restore-after-expiry and
      failed-restore retention.
- [x] Add iOS parity using the existing native Self-Control persistence and
      write guards, with focused tests, including restore-after-expiry and
      failed-restore retention.
- [x] Run syntax, focused tests, and proportionate builds for each changed
      surface; keep generated runtime mirrors clearly separate from source.
      Extension syntax plus 6 focused tests pass; Android focused tests/build
      pass; iOS app sources compile. The aggregate iOS `FilterTubeTests` target
      still cannot link because of unrelated missing native symbols, so its two
      new tests are source-complete but not executable in this dirty baseline.
      The dedicated `syncFilterTubeRuntime` task completed afterward; the
      vendored background, popup, dashboard script, and dashboard HTML now
      match the extension source byte-for-byte, and native runtime assets were
      rebuilt by that task.
- [x] Record unresolved browser/device enforcement boundaries in the handoff:
      browser owners can disable/uninstall the extension, and mobile OS
      suspension delays native reconciliation until foreground/resume or relaunch.
