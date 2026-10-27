# FilterTube 3.4.2 preview — October 27, 2026

## Release decision and scope

The user authorized documenting the remaining work, committing it and creating
a GitHub release, then explicitly requested accurate release notes/changelog.
The prior public stable release is v3.4.1 at
`885aa4939e3ba674693fdfb57384c4f97ebe1922`. The working tree was clean at
`45eb7ed6`; the earlier implementation and website changes were already committed.

Publish v3.4.2 as a **GitHub prerelease**, keeping v3.4.1 as stable/latest.
Open installed/device and broad-suite gates prevent describing this checkpoint
as a completed stable release. The preview packages use manifest/package version
3.4.2. No older tag or published asset is replaced.

This release contains Chrome, Firefox and Opera extension ZIPs and SHA-256
checksums. It adds no mobile APK/AAB, native runtime sync, browser-store
submission or issue closure. No manual website deployment is invoked; any
repository deployment hooks are separate from GitHub release publication.

## What changed and where the evidence lives

The complete user-facing changes are in [CHANGELOG.md](../CHANGELOG.md).
The dashboard/update notice uses [data/release_notes.json](../data/release_notes.json).
Canonical release links remain source-owned; translation catalogs cannot replace
them. Previous 3.4.1/3.4.0 notes and translations remain available.

The new 3.4.2 notes use the dashboard's existing, visibly labelled English-source
fallback in non-English locales. The banner likewise falls back to the canonical
English entry. The configured small-task helper exhausted its available routes;
a separate Qwen 27B draft attempt returned two candidates and then timed out.
Incomplete/unreviewed candidates were excluded, not copied into the catalogs or
counted as completed translations. All 37 historical translation catalogs remain
unchanged. `check:ui-locales:targets`, `check:release-note-locales:complete` and
the current-release translation assertion therefore remain failing preview gates.
These gates must pass before promotion to a fully localized stable release.

