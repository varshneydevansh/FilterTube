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
    q: "SideStore closes (crashes) when you sign in",
    a: "Older iPhones and iPads run out of memory for one sign-in step. In SideStore, open Settings > User Customizations and turn off On-Device Anisette, then close SideStore (swipe it away), open it again and sign in.",
  },
  {
    q: "\"Failed to Sign In\" with \"503 Service Temporarily Unavailable\"",
    a: "Since 20 November 2026 Apple turns away SideStore's default sign-in details. Fix it once, in SideStore's Settings, in this order: (1) User Customizations: turn off On-Device Anisette. (2) Close SideStore and open it again. (3) Anisette Servers: choose SideStore (New), and turn off Enable Auto Rotation. (4) User Customizations: tap Reset adi.pb (keep the header overrides if it asks). (5) User Customizations > Anisette Client Configuration > Remote Server Sync: tap Fetch, then Save as Overrides. (6) Close SideStore, open it again and sign in. Do step 4 before step 5, or the reset undoes the fix.",
  },
  {
    q: "\"SideStore.OperationError error 28\" when you install",
    a: "SideStore isn't signed in to your Apple ID yet; signing in to iloader doesn't sign in SideStore. Open SideStore's Settings, sign in with the same Apple ID you used in iloader, then install FilterTube again.",
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

// Plain-text copy of the seven install steps rendered in app/ios/page.js (InstallGuide), for
// /ios.md. Keep the two in step when the guide changes.
export const iosInstallSteps = [
  { number: 1, where: "On your iPhone or iPad", title: "Get LocalDevVPN and turn it on", body: "Install LocalDevVPN from the App Store (https://apps.apple.com/app/localdevvpn/id6755608044, free). Open it and tap Connect. If it asks to add a VPN configuration, tap Allow. It stays on your phone and your internet doesn't go through anyone; SideStore needs it on whenever it installs or refreshes an app." },
  { number: 2, where: "On your computer", title: "Get iloader and sign in", body: "Download iloader (https://iloader.app/, for macOS, Windows, Linux and Chromebook). Open it and sign in with your Apple ID (your iCloud email and password)." },
  { number: 3, where: "Phone and computer", title: "Connect the phone and put SideStore on it", body: "Plug the phone into the computer with a cable. Unlock the phone; when it asks \"Trust This Computer?\", tap Trust and type your passcode. In iloader, click Refresh, then click your phone's name. Click SideStore (Stable) and wait until iloader says it's done. If iloader says \"No devices found\": the cable may only charge, so try another (an Apple cable or one you've used to sync a phone), plug it straight into the computer, unlock the phone, tap Trust and click Refresh. This first time needs a cable; Wi-Fi alone won't do." },
  { number: 4, where: "On your iPhone or iPad", title: "Allow SideStore to open", body: "Open Settings > General > VPN & Device Management, tap your email under Developer App, then tap Trust. Open Settings > Privacy & Security > Developer Mode and turn it on. Restart when the phone asks, then tap Turn On." },
  { number: 5, where: "In SideStore", title: "Set up SideStore, then sign in", body: "Since November 2026, Apple only accepts SideStore's sign-in after a short one-time setup. Open SideStore with LocalDevVPN on, tap Settings at the bottom right, then: (1) User Customizations: turn off On-Device Anisette. (2) Close SideStore (swipe it away) and open it again. (3) Anisette Servers: choose SideStore (New), and turn off Enable Auto Rotation. (4) User Customizations: tap Reset adi.pb; if it asks, keep the header overrides. (5) User Customizations > Anisette Client Configuration > Remote Server Sync: tap Fetch, then Save as Overrides. (6) Close SideStore again, open it, and sign in with the same Apple ID as in iloader. If SideStore closes when you sign in, On-Device Anisette is still on. If you see \"Failed to Sign In\" with \"503 Service Temporarily Unavailable\", go down the list again; Reset adi.pb has to come before Fetch." },
  { number: 6, where: "On your iPhone or iPad", title: "Install FilterTube", body: "Open filtertube.in/ios on the phone and tap Add to SideStore. In SideStore, open FilterTube (Direct) and tap Free (or Install). Keep the screen on and SideStore open until it finishes; it's about 100 MB. If the button doesn't work, open Sources in SideStore, tap + and paste https://filtertube.in/ios/source.json. \"SideStore.OperationError error 28\" means SideStore isn't signed in yet (finish step 5). If the download stops or shows error -1001, try once more on good Wi-Fi, or install from the file: download the .ipa from https://github.com/varshneydevansh/FilterTube/releases/latest, save it to Files, then in SideStore open My Apps, tap + and choose it." },
  { number: 7, where: "Once a week", title: "Refresh FilterTube", body: "Turn LocalDevVPN on, open SideStore, go to My Apps and tap the days counter next to FilterTube (or Refresh All). On a free Apple ID, apps installed this way last 7 days, so refresh at least once a week. You won't need the computer again, and your settings, profiles and PINs stay. AltStore works too, but refreshing needs your computer running AltServer on the same Wi-Fi." },
];
