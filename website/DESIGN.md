# FilterTube website: preserve the scenic design

This is a content refinement of the existing website, not a replacement design.
The user's explicit preservation direction takes precedence over generic redesign
advice. Hallmark, Claude Frontend, Design Taste, design-system patterns and the
UI/UX review skills are used to improve clarity within these boundaries.

## Keep

- Full-width scenic video hero, both original headlines, typography and demo links.
- Outfit, Plus Jakarta Sans, Cormorant Garamond and JetBrains Mono from next/font.
- Existing cream, muted red and scenic light/dark tokens in app/globals.css.
- Original glass header, scenic cards, Android/Apple artwork, large footer wordmark
  and FooterSignalArt. Existing Reveal motion and reduced-motion behavior.
- Next.js/React/Tailwind stack, source links, community feedback and independent
  funding story. No new runtime dependencies.

## Improve through content hierarchy

- Apps are full products. Android phone/tablet is public; TV is important ongoing
  work. Android and iOS lead navigation; the extension remains easy to install.
- Android combines phone, tablet and TV information. iOS combines iPhone and iPad.
  Legacy pages remain accessible; do not break bookmarked URLs.
- One setup sequence. Keep all unique troubleshooting and feature information;
  reveal secondary details with native, keyboard-accessible disclosures.
- Use concrete benefits instead of generic design commentary. Preserve all
  thirteen original detailed features and include missing capabilities.
- Reuse ScenicDetailPage for the extension overview; do not introduce another
  visual language. Optional feature disclosures, status/anchor metadata and a
  gallery of real Android development screenshots extend the existing template.
  Keep the gallery horizontally scrollable on phones and arranged in columns
  on larger screens. Detailed feature groups start closed.

## Claim and interaction rules

- Label public availability, testing, experimental controls and research clearly.
  A shared direction does not imply identical features in every platform/release.
- Describe verified encrypted P2P and user-owned local rules. Explain connection
  helpers, encrypted relay and optional pickup; do not claim no servers exist.
- Parent authority, child switching PINs, trust, consent, delivery and application
  are separate. Direct Auto-sync needs open connected supported endpoints.
- Keep summaries focusable with a strong visible outline. Preserve native link,
  details and summary semantics. Check narrow layouts and enlarged/desktop widths.
- Use real product media. Do not invent app screenshots or fake device chrome.

Hallmark pre-emit review: Philosophy 5, Hierarchy 4, Execution 4, Specificity 5,
Restraint 5, Variety 4. These are internal design judgments, not usability results.

## App hero refinement — 25 October 2026

The user's later explicit direction replaces only Android/iOS hero logo artwork
with three real development screenshots. Preserve Android sage green, iOS sky
blue and Kids rose pink, matching their platform cards. Preserve the original
homepage hero and all unique features. Screenshot hover is a preview; clicking
or pressing Enter selects it, and labelled text choices support touch. Keep a
full-resolution link and a readable unavailable state.

Use Elayadesign's design-to-motion guidance in website context: live HTML copy,
intact screenshots, existing tokens and reduced-motion support. The user's
request for an Android background loop takes precedence over that skill's static
background rule. The original silent fframes contour loop is decorative; no UI
story, user data or simulated feature behavior is composited into it. Background
videos pause offscreen/when hidden and have visible pause controls. CSS transforms
handle the screenshot interaction; no GSAP runtime dependency is needed here.

## Naming direction — 25 October 2026

The user explicitly asks not to repeat the underlying service name anywhere in
the website's own copy or metadata. Use Main, Kids, Music, videos, supported pages
or the video platform as the context requires. Keep functional demo/source URLs
and intact genuine product screenshots. Do not imply broader site support or
remove privacy/no-affiliation facts; Google still owns its underlying services.
Third-party player chrome is outside the website's authored copy.

## Extension media and moving showcases — 25 October 2026

