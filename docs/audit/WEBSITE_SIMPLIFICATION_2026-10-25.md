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
