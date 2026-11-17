import {
  ArrowUpRight,
  CheckCircle,
  Clock,
  Coffee,
  Desktop,
  DeviceMobile,
  Heart,
  Question,
  ShieldCheck,
  WifiHigh,
  UserCircle,
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

// Set VIDEO_URL (a direct video file or embeddable URL) to show the
// "Watch the 2-minute walkthrough" slot. While it is a placeholder it hides.
const VIDEO_URL = "VIDEO_URL";

const isPlaceholder = (value) =>
  value === "VIDEO_URL" ||
  value === "SOURCE_JSON_URL" ||
  value === "GITHUB_RELEASE_URL" ||
  value === "IPA_SHA256_CHECKSUM";

const sideStoreAddSourceHref = `sidestore://source?url=${encodeURIComponent(SOURCE_JSON_URL)}`;
const localDevVpnHref = "https://apps.apple.com/app/localdevvpn/id6755608044";
const iloaderLinks = [
  { label: "macOS", href: "https://iloader.app/" },
  { label: "Windows", href: "https://iloader.app/" },
  { label: "Linux", href: "https://iloader.app/" },
  { label: "Chromebook", href: "https://iloader.app/" },
];
const sideStorePrereqHref = "https://docs.sidestore.io/docs/installation/prerequisites";
const sideStoreTroubleHref = "https://docs.sidestore.io/docs/troubleshooting";
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

const checklist = [
  { icon: DeviceMobile, text: "An iPhone or iPad with a passcode, on iOS or iPadOS 15 or newer" },
  { icon: Desktop, text: "A computer (Mac, Windows, Linux or a recent Chromebook), only for the first install" },
  { icon: UserCircle, text: "An Apple Account (Apple ID). A spare free one works fine" },
  { icon: WifiHigh, text: "Wi-Fi. Mobile data won't work for the setup" },
  { icon: Clock, text: "About 15 minutes" },
];

const safetyPoints = [
  {
    title: "It uses Apple's own signing",
    body: "SideStore signs the app with your Apple ID, using Apple's free developer signing. Developers do the same thing when they run an app on their own phone.",
  },
  {
    title: "Nothing is jailbroken",
    body: "Your iPhone or iPad isn't modified. FilterTube runs in iOS's normal sandbox, like any App Store app.",
  },
  {
    title: "Skip paid signing services",
    body: "Avoid sites that sell \"signing\" with enterprise certificates. Apple revokes those often.",
  },
  {
    title: "Cautious? Use a spare Apple ID",
    body: "Any Apple ID works. You can make a separate free one just for this.",
  },
];

const stuck = [
  {
    q: "SideStore can't connect, or install and refresh fail",
    a: "Open LocalDevVPN and make sure it's connected. SideStore needs it on every time you install, update or refresh.",
  },
  {
    q: "\"Maximum number of apps\"",
    a: "A free Apple ID allows only 3 sideloaded apps at once, and SideStore counts as one. Remove an app you don't need in SideStore, then try again.",
  },
  {
    q: "A provisioning error, like 0xe8008024",
    a: "Some free Apple IDs hit this. Sign in with a fresh free Apple ID instead. Creating one just for SideStore is fine.",
  },
  {
    q: "FilterTube won't open after a week",
    a: "Its 7-day signing ran out. Turn LocalDevVPN on, open SideStore and tap Refresh on FilterTube. Your settings are kept.",
  },
  {
    q: "Setup stops partway",
    a: "Check that your phone and computer are on Wi-Fi (not mobile data), then run iloader again.",
  },
];

const faqs = [
  {
    q: "Will I lose my settings when the app refreshes?",
    a: "No. A refresh only renews the signature. Your rules, profiles and PINs stay on the device.",
  },
  {
    q: "Does it work on iPad?",
    a: "Yes. The same install works on iPhone and iPad. FilterTube itself needs iOS or iPadOS 17 or later.",
  },
  {
    q: "How do updates work?",
    a: "SideStore shows new FilterTube versions in its updates list. Tap update and you're done.",
  },
  {
    q: "Can I move to the App Store version later?",
    a: "Yes. Export a backup from FilterTube's settings, install the App Store version when it's live, then import the backup there.",
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

function StepCard({ number, where, title, mascot, children }) {
  return (
    <li className="grid gap-5 rounded-[1.4rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:p-7">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] font-display text-2xl text-[#fff8f1]">
        {number}
      </span>
      <div className="min-w-0 text-base leading-8 text-[var(--color-muted)]">
        <p className="text-[0.72rem] uppercase tracking-[0.22em]">{where}</p>
        <h3 className="mt-1 font-display text-3xl tracking-[-0.04em] text-[var(--color-ink)]">
          {title}
        </h3>
        {children}
      </div>
      <Mascot
        alt={mascot.alt}
        className="mx-auto h-28 w-auto md:h-36"
        height={mascot.height}
        src={mascot.src}
        width={mascot.width}
      />
    </li>
  );
}

const kritiWave = { src: "/mascots/kriti_wave.webp", alt: "Kriti waving", width: 176, height: 224 };
const kritiThumbs = { src: "/mascots/kriti_thumbsup.webp", alt: "Kriti giving a thumbs up", width: 217, height: 300 };
const uljhanHappy = { src: "/mascots/uljhan_happy.webp", alt: "", width: 225, height: 211 };

function InstallGuide() {
  return (
    <div id="install" className="scroll-mt-28">
      {/* Intro */}
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
                  alt={kritiWave.alt}
                  className="mx-auto h-44 w-auto md:h-56"
                  height={kritiWave.height}
                  src={kritiWave.src}
                  width={kritiWave.width}
                />
              </div>
            </Panel>
          </Reveal>
        </div>
      </section>

      {/* Checklist + steps */}
      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <Panel innerClassName="p-6 md:p-10">
              <Eyebrow>Before you start</Eyebrow>
              <h2 className="mt-5 max-w-[22ch] text-balance font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                Have these ready.
              </h2>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {checklist.map(({ icon: Icon, text }) => (
                  <li
                    className="flex items-start gap-4 rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-5"
                    key={text}
                  >
                    <Icon aria-hidden="true" className="shrink-0 text-[var(--color-accent)]" size={28} weight="light" />
                    <span className="text-sm leading-7 text-[var(--color-ink)]">{text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                Windows also needs iTunes. The full list is in{" "}
                <TextLink href={sideStorePrereqHref}>SideStore&apos;s own guide</TextLink>.
              </p>

              <div className="mt-12">
                <Eyebrow>Install steps</Eyebrow>
                <h2 className="mt-5 max-w-[22ch] text-balance font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                  Four steps. That&apos;s it.
                </h2>
              </div>
              <ol className="mt-8 grid gap-4">
                <StepCard number="1" where="On your iPhone" title="Install LocalDevVPN, then turn it on" mascot={kritiWave}>
                  <p className="mt-2">
                    Get{" "}
                    <TextLink href={localDevVpnHref}>LocalDevVPN from the App Store</TextLink>{" "}
                    and switch it on. Tap Allow if it asks to add a VPN
                    configuration.
                  </p>
                  <p className="mt-2 text-sm">
                    Why? It&apos;s a local VPN that lives on your phone.
                    SideStore uses it to install and refresh apps. Your
                    traffic doesn&apos;t go anywhere.
                  </p>
                </StepCard>
                <StepCard number="2" where="On your computer" title="Use iloader to put SideStore on your phone" mascot={kritiThumbs}>
                  <p className="mt-2">
                    Download iloader, open it, sign in with your Apple ID, pick
                    your iPhone, then tap Install.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    {iloaderLinks.map((item) => (
                      <TextLink href={item.href} key={item.label}>
                        {item.label}
                      </TextLink>
                    ))}
                  </div>
                </StepCard>
                <StepCard number="3" where="On your iPhone" title={"Open SideStore and tap \u201cAdd FilterTube\u201d"} mascot={kritiWave}>
                  <p className="mt-2">
                    Open this page on your phone and tap the button. Then tap
                    Install.
                  </p>
                  <div className="mt-4 flex flex-col items-start gap-3">
                    <ActionLink href={sideStoreAddSourceHref}>Add FilterTube</ActionLink>
                    {isPlaceholder(SOURCE_JSON_URL) ? (
                      <PlaceholderMark name="SOURCE_JSON_URL" />
                    ) : null}
                  </div>
                </StepCard>
                <StepCard number="4" where="Done" title="Keep it fresh" mascot={uljhanHappy}>
                  <p className="mt-2">
                    SideStore refreshes FilterTube every 7 days, right on your
                    phone, as long as LocalDevVPN is on. You won&apos;t need the
                    computer again.
                  </p>
                </StepCard>
              </ol>

              <details className="ft-disclosure mt-6 rounded-[1.2rem] border border-[color:var(--color-line)] p-5">
                <summary className="cursor-pointer font-medium text-[var(--color-ink)]">
                  Prefer AltStore?
                </summary>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  <TextLink href={altStoreHref}>AltStore</TextLink> works too.
                  It needs a computer running AltServer on the same Wi-Fi as
                  your phone about once a week. Advanced setups are covered in{" "}
                  <TextLink href={sideStoreDocsHref}>SideStore&apos;s docs</TextLink>.
                </p>
              </details>
            </Panel>
          </Reveal>
        </div>
      </section>

      {/* Video */}
      {isPlaceholder(VIDEO_URL) ? null : (
        <section className="px-4 py-8 md:px-6">
          <div className="mx-auto max-w-[1180px]">
            <Reveal>
              <Panel innerClassName="p-6 md:p-10">
                <Eyebrow>Prefer to watch?</Eyebrow>
                <h2 className="mt-5 font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                  Watch the 2-minute walkthrough
                </h2>
                <video
                  className="mt-8 w-full rounded-[1.2rem] border border-[color:var(--color-line)]"
                  controls
                  preload="metadata"
                  src={VIDEO_URL}
                />
              </Panel>
            </Reveal>
          </div>
        </section>
      )}

      {/* Stuck */}
      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <Panel innerClassName="p-6 md:p-10">
              <Eyebrow>Stuck?</Eyebrow>
              <h2 className="mt-5 font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                Quick fixes.
              </h2>
              <div className="mt-8 grid gap-3">
                {stuck.map((item) => (
                  <details
                    className="ft-disclosure rounded-[1.2rem] border border-[color:var(--color-line)] p-5"
                    key={item.q}
                  >
                    <summary className="cursor-pointer font-medium text-[var(--color-ink)]">
                      {item.q}
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{item.a}</p>
                  </details>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">
                Still stuck? See{" "}
                <TextLink href={sideStoreTroubleHref}>SideStore&apos;s troubleshooting guide</TextLink>.
              </p>
            </Panel>
          </Reveal>
        </div>
      </section>

      {/* Safe and legal */}
      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <Panel innerClassName="p-6 md:p-10">
              <Eyebrow>Is this legal and safe?</Eyebrow>
              <h2 className="mt-5 max-w-[22ch] text-balance font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                Yes. Here is what happens.
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
                      Only install the app file from the official GitHub
                      release, and check that its SHA-256 matches.
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
            </Panel>
          </Reveal>
        </div>
      </section>

      {/* What you get */}
      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <Panel innerClassName="p-6 md:p-10">
              <div className="grid gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                <Mascot
                  alt={kritiThumbs.alt}
                  className="mx-auto hidden h-44 w-auto md:block"
                  height={kritiThumbs.height}
                  src={kritiThumbs.src}
                  width={kritiThumbs.width}
                />
                <div>
                  <Eyebrow>What you get on iPhone</Eyebrow>
                  <h2 className="mt-5 max-w-[24ch] text-balance font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                    Same as the Android direct build.
                  </h2>
                  <p className="mt-5 max-w-[62ch] text-sm leading-7 text-[var(--color-muted)]">
                    The direct version lets you save videos for offline
                    viewing. Saved videos last 30 days and are rechecked.
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

      {/* FAQ */}
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
