import Link from "next/link";

import { Panel } from "@/components/marketing-ui";

export const metadata = {
  title: "Privacy policy",
  description:
    "Unified FilterTube privacy policy for the browser extension, Android app, iOS and iPad app, TV app path, website, and optional Nanah peer-to-peer settings sync.",
};

const summaryCards = [
  {
    label: "Core product model",
    value: "A local tool, not an account service",
    detail:
      "Your rules and profiles live in the app or extension on your device. FilterTube has no account area where we receive or view your YouTube activity.",
  },
  {
    label: "Rules and history",
    value: "Not uploaded to FilterTube",
    detail:
      "Your blocklists, whitelists, keywords, PIN state, watch history, and search history are not uploaded into a FilterTube account or dashboard.",
  },
  {
    label: "Nanah sync",
    value: "Open-source P2P",
    detail:
      "Your devices meet at a known place on the internet so they can find each other, then transfer settings between themselves.",
  },
  {
    label: "Website analytics",
    value: "Website only",
    detail:
      "Vercel Web Analytics is used only on filtertube.in. It is not included in the browser extension or native apps.",
  },
];

const platformCoverage = [
  {
    title: "Browser extension",
    body:
      "Chrome/Chromium and other supported browser builds apply your rules on supported YouTube surfaces. Extension settings stay in browser storage unless you export or sync them.",
  },
  {
    title: "Android phone and tablet app",
    body:
      "The Android app provides native FilterTube controls, profiles, PIN protection, YouTube Main viewing, public YouTube Kids WebView access, local settings, and Nanah sync controls.",
  },
  {
    title: "iOS and iPad app",
    body:
      "The iOS/iPad app is covered by this same policy for App Store release. It follows the same local-first rule model using Apple web views and native controls.",
  },
  {
    title: "TV and Fire TV app path",
    body:
      "TV is not an unrelated privacy product. It may ship as a separate package and store listing because TV UX and remote-control behavior are different, but the intended privacy model remains local-first.",
  },
  {
    title: "Public website",
    body:
      "filtertube.in explains the product, hosts policy pages, and links to downloads and documentation. Website analytics are limited to this website.",
  },
  {
    title: "Nanah protocol",
    body:
      "Nanah is open-source peer-to-peer sync. Its signaling endpoint is only a meeting place, not a FilterTube account, settings vault, device inventory, or analytics service.",
  },
];

const noProductCollection = [
  "Your YouTube or Google password, login token, private account credential, or payment details",
  "Your complete YouTube watch history or search history",
  "Your general browsing history outside supported FilterTube surfaces",
  "Your FilterTube blocklist, whitelist, keywords, profile settings, PIN state, Kids/Main viewing choice, theme, or route controls as something we can view online",
  "Contacts, photos, camera stream, microphone recordings, precise location, or phone contacts",
  "Advertising identifiers, ad-targeting profiles, data broker profiles, or cross-site tracking identifiers",
  "Children's personal information for a FilterTube account, advertising profile, or recommendation model",
];

const localData = [
  "Blocked channels, allowed channels, keywords, whitelist entries, blocklist entries, Shorts rules, comments controls, route rules, and watch-page controls",
  "Profiles, profile type, PIN protection state, selected viewing space, Kids/Main preferences, theme preference, and native control preferences",
  "Local counters or status information used to show what FilterTube filtered or which profile is active",
  "Optional backup, export, and import files that you create and manage yourself",
  "Optional Nanah pairing state when you choose a trusted sync flow",
];

const infrastructure = [
  {
    title: "No FilterTube account area",
    detail:
      "There is no FilterTube account page where your app or extension rules, profiles, watch history, search history, PINs, or YouTube account details are uploaded for us to view.",
  },
  {
    title: "Website hosting",
    detail:
      "filtertube.in is hosted on Vercel. The website has aggregate Vercel Web Analytics enabled for website traffic only.",
  },
  {
    title: "Nanah signaling",
    detail:
      "Nanah currently uses a public signaling endpoint so paired devices can find each other. The endpoint is a meeting place, not where your settings live.",
  },
  {
    title: "Platform stores",
    detail:
      "Google Play, Apple App Store, browser stores, and TV app stores may process installs, reviews, integrity checks, crash diagnostics, and account information under their own policies.",
  },
  {
    title: "Google/YouTube services",
    detail:
      "YouTube Main, YouTube Music, and YouTube Kids remain Google services. FilterTube controls its shell and local filtering rules; Google controls the underlying web service.",
  },
  {
    title: "Support contact",
    detail:
      "If you email us or open a GitHub issue, we receive whatever you choose to include in that message so we can respond.",
  },
];

