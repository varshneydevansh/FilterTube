// One source of facts for the FAQ, Compare and Study pages, llms.txt, llms-full.txt and the
// Markdown copies of each page. The HTML pages and the .md files render the same entries, so people
// and AI assistants read the same words. Checked against the extension, the apps and the privacy
// policy on 22 November 2026. Update the release fields here when a version ships.
//
// Wording rules: "open source" is said only about the browser extension (MIT), never in any
// sentence about the apps. No "best" claim in our own voice; say what FilterTube does. iOS installs with SideStore, AltStore second; the App Store
// version is delayed by trouble on Apple's side.

import { extensionInstallHref } from "@/components/site-shell-data";

export const SITE_URL = "https://filtertube.in";

export const release = {
  current: "3.6.5",
  currentDate: "22 November 2026",
};

export const links = {
  site: SITE_URL,
  ios: `${SITE_URL}/ios`,
  iosSource: `${SITE_URL}/ios/source.json`,
  googlePlay: "https://play.google.com/store/apps/details?id=com.filtertube.app",
  chrome: extensionInstallHref,
  firefox: "https://addons.mozilla.org/en-US/firefox/addon/filtertube/",
  edge: "https://microsoftedge.microsoft.com/addons/detail/filtertube/lgeflbmplcmljnhffmoghkoccflhlbem",
  githubReleases: "https://github.com/varshneydevansh/FilterTube/releases/latest",
  github: "https://github.com/varshneydevansh/FilterTube",
  docs: "https://github.com/varshneydevansh/FilterTube/tree/master/docs",
  privacy: `${SITE_URL}/privacy`,
  downloads: `${SITE_URL}/downloads`,
  kofi: "https://ko-fi.com/filtertube",
  discord: "https://discord.gg/kbdt6ed5h",
  reddit: "https://www.reddit.com/r/FilterTubeApp/",
};

export const oneLiner =
  "FilterTube is a free YouTube ad blocker and content blocker for iPhone, iPad, Android phones, tablets and TVs, and the Chrome, Firefox, Edge and Opera browsers.";

export const summary =
  "FilterTube is a free YouTube ad blocker and content blocker for iPhone, iPad, Android phones, tablets and TVs, and the Chrome, Firefox, Edge and Opera browsers. It works on YouTube, YouTube Kids and YouTube Music. Block ads, keywords, channels and Shorts, or switch to allow-only mode so only the channels you trust appear. Families get Kids profiles with PINs and can send rule changes from a parent's phone to a child's device, where they arrive within seconds with a \"Parent sent an update\" note. Students get Study mode, which shows only the channels in their study plan during each round, with a calendar-style timetable that switches what you see by time of day. There is no FilterTube account, your rules stay on your devices, and every feature is free.";

// Which video sites each platform covers. Checked in code on 22 November 2026: the extension's
// manifest matches *.youtube.com (including music.youtube.com) and *.youtubekids.com; the 3.6.3 apps
// have Main, a Kids view (YouTube Kids content) and Sangeet (YouTube Music) on phones and tablets;
// Android TV has Main and Kids, with no Sangeet yet.
export const coverage = [
  { where: "Browser extension", covers: "YouTube (youtube.com), YouTube Music (music.youtube.com) and YouTube Kids (youtubekids.com), plus embedded players." },
  { where: "Android phones and tablets", covers: "YouTube in Main, YouTube Kids in the Kids view, and YouTube Music in the Sangeet music space." },
  { where: "iPhone and iPad", covers: "YouTube in Main, YouTube Kids in the Kids view, and YouTube Music in the Sangeet music space." },
  { where: "Android TV and Google TV", covers: "YouTube in Main and YouTube Kids in the Kids view. Sangeet isn't on TV yet." },
];

