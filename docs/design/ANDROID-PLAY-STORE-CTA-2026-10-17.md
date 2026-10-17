# Android public-install shortcut and copy

This journal records the earlier browser acceptance session. Local description drafts are durable; an unsaved browser form or login may expire and must be rechecked before any later store submission. Draft files preserve the existing store wording and line-break spacing.

## Prepared change

The extension popup now has a full-row native link with the existing bundled
Android artwork. It opens the public listing directly in a new tab:

https://play.google.com/store/apps/details?id=com.filtertube.app

The link is outside the scrolling filter controls, has a minimum 44px tap area,
a visible keyboard focus outline and wrapping localized text. No settings,
profile, trust or filtering handlers were added to this link.

The existing dashboard startup announcement now uses public-availability copy
and the public listing instead of the testing opt-in page. Its body reads:

> Install from Google Play. No invitation or email needed.

All five affected announcement values are aligned in the 38 bundled catalogs
and the English translation-source batch. Existing public-launch translations
were reused for the title, availability and link labels. The short body used
completed GPT-OSS 120B translation proposals, reviewed and corrected by Codex;
failed/truncated proposals were rejected. A completed bounded review found no
semantic error in the corrected Yoruba, Bhojpuri, Pidgin, Thai and Arabic-variety
wording. This does not certify native-speaker fluency. The existing dismissal
key remains unchanged, so previously dismissed announcements are not reopened.

## Store-description correction

Replace the old Android testing-link paragraph with:

> Install FilterTube for Android from Google Play—no invitation or email needed.
> https://play.google.com/store/apps/details?id=com.filtertube.app

Chrome Web Store: changed only that paragraph in the existing English
description. All other description text was preserved and checked before save.
The editor confirmed **Item saved**. This is a **saved draft only**; Submit for
review was not activated. The package remains the existing 3.4.0 draft/published
version; no new extension package was uploaded.

Firefox: after the user supplied the signed-in editor, only the description
paragraph was changed in its form for preview. **Save Changes was not clicked**;
there is no separate draft-save control on that form. The unsaved preview tab
is retained for handoff. No Firefox description was saved or submitted. The user explicitly asked to defer
submissions until the extension is ready. Public listings may therefore still
show the testing link until a later deliberate submission/publication.

## Verification

- Native Chrome for Testing toolbar popup exposes the Android link and artwork.
  The same popup page's link was activated and opened the public Google Play
  FilterTube page with an Install button, without a testing opt-in step.
- Popup screenshot: `/tmp/filtertube-device-sync-review/android-popup.png`.
- Firefox unsaved preview screenshot:
  `/tmp/filtertube-device-sync-review/firefox-android-description-preview.png`.
  Exact Chrome and Firefox description drafts are backed up under
  `docs/design/store-listing-drafts/`.
- Existing sync/profile focused regression suite: **666/666 pass** after copy
  changes. Relevant localization behavior checks: **29/29 pass**.
- Locale structure and 142 duplicate-aware JSON checks pass. All three browser
  packages build successfully. The refreshed package report compares **134**
  assets / **402** archive entries, including popup bundle and Android artwork.
- Browser-store submissions and extension publication are intentionally deferred
  at the user's request. Old installations retain their old signup links until
  updated; local source changes cannot remove those installed copies remotely.
