import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CaretRight,
} from "@phosphor-icons/react/ssr";

import { ActionLink, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";
import { BrowserLogoRail } from "@/components/browser-logo-rail";
import { ScreenshotCarousel } from "@/components/screenshot-carousel";
import { AppScreenStack } from "@/components/app-screen-stack";
import { CapturePending } from "@/components/capture-pending";
import { HeroVideo } from "@/components/hero-video";
import { getTonePreset } from "@/components/scenic-tones";

function RelatedCard({ relatedPage }) {
  const tone = getTonePreset(relatedPage.tone);
  const isDarkTone = relatedPage.tone === "ink";
  const headingClass = isDarkTone ? "text-[#fffaf4]" : "text-[#1d1b18]";
  const mutedClass = isDarkTone ? "text-white/82" : "text-[#4f4b45]";

  return (
    <Link
      data-tone={relatedPage.tone}
      className="group ft-shell ft-platform-theme block rounded-[1.9rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1"
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
            <span
              className={`ft-platform-badge inline-flex min-h-9 items-center rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.22em] ${tone.accentBadge}`}
            >
              {relatedPage.status}
            </span>
          </div>
          <h3
            className={`mt-5 max-w-[14ch] text-balance font-display text-3xl tracking-[-0.05em] ${headingClass}`}
          >
            {relatedPage.navTitle}
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

export function ScenicDetailPage({ page, relatedPages, children = null }) {
  const tone = getTonePreset(page.tone);
  const isDark = page.tone === "ink";
  const headingText = isDark ? "text-[#fffaf4]" : "text-[#1d1b18]";
  const mutedText = isDark ? "text-white/82" : "text-[#4f4b45]";
  const eyebrowText = isDark ? "text-white/70" : "text-[#615c55]";
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
  const hasHeroVideo = Boolean(page.heroVideo?.src);
  const heroArtworks = page.heroArtworks || (page.heroArtwork ? [page.heroArtwork] : []);
  const hasHeroScreens = Boolean(page.heroScreens?.length);

  return (
    <>
      <section data-tone={page.tone} className={`ft-platform-theme relative isolate min-h-[100dvh] overflow-hidden px-4 pb-20 pt-28 md:px-6 md:pb-24 md:pt-36 ${hasHeroScreens ? "ft-app-hero" : ""}`}>
        <div className={`absolute inset-0 ${tone.heroBackdrop}`} />
        {hasHeroVideo ? (
          <HeroVideo
            poster={page.heroVideo.poster}
            showControls
            src={page.heroVideo.src}
          />
        ) : null}
        <div
          className={
            hasHeroVideo && hasHeroScreens
              ? "ft-app-hero-wash absolute inset-0"
              : hasHeroVideo
              ? "absolute inset-0 bg-[radial-gradient(circle_at_34%_34%,rgba(255,255,255,0.78),rgba(255,255,255,0.48)_34%,rgba(255,255,255,0.18)_58%,rgba(255,255,255,0.08)_100%),linear-gradient(90deg,rgba(255,255,255,0.86),rgba(255,255,255,0.48)_48%,rgba(255,255,255,0.18)_100%)]"
              : "absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_26%,rgba(255,255,255,0.08)_100%)]"
          }
        />
        <div
          className={`absolute -left-20 top-16 h-56 w-56 rounded-full blur-[100px] ${tone.primaryOrb}`}
        />
        <div
          className={`absolute right-0 top-20 h-72 w-72 rounded-full blur-[130px] ${tone.secondaryOrb}`}
        />
        <div className="absolute inset-x-0 bottom-0 h-[34vh] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.82),transparent_72%)]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className={`grid items-center gap-10 lg:gap-14 ${
            hasHeroScreens || heroArtworks.length > 0
              ? "lg:grid-cols-[minmax(0,0.98fr)_minmax(22rem,0.72fr)]"
              : ""
          }`}>
            <Reveal>
              <div className="max-w-[58rem]">
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
                    className={`ft-platform-badge inline-flex min-h-9 items-center rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.22em] ${tone.accentBadge}`}
                  >
                    {page.status}
                  </span>
                </div>
                {/* One h1 holds the whole headline ("Your viewing, your rules on Android"), so the
                    heading names the page; the two spans keep the two-line look. */}
                <h1 className="mt-8">
                  <span
                    className={`block text-pretty font-display text-[clamp(2.75rem,5.3vw,5.4rem)] font-medium tracking-[-0.07em] ${headingText}`}
                  >
                    {page.titleLead}
                  </span>{" "}
                  <span
                    className={`mt-2 block text-balance font-editorial text-[clamp(4rem,9.6vw,7.4rem)] leading-[0.92] ${tone.accentText}`}
                  >
                    {page.titleDisplay}
                  </span>
                </h1>
                <p className={`mt-6 max-w-[44rem] text-base leading-8 md:text-lg ${mutedText}`}>
                  {page.description}
                </p>
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
                {page.deviceSyncHref ? (
                  <a
                    className={`mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 ${headingText}`}
                    href={page.deviceSyncHref}
                  >
                    Connect your devices
                    <ArrowUpRight aria-hidden="true" size={16} weight="light" />
                  </a>
                ) : null}
              </div>
            </Reveal>
            {hasHeroScreens ? (
              <AppScreenStack layout={page.heroScreensLayout} label={page.heroScreensLabel} screens={page.heroScreens} />
            ) : heroArtworks.length > 0 ? (
              <Reveal delay={120}>
                <div
                  className={`relative mx-auto flex w-full max-w-[34rem] items-center justify-center ${
                    heroArtworks.length > 1
                      ? "min-h-[15rem] sm:min-h-[19rem] lg:min-h-[30rem]"
                      : "min-h-[13rem] sm:min-h-[18rem] lg:min-h-[32rem]"
                  }`}
                  aria-label="Platform artwork"
                >
                  <div className={`absolute inset-[12%] rounded-full blur-[70px] ${tone.primaryOrb} opacity-55`} />
                  {heroArtworks.map((artwork, index) => (
                    <img
                      alt={artwork.alt}
                      className={`relative z-10 object-contain drop-shadow-[0_32px_42px_rgba(30,38,44,0.24)] ${
                        heroArtworks.length > 1
                          ? index === 0
                            ? "mr-[-8%] h-auto w-[58%] -rotate-3"
                            : "ml-[-8%] h-auto w-[58%] rotate-3"
                          : "h-auto w-[min(88%,31rem)]"
                      }`}
                      key={artwork.src}
                      src={artwork.src}
                    />
                  ))}
                </div>
              </Reveal>
            ) : null}
          </div>
        </div>
        {page.slug === "extension" ? (
          <div className="relative z-10 -mx-4 mt-12 md:-mx-6">
            <BrowserLogoRail carousel />
            <p className="mx-auto mt-3 max-w-[1400px] px-4 text-xs leading-6 text-[var(--color-hero-muted)] md:px-6">Compatibility varies by browser and version. Arc is for existing desktop users.</p>
          </div>
        ) : null}
      </section>

      {children}

      {page.appPreview ? (
        <section className="px-4 py-10 md:px-6 md:py-16">
          <div className="mx-auto max-w-[1400px]">
            <Reveal>
              <div className="ft-shell grid items-center gap-6 rounded-[2rem] border border-[color:var(--color-line)] p-3 shadow-[var(--shadow-diffuse)] lg:grid-cols-[minmax(16rem,0.55fr)_minmax(0,1.45fr)] lg:p-5">
                <div className="px-3 py-5 md:px-6 lg:py-6">
                  <h2 className="max-w-[16ch] text-balance font-display text-3xl tracking-[-0.055em] text-[var(--color-ink)] md:text-4xl">
                    {page.appPreview.title}
                  </h2>
                  <p className="mt-4 max-w-[42ch] text-base leading-8 text-[var(--color-muted)]">
                    {page.appPreview.body}
                  </p>
                  <a
                    className="ft-action-secondary mt-6 inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                    href={page.appPreview.watchHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Watch the demo
                    <ArrowUpRight aria-hidden="true" size={16} weight="light" />
                  </a>
                </div>
                <div className="overflow-hidden rounded-[1.5rem] border border-[color:var(--color-line)] bg-[#0b111b] shadow-[0_28px_62px_-34px_rgba(8,12,20,0.7)]">
                  <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="aspect-video h-auto w-full"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={page.appPreview.embedHref}
                    title="FilterTube mobile app preview"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {page.screenshotRails?.length ? (
        <section className="py-10 md:py-16" aria-label={page.screenshotsLabel || "App screenshots"}>
          <div className="mx-auto max-w-[1400px] px-4 md:px-6">
            <Reveal>
              <SectionHeading
                title={page.screenshotsTitle}
                description={page.screenshotsDescription}
              />
            </Reveal>
          </div>
          {page.screenshotRails.map((rail) => (
            <div className="mt-12" id={rail.id} key={rail.id}>
              <div className="mx-auto mb-4 flex max-w-[1400px] items-baseline justify-between gap-4 px-4 md:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">{rail.label}</p>
                {rail.status ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">{rail.status}</p> : null}
              </div>
              {rail.screenshots.length ? (
                <ScreenshotCarousel label={`${rail.label} screenshots`} layout={rail.layout} screenshots={rail.screenshots} />
              ) : (
                <div className="px-4 md:px-6">
                  <CapturePending device={rail.device || rail.label} layout="rail" />
                </div>
              )}
            </div>
          ))}
        </section>
      ) : page.screenshots?.length ? (
        <section className="py-10 md:py-16" aria-label={page.screenshotsLabel || "Android app screenshots"}>
          <div className="mx-auto max-w-[1400px] px-4 md:px-6">
            <Reveal>
              <SectionHeading
                title={page.screenshotsTitle}
                description={page.screenshotsDescription}
              />
            </Reveal>
          </div>
          <div className="mt-10">
            <ScreenshotCarousel
              label={page.screenshotsLabel || "Android development screenshots"}
              layout={page.screenshotsLayout}
              screenshots={page.screenshots}
            />
          </div>
        </section>
      ) : null}

      <section className="px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionHeading
              description={page.milestoneIntro}
              title={page.milestoneTitle}
            />
          </Reveal>

          <div className="mt-12 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className={page.exploreGroups ? "space-y-6" : "grid gap-5 md:grid-cols-2"}>
              {page.featureCards.map((card, index) => (
                <Reveal delay={index * 90} key={card.title}>
                  <div id={card.id} className="ft-shell rounded-[1.9rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)]">
                    <div
                      className={`ft-inset relative h-full overflow-hidden rounded-[calc(1.9rem-0.5rem)] p-6 md:p-7 ${tone.surface}`}
                    >
                      <div className={`absolute inset-0 ${tone.heroBackdrop} opacity-58`} />
                      <div
                        className={`absolute -left-8 top-6 h-24 w-24 rounded-full blur-3xl ${tone.primaryOrb}`}
                      />
                      <div className="relative z-10">
                        {card.status ? (
                          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${eyebrowText}`}>
                            {card.status}
                          </p>
                        ) : null}
                        <h3
                          className={`${card.status ? "mt-6 " : ""}max-w-[15ch] text-balance font-display text-3xl tracking-[-0.05em] ${headingText}`}
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
              {page.exploreGroups?.length ? (
                <div className="ft-shell rounded-[1.9rem] border border-[color:var(--color-line)] p-5 md:p-7">
                  <h3 className={`font-display text-3xl tracking-[-0.05em] ${headingText}`}>{page.exploreTitle}</h3>
                  {page.exploreDescription ? <p className={`mt-3 text-sm leading-7 ${mutedText}`}>{page.exploreDescription}</p> : null}
                  <div className="mt-6 space-y-3">
                    {page.exploreGroups.map((group) => (
                      <div id={group.id} key={group.id}>
                        <details className={`ft-disclosure rounded-[1.2rem] border p-4 md:p-5 ${cardLineClass} ${scenicTileClass}`}>
                          <summary className={`cursor-pointer font-semibold ${headingText}`}>
                            <span>{group.title}</span>
                            {group.status ? (
                              <span className={`mt-2 block text-xs font-semibold uppercase tracking-[0.12em] ${eyebrowText}`}>{group.status}</span>
                            ) : null}
                            <span className={`mt-2 block text-sm font-normal leading-6 ${mutedText}`}>{group.summary}</span>
                          </summary>
                          <ul className={`mt-5 space-y-4 text-sm leading-7 ${mutedText}`}>
                            {group.points.map((point) => (
                              <li className="flex gap-3" key={point}>
                                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                          {group.link ? (
                            <a className={`mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 ${headingText}`} href={group.link.href}>
                              {group.link.label}
                              <ArrowUpRight aria-hidden="true" size={16} weight="light" />
                            </a>
                          ) : null}
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <Reveal delay={120}>
              <div className={`rounded-[2rem] p-2 ${shellClass}`}>
                <div
                  className={`ft-inset rounded-[calc(2rem-0.5rem)] p-6 md:p-8 ${tone.surface}`}
                >
                  <h3
                    className={`max-w-[14ch] text-balance font-display text-4xl tracking-[-0.06em] ${headingText}`}
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
                title="Keep exploring FilterTube."
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
