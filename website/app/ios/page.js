import { ArrowUpRight, CheckCircle } from "@phosphor-icons/react/ssr";

import { ActionLink, Panel } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";
import { detailPages } from "@/components/route-content";
import { ScenicDetailPage } from "@/components/scenic-detail-page";

// The direct release (source URL, release page, SHA-256) comes from public/ios/source.json, which
// the app repository's release script fills. Until then the page says the install link is coming.
import { SOURCE_JSON_URL, iosRelease } from "@/data/ios-release";
import { iosChecklist, iosFaqs, iosPromises, iosSafetyPoints, iosStuck } from "@/data/ios-guide";

// Set VIDEO_URL (a direct video file or embeddable URL) to show the
// "Watch the 2-minute walkthrough" slot. While it is a placeholder it hides.
const VIDEO_URL = "VIDEO_URL";
const isPlaceholder = (value) => value === "VIDEO_URL";

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
    types: { "text/markdown": "https://filtertube.in/ios.md" },
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






function ComingNote({ children = "Coming with the first iPhone release" }) {
  return (
    <span className="inline-flex min-h-11 items-center rounded-full border border-dashed border-[color:var(--color-line)] px-4 py-2 text-sm text-[var(--color-muted)]">
      {children}
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
                  <h2 className="text-balance font-display text-4xl font-semibold tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl md:leading-[0.98]">
                    Install FilterTube on iPhone and iPad
                  </h2>
                  <p className="mt-6 max-w-[62ch] text-pretty text-base leading-8 text-[var(--color-muted)] md:text-lg">
                    I&apos;m sorry for the extra steps. I&apos;m working to
                    bring FilterTube to the App Store, where I want it to be,
                    but Apple is making things difficult
                    with the developer account, so that will take a while. Until
                    then, SideStore is the best way I&apos;ve found to install it,
                    and AltStore works too. This isn&apos;t a jailbreak or a
                    hack: FilterTube comes straight from my official GitHub
                    releases, and SideStore installs it with Apple&apos;s own
                    free developer signing, which Apple has offered worldwide
                    since 2015, the same way developers test apps on their
                    own phones. Nothing on your phone is modified, FilterTube
                    runs in iOS&apos;s normal sandbox, and you can use a spare
                    Apple ID if you prefer.
                  </p>
                  <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                    {iosPromises.map((item) => (
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
              <h2 className="max-w-[22ch] text-balance font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                Before you start
              </h2>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {iosChecklist.map(({ text }) => (
                  <li
                    className="flex items-start gap-4 rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)] p-5"
                    key={text}
                  >
                    <span className="text-sm leading-7 text-[var(--color-ink)]">{text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                Windows also needs iTunes. The full list is in{" "}
                <TextLink href={sideStorePrereqHref}>SideStore&apos;s own guide</TextLink>.
              </p>

              <div className="mt-12">
                <h2 className="max-w-[22ch] text-balance font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                  Install steps
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
                    Plug your iPhone into the computer with a cable that
                    carries data (some charging cables don&apos;t), unlock it
                    and tap Trust on the phone. Download iloader, open it,
                    sign in with your Apple ID, pick your iPhone, then choose
                    Install SideStore. iloader also puts SideStore&apos;s
                    pairing file on the phone. If iloader shows &ldquo;No
                    devices found&rdquo;, see the fixes below.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    {iloaderLinks.map((item) => (
                      <TextLink href={item.href} key={item.label}>
                        {item.label}
                      </TextLink>
                    ))}
                  </div>
                </StepCard>
                <StepCard number="3" where="On your iPhone" title="Trust it, then sign in to SideStore" mascot={kritiThumbs}>
                  <p className="mt-2">
                    In Settings &gt; General &gt; VPN &amp; Device Management,
                    tap your Apple ID under Developer App and tap Trust. Then
                    turn on Developer Mode in Settings &gt; Privacy &amp;
                    Security; the phone restarts.
                  </p>
                  <p className="mt-2">
                    With LocalDevVPN on, open SideStore and sign in with the
                    same Apple ID you used in iloader.
                  </p>
                </StepCard>
                <StepCard number="4" where="On your iPhone" title={"Tap \u201cAdd to SideStore\u201d, then install FilterTube"} mascot={kritiWave}>
                  <p className="mt-2">
                    Open this page on your phone and tap the button. SideStore
                    adds the FilterTube source; open FilterTube there and tap
                    Install.
                  </p>
                  <div className="mt-4 flex flex-col items-start gap-3">
                    {iosRelease.live ? (
                      <ActionLink href={iosRelease.sideStoreHref}>Add to SideStore</ActionLink>
                    ) : (
                      <ComingNote />
                    )}
                  </div>
                  <p className="mt-3 text-sm">
                    Button not working? In SideStore, open Sources, tap + and
                    paste{" "}
                    <code className="break-all font-mono text-[var(--color-ink)]">{SOURCE_JSON_URL}</code>
                  </p>
                </StepCard>
                <StepCard number="5" where="Every week" title="Keep it fresh" mascot={uljhanHappy}>
                  <p className="mt-2">
                    On a free Apple ID, apps signed this way last 7 days.
                    SideStore refreshes FilterTube right on your phone, in the
                    background or when you tap the days counter in My Apps, as
                    long as LocalDevVPN is on. Refresh at least once a week;
                    you won&apos;t need the computer again.
                  </p>
                </StepCard>
              </ol>

              <details className="ft-disclosure mt-6 rounded-[1.2rem] border border-[color:var(--color-line)] p-5">
                <summary className="cursor-pointer font-medium text-[var(--color-ink)]">
                  Prefer AltStore?
                </summary>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  <TextLink href={altStoreHref}>AltStore</TextLink> works too.
                  Install AltServer on your computer and use it to put AltStore
                  on your phone, then trust the developer and turn on Developer
                  Mode as in step 3. Tap the button below (or add{" "}
                  <code className="break-all font-mono text-[var(--color-ink)]">{SOURCE_JSON_URL}</code>{" "}
                  under Sources) and install FilterTube. You can also download
                  the IPA from the GitHub release and open it with AltStore.
                  The same limits apply (3 apps, 7 days), and refreshing needs
                  your computer running AltServer on the same Wi-Fi as your
                  phone, at least once a week. Advanced setups are covered in{" "}
                  <TextLink href={sideStoreDocsHref}>SideStore&apos;s docs</TextLink>.
                </p>
                <div className="mt-3">
                  {iosRelease.live ? (
                    <ActionLink href={iosRelease.altStoreHref} variant="secondary">Add to AltStore</ActionLink>
                  ) : (
                    <ComingNote />
                  )}
                </div>
              </details>

              <div className="mt-6 rounded-[1.2rem] border border-[color:var(--color-line)] p-5">
                <p className="font-medium text-[var(--color-ink)]">
                  Coming to AltStore PAL and the App Store
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Once the trouble on Apple&apos;s side is resolved, people in the EU,
                  Japan and Brazil will be able to install FilterTube with{" "}
                  <TextLink href="https://altstore.io">AltStore PAL</TextLink>,
                  with no computer and no weekly refresh, and everyone else
                  through the App Store. Until then, SideStore works everywhere,
                  including those regions.
                </p>
              </div>
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
                <h2 className="font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
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
              <h2 className="font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                Quick fixes if you get stuck
              </h2>
              <div className="mt-8 grid gap-3">
                {iosStuck.map((item) => (
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
              <h2 className="max-w-[22ch] text-balance font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                Yes, it&apos;s legal and safe
              </h2>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {iosSafetyPoints.map((point) => (
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
                <div className="min-w-0 text-sm leading-7 text-[var(--color-muted)]">
                    <p className="font-semibold text-[var(--color-ink)]">Verify the download.</p>
                    <p className="mt-1">
                      Only install the app file from the official GitHub
                      release, and check that its SHA-256 matches.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {iosRelease.releaseURL ? (
                        <TextLink href={iosRelease.releaseURL}>Official GitHub release</TextLink>
                      ) : (
                        <ComingNote />
                      )}
                    </div>
                    <p className="mt-3 break-all">
                      SHA-256:{" "}
                      {iosRelease.sha256 ? (
                        <code className="font-mono text-[var(--color-ink)]">{iosRelease.sha256}</code>
                      ) : (
                        <span>published with the first iPhone release</span>
                      )}
                    </p>
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
                  <h2 className="max-w-[24ch] text-balance font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                    iPhone gets the same features as the Android direct build
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
                      Support on Ko-fi
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
              <h2 className="font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl">
                Questions
              </h2>
              <div className="mt-8 grid gap-3">
                {iosFaqs.map((item) => (
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
              <p className="mt-6 inline-flex items-center gap-2 text-sm leading-7 text-[var(--color-muted)]">
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
