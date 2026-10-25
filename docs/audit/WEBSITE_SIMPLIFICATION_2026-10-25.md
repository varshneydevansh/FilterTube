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

## Extension hero and moving screenshot showcases after `f850048d`

The user supplied three popup screenshots for the extension hero and six desktop
screens for its showcase, then explicitly asked for a moving rail like the Flow
reference (https://flow-tube.org/), including movement in the existing Android
showcase. The implementation retains the scenic layout and feature information.

- Extension now has a muted lilac/purple tone, including cards driven by the same
  tone preset. Android stays green, iOS blue and Kids pink. The three hero popup
  captures retain their native aspect ratios; the phone hero layout is unchanged.
- The extension rail shows Dashboard, Channel rules, Kids rules, Focus/settings,
  Imports/language and Accounts & Sync. The existing three Android screenshots
  use the same moving component. No homepage screenshot montage, new iOS gallery,
  tablet or TV media was invented; those remain later additions.
- Shared gallery labels/layout/dimensions replace Android-only headings and
  hard-coded phone dimensions, ready for later genuine captures. Public-version
  differences remain visible. Supplied pixels are unchanged, including the app's
  own labels; authored website copy continues to avoid service naming.
- The original carousel uses native horizontal scrolling at approximately 28
  pixels/second, retaining touch/trackpad scrolling and full-resolution links.
  Three repeated groups keep the current three-screen phone set long enough to
  loop at the maximum 1400px content width. Duplicate links work with a pointer
  but are removed from the tab order and accessibility tree. No dependency or
  implementation code was copied from the reference website.
- Automatic motion stops for reduced motion, offscreen/hidden documents, hover,
  keyboard focus and explicit/manual pause. Controls move one screenshot at a
  time; the Previous boundary recenters an equivalent copy before moving left.
  Frame work is cancelled on pause/unmount, with elapsed time bounded on resume.
- A read-only subagent review identified keyboard-focus and wrap-direction
  problems; both were corrected before final verification. FreeLLMAPI
  gpt-oss-120b supplied bounded caption proposals; an initial truncated response
  was rejected. Source review and actual browser results determined the copy.

Observed browser checks: extension automatic movement advanced from 16 to 1284;
Pause stopped it; Previous from zero settled at 3640 in a 4368px cycle. Android
crossed its 984px boundary (975 to 146), then remained at 147 while a keyboard
control held focus. Reduced motion removed the play/pause control and retained
manual navigation. Evidence is stored alongside the prior website screenshots.
A narrow-screen check caught a slight popup edge crop; popup spacing was tightened
before the final build. Final checks below distinguish the corrected candidate.

During verification, the repository-root extension build was invoked by mistake.
It regenerated ignored local packages and README badge counts; the badge-only
edit was restored. No extension source, native source or publishing action was
part of this website change. The website candidate was built from `website/`.

Final corrected candidate: website production build passes, with 18 focused
website, 742 release and 1,482 smoke checks passing. The regenerated package
README bytes were restored to match the source before the release recheck. All
14 routes and internal screenshot links resolve; the invalid route returns 404.
Extension and Android fit 320/375/414/768/1440px without page overflow; all three
popup edges fit after correction. Android focus stayed at 147 across reads;
extension offscreen position stayed at 8. Reduced-motion manual Next moved
0→347 and exposed only the six original screenshot links to accessibility.
No console errors were captured on the final extension route. Validation JSON,
asset fingerprints and final desktop/mobile screenshots are in the dated
website artifact folder. Existing broader acceptance gates remain unchanged.

## Full-width gallery correction after `0ff5e465`

The user reported repeated images, apparent non-playing behavior and clipping
inside the central column, then asked to inspect the Flow reference directly
and apply the correction to Android too. The following supersedes the earlier
native-scroll gallery implementation described above.

Observed live at https://flow-tube.org/: the Android track has 13 unique screens
and a second visual copy, a 50-second linear transform animation, approximately
210px phone cards, a viewport-wide rail and pause-on-hover. Its headings remain
constrained independently. Repetition is the loop mechanism; a visible duplicate
listing and clipping inside a narrow content column are not needed. No reference
implementation code or media was copied.

Both extension and Android now use one shared original Web Animations transform
rail at 40px/second, with one semantic screen set and one inaccessible visual
loop copy. The gallery spans the viewport; its heading and controls retain the
existing content width. Intrinsic proportions and full-resolution links remain.
The sparse three-screen Android cycle is at least the viewport plus a card and
gap, preventing the same image from appearing at both edges simultaneously.
It still contains only the three real current Android captures; no new app
features or screenshots are implied. Android green, iOS blue, Kids pink,
extension lilac and the existing heroes remain unchanged by this correction.

Playback status describes actual effective state: Playing, hover pause,
keyboard pause, explicit pause, offscreen readiness or reduced motion. Explicit
Play can resume while hovering/focused and can opt into motion when requested
despite the default reduced-motion setting. Vertical page scrolling does not
permanently pause the rail; horizontal browsing and dragging do. Reduced motion
defaults to a native horizontal row with no visible loop copy and touch-action
auto. No per-frame React update or runtime dependency was added.

A read-only subagent review found and prompted fixes for release-outside drag
cleanup, reduced-motion touch swiping, navigation after explicit motion opt-in,
toolbar keyboard focus, pointer focus moving a screenshot before click, and a
valid native scroll offset of zero being discarded. Animation observers and
window listeners are cleaned up on unmount. Resize preserves animation phase.
A browser check also caught Next getting stuck at the native scroll end when the
last card could not align fully left; the end boundary now advances to the first
screen rather than repeatedly selecting the already-visible last one.

Browser observations: Android spanned x=0 to 1280 with 208px cards and automatic
transform movement; Pause held at -571.807 across reads. At 375px reduced-motion
Next reached native offset 544; Play followed by Next stayed in animated mode and
paused at the next screen. Keyboard Tab into a control showed Paused for keyboard.
The extension full-resolution Dashboard link opened its genuine 1720×1261 image.
Release outside the rail recovered to Playing; horizontal wheel input paused.
Final Android at 1440px has a 1680px cycle, exceeding viewport+card width. Screen
size receipts and updated Android/extension images are in the dated artifacts.

The first production build hit a Next font-cache resolution error. Rebuilding
after moving only the generated .next directory aside passed; no dependency or
font source change was needed. Build/check results and remaining media gates
are recorded in fullwidth-rail-validation.json.

Kids app media remains a separate open item. The extension Kids-rules screenshot
is present in the extension gallery; it is not a native app screenshot. Existing
iOS Kids proofs are old, and Android TV Kidstube reference images belong to a
different app. Neither was presented as current FilterTube Kids media. The
Android chat was asked for recent existing captures without interrupting device
work; none had been supplied at this checkpoint.

Final full-width candidate: production build, 18 focused website checks, 742
release checks and 1,482 smoke checks pass. All 14 served routes and internal
screenshot links resolve, with the expected invalid-route 404. Responsive
geometry passes at 320/375/768/1440px on Android and extension, including the
minimum cycle length needed to avoid simultaneous duplicate edge images.
Reduced-motion Android wraps through native offsets 0→192→201→0 after entering
at the final screen. These are local browser and source results; nothing was
pushed or deployed, and fresh native Kids media remains pending.

## Platform identity correction after `0c432a5c`

The user identified a visual mismatch between the generic browser release block,
the themed Android/iOS release cards, the extension's lilac featured card and
neutral Downloads cards with red buttons. The browser block had separate markup;
Downloads inherited global brand action styling. Neither used the route's tone.

- All three homepage release cards now share the same rendering path and action
  treatment. Their tone comes from the existing detail page data: Android forest,
  iOS sky and extension lilac. Existing copy, artwork, links and public-access
  distinctions remain; the original homepage hero is unchanged.
- Scoped CSS tokens carry platform surfaces, borders, labels, icons, badges,
  actions and visible focus. Featured and related cards use the same identity;
  primary detail-page actions follow the relevant tone. Kids remains pink.
  A read-only subagent review confirmed white-on-accent contrast and caught a
  selector that initially missed focus on themed anchors themselves; it was fixed.
- At the user's explicit request, Firefox artwork identifies the browser extension
  on release, featured, related and download cards. This is a visual identifier,
  not an exclusive browser-support claim. Chrome, Firefox, Edge and other existing
  browser choices remain. The locally served 256px PNG comes from the same
  browser-logos version already used by the site's browser rail:
  https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/firefox/firefox_256x256.png
  Firefox identity remains Mozilla's; no endorsement or new runtime dependency
  is implied. The source asset dimensions were verified before adding it.
- Downloads now has purple extension, green Android and blue iOS cards. Filled
  store actions retain priority; GitHub ZIPs and the separately described simpler
  APK are themed secondary actions. iOS status stays a status action, with no
  new install/public TestFlight claim. All action URLs remain unchanged.
- Mobile review caught the previous artwork layout squeezing release copy into
  a narrow column. Below 640px, copy now uses the card width with a compact icon;
  larger decorative artwork remains on wider screens. The Firefox artwork size
  leaves copy and buttons unobstructed. Downloads dark mode also gets a dark
  scenic wash so its introductory text stays readable.
- A 320px review caught download-card min-content width exceeding the padded grid
  even though the page's overflow clipping hid horizontal page overflow. The
  grid items now allow shrinking, and scoped action padding/wrapping lets the
  actual card and button bounds fit. Validation checks those bounds directly.

Light/dark screenshots, responsive measurements and verification results are
stored under the existing dated website artifact directory. These changes are
website presentation only; extension behavior, native app state, sync protocol,
store publishing and deployment are unchanged.

The final Downloads icons use the existing Android and App Store artwork, with
scoped scaling to compensate for transparent asset padding; Firefox is unchanged.
Production build, 18 focused checks, 742 release checks and 1,482 smoke checks
pass after the final logo change. A smoke wording count initially picked up test
titles in ignored full-width validation logs; those generated logs were moved
outside the repository, and the original assertion passed without modification.
All 16 responsive light/dark cases fit their actual card and button bounds.
