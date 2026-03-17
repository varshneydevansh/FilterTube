import { Panel, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";

export const metadata = {
  title: "Terms of use",
  description:
    "FilterTube terms of use for the website, current browser release, public code, and related product surfaces.",
};

const sections = [
  {
    title: "Using the website",
    body: [
      "The FilterTube website exists to explain the product, link to downloads, and publish public information such as privacy details and documentation.",
      "Do not use the site or linked assets in a way that harms the service, impersonates the project, or interferes with other users.",
    ],
  },
  {
    title: "Open-source code and releases",
    body: [
      "FilterTube is distributed under the MIT License where stated in the repository. The source code remains the primary reference for permitted reuse and redistribution.",
      "Release links, browser store listings, and public documentation may change as the project evolves.",
    ],
  },
  {
    title: "No affiliation with YouTube or Google",
    body: [
      "FilterTube is an independent project. It is not endorsed by, sponsored by, or affiliated with YouTube or Google.",
      "Any references to YouTube describe compatibility and product context only.",
    ],
  },
  {
    title: "Availability and roadmap",
    body: [
      "Current and upcoming surfaces, including mobile, iPad, and TV plans, are presented as product direction rather than a binding delivery promise.",
      "App-store or platform approvals may affect release timing and feature scope.",
    ],
  },
  {
    title: "Warranty and liability",
    body: [
      "FilterTube is provided as-is, without warranties of merchantability, fitness for a particular purpose, or uninterrupted availability.",
      "You remain responsible for how you configure filtering rules and for verifying that the product meets your own household, educational, or workplace needs.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Questions about these terms can be sent to hello@filtertube.in or raised through the public GitHub repository.",
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="px-4 pb-24 pt-32 md:px-6 md:pb-32 md:pt-40">
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <SectionHeading
            eyebrow="Terms of use"
            title="Clear terms, written in plain language."
            description="Last updated on March 16, 2026. These terms cover the FilterTube website, current browser release, public code, and related downloads."
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