Extension uses a muted lilac/purple scenic tone, distinct from Android green,
iOS blue and Kids pink. Its three supplied popup captures use their real wider
proportions in the hero. Do not stretch them into phone frames. Its showcase uses
six supplied desktop captures. Shared gallery metadata supports future platform
and device-size captures without incorrectly labelling them Android.

The user explicitly requested a moving showcase inspired by Flow's screen rail.
Use an original transform-driven rail spanning the browser width, with constrained
headings, intrinsic image proportions, concise captions and visible playback
status. Keep pause/play and Previous/Next controls. Pause on hover, keyboard
focus, manual browsing and offscreen/hidden documents. Reduced motion defaults
to a unique manually scrollable row; explicit Play can opt into movement.
Keep full-resolution links and skip the loop copy in keyboard/screen-reader
navigation. A sparse screen set needs a cycle longer than the viewport plus a
card, so the same image cannot appear at both edges simultaneously. Homepage
media and future app/tablet/TV captures remain later work; do not imply parity.

## Consistent platform identity — 25 October 2026

Homepage release cards, featured/related cards, platform hero actions and primary
Downloads cards follow the route's tone: forest green for Android, sky blue for
iOS, lilac for the extension and rose for Kids. Use scoped platform tokens for
surfaces, borders, icon shells, status badges, focus and actions; do not recolor
the global FilterTube brand or homepage hero. Keep text contrast in light/dark
mode. Available store installs have filled actions; manual ZIPs, the simpler
APK and iOS status have themed secondary actions.

The user explicitly requested Firefox artwork for the browser extension. Use
Firefox as the extension's visual identifier while retaining Chrome, Firefox,
Edge and other supported-browser choices in the copy and installation links.
Home release cards use one shared layout; at narrow widths keep full-width copy
and a compact icon, reserving larger artwork for wider screens. Download cards
and buttons must fit their containers without relying on page overflow clipping.

## Site refresh — 18 November 2026

How it works sits right after the home hero: a block list / allow list demo that
switches the same six made-up videos (a schematic list, not a fake screenshot),
then Study mode as a four-step story, then "What we keep out" and the time-saved
medal. Kriti and Uljhan are the only characters. Their art is cut from the aKriti
library by tools/cut-mascots.py and stands on a light "paper" stage that stays
light in dark mode so the crayon colours hold. Animated strips play with CSS
steps() on transform only, start when scrolled into view, stop after two loops or
fewer (under five seconds) and rest on a still frame; selecting one replays it.
Reduced motion shows the still frame only.

Every app screenshot comes from data/screenshots.js. The home device strip lays
out two rows whose tiles grow by aspect ratio so screens in a row share a height.
Devices without captures show an honest "screens are on the way" card instead of
borrowing another device's screen. docs/refresh-2026-11-18/CAPTURE_LIST.md lists
the six screens to capture per device.

## Pages for people and AI assistants — 22 November 2026

The owner wants AI assistants (ChatGPT, Claude, Perplexity, Gemini) to describe FilterTube
accurately. This updates the 25 October naming direction for the website only: titles,
descriptions, the homepage's first paragraph, the FAQ and the comparison may name YouTube to
say what FilterTube works with ("YouTube ad blocker and content blocker"). App UI copy still
avoids the name, and the no-affiliation line stays.

- data/site-facts.js is the one source for /faq, /compare, /study, /llms.txt, /llms-full.txt
  and the .md copies (lib/markdown.js). The .md files carry the same words as the pages; no
  bot-only content. Each page links its copy with rel="alternate" type="text/markdown".
- No "the best" in our own voice. The FAQ answers the "best" question with what each tool is
  for, and /compare is fair to BlockTube, Unhook, TubeBlock, YouTube Kids, uBlock Origin,
  AdGuard and Brave.
- Ads: blocked on every platform. The extension's "Send adverts to The Void" is on by default;
  the apps use FilterTube's own player, so YouTube's ads never appear.
- The new pages reuse SectionHeading and Panel. The comparison table scrolls sideways on phones.
