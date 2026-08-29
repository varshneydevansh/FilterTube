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
    name: "Android",
    note: "Google Play",
    href: androidPlayStoreHref,
    logo: "/apps/android.png",
  },
  {
    name: "iOS",
    note: "App status",
    href: "/ios",
    logo: "/apps/app-store-transparent.png",
    internal: true,
  },
];

export const featuredRouteSlugs = ["mobile", "tv", "kids", "ml-ai"];

export const footerLinks = {
  product: [
    { label: "Downloads", href: downloadsHref },
    { label: "Desktop browsers", href: extensionInstallHref, external: true },
    { label: "Mobile", href: "/mobile" },
    { label: "TV", href: "/tv" },
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
  "Install the browser extension, open FilterTube, and add the words or channels you do not want YouTube to show.",
  "FilterTube is built by a neurodivergent developer who needed calmer YouTube for ADHD focus, then shaped further by parents and caregivers.",
  "Families with autistic children and other neurodivergent users are part of the reason the controls are becoming simpler, clearer, and easier to trust.",
  "Use profiles when different people need different rules. Use a PIN when those rules should not be changed casually.",
  "Desktop extensions work today. FilterTube for Android is publicly available on Google Play and can be installed from the listing or found by searching Google Play for FilterTube.",
  "The Android app includes Main, Kids, profiles, protected time, and content-first playback.",
  "The iPhone and iPad build is in final testing alignment. Apple Developer account access is delaying TestFlight for now and will be resolved as soon as possible.",
];

export const homeCapabilityCards = [
  {
    label: "Ad-free viewing",
    title: "Keep YouTube adverts out of the video you asked to watch.",
    description:
      "The extension removes observed YouTube advert plans before playback and keeps a guarded fallback for adverts that escape. The native app uses its content-first player path instead of YouTube's browser advert path.",
    points: [
      "Advert removal is enabled by default and works in both Blocklist and Whitelist modes.",
      "Built for YouTube Main and YouTube Kids, with compatibility checked as YouTube changes its player.",
    ],
    icon: EyeSlash,
    span: "xl:col-span-12",
  },
  {
    label: "Block what you name",
    title: "Hide channels, keywords, Shorts, comments, and noisy surfaces.",
    description:
      "Start with the simple lists: add a channel, add a word, or turn off an entire surface like Shorts or comments.",
    points: [
      "Blocklist mode hides what you add.",
      "Whitelist mode is stricter: only approved channels or rules should remain visible.",
    ],
    icon: Compass,
    span: "xl:col-span-7",
  },
  {
    label: "Profiles and PINs",
    title:
      "Give each person their own rules without turning setup into an IT job.",
    description:
      "A parent can keep the main profile open, create protected child profiles, and use PINs so settings are not changed by accident.",
    points: [
      "Child profile PINs help stop casual profile switching.",
      "Parent or master unlock controls rule editing, device trust, and backups.",
    ],
    icon: ShieldCheck,
    span: "xl:col-span-5",
  },
  {
    label: "Daily calm",
    title:
      "Reduce the parts of YouTube that usually pull people off track.",
    description:
      "FilterTube is useful for parents, students, ADHD focus, and anyone who wants YouTube to stop pushing the same distractions.",
    points: [
      "Hide Shorts when short-form scrolling is the problem.",
      "Hide comments when the watch page needs to stay quieter.",
    ],
    icon: EyeSlash,
    span: "xl:col-span-5",
  },
  {
    label: "Devices and apps",
    title:
      "The same rule model is moving from desktop into phone, tablet, and TV.",
    description:
      "The extension and Android app are live, and the native Apple build is in final testing alignment.",
    points: [
      "Open the public Android listing directly or search Google Play for FilterTube.",
      "Apple Developer account access is currently delaying TestFlight and will be resolved as soon as possible.",
      "Remote family updates use verified device trust, not a public account full of private viewing data.",
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
    question: "What should I do first after installing?",
    answer:
      "Open FilterTube, add one word or one channel you want hidden, then refresh YouTube. Add profiles, PINs, Kids rules, or imports later only if you need them.",
  },
  {
    question: "What does Exact mean?",
    answer:
      "Exact off is wider. For example, poop can also catch poops or pooping. Exact on is stricter, so poop only matches the word poop.",
  },
  {
    question: "Can a child or sibling change the rules?",
    answer:
      "Not if you lock the profile. A child PIN helps stop casual profile switching. The parent or master unlock is still needed to change rules, devices, and backups.",
  },
  {
    question: "Does FilterTube send browsing data to your servers?",
    answer:
      "No. Filtering is local-first. Device sync can help two trusted devices connect or pick up an update, but it is designed so the helper service cannot read your rules.",
  },
  {
    question: "How do I install the Android app?",
    answer:
      "Open the public FilterTube listing on Google Play and install it, or search Google Play for FilterTube and choose the app from the official listing.",
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
      "Export your FilterTube setup before a big change, or keep local backup files for recovery.",
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
    detail: "Live P2P, same-network pickup, and lazy checks are separate paths.",
  },
  {
    title: "Local-first design",
    description:
      "FilterTube is built around local rules and public source code, so users can inspect what the product is doing.",
    detail: "Open source and privacy-first by design.",
  },
];

export const platformOrder = platformSlugs;

export const detailPages = {
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
    previewTitle: "Protected now stays visible in under five seconds.",
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
        body: "Protected browsing can grow through in-app sessions, Safari handoff, or guided setup without breaking the calm experience.",
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
    status: "Finalizing for TestFlight",
    eyebrow: "iPhone app",
    navTitle: "iPhone",
    routeSummary:
      "A dedicated iPhone app centered on quick control and trusted setup.",
    titleLead: "A native FilterTube app for",
    titleDisplay: "iPhone control",
    description:
      "The native iPhone app is in final build and testing alignment. An Apple Developer account issue on Apple's side is delaying TestFlight access, and we are working to resolve it as soon as possible.",
    heroArtwork: {
      src: "/apps/app-store-transparent.png",
      alt: "FilterTube iPhone app artwork",
    },
    chips: ["Protected now", "Profile switching", "Quick toggles"],
    primaryCta: {
      label: "See the mobile direction",
      href: "/mobile",
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
        title: "Clear protection status",
        body: "The iPhone app becomes the quick control center for what FilterTube is doing right now.",
      },
      {
        title: "Friendly setup language",
        body: "Copy stays plain with labels like Protected now, Kids profile active, or Paused until you re-enable.",
      },
      {
        title: "No dashboard clutter",
        body: "The interface avoids admin-console clutter and never slips into security-dashboard language.",
      },
    ],
    milestoneTitle: "What iPhone makes clear first",
    milestoneIntro: "The iPhone story is clarity first, not feature volume.",
    milestones: [
      "Reassure in under five seconds.",
      "Respect safe areas, thumb reach, and mobile readability.",
      "Keep advanced controls available without making the first screen dense.",
    ],
    related: ["mobile", "ipados", "android"],
  },
  ipados: {
    slug: "ipados",
    icon: MonitorPlay,
    tone: "sky",
    status: "Finalizing for TestFlight",
    eyebrow: "iPad app",
    navTitle: "iPadOS",
    routeSummary:
      "A wide-screen FilterTube companion for family oversight and deeper management.",
    titleLead: "A wider FilterTube workspace for",
    titleDisplay: "iPad and home setup",
    description:
      "The native iPad build is in final build and testing alignment alongside iPhone. An Apple Developer account issue on Apple's side is delaying TestFlight access for now.",
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
    status: "Available on Google Play",
    eyebrow: "Android app",
    navTitle: "Android",
    routeSummary:
      "The feature-rich Android custom viewing app is publicly available on Google Play.",
    titleLead: "A flexible FilterTube companion for",
    titleDisplay: "Android devices",
    description:
      "The public Google Play app contains FilterTube's complete custom viewing experience, including rules, profiles, protected time, YouTube Main, YouTube Kids, and content-first ad-free playback. Users can install it from the listing or search Google Play for FilterTube. The direct APK is a separate, simpler build without this complete custom frontend.",
    heroArtwork: {
      src: "/apps/android.png",
      alt: "FilterTube Android app artwork",
    },
    chips: ["Complete custom frontend", "Ad-free playback", "Google Play"],
    primaryCta: {
      label: "Open on Google Play",
      href: androidPlayStoreHref,
      external: true,
    },
    secondaryCta: {
      label: "See the mobile overview",
      href: "/mobile",
      external: false,
    },
    previewLabel: "Android intent",
    previewTitle: "The complete custom app is available to everyone.",
    previewRows: [
      {
        label: "Access",
        value: "Public listing",
        detail: "Install from the listing or search Google Play for FilterTube.",
      },
      {
        label: "Profiles",
        value: "Scoped",
        detail: "Main and Kids contexts should remain clearly separated.",
      },
      {
        label: "Current build",
        value: "Custom frontend",
        detail: "The feature-rich Main and Kids viewing experience is available on public Android installs.",
      },
    ],
    featureCards: [
      {
        title: "Complete custom viewing app",
        body: "The Google Play build brings FilterTube rules, profiles, protected time, Main, Kids, and content-first playback into one feature-rich experience.",
      },
      {
        title: "Readable under motion",
        body: "The product stays legible even while scenic theming and motion are active.",
      },
      {
        title: "Available on real Android devices",
        body: "Anyone can install the app from Google Play and use the complete experience across phones and tablets.",
      },
    ],
    milestoneTitle: "Android priorities",
    milestoneIntro:
      "Android balances flexibility with the same calm trust posture used elsewhere.",
    milestones: [
      "Welcome Android users from the public Google Play listing.",
      "Keep the working release build stable across real phones and tablets.",
      "Keep product-control language clear and direct.",
      "Use serene visuals without losing Android’s practical character.",
    ],
    related: ["mobile", "ios", "ipados"],
  },
  tv: {
    slug: "tv",
    icon: Television,
    tone: "sunset",
    status: "Mapping",
    eyebrow: "TV overview",
    navTitle: "TV overview",
    routeSummary: "A living-room overview for Android TV and Amazon Fire TV.",
    titleLead: "Shared-screen calm for",
    titleDisplay: "TV environments",
    description:
      "The TV family needs a different promise than mobile: shared-screen safety, playback trust, and household-friendly controls that make sense from across the room.",
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
        body: "TV viewing stays focused on family-safe playback and the confidence of handing the remote to someone else.",
      },
      {
        title: "Less configuration in the foreground",
        body: "Heavy editing belongs on phone or tablet. TV keeps playback state and quick overrides in front.",
      },
      {
        title: "A different mood from mobile",
        body: "The mood turns more cinematic and spacious, with copy tuned for shared-screen trust.",
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
    status: "Planned",
    eyebrow: "Android TV app",
    navTitle: "Android TV",
    routeSummary:
      "A living-room FilterTube companion for Android TV households.",
    titleLead: "A FilterTube companion for",
    titleDisplay: "Android TV playback",
    description:
      "Android TV brings FilterTube into the living room with clear protection status, shared-screen trust, and feedback that stays easy to read from the sofa.",
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
        body: "Parents and households can trust that the shared screen remains predictable.",
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
      "Fire TV carries the same household-safe promise as Android TV with platform-specific framing: family-safe playback, visible protection cues, and a calm shared-screen experience.",
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
        body: "Semantic matching, rule suggestions, and later thumbnail checks belong to the research track, not the shipped claim.",
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
