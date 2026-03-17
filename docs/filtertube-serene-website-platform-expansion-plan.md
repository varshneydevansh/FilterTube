# Plan: FilterTube serene website and platform expansion

**Generated**: 2026-03-16
**Estimated Complexity**: High

## Overview

Redesign the FilterTube website into a fully coherent serene brand experience that extends the current scenic hero treatment across the full site, adds dedicated pages for future platforms, improves readability and information hierarchy, and introduces time-of-day visual theming that is separate from light/dark mode.

The implementation should keep the current website-only scope inside `/Users/devanshvarshney/FilterTube/website`, preserve the browser extension as the currently shipping desktop product, and present future app surfaces as clear product direction without implying already-released functionality.

## Assumptions

- Phase focus is the website only. No mobile app or TV app code is being built in this workstream.
- The current Next.js App Router site in `/Users/devanshvarshney/FilterTube/website` remains the active stack.
- The current scenic video hero stays as the homepage anchor and will be refined, not replaced.
- The `See how FilterTube works` CTA will point to `https://m.youtube.com/watch?v=dmLUu3lm7dE` until the user swaps in a future demo video.
- Time-based theming is based on the visitor’s local device time only, not geolocation or weather.
- Red is a signal accent for key protective states, selective word emphasis, and trust markers, not a dominant full-page wash.

## Prerequisites

- Existing Next.js 16 / React 19 / Tailwind CSS 4 setup in [`website/package.json`](/Users/devanshvarshney/FilterTube/website/package.json)
- Product context from:
  - [`README.md`](/Users/devanshvarshney/FilterTube/README.md)
  - [`docs/MOBILE_APP_UI_SPEC.md`](/Users/devanshvarshney/FilterTube/docs/MOBILE_APP_UI_SPEC.md)
  - [`docs/YOUTUBE_KIDS_INTEGRATION.md`](/Users/devanshvarshney/FilterTube/docs/YOUTUBE_KIDS_INTEGRATION.md)
  - [`docs/DATA_PORTABILITY_SYNC_WHITELIST_PLAN.md`](/Users/devanshvarshney/FilterTube/docs/DATA_PORTABILITY_SYNC_WHITELIST_PLAN.md)
- Existing homepage shell and shared components in:
  - [`website/app/layout.js`](/Users/devanshvarshney/FilterTube/website/app/layout.js)
  - [`website/app/page.js`](/Users/devanshvarshney/FilterTube/website/app/page.js)
  - [`website/components/site-header.js`](/Users/devanshvarshney/FilterTube/website/components/site-header.js)
  - [`website/components/site-data.js`](/Users/devanshvarshney/FilterTube/website/components/site-data.js)
- Direct browser-store URLs already present in website data

## Sprint 1: Information architecture and serene design system
**Goal**: Lock the global website structure, page taxonomy, readability rules, and the serene visual system so the rest of the work can be implemented without rework.

**Demo/Validation**:
- Review a route map and component map for the new site
- Review a token sheet covering palette, type roles, highlight behavior, and time-of-day variants
- Confirm future-product messaging is explicit about what ships today vs later

### Task 1.1: Define final route architecture
- **Location**:
  - [`website/app`](/Users/devanshvarshney/FilterTube/website/app)
  - [`website/components/site-data.js`](/Users/devanshvarshney/FilterTube/website/components/site-data.js)
- **Description**: Define the full website route set and navigation hierarchy, including homepage, privacy, terms, Kids, ML/AI, and dedicated platform pages for iOS, iPadOS, Android, Android TV, and Amazon Fire TV.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Route plan distinguishes between “shipping now” and “planned platform” pages
  - Route naming is internally consistent and future-friendly
  - Global nav remains concise even though the site grows
- **Validation**:
  - Review markdown route table
  - Confirm no route collapses unrelated stories into one vague “Platforms” page

### Task 1.2: Define serene visual tokens and emphasis rules
- **Location**:
  - [`website/app/globals.css`](/Users/devanshvarshney/FilterTube/website/app/globals.css)
  - new token notes in plan/design docs
