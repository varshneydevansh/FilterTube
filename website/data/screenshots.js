// One source of truth for every app screenshot on the site.
//
// To drop in fresh captures: put the .webp files in public/apps/screenshots/<folder>/,
// then point the matching slot below at them and set `current: true`. No component
// changes are needed. The six slots each device should have are listed in
// docs/refresh-2026-11-18/CAPTURE_LIST.md.
//
// Field guide
// - captures.<slot>: the screen for that slot, or omit it while there is no capture yet.
// - current: false marks a screen from an older build that should be re-captured.
// - extras: further screens shown after the slots on that device's gallery.
// - width/height: the file's real pixel size (prevents layout shift).
// Copy rule: alt text and captions never name the underlying video service.

export const captureSlots = ["home", "study", "watch", "kids", "controls", "sangeet"];

export const captureSlotLabels = {
  home: "Home",
  study: "Study home",
  watch: "Watch",
  kids: "Kids",
  controls: "Controls",
  sangeet: "Sangeet player",
};

const PHONE = { width: 1080, height: 2424 };
const PIXEL = { width: 1080, height: 2400 };
const TABLET = { width: 2560, height: 1600 };
const TV = { width: 1920, height: 1080 };
const IPHONE = { width: 1080, height: 2348 };
const IPAD = { width: 2420, height: 1668 };
const IPHONE_NEW = { width: 1206, height: 2622 };

const android = (file) => `/apps/screenshots/android/${file}.webp`;
const ios = (file) => `/apps/screenshots/ios/${file}.webp`;

