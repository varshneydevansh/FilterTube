# Website and app release surface changelog

Last updated: May 31, 2026.

This document records the public website, extension dashboard, and release-script changes made while preparing the Android phone/tablet, iOS, and iPad release surfaces. It is intentionally limited to the public `FilterTube` repository; native app implementation details remain in the private app repository.

## July-August 2026 release-surface updates

The post-v3.3.5 public-surface commits are now recorded here as a separate
checkpoint from the older May validation notes.

### August 29, 2026 public Android release

- The Android phone/tablet app is now publicly available on Google Play at
  `https://play.google.com/store/apps/details?id=com.filtertube.app`.
- The extension dashboard and website now use the public store listing as the
  primary Android CTA. Users can install from the link or search Google Play
  for FilterTube.
- Android copy no longer presents the app as an open-testing enrollment path;
  the separate direct APK remains clearly identified as a simpler build.

### Committed website and dashboard work

- `54c35a22` simplified the public navigation and split everyday setup copy
  from developer-facing project detail while making the Android closed-testing
  request explicit.
- `c0b3584c` added the extension's website-style About surface, including the
  independent-project explanation and direct project links.
- `d73bd68c` and `9ac63173` placed and aligned the Android testing call-to-action
  above dashboard statistics.
- `0920969b` records the current unreleased app-surface direction: a calmer
  product message, app preview entry points, Android/iOS availability wording,
  and platform-specific artwork. The Android Play closed-testing app is the
  feature-rich custom frontend; the direct APK remains a simpler separate
  artifact.

### Current local website work (not yet committed)

The 2026-08-23 worktree still contains intentional website edits and must not
be described as deployed until committed and built:

- `website/app/page.js` updates the hero to “Calmer, ad-free viewing / Your
  feed, your rules”, keeps both the quick demo and app demo actions, and adds
  Android/iOS status messaging.
- `website/components/route-content.js` adds Android/iOS items to the browser
  rail and the `/mobile` app preview data.
- `website/components/scenic-detail-page.js` renders the responsive privacy
  embed for `SHvSICSMHL4` with a direct YouTube fallback link.
- `website/components/browser-logo-rail.js` uses a less-cramped four-column
  responsive desktop rail and keeps platform navigation same-tab.
- `website/app/globals.css` supplies readable translucent surfaces plus opaque
  themed Android-green and iOS-blue cards in both light and dark themes.

These edits were checked with the website production build and
`git diff --check` in the current worktree; deployment, DNS, and store status
remain separate release evidence.

## May 31, 2026 validation checkpoint

### Release positioning

- The post-April-12 documentation validation keeps the mobile/tablet app work as the release headline for the next public checkpoint.
- Android phone/tablet is described as final release testing / release setup, not as publicly shipped until the real store or direct public links are live.
- iOS/iPad is described as final release testing through the separate TestFlight/App Store path.
- Android TV / Fire TV remain future separate app work and should not be bundled into the mobile/tablet MVP announcement.

### Product surface contract

```text
Extension dashboard cards
  -> filtertube.in/downloads
      -> Browser extension release links
      -> Android phone/tablet testing and artifact path
      -> iOS/iPad TestFlight/App Store status
      -> Future TV/store links only when separate packages exist
```

### Runtime dependency

- The app release copy now explicitly depends on the shared runtime stability work completed after May 17: no-rule YouTube work gates, production console quieting, whitelist Shorts fallback, watch autoplay endpoint filtering, and DOM state hardening.
- Public app claims should remain about the MVP contract: YouTube Main, public YouTube Kids access, profiles, PIN rules, and Nanah sync. Native implementation details remain in the private app repo.

### Documentation pointers

- Release validation register: `docs/audit/FILTERTUBE_POST_APRIL_12_RELEASE_DOC_VALIDATION_2026-05-31.md`
- Runtime sync workflow: `docs/APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md`
- Public release notes source: `data/release_notes.json`

## May 17, 2026 checkpoint

### Public download path

- Added `filtertube.in/downloads` as the public front door for browser, Android, iOS/iPad, and future marketplace links.
- Added the downloads route to the website sitemap.
- Updated homepage and footer calls to action so users can find downloads without guessing which platform page to open.
- Kept Android TV / Fire TV out of the current mobile/tablet release path. TV remains a separate future platform target.