- **Description**: Define color roles, typography rules, spacing rhythm, glass treatments, content-width limits, and a highlight system that uses muted red for protective emphasis and calmer supporting tones for secondary emphasis.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - One primary accent only
  - Highlight behavior is explicit:
    - red for protection, blocked-state cues, signal rails, and short callouts
    - neutral white/cream for surfaces
    - calm secondary support tones for informational accents
  - Body text contrast and line length rules are defined
- **Validation**:
  - Review token list against WCAG contrast targets
  - Confirm no page depends on low-contrast text over video

### Task 1.3: Define time-of-day theming model
- **Location**:
  - [`website/app/layout.js`](/Users/devanshvarshney/FilterTube/website/app/layout.js)
  - new client theme utility under `website/components` or `website/lib`
- **Description**: Specify a client-safe time-scene system with four states such as dawn, day, sunset, and night that modifies scenic treatment independently from any later light/dark mode.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - Time scenes are derived from local hour only
  - SSR-safe fallback state is defined
  - Hydration mismatch avoidance is explicitly designed
  - Each scene has restrained changes to mood, not a full redesign
- **Validation**:
  - Review state table with local-hour ranges
  - Confirm implementation plan avoids `Date.now()` rendering differences on the server

### Task 1.4: Define page-specific art direction
- **Location**:
  - homepage and future route specs in this plan
- **Description**: Assign a visual identity and content tone to each dedicated page:
  - homepage: serene trust and broad product story
  - Kids: calm family safety, whitelist confidence
  - ML/AI: local intelligence, semantic filtering, future thumbnail analysis
  - iOS/iPadOS: editorial control surface and native trust
  - Android: utility, flexibility, power-user confidence
  - Android TV / Amazon Fire TV: living-room safety and shared-screen calm
- **Dependencies**: Task 1.1, Task 1.2
- **Acceptance Criteria**:
  - Every page has a distinct hero mood and problem statement
  - The brand still feels like one product family
- **Validation**:
  - Review page-by-page art direction matrix

### Task 1.5: Define content model and media inventory
- **Location**:
  - [`website/components/site-data.js`](/Users/devanshvarshney/FilterTube/website/components/site-data.js)
  - planned `website/lib` or `website/content` module
- **Description**: Define a shared content model for route metadata, CTA links, browser store destinations, roadmap labels, and page-specific scenic media references so the growing site does not hardcode content in multiple page files.
- **Dependencies**: Task 1.1, Task 1.4
- **Acceptance Criteria**:
  - Shared CTA/video/store-link config is planned
  - Route content can evolve without deep JSX rewrites
  - Media requirements are explicit for each future page
- **Validation**:
  - Review content schema and route inventory
  - Confirm homepage video CTA and browser links can be changed from config

## Sprint 2: Global shell, navigation, footer, and responsive design foundation
**Goal**: Build the reusable shell and page infrastructure that supports the expanded serene site on mobile, tablet, desktop, and large displays.

**Demo/Validation**:
- Run local site with updated shell and navigation
- Verify mobile nav, tablet spacing, and footer behavior on core breakpoints
- Verify store-link access and legal routes remain available

### Task 2.1: Refactor global navigation into scalable IA
- **Location**:
  - [`website/components/site-header.js`](/Users/devanshvarshney/FilterTube/website/components/site-header.js)
  - [`website/components/site-data.js`](/Users/devanshvarshney/FilterTube/website/components/site-data.js)
- **Description**: Refactor the floating nav to support current and future sections without clutter, including a primary CTA, desktop nav, mobile overlay, and likely a compact “Platforms” entry that expands within page content instead of overloading the top bar.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Mobile nav remains touch-friendly with 44px+ targets
  - Nav labels stay concise
  - CTA hierarchy is clear and consistent
- **Validation**:
  - Manual test on mobile and desktop widths
  - Verify anchor navigation and page routes

### Task 2.2: Build a premium browser availability rail
- **Location**:
  - [`website/components/site-data.js`](/Users/devanshvarshney/FilterTube/website/components/site-data.js)
  - homepage or shared browser-install component
- **Description**: Replace text-only browser support with branded browser logos and direct store links for Chrome, Firefox, Edge, Brave, and Opera, while preserving readable fallback labels.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - Browser icons are visually consistent and accessible
  - Every icon and label goes to the correct store/release target
  - On small screens, the rail wraps cleanly or becomes a horizontal scroller
