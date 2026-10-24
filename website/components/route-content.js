import {
  Compass,
  DeviceMobile,
  EyeSlash,
  MonitorPlay,
  ShieldCheck,
  Sparkle,
  Stack,
  Television,
} from "@phosphor-icons/react/ssr";

import {
  extensionInstallHref,
  navigationLinks,
  platformSlugs,
} from "@/components/site-shell-data";

export { extensionInstallHref, navigationLinks };

export const heroVideoUrl = "/videos/homepage/day/homepage_hero_day.mp4";

export const demoVideoHref = "https://www.youtube.com/watch?v=dmLUu3lm7dE";
export const appDemoVideoHref = "https://www.youtube.com/watch?v=SHvSICSMHL4";

export const docsHref =
  "https://github.com/varshneydevansh/FilterTube/tree/master/docs";

export const githubHref = "https://github.com/varshneydevansh/FilterTube";
export const redditHref = "https://www.reddit.com/r/FilterTube/";
export const downloadsHref = "/downloads";
export const androidPlayStoreHref =
  "https://play.google.com/store/apps/details?id=com.filtertube.app";

export const browserLinks = [
  {
    name: "Android",
    note: "Google Play",
    href: androidPlayStoreHref,
    logo: "/apps/android.png",
  },
  {
    name: "Chrome",
    note: "Web Store",
    href: extensionInstallHref,
    logo: "https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/chrome/chrome_48x48.png",
  },
  {
    name: "Firefox",
    note: "Add-ons",
    href: "https://addons.mozilla.org/en-US/firefox/addon/filtertube/",
    logo: "https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/firefox/firefox_48x48.png",
  },
  {
    name: "Edge",
    note: "Microsoft Add-ons",
    href: "https://microsoftedge.microsoft.com/addons/detail/filtertube/lgeflbmplcmljnhffmoghkoccflhlbem",
    logo: "https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/edge/edge_48x48.png",
  },
  {
    name: "Brave",
    note: "Chrome listing",
    href: extensionInstallHref,
    logo: "https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/brave/brave_48x48.png",
  },
  {
    name: "Vivaldi",
    note: "Chrome listing",
    href: extensionInstallHref,
    logo: "https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/vivaldi/vivaldi_48x48.png",
  },
  {
    name: "Opera",
    note: "GitHub releases",
    href: "https://github.com/varshneydevansh/FilterTube/releases",
    logo: "https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/opera/opera_48x48.png",
  },
  {
    name: "iOS",
    note: "App status",
    href: "/ios",
    logo: "/apps/app-store-transparent.png",
    internal: true,
  },
];

export const featuredRouteSlugs = ["android", "ios", "extension", "kids"];

export const footerLinks = {
  product: [
    { label: "Downloads", href: downloadsHref },
    { label: "Android: phone, tablet, TV", href: "/android" },
    { label: "iOS: iPhone and iPad", href: "/ios" },
    { label: "Browser extension", href: "/extension" },
    { label: "YouTube Kids", href: "/kids" },
    { label: "ML & AI", href: "/ml-ai" },
  ],
  resources: [
    { label: "Reddit community", href: redditHref, external: true },
    { label: "Documentation", href: docsHref, external: true },
    { label: "GitHub", href: githubHref, external: true },
    {
      label: "Support independent development",
      href: "https://ko-fi.com/filtertube",
      external: true,
    },
    {
      label: "Issue tracker",
      href: "https://github.com/varshneydevansh/FilterTube/issues",
      external: true,
    },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of use", href: "/terms" },
  ],
};

export const homeStoryNotes = [
  "FilterTube began with a neurodivergent developer who wanted calmer YouTube for ADHD focus.",
  "Parents, caregivers, and autistic and other neurodivergent users have helped shape clearer controls for different needs.",
  "The goal is practical: enjoy the creators you choose, keep unwanted content out, and give each person rules that fit them.",
  "Independent development keeps the project close to that feedback. Community reports and contributions help it improve across phones, tablets, TVs, and browsers.",
];

export const homeCapabilityCards = [
  {
    label: "Playback",
    title: "Keep the video you chose at the center.",
    description:
      "FilterTube filters YouTube adverts and unwanted content. The Android app has its own viewing experience; the extension keeps YouTube's familiar player controls.",
    points: [
      "Advert filtering is enabled by default in Blocklist and Whitelist modes.",
      "Playback paths differ by platform, and compatibility still needs maintenance when YouTube changes.",
    ],
    icon: EyeSlash,
    span: "xl:col-span-12",
  },
  {
    label: "Rules",
    title: "Block what you name, or allow only what you trust.",
    description:
      "Add channels, keywords, or supported content filters. Keep separate rules for YouTube Main and Kids when they need different boundaries.",
    points: [
      "Blocklist hides matching content; Whitelist limits viewing to approved rules.",
      "Exact matching, date ranges, categories, and content controls help make rules more precise.",
    ],
    icon: Compass,
    span: "xl:col-span-7",
  },
  {
    label: "Family",
    title: "Separate profiles, clear parent controls.",
    description:
      "Each person can have their own rules and viewing access. Parents manage protected child profiles and set viewing time where supported.",
    points: [
      "A child switching PIN does not unlock parent settings.",
      "Parent or master approval controls protected edits, device permissions, and backups.",
    ],
    icon: ShieldCheck,
    span: "xl:col-span-5",
  },
  {
    label: "Focus",
    title: "Keep the useful parts. Quiet the distractions.",
    description:
      "Choose the surfaces that interrupt your attention instead of removing everything from YouTube.",
    points: [
      "Hide Shorts, comments, or other supported feed and watch-page distractions.",
      "Choose Home feed, recommendations, Mixes, playlist panels, live chat, or end-screen controls where supported.",
    ],
    icon: EyeSlash,
    span: "xl:col-span-5",
  },
  {
    label: "Devices and data",
    title: "Your profiles, shared between devices you choose.",
    description:
      "Pair and verify devices before sharing updates. Keep local backups and review imported rules without handing control to a central FilterTube account.",
    points: [
      "Use a code or QR, compare the safety phrase, then choose the profile and update.",
      "Opt-in Auto-sync is in testing. Availability varies by app and release.",
      "Connection services may help devices meet or relay encrypted updates. PINs, ownership, and device permissions stay local.",
    ],
    icon: Stack,
    span: "xl:col-span-7",
  },
];

