# FilterTube Build / Website Callable Audit - 2026-05-18

Status: audit artifact only. This file does not change build, release, website,
or filtering behavior. The 2026-06-01 addendum records the build/release prompt
guard added to `build.js` and the `test:changed` same-path mutation guard
added to `scripts/run-test-lane.mjs`; extension runtime filtering behavior is
unchanged.

This pass expands the complete-codebase audit into build/release scripts and
the public website. These files do not decide whether a YouTube card is hidden,
but they decide what code ships, what app artifacts are attached, what public
claims users read, and whether generated/vendor/native copies can drift from
the audited source.

## Scope

Lexical callable detection is intentionally conservative. It counts named
function declarations and top-level arrow function assignments. Constant data
objects such as route copy and platform cards are audited as public claim
surfaces even when they do not contain callables.

| Family | Files | Lexical callables | Public authority |
| --- | ---: | ---: | --- |
| Build and sync scripts | 7 | 68 | Extension ZIPs, generated UI shell, vendor Nanah/QR bundles, native app runtime sync, GitHub release body/assets, focused test-lane runner, declarative test-lane config, lane-owned audit proof drift guard |
| Website app routes | 9 | 19 | Public metadata, downloads page, privacy/terms policy, sitemap, robots, platform detail pages |
| Website components | 15 | 54 | Public platform copy, browser links, footer/header/navigation, theme/scene runtime, animation/reveal behavior, hero media control |
| Total | 31 | 141 | Public release and website truth boundary |

## Accounted Files

| File | Count | Important callable / surface |
| --- | ---: | --- |
| `build.js` | 29 | `main`, `maybeCollectMobileArtifacts`, `resolveMobileArtifactPromptDir`, `resolveDefaultMobileArtifactsDir`, `parseMobileArtifactName`, `summarizeMobileArtifacts`, `buildReleaseBody`, `createGitHubRelease`, `uploadReleaseAsset`, `updateReadmeBadges` |
| `scripts/audit-proof-drift.mjs` | 12 | `currentSourceProofs`, `laneOwnedProofFiles`, `defaultAuditProofFiles`, `collectProofDrift`, `main` |
| `scripts/build-extension-ui.mjs` | 2 | `ensureOutputDirectories`, `bundleAll` |
| `scripts/build-nanah-vendor.mjs` | 4 | `buildQrcodeBundle`, `buildNanahBundle`, `main` |
| `scripts/run-test-lane.mjs` | 21 | `classifyPaths`, `auditProofRequirement`, `runtimeFixtureRequirement`, `changedPathsFromGit`, `newChangedPaths`, `changedPathContentSnapshot`, `changedPathsWithSnapshotDrift`, `snapshotFileContent`, `formatLaneList`, `laneNames`, `validateLaneFiles`, `runNode`, `runLane`, `runAuditDrift`, `printClassification`, `printList`, `main` |
| `scripts/sync-native-runtime.mjs` | 0 | top-level native repo sync authority |
| `scripts/test-lane-config.mjs` | 0 | declarative lane matrix and file classification data |
| `website/app/[slug]/page.js` | 3 | `generateStaticParams`, `generateMetadata`, `DetailPage` |
| `website/app/downloads/page.js` | 3 | `ExternalTextLink`, `DownloadCard`, `DownloadsPage` |
| `website/app/layout.js` | 1 | `RootLayout` |
| `website/app/not-found.js` | 1 | `NotFound` |
| `website/app/page.js` | 3 | `FeaturedPlatformCard`, `ShortcutCard`, `HomePage` |
| `website/app/privacy/page.js` | 5 | `PolicyLink`, `BulletList`, `CardGrid`, `PolicySection`, `PrivacyPage` |
| `website/app/robots.js` | 1 | `robots` |
| `website/app/sitemap.js` | 1 | `sitemap` |
| `website/app/terms/page.js` | 1 | `TermsPage` |
| `website/components/browser-logo-rail.js` | 1 | `BrowserLogoRail` |
| `website/components/footer-signal-art.js` | 20 | canvas footer signal helpers, recommendation-card drawing, and lifecycle closures |
| `website/components/hero-video.js` | 2 | `HeroVideo`, effect-managed playback / visibility observer |
| `website/components/marketing-ui.js` | 5 | `Panel`, `SectionHeading`, `StatPill`, `ActionInner`, `ActionLink` |
| `website/components/reveal.js` | 1 | `Reveal` |
| `website/components/route-content.js` | 0 | platform/product/download/browser public data |
| `website/components/scene-controller.js` | 5 | `getSceneForHour`, `getNextSceneBoundary`, `SceneController`, nested scheduler/visibility handlers |
| `website/components/scenic-detail-page.js` | 3 | `formatRelatedTitles`, `RelatedCard`, `ScenicDetailPage` |
| `website/components/scenic-illustration.js` | 3 | `Tree`, `Lamp`, `ScenicIllustration` |
| `website/components/scenic-tones.js` | 1 | `getTonePreset` |
| `website/components/site-data.js` | 0 | legacy/static homepage data and FAQ copy |
| `website/components/site-footer.js` | 2 | `FooterLink`, `SiteFooter` |
| `website/components/site-header.js` | 3 | `NavLink`, `SiteHeader`, nested `toggleMenu` |
| `website/components/site-shell-data.js` | 0 | canonical nav/platform slug data |
| `website/components/theme-toggle.js` | 8 | theme normalization, storage sync, event sync, user toggle |