- **Validation**:
  - Verify all outbound links
  - Responsive check at phone, tablet, laptop widths

### Task 2.3: Redesign footer as a serene destination
- **Location**:
  - [`website/components/site-footer.js`](/Users/devanshvarshney/FilterTube/website/components/site-footer.js)
- **Description**: Rebuild the footer as a more cinematic, art-led closing section inspired by the antigravity-style sense of wonder https://antigravity.google/ https://www.generalintelligencecompany.com/ , but adapted to FilterTube’s serene trust tone and legal/resource needs.
- **Dependencies**: Task 1.4
- **Acceptance Criteria**:
  - Footer feels like a visual ending, not a utility dump
  - Privacy, terms, docs, GitHub, and support links stay easy to find
  - Motion remains subtle and GPU-safe
- **Validation**:
  - Visual review at full-page scroll end
  - Confirm all legal/resource links remain present

### Task 2.4: Establish responsive content primitives
- **Location**:
  - [`website/components/marketing-ui.js`](/Users/devanshvarshney/FilterTube/website/components/marketing-ui.js)
  - [`website/app/globals.css`](/Users/devanshvarshney/FilterTube/website/app/globals.css)
- **Description**: Create reusable responsive primitives for hero stacks, media panels, story blocks, install rails, page intros, and comparison sections that collapse correctly across mobile, tablet, and desktop.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - No layout depends on fragile width math
  - Tablet layouts are intentional, not scaled-up mobile
  - Copy widths stay readable across all screens
- **Validation**:
  - Viewport checks for 390px, 430px, 768px, 834px, 1024px, 1440px

### Task 2.5: Create reusable route-intro and platform-hub templates
- **Location**:
  - shared components under `website/components`
- **Description**: Build templates for platform overview pages and dedicated subpages so `/mobile`, `/tv`, and their child routes share consistent structure without duplicating hero, CTA, status-label, and comparison logic.
- **Dependencies**: Task 1.1, Task 1.5, Task 2.4
- **Acceptance Criteria**:
  - A route hub can list child platform pages without bespoke layout work every time
  - Child pages can still have distinct art direction and copy blocks
- **Validation**:
  - Review component API and sample mock route structure

## Sprint 3: Homepage expansion and hero refinement
**Goal**: Turn the current homepage into a full serene storytelling experience from hero to footer, keeping the reference quality across the entire page rather than only the top fold.

**Demo/Validation**:
- Homepage feels visually coherent from hero through footer
- CTA video link opens the current demo video
- Key product details are clearer and more readable than before

### Task 3.1: Refine the homepage hero for durable readability
- **Location**:
  - [`website/app/page.js`](/Users/devanshvarshney/FilterTube/website/app/page.js)
  - [`website/app/globals.css`](/Users/devanshvarshney/FilterTube/website/app/globals.css)
- **Description**: Tune the scenic hero so it remains readable across the entire video loop using typography, selective glass surfaces, soft shadows, and accent strategy rather than heavy dark overlays.
- **Dependencies**: Sprint 2
- **Acceptance Criteria**:
  - Headline remains readable against bright and busy moments of the video
  - Important phrases can receive tasteful accent treatment without reducing elegance
  - `See how FilterTube works` links to the provided video URL from config/data, not hardcoded deep in the markup
- **Validation**:
  - Manual review across several points in the video timeline
  - Keyboard and tap testing for both CTAs

### Task 3.2: Rebuild homepage sections in one serene narrative arc
- **Location**:
  - [`website/app/page.js`](/Users/devanshvarshney/FilterTube/website/app/page.js)
  - supporting shared components
- **Description**: Recompose the homepage sections so they carry the serene scenic language through capabilities, story, system architecture, platforms, browser availability, and closing trust statements.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - No section feels like a generic SaaS card block
  - The parent-origin story and local-first privacy message remain central
  - Shorts filtering, Kids mode, and whitelist mode receive explicit, high-visibility treatment
- **Validation**:
  - Content review against README and product docs
  - Visual review for section rhythm and readability

### Task 3.3: Add explicit readability and emphasis patterns
- **Location**:
  - homepage shared copy and style primitives