export const homeUserVoices = [
  {
    source: "Parent feedback on Reddit",
    title: "Parents want calmer words, not developer language.",
    body: "A parent using FilterTube on a child’s PC said the product is exactly what YouTube has been missing, then asked for a simpler guide and clearer explanations.",
    href: "https://www.reddit.com/r/FilterTube/comments/1uhtqo7/some_feedback/",
  },
  {
    source: "Caregiver request on GitHub",
    title: "Neurodivergent families need calmer control.",
    body: "A caregiver described using FilterTube to show an autistic family member the good side of the internet while shielding sensitive learning from harmful content.",
    href: "https://github.com/varshneydevansh/FilterTube/issues/60#issuecomment-4612147210",
  },
  {
    source: "YouTube parent comment",
    title: "Allow-only setups matter for study computers.",
    body: "A parent said FilterTube solved nearly everything for a child’s study PC and asked for stronger protection around turning filtering off.",
    href: "https://www.youtube.com/watch?v=dmLUu3lm7dE&t=26s",
  },
];

export const systemSteps = [
  {
    title: "Add rules",
    description:
      "Choose words, channels, videos, comments, Shorts, or whitelist rules from the dashboard.",
    icon: Compass,
  },
  {
    title: "Pick the profile",
    description:
      "Keep the adult profile, child profiles, and YouTube Kids rules separate when they need different limits.",
    icon: Stack,
  },
  {
    title: "Open YouTube",
    description:
      "FilterTube removes matching videos and surfaces as YouTube loads, then cleans up anything YouTube adds later.",
    icon: EyeSlash,
  },
  {
    title: "Adjust when needed",
    description:
      "If YouTube changes its layout, tell the developer. That is usually the reason filtering suddenly misses a surface.",
    icon: ShieldCheck,
  },
];

export const homeFaqItems = [
  {
    question: "How do I start?",
    answer:
      "Install the Android app or browser extension, add one channel or keyword, then check the result. In the extension, refresh YouTube after your first rule. Add profiles, PINs, Kids rules, and imports when you need them.",
  },
  {
    question: "What does Exact mean?",
    answer:
      "Exact off is wider: poop can also catch poops or pooping. Exact on matches the word poop. Use it when a short word hides more than you intended.",
  },
  {
    question: "Can a child change the rules?",
    answer:
      "Protected child profiles require parent approval for managed changes. A child PIN protects switching into that profile; it does not unlock parent controls. Lock the parent or master session after making changes.",
  },
  {
    question: "How private is device sync?",
    answer:
      "Rules are stored locally. Verified devices exchange encrypted updates, with connection services available to help them meet or relay data. Optional pickup can hold encrypted parent updates. Providers can still see connection metadata; there is no central FilterTube account storing your readable rules.",
  },
  {
    question: "Do I need an invitation for Android?",
    answer:
      "No. Install FilterTube from the public Google Play listing—no invitation or email needed. The separate direct APK is a simpler build, not the same custom app.",
  },
  {
    question: "What if a filter misses something?",
    answer:
      "Check the active profile, rule space, and Exact setting first. YouTube layout changes can also affect filtering. A small example, page type, and screenshot help diagnose it; share only the private details you choose.",
  },
];

