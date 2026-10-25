# Website content refinement — 25 October 2026

## Intent and preservation boundary

The user requested a clearer, less repetitive website, with mobile applications
and Android TV treated as major products alongside the extension. They explicitly
rejected replacing the website or removing its scenic hero and design. The earlier
broad candidate was restored before this implementation; it is not part of this
change. Nothing was pushed, deployed, submitted to stores or posted to issues.

Source starting point: `7a476d57`. Supplied release comparison: `885aa49`.
[The post-release record](POST_885AA49_CHANGELOG_2026-10-25.md) inventories the
39 extension commits between those checkpoints. Native app work is in separate
repositories/worktrees and is not included in that extension commit count.

Keep the existing video hero, both headlines, demo links, scenic backgrounds,
fonts, palette, light/dark theme, glass header, illustrations, card language,
community sources, large footer wordmark and FooterSignalArt. The hero's repeated
availability paragraph becomes a P2P ownership message; its structure and classes
remain identical. Android moves first in the existing platform/logo rail.
[The preservation rules](../../website/DESIGN.md) record this direction for future work.

## Owner replies obtained before website edits

The Android chat, **Assess Flow for FilterTube**, reported:

- Android is a full Main/Kids application with browsing, search, channels,
  playlists, history and native playback work, not merely an extension companion.
- Newer development work includes native saved-video Notes, opt-in personal
  Auto-sync, causal conflict review, captions/transcript controls, Music controls,
  queues and a local-file player/library.
- Development source and emulator/installation checks do not establish that every
  feature is in the current Play release. A fresh live phone-to-extension
  Auto-sync/reconnect session remains unverified.
- Local-file playback is separate from downloading YouTube media. Android
  single-video and playlist YouTube downloads remain planned. Local ML remains
  research/planned.

Supporting local app records were read: `MAIN_CURRENT_STATUS.md`,
`docs/app/ANDROID_UPSTREAM_ACCOUNTS_SYNC_2026_10_24.md`, and
`docs/app/ANDROID_MUSIC_OFFLINE_ROADMAP.md` in the Android working context.
This supersedes the initial base-checkout search which missed newer native Notes
and Auto-sync adoption in the separate development worktree.

The TV chat, **Complete FilterTube Android TV**, reported:

- TV is a tested development candidate, not a public-release claim.
- Scoped verified work includes Main browsing/Search, remote focus, playback
  controls and local History resume.
- Complete Kids/parent journeys, accounts/sync, physical-TV performance and release
  checks remain open. Music inside Main is pending.
- Do not advertise TV Auto-sync, Notes, offline saves or local ML as delivered.

Its `CURRENT_TV_STATUS.md` was also read. Emulator checks and selected test counts
remain scoped evidence, not whole-app or physical-TV release acceptance. The
website labels Android TV separately from the public phone/tablet app and Fire TV
compatibility as planned. iPhone/iPad share the iOS story without a parity claim.

## What changed and why