export const devices = {
  iphone: {
    label: "iPhone",
    platform: "iOS",
    href: "/ios",
    status: "Install with SideStore",
    layout: "phone",
    featured: "controls",
    captures: {
      home: { src: ios("iphone-home"), title: "Home", alt: "FilterTube on iPhone: Home with the Main viewing space and its filters", caption: "Home with your filters applied.", ...IPHONE_NEW, current: true },
      study: { src: ios("iphone-study"), title: "Study plan", alt: "FilterTube on iPhone: a study plan with the exam channels you chose switched on", caption: "A study plan with only the channels you chose.", ...IPHONE_NEW, current: true },
      watch: { src: ios("iphone-watch"), title: "Watch", alt: "FilterTube on iPhone: a nature documentary playing with recommendations", caption: "A clean Watch page with your rules applied.", ...IPHONE_NEW, current: true },
      kids: { src: ios("iphone-kids"), title: "Kids", alt: "FilterTube Kids Viewing home on iPhone", caption: "Kids Viewing, with the parent's Kids rules.", ...IPHONE_NEW, current: true },
      controls: { src: ios("iphone-controls"), title: "Controls", alt: "FilterTube Controls on iPhone with filters, profiles, settings and sync", caption: "Filters, profiles and sync in one place.", ...IPHONE_NEW, current: true },
      sangeet: { src: ios("iphone-sangeet"), title: "Sangeet", alt: "Sangeet now playing on iPhone with album art and playback controls", caption: "Album art and playback controls.", ...IPHONE_NEW, current: true },
    },
    extras: [
      { src: ios("iphone-launcher"), title: "Viewing spaces", alt: "FilterTube on iPhone: choose between Main Viewing and Kids Viewing", caption: "Main and Kids each keep their own rules.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-filters"), title: "Your filters", alt: "FilterTube on iPhone: the filter editor with block list and allow list choices", caption: "Block what you name, or allow only what you trust.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-search"), title: "Search", alt: "FilterTube on iPhone: search results for physics lectures", caption: "Search with your rules applied.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-player-controls"), title: "Player", alt: "FilterTube on iPhone: a lecture playing with captions, volume, settings and fullscreen controls", caption: "Captions, settings and fullscreen at a tap.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-player-settings"), title: "Player settings", alt: "FilterTube on iPhone: the player settings sheet with quality, buffer, loop, autoplay and sleep timer", caption: "Quality, buffer, loop, autoplay and a sleep timer.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-you"), title: "You", alt: "FilterTube on iPhone: the You page with your library and history", caption: "Playlists, notes, offline media and history.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-sangeet-moods"), title: "Sangeet moods", alt: "Sangeet moods and genres on iPhone: Chill, Focus, Sleep and more", caption: "Pick music by mood or genre.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-sangeet-search"), title: "Sangeet search", alt: "Sangeet search on iPhone showing lofi study playlists and albums", caption: "Search for calm music to study to.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-filters-channels"), title: "Channel rules", alt: "FilterTube on iPhone: channel rules with block and allow lists and suggestions", caption: "Block or allow channels, with suggestions from what you watched.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-content-controls"), title: "Content controls", alt: "FilterTube on iPhone: content controls to hide Clips, the Home feed and more", caption: "Hide Clips, the Home feed, comments and more.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-sync"), title: "Accounts & Sync", alt: "FilterTube on iPhone: the Accounts and Sync menu", caption: "Connect devices, keep in sync, profiles and PINs.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-settings"), title: "Settings", alt: "FilterTube on iPhone: the settings list", caption: "Language, theme, launch behavior and integrations.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-integrations"), title: "Integrations", alt: "FilterTube on iPhone: optional integration toggles for sponsor segments, dislike counts and community titles", caption: "Optional sponsor skipping, dislikes and community titles.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-kids-mode"), title: "Kids Mode", alt: "FilterTube on iPhone: Kids Mode rules kept separate from Main", caption: "Separate Kids rules from Main.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-study-session"), title: "A study session", alt: "FilterTube on iPhone: Study and focus with round 1 of 4 and the time left", caption: "Rounds and breaks, with Kriti keeping you company.", ...IPHONE_NEW, current: true },
      { src: ios("iphone-study-done"), title: "Session done", alt: "FilterTube on iPhone: Kriti holds a rosette after 45 minutes studied", caption: "Every round counted at the end.", ...IPHONE_NEW, current: true },
    ],
  },
  ipad: {
    label: "iPad",
    platform: "iPadOS",
    href: "/ios",
    status: "Install with SideStore",
    layout: "desktop",
    featured: "home",
    captures: {
      home: { src: ios("ipad-home"), title: "Home", alt: "FilterTube on iPad: Home with a study session running and a grid of JEE lesson videos", caption: "Home with a study session running.", ...IPAD, current: true },
      study: { src: ios("ipad-study"), title: "Study plan", alt: "FilterTube on iPad: a JEE Main study plan with the exam channels switched on", caption: "A study plan with only the channels you chose.", ...IPAD, current: true },
      watch: { src: ios("ipad-watch"), title: "Watch", alt: "FilterTube on iPad in landscape: an education video playing with a soft colour glow behind it, Up next and Recommended beside it", caption: "The video and Up next side by side, with a soft glow.", ...IPAD, current: true },
      kids: { src: ios("ipad-kids"), title: "Kids", alt: "FilterTube Kids Viewing on iPad with a grid of shows and playlists", caption: "Kids Viewing, with the parent's Kids rules.", ...IPAD, current: true },
      controls: { src: ios("ipad-controls"), title: "Controls", alt: "FilterTube Controls on iPad", caption: "A wide Controls grid.", ...IPAD, current: true },
      sangeet: { src: ios("ipad-sangeet"), title: "Sangeet player", alt: "Sangeet now playing on iPad with album art and the queue beside it", caption: "Album art and the queue side by side.", ...IPAD, current: true },
    },
    extras: [],
  },
  androidPhone: {
    label: "Android phone",
    platform: "Android",
    href: "/android",
    status: "Google Play",
    layout: "phone",
    featured: "watch",
    captures: {
      home: { src: android("phone-home"), title: "Home", alt: "FilterTube Home on an Android phone during a study round, with engineering subject chips and a lecture feed", caption: "Home during a study round: only what you chose.", ...PIXEL, current: true },
      study: { src: android("phone-study"), title: "Study home", alt: "FilterTube Study home on an Android phone with the round ring and a lesson feed", caption: "A study round with only the channels you chose.", ...PHONE, current: true },
      watch: { src: android("phone-watch"), title: "Watch", alt: "FilterTube on an Android phone: the Watch page playing a nature documentary", caption: "A clean Watch page with your rules applied.", ...PHONE, current: true },
      kids: { src: android("phone-kids-home"), title: "Kids Home", alt: "FilterTube Kids Viewing home on an Android phone", caption: "Kids Viewing, with the parent's Kids rules.", ...PHONE, current: false },
      controls: { src: android("phone-controls"), title: "FilterTube Controls", alt: "FilterTube Controls overview on an Android phone", caption: "Every control in one place.", ...PHONE, current: true },
      sangeet: { src: android("phone-sangeet"), title: "Sangeet", alt: "Sangeet now playing on an Android phone with album art and playback controls", caption: "Round art, lyrics, comments and the video, one tap each.", ...PIXEL, current: true },
    },
    extras: [
      { src: android("phone-study-session"), title: "A study session", alt: "FilterTube Study and focus on an Android phone: round 1 of 2 with 25 minutes left", caption: "Rounds and breaks, with Kriti keeping you company.", ...PIXEL, current: true },
      { src: android("phone-study-break"), title: "Break", alt: "A study break on an Android phone: a 4 minute ring, Kriti standing by, and a note to stand up and drink water", caption: "Breaks are real breaks: stand up, drink some water.", ...PIXEL, current: true },
      { src: android("phone-study-done"), title: "Session done", alt: "FilterTube on an Android phone: Kriti holds a rosette after a finished study session", caption: "Every round counted at the end.", ...PIXEL, current: true },
      { src: android("phone-watch-study"), title: "Watching during study", alt: "A lecture playing on an Android phone during a study round, with Kriti noting comments are off while you study", caption: "Comments stay off while you study.", ...PIXEL, current: true },
      { src: android("phone-playlist"), title: "Playlist", alt: "A lecture playlist on an Android phone with Play all and the lesson list", caption: "Whole lecture series, in order.", ...PIXEL, current: true },
      { src: android("phone-watch-queue"), title: "Watching a series", alt: "A lecture playing on an Android phone with the playlist queue open below", caption: "The next lecture is always one tap away.", ...PIXEL, current: true },
      { src: android("phone-entry"), title: "Viewing spaces", alt: "FilterTube on an Android phone: choose your viewing space, Main or Kids", caption: "Main and Kids each keep their own rules.", ...PHONE, current: true },
      { src: android("phone-search"), title: "Search", alt: "Android search results with filters and block buttons", caption: "Search with filters; every card can be blocked.", ...PHONE, current: true },
      { src: android("phone-player-controls"), title: "Player", alt: "Android player controls with chapter markers", caption: "Captions, floating player, fullscreen and chapter marks.", ...PHONE, current: true },
      { src: android("phone-player-settings"), title: "Player settings", alt: "Android player settings sheet", caption: "Quality, buffer, loop, autoplay, sleep timer, skip silence and more.", ...PHONE, current: true },
      { src: android("phone-chapters"), title: "Chapters", alt: "Android chapters sheet with search", caption: "Search and jump between chapters.", ...PHONE, current: true },
      { src: android("phone-channel-miniplayer"), title: "Channel + mini player", alt: "A channel page with the floating mini player on Android", caption: "Browse channels while the video keeps playing.", ...PHONE, current: true },
      { src: android("phone-music-home"), title: "Sangeet Explore", alt: "Sangeet Explore on an Android phone with new releases, charts, moods and podcasts", caption: "New releases, charts, moods and podcasts.", ...PIXEL, current: true },
      { src: android("phone-music-moods"), title: "Moods & genres", alt: "Sangeet moods and genres on an Android phone: Chill, Focus, Sleep, Carnatic classical and more", caption: "Pick music by mood or genre.", ...PIXEL, current: true },
      { src: android("phone-music-podcasts"), title: "Podcasts", alt: "Sangeet Podcasts on an Android phone with Shows for you and topic shelves", caption: "Shows for you, and shelves by topic.", ...PIXEL, current: true },
      { src: android("phone-music-focus"), title: "Focus", alt: "Sangeet Focus on an Android phone with calm playlists such as Lofi, Classical focus and Gentle Piano", caption: "Music for studying: lofi, classical, gentle piano.", ...PIXEL, current: true },
      { src: android("phone-music-playlist"), title: "Playlist", alt: "A Sangeet playlist page on an Android phone, coloured from the cover art", caption: "Each playlist takes its colours from the cover.", ...PIXEL, current: true },
      { src: android("phone-queue"), title: "Queue", alt: "Sangeet queue with drag handles on Android", caption: "Reorder the queue or save it as a playlist.", ...PIXEL, current: true },
      { src: android("phone-you"), title: "You", alt: "Android You page with library and history", caption: "Local playlists, Watch later, Notes, offline media and history.", ...PHONE, current: true },
      { src: android("phone-filters-channels"), title: "Channel rules", alt: "Android channel rules with suggestions", caption: "Block or allow channels, with suggestions from what you watched.", ...PHONE, current: true },
      { src: android("phone-content-controls"), title: "Content controls", alt: "Android content controls list", caption: "Hide Shorts, the Home feed, comments, categories and more.", ...PHONE, current: true },
      { src: android("phone-sync"), title: "Accounts & Sync", alt: "Android Accounts and Sync menu", caption: "Connect devices, keep in sync, profiles and PINs.", ...PHONE, current: true },
      { src: android("phone-sync-pairing"), title: "Private P2P pairing", alt: "Android device pairing with a code and QR", caption: "Pair with a code or QR. No account, no cloud copy.", ...PHONE, current: true },
      { src: android("phone-kids-mode"), title: "Kids Mode", alt: "Android Kids Mode rules", caption: "Separate Kids rules from Main.", ...PHONE, current: true },
      { src: android("phone-self-control"), title: "Self-Control", alt: "Android Self-Control session setup", caption: "Lock your rules for a set time.", ...PHONE, current: true },
      { src: android("phone-settings"), title: "Settings", alt: "Android settings list", caption: "Language, theme, launch behavior and integrations.", ...PHONE, current: true },
      { src: android("phone-integrations"), title: "Integrations", alt: "Android toggles for SponsorBlock, dislike counts and DeArrow", caption: "Optional SponsorBlock, dislikes and community titles.", ...PHONE, current: true },
    ],
  },
  androidTablet: {
    label: "Android tablet",
    platform: "Android",
    href: "/android",
    status: "Google Play",
    layout: "desktop",
    featured: "watch",
    captures: {
      home: { src: android("tablet-home"), title: "Home on tablet", alt: "FilterTube Home on a tablet with topic chips, a recent video and clips", caption: "Home with your filters applied.", ...TABLET, current: true },
      study: { src: android("tablet-study"), title: "Study home on tablet", alt: "FilterTube Study home on a tablet with the round progress bar and a grid of lessons", caption: "A study round with a wide lesson grid.", ...TABLET, current: true },
      watch: { src: android("tablet-watch"), title: "Two-pane Watch", alt: "Tablet Watch page with recommendations beside the video", caption: "The video and recommendations side by side.", ...TABLET, current: true },
      kids: { src: android("tablet-kids-home"), title: "Kids Home on tablet", alt: "Kids Viewing grid on a tablet with shows and playlists", caption: "A three-column grid of shows and playlists.", ...TABLET, current: false },
      controls: { src: android("tablet-controls"), title: "Controls on tablet", alt: "FilterTube Controls on a tablet", caption: "A wide Controls grid.", ...TABLET, current: true },
      sangeet: { src: android("tablet-sangeet"), title: "Sangeet player", alt: "Sangeet now playing on a tablet with large album art and the queue beside it", caption: "Album art and the queue side by side.", ...TABLET, current: true },
    },
    extras: [
      { src: android("tablet-music-explore"), title: "Sangeet Explore", alt: "Sangeet Explore on a tablet with a grid of moods and genres", caption: "Moods and genres, from Chill and Focus to classical.", ...TABLET, current: true },
      { src: android("tablet-search"), title: "Search grid", alt: "Tablet search results in a three-column grid", caption: "Three-column search results.", ...TABLET, current: true },
      { src: android("tablet-block-menu"), title: "Block from any card", alt: "A tablet feed with the FilterTube block menu open", caption: "Block a channel or filter all its videos from any card.", ...TABLET, current: true },
    ],
  },
  androidTv: {
    label: "Android TV",
    platform: "Android TV",
    href: "/android-tv",
    status: "TV APK on GitHub",
    layout: "desktop",
    featured: "watch",
    captures: {
      home: { src: android("tv-home"), title: "Home", alt: "Android TV Home with blocked cards counted", caption: "Home with your filters applied.", ...TV, current: true },
      watch: { src: android("tv-watch"), title: "Watch", alt: "Android TV Watch page with an education video playing and a soft glow around it, recommendations on the right", caption: "Watch, with recommendations beside the video.", ...TV, current: true },
      kids: { src: android("tv-kids-home"), title: "Kids Home on TV", alt: "Kids Viewing on Android TV with Shows and More for you rows", caption: "Kids rows built for the remote.", ...TV, current: true },
      controls: { src: android("tv-controls"), title: "FilterTube Controls", alt: "FilterTube Controls on Android TV", caption: "Controls from the sofa.", ...TV, current: true },
    },
    extras: [
      { src: android("tv-entry"), title: "Viewing spaces", alt: "FilterTube Android TV viewing space choice", caption: "Main and Kids on the big screen.", ...TV, current: true },
      { src: android("tv-search"), title: "Search", alt: "Android TV search sheet", caption: "A remote-friendly search sheet.", ...TV, current: true },
      { src: android("tv-search-results"), title: "Search results", alt: "Android TV search results", caption: "Results laid out for the remote.", ...TV, current: true },
      { src: android("tv-subscriptions"), title: "Subscriptions", alt: "Android TV Subscriptions with channel avatars", caption: "Your subscriptions, filtered.", ...TV, current: false },
      { src: android("tv-you"), title: "You", alt: "Android TV You page", caption: "History, playlists and your channel.", ...TV, current: true },
      { src: android("tv-filters"), title: "Filters", alt: "Android TV keyword filters", caption: "Keyword and channel rules with the remote.", ...TV, current: true },
      { src: android("tv-kids"), title: "Kids Mode", alt: "Android TV Kids Mode rules", caption: "Kids rules on TV.", ...TV, current: true },
      { src: android("tv-settings"), title: "Settings", alt: "Android TV settings", caption: "TV settings and integrations.", ...TV, current: true },
      { src: android("tv-accounts-sync"), title: "Accounts & Sync", alt: "Android TV Accounts and Sync", caption: "Pair the TV with your other devices.", ...TV, current: true },
    ],
  },
};

