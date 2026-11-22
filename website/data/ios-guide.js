// Shared by the /ios install guide and /ios.md, so both say the same thing.

export const iosPromises = [
  "Free, with no ads",
  "Nothing locked behind a payment",
  "No FilterTube sign-up, just like the extension",
  "No FilterTube server keeps your rules or history",
];

export const iosChecklist = [
  { text: "An iPhone or iPad with a passcode, on iOS or iPadOS 17 or newer (FilterTube needs 17)" },
  { text: "A computer (Mac, Windows, Linux or a recent Chromebook) and a cable that carries data, only for the first install. Some cheap charging cables only charge" },
  { text: "An Apple Account (Apple ID). A spare free one works fine" },
  { text: "Wi-Fi. Mobile data won't work for the setup" },
  { text: "About 15 minutes" },
];

export const iosSafetyPoints = [
  {
    title: "It uses Apple's own signing",
    body: "SideStore signs the app with your Apple ID, using Apple's free developer signing. Developers do the same thing when they run an app on their own phone.",
  },
  {
    title: "Nothing is jailbroken",
    body: "Your iPhone or iPad isn't modified. FilterTube runs in iOS's normal sandbox, like any App Store app.",
  },
  {
    title: "Skip paid signing services",
    body: "Avoid sites that sell \"signing\" with enterprise certificates. Apple revokes those often.",
  },
  {
    title: "Cautious? Use a spare Apple ID",
    body: "Any Apple ID works. You can make a separate free one just for this.",
  },
];

export const iosStuck = [
  {
    q: "iloader says \"No devices found\"",
    a: "The computer can't see your phone yet. Use a cable that carries data: many cheap charging cables only charge, so try an Apple cable or one you've used to sync a phone. Plug it straight into the computer, unlock the phone and tap Trust on \"Trust This Computer?\", then press Refresh in iloader. Wi-Fi alone can't do this first step; the phone has to meet the computer over a cable once.",
  },
  {
    q: "\"The operation couldn't be completed\" (kCFErrorDomainCFNetwork error -1001)",
    a: "The download timed out. FilterTube is a large download (around 100 MB), and SideStore gives up if it stalls. Try again on a fast Wi-Fi network with LocalDevVPN on. Still failing? Install from the file instead: download the .ipa from the latest release on GitHub (https://github.com/varshneydevansh/FilterTube/releases/latest) in Safari on the phone (keep the screen on), or on a computer and send it to the phone (AirDrop, Finder or iTunes file sharing, or a cloud drive). Then, with LocalDevVPN on, open SideStore > My Apps, tap + and choose the file. SideStore still refreshes it every week. iloader's Import IPA also installs the file from a computer, but then iloader, not SideStore, has to refresh it each week.",
  },
  {
    q: "SideStore can't connect, or install and refresh fail",
    a: "Open LocalDevVPN and make sure it's connected. SideStore needs it on every time you install, update or refresh.",
  },
  {
    q: "SideStore says the pairing file is invalid or missing",
    a: "The pairing file can expire after an iOS update, a reset, or sometimes for no clear reason. Connect the phone to the computer, open iloader, choose Manage Pairing File and tap Place next to SideStore.",
  },
  {
    q: "\"Untrusted Developer\", or the app won't open at all",
    a: "On the phone, open Settings > General > VPN & Device Management, tap your Apple ID under Developer App and tap Trust. Also check that Developer Mode is on in Settings > Privacy & Security.",
  },
  {
    q: "\"Maximum number of apps\"",
    a: "A free Apple ID allows only 3 sideloaded apps at once, and SideStore counts as one. It also allows 10 new App IDs per week; FilterTube uses one. Remove an app you don't need in SideStore, then try again.",
  },
  {
    q: "A provisioning error, like 0xe8008024",
    a: "Some free Apple IDs hit this. Sign in with a fresh free Apple ID instead. Creating one just for SideStore is fine.",
  },
  {
    q: "FilterTube won't open after a week",
    a: "Its 7-day signing ran out. Turn LocalDevVPN on, open SideStore, go to My Apps and tap the days counter next to FilterTube (or Refresh All). Your settings are kept.",
  },
  {
    q: "Setup stops partway",
    a: "Check that your phone and computer are on Wi-Fi (not mobile data), then run iloader again.",
  },
];

export const iosFaqs = [
  {
    q: "Will I lose my settings when the app refreshes?",
    a: "No. A refresh only renews the signature. Your rules, profiles and PINs stay on the device.",
  },
  {
    q: "Does it work on iPad?",
    a: "Yes. The same install works on iPhone and iPad. FilterTube itself needs iOS or iPadOS 17 or later.",
  },
  {
    q: "How do updates work?",
    a: "FilterTube's source lists every new version, so SideStore shows it in My Apps. Turn LocalDevVPN on and tap Update.",
  },
  {
    q: "Can I move to the App Store version later?",
    a: "Yes. Export a backup from FilterTube's settings, install the App Store version when it's live, then import the backup there.",
  },
];

// Plain-text copy of the five install steps rendered in app/ios/page.js (InstallGuide), for
// /ios.md. Keep the two in step when the guide changes.
export const iosInstallSteps = [
  { number: 1, where: "On your iPhone", title: "Install LocalDevVPN, then turn it on", body: "Get LocalDevVPN from the App Store (https://apps.apple.com/app/localdevvpn/id6755608044) and switch it on. Tap Allow if it asks to add a VPN configuration. It's a local VPN that lives on your phone; SideStore uses it to install and refresh apps, and your traffic doesn't go anywhere." },
  { number: 2, where: "On your computer", title: "Use iloader to put SideStore on your phone", body: "Plug your iPhone into the computer with a cable that carries data (some charging cables don't), unlock it and tap Trust on the phone. Download iloader (https://iloader.app/, for macOS, Windows, Linux and Chromebook), open it, sign in with your Apple ID, pick your iPhone, then choose Install SideStore. iloader also puts SideStore's pairing file on the phone. If iloader shows No devices found, see the quick fixes below." },
  { number: 3, where: "On your iPhone", title: "Trust it, then sign in to SideStore", body: "In Settings > General > VPN & Device Management, tap your Apple ID under Developer App and tap Trust. Then turn on Developer Mode in Settings > Privacy & Security; the phone restarts. With LocalDevVPN on, open SideStore and sign in with the same Apple ID you used in iloader." },
  { number: 4, where: "On your iPhone", title: "Tap \u201cAdd to SideStore\u201d, then install FilterTube", body: "Open filtertube.in/ios on your phone and tap Add to SideStore. SideStore adds the FilterTube source; open FilterTube there and tap Install. If the button doesn't work, open Sources in SideStore, tap + and paste https://filtertube.in/ios/source.json." },
  { number: 5, where: "Every week", title: "Keep it fresh", body: "On a free Apple ID, apps signed this way last 7 days. SideStore refreshes FilterTube right on your phone, in the background or when you tap the days counter in My Apps, as long as LocalDevVPN is on. Refresh at least once a week; you won't need the computer again. AltStore works too, but refreshing needs your computer running AltServer on the same Wi-Fi." },
];
