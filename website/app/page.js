import Link from "next/link";
import { ArrowRight, ArrowUpRight, Play } from "@phosphor-icons/react/ssr";

import { BrowserLogoRail } from "@/components/browser-logo-rail";
import { HeroVideo } from "@/components/hero-video";
import { ActionLink, Panel, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";
import {
  demoVideoHref,
  detailPages,
  docsHref,
  downloadsHref,
  featuredRouteSlugs,
  githubHref,
  heroVideoUrl,
  homeCapabilityCards,
  homeFaqItems,
  homeStoryNotes,
  homeTechnicalFeatures,
  homeUserVoices,
  platformOrder,
  systemSteps,
} from "@/components/route-content";
import { getTonePreset } from "@/components/scenic-tones";

const featuredSpans = [
  "xl:col-span-6",
  "xl:col-span-6",
  "xl:col-span-5",
  "xl:col-span-7",
];

const technicalFeatureSpans = [
  "xl:col-span-5",
  "xl:col-span-7",
  "xl:col-span-6",
  "xl:col-span-6",
  "xl:col-span-4",
  "xl:col-span-8",
  "xl:col-span-7",
  "xl:col-span-5",
  "xl:col-span-6",
  "xl:col-span-6",
  "xl:col-span-12",
  "xl:col-span-12",
];

const featuredPages = featuredRouteSlugs.map((slug) => detailPages[slug]);
const shortcutPages = platformOrder
  .filter((slug) => !featuredRouteSlugs.includes(slug))
  .map((slug) => detailPages[slug]);

function FeaturedPlatformCard({ page, span }) {
  const tone = getTonePreset(page.tone);
  const Icon = page.icon;
  const isDarkTone = page.tone === "ink";
  const headingClass = isDarkTone ? "text-[#fffaf4]" : "text-[#1d1b18]";
  const mutedClass = isDarkTone ? "text-white/82" : "text-[#4f4b45]";
  const eyebrowClass = isDarkTone ? "text-white/70" : "text-[#615c55]";

  return (
    <Link
      className={`group ft-shell block h-full rounded-[2rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${span}`}
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
              className={`flex h-12 w-12 items-center justify-center rounded-[1rem] ${tone.iconShell}`}
            >
              <Icon aria-hidden="true" size={22} weight="light" />
            </div>
            <span
              className={`inline-flex min-h-9 items-center rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.22em] ${tone.accentBadge}`}
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

function QuickGuideSection() {
  return (
    <section className="px-4 py-20 md:px-6 md:py-28 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <SectionHeading
            eyebrow="Quick guide"
            title="Start small, then add family controls only when needed."
            description="This is the parent-friendly path the website now leads with: one block, one refresh, then profiles, imports, or device updates if your setup needs them."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <Reveal>
            <Panel innerClassName="h-full p-6 md:p-7">
              <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Three-minute setup
              </p>
              <div className="mt-7 grid gap-4">
                {[
                  [
                    "1",
                    "Install and open FilterTube",
                    "Use the browser extension first. Android MVP testers can email hello@filtertube.in.",
                  ],
                  [
                    "2",
                    "Block one thing",
                    "Add one channel or one keyword, then refresh YouTube and confirm it hides.",
                  ],
                  [
                    "3",
                    "Add only what you need",
                    "Profiles, PINs, whitelist mode, CSV/TXT/JSON imports, and device updates can wait until the basic rule works.",
                  ],
                ].map(([number, title, body]) => (
                  <div
                    className="grid gap-4 rounded-[1.4rem] border border-[color:var(--color-line)] bg-[color:var(--color-tile)] p-4 sm:grid-cols-[auto_minmax(0,1fr)]"
                    key={number}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] font-mono text-sm font-bold text-[#fff8f1]">
                      {number}
                    </span>
                    <div>
                      <h3 className="font-display text-2xl tracking-[-0.045em] text-[var(--color-ink)]">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={100}>
            <Panel innerClassName="relative h-full overflow-hidden p-6 md:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(171,68,56,0.12),transparent_28%),radial-gradient(circle_at_84%_22%,rgba(158,190,177,0.18),transparent_28%)]" />
              <div className="relative z-10">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Family device updates
                </p>
                <h3 className="mt-4 max-w-[16ch] font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)]">
                  Send rules privately to a verified device.
                </h3>
                <p className="mt-4 max-w-[62ch] text-sm leading-7 text-[var(--color-muted)]">
                  A parent device can pair with a protected device, confirm the
                  safety phrase, then send rules, time, and access. Live P2P
                  works when both devices are open. Optional Home Pickup helps
                  on the same network, and Internet Pickup can let a verified
                  device collect a signed update later.
                </p>

                <div className="mt-7 grid gap-4 md:grid-cols-3">
                  {[
                    ["Live P2P", "Both devices open now"],
                    ["Home Pickup", "Same network, explicit setup"],
                    ["Internet Pickup", "Verified device opens later"],
                  ].map(([title, body]) => (
                    <div
                      className="rounded-[1.25rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-4"
                      key={title}
                    >
                      <p className="font-display text-xl tracking-[-0.045em] text-[var(--color-ink)]">
                        {title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                        {body}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[1.4rem] border border-[color:var(--color-line)] bg-[rgba(255,255,255,0.62)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                      Account & Sync model
                    </p>
                    <span className="rounded-full border border-[color:var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                      parent reviewed
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <span className="rounded-full bg-[var(--color-accent)] px-4 py-3 text-center text-sm font-semibold text-[#fff8f1]">
                      Pair protected device
                    </span>
                    <span className="rounded-full border border-[color:var(--color-line)] px-4 py-3 text-center text-sm font-semibold text-[var(--color-ink)]">
                      Send protected update
                    </span>
                    <span className="rounded-full border border-[color:var(--color-line)] px-4 py-3 text-center text-sm font-semibold text-[var(--color-ink)]">
                      Check saved updates
                    </span>
                  </div>
                </div>
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="system" className="px-4 py-20 md:px-6 md:py-28 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="A simple setup path for non-technical users."
            description="You do not need to understand YouTube internals. Add rules, choose the profile, open YouTube, then adjust when something changes."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="grid gap-5 md:grid-cols-2">
            {systemSteps.map((step, index) => (
              <Reveal delay={index * 90} key={step.title}>
                <Panel innerClassName="h-full p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      0{index + 1}
                    </span>
                    <span className="rounded-full bg-[rgba(171,68,56,0.08)] p-2 text-[var(--color-accent)]">
                      <step.icon aria-hidden="true" size={18} weight="light" />
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                    {step.description}
                  </p>
                </Panel>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <Panel innerClassName="relative overflow-hidden p-7 md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(191,214,202,0.24),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(239,204,189,0.26),transparent_24%)]" />
              <div className="relative z-10">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  If filtering misses something
                </p>
                <h3 className="mt-5 max-w-[14ch] font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)]">
                  Tell the developer when YouTube changes.
                </h3>
                <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">
                  YouTube changes its page structure often. If a rule stops
                  hiding something, that usually means FilterTube needs a small
                  update for the new layout.
                </p>
                <div className="mt-8 space-y-4">
                  <div className="ft-tile rounded-[1.4rem] border border-[color:var(--color-line)] px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      What to send
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      A screenshot, the page type, and the blocked word or
                      channel is usually enough to start debugging.
                    </p>
                  </div>
                  <div className="ft-tile rounded-[1.4rem] border border-[color:var(--color-line)] px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Where to send it
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      Email hello@filtertube.in, open a GitHub issue, or comment
                      wherever you already found FilterTube.
                    </p>
                  </div>
                  <div className="ft-tile rounded-[1.4rem] border border-[color:var(--color-line)] px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      What stays private
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      Do not send private family rules unless you choose to. A
                      small example is usually enough.
                    </p>
                  </div>
                </div>
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[100dvh] overflow-hidden px-4 pb-12 pt-28 md:px-6 md:pb-20 md:pt-36">
        <HeroVideo src={heroVideoUrl} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_30%,rgba(18,16,20,0.12)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(11,14,18,0.08))]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <Reveal className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-[1180px] flex-col justify-between pb-4 pt-6 text-center md:pb-6 md:pt-10">
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="mx-auto inline-flex min-h-11 items-center gap-3 rounded-full border border-white/30 bg-[rgba(13,18,27,0.2)] px-4 py-2 text-sm font-medium text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1f2430]">
                  Live now
                </span>
                <span className="text-pretty">
                  Desktop extensions are live. The MVP Android phone/tablet
                  app is open for internal testing by request.
                </span>
              </div>

              <div className="mx-auto mt-10 max-w-[1180px]">
                <p className="text-balance font-display text-[clamp(3rem,6.8vw,5.8rem)] font-medium tracking-[-0.09em] text-[#fffdf8] drop-shadow-[0_16px_36px_rgba(0,0,0,0.3)]">
                  Filtering that keeps your
                </p>
                <h1 className="mt-3 text-balance font-editorial text-[clamp(5rem,11vw,9.1rem)] leading-[0.88] text-[#fffdf8] drop-shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
                  feed calm by default
                </h1>
              </div>

              <p className="ft-hero-support-copy relative mx-auto mt-6 max-w-[800px] text-pretty px-4 text-[17px] font-medium leading-8 md:text-[18px]">
                <span className="font-semibold text-white">
                  A calmer YouTube for families and focused users
                </span>{" "}
                without needing a technical setup. Block{" "}
                <span className="ft-hero-support-emphasis">
                  channels, keywords, Shorts, and comments
                </span>{" "}
                from one dashboard, then help test the MVP app while the fully
                custom control app is being built.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
                  className="group inline-flex min-h-11 items-center gap-3 overflow-visible whitespace-nowrap rounded-full border border-white/30 bg-[rgba(255,255,255,0.12)] px-6 py-3 text-sm font-semibold text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.18)] active:translate-y-px active:scale-[0.98]"
                  href="mailto:hello@filtertube.in?subject=Android%20MVP%20testing%20access"
                >
                  Ask for Android testing access
                </a>
              </div>
              <p className="mt-4 max-w-[680px] px-4 text-sm font-medium leading-7 text-white/86">
                Email hello@filtertube.in to join Android internal testing. The
                current MVP is WebView-based for control validation; a more
                native custom frontend is being built in parallel. iPhone and
                iPad follow the App Store/TestFlight path separately.
              </p>
            </div>

            <div className="mx-auto w-full max-w-[1080px] pt-14 md:pt-20 lg:pt-24">
              <BrowserLogoRail muted />
              <div className="mx-auto mt-6 flex max-w-[920px] flex-wrap items-center justify-center gap-3 text-sm text-white/88">
                <span className="rounded-full border border-white/24 bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl">
                  Kids Mode
                </span>
                <span className="rounded-full border border-white/24 bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl">
                  Hide Shorts
                </span>
                <span className="rounded-full border border-white/24 bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl">
                  Whitelist mode
                </span>
                <span className="rounded-full border border-white/24 bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl">
                  PIN locked profiles
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <QuickGuideSection />

      <HowItWorksSection />

      <section id="story" className="px-4 py-20 md:px-6 md:py-28 lg:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="Start here"
              title="Block the YouTube content you do not want to keep seeing."
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
                      Browser extension
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      Chrome, Firefox, Edge, Brave, and Opera-friendly paths
                      are ready for daily use.
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
                      Use whitelist mode for trusted channels only, or hide
                      Shorts when scrolling is the main problem.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,#18202a,#10161d)] p-5 text-[#f8f6f2] shadow-[0_24px_48px_-34px_rgba(4,8,14,0.7)]">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/72">
                      Apps next
                    </p>
                    <p className="mt-3 font-display text-3xl tracking-[-0.05em] text-[#fffaf4]">
                      Phone, tablet, TV
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/84">
                      Dedicated apps will carry the same rules and profiles to
                      more screens.
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
              description="Most people can start with a blocklist. Families can add profiles, PINs, whitelist mode, and device updates as the setup grows."
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
              title="Desktop works today. Phone and tablet control is next."
              description="The browser extension is the live product. The app work extends the same rules, profiles, and parent controls to more places."
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
                      Choose a screen
                    </p>
                    <p className="mt-3 max-w-[30ch] text-sm leading-7 text-[var(--color-muted)]">
                      Pick the screen that matters most and see what works now,
                      what is in testing, and what is planned next.
                    </p>
                  </div>
                  <Link
                    className="ft-shell-strong inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-[color:var(--color-accent)] hover:text-[var(--color-accent)]"
                    href="/mobile"
                    prefetch
                  >
                    Start with phone and tablet
                    <ArrowUpRight aria-hidden="true" size={16} weight="light" />
                  </Link>
                </div>

                <div className="mt-6 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              eyebrow="Everyday controls"
              title="A plain-language map of the controls inside FilterTube."
              description="These are the settings people use most: rules, profiles, backups, imports, dates, and device updates."
            />
          </Reveal>
          <div className="mt-12 grid auto-rows-fr gap-5 xl:grid-cols-12">
            {homeTechnicalFeatures.map((feature, index) => (
              <Reveal
                className={technicalFeatureSpans[index]}
                delay={index * 70}
                key={feature.title}
              >
                <Panel
                  className="h-full"
                  innerClassName="flex h-full flex-col p-6 md:p-7"
                >
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Current feature
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
                  <h2 className="mt-5 max-w-[12ch] font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl md:leading-[0.98]">
                    Install the extension, then block one thing first.
                  </h2>
                  <p className="mt-5 max-w-[58ch] text-base leading-8 text-[var(--color-muted)]">
                    The safest first step is small: add one keyword or channel,
                    refresh YouTube, and confirm it works. Then build profiles,
                    PINs, imports, or family device updates around that.
                    Android users can also email hello@filtertube.in for MVP
                    internal testing access.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <ActionLink external href={demoVideoHref}>
                      Watch the demo
                    </ActionLink>
                    <ActionLink external href={docsHref} variant="secondary">
                      Read the docs
                    </ActionLink>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionLink href={downloadsHref} variant="secondary">
                      Open downloads
                    </ActionLink>
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