export const homeTechnicalFeatures = [
  {
    title: "Ad-free playback",
    description:
      "Remove YouTube adverts without changing whether the active profile uses Blocklist or Whitelist rules.",
    detail:
      "Enabled by default; the extension and native app use platform-specific playback paths.",
  },
  {
    title: "Keyword rules",
    description:
      "Add words or phrases you do not want appearing in titles, descriptions, or supported comment text.",
    detail: "Use Exact when a short word causes false matches.",
  },
  {
    title: "Channel rules",
    description:
      "Block a channel, allow only trusted channels, or use channel IDs and handles without memorizing YouTube URL formats.",
    detail: "Best for creators you always want hidden or always want allowed.",
  },
  {
    title: "Comment controls",
    description:
      "Hide comment sections entirely, or use keyword/commenter rules when comments are the part causing the problem.",
    detail: "Useful for calmer watch pages.",
  },
  {
    title: "Shorts controls",
    description:
      "Remove Shorts shelves, cards, and entry points when short-form scrolling is the habit you want to reduce.",
    detail: "A common first step for families and focus setups.",
  },
  {
    title: "Profiles",
    description:
      "Keep different rule sets for adults, children, study time, or stricter YouTube Kids setups.",
    detail: "Rules stay scoped to the profile you choose.",
  },
  {
    title: "PIN protection",
    description:
      "Use PINs so protected profiles and parent settings are not casually opened or changed.",
    detail: "Parent unlock is separate from child profile switching.",
  },
  {
    title: "Backups",
    description:
      "Export your FilterTube setup before a big change, or keep local backup files for recovery. Encrypted and optional automatic backup options are available where supported.",
    detail: "Designed to keep control in your hands.",
  },
  {
    title: "Rule-list imports",
    description:
      "Bring in CSV, TXT, JSON, BlockTube-style JSON, or a raw HTTPS list, then review what FilterTube understood before applying it.",
    detail: "Files add rules only; they do not change PINs or profiles.",
  },
  {
    title: "Subscribed-channel whitelist",
    description:
      "Import channels from the signed-in YouTube account into the current profile whitelist, then choose whether to only store them or turn whitelist mode on.",
    detail: "Useful when a child should only see channels already subscribed.",
  },
  {
    title: "Date-limited keywords",
    description:
      "Make a keyword apply only to videos uploaded before, after, or inside a date range.",
    detail: "Useful for multi-part topics or newer content only.",
  },
  {
    title: "Device updates",
    description:
      "A parent device can send approved rules, time, and access to a verified protected device, with optional pickup when the other device opens later.",
    detail:
      "Direct pairing and optional pickup have different setup and delivery requirements.",
  },
  {
    title: "Local-first design",
    description:
      "Filtering uses local rules. The browser extension source is public, while native app source availability differs.",
    detail:
      "Device transfers are a choice; connection metadata and optional encrypted pickup have their own privacy boundaries.",
  },
  {
    title: "Protected viewing time",
    description:
      "Parents can set daily viewing limits for protected profiles. The extension also offers timed self-control sessions that hold chosen rules until the session ends.",
    detail:
      "Daily time is counted per installation and profile, not as a shared family-wide budget. A child switching PIN cannot grant extra time.",
  },
  {
    title: "Duration, dates, and categories",
    description:
      "Use supported video-length, upload-date, category, and uppercase-title filters alongside channel and keyword rules.",
    detail:
      "Availability and metadata coverage vary by viewing space and platform.",
  },
  {
    title: "Language controls",
    status: "Experimental",
    description:
      "Language controls use available video metadata to narrow viewing, with original-audio handling where supported.",
    detail:
      "Experimental original-audio preference favors an identified original track over automatic dubbing. Metadata can be incomplete; spoken language is not guaranteed.",
  },
  {
    title: "Minimum-view filters",
    status: "Extension update",
    description:
      "Optionally hide videos below a view-count threshold in Main and Kids when a usable view count is available.",
    detail:
      "A newer extension feature; do not assume identical support in every installed app build.",
  },
  {
    title: "Saved video notes",
    status: "Development updates",
    description:
      "Keep notes with a video inside the selected profile. New Notes features are available in extension and Android development builds.",
    detail:
      "In testing; availability and Notes access depend on the app, release and profile permissions.",
  },
  {
    title: "Opt-in Auto-sync",
    status: "Development updates",
    description:
      "Choose supported settings, filter rules, and notes to sync on approved profile links between verified devices. Offline changes wait locally for a supported connection.",
    detail:
      "In testing for extension and Android updates; supported devices must be open and connected for direct sync.",
  },
  {
    title: "Reviewed preference reset",
    status: "Extension update",
    description:
      "Review ordinary display and playback defaults for the chosen profile. Your filter rules, notes, PINs, time limits, device permissions and profile ownership are preserved.",
    detail:
      "Parent safeguards still apply; reset is a deliberate action, not an automatic cleanup.",
  },
  {
    title: "Compatible rule exports",
    status: "Extension update",
    description:
      "Review compatible channel and keyword rules before exporting one profile and rule space for BlockTube.",
    detail:
      "A compatibility export is not a complete FilterTube backup; unsupported settings stay out.",
  },
];

export const platformOrder = platformSlugs;