| File / surface | Change | Reason |
| --- | --- | --- |
| `website/app/page.js` | Keep original hero; replace repeated availability paragraph with verified P2P ownership copy. Retain Android/Apple artwork and add an extension overview in the former early funding-card slot. | Explain that apps and secure device sharing are central, without replacing the visual design. |
| Homepage setup | Merge the separate 3-step/4-step guides into one guide at the retained `#system` anchor. Keep troubleshooting and connection details in native disclosures. | Avoid making visitors read two onboarding sequences or all transport mechanics at once. |
| Homepage features | Preserve all 13 detailed feature titles; add 8 missing capability explanations. Keep the complete guide expandable, with platform/development labels. | Preserve information while reducing the default scroll and repeated cards. |
| Homepage app choices | Lead with Android and iOS, keep the extension and Kids use case, and make local ML a research entry. TV is within Android rather than a competing homepage platform card. | Reduce duplicated device choices and make mobile a full product. |
| `route-content.js`: Android | Explain Main/Kids, filtering, family profiles/time, native playback/browsing, device updates and development Notes/Auto-sync/Music/local media. Add the existing app demo and a clearly labelled Android TV section. | Replace vague design commentary with concrete user benefits and honest status. |
| `route-content.js`: iOS | Combine iPhone/iPad description and benefits, retain artwork/video and a wider iPad explanation. | Give one coherent iOS entry without implying public access or new Auto-sync parity. |
| `route-content.js`: extension | Add `/extension` through the existing scenic template, explaining popup, dashboard and YouTube-menu controls. | Keep the extension fully represented alongside the growing app family. |
| `site-shell-data.js` | Android, iOS, Features and Downloads navigation. Keep all legacy route slugs plus the new extension overview. | Simplify primary choices without breaking existing URLs. |
| `site-footer.js` | Keep artwork, wordmark and resources; give Android/extension clear actions and retain the funding story in a disclosure. | Preserve project identity without making funding compete with initial product selection. |
| `downloads/page.js` | Remove the duplicate Play link; retain Play versus simpler APK distinction. Put prospective distribution channels behind secondary details and avoid guaranteed Apple enrollment resolution. | Help visitors choose an actual available download. |
| `layout.js` | Correct browser-only/mobile-future wording and absolute no-data-anywhere metadata. | Reflect the current app family and actual P2P network boundaries. |
| `scenic-detail-page.js` | Reuse the original template with optional feature status and section IDs. | Make development labels and Android TV/iPad anchors visible without another design system. |
| `globals.css` | Add touch behavior and a contrasting focus outline for summaries; add anchor clearance. | Keep new disclosures usable by keyboard and anchors clear of the sticky header. No palette or font replacement. |

The original `#story`, `#capabilities`, `#platforms`, `#system` and `#download`
anchors remain. All nine previous product URLs remain reachable:
`/mobile`, `/android`, `/ios`, `/ipados`, `/tv`, `/android-tv`, `/fire-tv`,
`/kids`, `/ml-ai`. No route file was deleted. Primary navigation consolidates the
product story; legacy links do not become a second set of primary choices.

## Feature preservation and additions

All original detailed features remain: Ad-free playback; Keyword rules; Channel
rules; Comment controls; Shorts controls; Profiles; PIN protection; Backups;
Rule-list imports; Subscribed-channel whitelist; Date-limited keywords; Device
updates; Local-first design.

Eight additions make the feature guide 21 entries: Protected viewing time;
Duration, dates, and categories; Language controls; Minimum-view filters; Saved
video notes; Opt-in Auto-sync; Reviewed preference reset; Compatible rule exports.
Descriptions also cover uppercase-title controls, original-audio preference,
self-control sessions, encrypted/automatic backups and supported distracting
surfaces. These are not assertions of identical support in every platform/build.

Local semantic matching, suggestions and possible thumbnail analysis remain
research direction on `/ml-ai`. The extension Semantic ML entry is disabled until
runtime matching exists. Language metadata filtering is not semantic ML or local
speech recognition. Possible desktop applications remain an exploratory product
direction, not a new public download or delivery promise in this change.

## P2P and profile claim boundaries

- Local rules and verified encrypted sharing do not mean no servers are involved.
  Connection helpers, encrypted relay and optional encrypted pickup can be used;
  providers may observe connection metadata. No central readable FilterTube
  account/rules vault is promised or introduced.
- Code/QR pairing, phrase verification, saved trust, profile-link approval and data
  selection are separate steps. Same-network presence does not grant trust.
- Auto-sync is opt-in and in development updates. Direct transfer requires open,
  connected supported endpoints. Offline changes wait locally; coming online alone
  does not guarantee delivery/application.
- Parent authority is separate from child switching PINs. Device updates cannot
  manufacture parent ownership or allow children to edit protected policy.
- Notes are scoped to video and profile and remain subject to permissions.
- Daily time is per installation/profile, not a pooled family-wide allowance.
- Preference reset preserves rules, Notes, PINs, time limits, trust and ownership.
  Compatible exports do not transfer a complete FilterTube setup.

## Review and validation

