import { LockSimple } from "@phosphor-icons/react/ssr";

import { Mascot } from "@/components/mascot";
import { MascotSprite } from "@/components/mascot-sprite";
import { Reveal } from "@/components/reveal";
import { RuleDemo } from "@/components/rule-demo";
import { StudyLoopVideo } from "@/components/study-loop-video";
import { devices } from "@/data/screenshots";

const studyPlan = [
  { kind: "round", label: "Round 1", minutes: 50 },
  { kind: "break", label: "Break", minutes: 10 },
  { kind: "round", label: "Round 2", minutes: 50 },
  { kind: "break", label: "Break", minutes: 10 },
  { kind: "round", label: "Round 3", minutes: 50 },
];

// Real Pixel captures from data/screenshots.js, looked up by file so new captures flow in.
const pixel = (file) => devices.androidPhone?.extras?.find((screen) => screen.src.endsWith(`/${file}.webp`));

const studyMoments = [
  {
    screen: pixel("phone-study-session"),
    title: "Rounds you planned",
    body: "Set when study starts and ends, how long each round is and how long each break is. The ring shows what’s left of the round.",
  },
  {
    screen: pixel("phone-watch-study"),
    title: "Only your plan’s channels",
    body: "During a round, Home, search and Up next come only from the channels and topics in your plan. Comments stay off while you study.",
  },
  {
    screen: pixel("phone-study-break"),
    title: "Breaks are real breaks",
    body: "Stand up, drink some water, look at something far away. On a roll? Skip break adds the time to the next round.",
  },
  {
    screen: pixel("phone-study-done"),
    title: "Then, “That counts”",
    body: "When the day’s rounds are done, every one is listed and the minutes add up to your week.",
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
      <div className="mx-auto max-w-[1400px]" id="study-mode">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <Reveal>
            <p className="text-[0.72rem] uppercase tracking-[0.26em] text-[var(--color-muted)]">Study mode</p>
            <h2 className="mt-5 max-w-[15ch] text-balance font-display text-4xl font-semibold tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl md:leading-[0.98]" id="how-it-works-title">
              Study with only the channels you chose.
            </h2>
            <p className="mt-5 max-w-[56ch] text-pretty text-base leading-8 text-[var(--color-muted)] md:text-lg">
              Pick what you’re studying, plan your rounds and breaks, and FilterTube keeps to the plan.
              Study mode is a Whitelist with a timer: while a round runs, only what’s in your plan shows up.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">Pick a pack</p>
                <ul aria-label="Example study packs" className="mt-2 flex flex-wrap gap-2">
                  {["SAT", "UBE", "GATE", "School biology"].map((pack) => (
                    <li className="ft-name-chip" key={pack}>{pack}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">Switch off any channel in a pack before you start.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">Plan the day</p>
                <div aria-label="Example plan: three 50-minute rounds with 10-minute breaks" className="ft-plan-bar mt-3" role="img">
                  {studyPlan.map((part, index) => (
                    <span data-kind={part.kind} key={index} style={{ flexGrow: part.minutes }} title={`${part.label}, ${part.minutes} min`} />
                  ))}
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">Three 50-minute rounds, 10-minute breaks.</p>
              </div>
            </div>
            <p className="ft-rule-lock mt-7">
              <LockSimple aria-hidden="true" size={16} weight="bold" />
              In a round, rules can only get stricter, never looser. Your Blocklist still applies.
            </p>
          </Reveal>
          <Reveal>
            <StudyLoopVideo />
          </Reveal>
        </div>

        <ol aria-label="A study session, start to finish" className="ft-study-moments mt-14">
          {studyMoments.map((moment, index) => (
            <li className="ft-study-moment" key={moment.title}>
              <span className="ft-study-moment-shot">
                {moment.screen ? (
                  <img alt={moment.screen.alt} decoding="async" height={moment.screen.height} loading="lazy" src={moment.screen.src} width={moment.screen.width} />
                ) : null}
              </span>
              <h3 className="mt-5 flex items-center gap-2 font-display text-xl tracking-[-0.035em] text-[var(--color-ink)] md:text-2xl">
                <span aria-hidden="true" className="ft-step-dot">{index + 1}</span>
                {moment.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{moment.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-24 grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]" id="whitelist">
          <Reveal>
            <p className="text-[0.72rem] uppercase tracking-[0.26em] text-[var(--color-muted)]">Blocklist or Whitelist</p>
            <h2 className="mt-5 max-w-[17ch] text-balance font-display text-4xl font-semibold tracking-[-0.06em] text-[var(--color-ink)] md:text-5xl md:leading-[1]">
              Name what to keep out, or choose what to let in.
            </h2>
            <p className="mt-5 max-w-[60ch] text-pretty text-base leading-8 text-[var(--color-muted)] md:text-lg">
              Each profile runs in one of two modes, the same pill you see at the top of the app.
              Main and Kids keep their own mode and their own rules.
            </p>
            <dl className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="ft-mode-card">
                <dt className="font-display text-2xl tracking-[-0.04em] text-[var(--color-ink)]">Blocklist</dt>
                <dd className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Everything shows, except what you name: a word, a channel, Shorts, comments or a category.
                  Good for most people, most days.
                </dd>
              </div>
              <div className="ft-mode-card" data-mode="whitelist">
                <dt className="font-display text-2xl tracking-[-0.04em] text-[var(--color-ink)]">Whitelist</dt>
                <dd className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Only what you allow shows up. Choose channels and topics you trust, and FilterTube builds
                  your feed from them. Stricter, and good for kids and study.
                </dd>
              </div>
            </dl>
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
          <div className="ft-shell mt-10 rounded-[2rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)]">
            <div className="ft-inset rounded-[calc(2rem-0.5rem)] bg-[var(--color-surface)] p-5 md:p-8">
              <h3 className="font-display text-2xl tracking-[-0.04em] text-[var(--color-ink)] md:text-3xl">Try both on the same feed</h3>
              <p className="mt-2 max-w-[60ch] text-sm leading-7 text-[var(--color-muted)]">
                Switch modes to see what happens to the same six videos.
              </p>
              <div className="mt-6">
                <RuleDemo />
              </div>
            </div>
          </div>
        </Reveal>

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
