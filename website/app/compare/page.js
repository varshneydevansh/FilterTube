import { Panel, SectionHeading } from "@/components/marketing-ui";
import { Reveal } from "@/components/reveal";
import {
  comparisonIntro,
  comparisons,
  featureMatrix,
  filterTubeRow,
  matrixHeadline,
  matrixNote,
  matrixTools,
} from "@/data/site-facts";

export const metadata = {
  title: "Compare YouTube blockers: FilterTube, BlockTube, Unhook, uBlock Origin and more",
  description:
    "Compare YouTube blockers: FilterTube vs BlockTube, Unhook, TubeBlock and the YouTube Kids app, and how it fits beside ad blockers such as uBlock Origin, AdGuard and Brave.",
  alternates: {
    canonical: "https://filtertube.in/compare",
    types: { "text/markdown": "https://filtertube.in/compare.md" },
  },
  openGraph: { title: "How FilterTube compares", url: "https://filtertube.in/compare" },
};

const columns = [
  ["madeFor", "Made for"],
  ["runsOn", "Runs on"],
  ["price", "Price"],
];

export default function ComparePage() {
  const rows = [filterTubeRow, ...comparisons];
  return (
    <section className="px-4 pb-24 pt-32 md:px-6 md:pb-32 md:pt-40">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <SectionHeading as="h1" title="Pick the right YouTube blocker, or use two" description={comparisonIntro} />
        </Reveal>

        <Reveal className="mt-10" delay={80}>
          <h2 className="max-w-[40ch] text-balance font-display text-2xl font-semibold tracking-[-0.045em] text-[var(--color-ink)] md:text-3xl">
            {matrixHeadline}
          </h2>
          <Panel className="mt-6" innerClassName="p-2 md:p-4">
            <div className="overflow-x-auto" role="region" aria-label="Feature-by-feature comparison" tabIndex={0}>
              <table className="w-full min-w-[56rem] border-collapse text-left text-sm leading-6">
                <caption className="sr-only">Feature by feature: FilterTube, BlockTube, Unhook, TubeBlock and the YouTube Kids app</caption>
                <thead>
                  <tr className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    <th className="px-4 py-3 font-medium" scope="col">Feature</th>
                    {matrixTools.map((tool, index) => (
                      <th className={`px-4 py-3 font-medium ${index === 0 ? "text-[var(--color-ink)]" : ""}`} key={tool} scope="col">{tool}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureMatrix.map((row) => (
                    <tr className="border-t border-[color:var(--color-line)] align-top" key={row.feature}>
                      <th className="px-4 py-3 font-semibold text-[var(--color-ink)]" scope="row">{row.feature}</th>
                      {row.cells.map((value, index) => (
                        <td
                          className={`px-4 py-3 ${index === 0 ? "bg-[color:var(--color-soft-panel)] font-medium text-[var(--color-ink)]" : value === "Not documented" ? "text-[var(--color-muted)] opacity-70" : "text-[var(--color-muted)]"}`}
                          key={matrixTools[index]}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <p className="mt-4 max-w-[70ch] text-sm leading-7 text-[var(--color-muted)]">{matrixNote}</p>
        </Reveal>

        <Reveal className="mt-16" delay={80}>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] md:text-4xl">
            What each tool is for
          </h2>
          <Panel className="mt-6" innerClassName="p-2 md:p-4">
            {/* Scrolls sideways on phones instead of squeezing the columns. */}
            <div className="overflow-x-auto" role="region" aria-label="Comparison table" tabIndex={0}>
              <table className="w-full min-w-[44rem] border-collapse text-left text-sm leading-6">
                <caption className="sr-only">What each tool is made for, where it runs and what it costs</caption>
                <thead>
                  <tr className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    <th className="px-4 py-3 font-medium" scope="col">Tool</th>
                    {columns.map(([key, label]) => (
                      <th className="px-4 py-3 font-medium" key={key} scope="col">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      className={`border-t border-[color:var(--color-line)] align-top ${index === 0 ? "bg-[color:var(--color-soft-panel)]" : ""}`}
                      key={row.name}
                    >
                      <th className="px-4 py-4 font-semibold text-[var(--color-ink)]" scope="row">{row.name}</th>
                      {columns.map(([key]) => (
                        <td className="px-4 py-4 text-[var(--color-muted)]" key={key}>{row[key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-2">
          {comparisons.map((tool) => (
            <Panel className="h-full" innerClassName="flex h-full flex-col p-6 md:p-7" key={tool.name}>
              <h2 className="font-display text-3xl tracking-[-0.05em] text-[var(--color-ink)]">{tool.name}</h2>
              <dl className="mt-4 space-y-4 text-sm leading-7">
                <div>
                  <dt className="font-semibold text-[var(--color-ink)]">What it&apos;s good at</dt>
                  <dd className="text-[var(--color-muted)]">{tool.goodAt}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-ink)]">What FilterTube adds</dt>
                  <dd className="text-[var(--color-muted)]">{tool.adds}</dd>
                </div>
              </dl>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  );
}
