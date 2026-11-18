import Link from "next/link";
import {
  AndroidLogo,
  AppleLogo,
  ArrowRight,
  ArrowUpRight,
  DeviceMobile,
  Play,
} from "@phosphor-icons/react/ssr";

import { BrowserLogoRail } from "@/components/browser-logo-rail";
import { CommunityTools } from "@/components/community-tools";
import { DeviceStrip } from "@/components/device-strip";
import { HeroShowcase } from "@/components/hero-showcase";
import { HeroVideo } from "@/components/hero-video";
import { HowItWorks } from "@/components/how-it-works";
import { MeetMascots } from "@/components/meet-mascots";
import { ActionLink, Panel, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";
import { P2PSyncExplainer } from "@/components/p2p-sync-video";
import {
  appDemoVideoHref,
  androidPlayStoreHref,
  demoVideoHref,
  detailPages,
  docsHref,
  featuredRouteSlugs,
  githubHref,
  heroVideoUrl,
  homeCapabilityCards,
  homeFaqItems,
  homeStoryNotes,
  homeTechnicalFeatures,
  homeUserVoices,
} from "@/components/route-content";
import { getTonePreset } from "@/components/scenic-tones";

const featuredSpans = [
  "xl:col-span-6",
  "xl:col-span-6",
  "xl:col-span-5",
  "xl:col-span-7",
];

const featuredPages = featuredRouteSlugs.map((slug) => detailPages[slug]);
const shortcutPages = ["ml-ai"].map((slug) => detailPages[slug]);

function FeaturedPlatformCard({ page, span }) {
  const tone = getTonePreset(page.tone);
  const Icon = page.icon;
  const isDarkTone = page.tone === "ink";
  const headingClass = isDarkTone ? "text-[#fffaf4]" : "text-[#1d1b18]";
  const mutedClass = isDarkTone ? "text-white/82" : "text-[#4f4b45]";
  const eyebrowClass = isDarkTone ? "text-white/70" : "text-[#615c55]";

  return (
    <Link
      data-tone={page.tone}
      className={`group ft-shell ft-platform-theme block h-full rounded-[2rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${span}`}
      href={`/${page.slug}`}
      prefetch
    >
      <div
        className={`ft-inset relative h-full overflow-hidden rounded-[calc(2rem-0.5rem)] p-6 md:p-7 ${tone.surface}`}
      >
        <div className={`absolute inset-0 ${tone.heroBackdrop} opacity-82`} />
        <div
          className={`absolute -left-10 top-8 h-28 w-28 rounded-full blur-3xl ${tone.primaryOrb}`}
        />
        <div
          className={`absolute bottom-0 right-0 h-36 w-36 rounded-full blur-[100px] ${tone.secondaryOrb}`}
        />
        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <div
              className={`ft-platform-icon flex h-12 w-12 items-center justify-center rounded-[1rem] ${tone.iconShell}`}
            >
              {page.slug === "extension" ? <img alt="" src="/apps/firefox.png" width={28} height={28} /> : <Icon aria-hidden="true" size={22} weight="light" />}
            </div>
            <span
              className={`ft-platform-badge inline-flex min-h-9 items-center rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.22em] ${tone.accentBadge}`}
            >
              {page.status}
            </span>
          </div>
          <p
            className={`mt-6 text-[0.72rem] uppercase tracking-[0.22em] ${eyebrowClass}`}
          >
            {page.eyebrow}
          </p>
          <h3
            className={`mt-3 max-w-[14ch] text-balance font-display text-4xl tracking-[-0.06em] ${headingClass}`}
          >
            {page.titleDisplay}
          </h3>
          <p className={`mt-4 max-w-[34ch] text-sm leading-7 ${mutedClass}`}>
            {page.routeSummary}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {page.chips.slice(0, 2).map((chip) => (
              <span
                className={`inline-flex min-h-10 items-center rounded-full border px-3 py-2 text-[0.68rem] uppercase tracking-[0.18em] ${tone.chip}`}
                key={chip}
              >
                {chip}
              </span>
            ))}
          </div>
          <span
            className={`mt-8 inline-flex items-center gap-2 text-sm font-medium ${headingClass}`}
          >
            Open overview
            <ArrowRight
              aria-hidden="true"
              className="transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
              size={16}
              weight="light"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ShortcutCard({ page }) {
  const tone = getTonePreset(page.tone);
  const isDarkTone = page.tone === "ink";
  const headingClass = isDarkTone ? "text-[#fffaf4]" : "text-[#1d1b18]";
  const mutedClass = isDarkTone ? "text-white/82" : "text-[#4f4b45]";
  const eyebrowClass = isDarkTone ? "text-white/70" : "text-[#615c55]";

  return (
    <Link
      className="group ft-shell block h-full rounded-[1.6rem] p-2 ring-1 ring-[color:var(--color-line)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5"
      href={`/${page.slug}`}
      prefetch
    >
      <div
        className={`ft-inset relative h-full overflow-hidden rounded-[calc(1.6rem-0.5rem)] p-5 ${tone.surface}`}
      >
        <div className={`absolute inset-0 ${tone.heroBackdrop} opacity-72`} />
        <div className="relative z-10">
          <p
            className={`text-[0.68rem] uppercase tracking-[0.22em] ${eyebrowClass}`}
          >
            {page.eyebrow}
          </p>
          <h3
            className={`mt-3 text-balance font-display text-2xl tracking-[-0.05em] ${headingClass}`}
          >
            {page.navTitle}
          </h3>
          <p className={`mt-3 text-sm leading-7 ${mutedClass}`}>
            {page.routeSummary}
          </p>
          <span
            className={`mt-4 inline-flex items-center gap-2 text-sm font-medium ${headingClass}`}
          >
            See details
            <ArrowUpRight
              aria-hidden="true"
              className="transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              size={15}
              weight="light"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

function AppReleaseStatusSection() {
  const appCards = [
    {
      eyebrow: "Android phone + tablet",
      title: "Your videos, on Android.",
      body: "A custom Main and Kids app, with filters and family profiles. Explore Music, Notes and local-media development too. Install from Google Play—no invitation or email needed.",
      image: "/apps/android.png",
      imageAlt: "FilterTube Android app artwork",
      action: "Explore Android",
      href: "/android",
      platform: "android",
      icon: AndroidLogo,
    },
    {
      eyebrow: "iPhone + iPad",
      title: "iPhone and iPad, together.",
      body: "A native app for smaller screens and a wider iPad workspace. Install it directly with SideStore while Apple sorts out the developer account.",
      image: "/apps/app-store-transparent.png",
      imageAlt: "FilterTube iPhone and iPad app artwork",
      action: "Install on iPhone or iPad",
      href: "/ios",
      platform: "ios",
      icon: AppleLogo,
    },
    {
      eyebrow: "Browser extension · available now",
      title: "Keep watching in your browser.",
      body: "Use FilterTube on the pages you already visit, with a quick popup, full settings, and channel controls in the video menu. Choose Chrome, Firefox, Edge or another supported browser.",
      image: "/apps/firefox.png",
      imageAlt: "Firefox browser artwork for the FilterTube extension",
      action: "Explore the extension",
      href: "/extension",
      platform: "extension",
      imageClass: "ft-app-release-art--browser",
    },
  ];

  return (
    <section className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {appCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  className="ft-app-release-card ft-platform-theme ft-platform-surface relative isolate min-h-[22rem] overflow-hidden rounded-[2rem] border p-6 shadow-[var(--shadow-diffuse)] md:p-7"
                  data-tone={detailPages[card.platform].tone}
                  key={card.title}
                >
                  <div className="relative z-10 flex h-full flex-col sm:max-w-[62%]">
                    <div className="flex items-center gap-2.5">
                      <span className="ft-platform-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                        {Icon ? <Icon aria-hidden="true" size={22} weight="light" /> : <img alt="" src="/apps/firefox.png" width={28} height={28} />}
                      </span>
                      <p className="ft-platform-label text-[0.68rem] font-semibold uppercase tracking-[0.16em]">
                        {card.eyebrow}
                      </p>
                    </div>
                    <h2 className="mt-4 text-balance font-display text-3xl tracking-[-0.055em] text-[var(--color-ink)] md:text-4xl">
                      {card.title}
                    </h2>
                    <p className="mb-6 mt-4 text-sm leading-7 text-[var(--color-muted)]">
                      {card.body}
                    </p>
                    <Link
                      className="ft-platform-action mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
                      href={card.href}
                    >
                      {card.action}
                      <ArrowUpRight aria-hidden="true" size={16} weight="light" />
                    </Link>
                  </div>
                  <img
                    alt={card.imageAlt}
                    className={`ft-app-release-art absolute hidden sm:block -bottom-2 -right-8 h-[62%] w-[54%] object-contain object-bottom drop-shadow-[0_24px_30px_rgba(39,48,48,0.22)] sm:-right-5 sm:h-[72%] ${card.imageClass || ""}`}
                    src={card.image}
                    width={768}
                    height={512}
                    loading="lazy"
                  />
                </article>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function QuickGuideSection() {
  return (
    <section id="system" className="px-4 py-20 md:px-6 md:py-28 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <SectionHeading
            eyebrow="Quick guide"
            title="Start small, then add family controls only when needed."
            description="Choose the app or extension, add one rule, then build the setup that fits you."
          />
        </Reveal>

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            [
              "1",
              "Install and open FilterTube",
              "Install the Android app from Google Play or add the extension to your browser.",
            ],
            [
              "2",
              "Block one thing",
              "Choose your profile, add one channel or keyword, then open Main or Kids. In the extension, refresh the page to check the result.",
            ],
            [
              "3",
              "Add only what you need",
              "Add family profiles, viewing limits, Whitelist rules, imports or device sharing when you need them. You can adjust the rules at any time.",
            ],
          ].map(([number, title, body]) => (
            <li className="ft-shell flex h-full flex-col rounded-[1.6rem] border border-[color:var(--color-line)] p-2" key={number}>
              <div className="ft-inset flex h-full flex-col rounded-[1.2rem] bg-[var(--color-surface)] p-5 md:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] font-mono text-sm font-bold text-[#fff8f1]">
                  {number}
                </span>
                <h3 className="mt-5 font-display text-2xl tracking-[-0.045em] text-[var(--color-ink)]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <details className="ft-disclosure ft-shell mt-6 rounded-[1.5rem] border border-[color:var(--color-line)]">
          <summary className="cursor-pointer px-6 py-5 font-semibold text-[var(--color-ink)]">
            If filtering misses something
          </summary>
          <div className="px-6 pb-6 text-sm leading-7 text-[var(--color-muted)]">
            <p>
              Platforms change their layouts and players. Check the active profile
              and rule first, then report what happened with the page type, a
              screenshot and a small example of the affected word or channel.
            </p>
            <p className="mt-3">
              Email{" "}
              <a
                className="underline underline-offset-4"
                href="mailto:hello@filtertube.in"
              >
                hello@filtertube.in
              </a>
              , open a{" "}
              <a
                className="underline underline-offset-4"
                href={`${githubHref}/issues`}
              >
                GitHub issue
              </a>
              , or reply where you found FilterTube. Share private family rules
              only if you choose to; a small example is usually enough.
            </p>
          </div>
        </details>

        <Reveal>
          <Panel className="mt-16 md:mt-20" innerClassName="p-5 md:p-8 lg:p-10">
            <div id="device-sync">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    P2P · Peer-to-peer sync
                  </p>
                  <h3 className="mt-4 max-w-[14ch] font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                    Your devices. In sync.
                  </h3>
                </div>
                <div className="max-w-[52ch] text-base leading-8 text-[var(--color-muted)]">
                  <p>
                    Your phone and your child&apos;s phone, tablet or TV talk straight to each other.
                    What passes between them is locked, so only those devices can open it. No
                    FilterTube sign-up, and no servers keep your data.
                  </p>
                  <p className="mt-3 text-[var(--color-ink)]">
                    We don&apos;t run a server that reads your family&apos;s settings. We couldn&apos;t
                    afford one, and we don&apos;t want one.
                  </p>
                </div>
              </div>
              <div className="mx-auto mt-8 max-w-[1040px] md:mt-10">
                <P2PSyncExplainer />
              </div>
              <dl className="mt-10 grid gap-x-8 gap-y-5 text-sm leading-7 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Pair and verify", "Use a short code or the QR, then check that both screens show the same safety words."],
                  ["You choose", "Pick the profile and what to share. The other device reviews it first, and only approved parents can change a child’s protected settings."],
                  ["Locked, direct", "A relay can help your devices find each other across networks. It only passes locked data it can’t open."],
                  ["Auto-sync, in testing", "Verified devices can keep each other up to date. Changes wait on the device while you’re offline."],
                ].map(([term, detail]) => (
                  <div className="border-t border-[color:var(--color-line)] pt-4" key={term}>
                    <dt className="font-semibold text-[var(--color-ink)]">{term}</dt>
                    <dd className="mt-1 text-[var(--color-muted)]">{detail}</dd>
                  </div>
                ))}
              </dl>
              <details className="ft-disclosure mt-8 rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)]">
                <summary className="cursor-pointer px-5 py-4 font-semibold text-[var(--color-ink)]">
                  More on syncing across networks
                </summary>
                <div className="space-y-4 px-5 pb-5 text-sm leading-7 text-[var(--color-muted)]">
                  <p>Nearby devices are never trusted automatically. Both devices approve personal links.</p>
                  <p>Direct sync needs FilterTube open and connected on both devices. Optional Home Pickup and
                    Internet Pickup separately deliver approved parent updates. Queued, received and applied are
                    different states, and background delivery is not guaranteed.</p>
                </div>
              </details>
            </div>
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[100dvh] overflow-hidden px-4 pb-12 pt-28 md:px-6 md:pb-20 md:pt-36">
        <HeroVideo showControls src={heroVideoUrl} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_30%,rgba(18,16,20,0.12)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(11,14,18,0.08))]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <Reveal className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full flex-col justify-between pb-4 pt-4 md:pb-6 md:pt-8">
            <div className="grid flex-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.04fr)] lg:gap-10 xl:gap-16">
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="inline-flex min-h-11 items-center gap-3 rounded-full border border-white/30 bg-[rgba(13,18,27,0.2)] px-4 py-2 text-sm font-medium text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl">
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1f2430]">
                    Live now
                  </span>
                  <span className="text-pretty">
                    Desktop extensions and the Android app are live. Find
                    FilterTube on Google Play.
                  </span>
                </div>

                <div className="mt-9">
                  <p className="text-balance font-display text-[clamp(2.7rem,6.8vw,5.8rem)] font-medium tracking-[-0.09em] text-[#fffdf8] drop-shadow-[0_16px_36px_rgba(0,0,0,0.3)] lg:text-[clamp(3rem,4.3vw,4.4rem)]">
                    Calmer, <span className="whitespace-nowrap">ad-free</span> viewing
                  </p>
                  <h1 className="mt-3 text-balance font-editorial text-[clamp(4.2rem,11vw,9.1rem)] leading-[0.88] text-[#fffdf8] drop-shadow-[0_18px_40px_rgba(0,0,0,0.3)] lg:text-[clamp(5rem,7.4vw,7.6rem)]">
                    Your feed, your rules
                  </h1>
                </div>

                <p className="ft-hero-support-copy relative mt-7 max-w-[760px] text-pretty rounded-[1.6rem] px-6 py-4 text-[16px] font-medium leading-7 md:px-8 md:text-[18px] md:leading-8 lg:max-w-[36rem] lg:px-6">
                  <span className="font-semibold text-white">
                    Block what you don&apos;t want—or allow only what you trust.
                  </span>{" "}
                  Control{" "}
                  <span className="ft-hero-support-emphasis">
                    channels, keywords, Shorts, comments, categories, languages,
                    and more.
                  </span>
                </p>

                <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
                  <a
                    className="group inline-flex min-h-11 items-center gap-3 overflow-visible whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#20242f] shadow-[0_20px_40px_-30px_rgba(14,16,24,0.45)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:translate-y-px active:scale-[0.98]"
                    href={demoVideoHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#20242f] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                      <Play aria-hidden="true" size={14} weight="fill" />
                    </span>
                    <span className="pr-0.5 leading-[1.05]">
                      Watch the quick demo
                    </span>
                  </a>
                  <a
                    className="group inline-flex min-h-11 items-center gap-3 overflow-visible whitespace-nowrap rounded-full border border-white/40 bg-[rgba(14,20,30,0.38)] px-6 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.26),0_18px_44px_-26px_rgba(4,8,14,0.72)] backdrop-blur-2xl transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-white/55 hover:bg-[rgba(14,20,30,0.52)] active:translate-y-px active:scale-[0.98]"
                    href={appDemoVideoHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                      <DeviceMobile aria-hidden="true" size={15} weight="light" />
                    </span>
                    Watch app demo
                  </a>
                </div>
              </div>

              <div className="mx-auto w-full max-w-[42rem] lg:max-w-none">
                <HeroShowcase />
                <p className="ft-hero-status mx-auto mt-8 max-w-[34rem] rounded-2xl px-5 py-3 text-center text-sm font-medium leading-6 text-white md:px-6">
                  A study plan on iPad and Sangeet on Android. Your devices and
                  profiles stay in sync through verified, encrypted
                  peer-to-peer sharing.
                </p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[1080px] pt-14 md:pt-16 lg:pt-16">
              <BrowserLogoRail muted />
              <div className="mx-auto mt-6 flex max-w-[920px] flex-wrap items-center justify-center gap-3 text-sm text-white/88">
                <span className="rounded-full border border-white/24 bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl">
                  Ad-free playback
                </span>
                <span className="rounded-full border border-white/24 bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl">
                  Kids Mode
                </span>
                <span className="rounded-full border border-white/24 bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl">
                  Hide Shorts
                </span>
                <a href="#how-it-works" className="rounded-full border border-white/24 bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl underline decoration-white/50 underline-offset-4">
                  Whitelist and Study mode
                </a>
                <span className="rounded-full border border-white/24 bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl">
                  PIN locked profiles
                </span>
                <a href="#device-sync" className="rounded-full border border-white/24 bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl underline decoration-white/50 underline-offset-4">
                  Peer-to-peer device sync
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <HowItWorks />

      <DeviceStrip />

      <CommunityTools />

      <AppReleaseStatusSection />

      <QuickGuideSection />

      <MeetMascots />

      <section id="story" className="px-4 py-20 md:px-6 md:py-28 lg:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="Why FilterTube"
              title="A calmer place for what you choose to watch."
              description="FilterTube is for parents, students, and everyday users who need clear controls: add words, block channels, hide Shorts, set stricter profiles, and keep the setup local."
            />
            <div className="mt-8 space-y-4">
              {homeStoryNotes.map((note) => (
                <div
                  className="ft-shell flex gap-3 rounded-[1.5rem] border border-[color:var(--color-line)] px-5 py-4 text-sm leading-7 text-[var(--color-muted)]"
                  key={note}
                >
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <Panel innerClassName="relative overflow-hidden p-7 md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(240,209,194,0.26),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(181,205,193,0.2),transparent_26%)]" />
              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    Why this exists
                  </p>
                  <a
                    className="ft-shell-strong inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-[color:var(--color-accent)] hover:text-[var(--color-accent)] active:translate-y-px active:scale-[0.99]"
                    href="https://support.google.com/youtubekids/thread/54509605/how-to-block-videos-by-keyword-or-tag?hl=en"
                    rel="noreferrer"
                    target="_blank"
                  >
                    View the parent request
                    <ArrowUpRight aria-hidden="true" size={16} weight="light" />
                  </a>
                </div>

                <blockquote className="mt-8 max-w-[17ch] font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl md:leading-[0.96]">
                  Start with one blocked word or channel. Add stricter family
                  controls only when you need them.
                </blockquote>

                <div className="mt-10 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.5rem] bg-[var(--color-panel)] p-5">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Live today
                    </p>
                    <p className="mt-3 font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">
                      Android + browsers
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      Install the Android phone/tablet app or use FilterTube in
                      a supported desktop browser.
                    </p>
                  </div>
                  <div className="ft-tile rounded-[1.5rem] p-5 ring-1 ring-[color:var(--color-line)]">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Common first steps
                    </p>
                    <p className="mt-3 font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">
                      Kids + Shorts
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      Use Whitelist mode for trusted channels only, or hide
                      Shorts when scrolling is the main problem.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,#18202a,#10161d)] p-5 text-[#f8f6f2] shadow-[0_24px_48px_-34px_rgba(4,8,14,0.7)]">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/72">
                      In development
                    </p>
                    <p className="mt-3 font-display text-3xl tracking-[-0.05em] text-[#fffaf4]">
                      iOS + Android TV
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/84">
                      iPhone, iPad and TV work is underway, with each platform’s
                      availability and tested features shown separately.
                    </p>
                  </div>
                </div>
              </div>
            </Panel>
          </Reveal>
        </div>
      </section>

      <section
        id="capabilities"
        className="px-4 py-20 md:px-6 md:py-28 lg:py-32"
      >
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionHeading
              eyebrow="Controls"
              title="The main controls are simple: block, allow, hide, or protect."
              description="Most people can start with a Blocklist. Families can add profiles, PINs, Whitelist mode, and device updates as the setup grows."
            />
          </Reveal>
          <div className="mt-12 grid auto-rows-fr gap-5 xl:grid-cols-12">
            {homeCapabilityCards.map((card, index) => (
              <Reveal className={card.span} delay={index * 80} key={card.title}>
                <Panel innerClassName="h-full p-6 md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                        {card.label}
                      </p>
                      <h3 className="mt-4 max-w-[18ch] font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">
                        {card.title}
                      </h3>
                    </div>
                    <div className="rounded-full bg-[rgba(171,68,56,0.08)] p-3 text-[var(--color-accent)]">
                      <card.icon aria-hidden="true" size={24} weight="light" />
                    </div>
                  </div>
                  <p className="mt-5 max-w-[58ch] text-base leading-8 text-[var(--color-muted)]">
                    {card.description}
                  </p>
                  <ul className="mt-6 space-y-3 text-sm leading-7 text-[var(--color-muted)]">
                    {card.points.map((point) => (
                      <li className="flex gap-3" key={point}>
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="platforms" className="px-4 py-20 md:px-6 md:py-28 lg:py-32">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionHeading
              eyebrow="Apps"
              title="On your phone, your tablet, and more screens."
              description="Android is available now. Explore iPhone and iPad development, the browser extension, and the Android TV work inside the Android overview."
            />
          </Reveal>

          <div className="mt-12 grid gap-5 xl:grid-cols-12">
            {featuredPages.map((page, index) => (
              <Reveal
                className={featuredSpans[index]}
                delay={index * 80}
                key={page.slug}
              >
                <FeaturedPlatformCard page={page} span={featuredSpans[index]} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="ft-shell mt-8 rounded-[1.9rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)]">
              <div className="ft-inset ft-shell-strong rounded-[calc(1.9rem-0.5rem)] p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Keep exploring
                    </p>
                    <p className="mt-3 max-w-[30ch] text-sm leading-7 text-[var(--color-muted)]">
                      Android TV and Fire TV share the Android story. Local
                      intelligence has its own clearly labelled research track.
                    </p>
                  </div>
                  <Link
                    className="ft-shell-strong inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-[color:var(--color-accent)] hover:text-[var(--color-accent)]"
                    href="/android"
                    prefetch
                  >
                    Android app and TV
                    <ArrowUpRight aria-hidden="true" size={16} weight="light" />
                  </Link>
                </div>

                <div className="mt-6 grid auto-rows-fr gap-4">
                  {shortcutPages.map((page) => (
                    <ShortcutCard key={page.slug} page={page} />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionHeading
              eyebrow="Feature guide"
              title="The details, when you need them."
              description="Explore the full controls below. Development and experimental features are labelled; support differs by platform and release."
            />
          </Reveal>
          <details className="ft-disclosure ft-shell mt-8 rounded-[2rem] border border-[color:var(--color-line)] p-2">
            <summary className="ft-inset cursor-pointer rounded-[1.5rem] px-6 py-5 font-display text-xl text-[var(--color-ink)]">
              Explore all features
            </summary>
            <div className="grid auto-rows-fr gap-5 px-2 pb-2 pt-5 md:grid-cols-2">
              {homeTechnicalFeatures.map((feature, index) => (
                <Reveal
                  className="h-full"
                  delay={index * 70}
                  key={feature.title}
                >
                  <Panel
                    className="h-full"
                    innerClassName="flex h-full flex-col p-6 md:p-7"
                  >
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      {feature.status || "Core controls"}
                    </p>
                    <h3 className="mt-4 max-w-[18ch] font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                      {feature.description}
                    </p>
                    <p className="mt-auto pt-6 text-[0.72rem] uppercase tracking-[0.2em] text-[var(--color-accent)]">
                      {feature.detail}
                    </p>
                  </Panel>
                </Reveal>
              ))}
            </div>
          </details>
        </div>
      </section>

      <section className="px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionHeading
              eyebrow="Common questions"
              title="Simple answers before you open FilterTube."
              description="Start with the basics. The advanced controls can wait until you need them."
            />
          </Reveal>
          <div className="mt-12 grid auto-rows-fr gap-5 md:grid-cols-2">
            {homeFaqItems.map((item, index) => (
              <Reveal className="h-full" delay={index * 80} key={item.question}>
                <Panel
                  className="h-full"
                  innerClassName="flex h-full flex-col p-6 md:p-7"
                >
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    FAQ
                  </p>
                  <h3 className="mt-4 max-w-[18ch] font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">
                    {item.question}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                    {item.answer}
                  </p>
                </Panel>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionHeading
              eyebrow="User feedback"
              title="The roadmap is being shaped by parents and caregivers."
              description="The strongest feedback has been simple: make the product easier to understand, stronger for family setups, and clearer about what works today."
            />
          </Reveal>

          <div className="mt-12 grid auto-rows-fr gap-5 lg:grid-cols-3">
            {homeUserVoices.map((item, index) => (
              <Reveal className="h-full" delay={index * 80} key={item.title}>
                <a
                  className="group ft-shell block h-full rounded-[2rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5"
                  href={item.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <div className="ft-inset flex h-full flex-col rounded-[calc(2rem-0.5rem)] bg-[var(--color-surface)] p-6 md:p-7">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      {item.source}
                    </p>
                    <h3 className="mt-4 max-w-[18ch] font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                      {item.body}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold text-[var(--color-accent)]">
                      Read source
                      <ArrowUpRight
                        aria-hidden="true"
                        className="transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        size={15}
                        weight="light"
                      />
                    </span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="download" className="px-4 pb-20 pt-4 md:px-6 md:pb-28">
        <div className="ft-shell mx-auto max-w-[1400px] rounded-[2.2rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)]">
          <div className="ft-inset ft-shell-strong relative overflow-hidden rounded-[calc(2.2rem-0.5rem)] px-6 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
            <div className="ft-download-glow absolute inset-0" />
            <div className="relative z-10 grid gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-center">
              <Reveal>
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Get started
                  </p>
                  <h2 className="mt-5 max-w-[14ch] font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl md:leading-[0.98]">
                    Start on Android, iPhone or in your browser.
                  </h2>
                  <p className="mt-5 max-w-[58ch] text-base leading-8 text-[var(--color-muted)]">
                    Choose where you want to watch, add a channel or keyword,
                    and make the experience your own. Android phone and tablet
                    installs are public, the iPhone app installs directly, and
                    there is no FilterTube sign-up.
                  </p>
                  <div className="mt-8 flex flex-col flex-wrap gap-3 sm:flex-row">
                    <ActionLink external href={androidPlayStoreHref}>
                      Get Android app
                    </ActionLink>
                    <ActionLink href="/ios#install" variant="secondary">
                      Install on iPhone
                    </ActionLink>
                    <ActionLink href="/downloads" variant="secondary">
                      Get extension
                    </ActionLink>
                  </div>
                  <p className="mt-5 max-w-[58ch] rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] px-4 py-3 text-sm leading-7 text-[var(--color-muted)]">
                    <span className="font-semibold text-[var(--color-ink)]">iPhone and iPad: </span>
                    trouble on Apple&apos;s side is delaying the App Store version. Until then, install
                    FilterTube with SideStore (recommended) or AltStore. The{" "}
                    <Link className="underline underline-offset-4" href="/ios#install">
                      iPhone guide
                    </Link>{" "}
                    walks you through it.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                      href={docsHref}
                    >
                      Read the docs
                    </a>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <div className="ft-download-rail rounded-[1.8rem] border border-[color:var(--color-line)] p-3 shadow-[0_24px_55px_-36px_rgba(43,34,25,0.22)]">
                  <BrowserLogoRail panel />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
