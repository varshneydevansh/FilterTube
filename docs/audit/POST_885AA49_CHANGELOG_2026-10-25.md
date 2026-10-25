# Changes since the supplied release baseline `885aa49`

Comparison baseline: `885aa4939e3ba674693fdfb57384c4f97ebe1922`. This document treats it as the user-supplied release checkpoint, not independent proof of which browser store or device received it. The completed extension work through `7a476d57` contains **39 commits**. The website simplification in this task is documented separately below and in [the design/change record](WEBSITE_SIMPLIFICATION_2026-10-25.md).

## What users gain after the baseline

| Area | Change and reason | Scope / remaining proof |
| --- | --- | --- |
| Accounts & Sync | Device-first selection, staged code/QR pairing and clearer verification. Reduce competing entry points while retaining profile scopes and advanced connection paths. | Extension candidate. Nearby discovery never grants trust. Installed pairing remains pending. |
| Opt-in Auto-sync | Queue supported settings/filter changes and per-video Notes for approved personal links; send approved parent-to-child policy updates. Revalidate grants and persist concurrent receiver updates safely. | New extension preview, not yet a public store release. Both dashboards must be open/connected for direct transfer. Android development adoption is now reported by its owner; fresh physical live reconnect remains open. Offline fixture checks are not installed-network proof. |
| Protected profiles | Preserve parent authority, child editing restrictions, profile ownership and local PIN/device permissions through pairing, sync and resets. | Shared policy/fixture evidence; actual paired-device and restart gates remain. |
| Video Notes | Private profile-scoped notes keyed by video, a Watch action-row button, corrected SPA access, readable modal and visible editor header. | Extension preview. Actual Watch dialog checks were recorded; native sync adoption remains separate. |
| Playback and adverts | Filter advert fields on response paths, preserve streamed get_watch delivery, bound the old fallback, add guarded main-content source planning, then retain YouTube’s native controls and retire competing desktop Void playback. | Platform-specific paths. No permanent compatibility or universal advert-free guarantee. New extraction/handoff is guarded by current admission, audio/caption and profile checks. |
| Autoplay | Defer automatic source replacement until actual native playback intent; retain explicit pauses and permitted playlist endpoints when decorative end-screen UI is hidden. | Latest actual Chrome playlist and caption checks are recorded; alternate-language audio and all platforms were not exhaustively tested. |
| Time limits | Serialize shared ledger writes, preserve fractional time, verify persistence, reconcile ambiguous saves, invalidate stale policy work and retain exhaustion on messaging failures. | Per installation/profile/day, device clock, roughly five-second heartbeat. No pooled cross-device budget or trusted-clock guarantee. Installed worker restart remains open. |
| Restore preferences | Review 32 ordinary display/playback defaults for the named profile; preserve rules, restrictions, Notes, PINs, trust and time limits. Show enabled Settings Auto-sync impact and require fresh authority. | New extension preview. Installed reset on disposable parent/child profiles remains pending. |
| Minimum views | Optional minimum-view filters for Main and Kids. | New extension update; hidden-view-count behavior and platform support follow the runtime contracts, not an inference that every video has a reliable count. |
| BlockTube interoperability | Reviewed, separate BlockTube-compatible export from one profile and rule space, with unsupported-field reporting. Preserve native backup/import formats. | Conversion does not promise full FilterTube profile, PIN, time or device-trust portability. |
| Filtering corrections | Modern comment/thread scope, explicit channel shelf ownership, delayed initialization with current settings, pending category cards and selected playlist rows. | Reporter-specific false blocking remains a separate acceptance gate. Historical broad-suite failures remain. |
| Responsive extension UI | Repair Settings/pairing layout and popup intrinsic sizing. | Source/build and recorded installed popup evidence are distinct. |
| Android installation | Public Google Play links replace invitation/email-based install guidance. Keep the complete Play app distinct from a simpler direct APK. | Android is public. TV is not covered by the phone/tablet listing. iOS distribution is pending enrollment. |
| Firefox Android investigation | Added isolated installed-browser setup and issue #79 acceptance evidence. | See the issue review and installed Firefox artifact for exact coverage. Do not convert one reproduction result into every import/device being fixed. |
| Documentation and gates | Source-aware regression registration, lexical inventory refresh, bounded race models, package evidence and explicit installed-device/provider/native gaps. | Audit freshness is not completion of all semantic proof or release approval. Nothing in this history alone proves a push, store submission or deployment. |

## Validation and unresolved gates

The latest extension hardening checkpoint passed 322 focused checks, 742 release checks and 1,482 smoke checks. Its Settings lane retained the same 95 failing titles as baseline. Other broad lanes also retained historical failures without new failing titles after intentional contract/source updates. This is the recorded result at that checkpoint, not a fresh installed-device result of the website task.

