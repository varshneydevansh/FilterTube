import {
  AndroidLogo,
  AppleLogo,
  Browser,
  CheckCircle,
  DownloadSimple,
  GithubLogo,
  ShieldCheck,
} from "@phosphor-icons/react/ssr";

import { ActionLink, Panel } from "@/components/marketing-ui";
import { docsHref, githubHref } from "@/components/route-content";

export const metadata = {
  title: "Downloads",
  description:
    "Download FilterTube for browsers, Android phone/tablet, GrapheneOS and other Android setups, with final release testing for Play Store and App Store.",
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
    label: "Final release testing",
    icon: AndroidLogo,
    description:
      "The Android phone and tablet app is complete for the current release scope and is in final testing for Play Store, direct APK, and trusted Android distribution paths.",
    actions: [
      {
        label: "Direct APK releases",
        href: latestReleaseHref,
      },
      {
        label: "Play Store status",
        href: "#android-markets",
        internal: true,
      },
    ],
  },
  {
    title: "iPhone and iPad",
    label: "Final release testing",
    icon: AppleLogo,
    description:
      "The iPhone and iPad app follows the same local-first model and is being prepared for TestFlight and App Store review. Public IPA downloads are not the normal install path.",
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
    status: "Primary phone/tablet store",
    detail:
      "Use the signed AAB for Play tracks. This stays the broadest consumer install path.",
  },
  {
    title: "Direct APK",
    status: "GrapheneOS and de-Googled Android",
    detail:
      "A signed release APK can be attached to GitHub Releases with a SHA-256 checksum and signing fingerprint, then linked from this page.",
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
    <>
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
              Play testing, GrapheneOS, and other direct-install users. iPhone and
              iPad builds are prepared for TestFlight and App Store paths.
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
                  Phone and tablet apps are complete and in final store testing.
                </h2>
                <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">
                  The current release target is browser plus Android phone/tablet,
                  with iPhone and iPad following the same store-review path. TV is
                  separate platform work and should not be bundled into the mobile
                  release.
                </p>
              </div>
              <div id="ios-status" className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-5">
                  <AndroidLogo aria-hidden="true" size={26} weight="light" />
                  <h3 className="mt-4 font-display text-2xl tracking-[-0.05em] text-[var(--color-ink)]">
                    Android
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    Play internal testing is active. Direct APK distribution will
                    use GitHub release assets and checksums when the signed release
                    APK is attached.
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-5">
                  <AppleLogo aria-hidden="true" size={26} weight="light" />
                  <h3 className="mt-4 font-display text-2xl tracking-[-0.05em] text-[var(--color-ink)]">
                    iOS and iPadOS
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    Prepared for TestFlight and App Store review. Users should
                    install from Apple channels once those links are approved.
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
    </>
  );
}
