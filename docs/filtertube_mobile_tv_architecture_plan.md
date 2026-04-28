# FilterTube Mobile and TV Architecture Plan

## 1. Product Positioning

FilterTube mobile and TV should be positioned as **a supervised viewing environment for YouTube and YouTube Kids**.

That means:

- It is not a patched YouTube client. The app should not depend on private YouTube internals for its core feed or playback path.
- It is not an official YouTube app. The shell, profile model, PIN controls, sync, and supervision model are FilterTube-owned.
- It is not a YouTube clone. FilterTube should use YouTube's own served web surfaces for content rendering in MVP, while owning supervision and control layers around them.
- It is not an ad-blocking product. The product goal is supervised viewing, profile isolation, filtering, and private user-owned controls.

The product promise should stay stable across Android, iPhone, iPad, Android TV, and Fire TV:

- supervised viewing
- user-owned rules
- child-aware profiles
- private device-to-device sync
- local-first settings and filtering

## 2. Evidence From YouTube APK Research

- **Observed**: The APK reports show a native watch shell with classes and layouts around `watchwhile.MainActivity`, `NextGenWatchLayout`, and `NextGenWatchContainerLayout`. This is direct evidence that the YouTube Android app does not behave like a thin browser wrapper for core watch UX.
- **Observed**: The reports found protobuf and InnerTube-style request-response clues, including `InnertubeBrowseService$BrowseResponse`, `responseContext`, request IDs for browse/player/watch/watch-next flows, and framed parsing paths through Cronet callbacks. This supports a native request/response pipeline rather than DOM-only behavior.
- **Observed**: Cronet plus framed protobuf response handling appears in the APK evidence through classes like `acrh` and `acpq`. This is a real transport clue, not a generic guess.
- **Observed**: Phase-2 tracing identified concrete request and parser seams around `aiaa`, `aiab`, `aguc`, `ahqy`, `ahqx`, `aoep`, and `apfm`, including explicit handling for continuation fields, panel requests, parsed proto results, and WatchNext request wiring.
- **Observed**: The APK evidence now shows watch-next and continuation as first-class boundaries rather than incidental feed details. `WatchNextRequest`, `watch_next_proto`, `player_response_tracking_params`, continuation variants, and prefetch policy types are all present in traced code.
- **Observed**: Player and media clues point to native fullscreen and playback seams rather than browser-only playback ownership.
- **Observed**: The native watch shell exposes explicit activity-level back handling, PiP state updates, player visibility/fullscreen/minimized flags, and multiple stacked watch containers. This is direct evidence that lifecycle transitions are native-owned.
- **Observed**: WebView exists, but the reports place it in fallback or peripheral roles such as `WebViewFallbackActivity`, not as the main watch surface.
- **Observed**: Additional WebView evidence from `aqub` and `aqtn` shows YouTube managing WebView lifecycle, cookies, and use-case routing as a separate subsystem rather than as the core watch architecture.
- **Observed**: Kids-specific allowlist and blacklist mutation clues exist in the APK reports. That is evidence that supervised/kids behavior is treated as a first-class product surface in YouTube's own mobile architecture.
- **Observed**: Client and surface distinctions exist for phone, tablet, shorts, and kids clients. The APK evidence includes multiple client/surface markers rather than a single undifferentiated mobile runtime.
- **Likely**: Smoothness in the official app comes from owning native seams around navigation, playback, lifecycle, continuation/watch-next state, response parsing, and restoration behavior, not just from faster rendering.
- **Likely**: FilterTube should not try to replicate YouTube's native request stack for MVP. The evidence shows it exists, but it is too coupled, too private, and too expensive to chase safely.
- **Likely**: FilterTube should mirror the separation of concerns, not the private protocol stack: native shell for authority and lifecycle, managed web surface for content, and a local filtering runtime that treats watch-next/continuation state as explicit app state.
- **Possible**: A later FilterTube mobile runtime could selectively adopt more native overlays or native-managed render surfaces for supervision-heavy UI if WebView-based seams are not sufficient.
- **Unclear**: The exact minimum subset of native player/lifecycle behavior required to make TV input, fullscreen transitions, and PiP feel acceptable in FilterTube is not yet proven and needs prototyping.

## 3. Architecture Decision

