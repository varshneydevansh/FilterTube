# Open-Tab Reload Reminder Setting — Current Behavior

**Status:** reviewed integration of upstream PR #66; implemented in the
unreleased local release train. This is not a version or store-release claim.

## What this setting controls

The **Disable reload reminders on open tabs** checkbox controls the small
FilterTube reminder that asks already-open YouTube or YouTube Kids tabs to
reload after the extension is installed or updated. It controls the
`FilterTube_FirstRunCheck` / `first_run_prompt.js` path only.

The checkbox is an opt-out and is unchecked by default. An unchecked control
preserves the existing reminder behavior; checking it stores
`showUpdateRefreshPrompt: false`.

It does **not** disable the separate one-time What’s New/release-notes notification. That
surface remains governed by `FilterTube_ReleaseNotesCheck`,
`release_notes_seen_version`, and the `release_notes_prompt.js` content script.
Users can therefore hide repetitive reload reminders without losing the release
announcement or manual access to the dashboard’s What’s New page.

## Storage and default contract

| Concern | Current owner | Contract |
| --- | --- | --- |
| Device-wide preference | `chrome.storage.local.showUpdateRefreshPrompt` | `true` means the reload reminder may appear; explicit `false` suppresses it. |
| Pending reminder | `chrome.storage.local.firstRunRefreshNeeded` | The reminder still requires this existing flag to be true. A completed/dismissed reminder remains suppressed. |
| Decision | `js/background.js:shouldShowUpdateRefreshPrompt` | Both the preference and pending flag must permit the reminder. Missing preference values are treated as enabled for existing installations. |
| Settings UI | `html/tab-view.html#setting_showUpdateRefreshPrompt`, `js/tab-view.js` | The opt-out checkbox is unchecked unless storage contains `showUpdateRefreshPrompt: false`; it persists both choices, defaults to unchecked after read failure, and rolls back a failed write. |
| Prompt renderer | `js/content/first_run_prompt.js` | Renders the reload reminder only after the background decision returns `needed: true`. |
| Separate release notes | `js/content/release_notes_prompt.js` and `FilterTube_ReleaseNotesCheck` | Not gated by `showUpdateRefreshPrompt`. |

Fresh installs initialize the preference to `true`. The update handler does
not overwrite the preference, so an existing user's explicit opt-out survives
future extension updates. Existing installations with no stored preference
also remain enabled until the user turns the setting off.

## Scope and profile behavior

The preference is device-wide rather than part of Main, Kids, or a protected
profile's filtering policy. The current dashboard disables the control while a
protected profile or a self-control lock is active, so a governed user cannot
change a device-wide preference from a restricted surface. The default/parent
surface can re-enable it later.

This setting does not change YouTube filtering, category/language decisions,
Advert Void, time limits, direct-access admission, profile switching, or
release-note acknowledgement.

## PR #66 integration boundary

PR #66 (contributor commit `828c19b0`, “Add setting for update refresh reminders”) was reviewed
against the current tree instead of being cherry-picked wholesale. Its
behavioral contract is retained, while its older HTML placement was not
copied because the Settings page has since been reorganized. The integration
keeps the PR's default-on and persistence semantics and adds the control to the
current Settings layout.

## Verification boundary

`tests/runtime/update-refresh-notification-setting.test.mjs` covers the
default-on runtime decision, the unchecked opt-out control, explicit enable/disable,
read-failure fallback, failed-write rollback, background decision gating, the
install default, the FirstRun message path, and independence from the update
handler. `node --check` is run for the two edited JavaScript files. Browser
installed-state and cross-browser visual proof remain release-test work; this
document does not claim that proof.