export const deviceOrder = ["iphone", "ipad", "androidPhone", "androidTablet", "androidTv"];

/** Slot captures in slot order, then the extras. */
export function galleryFor(deviceId) {
  const device = devices[deviceId];
  if (!device) return [];
  const slotted = captureSlots.map((slot) => device.captures[slot]).filter(Boolean);
  return [...slotted, ...device.extras];
}

/** The one screen the home page's device strip shows, or null while there is none. */
export function featuredScreen(deviceId) {
  const device = devices[deviceId];
  if (!device) return null;
  return (device.featured && device.captures[device.featured]) || galleryFor(deviceId)[0] || null;
}

/** Slots that are missing or come from an older build (used by the capture checklist). */
export function pendingSlots(deviceId) {
  const device = devices[deviceId];
  return captureSlots.filter((slot) => !device.captures[slot]?.current);
}

// Kids Viewing screens, used by the Kids page. Current captures lead each rail; Android phone and
// tablet Kids screens still come from an older build (current: false) until they are re-captured.
// Every Kids screen must show clearly child-appropriate content: tv-kids-home and tv-kids-search
// stay off this page because their rows include music videos and a game channel.
export const kidsScreens = {
  phone: [
    { src: ios("iphone-kids"), title: "Kids Home on iPhone", alt: "FilterTube Kids Viewing home on iPhone with a cartoon episode and a nursery rhymes playlist", caption: "Kids Viewing, with the parent's Kids rules.", ...IPHONE_NEW, current: true },
    { src: android("phone-kids-home"), title: "Kids Home", alt: "FilterTube Kids Viewing home on an Android phone", caption: "Kids Viewing with the child's own Kids profile.", ...PHONE, current: false },
    { src: android("phone-parent-pin"), title: "Parent PIN to block", alt: "Parent Controls PIN prompt over Kids Viewing", caption: "Blocking or changing rules always asks the parent PIN.", ...PHONE, current: false },
    { src: android("phone-kids-search"), title: "Kids Search", alt: "Kids search results for dinosaurs", caption: "Search in Kids, with your Kids rules applied.", ...PHONE, current: false },
    { src: android("phone-kids-watch"), title: "Kids Watch", alt: "Kids Watch page with Up next", caption: "Up next is checked against parent rules before it plays.", ...PHONE, current: false },
    { src: ios("iphone-kids-mode"), title: "Kids Mode on iPhone", alt: "FilterTube on iPhone: Kids Mode rules kept separate from Main", caption: "Separate Kids rules, set by a parent.", ...IPHONE_NEW, current: true },
    { src: android("phone-kids-mode"), title: "Kids Mode rules", alt: "FilterTube Kids Mode rules screen", caption: "Separate Kids rules, set by a parent.", ...PHONE, current: true },
  ],
  tablet: [
    { src: ios("ipad-kids"), title: "Kids Home on iPad", alt: "FilterTube Kids Viewing on iPad with a grid of cartoons and nursery rhyme playlists", caption: "A wide grid of shows and playlists.", ...IPAD, current: true },
    { src: android("tablet-kids-home"), title: "Kids Home on tablet", alt: "Kids Viewing grid on a tablet with shows and playlists", caption: "A three-column grid of shows and playlists.", ...TABLET, current: false },
    { src: android("tablet-kids-search"), title: "Kids Search on tablet", alt: "Kids search results list on a tablet", caption: "Search results with room for long titles.", ...TABLET, current: false },
    { src: android("tablet-kids-watch"), title: "Two-pane Kids Watch", alt: "Kids Watch on a tablet with Up next beside the video", caption: "The video and Up next side by side.", ...TABLET, current: false },
  ],
  tv: [
    { src: android("tv-kids-watch"), title: "Kids video on TV", alt: "A Pinkfong dinosaur cartoon, The Dino Dentist, playing full screen in Kids Viewing on Android TV", caption: "Full-screen Kids playback.", ...TV, current: true },
    { src: android("tv-kids"), title: "Kids rules on TV", alt: "Kids Mode on Android TV with the words scary and horror blocked", caption: "Block words like scary and horror for Kids, from the sofa.", ...TV, current: true },
  ],
};

