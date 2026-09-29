# Extension localization: complete locales before advertised

## Original source baseline (2026-09-27)

At the start of this work, FilterTube did not have a translated extension interface. The
experimental video Language Filter determines a video's spoken/source language;
it is not a UI-language setting. The four extension manifests have no
`default_locale`, and the repository had no `_locales` or UI translation
catalog. English UI copy is embedded in the popup shell and controller, the
dashboard HTML and controller, shared renderers, in-page admission/blocked
overlays, background notifications, and the shared release notes JSON.
An HTML-parser inventory of `html/tab-view.html` alone found 1,259 nonempty
text nodes (1,065 distinct values), before dynamic JavaScript strings,
attributes, the popup, or in-page notices. This is why a short catalog cannot
be presented as full language support.

In particular, `data/release_notes.json` is loaded by both the dashboard's
What's New view and the release banner. Translating only the navigation or
Chrome's extension description would not satisfy the Russian-language request.

## User-facing contract

1. A device-level **Interface language** setting defaults to the browser's
   supported language, with an explicit override. It is separate from profiles,
   video-language filters, rules, family-device sync, and YouTube language.
2. English remains the fallback for unsupported browser languages. Russian or
   any other target language is not offered as complete until all required
   surfaces below are translated and reviewed in an installed browser.
3. Local bundled catalogs contain UI copy. No translation API, network
   request, telemetry, or remote fallback is needed to change language.
4. Rule IDs, channel/video IDs, regexes, user-entered names and keywords,
   imported data, URLs, and YouTube metadata are never translated or mutated.
   Only FilterTube's presentation copy and formatting change.
5. Dates, numbers, plurals, placeholders, accessible names, and error
   conditions use locale-aware formatting. HTML is not inserted from translator
   strings. Right-to-left locales will need explicit layout and interaction
   tests before being added to the supported list.

## Thirty-eight-language target and selector placement

The working target is every language above 50 million total speakers in the
2026 (L1 + L2) ranking summarized at
<https://en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers>,
not a claim that all varieties share one written interface. The 38 targets are
English, Mandarin Chinese (Simplified written UI), Hindi, Spanish, Modern
Standard Arabic, French, Bengali, Portuguese, Indonesian, Urdu, Russian,
German, Japanese, Nigerian Pidgin, Egyptian Arabic, Marathi, Vietnamese,
Telugu, Swahili, Hausa, Turkish, Western Punjabi, Tagalog/Filipino, Tamil,
Yue Chinese, Wu Chinese, Iranian Persian, Korean, Amharic, Thai, Javanese,
Italian, Gujarati, Kannada, Levantine Arabic, Sudanese Arabic, Yoruba, and
Bhojpuri. `data/ui_locales/targets.json` records the exact locale codes and
native display names. This is a **work queue**, not 38 complete languages.

The interface selector belongs in Settings, not in the top bar or the video
Language Filter. It is visible even if the bundled target-name file fails to
load. The other 37 languages are explicitly marked **preview**, while the
card says English is the only complete interface language. Its preference uses
a device-local storage key and never changes profile rules or synced data.
The card explains that boundary and keeps the select full-width and at least
44px tall on narrow layouts. Browser auto-detection uses a completed locale
or English by default; a saved preview selection may use a staged catalog.
Previews can leave parts of the interface in English and must not be presented
as fully supported until the coverage gate below passes.

## Required coverage gate for every released locale

| Surface | Source areas | Acceptance |
| --- | --- | --- |
| Extension identity | all four manifests, browser locale files | Browser-provided extension name/description in Russian |
| Popup | `src/extension-shell/popup.jsx`, `js/popup.js`, shared UI/renderers | Every label, button, menu, status, tooltip, validation and accessible name |
| Dashboard | `html/tab-view.html`, `js/tab-view.js`, shared UI/renderers | Every tab, settings control, profile/PIN flow, import/export, sync, Help and About |
| On-page feedback | content scripts and overlays | Checking, verified block reasons, unavailable metadata, time limit, notifications and action controls |
| What's New | `data/release_notes.json`, `js/tab-view.js`, `js/background.js` | Current release card and banner share the same Russian copy; historical entries have an explicit reviewed policy |
| Browser variants | Chrome, Firefox, Opera | Packaged files and locale selection work in each build |