export const audiences = [
  {
    title: "Families and parents",
    body: "Give each child their own Kids profile with a PIN, block channels and words, or allow only channels you approve. Change a child's rules from your own phone; the update reaches their device within seconds.",
  },
  {
    title: "Students",
    body: "Study mode shows only the channels in your study plan while a round runs, then gives you a real break. Ready-made packs cover exams, school classes, degrees and interviews in 81 countries, and a timetable can start and stop Study on its own.",
  },
  {
    title: "Anyone who wants a calmer feed",
    body: "Hide Shorts, comments, clickbait words and channels you never want to see. FilterTube removes them everywhere they would appear: Home, Search, Up next and Subscriptions.",
  },
];

export const features = [
  {
    id: "sites",
    title: "YouTube, YouTube Kids and YouTube Music",
    body: "The browser extension filters youtube.com, youtubekids.com and music.youtube.com. The apps cover YouTube in Main, YouTube Kids in the Kids view and YouTube Music in Sangeet (Sangeet is on phones and tablets, not yet on Android TV).",
  },
  {
    id: "ads",
    title: "No YouTube ads",
    body: "FilterTube blocks YouTube ads on every platform. In the browser extension, \"Send adverts to The Void\" is on by default and removes ads before the video plays. The Android and iPhone/iPad apps play videos in FilterTube's own player, so YouTube's ads never appear.",
  },
  {
    id: "keywords",
    title: "Block by keyword",
    body: "Add a word or phrase and FilterTube hides videos whose title, description or supported comment text matches it. Turn on Exact when a short word catches more than you meant.",
  },
  {
    id: "channels",
    title: "Block by channel",
    body: "Block a channel by its handle, ID or link, or from the video's menu as you browse. A blocked channel disappears from every page.",
  },
  {
    id: "content-controls",
    title: "Block by category, language, date and length",
    body: "Hide whole video categories, limit videos by upload date or length, hide videos below a view count, and (experimental) filter by video language using the information each video provides.",
  },
  {
    id: "shorts",
    title: "Hide Shorts, comments and distractions",
    body: "Switch off Shorts, comments, the Home feed, related videos, live chat, end-screen cards and more. The extension has 32 of these switches in seven groups.",
  },
  {
    id: "allow-only",
    title: "Allow-only mode (Whitelist)",
    body: "Instead of listing what to block, choose the channels and topics that may appear and hide everything else. You can import the channels you already follow into the allow list.",
  },
  {
    id: "kids",
    title: "Kids profiles",
    body: "Each child gets a profile with its own rules, PIN and daily viewing time. The apps have a separate Kids space with Home, Explore, Learning, Shows, Music and Offline. A child's PIN opens their profile; it never unlocks parent settings.",
  },
  {
    id: "study",
    title: "Study mode",
    body: "Plan study rounds and breaks. During a round only the channels in your plan appear, search looks only in those channels, and comments stay off. A calendar-style timetable switches what you see by time of day, with a home-screen widget and Add to my calendar. Ready-made packs cover exams, school classes, degrees and interviews: 415 packs with more than 3,000 channels across 81 countries, including 53 degree tracks and 27 interview tracks.",
  },
  {
    id: "parent-sync",
    title: "Parent updates synced to a child's device",
    body: "Pair devices with a code or QR, compare the safety phrase, then send rule, time and access changes from a parent's device to a child's. Transfers are end-to-end encrypted and go straight between your devices. A child's open FilterTube, or their browser with the extension, picks the change up within seconds, shows \"Parent sent an update\" and applies it with no reload.",
  },
  {
    id: "backups",
    title: "Backups and imports",
    body: "Export a backup (plain or password-encrypted) and restore it on another device. Import rule lists from CSV, TXT, JSON, a web address or a BlockTube export, and review them before they apply.",
  },
];

