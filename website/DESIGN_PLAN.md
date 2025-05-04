# FilterTube Landing Page - Design Plan

## 1. Overview

*   **Goal:** Create a modern, single-page landing website to introduce the FilterTube browser extension, explain its value proposition (decluttering YouTube/YouTube Kids), highlight features, provide installation links (Chrome/Firefox), tease future developments, and build user trust.
*   **Target Audience:** YouTube users seeking more control over their feed, parents interested in filtering YouTube Kids (future), tech-savvy users interested in browser extensions.
*   **Hosting:** Planned for Hostinger.

## 2. Design Philosophy & Style

*   **Aesthetic:** Clean, modern, professional, user-friendly, trustworthy.
*   **Core Style:** Blend of flat UI with subtle **glassmorphism** (frosted glass effect on cards/panels) and a **soft layered feel** (using shadows and potentially background elements). Inspired by the user-provided reference image.
*   **Theme:** Primarily light theme for readability, with strong accents using the FilterTube **red/coral** palette.
*   **Responsiveness:** Fully responsive design for desktop, tablet, and mobile devices using modern CSS (Flexbox/Grid).
*   **Interactivity:** Subtle, smooth animations (fade-in on scroll, hover effects on buttons/links) to enhance user experience without being distracting.

## 3. Color Palette

*   **Primary:** Warm Red/Coral gradient (e.g., `#f2545b` to `#fa8072` or similar, derived from logo/reference). Used for hero background, buttons, accents.
*   **Background:** Light base (e.g., White `#FFFFFF` or very light Gray `#F8F9FA`). Hero section will have the primary red gradient. Abstract, blurred blob shapes in muted background tones (light pink/coral) can add depth behind content sections, inspired by the reference image.
*   **Foreground (Cards/Panels):** White (`#FFFFFF`) or slightly transparent white (`rgba(255, 255, 255, 0.8)`) for glassmorphism effect, with `backdrop-blur`.
*   **Text:** Dark Gray/Black (e.g., `#333333`) for body text, White (`#FFFFFF`) for text on dark/red backgrounds.
*   **Accents:** Potentially a secondary accent color (e.g., a complementary neutral or muted blue) if needed, but red should dominate.

## 4. Typography

*   **Headings:** Clean, modern Sans-serif (e.g., 'Poppins', 'Inter', 'Manrope', or system default sans-serif). Bold weight.
*   **Body Text:** Same Sans-serif family, Regular or Light weight for readability.
*   **Emphasis:** Use font weight and color variations for hierarchy.

## 5. Layout & Structure (Single Page)

*   **Grid/Flexbox:** Use CSS Grid and Flexbox for layout structure and responsiveness.
*   **Sections:** Clear visual separation between sections, potentially using background variations or subtle dividers.

### 5.1. Navigation Bar (Sticky/Fixed Optional)

*   **Style:** Simple, potentially with a subtle glassmorphism background (`backdrop-blur`).
*   **Elements:**
    *   Logo (Icon + FilterTube Text) - Left
    *   Links (Smooth scroll): Features, YouTube vs Kids, What's Next? - Center/Right
    *   GitHub Icon Link - Right
*   **Mobile:** Collapse into a hamburger menu.

### 5.2. Hero Section

*   **Background:** Dominant Red/Coral gradient with subtle, layered, blurred abstract blob shapes (CSS/SVG).
*   **Headline:** Large, bold, white text. e.g., "Declutter Your YouTube Feed with FilterTube".
*   **Tagline:** Smaller, lighter white text. e.g., "Hide unwanted videos, channels, and keywords on YouTube and Kids' content effortlessly."
*   **Visual:** No static image needed initially; the gradient and blobs provide the visual interest.
*   **Optional CTA:** Could have primary "Get for Chrome/Firefox" buttons here, but main CTAs are in feature sections.

### 5.3. Why FilterTube? Section (NEW)

*   **Placement:** Immediately following the Hero section.
*   **Goal:** Briefly convey the core motivations from the manifesto.
*   **Title:** e.g., "Reclaim Your Focus", "Why We Built FilterTube", or "Your Feed, Your Rules".
*   **Content:** Concise points summarizing the 'Need':
    *   Overcoming digital clutter & cognitive burden.
    *   Empowering users (especially neurodiverse individuals) with control.
    *   Addressing the lack of effective filtering tools for parents & guardians.
    *   Focus on user well-being over platform engagement metrics.
*   **Style:** Clean text section, possibly with relevant icons or a subtle background variation.

### 5.4. Features Section (Two Cards Side-by-Side or Stacked on Mobile)

