import { devices, galleryFor, kidsScreens } from "@/data/screenshots";
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
export const redditHref = "https://www.reddit.com/r/FilterTubeApp/";
export const instagramHref = "https://www.instagram.com/filtertube.in/";
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
    note: "Install directly",
    href: "/ios",
    logo: "/apps/app-store-transparent.png",
    internal: true,
  },
];

// Desktop package routes, not a claim of installed testing in every browser.
export const desktopExtensionBrowsers = [
  { title: "Chrome", src: "/browsers/chrome.png", href: extensionInstallHref, note: "Chrome Web Store" },
  { title: "Firefox", src: "/browsers/firefox.png", href: "https://addons.mozilla.org/en-US/firefox/addon/filtertube/", note: "Firefox Add-ons" },
  { title: "Edge", src: "/browsers/edge.png", href: "https://microsoftedge.microsoft.com/addons/detail/filtertube/lgeflbmplcmljnhffmoghkoccflhlbem", note: "Edge Add-ons" },
  { title: "Brave", src: "/browsers/brave.png", href: extensionInstallHref, note: "Chrome Web Store" },
  { title: "Vivaldi", src: "/browsers/vivaldi.png", href: extensionInstallHref, note: "Chrome Web Store" },
  { title: "Opera", src: "/browsers/opera.png", href: extensionInstallHref, note: "Chrome Web Store" },
  { title: "Waterfox", src: "/browsers/waterfox.png", href: "https://addons.mozilla.org/en-US/firefox/addon/filtertube/", note: "Firefox Add-ons" },
  { title: "Zen", src: "/browsers/zen.svg", href: "https://addons.mozilla.org/en-US/firefox/addon/filtertube/", note: "Firefox Add-ons" },
  { title: "Floorp", src: "/browsers/floorp.svg", href: extensionInstallHref, note: "Chrome extensions" },
  { title: "Chromium", src: "/browsers/chromium.png", href: `${githubHref}/releases/latest`, note: "Manual ZIP" },
  { title: "Arc", src: "/browsers/arc.png", href: extensionInstallHref, note: "Existing desktop users" },
];

export const featuredRouteSlugs = ["android", "ios", "extension", "kids"];

