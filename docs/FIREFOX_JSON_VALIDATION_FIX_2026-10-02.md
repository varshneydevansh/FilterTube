# Firefox 3.4.0 upload validation repair

Mozilla upload `11d799e3e91a47088d5fcf1c86867b06` reported three errors: duplicate `Self-Control Session` and `Settings` keys in `data/ui_locales/ko_static.json`, and a repeated category-filter release-description key in `data/ui_locales/bn_static.json`.

All three repeats had identical values. Removing one occurrence preserves the runtime translations. Earlier catalog checks used `JSON.parse`, which silently retained the last value and therefore did not detect this store-validation defect. Building a ZIP successfully was not evidence of passing Mozilla's validator.

`scripts/check-json-keys.cjs` now validates JSON grammar and checks decoded keys within each object, including nested objects and arrays. It reports file names and line numbers. Reusing a key in a different object is valid. Escaped spellings of the same key are duplicates.

Builds check their JSON sources before shell generation, badge updates or cleanup, using the same exclusions as packaging. Copied target JSON is checked again before archive creation. The locale checker also invokes the duplicate-key check. Draft batches remain excluded from runtime validation and packaging.

Verification: all 142 runtime data/localization JSON files pass the unique-key scan. The duplicate-key, release-note, version-consistency and build-lock group passes 13/13 regressions. The Firefox ZIP rebuild and 38-language structural checker pass. Parsed Korean and Bengali catalogs are identical to their pre-fix runtime values.

Mozilla's `addons-linter` was run against both `dist/firefox` and the actual `dist/filtertube-firefox-v3.4.0.zip`: each reports **0 errors, 28 warnings, 0 notices**. The ZIP identifies itself as version 3.4.0. Remaining manifest compatibility and dynamic-HTML warnings are separate from the duplicate-key errors; this repair does not claim to resolve them or guarantee store review acceptance.

At the repair checkpoint the source stayed at 3.4.0. The user subsequently approved preparing 3.4.1 because 3.4.0 was already public on GitHub and submitted to Chrome. See the [3.4.1 preparation record](RELEASE_3_4_1_PREPARATION_2026-10-02.md). Failed Mozilla validation itself can be corrected and retried; it was not the reason a new version number was technically necessary. No release, upload, tag replacement or publication is performed here.
