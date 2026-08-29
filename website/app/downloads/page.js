import {
  AndroidLogo,
  AppleLogo,
  Browser,
  CheckCircle,
  DownloadSimple,
  GithubLogo,
  ShieldCheck,
} from "@phosphor-icons/react/ssr";

import { HeroVideo } from "@/components/hero-video";
import { ActionLink, Panel } from "@/components/marketing-ui";
import {
  androidPlayStoreHref,
  docsHref,
  githubHref,
  heroVideoUrl,
} from "@/components/route-content";

export const metadata = {
  title: "Downloads",
  description:
    "Download FilterTube for browsers, install the public Android app from Google Play, or follow final iPhone and iPad testing progress.",
};

const releaseHref = `${githubHref}/releases`;
const latestReleaseHref = `${githubHref}/releases/latest`;

const primaryDownloads = [
  {
    title: "Browser extension",
    label: "Available now",
    icon: Browser,
    description:
      "Install FilterTube on desktop browsers today. Store listings are the easiest path; GitHub releases keep the manual ZIP builds available.",
    actions: [
      {
        label: "Chrome Web Store",
        href:
          "https://chromewebstore.google.com/detail/filtertube/cjmdggnnpmpchholgnkfokibidbbnfgc",
      },
      {
        label: "Firefox Add-ons",
        href: "https://addons.mozilla.org/en-US/firefox/addon/filtertube/",
      },
      {
        label: "GitHub ZIPs",
        href: releaseHref,
      },
    ],
  },
  {
    title: "Android phone/tablet",
    label: "Available on Google Play",
    icon: AndroidLogo,
    description:
      "The feature-rich Android custom viewing app is publicly available on Google Play. Install it from the listing or search Google Play for FilterTube. The direct APK is a separate, simpler build and does not include the complete custom frontend.",
    actions: [
      {
        label: "Open on Google Play",
        href: androidPlayStoreHref,
      },
      {
        label: "Simpler direct APK",
        href: latestReleaseHref,
      },
      {
        label: "Google Play listing",
        href: androidPlayStoreHref,
      },
    ],
  },
  {
    title: "iPhone and iPad",
    label: "Final testing alignment",
    icon: AppleLogo,
    description:
      "The iPhone and iPad build is in final build and testing alignment. Apple Developer account access is delaying TestFlight availability and will be resolved as soon as possible.",
    actions: [
      {
        label: "iOS status",
        href: "#ios-status",
        internal: true,
      },
    ],
  },
];

const androidMarkets = [
  {
    title: "Google Play",
    status: "Complete custom viewing app",
    detail:
      "The Google Play build is FilterTube's feature-rich, complete custom viewing experience for YouTube Main and Kids. Anyone can install it directly from the public listing or find it by searching Google Play.",
  },
  {
    title: "Direct APK",
    status: "Separate simpler build",
    detail:
      "The direct-install APK is not the complete custom frontend available through Google Play. Keep this distinction clear before downloading or sideloading it.",
  },
  {
    title: "IzzyOnDroid",
    status: "Good next public repository",
    detail:
      "Needs public source and release APKs. Fastlane metadata will make this easier when the native app source is ready to expose.",
  },
  {
    title: "F-Droid",
    status: "Stricter future target",
    detail:
      "Requires a buildable FLOSS source path and compatible dependencies. Treat this as release hardening, not a last-minute upload.",
  },
  {
    title: "Accrescent",
    status: "Invite-only watchlist",
    detail:
      "Accrescent is privacy-aligned but currently invite-only. Keep it as a watchlist target instead of promising immediate publication.",
  },
  {
    title: "Android TV / Fire TV",
    status: "Separate future app",
    detail:
      "TV should ship as its own package and store listing later. It is not part of the current phone/tablet APK.",
  },
];

const safetyChecks = [
  "Only install APKs linked from filtertube.in or the official GitHub releases page.",
  "Check the SHA-256 file before sideloading direct APK builds.",
  "Keep the Android phone/tablet package as com.filtertube.app.",
  "Android TV / Fire TV should use a separate future package, not this mobile APK.",
  "iOS should use TestFlight or App Store distribution, not a random IPA download.",
];

function ExternalTextLink({ href, children }) {
  return (
    <a
      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] transition duration-500 hover:translate-x-1"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
      <DownloadSimple aria-hidden="true" size={15} weight="light" />
    </a>
  );
}

function DownloadCard({ item }) {
  const Icon = item.icon;
  return (
    <Panel innerClassName="h-full p-6 md:p-7">
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[color:var(--color-elevation-spot)] text-[var(--color-ink)]">
            <Icon aria-hidden="true" size={24} weight="light" />
          </div>
          <span className="rounded-full border border-[color:var(--color-line)] px-3 py-2 text-[0.68rem] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {item.label}
          </span>
        </div>
        <h2 className="mt-6 font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">
          {item.title}
        </h2>
        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
          {item.description}
        </p>
        <div className="mt-6 grid gap-3">
          {item.actions.map((action) =>
            action.internal ? (
              <ActionLink href={action.href} key={action.label} variant="secondary">
                {action.label}
              </ActionLink>
            ) : (
              <ActionLink external href={action.href} key={action.label}>
                {action.label}
              </ActionLink>
            ),
          )}
        </div>
      </div>
    </Panel>
  );
}