const oldPolicyAnswers = [
  {
    title: "Data collection",
    detail:
      "FilterTube's app and extension filtering features do not collect your personal viewing data into a FilterTube account because filtering does not require one.",
  },
  {
    title: "Data usage",
    detail:
      "Rules and settings are used locally to hide or block matching YouTube content according to your choices.",
  },
  {
    title: "Data sharing",
    detail:
      "There is no FilterTube account copy of your rules or viewing history to provide to advertisers, analytics tools, or data brokers.",
  },
  {
    title: "No data broker path",
    detail:
      "There is no FilterTube-held copy of your rules, profiles, watch history, or search history for advertising or broker use.",
  },
];

const browserPermissions = [
  {
    title: "Storage",
    detail:
      "Saves your rules, profiles, and UI settings locally in browser storage.",
  },
  {
    title: "Active tab",
    detail:
      "Lets FilterTube respond when you interact with the current supported YouTube tab.",
  },
  {
    title: "Scripting",
    detail:
      "Lets FilterTube run local filtering scripts on supported YouTube pages so matching elements can be hidden according to your settings.",
  },
  {
    title: "Tabs",
    detail:
      "Lets FilterTube respond to navigation changes on supported tabs and keep filtering behavior in sync as YouTube changes routes.",
  },
  {
    title: "Downloads",
    detail:
      "Supports user-started local backup/export files. Those files are created on your device.",
  },
  {
    title: "Host permissions",
    detail:
      "Scopes filtering to supported YouTube surfaces, including youtube.com, youtube-nocookie.com, music.youtube.com, and youtubekids.com where supported.",
  },
];

const appAccess = [
  {
    title: "Managed web views",
    detail:
      "Android and iOS/iPad load YouTube Main and public YouTube Kids surfaces in platform web views. Those pages are still Google/YouTube web services.",
  },
  {
    title: "Native controls",
    detail:
      "FilterTube adds native controls for profiles, PIN, theme, sync, route rules, and filtering. Those controls store settings locally.",
  },
  {
    title: "Background or mini-player behavior",
    detail:
      "Any retained playback shell is an app experience around the web surface. It does not create a FilterTube copy of your media history.",
  },
  {
    title: "Crash and store systems",
    detail:
      "App stores and operating systems may provide their own install, crash, review, integrity, and diagnostic systems under their policies.",
  },
];

const nanahDetails = [
  {
    title: "Open-source P2P protocol",
    detail:
      "Nanah is open source at github.com/varshneydevansh/nanah. Its purpose is trusted settings transfer between your devices or profiles.",
  },
  {
    title: "Known meeting place",
    detail:
      "The signaling endpoint is like a known place in the vast internet where your devices can find each other to start talking.",
  },
  {
    title: "No retained sync payload",
    detail:
      "FilterTube does not retain the settings payload being transferred through Nanah.",
  },
  {
    title: "No device-count analytics",
    detail:
      "FilterTube does not use Nanah signaling to track how many devices are syncing or to build a device inventory.",
  },
  {
    title: "User-started only",
    detail:
      "Sync starts when you pair devices or profiles. It does not run as a hidden online backup.",
  },
  {
    title: "Pairing safety",
    detail:
      "Pairing codes, safety phrases, and sync links should be treated as private. Do not share them with untrusted people.",
  },
];

const dataMovement = [
  {
    title: "You open YouTube, YouTube Music, or YouTube Kids",
    detail:
      "Network activity for those services is between your device/web view/browser and Google/YouTube. Their policies apply to their account, video, ad, cookie, and recommendation systems.",
  },
  {
    title: "You export or back up settings",
    detail:
      "A backup/export file exists because you created it. It remains wherever you save, move, or share it.",
  },
  {
    title: "You start Nanah sync",
    detail:
      "Trusted devices meet through the signaling point and transfer settings between themselves. The signaling point is not a FilterTube settings vault.",
  },
  {
    title: "You visit filtertube.in",
    detail:
      "The website is hosted on Vercel and uses Vercel Web Analytics for website page views only.",
  },
  {
    title: "You install through a store",
    detail:
      "The relevant store may process install, account, integrity, review, crash, and device information under its own policy.",
  },
  {
    title: "You contact support",
    detail:
      "Emails, GitHub issues, screenshots, or logs contain whatever information you choose to send.",
  },
];

