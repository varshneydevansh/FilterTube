import { Panel, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";
import { devices } from "@/data/screenshots";
import { studyFacts } from "@/data/site-facts";

export const metadata = {
  title: "Study mode: study with only the channels you chose",
  description:
    "FilterTube Study mode plans study rounds and breaks and shows only your plan's channels during each round. A calendar-style timetable, and 415 packs for exams, school classes, degrees and interviews in 81 countries.",
  alternates: {
    canonical: "https://filtertube.in/study",
    types: { "text/markdown": "https://filtertube.in/study.md" },
  },
  openGraph: { title: "FilterTube Study mode", url: "https://filtertube.in/study" },
};

// Real Pixel captures from data/screenshots.js, looked up by file name.
const screenFor = (file) =>
  [...(devices.androidPhone?.extras ?? []), ...Object.values(devices.androidPhone?.captures ?? {})].find((screen) =>
    screen?.src?.endsWith(`/${file}.webp`),
  );

export default function StudyPage() {
  return (
    <section className="px-4 pb-24 pt-32 md:px-6 md:pb-32 md:pt-40">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <SectionHeading title="Study with only the channels you chose." description={studyFacts.intro} />
        </Reveal>

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {studyFacts.steps.map((step, index) => {
            const screen = screenFor(step.screen);
            return (
              <li key={step.title}>
                <Panel className="h-full" innerClassName="flex h-full flex-col p-5 md:p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] font-mono text-sm font-bold text-[#fff8f1]">
                    {index + 1}
                  </span>
                  <h2 className="mt-5 font-display text-2xl tracking-[-0.045em] text-[var(--color-ink)]">{step.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{step.body}</p>
                  {screen ? (
                    <img
                      alt={screen.alt}
                      className="mx-auto mt-6 max-h-[26rem] w-auto rounded-[1.2rem] border border-[color:var(--color-line)]"
                      decoding="async"
                      height={screen.height}
                      loading="lazy"
                      src={screen.src}
                      width={screen.width}
                    />
                  ) : null}
                </Panel>
              </li>
            );
          })}
        </ol>

        <div className="mt-16 grid gap-5 md:grid-cols-2">
          <Panel innerClassName="p-6 md:p-8">
            <h2 className="font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">Also in Study</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--color-muted)]">
              {studyFacts.extras.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Panel>
          <Panel innerClassName="p-6 md:p-8">
            <h2 className="font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">Timetable, widget and calendar</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--color-muted)]">
              {studyFacts.timetable.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </section>
  );
}
