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
      { src: ios("iphone-launcher"), title: "Viewing spaces", alt: "FilterTube on iPhone: choose between Main Viewing and Kids Viewing", caption: "Main and Kids each keep their own rules.", ...IPHONE, current: false },
      { src: ios("iphone-filters"), title: "Your filters", alt: "FilterTube on iPhone: the filter editor with block list and allow list choices", caption: "Block what you name, or allow only what you trust.", ...IPHONE, current: false },
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
      watch: { src: ios("ipad-watch"), title: "Watch", alt: "FilterTube on iPad: a lesson video playing with recommendations beside it", caption: "The video and recommendations side by side.", ...IPAD, current: true },
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
      sangeet: { src: android("phone-sangeet"), title: "Sangeet", alt: "Sangeet now playing on an Android phone with album art and playback controls", caption: "Album art, shuffle, repeat, lyrics and video.", ...PHONE, current: true },
    },
    extras: [
      { src: android("phone-study-session"), title: "A study session", alt: "FilterTube Study and focus on an Android phone: round 1 of 2 with 25 minutes left", caption: "Rounds and breaks, with Kriti keeping you company.", ...PIXEL, current: true },
      { src: android("phone-study-done"), title: "Session done", alt: "FilterTube on an Android phone: Kriti holds a rosette after a finished study session", caption: "Every round counted at the end.", ...PIXEL, current: true },
      { src: android("phone-watch-study"), title: "Watching during study", alt: "A lecture playing on an Android phone during a study round, with Kriti noting comments are off while you study", caption: "Comments stay off while you study.", ...PIXEL, current: true },
      { src: android("phone-playlist"), title: "Playlist", alt: "A lecture playlist on an Android phone with Play all and the lesson list", caption: "Whole lecture series, in order.", ...PIXEL, current: true },
      { src: android("phone-watch-queue"), title: "Watching a series", alt: "A lecture playing on an Android phone with the playlist queue open below", caption: "The next lecture is always one tap away.", ...PIXEL, current: true },
      { src: android("phone-entry"), title: "Viewing spaces", alt: "FilterTube on an Android phone: choose your viewing space, Main or Kids", caption: "Main and Kids each keep their own rules.", ...PHONE, current: false },
      { src: android("phone-search"), title: "Search", alt: "Android search results with filters and block buttons", caption: "Search with filters; every card can be blocked.", ...PHONE, current: false },
      { src: android("phone-player-controls"), title: "Player", alt: "Android player controls with chapter markers", caption: "Captions, floating player, fullscreen and chapter marks.", ...PHONE, current: false },
      { src: android("phone-player-settings"), title: "Player settings", alt: "Android player settings sheet", caption: "Quality, buffer, loop, autoplay, sleep timer, skip silence and more.", ...PHONE, current: false },
      { src: android("phone-chapters"), title: "Chapters", alt: "Android chapters sheet with search", caption: "Search and jump between chapters.", ...PHONE, current: false },
      { src: android("phone-channel-miniplayer"), title: "Channel + mini player", alt: "A channel page with the floating mini player on Android", caption: "Browse channels while the video keeps playing.", ...PHONE, current: false },
      { src: android("phone-music-home"), title: "Sangeet Home", alt: "Sangeet Home on Android with Quick picks", caption: "Sangeet Home, Explore and Library.", ...PHONE, current: false },
      { src: android("phone-queue"), title: "Queue", alt: "Sangeet queue with drag handles on Android", caption: "Reorder the queue or save it as a playlist.", ...PHONE, current: false },
      { src: android("phone-you"), title: "You", alt: "Android You page with library and history", caption: "Local playlists, Watch later, Notes, offline media and history.", ...PHONE, current: false },
      { src: android("phone-filters-channels"), title: "Channel rules", alt: "Android channel rules with suggestions", caption: "Block or allow channels, with suggestions from what you watched.", ...PHONE, current: false },
      { src: android("phone-content-controls"), title: "Content controls", alt: "Android content controls list", caption: "Hide Shorts, the Home feed, comments, categories and more.", ...PHONE, current: false },
      { src: android("phone-sync"), title: "Accounts & Sync", alt: "Android Accounts and Sync menu", caption: "Connect devices, keep in sync, profiles and PINs.", ...PHONE, current: false },
      { src: android("phone-sync-pairing"), title: "Private P2P pairing", alt: "Android device pairing with a code and QR", caption: "Pair with a code or QR. No account, no cloud copy.", ...PHONE, current: false },
      { src: android("phone-kids-mode"), title: "Kids Mode", alt: "Android Kids Mode rules", caption: "Separate Kids rules from Main.", ...PHONE, current: false },
      { src: android("phone-self-control"), title: "Self-Control", alt: "Android Self-Control session setup", caption: "Lock your rules for a set time.", ...PHONE, current: false },
      { src: android("phone-settings"), title: "Settings", alt: "Android settings list", caption: "Language, theme, launch behavior and integrations.", ...PHONE, current: false },
      { src: android("phone-integrations"), title: "Integrations", alt: "Android toggles for SponsorBlock, dislike counts and DeArrow", caption: "Optional SponsorBlock, dislikes and community titles.", ...PHONE, current: false },
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
      { src: android("tablet-music-explore"), title: "Sangeet Explore", alt: "Sangeet Explore on a tablet with new releases and moods", caption: "New releases, charts, moods and podcasts.", ...TABLET, current: false },
      { src: android("tablet-search"), title: "Search grid", alt: "Tablet search results in a three-column grid", caption: "Three-column search results.", ...TABLET, current: false },
      { src: android("tablet-block-menu"), title: "Block from any card", alt: "Tablet Subscriptions with the FilterTube block menu open", caption: "Block a channel or filter all its videos from any card.", ...TABLET, current: false },
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
      home: { src: android("tv-home"), title: "Home", alt: "Android TV Home with blocked cards counted", caption: "Home with your filters applied.", ...TV, current: false },
      watch: { src: android("tv-watch"), title: "Watch", alt: "Android TV Watch page playing a nature documentary", caption: "Watch with recommendations from the same channel.", ...TV, current: false },
      kids: { src: android("tv-kids-home"), title: "Kids Home on TV", alt: "Kids Viewing on Android TV with Shows and More for you rows", caption: "Kids rows built for the remote.", ...TV, current: false },
      controls: { src: android("tv-controls"), title: "FilterTube Controls", alt: "FilterTube Controls on Android TV", caption: "Controls from the sofa.", ...TV, current: true },
    },
    extras: [
      { src: android("tv-entry"), title: "Viewing spaces", alt: "FilterTube Android TV viewing space choice", caption: "Main and Kids on the big screen.", ...TV, current: false },
      { src: android("tv-search"), title: "Search", alt: "Android TV search sheet", caption: "A remote-friendly search sheet.", ...TV, current: false },
      { src: android("tv-search-results"), title: "Search results", alt: "Android TV search results", caption: "Results laid out for the remote.", ...TV, current: false },
      { src: android("tv-subscriptions"), title: "Subscriptions", alt: "Android TV Subscriptions with channel avatars", caption: "Your subscriptions, filtered.", ...TV, current: false },
      { src: android("tv-you"), title: "You", alt: "Android TV You page", caption: "History, playlists and your channel.", ...TV, current: false },
      { src: android("tv-filters"), title: "Filters", alt: "Android TV keyword filters", caption: "Keyword and channel rules with the remote.", ...TV, current: false },
      { src: android("tv-kids"), title: "Kids Mode", alt: "Android TV Kids Mode rules", caption: "Kids rules on TV.", ...TV, current: false },
      { src: android("tv-settings"), title: "Settings", alt: "Android TV settings", caption: "TV settings and integrations.", ...TV, current: false },
      { src: android("tv-accounts-sync"), title: "Accounts & Sync", alt: "Android TV Accounts and Sync", caption: "Pair the TV with your other devices.", ...TV, current: false },
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

// Kids Viewing screens, used by the Kids page.
export const kidsScreens = {
  phone: [
    { src: android("phone-kids-home"), title: "Kids Home", alt: "FilterTube Kids Viewing home on an Android phone", caption: "Kids Viewing with the child's own Kids profile.", ...PHONE, current: false },
    { src: android("phone-parent-pin"), title: "Parent PIN to block", alt: "Parent Controls PIN prompt over Kids Viewing", caption: "Blocking or changing rules always asks the parent PIN.", ...PHONE, current: false },
    { src: android("phone-kids-search"), title: "Kids Search", alt: "Kids search results for dinosaurs", caption: "Search in Kids, with your Kids rules applied.", ...PHONE, current: false },
    { src: android("phone-kids-watch"), title: "Kids Watch", alt: "Kids Watch page with Up next", caption: "Up next is checked against parent rules before it plays.", ...PHONE, current: false },
    { src: android("phone-kids-mode"), title: "Kids Mode rules", alt: "FilterTube Kids Mode rules screen", caption: "Separate Kids rules, set by a parent.", ...PHONE, current: false },
  ],
  tablet: [
    { src: android("tablet-kids-home"), title: "Kids Home on tablet", alt: "Kids Viewing grid on a tablet with shows and playlists", caption: "A three-column grid of shows and playlists.", ...TABLET, current: false },
    { src: android("tablet-kids-search"), title: "Kids Search on tablet", alt: "Kids search results list on a tablet", caption: "Search results with room for long titles.", ...TABLET, current: false },
    { src: android("tablet-kids-watch"), title: "Two-pane Kids Watch", alt: "Kids Watch on a tablet with Up next beside the video", caption: "The video and Up next side by side.", ...TABLET, current: false },
  ],
  tv: [
    { src: android("tv-kids-home"), title: "Kids Home on TV", alt: "Kids Viewing on Android TV with Shows and More for you rows", caption: "Kids rows built for the remote.", ...TV, current: false },
    { src: android("tv-kids-search"), title: "Kids Search on TV", alt: "Kids search for dinosaurs on Android TV", caption: "Kids search on the big screen.", ...TV, current: false },
    { src: android("tv-kids-watch"), title: "Kids video on TV", alt: "A Kids video playing full screen on Android TV", caption: "Full-screen Kids playback.", ...TV, current: false },
  ],
};