| Area | Implementation/evidence record |
| --- | --- |
| Full source changes since the stable tag | [Post-885aa49 inventory](audit/POST_885AA49_CHANGELOG_2026-10-25.md) |
| Accounts and verified personal/parent Auto-sync | [Auto-sync contract](design/device-sync/AUTO-SYNC-2026-10-24.md), [installed checklist](NANAH_MANAGED_LINK_QA.md) |
| User-facing P2P/permissions/transport guidance | [Nanah guide](NANAH_USER_GUIDE.md), [concerns tracker](NANAH_POST_IMPLEMENTATION_CONCERNS_TRACKER.md) |
| Filtering issues and Firefox Android evidence | [Issue review](audit/ISSUE_REVIEW_69_75_76_77_79_80_81_2026-10-17.md), [follow-up](audit/ISSUE_ACCEPTANCE_FOLLOWUP_2026-10-18.md), [installed #79 acceptance](audit/FIREFOX_ANDROID_79_INSTALLED_ACCEPTANCE_2026-10-18.md) |
| Playback, Notes, time accounting and preference reset | [Controls hardening](audit/TIME_LIMITS_AUTOPLAY_RESET_IMPLEMENTATION_2026-10-25.md), [feature inventory](audit/EXTENSION_FEATURE_INVENTORY_2026-10-25.md) |
| Website design, screenshots and platform status | [Website rationale](audit/WEBSITE_SIMPLIFICATION_2026-10-25.md), [design source](../website/DESIGN.md) |
| README and Nanah documentation changes | [Documentation refresh](audit/README_SYNC_DOCS_REFRESH_2026-10-26.md) |

## Remaining work — not closed by publication

| Area | Remaining acceptance or implementation |
| --- | --- |
| Installed personal sync | Pair two disposable installed browser profiles, compare phrases, approve the personal link on both sides and verify receiver storage for settings, rules and per-video Notes. Reload alone was not pairing. |
| Offline/restart recovery | Change data offline, close/reopen the dashboard, reconnect verified peers, inspect pending/received/applied states, duplicate handling and acknowledgments. Direct transfer needs both pages open and connected; no closed-browser-online guarantee. |
| Trust and consent | Test wrong phrase, revoked trust, disabled Auto-sync, changed selected areas, removed/locked profiles and reconnect. Saving trust must not create Auto-sync consent. |
| Parent/child rules | Test named parent-to-child targets, parent ownership, changed grants/PIN protection and delayed queued updates. Child switching PINs must never grant settings or device administration. |
| Sync conflicts/notes | Exercise concurrent edits, distinct videos/profiles, note deletions/conflicts, storage failure and retry on installed peers. Do not silently widen managed parent scopes to child preferences/Notes. |
| Network/provider delivery | Test restrictive NAT/firewalls and distinct networks. No configured TURN or universal connectivity is claimed. Home Pickup is a trusted signed-policy service; Internet Pickup uses encrypted envelopes. Neither proves personal Auto-sync background delivery. |
| Installed reset | Review/cancel/apply on disposable ordinary and parent-selected child profiles, stale review/authority, enabled Settings Auto-sync impact and keyboard/screen-reader focus. Confirm rules, modes, restrictions, Notes, PINs, trust and time limits survive. |
| Time limits | Installed worker restart, simultaneous tabs, foreground/background, storage failure and exhausted-state acceptance. Local profile/day budgets are not a pooled cross-device quota or trusted-clock policy. |
| Playback | More actual playlist/Shorts/embed cases, alternate-language audio, captions and fallback; keep intentional pauses and parent admission intact. Streaming/native-source paths can break when the upstream service changes. |
| #75 and #76 | Obtain the reporter's exact rules, selected-video metadata/renderer capture and reproduce the false block/Search/redirect on the reported browser/OS. No blanket resolved claim. |
| #79 | Emulator import/render/navigation evidence exists. Physical reporter device, installed pre-fix comparison, exact placeholder timing and all allow-only/network conditions are not established. |
| #80 | Import the compatibility export into installed BlockTube, save/reopen and inspect omissions. Full FilterTube backups remain separate; no universal settings portability. |
| #69, #77, #81 | Remaining Helium/playlist and Firefox/macOS transition acceptance; physical/native minimum-view adoption and unsupported localized view-count formats. |
| Concurrent-save race | Investigate the separate source-level race noted in the Firefox Android acceptance record; the category deadline fix does not establish that this race is repaired. |
| Broad tests | Retain and triage historical Settings/filtering/audit failures. Fresh passing release/smoke lanes are narrower evidence, not a waiver of the broad backlog. Exact failed titles/counts are in the release validation receipt. |
| Native adoption | Coordinate generated runtime ownership and test Android/iOS/TV deliberately. Later Android development adoption is distinct from public Play availability and actual extension-to-app acceptance. Do not rebuild or overwrite another chat's app tree. |
| iOS | Native signature-solver simulator crash investigation, playback/device acceptance, developer enrollment/payment and public TestFlight/App Store availability remain separate. Existing simulator screenshots are UI previews only. |
| Android/TV/offline/ML | Phone/tablet Play app is public; TV release and Fire TV support remain separate. Local-file playback is not proof of complete online offline-save/caption/audio parity. Local ML remains research. |
| Media/UI | Fresh native Kids, tablet and TV screenshots; current iOS parity captures; wider accessibility, reduced motion and installed responsive-layout review. Current development screenshots do not prove store parity. |
| Localization | Translate the new 3.4.2 release entry in all 37 non-English catalogs, review the candidates with fluent speakers, and translate/review newer English-fallback UI copy. The preview uses the labelled English fallback; structural validation is not language-quality approval. |
| Distribution/support | Browser-store submissions, store descriptions, issue replies/closures and mobile binary releases require separate work; none is performed by this preview. Public Android guidance remains: install from Google Play, no invitation or email needed. |

## Fresh validation and packaging

Results are recorded in
[the machine-readable receipt](audit/artifacts/release-preparation-2026-10-27/validation.json).
Package checksums are supplied with the GitHub assets. Build outputs and local
test logs remain separate from installed-device or store approval.

| Fresh check | Result |
| --- | --- |
| Release lane | 742 passed, 0 failed |
| Smoke lane | 1,482 passed, 0 failed |
| Focused sync/Notes/time/reset production-module fixtures | 244 passed, 0 failed |
| Chrome/Firefox/Opera build and full package parity | 248 entries per ZIP; source/staged/archive bytes match, manifests match semantically |
| Website production build | Pass |
| Firefox ZIP linter | 0 errors, 28 warnings, 0 notices; warnings retained in the receipt |
| Settings lane | 1,159 passed, 96 failed |
| Blocking / Whitelist | 586/599 passed; 452/487 passed |
| JSON / DOM | 1,163/1,294 passed; 405/457 passed |
| Menu / Performance | 89/108 passed; 901/945 passed |
| Strict locale completeness/current-release translation assertion | Fail; new 3.4.2 notes use labelled English fallback |

The isolated task-start snapshot supplies a failed-title comparison, with its
missing built outputs and sibling-native environment stated in the receipt.
The only newly failing broad-lane title is the Russian current-release
translation check; it is an explicit preview gap. Baseline failures disappearing
under different package/native environments are not claimed as product fixes.
No runtime source was edited during this release preparation. Installed gates
above remain open regardless of these local test counts.

At task start, release was 741/742 and smoke 1,481/1,482. Both failed because the
previous README validation JSON was missing from the test path classifier. The
registration repair is commit `6e89c0be`; its existing classifier checks pass
10/10. Remaining broad failures must be compared by title against the unchanged
task-start logs, not hidden by changing release labels or weakening assertions.

Release-note extraction checks are updated to inspect 3.4.2's real contents and
its 3.4.1 predecessor while retaining a separate historical 3.4.1 check. This
avoids requiring obsolete 3.4.1 prose inside a new release.

## Publication verification

The release is created as a draft, uploaded assets are checked against local
hashes/metadata and the exact committed tag, then it is published as a prerelease.
The public release URL is
[v3.4.2](https://github.com/varshneydevansh/FilterTube/releases/tag/v3.4.2).
Consult its actual GitHub visibility and the validation receipt for completion;
this document's preparation text alone is not evidence that publishing succeeded.