The gate is not met by a partially translated screen or by machine-translating
runtime data. A missing translation key, mismatched placeholder, untranslated
visible string in the audited surfaces, or broken locale-specific layout blocks
the corresponding language-support claim. This same gate applies to the
38-language target; adding a locale code without completed copy
does not count as supporting that language.

## Implementation sequence

1. Build a source inventory of literal UI strings and give each user-facing
   string a stable semantic key. Keep rule serialization untouched.
2. Introduce bundled English source and Russian catalogs, a small local
   formatting/lookup layer, and a device-level language preference. Convert
   the popup, dashboard, notifications, and overlays in bounded slices.
3. Give shared release notes localized fields keyed by release version. Both
   dashboard and banner must select the same locale and fallback policy.
4. Add checks for catalog key parity, placeholders, unsafe markup, packaged
   assets, and the full required-surface inventory. Test Russian with long
   text and real navigation, error, import, PIN, and blocked-playback flows.
5. Only then expose each locale as a finished option. Repeat the same gate for
   every language; do not count placeholder-English catalogs as translations.

## Model-assisted translation boundary

aKriti currently describes document translation as a draft capability and
evaluation direction, not a verified production translator. FilterTube's
proposed local semantic model is a text-embedding classifier for topic matching,
not a translation generator. Neither should be coupled to extension startup or
playback admission to deliver interface text.

A future proven local translation-capable model may draft **build-time** catalog
entries from English keys plus context and an approved glossary. The output must
be a versioned, bundled artifact. Before release, validate key/placeholder
parity, protected tokens (FilterTube, IDs, URLs, setting semantics), escaping,
plurals, length/overflow, and accessibility text, then review it with fluent
speakers and installed-browser fixtures. Model version and source-string hash
belong in translation provenance; uncertain entries remain review items, not
runtime guesses. No model weights, API key, remote call, or per-page inference
is required for a user to switch interface language.

Android upstream sync is deliberately later. The extension's rule schema and
behavior must first stabilize; native Android then gets its own resource
translations and parity tests rather than a copied browser string layer.

## Current implementation checkpoint (2026-09-28)

All 38 target locales now have 174/174 keyed interface strings, including
Tamil and Gujarati. The Settings selector offers all 37 non-English catalogs
as explicitly labeled previews. `en_static.json` inventories 1,135 distinct
dashboard HTML fragments; the separately translated `*_static.json` files are
validated against those exact source strings. Russian, Hindi, Spanish, French,
Arabic, Simplified Chinese, Bengali, Portuguese, German, Tamil, Indonesian,
Gujarati, Japanese, Marathi, Telugu, Vietnamese, Urdu, Swahili, Turkish, Korean, Italian, Thai, Persian, Kannada, Filipino, Hausa, Nigerian Pidgin, Egyptian Arabic, Cantonese Traditional, Western Punjabi, Wu Chinese Simplified, Amharic, Javanese, Levantine Arabic, Sudanese Arabic, Bhojpuri, and Yoruba currently have 1,135/1,135 dashboard static
keys. All 37 non-English target dashboard static catalogs now meet this structural gate. These are assistant-drafted translations in the
repository, not native-reviewed or complete-extension translations. Regional
varieties (particularly Wu, Arabic dialects, Nigerian Pidgin, and Bhojpuri)
need fluent-speaker review before release.

During the 2026-09-28 Urdu draft, an agent used a public translation endpoint
for source dashboard UI strings despite the local-only work boundary. That
draft was removed; Urdu was subsequently rebuilt with locally authored copy
and no translation service. The transmitted content was bundled English UI
copy, not saved rules or user data. Translation provenance for every catalog
remains a release-review item; structural parity alone cannot establish it.