### Extension dashboard app cards

- Added Android and iPhone/iPad release-testing cards to the extension dashboard control-center area.
- Used the provided app artwork from:
  - `assets/images/Android_icon.png`
  - `assets/images/iOS_icon.png`
- Styled the cards as native DOM surfaces instead of dropping the raw generated artwork directly into the dashboard. The layout now owns the text, tint, button, and image crop so the cards can scale with the extension dashboard.
- Current card behavior points users toward the website downloads/status surface. Store-specific links can replace those targets when Play Store, TestFlight, App Store, or direct APK links are ready.

### Website platform copy

- Updated the website platform language from broad future intent to the current release state:
  - desktop browser extension is live
  - Android phone/tablet is in testing/final release setup
  - iOS and iPad are in final release testing
  - Android TV / Fire TV remain future separate app work
- Updated Android copy to mention YouTube Main, public YouTube Kids access, profiles, PIN rules, and Nanah sync.
- Updated mobile overview and footer copy so the app family is described as separate store paths instead of one undifferentiated roadmap.

### Platform detail page cleanup

- Removed the repeated decorative hero-side preview shell from the platform detail pages:
  - `/mobile`
  - `/ios`
  - `/ipados`
  - `/android`
  - `/kids`
  - `/ml-ai`
  - `/android-tv`
  - `/fire-tv`
- Kept the lower feature cards, milestone cards, and related platform links intact.
- Widened the hero text column so each detail page opens cleaner and with less unnecessary visual weight.

### iOS hero video

- Added the source iOS preview video:
  - `website/assets/videos/ios/ios.mp4`
- Added an optimized public runtime video:
  - `website/public/videos/ios/ios_hero_slow_540.mp4`
- The runtime video is slowed from the original short preview to about 15 seconds and interpolated to 24 fps so the pan is calmer and less jittery.
- The iOS detail page now uses this runtime video as a full hero background with a soft white overlay, instead of rendering it as a small side card.

Optimization command used:

```bash
ffmpeg -y -i website/assets/videos/ios/ios.mp4 \
  -vf "setpts=1.875*PTS,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,scale=960:-2" \
  -an -c:v libx264 -preset slow -crf 25 -movflags +faststart \
  website/public/videos/ios/ios_hero_slow_540.mp4
```

Current runtime asset characteristics:

```text
Path: website/public/videos/ios/ios_hero_slow_540.mp4
Duration: about 14.875 seconds
Size: about 2.1 MB
Resolution: 960 x 540
Frame rate: 24 fps
Audio: none
```

### Reveal behavior

- Removed the IntersectionObserver-driven delayed reveal behavior from the website.
- Website sections are now visible immediately on first scroll instead of appearing late as if the page is still loading.
- Kept `data-reveal` attributes in place so future animation work can reuse the semantic hook without reintroducing delayed content by default.

### Release tooling

- Extended `build.js` so GitHub releases can optionally attach Android phone/tablet APK/AAB artifacts alongside browser extension ZIPs.
- Added SHA-256 checksum generation for attached Android artifacts.
- Added release asset content types for ZIP, APK, AAB, and checksum files.
- Added `npm run sync:native-runtime` as the public wrapper for syncing extension runtime code into the private native app workspace.
- Added git ignores for generated mobile artifacts and release artifact directories.

### Documentation added

- `docs/ANDROID_PUBLIC_DISTRIBUTION.md`
- `docs/APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md`
- `docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md`

## Future footer animation note

The next visual task is the programmatic footer animation below the main footer boundary:

```text
class="relative border-t border-[color:var(--color-line)]"
```

That work is intentionally not included in this checkpoint. The footer animation should be treated as a progressive enhancement, likely canvas or p5.js based, with:

- deterministic low-cost rendering
- dark/light theme awareness
- reduced-motion support
- no content layout shift
- no blocking dependency on animation load

## Verification

Before committing this checkpoint, run:

```bash
cd /Users/devanshvarshney/FilterTube/website
npm run build

cd /Users/devanshvarshney/FilterTube
node build.js
git diff --check
```