export default function DownloadsPage() {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <HeroVideo
          className="absolute inset-0 h-full w-full object-cover"
          src={heroVideoUrl}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_16%,rgba(255,255,255,0.76),rgba(255,255,255,0.46)_35%,rgba(246,242,235,0.76)_72%),linear-gradient(180deg,rgba(246,242,235,0.64),rgba(246,242,235,0.9)_58%,rgba(246,242,235,0.96))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(171,68,56,0.1),transparent_28%),radial-gradient(circle_at_18%_82%,rgba(255,255,255,0.22),transparent_30%)]" />
      </div>
      <section className="px-4 pb-10 pt-32 md:px-6 md:pb-16 md:pt-40">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[820px]">
            <p className="text-[0.72rem] uppercase tracking-[0.26em] text-[var(--color-muted)]">
              Downloads
            </p>
            <h1 className="mt-5 text-balance font-display text-5xl font-semibold tracking-[-0.07em] text-[var(--color-ink)] md:text-7xl md:leading-[0.95]">
              One stable place for every FilterTube build.
            </h1>
            <p className="mt-6 max-w-[68ch] text-pretty text-base leading-8 text-[var(--color-muted)] md:text-lg">
              Browser releases stay public on GitHub and store listings. Android
              phone/tablet builds can be attached to the same release stream for
              Google Play, GrapheneOS, and other direct-install users. iPhone
              and iPad are in final build and testing alignment,
              with Apple Developer account access currently delaying TestFlight.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.08fr_0.96fr_0.96fr]">
            {primaryDownloads.map((item) => (
              <DownloadCard item={item} key={item.title} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-[1180px]">
          <Panel innerClassName="p-6 md:p-8 lg:p-10">
            <div className="grid gap-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.26em] text-[var(--color-muted)]">
                  App release state
                </p>
                <h2 className="mt-5 font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                  Android is public on Google Play; Apple testing is being finalized.
                </h2>
                <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">
                  Anyone can install the Android app from Google Play or search
                  the store for FilterTube. The iPhone and iPad build is in final alignment, while
                  Apple Developer account access is the current TestFlight delay.
                  TV remains separate platform work.
                </p>
              </div>
              <div id="ios-status" className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-5">
                  <AndroidLogo aria-hidden="true" size={26} weight="light" />
                  <h3 className="mt-4 font-display text-2xl tracking-[-0.05em] text-[var(--color-ink)]">
                    Android
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    The public Google Play listing is live. Open the link above
                    or search Google Play for FilterTube to install the app.
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-5">
                  <AppleLogo aria-hidden="true" size={26} weight="light" />
                  <h3 className="mt-4 font-display text-2xl tracking-[-0.05em] text-[var(--color-ink)]">
                    iOS and iPadOS
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    Final build and testing alignment is underway. Apple Developer
                    account access is delaying TestFlight; Apple-channel testing
                    will open as soon as that access is resolved.
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </section>

      <section id="android-markets" className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-[1180px]">
          <Panel innerClassName="p-6 md:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.26em] text-[var(--color-muted)]">
                  Android distribution
                </p>
                <h2 className="mt-5 font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                  Play first, direct APK next, repository listings after proof.
                </h2>
                <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">
                  The public repo can host the release page and metadata even if
                  the native app repo stays private for now. The APK itself
                  should be signed, checksummed, and attached intentionally.
                  Accrescent stays a watchlist item because submission is invite-only.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <ActionLink external href={releaseHref}>
                    Open GitHub releases
                  </ActionLink>
                  <ActionLink external href={docsHref} variant="secondary">
                    Read docs
                  </ActionLink>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {androidMarkets.map((market) => (
                  <div
                    className="rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-4"
                    key={market.title}
                  >
                    <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--color-muted)]">
                      {market.status}
                    </p>
                    <h3 className="mt-3 font-display text-xl tracking-[-0.04em] text-[var(--color-ink)]">
                      {market.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      {market.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </section>

      <section className="px-4 pb-20 pt-4 md:px-6 md:pb-28">
        <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)]">
          <Panel innerClassName="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-[color:var(--color-elevation-spot)] text-[var(--color-ink)]">
                <ShieldCheck aria-hidden="true" size={24} weight="light" />
              </div>
              <div>
                <h2 className="font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">
                  Verify before installing.
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                  Direct APK distribution is powerful, but it must stay boring
                  and predictable: official link, signed file, checksum, and
                  release notes in one place.
                </p>
                <ul className="mt-6 grid gap-3">
                  {safetyChecks.map((item) => (
                    <li className="flex gap-3 text-sm leading-7 text-[var(--color-muted)]" key={item}>
                      <CheckCircle
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-[var(--color-accent)]"
                        size={18}
                        weight="fill"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>

          <Panel innerClassName="p-6 md:p-8">
            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[color:var(--color-elevation-spot)] text-[var(--color-ink)]">
                  <GithubLogo aria-hidden="true" size={24} weight="light" />
                </div>
                <h2 className="mt-6 font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">
                  Release assets live on GitHub.
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                  filtertube.in is the clean front door. GitHub Releases remain
                  the durable place for ZIPs, APKs, AABs, checksums, and
                  changelog history.
                </p>
              </div>
              <div className="grid gap-3">
                <ExternalTextLink href={latestReleaseHref}>
                  Latest release
                </ExternalTextLink>
                <ExternalTextLink href={releaseHref}>
                  All releases
                </ExternalTextLink>
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}