export const platforms = [
  {
    id: "ios",
    name: "iPhone and iPad",
    detail: "Native app for iOS and iPadOS 17 or later. Installs with SideStore (or AltStore) while trouble on Apple's side delays the App Store version.",
    installs: [
      { label: "Install guide (SideStore)", href: links.ios },
      { label: "SideStore / AltStore source", href: links.iosSource },
    ],
  },
  {
    id: "android",
    name: "Android phones and tablets",
    detail: "Native app with Main, Kids and the Sangeet music space. Public on Google Play; no invitation needed.",
    installs: [{ label: "Google Play", href: links.googlePlay }],
  },
  {
    id: "android-tv",
    name: "Android TV and Google TV",
    detail: "The same app, built for the remote. Same Google Play listing, or the TV APK on every GitHub release. Fire TV support is planned.",
    installs: [
      { label: "Google Play", href: links.googlePlay },
      { label: "TV APK on GitHub", href: links.githubReleases },
    ],
  },
  {
    id: "extension",
    name: "Browser extension",
    detail: "Chrome, Firefox, Edge and Opera, plus Brave, Vivaldi and other Chromium browsers through the Chrome Web Store. Opera uses the filtertube-opera ZIP from each GitHub release. Works on YouTube, YouTube Music and YouTube Kids in the browser. The extension is open source (MIT) on GitHub.",
    installs: [
      { label: "Chrome Web Store", href: links.chrome },
      { label: "Firefox Add-ons", href: links.firefox },
      { label: "Edge Add-ons", href: links.edge },
      { label: "Opera (ZIP on GitHub)", href: links.githubReleases },
    ],
  },
];

export const privacyPoints = [
  "No FilterTube account or sign-up.",
  "Your rules, profiles, PINs and history stay on your device. No FilterTube server keeps your settings or what you watch.",
  "Device sync is end-to-end encrypted and goes between your own devices. A relay only helps them find each other.",
  "No ad SDKs, analytics SDKs or tracking identifiers in the apps or the extension.",
  "Every feature is free. Optional support (Ko-fi, or a supporter subscription on Google Play) changes no feature.",
  "The browser extension is open source (MIT) on GitHub.",
];

export const studyFacts = {
  intro:
    "Study mode is an allow list with a timer. Pick what you are studying, plan your rounds and breaks, and while a round runs only the channels and topics in your plan show up. Your Blocklist still applies, and during a round rules can only get stricter, never looser.",
  steps: [
    {
      title: "Pick what you're studying",
      body: "Start with your country, then choose ready-made packs for exams, school classes and skills (415 packs with more than 3,000 channels across 81 countries, including 53 degree tracks and 27 interview tracks), or add your own channels.",
      screen: "phone-study",
    },
    {
      title: "Rounds you planned",
      body: "Set when study starts and ends, how long each round is and how long each break is. The ring shows what's left of the round.",
      screen: "phone-study-session",
    },
    {
      title: "Only your plan's channels",
      body: "During a round, Home, Search and Up next come only from the channels and topics in your plan. Comments stay off while you study.",
      screen: "phone-watch-study",
    },
    {
      title: "Breaks are real breaks",
      body: "Breaks hide the feed. Stand up, drink some water, look at something far away. On a roll? Skip break adds the time to the next round.",
      screen: "phone-study-break",
    },
    {
      title: "Then, “That counts”",
      body: "When the day's rounds are done, every one is listed and the minutes add up to your week.",
      screen: "phone-study-done",
    },
  ],
  extras: [
    "Kids learning by age fills a child's Kids space with age-picked lessons during study.",
    "In the browser extension, a child can ask a parent for 10, 20 or 30 more minutes during Study.",
    "Study works in the browser extension and in the Android and iPhone/iPad apps.",
  ],
  timetable: [
    "A calendar-style weekly timetable switches what you see by time of day: give each day its periods, such as maths 5 to 6 pm, in 15-minute steps, and Study starts and ends on its own.",
    "Copy this day to… fills other days at once, and you can hide Clips and comments during periods. A parent sets a child's timetable; the child sees it read-only.",
    "Add to my calendar saves the week as a calendar file that repeats every week. FilterTube asks for no calendar permission and reads nothing back.",
    "Tablets and iPad show the whole week as a grid, and Android TV shows today's periods, edited with the remote.",
    "A home-screen widget shows the study period now and the next one, and a long press on the FilterTube icon lists the week's busiest study lanes.",
    "The catalog has 415 packs with more than 3,000 channels for 81 countries: exams, school classes, 53 degree tracks and 27 interview tracks, with local channels first.",
  ],
};