| Option | Pros | Cons | Risk | Build speed | Maintenance | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| A. Full native YouTube-like client | Best long-term control over UX, playback seams, and performance if fully achieved | Requires private request/model work, feed/player rebuild, brittle reverse-engineering dependency, huge scope | Very high | Very slow | Very high | No for MVP |
| B. Chromium fork | Strong browser control, early injection, deep runtime hooks | Massive platform and maintenance burden, weak App Store posture, TV complexity, not aligned with current FilterTube codebase | Very high | Very slow | Very high | No |
| C. Native shell + WebView/WKWebView | Fastest path to supervised product, native control over profiles/PIN/sync, reuses existing JS filtering runtime, avoids private playback/feed rebuild | Need careful injection timing, fullscreen/back-stack handling, DOM/schema drift, TV WebView risk | Medium | Fast | Medium | Yes, recommended |
| D. React Native shell + WebView | Cross-platform shell reuse, faster UI iteration, shared JS at shell layer | Adds abstraction over the exact seams that matter most: fullscreen, bridge timing, TV input, lifecycle, WebView control | Medium-high | Medium | Medium-high | Not recommended as primary path |
| E. Flutter shell + WebView | Strong custom UI toolkit, consistent shell visuals | Same core WebView seam problems, larger divergence from current web/native logic, TV and platform integration complexity | Medium-high | Medium | Medium-high | Not recommended as primary path |

Decision:

- **MVP**: native shell + WebView/WKWebView
- **Advanced later**: selective native surfaces, stronger native overlays, local renderer for FilterTube-owned controls
- **Do not use private InnerTube APIs for core playback/feed**

Reason:

- The APK evidence shows where YouTube gains smoothness: native shell, native playback seams, and native request/lifecycle ownership.
- The newer trace strengthens that conclusion by showing explicit continuation, watch-next, cache, prefetch, and restoration boundaries that are kept outside ad hoc page state.
- FilterTube does not need to rebuild all of that to ship a useful product.
- FilterTube does need to own the seams that matter for supervision: profile authority, launch routing, PIN gating, overlay control, sync, import/export, and parent escape paths.

## 4. Native Shell Responsibilities

The native app should own all authority and supervision concerns.

- profile selection
- child/master profile separation
- PIN gate and unlock lifecycle
- trusted-device sync via Nanah
- import/export, including encrypted export flows
- default launch target
- YouTube Main vs YouTube Kids switch
- fullscreen control overlay owned by FilterTube
- parent escape hatch from child viewing surfaces
- back-stack policy
- orientation policy
- lock mode and post-unlock timeouts
- settings and profile management
- emergency reset and local recovery
- onboarding and explainers
- OS-level bypass guidance for Screen Time / Family Link / device owner setup

More concretely:

- Native decides which profile is active before the web surface loads.
- Native decides whether the web surface is allowed to mutate settings.
- Native decides whether the user is in Main or Kids mode.
- Native shows the parent overlay even when the managed web surface is fullscreen.
- Native owns profile locks and does not trust JavaScript alone for profile authority.
- Native should persist and restore shell state such as current surface, last-safe navigation target, fullscreen/minimized mode intent, and last-known watch context.
- Native should keep watch-next and back-navigation restoration state outside raw WebView history whenever possible.

## 5. Managed YouTube Surface Responsibilities

The managed web surface should own what YouTube already serves well:

- YouTube login and session cookies
- YouTube Main web surface
- YouTube Kids web surface
- video playback as served by YouTube web
- feed rendering
- account switching inside the YouTube surface
- comments, recommendations, and search as served by YouTube

FilterTube should not try to replace these in MVP. The shell should manage them, instrument them, and constrain them.

## 6. FilterTube Runtime Inside Web Surface

Current extension structure already suggests a reusable app runtime split.

Files inspected:

- [content_bridge.js](/Users/devanshvarshney/FilterTube/js/content_bridge.js)
- [injector.js](/Users/devanshvarshney/FilterTube/js/injector.js)
- [filter_logic.js](/Users/devanshvarshney/FilterTube/js/filter_logic.js)
- [background.js](/Users/devanshvarshney/FilterTube/js/background.js)
- [state_manager.js](/Users/devanshvarshney/FilterTube/js/state_manager.js)
- [identity.js](/Users/devanshvarshney/FilterTube/js/shared/identity.js)

Recommended adaptation:

- **App-native storage bridge**: replace extension storage and background-page assumptions with native-owned storage APIs.
- **WebView injected JS**: keep an injected FilterTube runtime that runs early in page lifecycle and can observe DOM plus page JSON hooks.
- **Message bridge**:
  - Android: `JavascriptInterface` plus structured `postMessage` patterns
  - iOS: `WKScriptMessageHandler`
- **Unified settings payload**: native shell sends a compiled, profile-specific filter payload into the web runtime.
- **Page-shape adapters**:
  - YTD adapter for desktop-like YouTube DOM variants when relevant
  - YTM adapter for `m.youtube.com`
  - YTK adapter for YouTube Kids surface
