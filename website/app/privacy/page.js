import Link from "next/link";

import { Panel } from "@/components/marketing-ui";

export const metadata = {
  title: "Privacy policy",
  description:
    "FilterTube privacy policy for the browser extension, the Android phone, tablet and TV app, the iPhone and iPad app, the website, and optional Nanah sync.",
};

const summaryCards = [
  {
    label: "Accounts",
    value: "No FilterTube sign-up",
    detail:
      "There is no FilterTube account. Your rules, profiles, PINs and history stay on your device.",
  },
  {
    label: "Servers",
    value: "No FilterTube server keeps your data",
    detail:
      "We run no server that stores your settings or what you watch. Nanah's relay only helps your devices find each other.",
  },
  {
    label: "Extra services",
    value: "Off until you turn them on, except one",
    detail:
      "SponsorBlock, DeArrow, Return YouTube Dislike and LRCLIB are optional and off by default. The PipePipe decoder is on by default so videos start smoothly; you can turn it off in Settings → Integrations.",
  },
  {
    label: "Website analytics",
    value: "Website only",
    detail:
      "Vercel Web Analytics runs on filtertube.in. It is not in the extension or the apps.",
  },
];

const products = [
  {
    title: "Browser extension",
    body:
      "Chrome, Edge, Firefox, Opera and other supported browsers. Stores your rules, profiles, PIN checks, Study and Self-Control sessions, counters and settings in the browser's own storage on your computer.",
  },
  {
    title: "Android phone, tablet and TV",
    body:
      "From Google Play or as a direct build from GitHub (Android TV and Fire TV use the same app). Stores rules, profiles, PIN checks, your in-app watch and search history, playlists, notes, Study plans and settings in the app's private storage.",
  },
  {
    title: "iPhone and iPad",
    body:
      "A direct build installed with SideStore or AltStore. Stores the same kinds of data as Android in the app's private storage. It also includes a Safari extension, a Share extension and widgets, which read the same local settings.",
  },
  {
    title: "Website",
    body:
      "filtertube.in explains the product and links to downloads. It stores nothing about you beyond what is described in the website section below.",
  },
];

const playback = [
  {
    title: "Where videos come from",
    detail:
      "The Android and iOS apps have their own player. The app requests videos, thumbnails, comments and other metadata directly from the video service, from your device. No FilterTube server sits in between.",
  },
  {
    title: "What the video service sees",
    detail:
      "Like any app or browser, the video service receives your IP address, the videos you request and normal device details. If you sign in to your Google account, those requests are tied to that account under Google's policies.",
  },
  {
    title: "Signing in",
    detail:
      "Signing in is optional. It happens on Google's own sign-in page inside the app. FilterTube never asks for or stores your Google password; the signed-in session stays on your device.",
  },
  {
    title: "Filtering",
    detail:
      "Your rules are checked on your device before anything is shown. Hidden items are never sent anywhere.",
  },
];

const optionalServices = [
  {
    title: "SponsorBlock (sponsor.ajay.app)",
    detail:
      "Apps only. Off by default. Skips sponsor segments. Receives the first few characters of a hash of the video ID, the categories you chose, and your IP address.",
  },
  {
    title: "DeArrow (dearrow.ajay.app and dearrow-thumb.ajay.app)",
    detail:
      "Apps only. Titles and thumbnails are separate switches, both off by default. Titles send a hash prefix of the video ID; thumbnails send the full video ID and a time in the video. Both receive your IP address.",
  },
  {
    title: "Return YouTube Dislike (returnyoutubedislikeapi.com)",
    detail:
      "Apps only. Off by default. Shows dislike counts. Receives the full video ID and your IP address.",
  },
  {
    title: "LRCLIB (lrclib.net)",
    detail:
      "Apps only, in Sangeet. Off until you agree to it in the lyrics reader. Receives the song title, artist name, song length and your IP address.",
  },
  {
    title: "PipePipe decoder (api.pipepipe.dev)",
    detail:
      "Apps only. On by default; you can turn it off in Settings → Integrations. Helps the player start videos smoothly and play higher-quality streams. Receives the player version and short scrambled stream codes, plus your IP address. It never receives the video ID, stream addresses, your account, tokens or cookies. It is also used in Kids profiles, where it follows the parent profile's setting and receives the same data, without video IDs.",
  },
];

