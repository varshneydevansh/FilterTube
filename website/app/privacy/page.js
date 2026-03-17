import Link from "next/link";

import { Panel, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";

export const metadata = {
  title: "Privacy policy",
  description:
    "FilterTube privacy policy for the current browser release and website. Filtering stays local, settings stay on-device, and the site does not use analytics or trackers.",
};

const notCollected = [
  "Personally identifiable information such as your name, email address, postal address, or phone number",
  "Your general browsing history or web activity outside the product’s supported surfaces",
  "YouTube watch history, viewing habits, or account credentials",
  "Search queries, channel names, or keywords for the purpose of sending them to FilterTube-operated servers",
  "Location data, IP-address-based profiles, financial information, or payment information",
  "Advertising identifiers, analytics identifiers, or telemetry used to profile you",
];

const storedLocally = [
  "Filter rules such as keywords, channels, whitelist entries, profile settings, and content controls",
  "Preferences such as Shorts, comments, theme, profile, and interface settings",
  "Local counters or status information that help FilterTube display what it filtered",
  "Optional backup and export files written to your own device when you use backup or export features",
];

const permissions = [
  {
    title: "Storage permission",
    detail:
      "Used to save your rules and settings locally in browser storage. The current browser release keeps this data on your device rather than transmitting it to FilterTube-operated servers.",
  },
  {
    title: "ActiveTab permission",
    detail:
      "Used when you interact with FilterTube on the current tab so the product can apply or update filtering behavior for that active YouTube page.",
  },
  {
    title: "Scripting permission",
    detail:
      "Required to run FilterTube’s filtering scripts on supported YouTube surfaces. Those scripts are there to evaluate the page and hide matching elements according to your settings.",
  },
  {
    title: "Tabs permission",
    detail:
      "Used so FilterTube can respond to navigation changes on supported tabs and keep filtering behavior in sync as the page changes.",
  },
  {
    title: "Downloads permission",
    detail:
      "Used for local backup and export features. When those features are used, files are written to folders on your own device such as Downloads/FilterTube Backup/ and Downloads/FilterTube Export/.",
  },
  {
    title: "Host permissions",
    detail:
      "The current browser release is scoped to supported YouTube surfaces, including youtube.com, youtube-nocookie.com, and youtubekids.com, so it can read and modify those pages locally according to your rules.",
  },
];

const yourRights = [
  "Access: you can inspect your current rules and settings inside the FilterTube interface.",
  "Modify: you can add, edit, or remove rules at any time.",
  "Delete: removing FilterTube from the browser removes browser-stored FilterTube data, while any backup or export files you created remain on your device until you delete them.",
  "Export: you can keep portable copies of your configuration using FilterTube’s local export tools.",
];

const storeSummary = [
  { label: "Data collection", value: "None by FilterTube" },
  { label: "Data usage", value: "Local filtering and local settings only" },
  { label: "Data sharing", value: "No sale or transfer of personal data by FilterTube" },
  { label: "Data sale", value: "No" },
];

function PolicySection({ title, children }) {
  return (
    <section className="border-t border-[color:var(--color-line)] pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)] md:text-4xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-base leading-8 text-[var(--color-muted)]">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li className="flex gap-3" key={item}>
          <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <section className="px-4 pb-24 pt-32 md:px-6 md:pb-32 md:pt-40">
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <SectionHeading
            eyebrow="Privacy policy"
            title="Local-first means your rules stay with you."
            description="Last updated on March 17, 2026. This page covers the current FilterTube browser release and the public website."
          />
        </Reveal>

        <Reveal className="mt-10" delay={100}>
          <Panel innerClassName="space-y-6 p-7 md:p-10">
            <div className="space-y-4">
              <p className="text-[0.72rem] uppercase tracking-[0.26em] text-[var(--color-muted)]">
                TL;DR
              </p>
              <p className="max-w-[60ch] text-lg leading-8 text-[var(--color-ink)]">
                FilterTube is designed so filtering happens locally on your
                device. FilterTube does not collect, store, or transmit your
                personal browsing data to FilterTube-operated servers, and the
                website does not use analytics or advertising trackers.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {storeSummary.map((item) => (
                <div
                  className="ft-tile rounded-[1.5rem] border border-[color:var(--color-line)] p-5"
                  key={item.label}
                >
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-3 text-base leading-7 text-[var(--color-ink)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </Reveal>

        <Reveal className="mt-10" delay={140}>
          <Panel innerClassName="space-y-10 p-7 md:p-10">
            <PolicySection title="1. Introduction">
              <p>
                FilterTube (&quot;we&quot;, &quot;our&quot;, or
                &quot;the product&quot;) is built around local control. This
                Privacy Policy explains what information FilterTube handles,
                where that information stays, and how the current website and
                browser release behave today.
              </p>
              <p>
                The short version is simple: the current browser release is designed to work
                locally on your device, and the website is a public information
                surface rather than a data-collection product.
              </p>
            </PolicySection>

            <PolicySection title="2. Data collection">
              <p>
                FilterTube does not collect, store, or transmit personal data to
                FilterTube-operated servers in order to run its filtering
                features.
              </p>
              <p className="font-medium text-[var(--color-ink)]">
                2.1 What we do not collect
              </p>
              <BulletList items={notCollected} />
              <p className="pt-2 font-medium text-[var(--color-ink)]">
                2.2 What we store locally on your device
              </p>
              <BulletList items={storedLocally} />
              <p>
                Local settings are stored through browser-local storage used by
                FilterTube. Backup and export files, when created, are saved
                on your own device and are not uploaded to us.
              </p>
            </PolicySection>

            <PolicySection title="3. How FilterTube works">
              <p>
                You define rules such as keywords, channels, profiles, and
                content-type controls. FilterTube then reads supported page
                content locally and applies those rules before or as elements
                render on supported YouTube surfaces.
              </p>
              <p>
                Matching content is hidden locally in the browser. FilterTube
                does not need a FilterTube account, cloud profile, or personal
                telemetry pipeline to do that work.
              </p>
            </PolicySection>

            <PolicySection title="4. Permissions explained">
              <p>
                FilterTube requests a limited set of browser permissions so the
                current browser release can operate on supported YouTube pages
                and manage optional local backup flows.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {permissions.map((permission) => (
                  <div
                    className="ft-tile rounded-[1.5rem] border border-[color:var(--color-line)] p-5"
                    key={permission.title}
                  >
                    <h3 className="font-medium text-[var(--color-ink)]">
                      {permission.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      {permission.detail}
                    </p>
                  </div>
                ))}
              </div>
            </PolicySection>

            <PolicySection title="5. Website and third-party services">
              <p>
                The FilterTube website does not use analytics products,
                advertising trackers, session replay, or marketing pixels.
                There are no contact forms on the site that collect personal
                information directly into a FilterTube database.
              </p>
              <p>
                Like any hosted website, basic request handling may involve
                normal infrastructure logs from the hosting provider or CDN so
                pages can be delivered. FilterTube does not use the website as a
                profiling or ad-targeting system.
              </p>
              <p>
                FilterTube also does not send your settings or browsing data
                to FilterTube-operated analytics, advertising, or telemetry
                services. Network activity that occurs as part of normal YouTube
                page loading remains between your browser and the relevant
                YouTube surface.
              </p>
            </PolicySection>

            <PolicySection title="6. Data sharing and sale">
              <p>
                We do not sell, rent, or trade your personal data. We do not
                transfer FilterTube settings or browsing data to third parties
                because the current product does not collect that data for a
                FilterTube server in the first place.
              </p>
            </PolicySection>

            <PolicySection title="7. Children&apos;s privacy">
              <p>
                FilterTube is intended to help households and students create a
                calmer viewing environment, including on YouTube Kids-related
                surfaces. The current product does not knowingly collect
                personal data from children because it is not built around
                personal data collection at all.
              </p>
            </PolicySection>

            <PolicySection title="8. Data security">
              <p>
                Current rules and settings stay inside browser-local storage and
                on-device files that you explicitly create. That local-first
                model reduces the risk that comes with sending sensitive settings
                to external services.
              </p>
              <p>
                No system can promise perfect security in every environment, but
                FilterTube is intentionally designed to minimize exposure by not
                depending on user accounts, ad-tech scripts, or a personal data
                backend.
              </p>
            </PolicySection>

            <PolicySection title="9. Your rights and controls">
              <BulletList items={yourRights} />
            </PolicySection>

            <PolicySection title="10. Open source transparency">
              <p>
                FilterTube is open source. You can inspect the public repository
                to review how FilterTube currently works and how its
                local-first model is implemented.
              </p>
              <p>
                Repository:{" "}
                <a
                  className="text-[var(--color-accent)] underline decoration-[color:var(--color-line)] underline-offset-4 transition duration-300 hover:decoration-[var(--color-accent)]"
                  href="https://github.com/varshneydevansh/FilterTube"
                  rel="noreferrer"
                  target="_blank"
                >
                  github.com/varshneydevansh/FilterTube
                </a>
              </p>
            </PolicySection>

            <PolicySection title="11. Changes to this privacy policy">
              <p>
                We may update this page as the product evolves. If FilterTube
                ever changes in a way that materially affects data handling,
                this policy should be updated before that new behavior is relied
                on as the public description of the product.
              </p>
            </PolicySection>

            <PolicySection title="12. Privacy posture and policy standards">
              <p>
                FilterTube is built around data minimization, local processing,
                and user-controlled storage. That architecture is intended to
                align with the privacy expectations commonly reflected in
                browser-store policies and privacy frameworks such as
                GDPR and CCPA.
              </p>
              <p>
                This page describes the current product behavior and privacy
                posture. It is not legal advice.
              </p>
            </PolicySection>

            <PolicySection title="13. Contact">
              <p>
                If you have questions about this Privacy Policy or the current
                data-handling behavior of FilterTube, contact{" "}
                <a
                  className="text-[var(--color-accent)] underline decoration-[color:var(--color-line)] underline-offset-4 transition duration-300 hover:decoration-[var(--color-accent)]"
                  href="mailto:hello@filtertube.in"
                >
                  hello@filtertube.in
                </a>{" "}
                or open an issue in the{" "}
                <Link
                  className="text-[var(--color-accent)] underline decoration-[color:var(--color-line)] underline-offset-4 transition duration-300 hover:decoration-[var(--color-accent)]"
                  href="https://github.com/varshneydevansh/FilterTube"
                  rel="noreferrer"
                  target="_blank"
                >
                  public GitHub repository
                </Link>
                .
              </p>
            </PolicySection>

            <PolicySection title="Browser web store summary">
              <div className="grid gap-4 md:grid-cols-2">
                {storeSummary.map((item) => (
                  <div
                    className="rounded-[1.35rem] border border-[color:var(--color-line)] bg-[color:var(--color-glass)] p-5"
                    key={`store-${item.label}`}
                  >
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      {item.label}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <p>
                Certification: based on the current product architecture,
                FilterTube does not collect, use, sell, or transfer personal
                data to FilterTube-operated servers in order to run its
                filtering features.
              </p>
            </PolicySection>
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}
