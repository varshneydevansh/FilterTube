# Website UI UX Refresh

Date: 2026-03-17  
Primary commit: `8aac1c8bfd645992293003cfdb47d59dd93a8adc`  
Commit title: `feat: website UI UX update for vercel`

## Scope

This document captures the March 17 website redesign work that moved the FilterTube site from a simpler landing page into a calmer, more product-shaped, multi-surface brand site inside `/Users/devanshvarshney/FilterTube/website`.

The work was not just a visual polish pass. It established:

- a serene scenic visual language
- a route system for current and future product surfaces
- a proper website theme layer
- a real media pipeline for homepage and future scenic assets
- public legal/product pages that match the current product posture
- a deployable Next.js/Vercel-ready website rooted in `website/`

## Stack And Runtime

Current website stack:

- `Next.js 16`
- `React 19`
- `Tailwind CSS 4`
- `@phosphor-icons/react`

Primary files and folders:

- `/Users/devanshvarshney/FilterTube/website/app`
- `/Users/devanshvarshney/FilterTube/website/components`
- `/Users/devanshvarshney/FilterTube/website/public/videos`
- `/Users/devanshvarshney/FilterTube/website/assets/videos`

Build command:

```bash
cd /Users/devanshvarshney/FilterTube/website
npm run build
```

## Main Changes

### 1. Homepage Hero And Scenic Direction

The homepage was rebuilt around a scenic hero treatment rather than a plain SaaS section. The homepage now uses a real scenic video anchor and calmer editorial hierarchy.

Key files:

- `/Users/devanshvarshney/FilterTube/website/app/page.js`
- `/Users/devanshvarshney/FilterTube/website/components/route-content.js`
- `/Users/devanshvarshney/FilterTube/website/components/browser-logo-rail.js`
- `/Users/devanshvarshney/FilterTube/website/app/globals.css`

What changed:

- Hero copy was reframed around product-level messaging instead of extension-only framing.
- The scenic lake/world direction became the visual anchor for the whole brand system.
- The browser/store rail and feature pills were treated as a lower shelf inside the hero instead of cluttering the headline block.
- The support copy under the hero was tuned for readability over video.
- Hero typography and button treatments were adjusted for both light and dark themes.

What this represents:

- FilterTube is being presented as a calm product system, not a Chrome-only utility.
- The site now has a premium scenic identity that can extend into mobile, tablet, TV, and future local intelligence surfaces.

### 2. Website Theme System

The website theme system was rebuilt so the site defaults to light mode and uses a single-icon toggle instead of three separate mode buttons.

Key files:

- `/Users/devanshvarshney/FilterTube/website/app/layout.js`
- `/Users/devanshvarshney/FilterTube/website/components/theme-toggle.js`
- `/Users/devanshvarshney/FilterTube/website/app/globals.css`

What changed:

- Light mode became the default first-load state.
- A pre-hydration theme bootstrap prevents incorrect initial flashes.
- The UI now uses a single sun/moon swap button.
- Theme sync behavior was implemented through local storage and a custom sync event.
- Scenic scene tokens were aligned with light/dark rendering rather than treated as a separate broken theme path.

What this represents:

- Theme selection now feels product-grade instead of prototype-grade.
- Light and dark are no longer separate ad hoc style piles; they are part of one consistent token system.

### 3. Product Surface And Route System

The site was expanded beyond one landing page into a route-based product story for current and future surfaces.

Key files:

- `/Users/devanshvarshney/FilterTube/website/app/[slug]/page.js`
- `/Users/devanshvarshney/FilterTube/website/components/scenic-detail-page.js`
- `/Users/devanshvarshney/FilterTube/website/components/scenic-illustration.js`
- `/Users/devanshvarshney/FilterTube/website/components/scenic-tones.js`
- `/Users/devanshvarshney/FilterTube/website/components/route-content.js`

What changed:

- Dedicated pages were added for future surfaces and use cases.
- Shared scenic detail rendering was introduced so routes feel connected.
- Product messaging was rewritten to remove leaked internal design notes and roadmap prompts.
- Route copy was shifted away from “extension” language and toward “FilterTube” as the product.
- The ML/AI and family routes were rewritten to emphasize local-first privacy posture and roadmap clarity.

