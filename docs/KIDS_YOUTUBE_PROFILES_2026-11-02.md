# YouTube Kids profiles in the extension (2026-11-02)

The extension now reads a signed-in parent's YouTube Kids profiles, switches who's watching on youtubekids.com, and links FilterTube profiles to kid profiles. It mirrors the Android picker (FilterTubeApp `docs/app/KIDS_YT_PROFILES_PICKER.md`): the same requests, classification rules, key format, link rules and stored shape.

## Files

| File | Role |
|---|---|
| `js/shared/kids_youtube_profiles.js` | Pure rules: roster classification, links, link and switch decisions, plus two self-contained page functions (`pageRoster`, `pageActivate`). |
| `js/kids_youtube_profiles_background.js` | Runs the page functions in a youtubekids.com tab (`scripting.executeScript`, page world), answers the dashboard and popup, and keeps the linked kid selected. |
| `js/tab-view.js`, `html/tab-view.html` | "YouTube Kids profiles" card at the top of Kids Mode: tiles, Watch, and per-profile links. |
| `js/popup.js`, `html/popup.html` | A compact chip row while the active tab is youtubekids.com, plus "Link profiles in Kids Mode". |

## Reading the roster

- **Calls:** the page function runs in youtubekids.com's own page, so it uses its session and `ytcfg`. It makes the same calls as the web app:
  - `GET /get_access_token`;
  - `POST /youtubei/v1/account/accounts_list` with that token as `Authorization: Bearer`;
  - `POST /youtubei/v1/account/get_persona` for YouTube Kids profiles (at most 8, 4 s each), for `approximateAge.age`. Any failure only drops the age; the birthday is never read.
