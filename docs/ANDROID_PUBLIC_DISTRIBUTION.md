# Android public distribution

Last updated: May 16, 2026.

This document tracks the public Android distribution plan for FilterTube phone/tablet builds while the native app repository remains private.

## Current boundary

- Public website and release hub: `filtertube.in/downloads`
- Public release repository: `varshneydevansh/FilterTube`
- Android phone/tablet package: `com.filtertube.app`
- Android TV / Fire TV: future separate package, likely `com.filtertube.tv`
- iOS / iPad: TestFlight and App Store path, not a random public IPA download

Do not ship unfinished Android TV behavior inside the phone/tablet Play or APK release. TV needs a separate 10-foot shell, remote focus model, and store listing.

## Release channels

| Channel | Status | Artifact | Notes |
| --- | --- | --- | --- |
| Google Play | Primary phone/tablet channel | Signed AAB | Use Play tracks for internal, closed, and production releases. |
| Direct APK | Next public sideload channel | Signed release APK plus `.sha256` | Good for GrapheneOS, de-Googled Android, and direct testers. Link from `filtertube.in/downloads`. |
| GitHub Releases | Public artifact host | Extension ZIPs, Android APK/AAB, checksums | Use the public repo release page even if app code stays private. |
| IzzyOnDroid | Future repository target | Release APK + metadata | Requires public source path and release metadata. Fastlane metadata will help. |
| F-Droid | Future stricter target | Reproducible/source-built APK | Requires compatible FLOSS source and build path. Treat this as later release hardening. |
| Accrescent | Invite-only watchlist | APK set / store metadata | Privacy-aligned, but currently invite-only. Do not promise immediate publication until accepted. |

## GitHub release artifacts

The public `build.js` script can attach Android phone/tablet artifacts to the same GitHub release as the browser ZIPs.

Recommended artifact source directory:

```text
release-artifacts/mobile/
```

Accepted mobile artifact names:

```text
FilterTube-mobile-tablet-v3.3.2-code30312-release.apk
FilterTube-mobile-tablet-v3.3.2-code30312-release.aab
FilterTube-mobile-tablet-v3.3.2-code30312-debug.apk
```

The release script copies matching files into `dist/mobile/` and creates a `.sha256` file for each copied artifact. By default, it selects only the highest `codeNNNN` build in the artifact directory so older QA builds are not accidentally uploaded. Use `--all-mobile-artifacts` only when you intentionally want every matching file attached.

These generated artifacts are intentionally ignored by git.

Run examples:

```bash
node build.js --mobile-artifacts=release-artifacts/mobile
FILTERTUBE_MOBILE_ARTIFACTS_DIR=/Users/devanshvarshney/FilterTubeApp/release-artifacts/android-mobile-tablet node build.js
FILTERTUBE_MOBILE_ARTIFACTS_DIR=/Users/devanshvarshney/FilterTubeApp/release-artifacts/android-mobile-tablet node build.js --all-mobile-artifacts
```

The script still supports extension-only releases. If no mobile artifact directory is provided, it asks interactively whether Android artifacts should be attached.

## Direct APK safety checklist

Before linking a public APK from `filtertube.in/downloads`:

- Build a signed release APK, not the Play Console developer-verification APK.
- Attach the APK to a GitHub release from the public `FilterTube` repo.
- Attach the generated `.sha256` file.
- Publish the signing certificate fingerprint in the release notes or website.
- Confirm the APK package is `com.filtertube.app`.
- Confirm Android TV / Leanback launcher behavior is not exposed in the phone/tablet APK.
- Confirm Google Play automatic installer protection does not block non-Play direct installs.
- Install the exact GitHub APK on a clean Android device or emulator before announcing it.

## What not to publish

- Do not publish `UPLOAD_THIS_TO_PLAY_CONSOLE_FOR_PACKAGE_VERIFICATION.apk`; that file exists only for Android developer package-name verification.
- Do not publish debug APKs as the public user install unless they are clearly marked as QA-only.
- Do not publish native iOS IPA files as the normal public install path.
- Do not use the Android phone/tablet package for the future TV app.

## Website role

`filtertube.in/downloads` is the public front door:

- store links when available
- latest GitHub release link
- direct APK guidance
- checksum reminder
- Android marketplace roadmap
- iOS/App Store and TV boundaries

The website should link to release assets; it should not require committing APK/AAB binaries into this repository.