const syncDetails = [
  {
    title: "Nanah relay (nanah-signaling.varshney-devansh614.workers.dev)",
    detail:
      "A meeting place on Cloudflare Workers. It sees a pairing code, your IP address and sealed connection messages while two devices find each other. It does not store your settings.",
  },
  {
    title: "Google STUN (stun.l.google.com)",
    detail:
      "Used during pairing to find a direct route between your devices. It sees your IP address and port only, never your settings.",
  },
  {
    title: "End-to-end encrypted",
    detail:
      "Everything sent between your devices is encrypted on the sending device and opened on the receiving one. The relay and STUN server cannot read it.",
  },
  {
    title: "Nearby on the same Wi-Fi",
    detail:
      "The apps can also pair and send rules, playlists and notes over your local network without the internet. Nothing is trusted until you match the safety phrase on both screens.",
  },
  {
    title: "Internet Pickup (optional)",
    detail:
      "Parents can set up a pickup address on a server they run themselves. Updates wait there encrypted until the child's device collects them. FilterTube does not provide or see this server.",
  },
  {
    title: "User-started only",
    detail:
      "Sync never runs as a hidden online backup. Pairing codes, safety phrases and sync links are private; don't share them with people you don't trust.",
  },
];

const familyDetails = [
  "Profiles, parent and child types, and PINs live only on the device. PINs are stored as a protected check, not as plain text.",
  "Ask a parent: when a child asks to watch something or for more time, the request is saved on the device. If the parent uses another device, the request travels over Nanah, end-to-end encrypted.",
  "Answers, time limits, Study plans and Self-Control sessions are kept on the devices involved. Nothing reaches FilterTube.",
  "Notifications about asks are private on the lock screen and show no names or video titles.",
];

const devicePermissions = [
  {
    title: "Camera (iOS)",
    detail:
      "Used only to scan a Nanah pairing QR code. Frames are read on the device and never saved or sent.",
  },
  {
    title: "Microphone and speech (iOS)",
    detail:
      "Used only when you tap Voice input in Search, to turn your words into search text you can check before searching. Recognition runs on the device when your iPhone or iPad supports it; otherwise Apple's speech service processes the audio under Apple's policy.",
  },
  {
    title: "Local network (Android and iOS)",
    detail:
      "Finds your other FilterTube devices on the same Wi-Fi for Nearby pairing and transfers.",
  },
  {
    title: "Photos, videos and music",
    detail:
      "Lets you add your own device files to the separate local library. Files stay where they are; the app only keeps a reference. Google Play builds use the system photo picker for videos.",
  },
  {
    title: "Notifications",
    detail:
      "Playback controls, Ask a parent answers, Offline Media reminders and Study timers. Shown on the device only.",
  },
  {
    title: "Browser camera (extension)",
    detail:
      "The extension can scan a pairing QR code with your webcam. The browser asks first, and frames stay on the computer.",
  },
];

const browserPermissions = [
  {
    title: "storage",
    detail: "Saves your rules, profiles and settings in the browser on your computer.",
  },
  {
    title: "unlimitedStorage",
    detail:
      "Large rule sets, channel lists and Study packs can pass the browser's default size limit. It is still local storage.",
  },
  {
    title: "alarms",
    detail:
      "Ends Self-Control and Study sessions on time, even if the browser put the extension to sleep.",
  },
  {
    title: "activeTab",
    detail: "Lets the popup act on the video tab you are looking at when you open it.",
  },
  {
    title: "scripting",
    detail:
      "Loads FilterTube's own filtering scripts into a supported video tab when that page needs them.",
  },
  {
    title: "tabs",
    detail:
      "Notices when a supported tab changes page so filtering keeps up, and opens the dashboard and help pages.",
  },
  {
    title: "downloads",
    detail: "Saves backup and export files that you ask for to your computer.",
  },
  {
    title: "Site access",
    detail:
      "YouTube, YouTube Music, YouTube Kids and youtube-nocookie.com embeds, plus Google Search results pages, where the guard hides video results that match your rules.",
  },
  {
    title: "Optional site access",
    detail:
      "Asked for only if you set up Internet Pickup, and only for the one address you enter. You can say no; everything else keeps working.",
  },
];

