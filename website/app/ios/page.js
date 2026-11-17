import {
  ArrowUpRight,
  CheckCircle,
  Coffee,
  DeviceMobile,
  Heart,
  Question,
  ShieldCheck,
  Timer,
} from "@phosphor-icons/react/ssr";

import { ActionLink, Panel } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";
import { detailPages } from "@/components/route-content";
import { ScenicDetailPage } from "@/components/scenic-detail-page";

// ---------------------------------------------------------------------------
// PLACEHOLDERS: replace these three values when the first iOS direct release
// is published. While a value still equals its placeholder name, the page
// shows a visible "placeholder" marker instead of pretending it is real.
// ---------------------------------------------------------------------------
const SOURCE_JSON_URL = "SOURCE_JSON_URL";
const GITHUB_RELEASE_URL = "GITHUB_RELEASE_URL";
const IPA_SHA256 = "IPA_SHA256_CHECKSUM";

const isPlaceholder = (value) =>
  value === "SOURCE_JSON_URL" ||
  value === "GITHUB_RELEASE_URL" ||
  value === "IPA_SHA256_CHECKSUM";

const sideStoreAddSourceHref = `sidestore://source?url=${encodeURIComponent(SOURCE_JSON_URL)}`;
const sideStoreHref = "https://sidestore.io";
const sideStoreDocsHref = "https://docs.sidestore.io";
const altStoreHref = "https://altstore.io";
const koFiHref = "https://ko-fi.com/filtertube";

const page = detailPages.ios;
const relatedPages = page.related
  .map((relatedSlug) => detailPages[relatedSlug])
  .filter(Boolean);

export const metadata = {
  title: "Install on iPhone and iPad",
  description:
    "Apple is having trouble on their end, so the App Store version will take a while. Until then, install FilterTube on iPhone and iPad with SideStore, or AltStore. Free, no ads, nothing locked, no FilterTube sign-up.",
  alternates: {
    canonical: "https://filtertube.in/ios",
  },
  openGraph: {
    title: "FilterTube for iPhone and iPad",
    description:
      "The App Store version will take a while because of trouble on Apple's end. Until then, install FilterTube with SideStore, or AltStore.",
    url: "https://filtertube.in/ios",
  },
  twitter: {
    title: "FilterTube for iPhone and iPad",
    description:
      "The App Store version will take a while because of trouble on Apple's end. Until then, install FilterTube with SideStore, or AltStore.",
  },
};

const promises = [
  "Free, with no ads",
  "Nothing locked behind a payment",
  "No FilterTube sign-up, just like the extension",
  "No FilterTube server keeps your rules or history",
];

const safetyPoints = [
  {
    title: "It uses Apple's own signing",
    body: "SideStore and AltStore sign the app with your own Apple ID, using Apple's standard free developer signing. It is the same thing Xcode does when a developer runs an app on their own phone.",
  },
  {
    title: "Nothing is jailbroken",
    body: "Your iPhone or iPad is not modified. iOS runs FilterTube inside its normal sandbox, exactly like an App Store app.",
  },
  {
    title: "Skip paid signing services",
    body: "Avoid services that sell \"signing\" with enterprise certificates. Apple revokes those often, and you are trusting a stranger with your device. SideStore and AltStore keep it between you and Apple.",
  },
  {
    title: "Cautious? Use a spare Apple ID",
    body: "Any Apple ID works. If you would rather keep your main account out of it, create a separate free Apple ID just for sideloading.",
  },
];

const expectations = [
  {
    icon: DeviceMobile,
    title: "One-time setup, about 10 minutes",
    body: "The first install needs a Mac or Windows computer. After that, you do not need it again for SideStore.",
  },
  {
    icon: Timer,
    title: "A refresh every 7 days",
    body: "Free Apple ID signing lasts 7 days. SideStore refreshes the app on your phone, no computer needed.",
  },
  {
    icon: ShieldCheck,
    title: "Missed a refresh? Nothing is lost",
    body: "If 7 days pass without a refresh, the app will not open until you refresh it in SideStore. Your settings stay on the device the whole time.",
  },
  {
    icon: CheckCircle,
    title: "Three apps at a time",
    body: "A free Apple ID can have 3 sideloaded apps installed at once. SideStore counts as one of them.",
  },
];

