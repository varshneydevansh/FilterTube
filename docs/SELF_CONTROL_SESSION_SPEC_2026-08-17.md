# FilterTube Self-Control Session

Status: implemented for the next extension release

## Purpose

Self-Control Session is a voluntary commitment lock for students, professionals,
and other users who want to keep a chosen FilterTube policy in force without
being able to edit it midway.

It is separate from the per-profile daily YouTube allowance:

- A daily allowance counts YouTube use and pauses YouTube when that profile's
  allowance is exhausted.
- A Self-Control Session pins one active profile and freezes that profile's
  current FilterTube policy until a fixed deadline.

## Activation contract

The active user chooses a preset duration or a custom duration from 1 minute to
7 days. Before activation, FilterTube clearly states that:

1. the current active profile will be pinned;
2. filtering will be enabled with that profile's current modes and rules;
3. profile switching will be blocked;
4. Main and Kids filter modes, rules, imports, and settings will be fixed;
5. closing or restarting the browser will not pause the countdown; and
6. FilterTube will not expose a cancel action.

The session begins only after explicit confirmation. Its policy snapshot,
profile identity, start time, and deadline are stored in extension-local
storage.

## Hard Timer Whitelist

Hard Timer Whitelist is an explicit session kind (`hard_whitelist`) alongside
the legacy general session. It is scoped to Main YouTube and may start only
when the active profile already has at least one Main `whitelistChannels` row.
During the timer, FilterTube enables filtering, forces Main into Whitelist
mode, and retains those selected channel rows as the only allow set. Main
`whitelistKeywords` and `allowedVideoIds` are cleared in the temporary policy
snapshot so they cannot widen the selected-channel boundary. Kids keeps its
current mode and rules; it is frozen with the profile rather than silently
converted to a second whitelist session.

Hard sessions retain a separate copy of the complete pre-session profile. On
expiry, including after a browser or app restart, that original copy is
restored before the session record is removed. If the restore cannot be
persisted, the expired hard-session record is retained and the lock fails
closed until a later retry succeeds. Existing v1 sessions without
`sessionKind` continue to use the general Self-Control behavior.

The native Android and iOS shells reconcile expiry on app launch, foreground,
and while an active app scene is open. Mobile operating systems may suspend an
app in the background, so no background execution guarantee is claimed; the
next foreground/resume or relaunch performs the reconciliation.

## Enforcement contract

The background runtime owns enforcement. UI disabling is only presentation.
While the session is active, the runtime:

- rejects FilterTube-owned mode and profile-switch mutations;
- observes profile storage writes from popup, dashboard, import, sync, and stale
  extension pages;
- restores the pinned active profile and its policy snapshot if a mutation
  reaches storage; and
- reports the same persisted deadline to every extension surface.

The popup and full-page UI display the remaining countdown. Expiry is automatic
and does not require an unlock action.

## Profile boundary

The lock is bound to the active FilterTube profile and also pins it as the
browser's active FilterTube profile. This prevents evasion by switching to
Default or another account. Ordinary parental daily-time behavior remains
different: independently governed profiles may still be selected through their
normal PIN flow when no Self-Control Session is active.

## Browser boundary

FilterTube cannot honestly promise an operating-system-level lock on an
unmanaged browser. A person who owns the browser profile can disable or uninstall
the extension or clear its extension data. Enterprise browser policy, operating
system parental controls, or another externally managed installation layer is
required to prevent those actions.

Within the installed and enabled extension, there is no early-cancel path.