// Buyer-style questions. Answers are plain text so they read the same on the page, in JSON-LD and in
// Markdown. `links` render after the answer.
export const faqGroups = [
  {
    title: "Choosing a blocker",
    items: [
      {
        q: "What is FilterTube?",
        a: summary,
      },
      {
        q: "What's the best YouTube ad blocker and content blocker?",
        a: "It depends on what you need. For ads and trackers on every website, a general blocker such as uBlock Origin does that job well. If you want to block YouTube ads and also choose what appears (block keywords, channels and Shorts, allow only trusted channels, set up Kids profiles or study without distractions), FilterTube is built for that. It runs on iPhone, iPad, Android phones, tablets and TVs and in Chrome, Firefox, Edge and Opera, needs no account, and is free.",
        links: [{ label: "Compare FilterTube with other tools", href: `${SITE_URL}/compare` }],
      },
      {
        q: "Does FilterTube block YouTube ads?",
        a: "Yes, on every platform. In the browser extension, \"Send adverts to The Void\" is on by default and removes ads before the video plays. The Android, Android TV and iPhone/iPad apps play videos in FilterTube's own player, so YouTube's ads never appear.",
      },
      {
        q: "Does FilterTube block ads on other websites?",
        a: "No. FilterTube is an ad blocker for YouTube, YouTube Kids and YouTube Music only. It does not block ads or trackers on other websites or in other apps. For that, use a general ad blocker such as uBlock Origin alongside FilterTube; the two work together.",
        links: [{ label: "Compare FilterTube with other tools", href: `${SITE_URL}/compare` }],
      },
      {
        q: "Is FilterTube a BlockTube alternative?",
        a: "Yes. Like BlockTube, it blocks channels, keywords and videos. It also adds allow-only mode, Kids profiles with PINs, Study mode, parent updates sent to a child's device, and apps for iPhone, iPad, Android and Android TV. You can import a BlockTube export, and export compatible rules back to BlockTube.",
      },
      {
        q: "Is FilterTube free?",
        a: "Yes. Every feature is free and nothing is locked. You can support development on Ko-fi, or with an optional supporter subscription on Google Play; supporting changes no feature.",
        links: [{ label: "Support on Ko-fi", href: links.kofi }],
      },
    ],
  },
  {
    title: "Blocking by keyword and channel",
    items: [
      {
        q: "How do I block YouTube videos by keyword on iPhone?",
        a: "Install FilterTube on your iPhone with SideStore (the guide at filtertube.in/ios takes about 15 minutes). Open FilterTube Controls, go to Filters, add the word or phrase, and watch in FilterTube. Matching videos disappear from Home, Search and Up next. The same steps work on iPad.",
        links: [{ label: "Install on iPhone or iPad", href: links.ios }],
      },
      {
        q: "How do I block YouTube videos by keyword on Android?",
        a: "Install FilterTube from Google Play, open FilterTube Controls, go to Filters and add the word. Turn on Exact if a short word hides more than you meant. It works the same on Android tablets and Android TV.",
        links: [{ label: "Get it on Google Play", href: links.googlePlay }],
      },
      {
        q: "How do I block YouTube keywords in Chrome, Firefox or Edge?",
        a: "Add the FilterTube extension, open its popup or full settings, and add the word. Refresh the YouTube tab to see the result. The extension also hides matching comments and live chat messages where supported.",
        links: [
          { label: "Chrome Web Store", href: links.chrome },
          { label: "Firefox Add-ons", href: links.firefox },
          { label: "Edge Add-ons", href: links.edge },
        ],
      },
      {
        q: "How do I block a YouTube channel?",
        a: "Paste the channel's handle, ID or link into Filters, or use Block in a video's menu as you browse. A blocked channel is hidden everywhere it would appear.",
      },
      {
        q: "Can I block YouTube Shorts?",
        a: "Yes. Hide all Shorts shelves, cards and entry points with one switch, or keep Shorts and filter them with your channel and keyword rules.",
      },
      {
        q: "Can I filter by category, language, upload date or video length?",
        a: "Yes. Choose from 15 video categories, limit by upload date and length, and hide videos below a view count. Language filtering (32 options) is experimental and relies on the information each video provides; it is not speech recognition.",
      },
    ],
  },
  {
    title: "Kids and families",
    items: [
      {
        q: "How do I block YouTube channels for my kid?",
        a: "Create a Kids profile for your child with its own PIN, then block channels and words in that profile, or switch it to allow-only mode. Your child's PIN opens their profile but never unlocks parent settings. You can make changes later from your own phone and send them to your child's device.",
        links: [{ label: "FilterTube for Kids", href: `${SITE_URL}/kids` }],
      },
      {
        q: "How do I allow only certain YouTube channels?",
        a: "Switch the profile to Whitelist (allow-only) mode and add the channels you trust, or import the channels you already follow. Everything else is hidden, including in Search. Approving a channel isn't a promise that every future upload suits your child, so keep an eye on new videos.",
      },
      {
        q: "Can I change my child's rules from my own phone?",
        a: "Yes. Pair your device with your child's using a code or QR, compare the safety phrase on both screens, then send approved rule, time and access changes. Updates are end-to-end encrypted and travel straight between your devices. When you tap Send, a child's open FilterTube (or their browser, with the extension) picks the change up within seconds, shows \"Parent sent an update\" and applies it with no reload; the video playing keeps playing unless the new rules block it. Optional pickup can deliver an update when the child's device opens later.",
      },
      {
        q: "How is FilterTube different from the YouTube Kids app?",
        a: "YouTube Kids is Google's own app for children, with age levels and an approved-content-only mode. FilterTube adds keyword and channel blocking you control, the same rules in a browser, on Android TV and on iPhone, separate profiles for each child, daily time limits, Study mode, parent updates sent to a child's device, and no ads.",
        links: [{ label: "Full comparison", href: `${SITE_URL}/compare` }],
      },
    ],
  },
  {
    title: "Study and focus",
    items: [
      {
        q: "Is there a YouTube study mode?",
        a: "Yes. FilterTube's Study mode plans rounds and breaks. While a round runs, only the channels in your study plan appear, search looks only in those channels, and comments stay off. A calendar-style timetable switches what you see by time of day. Ready-made packs cover exams, school classes, degrees and interviews: 415 packs for 81 countries.",
        links: [{ label: "How Study mode works", href: `${SITE_URL}/study` }],
      },
      {
        q: "Can FilterTube change what I see by time of day?",
        a: "Yes. Study mode has a calendar-style timetable: give each day its periods, such as maths 5 to 6 pm, and Study starts and ends on its own, so what you see switches with the time of day. Add to my calendar saves the week for your calendar app.",
      },
      {
        q: "Can I stop myself from turning the filters off while studying?",
        a: "Yes. During a Study round, rules can only get stricter. A Self-Control Session holds your current rules for a countdown you choose, and Hard Timer Whitelist limits viewing to channels you picked. Neither can be cancelled inside the app once started.",
      },
    ],
  },
  {
    title: "Platforms, privacy and source",
    items: [
      {
        q: "Which devices does FilterTube run on?",
        a: "iPhone and iPad (iOS and iPadOS 17 or later), Android phones and tablets, Android TV and Google TV, and the Chrome, Firefox, Edge and Opera browsers (plus Brave, Vivaldi and other Chromium browsers). Fire TV support is planned.",
        links: [{ label: "All downloads", href: links.downloads }],
      },
      {
        q: "Does it work on YouTube Kids?",
        a: "Yes. The browser extension filters youtubekids.com, and the Android, iPhone, iPad and Android TV apps have a Kids view with YouTube Kids content. Kids rules are kept apart from Main, and changing them asks for the parent PIN.",
        links: [{ label: "FilterTube for Kids", href: `${SITE_URL}/kids` }],
      },
      {
        q: "Does it work on YouTube Music?",
        a: "Yes. The browser extension filters music.youtube.com, and the Android and iPhone/iPad apps have Sangeet, a music space with its own player, queue and lyrics. Your filters apply to music too. Sangeet isn't on Android TV yet.",
      },
      {
        q: "Why isn't FilterTube on the App Store?",
        a: "Trouble on Apple's side with the developer account is delaying the App Store version. Until then you can install the same app directly with SideStore, or with AltStore. It uses Apple's own free developer signing, nothing is jailbroken, and your settings carry over to the App Store version later.",
        links: [{ label: "Install on iPhone or iPad", href: links.ios }],
      },
      {
        q: "Do I need an account?",
        a: "No. There is no FilterTube sign-up. Your rules, profiles, PINs and history stay on your device, and no FilterTube server keeps your settings or what you watch.",
        links: [{ label: "Privacy policy", href: links.privacy }],
      },
      {
        q: "Is the FilterTube extension open source?",
        a: "Yes. The browser extension is open source under the MIT licence, on GitHub.",
        links: [{ label: "Extension source on GitHub", href: links.github }],
      },
      {
        q: "What is the current version?",
        a: `FilterTube ${release.current} came out on ${release.currentDate} for iPhone, iPad, Android, Android TV and the browser extension. It gives the apps a new icon, Uljhan peeking, makes the iPhone and iPad download much smaller, and fixes videos that froze or opened paused in the browser extension. The release before, 3.6.4, brought parent updates that arrive within seconds, a calendar-style Study timetable with a widget and calendar export, and 415 Study packs for 81 countries.`,
      },
      {
        q: "Is FilterTube made by YouTube or Google?",
        a: "No. FilterTube is an independent project. It is not endorsed by, sponsored by or affiliated with Google or YouTube.",
      },
    ],
  },
];

