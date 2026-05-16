# Website and app release surface changelog

Last updated: May 17, 2026.

This document records the public website, extension dashboard, and release-script changes made while preparing the Android phone/tablet, iOS, and iPad release surfaces. It is intentionally limited to the public `FilterTube` repository; native app implementation details remain in the private app repository.

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
