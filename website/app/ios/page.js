import { ArrowUpRight, CheckCircle } from "@phosphor-icons/react/ssr";

import { ActionLink, Panel } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";
import { detailPages } from "@/components/route-content";
import { ScenicDetailPage } from "@/components/scenic-detail-page";
import { JsonLd, softwareApplicationsJsonLd } from "@/lib/structured-data";

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
  title: "YouTube ad blocker and filter for iPhone and iPad: install guide",
  description:
    "Watch YouTube without ads and block channels, keywords and Shorts on iPhone and iPad. Install FilterTube free with SideStore or AltStore while the App Store version is delayed.",
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

function Steps({ children }) {
  return <ol className="mt-3 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-[var(--color-ink)]">{children}</ol>;
}

function IfYouSee({ title, children }) {
  return (
    <div className="mt-4 rounded-[1rem] border border-[#e4c766] bg-[#fdf5d8] p-4 text-sm leading-7 text-[#5b4a12]">
      <p className="font-semibold">If you see: {title}</p>
      <p className="mt-1">{children}</p>
    </div>
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
                <p className="mt-4 max-w-[62ch] text-base leading-8 text-[var(--color-muted)]">
                  Do one small step at a time, in this order. If something
                  looks different, the yellow box under that step says what
                  to do. You only do steps 1 to 6 once.
                </p>
              </div>
              <ol className="mt-8 grid gap-4">
                <StepCard number="1" where="On your iPhone or iPad" title="Get LocalDevVPN and turn it on" mascot={kritiWave}>
                  <Steps>
                    <li>Install <TextLink href={localDevVpnHref}>LocalDevVPN from the App Store</TextLink> (free).</li>
                    <li>Open it and tap Connect.</li>
                    <li>If it asks to add a VPN configuration, tap Allow.</li>
                  </Steps>
                  <p className="mt-3 text-sm">
                    It stays on your phone and your internet doesn&apos;t go
                    through anyone. SideStore needs it on whenever it installs
                    or refreshes an app.
                  </p>
                </StepCard>
                <StepCard number="2" where="On your computer" title="Get iloader and sign in" mascot={kritiThumbs}>
                  <Steps>
                    <li>
                      Download iloader for your computer:{" "}
                      {iloaderLinks.map((item, index) => (
                        <span key={item.label}>
                          {index ? ", " : ""}
                          <TextLink href={item.href}>{item.label}</TextLink>
                        </span>
                      ))}
                      .
                    </li>
                    <li>Open iloader and sign in with your Apple ID (your iCloud email and password).</li>
                  </Steps>
                </StepCard>
                <StepCard number="3" where="Phone and computer" title="Connect the phone and put SideStore on it" mascot={kritiThumbs}>
                  <Steps>
                    <li>Plug the phone into the computer with a cable.</li>
                    <li>Unlock the phone. When it asks &ldquo;Trust This Computer?&rdquo;, tap Trust and type your passcode.</li>
                    <li>In iloader, click Refresh, then click your phone&apos;s name.</li>
                    <li>Click SideStore (Stable) and wait until iloader says it&apos;s done.</li>
                  </Steps>
                  <IfYouSee title="iloader says “No devices found”">
                    The cable may only charge. Try another cable, ideally an
                    Apple one or one you&apos;ve used to sync a phone. Plug it
                    straight into the computer, unlock the phone, tap Trust, then
                    click Refresh. This first time needs a cable; Wi-Fi alone
                    won&apos;t do.
                  </IfYouSee>
                </StepCard>
                <StepCard number="4" where="On your iPhone or iPad" title="Allow SideStore to open" mascot={kritiWave}>
                  <Steps>
                    <li>Open Settings &gt; General &gt; VPN &amp; Device Management.</li>
                    <li>Tap your email under Developer App, then tap Trust.</li>
                    <li>Open Settings &gt; Privacy &amp; Security &gt; Developer Mode and turn it on.</li>
                    <li>The phone asks to restart. Restart it, then tap Turn On when it asks.</li>
                  </Steps>
                </StepCard>
                <StepCard number="5" where="In SideStore" title="Set up SideStore, then sign in" mascot={kritiThumbs}>
                  <p className="mt-2">
                    Since November 2026, Apple only accepts SideStore&apos;s
                    sign-in after a short one-time setup. Open SideStore (with
                    LocalDevVPN on), tap Settings at the bottom right, and go
                    down this list:
                  </p>
                  <Steps>
                    <li>User Customizations: turn off On-Device Anisette.</li>
                    <li>Close SideStore (swipe it away) and open it again.</li>
                    <li>Anisette Servers: choose SideStore (New), and turn off Enable Auto Rotation.</li>
                    <li>User Customizations: tap Reset adi.pb. If it asks, keep the header overrides.</li>
                    <li>User Customizations &gt; Anisette Client Configuration &gt; Remote Server Sync: tap Fetch, then Save as Overrides.</li>
                    <li>Close SideStore again, open it, and sign in with the same Apple ID as in iloader.</li>
                  </Steps>
                  <IfYouSee title="SideStore closes by itself when you sign in">
                    On-Device Anisette is still on. Do the first two items
                    above, then sign in again.
                  </IfYouSee>
                  <IfYouSee title="“Failed to Sign In” and “503 Service Temporarily Unavailable”">
                    One item was skipped or done out of order. Go down the list
                    again from the top; Reset adi.pb has to come before Fetch.
                  </IfYouSee>
                </StepCard>
                <StepCard number="6" where="On your iPhone or iPad" title="Install FilterTube" mascot={kritiWave}>
                  <Steps>
                    <li>Open this page (filtertube.in/ios) on the phone and tap Add to SideStore below.</li>
                    <li>In SideStore, open FilterTube (Direct) and tap Free (or Install).</li>
                    <li>Keep the screen on and SideStore open until it finishes. It&apos;s about 100 MB.</li>
                  </Steps>
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
                  <IfYouSee title="“SideStore.OperationError error 28”">
                    SideStore isn&apos;t signed in yet. Finish step 5, then tap
                    Free again.
                  </IfYouSee>
                  <IfYouSee title="The download stops, or “error -1001”">
                    The download timed out. Try once more on good Wi-Fi with the
                    screen on. If it stops again, use &ldquo;Install from the
                    file instead&rdquo; just below.
                  </IfYouSee>
                </StepCard>
                <StepCard number="7" where="Once a week" title="Refresh FilterTube" mascot={uljhanHappy}>
                  <Steps>
                    <li>Turn LocalDevVPN on.</li>
                    <li>Open SideStore, go to My Apps and tap the days counter next to FilterTube (or Refresh All).</li>
                  </Steps>
                  <p className="mt-3 text-sm">
                    On a free Apple ID, apps installed this way last 7 days, so
                    refresh at least once a week. You won&apos;t need the
                    computer again. Your settings, profiles and PINs stay.
                  </p>
                </StepCard>
              </ol>

              <details className="ft-disclosure mt-6 rounded-[1.2rem] border border-[color:var(--color-line)] p-5">
                <summary className="cursor-pointer font-medium text-[var(--color-ink)]">
                  Install from the file instead (if the download keeps stopping)
                </summary>
                <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--color-muted)]">
                  <p>
                    If FilterTube&apos;s download in SideStore stops partway or
                    ends with error -1001, get the file yourself and hand it to
                    SideStore. It installs the same app and still refreshes it
                    every week.
                  </p>
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>
                      Download <code className="font-mono text-[var(--color-ink)]">FilterTube-Direct-x.y.z.ipa</code>{" "}
                      from the <TextLink href="https://github.com/varshneydevansh/FilterTube/releases/latest">latest release</TextLink>.
                      On the phone, use Safari and keep the screen on until it
                      finishes; it saves to Files &gt; Downloads. On a computer,
                      download it there and send it to the phone: AirDrop from a
                      Mac, or Finder (Mac) or iTunes (Windows) file sharing, or any
                      cloud drive you can open in Files.
                    </li>
                    <li>
                      With LocalDevVPN on, open SideStore, go to My Apps, tap +
                      at the top and choose the .ipa file.
                    </li>
                  </ol>
                  <p>
                    Still at the computer with the phone plugged in? iloader&apos;s
                    Import IPA installs the file directly too. An app installed
                    that way is refreshed with iloader on the computer each week,
                    not by SideStore, so the SideStore route above is easier to
                    live with.
                  </p>
                </div>
              </details>

              <details className="ft-disclosure mt-6 rounded-[1.2rem] border border-[color:var(--color-line)] p-5">
                <summary className="cursor-pointer font-medium text-[var(--color-ink)]">
                  Prefer AltStore?
                </summary>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  <TextLink href={altStoreHref}>AltStore</TextLink> works too.
                  Install AltServer on your computer and use it to put AltStore
                  on your phone, then trust the developer and turn on Developer
                  Mode as in step 4. Tap the button below (or add{" "}
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
    <>
      <JsonLd data={softwareApplicationsJsonLd(["ios"])} />
      <ScenicDetailPage page={page} relatedPages={relatedPages}>
        <InstallGuide />
      </ScenicDetailPage>
    </>
  );
}