The implementation used the installed Hallmark v1, Claude Frontend, Design Taste,
design-system patterns, UI/UX Superstack, responsive standards and web-interface
review guidance within the preservation scope. Three subagents reviewed website
content, mobile source and extension capabilities; a separate read-only review
checked final public claims and preservation. It found one new faint-summary-focus
issue, which was fixed with an opaque theme-aware outline. A bounded FreeLLMAPI
`openai/gpt-oss-120b` critique was advisory; its unsuitable modal/sticky-CTA and
invented platform suggestions were rejected. Source and owner replies decide claims.

Validation receipts and screenshots are stored in
[the evidence directory](artifacts/website-simplification-2026-10-25/).
Final build, test, responsive and served-route results are recorded in
`validation.json` there. They prove local website behavior, not a deployed site,
store feature rollout, new native pairing or public TV/iOS availability.

Existing legal-page structure and unrelated SEO/analytics/media behavior were not
rewritten: the pre-existing Terms page uses a level-2 title and Privacy/Terms retain
their existing canonical inheritance. The original hero's reduced-motion/offscreen
behavior remains; this change does not add a manual scenery playback control.

### Recorded final local results

- Production website build succeeds; 19 internal static build entries generated.
- 35 focused public/inventory checks, 5 claim-register checks, 742 release checks
  and 1,482 smoke checks pass with zero failures. These suites overlap.
- All 14 served routes return 200, 46 internal links/anchors resolve, and a missing
  route returns 404. This does not assert complete SEO or legal-page accessibility.
- Hero markup comparison is identical after normalizing its intentional status
  paragraph. All original 13 detailed titles and 9 legacy platform slugs remain;
  the detailed guide now contains 21 features. Homepage sections reduce 11 → 10.
- Returned Chrome checks show no horizontal page overflow at 320/375/414/767/769
  for iOS, at 375 for Android and the homepage, and at native desktop width for
  home/Android. The feature guide opens and closes with the keyboard; all 21
  headings are present. Mobile-menu navigation to iOS succeeds.
- The larger five-page responsive batch timed out before it returned or saved
  results. Subsequent browser-tab recovery and viewport reset also timed out;
  final viewport override state is unverified. No unreturned measurements are
  claimed. Existing browser zoom plus integer overrides prevented exact 768;
  767 and 769 were checked instead. Screenshots use the actual returned views.
- A new bounded test-lane rule assigns dated website evidence to release/smoke.
  The existing exact-wording register now includes the single audit-test filename
  recorded in the new commit inventory. These are metadata freshness corrections,
  not relaxation of behavior or release gates.


## Follow-up: real app screens and complete extension features

The user clarified that the app's custom frontend is a major product, then
requested a complete extension assessment and authorized updating the website.
This follow-up preserves the scenic hero and design from `0cbb98dd` and all 21
homepage feature titles. All existing platform routes remain unchanged.

### Feature presentation

- Android's eight overlapping generic cards are regrouped into seven closed
  disclosures: browsing, playback, Music, filtering, family, Notes/local media,
  and device sync. The Android TV development card stays visible and retains
  `#android-tv`. All unique prior Android feature information is retained.
- The app destinations are explicit: Home, Search, Watch, channels, You,
  Subscriptions, Playlists, Shorts, History, Music Home/Explore/Artist/Library/
  Albums, Offline Media, and the separate Kids viewing context. Player controls
  include captions, chapters, searchable transcript, sleep timer, floating
  playback and the supported quality/audio controls. Exact availability is
  qualified by build, video and release.
- Extension's three generic cards are regrouped into six closed disclosures:
  filtering, distractions, profiles/time, Notes, P2P devices, and data management.
  The source-derived count is 32 content switches in seven groups, with separate
  metadata/category/language controls. This is not an inflated total-feature
  count or proof of every layout working. The full supporting inventory is
  [recorded separately](EXTENSION_FEATURE_INVENTORY_2026-10-25.md).
- Homepage copy highlights app development beyond a filter list. The existing
  Shorts entry now explains both filtering selected Shorts and hiding the
  format; the time entry distinguishes daily limits and reviewed focus sessions.
  Original titles, hero headlines, art, palette, typography and media remain.

### Real screenshots and privacy