- **Description**: Introduce controlled emphasis patterns for important details:
  - muted red word emphasis for protection language
  - signal rails for “Protected now” and critical trust claims
  - calm neutral/soft-toned pills for secondary context
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - Red never becomes noisy or overused
  - Selection styles, pills, tags, and cards remain legible on all backgrounds
  - Important product details stand out without feeling like error states
- **Validation**:
  - Contrast review
  - Side-by-side comparison of emphasized vs non-emphasized sections

### Task 3.4: Add resilient loading and fallback states for hero media
- **Location**:
  - homepage hero component(s)
- **Description**: Add graceful behavior for slow video loading, reduced-motion users, and autoplay failure scenarios.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - Hero has a poster or scenic fallback frame
  - Reduced-motion users are not forced through autoplay animation
  - Layout remains stable while media loads
- **Validation**:
  - Test with reduced-motion preference
  - Simulate slow network conditions

## Sprint 4: Dedicated product pages and platform storytelling
**Goal**: Add dedicated, individually designed pages that communicate each future product surface with the right tone, constraints, and user benefit.

**Demo/Validation**:
- Dedicated routes exist and are reachable from the site
- Each page has a distinct hero and content structure
- Future-platform messaging is informative without overpromising

### Task 4.1: Create a platform route structure
- **Location**:
  - `website/app/platforms/*` or explicit top-level routes
- **Description**: Implement the chosen route taxonomy for:
  - `/mobile`
  - `/ios`
  - `/ipados`
  - `/android`
  - `/tv`
  - `/android-tv`
  - `/fire-tv`
  - optionally a platform index page that groups these routes
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - `/mobile` acts as the umbrella for handheld/tablet direction
  - `/tv` acts as the umbrella for living-room surfaces
  - Each route has metadata, hero, and structured sections
  - Route labels remain comprehensible to non-technical users
- **Validation**:
  - Verify route generation and metadata
  - Confirm nav/discovery links reach each page

### Task 4.2: Create a dedicated Kids page
- **Location**:
  - `website/app/kids/page.js`
- **Description**: Build a YouTube Kids-specific page focused on family safety, whitelist confidence, zero-network Kids behavior, and why FilterTube exists.
- **Dependencies**: Sprint 1, Sprint 2
- **Acceptance Criteria**:
  - Page clearly explains the Kids-specific problem and solution
  - Messaging is family-safe, readable, and trust-led
  - Page visuals are distinct from the homepage but clearly same brand
- **Validation**:
  - Review against [`docs/YOUTUBE_KIDS_INTEGRATION.md`](/Users/devanshvarshney/FilterTube/docs/YOUTUBE_KIDS_INTEGRATION.md)

### Task 4.3: Create a dedicated ML/AI page
- **Location**:
  - `website/app/ml-ai/page.js`
- **Description**: Build a page explaining local semantic filtering, keyword/channel intelligence, future thumbnail analysis, and the distinction between current product capability and future roadmap.
- **Dependencies**: Sprint 1, Sprint 2
- **Acceptance Criteria**:
  - Local processing is explicit
  - Future AI/ML work is framed carefully as roadmap, not shipped behavior
  - The design tone communicates precision and trust, not hype
- **Validation**:
  - Review against README roadmap language and data portability plan

### Task 4.4: Build iOS and iPadOS pages from the mobile spec
- **Location**:
  - `website/app/ios/page.js`
  - `website/app/ipados/page.js`
- **Description**: Translate the mobile UI spec into web storytelling pages for iPhone and iPad, highlighting dedicated apps, rules control, profile switching, and protected browsing direction with platform-appropriate tone and art.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - `/mobile` overview links clearly into iOS, iPadOS, and Android stories
  - iOS page emphasizes quick control and native trust
  - iPadOS page emphasizes workspace, overview, and roomy control surfaces
  - Copy stays aligned with the existing mobile spec
- **Validation**:
  - Review against [`docs/MOBILE_APP_UI_SPEC.md`](/Users/devanshvarshney/FilterTube/docs/MOBILE_APP_UI_SPEC.md)