`js/ui_localization.js` remains a bundled, local-only lookup/apply kernel.
Its released list contains English only; explicit preview selection loads a
staged catalog. It uses `textContent` and allowlisted attributes, and the
dashboard captures source-owned static DOM copy before controllers insert user
data. The playback overlay loads translated labels asynchronously after the
admission decision, so translation does not delay or alter rule enforcement.
Its local catalog files are web-accessible to the relevant YouTube and Google
frames in all four manifests.

The Settings selector and device-local preference are wired for previews and
completed locales. Browser-language auto-selection uses only released locales;
an incomplete preview is activated only by an explicit user selection. A
target-name metadata failure no longer hides the selector.
The popup reads the same saved preference. This is not sufficient to release
a second language until dynamic UI, manifests, release notes, accessibility,
and installed-browser flows pass the coverage gate.
Early UI rendering now waits harmlessly for the English source catalog, and
rapid language changes retain the latest selection even when older catalog
fetches or preference writes finish later.

A bounded dynamic-copy pass now localizes Main/Kids category and spoken-language
filter mode options and summaries, popup enabled/disabled and time labels,
popup Blocklist/Whitelist mode names, and profile-access/PIN prompt copy with
exact catalog keys. These changes do not translate saved rule values or alter
filter decisions. Other generated PIN, import, device, and toast copy
still needs source-key migration and translation.
The popup's managed-time countdown, compact time format, self-control labels,
and related tooltips now use separate localized templates with preserved
numeric/profile placeholders; the old English `" left"` string removal is gone.