Three raw 1080 x 2400 PNG captures from the installed Pixel development build
show player settings, Music playback and an empty Notes editor. They came from
`13-player-settings.png`, `25-music-player-paused.png` and `27-notes.png` in the
local capture directory. These selected images contain no account identifier,
private history/rule list, saved note text, PIN or pairing credential. Other
phone captures remain outside the repository and public website.

The images are under `website/public/apps/screenshots/`, with visible development
status, accurate alt text, concise captions, intrinsic dimensions, lazy loading
and full-resolution links. The empty editor demonstrates the UI, not successful
saved-note persistence or sync. The gallery scrolls horizontally on compact
screens and uses three columns from the existing medium breakpoint. No invented
phone frame, image generation or additional dependency was introduced.

### P2P visibility and capability boundaries

The existing homepage P2P panel now has `#device-sync`; the existing hero chip,
footer and app/extension detail pages link to it. Detail-page links target the
visible wrappers `#android-p2p` and `#extension-p2p` even while disclosures are
closed. Native anchors handle these new section jumps. No additional primary
navigation choice or long duplicate homepage section was added.

Pairing, matching phrase, device trust, profile consent and selected scope remain
separate. Direct Auto-sync requires both supported endpoints open and connected;
offline changes wait locally. Connection/relay/optional pickup services are
acknowledged. There is no claim that no servers exist or that any online device
will automatically receive/apply an update.

Local-file playback remains separate from ongoing Android YouTube-download work.
Notes backup support differs: the extension's ordinary backup excludes private
Notes and rejects notes-bearing native backups; opt-in Notes sync is separate.
Android/iOS/TV parity and public availability are not inferred from one candidate.
Local ML stays research/disabled.

### Extension copy corrections

`html/video-notes.html` now describes opt-in Notes sync and its connection
requirements while retaining the ordinary-backup exclusion and temporary-draft
boundary. `html/tab-view.html` short migration help now matches its detailed Help:
imported-channel metadata enrichment runs in the extension background worker;
closing the dashboard does not stop it, but shutdown, authorization and wakeup
limits can delay it. These are copy corrections, not transport/storage changes.

All three browser extension packages were rebuilt locally for the copy changes.
The existing build updates README line-count badges; that generated badge line
is retained to match the packaged README. Nothing was installed, uploaded,
submitted or deployed. The Android chat retains the phone and offline-media
implementation; this follow-up did not operate the phone or edit native source.

### Follow-up validation

Final build, automated-test, served-route and responsive results are recorded in
`artifacts/website-simplification-2026-10-25/feature-expansion-validation.json`.
Browser screenshots and the responsive matrix are alongside it. These receipts
prove local website/build behavior, not deployment or cross-device acceptance.

Final results: production website build passed; all three local browser packages built; 1,482 smoke, 742 release and 18 website inventory checks passed. Fourteen served routes returned 200, all 52 distinct internal destinations resolved, and the invalid route returned 404. Android and extension layouts fit 320, 375, 768 and 1,440 pixel viewports; the homepage fit 375. Keyboard disclosure and mobile gallery scrolling were exercised. Production Android-to-home P2P links landed below the fixed header. The existing Terms page has no H1; this inherited semantic issue remains outside this feature-content update.

The new anchors also required a one-match lexical inventory refresh; the prior extension route needed inclusion in the current dynamic-route closure assertions. Generated README badges required matching package-metadata fingerprints. These tests retain their existing assertions and measure the actual changed inputs.

### Broader filtering checks remain open

The changed-file selector also requires six filtering lanes because the Notes HTML file is broadly classified. These remain failing: Whitelist 35/487, blocking 13/599, JSON 131/1,294, DOM 52/457, performance 44/945, and settings 95/1,255. Each lane was run against an isolated local clone of `0cbb98dd` with the same installed Node dependencies. No current failing test name is new relative to that baseline. The clone lacks ignored captures/package output, so lower current failure counts are not claimed as fixes. These inherited failures remain unresolved; a passing website build and release lane do not mean full extension acceptance. No new live YouTube or installed-device smoke was claimed for these copy changes. Counts and comparison limits are in the validation receipt.

## App heroes and Kids follow-up — 25 October 2026