export const faqItems = faqGroups.flatMap((group) => group.items);

// Fair, specific comparisons. Facts about other tools were checked on their own pages in November
// 2026; say "check their site" rather than guessing at features we could not confirm.
export const comparisonIntro =
  "Each of these tools does its own job well. This page explains what each one is for and what FilterTube adds, so you can pick the right one, or use more than one. Facts about other tools were checked on their own pages in November 2026 and can change; check their sites for the latest.";

export const comparisons = [
  {
    name: "BlockTube",
    madeFor: "Blocking YouTube channels, keywords, videos and comments by rules",
    runsOn: "Chrome and Firefox extension",
    price: "Free, open source (GPL-3.0)",
    goodAt: "Powerful rules, including regular expressions, video IDs, comment filters, a custom JavaScript filter function and a password lock for its options. It also runs on m.youtube.com in Firefox for Android.",
    adds: "Allow-only mode, Kids profiles, Study mode, parent updates to a child's device, ad blocking, and apps for iPhone, iPad, Android and Android TV. FilterTube imports BlockTube exports and exports compatible rules back; it doesn't run BlockTube's custom JavaScript filters.",
  },
  {
    name: "Unhook",
    madeFor: "Hiding distracting parts of YouTube",
    runsOn: "Chrome, Firefox and Edge extension",
    price: "See its site",
    goodAt: "A simple way to hide recommendations, comments and other distractions, used by more than a million people.",
    adds: "Keyword and channel rules, allow-only mode, Kids profiles, Study mode, and the same rules in apps for phones, tablets and TVs.",
  },
  {
    name: "TubeBlock",
    madeFor: "Hiding channels, keywords and Shorts on YouTube",
    runsOn: "Chrome, Edge, Brave and Opera extension (desktop only)",
    price: "Free",
    goodAt: "Quick channel blocking with a button, whole-word keyword filters and a Shorts switch, with lists kept in your browser.",
    adds: "Firefox support, apps for iPhone, iPad, Android and Android TV, allow-only mode, Kids profiles, Study mode, ad blocking and device sync.",
  },
  {
    name: "YouTube Kids app",
    madeFor: "A separate YouTube app for children, from Google",
    runsOn: "Android, iPhone, iPad, smart TVs and the web",
    price: "Free",
    goodAt: "Age-based content levels, an approved-content-only mode, up to eight child profiles with a parent passcode, a timer and Google's own content review.",
    adds: "Keyword blocking you control, profiles for each child with PINs, Study mode, parent updates sent from your phone, no ads, and filters for Main viewing too, not only Kids.",
  },
  {
    name: "uBlock Origin",
    madeFor: "Blocking ads and trackers on every website",
    runsOn: "Browser extension (full version on Firefox; uBlock Origin Lite on Chrome)",
    price: "Free, open source",
    goodAt: "Efficient, general-purpose blocking across the whole web, with filter lists and custom rules. For ads on every website, it is the stronger choice.",
    adds: "Choosing what appears on YouTube without writing filter syntax: keyword and channel rules, allow-only mode, Kids profiles and Study mode, plus apps for iPhone, Android and TV.",
  },
  {
    name: "AdGuard",
    madeFor: "Blocking ads and trackers on many devices",
    runsOn: "Browser extensions, plus apps for Windows, Mac, Android and iOS",
    price: "Browser extensions are free; most apps need a paid licence",
    goodAt: "Device-wide ad and tracker blocking, DNS filtering and parental features across many platforms.",
    adds: "YouTube-specific rules (keywords, channels, Shorts, allow-only), Kids profiles with PINs, Study mode and parent sync, free and with no account.",
  },
  {
    name: "Brave",
    madeFor: "A browser with ad and tracker blocking built in",
    runsOn: "Windows, Mac, Linux, Android and iOS",
    price: "Free",
    goodAt: "Blocks ads, including on YouTube, as you browse, with nothing extra to install.",
    adds: "Choosing what appears: keyword and channel rules, allow-only mode, Kids profiles and Study mode. The FilterTube extension also installs in Brave from the Chrome Web Store.",
  },
];