const faqs = [
  {
    q: "Will I lose my settings when the app refreshes?",
    a: "No. A refresh only renews the signature. Your rules, profiles, and PINs stay on the device.",
  },
  {
    q: "Does it work on iPad?",
    a: "Yes. The same install works on iPhone and iPad. FilterTube needs iOS 17 or iPadOS 17 or later.",
  },
  {
    q: "How do updates work?",
    a: "SideStore checks the FilterTube source and shows new versions in its updates list. Tap update and you are done.",
  },
  {
    q: "Can I move to the App Store version later?",
    a: "Yes. Export a backup from FilterTube's settings, install the App Store version when it is live, then import the backup there.",
  },
];

function Eyebrow({ children }) {
  return (
    <p className="text-[0.72rem] uppercase tracking-[0.26em] text-[var(--color-muted)]">
      {children}
    </p>
  );
}

function PlaceholderMark({ name }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-[color:var(--color-accent)] px-3 py-1 font-mono text-[0.72rem] text-[var(--color-accent)]">
      {name}
      <span className="font-sans uppercase tracking-[0.16em] text-[var(--color-muted)]">
        placeholder
      </span>
    </span>
  );
}

function TextLink({ href, children }) {
  return (
    <a
      className="inline-flex items-center gap-1 font-semibold text-[var(--color-accent)] underline underline-offset-4"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
      <ArrowUpRight aria-hidden="true" size={14} weight="light" />
    </a>
  );
}

function Mascot({ src, alt = "", className = "", width, height }) {
  return (
    <img
      alt={alt}
      className={`pointer-events-none select-none object-contain ${className}`}
      height={height}
      loading="lazy"
      src={src}
      width={width}
    />
  );
}