- [Controls implementation and evidence](TIME_LIMITS_AUTOPLAY_RESET_IMPLEMENTATION_2026-10-25.md)
- [Issue review and reporter/device gates](ISSUE_REVIEW_69_75_76_77_79_80_81_2026-10-17.md)
- [Auto-sync evidence and remaining installed gates](artifacts/controls-hardening-2026-10-25/validation.json)

Do not release on the basis of the website copy. Still required: installed two-device pairing/offline reconnect, installed reset on disposable profiles, time-limit restart/multiple-tab acceptance, native release/adoption validation, remaining reporter-specific validation and the broader release backlog. Keep publication and provider/device evidence separate from source and package results.

## Website changes introduced by this task

- Preserve the original scenic hero, headlines, artwork, fonts, header/footer composition and browser rail. Change the hero's repeated availability paragraph into a concise verified P2P ownership message.
- Make Android and iOS primary navigation choices; keep the extension clearly supported with its own overview. Android combines phone/tablet with labelled Android TV development; iOS combines iPhone/iPad. All nine legacy platform URLs remain available without deleting route records.
- Merge the duplicate setup sequence into one guide at the preserved `#system` anchor. Retain troubleshooting and all thirteen original detailed features in native disclosures; add eight missing feature explanations with platform/status boundaries.
- Expand Android around actual viewing, filtering, family, device-sharing and development features. Add the existing app demo. Owner replies correct the earlier main-checkout inventory: newer Android work includes Notes and personal Auto-sync, but does not establish that each capability is in the current Play release. TV is a tested development build with narrower acceptance.
- Retain the independent funding story in the footer, replacing its competing early card with an extension overview. Remove the duplicate Google Play action and put speculative distribution plans behind secondary details.
- Clarify local rules versus signaling, encrypted relay and optional encrypted pickup. Remove the absolute no-data-anywhere metadata claim; keep local ML in research language.
- No extension filtering runtime, native source, store listing, version, release note or deployment was changed. See [the full rationale, owner replies and validation](WEBSITE_SIMPLIFICATION_2026-10-25.md).

## Commit-by-commit source inventory through `7a476d57`

The subjects below are a navigation index. The earlier sections explain behavior and evidence limits. [Machine-readable inventory with changed files](artifacts/website-simplification-2026-10-25/post-release-commit-inventory.json).

| Commit | Date | Change |
| --- | --- | --- |
| `3ac78426` | 2026-10-17 | Simplify account and device sync while preserving parent authority |
| `65ff48b3` | 2026-10-17 | Point Android install links at the public Google Play listing |
| `608589b7` | 2026-10-17 | Add reviewed BlockTube-compatible exports for one profile and rule space |
| `88e9e8a3` | 2026-10-17 | Add optional minimum-view filters to Main and Kids |
| `6baedc40` | 2026-10-17 | Apply explicit channel shelf identity to ownerless video cards |
| `7192109f` | 2026-10-17 | Keep delayed DOM initialization on the current settings snapshot |
| `53a014d0` | 2026-10-17 | Filter modern comments without hiding unrelated parent threads |
| `21088534` | 2026-10-17 | Document issue checkpoints, bounded race models and remaining acceptance gates |
| `920ec56b` | 2026-10-17 | Fix responsive Settings, pairing fields and popup sizing |
| `f20861a7` | 2026-10-18 | Fix pending category cards, comment scope and selected playlist rows |
| `71e1e6dd` | 2026-10-18 | Repair source-aware regression and release audit gates |
| `b554be92` | 2026-10-18 | Record Firefox Android acceptance setup and control blocker |
| `14f08c4b` | 2026-10-18 | Record installed Firefox Android issue 79 acceptance and remaining gates |
| `80871f05` | 2026-10-22 | Restore advert-only startup and filter sponsored YouTube response content |
| `54d1396a` | 2026-10-22 | Register advert regressions and refresh affected audit evidence |
| `855bb754` | 2026-10-22 | Fix toolbar popup intrinsic sizing without viewport feedback |
| `9b1dcaee` | 2026-10-22 | Preserve streamed get_watch player delivery while filtering adverts |
| `3a441cc2` | 2026-10-22 | Register popup and streaming checks and refresh runtime audit records |
| `8ed0e935` | 2026-10-22 | Bind advert fallback duration to current video and bound seek retries |
| `a4ae9e90` | 2026-10-22 | Record installed streaming backoff and independent content playback gates |
| `007e6bdf` | 2026-10-22 | Bind owned playback to current profile admission and revoke stale permissions |
| `57051da9` | 2026-10-22 | Add opt-in content player with bounded source planning and caption-safe fallback |
| `f255f5a2` | 2026-10-22 | Record content playback validation and preserve installed resolver gates |
| `efe8312a` | 2026-10-22 | Implement guarded native YouTube content-source refresh |
| `d7389f8f` | 2026-10-23 | Automate native playback without interrupting healthy videos |
| `096a18e9` | 2026-10-23 | Retire competing Void playback on desktop watch pages |
| `f28b7447` | 2026-10-23 | Add private profile-scoped Watch notes and action-row controls |
| `a4a363a9` | 2026-10-23 | Fix Notes SPA access and open a readable modal editor |
| `e2aa2e55` | 2026-10-23 | Verify installed Watch notes and keep its dialog header visible |
| `4154e387` | 2026-10-24 | Add opt-in verified-device auto-sync and staged pairing |
| `3882556f` | 2026-10-24 | Document auto-sync evidence and installed-device acceptance gates |
| `660f6fd6` | 2026-10-24 | Harden auto-sync persistence and concurrent receiver updates |
| `c6c75588` | 2026-10-24 | Record two-endpoint sync evidence and remaining installed gates |
| `eef89f60` | 2026-10-25 | Highlight peer-to-peer syncing in extension and project copy |
| `29eb7b5b` | 2026-10-25 | Document time-limit defects and reset/autoplay decisions |
| `e40c67b4` | 2026-10-25 | Fix managed time accounting and retain exhausted locks on failed heartbeats |
| `cf743d70` | 2026-10-25 | Preserve native autoplay intent and permitted playlist navigation |
| `45c6d235` | 2026-10-25 | Add reviewed profile preference reset with parent and sync safeguards |
| `7a476d57` | 2026-10-25 | Record controls hardening validation and reconcile source audit inventories |