## Public / Release Authority Surfaces

| Surface | Current authority | Proof | Risk |
| --- | --- | --- | --- |
| Extension package contents | `build.js` copies `js`, `css`, `html`, `icons`, `data`, and `assets`, then writes browser-specific `manifest.json` and zips each target. | `build.js:30`, `108`, `122`, `133`, `147`, `183` | Release ZIP content is broad; quarantined or generated files must stay classified before packaging. |
| Generated UI shell freshness | Normal `build.js` invokes `node scripts/build-extension-ui.mjs`; that script writes `js/ui-shell/popup-shell.js` and `js/ui-shell/tab-view-decor.js`. | `build.js:82`, `scripts/build-extension-ui.mjs:8`, `23`, `28` | Generated shell files should not be hand-audited as source truth unless freshness is proven. |
| README mutation during build | `build.js` always calls `updateReadmeBadges(VERSION)`, then rewrites `README.md`. | `build.js:86`, `656`, `690`, `711` | A normal package build mutates public docs, so release automation can create unrelated dirty changes or publish badge-only drift. |
| Mobile artifact staging | Android artifacts are opt-in via CLI/env/prompt, filtered by filename and current package version, copied to `dist/mobile`, and checksummed. The artifact directory prompt treats blank, `y`, `yes`, and `default` as the displayed default directory. | `build.js:34`, `56`, `216`, `239`, `258`, `263`, `267`, `283`, `295`, `304` | Good checksum baseline and safer version selection, but no release manifest proves signing fingerprint, Play/internal state, or website CTA readiness. |
| GitHub release creation | The script creates a non-draft, non-prerelease GitHub release before uploading assets. | `build.js:365`, `378`, `536`, `541`, `561` | If asset upload fails after release creation, users can see a public release missing ZIP/APK/checksum assets. |
| Non-interactive release path | Non-TTY builds skip release publishing instead of offering dry-run/CI publish semantics. | `build.js:343` | CI cannot currently be the release authority without another wrapper. |
| Vendor Nanah bundle | `scripts/build-nanah-vendor.mjs` resolves `../nanah` and exposes merged Core/Client on `window.FilterTubeNanah`. | `scripts/build-nanah-vendor.mjs:9`, `30`, `33`, `38`, `50` | The public repo does not prove the committed vendor bundle matches the intended Nanah source revision. |
| Native app runtime sync | `scripts/sync-native-runtime.mjs` delegates to a sibling/private app repo script via `FILTERTUBE_APP_REPO` or `../FilterTubeApp`. | `scripts/sync-native-runtime.mjs:6`, `9`, `21` | Native apps can ship stale extension runtime if this sync is not run and hash-verified before app release. |
| Website analytics | `RootLayout` imports and renders Vercel Analytics on the website only. | `website/app/layout.js:7`, `125`; `website/app/privacy/page.js:667` | Privacy copy must keep saying website-only; extension/app manifests must not imply analytics runtime. |
| Website direct APK CTA | Downloads page links "Direct APK releases" to the latest GitHub release while the same page says signed APK/checksum should be attached when ready. | `website/app/downloads/page.js:20`, `54`, `91`, `231`, `351` | The CTA can be reachable before a signed APK/checksum/fingerprint manifest exists. |
| Third-party logo CDN | Browser logos are remote CDN URLs rendered as normal `<img>` elements. | `website/components/route-content.js:35`, `41`, `47`, `53`, `59`, `65`; `website/components/browser-logo-rail.js:37` | Website privacy should mention third-party asset requests or the logos should be local. |
| Hero video preload | Homepage delegates to `HeroVideo`; the component uses `preload="metadata"`, IntersectionObserver playback, visibility pause, and reduced-motion pause. | `website/app/page.js:5`, `180`; `website/components/hero-video.js:18`, `28`, `31`, `42`, `55`; `website/components/route-content.js:20` | This reduces the old eager preload risk, but the route still ships a large hero media surface that needs route/render and device budget proof before making performance claims. |
| Platform status copy | Platform detail data says Android/iOS are in final release testing and TV is a separate path. | `website/components/route-content.js:346`, `488`, `699`; `website/app/downloads/page.js:215` | Public status copy needs artifact/store proof before changing from testing to available. |
| Sitemap freshness | Sitemap uses a static `lastModified` date for all routes. | `website/app/sitemap.js:3`, `8` | Public route freshness can drift from real website changes. |

## Build / Release Flow

```text
package.json version
        |
        v
build.js main()
        |
        +--> build extension UI shell
        +--> mutate README badges
        +--> copy common source directories
        +--> rewrite target manifest order
        +--> zip browser builds
        +--> optionally copy APK/AAB + sha256
        +--> maybe create GitHub release
                 |
                 +--> create public release first
                 +--> upload assets one by one
```

