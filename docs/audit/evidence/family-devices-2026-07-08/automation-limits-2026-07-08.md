# Family Devices Automation Limits - 2026-07-08

This note records why the current evidence bundle still needs manual dashboard
capture for redacted map JSON.

## Chrome Apple Events Check

Command attempted from the local development machine:

```bash
osascript \
  -e 'tell application "Google Chrome" to get URL of active tab of front window' \
  -e 'tell application "Google Chrome" to execute active tab of front window javascript "document.title"'
```

Observed result:

```text
Google Chrome got an error: Executing JavaScript through AppleScript is turned off.
To turn it on, from the menu bar, go to View > Developer > Allow JavaScript from Apple Events.
```

## Evidence Impact

- The installed dashboard can still be captured visually.
- The missing `map-no-protected-profile` JSON packet cannot be captured through
  AppleScript automation in this environment.
- Use the visible `Copy evidence` or `Download evidence` button in the Family
  Devices dashboard, then run `npm run audit:family-devices:import`.
- This note is not a pass artifact for any Manual Evidence Log row.