- **DOM mutation budget**: mutation work must be scheduled, throttled, and stamped to avoid full rescans.
- **JSON/network observation where possible**: preserve the current hybrid approach of observing data payloads early when possible.
- **Fallback DOM stamping**: keep a DOM fallback path when JSON/network hooks drift.
- **Local allow/block matching engine**: keep identity normalization and compiled rule matching local and deterministic.
- **Continuation/watch-next state tracking**: keep page pagination and recommendation boundaries as explicit runtime state rather than only re-reading visible DOM after every transition.

The current extension already operates as a hybrid runtime:

- network/JSON-aware when possible
- DOM fallback when needed
- local compiled settings and identity matching

That model should survive into app runtime.

## 7. App Platform Plans

### Android Phone

- Kotlin native shell
- Android WebView managed surface
- injected JS runtime at document start as early as feasible
- native fullscreen handling around custom view callbacks
- native back-stack handling with parent-aware escape rules
- native PIN/profile authority
- native watch-context restoration for back and profile-switch flows

### Android Tablet

- same Kotlin + WebView runtime
- tablet shell with stronger layout separation
- optional split layout for parent controls and managed surface where it improves supervision
- preserve one runtime, not a separate tablet codebase

### Android TV / Fire TV

- Kotlin native shell
- D-pad remote-first UX
- minimal browser chrome
- large hit targets and obvious launch cards
- profile picker first
- YouTube Main and YouTube Kids launch cards
- remote-optimized PIN entry
- explicit fullscreen exit and parent overlay path
- WebView feasibility is a real risk and must be tested early
- if TV WebView interaction is poor, fallback may need a more constrained surface model rather than pretending phone WebView UX scales to TV
- preserve native focus ownership instead of delegating critical navigation to unpredictable embedded web focus behavior

### iPhone

- Swift native shell
- WKWebView managed surface
- parent control overlay and unlock gate
- Screen Time bypass guidance and parent setup messaging

### iPad

- Swift native shell
- WKWebView managed surface
- tablet shell layout
- possible side panel or inspector-style parent controls where it improves supervision without cluttering viewing

## 8. UX Model

Exact app behavior should be:

- first launch shows two clear entry choices:
  - `Main Viewing`
  - `Kids Viewing`
- user enters one viewing space immediately
- user can then choose whether that viewing space should become the default launch target
- later launches open the saved default directly
- if the chosen default or selected profile is PIN-protected, require profile selection or PIN before access
- create parent PIN
- create or import initial profile state
- choose active profile
- open managed viewing surface
- allow parent overlay reveal from a reserved gesture/button
- enforce child lock state
- allow explicit switching between Main and Kids only through allowed shell controls
- show whitelist/blocklist mode indicator
- show sync state in shell, not by exposing low-level transport internals
- keep offline backup/export in parent settings only
- provide safe exit behavior back to profile picker or locked landing screen
- preserve last-safe watch context where possible so child or parent transitions do not force unnecessary reloads

State diagram:

```text
Launch
  -> Onboarding Required
      -> Choose Main Viewing or Kids Viewing
      -> Optional Set Parent PIN
      -> Create/Import Profile
      -> Optional Save Default Launch
      -> Locked Home
  -> Locked Home
      -> Default Launch Available
          -> Open Saved Viewing Space
      -> Parent Unlock
          -> Profile Picker
              -> Open Main Surface
              -> Open Kids Surface
      -> Child Quick Entry
          -> Child Profile Surface
              -> Parent Overlay
                  -> Switch Profile
                  -> Change Surface
                  -> Sync / Export / Settings (parent only)
```

Viewing state model:

```text
Profile Active
  -> Managed Web Surface Loaded
      -> FilterTube Runtime Attached
          -> Rules Applied
              -> Normal Viewing
              -> Fullscreen Viewing
              -> Parent Overlay Reveal
              -> Safe Exit
```

## 9. Security / Trust / Sync Model

Use current FilterTube and Nanah direction.

- local-first settings
- device pairing
- trusted devices
- no central rules server
- encrypted export
- PIN-gated mutation
- child cannot change mode
- web-surface JavaScript cannot directly mutate settings without native bridge authorization

Authority rules:

- Native owns source of truth for active profile and lock state.
- Native signs or authorizes settings mutations before persisting them.
- Injected JS can request, read, and report state, but should not bypass native authorization.
- Nanah remains device-to-device, with relay only as meeting place for session setup.

## 10. Compatibility Strategy

Handle variation explicitly.