### Task 4.5: Build Android, Android TV, and Amazon Fire TV pages
- **Location**:
  - `website/app/android/page.js`
  - `website/app/android-tv/page.js`
  - `website/app/fire-tv/page.js`
- **Description**: Create dedicated pages that explain the role of Android handheld, Android TV, and Amazon Fire TV apps with distinct problem framing:
  - Android: flexible portable control
  - Android TV: living-room shared-screen filtering
  - Fire TV: family-safe playback and household controls in Amazon’s TV environment
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - `/tv` overview links clearly into Android TV and Fire TV
  - TV pages are clearly different from phone pages
  - Shared-screen concerns are centered
  - Future-app messaging stays honest
- **Validation**:
  - Editorial review of route differentiation

## Sprint 5: Dynamic theming, motion system, and accessibility hardening
**Goal**: Add the dynamic polish layer without sacrificing readability, performance, or hydration safety.

**Demo/Validation**:
- Time-of-day scenes switch correctly based on local time
- No hydration warnings are introduced
- Motion remains elegant and non-disruptive

### Task 5.1: Implement client-only time-scene controller
- **Location**:
  - new client component under `website/components`
  - [`website/app/layout.js`](/Users/devanshvarshney/FilterTube/website/app/layout.js)
  - [`website/app/globals.css`](/Users/devanshvarshney/FilterTube/website/app/globals.css)
- **Description**: Build a client-only theme-scene controller that sets a `data-scene` attribute after hydration using the local hour and updates background variables and scenic mood per route.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Default SSR scene is stable
  - Client enhancement changes only controlled visual variables
  - No server/client random divergence
- **Validation**:
  - Manual tests with mocked hours
  - Confirm absence of hydration warnings

### Task 5.2: Tune route-specific scenic treatments
- **Location**:
  - global CSS plus page-specific sections
- **Description**: Create route-aware scene tuning so each page has its own serene mood while still participating in the time-based system.
- **Dependencies**: Task 5.1, Sprint 4
- **Acceptance Criteria**:
  - Homepage, Kids, ML/AI, iOS, Android, and TV pages all feel distinct
  - Scene changes remain subtle enough for text readability
- **Validation**:
  - Visual QA across routes and time scenes

### Task 5.3: Accessibility and readability hardening pass
- **Location**:
  - all page and component files touched in previous sprints
- **Description**: Perform a full pass on contrast, focus states, tap targets, text wrapping, responsive type scaling, motion reduction, and selection styling.
- **Dependencies**: Sprint 2, Sprint 3, Sprint 4, Task 5.1
- **Acceptance Criteria**:
  - Minimum 44x44 touch targets on interactive mobile controls
  - Clear focus states on all links/buttons
  - Video and scenic media never obscure essential copy
- **Validation**:
  - Keyboard-only navigation pass
  - Responsive QA and contrast checks

### Task 5.4: Performance and media budget pass
- **Location**:
  - hero media handling
  - global CSS and motion utilities
- **Description**: Audit video autoplay behavior, backdrop blur usage, scene transitions, and route media load to keep the experience premium without becoming heavy.
- **Dependencies**: Sprint 3, Sprint 5
- **Acceptance Criteria**:
  - Blur stays mostly in fixed/floating layers
  - Scene transitions use transform/opacity only
  - Large media assets have fallback strategy and preload discipline
- **Validation**:
  - Lighthouse pass
  - Manual low-power/mobile review

## Sprint 6: Verification, content QA, and deployment readiness
**Goal**: Make the expanded website ready for Vercel preview/release with strong QA and low ambiguity.

**Demo/Validation**:
- Production build passes
- Route coverage and metadata are complete
- Vercel deployment path is documented

### Task 6.1: Add metadata, structured linking, and per-page SEO
- **Location**:
  - route `page.js` files
  - sitemap and metadata configuration
- **Description**: Ensure each dedicated page has clear metadata, open graph text, route labels, and internal linking that match its use case.
- **Dependencies**: Sprint 4
- **Acceptance Criteria**:
  - Every route has unique title/description
  - Sitemap and internal link graph include new routes
- **Validation**:
  - Build output review
  - Link crawl/manual route audit

### Task 6.2: End-to-end responsive QA matrix
- **Location**:
  - website routes and shared components