- **Classification (YouTube Kids' own rules):**
  - `GAIA_DELEGATION_TYPE_NONE` is the parent, and is never shown.
  - `REGISTERED_GAIA_SERVICES_IS_YOUTUBE_PERSONA` is a YouTube Kids profile (type 0).
  - `REGISTERED_GAIA_SERVICES_IS_UNICORN_CHILD_ACCOUNT` with `GAIA_DELEGATION_TYPE_EARLY` is a supervised account (type 1).
  - `kidsSupervisedAccountAccessAllowed: false` means the profile is still in setup; it is hidden and counted.
- **What leaves the page:** names, avatar URLs, the selected bit, the age, and `personaKey = "sha256:" + sha256("filtertube-kids-persona-v1:" + obfuscatedGaiaId)`. Raw ids, tokens, the parent's e-mail and the birthday stay in the page, and the token variable is cleared when the function ends.
- **Which tab:** the background uses an open youtubekids.com tab (the popup passes its own). The dashboard reads automatically only when such a tab exists. "Show profiles" may open youtubekids.com in a background tab for the read and close it afterwards.

## Switching

`pageActivate(key)` does what youtubekids.com does: it writes `localStorage["yt.identity.kids::childprofile"] = {profileId, profileType}` and reloads `/`. The page then fetches the child token itself.
- It returns `already_selected` without any request when the stored selection already has that key.
- It returns `persona_unavailable` (and does not reload) for unknown profiles or profiles still in setup.

## Links and rules

- **Stored shape:** `ftProfilesV4.kidsPersonaLinks = { schemaVersion: 1, links: [{ profileId, personaKey, displayName, linkedAtMillis }] }`. The key, the kid's name and the link time only, the same as Android; no avatar and no age.
- **Linking or removing a link:**
  - Only from a parent context. Default manages every profile, and a parent manages its own children. Inside a child it is refused, even with the parent's PIN.
  - The active profile must have a PIN.
  - A fresh (sensitive) PIN entry is required, and the decision is re-checked after the PIN.
- **Auto-select:** when a youtubekids.com page finishes loading, or the active FilterTube profile or its link changes, the background runs `pageActivate` with the active profile's linked key. It is throttled to once per tab and key every 20 s, so a failed switch cannot loop reloads.
- **Watch from FilterTube:**
  - A linked profile can only pick its linked kid.
  - A child profile cannot pick at all ("Ask a parent"); YouTube Kids' own picker is unchanged.
  - The active profile must be unlocked.
  - The background enforces these rules; the UI only reflects them.

## Backups and device sync

- **Manual backups** (`exportV3`, the encrypted export and file imports) carry `kidsPersonaLinks: { schemaVersion: 1, links: [] }`. Imports keep this device's links for the profiles that remain and adopt none from the file.
- **Nanah device sync** (full and active-profile scopes) exports with `includeKidsPersonaLinks: true` and imports with `adoptKidsPersonaLinks: true`. Incoming links follow the import's profile mapping, and the newer `linkedAtMillis` wins per profile. Android likewise keeps links in device sync and out of manual backups.

## Privacy

Nothing in this feature logs names, ids, keys or tokens. Background errors return status codes only.

## Parent account (Android §8)

- **Who can be a parent:** YouTube Kids parents are Google accounts only. Its sign-in sends `pageId=none`, so brand accounts can't own kid profiles. youtubekids.com uses one parent at a time and switches only by re-running its own Google sign-in. Nothing here ever signs anyone out: no `/accounts/ClearOSID` and no Google `Logout`.
- **Identifying the parent:** the roster now returns the current parent (`GAIA_DELEGATION_TYPE_NONE` item) as `{ displayName, email, avatarUrl, parentKey }`, where `parentKey = "sha256:" + sha256("filtertube-kids-parent-v1:" + lowercased e-mail)`. The key is the same as Android's. The e-mail is shown to the parent in Kids Mode and is never stored or logged.
- **"Parent account" row** (top of the card): the parent's name and e-mail, and **Change**.
  - Change is a parent action. Inside a child it reads "Managed by a parent".
  - A profile with a PIN enters it again first (fresh entry).
  - It then runs YouTube Kids' own sign-in in the youtubekids.com tab, with `prompt=select_account`, so Google shows its account chooser.
- **The switch** (`FilterTube_KidsParentSwitch`, background):
  1. `pagePrepareParentSignIn` reads `OAUTH_CLIENT_ID`/`OAUTH_CLIENT_SCOPE` from `ytcfg` and appends a random `state` to the page's own expiring `yt.identity.kids::popup-xsrf` list (at most six entries, like the web).
  2. The tab opens Google's `o/oauth2/v2/auth` with YouTube Kids' parameters (`response_type=none gsession`, `access_type=offline`, `redirect_uri=https://www.youtubekids.com/signin?gaia_popup_redirect=1`, `pageId=none`, plus `login_hint` when an e-mail is known, otherwise the chooser).
  3. On the `/signin` return page, the background waits until the page has checked its state (`pageParentReturnStatus`), then reloads youtubekids.com.
  4. It reads the roster and compares the parent: the outcome is `SWITCHED`, `UNCHANGED`, `OTHER_ACCOUNT`, `SIGNED_OUT`, `REJECTED` (`/signin/rejected`), `CANCELLED` or `TIMED_OUT`.
  5. When the parent changed, the old parent's kid selection is cleared (`pageClearSelection`) and the active profile's linked kid is selected if it is in the new account.
  6. Extension pages get `FilterTube_KidsParentSwitchResult`, and Kids Mode shows the outcome.
- **Links remember the parent:** new links also store `parentKey` and `parentName` (never the e-mail). Links made before this change have no parent and keep the old behaviour.
- **Linked parent:** when the active profile's link names a parent other than the current one:
  - Kids Mode shows a banner and asks once, "Switch parent account?".
  - The popup points to Kids Mode.
  - "Switch to Dad" (`mode: 'apply_link'`) can only go to the linked parent, and the outcome is checked against that key. With no stored e-mail, Google shows its chooser.
  - Inside a child it needs the parent's unlock, because Google's page can offer other accounts. Otherwise it needs the profile's own unlock.