// Browser extension screens, used by the extension page. The 3.6.2 captures (current: true) come
// from the owner's own browser, cropped so no browser toolbar, profile photo or site sidebar shows;
// the sync pairing QR code is blurred. The gallery crops match the Chrome Web Store screenshots.
// Kids rules and Accounts & Sync are still 3.4.1 captures (current: false) until they are re-captured.
const ext = (file) => `/apps/screenshots/${file}`;

export const extensionScreens = {
  // Hero fan: the popup in front, two dashboard cards behind it.
  hero: [
    { src: ext("extension-popup.webp"), title: "Popup", alt: "FilterTube extension popup: switched on, 144 hidden so far, with keyword search, Add keyword and colour-coded rules", width: 390, height: 536, current: true },
    { src: ext("extension-study-card.webp"), title: "Study plan", alt: "FilterTube extension study plan: SAT channels such as College Board and Khan Academy switched on, with SAT and GMAT topics", width: 570, height: 572, current: true },
    { src: ext("extension-uljhan-card.webp"), title: "What was hidden", alt: "FilterTube extension Home card listing videos hidden today because they matched a blocked word, each with an Allow button", width: 590, height: 382, current: true },
  ],
  gallery: [
    { src: ext("extension-home.webp"), title: "Home", alt: "FilterTube extension dashboard Home: Good afternoon, 144 things kept out today, 7h 28m saved, Study today and the videos Uljhan tried today, each with an Allow button", caption: "What was kept out today, time saved, and your study plan at a glance.", width: 1240, height: 672, current: true },
    { src: ext("extension-channel-rules.webp"), title: "Channel rules", alt: "FilterTube extension Channel Management with blocked channel rows coloured by where each rule came from, and the popup open beside it", caption: "Blocked channels, coloured by where each rule came from. The popup stays one click away.", width: 1840, height: 1323, current: true },
    { src: ext("extension-study-plan.webp"), title: "Study plan", alt: "FilterTube extension study plan for SAT and GMAT: exam channels such as College Board and Khan Academy switched on, with topic chips beside them", caption: "Pick your exam and keep the channels and topics you want.", width: 1280, height: 800, current: true },
    { src: ext("extension-study-feed.webp"), title: "Study feed", alt: "A study feed on the video site's home page: lessons from the plan's channels with SAT topic chips above them", caption: "The home page becomes a feed of lessons from your plan.", width: 1277, height: 918, current: true },
    { src: ext("extension-content-controls.webp"), title: "Content controls", alt: "FilterTube extension Content Controls: switches to hide Clips, the home feed, comments, adverts, Playables and more", caption: "Switch off Clips, adverts, Playables and more, everywhere at once.", width: 1490, height: 808, current: true },
    { src: ext("extension-private-sync.webp"), title: "Private sync", alt: "FilterTube extension Accounts & Sync: a pairing session waiting for the second device, a one-time pairing code, a blurred QR code, and the Pair, Verify and Send steps", caption: "Pair your own devices with a code, match the safety phrase, then send. The devices connect directly.", width: 1452, height: 788, current: true },
    { src: ext("extension-collab-menu.webp"), title: "Block collaborators", alt: "A search result with three collaborating channels and the FilterTube menu open: Done, Block 2 Selected, a Block row for each channel, and Filter All buttons", caption: "On a collaboration, block one channel, a few, or all of them.", width: 1180, height: 358, current: true },
    { src: ext("extension-length-date.webp"), title: "Length and date", alt: "FilterTube extension Duration Filter set to block videos shorter than 5 minutes, and Upload Date Filter set to only the past 30 days", caption: "Trim Shorts and clips by length or upload date instead of hiding them all.", width: 668, height: 360, current: true },
    { src: ext("extension-import-export.webp"), title: "Import and export", alt: "FilterTube extension Settings, Import / Export: download a backup, restore one, or import a channel and keyword list with a preview", caption: "Back up, restore, or preview a rule list before importing it.", width: 1839, height: 1319, current: true },
    { src: ext("extension-kids-rules.png"), title: "Kids rules", alt: "FilterTube extension preview: Kids rules", caption: "Keep channel rules for Kids separate from Main viewing.", width: 1722, height: 1263, current: false },
    { src: ext("extension-accounts-sync.png"), title: "Accounts & Sync", alt: "FilterTube extension preview: Accounts & Sync", caption: "Choose a device, verify the connection and decide what to sync.", width: 1718, height: 1258, current: false },
  ],
};