const otherServices = [
  {
    title: "Update check (direct builds)",
    detail:
      "Direct Android and iOS builds ask api.github.com about once a day whether a newer release exists. GitHub sees your IP address and nothing else about you, and nothing downloads by itself. The first time, the app tells you and offers to turn it off. Google Play builds update through Play instead.",
  },
  {
    title: "Rule lists from a web address",
    detail:
      "If you add a shared rule list by its address, the app or extension downloads it from that site, which sees your IP address. Nothing is uploaded.",
  },
  {
    title: "Community links",
    detail:
      "Discord, Reddit, Instagram, GitHub and similar buttons are plain links. Nothing is loaded from those sites until you tap one, and then they open in your browser.",
  },
  {
    title: "Your phone's own backup",
    detail:
      "If Android backup or iCloud Backup is on, the system may include FilterTube's settings in your device backup with Google or Apple. On Android, pairing keys, sync identity and offline keys are left out.",
  },
  {
    title: "Stores",
    detail:
      "Google Play, browser add-on stores, SideStore and AltStore handle installs, reviews and crash reports under their own policies.",
  },
  {
    title: "Support messages",
    detail:
      "If you email us or open a GitHub issue, we receive what you choose to include so we can reply.",
  },
];

const userControls = [
  "See, edit or delete any rule, profile or history entry inside FilterTube.",
  "Turn every optional service on or off per profile in Settings.",
  "Turn off the update check in direct builds.",
  "Unpair devices or reset sync at any time.",
  "Delete backup and export files wherever you saved them.",
  "Uninstall the app or extension to remove everything it stored on that device.",
  "Ask us to delete support emails or issue content where we can.",
];

const faq = [
  {
    question: "Is there a FilterTube account?",
    answer:
      "No. There is no FilterTube sign-up, and nothing about you is stored in a FilterTube account or dashboard.",
  },
  {
    question: "Does FilterTube see what I watch or search?",
    answer:
      "No. Your history stays on your device. The video service sees your requests, as it would in any app. If you turn on an optional service, that service sees the details listed for it above.",
  },
  {
    question: "Can the extension read every website I visit?",
    answer:
      "No. It runs on YouTube, YouTube Music, YouTube Kids, youtube-nocookie.com embeds and Google Search results pages. It asks for one more address only if you set up Internet Pickup.",
  },
  {
    question: "Is Nanah an online backup?",
    answer:
      "No. It moves settings straight between your devices, end-to-end encrypted. The relay only helps them meet.",
  },
  {
    question: "Are there ads or trackers in the apps or extension?",
    answer:
      "No. There are no ad SDKs, analytics SDKs or tracking identifiers in the apps or the extension.",
  },
  {
    question: "Is FilterTube affiliated with Google or YouTube?",
    answer:
      "No. FilterTube is independent and not endorsed by, sponsored by or affiliated with Google or YouTube.",
  },
];

const changeLog = [
  {
    title: "22 November 2026",
    detail:
      "The website section now says that we count AI crawler visits by bot name, page and day only.",
  },
  {
    title: "19 November 2026",
    detail:
      "Rewritten to match the current apps and extension: the native player, Offline Media, the supporter subscription, Ask a parent, iOS camera, microphone, speech and local-network use, every optional service and what it receives (the PipePipe decoder is on by default, including in Kids profiles), the update check, Internet Pickup, all extension permissions including Google Search, and a clearer children's section.",
  },
  {
    title: "4 May 2026",
    detail:
      "One policy for the extension, Android, iPhone and iPad, TV, the website and Nanah sync.",
  },
];

const policyNav = [
  ["Products and local data", "#products"],
  ["Playback in the apps", "#playback"],
  ["Offline Media", "#offline-media"],
  ["Optional services", "#optional-services"],
  ["Sync and Nearby", "#sync"],
  ["Ask a parent, profiles, PINs", "#family"],
  ["Device permissions", "#device-permissions"],
  ["Extension permissions", "#browser-permissions"],
  ["Supporting FilterTube", "#support"],
  ["Other connections", "#other-services"],
  ["Children", "#children"],
  ["Contact", "#contact"],
];

