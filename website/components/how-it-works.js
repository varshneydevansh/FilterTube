import { LockSimple } from "@phosphor-icons/react/ssr";

import { Mascot } from "@/components/mascot";
import { MascotSprite } from "@/components/mascot-sprite";
import { Reveal } from "@/components/reveal";
import { RuleDemo } from "@/components/rule-demo";

const studyPlan = [
  { kind: "round", label: "Round 1", minutes: 50 },
  { kind: "break", label: "Break", minutes: 10 },
  { kind: "round", label: "Round 2", minutes: 50 },
  { kind: "break", label: "Break", minutes: 10 },
  { kind: "round", label: "Round 3", minutes: 50 },
];

const studySteps = [
  {
    pose: "kritiRead",
    title: "Pick what you’re studying",
    body: "Choose an exam or a class. Packs cover exams like SAT, UBE and GATE, and school subjects too. You can switch off any channel in a pack before you start.",
    extra: (
      <ul aria-label="Example study packs" className="mt-4 flex flex-wrap gap-2">
        {["SAT", "UBE", "GATE", "School biology"].map((pack) => (
          <li className="ft-name-chip" key={pack}>{pack}</li>
        ))}
      </ul>
    ),
  },
  {
    pose: "kritiPoint",
    title: "Plan your study day",
    body: "Set when study starts and ends, how long each round lasts and how long each break is. Drag the plan to adjust it.",
    extra: (
      <div aria-label="Example plan: three 50-minute rounds with 10-minute breaks" className="ft-plan-bar mt-4" role="img">
        {studyPlan.map((part, index) => (
          <span data-kind={part.kind} key={index} style={{ flexGrow: part.minutes }} title={`${part.label}, ${part.minutes} min`} />
        ))}
      </div>
    ),
    note: "Example: three 50-minute rounds with 10-minute breaks.",
  },
  {
    pose: "kritiShh",
    title: "Your feed turns into lessons",
    body: "During a round, Home, search and Up next come only from your plan’s channels and topics. Your block list still applies. Kriti stays on the page with you, and Uljhan naps until you’re done.",
    extra: (
      <p className="ft-rule-lock mt-4">
        <LockSimple aria-hidden="true" size={16} weight="bold" />
        In a round, rules can only get stricter, never looser.
      </p>
    ),
    companion: "uljhanAsleep",
  },
  {
    pose: "kritiProud",
    title: "Breaks, then “That counts”",
    body: "When a round ends, take your break and rest your eyes, or choose Skip break if you’re on a roll. Finish the day’s rounds and the end seal says it plainly.",
    extra: (
      <p className="ft-seal mt-5">
        <span>That counts</span>
      </p>
    ),
  },
];

const keptOut = [
  { pose: "uljhanPeek", title: "What sneaks in", body: "Videos from channels you never chose, peeking onto Home." },
  { pose: "uljhanShrug", title: "What you didn’t ask for", body: "Clickbait words and topics you’d rather not see today." },
  { pose: "uljhanTangled", title: "What pulls you in", body: "Endless Shorts and comment threads that tangle up an evening." },
  { pose: "uljhanAsleep", title: "Then it rests", body: "Once you name it, it stays out of every page, quietly." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-title" className="px-4 py-20 md:px-6 md:py-28" id="how-it-works">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Reveal>
            <p className="text-[0.72rem] uppercase tracking-[0.26em] text-[var(--color-muted)]">How it works</p>
            <h2 className="mt-5 max-w-[16ch] text-balance font-display text-4xl font-semibold tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl md:leading-[0.98]" id="how-it-works-title">
              Name what to keep out, or choose what to let in.
            </h2>
            <p className="mt-5 max-w-[60ch] text-pretty text-base leading-8 text-[var(--color-muted)] md:text-lg">
              Every FilterTube rule is one of two kinds: a block list or an allow list.
              Study mode is an allow list with a timer, made for exam prep.
            </p>
          </Reveal>
          <Reveal>
            <figure className="ft-paper ft-paper-ruled mx-auto w-full max-w-[26rem] rounded-[2rem] px-6 pb-5 pt-6">
              <MascotSprite className="mx-auto w-[min(15rem,70%)]" motion="sieve" />
              <figcaption className="mt-3 text-center font-editorial text-xl leading-snug text-[#5d4a40]">
                Kriti holds the funnel. Uljhan hops through and out of your feed, no hard feelings.
              </figcaption>
            </figure>
          </Reveal>
        </div>

        <Reveal>
          <div className="ft-shell mt-14 rounded-[2rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)]">
            <div className="ft-inset rounded-[calc(2rem-0.5rem)] bg-[var(--color-surface)] p-5 md:p-8">
              <h3 className="font-display text-2xl tracking-[-0.04em] text-[var(--color-ink)] md:text-3xl">Two kinds of rules</h3>
              <p className="mt-2 max-w-[60ch] text-sm leading-7 text-[var(--color-muted)]">
                Switch between them to see what happens to the same six videos.
              </p>
              <div className="mt-6">
                <RuleDemo />
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-20" id="study-mode">
          <Reveal>
            <h3 className="max-w-[20ch] text-balance font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] md:text-5xl">
              Study mode, for students and exam prep
            </h3>
            <p className="mt-4 max-w-[62ch] text-base leading-8 text-[var(--color-muted)]">
              A time-boxed allow list. You decide the plan once; FilterTube keeps to it, round by round.
            </p>
          </Reveal>
          <ol className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {studySteps.map((step, index) => (
              <li className="ft-study-step flex flex-col rounded-[1.75rem] border border-[color:var(--color-line)] bg-[var(--color-surface)] p-2" key={step.title}>
                <div className="ft-paper ft-paper-ruled relative flex h-44 items-end justify-center rounded-[1.35rem] pb-3">
                  <span aria-hidden="true" className="ft-step-number">{index + 1}</span>
                  <Mascot className="h-36 w-auto" pose={step.pose} />
                  {step.companion ? <Mascot className="absolute bottom-3 right-4 h-14 w-auto" pose={step.companion} /> : null}
                </div>
                <div className="flex flex-1 flex-col px-4 pb-5 pt-5">
                  <h4 className="font-display text-2xl tracking-[-0.04em] text-[var(--color-ink)]">
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h4>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{step.body}</p>
                  {step.extra}
                  {step.note ? <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">{step.note}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
          <div>
            <Reveal>
              <h3 className="font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] md:text-4xl">What we keep out</h3>
              <p className="mt-3 max-w-[56ch] text-base leading-8 text-[var(--color-muted)]">
                Uljhan is the clutter we’d rather not see. Not bad, just not what you want in your feed right now.
              </p>
            </Reveal>
            <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {keptOut.map((item) => (
                <li className="flex flex-col" key={item.title}>
                  <div className="ft-paper flex h-32 items-end justify-center rounded-[1.25rem] pb-2">
                    <Mascot className="h-24 w-auto" pose={item.pose} />
                  </div>
                  <p className="mt-3 font-display text-lg tracking-[-0.03em] text-[var(--color-ink)]">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
          <Reveal>
            <figure className="ft-paper flex h-full flex-col justify-between rounded-[1.75rem] p-6">
              <div>
                <p className="font-display text-2xl tracking-[-0.04em] text-[#1d1b18]">Time saved adds up</p>
                <p className="mt-2 text-sm leading-7 text-[#4f4b45]">
                  FilterTube estimates the time you didn’t spend on what you kept out. At each milestone,
                  Kriti gives Uljhan a medal for staying out of the way.
                </p>
              </div>
              <MascotSprite className="mx-auto mt-4 w-[min(14rem,80%)]" loops={1} motion="medal" />
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