const userControls = [
  "Inspect, add, edit, or delete rules inside the FilterTube interface.",
  "Delete or reset profiles and local rules from the app or extension.",
  "Disable sync by not pairing devices or by resetting local sync state.",
  "Delete backup/export files from wherever you saved them.",
  "Clear extension/app storage or uninstall FilterTube to remove locally stored FilterTube data from that installation.",
  "Ask us to delete support emails or GitHub issue content where technically possible.",
];

const faq = [
  {
    question: "Is there a FilterTube account where my settings are uploaded?",
    answer:
      "No. Your rules, profiles, PINs, watch history, and search history are not uploaded into a FilterTube account or dashboard.",
  },
  {
    question: "Does FilterTube collect my YouTube watch history?",
    answer:
      "No. FilterTube applies rules locally to supported YouTube surfaces. It does not upload a copy of your watch history to FilterTube.",
  },
  {
    question: "Does FilterTube collect my search queries?",
    answer:
      "No. Search terms are handled by YouTube/Google on their service. FilterTube does not create a FilterTube search-history account or analytics profile.",
  },
  {
    question: "Where are my blocklists, keywords, and profiles stored?",
    answer:
      "They are stored locally in the app or extension installation, unless you explicitly export them or start a Nanah sync.",
  },
  {
    question: "Can FilterTube read all websites I visit?",
    answer:
      "No. FilterTube is scoped to supported YouTube-related surfaces needed for filtering, such as youtube.com, music.youtube.com, youtube-nocookie.com, and youtubekids.com where supported.",
  },
  {
    question: "Does FilterTube track how many videos it blocks?",
    answer:
      "Any filter counters are local status information for the current installation. They are not uploaded into a FilterTube online analytics account.",
  },
  {
    question: "Does Vercel Analytics run inside the extension or apps?",
    answer:
      "No. Vercel Analytics is only used on filtertube.in, the public website.",
  },
  {
    question: "Does the website use ad trackers?",
    answer:
      "No. The website does not use Google Analytics, ad pixels, session replay, or cross-site ad targeting. It uses aggregate Vercel Web Analytics only for filtertube.in page views.",
  },
  {
    question: "Is Nanah an online backup?",
    answer:
      "No. Nanah is peer-to-peer settings transfer. The signaling point helps devices meet; it is not where your settings are stored.",
  },
  {
    question: "Can Nanah tell FilterTube how many devices are syncing?",
    answer:
      "No. FilterTube does not use Nanah as a device inventory or device-count analytics system.",
  },
  {
    question: "Can FilterTube see my Google password?",
    answer:
      "No. YouTube/Google login is handled by Google inside the browser or platform web view. FilterTube does not ask for or store your Google password.",
  },
  {
    question: "Does FilterTube control YouTube's own data collection?",
    answer:
      "No. YouTube Main, YouTube Music, and YouTube Kids remain Google services. Their account, playback, ads, cookies, and recommendations are governed by Google's policies.",
  },
  {
    question: "What happens if I uninstall FilterTube?",
    answer:
      "Removing the extension or app removes the local FilterTube data stored in that installation. Backup/export files you created remain wherever you saved them until you delete them.",
  },
  {
    question: "Can I use FilterTube without Nanah sync?",
    answer:
      "Yes. Nanah sync is optional. Filtering works without pairing devices.",
  },
  {
    question: "Is FilterTube affiliated with YouTube or Google?",
    answer:
      "No. FilterTube is independent and not endorsed by, sponsored by, or affiliated with Google, YouTube, YouTube Music, or YouTube Kids.",
  },
];

const storeSummary = [
  {
    label: "Data collection by app/extension",
    value:
      "No FilterTube account copy of core filtering rules, profiles, PINs, watch history, or search history.",
  },
  {
    label: "Data sharing by app/extension",
    value:
      "No advertising sharing path for app/extension rules or histories, because FilterTube does not receive an account copy of them.",
  },
  {
    label: "Website analytics",
    value: "Only filtertube.in uses aggregate Vercel Web Analytics.",
  },
  {
    label: "Sync",
    value:
      "Optional open-source Nanah P2P. The signaling endpoint is only a meeting place.",
  },
];

