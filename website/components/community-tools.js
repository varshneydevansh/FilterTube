import { ArrowUpRight, GithubLogo } from "@phosphor-icons/react/ssr";

import { Panel, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";

// The optional community services the apps can use (Settings, Integrations). Each one is off until
// it is turned on, and each line says exactly what that service receives, as the app's own toggle does.
// Logos are the projects' own files from their repositories, stored small under public/community:
// SponsorBlock (GPL-3.0 repository, logo by @munadikieh), DeArrow (GPL-3.0; logo based on Twemoji,
// CC-BY 4.0) and RYD (GPL-3.0). LRCLIB's repository has no logo file, so it gets a monogram.
const tools = [
  {
    name: "SponsorBlock",
    href: "https://github.com/ajayyy/SponsorBlock",
    logo: "/community/sponsorblock.webp",
    does: "Skips sponsor segments and intros using timestamps other viewers marked. Rewind any time to watch a skipped part.",
    sends: "The video you are watching, while it plays.",
  },
  {
    name: "DeArrow",
    href: "https://github.com/ajayyy/DeArrow",
    logo: "/community/dearrow.webp",
    does: "Shows clearer community titles and thumbnails instead of clickbait. Long-press a title to see the original.",
    sends: "The videos on screen. Your filters still check the original title.",
  },
  {
    name: "RYD",
    href: "https://github.com/Anarios/return-youtube-dislike",
    logo: "/community/ryd.svg",
    does: "Shows an estimated dislike count on the Watch page, from an open community service. Your own reactions stay separate.",
    sends: "The video you are watching.",
  },
  {
    name: "LRCLIB",
    href: "https://github.com/tranxuanthang/lrclib",
    monogram: "LR",
    does: "Fills in time-synced lyrics in Sangeet when a song has none of its own.",
    sends: "Only the song's title and artist.",
  },
];

function ToolMark({ tool }) {
  if (tool.logo) {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--color-line)] bg-white p-2">
        <img alt="" className="h-full w-full object-contain" decoding="async" height={48} loading="lazy" src={tool.logo} width={48} />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--color-line)] bg-[rgba(171,68,56,0.08)] font-mono text-sm font-bold tracking-[0.04em] text-[var(--color-accent)]">
      {tool.monogram}
    </span>
  );
}

// aKriti is planned, not shipped: today only Study search uses a small curated list of related words
// (docs/app/ai/LOCAL_SUGGESTIONS.md, StudySuggestions.kt). Keep this card's wording in that tense.
function LocalAiNote() {
  return (
    <Reveal delay={160}>
      <Panel className="mt-5" innerClassName="p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <div>
            <h3 className="font-display text-3xl tracking-[-0.045em] text-[var(--color-ink)]">
              Coming: local AI, called aKriti
            </h3>
            <p className="mt-3 max-w-[48ch] text-base leading-7 text-[var(--color-muted)]">
              A small model that will run on your phone or computer, never on a server. What you type
              stays on your device.
            </p>
          </div>
          <div>
            <ul className="space-y-4 text-base leading-7 text-[var(--color-muted)]">
              <li className="flex gap-3">
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                <span>
                  <span className="font-semibold text-[var(--color-ink)]">Filter words from a sentence. </span>
                  Type &ldquo;no horror&rdquo; and it suggests related words and phrases to review.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                <span>
                  <span className="font-semibold text-[var(--color-ink)]">Similar channels. </span>
                  Find channels like the ones you blocked or allowed, so you can filter them too.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                <span>
                  <span className="font-semibold text-[var(--color-ink)]">You decide. </span>
                  Every suggestion is shown to you first. Nothing is added until you accept it, and in a
                  Kids profile only a parent can accept.
                </span>
              </li>
            </ul>
            <p className="mt-5 border-t border-[color:var(--color-line)] pt-4 text-sm leading-6 text-[var(--color-muted)]">
              Today: Study search uses a small hand-picked list of related words. The aKriti model is
              not in the apps yet.
            </p>
          </div>
        </div>
      </Panel>
    </Reveal>
  );
}

export function CommunityTools() {
  return (
    <section id="community-tools" className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <SectionHeading
            title="Works with the open tools you already use."
            description="The apps can connect to four open community services. All four are off until you turn them on in Settings, Integrations."
          />
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {tools.map((tool, index) => (
            <Reveal className="h-full" delay={index * 80} key={tool.name}>
              <Panel className="h-full" innerClassName="flex h-full flex-col p-6 md:p-7">
                <div className="flex items-start gap-4">
                  <ToolMark tool={tool} />
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl tracking-[-0.04em] text-[var(--color-ink)]">{tool.name}</h3>
                    <p className="mt-3 max-w-[56ch] text-base leading-7 text-[var(--color-muted)]">{tool.does}</p>
                    <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
                      <span className="font-semibold text-[var(--color-ink)]">What it receives: </span>
                      {tool.sends}
                    </p>
                  </div>
                </div>
                <a
                  className="mt-auto inline-flex min-h-11 items-center gap-2 self-start pt-5 text-sm font-semibold text-[var(--color-ink)] underline-offset-4 hover:text-[var(--color-accent)] hover:underline"
                  href={tool.href}
                  rel="noopener"
                  target="_blank"
                >
                  <GithubLogo aria-hidden="true" size={16} weight="fill" />
                  {tool.name} on GitHub
                  <ArrowUpRight aria-hidden="true" size={14} weight="light" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Panel>
            </Reveal>
          ))}
        </div>
        <LocalAiNote />
      </div>
    </section>
  );
}
