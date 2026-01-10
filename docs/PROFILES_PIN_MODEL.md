# Profiles & PIN Model (Spec)

## Goals

- Profiles are independent: each profile has its own settings, filters, and optional PIN.
- If a profile is PIN-protected, its UI must stay locked (no restricted views rendered) until the correct PIN is entered.
- If a profile has no PIN, it must be fully accessible.
- A hard refresh of the New Tab UI must re-lock any PIN-protected profile (no persisted unlock).
- Popup UI and New Tab UI may behave independently for unlock state unless we explicitly implement a secure shared session.

## Definitions

- **Profile**: An entry inside `ftProfilesV4.profiles[profileId]`.
- **Default (Master)**: The `profileId === "default"` profile.
- **Account profile**: `type: "account"` (or inferred account when no `type` and no `parentProfileId`).
- **Child profile**: `type: "child"` (or inferred child when `parentProfileId` is present).
- **Locked profile**: A profile is considered locked if it has a PIN verifier.
  - Master: `profiles.default.security.masterPinVerifier`
  - Non-default: `profiles[profileId].security.profilePinVerifier`
- **Unlocked session state (UI-local)**:
  - Stored in-memory in the UI context (`unlockedProfiles` Set).
  - Not persisted to `storage`.
  - Reset on hard refresh / tab close.

## Current Implemented Rules

### 1) View access rules (New Tab UI)

- If **active profile is locked and not unlocked in this UI session**:
  - Allowed views:
    - `help`, `whatsnew`, `support`
  - Blocked views:
    - Everything else (Dashboard / Filters / Kids / Semantic / Settings / etc.)
  - Expected behavior:
    - Blocked views do not render.
    - Navigation to a blocked view is redirected to `help`.

- If **active profile is unlocked** (correct PIN entered in this UI session):
  - All views for that profile are accessible.

- If **active profile has no PIN**:
  - All views are accessible.

### 2) Profile switching rules (New Tab UI)

- Switching to a profile requires:
  - **Only the target profile’s PIN**, if the target profile is PIN-protected.
  - No Master PIN requirement for switching across profiles.

### 3) Profile type (Account vs Child)

- Type is treated as a **grouping/metadata** concept for UI (and possible future policy), not an access restriction by itself.
- If `profile.type` is missing:
  - If `parentProfileId` exists => inferred as `child`
  - Else => inferred as `account`

### 4) Mutations / edits while locked

- When the UI is locked:
  - Mutating actions (adding/removing channels/keywords, toggling settings) are blocked.
  - StateManager also no-ops mutating operations while locked (defense-in-depth).

### 5) Popup vs New Tab unlock

- Unlock state is currently **local-only** to each UI context.
  - Popup unlock does not unlock New Tab automatically.
  - New Tab unlock does not unlock popup automatically.

## Admin / Master-only actions (Current)

Some actions are intentionally limited to the Default (Master) profile UI context.

- **Account policy controls** (e.g. allow account creation / max accounts):
  - Only editable while `activeProfileId === "default"`.
  - If Master has a PIN, Master must be unlocked first.

- **Creating independent accounts**:
  - Initiated from Default (subject to account policy).

Note: This does not affect a parallel account’s ability to access its own Filters/Kids/Settings when it has no PIN or after it is unlocked.

## Data portability / backup rules (Current)

### Auto-backup

- Auto-backup reads settings from the **active profile’s `settings` object** when `ftProfilesV4` is present.
- Backup output behavior:
  - If active profile is `default`: export type is `full` and includes `profilesV4`.
  - If active profile is not `default`: export type is `profile` and includes only the active profile inside `profilesV4`.
- Destination:
  - `Downloads/FilterTube Backup/<ProfileName>/FilterTube-Backup-<timestamp>.json`
- Rotation:
  - Rotates per profile folder.

### Manual export

- Default can export full or active-only.
- Non-default profiles are forced to export active-only (current UI behavior).

## Known open decisions / remaining work

### A) Shared unlock session (popup ↔ new tab)

- Option A (current): strict local-only unlock.
- Option B (future): shared unlock within the extension session, but **only if background verifies PIN** (do not trust “unlocked” claims from UIs).

### B) What “Child” should mean (policy)

Currently: child is mostly UI grouping.

Possible future policies (not implemented):

- Disable export / disable backup in child profiles.
- Always restrict certain tabs in child profiles unless a parent/admin action occurs.

### C) UI/UX alignment

- Align New Tab profile selector UX with popup dropdown.
- Grey/disable admin-only actions consistently based on lock state and active profile.

## Quick sanity test matrix

- **Profile has no PIN**:
  - Can open Dashboard/Filters/Kids/Semantic/Settings.
  - Can edit settings/lists.

- **Profile has PIN, not yet unlocked in this session**:
  - Cannot access Dashboard/Filters/Kids/Semantic/Settings.
  - Can access Help/What’s New/Support.
  - Hard refresh keeps it locked.

- **Profile has PIN, unlocked in this session**:
  - Can access all views.
  - Can edit settings/lists.

- **Switching profiles**:
  - Only prompts for the target profile’s PIN (if any).
  - Does not require Master PIN just to switch.
