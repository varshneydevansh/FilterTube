# BlockTube export compatibility

Issue #80 concerns exporting **from FilterTube into BlockTube**. FilterTube's complete backup format is intentionally unchanged. BlockTube's importer requires root `filterData` and `options` objects; it silently ignores a FilterTube v3 backup without them.

The separate compatibility export targets BlockTube 0.4.8, upstream commit [`d8a1bdba062ab603726b0ac3ea06c229d61fd710`](https://github.com/amitbl/blocktube/tree/d8a1bdba062ab603726b0ac3ea06c229d61fd710). A file represents exactly one selected FilterTube profile and either its Main YouTube or YouTube Kids rules. Profiles and rule spaces are never flattened together. Keep a complete FilterTube backup to retain the full configuration.

## IO API and review

`FilterTubeIO.previewBlockTubeExport({ profileId, surface, auth })` returns a report containing `profileId`, `profileName`, `surface`, `counts`, `unsupported`, `warnings`, `canExport`, and `reviewToken`. `surface` must be `main` or `kids`.

After displaying that report, call `FilterTubeIO.exportBlockTube({ profileId, surface, auth, reviewToken, acceptUnsupported })`. It returns `{ payload, report }` for the download. The token is mandatory; omitted items additionally require `acceptUnsupported: true`. Do not offer the download if `canExport` is false. Whitelist mode, unknown modes, and selections without any convertible rules or enabled supported options are blocked.

Both calls read current persisted profiles. The active actor must be an adult managing the selected profile: its own account, its child, or Master. A configured actor PIN is verified on every call using `auth.localMasterPin` for Master or `auth.localProfilePin` for another account. The child's switching PIN never authorizes a parent export. After asynchronous PIN verification and digest calculation, actor identity/type, selected ownership/type, actor verifier, and the selected profile snapshot are checked again. Changing the reviewed rules or actor invalidates the token. The API does not write storage or download files itself.

The dashboard must show BlockTube's replacement warning: importing this file replaces BlockTube's rules and settings, including its options-page password. Back up BlockTube first and configure its password again after import. Upstream `populateForms` defaults the receiving password field to empty and `saveForm` saves it, so omitting `uiPass` would not preserve it either. No FilterTube PIN is substituted for that password.

## Field mapping

| FilterTube data | BlockTube field |
| --- | --- |
| Canonical blocked channel IDs, including known alternate IDs | `filterData.channelId` |
| Blocked video IDs | `filterData.videoId` |
| Explicit title keywords; ordinary unscoped keywords | `filterData.title` |
| Explicit channel-name keywords; imported BlockTube channel-name rules | `filterData.channelName` |
| Explicit comment keywords; keywords with comment matching enabled | `filterData.comment` |
| A channel's active `filterAll` rule | Derived title keyword and, when enabled, comment keyword |
| Main `hideShorts`, `hideMixPlaylists`, `hideExploreTrending` | `options.shorts`, `mixes`, `trending` |

Literal keywords become escaped regular expressions so BlockTube's default boundary matching does not turn substring rules into whole-word rules. Exact literals use FilterTube's Unicode letter/number/underscore boundaries. Non-ASCII text is retained; slashes and embedded line breaks are escaped for BlockTube's line-based editors. Valid non-stateful regex patterns retain their flags. Imported BlockTube channel-name rules retain their original boundary/regex syntax, including case-sensitive flagless regexes. Channel-derived keywords are regenerated from current active channels instead of exporting stale derived rows.

## Deliberate limits

The report lists unsupported constraints and settings before a file can be produced. These include allow rules, whitelist mode, date or semantic keyword constraints, invalid/stateful regexes, paused rows, unresolved handles/custom URLs without a channel ID, collaboration metadata, subscriptions, duration/date/category/language controls, parental access/time policies, disabled filtering, and unmapped enabled options. A conditional keyword is omitted entirely rather than broadening it by dropping its condition. Main export does not silently merge Kids rules when `syncKidsToMain` is enabled.

BlockTube cannot retain profile identities, protected-profile authority, separate Kids protection, device trust, signing keys, PIN verifiers, or history. These never enter the portable payload. It also matches some playlist/chat fields, while FilterTube can inspect descriptions and different renderer metadata; the report makes this coverage difference explicit. This is a compatible rule copy, not a claim that both extensions make identical decisions on every YouTube surface.

## Evidence

`tests/runtime/blocktube-compatible-export-current-behavior.test.mjs` executes unmodified pinned upstream `importOptions`, `populateForms`, `saveForm`, and the background rule compiler. The test fixtures retain their upstream GPL-3.0-only license and provenance; none of that upstream code is included in the FilterTube runtime exporter.

Tests cover multilingual fields, regex/literal boundaries, slashes/newlines, IDs, channel-derived rules, selected profile/Main/Kids isolation, unsupported-item review, actual parent PIN verification, missing/wrong authority, in-flight actor/owner/verifier/rules changes, and zero storage writes. This is production-function compatibility evidence; installed BlockTube UI and live YouTube filtering remain separate acceptance checks.
