# FilterTube 3.4.1 preparation — October 2, 2026

3.4.0 is already public on GitHub and the user reports submitting it to Chrome. The corrected extension is therefore prepared as **3.4.1**, without replacing or renaming the published 3.4.0 assets.

## User-facing notes

The changelog and in-extension What's New carry forward the full 3.4.0 feature summary: 38 local interface languages; Disabled and blocked-playback behavior; selected-player and repeated-checking improvements; Shorts, comment and card filtering; dashboard fixes; Advert Void handling; and protected timed allow-only sessions. They also state the Firefox duplicate-key repair and remaining embedded-playback/device limitations.

What's New is the user-facing release history inside the extension, loaded from `data/release_notes.json` and translated through `data/ui_locales/release_notes.*.json`. It also supplies the shorter update-banner text. It is not a commit ledger. Both 3.4.0 and 3.4.1 now have expanded highlights; 3.4.1 has eight separate highlights in English and all 37 translated catalogs. Each translated release catalog retains all 30 historical entries. Canonical release links remain owned by the shared source rather than translators.

The full 3.4.0 feature audit is [here](POST_3_3_7_RELEASE_AUDIT_2026-10-01.md). The concrete Mozilla JSON failure and repair are [here](FIREFOX_JSON_VALIDATION_FIX_2026-10-02.md). The user-facing changelog retains the per-release commit-history heading as a short link to these records rather than inserting a commit table into generated release descriptions.

## Scope and verification

- Package metadata, lockfile, four browser manifests, dashboard version labels, README badge and all 38 static catalogs agree on 3.4.1.
- Duplicate-key, release extraction, version consistency and build-lock regressions: 13/13 pass.
- All 142 runtime data/localization JSON files pass duplicate-key validation.
- All 38 locale catalogs pass structural validation; all 37 translated release catalogs pass the complete-history checker.
- Chrome, Firefox and Opera ZIPs rebuild successfully. Each archive is checked for manifest version 3.4.1, exact source changelog and release data, all 37 translated release catalogs, localized current-version labels and exclusion of translation drafts.
- Mozilla's `addons-linter` on the actual Firefox 3.4.1 ZIP reports **0 errors, 28 warnings, 0 notices**. Existing compatibility/dynamic-HTML warnings remain, and a local lint pass is not store approval.
- Translation structure is not proof of native-speaker accuracy or installed layout quality. Broader historical test failures and installed-device gaps from the 3.4.0 audit are not claimed resolved by this packaging update.
- No Android/iOS version bump, semantic ML activation, store submission, GitHub publication, tag replacement or push is performed by this preparation.

## Changes since published 3.4.0

- `84d5c2d1`: repair release-note extraction and reject missing-details publication.
- `9c06c6ac` and `478dfe8a`: reorganize the historical index, then restore user-facing release notes with detailed history kept in the audit.
- `b0c4bc14`: remove duplicate Korean/Bengali JSON entries, add source/package duplicate-key validation, and verify the corrected 3.4.0 Firefox ZIP with Mozilla's linter.
- This preparation: bump to 3.4.1, carry the full feature summary forward, expand and translate What's New, and validate regenerated browser packages.