- **Description**: Run a structured responsive QA pass across phone, tablet, laptop, and large desktop sizes, including scenic hero readability at multiple video frames and time scenes.
- **Dependencies**: Sprint 5
- **Acceptance Criteria**:
  - No broken layouts, clipped glass panels, or unreadable copy
  - Platform pages remain distinct and readable on mobile
- **Validation**:
  - QA checklist with viewport screenshots or notes

### Task 6.3: Production build and Vercel handoff
- **Location**:
  - website root and deployment notes
- **Description**: Verify `npm run build`, confirm Vercel root stays `website/`, and document any env or asset considerations for production previews.
- **Dependencies**: Sprint 6.1, Sprint 6.2
- **Acceptance Criteria**:
  - Clean production build
  - Deployment notes are explicit
- **Validation**:
  - Successful build log
  - Vercel configuration review

## Testing Strategy

- Use `npm run build` in `/Users/devanshvarshney/FilterTube/website` after each major sprint
- Validate all new routes with manual smoke checks
- Run responsive verification at 390px, 430px, 768px, 834px, 1024px, and 1440px
- Test time-scene logic with mocked local times:
  - dawn
  - day
  - sunset
  - night
- Check hero readability during different moments of the looping background video
- Verify all browser-store links and future-platform route links
- Perform keyboard-only navigation and reduced-motion checks
- Run Lighthouse or equivalent performance review after media-heavy changes

## Potential Risks & Gotchas

- **Hydration mismatch risk**: Time-based theming can easily reintroduce server/client divergence.
  - **Mitigation**: Default SSR scene plus client-only enhancement using a stable `data-scene` attribute.
- **Readability risk on scenic media**: Beautiful backgrounds can make product details hard to read.
  - **Mitigation**: Use glass surfaces, shadowed type, restrained emphasis, and fallback frames instead of heavy overlays.
- **Route sprawl risk**: Adding too many pages can make navigation feel bloated.
  - **Mitigation**: Keep top nav lean and surface detailed platform links through platform sections and footer hubs.
- **Overpromising future apps**: Dedicated pages may accidentally sound like released products.
  - **Mitigation**: Use explicit labels such as “planned”, “in progress”, and “direction”.
- **Content maintenance risk**: As more pages launch, direct JSX copy duplication will make updates error-prone.
  - **Mitigation**: Move repeated route metadata, CTA targets, labels, and store links into a shared content/config layer early.
- **Accent misuse risk**: Red can quickly read as alarm or aggression if overused.
  - **Mitigation**: Constrain red to signal words, protection rails, key CTAs, and critical metadata only.
- **Performance risk**: Video hero plus dynamic scenes plus glass can become expensive on mobile.
  - **Mitigation**: Keep blur fixed-layer only, add motion fallbacks, and tune media loading aggressively.
- **Asset pipeline risk**: Dedicated scenic pages will stall if hero media, posters, or fallback art are not inventoried before implementation.
  - **Mitigation**: Lock a page-by-page media inventory and fallback strategy in Sprint 1 before page construction begins.
- **Content drift risk**: Platform marketing may drift away from actual product capabilities.
  - **Mitigation**: Cross-check copy with README and docs before each page is finalized.

## Rollback Plan

- Revert route additions page by page if a dedicated surface is not ready to ship
- Keep the homepage and legal routes deployable independently of the platform pages
- Gate time-scene theming behind a removable client helper so the site can fall back to a single serene default theme
- Preserve core browser-extension install flow and current homepage CTA path even if later sections are deferred
- If scenic media hurts performance, keep the design system and replace route-level video with still-image or poster treatments

## Open Questions To Resolve Before Implementation Starts

- Whether iOS and iPadOS should live as separate top-level routes or under a shared `/platforms/apple` hierarchy
- Whether Android TV and Amazon Fire TV should each get separate routes immediately or launch first under one shared TV route with sub-sections
- Whether the ML/AI page should position thumbnail analysis as a late roadmap item only or invite an early waitlist/interest action
- Whether time-scene transitions should happen instantly on load or fade softly after hydration
- Whether the future site should include a waitlist or email capture flow later, which would affect CTA architecture and legal copy