function PolicyLink({ href, children }) {
  return (
    <Link
      className="text-[var(--color-accent)] underline decoration-[color:var(--color-line)] underline-offset-4 transition duration-300 hover:decoration-[var(--color-accent)]"
      href={href}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      target={href.startsWith("http") ? "_blank" : undefined}
    >
      {children}
    </Link>
  );
}

function BulletList({ items }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li className="flex gap-3" key={item}>
          <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CardGrid({ items, columns = "md:grid-cols-2" }) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {items.map((item) => (
        <div
          className="ft-tile min-w-0 rounded-[1.45rem] border border-[color:var(--color-line)] p-5"
          key={item.title ?? item.label ?? item.question}
        >
          <h3 className="break-words font-medium text-[var(--color-ink)]">
            {item.title ?? item.label ?? item.question}
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            {item.body ?? item.detail ?? item.value ?? item.answer}
          </p>
        </div>
      ))}
    </div>
  );
}

function PolicySection({ id, title, children }) {
  return (
    <section
      className="scroll-mt-28 border-t border-[color:var(--color-line)] pt-8 first:border-t-0 first:pt-0"
      id={id}
    >
      <h2 className="font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)] md:text-4xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-base leading-8 text-[var(--color-muted)]">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <section className="px-4 pb-8 pt-28 md:px-6 md:pb-12 md:pt-36">
      <div className="mx-auto max-w-[1180px]">
        <Panel innerClassName="space-y-8 p-7 md:p-10">
          <div>
            <h1 className="max-w-[18ch] font-display text-5xl font-semibold tracking-[-0.07em] text-[var(--color-ink)] md:text-7xl md:leading-[0.95]">
              Privacy policy
            </h1>
            <p className="mt-6 max-w-[72ch] text-base leading-8 text-[var(--color-muted)] md:text-lg">
              Last updated: 22 November 2026. This policy covers the FilterTube
              browser extension, the Android app for phone, tablet and TV, the
              iPhone and iPad app, the website, and optional Nanah sync.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="inline-flex min-h-11 items-center rounded-[0.95rem] bg-[var(--color-ink)] px-5 py-3 text-sm font-medium text-[var(--color-cream)] transition duration-300 hover:-translate-y-0.5 active:translate-y-px"
                href="#full-policy"
              >
                Read the full policy
              </a>
              <a
                className="inline-flex min-h-11 items-center rounded-[0.95rem] border border-[color:var(--color-line)] bg-[color:var(--color-glass)] px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition duration-300 hover:-translate-y-0.5 active:translate-y-px"
                href="#optional-services"
              >
                Optional services
              </a>
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-[color:var(--color-line)] bg-[color:var(--color-glass)] p-5 md:p-6">
            <p className="max-w-[76ch] text-lg leading-8 text-[var(--color-ink)]">
              FilterTube is a tool that runs on your device. There is no
              FilterTube sign-up, and no FilterTube server keeps your data. Your
              rules, profiles, PINs and history stay on your device. The apps
              talk directly to the video service, and to a few other services
              only when you turn them on. Each one is named below with exactly
              what it receives.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                className="ft-tile rounded-[1.35rem] border border-[color:var(--color-line)] p-5"
                key={card.label}
              >
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {card.label}
                </p>
                <p className="mt-3 font-medium text-[var(--color-ink)]">
                  {card.value}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {card.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.45rem] border border-[color:var(--color-line)] bg-[color:var(--color-glass)] p-5 md:p-6">
            <p className="max-w-[72ch] text-sm leading-7 text-[var(--color-muted)]">
              The summary above is not the whole policy.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {policyNav.map(([label, href]) => (
                <a
                  className="rounded-[1rem] border border-[color:var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition duration-300 hover:-translate-y-0.5 hover:border-[color:var(--color-accent)] active:translate-y-px"
                  href={href}
                  key={href}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </Panel>

        <div className="mt-10">
          <Panel innerClassName="space-y-10 p-7 md:p-10">
            <div className="scroll-mt-28" id="full-policy" />
            <PolicySection id="introduction" title="1. Who we are">
              <p>
                FilterTube (&quot;we&quot;) is a free, independent tool that
                helps parents and adults hide unwanted videos, channels and
                topics using rules they control. It is made by one developer
                in India.
              </p>
              <p>
                We do not collect personal data. We have no FilterTube
                accounts, no ad or analytics code in the apps or extension, and
                no server that stores your settings or viewing.
              </p>
            </PolicySection>

            <PolicySection id="products" title="2. Each product and what it stores">
              <p>
                Everything below is stored on your device only. FilterTube
                cannot see it.
              </p>
              <CardGrid items={products} />
            </PolicySection>

            <PolicySection id="playback" title="3. Playback in the apps">
              <CardGrid items={playback} />
            </PolicySection>

            <PolicySection id="offline-media" title="4. Offline Media">
              <p>
                <span className="font-medium text-[var(--color-ink)]">
                  Saved videos (direct builds only).
                </span>{" "}
                The direct Android and iOS builds can save videos and music for
                offline viewing. Copies stay in the app's private storage, protected
                by the device's own encryption; on Android they are also encrypted
                with a key that never leaves that device. Each copy expires 30 days after it was saved or
                last checked. While you are online, the app checks with the
                video service that the video is still available and still
                allowed by your rules, and removes it if not. Google Play
                builds cannot save videos.
              </p>
              <p>
                <span className="font-medium text-[var(--color-ink)]">
                  Your own files (all builds).
                </span>{" "}
                You can add videos and music already on your device to a
                separate local library. They are never uploaded. Direct builds
                can also send these files to your own nearby device over
                Wi-Fi, encrypted.
              </p>
            </PolicySection>

            <PolicySection id="optional-services" title="5. Optional services">
              <p>
                These community services add features to the apps. Each one is
                set per profile and can be turned off at any time. All are off
                by default except the PipePipe decoder, which is on by default
                because it receives no video ID and videos can be slow to start
                without it. When one is on, your device contacts it directly; we
                never see the request. Each service handles what it receives
                under its own policy.
              </p>
              <CardGrid items={optionalServices} />
              <p>
                Nothing is sent to any of these services while it is off.
                SponsorBlock, DeArrow, Return YouTube Dislike and LRCLIB never
                run in child profiles, because they receive video IDs or song
                details. The PipePipe decoder follows the parent profile&apos;s
                setting in child profiles.
              </p>
            </PolicySection>

            <PolicySection id="sync" title="6. Nanah sync and Nearby">
              <p>
                Nanah moves settings between devices you trust, without a
                FilterTube account. It is optional and only runs when you pair
                devices. Nanah&apos;s code is public at{" "}
                <PolicyLink href="https://github.com/varshneydevansh/nanah">
                  github.com/varshneydevansh/nanah
                </PolicyLink>
                .
              </p>
              <CardGrid columns="md:grid-cols-2 lg:grid-cols-3" items={syncDetails} />
            </PolicySection>

            <PolicySection id="family" title="7. Ask a parent, profiles and PINs">
              <BulletList items={familyDetails} />
            </PolicySection>

            <PolicySection id="device-permissions" title="8. Device permissions">
              <p>
                The apps ask for a permission only when you use the feature
                that needs it. Saying no turns off just that feature.
              </p>
              <CardGrid columns="md:grid-cols-2 lg:grid-cols-3" items={devicePermissions} />
            </PolicySection>

            <PolicySection id="browser-permissions" title="9. Browser extension permissions">
              <p>
                Every permission the extension asks for, and why. All
                filtering happens inside your browser.
              </p>
              <CardGrid columns="md:grid-cols-2 lg:grid-cols-3" items={browserPermissions} />
            </PolicySection>

            <PolicySection id="support" title="10. Supporting FilterTube">
              <p>
                Every feature is free. Supporting is optional and changes no
                feature.
              </p>
              <p>
                <span className="font-medium text-[var(--color-ink)]">
                  Google Play builds.
                </span>{" "}
                The optional supporter subscription uses Google Play Billing.
                Google handles your payment details, purchase history and
                renewals under its own privacy policy. The app only learns
                from Google whether a subscription is active, and keeps that
                on the device. We never receive your name, email or payment
                details.
              </p>
              <p>
                <span className="font-medium text-[var(--color-ink)]">
                  Direct builds.
                </span>{" "}
                Support goes through Ko-fi. On iPhone and iPad it is a link
                that opens in your browser. On Android, opening Support loads
                Ko-fi&apos;s support panel from ko-fi.com, and checkout opens
                in your browser. Ko-fi handles any payment under its own
                policy.
              </p>
            </PolicySection>

            <PolicySection id="other-services" title="11. Other connections">
              <CardGrid columns="md:grid-cols-2 lg:grid-cols-3" items={otherServices} />
            </PolicySection>

            <PolicySection id="website" title="12. The website">
              <p>
                filtertube.in is hosted on Vercel and uses Vercel Web
                Analytics for counts of page views. It does not use Google
                Analytics, ad pixels, session replay or cross-site tracking.
                Vercel keeps normal server logs as part of hosting.
              </p>
              <p>
                We count visits from AI crawlers, such as GPTBot, ClaudeBot and
                PerplexityBot, by bot name, page and day only. That count keeps
                no IP address, no cookies and nothing about people visiting the
                site.
              </p>
            </PolicySection>

            <PolicySection id="children" title="13. Children">
              <p>
                FilterTube is a tool for parents and adults to set up. Children
                can use profiles that a parent creates, but FilterTube collects
                no personal data from children or anyone else. There are no
                FilterTube accounts, no ads, no profiling and no tracking.
                Child profiles are settings stored on the device.
              </p>
              <p>
                When a child watches in the app, the video service receives
                those requests as described in section 3. SponsorBlock, DeArrow,
                Return YouTube Dislike and LRCLIB never run in child profiles.
                The PipePipe decoder follows the parent profile&apos;s setting;
                it receives only the player version and scrambled stream codes,
                never a video ID, account or cookies.
              </p>
              <p>
                We built FilterTube with the aims of the US COPPA rule, the UK
                Age Appropriate Design Code and India&apos;s Digital Personal
                Data Protection Act in mind: collect nothing, keep every service
                that receives video IDs off by default, and leave the parent in
                charge. We have not had
                this reviewed by a regulator. Parents with questions or
                concerns can write to the contact below.
              </p>
            </PolicySection>

            <PolicySection id="security" title="14. Keeping and protecting data">
              <p>
                Data stays on your device for as long as you keep it there,
                and is removed when you delete it or uninstall. Backups you
                export can be password-protected. Sync and Nearby transfers are
                end-to-end encrypted. Saved offline videos expire after 30
                days.
              </p>
              <p>
                No system is perfectly secure. Keep your devices updated, use a
                profile PIN, and keep backup files and pairing codes private.
              </p>
            </PolicySection>

            <PolicySection id="controls" title="15. Your controls">
              <BulletList items={userControls} />
            </PolicySection>

            <PolicySection id="faq" title="16. Direct answers">
              <CardGrid items={faq} />
            </PolicySection>

            <PolicySection id="source" title="17. Source code">
              <p>
                The browser extension&apos;s source code is available under the
                MIT licence at{" "}
                <PolicyLink href="https://github.com/varshneydevansh/FilterTube">
                  github.com/varshneydevansh/FilterTube
                </PolicyLink>
                .
              </p>
            </PolicySection>

            <PolicySection id="contact" title="18. Contact and grievances">
              <p>
                For privacy questions, requests or complaints, including
                grievances under India&apos;s DPDP Act, email{" "}
                <a
                  className="text-[var(--color-accent)] underline decoration-[color:var(--color-line)] underline-offset-4 transition duration-300 hover:decoration-[var(--color-accent)]"
                  href="mailto:hello@filtertube.in"
                >
                  hello@filtertube.in
                </a>
                . We aim to reply within 30 days. You can also open an issue in
                the{" "}
                <PolicyLink href="https://github.com/varshneydevansh/FilterTube">
                  public GitHub repository
                </PolicyLink>
                , but please don&apos;t post private details there.
              </p>
              <p>
                FilterTube is independent and not affiliated with Google or
                YouTube. This page describes how FilterTube works; it is not
                legal advice.
              </p>
            </PolicySection>

            <PolicySection id="changes" title="19. Changes">
              <p>
                If FilterTube starts handling data differently, we update this
                page first and note it here.
              </p>
              <CardGrid items={changeLog} />
            </PolicySection>
          </Panel>
        </div>
      </div>
    </section>
  );
}