- YTD, YTM, YTK each need their own adapter boundaries.
- mobile and tablet responsive differences should not be hidden inside one giant selector file.
- YouTube experiments and DOM/schema drift should degrade through layered fallbacks.
- performance problems should be treated as mutation-budget and matching-cost problems, not only UI problems.
- when network JSON paths change, fall back to DOM stamping until adapters are updated.
- watch-next and continuation handling should have their own runtime contracts so feed pagination and related-video updates do not devolve into full rescans.

Recommended compatibility layers:

- adapter detection per page/surface
- compiled selector and matcher tables per surface
- feature flags for risky hooks
- telemetry for adapter misses and filter fallback rates

## 11. Performance Strategy

Use the APK findings as inspiration for owning the right seams, not for copying private internals.

- precompute compiled settings per profile
- cache channel identity matches
- avoid full page scans
- throttle mutation observers
- stamp DOM nodes once processed
- batch updates
- send a native-side compiled filter payload into JS rather than recompiling repeatedly inside the page
- avoid expensive regex loops per mutation burst
- keep semantic and thumbnail ML as later optional layers
- keep lightweight caches for recent watch-next and continuation decisions to reduce jank on back navigation and repeated recommendation refreshes

Practical runtime rules:

- do not scan the whole feed after every mutation
- prefer incremental processing queues
- preserve identity normalization caches
- separate parser adapters from matcher engine
- keep bridge calls coarse enough to avoid chatty cross-process overhead

## 12. Review / Store Positioning

Engineering-focused positioning should use wording like:

- supervised viewing environment
- user-owned controls
- private sync
- local-first rules
- not affiliated with YouTube or Google
- does not remove ads or modify YouTube service monetization
- parents should use Screen Time, Family Link, or equivalent device-level controls for non-bypassable setup

Avoid store copy that implies:

- official YouTube partnership
- ad blocking
- server-side control over user accounts
- rebuilt YouTube playback internals

## 13. MVP Build Plan

### Phase 0

- Android prototype WebView with `youtube.com` and `youtubekids.com`
- inject simple JS
- message bridge
- test login/session
- test fullscreen
- test back button

### Phase 1

- port FilterTube compiled settings into app runtime
- basic blocklist and whitelist on YTM, YTD, YTK
- local storage
- parent PIN

### Phase 2

- profiles
- Nanah sync
- import/export
- TV shell

### Phase 3

- iOS and iPad
- performance hardening
- store release prep

### Phase 4

- semantic and thumbnail ML
- stronger native overlays
- advanced UX polish

## 14. Open Technical Questions

Exact questions requiring prototypes:

- Can Android WebView reliably open YouTube Main and YouTube Kids with stable session behavior?
- Can WebView fullscreen video be controlled well enough for parent overlay, safe exit, and rotation policy?
- Can the FilterTube runtime inject early enough to avoid visible flash on key surfaces?
- Does YouTube Kids behave acceptably in Android WebView?
- How does `m.youtube.com` behave on tablet-sized WebView?
- Can Android TV WebView handle D-pad input acceptably?
- Does WKWebView allow enough timing and bridge control for the current hybrid filtering model?
- How do we stop the app from feeling like a thin wrapper instead of a supervised viewing product?
- Can FilterTube preserve watch-next and continuation state cleanly enough to avoid jarring reloads on back, unlock, and profile-switch paths?

## 15. Immediate Next Engineering Tasks

Next 7 days:

1. Create Android Studio project.
2. Build Kotlin shell with single WebView host.
3. Load YouTube Main.
4. Load YouTube Kids.
5. Implement first-run two-button launcher for Main Viewing and Kids Viewing.
6. Implement saved default launch target behavior.
7. Gate PIN-protected launch targets behind profile selection or PIN.
8. Inject hello-world JS at document start.
9. Build native-to-JS round trip.
10. Build JS-to-native round trip.
11. Capture page-shape signatures for YTD.
12. Capture page-shape signatures for YTM.
13. Capture page-shape signatures for YTK.
14. Implement minimal hide Shorts toggle.
15. Implement parent overlay shell.
16. Implement parent PIN setup.
17. Test fullscreen entry and exit.
18. Test Android back behavior across feed/watch/fullscreen.
19. Build native storage abstraction for profile settings.
20. Port identity matcher helpers into shared app runtime bundle.
21. Prototype compiled settings payload injection.
22. Measure mutation observer cost on heavy pages.
23. Write adapter telemetry logs for misses and fallback activation.
24. Prototype watch-next context capture and restore.
25. Prototype continuation-state-aware filtering on feed pagination.
