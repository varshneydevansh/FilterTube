import {
  Compass,
  EyeSlash,
  ShieldCheck,
  Sparkle,
  Stack,
  Strategy,
} from "@phosphor-icons/react/ssr";

export const navigationLinks = [
  { label: "Why", href: "/#story" },
  { label: "Platforms", href: "/#platforms" },
  { label: "System", href: "/#system" },
  { label: "Download", href: "/#download" },
];

export const footerLinks = {
  product: [
    { label: "Capabilities", href: "/#capabilities" },
    { label: "Platforms", href: "/#platforms" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of use", href: "/terms" },
  ],
  resources: [
    {
      label: "GitHub",
      href: "https://github.com/varshneydevansh/FilterTube",
      external: true,
    },
    {
      label: "Documentation",
      href: "https://github.com/varshneydevansh/FilterTube/tree/master/docs",
      external: true,
    },
    {
      label: "Issue tracker",
      href: "https://github.com/varshneydevansh/FilterTube/issues",
      external: true,
    },
    {
      label: "MIT License",
      href: "https://github.com/varshneydevansh/FilterTube/blob/master/LICENSE",
      external: true,
    },
  ],
};

export const capabilityTiles = [
  {
    label: "Zero-flash filtering",
    title: "Intercept the feed before it renders.",
    description:
      "FilterTube removes matching content from YouTube responses when the data is still JSON, so blocked content often never appears on screen in the first place.",
    points: [
      "Pre-render filtering covers home, search, watch, and playlist surfaces.",
      "A DOM fallback handles SPA navigation and recycled nodes without turning the system into a visual flicker machine.",
    ],
    icon: Compass,
    span: "xl:col-span-7",
  },
  {
    label: "Profiles and locks",
    title: "Separate rule sets for adults and children.",
    description:
      "Profiles keep households organized, while PIN locks protect the settings that should not be casually edited.",
    points: [
      "Master and child profiles keep rules independent.",
      "Kids-specific behavior can stay aligned with a stricter filtering posture.",
    ],
    icon: ShieldCheck,
    span: "xl:col-span-5",
  },
  {
    label: "Feed cleanup",
    title: "Shorts, comments, mixes, and shelf noise can all go.",
    description:
      "The product already supports broad cleanup controls so people can decide what kind of YouTube experience they want rather than inheriting the default one.",
    points: [
      "Hide Shorts entirely or remove comments for a calmer watch page.",
      "Mix and playlist handling stays precise enough to avoid collateral damage.",
    ],
    icon: EyeSlash,
    span: "xl:col-span-5",
  },
  {
    label: "Data portability",
    title: "Backups and exports stay in the user's hands.",
    description:
      "Settings can be exported, backed up, and restored without turning the product into a remote account system first.",
    points: [
      "Profile-scoped backups reduce accidental cross-contamination.",
      "Import and export flows are part of the product, not an afterthought.",
    ],
    icon: Stack,
    span: "xl:col-span-4",
  },
  {
    label: "Context-aware rules",
    title: "Filtering goes beyond simple word lists.",
    description:
      "Whole-word matching, channel identity normalization, whitelist mode, and content-based rules keep FilterTube useful even when YouTube's data structures shift.",
    points: [
      "Handles, UC IDs, and custom channel URLs are normalized behind the scenes.",
      "Category filters and clickbait detection extend the rule system beyond static phrases.",
    ],
    icon: Sparkle,
    span: "xl:col-span-8",
  },
];

export const pipelineSteps = [
  {
    title: "Intercept",
    description:
      "Capture the YouTube data source that matters before the UI finishes building around it.",
    icon: Strategy,
  },
  {
    title: "Resolve",
    description:
      "Normalize channel identity across handles, canonical IDs, collaborative credits, and moving YouTube data structures.",
    icon: Compass,
  },
  {
    title: "Filter",
    description:
      "Apply blocklist or whitelist rules, content controls, and profile-specific logic to the dataset.",
    icon: EyeSlash,
  },
  {
    title: "Stabilize",
    description:
      "Use a DOM fallback only where needed so the experience stays fast and visually calm.",
    icon: ShieldCheck,
  },
];

export const roadmapItems = [
  {
    label: "Now live",
    title: "Desktop release",
    status: "available",
    description:
      "Cross-browser availability is already the strongest public surface: Chrome, Firefox, Edge, Brave, and Opera-friendly release paths.",
  },
  {
    label: "In progress",
    title: "Mobile and iPad control center",
    status: "designing",
    description:
      "The mobile product direction centers on quick rule editing, profile switching, activity summaries, and safe setup flows without burying the user in dense settings.",
  },
  {
    label: "Planned",
    title: "TV companion surface",
    status: "mapping",
    description:
      "A living-room surface should focus on quiet playback controls, family context, and shared-screen safety instead of pretending to be the whole product.",
  },
];

export const browserLinks = [
  {
    name: "Chrome",
    note: "Web Store",
    href: "https://chromewebstore.google.com/detail/filtertube/cjmdggnnpmpchholgnkfokibidbbnfgc",
  },
  {
    name: "Brave",
    note: "Chrome listing",
    href: "https://chromewebstore.google.com/detail/filtertube/cjmdggnnpmpchholgnkfokibidbbnfgc",
  },
  {
    name: "Firefox",
    note: "Add-ons",
    href: "https://addons.mozilla.org/en-US/firefox/addon/filtertube/",
  },
  {
    name: "Edge",
    note: "Microsoft Add-ons",
    href: "https://microsoftedge.microsoft.com/addons/detail/filtertube/lgeflbmplcmljnhffmoghkoccflhlbem",
  },
  {
    name: "Opera",
    note: "GitHub releases",
    href: "https://github.com/varshneydevansh/FilterTube/releases",
  },
];

export const faqItems = [
  {
    question: "Does FilterTube send browsing data to your servers?",
    answer:
      "No. The product is built around local filtering. Rules, settings, and activity counters stay on the device surface using browser or local app storage.",
  },
  {
    question: "Can it handle YouTube Kids and family setups?",
    answer:
      "Yes. The product model already includes Kids-focused rule management, separate profiles, and PIN-protected flows so family safety is not bolted on later.",
  },
  {
    question: "Will the upcoming apps replace FilterTube on desktop?",
    answer:
      "No. FilterTube already works today on desktop browsers. Mobile, iPad, and TV surfaces extend the same control system and make the brand easier to trust across devices.",
  },
  {
    question: "Is the project open source?",
    answer:
      "Yes. The repository, documentation, release history, and issue tracker are public, which makes the product easier to audit and improve.",
  },
];