Starting checkpoint: `2b3d30bb`. This follow-up implements the user's explicit
request for three real overlapping screens in Android/iOS heroes, a subtle
Android video, clearer Kids information and the original green/blue/pink tints.
It does not replace the homepage or remove any platform route or unique feature.

- Android reuses the already captured development Music, Player settings and
  empty Video notes screens. iOS now uses fresh launcher, native controls and
  empty Filters captures from an isolated iPhone 17 Pro / iOS 26.4 simulator,
  running the existing 3.3.6 (30316) app binary. No account, PIN, rule or device
  trust was changed. These are development previews, not App Store availability
  or iPad-layout proof. Public iOS access remains explicitly pending.
- The stack supports mouse hover, keyboard focus/Enter and persistent click/tap
  selection through labelled choices. Original screenshot pixels remain intact;
  a full-resolution link makes the detail readable. No fake device chrome or
  invented app interface was generated. Reduced motion disables transitions.
- The Android video is an original silent eight-second fframes 1.3.0 composition:
  1280×720, 24 fps, 192 frames. Source, lockfile, render commands and font license
  are retained in `website/motion/android-hero`. The static poster remains usable
  if playback is disabled. The website adds no runtime library dependency.
- Background video playback waits for visibility, respects reduced motion and
  pauses when offscreen or the document is hidden. Visible controls allow a
  persistent manual pause; Home and Downloads receive the same pause affordance.
- Kids now explains channel/word filters, approved-channel viewing, separate
  Main/Kids rules, parent authority, per-device limits and verified encrypted
  updates. It distinguishes viewing spaces from child profiles, a child PIN
  from parent authority, Android TV development from planned Fire TV support,
  and local limits from a shared family budget.
- Applied Hallmark, Claude Frontend, Design Taste, existing scenic tokens and
  Elayadesign's `design-to-motion` website guidance. User preservation and
  explicit requested Android motion override generic redesign/static-background
  rules. A bounded FreeLLMAPI gpt-oss-120b critique and a read-only subagent review
  informed accessibility and honest availability wording; source and browser
  evidence determined the changes. Screenshot interaction uses CSS transforms,
  so adding GSAP is unnecessary for this scope.

The native simulator crash remains open. See
[the redacted findings](IOS_SIMULATOR_SIGNATURE_SOLVER_CRASH_2026-10-25.md).
Fresh static screenshots do not establish a native playback fix. No native source
was edited, rebuilt or installed over the user's original simulator.

Validation for this follow-up: production build passed; 18 focused website, 742
release and 1,482 smoke checks passed. All 14 routes returned success, local links
and anchors resolved, and an invalid route returned 404. Browser checks covered
hover/Enter/selection, reduced motion (paused video and zero transition), manual
pause/resume, offscreen pause and reachable Home/Downloads controls. Android,
iOS and Kids fit at 320/375/414/768/1440 pixels without horizontal overflow. The
final Android production page loaded all three images and video, with no captured
console errors. The fframes inspector checked 33 frames with no problems.
Evidence and asset fingerprints: `artifacts/website-simplification-2026-10-25/`.
Existing broader filtering/settings suite failures remain separate gates; they
were not rerun or waived by this website-only check.

## Service-name copy follow-up after `768d8755`

The user requested removal of repeated underlying-service naming across the
website. Home, platform guides, navigation, footer, demo labels, metadata,
Privacy, Terms and shared copy now use Main/Kids/Music/videos/supported pages.
Functional demo, attribution and support URLs remain unchanged; genuine app
screenshots are intact. Privacy and Terms retain Google ownership, independent
service policies, host permission boundaries and non-affiliation. This is a
wording change, not support for arbitrary video services. Third-party embedded
player chrome and text inside real product media are outside authored copy.

Validation of the wording follow-up: production build, 18 focused website checks,
742 release checks and 1,482 smoke checks pass. A served-HTML scan across all 14
routes found no service name in authored text, accessible/image labels, titles
or metadata; functional external URLs match the prior checkpoint exactly.
Android, iOS and Kids still have no horizontal overflow at 320 pixels. Refreshed
browser images and `authored-copy-validation.json` record the final wording.