function InstallGuide() {
  return (
    <div id="install" className="scroll-mt-28">
      {/* 1. Intro */}
      <section className="px-4 pb-8 pt-16 md:px-6 md:pt-20">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <Panel innerClassName="p-6 md:p-10">
              <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div>
                  <Eyebrow>Install on iPhone and iPad</Eyebrow>
                  <h2 className="mt-5 text-balance font-display text-4xl font-semibold tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl md:leading-[0.98]">
                    FilterTube for iPhone and iPad.
                  </h2>
                  <p className="mt-6 max-w-[62ch] text-pretty text-base leading-8 text-[var(--color-muted)] md:text-lg">
                    I&apos;m sorry for the extra steps. I&apos;m working to
                    bring FilterTube to the App Store &mdash; that&apos;s where
                    I want it to be &mdash; but Apple is making things difficult
                    with the developer account, so that will take a while. Until
                    then, SideStore is the best way I&apos;ve found to install it,
                    and AltStore works too. From everything I&apos;ve read, it&apos;s
                    safe and legal: it uses Apple&apos;s own free developer
                    signing with your Apple ID, the same way developers run apps
                    on their own phones.
                  </p>
                  <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                    {promises.map((item) => (
                      <li className="flex gap-3 text-sm leading-7 text-[var(--color-ink)]" key={item}>
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
                  <p className="mt-6 max-w-[62ch] text-sm leading-7 text-[var(--color-muted)]">
                    The app is built on the same filtering engine as the
                    open-source FilterTube extension. The app&apos;s own code
                    is not open source.
                  </p>
                </div>
                <Mascot
                  alt="Kriti waving hello"
                  className="mx-auto h-44 w-auto md:h-56"
                  height={224}
                  src="/mascots/kriti_wave.webp"
                  width={176}
                />
              </div>
            </Panel>
          </Reveal>
        </div>
      </section>

      {/* 2. Legal and safe */}
      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <Panel innerClassName="p-6 md:p-10">
              <Eyebrow>Is this legal and safe?</Eyebrow>
              <h2 className="mt-5 max-w-[22ch] text-balance font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                Yes. Here is what actually happens.
              </h2>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {safetyPoints.map((point) => (
                  <div
                    className="rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-5"
                    key={point.title}
                  >
                    <h3 className="font-display text-2xl tracking-[-0.04em] text-[var(--color-ink)]">
                      {point.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{point.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[1.2rem] border border-[color:var(--color-line)] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-[var(--color-accent)]"
                    size={22}
                    weight="light"
                  />
                  <div className="min-w-0 text-sm leading-7 text-[var(--color-muted)]">
                    <p className="font-semibold text-[var(--color-ink)]">Verify the download.</p>
                    <p className="mt-1">
                      Only install the FilterTube app file from the official
                      GitHub release linked here, and check that its SHA-256
                      checksum matches.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {isPlaceholder(GITHUB_RELEASE_URL) ? (
                        <PlaceholderMark name="GITHUB_RELEASE_URL" />
                      ) : (
                        <TextLink href={GITHUB_RELEASE_URL}>Official GitHub release</TextLink>
                      )}
                    </div>
                    <p className="mt-3 break-all">
                      SHA-256:{" "}
                      {isPlaceholder(IPA_SHA256) ? (
                        <PlaceholderMark name="IPA_SHA256_CHECKSUM" />
                      ) : (
                        <code className="font-mono text-[var(--color-ink)]">{IPA_SHA256}</code>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">
                <strong className="text-[var(--color-ink)]">Seeing error 0xe8008024?</strong>{" "}
                Some free Apple IDs have recently hit this provisioning error.
                Signing in with a fresh Apple ID usually fixes it.
              </p>
            </Panel>
          </Reveal>
        </div>
      </section>

      {/* 3. What to expect */}
      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <Panel innerClassName="p-6 md:p-10">
              <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div>
                  <Eyebrow>What to expect</Eyebrow>
                  <h2 className="mt-5 max-w-[22ch] text-balance font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                    A short setup, then a weekly refresh.
                  </h2>
                </div>
                <Mascot
                  alt=""
                  className="hidden h-32 w-auto md:block"
                  height={211}
                  src="/mascots/uljhan_happy.webp"
                  width={225}
                />
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {expectations.map(({ icon: Icon, title, body }) => (
                  <div
                    className="rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-5"
                    key={title}
                  >
                    <Icon aria-hidden="true" size={24} weight="light" />
                    <h3 className="mt-4 font-display text-2xl tracking-[-0.04em] text-[var(--color-ink)]">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{body}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </Reveal>
        </div>
      </section>

      {/* 4. Steps */}
      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <Panel innerClassName="p-6 md:p-10">
              <Eyebrow>Install steps</Eyebrow>
              <h2 className="mt-5 max-w-[22ch] text-balance font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                Three steps with SideStore.
              </h2>
              <ol className="mt-8 grid gap-4">
                <li className="flex gap-4 rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] font-display text-lg text-[#fff8f1]">
                    1
                  </span>
                  <div className="min-w-0 text-sm leading-7 text-[var(--color-muted)]">
                    <h3 className="font-display text-2xl tracking-[-0.04em] text-[var(--color-ink)]">
                      Install SideStore
                    </h3>
                    <p className="mt-2">
                      Follow SideStore&apos;s official guide. It walks you
                      through the one-time computer step for Mac or Windows,
                      and it stays up to date as things change.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4">
                      <TextLink href={sideStoreHref}>sidestore.io</TextLink>
                      <TextLink href={sideStoreDocsHref}>SideStore install guide</TextLink>
                    </div>
                  </div>
                </li>
                <li className="flex gap-4 rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] font-display text-lg text-[#fff8f1]">
                    2
                  </span>
                  <div className="min-w-0 text-sm leading-7 text-[var(--color-muted)]">
                    <h3 className="font-display text-2xl tracking-[-0.04em] text-[var(--color-ink)]">
                      Turn on LocalDevVPN
                    </h3>
                    <p className="mt-2">
                      SideStore uses LocalDevVPN to sign and refresh apps on
                      the phone itself. Turn it on as the SideStore guide
                      describes. It runs locally on your device.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4 rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] font-display text-lg text-[#fff8f1]">
                    3
                  </span>
                  <div className="min-w-0 text-sm leading-7 text-[var(--color-muted)]">
                    <h3 className="font-display text-2xl tracking-[-0.04em] text-[var(--color-ink)]">
                      Add FilterTube and install
                    </h3>
                    <p className="mt-2">
                      Open this page on your iPhone or iPad and tap the button.
                      SideStore adds the FilterTube source; tap FilterTube,
                      then Install.
                    </p>
                    <div className="mt-4 flex flex-col items-start gap-3">
                      <ActionLink href={sideStoreAddSourceHref}>
                        Add FilterTube to SideStore
                      </ActionLink>
                      {isPlaceholder(SOURCE_JSON_URL) ? (
                        <PlaceholderMark name="SOURCE_JSON_URL" />
                      ) : (
                        <p className="break-all font-mono text-xs">
                          Or add this source by hand: {SOURCE_JSON_URL}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              </ol>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <details className="ft-disclosure rounded-[1.2rem] border border-[color:var(--color-line)] p-5">
                  <summary className="cursor-pointer font-medium text-[var(--color-ink)]">
                    Prefer AltStore?
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    <TextLink href={altStoreHref}>AltStore</TextLink> works
                    too. It refreshes through AltServer, so a Mac or Windows
                    computer running AltServer needs to be on the same Wi-Fi
                    as your phone at least once a week.
                  </p>
                </details>
                <details className="ft-disclosure rounded-[1.2rem] border border-[color:var(--color-line)] p-5">
                  <summary className="cursor-pointer font-medium text-[var(--color-ink)]">
                    In the EU?
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    AltStore PAL is an approved alternative app marketplace in
                    the EU. FilterTube isn&apos;t listed there yet, so use
                    SideStore or AltStore as described above for now.
                  </p>
                </details>
              </div>
            </Panel>
          </Reveal>
        </div>
      </section>

      {/* 5. Direct version */}
      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <Panel innerClassName="p-6 md:p-10">
              <div className="grid gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                <Mascot
                  alt=""
                  className="mx-auto hidden h-44 w-auto md:block"
                  height={300}
                  src="/mascots/kriti_thumbsup.webp"
                  width={217}
                />
                <div>
                  <Eyebrow>The direct version</Eyebrow>
                  <h2 className="mt-5 max-w-[24ch] text-balance font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                    Same as the Android direct build.
                  </h2>
                  <p className="mt-5 max-w-[62ch] text-sm leading-7 text-[var(--color-muted)]">
                    The direct version includes saving videos for offline
                    viewing. Saved copies expire after 30 days.
                  </p>
                  <p className="mt-4 max-w-[62ch] text-sm leading-7 text-[var(--color-muted)]">
                    Supporting FilterTube on Ko-fi is optional. If it helps
                    you, a one-time &ldquo;support for a year&rdquo; is very
                    welcome. Nothing is locked either way.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <ActionLink external href={koFiHref} variant="secondary">
                      <span className="inline-flex items-center gap-2">
                        <Coffee aria-hidden="true" size={16} weight="light" />
                        Support on Ko-fi
                      </span>
                    </ActionLink>
                  </div>
                </div>
              </div>
            </Panel>
          </Reveal>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="px-4 pb-8 pt-8 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <Panel innerClassName="p-6 md:p-10">
              <Eyebrow>Questions</Eyebrow>
              <h2 className="mt-5 font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                Good to know.
              </h2>
              <div className="mt-8 grid gap-3">
                {faqs.map((item) => (
                  <details
                    className="ft-disclosure rounded-[1.2rem] border border-[color:var(--color-line)] p-5"
                    key={item.q}
                  >
                    <summary className="cursor-pointer font-medium text-[var(--color-ink)]">
                      <span className="inline-flex items-center gap-2">
                        <Question aria-hidden="true" size={18} weight="light" />
                        {item.q}
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{item.a}</p>
                  </details>
                ))}
              </div>
              <p className="mt-6 inline-flex items-center gap-2 text-sm leading-7 text-[var(--color-muted)]">
                <Heart aria-hidden="true" className="text-[var(--color-accent)]" size={16} weight="fill" />
                Thank you for trying FilterTube on iPhone and iPad.
              </p>
            </Panel>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

export default function IosPage() {
  return (
    <ScenicDetailPage page={page} relatedPages={relatedPages}>
      <InstallGuide />
    </ScenicDetailPage>
  );
}