export const filterTubeRow = {
  name: "FilterTube",
  madeFor: "Blocking YouTube ads and choosing what appears",
  runsOn: "iPhone, iPad, Android phones, tablets and TVs, Chrome, Firefox, Edge and Opera",
  price: "Free, no account",
};

// Feature-by-feature table for /compare and compare.md. Competitor cells were checked on their own
// pages on 22 November 2026. "No" is used only when the source says so (or lists the feature as
// future work); anything else is "Not documented". Sources:
//   BlockTube  README https://github.com/amitbl/blocktube ("Whitelist mode" and "Sync options to cloud
//              provider" are under future work; password lock; m.youtube.com on Firefox for Android)
//              Chrome Web Store https://chromewebstore.google.com/detail/blocktube/bbeaicapbccfllodepmimpkgecanonai
//              ("Hiding YouTube Shorts", "Filtering videos by runtime")
//              Advanced Blocking wiki https://github.com/amitbl/blocktube/wiki/Advanced-Blocking
//   Unhook     https://unhook.app/ and its Chrome Web Store listing (toggles that hide feeds,
//              comments, Shorts and more; Chrome, Firefox, Edge; m.youtube.com in Firefox for Android)
//   TubeBlock  https://tubeblock.net/, /help/, /block-keywords-on-youtube/, /refund-policy/
//              ("does not run on m.youtube.com, music.youtube.com or YouTube Kids"; keywords match
//              titles and channel names; not in the iPhone, iPad, Android or TV apps; Export/Import;
//              browser sync storage; free; no account)
//   YouTube Kids  support.google.com/youtubekids answers 7178746 (block video/channel), 6172308
//              (Approve content yourself), 6130561 (up to eight profiles, passcode, no sign-in
//              needed), 6130558 (timer), 6130541 (limited ads; Premium removes them)
export const matrixTools = ["FilterTube", "BlockTube", "Unhook", "TubeBlock", "YouTube Kids app"];