const policyNav = [
  ["Introduction", "#introduction"],
  ["Covered products", "#coverage"],
  ["Internet services involved", "#infrastructure"],
  ["Data collection", "#collection"],
  ["How filtering works", "#how-it-works"],
  ["Browser permissions", "#browser-permissions"],
  ["Android, iOS/iPad, and TV", "#native-apps"],
  ["Nanah P2P sync", "#nanah"],
  ["Website analytics", "#website"],
  ["YouTube and Google", "#third-parties"],
  ["Store disclosures", "#store-summary"],
  ["Direct answers", "#faq"],
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
          className="ft-tile rounded-[1.45rem] border border-[color:var(--color-line)] p-5"
          key={item.title ?? item.label ?? item.question}
        >
          <h3 className="font-medium text-[var(--color-ink)]">
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
            <p className="text-[0.72rem] uppercase tracking-[0.26em] text-[var(--color-muted)]">
              Privacy policy
            </p>
            <h1 className="mt-5 max-w-[18ch] font-display text-5xl font-semibold tracking-[-0.07em] text-[var(--color-ink)] md:text-7xl md:leading-[0.95]">
              Local-first means your rules stay with you.
            </h1>
            <p className="mt-6 max-w-[72ch] text-base leading-8 text-[var(--color-muted)] md:text-lg">
              Last updated on May 4, 2026. This page covers the FilterTube
              browser extension, Android app, iOS/iPad app, TV app path,
              website, public YouTube Kids access, and optional Nanah
              peer-to-peer settings sync.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="inline-flex min-h-11 items-center rounded-[0.95rem] bg-[var(--color-ink)] px-5 py-3 text-sm font-medium text-[var(--color-cream)] transition duration-300 hover:-translate-y-0.5 active:translate-y-px"
                href="#full-policy"
              >
                Jump to detailed policy
              </a>
              <a
                className="inline-flex min-h-11 items-center rounded-[0.95rem] border border-[color:var(--color-line)] bg-[color:var(--color-glass)] px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition duration-300 hover:-translate-y-0.5 active:translate-y-px"
                href="#faq"
              >
                Direct answers
              </a>
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-[color:var(--color-line)] bg-[color:var(--color-glass)] p-5 md:p-6">
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
              TL;DR
            </p>
            <p className="mt-3 max-w-[76ch] text-lg leading-8 text-[var(--color-ink)]">
              FilterTube is a local control tool, not an account service. Your
              rules, profiles, PINs, watch history, and search history are not
              uploaded into a FilterTube dashboard for us to view. The website
              has website-only analytics. Nanah is open-source peer-to-peer
              sync: devices meet at a known place on the internet so they can
              find each other, then talk directly.
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
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Full policy index
            </p>
            <p className="mt-3 max-w-[72ch] text-sm leading-7 text-[var(--color-muted)]">
              The summary above is not the whole policy. These links jump to the
              detailed sections below.
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
            <PolicySection id="introduction" title="1. Introduction">
              <p>
                FilterTube (&quot;we&quot;, &quot;our&quot;, or
                &quot;the product&quot;) is a free, independent control layer
                for calmer YouTube viewing. It helps users, families, students,
                and profile owners hide noisy or unwanted YouTube surfaces using
                rules they control.
              </p>
              <p>
                The privacy model is intentionally simple: rules are stored on
                your device and evaluated on your device. FilterTube does not
                require a FilterTube account, online dashboard, uploaded rules
                list, uploaded watch-history list, or product telemetry system
                for core filtering.
              </p>
            </PolicySection>

            <PolicySection id="coverage" title="2. Covered products and platforms">
              <CardGrid columns="md:grid-cols-2 lg:grid-cols-3" items={platformCoverage} />
            </PolicySection>

            <PolicySection id="infrastructure" title="3. What internet services exist">
              <p>
                Saying &quot;local-first&quot; does not mean the whole internet
                disappears. It means your filtering rules and viewing history
                are not uploaded into a FilterTube account area for us to view.
                These are the real internet-facing pieces involved:
              </p>
              <CardGrid columns="md:grid-cols-2 lg:grid-cols-3" items={infrastructure} />
            </PolicySection>

            <PolicySection id="collection" title="4. Product data collection">
              <p>
                The browser extension and native apps do not upload your
                filtering rules, profile settings, PIN state, watch history, or
                search history into a FilterTube account, dashboard, or online
                product system. FilterTube does not receive that information as
                a product dataset.
              </p>
              <CardGrid items={oldPolicyAnswers} />
              <p className="font-medium text-[var(--color-ink)]">
                4.1 What FilterTube does not collect through the app or extension
              </p>
              <BulletList items={noProductCollection} />
              <p className="pt-2 font-medium text-[var(--color-ink)]">
                4.2 What stays locally on your device
              </p>
              <BulletList items={localData} />
            </PolicySection>

            <PolicySection id="how-it-works" title="5. How filtering works">
              <p>
                You define rules such as keywords, blocked channels, allowed
                channels, Shorts visibility, comments visibility, watch-page
                controls, route controls, profile rules, Kids/Main viewing
                choices, and PIN-protected management surfaces. FilterTube reads
                supported YouTube page content locally and hides matching
                elements according to your settings.
              </p>
              <p>
                Matching content is hidden locally in the browser, Android web
                view, or iOS/iPad web view. FilterTube does not need to upload
                your rules or viewing activity to do this work.
              </p>
            </PolicySection>

            <PolicySection id="browser-permissions" title="6. Browser extension permissions">
              <p>
                Browser permissions exist so the extension can operate on
                supported YouTube pages and manage optional local backup/export
                flows.
              </p>
              <CardGrid columns="md:grid-cols-2 lg:grid-cols-3" items={browserPermissions} />
            </PolicySection>

            <PolicySection id="native-apps" title="7. Android, iOS/iPad, and TV app behavior">
              <p>
                Native apps provide a FilterTube shell around supported web
                surfaces, plus native profile, PIN, sync, theme, and filtering
                controls. TV and Fire TV may ship as a separate package because
                remote-control UX is different, but TV is still part of the
                FilterTube privacy model.
              </p>
              <CardGrid items={appAccess} />
            </PolicySection>

            <PolicySection id="nanah" title="8. Nanah peer-to-peer sync">
              <p>
                Nanah is optional, open-source, peer-to-peer settings sync. It
                exists so a parent or user can move settings between trusted
                devices or profiles without creating a FilterTube account.
              </p>
              <p>
                Think of Nanah signaling as a known meeting place in the vast
                internet. Your devices go there so they can find each other and
                begin talking. The meeting place is not where your FilterTube
                settings are kept.
              </p>
              <CardGrid columns="md:grid-cols-2 lg:grid-cols-3" items={nanahDetails} />
              <p>
                Current signaling endpoint:{" "}
                <PolicyLink href="https://nanah-signaling.varshney-devansh614.workers.dev/">
                  nanah-signaling.varshney-devansh614.workers.dev
                </PolicyLink>
                . Nanah source code and protocol work are public at{" "}
                <PolicyLink href="https://github.com/varshneydevansh/nanah">
                  github.com/varshneydevansh/nanah
                </PolicyLink>
                .
              </p>
            </PolicySection>

            <PolicySection id="data-movement" title="9. When data can leave your device">
              <p>
                FilterTube rules are local by default. Data can still leave your
                device in ordinary situations where you use a third-party web
                service, create a file, start sync, or contact support.
              </p>
              <CardGrid columns="md:grid-cols-2 lg:grid-cols-3" items={dataMovement} />
            </PolicySection>

            <PolicySection id="website" title="10. Website analytics and hosting">
              <p>
                The public website, filtertube.in, uses Vercel Web Analytics so
                we can see aggregate website page views and understand whether
                people can find the pages they need. Vercel Analytics is not
                included in the FilterTube browser extension, Android app,
                iOS/iPad app, or TV app path.
              </p>
              <p>
                The website does not use Google Analytics, advertising pixels,
                session replay, or cross-site ad targeting. Like any hosted
                website, basic hosting/CDN request handling may involve normal
                infrastructure logs from Vercel or related providers.
              </p>
            </PolicySection>

            <PolicySection id="third-parties" title="11. YouTube and third-party services">
              <p>
                YouTube Main, YouTube Music, and YouTube Kids are Google
                services. FilterTube is independent and not affiliated with,
                endorsed by, or sponsored by Google, YouTube, YouTube Music, or
                YouTube Kids.
              </p>
              <p>
                If you sign in, play videos, search, subscribe, comment, or
                interact with Google/YouTube services, that activity is handled
                by Google/YouTube under their own policies. FilterTube controls
                local filtering and native shell behavior; it does not control
                Google's account, ad, cookie, playback, or recommendation
                systems.
              </p>
            </PolicySection>

            <PolicySection id="store-summary" title="12. Store disclosure summary">
              <p>
                For Google Play, App Store, and browser store review, the
                practical disclosure is:
              </p>
              <CardGrid items={storeSummary} />
              <p>
                Because the app and extension do not upload your rules,
                profiles, watch history, or search history into a FilterTube
                account or dashboard, FilterTube does not have that product data
                sitting online for advertising or broker sharing.
              </p>
            </PolicySection>

            <PolicySection id="children" title="13. Children's privacy">
              <p>
                FilterTube is a parent-managed filtering and control tool. It is
                not operated as a child-data collection service, and it does not
                create online FilterTube accounts or online FilterTube profiles
                for children.
              </p>
              <p>
                YouTube Kids content and accounts remain Google/YouTube
                services. Parents should review Google's YouTube Kids and family
                privacy policies for those surfaces.
              </p>
            </PolicySection>

            <PolicySection id="security" title="14. Data security">
              <p>
                The local-first model reduces exposure by not sending rules,
                profiles, PIN settings, or viewing history to a FilterTube app
                online FilterTube account. Optional Nanah sync is designed
                around trusted-device pairing rather than online account
                storage.
              </p>
              <p>
                No system can promise perfect security in every environment.
                Keep your devices updated, protect profile PINs, and avoid
                sharing backup files, pairing codes, safety phrases, or sync
                links with untrusted people.
              </p>
            </PolicySection>

            <PolicySection id="controls" title="15. Your rights and controls">
              <BulletList items={userControls} />
            </PolicySection>

            <PolicySection id="faq" title="16. Direct answers">
              <CardGrid items={faq} />
            </PolicySection>

            <PolicySection id="open-source" title="17. Open-source transparency">
              <p>
                The FilterTube browser extension and website live in the public
                repository at{" "}
                <PolicyLink href="https://github.com/varshneydevansh/FilterTube">
                  github.com/varshneydevansh/FilterTube
                </PolicyLink>
                . Nanah is public at{" "}
                <PolicyLink href="https://github.com/varshneydevansh/nanah">
                  github.com/varshneydevansh/nanah
                </PolicyLink>
                .
              </p>
              <p>
                Native app implementation details may be distributed separately
                during store release preparation. The privacy promise here is
                based on product behavior: local filtering, no FilterTube app
                online FilterTube account for rules/history, and optional
                open-source P2P sync.
              </p>
            </PolicySection>

            <PolicySection id="changes" title="18. Changes to this privacy policy">
              <p>
                We may update this page as FilterTube evolves across browser,
                Android, iOS/iPad, TV, Kids, and sync surfaces. If a release
                materially changes data handling, this page should be updated
                before that behavior is relied on publicly.
              </p>
            </PolicySection>

            <PolicySection id="standards" title="19. Privacy posture and policy standards">
              <p>
                FilterTube is built around data minimization, local processing,
                user-controlled storage, and transparent optional sync. That
                architecture is intended to align with the privacy expectations
                commonly reflected in browser-store, Google Play, App Store,
                GDPR, and CCPA-style privacy frameworks.
              </p>
              <p>
                This page describes current product behavior and privacy
                posture. It is not legal advice.
              </p>
            </PolicySection>

            <PolicySection id="contact" title="20. Contact">
              <p>
                If you have questions about this Privacy Policy or FilterTube
                data handling, contact{" "}
                <a
                  className="text-[var(--color-accent)] underline decoration-[color:var(--color-line)] underline-offset-4 transition duration-300 hover:decoration-[var(--color-accent)]"
                  href="mailto:hello@filtertube.in"
                >
                  hello@filtertube.in
                </a>{" "}
                or open an issue in the{" "}
                <PolicyLink href="https://github.com/varshneydevansh/FilterTube">
                  public GitHub repository
                </PolicyLink>
                .
              </p>
            </PolicySection>
          </Panel>
        </div>
      </div>
    </section>
  );
}
