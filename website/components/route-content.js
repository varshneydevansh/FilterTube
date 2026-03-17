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

export const demoVideoHref = "https://m.youtube.com/watch?v=dmLUu3lm7dE";

export const docsHref =
  "https://github.com/varshneydevansh/FilterTube/tree/master/docs";

export const githubHref = "https://github.com/varshneydevansh/FilterTube";

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
];

export const featuredRouteSlugs = ["mobile", "tv", "kids", "ml-ai"];

export const footerLinks = {
  product: [
    { label: "Desktop browsers", href: extensionInstallHref, external: true },
    { label: "Mobile", href: "/mobile" },
    { label: "TV", href: "/tv" },
    { label: "YouTube Kids", href: "/kids" },
    { label: "ML & AI", href: "/ml-ai" },
  ],
  resources: [
    { label: "Documentation", href: docsHref, external: true },
    { label: "GitHub", href: githubHref, external: true },
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
  "Built because a parent asked for keyword blocking on YouTube Kids and never got a real answer.",
  "Designed to keep filtering local, explainable, and calm instead of turning safety into another opaque cloud product.",
  "Available now on desktop browsers, with mobile, iPad, TV, and local intelligence plans already taking shape.",
];

export const homeCapabilityCards = [
  {
    label: "Pre-render control",
    title: "Most blocked content can disappear before the page fully builds.",
    description:
      "FilterTube intercepts YouTube data as early as it can, then falls back to DOM cleanup only where YouTube still leaves edge cases.",
    points: [
      "Home, search, watch, playlist, and related surfaces can be filtered before visual clutter lands.",
      "Fallback cleanup stays selective so the experience does not feel flickery or unstable.",
    ],
    icon: Compass,
    span: "xl:col-span-7",
  },
  {
    label: "Family safety",
    title:
      "Kids mode, profile separation, and PIN locks stay part of the product core.",
    description:
      "Family controls were not added later. Separate profiles, whitelist behavior, and locked settings are part of why the product exists.",
    points: [
      "Kids-safe setups can stay meaningfully stricter than the main profile.",
      "PIN-protected areas help adults keep household rules from being casually edited.",
    ],
    icon: ShieldCheck,
    span: "xl:col-span-5",
  },
  {
    label: "Noise removal",
    title:
      "Shorts, comments, mixes, and recommendation clutter can all be reduced.",
    description:
      "Users can shape YouTube into something calmer, whether the goal is family safety, better focus, or simply fewer rabbit holes.",
    points: [
      "Hide Shorts entirely or keep watch pages quieter by removing comments and noisy rails.",
      "Keyword, channel, and surface-level controls work together instead of living in separate silos.",
    ],
    icon: EyeSlash,
    span: "xl:col-span-5",
  },
  {
    label: "Next platforms",
    title:
      "The product is expanding into dedicated apps without losing the calm system already live today.",
    description:
      "Mobile, iPad, TV, and local ML plans belong to one serene system instead of feeling like disconnected product experiments.",
    points: [
      "Phone and tablet apps become the trusted control layer for rules, profiles, and activity.",
      "TV builds prioritize shared-screen confidence, while local intelligence stays privacy-first and explicit.",
    ],
    icon: Stack,
    span: "xl:col-span-7",
  },
];

export const systemSteps = [
  {
    title: "Intercept",
    description:
      "Capture the YouTube response or page state that matters before recommendation surfaces fully settle.",
    icon: Compass,
  },
  {
    title: "Normalize",
    description:
      "Resolve channel identity, URL variants, and content references into a consistent rule model.",
    icon: Stack,
  },
  {
    title: "Filter",
    description:
      "Apply keyword, channel, whitelist, Shorts, comments, and profile-specific rules with clear precedence.",
    icon: EyeSlash,
  },
  {
    title: "Stabilize",
    description:
      "Use a targeted DOM fallback only when needed so the page still feels calm and readable.",
    icon: ShieldCheck,
  },
];

export const homeFaqItems = [
  {
    question: "Does FilterTube send browsing data to your servers?",
    answer:
      "No. Filtering stays local to the browser or device using local storage and product-controlled settings.",
  },
  {
    question: "Will mobile and TV replace FilterTube on desktop?",
    answer:
      "No. FilterTube already works today on desktop browsers, and the upcoming apps extend that same control system across more screens.",
  },
  {
    question: "Why is Shorts filtering highlighted so often?",
    answer:
      "Because for many households and students, reducing Shorts is one of the fastest ways to make YouTube feel calmer again.",
  },
  {
    question: "How should the ML and AI direction be understood today?",
    answer:
      "As a future local layer that could make the current rule system smarter. It is not built around cloud behavior tracking, and thumbnail analysis remains a research track.",
  },
];

export const homeTechnicalFeatures = [
  {
    title: "Exact Word Matching",
    description:
      "Keyword rules can use exact word boundaries when users want stricter matching instead of loose partial matches.",
    detail: "Optional exact-match toggle for keyword rules.",
  },
  {
    title: "Channel Whitelist",
    description:
      "Whitelist mode can leave only approved channels and keywords visible for stricter setups.",
    detail: "Useful for trusted-creators-only households and study profiles.",
  },
  {
    title: "Comment Blocker",
    description:
      "Comment sections can be removed entirely or specific based on the commenter or keywords too when the goal is a quieter watch page.",
    detail: "Supports full comment-section hiding.",
  },
  {
    title: "Shorts Blocker",
    description:
      "Shorts shelves, cards, and related entry points can be hidden to reduce doom-scrolling pressure.",
    detail: "One of the fastest ways to calm the feed.",
  },
  {
    title: "Pre-Render Filtering",
    description:
      "When YouTube data can be intercepted early, blocked items are removed before they visibly land on screen.",
    detail: "DOM fallback still covers recycled or delayed surfaces.",
  },
  {
    title: "Performance Optimizations",
    description:
      "FilterTube uses selective processing and bridge-level optimizations so filtering stays lightweight.",
    detail: "Built around interception first, fallback only where needed.",
  },
  {
    title: "Auto Backup",
    description:
      "Automatic backups can be written into `Downloads/FilterTube Backup/` with profile-aware folders and backup rotation.",
    detail: "Supports history/latest modes and encrypted backup flows.",
  },
  {
    title: "Import / Export",
    description:
      "Manual export and restore flows exist for FilterTube data portability, including native exports and compatible import paths.",
    detail: "Handled through the advanced dashboard settings flow.",
  },
  {
    title: "Members-Only Control",
    description:
      "Members-only videos and shelves can be hidden across watch, sidebar, playlist, and compact video layouts.",
    detail: "Covers common watch-page and shelf surfaces.",
  },
  {
    title: "Mix / Radio Handling",
    description:
      "Playlist hiding logic distinguishes Mix and Radio items so they are not incorrectly treated like standard playlists.",
    detail: "Protects playlist controls from over-hiding.",
  },
  {
    title: "What's New Dashboard",
    description:
      "Release notes are surfaced inside the product through a dedicated What's New flow and dashboard data source.",
    detail: "Keeps feature updates visible inside FilterTube.",
  },
];

export const platformOrder = platformSlugs;

export const detailPages = {
  mobile: {
    slug: "mobile",
    icon: DeviceMobile,
    tone: "sage",
    status: "In progress",
    eyebrow: "Dedicated apps",
    navTitle: "Mobile overview",
    routeSummary:
      "A calm overview of the upcoming iPhone, iPad, and Android app family.",
    titleLead: "A calm FilterTube companion for",
    titleDisplay: "phones and tablets",
    description:
      "The mobile family starts as a protected control center: fast rule changes, profile switching, recent interventions, and clear status without turning the experience into a dense settings wall.",
    chips: ["Signal Rail", "One-thumb controls", "Local-first trust"],
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
    status: "Planned",
    eyebrow: "iPhone app",
    navTitle: "iPhone",
    routeSummary:
      "A dedicated iPhone app centered on quick control and trusted setup.",
    titleLead: "A native FilterTube app for",
    titleDisplay: "iPhone control",
    description:
      "The iPhone app centers on immediate status, fast rule edits, and setup guidance that never feels technical.",
    chips: ["Protected now", "Profile switching", "Quick toggles"],
    primaryCta: {
      label: "See the mobile direction",
      href: "/mobile",
      external: false,
    },
    secondaryCta: {
      label: "Get FilterTube on desktop",
      href: extensionInstallHref,
      external: true,
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
    status: "Planned",
    eyebrow: "iPad app",
    navTitle: "iPadOS",
    routeSummary:
      "A wide-screen FilterTube companion for family oversight and deeper management.",
    titleLead: "A wider FilterTube workspace for",
    titleDisplay: "iPad and home setup",
    description:
      "The iPad app becomes a spacious household workspace: profile-aware dashboards, cleaner rule management, and room for family oversight without noise.",
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
    status: "Planned",
    eyebrow: "Android app",
    navTitle: "Android",
    routeSummary:
      "A flexible Android app for rules, profiles, and protected browsing.",
    titleLead: "A flexible FilterTube companion for",
    titleDisplay: "Android devices",
    description:
      "The Android app balances direct control, profile switching, recent interventions, and a path toward protected browsing without feeling chaotic.",
    chips: ["Flexible layout", "Quick rules", "Protected sessions"],
    primaryCta: {
      label: "See the mobile overview",
      href: "/mobile",
      external: false,
    },
    secondaryCta: {
      label: "Get FilterTube on desktop",
      href: extensionInstallHref,
      external: true,
    },
    previewLabel: "Android intent",
    previewTitle: "Utility and calm can coexist on Android.",
    previewRows: [
      {
        label: "Control",
        value: "Direct",
        detail: "Rule editing should be fast without losing readability.",
      },
      {
        label: "Profiles",
        value: "Scoped",
        detail: "Main and Kids contexts should remain clearly separated.",
      },
      {
        label: "Future path",
        value: "Protected browse",
        detail:
          "Protected browsing stays modular until implementation is locked.",
      },
    ],
    featureCards: [
      {
        title: "Fast rule control",
        body: "Android is for people who edit filters often and expect direct access to the system.",
      },
      {
        title: "Readable under motion",
        body: "The product stays legible even while scenic theming and motion are active.",
      },
      {
        title: "Honest roadmap language",
        body: "Protected browsing and advanced integrations stay clearly marked until they ship.",
      },
    ],
    milestoneTitle: "Android priorities",
    milestoneIntro:
      "Android balances flexibility with the same calm trust posture used elsewhere.",
    milestones: [
      "Avoid technical bragging that makes the experience feel harsh.",
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