const ND = "Not documented";

export const featureMatrix = [
  { group: "Blocking", feature: "Keyword blocking", cells: ["Yes", "Yes, including regex", ND, "Yes, titles and channel names", ND] },
  { group: "Blocking", feature: "Channel blocking", cells: ["Yes", "Yes", ND, "Yes", "Yes"] },
  { group: "Blocking", feature: "Single video blocking", cells: ["Yes", "Yes", ND, ND, "Yes"] },
  { group: "Blocking", feature: "Comments", cells: ["Hide all, or filter by word or commenter", "Filter by user or text", "Hide", "No, keywords skip comments", ND] },
  { group: "Blocking", feature: "Shorts", cells: ["Hide, or filter by your rules", "Hide", "Hide", "Hide", ND] },
  { group: "Filters", feature: "Category filter", cells: ["Yes, 15 categories", ND, ND, ND, "Age levels instead"] },
  { group: "Filters", feature: "Language filter", cells: ["Yes (experimental)", ND, ND, ND, ND] },
  { group: "Filters", feature: "Upload-date and length filters", cells: ["Both", "Length only", ND, ND, ND] },
  { group: "Family and focus", feature: "Time limits", cells: ["Daily per profile, plus locked focus sessions", ND, ND, ND, "Session timer"] },
  { group: "Family and focus", feature: "Allow-only (whitelist) mode", cells: ["Yes", "No, listed as future work", ND, ND, "Yes, approve content yourself"] },
  { group: "Family and focus", feature: "Kids profiles with PINs", cells: ["Yes", "Options password only", ND, ND, "Up to 8 profiles, parent passcode"] },
  { group: "Family and focus", feature: "Study mode", cells: ["Yes", ND, ND, ND, ND] },
  { group: "Family and focus", feature: "Calendar-style timetable", cells: ["Yes, with calendar export", ND, ND, ND, ND] },
  { group: "Family and focus", feature: "Parent-to-child sync", cells: ["Yes, encrypted, arrives within seconds", "No, cloud sync listed as future work", ND, "Same-user browser sync only", ND] },
  { group: "Family and focus", feature: "Backup and import", cells: ["Yes, including BlockTube import", ND, ND, "Export and import", ND] },
  { group: "Sites", feature: "YouTube Kids", cells: ["Yes: extension and the apps' Kids view", ND, ND, "No", "Yes, it is YouTube Kids"] },
  { group: "Sites", feature: "YouTube Music", cells: ["Yes: extension and Sangeet in the phone and tablet apps", ND, ND, "No", ND] },
  { group: "Platforms", feature: "iPhone and iPad", cells: ["App (SideStore)", ND, ND, "No", "App"] },
  { group: "Platforms", feature: "Android", cells: ["App (Google Play)", "Firefox for Android", "Firefox for Android", "No", "App"] },
  { group: "Platforms", feature: "Android TV", cells: ["App (Google Play)", ND, ND, "No", "TV app and casting"] },
  { group: "Platforms", feature: "Desktop browsers", cells: ["Chrome, Firefox, Edge, Opera", "Chrome, Firefox", "Chrome, Firefox, Edge", "Chrome, Edge, Brave, Opera", "youtubekids.com"] },
  { group: "Basics", feature: "Ads", cells: ["Blocked on every platform", ND, ND, ND, "Shows limited ads; YouTube Premium removes them"] },
  { group: "Basics", feature: "Account needed", cells: ["No", ND, ND, "No", "No to watch; blocking needs sign-in"] },
  { group: "Basics", feature: "Price", cells: ["Free", "Free", ND, "Free", "Free"] },
];

export const matrixHeadline =
  "BlockTube's keyword, channel, video and comment blocking, plus allow-only mode, Kids profiles, Study mode with a calendar-style timetable, date and length filters, YouTube Kids and YouTube Music, and apps for iPhone, iPad, Android and Android TV.";

export const matrixNote =
  "Facts about other tools come from their own READMEs, store pages and help pages, checked on 22 November 2026. \"Not documented\" means we couldn't find it in those sources, not that the tool can't do it.";