What this represents:

- The website can now explain current desktop capability and future platform direction in one coherent system.
- The roadmap is framed honestly: what exists now, what is being designed, and what remains research.

### 4. Footer, Header, And Brand Language

The header and footer were redesigned to feel closer to the scenic identity instead of looking like generic marketing site chrome.

Key files:

- `/Users/devanshvarshney/FilterTube/website/components/site-header.js`
- `/Users/devanshvarshney/FilterTube/website/components/site-footer.js`
- `/Users/devanshvarshney/FilterTube/website/components/site-data.js`
- `/Users/devanshvarshney/FilterTube/website/app/globals.css`

What changed:

- Header actions were modernized and the top CTA was converted into a GitHub-oriented button treatment.
- Footer copy was rewritten away from abstract/internal language.
- The footer wordmark got a more dynamic red-tinted treatment.
- Brand/navigation text was aligned with the homepage visual tone.

What this represents:

- The site now closes and frames navigation like one designed product experience.
- Brand language is more direct, calmer, and more useful for real users.

### 5. Privacy, Terms, Sitemap, Robots, And Site Foundations

The website moved from a mostly visual shell into a publishable public product site.

Key files:

- `/Users/devanshvarshney/FilterTube/website/app/privacy/page.js`
- `/Users/devanshvarshney/FilterTube/website/app/terms/page.js`
- `/Users/devanshvarshney/FilterTube/website/app/not-found.js`
- `/Users/devanshvarshney/FilterTube/website/app/robots.js`
- `/Users/devanshvarshney/FilterTube/website/app/sitemap.js`

What changed:

- A proper privacy page was restored and completed around actual product behavior.
- Terms and not-found pages were aligned with the site language.
- Sitemap and robots support were added for real deployment.

What this represents:

- The website is not just a concept site anymore; it has the public-facing operational pages needed for deployment and discovery.

### 6. Scenic Media Pipeline

The website now has a proper content pipeline for scenic video generation and storage.

Key files:

- `/Users/devanshvarshney/FilterTube/docs/filtertube-scenic-media-prompt-brief.md`
- `/Users/devanshvarshney/FilterTube/website/assets/videos/README.md`
- `/Users/devanshvarshney/FilterTube/website/assets/videos/homepage/day/homepage_hero_day.mp4`
- `/Users/devanshvarshney/FilterTube/website/public/videos/homepage/day/homepage_hero_day.mp4`

What changed:

- The homepage hero uses a real runtime video path instead of importing a raw mp4 into Next.js.
- Asset folders were created for homepage, footer, and future route/time-of-day media.
- Prompt briefs were documented so future dawn/day/sunset/night loops can stay in one visual world.

What this represents:

- FilterTube now has a reusable brand-media system, not a one-off video file.
- Future route art, stills, and loops can be generated consistently.

## Deployment And Hosting Direction

The redesign was structured for Vercel deployment from the `website/` subdirectory of the main repository.

Implications:

- No separate website repository is required.
- `website/` is the project root for Vercel.
- The site can be deployed as a Next.js app while the extension continues to live in the same monorepo-style root.

Related website runtime/deploy files:

- `/Users/devanshvarshney/FilterTube/website/package.json`
- `/Users/devanshvarshney/FilterTube/website/next.config.mjs`
- `/Users/devanshvarshney/FilterTube/website/public`

## Meaning Of The Website Refresh

This work represents a shift in how FilterTube is presented:

- from extension landing page to product platform site
- from generic utility UI to scenic calm identity
- from roadmap hand-waving to explicit current-vs-future communication
- from static marketing copy to a structured, route-based product narrative

The site now communicates three core ideas more clearly:

- FilterTube is local-first and privacy-conscious.
- Desktop/browser control is real and available now.
- Mobile, tablet, TV, and intelligence layers are part of the future product system, but are not falsely presented as already shipping.

## Known Follow-Up Areas

The website refresh created the right foundation, but a few areas remain future work rather than completed final state:

- additional time-of-day videos beyond the homepage day anchor
- full per-route scenic media swaps
- final route-by-route QA after all media assets exist
- final production polish once all footer and hero motion assets are locked

