import { ArrowsClockwise, FastForward, MusicNotes, ThumbsDown } from "@phosphor-icons/react/ssr";

import { Panel, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";

// The optional community services the apps can use (Settings, Integrations). Each one is off until
// it is turned on, and each line says exactly what that service receives, as the app's own toggle does.
const tools = [
  {
    name: "SponsorBlock",
    icon: FastForward,
    does: "Skips sponsor segments and intros using timestamps other viewers marked. Rewind any time to watch a skipped part.",
    sends: "The video you are watching, while it plays.",
  },
  {
    name: "DeArrow",
    icon: ArrowsClockwise,
    does: "Shows clearer community titles and thumbnails instead of clickbait. Long-press a title to see the original.",
    sends: "The videos on screen. Your filters still check the original title.",
  },
  {
    name: "RYD",
    icon: ThumbsDown,
    does: "Shows an estimated dislike count on the Watch page, from an open community service. Your own reactions stay separate.",
    sends: "The video you are watching.",
  },
  {
    name: "LRCLIB",
    icon: MusicNotes,
    does: "Fills in time-synced lyrics in Sangeet when a song has none of its own.",
    sends: "Only the song's title and artist.",
  },
];

export function CommunityTools() {
  return (
    <section id="community-tools" className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <SectionHeading
            eyebrow="Community tools"
            title="Works with the open tools you already use."
            description="The apps can connect to four open community services. All four are off until you turn them on in Settings, Integrations."
          />
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {tools.map((tool, index) => (
            <Reveal delay={index * 80} key={tool.name}>
              <Panel innerClassName="h-full p-6 md:p-7">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-[rgba(171,68,56,0.08)] p-3 text-[var(--color-accent)]">
                    <tool.icon aria-hidden="true" size={24} weight="light" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl tracking-[-0.04em] text-[var(--color-ink)]">{tool.name}</h3>
                    <p className="mt-3 max-w-[56ch] text-base leading-7 text-[var(--color-muted)]">{tool.does}</p>
                    <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
                      <span className="font-semibold text-[var(--color-ink)]">What it receives: </span>
                      {tool.sends}
                    </p>
                  </div>
                </div>
              </Panel>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