All four manifests now resolve their extension name and description through
`_locales/en/messages.json` with English as `default_locale`. Browser metadata
drafts cover 25 of the 37 non-English targets in 26 supported locale folders;
generic Portuguese uses `pt_BR` and `pt_PT`, and Simplified Chinese uses
`zh_CN`. The other 12 targets keep an English browser-label fallback rather
than being mislabeled as another language or dialect. The build now packages
`_locales` in Chrome, Firefox, and Opera archives. Chrome's native `_locales`
list does not cover every custom in-extension target locale, so
browser-provided identity and the 38-language in-extension selector have
separate coverage/QA gates ([Chrome i18n locale support](https://developer.chrome.com/docs/extensions/reference/api/i18n)).

Every non-English target has a bundled draft of the current 3.3.7 What's New
copy. The dashboard and release banner select localized fields when available;
the source release version, URL, and highlight order remain authoritative.
Older release entries still need coverage and review.

`npm run check:ui-locales` checks every present locale catalog against the
English keys, placeholders, protected product terms, and markup restrictions,
plus the current release-note draft. `--require-all-static` is the strict gate
for all 37 translated dashboard catalogs; it now passes. This is a structural check, not a claim
of fluent translation or complete UI coverage. Locale selection preserves
exact language-script/region matches when catalogs are eventually released,
then falls back to a base-language catalog or English. The target list is now
fixed; translation accuracy, full UI coverage, and installed-browser review
remain open before a 38-language release can be declared complete.

`npm run check:ui-locales:targets` confirms all 38 target catalogs exist and
their present entries are structurally valid; it no longer mistakes staged
catalogs for complete ones. `node scripts/check-ui-locales.mjs
--require-locale=ru` requires Russian to match every current English key.
The first six popup strings are kept in
`data/ui_locales/batches/popup-rule-inputs.json`; another twelve category and
language filter controls are in
`data/ui_locales/batches/popup-filter-controls.json`. They are mechanically
merged into the per-locale catalogs; the checker also verifies that those copies
still match the translated batch. The popup applies translations after its
dynamic controls have been created, avoiding an initial render race. This is
still only one prerequisite: it cannot
certify all extension strings have been extracted, that translations are
accurate, or that RTL/long-text layouts have been tested.

`npm run audit:ui-copy` now inventories unkeyed literal text and accessible
attributes in the popup and dashboard HTML, with file/line examples. The
corresponding `audit:ui-copy:complete` gate fails while any are left. The
first run found 1,324 fragments in `html/tab-view.html` and one in
`html/popup.html` (its title). A later heuristic pass also reports literal
assignments in the main popup/dashboard renderers, but does not fully parse
template strings, dynamic expressions, JSX, release notes, manifests, or real
browser rendering. The count remains a lower bound, not proof that the whole
interface is translated.
The first popup control batch adds six translated keyword/channel search,
add, and empty-state messages to every target catalog. A second batch adds
twelve category/language filter controls. The popup now repeats
the localization pass after its dynamically constructed controls exist.
Remaining dynamic category, language, content-control, profile, PIN, and
feedback copy still requires extraction, translation, and render-path wiring.
Do not infer popup completion from these batches.

## 2026-09-29 dynamic-copy checkpoint

The English keyed source now contains 339 strings: the previous 174 plus 47
popup, 85 dashboard/profile/PIN/import, and 33 Main/Kids rule-renderer strings.
The new code paths preserve rule values, channel names, IDs, dates, profile
names, and YouTube tab titles as data. Rule-list labels and accessible text
refresh when the selected interface locale changes. Direct-video admission
copy and its RTL direction are presentation-only changes; the filtering
decision and playback timing are not localized.

All 37 non-English catalogs now contain the additional 165 keys with English
key and placeholder parity. The strict all-locale and static-copy structural
gate passes. This does not certify translation quality, runtime coverage, or
release readiness. A source-key test
ensures that every keyed popup/dashboard/renderer reference has English copy.
The dashboard also mirrors its mobile navigation button, success toast, and
help-flow arrow for RTL previews; installed-browser visual review is still
required.

The remaining runtime-copy audit found untranslated rule-list editor tabs,
row actions, invalid-entry errors, date-limit editor, profile management,
family-device command center, direct Watch quick-block menus, import reports,
protected history, and first-run refresh prompt. These are generated after
the static dashboard capture and require explicit localization. Import result
counts and plural forms also remain. None of the 37 previews may be renamed
or auto-selected as a completed language while these surfaces remain.

The current 3.3.7 What's New entry has a draft in every target locale.
The 27 older releases (3.3.6 through 3.1.0) remain English in the dashboard;
at this checkpoint the dashboard fell back silently. The current-version banner has
localized copy but will also fall back to English if a future release omits
its localized entry. A future pass must give historical English-source cards
an explicit localized label or translate the complete history. Preserve every
card and canonical release URL; never silently imply the English copy was
translated.

Fluent-speaker review, RTL/long-text and keyboard/screen-reader QA, and
Chrome/Firefox/Opera installed-extension verification remain required.
The UI-copy audit is a lower-bound inventory, not a completion score.

## Follow-on runtime inventory (2026-09-29)

The next audit found substantially more generated copy than the 339-key
checkpoint captured. The English catalog reached 610 keys in the core pass. New bounded source
maps cover 80 rule-editor strings, 167 core family-control strings, and 18
on-page quick-block/fallback-menu strings. The one-time refresh prompt has five
keys, and historical What's New cards can explicitly identify English-source
copy. These keys are not a claim that all target catalogs have translations:
the 37-language parity gate must pass again after their translation batches
are merged.

The family command center alone contained 157 further generated English
fallback strings outside the 167-key core tranche; these have since been
extracted into a separate English source batch, bringing that catalog to 767
keys. The deferred batch includes provider help,
bulk-selection explanations, trust/channel details, and status histories.
The 80-key rule-editor, 24-key on-page/refresh/source-label, 167-key core
family, and 157-key deferred family batches have now been merged across all
38 catalogs. Each target has 767 of 767 English keys, and the strict catalog
and dashboard-static checks pass. This proves key/placeholder coverage, not
fluent translation quality or complete runtime UI coverage. Arabic variants
in the deferred family batch currently share Modern Standard Arabic phrasing.

A source audit at the 767-key checkpoint found unkeyed generated dashboard
copy, especially toast messages and import/report views; content category and
spoken-language labels also remained English. These became distinct follow-on
localization tranches. The
follow-on renderer now marks untranslated historical What's New cards as
English source; that is an explicit fallback policy, not a translation of
their text. Keep every non-English choice labeled as a preview until the
remaining generated surfaces and fluent-speaker/RTL/installed-browser review
have passed.

## Generated-control follow-on checkpoint (2026-09-29)

The Kids rule editor and both channel-source selectors now localize their
generated headings, options, counts, and help labels. Renderer collaboration,
imported-source, and channel-mapping copy is keyed. Category names have
localized display labels while their existing English selection IDs remain
unchanged; spoken-language names use the browser's `Intl.DisplayNames` for the
selected interface locale with an English fallback. Import-report modal copy
and its fixed failure reasons now use stable reason codes plus translated
display strings, without changing the readable English reason returned by
the report API. The generated family-control view also rerenders when the
interface locale changes.

Across these bounded surfaces, all 38 catalogs now have 873/873 keyed strings;
the strict catalog and 1,135-fragment dashboard-static checks pass. This is
catalog parity, not a claim that the entire extension is translated. The
source audit still finds many unkeyed dynamic dashboard messages (including
roughly 266 literal toast callsites in `js/tab-view.js`), and 27 older What's
New entries remain English with an explicit English-source badge. Native
speaker review, RTL/long-text and accessibility QA, and installed-browser
verification remain release gates. The broad repository smoke lane currently
has unrelated source/audit-snapshot failures in the dirty playback worktree;
use the focused localization tests and strict catalog check for this
checkpoint's source-level verification.

## Coverage audit checkpoint (2026-09-29)

Live reruns of `node scripts/check-ui-locales.mjs` report 1,477/1,477 keyed
catalog entries in all 38 target catalogs and 1,135/1,135 static dashboard
fragments in every non-English catalog. The same checker confirms the current
3.3.7 release-note draft for all 37 non-English targets. A separate
`node scripts/check-release-note-locales.mjs --require-all` now validates 28/28
release entries in all 37 non-English targets.
These are structural checks, not fluency or whole-extension coverage: the UI
checker explicitly disclaims full coverage and translation quality.

The release/runtime gate remains English-only: `js/ui_localization.js` lists
only `en` as released, so all 37 non-English targets remain preview-only and
browser-language `auto` falls back to English. The read-only runtime audit
also found unkeyed safety-relevant managed-viewing and daily-time-limit
overlays in `js/content/bridge_settings.js:827-1412`; `auto` is not resolved
before locale validation in the admission and first-run overlays
(`js/content/admission_overlay.js:54-69`,
`js/content/first_run_prompt.js:12-23`); and substantial generated Nanah,
managed-link policy, self-control, and list-mode copy remains unkeyed in
`js/tab-view.js:13737-13751,15085-15454,15841-16254,17949-18054,18391-18883,22470-22630,26195-27136,28291-28320`.
Injected channel-menu progress and error states also bypass localization in
`js/content_bridge.js:13771-13971,14619-14801` at this audit checkpoint;
their source and catalog wiring is being addressed separately. The popup's
list-mode tooltip was localized in `5a6f6c8f`. Browser name/description messages
are English-only in `_locales/en/messages.json`; 12 target tags have no
matching browser locale directory (`ur, pcm, arz, ha, pa-Arab, yue-Hant,
wuu-Hans, jv, apc, apd, yo, bho`).

Catalog parity does not guarantee translated values: a local exact-string
audit found 20 Pidgin (`pcm`) catalog entries of at least 60 characters still
identical to English, including full UI sentences. These and fluent-speaker,
RTL, accessibility, and installed-browser reviews remain open. The previously
disclosed Urdu draft used a public translation endpoint on bundled English UI
copy only; no saved rules, user data, or secrets were transmitted, and that
draft was removed and rebuilt locally. During the subsequent 2026-09-29
translation batch, a subagent separately tested only the generic phrase
`Add to {count} profiles` with `translate.googleapis.com/translate_a/single`
for Korean before being stopped. No batch, saved rule, or user data was sent,
and that result was not used as a translation source. No network was used for
the coverage audit itself or for the remaining drafts.
