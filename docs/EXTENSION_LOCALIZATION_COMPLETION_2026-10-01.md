# Extension localization completion — October 1, 2026

## Delivered scope

All 38 target interface languages have bundled translations. The audited scope includes popup controls, dashboard/settings, generated rule editors, backup/import/export dialogs, profile and Family Devices controls, help tooltips, playback overlays, menus, accessibility labels, and historical What's New entries. The language selector lives in Settings and includes browser-language selection and all 38 languages as regular options without preview labels.

Each language contains 2,415 keyed messages and 1,135 static dashboard fragments. Each of the 37 non-English languages also contains all 28 historical release-note entries. The last merged batch adds 54 help messages, covering all 55 explicit dashboard tooltips with one existing-key reuse. Catalog parity is checked independently of source wiring: generated copy uses shared exact/template display helpers, and packaged dashboard fragments are captured before the controller can introduce user-written content.

## Behavior and architecture

- Translation happens locally from versioned bundled artifacts. No translation API key, runtime model, or hosted translation fallback was added.
- Channel/video IDs, URLs, rule syntax, saved settings, imported data, device/profile names, and private placeholder values are not translated. Interface language does not change admission decisions or video-language filters.
- Family Devices, subscription statuses, and import completion share the same precompiled display-copy mechanism. Known UI messages are translated at rendering; unknown private/runtime details pass through unchanged.
- Help bubbles resolve from the same selected-language catalog and disappear on language changes, preventing stale-language tooltips. Release banners use locally translated action/accessibility labels and RTL direction.
- Supported language choices retain their native names without preview suffixes. Older language loads cannot overwrite a newer selection. Backup PIN prompts reuse the shared translated label.
- Send Now / For Later are translated actions, not protected brand names. Product names and parser examples remain protected.
- Browser packages include runtime catalogs, static copy, and release notes, but omit build-time translation drafts.

## Review boundary

All 38 languages are supported in the local implementation, including automatic browser-language matching. Fluent-speaker and installed-browser layout/RTL/accessibility review remain quality work, not language-selection gates. Store publication and those reviews are not claimed. Unknown runtime/provider errors may still be shown verbatim rather than fabricated or mistranslated.

Playback, imported-list, and parental-control fixes are documented separately in [ISSUE_VALIDATION_2026-10-01.md](ISSUE_VALIDATION_2026-10-01.md). Local source tests do not justify closing all linked reports. The affected reporter exports, Firefox Android checks, and two-device/native validation remain separate gates.

Existing unrelated README, comment-boundary audit/test, and semantic-design work was preserved. Nothing was pushed, published, or changed on GitHub issues.

## Final verification

- Strict catalog/static validation: `node scripts/check-ui-locales.mjs --require-all --require-all-static` passes. All target keys, named placeholders, protected terms, parser literals, and batch/catalog consistency are checked. Two older Russian-only source snapshots were reconciled with the already merged all-language catalogs, without changing their existing Russian text.
- Historical release notes: `node scripts/check-release-note-locales.mjs --require-all` passes for 37 languages × 28 entries.
- Localization/runtime/merge/audit/package-boundary suite: 136/136 pass. This includes actual tooltip hover handling, locale-change cleanup, newest-selection race handling, private-placeholder preservation, and generated dialog/status rendering across all target languages.
- Focused issue suite: 128/128 pass. Broader blocking/smoke lanes are not green; see the separate issue document for measured failures and reproduction boundaries.
- JavaScript syntax checks and `git diff --check` pass.
- Chrome and Firefox packages both built from committed snapshot `1ab44cac` in an isolated temporary checkout. Each package was checked for 38 catalogs × 2,415 keys, 38 static catalogs × 1,135 fragments, 37 release-note catalogs × 28 entries, and absence of the translation-draft directory. Both ZIP integrity checks pass. The snapshot lacks Git metadata, so the build's README-stat badge step warns and skips; packaging succeeds and the user's dirty README remains untouched.

The final translation/runtime checkpoint is `1ab44cac`. Related grouped commits include `6bfe6a8f` (import/help/release wiring), `306af313` (package boundary), `6d109320` (approval/import dialogs), `5db09a1b` (generated statuses), `7b3ab813` (translated delivery actions), and `dd8c1600` (shared PIN copy). These are local commits, not published releases.

## Follow-up layout and accessibility review

The October 1 follow-up corrects left-only collaboration borders, category alignment, and nested rule spacing in popup/dashboard CSS to use logical inline properties. Existing compact breakpoints are retained. Playback overlays now carry their own selected `lang` and `dir`, without changing the host Google/YouTube document. A failed catalog load labels the English fallback as English/LTR rather than incorrectly retaining the requested language.

The expanded localization suite passes **140/140**. It checks actual blocked-banner text and language/direction across all 38 bundled catalogs, private owner-text preservation, English fallback, and targeted logical layout declarations. Strict catalog/static and historical-release checks pass again. These are source/runtime-harness checks, not screenshots, keyboard testing, a full WCAG audit, or fluent-speaker approval.

Installed review was attempted but remains incomplete: the Chrome connector could not load its request-header policy; native controls then refused actions because the user changed the active window. No language setting was changed. ADB listed no connected Android device. The newly changed layout/overlay code has not yet been rebuilt into the previously checked browser packages.

## Language availability follow-up

At the user's direction, all 38 completed bundled catalogs are now regular selectable languages. The obsolete preview notice is hidden and no language receives a preview suffix. The runtime's supported locale set also controls automatic browser-language matching. Standalone menu, first-run and admission surfaces follow that policy; overlay/prompt fallback lists are parity-tested against the dashboard runtime. Existing explicit preferences, newest-selection race protection, local-only fetching, English fallback and private data boundaries remain intact.

This enables language use; it does not claim human certification or an extension-store release. Review and feedback can continue after users start using the translations. No remote runtime translator, model, API key or playback dependency was added.

The availability follow-up passes **141/141** localization checks, strict keyed/static catalog validation, historical-release validation, syntax checks and diff whitespace validation. The all-language overlay check covers both explicit selection and automatic browser-language matching. Broader filtering failures and reporter/device gates in the issue document are unaffected.
