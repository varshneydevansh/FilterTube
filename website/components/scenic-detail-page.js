import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CaretRight,
} from "@phosphor-icons/react/ssr";

import { ActionLink, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";
import { ScenicIllustration } from "@/components/scenic-illustration";
import { getTonePreset } from "@/components/scenic-tones";

function formatRelatedTitles(relatedPages) {
  if (relatedPages.length === 0) {
    return "";
  }
  if (relatedPages.length === 1) {
    return relatedPages[0].navTitle;
  }
  if (relatedPages.length === 2) {
    return `${relatedPages[0].navTitle} and ${relatedPages[1].navTitle}`;
  }

  return `${relatedPages
    .slice(0, -1)
    .map((relatedPage) => relatedPage.navTitle)
    .join(", ")}, and ${relatedPages.at(-1).navTitle}`;
}

function RelatedCard({ relatedPage }) {
  const tone = getTonePreset(relatedPage.tone);
  const RelatedIcon = relatedPage.icon;
  const isDarkTone = relatedPage.tone === "ink";
  const headingClass = isDarkTone ? "text-[#fffaf4]" : "text-[#1d1b18]";
  const mutedClass = isDarkTone ? "text-white/82" : "text-[#4f4b45]";
  const eyebrowClass = isDarkTone ? "text-white/70" : "text-[#615c55]";

  return (
    <Link
      className="group ft-shell block rounded-[1.9rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1"
      href={`/${relatedPage.slug}`}
    >
      <div
        className={`ft-inset relative overflow-hidden rounded-[calc(1.9rem-0.5rem)] p-6 ${tone.surface}`}
      >
        <div className={`absolute inset-0 ${tone.heroBackdrop} opacity-75`} />
        <div
          className={`absolute -left-8 top-6 h-24 w-24 rounded-full blur-3xl ${tone.primaryOrb}`}
        />
        <div
          className={`absolute -right-6 bottom-0 h-28 w-28 rounded-full blur-3xl ${tone.secondaryOrb}`}
        />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-[1rem] ${tone.iconShell}`}
            >
              <RelatedIcon aria-hidden="true" size={22} weight="light" />
            </div>
            <span
              className={`inline-flex min-h-9 items-center rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.22em] ${tone.accentBadge}`}
            >
              {relatedPage.status}
            </span>
          </div>
          <p className={`mt-5 text-[0.72rem] uppercase tracking-[0.22em] ${eyebrowClass}`}>
            {relatedPage.eyebrow}
          </p>
          <h3
            className={`mt-3 max-w-[14ch] text-balance font-display text-3xl tracking-[-0.05em] ${headingClass}`}
          >
            {relatedPage.titleDisplay}
          </h3>
          <p className={`mt-4 max-w-[34ch] text-sm leading-7 ${mutedClass}`}>
            {relatedPage.routeSummary}
          </p>
          <span className={`mt-6 inline-flex items-center gap-2 text-sm font-medium ${headingClass}`}>
            See details
            <CaretRight
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

export function ScenicDetailPage({ page, relatedPages }) {
  const tone = getTonePreset(page.tone);
  const Icon = page.icon;
  const isDark = page.tone === "ink";
  const headingText = isDark ? "text-[#fffaf4]" : "text-[#1d1b18]";
  const mutedText = isDark ? "text-white/82" : "text-[#4f4b45]";
  const eyebrowText = isDark ? "text-white/70" : "text-[#615c55]";
  const milestoneEyebrow = isDark ? "Available now and next" : "What matters most";
  const milestoneCardTitle = "What is live and what comes next";
  const shellClass = isDark
    ? "ft-shell ring-1 ring-white/12 shadow-[0_26px_60px_-40px_rgba(0,0,0,0.45)]"
    : "ft-shell ring-1 ring-[color:var(--color-line)] shadow-[0_26px_60px_-40px_rgba(63,46,34,0.24)]";
  const cardLineClass = "border-[color:var(--color-line)]";
  const scenicTileClass = isDark
    ? "border-white/16 bg-[rgba(15,21,29,0.9)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    : "border-black/8 bg-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.58)]";
  const secondaryActionClass = isDark
    ? "border-white/16 bg-[rgba(16,22,30,0.82)] text-[#fffaf4] hover:border-white/28 hover:bg-[rgba(24,31,41,0.96)]"
    : "";
  const relatedSummary = formatRelatedTitles(relatedPages);

  return (
    <>
      <section className="relative isolate min-h-[100dvh] overflow-hidden px-4 pb-20 pt-28 md:px-6 md:pb-24 md:pt-36">
        <div className={`absolute inset-0 ${tone.heroBackdrop}`} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_26%,rgba(255,255,255,0.08)_100%)]" />
        <div
          className={`absolute -left-20 top-16 h-56 w-56 rounded-full blur-[100px] ${tone.primaryOrb}`}
        />
        <div
          className={`absolute right-0 top-20 h-72 w-72 rounded-full blur-[130px] ${tone.secondaryOrb}`}
        />
        <div className="absolute inset-x-0 bottom-0 h-[34vh] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.82),transparent_72%)]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-end">
            <Reveal>
              <div className="max-w-[42rem]">
                <Link
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:translate-y-px active:scale-[0.98] ${
                    isDark
                      ? "border-white/14 bg-[color:var(--color-glass)] text-white/78 hover:bg-[color:var(--color-glass-strong)]"
                      : "border-[color:var(--color-line)] ft-shell-strong text-[var(--color-ink)] hover:bg-[color:var(--color-tile)]"
                  }`}
                  href="/#platforms"
                >
                  <ArrowLeft aria-hidden="true" size={16} weight="light" />
                  Back to platforms
                </Link>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex min-h-9 items-center rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.22em] ${tone.accentBadge}`}
                  >
                    {page.status}
                  </span>
                  <span className={`text-[0.72rem] uppercase tracking-[0.22em] ${eyebrowText}`}>
                    {page.eyebrow}
                  </span>
                </div>
                <p
                  className={`mt-8 text-pretty font-display text-[clamp(2.75rem,5.3vw,5.4rem)] font-medium tracking-[-0.07em] ${headingText}`}
                >
                  {page.titleLead}
                </p>
                <h1
                  className={`mt-2 text-balance font-editorial text-[clamp(4rem,9.6vw,7.4rem)] leading-[0.92] ${tone.accentText}`}
                >
                  {page.titleDisplay}
                </h1>
                <p className={`mt-6 max-w-[40rem] text-base leading-8 md:text-lg ${mutedText}`}>
                  {page.description}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {page.chips.map((chip) => (
                    <span
                      className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-[0.74rem] uppercase tracking-[0.2em] ${tone.chip}`}
                      key={chip}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <ActionLink
                    external={page.primaryCta.external}
                    href={page.primaryCta.href}
                  >
                    {page.primaryCta.label}
                  </ActionLink>
                  <ActionLink
                    className={secondaryActionClass}
                    external={page.secondaryCta.external}
                    href={page.secondaryCta.href}
                    variant="secondary"
                  >
                    {page.secondaryCta.label}
                  </ActionLink>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className={`rounded-[2.3rem] p-2 ${shellClass}`}>
                <div
                  className={`ft-inset relative overflow-hidden rounded-[calc(2.3rem-0.5rem)] p-5 md:p-6 ${tone.surface}`}
                >
                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-[1.2rem] ${tone.iconShell}`}
                        >
                          <Icon aria-hidden="true" size={26} weight="light" />
                        </div>
                        <div>
                          <p className={`text-[0.72rem] uppercase tracking-[0.22em] ${eyebrowText}`}>
                            {page.previewLabel}
                          </p>
                          <p className={`mt-2 text-sm font-medium ${headingText}`}>
                            {page.navTitle}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex min-h-10 items-center rounded-full px-4 py-2 text-[0.7rem] uppercase tracking-[0.22em] ${tone.accentBadge}`}
                      >
                        {page.status}
                      </span>
                    </div>

                    <div className="mt-5">
                      <ScenicIllustration
                        className="min-h-[22rem] md:min-h-[24rem]"
                        label={page.previewLabel}
                        subtitle={page.routeSummary}
                        title={page.previewTitle}
                        variant={page.slug}
                      />
                    </div>

                    <div className="mt-5 grid auto-rows-fr gap-4 md:grid-cols-3">
                      {page.previewRows.map((row) => (
                        <div
                          className={`grid h-full gap-3 rounded-[1.5rem] border p-4 ${cardLineClass} ${scenicTileClass}`}
                          key={row.label}
                        >
                          <p className={`text-[0.72rem] uppercase tracking-[0.22em] ${eyebrowText}`}>
                            {row.label}
                          </p>
                          <p className={`text-sm font-semibold uppercase tracking-[0.12em] ${headingText}`}>
                            {row.value}
                          </p>
                          <p className={`text-sm leading-7 ${mutedText}`}>{row.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionHeading
              description={page.milestoneIntro}
              eyebrow={page.eyebrow}
              title={page.milestoneTitle}
            />
          </Reveal>

          <div className="mt-12 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="grid gap-5 md:grid-cols-2">
              {page.featureCards.map((card, index) => (
                <Reveal delay={index * 90} key={card.title}>
                  <div className="ft-shell rounded-[1.9rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)]">
                    <div
                      className={`ft-inset relative h-full overflow-hidden rounded-[calc(1.9rem-0.5rem)] p-6 md:p-7 ${tone.surface}`}
                    >
                      <div className={`absolute inset-0 ${tone.heroBackdrop} opacity-58`} />
                      <div
                        className={`absolute -left-8 top-6 h-24 w-24 rounded-full blur-3xl ${tone.primaryOrb}`}
                      />
                      <div className="relative z-10">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-[1rem] ${tone.iconShell}`}
                        >
                          <Icon aria-hidden="true" size={20} weight="light" />
                        </div>
                        <h3
                          className={`mt-6 max-w-[15ch] text-balance font-display text-3xl tracking-[-0.05em] ${headingText}`}
                        >
                          {card.title}
                        </h3>
                        <p className={`mt-4 text-sm leading-7 ${mutedText}`}>
                          {card.body}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120}>
              <div className={`rounded-[2rem] p-2 ${shellClass}`}>
                <div
                  className={`ft-inset rounded-[calc(2rem-0.5rem)] p-6 md:p-8 ${tone.surface}`}
                >
                  <p className={`text-[0.72rem] uppercase tracking-[0.22em] ${eyebrowText}`}>
                    {milestoneEyebrow}
                  </p>
                  <h3
                    className={`mt-5 max-w-[14ch] text-balance font-display text-4xl tracking-[-0.06em] ${headingText}`}
                  >
                    {milestoneCardTitle}
                  </h3>
                  <ul className="mt-8 space-y-4">
                    {page.milestones.map((milestone) => (
                      <li
                        className={`flex gap-3 rounded-[1.3rem] border px-4 py-4 text-sm leading-7 ${cardLineClass} ${scenicTileClass} ${
                          isDark ? "text-white/84" : "text-[#4f4b45]"
                        }`}
                        key={milestone}
                      >
                        <span
                          className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                            isDark ? "bg-white/72" : "bg-[var(--color-accent)]"
                          }`}
                        />
                        <span>{milestone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {relatedPages.length ? (
        <section className="px-4 pb-20 pt-2 md:px-6 md:pb-28">
          <div className="mx-auto max-w-[1400px]">
            <Reveal>
              <SectionHeading
                eyebrow="Keep exploring"
                title="Keep exploring FilterTube."
                description={
                  relatedSummary
                    ? `From here, continue with ${relatedSummary}.`
                    : "Continue with the next FilterTube overview that fits your setup."
                }
              />
            </Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {relatedPages.map((relatedPage, index) => (
                <Reveal delay={index * 80} key={relatedPage.slug}>
                  <RelatedCard relatedPage={relatedPage} />
                </Reveal>
              ))}
            </div>
            <Reveal delay={120}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  className="ft-shell-strong inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[color:var(--color-tile)]"
                  href="/#platforms"
                >
                  See the full platform overview
                  <ArrowUpRight aria-hidden="true" size={16} weight="light" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}
    </>
  );
}