export const footerLinks = {
  product: [
    { label: "Downloads", href: downloadsHref },
    { label: "Android: phone, tablet, TV", href: "/android" },
    { label: "iOS: iPhone and iPad", href: "/ios" },
    { label: "Browser extension", href: "/extension" },
    { label: "Peer-to-peer device sync", href: "/#device-sync" },
    { label: "Kids", href: "/kids" },
    { label: "ML & AI", href: "/ml-ai" },
  ],
  resources: [
    { label: "Reddit community", href: redditHref, external: true },
    { label: "Instagram", href: instagramHref, external: true },
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
  "FilterTube began with a neurodivergent developer who wanted calmer viewing for ADHD focus.",
  "Parents, caregivers, and autistic and other neurodivergent users have helped shape clearer controls for different needs.",
  "The goal is practical: enjoy the creators you choose, keep unwanted content out, and give each person rules that fit them.",
  "Independent development keeps the project close to that feedback. Community reports and contributions help it improve across phones, tablets, TVs, and browsers.",
];

export const homeCapabilityCards = [
  {
    label: "Playback",
    title: "Keep the video you chose at the center.",
    description:
      "FilterTube filters adverts and unwanted content. The Android app has its own viewing experience; the extension keeps the familiar player controls.",
    points: [
      "Advert filtering is enabled by default in Blocklist and Whitelist modes.",
      "Playback paths differ by platform, and compatibility still needs maintenance when the platform changes.",
    ],
    icon: EyeSlash,
    span: "xl:col-span-12",
  },
  {
    label: "Rules",
    title: "Block what you name, or allow only what you trust.",
    description:
      "Add channels, keywords, or supported content filters. Keep separate rules for Main and Kids when they need different boundaries.",
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
      "Choose the surfaces that interrupt your attention instead of removing every feature.",
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
      "Opt-in Auto-sync keeps approved devices up to date. Direct sync needs both devices open and connected.",
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
    body: "A parent using FilterTube on a child’s PC said the product is exactly what their viewing experience has been missing, then asked for a simpler guide and clearer explanations.",
    href: "https://www.reddit.com/r/FilterTube/comments/1uhtqo7/some_feedback/",
  },
  {
    source: "Caregiver request on GitHub",
    title: "Neurodivergent families need calmer control.",
    body: "A caregiver described using FilterTube to show an autistic family member the good side of the internet while shielding sensitive learning from harmful content.",
    href: "https://github.com/varshneydevansh/FilterTube/issues/60#issuecomment-4612147210",
  },
  {
    source: "Parent demo comment",
    title: "Whitelist setups matter for study computers.",
    body: "A parent said FilterTube solved nearly everything for a child’s study PC and asked for stronger protection around turning filtering off.",
    href: "https://www.youtube.com/watch?v=dmLUu3lm7dE&t=26s",
  },
];

export const systemSteps = [
  {
    title: "Add rules",
    description:
      "Choose words, channels, videos, comments, Shorts, or Whitelist rules from the dashboard.",
    icon: Compass,
  },
  {
    title: "Pick the profile",
    description:
      "Keep the adult profile, child profiles, and Kids rules separate when they need different limits.",
    icon: Stack,
  },
  {
    title: "Start watching",
    description:
      "FilterTube removes matching videos and surfaces as the page loads, then cleans up anything added later.",
    icon: EyeSlash,
  },
  {
    title: "Adjust when needed",
    description:
      "If the platform changes its layout, tell the developer. That is usually the reason filtering suddenly misses a surface.",
    icon: ShieldCheck,
  },
];

export const homeFaqItems = [
  {
    question: "How do I start?",
    answer:
      "Install the Android app or browser extension, add one channel or keyword, then check the result. In the extension, refresh the page after your first rule. Add profiles, PINs, Kids rules, and imports when you need them.",
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
      "Check the active profile, rule space, and Exact setting first. Page layout changes can also affect filtering. A small example, page type, and screenshot help diagnose it; share only the private details you choose.",
  },
];

export const homeTechnicalFeatures = [
  {
    title: "Ad-free playback",
    description:
      "Filter adverts without changing whether the active profile uses Blocklist or Whitelist rules.",
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
      "Block a channel, allow only trusted channels, or use channel IDs and handles without memorizing URL formats.",
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
      "Filter supported Shorts with channel and keyword rules, or hide Shorts shelves, cards, and entry points when you want less short-form scrolling.",
    detail: "A common first step for families and focus setups.",
  },
  {
    title: "Profiles",
    description:
      "Keep different rule sets for adults, children, study time, or stricter Kids setups.",
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
    title: "Followed-channel Whitelist",
    description:
      "Import the channels the signed-in viewing account follows into the current profile’s Whitelist, then choose whether to only store them or turn Whitelist mode on.",
    detail: "Useful when a child should only see channels you already follow.",
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
      "Set daily viewing limits per profile. Separate Self-Control Sessions hold chosen rules, while Hard Timer Whitelist limits Main viewing to selected approved channels for a reviewed countdown.",
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
    description:
      "Optionally hide videos below a view-count threshold in Main and Kids when a usable view count is available.",
    detail:
      "Works in the extension and the apps; videos without a usable view count are not hidden by this rule.",
  },
  {
    title: "Saved video notes",
    description:
      "Keep notes with a video inside the selected profile. Extension Notes work on supported Watch pages; the Android app has a video Notes editor and a searchable Notes index.",
    detail:
      "Notes belong to one profile and follow its permissions.",
  },
  {
    title: "Opt-in Auto-sync",
    description:
      "Choose supported settings, filter rules, and notes to sync on approved profile links between verified devices. Offline changes wait locally for a supported connection.",
    detail:
      "In the extension and the Android app; supported devices must be open and connected for direct sync.",
  },
  {
    title: "Reviewed preference reset",
    description:
      "Review ordinary display and playback defaults for the chosen profile. Your filter rules, notes, PINs, time limits, device permissions and profile ownership are preserved.",
    detail:
      "Parent safeguards still apply; reset is a deliberate action, not an automatic cleanup.",
  },
  {
    title: "Compatible rule exports",
    description:
      "Review compatible channel and keyword rules before exporting one profile and rule space for BlockTube.",
    detail:
      "A compatibility export is not a complete FilterTube backup; unsupported settings stay out.",
  },
];


// Screens come from data/screenshots.js so fresh captures drop in without code changes.
export const androidPhoneScreens = galleryFor("androidPhone");
export const androidTabletScreens = galleryFor("androidTablet");
export const androidTvScreens = galleryFor("androidTv");
export const iphoneScreens = galleryFor("iphone");
export const ipadScreens = galleryFor("ipad");
export const kidsPhoneScreens = kidsScreens.phone;
export const kidsTabletScreens = kidsScreens.tablet;
export const kidsTvScreens = kidsScreens.tv;

export const platformOrder = platformSlugs;

export const detailPages = {
  extension: {
    slug: "extension",
    icon: MonitorPlay,
    tone: "lilac",
    status: "Available for browsers",
    eyebrow: "Browser extension",
    navTitle: "Browser extension",
    routeSummary:
      "Keep the familiar player and add filters, profiles, and local control in your browser.",
    titleLead: "Your familiar viewing, with",
    titleDisplay: "your rules",
    description:
      "Filter channels, keywords, Shorts, comments, and supported content on the pages you already use. Use the popup for quick changes, the dashboard for deeper setup, and the video menu to block content as you browse.",
    chips: ["Main + Kids", "Local rules", "Family profiles"],
    heroScreensLayout: "popup",
    heroScreensLabel: "Extension preview · hover or tap a screen",
    heroScreens: [
      { src: "/apps/screenshots/extension-keywords.png", title: "Keywords", alt: "FilterTube extension popup with keyword search, add and list controls", width: 391, height: 388 },
      { src: "/apps/screenshots/extension-channels.png", title: "Channels", alt: "FilterTube extension popup with channel search and saved channel rules", width: 392, height: 442 },
      { src: "/apps/screenshots/extension-content-controls.png", title: "Content controls", alt: "FilterTube extension popup with category and feed filter switches", width: 397, height: 542 },
    ],
    screenshotsLayout: "desktop",
    screenshotsLabel: "Extension preview screenshots",
    screenshotsEyebrow: "Current extension preview",
    screenshotsTitle: "A closer look at the extension",
    screenshotsDescription: "Explore the full dashboard, profile rules, focus settings and device sync. Features and appearance may differ from your browser store version.",
    screenshots: [
      {
        src: "/apps/screenshots/extension-dashboard.png",
        title: "Dashboard",
        alt: "FilterTube extension preview: Dashboard",
        caption: "An overview of profiles, viewing spaces and frequently used controls.",
        width: 1720,
        height: 1261,
      },
      {
        src: "/apps/screenshots/extension-channel-rules.png",
        title: "Channel rules",
        alt: "FilterTube extension preview: Channel rules",
        caption: "Review blocked and allowed channels for your selected profile.",
        width: 1723,
        height: 1251,
      },
      {
        src: "/apps/screenshots/extension-kids-rules.png",
        title: "Kids rules",
        alt: "FilterTube extension preview: Kids rules",
        caption: "Keep channel rules for Kids separate from Main viewing.",
        width: 1722,
        height: 1263,
      },
      {
        src: "/apps/screenshots/extension-focus-settings.png",
        title: "Focus and settings",
        alt: "FilterTube extension preview: Focus and settings",
        caption: "Review focus sessions, backups and preference controls.",
        width: 1716,
        height: 1254,
      },
      {
        src: "/apps/screenshots/extension-imports-language.png",
        title: "Imports and language",
        alt: "FilterTube extension preview: Imports and language",
        caption: "Preview imported rules and choose your interface language.",
        width: 1722,
        height: 1245,
      },
      {
        src: "/apps/screenshots/extension-accounts-sync.png",
        title: "Accounts & Sync",
        alt: "FilterTube extension preview: Accounts & Sync",
        caption: "Choose a device, verify the connection and decide what to sync.",
        width: 1718,
        height: 1258,
      },
    ],

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
    featureCards: [],
    deviceSyncHref: "#extension-p2p",
    exploreTitle: "Explore the extension",
    exploreDescription: "Add controls to the existing pages through the popup, dashboard, and supported inline actions. Open a group for the details.",
    exploreGroups: [
      {
        id: "extension-filters",
        title: "Filter what appears",
        summary: "Channel, keyword, video, and metadata rules—with separate Main and Kids spaces.",
        points: [
          "Block unwanted channels, keywords or videos, or use Whitelist for approved content. Keep Blocked and Allowed rules with exceptions; editing a list does not switch your viewing mode.",
          "Paste a channel handle, ID or supported URL. Use Exact for precise keywords, filter supported comments, and choose creators on supported collaboration cards.",
          "Use Import Subscribed Channels to add your subscriptions to the current profile's Whitelist, then choose whether to enable Whitelist mode. Main and Kids retain separate rule spaces and modes.",
          "Narrow videos by length, upload date, uppercase titles and—in newer releases—minimum views. Search and sort saved rules separately by when they were added.",
          "Choose from 15 video categories or 32 experimental Main video-language options using available metadata. Language filtering is not speech recognition and is not exposed for Kids; missing metadata can limit any content decision.",
          "The dashboard home has a What Uljhan tried today card: the last 30 things your filters kept out, each with its reason (a blocked word, a blocked channel or a content control) and a way to change that setting. It is kept on this device only, and it is in the extension only; the apps do not have it.",
        ],
      },
      {
        id: "extension-focus",
        title: "Quiet the distractions",
        summary: "Hide distracting feeds, panels, and player overlays.",
        points: [
          "The content-control catalogue has 32 switches across seven groups: Core, Feeds, Watch page, Video info, Player, Navigation, and Search.",
          "Hide Shorts, the homepage feed, comments, Playables, playlist cards, members-only videos, or Mix/Radio playlists. Quick Block and the three-dot Block menu can be enabled separately.",
          "Quiet the Watch page by hiding related videos, the sidebar, live chat, or playlist panel. Video information controls cover the buttons bar, Ask, channel row, description, and merchandise/ticket/offer panels.",
          "Player controls include advert filtering, end-screen cards and videowalls, autoplay, and annotations. Content-only playback and original-audio preference are separate experimental controls; the desktop Watch path keeps the native player.",
          "Navigation controls can hide the top header, notification bell, Explore/Trending, additional services, or Subscriptions. Search has its own irrelevant-result control. Coverage varies with current page layouts.",
        ],
      },
      {
        id: "extension-family",
        title: "Profiles and protected time",
        summary: "Different rules for each person, with clear parent authority.",
        points: [
          "Use the default/master profile, independent accounts, or parent-owned child profiles. Parents can edit a chosen child's rules without granting that child access to parent settings.",
          "Parent/account and Master unlocks are separate from a child switching PIN. Temporary admin sessions and Lock Admin Session let you close management access after editing.",
          "Daily viewing allowances are per profile and installation, with remaining-time feedback and parent-reviewed requests for more time. They are not one pooled allowance shared across every family device.",
          "Self-Control Session freezes the current profile and its existing settings for a reviewed countdown. Hard Timer Whitelist instead limits viewing to selected existing Main Allowed channels. Both survive restart, freeze changes, and have no in-app cancellation after activation; they are distinct from ordinary daily time and a mobile player sleep timer.",
          "Profile protection cannot prevent a browser or device owner from disabling or uninstalling an unmanaged extension.",
        ],
      },
      {
        id: "extension-notes",
        title: "Notes for useful moments",
        summary: "Keep a note with the video and profile it belongs to.",
        points: [
          "Notes are scoped to the exact profile and video. The inline editor is for admitted Main Watch pages on supported hosts; this is not a claim of Notes support in Music, Kids, or Shorts.",
          "Add timestamps to return to a moment, keep a temporary draft, save edits, or delete with undo. If another edit arrives, review the conflicting version instead of silently overwriting it.",
          "Notes access still follows profile, parent, and protected-time checks. Personal Notes text is edited within the extension's own interface.",
          "Ordinary extension backups do not include private video Notes. Opt-in personal Notes sync is a separate choice, and notes-bearing native app backups cannot currently be restored through the ordinary extension importer.",
        ],
      },
      {
        id: "extension-p2p",
        title: "Connect your devices",
        summary: "Share selected updates securely with verified devices.",
        points: [
          "Pair with a code or QR and compare the safety phrase before trusting a device. Choose a one-time personal profile copy or approved parent updates; receiving an update is different from applying it.",
          "Opt-in Auto-sync uses approved parent connections or separately approved personal profile links. Personal links can choose supported settings, filter rules, and saved Notes; conflict review remains part of the process.",
          "Direct sync needs both Accounts & Sync pages open and connected. Offline changes wait locally for a supported connection; background checks do not turn the extension into an always-on delivery service.",
          "Nearby discovery needs the optional helper. Home Pickup and Internet Pickup are separately configured delivery choices for approved managed updates, not automatic trust from sharing Wi-Fi or guaranteed delivery whenever any device comes online.",
          "PINs, ownership, and device permissions stay local. Verified transfers are encrypted; connection, relay, and optional encrypted pickup services can still be involved.",
        ],
        link: { label: "How peer-to-peer syncing works", href: "/#device-sync" },
      },
      {
        id: "extension-data",
        title: "Keep and move your setup",
        summary: "Review imports, keep backups, and change preferences deliberately.",
        points: [
          "Preview supported CSV, TXT, JSON, BlockTube JSON, and raw HTTPS rule lists before applying them to Main, Kids, or both where permitted. Manage imported lists, review reports, use templates and suggested URL-list inputs, and approve refreshed URL contents before replacing saved rows.",
          "Export or restore FilterTube JSON and password-encrypted backups, with permitted active-profile or broader scope. Automatic local backups offer Latest/History and plain or encrypted choices. These ordinary backup paths exclude private video Notes.",
          "A compatible BlockTube export contains reviewed supported rules from one profile and rule space. It is not a full FilterTube backup; unsupported fields are reported, imported JavaScript is not run, and an imported password does not become a FilterTube PIN.",
          "Review a preference reset before applying it. It restores ordinary display/playback defaults while preserving rules, modes, content restrictions, Notes, PINs, viewing limits, trusted devices, and profile ownership.",
          "Choose light or dark appearance, interface language, and update-notification preferences. Translation previews are not fully reviewed language parity, and interface language is separate from filtering a video's language.",
        ],
      },
    ],
    milestoneTitle: "Browser availability",
    milestoneIntro:
      "Choose a store or manual build appropriate for your browser.",
    milestones: [
      "Chrome, Firefox, and Edge have store listings; compatible Chromium browsers use the relevant installation path.",
      "Platform changes still require compatibility work; advert filtering is not a promise of permanent immunity to platform changes.",
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
      "The Android app on Google Play, the direct iPhone and iPad install, and what the phone app looks like day to day.",
    titleLead: "A calm FilterTube companion for",
    titleDisplay: "phones and tablets",
    description:
      "The Android phone and tablet app is publicly available on Google Play. Trouble on Apple's side delays the App Store version of the native iPhone and iPad app; until then, install it with SideStore, or AltStore.",
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
    chips: ["Main + Kids", "Profiles and PINs", "Rules stay on your device"],
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
      body: "Watch the working phone and tablet experience, including the calmer custom interface built for Main and Kids.",
      embedHref: "https://www.youtube-nocookie.com/embed/SHvSICSMHL4?rel=0",
      watchHref: appDemoVideoHref,
    },
    featureCards: [
      {
        title: "Android is available on Google Play",
        body: "Install the public phone and tablet app from the Google Play listing, or search Google Play for FilterTube.",
      },
      {
        title: "Five tabs and Search",
        body: "The bottom bar has Home, Clips, Following, Sangeet and You, with Search in the top bar. Following appears once you sign in. Turn the phone on its side and the tabs move to a side rail with Search at the top.",
      },
      {
        title: "FilterTube Controls",
        body: "One place for Filters, Content Controls, Kids Mode, Settings, Study and focus, Profiles & PIN, Backup & restore, Accounts & Sync, What's New, Help, Support and About.",
      },
      {
        title: "A separate space for Kids",
        body: "Kids has its own bar: Home, Explore, Learning, Shows, Music, Offline and Parents. Kids rules stay apart from Main, and changing them asks for the parent PIN.",
      },
    ],
    milestoneTitle: "Where to get it",
    milestoneIntro:
      "FilterTube has native apps for Android and for iPhone and iPad. How you install them differs.",
    milestones: [
      "Android phones and tablets: install from Google Play. No invitation or email is needed.",
      "iPhone and iPad: install directly with SideStore or AltStore while the App Store version is delayed by trouble on Apple's side.",
      "Android TV uses the same Google Play listing. See the Android page for TV details.",
    ],
    related: ["ios", "ipados", "android"],
  },
  ios: {
    slug: "ios",
    icon: DeviceMobile,
    tone: "sky",
    status: "Install directly · App Store later",
    eyebrow: "iPhone + iPad",
    navTitle: "iPhone and iPad",
    routeSummary:
      "Native iPhone and iPad viewing, filters, profiles, and family controls. Trouble on Apple's side delays the App Store version; until then, install with SideStore, or AltStore.",
    titleLead: "A native FilterTube app for",
    titleDisplay: "iPhone and iPad",
    description:
      "FilterTube brings Main and Kids viewing, native controls, profiles, PINs, and protected time to iPhone and iPad. Apple is having trouble on their end with the developer account, so the App Store version will take a while; until then you can install the app directly with SideStore or AltStore.",
    heroScreensLabel: "FilterTube on iPhone · hover or tap a screen",
    heroScreens: [
      {
        src: "/apps/screenshots/ios/iphone-launcher.webp",
        title: "Main and Kids",
        alt: "FilterTube iOS launcher with separate Main and Kids viewing choices",
        width: 1080,
        height: 2348,
      },
      {
        src: "/apps/screenshots/ios/iphone-controls.webp",
        title: "Native controls",
        alt: "FilterTube iOS controls with filters, profiles, settings and device sync",
        width: 1080,
        height: 2348,
      },
      {
        src: "/apps/screenshots/ios/iphone-filters.webp",
        title: "Your filters",
        alt: "FilterTube iOS filter editor with Blocklist and Whitelist choices",
        width: 1080,
        height: 2348,
      },
    ],
    screenshotsTitle: "A closer look at iPhone and iPad",
    screenshotsEyebrow: "iPhone and iPad",
    screenshotsDescription: "Real screens from the latest iPhone and iPad build. Open any screen for a full-size view.",
    screenshotRails: [
      { id: "iphone-screens", label: "iPhone", status: "Install with SideStore", layout: "phone", device: "iPhone", screenshots: iphoneScreens },
      { id: "ipad-screens", label: "iPad", status: "Install with SideStore", layout: "desktop", device: "iPad", screenshots: ipadScreens },
    ],
    chips: ["Main + Kids", "Profiles and PINs", "Install directly"],
    primaryCta: {
      label: "Install on iPhone or iPad",
      href: "#install",
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
        "A short native iPhone preview of the current build.",
    },
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
        body: "The iPad layout gives browsing, rule editing, and family setup more space while keeping the same profile boundaries. The same direct install works on both devices.",
      },
    ],
    milestoneTitle: "iOS availability",
    milestoneIntro:
      "You can install the app directly today. The App Store version will take a while because of trouble on Apple's end.",
    milestones: [
      "Install directly on iPhone and iPad with SideStore or AltStore. The App Store version will take a while because of trouble on Apple's end.",
      "Pair verified devices, send parent updates, and turn on Auto-sync to keep your own profile in step across your devices.",
      "This page will link the App Store listing as soon as it is live.",
    ],
    related: ["mobile", "ipados", "android"],
  },
  ipados: {
    slug: "ipados",
    icon: MonitorPlay,
    tone: "sky",
    status: "Install directly · App Store later",
    eyebrow: "iPad app",
    navTitle: "iPadOS",
    routeSummary:
      "The FilterTube app on iPad: Main and Kids viewing, filters and family setup with more room.",
    titleLead: "Your viewing, your rules, on",
    titleDisplay: "iPad",
    description:
      "The native iPad app ships alongside iPhone. Trouble on Apple's side delays the App Store version; until then, install it with SideStore, or AltStore.",
    heroArtwork: {
      src: "/apps/app-store-transparent.png",
      alt: "FilterTube iPad app artwork",
    },
    screenshotsTitle: "A closer look at iPhone and iPad",
    screenshotsEyebrow: "iPhone and iPad",
    screenshotsDescription: "Real screens from the latest iPhone and iPad build. Open any screen for a full-size view.",
    screenshotRails: [
      { id: "ipados-iphone-screens", label: "iPhone", status: "Install with SideStore", layout: "phone", device: "iPhone", screenshots: iphoneScreens },
      { id: "ipados-ipad-screens", label: "iPad", status: "Install with SideStore", layout: "desktop", device: "iPad", screenshots: ipadScreens },
    ],
    chips: ["Main + Kids", "Profiles and PINs", "Same install as iPhone"],
    primaryCta: {
      label: "Install on iPad",
      href: "/ios#install",
      external: false,
    },
    secondaryCta: {
      label: "See the mobile overview",
      href: "/mobile",
      external: false,
    },
    featureCards: [
      {
        title: "The same app, with more room",
        body: "iPad runs the same FilterTube app as iPhone: Main and Kids viewing, filters, profiles, PINs and protected time. The wider screen gives lists and settings more space.",
      },
      {
        title: "Set up the family from one place",
        body: "Create profiles, set PINs and edit each child's rules on the bigger screen. A child's switching PIN opens their profile; it does not unlock parent settings.",
      },
      {
        title: "Keep your devices in step",
        body: "Pair the iPad with your other devices in Accounts & Sync, compare the safety phrase, then send parent updates or turn on Auto-sync for your own profile.",
      },
    ],
    milestoneTitle: "Getting it on iPad",
    milestoneIntro:
      "One install covers iPhone and iPad.",
    milestones: [
      "Install directly with SideStore or AltStore. The App Store version will take a while because of trouble on Apple's end.",
      "FilterTube needs iPadOS 17 or later.",
      "This page will link the App Store listing as soon as it is live.",
    ],
    related: ["mobile", "ios", "android"],
  },
  android: {
    slug: "android",
    icon: DeviceMobile,
    tone: "forest",
    status: "Phone, tablet + TV",
    eyebrow: "Android phone, tablet + TV",
    navTitle: "Android",
    routeSummary:
      "Phone, tablet and Android TV share one app and one Google Play listing. Fire TV support is planned.",
    titleLead: "Your viewing, your rules on",
    titleDisplay: "Android",
    description:
      "Watch Main and Kids in FilterTube's custom Android app, with filters, profiles, parent controls, protected time and private peer-to-peer device sync. Phones, tablets and Android TV install from the same Google Play listing, and a TV APK is on every GitHub release.",
    heroVideo: {
      src: "/videos/android/android-contours.mp4",
      poster: "/videos/android/android-contours-poster.png",
      label: "Quiet Android background motion",
    },
    heroScreensLabel: "FilterTube on Android · hover or tap a screen",
    heroScreens: [
      androidPhoneScreens.find((screen) => screen.src.endsWith("phone-watch.webp")),
      androidPhoneScreens.find((screen) => screen.src.endsWith("phone-sangeet.webp")),
      androidPhoneScreens.find((screen) => screen.src.endsWith("phone-sync-pairing.webp")),
    ],
    chips: [
      "Phone + tablet: available",
      "Android TV: available",
      "Private P2P sync",
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
      body: "A look at FilterTube on phone and tablet. Features coming in the next update are labelled below.",
      embedHref: "https://www.youtube-nocookie.com/embed/SHvSICSMHL4?rel=0",
      watchHref: appDemoVideoHref,
    },
    deviceSyncHref: "#android-p2p",
    screenshotsTitle: "A closer look at the Android app",
    screenshotsEyebrow: "Every screen · phone, tablet and TV",
    screenshotsDescription: "Real screens from the latest FilterTube build on a phone, a tablet and Android TV. Open any screen for a full-size view.",
    screenshotRails: [
      { id: "android-phone-screens", label: "Phone", status: "Google Play", layout: "phone", screenshots: androidPhoneScreens },
      { id: "android-tablet-screens", label: "Tablet", status: "Google Play", layout: "desktop", screenshots: androidTabletScreens },
      { id: "android-tv-screens", label: "Android TV", status: "Google Play + TV APK", layout: "desktop", screenshots: androidTvScreens },
    ],
    screenshots: [
      {
        src: "/apps/screenshots/android-player-settings.png",
        alt: "Playback settings in the Android app",
        title: "Player settings",
        caption: "Quality, captions, chapters, and viewing controls.",
      },
      {
        src: "/apps/screenshots/android-music-player.png",
        alt: "The Sangeet player in the Android app",
        title: "Sangeet player",
        caption: "A dedicated listening view with queue, lyrics, and playback controls.",
      },
      {
        src: "/apps/screenshots/android-notes-editor.png",
        alt: "Empty video Notes editor in the Android app",
        title: "Notes editor",
        caption: "An empty per-video editor with timestamp tools.",
      },
    ],
    featureCards: [
      {
        id: "android-tv",
        title: "Android TV",
        body: "Home, Search, Following, You and Watch built for the remote, with profiles, PINs, Kids controls, filters, Accounts & Sync and FilterTube Controls on the big screen. Install from the same Google Play listing or the TV APK on GitHub. Study on the big screen comes in the next update, and Fire TV compatibility is planned separately.",
      },
    ],
    exploreTitle: "Explore the full app",
    exploreDescription: "The custom frontend goes beyond a filter list. Open a group to see the viewing spaces and controls.",
    exploreGroups: [
      {
        id: "android-browse",
        title: "Browse your way",
        summary: "Home, Search, channels, and your own viewing spaces.",
        points: [
          "The bottom bar has Home, Clips, Following, Sangeet and You, with Search in the top bar. Following appears once you sign in. In landscape the tabs move to a side rail: Search, Home, Clips, Following, Sangeet, You.",
          "Saved, Playlists and History have their own pages. Watch keeps the video and its related controls together. Clips can still be filtered when you prefer not to see them.",
          "FilterTube Controls gathers Filters, Content Controls, Kids Mode, Settings, Study and focus, Profiles & PIN, Backup & restore, Accounts & Sync, What's New, Help, Support and About.",
          "Kids has its own bar: Home, Explore, Learning, Shows, Music, Offline and Parents. Main and Kids do not need to share the same filtering boundaries.",
        ],
      },
      {
        id: "android-playback",
        title: "Make playback comfortable",
        summary: "Choose how the video plays, sounds, and appears.",
        points: [
          "The native Watch player includes quality, buffering, loop, autoplay, sleep timer, silence handling, volume, and playback-speed controls.",
          "Use fullscreen or floating playback, navigate chapters, and adjust captions and appearance. Transcript controls help you follow along with the video where text is available.",
          "Playback queues and local history/resume keep the viewing flow connected. Available controls depend on the video and installed release.",
          "Optional community tools, all off until you turn them on: sponsor-segment skipping (SponsorBlock), community titles and thumbnails (DeArrow), dislike estimates (RYD) and synced lyrics (LRCLIB). Each contacts its own service only when enabled.",
        ],
      },
      {
        id: "android-music",
        title: "Sangeet, a space for music",
        summary: "Listen with the same filters, in a player built for songs.",
        points: [
          "Sangeet Home shows the shelves the music service offers you, and Explore leads to moods, genres and charts. Artist, Album and Library pages open from there.",
          "Now Playing spins the cover like a record on a turntable, takes its colours from the art, and brings the queue, synced lyrics and the video together. Lyrics can also come from LRCLIB, an optional extra you are asked about once.",
          "Start a station from a song or an artist, reorder the queue, and search or sort the songs on an album page. Your filters apply to music too.",
        ],
      },
      {
        id: "android-filters",
        title: "Choose what appears",
        summary: "Start with channels or words, then add more precise filters.",
        points: [
          "Blocklist hides matching content; Whitelist limits viewing to approved rules. Channel and keyword rules, Exact matching, and supported category and content controls help shape the result.",
          "Supported duration and upload-date controls narrow video lists. Language and original-audio controls are experimental and rely on the metadata a video provides.",
          "Hide Shorts, comments, and supported distractions without removing every useful part of the app. Rule availability differs by Main/Kids context and installed release.",
        ],
      },
      {
        id: "android-family",
        title: "Profiles and family control",
        summary: "Give each person their own rules and viewing limits.",
        points: [
          "Separate profiles, PIN gates, and parent-managed protected time keep child access distinct from parent editing authority. A child switching PIN does not unlock parent settings.",
          "Review rule-list imports and keep backups when moving an existing setup. Profile scope stays separate from the Main/Kids rule space.",
          "Daily viewing limits, a player sleep timer and timed Self-Control or Hard Timer Whitelist sessions serve different needs. Reviewed focus sessions hold the selected rules and cannot be cancelled inside the app once started.",
          "Profiles, PINs, Kids controls and filters work on Android TV too. Ask a parent and Study on TV come in the next update.",
        ],
      },
      {
        id: "android-ask-parent",
        title: "Ask a parent",
        summary: "Coming in the next update: a child can ask instead of hitting a wall.",
        points: [
          "When a video or channel is blocked, a child can ask to watch that video or allow that channel. The parent sees the request and answers it.",
          "Parent mode opens a parent session inside a Kids profile, with one clear way back out. A child's switching PIN never opens it.",
        ],
      },
      {
        id: "android-study",
        title: "Study and focus",
        summary: "Coming in the next update: a rebuilt Study planner around Your study day.",
        points: [
          "Your study day plans rounds and breaks, and while a round runs only the channels in your plan show up. Search during study looks only in those channels.",
          "Setup starts with your country, then offers ready-made packs for exams and school classes in 29 countries, or lets you add your own channels.",
          "Study and focus sits in FilterTube Controls. Kids learning by age fills the Kids space with age-picked lessons during study.",
        ],
      },
      {
        id: "android-mascots",
        title: "Kriti and Uljhan",
        summary: "Coming in the next update: two characters who keep you company.",
        points: [
          "Kriti looks after your feed. Uljhan is the clutter you'd rather not see: not something to hate, just not what you want right now. They appear while pages load, when a list is empty, when you're offline and when something is blocked.",
          "Pick an app icon with Kriti, Uljhan or both, or keep the classic funnel.",
          "Companion sets how much they appear: Lively, Quiet or Off.",
          "The What Uljhan tried today card is in the browser extension only; the apps do not have it.",
        ],
      },
      {
        id: "notes-auto-sync",
        title: "Notes and your media",
        summary: "Keep useful video moments and local files close.",
        points: [
          "Per-video Notes come with timestamps, an editor and a searchable Notes index. Notes belong to the chosen profile and still follow its permissions.",
          "Offline Media organizes local files into Recent, Folders, Videos, Audio and Favourites, with resume and queue controls. Saving online videos for offline viewing is available only in the direct GitHub build, with encrypted copies that expire after 30 days; the Google Play build does not download videos.",
        ],
      },
      {
        id: "android-p2p",
        title: "Your devices, connected",
        summary: "Choose what to share between your verified devices.",
        points: [
          "Pair with a code or QR, compare the safety phrase, and choose the profile and update. Being on the same network does not automatically make a device trusted.",
          "Parents can send approved updates to protected profiles. Personal Auto-sync uses approved profile links and lets you choose supported settings, filter rules, and Notes.",
          "Offline changes wait locally for a supported connection. Direct sync needs the devices open and connected; optional pickup has separate delivery settings.",
        ],
        link: { label: "How peer-to-peer syncing works", href: "/#device-sync" },
      },
    ],
    milestoneTitle: "What is available, and what comes next",
    milestoneIntro:
      "Phones, tablets and TVs share one app. Here is what is available now and what comes next.",
    milestones: [
      "Phone and tablet: public on Google Play. Install directly—no invitation or email needed.",
      "Sangeet, Notes, Auto-sync and Offline Media are in the current app.",
      "Android TV: on the same Google Play listing, with a TV APK on every GitHub release.",
      "Coming in the next update: Kriti and Uljhan, the rebuilt Study planner, Ask a parent, and the Sangeet, Clips, Following and Saved names in every language.",
      "Offline video saving: direct GitHub build only, encrypted and expiring after 30 days. Google Play builds do not download videos.",
      "Fire TV compatibility is planned.",
      "The separate direct APK has a simpler frontend than the Google Play app.",
    ],
    related: ["extension", "ios", "kids"],
  },
  tv: {
    slug: "tv",
    icon: Television,
    tone: "sunset",
    status: "Android TV available",
    eyebrow: "TV overview",
    navTitle: "TV overview",
    routeSummary:
      "FilterTube runs on Android TV; Fire TV compatibility is planned.",
    titleLead: "Your rules on the",
    titleDisplay: "living-room TV",
    description:
      "FilterTube brings browsing, search, remote navigation, playback, profiles, PINs, Kids controls and filters to Android TV. Install it from Google Play or the TV APK on GitHub. Fire TV support is planned separately.",
    chips: ["Android TV: available", "Main + Kids", "Fire TV: planned"],
    primaryCta: {
      label: "Install from Google Play",
      href: androidPlayStoreHref,
      external: true,
    },
    secondaryCta: {
      label: "See Android TV",
      href: "/android-tv",
      external: false,
    },
    featureCards: [
      {
        title: "Main and Kids on the big screen",
        body: "Browse, search and watch Main and Kids, with profiles, PINs, Kids controls and your filters. Ask a parent and Study on TV come in the next update.",
      },
      {
        title: "Made for the remote",
        body: "Every screen works with the arrow keys and select button, so browsing and playback are easy from the sofa.",
      },
      {
        title: "In step with your phone",
        body: "Accounts & Sync pairs the TV with your other devices, so rules you set on a phone can reach the TV.",
      },
    ],
    milestoneTitle: "Which TVs are supported",
    milestoneIntro:
      "Android TV and Google TV are supported now. Fire TV comes later.",
    milestones: [
      "Android TV and Google TV: install from the same Google Play listing as the phone app, or use the TV APK on every GitHub release.",
      "Amazon Fire TV: compatibility is planned. There is no Fire TV install yet.",
    ],
    related: ["android-tv", "fire-tv"],
  },
  "android-tv": {
    slug: "android-tv",
    icon: Television,
    tone: "sky",
    status: "Google Play + TV APK",
    eyebrow: "Android TV app",
    navTitle: "Android TV",
    routeSummary:
      "Remote-first Home, Search, Following, You and Watch with profiles, PINs, Kids controls and filters.",
    titleLead: "Your rules, from the sofa, on",
    titleDisplay: "Android TV",
    description:
      "FilterTube brings the custom app to Android TV and Google TV: browse, search and watch with the remote, with profiles, PINs, Kids controls and your filters on the big screen. Install it from Google Play or the TV APK on GitHub.",
    screenshotsTitle: "Every TV screen",
    screenshotsEyebrow: "Android TV · 1920×1080",
    screenshotsDescription: "Real screens from the latest FilterTube build on Android TV. Open any screen for a full-size view.",
    screenshotRails: [
      { id: "tv-screens", label: "Android TV", status: "Google Play + TV APK", layout: "desktop", screenshots: androidTvScreens },
    ],
    chips: ["Google Play", "TV APK on GitHub", "Main + Kids"],
    primaryCta: {
      label: "Get the TV APK",
      href: `${githubHref}/releases/latest`,
      external: true,
    },
    secondaryCta: {
      label: "See the TV overview",
      href: "/tv",
      external: false,
    },
    featureCards: [
      {
        title: "Browse with the remote",
        body: "Home, Search, Following, You and Watch are built for the arrow keys and select button, with a clear focus ring on whatever you are about to open.",
      },
      {
        title: "The same rules as your phone",
        body: "Profiles, PINs, Kids controls and filters work on TV, and Accounts & Sync keeps it in step with your other devices.",
      },
      {
        title: "FilterTube Controls on TV",
        body: "Change filters, profiles and settings from the TV itself, or make bigger changes on a phone and send them across.",
      },
    ],
    milestoneTitle: "What is available, and what comes next",
    milestoneIntro:
      "Android TV runs the same FilterTube app as phones and tablets.",
    milestones: [
      "Install from Google Play on Android TV and Google TV, or use the TV APK on every GitHub release.",
      "Coming in the next update: Study on the big screen and Ask a parent on TV.",
      "Amazon Fire TV compatibility is planned separately.",
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
      "Fire TV support is planned. Android TV and Google TV are supported now.",
    titleLead: "FilterTube is coming to",
    titleDisplay: "Amazon Fire TV",
    description:
      "Fire TV compatibility and public installation are planned. Android TV is available now, with profiles, PINs, Kids controls and filters.",
    chips: ["Planned", "Android TV available now"],
    primaryCta: {
      label: "See Android TV",
      href: "/android-tv",
      external: false,
    },
    secondaryCta: {
      label: "See the TV overview",
      href: "/tv",
      external: false,
    },
    featureCards: [
      {
        title: "Not available yet",
        body: "There is no Fire TV install today. Fire TV needs its own compatibility and store work, separate from the Google Play listing.",
      },
      {
        title: "On a TV today? Try Android TV",
        body: "If your TV runs Android TV or Google TV, FilterTube is available now from Google Play or as a TV APK on GitHub.",
      },
    ],
    milestoneTitle: "Where Fire TV stands",
    milestoneIntro:
      "This page will say when a Fire TV install is ready.",
    milestones: [
      "Fire TV compatibility and a public install are planned.",
      "Android TV and Google TV are supported now, with profiles, PINs, Kids controls and filters.",
    ],
    related: ["tv", "android-tv"],
  },
  kids: {
    slug: "kids",
    icon: ShieldCheck,
    tone: "rose",
    status: "Android, iOS, TV + extension",
    eyebrow: "Rules for Kids",
    navTitle: "Kids",
    routeSummary:
      "Block unwanted channels and words, or allow only channels you choose. Keep Kids rules separate and parent-managed.",
    titleLead: "More say in what your",
    titleDisplay: "children watch",
    description:
      "Block channels and words you do not want in Kids—or choose Whitelist to allow only the channels you approve. Give each child their own rules and viewing limits, with changes managed by their parent.",
    heroScreensLayout: "tv-phone",
    heroScreensLabel: "Kids Viewing on Android TV and iPhone · hover or tap a screen",
    heroScreens: [
      { ...kidsScreens.tv.find((screen) => screen.src.endsWith("tv-kids-watch.webp")), title: "Kids on TV" },
      { ...devices.iphone.captures.kids, title: "Kids on iPhone" },
    ],
    chips: ["Channel + keyword filters", "Whitelist viewing", "Parent-managed profiles"],
    primaryCta: { label: "Get the Android app", href: androidPlayStoreHref, external: true },
    secondaryCta: { label: "Get the browser extension", href: downloadsHref, external: false },
    featureCards: [
      {
        title: "Keep unwanted content out",
        body: "Block a channel or add words that match unwanted video titles and supported metadata. Use Exact matching when a short keyword is catching too much. Filtering depends on the information available on each supported page.",
      },
      {
        title: "Or start with approved channels",
        body: "Whitelist is the stricter choice: select which channels may appear instead of building a long list of things to block. Review the resulting videos; approving a creator is not a promise that every future upload suits your child.",
      },
      {
        title: "Different children, different rules",
        body: "Each profile has its own setup. A profile's Main and Kids spaces can have different channels, keywords and viewing modes. Kids is a viewing space; it is not the same thing as a protected child profile.",
      },
      {
        title: "Parent controls stay with the parent",
        body: "Parents manage protected settings and viewing limits. A child's switching PIN opens their profile; it does not unlock parent controls. Close the parent session after editing. An unmanaged extension cannot stop a device owner from disabling or uninstalling it.",
      },
      {
        title: "A Kids space of its own",
        body: "In the apps, Kids has its own bar: Home, Explore, Learning, Shows, Music, Offline and Parents. Changing rules from Kids always asks the parent PIN.",
      },
      {
        title: "Ask a parent",
        status: "Next update",
        body: "When a video or channel is blocked, a child can ask to watch that video or allow that channel, and the parent answers. Coming to the apps in the next update.",
      },
      {
        title: "Make room for a stopping point",
        body: "Set supported daily viewing allowances and review requests for more time. Time is counted per device and profile, not as a single shared allowance across the family. Sleep timers and focus sessions are separate controls.",
      },
      {
        title: "Share approved changes with their device",
        body: "Pair with a code or QR, compare the safety phrase, then send an approved update to the chosen child profile. Direct peer-to-peer sync needs supported devices open and connected. Opt-in Auto-sync and optional delivery services have separate setup and release availability.",
      },
    ],
    screenshotsTitle: "Kids Viewing on every screen",
    screenshotsEyebrow: "Kids · phone, tablet and TV",
    screenshotsDescription: "Real Kids Viewing screens on iPhone, iPad, Android and Android TV. Changing rules from Kids always asks the parent PIN.",
    screenshotRails: [
      { id: "kids-phone-screens", label: "Phone", status: "iPhone + Android", layout: "phone", screenshots: kidsPhoneScreens },
      { id: "kids-tablet-screens", label: "Tablet", status: "iPad + Android", layout: "desktop", screenshots: kidsTabletScreens },
      { id: "kids-tv-screens", label: "Android TV", status: "Google Play + TV APK", layout: "desktop", screenshots: kidsTvScreens },
    ],
    milestoneTitle: "Choose where your child watches",
    milestoneIntro: "Kids works on every FilterTube platform. How you install it differs.",
    milestones: [
      "Android phones and tablets: the custom Main and Kids app is on Google Play. No invitation or email is needed.",
      "Browser extension: adds filtering to supported Kids pages. Use the full settings page to manage profiles and Kids rules.",
      "iPhone and iPad: Kids viewing and family controls are included. Trouble on Apple's side delays the App Store version; until then, install with SideStore, or AltStore.",
      "Android TV: Kids viewing, profiles, PINs and Kids controls, on the same Google Play listing. Ask a parent on TV comes in the next update. Fire TV compatibility is planned.",
      "Rules stay local. Optional verified device sharing is encrypted; helpers or relay services may be involved. Filters support parent decisions, rather than replacing review of what a child watches.",
    ],
    related: ["android", "ios", "extension"],
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
      "Current release: keyword, channel, Shorts, comments, Whitelist, and profile controls already work in FilterTube today on desktop browsers.",
      "Research track: local semantic matching and suggestion support could extend those rules without sending user behavior to the cloud.",
      "Later-stage exploration: thumbnail analysis only belongs in the roadmap until a local, explainable implementation is real.",
    ],
    related: ["kids", "mobile"],
  },
};