export const detailPages = {
  extension: {
    slug: "extension",
    icon: MonitorPlay,
    tone: "sage",
    status: "Available for browsers",
    eyebrow: "Browser extension",
    navTitle: "Browser extension",
    routeSummary:
      "Keep YouTube's familiar player and add filters, profiles, and local control in your browser.",
    titleLead: "Your familiar YouTube, with",
    titleDisplay: "your rules",
    description:
      "Filter channels, keywords, Shorts, comments, and supported content without leaving the YouTube website. Use the popup for quick changes, the dashboard for deeper setup, and YouTube's menu to block content as you browse.",
    chips: ["YouTube Main + Kids", "Local rules", "Family profiles"],
    primaryCta: {
      label: "Choose your browser",
      href: downloadsHref,
      external: false,
    },
    secondaryCta: {
      label: "Watch the extension demo",
      href: demoVideoHref,
      external: true,
    },
    previewLabel: "Browser control",
    previewTitle: "Quick changes nearby. Full settings when you need them.",
    previewRows: [
      {
        label: "Quick access",
        value: "Popup",
        detail:
          "Change everyday controls without opening a separate settings tab.",
      },
      {
        label: "Full setup",
        value: "Dashboard",
        detail:
          "Manage rules, profiles, imports, and device connections in one place.",
      },
      {
        label: "While browsing",
        value: "YouTube menu",
        detail:
          "Block supported content from the page you are already viewing.",
      },
    ],
    featureCards: [
      {
        title: "Choose what remains visible",
        body: "Channel and keyword rules, Exact matching, Whitelist, Shorts and comment controls, and supported content filters help shape Main and Kids.",
      },
      {
        title: "Keep family boundaries clear",
        body: "Profiles, parent permissions, PIN gates, protected viewing time, reviewed imports, and backups stay scoped to the selected profile.",
      },
      {
        title: "Connect your verified devices",
        body: "Pair with a code or QR and compare the safety phrase before sharing updates. Optional personal Auto-sync and per-video Notes are in testing for newer releases.",
      },
    ],
    milestoneTitle: "Browser availability",
    milestoneIntro:
      "Choose a store or manual build appropriate for your browser; a development feature is not automatically in every store release.",
    milestones: [
      "Chrome, Firefox, and Edge have store listings; compatible Chromium browsers use the relevant installation path.",
      "Newer Notes, minimum-view rules, compatible exports, preference reset, and Auto-sync features may not be in your store release yet.",
      "YouTube changes still require compatibility work; advert filtering is not a promise of permanent immunity to platform changes.",
    ],
    related: ["android", "kids", "ml-ai"],
  },
  mobile: {
    slug: "mobile",
    icon: DeviceMobile,
    tone: "sage",
    status: "Available on Google Play",
    eyebrow: "Dedicated apps",
    navTitle: "Mobile overview",
    routeSummary:
      "A calm overview of the public Android app, finalizing Apple builds, and the future TV app family.",
    titleLead: "A calm FilterTube companion for",
    titleDisplay: "phones and tablets",
    description:
      "The Android phone and tablet app is publicly available on Google Play. The native iPhone and iPad build is in final alignment, with Apple Developer account access currently delaying TestFlight.",
    heroArtworks: [
      {
        src: "/apps/android.png",
        alt: "FilterTube Android app artwork",
      },
      {
        src: "/apps/app-store-transparent.png",
        alt: "FilterTube iPhone and iPad App Store artwork",
      },
    ],
    chips: ["Signal Rail", "One-thumb controls", "Local-first trust"],
    primaryCta: {
      label: "Open downloads",
      href: downloadsHref,
      external: false,
    },
    secondaryCta: {
      label: "Watch FilterTube working",
      href: demoVideoHref,
      external: true,
    },
    appPreview: {
      eyebrow: "App preview video",
      title: "See FilterTube’s custom mobile experience.",
      body: "Watch the working phone and tablet experience, including the calmer custom interface built for YouTube Main and Kids.",
      embedHref: "https://www.youtube-nocookie.com/embed/SHvSICSMHL4?rel=0",
      watchHref: appDemoVideoHref,
    },
    previewLabel: "Mobile direction",
    previewTitle: "Viewing and profile status, easy to find.",
    previewRows: [
      {
        label: "Source",
        value: "Main + Kids",
        detail: "Protection status feels immediate, not buried.",
      },
      {
        label: "Quick actions",
        value: "4",
        detail: "Hide Shorts, hide comments, whitelist mode, Kids mode.",
      },
      {
        label: "Primary habit",
        value: "Rule edit",
        detail: "One-thumb rule creation and profile switching stay central.",
      },
    ],
    featureCards: [
      {
        title: "Android is available on Google Play",
        body: "Install the public phone and tablet app from the Google Play listing, or search Google Play for FilterTube.",
      },
      {
        title: "Home that reassures first",
        body: "The first screen shows whether protection is on, which profile is active, and what changed recently.",
      },
      {
        title: "Rules as the main workspace",
        body: "Channels, keywords, categories, and content controls stay clear enough for quick edits on a phone.",
      },
      {
        title: "Browse remains modular",
        body: "Main and Kids viewing sit alongside native rule and profile controls. Check the Android and iOS pages for the features available on your device.",
      },
    ],
    milestoneTitle: "What mobile needs to do first",
    milestoneIntro:
      "Mobile is the control center for status, rule changes, and profile switching, not a stretched copy of the browser popup.",
    milestones: [
      "Android users can install the public Google Play app directly.",
      "Protection status is understandable in one glance.",
      "Profiles and PIN gates feel native and trustworthy.",
      "The visual tone stays calm enough for family use.",
    ],
    related: ["ios", "ipados", "android"],
  },
  ios: {
    slug: "ios",
    icon: DeviceMobile,
    tone: "pearl",
    status: "Public access pending",
    eyebrow: "iPhone + iPad",
    navTitle: "iPhone and iPad",
    routeSummary:
      "Native iPhone and iPad viewing, filters, profiles, and family controls; public distribution is not available yet.",
    titleLead: "A native FilterTube app for",
    titleDisplay: "iPhone and iPad",
    description:
      "FilterTube brings Main and Kids viewing, native controls, profiles, PINs, and protected time to iPhone and iPad. The builds are in testing; public TestFlight and App Store access are not available while developer enrollment is unresolved.",
    heroArtwork: {
      src: "/apps/app-store-transparent.png",
      alt: "FilterTube iPhone app artwork",
    },
    chips: ["Protected now", "Profile switching", "Quick toggles"],
    primaryCta: {
      label: "Public access status",
      href: "/downloads#ios-status",
      external: false,
    },
    secondaryCta: {
      label: "Open downloads",
      href: downloadsHref,
      external: false,
    },
    heroVideo: {
      src: "/videos/ios/ios_hero_slow_540.mp4",
      label: "iPhone app preview",
      caption:
        "A short native iPhone preview for the current release-testing build.",
    },
    previewLabel: "iPhone intent",
    previewTitle: "Fast status, shallow depth, and one-thumb rule changes.",
    previewRows: [
      {
        label: "Top bar",
        value: "Profile pill",
        detail: "The active profile and lock state stay visible.",
      },
      {
        label: "Hero",
        value: "Protected now",
        detail: "State, time saved, and source stay readable in one card.",
      },
      {
        label: "Flow",
        value: "Bottom sheet",
        detail:
          "Add Rule, profile switching, and unlock feel native on iPhone.",
      },
    ],
    featureCards: [
      {
        title: "Main and Kids, with your rules",
        body: "Native viewing and rule controls keep Main and Kids contexts separate. Channel, keyword, and supported content filters stay scoped to the chosen profile.",
      },
      {
        title: "Profiles and parent control",
        body: "Profiles, PIN gates, protected time, imports, and backups are part of the native build. Child switching does not grant parent editing authority.",
      },
      {
        id: "ipad",
        title: "Room for iPad",
        body: "The iPad layout gives browsing, rule editing, and family setup more space while keeping the same profile boundaries. Public distribution remains pending for both devices.",
      },
    ],
    milestoneTitle: "iOS availability",
    milestoneIntro:
      "A native build in testing is different from an app users can install from a public listing.",
    milestones: [
      "iPhone and iPad public TestFlight and App Store access are pending.",
      "Pair verified devices and send parent updates. Newer personal Auto-sync features are not yet available on iOS.",
      "Follow this page for public installation links when testing and distribution are ready.",
    ],
    related: ["mobile", "ipados", "android"],
  },
  ipados: {
    slug: "ipados",
    icon: MonitorPlay,
    tone: "sky",
    status: "Public access pending",
    eyebrow: "iPad app",
    navTitle: "iPadOS",
    routeSummary:
      "A wide-screen FilterTube companion for family oversight and deeper management.",
    titleLead: "A wider FilterTube workspace for",
    titleDisplay: "iPad and home setup",
    description:
      "The native iPad build is in final build and testing alignment alongside iPhone. Public TestFlight access is pending while developer enrollment is unresolved.",
    heroArtwork: {
      src: "/apps/app-store-transparent.png",
      alt: "FilterTube iPad app artwork",
    },
    chips: ["Two-column calm", "Household setup", "Readable dashboards"],
    primaryCta: {
      label: "See the mobile overview",
      href: "/mobile",
      external: false,
    },
    secondaryCta: {
      label: "Read the product docs",
      href: docsHref,
      external: true,
    },
    previewLabel: "iPad intent",
    previewTitle: "More space creates calm, not more chrome.",
    previewRows: [
      {
        label: "Layout",
        value: "2 columns",
        detail:
          "Home can breathe into a dashboard without losing the quiet tone.",
      },
      {
        label: "Rules",
        value: "Persistent rail",
        detail:
          "Filters and scope controls can remain visible without crowding the canvas.",
      },
      {
        label: "Settings",
        value: "Split view",
        detail: "Profile and sync details feel deliberate and easy to scan.",
      },
    ],
    featureCards: [
      {
        title: "Overview for adults",
        body: "iPad is the best place for profile management, recent interventions, and family-wide visibility.",
      },
      {
        title: "Rule editing with room",
        body: "Wide layouts allow safer editing of channels, keywords, and categories without hidden controls.",
      },
      {
        title: "Still serene",
        body: "The extra space adds trust and legibility without turning the interface louder.",
      },
    ],
    milestoneTitle: "What iPad adds",
    milestoneIntro:
      "iPad becomes the wide household workspace instead of a stretched phone layout.",
    milestones: [
      "Use width to improve scanning and reduce friction.",
      "Keep active profile and lock state visible.",
      "Make household-level control feel quiet and intentional.",
    ],
    related: ["mobile", "ios", "android"],
  },
  android: {
    slug: "android",
    icon: DeviceMobile,
    tone: "forest",
    status: "Phone + tablet on Google Play",
    eyebrow: "Android phone, tablet + TV",
    navTitle: "Android",
    routeSummary:
      "The phone and tablet app is public. Android TV browsing and playback are in development; Fire TV support is planned.",
    titleLead: "Your viewing, your rules on",
    titleDisplay: "Android",
    description:
      "Watch YouTube Main and Kids in FilterTube's custom Android app, with filters, profiles, parent controls, and protected time. Install the phone and tablet app from Google Play—no invitation or email needed. Android TV is separate development work, not part of the public phone listing.",
    heroArtwork: {
      src: "/apps/android.png",
      alt: "FilterTube Android app artwork",
    },
    chips: [
      "Phone + tablet: available",
      "Android TV: in development",
      "Your rules",
    ],
    primaryCta: {
      label: "Install from Google Play",
      href: androidPlayStoreHref,
      external: true,
    },
    secondaryCta: {
      label: "Watch the app demo",
      href: appDemoVideoHref,
      external: true,
    },
    appPreview: {
      eyebrow: "Android app demo",
      title: "See the custom viewing experience.",
      body: "A look at FilterTube on phone and tablet. Newer development features below are labelled separately from the public release.",
      embedHref: "https://www.youtube-nocookie.com/embed/SHvSICSMHL4?rel=0",
      watchHref: appDemoVideoHref,
    },
    previewLabel: "Choose your Android device",
    previewTitle: "Phone and tablet today. A TV experience in development.",
    previewRows: [
      {
        label: "Phone + tablet",
        value: "Available",
        detail:
          "Install the complete custom app from Google Play. The direct APK is a separate, simpler build.",
      },
      {
        label: "Android TV",
        value: "In development",
        detail:
          "Main browsing, search, remote navigation, playback, and local history/resume are in testing. A public TV release is not available yet.",
      },
      {
        label: "Fire TV",
        value: "Planned",
        detail:
          "Separate compatibility and distribution work; no public TV install is promised by the phone listing.",
      },
    ],
    featureCards: [
      {
        title: "Main and Kids viewing",
        body: "The public app brings YouTube Main and Kids into a custom viewing experience, with rules and profiles instead of a generic browser.",
      },
      {
        title: "Filter around your needs",
        body: "Use channel and keyword rules, Blocklist or Whitelist, and supported category and content controls. Imports and backups help keep existing setups usable.",
      },
      {
        title: "Family profiles and protected time",
        body: "Separate profiles, PIN gates, and parent-managed viewing limits keep child access distinct from parent editing authority.",
      },
      {
        id: "android-tv",
        status: "In development",
        title: "Android TV",
        body: "Browse and search Main, navigate with a remote, play videos, and resume from local history in the TV test build. Full Kids and family controls, device sync, and public installation are still in development.",
      },
      {
        status: "Availability varies by release",
        title: "Native player and browsing",
        body: "Android development work includes browsing and search, channels and playlists, playback queues, history, captions, and transcript controls. Exact availability depends on the installed build.",
      },
      {
        id: "notes-auto-sync",
        status: "In testing",
        title: "Notes and Auto-sync",
        body: "Keep notes with videos and choose what to sync between approved profile links on your verified devices. These updates are in testing and may not be in your Google Play version yet.",
      },
      {
        status: "In testing",
        title: "Music and local media",
        body: "Music controls and a local-file library are in testing. Saving YouTube videos for offline viewing is a separate planned feature on Android.",
      },
      {
        title: "Secure device updates",
        body: "Pairing and parent updates use verified devices. New personal Auto-sync has its own consent and connection requirements; no shared-network presence automatically creates trust.",
      },
    ],
    milestoneTitle: "What is available, and what comes next",
    milestoneIntro:
      "Choose the version available for your device. New features and TV access have separate release schedules.",
    milestones: [
      "Phone and tablet: public on Google Play. Install directly—no invitation or email needed.",
      "Newer Notes, Auto-sync, Music, and local-media updates are in testing; availability varies by release.",
      "Android TV: Main browsing and playback are in testing. Full family controls, device sync, and public installation are not ready yet.",
      "Fire TV compatibility is planned. TV Notes, Auto-sync, Music, offline saves, and local ML are not available yet.",
      "The separate direct APK has a simpler frontend than the Google Play app.",
    ],
    related: ["extension", "ios", "kids"],
  },
  tv: {
    slug: "tv",
    icon: Television,
    tone: "sunset",
    status: "In development",
    eyebrow: "TV overview",
    navTitle: "TV overview",
    routeSummary:
      "Android TV Main browsing and playback are in testing; Fire TV compatibility is planned.",
    titleLead: "Shared-screen calm for",
    titleDisplay: "TV environments",
    description:
      "Android TV browsing, search, remote navigation, playback, and local history/resume are in testing. Full Kids and family controls, device sync, and public installation are still in development. Fire TV support is planned separately.",
    chips: ["Shared screens", "Playback trust", "Household safety"],
    primaryCta: {
      label: "Get FilterTube on desktop",
      href: extensionInstallHref,
      external: true,
    },
    secondaryCta: {
      label: "Watch FilterTube working",
      href: demoVideoHref,
      external: true,
    },
    previewLabel: "TV direction",
    previewTitle: "Living-room control feels calm from a distance.",
    previewRows: [
      {
        label: "Goal",
        value: "Shared safety",
        detail:
          "The TV story is about household trust, not personal dashboards.",
      },
      {
        label: "Surface",
        value: "Playback first",
        detail:
          "Playback screens and quick interventions matter more than dense editing tools.",
      },
      {
        label: "Signal",
        value: "Visible",
        detail: "Protection cues should be obvious from across the room.",
      },
    ],
    featureCards: [
      {
        title: "Built for shared attention",
        body: "Main browsing and playback are in testing. Full Kids and family controls are still in development.",
      },
      {
        title: "Less configuration in the foreground",
        body: "Remote navigation keeps Main browsing and playback usable from the sofa. Cross-device control and Accounts & Sync remain development work.",
      },
      {
        title: "A different mood from mobile",
        body: "TV layouts are designed for distance and directional input. Public installation is not available yet.",
      },
    ],
    milestoneTitle: "What TV needs to make clear",
    milestoneIntro:
      "TV is not just another app size. It is a different use case with different trust needs.",
    milestones: [
      "Prioritize shared-screen safety over settings density.",
      "Make playback and intervention states legible at distance.",
      "Route people toward Android TV and Fire TV detail pages cleanly.",
    ],
    related: ["android-tv", "fire-tv"],
  },
  "android-tv": {
    slug: "android-tv",
    icon: Television,
    tone: "sky",
    status: "In development",
    eyebrow: "Android TV app",
    navTitle: "Android TV",
    routeSummary:
      "Main browsing, search, remote navigation, playback, and local history/resume, currently in testing.",
    titleLead: "A FilterTube companion for",
    titleDisplay: "Android TV playback",
    description:
      "Browse Main and play videos with remote navigation and local history/resume in the TV test build. Full Kids and family controls, device sync, and public installation are still in development.",
    chips: ["Distance readable", "Playback cues", "Household trust"],
    primaryCta: {
      label: "See the TV overview",
      href: "/tv",
      external: false,
    },
    secondaryCta: {
      label: "Get FilterTube on desktop",
      href: extensionInstallHref,
      external: true,
    },
    previewLabel: "Android TV intent",
    previewTitle: "Protection cues still make sense from the sofa.",
    previewRows: [
      {
        label: "Playback",
        value: "Primary",
        detail: "The core story is safe playback and quick awareness.",
      },
      {
        label: "Feedback",
        value: "Clear",
        detail: "Blocked and allowed states stay clear without close reading.",
      },
      {
        label: "Relationship",
        value: "Companion",
        detail: "Heavy configuration still belongs on handheld surfaces.",
      },
    ],
    featureCards: [
      {
        title: "Remote-first clarity",
        body: "Copy and controls respect TV distance, focus rings, and directional input.",
      },
      {
        title: "Trust at glance",
        body: "Full Kids and parent controls are still in development and are not part of the current TV viewing experience.",
      },
      {
        title: "Still one brand",
        body: "Even with a more cinematic tone, the product still reads as part of the same serene system.",
      },
    ],
    milestoneTitle: "Android TV promise",
    milestoneIntro:
      "Android TV shows how FilterTube can feel native in the living room without pretending the whole product lives there.",
    milestones: [
      "Distance-readable typography and emphasis.",
      "Fewer but stronger states and interactions.",
      "Clear relation to the TV overview.",
    ],
    related: ["tv", "fire-tv"],
  },
  "fire-tv": {
    slug: "fire-tv",
    icon: Television,
    tone: "amber",
    status: "Planned",
    eyebrow: "Amazon Fire TV app",
    navTitle: "Amazon Fire TV",
    routeSummary:
      "A Fire TV overview focused on family playback and household confidence.",
    titleLead: "A household-safe FilterTube layer for",
    titleDisplay: "Amazon Fire TV",
    description:
      "Fire TV compatibility and public installation are planned. Android TV browsing and playback are in testing; full family controls are still in development.",
    chips: [
      "Family-safe playback",
      "Shared-screen confidence",
      "Living-room calm",
    ],
    primaryCta: {
      label: "See the TV overview",
      href: "/tv",
      external: false,
    },
    secondaryCta: {
      label: "Watch FilterTube working",
      href: demoVideoHref,
      external: true,
    },
    previewLabel: "Fire TV intent",
    previewTitle: "Simple, obvious, and calm enough for a shared screen.",
    previewRows: [
      {
        label: "Context",
        value: "Family",
        detail:
          "The Fire TV story stays close to family trust and playback safety.",
      },
      {
        label: "State",
        value: "Visible",
        detail: "Protected-now cues must feel obvious from the couch.",
      },
      {
        label: "Scope",
        value: "Focused",
        detail:
          "Fire TV stays focused on playback confidence, while heavier management belongs on phone or tablet.",
      },
    ],
    featureCards: [
      {
        title: "Shared attention first",
        body: "Fire TV stays focused on what households care about when content plays on a common screen.",
      },
      {
        title: "Simple intervention cues",
        body: "Intervention cues show what FilterTube is protecting without relying on dense explanation in the hero.",
      },
      {
        title: "Platform-specific trust",
        body: "The language and visual tone fit an Amazon TV environment without losing brand cohesion.",
      },
    ],
    milestoneTitle: "Fire TV priorities",
    milestoneIntro:
      "Fire TV stays distinct from Android TV while keeping the same household-safe story.",
    milestones: [
      "Keep the story centered on playback trust.",
      "Avoid generic TV app marketing copy.",
      "Link back to the TV overview clearly.",
    ],
    related: ["tv", "android-tv"],
  },
  kids: {
    slug: "kids",
    icon: ShieldCheck,
    tone: "rose",
    status: "Available today",
    eyebrow: "YouTube Kids protection",
    navTitle: "Kids",
    routeSummary:
      "A YouTube Kids overview focused on family safety, whitelist confidence, and parent-origin trust.",
    titleLead: "Make YouTube Kids feel",
    titleDisplay: "safer and calmer",
    description:
      "FilterTube began because parents needed keyword and channel blocking on YouTube Kids. Today FilterTube already offers whitelist mode, separate profiles, and calmer control for family viewing.",
    chips: [
      "Whitelist confidence",
      "Parent-origin story",
      "Zero-network Kids logic",
    ],
    primaryCta: {
      label: "Get FilterTube on desktop",
      href: extensionInstallHref,
      external: true,
    },
    secondaryCta: {
      label: "Read why FilterTube exists",
      href: "/#story",
      external: false,
    },
    previewLabel: "Kids mode today",
    previewTitle: "Separate profiles, stricter rules, and calm family trust.",
    previewRows: [
      {
        label: "Mode",
        value: "Kids profile",
        detail: "Kids rules stay separate from the main profile when needed.",
      },
      {
        label: "Filtering",
        value: "Whitelist",
        detail: "Whitelist mode is especially strong for family-safe setups.",
      },
      {
        label: "Behavior",
        value: "Zero-network",
        detail:
          "Kids filtering avoids unnecessary fetches and relies on intercepted data.",
      },
    ],
    featureCards: [
      {
        title: "Why parents start here",
        body: "Many families land on FilterTube because YouTube Kids still needs clearer blocking tools than the platform provides.",
      },
      {
        title: "What works today",
        body: "Whitelist mode, blocked channels, keyword rules, and profile separation already exist in FilterTube today.",
      },
      {
        title: "Why the tone stays calm",
        body: "Parents need to understand the controls quickly. The experience should feel trustworthy and protective, not fear-driven.",
      },
    ],
    milestoneTitle: "What parents should know right away",
    milestoneIntro:
      "Parents usually need two answers quickly: why FilterTube exists, and what a household can already use today.",
    milestones: [
      "FilterTube exists because families needed stronger keyword and channel controls on YouTube Kids.",
      "Whitelist mode, profile separation, and stricter rules already work in FilterTube today on desktop browsers.",
      "The product tone stays calm because family safety should read as trust, not panic.",
    ],
    related: ["mobile", "ml-ai"],
  },
  "ml-ai": {
    slug: "ml-ai",
    icon: Sparkle,
    tone: "ink",
    status: "Research direction",
    eyebrow: "ML and local intelligence",
    navTitle: "ML & AI",
    routeSummary:
      "How a future local intelligence layer could extend FilterTube without pushing user behavior into the cloud.",
    titleLead: "Local intelligence for",
    titleDisplay: "smarter filtering",
    description:
      "FilterTube already works through explicit rules. A future local semantic layer could add broader matching, clearer suggestions, and possible thumbnail checks without giving up the product’s local-first trust model.",
    chips: ["Local semantics", "Thumbnail direction", "No profiling"],
    primaryCta: {
      label: "Get FilterTube on desktop",
      href: extensionInstallHref,
      external: true,
    },
    secondaryCta: {
      label: "Read the docs",
      href: docsHref,
      external: true,
    },
    previewLabel: "Research track",
    previewTitle:
      "A local layer that helps rules catch more of what users already mean.",
    previewRows: [
      {
        label: "Today",
        value: "Explicit rules",
        detail:
          "Current filtering already starts with user-owned channel, keyword, Shorts, comments, and profile rules.",
      },
      {
        label: "Next layer",
        value: "Semantic help",
        detail:
          "Local semantic matching could broaden what those existing rules catch without replacing them.",
      },
      {
        label: "Later research",
        value: "Thumbnail checks",
        detail:
          "Visual analysis stays in roadmap language until there is a local, explainable version worth shipping.",
      },
    ],
    featureCards: [
      {
        title: "What exists today",
        body: "FilterTube already filters through explicit rules. That current foundation stays central here.",
      },
      {
        title: "What is being explored",
        body: "Semantic matching, rule suggestions, and later thumbnail checks are being explored. They are not available as working filters yet.",
      },
      {
        title: "Why local matters",
        body: "Any smarter filtering direction only fits FilterTube if it stays explainable, on-device, and under user control.",
      },
    ],
    milestoneTitle: "How to read the ML direction",
    milestoneIntro:
      "FilterTube already works today through explicit rules. A future local intelligence layer would extend that system without changing the privacy posture.",
    milestones: [
      "Current release: keyword, channel, Shorts, comments, whitelist, and profile controls already work in FilterTube today on desktop browsers.",
      "Research track: local semantic matching and suggestion support could extend those rules without sending user behavior to the cloud.",
      "Later-stage exploration: thumbnail analysis only belongs in the roadmap until a local, explainable implementation is real.",
    ],
    related: ["kids", "mobile"],
  },
};