## Website feature-inventory follow-up

After the earlier website checkpoint, the user requested real app-screen review
and an extension feature inventory. The authorized update adds grouped Android
and extension feature exploration, three labelled Android development screenshots,
and direct links to the existing P2P guide while preserving the original hero,
scenic design, feature titles and routes. It also corrects two stale extension
Help messages about Notes sync/backups and background migration enrichment.

See [the website follow-up rationale](WEBSITE_SIMPLIFICATION_2026-10-25.md) and
[the extension inventory](EXTENSION_FEATURE_INVENTORY_2026-10-25.md). Public store
rollout, native interoperability and physical-device release gates remain
separate from these local website and copy changes.

The feature-inventory follow-up passed website production build, 742 release checks, 1,482 smoke checks, and 18 focused website inventory checks. Six broader filtering lanes still fail; baseline comparison found no newly failing test names. Full extension release acceptance remains open, and nothing was pushed or deployed. See the website validation receipt for counts and comparison limits.

## App hero and Kids refinement after `2b3d30bb`

Android/iOS hero logos become interactive stacks of three genuine development
screens. Android retains green, iOS uses blue, and Kids retains pink. A silent
original fframes Android background loop includes reproducible source and a
poster; background motion has pause and reduced-motion handling. Kids explains
specific parent choices, limits and platform availability. All existing routes
and unique feature information remain. The native signature-solver simulator
crash is documented separately and remains unresolved; this website update does
not claim native playback repair or public iOS distribution.

## Website wording after `768d8755`

Removed repeated underlying-service naming from authored site copy and metadata
at the user's request. Main, Kids, Music and videos provide the context. Demo and
support links, genuine media, installation choices and all feature/availability
information remain. Privacy and Terms preserve third-party ownership and data
boundaries. No extension or native application behavior changes.

## Extension screenshots and moving showcases after `f850048d`

A distinct purple extension hero shows three genuine popup captures. Six supplied
desktop screenshots form its moving showcase; the Android gallery now moves too.
Both offer pause/play, adjacent navigation, touch scrolling and reduced-motion
handling. Shared platform labels and intrinsic image dimensions prepare for later
phone/tablet/TV media without claiming availability or parity. Existing hero,
features and download routes remain. Source and evidence are documented in the
website refinement record; nothing is deployed by a local commit.

## Full-width Android and extension rails after `0ff5e465`

Corrected the moving showcases after the user's clipping/repetition report and
live comparison with Flow. Both rails now span the viewport and use transform
motion with truthful pause/play state, concise captions and intact screenshot
proportions. One semantic screen set plus an inaccessible loop copy replaces
three scrollable copies. Sparse Android spacing prevents duplicate images at
opposite edges at the same time. Manual controls, full-resolution links,
keyboard focus, drag recovery and reduced-motion navigation were reviewed and
checked. Existing hero art, platform colors, route content and app behavior are
unchanged. Fresh native Kids screenshots remain an explicit media follow-up.

## Platform card and download identity after `0c432a5c`

Unified homepage release-card rendering and scoped platform colors across cards,
icons, badges, focus and actions: green Android, blue iOS, purple extension and
pink Kids. Firefox artwork now identifies extension cards at the user's request;
all supported browser options remain. Downloads gets matching platform surfaces,
secondary manual-build links and readable dark-mode scenery. Mobile cards use
full-width copy and compact icons; download bounds fit without hidden clipping.
The homepage hero, feature information, install URLs and availability remain.
