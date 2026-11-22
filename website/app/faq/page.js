import { Panel, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";
import { faqGroups, oneLiner } from "@/data/site-facts";
import { JsonLd, faqPageJsonLd } from "@/lib/structured-data";

export const metadata = {
  title: "FAQ: YouTube ad blocker and content blocker",
  description:
    "Answers about FilterTube: block YouTube ads, keywords, channels and Shorts on iPhone, Android, TV and in Chrome, Firefox, Edge and Opera, allow only trusted channels, Kids profiles, Study mode and privacy.",
  alternates: {
    canonical: "https://filtertube.in/faq",
    types: { "text/markdown": "https://filtertube.in/faq.md" },
  },
  openGraph: { title: "FilterTube FAQ", url: "https://filtertube.in/faq" },
};

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function AnswerLinks({ links }) {
  if (!links?.length) return null;
  return (
    <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
      {links.map((link) => (
        <a className="text-[var(--color-accent)] underline underline-offset-4" href={link.href} key={link.href}>
          {link.label}
        </a>
      ))}
    </p>
  );
}

export default function FaqPage() {
  return (
    <section className="px-4 pb-24 pt-32 md:px-6 md:pb-32 md:pt-40">
      <JsonLd data={faqPageJsonLd()} />
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <SectionHeading title="Questions, answered" description={oneLiner} />
        </Reveal>
        <nav aria-label="FAQ topics" className="mt-8 flex flex-wrap gap-2">
          {faqGroups.map((group) => (
            <a
              className="ft-tile inline-flex min-h-11 items-center rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] underline-offset-4 hover:underline"
              href={`#${slug(group.title)}`}
              key={group.title}
            >
              {group.title}
            </a>
          ))}
        </nav>
        {faqGroups.map((group) => (
          <section aria-labelledby={slug(group.title)} className="mt-16" key={group.title}>
            <h2
              className="scroll-mt-28 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] md:text-4xl"
              id={slug(group.title)}
            >
              {group.title}
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {group.items.map((item) => (
                <Panel className="h-full" innerClassName="flex h-full flex-col p-6 md:p-7" key={item.q}>
                  <h3 className="text-balance font-display text-2xl tracking-[-0.045em] text-[var(--color-ink)]">
                    {item.q}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{item.a}</p>
                  <AnswerLinks links={item.links} />
                </Panel>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