Risk center:

```text
public release page can exist before every expected asset upload succeeds
```

Safer future shape:

```text
build artifacts -> release manifest/checksums -> dry-run validation
        |
        v
create draft release -> upload all assets -> verify asset list -> publish
```

## Website Claim Flow

```text
route-content.js / site-shell-data.js / downloads page copy
        |
        +--> homepage platform cards
        +--> detail pages
        +--> downloads CTAs
        +--> footer/header/sitemap
        +--> privacy and terms pages
```

Risk center:

```text
public copy can move faster than artifact/store proof
```

The website is now deployment-scoped to the `website` root in Vercel, but the
repo still needs local proof that public claims are backed by release assets:

```text
claim: Android direct APK available
proof: GitHub release has signed APK + .sha256 + signing fingerprint

claim: iOS available
proof: TestFlight/App Store link is approved and linked

claim: TV available
proof: separate package/listing exists; not bundled into mobile app
```

## High-Confidence Findings

1. **Release publishing is not atomic.**
   `createGitHubRelease()` publishes `draft: false` before
   `uploadReleaseAsset()` has uploaded the expected files. A failed upload can
   leave a public release with missing ZIP/APK/checksum artifacts.

2. **Normal builds mutate README.**
   Badge mutation runs as part of `main()`. That makes every build a potential
   documentation edit and weakens reproducibility unless README mutation is a
   separate explicit command.

3. **Mobile artifact checksums exist, but there is no release manifest.**
   The script writes `.sha256` files for copied APK/AAB artifacts, but the
   website and release body do not consume a manifest that proves artifact
   filename, versionCode, package name, signer fingerprint, and availability
   state.

4. **Vendor/protocol freshness is not proven.**
   The Nanah bundle is built from a sibling `../nanah` checkout and then
   committed as `js/vendor/nanah.bundle.js`. The audit needs a source revision
   or hash provenance check before treating the vendor bundle as current.

5. **Native app runtime freshness is not proven.**
   Runtime sync into `/Users/devanshvarshney/FilterTubeApp` is delegated to a
   sibling repo. The public repo needs a recorded hash comparison before an app
   release claims extension parity.

6. **Website privacy is correctly scoped, but remote website assets add another
   third-party request class.**
   The privacy page scopes Vercel Analytics to `filtertube.in`, which is good.
   Browser logos still load from cdnjs, so either privacy copy should mention
   website asset/CDN requests or the logos should be local.

7. **Download claims need artifact gates.**
   The downloads page already says direct APKs should be signed and
   checksummed. The CTA still points to latest GitHub release without checking
   whether that release contains a signed APK and checksum.

8. **Website media can affect low-end visitors.**
   The homepage hero video preloads automatically. That is separate from
   YouTube filtering lag, but it matters for public website perceived
   performance.

## Required Follow-Up Proof

| Requirement | Proof needed before implementation/release confidence |
| --- | --- |
| Release ZIPs are complete | A manifest of expected ZIP names, checksums, package versions, and browser manifests. |
| GitHub release is safe | Draft-first release workflow or preflight that proves all assets exist before public publish. |
| Direct APK CTA is safe | Artifact manifest with package name, versionName, versionCode, SHA-256, signing fingerprint, and release URL. |
| Nanah bundle is current | Source revision/hash from `../nanah` plus bundle hash stored in repo or generated manifest. |
| Native app parity is current | Hash comparison between extension runtime assets and native app copied runtime before app build. |
| Website privacy is complete | Website third-party asset requests either removed/localized or explicitly listed. |
| Website status copy is truthful | Store/TestFlight/Play/GitHub proof linked before "available" language replaces "testing". |
| Website performance is bounded | Video sizes/preload policy and reduced-motion behavior tested on mobile. |

## Fixture Coverage

Executable current-behavior fixtures are in:

```text
tests/runtime/build-website-callable-current-behavior.test.mjs
```

They pin:

- 31 accounted build/website files.
- 141 lexical build/website callables.
- public surfaces for release scripts, vendor/native sync, website app routes,
  website components, and public claim data.
- high-risk source patterns for README mutation, non-atomic GitHub release,
  mobile artifact staging, vendor/native drift, website analytics scope,
  direct APK claims, remote logo CDN requests, hero video preload, and static
  sitemap dates.

## Build Script Method Semantic Addendum - 2026-05-27

`docs/audit/FILTERTUBE_BUILD_SCRIPT_METHOD_SEMANTIC_REGISTER_2026-05-27.md`
extends this broad build/website callable audit for `build.js` specifically.
It pins 29 lexical callable rows across 9 semantic method groups: package copy,
build orchestration, manifest rewrite, ZIP artifact creation, mobile artifact
staging, release body generation, release publication, interactive prompts, and
README badge mutation.

That addendum now includes the 2026-06-01 mobile artifact prompt guard. It does
not approve package cleanup, draft-first release changes, README mutation
changes, mobile artifact publication, manifest validation, ZIP checksum
generation, or public release claim changes.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this website/build-route surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, website route behavior, website public copy,
deployment claims, remote request changes, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
