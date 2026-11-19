import { Panel, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";

export const metadata = {
  title: "Terms of use",
  description:
    "FilterTube terms of use for the website, the browser extension, the Android and iOS apps, and the optional supporter subscription.",
};

const sections = [
  {
    title: "What these terms cover",
    body: [
      "These terms cover the FilterTube website, the browser extension, the Android app for phone, tablet and TV (Google Play and direct GitHub builds), and the iPhone and iPad app. By using any of them, you agree to these terms.",
      "How FilterTube handles data is described in the privacy policy at filtertube.in/privacy.",
    ],
  },
  {
    title: "Using FilterTube",
    body: [
      "FilterTube is free for personal, family and educational use. You may install it, use it and share the official download links.",
      "Please don't use FilterTube to break the law, to break the terms of the video service you are watching, or to harm the project or other people. Don't impersonate FilterTube or ship changed copies of the apps under its name.",
      "You are responsible for how you set up rules, profiles and PINs, and for checking that FilterTube suits your household, school or workplace. Filtering helps, but it cannot catch everything.",
    ],
  },
  {
    title: "The browser extension's source code",
    body: [
      "The browser extension's source code is available under the MIT licence, in the public FilterTube repository. That licence governs reuse of the extension's code.",
      "The Android and iOS apps are provided for you to use under these terms.",
    ],
  },
  {
    title: "Offline Media",
    body: [
      "Direct builds can save videos for offline viewing on your own device. Saved copies are for your personal use, expire after 30 days unless rechecked, and are removed if the video is no longer available. Respect the rights of the people who made the videos.",
      "Google Play builds do not save videos. All builds can play files you already have on your device.",
    ],
  },
  {
    title: "Optional services",
    body: [
      "Some features use community services such as SponsorBlock, DeArrow, Return YouTube Dislike, LRCLIB and the PipePipe decoder. They are off by default, except the PipePipe decoder, which is on by default and can be turned off in Settings. When one is on, its own terms and policy apply, and we can't promise it will stay available.",
    ],
  },
  {
    title: "No affiliation with Google or YouTube",
    body: [
      "FilterTube is an independent project. It is not endorsed by, sponsored by or affiliated with Google or YouTube.",
      "When you watch, sign in or interact with the video service through FilterTube, Google's own terms and policies apply to that service.",
    ],
  },
  {
    title: "Optional supporter subscription",
    body: [
      "Every FilterTube feature is free and stays free. Supporting the project is optional and never unlocks, restricts or changes any feature; it only hides the in-app support reminder.",
      "In the Android app from Google Play, support is offered as an auto-renewing Google Play subscription (monthly or yearly, at the tier and price shown for your country). Google Play processes the payment, renews the subscription until you cancel, and handles receipts. FilterTube never receives or stores your payment details.",
      "You can change tier or cancel at any time in Google Play (Play Store, Payments & subscriptions, Subscriptions). Cancelling stops future renewals; the current paid period is not refunded by FilterTube, and refunds follow Google Play's refund policy.",
      "In direct builds, support goes through Ko-fi, which handles the payment under its own terms.",
    ],
  },
  {
    title: "Availability",
    body: [
      "Features, platforms and release timing can change. Store reviews and platform rules may affect when and where FilterTube is available.",
      "The video service can change at any time, which may stop some features working until FilterTube is updated.",
    ],
  },
  {
    title: "Warranty and liability",
    body: [
      "FilterTube is provided as it is, without warranties of merchantability, fitness for a particular purpose or uninterrupted availability.",
      "To the extent the law allows, we are not liable for losses that come from using FilterTube or from content it did not hide. Nothing in these terms limits rights you have under the law where you live.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Questions about these terms can be sent to hello@filtertube.in or raised through the public GitHub repository.",
    ],
  },
  {
    title: "Changes",
    body: [
      "19 November 2026: covers every product by name, the MIT licence is stated for the browser extension only, and new sections on Offline Media and optional services.",
      "5 November 2026: added the optional supporter subscription.",
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="px-4 pb-24 pt-32 md:px-6 md:pb-32 md:pt-40">
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <SectionHeading
            title="Terms of use"
            description="Last updated: 19 November 2026. These terms cover the FilterTube website, browser extension, Android app and iPhone and iPad app."
          />
        </Reveal>
        <Reveal className="mt-10" delay={120}>
          <Panel innerClassName="space-y-10 p-7 md:p-10">
            {sections.map((section) => (
              <section
                className="border-t border-[color:var(--color-line)] pt-8 first:border-t-0 first:pt-0"
                key={section.title}
              >
                <h2 className="font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)] md:text-4xl">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-base leading-8 text-[var(--color-muted)]">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}
