import Link from "next/link";
import { ArrowRight, ArrowUpRight, Play } from "@phosphor-icons/react/ssr";

import { BrowserLogoRail } from "@/components/browser-logo-rail";
import { ActionLink, Panel, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";
import {
  demoVideoHref,
  detailPages,
  docsHref,
  extensionInstallHref,
  featuredRouteSlugs,
  githubHref,
  heroVideoUrl,
  homeCapabilityCards,
  homeFaqItems,
  homeStoryNotes,
  homeTechnicalFeatures,
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

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[100dvh] overflow-hidden px-4 pb-12 pt-28 md:px-6 md:pb-20 md:pt-36">
        <video
          aria-hidden="true"
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted
          playsInline
          preload="auto"
          src={heroVideoUrl}
        />
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
                  Extensions are available today. Dedicated mobile, iPad, and TV
                  apps are being shaped next.
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
                  Local-first YouTube filtering
                </span>{" "}
                for families, students, and focused households. Block{" "}
                <span className="ft-hero-support-emphasis">
                  channels, keywords, Shorts, and comments
                </span>{" "}
                before noisy surfaces render.
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
                    See how FilterTube works
                  </span>
                </a>
              </div>
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

      <section id="story" className="px-4 py-20 md:px-6 md:py-28 lg:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="Why FilterTube exists"
              title="It started with a parent asking for a basic safety control that never arrived."
              description="The origin story matters because it explains the product tone. FilterTube was built to answer a real family request, not to turn attention safety into generic AI marketing."
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
                    Origin thread
                  </p>
                  <a
                    className="ft-shell-strong inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-[color:var(--color-accent)] hover:text-[var(--color-accent)] active:translate-y-px active:scale-[0.99]"
                    href="https://support.google.com/youtubekids/thread/54509605/how-to-block-videos-by-keyword-or-tag?hl=en"
                    rel="noreferrer"
                    target="_blank"
                  >
                    View the locked support thread
                    <ArrowUpRight aria-hidden="true" size={16} weight="light" />
                  </a>
                </div>

                <blockquote className="mt-8 max-w-[17ch] font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl md:leading-[0.96]">
                  Parents needed a way to protect attention and safety without
                  waiting for the platform to care first.
                </blockquote>

                <div className="mt-10 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.5rem] bg-[var(--color-panel)] p-5">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Live today
                    </p>
                    <p className="mt-3 font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">
                      Desktop release
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      Chrome, Firefox, Edge, Brave, and Opera-friendly release
                      paths are already part of the public product.
                    </p>
                  </div>
                  <div className="ft-tile rounded-[1.5rem] p-5 ring-1 ring-[color:var(--color-line)]">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Strongest controls
                    </p>
                    <p className="mt-3 font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">
                      Kids + Shorts
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      Whitelist mode, profile separation, and Shorts filtering
                      remain some of the clearest reasons to trust the system.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,#18202a,#10161d)] p-5 text-[#f8f6f2] shadow-[0_24px_48px_-34px_rgba(4,8,14,0.7)]">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/72">
                      Coming next
                    </p>
                    <p className="mt-3 font-display text-3xl tracking-[-0.05em] text-[#fffaf4]">
                      Mobile, iPad, TV
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/84">
                      Dedicated apps extend FilterTube into calmer control
                      surfaces without breaking the system people can already
                      use today.
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
              eyebrow="What already works"
              title="FilterTube already does more than most people expect."
              description="The current product already covers pre-render filtering, family-safe rule control, Shorts reduction, and a local-first foundation built to stay readable."
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
              eyebrow="Platform map"
              title="One serene brand, adapted to different screens and reading distances."
              description="FilterTube is growing from today’s desktop release into dedicated mobile, iPad, TV, Kids, and local intelligence experiences."
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
                      Choose a device
                    </p>
                    <p className="mt-3 max-w-[30ch] text-sm leading-7 text-[var(--color-muted)]">
                      Pick the device that matters most and see what is
                      available today, what is planned next, and how it fits the
                      broader FilterTube system.
                    </p>
                  </div>
                  <Link
                    className="ft-shell-strong inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-[color:var(--color-accent)] hover:text-[var(--color-accent)]"
                    href="/mobile"
                  >
                    Start with the mobile overview
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

      <section id="system" className="px-4 py-20 md:px-6 md:py-28 lg:py-32">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionHeading
              eyebrow="System language"
              title="A calm experience still needs a clear system underneath it."
              description="FilterTube works because the filtering system is deliberate. The site can stay serene while still showing how interception, rules, and fallback cleanup fit together."
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
                        <step.icon
                          aria-hidden="true"
                          size={18}
                          weight="light"
                        />
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
                    Readability
                  </p>
                  <h3 className="mt-5 max-w-[14ch] font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)]">
                    Calm design should still feel clear.
                  </h3>
                  <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">
                    FilterTube keeps key controls, family-safe signals, and
                    product direction easy to scan across desktop, tablet,
                    phone, and TV.
                  </p>
                  <div className="mt-8 space-y-4">
                    <div className="ft-tile rounded-[1.4rem] border border-[color:var(--color-line)] px-4 py-4">
                      <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                        Clear emphasis
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                        Important details like Shorts, Kids mode, and active
                        protection can stand out without making the whole
                        product feel loud.
                      </p>
                    </div>
                    <div className="ft-tile rounded-[1.4rem] border border-[color:var(--color-line)] px-4 py-4">
                      <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                        Readable at every distance
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                        Whether someone is checking a phone in one hand or
                        reading from the sofa, key details stay easy to read.
                      </p>
                    </div>
                    <div className="ft-tile rounded-[1.4rem] border border-[color:var(--color-line)] px-4 py-4">
                      <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                        Clear about what is live
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                        Current features stay distinct from upcoming apps and
                        the local ML track, so people can tell what works today
                        and what still belongs to the roadmap.
                      </p>
                    </div>
                  </div>
                </div>
              </Panel>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionHeading
              eyebrow="Technical features"
              title="Verified product capabilities available today."
              description="A clear view of what FilterTube already provides now, before the app family expands further."
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
              eyebrow="Questions people actually ask"
              title="Plain answers for what families and focused users actually need to know."
              description="What ships now, what stays local, and what still belongs to the roadmap."
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

      <section id="download" className="px-4 pb-20 pt-4 md:px-6 md:pb-28">
        <div className="ft-shell mx-auto max-w-[1400px] rounded-[2.2rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)]">
          <div className="ft-inset ft-shell-strong relative overflow-hidden rounded-[calc(2.2rem-0.5rem)] px-6 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
            <div className="ft-download-glow absolute inset-0" />
            <div className="relative z-10 grid gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-center">
              <Reveal>
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Download and watch
                  </p>
                  <h2 className="mt-5 max-w-[12ch] font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl md:leading-[0.98]">
                    Available now on desktop, with more on the way.
                  </h2>
                  <p className="mt-5 max-w-[58ch] text-base leading-8 text-[var(--color-muted)]">
                    Use FilterTube today on desktop browsers, watch the live
                    product demo, or read the public docs while the dedicated
                    app family continues to take shape.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <ActionLink external href={demoVideoHref}>
                      Watch the current demo
                    </ActionLink>
                    <ActionLink external href={docsHref} variant="secondary">
                      Read the documentation
                    </ActionLink>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionLink external href={githubHref} variant="secondary">
                      View the GitHub repo
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