*   **Container:** Section with a lighter background (subtle blobs?).
*   **Card Style:** Glassmorphic panels (rounded corners, white/transparent background, `backdrop-blur`, soft drop shadow). Layered effect as per reference image.

    *   **Card 1: FilterTube Extension**
        *   Title: "FilterTube for Your Tube"
        *   Description: "Filters standard YouTube content seamlessly. Support for Kids' content is coming soon!"
        *   Features List (with icons - Font Awesome suggested):
            *   Keyword Filtering (Title, Desc, Channel, Hashtags, etc.)
            *   Channel Filtering
            *   Anti-Flicker
        *   Buttons (Prominent Red):
            *   "Get for Chrome" (Link: `#chrome-store`)
            *   "Get for Firefox" (Link: `#firefox-store`)

    *   **Card 2: FilterTube on Mobile (Future Vision)**
        *   Title: "FilterTube on Mobile"
        *   Status: "Future Vision"
        *   Description: "Bringing powerful filtering and peace of mind directly to your mobile devices. 📱"
        *   Buttons (Visually distinct - e.g., outlined or slightly different shade):
            *   "Notify Me" (Link: `#notify-mobile`)

### 5.5. How It Works Section (Optional but Recommended)

*   **Title:** "Seamless Filtering in Action" or "How Anti-Flicker Works"
*   **Content:** Simple graphic or 2-3 step text explanation:
    1.  Extension instantly hides potential videos with CSS.
    2.  Filters are applied lightning-fast.
    3.  Only allowed content is revealed.
*   **Style:** Clean section, maybe using icons or simple diagrams.

### 5.6. Upcoming Features Section ("What's Next?")

*   **Title:** "What's Next?" or "Future Vision"
*   **Style:** Could be another glassmorphic card or a distinct section.
*   **Content:** Bullet points teasing future plans:
    *   Advanced Semantic Filtering
    *   Thumbnail Content Analysis (Blur/Hide Options)
    *   Mobile App Development

### 5.7. Privacy First Section (NEW)

*   **Placement:** Before the Footer.
*   **Goal:** Highlight core privacy commitments as trust markers.
*   **Title:** e.g., "Your Privacy is Paramount", "Built Private by Design".
*   **Content:** Key bullet points from the commitment:
    *   ✅ **Local Processing:** All filtering happens *only* in your browser.
    *   🚫 **No Data Collection:** We don't track, collect, or transmit *any* user data. Ever.
    *   🤝 **No Third Parties:** Zero analytics, trackers, or ads.
    *   🔍 **Open & Transparent:** Code is open source for anyone to review.
    *   *Link to the full Privacy Policy page (`privacy.html`).*
*   **Style:** Clear, trustworthy section. Maybe use checkmark/cross icons. Could have a slightly different background to stand out.

### 5.8. Footer

*   **Style:** Simple, clean footer.
*   **Content:**
    *   Copyright Notice: © 2024 FilterTube
    *   License Mention: ([Link to GitHub LICENSE file](#github-license) or "MIT License")
    *   Privacy Policy Link: (Link: `privacy.html`)
    *   GitHub Repository Link (Icon + Text) (Link: `#github-repo`)

## 6. Interactivity & Animations

*   **Scroll Fade-in:** Use Intersection Observer API in JavaScript to gently fade in sections as they enter the viewport.
*   **Hover Effects:** Subtle scale/brightness/shadow changes on buttons and interactive links/cards.
*   **Smooth Scroll:** Implement smooth scrolling for navigation links.

## 7. Assets

*   **Logo:** Use the provided logo (`icons/icon-48.png` or a dedicated website version).
*   **Icons:** Use an icon library like Font Awesome (free tier) for feature lists, GitHub link, etc.

## 8. Placeholders

*   `#chrome-store`: Link to Chrome Web Store page.
*   `#firefox-store`: Link to Firefox Add-ons page.
*   `#notify-mobile`: Placeholder link for future mobile app notification/updates.
*   `#github-repo`: Link to the GitHub repository (`https://github.com/varshneydevansh/FilterTube`).
*   `#github-license`: Link to the LICENSE file in the GitHub repository.
*   `privacy.html`: Link to the Privacy Policy page.

## 9. Technology Stack

*   **HTML:** HTML5 semantic markup.
*   **CSS:** CSS3 for styling, layout (Flexbox/Grid), animations, and glassmorphism effects (`backdrop-filter`, `box-shadow`, gradients).
*   **JavaScript:** Minimal vanilla JS for smooth scrolling, scroll animations (Intersection Observer), and mobile nav toggle. No heavy frameworks needed for this landing page.

## 10. Future Considerations

*   **Mobile Web App:** Design components and layout with modularity in mind, facilitating future reuse or integration into a web app structure.
*   **Privacy Policy:** Create a separate `privacy.html` page with standard privacy policy content (initially placeholder text).
*   **Mailing List:** Integrate a simple mailing list signup form later for the "Notify Me" buttons.
*   **Build Process:** For production, consider adding a build step for CSS/JS minification and browser prefixing if needed.

## 11. Single Codebase Note

*   The website describes the *extension's* ability to filter both YouTube and (eventually) YouTube Kids. The extension itself contains the logic to target elements on the respective sites. The website code doesn't perform filtering.
